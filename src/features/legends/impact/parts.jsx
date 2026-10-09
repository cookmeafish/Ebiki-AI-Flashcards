// THE IMPACT PARTS: the pieces a raid boss's impact style (impact/styles.js) is built from. Each part is a function
// (params, ctx) -> elements; ctx = { color, accent, glyph, scale, speed }. Everything is CSS (and inline SVG) inside the
// boss box, sized in container units of the impact layer (cqw = 1% of the boss box), so a part looks the same at any
// arena size. Deterministic (no Math.random): the same moment looks the same every time. Fixed bright colors over the
// art (both themes). Nothing here may last longer than ~1.4 s (fx/_juice.js JUICE.maxMs and the layer's linger), except
// the knockout's parts, which play staged over the boss's whole death (styles.js koMs, at most KO_MS_MAX).
import { cloneElement, isValidElement } from 'react'
import { Glyph } from './glyphs'
import { BOSS_PARTS, BOSS_PARTS_CSS } from './bosses/allParts'

const RAINBOW = ['#ff4a4a', '#ffb23a', '#ffe94a', '#5dff9a', '#4ac8ff', '#9a6bff']
const CONFETTI = ['#ff4fb0', '#ffe94a', '#4ac8ff', '#5dff9a', '#ff8a3a', '#ffffff']
// A fixed pseudo-random number in [0, 1) for part i (salted per part kind).
const rnd = (i, salt = 1) => { const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453; return x - Math.floor(x) }
const deg = (rad) => (rad * 180) / Math.PI

export const PARTS_CSS = `
@keyframes lgiMove { 0% { transform: translate(calc(var(--x0) * 1cqw), calc(var(--y0) * 1cqw)) rotate(var(--r0)) scale(var(--s0)); opacity: 0 }
  10% { opacity: 1 } 72% { opacity: var(--o-mid, 1) }
  100% { transform: translate(calc(var(--x1) * 1cqw), calc(var(--y1) * 1cqw)) rotate(var(--r1)) scale(var(--s1)); opacity: 0 } }
@keyframes lgiArcPath { 0% { transform: translate(calc(var(--x0) * 1cqw), calc(var(--y0) * 1cqw)) rotate(var(--r0)) scale(var(--s0)); opacity: 0 }
  8% { opacity: 1 } 45% { transform: translate(calc(var(--xm) * 1cqw), calc(var(--ym) * 1cqw)) rotate(calc((var(--r0) + var(--r1)) / 2)) scale(var(--s1)) }
  85% { opacity: 1 } 100% { transform: translate(calc(var(--x1) * 1cqw), calc(var(--y1) * 1cqw)) rotate(var(--r1)) scale(var(--s1)); opacity: 0 } }
@keyframes lgiRing { 0% { transform: translate(-50%, -50%) scale(var(--s0, .2)); opacity: .95 } 100% { transform: translate(-50%, -50%) scale(var(--s1, 1.8)); opacity: 0 } }
@keyframes lgiSpark { 0% { transform: rotate(var(--a)) translateX(4cqw) scaleX(.2); opacity: 0 } 15% { opacity: 1 } 100% { transform: rotate(var(--a)) translateX(calc(var(--r) * 1cqw)) scaleX(1); opacity: 0 } }
@keyframes lgiSlash { 0% { transform: translate(-50%, -50%) rotate(var(--a)) scaleX(0); opacity: 0 } 18% { opacity: 1 } 40% { transform: translate(-50%, -50%) rotate(var(--a)) scaleX(1); opacity: 1 } 100% { transform: translate(-50%, -50%) rotate(var(--a)) scaleX(1); opacity: 0 } }
@keyframes lgiFade { 0% { opacity: 0 } 18% { opacity: 1 } 100% { opacity: 0 } }
@keyframes lgiSpin { 0% { transform: translate(-50%, -50%) rotate(var(--r0)) scale(var(--s0, 1)); opacity: 0 } 12% { opacity: 1 } 80% { opacity: 1 } 100% { transform: translate(-50%, -50%) rotate(var(--r1)) scale(var(--s1, 1)); opacity: 0 } }
@keyframes lgiPillar { 0% { transform: translateX(-50%) scaleX(0); opacity: 0 } 15% { transform: translateX(-50%) scaleX(1.25); opacity: 1 } 35% { transform: translateX(-50%) scaleX(.9) } 100% { transform: translateX(-50%) scaleX(0); opacity: 0 } }
@keyframes lgiDrop { 0% { transform: translateY(-110%) scaleY(1.6); opacity: 0 } 30% { transform: translateY(0) scaleY(.85); opacity: 1 } 42% { transform: translateY(-6%) scaleY(1.05) } 55% { transform: none } 100% { transform: none; opacity: 0 } }
@keyframes lgiDraw { 0% { stroke-dashoffset: var(--len); opacity: 1 } 45% { stroke-dashoffset: 0; opacity: 1 } 100% { stroke-dashoffset: 0; opacity: 0 } }
@keyframes lgiFlicker { 0% { opacity: 0 } 8% { opacity: 1 } 16% { opacity: .25 } 24% { opacity: 1 } 36% { opacity: .4 } 46% { opacity: 1 } 100% { opacity: 0 } }
@keyframes lgiCone { 0% { transform: translateX(-50%) scale(.2, .1); opacity: 0 } 20% { opacity: 1 } 55% { transform: translateX(-50%) scale(1, 1); opacity: 1 } 100% { transform: translateX(-50%) scale(1.1, 1.15); opacity: 0 } }
@keyframes lgiBand { 0% { transform: scaleX(0); opacity: 0 } 12% { opacity: 1 } 45% { transform: scaleX(1); opacity: 1 } 100% { transform: scaleX(1) scaleY(.2); opacity: 0 } }
@keyframes lgiSweep { 0% { transform: translateX(-120cqw) skewX(-12deg); opacity: 0 } 15% { opacity: 1 } 70% { opacity: 1 } 100% { transform: translateX(110cqw) skewX(8deg); opacity: 0 } }
@keyframes lgiJaw { 0% { transform: translate(var(--jx), var(--jy)); opacity: 0 } 25% { opacity: 1; transform: translate(var(--jx), var(--jy)) } 48% { transform: translate(0, 0) } 56% { transform: translate(calc(var(--jx) * -.06), calc(var(--jy) * -.06)) } 64% { transform: translate(0, 0) } 100% { transform: translate(0, 0); opacity: 0 } }
@keyframes lgiStab { 0% { transform: translateY(-60cqw) scale(.8); opacity: 0 } 30% { opacity: 1 } 46% { transform: translateY(0) scale(1.05) } 54% { transform: translateY(2cqw) scale(1) } 80% { transform: translateY(-8cqw); opacity: 1 } 100% { transform: translateY(-30cqw); opacity: 0 } }
@keyframes lgiSlam { 0% { transform: translate(-50%, -150%) scale(.9); opacity: 0 } 25% { opacity: 1 } 42% { transform: translate(-50%, -50%) scale(1.2, .8) } 52% { transform: translate(-50%, -54%) scale(.95, 1.06) } 62% { transform: translate(-50%, -50%) scale(1) } 85% { opacity: 1 } 100% { transform: translate(-50%, -46%) scale(1); opacity: 0 } }
@keyframes lgiProjectile { 0% { transform: translate(-50%, -50%) scale(.15) rotate(-20deg); opacity: 0 } 15% { opacity: 1 } 60% { transform: translate(-50%, -20%) scale(1.4) rotate(10deg); opacity: 1 } 75% { transform: translate(-50%, 0%) scale(2.4) rotate(0); opacity: .9 } 100% { transform: translate(-50%, 10%) scale(3) rotate(0); opacity: 0 } }
@keyframes lgiCurtainL { 0% { transform: translateX(-100%) } 45% { transform: translateX(0) } 80% { transform: translateX(0); opacity: 1 } 100% { transform: translateX(0); opacity: 0 } }
@keyframes lgiCurtainR { 0% { transform: translateX(100%) } 45% { transform: translateX(0) } 80% { transform: translateX(0); opacity: 1 } 100% { transform: translateX(0); opacity: 0 } }
@keyframes lgiEclipse { 0% { transform: translate(40cqw, -50%) scale(.9); opacity: 0 } 20% { opacity: 1 } 55% { transform: translate(-50%, -50%) scale(1) } 80% { transform: translate(-50%, -50%) scale(1.05); opacity: 1 } 100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0 } }
@keyframes lgiOrbit { 0% { transform: translate(-50%, -50%) rotate(0deg); opacity: 0 } 12% { opacity: 1 } 60% { transform: translate(-50%, -50%) rotate(300deg) } 100% { transform: translate(-50%, -50%) rotate(420deg); opacity: 0 } }
@keyframes lgiOrbitIn { 0%, 55% { transform: translateX(calc(var(--r) * 1cqw)) scale(1) } 85% { transform: translateX(0) scale(1.6) } 100% { transform: translateX(0) scale(.4) } }
@keyframes lgiOrbitOut { 0%, 45% { transform: translateX(calc(var(--r) * 1cqw)) scale(1) } 100% { transform: translateX(calc(var(--r) * 3cqw)) scale(1.4) } }
@keyframes lgiHalo { 0% { transform: translate(-50%, -50%) rotate(var(--r0)) scale(var(--s0), calc(var(--s0) * .32)); opacity: 0 } 15% { opacity: 1 } 70% { opacity: 1 } 100% { transform: translate(-50%, -50%) rotate(var(--r1)) scale(var(--s1), calc(var(--s1) * .32)); opacity: 0 } }
@keyframes lgiBubble { 0% { transform: translate(-50%, -50%) scale(.3); opacity: 0 } 22% { transform: translate(-50%, -50%) scale(1.08); opacity: .95 } 34% { transform: translate(-50%, -50%) scale(.94, 1.04) } 44% { transform: translate(-50%, -50%) scale(1.03, .97) } 80% { opacity: .8 } 100% { transform: translate(-50%, -50%) scale(1.3); opacity: 0 } }
@keyframes lgiBlade { 0% { transform: translateX(-60cqw) scaleX(.3); opacity: 0 } 18% { opacity: 1 } 55% { transform: translateX(10cqw) scaleX(1); opacity: 1 } 100% { transform: translateX(60cqw) scaleX(.6); opacity: 0 } }
@keyframes lgiTwinkle { 0% { transform: rotate(var(--r0)) scale(0); opacity: 0 } 35% { transform: rotate(calc(var(--r1) / 2)) scale(1.2); opacity: 1 } 100% { transform: rotate(var(--r1)) scale(0); opacity: 0 } }
@keyframes lgiQuake { 0% { transform: translate(-50%, -50%) scale(.15, .3); opacity: 1 } 70% { opacity: .8 } 100% { transform: translate(-50%, -50%) scale(2.1, 1.2); opacity: 0 } }
@keyframes lgiPulse { 0% { transform: translate(-50%, -50%) scale(.4); opacity: 0 } 18% { transform: translate(-50%, -50%) scale(1.05); opacity: 1 } 34% { transform: translate(-50%, -50%) scale(.85); opacity: .7 } 52% { transform: translate(-50%, -50%) scale(1.25); opacity: .9 } 100% { transform: translate(-50%, -50%) scale(1.7); opacity: 0 } }
@keyframes lgiDrip { 0% { transform: scaleY(0); opacity: 0 } 15% { opacity: 1 } 60% { transform: scaleY(1) } 100% { transform: scaleY(1.15) translateY(14cqw); opacity: 0 } }
@keyframes lgiGate { 0% { opacity: 0 } 100% { opacity: 1 } }
@keyframes lgkSpeed { 0% { transform: scale(1.3); opacity: 0 } 6% { transform: scale(1); opacity: 1 } 55% { transform: scale(.97); opacity: .9 } 100% { transform: scale(.9); opacity: 0 } }
@keyframes lgkCore { 0% { transform: scale(.1); opacity: 0 } 20% { opacity: .85 } 75% { transform: scale(.8); opacity: 1 } 88% { transform: scale(1.3); opacity: 1 } 100% { transform: scale(1.7); opacity: 0 } }
@keyframes lgkDial { 0% { transform: scale(.5) rotate(20deg); opacity: 0 } 12% { transform: scale(1.06) rotate(-2deg); opacity: .95 } 20% { transform: scale(1) rotate(0deg) } 60% { transform: scale(1) rotate(0deg); opacity: .95 } 64% { transform: scale(1.03) rotate(-5deg) } 68% { transform: scale(1) rotate(3deg); animation-timing-function: cubic-bezier(.5,0,.9,.5) } 100% { transform: translateY(42cqw) rotate(-34deg) scale(.86); opacity: 0 } }
@keyframes lgkFlat { 0% { transform: scaleY(1.6); opacity: 0 } 8% { opacity: 1 } 42% { transform: scaleY(1) } 52% { transform: scaleY(.02) } 88% { transform: scaleY(.02); opacity: 1 } 100% { transform: scaleY(.02); opacity: 0 } }
@keyframes lgkWing { 0% { transform: rotate(55deg) scale(.4); opacity: 0; filter: brightness(1) saturate(1) sepia(0) hue-rotate(0deg) } 18% { transform: rotate(-10deg) scale(1.05); opacity: .92; filter: brightness(1) saturate(1) sepia(0) hue-rotate(0deg) } 30% { transform: rotate(-5deg) scale(1) } 50% { filter: brightness(1.9) saturate(2.4) sepia(.5) hue-rotate(0deg) } 72% { opacity: .85; filter: brightness(.65) saturate(3) sepia(1) hue-rotate(-25deg) } 100% { transform: rotate(22deg) translateY(16cqw) scale(.9); opacity: 0; filter: brightness(.4) saturate(1) sepia(1) hue-rotate(-25deg) } }
@keyframes lgkBlast { 0% { transform: scale(.1); opacity: 0 } 15% { transform: scale(1.1); opacity: 1 } 100% { transform: scale(1.7); opacity: 0 } }
@keyframes lgkFront { 0% { transform: translateY(100cqw); opacity: 0 } 8% { opacity: 1 } 70% { transform: translateY(0); opacity: 1 } 84% { opacity: .9 } 100% { transform: translateY(-8cqw); opacity: 0 } }
@keyframes lgkRoar { 0% { transform: scale(.3) rotate(0deg); opacity: 0 } 12% { transform: scale(.9) rotate(calc(var(--rr) * .2)); opacity: 1 } 100% { transform: scale(1.9) rotate(var(--rr)); opacity: 0 } }
@keyframes lgkCrown { 0% { transform: translate(0, -28cqw) rotate(0deg); opacity: 0; animation-timing-function: cubic-bezier(.2,.8,.4,1) } 6% { opacity: 1 }
  22% { transform: translate(-6cqw, -54cqw) rotate(-50deg); animation-timing-function: cubic-bezier(.5,0,.9,.5) } 46% { transform: translate(6cqw, 32cqw) rotate(-210deg); animation-timing-function: cubic-bezier(.2,.8,.4,1) }
  54% { transform: translate(10cqw, 20cqw) rotate(-250deg); animation-timing-function: cubic-bezier(.5,0,.9,.5) } 62% { transform: translate(14cqw, 32cqw) rotate(-300deg); animation-timing-function: cubic-bezier(.2,.8,.4,1) }
  67% { transform: translate(16cqw, 27cqw) rotate(-322deg); animation-timing-function: cubic-bezier(.5,0,.9,.5) } 72% { transform: translate(18cqw, 32cqw) rotate(-345deg); animation-timing-function: linear }
  90% { transform: translate(40cqw, 32cqw) rotate(-560deg); opacity: 1 } 100% { transform: translate(48cqw, 32cqw) rotate(-640deg); opacity: 0 } }
@keyframes lgkSpot { 0% { transform: translateX(-50%) scaleX(1.4); opacity: 0 } 14% { transform: translateX(-50%) scaleX(1); opacity: .8 } 62% { transform: translateX(-50%) scaleX(.5); opacity: .8 } 70% { transform: translateX(-50%) scaleX(.45); opacity: 1 } 74% { opacity: 0 } 100% { transform: translateX(-50%) scaleX(.45); opacity: 0 } }
@keyframes lgkScytheA { 0% { transform: scale(.6) rotate(-30deg); opacity: 0 } 14% { transform: scale(1) rotate(0deg); opacity: 1 } 40% { transform: rotate(5deg) } 46% { transform: translate(-2cqw, -2cqw) rotate(-8deg); animation-timing-function: cubic-bezier(.5,0,.9,.5) } 100% { transform: translate(-34cqw, 42cqw) rotate(-130deg); opacity: 0 } }
@keyframes lgkScytheB { 0% { transform: scale(.6) rotate(-30deg); opacity: 0 } 14% { transform: scale(1) rotate(0deg); opacity: 1 } 40% { transform: rotate(5deg) } 46% { transform: translate(2cqw, 2cqw) rotate(8deg); animation-timing-function: cubic-bezier(.5,0,.9,.5) } 100% { transform: translate(26cqw, 46cqw) rotate(90deg); opacity: 0 } }
@keyframes lgkFlood { 0% { transform: translateY(100%); opacity: 0 } 10% { opacity: .9 } 45% { transform: translateY(18%) } 58% { transform: translateY(26%) } 72% { transform: translateY(14%) } 86% { opacity: .9 } 100% { transform: translateY(100%); opacity: 0 } }
@keyframes lgkSlosh { 0%, 100% { transform: translateX(-6cqw) } 50% { transform: translateX(6cqw) } }
@keyframes lgkGem { 0% { transform: scale(.2); opacity: 0 } 12% { transform: scale(1.1); opacity: 1 } 20% { transform: scale(1) } 34% { transform: scale(1.12) } 40% { transform: scale(1) } 52% { transform: scale(1.16) } 57% { transform: scale(1) } 66% { transform: scale(1.22) } 70% { transform: scale(1) } 76% { transform: scale(1.32); opacity: 1 } 80% { transform: scale(1.42); opacity: 0 } 100% { transform: scale(1.42); opacity: 0 } }
@keyframes lgkChainL { 0% { transform: translateX(-60cqw); opacity: 0 } 18% { transform: translateX(0); opacity: 1 } 38% { transform: translateX(-1.5cqw) } 42% { transform: translateX(1cqw) } 46% { transform: translateX(0) rotate(0deg); animation-timing-function: cubic-bezier(.5,0,.9,.5) } 100% { transform: translate(-10cqw, 30cqw) rotate(55deg); opacity: 0 } }
@keyframes lgkChainR { 0% { transform: translateX(60cqw); opacity: 0 } 18% { transform: translateX(0); opacity: 1 } 38% { transform: translateX(1.5cqw) } 42% { transform: translateX(-1cqw) } 46% { transform: translateX(0) rotate(0deg); animation-timing-function: cubic-bezier(.5,0,.9,.5) } 100% { transform: translate(10cqw, 30cqw) rotate(-55deg); opacity: 0 } }
@keyframes lgkGutter { 0% { transform: scale(.6); opacity: 0 } 10% { transform: scale(1.15); opacity: 1 } 30% { transform: scale(1) } 45% { transform: scale(1.08, .9) } 60% { transform: scale(.7); opacity: .95 } 68% { transform: scale(.85) } 85% { transform: scale(.25); opacity: .7 } 100% { transform: translateY(-6cqw) scale(0); opacity: 0 } }
@keyframes lgkBubbleLife { 0% { transform: scale(0); opacity: 0 } 14% { transform: scale(1.06); opacity: 1 } 24% { transform: scale(.94, 1.06) } 34% { transform: scale(1.04, .96) } 44% { transform: scale(1) } 86% { transform: scale(1.06); opacity: 1 } 90% { transform: scale(1.3); opacity: 0 } 100% { transform: scale(1.3); opacity: 0 } }
@keyframes lgkAxe { 0% { transform: translate(-14cqw, -80cqw) rotate(-160deg); opacity: 0; animation-timing-function: cubic-bezier(.5,0,.9,.5) } 8% { opacity: 1 }
  42% { transform: translate(20cqw, 24cqw) rotate(160deg); animation-timing-function: ease-out } 47% { transform: translate(20cqw, 24cqw) rotate(150deg) } 53% { transform: translate(20cqw, 24cqw) rotate(166deg) }
  59% { transform: translate(20cqw, 24cqw) rotate(155deg) } 65% { transform: translate(20cqw, 24cqw) rotate(161deg) } 72% { transform: translate(20cqw, 24cqw) rotate(158deg) } 88% { opacity: 1 } 100% { transform: translate(20cqw, 24cqw) rotate(158deg); opacity: 0 } }
@keyframes lgkBead { 0% { transform: scale(0) rotate(0deg); opacity: 0 } 40% { transform: scale(1.7) rotate(45deg); opacity: 1 } 60% { transform: scale(1) rotate(60deg); opacity: 1 } 100% { transform: scale(.5) rotate(90deg); opacity: 0 } }
@keyframes lgkHead { 0% { transform: translateY(-24cqw); opacity: 0 } 14% { transform: translateY(0); opacity: 1 } 34% { transform: rotate(calc(var(--sd) * -6deg)) } 50% { transform: rotate(calc(var(--sd) * 8deg)); animation-timing-function: cubic-bezier(.5,0,.9,.5) } 62% { transform: rotate(calc(var(--sd) * 72deg)) } 70% { transform: rotate(calc(var(--sd) * 60deg)) } 78% { transform: rotate(calc(var(--sd) * 70deg)); opacity: 1 } 100% { transform: rotate(calc(var(--sd) * 78deg)) translateY(26cqw); opacity: 0 } }
@keyframes lgkMandala { 0% { transform: scale(.3) rotate(0deg); opacity: 0 } 14% { transform: scale(1) rotate(40deg); opacity: .9 } 70% { transform: scale(1.04) rotate(230deg); opacity: .9 } 76% { transform: scale(1.14) rotate(250deg); opacity: 1 } 80% { transform: scale(1.22) rotate(258deg); opacity: 0 } 100% { transform: scale(1.22) rotate(258deg); opacity: 0 } }
@keyframes lgkSnip { 0% { transform: rotate(calc(var(--s) * 38deg)) scale(.6); opacity: 0 } 14% { transform: rotate(calc(var(--s) * 38deg)) scale(1); opacity: 1 } 40% { transform: rotate(calc(var(--s) * 38deg)) } 50% { transform: rotate(0deg) } 58% { transform: rotate(calc(var(--s) * 22deg)) } 66% { transform: rotate(0deg) } 88% { transform: rotate(0deg); opacity: 1 } 100% { transform: translateY(-10cqw) rotate(0deg); opacity: 0 } }
@keyframes lgkPuddle { 0% { transform: scale(.1, .4); opacity: 0 } 20% { opacity: 1 } 60% { transform: scale(1) } 86% { transform: scale(1.03); opacity: 1 } 100% { transform: scale(1.06); opacity: 0 } }
@keyframes lgkTail { 0% { transform: rotate(0deg) scaleY(.2); opacity: 0 } 24% { transform: rotate(var(--ta)) scaleY(1); opacity: .85 } 52% { transform: rotate(var(--ta)) scaleY(1.06) } 70% { transform: rotate(var(--ta)) translateY(-26cqw) scale(.6); opacity: .9 } 100% { transform: rotate(var(--ta)) translateY(-66cqw) scale(.25); opacity: 0 } }
@keyframes lgkEye { 0% { transform: scaleY(.05); opacity: 0 } 12% { transform: scaleY(1.06); opacity: .9 } 20% { transform: scaleY(1) } 54% { transform: scaleY(1) } 60% { transform: scaleY(.45) } 66% { transform: scaleY(.75) } 78% { transform: scaleY(.04) } 92% { transform: scaleY(.04); opacity: .9 } 100% { transform: scaleY(.04); opacity: 0 } }
@keyframes lgkCross { 0% { transform: translateX(95cqw) scale(.9); opacity: 0 } 12% { opacity: 1 } 50% { transform: translateX(0) scale(1) } 88% { opacity: 1 } 100% { transform: translateX(-95cqw) scale(.9); opacity: 0 } }
@keyframes lgkCoal { 0% { transform: scale(0); opacity: 0; filter: brightness(2) saturate(1) } 15% { transform: scale(1.2); opacity: 1; filter: brightness(1.8) saturate(1) } 50% { transform: scale(1); filter: brightness(1.2) saturate(1) } 85% { opacity: .85; filter: brightness(.55) saturate(.6) } 100% { transform: scale(.9); opacity: 0; filter: brightness(.3) saturate(.3) } }
@keyframes lgkSing { 0% { transform: scale(.2) rotate(0deg); opacity: 0 } 14% { transform: scale(1) rotate(60deg); opacity: .95 } 74% { transform: scale(.08) rotate(600deg); opacity: 1 } 86% { transform: scale(.08) rotate(700deg); opacity: 1 } 89% { transform: scale(.02) rotate(720deg); opacity: 1 } 90% { opacity: 0 } 100% { transform: scale(.02) rotate(720deg); opacity: 0 } }
` + BOSS_PARTS_CSS

