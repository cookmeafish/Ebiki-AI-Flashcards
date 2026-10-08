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
        const read = () => JSON.parse(readUtf8(file))
        try { return send(res, 200, { value: read() }) }
        catch (e) {
          if (e?.code === 'ENOENT') return send(res, 200, { value: null })
          if (!(e instanceof SyntaxError)) return send(res, 500, { error: e.message })
          // Damaged JSON: maybe another computer is mid-write, so read once more a second later. Still damaged =
          // kept aside as <key>.json.corrupt-<stamp> and served as empty (like config.json): a 409 here refused
          // every later write, so that feature's data for this mode was locked for good.
          setTimeout(() => {
            try { return send(res, 200, { value: read() }) }
            catch (e2) {
              if (e2?.code === 'ENOENT') return send(res, 200, { value: null })
              if (!(e2 instanceof SyntaxError)) return send(res, 500, { error: e2.message })
              try {
                fs.renameSync(file, `${file}.corrupt-${new Date().toISOString().replace(/[:.]/g, '-')}`)
                console.warn(`[feature-data] damaged ${feature}/${key}.json kept aside`)
                send(res, 200, { value: null })
              } catch (e3) { send(res, 500, { error: e3.message }) }
            }
          }, 1000)
          return
        }
      }
      if (req.method !== 'POST') return send(res, 405, { error: 'method' })
      // Too big: answer 413 and drop the rest (destroying the socket left the client with a bare network error).
      let body = ''
      let tooLarge = false
      req.on('data', (c) => {
        if (tooLarge) return
        body += c
        if (body.length > MAX_BODY_BYTES) { tooLarge = true; body = ''; send(res, 413, { error: 'too large' }) }
      })
      req.on('end', () => {
        if (tooLarge) return
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
