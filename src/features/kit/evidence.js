// WHAT EBIKI ALREADY KNOWS about the learner in one mode, as a VERDICT (pure, tested): "enough to judge a level
// without a test?", what is missing when not, and the level prompt. The facts themselves come from the app-wide
// learner context (kit/learnerContext.js, `ctx.learning.context()`): the mode deck's studied cards (real scheduling)
// and its NEW cards (the scope the learner chose), study sessions, logged slips, chats with Ebi tagged with the
// mode, the Discover profile, the practice log and feature progress (Legends map, raids). Legends uses it for
// "Use what Ebiki knows"; the learner feature uses it to give a level to a learner who never took the exam.
import { formatLearnerContext, contextSources } from './learnerContext'

// How much is enough to judge a level without a test. Points: a studied card = 1 (its real stats tell how well
// it is known); a graded study answer = 1/3; the learner's own chat words = 1 per 15 words (capped: chats alone
// cannot carry it); a logged slip = 1 (capped); a Discover profile = 5. NEW cards are never points (a fresh import
// is not knowledge), but a deck that shows its scope lowers the bar for a CAUTIOUS level. Tunable here, nowhere else.
export const EVIDENCE = {
  minScore: 40,           // enough on its own
  minScoreWithScope: 15,  // enough when the deck also shows what the learner is aiming at (new cards)
  minScope: 30,           // new cards that count as "shows the scope"
  solidScore: 60,         // at or above: a normal level; below: cautious (lower confidence)
  solidReviewed: 40,
  answersPerPoint: 3,
  chatWordsPerPoint: 15,
  chatMax: 25,
  slipMax: 10,
  discoverPoints: 5,
  confidenceMax: 0.7,     // never surer than a real exam makes it
  cautiousMax: 0.45,
}

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)

// snap = buildLearnerSnapshot(...). Numbers, the verdict and what is missing.
export function summarizeEvidence(snap) {
  const deck = snap?.deck || {}
  const deckOk = deck.ok !== false
  const reviewed = deckOk ? num(deck.studied) : 0
  const fresh = deckOk ? num(deck.new) : 0
  const answers = num(snap?.study?.answers)
  const chatWords = num(snap?.chats?.learnerWords)
  const slips = num(snap?.slips?.count)
  const profile = !!snap?.discover?.profile
  const points = {
    cards: reviewed,
    study: answers / EVIDENCE.answersPerPoint,
    chats: Math.min(EVIDENCE.chatMax, chatWords / EVIDENCE.chatWordsPerPoint),
    slips: Math.min(EVIDENCE.slipMax, slips),
    discover: profile ? EVIDENCE.discoverPoints : 0,
  }
  const score = Math.round(Object.values(points).reduce((a, b) => a + b, 0) * 10) / 10
  const scoped = fresh >= EVIDENCE.minScope
  const enough = score >= EVIDENCE.minScore || (scoped && score >= EVIDENCE.minScoreWithScope)
  const cautious = enough && !(score >= EVIDENCE.solidScore || reviewed >= EVIDENCE.solidReviewed)
  const target = scoped ? EVIDENCE.minScoreWithScope : EVIDENCE.minScore
  const sources = contextSources(snap)
  return {
    total: deckOk ? num(deck.total) : 0,
    reviewed,
    mature: deckOk ? num(deck.mature) : 0,
    young: deckOk ? num(deck.young) : 0,
    struggling: deckOk ? num(deck.struggling) : 0,
    fresh,
    sessions: num(snap?.study?.sessions),
    answers,
    accuracy: snap?.study?.accuracy ?? null,
    chats: num(snap?.chats?.items?.length),
    chatWords,
    slips,
    profile,
    points,
    score,
    enough,
    cautious,
    // About how many more studied cards would make it enough (a study answer or chat counts too, in plain words).
    missing: enough ? 0 : Math.max(1, Math.ceil(target - score)),
    deckOk,
    deckUnreachable: !deckOk && !!deck.unreachable,
    deckFailed: !deckOk,
    hasDeck: !!deck.name,
    sources,
    any: sources.length > 0,
  }
}

// The facts as prompt text (English, for the model), bounded.
export const EVIDENCE_BUDGET = 9000
export function evidenceText(snap, budget = EVIDENCE_BUDGET) {
  return formatLearnerContext(snap, { budget, sections: ['deck', 'studied', 'study', 'slips', 'chats', 'new', 'discover', 'practice', 'extra', 'level'] })
}

