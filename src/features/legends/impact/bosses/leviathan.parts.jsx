// LEVIATHAN's own impact parts: drawers merged into impact/parts.jsx PARTS. Name each `leviathan<Name>` (never
// clashes). A drawer is (params, ctx) => node, like the shared ones (ctx: color, accent, glyph, scale, speed); CSS
// keyframes it needs go in `css` (prefix them lgleviathan). Deterministic, container units, transforms and opacity only.
//
// THE DRAWING ACTS TOO: raids/leviathan.svg carries lg-leviathan-* parts (the drowned town on its crown, the brow and
// eyes, the toothed lower jaw, the anchored horn, the side fins, phase 2's tentacles, phase 3's spiral maw and its four
// toothed flaps). The `css` below moves them per moment (the arena's data-moment). Its attack on the player
// (data-assault-on), its ability's parts and its knockout are in fx/leviathan.jsx, whose CSS is on the page for the
// whole raid.

export const css = `
@keyframes lgleviathanTideRise { 0% { transform: translateY(70%) scaleY(.3); opacity: 0 } 14% { opacity: 1 } 42% { transform: translateY(0) scaleY(1) } 58% { transform: translate(8%, -4%) rotate(8deg) scaleY(1.05) } 78% { transform: translate(26%, 14%) rotate(20deg) scaleY(.8); opacity: 1 } 100% { transform: translate(40%, 30%) rotate(26deg) scaleY(.5); opacity: 0 } }
@keyframes lgleviathanFoam { 0%, 50% { transform: scale(0); opacity: 0 } 62% { transform: scale(1.2); opacity: 1 } 100% { transform: scale(1.7) translateY(-20%); opacity: 0 } }

/* P2-P3 tentacles WHIP about their own roots (tentL root -2 112, tentR root 122 112, wrappers in raids/leviathan.svg):
   they rear up out of the water behind the body, then crack down inward toward the maw. They sit behind the body, so
   the rise is what shows them; rotating about the root (never scaling up) keeps them inside the clip. */
@keyframes lgleviathanWhipL { 0% { transform: none } 16% { transform: translateY(-6px) rotate(-3deg) } 38% { transform: translateY(-30px) rotate(-5deg) } 54% { transform: translateY(-8px) rotate(14deg) } 72% { transform: translateY(-2px) rotate(4deg) } 100% { transform: none } }
@keyframes lgleviathanWhipR { 0% { transform: none } 16% { transform: translateY(-6px) rotate(3deg) } 38% { transform: translateY(-30px) rotate(5deg) } 54% { transform: translateY(-8px) rotate(-14deg) } 72% { transform: translateY(-2px) rotate(-4deg) } 100% { transform: none } }
@keyframes lgleviathanWhipBigL { 0% { transform: none } 16% { transform: translateY(-6px) rotate(-3deg) } 38% { transform: translateY(-34px) rotate(-5deg) } 54% { transform: translateY(-8px) rotate(16deg) } 72% { transform: translateY(-2px) rotate(4deg) } 100% { transform: none } }
@keyframes lgleviathanWhipBigR { 0% { transform: none } 16% { transform: translateY(-6px) rotate(3deg) } 38% { transform: translateY(-34px) rotate(5deg) } 54% { transform: translateY(-8px) rotate(-16deg) } 72% { transform: translateY(-2px) rotate(-4deg) } 100% { transform: none } }
.lg-boss.lg-boss[data-motif="leviathan"] .lg-leviathan-tentL { transform-box: view-box; transform-origin: -2px 112px }
.lg-boss.lg-boss[data-motif="leviathan"] .lg-leviathan-tentR { transform-box: view-box; transform-origin: 122px 112px }
/* ---- the drawing itself, per moment ---- */
/* The drowned town, the tentacles, the phase 3 flaps and the fins nearly fill the arena's clip already (the fins touch
   both sides), so their moves play at a share of full strength (--gl, 1 = full) and the fins flare UP, never wider:
   the clip edge would slice them flat. Set on every named part so a small part inside a big one keeps full strength. */
.lg-boss[data-motif="leviathan"] [class*="lg-leviathan-"] { --gl: 1 }
.lg-boss[data-motif="leviathan"] .lg-leviathan-town { --gl: .33 }
.lg-boss[data-motif="leviathan"] .lg-leviathan-tentacles { --gl: .3 }
.lg-boss[data-motif="leviathan"] .lg-leviathan-tentacles3 { --gl: .4 }
@keyframes lgleviathanWince { 0% { transform: none } 12% { transform: scaleY(.62) translateY(4%) } 40% { transform: scaleY(1.06) } 100% { transform: none } }
@keyframes lgleviathanRattle { 0%, 100% { transform: none } 8% { transform: translate(calc(3% * var(--gl, 1)), calc(-6% * var(--gl, 1))) rotate(calc(3deg * var(--gl, 1))) } 18% { transform: translate(calc(-3% * var(--gl, 1)), calc(-2% * var(--gl, 1))) rotate(calc(-3deg * var(--gl, 1))) } 28% { transform: translate(calc(2% * var(--gl, 1)), calc(-3% * var(--gl, 1))) rotate(calc(2deg * var(--gl, 1))) } 40% { transform: rotate(calc(-1deg * var(--gl, 1))) } }
@keyframes lgleviathanClackShut { 0% { transform: none } 12% { transform: translateY(-8%) } 30% { transform: translateY(3%) } 100% { transform: none } }
@keyframes lgleviathanBrowKnock { 0% { transform: none } 10% { transform: translateY(-14%) rotate(-7deg) scaleY(.8) } 30% { transform: translateY(4%) rotate(3deg) } 100% { transform: none } }
@keyframes lgleviathanTownJump { 0% { transform: none } 10% { transform: translateY(calc(-18% * var(--gl, 1))) rotate(calc(-4deg * var(--gl, 1))) } 26% { transform: translateY(calc(3% * var(--gl, 1))) rotate(calc(3deg * var(--gl, 1))) } 40% { transform: translateY(calc(-5% * var(--gl, 1))) } 56% { transform: none } 70% { transform: translateY(calc(-1% * var(--gl, 1))) } 100% { transform: none } }
@keyframes lgleviathanHornWhip { 0% { transform: none } 10% { transform: rotate(-22deg) } 30% { transform: rotate(10deg) } 54% { transform: rotate(-4deg) } 100% { transform: none } }
@keyframes lgleviathanJawSlack { 0% { transform: none } 10%, 40% { transform: translateY(16%) rotate(3deg) } 100% { transform: none } }
@keyframes lgleviathanSlosh { 0%, 100% { transform: none } 8% { transform: translateX(calc(8% * var(--gl, 1))) rotate(calc(5deg * var(--gl, 1))) } 18% { transform: translateX(calc(-8% * var(--gl, 1))) rotate(calc(-5deg * var(--gl, 1))) } 28% { transform: translateX(calc(5% * var(--gl, 1))) rotate(calc(3deg * var(--gl, 1))) } 40% { transform: translateX(calc(-2% * var(--gl, 1))) } }
@keyframes lgleviathanChip { 0%, 100% { transform: none } 10% { transform: rotate(12deg) translateY(-4%) } 22% { transform: rotate(-8deg) } 36% { transform: rotate(4deg) } }
@keyframes lgleviathanRock { 0%, 100% { transform: none } 18% { transform: rotate(10deg) translateY(-5%) } 46% { transform: rotate(-7deg) translateY(-2%) } 72% { transform: rotate(3deg) } }
@keyframes lgleviathanHornSurge { 0% { transform: none } 18% { transform: rotate(-14deg) } 42% { transform: rotate(12deg) scale(1.1) translate(-4%, 4%) } 70% { transform: rotate(6deg) } 100% { transform: none } }
@keyframes lgleviathanCapsize { 0% { transform: none } 16% { transform: rotate(-6deg) translateY(-2%) } 40% { transform: rotate(18deg) translateY(-6%) } 62% { transform: rotate(-6deg) translateY(2%) } 80% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgleviathanRam { 0% { transform: none } 16% { transform: rotate(-26deg) translateY(-6%) } 40% { transform: rotate(20deg) translate(-10%, 14%) scale(1.06) } 66% { transform: rotate(10deg) translate(-4%, 6%) } 100% { transform: none } }
@keyframes lgleviathanLash { 0% { transform: none } 16% { transform: scale(calc(1 + -0.18 * var(--gl, 1))) } 40% { transform: scale(calc(1 + 0.32 * var(--gl, 1))) rotate(calc(4deg * var(--gl, 1))) } 66% { transform: scale(calc(1 + 0.12 * var(--gl, 1))) } 100% { transform: none } }
@keyframes lgleviathanSqueeze { 0% { transform: none } 12%, 48% { transform: scaleY(.38) translateY(10%) } 100% { transform: none } }
@keyframes lgleviathanJawUp { 0% { transform: none } 12% { transform: translateY(-10%) scaleY(.9) } 40% { transform: translateY(-4%) } 100% { transform: none } }
@keyframes lgleviathanHornBack { 0% { transform: none } 12% { transform: rotate(-30deg) translateX(6%) } 44% { transform: rotate(-8deg) } 100% { transform: none } }
@keyframes lgleviathanFinRebound { 0% { transform: none } 18% { transform: scale(1, 1.16) } 30% { transform: scaleX(.78) } 52% { transform: scale(.97, 1.05) } 100% { transform: none } }
@keyframes lgleviathanClamp { 0% { transform: none } 18% { transform: translateY(12%) } 30% { transform: translateY(-8%) } 56% { transform: translateY(-2%) } 100% { transform: none } }
@keyframes lgleviathanScowl { 0% { transform: none } 20%, 70% { transform: translateY(6%) scaleY(.74) } 100% { transform: none } }
@keyframes lgleviathanGrind { 0%, 100% { transform: none } 15% { transform: translateX(-4%) } 30% { transform: translateX(4%) } 45% { transform: translateX(-3%) } 60% { transform: translateX(3%) } 75% { transform: translateX(-1%) } }
@keyframes lgleviathanList { 0%, 100% { transform: none } 30% { transform: rotate(calc(-7deg * var(--gl, 1))) translateX(calc(-3% * var(--gl, 1))) } 70% { transform: rotate(calc(6deg * var(--gl, 1))) translateX(calc(3% * var(--gl, 1))) } }
@keyframes lgleviathanIris { 0% { transform: none } 12% { transform: scale(.7) rotate(-30deg) } 40% { transform: scale(1.1) rotate(10deg) } 100% { transform: none } }
@keyframes lgleviathanFlapsShut { 0% { transform: none } 12% { transform: scale(calc(1 + -0.2 * var(--gl, 1))) } 40% { transform: scale(calc(1 + 0.06 * var(--gl, 1))) } 100% { transform: none } }
@keyframes lgleviathanWhirl { 0% { transform: none } 14% { transform: rotate(-40deg) scale(.86) } 42% { transform: rotate(120deg) scale(1.25) } 70% { transform: rotate(160deg) scale(1.1) } 100% { transform: rotate(180deg) } }

.lg-boss[data-motif="leviathan"][data-moment="hit"] .lg-leviathan-brow { animation: lgleviathanWince 520ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="leviathan"][data-moment="hit"] .lg-leviathan-town { animation: lgleviathanRattle 560ms linear both }
.lg-boss[data-motif="leviathan"][data-moment="hit"] .lg-leviathan-jaw { animation: lgleviathanClackShut 520ms ease-out both }
.lg-boss[data-motif="leviathan"][data-moment="hit"] .lg-leviathan-maw3 { animation: lgleviathanIris 520ms ease-out both }

.lg-boss[data-motif="leviathan"][data-moment="crit"] .lg-leviathan-brow { animation: lgleviathanBrowKnock 660ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="leviathan"][data-moment="crit"] .lg-leviathan-town { animation: lgleviathanTownJump 700ms ease-out both }
.lg-boss[data-motif="leviathan"][data-moment="crit"] .lg-leviathan-horn { animation: lgleviathanHornWhip 660ms ease-out both }
.lg-boss[data-motif="leviathan"][data-moment="crit"] .lg-leviathan-jaw { animation: lgleviathanJawSlack 660ms ease-out both }
.lg-boss[data-motif="leviathan"][data-moment="crit"] .lg-leviathan-tentacles3 { animation: lgleviathanFlapsShut 660ms ease-out both }
.lg-boss[data-motif="leviathan"][data-moment="crit"] .lg-leviathan-maw3 { animation: lgleviathanIris 660ms ease-out both }

.lg-boss[data-motif="leviathan"][data-moment="sharpen"] .lg-leviathan-town { animation: lgleviathanSlosh 620ms linear both }
.lg-boss[data-motif="leviathan"][data-moment="sharpen"] .lg-leviathan-horn { animation: lgleviathanChip 620ms ease-out both }
.lg-boss[data-motif="leviathan"][data-moment="sharpen"] .lg-leviathan-brow, .lg-boss[data-motif="leviathan"][data-moment="sharpen"] .lg-leviathan-maw3 { animation: lgleviathanWince 620ms ease-out both }

.lg-boss[data-motif="leviathan"][data-moment="hurt"] .lg-leviathan-town { animation: lgleviathanRock 680ms ease-in-out both }
.lg-boss[data-motif="leviathan"][data-moment="hurt"] .lg-leviathan-horn { animation: lgleviathanHornSurge 680ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="leviathan"][data-moment="hurt"] .lg-leviathan-tentL { animation: lgleviathanWhipL 680ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="leviathan"][data-moment="hurt"] .lg-leviathan-tentR { animation: lgleviathanWhipR 680ms cubic-bezier(.4,0,.2,1) both }

.lg-boss[data-motif="leviathan"][data-moment="hurtBig"] .lg-leviathan-town { animation: lgleviathanCapsize 840ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="leviathan"][data-moment="hurtBig"] .lg-leviathan-horn { animation: lgleviathanRam 840ms cubic-bezier(.5,0,.2,1) both }
.lg-boss[data-motif="leviathan"][data-moment="hurtBig"] .lg-leviathan-tentL { animation: lgleviathanWhipBigL 840ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="leviathan"][data-moment="hurtBig"] .lg-leviathan-tentR { animation: lgleviathanWhipBigR 840ms cubic-bezier(.4,0,.2,1) both }
.lg-boss.lg-boss[data-motif="leviathan"][data-moment="hurtBig"] .lg-leviathan-maw3 { animation: lgleviathanWhirl 840ms cubic-bezier(.4,0,.2,1) both }

.lg-boss[data-motif="leviathan"][data-moment="block"] .lg-leviathan-brow { animation: lgleviathanSqueeze 620ms ease-out both }
.lg-boss[data-motif="leviathan"][data-moment="block"] .lg-leviathan-jaw { animation: lgleviathanJawUp 620ms ease-out both }
.lg-boss[data-motif="leviathan"][data-moment="block"] .lg-leviathan-horn { animation: lgleviathanHornBack 620ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="leviathan"][data-moment="block"] .lg-leviathan-tentacles3 { animation: lgleviathanFlapsShut 620ms ease-out both }

.lg-boss[data-motif="leviathan"][data-moment="shield"] .lg-leviathan-fins { animation: lgleviathanFinRebound 660ms cubic-bezier(.3,0,.2,1) both }
.lg-boss[data-motif="leviathan"][data-moment="shield"] .lg-leviathan-jaw { animation: lgleviathanClamp 660ms ease-out both }
.lg-boss[data-motif="leviathan"][data-moment="shield"] .lg-leviathan-town { animation: lgleviathanRattle 660ms linear both }
.lg-boss[data-motif="leviathan"][data-moment="shield"] .lg-leviathan-tentacles3 { animation: lgleviathanFinRebound 660ms ease-out both }

.lg-boss[data-motif="leviathan"][data-moment="wind"] .lg-leviathan-brow { animation: lgleviathanScowl 900ms ease-in-out both }
.lg-boss[data-motif="leviathan"][data-moment="wind"] .lg-leviathan-jaw { animation: lgleviathanGrind 900ms linear both }
.lg-boss[data-motif="leviathan"][data-moment="wind"] .lg-leviathan-town { animation: lgleviathanList 900ms ease-in-out both }
.lg-boss[data-motif="leviathan"][data-moment="wind"] .lg-leviathan-maw3 { animation: lgleviathanGrind 900ms linear both }
`

