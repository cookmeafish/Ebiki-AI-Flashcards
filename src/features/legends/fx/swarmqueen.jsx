// What the Swarmqueen's raid ability (wildfire: Wildfire Comb) LOOKS like. The fx contract is in fx/index.js, the juice
// numbers in fx/_juice.js, the design in design-v2.md section 16. Fixed bright fire colors (never theme tokens).
import { anim, around, flash, ring } from './_kit'

const POP = 'cubic-bezier(.34,1.56,.64,1)'
const SETTLE = 'cubic-bezier(.22,1,.36,1)'
// A flat-top hexagon (the comb's cell).
const HEX = 'polygon(25% 3%, 75% 3%, 100% 50%, 75% 97%, 25% 97%, 0 50%)'
const FIRE = 'radial-gradient(circle, #ffffff 0 16%, #fff2a8 30%, #ffb12e 56%, #ff5a14 80%, #c22a0a 100%)'
const WAX = 'radial-gradient(circle at 40% 35%, #fff4c8 0 18%, #ffcf5a 45%, #e59a1c 100%)'

// One comb cell bursting into flame at (x%, y%), `w`% wide.
const cell = (key, x, y, w, delay, ms, name = 'lgrQueenCellFlare') => (
  <div key={key} className="lgx" style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${w * 0.88}%`, transform: 'translate(-50%, -50%)', clipPath: HEX, background: FIRE, animation: anim(name, ms, delay, POP) }} />
)

// Hive Ablaze: a honeycomb of 19 cells (axial radius 2) over the arena, burning outward from the centre.
const COMB = []
for (let q = -2; q <= 2; q++) for (let r = Math.max(-2, -q - 2); r <= Math.min(2, -q + 2); r++) COMB.push({ q, r, d: Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) })

export default {
  effects: {
    // Ignite + spread (tick): a cell flares, then its neighbour catches 150 ms later; two sparks jump.
    ignite: () => <>
      {cell('a', 44, 60, 22, 0, 320)}
      {cell('b', 60, 51, 22, 150, 320)}
      {[0, 1].map((i) => <div key={i} className="lgx" style={{ left: `${48 + i * 12}%`, top: '50%', width: 5, height: 5, borderRadius: '50%', background: '#fff2a8', boxShadow: '0 0 6px #ff9a1f', '--h': '-40px', animation: anim('lgxRise', 340, 60 + i * 120) }} />)}
    </>,
    // Douse (tick): a drone dives in and drops a wax plug on a cell; it sizzles out.
    douse: () => <>
      <div className="lgx" style={{ left: '52%', top: '18%', fontSize: 18, lineHeight: 1, animation: anim('lgrQueenDroneDive', 340, 0, SETTLE) }}>🐝</div>
      <div className="lgx" style={{ left: '50%', top: '56%', width: '16%', height: '14%', transform: 'translate(-50%, -50%)', clipPath: HEX, background: WAX, animation: anim('lgrQueenPlug', 320, 80, POP) }} />
      {[0, 1, 2].map((i) => <div key={i} className="lgx" style={{ left: `${44 + i * 7}%`, top: '50%', width: 9, height: 9, borderRadius: '50%', background: 'rgba(235,240,245,.85)', '--h': '-34px', animation: anim('lgxRise', 300, 160 + i * 40) }} />)}
    </>,
    // Hive Ablaze (big): every cell of a giant comb ignites in a wave from the centre, then crumbles into wax drips.
    ablaze: () => <>
      {flash('#ffb12e')}
      <div className="lgx lgx-full" style={{ borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,210,90,.7) 0, rgba(255,90,20,.45) 40%, transparent 70%)', animation: anim('lgxFade', 1150) }} />
      {COMB.map(({ q, r, d }) => cell(`${q},${r}`, 50 + 21 * q, 50 + 24 * (r + q / 2), 27, d * 110, 1000 - d * 110, 'lgrQueenCombBurn'))}
      {ring('#fff2a8', 80, 2.4, 5, 600)}
      {around(12, (i) => <div key={`d${i}`} className="lgx" style={{ left: `${8 + i * 7.5}%`, top: `${30 + (i % 4) * 12}%`, width: 7, height: 11, borderRadius: '50% 50% 50% 50% / 35% 35% 65% 65%', background: '#ffcf5a', border: '1.5px solid #8a4b06', '--spin': '0deg', animation: anim('lgxFall', 520, 620 + (i % 5) * 50, 'ease-in') }} />)}
    </>,
  },
  floaters: { ignite: 'lg_fx_wildfireIgnite', douse: 'lg_fx_wildfireDouse', ablaze: 'lg_fx_wildfireAblaze' },
  floaterTone: { ignite: 'warning', douse: 'info', ablaze: 'danger' },
  demo: { ignite: { kind: 'hit', damage: 2, lives: 0 }, douse: { kind: 'miss', damage: 0, lives: 1 }, ablaze: { kind: 'hit', damage: 4, lives: 0 } },
  juice: {
    ignite: { size: 'tick', sfx: 'swarmqueen.ignite' },
    douse: { size: 'tick', sfx: 'swarmqueen.douse' },
    ablaze: { size: 'big', shake: 3, flash: 2, hitstop: 1, sfx: 'swarmqueen.ablaze' },
  },
  // Reactions on the boss art box (body only; the faces are lg-fx-* layers in the SVG). Rear: up 8 px and swell to
  // 1.08, held trembling, then dropped (phase 3 heaves harder, the same movement). Click: two tiny nods.
  css: `
.lgr-swarmqueen-ignite { animation: lgrQueenShiver 320ms ease-out both; transform-origin: 50% 100% }
.lgr-swarmqueen-douse { animation: lgrQueenClick 320ms ease-out both; transform-origin: 50% 100% }
.lgr-swarmqueen-ablaze { animation: lgrQueenRear 1100ms ${SETTLE} both; transform-origin: 50% 100% }
.lg-boss[data-phase="3"] .lgr-swarmqueen-ablaze { animation-name: lgrQueenRearP3 }
@keyframes lgrQueenShiver { 0%, 100% { transform: none } 20% { transform: translateX(-4px) } 40% { transform: translateX(4px) } 60% { transform: translateX(-3px) } 80% { transform: translateX(2px) } }
@keyframes lgrQueenClick { 0%, 100% { transform: none } 22% { transform: translateY(4px) rotate(4deg) } 44% { transform: none } 66% { transform: translateY(4px) rotate(4deg) } 88% { transform: none } }
@keyframes lgrQueenRear { 0% { transform: none } 22% { transform: translateY(-8px) scale(1.08) } 30% { transform: translate(-1.5px, -8px) scale(1.08) } 38% { transform: translate(1.5px, -8px) scale(1.08) } 46% { transform: translate(-1.5px, -8px) scale(1.08) } 54% { transform: translate(1.5px, -8px) scale(1.08) } 62% { transform: translateY(-8px) scale(1.08) } 80% { transform: translateY(2px) scale(.98) } 100% { transform: none } }
@keyframes lgrQueenRearP3 { 0% { transform: none } 22% { transform: translateY(-11px) scale(1.11) } 30% { transform: translate(-2.5px, -11px) scale(1.11) } 38% { transform: translate(2.5px, -11px) scale(1.11) } 46% { transform: translate(-2.5px, -11px) scale(1.11) } 54% { transform: translate(2.5px, -11px) scale(1.11) } 62% { transform: translateY(-11px) scale(1.11) } 80% { transform: translateY(3px) scale(.97) } 100% { transform: none } }
@keyframes lgrQueenCellFlare { 0% { transform: translate(-50%, -50%) scale(0); opacity: 0 } 35% { transform: translate(-50%, -50%) scale(1.25); opacity: 1 } 70% { transform: translate(-50%, -50%) scale(1); opacity: 1 } 100% { transform: translate(-50%, -50%) scale(.9); opacity: 0 } }
@keyframes lgrQueenCombBurn { 0% { transform: translate(-50%, -50%) scale(.3); opacity: 0; filter: brightness(2) } 18% { transform: translate(-50%, -50%) scale(1.08); opacity: 1; filter: brightness(1.6) } 45% { transform: translate(-50%, -50%) scale(1); opacity: 1; filter: none } 70% { transform: translate(-50%, -50%) scale(.96); opacity: .9 } 100% { transform: translate(-50%, calc(-50% + 22px)) scale(.7) rotate(14deg); opacity: 0 } }
@keyframes lgrQueenDroneDive { 0% { transform: translate(-50%, -40px) rotate(-20deg); opacity: 0 } 30% { opacity: 1 } 60% { transform: translate(-50%, 18px) rotate(10deg); opacity: 1 } 100% { transform: translate(-10%, -30px) rotate(-10deg); opacity: 0 } }
@keyframes lgrQueenPlug { 0% { transform: translate(-50%, calc(-50% - 26px)) scale(.6); opacity: 0 } 45% { transform: translate(-50%, -50%) scale(1.15, .8); opacity: 1 } 70% { transform: translate(-50%, -50%) scale(1); opacity: 1 } 100% { transform: translate(-50%, -50%) scale(1); opacity: 0 } }
/* fx-layer motion (opacity only). Phase 1: the red facet layer of the compound eyes flickers. Phase 3: the dark comb
   cells of the hive face go out in a wave, row by row from the top (rows found by the cells' own translate). */
@keyframes lgrQueenFacetFlicker { 0%, 100% { opacity: 1 } 14% { opacity: .35 } 26% { opacity: 1 } 40% { opacity: .5 } 52% { opacity: 1 } 68% { opacity: .3 } 80% { opacity: 1 } }
@keyframes lgrQueenCellWave { 0% { opacity: .15 } 30% { opacity: 1 } 45% { opacity: .55 } 60%, 100% { opacity: 1 } }
.lg-boss[data-fx="ablaze"] .lg-fx-ablaze > path[fill="#ffb43a"] { animation: lgrQueenFacetFlicker 900ms steps(1, end) both }
.lg-boss[data-phase="3"][data-fx="ablaze"] .lg-p3 .lg-fx-ablaze > g[transform^="translate("] { animation: lgrQueenCellWave 600ms ease-out both }
.lg-boss[data-phase="3"][data-fx="ablaze"] .lg-p3 .lg-fx-ablaze > g[transform*=" 52) rotate"] { animation-delay: 150ms }
.lg-boss[data-phase="3"][data-fx="ablaze"] .lg-p3 .lg-fx-ablaze > g[transform*=" 62.8) rotate"] { animation-delay: 300ms }
/* THE REAL PARTS: the state layer this ability draws on the boss (its lg-ab-* group in raids/swarmqueen.svg) moves with
   the moment, not only the whole figure. Played only while data-fx is set (never in focus mode, with Still bosses or
   under reduced motion). */
@keyframes lgrQueenCombFlare { 0%, 100% { transform: none; filter: none } 40% { transform: scale(1.18); filter: brightness(1.7) saturate(1.3) } }
.lg-boss[data-fx="ignite"] [class*="lg-ab-comb-"] { transform-box: fill-box; transform-origin: center; animation: lgrQueenCombFlare 320ms cubic-bezier(.22,1,.36,1) both }
`,
}
