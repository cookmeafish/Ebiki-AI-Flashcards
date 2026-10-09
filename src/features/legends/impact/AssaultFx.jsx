// THE BOSS'S ATTACK ON THE PLAYER, drawn (impact/assault.js says which per boss). A layer over the WHOLE arena card
// (never the question): the attack leaves the boss box, travels to the heart it takes, and lands on the screen; the
// heart shatters and the card's edges flash red. Geometry comes measured from the card (`geo`, layout px of this
// layer: W, H, the boss's center bx/by, the heart's center tx/ty, S = the attack's base size). CSS and inline SVG only,
// deterministic (no randomness at render), composited transforms and opacity. BossArena mounts it only while effects
// may play (not in focus mode, Still bosses or reduced motion) and fades it with the next question.
import { Glyph } from './glyphs'
import { impactFor } from './styles'
import { assaultFor, landAt, ASSAULT } from './assault'

export const ASSAULT_CSS = `
@keyframes lgaMove { from { transform: translate(0, 0) } to { transform: translate(var(--dx), var(--dy)) } }
@keyframes lgaArcY { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(var(--arc)) } }
@keyframes lgaSpin { from { transform: rotate(0) } to { transform: rotate(var(--spin)) } }
@keyframes lgaGrow { from { transform: scale(var(--s0)) } to { transform: scale(var(--s1)) } }
@keyframes lgaGone { to { opacity: 0 } }
@keyframes lgaIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes lgaBeam { 0% { transform: scaleX(0); opacity: 1 } 35% { transform: scaleX(1); opacity: 1 } 70% { opacity: 1 } 100% { transform: scaleX(1); opacity: 0 } }
@keyframes lgaChain { 0% { transform: scaleX(0) } 55% { transform: scaleX(1) } 75% { transform: scaleX(.92) } 100% { transform: scaleX(0) } }
@keyframes lgaRing { 0% { transform: scale(.05); opacity: 1 } 100% { transform: scale(1); opacity: 0 } }
@keyframes lgaFlick { 0%, 30%, 62% { opacity: 1 } 16%, 46% { opacity: .15 } 80% { opacity: .9 } 100% { opacity: 0 } }
@keyframes lgaDash { from { stroke-dashoffset: var(--len) } to { stroke-dashoffset: 0 } }
@keyframes lgaSlash { 0% { transform: scaleX(0); opacity: 1 } 22% { transform: scaleX(1); opacity: 1 } 40% { opacity: 1 } 100% { transform: scaleX(1); opacity: .55 } }
@keyframes lgaSlam { 0% { transform: scale(3.2); opacity: 0 } 30% { transform: scale(.9); opacity: 1 } 45% { transform: scale(1.08) } 60%, 100% { transform: scale(1); opacity: 1 } }
@keyframes lgaBurst { 0% { transform: translate(0, 0) scale(1); opacity: 1 } 100% { transform: translate(var(--hx), var(--hy)) scale(.4); opacity: 0 } }
@keyframes lgaRay { 0% { transform: rotate(var(--r)) scaleX(0); opacity: 1 } 40% { transform: rotate(var(--r)) scaleX(1); opacity: 1 } 100% { transform: rotate(var(--r)) scaleX(1.1); opacity: 0 } }
@keyframes lgaJawTop { 0% { transform: translateY(-105%) } 30% { transform: translateY(0) } 36% { transform: translateY(-6%) } 42%, 70% { transform: translateY(0) } 100% { transform: translateY(-105%) } }
@keyframes lgaJawBot { 0% { transform: translateY(105%) } 30% { transform: translateY(0) } 36% { transform: translateY(6%) } 42%, 70% { transform: translateY(0) } 100% { transform: translateY(105%) } }
@keyframes lgaFlame { 0% { transform: translateY(100%) scaleY(.6) } 30% { transform: translateY(0) scaleY(1.1) } 50% { transform: translateY(4%) scaleY(.92) } 70% { transform: translateY(0) scaleY(1.05) } 100% { transform: translateY(100%) scaleY(.7) } }
@keyframes lgaCreep { 0% { transform: scale(0); opacity: 1 } 45% { transform: scale(1); opacity: 1 } 80% { opacity: 1 } 100% { transform: scale(1); opacity: 0 } }
@keyframes lgaFlood { 0% { transform: translateY(100%) } 40% { transform: translateY(0) } 55% { transform: translateY(5%) } 75% { transform: translateY(0) } 100% { transform: translateY(100%) } }
@keyframes lgaStamp { 0% { transform: scale(2.4) rotate(-120deg); opacity: 0 } 30% { transform: scale(.92) rotate(0); opacity: 1 } 40% { transform: scale(1.04) rotate(4deg) } 100% { transform: scale(1) rotate(28deg); opacity: 1 } }
@keyframes lgaDrip { 0% { transform: translateY(-30px) scaleY(.6); opacity: 0 } 15% { opacity: 1 } 100% { transform: translateY(var(--fall)) scaleY(1.4); opacity: .9 } }
@keyframes lgaStreak { from { transform: scaleY(0) } to { transform: scaleY(1) } }
@keyframes lgaHalf { 0% { transform: translate(0, 0) rotate(0); opacity: 1 } 100% { transform: translate(var(--hx), var(--hy)) rotate(var(--hr)); opacity: 0 } }
@keyframes lgaVig { 0% { opacity: 0 } 18% { opacity: 1 } 100% { opacity: 0 } }
@keyframes lgaHitShake1 { 0%, 100% { transform: translate(0, 0) } 15% { transform: translate(-7px, 3px) } 30% { transform: translate(6px, -4px) } 45% { transform: translate(-5px, 2px) } 60% { transform: translate(4px, 1px) } 80% { transform: translate(-2px, -1px) } }
@keyframes lgaHitShake2 { 0%, 100% { transform: translate(0, 0) } 10% { transform: translate(-12px, 6px) } 22% { transform: translate(11px, -7px) } 34% { transform: translate(-9px, 4px) } 48% { transform: translate(8px, 3px) } 62% { transform: translate(-5px, -3px) } 80% { transform: translate(3px, 1px) } }
`
// The card shakes when the blow LANDS (not when the boss winds up).
export const hitShake = (travel, big) => `lgaHitShake${big ? 2 : 1} ${big ? 520 : 380}ms linear ${landAt(travel)}ms`

