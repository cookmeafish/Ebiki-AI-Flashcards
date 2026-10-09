// What the Banshee's raid ability (scream: Call and Response) LOOKS like. The fx contract is in fx/index.js, the juice
// numbers in fx/_juice.js, the design in design-v2.md section 18. Fixed bright colors (never theme tokens).
import { anim, around, flash } from './_kit'

const SETTLE = 'cubic-bezier(.22,1,.36,1)'
const VIOLET = '#b48cff'
const PALE = '#efe4ff'

// A sound ring pulsing out of her mouth (about 45% down the box).
const wave = (key, color, delay, s, w) => (
  <div key={key} className="lgx" style={{ left: '50%', top: '45%', width: '60%', height: '60%', borderRadius: '50%', border: `${w}px solid ${color}`, boxShadow: `0 0 10px ${color}, inset 0 0 8px ${color}`, '--s': s, animation: anim('lgrBansheeRing', 620, delay, 'ease-out') }} />
)

// The crack web: spokes from the impact, two jagged rings.
const SPOKES = [[50, 2], [86, 10], [100, 42], [92, 82], [62, 100], [30, 98], [4, 76], [0, 36], [18, 6]]
const RING1 = '50,22 63,30 72,40 70,55 60,66 46,68 33,60 28,46 34,32'
const RING2 = '50,8 70,16 86,32 88,56 76,78 54,88 30,84 14,66 10,42 22,20'

