// VOID's own impact parts: drawers merged into impact/parts.jsx PARTS. Name each `void<Name>` (never clashes).
// A drawer is (params, ctx) => node, like the shared ones (ctx: color, accent, glyph, scale, speed); CSS keyframes it
// needs go in `css` (prefix them lgvoid). Deterministic, container units, transforms and opacity only.
//
// THE DRAWING ACTS EVERY MOMENT (raids/void.svg wrappers, pivots in the file):
//   .lg-void-body     the spiked dark sphere (its center)      .lg-void-spikes  the shadow corona behind it
//   .lg-void-face     its eye and fanged mouth (phases 1-2 and the phase 3 face)
//   .lg-void-ring     both halves of the accretion ring (tilts and swells, never spins: it is a flattened ellipse)
//   .lg-void-tendrilL / -tendrilR   the four tentacles, each turning on the point where it leaves the body
//   (-faceA, -ringA, -tendrilLA, -tendrilRA are inner wrappers the attack on the player moves: fx/void.jsx)
// hit      the horizon ripples like jelly, the ring rocks, the eye squints
// crit     the whole mass squashes and rebounds, the tentacles flail out, the face is dragged sideways
// sharpen  the face is sheared, the ring is knocked steeply askew, the right tentacles recoil
// strike   (after it drains your heart) it yawns wide in a gloating gulp, the tentacles lash forward
// heavy    it sucks itself in tight, then ERUPTS outward: tentacles whip wide, the ring swells, the maw roars
// block    it flinches inward: the tentacles curl over the body, the ring cinches tight
// shield   your shield slides along its ring: the ring rocks hard, the face looks away, the mass skids
// wind     it sulks: the sphere deflates, the tentacles droop, the eye narrows
// ko       it collapses into its own singularity: tentacles curl in, the ring shrinks to a sliver, the face spins away
const sel = (moment, part) => `.lg-boss[data-motif="void"][data-moment="${moment}"] .lg-void-${part}`
// Written as longhands (name, duration, easing, delay): the part rules live in the global impact CSS.
const longhand = (a) => {
  const t = a.match(/cubic-bezier\([^)]*\)|\S+/g)
  const times = t.filter((x) => /^[\d.]+ms$/.test(x))
  const ease = t.find((x) => /^(cubic-bezier|ease|linear)/.test(x)) || 'ease'
  return `animation-name: ${t[0]}; animation-duration: ${times[0]}; animation-timing-function: ${ease}; animation-delay: ${times[1] || '0ms'}; animation-fill-mode: both`
}
const rule = (moment, parts, anim) => `${parts.split(' ').map((p) => sel(moment, p)).join(', ')} { ${longhand(anim)} }`