// A small deterministic scatter (no randomness at render: the same strike always looks the same).
const rnd = (i, s = 1) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x) }
const ms = (n) => `${Math.round(n)}ms`
const at = (x, y, w, h, extra = {}) => ({ position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, ...extra })
const fadeOut = (start) => ({ animation: `lgaGone ${ASSAULT.fadeMs}ms ease-in ${ms(start)} both` })

// ── THE TRAVEL: from the boss (bx, by) to the heart (tx, ty) ──
function moving(c, { size, delay = 0, dur, ease = 'cubic-bezier(.45,0,.85,.55)', arc = 0, spin = 0, grow = null, off = [0, 0], child }) {
  const t = c.t0 + delay
  return (
    <div style={{ ...at(c.bx + off[0], c.by + off[1], size, size), '--dx': `${c.dx - off[0]}px`, '--dy': `${c.dy - off[1]}px`,
      animation: `lgaIn 60ms linear ${ms(t)} both, lgaMove ${ms(dur)} ${ease} ${ms(t)} both, lgaGone 90ms linear ${ms(t + dur)} both` }}>
      <div style={{ width: '100%', height: '100%', '--arc': `${arc}px`, animation: arc ? `lgaArcY ${ms(dur)} ease-in-out ${ms(t)} both` : undefined }}>
        <div style={{ width: '100%', height: '100%', '--spin': `${spin}deg`, '--s0': grow?.[0], '--s1': grow?.[1],
          animation: [spin ? `lgaSpin ${ms(dur)} linear ${ms(t)} both` : '', grow ? `lgaGrow ${ms(dur)} cubic-bezier(.5,0,1,.6) ${ms(t)} both` : ''].filter(Boolean).join(', ') || undefined }}>
          {child}
        </div>
      </div>
    </div>
  )
}
const glyph = (c, rot = 0) => (
  <div style={{ width: '100%', height: '100%', transform: rot ? `rotate(${rot}deg)` : undefined, filter: `drop-shadow(0 0 ${Math.round(c.S * 0.12)}px ${c.color})` }}>
    <Glyph name={c.glyph} color={c.color} accent={c.accent} />
  </div>
)
const orbFace = (c) => <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: `radial-gradient(circle, #fff 0 18%, ${c.color} 42%, transparent 70%)`, boxShadow: `0 0 ${Math.round(c.S * 0.5)}px ${c.color}` }} />

