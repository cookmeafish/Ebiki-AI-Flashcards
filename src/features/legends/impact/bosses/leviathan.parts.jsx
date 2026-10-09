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

/* ---- the drawing itself, per moment ---- */
@keyframes lgleviathanWince { 0% { transform: none } 12% { transform: scaleY(.62) translateY(4%) } 40% { transform: scaleY(1.06) } 100% { transform: none } }
@keyframes lgleviathanRattle { 0%, 100% { transform: none } 8% { transform: translate(3%, -6%) rotate(3deg) } 18% { transform: translate(-3%, -2%) rotate(-3deg) } 28% { transform: translate(2%, -3%) rotate(2deg) } 40% { transform: rotate(-1deg) } }
@keyframes lgleviathanClackShut { 0% { transform: none } 12% { transform: translateY(-8%) } 30% { transform: translateY(3%) } 100% { transform: none } }
@keyframes lgleviathanBrowKnock { 0% { transform: none } 10% { transform: translateY(-14%) rotate(-7deg) scaleY(.8) } 30% { transform: translateY(4%) rotate(3deg) } 100% { transform: none } }
@keyframes lgleviathanTownJump { 0% { transform: none } 10% { transform: translateY(-18%) rotate(-4deg) } 26% { transform: translateY(3%) rotate(3deg) } 40% { transform: translateY(-5%) } 56% { transform: none } 70% { transform: translateY(-1%) } 100% { transform: none } }
@keyframes lgleviathanHornWhip { 0% { transform: none } 10% { transform: rotate(-22deg) } 30% { transform: rotate(10deg) } 54% { transform: rotate(-4deg) } 100% { transform: none } }
@keyframes lgleviathanJawSlack { 0% { transform: none } 10%, 40% { transform: translateY(16%) rotate(3deg) } 100% { transform: none } }
@keyframes lgleviathanSlosh { 0%, 100% { transform: none } 8% { transform: translateX(8%) rotate(5deg) } 18% { transform: translateX(-8%) rotate(-5deg) } 28% { transform: translateX(5%) rotate(3deg) } 40% { transform: translateX(-2%) } }
@keyframes lgleviathanChip { 0%, 100% { transform: none } 10% { transform: rotate(12deg) translateY(-4%) } 22% { transform: rotate(-8deg) } 36% { transform: rotate(4deg) } }
@keyframes lgleviathanRock { 0%, 100% { transform: none } 18% { transform: rotate(-9deg) translateX(-4%) } 46% { transform: rotate(10deg) translateX(4%) } 72% { transform: rotate(-4deg) } }
@keyframes lgleviathanHornSurge { 0% { transform: none } 18% { transform: rotate(-14deg) } 42% { transform: rotate(18deg) scale(1.12) } 70% { transform: rotate(6deg) } 100% { transform: none } }
@keyframes lgleviathanCapsize { 0% { transform: none } 16% { transform: rotate(-14deg) translate(-6%, -6%) } 40% { transform: rotate(16deg) translate(8%, -14%) } 62% { transform: rotate(-6deg) translate(-2%, 2%) } 100% { transform: none } }
@keyframes lgleviathanRam { 0% { transform: none } 16% { transform: rotate(-26deg) translateY(-6%) } 40% { transform: rotate(32deg) translate(8%, 6%) scale(1.2) } 66% { transform: rotate(14deg) } 100% { transform: none } }
@keyframes lgleviathanLash { 0% { transform: none } 16% { transform: scale(.82) } 40% { transform: scale(1.32) rotate(4deg) } 66% { transform: scale(1.12) } 100% { transform: none } }
@keyframes lgleviathanSqueeze { 0% { transform: none } 12%, 48% { transform: scaleY(.38) translateY(10%) } 100% { transform: none } }
@keyframes lgleviathanJawUp { 0% { transform: none } 12% { transform: translateY(-10%) scaleY(.9) } 40% { transform: translateY(-4%) } 100% { transform: none } }
@keyframes lgleviathanHornBack { 0% { transform: none } 12% { transform: rotate(-30deg) translateX(6%) } 44% { transform: rotate(-8deg) } 100% { transform: none } }
@keyframes lgleviathanFinRebound { 0% { transform: none } 18% { transform: scaleX(1.3) } 30% { transform: scaleX(.78) } 52% { transform: scaleX(1.06) } 100% { transform: none } }
@keyframes lgleviathanClamp { 0% { transform: none } 18% { transform: translateY(12%) } 30% { transform: translateY(-8%) } 56% { transform: translateY(-2%) } 100% { transform: none } }
@keyframes lgleviathanScowl { 0% { transform: none } 20%, 70% { transform: translateY(6%) scaleY(.74) } 100% { transform: none } }
@keyframes lgleviathanGrind { 0%, 100% { transform: none } 15% { transform: translateX(-4%) } 30% { transform: translateX(4%) } 45% { transform: translateX(-3%) } 60% { transform: translateX(3%) } 75% { transform: translateX(-1%) } }
@keyframes lgleviathanList { 0%, 100% { transform: none } 30% { transform: rotate(-7deg) translateX(-3%) } 70% { transform: rotate(6deg) translateX(3%) } }
@keyframes lgleviathanIris { 0% { transform: none } 12% { transform: scale(.7) rotate(-30deg) } 40% { transform: scale(1.1) rotate(10deg) } 100% { transform: none } }
@keyframes lgleviathanFlapsShut { 0% { transform: none } 12% { transform: scale(.8) } 40% { transform: scale(1.06) } 100% { transform: none } }
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
.lg-boss[data-motif="leviathan"][data-moment="hurt"] .lg-leviathan-tentacles { animation: lgleviathanLash 680ms cubic-bezier(.4,0,.2,1) both }

.lg-boss[data-motif="leviathan"][data-moment="hurtBig"] .lg-leviathan-town { animation: lgleviathanCapsize 840ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="leviathan"][data-moment="hurtBig"] .lg-leviathan-horn { animation: lgleviathanRam 840ms cubic-bezier(.5,0,.2,1) both }
.lg-boss[data-motif="leviathan"][data-moment="hurtBig"] .lg-leviathan-tentacles { animation: lgleviathanLash 840ms cubic-bezier(.4,0,.2,1) both }
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
