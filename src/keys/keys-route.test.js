// /api/keys POST end to end through the real plugin middleware (temp key and data folders): the query is read and
// checked BEFORE anything is written. A malformed "%" in ?providers= used to throw AFTER writeEnv had saved the key, so
// the request answered 500 although the key was stored.
import { describe, it, expect, afterAll } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { EventEmitter } from 'events'

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ebiki-keysroute-'))
process.env.EBIKI_DATA_DIR = DIR
process.env.EBIKI_ENV_DIR = DIR
const mod = await import('../../vite.config.js')
const { readEnvFile, ENV_FILE } = mod
afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }))

// A tiny connect-like stack: use([prefix], fn), prefix stripped from req.url like connect does.
function stack() {
  const layers = []
  return {
    use(a, b) { layers.push(typeof a === 'string' ? { prefix: a, fn: b } : { prefix: '', fn: a }) },
    handle(req, res) {
      let i = 0
      const url = req.url
      const next = () => {
        while (i < layers.length) {
          const l = layers[i++]
          const p = url.split('?')[0]
          if (l.prefix && !(p === l.prefix || p.startsWith(l.prefix + '/') || p.startsWith(l.prefix + '.'))) continue
          req.url = l.prefix ? (url.slice(l.prefix.length) || '/') : url
          if (!req.url.startsWith('/')) req.url = '/' + req.url
          return l.fn(req, res, next)
        }
        res.statusCode = 404; res.end('')
      }
      next()
    },
  }
}
const plugin = mod.default.plugins.flat().find((p) => p && p.name === 'api-plugin')
const mw = stack()
plugin.configureServer({ middlewares: mw, httpServer: null, ws: { send() {} }, hot: { send() {} } })

function post(url, body) {
  return new Promise((resolve) => {
    const req = new EventEmitter()
    Object.assign(req, { method: 'POST', url, originalUrl: url, headers: { host: 'localhost:3000', origin: 'http://localhost:3000', 'content-type': 'application/json' } })
    req.setEncoding = () => {}
    const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k.toLowerCase()] = v }, getHeader(k) { return this.headers[k.toLowerCase()] }, end(b) { resolve({ status: this.statusCode, body: String(b ?? '') }) } }
    mw.handle(req, res)
    setImmediate(() => { req.emit('data', body); req.emit('end') })
  })
}

const OAI = 'sk-proj-bbbbbbbbbbbbbbbbbbbb'

describe('/api/keys POST', () => {
  it('a malformed query answers 400 and writes nothing', async () => {
    const r = await post('/api/keys?source=user&providers=%E0%A4%A', JSON.stringify({ openai: OAI }))
    expect(r.status).toBe(400)
    expect(JSON.parse(r.body).error).toBe('invalid query')
    expect(fs.existsSync(ENV_FILE) ? readEnvFile(ENV_FILE).openai : undefined).toBeUndefined()
  })
  it('invalid JSON answers 400 and writes nothing', async () => {
    const r = await post('/api/keys?source=user&providers=openai', '{nope')
    expect(r.status).toBe(400)
    expect(JSON.parse(r.body).error).toBe('invalid json')
    expect(fs.existsSync(ENV_FILE) ? readEnvFile(ENV_FILE).openai : undefined).toBeUndefined()
  })
  it('a well-formed typed save stores the key and answers ok', async () => {
    const r = await post('/api/keys?source=user&providers=' + encodeURIComponent('openai'), JSON.stringify({ openai: OAI }))
    expect(r.status).toBe(200)
    expect(JSON.parse(r.body).ok).toBe(true)
    expect(readEnvFile(ENV_FILE).openai).toBe(OAI)
  })
})
