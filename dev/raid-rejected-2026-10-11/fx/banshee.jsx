// What the Banshee's raid ability (scream: Call and Response) LOOKS like. The fx contract is in fx/index.js, the juice
// numbers in fx/_juice.js, the design in design-v2.md section 18. Fixed bright colors (never theme tokens).
import { anim, around } from './_kit'

const SETTLE = 'cubic-bezier(.22,1,.36,1)'
const ICE = '#bff8ff'
const CYAN = '#7ff0ff'
const VIOLET = '#b48cff'
const PALE = '#efe4ff'
const GREEN = '#7dff9a' // the wail is a VIOLET and GREEN sound shock; the shatter is WHITE and ICE BLUE glass
const SHOCK = '#d9ff6a'
const MOUTH_Y = '45%' // her mouth, about this far down the box in every phase (the same face in all three)

// THE WAIL: her scream drawn as a waveform. Two jagged halves burst out from her mouth's corners to the arena's edges
// (never across her face), their peaks thrashing; a sound you can SEE, not a ring.
const WAVE = (amp, seed) => {
  let d = 'M0 50'
  for (let i = 1; i <= 24; i++) { const x = (i / 24) * 100, k = Math.sin(i * 1.7 + seed) * 0.6 + Math.sin(i * 0.53 + seed * 2) * 0.4; d += ` L${x.toFixed(1)} ${(50 + k * amp * (1 - i / 34)).toFixed(1)}` }
  return d
}
const waveHalf = (side, delay, amp, color, w, seed) => (
  <svg key={`${side}${delay}`} className="lgx" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ top: `calc(${MOUTH_Y} - 18%)`, height: '36%', width: '52%', [side < 0 ? 'right' : 'left']: side < 0 ? '80%' : '77%', overflow: 'visible', transform: side < 0 ? 'scaleX(-1)' : 'none' }}>
    <g style={{ transformOrigin: '0% 50%', animation: anim('lgrBansheeWaveOut', 760, delay, 'cubic-bezier(.2,.9,.3,1)') }}>
      <path d={WAVE(amp, seed)} fill="none" stroke={color} strokeWidth={w} strokeLinejoin="miter" vectorEffect="non-scaling-stroke" style={{ transformOrigin: '50% 50%', filter: `drop-shadow(0 0 3px ${GREEN})`, animation: anim('lgrBansheeThrash', 760, delay, 'linear') }} />
    </g>
  </svg>
)
// one drowned chorister torn out of her by the scream, flung at the viewer (a hollow-eyed wailing face)
const chorister = (i) => {
  // flung out SIDEWAYS (never steeply up: in phase 3 her face sits above her mouth line and an upward chorister crossed it)
  const ang = [-165, -140, -40, -15, 195, 165][i], dist = 120 + (i % 3) * 30
  const tx = Math.cos((ang * Math.PI) / 180) * dist, ty = Math.sin((ang * Math.PI) / 180) * dist * 0.6
  return (
    <svg key={`c${i}`} className="lgx" viewBox="-8 -9 16 30" style={{ left: '50%', top: MOUTH_Y, width: 22, height: 40, marginLeft: -11, marginTop: -16, overflow: 'visible', '--tx': `${tx.toFixed(0)}px`, '--ty': `${ty.toFixed(0)}px`, '--rot': `${(i % 2 ? 1 : -1) * 24}deg`, animation: anim('lgrBansheeFling', 820, 80 + i * 40, 'cubic-bezier(.2,.8,.4,1)') }}>
      <path d="M0 -8 C4.6 -8 6.4 -4.4 6 0 C5.6 4 4 7 2.4 10 C1.6 12 1 15 0 19 C-1.4 15 -2.2 12 -3.2 9.6 C-5 6.4 -6.2 3.4 -6 0 C-5.8 -4.6 -4 -8 0 -8 Z" fill="#cdf8c9" stroke="#1d2230" strokeWidth="0.8" style={{ filter: `drop-shadow(0 0 2px ${GREEN})` }} />
      <path d="M-4.2 -2 C-4.2 -4.4 -1.2 -4.4 -1.2 -2 C-1.2 0.6 -4.2 0.6 -4.2 -2 Z M4.2 -2 C4.2 -4.4 1.2 -4.4 1.2 -2 C1.2 0.6 4.2 0.6 4.2 -2 Z M-1.6 2.4 C-0.6 1.8 0.6 1.8 1.6 2.4 C1.8 5.6 1 9.4 0 10 C-1 9.4 -1.8 5.6 -1.6 2.4 Z" fill="#0d1624" />
    </svg>
  )
}
// frost creeping in from a corner of the arena: a cluster of ice needles growing out, then melting away
const frost = (corner, i) => (
  <svg key={corner} className="lgx" viewBox="0 0 40 40" style={{ width: '34%', height: '34%', [corner.includes('t') ? 'top' : 'bottom']: '-6%', [corner.includes('l') ? 'left' : 'right']: '-6%', transform: `scale(${corner.includes('r') ? -1 : 1}, ${corner.includes('b') ? -1 : 1})`, overflow: 'visible' }}>
    <g style={{ transformOrigin: '0 0', animation: anim('lgrBansheeFrost', 900, 60 + i * 50, SETTLE) }} fill={ICE} stroke="#ffffff" strokeWidth="0.6" strokeLinejoin="miter">
      <path d="M0 0 L26 6 L10 10 Z" /><path d="M0 0 L8 26 L12 9 Z" /><path d="M0 0 L32 20 L16 15 Z" opacity=".8" /><path d="M0 0 L18 34 L14 16 Z" opacity=".8" /><path d="M6 4 L14 2 L11 6 Z M4 7 L3 15 L7 11 Z" fill="#ffffff" />
    </g>
  </svg>
)
// a SHOCK FRONT of the wail: a tall jagged bar of sound pressure sweeping out from her mouth to one side of the arena,
// violet with a sick green core; three per side, one after another (a sound you can see hit, never a ring)
const SHOCK_BAR = 'M10 0 L4 12 L12 22 L2 36 L11 48 L3 62 L12 74 L4 88 L10 100 L16 88 L9 74 L18 62 L10 48 L19 36 L10 22 L17 12 Z'
const shockFront = (side, i) => (
  <svg key={`s${side}${i}`} className="lgx" viewBox="0 0 22 100" preserveAspectRatio="none" style={{ top: `calc(${MOUTH_Y} - ${30 - i * 4}%)`, height: `${60 - i * 8}%`, width: '9%', left: side < 0 ? '13%' : '78%', overflow: 'visible', '--dx': `${side * (30 - i * 4)}%`, animation: anim('lgrBansheeShock', 700, 60 + i * 120, 'cubic-bezier(.2,.8,.4,1)') }}>
    <path d={SHOCK_BAR} fill={VIOLET} stroke="#ffffff" strokeWidth="1.4" vectorEffect="non-scaling-stroke" style={{ filter: `drop-shadow(0 0 4px ${VIOLET})` }} />
    <path d="M10 10 L7 22 L12 34 L7 48 L12 62 L7 76 L10 90" fill="none" stroke={SHOCK} strokeWidth="2.4" vectorEffect="non-scaling-stroke" style={{ filter: `drop-shadow(0 0 3px ${GREEN})` }} />
  </svg>
)
// THE SHATTER: her held note freezes into a jagged bar of ice at her mouth, cracks from the middle and falls apart;
// then the flatline: her voice cut to a thin straight line (two halves out from her face, never across it).
// two halves from her mouth's corners outward, stopping short of her face (they never cross it)
const ICE_BAR = 'M2 50 L4.8 40 L6.7 52 L9.6 34 L12.3 56 L15.2 38 L18 50 L15.2 62 L12.3 46 L9.6 66 L6.7 50 L4.8 60 Z M98 50 L95.2 40 L93.3 52 L90.4 34 L87.7 56 L84.8 38 L82 50 L84.8 62 L87.7 46 L90.4 66 L93.3 50 L95.2 60 Z'
// (no spoke straight up: in phase 3 her face sits high in the box and an upward spoke crossed it)
const SPOKES = [[86, 10], [100, 42], [92, 82], [62, 100], [30, 98], [4, 76], [0, 36], [18, 6]]

