// /api/config: the shared settings file (config.json in the data folder).
//   GET  → the settings, or 503 {unreadable} when the file exists but could not be read (never served as empty:
//          the autosave would write defaults over the real file)
//   POST → a PATCH of settings (only changed keys, `__unset` for removals) merged into the file by writeConfig
// Unreachable-source handling lives in the shared data-route guard in front of it (503 when there is nothing to
// serve, .local-offline when there is), so an empty read can never reach here and clobber the real file.
// Pure of the dev server: the caller passes the config helpers, so tests run it with stubs or a temp folder.
export function createConfigRoute({ readConfigSettled, writeConfig, isConfigPatch, rememberAppLanguage = () => {}, log = console.log }) {
  return async (req, res) => {
    if (req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json')
      const r = await readConfigSettled()
      if (!r.ok) {
        log('[Config] config.json exists but could not be read; refusing to serve it as empty:', r.error)
        res.statusCode = 503
        res.end(JSON.stringify({ unreadable: true, error: r.error }))
        return
      }
      rememberAppLanguage(r.data?.appLanguage)
      res.end(JSON.stringify(r.data))
    } else if (req.method === 'POST') {
      let body = ''
      req.on('data', (chunk) => { body += chunk })
      req.on('end', () => {
        let parsed
        try { parsed = JSON.parse(body) } catch {
          res.statusCode = 400
          res.end('{"error":"invalid json"}')
          return
        }
        // Only an object of settings: a string or a list merged its characters/items in as keys "0", "1", ...
        if (!isConfigPatch(parsed)) { res.statusCode = 400; res.end('{"error":"settings object required"}'); return }
        try {
          writeConfig(parsed)
          rememberAppLanguage(parsed?.appLanguage)
          res.setHeader('Content-Type', 'application/json')
          res.end('{"ok":true}')
        } catch (e) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: `config.json was not saved: ${e.message}` }))
        }
      })
    } else {
      res.statusCode = 405
      res.end('')
    }
  }
}
