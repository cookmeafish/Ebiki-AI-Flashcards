// The mistake list of one mode, as pure functions (tested). A mistake = a study question answered wrong.
// It stays until it has been answered right CLEAR_AFTER times in the gym, and the list keeps the newest
// MAX_ITEMS so an old deck's misses don't crowd out today's. `practicedAt` = last workout that drilled it.
import { lastPracticed, COOLDOWN_MS } from '../kit/practiceLog'
export const MAX_ITEMS = 150
export const CLEAR_AFTER = 2
export const WORKOUT_SIZE = 8
export const GYM_SRC = 'mistake-gym' // this feature's id in the practice log
export const REST_MS = 12 * 60 * 60 * 1000 // a mistake drilled in the last 12 hours waits for the others

// Stored text is capped per field: 150 mistakes with whole card backs and grader essays grew the file without bound
// (it is re-read and re-written on every graded miss).
export const FIELD_MAX = { front: 200, back: 600, question: 500, answer: 300, expected: 300, feedback: 600 }
const FIELDS = Object.keys(FIELD_MAX)
const text = (v, k) => (typeof v === 'string' || typeof v === 'number' ? String(v) : '').slice(0, FIELD_MAX[k])
const num = (v, d) => { const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN; return Number.isFinite(n) ? n : d }

const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim()
const keyOf = (m) => `${norm(m.front)}|${norm(m.question)}`
const newId = () => Math.random().toString(36).slice(2, 10)
const byNewest = (a, b) => (b.at || 0) - (a.at || 0)

export const emptyList = () => ({ items: [] })

// The list as read from disk, made safe: a damaged row (null, a string, no question; a shared folder can hold a
// half-written or hand-edited file) threw inside every later change, so no mistake was ever saved again.
export function shapeList(list) {
  const raw = Array.isArray(list?.items) ? list.items : []
  const items = []
  for (const m of raw) {
    if (!m || typeof m !== 'object' || Array.isArray(m)) continue
    const row = {}
    for (const k of FIELDS) row[k] = text(m[k], k)
    if (!row.question) continue
    items.push({
      ...row,
      id: typeof m.id === 'string' && m.id ? m.id.slice(0, 40) : newId(),
      n: Math.max(1, Math.round(num(m.n, 1))),
      at: num(m.at, 0),
      cleared: Math.max(0, Math.round(num(m.cleared, 0))),
      ...(num(m.practicedAt, 0) ? { practicedAt: num(m.practicedAt, 0) } : {}),
    })
  }
  return { items: items.slice(0, MAX_ITEMS) }
}

// Fold a graded card's misses in. Repeats of the same question count up instead of duplicating.
export function addMisses(list, { front, back, misses }, now = Date.now()) {
  const items = [...shapeList(list).items]
  for (const m of Array.isArray(misses) ? misses : []) {
    if (!m || typeof m !== 'object') continue
    const cand = { front: text(front, 'front'), back: text(back, 'back'), question: text(m.question, 'question'), answer: text(m.answer, 'answer'), expected: text(m.expected, 'expected'), feedback: text(m.feedback, 'feedback') }
    if (!cand.question) continue
    const i = items.findIndex((x) => keyOf(x) === keyOf(cand))
    if (i >= 0) items[i] = { ...items[i], ...cand, n: (items[i].n || 1) + 1, at: now, cleared: 0 }
    else items.push({ id: newId(), ...cand, n: 1, at: now, cleared: 0 })
  }
  items.sort(byNewest)
  return { items: items.slice(0, MAX_ITEMS) }
}

// After a workout: each practiced mistake moves toward retirement on a right answer, back to zero on a wrong one.
export function applyPractice(list, outcomes, now = Date.now()) {
  const byId = new Map()
  for (const o of Array.isArray(outcomes) ? outcomes : []) if (o?.target) byId.set(o.target, (byId.get(o.target) ?? true) && !!o.correct)
  const items = []
  for (const m of shapeList(list).items) {
    if (!byId.has(m.id)) { items.push(m); continue }
    const cleared = byId.get(m.id) ? (m.cleared || 0) + 1 : 0
    if (cleared >= CLEAR_AFTER) continue
    items.push({ ...m, cleared, n: byId.get(m.id) ? m.n : (m.n || 1) + 1, practicedAt: now })
  }
  return { items }
}

// The mistakes a workout should target: most repeated first, then most recent. Mistakes drilled in the last
// REST_MS, or whose card another activity practiced within the cooldown (`log`, kit/practiceLog), go after the
// rest, so back-to-back workouts rotate instead of repeating the same cards.
export function pickForWorkout(list, k = WORKOUT_SIZE, { log = null, now = Date.now() } = {}) {
  const resting = (m) => (m.practicedAt && now - m.practicedAt < REST_MS) || (log && now - (lastPracticed(log, m.front, 'card', { excludeSrc: GYM_SRC }) || -Infinity) < COOLDOWN_MS)
  const byNeed = (a, b) => (b.n || 1) - (a.n || 1) || byNewest(a, b)
  const items = shapeList(list).items
  return [...items.filter((m) => !resting(m)).sort(byNeed), ...items.filter(resting).sort(byNeed)].slice(0, k)
}
