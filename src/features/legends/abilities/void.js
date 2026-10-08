// RAID ABILITY (design v2.1): Void, Event Horizon. Family: your damage is held, then released bigger.
// A right raid answer's damage falls into its disk (the bar does not move; a ghost segment shows it). The third banked
// strike COLLAPSES the disk for floor(bank x K.mult). A miss spills the disk at x1 (nothing lost, no bonus). The disk
// never holds a winning blow: it collapses at once when that total would end the fight. When the questions run out,
// settle collapses what is left. Attacks and inserted questions deal their damage at once (never banked).
import { tuned } from './_rules'

const K = { every: 3, mult: 1.5 }
const payout = (bank, k) => Math.floor(bank * k.mult)

export default {
  id: 'horizon', icon: '🕳', K, fxKeys: ['absorb', 'spill', 'collapse'],
  init: () => ({ bank: 0, banked: 0, collapses: 0 }),
  onStrike(s, res, hit, ctx) {
    if (ctx.kind !== 'normal') return
    const ab = s.ab
    const k = tuned(K, ctx)
    if (ctx.right) {
      ab.bank += res.dmg
      ab.banked += 1
      res.dmg = 0
      if (ab.banked >= k.every || s.damage + payout(ab.bank, k) >= ctx.need) {
        res.dmg = payout(ab.bank, k)
        res.fx = 'collapse'
        res.fxVars = { n: res.dmg }
        ab.bank = 0; ab.banked = 0; ab.collapses = (ab.collapses || 0) + 1
      } else {
        res.fx = 'absorb'
        res.fxVars = { n: ab.bank }
      }
    } else if (ab.bank > 0) {
      res.dmg += ab.bank
      res.fx = 'spill'
      res.fxVars = { n: ab.bank }
      ab.bank = 0; ab.banked = 0
    }
  },
  settle(s, res, ctx) {
    if (!(s.ab.bank > 0)) return
    res.dmg = payout(s.ab.bank, tuned(K, ctx))
    res.fx = 'collapse'
    res.fxVars = { n: res.dmg }
    s.ab.bank = 0; s.ab.banked = 0; s.ab.collapses = (s.ab.collapses || 0) + 1
  },
  hud: (s, ctx) => { const k = tuned(K, ctx); return [{ type: 'pips', n: s.ab.banked, max: k.every, icon: '🌀', labelKey: 'lg_hud_horizon', vars: { n: s.ab.bank }, tone: 'purple', ready: s.ab.banked === k.every - 1 }] },
  // The banked damage as a ghost on the bar, from the health left down to what the collapse would leave.
  barMarks: (s, ctx) => {
    if (!(s.ab.bank > 0)) return []
    const left = Math.max(0, ctx.need - ctx.damage)
    return [{ type: 'ghost', at: left, to: Math.max(0, left - payout(s.ab.bank, tuned(K, ctx))), tone: 'purple' }]
  },
  artState: (s) => ({ 'data-ab-disk': s.ab.banked }),
}