export default {
  // Its strike: a wall of water rears out of the sea in front of it, curls over and crashes forward toward you,
  // foam bursting where it breaks.
  leviathanTide: (p, ctx) => {
    const c = p.color || ctx.color
    const ms = 760 * ctx.speed
    return (
      <div key="lt" style={{ position: 'absolute', left: '-10%', right: '-10%', top: '20%', bottom: '-12%' }}>
        <svg viewBox="0 0 100 80" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', transformOrigin: '30% 100%', filter: `drop-shadow(0 0 1.5cqw ${c})`, animation: `lgleviathanTideRise ${ms}ms cubic-bezier(.5,0,.3,1) both` }} aria-hidden="true">
          <path d="M0 80 L0 46 C10 30 24 12 46 6 C66 0 84 8 90 22 C80 14 66 16 62 28 C60 38 70 44 80 40 C70 52 52 50 46 40 C40 54 30 66 26 80 Z" fill={c} fillOpacity=".88" stroke="#e8f8ff" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M8 40 C18 24 32 12 50 9 C64 7 78 11 86 20" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M14 70 C22 56 30 48 40 44" fill="none" stroke="#9fdcff" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ position: 'absolute', left: `${62 + i * 7}%`, top: `${8 + (i % 2) * 10}%`, width: `${8 + (i % 3) * 3}cqw`, height: `${8 + (i % 3) * 3}cqw`, borderRadius: '50%',
            background: 'radial-gradient(circle, #ffffff 0 35%, #e8f8ffcc 55%, transparent 72%)', animation: `lgleviathanFoam ${ms}ms ease-out ${i * 30}ms both` }} />
        ))}
      </div>
    )
  },
}
