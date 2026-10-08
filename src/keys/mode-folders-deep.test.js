// Deeper scenarios for the mode folders (each folder holds a mode's config AND its knowledge base): the
// current client always sends deletedIds, changedIds and renamedIds, so these mirror its real saves.
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ebiki-modes-deep-'))
process.env.EBIKI_DATA_DIR = DIR
process.env.EBIKI_ENV_DIR = DIR
const { modeFolderName, modeFolderForName, writeModeFolders } = await import('../../vite.config.js')
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
