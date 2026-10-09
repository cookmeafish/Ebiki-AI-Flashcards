// What the Kaleido's Prism (prism) LOOKS like. The fx contract is in fx/index.js, the juice format in fx/_juice.js.
// Fixed bright colors; BossArena skips all of it in focus mode, with Still bosses and under reduced motion. The floater
// already starts with the answer's damage, so the texts never repeat the number.
import { anim, around, ring } from './_kit'
import { pivots, FALLEN } from '../impact/bosses/kaleido.parts'

// THE KNIGHT'S OWN PARTS (raids/kaleido.svg hook classes; pivots in impact/bosses/kaleido.parts.jsx) for what is not a
// plain strike moment: his prism ray at the player (data-assault-on, from the moment it fires: he hunches and draws
// back, the reflections lean in to focus the light; then he THRUSTS: the helm drives forward, the phase 3 sword cuts
// down and the gauntlet punches out, the reflections flash forward with him; a heavy blow thrusts twice), his ability
// reactions (.lgr-kaleido-<fx>) and his fallen pose after the knockout. Off with every effect (lg-fx-off).
const P = '.lg-boss[data-motif="kaleido"]'
const A = `${P}[data-assault-on]`
const H = `${P}[data-assault-on][data-moment="hurtBig"]`
const on = (sel, parts, anim) => `${parts.map((p) => `${sel} .lg-kaleido-${p}`).join(', ')} { animation: ${anim} }`
const PARTS_CSS = `
@keyframes lgrKaleidoRayHead { 0% { transform: none } 7% { transform: translateY(-8%) rotate(-5deg) scale(.94) } 10% { transform: translateY(6%) rotate(3deg) scale(1.18) } 14% { transform: translateY(5%) rotate(2deg) scale(1.15) } 40% { transform: translateY(4%) scale(1.12) } 60% { transform: translateY(-1%) } 100% { transform: none } }
@keyframes lgrKaleidoRayHunchL { 0% { transform: none } 7% { transform: translateY(-12%) rotate(-10deg) } 10% { transform: translateY(4%) rotate(8deg) scale(1.1) } 40% { transform: translateY(3%) rotate(6deg) } 70% { transform: none } 100% { transform: none } }
@keyframes lgrKaleidoRayHunchR { 0% { transform: none } 7% { transform: translateY(-12%) rotate(10deg) } 10% { transform: translateY(4%) rotate(-8deg) scale(1.1) } 40% { transform: translateY(3%) rotate(-6deg) } 70% { transform: none } 100% { transform: none } }
@keyframes lgrKaleidoRayFocusL { 0% { transform: none } 7% { transform: translateX(12%) rotate(8deg) } 11% { transform: translateX(16%) rotate(10deg) scale(1.1) } 40% { transform: translateX(13%) rotate(8deg) scale(1.08) } 70% { transform: translateX(2%) } 100% { transform: none } }
@keyframes lgrKaleidoRayFocusR { 0% { transform: none } 7% { transform: translateX(-12%) rotate(-8deg) } 11% { transform: translateX(-16%) rotate(-10deg) scale(1.1) } 40% { transform: translateX(-13%) rotate(-8deg) scale(1.08) } 70% { transform: translateX(-2%) } 100% { transform: none } }
@keyframes lgrKaleidoRayCut { 0% { transform: none } 7% { transform: rotate(-28deg) } 10% { transform: rotate(38deg) } 14% { transform: rotate(44deg) } 40% { transform: rotate(36deg) } 65% { transform: rotate(-3deg) } 100% { transform: none } }
@keyframes lgrKaleidoRayPunch { 0% { transform: none } 7% { transform: translate(6%, -6%) scale(.9) } 10% { transform: translate(-4%, 6%) scale(1.3) } 40% { transform: translate(-3%, 5%) scale(1.25) } 65% { transform: none } 100% { transform: none } }
${on(A, ['head'], 'lgrKaleidoRayHead 1300ms cubic-bezier(.3,.7,.4,1) both')}
${on(A, ['pauldl'], 'lgrKaleidoRayHunchL 1300ms ease-out both')}
${on(A, ['pauldr'], 'lgrKaleidoRayHunchR 1300ms ease-out both')}
${on(A, ['refl'], 'lgrKaleidoRayFocusL 1300ms ease-out both')}
${on(A, ['refr'], 'lgrKaleidoRayFocusR 1300ms ease-out both')}
${on(A, ['sword'], 'lgrKaleidoRayCut 1300ms cubic-bezier(.3,.7,.4,1) both')}
${on(A, ['gauntlet'], 'lgrKaleidoRayPunch 1300ms cubic-bezier(.3,.7,.4,1) both')}
@keyframes lgrKaleidoRay2Head { 0% { transform: translateY(-8%) rotate(-5deg) scale(.94) } 3% { transform: translateY(7%) rotate(3deg) scale(1.22) } 24% { transform: translateY(5%) scale(1.15) } 28% { transform: translateY(-5%) rotate(-3deg) scale(1) } 36% { transform: translateY(8%) rotate(4deg) scale(1.26) } 56% { transform: translateY(4%) scale(1.12) } 80% { transform: none } 100% { transform: none } }
@keyframes lgrKaleidoRay2Cut { 0% { transform: rotate(-28deg) } 3% { transform: rotate(42deg) } 24% { transform: rotate(34deg) } 29% { transform: rotate(-24deg) } 36% { transform: rotate(48deg) } 56% { transform: rotate(36deg) } 80% { transform: none } 100% { transform: none } }
${on(H, ['head'], 'lgrKaleidoRay2Head 1300ms cubic-bezier(.3,.7,.4,1) both')}
${on(H, ['sword'], 'lgrKaleidoRay2Cut 1300ms cubic-bezier(.3,.7,.4,1) both')}

@keyframes lgrKaleidoShardHead { 0%, 100% { transform: none } 40% { transform: rotate(-9deg) translate(4%, -4%) } }
@keyframes lgrKaleidoShardChest { 0%, 100% { transform: none } 45% { transform: scale(1.1) } }
${on('.lgr-kaleido-shard', ['head'], 'lgrKaleidoShardHead 330ms ease-out both')}
${on('.lgr-kaleido-shard', ['chest'], 'lgrKaleidoShardChest 330ms ease-out both')}
@keyframes lgrKaleidoOverFlare { 0%, 100% { transform: none } 35% { transform: scale(1.12) } }
@keyframes lgrKaleidoOverHunchL { 0%, 100% { transform: none } 35% { transform: translateY(-12%) rotate(-8deg) } }
@keyframes lgrKaleidoOverHunchR { 0%, 100% { transform: none } 35% { transform: translateY(-12%) rotate(8deg) } }
${on('.lgr-kaleido-overcharge', ['refl', 'refr'], 'lgrKaleidoOverFlare 330ms ease-out both')}
${on('.lgr-kaleido-overcharge', ['pauldl', 'gauntlet'], 'lgrKaleidoOverHunchL 330ms ease-out both')}
${on('.lgr-kaleido-overcharge', ['pauldr', 'sword'], 'lgrKaleidoOverHunchR 330ms ease-out both')}
@keyframes lgrKaleidoPrismChest { 0% { transform: none } 25% { transform: scale(.88) } 40% { transform: scale(1.16) } 55% { transform: scale(1.08) } 100% { transform: none } }
@keyframes lgrKaleidoPrismHead { 0% { transform: none } 40% { transform: translateY(-14%) rotate(-10deg) scale(1.06) } 70% { transform: translateY(-8%) rotate(-6deg) } 100% { transform: none } }
@keyframes lgrKaleidoPrismFlingL { 0% { transform: none } 40% { transform: rotate(-26deg) translateY(-10%) } 70% { transform: rotate(-14deg) } 100% { transform: none } }
@keyframes lgrKaleidoPrismFlingR { 0% { transform: none } 40% { transform: rotate(26deg) translateY(-10%) } 70% { transform: rotate(14deg) } 100% { transform: none } }
@keyframes lgrKaleidoPrismReflL { 0% { transform: none } 25% { transform: translateX(16%) scale(.92) } 40% { transform: translateX(-16%) scale(1.12) rotate(-8deg) } 70% { transform: translateX(-6%) } 100% { transform: none } }
@keyframes lgrKaleidoPrismReflR { 0% { transform: none } 25% { transform: translateX(-16%) scale(.92) } 40% { transform: translateX(16%) scale(1.12) rotate(8deg) } 70% { transform: translateX(6%) } 100% { transform: none } }
${on('.lgr-kaleido-prism', ['chest'], 'lgrKaleidoPrismChest 1100ms ease-out both')}
${on('.lgr-kaleido-prism', ['head'], 'lgrKaleidoPrismHead 1100ms ease-out both')}
${on('.lgr-kaleido-prism', ['pauldl', 'gauntlet'], 'lgrKaleidoPrismFlingL 1100ms ease-out both')}
${on('.lgr-kaleido-prism', ['pauldr', 'sword'], 'lgrKaleidoPrismFlingR 1100ms ease-out both')}
${on('.lgr-kaleido-prism', ['refl'], 'lgrKaleidoPrismReflL 1100ms ease-out both')}
${on('.lgr-kaleido-prism', ['refr'], 'lgrKaleidoPrismReflR 1100ms ease-out both')}

${Object.entries(FALLEN).map(([p, t]) => `${P}:not(.lg-fx-off):has([data-ko-tag]):not([data-moment]) .lg-kaleido-${p} { transform: ${t} }`).join('\n')}
`

