// HOW A RAID BOSS'S BODY MOVES on the plain fight moments (impact/styles.js `body` names one move per moment): taking
// a hit, landing its strike on the player, and its knockout. Keyframes on the boss box (BossArena), so they compose with
// the art's own idle loop. Every move ends where it starts except a knockout, which ends in the fallen pose (the box
// is replaced by the next boss) and the arena's defeated look, never an empty frame on the result screen (THE KNOCKOUT,
// below). Pure strings: tested by impact.test.js (every BODY name has its keyframes).
// Since 2026-10 every strike moment has its OWN set (the owner: "every impact needs to be different"): a critical
// knocks the boss back harder than a hit, a Sharpen cuts it, a heavy blow is a bigger lunge than its plain strike, a
// block jars it backwards, a save makes it glance off, Second wind makes it falter. `body.<moment>` in styles.js.
import { BOSS_DATA } from './bosses'
export const BODY_MS = { hit: 520, crit: 640, sharpen: 600, strike: 560, heavy: 720, block: 600, shield: 640, wind: 900, ko: 2200 }

const HIT = {
  flinch: '0% { transform: none } 14% { transform: translate(-10px, 4px) rotate(-7deg) scale(.95) } 38% { transform: translate(8px, -2px) rotate(4deg) } 62% { transform: translate(-4px, 0) rotate(-2deg) } 100% { transform: none }',
  clank: '0% { transform: none; filter: brightness(1) } 10% { transform: translate(0, 5px) scale(1.04, .94); filter: brightness(1.9) } 22% { transform: translate(-6px, 0) } 34% { transform: translate(6px, 0) } 46% { transform: translate(-4px, 0); filter: brightness(1.2) } 58% { transform: translate(3px, 0) } 100% { transform: none; filter: brightness(1) }',
  wobble: '0% { transform: none } 15% { transform: scale(1.14, .82) } 32% { transform: scale(.88, 1.12) } 50% { transform: scale(1.07, .94) } 68% { transform: scale(.97, 1.03) } 100% { transform: none }',
  flicker: '0% { opacity: 1; transform: none } 10% { opacity: .2; transform: translateX(-8px) skewX(14deg) } 20% { opacity: 1; transform: translateX(6px) } 30% { opacity: .35; transform: translateX(-4px) skewX(-10deg) } 42% { opacity: 1; transform: none } 54% { opacity: .6 } 66% { opacity: 1 } 100% { opacity: 1; transform: none }',
  reel: '0% { transform: none } 16% { transform: translate(18px, -6px) rotate(11deg) } 40% { transform: translate(-8px, 2px) rotate(-5deg) } 64% { transform: translate(4px, 0) rotate(2deg) } 100% { transform: none }',
  spin: '0% { transform: none } 45% { transform: rotate(330deg) scale(.9) } 70% { transform: rotate(372deg) scale(1.04) } 100% { transform: rotate(360deg) }',
}
const STRIKE = {
  lunge: '0% { transform: none } 25% { transform: translate(0, -6px) scale(.94) } 45% { transform: translate(0, 14px) scale(1.28) } 70% { transform: translate(0, 4px) scale(1.06) } 100% { transform: none }',
  slam: '0% { transform: none } 30% { transform: translateY(-22px) scale(1.05, 1.08) rotate(-3deg) } 46% { transform: translateY(16px) scale(1.18, .84) } 58% { transform: translateY(-4px) scale(.96, 1.05) } 100% { transform: none }',
  swipe: '0% { transform: none } 28% { transform: translateX(16px) rotate(10deg) } 50% { transform: translateX(-22px) rotate(-16deg) scale(1.12) } 74% { transform: translateX(4px) rotate(3deg) } 100% { transform: none }',
  rear: '0% { transform: none } 32% { transform: translateY(-16px) scale(1.12) rotate(-5deg) } 50% { transform: translateY(10px) scale(1.24) rotate(2deg) } 76% { transform: translateY(2px) scale(1.04) } 100% { transform: none }',
  scream: '0% { transform: none } 20% { transform: scale(1.18) } 28% { transform: scale(1.16) translateX(-3px) } 36% { transform: scale(1.2) translateX(3px) } 44% { transform: scale(1.17) translateX(-3px) } 52% { transform: scale(1.2) translateX(3px) } 70% { transform: scale(1.06) } 100% { transform: none }',
  cast: '0% { transform: none; filter: brightness(1) } 30% { transform: translateY(-10px) scale(1.06); filter: brightness(1.7) } 48% { transform: translateY(6px) scale(1.2); filter: brightness(2.1) } 72% { transform: translateY(0) scale(1.04); filter: brightness(1.2) } 100% { transform: none; filter: brightness(1) }',
  surge: '0% { transform: none } 26% { transform: translateX(-14px) skewX(10deg) scale(.95) } 48% { transform: translateX(12px) skewX(-14deg) scale(1.22, 1.08) } 72% { transform: translateX(-3px) skewX(3deg) } 100% { transform: none }',
  dart: '0% { transform: none; opacity: 1 } 20% { transform: translateX(-10px) scale(.9); opacity: .6 } 34% { transform: translate(14px, 10px) scale(1.3); opacity: 1 } 52% { transform: translate(-6px, 2px) scale(1.08) } 100% { transform: none; opacity: 1 }',
}
// A critical: bigger than any hit (knocked back, jolted, flipped), with a bright flash at the peak.
const CRIT = {
  knock: '0% { transform: none; filter: brightness(1) } 12% { transform: translate(14px, -16px) rotate(14deg) scale(.9); filter: brightness(2.2) } 34% { transform: translate(-10px, 6px) rotate(-8deg) scale(1.06); filter: brightness(1.3) } 58% { transform: translate(4px, -2px) rotate(3deg) } 100% { transform: none; filter: brightness(1) }',
  jolt: '0% { transform: none; filter: brightness(1) } 8% { transform: translateX(-9px) scale(1.06); filter: brightness(2.6) } 16% { transform: translateX(9px); filter: brightness(1) } 24% { transform: translateX(-7px); filter: brightness(2.2) } 32% { transform: translateX(7px); filter: brightness(1) } 40% { transform: translateX(-4px); filter: brightness(1.8) } 52% { transform: translateX(3px); filter: brightness(1) } 100% { transform: none; filter: brightness(1) }',
  whiplash: '0% { transform: none } 10% { transform: rotate(-20deg) translate(-6px, -10px) scale(1.05) } 30% { transform: rotate(14deg) translate(8px, 2px) } 50% { transform: rotate(-7deg) } 70% { transform: rotate(3deg) } 100% { transform: none }',
  buckle: '0% { transform: none; filter: brightness(1) } 14% { transform: translateY(14px) scale(1.16, .74); filter: brightness(2) } 30% { transform: translateY(-12px) scale(.9, 1.14); filter: brightness(1) } 48% { transform: translateY(4px) scale(1.05, .95) } 100% { transform: none }',
  twirl: '0% { transform: none; filter: brightness(1) } 18% { transform: scaleX(-1) scale(.9) rotate(-10deg); filter: brightness(2.2) } 38% { transform: scaleX(1) scale(1.08) rotate(6deg); filter: brightness(1.2) } 62% { transform: scaleX(.94) rotate(-2deg) } 100% { transform: none; filter: brightness(1) }',
  stun: '0% { transform: none; filter: brightness(1) } 12% { transform: scale(1.14) rotate(4deg); filter: brightness(2.4) } 28% { transform: rotate(-6deg) translateX(-5px) } 44% { transform: rotate(6deg) translateX(5px) } 60% { transform: rotate(-4deg) translateX(-3px) } 76% { transform: rotate(2deg) } 100% { transform: none; filter: brightness(1) }',
}
// A Sharpen: the honed blade CUTS (a diagonal shear, a white edge flash), never a plain flinch.
const SHARPEN = {
  gash: '0% { transform: none; filter: brightness(1) } 10% { transform: skew(-14deg, 6deg) translate(-8px, 6px); filter: brightness(2.8) contrast(1.3) } 28% { transform: skew(8deg, -3deg) translate(6px, -4px); filter: brightness(1.4) } 52% { transform: skew(-3deg, 1deg) } 100% { transform: none; filter: brightness(1) }',
  sever: '0% { transform: none; filter: brightness(1) } 12% { transform: translate(-12px, -6px) skewY(-10deg); filter: brightness(2.6) } 26% { transform: translate(10px, 6px) skewY(8deg) } 44% { transform: translate(-4px, -2px) skewY(-3deg); filter: brightness(1.2) } 100% { transform: none; filter: brightness(1) }',
  carve: '0% { transform: none; filter: brightness(1) } 16% { transform: rotate(-11deg) translate(10px, 8px) scale(.94); filter: brightness(2.4) } 36% { transform: rotate(5deg) translate(-6px, -3px) } 60% { transform: rotate(-2deg) } 100% { transform: none; filter: brightness(1) }',
  nick: '0% { transform: none; filter: brightness(1) } 6% { transform: translate(3px, -3px) scale(.97); filter: brightness(3) } 12% { transform: translate(-3px, 3px) } 18% { transform: translate(2px, -2px); filter: brightness(1.6) } 26% { transform: translate(-1px, 1px) } 40% { transform: none; filter: brightness(1.2) } 100% { transform: none; filter: brightness(1) }',
  split: '0% { transform: none; filter: brightness(1) } 14% { transform: scale(.82, 1.1) skewX(-12deg); filter: brightness(2.6) } 30% { transform: scale(1.12, .94) skewX(8deg); filter: brightness(1.3) } 52% { transform: scale(.97, 1.02) skewX(-2deg) } 100% { transform: none; filter: brightness(1) }',
}
// A heavy blow (the player missed an attack): the boss commits its whole weight, far past its plain strike.
const HEAVY = {
  pounce: '0% { transform: none } 22% { transform: translateY(-30px) scale(.92) rotate(-6deg) } 40% { transform: translateY(20px) scale(1.34) rotate(3deg) } 56% { transform: translateY(8px) scale(1.18) } 76% { transform: translateY(-3px) scale(1.04) } 100% { transform: none }',
  crush: '0% { transform: none } 28% { transform: translateY(-34px) scale(1.12, 1.16) } 42% { transform: translateY(22px) scale(1.36, .7) } 50% { transform: translate(-6px, 18px) scale(1.3, .74) } 58% { transform: translate(6px, 14px) scale(1.2, .82) } 78% { transform: translateY(-2px) scale(.98, 1.03) } 100% { transform: none }',
  loom: '0% { transform: none; filter: brightness(1) } 34% { transform: scale(1.32) translateY(10px); filter: brightness(.55) contrast(1.4) } 52% { transform: scale(1.3) translateY(12px) } 74% { transform: scale(1.08); filter: brightness(.9) } 100% { transform: none; filter: brightness(1) }',
  charge: '0% { transform: none } 20% { transform: translateX(-20px) scale(.9) } 40% { transform: translateX(26px) scale(1.34) skewX(-8deg) } 58% { transform: translateX(14px) scale(1.16) skewX(-3deg) } 80% { transform: translateX(-2px) } 100% { transform: none }',
  overreach: '0% { transform: none } 26% { transform: rotate(-16deg) translate(-8px, -12px) scale(1.06) } 44% { transform: rotate(18deg) translate(16px, 14px) scale(1.34) } 62% { transform: rotate(6deg) translate(4px, 4px) scale(1.12) } 100% { transform: none }',
  quake: '0% { transform: none } 18% { transform: translateY(-14px) scale(1.12) } 34% { transform: translate(-10px, 10px) scale(1.3) } 42% { transform: translate(10px, 10px) scale(1.3) } 50% { transform: translate(-8px, 8px) scale(1.26) } 58% { transform: translate(8px, 6px) scale(1.2) } 70% { transform: translate(-4px, 2px) scale(1.08) } 100% { transform: none }',
}
// A block (the player answered the boss's attack): its own attack bounces back into it.
const BLOCK = {
  recoil: '0% { transform: none } 22% { transform: translateY(8px) scale(1.12) } 40% { transform: translateY(-16px) scale(.84) rotate(-6deg) } 60% { transform: translateY(-4px) scale(.96) rotate(2deg) } 100% { transform: none }',
  stumble: '0% { transform: none } 24% { transform: translate(6px, 4px) scale(1.08) } 42% { transform: translate(-16px, -6px) rotate(-10deg) scale(.9) } 58% { transform: translate(-10px, 2px) rotate(-4deg) } 76% { transform: translate(-3px, 0) rotate(1deg) } 100% { transform: none }',
  jar: '0% { transform: none; filter: brightness(1) } 20% { transform: scale(1.1); filter: brightness(1.8) } 30% { transform: scale(.92) translateY(-6px) } 38% { transform: scale(.96) translate(-4px, -4px) } 46% { transform: scale(.94) translate(4px, -4px) } 60% { transform: scale(.98); filter: brightness(1) } 100% { transform: none }',
  rebound: '0% { transform: none } 26% { transform: translateX(10px) scale(1.12) skewX(-6deg) } 46% { transform: translateX(-20px) scale(.88) skewX(10deg) } 66% { transform: translateX(-6px) skewX(2deg) } 100% { transform: none }',
  reel: '0% { transform: none } 20% { transform: rotate(6deg) scale(1.08) } 44% { transform: rotate(-14deg) translateY(-8px) scale(.9) } 64% { transform: rotate(5deg) } 82% { transform: rotate(-2deg) } 100% { transform: none }',
}
// A save (a Shield took the heart): the blow lands on the dome and the boss glances off it.
const SHIELD = {
  ricochet: '0% { transform: none } 26% { transform: translateY(10px) scale(1.16) } 38% { transform: translate(14px, -10px) scale(.94) rotate(12deg) } 56% { transform: translate(6px, -4px) rotate(4deg) } 100% { transform: none }',
  glance: '0% { transform: none } 24% { transform: translateX(-6px) scale(1.14) skewX(6deg) } 38% { transform: translateX(16px) scale(1.02) skewX(-12deg) } 58% { transform: translateX(4px) skewX(-2deg) } 100% { transform: none }',
  rebuff: '0% { transform: none; filter: brightness(1) } 24% { transform: scale(1.18) translateY(6px) } 34% { transform: scale(.86) translateY(-10px); filter: brightness(1.6) saturate(.6) } 56% { transform: scale(.96) translateY(-2px); filter: brightness(1) } 100% { transform: none }',
  skid: '0% { transform: none } 22% { transform: translateY(8px) scale(1.12, .94) } 40% { transform: translate(-14px, 2px) rotate(-8deg) scale(.96) } 54% { transform: translate(-18px, 2px) rotate(-6deg) } 74% { transform: translate(-6px, 0) rotate(-2deg) } 100% { transform: none }',
}
// Second wind (the player got a heart back): the boss falters, unsure.
const WIND = {
  falter: '0% { transform: none } 30% { transform: translateY(6px) rotate(-4deg) scale(.96) } 50% { transform: translateY(2px) rotate(3deg) } 70% { transform: rotate(-1deg) } 100% { transform: none }',
  sway: '0% { transform: none } 25% { transform: translateX(-10px) skewX(6deg) } 50% { transform: translateX(8px) skewX(-5deg) } 75% { transform: translateX(-3px) skewX(2deg) } 100% { transform: none }',
  shrink: '0% { transform: none; filter: brightness(1) } 35% { transform: scale(.88) translateY(6px); filter: brightness(.75) } 65% { transform: scale(.94) translateY(3px); filter: brightness(.9) } 100% { transform: none; filter: brightness(1) }',
  dim: '0% { transform: none; filter: brightness(1) saturate(1) } 40% { transform: translateY(4px); filter: brightness(.6) saturate(.5) } 70% { filter: brightness(.85) saturate(.8) } 100% { transform: none; filter: brightness(1) saturate(1) }',
}
// THE KNOCKOUT (2026-10, the owner: "make every single boss defeated animation very dramatic ... unique per boss" and
// "very creative"): each raid boss dies ITS OWN way over its whole cinematic (styles.js koMs, the parts staged with
// it), never a shared fall. Every knockout opens on the killing blow: the boss is struck into a pose and FROZEN there,
// white hot (the hit-stop, 3% to 12%), then its own story plays out and it ends in its fallen pose.
// Every frame names the same filter list (KO_FILTER), so the browser blends the frames, and the last one, smoothly; the
// last frame IS the arena's defeated look (grayscale(.8) opacity(.6), BossArena), so nothing jumps when the cinematic
// ends. The boss keeps at least a quarter of its opacity in every frame and half at the end, and its fallen pose stays
// inside its frame and headroom (impact.test.js).
const KO_FILTER = (o = {}) => `grayscale(${o.g ?? 0}) opacity(${o.o ?? 1}) brightness(${o.b ?? 1}) saturate(${o.s ?? 1}) sepia(${o.sp ?? 0}) contrast(${o.c ?? 1}) blur(${o.bl ?? 0}px) hue-rotate(${o.h ?? 0}deg)`
export const KO_DOWN = { g: 0.8, o: 0.6 }
const DOWN = KO_DOWN
// The timing of every segment unless a frame names its own (a fall accelerates: FALL).
export const KO_EASE = 'cubic-bezier(.3,.6,.4,1)'
const FALL = 'cubic-bezier(.55,0,.9,.45)'
// [percent, transform, opacity, filter, the next segment's timing]
const frames = (list) => list.map(([p, tr, op, f, ease]) => `${p}% { transform: ${tr}; opacity: ${op}; filter: ${KO_FILTER(f)}${ease ? `; animation-timing-function: ${ease}` : ''} }`).join(' ')
// The killing blow: struck into `pose` and frozen there, white hot, before anything else moves. `hot` (0..1) tames it
// for a pale boss (a white drawing at full heat is a white blob).
const blow = (pose, hot = 1) => [[0, 'none', 1, {}], [3, pose, 1, { b: 1 + 1.6 * hot, s: 1.4 }], [12, pose, 1, { b: 1 + hot, s: 1.3 }]]
const ko = (pose, rest, opts = {}) => frames([...blow(pose, opts.hot ?? 1), ...rest])
// [pose, frames, { hot }]. Exported for the tests (every frame's numbers are checked).
export const KO_FRAMES = {
  // Chronos: time stops. It ticks in jerks like a stopped clock, a flash as its face shatters, then tips over.
  timeStop: ['translate(-8px, 2px) rotate(-5deg) scale(1.05)', [
    [16, 'translate(-6px, 2px) rotate(-3deg) scale(1.04)', 1, { b: 1.5 }, 'steps(1, end)'],
    [24, 'translate(-4px, 2px) rotate(-1deg) scale(1.03)', 1, { b: 1.2, sp: 0.4 }, 'steps(1, end)'],
    [32, 'translate(-2px, 2px) rotate(1.5deg) scale(1.03)', 1, { b: 1.1, sp: 0.6 }, 'steps(1, end)'],
    [40, 'translate(0, 2px) rotate(-1deg) scale(1.02)', 1, { b: 1, sp: 0.8 }, 'steps(1, end)'],
    [48, 'translate(0, 2px) rotate(2deg) scale(1.02)', 1, { b: 1, sp: 0.9, c: 1.2 }],
    [59, 'translate(0, 0) scale(1.07)', 1, { b: 2.6, sp: 0.5 }],
    [64, 'translate(0, 6px) rotate(-4deg) scale(.95)', 1, { b: 1.3, sp: 0.4, g: 0.3 }, FALL],
    [100, 'translate(-4px, 16px) rotate(-9deg) scale(.9)', 1, DOWN],
  ]],
  // The Banshee: one last scream that shakes it, cut off dead (silence), then it drifts up like a ghost.
  silence: ['translateY(-4px) scale(1.12)', [
    [16, 'translate(-3px, -4px) scale(1.16)', 1, { b: 1.6, s: 1.6 }],
    [20, 'translate(3px, -4px) scale(1.17)', 1, { b: 1.6, s: 1.6 }],
    [24, 'translate(-3px, -4px) scale(1.16)', 1, { b: 1.7, s: 1.6 }],
    [28, 'translate(3px, -4px) scale(1.18)', 1, { b: 1.7, s: 1.6 }],
    [32, 'translate(-2px, -4px) scale(1.17)', 1, { b: 1.8, s: 1.6 }],
    [36, 'translate(2px, -4px) scale(1.19)', 1, { b: 1.8, s: 1.6 }, 'steps(1, end)'],
    [40, 'translate(0, 0) scale(1)', 1, { b: 0.8, s: 0.4 }],
    [52, 'translate(0, -2px) scale(1)', 1, { b: 0.9, s: 0.3, g: 0.4 }],
    [55, 'translateY(-8px) scale(1.05)', 0.85, { b: 1.8, bl: 1, g: 0.4 }],
    [80, 'translateY(-22px) skewX(-6deg) scale(1.04)', 0.7, { b: 1.3, bl: 1.2, g: 0.6 }],
    [100, 'translateY(-14px) skewX(-3deg) scale(.96)', 0.85, DOWN],
  ]],
  // The Seraph: lifted into its own light, its wings catch fire, and it falls from grace.
  fallFromGrace: ['translateY(-8px) scale(1.06)', [
    [18, 'translateY(-12px) scale(1.05)', 1, { b: 1.8 }],
    [40, 'translateY(-24px) scale(1.06)', 1, { b: 2, s: 1.2 }],
    [48, 'translateY(-26px) rotate(2deg) scale(1.06)', 1, { b: 1.7, sp: 0.5, s: 2 }],
    [56, 'translateY(-24px) rotate(-3deg) scale(1.04)', 1, { b: 1.4, sp: 0.9, s: 1.6 }, FALL],
    [76, 'translateY(16px) rotate(7deg) scale(.95)', 1, { b: 0.8, sp: 0.6, g: 0.4 }],
    [83, 'translateY(10px) rotate(5deg) scale(.96)', 1, { b: 0.85, sp: 0.4, g: 0.5 }],
    [100, 'translateY(16px) rotate(8deg) scale(.93)', 1, DOWN],
  ], { hot: 0.4 }],
  // The Titan: a jolt for every armor plate blown off, it teeters, then goes over with a THUD.
  topple: ['translateX(10px) rotate(3deg)', [
    [16, 'translate(4px, 0) rotate(1deg)', 1, { b: 1.4 }],
    [20, 'translate(-5px, -2px) rotate(-2deg)', 1, { b: 1.5 }],
    [25, 'translate(1px, 0) rotate(0deg)', 1, { b: 1.1 }],
    [28, 'translate(5px, -2px) rotate(2deg)', 1, { b: 1.5 }],
    [33, 'translate(0, 0) rotate(0deg)', 1, { b: 1.1 }],
    [36, 'translate(-6px, -1px) rotate(-2deg)', 1, { b: 1.5 }],
    [41, 'translate(1px, 0) rotate(0deg)', 1, { b: 1.1 }],
    [44, 'translate(6px, -2px) rotate(2deg)', 1, { b: 1.5 }],
    [50, 'translate(0, 0) rotate(-2deg)', 1, { b: 1.1 }],
    [55, 'translate(-3px, 0) rotate(-5deg)', 1, {}],
    [59, 'translate(0, 1px) rotate(1deg)', 1, {}, FALL],
    [65, 'translate(4px, 20px) rotate(12deg) scale(1.04, .86)', 1, { b: 1.8 }],
    [71, 'translate(4px, 13px) rotate(10deg) scale(.99, .95)', 1, { b: 1.1 }],
    [77, 'translate(4px, 19px) rotate(11deg) scale(1.01, .9)', 1, { g: 0.3 }],
    [100, 'translate(4px, 18px) rotate(11deg) scale(1, .91)', 1, DOWN],
  ]],
  // The Vampire: it clutches itself, swells with stolen blood and bursts apart into bats, then gathers, spent.
  batBurst: ['translateX(-6px) rotate(-7deg) scale(1.05)', [
    [18, 'translateY(3px) rotate(-3deg) scale(.97)', 1, { b: 1.2, s: 1.5 }],
    [30, 'translateY(5px) scale(.93)', 1, { b: 0.9, s: 1.8, h: -10 }],
    [42, 'translateY(4px) rotate(2deg) scale(.95)', 1, { b: 1.1, s: 2.2, h: -10 }],
    [52, 'translateY(-4px) scale(1.12)', 1, { b: 1.8, s: 2 }],
    [57, 'translateY(-8px) scale(1.2)', 0.62, { b: 2.4, bl: 1.5 }],
    [72, 'translateY(-10px) scale(1.06)', 0.65, { b: 1.3, bl: 1.2, g: 0.3 }],
    [100, 'translateY(-4px) scale(.96)', 0.9, DOWN],
  ]],
  // The Gorgon: frozen mid-recoil while stone climbs it (motionless), a tremor, it cracks and slumps.
  stoneSet: ['translateX(-6px) rotate(-3deg)', [
    [16, 'translateX(-6px) rotate(-3deg)', 1, { g: 0.1, c: 1.1 }],
    [50, 'translateX(-6px) rotate(-3deg)', 1, { g: 1, c: 1.4, b: 0.95 }],
    [54, 'translateX(-3px) rotate(-3deg)', 1, { g: 1, c: 1.4 }],
    [57, 'translateX(-8px) rotate(-3deg)', 1, { g: 1, c: 1.4 }],
    [60, 'translateX(-4px) rotate(-3deg)', 1, { g: 1, c: 1.4, b: 1.2 }],
    [63, 'translate(-6px, 4px) rotate(-4deg) scale(1, .97)', 1, { g: 1, c: 1.3, b: 1.45 }],
    [72, 'translate(-6px, 10px) rotate(-5deg) scale(.99, .92)', 1, { g: 1, c: 1.3, b: 0.85 }],
    [100, 'translate(-6px, 12px) rotate(-5deg) scale(.98, .9)', 1, DOWN],
  ]],
  // The Chimera: three last roars (lion, goat, serpent), it staggers, and crashes onto its side.
  threeRoars: ['translate(-8px, -4px) rotate(-6deg)', [
    [14, 'translateY(-6px) scale(1.12)', 1, { b: 1.6 }],
    [22, 'translateY(0) scale(1.02)', 1, { b: 1.1 }],
    [28, 'translate(4px, -4px) rotate(5deg) scale(1.1)', 1, { b: 1.5 }],
    [36, 'translate(2px, 0) rotate(2deg) scale(1.01)', 1, { b: 1 }],
    [43, 'translate(-4px, -3px) rotate(-5deg) scale(1.09)', 1, { b: 1.5, h: 30 }],
    [51, 'translate(-2px, 0) rotate(-3deg) scale(1)', 1, { b: 0.9 }],
    [56, 'translate(6px, 4px) rotate(6deg) scale(1)', 1, { b: 0.9 }, FALL],
    [61, 'translate(-10px, 20px) rotate(-24deg) scale(.95)', 1, { b: 1.8 }],
    [67, 'translate(-8px, 15px) rotate(-20deg) scale(.96)', 1, { b: 1 }],
    [74, 'translate(-10px, 20px) rotate(-24deg) scale(.95)', 1, { g: 0.3 }],
    [100, 'translate(-10px, 20px) rotate(-24deg) scale(.95)', 1, DOWN],
  ]],
  // The Rat King: its crown flies off, it reels about dizzy, and flops forward, squashed, on its face.
  dethroned: ['translateX(8px) rotate(8deg)', [
    [16, 'translate(4px, -6px) rotate(4deg)', 1, { b: 1.5 }],
    [24, 'translate(-4px, 0) rotate(-9deg)', 1, { b: 1.1 }],
    [32, 'translate(5px, 0) rotate(10deg)', 1, {}],
    [40, 'translate(-5px, 2px) rotate(-10deg)', 1, {}],
    [48, 'translate(4px, 2px) rotate(8deg)', 1, {}],
    [54, 'translate(0, 2px) rotate(-4deg)', 1, {}, FALL],
    [59, 'translate(10px, 18px) rotate(28deg) scale(1.03, .88)', 1, { b: 1.8, s: 1.3 }],
    [65, 'translate(9px, 12px) rotate(24deg) scale(1, .94)', 1, {}],
    [71, 'translate(10px, 18px) rotate(28deg) scale(1.02, .9)', 1, { g: 0.3 }],
    [100, 'translate(10px, 18px) rotate(27deg) scale(1, .9)', 1, DOWN],
  ]],
  // The Showman: it staggers, draws itself up for the audience, takes the deep final bow, and collapses into it.
  curtainCall: ['translate(6px, -4px) rotate(6deg)', [
    [18, 'translate(2px, 0) rotate(2deg)', 1, { b: 1.3 }],
    [26, 'translate(-3px, 2px) rotate(-4deg) scale(.98)', 1, {}],
    [34, 'translateY(-4px) scale(1.05)', 1, { b: 1.2, s: 1.3 }],
    [42, 'translateY(-4px) scale(1.05)', 1, { b: 1.2, s: 1.3 }],
    [52, 'translateY(10px) rotate(18deg) scale(1, .93)', 1, { b: 1 }],
    [60, 'translateY(10px) rotate(17deg) scale(1, .93)', 1, { b: 1 }, FALL],
    [66, 'translate(6px, 22px) rotate(26deg) scale(.9)', 1, { b: 1.6 }],
    [100, 'translate(6px, 22px) rotate(24deg) scale(.9)', 1, DOWN],
  ]],
  // The Reaper: it shivers, its scythe snaps (a flash), and its cloak empties and folds to the ground.
  reaped: ['translateX(-10px) skewX(8deg)', [
    [16, 'translateX(-6px) skewX(5deg)', 1, { b: 1.5 }],
    [22, 'translateX(-3px) skewX(-3deg)', 1, { b: 1.1 }],
    [28, 'translateX(-5px) skewX(3deg)', 1, { b: 1.1 }],
    [34, 'translateY(-4px) scale(1.06)', 1, { b: 1.9, s: 1.4 }],
    [42, 'translateY(-2px) scale(1.02)', 1, { b: 1, s: 0.6 }],
    [50, 'translateY(4px) scale(1.02, .95)', 1, { b: 0.9, s: 0.5 }, FALL],
    [57, 'translateY(24px) scale(1.08, .72)', 0.82, { b: 1.8, s: 0.4, bl: 1 }],
    [72, 'translateY(22px) scale(1.06, .74)', 0.78, { b: 1, bl: 1, g: 0.4 }],
    [100, 'translateY(22px) scale(1.05, .74)', 0.85, DOWN],
  ]],
  // The Leviathan: it thrashes, rolls, goes under, bobs back up once, and settles low in the water.
  founder: ['translate(10px, -6px) rotate(8deg)', [
    [18, 'translate(4px, -2px) rotate(-6deg)', 1, { b: 1.4 }],
    [26, 'translate(-4px, 0) rotate(7deg)', 1, { b: 1.1 }],
    [34, 'translate(4px, 2px) rotate(-6deg)', 1, {}],
    [42, 'translate(-2px, 4px) rotate(5deg)', 1, { h: 10 }],
    [52, 'translate(0, 10px) rotate(-12deg) scale(.98)', 1, { b: 0.9, h: 15 }, FALL],
    [61, 'translate(2px, 26px) rotate(10deg) scale(.94)', 0.8, { b: 1.8, bl: 1.5, h: 20 }],
    [70, 'translate(2px, 19px) rotate(8deg) scale(.95)', 0.85, { b: 1, bl: 1, h: 15 }],
    [78, 'translate(2px, 24px) rotate(11deg) scale(.94)', 0.9, { bl: 0.5, g: 0.3 }],
    [100, 'translate(2px, 24px) rotate(11deg) scale(.93)', 1, DOWN],
  ]],
  // The Lich: it floats, pulsing with its phylactery, and when that breaks its bones drop into a heap.
  unbound: ['translateY(-6px) rotate(3deg) scale(1.04)', [
    [18, 'translateY(-10px) scale(1.04)', 1, { b: 1.3, h: -15 }],
    [26, 'translateY(-12px) scale(1)', 1, { b: 1 }],
    [34, 'translateY(-13px) scale(1.06)', 1, { b: 1.4, h: -15 }],
    [40, 'translateY(-13px) scale(1)', 1, { b: 1 }],
    [46, 'translateY(-14px) scale(1.07)', 1, { b: 1.4, h: -15 }],
    [50, 'translateY(-14px) scale(1)', 1, { b: 1 }],
    [54, 'translateY(-15px) scale(1.08)', 1, { b: 1.5, h: -15 }],
    [59, 'translateY(-15px) scale(1.1)', 1, { b: 2.6, s: 1.5 }, FALL],
    [66, 'translateY(16px) scale(1.04, .78)', 1, { b: 1.2 }],
    [72, 'translateY(12px) scale(1.02, .84)', 1, { b: 1 }],
    [100, 'translateY(18px) scale(1.08, .68)', 1, DOWN],
  ]],
  // Cerberus: it strains against its chain, lurches forward when the chain snaps, stumbles, and goes down heavy.
  unchained: ['translate(8px, 4px) rotate(5deg)', [
    [16, 'translate(0, -2px) scale(1.04)', 1, { b: 1.5 }],
    [30, 'translate(0, -6px) scale(1.08)', 1, { b: 1.3, s: 1.4 }],
    [34, 'translate(-2px, -6px) scale(1.09)', 1, { b: 1.4, s: 1.4 }],
    [36, 'translate(0, 8px) scale(1.12)', 1, { b: 1.9 }],
    [44, 'translate(-6px, 4px) rotate(-10deg)', 1, { b: 1.1 }],
    [52, 'translate(6px, 4px) rotate(8deg)', 1, { b: 1 }],
    [57, 'translate(0, 6px) rotate(-3deg)', 1, { s: 0.6 }, FALL],
    [64, 'translate(-4px, 20px) rotate(-17deg) scale(1.03, .88)', 1, { b: 1.6 }],
    [70, 'translate(-4px, 15px) rotate(-14deg) scale(1, .93)', 1, {}],
    [100, 'translate(-4px, 19px) rotate(-16deg) scale(1.01, .9)', 1, DOWN],
  ]],
  // The Tempest: its light gutters twice like a failing storm, one last bolt flares, and it burns out, dim.
  burnout: ['translateX(-9px) skewX(10deg)', [
    [16, 'translateX(3px) skewX(-4deg)', 1, { b: 1.3 }],
    [21, 'translateX(-2px) skewX(0deg)', 0.5, { b: 0.7 }],
    [27, 'translateX(2px) skewX(3deg)', 1, { b: 1.2 }],
    [38, 'translateX(-1px) skewX(0deg)', 0.55, { b: 0.7, s: 0.6 }],
    [44, 'translateX(1px) skewX(0deg)', 1, { b: 1, s: 0.6 }],
    [50, 'translateX(0) skewX(0deg)', 0.8, { b: 0.7, s: 0.5 }],
    [55, 'translateX(0) skewX(0deg) scale(1.06)', 1, { b: 2.6, s: 0.5 }],
    [62, 'translateY(4px) scale(.95)', 0.7, { b: 0.6, s: 0.4, bl: 1.5 }],
    [80, 'translateY(6px) scale(.94)', 0.75, { b: 0.7, bl: 1, g: 0.4 }],
    [100, 'translateY(6px) scale(.94)', 1, DOWN],
  ]],
  // The Dreamer: a jelly wobble, it swells up like a bubble and POPS, coming back small and blurred.
  popped: ['scale(1.18, .86)', [
    [18, 'scale(.9, 1.12)', 1, { b: 1.4 }],
    [25, 'scale(1.1, .92)', 1, { b: 1.1 }],
    [32, 'scale(.94, 1.07)', 1, {}],
    [39, 'scale(1.05, .96)', 1, {}],
    [46, 'scale(1.02)', 1, {}, 'cubic-bezier(.6,0,.9,.5)'],
    [54, 'scale(1.24)', 1, { b: 2.2, s: 1.5 }],
    [57, 'scale(.84)', 0.72, { b: 1.6, bl: 1.2 }],
    [70, 'translateY(4px) scale(.9)', 0.78, { bl: 0.8, g: 0.3 }],
    [100, 'translateY(6px) scale(.92)', 0.9, DOWN],
  ]],
  // The Berserker: it refuses to fall (a last roar, one more step), then the knees go and it drops to one knee.
  lastStand: ['translate(-12px, 4px) rotate(-8deg)', [
    [18, 'translate(-4px, -6px) scale(1.1)', 1, { b: 1.5, s: 1.6 }],
    [26, 'translate(0, -8px) scale(1.1)', 1, { b: 1.3, s: 1.6 }],
    [34, 'translate(6px, -2px) scale(1.04)', 1, { b: 1.1, s: 1.3 }],
    [42, 'translate(6px, 8px) scale(1, .93)', 1, { b: 1 }],
    [48, 'translate(6px, 4px) scale(1, .97)', 1, {}],
    [54, 'translate(6px, 8px) rotate(3deg) scale(1, .93)', 1, { s: 0.8 }, FALL],
    [61, 'translate(8px, 22px) rotate(7deg) scale(.98, .84)', 1, { b: 1.8 }],
    [68, 'translate(8px, 18px) rotate(6deg) scale(.98, .88)', 1, {}],
    [100, 'translate(8px, 21px) rotate(7deg) scale(.98, .85)', 1, DOWN],
  ]],
  // Inferno: it flares up, sputters, flares one last time, and gutters down to embers.
  gutterOut: ['translateY(-4px) scale(1.1)', [
    [20, 'translateY(-6px) scale(1.16)', 1, { b: 1.7, s: 2 }],
    [30, 'translateY(-6px) scale(1.04, 1.1)', 1, { b: 1.5, s: 1.8 }],
    [38, 'translateY(-2px) scale(1.12, .96)', 1, { b: 1.2, s: 1.5 }],
    [44, 'translateY(0) scale(1.02)', 1, { b: 0.9, s: 1.2 }],
    [50, 'translateY(-4px) scale(1.1)', 1, { b: 1.4, s: 1.6 }],
    [54, 'translateY(2px) scale(.98)', 1, { b: 0.8, sp: 0.4 }, 'cubic-bezier(.5,0,.8,.5)'],
    [59, 'translateY(-2px) scale(1.05)', 1, { b: 2.2, s: 1.6 }],
    [72, 'translateY(14px) scale(.86, .74)', 1, { b: 0.5, sp: 0.9 }],
    [100, 'translateY(16px) scale(.84, .7)', 1, DOWN],
  ]],
  // The Swarm Queen: she buzzes in place while her swarm deserts her, left hollow and faint, and sinks.
  scattered: ['translate(7px, -5px) rotate(4deg)', [
    [15, 'translate(-2px, 1px)', 1, { b: 1.3 }],
    [18, 'translate(2px, -1px)', 1, { b: 1.2 }],
    [21, 'translate(-2px, 0)', 1, {}],
    [24, 'translate(2px, 1px)', 1, {}],
    [27, 'translate(-1px, -1px)', 1, {}],
    [30, 'translate(2px, 0)', 1, {}],
    [33, 'translate(-2px, 1px)', 1, {}],
    [36, 'translate(1px, -1px)', 1, {}],
    [44, 'translate(0, 0) scale(.96)', 0.88, { s: 0.8 }],
    [52, 'translate(0, 4px) scale(.92)', 0.72, { s: 0.6, c: 0.9 }],
    [57, 'translate(0, 4px) scale(.94)', 0.72, { b: 1.8, s: 0.6 }],
    [70, 'translate(0, 12px) scale(.9, .86)', 0.75, { s: 0.5, g: 0.3 }],
    [100, 'translate(0, 14px) scale(.9, .84)', 0.95, DOWN],
  ]],
  // Moonmaw: the eclipse darkens it to a silhouette, the diamond ring flares once, and it settles in the dark.
  totality: ['translate(-8px, -6px) rotate(-6deg)', [
    [18, 'translate(-4px, -3px) rotate(-4deg)', 1, { b: 1.2 }],
    [55, 'translate(0, 2px) rotate(-1deg) scale(.96)', 1, { b: 0.25, s: 0.6 }],
    [60, 'translate(0, 2px) rotate(0deg) scale(1.02)', 1, { b: 0.3, s: 0.6 }],
    [63, 'translate(0, 0) rotate(0deg) scale(1.06)', 1, { b: 2.4, s: 0.8 }],
    [70, 'translate(0, 4px) rotate(0deg) scale(.95)', 1, { b: 0.6 }],
    [100, 'translate(0, 10px) rotate(0deg) scale(.9)', 1, DOWN],
  ]],
  // The Hydra: a jerk for each head that falls (left, right, left, right, the last), then the body sinks.
  severed: ['translate(-6px, -4px) rotate(-4deg)', [
    [20, 'translate(-2px, -2px) rotate(-2deg)', 1, { b: 1.3 }],
    [38, 'translate(0, 0) rotate(0deg)', 1, {}],
    [42, 'translate(-3px, 3px) rotate(-3deg)', 1, { b: 1.3 }],
    [46, 'translate(-1px, 2px) rotate(-1deg)', 1, {}],
    [49, 'translate(3px, 5px) rotate(3deg)', 1, { b: 1.3 }],
    [53, 'translate(1px, 4px) rotate(1deg)', 1, {}],
    [56, 'translate(-3px, 7px) rotate(-3deg) scale(.99)', 1, { b: 1.3 }],
    [59, 'translate(-1px, 6px) rotate(-1deg) scale(.99)', 1, {}],
    [62, 'translate(3px, 9px) rotate(3deg) scale(.98)', 1, { b: 1.3 }, FALL],
    [66, 'translate(4px, 22px) rotate(10deg) scale(.95)', 1, { b: 1.8 }],
    [72, 'translate(4px, 18px) rotate(8deg) scale(.96)', 1, {}],
    [100, 'translate(4px, 22px) rotate(10deg) scale(.94)', 1, DOWN],
  ]],
  // The Kaleidoscope: it twists back and forth through every color, then shatters at full white.
  refract: ['rotate(12deg) scale(.94)', [
    [18, 'rotate(4deg) scale(1)', 1, { b: 1.3, h: 40 }],
    [30, 'rotate(-14deg) scale(1.03)', 1, { b: 1.3, h: 120 }],
    [42, 'rotate(16deg) scale(1.03)', 1, { b: 1.4, h: 220 }],
    [50, 'rotate(-6deg) scale(1.05)', 1, { b: 1.6, h: 300 }],
    [55, 'rotate(0deg) scale(1.1)', 1, { b: 2.8, h: 360 }],
    [60, 'rotate(6deg) scale(.9)', 1, { b: 1.2, s: 0.6, h: 360 }],
    [100, 'translateY(8px) rotate(8deg) scale(.88)', 1, DOWN],
  ]],
  // The Puppeteer: hoisted on its strings, swaying limp, the strings are cut and it drops like a stone.
  cutStrings: ['translateY(-10px) rotate(-6deg)', [
    [16, 'translateY(-14px) rotate(-2deg)', 1, { b: 1.4 }],
    [26, 'translateY(-14px) rotate(5deg)', 1, { b: 1.1 }],
    [36, 'translateY(-15px) rotate(-5deg)', 1, {}],
    [44, 'translateY(-15px) rotate(3deg)', 1, {}],
    [50, 'translateY(-16px) rotate(0deg)', 1, { b: 1.5 }, 'cubic-bezier(.6,0,1,.6)'],
    [58, 'translate(-2px, 24px) rotate(-16deg)', 1, { b: 1.6 }],
    [63, 'translate(-2px, 16px) rotate(-11deg)', 1, {}],
    [68, 'translate(-2px, 24px) rotate(-18deg)', 1, {}],
    [73, 'translate(-2px, 21px) rotate(-16deg)', 1, {}],
    [100, 'translate(-2px, 24px) rotate(-19deg) scale(.96)', 1, DOWN],
  ]],
  // The Sugar Queen: a wobble, she softens, sags and melts into a wide, flat puddle of herself.
  melted: ['scale(1.14, .88)', [
    [18, 'scale(.94, 1.06)', 1, { b: 1.3 }],
    [26, 'scale(1.06, .95)', 1, {}],
    [34, 'translateY(2px) scale(1.02)', 1, { b: 1.1, s: 1.3 }],
    [46, 'translateY(8px) scale(1.08, .92)', 1, { b: 1.1, s: 1.4 }],
    [59, 'translateY(14px) scale(1.16, .82)', 1, { b: 1.8, s: 1.6 }],
    [78, 'translateY(24px) scale(1.28, .66)', 1, { b: 1, s: 1.2 }],
    [100, 'translateY(26px) scale(1.3, .64)', 1, DOWN],
  ]],
  // The Kitsune: it rises as its tails fan out, then spins away in a pirouette of foxfire and comes to rest.
  foxfire: ['translate(8px, -6px) rotate(8deg)', [
    [18, 'translate(2px, -8px) rotate(2deg) scale(1.04)', 1, { b: 1.5 }],
    [36, 'translate(0, -10px) rotate(0deg) scale(1.06)', 1, { b: 1.6, s: 1.4 }],
    [44, 'translate(0, -6px) rotate(-90deg) scale(.95)', 0.85, { b: 1.5, h: -30 }],
    [52, 'translate(0, -2px) rotate(-200deg) scale(.86)', 0.7, { b: 1.6, bl: 1, h: -60 }],
    [60, 'translate(0, 2px) rotate(-330deg) scale(.82)', 0.6, { b: 2.2, bl: 1.5, h: -30 }],
    [70, 'translate(0, 6px) rotate(-360deg) scale(.9)', 0.75, { b: 1.1, bl: 0.5 }],
    [100, 'translate(0, 10px) rotate(-364deg) scale(.9)', 0.95, DOWN],
  ]],
  // The Ophanim: its wheels slow, its light folds in on itself in one last flare, and it dims and tilts.
  eyeShut: ['rotate(-4deg) scale(1.08)', [
    [18, 'rotate(-2deg) scale(1.04)', 1, { b: 1.8 }],
    [40, 'rotate(-6deg) scale(1.02)', 1, { b: 1.5 }],
    [56, 'rotate(-9deg) scale(.98)', 1, { b: 1.2 }],
    [60, 'rotate(-10deg) scale(.9)', 1, { b: 0.7 }, 'cubic-bezier(.6,0,.9,.4)'],
    [63, 'rotate(-8deg) scale(1.06)', 1, { b: 2.6 }],
    [70, 'translateY(4px) rotate(-7deg) scale(.95)', 1, { b: 0.6 }],
    [100, 'translateY(8px) rotate(-6deg) scale(.92)', 1, DOWN],
  ], { hot: 0.3 }],
  // The Void: it is dragged into its own singularity, spiraling small, then spat back out in a burst of light.
  eventHorizon: ['skewX(-8deg) scale(1.1)', [
    [18, 'rotate(-6deg) scale(1)', 1, { b: 1.4, h: 20 }, 'cubic-bezier(.6,0,.9,.6)'],
    [54, 'rotate(-50deg) scale(.62)', 0.8, { b: 1.6, h: 40, c: 1.2 }],
    [57, 'rotate(-56deg) scale(.58)', 0.75, { b: 1, h: 40 }],
    [59, 'rotate(-24deg) scale(1.14)', 1, { b: 2.6 }],
    [66, 'rotate(-8deg) scale(.95)', 1, { b: 1.1 }],
    [100, 'translateY(6px) rotate(-6deg) scale(.92)', 1, DOWN],
  ]],
  // A boss with no style of its own (a newer build's boss): a plain heavy fall.
  fall: ['translateX(-8px) rotate(-6deg)', [
    [20, 'translateX(-4px) rotate(-3deg)', 1, { b: 1.4 }],
    [40, 'translateX(4px) rotate(5deg)', 1, {}, FALL],
    [55, 'translate(-8px, 20px) rotate(-22deg) scale(.95)', 1, { b: 1.8 }],
    [64, 'translate(-6px, 15px) rotate(-18deg) scale(.96)', 1, {}],
    [100, 'translate(-8px, 20px) rotate(-22deg) scale(.95)', 1, DOWN],
  ]],
}
const KO = Object.fromEntries(Object.entries(KO_FRAMES).map(([name, [pose, rest, opts]]) => [name, ko(pose, rest, opts)]))
// The shared moves, plus every raid boss's OWN moves (impact/bosses/<motif>.js `body`, keyframe strings, named
// <motif><Move>): a boss's style may name either.
const SHARED_BODY = { hit: HIT, crit: CRIT, sharpen: SHARPEN, strike: STRIKE, heavy: HEAVY, block: BLOCK, shield: SHIELD, wind: WIND, ko: KO }
export const BODY_KEYFRAMES = Object.fromEntries(Object.entries(SHARED_BODY).map(([mo, set]) => [mo, {
  ...set, ...Object.assign({}, ...Object.values(BOSS_DATA).map((d) => d.body?.[mo] || {})),
}]))
const NAME = { hit: 'lgBodyHit_', crit: 'lgBodyCrit_', sharpen: 'lgBodySharp_', strike: 'lgBodyStrike_', heavy: 'lgBodyHeavy_', block: 'lgBodyBlock_', shield: 'lgBodyShield_', wind: 'lgBodyWind_', ko: 'lgBodyKO_' }
export const bodyAnimName = (moment, name) => `${NAME[moment]}${name}`
// The body key of a strike moment (strikeFx.js): a plain miss plays the boss's strike, a missed attack its heavy blow.
export const BODY_OF_MOMENT = { hit: 'hit', crit: 'crit', sharpen: 'sharpen', hurt: 'strike', hurtBig: 'heavy', block: 'block', shield: 'shield', wind: 'wind', ko: 'ko', strike: 'strike', heavy: 'heavy' }

export const BODY_CSS = Object.entries(BODY_KEYFRAMES).flatMap(([mo, set]) => Object.entries(set).map(([k, v]) => `@keyframes ${NAME[mo]}${k} { ${v} }`)).join('\n')

// The animation shorthand for a boss's body on this moment (a body key or a strike moment; '' = none). A knockout plays
// over the boss's whole cinematic (`ms`: styles.js koMs) and starts with its staged parts (`delay`: JUICE.delay).
export function bodyAnimation(body, moment, ms = 0, delay = 0) {
  const key = BODY_OF_MOMENT[moment]
  const name = body?.[key]
  if (!name || !BODY_KEYFRAMES[key]?.[name]) return ''
  if (key === 'ko') return `${bodyAnimName(key, name)} ${Math.round(ms || BODY_MS.ko)}ms ${KO_EASE} ${Math.round(delay)}ms both`
  return `${bodyAnimName(key, name)} ${BODY_MS[key]}ms ease-out`
}
