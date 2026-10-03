// RAID ABILITY v2.1: Dreamer (the Sleeper), Deep Sleep (`sleep`). design-v2.md section 20.
// A two-state boss. ASLEEP: each right raid answer sinks it deeper (depth 1..K.depth); the next right answer at full
// depth is a NIGHTMARE, +K.nightmare, and the dream starts over at depth 1. A miss WAKES it (depth 0). AWAKE: K.need
// right answers in a row sing a LULLABY, +K.lull, and it sleeps again at depth 1; a miss while awake resets the song.
// Attacks and inserted questions do not change its state. The one persistent idle reaction (IDLE_MOTIFS): the
// slow sleep drift while it sleeps. The hook contract is abilities/_contract.js.
const K = { depth: 3, nightmare: 3, lull: 2, need: 2 }
const normal = (q) => !!q && !q._attack && !q._inserted && !q._lastStand

export default {
  id: 'sleep', icon: '💤', K, fxKeys: ['deeper', 'nightmare', 'wake', 'hum', 'lullaby'],
  sampleHint: { key: 'lg_hint_sleep', vars: { n: K.nightmare } },
  init: () => ({ asleep: true, depth: 0, lull: 0, nightmares: 0, lullabies: 0 }),
  onStrike(s, res, hit, ctx) {
    if (ctx.kind !== 'normal') return
    const ab = s.ab
    if (!ctx.right) {
      if (ab.asleep) res.fx = 'wake'
      ab.asleep = false
      ab.depth = 0
      ab.lull = 0
      return
    }
    if (ab.asleep) {
      if (ab.depth >= K.depth) {
        res.dmg += K.nightmare
        ab.depth = 1
        ab.nightmares++
        res.fx = 'nightmare'
      } else {
        ab.depth++
        res.fx = 'deeper'
        res.fxVars = { n: ab.depth, max: K.depth }
      }
    } else {
      ab.lull++
      if (ab.lull >= K.need) {
        res.dmg += K.lull
        ab.asleep = true
        ab.depth = 1
        ab.lull = 0
        ab.lullabies++
        res.fx = 'lullaby'
      } else {
        res.fx = 'hum'
      }
    }
  },
  // Only when THIS answer triggers something: a Nightmare, or the Lullaby's last note.
  hint: (s, q) => {
    if (!normal(q)) return null
    if (s.ab.asleep && s.ab.depth >= K.depth) return { icon: '😱', key: 'lg_hint_sleep', vars: { n: K.nightmare } }
    if (!s.ab.asleep && s.ab.lull === K.need - 1) return { icon: '🎵', key: 'lg_hint_sleepLull', vars: { n: K.lull } }
    return null
  },
  // Item 0: asleep or awake. Item 1: the dream's depth (asleep) or the lullaby's notes (awake).
  hud: (s) => (s.ab.asleep
    ? [{ type: 'chip', icon: '💤', key: 'lg_hud_sleepAsleep', tone: 'purple' },
      { type: 'pips', n: Math.min(K.depth, s.ab.depth), max: K.depth, icon: '🫧', labelKey: 'lg_hud_sleepDepth', tone: 'purple', ready: s.ab.depth >= K.depth }]
    : [{ type: 'chip', icon: '👁', key: 'lg_hud_sleepAwake', tone: 'danger' },
      { type: 'pips', n: Math.min(K.need, s.ab.lull), max: K.need, icon: '🎵', labelKey: 'lg_hud_sleepLull', tone: 'info', ready: s.ab.lull === K.need - 1 }]),
  // Eyes shut (asleep) or open (awake): lg-ab-asleep-1 / lg-ab-asleep-0 layers per phase (a later art pass).
  artState: (s) => ({ 'data-ab-asleep': s.ab.asleep ? 1 : 0 }),
  // The slow sleep drift while it sleeps (.lgr-dreamer-idle-asleep in fx/dreamer.jsx).
  idle: (s) => (s.ab.asleep ? 'asleep' : ''),
}
