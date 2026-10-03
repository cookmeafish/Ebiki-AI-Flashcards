import { describe, it, expect } from 'vitest'
import { newFight, strike, DAMAGE } from '../fight'
import { simulateRaid, ALL_CLEAN, CHOICE_HEAVY, ALL_MISS_HARSH } from './_sim'
import mod from './puppeteer'

const K = mod.K
const hit = (verdict, mode = 'typed', extra = {}) => ({ verdict, mode, ...extra })
const o = { ability: 'puppets' }
const run = (hits) => hits.reduce((s, h) => strike(s, h, o), newFight())
const H = hit('clean', 'choice')
const M = hit('miss')
const four = Array(K.every).fill(H)

describe('raid ability: puppeteer (puppets)', () => {
  it('every 4th right answer steals a puppet, up to 2', () => {
    expect(run(four).ab.puppets).toBe(1)
    expect(run(four).last.fx).toBe('steal')
    expect(run([...four, ...four]).ab.puppets).toBe(2)
    expect(run([...four, ...four, ...four, ...four]).ab.puppets).toBe(K.max)
    expect(run([H, H, H]).ab.puppets).toBe(0)
  })
  it('each puppet kicks for 1 on every raid answer, even a miss, before the yank', () => {
    const s1 = run([...four, H])
    expect(s1.damage).toBe(5 * DAMAGE.choice + K.kick)
    expect(s1.last.fx).toBe('kick')
    const s2 = run([...four, M])
    expect(s2.damage).toBe(4 * DAMAGE.choice + K.kick)
    expect(s2.last.fx).toBe('yank')
    expect(s2.ab.puppets).toBe(0)
  })
  it('a miss with no puppet does nothing more', () => {
    const s = run([M])
    expect(s.damage).toBe(0)
    expect(s.last.fx).toBe('')
  })
  it('attacks and inserted questions: no kicks, no steals', () => {
    let s = run([...four])
    const d = s.damage
    s = strike(s, hit('clean', 'typed', { attack: true }), o)
    s = strike(s, hit('miss', 'typed', { inserted: 'minion' }), o)
    expect(s.damage).toBe(d + DAMAGE.counter)
    expect(s.ab.puppets).toBe(1)
  })
  it('hint before a steal; HUD order stays stable', () => {
    const q = { kind: 'typed' }
    expect(mod.hint(run([H, H, H]), q)).toMatchObject({ key: 'lg_hint_puppets' })
    expect(mod.hint(run([H, H]), q)).toBeNull()
    expect(mod.hint(run([H, H, H]), { ...q, _attack: true })).toBeNull()
    const hud = mod.hud(run([H, H, H]))
    expect(hud.map((h) => h.labelKey)).toEqual(['lg_hud_puppets', 'lg_hud_strings'])
    expect(hud[1].ready).toBe(true)
  })
  it('F1 and F2 in whole raids', () => {
    for (const n of [5, 8, 15]) {
      expect(simulateRaid('puppets', { n, answer: ALL_CLEAN }).outcome).toBe('won')
      expect(simulateRaid('puppets', { n, answer: CHOICE_HEAVY }).outcome).toBe('won')
      expect(simulateRaid('puppets', { n, answer: ALL_MISS_HARSH }).outcome).not.toBe('won')
    }
  })
})