// ── A level judged from the evidence (instead of a placement exam) ─────────────────────────────────────────────
// Same scale and bands as the exam (kit/learner.js), so a level read from evidence means what an exam level means.
export const EVIDENCE_ROLE = 'general'
export const EVIDENCE_JOB = 'learner.level'
export const EVIDENCE_MAX_TOKENS = 900
const NO_DASH = 'No dashes. Never write a shrimp emoji.'

export function buildEvidenceLevelPrompt(subject, snap, { bands = [], levelMax = 130, selfRating = 0, sum = summarizeEvidence(snap) } = {}) {
  const scale = bands.map((b) => `${b.min}+ = ${b.label}`).join(', ')
  return {
    system: `You judge a learner's level from what a study app has observed, instead of a placement exam. Reply with JSON only: {"level": <0 to ${levelMax}>, "confidence": <0 to 1>, "strengths": ["..."], "gaps": ["..."], "why": "..."}. ${NO_DASH}`,
    user: [
      `Subject: ${subject.name}${subject.description ? ` (${subject.description})` : ''}.`,
      subject.isLanguage ? `The learner studies ${subject.learnLang} and reads ${subject.userLang}.` : `The subject is ${subject.name}, studied in ${subject.userLang}.`,
      `Level scale 0 to ${levelMax}. Bands: ${scale}.`,
      'Judge from the evidence below what the learner can reliably DO. Studied cards carry their real stats: a long interval with few lapses is known; cards forgotten again and again are not. Weigh how HARD the known cards are, not only how many: a deck of easy cards, all known, is still an easy level.',
      'NEW cards were never studied: they say nothing about what the learner knows. Use them only to see the scope of the deck and the level the learner is aiming for.',
      subject.isLanguage
        ? "In chats, the learner's own messages show what they can produce in the language (their grammar, vocabulary and mistakes); Ebi's replies show what was corrected or explained."
        : "In chats, the learner's own questions and answers show how deep their understanding goes; Ebi's replies show what was corrected or explained.",
      'Be honest and slightly conservative: a level too high makes the first lessons too hard. When the evidence is thin or mixed, say so with a lower confidence.',
      sum.cautious ? `The evidence is LIMITED: give a cautious level and a confidence of ${EVIDENCE.cautiousMax} or lower.` : '',
      sum.deckFailed ? 'The card deck could not be read this time: judge from the other evidence only.' : '',
      selfRating ? `The learner rated their own knowledge ${selfRating} of 5 (a hint only; the evidence wins).` : '',
      `"strengths"/"gaps": up to 5 short topic names each, in English. "why": one or two short sentences in ${subject.userLang} telling the learner what the level is based on, naming a few things they clearly know and one or two to work on.`,
      `EVIDENCE:\n${evidenceText(snap)}`,
    ].filter(Boolean).join('\n'),
  }
}

// A number the model may have written with words or units around it ("45 of 130", "60%"); NaN when there is none.
const leadNumber = (v) => {
  if (typeof v === 'number') return v
  const m = /^\s*(-?\d+(?:[.,]\d+)?)/.exec(String(v ?? ''))
  return m ? Number(m[1].replace(',', '.')) : NaN
}
export function parseEvidenceLevel(raw, clean = (s) => s, levelMax = 130, { cautious = false } = {}) {
  const lv = leadNumber(raw?.level)
  if (!raw || typeof raw !== 'object' || !Number.isFinite(lv)) return null
  const pct = typeof raw.confidence === 'string' && /%\s*$/.test(raw.confidence)
  const conf = leadNumber(raw.confidence) / (pct ? 100 : 1)
  // A comma separated string reads as its parts (a list was asked, "greetings, numbers" came back).
  const list = (v) => (Array.isArray(v) ? v : typeof v === 'string' ? v.split(/[,;\n]/) : []).map((x) => String(x).trim().slice(0, 60)).filter(Boolean).slice(0, 5)
  const cap = cautious ? EVIDENCE.cautiousMax : EVIDENCE.confidenceMax
  return {
    level: Math.max(0, Math.min(levelMax, Math.round(lv))),
    // Never surer than a real exam makes it: practice still moves the level quickly while it settles.
    confidence: Math.max(0.1, Math.min(cap, Number.isFinite(conf) ? (conf > 1 ? conf / 100 : conf) : 0.4)),
    strengths: list(raw.strengths),
    gaps: list(raw.gaps),
    why: clean(String(raw.why || '')).slice(0, 500),
  }
}
