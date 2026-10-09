// RAID QUESTIONS (pure, tested: raidQuestions.test.js): a model's raid reply turned into the run's questions, and THE
// REVIEW PASS that looks at them before the learner does (the same independent check Study and Legends quizzes run,
// QUESTION_CHECK_RULES in prompt.js buildQuizCheckPrompt).
//
// THE QUESTION LADDER: each card carries `tier` (utils/questionTier.js tierOf(the Anki card); null with the ladder off),
// and its question carries it too (the chip above the question, the leak guard's TIER 0 exemption, the judge's tier).
//
// LATENCY (a raid must start at once): the questions are written in one call, the intro shows right away, and the
// review runs in the BACKGROUND (one call for the batch) while the intro plays. Questions it rejects, and cards whose
// question was dropped (it showed its answer, it was unusable), are written ONCE more for just those cards and reviewed
// again; still bad = dropped (that card is not asked; it stays due). Pressing Fight waits for the review at most
// REVIEW.waitMs (startOrder then moves anything still being rewritten to the end); later questions are resolved as the
// run reaches them (finalQuestion), so the fight never blocks on a check.
import { raidCardIndex } from './raid'
import { parseQuestions, fitQuestionsToKind } from './prompt'
import { ensureLetterCue } from '../kit/fightSettings'

export const REVIEW = { waitMs: 4000 }

// The cards a raid fights with, as prompts see them: { cardId, noteId, front, back, tier? }.
// raw: the model's JSON (an array, {"questions": [...]}, or another key). → { qs, missing } where `missing` = the cards
// (indexes) that got no usable question.
export function parseRaidQuestions(raw, cards, { clean = (s) => s, isLanguage = false, speakLang = '' } = {}) {
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.questions) ? raw.questions
    : (raw && typeof raw === 'object' && Object.values(raw).find((v) => Array.isArray(v) && v.some((q) => q && typeof q === 'object' && 'question' in q))) || []
  const byCard = new Map()
  for (const q of list) {
    const i = raidCardIndex(q?.card)
    const card = cards[i]
    if (!card || byCard.has(i)) continue
    // The tier is the CARD's (never the model's own "tier"): a TIER 0 teaching question passes the leak guard.
    const tierFor = () => (card.tier != null ? card.tier : undefined)
    const [one] = fitQuestionsToKind(parseQuestions([q], clean, { speakLang, dual: true, tierFor }), 'raid') // every fight question stands typed
    if (!one) continue
    // Study's letter-count guarantee for a typed language answer (kit/fightSettings.js; never on an open question).
    byCard.set(i, { ...ensureLetterCue(one, { isLanguage }), _cardId: card.cardId, target: card.front })
  }
  const qs = []
  const missing = []
  cards.forEach((c, i) => { if (byCard.has(i)) qs.push(byCard.get(i)); else missing.push(i) })
  return { qs, missing }
}

// A card with no question yet (its question was dropped): a slot in the run that the rewrite fills, or skips.
export const placeholderFor = (card) => ({ kind: 'typed', prompt: '', accepted: [], target: card.front, _cardId: card.cardId, _redo: true, ...(card.tier != null ? { tier: card.tier } : {}) })

// The review's verdict on a batch → the plan: which questions stand ('ok'), which cards are written again ('redo',
// with the rejected prompt and the reviewer's reason for the rewrite prompt). `bad`: Map index -> why, or a Set of
// indexes (prompt.js parseQuizCheck), or null when the review did not run (fail-soft: every question stands).
export function reviewPlan(qs, bad) {
  const why = (i) => (bad instanceof Map ? bad.get(i) || '' : '')
  const has = (i) => !!bad && (bad instanceof Map || bad instanceof Set) && bad.has(i)
  const state = new Map()
  const redo = []
  qs.forEach((q, i) => {
    if (q._redo) { redo.push({ cardId: q._cardId, prompt: '', why: 'no usable question' }); state.set(q._cardId, { s: 'redo' }); return }
    if (has(i)) { redo.push({ cardId: q._cardId, prompt: q.prompt, why: why(i) }); state.set(q._cardId, { s: 'redo' }); return }
    state.set(q._cardId, { s: 'ok' })
  })
  return { state, redo }
}

// The rewrite's result for the cards that were redone: its questions (already reviewed: `bad` from the second check)
// → the final states for those cards ('swap' with the new question, or 'drop').
export function redoOutcome(redoCardIds, newQs, bad) {
  const out = new Map()
  const has = (i) => !!bad && (bad instanceof Map || bad instanceof Set) && bad.has(i)
  const byCard = new Map()
  newQs.forEach((q, i) => { if (!has(i) && q && !q._redo && !byCard.has(q._cardId)) byCard.set(q._cardId, q) })
  for (const id of redoCardIds) out.set(id, byCard.has(id) ? { s: 'swap', q: byCard.get(id) } : { s: 'drop' })
  return out
}

// A raid question as the run reaches it: the question itself, its replacement, or null (dropped, or still being
// rewritten when the run got there: that card is skipped and stays due). Attacks and inserted questions are not the
// review's business.
export function finalQuestion(q, state) {
  if (!q || q._extra || q._attack || q._cardId == null || !state) return q
  const v = state.get(q._cardId)
  if (!v) return q._redo ? null : q
  if (v.s === 'swap') return v.q
  if (v.s === 'drop' || v.s === 'redo') return null
  return q._redo ? null : q
}

// The list the fight STARTS with (nothing asked yet, so it may change freely): replacements in, dropped questions out,
// cards still being rewritten moved to the end (resolved or skipped when the run reaches them).
export function startOrder(list, state) {
  const ready = []
  const later = []
  for (const q of list || []) {
    const v = state?.get(q?._cardId)
    if (v?.s === 'redo') { later.push(q); continue }
    const f = finalQuestion(q, state)
    if (f) ready.push(f)
  }
  return [...ready, ...later]
}
