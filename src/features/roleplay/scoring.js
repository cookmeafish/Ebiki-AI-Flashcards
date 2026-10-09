// Roleplay data rules (pure, tested): scenario lists, the end-of-scene scorecard, and what "the scene" means
// for any subject. A language roleplay is judged on the language; anything else on the thinking.
import { pickObject, pickList, canonKeys } from '../../utils/aiJson'
export const SCORE_AXES = {
  language: ['accuracy', 'complexity', 'vocabulary'],
  general: ['correctness', 'reasoning', 'communication'],
}
export const SCORE_MAX = 5
export const MAX_SCENARIOS = 6
export const MAX_TIPS = 4
export const MAX_CARDS = 5
export const MIN_TURNS_TO_SCORE = 2 // fewer learner messages than this = nothing to judge
const MAX_LEN = { title: 60, emoji: 8, setting: 280, role: 160, goal: 200 }

export const axesFor = (subject) => SCORE_AXES[subject?.isLanguage ? 'language' : 'general']

// Model text only: a list or object where a string belongs is dropped, never shown as "[object Object]".
const str = (v, max) => (typeof v === 'string' || typeof v === 'number' ? String(v) : '').replace(/\s+/g, ' ').trim().slice(0, max)

// One scenario: { title, emoji, setting, role, goal }. Needs a setting and Ebi's role; the rest defaults.
export function cleanScenario(raw0, clean = (s) => s) {
  // A wrapped scenario ({"scenario": {...}}) or keys in another case ("Setting") read the same.
  const raw = pickObject(raw0, ['setting', 'role'], ['title', 'emoji', 'setting', 'role', 'goal'])
  if (!raw) return null
  const s = {
    title: clean(str(raw.title, MAX_LEN.title)),
    emoji: str(raw.emoji, MAX_LEN.emoji) || '🎭',
    setting: clean(str(raw.setting, MAX_LEN.setting)),
    role: clean(str(raw.role, MAX_LEN.role)),
    goal: clean(str(raw.goal, MAX_LEN.goal)),
  }
  if (!s.setting || !s.role) return null
  if (!s.title) s.title = s.setting.slice(0, 40)
  return s
}

export function parseScenarios(parsed, clean) {
  const list = pickList(parsed, 'scenarios', ['setting', 'role'], ['title', 'emoji', 'setting', 'role', 'goal'])
  const out = []
  for (const r of list) {
    const s = cleanScenario(r, clean)
    if (s && !out.some((o) => o.title.toLowerCase() === s.title.toLowerCase())) out.push(s)
    if (out.length >= MAX_SCENARIOS) break
  }
  return out
}

// Scorecard: { scores: { axis: 1..5 }, overall 1..5, goalMet, summary, strengths[], tips[], cards[{front,back}] }.
// Unknown axes are dropped, missing ones left out (the UI shows only what was judged); overall falls back to
// the mean of the scores.
export function normalizeScorecard(raw0, axes, clean = (s) => s) {
  const raw = pickObject(raw0, ['scores', 'overall'], ['scores', 'overall', 'goalMet', 'summary', 'strengths', 'tips', 'cards', 'mistakes'])
  if (!raw) return null
  const clamp = (n) => Math.max(1, Math.min(SCORE_MAX, Math.round(Number(n))))
  // A score as "4/5" or "4 out of 5" is its first number; an axis named in another case ("Accuracy") counts.
  const num = (v) => (typeof v === 'string' ? Number((v.match(/^\s*(\d+(?:\.\d+)?)/) || [])[1]) : Number(v))
  const given = canonKeys(raw.scores && typeof raw.scores === 'object' ? raw.scores : {}, axes)
  const scores = {}
  for (const a of axes) {
    const v = given[a]
    if (Number.isFinite(num(v)) && v !== null && v !== '') scores[a] = clamp(num(v))
  }
  const vals = Object.values(scores)
  const overall = Number.isFinite(Number(raw.overall)) && raw.overall !== null && raw.overall !== '' ? clamp(raw.overall) : vals.length ? clamp(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
  const list = (v, n) => (Array.isArray(v) ? v : []).map((x) => clean(str(x, 240))).filter(Boolean).slice(0, n)
  const cards = (Array.isArray(raw.cards) ? raw.cards : [])
    .map((c) => ({ front: clean(str(c?.front, 120)), back: clean((typeof c?.back === 'string' ? c.back : '').trim().slice(0, 600)) }))
    .filter((c) => c.front && c.back).slice(0, MAX_CARDS)
  // What the learner said wrong, with a better version: these reach the Mistake Gym like other practice misses.
  const mistakes = (Array.isArray(raw.mistakes) ? raw.mistakes : [])
    .map((m) => ({ said: clean(str(m?.said, 200)), better: clean(str(m?.better, 200)), why: clean(str(m?.why, 240)) }))
    .filter((m) => m.said && m.better && m.said.toLowerCase() !== m.better.toLowerCase()).slice(0, MAX_TIPS)
  if (!vals.length && !overall) return null
  return { scores, overall, goalMet: raw.goalMet === true || /^(true|yes)$/i.test(String(raw.goalMet ?? '').trim()), summary: clean(str(raw.summary, 400)), strengths: list(raw.strengths, MAX_TIPS), tips: list(raw.tips, MAX_TIPS), cards, mistakes }
}

// The scorecard as practice evidence for the learner level: 1 (the floor of the scale, "weak") counts as nothing
// right and SCORE_MAX as everything right. As overall of 5 the floor read as 20% right.
export const scoreAsPractice = (overall) => ({ total: SCORE_MAX - 1, correct: Math.max(0, Math.min(SCORE_MAX, Math.round(Number(overall) || 1)) - 1) })

// Scorecard mistakes as PRACTICE_MISSED entries (kit shape: front = the better version, the item to learn).
export const mistakesAsMisses = (mistakes, question) => (Array.isArray(mistakes) ? mistakes : [])
  .filter((m) => m?.said && m?.better)
  .map((m) => ({ front: m.better, back: m.why || '', question, answer: m.said, expected: m.better, feedback: m.why || '' }))
