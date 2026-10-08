// /api/question-bank: saved question sets for the opt-in "question reuse" token saver (utils/questionBank.js).
// One small file per NOTE in decks/<deck>/questions/ (the same per-deck folder as the progress notes):
//   GET    ?deck=<name>&note=<noteId>  → { bank }          (null = nothing saved)
//   POST   same query, body { bank }   → { ok }
//   DELETE ?deck=<name>                → { ok, removed }   ("Clear saved questions": the deck AND its
//                                                           subdecks, Parent--Child folders)
// The client only calls it while the setting is ON; nothing here runs for a user who never turns it on.
// Pure of the dev server: the caller passes the data-folder helpers, so tests run it on a temp folder.
export function createQuestionBankRoute({ dataPath, deckDirName, folderKey, readUtf8, writeFileAtomic, fs, path }) {
  return (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    const url = new URL(req.url, 'http://x')
    const deck = url.searchParams.get('deck') || ''
    const note = url.searchParams.get('note') || ''
    if (!deck.trim()) { res.statusCode = 400; res.end(JSON.stringify({ error: 'deck required' })); return }
    const deckDir = deckDirName(deck) // never a path from raw input
    const qDir = dataPath('decks', deckDir, 'questions')
    const noteOk = /^\d{1,20}$/.test(note)
    if (req.method === 'GET') {
      if (!noteOk) { res.statusCode = 400; res.end(JSON.stringify({ error: 'note required' })); return }
      try {
        const file = path.join(qDir, `${note}.json`)
        // Only a MISSING file is "nothing saved": existsSync said false on any stat error (a share blip), and the
        // next save replaced every saved set with one.
        let bank = null
        try { bank = JSON.parse(readUtf8(file)) } catch (e) { if (e && (e.code === 'ENOENT' || e instanceof SyntaxError)) bank = null; else throw e } // damaged = nothing saved
        res.end(JSON.stringify({ bank }))
      } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) }
    } else if (req.method === 'POST') {
      if (!noteOk) { res.statusCode = 400; res.end(JSON.stringify({ error: 'note required' })); return }
      let body = ''
      req.on('data', (c) => { body += c })
      req.on('end', () => {
        try {
          const { bank } = JSON.parse(body || '{}') || {}
          if (!bank || typeof bank !== 'object' || !Array.isArray(bank.sets)) { res.statusCode = 400; res.end(JSON.stringify({ error: 'bank required' })); return }
          fs.mkdirSync(qDir, { recursive: true })
          writeFileAtomic(path.join(qDir, `${note}.json`), JSON.stringify(bank))
          res.end(JSON.stringify({ ok: true }))
        } catch (e) { res.statusCode = e instanceof SyntaxError ? 400 : 500; res.end(JSON.stringify({ error: e.message })) }
      })
    } else if (req.method === 'DELETE') {
      try {
        const decksRoot = dataPath('decks')
        let removed = 0
        // exact=1: the client names the deck and each real subdeck (Anki's list). The folder-name prefix
        // can't be reversed ("::" and a literal "--" map alike, trailing dots are stripped): clearing
        // "Grammar" also cleared a separate deck "Grammar--Advanced", and "Vol. 1."'s subdecks were missed.
        const exact = url.searchParams.get('exact') === '1'
        const wanted = new Set([deckDir, ...url.searchParams.getAll('also').filter((n) => n.trim()).map(deckDirName)].map(folderKey))
        const dirs = !fs.existsSync(decksRoot) ? []
          : fs.readdirSync(decksRoot).filter((d) => (exact ? wanted.has(folderKey(d)) : (folderKey(d) === folderKey(deckDir) || folderKey(d).startsWith(folderKey(deckDir) + '--'))))
        for (const d of dirs) {
          const dir = path.join(decksRoot, d, 'questions')
          if (!fs.existsSync(dir)) continue
          for (const f of fs.readdirSync(dir)) if (f.endsWith('.json')) { fs.rmSync(path.join(dir, f), { force: true }); removed++ }
          try { fs.rmdirSync(dir) } catch { /* not empty (a stray file): leave it */ }
        }
        res.end(JSON.stringify({ ok: true, removed }))
      } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) }
    } else { res.statusCode = 405; res.end('') }
  }
}
