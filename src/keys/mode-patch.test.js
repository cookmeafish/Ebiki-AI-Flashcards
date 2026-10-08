// Two computers on one shared folder edit the SAME mode: a one-mode save carries only what it changed, so the other
// computer's fields in that mode survive (the page's whole stale copy of the mode reverted them).
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { modePatch, applyModePatch, isModePatch } from '../utils/modePatch.js'

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ebiki-mode-patch-'))
process.env.EBIKI_DATA_DIR = DIR
process.env.EBIKI_ENV_DIR = DIR
const { writeModeFolders } = await import('../../vite.config.js')
const MODES = path.join(DIR, 'modes')
afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }))
beforeEach(() => { fs.rmSync(MODES, { recursive: true, force: true }); fs.mkdirSync(MODES, { recursive: true }) })
const cfg = (folder) => JSON.parse(fs.readFileSync(path.join(MODES, folder, 'config.json'), 'utf8'))
const put = (folder, c) => { fs.mkdirSync(path.join(MODES, folder), { recursive: true }); fs.writeFileSync(path.join(MODES, folder, 'config.json'), JSON.stringify(c)) }

describe('modePatch / applyModePatch', () => {
  it('names only what changed, one level down in objects', () => {
    const before = { id: 1, name: 'A', description: 'd', studyRules: { q: 3, c: 3, drop: 1 } }
    const after = { id: 1, name: 'A', description: 'd', studyRules: { q: 5, c: 3 }, chatPrefs: { focus: 'x' } }
    const p = modePatch(before, after)
    expect(p.set).toEqual([{ path: ['studyRules', 'q'], value: 5 }, { path: ['chatPrefs'], value: { focus: 'x' } }])
    expect(p.unset).toEqual([['studyRules', 'drop']])
    expect(isModePatch(p)).toBe(true)
  })

  it('applies over a newer copy without touching its other fields', () => {
    const disk = { id: 1, name: 'A', description: 'other computer', studyRules: { q: 3, c: 9, drop: 1 } }
    const out = applyModePatch(disk, { set: [{ path: ['studyRules', 'q'], value: 5 }], unset: [['studyRules', 'drop']] })
    expect(out).toEqual({ id: 1, name: 'A', description: 'other computer', studyRules: { q: 5, c: 9 } })
    expect(disk.studyRules.drop).toBe(1) // the input is not changed
  })

  it('refuses prototype paths and malformed patches', () => {
    expect(isModePatch({ set: [{ path: ['__proto__', 'x'], value: 1 }], unset: [] })).toBe(false)
    expect(isModePatch({ set: [{ path: ['a', 'b', 'c'], value: 1 }], unset: [] })).toBe(false)
    expect(isModePatch({ set: 'x', unset: [] })).toBe(false)
  })
})

describe('writeModeFolders with patches', () => {
  it('a stale save of the same mode keeps the field another computer changed', () => {
    put('Cooking', { id: 3, name: 'Cooking', description: 'edited on A', studyRules: { questionsPerCard: 2, cardsAtOnce: 3 } })
    const stale = { id: 3, name: 'Cooking', description: 'old', studyRules: { questionsPerCard: 2, cardsAtOnce: 3 } }
    const mine = { ...stale, studyRules: { ...stale.studyRules, questionsPerCard: 5 } }
    writeModeFolders(MODES, [mine], 3, [], [3], [], { 3: modePatch(stale, mine) })
    expect(cfg('Cooking')).toEqual({ id: 3, name: 'Cooking', description: 'edited on A', studyRules: { questionsPerCard: 5, cardsAtOnce: 3 } })
  })

  it('without patches (an older client) the whole mode is written, as before', () => {
    put('Cooking', { id: 3, name: 'Cooking', description: 'edited on A' })
    writeModeFolders(MODES, [{ id: 3, name: 'Cooking', description: 'old' }], 3, [], [3], [])
    expect(cfg('Cooking').description).toBe('old')
  })

  it('an edit of a mode renamed elsewhere lands in its new folder, under the new name', () => {
    put('Español', { id: 1, name: 'Español', description: 'renamed on A', studyRules: { cardsAtOnce: 3 } })
    const stale = { id: 1, name: 'Spanish', description: 'old', studyRules: { cardsAtOnce: 3 } }
    const mine = { ...stale, studyRules: { cardsAtOnce: 7 } }
    const r = writeModeFolders(MODES, [mine], 1, [], [1], [], { 1: modePatch(stale, mine) })
    expect(r.conflicts).toEqual([{ id: 1, name: 'Spanish', suggested: 'Español', adopt: true }])
    expect(fs.existsSync(path.join(MODES, 'Spanish'))).toBe(false)
    expect(cfg('Español')).toEqual({ id: 1, name: 'Español', description: 'renamed on A', studyRules: { cardsAtOnce: 7 } })
  })

  it('a rename with a patch moves the folder and keeps the other fields', () => {
    put('Spanish', { id: 1, name: 'Spanish', description: 'newer', studyRules: { cardsAtOnce: 4 } })
    fs.mkdirSync(path.join(MODES, 'Spanish', 'knowledge')); fs.writeFileSync(path.join(MODES, 'Spanish', 'knowledge', 'a.txt'), 'x')
    const stale = { id: 1, name: 'Spanish', description: 'old', studyRules: { cardsAtOnce: 3 } }
    const mine = { ...stale, name: 'Español' }
    writeModeFolders(MODES, [mine], 1, [], [1], [1], { 1: modePatch(stale, mine) })
    expect(cfg('Español')).toEqual({ id: 1, name: 'Español', description: 'newer', studyRules: { cardsAtOnce: 4 } })
    expect(fs.existsSync(path.join(MODES, 'Español', 'knowledge', 'a.txt'))).toBe(true)
  })

  it('a new mode (no folder yet) is written whole', () => {
    const m = { id: 9, name: 'Chem', description: 'x' }
    writeModeFolders(MODES, [m], 9, [], [9], [], { 9: modePatch({}, m) })
    expect(cfg('Chem')).toEqual(m)
  })
})
