// Dreamer, Deep Sleep (design-v2.md section 20).
import { describe, it, expect } from 'vitest'
import { newFight, strike, DAMAGE } from '../fight'
import { simulateRaid, ALL_CLEAN } from './_sim'
import mod from './dreamer'

const K = mod.K
const hit = (verdict, mode = 'typed', extra = {}) => ({ verdict, mode, ...extra })
const run = (hits, opts = { ability: mod.id }) => hits.reduce((s, h) => strike(s, h, opts), newFight())
const C = hit('clean', 'choice')
const M = hit('miss')

describe(`raid ability: dreamer (${mod.id})`, () => {
  it('asleep: right answers sink it deeper; the 4th is a Nightmare for 3, then depth 1', () => {
    expect(run([C]).ab.depth).toBe(1)
    expect(run([C]).last.fx).toBe('deeper')
    const s = run([C, C, C, C])
    expect(s.last.fx).toBe('nightmare')
    expect(s.damage).toBe(4 * DAMAGE.choice + K.nightmare)
    expect(s.ab.depth).toBe(1)
    expect(run([C, C, C, C, C, C, C]).ab.nightmares).toBe(2)
  })
  it('a miss wakes it; two right in a row sing a Lullaby for 2 and it sleeps at depth 1', () => {
    const w = run([C, M])
    expect(w.last.fx).toBe('wake')
    expect(w.ab).toMatchObject({ asleep: false, depth: 0 })
    expect(run([M, C]).last.fx).toBe('hum')
    const l = run([M, C, C])
    expect(l.last.fx).toBe('lullaby')
    expect(l.ab).toMatchObject({ asleep: true, depth: 1, lull: 0 })
    expect(l.damage).toBe(2 * DAMAGE.choice + K.lull)
  })
  it('a miss while awake resets the lullaby (no second wake)', () => {
    const s = run([M, C, M])
    expect(s.ab.lull).toBe(0)
    expect(s.last.fx).toBe('')
    expect(run([M, C, M, C, C]).last.fx).toBe('lullaby')
  })
  it('attacks and inserted questions do not change its state', () => {
    const s = run([C, hit('miss', 'typed', { attack: true }), hit('clean', 'typed', { inserted: 'loop' })])
    expect(s.ab).toMatchObject({ asleep: true, depth: 1 })
  })
  it('hint, HUD, art state and the idle drift follow the two states', () => {
    const q = { _cardId: 1 }
    expect(mod.hint(run([C, C, C]), q, 'typed', {})).toMatchObject({ key: 'lg_hint_sleep' })
    expect(mod.hint(run([C, C]), q, 'typed', {})).toBeNull()
    expect(mod.hint(run([M, C]), q, 'typed', {})).toMatchObject({ key: 'lg_hint_sleepLull' })
    expect(mod.hint(run([C, C, C]), { ...q, _attack: true }, 'typed', {})).toBeNull()
    expect(mod.hud(run([C, C, C]))[1]).toMatchObject({ type: 'pips', n: 3, ready: true })
    expect(mod.hud(run([M]))[0]).toMatchObject({ key: 'lg_hud_sleepAwake' })
    expect(mod.artState(run([M]))).toEqual({ 'data-ab-asleep': 0 })
    expect(mod.idle(run([C]))).toBe('asleep')
    expect(mod.idle(run([M]))).toBe('')
  })
  it('F1: an all-right raid wins', () => {
    for (const n of [5, 8, 15]) expect(simulateRaid(mod.id, { n, answer: ALL_CLEAN }).outcome).toBe('won')
  })
})
