// RAID ABILITY (design v2.1, #7). Motif: leviathan. Ride the Current: a momentum level, no cash-out.
// `current` runs 0..K.max and starts at K.start. A right raid answer rows one up (max K.max); a miss drags you down
// K.drop (min 0). On the CREST (K.max, after this answer's step) a right answer deals K.crest more: reaching it is the
// big moment, staying on it surfs. Phase lines leave the current alone: the first version dropped it to 1 at every
// line, and a typical raid's phase (about 5 damage) was used up by the climb, so nobody ever surfed or wiped out.
// Attacks and inserted questions never move the boat.
import { tuned } from './_rules'

const K = { max: 3, start: 1, drop: 2, crest: 1 }

export default {
  id: 'current', icon: '🌊', K, fxKeys: ['row', 'crest', 'surf', 'pulled', 'wipeout'],
  init: (ctx) => ({ current: tuned(K, ctx).start, crests: 0, surfs: 0, wipeouts: 0 }),
  onStrike(s, res, hit, ctx) {
    if (ctx.kind !== 'normal') return
    const k = tuned(K, ctx)
    const was = s.ab.current
    if (ctx.right) {
      s.ab.current = Math.min(k.max, was + 1)
      if (s.ab.current < k.max) { res.fx = 'row'; return }
      res.dmg += k.crest
      if (was < k.max) { s.ab.crests++; res.fx = 'crest' } else { s.ab.surfs++; res.fx = 'surf' }
    } else {
      s.ab.current = Math.max(0, was - k.drop)
      if (was >= k.max) { s.ab.wipeouts++; res.fx = 'wipeout' } else if (was > s.ab.current) res.fx = 'pulled'
    }
  },
  hud: (s, ctx) => { const k = tuned(K, ctx); return [{ type: 'track', pos: s.ab.current, max: k.max, icon: '⛵', labelKey: 'lg_hud_current', tone: 'info', ready: s.ab.current === k.max - 1 }] },
  artState: (s) => ({ 'data-ab-current': s.ab.current }),
}
