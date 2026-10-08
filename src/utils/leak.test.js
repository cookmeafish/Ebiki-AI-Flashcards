import { describe, it, expect } from 'vitest'
import { leakNorm, questionAnswerLeak, scrubAnswerFromQuestion, hintRevealsAnswer, scrubHint, leakAnswers } from './leak'
import { rng } from './testRng'

describe('answer-leak guard', () => {
  it('leakNorm folds accents, Arabic/Hebrew vowel marks and apostrophes, and recomposes NFC', () => {
    expect(leakNorm('Pergamino')).toBe('pergamino')
    expect(leakNorm('Brújula')).toBe('brujula')
    expect(leakNorm('aujourd’hui')).toBe("aujourd'hui")
    expect(leakNorm('사과')).toBe('사과') // Hangul stays composed
  })
  it('finds an answer written into its own question, whole-word', () => {
    expect(questionAnswerLeak({ question: 'Un rollo de papel o pergamino', acceptedAnswers: ['pergamino'] })).toBe('pergamino')
    expect(questionAnswerLeak({ question: 'Los pergaminos antiguos', acceptedAnswers: ['pergamino'] })).toBe(null)
    expect(questionAnswerLeak({ question: 'Explain it', acceptedAnswers: ['x'], type: 'explanation' })).toBe(null)
  })
  it('catches Korean answers with particles and no-space scripts', () => {
    expect(questionAnswerLeak({ question: '저는 사과를 먹어요', acceptedAnswers: ['사과'] })).toBe('사과')
    expect(questionAnswerLeak({ question: '我有一把雨伞', acceptedAnswers: ['雨伞'] })).toBe('雨伞')
  })
  it('the correct choice counts unless the question names the options', () => {
    const q = { question: 'What does TCP stand for?', choices: ['Transmission Control Protocol', 'Other'], answerIdx: 0, acceptedAnswers: [] }
    expect(leakAnswers(q)).toContain('Transmission Control Protocol')
    const tf = { question: 'True or false: the sky is green', choices: ['True', 'False'], answerIdx: 1, acceptedAnswers: ['false'] }
    expect(questionAnswerLeak(tf)).toBe(null)
  })
  it('scrubs a leaked answer to ___, keeping a Korean particle', () => {
    expect(scrubAnswerFromQuestion({ question: 'Un rollo de papel o pergamino que...', acceptedAnswers: ['pergamino'] }).question).toBe('Un rollo de papel o ___ que...')
    expect(scrubAnswerFromQuestion({ question: '저는 사과를 먹어요', acceptedAnswers: ['사과'] }).question).toContain('___를')
  })
  it('hints are checked fuzzily, and bounded for answers with apostrophes', () => {
    expect(hintRevealsAnswer('Think of pergaminos', ['pergamino'])).toBe(true)
    expect(hintRevealsAnswer("C'est aujourd’hui", ["aujourd'hui"])).toBe(true)
    expect(hintRevealsAnswer('puisqu’il pleut', ["qu'il"])).toBe(false)
    expect(scrubHint('Think of pergaminos', ['pergamino'])).toBe('Think of ___')
  })
  it('never throws on junk; a scrubbed question no longer leaks (property)', () => {
    const r = rng(23)
    const words = ['gato', 'perro', 'él', 'el', '雨伞', '사과', "l'eau", 'x', '(', '*', '[', 'pergamino', '']
    for (let i = 0; i < 800; i++) {
      const ans = [r.pick(words), r.pick(words)]
      const question = Array.from({ length: r.int(8) }, () => r.pick(words)).join(r.pick([' ', '', ', ']))
      const q = { question, acceptedAnswers: ans }
      const leak = questionAnswerLeak(q)
      const scrubbed = scrubAnswerFromQuestion(q)
      if (leak && scrubbed.question !== question) expect(typeof scrubbed.question).toBe('string')
      expect(typeof hintRevealsAnswer(question, ans)).toBe('boolean')
      expect(typeof scrubHint(question, ans)).toBe('string')
      expect(leakNorm(leakNorm(question))).toBe(leakNorm(question))
    }
    expect(questionAnswerLeak(null)).toBe(null)
    expect(leakAnswers(undefined)).toEqual([])
  })
})