export const TRAVEL_DRAW = {
  // The boss's object hurled at you, spinning on an arc.
  thrown: (c) => moving(c, { size: c.S * c.k, dur: c.dur, arc: -Math.min(90, c.len * 0.4), spin: 900, child: glyph(c) }),
  // A storm of its glyphs, each on its own curve.
  swarm: (c) => Array.from({ length: 9 }, (_, i) => (
    <div key={i}>{moving(c, { size: c.S * 0.42 * c.k, delay: i * 28, dur: c.dur * 0.82, arc: (rnd(i) - 0.5) * 2 * Math.min(70, c.len * 0.35), spin: (rnd(i, 2) - 0.5) * 500,
      off: [(rnd(i, 3) - 0.5) * c.S * 0.8, (rnd(i, 4) - 0.5) * c.S * 0.8], child: glyph(c) })}</div>
  )),
  // A straight volley, aimed.
  shards: (c) => Array.from({ length: 5 }, (_, i) => {
    const side = (i - 2) * c.S * 0.18
    const nx = -Math.sin(c.rad) * side, ny = Math.cos(c.rad) * side
    return <div key={i}>{moving(c, { size: c.S * 0.5 * c.k, delay: i * 45, dur: c.dur * 0.75, ease: 'cubic-bezier(.3,0,.9,.7)', off: [nx, ny], child: glyph(c, c.ang + 90) })}</div>
  }),
  // A glowing orb with a trail.
  orb: (c) => [0, 1, 2, 3].map((i) => (
    <div key={i} style={{ opacity: 1 - i * 0.22 }}>{moving(c, { size: c.S * (0.95 - i * 0.15) * c.k, delay: i * 32, dur: c.dur, ease: 'cubic-bezier(.55,0,.9,.5)', arc: -Math.min(40, c.len * 0.15), child: orbFace(c) })}</div>
  )),
  // A beam that shoots out from the boss to the heart.
  beam: (c) => {
    const h = 12 * c.k
    return (
      <div style={{ position: 'absolute', left: c.bx, top: c.by - h / 2, width: c.len, height: h, transformOrigin: '0 50%', transform: `rotate(${c.ang}deg)` }}>
        <div style={{ width: '100%', height: '100%', transformOrigin: '0 50%', borderRadius: h, background: `linear-gradient(180deg, transparent, ${c.color} 22%, #fff 50%, ${c.color} 78%, transparent)`, boxShadow: `0 0 ${h * 1.5}px ${c.color}, 0 0 ${h * 3}px ${c.color}`,
          animation: `lgaBeam ${ms(c.dur + 520)} cubic-bezier(.2,.8,.3,1) ${ms(c.t0)} both` }} />
      </div>
    )
  },
  // A lightning bolt from the boss to the heart, flickering.
  bolt: (c) => {
    const N = 9, jit = 14 * c.k
    const pts = Array.from({ length: N + 1 }, (_, i) => {
      const f = i / N, j = i === 0 || i === N ? 0 : (rnd(i, 7) - 0.5) * 2 * jit
      return `${(c.bx + c.dx * f - Math.sin(c.rad) * j).toFixed(1)},${(c.by + c.dy * f + Math.cos(c.rad) * j).toFixed(1)}`
    }).join(' ')
    return (
      <svg width={c.W} height={c.H} style={{ position: 'absolute', inset: 0, overflow: 'visible', filter: `drop-shadow(0 0 6px ${c.color}) drop-shadow(0 0 14px ${c.color})`, animation: `lgaIn 1ms linear ${ms(c.t0)} both, lgaFlick ${ms(c.dur + 460)} steps(1, end) ${ms(c.t0)} both` }}>
        <polyline points={pts} fill="none" stroke={c.color} strokeWidth={6 * c.k} strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={pts} fill="none" stroke="#fff" strokeWidth={2.2 * c.k} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    )
  },
  // Its glyph lunging straight at the camera, growing as it comes.
  lunge: (c) => moving(c, { size: c.S * c.k, dur: c.dur, ease: 'cubic-bezier(.6,0,.9,.4)', grow: [0.6, 2.6], child: glyph(c) }),
  // A great sweeping arc (a scythe, a wheel) across the card, through the heart.
  arc: (c) => {
    const R = c.len * 0.95, a0 = c.rad - 1.05, a1 = c.rad + 1.05
    const p = (a) => `${(c.bx + R * Math.cos(a)).toFixed(1)} ${(c.by + R * Math.sin(a)).toFixed(1)}`
    const d = `M${p(a0)} A${R.toFixed(1)} ${R.toFixed(1)} 0 0 1 ${p(a1)}`
    const L = Math.round(R * 2.1 + 10)
    return (
      <svg width={c.W} height={c.H} style={{ position: 'absolute', inset: 0, overflow: 'visible', filter: `drop-shadow(0 0 8px ${c.color})`, ...fadeOut(c.land + 220) }}>
        {[[16, c.color], [5, '#fff']].map(([w, col], i) => (
          <path key={i} d={d} fill="none" stroke={col} strokeWidth={w * c.k} strokeLinecap="round" strokeDasharray={L} style={{ '--len': L, animation: `lgaIn 1ms linear ${ms(c.t0)} both, lgaDash ${ms(c.dur)} cubic-bezier(.3,0,.6,1) ${ms(c.t0)} both` }} />
        ))}
      </svg>
    )
  },
  // A chain (strings, a leash) lashing out to hook the heart, then yanking back.
  chain: (c) => {
    const h = 8 * c.k
    return (
      <div style={{ position: 'absolute', left: c.bx, top: c.by - h / 2, width: c.len, height: h, transformOrigin: '0 50%', transform: `rotate(${c.ang}deg)` }}>
        <div style={{ width: '100%', height: '100%', transformOrigin: '0 50%', borderRadius: h, border: `1.5px solid #0008`,
          background: `repeating-linear-gradient(90deg, ${c.color} 0 ${h * 1.4}px, ${c.accent} ${h * 1.4}px ${h * 1.7}px, transparent ${h * 1.7}px ${h * 2.1}px)`, boxShadow: `0 0 8px ${c.color}`,
          animation: `lgaChain ${ms(c.dur / 0.55)} cubic-bezier(.3,.6,.4,1) ${ms(c.t0)} both` }} />
      </div>
    )
  },
  // Rings rolling out from the boss across the card.
  wave: (c) => [0, 1, 2].map((i) => {
    const D = c.len * 2.3
    return <div key={i} style={{ ...at(c.bx, c.by, D, D), borderRadius: '50%', border: `${Math.round(6 * c.k)}px solid ${c.color}`, boxShadow: `0 0 14px ${c.color}, inset 0 0 14px ${c.color}`, animation: `lgaRing ${ms(c.dur * 1.5)} cubic-bezier(.2,.6,.4,1) ${ms(c.t0 + i * 90)} both` }} />
  }),
  // Darkness pouring out of the boss over the card.
  shadow: (c) => {
    const D = Math.hypot(c.W, c.H) * 2.2
    return <div style={{ ...at(c.bx, c.by, D, D), borderRadius: '50%', background: `radial-gradient(circle, color-mix(in srgb, ${c.color} 40%, black) 0 18%, rgba(0,0,0,.72) 34%, transparent 50%)`,
      animation: `lgaRing ${ms(c.dur + 700)} cubic-bezier(.3,.7,.4,1) ${ms(c.t0)} both` }} />
  },
}

