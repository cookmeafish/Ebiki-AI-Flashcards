// LEARNER LEVEL (pure, tested): one number per mode, like a Duolingo Score, plus a band for people
// (A1 to C2 for a language, Beginner to Expert for anything else). Set by the Legends placement exam and moved
// by what the learner does afterwards (study, Mistake Gym, Ebi Call, Roleplay, Legends). Shared in the kit so
// any feature can read it (prompts get `learnerLine`) without features importing each other.
export const LEVEL_MIN = 0
export const LEVEL_MAX = 130
export const HISTORY_MAX = 60
export const TOPICS_MAX = 8

// Band floors, lowest first. `key` is the i18n suffix (lg_band_<key>) and `label` the English name for prompts.
export const LANGUAGE_BANDS = [
  { key: 'a1', min: 0, label: 'A1 (beginner)' },
  { key: 'a2', min: 20, label: 'A2 (elementary)' },
  { key: 'b1', min: 40, label: 'B1 (intermediate)' },
  { key: 'b2', min: 60, label: 'B2 (upper intermediate)' },
  { key: 'c1', min: 85, label: 'C1 (advanced)' },
  { key: 'c2', min: 110, label: 'C2 (mastery)' },
]
export const GENERAL_BANDS = [
  { key: 'beginner', min: 0, label: 'Beginner' },
  { key: 'elementary', min: 20, label: 'Elementary' },
  { key: 'intermediate', min: 45, label: 'Intermediate' },
  { key: 'advanced', min: 75, label: 'Advanced' },
  { key: 'expert', min: 105, label: 'Expert' },
]

// How far one finished activity can move the level, by where it came from. A ratio above TARGET_RATIO raises
// it, below lowers it; small on purpose (the placement exam sets the level, practice only nudges it).
export const TARGET_RATIO = 0.7
// Legends steps are easy to repeat, so each moves the level little: a whole area is worth about 5 levels.
export const STEP = { study: 0.4, gym: 1.5, call: 1.5, roleplay: 2, legends: 0.6, boss: 2, practice: 1 }
export const CONFIDENCE_STEP = 0.02

// Numbers from a stored model: only a number or a numeric string counts (Number() of an odd object can throw).
const num = (v) => (typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN)
const clampLevel = (n) => Math.max(LEVEL_MIN, Math.min(LEVEL_MAX, Math.round((num(n) || 0) * 10) / 10))

export const bandsFor = (isLanguage) => (isLanguage ? LANGUAGE_BANDS : GENERAL_BANDS)
export function bandFor(level, isLanguage) {
  const bands = bandsFor(isLanguage)
  let hit = bands[0]
  for (const b of bands) if (clampLevel(level) >= b.min) hit = b
  return hit
}
// 0..1 progress through the current band (for a bar), 1 at the top band's ceiling.
export function bandProgress(level, isLanguage) {
  const bands = bandsFor(isLanguage)
  const lv = clampLevel(level)
  const i = bands.indexOf(bandFor(lv, isLanguage))
  const lo = bands[i].min
  const hi = bands[i + 1]?.min ?? LEVEL_MAX
  return hi > lo ? Math.max(0, Math.min(1, (lv - lo) / (hi - lo))) : 1
}

const topics = (list) => [...new Set((Array.isArray(list) ? list : []).map((s) => String(s || '').trim().slice(0, 60)).filter(Boolean))].slice(0, TOPICS_MAX)

export function newLearner({ level = 0, confidence = 0.5, strengths = [], gaps = [], source = 'placement' } = {}, now = Date.now()) {
  const lv = clampLevel(level)
  return { level: lv, peak: lv, confidence: Math.max(0, Math.min(1, confidence)), strengths: topics(strengths), gaps: topics(gaps), history: [{ at: now, source, delta: lv }] }
}

// A stored model in a usable shape (a damaged or older one never breaks a screen), or null.
export function shapeLearner(raw) {
  if (!raw || typeof raw !== 'object' || !Number.isFinite(num(raw.level))) return null
  const level = clampLevel(raw.level)
  return {
    level,
    peak: Math.max(level, clampLevel(raw.peak)), // the highest level ever reached (level-up rewards are paid once)
    confidence: Math.max(0, Math.min(1, num(raw.confidence) || 0)),
    strengths: topics(raw.strengths),
    gaps: topics(raw.gaps),
    history: (Array.isArray(raw.history) ? raw.history : []).filter((h) => h && Number.isFinite(num(h.delta))).slice(-HISTORY_MAX),
  }
}

// The nudge for one finished activity: { total, correct } answered, from `source` (a STEP key).
export function deltaFor(source, total, correct) {
  const n = Number(total) || 0
  if (n <= 0) return 0
  const ratio = Math.max(0, Math.min(1, (Number(correct) || 0) / n))
  const step = STEP[source] ?? STEP.practice
  // Scaled by how much evidence there is (a 2-question quiz moves less than a 15-question boss), capped at 2x.
  const weight = Math.min(2, Math.sqrt(n / 5))
  return Math.round((ratio - TARGET_RATIO) / (1 - TARGET_RATIO) * step * weight * 10) / 10
}

export function applyLearnerDelta(model, delta, source, { strengths, gaps } = {}, now = Date.now()) {
  const m = shapeLearner(model)
  if (!m) return null
  const d = Number(delta) || 0
  const history = [...m.history, { at: now, source: String(source || 'practice'), delta: d }].slice(-HISTORY_MAX)
  return {
    ...m,
    level: clampLevel(m.level + d),
    peak: Math.max(m.peak, clampLevel(m.level + d)),
    confidence: Math.min(1, m.confidence + CONFIDENCE_STEP),
    strengths: strengths ? topics([...strengths, ...m.strengths]) : m.strengths,
    gaps: gaps ? topics([...gaps, ...m.gaps.filter((g) => !(strengths || []).includes(g))]) : m.gaps,
    history,
  }
}

// One line for AI prompts (English: the model reads it, the learner never does).
export function learnerLine(model, isLanguage) {
  const m = shapeLearner(model)
  if (!m) return ''
  const band = bandFor(m.level, isLanguage)
  return [
    `level ${Math.round(m.level)} of ${LEVEL_MAX}, ${band.label}`,
    m.strengths.length ? `strong at: ${m.strengths.join(', ')}` : '',
    m.gaps.length ? `weak at: ${m.gaps.join(', ')}` : '',
  ].filter(Boolean).join('; ')
}
