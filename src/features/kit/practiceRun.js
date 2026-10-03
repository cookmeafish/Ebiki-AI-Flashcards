// Settling a quiz-style practice run ONCE, whether it finished, was quit midway (QuizRunner's onExit hands back the
// answers so far) or the screen closed under it (unmount): what was answered still reaches the Mistake Gym and the
// practice log, under the mode the run STARTED in. Only a finished run counts as PRACTICE_DONE (its XP and level
// nudge). Pure: returns the events to emit; the caller emits them.
import { EVENTS } from '../events'
import { missesFromResults } from './grade'

// run = { source, modeId, front?, settled } (mutable: `settled` is set here). results = [{ question, correct, answer }].
// Returns { events: [[name, payload]], targets: [the items the answered questions practiced] } or null (nothing to do).
export function settlePracticeRun(run, results, { done = false } = {}) {
  if (!run || run.settled) return null
  const list = (Array.isArray(results) ? results : []).filter((r) => r && r.question && typeof r.question === 'object' && !r.question._retry)
  if (!list.length) return null
  run.settled = true
  const events = []
  if (done) events.push([EVENTS.PRACTICE_DONE, { source: run.source, mode: run.modeId, total: list.length, correct: list.filter((r) => r.correct).length }])
  const misses = missesFromResults(list, run.front || '')
  if (misses.length) events.push([EVENTS.PRACTICE_MISSED, { source: run.source, mode: run.modeId, misses }])
  const targets = [...new Set(list.map((r) => String(r.question.target || '').trim()).filter(Boolean))]
  return { events, targets }
}