// ── THE IMPACT: on the heart and the screen (the card) ──
const W0 = (c, node) => <div style={{ position: 'absolute', inset: 0, ...fadeOut(c.land + ASSAULT.holdMs) }}>{node}</div>
const burst = (c, n, color, reach, size, seed = 1, x = c.tx, y = c.ty) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * Math.PI * 2 + rnd(i, seed) * 0.6, r = reach * (0.6 + rnd(i, seed + 1) * 0.6)
  const s = size * (0.6 + rnd(i, seed + 2) * 0.6)
  return <div key={`b${seed}${i}`} style={{ ...at(x, y, s, s), borderRadius: '50%', background: color, '--hx': `${Math.cos(a) * r}px`, '--hy': `${Math.sin(a) * r}px`, animation: `lgaBurst ${ms(520 + rnd(i, 9) * 260)} cubic-bezier(.2,.8,.3,1) ${ms(c.land)} both` }} />
})
const slash = (c, { x, y, len, w, rot, delay = 0 }) => (
  <div style={{ position: 'absolute', left: x - len / 2, top: y - w / 2, width: len, height: w, transform: `rotate(${rot}deg)` }}>
    <div style={{ width: '100%', height: '100%', transformOrigin: '0 50%', borderRadius: w, background: `linear-gradient(90deg, transparent, ${c.color} 12%, #fff 50%, ${c.color} 88%, transparent)`, boxShadow: `0 0 ${w * 1.4}px ${c.color}`,
      animation: `lgaSlash 520ms cubic-bezier(.2,.9,.3,1) ${ms(c.land + delay)} both` }} />
  </div>
)

