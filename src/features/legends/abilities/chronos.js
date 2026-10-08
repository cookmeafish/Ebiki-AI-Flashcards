// RAID ABILITY (design v2.1, #9). Motif: chronos. Time Loop: a miss undone, then asked again later.
// `sand` runs 0..K.max, starts at K.start: +1 every K.every-th right raid answer and at each phase line.
// A missed raid answer with sand: no heart lost, sand -1, NO attack; the same card comes back K.gap questions later as
// a LOOP (inserted, typed, never recorded). A loop answered right: Paradox, K.paradox damage; missed: one heart (the
// normal cost of an inserted question). A loop is never looped again. At most K.maxLoops loops per attempt, and only
// while the shared insert budget (MAX_INSERTED) has room: a miss that cannot loop is not rewound.
// Sand gained while the hourglass is full OVERFLOWS into Time Stop: the next right raid answer deals double.
// Why +1 and two questions later (v2.0 had +3, at once): an immediate re-ask right after seeing the answer is near
// free, and +3 made misses profitable. Two questions of spacing is real retrieval.
import { rulesOf, tuned } from './_rules'

const K = { max: 3, start: 1, every: 3, paradox: 1, gap: 2, maxLoops: 4 }
const normal = (q) => !!q && !q._attack && !q._inserted && !q._lastStand

// One grain of sand: into the glass, or (full) into Time Stop. Returns 'overflow' when it just stopped time.
function addSand(ab, k) {
  if (ab.sand < k.max) { ab.sand++; return 'grain' }
  if (ab.stop) return ''
  ab.stop = true
  return 'overflow'
}

export default {
  id: 'loop', icon: '⏳', K, fxKeys: ['grain', 'rewind', 'paradox', 'timestop', 'overflow'],
  sampleHint: { key: 'lg_hint_timeStop' },
  init: (ctx) => ({ sand: tuned(K, ctx).start, n3: 0, stop: false, loopKey: null, loops: 0, rewinds: 0, paradoxes: 0, stops: 0 }),
  onPhase(s, phase, ctx) { addSand(s.ab, tuned(K, ctx)) },
  onStrike(s, res, hit, ctx) {
    const k = tuned(K, ctx)
    if (ctx.inserted === 'loop') {
      if (ctx.right) { res.dmg += k.paradox; s.ab.paradoxes++; res.fx = 'paradox' }
      return
    }
    if (ctx.kind !== 'normal') return
    if (ctx.right) {
      if (s.ab.stop) { res.dmg *= 2; s.ab.stop = false; s.ab.stops++; res.fx = 'timestop' }
      s.ab.n3++
      if (s.ab.n3 % k.every === 0) {
        const got = addSand(s.ab, k)
        if (!res.fx && got === 'overflow') res.fx = 'overflow'
        else if (!res.fx && got === 'grain') res.fx = 'grain'
      }
      return
    }
    // A miss: rewound only when it can really loop (sand, the loop cap, the shared insert budget, a card to ask).
    const room = rulesOf(s).maxInserted - (s.insertedN || 0)
    if (s.ab.sand > 0 && s.ab.loops < k.maxLoops && room > 0 && hit.key != null) {
      s.ab.sand--
      s.ab.rewinds++
      s.ab.loopKey = hit.key
      res.lives = 0
      res.fx = 'rewind'
    }
  },
  // The rewound miss comes back K.gap questions later, and does not also attack. Only what really goes in is recorded.
  afterStrike(next, info) {
    const { over, room } = info
    const key = next.ab && next.ab.loopKey
    if (key == null) return null
    if (over || !room) return { ab: { loopKey: null } }
    return { insert: [{ key, kind: 'loop' }], at: tuned(K, info).gap, attack: false, ab: { loopKey: null, loops: next.ab.loops + 1 } }
  },
  banner: (s, q) => (q && q._inserted === 'loop' ? { icon: '⏳', key: 'lg_hint_timeLoop', tone: 'info' } : null),
  hint: (s, q) => (normal(q) && s.ab.stop ? { icon: '⏸️', key: 'lg_hint_timeStop' } : null),
  hud: (s, ctx) => [
    { type: 'pips', n: s.ab.sand, max: tuned(K, ctx).max, icon: '⏳', labelKey: 'lg_hud_sand', tone: 'warning', ready: s.ab.sand >= tuned(K, ctx).max && !s.ab.stop },
    { type: 'chip', icon: s.ab.stop ? '⏸️' : '', key: s.ab.stop ? 'lg_hud_timeStop' : '', tone: 'info' },
  ].filter((it) => it.type !== 'chip' || it.key),
  artState: (s) => ({ 'data-ab-sand': s.ab.sand, 'data-ab-stop': s.ab.stop ? 1 : 0 }),
}