// THE DRAWING ACTS EVERY MOMENT (impact/bosses/README.md): the hook classes in raids/banshee.svg move with the arena's
// data-moment (a plain strike moment), data-assault-on (her blow on the player) and data-fx (her ability). Head, jaw,
// eyes, hair, claws and bells are wrapped parts (fill-box pivots: the head at its neck, the jaw at its hinge, each bell
// from its rope, each arm at the shoulder, the phase 3 claws from below). Every move ends on the drawn pose.
const P = '.lg-boss[data-motif="banshee"]'
// Pivots, measured on each phase's drawing (fill-box percentages of the hook's own box): the head at the top of her
// neck, the jaw at its hinge, each eye at its centre, the hair at its roots, each bell at its chain's hook, each arm at
// its shoulder (P1 both hands on her keys, P2 her right claw flung up beside her face, the left still on the keys, P3
// she conducts: her left claw thrown up to the sky (armR, viewer right), her right claw flung down at you (armL)).
const PARTS_CSS = `
${P} :is(.lg-banshee-head, .lg-banshee-jaw, .lg-banshee-eye, .lg-banshee-hair, .lg-banshee-bell, .lg-banshee-armL, .lg-banshee-armR, .lg-banshee-pipes) { transform-box: fill-box }
${P} .lg-banshee-pipes { transform-origin: 50% 100% }
${P} .lg-banshee-head { transform-origin: 50% 110% }
${P} .lg-banshee-jaw { transform-origin: 50% 0% }
${P} .lg-banshee-eye { transform-origin: 50% 50% }
${P} .lg-banshee-hair { transform-origin: 50% 0% }
${P} .lg-banshee-bell { transform-origin: 50% 0% }
${P} .lg-banshee-armL { transform-origin: 25% 0% }
${P} .lg-banshee-armR { transform-origin: 75% 0% }
${P}[data-phase="2"] .lg-banshee-armL { transform-origin: 73% 90% }
/* HIT: the scream is cut off: her head snaps back and the jaw clamps shut, the eyes pinch, the bells jangle. */
@keyframes lgrBansheeHitHead { 0% { transform: none} 12% { transform: rotate(-6deg) scale(.95)} 34% { transform: rotate(3deg)} 60% { transform: rotate(-1deg)} 100% { transform: none} }
@keyframes lgrBansheeHitJaw { 0% { transform: none } 10%, 34% { transform: scaleY(.5) } 52% { transform: scaleY(1.08) } 100% { transform: none } }
@keyframes lgrBansheeHitEye { 0%, 100% { transform: none } 12%, 40% { transform: scale(1.2, .35) } }
@keyframes lgrBansheeJangle { 0%, 100% { transform: none } 12% { transform: rotate(14deg) } 30% { transform: rotate(-10deg) } 48% { transform: rotate(6deg) } 66% { transform: rotate(-3deg) } 84% { transform: rotate(1deg) } }
${P}[data-moment="hit"] .lg-banshee-head { animation: lgrBansheeHitHead 520ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="hit"] .lg-banshee-jaw { animation: lgrBansheeHitJaw 520ms ease-out both }
${P}[data-moment="hit"] .lg-banshee-eye { animation: lgrBansheeHitEye 520ms ease-out both }
${P}[data-moment="hit"] .lg-banshee-bell { animation: lgrBansheeJangle 700ms ease-out both }
/* CRITICAL: a shriek of pain: the head whips aside and shears, the jaw unhinges, the claws fly up, the hair flares and
   every bell swings wild. */
@keyframes lgrBansheeCritHead { 0% { transform: none} 12% { transform: rotate(-7deg)} 32% { transform: rotate(4deg)} 56% { transform: rotate(-2deg)} 78% { transform: rotate(1deg)} 100% { transform: none} }
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
@keyframes lgrBansheeCutHead { 0% { transform: none} 10% { transform: skewY(10deg)} 26% { transform: skewY(-7deg)} 44% { transform: skewY(3deg)} 66% { transform: skewY(-1deg)} 100% { transform: none} }
@keyframes lgrBansheeCutEye { 0%, 100% { transform: none } 10%, 50% { transform: scale(1.1, .2) } }
@keyframes lgrBansheeCutArmL { 0%, 100% { transform: none } 14% { transform: rotate(-22deg) translateY(3px) } 50% { transform: rotate(-8deg) } }
${P}[data-moment="sharpen"] .lg-banshee-head { animation: lgrBansheeCutHead 600ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="sharpen"] .lg-banshee-eye { animation: lgrBansheeCutEye 600ms ease-out both }
${P}[data-moment="sharpen"] .lg-banshee-armL { animation: lgrBansheeCutArmL 600ms ease-out both }
/* HER BLOW ON THE PLAYER (data-assault-on): she draws breath (head back, jaw shut, claws pulled in), then SCREAMS at the
   camera as the sound rings leave her (impact/assault.js travelAt): the jaw gapes, the skull lunges in, both claws
   thrust out at you and the hair blows back, the scream shaking her before she settles. */
@keyframes lgrBansheeBlowHead { 0% { transform: none} 12% { transform: scale(.92)} 22% { transform: scale(1.18)} 30% { transform: scale(1.16)} 36% { transform: scale(1.16)} 42% { transform: scale(1.15)} 48% { transform: scale(1.14)} 100% { transform: none} }
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
@keyframes lgrBansheeHeavyHead { 0% { transform: none } 18% { transform: rotate(-7deg) scale(.94) } 30% { transform: scale(1.12) } 38% { transform: rotate(-1.5deg) scale(1.11) } 46% { transform: rotate(1.5deg) scale(1.11) } 54% { transform: scale(1.09) } 100% { transform: none } }
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
@keyframes lgrBansheeBlockHead { 0% { transform: none} 10% { transform: scale(1.1)} 26% { transform: rotate(8deg) scale(.9)} 50% { transform: rotate(-3deg)} 100% { transform: none} }
@keyframes lgrBansheeBlockJaw { 0% { transform: none } 10% { transform: scaleY(1.3) } 24%, 48% { transform: scaleY(.45) } 100% { transform: none } }
@keyframes lgrBansheeBlockArmL { 0%, 100% { transform: none } 26%, 50% { transform: rotate(44deg) scale(.95) } }
@keyframes lgrBansheeBlockArmR { 0%, 100% { transform: none } 26%, 50% { transform: rotate(-44deg) scale(.95) } }
${P}[data-moment="block"] .lg-banshee-head { animation: lgrBansheeBlockHead 640ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="block"] .lg-banshee-jaw { animation: lgrBansheeBlockJaw 640ms ease-out both }
${P}[data-moment="block"] .lg-banshee-armL { animation: lgrBansheeBlockArmL 640ms ease-in-out both }
${P}[data-moment="block"] .lg-banshee-armR { animation: lgrBansheeBlockArmR 640ms ease-in-out both }
/* SAVED: her scream bounces off the shield and back into her: claws clap to her head, the skull shudders, the jaw
   gulps shut and the bells shiver. */
@keyframes lgrBansheeShieldHead { 0%, 100% { transform: none} 14% { transform: scale(.92)} 24% { transform: rotate(-5deg) scale(.93)} 34% { transform: rotate(5deg) scale(.93)} 44% { transform: rotate(-3deg)} 54% { transform: rotate(2deg)} 70% { transform: none} }
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
@keyframes lgrBansheeWindHead { 0%, 100% { transform: none} 35%, 70% { transform: rotate(5deg) scale(.95)} }
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
   eyes go out, the hands fall, her pipes shudder and sink silent and she bows her head over her keys. data-down HOLDS that fallen pose
   (the same values as the last keyframes) so she stays defeated on the result screen. */
@keyframes lgrBansheeKoHead { 0% { transform: none} 12% { transform: rotate(-9deg) scale(1.06)} 16% { transform: rotate(-9deg) scale(1.06)} 20% { transform: rotate(-9deg) scale(1.06)} 24% { transform: rotate(-9deg) scale(1.06)} 30% { transform: rotate(-8deg) scale(1.05)} 62% { transform: rotate(10deg) scale(.92)} 80% { transform: rotate(7deg) scale(.94)} 100% { transform: rotate(8deg) scale(.93)} }
@keyframes lgrBansheeKoJaw { 0% { transform: none } 10%, 30% { transform: scaleY(1.65) } 64% { transform: scaleY(.5) } 100% { transform: scaleY(.55) } }
@keyframes lgrBansheeKoArmL { 0% { transform: none } 12%, 32% { transform: rotate(34deg) } 62% { transform: rotate(-24deg) translateY(5px) } 100% { transform: rotate(-18deg) translateY(4px) } }
@keyframes lgrBansheeKoArmR { 0% { transform: none } 12%, 32% { transform: rotate(-34deg) } 62% { transform: rotate(24deg) translateY(5px) } 100% { transform: rotate(18deg) translateY(4px) } }
@keyframes lgrBansheeKoEye { 0% { transform: none } 12%, 30% { transform: scale(1.5) } 56%, 100% { transform: scale(1, .08) } }
@keyframes lgrBansheeKoHair { 0% { transform: none } 12%, 30% { transform: scale(1.15, 1.12) } 70%, 100% { transform: scale(.94, .88) translateY(2px) } }
${P}[data-moment="ko"] .lg-banshee-head { animation: lgrBansheeKoHead 2000ms ease-in-out both }
${P}[data-moment="ko"] .lg-banshee-jaw { animation: lgrBansheeKoJaw 2000ms ease-in-out both }
${P}[data-moment="ko"] .lg-banshee-armL { animation: lgrBansheeKoArmL 2000ms ease-in-out both }
${P}[data-moment="ko"] .lg-banshee-armR { animation: lgrBansheeKoArmR 2000ms ease-in-out both }
${P}[data-moment="ko"] .lg-banshee-eye { animation: lgrBansheeKoEye 2000ms ease-in-out both }
${P}[data-moment="ko"] .lg-banshee-hair { animation: lgrBansheeKoHair 2000ms ease-in-out both }
@keyframes lgrBansheeKoPipes { 0% { transform: none } 10% { transform: scale(1.04, 1.06) } 16% { transform: scale(1.02, 1.04) translateX(-1px) } 22% { transform: scale(1.03, 1.05) translateX(1px) } 30% { transform: scale(1.02, 1.03) } 70%, 100% { transform: scale(.94, .86) translateY(3px) } }
${P}[data-moment="ko"] .lg-banshee-pipes { animation: lgrBansheeKoPipes 2000ms ease-in-out both }
${P}[data-moment="ko"] .lg-banshee-bell { animation: lgrBansheeSwing 1400ms ease-out both }
${P}[data-down]:not([data-moment="ko"]) .lg-banshee-head { transform: rotate(8deg) scale(.93) }
${P}[data-down]:not([data-moment="ko"]) .lg-banshee-jaw { transform: scaleY(.55) }
${P}[data-down]:not([data-moment="ko"]) .lg-banshee-armL { transform: rotate(-18deg) translateY(4px) }
${P}[data-down]:not([data-moment="ko"]) .lg-banshee-armR { transform: rotate(18deg) translateY(4px) }
${P}[data-down]:not([data-moment="ko"]) .lg-banshee-eye { transform: scale(1, .08) }
${P}[data-down]:not([data-moment="ko"]) .lg-banshee-hair { transform: rotate(8deg) scale(.93) }
${P}[data-down]:not([data-moment="ko"]) .lg-banshee-pipes { transform: scale(.94, .86) translateY(3px) }
/* HER ABILITY, acted by the drawing.
   Wail (the call): she conducts it: both claws rise, the skull trembles with the note, the bells ring one after
   another, the hair streams. */
@keyframes lgrBansheeWailArmL { 0%, 100% { transform: none } 18%, 66% { transform: rotate(24deg) scale(1.08) } }
@keyframes lgrBansheeWailArmR { 0%, 100% { transform: none } 18%, 66% { transform: rotate(-24deg) scale(1.08) } }
@keyframes lgrBansheeWailHead { 0%, 100% { transform: none} 18% { transform: none} 26% { transform: none} 34% { transform: none} 42% { transform: none} 50% { transform: none} 58% { transform: none} 66% { transform: none} }
${P}[data-fx="wail"] .lg-banshee-armL { animation: lgrBansheeWailArmL 800ms ease-in-out both }
${P}[data-fx="wail"] .lg-banshee-armR { animation: lgrBansheeWailArmR 800ms ease-in-out both }
${P}[data-fx="wail"] .lg-banshee-head { animation: lgrBansheeWailHead 800ms linear both }
${P}[data-fx="wail"] .lg-banshee-hair { animation: lgrBansheeBlowHair 800ms ease-out both }
${P}[data-fx="wail"] .lg-banshee-bell { animation: lgrBansheeToll 800ms ease-out both }
/* Shatter (the answer breaks her call): the skull is thrown back stuttering, the claws clutch at it, the bells jolt
   once and hang dead. */
@keyframes lgrBansheeShatterHead { 0% { transform: none} 10% { transform: rotate(-10deg) scale(.9)} 18% { transform: rotate(-6deg) scale(.9)} 26% { transform: rotate(-8deg) scale(.91)} 34% { transform: rotate(-5deg) scale(.92)} 60% { transform: rotate(4deg) scale(.95)} 100% { transform: none} }
@keyframes lgrBansheeShatterArmL { 0%, 100% { transform: none } 14%, 64% { transform: rotate(52deg) scale(.9) } }
@keyframes lgrBansheeShatterArmR { 0%, 100% { transform: none } 14%, 64% { transform: rotate(-52deg) scale(.9) } }
@keyframes lgrBansheeJolt { 0%, 100% { transform: none } 8% { transform: rotate(-18deg) } 18% { transform: rotate(8deg) } 26%, 80% { transform: rotate(2deg) } }
${P}[data-fx="shatter"] .lg-banshee-head { animation: lgrBansheeShatterHead 1000ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-fx="shatter"] .lg-banshee-armL { animation: lgrBansheeShatterArmL 1000ms ease-in-out both }
${P}[data-fx="shatter"] .lg-banshee-armR { animation: lgrBansheeShatterArmR 1000ms ease-in-out both }
${P}[data-fx="shatter"] .lg-banshee-bell { animation: lgrBansheeJolt 1000ms ease-out both }
/* PHASE 3: she conducts her killing note, the left claw thrown up to the sky (armR, its forearm and hand the hook
   foreR, folding at the elbow) and the right claw flung down at you (armL). Each moment moves them its OWN way, small
   enough to stay inside the clip; the knockout folds the raised forearm down across her at the elbow, sinks both arms and shuts
   her mouth (the open shriek gives way to lg-banshee-shut), held by data-down. Last, so it wins. */
${P}[data-phase="3"] .lg-banshee-armL { transform-origin: 90.5% 9.6% }
${P}[data-phase="3"] .lg-banshee-armR { transform-origin: 10.5% 95.4% }
${P} .lg-banshee-foreR { transform-box: fill-box; transform-origin: 19.7% 96.5% }
@keyframes lgrBansheeP3HitFore { 0%, 100% { transform: none } 18% { transform: rotate(-12deg) } 46% { transform: rotate(3deg) } }
@keyframes lgrBansheeP3CritR { 0%, 100% { transform: none } 16% { transform: rotate(-9deg) } 50% { transform: rotate(3deg) } }
@keyframes lgrBansheeP3CritFore { 0%, 100% { transform: none } 16% { transform: rotate(-14deg) } 50% { transform: rotate(-4deg) } }
@keyframes lgrBansheeP3CutL { 0%, 100% { transform: none } 14% { transform: rotate(-16deg) } 50% { transform: rotate(-5deg) } }
@keyframes lgrBansheeP3BlowL { 0% { transform: none } 14% { transform: rotate(-8deg) scale(.95) } 28%, 50% { transform: rotate(3deg) scale(1.05) } 100% { transform: none } }
@keyframes lgrBansheeP3BlowFore { 0% { transform: none } 14% { transform: rotate(-4deg) } 28%, 50% { transform: rotate(-16deg) } 100% { transform: none } }
@keyframes lgrBansheeP3HeavyR { 0% { transform: none } 18% { transform: rotate(-10deg) } 34%, 56% { transform: rotate(-6deg) } 100% { transform: none } }
@keyframes lgrBansheeP3HeavyL { 0% { transform: none } 18% { transform: rotate(-10deg) } 34%, 56% { transform: rotate(-6deg) scale(1.04) } 100% { transform: none } }
@keyframes lgrBansheeP3BlockFore { 0%, 100% { transform: none } 22%, 50% { transform: rotate(-38deg) } }
@keyframes lgrBansheeP3ShieldL { 0%, 100% { transform: none } 18%, 60% { transform: rotate(2deg) } }
@keyframes lgrBansheeP3ShieldFore { 0%, 100% { transform: none } 18%, 60% { transform: rotate(-28deg) } }
@keyframes lgrBansheeP3WindR { 0%, 100% { transform: none } 35%, 70% { transform: rotate(5deg) } }
@keyframes lgrBansheeP3WindFore { 0%, 100% { transform: none } 35%, 70% { transform: rotate(-24deg) } }
@keyframes lgrBansheeP3WindL { 0%, 100% { transform: none } 35%, 70% { transform: rotate(-12deg) } }
@keyframes lgrBansheeP3WailR { 0%, 100% { transform: none } 18%, 66% { transform: rotate(-6deg) } }
@keyframes lgrBansheeP3WailFore { 0%, 100% { transform: none } 18% { transform: rotate(-14deg) } 34% { transform: rotate(-6deg) } 50% { transform: rotate(-14deg) } 66% { transform: rotate(-6deg) } }
@keyframes lgrBansheeP3WailL { 0%, 100% { transform: none } 18%, 66% { transform: rotate(4deg) } }
@keyframes lgrBansheeP3ShatterFore { 0%, 100% { transform: none } 14%, 64% { transform: rotate(-55deg) } }
@keyframes lgrBansheeP3ShatterL { 0%, 100% { transform: none } 14%, 64% { transform: rotate(3deg) } }
@keyframes lgrBansheeP3KoR { 0% { transform: none } 12%, 30% { transform: rotate(-6deg) } 64% { transform: rotate(10deg) } 100% { transform: rotate(8deg) } }
@keyframes lgrBansheeP3KoFore { 0%, 30% { transform: none } 64% { transform: rotate(-150deg) } 100% { transform: rotate(-145deg) } }
@keyframes lgrBansheeP3KoL { 0% { transform: none } 12%, 30% { transform: rotate(2deg) } 64% { transform: rotate(-12deg) } 100% { transform: rotate(-10deg) } }
${P}[data-phase="3"]:is([data-moment], [data-assault-on], [data-fx]) :is(.lg-banshee-armL, .lg-banshee-armR) { animation: none }
${P}[data-phase="3"][data-moment="hit"] .lg-banshee-foreR { animation: lgrBansheeP3HitFore 520ms ease-out both }
${P}[data-phase="3"][data-moment="crit"] .lg-banshee-armR { animation: lgrBansheeP3CritR 640ms ease-out both }
${P}[data-phase="3"][data-moment="crit"] .lg-banshee-foreR { animation: lgrBansheeP3CritFore 640ms ease-out both }
${P}[data-phase="3"][data-moment="sharpen"] .lg-banshee-armL { animation: lgrBansheeP3CutL 600ms ease-out both }
${P}[data-phase="3"][data-assault-on] .lg-banshee-armL { animation: lgrBansheeP3BlowL 820ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-phase="3"][data-assault-on] .lg-banshee-foreR { animation: lgrBansheeP3BlowFore 820ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-phase="3"]:is([data-moment="hurtBig"], [data-assault-on][data-moment="hurtBig"]) .lg-banshee-armR { animation: lgrBansheeP3HeavyR 900ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-phase="3"]:is([data-moment="hurtBig"], [data-assault-on][data-moment="hurtBig"]) .lg-banshee-armL { animation: lgrBansheeP3HeavyL 900ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-phase="3"][data-moment="block"] .lg-banshee-foreR { animation: lgrBansheeP3BlockFore 640ms ease-in-out both }
${P}[data-phase="3"][data-moment="shield"] .lg-banshee-armL { animation: lgrBansheeP3ShieldL 760ms ease-in-out both }
${P}[data-phase="3"][data-moment="shield"] .lg-banshee-foreR { animation: lgrBansheeP3ShieldFore 760ms ease-in-out both }
${P}[data-phase="3"][data-moment="wind"] .lg-banshee-armR { animation: lgrBansheeP3WindR 1000ms ease-in-out both }
${P}[data-phase="3"][data-moment="wind"] .lg-banshee-foreR { animation: lgrBansheeP3WindFore 1000ms ease-in-out both }
${P}[data-phase="3"][data-moment="wind"] .lg-banshee-armL { animation: lgrBansheeP3WindL 1000ms ease-in-out both }
${P}[data-phase="3"][data-fx="wail"] .lg-banshee-armR { animation: lgrBansheeP3WailR 800ms ease-in-out both }
${P}[data-phase="3"][data-fx="wail"] .lg-banshee-foreR { animation: lgrBansheeP3WailFore 800ms ease-in-out both }
${P}[data-phase="3"][data-fx="wail"] .lg-banshee-armL { animation: lgrBansheeP3WailL 800ms ease-in-out both }
${P}[data-phase="3"][data-fx="shatter"] .lg-banshee-foreR { animation: lgrBansheeP3ShatterFore 1000ms ease-in-out both }
${P}[data-phase="3"][data-fx="shatter"] .lg-banshee-armL { animation: lgrBansheeP3ShatterL 1000ms ease-in-out both }
${P}[data-phase="3"][data-moment="ko"] .lg-banshee-armR { animation: lgrBansheeP3KoR 2000ms ease-in-out both }
${P}[data-phase="3"][data-moment="ko"] .lg-banshee-foreR { animation: lgrBansheeP3KoFore 2000ms ease-in-out both }
${P}[data-phase="3"][data-moment="ko"] .lg-banshee-armL { animation: lgrBansheeP3KoL 2000ms ease-in-out both }
${P}[data-phase="3"][data-down]:not([data-moment="ko"]) .lg-banshee-armR { transform: rotate(8deg) }
${P}[data-phase="3"][data-down]:not([data-moment="ko"]) .lg-banshee-foreR { transform: rotate(-145deg) }
${P}[data-phase="3"][data-down]:not([data-moment="ko"]) .lg-banshee-armL { transform: rotate(-10deg) }
/* PHASE 2: her right claw is already up beside her face, so the big keyboard-pose swings would throw it past the
   arena's clip (check-moment-clip.mjs): in phase 2 it flinches, rears and sinks within the frame. */
@keyframes lgrBansheeP2CutArmL { 0%, 100% { transform: none } 14% { transform: rotate(-8deg) translateY(2px) } 50% { transform: rotate(-3deg) } }
@keyframes lgrBansheeP2HeavyArmL { 0% { transform: none } 18% { transform: rotate(10deg) } 32% { transform: rotate(4deg) scale(1.06) } 58% { transform: rotate(3deg) scale(1.04) } 100% { transform: none } }
@keyframes lgrBansheeP2KoArmL { 0% { transform: none } 12%, 32% { transform: rotate(8deg) } 62% { transform: rotate(-7deg) translateY(5px) } 100% { transform: rotate(-5deg) translateY(4px) } }
@keyframes lgrBansheeP2KoPipes { 0% { transform: none } 10% { transform: scale(1.02, 1.01) } 16% { transform: scale(1.01, 1.01) translateX(-1px) } 22% { transform: scale(1.02, 1.01) translateX(1px) } 30% { transform: scale(1.01, 1.01) } 70%, 100% { transform: scale(.94, .86) translateY(3px) } }
${P}[data-phase="2"][data-moment="sharpen"] .lg-banshee-armL { animation-name: lgrBansheeP2CutArmL }
${P}[data-phase="2"]:is([data-moment="hurtBig"], [data-assault-on][data-moment="hurtBig"]) .lg-banshee-armL { animation-name: lgrBansheeP2HeavyArmL }
${P}[data-phase="2"][data-moment="ko"] .lg-banshee-armL { animation-name: lgrBansheeP2KoArmL }
${P}[data-phase="2"][data-moment="ko"] .lg-banshee-pipes { animation-name: lgrBansheeP2KoPipes }
${P}[data-phase="2"][data-down]:not([data-moment="ko"]) .lg-banshee-armL { transform: rotate(-5deg) translateY(4px) }
/* HEAD ON THE NECK (check-joints.mjs): head and hair pivot on the same neck joint, in view-box units per phase, and the
   hair plays the head's own animation in every moment, so neither ever parts from her neck. */
${P} :is(.lg-banshee-head, .lg-banshee-hair) { transform-box: view-box; transform-origin: 59.3px 68.5px }
${P}[data-phase="2"] :is(.lg-banshee-head, .lg-banshee-hair) { transform-origin: 60px 71.2px }
${P}[data-phase="3"] :is(.lg-banshee-head, .lg-banshee-hair) { transform-origin: 56.4px 73.5px }
${P}[data-moment="hit"] .lg-banshee-hair { animation: lgrBansheeHitHead 520ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="crit"] .lg-banshee-hair { animation: lgrBansheeCritHead 640ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="sharpen"] .lg-banshee-hair { animation: lgrBansheeCutHead 600ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-assault-on] .lg-banshee-hair { animation: lgrBansheeBlowHead 820ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-moment="block"] .lg-banshee-hair { animation: lgrBansheeBlockHead 640ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="shield"] .lg-banshee-hair { animation: lgrBansheeShieldHead 760ms ease-out both }
${P}[data-moment="wind"] .lg-banshee-hair { animation: lgrBansheeWindHead 1000ms ease-in-out both }
${P}[data-moment="ko"] .lg-banshee-hair { animation: lgrBansheeKoHead 2000ms ease-in-out both }
${P}[data-fx="wail"] .lg-banshee-hair { animation: lgrBansheeWailHead 800ms linear both }
${P}[data-fx="shatter"] .lg-banshee-hair { animation: lgrBansheeShatterHead 1000ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="hurtBig"] .lg-banshee-hair, ${P}[data-assault-on][data-moment="hurtBig"] .lg-banshee-hair { animation: lgrBansheeHeavyHead 900ms cubic-bezier(.3,.7,.3,1) both }
/* PHASE 3's wail is already open wide: the jaw only flexes a little, so it never stretches past her chin. */
@keyframes lgrBansheeP3JawOpen { 0%, 100% { transform: none } 20%, 55% { transform: scaleY(1.1) } }
@keyframes lgrBansheeP3JawShut { 0%, 100% { transform: none } 15%, 45% { transform: scaleY(.62) } }
@keyframes lgrBansheeP3KoJaw { 0% { transform: none; opacity: 1 } 10%, 30% { transform: scaleY(1.1); opacity: 1 } 56% { transform: scaleY(.7); opacity: 1 } 64%, 100% { transform: scaleY(.7); opacity: 0 } }
@keyframes lgrBansheeP3KoShut { 0%, 56% { opacity: 0 } 64%, 100% { opacity: 1 } }
${P}[data-phase="3"]:is([data-moment="hit"], [data-moment="block"], [data-moment="shield"]) .lg-banshee-jaw { animation: lgrBansheeP3JawShut 600ms ease-out both }
${P}[data-phase="3"]:is([data-moment="crit"], [data-moment="hurtBig"], [data-moment="wind"]) .lg-banshee-jaw { animation: lgrBansheeP3JawOpen 800ms ease-out both }
${P}[data-phase="3"][data-assault-on] .lg-banshee-jaw { animation: lgrBansheeP3JawOpen 820ms ease-out both }
${P}[data-phase="3"][data-moment="ko"] .lg-banshee-jaw { animation: lgrBansheeP3KoJaw 2000ms ease-in-out both }
${P}[data-phase="3"][data-down]:not([data-moment="ko"]) .lg-banshee-jaw { opacity: 0 }
${P}[data-phase="3"][data-moment="ko"] .lg-banshee-shut { display: inline !important; animation: lgrBansheeP3KoShut 2000ms ease-in-out both }
${P}[data-phase="3"][data-down]:not([data-moment="ko"]) .lg-banshee-shut { display: inline !important }
`

