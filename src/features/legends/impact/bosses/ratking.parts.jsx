// RATKING's own impact parts: drawers merged into impact/parts.jsx PARTS. Name each `ratking<Name>` (never clashes).
// A drawer is (params, ctx) => node, like the shared ones (ctx: color, accent, glyph, scale, speed); CSS keyframes it
// needs go in `css` (prefix them lgratking). Deterministic, container units, transforms and opacity only.
// The Kingpin fights with his money: his scepter bats gold at you, his treasure is the weapon, his death is the hoard.
import { Glyph } from '../glyphs'

const GOLD = '#ffd34d'
const GOLD_HI = '#fff4b8'
const GOLD_LO = '#b77a12'
const INK = '#1d2230'
const rnd = (i, salt = 1) => { const x = Math.sin(i * 91.7 + salt * 271.3) * 43758.5453; return x - Math.floor(x) }

// The coin, as a spinning disc (the flip reads as a coin at any size).
const coin = (w, extra = {}) => (
  <div style={{ width: `${w}cqw`, height: `${w}cqw`, animation: 'lgratkingFlip 260ms linear infinite', ...extra }}>
    <Glyph name="coin" color={GOLD} accent={GOLD_LO} />
  </div>
)

export const css = `
@keyframes lgratkingFlip { 0% { transform: scaleX(1) } 50% { transform: scaleX(.18) } 100% { transform: scaleX(1) } }
@keyframes lgratkingVolley { 0% { transform: translate(-50%, -50%) translate(calc(var(--x0) * 1cqw), calc(var(--y0) * 1cqw)) scale(.4); opacity: 0 }
  12% { opacity: 1 } 70% { opacity: 1 }
  100% { transform: translate(-50%, -50%) translate(calc(var(--x1) * 1cqw), calc(var(--y1) * 1cqw)) scale(var(--s1, 1.3)); opacity: 0 } }
@keyframes lgratkingArc { 0% { stroke-dashoffset: var(--len); opacity: 1 } 38% { stroke-dashoffset: 0; opacity: 1 } 100% { stroke-dashoffset: 0; opacity: 0 } }
@keyframes lgratkingSkull { 0% { transform: translate(-50%, -50%) translate(-34cqw, -38cqw) rotate(-80deg) scale(.7); opacity: 0 } 10% { opacity: 1 }
  38% { transform: translate(-50%, -50%) translate(40cqw, 22cqw) rotate(40deg) scale(1.25); opacity: 1 } 46% { transform: translate(-50%, -50%) translate(37cqw, 20cqw) rotate(30deg) scale(1.15) }
  100% { transform: translate(-50%, -50%) translate(46cqw, 24cqw) rotate(36deg) scale(1.1); opacity: 0 } }
@keyframes lgratkingBar { 0% { transform: translate(-50%, -50%) translate(-10cqw, -46cqw) rotate(-200deg) scale(.5); opacity: 0 } 12% { opacity: 1 }
  44% { transform: translate(-50%, -50%) translate(8cqw, 6cqw) rotate(-10deg) scale(1.5) } 52% { transform: translate(-50%, -50%) translate(10cqw, 12cqw) rotate(4deg) scale(1.35, 1.1) }
  60% { transform: translate(-50%, -50%) translate(12cqw, 10cqw) rotate(0) scale(1.4) } 80% { opacity: 1 }
  100% { transform: translate(-50%, -50%) translate(60cqw, 14cqw) rotate(16deg) scale(1.2); opacity: 0 } }
@keyframes lgratkingCrack { 0% { transform: scaleX(0); opacity: 0 } 30% { transform: scaleX(1); opacity: 1 } 100% { transform: scaleX(1.05); opacity: 0 } }
@keyframes lgratkingPour { 0% { transform: translateY(-80cqw) rotate(var(--r0)); opacity: 0 } 15% { opacity: 1 }
  70% { transform: translateY(calc(var(--y1) * 1cqw)) rotate(var(--r1)); opacity: 1 } 78% { transform: translateY(calc(var(--y1) * 1cqw - 3cqw)) rotate(var(--r1)) }
  88% { transform: translateY(calc(var(--y1) * 1cqw)) rotate(var(--r1)); opacity: .9 } 100% { transform: translateY(calc(var(--y1) * 1cqw)) rotate(var(--r1)); opacity: 0 } }
`

