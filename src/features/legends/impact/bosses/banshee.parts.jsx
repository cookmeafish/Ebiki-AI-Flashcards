// BANSHEE's own impact parts: drawers merged into impact/parts.jsx PARTS. Name each `banshee<Name>` (never clashes).
// A drawer is (params, ctx) => node, like the shared ones (ctx: color, accent, glyph, scale, speed); CSS keyframes it
// needs go in `css` (prefix them lgbanshee). Deterministic, container units, transforms and opacity only.
// Her knockout story: the song ends. Her sound collapses back into her, her last note leaves her lips and thins away
// above her, her ghost light comes apart in pale motes, her pipes droop silent (fx/banshee.jsx), leaving her greyed and still.

import { Glyph } from '../glyphs'

const rnd = (i, salt = 1) => { const x = Math.sin(i * 51.7 + salt * 97.3) * 43758.5453; return x - Math.floor(x) }


export const css = `
@keyframes lgbansheeScream { 0% { transform: translate(-50%, -50%) scale(var(--s0)); opacity: 0 } 15% { opacity: .95 } 100% { transform: translate(-50%, -50%) scale(var(--s1)); opacity: 0 } }
@keyframes lgbansheeNote { 0% { transform: translate(calc(var(--x0) * 1cqw), calc(var(--y0) * 1cqw)) rotate(0deg) scale(var(--s0)); opacity: 0 } 18% { opacity: 1 } 75% { opacity: 1 }
  100% { transform: translate(calc(var(--x1) * 1cqw), calc(var(--y1) * 1cqw)) rotate(var(--r1)) scale(var(--s1)); opacity: 0 } }
@keyframes lgbansheeLastNote { 0% { transform: translate(14cqw, 4cqw) scale(.3); opacity: 0 } 14% { transform: translate(22cqw, 0) scale(1.1); opacity: 1 } 40% { transform: translate(28cqw, -12cqw) rotate(-8deg) scale(1) } 65% { transform: translate(30cqw, -26cqw) rotate(6deg) scale(.9); opacity: .75 } 100% { transform: translate(27cqw, -40cqw) scale(.6); opacity: 0 } }
@keyframes lgbansheeMote { 0% { transform: translate(-50%, 0) scale(.4); opacity: 0 } 20% { opacity: .95 }
  100% { transform: translate(calc(-50% + var(--dx) * 1cqw), calc(var(--rise) * -1cqw)) scale(1); opacity: 0 } }
`

// Her face sits about here in the boss box in every phase (centre and clear radius, container units): sound notes are
// born on a ring OUTSIDE it and only fly outward, inward to its edge, or rise up the sides, so no note ever crosses her
// face (the shared burst / pull / rise start at or pass through the box centre, which is her face).
const FACE = { x: 0, y: -12, r: 30 }
const MOUTH_TOP = '45%' // her mouth in every phase
const note = (key, ctx, color, { x0, y0, x1, y1, r1 = 0, s0 = 0.5, s1 = 1, w = 11, ms = 650, delay = 0, ease = 'cubic-bezier(.15,.8,.3,1)' }) => (
  <div key={key} style={{ position: 'absolute', left: '50%', top: '50%', width: `${w}cqw`, height: `${w}cqw`, marginLeft: `${-w / 2}cqw`, marginTop: `${-w / 2}cqw`,
    '--x0': x0, '--y0': y0, '--x1': x1, '--y1': y1, '--r1': `${r1}deg`, '--s0': s0, '--s1': s1, animation: `lgbansheeNote ${ms * ctx.speed}ms ${ease} ${delay}ms both` }}>
    <Glyph name={ctx.glyph || 'note'} color={color} accent={ctx.accent} />
  </div>
)

