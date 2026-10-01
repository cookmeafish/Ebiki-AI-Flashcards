// WHAT EBIKI ALREADY KNOWS about the learner in one mode (pure, tested). The app gathers raw facts (the mode
// deck's scheduling, study sessions, logged slips, the Discover profile, an existing level) through
// ctx.learning.evidence(); this turns them into numbers, a verdict ("enough to judge a level without a test?")
// and a compact text for prompts. Legends uses it to offer "Use what Ebiki knows" beside the placement exam.

// How much is enough to judge a level without a test: cards Anki has actually scheduled from the learner's own
// answers, or fewer of them plus a good number of graded study answers. Tunable here, nowhere else.
export const EVIDENCE = {
  minReviewed: 40,        // reviewed cards alone
  minReviewedWithStudy: 20,
  minStudyAnswers: 60,    // graded study answers that make up for fewer reviewed cards
  matureDays: 21,         // Anki's own "mature" line
  struggleLapses: 3,
  sampleKnown: 40,        // fronts sent to the model, per group
  sampleWeak: 25,
  sampleUnseen: 15,
  sampleSlips: 12,
  frontMax: 80,
}

const clip = (s, n) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim()
  return t.length > n ? `${t.slice(0, n - 1)}…` : t
}
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)

// Evenly spread pick (never only the oldest or newest cards of a big deck).
function spread(list, n) {
  if (list.length <= n) return list
  const step = list.length / n
  return Array.from({ length: n }, (_, i) => list[Math.floor(i * step)])
}

// cards:    [{ front, interval, lapses, reps }]   (a sample of the mode deck, from Anki)
// sessions: [{ cardsStudied, accuracy, totalQuestions, correct, date }]   (study history for that deck)
// slips:    [{ text, n }]   profile: { summary, level } | null   learner: shaped learner model | null
export function summarizeEvidence({ cards = [], sessions = [], slips = [], profile = null, learner = null } = {}) {
  const list = (Array.isArray(cards) ? cards : []).filter((c) => c && String(c.front || '').trim())
  const seen = list.filter((c) => num(c.interval) > 0 || num(c.reps) > 0)
  const mature = seen.filter((c) => num(c.interval) >= EVIDENCE.matureDays)
  const weak = seen.filter((c) => num(c.lapses) >= EVIDENCE.struggleLapses)
  const young = seen.filter((c) => num(c.interval) < EVIDENCE.matureDays && num(c.lapses) < EVIDENCE.struggleLapses)
  const unseen = list.filter((c) => !(num(c.interval) > 0 || num(c.reps) > 0))
  const sess = (Array.isArray(sessions) ? sessions : []).filter((s) => s && typeof s === 'object')
  const answers = sess.reduce((n, s) => n + num(s.totalQuestions), 0)
  const right = sess.reduce((n, s) => n + num(s.correct), 0)
  const studied = sess.reduce((n, s) => n + num(s.cardsStudied), 0)
  const accuracy = answers > 0 ? Math.round((right / answers) * 100) : null
  const enough = seen.length >= EVIDENCE.minReviewed || (seen.length >= EVIDENCE.minReviewedWithStudy && answers >= EVIDENCE.minStudyAnswers)
  const byInterval = (a, b) => num(b.interval) - num(a.interval)
  return {
    total: list.length,
    reviewed: seen.length,
    mature: mature.length,
    young: young.length,
    struggling: weak.length,
    unseen: unseen.length,
    sessions: sess.length,
    studied,
    answers,
    accuracy,
    enough,
    known: spread([...mature].sort(byInterval), EVIDENCE.sampleKnown).map((c) => clip(c.front, EVIDENCE.frontMax)),
    weak: spread([...weak].sort((a, b) => num(b.lapses) - num(a.lapses)), EVIDENCE.sampleWeak).map((c) => clip(c.front, EVIDENCE.frontMax)),
    learning: spread(young, EVIDENCE.sampleKnown).map((c) => clip(c.front, EVIDENCE.frontMax)),
    notYet: spread(unseen, EVIDENCE.sampleUnseen).map((c) => clip(c.front, EVIDENCE.frontMax)),
    slips: (Array.isArray(slips) ? slips : []).filter((s) => s && String(s.text || '').trim()).slice(0, EVIDENCE.sampleSlips).map((s) => `${clip(s.text, 120)}${num(s.n) > 1 ? ` (x${num(s.n)})` : ''}`),
    profile: profile && (profile.summary || profile.level) ? { summary: clip(profile.summary, 400), level: clip(profile.level, 60) } : null,
    level: learner && Number.isFinite(Number(learner.level)) ? Number(learner.level) : null,
  }
}

