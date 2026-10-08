// End-to-end tests of the data routes extracted from vite.config.js (/api/config, /api/ankiformat,
// /api/deck-progress, /api/discover-store, /api/chats, /api/chat-load, /api/modes/knowledge,
// /api/knowledge-sections): each REAL handler runs on a temp folder, with the dev server's own config,
// deck-folder and mode-folder helpers. Most cases are the clobber family: a read that FAILED must never
// answer as empty, and a save must never replace what it could not read.
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { EventEmitter } from 'events'

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ebiki-routes-'))
process.env.EBIKI_DATA_DIR = DIR
process.env.EBIKI_ENV_DIR = DIR

const { readConfigSettled, writeConfig, deckDirName, modeFolderForName } = await import('../../vite.config.js')
const { createConfigRoute } = await import('./configRoute.js')
const { createAnkiformatRoute } = await import('./ankiformatRoute.js')
const { createDeckProgressRoute } = await import('./deckProgressRoute.js')
const { createDiscoverStoreRoute } = await import('./discoverStoreRoute.js')
const { createChatsRoute, createChatLoadRoute, isSafeChatId } = await import('./chatsRoute.js')
const { createKnowledgeRoutes } = await import('./knowledgeRoute.js')

const dataPath = (...p) => path.join(DIR, ...p)
const readUtf8 = (f) => fs.readFileSync(f, 'utf8').replace(/^﻿/, '')
const writeFileAtomic = (file, data) => { const tmp = `${file}.${process.pid}.tmp`; fs.writeFileSync(tmp, data); fs.renameSync(tmp, file) }
const isConfigPatch = (v) => !!v && typeof v === 'object' && !Array.isArray(v)
const quiet = () => {}

// A request through a handler: body (if any) is streamed like Node does; resolves with the finished response.
function call(route, { method = 'GET', url = '/', body } = {}) {
  return new Promise((resolve, reject) => {
    const req = new EventEmitter(); req.method = method; req.url = url
    const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v }, end(b = '') { this.body = String(b); try { this.json = JSON.parse(this.body) } catch { this.json = undefined } resolve(this) } }
    Promise.resolve(route(req, res)).catch(reject)
    if (body !== undefined) { req.emit('data', typeof body === 'string' ? body : JSON.stringify(body)); req.emit('end') }
  })
}
// A path that exists but cannot be READ as a file (a directory): EISDIR, standing in for a share blip / denied file.
const unreadable = (file) => { fs.mkdirSync(file, { recursive: true }) }

beforeEach(() => { for (const f of fs.readdirSync(DIR)) fs.rmSync(path.join(DIR, f), { recursive: true, force: true }) })
afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }))

describe('/api/config', () => {
  const route = createConfigRoute({ readConfigSettled, writeConfig, isConfigPatch, log: quiet })
  it('GET serves the file, and {} only for a real first run', async () => {
    expect((await call(route)).json).toEqual({})
    fs.writeFileSync(dataPath('config.json'), '﻿' + JSON.stringify({ onboarded: true }))
    expect((await call(route)).json).toEqual({ onboarded: true })
  })
  it('GET on an unreadable config.json is a 503, never an empty config', async () => {
    unreadable(dataPath('config.json'))
    const r = await call(route)
    expect(r.statusCode).toBe(503)
    expect(r.json.unreadable).toBe(true)
  })
  it('POST merges a patch (other keys kept, nested maps merged, __unset paths removed)', async () => {
    fs.writeFileSync(dataPath('config.json'), JSON.stringify({ a: 1, b: 2, aiModels: { x: { chat: 'm', help: 'h' } } }))
    const r = await call(route, { method: 'POST', body: { b: 3, aiModels: { x: { deck: 'd' } }, __unset: [['aiModels', 'x', 'help']] } })
    expect(r.json).toEqual({ ok: true })
    const saved = JSON.parse(readUtf8(dataPath('config.json')))
    expect(saved).toEqual({ a: 1, b: 3, aiModels: { x: { chat: 'm', deck: 'd' } } })
  })
  it('POST refuses non-JSON and non-objects, and leaves the file alone', async () => {
    fs.writeFileSync(dataPath('config.json'), JSON.stringify({ keep: true }))
    for (const body of ['nope', '"text"', '[1,2]', 'null']) {
      const r = await call(route, { method: 'POST', body })
      expect(r.statusCode).toBe(400)
    }
    expect(JSON.parse(readUtf8(dataPath('config.json')))).toEqual({ keep: true })
  })
  it('passes the app language on, read and write', async () => {
    const seen = []
    const r2 = createConfigRoute({ readConfigSettled, writeConfig, isConfigPatch, rememberAppLanguage: (l) => seen.push(l), log: quiet })
    await call(r2, { method: 'POST', body: { appLanguage: 'es' } })
    await call(r2)
    expect(seen).toEqual(['es', 'es'])
  })
  it('other methods are 405', async () => { expect((await call(route, { method: 'PUT' })).statusCode).toBe(405) })
})

