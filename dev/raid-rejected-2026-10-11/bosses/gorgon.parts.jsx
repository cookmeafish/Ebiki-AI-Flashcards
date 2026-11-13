// GORGON's own impact parts: drawers merged into impact/parts.jsx PARTS. Name each `gorgon<Name>` (never clashes).
// A drawer is (params, ctx) => node, like the shared ones (ctx: color, accent, glyph, scale, speed); CSS keyframes it
// needs go in `css` (prefix them lggorgon). Deterministic, container units, transforms and opacity only.
//
// THE DRAWING ACTS TOO: raids/gorgon.svg carries lg-gorgon-* parts (face = her head with its hair, eye, maw, crown and
// halfL/halfR = the snake banks, veil, armL/armR, beams; phase 3 hood, heads3 = the rim heads, eye3 = the great eye). The
// `css` below moves them per moment (the arena's data-moment). Their pivots, her attack on the player (data-assault-on),
// her ability's reactions and the knockout are in fx/gorgon.jsx, whose CSS is on the page for the whole raid.

// Where her eyes are in the box (phase 1 and 2 two eyes, phase 3 the one great eye: css below moves them there).
const EYES = [41, 59]

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
.lg-boss[data-phase="3"] .lggorgon-eyeL, .lg-boss[data-phase="3"] .lggorgon-eyeR { top: 3% !important }
.lg-boss[data-phase="3"] .lggorgon-eyeL { left: 48% !important }
.lg-boss[data-phase="3"] .lggorgon-eyeR { left: 52% !important }

/* THE DRAWING ACTS (raids/gorgon.svg, redrawn 2026-10-11). Its parts and pivots are set in fx/gorgon.jsx (on the page
   for the whole raid). Heads only TILT on the chin (the joint check), the snakes lash from their roots, the arms swing
   from the shoulder. Phase 1 the veiled queen (veil, closed eyes, sleeping locks, the hush arm), phase 2 the gaze (open
   eyes, beams, the reared fan in three banks, arms flung wide), phase 3 the marble goddess (hood, rim heads, great eye). */
