// Sugarqueen (The Sugarplum Tyrant): SUGAR RUSH (design v2.1, #25) · family: a window counted in answers.
// Every right raid answer drops a sugar cube in her jar (a miss takes none out). The K.jar-th cube starts a SUGAR RUSH
// for the next K.rush raid answers: a right one deals +K.bonus, a miss CRASHES the rush. The jar does not fill during a
// rush. Attacks and inserted questions neither fill the jar nor use the rush.
const K = { jar: 3, rush: 2, bonus: 2 }
const normal = (q) => !!q && !q._attack && !q._inserted && !q._lastStand

export default {
  id: 'sugarrush', icon: '🍬', K, fxKeys: ['cube', 'rush', 'sweet', 'crash'],
  sampleHint: { key: 'lg_hint_sugarrushStart' },
  init: () => ({ jar: 0, rush: 0, rushes: 0, crashes: 0 }),
  onStrike(s, res, hit, ctx) {
    if (ctx.kind !== 'normal') return
    if (s.ab.rush > 0) {
      if (ctx.right) {
        res.dmg += K.bonus
        s.ab.rush--
        res.fx = 'sweet'
        res.fxVars = { n: K.bonus }
      } else {
        s.ab.rush = 0
        s.ab.crashes++
        res.fx = 'crash'
      }
      return
    }
    if (!ctx.right) return
    s.ab.jar++
    if (s.ab.jar >= K.jar) {
      s.ab.jar = 0
      s.ab.rush = K.rush
      s.ab.rushes++
      res.fx = 'rush'
    } else {
      res.fx = 'cube'
      res.fxVars = { n: s.ab.jar, m: K.jar }
    }
  },
  // Only when it changes what this answer does: it starts the rush, or it is boosted by one.
  hint(s, q) {
    if (!normal(q)) return null
    if (s.ab.rush > 0) return { icon: '🍭', key: 'lg_hint_sugarrushBoost', vars: { b: K.bonus } }
    if (s.ab.jar === K.jar - 1) return { icon: '🍬', key: 'lg_hint_sugarrushStart' }
    return null
  },
  hud: (s) => [
    s.ab.rush > 0
      ? { type: 'pips', n: s.ab.rush, max: K.rush, icon: '🍭', labelKey: 'lg_hud_sugarRush', tone: 'brand' }
      : { type: 'pips', n: s.ab.jar, max: K.jar, icon: '🧊', labelKey: 'lg_hud_sugarJar', tone: 'brand', ready: s.ab.jar === K.jar - 1 },
  ],
  artState: (s) => ({ 'data-ab-rush': s.ab.rush > 0 ? 1 : 0 }),
}
