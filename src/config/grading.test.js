import { describe, it, expect } from 'vitest'
import { gradeAnswer, gradeFromStrike, easeFor, isMature, gradeIsRight, gradeIsSolid, MATURE_DAYS } from './grading'

describe('gradeAnswer', () => {
  it('wrong is Again', () => {
    expect(gradeAnswer({ correct: false })).toBe('again')
    expect(gradeAnswer({ correct: false, mature: true })).toBe('again')
    expect(gradeAnswer()).toBe('again')
  })
  it('right but not clean is Hard', () => {
    for (const k of ['hintUsed', 'accentSlip', 'retried', 'corrected']) expect(gradeAnswer({ correct: true, [k]: true, mature: true })).toBe('hard')
    expect(gradeAnswer({ correct: true, clean: false, mature: true })).toBe('hard')
    expect(gradeAnswer({ correct: true, choice: true, hintUsed: true })).toBe('hard')
  })
  it('clean first try is Good, Easy only on a mature card typed', () => {
    expect(gradeAnswer({ correct: true })).toBe('good')
    expect(gradeAnswer({ correct: true, mature: false })).toBe('good')
    expect(gradeAnswer({ correct: true, mature: true })).toBe('easy')
  })
  it('a choice is capped at Good', () => {
    expect(gradeAnswer({ correct: true, choice: true, mature: true })).toBe('good')
  })
})

describe('gradeFromStrike', () => {
  it('maps fight verdicts', () => {
    expect(gradeFromStrike('miss')).toBe('again')
    expect(gradeFromStrike('error')).toBe('again')
    expect(gradeFromStrike(undefined)).toBe('again')
    expect(gradeFromStrike('glancing', { mature: true })).toBe('hard')
    expect(gradeFromStrike('clean')).toBe('good')
    expect(gradeFromStrike('clean', { mature: true })).toBe('easy')
    expect(gradeFromStrike('clean', { mature: true, choice: true })).toBe('good')
    expect(gradeFromStrike('clean', { mature: true, hintUsed: true })).toBe('hard')
  })
})

describe('helpers', () => {
  it('ease, maturity, right/solid', () => {
    expect([easeFor('again'), easeFor('hard'), easeFor('good'), easeFor('easy'), easeFor('x')]).toEqual([1, 2, 3, 4, 1])
    expect(isMature(MATURE_DAYS)).toBe(true)
    expect(isMature(MATURE_DAYS - 1)).toBe(false)
    expect(isMature(-600)).toBe(false)
    expect(isMature(undefined)).toBe(false)
    expect([gradeIsRight('again'), gradeIsRight('hard'), gradeIsRight('good'), gradeIsRight('easy')]).toEqual([false, true, true, true])
    expect([gradeIsSolid('again'), gradeIsSolid('hard'), gradeIsSolid('good'), gradeIsSolid('easy')]).toEqual([false, false, true, true])
  })
})

// Every branch with a LANGUAGE answer and a GENERAL-subject answer: the rule reads only subject-neutral signals.
describe('gradeAnswer works the same for any subject', () => {
  const cases = [
    // [what happened, flags, grade]
    ['lang: "paraguas" typed for "umbrella", clean, young card', { correct: true }, 'good'],
    ['CompTIA: "22" typed for "SSH default port", clean, young card', { correct: true }, 'good'],
    ['lang: "paraguas" clean on a mature card', { correct: true, mature: true }, 'easy'],
    ['CompTIA: "22" clean on a mature card', { correct: true, mature: true }, 'easy'],
    ['lang: "paragua" (wrong)', { correct: false, mature: true }, 'again'],
    ['CompTIA: "23" (wrong)', { correct: false, mature: true }, 'again'],
    ['lang: "I don\'t know"', { correct: false }, 'again'],
    ['CompTIA: "I don\'t know"', { correct: false }, 'again'],
    ['lang: right after the meaning hint', { correct: true, hintUsed: true, mature: true }, 'hard'],
    ['CompTIA: right after the meaning hint', { correct: true, hintUsed: true, mature: true }, 'hard'],
    ['lang: "cancion" retyped as "canción" (accent slip)', { correct: true, accentSlip: true, mature: true }, 'hard'],
    ['CompTIA: "TCP 22" with the grader correcting "it is not UDP" (penalized note)', { correct: true, corrected: true, mature: true }, 'hard'],
    ['lang: right on the second try', { correct: true, retried: true, mature: true }, 'hard'],
    ['pilot: first checklist item right only after a retry', { correct: true, retried: true, mature: true }, 'hard'],
    ['lang: "paraguas" picked from choices', { correct: true, choice: true, mature: true }, 'good'],
    ['CompTIA: "22" picked from choices', { correct: true, choice: true, mature: true }, 'good'],
  ]
  for (const [name, flags, grade] of cases) it(name, () => expect(gradeAnswer(flags)).toBe(grade))
})

describe('gradeFromStrike works the same for any subject', () => {
  it('lang and general fight answers', () => {
    expect(gradeFromStrike('glancing')).toBe('hard') // lang: "la paraguas" (word right, article wrong) / CompTIA: "22, UDP"
    expect(gradeFromStrike('clean', { mature: true })).toBe('easy') // "el paraguas" / "22 over TCP" on a mature card
    expect(gradeFromStrike('miss', { mature: true })).toBe('again')
  })
})
