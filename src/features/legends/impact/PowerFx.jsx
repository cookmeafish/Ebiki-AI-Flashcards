// RAID POWERS ON SCREEN (powers.js). Three kinds of motion, each power its OWN (the owner: "every power has its own
// animations", "super super cool"; powerfx.test.js keeps every cast and proc pairwise distinct):
//   CAST   (PowerFx, `power` = { id, n }): played once in the boss box the moment a power is used. The power's icon
//          (/assets/legends/powers/<id>.svg, emoji fallback) is the centerpiece, entering its own way, wrapped in its
//          own shapes: Shield's hex dome assembling, 50:50's shears splitting a card, Second wind's gust lifting a
//          heart, Sharpen's blade on a spark fan, Hint's scroll unrolling, Bandage's strips crossing under a moon,
//          Focus's brackets locking on, Siphon's blood drops spiralling in, Ward's rune circle drawing itself and
//          raising a wall, Momentum's three chevrons launching, Fury's twin blades slamming into a burst, Steadfast's
//          anchor dropping and cracking the ground.
//   ARMED  (PowerArmed, `armed` = { shield, sharpen, ward: bool, focus/siphon/momentum/fury: questions left,
//          steadfast: extra hearts left }): a persistent look while a power is up, and a small tray (bottom left of
//          the boss box) with the icon and the window's pips. The tray shows even when motion is off (it is
//          information); the moving looks only while effects may play.
//   PROC   (PowerProc, `proc` = { id, n }): a window power (or Ward / Steadfast) just did something on this answer.
//          Short, low in the box, so it never covers the strike moment's label at the top.
// PowerCastBadge plays a cast in a small square of its own (the Bandage, used on the intro and result screens).
// Rules as every effect: fixed bright colors, deterministic, container units inside the box, nothing while effects
// may not play (BossArena gates: focus mode, Still bosses, reduced motion), never position: fixed.
import { useState } from 'react'
import { FONT } from '../../../config/tokens'
import { FLOATER_OUTLINE } from '../fx/_juice'
import { POWERS } from '../powers'
import { reducedMotion, useArtStill, useArtMotionAlways } from '../art'

// The colored emoji form (a bare 🛡 or ⚔ draws as a thin outline on Windows).
export const colorEmoji = (s = '') => (s && !s.endsWith('️') && s.length <= 2 ? `${s}️` : s)

// One spec per power. `shape` names its signature drawing, `icon` the way its icon enters, `ms` its length; the
// test keeps color, shape, icon entrance and length different for every pair.
export const POWER_FX = {
  shield: { color: '#6fc3ff', accent: '#d6f0ff', ms: 1100, shape: 'hexdome', icon: 'slam', label: 'lg_fxCast_shield' },
  fifty: { color: '#ff4fd8', accent: '#ffd1f4', ms: 1000, shape: 'shears', icon: 'split', iconAt: 380, label: 'lg_fxCast_fifty' },
  wind: { color: '#7dffd0', accent: '#ff6b9a', ms: 1250, shape: 'gust', icon: 'float', iconAt: 560, label: 'lg_fxCast_wind' },
  sharpen: { color: '#ffd23a', accent: '#fff6c8', ms: 950, shape: 'whetstone', icon: 'slide', label: 'lg_fxCast_sharpen' },
  hint: { color: '#ffb84a', accent: '#fff0cf', ms: 1300, shape: 'scroll', icon: 'unfold', iconAt: 780, label: 'lg_fxCast_hint' },
  bandage: { color: '#f4e3c3', accent: '#b9a8ff', ms: 1200, shape: 'moonwrap', icon: 'swing', iconAt: 500, label: 'lg_fxCast_bandage' },
  focus: { color: '#3dffb0', accent: '#e0fff2', ms: 900, shape: 'reticle', icon: 'zoom', label: 'lg_fxCast_focus' },
  siphon: { color: '#ff2e55', accent: '#ffb3c2', ms: 1350, shape: 'vortex', icon: 'spiral', label: 'lg_fxCast_siphon' },
  ward: { color: '#b07cff', accent: '#efe2ff', ms: 1150, shape: 'runewall', icon: 'rise', iconAt: 300, label: 'lg_fxCast_ward' },
  momentum: { color: '#ff8a1f', accent: '#ffe08a', ms: 1050, shape: 'chevrons', icon: 'dash', iconAt: 420, label: 'lg_fxCast_momentum' },
  fury: { color: '#ff3b1f', accent: '#ffe14a', ms: 980, shape: 'crossburst', icon: 'shake', iconAt: 300, label: 'lg_fxCast_fury' },
  steadfast: { color: '#ffcf4a', accent: '#9fb6c8', ms: 1400, shape: 'anchor', icon: 'drop', iconAt: 560, label: 'lg_fxCast_steadfast' },
}
// The persistent looks while a power is up (window powers also count down on their pips).
export const POWER_ARMED = {
  shield: { look: 'heartward', window: false },
  sharpen: { look: 'goldlock', window: false },
  ward: { look: 'floorrune', window: false },
  focus: { look: 'corners', window: true },
  siphon: { look: 'orbitdrops', window: true },
  momentum: { look: 'flamerow', window: true },
  fury: { look: 'redrim', window: true },
  steadfast: { look: 'anchorhearts', window: false },
}
// What a power doing its thing on an answer looks like.
export const POWER_PROC = {
  focus: { color: '#3dffb0', ms: 700, shape: 'snapring', label: 'lg_fxProc_focus' },
  siphon: { color: '#ff2e55', ms: 850, shape: 'draindrops', label: 'lg_fxProc_siphon' },
  momentum: { color: '#ff8a1f', ms: 750, shape: 'chevronburst', label: 'lg_fxProc_momentum' },
  fury: { color: '#ff3b1f', ms: 800, shape: 'doublex', label: 'lg_fxProc_fury' },
  ward: { color: '#b07cff', ms: 900, shape: 'hexwall', label: 'lg_fxProc_ward' },
  steadfast: { color: '#ffcf4a', ms: 950, shape: 'brokenheart', label: 'lg_fxProc_steadfast' },
}
export const castMs = (id) => POWER_FX[id]?.ms || 1100
export const procMs = (id) => POWER_PROC[id]?.ms || 800

const iconSrc = (id) => `/assets/legends/powers/${id}.svg`

// The power's own icon (a hand-drawn SVG file), the emoji when the file is missing.
export function PowerIcon({ id, size = '100%', style }) {
  const [bad, setBad] = useState(false)
  if (bad || !POWERS[id]) {
    return <span aria-hidden="true" style={{ display: 'inline-grid', placeItems: 'center', width: size, height: size, fontSize: `calc(${typeof size === 'number' ? `${size}px` : size} * .8)`, lineHeight: 1, ...style }}>{colorEmoji(POWERS[id]?.icon || '✨')}</span>
  }
  return <img src={iconSrc(id)} alt="" aria-hidden="true" draggable={false} onError={() => setBad(true)} style={{ width: size, height: size, display: 'block', ...style }} />
}

