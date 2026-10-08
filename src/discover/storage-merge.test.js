// A write that reached Anki but NOT the shared store marks the blob "Anki is newer". Once the share is back, the
// share may ALSO hold newer items (another computer wrote meanwhile). For kinds with a merge, the read merges both
// copies and writes the result to both, so neither side's items are lost.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const anki = { retrieve: null, store: async () => true, stored: [] }
vi.mock('../cards', () => ({
  srs: {
    readFile: (...a) => anki.retrieve(...a),
    storeFile: (...a) => anki.store(...a),
    syncSoon: () => {},
    blobFileName: (kind, key) => `_ebiki_${kind}__${key}.json`,
    legacyBlobFileName: (kind, key) => `_screenlens/${kind}__${key}.json`,
  },
}))
const { readBlobChecked, writeBlob, setBlobWritesPaused } = await import('./storage')
const { mergeHooks, mergeDupIgnore, BLOB_MERGERS } = await import('./merge')

const b64 = (obj) => Buffer.from(JSON.stringify(obj), 'utf8').toString('base64')
const unb64 = (s) => JSON.parse(Buffer.from(s, 'base64').toString('utf8'))
const reply = (status, body) => ({ ok: status === 200, status, json: async () => body })
const mem = new Map()
let store, storePosts
const flush = () => new Promise((r) => setTimeout(r, 0))

beforeEach(() => {
  mem.clear()
  globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) }
  store = { down: false, content: '', shared: true, status: null }
  storePosts = []
  anki.stored = []
  anki.store = async (name, data) => { anki.stored.push(unb64(data)) }
  globalThis.fetch = vi.fn(async (url, init) => {
    if (init && init.method === 'POST') {
      if (store.down) return reply(503, { unreachable: true })
      const { content } = JSON.parse(init.body)
      storePosts.push(JSON.parse(content))
      store.content = content
      return reply(200, { ok: true })
    }
    if (store.down) return reply(503, { unreachable: true })
    if (store.status) return reply(store.status, { error: 'EIO' })
    return reply(200, { content: store.content, shared: store.shared })
  })
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => { delete globalThis.localStorage; setBlobWritesPaused(false); vi.restoreAllMocks() })

// This computer saves while the share is down: Anki takes it, the store does not (Anki marked newer).
const offlineWrite = async (kind, mode, value) => {
  store.down = true
  await writeBlob(kind, mode, value)
  store.down = false
  anki.stored = []
  anki.retrieve = async () => b64(value)
}

describe('merge helpers', () => {
  it('mergeHooks unions each key, first copy order first, no duplicates', () => {
    expect(mergeHooks({ 1: ['a', 'b'], w: ['x'] }, { 1: ['b', 'c'], 2: ['d'] })).toEqual({ 1: ['a', 'b', 'c'], w: ['x'], 2: ['d'] })
    expect(mergeHooks(null, { 1: ['a'] })).toEqual({ 1: ['a'] })
    expect(mergeHooks(['junk'], { 1: ['a'] })).toEqual({ 1: ['a'] })
    expect(mergeHooks({ 1: 'not a list', 2: ['a', null] }, {})).toEqual({ 2: ['a'] })
  })
  it('mergeDupIgnore unions the pairs', () => {
    expect(mergeDupIgnore({ pairs: ['1|2'] }, { pairs: ['1|2', '3|4'] })).toEqual({ pairs: ['1|2', '3|4'] })
    expect(mergeDupIgnore({ pairs: null }, { pairs: ['5|6'] })).toEqual({ pairs: ['5|6'] })
  })
  it('grammar merge keeps one entry per slip (larger count, later time)', () => {
    const m = BLOB_MERGERS.grammar([{ t: 'Ser vs estar', n: 2, at: 5 }], [{ t: 'ser  VS estar', n: 3, at: 2 }, { t: 'Por/para', n: 1, at: 9 }])
    expect(m).toEqual([{ t: 'Ser vs estar', n: 3, at: 5 }, { t: 'Por/para', n: 1, at: 9 }])
  })
})

