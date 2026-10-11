// KALEIDO's own impact parts: drawers merged into impact/parts.jsx PARTS. Name each `kaleido<Name>` (never clashes).
// A drawer is (params, ctx) => node, like the shared ones (ctx: color, accent, glyph, scale, speed); CSS keyframes it
// needs go in `css` (prefix them lgkaleido). Deterministic, container units, transforms and opacity only.
//
// THE THOUSAND REFLECTIONS ACT OUT EVERY MOMENT with the knight's own drawn parts (raids/kaleido.svg hook classes, kept
// live by the bake): lg-kaleido-head (helm, pivot on the neck), -pauldl / -pauldr (the burning pauldrons), -chest,
// and his REFLECTIONS -refl / -refr (viewer's left / right: the fans of mirror blades behind his shoulders, each blade
// holding his reflected eye; in phase 3 the two halves of his prism corona), which echo his every move a beat late; the
// arms: -armr (his right, viewer's left: the RAISED arm, upper arm, couter, vambrace and gauntlet doing the phase's
// gesture: a mirror shard gripped before his chest, a fist thrust at us spraying splinters, an open palm holding his light; pivot at the shoulder,
// measured per phase) and -arml (his left, viewer's right: the hanging upper arm, pivot at its top). Keyed on the arena's data-moment
// (impact/bosses/README.md). His attack on the player, his ability reactions and his fallen pose live in fx/kaleido.jsx.

const B = '.lg-boss[data-motif="kaleido"]'
const M = (m) => `${B}[data-moment="${m}"]`
const FB = 'transform-box: fill-box'
export const pivots = `
${B} .lg-kaleido-head { ${FB}; transform-origin: 52% 92% }
${B}[data-phase="2"] .lg-kaleido-head { transform-origin: 55.2% 94% }
${B}[data-phase="3"] .lg-kaleido-head { transform-origin: 47.7% 94% }
${B} .lg-kaleido-pauldl { ${FB}; transform-origin: 100% 30% }
${B} .lg-kaleido-pauldr { ${FB}; transform-origin: 0% 30% }
${B} .lg-kaleido-chest { ${FB}; transform-origin: 50% -10% }
${B} .lg-kaleido-refl { ${FB}; transform-origin: 100% 100% }
${B} .lg-kaleido-refr { ${FB}; transform-origin: 0% 100% }
${B} .lg-kaleido-arml { ${FB}; transform-origin: 50% 4% }
${B} .lg-kaleido-bust { ${FB}; transform-origin: 50% 100% }
${B} .lg-kaleido-hornl { ${FB}; transform-origin: 100% 100% }
${B} .lg-kaleido-hornr { ${FB}; transform-origin: 0% 100% }
${B} .lg-kaleido-crest { ${FB}; transform-origin: 50% 100% }
${B} .lg-kaleido-wingl { ${FB}; transform-origin: 92% 96% }
${B} .lg-kaleido-wingr { ${FB}; transform-origin: 8% 96% }
${B} .lg-kaleido-armr { ${FB}; transform-origin: 17% 67% }
${B}[data-phase="2"] .lg-kaleido-armr { transform-origin: 14% 51% }
${B}[data-phase="3"] .lg-kaleido-armr { transform-origin: 26% 69% }
`
const rule = (m, parts, anim) => `${parts.map((p) => `${M(m)} .lg-kaleido-${p}`).join(', ')} { animation: ${anim} }`

