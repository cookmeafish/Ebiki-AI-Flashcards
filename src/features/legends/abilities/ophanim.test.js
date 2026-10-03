// Ophanim: Grace of the Wheel (design v2.1, #23).
import { describe, it, expect } from 'vitest'
import { newFight, strike, DAMAGE } from '../fight'
import { simulateRaid, ALL_CLEAN, ALL_MISS_HARSH, mixed } from './_sim'
import mod from './ophanim'

const K = mod.K
const hit = (verdict, mode = 'typed', extra = {}) => ({ verdict, mode, ...extra })
const at = (phase) => ({ ability: mod.id, phase })
const run = (hits, phase = 1, s = newFight()) => hits.reduce((x, h) => strike(x, h, at(phase)), s)
const choice = hit('clean', 'choice')

describe('raid ability: ophanim (grace)', () => {
  it('eyes to light are 2, 4, 6 by phase; all lit with no heart lost = a Holy Beam of phase + 1', () => {
    for (const p of [1, 2, 3]) {
      let s = run(Array(2 * p - 1).fill(choice), p)
      expect(s.ab.lit).toBe(2 * p - 1)
      expect(s.last.fx).toBe('open')
      const before = s.damage
      s = strike(s, choice, at(p))
      expect(s.last.fx).toBe('beam')
      expect(s.damage - before).toBe(DAMAGE.choice + p + K.beam)
      expect(s.ab.lit).toBe(0)
    }
  })
  it('a miss darkens one eye (never below 0)', () => {
    let s = run([choice, hit('miss')])
    expect(s.ab.lit).toBe(0)
    expect(s.last.fx).toBe('blink')
    s = strike(s, hit('miss'), at(1))
    expect(s.ab.lit).toBe(0)
    expect(s.last.fx).toBe('')
  })
  it('with a heart lost, all lit = Grace: one heart back, once per phase; then beams', () => {
    let s = run([hit('miss'), hit('miss'), choice, choice])
    expect(s.last.fx).toBe('grace')
    expect(s.livesLost).toBe(1)
    expect(s.ab.gracedPhase).toBe(1)
    s = run([choice, choice], 1, s)
    expect(s.last.fx).toBe('beam')
    expect(s.livesLost).toBe(1)
    // the next phase grants Grace again
    s = run([choice, choice, choice, choice], 2, s)
    expect(s.last.fx).toBe('grace')
    expect(s.livesLost).toBe(0)
  })
  it('no heal without a lost heart, and attacks light nothing', () => {
    let s = run([choice, choice])
    expect(s.livesLost).toBe(0)
    expect(s.last.fx).toBe('beam')
    s = strike(s, hit('clean', 'typed', { attack: true }), at(1))
    expect(s.ab.lit).toBe(0)
  })
  it('hints only one eye short, naming what it will do', () => {
    const q = { _cardId: 1 }
    const one = run([choice])
    expect(mod.hint(one, q, 'typed', { phase: 1, lives: 3, livesLeft: 3 }).key).toBe('lg_hint_graceBeam')
    expect(mod.hint(one, q, 'typed', { phase: 1, lives: 3, livesLeft: 2 }).key).toBe('lg_hint_graceHeart')
    expect(mod.hint(one, q, 'typed', { phase: 2, lives: 3, livesLeft: 3 })).toBe(null)
    expect(mod.hint(one, { _attack: true }, 'typed', { phase: 1, lives: 3, livesLeft: 3 })).toBe(null)
  })
  it('F1 / F2 in whole raids, and lives never go negative', () => {
    for (const n of [5, 8, 15]) {
      expect(simulateRaid(mod.id, { n, answer: ALL_CLEAN }).outcome).toBe('won')
      expect(simulateRaid(mod.id, { n, answer: ALL_MISS_HARSH }).outcome).not.toBe('won')
      for (const e of simulateRaid(mod.id, { n, answer: mixed(0.4) }).log) expect(e.after.livesLost).toBeGreaterThanOrEqual(0)
    }
  })
})
