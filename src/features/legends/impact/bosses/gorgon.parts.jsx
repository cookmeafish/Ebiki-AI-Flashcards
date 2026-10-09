// GORGON's own impact parts: drawers merged into impact/parts.jsx PARTS. Name each `gorgon<Name>` (never clashes).
// A drawer is (params, ctx) => node, like the shared ones (ctx: color, accent, glyph, scale, speed); CSS keyframes it
// needs go in `css` (prefix them lggorgon). Deterministic, container units, transforms and opacity only.
//
// THE DRAWING ACTS TOO: raids/gorgon.svg carries lg-gorgon-* parts (wings, crown and front snakes, hood, face, eyes,
// maw, arms; phase 2's snake face and the split stone halves; phase 3's eye, knot and outer heads). The `css` below
// moves them per moment (the arena's data-moment). Her attack on the player (data-assault-on) and her ability's parts
// are in fx/gorgon.jsx, whose CSS is on the page for the whole raid (the attack starts before this layer mounts).

// Where her eyes are in the box (phase 1 and 2 two eyes, phase 3 the one great eye: css below moves them there).
const EYES = [44, 56]

const SNAKE = (c, a) => (
  <svg viewBox="0 0 40 24" style={{ width: '100%', height: '100%', overflow: 'visible' }} aria-hidden="true">
    <path d="M-30 12 C-18 4 -10 20 2 12" fill="none" stroke={a} strokeWidth="9" strokeLinecap="round" />
    <path d="M-30 12 C-18 4 -10 20 2 12" fill="none" stroke={c} strokeWidth="6" strokeLinecap="round" />
    <path d="M1 12 C1 5 9 2 19 3 L37 7 L28 12 L37 17 L19 21 C9 22 1 19 1 12Z" fill={c} stroke={a} strokeWidth="2" strokeLinejoin="round" />
    <path d="M22 11 L26 4 L28 10Z M22 13 L26 20 L28 14Z" fill="#ffffff" stroke={a} strokeWidth="1" strokeLinejoin="round" />
    <path d="M28 12 L40 11 L37 12 L40 13Z" fill="#e5405e" />
    <circle cx="13" cy="8" r="2.6" fill="#f6ff7a" stroke={a} strokeWidth="1" />
    <ellipse cx="13.4" cy="8" rx=".7" ry="2" fill="#061006" />
  </svg>
)

