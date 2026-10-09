// Deeper scenarios for the mode folders (each folder holds a mode's config AND its knowledge base): the
// current client always sends deletedIds, changedIds and renamedIds, so these mirror its real saves.
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ebiki-modes-deep-'))
process.env.EBIKI_DATA_DIR = DIR
process.env.EBIKI_ENV_DIR = DIR
const { modeFolderName, modeFolderForName, writeModeFolders, modesPostAnswer, readModeCfgState } = await import('../../vite.config.js')
const MODES = path.join(DIR, 'modes')
const CHATS = path.join(DIR, 'chats')
afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }))
beforeEach(() => {
  for (const d of [MODES, CHATS]) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }) }
})

const kb = (folder, file = 'notes.txt', text = 'chapter 1') => {
  fs.mkdirSync(path.join(MODES, folder, 'knowledge'), { recursive: true })
  fs.writeFileSync(path.join(MODES, folder, 'knowledge', file), text)
}
const hasKb = (folder, file = 'notes.txt') => fs.existsSync(path.join(MODES, folder, 'knowledge', file))
const folders = () => fs.readdirSync(MODES).filter((d) => d !== '_meta.json' && d !== '.deleted.json').sort()
const cfg = (folder) => JSON.parse(fs.readFileSync(path.join(MODES, folder, 'config.json'), 'utf8'))
const chat = (id, mode) => fs.writeFileSync(path.join(CHATS, `${id}.json`), JSON.stringify({ id, mode, messages: [] }))
const chatMode = (id) => JSON.parse(fs.readFileSync(path.join(CHATS, `${id}.json`), 'utf8')).mode
// One rename the way the client saves it.
const rename = (list, id) => writeModeFolders(MODES, list, list[0].id, [], [id], [id])

describe('renames', () => {
  it('a double rename (A to B to C) keeps one folder, the knowledge base and the chats', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'A' }], 1, [], [1], [])
    kb('A'); chat('c1', 'A')
    rename([{ id: 1, name: 'B' }], 1)
    rename([{ id: 1, name: 'C' }], 1)
    expect(folders()).toEqual(['C'])
    expect(hasKb('C')).toBe(true)
    expect(chatMode('c1')).toBe('C')
  })

  it('renaming back to the old name works and carries everything back', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'Bio' }], 1, [], [1], [])
    kb('Bio'); chat('c1', 'Bio')
    rename([{ id: 1, name: 'Biology' }], 1)
    rename([{ id: 1, name: 'Bio' }], 1)
    expect(folders()).toEqual(['Bio'])
    expect(hasKb('Bio')).toBe(true)
    expect(chatMode('c1')).toBe('Bio')
  })

  it('a rename that only adds a trailing dot or space keeps the same folder', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'Intro to C' }], 1, [], [1], [])
    kb('Intro to C')
    const r = rename([{ id: 1, name: 'Intro to C.' }], 1)
    expect(r.conflicts).toEqual([])
    expect(folders()).toEqual(['Intro to C'])
    expect(cfg('Intro to C').name).toBe('Intro to C.')
    expect(hasKb('Intro to C')).toBe(true)
  })

  it('a device name gets its safe folder and a case-only rename keeps it', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'NUL' }], 1, [], [1], [])
    kb('NUL_')
    rename([{ id: 1, name: 'nul' }], 1)
    expect(folders().map((d) => d.toLowerCase())).toEqual(['nul_'])
    expect(hasKb(folders()[0])).toBe(true)
    expect(cfg(folders()[0]).name).toBe('nul')
  })

  it('a rename between the composed and decomposed spelling of an accent keeps the knowledge base', () => {
    const nfd = 'Español'
    const nfc = 'Español'
    writeModeFolders(MODES, [{ id: 1, name: nfd }], 1, [], [1], [])
    kb(modeFolderName(nfd, 1))
    rename([{ id: 1, name: nfc }], 1)
    expect(folders()).toHaveLength(1)
    expect(hasKb(folders()[0])).toBe(true)
    expect(cfg(folders()[0]).name).toBe(nfc)
  })

  it('a rename into a folder only a knowledge upload made parks that folder and keeps both files', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'Biology' }], 1, [], [1], [])
    kb('Biology', 'mine.txt')
    kb('Bio', 'stray.txt') // no config: made by an upload, never a mode
    const r = rename([{ id: 1, name: 'Bio' }], 1)
    expect(r.conflicts).toEqual([])
    expect(cfg('Bio').id).toBe(1)
    expect(hasKb('Bio', 'mine.txt')).toBe(true)
    const parked = folders().find((d) => d.startsWith('Bio (parked'))
    expect(parked).toBeTruthy()
    expect(hasKb(parked, 'stray.txt')).toBe(true)
  })
})

