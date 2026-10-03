// RAID ABILITY (design v2.1): Chimera, Three Heads. Family: split health + targeting [DECISION].
// The day's health is three equal head bars: LION, GOAT, SERPENT. Damage goes to the aimed head (default: the first
// living head in line, GOAT, LION, SERPENT, so with no tap the heads fall exactly at the phase lines); overkill spills to
// the next living head in line. A head that falls deals +K.fall (which spills on too) and gives its boon for the rest of
// the fight: Lion's Heart (+1 on every clean typed raid answer), Goat's Horn (the next heart you would lose is blocked; the horn grows back at every phase line),
// Serpent's Venom (+1 on every right raid answer). The last head's fall ends the fight.
// Why the Goat leads and its horn always blocks (the first version: Lion first, and the horn gave a lost heart back
// instead when one was lost): the Goat fell at the second phase line, and the block fired in about 1 raid in 10.
// The optional decision: tap a head to aim at it (raid questions only). Wounds stay on the right heads across today's
// attempts (dayState).
const K = { fall: 1, lion: 1, serpent: 1 }
export const HEADS = ['lion', 'goat', 'serpent']
const ICON = { lion: '🦁', goat: '🐐', serpent: '🐍' }
const FALL_FX = ['fallLion', 'fallGoat', 'fallSerpent']
const EPS = 1e-9

const dayTotal = (ctx) => (ctx && ctx.bar && ctx.bar.total > 0 ? ctx.bar.total : ctx && Number.isFinite(ctx.need) && ctx.need > 0 ? ctx.need : 30)
export const LINE = [1, 0, 2] // the default order of the heads: Goat, Lion, Serpent
const living = (ab) => LINE.filter((h) => !ab.dead[h])
const target = (ab) => (ab.aim != null && !ab.dead[ab.aim] ? ab.aim : living(ab)[0])

// Put `amount` into the heads (the aimed one first, then the rest in order); returns the heads that fell.
function wound(ab, amount) {
  const fell = []
  let left = amount
  while (left > EPS) {
    const live = living(ab)
    if (!live.length) break
    const t = target(ab)
    const order = [t, ...live.filter((h) => h !== t)]
    const h = order[0]
    const take = Math.min(ab.third - ab.hurt[h], left)
    ab.hurt = ab.hurt.map((v, i) => (i === h ? v + take : v))
    left -= take
    if (ab.hurt[h] >= ab.third - EPS) {
      ab.dead = ab.dead.map((d, i) => d || i === h)
      if (ab.aim === h) ab.aim = null
      fell.push(h)
    }
  }
  return fell
}

export default {
  id: 'threeheads', icon: '🦁', K, fxKeys: ['fallLion', 'fallGoat', 'fallSerpent', 'goatBlock', 'aim', 'maul'],
  decision: true,
  init(ctx) {
    const total = dayTotal(ctx)
    const third = total / 3
    const saved = ctx && ctx.dayAb && Array.isArray(ctx.dayAb.hurt) && ctx.dayAb.hurt.length === 3 ? ctx.dayAb.hurt.map((v) => Math.max(0, Math.min(third, Number(v) || 0))) : null
    const ab = { third, hurt: [0, 0, 0], dead: [false, false, false], boons: [], aim: null, ward: 0, falls: 0 }
    if (saved) ab.hurt = saved
    else if (ctx && ctx.bar && ctx.bar.before > 0) wound(ab, ctx.bar.before) // a wounded boss with no saved split: heads in order
    ab.dead = ab.hurt.map((v) => v >= third - EPS)
    ab.boons = [0, 2].filter((h) => ab.dead[h]) // Lion's and Serpent's boons from heads felled earlier today
    if (ab.dead[1]) ab.ward = 1 // the Goat felled earlier today: its horn guards this attempt too
    return ab
  },
  onStrike(s, res, hit, ctx) {
    const ab = s.ab
    if (ctx.kind === 'normal' && ctx.right) {
      if (ab.boons.includes(0) && ctx.clean) res.dmg += K.lion
      if (ab.boons.includes(2)) res.dmg += K.serpent
    }
    if (!(res.dmg > 0)) return
    // A wound that fells nothing still shows on the head it hit (Maul); a fall below replaces it.
    const hitHead = target(ab)
    let fell = wound(ab, res.dmg)
    if (!fell.length) { res.fx = 'maul'; res.fxVars = { head: HEADS[hitHead] } }
    while (fell.length) {
      const more = []
      for (const h of fell) {
        res.dmg += K.fall
        ab.falls = (ab.falls || 0) + 1
        if (!ab.boons.includes(h)) ab.boons = [...ab.boons, h]
        if (h === 1) ab.ward = 1
        res.fx = FALL_FX[h]
        res.fxVars = { n: K.fall }
        more.push(...wound(ab, K.fall))
      }
      fell = more
    }
  },
  // Goat's Horn grows back at a phase line while the Goat is down.
  onPhase(s) { if (s.ab.dead[1]) s.ab.ward = 1 },
  onLifeLoss(s, res) {
    if (s.ab.ward > 0 && res.lives > 0) { s.ab.ward = 0; res.lives -= 1; res.fx = 'goatBlock' }
  },
  actions(s, ctx) {
    const q = ctx && ctx.q
    if (!q || q._attack || q._inserted || q._lastStand) return []
    const t = target(s.ab)
    return living(s.ab).map((h) => ({ id: `aim-${HEADS[h]}`, icon: ICON[HEADS[h]], labelKey: `lg_act_aim_${HEADS[h]}`, enabled: h !== t, on: h === t, tone: 'warning' }))
  },
  act(s, res, action) {
    const h = HEADS.indexOf(String(action.type || '').replace(/^aim-/, ''))
    if (h < 0 || s.ab.dead[h] || target(s.ab) === h) return
    s.ab.aim = h
    res.fx = 'aim'
    res.fxVars = { head: HEADS[h] }
  },
  dayState: (s) => ({ hurt: (s.ab && s.ab.hurt) || [0, 0, 0] }),
  hud: (s) => {
    const t = target(s.ab)
    return [
      { type: 'bars', bars: LINE.map((h) => ({ icon: ICON[HEADS[h]], labelKey: `lg_hud_head_${HEADS[h]}`, value: Math.max(0, Math.round(s.ab.third - s.ab.hurt[h])), max: Math.round(s.ab.third), tone: s.ab.dead[h] ? 'ink' : 'danger', active: h === t && !s.ab.dead[h] })) },
      ...(s.ab.ward ? [{ type: 'chip', icon: '🐐', key: 'lg_hud_goatWard', tone: 'success' }] : []),
    ]
  },
  artState: (s) => ({ 'data-ab-aim': target(s.ab) ?? 0, 'data-ab-lion-down': s.ab.dead[0] ? 1 : 0, 'data-ab-goat-down': s.ab.dead[1] ? 1 : 0, 'data-ab-serpent-down': s.ab.dead[2] ? 1 : 0 }),
}
