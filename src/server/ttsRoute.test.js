import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import crypto from 'crypto'
import { EventEmitter } from 'events'
import { createTtsRoute, ttsBaseUrl, ttsCacheKey, TTS_MIN_BYTES } from './ttsRoute.js'

let dir
beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ebiki-tts-')) })
afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

const AUDIO = Buffer.alloc(800, 7)
const writeFileAtomic = (file, data) => { const tmp = `${file}.${process.pid}.tmp`; fs.writeFileSync(tmp, data); fs.renameSync(tmp, file) }
const audioResp = (buf = AUDIO, type = 'audio/mpeg', status = 200) => ({ ok: status >= 200 && status < 300, status, headers: { get: (k) => (k.toLowerCase() === 'content-type' ? type : null) }, arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length) })

function make({ ttsUrl = 'http://127.0.0.1:8880/', mode = 'online', fetchImpl } = {}) {
  const calls = []
  const route = createTtsRoute({
    dataMode: async () => mode,
    readConfig: () => ({ pronunciation: { ttsUrl } }),
    dataPath: (...p) => path.join(dir, ...p),
    writeFileAtomic, fs, path, crypto,
    fetch: async (u, init) => { calls.push({ u, init }); return fetchImpl ? fetchImpl(u, init) : audioResp() },
    timeoutMs: 50,
  })
  return { route, calls }
}
function post(route, body, method = 'POST') {
  return new Promise((resolve) => {
    const req = new EventEmitter(); req.method = method
    const res = { statusCode: 200, headers: {}, writableEnded: false, setHeader(k, v) { this.headers[k] = v }, end(b) { this.body = b; this.writableEnded = true; resolve(this) } }
    route(req, res)
    if (method !== 'POST') return
    req.emit('data', typeof body === 'string' ? body : JSON.stringify(body)); req.emit('end')
  })
}
const cacheFiles = () => { try { return fs.readdirSync(path.join(dir, 'cache', 'tts')) } catch { return [] } }

describe('ttsBaseUrl', () => {
  it('is empty unless an http(s) URL is configured', () => {
    expect(ttsBaseUrl({})).toBe('')
    expect(ttsBaseUrl({ pronunciation: { ttsUrl: '  ' } })).toBe('')
    expect(ttsBaseUrl({ pronunciation: { ttsUrl: 'file:///etc/passwd' } })).toBe('')
    expect(ttsBaseUrl({ pronunciation: { ttsUrl: 'javascript:x' } })).toBe('')
    expect(ttsBaseUrl({ pronunciation: { ttsUrl: 'http://localhost:8880///' } })).toBe('http://localhost:8880')
  })
})

describe('/api/tts', () => {
  it('not configured: 404 and no request is made', async () => {
    const { route, calls } = make({ ttsUrl: '' })
    expect((await post(route, { input: 'hola', voice: 'ef_dora', lang: 'es' })).statusCode).toBe(404)
    expect(calls).toHaveLength(0)
  })
  it('data folder down: 404 before reading anything', async () => {
    const { route, calls } = make({ mode: 'down' })
    expect((await post(route, { input: 'hola', voice: 'ef_dora' })).statusCode).toBe(404)
    expect(calls).toHaveLength(0)
  })
  it('synthesizes through /v1/audio/speech, answers audio, and caches it under a hash name', async () => {
    const { route, calls } = make()
    const res = await post(route, { input: 'hola', voice: 'ef_dora', lang: 'es' })
    expect(res.statusCode).toBe(200)
    expect(res.headers['Content-Type']).toBe('audio/mpeg')
    expect(Buffer.compare(res.body, AUDIO)).toBe(0)
    expect(calls[0].u).toBe('http://127.0.0.1:8880/v1/audio/speech')
    expect(JSON.parse(calls[0].init.body)).toEqual({ model: 'kokoro', input: 'hola', voice: 'ef_dora', response_format: 'mp3' })
    expect(cacheFiles()).toEqual([ttsCacheKey(crypto, 'hola', 'es', 'ef_dora') + '.mp3'])
    expect(cacheFiles()[0]).toMatch(/^[0-9a-f]{40}\.mp3$/)
  })
  it('a second play is served from the cache with no request', async () => {
    const { route, calls } = make()
    await post(route, { input: 'hola', voice: 'ef_dora', lang: 'es' })
    const again = await post(route, { input: 'hola', voice: 'ef_dora', lang: 'es' })
    expect(again.statusCode).toBe(200)
    expect(calls).toHaveLength(1)
  })
  it('a tiny cached file (an old failed synthesis) is replaced, not replayed', async () => {
    const { route, calls } = make()
    const cdir = path.join(dir, 'cache', 'tts'); fs.mkdirSync(cdir, { recursive: true })
    const f = path.join(cdir, ttsCacheKey(crypto, 'hola', 'es', 'ef_dora') + '.mp3')
    fs.writeFileSync(f, Buffer.alloc(10))
    expect((await post(route, { input: 'hola', voice: 'ef_dora', lang: 'es' })).statusCode).toBe(200)
    expect(calls).toHaveLength(1)
    expect(fs.statSync(f).size).toBe(AUDIO.length)
  })
  it('a JSON error or an empty 200 is 502 and is never cached', async () => {
    for (const r of [audioResp(Buffer.from('{"error":"loading model"}'.padEnd(400, ' ')), 'application/json'), audioResp(Buffer.alloc(0))]) {
      const { route } = make({ fetchImpl: () => r })
      expect((await post(route, { input: 'perro', voice: 'ef_dora', lang: 'es' })).statusCode).toBe(502)
    }
    expect(cacheFiles()).toEqual([])
  })
  it('a server error status is 502', async () => {
    const { route } = make({ fetchImpl: () => audioResp(AUDIO, 'audio/mpeg', 500) })
    const res = await post(route, { input: 'x', voice: 'v' })
    expect(res.statusCode).toBe(502)
    expect(res.body).toMatch(/500/)
  })
  it('an unreachable or hung server is 502 (the client falls through to browser speech)', async () => {
    const { route } = make({ fetchImpl: (u, init) => new Promise((_, rej) => init.signal.addEventListener('abort', () => rej(new Error('aborted due to timeout')))) })
    const res = await post(route, { input: 'x', voice: 'v' })
    expect(res.statusCode).toBe(502)
    expect(cacheFiles()).toEqual([])
  })
  it('refuses bad bodies and methods without throwing', async () => {
    const { route, calls } = make()
    expect((await post(route, '{oops')).statusCode).toBe(400)
    expect((await post(route, null)).statusCode).toBe(404)
    expect((await post(route, { input: { a: 1 }, voice: 'v' })).statusCode).toBe(404)
    expect((await post(route, { input: 'x'.repeat(5000), voice: 'v' })).statusCode).toBe(400)
    expect((await post(route, {}, 'GET')).statusCode).toBe(405)
    expect(calls).toHaveLength(0)
  })
  it('path safety: nothing from the request reaches the file name', async () => {
    const { route } = make()
    await post(route, { input: '../../../evil', voice: '..\\..\\x', lang: '/etc/passwd' })
    const files = cacheFiles()
    expect(files).toHaveLength(1)
    expect(files[0]).toMatch(/^[0-9a-f]{40}\.mp3$/)
    expect(fs.readdirSync(dir)).toEqual(['cache'])
  })
})
