// Mode folders hold each mode's config AND its knowledge base. Saving the modes list removes every
// folder the list does not name, so a rename, a case-only rename, or a name Windows rewrites must
// never leave the mode's real folder looking "unnamed".
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ebiki-modes-'))
process.env.EBIKI_DATA_DIR = DIR
process.env.EBIKI_ENV_DIR = DIR
const { modeFolderName, writeModeFolders } = await import('../../vite.config.js')
const MODES = path.join(DIR, 'modes')
afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }))
beforeEach(() => { fs.rmSync(MODES, { recursive: true, force: true }); fs.mkdirSync(MODES, { recursive: true }) })

const addKnowledge = (folder, file = 'notes.txt') => {
  fs.mkdirSync(path.join(MODES, folder, 'knowledge'), { recursive: true })
  fs.writeFileSync(path.join(MODES, folder, 'knowledge', file), 'chapter 1')
}
const folders = () => fs.readdirSync(MODES).filter((d) => d !== '_meta.json').sort()

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
