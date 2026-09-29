import { describe, it, expect } from 'vitest'
import { bandFor, bandProgress, newLearner, shapeLearner, deltaFor, applyLearnerDelta, learnerLine, LEVEL_MAX, HISTORY_MAX } from './learner'

describe('learner level', () => {
  it('names a band for any subject', () => {
    expect(bandFor(0, true).key).toBe('a1')
    expect(bandFor(45, true).key).toBe('b1')
    expect(bandFor(LEVEL_MAX, true).key).toBe('c2')
    expect(bandFor(50, false).key).toBe('intermediate')
    expect(bandFor(-20, false).key).toBe('beginner')
  })
  it('measures progress inside the band', () => {
    expect(bandProgress(30, true)).toBeCloseTo(0.5)
    expect(bandProgress(LEVEL_MAX, true)).toBe(1)
  })
  it('clamps and shapes stored models', () => {
    expect(newLearner({ level: 999 }).level).toBe(LEVEL_MAX)
    expect(shapeLearner(null)).toBeNull()
    expect(shapeLearner({ level: 'x' })).toBeNull()
    const m = shapeLearner({ level: 40, strengths: 'nope', history: [{ delta: 1 }, null, { delta: 'x' }] })
    expect(m.strengths).toEqual([])
    expect(m.history).toHaveLength(1)
  })
  it('nudges up for good results and down for poor ones, more with more evidence', () => {
    expect(deltaFor('gym', 10, 10)).toBeGreaterThan(0)
    expect(deltaFor('gym', 10, 2)).toBeLessThan(0)
    expect(deltaFor('gym', 0, 0)).toBe(0)
    expect(Math.abs(deltaFor('boss', 20, 20))).toBeGreaterThan(Math.abs(deltaFor('boss', 2, 2)))
    expect(deltaFor('unknown-source', 10, 10)).toBeGreaterThan(0)
  })
  it('applies a delta with history and topics', () => {
    const m = newLearner({ level: 40, gaps: ['subjunctive'] }, 1)
    const n = applyLearnerDelta(m, 2.5, 'legends', { strengths: ['subjunctive'], gaps: ['por vs para'] }, 2)
    expect(n.level).toBe(42.5)
    expect(n.strengths).toEqual(['subjunctive'])
    expect(n.gaps).toEqual(['por vs para'])
    expect(n.history.at(-1)).toMatchObject({ source: 'legends', delta: 2.5 })
    let k = n
    for (let i = 0; i < HISTORY_MAX + 5; i++) k = applyLearnerDelta(k, 0, 'study')
    expect(k.history).toHaveLength(HISTORY_MAX)
    expect(applyLearnerDelta(null, 1, 'study')).toBeNull()
  })
  it('remembers the highest level reached', () => {
    const m = newLearner({ level: 40 })
    const down = applyLearnerDelta(applyLearnerDelta(m, 3, 'boss'), -5, 'study')
    expect(down.level).toBe(38)
    expect(down.peak).toBe(43)
    expect(shapeLearner({ level: 50 }).peak).toBe(50)
  })
  it('writes an English prompt line', () => {
    expect(learnerLine(newLearner({ level: 62, gaps: ['RAID'] }), false)).toBe('level 62 of 130, Intermediate; weak at: RAID')
    expect(learnerLine(null, true)).toBe('')
  })
})