describe('Anki newer, share back with another computer\'s edits', () => {
  it('hooks: both copies merge, the result is written to Anki and the store, and the mark clears', async () => {
    await offlineWrite('hooks', 'Spanish', { 1: ['mine (offline)'] })
    store.content = JSON.stringify({ 1: ['theirs'], 2: ['theirs too'] })     // the other computer wrote meanwhile
    const r = await readBlobChecked('hooks', 'Spanish')
    expect(r.ok).toBe(true)
    expect(r.value).toEqual({ 1: ['mine (offline)', 'theirs'], 2: ['theirs too'] })
    await flush(); await flush()
    expect(anki.stored.at(-1)).toEqual(r.value)
    expect(storePosts.at(-1)).toEqual(r.value)
    // Mark cleared: the next read takes the (shared) store first again and does not merge.
    anki.retrieve = async () => b64({ 1: ['stale anki'] })
    expect((await readBlobChecked('hooks', 'Spanish')).value).toEqual(r.value)
  })

  it('ledger, grammar and dupignore merge too', async () => {
    await offlineWrite('ledger', 'Spanish', { known: ['gato'], declined: [], carded: [], offered: ['gato'] })
    store.content = JSON.stringify({ known: [], declined: ['perro'], carded: [], offered: ['perro'] })
    const led = (await readBlobChecked('ledger', 'Spanish')).value
    expect(led.known).toEqual(['gato'])
    expect(led.declined).toEqual(['perro'])
    expect(led.offered.sort()).toEqual(['gato', 'perro'])

    await offlineWrite('grammar', 'Spanish', [{ t: 'Ser vs estar', n: 1, at: 10 }])
    store.content = JSON.stringify([{ t: 'Por/para', n: 2, at: 5 }])
    expect((await readBlobChecked('grammar', 'Spanish')).value.map((e) => e.t)).toEqual(['Por/para', 'Ser vs estar'])

    await offlineWrite('dupignore', 'Deck', { pairs: ['1|2'] })
    store.content = JSON.stringify({ pairs: ['3|4'] })
    expect((await readBlobChecked('dupignore', 'Deck')).value.pairs.sort()).toEqual(['1|2', '3|4'])
  })

  it('the store empty (nothing written there) takes Anki\'s copy and pushes it to the store', async () => {
    await offlineWrite('hooks', 'Spanish', { 1: ['mine'] })
    store.content = ''
    expect((await readBlobChecked('hooks', 'Spanish')).value).toEqual({ 1: ['mine'] })
    await flush(); await flush()
    expect(storePosts.at(-1)).toEqual({ 1: ['mine'] })
  })

  it('a kind with no merge (the profile) keeps the old rule: Anki\'s copy, no merge', async () => {
    await offlineWrite('profile', 'Spanish', { level: 'mine' })
    store.content = JSON.stringify({ level: 'theirs' })
    expect((await readBlobChecked('profile', 'Spanish')).value).toEqual({ level: 'mine' })
    await flush()
    expect(storePosts).toEqual([])
  })
})

describe('failed sides are never treated as empty', () => {
  it('Anki unreachable while it holds the newer copy: a FAILED read (the store copy is missing our items)', async () => {
    await offlineWrite('hooks', 'Spanish', { 1: ['mine'] })
    store.content = JSON.stringify({ 2: ['theirs'] })
    anki.retrieve = async () => { throw new Error('Anki is not running') }
    expect(await readBlobChecked('hooks', 'Spanish')).toEqual({ ok: false, value: null })
    expect(storePosts).toEqual([])
  })

  it('the share still down (503): Anki\'s copy is read as before, nothing is written', async () => {
    await offlineWrite('hooks', 'Spanish', { 1: ['mine'] })
    store.down = true
    expect(await readBlobChecked('hooks', 'Spanish')).toEqual({ ok: true, value: { 1: ['mine'] } })
    await flush()
    expect(anki.stored).toEqual([])
  })

  it('a store read error (500) on a shared store: Anki\'s copy, no merge, the mark stays', async () => {
    await offlineWrite('hooks', 'Spanish', { 1: ['mine'] })
    store.status = 500
    expect((await readBlobChecked('hooks', 'Spanish')).value).toEqual({ 1: ['mine'] })
    store.status = null
    store.content = JSON.stringify({ 2: ['theirs'] })
    expect((await readBlobChecked('hooks', 'Spanish')).value).toEqual({ 1: ['mine'], 2: ['theirs'] })
  })
})

describe('the merge write-back respects the write queue and the freeze', () => {
  it('a write made after the read wins: the merge write-back is skipped', async () => {
    await offlineWrite('hooks', 'Spanish', { 1: ['mine'] })
    store.content = JSON.stringify({ 2: ['theirs'] })
    let release
    anki.store = (name, data) => new Promise((r) => { release = () => { anki.stored.push(unb64(data)); r() } })
    const merged = (await readBlobChecked('hooks', 'Spanish')).value
    const next = { ...merged, 3: ['newest'] }
    const w = writeBlob('hooks', 'Spanish', next)          // the caller's write, from the merged read
    await flush()
    release && release()                                     // whichever store call is pending lands
    await flush(); await flush()
    release && release()
    await w
    expect(anki.stored.at(-1)).toEqual(next)
    expect(storePosts.at(-1)).toEqual(next)
  })

  it('writes paused (data-folder switch): the merge is returned but nothing is written', async () => {
    await offlineWrite('hooks', 'Spanish', { 1: ['mine'] })
    store.content = JSON.stringify({ 2: ['theirs'] })
    setBlobWritesPaused(true)
    expect((await readBlobChecked('hooks', 'Spanish')).value).toEqual({ 1: ['mine'], 2: ['theirs'] })
    await flush(); await flush()
    expect(anki.stored).toEqual([])
    expect(storePosts).toEqual([])
  })
})
