// Security / robustness sweep of the split server routes: hostile or malformed client input (non-object bodies,
// non-string content, device and control-character file names, dot-only deck names, Anki actions that reach outside
// the collection). Each REAL handler runs on a temp folder, like dataRoutes.test.js.
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import crypto from 'crypto'
import { EventEmitter } from 'events'

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ebiki-harden-'))
process.env.EBIKI_DATA_DIR = DIR
process.env.EBIKI_ENV_DIR = DIR

const { deckDirName, modeFolderForName } = await import('../../vite.config.js')
const { createDeckProgressRoute } = await import('./deckProgressRoute.js')
const { createDiscoverStoreRoute } = await import('./discoverStoreRoute.js')
const { createKnowledgeRoutes, knowledgeFileName } = await import('./knowledgeRoute.js')
const { createAnkiProxy, refusedAnkiAction } = await import('./ankiProxy.js')
const featureData = (await import('../features/storage-server.js')).default
const game = (await import('../features/game/server.js')).default

const dataPath = (...p) => path.join(DIR, ...p)
const readUtf8 = (f) => fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, '')
const writeFileAtomic = (file, data) => { const tmp = `${file}.${process.pid}.tmp`; fs.writeFileSync(tmp, data); fs.renameSync(tmp, file) }
const quiet = () => {}

function call(route, { method = 'GET', url = '/', body } = {}) {
  return new Promise((resolve, reject) => {
    const req = new EventEmitter(); req.method = method; req.url = url
    const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v }, end(b = '') { this.body = String(b); this.writableEnded = true; try { this.json = JSON.parse(this.body) } catch { this.json = undefined } resolve(this) } }
    Promise.resolve(route(req, res)).catch(reject)
    if (body !== undefined) { setTimeout(() => { req.emit('data', typeof body === 'string' ? body : JSON.stringify(body)); req.emit('end') }, 0) }
  })
}

beforeEach(() => { for (const f of fs.readdirSync(DIR)) fs.rmSync(path.join(DIR, f), { recursive: true, force: true }) })
afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }))

describe('/api/modes/knowledge upload names and bodies', () => {
  const { knowledge, sections } = createKnowledgeRoutes({ dataPath, modeFolderForName, readUtf8, writeFileAtomic, fs, path })
  const kdir = () => dataPath('modes', 'Book', 'knowledge')

  it('stores a Windows device name under a safe name (the write went to the device on Windows 10)', async () => {
    for (const [given, stored] of [['con.txt', 'con_.txt'], ['NUL.md', 'NUL_.md'], ['com1.txt', 'com1_.txt'], ['Aux .txt', 'Aux_ .txt'], ['lpt\u00b9.txt', 'lpt\u00b9_.txt'], ['conference.txt', 'conference.txt'], ['console.md', 'console.md'], ['com10.txt', 'com10.txt']]) {
      expect(knowledgeFileName(given), given).toBe(stored)
    }
    const r = await call(knowledge, { method: 'POST', url: '/?mode=Book', body: { filename: 'con.txt', content: 'hola' } })
    expect(r.json).toEqual({ ok: true, filename: 'con_.txt' })
    expect(fs.readFileSync(path.join(kdir(), 'con_.txt'), 'utf8')).toBe('hola')
  })

  it('drops control characters and path characters from the name', async () => {
    expect(knowledgeFileName('a\nb\u0000c\u007f.txt')).toBe('abc.txt')
    expect(knowledgeFileName('..\\..\\x/../y.txt')).toBe('....x..y.txt')
    const r = await call(knowledge, { method: 'POST', url: '/?mode=Book', body: { filename: '../../evil\r\n.txt', content: 'x' } })
    expect(r.json).toEqual({ ok: true, filename: '....evil.txt' })
    expect(fs.readdirSync(kdir())).toEqual(['....evil.txt'])
    expect(fs.existsSync(dataPath('evil.txt'))).toBe(false)
  })

  it('refuses a body that is not an upload object, or content that is not text, and creates nothing', async () => {
    for (const body of ['null', '[1]', '"x"', { filename: 'a.txt' }, { filename: 'a.txt', content: 5 }, { filename: 'a.txt', content: { a: 1 } }, { filename: ['a.txt'], content: 'x' }]) {
      const r = await call(knowledge, { method: 'POST', url: '/?mode=Book', body })
      expect(r.statusCode, JSON.stringify(body)).toBe(400)
    }
    expect(fs.existsSync(dataPath('modes', 'Book'))).toBe(false)
  })

  it('a sections read that FAILS is a 500 (same body shape), not an empty answer', async () => {
    fs.mkdirSync(kdir(), { recursive: true })
    fs.mkdirSync(path.join(kdir(), 'book.txt')) // listed as a .txt but unreadable (EISDIR)
    const r = await call(sections, { url: '/?mode=Book&sections=0' })
    expect(r.statusCode).toBe(500)
    expect(r.json).toMatchObject({ content: '', titles: [] })
  })
})

