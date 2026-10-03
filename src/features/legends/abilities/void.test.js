import { describe, it, expect } from 'vitest'
import { newFight, strike, settleFight, fightOutcome } from '../fight'
import { simulateRaid, ALL_CLEAN, CHOICES_THEN_TYPED } from './_sim'
import mod from './void'

const K = mod.K
const hit = (verdict, mode = 'typed', extra = {}) => ({ verdict, mode, ...extra })
const o = { ability: 'horizon', need: 100, lives: 9 }
const run = (hits, opts = o) => hits.reduce((s, h) => strike(s, h, opts), newFight())

describe('raid ability: void (horizon)', () => {
  it('right answers bank their damage; the bar does not move', () => {
    const s = run([hit('clean'), hit('clean', 'choice')])
    expect(s.damage).toBe(0)
    expect(s.ab.bank).toBe(3)
    expect(s.ab.banked).toBe(2)
    expect(s.last.fx).toBe('absorb')
  })
  it('the third banked strike collapses for floor(bank x 1.5)', () => {
    const s = run([hit('clean'), hit('clean'), hit('clean')]) // 2 + 2 + 3 (crit) = 7
    expect(s.damage).toBe(Math.floor(7 * K.mult))
    expect(s.ab.bank).toBe(0)
    expect(s.last.fx).toBe('collapse')
  })
  it('a miss spills the disk at x1', () => {
    const s = run([hit('clean'), hit('glancing'), hit('miss')])
    expect(s.damage).toBe(3)
    expect(s.last.fx).toBe('spill')
    expect(s.ab.banked).toBe(0)
  })
  it('attacks deal their damage at once', () => {
    const s = run([hit('clean', 'typed', { attack: true })])
    expect(s.damage).toBe(1)
    expect(s.ab.bank).toBe(0)
  })
  it('never holds a winning blow, and settle flushes what is left', () => {
    const opts = { ability: 'horizon', need: 3, lives: 3 }
    const s = run([hit('clean')], opts)
    expect(fightOutcome(s, opts)).toBe('won')
    const held = run([hit('clean')])
    const done = settleFight(held, o)
    expect(done.damage).toBe(Math.floor(2 * K.mult))
    expect(done.last.fx).toBe('collapse')
  })
  it('the bar shows the bank as a ghost segment', () => {
    const s = run([hit('clean')])
    expect(mod.barMarks(s, { need: 20, damage: 4 })).toEqual([{ type: 'ghost', at: 16, to: 13, tone: 'purple' }])
    expect(mod.barMarks({ ...newFight(), ab: mod.init() }, { need: 20, damage: 0 })).toEqual([])
  })
  it('F1 including the last question', () => {
    for (const n of [5, 6, 7, 8, 15]) for (const answer of [ALL_CLEAN, CHOICES_THEN_TYPED]) expect(simulateRaid('horizon', { n, answer }).outcome).toBe('won')
  })
})
