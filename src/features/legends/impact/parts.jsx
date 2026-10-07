// THE IMPACT PARTS: the pieces a raid boss's impact style (impact/styles.js) is built from. Each part is a function
// (params, ctx) -> elements; ctx = { color, accent, glyph, scale, speed }. Everything is CSS (and inline SVG) inside the
// boss box, sized in container units of the impact layer (cqw = 1% of the boss box), so a part looks the same at any
// arena size. Deterministic (no Math.random): the same moment looks the same every time. Fixed bright colors over the
// art (both themes). Nothing here may last longer than ~1.4 s (fx/_juice.js JUICE.maxMs and the layer's linger).
import { Glyph } from './glyphs'

const RAINBOW = ['#ff4a4a', '#ffb23a', '#ffe94a', '#5dff9a', '#4ac8ff', '#9a6bff']
const CONFETTI = ['#ff4fb0', '#ffe94a', '#4ac8ff', '#5dff9a', '#ff8a3a', '#ffffff']
// A fixed pseudo-random number in [0, 1) for part i (salted per part kind).
const rnd = (i, salt = 1) => { const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453; return x - Math.floor(x) }
const deg = (rad) => (rad * 180) / Math.PI

export const PARTS_CSS = `
@keyframes lgiMove { 0% { transform: translate(calc(var(--x0) * 1cqw), calc(var(--y0) * 1cqw)) rotate(var(--r0)) scale(var(--s0)); opacity: 0 }
  10% { opacity: 1 } 72% { opacity: var(--o-mid, 1) }
  100% { transform: translate(calc(var(--x1) * 1cqw), calc(var(--y1) * 1cqw)) rotate(var(--r1)) scale(var(--s1)); opacity: 0 } }
@keyframes lgiArcPath { 0% { transform: translate(calc(var(--x0) * 1cqw), calc(var(--y0) * 1cqw)) rotate(var(--r0)) scale(var(--s0)); opacity: 0 }
  8% { opacity: 1 } 45% { transform: translate(calc(var(--xm) * 1cqw), calc(var(--ym) * 1cqw)) rotate(calc((var(--r0) + var(--r1)) / 2)) scale(var(--s1)) }
  85% { opacity: 1 } 100% { transform: translate(calc(var(--x1) * 1cqw), calc(var(--y1) * 1cqw)) rotate(var(--r1)) scale(var(--s1)); opacity: 0 } }
@keyframes lgiRing { 0% { transform: translate(-50%, -50%) scale(var(--s0, .2)); opacity: .95 } 100% { transform: translate(-50%, -50%) scale(var(--s1, 1.8)); opacity: 0 } }
@keyframes lgiSpark { 0% { transform: rotate(var(--a)) translateX(4cqw) scaleX(.2); opacity: 0 } 15% { opacity: 1 } 100% { transform: rotate(var(--a)) translateX(calc(var(--r) * 1cqw)) scaleX(1); opacity: 0 } }
@keyframes lgiSlash { 0% { transform: translate(-50%, -50%) rotate(var(--a)) scaleX(0); opacity: 0 } 18% { opacity: 1 } 40% { transform: translate(-50%, -50%) rotate(var(--a)) scaleX(1); opacity: 1 } 100% { transform: translate(-50%, -50%) rotate(var(--a)) scaleX(1); opacity: 0 } }
@keyframes lgiFade { 0% { opacity: 0 } 18% { opacity: 1 } 100% { opacity: 0 } }
@keyframes lgiSpin { 0% { transform: translate(-50%, -50%) rotate(var(--r0)) scale(var(--s0, 1)); opacity: 0 } 12% { opacity: 1 } 80% { opacity: 1 } 100% { transform: translate(-50%, -50%) rotate(var(--r1)) scale(var(--s1, 1)); opacity: 0 } }
@keyframes lgiPillar { 0% { transform: translateX(-50%) scaleX(0); opacity: 0 } 15% { transform: translateX(-50%) scaleX(1.25); opacity: 1 } 35% { transform: translateX(-50%) scaleX(.9) } 100% { transform: translateX(-50%) scaleX(0); opacity: 0 } }
@keyframes lgiDrop { 0% { transform: translateY(-110%) scaleY(1.6); opacity: 0 } 30% { transform: translateY(0) scaleY(.85); opacity: 1 } 42% { transform: translateY(-6%) scaleY(1.05) } 55% { transform: none } 100% { transform: none; opacity: 0 } }
@keyframes lgiDraw { 0% { stroke-dashoffset: var(--len); opacity: 1 } 45% { stroke-dashoffset: 0; opacity: 1 } 100% { stroke-dashoffset: 0; opacity: 0 } }
@keyframes lgiFlicker { 0% { opacity: 0 } 8% { opacity: 1 } 16% { opacity: .25 } 24% { opacity: 1 } 36% { opacity: .4 } 46% { opacity: 1 } 100% { opacity: 0 } }
@keyframes lgiCone { 0% { transform: translateX(-50%) scale(.2, .1); opacity: 0 } 20% { opacity: 1 } 55% { transform: translateX(-50%) scale(1, 1); opacity: 1 } 100% { transform: translateX(-50%) scale(1.1, 1.15); opacity: 0 } }
@keyframes lgiBand { 0% { transform: scaleX(0); opacity: 0 } 12% { opacity: 1 } 45% { transform: scaleX(1); opacity: 1 } 100% { transform: scaleX(1) scaleY(.2); opacity: 0 } }
@keyframes lgiSweep { 0% { transform: translateX(-120cqw) skewX(-12deg); opacity: 0 } 15% { opacity: 1 } 70% { opacity: 1 } 100% { transform: translateX(110cqw) skewX(8deg); opacity: 0 } }
@keyframes lgiJaw { 0% { transform: translate(var(--jx), var(--jy)); opacity: 0 } 25% { opacity: 1; transform: translate(var(--jx), var(--jy)) } 48% { transform: translate(0, 0) } 56% { transform: translate(calc(var(--jx) * -.06), calc(var(--jy) * -.06)) } 64% { transform: translate(0, 0) } 100% { transform: translate(0, 0); opacity: 0 } }
@keyframes lgiStab { 0% { transform: translateY(-60cqw) scale(.8); opacity: 0 } 30% { opacity: 1 } 46% { transform: translateY(0) scale(1.05) } 54% { transform: translateY(2cqw) scale(1) } 80% { transform: translateY(-8cqw); opacity: 1 } 100% { transform: translateY(-30cqw); opacity: 0 } }
@keyframes lgiSlam { 0% { transform: translate(-50%, -150%) scale(.9); opacity: 0 } 25% { opacity: 1 } 42% { transform: translate(-50%, -50%) scale(1.2, .8) } 52% { transform: translate(-50%, -54%) scale(.95, 1.06) } 62% { transform: translate(-50%, -50%) scale(1) } 85% { opacity: 1 } 100% { transform: translate(-50%, -46%) scale(1); opacity: 0 } }
@keyframes lgiProjectile { 0% { transform: translate(-50%, -50%) scale(.15) rotate(-20deg); opacity: 0 } 15% { opacity: 1 } 60% { transform: translate(-50%, -20%) scale(1.4) rotate(10deg); opacity: 1 } 75% { transform: translate(-50%, 0%) scale(2.4) rotate(0); opacity: .9 } 100% { transform: translate(-50%, 10%) scale(3) rotate(0); opacity: 0 } }
@keyframes lgiCurtainL { 0% { transform: translateX(-100%) } 45% { transform: translateX(0) } 80% { transform: translateX(0); opacity: 1 } 100% { transform: translateX(0); opacity: 0 } }
@keyframes lgiCurtainR { 0% { transform: translateX(100%) } 45% { transform: translateX(0) } 80% { transform: translateX(0); opacity: 1 } 100% { transform: translateX(0); opacity: 0 } }
@keyframes lgiEclipse { 0% { transform: translate(40cqw, -50%) scale(.9); opacity: 0 } 20% { opacity: 1 } 55% { transform: translate(-50%, -50%) scale(1) } 80% { transform: translate(-50%, -50%) scale(1.05); opacity: 1 } 100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0 } }
@keyframes lgiOrbit { 0% { transform: translate(-50%, -50%) rotate(0deg); opacity: 0 } 12% { opacity: 1 } 60% { transform: translate(-50%, -50%) rotate(300deg) } 100% { transform: translate(-50%, -50%) rotate(420deg); opacity: 0 } }
@keyframes lgiOrbitIn { 0%, 55% { transform: translateX(calc(var(--r) * 1cqw)) scale(1) } 85% { transform: translateX(0) scale(1.6) } 100% { transform: translateX(0) scale(.4) } }
@keyframes lgiOrbitOut { 0%, 45% { transform: translateX(calc(var(--r) * 1cqw)) scale(1) } 100% { transform: translateX(calc(var(--r) * 3cqw)) scale(1.4) } }
@keyframes lgiHalo { 0% { transform: translate(-50%, -50%) rotate(var(--r0)) scale(var(--s0), calc(var(--s0) * .32)); opacity: 0 } 15% { opacity: 1 } 70% { opacity: 1 } 100% { transform: translate(-50%, -50%) rotate(var(--r1)) scale(var(--s1), calc(var(--s1) * .32)); opacity: 0 } }
@keyframes lgiBubble { 0% { transform: translate(-50%, -50%) scale(.3); opacity: 0 } 22% { transform: translate(-50%, -50%) scale(1.08); opacity: .95 } 34% { transform: translate(-50%, -50%) scale(.94, 1.04) } 44% { transform: translate(-50%, -50%) scale(1.03, .97) } 80% { opacity: .8 } 100% { transform: translate(-50%, -50%) scale(1.3); opacity: 0 } }
@keyframes lgiBlade { 0% { transform: translateX(-60cqw) scaleX(.3); opacity: 0 } 18% { opacity: 1 } 55% { transform: translateX(10cqw) scaleX(1); opacity: 1 } 100% { transform: translateX(60cqw) scaleX(.6); opacity: 0 } }
@keyframes lgiTwinkle { 0% { transform: rotate(var(--r0)) scale(0); opacity: 0 } 35% { transform: rotate(calc(var(--r1) / 2)) scale(1.2); opacity: 1 } 100% { transform: rotate(var(--r1)) scale(0); opacity: 0 } }
@keyframes lgiQuake { 0% { transform: translate(-50%, -50%) scale(.15, .3); opacity: 1 } 70% { opacity: .8 } 100% { transform: translate(-50%, -50%) scale(2.1, 1.2); opacity: 0 } }
@keyframes lgiPulse { 0% { transform: translate(-50%, -50%) scale(.4); opacity: 0 } 18% { transform: translate(-50%, -50%) scale(1.05); opacity: 1 } 34% { transform: translate(-50%, -50%) scale(.85); opacity: .7 } 52% { transform: translate(-50%, -50%) scale(1.25); opacity: .9 } 100% { transform: translate(-50%, -50%) scale(1.7); opacity: 0 } }
@keyframes lgiDrip { 0% { transform: scaleY(0); opacity: 0 } 15% { opacity: 1 } 60% { transform: scaleY(1) } 100% { transform: scaleY(1.15) translateY(14cqw); opacity: 0 } }
`

