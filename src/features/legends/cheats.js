// Cheat mode (hidden, for testing Legends): pure map changes that skip the rules. Statuses are still derived by
// normalizeMap from what is DONE, so every cheat edits "done" and lets the map work out the rest. None of these pay
// rewards (they emit nothing); only "Win now" inside a step goes through the normal finish.
import { normalizeMap, areaIndex } from './map'

const withArea = (map, areaId, fn, now = Date.now()) => {
  const i = areaIndex(map, areaId)
  if (i < 0) return map
  return normalizeMap({ ...map, areas: map.areas.map((a, k) => (k === i ? fn(a) : a)), updatedAt: now })
}
const doneNode = (n) => ({ ...n, status: 'done', stars: 3, bestScore: 1, attempts: (n.attempts || 0) + 1 })
const freshNode = (n) => ({ ...n, status: 'open', stars: 0, bestScore: 0, attempts: 0 })

// One step done with 3 stars, locked or not; the boss finishes its area.
export function cheatCompleteNode(map, areaId, nodeId, now) {
  return withArea(map, areaId, (a) => {
    const nodes = (a.nodes || []).map((n) => (n.id === nodeId ? doneNode(n) : n))
    const boss = nodes.find((n) => n.id === nodeId)?.kind === 'boss'
    return { ...a, nodes, frozen: true, status: boss ? 'done' : a.status }
  }, now)
}

// A whole area done (every step, boss included). An area with no steps yet is simply marked done.
export function cheatCompleteArea(map, areaId, now) {
  return withArea(map, areaId, (a) => ({ ...a, nodes: (a.nodes || []).map((n) => (n.optional ? n : doneNode(n))), frozen: true, status: 'done' }), now)
}

// Every area before this one done, so this one opens.
export function cheatUnlockTo(map, areaId, now) {
  const i = areaIndex(map, areaId)
  let m = map
  for (const a of map.areas.slice(0, Math.max(0, i))) if (a.status !== 'done') m = cheatCompleteArea(m, a.id, now)
  return m
}

// One step back to "not done" (its stars and tries forgotten).
export function cheatResetNode(map, areaId, nodeId, now) {
  return withArea(map, areaId, (a) => {
    const nodes = (a.nodes || []).map((n) => (n.id === nodeId ? freshNode(n) : n))
    const boss = nodes.find((n) => n.id === nodeId)?.kind === 'boss'
    return { ...a, nodes, status: boss && a.status === 'done' ? 'open' : a.status }
  }, now)
}

// An area back to untouched: steps not done, item history forgotten, no longer frozen (so it can be edited again).
export function cheatResetArea(map, areaId, now) {
  return withArea(map, areaId, (a) => ({
    ...a, status: 'open', frozen: false, bonusLife: false, legendary: false, storySeen: false, chestOpened: false, nemesis: null, nodes: (a.nodes || []).map(freshNode),
    items: (a.items || []).map(({ seen, right, ...it }) => it),
  }), now)
}

// An area's content thrown away, so it is written again (by the lookahead, or by "Generate now").
export function cheatClearArea(map, areaId, now) {
  return withArea(map, areaId, (a) => ({ ...a, status: 'open', frozen: false, detailed: false, items: [], nodes: [], bossName: '', bonusLife: false, legendary: false, story: undefined, canDo: undefined, bonus: undefined, storySeen: false, chestOpened: false, nemesis: null }), now)
}
