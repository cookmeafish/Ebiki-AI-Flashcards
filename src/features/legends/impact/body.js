// HOW A RAID BOSS'S BODY MOVES on the plain fight moments (impact/styles.js `body` names one move per moment): taking
// a hit, landing its strike on the player, and its knockout. Keyframes on the boss box (BossArena), so they compose with
// the art's own idle loop. Every move ends where it starts except a knockout, which ends in the fallen pose (the box
// is replaced by the next boss), never below half opacity (the arena then greys a defeated boss to .6 more), so the result screen's arena is never an empty frame. Pure strings: tested by impact.test.js (every BODY name has its keyframes).
// Since 2026-10 every strike moment has its OWN set (the owner: "every impact needs to be different"): a critical
// knocks the boss back harder than a hit, a Sharpen cuts it, a heavy blow is a bigger lunge than its plain strike, a
// block jars it backwards, a save makes it glance off, Second wind makes it falter. `body.<moment>` in styles.js.
export const BODY_MS = { hit: 520, crit: 640, sharpen: 600, strike: 560, heavy: 720, block: 600, shield: 640, wind: 900, ko: 1300 }

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
// Every knockout opens with the same stagger (a flash and a shudder) so the final blow always lands, then the boss falls
// its own way.
const STAGGER = '0% { transform: none; filter: brightness(1); opacity: 1 } 6% { transform: translateX(-7px) scale(1.06); filter: brightness(3) } 12% { transform: translateX(7px) scale(1.05) } 18% { transform: translateX(-5px) scale(1.04); filter: brightness(1.8) } 24% { transform: translateX(4px) scale(1.03); filter: brightness(1.3) } 30% { transform: none; filter: brightness(1.1) }'
const KO = {
  shatter: '55% { transform: scale(1.08); filter: brightness(2.4) } 62% { transform: scale(.92) rotate(4deg); opacity: .9 } 100% { transform: scale(.72) rotate(8deg) translateY(16px); filter: brightness(1); opacity: .55 }',
  dissolve: '60% { transform: translateY(-6px) skewX(6deg); opacity: .8; filter: blur(0) brightness(1.4) } 100% { transform: translateY(-26px) skewX(-8deg) scale(1.05); opacity: .55; filter: blur(3px) brightness(1.4) }',
  ascend: '60% { transform: translateY(-10px) scale(1.04); filter: brightness(2) } 100% { transform: translateY(-44px) scale(.88); opacity: .55; filter: brightness(1.8) }',
  collapse: '50% { transform: translateY(4px) rotate(-3deg) } 72% { transform: translateY(20px) rotate(-10deg) scale(1.02, .9) } 86% { transform: translateY(16px) rotate(-12deg) } 100% { transform: translateY(22px) rotate(-14deg) scale(.96, .9); opacity: .7 }',
  petrify: '45% { filter: grayscale(.6) brightness(1.2) } 70% { transform: none; filter: grayscale(1) brightness(.9) contrast(1.3) } 78% { transform: translateX(-3px) } 86% { transform: translateX(3px) } 100% { transform: translateY(6px) rotate(-3deg); filter: grayscale(1) brightness(.7) contrast(1.3); opacity: .85 }',
  fall: '60% { transform: rotate(-12deg) translateY(4px) } 82% { transform: rotate(-24deg) translateY(18px) } 90% { transform: rotate(-21deg) translateY(14px) } 100% { transform: rotate(-24deg) translateY(20px) scale(.94); opacity: .75 }',
  bow: '50% { transform: translateY(-4px) } 70% { transform: rotate(4deg) translateY(10px) scale(1, .94) } 100% { transform: rotate(10deg) translateY(28px) scale(.86); opacity: .6 }',
  sink: '55% { transform: translateY(6px) rotate(-4deg) } 100% { transform: translateY(46px) rotate(8deg) scale(.9); opacity: .55; filter: blur(2px) }',
  crumble: '50% { transform: translateX(-2px) } 58% { transform: translateX(2px) } 70% { transform: translateY(10px) scale(1, .9); opacity: .8 } 100% { transform: translateY(36px) scale(1.1, .45); opacity: .55 }',
  burn: '50% { filter: brightness(2.4) saturate(2) sepia(.4) } 75% { transform: translateY(-6px) scale(.96); filter: brightness(1.6) sepia(1) } 100% { transform: translateY(-10px) scale(.84, .74); opacity: .6; filter: brightness(.5) sepia(1) blur(1px) }',
  melt: '50% { transform: scale(1.04, .96) } 75% { transform: translateY(16px) scale(1.18, .7) } 100% { transform: translateY(34px) scale(1.4, .35); opacity: .6 }',
  eclipse: '55% { filter: brightness(.6) } 100% { transform: scale(.9); filter: brightness(.05); opacity: .5 }',
  drop: '42% { transform: translateY(-12px) } 50% { transform: translateY(-14px) rotate(3deg) } 80% { transform: translateY(40px) rotate(-18deg) } 88% { transform: translateY(34px) rotate(-14deg) } 100% { transform: translateY(42px) rotate(-22deg); opacity: .7 }',
  implode: '50% { transform: scale(1.12) } 80% { transform: scale(.3) rotate(160deg); filter: brightness(2.5) } 100% { transform: scale(.45) rotate(240deg); opacity: .6 }',
  pop: '50% { transform: scale(1.22, .9) } 62% { transform: scale(.9, 1.2) } 74% { transform: scale(1.4); filter: brightness(2.6); opacity: 1 } 100% { transform: scale(.9); opacity: .55; filter: brightness(1.3) blur(1px) }',
  flickerOut: '40% { opacity: .2 } 46% { opacity: 1 } 52% { opacity: .1 } 58% { opacity: .9 } 66% { opacity: 0 } 72% { opacity: .7 } 80% { opacity: 0 } 100% { opacity: .5; transform: scale(.96) }',
}
export const BODY_KEYFRAMES = { hit: HIT, crit: CRIT, sharpen: SHARPEN, strike: STRIKE, heavy: HEAVY, block: BLOCK, shield: SHIELD, wind: WIND, ko: KO }
const NAME = { hit: 'lgBodyHit_', crit: 'lgBodyCrit_', sharpen: 'lgBodySharp_', strike: 'lgBodyStrike_', heavy: 'lgBodyHeavy_', block: 'lgBodyBlock_', shield: 'lgBodyShield_', wind: 'lgBodyWind_', ko: 'lgBodyKO_' }
export const bodyAnimName = (moment, name) => `${NAME[moment]}${name}`
// The body key of a strike moment (strikeFx.js): a plain miss plays the boss's strike, a missed attack its heavy blow.
export const BODY_OF_MOMENT = { hit: 'hit', crit: 'crit', sharpen: 'sharpen', hurt: 'strike', hurtBig: 'heavy', block: 'block', shield: 'shield', wind: 'wind', ko: 'ko', strike: 'strike', heavy: 'heavy' }

export const BODY_CSS = Object.entries(BODY_KEYFRAMES).flatMap(([mo, set]) => Object.entries(set).map(([k, v]) => `@keyframes ${NAME[mo]}${k} { ${mo === 'ko' ? STAGGER : ''} ${v} }`)).join('\n')

// The animation shorthand for a boss's body on this moment (a body key or a strike moment; '' = none).
export function bodyAnimation(body, moment) {
  const key = BODY_OF_MOMENT[moment]
  const name = body?.[key]
  if (!name || !BODY_KEYFRAMES[key]?.[name]) return ''
  const ease = key === 'ko' ? 'cubic-bezier(.3,.6,.4,1) both' : 'ease-out'
  return `${bodyAnimName(key, name)} ${BODY_MS[key]}ms ${ease}`
}
