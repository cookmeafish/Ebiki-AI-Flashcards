// Ratking (The Sewer Kingpin): KINGPIN'S HOARD (design v2.1, #24) · family: currency and a shop [DECISION].
// Every right raid answer robs him of a coin (yours now); a miss lets his rats steal one back (never below 0). Two
// buttons beside Skip: a CHEESE BOMB (K.bomb coins: K.bombDmg damage) and a LUCKY TAIL (K.tail coins: the next heart
// you would lose is saved; one held at a time). Reaching K.cap coins makes the rats throw a bomb for you (K.bomb coins
// spent, K.bombDmg damage), so never buying still pays. Attacks and inserted questions earn and lose nothing, and the
// buttons never show on them. Coins left at the end are a score only.
// K.tail 2 (was 5): saving 5 coins past the 4 a bomb costs almost never happened (a Lucky Tail in 1 raid in 100). With
// the cheap tail, a 4 coin bomb and the 6 coin auto bomb came too rare: 3 and 5 now.
const K = { bomb: 3, bombDmg: 3, tail: 2, cap: 5, pile: 3, pileEvery: 4 }
const normal = (q) => !q || (!q._attack && !q._inserted && !q._lastStand)

export default {
  id: 'hoard', icon: '💰', K, decision: true, fxKeys: ['loot', 'stolen', 'bomb', 'buyTail', 'tail'],
  sampleHint: { key: 'lg_hint_hoardAuto', vars: { n: K.bombDmg } },
  init: () => ({ coins: 0, tail: false, robbed: 0, bombs: 0, saves: 0 }),
  onStrike(s, res, hit, ctx) {
    if (ctx.kind !== 'normal') return
    if (ctx.right) {
      s.ab.coins++
      s.ab.robbed++
      if (s.ab.coins >= K.cap) {
        s.ab.coins -= K.bomb
        s.ab.bombs++
        res.dmg += K.bombDmg
        res.fx = 'bomb'
        res.fxVars = { n: K.bombDmg }
      } else {
        res.fx = 'loot'
        res.fxVars = { n: s.ab.coins }
      }
    } else if (s.ab.coins > 0) {
      s.ab.coins--
      res.fx = 'stolen'
    }
  },
  // The Lucky Tail saves one heart (a missed attack's 2 hearts become 1).
  onLifeLoss(s, res) {
    if (!s.ab.tail || !(res.lives > 0)) return
    s.ab.tail = false
    s.ab.saves++
    res.lives--
    res.fx = 'tail'
  },
  actions(s, ctx) {
    if (!normal(ctx && ctx.q)) return []
    return [
      { id: 'bomb', icon: '🧀', labelKey: 'lg_act_hoardBomb', vars: { n: K.bomb }, enabled: s.ab.coins >= K.bomb, tone: 'warning' },
      { id: 'tail', icon: '🐀', labelKey: 'lg_act_hoardTail', vars: { n: K.tail }, enabled: s.ab.coins >= K.tail && !s.ab.tail, tone: 'success' },
    ]
  },
  act(s, res, action) {
    if (action.type === 'bomb' && s.ab.coins >= K.bomb) {
      s.ab.coins -= K.bomb
      s.ab.bombs++
      res.dmg += K.bombDmg
      res.fx = 'bomb'
      res.fxVars = { n: K.bombDmg }
    } else if (action.type === 'tail' && s.ab.coins >= K.tail && !s.ab.tail) {
      s.ab.coins -= K.tail
      s.ab.tail = true
      res.fx = 'buyTail'
    }
  },
  // Only when the next right answer makes the rats throw a bomb.
  hint: (s, q) => (normal(q) && q && s.ab.coins === K.cap - 1 ? { icon: '🧀', key: 'lg_hint_hoardAuto', vars: { n: K.bombDmg } } : null),
  hud: (s) => [
    { type: 'coins', n: s.ab.coins, icon: '🪙', labelKey: 'lg_hud_hoard', tone: 'warning', ready: s.ab.coins === K.bomb - 1 },
    { type: 'pips', n: s.ab.tail ? 1 : 0, max: 1, icon: '🐀', labelKey: 'lg_hud_hoardTail', tone: 'success' },
  ],
  // His coin pile in the art: K.pile (full) down to 0 as you rob him.
  artState: (s) => ({ 'data-ab-hoard': Math.max(0, K.pile - Math.floor((s.ab.robbed || 0) / K.pileEvery)) }),
}