// THE DRAWING ACTS EVERY MOMENT (impact/bosses/README.md): the hook classes in raids/banshee.svg move with the arena's
// data-moment (a plain strike moment), data-assault-on (her blow on the player) and data-fx (her ability). Head, jaw,
// eyes, hair, claws and bells are wrapped parts (fill-box pivots: the head at its neck, the jaw at its hinge, each bell
// from its rope, each arm at the shoulder, the phase 3 claws from below). Every move ends on the drawn pose.
const P = '.lg-boss[data-motif="banshee"]'
const PARTS_CSS = `
${P} .lg-banshee-head { transform-box: fill-box; transform-origin: 50% 88% }
${P} .lg-banshee-jaw { transform-box: fill-box; transform-origin: 50% 0% }
${P} .lg-banshee-eye { transform-box: fill-box; transform-origin: 50% 50% }
${P} .lg-banshee-hair { transform-box: fill-box; transform-origin: 50% 70% }
${P} .lg-banshee-bell { transform-box: fill-box; transform-origin: 50% 0% }
${P} .lg-banshee-armL { transform-box: fill-box; transform-origin: 100% 52% }
${P} .lg-banshee-armR { transform-box: fill-box; transform-origin: 0% 52% }
${P}[data-phase="2"] .lg-banshee-armL { transform-origin: 98% 60% }
${P}[data-phase="2"] .lg-banshee-armR { transform-origin: 2% 71% }
${P}[data-phase="3"] .lg-banshee-armL, ${P}[data-phase="3"] .lg-banshee-armR { transform-origin: 50% 100% }
/* HIT: the scream is cut off: her head snaps back and the jaw clamps shut, the eyes pinch, the bells jangle. */
@keyframes lgrBansheeHitHead { 0% { transform: none } 12% { transform: translateY(-3px) rotate(-6deg) scale(.95) } 34% { transform: rotate(3deg) } 60% { transform: rotate(-1deg) } 100% { transform: none } }
@keyframes lgrBansheeHitJaw { 0% { transform: none } 10%, 34% { transform: scaleY(.5) } 52% { transform: scaleY(1.08) } 100% { transform: none } }
@keyframes lgrBansheeHitEye { 0%, 100% { transform: none } 12%, 40% { transform: scale(1.2, .35) } }
@keyframes lgrBansheeJangle { 0%, 100% { transform: none } 12% { transform: rotate(14deg) } 30% { transform: rotate(-10deg) } 48% { transform: rotate(6deg) } 66% { transform: rotate(-3deg) } 84% { transform: rotate(1deg) } }
${P}[data-moment="hit"] .lg-banshee-head { animation: lgrBansheeHitHead 520ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="hit"] .lg-banshee-jaw { animation: lgrBansheeHitJaw 520ms ease-out both }
${P}[data-moment="hit"] .lg-banshee-eye { animation: lgrBansheeHitEye 520ms ease-out both }
${P}[data-moment="hit"] .lg-banshee-bell { animation: lgrBansheeJangle 700ms ease-out both }
/* CRITICAL: a shriek of pain: the head whips aside and shears, the jaw unhinges, the claws fly up, the hair flares and
   every bell swings wild. */
@keyframes lgrBansheeCritHead { 0% { transform: none } 12% { transform: translateX(-4px) rotate(-16deg) skewX(8deg) } 32% { transform: translateX(2px) rotate(9deg) skewX(-4deg) } 56% { transform: rotate(-4deg) } 78% { transform: rotate(1.5deg) } 100% { transform: none } }
@keyframes lgrBansheeCritJaw { 0%, 100% { transform: none } 12%, 46% { transform: scaleY(1.5) } 70% { transform: scaleY(.9) } }
@keyframes lgrBansheeCritArmL { 0%, 100% { transform: none } 14% { transform: rotate(30deg) } 40% { transform: rotate(-8deg) } 64% { transform: rotate(4deg) } }
@keyframes lgrBansheeCritArmR { 0%, 100% { transform: none } 14% { transform: rotate(-30deg) } 40% { transform: rotate(8deg) } 64% { transform: rotate(-4deg) } }
@keyframes lgrBansheeCritHair { 0%, 100% { transform: none } 14% { transform: scale(1.18, 1.12) } 44% { transform: scale(.97) } }
@keyframes lgrBansheeSwing { 0%, 100% { transform: none } 10% { transform: rotate(-26deg) } 28% { transform: rotate(20deg) } 46% { transform: rotate(-12deg) } 64% { transform: rotate(7deg) } 82% { transform: rotate(-3deg) } }
${P}[data-moment="crit"] .lg-banshee-head { animation: lgrBansheeCritHead 640ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="crit"] .lg-banshee-jaw { animation: lgrBansheeCritJaw 640ms ease-out both }
${P}[data-moment="crit"] .lg-banshee-armL { animation: lgrBansheeCritArmL 640ms ease-out both }
${P}[data-moment="crit"] .lg-banshee-armR { animation: lgrBansheeCritArmR 640ms ease-out both }
${P}[data-moment="crit"] .lg-banshee-hair { animation: lgrBansheeCritHair 640ms ease-out both }
${P}[data-moment="crit"] .lg-banshee-bell { animation: lgrBansheeSwing 900ms ease-out both }
/* SHARPENED: the blade parts her wail: the head shears along the cut, the eyes squeeze, the left claw is struck down. */
@keyframes lgrBansheeCutHead { 0% { transform: none } 10% { transform: skewY(10deg) translateY(2px) } 26% { transform: skewY(-7deg) } 44% { transform: skewY(3deg) } 66% { transform: skewY(-1deg) } 100% { transform: none } }
@keyframes lgrBansheeCutEye { 0%, 100% { transform: none } 10%, 50% { transform: scale(1.1, .2) } }
@keyframes lgrBansheeCutArmL { 0%, 100% { transform: none } 14% { transform: rotate(-22deg) translateY(3px) } 50% { transform: rotate(-8deg) } }
${P}[data-moment="sharpen"] .lg-banshee-head { animation: lgrBansheeCutHead 600ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="sharpen"] .lg-banshee-eye { animation: lgrBansheeCutEye 600ms ease-out both }
${P}[data-moment="sharpen"] .lg-banshee-armL { animation: lgrBansheeCutArmL 600ms ease-out both }
/* HER BLOW ON THE PLAYER (data-assault-on): she draws breath (head back, jaw shut, claws pulled in), then SCREAMS at the
   camera as the sound rings leave her (impact/assault.js travelAt): the jaw gapes, the skull lunges in, both claws
   thrust out at you and the hair blows back, the scream shaking her before she settles. */
@keyframes lgrBansheeBlowHead { 0% { transform: none } 12% { transform: translateY(-4px) scale(.92) } 22% { transform: translateY(3px) scale(1.18) } 30% { transform: translate(-1px, 3px) scale(1.16) } 36% { transform: translate(1px, 3px) scale(1.16) } 42% { transform: translate(-1px, 3px) scale(1.15) } 48% { transform: translate(1px, 2px) scale(1.14) } 100% { transform: none } }
@keyframes lgrBansheeBlowJaw { 0% { transform: none } 12% { transform: scaleY(.6) } 22%, 50% { transform: scaleY(1.6) } 100% { transform: none } }
@keyframes lgrBansheeBlowArmL { 0% { transform: none } 12% { transform: rotate(-12deg) scale(.92) } 24% { transform: rotate(18deg) scale(1.3) } 50% { transform: rotate(14deg) scale(1.24) } 100% { transform: none } }
@keyframes lgrBansheeBlowArmR { 0% { transform: none } 12% { transform: rotate(12deg) scale(.92) } 24% { transform: rotate(-18deg) scale(1.3) } 50% { transform: rotate(-14deg) scale(1.24) } 100% { transform: none } }
@keyframes lgrBansheeBlowHair { 0% { transform: none } 12% { transform: scale(.94) } 24%, 50% { transform: scale(1.12, 1.2) translateY(-2px) } 100% { transform: none } }
${P}[data-assault-on] .lg-banshee-head { animation: lgrBansheeBlowHead 820ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-assault-on] .lg-banshee-jaw { animation: lgrBansheeBlowJaw 820ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-assault-on] .lg-banshee-armL { animation: lgrBansheeBlowArmL 820ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-assault-on] .lg-banshee-armR { animation: lgrBansheeBlowArmR 820ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-assault-on] .lg-banshee-hair { animation: lgrBansheeBlowHair 820ms cubic-bezier(.3,.7,.3,1) both }
/* HER STRIKE (hurt, with the scream above): the eyes blaze wide and the bells toll with the shriek. */
@keyframes lgrBansheeBlaze { 0%, 100% { transform: none } 14%, 50% { transform: scale(1.45) } }
@keyframes lgrBansheeToll { 0%, 100% { transform: none } 16% { transform: rotate(22deg) } 40% { transform: rotate(-16deg) } 62% { transform: rotate(8deg) } 82% { transform: rotate(-3deg) } }
${P}[data-moment="hurt"] .lg-banshee-eye { animation: lgrBansheeBlaze 640ms ease-out both }
${P}[data-moment="hurt"] .lg-banshee-bell { animation: lgrBansheeToll 900ms ease-out both }
/* HER HEAVY BLOW (hurtBig): a deeper breath and a bigger scream: she rears up with claws spread high, then the whole
   skull dives at the camera with the jaw at full gape, every bell slammed. */
@keyframes lgrBansheeHeavyHead { 0% { transform: none } 18% { transform: translateY(-6px) rotate(-7deg) scale(.9) } 30% { transform: translateY(5px) scale(1.28) } 38% { transform: translate(-2px, 5px) scale(1.26) } 46% { transform: translate(2px, 5px) scale(1.26) } 54% { transform: translate(-1px, 4px) scale(1.22) } 100% { transform: none } }
@keyframes lgrBansheeHeavyJaw { 0% { transform: none } 18% { transform: scaleY(.55) } 30%, 58% { transform: scaleY(1.8) } 100% { transform: none } }
@keyframes lgrBansheeHeavyArmL { 0% { transform: none } 18% { transform: rotate(40deg) } 32% { transform: rotate(16deg) scale(1.35) } 58% { transform: rotate(12deg) scale(1.28) } 100% { transform: none } }
@keyframes lgrBansheeHeavyArmR { 0% { transform: none } 18% { transform: rotate(-40deg) } 32% { transform: rotate(-16deg) scale(1.35) } 58% { transform: rotate(-12deg) scale(1.28) } 100% { transform: none } }
${P}[data-moment="hurtBig"] .lg-banshee-head, ${P}[data-assault-on][data-moment="hurtBig"] .lg-banshee-head { animation: lgrBansheeHeavyHead 900ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-moment="hurtBig"] .lg-banshee-jaw, ${P}[data-assault-on][data-moment="hurtBig"] .lg-banshee-jaw { animation: lgrBansheeHeavyJaw 900ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-moment="hurtBig"] .lg-banshee-armL, ${P}[data-assault-on][data-moment="hurtBig"] .lg-banshee-armL { animation: lgrBansheeHeavyArmL 900ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-moment="hurtBig"] .lg-banshee-armR, ${P}[data-assault-on][data-moment="hurtBig"] .lg-banshee-armR { animation: lgrBansheeHeavyArmR 900ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-moment="hurtBig"] .lg-banshee-bell { animation: lgrBansheeSwing 900ms ease-out both }
${P}[data-moment="hurtBig"] .lg-banshee-eye { animation: lgrBansheeBlaze 900ms ease-out both }
/* BLOCKED: her lunge is stopped dead: the skull darts in, is knocked back, the jaw slams shut, both claws fly up over
   her face. */
@keyframes lgrBansheeBlockHead { 0% { transform: none } 10% { transform: translateY(2px) scale(1.1) } 26% { transform: translateY(-5px) rotate(8deg) scale(.9) } 50% { transform: rotate(-3deg) } 100% { transform: none } }
@keyframes lgrBansheeBlockJaw { 0% { transform: none } 10% { transform: scaleY(1.3) } 24%, 48% { transform: scaleY(.45) } 100% { transform: none } }
@keyframes lgrBansheeBlockArmL { 0%, 100% { transform: none } 26%, 50% { transform: rotate(44deg) scale(.95) } }
@keyframes lgrBansheeBlockArmR { 0%, 100% { transform: none } 26%, 50% { transform: rotate(-44deg) scale(.95) } }
${P}[data-moment="block"] .lg-banshee-head { animation: lgrBansheeBlockHead 640ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="block"] .lg-banshee-jaw { animation: lgrBansheeBlockJaw 640ms ease-out both }
${P}[data-moment="block"] .lg-banshee-armL { animation: lgrBansheeBlockArmL 640ms ease-in-out both }
${P}[data-moment="block"] .lg-banshee-armR { animation: lgrBansheeBlockArmR 640ms ease-in-out both }
/* SAVED: her scream bounces off the shield and back into her: claws clap to her head, the skull shudders, the jaw
   gulps shut and the bells shiver. */
@keyframes lgrBansheeShieldHead { 0%, 100% { transform: none } 14% { transform: scale(.92) } 24% { transform: translateX(-3px) rotate(-5deg) scale(.93) } 34% { transform: translateX(3px) rotate(5deg) scale(.93) } 44% { transform: translateX(-2px) rotate(-3deg) } 54% { transform: translateX(2px) rotate(2deg) } 70% { transform: none } }
@keyframes lgrBansheeShieldJaw { 0%, 100% { transform: none } 14%, 60% { transform: scaleY(.4) } }
@keyframes lgrBansheeShieldArmL { 0%, 100% { transform: none } 16%, 62% { transform: rotate(56deg) scale(.9) } }
@keyframes lgrBansheeShieldArmR { 0%, 100% { transform: none } 16%, 62% { transform: rotate(-56deg) scale(.9) } }
@keyframes lgrBansheeShiver { 0%, 100% { transform: none } 20% { transform: rotate(4deg) } 30% { transform: rotate(-4deg) } 40% { transform: rotate(3deg) } 50% { transform: rotate(-2deg) } }
${P}[data-moment="shield"] .lg-banshee-head { animation: lgrBansheeShieldHead 760ms ease-out both }
${P}[data-moment="shield"] .lg-banshee-jaw { animation: lgrBansheeShieldJaw 760ms ease-out both }
${P}[data-moment="shield"] .lg-banshee-armL { animation: lgrBansheeShieldArmL 760ms ease-in-out both }
${P}[data-moment="shield"] .lg-banshee-armR { animation: lgrBansheeShieldArmR 760ms ease-in-out both }
${P}[data-moment="shield"] .lg-banshee-bell { animation: lgrBansheeShiver 760ms linear both }
/* SECOND WIND: she wilts: the skull droops, the jaw hangs slack, the claws sag and the hair falls flat. */
@keyframes lgrBansheeWindHead { 0%, 100% { transform: none } 35%, 70% { transform: translateY(4px) rotate(5deg) scale(.95) } }
@keyframes lgrBansheeWindJaw { 0%, 100% { transform: none } 35%, 70% { transform: scaleY(.8) } }
@keyframes lgrBansheeWindArmL { 0%, 100% { transform: none } 35%, 70% { transform: rotate(-16deg) translateY(3px) } }
@keyframes lgrBansheeWindArmR { 0%, 100% { transform: none } 35%, 70% { transform: rotate(16deg) translateY(3px) } }
@keyframes lgrBansheeWindHair { 0%, 100% { transform: none } 35%, 70% { transform: scale(.94, .86) translateY(2px) } }
${P}[data-moment="wind"] .lg-banshee-head { animation: lgrBansheeWindHead 1000ms ease-in-out both }
${P}[data-moment="wind"] .lg-banshee-jaw { animation: lgrBansheeWindJaw 1000ms ease-in-out both }
${P}[data-moment="wind"] .lg-banshee-armL { animation: lgrBansheeWindArmL 1000ms ease-in-out both }
${P}[data-moment="wind"] .lg-banshee-armR { animation: lgrBansheeWindArmR 1000ms ease-in-out both }
${P}[data-moment="wind"] .lg-banshee-hair { animation: lgrBansheeWindHair 1000ms ease-in-out both }
/* KNOCKOUT (silence): one last scream to the sky, claws raised and the skull trembling, then the jaw slowly closes, the
   eyes go out, the claws fall and she sinks into the silence, settling into the box's own fallen pose. */
@keyframes lgrBansheeKoHead { 0% { transform: none } 12% { transform: translateY(-4px) rotate(-9deg) scale(1.06) } 16% { transform: translate(-1px, -4px) rotate(-9deg) scale(1.06) } 20% { transform: translate(1px, -4px) rotate(-9deg) scale(1.06) } 24% { transform: translate(-1px, -4px) rotate(-9deg) scale(1.06) } 30% { transform: translateY(-3px) rotate(-8deg) scale(1.05) } 58% { transform: translateY(5px) rotate(6deg) scale(.94) } 80% { transform: translateY(3px) rotate(3deg) scale(.97) } 100% { transform: none } }
@keyframes lgrBansheeKoJaw { 0% { transform: none } 10%, 30% { transform: scaleY(1.65) } 58% { transform: scaleY(.5) } 100% { transform: none } }
@keyframes lgrBansheeKoArmL { 0% { transform: none } 12%, 32% { transform: rotate(34deg) } 62% { transform: rotate(-22deg) translateY(4px) } 100% { transform: none } }
@keyframes lgrBansheeKoArmR { 0% { transform: none } 12%, 32% { transform: rotate(-34deg) } 62% { transform: rotate(22deg) translateY(4px) } 100% { transform: none } }
@keyframes lgrBansheeKoEye { 0% { transform: none } 12%, 30% { transform: scale(1.5) } 56%, 86% { transform: scale(1, .08) } 100% { transform: none } }
${P}[data-moment="ko"] .lg-banshee-head { animation: lgrBansheeKoHead 2000ms ease-in-out both }
${P}[data-moment="ko"] .lg-banshee-jaw { animation: lgrBansheeKoJaw 2000ms ease-in-out both }
${P}[data-moment="ko"] .lg-banshee-armL { animation: lgrBansheeKoArmL 2000ms ease-in-out both }
${P}[data-moment="ko"] .lg-banshee-armR { animation: lgrBansheeKoArmR 2000ms ease-in-out both }
${P}[data-moment="ko"] .lg-banshee-eye { animation: lgrBansheeKoEye 2000ms ease-in-out both }
${P}[data-moment="ko"] .lg-banshee-bell { animation: lgrBansheeSwing 1400ms ease-out both }
/* HER ABILITY, acted by the drawing.
   Wail (the call): she conducts it: both claws rise, the skull trembles with the note, the bells ring one after
   another, the hair streams. */
@keyframes lgrBansheeWailArmL { 0%, 100% { transform: none } 18%, 66% { transform: rotate(24deg) scale(1.08) } }
@keyframes lgrBansheeWailArmR { 0%, 100% { transform: none } 18%, 66% { transform: rotate(-24deg) scale(1.08) } }
@keyframes lgrBansheeWailHead { 0%, 100% { transform: none } 18% { transform: translateY(-3px) } 26% { transform: translate(-1.5px, -3px) } 34% { transform: translate(1.5px, -3px) } 42% { transform: translate(-1.5px, -3px) } 50% { transform: translate(1.5px, -3px) } 58% { transform: translate(-1px, -3px) } 66% { transform: translateY(-2px) } }
${P}[data-fx="wail"] .lg-banshee-armL { animation: lgrBansheeWailArmL 800ms ease-in-out both }
${P}[data-fx="wail"] .lg-banshee-armR { animation: lgrBansheeWailArmR 800ms ease-in-out both }
${P}[data-fx="wail"] .lg-banshee-head { animation: lgrBansheeWailHead 800ms linear both }
${P}[data-fx="wail"] .lg-banshee-hair { animation: lgrBansheeBlowHair 800ms ease-out both }
${P}[data-fx="wail"] .lg-banshee-bell { animation: lgrBansheeToll 800ms ease-out both }
/* Shatter (the answer breaks her call): the skull is thrown back stuttering, the claws clutch at it, the bells jolt
   once and hang dead. */
@keyframes lgrBansheeShatterHead { 0% { transform: none } 10% { transform: translate(-4px, -5px) rotate(-10deg) scale(.9) } 18% { transform: translate(3px, -4px) rotate(-6deg) scale(.9) } 26% { transform: translate(-2px, -4px) rotate(-8deg) scale(.91) } 34% { transform: translate(2px, -3px) rotate(-5deg) scale(.92) } 60% { transform: translateY(3px) rotate(4deg) scale(.95) } 100% { transform: none } }
@keyframes lgrBansheeShatterArmL { 0%, 100% { transform: none } 14%, 64% { transform: rotate(52deg) scale(.9) } }
@keyframes lgrBansheeShatterArmR { 0%, 100% { transform: none } 14%, 64% { transform: rotate(-52deg) scale(.9) } }
@keyframes lgrBansheeJolt { 0%, 100% { transform: none } 8% { transform: rotate(-18deg) } 18% { transform: rotate(8deg) } 26%, 80% { transform: rotate(2deg) } }
${P}[data-fx="shatter"] .lg-banshee-head { animation: lgrBansheeShatterHead 1000ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-fx="shatter"] .lg-banshee-armL { animation: lgrBansheeShatterArmL 1000ms ease-in-out both }
${P}[data-fx="shatter"] .lg-banshee-armR { animation: lgrBansheeShatterArmR 1000ms ease-in-out both }
${P}[data-fx="shatter"] .lg-banshee-bell { animation: lgrBansheeJolt 1000ms ease-out both }
`

