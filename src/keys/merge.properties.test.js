// Seeded property tests for the 3-way JSON merge the offline reconcile uses (deepMergeJson(theirs, mine, base)).
import { describe, it, expect, afterAll } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { rng } from '../utils/testRng.js'

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ebiki-mergeprop-'))
process.env.EBIKI_DATA_DIR = DIR
process.env.EBIKI_ENV_DIR = DIR
const { deepMergeJson } = await import('../../vite.config.js')
afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }))

const clone = (v) => JSON.parse(JSON.stringify(v))
const KEYS = ['a', 'b', 'c', 'theme', 'modes', 'items', 'hooks']
const leaf = (r) => r.pick(['x', 'y', 'z', 1, 2, 3, true, false, null])
const val = (r, d = 0) => {
  const k = d > 2 ? 0 : r.int(5)
  if (k <= 1) return leaf(r)
  if (k === 2) return Array.from({ length: r.int(4) }, () => leaf(r))
  // A list of RECORDS with unique ids (merged per record).
  if (k === 3) return [...new Set(Array.from({ length: r.int(4) }, () => r.int(6)))].map((id) => ({ id, v: leaf(r) }))
  const o = {}
  for (let n = r.int(4); n > 0; n--) o[r.pick(KEYS)] = val(r, d + 1)
  return o
}
const obj = (r) => { const o = {}; for (let n = 1 + r.int(5); n > 0; n--) o[r.pick(KEYS)] = val(r, 1); return o }
// Edit a copy: change, add or drop a few keys (possibly deep).
const edit = (r, v, d = 0) => {
  const out = clone(v)
  for (let n = 1 + r.int(3); n > 0; n--) {
    const k = r.pick(KEYS)
    const roll = r.int(4)
    if (roll === 0) delete out[k]
    else if (roll === 1 && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k]) && d < 2) out[k] = edit(r, out[k], d + 1)
    else out[k] = val(r, d + 1)
  }
  return out
}
const forAll = (n, seed, gen, check) => {
  const r = rng(seed)
  for (let i = 0; i < n; i++) {
    const input = gen(r)
    try { check(input) } catch (e) { e.message = `case ${i}: ${JSON.stringify(input).slice(0, 500)}\n${e.message}`; throw e }
  }
}

describe('deepMergeJson 3-way (property)', () => {
  it('only this computer changed it (share == base): the result is this computer\'s copy', () => {
    forAll(1500, 81, (r) => { const base = obj(r); return { base, mine: edit(r, base) } }, ({ base, mine }) => {
      expect(deepMergeJson(clone(base), clone(mine), clone(base))).toEqual(mine)
    })
  })
  it('only the share changed it (mine == base): the result is the share\'s copy', () => {
    forAll(1500, 82, (r) => { const base = obj(r); return { base, theirs: edit(r, base) } }, ({ base, theirs }) => {
      expect(deepMergeJson(clone(theirs), clone(base), clone(base))).toEqual(theirs)
    })
  })
  it('both made the same change: that change, once', () => {
    forAll(1500, 83, (r) => { const base = obj(r); return { base, both: edit(r, base) } }, ({ base, both }) => {
      expect(deepMergeJson(clone(both), clone(both), clone(base))).toEqual(both)
    })
  })
  it('merging again with the result as the share changes nothing (idempotent)', () => {
    forAll(1500, 84, (r) => { const base = obj(r); return { base, theirs: edit(r, base), mine: edit(r, base) } }, ({ base, theirs, mine }) => {
      const once = deepMergeJson(clone(theirs), clone(mine), clone(base))
      expect(deepMergeJson(clone(once), clone(mine), clone(base))).toEqual(once)
    })
  })
  it('a key only one side touched ends as that side left it', () => {
    forAll(1500, 85, (r) => { const base = obj(r); return { base, theirs: edit(r, base), mine: edit(r, base) } }, ({ base, theirs, mine }) => {
      const out = deepMergeJson(clone(theirs), clone(mine), clone(base))
      const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
      for (const k of new Set([...Object.keys(base), ...Object.keys(theirs), ...Object.keys(mine)])) {
        const tChanged = !same(theirs[k], base[k]) || (k in theirs) !== (k in base)
        const mChanged = !same(mine[k], base[k]) || (k in mine) !== (k in base)
        if (tChanged && !mChanged) { expect(k in out).toBe(k in theirs); if (k in theirs) expect(out[k]).toEqual(theirs[k]) }
        if (mChanged && !tChanged) { expect(k in out).toBe(k in mine); if (k in mine) expect(out[k]).toEqual(mine[k]) }
      }
    })
  })
  it('never throws and never touches the prototype on hostile keys', () => {
    const evil = JSON.parse('{"__proto__":{"polluted":1},"constructor":{"prototype":{"p":1}},"a":1}')
    expect(() => deepMergeJson({ a: 0 }, evil, { a: 0 })).not.toThrow()
    expect(({}).polluted).toBeUndefined()
    expect(({}).p).toBeUndefined()
  })
})