describe('very long names', () => {
  it('a name too long for a folder still saves (no crash), in a stable folder of its own', () => {
    for (const name of ['a'.repeat(300), '日'.repeat(120), 'x'.repeat(254) + 'é']) {
      const f = modeFolderName(name, 1)
      expect(Buffer.byteLength(f)).toBeLessThanOrEqual(200)
      expect(modeFolderName(name, 1)).toBe(f) // deterministic
      expect(f.endsWith('.') || f.endsWith(' ')).toBe(false)
    }
    const long = 'Advanced '.repeat(40).trim()
    expect(() => writeModeFolders(MODES, [{ id: 1, name: long }], 1, [], [1], [])).not.toThrow()
    expect(folders()).toHaveLength(1)
    expect(cfg(folders()[0]).name).toBe(long)
    // the knowledge endpoints find it by name
    expect(modeFolderForName(MODES, long)).toBe(folders()[0])
  })

  it('names that fit keep exactly the folder they always had', () => {
    const n = 'x'.repeat(100)
    expect(modeFolderName(n, 1)).toBe(n)
    expect(modeFolderName('日本語の文法と語彙', 1)).toBe('日本語の文法と語彙')
  })

  it('a long-named mode saved in its old full-length folder is still found, and moves on its next save', () => {
    const long = 'Organic chemistry reactions '.repeat(5).trim() // 139 characters: fit on disk, now shortened
    fs.mkdirSync(path.join(MODES, long))
    fs.writeFileSync(path.join(MODES, long, 'config.json'), JSON.stringify({ id: 4, name: long }))
    kb(long)
    expect(modeFolderForName(MODES, long)).toBe(long)
    const r = writeModeFolders(MODES, [{ id: 4, name: long, ankiDeck: 'D' }], 4, [], [4], [])
    expect(r.conflicts).toEqual([])
    expect(folders()).toEqual([modeFolderName(long, 4)])
    expect(hasKb(modeFolderName(long, 4))).toBe(true)
    expect(modeFolderForName(MODES, long)).toBe(modeFolderName(long, 4))
  })

  it('two long names sharing a long beginning get different folders', () => {
    const a = 'Chapter notes '.repeat(20) + 'part one'
    const b = 'Chapter notes '.repeat(20) + 'part two'
    expect(modeFolderName(a, 1)).not.toBe(modeFolderName(b, 2))
    writeModeFolders(MODES, [{ id: 1, name: a }, { id: 2, name: b }], 1, [], [1, 2], [])
    expect(folders()).toHaveLength(2)
  })

  it('a conflict on a long name suggests one that really is free', () => {
    const long = 'Geography of the world '.repeat(12).trim()
    writeModeFolders(MODES, [{ id: 9, name: long }], 9, [], [9], [])
    const r = writeModeFolders(MODES, [{ id: 1, name: long }], 1, [], [1], [])
    expect(r.conflicts).toHaveLength(1)
    const s = r.conflicts[0].suggested
    expect(modeFolderName(s, 1)).not.toBe(modeFolderName(long, 1))
  })
})

describe('conflicts', () => {
  it('a folder made by another computer is never taken; the suggestion skips every taken name', () => {
    writeModeFolders(MODES, [{ id: 9, name: 'Chem' }], 9, [], [9], [])
    fs.mkdirSync(path.join(MODES, 'Chem 2')) // something already there
    const r = writeModeFolders(MODES, [{ id: 1, name: 'Chem' }], 1, [], [1], [])
    expect(r.conflicts).toEqual([{ id: 1, name: 'Chem', suggested: 'Chem 3' }])
    expect(cfg('Chem').id).toBe(9)
  })

  it('a refused rename does not re-tag chats into the other computer\'s mode', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'Bio' }], 1, [], [1], [])
    chat('c1', 'Bio')
    fs.mkdirSync(path.join(MODES, 'Chem'))
    fs.writeFileSync(path.join(MODES, 'Chem', 'config.json'), JSON.stringify({ id: 9, name: 'Chem' }))
    const r = rename([{ id: 1, name: 'Chem' }], 1)
    expect(r.conflicts).toHaveLength(1)
    expect(chatMode('c1')).toBe('Bio')
    expect(cfg('Chem').id).toBe(9)
    expect(cfg('Bio').id).toBe(1)
  })

  it('names that differ only by a trailing dot are one folder: the second is a conflict, not an overwrite', () => {
    const r = writeModeFolders(MODES, [{ id: 1, name: 'Notes' }, { id: 2, name: 'Notes.' }], 1, [], [1, 2], [])
    expect(cfg('Notes').id).toBe(1)
    expect(r.conflicts.map((c) => c.id)).toEqual([2])
  })
})