// One flying particle (a glyph or any node) through lgiMove (or lgiArcPath when `mid` is given).
function fly(key, node, { x0 = 0, y0 = 0, x1, y1, xm, ym, r0 = 0, r1 = 0, s0 = 0.6, s1 = 1, w = 12, ms = 650, delay = 0, ease = 'cubic-bezier(.15,.8,.3,1)', midOpacity = 1 }) {
  const arc = xm != null
  return (
    <div key={key} style={{ position: 'absolute', left: '50%', top: '50%', width: `${w}cqw`, height: `${w}cqw`, marginLeft: `${-w / 2}cqw`, marginTop: `${-w / 2}cqw`,
      '--x0': x0, '--y0': y0, '--x1': x1, '--y1': y1, '--xm': xm, '--ym': ym, '--r0': `${r0}deg`, '--r1': `${r1}deg`, '--s0': s0, '--s1': s1, '--o-mid': midOpacity,
      animation: `${arc ? 'lgiArcPath' : 'lgiMove'} ${ms}ms ${ease} ${delay}ms both` }}>{node}</div>
  )
}
const glyphOf = (p, ctx) => p.glyph || ctx.glyph
const colorOf = (p, ctx) => p.color || ctx.color
const svgBox = (key, children, extra = {}) => (
  <svg key={key} viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', left: '-15%', top: '-15%', width: '130%', height: '130%', overflow: 'visible', ...extra }} aria-hidden="true">{children}</svg>
)

