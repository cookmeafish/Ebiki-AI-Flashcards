// INFERNO's own impact parts: drawers merged into impact/parts.jsx PARTS. Name each `inferno<Name>` (never clashes).
// A drawer is (params, ctx) => node, like the shared ones (ctx: color, accent, glyph, scale, speed); CSS keyframes it
// needs go in `css` (prefix them lginferno). Deterministic, container units, transforms and opacity only.
//
// THE CINDER SOVEREIGN ACTS OUT EVERY MOMENT with its own drawn parts (raids/inferno.svg hook classes, kept live by the
// bake): lg-inferno-head (pivot on the neck), lg-inferno-jaw (each phase's lower jaw, hinged at the top),
// lg-inferno-flameskull (phase 3's skull of flame), lg-inferno-wingl / -wingr (pivot at the shoulder), lg-inferno-arml /
// -armr (the claws on the throne), lg-inferno-kindle (the fire on the sword points), lg-inferno-throne, lg-inferno-body,
// lg-inferno-river. Keyed on the arena's data-moment (impact/bosses/README.md). Its attack on the player
// (data-assault-on), its ability reactions and its fallen pose live in fx/inferno.jsx (always injected).

const B = '.lg-boss[data-motif="inferno"]'
const M = (m) => `${B}[data-moment="${m}"]`
export const pivots = `
${B} .lg-inferno-head { transform-box: fill-box; transform-origin: 50% 88% }
${B} .lg-inferno-jaw { transform-box: fill-box; transform-origin: 50% 4% }
${B} .lg-inferno-flameskull { transform-box: fill-box; transform-origin: 50% 100% }
${B} .lg-inferno-wingl { transform-box: fill-box; transform-origin: 96% 82% }
${B} .lg-inferno-wingr { transform-box: fill-box; transform-origin: 4% 82% }
${B} .lg-inferno-arml { transform-box: fill-box; transform-origin: 82% 18% }
${B} .lg-inferno-armr { transform-box: fill-box; transform-origin: 18% 18% }
${B} .lg-inferno-kindle, ${B} .lg-inferno-throne, ${B} .lg-inferno-body, ${B} .lg-inferno-river { transform-box: fill-box; transform-origin: 50% 100% }
`

