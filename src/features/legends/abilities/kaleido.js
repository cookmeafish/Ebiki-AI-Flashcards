// RAID ABILITY (design v2.1, #12): Kaleido, Prism (`prism`). Family: collect a set (the card's color matters).
// Every raid question shows a facet color (a tag chip, known BEFORE answering): red, green or blue. Colors come in blocks
// of three raid questions, each block a shuffle of all three (never three of one color), picked by hashOf('blk', block),
// so a reload or a replay gives the same colors. A right answer collects its color; red, green and blue together burst
// as a PRISM for 2, and the slots empty. A right answer on a color already held (only after a miss broke a set)
// OVERCHARGES for 1. Attacks and inserted questions have no facet.
import { hashOf, tuned } from './_rules'

const K = { burst: 2, over: 1 }
const COLORS = ['red', 'green', 'blue']
const PERMS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]
const TONES = ['danger', 'success', 'info']
const ICONS = ['🔴', '🟢', '🔵']
const normal = (q) => !!q && !q._attack && !q._inserted && !q._lastStand
// The facet of the i-th raid answer (0-based): position i % 3 of its block's shuffle.
export const facetAt = (i) => PERMS[hashOf('blk', Math.floor(i / 3)) % PERMS.length][i % 3]
const haveOf = (s) => (s.ab && Array.isArray(s.ab.have) ? s.ab.have : [false, false, false])
const heldN = (s) => haveOf(s).filter(Boolean).length

export default {
  id: 'prism', icon: '🔷', K, fxKeys: ['shard', 'overcharge', 'prism'],
  sampleHint: { vars: { n: K.burst } }, // tuning-ok: static
  init: () => ({ have: [false, false, false], prisms: 0 }),
  onStrike(s, res, hit, ctx) {
    if (ctx.kind !== 'normal' || !ctx.right) return
    const k = tuned(K, ctx)
    const c = facetAt(ctx.before.answers || 0)
    const have = haveOf(s)
    if (have[c]) { res.dmg += k.over; res.fx = 'overcharge'; res.fxVars = { n: k.over, c: COLORS[c] }; return }
    const next = have.map((v, i) => v || i === c)
    if (next.every(Boolean)) {
      res.dmg += k.burst
      s.ab.have = [false, false, false]
      s.ab.prisms = (s.ab.prisms || 0) + 1
      res.fx = 'prism'
      res.fxVars = { n: k.burst }
    } else {
      s.ab.have = next
      res.fx = 'shard'
      res.fxVars = { c: COLORS[c] }
    }
  },
  // The chip in the question's corner: this question's color.
  tag: (s, q) => {
    if (!normal(q)) return null
    const c = facetAt(s.answers || 0)
    return { icon: ICONS[c], key: `lg_tag_prism_${COLORS[c]}`, tone: TONES[c] }
  },
  // Only when this color completes the set.
  hint: (s, q, mode, ctx) => {
    if (!normal(q)) return null
    const c = facetAt(s.answers || 0)
    return heldN(s) === 2 && !haveOf(s)[c] ? { icon: '🔷', key: 'lg_hint_prism', vars: { n: tuned(K, ctx).burst } } : null
  },
  // Three slots, one per color (stable order red, green, blue); the missing one pulses when two are held.
  hud: (s) => {
    const have = haveOf(s)
    const two = heldN(s) === 2
    return COLORS.map((c, i) => ({ type: 'pips', n: have[i] ? 1 : 0, max: 1, icon: ICONS[i], tone: TONES[i], ready: two && !have[i], ...(i === 2 ? { labelKey: 'lg_hud_prism' } : {}) }))
  },
  artState: (s) => ({ 'data-ab-prism': heldN(s) }),
}
