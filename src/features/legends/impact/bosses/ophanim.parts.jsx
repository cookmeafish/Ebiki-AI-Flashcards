// OPHANIM's own impact parts: drawers merged into impact/parts.jsx PARTS. Name each `ophanim<Name>` (never clashes).
// A drawer is (params, ctx) => node, like the shared ones (ctx: color, accent, glyph, scale, speed); CSS keyframes it
// needs go in `css` (prefix them lgophanim). Deterministic, container units, transforms and opacity only.
//
// THE DRAWING ACTS EVERY MOMENT through the file's own hooks (raids/ophanim.svg; pivots set in fx/ophanim.jsx, all on
// the great eye's center): .lgo-wa / .lgo-wb the two counter-turning wheel sets, .lgo-wing the wings, .lgo-eye the
// great eye, .lgo-lids + .lgo-alm its lids. The photo layers live inside those groups, so they move with them.
// (lg-ophanim-wheelA / -wingA / -eyeA wrap them for the attack on the player: fx/ophanim.jsx.) Serene, never angry:
// it answers with its wheels, wings and eye, never a snarl.
// hit      the wheels are jolted off their axes and wobble back, the eye squints
// crit     the wheels are knocked into a full spin each way, the eye slams shut and opens, the wings flinch in
// sharpen  one wheel set is sliced askew and slowly rights itself, the lids flinch
// strike   (after its wheels sweep you) the great eye stares wide at you, blazing
// heavy    the wings spread enormous and beat DOWN once, the wheels whirl against each other, the eye flares
// block    the wheels lock into a tight interlocking shield before the eye, the lids narrow
// shield   the eye glances aside, the wings fold in front of it
// wind     weary: the wings sink, the wheels slow and tilt, the eye half closes
// ko       the wheels grind to a halt and fall in on themselves, the wings fold down, the great eye closes for good
const sel = (moment, part) => `.lg-boss[data-motif="ophanim"][data-moment="${moment}"] .${part}`
// Written as longhands (name, duration, easing, delay): the part rules live in the global impact CSS.
const longhand = (a) => {
  const t = a.match(/cubic-bezier\([^)]*\)|\S+/g)
  const times = t.filter((x) => /^[\d.]+ms$/.test(x))
  const ease = t.find((x) => /^(cubic-bezier|ease|linear)/.test(x)) || 'ease'
  return `animation-name: ${t[0]}; animation-duration: ${times[0]}; animation-timing-function: ${ease}; animation-delay: ${times[1] || '0ms'}; animation-fill-mode: both`
}
const rule = (moment, parts, anim) => `${parts.split(' ').map((p) => sel(moment, p)).join(', ')} { ${longhand(anim)} }`

