// Saving a call's grades as reviews, through the card layer's at-most-once recordRatings. The guards live in
// localStorage per call, so a reload in the middle of saving can never answer a card twice.
import { srs } from '../../cards'
import { platform } from '../../platform'

const GUARD_KEY = 'ebiki-call-guards'
const KEEP_CALLS = 20

const readAll = () => platform.kv.getJson(GUARD_KEY, {}) || {}
const writeAll = (all) => {
  const ids = Object.keys(all).sort((a, b) => (all[b].at || 0) - (all[a].at || 0)).slice(0, KEEP_CALLS)
  platform.kv.setJson(GUARD_KEY, Object.fromEntries(ids.map((id) => [id, all[id]]))) // storage full: in-memory guards still hold
}

// ratings: [{ cardId, ease, rating, front }], preSchedule: Map cardId -> { interval, factor }
// → { recorded: [cardId], failed: [cardId] }
export async function recordCall({ callId, deck, ratings, preSchedule }) {
  const all = readAll()
  const g = all[callId] || { at: Date.now(), recorded: [], uncertain: {} }
  const save = () => { all[callId] = g; writeAll(all) }
  const todo = ratings.filter((r) => !g.recorded.includes(r.cardId))
  if (!todo.length) return { recorded: [...g.recorded], failed: [] }
  const { failed } = await srs.recordRatings({
    deck,
    ratings: todo,
    preSchedule: (id) => preSchedule?.get?.(id),
    hooks: {
      recorded: (cs) => { if (!g.recorded.includes(cs.cardId)) g.recorded.push(cs.cardId); delete g.uncertain[cs.cardId]; save() },
      markUncertain: (id, at) => { g.uncertain[id] = at; save() },
      clearUncertain: (id) => { delete g.uncertain[id]; save() },
      uncertainSince: (id) => g.uncertain[id],
      forgetUncertain: (id) => { delete g.uncertain[id]; save() },
      notOurs: () => {},
    },
  })
  srs.syncSoon()
  return { recorded: [...g.recorded], failed: (failed || []).map((cs) => cs.cardId) }
}