export const PARTS = {
  // Glyphs flung out from the centre.
  burst: (p, ctx) => {
    const n = p.n || 6
    const reach = 40 * (p.reach || 1) * ctx.scale
    const w = 13 * (p.size || 1) * Math.sqrt(ctx.scale)
    return Array.from({ length: n }, (_, i) => {
      const a = (Math.PI * 2 * i) / n + rnd(i, 3) * 0.5
      const r = reach * (0.75 + rnd(i, 5) * 0.45)
      return fly(`b${i}`, <Glyph name={glyphOf(p, ctx)} color={colorOf(p, ctx)} accent={ctx.accent} />,
        { x1: Math.cos(a) * r, y1: Math.sin(a) * r, r1: (p.spin || 0) * (i % 2 ? 1 : -1), s0: 0.4, s1: 1, w, ms: 620 * ctx.speed, delay: rnd(i, 7) * 60 })
    })
  },
  // Thin bright streaks (a white core).
  sparks: (p, ctx) => Array.from({ length: p.n || 8 }, (_, i) => {
    const c = colorOf(p, ctx)
    return <div key={`sp${i}`} style={{ position: 'absolute', left: '50%', top: '50%', width: '42cqw', height: `${(p.width || 1.1) * Math.sqrt(ctx.scale)}cqw`, marginTop: '-0.5cqw', transformOrigin: '0 50%',
      background: `linear-gradient(90deg, transparent, ${c} 55%, #fff)`, borderRadius: 4, boxShadow: `0 0 1.5cqw ${c}`, '--a': `${(360 / (p.n || 8)) * i + rnd(i, 9) * 20}deg`, '--r': 34 * (p.reach || 1) * ctx.scale,
      animation: `lgiSpark ${480 * ctx.speed}ms cubic-bezier(.15,.8,.3,1) ${rnd(i, 4) * 50}ms both` }} />
  }),
  // A shockwave ring (or one closing in).
  ring: (p, ctx) => {
    const c = colorOf(p, ctx)
    const s1 = (p.scale || 1.7) * ctx.scale
    return <div key={`rg${p.delay || 0}`} style={{ position: 'absolute', left: '50%', top: '50%', width: '72cqw', height: '72cqw', borderRadius: '50%', border: `${p.width || 3}px ${p.dashed ? 'dashed' : 'solid'} ${c}`, boxShadow: `0 0 2cqw ${c}`,
      '--s0': p.inward ? 2.4 : 0.2, '--s1': p.inward ? 0.1 : s1, animation: `lgiRing ${560 * ctx.speed}ms ${p.inward ? 'cubic-bezier(.6,0,.8,.4)' : 'ease-out'} ${p.delay || 0}ms both` }} />
  },
  // A red (or tinted) glow at the box's rim: the player got hurt.
  vignette: (p) => <div key="vg" style={{ position: 'absolute', inset: '-12%', background: `radial-gradient(closest-side, transparent 58%, ${p.color || '#ff2a2a'}c0 86%, transparent 100%)`, animation: 'lgiFade 650ms ease-out both' }} />,
  // Chronos: two clock hands sweep round the face, with afterimages.
  hands: (p, ctx) => [0, 1, 2].flatMap((g) => [
    <div key={`hm${g}`} style={{ position: 'absolute', left: '50%', top: '50%', width: '4cqw', height: `${48 * ctx.scale}cqw`, marginLeft: '-2cqw', transformOrigin: '50% 0', background: `linear-gradient(${ctx.color}, #fff)`, borderRadius: 6, boxShadow: `0 0 2cqw ${ctx.color}`, opacity: 1 - g * 0.3,
      '--r0': '-180deg', '--r1': '200deg', animation: `lgiSpin ${(p.ms || 620) * ctx.speed}ms cubic-bezier(.3,.9,.4,1) ${g * 45}ms both`, transform: 'translate(-50%, 0)' }} />,
    <div key={`hh${g}`} style={{ position: 'absolute', left: '50%', top: '50%', width: '7cqw', height: `${30 * ctx.scale}cqw`, marginLeft: '-3.5cqw', transformOrigin: '50% 0', background: ctx.accent, border: `1px solid ${ctx.color}`, borderRadius: 6, opacity: 1 - g * 0.3,
      '--r0': '-60deg', '--r1': '60deg', animation: `lgiSpin ${(p.ms || 620) * ctx.speed}ms ease-out ${g * 45}ms both` }} />,
  ]),
  // Glass or crystal shards flying out (or in), with a streak.
  shards: (p, ctx) => {
    const n = p.n || 10
    const reach = 46 * (p.reach || 1) * ctx.scale
    return Array.from({ length: n }, (_, i) => {
      const a = (Math.PI * 2 * i) / n + rnd(i, 11) * 0.4
      const r = reach * (0.7 + rnd(i, 13) * 0.5)
      const c = p.rainbow ? RAINBOW[i % RAINBOW.length] : colorOf(p, ctx)
      const x = Math.cos(a) * r
      const y = Math.sin(a) * r
      return fly(`sh${i}`, <div style={{ width: '100%', height: '100%', background: `linear-gradient(${c}, #fff)`, clipPath: 'polygon(50% 0, 100% 40%, 50% 100%, 0 40%)', filter: `drop-shadow(0 0 3px ${c})` }} />,
        p.inward ? { x0: x, y0: y, x1: 0, y1: 0, r0: deg(a) + 90, r1: deg(a) + 90, s0: 1, s1: 0.4, w: 6, ms: 520 * ctx.speed, delay: rnd(i, 17) * 80, ease: 'cubic-bezier(.6,0,.9,.5)' }
          : { x1: x, y1: y, r0: deg(a) + 90, r1: deg(a) + 90 + (rnd(i) - 0.5) * 200, s0: 0.5, s1: 1.1, w: 6 + rnd(i, 19) * 4, ms: 700 * ctx.speed, delay: rnd(i, 17) * 50 })
    })
  },
  // Particles raining from above the box.
  drops: (p, ctx) => Array.from({ length: p.n || 8 }, (_, i) => {
    const x = (rnd(i, 21) - 0.5) * 90
    return fly(`dr${i}`, <Glyph name={glyphOf(p, ctx)} color={colorOf(p, ctx)} accent={ctx.accent} />,
      { x0: x, y0: -58, x1: x + (rnd(i, 23) - 0.5) * 14, y1: 52, r0: (rnd(i, 25) - 0.5) * 60, r1: (rnd(i, 27) - 0.5) * 300, s0: 1, s1: 1, w: 12 * (p.size || 1), ms: 900 * ctx.speed, delay: rnd(i, 29) * 260, ease: 'cubic-bezier(.45,0,.8,.6)' })
  }),
  // Particles floating up and away.
  rise: (p, ctx) => Array.from({ length: p.n || 8 }, (_, i) => {
    const x = (rnd(i, 31) - 0.5) * 70
    return fly(`ri${i}`, <Glyph name={glyphOf(p, ctx)} color={colorOf(p, ctx)} accent={ctx.accent} />,
      { x0: x * 0.5, y0: 10 + rnd(i, 33) * 25, x1: x + (rnd(i, 35) - 0.5) * 30, y1: -70 - rnd(i, 37) * 20, r0: 0, r1: (rnd(i, 39) - 0.5) * 120, s0: 0.5, s1: 1.1, w: 11 * (p.size || 1), ms: 1050 * ctx.speed, delay: rnd(i, 41) * 220, ease: 'cubic-bezier(.2,.6,.4,1)' })
  }),
  // Conic rays turning behind the boss.
  rays: (p, ctx) => {
    const c = colorOf(p, ctx)
    const stops = p.rainbow ? RAINBOW.map((x, i) => `${x}cc ${i * 60}deg ${i * 60 + 8}deg, transparent ${i * 60 + 8}deg ${i * 60 + 30}deg`).join(', ') : null
    const n = p.n || 12
    return <div key="ry" style={{ position: 'absolute', left: '50%', top: '50%', width: '190cqw', height: '190cqw', borderRadius: '50%',
      background: stops ? `conic-gradient(${stops})` : `repeating-conic-gradient(${c}cc 0deg ${180 / n}deg, transparent ${180 / n}deg ${360 / n}deg)`,
      WebkitMaskImage: 'radial-gradient(circle, #000 22%, transparent 68%)', maskImage: 'radial-gradient(circle, #000 22%, transparent 68%)',
      '--r0': '0deg', '--r1': '45deg', '--s0': 0.25, '--s1': 1.4, animation: `lgiSpin ${1250 * ctx.speed}ms ease-out both` }} />
  },
  // Banshee: thick sound rings bursting out (or crushing in), blurred at the edge.
  scream: (p, ctx) => Array.from({ length: p.n || 3 }, (_, i) => {
    const c = colorOf(p, ctx)
    return <div key={`sc${i}`} style={{ position: 'absolute', left: '50%', top: '50%', width: '60cqw', height: '60cqw', borderRadius: '50%', border: `${2.2 - i * 0.3}cqw solid ${c}`, filter: 'blur(1px)', boxShadow: `0 0 3cqw ${c}, inset 0 0 3cqw ${c}`,
      '--s0': p.inward ? 2.6 : 0.25, '--s1': p.inward ? 0.1 : 2.4 * ctx.scale, animation: `lgiRing ${620 * ctx.speed}ms ${p.inward ? 'ease-in' : 'cubic-bezier(.1,.8,.3,1)'} ${i * 110}ms both` }} />
  }),
  // A column of light from far above.
  pillar: (p, ctx) => {
    const c = colorOf(p, ctx)
    return <div key="pl" style={{ position: 'absolute', left: '50%', top: '-90cqw', bottom: '-10cqw', width: `${70 * (p.width || 0.5) * ctx.scale}cqw`, transformOrigin: '50% 100%',
      background: `linear-gradient(90deg, transparent, ${c}cc 25%, #fff 50%, ${c}cc 75%, transparent)`, filter: `drop-shadow(0 0 3cqw ${c})`, animation: `lgiPillar ${900 * ctx.speed}ms cubic-bezier(.2,.8,.3,1) both` }} />
  },
  // A beam: straight down from above, a cone at the player, or a band across.
  beam: (p, ctx) => {
    const c = colorOf(p, ctx)
    const w = 70 * (p.width || 0.4) * ctx.scale * (p.small ? 0.6 : 1)
    if (p.dir === 'cone') {
      return <div key="bc" style={{ position: 'absolute', left: '50%', top: '42%', width: `${w * 1.6}cqw`, height: `${80 * ctx.scale}cqw`, transformOrigin: '50% 0',
        clipPath: 'polygon(44% 0, 56% 0, 100% 100%, 0 100%)', background: `linear-gradient(${c}, ${c}55 70%, transparent)`, filter: `drop-shadow(0 0 2cqw ${c})`, animation: `lgiCone ${720 * ctx.speed}ms cubic-bezier(.2,.8,.3,1) both` }} />
    }
    if (p.dir === 'across') {
      const bg = p.rainbow ? `linear-gradient(${RAINBOW.join(', ')})` : `linear-gradient(transparent, ${c}, #fff, ${c}, transparent)`
      return <div key="ba" style={{ position: 'absolute', left: '-10%', width: '120%', top: `${50 - w / 2}%`, height: `${w}cqw`, background: bg, boxShadow: `0 0 3cqw ${c}`, borderRadius: '2cqw', transformOrigin: '0 50%', animation: `lgiBand ${560 * ctx.speed}ms cubic-bezier(.3,.7,.3,1) both` }} />
    }
    return <div key="bd" style={{ position: 'absolute', left: '50%', top: '-100cqw', height: '160cqw', width: `${w}cqw`, transformOrigin: '50% 0',
      background: `linear-gradient(90deg, transparent, ${c} 18%, ${c} 40%, #fff 50%, ${c} 60%, ${c} 82%, transparent)`, filter: `drop-shadow(0 0 3cqw ${c}) drop-shadow(0 0 1px #0008)`, animation: `lgiPillar ${560 * ctx.speed}ms cubic-bezier(.1,.9,.3,1) both` }} />
  },
  // A huge glyph slams down from above (Titan's fist, the Berserker's axe).
  slam: (p, ctx) => <div key="sl" style={{ position: 'absolute', left: '50%', top: '50%', width: `${62 * ctx.scale}cqw`, height: `${62 * ctx.scale}cqw`, filter: `drop-shadow(0 0 2cqw ${ctx.color}) drop-shadow(0 1cqw 0 #0008)`,
    animation: `lgiSlam ${760 * ctx.speed}ms cubic-bezier(.5,0,.6,1) both` }}><Glyph name={glyphOf(p, ctx)} color={ctx.color} accent={ctx.accent} /></div>,
  // Jagged cracks running out from the impact.
  crack: (p, ctx) => {
    const n = p.n || 5
    const c = p.color || '#fff4dc'
    const lines = Array.from({ length: n }, (_, i) => {
      const a = (Math.PI * 2 * i) / n + rnd(i, 43)
      let x = 50
      let y = 50
      const pts = [[x, y]]
      for (let k = 0; k < 4; k++) { const r = 9 + rnd(i * 4 + k, 47) * 6; const b = a + (rnd(i * 4 + k, 49) - 0.5) * 0.9; x += Math.cos(b) * r; y += Math.sin(b) * r; pts.push([x, y]) }
      return <polyline key={i} points={pts.map((q) => q.join(',')).join(' ')} fill="none" stroke={c} strokeWidth={1.4 * ctx.scale} strokeLinejoin="round" strokeLinecap="round"
        style={{ '--len': 80, strokeDasharray: 80, filter: `drop-shadow(0 0 1px ${c})`, animation: `lgiDraw ${700 * ctx.speed}ms ease-out ${i * 30}ms both` }} />
    })
    return svgBox('ck', lines)
  },
  // Dust puffs rolling out along the ground.
  dust: (p, ctx) => Array.from({ length: p.n || 10 }, (_, i) => {
    const side = i % 2 ? 1 : -1
    const c = p.color || '#d8c8b0'
    return fly(`du${i}`, <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: `radial-gradient(circle, ${c}ee, ${c}00 70%)` }} />,
      { x0: side * 6, y0: 30, x1: side * (20 + rnd(i, 51) * 40), y1: 22 - rnd(i, 53) * 22, s0: 0.4, s1: 1.8, w: 14, ms: 820 * ctx.speed, delay: rnd(i, 55) * 120, ease: 'cubic-bezier(.1,.7,.3,1)', midOpacity: 0.8 })
  }),
  // The Vampire: two fangs stab down, blood beads where they bit.
  fangs: (p, ctx) => {
    const w = (p.small ? 18 : 28) * ctx.scale
    return [-1, 1].map((s) => (
      <div key={`fg${s}`} style={{ position: 'absolute', left: `calc(50% + ${s * w * 0.55}cqw)`, top: '30%', width: `${w}cqw`, height: `${w * 1.5}cqw`, marginLeft: `${-w / 2}cqw`,
        filter: `drop-shadow(0 0 1.5cqw ${ctx.color})`, animation: `lgiStab ${640 * ctx.speed}ms cubic-bezier(.4,0,.3,1) ${s > 0 ? 40 : 0}ms both` }}>
        <svg viewBox="0 0 20 30" width="100%" height="100%" aria-hidden="true"><path d="M2 0h16C17 12 14 22 10 30 6 22 3 12 2 0Z" fill="#fff6f0" stroke={ctx.color} strokeWidth="1.2" /></svg>
      </div>
    ))
  },
  // Parallel claw slashes.
  claws: (p, ctx) => {
    const n = p.n || 3
    const sz = p.small ? 0.7 : 1
    return Array.from({ length: n }, (_, i) => {
      const o = i - (n - 1) / 2
      return <div key={`cl${i}`} style={{ position: 'absolute', left: `${50 + o * 12}%`, top: `${50 - o * 4}%`, width: `${105 * sz * ctx.scale}cqw`, height: `${2.2 * sz * Math.sqrt(ctx.scale)}cqw`, borderRadius: 6,
        background: `linear-gradient(90deg, transparent, ${colorOf(p, ctx)} 25%, #fff 50%, ${colorOf(p, ctx)} 75%, transparent)`, boxShadow: `0 0 2cqw ${colorOf(p, ctx)}`, '--a': `${62 + (p.angle || 0)}deg`,
        animation: `lgiSlash ${520 * ctx.speed}ms cubic-bezier(.2,.9,.3,1) ${i * 55}ms both` }} />
    })
  },
  // Jaws snapping shut: rows of teeth closing vertically (Chimera, Cerberus) or from the sides (Hydra).
  bite: (p, ctx) => {
    const n = p.n || 1
    const s = (p.small ? 30 : 46) * ctx.scale
    const spots = n === 1 ? [[0, 0]] : n === 2 ? [[-16, -8], [16, 10]] : [[-22, -12], [0, 8], [22, -10]]
    return spots.flatMap(([x, y], i) => {
      const teeth = (flip) => <svg viewBox="0 0 60 20" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true" style={{ transform: flip ? 'scaleY(-1)' : undefined }}>
        <path d="M0 0h60v6l-5 13-5-13-5 13-5-13-5 13-5-13-5 13-5-13-5 13-5-13-5 13-5-13Z" fill="#fffaf0" stroke={ctx.color} strokeWidth="1.5" /></svg>
      const box = { position: 'absolute', width: `${s}cqw`, height: `${s * 0.36}cqw`, left: `calc(50% + ${x}cqw)`, marginLeft: `${-s / 2}cqw`, filter: `drop-shadow(0 0 1.5cqw ${ctx.color})` }
      const delay = i * 110
      if (p.dir === 'h') {
        // Side jaws: the row is turned upright inside a box that slides in from its side.
        return [-1, 1].map((side) => <div key={`bh${i}${side}`} style={{ ...box, top: `calc(50% + ${y}cqw)`, marginTop: `${-s * 0.18}cqw`, left: `calc(50% + ${x + side * s * 0.2}cqw)`, '--jx': `${side * s * 0.6}cqw`, '--jy': '0cqw', animation: `lgiJaw ${560 * ctx.speed}ms cubic-bezier(.5,0,.4,1) ${delay}ms both` }}>
          <div style={{ width: '100%', height: '100%', transform: `rotate(${side * -90}deg) scale(1.6)` }}>{teeth(false)}</div></div>)
      }
      return [-1, 1].map((side) => <div key={`bv${i}${side}`} style={{ ...box, top: `calc(50% + ${y}cqw + ${side < 0 ? -s * 0.34 : 0}cqw)`, '--jx': '0cqw', '--jy': `${side * s * 0.5}cqw`, animation: `lgiJaw ${560 * ctx.speed}ms cubic-bezier(.5,0,.4,1) ${delay}ms both` }}>{teeth(side > 0)}</div>)
    })
  },
  // A tail whip: a curved lash drawn fast with a crack at the tip.
  whip: (p, ctx) => svgBox('wp', [
    <path key="wu" d="M95 10C70 20 60 55 30 62S8 80 6 92" fill="none" stroke="#000a" strokeWidth={6.5 * ctx.scale} strokeLinecap="round" style={{ '--len': 140, strokeDasharray: 140, animation: `lgiDraw ${520 * ctx.speed}ms cubic-bezier(.5,0,.3,1) both` }} />,
    <path key="w" d="M95 10C70 20 60 55 30 62S8 80 6 92" fill="none" stroke={p.color || ctx.color} strokeWidth={4 * ctx.scale} strokeLinecap="round" style={{ '--len': 140, strokeDasharray: 140, animation: `lgiDraw ${520 * ctx.speed}ms cubic-bezier(.5,0,.3,1) both`, filter: `drop-shadow(0 0 2px ${ctx.color})` }} />,
    <circle key="t" cx="6" cy="92" r={6 * ctx.scale} fill="#fff" style={{ animation: `lgiFade ${300 * ctx.speed}ms ease-out ${300 * ctx.speed}ms both` }} />,
  ]),
  // Coins (or anything) shot up and raining back down.
  fountain: (p, ctx) => Array.from({ length: p.n || 16 }, (_, i) => {
    const x = (rnd(i, 61) - 0.5) * 110
    return fly(`fo${i}`, <Glyph name={glyphOf(p, ctx)} color={colorOf(p, ctx)} accent={ctx.accent} />,
      { x0: 0, y0: 10, xm: x * 0.6, ym: -60 - rnd(i, 63) * 25, x1: x, y1: 60, r0: 0, r1: 720 * (i % 2 ? 1 : -1), s0: 0.5, s1: 1, w: 11 * (p.size || 1), ms: 1150 * ctx.speed, delay: rnd(i, 65) * 200, ease: 'cubic-bezier(.3,.6,.6,1)' })
  }),
  // Confetti (or sprinkles) bursting and drifting.
  confetti: (p, ctx) => Array.from({ length: p.n || 16 }, (_, i) => {
    const a = (Math.PI * 2 * i) / (p.n || 16) + rnd(i, 71)
    const r = 45 * (p.reach || 1) * ctx.scale * (0.6 + rnd(i, 73) * 0.6)
    const c = CONFETTI[i % CONFETTI.length]
    return fly(`cf${i}`, <div style={{ width: '100%', height: p.sprinkles ? '30%' : '60%', borderRadius: p.sprinkles ? 9 : 1, background: c }} />,
      { x1: Math.cos(a) * r, y1: Math.sin(a) * r + 20, r0: rnd(i, 75) * 180, r1: rnd(i, 77) * 900, s0: 0.6, s1: 1, w: p.sprinkles ? 5 : 4, ms: 900 * ctx.speed, delay: rnd(i, 79) * 80 })
  }),
  // The Showman: playing cards thrown at the player, spinning.
  cards: (p, ctx) => Array.from({ length: p.n || 7 }, (_, i) => {
    const o = i - ((p.n || 7) - 1) / 2
    return fly(`cd${i}`, <Glyph name="card" color={ctx.color} accent={ctx.accent} />,
      { x0: 0, y0: -6, x1: o * 18 * ctx.scale, y1: 46 * ctx.scale, r0: o * 10, r1: o * 30 + 720, s0: 0.3, s1: 2.1, w: 12, ms: 600 * ctx.speed, delay: Math.abs(o) * 45, ease: 'cubic-bezier(.4,0,.6,1)' })
  }),
  // The Showman's knockout: the curtain falls.
  curtain: () => [
    <div key="cl" style={{ position: 'absolute', top: '-10%', bottom: '-10%', left: '-10%', width: '62%', background: 'repeating-linear-gradient(90deg, #8a0a2a 0 7cqw, #b0123a 7cqw 12cqw)', animation: 'lgiCurtainL 1300ms cubic-bezier(.5,0,.3,1) 250ms both' }} />,
    <div key="cr" style={{ position: 'absolute', top: '-10%', bottom: '-10%', right: '-10%', width: '62%', background: 'repeating-linear-gradient(90deg, #b0123a 0 5cqw, #8a0a2a 5cqw 12cqw)', animation: 'lgiCurtainR 1300ms cubic-bezier(.5,0,.3,1) 250ms both' }} />,
  ],
  // The Reaper: a scythe crescent sweeps across, with two afterimages.
  arc: (p, ctx) => [0, 1, 2].map((g) => (
    <div key={`ar${g}`} style={{ position: 'absolute', left: '50%', top: '50%', width: `${(p.small ? 70 : 110) * ctx.scale}cqw`, height: `${(p.small ? 70 : 110) * ctx.scale}cqw`, borderRadius: '50%',
      borderTop: `${(p.small ? 2.2 : 3.4) * ctx.scale}cqw solid ${g ? `${ctx.color}88` : '#ffffff'}`, borderLeft: `${1.2 * ctx.scale}cqw solid transparent`, borderRight: `${1.2 * ctx.scale}cqw solid transparent`,
      filter: `drop-shadow(0 0 2.5cqw ${ctx.color})`, opacity: 1 - g * 0.3, '--r0': p.reverse ? '160deg' : '-150deg', '--r1': p.reverse ? '-80deg' : '70deg',
      animation: `lgiSpin ${520 * ctx.speed}ms cubic-bezier(.3,.9,.3,1) ${g * 40}ms both` }} />
  )),
  // Liquid blobs bursting and splatting.
  splat: (p, ctx) => Array.from({ length: p.n || 6 }, (_, i) => {
    const a = (Math.PI * 2 * i) / (p.n || 6) + rnd(i, 81) * 0.6
    const r = (p.big ? 46 : 34) * (p.reach || 1) * ctx.scale * (0.6 + rnd(i, 83) * 0.5)
    const c = colorOf(p, ctx)
    return fly(`spl${i}`, <div style={{ width: '100%', height: '100%', borderRadius: '50% 45% 55% 50%', background: `radial-gradient(circle at 35% 35%, #fff, ${c} 45%, ${c}aa)` }} />,
      { x1: Math.cos(a) * r, y1: Math.sin(a) * r, s0: 0.5, s1: 1.4, w: (p.big ? 14 : 9) * (0.7 + rnd(i, 85) * 0.6), ms: 640 * ctx.speed, delay: rnd(i, 87) * 60 })
  }),
  // Leviathan: a wave crest sweeps across the box.
  wave: (p, ctx) => {
    const h = (p.small ? 40 : 70) * ctx.scale
    return <div key="wv" style={{ position: 'absolute', left: '-30%', width: '160%', top: `${55 - h / 2}%`, height: `${h}cqw`, animation: `lgiSweep ${680 * ctx.speed}ms cubic-bezier(.3,.6,.3,1) both` }}>
      <svg viewBox="0 0 160 70" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 70V40C20 40 30 10 55 8c18-1 26 18 18 26 16-4 18-22 34-22 20 0 30 28 53 28V70Z" fill={ctx.color} opacity=".85" />
        <path d="M0 48C20 48 30 20 55 18c15-1 20 12 14 20" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      </svg></div>
  },
  // A whirlpool: rings spiralling inward.
  whirl: (p, ctx) => Array.from({ length: p.n || 3 }, (_, i) => (
    <div key={`wh${i}`} style={{ position: 'absolute', left: '50%', top: '62%', width: '90cqw', height: '90cqw', borderRadius: '50%', border: `2.4cqw dashed ${i % 2 ? '#ffffff' : ctx.color}`, boxShadow: `0 0 2cqw ${ctx.color}`,
      '--r0': '0deg', '--r1': `${-540 - i * 120}deg`, '--s0': 1.3 - i * 0.2, '--s1': 0.05, transform: 'scaleY(.35)', animation: `lgiSpin ${1100 * ctx.speed}ms cubic-bezier(.5,0,.7,1) ${i * 90}ms both` }} />
  )),
  // A missile flying at the player (the Lich's skull, a needle), growing as it comes.
  projectile: (p, ctx) => <div key="pj" style={{ position: 'absolute', left: '50%', top: '50%', width: '30cqw', height: '30cqw', filter: `drop-shadow(0 0 3cqw ${ctx.color})`,
    animation: `lgiProjectile ${620 * ctx.speed}ms cubic-bezier(.5,0,.8,.6) both` }}><Glyph name={glyphOf(p, ctx)} color={ctx.color} accent={ctx.accent} /></div>,
  // Cerberus: a chain lashes out, link by link.
  lash: (p, ctx) => svgBox('ls', [
    <path key="cu" d={p.small ? 'M10 20C40 30 55 55 80 70' : 'M2 8C30 20 45 60 70 66S96 80 98 96'} fill="none" stroke="#000a" strokeWidth={6.5 * ctx.scale} strokeDasharray="6 3" strokeLinecap="round" style={{ animation: `lgiFade ${600 * ctx.speed}ms ease-out both` }} />,
    <path key="c" d={p.small ? 'M10 20C40 30 55 55 80 70' : 'M2 8C30 20 45 60 70 66S96 80 98 96'} fill="none" stroke={ctx.color} strokeWidth={4 * ctx.scale} strokeDasharray="6 3" strokeLinecap="round"
      style={{ filter: `drop-shadow(0 0 2px ${ctx.color})`, animation: `lgiFade ${600 * ctx.speed}ms ease-out both`, clipPath: 'inset(0 0 0 0)' }} />,
    <path key="c2" d={p.small ? 'M10 20C40 30 55 55 80 70' : 'M2 8C30 20 45 60 70 66S96 80 98 96'} fill="none" stroke="#fff" strokeWidth={1.2 * ctx.scale} strokeLinecap="round"
      style={{ '--len': 160, strokeDasharray: 160, animation: `lgiDraw ${480 * ctx.speed}ms cubic-bezier(.5,0,.3,1) both` }} />,
  ]),
  // Tempest: lightning from the top, flickering.
  bolt: (p, ctx) => {
    const n = p.n || 1
    const bolts = Array.from({ length: n }, (_, i) => {
      const x0 = n === 1 ? 50 : 20 + (60 * i) / (n - 1)
      let x = x0
      const pts = [[x, -40]]
      for (let y = -25; y <= 60; y += 12) { x += (rnd(i * 10 + y, 91) - 0.5) * 18; pts.push([x, y]) }
      const d = pts.map((q) => q.join(',')).join(' ')
      return <g key={i} style={{ animation: `lgiFlicker ${620 * ctx.speed}ms steps(1, end) ${i * 70}ms both` }}>
        <polyline points={d} fill="none" stroke={ctx.color} strokeWidth={5 * ctx.scale} strokeLinejoin="bevel" opacity=".6" />
        <polyline points={d} fill="none" stroke="#fff" strokeWidth={2 * ctx.scale} strokeLinejoin="bevel" />
      </g>
    })
    return svgBox('bt', bolts, { filter: `drop-shadow(0 0 4px ${ctx.color})` })
  },
  // Curling tentacles lashing in from the edges.
  tendrils: (p, ctx) => {
    const c = colorOf(p, ctx)
    const paths = ['M-5 30C20 20 25 55 50 50', 'M105 25C80 30 78 60 52 52', 'M-5 85C20 70 35 75 48 56', 'M105 88C85 72 65 78 54 57']
    return svgBox('td', paths.slice(0, p.n || 2).map((d, i) => (
      <g key={i}>
        <path d={d} fill="none" stroke="#000a" strokeWidth={8 * ctx.scale} strokeLinecap="round" style={{ '--len': 90, strokeDasharray: 90, animation: `lgiDraw ${600 * ctx.speed}ms cubic-bezier(.4,0,.3,1) ${i * 70}ms both` }} />
        <path d={d} fill="none" stroke={c} strokeWidth={5 * ctx.scale} strokeLinecap="round" style={{ '--len': 90, strokeDasharray: 90, filter: `drop-shadow(0 0 2px ${c})`, animation: `lgiDraw ${600 * ctx.speed}ms cubic-bezier(.4,0,.3,1) ${i * 70}ms both` }} />
      </g>
    )))
  },
  // The Berserker: one massive slash, white hot, with an afterimage.
  cleave: (p, ctx) => [0, 1].map((g) => (
    <div key={`cv${g}`} style={{ position: 'absolute', left: '50%', top: '50%', width: `${(p.small ? 100 : 150) * ctx.scale}cqw`, height: `${(p.small ? 4 : 7) * ctx.scale}cqw`, borderRadius: '50%',
      background: `linear-gradient(90deg, transparent, ${ctx.color} 20%, #fff 50%, ${ctx.color} 80%, transparent)`, boxShadow: `0 0 4cqw ${ctx.color}`, opacity: g ? 0.45 : 1, '--a': `${-40 + g * 6}deg`,
      animation: `lgiSlash ${560 * ctx.speed}ms cubic-bezier(.15,1,.3,1) ${g * 60}ms both` }} />
  )),
  // Inferno: a cone of fire breathed at the player.
  breath: (p, ctx) => <div key="br" style={{ position: 'absolute', left: '50%', top: '38%', width: `${(p.small ? 60 : 110) * ctx.scale}cqw`, height: `${(p.small ? 50 : 90) * ctx.scale}cqw`, transformOrigin: '50% 0',
    clipPath: 'polygon(42% 0, 58% 0, 100% 100%, 0 100%)', background: `radial-gradient(ellipse at 50% 0, #fff 0, #ffe08a 18%, ${ctx.color} 45%, #c81e00 75%, transparent 100%)`,
    animation: `lgiCone ${760 * ctx.speed}ms cubic-bezier(.2,.8,.3,1) both, lgiFlicker ${760 * ctx.speed}ms steps(1, end) both` }} />,
  // The Swarm Queen: a volley of stingers (darts) fired out.
  volley: (p, ctx) => Array.from({ length: p.n || 10 }, (_, i) => {
    const a = p.scatter ? (Math.PI * 2 * i) / (p.n || 10) : Math.PI / 2 + (rnd(i, 101) - 0.5) * 1.6
    const r = (p.small ? 34 : 60) * ctx.scale * (0.7 + rnd(i, 103) * 0.4)
    return fly(`vl${i}`, <svg viewBox="0 0 30 10" width="100%" height="100%" aria-hidden="true" style={{ overflow: 'visible', filter: `drop-shadow(0 0 2px ${ctx.color})` }}><path d="M0 4.2 20 3 30 5 20 7 0 5.8Z" fill="#fff" stroke="#000b" strokeWidth=".8" /><path d="M20 3.4 30 5 20 6.6Z" fill={ctx.accent} /></svg>,
      { x1: Math.cos(a) * r, y1: Math.sin(a) * r, r0: deg(a), r1: deg(a), s0: 0.7, s1: 1.3, w: 24, ms: 460 * ctx.speed, delay: rnd(i, 105) * 220, ease: 'cubic-bezier(.3,.6,.5,1)' })
  }),
  // Moonmaw: three curved talons swoop through.
  talons: (p, ctx) => [-1, 0, 1].map((o, i) => (
    <div key={`tl${i}`} style={{ position: 'absolute', left: `${50 + o * 13}%`, top: `${50 + o * 3}%`, width: `${(p.small ? 60 : 90) * ctx.scale}cqw`, height: `${(p.small ? 60 : 90) * ctx.scale}cqw`, borderRadius: '50%',
      borderBottom: `${(p.small ? 1.6 : 2.6) * ctx.scale}cqw solid #ffffff`, borderLeft: `${0.8 * ctx.scale}cqw solid transparent`, borderRight: `${0.8 * ctx.scale}cqw solid transparent`,
      filter: `drop-shadow(0 0 2cqw ${ctx.color})`, '--r0': '-70deg', '--r1': '40deg', animation: `lgiSpin ${480 * ctx.speed}ms cubic-bezier(.3,.9,.3,1) ${i * 50}ms both` }} />
  )),
  // Moonmaw's knockout: a dark disc with a burning rim slides over.
  eclipse: (p, ctx) => <div key="ec" style={{ position: 'absolute', left: '50%', top: '50%', width: '96cqw', height: '96cqw', borderRadius: '50%', background: 'radial-gradient(circle, #05030f 62%, #1a1240 70%, transparent 72%)',
    boxShadow: `0 0 4cqw 1cqw ${ctx.color}`, animation: `lgiEclipse ${1300 * ctx.speed}ms cubic-bezier(.3,.7,.3,1) both` }} />,
  // The Puppeteer: strings drop from above; yanked, or cut and falling.
  strings: (p, ctx) => Array.from({ length: p.n || 4 }, (_, i) => {
    const x = 20 + (60 * i) / Math.max(1, (p.n || 4) - 1)
    return <div key={`st${i}`} style={{ position: 'absolute', left: `${x}%`, top: '-60%', width: '0.7cqw', height: '110%', background: `linear-gradient(transparent, #fff, ${ctx.color})`, boxShadow: `0 0 1cqw ${ctx.color}`, transformOrigin: '50% 0',
      animation: p.cut ? `lgiMove ${900 * ctx.speed}ms ease-in ${i * 40}ms both` : `lgiDrop ${620 * ctx.speed}ms cubic-bezier(.3,.8,.3,1) ${i * 45}ms both`,
      '--x0': 0, '--y0': 0, '--x1': (rnd(i, 111) - 0.5) * 10, '--y1': 60, '--r0': '0deg', '--r1': `${(rnd(i, 113) - 0.5) * 40}deg`, '--s0': 1, '--s1': 1 }} />
  }),
  // The Sugar Queen's knockout: syrup drips down from the top.
  drip: (p, ctx) => Array.from({ length: p.n || 7 }, (_, i) => (
    <div key={`dp${i}`} style={{ position: 'absolute', left: `${8 + (84 * i) / Math.max(1, (p.n || 7) - 1)}%`, top: '-5%', width: `${5 + rnd(i, 121) * 4}cqw`, height: `${30 + rnd(i, 123) * 40}cqw`, transformOrigin: '50% 0',
      borderRadius: '0 0 50% 50%', background: `linear-gradient(${colorOf(p, ctx)}, #fff 85%, ${colorOf(p, ctx)})`, animation: `lgiDrip ${1100 * ctx.speed}ms cubic-bezier(.4,0,.6,1) ${rnd(i, 125) * 200}ms both` }} />
  )),
  // The Kitsune: foxfire orbs circle, then dart in (or fly out).
  orbit: (p, ctx) => <div key="ob" style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, animation: `lgiOrbit ${900 * ctx.speed}ms cubic-bezier(.3,.6,.4,1) both` }}>
    {Array.from({ length: p.n || 4 }, (_, i) => (
      <div key={i} style={{ position: 'absolute', left: 0, top: 0, transform: `rotate(${(360 / (p.n || 4)) * i}deg)` }}>
        <div style={{ width: '16cqw', height: '16cqw', marginLeft: '-8cqw', marginTop: '-8cqw', borderRadius: '50% 50% 50% 0', background: `radial-gradient(circle at 60% 40%, #fff 15%, ${colorOf(p, ctx)} 45%, ${colorOf(p, ctx)}00 75%)`, filter: `drop-shadow(0 0 2cqw ${colorOf(p, ctx)})`, '--r': 34 * ctx.scale,
          animation: `${p.out ? 'lgiOrbitOut' : 'lgiOrbitIn'} ${900 * ctx.speed}ms cubic-bezier(.5,0,.6,1) both` }} />
      </div>
    ))}
  </div>,
  // The Ophanim: wheels of light turning; slicing out at the player, or collapsing.
  halo: (p, ctx) => Array.from({ length: p.n || 2 }, (_, i) => (
    <div key={`ha${i}`} style={{ position: 'absolute', left: '50%', top: '50%', width: '80cqw', height: '80cqw', borderRadius: '50%', border: `${(p.small ? 1 : 1.6)}cqw solid ${i % 2 ? '#fff6d0' : ctx.color}`, boxShadow: `0 0 3cqw ${ctx.color}`,
      '--r0': `${i * 60}deg`, '--r1': `${i * 60 + (i % 2 ? -240 : 240)}deg`, '--s0': p.collapse ? 1.4 : 0.4, '--s1': p.collapse ? 0.05 : (p.slice ? 2 : 1.2) * ctx.scale,
      animation: `lgiHalo ${(p.slice ? 560 : 820) * ctx.speed}ms cubic-bezier(.3,.7,.3,1) ${i * 70}ms both` }} />
  )),
  // The Void: everything pulled into the centre.
  pull: (p, ctx) => Array.from({ length: p.n || 14 }, (_, i) => {
    const a = (Math.PI * 2 * i) / (p.n || 14) + rnd(i, 131)
    const r = (p.small ? 40 : 62) * (0.7 + rnd(i, 133) * 0.5)
    return fly(`pu${i}`, <Glyph name={glyphOf(p, ctx)} color={i % 3 ? ctx.color : '#ffffff'} accent={ctx.accent} />,
      { x0: Math.cos(a) * r, y0: Math.sin(a) * r, x1: 0, y1: 0, r0: 0, r1: 360, s0: 1.1, s1: 0.1, w: 8, ms: 720 * ctx.speed, delay: rnd(i, 135) * 160, ease: 'cubic-bezier(.6,0,.9,.6)' })
  }),
  // Shared: the white flash where a hit lands (every hit, bigger on a critical).
  flash: (p) => <div key="fl" style={{ position: 'absolute', left: '50%', top: '46%', width: `${p.big ? 56 : 38}cqw`, height: `${p.big ? 56 : 38}cqw`, filter: 'drop-shadow(0 0 2cqw #fff)', '--r0': '0deg', '--r1': '35deg', '--s0': 0.2, '--s1': 1.3,
    animation: `lgiSpin ${p.big ? 340 : 260}ms cubic-bezier(.1,.9,.3,1) both` }}><Glyph name="star4" color="#ffffff" accent="#ffffff" outline={false} /></div>,
  // Shared: a parry (blocked attack), a shield bubble, a heart back.
  parry: (p, ctx) => [45, -45].map((a, i) => (
    <div key={`pa${i}`} style={{ position: 'absolute', left: '50%', top: '50%', width: `${80 * ctx.scale}cqw`, height: '2.4cqw', borderRadius: 6, background: `linear-gradient(90deg, transparent, ${p.color || '#8fe3ff'}, #fff, ${p.color || '#8fe3ff'}, transparent)`, boxShadow: `0 0 2.5cqw ${p.color || '#8fe3ff'}`,
      '--a': `${a}deg`, animation: `lgiSlash 520ms cubic-bezier(.2,.9,.3,1) ${180 + i * 40}ms both` }} />
  )),
  bubble: () => <div key="bb" style={{ position: 'absolute', left: '50%', top: '50%', width: '96cqw', height: '96cqw', borderRadius: '50%', border: '1.2cqw solid #6fc3ff', boxShadow: '0 0 4cqw #6fc3ff, inset 0 0 6cqw #6fc3ff88',
    background: 'radial-gradient(circle at 35% 30%, #ffffff55, transparent 30%)', animation: 'lgiBubble 900ms ease-out 150ms both' }} />,
  heart: () => fly('hrt', <div style={{ fontSize: '20cqw', lineHeight: 1, textAlign: 'center' }}>💖</div>, { x0: 0, y0: 30, x1: 0, y1: -55, s0: 0.4, s1: 1.2, w: 15, ms: 1150, ease: 'cubic-bezier(.22,1,.36,1)' }),

  // ── MOMENT PARTS: what makes a critical, a Sharpen, a heavy blow, a block, a save and Second wind read as their own
  // moment (StrikeFxLayer). Each takes the boss's colors and its own params, so no two bosses play one the same way.
  // A critical: a jagged star (p.points tips, p.spin degrees) slams open behind the hit, a white star inside it.
  starburst: (p, ctx) => {
    const n = p.points || 8
    const pts = Array.from({ length: n * 2 }, (_, i) => {
      const a = (Math.PI * i) / n - Math.PI / 2
      const r = i % 2 ? 50 * (p.inner || 0.42) : 50
      return `${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`
    }).join(' ')
    const c = colorOf(p, ctx)
    return [0, 1].map((g) => (
      <div key={`st${g}`} style={{ position: 'absolute', left: '50%', top: '48%', width: `${(g ? 34 : 84) * ctx.scale}cqw`, height: `${(g ? 34 : 84) * ctx.scale}cqw`, filter: `drop-shadow(0 0 2.5cqw ${c})`,
        '--r0': `${g ? -(p.spin || 40) : 0}deg`, '--r1': `${g ? 0 : p.spin || 40}deg`, '--s0': 0.15, '--s1': g ? 1.15 : 1.35, animation: `lgiSpin ${(g ? 420 : 560) * ctx.speed}ms cubic-bezier(.1,.9,.25,1) ${g * 50}ms both` }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true"><polygon points={pts} fill={g ? '#ffffff' : `${c}4d`} stroke={g ? c : '#ffffff'} strokeWidth={g ? 2 : 3.5} strokeLinejoin="round" opacity={g ? 0.9 : 1} /></svg>
      </div>
    ))
  },
  // A Sharpen: p.n honed blades sweep across at p.angle, each leaving a white edge, a gold glint at the end.
  blade: (p, ctx) => {
    const c = colorOf(p, ctx)
    return Array.from({ length: p.n || 2 }, (_, i) => (
      <div key={`bl${i}`} style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, filter: `drop-shadow(0 0 0.5cqw #000000) drop-shadow(0 0 1.6cqw ${c})`, transform: `rotate(${(p.angle ?? -30) + i * (p.fan ?? 24)}deg)` }}>
        <div style={{ position: 'absolute', left: '-75cqw', top: `${-3.6 - i * 0.3}cqw`, width: '150cqw', height: `${7.2 + i * 0.6}cqw`, clipPath: 'polygon(0 50%, 14% 0, 100% 38%, 100% 62%, 14% 100%)',
          background: `linear-gradient(90deg, transparent 0%, ${c} 30%, #ffffff 58%, ${c} 78%, transparent 100%)`, boxShadow: `0 0 3cqw ${c}`,
          animation: `lgiBlade ${(p.ms || 460) * ctx.speed}ms cubic-bezier(.2,.9,.3,1) ${i * (p.gap || 90)}ms both` }} />
      </div>
    ))
  },
  // Small four-point twinkles popping at fixed spots (a fresh edge, a holy glint, a sugar sparkle).
  glint: (p, ctx) => Array.from({ length: p.n || 5 }, (_, i) => {
    const x = (rnd(i, 141) - 0.5) * 80
    const y = (rnd(i, 143) - 0.5) * 80
    const s = (p.size || 1) * (8 + rnd(i, 145) * 8)
    return <div key={`gl${i}`} style={{ position: 'absolute', left: `calc(50% + ${x}cqw)`, top: `calc(50% + ${y}cqw)`, width: `${s}cqw`, height: `${s}cqw`, filter: `drop-shadow(0 0 1.2cqw ${colorOf(p, ctx)})`,
      '--r0': '0deg', '--r1': '90deg', '--s0': 0, '--s1': 1, animation: `lgiTwinkle ${520 * ctx.speed}ms ease-out ${120 + rnd(i, 147) * 380}ms both` }}><Glyph name="star4" color={i % 2 ? '#ffffff' : colorOf(p, ctx)} accent={ctx.accent} outline={false} /></div>
  }),
  // A heavy blow: the ground ripples out under the boss in p.n flat rings, rubble jumping off it.
  quake: (p, ctx) => {
    const c = colorOf(p, ctx)
    return [
      ...Array.from({ length: p.n || 2 }, (_, i) => (
        <div key={`qk${i}`} style={{ position: 'absolute', left: '50%', top: `${p.top || 80}%`, width: '90cqw', height: '22cqw', borderRadius: '50%', border: `${2 - i * 0.5}cqw solid ${c}`, boxShadow: `0 0 3cqw ${c}`,
          animation: `lgiQuake ${(620 + i * 120) * ctx.speed}ms cubic-bezier(.1,.8,.3,1) ${i * 130}ms both` }} />
      )),
      ...Array.from({ length: p.rubble ?? 6 }, (_, i) => {
        const x = (i - ((p.rubble ?? 6) - 1) / 2) * 13
        return fly(`qr${i}`, <div style={{ width: '100%', height: '100%', background: i % 2 ? c : ctx.accent, clipPath: 'polygon(20% 0, 100% 30%, 80% 100%, 0 70%)' }} />,
          { x0: x * 0.6, y0: 32, xm: x, ym: -6 - rnd(i, 151) * 16, x1: x * 1.4, y1: 40, r0: 0, r1: (rnd(i, 153) - 0.5) * 400, s0: 0.6, s1: 1, w: 5, ms: 760 * ctx.speed, delay: 60 + rnd(i, 155) * 90, ease: 'linear' })
      }),
    ]
  },
  // A block: a p.sides-sided barrier sigil draws itself in a heartbeat, flashes and breaks apart.
  sigil: (p, ctx) => {
    const n = p.sides || 6
    const poly = (r, rot) => Array.from({ length: n }, (_, i) => {
      const a = (Math.PI * 2 * i) / n + ((rot || 0) * Math.PI) / 180 - Math.PI / 2
      return `${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`
    }).join(' ')
    const c = colorOf(p, ctx)
    return (
      <div key="sg" style={{ position: 'absolute', left: '50%', top: '50%', width: `${84 * ctx.scale}cqw`, height: `${84 * ctx.scale}cqw`, filter: `drop-shadow(0 0 2cqw ${c})`,
        '--r0': `${p.rot || 0}deg`, '--r1': `${(p.rot || 0) + (p.turn ?? 30)}deg`, '--s0': 0.6, '--s1': 1.15, animation: `lgiSpin ${780 * ctx.speed}ms cubic-bezier(.2,.8,.3,1) both` }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <polygon points={poly(46, 0)} fill={`${c}22`} stroke={c} strokeWidth="3" strokeLinejoin="round" style={{ '--len': 320, strokeDasharray: 320, animation: 'lgiDraw 700ms ease-out both' }} />
          <polygon points={poly(30, 180 / n)} fill="none" stroke="#ffffff" strokeWidth="2" style={{ '--len': 220, strokeDasharray: 220, animation: 'lgiDraw 640ms ease-out 80ms both' }} />
        </svg>
      </div>
    )
  },
  // A save: the boss's own glyphs fly at the player, hit the dome and glance off outward.
  deflect: (p, ctx) => Array.from({ length: p.n || 6 }, (_, i) => {
    const a = (Math.PI * (p.from === 'side' ? 1 : 1.5)) + ((i - ((p.n || 6) - 1) / 2) * 0.55)
    const far = 80
    const hit = 44
    return fly(`df${i}`, <Glyph name={glyphOf(p, ctx)} color={colorOf(p, ctx)} accent={ctx.accent} />,
      { x0: Math.cos(a) * far, y0: Math.sin(a) * far, xm: Math.cos(a) * hit, ym: Math.sin(a) * hit, x1: Math.cos(a + (i % 2 ? 0.9 : -0.9)) * far * 1.1, y1: Math.sin(a + (i % 2 ? 0.9 : -0.9)) * far * 1.1,
        r0: 0, r1: (i % 2 ? 1 : -1) * 260, s0: 1.2, s1: 0.9, w: 18, ms: 760 * ctx.speed, delay: 60 + i * 55, ease: 'linear' })
  }),
  // Second wind: p.n curved gusts sweep up around the boss.
  gust: (p, ctx) => {
    const c = colorOf(p, ctx)
    return (
      <div key="gu" style={{ position: 'absolute', left: '50%', top: '50%', width: '110cqw', height: '110cqw', '--r0': `${p.rot || 0}deg`, '--r1': `${(p.rot || 0) + (p.turn ?? -70)}deg`, '--s0': 0.7, '--s1': 1.1,
        animation: `lgiSpin ${1000 * ctx.speed}ms cubic-bezier(.3,.7,.4,1) both`, filter: `drop-shadow(0 0 1.2cqw ${c})` }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          {Array.from({ length: p.n || 3 }, (_, i) => {
            const r = 22 + i * 8
            const a0 = (i * 120 * Math.PI) / 180
            const d = `M ${50 + Math.cos(a0) * r} ${50 + Math.sin(a0) * r} A ${r} ${r} 0 0 1 ${50 + Math.cos(a0 + 2.2) * r} ${50 + Math.sin(a0 + 2.2) * r}`
            return <path key={i} d={d} fill="none" stroke={c} opacity={1 - i * 0.18} strokeWidth={5 - i * 0.7} strokeLinecap="round" style={{ '--len': 140, strokeDasharray: 140, animation: `lgiDraw ${760 * ctx.speed}ms ease-out ${i * 110}ms both` }} />
          })}
        </svg>
      </div>
    )
  },
  // A heartbeat: lub-dub pulses of soft light (Second wind's life coming back).
  pulse: (p, ctx) => [0, 1].map((i) => (
    <div key={`pu${i}`} style={{ position: 'absolute', left: '50%', top: '50%', width: '70cqw', height: '70cqw', borderRadius: '50%', background: `radial-gradient(circle, ${colorOf(p, ctx)}aa, ${colorOf(p, ctx)}33 55%, transparent 70%)`,
      animation: `lgiPulse ${900 * ctx.speed}ms ease-out ${i * 220}ms both` }} />
  )),
}
export const PART_NAMES = Object.keys(PARTS)
