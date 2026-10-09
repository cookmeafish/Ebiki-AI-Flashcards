// How many questions a studied card gets, and how a studied card is RATED. Pure (studyDepth.test.js); App.jsx only
// wires state around these (depthPlan at every card-state creation, rateStudyCard in the graders and the feedback
// chat's correction, oneQMissNeedsRequeue after a grade).
// studyRules.questionDepth: 'adaptive' (default) = a due REVIEW gets one production question; new, learning or
// relearning (lapsed), struggling cards and relearn copies get the mode's questionsPerCard. 'thorough' = always
// questionsPerCard (the old behavior).
// THE SWITCH: per mode, studyRules.questionDepth ('thorough' turns question depth off for that mode); app-wide, the
// default below (DEFAULT_QUESTION_DEPTH = 'thorough' turns it off for every mode that never chose).
// THE QUESTION LADDER (studyRules.questionLadder, default ON; utils/questionTier.js): Anki's spacing replaces the old
// several questions per card. In 'adaptive' depth EVERY flashcard (new, learning, struggling, review, relearn copy) gets
// ONE question whose tier climbs with the card's maturity in Anki; 'thorough' keeps questionsPerCard, climbing one tier
// per question from the card's own. Ladder off = the depth rule as it was before the ladder (tier 2 for everything).
import { ADAPTIVE_STRUGGLE_LAPSES } from '../config/study'
import { gradeAnswer, easeFor, isMature } from '../config/grading'
import { tierOf, clampTier, MAX_TIER } from './questionTier'

export const QUESTION_DEPTHS = ['adaptive', 'thorough']
export const DEFAULT_QUESTION_DEPTH = 'adaptive'
export const questionDepthOf = (rules) => (QUESTION_DEPTHS.includes(rules?.questionDepth) ? rules.questionDepth : DEFAULT_QUESTION_DEPTH)
// The ladder is ON unless the mode turned it off (fights read the same flag through ctx.study.rules()).
export const questionLadderOn = (rules) => rules?.questionLadder !== false

// Each question's tier for a card of tier `tier` asked `n` questions: Q1 at the card's tier, each later one a tier
// higher, capped at the top.
export const questionTiers = (tier, n) => Array.from({ length: Math.max(1, Number(n) || 1) }, (_, i) => Math.min(MAX_TIER, clampTier(tier) + i))

const perCardOf = (rules) => {
  const n = Math.round(Number(rules?.questionsPerCard))
  return Number.isFinite(n) && n >= 1 ? Math.min(10, n) : 3
}

// card: an Anki cardsInfo row ({ type, queue, lapses, interval }) or a relearn copy ({ ..., _relearn: true }).
// ctx.kind: the study type; only flashcards are adaptive (conjugations and PBQs keep their own counts).
export function questionCountFor(card, rules, { kind = 'flashcards' } = {}) {
  const n = perCardOf(rules)
  if (n <= 1 || kind !== 'flashcards' || questionDepthOf(rules) === 'thorough') return n
  if (questionLadderOn(rules)) return 1 // the ladder: one question per review for every card, Anki's spacing does the rest
  if (!card) return n
  if (card._relearn) return n
  const type = Number(card.type), queue = Number(card.queue)
  if (type === 0 || queue === 0) return n                       // new
  if (Number(card.lapses) >= ADAPTIVE_STRUGGLE_LAPSES) return n  // struggling
  // A due REVIEW (Anki type/queue 2). Learning (1) and relearning (3, a lapse) cards are not.
  const review = type === 2 && (Number.isNaN(queue) || queue === 2 || queue < 0)
  return review ? 1 : n
}

// result: { correct, skipped, hintUsed, accentSlip, retried, corrected, choice }; card: { interval } in days.
// → { label, ease }. Again = wrong or skipped; Hard = right but not clean; Good = clean; Easy = clean, typed, mature.
export function oneQuestionRating(result, card) {
  const r = result || {}
  const label = gradeAnswer({
    correct: !!r.correct && !r.skipped,
    hintUsed: !!r.hintUsed, accentSlip: !!r.accentSlip, retried: !!r.retried, corrected: !!r.corrected,
    choice: !!r.choice, mature: isMature(card?.interval),
  })
  return { label, ease: easeFor(label) }
}

