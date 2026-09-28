// Mode folders hold each mode's config AND its knowledge base. Saving the modes list removes every
// folder the list does not name, so a rename, a case-only rename, or a name Windows rewrites must
// never leave the mode's real folder looking "unnamed".
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ebiki-modes-'))
process.env.EBIKI_DATA_DIR = DIR
process.env.EBIKI_ENV_DIR = DIR
const { modeFolderName, modeFolderForName, writeModeFolders } = await import('../../vite.config.js')
const MODES = path.join(DIR, 'modes')
afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }))
beforeEach(() => { fs.rmSync(MODES, { recursive: true, force: true }); fs.mkdirSync(MODES, { recursive: true }) })

const addKnowledge = (folder, file = 'notes.txt') => {
  fs.mkdirSync(path.join(MODES, folder, 'knowledge'), { recursive: true })
  fs.writeFileSync(path.join(MODES, folder, 'knowledge', file), 'chapter 1')
}
const folders = () => fs.readdirSync(MODES).filter((d) => d !== '_meta.json' && d !== '.deleted.json').sort()

describe('modeFolderName', () => {
  it('leaves valid names exactly as they were', () => {
    for (const n of ['Spanish', 'Security+', '日本語', 'Organic Chemistry', '.NET basics']) expect(modeFolderName(n, 1)).toBe(n)
  })
  it('never escapes the modes folder or makes a folder Windows would rename', () => {
    expect(modeFolderName('..', 4)).toBe('mode-4')
    expect(modeFolderName('.', 4)).toBe('mode-4')
    expect(modeFolderName('Intro to C.', 4)).toBe('Intro to C')
    expect(modeFolderName('a/b\\c', 4)).toBe('abc')
    expect(modeFolderName('CON', 4)).toBe('CON_')
    expect(modeFolderName('', 4)).toBe('mode-4')
    expect(modeFolderName('')).toBe('')
  })
})

describe('writeModeFolders', () => {
  it('a rename keeps the knowledge base', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }, { id: 2, name: 'Music' }], 1)
    addKnowledge('Spanish')
    writeModeFolders(MODES, [{ id: 1, name: 'Español' }, { id: 2, name: 'Music' }], 1)
    expect(folders()).toEqual(['Español', 'Music'])
    expect(fs.readFileSync(path.join(MODES, 'Español', 'knowledge', 'notes.txt'), 'utf8')).toBe('chapter 1')
    expect(JSON.parse(fs.readFileSync(path.join(MODES, 'Español', 'config.json'), 'utf8')).name).toBe('Español')
  })

  it('a deleted mode is still removed', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }, { id: 2, name: 'Music' }], 1)
    writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }], 1)
    expect(folders()).toEqual(['Spanish'])
  })

  it('a case-only rename keeps the mode (case-insensitive file systems)', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'spanish' }], 1)
    addKnowledge('spanish')
    writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }], 1)
    expect(folders().map((d) => d.toLowerCase())).toEqual(['spanish'])
    const dir = folders()[0]
    expect(JSON.parse(fs.readFileSync(path.join(MODES, dir, 'config.json'), 'utf8')).name).toBe('Spanish')
    expect(fs.existsSync(path.join(MODES, dir, 'knowledge', 'notes.txt'))).toBe(true)
  })

  it('a name with a trailing dot is saved and kept', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'Intro to C.' }], 1)
    writeModeFolders(MODES, [{ id: 1, name: 'Intro to C.' }], 1)
    expect(folders()).toEqual(['Intro to C'])
  })

  it('never takes a folder another mode in the list still uses', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'A' }, { id: 1, name: 'B' }], 1) // ids collided (merged share)
    addKnowledge('B')
    writeModeFolders(MODES, [{ id: 1, name: 'A' }, { id: 2, name: 'B' }, { id: 1, name: 'C' }].slice(0, 2), 1)
    expect(folders()).toEqual(['A', 'B'])
    expect(fs.existsSync(path.join(MODES, 'B', 'knowledge', 'notes.txt'))).toBe(true)
  })
})

