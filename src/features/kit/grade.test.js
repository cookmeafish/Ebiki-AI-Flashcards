import { describe, it, expect } from 'vitest'
import { matchTyped, leaksAnswer, sanitizeQuestions, normalizeAnswer, missesFromResults } from './grade'

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

describe('dual questions never offer two right answers', () => {
  it('a synonym of the key among the choices keeps the question typed only', async () => {
    const { sanitizeQuestions } = await import('./grade')
    const [q] = sanitizeQuestions([{ question: 'Translate: car', accepted: ['coche', 'carro'], choices: ['coche', 'carro', 'camion', 'moto'], answer: 'coche' }], { dual: true })
    expect(q.kind).toBe('typed')
    expect(q.alt).toBeUndefined()
  })
  it('choices that differ only in case are one choice, and an index answer still finds its text', async () => {
    const { sanitizeQuestions } = await import('./grade')
    const [q] = sanitizeQuestions([{ question: 'Pick the car', choices: ['coche', 'Coche', 'moto', 'tren'], answer: 2 }])
    expect(q.choices.length).toBe(3)
    expect(q.choices[q.answerIdx]).toBe('moto')
  })
})

describe('flagOf reads the flags models write as text', () => {
  it('true/false, strings and nonsense', async () => {
    const { flagOf } = await import('./judge')
    expect([true, 'true', 'True', 'yes', 1].map(flagOf)).toEqual([true, true, true, true, true])
    expect([false, 'false', 'No', 0].map(flagOf)).toEqual([false, false, false, false])
    expect([undefined, null, 'maybe', {}].map(flagOf)).toEqual([null, null, null, null])
  })
})

describe('practice misses', () => {
  it('keep what a listening question played, so the miss still makes sense later', () => {
    const q = { kind: 'typed', prompt: 'Type what you hear', accepted: ['tengo hambre'], target: 'hambre', audio: { text: 'tengo hambre', lang: 'es' } }
    expect(missesFromResults([{ question: q, answer: 'tengo hombre', correct: false }])).toEqual([{ front: 'hambre', question: 'Type what you hear 🔊 "tengo hambre"', answer: 'tengo hombre', expected: 'tengo hambre' }])
  })
  it('leave other questions as asked, fall back to the given front, skip right answers', () => {
    const q = { kind: 'choice', prompt: 'Who paid?', choices: ['Ana', 'Luis'], answerIdx: 1 }
    expect(missesFromResults([{ question: q, answer: 0, correct: false }, { question: q, answer: 1, correct: true }], 'The café')).toEqual([{ front: 'The café', question: 'Who paid?', answer: 'Ana', expected: 'Luis' }])
  })
})
