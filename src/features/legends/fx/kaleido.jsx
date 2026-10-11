// What the Kaleido's Prism (prism) LOOKS like. The fx contract is in fx/index.js, the juice format in fx/_juice.js.
// Fixed bright colors; BossArena skips all of it in focus mode, with Still bosses and under reduced motion. The floater
// already starts with the answer's damage, so the texts never repeat the number.
import { anim, around, ring } from './_kit'
import { pivots, FALLEN } from '../impact/bosses/kaleido.parts'

// THE KNIGHT'S OWN PARTS (raids/kaleido.svg hook classes; pivots in impact/bosses/kaleido.parts.jsx) for what is not a
// plain strike moment: his prism ray at the player (data-assault-on, from the moment it fires: he hunches and draws
// back, his mirror-blade fans (-refl / -refr) lean in to focus the light; then he THRUSTS: the helm drives forward, his upper arms (-arml / -armr)
// swing at the shoulder, the fans flash forward with him; a heavy blow thrusts twice), his ability
// reactions (.lgr-kaleido-<fx>) and his fallen pose after the knockout. Off with every effect (lg-fx-off).
const P = '.lg-boss[data-motif="kaleido"]'
const A = `${P}[data-assault-on]`
const H = `${P}[data-assault-on][data-moment="hurtBig"]`
const on = (sel, parts, anim) => `${parts.map((p) => `${sel} .lg-kaleido-${p}`).join(', ')} { animation: ${anim} }`
const PARTS_CSS = `
@keyframes lgrKaleidoRayHead { 0% { transform: none} 7% { transform: rotate(-5deg) scale(.94)} 10% { transform: rotate(3deg) scale(1.18)} 14% { transform: rotate(2deg) scale(1.15)} 40% { transform: scale(1.12)} 60% { transform: none} 100% { transform: none} }
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
${on(A, ['arml'], 'lgrKaleidoRayCut 1300ms cubic-bezier(.3,.7,.4,1) both')}
${on(A, ['armr'], 'lgrKaleidoRayPunch 1300ms cubic-bezier(.3,.7,.4,1) both')}
@keyframes lgrKaleidoRay2Head { 0% { transform: rotate(-5deg) scale(.94)} 3% { transform: rotate(3deg) scale(1.22)} 24% { transform: scale(1.15)} 28% { transform: rotate(-3deg) scale(1)} 36% { transform: rotate(4deg) scale(1.26)} 56% { transform: scale(1.12)} 80% { transform: none} 100% { transform: none} }
@keyframes lgrKaleidoRay2Cut { 0% { transform: rotate(-28deg) } 3% { transform: rotate(42deg) } 24% { transform: rotate(34deg) } 29% { transform: rotate(-24deg) } 36% { transform: rotate(48deg) } 56% { transform: rotate(36deg) } 80% { transform: none } 100% { transform: none } }
${on(H, ['head'], 'lgrKaleidoRay2Head 1300ms cubic-bezier(.3,.7,.4,1) both')}
${on(H, ['arml'], 'lgrKaleidoRay2Cut 1300ms cubic-bezier(.3,.7,.4,1) both')}

@keyframes lgrKaleidoShardHead { 0%, 100% { transform: none} 40% { transform: rotate(-9deg)} }
@keyframes lgrKaleidoShardChest { 0%, 100% { transform: none } 45% { transform: scale(1.1) } }
${on('.lgr-kaleido-shard', ['head'], 'lgrKaleidoShardHead 330ms ease-out both')}
${on('.lgr-kaleido-shard', ['chest'], 'lgrKaleidoShardChest 330ms ease-out both')}
@keyframes lgrKaleidoShardPassL { 0%, 100% { transform: none } 45% { transform: translateX(12%) rotate(6deg) scale(1.06) } }
@keyframes lgrKaleidoShardPassR { 0%, 100% { transform: none } 45% { transform: translateX(-12%) rotate(-6deg) scale(1.06) } }
${on('.lgr-kaleido-shard', ['refl'], 'lgrKaleidoShardPassL 340ms ease-out both')}
${on('.lgr-kaleido-shard', ['refr'], 'lgrKaleidoShardPassR 340ms ease-out both')}
@keyframes lgrKaleidoOverHeave { 0%, 100% { transform: none } 30% { transform: scale(1.12, 1.08) } 60% { transform: scale(.97) } }
@keyframes lgrKaleidoOverWince { 0%, 100% { transform: none} 30% { transform: rotate(5deg)} }
${on('.lgr-kaleido-overcharge', ['chest'], 'lgrKaleidoOverHeave 340ms ease-out both')}
${on('.lgr-kaleido-overcharge', ['head'], 'lgrKaleidoOverWince 340ms ease-out both')}
@keyframes lgrKaleidoOverFlare { 0%, 100% { transform: none } 35% { transform: scale(1.12) } }
@keyframes lgrKaleidoOverHunchL { 0%, 100% { transform: none } 35% { transform: translateY(-12%) rotate(-8deg) } }
@keyframes lgrKaleidoOverHunchR { 0%, 100% { transform: none } 35% { transform: translateY(-12%) rotate(8deg) } }
${on('.lgr-kaleido-overcharge', ['refl', 'refr'], 'lgrKaleidoOverFlare 330ms ease-out both')}
${on('.lgr-kaleido-overcharge', ['pauldl', 'armr'], 'lgrKaleidoOverHunchL 330ms ease-out both')}
${on('.lgr-kaleido-overcharge', ['pauldr', 'arml'], 'lgrKaleidoOverHunchR 330ms ease-out both')}
@keyframes lgrKaleidoPrismChest { 0% { transform: none } 25% { transform: scale(.88) } 40% { transform: scale(1.16) } 55% { transform: scale(1.08) } 100% { transform: none } }
@keyframes lgrKaleidoPrismHead { 0% { transform: none} 40% { transform: rotate(-10deg) scale(1.06)} 70% { transform: rotate(-6deg)} 100% { transform: none} }
@keyframes lgrKaleidoPrismFlingL { 0% { transform: none } 40% { transform: rotate(-26deg) translateY(-10%) } 70% { transform: rotate(-14deg) } 100% { transform: none } }
@keyframes lgrKaleidoPrismFlingR { 0% { transform: none } 40% { transform: rotate(26deg) translateY(-10%) } 70% { transform: rotate(14deg) } 100% { transform: none } }
@keyframes lgrKaleidoPrismReflL { 0% { transform: none } 25% { transform: translateX(16%) scale(.92) } 40% { transform: translateX(-16%) scale(1.12) rotate(-8deg) } 70% { transform: translateX(-6%) } 100% { transform: none } }
@keyframes lgrKaleidoPrismReflR { 0% { transform: none } 25% { transform: translateX(-16%) scale(.92) } 40% { transform: translateX(16%) scale(1.12) rotate(8deg) } 70% { transform: translateX(6%) } 100% { transform: none } }
${on('.lgr-kaleido-prism', ['chest'], 'lgrKaleidoPrismChest 1100ms ease-out both')}
${on('.lgr-kaleido-prism', ['head'], 'lgrKaleidoPrismHead 1100ms ease-out both')}
${on('.lgr-kaleido-prism', ['pauldl', 'armr'], 'lgrKaleidoPrismFlingL 1100ms ease-out both')}
${on('.lgr-kaleido-prism', ['pauldr', 'arml'], 'lgrKaleidoPrismFlingR 1100ms ease-out both')}
${on('.lgr-kaleido-prism', ['refl'], 'lgrKaleidoPrismReflL 1100ms ease-out both')}
${on('.lgr-kaleido-prism', ['refr'], 'lgrKaleidoPrismReflR 1100ms ease-out both')}

${Object.entries(FALLEN).map(([p, t]) => `${P}:not(.lg-fx-off):has([data-ko-tag]):not([data-moment]) .lg-kaleido-${p} { transform: ${t} }`).join('\n')}
`

