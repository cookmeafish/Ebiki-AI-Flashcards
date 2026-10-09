// KALEIDO's own impact parts: drawers merged into impact/parts.jsx PARTS. Name each `kaleido<Name>` (never clashes).
// A drawer is (params, ctx) => node, like the shared ones (ctx: color, accent, glyph, scale, speed); CSS keyframes it
// needs go in `css` (prefix them lgkaleido). Deterministic, container units, transforms and opacity only.
//
// THE THOUSAND REFLECTIONS ACT OUT EVERY MOMENT with the knight's own drawn parts (raids/kaleido.svg hook classes, kept
// live by the bake): lg-kaleido-head (helm, pivot on the neck), -pauldl / -pauldr (the burning pauldrons), -chest,
// and in phases 1 and 2 his two mirror REFLECTIONS -refl / -refr, which echo his every move a beat late (his signature:
// nothing he does happens only once); phase 3's -sword arm and -gauntlet. Keyed on the arena's data-moment
// (impact/bosses/README.md). His attack on the player, his ability reactions and his fallen pose live in fx/kaleido.jsx.

const B = '.lg-boss[data-motif="kaleido"]'
const M = (m) => `${B}[data-moment="${m}"]`
const FB = 'transform-box: fill-box'
export const pivots = `
${B} .lg-kaleido-head { ${FB}; transform-origin: 50% 92% }
${B} .lg-kaleido-pauldl { ${FB}; transform-origin: 100% 30% }
${B} .lg-kaleido-pauldr { ${FB}; transform-origin: 0% 30% }
${B} .lg-kaleido-chest { ${FB}; transform-origin: 50% 100% }
${B} .lg-kaleido-refl, ${B} .lg-kaleido-refr { ${FB}; transform-origin: 50% 100% }
${B} .lg-kaleido-sword { ${FB}; transform-origin: 18% 92% }
${B} .lg-kaleido-gauntlet { ${FB}; transform-origin: 85% 12% }
`
const rule = (m, parts, anim) => `${parts.map((p) => `${M(m)} .lg-kaleido-${p}`).join(', ')} { animation: ${anim} }`

