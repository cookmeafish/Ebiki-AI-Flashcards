// RAID ABILITY (design v2.1, #6). Motif: seraph. Verdicts: the Judge marks every raid question in a visible cycle
// WRATH, MERCY, NONE. Wrath: a right answer deals K.wrath more. Mercy: a miss costs no heart (it still counts as a miss
// and still comes back as an attack); a right answer deals K.grace more (Grace). None: nothing.
// The verdict of a question = cycle[(raid answers so far + phase) % 3], so it is known before answering (the HUD shows
// it and the next two; the tag chip marks the question). A phase line shifts the cycle by one. Attacks and inserted
// questions carry no verdict.
import { tuned } from './_rules'

const K = { wrath: 2, grace: 1, cycle: ['wrath', 'mercy', 'none'] }
const normal = (q) => !!q && !q._attack && !q._inserted && !q._lastStand

// The verdict of the question asked after `answers` raid answers, in `phase` (pure, tested). `k` = the tuning.
export const verdictAt = (answers, phase, k = K) => k.cycle[(((Number(answers) || 0) + (Number(phase) || 1)) % k.cycle.length + k.cycle.length) % k.cycle.length]

const SIGIL = { wrath: { icon: '🔥', tone: 'warning' }, mercy: { icon: '🕊️', tone: 'info' }, none: { icon: '⚖️', tone: 'ink' } }

export default {
  id: 'verdicts', icon: '⚖️', K, fxKeys: ['wrath', 'mercy', 'grace'],
  init: () => ({ wraths: 0, mercies: 0, graces: 0 }),
  onStrike(s, res, hit, ctx) {
    if (ctx.kind !== 'normal') return
    const k = tuned(K, ctx)
    const v = verdictAt(ctx.before.answers, ctx.phase, k)
    if (v === 'wrath' && ctx.right) {
      res.dmg += k.wrath; s.ab.wraths++; res.fx = 'wrath'
    } else if (v === 'mercy' && ctx.right) {
      res.dmg += k.grace; s.ab.graces++; res.fx = 'grace'
    } else if (v === 'mercy') {
      res.lives = 0; s.ab.mercies++; res.fx = 'mercy'
    }
  },
  tag(s, q, ctx) {
    if (!normal(q)) return null
    const k = tuned(K, ctx)
    const v = verdictAt(s.answers, ctx.phase, k)
    if (v === 'wrath') return { icon: SIGIL.wrath.icon, key: 'lg_tag_wrath', vars: { n: k.wrath }, tone: 'warning' }
    if (v === 'mercy') return { icon: SIGIL.mercy.icon, key: 'lg_tag_mercy', tone: 'info' }
    return null
  },
  hud: (s, ctx) => [{ type: 'queue', labelKey: 'lg_hud_verdicts', items: [0, 1, 2].map((i) => ({ ...SIGIL[verdictAt(s.answers + i, ctx.phase, tuned(K, ctx))] })) }],
  artState: (s, ctx) => ({ 'data-ab-verdict': verdictAt(s.answers, ctx.phase, tuned(K, ctx)) }),
}
