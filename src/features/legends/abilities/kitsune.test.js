// Kitsune: Starball Rally (design v2.1, #22).
import { describe, it, expect } from 'vitest'
import { newFight, strike, DAMAGE } from '../fight'
import { simulateRaid, ALL_CLEAN, ALL_MISS_HARSH } from './_sim'
import mod from './kitsune'

const K = mod.K
const o = { ability: mod.id }
const hit = (verdict, mode = 'typed', extra = {}) => ({ verdict, mode, ...extra })
const run = (hits, s = newFight()) => hits.reduce((x, h) => strike(x, h, o), s)
const choice = hit('clean', 'choice')

describe('raid ability: kitsune (rally)', () => {
  it('every right answer returns the ball; the 4th in a row bursts into a Starfall and the rally restarts', () => {
    let s = run([choice, hit('glancing'), choice])
    expect(s.ab.rally).toBe(3)
    expect(s.last.fx).toBe('volley')
    const before = s.damage
    s = strike(s, choice, o)
    expect(s.last.fx).toBe('starfall')
    expect(s.damage - before).toBe(DAMAGE.choice + K.starfall)
    expect(s.ab.rally).toBe(0)
  })
  it('a miss: she catches it (rally 0); a miss with no rally plays nothing', () => {
    let s = run([choice, choice, hit('miss')])
    expect(s.last.fx).toBe('caught')
    expect(s.ab.rally).toBe(0)
    s = strike(s, hit('miss'), o)
    expect(s.last.fx).toBe('')
  })
  it('attacks and inserted questions keep the rally and never add to it', () => {
    let s = run([choice, choice])
    s = strike(s, hit('clean', 'typed', { attack: true }), o)
    s = strike(s, hit('miss', 'typed', { attack: true }), o)
    s = strike(s, hit('clean', 'typed', { inserted: 'minion' }), o)
    expect(s.ab.rally).toBe(2)
  })
  it('hints only on the bursting return; the HUD is ready then', () => {
    const q = { _cardId: 1 }
    expect(mod.hint(run([choice, choice]), q)).toBe(null)
    expect(mod.hint(run([choice, choice, choice]), q).key).toBe('lg_hint_rally')
    expect(mod.hint(run([choice, choice, choice]), { _attack: true })).toBe(null)
    expect(mod.hud(run([choice, choice, choice]))[0].ready).toBe(true)
  })
  it('F1 / F2 in whole raids', () => {
    for (const n of [5, 8, 15]) {
      expect(simulateRaid(mod.id, { n, answer: ALL_CLEAN }).outcome).toBe('won')
      expect(simulateRaid(mod.id, { n, answer: ALL_MISS_HARSH }).outcome).not.toBe('won')
    }
  })
})
