// CHRONOS's own impact parts: drawers merged into impact/parts.jsx PARTS. Name each `chronos<Name>` (never clashes).
// A drawer is (params, ctx) => node, like the shared ones (ctx: color, accent, glyph, scale, speed); CSS keyframes it
// needs go in `css` (prefix them lgchronos). Deterministic, container units, transforms and opacity only.
// Its knockout story: time runs out and the titan SHATTERS INTO SAND: its chest glass bursts outward in shards and the
// sand pours out of the box in curtains, heaping at its base.

const rnd = (i, salt = 1) => { const x = Math.sin(i * 47.3 + salt * 113.7) * 43758.5453; return x - Math.floor(x) }

export const css = `
@keyframes lgchronosGrainFall { 0% { transform: translate(-50%, -50%) translate(calc(var(--x) * 1cqw), calc(var(--y0) * 1cqw)) scale(.6); opacity: 0 }
  12% { opacity: 1 } 85% { opacity: 1 } 100% { transform: translate(-50%, -50%) translate(calc(var(--x) * 1cqw + var(--dx) * 1cqw), calc(var(--y1) * 1cqw)) scale(1); opacity: 0 } }
@keyframes lgchronosCurtain { 0% { transform: translateX(-50%) scaleY(0); opacity: 0 } 18% { opacity: .95 } 70% { transform: translateX(-50%) scaleY(1); opacity: .9 } 100% { transform: translateX(-50%) scaleY(1) scaleX(.2); opacity: 0 } }
@keyframes lgchronosHeap { 0% { transform: translateX(-50%) scaleY(0) } 60% { transform: translateX(-50%) scaleY(1.1) } 80%, 100% { transform: translateX(-50%) scaleY(1) } }
@keyframes lgchronosSweep { 0% { transform: translate(-50%, -50%) rotate(-90deg); opacity: 0 } 12% { opacity: 1 } 80% { opacity: 1 } 100% { transform: translate(-50%, -50%) rotate(630deg); opacity: 0 } }
@keyframes lgchronosHeapFade { 0%, 80% { opacity: 1 } 100% { opacity: 0 } }
@keyframes lgchronosGlass { 0% { transform: translate(-50%, -50%) rotate(0) scale(.4); opacity: 0 } 10% { opacity: 1 }
  100% { transform: translate(-50%, -50%) translate(calc(var(--vx) * 1cqw), calc(var(--vy) * 1cqw)) rotate(var(--r)) scale(1); opacity: 0 } }
`

export default {
  // Its clock runs out: a sweep of light races twice round the ring of its halo (never across the face), then fades.
  chronosRingSweep: (p, ctx) => [0, 1].map((g) => (
    <div key={`sw${g}`} style={{ position: 'absolute', left: '50%', top: '36.7%', width: '92cqw', height: '92cqw', borderRadius: '50%', border: '1.6cqw solid transparent', borderTopColor: g ? 'rgba(255,242,176,.45)' : '#fff2b0', borderRightColor: g ? 'transparent' : 'rgba(255,242,176,.6)', filter: 'drop-shadow(0 0 1.2cqw #ffd25e)', opacity: 0,
      animation: `lgchronosSweep ${(p.ms || 1000) * ctx.speed}ms cubic-bezier(.4,0,.3,1) ${g * 70}ms both` }} />
  )),
  // The sand pours out: three curtains down the box, a rain of grains, and a heap rising at the base, then settling away.
  chronosSandfall: (p, ctx) => {
    const sp = ctx.speed
    const curtains = [-14, 0, 13].map((x, i) => (
      <div key={`c${i}`} style={{ position: 'absolute', left: `${50 + x}%`, top: '30%', width: `${i === 1 ? 9 : 6}cqw`, height: '62%', transformOrigin: 'top', borderRadius: '0 0 40% 40%',
        background: 'linear-gradient(90deg, rgba(245,194,107,0), #f5c26b 30%, #fff3d0 50%, #f5c26b 70%, rgba(245,194,107,0))', animation: `lgchronosCurtain ${640 * sp}ms cubic-bezier(.3,.7,.4,1) ${(i * 90) * sp}ms both` }} />
    ))
    const grains = Array.from({ length: p.n || 22 }, (_, i) => (
      <div key={`g${i}`} style={{ position: 'absolute', left: '50%', top: '50%', width: `${1.4 + rnd(i) * 1.6}cqw`, height: `${1.4 + rnd(i) * 1.6}cqw`, borderRadius: '50%', background: rnd(i, 2) > 0.5 ? '#f5c26b' : '#ffe9a0', boxShadow: '0 0 0 .3cqw rgba(107,74,16,.6)',
        '--x': (rnd(i, 3) - 0.5) * 70, '--y0': -30 + rnd(i, 4) * 20, '--y1': 44 + rnd(i, 5) * 8, '--dx': (rnd(i, 6) - 0.5) * 10,
        animation: `lgchronosGrainFall ${(440 + rnd(i, 7) * 160) * sp}ms cubic-bezier(.5,0,.8,.6) ${(rnd(i, 8) * 240) * sp}ms both` }} />
    ))
    const heap = (
      <div key="heap" style={{ position: 'absolute', left: '11%', bottom: '14%', width: '78%', height: '14%', transformOrigin: 'bottom', animation: `lgchronosHeapFade ${820 * sp}ms linear both` }}>
        <div style={{ position: 'absolute', left: '50%', bottom: 0, width: '100%', height: '100%', borderRadius: '50% 50% 0 0 / 100% 100% 0 0', background: 'linear-gradient(#ffe29a, #d29a4a)', boxShadow: '0 0 0 .5cqw rgba(107,74,16,.7)', transformOrigin: 'bottom', animation: `lgchronosHeap ${640 * sp}ms cubic-bezier(.3,1.4,.5,1) both` }} />
      </div>
    )
    return [...curtains, ...grains, heap]
  },
  // The chest glass bursts: curved shards flung out from the middle of the box, catching the light.
  chronosGlassBurst: (p, ctx) => Array.from({ length: p.n || 10 }, (_, i) => {
    const a = (i / (p.n || 10)) * Math.PI * 2 + rnd(i, 9)
    const d = 30 + rnd(i, 10) * 18
    return (
      <div key={`s${i}`} style={{ position: 'absolute', left: '50%', top: '58%', width: `${4 + rnd(i, 11) * 4}cqw`, height: `${2.4 + rnd(i, 12) * 2}cqw`, borderRadius: '60% 10% 60% 10%', background: 'linear-gradient(135deg, #ffffff, #bfeee9 60%, rgba(127,216,255,.5))', boxShadow: '0 0 1.2cqw #7fd8ff',
        '--vx': Math.cos(a) * d, '--vy': Math.sin(a) * d, '--r': `${(rnd(i, 13) - 0.5) * 540}deg`, animation: `lgchronosGlass ${560 * ctx.speed}ms cubic-bezier(.2,.8,.4,1) ${(rnd(i, 14) * 80) * ctx.speed}ms both` }} />
    )
  }),
}
