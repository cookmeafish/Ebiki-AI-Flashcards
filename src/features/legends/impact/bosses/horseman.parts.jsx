// HORSEMAN's own impact parts: drawers merged into impact/parts.jsx PARTS. Name each `horseman<Name>` (never clashes).
// A drawer is (params, ctx) => node, like the shared ones (ctx: color, accent, glyph, scale, speed); CSS keyframes it
// needs go in `css` (prefix them lghorseman). Deterministic, container units, transforms and opacity only.
// His own drawing acts every moment from fx/horseman.jsx (that CSS is on the page all raid long: his attack lands on
// ability blows too, and the fallen pose holds after the knockout).
//   horsemanHurl     his strike: the jack-o'-lantern hurled out of the box at your hearts, spinning, a fire trail behind
//   horsemanHooves   his heavy blow: two great iron-shod hooves stamp down at the camera, sparks off the shoes
//   horsemanShatter  the knockout's climax: the lantern head cracks in two and the halves fall apart, seeds flying
//   horsemanWisp     the knockout's last breath: the soulfire leaves the collar as one small green wisp and goes out

const PUMP = '#f0781c'
const PUMP_DK = '#b2470b'
const GLOW = '#ffe07a'
const INK = '#1d2230'
const SOUL = '#6dff9c'
const SOUL_HI = '#e2ffe6'
const IRON = '#9aa3b8'

// the carved head as a small inline SVG (the same face as the art: slanted eyes, a jagged grin)
const Head = ({ blaze = 1 }) => (
  <svg viewBox="-14 -14 28 28" width="100%" height="100%" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
    <path d="M0 -9C7 -10 13 -6 13 1C13 8 7 11 0 11C-7 11 -13 8 -13 1C-13 -6 -7 -10 0 -9Z" fill={PUMP} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M-5 -8.4C-7 -3 -7 5 -5 10.4M5 -8.4C7 -3 7 5 5 10.4" fill="none" stroke={PUMP_DK} strokeWidth="1" />
    <path d="M-1.4 -9C-1.8 -11.6 -0.8 -13.2 1 -13.6L1.6 -12.4C0.6 -11.8 0.4 -10.4 0.8 -9Z" fill="#4b3a1c" stroke={INK} strokeWidth=".8" />
    <path d="M-8.4 -3.4L-2.4 -1.2L-6 2.4ZM8.4 -3.4L2.4 -1.2L6 2.4ZM-8.6 4.4L-6 5.4L-5 4.4L-3.4 5.8L-1.6 5L0.2 6L2.2 5L3.8 5.8L5.2 4.6L8.6 4C7.6 7.8 4.2 9.4 0 9.4C-4.2 9.4 -7.4 7.8 -8.6 4.4Z" fill={blaze > 1 ? '#fff6c8' : GLOW} stroke="#7c2c06" strokeWidth=".9" strokeLinejoin="round" />
  </svg>
)

