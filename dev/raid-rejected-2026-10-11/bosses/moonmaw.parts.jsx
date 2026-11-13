// MOONMAW's own impact parts: drawers merged into impact/parts.jsx PARTS. Name each `moonmaw<Name>` (never clashes).
// A drawer is (params, ctx) => node, like the shared ones (ctx: color, accent, glyph, scale, speed); CSS keyframes it
// needs go in `css` (prefix them lgmoonmaw). Deterministic, container units, transforms and opacity only.
//
// THE LUNAR STRIX ACTS OUT EVERY MOMENT with its own drawn parts (raids/moonmaw.svg hook classes in all three phases,
// kept live by the bake): lg-moonmaw-head (the moon face, pivot on the neck), -eyes, -brow, -beak (hinged at the top),
// -tuftl / -tuftr (the ear tufts), -wingl / -wingr (pivot at the shoulder), -talonl / -talonr. Keyed on the arena's
// data-moment (impact/bosses/README.md). Its attack on the player, its ability reactions and its fallen pose live in
// fx/moonmaw.jsx (always injected).

const B = '.lg-boss[data-motif="moonmaw"]'
const M = (m) => `${B}[data-moment="${m}"]`
const FB = 'transform-box: fill-box'
export const pivots = `
${B} .lg-moonmaw-head { ${FB}; transform-origin: 50% 90% }
${B} .lg-moonmaw-eyes, ${B} .lg-moonmaw-brow { ${FB}; transform-origin: 50% 55% }
${B} .lg-moonmaw-beak { ${FB}; transform-origin: 50% 8% }
${B} .lg-moonmaw-tuftl { ${FB}; transform-origin: 85% 100% }
${B} .lg-moonmaw-tuftr { ${FB}; transform-origin: 15% 100% }
${B} .lg-moonmaw-wingl { ${FB}; transform-origin: 88% 12% }
${B} .lg-moonmaw-wingr { ${FB}; transform-origin: 12% 12% }
${B} .lg-p2 .lg-moonmaw-wingl { transform-origin: 90% 42% }
${B} .lg-p2 .lg-moonmaw-wingr { transform-origin: 10% 42% }
${B} .lg-p3 .lg-moonmaw-wingl { transform-origin: 92% 22% }
${B} .lg-p3 .lg-moonmaw-wingr { transform-origin: 8% 22% }
${B} .lg-moonmaw-talonl, ${B} .lg-moonmaw-talonr { ${FB}; transform-origin: 50% 0% }
`
const rule = (m, parts, anim) => `${parts.map((p) => `${M(m)} .lg-moonmaw-${p}`).join(', ')} { animation: ${anim} }`
// The wings of phase 1 (folded like a cloak) and phase 2 (flung wide past the frame) already reach the frame edge, so
// their outward swings play a smaller version (named <anim>12): the same beat, aimed in, never sliced by the edge.
const tame = (m, parts, name) => `${parts.map((p) => `${M(m)} .lg-p1 .lg-moonmaw-${p}, ${M(m)} .lg-p2 .lg-moonmaw-${p}`).join(', ')} { animation-name: ${name} }`