// A HIT: the blow snaps the crowned head back and up, the jaw clamps on its teeth, the wings jerk in and shudder.
const hit = `
@keyframes lginfernoHitHead { 0% { transform: translate(-6%, -9%) rotate(-11deg) } 30% { transform: translate(-3%, -4%) rotate(-6deg) } 60% { transform: translate(1%, 1%) rotate(2deg) } 100% { transform: none } }
@keyframes lginfernoHitJaw { 0% { transform: scaleY(.8) } 40% { transform: scaleY(.88) } 100% { transform: none } }
@keyframes lginfernoHitWingL { 0% { transform: rotate(-9deg) } 35% { transform: rotate(4deg) } 65% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lginfernoHitWingR { 0% { transform: rotate(9deg) } 35% { transform: rotate(-4deg) } 65% { transform: rotate(2deg) } 100% { transform: none } }
${M('hit')} .lg-inferno-head { animation: lginfernoHitHead 460ms cubic-bezier(.2,.9,.3,1) both }
${M('hit')} .lg-inferno-jaw { animation: lginfernoHitJaw 420ms ease-out both }
${M('hit')} .lg-inferno-wingl { animation: lginfernoHitWingL 520ms ease-out both }
${M('hit')} .lg-inferno-wingr { animation: lginfernoHitWingR 520ms ease-out both }
`
// A CRITICAL: the head is whipped round sideways, the jaw knocked open, both wings fling out of time, the fire on the
// swords is knocked flat and springs back.
const crit = `
@keyframes lginfernoCritHead { 0% { transform: translate(-14%, -6%) rotate(-24deg) scale(.94) } 22% { transform: translate(-16%, -4%) rotate(-27deg) scale(.94) } 48% { transform: translate(5%, 2%) rotate(9deg) } 70% { transform: translate(-2%, 0) rotate(-4deg) } 100% { transform: none } }
@keyframes lginfernoCritJaw { 0% { transform: scaleY(1.45) rotate(-6deg) } 30% { transform: scaleY(1.4) rotate(-6deg) } 55% { transform: scaleY(.8) } 75% { transform: scaleY(1.08) } 100% { transform: none } }
@keyframes lginfernoCritWingL { 0% { transform: rotate(-22deg) } 30% { transform: rotate(14deg) } 55% { transform: rotate(-7deg) } 80% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lginfernoCritWingR { 0% { transform: rotate(10deg) } 25% { transform: rotate(-18deg) } 52% { transform: rotate(9deg) } 80% { transform: rotate(-3deg) } 100% { transform: none } }
@keyframes lginfernoCritKindle { 0% { transform: scaleY(.25) skewX(-25deg) } 45% { transform: scaleY(.5) skewX(-12deg) } 75% { transform: scaleY(1.25) } 100% { transform: none } }
${M('crit')} .lg-inferno-head { animation: lginfernoCritHead 700ms cubic-bezier(.15,.85,.3,1) both }
${M('crit')} .lg-inferno-jaw { animation: lginfernoCritJaw 640ms ease-out both }
${M('crit')} .lg-inferno-wingl { animation: lginfernoCritWingL 760ms ease-out both }
${M('crit')} .lg-inferno-wingr { animation: lginfernoCritWingR 760ms ease-out both }
${M('crit')} .lg-inferno-kindle, ${M('crit')} .lg-inferno-flameskull { animation: lginfernoCritKindle 700ms ease-out both }
`
// A SHARPENED strike: honed steel bites into the obsidian: the head ducks low under the cut, the claws spring off the
// throne, the wings shiver twice like struck glass.
const sharpen = `
@keyframes lginfernoSharpHead { 0% { transform: translateY(14%) rotate(6deg) scale(.92) } 40% { transform: translateY(10%) rotate(4deg) scale(.95) } 70% { transform: translateY(-3%) } 100% { transform: none } }
@keyframes lginfernoSharpArmL { 0% { transform: translate(-6%, -10%) rotate(-10deg) } 50% { transform: translate(-3%, -5%) rotate(-5deg) } 100% { transform: none } }
@keyframes lginfernoSharpArmR { 0% { transform: translate(6%, -10%) rotate(10deg) } 50% { transform: translate(3%, -5%) rotate(5deg) } 100% { transform: none } }
@keyframes lginfernoShiverL { 0%, 30%, 60% { transform: rotate(-5deg) } 15%, 45%, 75% { transform: rotate(4deg) } 100% { transform: none } }
@keyframes lginfernoShiverR { 0%, 30%, 60% { transform: rotate(5deg) } 15%, 45%, 75% { transform: rotate(-4deg) } 100% { transform: none } }
${M('sharpen')} .lg-inferno-head { animation: lginfernoSharpHead 620ms cubic-bezier(.2,.9,.3,1) both }
${M('sharpen')} .lg-inferno-arml { animation: lginfernoSharpArmL 560ms ease-out both }
${M('sharpen')} .lg-inferno-armr { animation: lginfernoSharpArmR 560ms ease-out both }
${M('sharpen')} .lg-inferno-wingl { animation: lginfernoShiverL 520ms linear both }
${M('sharpen')} .lg-inferno-wingr { animation: lginfernoShiverR 520ms linear both }
`
// ITS STRIKE (a plain miss; its fire breath on the player is fx/inferno.jsx's data-assault-on): the claws rake the
// throne arms forward, the sword fire roars up, the throne jolts under it.
const strike = `
@keyframes lginfernoStrikeArmL { 0% { transform: translate(4%, 4%) rotate(4deg) } 30% { transform: translate(-6%, -8%) rotate(-12deg) } 55% { transform: translate(-4%, -5%) rotate(-8deg) } 100% { transform: none } }
@keyframes lginfernoStrikeArmR { 0% { transform: translate(-4%, 4%) rotate(-4deg) } 30% { transform: translate(6%, -8%) rotate(12deg) } 55% { transform: translate(4%, -5%) rotate(8deg) } 100% { transform: none } }
@keyframes lginfernoStrikeKindle { 0% { transform: scaleY(.8) } 25% { transform: scale(1.15, 1.6) } 60% { transform: scale(1.05, 1.3) } 100% { transform: none } }
@keyframes lginfernoStrikeThrone { 0%, 100% { transform: none } 22% { transform: translateY(-3%) } 34% { transform: translateY(1.5%) } 48% { transform: translateY(-1%) } }
${M('hurt')} .lg-inferno-arml { animation: lginfernoStrikeArmL 760ms cubic-bezier(.3,1.2,.4,1) both }
${M('hurt')} .lg-inferno-armr { animation: lginfernoStrikeArmR 760ms cubic-bezier(.3,1.2,.4,1) both }
${M('hurt')} .lg-inferno-kindle { animation: lginfernoStrikeKindle 820ms ease-out both }
${M('hurt')} .lg-inferno-throne { animation: lginfernoStrikeThrone 700ms linear both }
`
// ITS HEAVY BLOW (a missed attack): it RISES off the throne, both wings slam up to full span, claws tear the throne
// arms, the river below boils up, then everything crashes down with the second blast.
const heavy = `
@keyframes lginfernoHeavyBody { 0% { transform: translateY(-2%) } 18% { transform: translateY(-9%) scale(1.04) } 34% { transform: translateY(3%) scale(.98, 1.02) } 50% { transform: translateY(-4%) } 64% { transform: translateY(2%) } 100% { transform: none } }
@keyframes lginfernoHeavyWingL { 0% { transform: rotate(8deg) } 18% { transform: rotate(26deg) } 34% { transform: rotate(-12deg) } 52% { transform: rotate(16deg) } 70% { transform: rotate(-5deg) } 100% { transform: none } }
@keyframes lginfernoHeavyWingR { 0% { transform: rotate(-8deg) } 18% { transform: rotate(-26deg) } 34% { transform: rotate(12deg) } 52% { transform: rotate(-16deg) } 70% { transform: rotate(5deg) } 100% { transform: none } }
@keyframes lginfernoHeavyArmL { 0% { transform: none } 18% { transform: translate(-8%, -14%) rotate(-18deg) } 34% { transform: translate(2%, 6%) rotate(6deg) } 52% { transform: translate(-5%, -8%) rotate(-10deg) } 100% { transform: none } }
@keyframes lginfernoHeavyArmR { 0% { transform: none } 18% { transform: translate(8%, -14%) rotate(18deg) } 34% { transform: translate(-2%, 6%) rotate(-6deg) } 52% { transform: translate(5%, -8%) rotate(10deg) } 100% { transform: none } }
@keyframes lginfernoHeavyRiver { 0%, 100% { transform: none } 20% { transform: translateY(-10%) scaleY(1.25) } 38% { transform: translateY(4%) scaleY(.9) } 56% { transform: translateY(-5%) scaleY(1.12) } 75% { transform: translateY(1%) } }
@keyframes lginfernoHeavyKindle { 0% { transform: scale(1.1, 1.4) } 20% { transform: scale(1.3, 2.1) } 55% { transform: scale(1.15, 1.6) } 100% { transform: none } }
${M('hurtBig')} .lg-inferno-body, ${M('hurtBig')} .lg-inferno-throne { animation: lginfernoHeavyBody 1000ms cubic-bezier(.3,.9,.4,1) both }
${M('hurtBig')} .lg-inferno-wingl { animation: lginfernoHeavyWingL 1050ms cubic-bezier(.3,.9,.4,1) both }
${M('hurtBig')} .lg-inferno-wingr { animation: lginfernoHeavyWingR 1050ms cubic-bezier(.3,.9,.4,1) both }
${M('hurtBig')} .lg-inferno-arml { animation: lginfernoHeavyArmL 1000ms ease-out both }
${M('hurtBig')} .lg-inferno-armr { animation: lginfernoHeavyArmR 1000ms ease-out both }
${M('hurtBig')} .lg-inferno-river { animation: lginfernoHeavyRiver 1100ms ease-out both }
${M('hurtBig')} .lg-inferno-kindle { animation: lginfernoHeavyKindle 1000ms ease-out both }
`
// A BLOCK (its attack was parried): the breath is shoved back down its throat: the jaw SLAMS shut, the head reels back
// and shakes it off, the claws skid back off the throne arms, the wings brace forward.
const block = `
@keyframes lginfernoBlockHead { 0% { transform: translateY(-6%) scale(.9) } 25% { transform: translateY(-8%) scale(.88) rotate(-3deg) } 45% { transform: translateY(-4%) scale(.93) rotate(5deg) } 65% { transform: rotate(-4deg) } 82% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lginfernoBlockJaw { 0% { transform: scaleY(.62) } 50% { transform: scaleY(.7) } 100% { transform: none } }
@keyframes lginfernoBlockArmL { 0% { transform: translate(8%, 3%) rotate(8deg) } 45% { transform: translate(5%, 2%) rotate(5deg) } 100% { transform: none } }
@keyframes lginfernoBlockArmR { 0% { transform: translate(-8%, 3%) rotate(-8deg) } 45% { transform: translate(-5%, 2%) rotate(-5deg) } 100% { transform: none } }
@keyframes lginfernoBraceL { 0% { transform: rotate(-14deg) } 50% { transform: rotate(-10deg) } 100% { transform: none } }
@keyframes lginfernoBraceR { 0% { transform: rotate(14deg) } 50% { transform: rotate(10deg) } 100% { transform: none } }
${M('block')} .lg-inferno-head { animation: lginfernoBlockHead 660ms ease-out both }
${M('block')} .lg-inferno-jaw { animation: lginfernoBlockJaw 600ms ease-out both }
${M('block')} .lg-inferno-arml { animation: lginfernoBlockArmL 560ms ease-out both }
${M('block')} .lg-inferno-armr { animation: lginfernoBlockArmR 560ms ease-out both }
${M('block')} .lg-inferno-wingl { animation: lginfernoBraceL 620ms ease-out both }
${M('block')} .lg-inferno-wingr { animation: lginfernoBraceR 620ms ease-out both }
`
// A SHIELD SAVE: its fire breaks on the dome: the head is turned aside by its own backwash, jaw still gaping, then it
// snaps back to glare; the wings flare up in fury.
const shield = `
@keyframes lginfernoShieldHead { 0% { transform: translate(-4%, 0) rotate(-6deg) } 20% { transform: translate(8%, -3%) rotate(14deg) } 45% { transform: translate(6%, -2%) rotate(11deg) } 70% { transform: translate(-2%, 0) rotate(-3deg) } 100% { transform: none } }
@keyframes lginfernoShieldJaw { 0% { transform: scaleY(1.3) } 45% { transform: scaleY(1.25) } 70% { transform: scaleY(.85) } 100% { transform: none } }
@keyframes lginfernoFlareL { 0% { transform: none } 25% { transform: rotate(12deg) } 60% { transform: rotate(9deg) } 100% { transform: none } }
@keyframes lginfernoFlareR { 0% { transform: none } 25% { transform: rotate(-12deg) } 60% { transform: rotate(-9deg) } 100% { transform: none } }
${M('shield')} .lg-inferno-head { animation: lginfernoShieldHead 760ms ease-out both }
${M('shield')} .lg-inferno-jaw { animation: lginfernoShieldJaw 700ms ease-out both }
${M('shield')} .lg-inferno-wingl { animation: lginfernoFlareL 760ms ease-out both }
${M('shield')} .lg-inferno-wingr { animation: lginfernoFlareR 760ms ease-out both }
`
// SECOND WIND: the player heals and the Sovereign seethes: it shakes its head no, chomps twice, the sword fire gutters.
const wind = `
@keyframes lginfernoWindHead { 0%, 100% { transform: none } 12% { transform: rotate(-9deg) } 28% { transform: rotate(9deg) } 44% { transform: rotate(-7deg) } 60% { transform: rotate(6deg) } 76% { transform: rotate(-3deg) } }
@keyframes lginfernoWindJaw { 0%, 100% { transform: none } 15% { transform: scaleY(1.3) } 25% { transform: scaleY(.8) } 45% { transform: scaleY(1.25) } 55% { transform: scaleY(.8) } 70% { transform: none } }
@keyframes lginfernoWindKindle { 0% { transform: none } 30% { transform: scale(.8, .4) } 70% { transform: scale(.9, .6) } 100% { transform: none } }
${M('wind')} .lg-inferno-head { animation: lginfernoWindHead 950ms ease-in-out both }
${M('wind')} .lg-inferno-jaw { animation: lginfernoWindJaw 950ms linear both }
${M('wind')} .lg-inferno-kindle, ${M('wind')} .lg-inferno-flameskull { animation: lginfernoWindKindle 1000ms ease-in-out both }
`
// ITS KNOCKOUT (over the whole cinematic, from JUICE.delay): it rears up in one last roar, then the fire goes out of it:
// the head drops forward, the jaw hangs open, the wings collapse down over the throne, the claws slide off, the sword
// fire gutters out and the river sinks. fx/inferno.jsx holds the fallen pose after the cinematic.
const ko = `
@keyframes lginfernoKoHead { 0% { transform: none } 14% { transform: translateY(-10%) rotate(-8deg) scale(1.06) } 30% { transform: translateY(-12%) rotate(-10deg) scale(1.08) } 52% { transform: translateY(6%) rotate(6deg) scale(.96) } 72% { transform: translateY(18%) rotate(12deg) scale(.92) } 86% { transform: translateY(16%) rotate(10deg) scale(.92) } 100% { transform: translateY(18%) rotate(12deg) scale(.92) } }
@keyframes lginfernoKoJaw { 0% { transform: none } 14% { transform: scaleY(1.5) } 34% { transform: scaleY(1.55) } 60% { transform: scaleY(1.2) } 100% { transform: scaleY(1.32) rotate(4deg) } }
@keyframes lginfernoKoWingL { 0% { transform: none } 22% { transform: rotate(22deg) } 48% { transform: rotate(-10deg) } 70% { transform: rotate(-38deg) } 82% { transform: rotate(-33deg) } 100% { transform: rotate(-36deg) } }
@keyframes lginfernoKoWingR { 0% { transform: none } 22% { transform: rotate(-22deg) } 48% { transform: rotate(10deg) } 70% { transform: rotate(38deg) } 82% { transform: rotate(33deg) } 100% { transform: rotate(36deg) } }
@keyframes lginfernoKoArmL { 0%, 40% { transform: none } 70% { transform: translate(-4%, 14%) rotate(14deg) } 100% { transform: translate(-4%, 12%) rotate(12deg) } }
@keyframes lginfernoKoArmR { 0%, 40% { transform: none } 70% { transform: translate(4%, 14%) rotate(-14deg) } 100% { transform: translate(4%, 12%) rotate(-12deg) } }
@keyframes lginfernoKoFire { 0% { transform: none } 20% { transform: scale(1.2, 1.7) } 50% { transform: scale(.9, .7) } 66% { transform: scale(1, .9) } 80% { transform: scale(.6, .25) } 100% { transform: scale(.4, .06) } }
@keyframes lginfernoKoRiver { 0%, 45% { transform: none } 80%, 100% { transform: translateY(14%) scaleY(.8) } }
${M('ko')} .lg-inferno-head { animation: lginfernoKoHead 2300ms cubic-bezier(.3,.6,.4,1) both }
${M('ko')} .lg-inferno-jaw { animation: lginfernoKoJaw 2300ms ease-out both }
${M('ko')} .lg-inferno-wingl { animation: lginfernoKoWingL 2300ms cubic-bezier(.4,.1,.5,1) both }
${M('ko')} .lg-inferno-wingr { animation: lginfernoKoWingR 2300ms cubic-bezier(.4,.1,.5,1) both }
${M('ko')} .lg-inferno-arml { animation: lginfernoKoArmL 2300ms ease-in both }
${M('ko')} .lg-inferno-armr { animation: lginfernoKoArmR 2300ms ease-in both }
${M('ko')} .lg-inferno-kindle, ${M('ko')} .lg-inferno-flameskull { animation: lginfernoKoFire 2300ms ease-in both }
${M('ko')} .lg-inferno-river { animation: lginfernoKoRiver 2300ms ease-in both }
`
// ITS OWN DRAWN PARTS
// infernoGout: the fire breath leaves the gaping jaw as a roaring tongue of flame aimed down at the player's hearts (to
// the right of the boss), a white-hot core inside it, embers spat along it.
const own = `
@keyframes lginfernoGout { 0% { transform: rotate(var(--a)) scaleX(0) scaleY(.4); opacity: 1 } 16% { transform: rotate(var(--a)) scaleX(1.1) scaleY(1.15); opacity: 1 } 28% { transform: rotate(var(--a)) scaleX(1) scaleY(.9) } 40% { transform: rotate(var(--a)) scaleX(1.04) scaleY(1.08) } 55% { transform: rotate(var(--a)) scaleX(1) scaleY(.94); opacity: 1 } 100% { transform: rotate(var(--a)) scaleX(1.12) scaleY(.2); opacity: 0 } }
@keyframes lginfernoSpit { 0% { transform: translate(0, 0) scale(.4); opacity: 0 } 10% { opacity: 1 } 100% { transform: translate(var(--x), var(--y)) scale(1); opacity: 0 } }
`
const TONGUE = 'polygon(0 44%, 14% 30%, 30% 22%, 44% 8%, 58% 18%, 70% 0, 84% 14%, 100% 6%, 92% 34%, 100% 52%, 90% 66%, 100% 92%, 82% 84%, 66% 100%, 54% 82%, 40% 90%, 28% 76%, 12% 68%, 0 56%)'
function gout(p, ctx) {
  const s = ctx.scale
  const a = `${p.angle ?? 14}deg`
  const jet = (k, w, h, bg, delay, op = 1) => (
    <div key={k} style={{ position: 'absolute', left: `${p.x ?? 52}%`, top: `${p.y ?? 34}%`, width: `${w * s * (p.reach ?? 1)}cqw`, height: `${h * s}cqw`, marginTop: `${(-h / 2) * s}cqw`, transformOrigin: '0 50%', '--a': a, clipPath: TONGUE,
      background: bg, opacity: op, animation: `lginfernoGout ${760 * ctx.speed}ms cubic-bezier(.2,.9,.3,1) ${delay}ms both` }} />
  )
  return [
    jet('o', 82, 34, `linear-gradient(90deg, #fff 0, #ffe08a 12%, ${ctx.color} 38%, #e0300a 70%, rgba(160,20,0,0) 100%)`, 0),
    jet('i', 64, 14, 'linear-gradient(90deg, #fff 0, #fff 30%, #ffe08a 60%, rgba(255,224,138,0) 100%)', 30, 0.95),
    ...Array.from({ length: 9 }, (_, i) => {
      const t = (i + 1) / 10
      const ang = ((p.angle ?? 14) + (i % 3 - 1) * 9) * (Math.PI / 180)
      const d = 30 + t * 60
      return <div key={`e${i}`} style={{ position: 'absolute', left: `${p.x ?? 52}%`, top: `${p.y ?? 34}%`, width: `${(2 + (i % 3)) * s}cqw`, height: `${(2 + (i % 3)) * s}cqw`, borderRadius: '50%',
        background: 'radial-gradient(circle, #fff, #ffe08a 45%, #ff7a14)', boxShadow: '0 0 1.5cqw #ff7a14', '--x': `${Math.cos(ang) * d * s}cqw`, '--y': `${Math.sin(ang) * d * s - 6}cqw`,
        animation: `lginfernoSpit ${(520 + i * 30) * ctx.speed}ms cubic-bezier(.2,.8,.4,1) ${60 + i * 28}ms both` }} />
    }),
  ]
}

