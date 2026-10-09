// THE QUESTION LADDER in raids and Legends: tiers per card and item, the prompts that ask at each tier, the leak
// guard's TIER 0 exemption, the review pass for raids (parse, plan, rewrite, resolve) and the graders' tier line.
import { describe, it, expect } from 'vitest'
import { parseRaidQuestions, placeholderFor, reviewPlan, redoOutcome, finalQuestion, startOrder } from './raidQuestions'
import { buildRaidPrompt, buildQuizPrompt, buildQuizCheckPrompt, parseQuizCheckWhy, parseQuestions, fitQuestionsToKind, ladderBlock, ROLE } from './prompt'
import { legendsItemTier, tieredItems } from './generate'
import { sanitizeQuestions, leaksAnswer } from '../kit/grade'
import { tierJudgeLine, buildVerdictPrompt, buildRecheckPrompt } from '../kit/fightJudge'
import { fightRules, rulesPatch, generationKey, ladderOn } from '../kit/fightSettings'
import { tierOf, QUESTION_CHECK_RULES, CLEAR_ANSWER_RULE } from '../../utils/questionTier'

const spanish = { name: 'Spanish', isLanguage: true, learnLang: 'Spanish', userLang: 'English', rules: '' }
const comptia = { name: 'CompTIA A+', isLanguage: false, userLang: 'English' }
const clean = (s) => String(s)

describe('tiers per raid card (Anki schedule)', () => {
  it('reads every tier from cardsInfo rows', () => {
    expect(tierOf({ type: 0, queue: 0, interval: 0, reps: 0 })).toBe(0)
    expect(tierOf({ type: 1, queue: 1, interval: 0, reps: 2 })).toBe(1)
    expect(tierOf({ type: 2, queue: 2, interval: 4, reps: 4 })).toBe(2)
    expect(tierOf({ type: 2, queue: 2, interval: 12, reps: 6 })).toBe(3)
    expect(tierOf({ type: 2, queue: 2, interval: 40, reps: 9 })).toBe(4)
    expect(tierOf({ type: 2, queue: 2, interval: 200, reps: 15 })).toBe(5)
    expect(tierOf({ type: 3, queue: 3, interval: 1, reps: 15 })).toBe(1) // a lapse drops it
  })
})

describe('tiers per Legends item (codex)', () => {
  const fresh = { id: 'a', front: 'hola', seen: 0, right: 0 }
  const bronze = { id: 'b', front: 'adiós', seen: 2, right: 1 }
  it('climbs with the codex, a boss one up, Legendary two', () => {
    expect(legendsItemTier(fresh, 'learn')).toBe(0)
    expect(legendsItemTier(bronze, 'learn')).toBe(1)
    expect(legendsItemTier(fresh, 'boss')).toBe(1)
    expect(legendsItemTier(bronze, 'legendary')).toBe(3)
  })
  it('marks items only while the ladder is on', () => {
    expect(tieredItems([fresh, bronze], 'learn', true).map((x) => x.tier)).toEqual([0, 1])
    expect(tieredItems([fresh], 'learn', false)[0].tier).toBeUndefined()
  })
})

describe('the ladder setting (one with Study)', () => {
  it('defaults on, writes questionLadder, and rewrites questions when it flips', () => {
    expect(fightRules({}).questionLadder).toBe(true)
    expect(fightRules({ questionLadder: false }).questionLadder).toBe(false)
    expect(rulesPatch({ questionLadder: false })).toEqual({ questionLadder: false })
    expect(generationKey({ questionLadder: true })).not.toBe(generationKey({ questionLadder: false }))
    expect(ladderOn(undefined)).toBe(true)
    expect(ladderOn({ questionLadder: false })).toBe(false)
  })
})