describe('deletes and tombstones', () => {
  it('a deleted id that is also still in the list is kept', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'A' }, { id: 2, name: 'B' }], 1, [], [1, 2], [])
    writeModeFolders(MODES, [{ id: 1, name: 'A' }, { id: 2, name: 'B' }], 1, [2], [], [])
    expect(folders()).toEqual(['A', 'B'])
  })

  it('a new mode may reuse a deleted mode\'s NAME (a new id)', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'A' }, { id: 2, name: 'Music' }], 1, [], [1, 2], [])
    writeModeFolders(MODES, [{ id: 1, name: 'A' }], 1, [2], [], [])
    const r = writeModeFolders(MODES, [{ id: 1, name: 'A' }, { id: 3, name: 'Music' }], 1, [], [3], [])
    expect(r.deletedElsewhere).toEqual([])
    expect(cfg('Music').id).toBe(3)
  })

  it('deleting writes a tombstone that survives later deletes', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'A' }, { id: 2, name: 'B' }, { id: 3, name: 'C' }], 1, [], [1, 2, 3], [])
    writeModeFolders(MODES, [{ id: 1, name: 'A' }, { id: 3, name: 'C' }], 1, [2], [], [])
    writeModeFolders(MODES, [{ id: 1, name: 'A' }], 1, [3], [], [])
    const t = JSON.parse(fs.readFileSync(path.join(MODES, '.deleted.json'), 'utf8')).map((x) => String(x.id)).sort()
    expect(t).toEqual(['2', '3'])
  })

  it('a delete never removes the folder of a mode whose config could not be read', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'A' }, { id: 2, name: 'B' }], 1, [], [1, 2], [])
    fs.writeFileSync(path.join(MODES, 'B', 'config.json'), '{ half written')
    writeModeFolders(MODES, [{ id: 1, name: 'A' }], 1, [2], [], [])
    expect(folders()).toEqual(['A', 'B'])
  })
})

describe('renamedIds adopt', () => {
  it('a stale whole-list save adopts the other computer\'s rename and moves nothing', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }], 1, [], [1], [])
    kb('Spanish')
    rename([{ id: 1, name: 'Español' }], 1) // computer 1
    const r = writeModeFolders(MODES, [{ id: 1, name: 'Spanish', ankiDeck: 'X' }], 1, [], [1], []) // computer 2, stale
    expect(r.conflicts).toEqual([{ id: 1, name: 'Spanish', suggested: 'Español', adopt: true }])
    expect(folders()).toEqual(['Español'])
    expect(hasKb('Español')).toBe(true)
    expect(cfg('Español').ankiDeck).toBeUndefined()
  })
})

describe('deleting modes', () => {
  it('a folder that cannot be removed (a file open on Windows) does not stop the sweep or lose the tombstones', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'Keep' }, { id: 2, name: 'Gone' }, { id: 3, name: 'Locked' }], 1, [], [1, 2, 3], [])
    kb('Locked')
    const real = fs.rmSync
    const spy = vi.spyOn(fs, 'rmSync').mockImplementation((p, ...r) => {
      if (String(p).endsWith(`${path.sep}Locked`)) { const e = new Error('EBUSY: resource busy'); e.code = 'EBUSY'; throw e }
      return real(p, ...r)
    })
    let out
    try { out = writeModeFolders(MODES, [{ id: 1, name: 'Keep' }], 1, [2, 3], [], []) } finally { spy.mockRestore() }
    expect(out.removeFailed).toEqual(['Locked'])
    expect(folders()).toEqual(['Keep', 'Locked'])
    const tombs = JSON.parse(fs.readFileSync(path.join(MODES, '.deleted.json'), 'utf8')).map((t) => t.id)
    expect(tombs).toEqual(expect.arrayContaining([2, 3]))
    expect(JSON.parse(fs.readFileSync(path.join(MODES, '_meta.json'), 'utf8')).activeModeId).toBe(1)
  })
})

