// Banshee, Call and Response (design-v2.md section 18).
import { describe, it, expect } from 'vitest'
import { newFight, strike, DAMAGE } from '../fight'
import { simulateRaid, ALL_CLEAN, ALL_MISS_HARSH } from './_sim'
import mod from './banshee'

const K = mod.K
const hit = (verdict, mode = 'typed', extra = {}) => ({ verdict, mode, ...extra })
const run = (hits, opts = { ability: mod.id }) => hits.reduce((s, h) => strike(s, h, opts), newFight())
const C = hit('clean', 'choice')

describe(`raid ability: banshee (${mod.id})`, () => {
  it('a miss makes her scream; the next right answer shatters it for 2', () => {
    const s = run([hit('miss')])
    expect(s.ab.scream).toBe(true)
    expect(s.last.fx).toBe('wail')
    const t = run([hit('miss'), C])
    expect(t.last.fx).toBe('shatter')
    expect(t.damage).toBe(DAMAGE.choice + K.shatter)
    expect(t.ab.scream).toBe(false)
    expect(run([hit('miss'), C, C]).damage).toBe(2 * DAMAGE.choice + K.shatter)
  })
  it('screams never stack: two misses, one shatter', () => {
    const s = run([hit('miss'), hit('miss'), C, C])
    expect(s.ab.shatters).toBe(1)
    expect(s.damage).toBe(2 * DAMAGE.choice + K.shatter)
  })
  it('a blocked attack silences her; inserted questions never answer her', () => {
    expect(run([hit('miss'), hit('clean', 'typed', { attack: true })]).last.fx).toBe('shatter')
    expect(run([hit('miss'), hit('clean', 'typed', { inserted: 'minion' })]).ab.scream).toBe(true)
  })
  it('she screams at every phase line, so a perfect player shatters too', () => {
    const bar = { total: 12, before: 0, phases: 3 }
    const o = { ability: mod.id, need: 12, lives: 3, bar }
    let s = run([hit('clean')], o) // 2 of 12
    expect(s.ab.scream).toBe(false)
    s = strike(s, hit('clean'), o) // 4 of 12: phase 2 begins
    expect(s.ab.scream).toBe(true)
    expect(s.last.fx).toBe('wail')
    s = strike(s, hit('clean'), o) // a critical + the shatter
    expect(s.last.fx).toBe('shatter')
    expect(s.damage).toBe(4 + DAMAGE.clean + 1 + K.shatter)
  })
  it('the hint and HUD show only while she screams', () => {
    const q = { _cardId: 1 }
    expect(mod.hint(run([C]), q, 'typed', {})).toBeNull()
    expect(mod.hint(run([hit('miss')]), q, 'typed', {})).toMatchObject({ key: 'lg_hint_scream' })
    expect(mod.hint(run([hit('miss')]), { ...q, _inserted: 'loop' }, 'typed', {})).toBeNull()
    expect(mod.hud(run([C]))).toEqual([])
    expect(mod.hud(run([hit('miss')]))[0]).toMatchObject({ type: 'chip', ready: true })
  })
  it('F1 / F2: all right wins with shatters; all wrong never shatters', () => {
    for (const n of [5, 8, 15]) {
      const r = simulateRaid(mod.id, { n, answer: ALL_CLEAN })
      expect(r.outcome).toBe('won')
      expect(r.state.ab.shatters).toBeGreaterThan(0)
      expect(simulateRaid(mod.id, { n, answer: ALL_MISS_HARSH }).state.ab.shatters).toBe(0)
    }
  })
})
