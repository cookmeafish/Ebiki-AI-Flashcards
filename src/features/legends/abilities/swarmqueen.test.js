// Swarmqueen, Wildfire Comb (design-v2.md section 16).
import { describe, it, expect } from 'vitest'
import { newFight, strike, DAMAGE } from '../fight'
import { simulateRaid, ALL_CLEAN } from './_sim'
import mod from './swarmqueen'

const K = mod.K
const o = { ability: mod.id }
const hit = (verdict, mode = 'typed', extra = {}) => ({ verdict, mode, ...extra })
const run = (hits, opts = o) => hits.reduce((s, h) => strike(s, h, opts), newFight())
const C = hit('clean', 'choice') // a right answer with no critical in the way

describe(`raid ability: swarmqueen (${mod.id})`, () => {
  it('a right answer ignites a cell and the fire spreads to a second', () => {
    const s = run([C])
    expect(s.ab.burning).toBe(2)
    expect(s.last.fx).toBe('ignite')
    expect(s.damage).toBe(DAMAGE.choice)
  })
  it('a miss lets a drone douse one cell (never below 0, no effect on an empty comb)', () => {
    expect(run([C, hit('miss')]).ab.burning).toBe(1)
    expect(run([C, hit('miss')]).last.fx).toBe('douse')
    const empty = run([hit('miss')])
    expect(empty.ab.burning).toBe(0)
    expect(empty.last.fx).toBe('')
  })
  it('all six cells burning: Hive Ablaze for 2, and the comb starts over', () => {
    const s = run([C, C, C])
    expect(s.last.fx).toBe('ablaze')
    expect(s.ab.burning).toBe(0)
    expect(s.damage).toBe(3 * DAMAGE.choice + K.blaze)
    // 5 burning (2 + 2, a miss, then 2): the next right reaches 6 too (ignite only, the spread has nowhere to go)
    expect(run([C, C, hit('miss'), C]).ab.burning).toBe(5)
    expect(run([C, C, hit('miss'), C, C]).last.fx).toBe('ablaze')
  })
  it('attacks and inserted questions do nothing to the comb', () => {
    const s = run([C, hit('clean', 'typed', { attack: true }), hit('miss', 'typed', { attack: true }), hit('clean', 'typed', { inserted: 'minion' })])
    expect(s.ab.burning).toBe(2)
  })
  it('the hint shows only when the next right answer sets the hive ablaze; the HUD is ready then', () => {
    const q = { _cardId: 1 }
    const ready = run([C, C])
    expect(mod.hint(ready, q, 'typed', {})).toMatchObject({ key: 'lg_hint_wildfire' })
    expect(mod.hint(ready, { ...q, _attack: true }, 'typed', {})).toBeNull()
    expect(mod.hint(run([C]), q, 'typed', {})).toBeNull()
    expect(mod.hud(ready)[0]).toMatchObject({ type: 'board', shape: 'hex7', ready: true })
    expect(mod.hud(ready)[0].cells).toEqual([2, 1, 1, 1, 1, 0, 0])
    expect(mod.artState(ready)).toEqual({ 'data-ab-comb': 4 })
  })
  it('F1: an all-right raid wins', () => {
    for (const n of [5, 8, 15]) expect(simulateRaid(mod.id, { n, answer: ALL_CLEAN }).outcome).toBe('won')
  })
})
