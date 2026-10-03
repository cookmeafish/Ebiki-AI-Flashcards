// RAID ABILITY (design v2.1, #11): Tempest, Storm Measure (`drums`, Zeus's four storm orbs). Family: a fixed rhythm that pays for what you filled.
// Raid answers march on his drums in measures of four. A right answer on beats 1 to 3 lights that beat's drum; the 4th
// beat (whatever the answer) brings the THUNDER: 1 damage per lit drum, then the measure starts again. The beat is a
// clock the learner sees coming (HUD), but it moves only when they answer: no timers.
// Attacks and inserted questions do not advance the beat. A measure with no drum lit ends in a dull rumble (no damage).
const K = { measure: 4, per: 1 }
const DRUMS = K.measure - 1
const normal = (q) => !!q && !q._attack && !q._inserted && !q._lastStand
const drumsOf = (s) => (s.ab && Array.isArray(s.ab.drums) ? s.ab.drums : []) // one entry per beat played: true = lit
const beatOf = (s) => drumsOf(s).length // beats already played in this measure (0..3)
const litOf = (s) => drumsOf(s).filter(Boolean).length
export default {
  id: 'drums', icon: '🔮', K, fxKeys: ['drum', 'dud', 'thunder'],
  sampleHint: { vars: { n: 3 } },
  init: () => ({ drums: [], thunders: 0 }),
  onStrike(s, res, hit, ctx) {
    if (ctx.kind !== 'normal') return
    if (beatOf(s) < DRUMS) {
      s.ab.drums = [...drumsOf(s), !!ctx.right]
      if (ctx.right) { res.fx = 'drum'; res.fxVars = { n: s.ab.drums.length } } else res.fx = 'dud'
      return
    }
    // The 4th beat: the thunder deals the drums lit in this measure, then a new measure.
    const lit = litOf(s)
    if (lit > 0) { res.dmg += lit * K.per; s.ab.thunders = (s.ab.thunders || 0) + 1; res.fx = 'thunder'; res.fxVars = { n: lit * K.per } } else res.fx = 'dud'
    s.ab.drums = []
  },
  // Only on the thunder beat with drums lit: this answer brings the thunder, right or wrong.
  hint: (s, q) => (normal(q) && beatOf(s) === DRUMS && litOf(s) > 0 ? { icon: '⚡', key: 'lg_hint_drums', vars: { n: litOf(s) * K.per } } : null),
  // A row of four drums: three that light, then the thunder drum. 1 = lit, 2 = the beat the next answer plays.
  hud: (s) => {
    const d = drumsOf(s)
    const beat = d.length
    const cells = Array.from({ length: DRUMS }, (_, i) => (i < beat ? (d[i] ? 1 : 0) : i === beat ? 2 : 0))
    cells.push(beat === DRUMS ? 2 : 0)
    return [{ type: 'board', shape: 'row', cells, labelKey: 'lg_hud_drums', vars: { n: litOf(s) }, tone: 'info', ready: beat === DRUMS && litOf(s) > 0 }]
  },
  artState: (s) => ({ 'data-ab-drums': Math.min(DRUMS, litOf(s)) }),
}
