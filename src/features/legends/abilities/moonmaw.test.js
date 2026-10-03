// Moonmaw: Moonfall (design v2.1, #21).
import { describe, it, expect } from 'vitest'
import { newFight, strike, settleFight, DAMAGE } from '../fight'
import { simulateRaid, ALL_CLEAN, ALL_MISS_HARSH } from './_sim'
import mod from './moonmaw'

const K = mod.K
const o = { ability: mod.id }
const hit = (verdict, mode = 'typed', extra = {}) => ({ verdict, mode, ...extra })
const run = (hits, s = newFight()) => hits.reduce((x, h) => strike(x, h, o), s)
const clean = hit('clean')

describe('raid ability: moonmaw (moons)', () => {
  it('only clean typed raid answers charge a moon; the 3rd flings one into orbit', () => {
    let s = run([hit('clean', 'choice'), hit('glancing'), hit('clean', 'typed', { attack: true }), hit('clean', 'typed', { inserted: 'minion' })])
    expect(s.ab.cleans).toBe(0)
    s = run([clean, clean], s)
    expect(s.last.fx).toBe('charge')
    expect(s.ab.cleans).toBe(2)
    s = strike(s, clean, o)
    expect(s.last.fx).toBe('launch')
    expect(s.ab.orbit).toEqual([K.delay])
  })
  it('a moon crashes for 2 two raid answers later, even on a miss; attacks do not tick it', () => {
    let s = run([clean, clean, clean])
    s = strike(s, hit('clean', 'typed', { attack: true }), o) // an attack: no tick
    expect(s.ab.orbit).toEqual([K.delay])
    s = strike(s, hit('miss'), o)
    expect(s.last.fx).toBe('')
    const before = s.damage
    s = strike(s, hit('miss'), o)
    expect(s.last.fx).toBe('impact')
    expect(s.damage - before).toBe(K.hit) // the miss deals 0, the moon 2
    expect(s.ab.orbit).toEqual([])
    expect(s.ab.landed).toBe(1)
  })
  it('a right answer that lands a moon deals both', () => {
    let s = run([clean, clean, clean, hit('clean', 'choice')])
    const before = s.damage
    s = strike(s, hit('clean', 'choice'), o)
    expect(s.damage - before).toBe(DAMAGE.choice + K.hit)
  })
  it('settle crashes the moons still in orbit', () => {
    const s = run([clean, clean, clean])
    const t = settleFight(s, o)
    expect(t.damage - s.damage).toBe(K.hit)
    expect(t.last.fx).toBe('impact')
    const one = run([clean])
    expect(settleFight(one, o).damage).toBe(one.damage)
  })
  it('hints only when a moon lands now or a clean typed answer now launches one', () => {
    const q = { _cardId: 1 }
    const ctx = { phase: 1 }
    expect(mod.hint({ ab: mod.init() }, q, 'typed', ctx)).toBe(null)
    const two = run([clean, clean])
    expect(mod.hint(two, q, 'typed', ctx).key).toBe('lg_hint_moonsLaunch')
    expect(mod.hint(two, q, 'choice', ctx)).toBe(null)
    const landing = run([clean, clean, clean, hit('miss')])
    expect(mod.hint(landing, q, 'typed', ctx).key).toBe('lg_hint_moonsLand')
    expect(mod.hint(landing, { _attack: true }, 'typed', ctx)).toBe(null)
  })
  it('F1 / F2 in whole raids', () => {
    for (const n of [5, 8, 15]) {
      expect(simulateRaid(mod.id, { n, answer: ALL_CLEAN }).outcome).toBe('won')
      expect(simulateRaid(mod.id, { n, answer: ALL_MISS_HARSH }).outcome).not.toBe('won')
    }
  })
})