export const css = `
@keyframes lghorsemanHurl { 0% { transform: translate(-50%, -50%) translate(0, -6cqw) rotate(0) scale(.5); opacity: 0 } 10% { opacity: 1 }
  55% { transform: translate(-50%, -50%) translate(26cqw, 30cqw) rotate(-400deg) scale(1.5) } 70% { transform: translate(-50%, -50%) translate(36cqw, 40cqw) rotate(-560deg) scale(1.9); opacity: 1 }
  100% { transform: translate(-50%, -50%) translate(40cqw, 46cqw) rotate(-640deg) scale(2.2); opacity: 0 } }
@keyframes lghorsemanTrail { 0% { stroke-dashoffset: var(--len); opacity: .95 } 60% { stroke-dashoffset: 0; opacity: .85 } 100% { stroke-dashoffset: 0; opacity: 0 } }
@keyframes lghorsemanStomp { 0% { transform: translate(-50%, -70%) scale(.4) rotate(var(--r)); opacity: 0 } 30% { transform: translate(-50%, -50%) scale(1.25) rotate(var(--r)); opacity: 1 }
  42% { transform: translate(-50%, -48%) scale(1.05, .9) rotate(var(--r)) } 80% { transform: translate(-50%, -48%) scale(1) rotate(var(--r)); opacity: 1 } 100% { transform: translate(-50%, -46%) scale(1) rotate(var(--r)); opacity: 0 } }
@keyframes lghorsemanSpark { 0% { transform: translate(-50%, -50%) rotate(var(--a)) translateY(0) scale(1); opacity: 1 } 100% { transform: translate(-50%, -50%) rotate(var(--a)) translateY(-18cqw) scale(.3); opacity: 0 } }
@keyframes lghorsemanHalfL { 0% { transform: translate(-50%, -50%) rotate(0); opacity: 1 } 18% { transform: translate(-56%, -50%) rotate(-8deg) } 100% { transform: translate(-50%, -50%) translate(-18cqw, 28cqw) rotate(-120deg); opacity: 0 } }
@keyframes lghorsemanHalfR { 0% { transform: translate(-50%, -50%) rotate(0); opacity: 1 } 18% { transform: translate(-44%, -50%) rotate(8deg) } 100% { transform: translate(-50%, -50%) translate(18cqw, 30cqw) rotate(130deg); opacity: 0 } }
@keyframes lghorsemanCrackOpen { 0% { transform: translate(-50%, -50%) scale(.6); opacity: 0 } 30% { transform: translate(-50%, -50%) scale(1.1); opacity: 1 } 100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0 } }
@keyframes lghorsemanSeed { 0% { transform: translate(-50%, -50%) rotate(var(--a)) translateY(0) rotate(0); opacity: 1 } 100% { transform: translate(-50%, -50%) rotate(var(--a)) translateY(var(--d)) rotate(220deg); opacity: 0 } }
@keyframes lghorsemanWisp { 0% { transform: translate(-50%, -50%) translate(0, 0) scale(1); opacity: 0 } 15% { opacity: 1 } 50% { transform: translate(-50%, -50%) translate(3cqw, -16cqw) scale(.8) } 80% { transform: translate(-50%, -50%) translate(-2cqw, -28cqw) scale(.45); opacity: .8 } 100% { transform: translate(-50%, -50%) translate(0, -34cqw) scale(.1); opacity: 0 } }
`

