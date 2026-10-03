// RAID ABILITY v2.1: Swarmqueen (Hive Empress), Wildfire Comb (`wildfire`). design-v2.md section 16.
// Her comb has K.cells cells. A right raid answer sets one alight and the fire SPREADS to the next by itself (2 cells per
// right answer); a miss lets a drone douse one. When every cell burns: Hive Ablaze, +K.blaze, and the comb starts over.
// Attacks and inserted questions do nothing to the comb. The hook contract is abilities/_contract.js.
const K = { cells: 6, spread: 1, blaze: 2, readyAt: 4 }
const normal = (q) => !!q && !q._attack && !q._inserted && !q._lastStand
const ready = (s) => (s.ab.burning || 0) >= K.readyAt

export default {
  id: 'wildfire', icon: '🍯', K, fxKeys: ['ignite', 'douse', 'ablaze'],
  sampleHint: { key: 'lg_hint_wildfire', vars: { n: K.blaze } },
  init: () => ({ burning: 0, blazes: 0 }),
  onStrike(s, res, hit, ctx) {
    if (ctx.kind !== 'normal') return
    const ab = s.ab
    if (ctx.right) {
      // ignite one cell, then the fire spreads to its neighbour by itself
      ab.burning = Math.min(K.cells, ab.burning + 1 + K.spread)
      if (ab.burning >= K.cells) {
        res.dmg += K.blaze
        ab.burning = 0
        ab.blazes++
        res.fx = 'ablaze'
      } else {
        res.fx = 'ignite'
        res.fxVars = { n: ab.burning, max: K.cells }
      }
    } else if (ab.burning > 0) {
      ab.burning--
      res.fx = 'douse'
      res.fxVars = { n: ab.burning, max: K.cells }
    }
  },
  // Only when the next right answer sets the whole hive ablaze.
  hint: (s, q) => (normal(q) && ready(s) ? { icon: '🔥', key: 'lg_hint_wildfire', vars: { n: K.blaze } } : null),
  // The comb as a hex: her egg in the centre, the six cells around it lit in order.
  hud: (s) => {
    const n = s.ab.burning || 0
    return [{ type: 'board', shape: 'hex7', cells: [2, ...Array.from({ length: K.cells }, (_, i) => (i < n ? 1 : 0))], labelKey: 'lg_hud_wildfire', vars: { n, max: K.cells }, tone: 'danger', ready: ready(s) }]
  },
  // Cells of her cathedral backdrop burning (lg-ab-comb-0..6 layers, a later art pass).
  artState: (s) => ({ 'data-ab-comb': Math.max(0, Math.min(K.cells, s.ab.burning || 0)) }),
}
