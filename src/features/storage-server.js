// Framework server part: a small JSON store every feature can use without server code of its own.
//   GET  /api/feature-data?feature=<id>&key=<key>   → { value }  (null = nothing saved yet)
//   POST /api/feature-data?feature=<id>&key=<key>   { value } → { ok }
// Files: <data folder>/features/<id>/<key>.json, written atomically. A value is replaced WHOLE, so a feature
// must only write a key it has READ successfully (the client helper in ./storage.js enforces that).
const DIR = 'features'
const NAME_RE = /^[a-z0-9][a-z0-9-]{0,63}$/
const MAX_BODY_BYTES = 4 * 1024 * 1024

export default {
  id: 'feature-data',
  dataEntries: [DIR],
  dataRoutes: ['/feature-data'],
  register(server, { dataPath, readUtf8, writeFileAtomic, fs, path }) {
    const send = (res, status, body) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)) }
    server.middlewares.use('/api/feature-data', (req, res) => {
      const url = new URL(req.url, 'http://x')
      const feature = url.searchParams.get('feature') || ''
      const key = url.searchParams.get('key') || ''
      if (!NAME_RE.test(feature) || !NAME_RE.test(key)) return send(res, 400, { error: 'bad feature or key' }) // never a path from raw input
      const dir = dataPath(DIR, feature)
      const file = path.join(dir, `${key}.json`)
      if (req.method === 'GET') {
        try { return send(res, 200, { value: JSON.parse(readUtf8(file)) }) }
        catch (e) {
          if (e?.code === 'ENOENT') return send(res, 200, { value: null })
          // Damaged JSON is not "nothing saved": the client must not write over it blindly.
          return send(res, e instanceof SyntaxError ? 409 : 500, { error: e.message })
        }
      }
      if (req.method !== 'POST') return send(res, 405, { error: 'method' })
      let body = ''
      req.on('data', (c) => { body += c; if (body.length > MAX_BODY_BYTES) req.destroy() })
      req.on('end', () => {
        try {
          const { value } = JSON.parse(body || '{}')
          if (value === undefined) return send(res, 400, { error: 'value required' })
          fs.mkdirSync(dir, { recursive: true })
          writeFileAtomic(file, JSON.stringify(value))
          send(res, 200, { ok: true })
        } catch (e) { send(res, e instanceof SyntaxError ? 400 : 500, { error: e.message }) }
      })
    })
  },
}