export const css = `
@keyframes lgvoidJelly { 0% { transform: none } 12% { transform: scale(1.1, .9) } 28% { transform: scale(.93, 1.07) } 46% { transform: scale(1.04, .97) } 64% { transform: scale(.99, 1.01) } 100% { transform: none } }
@keyframes lgvoidRock { 0% { transform: none } 14% { transform: rotate(9deg) } 40% { transform: rotate(-5deg) } 66% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgvoidSquint { 0% { transform: none } 14% { transform: scale(1.04, .78) } 46% { transform: scale(.99, 1.02) } 100% { transform: none } }
@keyframes lgvoidSquash { 0% { transform: none } 10% { transform: scale(1.22, .74) } 26% { transform: scale(.84, 1.18) } 44% { transform: scale(1.08, .94) } 62% { transform: scale(.97, 1.03) } 100% { transform: none } }
@keyframes lgvoidFlailL { 0% { transform: none } 12% { transform: rotate(32deg) } 30% { transform: rotate(-14deg) } 50% { transform: rotate(9deg) } 72% { transform: rotate(-3deg) } 100% { transform: none } }
@keyframes lgvoidFlailR { 0% { transform: none } 12% { transform: rotate(-32deg) } 30% { transform: rotate(14deg) } 50% { transform: rotate(-9deg) } 72% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgvoidDrag { 0% { transform: none } 10% { transform: translateX(-8%) skewX(16deg) } 30% { transform: translateX(4%) skewX(-8deg) } 54% { transform: skewX(3deg) } 100% { transform: none } }
@keyframes lgvoidShear { 0% { transform: none } 8% { transform: skewY(-14deg) translateY(3%) } 40% { transform: skewY(-8deg) translateY(2%) } 75% { transform: skewY(2deg) } 100% { transform: none } }
@keyframes lgvoidAskew { 0% { transform: none } 8% { transform: rotate(-26deg) scale(1.06) } 45% { transform: rotate(-16deg) } 80% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgvoidRecoilR { 0% { transform: none } 10% { transform: rotate(28deg) } 40% { transform: rotate(16deg) } 100% { transform: none } }
@keyframes lgvoidYawn { 0% { transform: none } 22% { transform: scale(.94) } 42% { transform: scale(1.18, 1.34) } 58% { transform: scale(1.06, 1.12) } 72% { transform: scale(1.14, 1.26) } 100% { transform: none } }
@keyframes lgvoidLashL { 0% { transform: none } 22% { transform: rotate(-16deg) } 42% { transform: rotate(22deg) scale(1.16) } 70% { transform: rotate(5deg) scale(1.04) } 100% { transform: none } }
@keyframes lgvoidLashR { 0% { transform: none } 22% { transform: rotate(16deg) } 42% { transform: rotate(-22deg) scale(1.16) } 70% { transform: rotate(-5deg) scale(1.04) } 100% { transform: none } }
@keyframes lgvoidErupt { 0% { transform: none } 30% { transform: scale(.78) } 44% { transform: scale(1.3) } 60% { transform: scale(.95) } 76% { transform: scale(1.04) } 100% { transform: none } }
@keyframes lgvoidCurlWhipL { 0% { transform: none } 30% { transform: rotate(-38deg) scale(.8) } 44% { transform: rotate(30deg) scale(1.22) } 64% { transform: rotate(-6deg) } 100% { transform: none } }
@keyframes lgvoidCurlWhipR { 0% { transform: none } 30% { transform: rotate(38deg) scale(.8) } 44% { transform: rotate(-30deg) scale(1.22) } 64% { transform: rotate(6deg) } 100% { transform: none } }
@keyframes lgvoidSwell { 0% { transform: none } 30% { transform: scale(.7) rotate(6deg) } 44% { transform: scale(1.35) rotate(-8deg) } 66% { transform: scale(1.06) } 100% { transform: none } }
@keyframes lgvoidRoar { 0% { transform: none } 30% { transform: scale(.85) } 44% { transform: scale(1.22, 1.45) } 66% { transform: scale(1.08, 1.16) } 100% { transform: none } }
@keyframes lgvoidCringe { 0% { transform: none } 16% { transform: scale(.86) } 56% { transform: scale(.9) } 100% { transform: none } }
@keyframes lgvoidCoverL { 0% { transform: none } 16% { transform: rotate(-42deg) scale(.9) } 58% { transform: rotate(-36deg) scale(.92) } 100% { transform: none } }
@keyframes lgvoidCoverR { 0% { transform: none } 16% { transform: rotate(42deg) scale(.9) } 58% { transform: rotate(36deg) scale(.92) } 100% { transform: none } }
@keyframes lgvoidCinch { 0% { transform: none } 16% { transform: scale(.78) } 58% { transform: scale(.82) } 100% { transform: none } }
@keyframes lgvoidRockHard { 0% { transform: none } 18% { transform: rotate(-18deg) scale(1.05) } 38% { transform: rotate(12deg) } 60% { transform: rotate(-4deg) } 100% { transform: none } }
@keyframes lgvoidLookAway { 0% { transform: none } 20% { transform: translateX(-7%) scale(.96) } 60% { transform: translateX(-5%) } 100% { transform: none } }
@keyframes lgvoidSkid { 0% { transform: none } 26% { transform: translateX(5%) rotate(4deg) } 60% { transform: translateX(2%) } 100% { transform: none } }
@keyframes lgvoidDeflate { 0% { transform: none } 40% { transform: scale(.9, .86) translateY(3%) } 75% { transform: scale(.92, .88) translateY(2%) } 100% { transform: none } }
@keyframes lgvoidDroopL { 0% { transform: none } 40% { transform: rotate(-18deg) } 75% { transform: rotate(-15deg) } 100% { transform: none } }
@keyframes lgvoidDroopR { 0% { transform: none } 40% { transform: rotate(18deg) } 75% { transform: rotate(15deg) } 100% { transform: none } }
@keyframes lgvoidNarrow { 0% { transform: none } 40% { transform: scaleY(.72) } 75% { transform: scaleY(.76) } 100% { transform: none } }
@keyframes lgvoidKoBody { 0% { transform: none } 10% { transform: scale(1.12) } 22% { transform: scale(.9) rotate(-8deg) } 40% { transform: scale(.78) rotate(-24deg) } 56% { transform: scale(.6) rotate(-50deg) } 60% { transform: scale(.66) rotate(-56deg) } 100% { transform: scale(.55) rotate(-70deg) } }
@keyframes lgvoidKoFace { 0% { transform: none } 10% { transform: scale(1.1, 1.3) } 30% { transform: scale(.9) rotate(20deg) } 56% { transform: scale(.55) rotate(120deg) } 62% { transform: scale(.6) rotate(130deg) } 100% { transform: scale(.48) rotate(170deg) } }
@keyframes lgvoidKoRing { 0% { transform: none } 12% { transform: scale(1.2) rotate(8deg) } 40% { transform: scale(.8) rotate(-10deg) } 58% { transform: scale(.36, .2) rotate(-20deg) } 100% { transform: scale(.3, .14) rotate(-24deg) } }
@keyframes lgvoidKoCurlL { 0% { transform: none } 12% { transform: rotate(24deg) } 30% { transform: rotate(-30deg) scale(.86) } 58% { transform: rotate(-80deg) scale(.5) } 100% { transform: rotate(-96deg) scale(.42) } }
@keyframes lgvoidKoCurlR { 0% { transform: none } 12% { transform: rotate(-24deg) } 30% { transform: rotate(30deg) scale(.86) } 58% { transform: rotate(80deg) scale(.5) } 100% { transform: rotate(96deg) scale(.42) } }
@keyframes lgvoidMaw { 0% { transform: translate(-50%, -50%) scale(.1); opacity: 0 } 20% { transform: translate(-50%, -50%) scale(.6); opacity: 1 } 46% { transform: translate(-50%, -50%) scale(1.05); opacity: 1 } 56% { transform: translate(-50%, -50%) scale(.9) } 74% { transform: translate(-50%, -50%) scale(2.2); opacity: .95 } 100% { transform: translate(-50%, -50%) scale(3); opacity: 0 } }
@keyframes lgvoidTooth { 0% { transform: rotate(var(--a)) translateY(-26cqw) scaleY(.2); opacity: 0 } 30% { opacity: 1 } 46% { transform: rotate(var(--a)) translateY(-14cqw) scaleY(1) } 56% { transform: rotate(var(--a)) translateY(-11cqw) scaleY(1.1) } 100% { transform: rotate(var(--a)) translateY(-40cqw) scaleY(1.4); opacity: 0 } }
@keyframes lgvoidRend { 0% { transform: translate(-50%, -50%) scale(1.6); opacity: 0 } 18% { opacity: .9 } 34% { transform: translate(-50%, -50%) scale(.3); opacity: 1 } 44% { transform: translate(-50%, -50%) scale(.05); opacity: 1 } 52% { transform: translate(-50%, -50%) scale(.4); opacity: 1 } 100% { transform: translate(-50%, -50%) scale(3.4); opacity: 0 } }
${rule('hit', 'body spikes', 'lgvoidJelly 560ms ease-out both')}
${rule('hit', 'ring', 'lgvoidRock 600ms ease-out both')}
${rule('hit', 'face', 'lgvoidSquint 520ms ease-out both')}
${rule('crit', 'body spikes', 'lgvoidSquash 720ms cubic-bezier(.2,.9,.3,1) both')}
${rule('crit', 'tendrilL', 'lgvoidFlailL 720ms ease-out both')}
${rule('crit', 'tendrilR', 'lgvoidFlailR 720ms ease-out both')}
${rule('crit', 'face', 'lgvoidDrag 700ms cubic-bezier(.2,.9,.3,1) both')}
${rule('sharpen', 'face', 'lgvoidShear 760ms cubic-bezier(.15,.9,.3,1) both')}
${rule('sharpen', 'ring', 'lgvoidAskew 800ms cubic-bezier(.15,.9,.3,1) both')}
${rule('sharpen', 'tendrilR', 'lgvoidRecoilR 700ms ease-out both')}
${rule('hurt', 'face', 'lgvoidYawn 820ms cubic-bezier(.3,.7,.3,1) 200ms both')}
${rule('hurt', 'tendrilL', 'lgvoidLashL 700ms cubic-bezier(.3,.7,.3,1) 150ms both')}
${rule('hurt', 'tendrilR', 'lgvoidLashR 700ms cubic-bezier(.3,.7,.3,1) 150ms both')}
${rule('hurtBig', 'body spikes', 'lgvoidErupt 860ms cubic-bezier(.4,0,.2,1) both')}
${rule('hurtBig', 'tendrilL', 'lgvoidCurlWhipL 860ms cubic-bezier(.4,0,.2,1) both')}
${rule('hurtBig', 'tendrilR', 'lgvoidCurlWhipR 860ms cubic-bezier(.4,0,.2,1) both')}
${rule('hurtBig', 'ring', 'lgvoidSwell 860ms cubic-bezier(.4,0,.2,1) both')}
${rule('hurtBig', 'face', 'lgvoidRoar 860ms cubic-bezier(.4,0,.2,1) both')}
${rule('block', 'body spikes', 'lgvoidCringe 660ms ease-out both')}
${rule('block', 'tendrilL', 'lgvoidCoverL 660ms cubic-bezier(.2,.9,.3,1) both')}
${rule('block', 'tendrilR', 'lgvoidCoverR 660ms cubic-bezier(.2,.9,.3,1) both')}
${rule('block', 'ring', 'lgvoidCinch 660ms ease-out both')}
${rule('shield', 'ring', 'lgvoidRockHard 720ms ease-out both')}
${rule('shield', 'face', 'lgvoidLookAway 720ms ease-out both')}
${rule('shield', 'body spikes', 'lgvoidSkid 720ms ease-out both')}
${rule('wind', 'body spikes', 'lgvoidDeflate 1000ms ease-in-out both')}
${rule('wind', 'tendrilL', 'lgvoidDroopL 1000ms ease-in-out both')}
${rule('wind', 'tendrilR', 'lgvoidDroopR 1000ms ease-in-out both')}
${rule('wind', 'face', 'lgvoidNarrow 1000ms ease-in-out both')}
${rule('ko', 'body spikes', 'lgvoidKoBody 2300ms cubic-bezier(.5,0,.5,1) both')}
${rule('ko', 'face', 'lgvoidKoFace 2300ms cubic-bezier(.5,0,.5,1) both')}
${rule('ko', 'ring', 'lgvoidKoRing 2300ms cubic-bezier(.5,0,.5,1) both')}
${rule('ko', 'tendrilL', 'lgvoidKoCurlL 2300ms cubic-bezier(.5,0,.5,1) both')}
${rule('ko', 'tendrilR', 'lgvoidKoCurlR 2300ms cubic-bezier(.5,0,.5,1) both')}
`

