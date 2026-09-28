import { describe, it, expect } from 'vitest'
import { addMisses, applyPractice, pickForWorkout, emptyList, MAX_ITEMS, CLEAR_AFTER } from './mistakes'

const card = (q, extra = {}) => ({ front: 'ser / estar', back: 'to be', misses: [{ question: q, answer: 'es', expected: 'está', feedback: 'location uses estar' }], ...extra })

describe('mistake list', () => {
  it('adds misses and counts repeats of the same question', () => {
    let l = addMisses(emptyList(), card('Where is Ana? Ana ___ en casa'), 1)
    l = addMisses(l, card('Where is Ana?  ana ___ EN casa'), 2)
    expect(l.items).toHaveLength(1)
    expect(l.items[0]).toMatchObject({ n: 2, at: 2 })
  })
  it('keeps only the newest items', () => {
    let l = emptyList()
    for (let i = 0; i < MAX_ITEMS + 10; i++) l = addMisses(l, card(`q${i}`), i)
    expect(l.items).toHaveLength(MAX_ITEMS)
    expect(l.items[0].question).toBe(`q${MAX_ITEMS + 9}`)
  })
  it('retires a mistake after enough right answers, resets on a wrong one', () => {
    let l = addMisses(emptyList(), card('q'), 1)
    const id = l.items[0].id
    for (let i = 1; i < CLEAR_AFTER; i++) l = applyPractice(l, [{ target: id, correct: true }])
    expect(l.items[0].cleared).toBe(CLEAR_AFTER - 1)
    l = applyPractice(l, [{ target: id, correct: false }])
    expect(l.items[0]).toMatchObject({ cleared: 0, n: 2 })
    for (let i = 0; i < CLEAR_AFTER; i++) l = applyPractice(l, [{ target: id, correct: true }])
    expect(l.items).toHaveLength(0)
  })
  it('a target answered both right and wrong in one workout counts as wrong', () => {
    const l = addMisses(emptyList(), card('q'), 1)
    const id = l.items[0].id
    expect(applyPractice(l, [{ target: id, correct: true }, { target: id, correct: false }]).items[0].cleared).toBe(0)
  })
  it('picks the most repeated mistakes first', () => {
    let l = addMisses(emptyList(), card('a'), 1)
    l = addMisses(l, card('b'), 2)
    l = addMisses(l, card('a'), 3)
    l = addMisses(l, card('a'), 4)
    expect(pickForWorkout(l, 1)[0].question).toBe('a')
  })
})

import { logPractice } from '../kit/practiceLog'
import { REST_MS } from './mistakes'

describe('workout rotation', () => {
  const two = () => addMisses(addMisses(emptyList(), { front: 'a', misses: [{ question: 'qa' }] }, 1), { front: 'b', misses: [{ question: 'qb' }] }, 2)
  it('puts a mistake drilled in the last hours after the others', () => {
    const now = 10 * REST_MS
    const l = two()
    const drilled = applyPractice(l, [{ target: l.items.find((m) => m.front === 'b').id, correct: false }], now - 1000)
    expect(pickForWorkout(drilled, 2, { now }).map((m) => m.front)).toEqual(['a', 'b'])
  })
  it('puts a card another activity just practiced after the others, but not its own entries', () => {
    const now = 10 * REST_MS
    const l = two()
    expect(pickForWorkout(l, 2, { now, log: logPractice({ items: [] }, [{ label: 'b', src: 'scenes' }], now - 1000) }).map((m) => m.front)).toEqual(['a', 'b'])
    expect(pickForWorkout(l, 2, { now, log: logPractice({ items: [] }, [{ label: 'b', src: 'mistake-gym' }], now - 1000) })[0].front).toBe('b')
  })
})
