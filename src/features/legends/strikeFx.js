// THE IMPACT OF A RAID STRIKE (pure, tested by strikeFx.test.js): what the arena plays for the plain fight moments
// that are not a boss ability (fx/<motif>.jsx plays those): a hit, a critical, a Sharpen, the boss landing a blow, a
// missed attack, a blocked attack, a Shield saving a heart, Second wind, and the knockout. Same data shape as an fx
// file's juice (fx/_juice.js: shake 0..3, flash 0..2, hitstop 0|1, size), so BossArena plays both the same way, with
// the same limits (at most 2 flashes a second; nothing under focus mode, Still bosses or reduced motion).
// An ability's own moment (`last.fx`) wins: the plain impact then plays only for the knockout.
export const STRIKE_FX = {
  hit: { size: 'medium', shake: 1, flash: 0, hitstop: 1 },
  crit: { size: 'big', shake: 2, flash: 1, hitstop: 1 },
  sharpen: { size: 'big', shake: 2, flash: 1, hitstop: 1 },
  hurt: { size: 'medium', shake: 2, flash: 0, hitstop: 0 },
  hurtBig: { size: 'big', shake: 3, flash: 0, hitstop: 0 },
  block: { size: 'medium', shake: 1, flash: 0, hitstop: 1 },
  shield: { size: 'medium', shake: 1, flash: 0, hitstop: 0 },
  wind: { size: 'medium', shake: 0, flash: 0, hitstop: 0 },
  ko: { size: 'big', shake: 3, flash: 2, hitstop: 1 },
}
// The key of the moment for the fight's last strike (`down`: the boss's health just hit 0). '' = nothing to play.
export function strikeMoment(last, { down = false } = {}) {
  if (!last) return ''
  if (down) return 'ko'
  if (last.kind === 'wind') return 'wind'
  if (last.fx) return ''
  if (last.shielded) return 'shield'
  if (last.attack && last.kind === 'hit') return 'block'
  if (last.lives >= 2) return 'hurtBig'
  if (last.lives > 0) return 'hurt'
  if (last.kind !== 'hit' || !(last.damage > 0)) return ''
  if (last.sharpened) return 'sharpen'
  return last.crit ? 'crit' : 'hit'
}