export default {
  // Its strike: its maw opens over the camera, a ring of violet fangs closing in, then the dark rushes out at you.
  voidMaw: (p, ctx) => <div key="vmw" style={{ position: 'absolute', left: '50%', top: '50%', width: '46cqw', height: '46cqw', animation: `lgvoidMaw ${800 * ctx.speed}ms cubic-bezier(.4,0,.5,1) both` }}>
    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle, #000 0 46%, #2a0a52 58%, #b067ff 66%, #b067ff00 74%)', filter: 'drop-shadow(0 0 2cqw #b067ff)' }} />
    {Array.from({ length: 10 }, (_, i) => (
      <div key={i} style={{ position: 'absolute', left: '50%', top: '50%', width: '5cqw', height: '9cqw', marginLeft: '-2.5cqw', marginTop: '-4.5cqw', clipPath: 'polygon(0 0, 100% 0, 50% 100%)', background: 'linear-gradient(#ffffff, #e3c9ff)', '--a': `${i * 36}deg`, transformOrigin: '50% 50%',
        animation: `lgvoidTooth ${800 * ctx.speed}ms cubic-bezier(.4,0,.5,1) both` }} />
    ))}
  </div>,
  // Its heavy blow: space itself tears: a rift crushes to a point and then bursts open at the camera.
  voidRend: (p, ctx) => <div key="vrd" style={{ position: 'absolute', left: '50%', top: '50%', width: '70cqw', height: '70cqw', borderRadius: '50%',
    background: 'radial-gradient(circle, #ffffff 0 4%, #000000 10% 34%, #5a1fb8 44%, #b067ff 52%, #b067ff00 70%)', filter: 'drop-shadow(0 0 3cqw #b067ff)', animation: `lgvoidRend ${860 * ctx.speed}ms cubic-bezier(.5,0,.4,1) both` }} />,
}
