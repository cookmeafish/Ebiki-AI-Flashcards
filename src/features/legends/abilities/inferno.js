// RAID ABILITY (design v2.1, #8). Motif: inferno. Pressure Vent [DECISION]: charge, release when YOU choose.
// `heat` runs 0..K.max: a right raid answer +1, a miss cools it K.cool. The Vent button (beside Skip, between
// questions, from K.ventMin heat) deals heat - 1 and empties the gauge. Left alone, the gauge reaches K.max and ERUPTS
// by itself for K.erupt. When the questions run out, settle vents what is left. Doing nothing is as good a way to play
// as any (an all-right run wins with the button never pressed). No button on attacks or inserted questions.
const K = { max: 4, cool: 2, erupt: 3, ventMin: 2, bigVent: 2 }
const normal = (q) => !!q && !q._attack && !q._inserted && !q._lastStand

// What a vent deals at `heat` (0 below K.ventMin).
export const ventDamage = (heat) => (heat >= K.ventMin ? heat - 1 : 0)

// Vent the gauge into `res`: the bigger vent (K.bigVent damage or more) has its own, bigger effect.
function vent(s, res) {
  const dmg = ventDamage(s.ab.heat)
  if (!dmg) return
  res.dmg += dmg
  s.ab.heat = 0
  s.ab.vents++
  if (dmg >= K.bigVent) res.fx = 'blast'
  else res.fx = 'vent'
}

export default {
  id: 'vent', icon: '🌋', K, fxKeys: ['heat', 'cool', 'vent', 'blast', 'erupt'],
  decision: true,
  init: () => ({ heat: 0, vents: 0, eruptions: 0 }),
  onStrike(s, res, hit, ctx) {
    if (ctx.kind !== 'normal') return
    if (ctx.right) {
      s.ab.heat = Math.min(K.max, s.ab.heat + 1)
      if (s.ab.heat >= K.max) { res.dmg += K.erupt; s.ab.heat = 0; s.ab.eruptions++; res.fx = 'erupt' } else res.fx = 'heat'
    } else if (s.ab.heat > 0) {
      s.ab.heat = Math.max(0, s.ab.heat - K.cool)
      res.fx = 'cool'
    }
  },
  actions(s, ctx) {
    if (!normal(ctx.q)) return []
    const n = ventDamage(s.ab.heat)
    return [{ id: 'vent', icon: '🔥', labelKey: 'lg_btn_vent', vars: { n }, enabled: n > 0, tone: 'danger' }]
  },
  act(s, res, action) { if (action.type === 'vent') vent(s, res) },
  settle(s, res) { vent(s, res) },
  hud: (s) => [{ type: 'gauge', value: s.ab.heat, max: K.max, labelKey: 'lg_hud_heat', vars: { n: s.ab.heat }, tone: 'danger', ready: s.ab.heat === K.max - 1 }],
  artState: (s) => ({ 'data-ab-heat': s.ab.heat }),
}
