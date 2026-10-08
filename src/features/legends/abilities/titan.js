// RAID ABILITY (design v2.1): Titan, Forge Plates. Family: armor that only recall breaks, then an opening.
// He starts with K.plates plates. A CLEAN TYPED raid answer cracks one (and deals its normal damage); choices and
// glancing answers deal their normal damage and crack nothing. The last crack SHATTERS the plates: +K.shatter, and he is
// EXPOSED for the next K.window right raid answers: each deals +K.exposed. Then he forges new plates. A phase line
// re-forges cracked plates (never during an opening). Attacks and inserted questions: no effect. A glancing answer
// under Focus (a raid power) counts as clean and cracks a plate (hitClean, _rules.js).
// Why a window of answers, not "until the next phase line" (the first version): two cracks and the shatter dealt 6, a
// whole phase of a typical raid, so the shatter itself crossed the line and the opening never lasted one answer.
import { hitClean, tuned } from './_rules'
const K = { plates: 2, shatter: 2, exposed: 1, window: 3 }

export default {
  id: 'plates', icon: '🛡', K, fxKeys: ['crack', 'shatter', 'exposedHit'],
  sampleHint: { key: 'lg_hint_plates' },
  init: (ctx) => ({ plates: tuned(K, ctx).plates, exposed: false, open: 0, shatters: 0 }),
  onPhase(s, phase, ctx) { if (!s.ab.exposed) s.ab.plates = tuned(K, ctx).plates },
  onStrike(s, res, hit, ctx) {
    if (ctx.kind !== 'normal' || !ctx.right) return
    const k = tuned(K, ctx)
    if (s.ab.exposed) {
      res.dmg += k.exposed
      res.fx = 'exposedHit'
      res.fxVars = { n: k.exposed }
      s.ab.open = Math.max(0, (s.ab.open || 0) - 1)
      if (!s.ab.open) { s.ab.exposed = false; s.ab.plates = k.plates }
      return
    }
    if (!hitClean(ctx, res)) return
    s.ab.plates = Math.max(0, s.ab.plates - 1)
    if (s.ab.plates === 0) {
      res.dmg += k.shatter
      s.ab.exposed = true
      s.ab.open = k.window
      s.ab.shatters = (s.ab.shatters || 0) + 1
      res.fx = 'shatter'
      res.fxVars = { n: k.shatter }
    } else res.fx = 'crack'
  },
  // Only on a phase-1 choice, while the plates still stand: typing is what cracks them.
  hint: (s, q, mode, ctx) => (mode === 'choice' && ctx.phase === 1 && !q._attack && !q._inserted && !s.ab.exposed ? { icon: '🔨', key: 'lg_hint_plates' } : null),
  hud: (s, ctx) => {
    const k = tuned(K, ctx)
    return [
      { type: 'pips', n: s.ab.plates, max: k.plates, icon: '🛡', labelKey: 'lg_hud_plates', vars: { n: s.ab.plates }, tone: 'warning', ready: !s.ab.exposed && s.ab.plates === 1 },
      ...(s.ab.exposed ? [{ type: 'chip', icon: '🔥', key: 'lg_hud_exposed', vars: { n: k.exposed, left: s.ab.open || 0 }, tone: 'danger' }] : []),
    ]
  },
  artState: (s) => ({ 'data-ab-plates': s.ab.plates, 'data-ab-exposed': s.ab.exposed ? 1 : 0 }),
}
