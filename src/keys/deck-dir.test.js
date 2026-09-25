// Deck progress folders. Anki subdecks are "Parent::Child", and ":" is not allowed in a Windows file
// name, so a subdeck's progress log could never be saved. Existing valid names must keep their folder.
import { describe, it, expect, afterAll } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ebiki-deckdir-'))
process.env.EBIKI_DATA_DIR = DIR
process.env.EBIKI_ENV_DIR = DIR
const { deckDirName } = await import('../../vite.config.js')
afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }))

describe('deckDirName', () => {
  it('leaves a name that was already a valid folder exactly as it was', () => {
    expect(deckDirName('Español')).toBe('Español')
    expect(deckDirName('Pilot License')).toBe('Pilot License')
    expect(deckDirName('日本語 N5')).toBe('日本語 N5')
  })

  it('turns a subdeck into a folder name every OS accepts', () => {
    const name = deckDirName('Spanish::Verbs::Irregular')
    expect(name).toBe('Spanish--Verbs--Irregular')
    const dir = path.join(DIR, name)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'progress-observations.md'), 'x')
    expect(fs.existsSync(path.join(dir, 'progress-observations.md'))).toBe(true)
  })

  it('can never leave the decks folder', () => {
    for (const bad of ['..', '.', '../modes', 'a/b', 'a\\b', 'x...', '']) {
      const n = deckDirName(bad)
      expect(n).not.toMatch(/[\\/]/)
      expect(n === '.' || n === '..').toBe(false)
      expect(n.length).toBeGreaterThan(0)
    }
  })
})