describe('/api/ankiformat', () => {
  const route = createAnkiformatRoute({ dataPath, readUtf8, writeFileAtomic })
  it("GET is '{}' only when the file is missing; any other read error is a 500", async () => {
    expect((await call(route)).body).toBe('{}')
    unreadable(dataPath('ankiformat.json'))
    expect((await call(route)).statusCode).toBe(500)
  })
  it('POST saves an object and the GET serves it back', async () => {
    expect((await call(route, { method: 'POST', body: { fields: ['Front'] } })).json).toEqual({ ok: true })
    expect((await call(route)).json).toEqual({ fields: ['Front'] })
  })
  it('POST refuses text, lists and null without touching the file', async () => {
    await call(route, { method: 'POST', body: { a: 1 } })
    for (const body of ['not json', '[1]', 'null', '5']) expect((await call(route, { method: 'POST', body })).statusCode).toBe(400)
    expect((await call(route)).json).toEqual({ a: 1 })
  })
})

describe('/api/deck-progress', () => {
  const route = createDeckProgressRoute({ dataPath, deckDirName, readUtf8, writeFileAtomic, fs, path, log: quiet })
  const q = (deck) => `/?deck=${encodeURIComponent(deck)}`
  it('round-trips notes into the deckDirName folder (never a raw path)', async () => {
    expect((await call(route, { method: 'POST', body: { deck: 'Spanish::Verbs', content: 'notes' } })).json).toEqual({ ok: true })
    expect(fs.existsSync(dataPath('decks', deckDirName('Spanish::Verbs'), 'progress-observations.md'))).toBe(true)
    expect((await call(route, { url: q('Spanish::Verbs') })).json).toEqual({ content: 'notes' })
  })
  it("GET is '' only when missing; an unreadable file is a 500 (Insights must not write over it)", async () => {
    expect((await call(route, { url: q('New') })).json).toEqual({ content: '' })
    unreadable(dataPath('decks', deckDirName('Busy'), 'progress-observations.md'))
    expect((await call(route, { url: q('Busy') })).statusCode).toBe(500)
  })
  it('strips a BOM so the client can JSON-parse the notes', async () => {
    fs.mkdirSync(dataPath('decks', 'D'), { recursive: true })
    fs.writeFileSync(dataPath('decks', 'D', 'progress-observations.md'), '﻿{"x":1}')
    expect((await call(route, { url: q('D') })).json.content).toBe('{"x":1}')
  })
  it('reads a legacy raw-name folder only when the new one is missing, never a path', async () => {
    // Windows: ":" is not a file name, so the case only exists on macOS/Linux.
    try { fs.mkdirSync(dataPath('decks', 'a:b'), { recursive: true }); fs.writeFileSync(dataPath('decks', 'a:b', 'progress-observations.md'), 'legacy') } catch { return }
    expect((await call(route, { url: q('a:b') })).json.content).toBe('legacy')
  })
  it('POST needs a deck and string content (no decks/_, no "undefined" file)', async () => {
    for (const body of [{ content: 'x' }, { deck: '  ', content: 'x' }, { deck: 'D' }, { deck: 'D', content: 5 }]) {
      expect((await call(route, { method: 'POST', body })).statusCode).toBe(400)
    }
    expect(fs.existsSync(dataPath('decks'))).toBe(false)
    expect((await call(route, { method: 'POST', body: 'garbage' })).statusCode).toBe(400)
  })
  it('GET without a deck is a 400', async () => { expect((await call(route, { url: '/' })).statusCode).toBe(400) })
})

