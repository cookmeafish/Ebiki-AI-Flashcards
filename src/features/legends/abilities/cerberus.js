// Cerberus (The Hound of the Last Gate): SHACKLES (design v2.1, #27) · family: three locks, each its own deed.
// The three heads must be chained, each by a DIFFERENT deed (nothing hidden: the HUD names all three):
//   Fire head   any right answer (a choice, a slip, a clean answer)
//   Iron head   a clean TYPED answer (iron gives only to full recall)
//   Shadow head the first right answer after a miss, or a blocked attack (you face the shadow of your mistake)
// One answer chains one head: a recovery (a blocked attack, or the first right answer after a miss) goes to the Shadow
// head first, a clean typed answer to the Iron head, anything else right to the Fire head. With all three chained
// the hound is BOUND: the gate slams on him for +K.bound, and he tears free again (every head unchained). The Fire head is the hothead: any miss lets it slip its
// chain (the other two stay chained). The miss costs its life as always; no answer ever costs more.
const K = { bound: 4 }
const HEADS = ['iron', 'fire', 'shadow']
const free = (s) => HEADS.filter((h) => !s.ab[h])

// The head this answer chains (null: nothing new). `recover` = a blocked attack or the first right answer after a
// miss; `clean` = clean and typed.
export function headFor(ab, { recover, clean }) {
  if (recover && !ab.shadow) return 'shadow'
  if (clean && !ab.iron) return 'iron'
  if (!ab.fire) return 'fire'
  return null
}
const FX = { fire: 'bindFire', iron: 'bindIron', shadow: 'bindShadow' }

export default {
  id: 'shackles', icon: '⛓️', K, fxKeys: ['bindFire', 'bindIron', 'bindShadow', 'bound', 'snap'],
  sampleHint: { key: 'lg_hint_shacklesIron' },
  init: () => ({ fire: false, iron: false, shadow: false, afterMiss: false, binds: 0, bounds: 0, snaps: 0 }),
  onStrike(s, res, hit, ctx) {
    if (ctx.kind === 'inserted') return
    const attack = ctx.kind === 'attack'
    if (!ctx.right) {
      s.ab.afterMiss = true
      if (s.ab.fire) {
        s.ab.fire = false
        s.ab.snaps++
        res.fx = 'snap'
      }
      return
    }
    const head = headFor(s.ab, { recover: attack || s.ab.afterMiss, clean: ctx.clean })
    s.ab.afterMiss = false
    if (!head) return
    s.ab[head] = true
    s.ab.binds++
    if (free(s).length === 0) {
      res.dmg += K.bound
      s.ab.fire = false
      s.ab.iron = false
      s.ab.shadow = false
      s.ab.bounds++
      res.fx = 'bound'
      res.fxVars = { n: K.bound }
      return
    }
    res.fx = FX[head]
  },
  // Only when THIS question can chain the last free head. (The Shadow head is never the last one free right after a
  // miss: that miss let the Fire head slip, so only an attack can be its last chance here.)
  hint(s, q) {
    if (!q || q._inserted || q._lastStand) return null
    const left = free(s)
    if (left.length !== 1) return null
    const attack = !!q._attack
    if (left[0] === 'fire') return { icon: '🔥', key: 'lg_hint_shacklesFire', vars: { n: K.bound } }
    if (left[0] === 'iron' && !attack) return { icon: '⛓️', key: 'lg_hint_shacklesIron', vars: { n: K.bound } }
    if (left[0] === 'shadow' && attack) return { icon: '🌑', key: 'lg_hint_shacklesShadow', vars: { n: K.bound } }
    return null
  },
  hud: (s) => {
    const last = free(s).length === 1
    return [
      { type: 'pips', n: s.ab.fire ? 1 : 0, max: 1, icon: '🔥', labelKey: 'lg_hud_shackFire', tone: 'danger', ready: last && !s.ab.fire },
      { type: 'pips', n: s.ab.iron ? 1 : 0, max: 1, icon: '⛓️', labelKey: 'lg_hud_shackIron', tone: 'ink', ready: last && !s.ab.iron },
      { type: 'pips', n: s.ab.shadow ? 1 : 0, max: 1, icon: '🌑', labelKey: 'lg_hud_shackShadow', tone: 'purple', ready: last && !s.ab.shadow },
    ]
  },
  // Each chained head wears a chain muzzle and drops its glare in the art (raids/cerberus.svg lg-ab-<head>-1).
  artState: (s) => ({ 'data-ab-fire': s.ab.fire ? 1 : 0, 'data-ab-iron': s.ab.iron ? 1 : 0, 'data-ab-shadow': s.ab.shadow ? 1 : 0 }),
}
