// WHICH HEART A BLOW TAKES (pure, tested by heartTargets.test.js). The boss's attack flies to the exact heart it takes
// (impact/AssaultFx.jsx, BossArena.jsx), then the next one, and so on: the row empties from its END, one heart at a
// time. Two rows of hearts can show: the fight's own hearts (`red`, BossArena's Lives, `data-heart={i}`) and Steadfast's
// gold extra hearts (`gold`, PowerFx.jsx SteadfastHearts, `data-heart-gold={i}`, drawn after the red row). Steadfast's
// hearts are lost FIRST (RaidRun), so the whole row empties right to left: the gold ones from their end, then the red
// ones from theirs. A refund (fight.js applyRefund) gives back the most recently lost heart first: a red one (RaidRun's
// shown hearts are the fight's losses beyond the gold ones), then a gold one.
//
// A heart is { gold: boolean, i: index in its row }. `red`/`gold` = hearts still full in each row.

// The hearts that changed between two renders of the row. `took` = the lives the strike cost (last.lives); `refund` =
// the strike was a refund (last.kind === 'refund').
//   lost:   the hearts that just went, in the order they went (the first is where the attack lands first)
//   gained: the hearts that just came back, in the order they came back
//   aim:    where the boss's attack flies: the lost hearts, or, when the strike took a heart but the row shows no loss
//           (an ability healed it back in the same strike), the heart next in line, so the attack still lands on one
export function heartChange(before, after, { took = 0, refund = false } = {}) {
  const b = shape(before), a = shape(after)
  const lost = [], gained = []
  if (took > 0) {
    for (let i = b.gold - 1; i >= a.gold; i--) lost.push({ gold: true, i })
    for (let i = b.red - 1; i >= a.red; i--) lost.push({ gold: false, i })
  }
  if (refund) {
    for (let i = b.red; i < a.red; i++) gained.push({ gold: false, i })
    for (let i = b.gold; i < a.gold; i++) gained.push({ gold: true, i })
  }
  const aim = took > 0 ? (lost.length ? lost.slice(0, Math.max(1, took)) : [nextHeart(a)]) : []
  return { lost, gained, aim }
}

// The heart a blow would take next: the last full gold heart, else the last full red one (the first one when the row
// is empty: something to aim at).
export function nextHeart(hearts) {
  const h = shape(hearts)
  if (h.gold > 0) return { gold: true, i: h.gold - 1 }
  return { gold: false, i: Math.max(0, h.red - 1) }
}

// The CSS selector of a heart in the arena.
export const heartSelector = (h) => (h.gold ? `[data-heart-gold="${h.i}"]` : `[data-heart="${h.i}"]`)

const shape = (h) => ({ red: Math.max(0, Math.floor(Number(h?.red) || 0)), gold: Math.max(0, Math.floor(Number(h?.gold) || 0)) })

// ── THE ASSET VIEW'S DEMO HEARTS (AssetView.jsx PhaseDemo): a real count, so pressing the boss's attack walks along the
// row heart by heart. { total: the boss's hearts, lost: red hearts gone, goldOf: Steadfast's gold hearts brought (0 =
// none), gold: gold hearts still full }. Nothing here touches a stored raid or Anki.
export const demoHearts = (total, goldOf = 0) => ({ total: Math.max(1, total | 0), lost: 0, goldOf: Math.max(0, goldOf | 0), gold: Math.max(0, goldOf | 0) })
export const demoHeartsLeft = (h) => Math.max(0, h.total - h.lost) + h.gold
// A blow that costs `lives` (1, or 2 for a heavy one): gold first, then red, never below empty. → { hearts, took }.
export function demoBlow(h, lives = 1) {
  const want = Math.max(0, lives | 0)
  const fromGold = Math.min(h.gold, want)
  const fromRed = Math.min(want - fromGold, h.total - h.lost)
  return { hearts: { ...h, gold: h.gold - fromGold, lost: h.lost + fromRed }, took: fromGold + fromRed }
}
// One heart back, like a refund: the most recently lost first (red, then gold). → { hearts, healed } (0 = all full).
export function demoGain(h) {
  if (h.lost > 0) return { hearts: { ...h, lost: h.lost - 1 }, healed: 1 }
  if (h.gold < h.goldOf) return { hearts: { ...h, gold: h.gold + 1 }, healed: 1 }
  return { hearts: h, healed: 0 }
}
// Every heart full again (gold too).
export const demoHeartsFull = (h) => ({ ...h, lost: 0, gold: h.goldOf })
// Steadfast switched on (n gold hearts, all full) or off (0).
export const demoSteadfast = (h, n) => ({ ...h, goldOf: Math.max(0, n | 0), gold: Math.max(0, n | 0) })