// A config.json that EXISTS but cannot be read for a moment (an SMB blip, EBUSY while another computer writes) is
// never "no mode here": every decision that depends on it refuses (503, try again) instead of guessing.
describe('unreadable mode configs', () => {
  const busy = (folders, { times = Infinity } = {}) => {
    const real = fs.readFileSync
    let left = times
    const ends = folders.map((f) => `${path.sep}${f}${path.sep}config.json`)
    return vi.spyOn(fs, 'readFileSync').mockImplementation((p, ...r) => {
      if (left > 0 && ends.some((e) => String(p).endsWith(e))) { left--; const e = new Error('EBUSY: resource busy or locked'); e.code = 'EBUSY'; throw e }
      return real(p, ...r)
    })
  }
  const put = (folder, c) => { fs.mkdirSync(path.join(MODES, folder), { recursive: true }); fs.writeFileSync(path.join(MODES, folder, 'config.json'), typeof c === 'string' ? c : JSON.stringify(c)) }
  const raw = (folder) => fs.readFileSync(path.join(MODES, folder, 'config.json'), 'utf8')
  const save = (...a) => { try { return writeModeFolders(...a) } finally { vi.restoreAllMocks() } }

  it('reads answer missing / ok / corrupt / failed (only ENOENT is missing)', () => {
    expect(readModeCfgState(MODES, 'Nope').state).toBe('missing')
    put('A', { id: 1, name: 'A' })
    expect(readModeCfgState(MODES, 'A')).toEqual({ state: 'ok', cfg: { id: 1, name: 'A' } })
    put('Torn', '{ half')
    expect(readModeCfgState(MODES, 'Torn').state).toBe('failed') // just written: maybe another computer's save landing
    const old = new Date(Date.now() - 60000)
    fs.utimesSync(path.join(MODES, 'Torn', 'config.json'), old, old)
    expect(readModeCfgState(MODES, 'Torn').state).toBe('corrupt')
    busy(['A'])
    try { expect(readModeCfgState(MODES, 'A').state).toBe('failed') } finally { vi.restoreAllMocks() }
  })

  it('one blip is retried: a lock that clears at once still saves normally', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'Bio' }], 1, [], [1], [])
    busy(['Bio'], { times: 1 })
    const r = save(MODES, [{ id: 1, name: 'Bio', ankiDeck: 'D' }], 1, [], [1], [])
    expect(r.unreadable).toEqual([])
    expect(cfg('Bio').ankiDeck).toBe('D')
  })

  it('a save never writes over a same-named folder whose config cannot be read (another computer\'s mode)', () => {
    put('Chem', { id: 9, name: 'Chem', description: 'theirs' })
    kb('Chem', 'theirs.txt')
    busy(['Chem'])
    const r = save(MODES, [{ id: 1, name: 'Chem' }], 1, [], [1], [])
    expect(r.unreadable.map((u) => u.id)).toEqual([1])
    expect(r.conflicts).toEqual([])
    expect(cfg('Chem')).toEqual({ id: 9, name: 'Chem', description: 'theirs' })
    expect(hasKb('Chem', 'theirs.txt')).toBe(true)
    expect(folders()).toEqual(['Chem'])
  })

  it('a patch never becomes a whole stale copy when the config on disk cannot be read', () => {
    put('Bio', { id: 1, name: 'Bio', ankiDeck: 'Theirs', description: 'set on the other computer' })
    busy(['Bio'])
    const r = save(MODES, [{ id: 1, name: 'Bio', ankiDeck: 'Mine' }], 1, [], [1], [], { 1: { set: [{ path: ['ankiDeck'], value: 'Mine' }], unset: [] } })
    expect(r.unreadable.map((u) => u.id)).toEqual([1])
    expect(cfg('Bio')).toEqual({ id: 1, name: 'Bio', ankiDeck: 'Theirs', description: 'set on the other computer' })
  })

  it('a rename while another mode folder cannot be read moves nothing and re-tags no chats', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'Bio' }, { id: 2, name: 'Art' }], 1, [], [1, 2], [])
    kb('Bio'); chat('c1', 'Bio')
    busy(['Art'])
    const r = save(MODES, [{ id: 1, name: 'Biology' }, { id: 2, name: 'Art' }], 1, [], [1], [1])
    expect(r.unreadable).toEqual([{ id: 1, name: 'Biology', previous: 'Bio', dir: 'Biology' }])
    expect(folders()).toEqual(['Art', 'Bio'])
    expect(hasKb('Bio')).toBe(true)
    expect(cfg('Bio').name).toBe('Bio')
    expect(chatMode('c1')).toBe('Bio')
    // the share answers again: the same save goes through
    const ok = writeModeFolders(MODES, [{ id: 1, name: 'Biology' }, { id: 2, name: 'Art' }], 1, [], [1], [1])
    expect(ok.unreadable).toEqual([])
    expect(folders()).toEqual(['Art', 'Biology'])
    expect(chatMode('c1')).toBe('Biology')
  })

  it('the mode\'s own folder unreadable during a rename: no second folder with the same id', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'Bio' }], 1, [], [1], [])
    kb('Bio')
    busy(['Bio'])
    const r = save(MODES, [{ id: 1, name: 'Biology' }], 1, [], [1], [1])
    expect(r.unreadable.map((u) => u.id)).toEqual([1])
    expect(folders()).toEqual(['Bio'])
    expect(hasKb('Bio')).toBe(true)
  })

  it('a stale save never misses that another computer renamed the mode while that folder is unreadable', () => {
    put('Español', { id: 1, name: 'Español' }) // computer 1 renamed Spanish
    busy(['Español'])
    const r = save(MODES, [{ id: 1, name: 'Spanish', ankiDeck: 'X' }], 1, [], [1], []) // computer 2, stale
    expect(r.unreadable.map((u) => u.id)).toEqual([1])
    expect(folders()).toEqual(['Español'])
  })

  it('creating a mode waits while a folder that may hold it cannot be read; plain edits of other modes still save', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'A' }, { id: 2, name: 'B' }], 1, [], [1, 2], [])
    busy(['B'])
    const r = save(MODES, [{ id: 1, name: 'A', ankiDeck: 'D' }, { id: 2, name: 'B' }, { id: 3, name: 'C' }], 1, [], [1, 3], [])
    expect(r.unreadable.map((u) => u.id)).toEqual([3])
    expect(cfg('A').ankiDeck).toBe('D')
    expect(folders()).toEqual(['A', 'B'])
  })

  it('an older client\'s whole-list save (no deletedIds) never sweeps a folder it could not read', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'A' }, { id: 2, name: 'B' }], 1, [], [1, 2], [])
    kb('B')
    busy(['B'])
    save(MODES, [{ id: 1, name: 'A' }], 1)
    expect(folders()).toEqual(['A', 'B'])
    expect(hasKb('B')).toBe(true)
  })

  it('a stably damaged config in the target folder is set aside, never silently overwritten', () => {
    put('Bio', '{ broken')
    const old = new Date(Date.now() - 60000)
    fs.utimesSync(path.join(MODES, 'Bio', 'config.json'), old, old)
    const r = writeModeFolders(MODES, [{ id: 1, name: 'Bio' }], 1, [], [1], [])
    expect(r.unreadable).toEqual([])
    expect(cfg('Bio')).toEqual({ id: 1, name: 'Bio' })
    const aside = fs.readdirSync(path.join(MODES, 'Bio')).find((f) => f.startsWith('config.json.corrupt-'))
    expect(aside).toBeTruthy()
    expect(fs.readFileSync(path.join(MODES, 'Bio', aside), 'utf8')).toBe('{ broken')
    expect(raw('Bio')).toContain('"id": 1')
  })
})

