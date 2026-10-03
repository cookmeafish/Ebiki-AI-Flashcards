// Showman: Comedy and Tragedy (design v2.1, #26).
import { describe, it, expect } from 'vitest'
import { newFight, strike, DAMAGE } from '../fight'
import { simulateRaid, ALL_CLEAN, ALL_MISS_HARSH } from './_sim'
import mod from './showman'

const K = mod.K
const o = { ability: mod.id }
const hit = (verdict, mode = 'typed', extra = {}) => ({ verdict, mode, ...extra })
const run = (hits, s = newFight()) => hits.reduce((x, h) => strike(x, h, o), s)
const choice = hit('clean', 'choice')
const miss = hit('miss')

describe('raid ability: showman (encore)', () => {
  it('every right answer wins applause; the 4th brings an Encore for +3 and the applause starts over', () => {
    let s = run([choice, choice, choice])
    expect(s.ab.laughs).toBe(3)
    expect(s.last.fx).toBe('laugh')
    const before = s.damage
    s = strike(s, choice, o)
    expect(s.last.fx).toBe('encore')
    expect(s.damage - before).toBe(DAMAGE.choice + K.encore)
    expect(s.ab.laughs).toBe(0)
    expect(s.ab.encores).toBe(1)
  })
  it('a miss sheds a tear and keeps the applause; the 2nd tear is a Plot Twist that sets up the Encore', () => {
    let s = run([choice, miss])
    expect(s.last.fx).toBe('tear')
    expect(s.ab.laughs).toBe(1)
    expect(s.ab.tears).toBe(1)
    s = strike(s, miss, o)
    expect(s.last.fx).toBe('twist')
    expect(s.ab.tears).toBe(0)
    expect(s.ab.laughs).toBe(K.laughs - 1)
    const before = s.damage
    s = strike(s, choice, o)
    expect(s.last.fx).toBe('encore')
    expect(s.damage - before).toBe(DAMAGE.choice + K.encore)
  })
  it('a Plot Twist never lowers the applause and never deals damage itself', () => {
    let s = run([miss])
    const before = s.damage
    s = strike(s, miss, o)
    expect(s.last.fx).toBe('twist')
    expect(s.damage).toBe(before)
    expect(s.ab.laughs).toBe(K.laughs - 1)
  })
  it('attacks and inserted questions move neither mask', () => {
    let s = run([choice])
    s = strike(s, hit('clean', 'typed', { attack: true }), o)
    s = strike(s, hit('miss', 'typed', { attack: true }), o)
    s = strike(s, hit('clean', 'typed', { inserted: 'minion' }), o)
    expect(s.ab.laughs).toBe(1)
    expect(s.ab.tears).toBe(0)
  })
  it('hints only on the answer that would bring the Encore, and the HUD keeps its two items', () => {
    const q = { _cardId: 1 }
    expect(mod.hint(run([choice, choice]), q)).toBe(null)
    expect(mod.hint(run([choice, choice, choice]), q).key).toBe('lg_hint_encore')
    expect(mod.hint(run([miss, miss]), q).key).toBe('lg_hint_encore')
    expect(mod.hint(run([choice, choice, choice]), { _attack: true })).toBe(null)
    const h = mod.hud(run([choice, miss]))
    expect(h.map((x) => x.labelKey)).toEqual(['lg_hud_encoreApplause', 'lg_hud_encoreTwist'])
    expect(mod.artState(run([choice, choice, choice]))).toEqual({ 'data-ab-comedy': 1, 'data-ab-tragedy': 0 })
    expect(mod.artState(run([miss]))).toEqual({ 'data-ab-comedy': 0, 'data-ab-tragedy': 1 })
  })
  it('F1 / F2 in whole raids', () => {
    for (const n of [5, 8, 15]) {
      expect(simulateRaid(mod.id, { n, answer: ALL_CLEAN }).outcome).toBe('won')
      expect(simulateRaid(mod.id, { n, answer: ALL_MISS_HARSH }).outcome).not.toBe('won')
    }
  })
})