// A HIT: the helm is knocked back, the pauldrons jolt; a beat later each reflection flinches the same way.
const hit = `
@keyframes lgkaleidoHitHead { 0% { transform: translateY(-6%) rotate(-9deg) } 35% { transform: translateY(-3%) rotate(-5deg) } 70% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgkaleidoHitPaul { 0% { transform: translateY(-10%) } 40% { transform: translateY(-4%) } 100% { transform: none } }
@keyframes lgkaleidoEchoL { 0%, 15% { transform: none } 30% { transform: translateX(-8%) rotate(-6deg) scale(.95) } 65% { transform: translateX(-2%) rotate(-2deg) } 100% { transform: none } }
@keyframes lgkaleidoEchoR { 0%, 15% { transform: none } 30% { transform: translateX(8%) rotate(6deg) scale(.95) } 65% { transform: translateX(2%) rotate(2deg) } 100% { transform: none } }
${rule('hit', ['head'], 'lgkaleidoHitHead 480ms cubic-bezier(.2,.9,.3,1) both')}
${rule('hit', ['pauldl', 'pauldr'], 'lgkaleidoHitPaul 440ms ease-out both')}
${rule('hit', ['refl'], 'lgkaleidoEchoL 560ms ease-out both')}
${rule('hit', ['refr'], 'lgkaleidoEchoR 560ms ease-out both')}
`
// A CRITICAL: the helm is wrenched round, both pauldrons are flung up, and the reflections SHATTER-SHUDDER, each a
// different way (the mirror cracks), before they settle.
const crit = `
@keyframes lgkaleidoCritHead { 0% { transform: rotate(22deg) translateX(8%) scale(.94) } 25% { transform: rotate(25deg) translateX(9%) scale(.94) } 55% { transform: rotate(-8deg) } 80% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgkaleidoFlingL { 0% { transform: rotate(-22deg) translateY(-8%) } 45% { transform: rotate(-12deg) } 100% { transform: none } }
@keyframes lgkaleidoFlingR { 0% { transform: rotate(22deg) translateY(-8%) } 45% { transform: rotate(12deg) } 100% { transform: none } }
@keyframes lgkaleidoShudder { 0% { transform: none } 12% { transform: translate(-6%, 2%) rotate(-5deg) scale(.92) } 24% { transform: translate(5%, -2%) rotate(4deg) scale(.95) } 36% { transform: translate(-4%, 1%) rotate(-3deg) } 50% { transform: translate(3%, 0) rotate(2deg) } 70% { transform: rotate(-1deg) } 100% { transform: none } }
${rule('crit', ['head'], 'lgkaleidoCritHead 720ms cubic-bezier(.15,.85,.3,1) both')}
${rule('crit', ['pauldl', 'gauntlet'], 'lgkaleidoFlingL 680ms ease-out both')}
${rule('crit', ['pauldr', 'sword'], 'lgkaleidoFlingR 680ms ease-out both')}
${rule('crit', ['refl', 'refr'], 'lgkaleidoShudder 720ms linear both')}
`
// A SHARPENED strike: a clean diagonal cut: the knight tilts along it (one pauldron drops, the other rises), the helm
// ducks, and the reflections slide APART like an image split by the blade.
const sharpen = `
@keyframes lgkaleidoDuck { 0% { transform: translateY(10%) rotate(6deg) scale(.94) } 50% { transform: translateY(6%) rotate(4deg) } 100% { transform: none } }
@keyframes lgkaleidoDropL { 0% { transform: translateY(14%) rotate(12deg) } 55% { transform: translateY(8%) rotate(7deg) } 100% { transform: none } }
@keyframes lgkaleidoRiseR { 0% { transform: translateY(-12%) rotate(10deg) } 55% { transform: translateY(-7%) rotate(6deg) } 100% { transform: none } }
@keyframes lgkaleidoApartL { 0%, 10% { transform: none } 28% { transform: translate(-14%, 6%) } 65% { transform: translate(-8%, 3%) } 100% { transform: none } }
@keyframes lgkaleidoApartR { 0%, 10% { transform: none } 28% { transform: translate(14%, -6%) } 65% { transform: translate(8%, -3%) } 100% { transform: none } }
${rule('sharpen', ['head'], 'lgkaleidoDuck 600ms cubic-bezier(.2,.9,.3,1) both')}
${rule('sharpen', ['pauldl', 'gauntlet'], 'lgkaleidoDropL 600ms ease-out both')}
${rule('sharpen', ['pauldr', 'sword'], 'lgkaleidoRiseR 600ms ease-out both')}
${rule('sharpen', ['refl'], 'lgkaleidoApartL 640ms ease-out both')}
${rule('sharpen', ['refr'], 'lgkaleidoApartR 640ms ease-out both')}
`
// HIS STRIKE (a plain miss; the prism ray he fires at the player is fx/kaleido.jsx's data-assault-on): his burning
// pauldrons and chest swell as the ray charges, and both reflections cast it with him, a beat late.
const strike = `
@keyframes lgkaleidoSwellL { 0% { transform: none } 20% { transform: scale(1.14) rotate(-6deg) } 60% { transform: scale(1.08) } 100% { transform: none } }
@keyframes lgkaleidoSwellR { 0% { transform: none } 20% { transform: scale(1.14) rotate(6deg) } 60% { transform: scale(1.08) } 100% { transform: none } }
@keyframes lgkaleidoHeave { 0% { transform: none } 20% { transform: scale(1.06, 1.1) } 60% { transform: scale(1.03) } 100% { transform: none } }
@keyframes lgkaleidoCastL { 0%, 12% { transform: none } 30% { transform: translateX(10%) rotate(8deg) scale(1.08) } 70% { transform: translateX(5%) rotate(4deg) } 100% { transform: none } }
@keyframes lgkaleidoCastR { 0%, 12% { transform: none } 30% { transform: translateX(-10%) rotate(-8deg) scale(1.08) } 70% { transform: translateX(-5%) rotate(-4deg) } 100% { transform: none } }
${rule('hurt', ['pauldl'], 'lgkaleidoSwellL 760ms ease-out both')}
${rule('hurt', ['pauldr'], 'lgkaleidoSwellR 760ms ease-out both')}
${rule('hurt', ['chest'], 'lgkaleidoHeave 760ms ease-out both')}
${rule('hurt', ['refl'], 'lgkaleidoCastL 800ms ease-out both')}
${rule('hurt', ['refr'], 'lgkaleidoCastR 800ms ease-out both')}
`
// HIS HEAVY BLOW (a missed attack): all three knights CONVERGE: the reflections stride in to flank him, he swells up
// behind them, the pauldrons blaze up twice; in phase 3 the gauntlet slams down.
const heavy = `
@keyframes lgkaleidoConvergeL { 0% { transform: none } 18% { transform: translateX(22%) scale(1.12) } 55% { transform: translateX(18%) scale(1.1) } 80% { transform: translateX(4%) } 100% { transform: none } }
@keyframes lgkaleidoConvergeR { 0% { transform: none } 18% { transform: translateX(-22%) scale(1.12) } 55% { transform: translateX(-18%) scale(1.1) } 80% { transform: translateX(-4%) } 100% { transform: none } }
@keyframes lgkaleidoTower { 0% { transform: none } 18% { transform: translateY(-6%) scale(1.08) } 34% { transform: translateY(2%) scale(.98) } 50% { transform: translateY(-5%) scale(1.07) } 100% { transform: none } }
@keyframes lgkaleidoBlazeL { 0% { transform: none } 15% { transform: rotate(-16deg) scale(1.18) } 30% { transform: rotate(4deg) } 45% { transform: rotate(-14deg) scale(1.15) } 100% { transform: none } }
@keyframes lgkaleidoBlazeR { 0% { transform: none } 15% { transform: rotate(16deg) scale(1.18) } 30% { transform: rotate(-4deg) } 45% { transform: rotate(14deg) scale(1.15) } 100% { transform: none } }
@keyframes lgkaleidoSlam { 0% { transform: none } 15% { transform: rotate(-24deg) translateY(-10%) } 30% { transform: rotate(14deg) translateY(10%) scale(1.15) } 50% { transform: rotate(10deg) translateY(8%) } 100% { transform: none } }
${rule('hurtBig', ['refl'], 'lgkaleidoConvergeL 1000ms cubic-bezier(.3,.9,.4,1) both')}
${rule('hurtBig', ['refr'], 'lgkaleidoConvergeR 1000ms cubic-bezier(.3,.9,.4,1) both')}
${rule('hurtBig', ['chest'], 'lgkaleidoTower 1000ms ease-out both')}
${rule('hurtBig', ['pauldl'], 'lgkaleidoBlazeL 1000ms ease-out both')}
${rule('hurtBig', ['pauldr'], 'lgkaleidoBlazeR 1000ms ease-out both')}
${rule('hurtBig', ['gauntlet'], 'lgkaleidoSlam 1000ms ease-out both')}
`
// A BLOCK (his ray was parried): it bounces back into his visor: the helm snaps back, the pauldrons brace, the
// reflections recoil OUT to the mirror frames; in phase 3 the sword is knocked up.
const block = `
@keyframes lgkaleidoSnapBack { 0% { transform: translateY(-9%) scale(.9) } 25% { transform: translateY(-10%) scale(.88) rotate(-4deg) } 55% { transform: translateY(-3%) rotate(3deg) } 100% { transform: none } }
@keyframes lgkaleidoBraceL { 0% { transform: rotate(14deg) } 50% { transform: rotate(8deg) } 100% { transform: none } }
@keyframes lgkaleidoBraceR { 0% { transform: rotate(-14deg) } 50% { transform: rotate(-8deg) } 100% { transform: none } }
@keyframes lgkaleidoOutL { 0%, 10% { transform: none } 26% { transform: translateX(-16%) rotate(-8deg) } 60% { transform: translateX(-8%) } 100% { transform: none } }
@keyframes lgkaleidoOutR { 0%, 10% { transform: none } 26% { transform: translateX(16%) rotate(8deg) } 60% { transform: translateX(8%) } 100% { transform: none } }
@keyframes lgkaleidoKnockUp { 0% { transform: rotate(-30deg) } 40% { transform: rotate(-22deg) } 100% { transform: none } }
${rule('block', ['head'], 'lgkaleidoSnapBack 620ms ease-out both')}
${rule('block', ['pauldl', 'gauntlet'], 'lgkaleidoBraceL 600ms ease-out both')}
${rule('block', ['pauldr'], 'lgkaleidoBraceR 600ms ease-out both')}
${rule('block', ['refl'], 'lgkaleidoOutL 660ms ease-out both')}
${rule('block', ['refr'], 'lgkaleidoOutR 660ms ease-out both')}
${rule('block', ['sword'], 'lgkaleidoKnockUp 620ms ease-out both')}
`
// A SHIELD SAVE: the ray glances off the dome: the knight turns his helm from the glare, and the two mirrors swivel
// edge-on (they narrow to slivers) to dodge their own reflected light; the sword glances wide.
const shield = `
@keyframes lgkaleidoAvert { 0% { transform: none } 25% { transform: rotate(14deg) translateX(5%) } 65% { transform: rotate(11deg) translateX(4%) } 100% { transform: none } }
@keyframes lgkaleidoEdgeOn { 0% { transform: none } 25% { transform: scaleX(.3) } 65% { transform: scaleX(.4) } 100% { transform: none } }
@keyframes lgkaleidoGlanceWide { 0% { transform: none } 25% { transform: rotate(26deg) } 65% { transform: rotate(18deg) } 100% { transform: none } }
${rule('shield', ['head'], 'lgkaleidoAvert 760ms ease-out both')}
${rule('shield', ['refl', 'refr'], 'lgkaleidoEdgeOn 760ms ease-in-out both')}
${rule('shield', ['sword'], 'lgkaleidoGlanceWide 760ms ease-out both')}
`
// SECOND WIND: the player heals; the knight lowers his helm and shakes it slowly, the pauldron fires sink, the
// reflections sway out of step with him.
const wind = `
@keyframes lgkaleidoSlowShake { 0%, 100% { transform: none } 15% { transform: translateY(5%) rotate(-7deg) } 40% { transform: translateY(5%) rotate(7deg) } 65% { transform: translateY(4%) rotate(-5deg) } 85% { transform: translateY(2%) } }
@keyframes lgkaleidoSink { 0%, 100% { transform: none } 30%, 70% { transform: translateY(10%) scale(.92) } }
@keyframes lgkaleidoSwayL { 0%, 100% { transform: none } 25% { transform: rotate(6deg) } 55% { transform: rotate(-5deg) } 80% { transform: rotate(3deg) } }
@keyframes lgkaleidoSwayR { 0%, 100% { transform: none } 25% { transform: rotate(-6deg) } 55% { transform: rotate(5deg) } 80% { transform: rotate(-3deg) } }
${rule('wind', ['head'], 'lgkaleidoSlowShake 950ms ease-in-out both')}
${rule('wind', ['pauldl', 'pauldr'], 'lgkaleidoSink 950ms ease-in-out both')}
${rule('wind', ['refl'], 'lgkaleidoSwayL 950ms ease-in-out both')}
${rule('wind', ['refr'], 'lgkaleidoSwayR 950ms ease-in-out both')}
`
// HIS KNOCKOUT (refracted apart): a last flare with everything thrown wide, then the reflections crack and topple out
// of their frames, the helm bows, the pauldron fires gutter, the sword arm and gauntlet fall. fx/kaleido.jsx holds the
// fallen pose after the cinematic.
const ko = `
@keyframes lgkaleidoKoHead { 0% { transform: none } 16% { transform: translateY(-8%) rotate(-6deg) scale(1.06) } 45% { transform: translateY(-5%) scale(1.04) } 72% { transform: translateY(16%) rotate(8deg) scale(.92) } 86% { transform: translateY(13%) rotate(6deg) scale(.92) } 100% { transform: translateY(15%) rotate(7deg) scale(.92) } }
@keyframes lgkaleidoKoPaulL { 0% { transform: none } 16% { transform: rotate(-18deg) scale(1.12) } 50% { transform: rotate(-8deg) } 80%, 100% { transform: translateY(16%) rotate(14deg) scale(.9) } }
@keyframes lgkaleidoKoPaulR { 0% { transform: none } 16% { transform: rotate(18deg) scale(1.12) } 50% { transform: rotate(8deg) } 80%, 100% { transform: translateY(16%) rotate(-14deg) scale(.9) } }
@keyframes lgkaleidoKoToppleL { 0% { transform: none } 16% { transform: translateX(6%) scale(1.06) } 40% { transform: translate(-3%, 0) rotate(-4deg) } 70% { transform: translate(-16%, 10%) rotate(-24deg) scale(.86) } 84% { transform: translate(-14%, 8%) rotate(-20deg) scale(.86) } 100% { transform: translate(-15%, 9%) rotate(-22deg) scale(.86) } }
@keyframes lgkaleidoKoToppleR { 0% { transform: none } 16% { transform: translateX(-6%) scale(1.06) } 40% { transform: translate(3%, 0) rotate(4deg) } 70% { transform: translate(16%, 10%) rotate(24deg) scale(.86) } 84% { transform: translate(14%, 8%) rotate(20deg) scale(.86) } 100% { transform: translate(15%, 9%) rotate(22deg) scale(.86) } }
@keyframes lgkaleidoKoSword { 0% { transform: none } 16% { transform: rotate(-16deg) } 50% { transform: rotate(-8deg) } 78%, 100% { transform: rotate(58deg) translateY(10%) } }
@keyframes lgkaleidoKoGauntlet { 0% { transform: none } 16% { transform: rotate(-14deg) scale(1.1) } 50% { transform: rotate(-6deg) } 78%, 100% { transform: rotate(24deg) translateY(14%) } }
@keyframes lgkaleidoKoChest { 0%, 45% { transform: none } 80%, 100% { transform: translateY(6%) scale(.96, .9) } }
${rule('ko', ['head'], 'lgkaleidoKoHead 2100ms cubic-bezier(.3,.6,.4,1) both')}
${rule('ko', ['pauldl'], 'lgkaleidoKoPaulL 2100ms ease-in both')}
${rule('ko', ['pauldr'], 'lgkaleidoKoPaulR 2100ms ease-in both')}
${rule('ko', ['refl'], 'lgkaleidoKoToppleL 2100ms cubic-bezier(.4,.1,.5,1) both')}
${rule('ko', ['refr'], 'lgkaleidoKoToppleR 2100ms cubic-bezier(.4,.1,.5,1) both')}
${rule('ko', ['sword'], 'lgkaleidoKoSword 2100ms ease-in both')}
${rule('ko', ['gauntlet'], 'lgkaleidoKoGauntlet 2100ms ease-in both')}
${rule('ko', ['chest'], 'lgkaleidoKoChest 2100ms ease-in both')}
`
// The fallen pose (held by fx/kaleido.jsx after the cinematic).
export const FALLEN = { head: 'translateY(15%) rotate(7deg) scale(.92)', pauldl: 'translateY(16%) rotate(14deg) scale(.9)', pauldr: 'translateY(16%) rotate(-14deg) scale(.9)',
  refl: 'translate(-15%, 9%) rotate(-22deg) scale(.86)', refr: 'translate(15%, 9%) rotate(22deg) scale(.86)', sword: 'rotate(58deg) translateY(10%)', gauntlet: 'rotate(24deg) translateY(14%)', chest: 'translateY(6%) scale(.96, .9)' }