describe('prompts ask each card at its tier', () => {
  it('raid prompt lists tiers, the tier texts, the clear-answer rule and the self-check', () => {
    const { user } = buildRaidPrompt(spanish, [{ front: 'lluvia', back: 'rain', tier: 0 }, { front: 'huir', back: 'to flee', tier: 4 }])
    expect(user).toMatch(/1\. TIER 0 FRONT: lluvia/)
    expect(user).toMatch(/2\. TIER 4 FRONT: huir/)
    expect(user).toMatch(/TIER 0 \(MEET/)
    expect(user).toMatch(/TIER 4 \(PRODUCE/)
    expect(user).not.toMatch(/TIER 2 \(RECALL/)
    expect(user).toContain(CLEAR_ANSWER_RULE)
    expect(user).toMatch(/AMBIGUITY SELF-CHECK/)
  })
  it('without tiers (the ladder off) no tier text', () => {
    const { user } = buildRaidPrompt(spanish, [{ front: 'lluvia', back: 'rain' }])
    expect(user).not.toMatch(/QUESTION LADDER/)
    expect(user).toContain(CLEAR_ANSWER_RULE)
  })
  it('a rewrite names what the reviewer rejected', () => {
    const { user } = buildRaidPrompt(spanish, [{ front: 'lluvia', back: 'rain', tier: 2 }], { redo: [{ prompt: 'Rain?', why: 'two answers' }, { prompt: '', why: '' }] })
    expect(user).toMatch(/REVIEWER REJECTED/)
    expect(user).toMatch(/"Rain\?" \(rejected: two answers\)/)
    expect(user).toMatch(/no usable question/)
  })
  it('Legends quiz with the ladder: typed by default with choices, tiers per item', () => {
    const items = tieredItems([{ id: 'a', kind: 'term', front: 'hola', back: 'hello' }], 'learn', true)
    const { user } = buildQuizPrompt(spanish, { title: 'A', theme: 'B' }, { kind: 'learn' }, { choiceItems: items, ladder: true })
    expect(user).toMatch(/\[term\] TIER 0 hola/)
    expect(user).toMatch(/both at its TIER/)
    expect(user).toMatch(/TYPED by default/)
    expect(user).toMatch(/TIER 0 \(MEET/)
    expect(ladderBlock(spanish, [])).toBe('')
  })
  it('Legends quiz without the ladder keeps the old split', () => {
    const { user } = buildQuizPrompt(spanish, { title: 'A', theme: 'B' }, { kind: 'practice' }, { choiceItems: [{ id: 'a', kind: 'term', front: 'hola', back: 'hello' }] })
    expect(user).toMatch(/ask these as multiple choice/)
    expect(user).not.toMatch(/QUESTION LADDER/)
  })
})

describe('the leak guard spares only a TIER 0 teaching question', () => {
  const raw = { question: "This is how you say 'rain': 'lluvia'. Now you: rain?", accepted: ['lluvia'], choices: ['lluvia', 'nieve', 'sol', 'viento'], answer: 'lluvia' }
  it('drops a leaking question at any other tier, keeps it at tier 0', () => {
    // At tier 2 it falls back to a choice-only question, which a fight then drops (it gives itself away typed).
    expect(sanitizeQuestions([{ ...raw, tier: 2 }], { dual: true }).every((q) => q.kind === 'choice')).toBe(true)
    expect(fitQuestionsToKind(sanitizeQuestions([{ ...raw, tier: 2 }], { dual: true }), 'raid')).toHaveLength(0)
    const [q] = sanitizeQuestions([{ ...raw, tier: 0 }], { dual: true })
    expect(q.tier).toBe(0)
    expect(q.kind).toBe('typed')
    expect(q.alt.choices).toContain('lluvia')
  })
  it('catches answers in scripts without spaces', () => {
    expect(leaksAnswer('请说你好', ['你好'])).toBe(true)
    expect(leaksAnswer('How do you say hello?', ['你好'])).toBe(false)
  })
  it('parseQuestions sets the tier from the caller, never the model', () => {
    const [q] = parseQuestions([{ question: 'Say rain (s, "l")', accepted: ['lluvia'], tier: 5 }], clean, { tierFor: () => 1 })
    expect(q.tier).toBe(1)
    const [q2] = parseQuestions([{ question: 'Say rain (s, "l")', accepted: ['lluvia'], tier: 5 }], clean)
    expect(q2.tier).toBeUndefined()
  })
  it('a lesson keeps a choice question that cannot stand typed, a fight drops it', () => {
    const which = { kind: 'choice', prompt: 'Which of these means rain?', choices: ['lluvia', 'sol'], answerIdx: 0 }
    expect(fitQuestionsToKind([which], 'learn', { ladder: true })).toHaveLength(1)
    expect(fitQuestionsToKind([which], 'boss')).toHaveLength(0)
    const plain = { kind: 'choice', prompt: 'Rain in Spanish?', choices: ['lluvia', 'sol'], answerIdx: 0 }
    expect(fitQuestionsToKind([plain], 'learn', { ladder: true })[0].kind).toBe('typed')
  })
})

describe('raid questions: parse, review, rewrite, resolve', () => {
  const cards = [
    { cardId: 11, noteId: 1, front: 'lluvia', back: 'rain', tier: 0 },
    { cardId: 12, noteId: 2, front: 'huir', back: 'to flee', tier: 2 },
    { cardId: 13, noteId: 3, front: 'perro', back: 'dog', tier: 3 },
  ]
  const reply = { questions: [
    { card: 1, question: "Meet it: 'lluvia' means rain. Now you: rain?", accepted: ['lluvia'], choices: ['lluvia', 'sol', 'nieve', 'viento'], answer: 'lluvia' },
    { card: 2, question: 'To flee (huir) in Spanish?', accepted: ['huir'], choices: ['huir', 'correr', 'saltar', 'nadar'], answer: 'huir' }, // leaks at tier 2
    { card: 3, question: 'El ___ ladra (animal, "p").', accepted: ['perro'], choices: ['perro', 'gato', 'pez', 'loro'], answer: 'perro' },
  ] }
  it('keeps each card\'s tier, the letter count, and reports cards with no usable question', () => {
    const { qs, missing } = parseRaidQuestions(reply, cards, { clean, isLanguage: true })
    expect(qs.map((q) => q._cardId)).toEqual([11, 13])
    expect(qs.map((q) => q.tier)).toEqual([0, 3])
    expect(qs[1].prompt).toMatch(/\(p····\)/)
    expect(missing).toEqual([1])
  })
  it('plans the rewrite for rejected questions and placeholders, then swaps or drops', () => {
    const { qs } = parseRaidQuestions(reply, cards, { clean, isLanguage: true })
    const list = [qs[0], placeholderFor(cards[1]), qs[1]]
    const plan = reviewPlan(list, new Map([[2, 'two answers']]))
    expect(plan.state.get(11).s).toBe('ok')
    expect(plan.redo.map((r) => r.cardId)).toEqual([12, 13])
    expect(plan.redo[1].why).toBe('two answers')
    // The rewrite: a good question for 12, a rejected one for 13.
    const fresh = [{ kind: 'typed', prompt: 'new 12', accepted: ['huir'], _cardId: 12 }, { kind: 'typed', prompt: 'new 13', accepted: ['perro'], _cardId: 13 }]
    const out = redoOutcome([12, 13], fresh, new Set([1]))
    expect(out.get(12)).toEqual({ s: 'swap', q: fresh[0] })
    expect(out.get(13)).toEqual({ s: 'drop' })
    const state = new Map([...plan.state, ...out])
    expect(finalQuestion(list[1], state).prompt).toBe('new 12')
    expect(finalQuestion(list[2], state)).toBeNull()
    expect(startOrder(list, state).map((q) => q.prompt)).toEqual([qs[0].prompt, 'new 12'])
  })
  it('a failed review keeps every question (fail-soft); a pending rewrite goes last, then is skipped', () => {
    const { qs } = parseRaidQuestions(reply, cards, { clean, isLanguage: true })
    expect(reviewPlan(qs, null).redo).toHaveLength(0)
    const list = [placeholderFor(cards[1]), qs[0]]
    const state = new Map([[12, { s: 'redo' }], [11, { s: 'ok' }]])
    expect(startOrder(list, state).map((q) => q._cardId)).toEqual([11, 12])
    expect(finalQuestion(list[0], state)).toBeNull()
    // Attacks and inserted questions are not the review's business.
    expect(finalQuestion({ ...qs[0], _extra: true }, new Map([[11, { s: 'drop' }]]))._cardId).toBe(11)
  })
  it('a rewrite that failed drops every card it was for', () => {
    expect([...redoOutcome([12, 13], [], null).values()].every((v) => v.s === 'drop')).toBe(true)
  })
})

describe('the review pass prompt', () => {
  it('shows tiers, the optional options with their key, and the shared check rules; routed to the qcheck role', () => {
    const qs = [{ kind: 'typed', prompt: 'Rain? (l····)', accepted: ['lluvia'], tier: 2, alt: { choices: ['sol', 'lluvia'], answerIdx: 1 } }, { kind: 'typed', prompt: 'Write a sentence', accepted: ['huir'], open: true, tier: 4 }]
    const { system, user } = buildQuizCheckPrompt(spanish, [{ kind: 'card', front: 'lluvia', back: 'rain', tier: 2 }], qs)
    expect(system).toContain(QUESTION_CHECK_RULES)
    expect(user).toMatch(/0\. \[TIER 2\] Rain\?/)
    expect(user).toMatch(/optional options: sol \| \[KEY\] lluvia/)
    expect(user).toMatch(/1\. \[TIER 4, open\] Write a sentence/)
    expect(user).toMatch(/\[card\] TIER 2 lluvia/)
    expect(ROLE.quizCheck).toBe('qcheck')
  })
  it('reads the reasons with the verdict', () => {
    const m = parseQuizCheckWhy({ bad: [{ i: 1, why: 'two  answers' }, { i: 9, why: 'x' }] }, 3)
    expect([...m]).toEqual([[1, 'two answers']])
    expect(parseQuizCheckWhy('prose', 3)).toBeNull()
  })
})

describe('graders know the tier', () => {
  it('an open TIER 4 language sentence is judged on using the word, never matched as one word', () => {
    const q = { prompt: 'Describe running away', accepted: ['huir'], open: true, tier: 4 }
    expect(tierJudgeLine(q, spanish)).toMatch(/OPEN production.*any correct form.*NEVER compare/s)
    expect(buildVerdictPrompt(spanish, q, 'Tuve que huir.').user).toMatch(/OPEN production/)
    expect(buildRecheckPrompt(spanish, q, 'Huí rápido.').user).toMatch(/OPEN production/)
  })
  it('general open tiers judge understanding; tier 0 says the answer was shown; none without a tier', () => {
    expect(tierJudgeLine({ prompt: 'Why?', open: true, tier: 5 }, comptia)).toMatch(/understanding/)
    expect(tierJudgeLine({ prompt: 'x', tier: 0 }, spanish)).toMatch(/TIER 0 teaching/)
    expect(tierJudgeLine({ prompt: 'x' }, spanish)).toBe('')
  })
})

describe('a lesson never keeps a choice question that names its own answer', () => {
  it('drops it at tier 1, keeps it at tier 0', () => {
    const q = { kind: 'choice', prompt: 'Which of these is nieve?', choices: ['nieve', 'sol'], answerIdx: 0 }
    expect(fitQuestionsToKind([{ ...q, tier: 1 }], 'learn', { ladder: true })).toHaveLength(0)
    expect(fitQuestionsToKind([{ ...q, tier: 0 }], 'learn', { ladder: true })).toHaveLength(1)
  })
})
