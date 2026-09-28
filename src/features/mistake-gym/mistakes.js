// The mistake list of one mode, as pure functions (tested). A mistake = a study question answered wrong.
// It stays until it has been answered right CLEAR_AFTER times in the gym, and the list keeps the newest
// MAX_ITEMS so an old deck's misses don't crowd out today's. `practicedAt` = last workout that drilled it.
import { lastPracticed, COOLDOWN_MS } from '../kit/practiceLog'
export const MAX_ITEMS = 150
export const CLEAR_AFTER = 2
export const WORKOUT_SIZE = 8
export const GYM_SRC = 'mistake-gym' // this feature's id in the practice log
export const REST_MS = 12 * 60 * 60 * 1000 // a mistake drilled in the last 12 hours waits for the others

const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim()
const keyOf = (m) => `${norm(m.front)}|${norm(m.question)}`
const newId = () => Math.random().toString(36).slice(2, 10)

export const emptyList = () => ({ items: [] })

// Fold a graded card's misses in. Repeats of the same question count up instead of duplicating.
export function addMisses(list, { front, back, misses }, now = Date.now()) {
  const items = [...(list?.items || [])]
  for (const m of misses || []) {
    const cand = { front: String(front || ''), back: String(back || ''), question: String(m.question || ''), answer: String(m.answer || ''), expected: String(m.expected || ''), feedback: String(m.feedback || '') }
    if (!cand.question) continue
    const i = items.findIndex((x) => keyOf(x) === keyOf(cand))
    if (i >= 0) items[i] = { ...items[i], ...cand, n: (items[i].n || 1) + 1, at: now, cleared: 0 }
    else items.push({ id: newId(), ...cand, n: 1, at: now, cleared: 0 })
  }
  items.sort((a, b) => b.at - a.at)
  return { items: items.slice(0, MAX_ITEMS) }
}

// After a workout: each practiced mistake moves toward retirement on a right answer, back to zero on a wrong one.
export function applyPractice(list, outcomes, now = Date.now()) {
  const byId = new Map()
  for (const o of outcomes || []) if (o?.target) byId.set(o.target, (byId.get(o.target) ?? true) && !!o.correct)
  const items = []
  for (const m of list?.items || []) {
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
  const byNeed = (a, b) => (b.n || 1) - (a.n || 1) || b.at - a.at
  const items = [...(list?.items || [])]
  return [...items.filter((m) => !resting(m)).sort(byNeed), ...items.filter(resting).sort(byNeed)].slice(0, k)
}
