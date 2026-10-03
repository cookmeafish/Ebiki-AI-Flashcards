// Showman (The Infernal Impresario): COMEDY AND TRAGEDY (design v2.1, #26) · family: two meters, a miss is a setup.
// The two masks in his ring keep score. Every right raid answer wins a round of APPLAUSE (the comedy mask); the
// K.laughs-th round brings the house down: an ENCORE for +K.encore, and the applause starts over. Every miss sheds a
// TEAR on the tragedy mask (the miss costs its life as always); the K.tears-th tear is a PLOT TWIST: the drama turns
// in your favor, the applause jumps to one round short of an Encore and the tears dry. So a rough patch is never wasted:
// two misses set up the next Encore. Attacks and inserted questions move neither mask.
const K = { laughs: 4, encore: 3, tears: 2 }
const normal = (q) => !!q && !q._attack && !q._inserted && !q._lastStand
const ready = (s) => s.ab.laughs === K.laughs - 1

export default {
  id: 'encore', icon: '🎭', K, fxKeys: ['laugh', 'encore', 'tear', 'twist'],
  sampleHint: { key: 'lg_hint_encore', vars: { n: K.encore } },
  init: () => ({ laughs: 0, tears: 0, encores: 0, twists: 0 }),
  onStrike(s, res, hit, ctx) {
    if (ctx.kind !== 'normal') return
    if (ctx.right) {
      s.ab.laughs++
      if (s.ab.laughs >= K.laughs) {
        res.dmg += K.encore
        s.ab.laughs = 0
        s.ab.encores++
        res.fx = 'encore'
        res.fxVars = { n: K.encore }
      } else {
        res.fx = 'laugh'
        res.fxVars = { n: s.ab.laughs, m: K.laughs }
      }
      return
    }
    s.ab.tears++
    if (s.ab.tears >= K.tears) {
      s.ab.tears = 0
      s.ab.twists++
      s.ab.laughs = Math.max(s.ab.laughs, K.laughs - 1)
      res.fx = 'twist'
    } else {
      res.fx = 'tear'
      res.fxVars = { n: s.ab.tears, m: K.tears }
    }
  },
  // Only on the answer that would bring the Encore.
  hint: (s, q) => (normal(q) && ready(s) ? { icon: '👏', key: 'lg_hint_encore', vars: { n: K.encore } } : null),
  hud: (s) => [
    { type: 'pips', n: s.ab.laughs, max: K.laughs, icon: '👏', labelKey: 'lg_hud_encoreApplause', tone: 'warning', ready: ready(s) },
    { type: 'pips', n: s.ab.tears, max: K.tears, icon: '💧', labelKey: 'lg_hud_encoreTwist', tone: 'info', ready: s.ab.tears === K.tears - 1 },
  ],
  // The masks on his arch: the comedy mask lights up gold when an Encore is one answer away, the tragedy mask weeps
  // after a first miss (the next one is the Plot Twist).
  artState: (s) => ({ 'data-ab-comedy': ready(s) ? 1 : 0, 'data-ab-tragedy': s.ab.tears }),
}
