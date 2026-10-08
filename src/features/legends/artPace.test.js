// The art pace governor: a page-wide redraw budget that falls fast when frames come late and rises slowly, the same
// on any monitor, shared among the drawings on screen.
import { describe, it, expect } from 'vitest'
import { ART_PACE, displayPeriod, paceStep, paceFps, paceBudget, newPace } from './artPace'

const frames = (ms, n = 20) => Array.from({ length: n }, () => ms)

describe('art pace', () => {
  it('reads the display period from frame intervals on any monitor', () => {
    expect(displayPeriod(frames(16.7))).toBeCloseTo(16.7)
    expect(displayPeriod(frames(6.9))).toBeCloseTo(6.9) // 144 Hz
    expect(displayPeriod([...frames(4.2, 18), 40, 60])).toBeCloseTo(4.2) // 240 Hz with two late frames
    expect(displayPeriod([16, 17])).toBeNull()
  })
  it('never takes a page that was slow from its first frame for a slow monitor', () => {
    expect(displayPeriod(frames(250))).toBe(ART_PACE.maxPeriod)
    expect(paceStep(newPace(), frames(250), displayPeriod(frames(250))).level).toBeGreaterThan(newPace().level)
  })
  it('steps down when the page falls behind, on a 60 Hz and a 240 Hz monitor alike', () => {
    expect(paceStep({ level: 0 }, frames(30), 16.7).level).toBe(1)
    expect(paceStep({ level: 0 }, frames(7.6), 4.2).level).toBe(1)
    expect(paceStep({ level: 0 }, frames(60), 16.7).level).toBe(2) // far behind: two levels at once
    let s = newPace()
    for (let i = 0; i < 20; i++) s = paceStep(s, frames(80), 16.7)
    expect(s.level).toBe(ART_PACE.levels.length - 1)
  })
  it('rises back only after several smooth samples', () => {
    let s = { level: 4 }
    for (let i = 1; i < ART_PACE.calmToRise; i++) s = paceStep(s, frames(16.7), 16.7)
    expect(s.level).toBe(4)
    s = paceStep(s, frames(16.7), 16.7)
    expect(s.level).toBe(3)
  })
  it('keeps the level on in-between or missing samples', () => {
    expect(paceStep({ level: 1, calm: 2 }, frames(22), 16.7)).toEqual({ level: 1, calm: 0 })
    expect(paceStep({ level: 1 }, [], 16.7).level).toBe(1)
    expect(paceStep({ level: 1 }, frames(20), null).level).toBe(1)
  })
  it('shares the budget among the drawings on screen, at most maxFps each', () => {
    expect(paceFps(newPace(), 1)).toBe(ART_PACE.maxFps)
    const s = { level: ART_PACE.levels.length - 1 }
    expect(paceFps(s, 4)).toBeCloseTo(paceBudget(s) / 4)
    expect(paceFps({ level: 0 }, 24)).toBeCloseTo(ART_PACE.levels[0] / 24)
    expect(paceFps({ level: 0 }, 2)).toBe(ART_PACE.maxFps)
  })
})
