// /api/modes/knowledge + /api/knowledge-sections: a mode's knowledge base (modes/<folder>/knowledge/*.txt|md).
//   GET    /api/modes/knowledge?mode=X           → { files, content, fileCount, outline } (a FAILED read is a 500, never "no files")
//   POST   /api/modes/knowledge?mode=X           body { filename, content, replace? } → { ok, filename } | 409 { exists, filename }
//   DELETE /api/modes/knowledge?mode=X&file=Y[&disabled=0|1] → { ok }
//   PATCH  /api/modes/knowledge?mode=X&file=Y[&disabled=0|1] → { ok, disabled }
//   GET    /api/knowledge-sections?mode=X&sections=1,4&cap=60000 → { content, titles }
// Huge knowledge bases (whole books) can't be prompt-stuffed, so an OUTLINE (headings, or a toc.txt's lines) is served
// with the files and sections are sliced on demand (src/server/knowledgeOutline.js). Outline indices match between the two.
// Pure of the dev server: the caller passes the data-folder helpers, so tests run it on a temp folder.
import { TOC_NAME_RE, extractOutline, sliceSections } from './knowledgeOutline.js'

// The stored name of an uploaded knowledge file. Characters no file system takes are dropped, control characters too
// (a newline made a file Windows lists but cannot open). A Windows DEVICE name before the first dot ("con.txt",
// "nul.md", "com1.txt", superscript digits too) is no file on Windows 10 and older: the write went to the device,
// answered "saved", and the upload was gone (on a share, for every computer). It is stored as "con_.txt" instead,
// on every system, so computers sharing a folder agree on the name.
const WIN_DEVICE_STEM = /^(con|prn|aux|nul|conin\$|conout\$|com[1-9¹²³]|lpt[1-9¹²³])(?=\s*(\.|$))/i
export function knowledgeFileName(name) {
  return String(name || 'file.txt').replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, '').replace(WIN_DEVICE_STEM, '$1_')
}

