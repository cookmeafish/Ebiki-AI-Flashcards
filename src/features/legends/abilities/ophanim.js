// Ophanim (The Wheel of Eyes): GRACE OF THE WHEEL (design v2.1, #23) · family: the only boss that gives hearts back.
// Its open eyes are K.perPhase x phase (2, 4, 6, as the wheel unfolds). A right raid answer lights one, a miss darkens
// one (never below 0). All lit: GRACE gives a lost heart back (at most once per phase), else a HOLY BEAM deals
// phase + K.beam (2, 3, 4); then the eyes go dark again. At a phase line the lit eyes carry over and the target grows.
// Attacks and inserted questions light none.
const K = { perPhase: 2, beam: 1 }
const normal = (q) => !!q && !q._attack && !q._inserted && !q._lastStand
const target = (phase) => K.perPhase * Math.max(1, Math.min(3, phase || 1))
const graceReady = (s, ctx) => (ctx.livesLost != null ? ctx.livesLost : (ctx.lives || 0) - (ctx.livesLeft || 0)) > 0 && s.ab.gracedPhase < ctx.phase

export default {
  id: 'grace', icon: '👁', K, fxKeys: ['open', 'blink', 'beam', 'grace'],
  sampleHint: { key: 'lg_hint_graceBeam', vars: { n: 2 } },
  init: () => ({ lit: 0, gracedPhase: 0, beams: 0, graces: 0 }),
  onStrike(s, res, hit, ctx) {
    if (ctx.kind !== 'normal') return
    if (!ctx.right) {
      if (s.ab.lit > 0) { s.ab.lit--; res.fx = 'blink' }
      return
    }
    s.ab.lit++
    if (s.ab.lit < target(ctx.phase)) {
      res.fx = 'open'
      res.fxVars = { n: s.ab.lit, m: target(ctx.phase) }
      return
    }
    s.ab.lit = 0
    if (ctx.livesLost > 0 && s.ab.gracedPhase < ctx.phase) {
      res.heal = 1
      s.ab.gracedPhase = ctx.phase
      s.ab.graces++
      res.fx = 'grace'
    } else {
      res.dmg += ctx.phase + K.beam
      s.ab.beams++
      res.fx = 'beam'
      res.fxVars = { n: ctx.phase + K.beam }
    }
  },
  // Only when the next right answer lights the last eye.
  hint(s, q, mode, ctx) {
    if (!normal(q) || s.ab.lit !== target(ctx.phase) - 1) return null
    return graceReady(s, ctx) ? { icon: '💛', key: 'lg_hint_graceHeart' } : { icon: '👁', key: 'lg_hint_graceBeam', vars: { n: ctx.phase + K.beam } }
  },
  hud: (s, ctx) => {
    const m = target(ctx.phase)
    return [{ type: 'pips', n: Math.min(s.ab.lit, m), max: m, icon: '👁', labelKey: 'lg_hud_grace', tone: 'warning', ready: s.ab.lit === m - 1 }]
  },
  artState: (s) => ({ 'data-ab-lit': Math.max(0, Math.min(6, s.ab.lit)) }),
}
