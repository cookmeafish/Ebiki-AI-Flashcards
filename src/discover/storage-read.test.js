// readBlobChecked must tell "nothing stored" apart from "could not read": every writer replaces the
// whole blob (all of a mode's memory hooks, the Discover ledger), so writing after a failed read
// erases what was stored.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const anki = { retrieve: null, store: async () => true }
vi.mock('../cards', () => ({
  srs: {
    readFile: (...a) => anki.retrieve(...a),
    storeFile: (...a) => anki.store(...a),
    syncSoon: () => {},
    blobFileName: (kind, key) => `_ebiki_${kind}__${key}.json`,
    legacyBlobFileName: (kind, key) => `_screenlens/${kind}__${key}.json`,
  },
}))
const { readBlobChecked, writeBlob } = await import('./storage')

const b64 = (obj) => Buffer.from(JSON.stringify(obj), 'utf8').toString('base64')
let local
beforeEach(() => {
  globalThis.fetch = vi.fn(async () => local)
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())
const reply = (status, body) => ({ ok: status === 200, status, json: async () => body })

describe('readBlobChecked', () => {
  it('reads from Anki when it has the blob', async () => {
    anki.retrieve = async () => b64({ '1': ['hook'] })
    expect(await readBlobChecked('hooks', 'Spanish')).toEqual({ ok: true, value: { '1': ['hook'] } })
  })

  it('nothing in Anki and nothing locally is a real, writable "empty"', async () => {
    anki.retrieve = async () => false
    local = reply(200, { content: '' })
    expect(await readBlobChecked('hooks', 'Spanish')).toEqual({ ok: true, value: null })
  })

  it('Anki down but the local copy answers: that copy is used', async () => {
    anki.retrieve = async () => { throw new Error('Anki is not running') }
    local = reply(200, { content: JSON.stringify({ '2': ['x'] }) })
    expect(await readBlobChecked('hooks', 'Spanish')).toEqual({ ok: true, value: { '2': ['x'] } })
  })

  it('Anki down and the local copy EMPTY is NOT a safe empty (Anki may hold data)', async () => {
    anki.retrieve = async () => { throw new Error('Anki is not running') }
    local = reply(200, { content: '' })
    expect((await readBlobChecked('hooks', 'Spanish')).ok).toBe(false)
  })

  it('shared folder down (503) with nothing in Anki is a failed read', async () => {
    anki.retrieve = async () => false
    local = reply(503, { unreachable: true })
    expect((await readBlobChecked('hooks', 'Spanish')).ok).toBe(false)
  })

  it('a damaged blob counts as read, so it can be replaced instead of blocking writes forever', async () => {
    anki.retrieve = async () => Buffer.from('{not json', 'utf8').toString('base64')
    local = reply(200, { content: '' })
    expect(await readBlobChecked('hooks', 'Spanish')).toEqual({ ok: true, value: null })
  })

  it('a SHARED data folder copy wins over this computer\'s Anki (which lags behind through AnkiWeb)', async () => {
    anki.retrieve = async () => b64({ '1': ['old'] })
    local = reply(200, { content: JSON.stringify({ '1': ['old', 'from the other computer'] }), shared: true })
    expect(await readBlobChecked('hooks', 'Spanish')).toEqual({ ok: true, value: { '1': ['old', 'from the other computer'] } })
  })

  it('an app-folder (not shared) store still reads Anki first', async () => {
    anki.retrieve = async () => b64({ '1': ['synced'] })
    local = reply(200, { content: JSON.stringify({ '1': ['stale'] }), shared: false })
    expect(await readBlobChecked('hooks', 'Spanish')).toEqual({ ok: true, value: { '1': ['synced'] } })
  })
})

describe('"local is newer" mark', () => {
  const mem = new Map()
  beforeEach(() => {
    mem.clear()
    globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) }
  })
  afterEach(() => { delete globalThis.localStorage; anki.store = async () => true })

  it("with the newer copy only local, a refused local read is a FAILED read (never Anki's older copy)", async () => {
    local = reply(200, { ok: true })
    anki.store = async () => { throw new Error('Anki is not running') }
    await writeBlob('grammar', 'French', { v: 1 })            // local only: marked newer
    local = reply(503, { unreachable: true })                 // the share is down
    anki.retrieve = async () => b64({ v: 0 })
    expect(await readBlobChecked('grammar', 'French')).toEqual({ ok: false, value: null })
  })

  it("a read's push-back never clears the mark set by a write that failed to reach Anki meanwhile", async () => {
    local = reply(200, { content: JSON.stringify({ v: 1 }) })
    anki.store = async () => { throw new Error('Anki is not running') }
    await writeBlob('hooks', 'Spanish', { v: 1 })             // local only: marked newer
    let release
    anki.store = () => new Promise((r) => { release = r })     // the read's push-back hangs
    anki.retrieve = async () => b64({ v: 0 })
    expect((await readBlobChecked('hooks', 'Spanish')).value).toEqual({ v: 1 })
    await new Promise((r) => setTimeout(r, 0))                // the push-back starts and hangs
    const pushBack = release
    anki.store = async () => { throw new Error('Anki is not running') }
    const w = writeBlob('hooks', 'Spanish', { v: 2 })         // queued behind the push; fails to reach Anki
    local = reply(200, { content: JSON.stringify({ v: 2 }) })
    pushBack(true)                                            // the older push lands first
    await w
    anki.store = async () => true
    expect((await readBlobChecked('hooks', 'Spanish')).value).toEqual({ v: 2 })
  })
  it('two quick writes of one blob store the NEWER one last', async () => {
    const stored = []
    let slow = true
    anki.store = async (name, data) => { if (slow) { slow = false; await new Promise((r) => setTimeout(r, 20)) } stored.push(data) }
    const a = writeBlob('hooks', 'French', { v: 1 })
    const b = writeBlob('hooks', 'French', { v: 2 })
    await Promise.all([a, b])
    expect(JSON.parse(Buffer.from(stored[stored.length - 1], 'base64').toString())).toEqual({ v: 2 })
  })
})

