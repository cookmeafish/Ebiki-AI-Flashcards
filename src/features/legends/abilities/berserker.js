// RAID ABILITY (design v2.1, #15): Berserker, All In (`allin`). Family: an opt-in gamble [DECISION].
// Before a TYPED raid answer the learner may arm the axe (a toggle). Armed + right (clean or glancing): CLEAVE, +3.
// Armed + miss: one extra heart, never the last one (waived), so a swing can never end the fight by itself. After any
// swing the axe rests for 3 raid answers. He taunts (cosmetic, a tick) after 4 raid answers without a swing.
// The toggle is hidden on choices, attacks and inserted questions (and an armed axe is ignored there). Never pressing
// it is a fine way to play: the fight is then a plain raid.
const K = { cleave: 3, extra: 1, rest: 3, taunt: 4 }
const normal = (q) => !!q && !q._attack && !q._inserted && !q._lastStand
const restOf = (s) => (s.ab && s.ab.rest) || 0
export default {
  id: 'allin', icon: '🪓', K, fxKeys: ['cleave', 'whiff', 'taunt'],
  decision: true,
  sampleHint: { vars: { n: K.cleave } },
  init: () => ({ rest: 0, idle: 0, swings: 0 }),
  actions: (s, ctx) => {
    if (!normal(ctx.q) || ctx.mode === 'choice' || restOf(s) > 0) return []
    return [{ id: 'swing', icon: '🪓', labelKey: 'lg_act_allin', toggle: true, tone: 'danger', enabled: true }]
  },
  onStrike(s, res, hit, ctx) {
    if (ctx.kind !== 'normal') return
    const armed = !!(hit.armed && hit.armed.swing) && hit.mode !== 'choice' && restOf(s) === 0
    if (armed) {
      s.ab.rest = K.rest
      s.ab.idle = 0
      s.ab.swings = (s.ab.swings || 0) + 1
      if (ctx.right) {
        res.dmg += K.cleave
        res.fx = 'cleave'
        res.fxVars = { n: res.dmg }
      } else {
        // The extra heart, unless it would take the last one.
        const left = ctx.lives - ctx.livesLost
        res.lives += Math.max(0, Math.min(K.extra, left - 1 - res.lives))
        res.fx = 'whiff'
      }
      return
    }
    if (restOf(s) > 0) s.ab.rest = restOf(s) - 1
    s.ab.idle = ((s.ab && s.ab.idle) || 0) + 1
    if (s.ab.idle >= K.taunt) { s.ab.idle = 0; if (!res.fx) res.fx = 'taunt' }
  },
  // Only while the axe is armed for this answer: what it will do.
  hint: (s, q, mode, ctx) => (normal(q) && mode !== 'choice' && ctx && ctx.armed && ctx.armed.swing && restOf(s) === 0 ? { icon: '🪓', key: 'lg_hint_allin', vars: { n: K.cleave } } : null),
  hud: (s) => [restOf(s) > 0
    ? { type: 'chip', icon: '🪓', key: 'lg_hud_allinRest', vars: { n: restOf(s) }, tone: 'ink' }
    : { type: 'chip', icon: '🪓', key: 'lg_hud_allinReady', tone: 'danger' }],
  artState: (s) => ({ 'data-ab-axe': restOf(s) > 0 ? 'rest' : 'ready' }),
}
