import { describe, it, expect } from 'vitest'
import { newFight, strike, DAMAGE, COMBO_EVERY } from '../fight'
import { simulateRaid, ALL_CLEAN, CHOICE_HEAVY, ALL_MISS_HARSH } from './_sim'
import mod from './tempest'

const K = mod.K
const hit = (verdict, mode = 'typed', extra = {}) => ({ verdict, mode, ...extra })
const o = { ability: 'drums' }
const run = (hits) => hits.reduce((s, h) => strike(s, h, o), newFight())
const C = hit('clean', 'choice') // a right choice: 1 damage, no crit, so the sums stay simple
const M = hit('miss')

describe('raid ability: tempest (drums)', () => {
  it('beats 1 to 3 light a drum on a right answer; the 4th brings the thunder, 1 per lit drum', () => {
    const s = run([C, C, C, C])
    expect(s.damage).toBe(4 * DAMAGE.choice + 3 * K.per)
    expect(s.last.fx).toBe('thunder')
    expect(s.last.fxVars).toEqual({ n: 3 })
    expect(s.ab.drums).toEqual([])
  })
  it('the thunder beat strikes whatever its own answer; a miss on beats 1 to 3 leaves that drum dark', () => {
    const s = run([C, M, C, M])
    expect(s.damage).toBe(2 * DAMAGE.choice + 2 * K.per)
    expect(s.last.fx).toBe('thunder')
    expect(run([C, M]).last.fx).toBe('dud')
    expect(run([C]).last.fx).toBe('drum')
  })
  it('a measure with no drum lit is a dull rumble: no damage', () => {
    const s = run([M, M, M, C])
    expect(s.damage).toBe(DAMAGE.choice)
    expect(s.last.fx).toBe('dud')
  })
  it('the measure restarts after the thunder', () => {
    const s = run([C, C, C, C, C])
    expect(s.ab.drums).toEqual([true])
    expect(s.ab.thunders).toBe(1)
  })
  it('attacks and inserted questions do not advance the beat', () => {
    let s = run([C, C])
    s = strike(s, hit('clean', 'typed', { attack: true }), o)
    s = strike(s, hit('clean', 'typed', { inserted: 'minion' }), o)
    expect(s.ab.drums).toEqual([true, true])
  })
  it('keeps the base critical on clean typed answers', () => {
    const s = run(Array(COMBO_EVERY).fill(hit('clean')))
    expect(s.crits).toBe(1)
  })
  it('hint only on the thunder beat with lit drums; HUD shows the beat and is ready then', () => {
    const q = { kind: 'typed' }
    expect(mod.hint(run([C, C]), q)).toBeNull()
    const s = run([C, M, C])
    expect(mod.hint(s, q)).toMatchObject({ key: 'lg_hint_drums', vars: { n: 2 } })
    expect(mod.hint(s, { ...q, _attack: true })).toBeNull()
    expect(mod.hint(run([M, M, M]), q)).toBeNull()
    const h = mod.hud(s)[0]
    expect(h.cells).toEqual([1, 0, 1, 2])
    expect(h.ready).toBe(true)
    expect(mod.hud(run([C]))[0].cells).toEqual([1, 2, 0, 0])
  })
  it('F1 and F2 in whole raids', () => {
    for (const n of [5, 8, 15]) {
      expect(simulateRaid('drums', { n, answer: ALL_CLEAN }).outcome).toBe('won')
      expect(simulateRaid('drums', { n, answer: CHOICE_HEAVY }).outcome).toBe('won')
      expect(simulateRaid('drums', { n, answer: ALL_MISS_HARSH }).outcome).not.toBe('won')
    }
  })
})
