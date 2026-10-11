// Horseman: The Midnight Ride (design v2.1, #28).
import { describe, it, expect } from 'vitest'
import { newFight, strike, DAMAGE, MISS_LIVES } from '../fight'
import { simulateRaid, ALL_CLEAN, ALL_MISS_HARSH } from './_sim'
import mod from './horseman'

const K = mod.K
const o = { ability: mod.id }
const hit = (verdict, mode = 'typed', extra = {}) => ({ verdict, mode, ...extra })
const run = (hits, s = newFight()) => hits.reduce((x, h) => strike(x, h, o), s)
const choice = hit('clean', 'choice')
const clean = hit('clean')
const miss = hit('miss')
const rep = (n, x) => Array.from({ length: n }, () => x)

describe('raid ability: horseman (ride)', () => {
  it('starts on the road with a lead of K.lead', () => {
    expect(mod.init()).toMatchObject({ road: 0, lead: K.lead })
  })
  it('every right answer gallops one stretch; the K.bridge-th crosses the bridge for +K.cross and the road starts over', () => {
    let s = run(rep(K.bridge - 1, choice))
    expect(s.ab.road).toBe(K.bridge - 1)
    expect(s.last.fx).toBe('gallop')
    const before = s.damage
    s = strike(s, choice, o)
    expect(s.last.fx).toBe('cross')
    expect(s.damage - before).toBe(DAMAGE.choice + K.cross)
    expect(s.ab.road).toBe(0)
    expect(s.ab.crossings).toBe(1)
  })
  it('a clean typed answer wins a lost length back (capped); a choice or a slip only holds the lead', () => {
    expect(run([miss, clean]).ab.lead).toBe(K.lead)
    expect(run(rep(5, clean)).ab.lead).toBe(K.maxLead)
    expect(run([miss, choice]).ab.lead).toBe(K.lead - 1)
    expect(run([miss, hit('glancing')]).ab.lead).toBe(K.lead - 1)
    // full recall after a miss is the escape: miss, clean, miss never gets caught
    expect(run([miss, clean, miss]).last.fx).toBe('close')
  })
  it('a miss lets him gain: one length behind plays Close; caught throws you back to the start, nothing more', () => {
    let s = run([choice, choice, miss])
    expect(s.ab.lead).toBe(1)
    expect(s.last.fx).toBe('close')
    expect(s.ab.road).toBe(2)
    const lost = s.livesLost
    s = strike(s, miss, o)
    expect(s.last.fx).toBe('caught')
    expect(s.ab.road).toBe(0)
    expect(s.ab.lead).toBe(K.lead)
    expect(s.livesLost - lost).toBe(MISS_LIVES) // the miss costs its own heart, never more
  })
  it('a right answer never loses ground; misses never move the road', () => {
    const s = run([choice, miss])
    expect(s.ab.road).toBe(1)
    expect(run([choice, choice, miss, choice]).ab.road).toBe(3)
  })
  it('attacks and inserted questions move neither rider', () => {
    let s = run([choice, choice])
    const ab = { ...s.ab }
    s = strike(s, hit('clean', 'typed', { attack: true }), o)
    s = strike(s, hit('miss', 'typed', { attack: true }), o)
    s = strike(s, hit('clean', 'typed', { inserted: 'minion' }), o)
    s = strike(s, hit('miss', 'typed', { inserted: 'minion' }), o)
    expect(s.ab.road).toBe(ab.road)
    expect(s.ab.lead).toBe(ab.lead)
  })
  it('hints only when this question decides: he is one length behind, or the bridge is one stretch away', () => {
    const q = { _cardId: 1 }
    expect(mod.hint(run([choice]), q)).toBe(null)
    expect(mod.hint(run([choice, miss]), q).key).toBe('lg_hint_rideClose')
    expect(mod.hint(run(rep(K.bridge - 1, choice)), q).key).toBe('lg_hint_rideCross')
    expect(mod.hint(run([choice, miss]), { _attack: true })).toBe(null)
    expect(mod.hud(run([choice, miss]))[1].ready).toBe(true)
    expect(mod.artState(run([choice, miss]))['data-ab-ride']).toBe('close')
    expect(mod.artState(run([choice]))['data-ab-ride']).toBe('far')
  })
  it("the road covered is kept for today's next attempt (never past one stretch short of the bridge); the lead starts full", () => {
    const s = run([choice, choice, choice, miss])
    expect(mod.dayState(s)).toEqual({ road: 3 })
    expect(mod.init({ dayAb: { road: 3 } })).toMatchObject({ road: 3, lead: K.lead })
    expect(mod.init({ dayAb: { road: 99 } }).road).toBe(K.bridge - 1)
    expect(mod.init({ dayAb: null }).road).toBe(0)
    expect(mod.init({ dayAb: { road: 'x' } }).road).toBe(0)
  })
  it('F1 / F2 in whole raids', () => {
    for (const n of [5, 8, 15]) {
      expect(simulateRaid(mod.id, { n, answer: ALL_CLEAN }).outcome).toBe('won')
      expect(simulateRaid(mod.id, { n, answer: ALL_MISS_HARSH }).outcome).not.toBe('won')
    }
  })
})
