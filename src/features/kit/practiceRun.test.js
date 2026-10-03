import { describe, it, expect } from 'vitest'
import { settlePracticeRun } from './practiceRun'
import { EVENTS } from '../events'

const q = (prompt, target = '') => ({ kind: 'typed', prompt, accepted: ['x'], target })

describe('settlePracticeRun', () => {
  it('a finished run: PRACTICE_DONE and its misses, under the starting mode', () => {
    const run = { source: 'scenes', modeId: 7, front: 'The market' }
    const r = settlePracticeRun(run, [{ question: q('A?'), correct: true, answer: 'x' }, { question: q('B?', 'gato'), correct: false, answer: 'y' }], { done: true })
    expect(r.events.map(([e]) => e)).toEqual([EVENTS.PRACTICE_DONE, EVENTS.PRACTICE_MISSED])
    expect(r.events[0][1]).toEqual({ source: 'scenes', mode: 7, total: 2, correct: 1 })
    expect(r.events[1][1].misses).toEqual([{ front: 'gato', question: 'B?', answer: 'y', expected: 'x' }])
    expect(r.targets).toEqual(['gato'])
  })
  it('a quit run: misses only (no PRACTICE_DONE), and only once', () => {
    const run = { source: 'listen-speak', modeId: 1 }
    const res = [{ question: q('A?', 'perro'), correct: false, answer: '' }]
    expect(settlePracticeRun(run, res).events.map(([e]) => e)).toEqual([EVENTS.PRACTICE_MISSED])
    expect(settlePracticeRun(run, res, { done: true })).toBe(null)
  })
  it('nothing answered (or only end-of-run retries) settles nothing and stays open', () => {
    const run = { source: 's', modeId: 1 }
    expect(settlePracticeRun(run, [])).toBe(null)
    expect(settlePracticeRun(run, { not: 'a list' })).toBe(null)
    expect(settlePracticeRun(run, [{ question: { ...q('A?'), _retry: true }, correct: false }])).toBe(null)
    expect(run.settled).toBeFalsy()
    expect(settlePracticeRun(null, [{ question: q('A?'), correct: true }])).toBe(null)
  })
})
