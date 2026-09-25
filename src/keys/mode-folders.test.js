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
