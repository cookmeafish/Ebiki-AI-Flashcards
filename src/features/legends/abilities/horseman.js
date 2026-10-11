// Horseman (The Headless Horseman): THE MIDNIGHT RIDE (design v2.1, #28) · family: a chase on a road with a finish line.
// You ride for the bridge with the Horseman behind you. Two things are on the HUD, nothing is hidden:
//   the ROAD   0..K.bridge: every right raid answer gallops you one stretch closer to the bridge. Reaching it CROSSES:
//              he cannot follow you over running water and his fire blows back off the planks, +K.cross. The road
//              starts over. The road you have covered is KEPT for today's next attempt (dayState): with short runs
//              (5 questions) the bridge was otherwise almost never reached.
//   your LEAD  0..K.maxLead, starts at K.lead (full): how far ahead of him you are. A miss lets him gain a length;
//              a clean TYPED answer (full recall, the spur) wins a length back (never past K.maxLead); a choice or a
//              slip only holds the lead. When he reaches you he RIDES YOU DOWN: you are thrown back to the start of
//              the road and the chase starts over at K.lead. That is all it costs: the miss costs its heart as always,
//              never more, and a right answer never loses ground.
// So two misses with no clean typed answer between them get you caught, and full recall after a miss is the escape.
// Attacks and inserted questions move neither rider.
// Why a lead of 2 and no more (the first version let clean answers build a lead of 3): with room to bank a third
// length a typical raid was caught in only 1 raid in 5 (reachability.test.js), and the chase meant nothing; with a
// lead of 1 every single miss threw the road away.
import { tuned, hitClean } from './_rules'

const K = { bridge: 5, cross: 3, lead: 2, maxLead: 2 }
const normal = (q) => !!q && !q._attack && !q._inserted && !q._lastStand

export default {
  id: 'ride', icon: '🎃', K, fxKeys: ['gallop', 'close', 'caught', 'cross'],
  sampleHint: { key: 'lg_hint_rideCross', vars: { n: K.cross } }, // tuning-ok: static
  init: (ctx) => {
    const k = tuned(K, ctx)
    const kept = Number(ctx && ctx.dayAb && ctx.dayAb.road)
    const road = Number.isInteger(kept) && kept > 0 ? Math.min(kept, k.bridge - 1) : 0
    return { road, lead: k.lead, crossings: 0, caughts: 0 }
  },
  // the road covered stays for today's next attempt; the lead starts full every attempt
  dayState: (s) => ({ road: (s.ab && s.ab.road) || 0 }),
  onStrike(s, res, hit, ctx) {
    if (ctx.kind !== 'normal') return
    const k = tuned(K, ctx)
    if (!ctx.right) {
      s.ab.lead = Math.max(0, s.ab.lead - 1)
      if (s.ab.lead === 0) {
        // ridden down: the road is lost, the chase starts over
        res.fx = 'caught'
        res.fxVars = { n: s.ab.road }
        s.ab.road = 0
        s.ab.lead = k.lead
        s.ab.caughts++
      } else if (s.ab.lead === 1) {
        res.fx = 'close'
      }
      return
    }
    if (hitClean(ctx, res)) s.ab.lead = Math.min(k.maxLead, s.ab.lead + 1)
    s.ab.road++
    if (s.ab.road >= k.bridge) {
      res.dmg += k.cross
      res.fx = 'cross'
      res.fxVars = { n: k.cross }
      s.ab.road = 0
      s.ab.crossings++
      return
    }
    res.fx = 'gallop'
    res.fxVars = { n: k.bridge - s.ab.road }
  },
  // Only when THIS question changes what happens: he is one length behind (a miss rides you down), or one right answer
  // crosses the bridge.
  hint(s, q, mode, ctx) {
    if (!normal(q)) return null
    const k = tuned(K, ctx)
    if (s.ab.lead === 1) return { icon: '🐎', key: 'lg_hint_rideClose' }
    if (s.ab.road === k.bridge - 1) return { icon: '🌉', key: 'lg_hint_rideCross', vars: { n: k.cross } }
    return null
  },
  hud: (s, ctx) => {
    const k = tuned(K, ctx)
    return [
      { type: 'track', pos: s.ab.road, max: k.bridge, icon: '🏇', labelKey: 'lg_hud_rideRoad', tone: 'warning', ready: s.ab.road === k.bridge - 1 },
      { type: 'pips', n: s.ab.lead, max: k.maxLead, icon: '🐎', labelKey: 'lg_hud_rideLead', tone: 'danger', ready: s.ab.lead === 1 },
    ]
  },
  // He is right behind you (one length): in raids/horseman.svg his lantern head blazes and the horse's eyes burn
  // (lg-ab-ride-close layers in every phase).
  artState: (s) => ({ 'data-ab-ride': s.ab.lead <= 1 ? 'close' : 'far' }),
}
