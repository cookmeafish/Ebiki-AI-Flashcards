import { describe, it, expect } from 'vitest'
import { newFight, strike, DAMAGE } from '../fight'
import { simulateRaid, ALL_CLEAN, CHOICE_HEAVY, ALL_MISS_HARSH } from './_sim'
import mod, { facetAt } from './kaleido'

const K = mod.K
const hit = (verdict, mode = 'typed', extra = {}) => ({ verdict, mode, ...extra })
const o = { ability: 'prism' }
const run = (hits) => hits.reduce((s, h) => strike(s, h, o), newFight())
const C = hit('clean', 'choice')
const M = hit('miss')

describe('raid ability: kaleido (prism)', () => {
  it('every block of three raid questions shows all three colors', () => {
    for (let b = 0; b < 40; b++) expect([facetAt(3 * b), facetAt(3 * b + 1), facetAt(3 * b + 2)].sort()).toEqual([0, 1, 2])
  })
  it('three right answers in a block collect the set: Prism +2, the slots empty', () => {
    const s = run([C, C, C])
    expect(s.damage).toBe(3 * DAMAGE.choice + K.burst)
    expect(s.last.fx).toBe('prism')
    expect(s.ab.have).toEqual([false, false, false])
    expect(run([C]).last.fx).toBe('shard')
  })
  it('a color already held overcharges for 1 (only after a miss broke a set)', () => {
    const c = facetAt(0)
    const have = [0, 1, 2].map((i) => i === c)
    const s = strike({ ...newFight(), ab: { have, prisms: 0 } }, C, o)
    expect(s.last.fx).toBe('overcharge')
    expect(s.damage).toBe(DAMAGE.choice + K.over)
    expect(s.ab.have).toEqual(have)
    // In a real run: a miss in the first block, then right answers, sooner or later repeats a held color.
    const fx = []
    for (let k = 0; k < 3; k++) {
      let r = newFight()
      for (let i = 0; i < 9; i++) { r = strike(r, i === k ? M : C, o); fx.push(r.last.fx) }
    }
    expect(fx).toContain('overcharge')
    expect(run([C, C, C, C]).last.fx).not.toBe('overcharge') // no miss: never a repeat
  })
  it('misses, attacks and inserted questions collect nothing', () => {
    expect(run([M]).ab.have).toEqual([false, false, false])
    let s = strike(newFight(), hit('clean', 'typed', { attack: true }), o)
    s = strike(s, hit('clean', 'typed', { inserted: 'minion' }), o)
    expect(s.ab.have).toEqual([false, false, false])
  })
  it('the tag shows the next question\'s color; the hint only when it completes the set', () => {
    const q = { kind: 'typed' }
    const s0 = run([])
    expect(mod.tag(s0, q).key).toBe(`lg_tag_prism_${['red', 'green', 'blue'][facetAt(0)]}`)
    expect(mod.tag(s0, { ...q, _attack: true })).toBeNull()
    expect(mod.hint(run([C]), q)).toBeNull()
    expect(mod.hint(run([C, C]), q)).toMatchObject({ key: 'lg_hint_prism' })
    const hud = mod.hud(run([C, C]))
    expect(hud.filter((h) => h.ready).length).toBe(1)
    expect(hud.map((h) => h.n).reduce((a, b) => a + b)).toBe(2)
  })
  it('F1 and F2 in whole raids', () => {
    for (const n of [5, 8, 15]) {
      expect(simulateRaid('prism', { n, answer: ALL_CLEAN }).outcome).toBe('won')
      expect(simulateRaid('prism', { n, answer: CHOICE_HEAVY }).outcome).toBe('won')
      expect(simulateRaid('prism', { n, answer: ALL_MISS_HARSH }).outcome).not.toBe('won')
    }
  })
})