export const css = `
@keyframes lgophanimJoltA { 0% { transform: none } 12% { transform: rotate(14deg) scale(.97) } 36% { transform: rotate(-6deg) } 60% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgophanimJoltB { 0% { transform: none } 12% { transform: rotate(-12deg) scale(1.03) } 36% { transform: rotate(5deg) } 60% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgophanimSquint { 0% { transform: none } 14% { transform: scaleY(.45) } 46% { transform: scaleY(.85) } 100% { transform: none } }
@keyframes lgophanimSpinA { 0% { transform: none } 10% { transform: rotate(-20deg) scale(.95) } 70% { transform: rotate(375deg) } 100% { transform: rotate(360deg) } }
@keyframes lgophanimSpinB { 0% { transform: none } 10% { transform: rotate(20deg) scale(1.05) } 70% { transform: rotate(-375deg) } 100% { transform: rotate(-360deg) } }
@keyframes lgophanimSlam { 0% { transform: none } 8% { transform: scaleY(.06) } 34% { transform: scaleY(.06) } 50% { transform: scaleY(1.2) } 100% { transform: none } }
@keyframes lgophanimFlinchIn { 0% { transform: none } 12% { transform: scale(.88, .94) } 44% { transform: scale(1.02) } 100% { transform: none } }
@keyframes lgophanimSlice { 0% { transform: none } 8% { transform: rotate(-28deg) scale(1, .78) translateY(3%) } 40% { transform: rotate(-20deg) scale(1, .84) translateY(2%) } 75% { transform: rotate(-4deg) } 100% { transform: none } }
@keyframes lgophanimLidFlinch { 0% { transform: none } 10% { transform: scaleY(.3) } 30% { transform: scaleY(.7) } 100% { transform: none } }
@keyframes lgophanimStare { 0% { transform: none } 22% { transform: scaleY(1.55) scaleX(1.06) } 70% { transform: scaleY(1.45) scaleX(1.05) } 100% { transform: none } }
@keyframes lgophanimBlaze { 0% { transform: none; filter: none } 22% { transform: scale(1.2); filter: brightness(1.7) saturate(1.4) } 70% { transform: scale(1.14); filter: brightness(1.4) } 100% { transform: none; filter: none } }
@keyframes lgophanimBeat { 0% { transform: none } 30% { transform: scale(1.26, 1.12) translateY(-4%) } 46% { transform: scale(.9, .94) translateY(5%) } 62% { transform: scale(1.04) translateY(1%) } 100% { transform: none } }
@keyframes lgophanimWhirlA { 0% { transform: none } 30% { transform: rotate(-30deg) scale(.92) } 100% { transform: rotate(360deg) } }
@keyframes lgophanimWhirlB { 0% { transform: none } 30% { transform: rotate(30deg) scale(.92) } 100% { transform: rotate(-360deg) } }
@keyframes lgophanimFlare { 0% { transform: none; filter: none } 30% { transform: scale(.9); filter: brightness(.8) } 46% { transform: scale(1.3); filter: brightness(2) saturate(1.5) } 70% { transform: scale(1.08); filter: brightness(1.3) } 100% { transform: none; filter: none } }
@keyframes lgophanimLockA { 0% { transform: none } 16% { transform: rotate(90deg) scale(.8) } 60% { transform: rotate(84deg) scale(.82) } 100% { transform: rotate(0) } }
@keyframes lgophanimLockB { 0% { transform: none } 16% { transform: rotate(-90deg) scale(.8) } 60% { transform: rotate(-84deg) scale(.82) } 100% { transform: rotate(0) } }
@keyframes lgophanimNarrow { 0% { transform: none } 16% { transform: scaleY(.5) } 60% { transform: scaleY(.55) } 100% { transform: none } }
@keyframes lgophanimGlance { 0% { transform: none } 24% { transform: translateX(-7%) scale(.94) } 60% { transform: translateX(-5%) scale(.96) } 100% { transform: none } }
@keyframes lgophanimShelter { 0% { transform: none } 24% { transform: scale(.84, 1.04) } 60% { transform: scale(.88, 1.03) } 100% { transform: none } }
@keyframes lgophanimSink { 0% { transform: none } 35% { transform: scale(1, .9) translateY(5%) } 72% { transform: scale(1, .92) translateY(4%) } 100% { transform: none } }
@keyframes lgophanimTiltA { 0% { transform: none } 40% { transform: rotate(-12deg) scale(.96, .9) } 75% { transform: rotate(-9deg) scale(.97, .92) } 100% { transform: none } }
@keyframes lgophanimTiltB { 0% { transform: none } 40% { transform: rotate(9deg) scale(.96, .9) } 75% { transform: rotate(7deg) scale(.97, .92) } 100% { transform: none } }
@keyframes lgophanimHalfClose { 0% { transform: none } 35% { transform: scaleY(.5) } 75% { transform: scaleY(.55) } 100% { transform: none } }
@keyframes lgophanimHaltA { 0% { transform: none } 40% { transform: rotate(160deg) } 60% { transform: rotate(185deg) scale(.86, .7) } 66% { transform: rotate(180deg) scale(.88, .74) } 100% { transform: rotate(190deg) scale(.62, .42) translateY(10%) } }
@keyframes lgophanimHaltB { 0% { transform: none } 40% { transform: rotate(-150deg) } 60% { transform: rotate(-178deg) scale(.86, .7) } 66% { transform: rotate(-172deg) scale(.88, .74) } 100% { transform: rotate(-182deg) scale(.6, .4) translateY(12%) } }
@keyframes lgophanimFold { 0% { transform: none } 12% { transform: scale(1.12, 1.06) } 50% { transform: scale(.94, .92) translateY(3%) } 62% { transform: scale(.72, .6) translateY(12%) } 100% { transform: scale(.66, .52) translateY(15%) } }
@keyframes lgophanimClose { 0% { transform: none } 12% { transform: scaleY(1.4) } 40% { transform: scaleY(.3) } 50% { transform: scaleY(.6) } 62% { transform: scaleY(.04) } 100% { transform: scaleY(.04) } }
@keyframes lgophanimDimOut { 0% { filter: none } 55% { filter: brightness(1.2) } 66% { filter: brightness(.5) saturate(.4) } 100% { filter: brightness(.45) saturate(.3) } }
@keyframes lgophanimGlare { 0% { transform: translate(-50%, -50%) scale(.2, .05); opacity: 0 } 18% { transform: translate(-50%, -50%) scale(.6, .4); opacity: 1 } 40% { transform: translate(-50%, -50%) scale(1, 1); opacity: 1 } 70% { transform: translate(-50%, -50%) scale(2.6, 2.4); opacity: .9 } 100% { transform: translate(-50%, -50%) scale(3.4, 3.2); opacity: 0 } }
@keyframes lgophanimRoll { 0% { transform: translate(-50%, -50%) rotate(var(--r0)) scale(.2, .07); opacity: 0 } 18% { opacity: 1 } 46% { transform: translate(-50%, -50%) rotate(var(--r1)) scale(1, .34) } 72% { transform: translate(-50%, -50%) rotate(var(--r2)) scale(2.2, .9); opacity: .95 } 100% { transform: translate(-50%, -50%) rotate(var(--r2)) scale(3, 1.3); opacity: 0 } }
${rule('hit', 'lgo-wa', 'lgophanimJoltA 560ms ease-out both')}
${rule('hit', 'lgo-wb', 'lgophanimJoltB 560ms ease-out both')}
${rule('hit', 'lgo-lids lgo-alm', 'lgophanimSquint 520ms ease-out both')}
${rule('crit', 'lgo-wa', 'lgophanimSpinA 760ms cubic-bezier(.3,.9,.3,1) both')}
${rule('crit', 'lgo-wb', 'lgophanimSpinB 760ms cubic-bezier(.3,.9,.3,1) both')}
${rule('crit', 'lgo-lids lgo-alm', 'lgophanimSlam 700ms ease-out both')}
${rule('crit', 'lgo-wing', 'lgophanimFlinchIn 640ms ease-out both')}
${rule('sharpen', 'lgo-wb', 'lgophanimSlice 860ms cubic-bezier(.15,.9,.3,1) both')}
${rule('sharpen', 'lgo-lids lgo-alm', 'lgophanimLidFlinch 600ms ease-out both')}
${rule('hurt', 'lgo-lids lgo-alm', 'lgophanimStare 760ms cubic-bezier(.3,.7,.3,1) 150ms both')}
${rule('hurt', 'lgo-eye', 'lgophanimBlaze 760ms cubic-bezier(.3,.7,.3,1) 150ms both')}
${rule('hurtBig', 'lgo-wing', 'lgophanimBeat 860ms cubic-bezier(.4,0,.2,1) both')}
${rule('hurtBig', 'lgo-wa', 'lgophanimWhirlA 860ms cubic-bezier(.4,0,.2,1) both')}
${rule('hurtBig', 'lgo-wb', 'lgophanimWhirlB 860ms cubic-bezier(.4,0,.2,1) both')}
${rule('hurtBig', 'lgo-eye', 'lgophanimFlare 860ms cubic-bezier(.4,0,.2,1) both')}
${rule('block', 'lgo-wa', 'lgophanimLockA 680ms cubic-bezier(.2,.9,.3,1) both')}
${rule('block', 'lgo-wb', 'lgophanimLockB 680ms cubic-bezier(.2,.9,.3,1) both')}
${rule('block', 'lgo-lids lgo-alm', 'lgophanimNarrow 680ms ease-out both')}
${rule('shield', 'lgo-eye lgo-lids lgo-alm', 'lgophanimGlance 720ms ease-out both')}
${rule('shield', 'lgo-wing', 'lgophanimShelter 720ms ease-out both')}
${rule('wind', 'lgo-wing', 'lgophanimSink 1000ms ease-in-out both')}
${rule('wind', 'lgo-wa', 'lgophanimTiltA 1000ms ease-in-out both')}
${rule('wind', 'lgo-wb', 'lgophanimTiltB 1000ms ease-in-out both')}
${rule('wind', 'lgo-lids lgo-alm', 'lgophanimHalfClose 1000ms ease-in-out both')}
${rule('ko', 'lgo-wa', 'lgophanimHaltA 2400ms cubic-bezier(.2,.6,.4,1) both')}
${rule('ko', 'lgo-wb', 'lgophanimHaltB 2400ms cubic-bezier(.2,.6,.4,1) both')}
${rule('ko', 'lgo-wing', 'lgophanimFold 2400ms ease-in both')}
${rule('ko', 'lgo-lids lgo-alm', 'lgophanimClose 2400ms ease-in-out both')}
${rule('ko', 'lgo-eye', 'lgophanimDimOut 2400ms ease-in both')}
`

