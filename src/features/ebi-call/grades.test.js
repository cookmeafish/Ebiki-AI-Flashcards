import { describe, it, expect } from 'vitest'
import { splitReply, applyGrades, ratingsFrom, onePerNote } from './grades'

describe('splitReply', () => {
  it('hides the grades block and keeps only known targets with valid verdicts', () => {
    const r = splitReply('¡Muy bien! ¿Y ayer?\n<grades>[{"id":"11","verdict":"good","why":"ok"},{"id":"99","verdict":"good"},{"id":"12","verdict":"great"}]</grades>', ['11', '12'])
    expect(r.say).toBe('¡Muy bien! ¿Y ayer?')
    expect(r.grades).toEqual([{ id: '11', verdict: 'good', why: 'ok' }])
  })
  it('never shows a cut-off block, and survives junk', () => {
    expect(splitReply('Hola <grades>[{"id":"1"', ['1']).say).toBe('Hola')
    expect(splitReply('Hi <grades>nope</grades>', ['1']).grades).toEqual([])
    expect(splitReply('', ['1'])).toEqual({ say: '', grades: [] })
  })
})

describe('applyGrades', () => {
  it('keeps the first verdict per target (a later try does not overwrite it)', () => {
    let { state, fresh } = applyGrades({}, [{ id: '1', verdict: 'again', why: 'x' }], 1)
    expect(fresh).toHaveLength(1)
    ;({ state, fresh } = applyGrades(state, [{ id: '1', verdict: 'good' }, { id: '2', verdict: 'hard' }], 2))
    expect(state['1'].verdict).toBe('again')
    expect(fresh.map((g) => g.id)).toEqual(['2'])
  })
})

describe('ratingsFrom', () => {
  it('rates only graded targets, never with Easy', () => {
    const targets = [{ cardId: 1, front: 'a' }, { cardId: 2, front: 'b' }, { cardId: 3, front: 'c' }]
    const state = { 1: { verdict: 'good' }, 3: { verdict: 'again' } }
    expect(ratingsFrom(targets, state)).toEqual([
      { cardId: 1, ease: 3, rating: 'good', front: 'a' },
      { cardId: 3, ease: 1, rating: 'again', front: 'c' },
    ])
  })
})

describe('call grade parsing extras', () => {
  it('reads "easy" as good and an id echoed as "id 11"', () => {
    const r = splitReply('Ok <grades>[{"id":"id 11","verdict":"Easy"},{"id":12,"verdict":"hard"}]</grades>', ['11', '12'])
    expect(r.grades).toEqual([{ id: '11', verdict: 'good', why: '' }, { id: '12', verdict: 'hard', why: '' }])
  })
  it('keeps one card per note, first wins, cards without a note kept', () => {
    const out = onePerNote([{ cardId: 1, note: 7 }, { cardId: 2, note: 7 }, { cardId: 3 }, { cardId: 4, note: 8 }])
    expect(out.map((c) => c.cardId)).toEqual([1, 3, 4])
    expect(onePerNote(null)).toEqual([])
  })
})