@keyframes lggorgonRecoil { 0% { transform: none } 14% { transform: rotate(calc(-9deg * var(--gf, 1))) scale(calc(1 + -0.04 * var(--gf, 1))) } 34% { transform: rotate(calc(5deg * var(--gf, 1))) } 60% { transform: rotate(calc(-2deg * var(--gf, 1))) } 100% { transform: none } }
@keyframes lggorgonWhip { 0% { transform: none } 10% { transform: rotate(calc(-15deg * var(--gf, 1))) scale(calc(1 + -0.05 * var(--gf, 1))) } 26% { transform: rotate(calc(9deg * var(--gf, 1))) } 46% { transform: rotate(calc(-5deg * var(--gf, 1))) } 68% { transform: rotate(calc(2deg * var(--gf, 1))) } 100% { transform: none } }
@keyframes lggorgonShudder { 0% { transform: none } 8% { transform: rotate(calc(6deg * var(--gf, 1))) } 16% { transform: rotate(calc(-6deg * var(--gf, 1))) } 24% { transform: rotate(calc(4deg * var(--gf, 1))) } 32% { transform: rotate(calc(-3deg * var(--gf, 1))) } 50% { transform: rotate(calc(1deg * var(--gf, 1))) } 100% { transform: none } }
@keyframes lggorgonTurnAway { 0% { transform: none } 14% { transform: rotate(calc(14deg * var(--gf, 1))) scale(calc(1 + -0.03 * var(--gf, 1))) } 55% { transform: rotate(calc(11deg * var(--gf, 1))) scale(calc(1 + -0.03 * var(--gf, 1))) } 100% { transform: none } }
@keyframes lggorgonRebound { 0% { transform: none } 22% { transform: rotate(calc(-4deg * var(--gf, 1))) scale(calc(1 + 0.05 * var(--gf, 1))) } 40% { transform: rotate(calc(2deg * var(--gf, 1))) scale(calc(1 + -0.03 * var(--gf, 1))) } 100% { transform: none } }
@keyframes lggorgonSnarl { 0% { transform: none } 18% { transform: rotate(calc(-4deg * var(--gf, 1))) scale(calc(1 + 0.05 * var(--gf, 1))) } 60% { transform: rotate(calc(-3deg * var(--gf, 1))) scale(calc(1 + 0.04 * var(--gf, 1))) } 100% { transform: none } }
@keyframes lggorgonBlink { 0%, 8% { transform: none } 16%, 34% { transform: scaleY(.08) } 52% { transform: scaleY(1.15) } 100% { transform: none } }
@keyframes lggorgonSquint { 0%, 6% { transform: none } 14%, 55% { transform: scaleY(.25) scaleX(1.1) } 100% { transform: none } }
@keyframes lggorgonGlower { 0%, 100% { transform: none } 20% { transform: scaleY(.55) } 60% { transform: scaleY(.6) } }
@keyframes lggorgonWide { 0% { transform: none } 20% { transform: scale(1.35) } 60% { transform: scale(1.25) } 100% { transform: none } }
@keyframes lggorgonHiss { 0% { transform: none } 18% { transform: scaleY(1.7) scaleX(1.1) } 70% { transform: scaleY(1.5) } 100% { transform: none } }
@keyframes lggorgonClamp { 0% { transform: none } 20% { transform: scaleY(1.4) } 32% { transform: scaleY(.4) } 60% { transform: scaleY(.7) } 100% { transform: none } }
@keyframes lggorgonCoilIn { 0% { transform: none } 14% { transform: scale(calc(1 + -0.12 * var(--gg, 1))) } 40% { transform: scale(calc(1 + 0.06 * var(--gg, 1))) } 100% { transform: none } }
@keyframes lggorgonLash { 0% { transform: none } 14% { transform: rotate(calc(-7deg * var(--gg, 1))) } 34% { transform: rotate(calc(6deg * var(--gg, 1))) } 54% { transform: rotate(calc(-3deg * var(--gg, 1))) } 100% { transform: none } }
@keyframes lggorgonSplay { 0% { transform: none } 12% { transform: scale(calc(1 + 0.12 * var(--gg, 1))) } 30% { transform: scale(calc(1 + 0.06 * var(--gg, 1))) } 55% { transform: scale(calc(1 + -0.03 * var(--gg, 1))) } 100% { transform: none } }
@keyframes lggorgonSplitL { 0% { transform: none } 12% { transform: rotate(calc(-12deg * var(--gg, 1))) } 40% { transform: rotate(calc(-4deg * var(--gg, 1))) } 100% { transform: none } }
@keyframes lggorgonSplitR { 0% { transform: none } 12% { transform: rotate(calc(12deg * var(--gg, 1))) } 40% { transform: rotate(calc(4deg * var(--gg, 1))) } 100% { transform: none } }
@keyframes lggorgonWrithe { 0%, 100% { transform: none } 12% { transform: rotate(calc(-6deg * var(--gg, 1))) } 26% { transform: rotate(calc(5deg * var(--gg, 1))) } 40% { transform: rotate(calc(-5deg * var(--gg, 1))) } 54% { transform: rotate(calc(4deg * var(--gg, 1))) } 68% { transform: rotate(calc(-2deg * var(--gg, 1))) } }
@keyframes lggorgonFlare { 0% { transform: none } 16% { transform: scaleX(calc(1 + -0.06 * var(--gg, 1))) } 40% { transform: scaleX(calc(1 + 0.08 * var(--gg, 1))) scaleY(calc(1 + 0.03 * var(--gg, 1))) } 100% { transform: none } }
@keyframes lggorgonFold { 0% { transform: none } 14% { transform: scaleX(calc(1 + -0.1 * var(--gg, 1))) } 55% { transform: scaleX(calc(1 + -0.07 * var(--gg, 1))) } 100% { transform: none } }
@keyframes lggorgonRingTwist { 0% { transform: none } 14% { transform: rotate(calc(-6deg * var(--gg, 1))) } 40% { transform: rotate(calc(5deg * var(--gg, 1))) } 70% { transform: rotate(calc(-2deg * var(--gg, 1))) } 100% { transform: none } }
@keyframes lggorgonArmFlinchL { 0% { transform: none } 16% { transform: rotate(-10deg) } 45% { transform: rotate(4deg) } 100% { transform: none } }
@keyframes lggorgonArmFlinchR { 0% { transform: none } 16% { transform: rotate(10deg) } 45% { transform: rotate(-4deg) } 100% { transform: none } }
@keyframes lggorgonArmSlamL { 0% { transform: none } 18% { transform: rotate(14deg) } 40% { transform: rotate(-18deg) } 62% { transform: rotate(-12deg) } 100% { transform: none } }
@keyframes lggorgonArmSlamR { 0% { transform: none } 18% { transform: rotate(-14deg) } 40% { transform: rotate(18deg) } 62% { transform: rotate(12deg) } 100% { transform: none } }
@keyframes lggorgonVeilLift { 0% { transform: none } 22% { transform: translateY(-8%) rotate(-3deg) } 60% { transform: translateY(-6%) rotate(2deg) } 100% { transform: none } }
@keyframes lggorgonBeamFlare { 0% { filter: none } 20% { filter: brightness(1.8) } 60% { filter: brightness(1.3) } 100% { filter: none } }
@keyframes lggorgonBeamCut { 0% { transform: none; opacity: 1 } 12% { transform: scaleX(.3); opacity: .2 } 50% { transform: scaleX(.6); opacity: .7 } 100% { transform: none; opacity: 1 } }

