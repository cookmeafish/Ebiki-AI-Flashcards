import { describe, it, expect } from 'vitest'
import { newFight, strike, DAMAGE } from '../fight'
import { simulateRaid, ALL_CLEAN, ALL_MISS_HARSH } from './_sim'
import mod from './hydra'

const K = mod.K
const hit = (verdict, mode = 'typed', extra = {}) => ({ verdict, mode, ...extra })
const o = { ability: 'heads', need: 100, lives: 9 }
const run = (hits, opts = o) => hits.reduce((s, h) => strike(s, h, opts), newFight())

describe('raid ability: hydra (heads)', () => {
  it('every right answer cuts a head, choices and glancing ones too', () => {
    expect(run([hit('clean')]).ab.heads).toBe(K.base - 1)
    expect(run([hit('clean', 'choice')]).ab.heads).toBe(K.base - 1)
    expect(run([hit('glancing')]).ab.heads).toBe(K.base - 1)
    expect(run([hit('clean')]).last.fx).toBe('sever')
  })
  it('a blocked attack cuts a head; a missed attack grows none', () => {
    expect(run([hit('clean', 'typed', { attack: true })]).ab.heads).toBe(K.base - 1)
    expect(run([hit('miss', 'typed', { attack: true })]).ab.heads).toBe(K.base)
  })
  it('a miss grows K.grow heads, capped at K.max', () => {
    const s = run([hit('miss')])
    expect(s.ab.heads).toBe(K.base + K.grow)
    expect(s.last.fx).toBe('grow')
    expect(run([hit('miss'), hit('miss'), hit('miss')]).ab.heads).toBe(K.max)
  })
  it('cutting the last head cauterizes for K.burn and three heads stand again', () => {
    const s = run([hit('clean'), hit('clean'), hit('clean')])
    expect(s.last.fx).toBe('cauterize')
    expect(s.ab.heads).toBe(K.base)
    // 2 + 2 + (2 + crit 1 + burn)
    expect(s.damage).toBe(DAMAGE.clean * 3 + DAMAGE.crit + K.burn)
  })
  it('keeps the most heads since the last burn (the stumps), and an old state without it reads as the base', () => {
    const s = run([hit('miss'), hit('clean'), hit('clean')])
    expect(s.ab).toMatchObject({ heads: K.base, top: K.base + K.grow })
    expect(mod.artState(s)['data-ab-top']).toBe(K.base + K.grow)
    expect(mod.artState({ ab: { heads: 2, burns: 0 } })['data-ab-top']).toBe(K.base)
    // an old state cut down and burned: the burn starts from the base three
    const old = strike({ ...newFight(), ab: { heads: 1, burns: 0 } }, hit('clean'), o)
    expect(old.ab).toMatchObject({ heads: K.base, top: K.base, burnt: K.base })
  })
  it('the HUD is ready at one head, and the hint shows only then', () => {
    const s = run([hit('clean'), hit('clean')])
    expect(mod.hud(s)[0].ready).toBe(true)
    expect(mod.hint(s, {})).toBeTruthy()
    expect(mod.hint(run([hit('clean')]), {})).toBe(null)
  })
  it('fair: all right wins, all wrong never does', () => {
    for (const n of [5, 8, 15]) {
      expect(simulateRaid('heads', { n, answer: ALL_CLEAN }).outcome).toBe('won')
      expect(simulateRaid('heads', { n, answer: ALL_MISS_HARSH }).outcome).not.toBe('won')
    }
  })
})
