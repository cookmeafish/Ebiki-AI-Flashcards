// SUGARQUEEN's own impact parts: drawers merged into impact/parts.jsx PARTS. Name each `sugarqueen<Name>` (never clashes).
// A drawer is (params, ctx) => node, like the shared ones (ctx: color, accent, glyph, scale, speed); CSS keyframes it
// needs go in `css` (prefix them lgsugarqueen). Deterministic, container units, transforms and opacity only.
// Her tantrum is her weapon: bonbons and wrapped sweets hurled at you that grow as they fly.
import { Glyph } from '../glyphs'

const SWEETS = ['#ff3d8b', '#4fc8ff', '#ffe14d', '#6fe38a', '#b57bff']
const rnd = (i, salt = 1) => { const x = Math.sin(i * 77.3 + salt * 193.1) * 43758.5453; return x - Math.floor(x) }

export const css = `
@keyframes lgsugarqueenHurl { 0% { transform: translate(-50%, -50%) translate(calc(var(--x0) * 1cqw), calc(var(--y0) * 1cqw)) rotate(0) scale(.35); opacity: 0 } 10% { opacity: 1 }
  45% { transform: translate(-50%, -50%) translate(calc(var(--xm) * 1cqw), calc(var(--ym) * 1cqw)) rotate(calc(var(--r) * .5)) scale(1) } 80% { opacity: 1 }
  100% { transform: translate(-50%, -50%) translate(calc(var(--x1) * 1cqw), calc(var(--y1) * 1cqw)) rotate(var(--r)) scale(1.7); opacity: 0 } }
`

export default {
  // Her strike: a fistful of sweets hurled in a lob out of the box at your hearts, spinning and growing as they come.
  sugarqueenBonbons: (p, ctx) => Array.from({ length: p.n || 6 }, (_, i) => {
    const n = p.n || 6
    const o = i - (n - 1) / 2
    const w = (p.size || 1) * 11 * Math.sqrt(ctx.scale)
    return (
      <div key={`sb${i}`} style={{ position: 'absolute', left: '50%', top: '40%', width: `${w}cqw`, height: `${w}cqw`, '--x0': -4 + o * 2, '--y0': -10, '--xm': 30 + rnd(i, 3) * 14, '--ym': -24 + o * 4,
        '--x1': 74 + rnd(i, 5) * 20, '--y1': 6 + o * 8, '--r': `${(i % 2 ? 1 : -1) * (540 + rnd(i, 7) * 360)}deg`,
        animation: `lgsugarqueenHurl ${(520 + rnd(i, 9) * 140) * ctx.speed}ms cubic-bezier(.3,.6,.5,1) ${(130 + i * 45) * ctx.speed}ms both`, filter: `drop-shadow(0 0 1cqw ${SWEETS[i % SWEETS.length]})` }}>
        <Glyph name="candy" color={SWEETS[i % SWEETS.length]} accent="#ffffff" />
      </div>
    )
  }),
}
