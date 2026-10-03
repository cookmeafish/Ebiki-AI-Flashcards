import { describe, it, expect } from 'vitest'
import { newFight, strike, DAMAGE } from '../fight'
import { simulateRaid, CHOICE_HEAVY } from './_sim'
import mod from './titan'

const K = mod.K
const hit = (verdict, mode = 'typed', extra = {}) => ({ verdict, mode, ...extra })
const o = { ability: 'plates', need: 100, lives: 9 }
const run = (hits, opts = o) => hits.reduce((s, h) => strike(s, h, opts), newFight())

describe('raid ability: titan (plates)', () => {
  it('only a clean typed answer cracks a plate; choices and glancing deal their normal damage', () => {
    expect(run([hit('clean')]).ab.plates).toBe(K.plates - 1)
    expect(run([hit('clean')]).last.fx).toBe('crack')
    const c = run([hit('clean', 'choice')])
    expect(c.ab.plates).toBe(K.plates)
    expect(c.damage).toBe(DAMAGE.choice)
    const g = run([hit('glancing')])
    expect(g.ab.plates).toBe(K.plates)
    expect(g.damage).toBe(DAMAGE.glancing)
    expect(run([hit('clean', 'typed', { attack: true })]).ab.plates).toBe(K.plates)
  })
  it('the last crack shatters for K.shatter, then the next K.window right answers deal +K.exposed, then new plates', () => {
    let s = run([hit('clean'), hit('clean')])
    expect(s.last.fx).toBe('shatter')
    expect(s.ab.exposed).toBe(true)
    expect(s.damage).toBe(DAMAGE.clean * 2 + K.shatter)
    const d = s.damage
    s = strike(s, hit('clean', 'choice'), o)
    expect(s.damage - d).toBe(DAMAGE.choice + K.exposed)
    expect(s.last.fx).toBe('exposedHit')
    s = strike(s, hit('miss'), o) // a miss does not use up the opening
    for (let i = 1; i < K.window; i++) { s = strike(s, hit('glancing'), o); expect(s.last.fx).toBe('exposedHit') }
    expect(s.ab.exposed).toBe(false)
    expect(s.ab.plates).toBe(K.plates)
    expect(strike(s, hit('clean'), o).last.fx).toBe('crack')
  })
  it('the opening lasts across a phase line; a phase line re-forges cracked plates', () => {
    const opts = { ability: 'plates', need: 9, lives: 9, bar: { total: 9, before: 0, phases: 3 } } // phase lines at 3 and 6 dealt
    const s = run([hit('clean'), hit('clean')], opts) // 2, then 2 + 2 shatter = 6: two phase lines crossed
    expect(s.phaseSeen).toBe(3)
    expect(s.ab.exposed).toBe(true)
    const c = run([hit('clean'), hit('glancing')], opts) // a crack, then 3 dealt: phase 2
    expect(c.ab.plates).toBe(K.plates)
  })
  it('choices are never worth less than in a plain fight', () => {
    for (const n of [5, 8, 15]) {
      expect(simulateRaid('plates', { n, answer: CHOICE_HEAVY }).state.damage).toBeGreaterThanOrEqual(Math.min(simulateRaid('', { n, answer: CHOICE_HEAVY }).state.damage, simulateRaid('plates', { n }).need))
    }
  })
  it('the hint shows only on a phase-1 choice while plates stand', () => {
    const s = { ...newFight(), ab: mod.init() }
    expect(mod.hint(s, {}, 'choice', { phase: 1 })).toBeTruthy()
    expect(mod.hint(s, {}, 'typed', { phase: 1 })).toBe(null)
    expect(mod.hint(s, {}, 'choice', { phase: 2 })).toBe(null)
  })
})