describe('explicit deletes (deletedIds)', () => {
  // A shared folder: another computer created "Music" after this one loaded its list. This
  // computer's next save does not name Music, and must not delete it.
  it('a mode missing from the list is kept when deletedIds is sent', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }, { id: 2, name: 'Music' }], 1)
    addKnowledge('Music')
    writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }], 1, [])
    expect(folders()).toEqual(['Music', 'Spanish'])
    expect(fs.existsSync(path.join(MODES, 'Music', 'knowledge', 'notes.txt'))).toBe(true)
  })

  it('only the named mode is deleted', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }, { id: 2, name: 'Music' }, { id: 3, name: 'Art' }], 1)
    writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }], 1, [2])
    expect(folders()).toEqual(['Art', 'Spanish'])
  })

  it('a rename still moves the folder and keeps the knowledge base', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }], 1)
    addKnowledge('Spanish')
    writeModeFolders(MODES, [{ id: 1, name: 'Español' }], 1, [])
    expect(folders()).toEqual(['Español'])
    expect(fs.existsSync(path.join(MODES, 'Español', 'knowledge', 'notes.txt'))).toBe(true)
  })
})

describe('renaming a mode re-tags its chats', () => {
  const CHATS = path.join(DIR, 'chats')
  const chat = (id, mode) => fs.writeFileSync(path.join(CHATS, `${id}.json`), JSON.stringify({ title: id, messages: [], ...(mode ? { mode } : {}) }))
  const modeOf = (id) => JSON.parse(fs.readFileSync(path.join(CHATS, `${id}.json`), 'utf-8')).mode
  it('moves chats tagged with the old name, leaves every other chat alone', () => {
    fs.rmSync(CHATS, { recursive: true, force: true }); fs.mkdirSync(CHATS, { recursive: true })
    writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }, { id: 2, name: 'Music' }], 1, [])
    chat('a', 'Spanish'); chat('b', 'Music'); chat('c')
    writeModeFolders(MODES, [{ id: 1, name: 'Español' }, { id: 2, name: 'Music' }], 1, [])
    expect(modeOf('a')).toBe('Español')
    expect(modeOf('b')).toBe('Music')
    expect(modeOf('c')).toBeUndefined()
  })
  it('a case-only rename re-tags too', () => {
    fs.rmSync(CHATS, { recursive: true, force: true }); fs.mkdirSync(CHATS, { recursive: true })
    writeModeFolders(MODES, [{ id: 1, name: 'spanish' }], 1, [])
    chat('a', 'spanish')
    writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }], 1, [])
    expect(modeOf('a')).toBe('Spanish')
  })
  it('the duplicate-id repair is not a rename (two folders shared id 5)', () => {
    fs.rmSync(CHATS, { recursive: true, force: true }); fs.mkdirSync(CHATS, { recursive: true })
    for (const name of ['French', 'Spanish']) {
      fs.mkdirSync(path.join(MODES, name), { recursive: true })
      fs.writeFileSync(path.join(MODES, name, 'config.json'), JSON.stringify({ id: 5, name }))
    }
    chat('f', 'French'); chat('s', 'Spanish')
    writeModeFolders(MODES, [{ id: 5, name: 'French' }, { id: 6, name: 'Spanish' }], 5, [])
    expect(modeOf('f')).toBe('French')
    expect(modeOf('s')).toBe('Spanish')
    expect(folders()).toEqual(['French', 'Spanish'])
  })

  it("never overwrites a folder that holds a mode this list does not know (another computer made it)", () => {
    writeModeFolders(MODES, [{ id: 200, name: 'Chem' }], 200, [])
    addKnowledge('Chem')
    // A second computer that loaded before "Chem" existed saves its own new mode named "Chem".
    const r = writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }, { id: 300, name: 'Chem' }], 1, [])
    expect(JSON.parse(fs.readFileSync(path.join(MODES, 'Chem', 'config.json'), 'utf8')).id).toBe(200)
    expect(r.conflicts).toEqual([{ id: 300, name: 'Chem', suggested: 'Chem 2' }])
    expect(fs.existsSync(path.join(MODES, 'Chem', 'knowledge', 'notes.txt'))).toBe(true)
  })

  it("treats a string id on disk as the same mode as the number the client sends", () => {
    fs.mkdirSync(path.join(MODES, 'X'), { recursive: true })
    fs.writeFileSync(path.join(MODES, 'X', 'config.json'), JSON.stringify({ id: '5', name: 'X' }))
    addKnowledge('X')
    const r = writeModeFolders(MODES, [{ id: 5, name: 'X' }], 5, [])
    expect(r.conflicts).toEqual([])
    expect(JSON.parse(fs.readFileSync(path.join(MODES, 'X', 'config.json'), 'utf8')).id).toBe(5)
    // and a rename still carries the knowledge base along
    writeModeFolders(MODES, [{ id: 5, name: 'Y' }], 5, [])
    expect(folders()).toEqual(['Y'])
    expect(fs.existsSync(path.join(MODES, 'Y', 'knowledge', 'notes.txt'))).toBe(true)
  })

  it('a rename of a mode saved with a string id re-tags its chats too', () => {
    fs.rmSync(CHATS, { recursive: true, force: true }); fs.mkdirSync(CHATS, { recursive: true })
    fs.mkdirSync(path.join(MODES, 'Old'), { recursive: true })
    fs.writeFileSync(path.join(MODES, 'Old', 'config.json'), JSON.stringify({ id: '7', name: 'Old' }))
    chat('o', 'Old')
    writeModeFolders(MODES, [{ id: 7, name: 'New' }], 7, [])
    expect(folders()).toEqual(['New'])
    expect(modeOf('o')).toBe('New')
  })
})

