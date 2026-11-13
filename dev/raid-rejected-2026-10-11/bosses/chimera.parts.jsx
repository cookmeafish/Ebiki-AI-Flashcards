// CHIMERA's own impact parts: drawers merged into impact/parts.jsx PARTS. Name each `chimera<Name>` (never clashes).
// A drawer is (params, ctx) => node, like the shared ones (ctx: color, accent, glyph, scale, speed); CSS keyframes it
// needs go in `css` (prefix them lgchimera). Deterministic, container units, transforms and opacity only.
//
// THE DRAWING ACTS TOO: raids/chimera.svg carries lg-chimera-* parts (lion head and its jaw, goat head, serpent tail,
// body, both paws). The `css` below moves them per moment (the arena's data-moment). Its attack
// on the player (data-assault-on), its ability's parts and its knockout are in fx/chimera.jsx, whose CSS is on the page
// for the whole raid.

// The three heads' own colors (fx/chimera.jsx uses the same): gold Lion, bone Goat, venom Serpent.
const HEADS = [['#ffc531', 50, 52], ['#f6f0dc', 86, 24], ['#5dff6a', 24, 10]] // [color, x %, y %]: where the lion, goat and serpent heads sit in the drawing

export const css = `
@keyframes lgchimeraChomp { 0% { transform: scale(.3); opacity: 0 } 18% { transform: scale(1.15); opacity: 1 } 40% { transform: scale(1) } 85% { opacity: 1 } 100% { transform: scale(1.1); opacity: 0 } }
@keyframes lgchimeraJawTop { 0%, 12% { transform: translateY(-40%) } 34% { transform: translateY(0) } 44% { transform: translateY(-8%) } 54%, 100% { transform: translateY(0) } }
@keyframes lgchimeraJawBot { 0%, 12% { transform: translateY(40%) } 34% { transform: translateY(0) } 44% { transform: translateY(8%) } 54%, 100% { transform: translateY(0) } }
@keyframes lgchimeraSnapFlash { 0%, 30% { transform: scale(0); opacity: 0 } 36% { transform: scale(1.3); opacity: 1 } 100% { transform: scale(1.9); opacity: 0 } }

/* ---- the drawing itself, per moment ----
   raids/chimera.svg sets each part's pivot inline (transform-box: view-box, origin at its joint): the lion's head at
   the seam of its mane on the chest (so it TILTS and swells on its neck and never slides off it), the goat and the
   serpent at the roots of their necks, the paws at the shoulders, the body at its feet. Moves are in view-box units
   (px). Lion moves are rotations and scales only; anything that travels moves the whole body. */
@keyframes lgchimeraReel { 0% { transform: none } 14% { transform: translate(2px, 2px) rotate(1.2deg) } 45% { transform: translate(-1px, 0) rotate(-.5deg) } 100% { transform: none } }
@keyframes lgchimeraHeadJolt { 0% { transform: none } 12% { transform: rotate(7deg) scale(.95) } 34% { transform: rotate(-3deg) scale(1.01) } 60% { transform: rotate(1deg) } 100% { transform: none } }
@keyframes lgchimeraFlinchR { 0% { transform: none } 14% { transform: rotate(5deg) translateY(2px) } 45% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgchimeraFlinchL { 0% { transform: none } 14% { transform: rotate(-7deg) } 45% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgchimeraKnock { 0% { transform: none } 10% { transform: translate(3px, 4px) rotate(1.5deg) } 30% { transform: translate(-1px, 1px) rotate(-.6deg) } 60% { transform: translate(1px, 0) } 100% { transform: none } }
@keyframes lgchimeraHeadKnocked { 0% { transform: none } 10% { transform: rotate(13deg) scale(.9) } 30% { transform: rotate(-5deg) scale(1.02) } 55% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgchimeraJawShut { 0% { transform: none } 10%, 40% { transform: scaleY(.45) } 60% { transform: scaleY(1.15) } 100% { transform: none } }
@keyframes lgchimeraRearBack { 0% { transform: none } 12% { transform: rotate(6deg) translateY(4px) scale(.95) } 40% { transform: rotate(2deg) translateY(1px) } 100% { transform: none } }
@keyframes lgchimeraCoil { 0% { transform: none } 12% { transform: rotate(-10deg) scale(.88) } 40% { transform: rotate(3deg) scale(.98) } 100% { transform: none } }
@keyframes lgchimeraCarve { 0% { transform: none } 8% { transform: rotate(-7deg) } 16% { transform: rotate(6deg) } 24% { transform: rotate(-4deg) } 34% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgchimeraShudder { 0%, 100% { transform: none } 10% { transform: rotate(3deg) } 20% { transform: rotate(-3deg) } 30% { transform: rotate(2deg) } 40% { transform: rotate(-1.5deg) } }
@keyframes lgchimeraLunge { 0% { transform: none } 18% { transform: translateY(-2px) scaleY(.97) } 42% { transform: translateY(5px) } 64% { transform: translateY(3px) } 100% { transform: none } }
@keyframes lgchimeraHeadSnap { 0% { transform: none } 18% { transform: scale(.94) } 42% { transform: scale(1.1) } 64% { transform: scale(1.05) } 100% { transform: none } }
@keyframes lgchimeraJawBite { 0% { transform: none } 20% { transform: scaleY(1.7) } 44% { transform: scaleY(.5) } 64% { transform: scaleY(.85) } 100% { transform: none } }
@keyframes lgchimeraGoatButt { 0% { transform: none } 18% { transform: rotate(4deg) translateY(-1px) } 42% { transform: rotate(-4deg) translateY(5px) } 64% { transform: rotate(-2deg) translateY(3px) } 100% { transform: none } }
@keyframes lgchimeraSerpentStrike { 0% { transform: none } 16% { transform: rotate(-6deg) scale(.92) } 40% { transform: rotate(9deg) translateY(4px) } 62% { transform: rotate(5deg) translateY(2px) } 100% { transform: none } }
@keyframes lgchimeraPounce { 0% { transform: none } 16% { transform: translateY(4px) scaleY(.94) } 38% { transform: translateY(6px) } 60% { transform: translateY(3px) } 100% { transform: none } }
@keyframes lgchimeraSlamL { 0% { transform: none } 16% { transform: rotate(12deg) } 38% { transform: rotate(-7deg) } 62% { transform: rotate(-3deg) } 100% { transform: none } }
@keyframes lgchimeraSlamR { 0% { transform: none } 16% { transform: rotate(-12deg) } 38% { transform: rotate(7deg) } 62% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgchimeraBounceOff { 0% { transform: none } 14% { transform: scale(1.08) } 26% { transform: rotate(-6deg) scale(.88) } 52% { transform: rotate(-2deg) scale(.96) } 100% { transform: none } }
@keyframes lgchimeraTuckL { 0% { transform: none } 16%, 50% { transform: rotate(14deg) scale(.95) } 100% { transform: none } }
@keyframes lgchimeraTuckR { 0% { transform: none } 16%, 50% { transform: rotate(-14deg) scale(.95) } 100% { transform: none } }
@keyframes lgchimeraFangGlance { 0% { transform: none } 20% { transform: rotate(10deg) } 32% { transform: rotate(-8deg) scale(.9) } 52% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgchimeraClamp { 0% { transform: none } 18% { transform: scaleY(1.5) } 28% { transform: scaleY(.4) } 60% { transform: scaleY(.55) } 100% { transform: none } }
@keyframes lgchimeraBleat { 0% { transform: none } 18% { transform: rotate(-5deg) translateY(2px) } 34% { transform: rotate(-3deg) translateY(2px) } 48% { transform: rotate(-5deg) translateY(2px) } 100% { transform: none } }
@keyframes lgchimeraHiss { 0%, 100% { transform: none } 12% { transform: rotate(-6deg) } 24% { transform: rotate(5deg) } 36% { transform: rotate(-5deg) } 48% { transform: rotate(4deg) } 64% { transform: rotate(-2deg) } }
@keyframes lgchimeraRoarGape { 0% { transform: none } 18% { transform: scaleY(1.8) scaleX(1.08) } 70% { transform: scaleY(1.6) } 100% { transform: none } }
@keyframes lgchimeraRoarRise { 0% { transform: none } 18% { transform: rotate(-4deg) scale(1.08) } 70% { transform: rotate(3deg) scale(1.06) } 100% { transform: none } }
@keyframes lgchimeraSwell { 0% { transform: none } 20% { transform: translateY(2px) scaleY(1.02) } 70% { transform: translateY(1px) scaleY(1.01) } 100% { transform: none } }
.lg-boss[data-motif="chimera"][data-moment="hit"] .lg-chimera-body { animation: lgchimeraReel 520ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="chimera"][data-moment="hit"] .lg-chimera-head { animation: lgchimeraHeadJolt 520ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="chimera"][data-moment="hit"] .lg-chimera-goat { animation: lgchimeraFlinchR 520ms ease-out both }
.lg-boss[data-motif="chimera"][data-moment="hit"] .lg-chimera-serpent { animation: lgchimeraFlinchL 520ms ease-out both }

.lg-boss[data-motif="chimera"][data-moment="crit"] .lg-chimera-body { animation: lgchimeraKnock 680ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="chimera"][data-moment="crit"] .lg-chimera-head { animation: lgchimeraHeadKnocked 680ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="chimera"][data-moment="crit"] .lg-chimera-jaw { animation: lgchimeraJawShut 680ms ease-out both }
.lg-boss[data-motif="chimera"][data-moment="crit"] .lg-chimera-goat { animation: lgchimeraRearBack 680ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="chimera"][data-moment="crit"] .lg-chimera-serpent { animation: lgchimeraCoil 680ms cubic-bezier(.2,.8,.3,1) both }

.lg-boss[data-motif="chimera"][data-moment="sharpen"] .lg-chimera-serpent { animation: lgchimeraCarve 620ms linear both }
.lg-boss[data-motif="chimera"][data-moment="sharpen"] .lg-chimera-head { animation: lgchimeraShudder 620ms linear both }
.lg-boss[data-motif="chimera"][data-moment="sharpen"] .lg-chimera-goat { animation: lgchimeraFlinchR 620ms ease-out both }

.lg-boss[data-motif="chimera"][data-moment="hurt"] .lg-chimera-body { animation: lgchimeraLunge 640ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="chimera"][data-moment="hurt"] .lg-chimera-head { animation: lgchimeraHeadSnap 640ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="chimera"][data-moment="hurt"] .lg-chimera-jaw { animation: lgchimeraJawBite 640ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="chimera"][data-moment="hurt"] .lg-chimera-goat { animation: lgchimeraGoatButt 640ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="chimera"][data-moment="hurt"] .lg-chimera-serpent { animation: lgchimeraSerpentStrike 640ms cubic-bezier(.4,0,.2,1) both }

.lg-boss[data-motif="chimera"][data-moment="hurtBig"] .lg-chimera-body { animation: lgchimeraPounce 820ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="chimera"][data-moment="hurtBig"] .lg-chimera-head { animation: lgchimeraHeadSnap 820ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="chimera"][data-moment="hurtBig"] .lg-chimera-jaw { animation: lgchimeraJawBite 820ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="chimera"][data-moment="hurtBig"] .lg-chimera-goat { animation: lgchimeraGoatButt 820ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="chimera"][data-moment="hurtBig"] .lg-chimera-serpent { animation: lgchimeraSerpentStrike 820ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="chimera"][data-moment="hurtBig"] .lg-chimera-pawL { animation: lgchimeraSlamL 820ms cubic-bezier(.5,0,.2,1) both }
.lg-boss[data-motif="chimera"][data-moment="hurtBig"] .lg-chimera-pawR { animation: lgchimeraSlamR 820ms cubic-bezier(.5,0,.2,1) both }

.lg-boss[data-motif="chimera"][data-moment="block"] .lg-chimera-head { animation: lgchimeraBounceOff 620ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="chimera"][data-moment="block"] .lg-chimera-jaw { animation: lgchimeraJawShut 620ms ease-out both }
.lg-boss[data-motif="chimera"][data-moment="block"] .lg-chimera-pawL { animation: lgchimeraTuckL 620ms ease-out both }
.lg-boss[data-motif="chimera"][data-moment="block"] .lg-chimera-pawR { animation: lgchimeraTuckR 620ms ease-out both }

.lg-boss[data-motif="chimera"][data-moment="shield"] .lg-chimera-serpent { animation: lgchimeraFangGlance 660ms cubic-bezier(.3,0,.2,1) both }
.lg-boss[data-motif="chimera"][data-moment="shield"] .lg-chimera-jaw { animation: lgchimeraClamp 660ms ease-out both }
.lg-boss[data-motif="chimera"][data-moment="shield"] .lg-chimera-goat { animation: lgchimeraFlinchR 660ms ease-out both }

.lg-boss[data-motif="chimera"][data-moment="wind"] .lg-chimera-body { animation: lgchimeraSwell 900ms ease-out both }
.lg-boss[data-motif="chimera"][data-moment="wind"] .lg-chimera-jaw { animation: lgchimeraRoarGape 900ms ease-out both }
.lg-boss[data-motif="chimera"][data-moment="wind"] .lg-chimera-head { animation: lgchimeraRoarRise 900ms ease-out both }
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