// A card's plan at creation: → { rules (questionsPerCard = this card's count: generation, the split-first-card path
// and the reuse signature read it), flags }. One-question cards carry `oneQ` and `ivl` (Anki interval, days, for the
// mature check). Thorough mode never sets oneQ.
// With the ladder on (flashcards only) the card also carries `tier` (tierOf: Anki's schedule; a relearn copy is tier 1)
// and the rules carry `questionTiers` (one tier per question) for the generator; ladder off sets neither.
export function depthPlan(card, rules, kind = 'flashcards') {
  const n = questionCountFor(card, rules, { kind })
  const ladder = kind === 'flashcards' && questionLadderOn(rules)
  const tier = ladder ? tierOf(card) : null
  const ladderRules = (r, count) => (ladder ? { ...r, questionTiers: questionTiers(tier, count) } : r)
  const ladderFlags = ladder ? { tier } : {}
  if (n !== 1 || questionDepthOf(rules) === 'thorough' || kind !== 'flashcards') {
    return { rules: ladderRules(rules, n), flags: { ...ladderFlags } }
  }
  return { rules: ladderRules({ ...rules, questionsPerCard: 1 }, 1), flags: { oneQ: true, ivl: Number(card?.interval) || 0, ...ladderFlags } }
}

// A studied card's rating from its graded results → { ease, label }. cs: the card state ({ oneQ, ivl, answers,
// hintQs, accentSlips, questionAttempts, mc, pbq, noSync, isConjugation }).
// A ONE-question card (cs.oneQ) is rated by the shared one-answer rule (config/grading.js): Again = wrong or skipped;
// Hard = right with a hint (the meaning hint, or a retry after a wrong try, which shows the letter hints), an accent
// slip or a penalizing grader note (grammar ones only with grammarOn); Good = clean; Easy = clean, typed, mature.
// Every other card keeps the COUNT rule: 0 wrong Easy, 1 Good, more Hard, all Again ("all wrong" first: on a
// one-question card it equals "one wrong"). MC/PBQ cards that record to Anki cap at Good; an accent slip caps at Good.
// cs.byChoice ({ qi: bool }, the question ladder's per-question "Show choices"): which answers were PICKED from
// options. Per ENTRY: a question with no entry (answered in a session saved before byChoice existed, or given up)
// counts as picked on a multiple-choice card (cs.mc). Per object it was wrong: a session restored across the update
// whose mc card got ONE typed answer ("Type it instead") lost the Good cap of the answers it had already picked.
export const answeredByChoice = (cs, qi) => {
  const v = cs?.byChoice && typeof cs.byChoice === 'object' ? cs.byChoice[qi] : undefined
  return typeof v === 'boolean' ? v : !!cs?.mc
}
export function rateStudyCard(cs, results, grammarOn = false) {
  const list = Array.isArray(results) ? results : []
  const anyChoice = list.some((_, qi) => answeredByChoice(cs, qi))
  if (cs?.oneQ && list.length === 1 && !cs.isConjugation && !cs.pbq) {
    const r = list[0] || {}
    const notes = Array.isArray(r.notes) ? r.notes : []
    return oneQuestionRating({
      correct: !!r.correct,
      skipped: String(cs.answers?.[0] ?? '') === '(skipped)',
      hintUsed: !!cs.hintQs?.[0],
      accentSlip: (cs.accentSlips || 0) > 0,
      retried: (cs.questionAttempts?.[0] || []).length > 1,
      corrected: notes.some((n) => n?.penalize && (n.type !== 'grammar' || grammarOn)),
      choice: answeredByChoice(cs, 0) && !cs.noSync, // practice (noSync) keeps the honest label, like the count rule
    }, { interval: cs.ivl })
  }
  const qpc = list.length
  const wrongCount = list.filter((r) => !r?.correct || (grammarOn && (r.notes || []).some((n) => n?.type === 'grammar' && n.penalize))).length
  let ease, label
  if (wrongCount === 0) { ease = 4; label = 'easy' }
  else if (wrongCount >= qpc) { ease = 1; label = 'again' }
  else if (wrongCount === 1) { ease = 3; label = 'good' }
  else { ease = 2; label = 'hard' }
  // Recognition (picking from options) is easier than recall: a card that records to Anki never rates above Good off
  // a multiple-choice pass. Pure practice (noSync) keeps the honest label; it never reaches Anki.
  if ((anyChoice || cs?.pbq) && !cs?.noSync && ease > 3) { ease = 3; label = 'good' }
  // Strict accents: perfect answers with accent slips grade Good at best.
  if (ease === 4 && (cs?.accentSlips || 0) > 0) { ease = 3; label = 'good' }
  return { ease, label }
}

// A one-question review answered wrong (Again, recorded once) comes back in the session as a relearn copy (noSync;
// with the ladder ONE tier-1 question, without it the full questionsPerCard). Not for relearn/practice copies, conjugations or PBQs, and not for a give-up while the
// Learn-it moment is on (the moment re-queues it itself).
export function oneQMissNeedsRequeue(cs, label, { learnMoment = true } = {}) {
  if (!cs?.oneQ || label !== 'again' || cs.relearn || cs.noSync || cs.isConjugation || cs.pbq) return false
  const gaveUp = String(cs.answers?.[0] ?? '') === '(skipped)'
  return !(gaveUp && learnMoment)
}