describe('writeModeFolders: a rename whose folder move fails', () => {
  it('leaves the mode as it was (one folder, knowledge kept) and reports it', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'Chem' }, { id: 2, name: 'Music' }], 1, [])
    addKnowledge('Chem')
    // Windows refuses to move a folder while a file inside is open. Only the FOLDER move fails here;
    // the atomic config writes (temp file + rename) still work.
    const orig = fs.renameSync
    const spy = vi.spyOn(fs, 'renameSync').mockImplementation((from, to) => {
      if (path.basename(String(from)) === 'Chem') { const e = new Error('EPERM: operation not permitted'); e.code = 'EPERM'; throw e }
      return orig(from, to)
    })
    let out
    try { out = writeModeFolders(MODES, [{ id: 1, name: 'Chemistry' }, { id: 2, name: 'Music', emoji: 'x' }], 1, []) }
    finally { spy.mockRestore() }
    expect(folders()).toEqual(['Chem', 'Music'])
    expect(JSON.parse(fs.readFileSync(path.join(MODES, 'Chem', 'config.json'), 'utf8')).name).toBe('Chem')
    expect(fs.readFileSync(path.join(MODES, 'Chem', 'knowledge', 'notes.txt'), 'utf8')).toBe('chapter 1')
    expect(out.renameFailed).toEqual([{ id: 1, name: 'Chemistry', previous: 'Chem' }])
    // The other modes in the same save are still written.
    expect(JSON.parse(fs.readFileSync(path.join(MODES, 'Music', 'config.json'), 'utf8')).emoji).toBe('x')
  })
  it('an older client (no deletedIds) does not sweep the old folder either', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'Chem' }], 1)
    addKnowledge('Chem')
    const orig = fs.renameSync
    const spy = vi.spyOn(fs, 'renameSync').mockImplementation((from, to) => {
      if (path.basename(String(from)) === 'Chem') throw new Error('EBUSY')
      return orig(from, to)
    })
    try { writeModeFolders(MODES, [{ id: 1, name: 'Chemistry' }], 1) } finally { spy.mockRestore() }
    expect(folders()).toEqual(['Chem'])
    expect(fs.existsSync(path.join(MODES, 'Chem', 'knowledge', 'notes.txt'))).toBe(true)
  })
})

describe('modeFolderForName (the knowledge endpoints know a mode only by name)', () => {
  it('a normal name is its folder, without reading the disk', () => {
    expect(modeFolderForName(MODES, 'Spanish')).toBe('Spanish')
  })
  it('a name with nothing usable finds the mode-<id> folder its save used', () => {
    writeModeFolders(MODES, [{ id: 7, name: '???' }, { id: 8, name: 'Music' }], 7, [])
    expect(folders()).toEqual(['Music', 'mode-7'])
    expect(modeFolderForName(MODES, '???')).toBe('mode-7')
    expect(modeFolderForName(MODES, '...')).toBe('')
    expect(modeFolderForName(MODES, '')).toBe('')
  })
})