// A HIT: the helm is knocked back, the pauldrons jolt; a beat later each reflection flinches the same way.
const hit = `
@keyframes lgkaleidoHitHead { 0% { transform: rotate(-9deg)} 35% { transform: rotate(-5deg)} 70% { transform: rotate(2deg)} 100% { transform: none} }
@keyframes lgkaleidoHitPaul { 0% { transform: translateY(-10%) } 40% { transform: translateY(-4%) } 100% { transform: none } }
@keyframes lgkaleidoEchoL { 0%, 15% { transform: none } 30% { transform: translate(-6%, 3%) rotate(-4deg) scale(.95) } 65% { transform: translateX(-2%) rotate(-1deg) } 100% { transform: none } }
@keyframes lgkaleidoEchoR { 0%, 15% { transform: none } 30% { transform: translate(6%, 3%) rotate(4deg) scale(.95) } 65% { transform: translateX(2%) rotate(1deg) } 100% { transform: none } }
${rule('hit', ['head'], 'lgkaleidoHitHead 480ms cubic-bezier(.2,.9,.3,1) both')}
${rule('hit', ['pauldl', 'pauldr'], 'lgkaleidoHitPaul 440ms ease-out both')}
${rule('hit', ['refl'], 'lgkaleidoEchoL 560ms ease-out both')}
${rule('hit', ['refr'], 'lgkaleidoEchoR 560ms ease-out both')}
`
// A CRITICAL: the helm is wrenched round, both pauldrons are flung up, and the reflections SHATTER-SHUDDER, each a
// different way (the mirror cracks), before they settle.
const crit = `
@keyframes lgkaleidoCritHead { 0% { transform: rotate(18deg) scale(.94)} 25% { transform: rotate(20deg) scale(.94)} 55% { transform: rotate(-8deg)} 80% { transform: rotate(3deg)} 100% { transform: none} }
@keyframes lgkaleidoFlingL { 0% { transform: rotate(-22deg) translateY(-8%) } 45% { transform: rotate(-12deg) } 100% { transform: none } }
@keyframes lgkaleidoFlingR { 0% { transform: rotate(22deg) translateY(-8%) } 45% { transform: rotate(12deg) } 100% { transform: none } }
@keyframes lgkaleidoShudder { 0% { transform: none } 12% { transform: translate(-6%, 2%) rotate(-5deg) scale(.92) } 24% { transform: translate(5%, -2%) rotate(4deg) scale(.95) } 36% { transform: translate(-4%, 1%) rotate(-3deg) } 50% { transform: translate(3%, 0) rotate(2deg) } 70% { transform: rotate(-1deg) } 100% { transform: none } }
${rule('crit', ['head'], 'lgkaleidoCritHead 720ms cubic-bezier(.15,.85,.3,1) both')}
${rule('crit', ['pauldl', 'armr'], 'lgkaleidoFlingL 680ms ease-out both')}
${rule('crit', ['pauldr', 'arml'], 'lgkaleidoFlingR 680ms ease-out both')}
${rule('crit', ['refl', 'refr'], 'lgkaleidoShudder 720ms linear both')}
`
// A SHARPENED strike: a clean diagonal cut: the knight tilts along it (one pauldron drops, the other rises), the helm
// ducks, and the reflections slide APART like an image split by the blade.
const sharpen = `
@keyframes lgkaleidoDuck { 0% { transform: rotate(6deg) scale(.94)} 50% { transform: rotate(4deg)} 100% { transform: none} }
@keyframes lgkaleidoDropL { 0% { transform: translateY(14%) rotate(12deg) } 55% { transform: translateY(8%) rotate(7deg) } 100% { transform: none } }
@keyframes lgkaleidoRiseR { 0% { transform: translateY(-12%) rotate(10deg) } 55% { transform: translateY(-7%) rotate(6deg) } 100% { transform: none } }
@keyframes lgkaleidoApartL { 0%, 10% { transform: none } 28% { transform: translate(-4%, 11%) rotate(-3deg) } 65% { transform: translate(-2%, 6%) rotate(-1deg) } 100% { transform: none } }
@keyframes lgkaleidoApartR { 0%, 10% { transform: none } 28% { transform: translate(3%, 1%) rotate(2deg) } 65% { transform: translate(2%, 0) rotate(1deg) } 100% { transform: none } }
${rule('sharpen', ['head'], 'lgkaleidoDuck 600ms cubic-bezier(.2,.9,.3,1) both')}
${rule('sharpen', ['pauldl', 'armr'], 'lgkaleidoDropL 600ms ease-out both')}
${rule('sharpen', ['pauldr', 'arml'], 'lgkaleidoRiseR 600ms ease-out both')}
${rule('sharpen', ['refl'], 'lgkaleidoApartL 640ms ease-out both')}
${rule('sharpen', ['refr'], 'lgkaleidoApartR 640ms ease-out both')}
`
// HIS STRIKE AND HIS HEAVY BLOW: he THROWS the prism ray. Shared by the strike moments here and by his attack on the
// player in fx/kaleido.jsx (data-assault-on): both name the SAME animations, so when the moment ends while the attack
// still plays nothing restarts. The helm sits about 3 units under the top of the arena clip in phases 2 and 3, so it
// never grows: it rears back and drives forward by TILTING on the neck (phase 2 the other way round: its unbroken horn
// rose past the clip on a clockwise turn). The raised arm cocks back and swings ACROSS his body at us, the shoulders
// twist with it (one pauldron drives down, the other pulls up), the chest shears into the throw, the hanging arm swings
// out to balance, and the mirror fans lean in to focus the light. The heavy blow (Cleave) throws twice: the raised arm,
// then the hanging arm sweeps up across him; it rides on top of the throw (later in the animation list) and ends
// before the throw does, so the attack carries on underneath.
export const THROW = `
@keyframes lgrKaleidoThrowHead { 0% { transform: none} 6% { transform: rotate(-8deg) scale(.97)} 10% { transform: rotate(9deg) scale(1.03)} 16% { transform: rotate(7deg) scale(1.02)} 40% { transform: rotate(3deg) scale(1.01)} 62% { transform: none} 100% { transform: none} }
@keyframes lgrKaleidoThrowHeadP2 { 0% { transform: none} 6% { transform: rotate(7deg) scale(.96)} 10% { transform: rotate(-8deg) scale(1.02)} 16% { transform: rotate(-6deg) scale(1.01)} 40% { transform: rotate(-2deg)} 62% { transform: none} 100% { transform: none} }
@keyframes lgrKaleidoThrowChest { 0% { transform: none } 6% { transform: skewX(5deg) scale(1.02, .98) } 10% { transform: skewX(-7deg) scale(.98, 1.03) } 16% { transform: skewX(-6deg) scale(.99, 1.02) } 40% { transform: skewX(-3deg) } 62% { transform: none } 100% { transform: none } }
@keyframes lgrKaleidoThrowPaulL { 0% { transform: none } 6% { transform: translateY(-5%) rotate(-12deg) } 10% { transform: translateY(6%) rotate(10deg) } 40% { transform: translateY(3%) rotate(5deg) } 65% { transform: none } 100% { transform: none } }
@keyframes lgrKaleidoThrowPaulR { 0% { transform: none } 6% { transform: translateY(4%) rotate(-6deg) } 10% { transform: translateY(-3%) rotate(8deg) } 40% { transform: rotate(4deg) } 65% { transform: none } 100% { transform: none } }
@keyframes lgrKaleidoThrowArm { 0% { transform: none } 6% { transform: rotate(-14deg) } 10% { transform: rotate(20deg) } 16% { transform: rotate(24deg) } 40% { transform: rotate(14deg) } 66% { transform: none } 100% { transform: none } }
@keyframes lgrKaleidoThrowBalance { 0% { transform: none } 6% { transform: rotate(-8deg) } 10% { transform: rotate(-16deg) } 40% { transform: rotate(-8deg) } 66% { transform: none } 100% { transform: none } }
@keyframes lgrKaleidoThrowFocusL { 0% { transform: none } 7% { transform: translate(12%, 11%) rotate(8deg) } 11% { transform: translate(15%, 15%) rotate(10deg) scale(1.02) } 40% { transform: translate(12%, 12%) rotate(8deg) scale(1.01) } 70% { transform: translateX(2%) } 100% { transform: none } }
@keyframes lgrKaleidoThrowFocusR { 0% { transform: none } 7% { transform: translate(-12%, 11%) rotate(-8deg) } 11% { transform: translate(-15%, 15%) rotate(-10deg) scale(1.02) } 40% { transform: translate(-12%, 12%) rotate(-8deg) scale(1.01) } 70% { transform: translateX(-2%) } 100% { transform: none } }
@keyframes lgrKaleidoCleaveHead { 0% { transform: rotate(-8deg) scale(.97)} 4% { transform: rotate(9deg) scale(1.03)} 22% { transform: rotate(6deg) scale(1.02)} 28% { transform: rotate(-9deg) scale(.96)} 36% { transform: rotate(9deg) scale(1.02)} 56% { transform: rotate(4deg) scale(1.01)} 80% { transform: none} 100% { transform: none} }
@keyframes lgrKaleidoCleaveHeadP2 { 0% { transform: rotate(7deg) scale(.96)} 4% { transform: rotate(-8deg) scale(1.02)} 22% { transform: rotate(-5deg) scale(1.01)} 28% { transform: rotate(8deg) scale(.95)} 36% { transform: rotate(-9deg) scale(1.02)} 56% { transform: rotate(-3deg) scale(1.01)} 80% { transform: none} 100% { transform: none} }
@keyframes lgrKaleidoCleaveChest { 0% { transform: skewX(5deg) scale(1.02, .98) } 4% { transform: skewX(-7deg) scale(.98, 1.03) } 22% { transform: skewX(-4deg) } 28% { transform: skewX(7deg) scale(1.02, .97) } 36% { transform: skewX(-9deg) scale(.97, 1.04) } 56% { transform: skewX(-3deg) } 80% { transform: none } 100% { transform: none } }
@keyframes lgrKaleidoCleavePaulL { 0% { transform: translateY(-5%) rotate(-12deg) } 4% { transform: translateY(6%) rotate(10deg) } 22% { transform: translateY(3%) rotate(6deg) } 28% { transform: translateY(-5%) rotate(-12deg) } 36% { transform: translateY(7%) rotate(12deg) } 56% { transform: translateY(3%) rotate(5deg) } 80% { transform: none } 100% { transform: none } }
@keyframes lgrKaleidoCleavePaulR { 0% { transform: translateY(4%) rotate(-6deg) } 4% { transform: translateY(-3%) rotate(8deg) } 22% { transform: rotate(4deg) } 28% { transform: translateY(4%) rotate(-8deg) } 36% { transform: translateY(-4%) rotate(10deg) } 56% { transform: rotate(4deg) } 80% { transform: none } 100% { transform: none } }
@keyframes lgrKaleidoCleaveArmR { 0% { transform: rotate(-14deg) } 4% { transform: rotate(22deg) } 22% { transform: rotate(16deg) } 28% { transform: rotate(-8deg) } 36% { transform: rotate(26deg) } 56% { transform: rotate(12deg) } 80% { transform: none } 100% { transform: none } }
@keyframes lgrKaleidoCleaveArmL { 0% { transform: rotate(-8deg) } 4% { transform: rotate(-14deg) } 22% { transform: rotate(-8deg) } 28% { transform: rotate(-22deg) } 36% { transform: rotate(40deg) } 50% { transform: rotate(34deg) } 80% { transform: none } 100% { transform: none } }
@keyframes lgrKaleidoCleaveFocusL { 0% { transform: translate(12%, 11%) rotate(8deg) } 4% { transform: translate(15%, 15%) rotate(10deg) } 22% { transform: translate(10%, 10%) rotate(6deg) } 28% { transform: translate(4%, 4%) rotate(2deg) } 36% { transform: translate(16%, 16%) rotate(10deg) } 56% { transform: translate(8%, 8%) rotate(5deg) } 80% { transform: none } 100% { transform: none } }
@keyframes lgrKaleidoCleaveFocusR { 0% { transform: translate(-12%, 11%) rotate(-8deg) } 4% { transform: translate(-15%, 15%) rotate(-10deg) } 22% { transform: translate(-10%, 10%) rotate(-6deg) } 28% { transform: translate(-4%, 4%) rotate(-2deg) } 36% { transform: translate(-16%, 16%) rotate(-10deg) } 56% { transform: translate(-8%, 8%) rotate(-5deg) } 80% { transform: none } 100% { transform: none } }
`
const T = '1300ms cubic-bezier(.3,.7,.4,1) both'
const C = '1200ms cubic-bezier(.3,.7,.4,1) backwards'
const THROW_ANIM = { head: 'lgrKaleidoThrowHead', chest: 'lgrKaleidoThrowChest', pauldl: 'lgrKaleidoThrowPaulL', pauldr: 'lgrKaleidoThrowPaulR', armr: 'lgrKaleidoThrowArm', arml: 'lgrKaleidoThrowBalance', refl: 'lgrKaleidoThrowFocusL', refr: 'lgrKaleidoThrowFocusR' }
const CLEAVE_ANIM = { head: 'lgrKaleidoCleaveHead', chest: 'lgrKaleidoCleaveChest', pauldl: 'lgrKaleidoCleavePaulL', pauldr: 'lgrKaleidoCleavePaulR', armr: 'lgrKaleidoCleaveArmR', arml: 'lgrKaleidoCleaveArmL', refl: 'lgrKaleidoCleaveFocusL', refr: 'lgrKaleidoCleaveFocusR' }
const p2 = (sel) => sel.replace(B, `${B}[data-phase="2"]`)
// The throw on every part for `sel`; with `big`, the cleave on top of it.
export const throwRules = (sel, big = false) => Object.keys(THROW_ANIM).map((p) => {
  const anim = (ph2) => {
    const v = ph2 && p === 'head' ? 'P2' : ''
    const t = `${THROW_ANIM[p]}${v} ${T}`
    return big ? `${t}, ${CLEAVE_ANIM[p]}${v} ${C}` : t
  }
  return `${sel} .lg-kaleido-${p} { animation: ${anim(false)} }` + (p === 'head' ? `\n${p2(sel)} .lg-kaleido-${p} { animation: ${anim(true)} }` : '')
}).join('\n')
// (the keyframes are in fx/kaleido.jsx's css, on the page for the whole raid)
const strike = throwRules(M('hurt')) + '\n' + throwRules(M('hurtBig'), true) + '\n'
// A BLOCK (his ray was parried): it bounces back into his visor: the helm snaps back, the pauldrons brace, the
// reflections recoil OUT to the mirror frames; his left arm is knocked up.
const block = `
@keyframes lgkaleidoSnapBack { 0% { transform: scale(.9)} 25% { transform: scale(.88) rotate(-4deg)} 55% { transform: rotate(3deg)} 100% { transform: none} }
@keyframes lgkaleidoBraceL { 0% { transform: rotate(14deg) } 50% { transform: rotate(8deg) } 100% { transform: none } }
@keyframes lgkaleidoBraceR { 0% { transform: rotate(-14deg) } 50% { transform: rotate(-8deg) } 100% { transform: none } }
@keyframes lgkaleidoOutL { 0%, 10% { transform: none } 26% { transform: translate(-5%, 6%) rotate(-5deg) scale(.94) } 60% { transform: translate(-3%, 3%) rotate(-2deg) } 100% { transform: none } }
@keyframes lgkaleidoOutR { 0%, 10% { transform: none } 26% { transform: translate(5%, 6%) rotate(5deg) scale(.94) } 60% { transform: translate(3%, 3%) rotate(2deg) } 100% { transform: none } }
@keyframes lgkaleidoKnockUp { 0% { transform: rotate(-30deg) } 40% { transform: rotate(-22deg) } 100% { transform: none } }
${rule('block', ['head'], 'lgkaleidoSnapBack 620ms ease-out both')}
${rule('block', ['pauldl', 'armr'], 'lgkaleidoBraceL 600ms ease-out both')}
${rule('block', ['pauldr'], 'lgkaleidoBraceR 600ms ease-out both')}
${rule('block', ['refl'], 'lgkaleidoOutL 660ms ease-out both')}
${rule('block', ['refr'], 'lgkaleidoOutR 660ms ease-out both')}
${rule('block', ['arml'], 'lgkaleidoKnockUp 620ms ease-out both')}
`
// A SHIELD SAVE: the ray glances off the dome: the knight turns his helm from the glare, and the two mirrors swivel
// edge-on (they narrow to slivers) to dodge their own reflected light; his left arm glances wide.
const shield = `
@keyframes lgkaleidoAvert { 0% { transform: none} 25% { transform: rotate(8deg)} 65% { transform: rotate(6deg)} 100% { transform: none} }
@keyframes lgkaleidoEdgeOn { 0% { transform: none } 25% { transform: scaleX(.3) } 65% { transform: scaleX(.4) } 100% { transform: none } }
@keyframes lgkaleidoGlanceWide { 0% { transform: none } 25% { transform: rotate(26deg) } 65% { transform: rotate(18deg) } 100% { transform: none } }
${rule('shield', ['head'], 'lgkaleidoAvert 760ms ease-out both')}
${rule('shield', ['refl', 'refr'], 'lgkaleidoEdgeOn 760ms ease-in-out both')}
${rule('shield', ['arml'], 'lgkaleidoGlanceWide 760ms ease-out both')}
`
// SECOND WIND: the player heals; the knight lowers his helm and shakes it slowly, the pauldron fires sink, the
// reflections sway out of step with him.
const wind = `
@keyframes lgkaleidoSlowShake { 0%, 100% { transform: none} 15% { transform: rotate(-7deg)} 40% { transform: rotate(7deg)} 65% { transform: rotate(-5deg)} 85% { transform: none} }
@keyframes lgkaleidoSink { 0%, 100% { transform: none } 30%, 70% { transform: translateY(10%) scale(.92) } }
@keyframes lgkaleidoSwayL { 0%, 100% { transform: none } 25% { transform: rotate(6deg) } 55% { transform: rotate(-5deg) } 80% { transform: rotate(3deg) } }
@keyframes lgkaleidoSwayR { 0%, 100% { transform: none } 25% { transform: rotate(-6deg) } 55% { transform: rotate(5deg) } 80% { transform: rotate(-3deg) } }
${rule('wind', ['head'], 'lgkaleidoSlowShake 950ms ease-in-out both')}
${rule('wind', ['pauldl', 'pauldr'], 'lgkaleidoSink 950ms ease-in-out both')}
${rule('wind', ['refl'], 'lgkaleidoSwayL 950ms ease-in-out both')}
${rule('wind', ['refr'], 'lgkaleidoSwayR 950ms ease-in-out both')}
`
// HIS KNOCKOUT (refracted apart): a last flare with everything thrown wide; then the blow lands ON him: the mirror face
// goes dark and shatters (lg-kaleido-crack, the prism too), his left horn snaps off and is gone, the crystal wings droop, the crown
// is knocked askew; the fans fold shut and sink behind him, the helm bows into the gorget, the pauldrons slump, both
// arms fall, his light (the aura) dims. fx/kaleido.jsx holds the
// fallen pose after the cinematic.
const ko = `
@keyframes lgkaleidoKoHead { 0% { transform: none } 16% { transform: rotate(-7deg) scale(1.02) } 45% { transform: scale(1.01) } 54% { transform: rotate(-5deg) scale(.98) } 74% { transform: translateY(.4%) rotate(15deg) scale(.95, .76) } 84% { transform: translateY(.4%) rotate(11deg) scale(.95, .8) } 100% { transform: translateY(.4%) rotate(13deg) scale(.95, .78) } }
@keyframes lgkaleidoKoBust { 0%, 52% { transform: none } 74% { transform: translateY(7px) rotate(-4deg) scale(.96) } 86% { transform: translateY(5px) rotate(-3deg) scale(.97) } 100% { transform: translateY(6px) rotate(-3.5deg) scale(.965) } }
@keyframes lgkaleidoKoPaulL { 0% { transform: none } 16% { transform: rotate(-20deg) scale(1.04) } 50% { transform: rotate(-8deg) } 80%, 100% { transform: translateY(16%) rotate(14deg) scale(.9) } }
@keyframes lgkaleidoKoPaulR { 0% { transform: none } 16% { transform: rotate(20deg) scale(1.04) } 50% { transform: rotate(8deg) } 80%, 100% { transform: translateY(16%) rotate(-14deg) scale(.9) } }
@keyframes lgkaleidoKoToppleL { 0% { transform: none } 16% { transform: translate(6%, 5%) scale(1.02) } 40% { transform: translate(-3%, 0) rotate(-4deg) } 54% { transform: rotate(3deg) } 76% { transform: translate(8%, 16%) rotate(28deg) scale(.6, .7) } 88% { transform: translate(8%, 14%) rotate(24deg) scale(.62, .72) } 100% { transform: translate(8%, 15%) rotate(26deg) scale(.62, .7) } }
@keyframes lgkaleidoKoToppleR { 0% { transform: none } 16% { transform: translate(-6%, 5%) scale(1.02) } 40% { transform: translate(3%, 0) rotate(4deg) } 54% { transform: rotate(-3deg) } 76% { transform: translate(-8%, 16%) rotate(-28deg) scale(.6, .7) } 88% { transform: translate(-8%, 14%) rotate(-24deg) scale(.62, .72) } 100% { transform: translate(-8%, 15%) rotate(-26deg) scale(.62, .7) } }
@keyframes lgkaleidoKoHorn { 0%, 52% { transform: none; opacity: 1 } 58% { transform: translate(-8%, -20%) rotate(-25deg); opacity: 1 } 70% { transform: translate(-4%, 60%) rotate(-80deg); opacity: .8 } 80%, 100% { transform: translate(0, 110%) rotate(-110deg); opacity: 0 } }
@keyframes lgkaleidoKoCrest { 0%, 52% { transform: none } 58% { transform: translate(-4%, -6%) rotate(-16deg) } 76% { transform: translate(-6%, 10%) rotate(-20deg) } 100% { transform: translate(-6%, 8%) rotate(-18deg) } }
@keyframes lgkaleidoKoWingL { 0%, 50% { transform: none } 60% { transform: rotate(8deg) } 78% { transform: translate(8%, 10%) rotate(-128deg) scale(.66) } 90% { transform: translate(8%, 9%) rotate(-118deg) scale(.66) } 100% { transform: translate(8%, 10%) rotate(-122deg) scale(.66) } }
@keyframes lgkaleidoKoWingR { 0%, 50% { transform: none } 60% { transform: rotate(-8deg) } 78% { transform: translate(-8%, 10%) rotate(128deg) scale(.66) } 90% { transform: translate(-8%, 9%) rotate(118deg) scale(.66) } 100% { transform: translate(-8%, 10%) rotate(122deg) scale(.66) } }
@keyframes lgkaleidoKoDimL { 0% { transform: none; opacity: 1 } 16% { transform: translate(5%, 4%) scale(1.02); opacity: 1 } 54% { transform: none; opacity: 1 } 80%, 100% { transform: translateY(6%) scale(.86); opacity: .22 } }
@keyframes lgkaleidoKoDimR { 0% { transform: none; opacity: 1 } 16% { transform: translate(-5%, 4%) scale(1.02); opacity: 1 } 54% { transform: none; opacity: 1 } 80%, 100% { transform: translateY(6%) scale(.86); opacity: .22 } }
@keyframes lgkaleidoKoCrack { 0%, 52% { opacity: 0 } 56%, 100% { opacity: 1 } }
@keyframes lgkaleidoKoAura { 0%, 50% { opacity: 1 } 80%, 100% { opacity: .3 } }
@keyframes lgkaleidoKoSword { 0% { transform: none } 16% { transform: rotate(-16deg) } 50% { transform: rotate(-8deg) } 78%, 100% { transform: rotate(20deg) translateY(10%) } }
@keyframes lgkaleidoKoGauntlet { 0% { transform: none } 16% { transform: rotate(-8deg) } 50% { transform: rotate(-4deg) } 78%, 100% { transform: translateY(10%) rotate(8deg) } }
@keyframes lgkaleidoKoChest { 0%, 45% { transform: none } 80%, 100% { transform: translateY(2.5%) scale(.97, .93) } }
${rule('ko', ['head'], 'lgkaleidoKoHead 2100ms ease-in both')}
${rule('ko', ['bust'], 'lgkaleidoKoBust 2100ms ease-in both')}
${rule('ko', ['pauldl'], 'lgkaleidoKoPaulL 2100ms ease-in both')}
${rule('ko', ['pauldr'], 'lgkaleidoKoPaulR 2100ms ease-in both')}
${rule('ko', ['refl'], 'lgkaleidoKoToppleL 2100ms cubic-bezier(.4,.1,.5,1) both')}
${rule('ko', ['refr'], 'lgkaleidoKoToppleR 2100ms cubic-bezier(.4,.1,.5,1) both')}
${B}[data-phase="3"][data-moment="ko"] .lg-kaleido-refl { animation: lgkaleidoKoDimL 2100ms ease-in both }
${B}[data-phase="3"][data-moment="ko"] .lg-kaleido-refr { animation: lgkaleidoKoDimR 2100ms ease-in both }
${rule('ko', ['arml'], 'lgkaleidoKoSword 2100ms ease-in both')}
${rule('ko', ['armr'], 'lgkaleidoKoGauntlet 2100ms ease-in both')}
${rule('ko', ['chest'], 'lgkaleidoKoChest 2100ms ease-in both')}
${rule('ko', ['hornl'], 'lgkaleidoKoHorn 2100ms cubic-bezier(.4,.1,.6,1) both')}
${rule('ko', ['crest'], 'lgkaleidoKoCrest 2100ms ease-in both')}
${rule('ko', ['wingl'], 'lgkaleidoKoWingL 2100ms ease-in both')}
${rule('ko', ['wingr'], 'lgkaleidoKoWingR 2100ms ease-in both')}
${rule('ko', ['aura'], 'lgkaleidoKoAura 2100ms ease-in both')}
${M('ko')} .lg-kaleido-crack { display: inline !important; animation: lgkaleidoKoCrack 2100ms linear both }
`
// The fallen pose (held by fx/kaleido.jsx after the cinematic). Phase 3's corona halves (refl/refr) dim in place instead
// of toppling (a toppled pane floated beside his helm): FALLEN_P3.
export const FALLEN = { bust: 'translateY(6px) rotate(-3.5deg) scale(.965)', head: 'translateY(.4%) rotate(13deg) scale(.95, .78)', pauldl: 'translateY(16%) rotate(14deg) scale(.9)', pauldr: 'translateY(16%) rotate(-14deg) scale(.9)',
  refl: 'translate(8%, 15%) rotate(26deg) scale(.62, .7)', refr: 'translate(-8%, 15%) rotate(-26deg) scale(.62, .7)', arml: 'rotate(20deg) translateY(10%)', armr: 'translateY(10%) rotate(8deg)', chest: 'translateY(2.5%) scale(.97, .93)',
  hornl: 'translate(0, 110%) rotate(-110deg)', wingl: 'translate(8%, 10%) rotate(-122deg) scale(.66)', wingr: 'translate(-8%, 10%) rotate(122deg) scale(.66)', crest: 'translate(-6%, 8%) rotate(-18deg)' }

