// readBlobChecked must tell "nothing stored" apart from "could not read": every writer replaces the
// whole blob (all of a mode's memory hooks, the Discover ledger), so writing after a failed read
// erases what was stored.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const anki = { retrieve: null }
vi.mock('../utils/anki', () => ({
  ankiRetrieveMediaFile: (...a) => anki.retrieve(...a),
  ankiStoreMediaFile: async () => true,
  ankiSyncSoon: () => {},
}))
const { readBlobChecked } = await import('./storage')

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
    expect(await readBlobChecked('hooks', 'Spanish')).toEqual({ ok: true, value: null })
  })
})