const RGB = ['#ff3b5c', '#3dff8a', '#3aa8ff']
// Every effect lands on the PRISM in his chest (about 80% down the boss box), never over his face.
const GEM = { left: '50%', top: '80%' }

// A beam from far out (rotation r) into the chest prism: it shoots in, holds, then narrows to nothing.
const beam = (color, r, d) => (
  <div key={r} className="lgx" style={{ ...GEM, width: '60%', height: 8, marginTop: -4, transformOrigin: '0 50%', '--r': `${r}deg`, borderRadius: 8,
    background: `linear-gradient(90deg, #ffffff, ${color} 30%, ${color})`, boxShadow: `0 0 10px ${color}`, animation: anim('lgrKaleidoBeam', 720, d) }} />
)
// One band of the rainbow fan the prism throws at the player (down and out).
const band = (i, n) => {
  const a = 40 + (i / (n - 1)) * 100 // 40..140 degrees: fanned toward the bottom
  return <div key={i} className="lgx" style={{ ...GEM, width: '62%', height: 7, marginTop: -3.5, transformOrigin: '0 50%', '--r': `${a}deg`, borderRadius: '0 7px 7px 0',
    background: `linear-gradient(90deg, #ffffff, hsl(${i * (300 / (n - 1))}, 100%, 62%) 30%, hsla(${i * (300 / (n - 1))}, 100%, 62%, .2))`, animation: anim('lgrKaleidoFanOut', 760, 360 + i * 22) }} />
}