describe('writeModeFolders with changedIds (a one-mode edit)', () => {
  it('writes only the changed mode and leaves the other computer rename alone', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }, { id: 2, name: 'Bio' }], 1)
    // Another computer renames mode 2 to Biology and changes its deck.
    writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }, { id: 2, name: 'Biology', ankiDeck: 'Bio deck' }], 1, [], [2])
    // This computer, still holding the old list, edits mode 1 only.
    writeModeFolders(MODES, [{ id: 1, name: 'Spanish', dialect: 'mx' }, { id: 2, name: 'Bio' }], 1, [], [1])
    expect(folders()).toEqual(['Biology', 'Spanish'])
    expect(JSON.parse(fs.readFileSync(path.join(MODES, 'Biology', 'config.json'), 'utf8')).ankiDeck).toBe('Bio deck')
    expect(JSON.parse(fs.readFileSync(path.join(MODES, 'Spanish', 'config.json'), 'utf8')).dialect).toBe('mx')
  })
})

describe('writeModeFolders: a one-mode rename into a name another computer took', () => {
  it('reports a conflict instead of taking over that folder', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }, { id: 2, name: 'Bio' }], 1)
    addKnowledge('Bio')
    writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }, { id: 2, name: 'Chem' }], 1, [], [2]) // the other computer
    const r = writeModeFolders(MODES, [{ id: 1, name: 'Chem' }, { id: 2, name: 'Bio' }], 1, [], [1]) // this one, stale
    expect(r.conflicts.map((c) => c.id)).toEqual([1])
    expect(JSON.parse(fs.readFileSync(path.join(MODES, 'Chem', 'config.json'), 'utf8')).id).toBe(2)
    expect(fs.existsSync(path.join(MODES, 'Chem', 'knowledge', 'notes.txt'))).toBe(true)
  })
  it('a switch (changedIds []) writes no mode', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }, { id: 2, name: 'Bio' }], 1)
    writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }, { id: 2, name: 'Chem' }], 1, [], [2])
    writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }, { id: 2, name: 'Bio' }], 2, [], [])
    expect(folders()).toEqual(['Chem', 'Spanish'])
  })
})

describe('writeModeFolders: stale lists and odd targets', () => {
  const cfg = (d) => JSON.parse(fs.readFileSync(path.join(MODES, d, 'config.json'), 'utf8'))
  it('a whole-list save from an old list never takes over another mode\'s folder', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'X' }, { id: 2, name: 'Y' }], 1)
    addKnowledge('X', 'kb1.txt'); addKnowledge('Y', 'kb2.txt')
    // another computer: 1 -> Z, then 2 -> X
    writeModeFolders(MODES, [{ id: 1, name: 'Z' }, { id: 2, name: 'Y' }], 1, [], [1])
    writeModeFolders(MODES, [{ id: 1, name: 'Z' }, { id: 2, name: 'X' }], 1, [], [2])
    // this computer still holds [1:X, 2:Y] and creates a mode (whole list)
    const r = writeModeFolders(MODES, [{ id: 1, name: 'X' }, { id: 2, name: 'Y' }, { id: 3, name: 'New' }], 1, [])
    expect(cfg('X').id).toBe(2)
    expect(fs.existsSync(path.join(MODES, 'X', 'knowledge', 'kb2.txt'))).toBe(true)
    expect(cfg('Z').id).toBe(1)
    expect(fs.existsSync(path.join(MODES, 'Y'))).toBe(false) // no second copy of mode 2
    expect(r.conflicts.map((c) => c.id).sort()).toEqual([1, 2])
    expect(r.conflicts.find((c) => c.id === 2).suggested).toBe('X')
  })
  it('a rename into a folder that holds no mode moves the knowledge base in', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'Chem' }], 1)
    addKnowledge('Chem', 'chem.txt')
    fs.mkdirSync(path.join(MODES, 'Default'))
    fs.writeFileSync(path.join(MODES, 'Default', 'config.json'), JSON.stringify({ name: 'Default' }))
    writeModeFolders(MODES, [{ id: 1, name: 'Default' }], 1, [], [1])
    expect(cfg('Default').id).toBe(1)
    expect(fs.existsSync(path.join(MODES, 'Default', 'knowledge', 'chem.txt'))).toBe(true)
    expect(fs.existsSync(path.join(MODES, 'Chem'))).toBe(false)
  })
  it('two names that map to one folder are a conflict, not an overwrite', () => {
    const r = writeModeFolders(MODES, [{ id: 1, name: 'CON' }, { id: 2, name: 'CON_' }], 1, [])
    expect(cfg('CON_').id).toBe(1)
    expect(r.conflicts.map((c) => c.id)).toEqual([2])
  })
})