export default {
  // His strike: the lantern head hurled spinning out of the box at your hearts, a fire trail behind it.
  horsemanHurl: (p, ctx) => {
    const ms = 720 * ctx.speed
    const w = 18 * ctx.scale
    return [
      <svg key="tr" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', left: '-10%', top: '-10%', width: '130%', height: '130%', overflow: 'visible' }} aria-hidden="true">
        <path d="M52 40C62 52 72 66 92 86" fill="none" stroke={ctx.color} strokeWidth={5 * ctx.scale} strokeLinecap="round" opacity=".5"
          style={{ '--len': 70, strokeDasharray: 70, strokeDashoffset: 70, animation: `lghorsemanTrail ${ms}ms ease-out both`, filter: `drop-shadow(0 0 2px ${ctx.color})` }} />
        <path d="M52 40C62 52 72 66 92 86" fill="none" stroke={GLOW} strokeWidth={1.8 * ctx.scale} strokeLinecap="round"
          style={{ '--len': 70, strokeDasharray: 70, strokeDashoffset: 70, animation: `lghorsemanTrail ${ms}ms ease-out both` }} />
      </svg>,
      <div key="hd" style={{ position: 'absolute', left: '50%', top: '42%', width: `${w}cqw`, height: `${w}cqw`, animation: `lghorsemanHurl ${ms}ms cubic-bezier(.35,.5,.6,1) both`, filter: `drop-shadow(0 0 1.6cqw ${ctx.color})` }}><Head blaze={2} /></div>,
    ]
  },
  // His heavy blow: two great iron-shod hooves stamp down at the camera; sparks fly off the shoes.
  horsemanHooves: (p, ctx) => {
    const ms = 760 * ctx.speed
    const hoof = (x, r, delay, key) => (
      <div key={key} style={{ position: 'absolute', left: `${x}%`, top: '64%', width: `${30 * ctx.scale}cqw`, height: `${26 * ctx.scale}cqw`, '--r': `${r}deg`, filter: `drop-shadow(0 0 1.4cqw ${PUMP})`, animation: `lghorsemanStomp ${ms}ms cubic-bezier(.3,1.4,.5,1) ${delay}ms both` }}>
        <svg viewBox="0 0 24 20" width="100%" height="100%" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
          <path d="M-2 12C4 9 20 9 26 12L25 21C17 24 7 24 -1 21Z" fill={PUMP} opacity=".55" />
          <path d="M3 2C7 0 17 0 21 2L23 14C17 17 7 17 1 14Z" fill="#4a4f66" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M4 3C6 2 9 1.6 11 1.6L10 12C7 12 5 11.4 3 10.6Z" fill={IRON} opacity=".7" />
          <path d="M14 2C16.6 2.2 19 2.6 20.4 3.2L21.6 12.2C19.6 12.8 17.4 13 15 13Z" fill="#2a2e3e" opacity=".6" />
          <path d="M2 13C7 15.6 17 15.6 22 13L22.6 16.6C17 19.6 7 19.6 1.4 16.6Z" fill={GLOW} stroke="#7c2c06" strokeWidth="1" />
          <path d="M3.6 15.4C8 17.2 16 17.2 20.4 15.4" fill="none" stroke="#fff6c8" strokeWidth=".9" />
          <path d="M5 16.4L5.6 17.6M9.6 17.4L9.8 18.6M14.4 17.4L14.2 18.6M19 16.4L18.4 17.6" stroke="#7c2c06" strokeWidth=".9" />
        </svg>
      </div>
    )
    const sparks = Array.from({ length: 10 }, (_, i) => (
      <div key={`s${i}`} style={{ position: 'absolute', left: `${i < 5 ? 30 : 70}%`, top: '76%', width: '1.6cqw', height: '4cqw', borderRadius: '1cqw', background: i % 2 ? GLOW : ctx.color, '--a': `${-70 + (i % 5) * 35}deg`, animation: `lghorsemanSpark ${520 * ctx.speed}ms ease-out ${(i < 5 ? 200 : 300) * ctx.speed}ms both` }} />
    ))
    return [hoof(30, -8, 0, 'h1'), hoof(70, 8, 110 * ctx.speed, 'h2'), ...sparks]
  },
  // The knockout's climax: the carved head cracks in two, the halves fall apart, seeds and fire spill out.
  horsemanShatter: (p, ctx) => {
    const ms = 900 * ctx.speed
    const w = 26 * ctx.scale
    const half = (side, key) => (
      <div key={key} style={{ position: 'absolute', left: '6%', top: '84%', width: `${w}cqw`, height: `${w}cqw`, clipPath: side < 0 ? 'polygon(0 0, 54% 0, 44% 40%, 56% 62%, 46% 100%, 0 100%)' : 'polygon(54% 0, 100% 0, 100% 100%, 46% 100%, 56% 62%, 44% 40%)', animation: `${side < 0 ? 'lghorsemanHalfL' : 'lghorsemanHalfR'} ${ms}ms cubic-bezier(.4,0,.7,1) both` }}><Head /></div>
    )
    const seeds = Array.from({ length: 12 }, (_, i) => (
      <div key={`sd${i}`} style={{ position: 'absolute', left: '6%', top: '84%', width: '1.8cqw', height: '2.6cqw', borderRadius: '50%', background: i % 3 ? '#f6e7b8' : ctx.color, border: `0.3cqw solid ${INK}`, '--a': `${i * 30}deg`, '--d': `${-14 - (i % 4) * 5}cqw`, animation: `lghorsemanSeed ${ms}ms ease-out both` }} />
    ))
    return [
      <div key="cr" style={{ position: 'absolute', left: '6%', top: '84%', width: `${w * 1.2}cqw`, height: `${w * 1.2}cqw`, borderRadius: '50%', background: `radial-gradient(circle, ${GLOW} 0 20%, ${ctx.color} 45%, transparent 70%)`, animation: `lghorsemanCrackOpen ${600 * ctx.speed}ms ease-out both` }} />,
      half(-1, 'l'), half(1, 'r'), ...seeds,
    ]
  },
  // The last breath: the soulfire leaves the collar as one small green wisp, rises and goes out.
  horsemanWisp: (p, ctx) => {
    const ms = 1000 * ctx.speed
    const w = 9 * ctx.scale
    return <div key="wp" style={{ position: 'absolute', left: '50%', top: '24%', width: `${w}cqw`, height: `${w * 1.5}cqw`, animation: `lghorsemanWisp ${ms}ms ease-out both`, filter: `drop-shadow(0 0 1.4cqw ${SOUL})` }}>
      <svg viewBox="0 0 20 30" width="100%" height="100%" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
        <path d="M3 28C0 20 4 14 7 8C8 13 10 15 11 9C12 4 11 2 10 0C16 6 20 14 17 24C16 27 13 29 10 29C7 29 4 29 3 28Z" fill={SOUL} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M7 27C5 22 7 18 9 15C10 19 12 19 12.6 15C15 19 15 24 13 27C11 28.6 9 28.6 7 27Z" fill={SOUL_HI} />
      </svg>
    </div>
  },
}
