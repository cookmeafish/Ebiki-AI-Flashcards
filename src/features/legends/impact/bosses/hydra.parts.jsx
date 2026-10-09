// HYDRA's own impact parts: drawers merged into impact/parts.jsx PARTS. Name each `hydra<Name>` (never clashes).
// A drawer is (params, ctx) => node, like the shared ones (ctx: color, accent, glyph, scale, speed); CSS keyframes it
// needs go in `css` (prefix them lghydra). Deterministic, container units, transforms and opacity only.
// Its strike: every head spits a fang at you, one after another from where the heads are, venom trailing.
import { Glyph } from '../glyphs'

const rnd = (i, salt = 1) => { const x = Math.sin(i * 61.7 + salt * 157.9) * 43758.5453; return x - Math.floor(x) }

export const css = `
@keyframes lghydraFang { 0% { transform: translate(-50%, -50%) translate(calc(var(--x0) * 1cqw), calc(var(--y0) * 1cqw)) rotate(var(--r)) scale(.4); opacity: 0 } 10% { opacity: 1 }
  80% { opacity: 1 } 100% { transform: translate(-50%, -50%) translate(calc(var(--x1) * 1cqw), calc(var(--y1) * 1cqw)) rotate(var(--r)) scale(1.6); opacity: 0 } }
`

export default {
  // A fang from each head (left, king, right...) shot out of the box toward the hearts, nose first, a venom glow.
  hydraFangs: (p, ctx) => Array.from({ length: p.n || 5 }, (_, i) => {
    const x0 = -30 + i * 15
    const y0 = -22 + Math.abs(i - 2) * 8
    const x1 = 70 + rnd(i, 3) * 20
    const y1 = 4 + (i - 2) * 7
    const r = `${(Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI + 90}deg`
    const w = (p.size || 1) * 9 * Math.sqrt(ctx.scale)
    return (
      <div key={`hf${i}`} style={{ position: 'absolute', left: '50%', top: '50%', width: `${w}cqw`, height: `${w}cqw`, '--x0': x0, '--y0': y0, '--x1': x1, '--y1': y1, '--r': r,
        animation: `lghydraFang ${(380 + rnd(i, 5) * 80) * ctx.speed}ms cubic-bezier(.3,.7,.4,1) ${(120 + i * 55) * ctx.speed}ms both`, filter: 'drop-shadow(0 0 1.2cqw #8dff5a)' }}>
        <Glyph name="fang" color="#f4f1e4" accent="#8dff5a" />
      </div>
    )
  }),
}