// HIS OWN DRAWN PARTS
const OWN = `
@keyframes lgkaleidoFan { 0% { transform: rotate(var(--a)) scaleX(0); opacity: 1 } 22% { transform: rotate(var(--a)) scaleX(1.04); opacity: 1 } 34% { transform: rotate(var(--a)) scaleX(1) scaleY(1.3) } 60% { opacity: 1 } 100% { transform: rotate(var(--a)) scaleX(1) scaleY(.2); opacity: 0 } }
@keyframes lgkaleidoPrismPop { 0% { transform: translate(-50%, -50%) rotate(0) scale(.2); opacity: 0 } 18% { transform: translate(-50%, -50%) rotate(30deg) scale(1.2); opacity: 1 } 60% { transform: translate(-50%, -50%) rotate(60deg) scale(1); opacity: 1 } 100% { transform: translate(-50%, -50%) rotate(90deg) scale(.6); opacity: 0 } }
@keyframes lgkaleidoTri { 0% { transform: translate(-50%, -50%) rotate(var(--a)) scaleX(0); opacity: 1 } 28% { transform: translate(-50%, -50%) rotate(var(--a)) scaleX(1); opacity: 1 } 55% { opacity: 1 } 100% { transform: translate(calc(-50% + var(--x)), -50%) rotate(var(--a)) scaleX(1) scaleY(.4); opacity: 0 } }
`
const RGB3 = ['#ff3b5c', '#3dff8a', '#3aa8ff']
// kaleidoRay: his prism ray: a white beam strikes a prism at his visor and splits into a fan of red, green and blue
// rays that sweep out at the player (to the right of the boss).
function ray(p, ctx) {
  const s = ctx.scale
  const x = p.x ?? 50, y = p.y ?? 36
  return [
    <div key="w" style={{ position: 'absolute', left: '-6%', top: `${y}%`, width: `${x + 6}%`, height: `${3 * s}cqw`, marginTop: `${-1.5 * s}cqw`, transformOrigin: '100% 50%', '--a': '0deg',
      background: 'linear-gradient(90deg, rgba(255,255,255,0), #fff 70%)', boxShadow: '0 0 2cqw #fff', animation: `lgkaleidoFan ${520 * ctx.speed}ms cubic-bezier(.2,.9,.3,1) both` }} />,
    <div key="p" style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: `${16 * s}cqw`, height: `${16 * s}cqw`, clipPath: 'polygon(50% 0, 100% 87%, 0 87%)',
      background: 'linear-gradient(160deg, #fff, #c9e8ff 50%, #8aa8ff)', filter: 'drop-shadow(0 0 1.5cqw #fff)', animation: `lgkaleidoPrismPop ${760 * ctx.speed}ms ease-out both` }} />,
    ...RGB3.flatMap((c, i) => [0, 1].map((k) => (
      <div key={`${i}${k}`} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: `${(70 + k * 12) * s}cqw`, height: `${(k ? 2.4 : 5) * s}cqw`, marginTop: `${(k ? -1.2 : -2.5) * s}cqw`, transformOrigin: '0 50%',
        '--a': `${(i - 1) * 13 + 6 + k * 3}deg`, borderRadius: '0 50% 50% 0', background: k ? '#fff' : `linear-gradient(90deg, #fff, ${c} 25%, ${c})`, boxShadow: `0 0 2cqw ${c}`, opacity: k ? 0.8 : 1,
        animation: `lgkaleidoFan ${720 * ctx.speed}ms cubic-bezier(.2,.9,.3,1) ${60 + i * 40}ms both` }} />
    ))),
  ]
}
// kaleidoTriSlash: his heavy blow: the knight and both reflections cut at once: a red, a green and a blue slash a
// hair apart (the images out of register), then the true white cut.
function triSlash(p, ctx) {
  const s = ctx.scale
  const cut = (k, color, dx, dy, delay, w) => (
    <div key={k} style={{ position: 'absolute', left: `${50 + dx}%`, top: `${50 + dy}%`, width: `${140 * s}cqw`, height: `${w * s}cqw`, '--a': '-32deg', '--x': `${dx * 0.4}cqw`, borderRadius: '50%',
      background: `linear-gradient(90deg, transparent, ${color} 18%, #fff 50%, ${color} 82%, transparent)`, boxShadow: `0 0 3cqw ${color}`, animation: `lgkaleidoTri ${640 * ctx.speed}ms cubic-bezier(.15,1,.3,1) ${delay}ms both` }} />
  )
  return [cut('r', RGB3[0], -6, -4, 0, 6), cut('g', RGB3[1], 0, 0, 50, 6), cut('b', RGB3[2], 6, 4, 100, 6), cut('w', '#ffffff', 0, 0, 230, 9)]
}

export const css = pivots + hit + crit + sharpen + strike + heavy + block + shield + wind + ko + OWN
export default { kaleidoRay: ray, kaleidoTriSlash: triSlash }
