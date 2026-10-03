// Sugarqueen: Sugar Rush (design v2.1, #25).
import { describe, it, expect } from 'vitest'
import { newFight, strike, DAMAGE } from '../fight'
import { simulateRaid, ALL_CLEAN, ALL_MISS_HARSH } from './_sim'
import mod from './sugarqueen'

const K = mod.K
const o = { ability: mod.id }
const hit = (verdict, mode = 'typed', extra = {}) => ({ verdict, mode, ...extra })
const run = (hits, s = newFight()) => hits.reduce((x, h) => strike(x, h, o), s)
const choice = hit('clean', 'choice')

describe('raid ability: sugarqueen (sugarrush)', () => {
  it('3 right answers fill the jar (a miss takes none out) and start a rush', () => {
    let s = run([choice, hit('miss'), choice])
    expect(s.ab.jar).toBe(2)
    expect(s.last.fx).toBe('cube')
    s = strike(s, choice, o)
    expect(s.last.fx).toBe('rush')
    expect(s.ab.rush).toBe(K.rush)
    expect(s.ab.jar).toBe(0)
  })
  it('the next 2 raid answers deal +2 when right; the jar does not fill meanwhile', () => {
    let s = run([choice, choice, choice])
    let before = s.damage
    s = strike(s, choice, o)
    expect(s.last.fx).toBe('sweet')
    expect(s.damage - before).toBe(DAMAGE.choice + K.bonus)
    before = s.damage
    s = strike(s, choice, o)
    expect(s.damage - before).toBe(DAMAGE.choice + K.bonus)
    expect(s.ab.rush).toBe(0)
    expect(s.ab.jar).toBe(0)
    s = strike(s, choice, o)
    expect(s.last.fx).toBe('cube')
  })
  it('a miss during the rush crashes it; attacks and inserted questions neither fill nor use it', () => {
    let s = run([choice, choice, choice])
    s = strike(s, hit('clean', 'typed', { attack: true }), o)
    expect(s.ab.rush).toBe(K.rush)
    s = strike(s, hit('miss'), o)
    expect(s.last.fx).toBe('crash')
    expect(s.ab.rush).toBe(0)
    s = strike(s, hit('clean', 'typed', { inserted: 'minion' }), o)
    expect(s.ab.jar).toBe(0)
  })
  it('hints only when this answer starts or rides the rush', () => {
    const q = { _cardId: 1 }
    expect(mod.hint(run([choice]), q)).toBe(null)
    expect(mod.hint(run([choice, choice]), q).key).toBe('lg_hint_sugarrushStart')
    expect(mod.hint(run([choice, choice, choice]), q).key).toBe('lg_hint_sugarrushBoost')
    expect(mod.hint(run([choice, choice, choice]), { _attack: true })).toBe(null)
  })
  it('F1 / F2 in whole raids', () => {
    for (const n of [5, 8, 15]) {
      expect(simulateRaid(mod.id, { n, answer: ALL_CLEAN }).outcome).toBe('won')
      expect(simulateRaid(mod.id, { n, answer: ALL_MISS_HARSH }).outcome).not.toBe('won')
    }
  })
})
