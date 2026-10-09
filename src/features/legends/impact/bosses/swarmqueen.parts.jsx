// SWARMQUEEN's own impact parts: drawers merged into impact/parts.jsx PARTS. Name each `swarmqueen<Name>` (never clashes).
// A drawer is (params, ctx) => node, like the shared ones (ctx: color, accent, glyph, scale, speed); CSS keyframes it
// needs go in `css` (prefix them lgswarmqueen). Deterministic, container units, transforms and opacity only.
//
// THE HIVE EMPRESS ACTS OUT EVERY MOMENT with her own drawn parts (raids/swarmqueen.svg hook classes, kept live by the
// bake). Phases 1 and 2: lg-swarmqueen-head, -mandl / -mandr (phase 1's mandibles), -wingl / -wingr, -scythel / -scyther
// (the raised scythe forelimbs), -legl / -legr (phase 1's lower forelimbs), -sac (phase 1's egg sac), -stinger (phase
// 2's curled abdomen). Phase 3 (the hive face): -brow, -eyesl / -eyesr (the eye clusters), -maw, -ring (the ring of
// mandibles round the maw), -puppet (the old body hanging inside). Keyed on the arena's data-moment
// (impact/bosses/README.md). Her attack on the player, her ability reactions and her fallen pose: fx/swarmqueen.jsx.

const B = '.lg-boss[data-motif="swarmqueen"]'
const M = (m) => `${B}[data-moment="${m}"]`
const FB = 'transform-box: fill-box'
const VB = 'transform-box: view-box'
export const pivots = `
${B} .lg-swarmqueen-head { ${FB}; transform-origin: 50% 86% }
${B} .lg-p2 .lg-swarmqueen-head { transform-origin: 55% 90% }
${B} .lg-swarmqueen-mandl { ${VB}; transform-origin: 49.5px 51px }
${B} .lg-swarmqueen-mandr { ${VB}; transform-origin: 70.5px 51px }
${B} .lg-swarmqueen-wingl { ${FB}; transform-origin: 90% 75% }
${B} .lg-swarmqueen-wingr { ${FB}; transform-origin: 10% 75% }
${B} .lg-p2 .lg-swarmqueen-wingl { ${VB}; transform-origin: 54px 54px }
${B} .lg-p2 .lg-swarmqueen-wingr { ${VB}; transform-origin: 66px 52px }
${B} .lg-swarmqueen-scythel { ${FB}; transform-origin: 90% 95% }
${B} .lg-swarmqueen-scyther { ${FB}; transform-origin: 10% 95% }
${B} .lg-p2 .lg-swarmqueen-scythel { transform-origin: 85% 95% }
${B} .lg-p2 .lg-swarmqueen-scyther { transform-origin: 15% 95% }
${B} .lg-swarmqueen-legl { ${FB}; transform-origin: 90% 10% }
${B} .lg-swarmqueen-legr { ${FB}; transform-origin: 10% 10% }
${B} .lg-swarmqueen-sac { ${FB}; transform-origin: 50% 40% }
${B} .lg-swarmqueen-stinger { ${FB}; transform-origin: 50% 5% }
${B} .lg-swarmqueen-brow, ${B} .lg-swarmqueen-eyesl, ${B} .lg-swarmqueen-eyesr, ${B} .lg-swarmqueen-maw, ${B} .lg-swarmqueen-ring { ${FB}; transform-origin: 50% 50% }
${B} .lg-swarmqueen-puppet { ${FB}; transform-origin: 50% 0% }
`
const rule = (m, parts, anim) => `${parts.map((p) => `${M(m)} .lg-swarmqueen-${p}`).join(', ')} { animation: ${anim} }`