export const FALLEN_P3 = { refl: 'translateY(6%) scale(.86)', refr: 'translateY(6%) scale(.86)' }

// HIS OWN DRAWN PARTS
const OWN = `
@keyframes lgkaleidoPaneUp { 0% { transform: translate(-50%, -20%) scale(.6, .1); opacity: 0 } 25% { transform: translate(-50%, -50%) scale(1.05); opacity: 1 } 55% { transform: translate(-50%, -50%) scale(1) rotate(-3deg); opacity: 1 } 70% { opacity: 0 } 100% { transform: translate(-50%, -50%) scale(1.1); opacity: 0 } }
@keyframes lgkaleidoPaneCrack { 0%, 35% { opacity: 0 } 45% { opacity: 1 } 68% { opacity: 1 } 75%, 100% { opacity: 0 } }
@keyframes lgkaleidoSliver { 0% { transform: translate(-50%, -50%) rotate(var(--a)) translateY(0) scale(1); opacity: 1 } 100% { transform: translate(-50%, -50%) rotate(var(--a)) translateY(-26cqw) rotate(200deg) scale(.4); opacity: 0 } }
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
// hair apart (the images out of register), then the true white cut. It lands OUT toward the hearts (p.x %, to his
// right) as his cleave swings through (the part's at), so the cut never washes over the knight himself.
function triSlash(p, ctx) {
  const s = ctx.scale
  const cut = (k, color, dx, dy, delay, w) => (
    <div key={k} style={{ position: 'absolute', left: `${(p.x ?? 50) + dx}%`, top: `${(p.y ?? 70) + dy}%`, width: `${90 * s}cqw`, height: `${w * s}cqw`, '--a': '-32deg', '--x': `${dx * 0.4}cqw`, borderRadius: '50%',
      background: `linear-gradient(90deg, transparent, ${color} 18%, #fff 50%, ${color} 82%, transparent)`, boxShadow: `0 0 2cqw ${color}`, animation: `lgkaleidoTri ${640 * ctx.speed}ms cubic-bezier(.15,1,.3,1) ${delay}ms both` }} />
  )
  return [cut('r', RGB3[0], -6, -4, 0, 5), cut('g', RGB3[1], 0, 0, 50, 5), cut('b', RGB3[2], 6, 4, 100, 5), cut('w', '#ffffff', 0, 0, 200, 6)]
}