export default {
  // Notes around her face, never over it: born on a ring outside it, flying out (p.mode 'out', default) or pulled in
  // to its edge ('in'). p.n, p.size, p.spin.
  bansheeNotes: (p, ctx) => Array.from({ length: p.n || 8 }, (_, i) => {
    const n = p.n || 8, w = 11 * (p.size || 1) * Math.sqrt(ctx.scale), color = i % 3 ? (p.color || ctx.color) : '#ffffff'
    const a = (Math.PI * 2 * i) / n + rnd(i, 21) * 0.4, c = Math.cos(a), s = Math.sin(a)
    const near = FACE.r + 2, far = FACE.r + 22 + rnd(i, 22) * 14
    const [r0, r1] = p.mode === 'in' ? [far + 10, near] : [near, far]
    return note(`bno${i}`, ctx, color, { x0: FACE.x + c * r0, y0: FACE.y + s * r0 * 0.9, x1: FACE.x + c * r1, y1: FACE.y + s * r1 * 0.9, r1: (p.spin || 0) * (i % 2 ? 1 : -1), s0: p.mode === 'in' ? 1.1 : 0.5, s1: p.mode === 'in' ? 0.4 : 1, w, ms: p.mode === 'in' ? 720 : 620, delay: rnd(i, 23) * 120, ease: p.mode === 'in' ? 'cubic-bezier(.6,0,.9,.6)' : undefined })
  }),
  // Her scream as thick sound rings centred on HER FACE, never on it: they start just outside it and burst out (or, with
  // p.inward, close in only as far as its edge). p.n rings, staggered.
  bansheeScream: (p, ctx) => Array.from({ length: p.n || 3 }, (_, i) => {
    const c = p.color || ctx.color, edge = 1.05 + i * 0.08
    const [s0, s1] = p.inward ? [2.4, edge] : [edge, 2.2 * ctx.scale + i * 0.2]
    return <div key={`bsc${i}`} style={{ position: 'absolute', left: '50%', top: `calc(50% + ${FACE.y}cqw)`, width: `${FACE.r * 2}cqw`, height: `${FACE.r * 2}cqw`, borderRadius: '50%',
      border: `${1.8 - i * 0.25}cqw solid ${c}`, filter: 'blur(1px)', boxShadow: `0 0 3cqw ${c}`, '--s0': s0, '--s1': s1,
      animation: `lgbansheeScream ${640 * ctx.speed}ms ${p.inward ? 'ease-in' : 'cubic-bezier(.1,.8,.3,1)'} ${i * 110}ms both` }} />
  }),
  // Notes rising up both SIDES of the box, clear of her face.
  bansheeNoteRise: (p, ctx) => Array.from({ length: p.n || 8 }, (_, i) => {
    const w = 11 * (p.size || 1) * 0.8, color = i % 3 ? (p.color || ctx.color) : '#ffffff'
    const side = i % 2 ? 1 : -1, x = side * (30 + rnd(i, 11) * 16)
    return note(`bnr${i}`, ctx, color, { x0: x, y0: 30 + rnd(i, 12) * 20, x1: x + side * rnd(i, 13) * 10, y1: -40 - rnd(i, 14) * 30, r1: side * 90, w, ms: 1050, delay: rnd(i, 15) * 220, ease: 'cubic-bezier(.2,.6,.4,1)' })
  }),
  // Her LAST NOTE: one great ghostly note slips from the corner of her lips, wavers out past her veil and up, and thins
  // away to nothing (the song is over), never over her face. A pale halo ring travels with it.
  bansheeLastNote: (p, ctx) => {
    const ms = (p.ms || 1300) * ctx.speed, w = 20 * (p.size || 1)
    return (
      <div key="bln" style={{ position: 'absolute', left: '50%', top: MOUTH_TOP, width: `${w}cqw`, height: `${w}cqw`, marginLeft: `${-w / 2}cqw`, marginTop: `${-w / 2}cqw`,
        animation: `lgbansheeLastNote ${ms}ms cubic-bezier(.25,.6,.35,1) both` }}>
        <div style={{ position: 'absolute', inset: '-18%', borderRadius: '50%', border: '.8cqw solid #c8fbff', boxShadow: '0 0 3cqw #7ff0ff', opacity: 0.7 }} />
        <Glyph name="note" color="#e9fdff" accent="#0b3a46" />
      </div>
    )
  },
  // Her ghost light comes apart: pale motes lift off her figure and drift up, fading, as she dissolves.
  bansheeMotes: (p, ctx) => Array.from({ length: p.n || 16 }, (_, i) => {
    const s = 1.4 + rnd(i, 2) * 2.4
    return (
      <div key={`bmo${i}`} style={{ position: 'absolute', left: `${22 + rnd(i, 3) * 56}%`, top: `${40 + rnd(i, 8) * 45}%`, width: `${s}cqw`, height: `${s}cqw`,
        background: i % 3 ? '#c8fbff' : '#ffffff', clipPath: 'polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%)', '--dx': (rnd(i, 4) - 0.5) * 14, '--rise': 26 + rnd(i, 5) * 30,
        animation: `lgbansheeMote ${(700 + rnd(i, 6) * 300) * ctx.speed}ms cubic-bezier(.3,.5,.5,1) ${(rnd(i, 7) * 260) * ctx.speed}ms both` }} />
    )
  }),
}
