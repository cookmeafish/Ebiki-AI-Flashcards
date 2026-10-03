import { describe, it, expect } from 'vitest'
import { questionCountFor, oneQuestionRating, questionDepthOf, depthPlan, rateStudyCard, oneQMissNeedsRequeue, DEFAULT_QUESTION_DEPTH } from './studyDepth'
import { ADAPTIVE_STRUGGLE_LAPSES } from '../config/study'

const rules = { questionsPerCard: 3 }
const review = { type: 2, queue: 2, lapses: 0, interval: 30 }

describe('questionCountFor', () => {
  it('a due review gets one question', () => {
    expect(questionCountFor(review, rules)).toBe(1)
    expect(questionCountFor({ ...review, queue: -2 }, rules)).toBe(1) // buried/suspended flags keep the type
    expect(questionCountFor(review, { ...rules, questionDepth: 'adaptive' })).toBe(1)
  })
  it('new, learning, relearning, struggling and relearn copies get questionsPerCard', () => {
    expect(questionCountFor({ type: 0, queue: 0 }, rules)).toBe(3)
    expect(questionCountFor({ type: 1, queue: 1 }, rules)).toBe(3)
    expect(questionCountFor({ type: 3, queue: 3, lapses: 1 }, rules)).toBe(3)
    expect(questionCountFor({ type: 2, queue: 3 }, rules)).toBe(3)
    expect(questionCountFor({ ...review, lapses: ADAPTIVE_STRUGGLE_LAPSES }, rules)).toBe(3)
    expect(questionCountFor({ ...review, lapses: ADAPTIVE_STRUGGLE_LAPSES - 1 }, rules)).toBe(1)
    expect(questionCountFor({ ...review, _relearn: true }, rules)).toBe(3)
    expect(questionCountFor({}, rules)).toBe(3)
    expect(questionCountFor(null, rules)).toBe(3)
  })
  it('thorough always uses questionsPerCard', () => {
    expect(questionCountFor(review, { ...rules, questionDepth: 'thorough' })).toBe(3)
  })
  it('other study types and per-card counts', () => {
    expect(questionCountFor(review, rules, { kind: 'conjugations' })).toBe(3)
    expect(questionCountFor(review, rules, { kind: 'pbq' })).toBe(3)
    expect(questionCountFor({ type: 0 }, { questionsPerCard: 1 })).toBe(1)
    expect(questionCountFor({ type: 0 }, {})).toBe(3)
    expect(questionCountFor({ type: 0 }, { questionsPerCard: 5 })).toBe(5)
  })
  it('depth defaults to adaptive', () => {
    expect(questionDepthOf({})).toBe('adaptive')
    expect(questionDepthOf(null)).toBe('adaptive')
    expect(questionDepthOf({ questionDepth: 'thorough' })).toBe('thorough')
    expect(questionDepthOf({ questionDepth: 'junk' })).toBe('adaptive')
  })
})

describe('oneQuestionRating', () => {
  const young = { interval: 20 }, mature = { interval: 21 }
  it('Again: wrong or skipped', () => {
    expect(oneQuestionRating({ correct: false }, mature)).toEqual({ label: 'again', ease: 1 })
    expect(oneQuestionRating({ correct: true, skipped: true }, mature).label).toBe('again')
    expect(oneQuestionRating(null, mature).label).toBe('again')
  })
  it('Hard: right with a hint, accent slip, retry or correction', () => {
    for (const k of ['hintUsed', 'accentSlip', 'retried', 'corrected']) expect(oneQuestionRating({ correct: true, [k]: true }, mature)).toEqual({ label: 'hard', ease: 2 })
  })
  it('Good: clean on a young card; Easy only when mature (21 days)', () => {
    expect(oneQuestionRating({ correct: true }, young)).toEqual({ label: 'good', ease: 3 })
    expect(oneQuestionRating({ correct: true }, mature)).toEqual({ label: 'easy', ease: 4 })
    expect(oneQuestionRating({ correct: true }, {}).label).toBe('good')
  })
  it('MC capped at Good', () => {
    expect(oneQuestionRating({ correct: true, choice: true }, mature)).toEqual({ label: 'good', ease: 3 })
  })
})

describe('one-question cards in a language mode and a general mode', () => {
  const lang = { front: 'el paraguas', type: 2, queue: 2, lapses: 0, interval: 40 }
  const comptia = { front: 'SSH default port', type: 2, queue: 2, lapses: 0, interval: 40 }
  const pilot = { front: 'Engine failure after takeoff: first item', type: 2, queue: 2, lapses: 1, interval: 5 }
  it('a due review gets one question whatever the subject', () => {
    for (const c of [lang, comptia, pilot]) expect(questionCountFor(c, rules)).toBe(1)
    for (const c of [lang, comptia, pilot]) expect(questionCountFor({ ...c, type: 0, queue: 0 }, rules)).toBe(3)
  })
  it('rates each branch the same for every subject', () => {
    for (const c of [lang, comptia]) {
      expect(oneQuestionRating({ correct: true }, c).label).toBe('easy')
      expect(oneQuestionRating({ correct: true, corrected: true }, c).label).toBe('hard') // grader correction / partial
      expect(oneQuestionRating({ correct: true, hintUsed: true }, c).label).toBe('hard')
      expect(oneQuestionRating({ correct: true, retried: true }, c).label).toBe('hard')
      expect(oneQuestionRating({ correct: false }, c).label).toBe('again')
      expect(oneQuestionRating({ correct: true, choice: true }, c).label).toBe('good')
    }
    expect(oneQuestionRating({ correct: true }, pilot).label).toBe('good') // young card: never Easy
    expect(oneQuestionRating({ correct: true, accentSlip: true }, lang).label).toBe('hard') // language near miss
  })
})

