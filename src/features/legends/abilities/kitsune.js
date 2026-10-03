// Kitsune (The Nine-Tailed Empress): STARBALL RALLY (design v2.1, #22) · family: a streak with a finisher.
// Every right raid answer returns her star ball (rally +1); the K.at-th return in a row bursts into a STARFALL for
// K.starfall and the rally starts over. A miss and she CATCHES it (rally 0). Attacks and inserted questions neither add
// to the rally nor break it (a blocked attack keeps it).
const K = { at: 4, starfall: 3 }
const normal = (q) => !!q && !q._attack && !q._inserted && !q._lastStand

export default {
  id: 'rally', icon: '🔮', K, fxKeys: ['volley', 'starfall', 'caught'],
  sampleHint: { key: 'lg_hint_rally', vars: { n: K.starfall } },
  init: () => ({ rally: 0, starfalls: 0 }),
  onStrike(s, res, hit, ctx) {
    if (ctx.kind !== 'normal') return
    if (!ctx.right) {
      if (s.ab.rally > 0) { res.fx = 'caught'; res.fxVars = { n: s.ab.rally } }
      s.ab.rally = 0
      return
    }
    s.ab.rally++
    if (s.ab.rally >= K.at) {
      res.dmg += K.starfall
      s.ab.rally = 0
      s.ab.starfalls++
      res.fx = 'starfall'
      res.fxVars = { n: K.starfall }
    } else {
      res.fx = 'volley'
      res.fxVars = { n: s.ab.rally }
    }
  },
  // Only on the return that bursts.
  hint: (s, q) => (normal(q) && s.ab.rally === K.at - 1 ? { icon: '🌠', key: 'lg_hint_rally', vars: { n: K.starfall } } : null),
  hud: (s) => [{ type: 'track', pos: s.ab.rally, max: K.at, icon: '🔮', labelKey: 'lg_hud_rally', tone: 'info', ready: s.ab.rally === K.at - 1 }],
  // The rally length on the arena: fx/kitsune.jsx grows the volley's fox-fire trail with it.
  artState: (s) => ({ 'data-ab-rally': s.ab.rally }),
}