const CSS = `
@keyframes lgpwLabel { 0% { transform: translateX(-50%) scale(2); opacity: 0 } 18% { transform: translateX(-50%) scale(.94); opacity: 1 } 30% { transform: translateX(-50%) scale(1) } 80% { opacity: 1 } 100% { transform: translateX(-50%) translateY(-10px); opacity: 0 } }
@keyframes lgpwProcLabel { 0% { transform: translateX(-50%) translateY(8px) scale(.6); opacity: 0 } 25% { transform: translateX(-50%) translateY(0) scale(1.12); opacity: 1 } 40% { transform: translateX(-50%) scale(1) } 80% { opacity: 1 } 100% { transform: translateX(-50%) translateY(-6px); opacity: 0 } }
@keyframes lgpwFade { 0%, 70% { opacity: 1 } 100% { opacity: 0 } }
/* icon entrances: one per power */
@keyframes lgpwIcSlam { 0% { transform: translate(-50%, -50%) scale(2.6); opacity: 0 } 22% { transform: translate(-50%, -50%) scale(.86); opacity: 1 } 34% { transform: translate(-50%, -50%) scale(1.06) } 46%, 78% { transform: translate(-50%, -50%) scale(1); opacity: 1 } 100% { transform: translate(-50%, -50%) scale(.9); opacity: 0 } }
@keyframes lgpwIcSplit { 0% { transform: translate(-50%, -50%) rotate(-200deg) scale(.2); opacity: 0 } 35% { transform: translate(-50%, -50%) rotate(12deg) scale(1.15); opacity: 1 } 50%, 80% { transform: translate(-50%, -50%) rotate(0) scale(1); opacity: 1 } 100% { transform: translate(-50%, -50%) rotate(0) scale(1.3); opacity: 0 } }
@keyframes lgpwIcFloat { 0% { transform: translate(-50%, 30%) scale(.5); opacity: 0 } 40% { transform: translate(-50%, -55%) scale(1.1); opacity: 1 } 55% { transform: translate(-50%, -50%) scale(1) } 70% { transform: translate(-50%, -50%) scale(1.12) } 80% { transform: translate(-50%, -50%) scale(1); opacity: 1 } 100% { transform: translate(-50%, -110%) scale(.9); opacity: 0 } }
@keyframes lgpwIcSlide { 0% { transform: translate(-160%, -10%) rotate(-25deg); opacity: 0 } 30% { transform: translate(-45%, -52%) rotate(4deg); opacity: 1 } 42%, 80% { transform: translate(-50%, -50%) rotate(0); opacity: 1 } 100% { transform: translate(60%, -50%) rotate(8deg); opacity: 0 } }
@keyframes lgpwIcUnfold { 0% { transform: translate(-50%, -50%) scaleX(0) scaleY(.6); opacity: 0 } 35% { transform: translate(-50%, -50%) scaleX(1.15) scaleY(1); opacity: 1 } 50%, 82% { transform: translate(-50%, -50%) scale(1); opacity: 1 } 100% { transform: translate(-50%, -50%) scaleY(0); opacity: 0 } }
@keyframes lgpwIcSwing { 0% { transform: translate(-50%, -50%) rotate(-70deg) scale(.6); opacity: 0 } 30% { transform: translate(-50%, -50%) rotate(18deg) scale(1.05); opacity: 1 } 48% { transform: translate(-50%, -50%) rotate(-8deg) } 62%, 82% { transform: translate(-50%, -50%) rotate(0); opacity: 1 } 100% { transform: translate(-50%, -50%) rotate(0) scale(.7); opacity: 0 } }
@keyframes lgpwIcZoom { 0% { transform: translate(-50%, -50%) scale(4); opacity: 0; filter: blur(4px) } 30% { transform: translate(-50%, -50%) scale(.9); opacity: 1; filter: blur(0) } 40%, 80% { transform: translate(-50%, -50%) scale(1); opacity: 1 } 100% { transform: translate(-50%, -50%) scale(.5); opacity: 0 } }
@keyframes lgpwIcSpiral { 0% { transform: translate(-50%, -50%) rotate(540deg) scale(0); opacity: 0 } 45% { transform: translate(-50%, -50%) rotate(0) scale(1.1); opacity: 1 } 58%, 82% { transform: translate(-50%, -50%) scale(1); opacity: 1 } 100% { transform: translate(-50%, -50%) scale(0); opacity: 0 } }
@keyframes lgpwIcRise { 0% { transform: translate(-50%, 40%) scaleY(.3); opacity: 0 } 40% { transform: translate(-50%, -58%) scaleY(1.12); opacity: 1 } 55%, 82% { transform: translate(-50%, -50%) scaleY(1); opacity: 1 } 100% { transform: translate(-50%, -50%) scale(1.25); opacity: 0 } }
@keyframes lgpwIcDash { 0% { transform: translate(-260%, -20%) skewX(-30deg); opacity: 0 } 25% { transform: translate(-40%, -50%) skewX(-12deg); opacity: 1 } 38%, 78% { transform: translate(-50%, -50%) skewX(0); opacity: 1 } 100% { transform: translate(180%, -70%) skewX(-30deg); opacity: 0 } }
@keyframes lgpwIcShake { 0% { transform: translate(-50%, -50%) scale(3); opacity: 0 } 18% { transform: translate(-50%, -50%) scale(1); opacity: 1 } 24% { transform: translate(-56%, -48%) rotate(-6deg) } 30% { transform: translate(-44%, -52%) rotate(6deg) } 36% { transform: translate(-54%, -50%) rotate(-3deg) } 42%, 80% { transform: translate(-50%, -50%) rotate(0); opacity: 1 } 100% { transform: translate(-50%, -50%) scale(1.4); opacity: 0 } }
@keyframes lgpwIcDrop { 0% { transform: translate(-50%, -260%); opacity: 0 } 10% { opacity: 1 } 34% { transform: translate(-50%, -42%) scaleY(.82) scaleX(1.12) } 46% { transform: translate(-50%, -56%) scale(1) } 56%, 84% { transform: translate(-50%, -50%); opacity: 1 } 100% { transform: translate(-50%, -50%) scale(.8); opacity: 0 } }
/* shield: hex dome */
@keyframes lgpwHexIn { 0% { transform: translate(var(--dx), var(--dy)) scale(.4); opacity: 0 } 45% { transform: translate(0, 0) scale(1); opacity: 1 } 75% { opacity: .9 } 100% { opacity: 0 } }
@keyframes lgpwShock { 0% { transform: scale(.5); opacity: 0 } 15% { opacity: 1 } 100% { transform: scale(1.7); opacity: 0 } }
/* fifty: shears and a card split in two */
@keyframes lgpwBladeL { 0% { transform: rotate(-38deg); opacity: 0 } 20% { opacity: 1 } 40% { transform: rotate(0deg) } 60% { transform: rotate(-38deg) } 80% { transform: rotate(0); opacity: 1 } 100% { opacity: 0 } }
@keyframes lgpwBladeR { 0% { transform: rotate(38deg); opacity: 0 } 20% { opacity: 1 } 40% { transform: rotate(0deg) } 60% { transform: rotate(38deg) } 80% { transform: rotate(0); opacity: 1 } 100% { opacity: 0 } }
@keyframes lgpwHalfL { 0%, 40% { transform: translate(0, 0) rotate(0) } 75% { transform: translate(-14px, 4px) rotate(-10deg); opacity: 1 } 100% { transform: translate(-22px, 10px) rotate(-16deg); opacity: 0 } }
@keyframes lgpwHalfR { 0%, 40% { transform: translate(0, 0) rotate(0) } 75% { transform: translate(14px, -4px) rotate(10deg); opacity: 1 } 100% { transform: translate(22px, -10px) rotate(16deg); opacity: 0 } }
@keyframes lgpwCut { 0%, 35% { stroke-dashoffset: 140; opacity: 0 } 40% { opacity: 1 } 55% { stroke-dashoffset: 0 } 100% { stroke-dashoffset: 0; opacity: 0 } }
/* wind: gust swirls */
@keyframes lgpwGust { 0% { transform: rotate(0deg) scale(.4); opacity: 0 } 25% { opacity: .95 } 100% { transform: rotate(var(--r)) scale(1.35); opacity: 0 } }
@keyframes lgpwBeat { 0%, 45% { transform: scale(0); opacity: 0 } 55% { transform: scale(1.3); opacity: 1 } 65% { transform: scale(1) } 72% { transform: scale(1.18) } 80% { transform: scale(1); opacity: 1 } 100% { transform: scale(1.6); opacity: 0 } }
/* sharpen: blade stroke and a spark fan */
@keyframes lgpwBlade { 0% { transform: translate(-70px, 40px); opacity: 0 } 15% { opacity: 1 } 70% { transform: translate(40px, -24px); opacity: 1 } 100% { transform: translate(60px, -36px); opacity: 0 } }
@keyframes lgpwSpark { 0% { transform: rotate(var(--a)) translateX(0) scaleX(.2); opacity: 0 } 15% { opacity: 1 } 100% { transform: rotate(var(--a)) translateX(46px) scaleX(1); opacity: 0 } }
@keyframes lgpwGlint { 0% { transform: translateX(-60cqw) rotate(25deg); opacity: 0 } 25% { opacity: 1 } 100% { transform: translateX(60cqw) rotate(25deg); opacity: 0 } }
/* hint: the scroll */
@keyframes lgpwSheet { 0% { transform: scaleX(0) } 40% { transform: scaleX(1) } 85% { transform: scaleX(1); opacity: 1 } 100% { transform: scaleX(1); opacity: 0 } }
@keyframes lgpwRollL { 0% { transform: translateX(28px) } 40% { transform: translateX(0) } 85% { opacity: 1 } 100% { opacity: 0 } }
@keyframes lgpwRollR { 0% { transform: translateX(-28px) } 40% { transform: translateX(0) } 85% { opacity: 1 } 100% { opacity: 0 } }
@keyframes lgpwInk { 0%, 100% { opacity: 0 } 1% { opacity: 0 } 12% { opacity: 1 } 85% { opacity: 1 } }
@keyframes lgpwRays { 0% { transform: rotate(0) scale(.6); opacity: 0 } 30% { opacity: .8 } 100% { transform: rotate(40deg) scale(1.2); opacity: 0 } }
/* bandage: strips and a moon */
@keyframes lgpwStripA { 0% { transform: rotate(-120deg) scale(.4); opacity: 0 } 40% { transform: rotate(-38deg) scale(1.06); opacity: 1 } 55%, 85% { transform: rotate(-45deg) scale(1); opacity: 1 } 100% { opacity: 0 } }
@keyframes lgpwStripB { 0%, 12% { transform: rotate(140deg) scale(.4); opacity: 0 } 52% { transform: rotate(38deg) scale(1.06); opacity: 1 } 66%, 85% { transform: rotate(45deg) scale(1); opacity: 1 } 100% { opacity: 0 } }
@keyframes lgpwMoon { 0% { transform: translate(14px, -10px) scale(.5); opacity: 0 } 40% { transform: translate(0, 0) scale(1); opacity: 1 } 85% { opacity: 1 } 100% { opacity: 0 } }
@keyframes lgpwTwinkle { 0%, 100% { transform: scale(0); opacity: 0 } 40% { transform: scale(1.3); opacity: 1 } 60% { transform: scale(.8); opacity: .8 } }
/* focus: brackets and a reticle */
@keyframes lgpwBracket { 0% { transform: translate(var(--dx), var(--dy)) scale(1.3); opacity: 0 } 45% { transform: translate(0, 0) scale(1); opacity: 1 } 55% { transform: scale(.9) } 65%, 85% { transform: scale(1); opacity: 1 } 100% { opacity: 0 } }
@keyframes lgpwReticle { 0% { transform: rotate(-90deg) scale(1.6); opacity: 0 } 45% { transform: rotate(0) scale(1); opacity: 1 } 85% { opacity: 1 } 100% { transform: scale(.6); opacity: 0 } }
@keyframes lgpwScan { 0% { transform: translateY(-50cqh); opacity: 0 } 20% { opacity: .9 } 100% { transform: translateY(50cqh); opacity: 0 } }
/* siphon: drops spiral in */
@keyframes lgpwDrop { 0% { transform: rotate(var(--a)) translateX(48px) scale(1); opacity: 0 } 15% { opacity: 1 } 70% { transform: rotate(calc(var(--a) + 260deg)) translateX(6px) scale(.6); opacity: 1 } 100% { transform: rotate(calc(var(--a) + 300deg)) translateX(0) scale(0); opacity: 0 } }
@keyframes lgpwSpinA { 0% { transform: rotate(0); opacity: 0 } 20% { opacity: .9 } 100% { transform: rotate(320deg); opacity: 0 } }
@keyframes lgpwSpinB { 0% { transform: rotate(0); opacity: 0 } 20% { opacity: .7 } 100% { transform: rotate(-260deg); opacity: 0 } }
/* ward: a rune circle draws itself, a wall rises */
@keyframes lgpwDraw { 0% { stroke-dashoffset: var(--len); opacity: 1 } 45% { stroke-dashoffset: 0 } 85% { opacity: 1 } 100% { stroke-dashoffset: 0; opacity: 0 } }
@keyframes lgpwRuneSpin { 0% { transform: rotate(0) } 100% { transform: rotate(120deg) } }
@keyframes lgpwWall { 0%, 40% { transform: scaleY(0); opacity: 0 } 60% { transform: scaleY(1.06); opacity: .9 } 72%, 85% { transform: scaleY(1); opacity: .75 } 100% { transform: scaleY(1); opacity: 0 } }
/* momentum: chevrons launch */
@keyframes lgpwChev { 0% { transform: translate(-40px, 24px); opacity: 0 } 30% { transform: translate(0, 0); opacity: 1 } 55% { transform: translate(4px, -2px) scale(1.25); filter: brightness(1.6) } 75% { transform: translate(0, 0) scale(1); opacity: 1 } 100% { transform: translate(30px, -18px); opacity: 0 } }
@keyframes lgpwStreak { 0% { transform: scaleX(0); opacity: 0 } 30% { transform: scaleX(1); opacity: .9 } 100% { transform: scaleX(1) translateX(30px); opacity: 0 } }
/* fury: twin blades cross into a burst */
@keyframes lgpwFuryL { 0% { transform: translate(-60px, -60px) rotate(-60deg); opacity: 0 } 30% { transform: translate(0, 0) rotate(0); opacity: 1 } 34% { transform: translate(2px, 2px) } 80% { opacity: 1 } 100% { opacity: 0 } }
@keyframes lgpwFuryR { 0% { transform: translate(60px, -60px) rotate(60deg); opacity: 0 } 30% { transform: translate(0, 0) rotate(0); opacity: 1 } 34% { transform: translate(-2px, 2px) } 80% { opacity: 1 } 100% { opacity: 0 } }
@keyframes lgpwBurst { 0%, 28% { transform: scale(0) rotate(0); opacity: 0 } 36% { transform: scale(1.25) rotate(8deg); opacity: 1 } 60% { transform: scale(1.05) rotate(14deg); opacity: .8 } 100% { transform: scale(1.5) rotate(22deg); opacity: 0 } }
@keyframes lgpwRage { 0%, 28% { opacity: 0 } 36% { opacity: 1 } 100% { opacity: 0 } }
@keyframes lgpwEmber { 0%, 30% { transform: translate(0, 0) scale(1); opacity: 0 } 40% { opacity: 1 } 100% { transform: translate(var(--x), -40px) scale(.2); opacity: 0 } }
/* steadfast: an anchor drops and cracks the ground */
@keyframes lgpwAnchor { 0% { transform: translateY(-80px); opacity: 0 } 10% { opacity: 1 } 34% { transform: translateY(0) scaleY(.88) } 44% { transform: translateY(-4px) scaleY(1.03) } 54%, 86% { transform: translateY(0) scaleY(1); opacity: 1 } 100% { opacity: 0 } }
@keyframes lgpwCrack { 0%, 32% { stroke-dashoffset: 40; opacity: 0 } 36% { opacity: 1 } 55% { stroke-dashoffset: 0 } 86% { opacity: 1 } 100% { stroke-dashoffset: 0; opacity: 0 } }
@keyframes lgpwDust { 0%, 32% { transform: translate(0, 0) scale(.3); opacity: 0 } 40% { opacity: .9 } 100% { transform: translate(var(--x), -10px) scale(1.4); opacity: 0 } }
@keyframes lgpwOrbit { 0%, 45% { transform: rotate(var(--a)) translateX(40px) rotate(calc(-1 * var(--a))) scale(0); opacity: 0 } 70% { transform: rotate(calc(var(--a) + 200deg)) translateX(26px) rotate(calc(-1 * var(--a) - 200deg)) scale(1.1); opacity: 1 } 88% { opacity: 1 } 100% { transform: rotate(calc(var(--a) + 240deg)) translateX(24px) rotate(calc(-1 * var(--a) - 240deg)) scale(1); opacity: 0 } }
/* ARMED looks */
@keyframes lgpwWard { 0%, 100% { box-shadow: 0 0 0 2px #6fc3ff, 0 0 8px #6fc3ff } 50% { box-shadow: 0 0 0 3px #6fc3ff, 0 0 18px #6fc3ff } }
@keyframes lgpwLock { 0% { transform: rotate(0deg) scale(1) } 50% { transform: rotate(45deg) scale(.94) } 100% { transform: rotate(90deg) scale(1) } }
@keyframes lgpwLockIn { 0% { opacity: 0; transform: translate(-50%, -50%) scale(1.8) } 100% { opacity: 1; transform: translate(-50%, -50%) scale(1) } }
@keyframes lgpwFloorRune { 0% { transform: rotate(0) } 100% { transform: rotate(360deg) } }
@keyframes lgpwBreathe { 0%, 100% { transform: translate(0, 0); opacity: .85 } 50% { transform: translate(var(--bx), var(--by)); opacity: 1 } }
@keyframes lgpwOrbitDrop { 0% { transform: rotate(var(--a)) translateX(44cqw) } 100% { transform: rotate(calc(var(--a) + 360deg)) translateX(44cqw) } }
@keyframes lgpwFlicker { 0%, 100% { transform: scaleY(1) scaleX(1) } 25% { transform: scaleY(1.18) scaleX(.92) } 50% { transform: scaleY(.9) scaleX(1.06) } 75% { transform: scaleY(1.1) scaleX(.95) } }
@keyframes lgpwRim { 0%, 100% { box-shadow: inset 0 0 0 2px #ff3b1f, inset 0 0 8px #ff3b1f88, 0 0 6px #ff3b1f88 } 50% { box-shadow: inset 0 0 0 3px #ffe14a, inset 0 0 14px #ff3b1faa, 0 0 12px #ff3b1fcc } }
@keyframes lgpwRimEmber { 0% { transform: translateY(0) scale(1); opacity: 0 } 20% { opacity: 1 } 100% { transform: translateY(-80px) scale(.3); opacity: 0 } }
@keyframes lgpwPipIn { 0% { transform: scale(0) } 70% { transform: scale(1.3) } 100% { transform: scale(1) } }
/* PROCS */
@keyframes lgpwSnap { 0% { transform: scale(1.8); opacity: 0 } 35% { transform: scale(.35); opacity: 1 } 55% { transform: scale(.5); opacity: 1 } 100% { transform: scale(.5); opacity: 0 } }
@keyframes lgpwSnapLine { 0% { transform: scaleX(0); opacity: 0 } 35% { transform: scaleX(1); opacity: 1 } 100% { transform: scaleX(1.2); opacity: 0 } }
@keyframes lgpwDrain { 0% { transform: translate(var(--x), var(--y)) scale(1.2); opacity: 0 } 15% { opacity: 1 } 85% { opacity: 1 } 100% { transform: translate(0, 4px) scale(.3); opacity: 0 } }
@keyframes lgpwChevOut { 0% { transform: translateX(-10px) scale(.6); opacity: 0 } 30% { opacity: 1 } 100% { transform: translateX(var(--x)) scale(1.4); opacity: 0 } }
@keyframes lgpwSlashDraw { 0% { stroke-dashoffset: 150; opacity: 1 } 40% { stroke-dashoffset: 0; opacity: 1 } 100% { stroke-dashoffset: 0; opacity: 0 } }
@keyframes lgpwHexWall { 0% { transform: scaleX(0); opacity: 0 } 25% { transform: scaleX(1.08); opacity: 1 } 40% { transform: scaleX(1) } 70% { opacity: .9 } 100% { transform: scaleX(1); opacity: 0 } }
@keyframes lgpwRipple { 0% { transform: scale(.3); opacity: .9 } 100% { transform: scale(1.6); opacity: 0 } }
@keyframes lgpwHalfFall { 0%, 30% { transform: translate(0, 0) rotate(0); opacity: 1 } 100% { transform: translate(var(--x), 30px) rotate(var(--r)); opacity: 0 } }
@keyframes lgpwStamp { 0% { transform: translate(-50%, -50%) scale(2.2); opacity: 0 } 25% { transform: translate(-50%, -50%) scale(.9); opacity: 1 } 35%, 80% { transform: translate(-50%, -50%) scale(1); opacity: 1 } 100% { transform: translate(-50%, -50%) scale(1); opacity: 0 } }
`
export const POWER_ARMED_CSS = CSS