// A STAGED part (the knockout's stages, StrikeFxLayer): every animation inside it starts `at` ms later (its own delay
// kept), so the whole cinematic is plain CSS: it plays the same every time and a paused page (the dev sheet's
// freeze(ms)) shows any moment of it. Only DOM elements are walked; a component (a Glyph) carries no animation.
const TIME = /^-?[\d.]+m?s$/
const msOf = (tok) => (tok.endsWith('ms') ? parseFloat(tok) : parseFloat(tok) * 1000)
// Splits on commas or spaces outside parentheses (cubic-bezier(.2,.8,.3,1), steps(1, end), var(--x)).
function splitTop(s, space) {
  const out = []
  let depth = 0
  let cur = ''
  for (const ch of s) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (depth === 0 && (space ? /\s/.test(ch) : ch === ',')) { out.push(cur); cur = '' } else cur += ch
  }
  out.push(cur)
  return out.map((x) => x.trim()).filter(Boolean)
}
// One animation shorthand (or a list of them) started `at` ms later: the second time is the delay.
export function shiftAnimation(anim, at) {
  return splitTop(String(anim), false).map((one) => {
    const toks = splitTop(one, true)
    const times = toks.map((tok, i) => (TIME.test(tok) ? i : -1)).filter((i) => i >= 0)
    if (times.length >= 2) toks[times[1]] = `${Math.round(msOf(toks[times[1]]) + at)}ms`
    else if (times.length === 1) toks.splice(times[0] + 1, 0, `${Math.round(at)}ms`)
    return toks.join(' ')
  }).join(', ')
}
// When everything a part plays has finished (ms): the latest delay + duration x iterations in it.
export function animationEnd(node) {
  if (Array.isArray(node)) return node.reduce((m, n) => Math.max(m, animationEnd(n)), 0)
  if (!isValidElement(node) || typeof node.type !== 'string') return 0
  const { style, children } = node.props
  let end = 0
  if (style && typeof style.animation === 'string') {
    for (const one of splitTop(style.animation, false)) {
      const toks = splitTop(one, true)
      const times = toks.filter((tok) => TIME.test(tok)).map(msOf)
      const count = Number(toks.find((tok) => /^\d+$/.test(tok)) || 1)
      end = Math.max(end, (times[1] || 0) + (times[0] || 0) * count)
    }
  }
  return children != null && typeof children !== 'string' ? Math.max(end, animationEnd(children)) : end
}
// A part drawn so it has finished by `by` ms after its start: drawn again faster (ctx.speed) until it fits.
export function drawWithin(draw, p, ctx, by) {
  let speed = ctx.speed
  let node = draw(p, ctx)
  for (let i = 0; i < 6; i++) {
    const end = animationEnd(node)
    if (end <= by || end <= 0) break
    speed *= (by / end) * 0.98
    node = draw(p, { ...ctx, speed })
  }
  return node
}
export function withDelay(node, at) {
  if (!at) return node
  // Static JSX children come back as an ARRAY prop, which React then checks as a list: key the unkeyed ones (by
  // position: the list never reorders) so a staged part with several children draws no key warning.
  if (Array.isArray(node)) return node.map((n, i) => { const d = withDelay(n, at); return isValidElement(d) && d.key == null ? cloneElement(d, { key: `d${i}` }) : d })
  if (!isValidElement(node) || typeof node.type !== 'string') return node
  const { style, children } = node.props
  const next = {}
  if (style && typeof style.animation === 'string') next.style = { ...style, animation: shiftAnimation(style.animation, at) }
  if (children != null && typeof children !== 'string') next.children = withDelay(children, at)
  return Object.keys(next).length ? cloneElement(node, next) : node
}

// One flying particle (a glyph or any node) through lgiMove (or lgiArcPath when `mid` is given).
function fly(key, node, { x0 = 0, y0 = 0, x1, y1, xm, ym, r0 = 0, r1 = 0, s0 = 0.6, s1 = 1, w = 12, ms = 650, delay = 0, ease = 'cubic-bezier(.15,.8,.3,1)', midOpacity = 1 }) {
  const arc = xm != null
  return (
    <div key={key} style={{ position: 'absolute', left: '50%', top: '50%', width: `${w}cqw`, height: `${w}cqw`, marginLeft: `${-w / 2}cqw`, marginTop: `${-w / 2}cqw`,
      '--x0': x0, '--y0': y0, '--x1': x1, '--y1': y1, '--xm': xm, '--ym': ym, '--r0': `${r0}deg`, '--r1': `${r1}deg`, '--s0': s0, '--s1': s1, '--o-mid': midOpacity,
      animation: `${arc ? 'lgiArcPath' : 'lgiMove'} ${ms}ms ${ease} ${delay}ms both` }}>{node}</div>
  )
}
const glyphOf = (p, ctx) => p.glyph || ctx.glyph
// A band across the box that melts away at both sides instead of ending on a hard edge.
const SIDE_FADE = 'linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent)'
const colorOf = (p, ctx) => p.color || ctx.color
const svgBox = (key, children, extra = {}) => (
  <svg key={key} viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', left: '-15%', top: '-15%', width: '130%', height: '130%', overflow: 'visible', ...extra }} aria-hidden="true">{children}</svg>
)

