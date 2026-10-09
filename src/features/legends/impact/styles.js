// RAID IMPACT STYLES (pure data, tested by impact.test.js): how each raid boss's plain fight moments look, so a hit, a
// critical, the boss's strike and its knockout read as THAT boss (the owner: "make sure all of these hit hard and are
// unique per raid boss"). The moments themselves come from strikeFx.js; the parts are drawn by impact/parts.jsx.
//   color / accent   the boss's two fixed impact colors (bright, both themes; never theme tokens over the art)
//   glyph            its particle (impact/glyphs.jsx), flung by its hits and its knockout
//   hit              parts played when the player strikes it
//   crit             a critical: its own burst plus its own starburst (points, spin)
//   sharpen          a Sharpened strike: honed blades (angle, count, fan) and the boss's own flavor
//   strike           its own attack on the player (a plain miss)
//   heavy            a missed ATTACK: a bigger, different blow (the ground quakes) than its plain strike
//   block            the player blocked its attack: its own barrier sigil (sides, turn) and what flies off it
//   shield           a Shield saved the heart: the dome, its own glyphs glancing off it
//   wind             Second wind: the heart rising and the boss's own flourish
//   ko               its knockout: a staged CINEMATIC (each part's `at`, ms), that boss's own death told in parts
//   koMs / koPeak    how long the knockout plays and when its climax lands (the shockwave, then the DEFEATED stamp)
//   body             one move per moment (impact/body.js BODY_KEYFRAMES; BossArena plays the strike moment's own)
// EVERY MOMENT LOOKS DIFFERENT (the owner: "every impact needs to be different"): within a boss no two of the 9
// moments share a part list or a body move, and across bosses no two share a moment's part list (impact.test.js).
// A part is [name, params]; parts.jsx knows every name (PARTS).
import { BODY_KEYFRAMES } from './body'
import { BOSS_DATA } from './bosses'
export const MOMENT_KEYS = ['hit', 'crit', 'sharpen', 'strike', 'heavy', 'block', 'shield', 'wind', 'ko']
export const BODY = Object.fromEntries(Object.entries(BODY_KEYFRAMES).map(([k, v]) => [k, Object.keys(v)]))

export const RAID_IMPACT = {
  ...Object.fromEntries(Object.entries(BOSS_DATA).map(([m, d]) => [m, d.style])),
}
// A boss with no style (a newer build's boss): the default look.
export const DEFAULT_IMPACT = {
  color: '#ffd23a', accent: '#1a1020', glyph: 'star4',
  hit: [['burst', { n: 6 }], ['ring', {}]], crit: [['burst', { n: 10 }], ['starburst', {}]], strike: [['claws', { n: 3 }], ['vignette', {}]],
  sharpen: [['blade', {}], ['glint', {}]], heavy: [['quake', {}], ['claws', { n: 5 }]], block: [['sigil', {}], ['sparks', { n: 10 }]],
  shield: [['bubble', {}], ['deflect', {}]], wind: [['heart', {}], ['pulse', {}]],
  ko: [['speedlines', {}], ['flash', { big: true }], ['charge', { at: 150 }], ['burst', { at: 900, n: 14, reach: 1.3 }], ['rays', { at: 900, n: 12 }], ['ring', { at: 950, scale: 2.4 }]],
  koMs: 1900, koPeak: 950,
  body: { hit: 'flinch', crit: 'knock', sharpen: 'gash', strike: 'lunge', heavy: 'pounce', block: 'recoil', shield: 'glance', wind: 'falter', ko: 'fall' },
}
export const impactFor = (motif) => RAID_IMPACT[motif] || DEFAULT_IMPACT

// THE KNOCKOUT'S CLOCK (BossArena's juice and StrikeFxLayer's stamp read it): the cinematic's length, its climax (the
// arena shakes and flashes once more), and the DEFEATED stamp, which slams down KO_STAMP_AFTER ms after the climax
// (landing KO_STAMP_LAND of the way into its own play) and is gone when the cinematic ends.
export const KO_MS_MIN = 1600
export const KO_MS_MAX = 2600
export const KO_STAMP_AFTER = 120
export const KO_STAMP_LAND = 0.09
export function koTiming(motif) {
  const s = impactFor(motif)
  const ms = Math.min(KO_MS_MAX, Math.max(KO_MS_MIN, s.koMs || 1900))
  const peak = Math.min(ms - 700, Math.max(300, s.koPeak || Math.round(ms / 2)))
  const stampAt = peak + KO_STAMP_AFTER
  const stampMs = ms - stampAt
  return { ms, peak, stampAt, stampMs, land: stampAt + Math.round(stampMs * KO_STAMP_LAND) }
}
