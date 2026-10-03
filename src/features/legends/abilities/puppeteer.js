// RAID ABILITY (design v2.1, #14): Puppeteer, Stolen Puppets (`puppets`). Family: allies that fight on every answer.
// Every 4th right raid answer cuts a puppet loose and it fights for you (up to 2). On every raid answer, each puppet you
// hold kicks him for 1 FIRST (even on a miss); then a miss lets him yank one back. No puppets without right answers, so
// an all-wrong run never gets a kick (F2). Attacks and inserted questions: no kicks, no steals.
const K = { every: 4, max: 2, kick: 1 }
const normal = (q) => !!q && !q._attack && !q._inserted && !q._lastStand
const puppetsOf = (s) => (s.ab && s.ab.puppets) || 0
const strings = (s) => ((s.ab && s.ab.rights) || 0) % K.every // rights toward the next steal
export default {
  id: 'puppets', icon: '🎭', K, fxKeys: ['kick', 'steal', 'yank'],
  sampleHint: { vars: {} },
  init: () => ({ puppets: 0, rights: 0, steals: 0 }),
  onStrike(s, res, hit, ctx) {
    if (ctx.kind !== 'normal') return
    const held = puppetsOf(s)
    if (held > 0) { res.dmg += held * K.kick; res.fx = 'kick'; res.fxVars = { n: held * K.kick } }
    if (ctx.right) {
      // While both puppets are yours the strings stay slack (the count waits, nothing to steal).
      if (held >= K.max) return
      s.ab.rights = (s.ab.rights || 0) + 1
      if (s.ab.rights % K.every === 0) {
        s.ab.puppets = held + 1
        s.ab.steals = (s.ab.steals || 0) + 1
        res.fx = 'steal'
        res.fxVars = { n: s.ab.puppets }
      }
    } else if (held > 0) {
      s.ab.puppets = held - 1
      res.fx = 'yank'
      res.fxVars = { n: s.ab.puppets }
    }
  },
  // Only when the next right answer cuts a puppet loose.
  hint: (s, q) => (normal(q) && puppetsOf(s) < K.max && strings(s) === K.every - 1 ? { icon: '✂️', key: 'lg_hint_puppets' } : null),
  // Your puppets first (they kick every answer), then the strings toward the next steal (stable order).
  hud: (s) => {
    const full = puppetsOf(s) >= K.max
    return [
      { type: 'pips', n: puppetsOf(s), max: K.max, icon: '🪆', labelKey: 'lg_hud_puppets', vars: { n: puppetsOf(s) }, tone: 'success' },
      { type: 'pips', n: full ? 0 : strings(s), max: K.every - 1, labelKey: 'lg_hud_strings', tone: full ? 'ink' : 'warning', ready: !full && strings(s) === K.every - 1 },
    ]
  },
  artState: (s) => ({ 'data-ab-puppets': puppetsOf(s) }),
}