describe('/api/discover-store', () => {
  const make = (shared) => createDiscoverStoreRoute({ dataPath, readUtf8, writeFileAtomic, fs, isShared: () => shared })
  it('round-trips a blob and reports whether the folder is shared', async () => {
    const r = make(true)
    expect((await call(r, { method: 'POST', url: '/?kind=ledger&mode=Spanish 1', body: { content: '{"a":1}' } })).json).toEqual({ ok: true })
    expect(fs.existsSync(dataPath('discover', 'ledger__Spanish-1.json'))).toBe(true)
    expect((await call(r, { url: '/?kind=ledger&mode=Spanish 1' })).json).toEqual({ content: '{"a":1}', shared: true })
    expect((await call(make(false), { url: '/?kind=ledger&mode=Spanish 1' })).json.shared).toBe(false)
  })
  it("GET is '' only when missing; an unreadable blob is a 500, never an empty store", async () => {
    expect((await call(make(false), { url: '/?kind=hooks&mode=M' })).json.content).toBe('')
    unreadable(dataPath('discover', 'hooks__M.json'))
    expect((await call(make(false), { url: '/?kind=hooks&mode=M' })).statusCode).toBe(500)
  })
  it('kind and mode are sanitized into the file name (no path escape) and both required', async () => {
    await call(make(false), { method: 'POST', url: '/?kind=../x&mode=../../evil', body: { content: 'c' } })
    expect(fs.readdirSync(dataPath('discover'))).toEqual(['x__..-..-evil.json'])
    expect((await call(make(false), { url: '/?kind=&mode=M' })).statusCode).toBe(400)
    expect((await call(make(false), { url: '/?kind=k' })).statusCode).toBe(400)
  })
  it('a bad POST body is a 400', async () => {
    expect((await call(make(false), { method: 'POST', url: '/?kind=k&mode=m', body: '{' })).statusCode).toBe(400)
  })
})