export const css = `
@keyframes lggorgonEyeIgnite { 0% { transform: scale(.2); opacity: 0 } 18% { transform: scale(1.5); opacity: 1 } 34% { transform: scale(.9) } 70% { opacity: 1 } 100% { transform: scale(1.3); opacity: 0 } }
@keyframes lggorgonBeam { 0% { transform: rotate(var(--ga)) scaleX(0) scaleY(.4); opacity: 0 } 12% { opacity: 1 } 34% { transform: rotate(var(--ga)) scaleX(1) scaleY(1.5) } 46% { transform: rotate(var(--ga)) scaleX(1) scaleY(.8) } 58% { transform: rotate(var(--ga)) scaleX(1) scaleY(1.2) } 80% { opacity: 1 } 100% { transform: rotate(var(--ga)) scaleX(1.05) scaleY(.2); opacity: 0 } }
@keyframes lggorgonLunge { 0% { transform: translate(0, 0) rotate(var(--r0)) scale(.35); opacity: 0 } 14% { transform: translate(calc(var(--bx) * 1cqw), calc(var(--by) * 1cqw)) rotate(var(--r0)) scale(.6); opacity: 1 }
  55% { transform: translate(calc(var(--x1) * 1cqw), calc(var(--y1) * 1cqw)) rotate(var(--r1)) scale(1.25); opacity: 1 } 70% { transform: translate(calc(var(--x1) * .92cqw), calc(var(--y1) * .92cqw)) rotate(var(--r1)) scale(1.1); opacity: 1 } 100% { transform: translate(calc(var(--x1) * .7cqw), calc(var(--y1) * .7cqw)) rotate(var(--r1)) scale(.9); opacity: 0 } }
@keyframes lggorgonBiteFlash { 0%, 50% { transform: scale(0); opacity: 0 } 58% { transform: scale(1.3); opacity: 1 } 100% { transform: scale(1.8); opacity: 0 } }
.lg-boss[data-phase="3"] .lggorgon-eyeL, .lg-boss[data-phase="3"] .lggorgon-eyeR { top: 47% !important }
.lg-boss[data-phase="3"] .lggorgon-eyeL { left: 47% !important }
.lg-boss[data-phase="3"] .lggorgon-eyeR { left: 53% !important }

/* ---- the drawing itself, per moment ---- */
@keyframes lggorgonRecoil { 0% { transform: none } 12% { transform: translateY(-14%) rotate(-13deg) scale(.88) } 30% { transform: translateY(3%) rotate(7deg) } 55% { transform: rotate(-3deg) } 100% { transform: none } }
@keyframes lggorgonCoilIn { 0% { transform: none } 14% { transform: scale(.78) } 40% { transform: scale(1.12) } 70% { transform: scale(.97) } 100% { transform: none } }
@keyframes lggorgonWingJolt { 0% { transform: none } 14% { transform: scaleX(.94) translateY(2%) } 45% { transform: scaleX(1.03) } 100% { transform: none } }
@keyframes lggorgonBlink { 0%, 8% { transform: none } 16%, 34% { transform: scaleY(.08) } 52% { transform: scaleY(1.15) } 100% { transform: none } }
@keyframes lggorgonWhip { 0% { transform: none } 10% { transform: translate(-16%, -6%) rotate(-24deg) scale(.86) } 26% { transform: translate(6%, 0) rotate(11deg) } 44% { transform: rotate(-6deg) } 66% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lggorgonSplay { 0% { transform: none } 12% { transform: scale(1.4) rotate(-4deg) } 28% { transform: scale(1.26) rotate(4deg) } 50% { transform: scale(.9) } 100% { transform: none } }
@keyframes lggorgonSplitL { 0% { transform: none } 12% { transform: translate(-12%, 2%) rotate(-12deg) } 45% { transform: translate(-4%, 0) rotate(-4deg) } 100% { transform: none } }
@keyframes lggorgonSplitR { 0% { transform: none } 12% { transform: translate(12%, 2%) rotate(12deg) } 45% { transform: translate(4%, 0) rotate(4deg) } 100% { transform: none } }
@keyframes lggorgonSpinHit { 0% { transform: none } 14% { transform: rotate(-38deg) scale(.92) } 40% { transform: rotate(10deg) } 100% { transform: none } }
@keyframes lggorgonSliced { 0% { transform: none } 8% { transform: translateX(10%) rotate(10deg) } 16% { transform: translateX(-10%) rotate(-9deg) } 24% { transform: translateX(7%) rotate(6deg) } 32% { transform: translateX(-4%) rotate(-3deg) } 60% { transform: translateY(4%) } 100% { transform: none } }
@keyframes lggorgonHoodCut { 0% { transform: none } 10% { transform: scaleX(1.3) } 22% { transform: scaleX(.82) scaleY(.94) } 45% { transform: scaleX(1.05) } 100% { transform: none } }
@keyframes lggorgonShed { 0% { transform: none } 12% { transform: translateY(-2%) rotate(-3deg) } 40% { transform: translateY(4%) rotate(2deg) scaleY(.95) } 100% { transform: none } }
@keyframes lggorgonLash { 0% { transform: none } 14% { transform: scale(.84) translateY(-8%) } 40% { transform: scale(1.38) translateY(10%) } 58% { transform: scale(1.22) translateY(6%) } 100% { transform: none } }
@keyframes lggorgonFlare { 0% { transform: none } 16% { transform: scaleX(.86) } 40% { transform: scaleX(1.28) scaleY(1.06) } 70% { transform: scaleX(1.12) } 100% { transform: none } }
@keyframes lggorgonFlareBig { 0% { transform: none } 14% { transform: scaleX(.86) scaleY(.96) } 38% { transform: scaleX(1.34) scaleY(1.1) translateY(-3%) } 70% { transform: scaleX(1.2) scaleY(1.05) } 100% { transform: none } }
@keyframes lggorgonVolley { 0% { transform: none } 14% { transform: scale(.82) translateY(-5%) } 36% { transform: scale(1.36) translateY(8%) } 56% { transform: scale(1.2) translateY(5%) } 100% { transform: none } }
@keyframes lggorgonArmSlamR { 0% { transform: none } 18% { transform: rotate(-24deg) } 40% { transform: rotate(38deg) translateY(4%) } 62% { transform: rotate(30deg) translateY(3%) } 100% { transform: none } }
@keyframes lggorgonArmSlamL { 0% { transform: none } 18% { transform: rotate(18deg) } 40% { transform: rotate(-30deg) translateX(-4%) } 62% { transform: rotate(-22deg) } 100% { transform: none } }
@keyframes lggorgonKnotTwist { 0% { transform: none } 16% { transform: rotate(-14deg) scale(.94) } 40% { transform: rotate(28deg) scale(1.08) } 100% { transform: none } }
@keyframes lggorgonHeadsOut { 0% { transform: none } 16% { transform: scale(.88) } 40% { transform: scale(1.3) } 66% { transform: scale(1.14) } 100% { transform: none } }
@keyframes lggorgonTurnAway { 0% { transform: none } 12% { transform: translateX(14%) rotate(20deg) scaleX(.8) } 50% { transform: translateX(10%) rotate(15deg) scaleX(.84) } 100% { transform: none } }
@keyframes lggorgonSquint { 0%, 6% { transform: none } 14%, 55% { transform: scaleY(.25) scaleX(1.1) } 100% { transform: none } }
@keyframes lggorgonFold { 0% { transform: none } 14% { transform: scaleX(.72) } 55% { transform: scaleX(.8) } 100% { transform: none } }
@keyframes lggorgonGlance { 0% { transform: none } 14% { transform: rotate(-26deg) scale(.82) } 50% { transform: rotate(-18deg) scale(.86) } 100% { transform: none } }
@keyframes lggorgonBounce { 0% { transform: none } 22% { transform: scale(1.32) translateY(10%) } 32% { transform: scale(.8) translateY(-10%) } 50% { transform: scale(.92) translateY(-3%) } 100% { transform: none } }
@keyframes lggorgonClamp { 0% { transform: none } 20% { transform: scaleY(1.5) } 32% { transform: scaleY(.3) } 60% { transform: scaleY(.6) } 100% { transform: none } }
@keyframes lggorgonRebound { 0% { transform: none } 22% { transform: scale(1.12) } 34% { transform: scale(.82) } 100% { transform: none } }
@keyframes lggorgonHiss { 0% { transform: none } 18% { transform: scaleY(2.4) scaleX(1.1) } 70% { transform: scaleY(2.1) } 100% { transform: none } }
@keyframes lggorgonWrithe { 0%, 100% { transform: none } 12% { transform: rotate(-10deg) } 26% { transform: rotate(9deg) } 40% { transform: rotate(-8deg) } 54% { transform: rotate(7deg) } 68% { transform: rotate(-4deg) } 82% { transform: rotate(2deg) } }
@keyframes lggorgonSnarl { 0% { transform: none } 18% { transform: translateY(-3%) scale(1.04) } 60% { transform: translateY(-2%) scale(1.03) } 100% { transform: none } }
@keyframes lggorgonGlower { 0%, 100% { transform: none } 20% { transform: scaleY(.55) } 60% { transform: scaleY(.6) } }

.lg-boss[data-motif="gorgon"][data-moment="hit"] .lg-gorgon-face, .lg-boss[data-motif="gorgon"][data-moment="hit"] .lg-gorgon-face2 { animation: lggorgonRecoil 520ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="gorgon"][data-moment="hit"] .lg-gorgon-crown { animation: lggorgonCoilIn 520ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="hit"] .lg-gorgon-wings { animation: lggorgonWingJolt 480ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="hit"] .lg-gorgon-eye3 { animation: lggorgonBlink 520ms ease-out both }

.lg-boss[data-motif="gorgon"][data-moment="crit"] .lg-gorgon-face { animation: lggorgonWhip 700ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="gorgon"][data-moment="crit"] .lg-gorgon-eye { animation: lggorgonBlink 640ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="crit"] .lg-gorgon-crown, .lg-boss[data-motif="gorgon"][data-moment="crit"] .lg-gorgon-front { animation: lggorgonSplay 680ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="gorgon"][data-moment="crit"] .lg-gorgon-halfL { animation: lggorgonSplitL 700ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="gorgon"][data-moment="crit"] .lg-gorgon-halfR { animation: lggorgonSplitR 700ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="gorgon"][data-moment="crit"] .lg-gorgon-face2 { animation: lggorgonWhip 700ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="gorgon"][data-moment="crit"] .lg-gorgon-eye3 { animation: lggorgonBlink 640ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="crit"] .lg-gorgon-knot3 { animation: lggorgonSpinHit 700ms cubic-bezier(.2,.8,.3,1) both }

.lg-boss[data-motif="gorgon"][data-moment="sharpen"] .lg-gorgon-face, .lg-boss[data-motif="gorgon"][data-moment="sharpen"] .lg-gorgon-face2 { animation: lggorgonSliced 640ms linear both }
.lg-boss[data-motif="gorgon"][data-moment="sharpen"] .lg-gorgon-hood { animation: lggorgonHoodCut 600ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="gorgon"][data-moment="sharpen"] .lg-gorgon-wings { animation: lggorgonShed 640ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="sharpen"] .lg-gorgon-eye3 { animation: lggorgonSliced 640ms linear both }
.lg-boss[data-motif="gorgon"][data-moment="sharpen"] .lg-gorgon-heads3 { animation: lggorgonCoilIn 600ms ease-out both }

.lg-boss[data-motif="gorgon"][data-moment="hurt"] .lg-gorgon-crown { animation: lggorgonLash 620ms cubic-bezier(.3,0,.2,1) both }
.lg-boss[data-motif="gorgon"][data-moment="hurt"] .lg-gorgon-hood, .lg-boss[data-motif="gorgon"][data-moment="hurt"] .lg-gorgon-wings { animation: lggorgonFlare 620ms cubic-bezier(.3,0,.2,1) both }
.lg-boss[data-motif="gorgon"][data-moment="hurt"] .lg-gorgon-heads3 { animation: lggorgonLash 620ms cubic-bezier(.3,0,.2,1) both }

.lg-boss[data-motif="gorgon"][data-moment="hurtBig"] .lg-gorgon-wings, .lg-boss[data-motif="gorgon"][data-moment="hurtBig"] .lg-gorgon-hood { animation: lggorgonFlareBig 820ms cubic-bezier(.3,0,.2,1) both }
.lg-boss[data-motif="gorgon"][data-moment="hurtBig"] .lg-gorgon-crown, .lg-boss[data-motif="gorgon"][data-moment="hurtBig"] .lg-gorgon-front { animation: lggorgonVolley 820ms cubic-bezier(.3,0,.2,1) both }
.lg-boss[data-motif="gorgon"][data-moment="hurtBig"] .lg-gorgon-armR { animation: lggorgonArmSlamR 820ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="gorgon"][data-moment="hurtBig"] .lg-gorgon-armL { animation: lggorgonArmSlamL 820ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="gorgon"][data-moment="hurtBig"] .lg-gorgon-knot3 { animation: lggorgonKnotTwist 820ms cubic-bezier(.3,0,.2,1) both }
.lg-boss[data-motif="gorgon"][data-moment="hurtBig"] .lg-gorgon-heads3 { animation: lggorgonHeadsOut 820ms cubic-bezier(.3,0,.2,1) both }

.lg-boss[data-motif="gorgon"][data-moment="block"] .lg-gorgon-face, .lg-boss[data-motif="gorgon"][data-moment="block"] .lg-gorgon-face2 { animation: lggorgonTurnAway 640ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="gorgon"][data-moment="block"] .lg-gorgon-eye, .lg-boss[data-motif="gorgon"][data-moment="block"] .lg-gorgon-eye3 { animation: lggorgonSquint 640ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="block"] .lg-gorgon-hood, .lg-boss[data-motif="gorgon"][data-moment="block"] .lg-gorgon-wings { animation: lggorgonFold 640ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="block"] .lg-gorgon-knot3 { animation: lggorgonGlance 640ms ease-out both }

.lg-boss[data-motif="gorgon"][data-moment="shield"] .lg-gorgon-front, .lg-boss[data-motif="gorgon"][data-moment="shield"] .lg-gorgon-crown { animation: lggorgonBounce 680ms cubic-bezier(.3,0,.2,1) both }
.lg-boss[data-motif="gorgon"][data-moment="shield"] .lg-gorgon-maw { animation: lggorgonClamp 680ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="shield"] .lg-gorgon-face, .lg-boss[data-motif="gorgon"][data-moment="shield"] .lg-gorgon-face2, .lg-boss[data-motif="gorgon"][data-moment="shield"] .lg-gorgon-eye3 { animation: lggorgonRebound 680ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="shield"] .lg-gorgon-heads3 { animation: lggorgonBounce 680ms cubic-bezier(.3,0,.2,1) both }

.lg-boss[data-motif="gorgon"][data-moment="wind"] .lg-gorgon-maw { animation: lggorgonHiss 900ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="wind"] .lg-gorgon-crown, .lg-boss[data-motif="gorgon"][data-moment="wind"] .lg-gorgon-front, .lg-boss[data-motif="gorgon"][data-moment="wind"] .lg-gorgon-heads3 { animation: lggorgonWrithe 900ms ease-in-out both }
.lg-boss[data-motif="gorgon"][data-moment="wind"] .lg-gorgon-face, .lg-boss[data-motif="gorgon"][data-moment="wind"] .lg-gorgon-face2 { animation: lggorgonSnarl 900ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="wind"] .lg-gorgon-eye, .lg-boss[data-motif="gorgon"][data-moment="wind"] .lg-gorgon-eye3 { animation: lggorgonGlower 900ms ease-in-out both }

`

