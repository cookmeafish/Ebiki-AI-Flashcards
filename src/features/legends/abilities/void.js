// RAID ABILITY (design v2.1): Void, Event Horizon. Family: your damage is held, then released bigger.
// A right raid answer's damage falls into its disk (the bar does not move; a ghost segment shows it). The third banked
// strike COLLAPSES the disk for floor(bank x K.mult). A miss spills the disk at x1 (nothing lost, no bonus). The disk
// never holds a winning blow: it collapses at once when that total would end the fight. When the questions run out,
// settle collapses what is left. Attacks and inserted questions deal their damage at once (never banked).
const K = { every: 3, mult: 1.5 }
const payout = (bank) => Math.floor(bank * K.mult)

export default {
  id: 'horizon', icon: '🕳', K, fxKeys: ['absorb', 'spill', 'collapse'],
  init: () => ({ bank: 0, banked: 0, collapses: 0 }),
  onStrike(s, res, hit, ctx) {
    if (ctx.kind !== 'normal') return
    const ab = s.ab
    if (ctx.right) {
      ab.bank += res.dmg
      ab.banked += 1
      res.dmg = 0
      if (ab.banked >= K.every || s.damage + payout(ab.bank) >= ctx.need) {
        res.dmg = payout(ab.bank)
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
  settle(s, res) {
    if (!(s.ab.bank > 0)) return
    res.dmg = payout(s.ab.bank)
    res.fx = 'collapse'
    res.fxVars = { n: res.dmg }
    s.ab.bank = 0; s.ab.banked = 0; s.ab.collapses = (s.ab.collapses || 0) + 1
  },
  hud: (s) => [{ type: 'pips', n: s.ab.banked, max: K.every, icon: '🌀', labelKey: 'lg_hud_horizon', vars: { n: s.ab.bank }, tone: 'purple', ready: s.ab.banked === K.every - 1 }],
  // The banked damage as a ghost on the bar, from the health left down to what the collapse would leave.
  barMarks: (s, ctx) => {
    if (!(s.ab.bank > 0)) return []
    const left = Math.max(0, ctx.need - ctx.damage)
    return [{ type: 'ghost', at: left, to: Math.max(0, left - payout(s.ab.bank)), tone: 'purple' }]
  },
  artState: (s) => ({ 'data-ab-disk': s.ab.banked }),
}
