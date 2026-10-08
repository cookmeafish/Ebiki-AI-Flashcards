// /api/discover-store: the local copy of the whole-blob stores (Discover profile + ledger, hooks, grammar log,
// dupignore), stored flat under discover/<kind>__<mode>.json. Anki holds the other copy (src/discover/storage.js).
//   GET  ?kind=&mode=     → { content, shared } ('' only when the file is MISSING; any other read error is a 500)
//   POST same query, body { content } → { ok }
// `shared` (isShared()) says the data folder is one other computers write too: then this copy is the freshest and the
// client reads it FIRST. It is a function because the data folder can be switched live.
// Pure of the dev server: the caller passes the data-folder helpers, so tests run it on a temp folder.
export function createDiscoverStoreRoute({ dataPath, readUtf8, writeFileAtomic, fs, isShared = () => false }) {
  return (req, res) => {
    const url = new URL(req.url, 'http://localhost')
    const kind = (url.searchParams.get('kind') || '').replace(/[^a-z]/gi, '')
    const mode = (url.searchParams.get('mode') || '').replace(/[^a-zA-Z0-9._-]/g, '-')
    res.setHeader('Content-Type', 'application/json')
    if (!kind || !mode) { res.statusCode = 400; res.end(JSON.stringify({ error: 'kind and mode required' })); return }
    const file = dataPath('discover', `${kind}__${mode}.json`)
    if (req.method === 'GET') {
      try {
        // Only a MISSING file is "no notes yet": existsSync answers false on ANY error (a share dropping, a
        // denied folder), and that empty reply let Insights write a fresh file over the real notes.
        let content = ''
        try { content = readUtf8(file) } catch (e) { if (e.code !== 'ENOENT') throw e }
        // `shared`: the store lives in a data folder other computers write too. Every computer writes each blob
        // here AND to its own Anki, so this copy is the freshest; its Anki only catches up through AnkiWeb, and
        // reading Anki first let a lagging copy win (the next write then dropped the other computer's hooks).
        res.end(JSON.stringify({ content, shared: !!isShared() })) // BOM-free: the client JSON.parses it, and a BOM read as "nothing stored"
      } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) }
    } else if (req.method === 'POST') {
      let body = ''
      req.on('data', c => body += c)
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body)
          const content = parsed && typeof parsed === 'object' ? parsed.content : undefined
          // Only text is stored (the GET serves it back as `content`): a missing one threw deep in the write, and
          // with a looser write helper it would have saved the text "undefined" over the real blob.
          if (typeof content !== 'string') { res.statusCode = 400; res.end(JSON.stringify({ error: 'content required' })); return }
          const dir = dataPath('discover')
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
          writeFileAtomic(file, content)
          res.end(JSON.stringify({ ok: true }))
        } catch (e) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: e.message }))
        }
      })
    } else { res.statusCode = 405; res.end('') }
  }
}
