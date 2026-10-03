// RAID ABILITY v2.1: Gorgon (Stone Gorgon), Mirror Shield (`mirror`). design-v2.md section 17.
// Every K.every-th raid question (every K.every3-th in phase 3) is her GAZE, marked before you answer (tag chip). Answer
// it right to reflect it: +K.reflect typed, +K.half by choice. Missed, it is a plain miss (the card still returns as an
// attack) and the gaze recharges. Attacks and inserted questions neither charge nor gaze. Nothing is ever taken off a
// later right answer. The hook contract is abilities/_contract.js.
const K = { every: 4, every3: 3, reflect: 3, half: 2 }
const normal = (q) => !!q && !q._attack && !q._inserted && !q._lastStand
const needOf = (phase) => (phase >= 3 ? K.every3 : K.every)
// Is the NEXT raid question her gaze?
const gazeNext = (s, ctx) => (s.ab.charge || 0) + 1 >= needOf(ctx.phase || 1)

export default {
  id: 'mirror', icon: '🪞', K, fxKeys: ['charge', 'reflect', 'stoned'],
  sampleHint: { key: 'lg_hint_mirror', vars: { n: K.reflect } },
  init: () => ({ charge: 0, reflects: 0 }),
  onStrike(s, res, hit, ctx) {
    if (ctx.kind !== 'normal') return
    const ab = s.ab
    ab.charge++
    if (ab.charge < needOf(ctx.phase)) { res.fx = 'charge'; return }
    ab.charge = 0
    if (ctx.right) {
      const n = hit.mode === 'choice' ? K.half : K.reflect
      res.dmg += n
      ab.reflects++
      res.fx = 'reflect'
    } else {
      res.fx = 'stoned'
    }
  },
  // The gaze question carries a tag chip; the hint says what a right answer does with it (typed or by choice).
  tag: (s, q, ctx) => (normal(q) && gazeNext(s, ctx) ? { icon: '👁', key: 'lg_tag_mirror', tone: 'success' } : null),
  hint: (s, q, mode, ctx) => (normal(q) && gazeNext(s, ctx) ? { icon: '🪞', key: 'lg_hint_mirror', vars: { n: mode === 'choice' ? K.half : K.reflect } } : null),
  hud: (s, ctx) => {
    const max = needOf(ctx.phase || 1)
    const n = Math.min(max, s.ab.charge || 0)
    return [{ type: 'pips', n, max, labelKey: 'lg_hud_mirror', tone: 'success', ready: n === max - 1 }]
  },
  // Her eyes glow brighter as the gaze charges (lg-ab-gaze-0..3 layers, a later art pass).
  artState: (s) => ({ 'data-ab-gaze': Math.max(0, Math.min(3, s.ab.charge || 0)) }),
}
