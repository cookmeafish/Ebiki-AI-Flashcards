// SHOWMAN's own impact parts: drawers merged into impact/parts.jsx PARTS. Name each `showman<Name>` (never clashes).
// A drawer is (params, ctx) => node, like the shared ones (ctx: color, accent, glyph, scale, speed); CSS keyframes it
// needs go in `css` (prefix them lgshowman). Deterministic, container units, transforms and opacity only.
// His act is his weapon: the Comedy mask thrown like a boomerang blade, razor cards fanned out at you.

const GOLD_MASK = '#f2bd3e'
const RUBY = '#d81f3d'
const GOLD = '#ffd166'
const INK = '#1d2230'

export const css = `
@keyframes lgshowmanBoomerang { 0% { transform: translate(-50%, -50%) translate(-4cqw, -6cqw) rotate(0) scale(.5); opacity: 0 } 8% { opacity: 1 }
  42% { transform: translate(-50%, -50%) translate(66cqw, 14cqw) rotate(900deg) scale(1.35) } 50% { transform: translate(-50%, -50%) translate(70cqw, 18cqw) rotate(1040deg) scale(1.4) }
  88% { opacity: 1 } 100% { transform: translate(-50%, -50%) translate(4cqw, 30cqw) rotate(1800deg) scale(.7); opacity: 0 } }
@keyframes lgshowmanTrail { 0% { stroke-dashoffset: var(--len); opacity: .9 } 45% { stroke-dashoffset: 0; opacity: .8 } 100% { stroke-dashoffset: 0; opacity: 0 } }
@keyframes lgshowmanDrapeL { 0% { transform: translateX(-104%) skewX(0deg) } 34% { transform: translateX(-6%) skewX(-4deg) } 46% { transform: translateX(1%) skewX(2.5deg) } 56% { transform: translateX(-0.5%) skewX(-1deg) } 66% { transform: translateX(0) skewX(0deg) } 88% { transform: translateX(0); opacity: 1 } 100% { transform: translateX(0); opacity: 0 } }
@keyframes lgshowmanDrapeR { 0% { transform: translateX(104%) skewX(0deg) } 34% { transform: translateX(6%) skewX(4deg) } 46% { transform: translateX(-1%) skewX(-2.5deg) } 56% { transform: translateX(0.5%) skewX(1deg) } 66% { transform: translateX(0) skewX(0deg) } 88% { transform: translateX(0); opacity: 1 } 100% { transform: translateX(0); opacity: 0 } }
@keyframes lgshowmanValance { 0% { transform: translateY(-110%) } 22% { transform: translateY(4%) } 32% { transform: translateY(-2%) } 40% { transform: translateY(0) } 88% { transform: translateY(0); opacity: 1 } 100% { transform: translateY(0); opacity: 0 } }
@keyframes lgshowmanSway { 0%, 100% { transform: skewX(0deg) } 50% { transform: skewX(1.2deg) } }
`

