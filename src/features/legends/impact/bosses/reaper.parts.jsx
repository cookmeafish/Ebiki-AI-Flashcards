// REAPER's own impact parts: drawers merged into impact/parts.jsx PARTS. Name each `reaper<Name>` (never clashes).
// A drawer is (params, ctx) => node, like the shared ones (ctx: color, accent, glyph, scale, speed); CSS keyframes it
// needs go in `css` (prefix them lgreaper). Deterministic, container units, transforms and opacity only.
//
// THE DRAWING ACTS TOO: raids/reaper.svg carries lg-reaper-* parts (the vertebra scythe with its hand, the skull and
// its jaw in every phase, the soul lantern). The `css` below moves them per moment (the arena's data-moment). His
// attack on the player (data-assault-on), his ability's parts and his knockout are in fx/reaper.jsx, whose CSS is on
// the page for the whole raid.

export const css = `
@keyframes lgreaperBladeSweep { 0% { transform: rotate(-150deg); opacity: 0 } 10% { opacity: 1 } 55% { transform: rotate(18deg); opacity: 1 } 72% { transform: rotate(30deg); opacity: 1 } 100% { transform: rotate(36deg); opacity: 0 } }
@keyframes lgreaperTrail { 0% { opacity: 0; transform: rotate(-150deg) } 30% { opacity: .9 } 55% { opacity: .8; transform: rotate(18deg) } 100% { opacity: 0; transform: rotate(30deg) } }

/* ---- the drawing itself, per moment ---- */
@keyframes lgreaperJolt { 0% { transform: none } 12% { transform: translateY(-12%) rotate(-10deg) scale(.9) } 34% { transform: translateY(3%) rotate(5deg) } 60% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgreaperLanternSwing { 0%, 100% { transform: none } 14% { transform: rotate(22deg) } 34% { transform: rotate(-16deg) } 54% { transform: rotate(9deg) } 74% { transform: rotate(-4deg) } }
@keyframes lgreaperWhiplash { 0% { transform: none } 10% { transform: translateX(-12%) rotate(-22deg) scale(.88) } 28% { transform: translateX(6%) rotate(12deg) } 48% { transform: rotate(-5deg) } 100% { transform: none } }
@keyframes lgreaperJawDrop { 0% { transform: none } 10%, 40% { transform: translateY(24%) rotate(8deg) } 60% { transform: translateY(-4%) } 100% { transform: none } }
@keyframes lgreaperScytheJerk { 0% { transform: none } 12% { transform: rotate(-14deg) } 34% { transform: rotate(6deg) } 100% { transform: none } }
@keyframes lgreaperShudder { 0%, 100% { transform: none } 8% { transform: translateX(7%) } 16% { transform: translateX(-7%) } 24% { transform: translateX(5%) } 32% { transform: translateX(-4%) } 44% { transform: translateX(2%) } }
@keyframes lgreaperRattle { 0%, 100% { transform: none } 8% { transform: rotate(4deg) } 16% { transform: rotate(-4deg) } 24% { transform: rotate(3deg) } 32% { transform: rotate(-3deg) } 44% { transform: rotate(1deg) } }
@keyframes lgreaperLanternLunge { 0% { transform: none } 16% { transform: rotate(-28deg) } 40% { transform: rotate(34deg) scale(1.2) } 62% { transform: rotate(-12deg) } 100% { transform: none } }
@keyframes lgreaperLanternFlare { 0% { transform: none; filter: none } 16% { transform: rotate(-30deg) scale(.9); filter: brightness(1.2) } 40% { transform: rotate(40deg) scale(1.4); filter: brightness(2.2) drop-shadow(0 0 3px #6fe3ff) } 70% { transform: rotate(-10deg) scale(1.15); filter: brightness(1.5) } 100% { transform: none; filter: none } }
@keyframes lgreaperOverreach { 0% { transform: none } 14% { transform: rotate(-55deg) translateY(-6%) } 34% { transform: rotate(80deg) translate(8%, 6%) scale(1.12) } 46% { transform: rotate(96deg) translate(10%, 8%) scale(1.12) } 66% { transform: rotate(60deg) translate(6%, 4%) } 100% { transform: none } }
@keyframes lgreaperBatted { 0% { transform: none } 14% { transform: rotate(24deg) } 26% { transform: rotate(-34deg) translateY(-6%) } 50% { transform: rotate(-10deg) } 100% { transform: none } }
@keyframes lgreaperFlinchBack { 0% { transform: none } 18% { transform: translateY(-10%) scale(.88) } 50% { transform: translateY(-3%) scale(.96) } 100% { transform: none } }
@keyframes lgreaperGlanceOff { 0% { transform: none } 18% { transform: rotate(30deg) translateX(4%) } 30% { transform: rotate(52deg) translate(10%, 6%) } 46% { transform: rotate(-8deg) } 100% { transform: none } }
@keyframes lgreaperClack { 0%, 100% { transform: none } 15% { transform: translateY(14%) } 25% { transform: none } 40% { transform: translateY(12%) } 50% { transform: none } }
@keyframes lgreaperDim { 0% { transform: none; filter: none } 20%, 70% { transform: scale(.88) rotate(-6deg); filter: brightness(.35) saturate(.4) } 100% { transform: none; filter: none } }
@keyframes lgreaperBow { 0% { transform: none } 22%, 70% { transform: translateY(8%) rotate(9deg) scale(.95) } 100% { transform: none } }
@keyframes lgreaperDroop { 0% { transform: none } 22%, 70% { transform: rotate(14deg) translateY(4%) } 100% { transform: none } }

.lg-boss[data-motif="reaper"][data-moment="hit"] .lg-reaper-head { animation: lgreaperJolt 520ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="reaper"][data-moment="hit"] .lg-reaper-lantern { animation: lgreaperLanternSwing 700ms ease-out both }

.lg-boss[data-motif="reaper"][data-moment="crit"] .lg-reaper-head { animation: lgreaperWhiplash 660ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="reaper"][data-moment="crit"] .lg-reaper-jaw { animation: lgreaperJawDrop 660ms ease-out both }
.lg-boss[data-motif="reaper"][data-moment="crit"] .lg-reaper-scythe { animation: lgreaperScytheJerk 660ms ease-out both }

.lg-boss[data-motif="reaper"][data-moment="sharpen"] .lg-reaper-head { animation: lgreaperShudder 600ms linear both }
.lg-boss[data-motif="reaper"][data-moment="sharpen"] .lg-reaper-scythe { animation: lgreaperRattle 600ms linear both }
.lg-boss[data-motif="reaper"][data-moment="sharpen"] .lg-reaper-lantern { animation: lgreaperLanternSwing 600ms ease-out both }

.lg-boss[data-motif="reaper"][data-moment="hurt"] .lg-reaper-lantern { animation: lgreaperLanternLunge 640ms cubic-bezier(.4,0,.2,1) both }
.lg-boss.lg-boss[data-motif="reaper"][data-moment="hurtBig"] .lg-reaper-scythe { animation: lgreaperOverreach 820ms cubic-bezier(.5,0,.2,1) both }
.lg-boss[data-motif="reaper"][data-moment="hurtBig"] .lg-reaper-lantern { animation: lgreaperLanternFlare 820ms cubic-bezier(.4,0,.2,1) both }

.lg-boss[data-motif="reaper"][data-moment="block"] .lg-reaper-scythe { animation: lgreaperBatted 600ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="reaper"][data-moment="block"] .lg-reaper-head { animation: lgreaperFlinchBack 600ms ease-out both }

.lg-boss[data-motif="reaper"][data-moment="shield"] .lg-reaper-scythe { animation: lgreaperGlanceOff 660ms cubic-bezier(.3,0,.2,1) both }
.lg-boss[data-motif="reaper"][data-moment="shield"] .lg-reaper-jaw { animation: lgreaperClack 660ms linear both }
.lg-boss[data-motif="reaper"][data-moment="shield"] .lg-reaper-lantern { animation: lgreaperLanternSwing 660ms ease-out both }

.lg-boss[data-motif="reaper"][data-moment="wind"] .lg-reaper-lantern { animation: lgreaperDim 900ms ease-in-out both }
.lg-boss[data-motif="reaper"][data-moment="wind"] .lg-reaper-head { animation: lgreaperBow 900ms ease-in-out both }
.lg-boss[data-motif="reaper"][data-moment="wind"] .lg-reaper-scythe { animation: lgreaperDroop 900ms ease-in-out both }
`