describe('POST /api/modes answers', () => {
  it('a body without a modes list is refused (400), never answered ok', () => {
    for (const body of ['{}', '{"modes": "x"}', 'null', '[1]', '{"modes": [1]}', '{"modes": [null]}']) {
      const out = modesPostAnswer(body, MODES)
      expect(out.status).toBe(400)
      expect(out.body.ok).toBeUndefined()
    }
    expect(modesPostAnswer('{ not json', MODES).status).toBe(400)
    expect(folders()).toEqual([])
  })

  it('an empty list is still refused (409)', () => {
    expect(modesPostAnswer('{"modes": []}', MODES).status).toBe(409)
  })

  it('a disk failure is a 5xx (try again), not a bad request', () => {
    const out = modesPostAnswer(JSON.stringify({ modes: [{ id: 1, name: 'A' }], activeModeId: 1, deletedIds: [], changedIds: [1] }), path.join(MODES, 'missing-dir'))
    expect(out.status).toBe(503)
  })

  it('a mode refused for an unreadable folder answers 503 with the report', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'A' }, { id: 2, name: 'B' }], 1, [], [1, 2], [])
    const real = fs.readFileSync
    vi.spyOn(fs, 'readFileSync').mockImplementation((p, ...r) => {
      if (String(p).endsWith(`${path.sep}B${path.sep}config.json`)) { const e = new Error('EBUSY'); e.code = 'EBUSY'; throw e }
      return real(p, ...r)
    })
    let out
    try { out = modesPostAnswer(JSON.stringify({ modes: [{ id: 1, name: 'A2' }, { id: 2, name: 'B' }], activeModeId: 1, deletedIds: [], changedIds: [1], renamedIds: [1] }), MODES) } finally { vi.restoreAllMocks() }
    expect(out.status).toBe(503)
    expect(out.body.ok).toBe(false)
    expect(out.body.unreadable.map((u) => u.id)).toEqual([1])
  })

  it('a normal save answers 200 ok', () => {
    const out = modesPostAnswer(JSON.stringify({ modes: [{ id: 1, name: 'A' }], activeModeId: 1, deletedIds: [], changedIds: [1], renamedIds: [] }), MODES)
    expect(out.status).toBe(200)
    expect(out.body.ok).toBe(true)
    expect(cfg('A').id).toBe(1)
  })
})