const RGB = ['#ff3b5c', '#3dff8a', '#3aa8ff']

// A beam from a corner converging on the boss's heart (rotation r, delay d): it shoots in, then narrows to nothing.
const beam = (color, r, d) => (
  <div key={r} className="lgx" style={{ left: '50%', top: '50%', width: '95%', height: 9, marginTop: -4.5, transformOrigin: '0 50%', '--r': `${r}deg`, borderRadius: 9,
    background: `linear-gradient(90deg, #ffffff, ${color} 35%, ${color})`, boxShadow: `0 0 12px ${color}`, animation: anim('lgrKaleidoBeam', 700, d) }} />
)

export default {
  effects: {
    // Shard (tick): a glass shard flies from the color chip (up right) into its slot in the boss.
    // (a big faceted shard spins in from the chip, a light streak behind it, and clicks into the boss with a sparkle)
    shard: () => <>
      <div className="lgx" style={{ left: '50%', top: '45%', width: 120, height: 5, marginTop: -2.5, transformOrigin: '0 50%', transform: 'rotate(-39deg)', background: 'linear-gradient(90deg, #ffffff, rgba(58,168,255,0))', borderRadius: 3, animation: anim('lgrKaleidoTrail', 330) }} />
      <svg className="lgx" viewBox="0 0 20 30" style={{ left: '50%', top: '45%', width: 26, height: 38, margin: '-19px 0 0 -13px', overflow: 'visible', filter: 'drop-shadow(0 0 6px #ffffff)', '--x0': '110px', '--y0': '-90px', animation: anim('lgxFly', 300) }} aria-hidden="true">
        <path d="M10 1 19 18 10 29 1 18Z" fill="#3aa8ff" stroke="#15111c" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M10 1 19 18H1Z" fill="#ff3b5c" /><path d="M10 1 14 18H6Z" fill="#3dff8a" /><path d="M10 3 12 12 10 16Z" fill="#ffffff" />
      </svg>
      <div className="lgx" style={{ left: '50%', top: '45%', width: 36, height: 36, margin: '-18px 0 0 -18px', background: '#ffffff', clipPath: 'polygon(50% 0, 58% 42%, 100% 50%, 58% 58%, 50% 100%, 42% 58%, 0 50%, 42% 42%)', animation: anim('lgrKaleidoFlare', 200, 260) }} />
    </>,
    // Overcharge (tick): a color it already held flares hot.
    // (the held color flares white-hot: a spinning hexagon of light and six sparks)
    overcharge: () => <>
      <div className="lgx" style={{ left: '50%', top: '45%', width: 56, height: 56, marginLeft: -28, marginTop: -28, borderRadius: '50%', background: 'radial-gradient(circle, #fff 0 25%, rgba(255,214,90,.9) 45%, transparent 70%)', animation: anim('lgrKaleidoFlare', 340) }} />
      <div className="lgx" style={{ left: '50%', top: '45%', width: 64, height: 64, marginLeft: -32, marginTop: -32, clipPath: 'polygon(25% 3%, 75% 3%, 100% 50%, 75% 97%, 25% 97%, 0 50%)', background: 'conic-gradient(#ff3b5c, #ffd65a, #3dff8a, #3aa8ff, #c58bff, #ff3b5c)', opacity: 0.85, animation: anim('lgrKaleidoHexSpin', 330) }}><div style={{ position: 'absolute', inset: 6, clipPath: 'inherit', background: 'radial-gradient(circle, #ffffff 0 30%, rgba(255,255,255,.2) 70%)' }} /></div>
      {around(6, (i, a) => <div key={i} className="lgx" style={{ left: '50%', top: '45%', width: 4, height: 12, marginLeft: -2, borderRadius: 2, background: '#ffffff', boxShadow: '0 0 6px #ffd65a', '--a': `${a}deg`, '--d': '-46px', '--spin': '0deg', animation: anim('lgxShard', 320, 60) }} />)}
    </>,
    // Prism (big): red, green and blue beams converge from three corners, fuse white, then fan into a rainbow spray.
    prism: () => <>
      {beam(RGB[0], 215, 0)}{beam(RGB[1], 325, 60)}{beam(RGB[2], 90, 120)}
      <div className="lgx" style={{ left: '50%', top: '50%', width: 70, height: 70, marginLeft: -35, marginTop: -35, borderRadius: '50%', background: 'radial-gradient(circle, #fff 0 35%, rgba(255,255,255,.6) 50%, transparent 72%)', animation: anim('lgrKaleidoFuse', 900, 300) }} />
      {around(18, (i, a) => <div key={i} className="lgx" style={{ left: '50%', top: '50%', width: 10, height: 16, background: `hsl(${i * 20}, 100%, 62%)`, clipPath: 'polygon(50% 0, 100% 100%, 0 100%)', '--a': `${a}deg`, '--d': `${-90 - (i % 3) * 16}px`, '--spin': `${(i % 2 ? 1 : -1) * 240}deg`, animation: anim('lgxShard', 800, 420 + (i % 3) * 40) }} />)}
      {ring('#ffffff', 380, 2.1, 4, 700)}
    </>,
  },
  floaters: { shard: 'lg_fx_prismShard', overcharge: 'lg_fx_prismOver', prism: 'lg_fx_prismBurst' },
  floaterTone: { shard: 'info', overcharge: 'warning', prism: 'purple' },
  juice: {
    shard: { size: 'tick', sfx: 'kaleido.shard' },
    overcharge: { size: 'tick', sfx: 'kaleido.overcharge' },
    prism: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'kaleido.prism' },
  },
  demo: { shard: { damage: 2 }, overcharge: { damage: 3, fxVars: { n: 1 } }, prism: { damage: 4, fxVars: { n: 2 } } },
  // Reactions (body only; face layers come with the art pass): prism = the art splits into red/green/blue copies 6 px
  // apart and snaps back; shard = a 1 deg turn with a glint; overcharge = a hue flinch.
  css: `
@keyframes lgrKaleidoBeam { 0% { transform: rotate(var(--r)) translateX(100%) scaleX(.3); opacity: 0 } 15% { opacity: 1 } 45% { transform: rotate(var(--r)) translateX(0) scaleX(1); opacity: 1 } 70% { transform: rotate(var(--r)) translateX(0) scaleX(.15); opacity: .9 } 100% { transform: rotate(var(--r)) translateX(0) scaleX(0); opacity: 0 } }
@keyframes lgrKaleidoFuse { 0% { transform: scale(.1); opacity: 0 } 25% { transform: scale(1.4); opacity: 1 } 100% { transform: scale(2.2); opacity: 0 } }
@keyframes lgrKaleidoTrail { 0% { transform: rotate(-39deg) scaleX(0); opacity: 0 } 30% { opacity: 1 } 70% { transform: rotate(-39deg) scaleX(1); opacity: .8 } 100% { transform: rotate(-39deg) scaleX(1); opacity: 0 } }
@keyframes lgrKaleidoHexSpin { 0% { transform: rotate(-90deg) scale(.2); opacity: 0 } 45% { transform: rotate(20deg) scale(1.15); opacity: .9 } 100% { transform: rotate(60deg) scale(1.3); opacity: 0 } }
@keyframes lgrKaleidoFlare { 0% { transform: scale(.3); opacity: 0 } 35% { transform: scale(1.3); opacity: 1 } 100% { transform: scale(1.6); opacity: 0 } }
@keyframes lgrKaleidoSplit { 0% { filter: none; transform: none } 15% { filter: drop-shadow(-6px 0 0 rgba(255,59,92,.85)) drop-shadow(6px 0 0 rgba(58,168,255,.85)) drop-shadow(0 -6px 0 rgba(61,255,138,.75)); transform: scale(1.1) } 55% { filter: drop-shadow(-6px 0 0 rgba(255,59,92,.7)) drop-shadow(6px 0 0 rgba(58,168,255,.7)) drop-shadow(0 -6px 0 rgba(61,255,138,.6)); transform: scale(1.06) } 70% { filter: none; transform: scale(.95) } 100% { filter: none; transform: none } }
@keyframes lgrKaleidoGlint { 0%, 100% { transform: none; filter: none } 40% { transform: rotate(5deg) scale(1.04); filter: brightness(1.3) } 75% { transform: rotate(-2deg); filter: brightness(1.1) } }
@keyframes lgrKaleidoFlinch { 0%, 100% { transform: none; filter: none } 35% { transform: scale(1.02); filter: hue-rotate(40deg) brightness(1.2) } }
.lgr-kaleido-prism { animation: lgrKaleidoSplit 800ms cubic-bezier(.22,1,.36,1) both }
.lgr-kaleido-shard { animation: lgrKaleidoGlint 320ms ease-out both }
.lgr-kaleido-overcharge { animation: lgrKaleidoFlinch 300ms ease-out both }
/* fx-layer motion: in phase 2 the slit eyes dart left, right, centre at the burning reflections (jumps, not slides);
   in phase 3 the fanged maw drops from its top edge with a bounce. Both keep the part's own transform. */
@keyframes lgrKaleidoEyeDart { 0%, 26% { transform: translate(-2.4px, .5px) } 27%, 54% { transform: translate(2.4px, .5px) } 55%, 100% { transform: translate(0, .5px) } }
@keyframes lgrKaleidoMawDrop { 0% { transform: translate(0, 1.6px) translate(0, 8px) scale(1.06, .95) translate(0, -8px) } 35% { transform: translate(0, 1.6px) translate(0, 8px) scale(1.06, 1.52) translate(0, -8px) } 55% { transform: translate(0, 1.6px) translate(0, 8px) scale(1.06, 1.3) translate(0, -8px) } 75%, 100% { transform: translate(0, 1.6px) translate(0, 8px) scale(1.06, 1.38) translate(0, -8px) } }
.lg-boss[data-fx="prism"] .lgfa-kaleido-eye { animation: lgrKaleidoEyeDart 900ms linear both }
.lg-boss[data-fx="prism"] .lgfa-kaleido-maw { transform-box: view-box; transform-origin: 0 0; animation: lgrKaleidoMawDrop 700ms cubic-bezier(.3,.8,.4,1) both }
/* THE REAL PARTS: the state layer this ability draws on the boss (its lg-ab-* group in raids/kaleido.svg) moves with
   the moment, not only the whole figure. Played only while data-fx is set (never in focus mode, with Still bosses or
   under reduced motion). */
@keyframes lgrKaleidoPrismGlint { 0%, 100% { transform: none; filter: none } 40% { transform: scale(1.18); filter: brightness(1.7) saturate(1.3) } }
.lg-boss[data-fx="shard"] [class*="lg-ab-prism-"], .lg-boss[data-fx="overcharge"] [class*="lg-ab-prism-"] { transform-box: fill-box; transform-origin: center; animation: lgrKaleidoPrismGlint 320ms cubic-bezier(.22,1,.36,1) both }
` + pivots + PARTS_CSS,
}