describe('/api/chats + /api/chat-load', () => {
  const chats = createChatsRoute({ dataPath, readUtf8, writeFileAtomic, fs, path, log: quiet })
  const load = createChatLoadRoute({ dataPath, readUtf8 })
  const msgs = (...t) => t.map((c, i) => ({ role: i % 2 ? 'assistant' : 'user', content: c }))
  it('isSafeChatId refuses anything that could become a path', () => {
    for (const bad of ['../x', 'a/b', 'a.b', '', 'x'.repeat(65), null, 5]) expect(isSafeChatId(bad)).toBe(false)
    expect(isSafeChatId('1700000000000')).toBe(true)
  })
  it('saves a new chat, lists it by FILE name and loads it', async () => {
    const r = await call(chats, { method: 'POST', body: { title: 'Hi', messages: msgs('a', 'b') } })
    expect(r.json.ok).toBe(true)
    const id = r.json.id
    fs.writeFileSync(dataPath('chats', 'other.json'), JSON.stringify({ id: 'lie', title: 'O', messages: [] }))
    const list = (await call(chats)).json
    expect(list.map((c) => c.id).sort()).toEqual([id, 'other'].sort())
    expect(list.find((c) => c.id === id)).toMatchObject({ title: 'Hi', messageCount: 2 })
    expect(list[0].messages).toBeUndefined()
    expect((await call(load, { url: `/?id=${id}` })).json.messages).toHaveLength(2)
  })
  it('an unparseable file is skipped in the list, not a 500', async () => {
    fs.mkdirSync(dataPath('chats'), { recursive: true })
    fs.writeFileSync(dataPath('chats', 'bad.json'), '{')
    expect((await call(chats)).json).toEqual([])
  })
  it('a save whose messages do not extend the disk copy FORKS instead of erasing turns', async () => {
    const { id } = (await call(chats, { method: 'POST', body: { messages: msgs('a', 'b') } })).json
    const r = await call(chats, { method: 'POST', body: { id, messages: msgs('z') } })
    expect(r.json.forked).toBe(true)
    expect(r.json.id).not.toBe(id)
    expect(JSON.parse(readUtf8(dataPath('chats', `${id}.json`))).messages).toHaveLength(2)
  })
  it('a same-history save extends the chat in place', async () => {
    const { id } = (await call(chats, { method: 'POST', body: { messages: msgs('a', 'b') } })).json
    const r = await call(chats, { method: 'POST', body: { id, messages: msgs('a', 'b', 'c') } })
    expect(r.json).toEqual({ id, ok: true })
    expect(JSON.parse(readUtf8(dataPath('chats', `${id}.json`))).messages).toHaveLength(3)
  })
  it('an unreadable disk copy refuses the save (503) and leaves it alone', async () => {
    unreadable(dataPath('chats', '123.json'))
    const r = await call(chats, { method: 'POST', body: { id: '123', messages: msgs('a') } })
    expect(r.statusCode).toBe(503)
    expect(fs.statSync(dataPath('chats', '123.json')).isDirectory()).toBe(true)
  })
  it('a truly corrupt disk copy is kept aside and the save becomes the chat', async () => {
    fs.mkdirSync(dataPath('chats'), { recursive: true })
    fs.writeFileSync(dataPath('chats', '42.json'), '{"messages": [')
    const r = await call(chats, { method: 'POST', body: { id: '42', messages: msgs('a') } })
    expect(r.json).toEqual({ id: '42', ok: true })
    expect(fs.readdirSync(dataPath('chats')).some((f) => f.startsWith('42.json.corrupt-'))).toBe(true)
  })
  it('refuses a save with no message list or an unsafe id', async () => {
    expect((await call(chats, { method: 'POST', body: { title: 'x' } })).statusCode).toBe(400)
    expect((await call(chats, { method: 'POST', body: { id: '../evil', messages: [] } })).statusCode).toBe(400)
    expect((await call(chats, { method: 'POST', body: 'nope' })).statusCode).toBe(400)
  })
  it('DELETE removes only a safe id', async () => {
    const { id } = (await call(chats, { method: 'POST', body: { messages: msgs('a') } })).json
    expect((await call(chats, { method: 'DELETE', url: '/?id=../config' })).statusCode).toBe(400)
    expect((await call(chats, { method: 'DELETE', url: `/?id=${id}` })).json).toEqual({ ok: true })
    expect(fs.existsSync(dataPath('chats', `${id}.json`))).toBe(false)
  })
  it('chat-load: 404 only when missing, 500 when unreadable, 400 for an unsafe id, BOM stripped', async () => {
    expect((await call(load, { url: '/?id=nope' })).statusCode).toBe(404)
    unreadable(dataPath('chats', 'dir.json'))
    expect((await call(load, { url: '/?id=dir' })).statusCode).toBe(500)
    expect((await call(load, { url: '/?id=../x' })).statusCode).toBe(400)
    fs.writeFileSync(dataPath('chats', 'bom.json'), '﻿{"messages":[]}')
    expect((await call(load, { url: '/?id=bom' })).json).toEqual({ messages: [] })
  })
})

