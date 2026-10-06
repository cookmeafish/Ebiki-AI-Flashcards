// HOW A RAID BOSS'S BODY MOVES on the plain fight moments (impact/styles.js `body` names one move per moment): taking
// a hit, landing its strike on the player, and its knockout. Keyframes on the boss box (BossArena), so they compose with
// the art's own idle loop. Every move ends where it starts except a knockout, which ends in the fallen pose (the box
// is replaced by the next boss), never below half opacity (the arena then greys a defeated boss to .6 more), so the result screen's arena is never an empty frame. Pure strings: tested by impact.test.js (every BODY name has its keyframes).
export const BODY_MS = { hit: 520, strike: 560, ko: 1300 }

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
export const BODY_KEYFRAMES = { hit: HIT, strike: STRIKE, ko: KO }
const NAME = { hit: 'lgBodyHit_', strike: 'lgBodyStrike_', ko: 'lgBodyKO_' }
export const bodyAnimName = (moment, name) => `${NAME[moment]}${name}`

export const BODY_CSS = [
  ...Object.entries(HIT).map(([k, v]) => `@keyframes ${NAME.hit}${k} { ${v} }`),
  ...Object.entries(STRIKE).map(([k, v]) => `@keyframes ${NAME.strike}${k} { ${v} }`),
  ...Object.entries(KO).map(([k, v]) => `@keyframes ${NAME.ko}${k} { ${STAGGER} ${v} }`),
].join('\n')

// The animation shorthand for a boss's body on this moment ('' = none).
export function bodyAnimation(body, moment) {
  const name = body?.[moment]
  if (!name || !BODY_KEYFRAMES[moment]?.[name]) return ''
  const ease = moment === 'ko' ? 'cubic-bezier(.3,.6,.4,1) both' : 'ease-out'
  return `${bodyAnimName(moment, name)} ${BODY_MS[moment]}ms ${ease}`
}