describe('shared store refused (the share is down)', () => {
  const mem = new Map()
  beforeEach(() => {
    mem.clear()
    globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) }
  })
  afterEach(() => { delete globalThis.localStorage; anki.store = async () => true })

  it("a 503 unreachable share is a FAILED read even when Anki holds a (possibly older) copy", async () => {
    anki.retrieve = async () => b64({ '1': ['older, from Anki'] })
    local = reply(503, { unreachable: true })
    expect(await readBlobChecked('hooks', 'Spanish')).toEqual({ ok: false, value: null })
  })

  it('a read error on a store KNOWN to be shared is a failed read too', async () => {
    anki.retrieve = async () => b64({ v: 0 })
    local = reply(200, { content: JSON.stringify({ v: 1 }), shared: true })
    expect((await readBlobChecked('grammar', 'French')).value).toEqual({ v: 1 }) // learns: shared
    local = reply(500, { error: 'EIO' })
    expect((await readBlobChecked('grammar', 'French')).ok).toBe(false)
  })

  it('an app-folder store that errors still reads Anki (Anki is its source of truth)', async () => {
    anki.retrieve = async () => b64({ v: 3 })
    local = reply(200, { content: '', shared: false })
    await readBlobChecked('grammar', 'French')                // learns: not shared
    local = reply(500, { error: 'EIO' })
    expect(await readBlobChecked('grammar', 'French')).toEqual({ ok: true, value: { v: 3 } })
  })

  it("Anki marked newer (the share missed our last write) still reads Anki while the share is down", async () => {
    local = reply(503, { unreachable: true })
    await writeBlob('hooks', 'German', { v: 9 })               // Anki took it, the store did not: Anki newer
    anki.retrieve = async () => b64({ v: 9 })
    expect(await readBlobChecked('hooks', 'German')).toEqual({ ok: true, value: { v: 9 } })
  })
})