// One stage drape (the LEFT one; the right is its mirror), viewBox 0 0 40 130: gathered at the top, falling in deep
// folds to a weighted hem, a gold trim down its leading edge. Fixed colors, soft drop shadow at the edge.
const VELVET = '#9c0f2e', VELVET_LO = '#5c0518', VELVET_HI = '#d23452', TRIM = '#f2bd3e'
const Drape = ({ flip }) => (
  <svg viewBox="0 0 40 130" preserveAspectRatio="none" width="100%" height="100%" aria-hidden="true" style={{ overflow: 'visible', transform: flip ? 'scaleX(-1)' : undefined }}>
    <path d="M0 0H40C38.6 26 41.2 54 38 82C36.6 96 38.4 110 40 124C30 128 18 126.4 8 128.6C4.6 129.2 2 129 0 128Z" fill={VELVET} />
    {[5, 13, 21, 29].map((x, i) => (
      <path key={`d${i}`} d={`M${x} 0C${x - 1.6} 40 ${x + 1.8} 80 ${x - 0.6} 127 L${x + 3.4} 127C${x + 5} 80 ${x + 1.8} 40 ${x + 3} 0Z`} fill={VELVET_LO} opacity=".75" />
    ))}
    {[9, 17, 25, 33].map((x, i) => (
      <path key={`h${i}`} d={`M${x} 0C${x - 0.6} 44 ${x + 1.4} 86 ${x} 126 L${x + 1.4} 126C${x + 2.4} 86 ${x + 0.8} 44 ${x + 1.6} 0Z`} fill={VELVET_HI} opacity=".55" />
    ))}
    <path d="M0 122C10 126 26 124 40 122V126C28 128 12 130 0 128Z" fill={VELVET_LO} />
    <path d="M40 0C38.6 26 41.2 54 38 82C36.6 96 38.4 110 40 124" fill="none" stroke={TRIM} strokeWidth="1.6" />
    <path d="M0 127.4C10 129.2 26 127.6 40 124.6" fill="none" stroke={TRIM} strokeWidth="1.4" />
  </svg>
)
const Valance = () => (
  <svg viewBox="0 0 100 18" preserveAspectRatio="none" width="100%" height="100%" aria-hidden="true" style={{ overflow: 'visible' }}>
    <path d="M0 0H100V9C94 15 86 15 80 9C74 15 66 15 60 9C54 15 46 15 40 9C34 15 26 15 20 9C14 15 6 15 0 9Z" fill={VELVET} />
    {[10, 30, 50, 70, 90].map((x, i) => <path key={`f${i}`} d={`M${x - 6} 4C${x - 3} 8 ${x + 3} 8 ${x + 6} 4`} fill="none" stroke={VELVET_LO} strokeWidth="1.2" opacity=".8" />)}
    <path d="M0 9C6 15 14 15 20 9C26 15 34 15 40 9C46 15 54 15 60 9C66 15 74 15 80 9C86 15 94 15 100 9" fill="none" stroke={TRIM} strokeWidth="1.4" />
    {Array.from({ length: 25 }, (_, i) => <path key={`t${i}`} d={`M${2 + i * 4} ${(11.6 + Math.abs(Math.sin(i * 0.785)) * 2.4).toFixed(2)}v2.6`} stroke={TRIM} strokeWidth=".9" strokeLinecap="round" />)}
    <path d="M0 0H100V2.4H0Z" fill={VELVET_LO} />
  </svg>
)

export default {
  // His knockout: the show is over. A swagged velvet valance drops, then two real drapes sweep in from the wings and
  // meet over him, swinging on their weight and settling, folds and gold trim, soft shadows at the leading edges.
  showmanCurtain: (p) => {
    const ms = 1500, delay = 250
    const side = (left) => (
      <div key={left ? 'dl' : 'dr'} style={{ position: 'absolute', top: '-6%', bottom: '-10%', [left ? 'left' : 'right']: '-10%', width: `${p.part || 62}%`,
        filter: `drop-shadow(${left ? '' : '-'}1cqw 0 1.6cqw #000a)`, transformOrigin: left ? '0 0' : '100% 0', animation: `${left ? 'lgshowmanDrapeL' : 'lgshowmanDrapeR'} ${ms}ms cubic-bezier(.45,0,.3,1) ${delay}ms both` }}>
        <div style={{ width: '100%', height: '100%', transformOrigin: '50% 0', animation: `lgshowmanSway 900ms ease-in-out ${delay + 500}ms 1 both` }}><Drape flip={!left} /></div>
      </div>
    )
    return [
      side(true), side(false),
      <div key="va" style={{ position: 'absolute', left: '-12%', right: '-12%', top: '-16%', height: '24%', filter: 'drop-shadow(0 1cqw 1.2cqw #000a)', animation: `lgshowmanValance ${ms}ms cubic-bezier(.3,.7,.4,1) ${delay - 150}ms both` }}><Valance /></div>,
    ]
  },
  // His strike: the grinning gold Comedy mask is thrown spinning like a blade out of the box at your hearts, carves a gold
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
          <path d="M12 22C6 19 2.5 14 2.5 8.5 2.5 5 5 2.5 8 2.5c1.7 0 3 .8 4 2 1-1.2 2.3-2 4-2 3 0 5.5 2.5 5.5 6 0 5.5-3.5 10.5-9.5 13.5Z" fill={GOLD_MASK} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M6.2 9.2c.8-1.4 2.6-1.4 3.4 0M14.4 9.2c.8-1.4 2.6-1.4 3.4 0" fill="none" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M6.5 13c1.4 3.6 9.6 3.6 11 0Z" fill={INK} />
          <path d="M11.2 3.6 12 2l.8 1.6L12 5.2Z" fill={RUBY} stroke={INK} strokeWidth=".5" />
        </svg>
      </div>,
    ]
  },
}
