import { describe, it, expect } from 'vitest'
import { findLeeches, parseDiagnoses, cardTextOnly, soundTags, fixChangesCard, markTreated, isTreated, shapeTreated, mentorLabelKey, TREATED_MAX } from './leeches'

describe('card text for the doctor', () => {
  it('leaves out the embedded audio and its credit line, keeps the rest', () => {
    expect(cardTextOnly('Traducción: dog\nEjemplo: el perro ladra\n[sound:ebiki-perro.mp3]\n\u{1F50A} Jane Doe, CC BY-SA')).toBe('Traducción: dog\nEjemplo: el perro ladra')
    expect(cardTextOnly('[sound:a.mp3]perro')).toBe('perro')
  })
  it('lists every recording of a field', () => {
    expect(soundTags('x[sound:a.mp3]<br>[sound:b.mp3]')).toEqual(['[sound:a.mp3]', '[sound:b.mp3]'])
    expect(soundTags('')).toEqual([])
  })
  it('a fix that changes nothing is no fix', () => {
    const card = { front: 'perro', back: 'dog' }
    expect(fixChangesCard({ front: 'perro', back: '' }, card)).toBe(false)
    expect(fixChangesCard({ front: '', back: 'dog' }, card)).toBe(false)
    expect(fixChangesCard({ front: 'perro (animal)', back: '' }, card)).toBe(true)
    expect(fixChangesCard(null, card)).toBe(false)
  })
})

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

describe('treated cards', () => {
  it('a treated card rests until it lapses again after the fix', () => {
    const v = markTreated(null, 10, 5, 1)
    expect(isTreated(v, { noteId: 10, lapses: 5 })).toBe(true)
    expect(isTreated(v, { noteId: '10', lapses: 5 })).toBe(true)
    expect(isTreated(v, { noteId: 10, lapses: 6 })).toBe(false)
    expect(isTreated(v, { noteId: 11, lapses: 5 })).toBe(false)
  })
  it('survives junk and keeps the newest treatments', () => {
    expect(shapeTreated('x')).toEqual({ notes: {} })
    expect(isTreated({ notes: [] }, { noteId: 1, lapses: 1 })).toBe(false)
    let v = null
    for (let i = 0; i < TREATED_MAX + 5; i++) v = markTreated(v, i, 4, i)
    expect(Object.keys(v.notes)).toHaveLength(TREATED_MAX)
    expect(v.notes['0']).toBeUndefined()
  })
  it('the mentor label follows the cause', () => {
    expect(mentorLabelKey('confusable')).toBe('doc_mentor')
    expect(mentorLabelKey('hook')).toBe('doc_mentorHook')
    expect(['thin', 'unpinned', 'wrong'].map(mentorLabelKey)).toEqual(['doc_mentorOther', 'doc_mentorOther', 'doc_mentorOther'])
  })
})