describe('/api/modes/knowledge + /api/knowledge-sections', () => {
  const { knowledge, sections } = createKnowledgeRoutes({ dataPath, modeFolderForName, readUtf8, writeFileAtomic, fs, path })
  const kdir = () => dataPath('modes', modeFolderForName(dataPath('modes'), 'Book'), 'knowledge')
  const up = (filename, content, replace) => call(knowledge, { method: 'POST', url: '/?mode=Book', body: { filename, content, ...(replace ? { replace } : {}) } })
  it('uploads, lists with content and outline, and slices sections', async () => {
    expect((await up('book.md', '# One\nfirst\n# Two\nsecond')).json).toEqual({ ok: true, filename: 'book.md' })
    const g = (await call(knowledge, { url: '/?mode=Book' })).json
    expect(g.fileCount).toBe(1)
    expect(g.files).toEqual([{ name: 'book.md', disabled: false, size: expect.any(Number) }])
    expect(g.content).toContain('--- book.md ---')
    expect(g.outline.map((h) => h.title)).toEqual(['One', 'Two'])
    const s = (await call(sections, { url: '/?mode=Book&sections=1' })).json
    expect(s.titles).toEqual(['Two'])
    expect(s.content).toContain('second')
    expect(s.content).not.toContain('first')
  })
  it('no mode = empty answers, never an error', async () => {
    expect((await call(knowledge, { url: '/' })).json).toEqual({ files: [], content: null, fileCount: 0 })
    expect((await call(sections, { url: '/' })).json).toEqual({ content: '', titles: [] })
  })
  it('a knowledge folder that cannot be read is a 500, never "no files"', async () => {
    fs.mkdirSync(path.dirname(kdir()), { recursive: true })
    fs.writeFileSync(kdir(), 'not a folder')
    expect((await call(knowledge, { url: '/?mode=Book' })).statusCode).toBe(500)
  })
  it('a clashing name (any case, or switched off) is a 409 unless replace is sent', async () => {
    await up('Notes.txt', 'old')
    const r = await up('notes.txt', 'new')
    expect(r.statusCode).toBe(409)
    expect(r.json).toEqual({ exists: true, filename: 'Notes.txt' })
    expect(readUtf8(path.join(kdir(), 'Notes.txt'))).toBe('old')
    expect((await up('notes.txt', 'new', true)).json.ok).toBe(true)
    const names = fs.readdirSync(kdir()).map((f) => f.toLowerCase())
    expect(names).toEqual(['notes.txt'])
  })
  it('an upload replacing a switched-off copy removes it (no duplicate listed)', async () => {
    await up('a.txt', 'v1')
    await call(knowledge, { method: 'PATCH', url: '/?mode=Book&file=a.txt&disabled=1' })
    expect((await up('a.txt', 'v2')).statusCode).toBe(409)
    await up('a.txt', 'v2', true)
    expect(fs.readdirSync(kdir())).toEqual(['a.txt'])
  })
  it('only .txt/.md, never "." or ".."', async () => {
    for (const n of ['x.pdf', 'x.exe', '..', '.']) expect((await up(n, 'c')).statusCode).toBe(400)
  })
  it('PATCH toggles to the state asked, keeps both copies when both exist', async () => {
    await up('k.txt', 'live')
    expect((await call(knowledge, { method: 'PATCH', url: '/?mode=Book&file=k.txt&disabled=1' })).json).toEqual({ ok: true, disabled: true })
    expect((await call(knowledge, { method: 'PATCH', url: '/?mode=Book&file=k.txt&disabled=1' })).json).toEqual({ ok: true, disabled: true })
    fs.writeFileSync(path.join(kdir(), 'k.txt'), 'other computer')
    expect((await call(knowledge, { method: 'PATCH', url: '/?mode=Book&file=k.txt&disabled=0' })).json).toEqual({ ok: true, disabled: false })
    expect(readUtf8(path.join(kdir(), 'k.txt'))).toBe('other computer')
    expect(fs.readdirSync(kdir()).some((f) => f.includes('(kept '))).toBe(true)
    expect((await call(knowledge, { method: 'PATCH', url: '/?mode=Book&file=gone.txt' })).statusCode).toBe(404)
    expect((await call(knowledge, { method: 'PATCH', url: '/?mode=Book&file=..' })).statusCode).toBe(400)
  })
  it('DELETE removes the copy asked for, and refuses the folder itself', async () => {
    await up('d.txt', 'live')
    fs.writeFileSync(path.join(kdir(), 'd.txt.disabled'), 'off')
    expect((await call(knowledge, { method: 'DELETE', url: '/?mode=Book&file=d.txt&disabled=1' })).json).toEqual({ ok: true })
    expect(fs.readdirSync(kdir())).toEqual(['d.txt'])
    expect((await call(knowledge, { method: 'DELETE', url: '/?mode=Book&file=..' })).statusCode).toBe(400)
    expect((await call(knowledge, { method: 'DELETE', url: '/?mode=Book' })).statusCode).toBe(400)
  })
  it('sections caps are bounded and indices limited to 8', async () => {
    await up('b.md', Array.from({ length: 12 }, (_, i) => `# H${i}\n${'x'.repeat(50)}`).join('\n'))
    const s = (await call(sections, { url: '/?mode=Book&sections=0,1,2,3,4,5,6,7,8,9&cap=-5' })).json
    expect(s.titles).toHaveLength(8)
    expect(s.content.length).toBeGreaterThan(0)
  })
})