// A HIT: her head snaps back and the mandibles clack shut, both wings flick in a twitch; the hive face's eye clusters
// wince and its mandible ring snaps tight.
const hit = `
@keyframes lgswarmqueenHitHead { 0% { transform: translateY(-6%) rotate(7deg) scale(.95) } 35% { transform: translateY(-3%) rotate(4deg) } 70% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgswarmqueenHitMandL { 0% { transform: rotate(16deg) } 40% { transform: rotate(10deg) } 100% { transform: none } }
@keyframes lgswarmqueenHitMandR { 0% { transform: rotate(-16deg) } 40% { transform: rotate(-10deg) } 100% { transform: none } }
@keyframes lgswarmqueenTwitchL { 0% { transform: rotate(-10deg) } 20% { transform: rotate(6deg) } 40% { transform: rotate(-4deg) } 60% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgswarmqueenTwitchR { 0% { transform: rotate(10deg) } 20% { transform: rotate(-6deg) } 40% { transform: rotate(4deg) } 60% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgswarmqueenWince { 0% { transform: scale(.82, .7) } 45% { transform: scale(.9, .85) } 100% { transform: none } }
@keyframes lgswarmqueenSnap { 0% { transform: scale(.82) } 40% { transform: scale(.9) rotate(-6deg) } 100% { transform: none } }
${rule('hit', ['head'], 'lgswarmqueenHitHead 460ms cubic-bezier(.2,.9,.3,1) both')}
${rule('hit', ['mandl'], 'lgswarmqueenHitMandL 420ms ease-out both')}
${rule('hit', ['mandr'], 'lgswarmqueenHitMandR 420ms ease-out both')}
${rule('hit', ['wingl'], 'lgswarmqueenTwitchL 440ms linear both')}
${rule('hit', ['wingr'], 'lgswarmqueenTwitchR 440ms linear both')}
${rule('hit', ['eyesl', 'eyesr'], 'lgswarmqueenWince 460ms ease-out both')}
${rule('hit', ['ring'], 'lgswarmqueenSnap 460ms ease-out both')}
`
// A CRITICAL: her head is knocked sideways, both wings crumple, the scythes splay out of control; the hive face's whole
// brow caves in and the eye clusters squeeze shut.
const crit = `
@keyframes lgswarmqueenCritHead { 0% { transform: translate(10%, -4%) rotate(20deg) scale(.92) } 25% { transform: translate(12%, -3%) rotate(23deg) scale(.92) } 55% { transform: translate(-4%, 1%) rotate(-7deg) } 80% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgswarmqueenCrumpleL { 0% { transform: rotate(-24deg) scale(.82) } 40% { transform: rotate(-18deg) scale(.88) } 70% { transform: rotate(6deg) } 100% { transform: none } }
@keyframes lgswarmqueenCrumpleR { 0% { transform: rotate(24deg) scale(.82) } 40% { transform: rotate(18deg) scale(.88) } 70% { transform: rotate(-6deg) } 100% { transform: none } }
@keyframes lgswarmqueenSplayL { 0% { transform: rotate(-26deg) } 35% { transform: rotate(-20deg) } 65% { transform: rotate(8deg) } 100% { transform: none } }
@keyframes lgswarmqueenSplayR { 0% { transform: rotate(26deg) } 35% { transform: rotate(20deg) } 65% { transform: rotate(-8deg) } 100% { transform: none } }
@keyframes lgswarmqueenCave { 0% { transform: translateY(12%) scale(1.06, .8) } 40% { transform: translateY(8%) scale(1.04, .86) } 100% { transform: none } }
@keyframes lgswarmqueenSqueeze { 0% { transform: scale(.7, .45) } 45% { transform: scale(.8, .6) } 75% { transform: scale(1.08) } 100% { transform: none } }
${rule('crit', ['head'], 'lgswarmqueenCritHead 720ms cubic-bezier(.15,.85,.3,1) both')}
${rule('crit', ['wingl'], 'lgswarmqueenCrumpleL 700ms ease-out both')}
${rule('crit', ['wingr'], 'lgswarmqueenCrumpleR 700ms ease-out both')}
${rule('crit', ['scythel', 'legl'], 'lgswarmqueenSplayL 700ms ease-out both')}
${rule('crit', ['scyther', 'legr'], 'lgswarmqueenSplayR 700ms ease-out both')}
${rule('crit', ['brow'], 'lgswarmqueenCave 700ms ease-out both')}
${rule('crit', ['eyesl', 'eyesr', 'puppet'], 'lgswarmqueenSqueeze 700ms ease-out both')}
`
// A SHARPENED strike clips a wing: the left wing drops and shivers, the scythes cross up in front of her face to guard,
// she hisses with the mandibles flared; on the hive face the brow splits and the maw recoils.
const sharpen = `
@keyframes lgswarmqueenClipped { 0% { transform: rotate(-30deg) } 15% { transform: rotate(-24deg) } 25% { transform: rotate(-30deg) } 35% { transform: rotate(-25deg) } 45% { transform: rotate(-29deg) } 75% { transform: rotate(-10deg) } 100% { transform: none } }
@keyframes lgswarmqueenGuardL { 0% { transform: none } 25% { transform: rotate(28deg) } 60% { transform: rotate(24deg) } 100% { transform: none } }
@keyframes lgswarmqueenGuardR { 0% { transform: none } 25% { transform: rotate(-28deg) } 60% { transform: rotate(-24deg) } 100% { transform: none } }
@keyframes lgswarmqueenHissL { 0% { transform: rotate(-22deg) } 60% { transform: rotate(-18deg) } 100% { transform: none } }
@keyframes lgswarmqueenHissR { 0% { transform: rotate(22deg) } 60% { transform: rotate(18deg) } 100% { transform: none } }
@keyframes lgswarmqueenSplit { 0% { transform: rotate(-7deg) translateY(6%) } 30% { transform: rotate(6deg) translateY(3%) } 60% { transform: rotate(-3deg) } 100% { transform: none } }
@keyframes lgswarmqueenRecoil { 0% { transform: scale(.75) } 50% { transform: scale(.85) } 100% { transform: none } }
${rule('sharpen', ['wingl'], 'lgswarmqueenClipped 640ms linear both')}
${rule('sharpen', ['scythel'], 'lgswarmqueenGuardL 620ms cubic-bezier(.2,.9,.3,1) both')}
${rule('sharpen', ['scyther'], 'lgswarmqueenGuardR 620ms cubic-bezier(.2,.9,.3,1) both')}
${rule('sharpen', ['mandl'], 'lgswarmqueenHissL 560ms ease-out both')}
${rule('sharpen', ['mandr'], 'lgswarmqueenHissR 560ms ease-out both')}
${rule('sharpen', ['brow'], 'lgswarmqueenSplit 600ms ease-out both')}
${rule('sharpen', ['maw', 'ring'], 'lgswarmqueenRecoil 600ms ease-out both')}
`
// HER STRIKE (a plain miss; the swarm she sends at the player is fx/swarmqueen.jsx's data-assault-on): the lower
// forelimbs and the egg sac / abdomen heave as the brood launches, the hive's eye clusters flare wide.
const strike = `
@keyframes lgswarmqueenStrikeLegL { 0% { transform: none } 25% { transform: rotate(-24deg) } 55% { transform: rotate(-16deg) } 100% { transform: none } }
@keyframes lgswarmqueenStrikeLegR { 0% { transform: none } 25% { transform: rotate(24deg) } 55% { transform: rotate(16deg) } 100% { transform: none } }
@keyframes lgswarmqueenBrood { 0% { transform: scale(.94) } 18% { transform: scale(1.1, 1.14) } 32% { transform: scale(.96) } 46% { transform: scale(1.06) } 100% { transform: none } }
@keyframes lgswarmqueenGlare { 0% { transform: none } 20% { transform: scale(1.18) } 60% { transform: scale(1.12) } 100% { transform: none } }
${rule('hurt', ['legl'], 'lgswarmqueenStrikeLegL 700ms ease-out both')}
${rule('hurt', ['legr'], 'lgswarmqueenStrikeLegR 700ms ease-out both')}
${rule('hurt', ['sac'], 'lgswarmqueenBrood 760ms ease-out both')}
${rule('hurt', ['eyesl', 'eyesr', 'brow'], 'lgswarmqueenGlare 760ms ease-out both')}
`
// HER HEAVY BLOW (a missed attack): the whole hive rises behind her: wings blur at full span, the egg sac swells and
// bursts out the brood, the lower forelimbs stamp twice; the hive face's brow lifts and the eye clusters bulge.
const heavy = `
@keyframes lgswarmqueenBlurL { 0% { transform: rotate(14deg) } 10% { transform: rotate(4deg) } 20% { transform: rotate(16deg) } 30% { transform: rotate(4deg) } 40% { transform: rotate(16deg) } 50% { transform: rotate(5deg) } 60% { transform: rotate(14deg) } 80% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgswarmqueenBlurR { 0% { transform: rotate(-14deg) } 10% { transform: rotate(-4deg) } 20% { transform: rotate(-16deg) } 30% { transform: rotate(-4deg) } 40% { transform: rotate(-16deg) } 50% { transform: rotate(-5deg) } 60% { transform: rotate(-14deg) } 80% { transform: rotate(-3deg) } 100% { transform: none } }
@keyframes lgswarmqueenBurst { 0% { transform: scale(1.05) } 20% { transform: scale(1.22, 1.3) } 30% { transform: scale(.9, .85) } 45% { transform: scale(1.1) } 100% { transform: none } }
@keyframes lgswarmqueenStampL { 0% { transform: none } 15% { transform: rotate(-28deg) } 28% { transform: rotate(6deg) } 45% { transform: rotate(-22deg) } 58% { transform: rotate(5deg) } 100% { transform: none } }
@keyframes lgswarmqueenStampR { 0% { transform: none } 15% { transform: rotate(28deg) } 28% { transform: rotate(-6deg) } 45% { transform: rotate(22deg) } 58% { transform: rotate(-5deg) } 100% { transform: none } }
@keyframes lgswarmqueenLift { 0% { transform: none } 20% { transform: translateY(-14%) } 50% { transform: translateY(-10%) } 100% { transform: none } }
@keyframes lgswarmqueenBulge { 0% { transform: none } 20% { transform: scale(1.3) } 35% { transform: scale(1.15) } 50% { transform: scale(1.26) } 100% { transform: none } }
${rule('hurtBig', ['wingl'], 'lgswarmqueenBlurL 1000ms linear both')}
${rule('hurtBig', ['wingr'], 'lgswarmqueenBlurR 1000ms linear both')}
${rule('hurtBig', ['sac'], 'lgswarmqueenBurst 1000ms ease-out both')}
${rule('hurtBig', ['legl'], 'lgswarmqueenStampL 1000ms ease-out both')}
${rule('hurtBig', ['legr'], 'lgswarmqueenStampR 1000ms ease-out both')}
${rule('hurtBig', ['brow'], 'lgswarmqueenLift 1000ms ease-out both')}
${rule('hurtBig', ['eyesl', 'eyesr'], 'lgswarmqueenBulge 1000ms ease-out both')}
`
// A BLOCK (her attack was parried): the scythes are knocked back over her shoulders, her head ducks behind them, the
// mandibles snap; the hive face's ring of mandibles clamps shut on nothing.
const block = `
@keyframes lgswarmqueenKnockL { 0% { transform: rotate(-22deg) } 40% { transform: rotate(-16deg) } 70% { transform: rotate(4deg) } 100% { transform: none } }
@keyframes lgswarmqueenKnockR { 0% { transform: rotate(22deg) } 40% { transform: rotate(16deg) } 70% { transform: rotate(-4deg) } 100% { transform: none } }
@keyframes lgswarmqueenDuck { 0% { transform: translateY(9%) scale(.92) } 50% { transform: translateY(6%) scale(.95) } 100% { transform: none } }
@keyframes lgswarmqueenClampL { 0% { transform: rotate(14deg) } 20% { transform: rotate(-10deg) } 40% { transform: rotate(12deg) } 100% { transform: none } }
@keyframes lgswarmqueenClampR { 0% { transform: rotate(-14deg) } 20% { transform: rotate(10deg) } 40% { transform: rotate(-12deg) } 100% { transform: none } }
@keyframes lgswarmqueenClamp { 0% { transform: scale(.68) } 30% { transform: scale(.74) rotate(10deg) } 60% { transform: scale(.9) } 100% { transform: none } }
${rule('block', ['scythel'], 'lgswarmqueenKnockL 620ms ease-out both')}
${rule('block', ['scyther'], 'lgswarmqueenKnockR 620ms ease-out both')}
${rule('block', ['head', 'puppet'], 'lgswarmqueenDuck 600ms ease-out both')}
${rule('block', ['mandl'], 'lgswarmqueenClampL 560ms ease-out both')}
${rule('block', ['mandr'], 'lgswarmqueenClampR 560ms ease-out both')}
${rule('block', ['ring', 'maw'], 'lgswarmqueenClamp 620ms ease-out both')}
`
// A SHIELD SAVE: her blow glances off the dome: one scythe skids off and swings wide, she flares her wings and turns her
// head after it; the hive face's brow tilts as the swarm bounces back.
const shield = `
@keyframes lgswarmqueenSkid { 0% { transform: none } 15% { transform: rotate(-30deg) } 45% { transform: rotate(-38deg) } 75% { transform: rotate(6deg) } 100% { transform: none } }
@keyframes lgswarmqueenFlareL { 0% { transform: none } 25% { transform: rotate(18deg) } 65% { transform: rotate(14deg) } 100% { transform: none } }
@keyframes lgswarmqueenFlareR { 0% { transform: none } 25% { transform: rotate(-18deg) } 65% { transform: rotate(-14deg) } 100% { transform: none } }
@keyframes lgswarmqueenLook { 0% { transform: none } 25% { transform: rotate(-12deg) translateX(-4%) } 65% { transform: rotate(-9deg) translateX(-3%) } 100% { transform: none } }
@keyframes lgswarmqueenTilt { 0% { transform: none } 25% { transform: rotate(-8deg) } 65% { transform: rotate(-5deg) } 100% { transform: none } }
${rule('shield', ['scyther'], 'lgswarmqueenSkid 740ms ease-out both')}
${rule('shield', ['wingl'], 'lgswarmqueenFlareL 740ms ease-out both')}
${rule('shield', ['wingr'], 'lgswarmqueenFlareR 740ms ease-out both')}
${rule('shield', ['head'], 'lgswarmqueenLook 740ms ease-out both')}
${rule('shield', ['brow', 'ring'], 'lgswarmqueenTilt 740ms ease-out both')}
`
// SECOND WIND: the player heals and she shrieks: the mandibles chatter, the wings tremble, the head cocks; the hive
// face's eye clusters blink in turn and the maw chatters.
const wind = `
@keyframes lgswarmqueenChatterL { 0%, 100% { transform: none } 10%, 30%, 50%, 70% { transform: rotate(-18deg) } 20%, 40%, 60%, 80% { transform: rotate(6deg) } }
@keyframes lgswarmqueenChatterR { 0%, 100% { transform: none } 10%, 30%, 50%, 70% { transform: rotate(18deg) } 20%, 40%, 60%, 80% { transform: rotate(-6deg) } }
@keyframes lgswarmqueenTremble { 0%, 100% { transform: none } 10%, 30%, 50%, 70% { transform: rotate(3deg) } 20%, 40%, 60%, 80% { transform: rotate(-3deg) } }
@keyframes lgswarmqueenCock { 0%, 100% { transform: none } 30%, 70% { transform: rotate(-14deg) } }
@keyframes lgswarmqueenBlinkL { 0%, 100% { transform: none } 15%, 25% { transform: scaleY(.15) } 35% { transform: none } }
@keyframes lgswarmqueenBlinkR { 0%, 100% { transform: none } 45%, 55% { transform: scaleY(.15) } 65% { transform: none } }
@keyframes lgswarmqueenMawChatter { 0%, 100% { transform: none } 10%, 30%, 50%, 70% { transform: scale(.85) } 20%, 40%, 60%, 80% { transform: scale(1.05) } }
${rule('wind', ['mandl'], 'lgswarmqueenChatterL 900ms linear both')}
${rule('wind', ['mandr'], 'lgswarmqueenChatterR 900ms linear both')}
${rule('wind', ['wingl', 'wingr'], 'lgswarmqueenTremble 900ms linear both')}
${rule('wind', ['head'], 'lgswarmqueenCock 900ms ease-in-out both')}
${rule('wind', ['eyesl'], 'lgswarmqueenBlinkL 900ms linear both')}
${rule('wind', ['eyesr'], 'lgswarmqueenBlinkR 900ms linear both')}
${rule('wind', ['ring'], 'lgswarmqueenMawChatter 900ms linear both')}
`
// HER KNOCKOUT (the whole cinematic): a last shriek with everything flared, then she dies like an insect: the legs and
// scythes curl in under her, the wings droop and fold, the head sags, the egg sac sinks; the hive face's ring goes
// slack, the eye clusters dim small and the puppet drops on its strings. fx/swarmqueen.jsx holds the fallen pose.
const ko = `
@keyframes lgswarmqueenKoCurlL { 0% { transform: none } 18% { transform: rotate(-20deg) } 45% { transform: rotate(-12deg) } 70% { transform: rotate(38deg) } 82% { transform: rotate(34deg) } 100% { transform: rotate(36deg) } }
@keyframes lgswarmqueenKoCurlR { 0% { transform: none } 18% { transform: rotate(20deg) } 45% { transform: rotate(12deg) } 70% { transform: rotate(-38deg) } 82% { transform: rotate(-34deg) } 100% { transform: rotate(-36deg) } }
@keyframes lgswarmqueenKoWingL { 0% { transform: none } 18% { transform: rotate(18deg) } 50% { transform: rotate(4deg) } 75% { transform: rotate(-32deg) scale(.9) } 100% { transform: rotate(-30deg) scale(.9) } }
@keyframes lgswarmqueenKoWingR { 0% { transform: none } 18% { transform: rotate(-18deg) } 50% { transform: rotate(-4deg) } 75% { transform: rotate(32deg) scale(.9) } 100% { transform: rotate(30deg) scale(.9) } }
@keyframes lgswarmqueenKoHead { 0% { transform: none } 18% { transform: translateY(-8%) rotate(-8deg) scale(1.06) } 45% { transform: translateY(-6%) rotate(-6deg) scale(1.05) } 72% { transform: translateY(16%) rotate(14deg) scale(.92) } 86% { transform: translateY(13%) rotate(12deg) scale(.92) } 100% { transform: translateY(15%) rotate(13deg) scale(.92) } }
@keyframes lgswarmqueenKoMandL { 0% { transform: none } 18% { transform: rotate(-24deg) } 50% { transform: rotate(-20deg) } 80%, 100% { transform: rotate(10deg) } }
@keyframes lgswarmqueenKoMandR { 0% { transform: none } 18% { transform: rotate(24deg) } 50% { transform: rotate(20deg) } 80%, 100% { transform: rotate(-10deg) } }
@keyframes lgswarmqueenKoSink { 0%, 45% { transform: none } 80%, 100% { transform: translateY(10%) scale(.94, .8) } }
@keyframes lgswarmqueenKoSlack { 0% { transform: none } 18% { transform: scale(1.18) } 50% { transform: scale(1.1) } 80%, 100% { transform: scale(.82) rotate(8deg) } }
@keyframes lgswarmqueenKoDim { 0% { transform: none } 18% { transform: scale(1.15) } 55% { transform: scale(1) } 85%, 100% { transform: scale(.7, .4) } }
@keyframes lgswarmqueenKoDrop { 0%, 50% { transform: none } 70% { transform: translateY(20%) rotate(12deg) } 82% { transform: translateY(16%) rotate(8deg) } 100% { transform: translateY(18%) rotate(10deg) } }
${rule('ko', ['scythel', 'legl'], 'lgswarmqueenKoCurlL 2200ms cubic-bezier(.4,.1,.5,1) both')}
${rule('ko', ['scyther', 'legr'], 'lgswarmqueenKoCurlR 2200ms cubic-bezier(.4,.1,.5,1) both')}
${rule('ko', ['wingl'], 'lgswarmqueenKoWingL 2200ms cubic-bezier(.4,.1,.5,1) both')}
${rule('ko', ['wingr'], 'lgswarmqueenKoWingR 2200ms cubic-bezier(.4,.1,.5,1) both')}
${rule('ko', ['head'], 'lgswarmqueenKoHead 2200ms cubic-bezier(.3,.6,.4,1) both')}
${rule('ko', ['mandl'], 'lgswarmqueenKoMandL 2200ms ease-out both')}
${rule('ko', ['mandr'], 'lgswarmqueenKoMandR 2200ms ease-out both')}
${rule('ko', ['sac', 'stinger', 'brow'], 'lgswarmqueenKoSink 2200ms ease-in both')}
${rule('ko', ['ring', 'maw'], 'lgswarmqueenKoSlack 2200ms ease-in-out both')}
${rule('ko', ['eyesl', 'eyesr'], 'lgswarmqueenKoDim 2200ms ease-in both')}
${rule('ko', ['puppet'], 'lgswarmqueenKoDrop 2200ms ease-in both')}
`
// The fallen pose (held by fx/swarmqueen.jsx after the cinematic).
export const FALLEN = { scythel: 'rotate(36deg)', legl: 'rotate(36deg)', scyther: 'rotate(-36deg)', legr: 'rotate(-36deg)', wingl: 'rotate(-30deg) scale(.9)', wingr: 'rotate(30deg) scale(.9)',
  head: 'translateY(15%) rotate(13deg) scale(.92)', mandl: 'rotate(10deg)', mandr: 'rotate(-10deg)', sac: 'translateY(10%) scale(.94, .8)', stinger: 'translateY(10%) scale(.94, .8)', brow: 'translateY(10%) scale(.94, .8)',
  ring: 'scale(.82) rotate(8deg)', maw: 'scale(.82) rotate(8deg)', eyesl: 'scale(.7, .4)', eyesr: 'scale(.7, .4)', puppet: 'translateY(18%) rotate(10deg)' }

