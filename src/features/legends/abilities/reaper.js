// RAID ABILITY v2.1: Reaper (Soul Harvester), Reaper's Line (`execute`). design-v2.md section 19.
// In each phase a scythe line sits on the whole-day health bar AT that phase's floor (phaseFloor). Every right answer
// (a raid answer or a blocked attack) raises it K.climb; a miss lowers it K.slip, never below the floor. When a right
// answer leaves his health above the floor but at or under the line, the rest of the phase is REAPED: that answer's
// damage grows to bring the health exactly to the floor. In phase 3 the floor is 0: the boss dies. A hit that crosses
// the floor by itself starts the next phase, whose line starts at its own floor. Inserted questions do nothing.
// `ab.line` is in health LEFT on the whole-day bar. The hook contract is abilities/_contract.js.
import { phaseFloor } from './_rules'

const K = { climb: 1, slip: 1, readyGap: 2 }
const answers = (q) => !!q && !q._inserted && !q._lastStand
const floorOf = (ctx, p) => (ctx && ctx.bar ? phaseFloor(ctx.bar, p) : 0)
// Health left on the whole-day bar after `damage` (this attempt's damage on this bar).
const leftOf = (ctx, damage) => (ctx && ctx.bar ? ctx.bar.total - ((ctx.bar.before || 0) + damage) : Infinity)
// How far his health still is above the line (<= 0: the next right answer reaps).
const gapOf = (s, ctx) => leftOf(ctx, s.damage || 0) - (s.ab.line || 0)
const isReady = (s, ctx) => !!(ctx && ctx.bar) && gapOf(s, ctx) <= K.readyGap

export default {
  id: 'execute', icon: '🌾', K, fxKeys: ['climb', 'reap'],
  sampleHint: { key: 'lg_hint_execute' },
  init: (ctx) => ({ line: floorOf(ctx, ctx.phase || 1), reaps: 0 }),
  onPhase(s, p, ctx) { s.ab.line = floorOf(ctx, p) },
  onStrike(s, res, hit, ctx) {
    if (ctx.kind === 'inserted' || !ctx.bar) return
    const ab = s.ab
    const floor = floorOf(ctx, ctx.phase)
    if (!ctx.right) { ab.line = Math.max(floor, ab.line - K.slip); return }
    ab.line += K.climb
    const left = leftOf(ctx, s.damage + res.dmg)
    if (left > floor && left <= ab.line) {
      // exactly to the floor (a floor between two whole numbers: the first whole number at or under it)
      res.dmg += Math.ceil(left - floor - 1e-9)
      ab.reaps++
      res.fx = 'reap'
    } else {
      res.fx = 'climb'
    }
  },
  hint: (s, q, mode, ctx) => (answers(q) && isReady(s, ctx) ? { icon: '🌾', key: 'lg_hint_execute' } : null),
  // How many health points the scythe still is from his health, rounded up (0 = the next right answer reaps).
  hud: (s, ctx) => {
    if (!ctx || !ctx.bar) return []
    const n = Math.max(0, Math.ceil(gapOf(s, ctx) - 1e-9))
    return [{ type: 'chip', icon: '🌾', key: 'lg_hud_execute', vars: { n }, tone: 'danger', ready: isReady(s, ctx) }]
  },
  barMarks: (s) => [{ type: 'line', at: Math.max(0, s.ab.line || 0), tone: 'danger' }],
  // The lantern burns brighter as the line rises in this phase (lg-ab-line-0..3 layers, a later art pass).
  artState: (s, ctx) => ({ 'data-ab-line': Math.max(0, Math.min(3, Math.floor((s.ab.line || 0) - floorOf(ctx, (ctx && ctx.phase) || 1)))) }),
}