export default {
  // Her gaze: both eyes ignite, then twin petrifying rays lance out toward your hearts (the one great eye in phase 3).
  gorgonGlare: (p, ctx) => {
    const c = p.color || ctx.color
    const w = (p.width || 3.6) * ctx.scale
    const ang = p.angle ?? 12
    return EYES.flatMap((x, i) => {
      const side = i ? 'lggorgon-eyeR' : 'lggorgon-eyeL'
      return [
        <div key={`ge${i}`} className={side} style={{ position: 'absolute', left: `${x}%`, top: '33%', width: '11cqw', height: '11cqw', margin: '-5.5cqw 0 0 -5.5cqw', borderRadius: '50%',
          background: `radial-gradient(circle, #ffffff 0 20%, ${c} 42%, ${c}00 70%)`, animation: `lggorgonEyeIgnite ${720 * ctx.speed}ms ease-out ${i * 25}ms both` }} />,
        <div key={`gb${i}`} className={side} style={{ position: 'absolute', left: `${x}%`, top: '33%', width: `${p.reach || 120}cqw`, height: `${w}cqw`, marginTop: `${-w / 2}cqw`, transformOrigin: '0 50%',
          '--ga': `${ang - i * 5}deg`, borderRadius: '2cqw', background: `linear-gradient(90deg, #ffffff, ${c} 14%, ${c} 72%, ${c}00)`, boxShadow: `0 0 2.5cqw ${c}, 0 0 1px #000`,
          animation: `lggorgonBeam ${660 * ctx.speed}ms cubic-bezier(.2,.9,.3,1) ${110 + i * 30}ms both` }} />,
      ]
    })
  },
  // Her crown of snakes strikes: a volley of snake heads lunges out of her hair toward you, jaws open, and bites.
  gorgonFangs: (p, ctx) => {
    const n = p.n || 5
    const c = p.color || ctx.color
    return Array.from({ length: n }, (_, i) => {
      const k = n > 1 ? i / (n - 1) : 0.5
      const y1 = -22 + k * 52
      const x1 = 42 + (i % 2) * 14
      const r = Math.round((Math.atan2(y1, x1) * 180) / Math.PI)
      return (
        <div key={`gf${i}`} style={{ position: 'absolute', left: '50%', top: '24%', width: `${22 * Math.sqrt(ctx.scale)}cqw`, height: `${13 * Math.sqrt(ctx.scale)}cqw`, marginLeft: '-11cqw', marginTop: '-6.5cqw',
          '--bx': -6 + k * 12, '--by': -8, '--x1': x1, '--y1': y1, '--r0': `${r - 40}deg`, '--r1': `${r}deg`, filter: `drop-shadow(0 0 1.2cqw ${c})`,
          animation: `lggorgonLunge ${720 * ctx.speed}ms cubic-bezier(.5,0,.25,1) ${i * 45}ms both` }}>
          {SNAKE(c, ctx.accent)}
          <div style={{ position: 'absolute', right: '-30%', top: '-30%', width: '80%', height: '160%', borderRadius: '50%', background: 'radial-gradient(circle, #ffffff 0 18%, #f6ff7a 38%, transparent 66%)',
            animation: `lggorgonBiteFlash ${720 * ctx.speed}ms ease-out ${i * 45}ms both` }} />
        </div>
      )
    })
  },
}
