// Saving grades as real reviews in the card store, through the card layer's at-most-once recordRatings (Anki's own
// reviewer; see src/cards). Used by every feature that counts as a review session (Ebi Call, Legends raids). The
// guards live in local storage per run (`guardKey` + `runId`), so a reload in the middle of saving can never answer
// a card twice.
import { srs } from '../../cards'
import { platform } from '../../platform'

const KEEP_RUNS = 20

// ratings: [{ cardId, ease, rating, front }], preSchedule: Map cardId -> { interval, factor }
// → { recorded: [cardId], failed: [cardId] }
export async function recordReviews({ guardKey, runId, deck, ratings, preSchedule }) {
  const readAll = () => platform.kv.getJson(guardKey, {}) || {}
  const writeAll = (all) => {
    const ids = Object.keys(all).sort((a, b) => (all[b].at || 0) - (all[a].at || 0)).slice(0, KEEP_RUNS)
    platform.kv.setJson(guardKey, Object.fromEntries(ids.map((id) => [id, all[id]]))) // storage full: in-memory guards still hold
  }
  const all = readAll()
  const g = all[runId] || { at: Date.now(), recorded: [], uncertain: {} }
  const save = () => { all[runId] = g; writeAll(all) }
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
