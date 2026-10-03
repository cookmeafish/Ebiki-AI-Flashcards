// THE JUICE: how hard an ability's moment hits, as DATA (design v2.1, sections 1.2 and 1.3). Every fx file may give
// a `juice` map, one entry per fx key:
//
//   juice: { sever: { size: 'tick' }, cauterize: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'hydra.cauterize' } }
//
//   size     'tick' | 'medium' | 'big'   how long data-fx, the face layers and the reaction class stay on (JUICE.ms),
//                                        the hit-stop length and the floater size. Default 'big' (the v1 length).
//   shake    0..3   the ARENA box shakes (never the question card): S1 2 px 140 ms, S2 5 px 260 ms, S3 8 px 380 ms.
//   flash    0..2   F1 = brightness(1.8) for one frame; F2 = a white silhouette for two frames + a 25% white veil
//                   over the arena for one frame. At most 2 flashes a second (JUICE.flashGap), whatever the data says.
//   hitstop  0 | 1  the boss's idle motion pauses for 40 ms (medium) or 80 ms (big); a tick never stops.
//   sfx      'boss.key'   a sound cue NAME only (there is no sound yet; nothing plays).
//
// BossArena implements all of it ONCE (useJuice). Effects start JUICE.delay after the answer is judged, live only in
// the arena box, never delay the next question, and fast-fade (JUICE.fade) the moment the next question appears.
// Focus mode, Still bosses and reduced motion (unless "Always animate") skip every part of it.

export const JUICE_SIZES = ['tick', 'medium', 'big']
export const JUICE = {
  ms: { tick: 350, medium: 800, big: 1200 }, // data-fx + the reaction class
  maxMs: 1500, // nothing an ability plays may last longer
  delay: 100, // the arena plays this long after the answer is judged (QuizRunner's feedback comes first)
  floaterDelay: 50, // the floater pops at +150 ms
  linger: 1500, // the overlay and the floater unmount after this (they also end by themselves)
  fade: 200, // the next question appeared: everything still playing fades out over this
  hitstop: { tick: 0, medium: 40, big: 80 },
  shake: { 1: { px: 2, ms: 140 }, 2: { px: 5, ms: 260 }, 3: { px: 8, ms: 380 } },
  flash: { 1: { ms: 17 }, 2: { ms: 34, veil: 0.25, veilMs: 17 } },
  flashGap: 500, // photosensitivity: at most 2 flashes per second
  floaterPx: { tick: 14, medium: 18, big: 26 },
}
export const JUICE_DEFAULT = { size: 'big', shake: 0, flash: 0, hitstop: 0, sfx: '' }

// A juice entry made safe: unknown sizes fall back to the default, numbers are clamped.
export function juiceOf(spec) {
  const j = spec && typeof spec === 'object' ? spec : {}
  const size = JUICE_SIZES.includes(j.size) ? j.size : JUICE_DEFAULT.size
  const clamp = (v, max) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)))
  return { size, ms: JUICE.ms[size], shake: clamp(j.shake, 3), flash: clamp(j.flash, 2), hitstop: clamp(j.hitstop, 1), sfx: typeof j.sfx === 'string' ? j.sfx : '' }
}

// A damped sine, three swings decaying to 0, the same every time (no randomness).
const SWING = [[0, 0, 0], [12, 1, -0.3], [28, -0.8, 0.25], [45, 0.55, -0.15], [62, -0.35, 0.1], [80, 0.15, -0.05], [100, 0, 0]]
const shakeKeyframes = (lvl, px) => `@keyframes lgJuiceShake${lvl} { ${SWING.map(([p, x, y]) => `${p}% { transform: translate(${(x * px).toFixed(2)}px, ${(y * px).toFixed(2)}px) }`).join(' ')} }`

export const JUICE_CSS = `
${Object.entries(JUICE.shake).map(([lvl, s]) => shakeKeyframes(lvl, s.px)).join('\n')}
@keyframes lgJuiceFlash1 { 0%, 99% { filter: brightness(1.8) } 100% { filter: none } }
@keyframes lgJuiceFlash2 { 0%, 99% { filter: brightness(4) saturate(0) } 100% { filter: none } }
@keyframes lgJuiceVeil { 0%, 99% { opacity: ${JUICE.flash[2].veil} } 100% { opacity: 0 } }
@keyframes lgJuicePop { 0% { transform: translateX(-50%) translateY(0) scale(0); opacity: 0 } 8% { opacity: 1 } 24% { transform: translateX(-50%) translateY(-6px) scale(1.25) } 30% { transform: translateX(-50%) translateY(-8px) scale(1) } 72% { opacity: 1 } 100% { transform: translateX(-50%) translateY(-36px) scale(1); opacity: 0 } }
.lg-hitstop, .lg-hitstop * { animation-play-state: paused !important }
`

// The floater's fixed bright fills (never theme tokens over the art), by the fx file's floaterTone.
export const FLOATER_FILL = { purple: '#b48cff', danger: '#ff4a3d', warning: '#ffb43a', success: '#5dff9a', info: '#6fc3ff', brand: '#ff5a72', ink: '#ffffff' }
export const FLOATER_OUTLINE = '#1a1020'