export default {
  effects: {
    // Wail (medium): concentric violet-white sound rings pulse from her mouth across the arena.
    wail: () => <>
      <div className="lgx lgx-full" style={{ borderRadius: '50%', background: `radial-gradient(circle at 50% 45%, rgba(180,140,255,.45) 0, transparent 60%)`, animation: anim('lgxFade', 760) }} />
      {wave('a', PALE, 0, 1.6, 4)}{wave('b', VIOLET, 120, 2.1, 4)}{wave('c', PALE, 240, 2.6, 3)}{wave('d', VIOLET, 360, 3.1, 2)}
    </>,
    // Shatter (big): the arena cracks like glass, a full crack web, and the shards fall away.
    shatter: () => <>
      {flash(PALE)}
      <svg className="lgx" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ left: '-15%', top: '-15%', width: '130%', height: '130%', overflow: 'visible', animation: anim('lgrBansheeWeb', 1150, 0, 'linear') }}>
        <g fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 2px ${VIOLET})` }}>
          {SPOKES.map(([x, y], i) => <path key={i} pathLength="100" d={`M50 45 L${(50 + x) / 2 + (i % 2 ? 3 : -3)} ${(45 + y) / 2} L${x} ${y}`} style={{ strokeDasharray: 100, animation: anim('lgrBansheeDraw', 220, i * 12, 'ease-out') }} />)}
          <polygon points={RING1} pathLength="100" style={{ strokeDasharray: 100, animation: anim('lgrBansheeDraw', 240, 120, 'ease-out') }} />
          <polygon points={RING2} pathLength="100" style={{ strokeDasharray: 100, animation: anim('lgrBansheeDraw', 260, 200, 'ease-out') }} />
        </g>
      </svg>
      {around(14, (i) => <div key={i} className="lgx" style={{ left: `${6 + i * 6.6}%`, top: `${20 + (i % 4) * 15}%`, width: 10 + (i % 3) * 5, height: 14 + (i % 2) * 6, background: i % 3 ? 'rgba(239,228,255,.9)' : VIOLET, clipPath: 'polygon(50% 0, 100% 70%, 30% 100%, 0 40%)', '--spin': `${(i % 2 ? 1 : -1) * (120 + i * 9)}deg`, animation: anim('lgxFall', 560, 560 + (i % 5) * 40, 'ease-in') }} />)}
    </>,
  },
  floaters: { wail: 'lg_fx_screamWail', shatter: 'lg_fx_screamShatter' },
  floaterTone: { wail: 'purple', shatter: 'ink' },
  demo: { wail: { kind: 'miss', damage: 0, lives: 1 }, shatter: { kind: 'hit', damage: 4, lives: 0 } },
  juice: {
    wail: { size: 'medium', shake: 1, flash: 1, hitstop: 1, sfx: 'banshee.wail' },
    shatter: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'banshee.shatter' },
  },
  // Reactions on the boss art box. Wail: a tall stretch (scaleY 1.15, scaleX .92) with a fast tremble. Choke: she is
  // compressed (scaleY .88), jolted 6 px down, and shudders back.
  css: `