// infernoChips: a hit knocks black obsidian scales off its hide, each with a glowing lava edge, and a spurt of magma
// bleeds from the crack.
const own2 = `
@keyframes lginfernoChip { 0% { transform: translate(0, 0) rotate(0) scale(.6); opacity: 0 } 8% { opacity: 1 } 55% { transform: translate(var(--x), var(--y)) rotate(var(--r)) scale(1); opacity: 1 } 100% { transform: translate(var(--x), calc(var(--y) + 22cqw)) rotate(calc(var(--r) * 1.6)) scale(.9); opacity: 0 } }
@keyframes lginfernoSpurt { 0% { transform: translate(-50%, -100%) scaleY(0); opacity: 1 } 30% { transform: translate(-50%, -100%) scaleY(1.1); opacity: 1 } 100% { transform: translate(-50%, -100%) scaleY(.4) translateY(30%); opacity: 0 } }
@keyframes lginfernoGeyser { 0% { transform: scaleY(0) scaleX(.6); opacity: 1 } 22% { transform: scaleY(1.08) scaleX(1); opacity: 1 } 40% { transform: scaleY(.94) scaleX(1.08) } 58% { transform: scaleY(1.02) scaleX(1); opacity: 1 } 100% { transform: scaleY(.15) scaleX(1.3); opacity: 0 } }
@keyframes lginfernoBlob { 0% { transform: translate(0, 0) scale(.5); opacity: 0 } 8% { opacity: 1 } 45% { transform: translate(calc(var(--x) * .6), var(--y)) scale(1) } 100% { transform: translate(var(--x), 30cqw) scale(.8); opacity: 0 } }
@keyframes lginfernoBackfire { 0% { transform: scaleX(0); opacity: 1 } 26% { transform: scaleX(1); opacity: 1 } 42% { transform: scaleX(.75) scaleY(1.5); opacity: 1 } 100% { transform: scaleX(.05) scaleY(2.2); opacity: 0 } }
@keyframes lginfernoPuff { 0% { transform: translate(-50%, -50%) scale(.2); opacity: 0 } 30% { opacity: .95 } 100% { transform: translate(calc(-50% + var(--x)), calc(-50% - 14cqw)) scale(1.6); opacity: 0 } }
`
function chips(p, ctx) {
  const s = ctx.scale
  const n = p.n || 9
  return [
    <div key="sp" style={{ position: 'absolute', left: '50%', top: '52%', width: `${7 * s}cqw`, height: `${30 * s}cqw`, borderRadius: '45% 45% 20% 20%', transformOrigin: '50% 100%',
      background: `linear-gradient(0deg, #ff3b00, ${ctx.color} 40%, #ffe08a 85%, #fff)`, boxShadow: `0 0 3cqw ${ctx.color}`, animation: `lginfernoSpurt ${520 * ctx.speed}ms cubic-bezier(.2,.9,.3,1) both` }} />,
    ...Array.from({ length: n }, (_, i) => {
      const a = (-160 + (i / (n - 1)) * 140) * (Math.PI / 180)
      const d = 26 + (i % 3) * 9
      const w = 5 + (i % 3) * 2
      return <div key={`c${i}`} style={{ position: 'absolute', left: '50%', top: '50%', width: `${w * s}cqw`, height: `${w * 0.8 * s}cqw`, marginLeft: `${(-w / 2) * s}cqw`,
        clipPath: 'polygon(50% 0, 100% 35%, 80% 100%, 15% 85%, 0 30%)', background: 'linear-gradient(135deg, #3a2a30 0, #120a0c 55%, #ff7a14 80%, #ffe08a 100%)',
        '--x': `${Math.cos(a) * d * s}cqw`, '--y': `${Math.sin(a) * d * s}cqw`, '--r': `${(i % 2 ? 1 : -1) * (160 + i * 25)}deg`,
        animation: `lginfernoChip ${(620 + (i % 4) * 50) * ctx.speed}ms cubic-bezier(.2,.8,.4,1) ${i * 12}ms both` }} />
    }),
  ]
}
// infernoGeyser: the river under the throne bursts: two columns of magma tear up out of it either side of the boss,
// white hot at the throat, flinging lava blobs that fall back.
function geyser(p, ctx) {
  const s = ctx.scale
  const col = (k, x, w, h, delay) => (
    <div key={k} style={{ position: 'absolute', left: `${x}%`, bottom: '-4%', width: `${w * s}cqw`, height: `${h * s}cqw`, marginLeft: `${(-w / 2) * s}cqw`, transformOrigin: '50% 100%', borderRadius: '50% 50% 18% 18% / 22% 22% 6% 6%',
      background: `linear-gradient(90deg, rgba(200,30,0,0), #c81e00 12%, ${ctx.color} 30%, #ffe08a 46%, #fff 50%, #ffe08a 54%, ${ctx.color} 70%, #c81e00 88%, rgba(200,30,0,0))`, boxShadow: `0 0 5cqw ${ctx.color}`,
      animation: `lginfernoGeyser ${880 * ctx.speed}ms cubic-bezier(.2,.9,.3,1) ${delay}ms both` }} />
  )
  return [
    col('l', 16, 24, 96, 0), col('r', 84, 24, 96, 70), col('m', 50, 16, 60, 140),
    ...Array.from({ length: 10 }, (_, i) => {
      const side = i % 2 ? 1 : -1
      const x0 = i % 2 ? 84 : 16
      return <div key={`b${i}`} style={{ position: 'absolute', left: `${x0}%`, top: `${30 + (i % 3) * 6}%`, width: `${(4 + (i % 3) * 1.5) * s}cqw`, height: `${(4 + (i % 3) * 1.5) * s}cqw`, borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, #ffe08a, ${ctx.color} 55%, #a32000)`, boxShadow: `0 0 2cqw ${ctx.color}`, '--x': `${side * (10 + (i % 5) * 7) * s}cqw`, '--y': `${(-18 - (i % 4) * 7) * s}cqw`,
        animation: `lginfernoBlob ${(820 + (i % 3) * 60) * ctx.speed}ms linear ${120 + i * 26}ms both` }} />
    }),
  ]
}
// infernoBackfire: a parried breath: the jet leaves the jaw, meets the guard, and is crushed back into the mouth in a
// ball of flame, smoke pouring out of its nostrils.
function backfire(p, ctx) {
  const s = ctx.scale
  return [
    <div key="j" style={{ position: 'absolute', left: '52%', top: '34%', width: `${56 * s}cqw`, height: `${20 * s}cqw`, marginTop: `${-10 * s}cqw`, transformOrigin: '0 50%', clipPath: TONGUE,
      background: `linear-gradient(90deg, #fff, #ffe08a 20%, ${ctx.color} 60%, #c81e00)`, animation: `lginfernoBackfire ${560 * ctx.speed}ms cubic-bezier(.3,.9,.4,1) both` }} />,
    <div key="b" style={{ position: 'absolute', left: '50%', top: '34%', width: `${44 * s}cqw`, height: `${44 * s}cqw`, borderRadius: '50%', background: `radial-gradient(circle, #fff 0, #ffe08a 25%, ${ctx.color} 55%, rgba(200,30,0,0) 72%)`,
      animation: `lginfernoPuff ${600 * ctx.speed}ms ease-out 170ms both`, '--x': '0cqw' }} />,
    ...[-1, 1].flatMap((d) => [0, 1, 2].map((i) => (
      <div key={`s${d}${i}`} style={{ position: 'absolute', left: `${50 + d * 6}%`, top: '30%', width: `${(20 + i * 6) * s}cqw`, height: `${(20 + i * 6) * s}cqw`, borderRadius: '50%',
        background: 'radial-gradient(circle, #6a5f66 0, #2e2629 55%, rgba(30,24,28,0) 72%)', '--x': `${d * (8 + i * 6) * s}cqw`, animation: `lginfernoPuff ${(700 + i * 120) * ctx.speed}ms ease-out ${200 + i * 70}ms both` }} />
    ))),
  ]
}

export const css = pivots + hit + crit + sharpen + strike + heavy + block + shield + wind + ko + own + own2
export default { infernoGout: gout, infernoChips: chips, infernoGeyser: geyser, infernoBackfire: backfire }
