// RAID ABILITY (design v2.1): Hydra, Many Heads. Family: count down, misses regrow.
// Every right answer (or a blocked attack) cuts a head. Cut all three and the stumps are burned (Cauterize) for
// K.burn, and three heads stand again. A missed raid answer grows K.grow heads back (at most K.max). Nothing happens
// at a phase line. Inserted questions: none. A missed attack grows nothing (its 2-life cost is enough).
const K = { base: 3, grow: 2, max: 6, burn: 2 }

export default {
  id: 'heads', icon: '🐍', K, fxKeys: ['sever', 'grow', 'cauterize'],
  sampleHint: { key: 'lg_hint_lastHead' },
  init: () => ({ heads: K.base, burns: 0 }),
  onStrike(s, res, hit, ctx) {
    if (ctx.kind === 'inserted') return
    if (ctx.right) {
      // A right raid answer, or a blocked attack: one head off.
      s.ab.heads = Math.max(0, s.ab.heads - 1)
      if (s.ab.heads === 0) {
        res.dmg += K.burn
        s.ab.heads = K.base
        s.ab.burns = (s.ab.burns || 0) + 1
        res.fx = 'cauterize'
        res.fxVars = { n: K.burn }
      } else res.fx = 'sever'
    } else if (ctx.kind === 'normal') {
      s.ab.heads = Math.min(K.max, s.ab.heads + K.grow)
      res.fx = 'grow'
      res.fxVars = { n: K.grow }
    }
  },
  // Only when the next right answer burns the stumps.
  hint: (s, q) => (!q._inserted && s.ab.heads === 1 ? { icon: '🔥', key: 'lg_hint_lastHead' } : null),
  hud: (s) => [{ type: 'pips', n: s.ab.heads, max: K.max, icon: '🐍', labelKey: 'lg_hud_heads', vars: { n: s.ab.heads }, tone: 'success', ready: s.ab.heads === 1 }],
  artState: (s) => ({ 'data-ab-heads': s.ab.heads }),
}
