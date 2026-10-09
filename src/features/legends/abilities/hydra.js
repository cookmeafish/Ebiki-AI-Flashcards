// RAID ABILITY (design v2.1): Hydra, Many Heads. Family: count down, misses regrow.
// Every right answer (or a blocked attack) cuts a head. Cut all three and the stumps are burned (Cauterize) for
// K.burn, and three heads stand again. A missed raid answer grows K.grow heads back (at most K.max; at K.max nothing
// grows and no Grow plays). Nothing happens at a phase line. Inserted questions: none. A missed attack grows nothing (its 2-life cost is enough).
import { tuned } from './_rules'

const K = { base: 3, grow: 2, max: 6, burn: 2 }

export default {
  id: 'heads', icon: '🐍', K, fxKeys: ['sever', 'grow', 'cauterize'],
  sampleHint: { key: 'lg_hint_lastHead' },
  init: (ctx) => ({ heads: tuned(K, ctx).base, burns: 0 }),
  onStrike(s, res, hit, ctx) {
    if (ctx.kind === 'inserted') return
    const k = tuned(K, ctx)
    if (ctx.right) {
      // A right raid answer, or a blocked attack: one head off.
      s.ab.heads = Math.max(0, s.ab.heads - 1)
      if (s.ab.heads === 0) {
        res.dmg += k.burn
        s.ab.heads = k.base
        s.ab.burns = (s.ab.burns || 0) + 1
        res.fx = 'cauterize'
        res.fxVars = { n: k.burn }
      } else res.fx = 'sever'
    } else if (ctx.kind === 'normal') {
      // The heads that really grew (one at five heads, none at the cap): the floater and the art's sprout count them.
      const grew = Math.max(0, Math.min(k.max, s.ab.heads + k.grow) - s.ab.heads)
      if (!grew) return
      s.ab.heads += grew
      s.ab.grew = grew
      res.fx = 'grow'
      res.fxVars = { n: grew }
    }
  },
  // Only when the next right answer burns the stumps.
  hint: (s, q) => (!q._inserted && s.ab.heads === 1 ? { icon: '🔥', key: 'lg_hint_lastHead' } : null),
  hud: (s, ctx) => [{ type: 'pips', n: s.ab.heads, max: tuned(K, ctx).max, icon: '🐍', labelKey: 'lg_hud_heads', vars: { n: s.ab.heads }, tone: 'success', ready: s.ab.heads === 1 }],
  // data-ab-grew: how many slots the last Grow added (fx/hydra.jsx sprouts exactly those; read only while Grow plays).
  artState: (s) => ({ 'data-ab-heads': s.ab.heads, 'data-ab-grew': s.ab.grew || 0 }),
}
