import { describe, it, expect } from 'vitest'
import { newFight, strike, DAMAGE } from '../fight'
import { simulateRaid, ALL_CLEAN, CHOICE_HEAVY, ALL_MISS_HARSH, mixed } from './_sim'
import mod from './berserker'

const K = mod.K
const hit = (verdict, mode = 'typed', extra = {}) => ({ verdict, mode, ...extra })
const o = { ability: 'allin', lives: 3, need: 99 }
const run = (hits) => hits.reduce((s, h) => strike(s, h, o), newFight())
const swing = (verdict, mode = 'typed') => hit(verdict, mode, { armed: { swing: true } })
const T = hit('clean')
const H = hit('clean', 'choice')
const M = hit('miss')

describe('raid ability: berserker (allin)', () => {
  it('an armed right answer cleaves for +3 (glancing counts as right)', () => {
    expect(run([swing('clean')]).damage).toBe(DAMAGE.clean + K.cleave)
    expect(run([swing('clean')]).last.fx).toBe('cleave')
    expect(run([swing('glancing')]).damage).toBe(DAMAGE.glancing + K.cleave)
  })
  it('an armed miss costs one extra heart, never the last one', () => {
    expect(run([swing('miss')]).livesLost).toBe(2)
    expect(run([swing('miss')]).last.fx).toBe('whiff')
    // Two hearts gone? No: one heart lost, then a swing miss: 1 + 1 = 2, the last heart is kept.
    expect(run([M, ...Array(K.rest).fill(H), swing('miss')]).livesLost).toBe(2)
    expect(run([M, ...Array(K.rest).fill(H), swing('miss')]).last.fx).toBe('whiff')
  })
  it('the axe rests 3 raid answers after any swing (an armed answer while resting is a plain one)', () => {
    let s = run([swing('clean')])
    expect(s.ab.rest).toBe(K.rest)
    expect(mod.actions(s, { mode: 'typed', q: { kind: 'typed' } })).toEqual([])
    s = strike(s, swing('clean'), o)
    expect(s.last.fx).not.toBe('cleave')
    s = run([swing('clean'), T, T, T])
    expect(s.ab.rest).toBe(0)
    expect(mod.actions(s, { mode: 'typed', q: { kind: 'typed' } }).map((a) => a.id)).toEqual(['swing'])
  })
  it('never on choices, attacks or inserted questions', () => {
    expect(run([swing('clean', 'choice')]).damage).toBe(DAMAGE.choice)
    expect(run([hit('clean', 'typed', { attack: true, armed: { swing: true } })]).damage).toBe(DAMAGE.counter)
    const q = { kind: 'typed' }
    expect(mod.actions(run([]), { mode: 'choice', q })).toEqual([])
    expect(mod.actions(run([]), { mode: 'typed', q: { ...q, _attack: true } })).toEqual([])
    expect(mod.actions(run([]), { mode: 'typed', q: { ...q, _inserted: 'loop' } })).toEqual([])
  })
  it('he taunts (cosmetic) after 4 raid answers without a swing', () => {
    const s = run([H, H, H, H])
    expect(s.last.fx).toBe('taunt')
    expect(s.damage).toBe(4 * DAMAGE.choice)
  })
  it('the hint shows only while armed', () => {
    const q = { kind: 'typed' }
    expect(mod.hint(run([]), q, 'typed', { armed: {} })).toBeNull()
    expect(mod.hint(run([]), q, 'typed', { armed: { swing: true } })).toMatchObject({ key: 'lg_hint_allin' })
  })
  it('F1 with and without swings, F2, F3 in whole raids', () => {
    for (const n of [5, 8, 15]) for (const press of ['never', 'greedy']) {
      expect(simulateRaid('allin', { n, answer: ALL_CLEAN, press }).outcome).toBe('won')
      expect(simulateRaid('allin', { n, answer: CHOICE_HEAVY, press }).outcome).toBe('won')
      expect(simulateRaid('allin', { n, answer: ALL_MISS_HARSH, press }).outcome).not.toBe('won')
      const r = simulateRaid('allin', { n, answer: mixed(0.3), press })
      for (const e of r.log) if (e.hit.verdict !== 'miss') expect(e.after.livesLost).toBeLessThanOrEqual(e.before.livesLost)
    }
  })
})
