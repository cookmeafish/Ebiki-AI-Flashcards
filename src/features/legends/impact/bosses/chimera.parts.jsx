// CHIMERA's own impact parts: drawers merged into impact/parts.jsx PARTS. Name each `chimera<Name>` (never clashes).
// A drawer is (params, ctx) => node, like the shared ones (ctx: color, accent, glyph, scale, speed); CSS keyframes it
// needs go in `css` (prefix them lgchimera). Deterministic, container units, transforms and opacity only.
//
// THE DRAWING ACTS TOO: raids/chimera.svg carries lg-chimera-* parts (lion head and its jaw, goat head, serpent tail,
// body, both paws, phase 3's bone wings). The `css` below moves them per moment (the arena's data-moment). Its attack
// on the player (data-assault-on), its ability's parts and its knockout are in fx/chimera.jsx, whose CSS is on the page
// for the whole raid.

// The three heads' own colors (fx/chimera.jsx uses the same): gold Lion, bone Goat, venom Serpent.
const HEADS = [['#ffc531', 50, 34], ['#f6f0dc', 80, 22], ['#5dff6a', 18, 18]]

export const css = `
@keyframes lgchimeraChomp { 0% { transform: scale(.3); opacity: 0 } 18% { transform: scale(1.15); opacity: 1 } 40% { transform: scale(1) } 85% { opacity: 1 } 100% { transform: scale(1.1); opacity: 0 } }
@keyframes lgchimeraJawTop { 0%, 12% { transform: translateY(-40%) } 34% { transform: translateY(0) } 44% { transform: translateY(-8%) } 54%, 100% { transform: translateY(0) } }
@keyframes lgchimeraJawBot { 0%, 12% { transform: translateY(40%) } 34% { transform: translateY(0) } 44% { transform: translateY(8%) } 54%, 100% { transform: translateY(0) } }
@keyframes lgchimeraSnapFlash { 0%, 30% { transform: scale(0); opacity: 0 } 36% { transform: scale(1.3); opacity: 1 } 100% { transform: scale(1.9); opacity: 0 } }

/* ---- the drawing itself, per moment ---- */
@keyframes lgchimeraJolt { 0% { transform: none } 12% { transform: translateY(-12%) rotate(-10deg) scale(.88) } 32% { transform: translateY(3%) rotate(5deg) } 60% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgchimeraFlinchR { 0% { transform: none } 14% { transform: rotate(16deg) translateX(6%) } 45% { transform: rotate(-4deg) } 100% { transform: none } }
@keyframes lgchimeraFlinchL { 0% { transform: none } 14% { transform: rotate(-16deg) translateX(-6%) } 45% { transform: rotate(4deg) } 100% { transform: none } }
@keyframes lgchimeraKnocked { 0% { transform: none } 10% { transform: translate(-10%, -8%) rotate(-22deg) scale(.82) } 28% { transform: translate(5%, 0) rotate(10deg) scale(1.05) } 50% { transform: rotate(-4deg) } 100% { transform: none } }
@keyframes lgchimeraJawShut { 0% { transform: none } 10%, 40% { transform: scaleY(.45) } 60% { transform: scaleY(1.2) } 100% { transform: none } }
@keyframes lgchimeraRearBack { 0% { transform: none } 12% { transform: rotate(28deg) translate(8%, -6%) } 40% { transform: rotate(10deg) } 100% { transform: none } }
@keyframes lgchimeraCoil { 0% { transform: none } 12% { transform: scale(.72) rotate(-14deg) } 40% { transform: scale(1.08) rotate(4deg) } 100% { transform: none } }
@keyframes lgchimeraFold { 0% { transform: none } 12% { transform: scale(.78) } 45% { transform: scale(1.05) } 100% { transform: none } }
@keyframes lgchimeraCarve { 0% { transform: none } 8% { transform: translateX(-12%) rotate(-12deg) } 16% { transform: translateX(10%) rotate(10deg) } 24% { transform: translateX(-7%) rotate(-6deg) } 34% { transform: translateX(3%) rotate(2deg) } 100% { transform: none } }
@keyframes lgchimeraShudder { 0%, 100% { transform: none } 10% { transform: translateX(6%) } 20% { transform: translateX(-6%) } 30% { transform: translateX(4%) } 40% { transform: translateX(-3%) } 55% { transform: translateY(3%) } }
@keyframes lgchimeraGoatLower { 0% { transform: none } 18% { transform: rotate(14deg) translateY(-6%) } 42% { transform: rotate(-22deg) translate(-10%, 6%) } 64% { transform: rotate(-16deg) translate(-7%, 4%) } 100% { transform: none } }
@keyframes lgchimeraSerpentRise { 0% { transform: none } 16% { transform: scaleY(.84) rotate(-8deg) } 42% { transform: scaleY(1.22) rotate(14deg) translateX(8%) } 64% { transform: scaleY(1.12) rotate(10deg) } 100% { transform: none } }
@keyframes lgchimeraWingBeat { 0% { transform: none } 18% { transform: scale(.82) } 42% { transform: scale(1.26) rotate(var(--lgc-turn, -8deg)) } 70% { transform: scale(1.1) } 100% { transform: none } }
@keyframes lgchimeraTriLion { 0% { transform: none } 14% { transform: translateY(-10%) scale(.88) } 38% { transform: translateY(16%) scale(1.42) } 60% { transform: translateY(10%) scale(1.26) } 100% { transform: none } }
@keyframes lgchimeraRam { 0% { transform: none } 16% { transform: rotate(18deg) translate(10%, -8%) } 38% { transform: rotate(-30deg) translate(-22%, 10%) scale(1.15) } 60% { transform: rotate(-22deg) translate(-16%, 7%) } 100% { transform: none } }
@keyframes lgchimeraVenomStrike { 0% { transform: none } 16% { transform: rotate(-16deg) scale(.86) } 38% { transform: rotate(34deg) scale(1.32) translateX(14%) } 60% { transform: rotate(24deg) scale(1.18) translateX(9%) } 100% { transform: none } }
@keyframes lgchimeraPounce { 0% { transform: none } 16% { transform: translateY(6%) scaleY(.9) } 38% { transform: translateY(-8%) scale(1.08) } 60% { transform: translateY(-4%) } 100% { transform: none } }
@keyframes lgchimeraSlamL { 0% { transform: none } 16% { transform: rotate(-26deg) translateY(-10%) } 38% { transform: rotate(14deg) translateY(10%) } 62% { transform: rotate(8deg) translateY(6%) } 100% { transform: none } }
@keyframes lgchimeraSlamR { 0% { transform: none } 16% { transform: rotate(26deg) translateY(-10%) } 38% { transform: rotate(-14deg) translateY(10%) } 62% { transform: rotate(-8deg) translateY(6%) } 100% { transform: none } }
@keyframes lgchimeraBounceOff { 0% { transform: none } 14% { transform: translateY(8%) scale(1.14) } 26% { transform: translateY(-12%) scale(.82) rotate(-6deg) } 52% { transform: translateY(-4%) scale(.94) } 100% { transform: none } }
@keyframes lgchimeraTuck { 0% { transform: none } 16%, 50% { transform: translateY(-10%) rotate(var(--lgc-tuck, 10deg)) scale(.86) } 100% { transform: none } }
@keyframes lgchimeraFangGlance { 0% { transform: none } 20% { transform: rotate(30deg) scale(1.25) translateX(12%) } 30% { transform: rotate(-12deg) scale(.86) translateX(-6%) } 52% { transform: rotate(4deg) } 100% { transform: none } }
@keyframes lgchimeraClamp { 0% { transform: none } 18% { transform: scaleY(1.6) } 28% { transform: scaleY(.35) } 60% { transform: scaleY(.5) } 100% { transform: none } }
@keyframes lgchimeraBleat { 0% { transform: none } 18% { transform: rotate(-20deg) translate(4%, -10%) } 34% { transform: rotate(-14deg) translate(4%, -8%) } 48% { transform: rotate(-20deg) translate(4%, -10%) } 100% { transform: none } }
@keyframes lgchimeraHiss { 0%, 100% { transform: none } 12% { transform: rotate(-8deg) scaleY(1.1) } 24% { transform: rotate(6deg) } 36% { transform: rotate(-6deg) } 48% { transform: rotate(5deg) } 64% { transform: rotate(-3deg) } }
@keyframes lgchimeraRoarGape { 0% { transform: none } 18% { transform: scaleY(1.9) scaleX(1.1) } 70% { transform: scaleY(1.7) } 100% { transform: none } }
@keyframes lgchimeraRoarRise { 0% { transform: none } 18% { transform: translateY(-8%) rotate(-4deg) } 70% { transform: translateY(-6%) rotate(3deg) } 100% { transform: none } }

.lg-boss[data-motif="chimera"][data-moment="hit"] .lg-chimera-lion { animation: lgchimeraJolt 520ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="chimera"][data-moment="hit"] .lg-chimera-goat { animation: lgchimeraFlinchR 520ms ease-out both }
.lg-boss[data-motif="chimera"][data-moment="hit"] .lg-chimera-serpent { animation: lgchimeraFlinchL 520ms ease-out both }

.lg-boss[data-motif="chimera"][data-moment="crit"] .lg-chimera-lion { animation: lgchimeraKnocked 680ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="chimera"][data-moment="crit"] .lg-chimera-jaw { animation: lgchimeraJawShut 680ms ease-out both }
.lg-boss[data-motif="chimera"][data-moment="crit"] .lg-chimera-goat { animation: lgchimeraRearBack 680ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="chimera"][data-moment="crit"] .lg-chimera-serpent { animation: lgchimeraCoil 680ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="chimera"][data-moment="crit"] .lg-chimera-wingL, .lg-boss[data-motif="chimera"][data-moment="crit"] .lg-chimera-wingR { animation: lgchimeraFold 680ms ease-out both }

.lg-boss[data-motif="chimera"][data-moment="sharpen"] .lg-chimera-serpent { animation: lgchimeraCarve 620ms linear both }
.lg-boss[data-motif="chimera"][data-moment="sharpen"] .lg-chimera-lion { animation: lgchimeraShudder 620ms linear both }
.lg-boss[data-motif="chimera"][data-moment="sharpen"] .lg-chimera-goat { animation: lgchimeraFlinchR 620ms ease-out both }

.lg-boss[data-motif="chimera"][data-moment="hurt"] .lg-chimera-goat { animation: lgchimeraGoatLower 640ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="chimera"][data-moment="hurt"] .lg-chimera-serpent { animation: lgchimeraSerpentRise 640ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="chimera"][data-moment="hurt"] .lg-chimera-wingL { --lgc-turn: -8deg; animation: lgchimeraWingBeat 640ms ease-out both }
.lg-boss[data-motif="chimera"][data-moment="hurt"] .lg-chimera-wingR { --lgc-turn: 8deg; animation: lgchimeraWingBeat 640ms ease-out both }

.lg-boss[data-motif="chimera"][data-moment="hurtBig"] .lg-chimera-goat { animation: lgchimeraRam 820ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="chimera"][data-moment="hurtBig"] .lg-chimera-serpent { animation: lgchimeraVenomStrike 820ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="chimera"][data-moment="hurtBig"] .lg-chimera-body { animation: lgchimeraPounce 820ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="chimera"][data-moment="hurtBig"] .lg-chimera-pawL { animation: lgchimeraSlamL 820ms cubic-bezier(.5,0,.2,1) both }
.lg-boss[data-motif="chimera"][data-moment="hurtBig"] .lg-chimera-wingL { --lgc-turn: -14deg; animation: lgchimeraWingBeat 820ms ease-out both }
.lg-boss[data-motif="chimera"][data-moment="hurtBig"] .lg-chimera-wingR { --lgc-turn: 14deg; animation: lgchimeraWingBeat 820ms ease-out both }

.lg-boss[data-motif="chimera"][data-moment="block"] .lg-chimera-lion { animation: lgchimeraBounceOff 620ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="chimera"][data-moment="block"] .lg-chimera-jaw { animation: lgchimeraJawShut 620ms ease-out both }
.lg-boss[data-motif="chimera"][data-moment="block"] .lg-chimera-pawL { --lgc-tuck: 14deg; animation: lgchimeraTuck 620ms ease-out both }
.lg-boss[data-motif="chimera"][data-moment="block"] .lg-chimera-pawR { --lgc-tuck: -14deg; animation: lgchimeraTuck 620ms ease-out both }

.lg-boss[data-motif="chimera"][data-moment="shield"] .lg-chimera-serpent { animation: lgchimeraFangGlance 660ms cubic-bezier(.3,0,.2,1) both }
.lg-boss[data-motif="chimera"][data-moment="shield"] .lg-chimera-jaw { animation: lgchimeraClamp 660ms ease-out both }
.lg-boss[data-motif="chimera"][data-moment="shield"] .lg-chimera-goat { animation: lgchimeraFlinchR 660ms ease-out both }

.lg-boss[data-motif="chimera"][data-moment="wind"] .lg-chimera-jaw { animation: lgchimeraRoarGape 900ms ease-out both }
.lg-boss[data-motif="chimera"][data-moment="wind"] .lg-chimera-lion { animation: lgchimeraRoarRise 900ms ease-out both }
.lg-boss[data-motif="chimera"][data-moment="wind"] .lg-chimera-goat { animation: lgchimeraBleat 900ms ease-out both }
.lg-boss[data-motif="chimera"][data-moment="wind"] .lg-chimera-serpent { animation: lgchimeraHiss 900ms ease-in-out both }
`

