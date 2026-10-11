import { describe, it, expect } from 'vitest'
import { buildOpenChoicesPrompt, parseOpenChoices, CLEAR_ANSWER_RULE, openTierGradingRule, buildQuestionReviewPrompt, parseQuestionReview, QUESTION_CHECK_RULES, tierOf, tierOfItem, tierInstruction, TIERS, TIER_DAYS, tierLabelKey, tierTeaches, tierOpen, clampTier } from './questionTier'

describe('the question ladder', () => {
  it('reads the tier from Anki', () => {
    expect(tierOf({ type: 0, queue: 0, interval: 0, reps: 0 })).toBe(0)
    expect(tierOf({ type: 1, queue: 1, interval: 0, reps: 1 })).toBe(1)
    expect(tierOf({ type: 3, queue: 3, interval: 1, reps: 9, lapses: 2 })).toBe(1) // a lapse: relearning
    expect(tierOf({ type: 2, queue: 2, interval: 1, reps: 2 })).toBe(1)
    expect(tierOf({ type: 2, queue: 2, interval: 2 })).toBe(1)
    expect(tierOf({ type: 2, queue: 2, interval: 3 })).toBe(2)
    expect(tierOf({ type: 2, queue: 2, interval: 6 })).toBe(2)
    expect(tierOf({ type: 2, queue: 2, interval: 7 })).toBe(3)
    expect(tierOf({ type: 2, queue: 2, interval: 20 })).toBe(3)
    expect(tierOf({ type: 2, queue: 2, interval: 21 })).toBe(4)
    expect(tierOf({ type: 2, queue: 2, interval: 89 })).toBe(4)
    expect(tierOf({ type: 2, queue: 2, interval: 90 })).toBe(5)
    expect(tierOf({ type: 2, queue: -1, interval: 400 })).toBe(5) // suspended/buried keeps its tier
  })
  it('a relearn copy and unknown data', () => {
    expect(tierOf({ _relearn: true, type: 2, interval: 200 })).toBe(1)
    expect(tierOf(null)).toBe(2)
    expect(tierOf({ type: 2 })).toBe(2)
  })
  it('thresholds climb, mature at Anki\'s 21 days', () => {
    expect(TIER_DAYS[2] < TIER_DAYS[3] && TIER_DAYS[3] < TIER_DAYS[4] && TIER_DAYS[4] < TIER_DAYS[5]).toBe(true)
    expect(TIER_DAYS[4]).toBe(21)
  })
  it('Legends items climb with their codex tier, bosses a step up', () => {
    expect(tierOfItem('new')).toBe(0)
    expect(tierOfItem('gold')).toBe(3)
    expect(tierOfItem('silver', { kind: 'boss' })).toBe(3)
    expect(tierOfItem('gold', { kind: 'legendary' })).toBe(5)
    expect(tierOfItem(undefined)).toBe(1)
  })
  it('every tier has an instruction for languages and other subjects, without em dashes', () => {
    for (const t of TIERS) {
      for (const isLanguage of [true, false]) {
        const s = tierInstruction(t.id, { isLanguage, learnLang: 'Spanish', quizLang: 'English' })
        expect(s).toMatch(new RegExp(`TIER ${t.id}`))
        expect(s).not.toMatch(/—/)
      }
      expect(tierLabelKey(t.id)).toBe(`qt_${t.key}`)
    }
  })
  it('only the first tier teaches, open tiers carry no letter cue', () => {
    expect(tierTeaches(0)).toBe(true)
    expect(tierTeaches(1)).toBe(false)
    expect(tierOpen(4, true)).toBe(true)
    expect(tierOpen(5, true)).toBe(false)
    expect(tierOpen(5, false)).toBe(true)
    expect(clampTier(9)).toBe(5)
    expect(clampTier('x')).toBe(2)
  })
})

describe('the review pass', () => {
  it('shows every question with its tier, answers and marked choices, plus the shared rules', () => {
    const p = buildQuestionReviewPrompt({ front: 'perro', back: 'dog', isLanguage: true, learnLang: 'Spanish', questions: [
      { question: 'How do you say "dog"?', type: 'recall', tier: 2, acceptedAnswers: ['perro'], choices: ['gato', 'perro'], answerIdx: 1 },
      { question: 'Write a sentence', type: 'explanation', tier: 4, acceptedAnswers: [] },
    ] })
    expect(p).toContain(QUESTION_CHECK_RULES)
    expect(p).toContain('0. TIER 2 (recall)')
    expect(p).toContain('[correct] perro')
    expect(p).toContain('1. TIER 4 (produce)')
    expect(p).not.toMatch(/—/)
  })
  it('reads verdicts by index; a missing verdict leaves the review incomplete', () => {
    expect(parseQuestionReview({ verdicts: [{ i: 0, ok: true }, { i: 1, ok: false, reason: 'two answers' }] }, 2)).toEqual({ complete: true, reviewed: [0, 1], fails: [{ i: 1, reason: 'two answers' }] })
    expect(parseQuestionReview([{ ok: 'false', reason: 'x' }], 1).fails).toEqual([{ i: 0, reason: 'x' }])
    expect(parseQuestionReview({ verdicts: [{ i: 0, ok: 'yes' }] }, 2).complete).toBe(false)
    expect(parseQuestionReview(null, 1)).toEqual({ complete: false, reviewed: [], fails: [] })
    expect(parseQuestionReview({ verdicts: [{ i: 5, ok: false }] }, 1).fails).toEqual([])
  })
})

