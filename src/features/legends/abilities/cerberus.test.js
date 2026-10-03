// Cerberus: Shackles (design v2.1, #27).
import { describe, it, expect } from 'vitest'
import { newFight, strike, DAMAGE } from '../fight'
import { simulateRaid, ALL_CLEAN, ALL_MISS_HARSH } from './_sim'
import mod, { headFor } from './cerberus'

const K = mod.K
const o = { ability: mod.id }
const hit = (verdict, mode = 'typed', extra = {}) => ({ verdict, mode, ...extra })
const run = (hits, s = newFight()) => hits.reduce((x, h) => strike(x, h, o), s)
const clean = hit('clean')
const choice = hit('clean', 'choice')
const glance = hit('glancing')
const miss = hit('miss')
const blocked = hit('clean', 'typed', { attack: true })

describe('raid ability: cerberus (shackles)', () => {
  it('each head is chained by its own deed: clean typed the Iron head, any other right answer the Fire head, a recovery the Shadow head', () => {
    expect(run([clean]).last.fx).toBe('bindIron')
    expect(run([choice]).last.fx).toBe('bindFire')
    expect(run([glance]).last.fx).toBe('bindFire')
    expect(run([blocked]).last.fx).toBe('bindShadow')
    expect(run([miss, choice]).last.fx).toBe('bindShadow')
    expect(run([miss, miss, clean, clean]).last.fx).toBe('bindIron')
    expect(headFor({ fire: false, iron: true, shadow: false }, { clean: true })).toBe('fire')
    expect(headFor({ fire: true, iron: true, shadow: true }, { clean: true })).toBe(null)
    expect(headFor({ fire: true, iron: false, shadow: true }, { recover: true, clean: true })).toBe('iron')
  })
  it('a right answer that chains nothing new changes nothing (the Shadow head waits for a recovery)', () => {
    const s = run([clean, choice, clean, glance])
    expect(s.ab).toMatchObject({ fire: true, iron: true, shadow: false })
    expect(s.last.fx).toBe('')
  })
  it('all three chained: BOUND for +4, and every head tears free again', () => {
    let s = run([clean, choice])
    const before = s.damage
    s = strike(s, blocked, o)
    expect(s.last.fx).toBe('bound')
    expect(s.damage - before).toBe(DAMAGE.counter + K.bound)
    expect(s.ab).toMatchObject({ fire: false, iron: false, shadow: false, bounds: 1 })
  })
  it('a miss lets the Fire head slip its chain; the other two hold; a miss with the Fire head free does nothing more', () => {
    let s = run([clean, choice, miss])
    expect(s.last.fx).toBe('snap')
    expect(s.ab).toMatchObject({ fire: false, iron: true })
    s = strike(s, miss, o)
    expect(s.last.fx).not.toBe('snap')
    s = run([hit('miss', 'typed', { attack: true })], run([choice]))
    expect(s.last.fx).toBe('snap')
  })
  it('a right answer never costs a life and inserted questions move no chain', () => {
    const s = run([clean, choice, hit('clean', 'typed', { inserted: 'loop' })])
    expect(s.livesLost).toBe(0)
    expect(run([hit('miss', 'typed', { inserted: 'loop' })], s).ab).toMatchObject({ fire: true, afterMiss: false })
    expect(s.ab).toMatchObject({ fire: true, iron: true, shadow: false })
  })
  it('hints only when THIS question can chain the last free head', () => {
    const q = { _cardId: 1 }
    const att = { _cardId: 2, _attack: true }
    expect(mod.hint(run([clean]), q)).toBe(null)
    expect(mod.hint(run([clean, blocked]), q).key).toBe('lg_hint_shacklesFire')
    expect(mod.hint(run([choice, blocked]), q).key).toBe('lg_hint_shacklesIron')
    expect(mod.hint(run([choice, blocked]), att)).toBe(null)
    expect(mod.hint(run([clean, choice]), q)).toBe(null)
    expect(mod.hint(run([clean, choice, miss, choice]), q).key).toBe('lg_hint_shacklesFire')
    expect(mod.hint(run([clean, choice]), att).key).toBe('lg_hint_shacklesShadow')
    expect(mod.hint(run([clean, choice]), { _inserted: 'x' })).toBe(null)
  })
  it('HUD keeps its three heads in place; the art shows each chained head', () => {
    const h = mod.hud(run([clean, choice]))
    expect(h.map((x) => x.labelKey)).toEqual(['lg_hud_shackFire', 'lg_hud_shackIron', 'lg_hud_shackShadow'])
    expect(h.map((x) => x.n)).toEqual([1, 1, 0])
    expect(h[2].ready).toBe(true)
    expect(mod.artState(run([clean]))).toEqual({ 'data-ab-fire': 0, 'data-ab-iron': 1, 'data-ab-shadow': 0 })
  })
  it('F1 / F2 in whole raids', () => {
    for (const n of [5, 8, 15]) {
      expect(simulateRaid(mod.id, { n, answer: ALL_CLEAN }).outcome).toBe('won')
      expect(simulateRaid(mod.id, { n, answer: ALL_MISS_HARSH }).outcome).not.toBe('won')
    }
  })
})
