// What the Banshee's raid ability (scream: Call and Response) LOOKS like. The fx contract is in fx/index.js, the juice
// numbers in fx/_juice.js, the design in design-v2.md section 18. Fixed bright colors (never theme tokens).
import { anim, around, flash } from './_kit'

const SETTLE = 'cubic-bezier(.22,1,.36,1)'
const VIOLET = '#b48cff'
const PALE = '#efe4ff'

// A sound ring pulsing out of her mouth (about 45% down the box).
const wave = (key, color, delay, s, w) => (
  <div key={key} className="lgx" style={{ left: '50%', top: '45%', width: '60%', height: '60%', borderRadius: '50%', border: `${w}px solid ${color}`, boxShadow: `0 0 10px ${color}, inset 0 0 8px ${color}`, '--s': s, animation: anim('lgrBansheeRing', 620, delay, 'ease-out') }} />
)

// The crack web: spokes from the impact, two jagged rings.
const SPOKES = [[50, 2], [86, 10], [100, 42], [92, 82], [62, 100], [30, 98], [4, 76], [0, 36], [18, 6]]
const RING1 = '50,22 63,30 72,40 70,55 60,66 46,68 33,60 28,46 34,32'
const RING2 = '50,8 70,16 86,32 88,56 76,78 54,88 30,84 14,66 10,42 22,20'

export default {
  effects: {
    // Wail (medium): concentric violet-white sound rings pulse from her mouth across the arena.
    wail: () => <>
      <div className="lgx lgx-full" style={{ borderRadius: '50%', background: `radial-gradient(circle at 50% 45%, rgba(180,140,255,.45) 0, transparent 60%)`, animation: anim('lgxFade', 760) }} />
      {wave('a', PALE, 0, 1.6, 4)}{wave('b', VIOLET, 120, 2.1, 4)}{wave('c', PALE, 240, 2.6, 3)}{wave('d', VIOLET, 360, 3.1, 2)}
    </>,
    // Shatter (big): the arena cracks like glass, a full crack web, and the shards fall away.
    shatter: () => <>
      {flash(PALE)}
      <svg className="lgx" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ left: '-15%', top: '-15%', width: '130%', height: '130%', overflow: 'visible', animation: anim('lgrBansheeWeb', 1150, 0, 'linear') }}>
        <g fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 2px ${VIOLET})` }}>
          {SPOKES.map(([x, y], i) => <path key={i} pathLength="100" d={`M50 45 L${(50 + x) / 2 + (i % 2 ? 3 : -3)} ${(45 + y) / 2} L${x} ${y}`} style={{ strokeDasharray: 100, animation: anim('lgrBansheeDraw', 220, i * 12, 'ease-out') }} />)}
          <polygon points={RING1} pathLength="100" style={{ strokeDasharray: 100, animation: anim('lgrBansheeDraw', 240, 120, 'ease-out') }} />
          <polygon points={RING2} pathLength="100" style={{ strokeDasharray: 100, animation: anim('lgrBansheeDraw', 260, 200, 'ease-out') }} />
        </g>
      </svg>
      {around(14, (i) => <div key={i} className="lgx" style={{ left: `${6 + i * 6.6}%`, top: `${20 + (i % 4) * 15}%`, width: 10 + (i % 3) * 5, height: 14 + (i % 2) * 6, background: i % 3 ? 'rgba(239,228,255,.9)' : VIOLET, clipPath: 'polygon(50% 0, 100% 70%, 30% 100%, 0 40%)', '--spin': `${(i % 2 ? 1 : -1) * (120 + i * 9)}deg`, animation: anim('lgxFall', 560, 560 + (i % 5) * 40, 'ease-in') }} />)}
    </>,
  },
  floaters: { wail: 'lg_fx_screamWail', shatter: 'lg_fx_screamShatter' },
  floaterTone: { wail: 'purple', shatter: 'ink' },
  demo: { wail: { kind: 'miss', damage: 0, lives: 1 }, shatter: { kind: 'hit', damage: 4, lives: 0 } },
  juice: {
    wail: { size: 'medium', shake: 1, flash: 1, hitstop: 1, sfx: 'banshee.wail' },
    shatter: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'banshee.shatter' },
  },
  // Reactions on the boss art box. Wail: a tall stretch (scaleY 1.15, scaleX .92) with a fast tremble. Choke: she is
  // compressed (scaleY .88), jolted 6 px down, and shudders back.
  css: `
.lgr-banshee-wail { animation: lgrBansheeWail 800ms ease-out both; transform-origin: 50% 100% }
.lgr-banshee-shatter { animation: lgrBansheeChoke 900ms ${SETTLE} both; transform-origin: 50% 100% }
.lg-boss[data-phase="3"] .lgr-banshee-wail { animation-name: lgrBansheeWailP3 }
@keyframes lgrBansheeWail { 0% { transform: none } 18% { transform: scale(.92, 1.15) } 26% { transform: scale(.92, 1.15) translateX(-1.5px) } 34% { transform: scale(.92, 1.15) translateX(1.5px) } 42% { transform: scale(.92, 1.15) translateX(-1.5px) } 50% { transform: scale(.92, 1.15) translateX(1.5px) } 58% { transform: scale(.92, 1.15) translateX(-1px) } 66% { transform: scale(.92, 1.15) } 100% { transform: none } }
@keyframes lgrBansheeWailP3 { 0% { transform: none } 18% { transform: scale(.9, 1.2) } 26% { transform: scale(.9, 1.2) translateX(-2px) } 34% { transform: scale(.9, 1.2) translateX(2px) } 42% { transform: scale(.9, 1.2) translateX(-2px) } 50% { transform: scale(.9, 1.2) translateX(2px) } 58% { transform: scale(.9, 1.2) translateX(-1.5px) } 66% { transform: scale(.9, 1.2) } 100% { transform: none } }
@keyframes lgrBansheeChoke { 0% { transform: none } 14% { transform: translateY(6px) scale(1.04, .88) } 24% { transform: translate(-2px, 6px) scale(1.04, .88) } 32% { transform: translate(2px, 5px) scale(1.04, .9) } 40% { transform: translate(-1.5px, 5px) scale(1.03, .92) } 48% { transform: translate(1px, 4px) scale(1.02, .94) } 100% { transform: none } }
@keyframes lgrBansheeRing { 0% { transform: translate(-50%, -50%) scale(.15); opacity: 1 } 100% { transform: translate(-50%, -50%) scale(var(--s, 2)); opacity: 0 } }
@keyframes lgrBansheeDraw { 0% { stroke-dashoffset: 100 } 100% { stroke-dashoffset: 0 } }
@keyframes lgrBansheeWeb { 0% { opacity: 1 } 55% { opacity: 1 } 100% { opacity: 0 } }
/* THE REAL PARTS: the state layer this ability draws on the boss (its lg-ab-* group in raids/banshee.svg) moves with
   the moment, not only the whole figure. Played only while data-fx is set (never in focus mode, with Still bosses or
   under reduced motion). */
@keyframes lgrBansheeScreamPulse { 0%, 100% { transform: none; filter: none } 40% { transform: scale(1.18); filter: brightness(1.7) saturate(1.3) } }
.lg-boss[data-fx="wail"] [class*="lg-ab-scream-"] { transform-box: fill-box; transform-origin: center; animation: lgrBansheeScreamPulse 700ms cubic-bezier(.22,1,.36,1) both }
`,
}
