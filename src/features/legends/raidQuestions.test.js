// raidQuestions.js: what an ability may ask again after the review pass (askableQuestions).
import { describe, it, expect } from 'vitest'
import { placeholderFor, reviewPlan, redoOutcome, askableQuestions } from './raidQuestions'

const card = (id, front) => ({ cardId: id, front, back: `${front} back`, tier: 2 })
const q = (id, prompt) => ({ kind: 'typed', prompt, accepted: [String(id)], _cardId: id, target: `f${id}` })

describe('askableQuestions (abilities asking a card again)', () => {
  it('gives the replacement for a rejected question, never the rejected one', () => {
    const list = [q(1, 'good one'), q(2, 'ambiguous one')]
    const { state } = reviewPlan(list, new Map([[1, 'two answers fit']]))
    const fresh = [{ ...q(2, 'clear replacement'), _cardId: 2 }]
    for (const [id, v] of redoOutcome([2], fresh, null)) state.set(id, v)
    const out = askableQuestions(list, state)
    expect(out.map((x) => x.prompt)).toEqual(['good one', 'clear replacement'])
  })
  it('never gives an empty placeholder (a card whose question was dropped and not rewritten)', () => {
    const list = [q(1, 'good one'), placeholderFor(card(2, 'perro'))]
    const { state } = reviewPlan(list, new Map())
    for (const [id, v] of redoOutcome([2], [], null)) state.set(id, v)
    const out = askableQuestions(list, state)
    expect(out).toHaveLength(1)
    expect(out.every((x) => x.prompt)).toBe(true)
  })
  it('keeps a placeholder out while its rewrite is still running, and the questions with no verdict yet in', () => {
    const list = [q(1, 'pending review'), placeholderFor(card(2, 'perro'))]
    const state = new Map([[1, { s: 'pending' }], [2, { s: 'redo' }]])
    expect(askableQuestions(list, state).map((x) => x.prompt)).toEqual(['pending review'])
  })
  it('without a review state, every written question stands except placeholders', () => {
    const list = [q(1, 'a'), placeholderFor(card(2, 'b'))]
    expect(askableQuestions(list, null).map((x) => x.prompt)).toEqual(['a'])
    expect(askableQuestions(list, new Map()).map((x) => x.prompt)).toEqual(['a'])
    expect(askableQuestions(null, new Map())).toEqual([])
  })
})