// HER OWN DRAWN PARTS
// One soldier wasp, drawn head first along +x (striped abdomen, black stinger, two glass wings that flutter).
const WASP_CSS = `
@keyframes lgswarmqueenFlutter { 0%, 100% { transform: scaleY(1) } 50% { transform: scaleY(.35) } }
@keyframes lgswarmqueenCharge { 0% { transform: translate(0, 0) rotate(var(--r)) scale(.75); opacity: 0 } 5% { opacity: 1 } 45% { transform: translate(calc(var(--x) * .5 + var(--w)), calc(var(--y) * .5 - var(--w))) rotate(var(--r)) scale(calc(var(--s) * .55)) } 85% { opacity: 1 } 100% { transform: translate(var(--x), var(--y)) rotate(var(--r)) scale(var(--s)); opacity: 0 } }
@keyframes lgswarmqueenStab { 0% { transform: translate(-50%, -50%) rotate(var(--r)) scale(.15); opacity: 0 } 18% { transform: translate(-50%, -50%) rotate(var(--r)) scale(.5); opacity: 1 } 30% { transform: translate(-50%, -50%) rotate(var(--r)) scale(2.2); opacity: 1 } 44% { transform: translate(-50%, -50%) rotate(var(--r)) scale(1.9); opacity: 1 } 70% { transform: translate(-50%, -50%) rotate(var(--r)) scale(.6); opacity: .8 } 100% { transform: translate(-50%, -50%) rotate(var(--r)) scale(.2); opacity: 0 } }
@keyframes lgswarmqueenRebound { 0% { transform: translate(0, 0) rotate(var(--r)) scale(.4); opacity: 0 } 8% { opacity: 1 } 40% { transform: translate(var(--x), var(--y)) rotate(var(--r)) scale(1) } 52% { transform: translate(calc(var(--x) * .8), calc(var(--y) * .8)) rotate(calc(var(--r) + 180deg)) scale(1) } 100% { transform: translate(calc(var(--x) * .55), calc(var(--y) * .4 + 34cqw)) rotate(calc(var(--r) + 720deg)) scale(.8); opacity: 0 } }
@keyframes lgswarmqueenChip { 0% { transform: translate(0, 0) rotate(0) scale(.5); opacity: 0 } 8% { opacity: 1 } 60% { transform: translate(var(--x), var(--y)) rotate(var(--r)) scale(1); opacity: 1 } 100% { transform: translate(var(--x), calc(var(--y) + 20cqw)) rotate(calc(var(--r) * 1.5)) scale(.9); opacity: 0 } }
@keyframes lgswarmqueenHoney { 0% { transform: translate(-50%, 0) scaleY(0); opacity: 1 } 35% { transform: translate(-50%, 0) scaleY(1); opacity: 1 } 100% { transform: translate(-50%, 18cqw) scaleY(1.3); opacity: 0 } }
`
const wasp = (k) => (
  <svg key={k} viewBox="-12 -8 24 16" width="100%" height="100%" style={{ overflow: 'visible', display: 'block' }} aria-hidden="true">
    <g style={{ transformBox: 'fill-box', transformOrigin: '50% 100%', animation: 'lgswarmqueenFlutter 60ms linear infinite' }}>
      <ellipse cx="0" cy="-4.2" rx="5" ry="3.4" fill="#e8f4ff" fillOpacity=".75" stroke="#2a1800" strokeWidth=".6" />
    </g>
    <path d="M-11.5 0 L-8 -1 L-8 1 Z" fill="#120a04" />
    <ellipse cx="-3.5" cy="0" rx="5" ry="3.3" fill="#ffc21a" stroke="#2a1800" strokeWidth=".9" />
    <path d="M-6.5 -3 V3 M-3.5 -3.3 V3.3 M-.5 -3 V3" stroke="#2a1800" strokeWidth="1.4" />
    <circle cx="3.2" cy="0" r="2.6" fill="#2a1800" />
    <circle cx="6.8" cy="0" r="2.8" fill="#2a1800" />
    <circle cx="7.6" cy="-1" r="1.1" fill="#ff3b2a" />
  </svg>
)
// swarmqueenCharge: her soldiers pour out of her maw and fly AT the player, swelling as they come at the screen, curving
// toward the hearts on the right.
function charge(p, ctx) {
  const s = ctx.scale
  const n = p.n || 10
  return Array.from({ length: n }, (_, i) => {
    const fan = (i / (n - 1) - 0.5) * 2 // -1..1
    const x = (34 + fan * 30 + (i % 3) * 8) * s
    const y = (fan * 46 + ((i * 7) % 5) * 4 - 6) * s
    const r = Math.atan2(y, x) * (180 / Math.PI)
    const size = 22 + (i % 3) * 5
    return <div key={`w${i}`} style={{ position: 'absolute', left: `${p.x ?? 50}%`, top: `${p.y ?? 44}%`, width: `${size}cqw`, height: `${size * 0.66}cqw`, margin: `${-size / 3}cqw 0 0 ${-size / 2}cqw`,
      '--x': `${x}cqw`, '--y': `${y}cqw`, '--r': `${r}deg`, '--s': 1.8 + (i % 4) * 0.35, '--w': `${(i % 2 ? 1 : -1) * 6}cqw`, filter: 'drop-shadow(0 0.6cqw 0 #0008)',
      animation: `lgswarmqueenCharge ${(560 + (i % 4) * 60) * ctx.speed}ms cubic-bezier(.3,.3,.6,1) ${i * 18}ms both` }}>{wasp(i)}</div>
  })
}
// swarmqueenStab: her heavy blow: the stinger itself drives out of the picture at the player, venom bead on its point.
function stab(p, ctx) {
  const s = ctx.scale
  return (
    <div key="st" style={{ position: 'absolute', left: '56%', top: '62%', width: `${46 * s}cqw`, height: `${16 * s}cqw`, '--r': `${p.angle ?? -18}deg`, filter: 'drop-shadow(0 0 1.5cqw #ffb21a) drop-shadow(0 1cqw 0 #000a)',
      animation: `lgswarmqueenStab ${900 * ctx.speed}ms cubic-bezier(.3,.9,.4,1) both` }}>
      <svg viewBox="0 0 46 16" width="100%" height="100%" style={{ overflow: 'visible', display: 'block' }} aria-hidden="true">
        <path d="M0 0 C10 -1 20 2 28 5 L46 8 L28 11 C20 14 10 17 0 16 Z" fill="#1a0e04" stroke="#000" strokeWidth=".8" />
        <path d="M3 .5 C5 5 5 11 3 15.5 L9 15.8 C11 11 11 5 9 .2 Z M15 1.3 C17 5 17 11 15 14.7 L20 13.8 C21.5 10 21.5 6 20 2.4 Z" fill="#ffc21a" />
        <path d="M28 5 L46 8 L28 11 C30 9 30 7 28 5 Z" fill="#d8d0c0" />
        <path d="M30 7 L46 8 L30 8.4 Z" fill="#fff" />
        <circle cx="46" cy="8" r="2.2" fill="#9dff3a" stroke="#2a4a00" strokeWidth=".6" />
      </svg>
    </div>
  )
}
// swarmqueenLegion: the heavy blow's wave: soldiers from both flanks of the comb converge on the player at once.
function legion(p, ctx) {
  const s = ctx.scale
  return Array.from({ length: 16 }, (_, i) => {
    const side = i % 2 ? 1 : -1
    const x0 = side < 0 ? 8 : 92
    const x = (side < 0 ? 70 : 20) * s
    const y = ((i % 4) * 9 - 14) * s
    const r = Math.atan2(y, x) * (180 / Math.PI)
    return <div key={`l${i}`} style={{ position: 'absolute', left: `${x0}%`, top: `${24 + (i % 5) * 12}%`, width: '22cqw', height: '14.7cqw', margin: '-7.3cqw 0 0 -11cqw',
      '--x': `${x}cqw`, '--y': `${y}cqw`, '--r': `${r}deg`, '--s': 1.5 + (i % 3) * 0.3, '--w': `${side * 4}cqw`,
      animation: `lgswarmqueenCharge ${(700 + (i % 3) * 80) * ctx.speed}ms cubic-bezier(.5,0,.8,.6) ${80 + i * 28}ms both` }}>{wasp(`l${i}`)}</div>
  })
}
// swarmqueenRebound: wasps that fly out and bounce off a guard, tumbling down stunned (a block; `dome`: off the Shield).
function rebound(p, ctx) {
  const s = ctx.scale
  const n = p.n || 7
  return Array.from({ length: n }, (_, i) => {
    const a = ((p.dome ? -60 : -30) + (i / (n - 1)) * (p.dome ? 120 : 60)) * (Math.PI / 180)
    const d = (p.dome ? 46 : 40) * s
    return <div key={`r${i}`} style={{ position: 'absolute', left: '50%', top: '44%', width: '22cqw', height: '14.7cqw', margin: '-7.3cqw 0 0 -11cqw', '--x': `${Math.cos(a) * d}cqw`, '--y': `${Math.sin(a) * d}cqw`, '--r': `${(a * 180) / Math.PI}deg`,
      animation: `lgswarmqueenRebound ${(820 + (i % 3) * 60) * ctx.speed}ms cubic-bezier(.3,.6,.5,1) ${i * 30}ms both` }}>{wasp(`r${i}`)}</div>
  })
}
// swarmqueenSplinter: a hit cracks her carapace: black and amber chitin splinters fly and honey bleeds out of the crack.
function splinter(p, ctx) {
  const s = ctx.scale
  const n = p.n || 8
  return [
    ...[-1, 0, 1].map((d) => (
      <div key={`h${d}`} style={{ position: 'absolute', left: `${50 + d * 7}%`, top: '50%', width: `${(5 + (d === 0 ? 3 : 0)) * s}cqw`, height: `${(22 + (d === 0 ? 10 : 0)) * s}cqw`, transformOrigin: '50% 0', borderRadius: '0 0 50% 50%',
        background: 'linear-gradient(180deg, #ffe08a, #ffb21a 60%, #c26a00)', boxShadow: '0 0 1.2cqw #ffb21a', animation: `lgswarmqueenHoney ${(700 + Math.abs(d) * 80) * ctx.speed}ms ease-in ${60 + Math.abs(d) * 50}ms both` }} />
    )),
    ...Array.from({ length: n }, (_, i) => {
      const a = (-170 + (i / (n - 1)) * 160) * (Math.PI / 180)
      const d = (30 + (i % 3) * 10) * s
      return <div key={`c${i}`} style={{ position: 'absolute', left: '50%', top: '48%', width: `${(8 + (i % 3) * 3) * s}cqw`, height: `${(4 + (i % 2) * 2) * s}cqw`, clipPath: 'polygon(0 0, 100% 30%, 70% 100%, 10% 80%)',
        background: i % 2 ? 'linear-gradient(90deg, #1a0e04, #3a2410)' : 'linear-gradient(90deg, #ffc21a, #c26a00)', '--x': `${Math.cos(a) * d}cqw`, '--y': `${Math.sin(a) * d}cqw`, '--r': `${(i % 2 ? 1 : -1) * (200 + i * 30)}deg`,
        animation: `lgswarmqueenChip ${(600 + (i % 3) * 60) * ctx.speed}ms cubic-bezier(.2,.8,.4,1) ${i * 14}ms both` }} />
    }),
  ]
}

export const css = pivots + hit + crit + sharpen + strike + heavy + block + shield + wind + ko + WASP_CSS
export default { swarmqueenCharge: charge, swarmqueenStab: stab, swarmqueenLegion: legion, swarmqueenRebound: rebound, swarmqueenSplinter: splinter }
