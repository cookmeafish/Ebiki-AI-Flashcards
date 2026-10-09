// SHOWMAN's own impact parts: drawers merged into impact/parts.jsx PARTS. Name each `showman<Name>` (never clashes).
// A drawer is (params, ctx) => node, like the shared ones (ctx: color, accent, glyph, scale, speed); CSS keyframes it
// needs go in `css` (prefix them lgshowman). Deterministic, container units, transforms and opacity only.
// His act is his weapon: the Comedy mask thrown like a boomerang blade, razor cards fanned out at you.

const CRIMSON = '#d8213f'
const GOLD = '#ffd166'
const INK = '#1d2230'

export const css = `
@keyframes lgshowmanBoomerang { 0% { transform: translate(-50%, -50%) translate(-4cqw, -6cqw) rotate(0) scale(.5); opacity: 0 } 8% { opacity: 1 }
  42% { transform: translate(-50%, -50%) translate(66cqw, 14cqw) rotate(900deg) scale(1.35) } 50% { transform: translate(-50%, -50%) translate(70cqw, 18cqw) rotate(1040deg) scale(1.4) }
  88% { opacity: 1 } 100% { transform: translate(-50%, -50%) translate(4cqw, 30cqw) rotate(1800deg) scale(.7); opacity: 0 } }
@keyframes lgshowmanTrail { 0% { stroke-dashoffset: var(--len); opacity: .9 } 45% { stroke-dashoffset: 0; opacity: .8 } 100% { stroke-dashoffset: 0; opacity: 0 } }
`

export default {
  // His strike: the grinning Comedy mask is thrown spinning like a blade out of the box at your hearts, carves a pink
  // trail and arcs back to his hand.
  showmanBoomerang: (p, ctx) => {
    const ms = 760 * ctx.speed
    const w = 22 * ctx.scale
    return [
      <svg key="tr" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', left: '-15%', top: '-15%', width: '130%', height: '130%', overflow: 'visible' }} aria-hidden="true">
        <path d="M46 40C70 34 112 40 124 56S80 82 52 70" fill="none" stroke={ctx.color} strokeWidth={3 * ctx.scale} strokeLinecap="round" strokeDasharray="4 5"
          style={{ '--len': 200, strokeDashoffset: 200, animation: `lgshowmanTrail ${ms}ms ease-out both`, filter: `drop-shadow(0 0 2px ${ctx.color})` }} />
      </svg>,
      <div key="mk" style={{ position: 'absolute', left: '50%', top: '42%', width: `${w}cqw`, height: `${w}cqw`, animation: `lgshowmanBoomerang ${ms}ms cubic-bezier(.3,.6,.5,1) both`, filter: `drop-shadow(0 0 1.5cqw ${ctx.color})` }}>
        <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
          <path d="M12 22C6 19 2.5 14 2.5 8.5 2.5 5 5 2.5 8 2.5c1.7 0 3 .8 4 2 1-1.2 2.3-2 4-2 3 0 5.5 2.5 5.5 6 0 5.5-3.5 10.5-9.5 13.5Z" fill={CRIMSON} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M6.2 9.2c.8-1.4 2.6-1.4 3.4 0M14.4 9.2c.8-1.4 2.6-1.4 3.4 0" fill="none" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M6.5 13c1.4 3.6 9.6 3.6 11 0Z" fill={INK} />
          <path d="M11.2 3.6 12 2l.8 1.6L12 5.2Z" fill={GOLD} stroke={INK} strokeWidth=".5" />
        </svg>
      </div>,
    ]
  },
}