describe('depthPlan', () => {
  it('a due review: one question, flagged oneQ with its interval', () => {
    const p = depthPlan(review, rules)
    expect(p.rules.questionsPerCard).toBe(1)
    expect(p.flags).toEqual({ oneQ: true, ivl: 30 })
    expect(rules.questionsPerCard).toBe(3) // never mutates the mode's rules
  })
  it('everything else keeps the rules untouched and sets no flags', () => {
    for (const [card, r, kind] of [[{ type: 0, queue: 0 }, rules, 'flashcards'], [review, { ...rules, questionDepth: 'thorough' }, 'flashcards'], [review, rules, 'pbq'], [{ ...review, _relearn: true }, rules, 'flashcards']]) {
      const p = depthPlan(card, r, kind)
      expect(p.rules).toBe(r)
      expect(p.flags).toEqual({})
    }
  })
  it('the default depth is adaptive; unknown values fall back to it', () => {
    expect(DEFAULT_QUESTION_DEPTH).toBe('adaptive')
    expect(questionDepthOf({ questionDepth: 'weird' })).toBe(DEFAULT_QUESTION_DEPTH)
  })
})

describe('rateStudyCard', () => {
  const ok = { correct: true }
  const bad = { correct: false }
  it('count rule: 0 wrong Easy, 1 Good, more Hard, all Again', () => {
    expect(rateStudyCard({}, [ok, ok, ok])).toEqual({ ease: 4, label: 'easy' })
    expect(rateStudyCard({}, [ok, bad, ok])).toEqual({ ease: 3, label: 'good' })
    expect(rateStudyCard({}, [bad, bad, ok])).toEqual({ ease: 2, label: 'hard' })
    expect(rateStudyCard({}, [bad, bad, bad])).toEqual({ ease: 1, label: 'again' })
    expect(rateStudyCard({}, [bad])).toEqual({ ease: 1, label: 'again' }) // "all wrong" before "one wrong"
  })
  it('penalizing grammar notes count as wrong only with grammar feedback on', () => {
    const g = { correct: true, notes: [{ type: 'grammar', penalize: true }] }
    expect(rateStudyCard({}, [g, ok]).label).toBe('easy')
    expect(rateStudyCard({}, [g, ok], true).label).toBe('good')
  })
  it('MC/PBQ cap at Good when recording; practice keeps the honest label; accent slips cap at Good', () => {
    expect(rateStudyCard({ mc: true }, [ok, ok]).label).toBe('good')
    expect(rateStudyCard({ pbq: true }, [ok]).label).toBe('good')
    expect(rateStudyCard({ mc: true, noSync: true }, [ok, ok]).label).toBe('easy')
    expect(rateStudyCard({ accentSlips: 1 }, [ok, ok]).label).toBe('good')
  })
  it('a one-question card uses the shared one-answer rule', () => {
    const cs = { oneQ: true, ivl: 40, answers: ['x'] }
    expect(rateStudyCard(cs, [ok]).label).toBe('easy')
    expect(rateStudyCard({ ...cs, ivl: 3 }, [ok]).label).toBe('good')
    expect(rateStudyCard({ ...cs, hintQs: { 0: true } }, [ok]).label).toBe('hard')
    expect(rateStudyCard({ ...cs, questionAttempts: [['a', 'b']] }, [ok]).label).toBe('hard')
    expect(rateStudyCard({ ...cs, answers: ['(skipped)'] }, [ok]).label).toBe('again')
    expect(rateStudyCard({ ...cs, mc: true }, [ok]).label).toBe('good')
    expect(rateStudyCard({ ...cs, mc: true, noSync: true }, [ok]).label).toBe('easy')
    const gram = { correct: true, notes: [{ type: 'grammar', penalize: true }] }
    expect(rateStudyCard(cs, [gram]).label).toBe('easy')
    expect(rateStudyCard(cs, [gram], true).label).toBe('hard')
    expect(rateStudyCard({ ...cs, pbq: true }, [ok]).label).toBe('good') // PBQs keep the count rule
  })
})

describe('oneQMissNeedsRequeue', () => {
  const cs = { oneQ: true, answers: ['x'] }
  it('a missed one-question review comes back', () => {
    expect(oneQMissNeedsRequeue(cs, 'again')).toBe(true)
    expect(oneQMissNeedsRequeue(cs, 'hard')).toBe(false)
    expect(oneQMissNeedsRequeue({ answers: ['x'] }, 'again')).toBe(false)
    for (const k of ['relearn', 'noSync', 'isConjugation', 'pbq']) expect(oneQMissNeedsRequeue({ ...cs, [k]: true }, 'again')).toBe(false)
  })
  it('a give-up is left to the Learn-it moment while it is on', () => {
    const gave = { ...cs, answers: ['(skipped)'] }
    expect(oneQMissNeedsRequeue(gave, 'again')).toBe(false)
    expect(oneQMissNeedsRequeue(gave, 'again', { learnMoment: false })).toBe(true)
  })
})