.lgr-banshee-wail { animation: lgrBansheeWail 800ms ease-out both; transform-origin: 50% 100% }
.lgr-banshee-shatter { animation: lgrBansheeChoke 900ms ${SETTLE} both; transform-origin: 50% 100% }
.lg-boss[data-phase="3"] .lgr-banshee-wail { animation-name: lgrBansheeWailP3 }
@keyframes lgrBansheeWail { 0% { transform: none } 18% { transform: scale(.92, 1.15) } 26% { transform: scale(.92, 1.15) translateX(-1.5px) } 34% { transform: scale(.92, 1.15) translateX(1.5px) } 42% { transform: scale(.92, 1.15) translateX(-1.5px) } 50% { transform: scale(.92, 1.15) translateX(1.5px) } 58% { transform: scale(.92, 1.15) translateX(-1px) } 66% { transform: scale(.92, 1.15) } 100% { transform: none } }
@keyframes lgrBansheeWailP3 { 0% { transform: none } 18% { transform: scale(.9, 1.2) } 26% { transform: scale(.9, 1.2) translateX(-2px) } 34% { transform: scale(.9, 1.2) translateX(2px) } 42% { transform: scale(.9, 1.2) translateX(-2px) } 50% { transform: scale(.9, 1.2) translateX(2px) } 58% { transform: scale(.9, 1.2) translateX(-1.5px) } 66% { transform: scale(.9, 1.2) } 100% { transform: none } }
@keyframes lgrBansheeChoke { 0% { transform: none } 14% { transform: translateY(6px) scale(1.04, .88) } 24% { transform: translate(-2px, 6px) scale(1.04, .88) } 32% { transform: translate(2px, 5px) scale(1.04, .9) } 40% { transform: translate(-1.5px, 5px) scale(1.03, .92) } 48% { transform: translate(1px, 4px) scale(1.02, .94) } 100% { transform: none } }
@keyframes lgrBansheeRing { 0% { transform: translate(-50%, -50%) scale(.15); opacity: 1 } 100% { transform: translate(-50%, -50%) scale(var(--s, 2)); opacity: 0 } }
@keyframes lgrBansheeDraw { 0% { stroke-dashoffset: 100 } 100% { stroke-dashoffset: 0 } }
@keyframes lgrBansheeWeb { 0% { opacity: 1 } 55% { opacity: 1 } 100% { opacity: 0 } }
/* THE REAL PARTS: the state layer this ability draws on the boss (its lg-ab-* group in raids/banshee.svg) moves with
   the moment, not only the whole figure. Played only while data-fx is set (never in focus mode, with Still bosses or
   under reduced motion). */
@keyframes lgrBansheeScreamPulse { 0%, 100% { transform: none; filter: none } 40% { transform: scale(1.18); filter: brightness(1.7) saturate(1.3) } }
.lg-boss[data-fx="wail"] [class*="lg-ab-scream-"] { transform-box: fill-box; transform-origin: center; animation: lgrBansheeScreamPulse 700ms cubic-bezier(.22,1,.36,1) both }
${PARTS_CSS}
`,
}
