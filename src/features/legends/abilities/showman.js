// Showman (The Infernal Impresario): COMEDY AND TRAGEDY (design v2.1, #26) · family: two meters, a miss is a setup.
// The two masks in his ring keep score. Every right raid answer wins a round of APPLAUSE (the comedy mask); the
// K.laughs-th round brings the house down: an ENCORE for +K.encore, and the applause starts over. Every miss sheds a
// TEAR on the tragedy mask (the miss costs its life as always); the K.tears-th tear is a PLOT TWIST: the drama turns
// in your favor, the applause jumps to one round short of an Encore and the tears dry. So a rough patch is never wasted:
// two misses set up the next Encore. Attacks and inserted questions move neither mask.
import { tuned } from './_rules'

const K = { laughs: 4, encore: 3, tears: 2 }
const normal = (q) => !!q && !q._attack && !q._inserted && !q._lastStand
const ready = (s, k) => s.ab.laughs === k.laughs - 1

export default {
  id: 'encore', icon: '🎭', K, fxKeys: ['laugh', 'encore', 'tear', 'twist'],
  sampleHint: { key: 'lg_hint_encore', vars: { n: K.encore } }, // tuning-ok: static
  init: () => ({ laughs: 0, tears: 0, encores: 0, twists: 0 }),
  onStrike(s, res, hit, ctx) {
    if (ctx.kind !== 'normal') return
    const k = tuned(K, ctx)
    if (ctx.right) {
      s.ab.laughs++
      if (s.ab.laughs >= k.laughs) {
        res.dmg += k.encore
        s.ab.laughs = 0
        s.ab.encores++
        res.fx = 'encore'
        res.fxVars = { n: k.encore }
      } else {
        res.fx = 'laugh'
        res.fxVars = { n: s.ab.laughs, m: k.laughs }
      }
      return
    }
    s.ab.tears++
    if (s.ab.tears >= k.tears) {
      s.ab.tears = 0
      s.ab.twists++
      s.ab.laughs = Math.max(s.ab.laughs, k.laughs - 1)
      res.fx = 'twist'
    } else {
      res.fx = 'tear'
      res.fxVars = { n: s.ab.tears, m: k.tears }
    }
  },
  // Only on the answer that would bring the Encore.
  hint: (s, q, mode, ctx) => { const k = tuned(K, ctx); return normal(q) && ready(s, k) ? { icon: '👏', key: 'lg_hint_encore', vars: { n: k.encore } } : null },
  hud: (s, ctx) => {
    const k = tuned(K, ctx)
    return [
      { type: 'pips', n: s.ab.laughs, max: k.laughs, icon: '👏', labelKey: 'lg_hud_encoreApplause', tone: 'warning', ready: ready(s, k) },
      { type: 'pips', n: s.ab.tears, max: k.tears, icon: '💧', labelKey: 'lg_hud_encoreTwist', tone: 'info', ready: s.ab.tears === k.tears - 1 },
    ]
  },
  // The masks on his arch: the comedy mask lights up gold when an Encore is one answer away, the tragedy mask weeps
  // after a first miss (the next one is the Plot Twist).
  artState: (s, ctx) => ({ 'data-ab-comedy': ready(s, tuned(K, ctx)) ? 1 : 0, 'data-ab-tragedy': s.ab.tears }),
}