export default {
  // All three heads bite at once (a missed attack): a jaw in each head's color snaps shut at its own spot, Lion last.
  chimeraTrio: (p, ctx) => HEADS.map(([c, x, y], i) => {
    const w = (p.size || 30) * Math.sqrt(ctx.scale)
    const d = [90, 0, 180][i]
    const jaw = (top) => (
      <svg viewBox="0 0 100 50" style={{ position: 'absolute', left: 0, width: '100%', height: '50%', [top ? 'top' : 'bottom']: 0, overflow: 'visible', animation: `${top ? 'lgchimeraJawTop' : 'lgchimeraJawBot'} ${560 * ctx.speed}ms cubic-bezier(.6,0,.3,1) ${d}ms both` }} aria-hidden="true">
        <path d={top ? 'M2 2 Q50 -6 98 2 L98 14 L88 42 L80 16 L70 44 L60 16 L50 46 L40 16 L30 44 L20 16 L12 42 L2 14Z' : 'M2 48 Q50 56 98 48 L98 36 L88 8 L80 34 L70 6 L60 34 L50 4 L40 34 L30 6 L20 34 L12 8 L2 36Z'}
          fill={c} stroke={ctx.accent} strokeWidth="3" strokeLinejoin="round" />
      </svg>
    )
    return (
      <div key={`ct${i}`} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: `${w}cqw`, height: `${w * 0.9}cqw`, marginLeft: `${-w / 2}cqw`, marginTop: `${-w * 0.45}cqw`, filter: `drop-shadow(0 0 1.5cqw ${c})`,
        animation: `lgchimeraChomp ${700 * ctx.speed}ms ease-out ${d}ms both` }}>
        {jaw(true)}{jaw(false)}
        <div style={{ position: 'absolute', left: '20%', top: '30%', width: '60%', height: '40%', borderRadius: '50%', background: `radial-gradient(circle, #ffffff 0 25%, ${c} 50%, transparent 72%)`, animation: `lgchimeraSnapFlash ${560 * ctx.speed}ms ease-out ${d}ms both` }} />
      </div>
    )
  }),
}