describe('writeModeFolders: the duplicate-id repair', () => {
  it('re-iding one of two same-id folders writes into that folder (no ghost copy)', () => {
    for (const [d, id] of [['A', 5], ['B', 5]]) {
      fs.mkdirSync(path.join(MODES, d), { recursive: true })
      fs.writeFileSync(path.join(MODES, d, 'config.json'), JSON.stringify({ id, name: d }))
    }
    addKnowledge('B', 'b.txt')
    const r = writeModeFolders(MODES, [{ id: 5, name: 'A' }, { id: 6, name: 'B' }], 5, [])
    expect(r.conflicts).toEqual([])
    expect(folders()).toEqual(['A', 'B'])
    expect(JSON.parse(fs.readFileSync(path.join(MODES, 'B', 'config.json'), 'utf8')).id).toBe(6)
    expect(fs.existsSync(path.join(MODES, 'B', 'knowledge', 'b.txt'))).toBe(true)
  })
})

describe('writeModeFolders with renamedIds', () => {
  it('a stale one-mode edit never moves a folder another computer renamed; it reports the current name', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }, { id: 2, name: 'Bio' }], 1)
    writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }, { id: 2, name: 'Biology' }], 1, [], [2], [2])
    const r = writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }, { id: 2, name: 'Bio', ankiDeck: 'BD' }], 1, [], [2], [])
    expect(folders()).toEqual(['Biology', 'Spanish'])
    expect(r.conflicts).toEqual([{ id: 2, name: 'Bio', suggested: 'Biology', adopt: true }])
  })
  it('a real rename (named in renamedIds) still moves the folder', () => {
    writeModeFolders(MODES, [{ id: 2, name: 'Bio' }], 2)
    addKnowledge('Bio')
    writeModeFolders(MODES, [{ id: 2, name: 'Biology' }], 2, [], [2], [2])
    expect(folders()).toEqual(['Biology'])
    expect(fs.existsSync(path.join(MODES, 'Biology', 'knowledge', 'notes.txt'))).toBe(true)
  })
})

describe('writeModeFolders: a misnamed folder', () => {
  it('is moved to its config name instead of answering an endless "adopt" conflict', () => {
    fs.mkdirSync(path.join(MODES, 'New'), { recursive: true })
    fs.writeFileSync(path.join(MODES, 'New', 'config.json'), JSON.stringify({ id: 5, name: 'Old' }))
    const r = writeModeFolders(MODES, [{ id: 5, name: 'Old', ankiDeck: 'D' }], 5, [], [5], [])
    expect(r.conflicts).toEqual([])
    expect(folders()).toEqual(['Old'])
    expect(JSON.parse(fs.readFileSync(path.join(MODES, 'Old', 'config.json'), 'utf8')).ankiDeck).toBe('D')
  })
})

describe('a mode deleted on another computer', () => {
  it('is not re-created by a stale save, and is reported', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }, { id: 2, name: 'Music' }], 1, [])
    writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }], 1, [2], [])
    expect(folders()).toEqual(['Spanish'])
    // The other computer still lists Music and saves it (a deck pick)
    const r = writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }, { id: 2, name: 'Music', ankiDeck: 'X' }], 1, [], [2], [])
    expect(folders()).toEqual(['Spanish'])
    expect(r.deletedElsewhere).toEqual([{ id: 2, name: 'Music' }])
  })
  it('an unreadable record is never overwritten (it would lose every earlier deletion)', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }, { id: 2, name: 'Music' }], 1, [])
    fs.mkdirSync(path.join(MODES, '.deleted.json')) // reads fail with EISDIR, not ENOENT
    expect(() => writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }], 1, [2], [])).not.toThrow()
    expect(folders()).toEqual(['Spanish'])
    expect(fs.statSync(path.join(MODES, '.deleted.json')).isDirectory()).toBe(true)
  })
  it('a mode that still has its folder is written as usual', () => {
    writeModeFolders(MODES, [{ id: 1, name: 'Spanish' }, { id: 2, name: 'Music' }], 1, [])
    const r = writeModeFolders(MODES, [{ id: 1, name: 'Spanish', ankiDeck: 'D' }, { id: 2, name: 'Music' }], 1, [], [1], [])
    expect(r.deletedElsewhere).toEqual([])
    expect(JSON.parse(fs.readFileSync(path.join(MODES, 'Spanish', 'config.json'), 'utf8')).ankiDeck).toBe('D')
  })
})
