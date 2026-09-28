import { describe, it, expect } from 'vitest'
import { matchTyped, leaksAnswer, sanitizeQuestions, normalizeAnswer } from './grade'

describe('typed answers', () => {
  it('match after case, spacing and edge punctuation', () => {
    expect(matchTyped('  El Paraguas. ', ['el paraguas'])).toBe('exact')
    expect(normalizeAnswer('¿Qué?')).toBe('qué')
  })
  it('flag accent-only slips, and miss real differences', () => {
    expect(matchTyped('cancion', ['canción'])).toBe('accent')
    expect(matchTyped('RAID 5', ['raid 5'])).toBe('exact')
    expect(matchTyped('RAID 6', ['RAID 5'])).toBe(null)
    expect(matchTyped('', ['x'])).toBe(null)
  })
  it('spot a question that contains its answer', () => {
    expect(leaksAnswer('What is a firewall? A firewall filters traffic', ['firewall'])).toBe(true)
    expect(leaksAnswer('Which device filters traffic between networks?', ['firewall'])).toBe(false)
    expect(leaksAnswer('It is at', ['at'])).toBe(false) // too short to judge
  })
})

describe('sanitizeQuestions', () => {
  it('keeps a valid choice question, shuffled, with the right answer tracked', () => {
    const [q] = sanitizeQuestions([{ question: 'Pick RAID with parity', choices: ['RAID 0', 'RAID 5', 'RAID 1'], answer: 1, explanation: 'x' }])
    expect(q.kind).toBe('choice')
    expect(q.choices[q.answerIdx]).toBe('RAID 5')
  })
  it('accepts a choice answer given as text', () => {
    const [q] = sanitizeQuestions([{ question: 'Q', choices: ['a', 'b'], answer: 'b' }])
    expect(q.choices[q.answerIdx]).toBe('b')
  })
  it('drops broken or leaking questions', () => {
    expect(sanitizeQuestions([{ question: '', accepted: ['x'] }, { question: 'Q', choices: ['a', 'b'], answer: 7 }, { question: 'The word casa means house: casa', accepted: ['casa'] }, null])).toEqual([])
  })
  it('keeps typed questions with their accepted answers', () => {
    expect(sanitizeQuestions([{ question: 'Say "umbrella" in Spanish (p...)', accepted: ['paraguas', 'el paraguas'] }])[0]).toMatchObject({ kind: 'typed', accepted: ['paraguas', 'el paraguas'] })
  })
  it('carries heard audio and spoken answers, with their languages', () => {
    const [dict, said] = sanitizeQuestions([
      { question: 'Type what you hear', say: 'Tengo hambre', accepted: ['Tengo hambre'] },
      { question: 'Say: I am tired', speak: true, accepted: ['Estoy cansado'] },
    ], { audioLang: 'es', speakLang: 'es' })
    expect(dict).toMatchObject({ audio: { text: 'Tengo hambre', lang: 'es' } })
    expect(dict.speak).toBeUndefined()
    expect(said).toMatchObject({ speak: true, speakLang: 'es' })
    expect(said.audio).toBeUndefined()
  })
})