export default {
  effects: {
    // Shard (tick): a three-coloured glass shard spins in from the colour chip (up right) along a light streak and clicks
    // into the prism in his chest with a four-point glint.
    shard: () => <>
      <div className="lgx" style={{ ...GEM, width: 150, height: 4, marginTop: -2, transformOrigin: '0 50%', transform: 'rotate(-58deg)', background: 'linear-gradient(90deg, #ffffff, rgba(58,168,255,0))', borderRadius: 3, animation: anim('lgrKaleidoTrail', 330) }} />
      <svg className="lgx" viewBox="0 0 20 30" style={{ ...GEM, width: 24, height: 36, margin: '-18px 0 0 -12px', overflow: 'visible', filter: 'drop-shadow(0 0 5px #ffffff)', '--x0': '80px', '--y0': '-128px', animation: anim('lgxFly', 300) }} aria-hidden="true">
        <path d="M10 1 19 18 10 29 1 18Z" fill="#3aa8ff" stroke="#15111c" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M10 1 19 18H1Z" fill="#ff3b5c" /><path d="M10 1 14 18H6Z" fill="#3dff8a" /><path d="M10 3 12 12 10 16Z" fill="#ffffff" />
      </svg>
      <div className="lgx" style={{ ...GEM, width: 40, height: 40, margin: '-20px 0 0 -20px', background: '#ffffff', clipPath: 'polygon(50% 0, 57% 43%, 100% 50%, 57% 57%, 50% 100%, 43% 57%, 0 50%, 43% 43%)', animation: anim('lgrKaleidoFlare', 220, 250) }} />
    </>,
    // Overcharge (tick): the colour he already holds overheats in the prism: forge-hot hexagon rings ripple out from his
    // chest and sparks spit up from it like a struck anvil.
    overcharge: () => <>
      {[0, 70, 140].map((d) => <div key={d} className="lgx" style={{ ...GEM, width: 46, height: 46, margin: '-23px 0 0 -23px', clipPath: 'polygon(25% 3%, 75% 3%, 100% 50%, 75% 97%, 25% 97%, 0 50%)', background: 'radial-gradient(circle, transparent 52%, #ffb02a 58%, #ff3b1a 72%, transparent 76%)', animation: anim('lgrKaleidoHexOut', 340, d) }} />)}
      {around(7, (i, a) => <div key={i} className="lgx" style={{ ...GEM, width: 3, height: 10, marginLeft: -1.5, borderRadius: 2, background: '#fff2c0', boxShadow: '0 0 6px #ff7a1a', '--a': `${a * 0.5 - 75}deg`, '--d': '-58px', '--spin': '0deg', animation: anim('lgxShard', 320, 40) }} />)}
    </>,
    // Prism (big): red, green and blue beams strike his chest prism from three sides, it blazes, and a RAINBOW FAN sprays
    // out of it down at the player, with glass splinters flying.
    prism: () => <>
      {beam(RGB[0], 168, 0)}{beam(RGB[1], 90, 70)}{beam(RGB[2], 12, 140)}
      <div className="lgx" style={{ ...GEM, width: 26, height: 26, margin: '-13px 0 0 -13px', borderRadius: '50%', background: 'radial-gradient(circle, #fff 0 30%, rgba(255,255,255,.55) 50%, transparent 72%)', animation: anim('lgrKaleidoFuse', 700, 300) }} />
      {Array.from({ length: 9 }, (_, i) => band(i, 9))}
      {around(14, (i, a) => <div key={i} className="lgx" style={{ ...GEM, width: 8, height: 13, background: `hsl(${i * 26}, 100%, 66%)`, clipPath: 'polygon(50% 0, 100% 100%, 0 100%)', '--a': `${a}deg`, '--d': `${-70 - (i % 3) * 14}px`, '--spin': `${(i % 2 ? 1 : -1) * 240}deg`, animation: anim('lgxShard', 760, 420 + (i % 3) * 40) }} />)}
    </>,
  },
  floaters: { shard: 'lg_fx_prismShard', overcharge: 'lg_fx_prismOver', prism: 'lg_fx_prismBurst' },
  floaterTone: { shard: 'info', overcharge: 'warning', prism: 'purple' },
  juice: {
    shard: { size: 'tick', sfx: 'kaleido.shard' },
    overcharge: { size: 'tick', sfx: 'kaleido.overcharge' },
    prism: { size: 'big', shake: 2, flash: 1, hitstop: 1, sfx: 'kaleido.prism' },
  },
  demo: { shard: { damage: 2 }, overcharge: { damage: 3, fxVars: { n: 1 } }, prism: { damage: 4, fxVars: { n: 2 } } },
  // Reactions (body only; face layers come with the art pass): prism = the art splits into red/green/blue copies 6 px
  // apart and snaps back; shard = a 1 deg turn with a glint; overcharge = a hue flinch.
  css: `
@keyframes lgrKaleidoFanOut { 0% { transform: rotate(var(--r)) scaleX(0); opacity: 1 } 35% { transform: rotate(var(--r)) scaleX(1); opacity: 1 } 70% { transform: rotate(var(--r)) scaleX(1.05) scaleY(1.4); opacity: .8 } 100% { transform: rotate(var(--r)) scaleX(1.1) scaleY(.2); opacity: 0 } }
@keyframes lgrKaleidoHexOut { 0% { transform: scale(.3) rotate(0deg); opacity: 0 } 25% { opacity: 1 } 100% { transform: scale(1.5) rotate(30deg); opacity: 0 } }
@keyframes lgrKaleidoBeam { 0% { transform: rotate(var(--r)) translateX(100%) scaleX(.3); opacity: 0 } 15% { opacity: 1 } 45% { transform: rotate(var(--r)) translateX(0) scaleX(1); opacity: 1 } 70% { transform: rotate(var(--r)) translateX(0) scaleX(.15); opacity: .9 } 100% { transform: rotate(var(--r)) translateX(0) scaleX(0); opacity: 0 } }
@keyframes lgrKaleidoFuse { 0% { transform: scale(.1); opacity: 0 } 25% { transform: scale(1.15); opacity: 1 } 100% { transform: scale(1.35); opacity: 0 } }
@keyframes lgrKaleidoTrail { 0% { transform: rotate(-39deg) scaleX(0); opacity: 0 } 30% { opacity: 1 } 70% { transform: rotate(-39deg) scaleX(1); opacity: .8 } 100% { transform: rotate(-39deg) scaleX(1); opacity: 0 } }
@keyframes lgrKaleidoHexSpin { 0% { transform: rotate(-90deg) scale(.2); opacity: 0 } 45% { transform: rotate(20deg) scale(1.15); opacity: .9 } 100% { transform: rotate(60deg) scale(1.3); opacity: 0 } }
@keyframes lgrKaleidoFlare { 0% { transform: scale(.3); opacity: 0 } 35% { transform: scale(1.3); opacity: 1 } 100% { transform: scale(1.6); opacity: 0 } }
@keyframes lgrKaleidoSplit { 0% { filter: none; transform: none } 15% { filter: drop-shadow(-1.5px 0 0 rgba(255,59,92,.45)) drop-shadow(1.5px 0 0 rgba(58,168,255,.45)) drop-shadow(0 -1.5px 0 rgba(61,255,138,.5)); transform: scale(1.1) } 55% { filter: drop-shadow(-1.5px 0 0 rgba(255,59,92,.5)) drop-shadow(1.5px 0 0 rgba(58,168,255,.5)) drop-shadow(0 -1.5px 0 rgba(61,255,138,.45)); transform: scale(1.06) } 70% { filter: none; transform: scale(.95) } 100% { filter: none; transform: none } }
@keyframes lgrKaleidoGlint { 0%, 100% { transform: none; filter: none } 40% { transform: rotate(5deg) scale(1.04); filter: brightness(1.3) } 75% { transform: rotate(-2deg); filter: brightness(1.1) } }
@keyframes lgrKaleidoFlinch { 0%, 100% { transform: none; filter: none } 35% { transform: scale(1.02); filter: hue-rotate(40deg) brightness(1.2) } }
.lgr-kaleido-prism { animation: lgrKaleidoSplit 800ms cubic-bezier(.22,1,.36,1) both }
.lgr-kaleido-shard { animation: lgrKaleidoGlint 320ms ease-out both }
.lgr-kaleido-overcharge { animation: lgrKaleidoFlinch 300ms ease-out both }
/* fx-layer motion (the knight's own face and prism react): on a PRISM burst his eyes flash white and dart to the
   reflections on either side (jumps, not slides) while the chest prism blazes, swelling and throwing its colours; on
   a SHARD the four-point glint spins in over the prism; on an OVERCHARGE the red-hot prism shudders. */
@keyframes lgrKaleidoEyeDart { 0%, 26% { transform: translate(-2.4px, .5px) } 27%, 54% { transform: translate(2.4px, .5px) } 55%, 100% { transform: translate(0, .5px) } }
.lg-boss[data-fx="prism"] .lgfa-kaleido-eye { animation: lgrKaleidoEyeDart 900ms linear both }
@keyframes lgrKaleidoBlaze { 0% { transform: scale(.4) rotate(-20deg) } 30% { transform: scale(1.35) rotate(6deg) } 60% { transform: scale(1.12) rotate(-2deg) } 100% { transform: scale(1) } }
@keyframes lgrKaleidoGlintSpin { 0% { transform: scale(.1) rotate(-90deg) } 45% { transform: scale(1.3) rotate(20deg) } 100% { transform: scale(.9) rotate(45deg) } }
@keyframes lgrKaleidoShudder { 0%, 100% { transform: none } 15% { transform: translate(-1px, 0) scale(1.08) } 30% { transform: translate(1px, 0) scale(1.12) } 45% { transform: translate(-1px, 0) scale(1.06) } 60% { transform: translate(1px, 0) scale(1.1) } }
.lg-boss[data-fx="prism"] .lg-fx-prism { transform-box: fill-box; transform-origin: center; animation: lgrKaleidoBlaze 900ms cubic-bezier(.2,.9,.3,1) both }
.lg-boss[data-fx="shard"] .lg-fx-shard { transform-box: fill-box; transform-origin: center; animation: lgrKaleidoGlintSpin 380ms ease-out both }
.lg-boss[data-fx="overcharge"] .lg-fx-overcharge { transform-box: fill-box; transform-origin: center; animation: lgrKaleidoShudder 360ms linear both }
/* THE REAL PARTS: the state layer this ability draws on the boss (its lg-ab-* group in raids/kaleido.svg) moves with
   the moment, not only the whole figure. Played only while data-fx is set (never in focus mode, with Still bosses or
   under reduced motion). */
@keyframes lgrKaleidoPrismGlint { 0%, 100% { transform: none; filter: none } 40% { transform: scale(1.18); filter: brightness(1.7) saturate(1.3) } }
.lg-boss[data-fx="shard"] [class*="lg-ab-prism-"], .lg-boss[data-fx="overcharge"] [class*="lg-ab-prism-"] { transform-box: fill-box; transform-origin: center; animation: lgrKaleidoPrismGlint 320ms cubic-bezier(.22,1,.36,1) both }
` + pivots + PARTS_CSS,
}