export default {
  // Its strike: the glare of the great eye itself, an almond of white-gold light opening over you and burning outward.
  ophanimGlare: (p, ctx) => <div key="ogl" style={{ position: 'absolute', left: '50%', top: '46%', width: '44cqw', height: '24cqw', borderRadius: '50%', clipPath: 'ellipse(50% 50%)',
    background: `radial-gradient(circle, #ffffff 0 16%, #6fc3ff 22%, #1d2230 28%, #ffffff 34%, ${ctx.color} 60%, ${ctx.color}00 72%)`, filter: `drop-shadow(0 0 3cqw ${ctx.color})`, animation: `lgophanimGlare ${760 * ctx.speed}ms cubic-bezier(.4,0,.5,1) both` }} />,
  // Its heavy blow: two burning wheel rims roll out of it at the camera, crossing as they come.
  ophanimWheels: (p, ctx) => [[-30, 40, 120, '#ffcf4a'], [30, -40, -120, '#fff6c8']].map(([r0, r1, r2, c], i) => (
    <div key={`owh${i}`} style={{ position: 'absolute', left: '50%', top: '50%', width: '60cqw', height: '60cqw', borderRadius: '50%', border: `2.6cqw solid ${c}`, boxShadow: `0 0 3cqw ${ctx.color}, inset 0 0 2cqw ${ctx.color}`,
      background: `repeating-conic-gradient(${c}00 0 22deg, ${c}55 22deg 26deg)`, '--r0': `${r0}deg`, '--r1': `${r1}deg`, '--r2': `${r2}deg`, animation: `lgophanimRoll ${860 * ctx.speed}ms cubic-bezier(.4,0,.6,1) ${i * 90}ms both` }} />
  )),
}
