// The offline reconcile merges this computer's offline edits into a share that ALSO changed. With the
// base both started from, a value only this computer changed must win; only a value both sides
// changed is a real conflict (the share's value is kept, as before).
import { describe, it, expect, afterAll } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ebiki-merge3-'))
process.env.EBIKI_DATA_DIR = DIR
process.env.EBIKI_ENV_DIR = DIR
const { deepMergeJson } = await import('../../vite.config.js')
afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }))

describe('deepMergeJson with a base (offline reconcile)', () => {
  const base = { appTheme: 'light', appLanguage: 'en', lastModelCheck: 1, nested: { a: 1, b: 1 } }

  it('keeps a setting changed only offline', () => {
    const theirs = { ...base, lastModelCheck: 2, nested: { a: 1, b: 1 } }
    const mine = { ...base, appTheme: 'dark', nested: { a: 1, b: 2 } }
    expect(deepMergeJson(theirs, mine, base)).toEqual({ appTheme: 'dark', appLanguage: 'en', lastModelCheck: 2, nested: { a: 1, b: 2 } })
  })

  it('a value both sides changed keeps the share\'s', () => {
    const theirs = { ...base, appTheme: 'ocean' }
    const mine = { ...base, appTheme: 'dark' }
    expect(deepMergeJson(theirs, mine, base).appTheme).toBe('ocean')
  })

  it('a value only the share changed keeps the share\'s', () => {
    const theirs = { ...base, appLanguage: 'es' }
    const mine = { ...base }
    expect(deepMergeJson(theirs, mine, base).appLanguage).toBe('es')
  })

  it('arrays are still unioned, nothing dropped', () => {
    expect(deepMergeJson({ l: [1, 2, 4] }, { l: [1, 3] }, { l: [1, 2] })).toEqual({ l: [1, 2, 4, 3] })
  })

  it('without a base (join/return merges) scalar conflicts keep the target, as before', () => {
    expect(deepMergeJson({ x: 1, y: 1 }, { x: 2, z: 3 })).toEqual({ x: 1, y: 1, z: 3 })
  })

  it('a key new on both sides with different values keeps the share\'s', () => {
    expect(deepMergeJson({ n: 'theirs' }, { n: 'mine' }, {})).toEqual({ n: 'theirs' })
  })
})