// A HIT: the moon face is knocked round on its neck the way only an owl's turns, it blinks hard, the wings jolt.
const hit = `
@keyframes lgmoonmawHitHead { 0% { transform: rotate(-12deg) translate(-4%, 3%) } 35% { transform: rotate(-8deg) translate(-2%, 2%) } 70% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgmoonmawBlink { 0% { transform: scaleY(.1) } 30% { transform: scaleY(.1) } 45% { transform: none } 100% { transform: none } }
@keyframes lgmoonmawJoltL { 0% { transform: rotate(8deg) } 40% { transform: rotate(-3deg) } 100% { transform: none } }
@keyframes lgmoonmawJoltL12 { 0% { transform: rotate(2deg) } 40% { transform: rotate(-4deg) } 100% { transform: none } }
@keyframes lgmoonmawJoltR { 0% { transform: rotate(-8deg) } 40% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgmoonmawJoltR12 { 0% { transform: rotate(-2deg) } 40% { transform: rotate(4deg) } 100% { transform: none } }
${rule('hit', ['head'], 'lgmoonmawHitHead 480ms cubic-bezier(.2,.9,.3,1) both')}
${rule('hit', ['eyes'], 'lgmoonmawBlink 420ms linear both')}
${rule('hit', ['wingl'], 'lgmoonmawJoltL 460ms ease-out both')}
${rule('hit', ['wingr'], 'lgmoonmawJoltR 460ms ease-out both')}
${tame('hit', ['wingl'], 'lgmoonmawJoltL12')}
${tame('hit', ['wingr'], 'lgmoonmawJoltR12')}
`
// A CRITICAL: the blow SPINS the moon face half round on its neck and back, the eyes squeeze shut, the ear tufts are
// slapped flat, the beak hangs open.
const crit = `
@keyframes lgmoonmawCritHead { 0% { transform: rotate(40deg) scale(.93) } 25% { transform: rotate(46deg) scale(.93) } 55% { transform: rotate(-9deg) translateY(3%) } 78% { transform: rotate(4deg) } 100% { transform: none } }
@keyframes lgmoonmawSqueeze { 0% { transform: scale(1.1, .08) } 50% { transform: scale(1.05, .12) } 70% { transform: none } 100% { transform: none } }
@keyframes lgmoonmawFlatL { 0% { transform: rotate(-55deg) } 50% { transform: rotate(-40deg) } 100% { transform: none } }
@keyframes lgmoonmawFlatR { 0% { transform: rotate(-16deg) } 50% { transform: rotate(-3deg) } 100% { transform: none } }
@keyframes lgmoonmawGape { 0% { transform: scaleY(1.6) } 55% { transform: scaleY(1.4) } 100% { transform: none } }
${rule('crit', ['head'], 'lgmoonmawCritHead 740ms cubic-bezier(.15,.85,.3,1) both')}
${rule('crit', ['eyes'], 'lgmoonmawSqueeze 700ms ease-out both')}
${rule('crit', ['tuftl'], 'lgmoonmawFlatL 700ms ease-out both')}
${rule('crit', ['tuftr'], 'lgmoonmawFlatR 700ms ease-out both')}
${rule('crit', ['beak'], 'lgmoonmawGape 700ms ease-out both')}
`
// A SHARPENED strike: the honed edge shears feathers: the wings snap shut over the body and shiver, the ear tufts pin
// back, the eyes narrow to slits under a lowered brow.
const sharpen = `
@keyframes lgmoonmawShutL { 0% { transform: rotate(-17deg) } 20%, 50% { transform: rotate(-13deg) } 35%, 65% { transform: rotate(-18deg) } 100% { transform: none } }
@keyframes lgmoonmawShutR { 0% { transform: rotate(17deg) } 20%, 50% { transform: rotate(13deg) } 35%, 65% { transform: rotate(18deg) } 100% { transform: none } }
@keyframes lgmoonmawPinL { 0% { transform: rotate(-40deg) } 60% { transform: rotate(-30deg) } 100% { transform: none } }
@keyframes lgmoonmawPinR { 0% { transform: rotate(40deg) } 60% { transform: rotate(30deg) } 100% { transform: none } }
@keyframes lgmoonmawSlit { 0% { transform: scaleY(.35) } 60% { transform: scaleY(.45) } 100% { transform: none } }
@keyframes lgmoonmawLower { 0% { transform: translateY(14%) } 60% { transform: translateY(10%) } 100% { transform: none } }
${rule('sharpen', ['wingl'], 'lgmoonmawShutL 640ms linear both')}
${rule('sharpen', ['wingr'], 'lgmoonmawShutR 640ms linear both')}
${rule('sharpen', ['tuftl'], 'lgmoonmawPinL 600ms ease-out both')}
${rule('sharpen', ['tuftr'], 'lgmoonmawPinR 600ms ease-out both')}
${rule('sharpen', ['eyes'], 'lgmoonmawSlit 600ms ease-out both')}
${rule('sharpen', ['brow'], 'lgmoonmawLower 600ms ease-out both')}
`
// ITS STRIKE (a plain miss; its swoop on the player is fx/moonmaw.jsx's data-assault-on): the ear tufts bristle up,
// the brow drops into a glare and the beak screeches open as it comes.
const strike = `
@keyframes lgmoonmawBristleL { 0% { transform: none } 20% { transform: rotate(16deg) scale(1.03) } 60% { transform: rotate(12deg) scale(1.02) } 100% { transform: none } }
@keyframes lgmoonmawBristleR { 0% { transform: none } 20% { transform: rotate(-16deg) scale(1.03) } 60% { transform: rotate(-12deg) scale(1.02) } 100% { transform: none } }
@keyframes lgmoonmawGlare { 0% { transform: none } 20% { transform: translateY(16%) scaleX(1.08) } 60% { transform: translateY(12%) } 100% { transform: none } }
@keyframes lgmoonmawScreech { 0% { transform: none } 20% { transform: scaleY(1.7) } 30% { transform: scaleY(1.45) } 40% { transform: scaleY(1.7) } 65% { transform: scaleY(1.4) } 100% { transform: none } }
${rule('hurt', ['tuftl'], 'lgmoonmawBristleL 760ms ease-out both')}
${rule('hurt', ['tuftr'], 'lgmoonmawBristleR 760ms ease-out both')}
${rule('hurt', ['brow'], 'lgmoonmawGlare 760ms ease-out both')}
${rule('hurt', ['beak'], 'lgmoonmawScreech 760ms linear both')}
`
// ITS HEAVY BLOW (a missed attack): two huge wingbeats that fill the sky, the talons rake twice, the eyes flare wide.
const heavy = `
@keyframes lgmoonmawBeatL { 0% { transform: rotate(3deg) } 14% { transform: rotate(6deg) } 28% { transform: rotate(-18deg) } 44% { transform: rotate(5deg) } 58% { transform: rotate(-14deg) } 78% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgmoonmawBeatL12 { 0% { transform: rotate(1deg) scale(.92, 1) } 12% { transform: translateY(-1%) rotate(2deg) scale(.84, 1) } 28% { transform: translateY(6%) rotate(-20deg) scale(.92, .9) } 42% { transform: translateY(-1%) rotate(1deg) scale(.85, 1) } 58% { transform: translateY(5%) rotate(-17deg) scale(.93, .91) } 78% { transform: translateY(1%) rotate(-3deg) } 100% { transform: none } }
@keyframes lgmoonmawBeatR { 0% { transform: rotate(-3deg) } 14% { transform: rotate(-6deg) } 28% { transform: rotate(18deg) } 44% { transform: rotate(-5deg) } 58% { transform: rotate(14deg) } 78% { transform: rotate(-3deg) } 100% { transform: none } }
@keyframes lgmoonmawBeatR12 { 0% { transform: rotate(-1deg) scale(.92, 1) } 12% { transform: translateY(-1%) rotate(-2deg) scale(.84, 1) } 28% { transform: translateY(6%) rotate(20deg) scale(.92, .9) } 42% { transform: translateY(-1%) rotate(-1deg) scale(.85, 1) } 58% { transform: translateY(5%) rotate(17deg) scale(.93, .91) } 78% { transform: translateY(1%) rotate(3deg) } 100% { transform: none } }
@keyframes lgmoonmawRakeL { 0% { transform: none } 12% { transform: translateY(-16%) rotate(-14deg) } 26% { transform: translateY(1%) rotate(16deg) scale(1.08) } 40% { transform: translateY(-12%) rotate(-12deg) } 54% { transform: translateY(1%) rotate(14deg) scale(1.06) } 80% { transform: none } }
@keyframes lgmoonmawRakeR { 0% { transform: none } 12% { transform: translateY(-16%) rotate(14deg) } 26% { transform: translateY(1%) rotate(-16deg) scale(1.08) } 40% { transform: translateY(-12%) rotate(12deg) } 54% { transform: translateY(1%) rotate(-14deg) scale(1.06) } 80% { transform: none } }
@keyframes lgmoonmawFlareEyes { 0% { transform: scaleY(.6) } 12% { transform: scaleY(.5) } 28% { transform: scale(1.38) } 42% { transform: scale(1.15) } 58% { transform: scale(1.36) } 74% { transform: scale(1.1) } 100% { transform: none } }
@keyframes lgmoonmawSnap { 0% { transform: none } 12% { transform: scaleY(.6) } 28% { transform: scaleY(1.85) } 38% { transform: scaleY(.55) } 58% { transform: scaleY(1.8) } 68% { transform: scaleY(.6) } 82% { transform: scaleY(1.1) } 100% { transform: none } }
${rule('hurtBig', ['wingl'], 'lgmoonmawBeatL 1000ms ease-in-out both')}
${rule('hurtBig', ['wingr'], 'lgmoonmawBeatR 1000ms ease-in-out both')}
${tame('hurtBig', ['wingl'], 'lgmoonmawBeatL12')}
${tame('hurtBig', ['wingr'], 'lgmoonmawBeatR12')}
${rule('hurtBig', ['talonl'], 'lgmoonmawRakeL 1000ms ease-out both')}
${rule('hurtBig', ['talonr'], 'lgmoonmawRakeR 1000ms ease-out both')}
${rule('hurtBig', ['eyes'], 'lgmoonmawFlareEyes 1000ms ease-out both')}
${rule('hurtBig', ['beak'], 'lgmoonmawSnap 1000ms linear both')}
`
// A BLOCK (its swoop was parried): the head is knocked back, the beak clacks shut twice, the talons jerk up empty and
// the wings back-flap to catch it.
const block = `
@keyframes lgmoonmawBlockHead { 0% { transform: translateY(-8%) rotate(6deg) scale(.9) } 45% { transform: translateY(-5%) rotate(3deg) scale(.94) } 100% { transform: none } }
@keyframes lgmoonmawClack { 0% { transform: scaleY(.6) } 20% { transform: scaleY(1.3) } 35% { transform: scaleY(.6) } 50% { transform: scaleY(1.2) } 65% { transform: scaleY(.7) } 100% { transform: none } }
@keyframes lgmoonmawEmpty { 0% { transform: translateY(-16%) scale(.9) } 50% { transform: translateY(-10%) scale(.94) } 100% { transform: none } }
@keyframes lgmoonmawBackL { 0% { transform: rotate(10deg) } 30% { transform: rotate(-6deg) } 60% { transform: rotate(5deg) } 100% { transform: none } }
@keyframes lgmoonmawBackL12 { 0% { transform: rotate(2deg) } 30% { transform: rotate(-8deg) } 60% { transform: rotate(1deg) } 100% { transform: none } }
@keyframes lgmoonmawBackR { 0% { transform: rotate(-10deg) } 30% { transform: rotate(6deg) } 60% { transform: rotate(-5deg) } 100% { transform: none } }
@keyframes lgmoonmawBackR12 { 0% { transform: rotate(-2deg) } 30% { transform: rotate(8deg) } 60% { transform: rotate(-1deg) } 100% { transform: none } }
${rule('block', ['head'], 'lgmoonmawBlockHead 620ms ease-out both')}
${rule('block', ['beak'], 'lgmoonmawClack 620ms linear both')}
${rule('block', ['talonl', 'talonr'], 'lgmoonmawEmpty 600ms ease-out both')}
${rule('block', ['wingl'], 'lgmoonmawBackL 660ms ease-out both')}
${rule('block', ['wingr'], 'lgmoonmawBackR 660ms ease-out both')}
${tame('block', ['wingl'], 'lgmoonmawBackL12')}
${tame('block', ['wingr'], 'lgmoonmawBackR12')}
`
// A SHIELD SAVE: its talons skate off the dome: one leg skids wide, the head cocks the slow puzzled owl tilt, one
// wing flares for balance.
const shield = `
@keyframes lgmoonmawSkid { 0% { transform: none } 18% { transform: translate(-10%, -8%) rotate(-24deg) } 50% { transform: translate(-14%, -4%) rotate(-30deg) } 100% { transform: none } }
@keyframes lgmoonmawTilt { 0% { transform: none } 30% { transform: rotate(15deg) translateY(3%) } 70% { transform: rotate(13deg) translateY(3%) } 100% { transform: none } }
@keyframes lgmoonmawBalance { 0% { transform: none } 25% { transform: rotate(-9deg) } 60% { transform: rotate(-6deg) } 100% { transform: none } }
@keyframes lgmoonmawBalance12 { 0% { transform: none } 25% { transform: rotate(-2deg) } 50% { transform: rotate(5deg) } 75% { transform: rotate(-1deg) } 100% { transform: none } }
${rule('shield', ['talonl'], 'lgmoonmawSkid 740ms ease-out both')}
${rule('shield', ['head'], 'lgmoonmawTilt 780ms ease-in-out both')}
${rule('shield', ['wingr'], 'lgmoonmawBalance 760ms ease-out both')}
${tame('shield', ['wingr'], 'lgmoonmawBalance12')}
`
// SECOND WIND: the player heals and the strix refuses to believe it: the head bobs and swivels side to side, the eyes
// narrow, the ear tufts rise.
const wind = `
@keyframes lgmoonmawSwivel { 0%, 100% { transform: none } 15% { transform: rotate(-13deg) translateY(3%) } 35% { transform: rotate(13deg) translateY(3%) } 55% { transform: rotate(-10deg) translateY(2%) } 75% { transform: rotate(6deg) translateY(1%) } }
@keyframes lgmoonmawNarrow { 0%, 100% { transform: none } 20%, 80% { transform: scaleY(.45) } }
@keyframes lgmoonmawRiseL { 0%, 100% { transform: none } 30%, 70% { transform: rotate(12deg) scale(1.02) } }
@keyframes lgmoonmawRiseR { 0%, 100% { transform: none } 30%, 70% { transform: rotate(-12deg) scale(1.02) } }
${rule('wind', ['head'], 'lgmoonmawSwivel 950ms ease-in-out both')}
${rule('wind', ['eyes'], 'lgmoonmawNarrow 950ms ease-in-out both')}
${rule('wind', ['tuftl'], 'lgmoonmawRiseL 950ms ease-in-out both')}
${rule('wind', ['tuftr'], 'lgmoonmawRiseR 950ms ease-in-out both')}
`
// ITS KNOCKOUT (the eclipse): a last screech with the wings flung wide, then totality takes it: the eyes close, the
// moon face sinks forward, the ear tufts droop, the wings fold down and the talons curl shut. fx/moonmaw.jsx holds the
// fallen pose after the cinematic.
const ko = `
@keyframes lgmoonmawKoHead { 0% { transform: none } 16% { transform: translateY(3%) scale(1.03) } 40% { transform: translateY(3%) scale(1.02) } 70% { transform: translateY(14%) rotate(-10deg) scale(.93) } 84% { transform: translateY(11%) rotate(-8deg) scale(.93) } 100% { transform: translateY(13%) rotate(-9deg) scale(.93) } }
@keyframes lgmoonmawKoEyes { 0% { transform: none } 16% { transform: scale(1.25) } 45% { transform: scale(1.1) } 62% { transform: scaleY(.5) } 72%, 100% { transform: scaleY(.08) } }
@keyframes lgmoonmawKoBeak { 0% { transform: none } 16%, 40% { transform: scaleY(1.7) } 70%, 100% { transform: scaleY(1.15) } }
@keyframes lgmoonmawKoTuftL { 0% { transform: none } 16% { transform: rotate(14deg) } 50% { transform: rotate(7deg) } 80%, 100% { transform: rotate(-48deg) } }
@keyframes lgmoonmawKoTuftR { 0% { transform: none } 16% { transform: rotate(-14deg) } 50% { transform: rotate(-7deg) } 80%, 100% { transform: rotate(48deg) } }
@keyframes lgmoonmawKoWingL { 0% { transform: none } 16% { transform: rotate(6deg) } 45% { transform: rotate(3deg) } 75% { transform: rotate(-16deg) } 86% { transform: rotate(-13deg) } 100% { transform: rotate(-15deg) } }
@keyframes lgmoonmawKoWingL12 { 0% { transform: none } 16% { transform: rotate(3deg) } 45% { transform: rotate(1deg) } 75% { transform: rotate(-16deg) } 86% { transform: rotate(-13deg) } 100% { transform: rotate(-15deg) } }
@keyframes lgmoonmawKoWingR { 0% { transform: none } 16% { transform: rotate(-6deg) } 45% { transform: rotate(-3deg) } 75% { transform: rotate(16deg) } 86% { transform: rotate(13deg) } 100% { transform: rotate(15deg) } }
@keyframes lgmoonmawKoWingR12 { 0% { transform: none } 16% { transform: rotate(-3deg) } 45% { transform: rotate(-1deg) } 75% { transform: rotate(16deg) } 86% { transform: rotate(13deg) } 100% { transform: rotate(15deg) } }
@keyframes lgmoonmawKoCurl { 0%, 50% { transform: none } 75%, 100% { transform: translateY(-6%) scale(.85, .7) } }
${rule('ko', ['head'], 'lgmoonmawKoHead 2400ms cubic-bezier(.3,.6,.4,1) both')}
${rule('ko', ['eyes'], 'lgmoonmawKoEyes 2400ms ease-in both')}
${rule('ko', ['beak'], 'lgmoonmawKoBeak 2400ms ease-out both')}
${rule('ko', ['tuftl'], 'lgmoonmawKoTuftL 2400ms ease-in both')}
${rule('ko', ['tuftr'], 'lgmoonmawKoTuftR 2400ms ease-in both')}
${rule('ko', ['wingl'], 'lgmoonmawKoWingL 2400ms cubic-bezier(.4,.1,.5,1) both')}
${rule('ko', ['wingr'], 'lgmoonmawKoWingR 2400ms cubic-bezier(.4,.1,.5,1) both')}
${tame('ko', ['wingl'], 'lgmoonmawKoWingL12')}
${tame('ko', ['wingr'], 'lgmoonmawKoWingR12')}
${rule('ko', ['talonl', 'talonr'], 'lgmoonmawKoCurl 2400ms ease-in both')}
`
// The fallen pose (held by fx/moonmaw.jsx after the cinematic).
export const FALLEN = { head: 'translateY(13%) rotate(-9deg) scale(.93)', eyes: 'scaleY(.08)', beak: 'scaleY(1.15)', tuftl: 'rotate(-48deg)', tuftr: 'rotate(48deg)',
  wingl: 'rotate(-15deg)', wingr: 'rotate(15deg)', talonl: 'translateY(-6%) scale(.85, .7)', talonr: 'translateY(-6%) scale(.85, .7)' }

