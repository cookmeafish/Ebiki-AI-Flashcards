// Reaper, Reaper's Line (design-v2.md section 19).
import { describe, it, expect } from 'vitest'
import { newFight, strike, barPhase, phaseFloor, DAMAGE } from '../fight'
import { simulateRaid, ALL_CLEAN, ALL_MISS_HARSH, mixed } from './_sim'
import mod from './reaper'

const hit = (verdict, mode = 'typed', extra = {}) => ({ verdict, mode, ...extra })
const C = hit('clean', 'choice')
const opts = (total = 24, before = 0) => ({ ability: mod.id, need: total - before, lives: 3, bar: { total, before, phases: 3 } })
const run = (hits, o = opts()) => hits.reduce((s, h) => strike(s, h, o), newFight())

describe(`raid ability: reaper (${mod.id})`, () => {
  it('the line starts at the phase floor, climbs 1 per right answer and slips 1 per miss (never below the floor)', () => {
    expect(run([C]).ab.line).toBe(16 + 1)
    expect(run([C]).last.fx).toBe('climb')
    expect(run([C, hit('miss')]).ab.line).toBe(16)
    expect(run([hit('miss'), hit('miss')]).ab.line).toBe(16)
  })
  it('a right answer that leaves his health at or under the line reaps the phase exactly to the floor', () => {
    // 24 hp, floor 16: answers of 1 bring the health to 23, 22, 21, 20 with the line at 17, 18, 19, 20: reaped
    const s = run([C, C, C, C])
    expect(s.last.fx).toBe('reap')
    expect(24 - s.damage).toBe(16)
    expect(s.last.damage).toBe(DAMAGE.choice + 4) // health 20 after the answer, the line at 20: 4 more to the floor
    expect(barPhase(opts().bar, s.damage)).toBe(2)
    expect(s.ab.line).toBe(8) // phase 2's line starts at its own floor
  })
  it('a floor between whole numbers: the reap stops at the first whole number under it', () => {
    const o = opts(23)
    const s = run([C, C, C, C], o)
    expect(s.last.fx).toBe('reap')
    expect(23 - s.damage).toBe(15)
    expect(barPhase(o.bar, s.damage)).toBe(2)
  })
  it('a wounded boss: the floor is on the whole-day bar', () => {
    const o = opts(24, 10) // 14 left: phase 2, floor 8
    expect(strike(newFight(), C, o).ab.line).toBe(9)
    expect(phaseFloor(o.bar, 2)).toBe(8)
  })
  it('in phase 3 the floor is 0: a reap wins', () => {
    const o = opts(24, 20) // 4 left, line 0
    const s = run([C, C], o) // 3 left, line 1; then 2 left, line 2: reaped
    expect(s.last.fx).toBe('reap')
    expect(s.damage).toBe(4)
  })
  it('inserted questions do nothing; a miss never reaps', () => {
    expect(run([C, hit('clean', 'typed', { inserted: 'minion' })]).ab.line).toBe(17)
    expect(run([C, C, C, hit('miss')]).last.fx).toBe('')
  })
  it('the hint and HUD say when the next right answer reaps; the bar shows the line', () => {
    const o = opts()
    const s = run([C, C, C], o)
    const ctx = { phase: 1, bar: o.bar, need: o.need }
    expect(mod.hud(s, ctx)[0]).toMatchObject({ type: 'chip', vars: { n: 2 }, ready: true })
    expect(mod.hint(s, { _cardId: 1 }, 'typed', ctx)).toMatchObject({ key: 'lg_hint_execute' })
    expect(mod.hint(run([C], o), { _cardId: 1 }, 'typed', ctx)).toBeNull()
    expect(mod.barMarks(s, ctx)).toEqual([{ type: 'line', at: 19, tone: 'danger' }])
  })
  it('F1 / F2 / a mixed run: all right wins, all wrong never reaps, damage never goes past the health', () => {
    for (const n of [5, 8, 15]) {
      expect(simulateRaid(mod.id, { n, answer: ALL_CLEAN }).outcome).toBe('won')
      expect(simulateRaid(mod.id, { n, answer: ALL_MISS_HARSH }).state.ab.reaps).toBe(0)
      const r = simulateRaid(mod.id, { n, answer: mixed(0.3) })
      for (const e of r.log) expect(e.after.damage).toBeLessThanOrEqual(r.need)
    }
  })
})