export default {
  effects: {
    // Wail (medium): a VIOLET and GREEN sound shock: jagged pressure fronts sweep out from her mouth to both edges, the
    // waveforms thrash out of her mouth's corners and the drowned choir is flung out at you, glowing sick green. Nothing
    // is laid over her figure (a soft colour bloom over her face was cut: her face stays readable through the call).
    wail: () => <>
      {[0, 1, 2].map((i) => shockFront(-1, i))}{[0, 1, 2].map((i) => shockFront(1, i))}
      {waveHalf(-1, 0, 30, SHOCK, 2.6, 1)}{waveHalf(1, 0, 30, SHOCK, 2.6, 2)}
      {waveHalf(-1, 110, 44, GREEN, 1.8, 3)}{waveHalf(1, 110, 44, GREEN, 1.8, 4)}
      {waveHalf(-1, 220, 22, VIOLET, 1.4, 5)}{waveHalf(1, 220, 22, VIOLET, 1.4, 6)}
      {around(6, (i) => chorister(i))}
    </>,
    // Shatter (big): WHITE and ICE BLUE glass (no white bloom over her: it hid her face), frost grows in from every corner, her note freezes into
    // bars of ice at her mouth, a crack web runs across the arena, the shards tumble down and a flatline is left.
    shatter: () => <>
      {['tl', 'tr', 'bl', 'br'].map(frost)}
      <svg className="lgx" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ left: '-8%', width: '116%', top: `calc(${MOUTH_Y} - 9%)`, height: '18%', overflow: 'visible', animation: anim('lgrBansheeIce', 1100, 0, 'linear') }}>
        <path d={ICE_BAR} fill={ICE} stroke="#ffffff" strokeWidth="1" vectorEffect="non-scaling-stroke" style={{ filter: `drop-shadow(0 0 4px ${CYAN})` }} />
        <path d="M18 50 L15.2 44 L12.3 52 L9.6 46 M15.2 44 L14.2 36 M82 50 L84.8 56 L87.7 48 L90.4 54 M84.8 56 L85.8 64" fill="none" stroke="#1d2230" strokeWidth="1.4" vectorEffect="non-scaling-stroke" pathLength="100" style={{ strokeDasharray: 100, animation: anim('lgrBansheeDraw', 200, 220, 'ease-out') }} />
      </svg>
      <svg className="lgx" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ left: '-15%', top: '-15%', width: '130%', height: '130%', overflow: 'visible', animation: anim('lgrBansheeWeb', 1150, 200, 'linear') }}>
        <g fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 2px ${CYAN})` }}>
          {SPOKES.map(([x, y], i) => <path key={i} pathLength="100" d={`M${(50 + (x - 50) * 0.78).toFixed(1)} ${(54 + (y - 54) * 0.78).toFixed(1)} L${(50 + (x - 50) * 0.88 + (i % 2 ? 3 : -3)).toFixed(1)} ${(54 + (y - 54) * 0.88).toFixed(1)} L${x} ${y}`} style={{ strokeDasharray: 100, animation: anim('lgrBansheeDraw', 220, 260 + i * 12, 'ease-out') }} />)}
        </g>
      </svg>
      {around(16, (i) => <div key={i} className="lgx" style={{ left: `${i < 8 ? 1 + i * 1.7 : 82 + (i - 8) * 1.9}%`, top: `calc(${MOUTH_Y} - ${4 + (i % 3) * 3}%)`, width: 8 + (i % 3) * 5, height: 12 + (i % 2) * 7, background: i % 4 ? 'rgba(223,252,255,.95)' : CYAN, clipPath: 'polygon(50% 0, 100% 62%, 34% 100%, 0 38%)', '--spin': `${(i % 2 ? 1 : -1) * (140 + i * 11)}deg`, animation: anim('lgxFall', 620, 440 + (i % 6) * 35, 'ease-in') }} />)}
      <div className="lgx" style={{ left: '-10%', width: '120%', top: MOUTH_Y, height: 3, background: 'linear-gradient(90deg, #ffffff 0 29%, transparent 29% 71%, #ffffff 71%)', filter: `drop-shadow(0 0 4px ${CYAN})`, animation: anim('lgrBansheeFlatline', 1150, 0, 'linear') }} />
    </>,
  },
  floaters: { wail: 'lg_fx_screamWail', shatter: 'lg_fx_screamShatter' },
  floaterTone: { wail: 'purple', shatter: 'ink' },
  demo: { wail: { kind: 'miss', damage: 0, lives: 1 }, shatter: { kind: 'hit', damage: 4, lives: 0 } },
  juice: {
    wail: { size: 'medium', shake: 1, flash: 0, hitstop: 1, sfx: 'banshee.wail' }, // no flash: her phase 3 light washed out to a white disk
    shatter: { size: 'big', shake: 2, flash: 1, hitstop: 1, sfx: 'banshee.shatter' }, // flash 1: a white silhouette held by the hit-stop hid her
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
@keyframes lgrBansheeWaveOut { 0% { transform: scaleX(0); opacity: 1 } 40% { transform: scaleX(1); opacity: 1 } 75% { opacity: .9 } 100% { transform: scaleX(1.06); opacity: 0 } }
@keyframes lgrBansheeThrash { 0%, 100% { transform: scaleY(1) } 15% { transform: scaleY(-1.2) } 30% { transform: scaleY(.8) } 45% { transform: scaleY(-1) } 60% { transform: scaleY(1.3) } 80% { transform: scaleY(-.6) } }
@keyframes lgrBansheeFling { 0% { transform: translate(calc(var(--tx) * .55), calc(var(--ty) * .55)) scale(.5) rotate(0); opacity: 0 } 15% { opacity: 1 } 80% { opacity: 1 } 100% { transform: translate(var(--tx), var(--ty)) scale(1.8) rotate(var(--rot)); opacity: 0 } }
@keyframes lgrBansheeFrost { 0% { transform: scale(0); opacity: 0 } 25% { transform: scale(1.1); opacity: 1 } 70% { transform: scale(1); opacity: .9 } 100% { transform: scale(.9); opacity: 0 } }
@keyframes lgrBansheeIce { 0% { transform: scaleX(.1); opacity: 0 } 12% { transform: scaleX(1); opacity: 1 } 38% { transform: scaleX(1); opacity: 1 } 42% { transform: scaleX(1.02) translateY(1px); opacity: .9 } 50% { opacity: 0 } 100% { opacity: 0 } }
@keyframes lgrBansheeFlatline { 0%, 55% { transform: scaleX(0); opacity: 0 } 65% { transform: scaleX(1); opacity: 1 } 85% { opacity: .8 } 100% { transform: scaleX(1); opacity: 0 } }
@keyframes lgrBansheeShock { 0% { transform: translateX(0) scale(.4, .5); opacity: 0 } 12% { opacity: 1 } 70% { opacity: .95 } 100% { transform: translateX(var(--dx)) scale(1.1, 1.15); opacity: 0 } }
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
