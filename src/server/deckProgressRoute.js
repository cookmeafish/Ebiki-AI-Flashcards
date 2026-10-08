// /api/deck-progress: the progress notes per deck (decks/<deckDirName>/progress-observations.md).
//   GET  ?deck=<name>          → { content } ('' only when the file is MISSING; any other read error is a 500)
//   POST { deck, content }     → { ok } (both required; the whole file is replaced, atomically)
// Chat <progress-update> and "Generate Insights" REPLACE the file, so a failed read must never look like "no notes".
// Pure of the dev server: the caller passes the data-folder helpers, so tests run it on a temp folder.
export function createDeckProgressRoute({ dataPath, deckDirName, readUtf8, writeFileAtomic, fs, path, log = console.log }) {
  return (req, res) => {
    if (req.method === 'GET') {
      const url = new URL(req.url, 'http://localhost')
      const deck = url.searchParams.get('deck')
      if (!deck) { res.statusCode = 400; res.end(JSON.stringify({ error: 'deck required' })); return }
      let file = dataPath('decks', deckDirName(deck), 'progress-observations.md')
      // A folder saved under the raw name before deckDirName existed (possible on macOS/Linux,
      // which allow ":"): read it if the new one does not exist yet. Only a name with no path
      // separators or ".." is tried.
      if (!fs.existsSync(file) && !/[\\/]|^\.\.?$/.test(deck)) {
        const legacy = dataPath('decks', deck, 'progress-observations.md')
        try { if (fs.existsSync(legacy)) file = legacy } catch { /* not a valid path here */ }
      }
      res.setHeader('Content-Type', 'application/json')
      try {
        // Only a MISSING file is "no notes yet": existsSync answers false on ANY error (a share dropping, a
        // denied folder), and that empty reply let Insights write a fresh file over the real notes.
        let content = ''
        try { content = readUtf8(file) } catch (e) { if (e.code !== 'ENOENT') throw e }
        res.end(JSON.stringify({ content })) // BOM-free: the client JSON.parses it, and a BOM read as "nothing stored"
      } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) }
    } else if (req.method === 'POST') {
      let body = ''
      req.on('data', c => body += c)
      req.on('end', () => {
        try {
          const { deck, content } = JSON.parse(body)
          // Both required: a missing deck wrote into decks/_, and missing content saved the text "undefined".
          if (typeof deck !== 'string' || !deck.trim() || typeof content !== 'string') { res.statusCode = 400; res.end(JSON.stringify({ error: 'deck and content required' })); return }
          const dir = dataPath('decks', deckDirName(deck))
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
          writeFileAtomic(path.join(dir, 'progress-observations.md'), content)
          log('[Deck Progress] saved for:', deck)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: true }))
        } catch (e) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: e.message }))
        }
      })
    } else { res.statusCode = 405; res.end('') }
  }
}