describe('/api/discover-store POST', () => {
  const route = createDiscoverStoreRoute({ dataPath, readUtf8, writeFileAtomic, fs })
  it('refuses a body with no text content and leaves the stored blob alone', async () => {
    fs.mkdirSync(dataPath('discover'), { recursive: true })
    fs.writeFileSync(dataPath('discover', 'hooks__Spanish.json'), '{"keep":true}')
    for (const body of ['null', '[]', '{}', { content: 7 }, { content: { a: 1 } }, { content: null }]) {
      const r = await call(route, { method: 'POST', url: '/?kind=hooks&mode=Spanish', body })
      expect(r.statusCode, JSON.stringify(body)).toBe(400)
    }
    expect(fs.readFileSync(dataPath('discover', 'hooks__Spanish.json'), 'utf8')).toBe('{"keep":true}')
  })
  it('query values never leave discover/', async () => {
    const r = await call(route, { method: 'POST', url: '/?kind=../hooks&mode=..%2F..%2Fx', body: { content: 'v' } })
    expect(r.json).toEqual({ ok: true })
    expect(fs.readdirSync(dataPath('discover'))).toEqual(['hooks__..-..-x.json'])
  })
})

describe('/api/deck-progress legacy read', () => {
  const route = createDeckProgressRoute({ dataPath, deckDirName, readUtf8, writeFileAtomic, fs, path, log: quiet })
  it('never reads a progress file outside a deck folder through a dots-only deck name', async () => {
    fs.mkdirSync(dataPath('decks'), { recursive: true })
    fs.writeFileSync(dataPath('decks', 'progress-observations.md'), 'NOT A DECK')
    fs.writeFileSync(dataPath('progress-observations.md'), 'NOT A DECK EITHER')
    for (const deck of ['.', '..', '...', ' ..', '. .', '../x', '..\\x']) {
      const r = await call(route, { url: `/?deck=${encodeURIComponent(deck)}` })
      expect(r.json, deck).toEqual({ content: '' })
    }
  })
})

describe('/api/anki proxy refuses actions that reach outside the collection', () => {
  it('names them, also inside multi, and lets everything Ebiki sends through', () => {
    for (const b of [
      { action: 'importPackage', params: { path: 'C:/x.apkg' } },
      { action: 'exportPackage', params: { deck: 'D', path: '/tmp/x' } },
      { action: 'guiImportFile', params: { path: '/etc/passwd' } },
      { action: 'storeMediaFile', params: { filename: 'a.mp3', path: 'C:/Users/u/.ssh/id_rsa' } },
      { action: 'storeMediaFile', params: { filename: 'a.mp3', url: 'http://169.254.169.254/' } },
      { action: 'multi', params: { actions: [{ action: 'deckNames' }, { action: 'ImportPackage', params: { path: 'x' } }] } },
      { action: 'multi', params: { actions: [{ action: 'multi', params: { actions: [{ action: 'storeMediaFile', params: { url: 'file:///c:/x' } }] } }] } },
    ]) expect(refusedAnkiAction(JSON.stringify(b)), JSON.stringify(b)).not.toBe('')
    for (const b of [
      { action: 'storeMediaFile', params: { filename: '_ebiki_x.json', data: 'e30=' } },
      { action: 'retrieveMediaFile', params: { filename: '_ebiki_x.json' } },
      { action: 'deckNames' }, { action: 'sync' }, { action: 'multi', params: { actions: [{ action: 'deckNames' }] } },
    ]) expect(refusedAnkiAction(JSON.stringify(b))).toBe('')
    for (const b of ['', 'not json', 'null', '[1]']) expect(refusedAnkiAction(b)).toBe('')
  })
  it('answers 403 {code:"refused"} without contacting Anki', async () => {
    let contacted = false
    const proxy = createAnkiProxy({ request: () => { contacted = true; throw new Error('no') }, log: { log() {} } })
    const r = await call(proxy, { method: 'POST', body: { action: 'storeMediaFile', version: 6, params: { filename: 'a', path: 'C:/secret' } } })
    expect(r.statusCode).toBe(403)
    expect(r.json.code).toBe('refused')
    expect(contacted).toBe(false)
  })
})

// The feature server halves, through a stand-in for connect's `use`.
function mount(feature) {
  const routes = {}
  feature.register({ middlewares: { use: (p, fn) => { routes[p] = fn } } }, { dataPath, readUtf8, writeFileAtomic, appRoot: DIR, fs, path, crypto })
  return routes
}

describe('feature server halves refuse bodies that are not objects', () => {
  it('/api/feature-data: null / list / string body is a 400, never a 500', async () => {
    const r = mount(featureData)['/api/feature-data']
    for (const body of ['null', '[1]', '"x"', '{}']) {
      const res = await call(r, { method: 'POST', url: '/?feature=legends&key=map-1', body })
      expect(res.statusCode, body).toBe(400)
    }
    expect(fs.existsSync(dataPath('features', 'legends', 'map-1.json'))).toBe(false)
    expect((await call(r, { url: '/?feature=..&key=x' })).statusCode).toBe(400)
    expect((await call(r, { url: '/?feature=legends&key=..%2Fx' })).statusCode).toBe(400)
  })
  it('/api/players, /api/player-local, /api/game-inbox: a null or list body is a 400', async () => {
    const routes = mount(game)
    for (const p of ['/api/players', '/api/player-local', '/api/game-inbox']) {
      for (const body of ['null', '[1]']) {
        const res = await call(routes[p], { method: 'POST', body })
        expect(res.statusCode, `${p} ${body}`).toBe(400)
      }
    }
    const bad = await call(routes['/api/players'], { method: 'POST', body: { player: { id: 'abcdef12', days: null } } })
    expect(bad.statusCode).toBe(400)
    const trav = await call(routes['/api/players'], { method: 'POST', body: { player: { id: '../../x', days: {} } } })
    expect(trav.statusCode).toBe(400)
    expect(fs.existsSync(dataPath('players'))).toBe(false)
  })
})