export const IMPACT_DRAW = {
  // Three claw rakes torn across the screen through the heart.
  claws: (c) => W0(c, [-1, 0, 1].map((i) => slash(c, { x: c.tx + i * 22 * c.k, y: c.ty - i * 14 * c.k, len: Math.max(c.W, c.H) * 0.85, w: 7 * c.k, rot: -34, delay: (i + 1) * 45 }))),
  // One clean cut across the whole screen.
  cut: (c) => W0(c, <>
    {slash(c, { x: c.tx, y: c.ty, len: Math.hypot(c.W, c.H) * 1.1, w: 10 * c.k, rot: -16 })}
    {burst(c, 10, c.color, c.S * 1.1, 6 * c.k, 3)}
  </>),
  // Jaws close on the screen from the top and the bottom.
  bite: (c) => {
    const teeth = (n, down) => {
      const w = c.W / n
      return <svg width={c.W} height={c.H * 0.4} viewBox={`0 0 ${c.W} ${c.H * 0.4}`} style={{ display: 'block', overflow: 'visible' }}>
        <rect x="0" y={down ? 0 : c.H * 0.4 - c.H * 0.1} width={c.W} height={c.H * 0.1} fill={`color-mix(in srgb, ${c.accent} 75%, black)`} />
        {Array.from({ length: n }, (_, i) => {
          const x = i * w, base = down ? c.H * 0.1 : c.H * 0.3, tip = down ? c.H * 0.4 : 0
          return <path key={i} d={`M${x + 1} ${base} L${x + w / 2} ${tip} L${x + w - 1} ${base}Z`} fill="#fbf6ee" stroke={c.color} strokeWidth="2" strokeLinejoin="round" />
        })}
      </svg>
    }
    const n = Math.max(6, Math.round(c.W / 46))
    return W0(c, <>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, filter: 'drop-shadow(0 4px 4px #0008)', animation: `lgaJawTop 820ms cubic-bezier(.5,0,.2,1) ${ms(c.land - 120)} both` }}>{teeth(n, true)}</div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, filter: 'drop-shadow(0 -4px 4px #0008)', animation: `lgaJawBot 820ms cubic-bezier(.5,0,.2,1) ${ms(c.land - 120)} both` }}>{teeth(n, false)}</div>
      {burst(c, 8, '#c8001e', c.S, 7 * c.k, 5)}
    </>)
  },
  // Its glyph slams down on the heart, a shockwave and debris.
  crush: (c) => W0(c, <>
    <div style={{ ...at(c.tx, c.ty, c.S * 2 * c.k, c.S * 2 * c.k), animation: `lgaSlam 420ms cubic-bezier(.3,1.3,.5,1) ${ms(c.land)} both` }}>{glyph(c)}</div>
    <div style={{ ...at(c.tx, c.ty, c.S * 5 * c.k, c.S * 5 * c.k), borderRadius: '50%', border: `${Math.round(5 * c.k)}px solid ${c.color}`, animation: `lgaRing 520ms ease-out ${ms(c.land + 80)} both` }} />
    {burst(c, 12, `color-mix(in srgb, ${c.accent} 60%, #b8a890)`, c.S * 1.6, 8 * c.k, 7)}
  </>),
  // An explosion on the heart: a white-hot core, rays, a ring.
  blast: (c) => W0(c, <>
    <div style={{ ...at(c.tx, c.ty, c.S * 3.4 * c.k, c.S * 3.4 * c.k), borderRadius: '50%', background: `radial-gradient(circle, #fff 0 14%, ${c.color} 32%, transparent 68%)`, animation: `lgaRing 600ms cubic-bezier(.2,.8,.3,1) ${ms(c.land)} both` }} />
    {Array.from({ length: 12 }, (_, i) => (
      <div key={i} style={{ position: 'absolute', left: c.tx, top: c.ty - 2 * c.k, width: c.S * 1.9 * c.k, height: 4 * c.k, transformOrigin: '0 50%', borderRadius: 4, background: `linear-gradient(90deg, #fff, ${c.color})`, '--r': `${i * 30 + 8}deg`, animation: `lgaRay 520ms cubic-bezier(.2,.8,.3,1) ${ms(c.land)} both` }} />
    ))}
    {burst(c, 10, c.color, c.S * 1.8, 6 * c.k, 11)}
  </>),
  // The screen's glass cracks out from the heart.
  crack: (c) => {
    const lines = Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * Math.PI * 2 + rnd(i, 13) * 0.4, L = Math.max(c.W, c.H) * (0.35 + rnd(i, 14) * 0.5)
      let pts = `${c.tx.toFixed(1)},${c.ty.toFixed(1)}`
      for (let s = 1; s <= 5; s++) {
        const r = (L * s) / 5, j = (rnd(i * 7 + s, 15) - 0.5) * 0.35
        pts += ` ${(c.tx + r * Math.cos(a + j)).toFixed(1)},${(c.ty + r * Math.sin(a + j)).toFixed(1)}`
      }
      return pts
    })
    const ring = (r) => Array.from({ length: 11 }, (_, i) => { const a = (i / 10) * Math.PI * 2; const rr = r * (0.85 + rnd(i, 17) * 0.3); return `${(c.tx + rr * Math.cos(a)).toFixed(1)},${(c.ty + rr * Math.sin(a)).toFixed(1)}` }).join(' ')
    const L = Math.round(Math.max(c.W, c.H) * 1.2)
    return W0(c, <svg width={c.W} height={c.H} style={{ position: 'absolute', inset: 0 }}>
      {[[4, '#0009'], [1.6, '#fff']].map(([w, col], k) => (
        <g key={k} fill="none" stroke={col} strokeWidth={w * c.k} strokeLinejoin="round">
          {lines.map((p, i) => <polyline key={i} points={p} strokeDasharray={L} style={{ '--len': L, animation: `lgaDash 220ms ease-out ${ms(c.land + i * 12)} both` }} />)}
          <polygon points={ring(c.S * 0.7 * c.k)} style={{ animation: `lgaIn 1ms linear ${ms(c.land)} both` }} />
          <polygon points={ring(c.S * 1.5 * c.k)} style={{ animation: `lgaIn 1ms linear ${ms(c.land + 60)} both` }} />
        </g>
      ))}
      <circle cx={c.tx} cy={c.ty} r={c.S * 0.5} fill={c.color} opacity=".5" style={{ animation: `lgaRing 380ms ease-out ${ms(c.land)} both`, transformOrigin: `${c.tx}px ${c.ty}px`, transformBox: 'view-box' }} />
    </svg>)
  },
  // Flames rise from the bottom of the screen.
  burn: (c) => {
    const n = Math.max(9, Math.round(c.W / 34))
    return W0(c, <>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(0deg, color-mix(in srgb, ${c.color} 45%, transparent), transparent 60%)`, animation: `lgaVig 1100ms ease-out ${ms(c.land)} both` }} />
      {Array.from({ length: n }, (_, i) => {
        const w = (c.W / n) * 1.6, h = c.H * (0.32 + rnd(i, 21) * 0.3) * c.k
        return <div key={i} style={{ position: 'absolute', bottom: -4, left: (i / n) * c.W - w * 0.2, width: w, height: h, transformOrigin: '50% 100%', borderRadius: '50% 50% 45% 45% / 70% 70% 30% 30%',
          background: `linear-gradient(0deg, ${c.color}, #ffd25a 55%, #fff5c0 80%, transparent)`, opacity: 0.9, filter: `drop-shadow(0 0 8px ${c.color})`,
          animation: `lgaFlame ${ms(900 + rnd(i, 22) * 300)} cubic-bezier(.3,.7,.4,1) ${ms(c.land + rnd(i, 23) * 90)} both` }} />
      })}
      {burst(c, 8, '#ffd25a', c.S * 1.2, 6 * c.k, 25)}
    </>)
  },
  // Ice (stone, nightmare) creeps in from the four corners.
  frost: (c) => {
    const corner = (cx, cy, k) => {
      const len = Math.min(c.W, c.H) * 0.62 * c.k
      const base = Math.atan2(c.H / 2 - cy, c.W / 2 - cx)
      return (
        <svg key={k} width={c.W} height={c.H} style={{ position: 'absolute', inset: 0, overflow: 'visible', transformOrigin: `${cx}px ${cy}px`, animation: `lgaCreep 1000ms cubic-bezier(.2,.8,.3,1) ${ms(c.land + k * 40)} both` }}>
          {Array.from({ length: 6 }, (_, i) => {
            const a = base + (i - 2.5) * 0.28, L = len * (0.55 + rnd(i + k * 6, 31) * 0.45), w = 10 + rnd(i, 32) * 10
            const tx2 = cx + L * Math.cos(a), ty2 = cy + L * Math.sin(a)
            const nx = -Math.sin(a) * w, ny = Math.cos(a) * w
            return <path key={i} d={`M${cx + nx} ${cy + ny} L${tx2} ${ty2} L${cx - nx} ${cy - ny}Z`} fill={`color-mix(in srgb, ${c.color} 70%, white)`} fillOpacity=".78" stroke="#fff" strokeWidth="1.2" strokeOpacity=".85" />
          })}
        </svg>
      )
    }
    return W0(c, <>
      <div style={{ position: 'absolute', inset: 0, background: `color-mix(in srgb, ${c.color} 22%, transparent)`, animation: `lgaVig 1100ms ease-out ${ms(c.land)} both` }} />
      {corner(0, 0, 0)}{corner(c.W, 0, 1)}{corner(0, c.H, 2)}{corner(c.W, c.H, 3)}
    </>)
  },
  // The screen floods from below.
  flood: (c) => {
    const lvl = c.H * 0.55 * c.k
    const wave = Array.from({ length: 13 }, (_, i) => `${((i / 12) * c.W).toFixed(1)},${(i % 2 ? 10 : 0).toFixed(1)}`).join(' ')
    return W0(c, <div style={{ position: 'absolute', left: -10, right: -10, bottom: 0, height: lvl, animation: `lgaFlood 1150ms cubic-bezier(.3,.7,.4,1) ${ms(c.land)} both` }}>
      <svg width={c.W + 20} height={14} style={{ position: 'absolute', left: 0, top: -12, display: 'block' }}><polygon points={`0,14 ${wave} ${c.W + 20},14`} fill={`color-mix(in srgb, ${c.color} 80%, transparent)`} /></svg>
      <div style={{ position: 'absolute', inset: 0, background: `color-mix(in srgb, ${c.color} 72%, transparent)`, boxShadow: `inset 0 6px 0 color-mix(in srgb, #fff 45%, transparent)` }} />
      {burst(c, 9, 'rgba(255,255,255,.75)', c.S * 0.9, 7 * c.k, 41, c.W / 2, lvl * 0.4)}
    </div>)
  },
  // A curse sigil stamped onto the heart, ink splattering.
  curse: (c) => {
    const R = c.S * 1.5 * c.k
    const star = Array.from({ length: 5 }, (_, i) => { const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5; return `${(R + R * 0.78 * Math.cos(a)).toFixed(1)},${(R + R * 0.78 * Math.sin(a)).toFixed(1)}` }).join(' ')
    return W0(c, <>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at ${c.tx}px ${c.ty}px, color-mix(in srgb, ${c.color} 30%, transparent), transparent 55%)`, animation: `lgaVig 1100ms ease-out ${ms(c.land)} both` }} />
      <svg width={R * 2} height={R * 2} style={{ ...at(c.tx, c.ty, R * 2, R * 2), overflow: 'visible', filter: `drop-shadow(0 0 6px ${c.color})`, animation: `lgaStamp 1100ms cubic-bezier(.3,1.2,.5,1) ${ms(c.land)} both` }}>
        <circle cx={R} cy={R} r={R * 0.95} fill="none" stroke={c.color} strokeWidth={3 * c.k} />
        <circle cx={R} cy={R} r={R * 0.78} fill="none" stroke={c.color} strokeWidth={1.5} strokeDasharray="4 5" />
        <polygon points={star} fill="none" stroke="#fff" strokeWidth={2 * c.k} strokeLinejoin="round" />
      </svg>
      {burst(c, 12, `color-mix(in srgb, ${c.color} 60%, black)`, c.S * 1.6, 7 * c.k, 51)}
    </>)
  },
  // Arcs crawl around the screen's edge, sparks on the heart.
  shock: (c) => {
    const edge = []
    const step = 22, j = 7 * c.k
    for (let x = 0; x <= c.W; x += step) edge.push([x, 3 + rnd(x, 61) * j])
    for (let y = 0; y <= c.H; y += step) edge.push([c.W - 3 - rnd(y, 62) * j, y])
    for (let x = c.W; x >= 0; x -= step) edge.push([x, c.H - 3 - rnd(x, 63) * j])
    for (let y = c.H; y >= 0; y -= step) edge.push([3 + rnd(y, 64) * j, y])
    const pts = edge.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
    return W0(c, <>
      <svg width={c.W} height={c.H} style={{ position: 'absolute', inset: 0, filter: `drop-shadow(0 0 6px ${c.color})`, animation: `lgaFlick 900ms steps(1, end) ${ms(c.land)} both` }}>
        <polyline points={pts} fill="none" stroke={c.color} strokeWidth={4 * c.k} strokeLinejoin="round" />
        <polyline points={pts} fill="none" stroke="#fff" strokeWidth={1.4 * c.k} strokeLinejoin="round" />
      </svg>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} style={{ position: 'absolute', left: c.tx, top: c.ty - 1.5 * c.k, width: c.S * (0.9 + rnd(i, 65) * 0.8), height: 3 * c.k, transformOrigin: '0 50%', background: '#fff', boxShadow: `0 0 6px ${c.color}`, '--r': `${i * 60 + rnd(i, 66) * 30}deg`, animation: `lgaRay 360ms steps(3, end) ${ms(c.land)} both` }} />
      ))}
    </>)
  },
  // Venom drips down the screen and splashes the heart.
  poison: (c) => W0(c, <>
    {Array.from({ length: 9 }, (_, i) => {
      const x = (0.06 + (i / 9) * 0.9 + rnd(i, 71) * 0.04) * c.W, fall = c.H * (0.35 + rnd(i, 72) * 0.5)
      const d = 10 * c.k
      return (
        <div key={i}>
          <div style={{ position: 'absolute', left: x - 2, top: 0, width: 4 * c.k, height: fall, transformOrigin: '50% 0', borderRadius: 4, background: `color-mix(in srgb, ${c.color} 80%, transparent)`, animation: `lgaStreak ${ms(600 + rnd(i, 73) * 300)} ease-in ${ms(c.land + i * 35)} both` }} />
          <div style={{ position: 'absolute', left: x - d / 2, top: 0, width: d, height: d * 1.3, borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%', background: c.color, boxShadow: `0 0 6px ${c.color}`, '--fall': `${fall}px`,
            animation: `lgaDrip ${ms(600 + rnd(i, 73) * 300)} ease-in ${ms(c.land + i * 35)} both` }} />
        </div>
      )
    })}
    <div style={{ ...at(c.tx, c.ty, c.S * 2.6 * c.k, c.S * 2.6 * c.k), borderRadius: '50%', border: `${Math.round(4 * c.k)}px solid ${c.color}`, animation: `lgaRing 480ms ease-out ${ms(c.land)} both` }} />
    {burst(c, 10, c.color, c.S * 1.3, 8 * c.k, 75)}
  </>),
  // The heart's life is pulled out of it, back into the boss.
  drain: (c) => W0(c, <>
    <div style={{ position: 'absolute', left: c.bx, top: c.by - 2, width: c.len, height: 4 * c.k, transformOrigin: '0 50%', transform: `rotate(${c.ang}deg)`, background: `linear-gradient(90deg, ${c.color}, #ff3b5c)`, opacity: 0.55, animation: `lgaVig 900ms ease-out ${ms(c.land)} both` }} />
    {Array.from({ length: 14 }, (_, i) => {
      const s = (7 + rnd(i, 81) * 7) * c.k
      return <div key={i} style={{ ...at(c.tx + (rnd(i, 82) - 0.5) * c.S, c.ty + (rnd(i, 83) - 0.5) * c.S, s, s), borderRadius: '50%', background: i % 2 ? '#ff3b5c' : c.color, boxShadow: `0 0 8px ${c.color}`,
        '--hx': `${-c.dx}px`, '--hy': `${-c.dy}px`, animation: `lgaBurst ${ms(520 + rnd(i, 84) * 240)} cubic-bezier(.6,0,.4,1) ${ms(c.land + i * 34)} both` }} />
    })}
  </>),
}

