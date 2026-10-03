// RAID ABILITY v2.1: Banshee (Drowned Organist), Call and Response (`scream`). design-v2.md section 18.
// She SCREAMS at every phase line and after each of your missed raid answers (one pending scream at a time, never
// stacked). The next right answer (a raid answer or a blocked attack) with a scream pending SHATTERS it: +K.shatter.
// Inserted questions do not answer her. The phase-line screams make it fire for a perfect player too.
// The hook contract is abilities/_contract.js.
import { barPhase } from './_rules'

const K = { shatter: 2 }
const answers = (q) => !!q && !q._inserted && !q._lastStand

export default {
  id: 'scream', icon: '😱', K, fxKeys: ['wail', 'shatter'],
  sampleHint: { key: 'lg_hint_scream' },
  init: () => ({ scream: false, shatters: 0 }),
  // A phase line: she screams (the state; the wail itself plays on the answer that crossed it, below).
  onPhase(s) { s.ab.scream = true },
  onStrike(s, res, hit, ctx) {
    if (ctx.kind === 'inserted') return
    const ab = s.ab
    if (ctx.right && ab.scream) {
      res.dmg += K.shatter
      ab.scream = false
      ab.shatters++
      res.fx = 'shatter'
    } else if (!ctx.right && ctx.kind === 'normal') {
      ab.scream = true
      res.fx = 'wail'
    }
    // This answer crosses a phase line (and the boss lives on): onPhase raises her scream; show it now.
    if (!res.fx && ctx.bar) {
      const dealt = s.damage + res.dmg
      const left = ctx.bar.total - ((ctx.bar.before || 0) + dealt)
      if (left > 0 && barPhase(ctx.bar, dealt) > ctx.phase) res.fx = 'wail'
    }
  },
  hint: (s, q) => (answers(q) && s.ab.scream ? { icon: '😱', key: 'lg_hint_scream' } : null),
  hud: (s) => (s.ab.scream ? [{ type: 'chip', icon: '😱', key: 'lg_hud_scream', tone: 'danger', ready: true }] : []),
  // Her scream held open while it is pending (lg-ab-scream-1 layers, a later art pass).
  artState: (s) => ({ 'data-ab-scream': s.ab.scream ? 1 : 0 }),
}
