import { describe, it, expect, afterEach } from 'vitest'
import http from 'http'
import { EventEmitter } from 'events'
import { createAnkiProxy, isChangeAction, ankiLimitMs, ankiProxyError, actionOf, ANKI_TIMEOUT_MS, ANKI_SYNC_TIMEOUT_MS } from './ankiProxy.js'

// A fake AnkiConnect on a free local port (no real Anki, nothing outside this machine).
const servers = []
afterEach(async () => { await Promise.all(servers.splice(0).map((s) => new Promise((r) => { s.closeAllConnections?.(); s.close(() => r()) }))) })
function fakeAnki(handler) {
  return new Promise((resolve) => {
    const s = http.createServer(handler)
    servers.push(s)
    s.listen(0, '127.0.0.1', () => resolve(s.address().port))
  })
}
const freePort = async () => { const p = await fakeAnki(() => {}); const s = servers.pop(); await new Promise((r) => s.close(() => r())); return p }
const quiet = { log() {} }
function call(proxy, body, { method = 'POST', preParsed = false } = {}) {
  return new Promise((resolve) => {
    const req = new EventEmitter(); req.method = method
    if (preParsed) req.body = body
    const res = { statusCode: 200, headers: {}, headersSent: false, writableEnded: false, setHeader(k, v) { this.headers[k] = v }, end(b) { this.body = b; this.headersSent = this.writableEnded = true; resolve(this) } }
    proxy(req, res)
    if (method === 'POST' && !preParsed) { req.emit('data', typeof body === 'string' ? body : JSON.stringify(body)); req.emit('end') }
  })
}

describe('isChangeAction / ankiLimitMs / actionOf', () => {
  it('names changes, including review answers and multi, and not reads', () => {
    for (const a of ['addNote', 'addNotes', 'updateNoteFields', 'deleteNotes', 'changeDeck', 'setDueDate', 'forgetCards', 'answerCards', 'insertReviews', 'storeMediaFile', 'createDeck', 'suspend', 'unsuspend', 'relearnCards', 'guiAnswerCard', 'guiAddCards', 'multi', 'modelFieldRename', 'replaceTags', 'removeTags']) expect(isChangeAction(a)).toBe(true)
    for (const a of ['deckNames', 'findNotes', 'notesInfo', 'cardsInfo', 'guiCurrentCard', 'guiShowAnswer', 'guiDeckReview', 'sync', 'version', 'modelNames', 'modelFieldNames', 'getNumCardsReviewedToday', '', null]) expect(isChangeAction(a)).toBe(false)
  })
  it('gives a sync 15 minutes and everything else 2', () => {
    expect(ankiLimitMs('sync')).toBe(15 * 60 * 1000)
    expect(ankiLimitMs('deckNames')).toBe(2 * 60 * 1000)
    expect(ANKI_TIMEOUT_MS).toBe(120000); expect(ANKI_SYNC_TIMEOUT_MS).toBe(900000)
  })
  it('reads the action only from a JSON object', () => {
    expect(actionOf('{"action":"sync","version":6}')).toBe('sync')
    for (const b of ['', 'not json', 'null', '[1]', '{"action":7}']) expect(actionOf(b)).toBe('')
  })
  it('maps failures to codes', () => {
    expect(ankiProxyError(new Error('connect ECONNREFUSED 127.0.0.1:8765'), 'deckNames').code).toBe('notRunning')
    expect(ankiProxyError(new Error('timed out after 120s (deckNames)'), 'deckNames')).toMatchObject({ code: 'timeout', timedOut: true })
    expect(ankiProxyError(new Error('timed out after 120s (addNote)'), 'addNote')).toMatchObject({ code: 'timeoutChange', timedOut: true })
    expect(ankiProxyError(new Error('timed out'), 'guiAnswerCard').code).toBe('timeoutChange')
    expect(ankiProxyError(null, '').code).toBe('notRunning')
  })
})

