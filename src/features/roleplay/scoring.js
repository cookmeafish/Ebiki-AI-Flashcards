// Roleplay data rules (pure, tested): scenario lists, the end-of-scene scorecard, and what "the scene" means
// for any subject. A language roleplay is judged on the language; anything else on the thinking.
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

const str = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max)

// One scenario: { title, emoji, setting, role, goal }. Needs a setting and Ebi's role; the rest defaults.
export function cleanScenario(raw, clean = (s) => s) {
  if (!raw || typeof raw !== 'object') return null
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
  const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.scenarios) ? parsed.scenarios : []
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
export function normalizeScorecard(raw, axes, clean = (s) => s) {
  if (!raw || typeof raw !== 'object') return null
  const clamp = (n) => Math.max(1, Math.min(SCORE_MAX, Math.round(Number(n))))
  const scores = {}
  for (const a of axes) {
    const v = raw.scores?.[a]
    if (Number.isFinite(Number(v)) && v !== null && v !== '') scores[a] = clamp(v)
  }
  const vals = Object.values(scores)
  const overall = Number.isFinite(Number(raw.overall)) && raw.overall !== null ? clamp(raw.overall) : vals.length ? clamp(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
  const list = (v, n) => (Array.isArray(v) ? v : []).map((x) => clean(str(x, 240))).filter(Boolean).slice(0, n)
  const cards = (Array.isArray(raw.cards) ? raw.cards : [])
    .map((c) => ({ front: clean(str(c?.front, 120)), back: clean(String(c?.back ?? '').trim().slice(0, 600)) }))
    .filter((c) => c.front && c.back).slice(0, MAX_CARDS)
  if (!vals.length && !overall) return null
  return { scores, overall, goalMet: raw.goalMet === true, summary: clean(str(raw.summary, 400)), strengths: list(raw.strengths, MAX_TIPS), tips: list(raw.tips, MAX_TIPS), cards }
}
