// Moonmaw (The Lunar Strix): MOONFALL (design v2.1, #21) · family: delayed impacts that misses cannot stop.
// Every K.every-th clean typed raid answer flings a moon into orbit; K.delay raid answers later it crashes into him for
// K.hit, even when that answer is a miss (the miss itself still deals nothing). Attacks and inserted questions neither
// charge nor tick the moons. Moons still in orbit when the questions run out crash at once (settle).
const K = { every: 3, delay: 2, hit: 2, maxOrbit: 3 }
const normal = (q) => !!q && !q._attack && !q._inserted && !q._lastStand
const dueNow = (orbit) => (orbit || []).filter((t) => t <= 1).length

export default {
  id: 'moons', icon: '🌕', K, fxKeys: ['charge', 'launch', 'impact'],
  sampleHint: { key: 'lg_hint_moonsLand', vars: { n: K.hit } },
  init: () => ({ cleans: 0, orbit: [], landed: 0 }),
  onStrike(s, res, hit, ctx) {
    if (ctx.kind !== 'normal') return
    // The moons in orbit tick first: one at 1 crashes on THIS answer (right or wrong), before this answer's launch.
    const due = dueNow(s.ab.orbit)
    s.ab.orbit = s.ab.orbit.map((t) => t - 1).filter((t) => t > 0)
    if (due) {
      res.dmg += due * K.hit
      s.ab.landed += due
      res.fx = 'impact'
      res.fxVars = { n: due * K.hit }
    }
    if (!ctx.clean) return
    s.ab.cleans++
    if (s.ab.cleans % K.every === 0) {
      s.ab.orbit = [...s.ab.orbit, K.delay].slice(-K.maxOrbit)
      if (!due) res.fx = 'launch'
    } else if (!due) res.fx = 'charge'
  },
  settle(s, res) {
    const n = (s.ab.orbit || []).length
    if (!n) return
    res.dmg += n * K.hit
    s.ab.landed += n
    s.ab.orbit = []
    res.fx = 'impact'
    res.fxVars = { n: n * K.hit }
  },
  // Only when it matters on THIS question: a moon lands now, or a clean typed answer now flings one.
  hint(s, q, mode) {
    if (!normal(q)) return null
    if (dueNow(s.ab.orbit)) return { icon: '🌕', key: 'lg_hint_moonsLand', vars: { n: K.hit } }
    if (mode !== 'choice' && s.ab.cleans % K.every === K.every - 1) return { icon: '🌙', key: 'lg_hint_moonsLaunch' }
    return null
  },
  hud: (s) => {
    const n = s.ab.cleans % K.every
    return [{ type: 'pips', n, max: K.every, icon: '🌙', labelKey: 'lg_hud_moonsCharge', tone: 'info', ready: n === K.every - 1 }]
  },
  artState: (s) => ({ 'data-ab-orbit': Math.min(K.maxOrbit - 1, (s.ab.orbit || []).length) }),
}
