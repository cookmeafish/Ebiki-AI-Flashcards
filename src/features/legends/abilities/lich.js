// RAID ABILITY (design v2.1): Lich, Raise Dead. Family: inserted re-asks of cards you KNEW.
// A candle burns down by one for every raid answer (K.every: 3; with 4 a typical raid raised about one minion, and an
// escape happened in fewer than 1 raid in 5). When it is out, the Lich raises the EARLIEST card answered right
// this attempt (never one already raised, never the card just answered) as a skeleton: it is asked next, typed,
// `_inserted: 'minion'`, never recorded in Anki. Destroy it (right) = Bone Burst +K.burst. Let it escape (missed) =
// he heals K.heal (floored at this attempt's start by strike), no heart lost, no attack. At most K.max minions per
// attempt, inside the shared MAX_INSERTED budget. With no card to raise yet the candle stays out and he tries again
// after the next answer. The fight ending on the answer that would raise: no minion.
import { tuned, rulesOf } from './_rules'

const K = { every: 3, max: 3, burst: 3, heal: 2 }
const same = (a, b) => String(a) === String(b)

export default {
  id: 'minions', icon: '💀', K, fxKeys: ['raise', 'burst', 'escape'],
  init: (ctx) => ({ raiseIn: tuned(K, ctx).every, raised: [], rightKeys: [], minions: 0, bursts: 0, escapes: 0, pending: null }),
  onStrike(s, res, hit, ctx) {
    s.ab.pending = null
    const k = tuned(K, ctx)
    if (ctx.inserted === 'minion') {
      if (ctx.right) { res.dmg += k.burst; s.ab.bursts = (s.ab.bursts || 0) + 1; res.fx = 'burst'; res.fxVars = { n: k.burst } }
      else { res.lives = 0; res.gorge = k.heal; s.ab.escapes = (s.ab.escapes || 0) + 1; res.fx = 'escape'; res.fxVars = { n: k.heal } }
      return
    }
    if (ctx.kind !== 'normal') return
    if (ctx.right && hit.key != null && !s.ab.rightKeys.some((x) => same(x, hit.key))) s.ab.rightKeys = [...s.ab.rightKeys, String(hit.key)]
    if (s.ab.minions >= k.max) return
    s.ab.raiseIn = Math.max(0, s.ab.raiseIn - 1)
    if (s.ab.raiseIn > 0) return
    // The same budget raidStep applies (afterStrike reads it again as info.room), and no raise on a final answer.
    const room = rulesOf(s).maxInserted - (s.insertedN || 0)
    const over = s.damage + res.dmg >= ctx.need || s.livesLost + res.lives >= ctx.lives
    if (room <= 0 || over) return
    const pick = s.ab.rightKeys.find((x) => !s.ab.raised.some((r) => same(r, x)) && !(hit.key != null && same(x, hit.key)))
    if (pick == null) return
    s.ab.pending = pick
    res.fx = res.fx || 'raise'
  },
  afterStrike(next, info) {
    const { over, room } = info
    const key = next.ab && next.ab.pending
    if (key == null) return null
    // Recorded only when the minion really goes in.
    if (over || !room) return { ab: { pending: null } }
    return { insert: [{ key, kind: 'minion' }], at: 1, ab: { pending: null, raised: [...next.ab.raised, key], minions: next.ab.minions + 1, raiseIn: tuned(K, info).every } }
  },
  cancelHeal(s) { if (s.ab) s.ab.escapes = Math.max(0, (s.ab.escapes || 0) - 1) },
  banner: (s, q) => (q._inserted === 'minion' ? { icon: '💀', key: 'lg_minionQ', tone: 'purple' } : null),
  hud: (s, ctx) => {
    const k = tuned(K, ctx)
    return [
      { type: 'pips', n: s.ab.minions >= k.max ? 0 : s.ab.raiseIn, max: k.every, icon: '🕯', labelKey: 'lg_hud_minions', vars: { n: s.ab.raiseIn }, tone: 'success', ready: s.ab.minions < k.max && s.ab.raiseIn <= 1 },
      { type: 'pips', n: s.ab.bursts || 0, max: k.max, icon: '💀', labelKey: 'lg_hud_bursts', vars: { n: s.ab.bursts || 0 }, tone: 'purple' },
    ]
  },
}
