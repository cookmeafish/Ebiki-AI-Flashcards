// RAID ABILITY (design v2.1): Hydra, Many Heads. Family: count down, misses regrow.
// Every right answer (or a blocked attack) cuts a head. Cut all three and the stumps are burned (Cauterize) for
// K.burn, and three heads stand again. A missed raid answer grows K.grow heads back (at most K.max; at K.max nothing
// grows and no Grow plays). Nothing happens at a phase line. Inserted questions: none. A missed attack grows nothing (its 2-life cost is enough).
// THE ART (raids/hydra.svg) has six fixed neck slots filled in order (1 king, 2 and 3 the inner pair, 4 the low front
// head, 5 and 6 the outer pair): data-ab-heads of them stand, and a slot cut since the last burn shows its STUMP. The
// count alone cannot tell a cut fifth head from one that never grew, so the state also keeps `top`, the most heads
// standing since the last Cauterize (stumps = slots heads+1..top). A state saved without it reads as top = max(heads, base).
import { tuned } from './_rules'

const K = { base: 3, grow: 2, max: 6, burn: 2 }

// The most heads since the last burn (older saved states have no `top`).
// tuning-ok: the default 3 is K.base, for a state read with no fight ctx (artState)
export const topOf = (ab, base = 3) => Math.max(ab.heads || 0, Number.isFinite(ab.top) ? ab.top : base)

export default {
  id: 'heads', icon: '🐍', K, fxKeys: ['sever', 'grow', 'cauterize'],
  sampleHint: { key: 'lg_hint_lastHead' },
  init: (ctx) => ({ heads: tuned(K, ctx).base, top: tuned(K, ctx).base, burns: 0 }),
  onStrike(s, res, hit, ctx) {
    if (ctx.kind === 'inserted') return
    const k = tuned(K, ctx)
    if (ctx.right) {
      // A right raid answer, or a blocked attack: one head off (its stump stays, up to `top`).
      s.ab.top = topOf(s.ab, k.base)
      s.ab.heads = Math.max(0, s.ab.heads - 1)
      if (s.ab.heads === 0) {
        // the burn: every stump (slots 2..top) is seared shut, three heads stand again
        res.dmg += k.burn
        s.ab.burnt = s.ab.top
        s.ab.heads = k.base
        s.ab.top = k.base
        s.ab.burns = (s.ab.burns || 0) + 1
        res.fx = 'cauterize'
        res.fxVars = { n: k.burn }
      } else res.fx = 'sever'
    } else if (ctx.kind === 'normal') {
      // The heads that really grew (one at five heads, none at the cap): the floater and the art's sprout count them.
      const grew = Math.max(0, Math.min(k.max, s.ab.heads + k.grow) - s.ab.heads)
      if (!grew) return
      const top = topOf(s.ab, k.base)
      // how many of the grown slots burst out of a stump (the rest grow where no head stood since the burn)
      s.ab.regrew = Math.max(0, Math.min(grew, top - s.ab.heads))
      s.ab.heads += grew
      s.ab.top = Math.max(top, s.ab.heads)
      s.ab.grew = grew
      res.fx = 'grow'
      res.fxVars = { n: grew }
    }
  },
  // Only when the next right answer burns the stumps.
  hint: (s, q) => (!q._inserted && s.ab.heads === 1 ? { icon: '🔥', key: 'lg_hint_lastHead' } : null),
  hud: (s, ctx) => [{ type: 'pips', n: s.ab.heads, max: tuned(K, ctx).max, icon: '🐍', labelKey: 'lg_hud_heads', vars: { n: s.ab.heads }, tone: 'success', ready: s.ab.heads === 1 }],
  // data-ab-heads: the heads standing; data-ab-top: stumps stand on slots heads+1..top. Read only while their moment
  // plays or is pending (fx/hydra.jsx): data-ab-grew (slots the last Grow added), data-ab-regrew (how many of them
  // came out of a stump), data-ab-burnt (the top a Cauterize burned: its stumps 2..burnt flare away).
  artState: (s) => ({ 'data-ab-heads': s.ab.heads, 'data-ab-top': topOf(s.ab), 'data-ab-grew': s.ab.grew || 0, 'data-ab-regrew': s.ab.regrew || 0, 'data-ab-burnt': s.ab.burnt || 0 }),
}
