import { describe, it, expect } from 'vitest'
import { newFight, strike, act, fightOutcome } from '../fight'
import { simulateRaid, ALL_CLEAN, CHOICES_THEN_TYPED, mixed } from './_sim'
import mod from './chimera'

const K = mod.K
const hit = (verdict, mode = 'typed', extra = {}) => ({ verdict, mode, ...extra })
const bar = { total: 30, before: 0, phases: 3 } // three heads of 10
const o = { ability: 'threeheads', need: 30, lives: 3, bar }
const run = (hits, opts = o, s0 = newFight()) => hits.reduce((s, h) => strike(s, h, opts), s0)
const Q = { kind: 'typed', _cardId: 1 }

describe('raid ability: chimera (threeheads)', () => {
  it('damage goes to the first living head in line by default (Goat), and the phase lines are the heads', () => {
    const s = run([hit('clean'), hit('clean')])
    expect(s.ab.hurt).toEqual([0, 4, 0])
  })
  it('a head falls: +K.fall and its boon; overkill spills on', () => {
    // 2 + 2 + 3 (crit) + 2 = 9, then 2 more: Goat takes 1, falls (+1 spills), Lion takes 2
    const s = run([hit('clean'), hit('clean'), hit('clean'), hit('clean'), hit('clean')])
    expect(s.ab.dead).toEqual([false, true, false])
    expect(s.ab.boons).toContain(1)
    expect(s.last.fx).toBe('fallGoat')
    expect(s.ab.hurt[0]).toBe(1 + K.fall)
    expect(s.damage).toBe(9 + 2 + K.fall)
  })
  it('aiming moves the damage; the buttons never show on attacks or inserted questions', () => {
    let s = run([hit('clean')])
    const acts = mod.actions({ ...s }, { q: Q })
    expect(acts.map((a) => a.id)).toEqual(['aim-goat', 'aim-lion', 'aim-serpent'])
    expect(acts.find((a) => a.on).id).toBe('aim-goat')
    s = act(s, { type: 'aim-serpent' }, o)
    expect(s.last.fx).toBe('aim')
    s = strike(s, hit('clean'), o)
    expect(s.ab.hurt).toEqual([0, 2, 2])
    expect(mod.actions(s, { q: { ...Q, _attack: true } })).toEqual([])
    expect(mod.actions(s, { q: { ...Q, _inserted: 'minion' } })).toEqual([])
  })
  it("Lion's Heart: +1 on clean typed; Serpent's Venom: +1 on every right answer", () => {
    const base = { ...newFight(), ab: { ...mod.init({ bar }), boons: [0] } }
    expect(strike(base, hit('clean'), o).damage).toBe(2 + K.lion)
    expect(strike(base, hit('clean', 'choice'), o).damage).toBe(1)
    const sv = { ...newFight(), ab: { ...mod.init({ bar }), boons: [2] } }
    expect(strike(sv, hit('clean', 'choice'), o).damage).toBe(1 + K.serpent)
  })
  it("Goat's Horn: the next lost heart is blocked (a heart already lost stays lost), and the horn grows back at a phase line", () => {
    const ab = { ...mod.init({ bar }), hurt: [0, 9, 0], dead: [false, false, false] }
    let s = strike({ ...newFight(), livesLost: 1, ab }, hit('clean'), o)
    expect(s.ab.dead[1]).toBe(true)
    expect(s.livesLost).toBe(1)
    expect(s.ab.ward).toBe(1)
    s = strike(s, hit('miss'), o)
    expect(s.livesLost).toBe(1)
    expect(s.last.fx).toBe('goatBlock')
    expect(s.ab.ward).toBe(0)
    // Damage into the Lion until the second phase line (20 dealt): the horn is back.
    for (let i = 0; i < 6 && s.damage < 20; i++) s = strike(s, hit('clean'), o)
    expect(s.damage).toBeGreaterThanOrEqual(20)
    expect(s.ab.ward).toBe(1)
  })
  it('the wounds stay on the right heads across the day (dayState / dayAb)', () => {
    const s = run([hit('clean')], o, newFight())
    const saved = mod.dayState(act(s, { type: 'aim-lion' }, o))
    const next = strike(newFight(), hit('clean'), { ...o, bar: { ...bar, before: 2 }, need: 28, dayAb: saved })
    expect(next.ab.hurt).toEqual([0, 4, 0])
    const wounded = mod.init({ bar: { total: 30, before: 15, phases: 3 } })
    expect(wounded.dead).toEqual([false, true, false])
    expect(wounded.hurt[0]).toBe(5)
    expect(wounded.ward).toBe(1)
  })
  it('the last head falling ends the fight', () => {
    let s = newFight()
    for (let i = 0; i < 20 && !fightOutcome(s, o); i++) s = strike(s, hit('clean'), o)
    expect(fightOutcome(s, o)).toBe('won')
    expect(s.ab.dead).toEqual([true, true, true])
  })
  it('F1 for every aim order and for no tap; in the power band', () => {
    const orders = [['aim-lion'], ['aim-serpent'], ['aim-lion', 'aim-serpent']]
    for (const n of [5, 8, 15]) {
      for (const answer of [ALL_CLEAN, CHOICES_THEN_TYPED]) {
        expect(simulateRaid('threeheads', { n, answer }).outcome).toBe('won')
        for (const pick of orders) expect(simulateRaid('threeheads', { n, answer, press: (acts) => acts.filter((a) => pick.includes(a.id)).slice(0, 1).map((a) => a.id) }).outcome).toBe('won')
      }
    }
    expect(simulateRaid('threeheads', { n: 15, answer: mixed(0.2) }).asked).toBeLessThanOrEqual(15)
  })
})