export const PARTS = {
  // Glyphs flung out from the centre.
  burst: (p, ctx) => {
    const n = p.n || 6
    const reach = 40 * (p.reach || 1) * ctx.scale
    const w = 13 * (p.size || 1) * Math.sqrt(ctx.scale)
    return Array.from({ length: n }, (_, i) => {
      const a = (Math.PI * 2 * i) / n + rnd(i, 3) * 0.5
      const r = reach * (0.75 + rnd(i, 5) * 0.45)
      return fly(`b${i}`, <Glyph name={glyphOf(p, ctx)} color={colorOf(p, ctx)} accent={ctx.accent} />,
        { x1: Math.cos(a) * r, y1: Math.sin(a) * r, r1: (p.spin || 0) * (i % 2 ? 1 : -1), s0: 0.4, s1: 1, w, ms: 620 * ctx.speed, delay: rnd(i, 7) * 60 })
    })
  },
  // Thin bright streaks (a white core).
  sparks: (p, ctx) => Array.from({ length: p.n || 8 }, (_, i) => {
    const c = colorOf(p, ctx)
    return <div key={`sp${i}`} style={{ position: 'absolute', left: '50%', top: '50%', width: '42cqw', height: `${(p.width || 1.1) * Math.sqrt(ctx.scale)}cqw`, marginTop: '-0.5cqw', transformOrigin: '0 50%',
      background: `linear-gradient(90deg, transparent, ${c} 55%, #fff)`, borderRadius: 4, boxShadow: `0 0 1.5cqw ${c}`, '--a': `${(360 / (p.n || 8)) * i + rnd(i, 9) * 20}deg`, '--r': 34 * (p.reach || 1) * ctx.scale,
      animation: `lgiSpark ${480 * ctx.speed}ms cubic-bezier(.15,.8,.3,1) ${rnd(i, 4) * 50}ms both` }} />
  }),
  // A shockwave ring (or one closing in).
  ring: (p, ctx) => {
    const c = colorOf(p, ctx)
    const s1 = (p.scale || 1.7) * ctx.scale
    return <div key={`rg${p.delay || 0}`} style={{ position: 'absolute', left: '50%', top: '50%', width: '72cqw', height: '72cqw', borderRadius: '50%', border: `${p.width || 3}px ${p.dashed ? 'dashed' : 'solid'} ${c}`, boxShadow: `0 0 2cqw ${c}`,
      '--s0': p.inward ? 2.4 : 0.2, '--s1': p.inward ? 0.1 : s1, animation: `lgiRing ${560 * ctx.speed}ms ${p.inward ? 'cubic-bezier(.6,0,.8,.4)' : 'ease-out'} ${p.delay || 0}ms both` }} />
  },
  // A red (or tinted) glow at the box's rim: the player got hurt.
  vignette: (p) => <div key="vg" style={{ position: 'absolute', inset: '-12%', background: `radial-gradient(closest-side, transparent 58%, ${p.color || '#ff2a2a'}c0 86%, transparent 100%)`, animation: 'lgiFade 650ms ease-out both' }} />,
  // Chronos: two clock hands sweep round the face, with afterimages.
  hands: (p, ctx) => [0, 1, 2].flatMap((g) => [
    <div key={`hm${g}`} style={{ position: 'absolute', left: '50%', top: '50%', width: '4cqw', height: `${48 * ctx.scale}cqw`, marginLeft: '-2cqw', transformOrigin: '50% 0', background: `linear-gradient(${ctx.color}, #fff)`, borderRadius: 6, boxShadow: `0 0 2cqw ${ctx.color}`, opacity: 1 - g * 0.3,
      '--r0': '-180deg', '--r1': '200deg', animation: `lgiSpin ${(p.ms || 620) * ctx.speed}ms cubic-bezier(.3,.9,.4,1) ${g * 45}ms both`, transform: 'translate(-50%, 0)' }} />,
    <div key={`hh${g}`} style={{ position: 'absolute', left: '50%', top: '50%', width: '7cqw', height: `${30 * ctx.scale}cqw`, marginLeft: '-3.5cqw', transformOrigin: '50% 0', background: ctx.accent, border: `1px solid ${ctx.color}`, borderRadius: 6, opacity: 1 - g * 0.3,
      '--r0': '-60deg', '--r1': '60deg', animation: `lgiSpin ${(p.ms || 620) * ctx.speed}ms ease-out ${g * 45}ms both` }} />,
  ]),
  // Glass or crystal shards flying out (or in), with a streak.
  shards: (p, ctx) => {
    const n = p.n || 10
    const reach = 46 * (p.reach || 1) * ctx.scale
    return Array.from({ length: n }, (_, i) => {
      const a = (Math.PI * 2 * i) / n + rnd(i, 11) * 0.4
      const r = reach * (0.7 + rnd(i, 13) * 0.5)
      const c = p.rainbow ? RAINBOW[i % RAINBOW.length] : colorOf(p, ctx)
      const x = Math.cos(a) * r
      const y = Math.sin(a) * r
      return fly(`sh${i}`, <div style={{ width: '100%', height: '100%', background: `linear-gradient(${c}, #fff)`, clipPath: 'polygon(50% 0, 100% 40%, 50% 100%, 0 40%)', filter: `drop-shadow(0 0 3px ${c})` }} />,
        p.inward ? { x0: x, y0: y, x1: 0, y1: 0, r0: deg(a) + 90, r1: deg(a) + 90, s0: 1, s1: 0.4, w: 6, ms: 520 * ctx.speed, delay: rnd(i, 17) * 80, ease: 'cubic-bezier(.6,0,.9,.5)' }
          : { x1: x, y1: y, r0: deg(a) + 90, r1: deg(a) + 90 + (rnd(i) - 0.5) * 200, s0: 0.5, s1: 1.1, w: 6 + rnd(i, 19) * 4, ms: 700 * ctx.speed, delay: rnd(i, 17) * 50 })
    })
  },
  // Particles raining from above the box.
  drops: (p, ctx) => Array.from({ length: p.n || 8 }, (_, i) => {
    const x = (rnd(i, 21) - 0.5) * 90
    return fly(`dr${i}`, <Glyph name={glyphOf(p, ctx)} color={colorOf(p, ctx)} accent={ctx.accent} />,
      { x0: x, y0: -58, x1: x + (rnd(i, 23) - 0.5) * 14, y1: 52, r0: (rnd(i, 25) - 0.5) * 60, r1: (rnd(i, 27) - 0.5) * 300, s0: 1, s1: 1, w: 12 * (p.size || 1), ms: 900 * ctx.speed, delay: rnd(i, 29) * 260, ease: 'cubic-bezier(.45,0,.8,.6)' })
  }),
  // Particles floating up and away.
  rise: (p, ctx) => Array.from({ length: p.n || 8 }, (_, i) => {
    const x = (rnd(i, 31) - 0.5) * 70
    return fly(`ri${i}`, <Glyph name={glyphOf(p, ctx)} color={colorOf(p, ctx)} accent={ctx.accent} />,
      { x0: x * 0.5, y0: 10 + rnd(i, 33) * 25, x1: x + (rnd(i, 35) - 0.5) * 30, y1: -70 - rnd(i, 37) * 20, r0: 0, r1: (rnd(i, 39) - 0.5) * 120, s0: 0.5, s1: 1.1, w: 11 * (p.size || 1), ms: 1050 * ctx.speed, delay: rnd(i, 41) * 220, ease: 'cubic-bezier(.2,.6,.4,1)' })
  }),
  // Conic rays turning behind the boss.
  rays: (p, ctx) => {
    const c = colorOf(p, ctx)
    const stops = p.rainbow ? RAINBOW.map((x, i) => `${x}cc ${i * 60}deg ${i * 60 + 8}deg, transparent ${i * 60 + 8}deg ${i * 60 + 30}deg`).join(', ') : null
    const n = p.n || 12
    return <div key="ry" style={{ position: 'absolute', left: '50%', top: '50%', width: '190cqw', height: '190cqw', borderRadius: '50%',
      background: stops ? `conic-gradient(${stops})` : `repeating-conic-gradient(${c}cc 0deg ${180 / n}deg, transparent ${180 / n}deg ${360 / n}deg)`,
      WebkitMaskImage: 'radial-gradient(circle, #000 22%, transparent 68%)', maskImage: 'radial-gradient(circle, #000 22%, transparent 68%)',
      '--r0': '0deg', '--r1': '45deg', '--s0': 0.25, '--s1': 1.4, animation: `lgiSpin ${1250 * ctx.speed}ms ease-out both` }} />
  },
  // Banshee: thick sound rings bursting out (or crushing in), blurred at the edge.
  scream: (p, ctx) => Array.from({ length: p.n || 3 }, (_, i) => {
    const c = colorOf(p, ctx)
    return <div key={`sc${i}`} style={{ position: 'absolute', left: '50%', top: '50%', width: '60cqw', height: '60cqw', borderRadius: '50%', border: `${2.2 - i * 0.3}cqw solid ${c}`, filter: 'blur(1px)', boxShadow: `0 0 3cqw ${c}, inset 0 0 3cqw ${c}`,
      '--s0': p.inward ? 2.6 : 0.25, '--s1': p.inward ? 0.1 : 2.4 * ctx.scale, animation: `lgiRing ${620 * ctx.speed}ms ${p.inward ? 'ease-in' : 'cubic-bezier(.1,.8,.3,1)'} ${i * 110}ms both` }} />
  }),
  // A column of light from far above.
  pillar: (p, ctx) => {
    const c = colorOf(p, ctx)
    return <div key="pl" style={{ position: 'absolute', left: '50%', top: '-90cqw', bottom: '-10cqw', width: `${70 * (p.width || 0.5) * ctx.scale}cqw`, transformOrigin: '50% 100%',
      background: `linear-gradient(90deg, transparent, ${c}cc 25%, #fff 50%, ${c}cc 75%, transparent)`, filter: `drop-shadow(0 0 3cqw ${c})`, animation: `lgiPillar ${900 * ctx.speed}ms cubic-bezier(.2,.8,.3,1) both` }} />
  },
  // A beam: straight down from above, a cone at the player, or a band across.
  beam: (p, ctx) => {
    const c = colorOf(p, ctx)
    const w = 70 * (p.width || 0.4) * ctx.scale * (p.small ? 0.6 : 1)
    if (p.dir === 'cone') {
      return <div key="bc" style={{ position: 'absolute', left: '50%', top: '42%', width: `${w * 1.6}cqw`, height: `${80 * ctx.scale}cqw`, transformOrigin: '50% 0',
        clipPath: 'polygon(44% 0, 56% 0, 100% 100%, 0 100%)', background: `linear-gradient(${c}, ${c}55 70%, transparent)`, filter: `drop-shadow(0 0 2cqw ${c})`, animation: `lgiCone ${720 * ctx.speed}ms cubic-bezier(.2,.8,.3,1) both` }} />
    }
    if (p.dir === 'across') {
      const bg = p.rainbow ? `linear-gradient(${RAINBOW.join(', ')})` : `linear-gradient(transparent, ${c}, #fff, ${c}, transparent)`
      return <div key="ba" style={{ position: 'absolute', left: '-10%', width: '120%', top: `${50 - w / 2}%`, height: `${w}cqw`, background: bg, boxShadow: `0 0 3cqw ${c}`, borderRadius: '2cqw', transformOrigin: '0 50%', animation: `lgiBand ${560 * ctx.speed}ms cubic-bezier(.3,.7,.3,1) both` }} />
    }
    return <div key="bd" style={{ position: 'absolute', left: '50%', top: '-100cqw', height: '160cqw', width: `${w}cqw`, transformOrigin: '50% 0',
      background: `linear-gradient(90deg, transparent, ${c} 18%, ${c} 40%, #fff 50%, ${c} 60%, ${c} 82%, transparent)`, filter: `drop-shadow(0 0 3cqw ${c}) drop-shadow(0 0 1px #0008)`, animation: `lgiPillar ${560 * ctx.speed}ms cubic-bezier(.1,.9,.3,1) both` }} />
  },
  // A huge glyph slams down from above (Titan's fist, the Berserker's axe).
  slam: (p, ctx) => <div key="sl" style={{ position: 'absolute', left: '50%', top: '50%', width: `${62 * ctx.scale}cqw`, height: `${62 * ctx.scale}cqw`, filter: `drop-shadow(0 0 2cqw ${ctx.color}) drop-shadow(0 1cqw 0 #0008)`,
    animation: `lgiSlam ${760 * ctx.speed}ms cubic-bezier(.5,0,.6,1) both` }}><Glyph name={glyphOf(p, ctx)} color={ctx.color} accent={ctx.accent} /></div>,
  // Jagged cracks running out from the impact.
  crack: (p, ctx) => {
    const n = p.n || 5
    const c = p.color || '#fff4dc'
    const lines = Array.from({ length: n }, (_, i) => {
      const a = (Math.PI * 2 * i) / n + rnd(i, 43)
      let x = 50
      let y = 50
      const pts = [[x, y]]
      for (let k = 0; k < 4; k++) { const r = 9 + rnd(i * 4 + k, 47) * 6; const b = a + (rnd(i * 4 + k, 49) - 0.5) * 0.9; x += Math.cos(b) * r; y += Math.sin(b) * r; pts.push([x, y]) }
      return <polyline key={i} points={pts.map((q) => q.join(',')).join(' ')} fill="none" stroke={c} strokeWidth={1.4 * ctx.scale} strokeLinejoin="round" strokeLinecap="round"
        style={{ '--len': 80, strokeDasharray: 80, filter: `drop-shadow(0 0 1px ${c})`, animation: `lgiDraw ${700 * ctx.speed}ms ease-out ${i * 30}ms both` }} />
    })
    return svgBox('ck', lines)
  },
  // Dust puffs rolling out along the ground.
  dust: (p, ctx) => Array.from({ length: p.n || 10 }, (_, i) => {
    const side = i % 2 ? 1 : -1
    const c = p.color || '#d8c8b0'
    return fly(`du${i}`, <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: `radial-gradient(circle, ${c}ee, ${c}00 70%)` }} />,
      { x0: side * 6, y0: 30, x1: side * (20 + rnd(i, 51) * 40), y1: 22 - rnd(i, 53) * 22, s0: 0.4, s1: 1.8, w: 14, ms: 820 * ctx.speed, delay: rnd(i, 55) * 120, ease: 'cubic-bezier(.1,.7,.3,1)', midOpacity: 0.8 })
  }),
  // The Vampire: two fangs stab down, blood beads where they bit.
  fangs: (p, ctx) => {
    const w = (p.small ? 18 : 28) * ctx.scale
    return [-1, 1].map((s) => (
      <div key={`fg${s}`} style={{ position: 'absolute', left: `calc(50% + ${s * w * 0.55}cqw)`, top: '30%', width: `${w}cqw`, height: `${w * 1.5}cqw`, marginLeft: `${-w / 2}cqw`,
        filter: `drop-shadow(0 0 1.5cqw ${ctx.color})`, animation: `lgiStab ${640 * ctx.speed}ms cubic-bezier(.4,0,.3,1) ${s > 0 ? 40 : 0}ms both` }}>
        <svg viewBox="0 0 20 30" width="100%" height="100%" aria-hidden="true"><path d="M2 0h16C17 12 14 22 10 30 6 22 3 12 2 0Z" fill="#fff6f0" stroke={ctx.color} strokeWidth="1.2" /></svg>
      </div>
    ))
  },
  // Parallel claw slashes.
  claws: (p, ctx) => {
    const n = p.n || 3
    const sz = p.small ? 0.7 : 1
    return Array.from({ length: n }, (_, i) => {
      const o = i - (n - 1) / 2
      return <div key={`cl${i}`} style={{ position: 'absolute', left: `${50 + o * 12}%`, top: `${50 - o * 4}%`, width: `${105 * sz * ctx.scale}cqw`, height: `${2.2 * sz * Math.sqrt(ctx.scale)}cqw`, borderRadius: 6,
        background: `linear-gradient(90deg, transparent, ${colorOf(p, ctx)} 25%, #fff 50%, ${colorOf(p, ctx)} 75%, transparent)`, boxShadow: `0 0 2cqw ${colorOf(p, ctx)}`, '--a': `${62 + (p.angle || 0)}deg`,
        animation: `lgiSlash ${520 * ctx.speed}ms cubic-bezier(.2,.9,.3,1) ${i * 55}ms both` }} />
    })
  },
  // Jaws snapping shut: rows of teeth closing vertically (Chimera, Cerberus) or from the sides (Hydra).
  bite: (p, ctx) => {
    const n = p.n || 1
    const s = (p.small ? 30 : 46) * ctx.scale
    const spots = n === 1 ? [[0, 0]] : n === 2 ? [[-16, -8], [16, 10]] : [[-22, -12], [0, 8], [22, -10]]
    return spots.flatMap(([x, y], i) => {
      const teeth = (flip) => <svg viewBox="0 0 60 20" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true" style={{ transform: flip ? 'scaleY(-1)' : undefined }}>
        <path d="M0 0h60v6l-5 13-5-13-5 13-5-13-5 13-5-13-5 13-5-13-5 13-5-13-5 13-5-13Z" fill="#fffaf0" stroke={ctx.color} strokeWidth="1.5" /></svg>
      const box = { position: 'absolute', width: `${s}cqw`, height: `${s * 0.36}cqw`, left: `calc(50% + ${x}cqw)`, marginLeft: `${-s / 2}cqw`, filter: `drop-shadow(0 0 1.5cqw ${ctx.color})` }
      const delay = i * 110
      if (p.dir === 'h') {
        // Side jaws: the row is turned upright inside a box that slides in from its side.
        return [-1, 1].map((side) => <div key={`bh${i}${side}`} style={{ ...box, top: `calc(50% + ${y}cqw)`, marginTop: `${-s * 0.18}cqw`, left: `calc(50% + ${x + side * s * 0.2}cqw)`, '--jx': `${side * s * 0.6}cqw`, '--jy': '0cqw', animation: `lgiJaw ${560 * ctx.speed}ms cubic-bezier(.5,0,.4,1) ${delay}ms both` }}>
          <div style={{ width: '100%', height: '100%', transform: `rotate(${side * -90}deg) scale(1.6)` }}>{teeth(false)}</div></div>)
      }
      return [-1, 1].map((side) => <div key={`bv${i}${side}`} style={{ ...box, top: `calc(50% + ${y}cqw + ${side < 0 ? -s * 0.34 : 0}cqw)`, '--jx': '0cqw', '--jy': `${side * s * 0.5}cqw`, animation: `lgiJaw ${560 * ctx.speed}ms cubic-bezier(.5,0,.4,1) ${delay}ms both` }}>{teeth(side > 0)}</div>)
    })
  },
  // A tail whip: a curved lash drawn fast with a crack at the tip.
  whip: (p, ctx) => svgBox('wp', [
    <path key="wu" d="M95 10C70 20 60 55 30 62S8 80 6 92" fill="none" stroke="#000a" strokeWidth={6.5 * ctx.scale} strokeLinecap="round" style={{ '--len': 140, strokeDasharray: 140, animation: `lgiDraw ${520 * ctx.speed}ms cubic-bezier(.5,0,.3,1) both` }} />,
    <path key="w" d="M95 10C70 20 60 55 30 62S8 80 6 92" fill="none" stroke={p.color || ctx.color} strokeWidth={4 * ctx.scale} strokeLinecap="round" style={{ '--len': 140, strokeDasharray: 140, animation: `lgiDraw ${520 * ctx.speed}ms cubic-bezier(.5,0,.3,1) both`, filter: `drop-shadow(0 0 2px ${ctx.color})` }} />,
    <circle key="t" cx="6" cy="92" r={6 * ctx.scale} fill="#fff" style={{ animation: `lgiFade ${300 * ctx.speed}ms ease-out ${300 * ctx.speed}ms both` }} />,
  ]),
  // Coins (or anything) shot up and raining back down.
  fountain: (p, ctx) => Array.from({ length: p.n || 16 }, (_, i) => {
    const x = (rnd(i, 61) - 0.5) * 110
    return fly(`fo${i}`, <Glyph name={glyphOf(p, ctx)} color={colorOf(p, ctx)} accent={ctx.accent} />,
      { x0: 0, y0: 10, xm: x * 0.6, ym: -60 - rnd(i, 63) * 25, x1: x, y1: 60, r0: 0, r1: 720 * (i % 2 ? 1 : -1), s0: 0.5, s1: 1, w: 11 * (p.size || 1), ms: 1150 * ctx.speed, delay: rnd(i, 65) * 200, ease: 'cubic-bezier(.3,.6,.6,1)' })
  }),
  // Confetti (or sprinkles) bursting and drifting.
  confetti: (p, ctx) => Array.from({ length: p.n || 16 }, (_, i) => {
    const a = (Math.PI * 2 * i) / (p.n || 16) + rnd(i, 71)
    const r = 45 * (p.reach || 1) * ctx.scale * (0.6 + rnd(i, 73) * 0.6)
    const c = CONFETTI[i % CONFETTI.length]
    return fly(`cf${i}`, <div style={{ width: '100%', height: p.sprinkles ? '30%' : '60%', borderRadius: p.sprinkles ? 9 : 1, background: c }} />,
      { x1: Math.cos(a) * r, y1: Math.sin(a) * r + 20, r0: rnd(i, 75) * 180, r1: rnd(i, 77) * 900, s0: 0.6, s1: 1, w: p.sprinkles ? 5 : 4, ms: 900 * ctx.speed, delay: rnd(i, 79) * 80 })
  }),
  // The Showman: playing cards thrown at the player, spinning.
  cards: (p, ctx) => Array.from({ length: p.n || 7 }, (_, i) => {
    const o = i - ((p.n || 7) - 1) / 2
    return fly(`cd${i}`, <Glyph name="card" color={ctx.color} accent={ctx.accent} />,
      { x0: 0, y0: -6, x1: o * 18 * ctx.scale, y1: 46 * ctx.scale, r0: o * 10, r1: o * 30 + 720, s0: 0.3, s1: 2.1, w: 12, ms: 600 * ctx.speed, delay: Math.abs(o) * 45, ease: 'cubic-bezier(.4,0,.6,1)' })
  }),
  // The Showman's knockout: the curtains close (p.part: how far each comes in, % of the box; 62 meets in the middle).
  curtain: (p) => [
    <div key="cl" style={{ position: 'absolute', top: '-10%', bottom: '-10%', left: '-10%', width: `${p.part || 62}%`, boxShadow: '0.6cqw 0 1.4cqw #0008', background: 'repeating-linear-gradient(90deg, #8a0a2a 0 7cqw, #b0123a 7cqw 12cqw)', animation: 'lgiCurtainL 1300ms cubic-bezier(.5,0,.3,1) 250ms both' }} />,
    <div key="cr" style={{ position: 'absolute', top: '-10%', bottom: '-10%', right: '-10%', width: `${p.part || 62}%`, boxShadow: '-0.6cqw 0 1.4cqw #0008', background: 'repeating-linear-gradient(90deg, #b0123a 0 5cqw, #8a0a2a 5cqw 12cqw)', animation: 'lgiCurtainR 1300ms cubic-bezier(.5,0,.3,1) 250ms both' }} />,
  ],
  // The Reaper: a scythe crescent sweeps across, with two afterimages.
  arc: (p, ctx) => [0, 1, 2].map((g) => (
    <div key={`ar${g}`} style={{ position: 'absolute', left: '50%', top: '50%', width: `${(p.small ? 70 : 110) * ctx.scale}cqw`, height: `${(p.small ? 70 : 110) * ctx.scale}cqw`, borderRadius: '50%',
      borderTop: `${(p.small ? 2.2 : 3.4) * ctx.scale}cqw solid ${g ? `${ctx.color}88` : '#ffffff'}`, borderLeft: `${1.2 * ctx.scale}cqw solid transparent`, borderRight: `${1.2 * ctx.scale}cqw solid transparent`,
      filter: `drop-shadow(0 0 2.5cqw ${ctx.color})`, opacity: 1 - g * 0.3, '--r0': p.reverse ? '160deg' : '-150deg', '--r1': p.reverse ? '-80deg' : '70deg',
      animation: `lgiSpin ${520 * ctx.speed}ms cubic-bezier(.3,.9,.3,1) ${g * 40}ms both` }} />
  )),
  // Liquid blobs bursting and splatting.
  splat: (p, ctx) => Array.from({ length: p.n || 6 }, (_, i) => {
    const a = (Math.PI * 2 * i) / (p.n || 6) + rnd(i, 81) * 0.6
    const r = (p.big ? 46 : 34) * (p.reach || 1) * ctx.scale * (0.6 + rnd(i, 83) * 0.5)
    const c = colorOf(p, ctx)
    return fly(`spl${i}`, <div style={{ width: '100%', height: '100%', borderRadius: '50% 45% 55% 50%', background: `radial-gradient(circle at 35% 35%, #fff, ${c} 45%, ${c}aa)` }} />,
      { x1: Math.cos(a) * r, y1: Math.sin(a) * r, s0: 0.5, s1: 1.4, w: (p.big ? 14 : 9) * (0.7 + rnd(i, 85) * 0.6), ms: 640 * ctx.speed, delay: rnd(i, 87) * 60 })
  }),
  // Leviathan: a wave crest sweeps across the box.
  wave: (p, ctx) => {
    const h = (p.small ? 40 : 70) * ctx.scale
    return <div key="wv" style={{ position: 'absolute', left: '-30%', width: '160%', top: `${55 - h / 2}%`, height: `${h}cqw`, animation: `lgiSweep ${680 * ctx.speed}ms cubic-bezier(.3,.6,.3,1) both` }}>
      <svg viewBox="0 0 160 70" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 70V40C20 40 30 10 55 8c18-1 26 18 18 26 16-4 18-22 34-22 20 0 30 28 53 28V70Z" fill={ctx.color} opacity=".85" />
        <path d="M0 48C20 48 30 20 55 18c15-1 20 12 14 20" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      </svg></div>
  },
  // A whirlpool: rings spiralling inward.
  whirl: (p, ctx) => Array.from({ length: p.n || 3 }, (_, i) => (
    <div key={`wh${i}`} style={{ position: 'absolute', left: '50%', top: '62%', width: '90cqw', height: '90cqw', borderRadius: '50%', border: `2.4cqw dashed ${i % 2 ? '#ffffff' : ctx.color}`, boxShadow: `0 0 2cqw ${ctx.color}`,
      '--r0': '0deg', '--r1': `${-540 - i * 120}deg`, '--s0': 1.3 - i * 0.2, '--s1': 0.05, transform: 'scaleY(.35)', animation: `lgiSpin ${1100 * ctx.speed}ms cubic-bezier(.5,0,.7,1) ${i * 90}ms both` }} />
  )),
  // A missile flying at the player (the Lich's skull, a needle), growing as it comes.
  projectile: (p, ctx) => <div key="pj" style={{ position: 'absolute', left: '50%', top: '50%', width: '30cqw', height: '30cqw', filter: `drop-shadow(0 0 3cqw ${ctx.color})`,
    animation: `lgiProjectile ${620 * ctx.speed}ms cubic-bezier(.5,0,.8,.6) both` }}><Glyph name={glyphOf(p, ctx)} color={ctx.color} accent={ctx.accent} /></div>,
  // Cerberus: a chain lashes out, link by link.
  lash: (p, ctx) => svgBox('ls', [
    <path key="cu" d={p.small ? 'M10 20C40 30 55 55 80 70' : 'M2 8C30 20 45 60 70 66S96 80 98 96'} fill="none" stroke="#000a" strokeWidth={6.5 * ctx.scale} strokeDasharray="6 3" strokeLinecap="round" style={{ animation: `lgiFade ${600 * ctx.speed}ms ease-out both` }} />,
    <path key="c" d={p.small ? 'M10 20C40 30 55 55 80 70' : 'M2 8C30 20 45 60 70 66S96 80 98 96'} fill="none" stroke={ctx.color} strokeWidth={4 * ctx.scale} strokeDasharray="6 3" strokeLinecap="round"
      style={{ filter: `drop-shadow(0 0 2px ${ctx.color})`, animation: `lgiFade ${600 * ctx.speed}ms ease-out both`, clipPath: 'inset(0 0 0 0)' }} />,
    <path key="c2" d={p.small ? 'M10 20C40 30 55 55 80 70' : 'M2 8C30 20 45 60 70 66S96 80 98 96'} fill="none" stroke="#fff" strokeWidth={1.2 * ctx.scale} strokeLinecap="round"
      style={{ '--len': 160, strokeDasharray: 160, animation: `lgiDraw ${480 * ctx.speed}ms cubic-bezier(.5,0,.3,1) both` }} />,
  ]),
  // Tempest: lightning from the top, flickering.
  bolt: (p, ctx) => {
    const n = p.n || 1
    const bolts = Array.from({ length: n }, (_, i) => {
      const x0 = n === 1 ? 50 : 20 + (60 * i) / (n - 1)
      let x = x0
      const pts = [[x, -40]]
      for (let y = -25; y <= 60; y += 12) { x += (rnd(i * 10 + y, 91) - 0.5) * 18; pts.push([x, y]) }
      const d = pts.map((q) => q.join(',')).join(' ')
      return <g key={i} style={{ animation: `lgiFlicker ${620 * ctx.speed}ms steps(1, end) ${i * 70}ms both` }}>
        <polyline points={d} fill="none" stroke={ctx.color} strokeWidth={5 * ctx.scale} strokeLinejoin="bevel" opacity=".6" />
        <polyline points={d} fill="none" stroke="#fff" strokeWidth={2 * ctx.scale} strokeLinejoin="bevel" />
      </g>
    })
    return svgBox('bt', bolts, { filter: `drop-shadow(0 0 4px ${ctx.color})` })
  },
  // Curling tentacles lashing in from the edges.
  tendrils: (p, ctx) => {
    const c = colorOf(p, ctx)
    const paths = ['M-5 30C20 20 25 55 50 50', 'M105 25C80 30 78 60 52 52', 'M-5 85C20 70 35 75 48 56', 'M105 88C85 72 65 78 54 57']
    return svgBox('td', paths.slice(0, p.n || 2).map((d, i) => (
      <g key={i}>
        <path d={d} fill="none" stroke="#000a" strokeWidth={8 * ctx.scale} strokeLinecap="round" style={{ '--len': 90, strokeDasharray: 90, animation: `lgiDraw ${600 * ctx.speed}ms cubic-bezier(.4,0,.3,1) ${i * 70}ms both` }} />
        <path d={d} fill="none" stroke={c} strokeWidth={5 * ctx.scale} strokeLinecap="round" style={{ '--len': 90, strokeDasharray: 90, filter: `drop-shadow(0 0 2px ${c})`, animation: `lgiDraw ${600 * ctx.speed}ms cubic-bezier(.4,0,.3,1) ${i * 70}ms both` }} />
      </g>
    )))
  },
  // The Berserker: one massive slash, white hot, with an afterimage.
  cleave: (p, ctx) => [0, 1].map((g) => (
    <div key={`cv${g}`} style={{ position: 'absolute', left: '50%', top: '50%', width: `${(p.small ? 100 : 150) * ctx.scale}cqw`, height: `${(p.small ? 4 : 7) * ctx.scale}cqw`, borderRadius: '50%',
      background: `linear-gradient(90deg, transparent, ${ctx.color} 20%, #fff 50%, ${ctx.color} 80%, transparent)`, boxShadow: `0 0 4cqw ${ctx.color}`, opacity: g ? 0.45 : 1, '--a': `${-40 + g * 6}deg`,
      animation: `lgiSlash ${560 * ctx.speed}ms cubic-bezier(.15,1,.3,1) ${g * 60}ms both` }} />
  )),
  // Inferno: a cone of fire breathed at the player.
  breath: (p, ctx) => <div key="br" style={{ position: 'absolute', left: '50%', top: '38%', width: `${(p.small ? 60 : 110) * ctx.scale}cqw`, height: `${(p.small ? 50 : 90) * ctx.scale}cqw`, transformOrigin: '50% 0',
    clipPath: 'polygon(42% 0, 58% 0, 100% 100%, 0 100%)', background: `radial-gradient(ellipse at 50% 0, #fff 0, #ffe08a 18%, ${ctx.color} 45%, #c81e00 75%, transparent 100%)`,
    animation: `lgiCone ${760 * ctx.speed}ms cubic-bezier(.2,.8,.3,1) both, lgiFlicker ${760 * ctx.speed}ms steps(1, end) both` }} />,
  // The Swarm Queen: a volley of stingers (darts) fired out.
  volley: (p, ctx) => Array.from({ length: p.n || 10 }, (_, i) => {
    const a = p.scatter ? (Math.PI * 2 * i) / (p.n || 10) : Math.PI / 2 + (rnd(i, 101) - 0.5) * 1.6
    const r = (p.small ? 34 : 60) * ctx.scale * (0.7 + rnd(i, 103) * 0.4)
    return fly(`vl${i}`, <svg viewBox="0 0 30 10" width="100%" height="100%" aria-hidden="true" style={{ overflow: 'visible', filter: `drop-shadow(0 0 2px ${ctx.color})` }}><path d="M0 4.2 20 3 30 5 20 7 0 5.8Z" fill="#fff" stroke="#000b" strokeWidth=".8" /><path d="M20 3.4 30 5 20 6.6Z" fill={ctx.accent} /></svg>,
      { x1: Math.cos(a) * r, y1: Math.sin(a) * r, r0: deg(a), r1: deg(a), s0: 0.7, s1: 1.3, w: 24, ms: 460 * ctx.speed, delay: rnd(i, 105) * 220, ease: 'cubic-bezier(.3,.6,.5,1)' })
  }),
  // Moonmaw: three curved talons swoop through.
  talons: (p, ctx) => [-1, 0, 1].map((o, i) => (
    <div key={`tl${i}`} style={{ position: 'absolute', left: `${50 + o * 13}%`, top: `${50 + o * 3}%`, width: `${(p.small ? 60 : 90) * ctx.scale}cqw`, height: `${(p.small ? 60 : 90) * ctx.scale}cqw`, borderRadius: '50%',
      borderBottom: `${(p.small ? 1.6 : 2.6) * ctx.scale}cqw solid #ffffff`, borderLeft: `${0.8 * ctx.scale}cqw solid transparent`, borderRight: `${0.8 * ctx.scale}cqw solid transparent`,
      filter: `drop-shadow(0 0 2cqw ${ctx.color})`, '--r0': '-70deg', '--r1': '40deg', animation: `lgiSpin ${480 * ctx.speed}ms cubic-bezier(.3,.9,.3,1) ${i * 50}ms both` }} />
  )),
  // Moonmaw's knockout: a dark disc with a burning rim slides over.
  // p.cross: it sweeps right across the boss and away (Moonmaw's knockout: totality passes, the face is never hidden for long).
  eclipse: (p, ctx) => p.cross
    ? <div key="ec" style={{ position: 'absolute', left: '50%', top: '46%', width: '90cqw', height: '90cqw', marginLeft: '-45cqw', marginTop: '-45cqw', borderRadius: '50%', background: 'radial-gradient(circle, #05030fe6 60%, #1a1240cc 68%, transparent 71%)',
      boxShadow: `0 0 4cqw 1cqw ${ctx.color}`, animation: `lgkCross ${(p.ms || 1300) * ctx.speed}ms cubic-bezier(.45,.05,.55,.95) both` }} />
    : <div key="ec" style={{ position: 'absolute', left: '50%', top: '50%', width: '96cqw', height: '96cqw', borderRadius: '50%', background: 'radial-gradient(circle, #05030f 62%, #1a1240 70%, transparent 72%)',
      boxShadow: `0 0 4cqw 1cqw ${ctx.color}`, animation: `lgiEclipse ${1300 * ctx.speed}ms cubic-bezier(.3,.7,.3,1) both` }} />,
  // The Puppeteer: strings drop from above; yanked, or cut and falling.
  strings: (p, ctx) => Array.from({ length: p.n || 4 }, (_, i) => {
    const x = 20 + (60 * i) / Math.max(1, (p.n || 4) - 1)
    return <div key={`st${i}`} style={{ position: 'absolute', left: `${x}%`, top: '-60%', width: '0.7cqw', height: '110%', background: `linear-gradient(transparent, #fff, ${ctx.color})`, boxShadow: `0 0 1cqw ${ctx.color}`, transformOrigin: '50% 0',
      animation: p.cut ? `lgiMove ${900 * ctx.speed}ms ease-in ${i * 40}ms both` : `lgiDrop ${620 * ctx.speed}ms cubic-bezier(.3,.8,.3,1) ${i * 45}ms both`,
      '--x0': 0, '--y0': 0, '--x1': (rnd(i, 111) - 0.5) * 10, '--y1': 60, '--r0': '0deg', '--r1': `${(rnd(i, 113) - 0.5) * 40}deg`, '--s0': 1, '--s1': 1 }} />
  }),
  // The Sugar Queen's knockout: syrup drips down from the top.
  drip: (p, ctx) => Array.from({ length: p.n || 7 }, (_, i) => (
    <div key={`dp${i}`} style={{ position: 'absolute', left: `${8 + (84 * i) / Math.max(1, (p.n || 7) - 1)}%`, top: '-5%', width: `${5 + rnd(i, 121) * 4}cqw`, height: `${30 + rnd(i, 123) * 40}cqw`, transformOrigin: '50% 0',
      borderRadius: '0 0 50% 50%', background: `linear-gradient(${colorOf(p, ctx)}, #fff 85%, ${colorOf(p, ctx)})`, animation: `lgiDrip ${1100 * ctx.speed}ms cubic-bezier(.4,0,.6,1) ${rnd(i, 125) * 200}ms both` }} />
  )),
  // The Kitsune: foxfire orbs circle, then dart in (or fly out).
  orbit: (p, ctx) => <div key="ob" style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, animation: `lgiOrbit ${900 * ctx.speed}ms cubic-bezier(.3,.6,.4,1) both` }}>
    {Array.from({ length: p.n || 4 }, (_, i) => (
      <div key={i} style={{ position: 'absolute', left: 0, top: 0, transform: `rotate(${(360 / (p.n || 4)) * i}deg)` }}>
        <div style={{ width: '16cqw', height: '16cqw', marginLeft: '-8cqw', marginTop: '-8cqw', borderRadius: '50% 50% 50% 0', background: `radial-gradient(circle at 60% 40%, #fff 15%, ${colorOf(p, ctx)} 45%, ${colorOf(p, ctx)}00 75%)`, filter: `drop-shadow(0 0 2cqw ${colorOf(p, ctx)})`, '--r': 34 * ctx.scale,
          animation: `${p.out ? 'lgiOrbitOut' : 'lgiOrbitIn'} ${900 * ctx.speed}ms cubic-bezier(.5,0,.6,1) both` }} />
      </div>
    ))}
  </div>,
  // The Ophanim: wheels of light turning; slicing out at the player, or collapsing.
  halo: (p, ctx) => Array.from({ length: p.n || 2 }, (_, i) => (
    <div key={`ha${i}`} style={{ position: 'absolute', left: '50%', top: '50%', width: '80cqw', height: '80cqw', borderRadius: '50%', border: `${(p.small ? 1 : 1.6)}cqw solid ${i % 2 ? '#fff6d0' : ctx.color}`, boxShadow: `0 0 3cqw ${ctx.color}`,
      '--r0': `${i * 60}deg`, '--r1': `${i * 60 + (i % 2 ? -240 : 240)}deg`, '--s0': p.collapse ? 1.4 : 0.4, '--s1': p.collapse ? 0.05 : (p.slice ? 2 : 1.2) * ctx.scale,
      animation: `lgiHalo ${(p.slice ? 560 : 820) * ctx.speed}ms cubic-bezier(.3,.7,.3,1) ${i * 70}ms both` }} />
  )),
  // The Void: everything pulled into the centre.
  pull: (p, ctx) => Array.from({ length: p.n || 14 }, (_, i) => {
    const a = (Math.PI * 2 * i) / (p.n || 14) + rnd(i, 131)
    const r = (p.small ? 40 : 62) * (0.7 + rnd(i, 133) * 0.5)
    return fly(`pu${i}`, <Glyph name={glyphOf(p, ctx)} color={i % 3 ? ctx.color : '#ffffff'} accent={ctx.accent} />,
      { x0: Math.cos(a) * r, y0: Math.sin(a) * r, x1: 0, y1: 0, r0: 0, r1: 360, s0: 1.1, s1: 0.1, w: 8, ms: 720 * ctx.speed, delay: rnd(i, 135) * 160, ease: 'cubic-bezier(.6,0,.9,.6)' })
  }),
  // Shared: the white flash where a hit lands (every hit, bigger on a critical).
  flash: (p) => <div key="fl" style={{ position: 'absolute', left: '50%', top: '46%', width: `${p.big ? 56 : 38}cqw`, height: `${p.big ? 56 : 38}cqw`, filter: 'drop-shadow(0 0 2cqw #fff)', '--r0': '0deg', '--r1': '35deg', '--s0': 0.2, '--s1': 1.3,
    animation: `lgiSpin ${p.big ? 340 : 260}ms cubic-bezier(.1,.9,.3,1) both` }}><Glyph name="star4" color="#ffffff" accent="#ffffff" outline={false} /></div>,
  // Shared: a parry (blocked attack), a shield bubble, a heart back.
  parry: (p, ctx) => [45, -45].map((a, i) => (
    <div key={`pa${i}`} style={{ position: 'absolute', left: '50%', top: '50%', width: `${80 * ctx.scale}cqw`, height: '2.4cqw', borderRadius: 6, background: `linear-gradient(90deg, transparent, ${p.color || '#8fe3ff'}, #fff, ${p.color || '#8fe3ff'}, transparent)`, boxShadow: `0 0 2.5cqw ${p.color || '#8fe3ff'}`,
      '--a': `${a}deg`, animation: `lgiSlash 520ms cubic-bezier(.2,.9,.3,1) ${180 + i * 40}ms both` }} />
  )),
  bubble: () => <div key="bb" style={{ position: 'absolute', left: '50%', top: '50%', width: '96cqw', height: '96cqw', borderRadius: '50%', border: '1.2cqw solid #6fc3ff', boxShadow: '0 0 4cqw #6fc3ff, inset 0 0 6cqw #6fc3ff88',
    background: 'radial-gradient(circle at 35% 30%, #ffffff55, transparent 30%)', animation: 'lgiBubble 900ms ease-out 150ms both' }} />,
  heart: () => fly('hrt', <div style={{ fontSize: '20cqw', lineHeight: 1, textAlign: 'center' }}>💖</div>, { x0: 0, y0: 30, x1: 0, y1: -55, s0: 0.4, s1: 1.2, w: 15, ms: 1150, ease: 'cubic-bezier(.22,1,.36,1)' }),

  // ── MOMENT PARTS: what makes a critical, a Sharpen, a heavy blow, a block, a save and Second wind read as their own
  // moment (StrikeFxLayer). Each takes the boss's colors and its own params, so no two bosses play one the same way.
  // A critical: a jagged star (p.points tips, p.spin degrees) slams open behind the hit, a white star inside it.
  starburst: (p, ctx) => {
    const n = p.points || 8
    const pts = Array.from({ length: n * 2 }, (_, i) => {
      const a = (Math.PI * i) / n - Math.PI / 2
      const r = i % 2 ? 50 * (p.inner || 0.42) : 50
      return `${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`
    }).join(' ')
    const c = colorOf(p, ctx)
    return [0, 1].map((g) => (
      <div key={`st${g}`} style={{ position: 'absolute', left: '50%', top: '48%', width: `${(g ? 34 : 84) * ctx.scale}cqw`, height: `${(g ? 34 : 84) * ctx.scale}cqw`, filter: `drop-shadow(0 0 2.5cqw ${c})`,
        '--r0': `${g ? -(p.spin || 40) : 0}deg`, '--r1': `${g ? 0 : p.spin || 40}deg`, '--s0': 0.15, '--s1': g ? 1.15 : 1.35, animation: `lgiSpin ${(g ? 420 : 560) * ctx.speed}ms cubic-bezier(.1,.9,.25,1) ${g * 50}ms both` }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true"><polygon points={pts} fill={g ? '#ffffff' : `${c}4d`} stroke={g ? c : '#ffffff'} strokeWidth={g ? 2 : 3.5} strokeLinejoin="round" opacity={g ? 0.9 : 1} /></svg>
      </div>
    ))
  },
  // A Sharpen: p.n honed blades sweep across at p.angle, each leaving a white edge, a gold glint at the end.
  blade: (p, ctx) => {
    const c = colorOf(p, ctx)
    return Array.from({ length: p.n || 2 }, (_, i) => (
      <div key={`bl${i}`} style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, filter: `drop-shadow(0 0 0.5cqw #000000) drop-shadow(0 0 1.6cqw ${c})`, transform: `rotate(${(p.angle ?? -30) + i * (p.fan ?? 24)}deg)` }}>
        <div style={{ position: 'absolute', left: '-75cqw', top: `${-3.6 - i * 0.3}cqw`, width: '150cqw', height: `${7.2 + i * 0.6}cqw`, clipPath: 'polygon(0 50%, 14% 0, 100% 38%, 100% 62%, 14% 100%)',
          background: `linear-gradient(90deg, transparent 0%, ${c} 30%, #ffffff 58%, ${c} 78%, transparent 100%)`, boxShadow: `0 0 3cqw ${c}`,
          animation: `lgiBlade ${(p.ms || 460) * ctx.speed}ms cubic-bezier(.2,.9,.3,1) ${i * (p.gap || 90)}ms both` }} />
      </div>
    ))
  },
  // Small four-point twinkles popping at fixed spots (a fresh edge, a holy glint, a sugar sparkle).
  glint: (p, ctx) => Array.from({ length: p.n || 5 }, (_, i) => {
    const x = (rnd(i, 141) - 0.5) * 80
    const y = (rnd(i, 143) - 0.5) * 80
    const s = (p.size || 1) * (8 + rnd(i, 145) * 8)
    return <div key={`gl${i}`} style={{ position: 'absolute', left: `calc(50% + ${x}cqw)`, top: `calc(50% + ${y}cqw)`, width: `${s}cqw`, height: `${s}cqw`, filter: `drop-shadow(0 0 1.2cqw ${colorOf(p, ctx)})`,
      '--r0': '0deg', '--r1': '90deg', '--s0': 0, '--s1': 1, animation: `lgiTwinkle ${520 * ctx.speed}ms ease-out ${120 + rnd(i, 147) * 380}ms both` }}><Glyph name="star4" color={i % 2 ? '#ffffff' : colorOf(p, ctx)} accent={ctx.accent} outline={false} /></div>
  }),
  // A heavy blow: the ground ripples out under the boss in p.n flat rings, rubble jumping off it.
  quake: (p, ctx) => {
    const c = colorOf(p, ctx)
    return [
      ...Array.from({ length: p.n || 2 }, (_, i) => (
        <div key={`qk${i}`} style={{ position: 'absolute', left: '50%', top: `${p.top || 80}%`, width: '90cqw', height: '22cqw', borderRadius: '50%', border: `${2 - i * 0.5}cqw solid ${c}`, boxShadow: `0 0 3cqw ${c}`,
          animation: `lgiQuake ${(620 + i * 120) * ctx.speed}ms cubic-bezier(.1,.8,.3,1) ${i * 130}ms both` }} />
      )),
      ...Array.from({ length: p.rubble ?? 6 }, (_, i) => {
        const x = (i - ((p.rubble ?? 6) - 1) / 2) * 13
        return fly(`qr${i}`, <div style={{ width: '100%', height: '100%', background: i % 2 ? c : ctx.accent, clipPath: 'polygon(20% 0, 100% 30%, 80% 100%, 0 70%)' }} />,
          { x0: x * 0.6, y0: 32, xm: x, ym: -6 - rnd(i, 151) * 16, x1: x * 1.4, y1: 40, r0: 0, r1: (rnd(i, 153) - 0.5) * 400, s0: 0.6, s1: 1, w: 5, ms: 760 * ctx.speed, delay: 60 + rnd(i, 155) * 90, ease: 'linear' })
      }),
    ]
  },
  // A block: a p.sides-sided barrier sigil draws itself in a heartbeat, flashes and breaks apart.
  sigil: (p, ctx) => {
    const n = p.sides || 6
    const poly = (r, rot) => Array.from({ length: n }, (_, i) => {
      const a = (Math.PI * 2 * i) / n + ((rot || 0) * Math.PI) / 180 - Math.PI / 2
      return `${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`
    }).join(' ')
    const c = colorOf(p, ctx)
    return (
      <div key="sg" style={{ position: 'absolute', left: '50%', top: '50%', width: `${84 * ctx.scale}cqw`, height: `${84 * ctx.scale}cqw`, filter: `drop-shadow(0 0 2cqw ${c})`,
        '--r0': `${p.rot || 0}deg`, '--r1': `${(p.rot || 0) + (p.turn ?? 30)}deg`, '--s0': 0.6, '--s1': 1.15, animation: `lgiSpin ${780 * ctx.speed}ms cubic-bezier(.2,.8,.3,1) both` }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <polygon points={poly(46, 0)} fill={`${c}22`} stroke={c} strokeWidth="3" strokeLinejoin="round" style={{ '--len': 320, strokeDasharray: 320, animation: 'lgiDraw 700ms ease-out both' }} />
          <polygon points={poly(30, 180 / n)} fill="none" stroke="#ffffff" strokeWidth="2" style={{ '--len': 220, strokeDasharray: 220, animation: 'lgiDraw 640ms ease-out 80ms both' }} />
        </svg>
      </div>
    )
  },
  // A save: the boss's own glyphs fly at the player, hit the dome and glance off outward.
  deflect: (p, ctx) => Array.from({ length: p.n || 6 }, (_, i) => {
    const a = (Math.PI * (p.from === 'side' ? 1 : 1.5)) + ((i - ((p.n || 6) - 1) / 2) * 0.55)
    const far = 80
    const hit = 44
    return fly(`df${i}`, <Glyph name={glyphOf(p, ctx)} color={colorOf(p, ctx)} accent={ctx.accent} />,
      { x0: Math.cos(a) * far, y0: Math.sin(a) * far, xm: Math.cos(a) * hit, ym: Math.sin(a) * hit, x1: Math.cos(a + (i % 2 ? 0.9 : -0.9)) * far * 1.1, y1: Math.sin(a + (i % 2 ? 0.9 : -0.9)) * far * 1.1,
        r0: 0, r1: (i % 2 ? 1 : -1) * 260, s0: 1.2, s1: 0.9, w: 18, ms: 760 * ctx.speed, delay: 60 + i * 55, ease: 'linear' })
  }),
  // Second wind: p.n curved gusts sweep up around the boss.
  gust: (p, ctx) => {
    const c = colorOf(p, ctx)
    return (
      <div key="gu" style={{ position: 'absolute', left: '50%', top: '50%', width: '110cqw', height: '110cqw', '--r0': `${p.rot || 0}deg`, '--r1': `${(p.rot || 0) + (p.turn ?? -70)}deg`, '--s0': 0.7, '--s1': 1.1,
        animation: `lgiSpin ${1000 * ctx.speed}ms cubic-bezier(.3,.7,.4,1) both`, filter: `drop-shadow(0 0 1.2cqw ${c})` }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          {Array.from({ length: p.n || 3 }, (_, i) => {
            const r = 22 + i * 8
            const a0 = (i * 120 * Math.PI) / 180
            const d = `M ${50 + Math.cos(a0) * r} ${50 + Math.sin(a0) * r} A ${r} ${r} 0 0 1 ${50 + Math.cos(a0 + 2.2) * r} ${50 + Math.sin(a0 + 2.2) * r}`
            return <path key={i} d={d} fill="none" stroke={c} opacity={1 - i * 0.18} strokeWidth={5 - i * 0.7} strokeLinecap="round" style={{ '--len': 140, strokeDasharray: 140, animation: `lgiDraw ${760 * ctx.speed}ms ease-out ${i * 110}ms both` }} />
          })}
        </svg>
      </div>
    )
  },
  // A heartbeat: lub-dub pulses of soft light (Second wind's life coming back).
  pulse: (p, ctx) => [0, 1].map((i) => (
    <div key={`pu${i}`} style={{ position: 'absolute', left: '50%', top: '50%', width: '70cqw', height: '70cqw', borderRadius: '50%', background: `radial-gradient(circle, ${colorOf(p, ctx)}aa, ${colorOf(p, ctx)}33 55%, transparent 70%)`,
      animation: `lgiPulse ${900 * ctx.speed}ms ease-out ${i * 220}ms both` }} />
  )),

  // ── KNOCKOUT PARTS: the pieces of each raid boss's death (impact/styles.js `ko`, staged by their `at`). Each tells
  // one boss's own ending (a clock face shattering, a scream cut to a flat line, a crown rolling away...). They may run
  // as long as the boss's koMs (2 to 2.5 s), never longer, and none stays over the boss when it ends.
  // The killing blow's freeze frame: manga focus lines snap in round the rim and a dark rim closes, then both let go.
  speedlines: (p, ctx) => {
    const c = colorOf(p, ctx)
    const n = p.n || 40
    const ms = (p.ms || 560) * ctx.speed
    const mask = 'radial-gradient(circle, transparent 28%, #000 40%, #000 56%, transparent 64%)'
    return [
      <div key="sld" style={{ position: 'absolute', inset: '-20%', background: 'radial-gradient(closest-side, transparent 52%, #0a0612aa 82%, transparent 100%)', animation: `lgiFade ${ms}ms ease-out both` }} />,
      <div key="sll" style={{ position: 'absolute', left: '50%', top: '50%', width: '170cqw', height: '170cqw', marginLeft: '-85cqw', marginTop: '-85cqw', borderRadius: '50%',
        background: `repeating-conic-gradient(from ${p.rot || 0}deg, ${c} 0deg 1.1deg, transparent 1.1deg ${(360 / n).toFixed(2)}deg)`, WebkitMaskImage: mask, maskImage: mask,
        animation: `lgkSpeed ${ms}ms cubic-bezier(.2,.8,.3,1) both` }} />,
    ]
  },
  // Power gathering before it bursts: a hot core swells while the boss's glyphs are sucked into it.
  charge: (p, ctx) => {
    const c = colorOf(p, ctx)
    const ms = (p.ms || 820) * ctx.speed
    const n = p.n || 12
    return [
      <div key="cc" style={{ position: 'absolute', left: '50%', top: '50%', width: '56cqw', height: '56cqw', marginLeft: '-28cqw', marginTop: '-28cqw', borderRadius: '50%',
        background: `radial-gradient(circle, #ffffff 0, ${c} 26%, ${c}77 46%, transparent 68%)`, animation: `lgkCore ${ms}ms cubic-bezier(.5,0,.7,1) both` }} />,
      ...Array.from({ length: n }, (_, i) => {
        const a = (Math.PI * 2 * i) / n + rnd(i, 161) * 0.4
        const r = 58 * (0.8 + rnd(i, 163) * 0.4)
        return fly(`cg${i}`, <Glyph name={glyphOf(p, ctx)} color={c} accent={ctx.accent} />,
          { x0: Math.cos(a) * r, y0: Math.sin(a) * r, x1: 0, y1: 0, r0: 0, r1: 200, s0: 1, s1: 0.2, w: 7 * (p.size || 1), ms: ms * 0.7, delay: rnd(i, 165) * ms * 0.2, ease: 'cubic-bezier(.6,0,.9,.5)' })
      }),
    ]
  },
  // Chronos: its clock face stands over it, holds still (time stopped), then shudders and falls away.
  dial: (p, ctx) => {
    const c = colorOf(p, ctx)
    const ticks = Array.from({ length: 12 }, (_, i) => {
      const a = (Math.PI * i) / 6
      const r0 = i % 3 ? 39 : 34
      return <line key={i} x1={50 + Math.cos(a) * r0} y1={50 + Math.sin(a) * r0} x2={50 + Math.cos(a) * 44} y2={50 + Math.sin(a) * 44} stroke={i % 3 ? c : '#ffffff'} strokeWidth={i % 3 ? 1.6 : 3} strokeLinecap="round" />
    })
    return (
      <div key="dl" style={{ position: 'absolute', left: '50%', top: '50%', width: '92cqw', height: '92cqw', marginLeft: '-46cqw', marginTop: '-46cqw', filter: `drop-shadow(0 0 1.5cqw ${c})`, animation: `lgkDial ${(p.ms || 1500) * ctx.speed}ms cubic-bezier(.3,.7,.4,1) both` }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <circle cx="50" cy="50" r="47" fill={`${c}14`} stroke={c} strokeWidth="2.4" />
          <circle cx="50" cy="50" r="44" fill="none" stroke="#ffffff" strokeWidth=".8" opacity=".7" />
          {ticks}
          <circle cx="50" cy="50" r="2.6" fill="#ffffff" stroke={c} />
        </svg>
      </div>
    )
  },
  // The Banshee: its last scream as a waveform across the box, crushed flat in an instant (silence), then gone.
  flatline: (p, ctx) => {
    const c = colorOf(p, ctx)
    const pts = Array.from({ length: 41 }, (_, i) => {
      const env = Math.sin((i / 40) * Math.PI)
      return `${i * 2.5},${(50 + (i % 2 ? 1 : -1) * env * (18 + rnd(i, 171) * 28)).toFixed(1)}`
    }).join(' ')
    return (
      <div key="fln" style={{ position: 'absolute', left: '-15%', width: '130%', top: '28%', height: '44%', filter: `drop-shadow(0 0 1.4cqw ${c})`, animation: `lgkFlat ${(p.ms || 1300) * ctx.speed}ms cubic-bezier(.5,0,.3,1) both` }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
          <polyline points={pts} fill="none" stroke={c} strokeWidth="5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity=".7" />
          <polyline points={pts} fill="none" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    )
  },
  // Soft puffs (smoke rising, or a mist / storm clouds rolling outward from the rim, p.dir 'out'), growing as they
  // fade; the outward ones start at the rim so the face stays clear.
  smoke: (p, ctx) => Array.from({ length: p.n || 10 }, (_, i) => {
    const n = p.n || 10
    const c = colorOf(p, ctx)
    const out = p.dir === 'out'
    const a = (Math.PI * 2 * i) / n + rnd(i, 173) * 0.5
    const x0 = out ? Math.cos(a) * 30 : (rnd(i, 175) - 0.5) * 40
    const y0 = out ? Math.sin(a) * 30 : 10 + rnd(i, 177) * 20
    return fly(`sm${i}`, <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: `radial-gradient(circle, ${c}dd, ${c}88 40%, ${c}00 70%)` }} />,
      { x0, y0, x1: out ? Math.cos(a) * 64 : x0 + (rnd(i, 179) - 0.5) * 30, y1: out ? Math.sin(a) * 64 : -58 - rnd(i, 181) * 12, s0: 0.5, s1: 2.2, w: 20 * (p.size || 1), ms: (p.ms || 1200) * ctx.speed, delay: rnd(i, 183) * 300, ease: 'cubic-bezier(.2,.6,.4,1)', midOpacity: 0.7 })
  }),
  // The Seraph: its wings spread wide one last time, catch fire, char and fall away.
  wings: (p, ctx) => {
    const c = colorOf(p, ctx)
    const feathers = Array.from({ length: 7 }, (_, k) => {
      const th = ((150 + k * 11) * Math.PI) / 180
      const len = 88 - Math.abs(k - 3) * 7
      const tx = 100 + Math.cos(th) * len
      const ty = 50 + Math.sin(th) * len
      const mx = 100 + Math.cos(th) * len * 0.55
      const my = 50 + Math.sin(th) * len * 0.55
      const nx = -Math.sin(th) * 7
      const ny = Math.cos(th) * 7
      return <path key={k} d={`M100 50Q${(mx + nx).toFixed(1)} ${(my + ny).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}Q${(mx - nx).toFixed(1)} ${(my - ny).toFixed(1)} 100 50Z`} fill={k % 2 ? '#ffb300' : c} stroke={ctx.accent} strokeWidth="1.4" />
    })
    return [-1, 1].map((s) => (
      <div key={`wg${s}`} style={{ position: 'absolute', left: '50%', top: '40%', width: 0, height: 0, transform: s > 0 ? 'scaleX(-1)' : undefined }}>
        <div style={{ position: 'absolute', right: 0, top: '-34cqw', width: '68cqw', height: '68cqw', transformOrigin: '100% 50%', animation: `lgkWing ${(p.ms || 1300) * ctx.speed}ms cubic-bezier(.3,.7,.4,1) both` }}>
          <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true" style={{ overflow: 'visible', filter: `drop-shadow(0 0 0.4cqw #3a2400) drop-shadow(0 0 2cqw ${c})` }}>{feathers}</svg>
        </div>
      </div>
    ))
  },
  // The Titan: its armor plates blow off one after another (a chain of blasts), each plate tumbling away.
  popchain: (p, ctx) => {
    const c = colorOf(p, ctx)
    const gap = (p.gap || 170) * ctx.speed
    const SPOTS = [[-24, -16], [22, -8], [-12, 16], [26, 18], [-28, 6], [4, -28], [10, 10]]
    return SPOTS.slice(0, p.n || 6).flatMap(([x, y], i) => [
      <div key={`pb${i}`} style={{ position: 'absolute', left: `calc(50% + ${x}cqw)`, top: `calc(50% + ${y}cqw)`, width: '30cqw', height: '30cqw', marginLeft: '-15cqw', marginTop: '-15cqw', borderRadius: '50%',
        background: `radial-gradient(circle, #ffffff 0, #fff2b0 18%, ${c} 40%, ${c}00 68%)`, animation: `lgkBlast ${440 * ctx.speed}ms ease-out ${i * gap}ms both` }} />,
      fly(`pp${i}`, <div style={{ width: '100%', height: '70%', marginTop: '15%', borderRadius: '1.2cqw', background: `linear-gradient(135deg, #ffd9a8, ${c} 45%, ${ctx.accent})`, border: '0.5cqw solid #1a0a02', boxShadow: 'inset 0 0 0 0.6cqw #ffffff44' }} />,
        { x0: x, y0: y, xm: x * 1.7, ym: y * 1.4 - 22, x1: x * 2.2, y1: y + 44, r0: 0, r1: (i % 2 ? 1 : -1) * 520, s0: 0.9, s1: 1, w: 13, ms: 920 * ctx.speed, delay: i * gap + 40, ease: 'linear' }),
    ])
  },
  // The Gorgon: a front of stone climbs the body from the feet up (its own gaze turned on it), then fades.
  front: (p, ctx) => {
    const c = colorOf(p, ctx)
    return (
      <div key="fr" style={{ position: 'absolute', left: '-12%', width: '124%', top: '-5%', height: '110%', overflow: 'hidden', WebkitMaskImage: SIDE_FADE, maskImage: SIDE_FADE }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '130cqw', background: `linear-gradient(#ffffff 0, ${c} 1.4cqw, #b9c2bc88 3cqw, #8b938e4d 30%, #6f776f33 100%)`, boxShadow: `0 -1cqw 3cqw ${c}`,
          animation: `lgkFront ${(p.ms || 1000) * ctx.speed}ms cubic-bezier(.4,0,.5,1) both` }} />
      </div>
    )
  },
  // A roar as a jagged shock shape (with two echoes): the Chimera roars once per head, each in its own color.
  roar: (p, ctx) => {
    const c = colorOf(p, ctx)
    const n = p.spikes || 11
    const pts = Array.from({ length: n * 2 }, (_, i) => {
      const a = (Math.PI * i) / n
      const r = i % 2 ? 30 + rnd(i + n, 185) * 6 : 46 + rnd(i + n, 187) * 4
      return `${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`
    }).join(' ')
    return [0, 1, 2].map((g) => (
      <div key={`ro${g}`} style={{ position: 'absolute', left: '50%', top: '46%', width: '80cqw', height: '80cqw', marginLeft: '-40cqw', marginTop: '-40cqw', '--rr': `${(p.turn ?? 24) * (g % 2 ? -1 : 1)}deg`,
        filter: `drop-shadow(0 0 1.6cqw ${c})`, animation: `lgkRoar ${(p.ms || 620) * ctx.speed}ms cubic-bezier(.15,.85,.35,1) ${g * 90}ms both` }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true"><polygon points={pts} fill={g ? 'none' : `${c}26`} stroke={g ? c : '#ffffff'} strokeWidth={g ? 2.4 : 3.2} strokeLinejoin="round" /></svg>
      </div>
    ))
  },
  // The Rat King: its crown pops off its head, falls, bounces twice and rolls away out of the frame.
  crown: (p, ctx) => {
    const c = colorOf(p, ctx)
    return (
      <div key="cr" style={{ position: 'absolute', left: '50%', top: '50%', width: '28cqw', height: '28cqw', marginLeft: '-14cqw', marginTop: '-14cqw', filter: `drop-shadow(0 0 1.4cqw ${c}) drop-shadow(0 0.6cqw 0 #0007)`, animation: `lgkCrown ${(p.ms || 1700) * ctx.speed}ms linear both` }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <path d="M12 74 20 30 37 52 50 18 63 52 80 30 88 74Z" fill={c} stroke="#5a3a00" strokeWidth="3" strokeLinejoin="round" />
          <rect x="12" y="70" width="76" height="13" rx="3" fill={c} stroke="#5a3a00" strokeWidth="3" />
          <path d="M22 62H78" stroke="#ffffff99" strokeWidth="2" />
          <circle cx="50" cy="18" r="5" fill="#ff3b52" stroke="#5a3a00" strokeWidth="2" />
          <circle cx="20" cy="30" r="4" fill="#4ac8ff" stroke="#5a3a00" strokeWidth="2" />
          <circle cx="80" cy="30" r="4" fill="#5dff9a" stroke="#5a3a00" strokeWidth="2" />
          <circle cx="50" cy="76.5" r="3.4" fill="#ff3b52" />
        </svg>
      </div>
    )
  },
  // The Showman: a spotlight finds it, narrows to a pin, and snaps off (its pool of light on the floor with it).
  spotlight: (p, ctx) => {
    const c = colorOf(p, ctx)
    const ms = (p.ms || 1400) * ctx.speed
    return [
      <div key="spc" style={{ position: 'absolute', left: '50%', top: '-35%', width: '100cqw', height: '135cqw', transformOrigin: '50% 0', clipPath: 'polygon(46% 0, 54% 0, 100% 100%, 0 100%)',
        background: `linear-gradient(${c}cc, ${c}55 60%, ${c}00)`, animation: `lgkSpot ${ms}ms cubic-bezier(.4,0,.3,1) both` }} />,
      <div key="spf" style={{ position: 'absolute', left: '50%', top: '80%', width: '84cqw', height: '16cqw', borderRadius: '50%', background: `radial-gradient(closest-side, ${c}dd, ${c}00)`,
        animation: `lgkSpot ${ms}ms cubic-bezier(.4,0,.3,1) both` }} />,
    ]
  },
  // The Reaper: its scythe strains, SNAPS in two at the shaft, and both halves tumble away.
  scythe: (p, ctx) => {
    const c = colorOf(p, ctx)
    const ms = (p.ms || 1300) * ctx.speed
    const art = (
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
        <path d="M30 94 66 8" stroke="#1c1418" strokeWidth="6.5" strokeLinecap="round" />
        <path d="M30 94 66 8" stroke="#8a6a52" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M66 8C42-2 14 8 4 34 22 20 42 16 64 22Z" fill="#e8fbff" stroke={c} strokeWidth="2" strokeLinejoin="round" />
      </svg>
    )
    return [
      ...[['A', 'inset(0 0 52% 0)'], ['B', 'inset(48% 0 0 0)']].map(([h, clip]) => (
        <div key={`sc${h}`} style={{ position: 'absolute', left: '50%', top: '50%', width: '84cqw', height: '84cqw', marginLeft: '-42cqw', marginTop: '-42cqw', clipPath: clip, filter: `drop-shadow(0 0 1.6cqw ${c})`, animation: `lgkScythe${h} ${ms}ms cubic-bezier(.3,.7,.4,1) both` }}>{art}</div>
      )),
      <div key="scs" style={{ position: 'absolute', left: 'calc(50% - 1cqw)', top: '50%', width: '28cqw', height: '28cqw', marginLeft: '-14cqw', marginTop: '-14cqw', '--r0': '0deg', '--r1': '90deg', animation: `lgiTwinkle ${420 * ctx.speed}ms ease-out ${ms * 0.44}ms both` }}><Glyph name="star4" color="#ffffff" accent="#ffffff" outline={false} /></div>,
    ]
  },
  // The Leviathan: the water rises over it (translucent, it shows through), sloshes and drains away.
  flood: (p, ctx) => {
    const c = colorOf(p, ctx)
    const ms = (p.ms || 1800) * ctx.speed
    return (
      <div key="fd" style={{ position: 'absolute', left: '-14%', width: '128%', bottom: '-6%', height: '74%', overflow: 'hidden', WebkitMaskImage: SIDE_FADE, maskImage: SIDE_FADE }}>
        <div style={{ position: 'absolute', inset: 0, animation: `lgkFlood ${ms}ms cubic-bezier(.4,0,.4,1) both` }}>
          <div style={{ position: 'absolute', left: '-10%', width: '120%', top: 0, height: '100%', animation: `lgkSlosh ${Math.round(ms / 2)}ms ease-in-out 2` }}>
            <svg viewBox="0 0 120 100" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 10C10 2 20 2 30 10S50 18 60 10 80 2 90 10 110 18 120 10V100H0Z" fill={c} opacity=".55" />
              <path d="M0 10C10 2 20 2 30 10S50 18 60 10 80 2 90 10 110 18 120 10" fill="none" stroke="#ffffff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              <path d="M0 22C12 16 22 18 34 24S56 30 70 22 96 16 120 24" fill="none" stroke="#e8f8ff" strokeWidth="1.2" opacity=".6" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </div>
      </div>
    )
  },
  // The Lich: its phylactery appears, pulses faster and faster, cracks, and is gone (the shards fly as another part).
  gem: (p, ctx) => {
    const c = colorOf(p, ctx)
    const ms = (p.ms || 1450) * ctx.speed
    return (
      <div key="gm" style={{ position: 'absolute', left: '50%', top: `${p.top || 44}%`, width: '28cqw', height: '28cqw', marginLeft: '-14cqw', marginTop: '-14cqw', filter: `drop-shadow(0 0 2.4cqw ${c})`, animation: `lgkGem ${ms}ms ease-in-out both` }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <path d="M50 4 82 30 66 94H34L18 30Z" fill={`${c}cc`} stroke="#ffffff" strokeWidth="3" strokeLinejoin="round" />
          <path d="M18 30H82M50 4 38 30 50 94 62 30Z" fill="none" stroke="#ffffff" strokeWidth="1.6" opacity=".7" />
          <polyline points="52,8 44,30 56,48 46,70 54,90" fill="none" stroke="#062a14" strokeWidth="2.6" style={{ '--len': 110, strokeDasharray: 110, animation: `lgiDraw ${Math.round(ms * 0.35)}ms ease-out ${Math.round(ms * 0.45)}ms both` }} />
        </svg>
      </div>
    )
  },
  // Cerberus: the chain that held it stretches across the box, strains and SNAPS, both ends swinging down.
  chainsnap: (p, ctx) => {
    const c = colorOf(p, ctx)
    const ms = (p.ms || 1300) * ctx.speed
    const links = (
      <svg viewBox="0 0 110 14" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true" style={{ overflow: 'visible' }}>
        {Array.from({ length: 10 }, (_, i) => <ellipse key={`u${i}`} cx={6 + i * 10.5} cy="7" rx="6.4" ry={i % 2 ? 1.8 : 4.4} fill="none" stroke="#06302a" strokeWidth="3.6" />)}
        {Array.from({ length: 10 }, (_, i) => <ellipse key={`h${i}`} cx={6 + i * 10.5} cy="7" rx="6.4" ry={i % 2 ? 1.8 : 4.4} fill="none" stroke={i % 2 ? '#ffffff' : c} strokeWidth="2" />)}
      </svg>
    )
    const half = { position: 'absolute', top: `${p.top || 52}%`, width: '62cqw', height: '12cqw', marginTop: '-6cqw', filter: `drop-shadow(0 0 1.2cqw ${c})` }
    return [
      <div key="chl" style={{ ...half, right: '50%', transformOrigin: '0 50%', animation: `lgkChainL ${ms}ms cubic-bezier(.3,.7,.4,1) both` }}>{links}</div>,
      <div key="chr" style={{ ...half, left: '50%', transformOrigin: '100% 50%', animation: `lgkChainR ${ms}ms cubic-bezier(.3,.7,.4,1) both` }}>{links}</div>,
      <div key="chs" style={{ position: 'absolute', left: '50%', top: `${p.top || 52}%`, width: '30cqw', height: '30cqw', marginLeft: '-15cqw', marginTop: '-15cqw', '--r0': '0deg', '--r1': '90deg', animation: `lgiTwinkle ${440 * ctx.speed}ms ease-out ${Math.round(ms * 0.44)}ms both` }}><Glyph name="star4" color="#ffffff" accent="#ffffff" outline={false} /></div>,
    ]
  },
  // Flames over the heads gutter out one by one (Cerberus's three fires dying).
  gutter: (p, ctx) => {
    const n = p.n || 3
    const c = colorOf(p, ctx)
    const ms = (p.ms || 1200) * ctx.speed
    return Array.from({ length: n }, (_, i) => {
      const o = i - (n - 1) / 2
      const x = o * (p.spread || 26)
      const y = (p.y ?? -30) + Math.abs(o) * 6
      return <div key={`gt${i}`} style={{ position: 'absolute', left: `calc(50% + ${x}cqw)`, top: `calc(50% + ${y}cqw)`, width: '18cqw', height: '18cqw', marginLeft: '-9cqw', marginTop: '-9cqw', transformOrigin: '50% 90%',
        filter: `drop-shadow(0 0 1.6cqw ${c})`, animation: `lgkGutter ${ms}ms ease-in-out ${i * (p.gap || 140)}ms both` }}><Glyph name="flame" color={c} accent={ctx.accent} /></div>
    })
  },
  // The Dreamer: bubbles bloom all round it, wobble, and pop one after another (each pop a ring).
  bubbles: (p, ctx) => {
    const n = p.n || 9
    const c = colorOf(p, ctx)
    const base = (p.ms || 700) * ctx.speed
    const gap = (p.gap || 70) * ctx.speed
    return Array.from({ length: n }, (_, i) => {
      const a = (Math.PI * 2 * i) / n + rnd(i, 191) * 0.5
      const r = 22 + rnd(i, 193) * 18
      const x = Math.cos(a) * r
      const y = Math.sin(a) * r
      const s = 14 + rnd(i, 195) * 10
      const life = base + i * gap
      const at = { position: 'absolute', left: `calc(50% + ${x.toFixed(1)}cqw)`, top: `calc(50% + ${y.toFixed(1)}cqw)`, width: `${s.toFixed(1)}cqw`, height: `${s.toFixed(1)}cqw`, borderRadius: '50%' }
      return [
        <div key={`bu${i}`} style={{ ...at, marginLeft: `${(-s / 2).toFixed(1)}cqw`, marginTop: `${(-s / 2).toFixed(1)}cqw`, border: `0.7cqw solid ${c}`, boxShadow: `0 0 1.5cqw ${c}`,
          background: `radial-gradient(circle at 32% 30%, #ffffffdd 0 12%, ${c}33 30%, ${c}11 60%, ${c}55 100%)`, animation: `lgkBubbleLife ${Math.round(life)}ms ease-in-out both` }} />,
        <div key={`bp${i}`} style={{ ...at, border: '0.5cqw solid #ffffff', '--s0': 0.6, '--s1': 1.8, animation: `lgiRing ${Math.round(300 * ctx.speed)}ms ease-out ${Math.round(life * 0.88)}ms both` }} />,
      ]
    }).flat()
  },
  // The Berserker: its axe slips from its grip, spins down and bites into the ground beside it, quivering.
  axefall: (p, ctx) => (
    <div key="ax" style={{ position: 'absolute', left: '50%', top: '50%', width: '58cqw', height: '58cqw', marginLeft: '-29cqw', marginTop: '-29cqw', filter: `drop-shadow(0 0 0.5cqw #ffffff) drop-shadow(0 0 2cqw ${ctx.color}) drop-shadow(0 0.8cqw 0 #0008)`, animation: `lgkAxe ${(p.ms || 1500) * ctx.speed}ms linear both` }}>
      <Glyph name="axe" color={ctx.color} accent={ctx.accent} />
    </div>
  ),
  // The Swarm Queen: her swarm deserts her, bees zigzagging off in every direction.
  swarm: (p, ctx) => Array.from({ length: p.n || 28 }, (_, i) => {
    const n = p.n || 28
    const a = (Math.PI * 2 * i) / n + rnd(i, 201) * 0.6
    const r = 62 + rnd(i, 203) * 14
    const wig = (i % 2 ? 1 : -1) * (8 + rnd(i, 205) * 10)
    const bee = <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'repeating-linear-gradient(90deg, #ffd21a 0 28%, #2a1800 28% 46%)', boxShadow: '0 0 0 0.3cqw #2a1800, -0.6cqw -0.8cqw 0 -0.2cqw #ffffffcc' }} />
    return fly(`sw${i}`, bee, { x0: Math.cos(a) * 8, y0: Math.sin(a) * 8, xm: Math.cos(a) * r * 0.45 - Math.sin(a) * wig, ym: Math.sin(a) * r * 0.45 + Math.cos(a) * wig, x1: Math.cos(a) * r, y1: Math.sin(a) * r,
      r0: deg(a), r1: deg(a) + wig * 4, s0: 0.7, s1: 1.2, w: 5.5, ms: (p.ms || 900) * ctx.speed, delay: rnd(i, 207) * 500, ease: 'cubic-bezier(.3,.5,.6,1)' })
  }),
  // Moonmaw: totality's diamond ring, a thin bright rim with one blinding bead flaring on it.
  diamondring: (p, ctx) => {
    const c = colorOf(p, ctx)
    const ms = (p.ms || 1000) * ctx.speed
    return [
      <div key="dr" style={{ position: 'absolute', left: '50%', top: '50%', width: '92cqw', height: '92cqw', borderRadius: '50%', border: `0.8cqw solid ${c}`, boxShadow: `0 0 3cqw ${c}, inset 0 0 3cqw ${c}`, '--s0': 0.94, '--s1': 1.06, animation: `lgiRing ${ms}ms ease-out both` }} />,
      <div key="db" style={{ position: 'absolute', left: 'calc(50% + 32cqw)', top: 'calc(50% - 32cqw)', width: '30cqw', height: '30cqw', marginLeft: '-15cqw', marginTop: '-15cqw', filter: `drop-shadow(0 0 2.4cqw #ffffff) drop-shadow(0 0 4cqw ${c})`, animation: `lgkBead ${Math.round(ms * 0.8)}ms ease-out ${Math.round(ms * 0.15)}ms both` }}>
        <Glyph name="star4" color="#ffffff" accent="#ffffff" outline={false} />
      </div>,
    ]
  },
  // The Hydra: its heads (at the edges of the frame, clear of its face) droop and drop off one by one.
  heads: (p, ctx) => {
    const c = colorOf(p, ctx)
    const ms = (p.ms || 1000) * ctx.speed
    const gap = (p.gap || 160) * ctx.speed
    const SPOTS = [[-44, 1], [44, -1], [-30, 1], [30, -1], [0, 1]]
    return SPOTS.slice(0, p.n || 5).map(([x, sd], i) => (
      <div key={`hd${i}`} style={{ position: 'absolute', left: `calc(50% + ${x}cqw)`, top: x ? '-14%' : '-24%', width: '19cqw', height: '58cqw', marginLeft: '-9.5cqw', transformOrigin: '50% 0', '--sd': sd,
        filter: `drop-shadow(0 0 1.2cqw ${c})`, animation: `lgkHead ${ms}ms cubic-bezier(.4,0,.5,1) ${i * gap}ms both` }}>
        <svg viewBox="0 0 20 62" width="100%" height="100%" aria-hidden="true" style={{ overflow: 'visible' }}>
          <path d="M10 0C3 16 17 28 10 44" fill="none" stroke="#062436" strokeWidth="7.5" strokeLinecap="round" />
          <path d="M10 0C3 16 17 28 10 44" fill="none" stroke={c} strokeWidth="5" strokeLinecap="round" />
          <path d="M3 44C3 38 17 38 17 44L15 56C13 60 7 60 5 56Z" fill={c} stroke="#062436" strokeWidth="1.4" />
          <circle cx="7" cy="46" r="1.4" fill="#ffffff" />
          <circle cx="13" cy="46" r="1.4" fill="#ffffff" />
          <path d="M6 56 7.5 61 9 56M11 56 12.5 61 14 56" fill="#ffffff" />
        </svg>
      </div>
    ))
  },
  // The Kaleidoscope: a rainbow rosette (open in the middle) spins up round it, then flies apart.
  mandala: (p, ctx) => {
    const n = p.n || 12
    const petals = Array.from({ length: n }, (_, i) => (
      <g key={i} transform={`rotate(${(360 / n) * i} 50 50)`}>
        <path d="M50 28 45 16 50 3 55 16Z" fill={RAINBOW[i % RAINBOW.length]} opacity=".85" stroke="#ffffff" strokeWidth=".8" />
        <path d="M50 30 47.5 25 50 20 52.5 25Z" fill="#ffffff" opacity=".8" transform={`rotate(${180 / n} 50 50)`} />
      </g>
    ))
    return (
      <div key="md" style={{ position: 'absolute', left: '50%', top: '50%', width: '96cqw', height: '96cqw', marginLeft: '-48cqw', marginTop: '-48cqw', filter: 'drop-shadow(0 0 1.4cqw #ffffff)', animation: `lgkMandala ${(p.ms || 1300) * ctx.speed}ms cubic-bezier(.4,.1,.6,1) both` }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          {petals}
          <circle cx="50" cy="50" r="31" fill="none" stroke="#ffffff" strokeWidth=".8" strokeDasharray="2 2" />
        </svg>
      </div>
    )
  },
  // The Puppeteer: a pair of shears closes over its strings, snip, snip.
  snip: (p, ctx) => {
    const c = colorOf(p, ctx)
    const ms = (p.ms || 800) * ctx.speed
    const top = `${p.top || 14}%`
    const blade = (s) => (
      <div key={`sn${s}`} style={{ position: 'absolute', left: '50%', top, width: '72cqw', height: '13cqw', marginLeft: '-36cqw', marginTop: '-6.5cqw', '--s': s, filter: `drop-shadow(0 0 0.5cqw #ffffff) drop-shadow(0 0 1.6cqw ${c})`, animation: `lgkSnip ${ms}ms cubic-bezier(.5,0,.3,1) both` }}>
        <svg viewBox="0 0 100 18" width="100%" height="100%" aria-hidden="true" style={{ overflow: 'visible', transform: s < 0 ? 'scaleX(-1)' : undefined }}>
          <path d="M50 7 98 7.5 50 12.5Z" fill="#ffffff" stroke="#1a0006" strokeWidth="1.2" strokeLinejoin="round" />
          <circle cx="16" cy="9" r="7" fill="none" stroke={c} strokeWidth="3" />
          <path d="M23 9H50" stroke={c} strokeWidth="3" />
          <circle cx="50" cy="9" r="2" fill="#ffffff" />
        </svg>
      </div>
    )
    return [blade(1), blade(-1),
      <div key="sns" style={{ position: 'absolute', left: '50%', top, width: '24cqw', height: '24cqw', marginLeft: '-12cqw', marginTop: '-12cqw', '--r0': '0deg', '--r1': '90deg', animation: `lgiTwinkle ${380 * ctx.speed}ms ease-out ${Math.round(ms * 0.48)}ms both` }}><Glyph name="star4" color="#ffffff" accent="#ffffff" outline={false} /></div>]
  },
  // The Sugar Queen: a glossy pool of syrup spreads under it as it melts.
  puddle: (p, ctx) => {
    const c = colorOf(p, ctx)
    return <div key="pd" style={{ position: 'absolute', left: '50%', top: `${p.top || 86}%`, width: '120cqw', height: '22cqw', marginLeft: '-60cqw', marginTop: '-11cqw', borderRadius: '50%',
      background: `radial-gradient(ellipse at 40% 35%, #ffffffcc 0 6%, ${c}ee 20%, ${c}cc 55%, ${c}00 72%)`, animation: `lgkPuddle ${(p.ms || 1600) * ctx.speed}ms cubic-bezier(.3,.7,.4,1) both` }} />
  },
  // The Kitsune: its nine tails fan out like a peacock's, then each breaks loose as a flame of foxfire.
  tails: (p, ctx) => {
    const n = p.n || 9
    const c = colorOf(p, ctx)
    const tip = p.tip || '#7fe8ff'
    const ms = (p.ms || 1300) * ctx.speed
    return Array.from({ length: n }, (_, i) => (
      <div key={`tl${i}`} style={{ position: 'absolute', left: '50%', top: `${p.top || 92}%`, width: 0, height: 0, opacity: 0.8 }}>
        <div style={{ position: 'absolute', left: '-6cqw', bottom: 0, width: '12cqw', height: '50cqw', transformOrigin: '50% 100%', '--ta': `${(-100 + (200 * i) / Math.max(1, n - 1)).toFixed(1)}deg`, filter: `drop-shadow(0 0 1.4cqw ${tip})`,
          animation: `lgkTail ${ms}ms cubic-bezier(.3,.7,.4,1) ${Math.round(Math.abs(i - (n - 1) / 2) * 40)}ms both` }}>
          <svg viewBox="0 0 20 80" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
            <path d="M10 80C2 62 0 40 6 22 8 12 12 4 10 0 16 10 20 30 18 50 17 64 14 74 10 80Z" fill={c} opacity=".8" />
            <path d="M10 6C14 14 15 26 13 36 11 26 9 16 10 6Z" fill={tip} />
          </svg>
        </div>
      </div>
    ))
  },
  // The Ophanim: a great eye of light opens over it, flutters, and closes for good.
  eyeclose: (p, ctx) => {
    const c = colorOf(p, ctx)
    return (
      <div key="ey" style={{ position: 'absolute', left: '50%', top: `${p.top || 50}%`, width: '84cqw', height: '46cqw', marginLeft: '-42cqw', marginTop: '-23cqw', filter: `drop-shadow(0 0 2cqw ${c})`, animation: `lgkEye ${(p.ms || 1400) * ctx.speed}ms cubic-bezier(.4,0,.4,1) both` }}>
        <svg viewBox="0 0 100 50" width="100%" height="100%" aria-hidden="true">
          <path d="M2 25C22 2 78 2 98 25 78 48 22 48 2 25Z" fill={`${c}22`} stroke={c} strokeWidth="2.6" />
          <circle cx="50" cy="25" r="13" fill="none" stroke="#ffffff" strokeWidth="2" />
          <circle cx="50" cy="25" r="6" fill={c} />
          <path d="M2 25C22 2 78 2 98 25" fill="none" stroke="#ffffff" strokeWidth="1.2" opacity=".8" />
        </svg>
      </div>
    )
  },
  // Inferno: what is left of it, a bed of coals at its feet glowing white hot and cooling to ash.
  embers: (p, ctx) => Array.from({ length: p.n || 11 }, (_, i) => {
    const n = p.n || 11
    const c = colorOf(p, ctx)
    const x = (i - (n - 1) / 2) * (84 / n) + (rnd(i, 211) - 0.5) * 4
    const y = 38 + rnd(i, 213) * 8 - Math.abs(i - (n - 1) / 2) * 0.8
    const s = 7 + rnd(i, 215) * 6
    return <div key={`em${i}`} style={{ position: 'absolute', left: `calc(50% + ${x.toFixed(1)}cqw)`, top: `calc(50% + ${y.toFixed(1)}cqw)`, width: `${s.toFixed(1)}cqw`, height: `${(s * 0.7).toFixed(1)}cqw`, marginLeft: `${(-s / 2).toFixed(1)}cqw`, marginTop: `${(-s * 0.35).toFixed(1)}cqw`,
      borderRadius: '45% 55% 40% 50%', background: `radial-gradient(circle at 45% 40%, #fff6c8 0, #ffd23a 22%, ${c} 50%, #5a1400 85%)`, boxShadow: `0 0 2cqw ${c}`,
      animation: `lgkCoal ${(p.ms || 1300) * ctx.speed}ms ease-out ${Math.round(rnd(i, 217) * 160)}ms both` }} />
  }),
  // The Void: a black hole with a burning accretion ring swallows the light, shrinks to a point, and is gone.
  singularity: (p, ctx) => {
    const c = colorOf(p, ctx)
    const ring = 'radial-gradient(circle, transparent 36%, #000 40%, transparent 64%)'
    return (
      <div key="sg" style={{ position: 'absolute', left: '50%', top: '50%', width: '52cqw', height: '52cqw', marginLeft: '-26cqw', marginTop: '-26cqw', borderRadius: '50%', boxShadow: `0 0 4cqw ${c}, 0 0 1.5cqw #ffffff`,
        background: `radial-gradient(circle, #05010cdd 0 34%, #ffffff 38%, ${c} 44%, ${c}66 54%, transparent 66%)`, animation: `lgkSing ${(p.ms || 1200) * ctx.speed}ms cubic-bezier(.55,0,.8,.6) both` }}>
        <div style={{ position: 'absolute', inset: '-30%', borderRadius: '50%', background: `conic-gradient(from 0deg, transparent, ${c}aa, transparent 30%, #ffffff88, transparent 60%, ${c}aa, transparent)`, WebkitMaskImage: ring, maskImage: ring }} />
      </div>
    )
  },
}
// Every raid boss's own drawn parts (impact/bosses/<motif>.parts.jsx), named <motif><Name>, join the shared ones.
Object.assign(PARTS, BOSS_PARTS)
export const PART_NAMES = Object.keys(PARTS)
