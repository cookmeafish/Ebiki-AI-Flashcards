// What the Swarmqueen's raid ability (wildfire: Wildfire Comb) LOOKS like. The fx contract is in fx/index.js, the juice
// numbers in fx/_juice.js, the design in design-v2.md section 16. Fixed bright fire colors (never theme tokens).
import { anim, around, flash, ring } from './_kit'
import { pivots, FALLEN } from '../impact/bosses/swarmqueen.parts'

// THE EMPRESS'S OWN PARTS (raids/swarmqueen.svg hook classes; pivots in impact/bosses/swarmqueen.parts.jsx) for what is
// not a plain strike moment: her attack on the player (data-assault-on, from the moment it fires: she rears with the
// scythes cocked and the mandibles flared, then scissors the scythes shut, lunges and jabs the stinger as the swarm
// leaves her; the hive face throws its maw ring wide and glares), its heavier form (a second scissor as the second wave
// lands), her ability reactions (.lgr-swarmqueen-<fx>) and her fallen pose after the knockout. Off with every effect.
const P = '.lg-boss[data-motif="swarmqueen"]'
const A = `${P}[data-assault-on]`
const H = `${P}[data-assault-on][data-moment="hurtBig"]`
const on = (sel, parts, anim) => `${parts.map((p) => `${sel} .lg-swarmqueen-${p}`).join(', ')} { animation: ${anim} }`
const PARTS_CSS = `
@keyframes lgrQueenAtkHead { 0% { transform: none } 7% { transform: translateY(-8%) rotate(-7deg) scale(.95) } 10% { transform: translateY(6%) rotate(3deg) scale(1.16) } 14% { transform: translateY(5%) rotate(2deg) scale(1.13) } 34% { transform: translateY(4%) scale(1.1) } 40% { transform: translateY(-2%) scale(1) } 70% { transform: rotate(-1deg) } 100% { transform: none } }
@keyframes lgrQueenAtkMandL { 0% { transform: none } 7% { transform: rotate(-26deg) } 10% { transform: rotate(-30deg) } 34% { transform: rotate(-24deg) } 40% { transform: rotate(12deg) } 50% { transform: rotate(-6deg) } 70% { transform: none } }
@keyframes lgrQueenAtkMandR { 0% { transform: none } 7% { transform: rotate(26deg) } 10% { transform: rotate(30deg) } 34% { transform: rotate(24deg) } 40% { transform: rotate(-12deg) } 50% { transform: rotate(6deg) } 70% { transform: none } }
@keyframes lgrQueenAtkScytheL { 0% { transform: none } 7% { transform: rotate(-30deg) } 10% { transform: rotate(46deg) } 13% { transform: rotate(54deg) } 30% { transform: rotate(44deg) } 55% { transform: rotate(-4deg) } 100% { transform: none } }
@keyframes lgrQueenAtkScytheR { 0% { transform: none } 7% { transform: rotate(30deg) } 10% { transform: rotate(-46deg) } 13% { transform: rotate(-54deg) } 30% { transform: rotate(-44deg) } 55% { transform: rotate(4deg) } 100% { transform: none } }
@keyframes lgrQueenAtkBuzzL { 0% { transform: none } 2%, 6%, 10%, 14%, 18%, 22% { transform: rotate(10deg) } 4%, 8%, 12%, 16%, 20%, 24% { transform: rotate(-4deg) } 40% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgrQueenAtkBuzzR { 0% { transform: none } 2%, 6%, 10%, 14%, 18%, 22% { transform: rotate(-10deg) } 4%, 8%, 12%, 16%, 20%, 24% { transform: rotate(4deg) } 40% { transform: rotate(-3deg) } 100% { transform: none } }
@keyframes lgrQueenAtkStinger { 0% { transform: none } 7% { transform: translateY(-6%) scale(.9) } 10% { transform: translateY(8%) scale(1.3) } 14% { transform: translateY(6%) scale(1.24) } 34% { transform: translateY(5%) scale(1.2) } 50% { transform: none } 100% { transform: none } }
@keyframes lgrQueenAtkMaw { 0% { transform: none } 7% { transform: scale(.85) } 10% { transform: scale(1.32) } 34% { transform: scale(1.26) } 50% { transform: scale(.95) } 70% { transform: none } }
@keyframes lgrQueenAtkGlare { 0% { transform: none } 7% { transform: scale(.85, .6) } 10% { transform: scale(1.18) } 40% { transform: scale(1.12) } 70% { transform: none } }
${on(A, ['head'], 'lgrQueenAtkHead 1400ms cubic-bezier(.3,.7,.4,1) both')}
${on(A, ['mandl'], 'lgrQueenAtkMandL 1400ms ease-out both')}
${on(A, ['mandr'], 'lgrQueenAtkMandR 1400ms ease-out both')}
${on(A, ['scythel'], 'lgrQueenAtkScytheL 1400ms cubic-bezier(.3,.7,.4,1) both')}
${on(A, ['scyther'], 'lgrQueenAtkScytheR 1400ms cubic-bezier(.3,.7,.4,1) both')}
${on(A, ['wingl'], 'lgrQueenAtkBuzzL 1400ms linear both')}
${on(A, ['wingr'], 'lgrQueenAtkBuzzR 1400ms linear both')}
${on(A, ['stinger'], 'lgrQueenAtkStinger 1400ms cubic-bezier(.3,.7,.4,1) both')}
${on(A, ['ring', 'maw'], 'lgrQueenAtkMaw 1400ms ease-out both')}
${on(A, ['eyesl', 'eyesr'], 'lgrQueenAtkGlare 1400ms ease-out both')}
@keyframes lgrQueenAtk2ScytheL { 0% { transform: rotate(-22deg) } 2% { transform: rotate(36deg) } 22% { transform: rotate(30deg) } 28% { transform: rotate(-30deg) } 33% { transform: rotate(44deg) } 50% { transform: rotate(34deg) } 72% { transform: rotate(-4deg) } 100% { transform: none } }
@keyframes lgrQueenAtk2ScytheR { 0% { transform: rotate(22deg) } 2% { transform: rotate(-36deg) } 22% { transform: rotate(-30deg) } 28% { transform: rotate(30deg) } 33% { transform: rotate(-44deg) } 50% { transform: rotate(-34deg) } 72% { transform: rotate(4deg) } 100% { transform: none } }
@keyframes lgrQueenAtk2Stinger { 0% { transform: translateY(-6%) scale(.9) } 3% { transform: translateY(8%) scale(1.3) } 22% { transform: translateY(5%) scale(1.2) } 28% { transform: translateY(-6%) scale(.92) } 33% { transform: translateY(10%) scale(1.38) } 52% { transform: translateY(5%) scale(1.2) } 75% { transform: none } 100% { transform: none } }
${on(H, ['scythel'], 'lgrQueenAtk2ScytheL 1300ms cubic-bezier(.3,.7,.4,1) both')}
${on(H, ['scyther'], 'lgrQueenAtk2ScytheR 1300ms cubic-bezier(.3,.7,.4,1) both')}
${on(H, ['stinger'], 'lgrQueenAtk2Stinger 1300ms cubic-bezier(.3,.7,.4,1) both')}

@keyframes lgrQueenIgniteBuzzL { 0%, 100% { transform: none } 15%, 45%, 75% { transform: rotate(9deg) } 30%, 60% { transform: rotate(-3deg) } }
@keyframes lgrQueenIgniteBuzzR { 0%, 100% { transform: none } 15%, 45%, 75% { transform: rotate(-9deg) } 30%, 60% { transform: rotate(3deg) } }
@keyframes lgrQueenIgnitePulse { 0%, 100% { transform: none } 40% { transform: scale(1.12) } }
${on('.lgr-swarmqueen-ignite', ['wingl'], 'lgrQueenIgniteBuzzL 340ms linear both')}
${on('.lgr-swarmqueen-ignite', ['wingr'], 'lgrQueenIgniteBuzzR 340ms linear both')}
${on('.lgr-swarmqueen-ignite', ['sac', 'eyesl', 'eyesr'], 'lgrQueenIgnitePulse 340ms ease-out both')}
@keyframes lgrQueenDouseClench { 0%, 100% { transform: none } 35% { transform: scale(.88, .8) } }
@keyframes lgrQueenDouseLegL { 0%, 100% { transform: none } 35% { transform: rotate(16deg) } }
@keyframes lgrQueenDouseLegR { 0%, 100% { transform: none } 35% { transform: rotate(-16deg) } }
@keyframes lgrQueenDouseDroop { 0%, 100% { transform: none } 35% { transform: translateY(8%) scale(.92) } }
${on('.lgr-swarmqueen-douse', ['sac'], 'lgrQueenDouseClench 340ms ease-out both')}
${on('.lgr-swarmqueen-douse', ['legl'], 'lgrQueenDouseLegL 340ms ease-out both')}
${on('.lgr-swarmqueen-douse', ['legr'], 'lgrQueenDouseLegR 340ms ease-out both')}
${on('.lgr-swarmqueen-douse', ['brow', 'puppet'], 'lgrQueenDouseDroop 340ms ease-out both')}
@keyframes lgrQueenAblazeWingL { 0% { transform: none } 12% { transform: rotate(26deg) } 16%, 24%, 32%, 40%, 48% { transform: rotate(20deg) } 20%, 28%, 36%, 44%, 52% { transform: rotate(28deg) } 75% { transform: rotate(6deg) } 100% { transform: none } }
@keyframes lgrQueenAblazeWingR { 0% { transform: none } 12% { transform: rotate(-26deg) } 16%, 24%, 32%, 40%, 48% { transform: rotate(-20deg) } 20%, 28%, 36%, 44%, 52% { transform: rotate(-28deg) } 75% { transform: rotate(-6deg) } 100% { transform: none } }
@keyframes lgrQueenAblazeScytheL { 0% { transform: none } 14% { transform: rotate(-32deg) } 55% { transform: rotate(-26deg) } 80% { transform: rotate(4deg) } 100% { transform: none } }
@keyframes lgrQueenAblazeScytheR { 0% { transform: none } 14% { transform: rotate(32deg) } 55% { transform: rotate(26deg) } 80% { transform: rotate(-4deg) } 100% { transform: none } }
@keyframes lgrQueenAblazeHead { 0% { transform: none } 14% { transform: translateY(-12%) rotate(-10deg) scale(1.06) } 55% { transform: translateY(-9%) rotate(-7deg) scale(1.05) } 80% { transform: translateY(2%) } 100% { transform: none } }
@keyframes lgrQueenAblazeMandL { 0% { transform: none } 14%, 55% { transform: rotate(-28deg) } 80% { transform: none } }
@keyframes lgrQueenAblazeMandR { 0% { transform: none } 14%, 55% { transform: rotate(28deg) } 80% { transform: none } }
@keyframes lgrQueenAblazeSwell { 0% { transform: none } 14% { transform: scale(1.2) } 30% { transform: scale(1.12) } 46% { transform: scale(1.22) } 80% { transform: scale(.96) } 100% { transform: none } }
@keyframes lgrQueenAblazeJerk { 0% { transform: none } 14% { transform: translateY(-14%) rotate(-10deg) } 30% { transform: translateY(-8%) rotate(8deg) } 46% { transform: translateY(-12%) rotate(-6deg) } 80% { transform: none } }
${on('.lgr-swarmqueen-ablaze', ['wingl'], 'lgrQueenAblazeWingL 1150ms linear both')}
${on('.lgr-swarmqueen-ablaze', ['wingr'], 'lgrQueenAblazeWingR 1150ms linear both')}
${on('.lgr-swarmqueen-ablaze', ['scythel'], 'lgrQueenAblazeScytheL 1150ms ease-out both')}
${on('.lgr-swarmqueen-ablaze', ['scyther'], 'lgrQueenAblazeScytheR 1150ms ease-out both')}
${on('.lgr-swarmqueen-ablaze', ['head', 'brow'], 'lgrQueenAblazeHead 1150ms ease-out both')}
${on('.lgr-swarmqueen-ablaze', ['mandl'], 'lgrQueenAblazeMandL 1150ms ease-out both')}
${on('.lgr-swarmqueen-ablaze', ['mandr'], 'lgrQueenAblazeMandR 1150ms ease-out both')}
${on('.lgr-swarmqueen-ablaze', ['sac', 'ring', 'maw', 'eyesl', 'eyesr'], 'lgrQueenAblazeSwell 1150ms ease-out both')}
${on('.lgr-swarmqueen-ablaze', ['puppet'], 'lgrQueenAblazeJerk 1150ms ease-out both')}

${Object.entries(FALLEN).map(([p, t]) => `${P}:not(.lg-fx-off):has([data-ko-tag]):not([data-moment]) .lg-swarmqueen-${p} { transform: ${t} }`).join('\n')}
`

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

// Hive Ablaze: the outer ring of a 19-cell honeycomb (axial radius 2) round the arena, burning in turn.
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
    // Hive Ablaze (big): a ring of comb round her ignites cell by cell, then crumbles into wax drips; she rears inside it.
    ablaze: () => <>
      {flash('#ffb12e')}
      <div className="lgx lgx-full" style={{ borderRadius: '50%', background: 'radial-gradient(circle, transparent 0 34%, rgba(255,150,40,.45) 52%, rgba(255,90,20,.3) 62%, transparent 72%)', animation: anim('lgxFade', 1150) }} />
      {/* the comb burns in a RING round her (the inner cells lit first, at the rim of the ring), so her own rearing reaction stays in view */}
      {COMB.filter(({ d }) => d === 2).map(({ q, r }, i) => cell(`${q},${r}`, 50 + 23 * q, 50 + 26 * (r + q / 2), 25, (i % 6) * 70, 930 - (i % 6) * 70, 'lgrQueenCombBurn'))}
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
` + pivots + PARTS_CSS,
}
