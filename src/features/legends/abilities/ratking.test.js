// Ratking: Kingpin's Hoard (design v2.1, #24).
import { describe, it, expect } from 'vitest'
import { newFight, strike, act, DAMAGE } from '../fight'
import { simulateRaid, ALL_CLEAN, ALL_MISS_HARSH } from './_sim'
import mod from './ratking'

const K = mod.K
const o = { ability: mod.id }
const hit = (verdict, mode = 'typed', extra = {}) => ({ verdict, mode, ...extra })
const run = (hits, s = newFight()) => hits.reduce((x, h) => strike(x, h, o), s)
const choice = hit('clean', 'choice')
const coins = (n) => run(Array(n).fill(choice))

describe('raid ability: ratking (hoard)', () => {
  it('a right answer robs him of a coin, a miss lets the rats steal one back (min 0); attacks change nothing', () => {
    let s = coins(2)
    expect(s.ab.coins).toBe(2)
    expect(s.last.fx).toBe('loot')
    s = strike(s, hit('miss'), o)
    expect(s.ab.coins).toBe(1)
    expect(s.last.fx).toBe('stolen')
    s = run([hit('miss'), hit('miss')], s)
    expect(s.ab.coins).toBe(0)
    s = run([hit('clean', 'typed', { attack: true }), hit('clean', 'typed', { inserted: 'minion' })], s)
    expect(s.ab.coins).toBe(0)
  })
  it('the Cheese Bomb costs K.bomb for K.bombDmg damage and is refused without the coins', () => {
    let s = coins(K.bomb - 1)
    const refused = act(s, { type: 'bomb' }, o)
    expect(refused.damage).toBe(s.damage)
    expect(refused.ab.coins).toBe(K.bomb - 1)
    s = strike(s, choice, o)
    const t = act(s, { type: 'bomb' }, o)
    expect(t.damage - s.damage).toBe(K.bombDmg)
    expect(t.ab.coins).toBe(0)
    expect(t.last.fx).toBe('bomb')
    expect(t.livesLost).toBe(0)
  })
  it('at K.cap coins the rats throw a bomb for you', () => {
    let s = coins(K.cap - 1)
    const before = s.damage
    s = strike(s, choice, o)
    expect(s.last.fx).toBe('bomb')
    expect(s.damage - before).toBe(DAMAGE.choice + K.bombDmg)
    expect(s.ab.coins).toBe(K.cap - K.bomb)
  })
  it('the Lucky Tail costs K.tail, one held, and saves the next heart (an attack costs 1 instead of 2)', () => {
    let s = act(coins(K.tail), { type: 'tail' }, o)
    expect(s.ab.tail).toBe(true)
    expect(s.ab.coins).toBe(0)
    expect(s.last.fx).toBe('buyTail')
    expect(act(s, { type: 'tail' }, o).ab.tail).toBe(true) // one held: a second buy is refused
    s = strike(s, hit('miss', 'typed', { attack: true }), o)
    expect(s.livesLost).toBe(1)
    expect(s.last.fx).toBe('tail')
    expect(s.ab.tail).toBe(false)
    s = strike(s, hit('miss'), o)
    expect(s.livesLost).toBe(2)
  })
  it('buttons: a decision module, none on attacks or inserted questions', () => {
    expect(mod.decision).toBe(true)
    const s = coins(Math.max(K.bomb, K.tail))
    expect(mod.actions(s, { q: { _cardId: 1 } }).map((a) => [a.id, a.enabled])).toEqual([['bomb', true], ['tail', true]])
    expect(mod.actions(coins(Math.min(K.bomb, K.tail) - 1), { q: { _cardId: 1 } }).map((a) => a.enabled)).toEqual([false, false])
    expect(mod.actions(s, { q: { _attack: true } })).toEqual([])
    expect(mod.actions(s, { q: { _inserted: 'minion' } })).toEqual([])
  })
  it("hints only one coin short of the rats' bomb", () => {
    expect(mod.hint(coins(K.cap - 2), { _cardId: 1 })).toBe(null)
    expect(mod.hint(coins(K.cap - 1), { _cardId: 1 }).key).toBe('lg_hint_hoardAuto')
  })
  it('F1 never buying or buying greedily; F2', () => {
    for (const n of [5, 8, 15]) for (const press of ['never', 'greedy']) {
      expect(simulateRaid(mod.id, { n, answer: ALL_CLEAN, press }).outcome).toBe('won')
      expect(simulateRaid(mod.id, { n, answer: ALL_MISS_HARSH, press }).outcome).not.toBe('won')
    }
  })
})
