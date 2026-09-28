import { describe, it, expect } from 'vitest'
import { findLeeches, parseDiagnoses } from './leeches'

describe('findLeeches', () => {
  it('keeps notes with enough lapses, one per note (its worst card), worst first', () => {
    const cards = [
      { cardId: 1, note: 10, lapses: 5 }, { cardId: 2, note: 10, lapses: 7 },
      { cardId: 3, note: 11, lapses: 2 }, { cardId: 4, note: 12, lapses: 4 },
    ]
    expect(findLeeches(cards).map((p) => [p.noteId, p.cardId, p.lapses])).toEqual([[10, 2, 7], [12, 4, 4]])
  })
})

describe('parseDiagnoses', () => {
  const patients = [{ noteId: 10 }, { noteId: 12 }]
  it('keeps valid diagnoses for known notes only', () => {
    const m = parseDiagnoses({ diagnoses: [
      { noteId: 10, cause: 'confusable', confusedWith: 'estar', explanation: 'x', mentor: 'y', fix: { front: 'ser (identity)', back: '' } },
      { noteId: 99, cause: 'thin', explanation: 'not a patient' },
      { noteId: 12, cause: 'made-up', explanation: 'z', fix: { front: '', back: '' } },
    ] }, patients)
    expect([...m.keys()]).toEqual(['10', '12'])
    expect(m.get('10')).toMatchObject({ cause: 'confusable', confusedWith: 'estar', fix: { front: 'ser (identity)' } })
    expect(m.get('12')).toMatchObject({ cause: 'hook', fix: null })
  })
  it('survives junk', () => {
    expect(parseDiagnoses(null, patients).size).toBe(0)
    expect(parseDiagnoses({ diagnoses: 'nope' }, patients).size).toBe(0)
  })
})