export default {
  // His scythe's blade sweeps across the box, a cold bone crescent with a soul-blue trail, and the cut lingers.
  reaperBlade: (p, ctx) => {
    const c = p.color || ctx.color
    const ms = 620 * ctx.speed
    return (
      <div key="rb" style={{ position: 'absolute', left: '22%', top: '18%', width: 0, height: 0 }}>
        <div style={{ position: 'absolute', left: '-62cqw', top: '-62cqw', width: '124cqw', height: '124cqw', borderRadius: '50%',
          background: `conic-gradient(from -20deg, transparent 0deg, ${c}00 40deg, ${c}88 95deg, #ffffffcc 100deg, transparent 101deg)`, animation: `lgreaperTrail ${ms}ms cubic-bezier(.6,0,.2,1) both` }} />
        <svg viewBox="-60 -60 120 120" style={{ position: 'absolute', left: '-62cqw', top: '-62cqw', width: '124cqw', height: '124cqw', overflow: 'visible', filter: `drop-shadow(0 0 1.5cqw ${c})`, animation: `lgreaperBladeSweep ${ms}ms cubic-bezier(.6,0,.2,1) both` }} aria-hidden="true">
          <path d="M0 0 L46 0" stroke="#1a1214" strokeWidth="5" strokeLinecap="round" />
          <path d="M44 -6 C56 6 58 26 46 44 C48 28 44 12 36 2 Z" fill="#f1e9d2" stroke="#1a1214" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M45 -2 C53 8 55 22 48 36" fill="none" stroke="#ffffff" strokeWidth="1.4" />
          <path d="M42 4 L39 9 L44 9 Z M45 14 L41 19 L46 18 Z" fill="#1a1214" />
        </svg>
      </div>
    )
  },
}