describe('createAnkiProxy', () => {
  it('forwards the body and answers the reply as is (UTF-8 across chunks)', async () => {
    let got = ''
    const port = await fakeAnki((req, res) => {
      req.on('data', (c) => { got += c })
      req.on('end', () => {
        const reply = Buffer.from(JSON.stringify({ result: ['Español', 'Français', '日本語'], error: null }))
        res.writeHead(200, { 'Content-Type': 'application/json' })
        // split mid-character so a naive decoder would break it
        res.write(reply.subarray(0, 15)); setTimeout(() => res.end(reply.subarray(15)), 5)
      })
    })
    const proxy = createAnkiProxy({ request: http.request, port, log: quiet })
    const res = await call(proxy, { action: 'deckNames', version: 6 })
    expect(JSON.parse(got)).toEqual({ action: 'deckNames', version: 6 })
    expect(JSON.parse(res.body).result).toEqual(['Español', 'Français', '日本語'])
    expect(res.headers['Content-Type']).toBe('application/json')
  })
  it('accepts a body Vite already parsed', async () => {
    const port = await fakeAnki((req, res) => { let b = ''; req.on('data', (c) => { b += c }); req.on('end', () => res.end(JSON.stringify({ result: JSON.parse(b).action, error: null }))) })
    const res = await call(createAnkiProxy({ request: http.request, port, log: quiet }), { action: 'version' }, { preParsed: true })
    expect(JSON.parse(res.body).result).toBe('version')
  })
  it('passes a non-JSON reply through unchanged (the client makes it readable)', async () => {
    const port = await fakeAnki((req, res) => { req.resume(); req.on('end', () => res.end('AnkiConnect v.6')) })
    const res = await call(createAnkiProxy({ request: http.request, port, log: quiet }), { action: 'version' })
    expect(res.body).toBe('AnkiConnect v.6')
  })
  it('nothing listening: notRunning', async () => {
    const port = await freePort()
    const res = await call(createAnkiProxy({ request: http.request, port, log: quiet }), { action: 'deckNames' })
    expect(JSON.parse(res.body)).toMatchObject({ code: 'notRunning' })
  })
  it('no answer in time: timeout for a read, timeoutChange for a change', async () => {
    const port = await fakeAnki((req) => { req.resume() /* never answers: a modal dialog in Anki */ })
    const proxy = createAnkiProxy({ request: http.request, port, log: quiet, limitMs: () => 60 })
    expect(JSON.parse((await call(proxy, { action: 'notesInfo' })).body)).toMatchObject({ code: 'timeout', timedOut: true })
    expect(JSON.parse((await call(proxy, { action: 'addNote' })).body)).toMatchObject({ code: 'timeoutChange', timedOut: true })
  })
  it('Anki closing mid-reply: closed, never a hang', async () => {
    const port = await fakeAnki((req, res) => {
      req.resume()
      req.on('end', () => { res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': '500' }); res.write('{"result":['); setTimeout(() => res.socket.destroy(), 10) })
    })
    const res = await call(createAnkiProxy({ request: http.request, port, log: quiet }), { action: 'notesInfo' })
    expect(JSON.parse(res.body)).toMatchObject({ code: 'closed' })
  })
  it('answers once even when a request error follows the reply', async () => {
    const fakeRequest = (opts, onRes) => {
      const r = new EventEmitter()
      r.setTimeout = () => {}; r.destroy = () => {}; r.write = () => {}
      r.end = () => {
        const ankiRes = new EventEmitter(); ankiRes.setEncoding = () => {}; ankiRes.complete = true
        onRes(ankiRes); ankiRes.emit('data', '{"result":1,"error":null}'); ankiRes.emit('end'); ankiRes.emit('close')
        r.emit('error', new Error('socket hang up'))
      }
      return r
    }
    const res = await call(createAnkiProxy({ request: fakeRequest, log: quiet }), { action: 'version' })
    expect(res.body).toBe('{"result":1,"error":null}')
  })
  it('a request() that throws answers notRunning instead of crashing the server', async () => {
    const res = await call(createAnkiProxy({ request: () => { throw new Error('boom') }, log: quiet }), { action: 'version' })
    expect(JSON.parse(res.body).code).toBe('notRunning')
  })
  it('refuses anything but POST', async () => {
    const res = await call(createAnkiProxy({ request: http.request, log: quiet }), null, { method: 'GET' })
    expect(res.statusCode).toBe(405)
  })
})
