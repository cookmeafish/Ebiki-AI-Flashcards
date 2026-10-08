import { describe, it, expect } from 'vitest'
import { EventEmitter } from 'node:events'
import http from 'node:http'
import { bodyCapFor, limitBody, DEFAULT_BODY_CAP } from './bodyLimit.js'

const fakeRes = () => {
  const res = { statusCode: 200, headers: {}, body: null, headersSent: false, writableEnded: false }
  res.setHeader = (k, v) => { res.headers[k.toLowerCase()] = v }
  res.end = (b) => { res.body = b; res.headersSent = true; res.writableEnded = true }
  return res
}
const fakeReq = (method, url, headers = {}) => Object.assign(new EventEmitter(), { method, url, originalUrl: url, headers })

// A handler written like the real ones: accumulate, answer on 'end'.
const handler = (req, res, seen) => {
  let body = ''
  req.on('data', (c) => { body += c })
  req.on('end', () => { seen.ended = true; res.statusCode = 200; res.end('ok:' + body.length) })
}

describe('bodyCapFor', () => {
  it('gives big caps where payloads are big and the default elsewhere', () => {
    expect(bodyCapFor('/api/chats')).toBeGreaterThan(DEFAULT_BODY_CAP)
    expect(bodyCapFor('/api/modes/knowledge?mode=Spanish')).toBe(bodyCapFor('/api/modes/knowledge'))
    expect(bodyCapFor('/api/modes/knowledge')).toBeGreaterThan(bodyCapFor('/api/modes'))
    expect(bodyCapFor('/api/anki')).toBeGreaterThan(DEFAULT_BODY_CAP)
    expect(bodyCapFor('/api/keys?source=user')).toBeLessThan(DEFAULT_BODY_CAP)
    expect(bodyCapFor('/api/config')).toBe(DEFAULT_BODY_CAP)
  })
  it('matches whole path segments, not prefixes of other routes', () => {
    // /api/anki-start is not the Anki proxy
    expect(bodyCapFor('/api/anki-start')).toBe(DEFAULT_BODY_CAP)
    expect(bodyCapFor('/api/chats-old')).toBe(DEFAULT_BODY_CAP)
  })
})

describe('limitBody', () => {
  const mw = limitBody(() => 10)

  it('lets GETs through untouched', () => {
    const req = fakeReq('GET', '/api/config', { 'content-length': '999' }); const res = fakeRes(); let n = 0
    mw(req, res, () => { n++ })
    expect(n).toBe(1); expect(res.statusCode).toBe(200)
  })

  it('refuses a declared oversize body before reading it', () => {
    const req = fakeReq('POST', '/api/config', { 'content-length': '11' }); const res = fakeRes(); let n = 0
    mw(req, res, () => { n++ })
    expect(n).toBe(0); expect(res.statusCode).toBe(413); expect(JSON.parse(res.body).error).toBe('too large')
  })

  it('passes a body within the cap to the handler', () => {
    const req = fakeReq('POST', '/api/config', { 'content-length': '5' }); const res = fakeRes(); const seen = {}
    mw(req, res, () => handler(req, res, seen))
    req.emit('data', 'hello'); req.emit('end')
    expect(seen.ended).toBe(true); expect(res.body).toBe('ok:5')
  })

  it('cuts an undeclared streaming body at the cap and keeps the handler quiet (no double answer)', () => {
    const req = fakeReq('POST', '/api/config'); const res = fakeRes(); const seen = {}
    mw(req, res, () => handler(req, res, seen))
    req.emit('data', 'abcdef'); req.emit('data', 'ghijkl'); req.emit('data', 'more'); req.emit('end')
    expect(res.statusCode).toBe(413)
    expect(seen.ended).toBeUndefined()
  })

  it('counts bytes, not characters', () => {
    const req = fakeReq('POST', '/api/config'); const res = fakeRes(); const seen = {}
    mw(req, res, () => handler(req, res, seen))
    req.emit('data', 'ééééé é'); // 7 chars, 13 bytes
    req.emit('end')
    expect(res.statusCode).toBe(413)
  })

  // The data-route guard awaits a share probe between this middleware and the handler. An eager counting listener
  // started the body flowing at once, so every route behind that await read an EMPTY body: config, modes, chats
  // and the rest answered "invalid json" and nothing could be saved.
  it('keeps the whole body for a handler that starts listening after an async step', async () => {
    const server = http.createServer((req, res) => {
      req.originalUrl = req.url
      limitBody(() => 1000)(req, res, () => { setTimeout(() => handler(req, res, {}), 40) })
    })
    await new Promise((r) => server.listen(0, '127.0.0.1', r))
    const { port } = server.address()
    const send = (body, headers) => new Promise((resolve, reject) => {
      const rq = http.request({ host: '127.0.0.1', port, method: 'POST', path: '/api/config', headers }, (rs) => {
        let b = ''; rs.on('data', (c) => { b += c }); rs.on('end', () => resolve({ status: rs.statusCode, body: b }))
      })
      rq.on('error', reject)
      rq.end(body)
    })
    try {
      expect(await send('{"theme":"dark"}', { 'Content-Type': 'application/json', 'Content-Length': '16' })).toEqual({ status: 200, body: 'ok:16' })
      expect(await send('x'.repeat(300), { 'Transfer-Encoding': 'chunked' })).toEqual({ status: 200, body: 'ok:300' })
    } finally { await new Promise((r) => server.close(r)) }
  })

  it('counts each chunk once even with two data listeners', () => {
    const req = fakeReq('POST', '/api/config'); const res = fakeRes(); let a = '', b = ''
    mw(req, res, () => { req.on('data', (c) => { a += c }); req.on('data', (c) => { b += c }) })
    req.emit('data', 'abcdef') // 6 bytes under the cap of 10; counted twice it would be 12 and refused
    expect(res.statusCode).toBe(200); expect(a).toBe('abcdef'); expect(b).toBe('abcdef')
  })

  it('works on a real HTTP server with a chunked body', async () => {
    const server = http.createServer((req, res) => {
      req.originalUrl = req.url
      limitBody(() => 1000)(req, res, () => handler(req, res, {}))
    })
    await new Promise((r) => server.listen(0, '127.0.0.1', r))
    const { port } = server.address()
    const post = (chunks) => new Promise((resolve, reject) => {
      const rq = http.request({ host: '127.0.0.1', port, method: 'POST', path: '/api/x', headers: { 'Transfer-Encoding': 'chunked' } }, (rs) => {
        let b = ''; rs.on('data', (c) => { b += c }); rs.on('end', () => resolve({ status: rs.statusCode, body: b }))
      })
      rq.on('error', (e) => (e.code === 'ECONNRESET' || e.code === 'EPIPE' ? resolve({ status: 413, body: 'reset' }) : reject(e)))
      for (const c of chunks) rq.write(c)
      rq.end()
    })
    try {
      expect(await post(['a'.repeat(400), 'b'.repeat(400)])).toEqual({ status: 200, body: 'ok:800' })
      const big = await post(['a'.repeat(600), 'b'.repeat(600), 'c'.repeat(600)])
      expect(big.status).toBe(413)
    } finally { await new Promise((r) => server.close(r)) }
  })
})
