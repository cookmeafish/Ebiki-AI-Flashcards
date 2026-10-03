// How many questions a studied card gets, and how a ONE-question card is rated. Pure (studyDepth.test.js).
// studyRules.questionDepth: 'adaptive' (default) = a due REVIEW gets one production question; new, learning or
// relearning (lapsed), struggling cards and relearn copies get the mode's questionsPerCard. 'thorough' = always
// questionsPerCard (the old behavior).
import { ADAPTIVE_STRUGGLE_LAPSES } from '../config/study'
import { gradeAnswer, easeFor, isMature } from '../config/grading'

export const QUESTION_DEPTHS = ['adaptive', 'thorough']
export const questionDepthOf = (rules) => (rules?.questionDepth === 'thorough' ? 'thorough' : 'adaptive')

const perCardOf = (rules) => {
  const n = Math.round(Number(rules?.questionsPerCard))
  return Number.isFinite(n) && n >= 1 ? Math.min(10, n) : 3
}

// card: an Anki cardsInfo row ({ type, queue, lapses, interval }) or a relearn copy ({ ..., _relearn: true }).
// ctx.kind: the study type; only flashcards are adaptive (conjugations and PBQs keep their own counts).
export function questionCountFor(card, rules, { kind = 'flashcards' } = {}) {
  const n = perCardOf(rules)
  if (n <= 1 || kind !== 'flashcards' || questionDepthOf(rules) === 'thorough' || !card) return n
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