export default {
  // His strike: the rat-skull scepter swings down across the box like a bat (a gold arc ending past the right edge,
  // where the hearts are) and the skull itself flies through the blow.
  ratkingScepterSwing: (p, ctx) => {
    const ms = 620 * ctx.speed
    const d = 'M8 4C22 -2 60 6 80 34S112 70 128 64'
    return [
      <svg key="sa" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', left: '-15%', top: '-15%', width: '130%', height: '130%', overflow: 'visible' }} aria-hidden="true">
        {[[INK, 11], [GOLD_LO, 8], [GOLD, 5.5], [GOLD_HI, 2]].map(([c, w], k) => (
          <path key={k} d={d} fill="none" stroke={c} strokeWidth={w * ctx.scale} strokeLinecap="round" style={{ '--len': 170, strokeDasharray: 170, animation: `lgratkingArc ${ms}ms cubic-bezier(.6,0,.25,1) both` }} />
        ))}
      </svg>,
      <div key="sk" style={{ position: 'absolute', left: '50%', top: '50%', width: `${16 * ctx.scale}cqw`, height: `${20 * ctx.scale}cqw`, animation: `lgratkingSkull ${ms}ms cubic-bezier(.6,0,.25,1) both`, filter: `drop-shadow(0 0 1.5cqw ${GOLD})` }}>
        <svg viewBox="0 0 20 24" width="100%" height="100%" aria-hidden="true">
          <path d="M10 1C4 1 1.5 5 1.5 9.5c0 3 1.3 5.4 3.4 6.7L5.6 22h8.8l.7-5.8c2.1-1.3 3.4-3.7 3.4-6.7C18.5 5 16 1 10 1Z" fill="#efe6cf" stroke={INK} strokeWidth="1.4" />
          <path d="M4.6 9.5 8.6 11.5 5 13Z M15.4 9.5 11.4 11.5 15 13Z" fill="#e2203d" stroke={INK} strokeWidth=".8" />
          <path d="M10 -1.5 11.6 1.5 10 3.2 8.4 1.5Z" fill="#a46bff" stroke={INK} strokeWidth=".7" />
        </svg>
      </div>,
    ]
  },
  // Coins batted out of the box at the hearts (to the right), spinning, in a tight fan.
  ratkingVolley: (p, ctx) => Array.from({ length: p.n || 7 }, (_, i) => {
    const n = p.n || 7
    const o = i - (n - 1) / 2
    const w = (p.size || 1) * 9 * Math.sqrt(ctx.scale)
    return (
      <div key={`rv${i}`} style={{ position: 'absolute', left: '50%', top: '45%', '--x0': -6 + rnd(i, 3) * 6, '--y0': -4 + o * 2, '--x1': 70 + rnd(i, 5) * 22, '--y1': 8 + o * 9, '--s1': 1.1 + rnd(i, 7) * 0.4,
        animation: `lgratkingVolley ${(430 + rnd(i, 9) * 120) * ctx.speed}ms cubic-bezier(.2,.7,.4,1) ${(140 + i * 35) * ctx.speed}ms both` }}>
        {coin(w, { animationDelay: `${-i * 37}ms`, filter: `drop-shadow(-2cqw 0 1cqw ${GOLD}aa)` })}
      </div>
    )
  }),
  // His heavy blow: a whole gold bar hurled end over end, slammed down onto the floor of the box (a crack where it
  // lands), then it skids out at the hearts.
  ratkingIngot: (p, ctx) => {
    const ms = 900 * ctx.speed
    return [
      <div key="ib" style={{ position: 'absolute', left: '50%', top: '50%', width: `${30 * ctx.scale}cqw`, height: `${15 * ctx.scale}cqw`, animation: `lgratkingBar ${ms}ms cubic-bezier(.45,0,.3,1) both`, filter: `drop-shadow(0 0 2cqw ${GOLD})` }}>
        <svg viewBox="0 0 40 20" width="100%" height="100%" aria-hidden="true">
          <path d="M6 2h28l5 16H1Z" fill={GOLD} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9 4h22l2.2 7H6.8Z" fill={GOLD_HI} />
          <path d="M1 18h38" stroke={GOLD_LO} strokeWidth="2.4" />
        </svg>
      </div>,
      <svg key="ic" viewBox="0 0 100 20" preserveAspectRatio="none" style={{ position: 'absolute', left: '0%', top: '62%', width: '100%', height: '14%', overflow: 'visible', transformOrigin: '60% 50%', animation: `lgratkingCrack ${520 * ctx.speed}ms ease-out ${400 * ctx.speed}ms both` }} aria-hidden="true">
        <path d="M60 10 L48 6 L40 12 L28 7 L18 11 L4 8 M60 10 L70 4 L80 11 L90 6 L100 10 M60 10 L58 18" fill="none" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M60 10 L48 6 L40 12 L28 7 L18 11 L4 8 M60 10 L70 4 L80 11 L90 6 L100 10 M60 10 L58 18" fill="none" stroke={GOLD_HI} strokeWidth="1.6" strokeLinejoin="round" />
      </svg>,
    ]
  },
  // His knockout's own story: buried in his own hoard, a landslide of coins pours down over the dethroned king and
  // piles up in front of him, then fades (nothing stays over the boss).
  ratkingAvalanche: (p, ctx) => Array.from({ length: p.n || 22 }, (_, i) => {
    const x = 6 + rnd(i, 11) * 88
    const y1 = 58 + rnd(i, 13) * 30
    const w = (p.size || 1) * (7 + rnd(i, 15) * 5)
    return (
      <div key={`ra${i}`} style={{ position: 'absolute', left: `${x}%`, top: 0, width: `${w}cqw`, height: `${w}cqw`, marginLeft: `${-w / 2}cqw`, '--y1': y1, '--r0': `${rnd(i, 17) * 360}deg`, '--r1': `${rnd(i, 19) * 360 + 180}deg`,
        animation: `lgratkingPour ${(780 + rnd(i, 21) * 260) * ctx.speed}ms cubic-bezier(.5,0,.7,1) ${(rnd(i, 23) * 320) * ctx.speed}ms both` }}>
        <Glyph name="coin" color={GOLD} accent={GOLD_LO} />
      </div>
    )
  }),
}
