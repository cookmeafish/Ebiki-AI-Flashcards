// /api/ankiformat: Ebiki's own legacy card-format file (ankiformat.json, read once by the modes migration).
//   GET  → the file, '{}' when it does not exist (only ENOENT; any other read error is a 500, and the client then
//          skips the migration instead of migrating from nothing)
//   POST → replaces the file with a JSON OBJECT (anything else is refused, so the GET never serves unreadable text)
// Pure of the dev server: the caller passes the data-folder helpers, so tests run it on a temp folder.
export function createAnkiformatRoute({ dataPath, readUtf8, writeFileAtomic }) {
  return (req, res) => {
    if (req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json')
      try { res.end(readUtf8(dataPath('ankiformat.json'))) }
      catch (e) {
        if (e && e.code === 'ENOENT') res.end('{}')
        else { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) }
      }
    } else if (req.method === 'POST') {
      const handleBody = (bodyStr) => {
        try {
          // The catch below promised "invalid json" but nothing parsed: any text was saved, and the GET then
          // served a file the client could not read.
          const parsed = JSON.parse(bodyStr)
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('object required')
          writeFileAtomic(dataPath('ankiformat.json'), bodyStr)
          res.setHeader('Content-Type', 'application/json')
          res.end('{"ok":true}')
        } catch {
          res.statusCode = 400
          res.end('{"error":"invalid json"}')
        }
      }
      if (req.body) {
        handleBody(typeof req.body === 'string' ? req.body : JSON.stringify(req.body))
      } else {
        let body = ''
        req.on('data', (chunk) => { body += chunk })
        req.on('end', () => handleBody(body))
      }
    } else {
      res.statusCode = 405
      res.end('')
    }
  }
}