// The facts as prompt text (English, for the model). Fronts are DATA, quoted one per line.
export function evidenceText(sum) {
  if (!sum) return ''
  const lines = []
  lines.push(`Deck sample: ${sum.total} cards: ${sum.reviewed} reviewed by the learner (${sum.mature} mature, interval 21+ days, so reliably known; ${sum.young} still being learned; ${sum.struggling} forgotten ${EVIDENCE.struggleLapses}+ times), ${sum.unseen} never studied yet.`)
  if (sum.sessions) lines.push(`Study sessions in Ebiki: ${sum.sessions} (${sum.studied} cards, ${sum.answers} graded answers${sum.accuracy != null ? `, ${sum.accuracy}% right` : ''}).`)
  const group = (title, items) => { if (items.length) lines.push(`${title}:\n${items.map((f) => `- ${JSON.stringify(f)}`).join('\n')}`) }
  group('KNOWN WELL (mature cards)', sum.known)
  group('STILL LEARNING', sum.learning)
  group('STRUGGLES WITH (many lapses)', sum.weak)
  group('NOT STUDIED YET', sum.notYet)
  group('RECURRING MISTAKES logged while studying', sum.slips)
  if (sum.profile) lines.push(`Earlier estimate from the Discover tab: ${sum.profile.level || '?'}. ${sum.profile.summary || ''}`.trim())
  if (sum.level != null) lines.push(`Current Ebiki level: ${sum.level} of 130.`)
  return lines.join('\n\n')
}

// ── A level judged from the evidence (instead of a placement exam) ─────────────────────────────────────────────
// Same scale and bands as the exam (kit/learner.js), so a level read from evidence means what an exam level means.
export const EVIDENCE_ROLE = 'general'
export const EVIDENCE_MAX_TOKENS = 900
const NO_DASH = 'No dashes. Never write a shrimp emoji.'

export function buildEvidenceLevelPrompt(subject, sum, { bands = [], levelMax = 130, selfRating = 0 } = {}) {
  const scale = bands.map((b) => `${b.min}+ = ${b.label}`).join(', ')
  return {
    system: `You judge a learner's level from what a study app has observed, instead of a placement exam. Reply with JSON only: {"level": <0 to ${levelMax}>, "confidence": <0 to 1>, "strengths": ["..."], "gaps": ["..."], "why": "..."}. ${NO_DASH}`,
    user: [
      `Subject: ${subject.name}${subject.description ? ` (${subject.description})` : ''}.`,
      subject.isLanguage ? `The learner studies ${subject.learnLang} and reads ${subject.userLang}.` : `The subject is ${subject.name}, studied in ${subject.userLang}.`,
      `Level scale 0 to ${levelMax}. Bands: ${scale}.`,
      'Judge from the evidence below what the learner can reliably DO. Mature cards were answered right over weeks, so they are known; cards forgotten again and again are not; cards never studied say nothing about the learner. Weigh how HARD the known cards are, not only how many: a deck of easy cards, all known, is still an easy level.',
      'Be honest and slightly conservative: a level too high makes the first lessons too hard. When the evidence is thin or mixed, say so with a lower confidence.',
      selfRating ? `The learner rated their own knowledge ${selfRating} of 5 (a hint only; the evidence wins).` : '',
      `"strengths"/"gaps": up to 5 short topic names each, in English. "why": one or two short sentences in ${subject.userLang} telling the learner what the level is based on, naming a few things they clearly know and one or two to work on.`,
      `EVIDENCE:\n${evidenceText(sum)}`,
    ].filter(Boolean).join('\n'),
  }
}

export function parseEvidenceLevel(raw, clean = (s) => s, levelMax = 130) {
  const lv = raw?.level === '' || raw?.level == null ? NaN : Number(raw.level)
  if (!raw || typeof raw !== 'object' || !Number.isFinite(lv)) return null
  const conf = raw.confidence === '' || raw.confidence == null ? NaN : Number(raw.confidence)
  const list = (v) => (Array.isArray(v) ? v : []).map((x) => String(x).trim().slice(0, 60)).filter(Boolean).slice(0, 5)
  return {
    level: Math.max(0, Math.min(levelMax, Math.round(lv))),
    // Never surer than a real exam makes it: practice still moves the level quickly while it settles.
    confidence: Math.max(0.1, Math.min(0.7, Number.isFinite(conf) ? (conf > 1 ? conf / 100 : conf) : 0.4)),
    strengths: list(raw.strengths),
    gaps: list(raw.gaps),
    why: clean(String(raw.why || '')).slice(0, 500),
  }
}