export function createKnowledgeRoutes({ dataPath, modeFolderForName, readUtf8, writeFileAtomic, fs, path }) {
  const readKnowledgeFiles = (knowledgeDir) => {
    if (!fs.existsSync(knowledgeDir)) return []
    return fs.readdirSync(knowledgeDir)
      .filter((f) => f.match(/\.(txt|md)$/i))
      // A file listed but already gone (another computer removed it; SMB lists it ~10s longer) is skipped:
      // thrown, the whole knowledge GET answered 500 and sections came back empty.
      .map((f) => { try { return { name: f, text: readUtf8(path.join(knowledgeDir, f)) } } catch (e) { if (e && e.code === 'ENOENT') return null; throw e } })
      .filter(Boolean)
  }

  // GET /api/knowledge-sections: slice the requested outline sections out of the mode's knowledge files. Indices match
  // the `outline` array returned by GET /api/modes/knowledge (recomputed here from the same files).
  const sections = (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    try {
      const url = new URL(req.url, 'http://x')
      const modeName = modeFolderForName(dataPath('modes'), url.searchParams.get('mode') || '')
      if (!modeName) { res.end(JSON.stringify({ content: '', titles: [] })); return }
      const ids = (url.searchParams.get('sections') || '').split(',').map((s) => parseInt(s, 10)).filter((n) => Number.isInteger(n) && n >= 0).slice(0, 8)
      // Bounded both ways: a negative cap sliced characters off the END (slice(0, -n)).
      const cap = Math.max(1000, Math.min(200000, parseInt(url.searchParams.get('cap'), 10) || 60000))
      const all = readKnowledgeFiles(dataPath('modes', modeName, 'knowledge'))
      const outline = extractOutline(all)
      const content = sliceSections(all.filter((f) => !TOC_NAME_RE.test(f.name)), outline, ids, cap)
      res.end(JSON.stringify({ content, titles: ids.map((i) => outline[i]?.title).filter(Boolean) }))
    } catch (e) {
      // A read that FAILED is not "nothing in these sections": a 500, with the same body shape (the client's fallback
      // to the outline is unchanged).
      res.statusCode = 500
      res.end(JSON.stringify({ content: '', titles: [], error: e.message }))
    }
  }

  const knowledge = (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    const url = new URL(req.url, 'http://x')
    const modeName = url.searchParams.get('mode') || ''
    const sanitized = modeFolderForName(dataPath('modes'), modeName)
    const knowledgeDir = dataPath('modes', sanitized, 'knowledge')

    if (!sanitized) { res.end(JSON.stringify({ files: [], content: null, fileCount: 0 })); return }

    if (req.method === 'GET') {
      try {
        if (!fs.existsSync(knowledgeDir)) { res.end(JSON.stringify({ files: [], content: null, fileCount: 0 })); return }
        const allFiles = fs.readdirSync(knowledgeDir)
        // A file listed but already gone (another computer deleted or toggled it; the SMB directory cache
        // lists it ~10s longer) is skipped, never the whole answer: one ENOENT used to report "no files" and
        // ran every AI call without the knowledge base.
        const gone = (e) => e && e.code === 'ENOENT'
        const files = allFiles.filter(f => f.match(/\.(txt|md)(\.disabled)?$/i)).map(f => {
          const disabled = f.endsWith('.disabled')
          const name = disabled ? f.replace(/\.disabled$/, '') : f
          let size
          try { size = fs.statSync(path.join(knowledgeDir, f)).size } catch (e) { if (gone(e)) return null; throw e }
          return { name, disabled, size }
        }).filter(Boolean)
        const enabledFiles = allFiles.filter(f => f.match(/\.(txt|md)$/i))
        const content = enabledFiles.map(f => {
          let text
          try { text = readUtf8(path.join(knowledgeDir, f)) } catch (e) { if (gone(e)) return null; throw e }
          return `--- ${f} ---\n${text}`
        }).filter((x) => x !== null).join('\n\n')
        // Outline (capped) so the client can offer TOC-guided section retrieval for big KBs.
        // Over the cap, keep the TOP levels of the whole book rather than the first 400 entries:
        // a straight slice made every chapter after entry 400 unreachable. Each entry carries its
        // original index `i`, which is what /api/knowledge-sections slices by.
        let full = extractOutline(readKnowledgeFiles(knowledgeDir)).map((h, i) => ({ ...h, i }))
        for (let maxLevel = 3; full.length > 400 && maxLevel >= 1; maxLevel--) full = full.filter((h) => h.level <= maxLevel)
        const outline = full.slice(0, 400).map(({ file, title, level, i }) => ({ file, title, level, i }))
        res.end(JSON.stringify({ files, content: content || null, fileCount: enabledFiles.length, outline }))
      } catch (e) {
        // A read that FAILED is not an empty knowledge base: answered as one (200, no files), the list showed
        // "No files" and every AI call dropped the material. The client keeps what it has on a non-OK answer.
        res.statusCode = 500
        res.end(JSON.stringify({ error: e.message }))
      }
    } else if (req.method === 'POST') {
      const handleBody = (bodyStr) => {
        try {
          const body = JSON.parse(bodyStr)
          if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('upload object required')
          const { filename, content, replace } = body
          // Only text: a missing content was refused only by the file system's own type check, deep in the write.
          if (typeof content !== 'string') throw new Error('content required')
          if (filename !== undefined && filename !== null && typeof filename !== 'string') throw new Error('bad file name')
          const safeName = knowledgeFileName(filename)
          // Only what GET will list back (.txt/.md), never "." / ".." (the folder itself).
          if (!/\.(txt|md)$/i.test(safeName) || /^\.+$/.test(safeName)) throw new Error('only .txt, .md or .pdf files can be added')
          // Made only for a valid upload: a refused one (bad JSON, wrong type) left an empty knowledge folder behind.
          if (!fs.existsSync(knowledgeDir)) fs.mkdirSync(knowledgeDir, { recursive: true })
          // A file of that name (any case: one file on Windows/macOS), on or switched off, is replaced
          // only when the client says so: "Book.pdf" is stored as book.txt and silently overwrote the
          // user's own book.txt.
          const lower = safeName.toLowerCase()
          const clash = fs.readdirSync(knowledgeDir).find((f) => f.toLowerCase() === lower || f.toLowerCase() === lower + '.disabled')
          if (clash && !replace) { res.statusCode = 409; res.end(JSON.stringify({ exists: true, filename: clash.replace(/\.disabled$/i, '') })); return }
          writeFileAtomic(path.join(knowledgeDir, safeName), content) // a cut-off write left a truncated book that every AI call then read
          // Re-uploading a file the user had switched off left BOTH copies: the list showed the
          // name twice, and switching the old one back on renamed it over the new upload. The
          // upload replaces the file of that name, the switched-off copy included.
          const staleDisabled = path.join(knowledgeDir, safeName + '.disabled')
          if (fs.existsSync(staleDisabled)) fs.rmSync(staleDisabled, { force: true })
          // A case-sensitive file system (Linux) kept "Notes.txt" beside the replacing "notes.txt": the text was
          // there twice. Removed only when it is really ANOTHER file (on Windows/macOS it is the same one).
          if (replace) {
            const mine = fs.statSync(path.join(knowledgeDir, safeName))
            for (const f of fs.readdirSync(knowledgeDir)) {
              if (f === safeName || (f.toLowerCase() !== lower && f.toLowerCase() !== lower + '.disabled')) continue
              try { const st = fs.statSync(path.join(knowledgeDir, f)); if (st.ino !== mine.ino || st.dev !== mine.dev) fs.rmSync(path.join(knowledgeDir, f), { force: true }) } catch { /* gone already */ }
            }
          }
          res.end(JSON.stringify({ ok: true, filename: safeName }))
        } catch (e) { res.statusCode = 400; res.end(JSON.stringify({ error: e.message })) }
      }
      if (req.body) { handleBody(typeof req.body === 'string' ? req.body : JSON.stringify(req.body)) }
      else { let b = ''; req.on('data', c => b += c); req.on('end', () => handleBody(b)) }
    } else if (req.method === 'DELETE') {
      try {
        const fileName = url.searchParams.get('file')
        if (!fileName) { res.statusCode = 400; res.end('{"error":"no file"}'); return }
        const safeName = fileName.replace(/[<>:"/\\|?*]/g, '')
        // "." or ".." named the knowledge folder or the MODE folder itself (a PATCH renamed the whole
        // mode to "<name>.disabled", dropping it from the list).
        if (/^[.\s]*$/.test(safeName)) { res.statusCode = 400; res.end('{"error":"bad file name"}'); return }
        const filePath = path.join(knowledgeDir, safeName)
        const disabledPath = filePath + '.disabled'
        // Which copy: a share can hold both (an offline disable is merged as a second file). Deleting the
        // struck-through row deleted the live one too. No parameter (an older client) = both, as before.
        const which = url.searchParams.get('disabled')
        if (which !== '1' && fs.existsSync(filePath)) fs.unlinkSync(filePath)
        if (which !== '0' && fs.existsSync(disabledPath)) fs.unlinkSync(disabledPath)
        res.end('{"ok":true}')
      } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) }
    } else if (req.method === 'PATCH') {
      try {
        const fileName = url.searchParams.get('file')
        if (!fileName) { res.statusCode = 400; res.end('{"error":"no file"}'); return }
        const safeName = fileName.replace(/[<>:"/\\|?*]/g, '')
        // "." or ".." named the knowledge folder or the MODE folder itself (a PATCH renamed the whole
        // mode to "<name>.disabled", dropping it from the list).
        if (/^[.\s]*$/.test(safeName)) { res.statusCode = 400; res.end('{"error":"bad file name"}'); return }
        const filePath = path.join(knowledgeDir, safeName)
        const disabledPath = filePath + '.disabled'
        // `disabled=1|0`: the state the user asked for (a flip undid a double click, and re-enabled a file
        // another computer had just disabled). Already there = done. No parameter = the old flip.
        const want = new URL(req.url, 'http://x').searchParams.get('disabled')
        if (want === '1' && fs.existsSync(disabledPath) && !fs.existsSync(filePath)) { res.end(JSON.stringify({ ok: true, disabled: true })); return }
        if (want === '0' && fs.existsSync(filePath) && !fs.existsSync(disabledPath)) { res.end(JSON.stringify({ ok: true, disabled: false })); return }
        // BOTH copies exist (another computer, an offline merge): the flip renamed the switched-off copy over the
        // live one. With a wanted state nothing is overwritten: the copy in the way is kept beside it, switched off.
        if ((want === '0' || want === '1') && fs.existsSync(filePath) && fs.existsSync(disabledPath)) {
          const ext = path.extname(safeName)
          const kept = path.join(knowledgeDir, `${safeName.slice(0, safeName.length - ext.length)} (kept ${new Date().toISOString().slice(0, 10)} ${Date.now() % 100000})${ext}.disabled`)
          // want=1: the STALE switched-off copy is the one set aside, then the live file is switched off under
          // the real name (the other way round, re-enabling later brought back the old text).
          fs.renameSync(disabledPath, kept)
          if (want === '1') { fs.renameSync(filePath, disabledPath); res.end(JSON.stringify({ ok: true, disabled: true })); return }
          res.end(JSON.stringify({ ok: true, disabled: false })); return
        }
        if (fs.existsSync(disabledPath)) {
          fs.renameSync(disabledPath, filePath)
          res.end(JSON.stringify({ ok: true, disabled: false }))
        } else if (fs.existsSync(filePath)) {
          fs.renameSync(filePath, disabledPath)
          res.end(JSON.stringify({ ok: true, disabled: true }))
        } else {
          res.statusCode = 404; res.end('{"error":"file not found"}')
        }
      } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) }
    } else { res.statusCode = 405; res.end('') }
  }

  return { knowledge, sections }
}