// ITS OWN DRAWN PARTS
const OWN = `
@keyframes lgmoonmawGale { 0% { transform: translate(0, 0) rotate(var(--r0)) scale(.5); opacity: 0 } 12% { opacity: 1 } 60% { opacity: 1 } 100% { transform: translate(var(--x), var(--y)) rotate(var(--r1)) scale(1.5); opacity: 0 } }
@keyframes lgmoonmawPlume { 0% { transform: translate(0, 0) rotate(0) scale(.6); opacity: 0 } 10% { opacity: 1 } 50% { transform: translate(calc(var(--x) * .7), calc(var(--y) * .7)) rotate(calc(var(--r) * .5)) scale(1.1) } 100% { transform: translate(var(--x), calc(var(--y) + 18cqw)) rotate(var(--r)) scale(1); opacity: 0 } }
@keyframes lgmoonmawDust { 0% { transform: translate(-50%, -50%) scale(.2); opacity: .95 } 100% { transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(1.4); opacity: 0 } }
`
// A feather of the strix (silver-violet vane, dark shaft), drawn pointing up.
const feather = (k) => (
  <svg key={k} viewBox="-4 -12 8 24" width="100%" height="100%" style={{ overflow: 'visible', display: 'block' }} aria-hidden="true">
    <path d="M0 -12 C4 -6 4 4 0 11 C-4 4 -4 -6 0 -12 Z" fill="#c9b8ff" stroke="#20184a" strokeWidth=".8" />
    <path d="M0 -10 V12 M0 -4 L2.5 -6.5 M0 0 L-2.5 -2.5 M0 4 L2.5 1.5" stroke="#20184a" strokeWidth=".7" fill="none" />
  </svg>
)
// moonmawGale: its heavy wingbeat: two crescent sheets of moonlit wind sweep down off the wings at the player, tearing
// feathers loose.
function gale(p, ctx) {
  const s = ctx.scale
  const sheet = (k, side, delay) => (
    <div key={k} style={{ position: 'absolute', left: side < 0 ? '4%' : '56%', top: '6%', width: `${40 * s}cqw`, height: `${54 * s}cqw`, '--r0': `${side * -30}deg`, '--r1': `${side * 20}deg`, '--x': `${-side * 8}cqw`, '--y': '30cqw',
      filter: `drop-shadow(0 0 2cqw ${ctx.color})`, animation: `lgmoonmawGale ${720 * ctx.speed}ms cubic-bezier(.3,.6,.4,1) ${delay}ms both` }}>
      <svg viewBox="0 0 40 54" width="100%" height="100%" style={{ overflow: 'visible', display: 'block', transform: side > 0 ? 'scaleX(-1)' : undefined }} aria-hidden="true">
        <path d="M4 2 C30 10 40 30 30 52 C34 30 22 14 4 2 Z" fill="#f2edff" fillOpacity=".9" />
        <path d="M10 8 C28 16 34 30 28 44 C30 30 22 18 10 8 Z" fill={ctx.color} />
      </svg>
    </div>
  )
  return [
    sheet('l1', -1, 0), sheet('r1', 1, 40), sheet('l2', -1, 420), sheet('r2', 1, 460),
    ...Array.from({ length: 10 }, (_, i) => {
      const side = i % 2 ? 1 : -1
      return <div key={`f${i}`} style={{ position: 'absolute', left: `${50 + side * (18 + (i % 3) * 8)}%`, top: `${30 + (i % 4) * 8}%`, width: `${5 * s}cqw`, height: `${14 * s}cqw`,
        '--x': `${side * (14 + (i % 4) * 7)}cqw`, '--y': `${6 + (i % 3) * 8}cqw`, '--r': `${side * (200 + i * 40)}deg`, animation: `lgmoonmawPlume ${(900 + (i % 3) * 120) * ctx.speed}ms ease-out ${100 + i * 40}ms both` }}>{feather(i)}</div>
    }),
  ]
}
// moonmawShed: a hit knocks moon dust off its face and shakes feathers loose that tumble down.
function shed(p, ctx) {
  const s = ctx.scale
  return [
    ...Array.from({ length: 7 }, (_, i) => {
      const a = (-150 + i * 22) * (Math.PI / 180)
      return <div key={`d${i}`} style={{ position: 'absolute', left: '50%', top: '36%', width: `${(12 + (i % 3) * 4) * s}cqw`, height: `${(12 + (i % 3) * 4) * s}cqw`, borderRadius: '50%',
        background: 'radial-gradient(circle, #ffffff 0, #e4e8f3 40%, rgba(201,184,255,0) 70%)', '--x': `${Math.cos(a) * 26 * s}cqw`, '--y': `${Math.sin(a) * 22 * s}cqw`,
        animation: `lgmoonmawDust ${(560 + (i % 3) * 60) * ctx.speed}ms ease-out ${i * 18}ms both` }} />
    }),
    ...Array.from({ length: 5 }, (_, i) => {
      const side = i % 2 ? 1 : -1
      return <div key={`f${i}`} style={{ position: 'absolute', left: `${50 + side * (8 + i * 4)}%`, top: '42%', width: `${4.5 * s}cqw`, height: `${12 * s}cqw`,
        '--x': `${side * (10 + i * 5)}cqw`, '--y': `${-8 + i * 3}cqw`, '--r': `${side * (160 + i * 50)}deg`, animation: `lgmoonmawPlume ${(800 + i * 60) * ctx.speed}ms ease-out ${40 + i * 30}ms both` }}>{feather(i)}</div>
    }),
  ]
}

export const css = pivots + hit + crit + sharpen + strike + heavy + block + shield + wind + ko + OWN
export default { moonmawGale: gale, moonmawShed: shed }