describe('open tier grading wording', () => {
  it('language sentences: the word used right is enough; grammar only counts with grammar feedback on', () => {
    expect(openTierGradingRule({ isLanguage: true })).toMatch(/never make it wrong/)
    expect(openTierGradingRule({ isLanguage: true, grammarOn: true })).not.toMatch(/never make it wrong/)
    expect(openTierGradingRule({})).toMatch(/understanding/)
    for (const r of [openTierGradingRule({ isLanguage: true }), openTierGradingRule({})]) expect(r).not.toMatch(/—/)
  })
})

describe('the question goal and the prefix hint in the shared rules', () => {
  it('the review rejects a question that does not serve the card goal, and a hint on a non-language card', () => {
    expect(QUESTION_CHECK_RULES).toMatch(/GOAL/)
    expect(QUESTION_CHECK_RULES).toMatch(/not in a language course/)
  })
  it('no prompt asks the model for the first letter in quotes any more (the app adds the prefix hint)', () => {
    expect(CLEAR_ANSWER_RULE).not.toMatch(/first letter in quotes/)
    for (let t = 0; t <= 5; t++) expect(tierInstruction(t, { isLanguage: true })).not.toMatch(/first letter in quotes/)
  })
  it('tierInstruction carries the card goal; a general concept at tier 2 never asks for its definition back', () => {
    expect(tierInstruction(2, { goal: 'concept' })).toMatch(/THE GOAL \(a concept\)/)
    expect(tierInstruction(2, {})).toMatch(/never its definition restated/)
    expect(tierInstruction(2, {})).not.toMatch(/THE GOAL/)
  })
  it('the review prompt shows each question against the goal at its tier', () => {
    const p = buildQuestionReviewPrompt({ front: 'Secure enclave', back: 'isolated', questions: [{ question: 'Name it', tier: 3, type: 'recall', acceptedAnswers: ['secure enclave'], goal: 'fact' }], goal: 'concept' })
    expect(p).toMatch(/goal: THE GOAL \(a concept\)/)
    expect(p).toMatch(/writer stated "fact"/)
  })
})

describe('choices for an open question', () => {
  it('asks for one correct sentence and three misuses, without em dashes', () => {
    const p = buildOpenChoicesPrompt({ front: 'manzana', back: 'apple', question: 'Write a sentence', isLanguage: true, learnLang: 'Spanish' })
    expect(p).toMatch(/EXACTLY ONE is correct/)
    expect(p).toMatch(/uses the card's word correctly/)
    expect(p).not.toMatch(/—/)
    expect(buildOpenChoicesPrompt({ question: 'Explain SSH' })).toMatch(/misconceptions/)
  })
  it('a word question names its exact answer as the correct option', () => {
    const p = buildOpenChoicesPrompt({ front: 'DHCP', back: 'hands out IP addresses', question: 'Which protocol...?', answer: 'Dynamic Host Configuration Protocol' })
    expect(p).toMatch(/The correct option is exactly "Dynamic Host Configuration Protocol"/)
    expect(p).toMatch(/terms from the same subject/)
    expect(p).not.toMatch(/misconceptions/)
    expect(buildOpenChoicesPrompt({ question: 'Q', answer: 'huir', isLanguage: true, learnLang: 'Spanish' })).toMatch(/other Spanish words or phrases/)
    expect(p).not.toMatch(/—/)
  })
  it('parses exactly 4 distinct options with a valid index', () => {
    expect(parseOpenChoices({ choices: ['a', 'b', 'c', 'd'], answerIdx: '2' })).toEqual({ choices: ['a', 'b', 'c', 'd'], answerIdx: 2 })
    expect(parseOpenChoices({ choices: ['a', 'b', 'c'], answerIdx: 0 })).toBe(null)
    expect(parseOpenChoices({ choices: ['a', 'A', 'c', 'd'], answerIdx: 0 })).toBe(null)
    expect(parseOpenChoices({ choices: ['a', '', 'c', 'd'], answerIdx: 0 })).toBe(null)
    expect(parseOpenChoices({ choices: ['a', 'b', 'c', 'd'], answerIdx: 4 })).toBe(null)
    expect(parseOpenChoices(null)).toBe(null)
  })
})

describe('open choices for a word answer follow the prefix rule', () => {
  it('names the prefix the learner saw', () => {
    const p = buildOpenChoicesPrompt({ question: 'Q', answer: 'pantalones', isLanguage: true, learnLang: 'Spanish', prefix: 'pa' })
    expect(p).toMatch(/starts with "pa"/)
    expect(buildOpenChoicesPrompt({ question: 'Q', answer: 'pantalones', isLanguage: true, learnLang: 'Spanish' })).not.toMatch(/starts with/)
  })
})