// The heart it took shatters (two halves flying apart, red bits), and the card's edges flash red.
function HeartBreak({ c }) {
  const s = Math.max(18, c.S * 0.62)
  return (
    <>
      {[[-1, 'inset(0 50% 0 0)'], [1, 'inset(0 0 0 50%)']].map(([d, clip]) => (
        <div key={d} style={{ ...at(c.tx, c.ty, s, s), fontSize: s * 0.9, lineHeight: `${s}px`, textAlign: 'center', clipPath: clip, '--hx': `${d * s * 1.1}px`, '--hy': `${s * 0.9}px`, '--hr': `${d * 50}deg`,
          animation: `lgaIn 1ms linear ${ms(c.land)} both, lgaHalf 700ms cubic-bezier(.3,.6,.5,1) ${ms(c.land + 60)} both` }}>❤️</div>
      ))}
      {burst(c, 8, '#ff2a4a', s * 1.6, 5, 91)}
    </>
  )
}

export default function AssaultFx({ motif, geo, big = false, fading = false }) {
  if (!geo) return null
  const a = assaultFor(motif)
  const st = impactFor(motif)
  const dx = geo.tx - geo.bx, dy = geo.ty - geo.by
  const rad = Math.atan2(dy, dx)
  const c = {
    ...geo, dx, dy, rad, ang: (rad * 180) / Math.PI, len: Math.max(1, Math.hypot(dx, dy)),
    color: a.tint || st.color, accent: st.accent, glyph: a.glyph || st.glyph, k: big ? ASSAULT.big : 1,
    t0: ASSAULT.travelAt, dur: ASSAULT.travelMs[a.travel] || 360, land: landAt(a.travel),
  }
  const vig = Math.round(Math.min(c.W, c.H) * 0.28)
  return (
    <div aria-hidden="true" data-assault={`${a.travel}+${a.impact}`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit', pointerEvents: 'none', zIndex: 4, opacity: fading ? 0 : 1, transition: 'opacity 200ms ease-in' }}>
      <style>{ASSAULT_CSS}</style>
      {TRAVEL_DRAW[a.travel](c)}
      {IMPACT_DRAW[a.impact](c)}
      {big && <div style={{ position: 'absolute', inset: 0 }}>{IMPACT_DRAW[a.impact]({ ...c, land: c.land + 200 })}</div>}
      <HeartBreak c={c} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', boxShadow: `inset 0 0 ${vig}px ${Math.round(vig * 0.35)}px rgba(255, 24, 48, ${big ? 0.85 : 0.65})`, animation: `lgaVig ${big ? 900 : 700}ms ease-out ${ms(c.land)} both` }} />
    </div>
  )
}