describe('unreadable folders and deletes', () => {
  const busyB = () => {
    const real = fs.readFileSync
    return vi.spyOn(fs, 'readFileSync').mockImplementation((p, ...r) => {
      if (String(p).endsWith(`${path.sep}B${path.sep}config.json`)) { const e = new Error('EBUSY'); e.code = 'EBUSY'; throw e }
      return real(p, ...r)
    })
  }
  it('deleting a mode whose folder cannot be read is refused (503), never answered ok while the folder stays', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'A' }, { id: 2, name: 'B' }], 1, [], [1, 2], [])
    busyB()
    let out
    try { out = modesPostAnswer(JSON.stringify({ modes: [{ id: 1, name: 'A' }], activeModeId: 1, deletedIds: [2], changedIds: [], renamedIds: [] }), MODES) } finally { vi.restoreAllMocks() }
    expect(out.status).toBe(503)
    expect(out.body.unreadable.map((u) => String(u.id))).toEqual(['2'])
    expect(folders()).toEqual(['A', 'B'])
    // readable again: the same delete goes through
    const ok = modesPostAnswer(JSON.stringify({ modes: [{ id: 1, name: 'A' }], activeModeId: 1, deletedIds: [2], changedIds: [], renamedIds: [] }), MODES)
    expect(ok.status).toBe(200)
    expect(folders()).toEqual(['A'])
  })

  it('a stale save adopting another computer\'s rename reports no adopt when that folder cannot be read for its edit', () => {
    put2('Español', { id: 1, name: 'Español' })
    const real = fs.readFileSync
    let n = 0
    // the up-front scan and the home lookup read it; the edit's own read fails
    vi.spyOn(fs, 'readFileSync').mockImplementation((p, ...r) => {
      if (String(p).endsWith(`${path.sep}Español${path.sep}config.json`) && ++n > 2) { const e = new Error('EBUSY'); e.code = 'EBUSY'; throw e }
      return real(p, ...r)
    })
    let r
    try { r = writeModeFolders(MODES, [{ id: 1, name: 'Spanish', ankiDeck: 'X' }], 1, [], [1], [], { 1: { set: [{ path: ['ankiDeck'], value: 'X' }], unset: [] } }) } finally { vi.restoreAllMocks() }
    expect(r.unreadable.map((u) => u.id)).toEqual([1])
    expect(r.conflicts).toEqual([])
    expect(cfg('Español')).toEqual({ id: 1, name: 'Español' })
  })
})
const put2 = (folder, c) => { fs.mkdirSync(path.join(MODES, folder), { recursive: true }); fs.writeFileSync(path.join(MODES, folder, 'config.json'), JSON.stringify(c)) }
