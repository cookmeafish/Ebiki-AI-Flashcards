// RAID ABILITY (design v2.1, #10). Motif: vampire. Blood Wards: streaks become shields that strike back.
// `streak` counts right raid answers in a row (a missed raid answer resets it; attacks and inserted questions leave it
// alone). At K.streak: a blood WARD (max K.max), and the streak starts over; with K.max wards already held, the streak
// FEASTS for K.feast instead (a ward up, three more in a row). When an answer would cost hearts, a ward takes ONE of them and BURSTS for K.burst (a
// missed attack's 2 hearts become 1). The burst lands even on a miss (the miss itself still deals nothing). Wards do
// not carry to the next attempt.
// K.max 1 (was 2): a Feast needed nine right answers in three clean streaks with no ward spent, about 1 raid in 25.
import { tuned } from './_rules'

const K = { streak: 3, max: 1, burst: 2, feast: 3 }

export default {
  id: 'wards', icon: '🩸', K, fxKeys: ['drip', 'ward', 'burst', 'feast'],
  init: () => ({ wards: 0, streak: 0, raised: 0, bursts: 0, feasts: 0 }),
  onStrike(s, res, hit, ctx) {
    if (ctx.kind !== 'normal') return
    const k = tuned(K, ctx)
    if (!ctx.right) { s.ab.streak = 0; return }
    s.ab.streak++
    if (s.ab.streak < k.streak) { res.fx = 'drip'; return }
    s.ab.streak = 0
    if (s.ab.wards < k.max) { s.ab.wards++; s.ab.raised++; res.fx = 'ward' } else { res.dmg += k.feast; s.ab.feasts++; res.fx = 'feast' }
  },
  onLifeLoss(s, res, ctx) {
    if (!(s.ab.wards > 0) || !(res.lives > 0)) return
    s.ab.wards--
    s.ab.bursts++
    res.lives -= 1
    res.dmg += tuned(K, ctx).burst
    res.fx = 'burst'
  },
  hud: (s, ctx) => {
    const k = tuned(K, ctx)
    return [
      { type: 'pips', n: s.ab.wards, max: k.max, icon: '🛡️', labelKey: 'lg_hud_wards', tone: 'danger' },
      { type: 'pips', n: s.ab.streak, max: k.streak, icon: '🩸', labelKey: 'lg_hud_bloodStreak', tone: 'danger', ready: s.ab.streak === k.streak - 1 },
    ]
  },
  artState: (s) => ({ 'data-ab-wards': s.ab.wards }),
}