/* hit: she recoils, the snakes coil in, the arm flinches */
.lg-boss[data-motif="gorgon"][data-moment="hit"] .lg-gorgon-face { animation: lggorgonRecoil 520ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="gorgon"][data-moment="hit"] :is(.lg-gorgon-crown, .lg-gorgon-halfL, .lg-gorgon-halfR, .lg-gorgon-heads3) { animation: lggorgonCoilIn 520ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="hit"] .lg-gorgon-armL { animation: lggorgonArmFlinchL 520ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="hit"] .lg-gorgon-armR { animation: lggorgonArmFlinchR 520ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="hit"] .lg-gorgon-eye3 { animation: lggorgonBlink 520ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="hit"] .lg-gorgon-beams { animation: lggorgonBeamCut 520ms ease-out both }
/* crit: her head whips, the eyes blink shut, the banks of snakes fly apart, the hood jolts */
.lg-boss[data-motif="gorgon"][data-moment="crit"] .lg-gorgon-face { animation: lggorgonWhip 700ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="gorgon"][data-moment="crit"] :is(.lg-gorgon-eye, .lg-gorgon-eye3) { animation: lggorgonBlink 640ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="crit"] :is(.lg-gorgon-crown, .lg-gorgon-heads3) { animation: lggorgonSplay 680ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="gorgon"][data-moment="crit"] .lg-gorgon-halfL { animation: lggorgonSplitL 700ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="gorgon"][data-moment="crit"] .lg-gorgon-halfR { animation: lggorgonSplitR 700ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="gorgon"][data-moment="crit"] .lg-gorgon-hood { animation: lggorgonFold 700ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="crit"] .lg-gorgon-beams { animation: lggorgonBeamCut 700ms ease-out both }
/* sharpen: a shudder through her, the veil flutters, the hood flinches */
.lg-boss[data-motif="gorgon"][data-moment="sharpen"] .lg-gorgon-face { animation: lggorgonShudder 640ms linear both }
.lg-boss[data-motif="gorgon"][data-moment="sharpen"] .lg-gorgon-veil { animation: lggorgonVeilLift 640ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="sharpen"] .lg-gorgon-hood { animation: lggorgonFold 600ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="sharpen"] :is(.lg-gorgon-crown, .lg-gorgon-halfL, .lg-gorgon-halfR) { animation: lggorgonLash 600ms ease-out both }
/* hurt (her strike): the snakes lash at you, she snarls, the hood flares, the great eye goes wide */
.lg-boss[data-motif="gorgon"][data-moment="hurt"] :is(.lg-gorgon-crown, .lg-gorgon-halfL, .lg-gorgon-halfR) { animation: lggorgonLash 620ms cubic-bezier(.3,0,.2,1) both }
.lg-boss[data-motif="gorgon"][data-moment="hurt"] .lg-gorgon-face { animation: lggorgonSnarl 620ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="hurt"] .lg-gorgon-maw { animation: lggorgonHiss 620ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="hurt"] .lg-gorgon-hood { animation: lggorgonFlare 620ms cubic-bezier(.3,0,.2,1) both }
.lg-boss[data-motif="gorgon"][data-moment="hurt"] :is(.lg-gorgon-eye, .lg-gorgon-eye3) { animation: lggorgonWide 620ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="hurt"] .lg-gorgon-beams { animation: lggorgonBeamFlare 620ms ease-out both }
/* hurtBig (her heavy blow): arms slam, every snake lashes, the rim heads twist round the hood */
.lg-boss[data-motif="gorgon"][data-moment="hurtBig"] .lg-gorgon-armL { animation: lggorgonArmSlamL 820ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="gorgon"][data-moment="hurtBig"] .lg-gorgon-armR { animation: lggorgonArmSlamR 820ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="gorgon"][data-moment="hurtBig"] :is(.lg-gorgon-crown, .lg-gorgon-halfL, .lg-gorgon-halfR) { animation: lggorgonWrithe 820ms ease-in-out both }
.lg-boss[data-motif="gorgon"][data-moment="hurtBig"] .lg-gorgon-face { animation: lggorgonSnarl 820ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="hurtBig"] .lg-gorgon-maw { animation: lggorgonHiss 820ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="hurtBig"] .lg-gorgon-heads3 { animation: lggorgonRingTwist 820ms cubic-bezier(.3,0,.2,1) both }
.lg-boss[data-motif="gorgon"][data-moment="hurtBig"] .lg-gorgon-hood { animation: lggorgonFlare 820ms cubic-bezier(.3,0,.2,1) both }
.lg-boss[data-motif="gorgon"][data-moment="hurtBig"] .lg-gorgon-beams { animation: lggorgonBeamFlare 820ms ease-out both }
/* block: she turns her face away and squints, the hood folds */
.lg-boss[data-motif="gorgon"][data-moment="block"] .lg-gorgon-face { animation: lggorgonTurnAway 640ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="gorgon"][data-moment="block"] :is(.lg-gorgon-eye, .lg-gorgon-eye3) { animation: lggorgonSquint 640ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="block"] .lg-gorgon-hood { animation: lggorgonFold 640ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="block"] .lg-gorgon-beams { animation: lggorgonBeamCut 640ms ease-out both }
/* shield: her bite snaps shut on the bubble, she rebounds */
.lg-boss[data-motif="gorgon"][data-moment="shield"] .lg-gorgon-maw { animation: lggorgonClamp 680ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="shield"] .lg-gorgon-face { animation: lggorgonRebound 680ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="shield"] :is(.lg-gorgon-crown, .lg-gorgon-halfL, .lg-gorgon-halfR, .lg-gorgon-heads3) { animation: lggorgonCoilIn 680ms cubic-bezier(.3,0,.2,1) both }
.lg-boss[data-motif="gorgon"][data-moment="shield"] .lg-gorgon-eye3 { animation: lggorgonBlink 680ms ease-out both }
/* wind (your second wind): she hisses, the snakes writhe, her eyes glower */
.lg-boss[data-motif="gorgon"][data-moment="wind"] .lg-gorgon-maw { animation: lggorgonHiss 900ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="wind"] :is(.lg-gorgon-crown, .lg-gorgon-halfL, .lg-gorgon-halfR, .lg-gorgon-heads3) { animation: lggorgonWrithe 900ms ease-in-out both }
.lg-boss[data-motif="gorgon"][data-moment="wind"] .lg-gorgon-face { animation: lggorgonSnarl 900ms ease-out both }
.lg-boss[data-motif="gorgon"][data-moment="wind"] :is(.lg-gorgon-eye, .lg-gorgon-eye3) { animation: lggorgonGlower 900ms ease-in-out both }
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