const ICON_ANIM = { slam: 'lgpwIcSlam', split: 'lgpwIcSplit', float: 'lgpwIcFloat', slide: 'lgpwIcSlide', unfold: 'lgpwIcUnfold', swing: 'lgpwIcSwing', zoom: 'lgpwIcZoom', spiral: 'lgpwIcSpiral', rise: 'lgpwIcRise', dash: 'lgpwIcDash', shake: 'lgpwIcShake', drop: 'lgpwIcDrop' }
const fill = { position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }
const fb = (origin = 'center') => ({ transformBox: 'fill-box', transformOrigin: origin })
const an = (name, ms, delay = 0, ease = 'cubic-bezier(.22,1,.36,1)', more = 'both') => `${name} ${ms}ms ${ease} ${delay}ms ${more}`
const hexPts = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i - Math.PI / 2; return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}` }).join(' ')
const HEART = 'M50 78 C20 58 14 40 26 30 C36 22 46 27 50 36 C54 27 64 22 74 30 C86 40 80 58 50 78 Z'

// Each power's own drawing around its icon. `ms` = the cast's length (the parts are timed inside it).
const SHAPES = {
  hexdome: ({ color, accent, ms }) => (
    <svg viewBox="0 0 100 100" style={fill} aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 2
        const b = a + Math.PI / 3
        const p = `50,50 ${(50 + 40 * Math.cos(a)).toFixed(1)},${(50 + 40 * Math.sin(a)).toFixed(1)} ${(50 + 40 * Math.cos(b)).toFixed(1)},${(50 + 40 * Math.sin(b)).toFixed(1)}`
        const mid = a + Math.PI / 6
        return <polygon key={i} points={p} fill={color} fillOpacity=".28" stroke={accent} strokeWidth="1.6" strokeLinejoin="round"
          style={{ ...fb(), '--dx': `${(Math.cos(mid) * 40).toFixed(0)}px`, '--dy': `${(Math.sin(mid) * 40).toFixed(0)}px`, animation: an('lgpwHexIn', ms, i * 45) }} />
      })}
      <polygon points={hexPts(50, 50, 40)} fill="none" stroke="#ffffff" strokeWidth="2.4" style={{ ...fb(), animation: an('lgpwShock', ms * 0.55, ms * 0.32, 'ease-out') }} />
      <polygon points={hexPts(50, 50, 44)} fill="none" stroke={color} strokeWidth="1.2" strokeDasharray="4 3" style={{ ...fb(), animation: an('lgpwShock', ms * 0.7, ms * 0.4, 'ease-out') }} />
    </svg>
  ),
  shears: ({ color, accent, ms }) => (
    <svg viewBox="0 0 100 100" style={fill} aria-hidden="true">
      <g style={{ ...fb(), animation: an('lgpwHalfL', ms, 0, 'ease-out') }}>
        <rect x="24" y="30" width="26" height="40" rx="4" fill={accent} fillOpacity=".9" stroke={color} strokeWidth="2" />
        <rect x="29" y="38" width="16" height="3" rx="1.5" fill={color} /><rect x="29" y="45" width="12" height="3" rx="1.5" fill={color} fillOpacity=".6" />
      </g>
      <g style={{ ...fb(), animation: an('lgpwHalfR', ms, 0, 'ease-out') }}>
        <rect x="50" y="30" width="26" height="40" rx="4" fill={accent} fillOpacity=".9" stroke={color} strokeWidth="2" />
        <rect x="55" y="38" width="16" height="3" rx="1.5" fill={color} /><rect x="55" y="45" width="10" height="3" rx="1.5" fill={color} fillOpacity=".6" />
      </g>
      <path d="M50 18 L50 82" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeDasharray="140" style={{ animation: an('lgpwCut', ms, 0, 'ease-out') }} />
      <g style={{ transformOrigin: '50px 50px', animation: an('lgpwBladeL', ms * 0.6, 0, 'ease-in-out') }}>
        <path d="M50 50 L14 40 L16 46 Z" fill="#ffffff" stroke={color} strokeWidth="1.4" /><circle cx="50" cy="50" r="4" fill={color} />
      </g>
      <g style={{ transformOrigin: '50px 50px', animation: an('lgpwBladeR', ms * 0.6, 0, 'ease-in-out') }}>
        <path d="M50 50 L14 60 L16 54 Z" fill="#ffffff" stroke={color} strokeWidth="1.4" />
      </g>
    </svg>
  ),
  gust: ({ color, accent, ms }) => (
    <svg viewBox="0 0 100 100" style={fill} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M50 50 m-${18 + i * 9} 0 a${18 + i * 9} ${18 + i * 9} 0 1 1 ${10 + i * 6} ${14 + i * 6}`} fill="none" stroke={i === 1 ? accent : color} strokeWidth={5.5 - i * 1.2} strokeLinecap="round"
          style={{ transformOrigin: '50px 50px', '--r': `${i % 2 ? -300 : 330}deg`, animation: an('lgpwGust', ms * (0.75 + i * 0.1), i * 90, 'ease-out') }} />
      ))}
      <path d={HEART} fill={accent} stroke="#ffffff" strokeWidth="2" style={{ ...fb(), transform: 'scale(.5)', animation: an('lgpwBeat', ms, 0, 'ease-out') }} />
    </svg>
  ),
  whetstone: ({ color, accent, ms }) => (
    <svg viewBox="0 0 100 100" style={fill} aria-hidden="true">
      <rect x="12" y="72" width="76" height="9" rx="3" fill="#6b5a3a" stroke={color} strokeWidth="1.4" style={{ animation: an('lgpwFade', ms) }} />
      <g style={{ animation: an('lgpwBlade', ms * 0.75, 0, 'cubic-bezier(.5,0,.3,1)') }}>
        <path d="M30 72 L76 34 L80 38 L36 74 Z" fill={accent} stroke={color} strokeWidth="1.5" />
        <path d="M76 34 L84 28 L80 38 Z" fill="#ffffff" />
      </g>
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={i} x="54" y="68.6" width="18" height="3.6" rx="1.8" fill={i % 3 ? "#fffbe0" : "#ffffff"} stroke={i % 2 ? "#ff8a00" : color} strokeWidth="1.2"
          style={{ transformOrigin: "54px 70.4px", "--a": `${-160 + i * 10}deg`, animation: an("lgpwSpark", 460, 120 + (i % 5) * 45, "ease-out") }} />
      ))}
      <path d="M54 58 L57 67 L66 70 L57 73 L54 82 L51 73 L42 70 L51 67 Z" fill="#ffffff" stroke={color} strokeWidth="1.4" style={{ ...fb(), animation: an('lgpwTwinkle', 520, 140, 'ease-out') }} />
    </svg>
  ),
  scroll: ({ color, accent, ms }) => (
    <svg viewBox="0 0 100 100" style={fill} aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => (
        <path key={i} d="M50 50 L47 4 L53 4 Z" fill={color} fillOpacity=".5" transform={`rotate(${i * 36} 50 50)`} style={{ animation: an('lgpwRays', ms, 0, 'ease-out') }} />
      ))}
      <rect x="20" y="30" width="60" height="40" rx="2" fill={accent} stroke={color} strokeWidth="1.6" style={{ ...fb(), animation: an('lgpwSheet', ms, 0, 'cubic-bezier(.3,1.2,.5,1)') }} />
      {[0, 1, 2].map((row) => Array.from({ length: 5 }, (_, k) => (
        <rect key={`${row}-${k}`} x={26 + k * 10} y={38 + row * 9} width={k % 2 ? 3 : 7} height="3" rx="1.5" fill={k % 2 ? '#c99b5a' : '#5a3a1a'}
          style={{ animation: an('lgpwInk', ms - 300, 380 + row * 110 + k * 30, 'linear') }} />
      )))}
      <rect x="15" y="27" width="7" height="46" rx="3.5" fill={color} stroke="#7a4a12" strokeWidth="1.2" style={{ animation: an('lgpwRollL', ms, 0, 'cubic-bezier(.3,1.2,.5,1)') }} />
      <rect x="78" y="27" width="7" height="46" rx="3.5" fill={color} stroke="#7a4a12" strokeWidth="1.2" style={{ animation: an('lgpwRollR', ms, 0, 'cubic-bezier(.3,1.2,.5,1)') }} />
    </svg>
  ),
  moonwrap: ({ color, accent, ms }) => (
    <svg viewBox="0 0 100 100" style={fill} aria-hidden="true">
      <path d="M80 12 a14 14 0 1 0 8 24 a11 11 0 1 1 -8 -24 Z" fill={accent} style={{ ...fb(), animation: an('lgpwMoon', ms, 0, 'ease-out') }} />
      {[[16, 20], [88, 52], [12, 70]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y - 4} L${x + 1.2} ${y - 1.2} L${x + 4} ${y} L${x + 1.2} ${y + 1.2} L${x} ${y + 4} L${x - 1.2} ${y + 1.2} L${x - 4} ${y} L${x - 1.2} ${y - 1.2} Z`} fill="#ffffff" style={{ ...fb(), animation: an('lgpwTwinkle', 700, 200 + i * 180, 'ease-in-out') }} />
      ))}
      {['lgpwStripA', 'lgpwStripB'].map((k) => (
        <g key={k} style={{ transformOrigin: '50px 50px', animation: an(k, ms, 0, 'cubic-bezier(.3,1.3,.5,1)') }}>
          <rect x="14" y="43" width="72" height="14" rx="5" fill={color} stroke="#c9a77a" strokeWidth="1.4" />
          {[24, 34, 62, 72].map((x) => <circle key={x} cx={x} cy="50" r="1.3" fill="#c9a77a" />)}
          <rect x="44" y="43" width="12" height="14" fill="#ffffff" fillOpacity=".6" />
        </g>
      ))}
    </svg>
  ),
  reticle: ({ color, accent, ms }) => (
    <svg viewBox="0 0 100 100" style={fill} aria-hidden="true">
      {[[0, 0, 1, 1], [1, 0, -1, 1], [0, 1, 1, -1], [1, 1, -1, -1]].map(([cx, cy, sx, sy], i) => {
        const x = 22 + cx * 56
        const y = 22 + cy * 56
        return <path key={i} d={`M${x} ${y + sy * 12} L${x} ${y} L${x + sx * 12} ${y}`} fill="none" stroke={color} strokeWidth="3.4" strokeLinecap="round"
          style={{ ...fb(), '--dx': `${-sx * 18}px`, '--dy': `${-sy * 18}px`, animation: an('lgpwBracket', ms, i * 30, 'cubic-bezier(.2,1.4,.4,1)') }} />
      })}
      <g style={{ transformOrigin: '50px 50px', animation: an('lgpwReticle', ms, 60, 'cubic-bezier(.2,1.2,.4,1)') }}>
        <circle cx="50" cy="50" r="17" fill="none" stroke={accent} strokeWidth="1.6" strokeDasharray="6 4" />
        {[0, 90, 180, 270].map((a) => <path key={a} d="M50 29 L50 37" stroke={color} strokeWidth="2.4" strokeLinecap="round" transform={`rotate(${a} 50 50)`} />)}
      </g>
      <rect x="10" y="49" width="80" height="1.6" fill={color} style={{ animation: an('lgpwScan', ms * 0.7, 0, 'linear') }} />
    </svg>
  ),
  vortex: ({ color, accent, ms }) => (
    <svg viewBox="0 0 100 100" style={fill} aria-hidden="true">
      <circle cx="50" cy="50" r="34" fill="none" stroke={color} strokeWidth="2" strokeDasharray="12 7" style={{ transformOrigin: '50px 50px', animation: an('lgpwSpinA', ms, 0, 'ease-in-out') }} />
      <circle cx="50" cy="50" r="24" fill="none" stroke={accent} strokeWidth="1.4" strokeDasharray="5 6" style={{ transformOrigin: '50px 50px', animation: an('lgpwSpinB', ms, 80, 'ease-in-out') }} />
      {Array.from({ length: 10 }, (_, i) => (
        <path key={i} d="M50 41 C45 48 45 54 50 56 C55 54 55 48 50 41 Z" fill={i % 2 ? color : "#b0001f"} stroke="#ffffff" strokeWidth=".8"
          style={{ transformOrigin: '50px 50px', '--a': `${i * 36}deg`, animation: an('lgpwDrop', ms * 0.75, i * 40, 'cubic-bezier(.5,0,.6,1)') }} />
      ))}
    </svg>
  ),
  runewall: ({ color, accent, ms }) => (
    <svg viewBox="0 0 100 100" style={fill} aria-hidden="true">
      <rect x="14" y="20" width="72" height="62" rx="6" fill={color} fillOpacity=".22" stroke={accent} strokeWidth="1.6" style={{ ...fb('center bottom'), animation: an('lgpwWall', ms, 0, 'cubic-bezier(.3,1.3,.5,1)') }} />
      <g style={{ transformOrigin: '50px 50px', animation: an('lgpwRuneSpin', ms, 0, 'ease-out') }}>
        <circle cx="50" cy="50" r="34" fill="none" stroke={color} strokeWidth="2.6" strokeDasharray="214" style={{ '--len': 214, animation: an('lgpwDraw', ms, 0, 'ease-out') }} />
        <polygon points="50,22 74,64 26,64" fill="none" stroke={accent} strokeWidth="1.6" strokeDasharray="146" style={{ '--len': 146, animation: an('lgpwDraw', ms, 120, 'ease-out') }} />
        <polygon points="50,78 26,36 74,36" fill="none" stroke={accent} strokeWidth="1.6" strokeDasharray="146" style={{ '--len': 146, animation: an('lgpwDraw', ms, 200, 'ease-out') }} />
        {Array.from({ length: 12 }, (_, i) => <path key={i} d="M50 13 L50 18" stroke={color} strokeWidth="2" strokeLinecap="round" transform={`rotate(${i * 30} 50 50)`} style={{ animation: an('lgpwFade', ms) }} />)}
      </g>
    </svg>
  ),
  chevrons: ({ color, accent, ms }) => (
    <svg viewBox="0 0 100 100" style={fill} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${20 + i * 26} ${66 - i * 16})`}>
          <rect x="-34" y="-2" width="32" height="4" rx="2" fill={accent} style={{ ...fb('right center'), animation: an('lgpwStreak', ms * 0.7, i * 110, 'ease-out') }} />
          <rect x="-28" y="6" width="22" height="2.4" rx="1.2" fill={color} style={{ ...fb('right center'), animation: an('lgpwStreak', ms * 0.6, i * 110 + 40, 'ease-out') }} />
          <path d="M0 -18 L18 0 L0 18 L7 0 Z" fill={i === 2 ? accent : color} stroke="#ffffff" strokeWidth="1.8" strokeLinejoin="round" style={{ ...fb(), animation: an('lgpwChev', ms, i * 110, 'cubic-bezier(.2,1.2,.4,1)') }} />
        </g>
      ))}
    </svg>
  ),
  crossburst: ({ color, accent, ms }) => (
    <>
      <div style={{ position: 'absolute', inset: '-6%', borderRadius: '18%', background: `radial-gradient(circle closest-side, ${color}00 35%, ${color}55 70%, ${color}00 100%)`, animation: an('lgpwRage', ms, 0, 'ease-out') }} />
      <svg viewBox="0 0 100 100" style={fill} aria-hidden="true">
        <polygon points={Array.from({ length: 16 }, (_, i) => { const r = i % 2 ? 18 : 40; const a = (Math.PI / 8) * i; return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}` }).join(' ')}
          fill={accent} stroke={color} strokeWidth="2.4" strokeLinejoin="round" style={{ ...fb(), animation: an('lgpwBurst', ms, 0, 'ease-out') }} />
        <g style={{ animation: an('lgpwFuryL', ms, 0, 'cubic-bezier(.6,0,.3,1)') }}><path d="M22 22 L74 74 L78 70 L26 18 Z" fill="#ffffff" stroke={color} strokeWidth="1.6" /><rect x="16" y="14" width="10" height="4" rx="2" transform="rotate(45 21 16)" fill={color} /></g>
        <g style={{ animation: an('lgpwFuryR', ms, 0, 'cubic-bezier(.6,0,.3,1)') }}><path d="M78 22 L26 74 L22 70 L74 18 Z" fill="#ffffff" stroke={color} strokeWidth="1.6" /><rect x="74" y="14" width="10" height="4" rx="2" transform="rotate(-45 79 16)" fill={color} /></g>
        {Array.from({ length: 8 }, (_, i) => <circle key={i} cx={30 + i * 6} cy={56 + (i % 3) * 4} r={1.6 + (i % 2)} fill={i % 2 ? accent : color} style={{ '--x': `${(i - 4) * 5}px`, animation: an('lgpwEmber', ms, 0, 'ease-out') }} />)}
      </svg>
    </>
  ),
  anchor: ({ color, accent, ms }) => (
    <svg viewBox="0 0 100 100" style={fill} aria-hidden="true">
      {[[50, 84, 30, 92], [50, 84, 70, 93], [50, 84, 40, 98], [50, 84, 62, 99]].map(([x1, y1, x2, y2], i) => (
        <path key={i} d={`M${x1} ${y1} L${(x1 + x2) / 2 + (i % 2 ? 3 : -3)} ${(y1 + y2) / 2} L${x2} ${y2}`} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray="40" style={{ animation: an('lgpwCrack', ms, 0, 'ease-out') }} />
      ))}
      {[-1, 1, -0.5, 0.5].map((d, i) => <circle key={i} cx={50 + d * 14} cy="84" r="5" fill={accent} fillOpacity=".7" style={{ ...fb(), '--x': `${d * 26}px`, animation: an('lgpwDust', ms * 0.8, 0, 'ease-out') }} />)}
      <g style={{ ...fb('center bottom'), animation: an('lgpwAnchor', ms, 0, 'cubic-bezier(.55,0,.6,1)') }}>
        <circle cx="50" cy="22" r="6" fill="none" stroke="#2a3440" strokeWidth="5.5" /><circle cx="50" cy="22" r="6" fill="none" stroke={accent} strokeWidth="3.2" />
        <rect x="47" y="27" width="6" height="50" rx="2" fill={accent} stroke="#2a3440" strokeWidth="1.6" />
        <rect x="36" y="36" width="28" height="5" rx="2.5" fill={accent} stroke="#2a3440" strokeWidth="1.4" />
        <path d="M24 62 C26 78 40 84 50 84 C60 84 74 78 76 62 L70 66 C66 74 58 78 50 78 C42 78 34 74 30 66 Z" fill={color} stroke="#ffffff" strokeWidth="1.4" />
      </g>
      {[0, 180].map((a) => <path key={a} d="M50 61 C39 53 38 46 42 43 C45 41 48.5 42 50 45 C51.5 42 55 41 58 43 C62 46 61 53 50 61 Z" fill={color} stroke="#ffffff" strokeWidth="1.2" style={{ transformOrigin: '50px 50px', '--a': `${a}deg`, animation: an('lgpwOrbit', ms, 0, 'ease-out') }} />)}
    </svg>
  ),
}

// A power's cast in the boss box (BossArena plays it for castMs(id), then clears it).
export function PowerFx({ t, power, fading = false }) {
  const spec = power && POWER_FX[power.id]
  if (!spec) return null
  const Shape = SHAPES[spec.shape]
  return (
    <div key={`pw${power.n}`} aria-hidden="true" data-power-fx={power.id} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2, containerType: 'size', clipPath: 'inset(-30%)', opacity: fading ? 0 : 1, transition: 'opacity 200ms ease-in' }}>
      <style>{CSS}</style>
      <Shape {...spec} />
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: '32cqw', height: '32cqw', filter: `drop-shadow(0 0 2.5cqw ${spec.color})`, animation: an(ICON_ANIM[spec.icon], spec.ms - (spec.iconAt || 0), spec.iconAt || 0) }}>
        <PowerIcon id={power.id} />
      </div>
      {t && (
        <div style={{ position: 'absolute', left: '50%', top: '6%', whiteSpace: 'nowrap', fontFamily: FONT.display, fontWeight: 900, fontSize: 20, letterSpacing: '.04em', color: spec.color, WebkitTextStroke: `2px ${FLOATER_OUTLINE}`, paintOrder: 'stroke fill', animation: an('lgpwLabel', spec.ms, 80), zIndex: 3 }}>
          {t(spec.label)}
        </div>
      )}
    </div>
  )
}

// Sharpen armed: a gold target lock turning slowly over the boss, until the answer spends it.
export function SharpenLock() {
  return (
    <div aria-hidden="true" data-power-armed="sharpen" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: '78%', height: '78%', animation: 'lgpwLockIn 300ms ease-out both' }}>
        <div style={{ position: 'absolute', inset: 0, animation: 'lgpwLock 2.4s linear infinite' }}>
          <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true" style={{ overflow: 'visible', filter: 'drop-shadow(0 0 4px #ffd23a)' }}>
            <circle cx="50" cy="50" r="44" fill="none" stroke="#ffd23a" strokeWidth="2.5" strokeDasharray="20 14" />
            {[0, 90, 180, 270].map((a) => <path key={a} d="M50 0v14" stroke="#fff6c8" strokeWidth="3.5" strokeLinecap="round" transform={`rotate(${a} 50 50)`} />)}
          </svg>
        </div>
      </div>
    </div>
  )
}

// The moving looks of the armed powers (each its own), inside the boss box. Only while effects may play.
function ArmedLooks({ armed }) {
  const on = (id) => (POWER_ARMED[id]?.window ? armed[id] > 0 : !!armed[id])
  return (
    <>
      {on('sharpen') && <SharpenLock />}
      {on('ward') && (
        <div aria-hidden="true" data-power-armed="ward" style={{ position: 'absolute', left: '-4%', right: '-4%', bottom: '-6%', height: '44%', pointerEvents: 'none', zIndex: 1, transform: 'scaleY(.42)', transformOrigin: 'center bottom' }}>
          <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible', filter: 'drop-shadow(0 0 5px #b07cff)', animation: 'lgpwFloorRune 6s linear infinite', transformOrigin: 'center' }}>
            <circle cx="50" cy="50" r="46" fill="#b07cff" fillOpacity=".22" stroke="#b07cff" strokeWidth="4" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="#efe2ff" strokeWidth="1.6" strokeDasharray="6 5" />
            <polygon points="50,10 85,70 15,70" fill="none" stroke="#efe2ff" strokeWidth="2.4" />
            <polygon points="50,90 15,30 85,30" fill="none" stroke="#efe2ff" strokeWidth="2.4" />
          </svg>
        </div>
      )}
      {on('focus') && (
        <svg aria-hidden="true" data-power-armed="focus" viewBox="0 0 100 100" style={{ ...fill, pointerEvents: 'none', zIndex: 1, filter: 'drop-shadow(0 0 3px #3dffb0)' }}>
          {[[6, 6, 1, 1], [94, 6, -1, 1], [6, 94, 1, -1], [94, 94, -1, -1]].map(([x, y, sx, sy], i) => (
            <path key={i} d={`M${x} ${y + sy * 14} L${x} ${y} L${x + sx * 14} ${y}`} fill="none" stroke="#3dffb0" strokeWidth="3.4" strokeLinecap="round"
              style={{ '--bx': `${sx * 3}px`, '--by': `${sy * 3}px`, animation: `lgpwBreathe 1.4s ease-in-out ${i * 120}ms infinite` }} />
          ))}
        </svg>
      )}
      {on('siphon') && (
        <div aria-hidden="true" data-power-armed="siphon" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, containerType: 'size' }}>
          <div style={{ position: 'absolute', inset: '4%', borderRadius: '50%', border: '1.5px dashed #ff2e5599' }} />
          {[0, 120, 240].map((a) => (
            <div key={a} style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, '--a': `${a}deg`, animation: 'lgpwOrbitDrop 3.2s linear infinite' }}>
              <svg viewBox="0 0 10 14" width="11" height="15" style={{ position: 'absolute', left: -5, top: -7, filter: 'drop-shadow(0 0 3px #ff2e55)' }}><path d="M5 0 C2 5 0 8 0 10 A5 4 0 0 0 10 10 C10 8 8 5 5 0 Z" fill="#ff2e55" stroke="#ffb3c2" strokeWidth=".8" /></svg>
            </div>
          ))}
        </div>
      )}
      {on('momentum') && (
        <div aria-hidden="true" data-power-armed="momentum" style={{ position: 'absolute', left: 0, right: '6%', bottom: '-2%', display: 'flex', justifyContent: 'flex-end', gap: 8, pointerEvents: 'none', zIndex: 1 }}>
          {Array.from({ length: Math.max(1, Math.min(3, armed.momentum)) }, (_, i) => (
            <svg key={i} viewBox="0 0 20 28" style={{ width: 18, height: 25, transformOrigin: 'center bottom', animation: `lgpwFlicker ${0.6 + i * 0.13}s ease-in-out infinite`, filter: 'drop-shadow(0 0 4px #ff8a1f)' }}>
              <path d="M10 0 C14 8 20 12 18 20 C17 25 13 28 10 28 C6 28 2 25 2 20 C2 15 6 12 7 6 C8 10 10 11 11 11 C11 7 10 3 10 0 Z" fill="#ff8a1f" />
              <path d="M10 12 C12 16 14 18 13 22 C12 25 8 25 7 22 C6 19 9 17 10 12 Z" fill="#ffe08a" />
            </svg>
          ))}
        </div>
      )}
      {on('fury') && (
        <div aria-hidden="true" data-power-armed="fury" style={{ position: 'absolute', inset: 0, borderRadius: 14, pointerEvents: 'none', zIndex: 1, animation: 'lgpwRim 1.1s ease-in-out infinite' }}>
          {[18, 42, 66, 84].map((x, i) => <span key={x} style={{ position: 'absolute', left: `${x}%`, bottom: '4%', width: 5, height: 5, borderRadius: '50%', background: i % 2 ? '#ffe14a' : '#ff3b1f', animation: `lgpwRimEmber ${1.4 + i * 0.25}s ease-out ${i * 300}ms infinite` }} />)}
        </div>
      )}
    </>
  )
}

// The armed tray: each armed power's icon and, for a window power, its pips (questions left). Always shown (it is
// information, also with motion off); `anim` adds the moving looks over the boss.
export function PowerArmed({ armed, anim = true }) {
  if (!armed) return null
  const ids = Object.keys(POWER_ARMED).filter((id) => id !== 'shield' && id !== 'steadfast' && (POWER_ARMED[id].window ? armed[id] > 0 : !!armed[id]))
  if (!ids.length) return null
  return (
    <>
      {anim && <style>{CSS}</style>}
      {anim && <ArmedLooks armed={armed} />}
      <div data-power-tray="" aria-hidden="true" style={{ position: 'absolute', left: 2, bottom: 2, display: 'grid', gap: 3, pointerEvents: 'none', zIndex: 3 }}>
        {ids.map((id) => (
          <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 5px 2px 2px', borderRadius: 999, background: '#120c1ccc', boxShadow: `0 0 0 1.5px ${POWER_FX[id].color}` }}>
            <PowerIcon id={id} size={16} />
            {POWER_ARMED[id].window && Array.from({ length: 3 }, (_, i) => (
              <span key={`${id}${i}`} style={{ width: 6, height: 6, borderRadius: '50%', background: i < armed[id] ? POWER_FX[id].color : 'transparent', border: `1.5px solid ${POWER_FX[id].color}`, animation: anim && i < armed[id] ? `lgpwPipIn .3s ease-out ${i * 60}ms both` : undefined }} />
            ))}
          </div>
        ))}
      </div>
    </>
  )
}

// Shield armed: the hearts row wears a pulsing blue ward and a shield badge.
export function wardStyle(on) {
  return on ? { borderRadius: 999, padding: '1px 6px', animation: 'lgpwWard 1.6s ease-in-out infinite' } : null
}

// Steadfast in the hearts row: an anchor with the extra hearts still standing (they are lost first).
export function SteadfastHearts({ n = 0, size = 16 }) {
  if (!(n > 0)) return null
  return (
    <span data-power-armed="steadfast" aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: '1px 6px 1px 3px', borderRadius: 999, background: '#ffcf4a22', boxShadow: '0 0 0 1.5px #ffcf4a' }}>
      <PowerIcon id="steadfast" size={size + 2} />
      {Array.from({ length: n }, (_, i) => <svg key={i} viewBox="0 0 100 100" width={size} height={size}><path d={HEART} fill="#ffcf4a" stroke="#8a6410" strokeWidth="6" /></svg>)}
    </span>
  )
}

// A power doing its thing on an answer: short; its label sits in the lower middle (the strike label owns the top,
// the armed tray the bottom left).
const PROC_SHAPES = {
  snapring: ({ color }) => (
    <svg viewBox="0 0 100 100" style={fill} aria-hidden="true">
      <circle cx="50" cy="50" r="40" fill="none" stroke="#0d3a2a" strokeWidth="8" style={{ transformOrigin: '50px 50px', animation: an('lgpwSnap', 650, 0, 'cubic-bezier(.5,0,.2,1)') }} />
      <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="5" style={{ transformOrigin: '50px 50px', animation: an('lgpwSnap', 650, 0, 'cubic-bezier(.5,0,.2,1)') }} />
      {[0, 90, 45, 135].map((a, i) => <rect key={a} x="4" y={i < 2 ? 48.5 : 49.2} width="92" height={i < 2 ? 3 : 1.6} rx="1.5" fill={i < 2 ? '#e0fff2' : color} transform={`rotate(${a} 50 50)`} style={{ transformOrigin: '50px 50px', animation: an('lgpwSnapLine', 500, 180 + i * 30, 'ease-out') }} />)}
      <path d="M50 38 L53 47 L62 50 L53 53 L50 62 L47 53 L38 50 L47 47 Z" fill="#ffffff" stroke={color} strokeWidth="1.6" style={{ ...fb(), animation: an('lgpwTwinkle', 520, 200, 'ease-out') }} />
    </svg>
  ),
  draindrops: ({ color }) => (
    <svg viewBox="0 0 100 100" style={fill} aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => (
        <path key={i} d="M50 38 C44 47 44 54 50 57 C56 54 56 47 50 38 Z" fill={i % 2 ? color : '#b0001f'} stroke="#ffffff" strokeWidth="1"
          style={{ ...fb(), '--x': `${(i % 2 ? 1 : -1) * (22 + (i % 5) * 6)}px`, '--y': `${-34 + (i % 4) * 9}px`, animation: an('lgpwDrain', 640, i * 38, 'cubic-bezier(.4,0,.8,.6)') }} />
      ))}
      <path d={HEART} fill="none" stroke={color} strokeWidth="5" style={{ ...fb(), animation: an("lgpwBeat", 850, 0, "ease-out") }} />
    </svg>
  ),
  chevronburst: ({ color }) => (
    <svg viewBox="0 0 100 100" style={fill} aria-hidden="true">
      {[0, 1, 2].map((i) => <path key={i} d="M30 28 L56 50 L30 72 L40 50 Z" fill={i === 1 ? '#ffe08a' : color} stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" style={{ ...fb(), '--x': `${18 + i * 16}px`, animation: an('lgpwChevOut', 560, i * 70, 'ease-out') }} />)}
      {Array.from({ length: 6 }, (_, i) => <rect key={`s${i}`} x="8" y={34 + i * 6} width="34" height="2.2" rx="1.1" fill={i % 2 ? '#ffe08a' : color} style={{ ...fb('right center'), animation: an('lgpwStreak', 480, 40 + i * 25, 'ease-out') }} />)}
    </svg>
  ),
  doublex: ({ color }) => (
    <svg viewBox="0 0 100 100" style={fill} aria-hidden="true">
      {[['M18 22 L82 78', 0, color], ['M82 22 L18 78', 120, color], ['M28 18 L86 70', 280, '#ffe14a'], ['M72 18 L14 70', 400, '#ffe14a']].map(([d, delay, c], i) => (
        <g key={i}>
          <path d={d} stroke="#3a0800" strokeWidth="10" strokeLinecap="round" strokeDasharray="150" style={{ animation: an('lgpwSlashDraw', 380, delay, 'cubic-bezier(.6,0,.2,1)') }} />
          <path d={d} stroke={c} strokeWidth="6" strokeLinecap="round" strokeDasharray="150" style={{ animation: an('lgpwSlashDraw', 380, delay, 'cubic-bezier(.6,0,.2,1)') }} />
          <path d={d} stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="150" style={{ animation: an('lgpwSlashDraw', 380, delay, 'cubic-bezier(.6,0,.2,1)') }} />
        </g>
      ))}
    </svg>
  ),
  hexwall: ({ color }) => (
    <svg viewBox="0 0 100 100" style={fill} aria-hidden="true">
      <g style={{ ...fb(), animation: an('lgpwHexWall', 800, 0, 'cubic-bezier(.2,1.3,.4,1)') }}>
        {[[30, 40], [50, 40], [70, 40], [40, 57], [60, 57], [30, 74], [50, 74], [70, 74]].map(([x, y], i) => <polygon key={i} points={hexPts(x, y, 10)} fill={color} fillOpacity=".35" stroke="#efe2ff" strokeWidth="1.4" />)}
      </g>
      <circle cx="50" cy="57" r="30" fill="none" stroke="#efe2ff" strokeWidth="2" style={{ transformOrigin: '50px 57px', animation: an('lgpwRipple', 600, 150, 'ease-out') }} />
    </svg>
  ),
  brokenheart: ({ color }) => (
    <>
      <svg viewBox="0 0 100 100" style={fill} aria-hidden="true">
        <path d="M50 78 C20 58 14 40 26 30 C36 22 46 27 50 36 L46 46 L53 54 L47 64 Z" fill={color} stroke="#8a6410" strokeWidth="2" style={{ '--x': '-14px', '--r': '-24deg', animation: an('lgpwHalfFall', 900, 0, 'ease-in') }} />
        <path d="M50 36 C54 27 64 22 74 30 C86 40 80 58 50 78 L47 64 L53 54 L46 46 Z" fill={color} stroke="#8a6410" strokeWidth="2" style={{ '--x': '14px', '--r': '24deg', animation: an('lgpwHalfFall', 900, 0, 'ease-in') }} />
      </svg>
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: '34cqw', height: '34cqw', animation: an('lgpwStamp', 900, 120, 'cubic-bezier(.3,1.4,.5,1)') }}><PowerIcon id="steadfast" /></div>
    </>
  ),
}

export function PowerProc({ t, proc, fading = false }) {
  const spec = proc && POWER_PROC[proc.id]
  if (!spec) return null
  const Shape = PROC_SHAPES[spec.shape]
  return (
    <div key={`pp${proc.n}`} aria-hidden="true" data-power-proc={proc.id} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2, containerType: 'size', clipPath: 'inset(-30%)', opacity: fading ? 0 : 1, transition: 'opacity 200ms ease-in' }}>
      <style>{CSS}</style>
      <Shape {...spec} />
      {t && (
        <div style={{ position: 'absolute', left: '50%', top: '56%', whiteSpace: 'nowrap', fontFamily: FONT.display, fontWeight: 900, fontSize: 16, letterSpacing: '.04em', color: spec.color, WebkitTextStroke: `2px ${FLOATER_OUTLINE}`, paintOrder: 'stroke fill', animation: an('lgpwProcLabel', spec.ms, 40), zIndex: 3 }}>
          {t(spec.label)}
        </div>
      )}
    </div>
  )
}

// A cast in a small square of its own (the Bandage, used on the intro and result screens). Still under reduced
// motion and Still bosses (the icon alone); `calm` (focus mode) too.
export function PowerCastBadge({ id, n = 0, size = 72, calm = false }) {
  const still = useArtStill()
  const always = useArtMotionAlways()
  const play = n > 0 && !calm && !still && (always || !reducedMotion())
  return (
    <span data-power-badge={id} aria-hidden="true" style={{ position: 'relative', display: 'inline-block', width: size, height: size, flexShrink: 0, containerType: 'size' }}>
      <span style={{ position: 'absolute', inset: '22%', opacity: play ? .35 : 1 }}><PowerIcon id={id} /></span>
      {play && <PowerFx power={{ id, n }} />}
    </span>
  )
}