// kaleidoPane: his block: a tall mirror pane snaps up in front of his chest (at p.y %), a crack runs across it, it
// shatters into slivers. Kept below the face.
function pane(p, ctx) {
  const s = ctx.scale, y = p.y ?? 74
  const out = [
    <div key="pn" style={{ position: 'absolute', left: '50%', top: `${y}%`, width: `${30 * s}cqw`, height: `${40 * s}cqw`, border: `${0.9 * s}cqw solid #ffd27a`, borderRadius: '45% 45% 4% 4% / 30% 30% 4% 4%',
      background: 'linear-gradient(135deg, rgba(220,236,255,.75), rgba(120,150,220,.35) 45%, rgba(220,236,255,.65) 55%, rgba(80,100,170,.4))', boxShadow: '0 0 2cqw #cfe0ff',
      animation: `lgkaleidoPaneUp ${620 * ctx.speed}ms cubic-bezier(.2,.9,.3,1) both` }} />,
    <div key="ck" style={{ position: 'absolute', left: '50%', top: `${y}%`, width: `${30 * s}cqw`, height: `${40 * s}cqw`, transform: 'translate(-50%, -50%)',
      background: 'linear-gradient(115deg, transparent 44%, #ffffff 46%, transparent 48%), linear-gradient(60deg, transparent 52%, #ffffff 53.5%, transparent 55%)', animation: `lgkaleidoPaneCrack ${620 * ctx.speed}ms ease-out both` }} />,
  ]
  for (let i = 0; i < 8; i++) {
    const a = -150 + i * 17
    out.push(<div key={`sv${i}`} style={{ position: 'absolute', left: '50%', top: `${y}%`, width: `${3 * s}cqw`, height: `${7 * s}cqw`, background: i % 2 ? '#e6f0ff' : '#9fb4e0', clipPath: 'polygon(50% 0, 100% 100%, 0 100%)',
      '--a': `${a}deg`, animation: `lgkaleidoSliver ${560 * ctx.speed}ms cubic-bezier(.2,.8,.4,1) ${300 * ctx.speed}ms both` }} />)
  }
  return out
}

export const css = pivots + hit + crit + sharpen + strike + block + shield + wind + ko + OWN
export default { kaleidoRay: ray, kaleidoTriSlash: triSlash, kaleidoPane: pane }
