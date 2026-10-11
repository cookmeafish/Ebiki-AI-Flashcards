// What the Seraph's Verdicts (abilities/seraph.js) LOOK like. The fx contract is in fx/index.js, the juice in
// fx/_juice.js. Colors are fixed (gold judgment, white mercy, ember wrath) with a white-hot core, so they read over any
// palette. The VERDICT itself is read on the Judge's own SCALES OF JUDGMENT (raids/seraph.svg lgs-beam / lgs-panL /
// lgs-panR: held up level before her heart in phase 1, thrust out at her shoulder in phase 2, tipped to wrath, held aloft in phase 3 with Mercy's white flame burning in the left pan and Wrath's red flame in the right): wrath slams them
// down on the flame, mercy swings them and lets them settle level (spared), grace tips them to the feather.
//   wrath (big): a pillar of golden light slams down through the Judge under a fan of falling spears; the halo
//                blazes ember gold, the wings snap up, the great eye throws itself wide, white-gold, weeping light
//                (the art's lg-fx-wrath face), the scales slam to wrath.
//   mercy (big): white feathers burst from the Judge and drift toward your hearts; the wings fold in like a shelter,
//                the great eye SHUTS (lg-fx-mercy), the halo glows white, the scales swing and settle level.
//   grace (big): heaven opens: a column of holy light descends onto the Judge, a crown of turning rays flares round
//                its halo, feathers and gold motes drift through the light; the Judge rises and settles, its wings
//                spread, every red eye turns GOLD and opens wide, the scales tip to the feather.
// Boss reactions (body: .lgr-seraph-<key>): Smite (jolted up, slammed down), Bow (a slow forgiving bow), Ascend (a
// serene rise and settle). The real parts move through the hook classes in raids/seraph.svg (see the css below).
import { anim, around, ring, shards } from './_kit'

const GOLD = '#ffd23f'
const GOLD_HOT = '#fff4b8'
const WHITE = '#ffffff'
const EMBER = '#ff7a1a'
const MERCY = '#cfe7ff'
const FEATHER = 'radial-gradient(ellipse at 40% 30%, #ffffff 0%, #f8fbff 60%, #dcebff 100%)'
const GOLD_FEATHER = 'radial-gradient(ellipse at 40% 30%, #ffffff 0%, #fff6d6 50%, #ffd97a 100%)'
const STAR = 'polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%)'

// One feather: an asymmetric vane with two notches and a quill line (a pill shape read as a pill, not a feather).
const VANE = "path('M7 0 C12 5 13 14 10 22 L11.5 23 L9 24.5 C8 27 7.5 29 7 30 C6 26.5 3.5 22 1.5 17.5 L4 17 L1 13.5 C0 8 2.5 3 7 0 Z')"
const feather = (key, style, fill = FEATHER) => (
  <div key={key} className="lgx" style={{ width: 14, height: 30, filter: `drop-shadow(0 0 3px ${fill === FEATHER ? '#ffffff' : GOLD})`, ...style }}>
    <div style={{ position: 'absolute', inset: 0, clipPath: VANE, background: fill }}>
      <div style={{ position: 'absolute', left: '50%', top: '8%', bottom: '4%', width: 1.5, marginLeft: -0.75, background: fill === FEATHER ? '#a9c4ea' : '#d9a640' }} />
    </div>
  </div>
)

// A crown of turning rays round the halo (.lgrs-head sits on the halo's centre in every phase).
const crown = (color, core, delay = 0, ms = 1150) => (
  <div key="crown" className="lgx lgrs-head" style={{ width: '74%', aspectRatio: '1', marginLeft: '-37%', marginTop: '-37%', borderRadius: '50%',
    background: `repeating-conic-gradient(from 0deg, ${color} 0deg 3deg, rgba(255,255,255,0) 6deg 24deg)`,
    WebkitMaskImage: 'radial-gradient(circle, transparent 0 34%, #000 40% 58%, transparent 72%)', maskImage: 'radial-gradient(circle, transparent 0 34%, #000 40% 58%, transparent 72%)',
    filter: `drop-shadow(0 0 4px ${core})`, animation: anim('lgrSeraphCrown', ms, delay) }} />
)

// THE DRAWING ACTS EVERY MOMENT (impact/bosses/README.md). Every hook in the art is a BARE group (no transform
// attribute, no SMIL of its own). The lgs-* hooks are drawn round their own origin (local 0,0 = the wing root, the
// eye's middle, the halo's centre, the beam's pivot) and move by the individual rotate / scale / translate
// properties; the lg-seraph-* wrappers are in scene units and pivot on the points set per phase below.
const P = '.lg-boss[data-motif="seraph"]'
const ph = (n) => `${P}[data-phase="${n}"]`
const PARTS_CSS = `
${P} .lgs-wing, ${P} .lgs-eye, ${P} .lgs-halo, ${P} .lgs-beam, ${P} .lgs-panL, ${P} .lgs-panR { transform-box: view-box; transform-origin: 0 0 }
${P} .lg-seraph-head { transform-box: view-box }
${P} .lg-seraph-head { transform-origin: 60px 80px }
${P} .lg-seraph-armL, ${P} .lg-seraph-armR, ${P} .lg-seraph-handL, ${P} .lg-seraph-handR, ${P} .lg-seraph-scales { transform-box: view-box }
/* pivots (scene units): each arm at its shoulder, each hand at its wrist, the scales at the fist (P1 held up before her heart, P2 thrust out at her shoulder, P3 aloft) */
${ph(1)} .lg-seraph-armR { transform-origin: 97px 95px; --sp-drop: 10deg } ${ph(1)} .lg-seraph-handR { transform-origin: 80px 108px } ${ph(1)} .lg-seraph-scales { transform-origin: 79.25px 100px } ${ph(1)} .lg-seraph-armL { transform-origin: 23px 95px; --sp-drop: -10deg } ${ph(1)} .lg-seraph-handL { transform-origin: 41px 109px }
${ph(2)} .lg-seraph-armR { transform-origin: 97px 95px; --sp-drop: 24deg } ${ph(2)} .lg-seraph-handR { transform-origin: 118px 85px } ${ph(2)} .lg-seraph-scales { transform-origin: 117.28px 77.32px } ${ph(2)} .lg-seraph-armL { transform-origin: 23px 95px; --sp-drop: -28deg } ${ph(2)} .lg-seraph-handL { transform-origin: -5px 87px }
${ph(3)} .lg-seraph-armR { transform-origin: 98px 92px; --sp-drop: 28deg } ${ph(3)} .lg-seraph-handR { transform-origin: 119px 45px } ${ph(3)} .lg-seraph-scales { transform-origin: 118.13px 35.72px } ${ph(3)} .lg-seraph-armL { transform-origin: 22px 92px; --sp-drop: -28deg } ${ph(3)} .lg-seraph-handL { transform-origin: 3px 46px }
/* how far each pan rides when the beam tips: in the scales' own units (half span 14 x sin of the tip) */
${P} { --sp-tip: 14deg; --sp-dy: 3.39px }

/* HIT: the Judge is rocked: the cowl jerks back, the eye pinches, the wings flinch in, the scales jolt. */
@keyframes lgrSeraphMHitHead { 0% { transform: none } 12% { transform: translateY(-2px) rotate(-6deg) } 36% { transform: rotate(3deg) } 62% { transform: rotate(-1deg) } 100% { transform: none } }
@keyframes lgrSeraphMHitWing { 0%, 100% { rotate: 0deg } 12% { rotate: -9deg } 40% { rotate: 3deg } 64% { rotate: -1deg } }
@keyframes lgrSeraphMHitEye { 0%, 100% { scale: 1 } 12%, 40% { scale: 1.15 .3 } }
@keyframes lgrSeraphMHitBeam { 0%, 100% { rotate: 0deg } 14% { rotate: -9deg } 40% { rotate: 5deg } 66% { rotate: -2deg } }
@keyframes lgrSeraphMHitHalo { 0%, 100% { rotate: 0deg; scale: 1 } 14% { rotate: -10deg; scale: .93 } 44% { rotate: 4deg; scale: 1.03 } }
${P}[data-moment="hit"] .lg-seraph-head { animation: lgrSeraphMHitHead 520ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="hit"] .lgs-wing { animation: lgrSeraphMHitWing 560ms ease-out both }
${P}[data-moment="hit"] .lgs-eye { animation: lgrSeraphMHitEye 520ms ease-out both }
${P}[data-moment="hit"] .lgs-beam { animation: lgrSeraphMHitBeam 600ms ease-out both }
${P}[data-moment="hit"] .lgs-halo { animation: lgrSeraphMHitHalo 520ms ease-out both }
/* CRITICAL: the wings are blasted wide and shudder, the cowl whips aside, the halo is knocked spinning, the eye
   flares then squeezes, the scales are flung about. */
@keyframes lgrSeraphMCritWing { 0% { rotate: 0deg } 12% { rotate: 20deg } 22% { rotate: 14deg } 30% { rotate: 18deg } 40% { rotate: 12deg } 60% { rotate: 4deg } 100% { rotate: 0deg } }
@keyframes lgrSeraphMCritHead { 0% { transform: none } 12% { transform: translateX(3px) rotate(14deg) scale(.94) } 34% { transform: translateX(-1px) rotate(-7deg) } 58% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgrSeraphMCritEye { 0%, 100% { scale: 1 } 10% { scale: 1.4 1.5 } 30%, 50% { scale: 1.2 .25 } }
@keyframes lgrSeraphMCritHalo { 0% { rotate: 0deg; scale: 1 } 14% { rotate: 50deg; scale: .9; filter: brightness(1.5) } 44% { rotate: -14deg; scale: 1.06 } 72% { rotate: 4deg } 100% { rotate: 0deg; scale: 1; filter: none } }
@keyframes lgrSeraphMCritBeam { 0%, 100% { rotate: 0deg } 12% { rotate: 22deg } 30% { rotate: -16deg } 52% { rotate: 8deg } 76% { rotate: -3deg } }
${P}[data-moment="crit"] .lgs-wing { animation: lgrSeraphMCritWing 680ms ease-out both }
${P}[data-moment="crit"] .lg-seraph-head { animation: lgrSeraphMCritHead 640ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="crit"] .lgs-eye { animation: lgrSeraphMCritEye 640ms ease-out both }
${P}[data-moment="crit"] .lgs-halo { animation: lgrSeraphMCritHalo 680ms ease-out both }
${P}[data-moment="crit"] .lgs-beam { animation: lgrSeraphMCritBeam 700ms ease-out both }
/* SHARPENED: the blade shears the cowl along its line, clips the wings on one side and knocks the scales askew. */
@keyframes lgrSeraphMCutHead { 0% { transform: none } 10% { transform: skewX(-12deg) translateX(2px) } 26% { transform: skewX(8deg) } 46% { transform: skewX(-3deg) } 100% { transform: none } }
@keyframes lgrSeraphMCutWing { 0%, 100% { rotate: 0deg } 10% { rotate: -16deg } 34% { rotate: 4deg } 60% { rotate: -2deg } }
@keyframes lgrSeraphMCutScales { 0%, 100% { transform: none } 12% { transform: rotate(-16deg) translateY(2px) } 46% { transform: rotate(-5deg) } }
${P}[data-moment="sharpen"] .lg-seraph-head { animation: lgrSeraphMCutHead 600ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="sharpen"] .lgs-wing { animation: lgrSeraphMCutWing 600ms ease-out both }
${P}[data-moment="sharpen"] .lg-seraph-scales { animation: lgrSeraphMCutScales 600ms ease-out both }
/* ITS JUDGMENT ON THE PLAYER (data-assault-on): the Judge mantles (wings rear, the arms draw back, the eye narrows),
   then as the lance of light leaves it (impact/assault.js travelAt) it pronounces: the arms drive forward, the great
   eye blazes open, the wings snap in toward the camera, the halo flares and the scales slam down. */
@keyframes lgrSeraphMBlowWing { 0% { rotate: 0deg } 13% { rotate: 14deg } 24% { rotate: -14deg } 48% { rotate: -10deg } 100% { rotate: 0deg } }
@keyframes lgrSeraphMBlowEye { 0% { scale: 1 } 13% { scale: 1.1 .35 } 24% { scale: 1.5 1.7; filter: brightness(1.6) drop-shadow(0 0 2px #ffb300) } 52% { scale: 1.3 1.45; filter: brightness(1.3) } 100% { scale: 1; filter: none } }
@keyframes lgrSeraphMBlowArm { 0% { transform: none } 13% { transform: rotate(var(--sp-back, -10deg)) translateY(-2px) } 24% { transform: rotate(var(--sp-fwd, 8deg)) translateY(2px) scale(1.1) } 52% { transform: rotate(var(--sp-fwd, 8deg)) scale(1.06) } 100% { transform: none } }
@keyframes lgrSeraphMBlowHead { 0% { transform: none } 13% { transform: translateY(-2px) scale(.96) } 24% { transform: translateY(2px) scale(1.12) } 52% { transform: translateY(1px) scale(1.08) } 100% { transform: none } }
@keyframes lgrSeraphMBlowHalo { 0% { scale: 1 } 13% { scale: .9 } 24% { scale: 1.22; filter: brightness(1.7) drop-shadow(0 0 3px #ffb300) } 55% { scale: 1.12; filter: brightness(1.3) } 100% { scale: 1; filter: none } }
@keyframes lgrSeraphMBlowBeam { 0% { rotate: 0deg } 13% { rotate: -8deg } 26% { rotate: var(--sp-tip) } 60% { rotate: var(--sp-tip) } 100% { rotate: 0deg } }
@keyframes lgrSeraphMBlowPanR { 0% { translate: 0 0 } 13% { translate: 0 calc(var(--sp-dy) * -.6) } 26%, 60% { translate: 0 var(--sp-dy) } 100% { translate: 0 0 } }
@keyframes lgrSeraphMBlowPanL { 0% { translate: 0 0 } 13% { translate: 0 calc(var(--sp-dy) * .6) } 26%, 60% { translate: 0 calc(var(--sp-dy) * -1) } 100% { translate: 0 0 } }
${P}[data-assault-on] .lgs-wing { animation: lgrSeraphMBlowWing 820ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-assault-on] .lgs-eye { animation: lgrSeraphMBlowEye 820ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-assault-on] .lg-seraph-armR { --sp-back: -12deg; --sp-fwd: 8deg; animation: lgrSeraphMBlowArm 820ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-assault-on] .lg-seraph-armL { --sp-back: 10deg; --sp-fwd: -8deg; animation: lgrSeraphMBlowArm 820ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-assault-on] .lg-seraph-head { animation: lgrSeraphMBlowHead 820ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-assault-on] .lgs-halo { animation: lgrSeraphMBlowHalo 820ms ease-out both }
${P}[data-assault-on] .lgs-beam { animation: lgrSeraphMBlowBeam 820ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-assault-on] .lgs-panR { animation: lgrSeraphMBlowPanR 820ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-assault-on] .lgs-panL { animation: lgrSeraphMBlowPanL 820ms cubic-bezier(.3,.7,.3,1) both }
/* ITS STRIKE (hurt, with the judgment above): the cowl bows into the sentence, the hand that holds the scales drives
   down. */
@keyframes lgrSeraphMStrikeHand { 0%, 100% { transform: none } 18%, 55% { transform: rotate(-10deg) translateY(3px) } }
@keyframes lgrSeraphMStrikeHead { 0%, 100% { transform: none } 20%, 55% { transform: translateY(3px) rotate(-4deg) scale(1.05) } }
${P}[data-moment="hurt"] .lg-seraph-handR { animation: lgrSeraphMStrikeHand 720ms ease-in-out both }
${P}[data-moment="hurt"] .lg-seraph-head { animation: lgrSeraphMStrikeHead 720ms ease-in-out both }
/* ITS HEAVY BLOW (hurtBig): a full sentence: the arms rise and come down, the wings open to their widest and slam
   forward, the cowl rears and bows, the halo spins half round ablaze. */
@keyframes lgrSeraphMHeavyArm { 0% { transform: none } 18% { transform: rotate(var(--sp-up, -16deg)) translateY(-3px) } 34% { transform: rotate(var(--sp-dn, 8deg)) translateY(3px) scale(1.12) } 62% { transform: rotate(var(--sp-dn, 8deg)) translateY(2px) scale(1.06) } 100% { transform: none } }
@keyframes lgrSeraphMHeavyWing { 0% { rotate: 0deg } 18% { rotate: 22deg } 32% { rotate: -18deg } 60% { rotate: -12deg } 100% { rotate: 0deg } }
@keyframes lgrSeraphMHeavyHead { 0% { transform: none } 18% { transform: translateY(-4px) rotate(-5deg) } 32% { transform: translateY(3px) scale(1.14) } 60% { transform: translateY(2px) scale(1.08) } 100% { transform: none } }
@keyframes lgrSeraphMHeavyHalo { 0% { rotate: 0deg; scale: 1 } 18% { rotate: -30deg; scale: .9 } 34% { rotate: 150deg; scale: 1.28; filter: brightness(1.8) drop-shadow(0 0 4px #ff7a1a) } 62% { rotate: 170deg; scale: 1.14; filter: brightness(1.3) } 100% { rotate: 180deg; scale: 1; filter: none } }
${P}[data-moment="hurtBig"] .lg-seraph-armR, ${P}[data-assault-on][data-moment="hurtBig"] .lg-seraph-armR { --sp-up: -16deg; --sp-dn: 8deg; animation: lgrSeraphMHeavyArm 900ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-moment="hurtBig"] .lg-seraph-armL, ${P}[data-assault-on][data-moment="hurtBig"] .lg-seraph-armL { --sp-up: 14deg; --sp-dn: -8deg; animation: lgrSeraphMHeavyArm 900ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-moment="hurtBig"] .lgs-wing, ${P}[data-assault-on][data-moment="hurtBig"] .lgs-wing { animation: lgrSeraphMHeavyWing 900ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-moment="hurtBig"] .lg-seraph-head, ${P}[data-assault-on][data-moment="hurtBig"] .lg-seraph-head { animation: lgrSeraphMHeavyHead 900ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-moment="hurtBig"] .lgs-halo, ${P}[data-assault-on][data-moment="hurtBig"] .lgs-halo { animation: lgrSeraphMHeavyHalo 900ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-moment="hurtBig"] .lgs-beam { animation: lgrSeraphMBlowBeam 900ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-moment="hurtBig"] .lgs-panR { animation: lgrSeraphMBlowPanR 900ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-moment="hurtBig"] .lgs-panL { animation: lgrSeraphMBlowPanL 900ms cubic-bezier(.3,.7,.3,1) both }
/* BLOCKED: its sentence is turned aside: the scales are knocked up and away, the cowl jerks back, the wings flare. */
@keyframes lgrSeraphMBlockScales { 0% { transform: none } 12% { transform: translateY(2px) scale(1.06) } 30% { transform: rotate(-22deg) translateY(-4px) } 54% { transform: rotate(-10deg) } 100% { transform: none } }
@keyframes lgrSeraphMBlockHead { 0% { transform: none } 12% { transform: scale(1.06) } 30% { transform: translateY(-3px) rotate(-6deg) scale(.95) } 56% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgrSeraphMBlockWing { 0%, 100% { rotate: 0deg } 30% { rotate: 12deg } 56% { rotate: -3deg } }
${P}[data-moment="block"] .lg-seraph-scales { animation: lgrSeraphMBlockScales 640ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="block"] .lg-seraph-head { animation: lgrSeraphMBlockHead 640ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="block"] .lgs-wing { animation: lgrSeraphMBlockWing 640ms ease-out both }
/* SAVED: its judgment rebounds off the shield: the wings wrap in to shelter it, the eye squeezes shut, the cowl turns
   away. */
@keyframes lgrSeraphMShieldWing { 0%, 100% { rotate: 0deg } 18%, 60% { rotate: -18deg } }
@keyframes lgrSeraphMShieldEye { 0%, 100% { scale: 1 } 16%, 60% { scale: 1.1 .08 } }
@keyframes lgrSeraphMShieldHead { 0%, 100% { transform: none } 18%, 60% { transform: rotate(10deg) translateX(2px) scale(.95) } }
@keyframes lgrSeraphMShieldHalo { 0%, 100% { scale: 1; rotate: 0deg } 18%, 60% { scale: .86; rotate: -20deg } }
${P}[data-moment="shield"] .lgs-wing { animation: lgrSeraphMShieldWing 760ms ease-in-out both }
${P}[data-moment="shield"] .lgs-eye { animation: lgrSeraphMShieldEye 760ms ease-in-out both }
${P}[data-moment="shield"] .lg-seraph-head { animation: lgrSeraphMShieldHead 760ms ease-in-out both }
${P}[data-moment="shield"] .lgs-halo { animation: lgrSeraphMShieldHalo 760ms ease-in-out both }
/* SECOND WIND: the Judge falters: the wings sag, the cowl bows, the arms hang slack, the halo dims and slows. */
@keyframes lgrSeraphMWindWing { 0%, 100% { rotate: 0deg } 35%, 70% { rotate: -11deg } }
@keyframes lgrSeraphMWindHead { 0%, 100% { transform: none } 35%, 70% { transform: translateY(3px) rotate(6deg) scale(.96) } }
@keyframes lgrSeraphMWindArm { 0%, 100% { transform: none } 35%, 70% { transform: rotate(var(--sp-sag, 8deg)) translateY(2px) } }
@keyframes lgrSeraphMWindHalo { 0%, 100% { scale: 1; filter: none } 35%, 70% { scale: .94; filter: brightness(.7) saturate(.6) } }
${P}[data-moment="wind"] .lgs-wing { animation: lgrSeraphMWindWing 1000ms ease-in-out both }
${P}[data-moment="wind"] .lg-seraph-head { animation: lgrSeraphMWindHead 1000ms ease-in-out both }
${P}[data-moment="wind"] .lg-seraph-armR { --sp-sag: 8deg; animation: lgrSeraphMWindArm 1000ms ease-in-out both }
${P}[data-moment="wind"] .lg-seraph-armL { --sp-sag: -8deg; animation: lgrSeraphMWindArm 1000ms ease-in-out both }
${P}[data-moment="wind"] .lgs-halo { animation: lgrSeraphMWindHalo 1000ms ease-in-out both }
/* KNOCKOUT (fall from grace): the wings flare wide in a last blaze and the eye opens to the sky, then the halo sinks
   and dims, the wings collapse inward, the cowl bows to its chest, the arms drop, the scales crash down on wrath.
   The fallen pose is HELD by data-down below. */
@keyframes lgrSeraphMKoWing { 0% { rotate: 0deg } 18% { rotate: 22deg } 40% { rotate: 18deg } 62% { rotate: -24deg } 100% { rotate: -16deg } }
@keyframes lgrSeraphMKoEye { 0% { scale: 1 } 18%, 40% { scale: 1.4 1.6 } 62% { scale: 1.1 .06 } 100% { scale: 1 .06 } }
@keyframes lgrSeraphMKoHead { 0%, 40% { transform: none } 18% { transform: translateY(-3px) rotate(-6deg) } 62% { transform: translateY(6px) rotate(11deg) scale(.95) } 100% { transform: translateY(5px) rotate(9deg) scale(.96) } }
@keyframes lgrSeraphMKoArm { 0%, 40% { transform: none } 64% { transform: rotate(var(--sp-drop, 14deg)) translateY(6px) } 100% { transform: rotate(var(--sp-drop, 14deg)) translateY(5px) } }
@keyframes lgrSeraphMKoHalo { 0% { scale: 1; translate: 0 0 } 20% { scale: 1.2; filter: brightness(1.8) } 55% { scale: .9; translate: 0 4px; filter: brightness(.6) saturate(.4) } 100% { scale: .92; translate: 0 5px; filter: brightness(.55) saturate(.3) } }
@keyframes lgrSeraphMKoBeam { 0%, 40% { rotate: 0deg } 70% { rotate: calc(var(--sp-tip) * 1.6) } 82% { rotate: calc(var(--sp-tip) * 1.2) } 100% { rotate: calc(var(--sp-tip) * 1.3) } }
${P}[data-moment="ko"] .lgs-wing { animation: lgrSeraphMKoWing 2300ms ease-in-out both }
${P}[data-moment="ko"] .lgs-eye { animation: lgrSeraphMKoEye 2300ms ease-in-out both }
${P}[data-moment="ko"] .lg-seraph-head { animation: lgrSeraphMKoHead 2300ms ease-in-out both }
${P}[data-moment="ko"] .lg-seraph-armR { animation: lgrSeraphMKoArm 2300ms ease-in-out both }
${P}[data-moment="ko"] .lg-seraph-armL { animation: lgrSeraphMKoArm 2300ms ease-in-out both }
${P}[data-moment="ko"] .lgs-halo { animation: lgrSeraphMKoHalo 2300ms ease-in-out both }
${P}[data-moment="ko"] .lgs-beam { animation: lgrSeraphMKoBeam 2300ms ease-in-out both }
/* phase 3: the great wings are MANTLED, so the fall lowers them a little further (a positive turn; the shared -16deg stood them up like ears),
   and the halo, already the largest, swells less so it stays inside the box headroom */
@keyframes lgrSeraphMKoWing3 { 0% { rotate: 0deg } 18% { rotate: -8deg } 40% { rotate: -6deg } 62% { rotate: 16deg } 100% { rotate: 12deg } }
@keyframes lgrSeraphMKoHalo3 { 0% { scale: 1; translate: 0 0 } 20% { scale: 1.05; filter: brightness(1.8) } 55% { scale: .9; translate: 0 4px; filter: brightness(.6) saturate(.4) } 100% { scale: .92; translate: 0 5px; filter: brightness(.55) saturate(.3) } }
${ph(3)}[data-moment="ko"] .lgs-wing { animation-name: lgrSeraphMKoWing3 }
${ph(3)}[data-moment="ko"] .lgs-halo { animation-name: lgrSeraphMKoHalo3 }
`
// THE FALLEN POSE (data-down: on the page for the whole raid, so it lives in this file's css): after the knockout the
// Judge stays down: its eye shut and grey (lgfa-seraph-down), cowl bowed, wings sagging, halo sunk and dimmed, arms
// hanging, the scales crashed onto wrath.
const DOWN_CSS = `
${P}[data-down] .lgfa-seraph-live { display: none }
${P}[data-down] .lgfa-seraph-down { display: inline !important }
${P}[data-down] .lg-seraph-head { transform: translateY(5px) rotate(9deg) scale(.96) }
${P}[data-down] .lgs-wing { rotate: -16deg }
${ph(3)}[data-down] .lgs-wing { rotate: 12deg }
/* phase 1: the wings stand in an arch over her head; the shared inward turn folded them into a hood, so they sag OUTWARD */
@keyframes lgrSeraphMKoWing1 { 0% { rotate: 0deg } 18% { rotate: -6deg } 40% { rotate: -4deg } 62% { rotate: 18deg } 100% { rotate: 14deg } }
${ph(1)}[data-moment="ko"] .lgs-wing { animation-name: lgrSeraphMKoWing1 }
${ph(1)}[data-down] .lgs-wing { rotate: 14deg }
${P}[data-down] .lgs-halo { scale: .92; translate: 0 5px; filter: brightness(.55) saturate(.3) }
${P}[data-down] .lgs-beam { rotate: calc(var(--sp-tip) * 1.3) }
${P}[data-down] .lg-seraph-armR, ${P}[data-down] .lg-seraph-armL { transform: rotate(var(--sp-drop)) translateY(5px) }
/* phases 2 and 3: once the knockout has played, the raised arms give way to arms hanging at her sides */
${P}[data-down]:not([data-moment="ko"]) .lg-seraph-armsUp { display: none }
${P}[data-down]:not([data-moment="ko"]) .lg-seraph-armsDown { display: inline !important }
/* phase 3: both verdict flames gutter out in the pans */
${P} .lg-seraph-flame { transform-box: fill-box; transform-origin: 50% 100% }
${P}[data-down] .lg-seraph-flame { scale: .2; opacity: .25 }
${P}[data-moment="ko"] .lg-seraph-flame { animation: lgrSeraphFlameOut 2300ms ease-in both }
@keyframes lgrSeraphFlameOut { 0%, 30% { scale: 1; opacity: 1 } 45% { scale: 1.5 1.7; opacity: 1 } 75% { scale: .3; opacity: .4 } 100% { scale: .2; opacity: .25 } }
`

export default {
  effects: {
    wrath: () => <>
      {/* the pillar: a white-hot core inside a gold column, slamming down from above the frame */}
      <div className="lgx" style={{ left: '50%', top: '-14%', width: '56%', height: '120%', marginLeft: '-28%', transformOrigin: 'top', borderRadius: '0 0 40% 40%', mixBlendMode: 'screen', background: `linear-gradient(to right, rgba(255,210,63,0), rgba(255,226,120,.75) 14%, rgba(255,244,184,.35) 30%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 58%, rgba(255,244,184,.35) 70%, rgba(255,226,120,.75) 86%, rgba(255,210,63,0))`, boxShadow: `0 0 30px ${GOLD}`, animation: anim('lgrSeraphPillar', 1000, 0, 'cubic-bezier(.22,1,.36,1)') }} />
      {/* the halo blazes into a crown of ember rays */}
      {crown('rgba(255,150,40,.95)', EMBER, 80, 1000)}
      {/* the crown of spears, falling in a fan */}
      {around(6, (i) => (
        <div key={i} className="lgx" style={{ left: `${[10, 19, 29, 71, 81, 90][i]}%`, top: '-6%', width: 6, height: 62, marginLeft: -3, background: `linear-gradient(to bottom, ${WHITE}, ${GOLD})`, clipPath: 'polygon(50% 100%, 100% 22%, 70% 22%, 70% 0, 30% 0, 30% 22%, 0 22%)', filter: `drop-shadow(0 0 4px ${GOLD})`, '--x': `${(i < 3 ? i - 3 : i - 2) * 6}px`, animation: anim('lgrSeraphSpear', 560, 60 + Math.abs(i < 3 ? i - 3 : i - 2) * 45, 'cubic-bezier(.55,0,1,.45)') }} />
      ))}
      {/* the impact: a gold shockwave, sparks and rising embers */}
      {ring(GOLD, 330, 2, 6, 650)}
      {ring(WHITE, 380, 1.4, 3, 500)}
      {shards(14, GOLD, -110, 9)}
      {around(8, (i) => <div key={`e${i}`} className="lgx" style={{ left: `${30 + i * 6}%`, bottom: '6%', width: 5, height: 5, borderRadius: '50%', background: i % 2 ? EMBER : GOLD_HOT, boxShadow: `0 0 6px ${EMBER}`, '--h': `${-60 - (i % 3) * 20}px`, animation: anim('lgxRise', 800, 360 + (i % 4) * 60) }} />)}
    </>,
    mercy: () => <>
      <div className="lgx" style={{ left: '50%', top: '50%', width: '70%', height: '70%', marginLeft: '-35%', marginTop: '-35%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0) 34%, rgba(214,234,255,.5) 50%, rgba(255,255,255,0) 68%)', animation: anim('lgrSeraphHalo', 1100) }} />
      {/* a soft white crown round the halo */}
      {crown('rgba(235,245,255,.9)', MERCY, 60, 1100)}
      {ring(MERCY, 0, 1.9, 4, 900)}
      {around(10, (i, a) => feather(i, { left: '50%', top: '45%', '--a': `${a}deg`, '--d': `${70 + (i % 3) * 18}px`, animation: anim('lgrSeraphFeatherBurst', 1250, i * 25) }))}
      {/* two feathers settle toward the hearts (they sit to the right of the boss) */}
      {[0, 1].map((i) => feather(`h${i}`, { left: '55%', top: '40%', '--tx': `${150 + i * 18}px`, '--ty': `${36 + i * 10}px`, animation: anim('lgxToHearts', 1100, 250 + i * 120) }))}
    </>,
    grace: () => <>
      {/* heaven opens: a soft gold dawn above the Judge */}
      <div className="lgx" style={{ left: '-20%', right: '-20%', top: '-34%', height: '70%', background: 'radial-gradient(ellipse at 50% 0%, rgba(255,250,225,.55) 0%, rgba(255,226,130,.3) 35%, rgba(255,210,63,0) 70%)', animation: anim('lgrSeraphDawn', 1150) }} />
      {/* the column of holy light descends onto the Judge (from the top down), then widens and fades */}
      <div className="lgx" style={{ left: '50%', top: '-36%', width: '38%', height: '150%', marginLeft: '-19%', transformOrigin: 'top center', borderRadius: '0 0 50% 50% / 0 0 12% 12%',
        background: `linear-gradient(to right, rgba(255,240,180,0), rgba(255,236,160,.45) 12%, rgba(255,250,230,.2) 28%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%, rgba(255,250,230,.2) 72%, rgba(255,236,160,.45) 88%, rgba(255,240,180,0))`,
        WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 70%, transparent 100%)', maskImage: 'linear-gradient(to bottom, #000 0%, #000 70%, transparent 100%)',
        boxShadow: `0 0 30px rgba(255,226,130,.7)`, animation: anim('lgrSeraphColumn', 1150, 40, 'cubic-bezier(.25,.9,.35,1)') }} />
      {/* thin rays streaming down inside the column */}
      {[-5, -3.5, 3.5, 5].map((d, i) => <div key={`r${i}`} className="lgx" style={{ left: `calc(50% + ${d * 7}%)`, top: '-30%', width: d ? 2 : 3, height: '45%', marginLeft: -1, borderRadius: 2, background: `linear-gradient(to bottom, rgba(255,255,255,0), ${WHITE}, rgba(255,255,255,0))`, '--ry': '150%', animation: anim('lgrSeraphRay', 700, 120 + i * 70, 'ease-in') }} />)}
      {/* the crown of turning rays flares round the halo, a gold ring with it */}
      {crown('rgba(255,244,190,1)', GOLD, 300)}
      <div className="lgx lgrs-head" style={{ width: '46%', aspectRatio: '1', marginLeft: '-23%', marginTop: '-23%', borderRadius: '50%', border: `3px solid ${GOLD_HOT}`, boxShadow: `0 0 14px ${GOLD}, inset 0 0 10px ${GOLD}`, animation: anim('lgrSeraphHaloFlare', 900, 260) }} />
      {/* feathers drift down through the light, swaying */}
      {[[30, 0, 14], [64, 90, -16], [44, 200, 18], [72, 300, -12], [24, 380, 10], [56, 470, -18]].map(([x, d, sx], i) => feather(`f${i}`, { left: `${x}%`, top: '-6%', width: 11, height: 24, '--sx': `${sx}px`, '--fy': `${110 + (i % 3) * 22}px`, animation: anim('lgrSeraphDrift', 1050 - (i % 2) * 120, 180 + d, 'ease-in-out') }, i % 2 ? GOLD_FEATHER : FEATHER))}
      {/* gold motes rise slowly in the column */}
      {around(12, (i) => <div key={`m${i}`} className="lgx" style={{ left: `${38 + ((i * 37) % 25)}%`, top: `${40 + ((i * 23) % 45)}%`, width: i % 3 ? 4 : 7, height: i % 3 ? 4 : 7, background: i % 3 ? GOLD_HOT : WHITE, borderRadius: i % 3 ? '50%' : 0, clipPath: i % 3 ? 'none' : STAR, boxShadow: i % 3 ? `0 0 6px ${GOLD}` : 'none', filter: i % 3 ? 'none' : `drop-shadow(0 0 3px ${GOLD})`, '--h': `${-34 - (i % 4) * 12}px`, animation: anim('lgxRise', 850, 300 + (i % 6) * 70) }} />)}
      {/* the light lands: a soft shockwave and a glow on the ground */}
      <div className="lgx" style={{ left: '50%', bottom: '2%', width: '90%', height: '16%', marginLeft: '-45%', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,250,225,.9) 0%, rgba(255,210,63,.45) 45%, rgba(255,210,63,0) 72%)', animation: anim('lgrSeraphPool', 900, 300) }} />
      {ring(GOLD_HOT, 340, 2.1, 3, 850)}
      {ring(WHITE, 420, 1.6, 2, 700)}
    </>,
  },
  floaters: { wrath: 'lg_fx_seraphWrath', mercy: 'lg_fx_seraphMercy', grace: 'lg_fx_seraphGrace' },
  floaterTone: { wrath: 'warning', mercy: 'ink', grace: 'warning' },
  demo: { mercy: { kind: 'block', damage: 0, lives: 0 }, grace: { kind: 'hit', damage: 3, lives: 0 }, wrath: { kind: 'hit', damage: 4, lives: 0 } },
  juice: {
    wrath: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'seraph.wrath' },
    mercy: { size: 'big', shake: 1, flash: 1, hitstop: 1, sfx: 'seraph.mercy' },
    grace: { size: 'big', shake: 1, flash: 1, hitstop: 1, sfx: 'seraph.grace' },
  },
  css: `
@keyframes lgrSeraphPillar { 0% { transform: scaleY(0); opacity: 0 } 12% { opacity: 1 } 26% { transform: scaleY(1); opacity: 1 } 45% { transform: scaleY(1) scaleX(.8); opacity: .7 } 100% { transform: scaleY(1) scaleX(.1); opacity: 0 } }
@keyframes lgrSeraphSpear { 0% { transform: translate(var(--x), -30px); opacity: 0 } 30% { transform: translate(calc(var(--x) * .6), 12px); opacity: 1 } 80% { transform: translate(0, 120px); opacity: 1 } 100% { transform: translate(0, 128px) scaleY(.6); opacity: 0 } }
@keyframes lgrSeraphHalo { 0% { transform: scale(.3); opacity: 0 } 25% { transform: scale(1.05); opacity: 1 } 70% { opacity: .8 } 100% { transform: scale(1.25); opacity: 0 } }
@keyframes lgrSeraphFeatherBurst { 0% { transform: rotate(var(--a)) translateY(0) rotate(0); opacity: 0 } 10% { opacity: 1 } 35% { transform: rotate(var(--a)) translateY(calc(var(--d) * -1)) rotate(40deg) } 100% { transform: rotate(var(--a)) translateY(calc(var(--d) * -1)) translateX(14px) rotate(-30deg) translateY(50px); opacity: 0 } }

/* the crown of rays and the halo ring sit on the halo's centre (it moves with the phase's camera) */
.lgrs-head { left: 50%; top: 25% }
@keyframes lgrSeraphCrown { 0% { transform: rotate(0) scale(.5); opacity: 0 } 20% { opacity: 1 } 55% { transform: rotate(50deg) scale(1.08); opacity: 1 } 100% { transform: rotate(110deg) scale(1.2); opacity: 0 } }
@keyframes lgrSeraphHaloFlare { 0% { transform: scale(.6); opacity: 0 } 25% { transform: scale(1.05); opacity: 1 } 60% { transform: scale(1.12); opacity: .85 } 100% { transform: scale(1.4); opacity: 0 } }

/* grace: the dawn, the descending column, its rays, the drifting feathers, the pool of light */
@keyframes lgrSeraphDawn { 0% { opacity: 0 } 20% { opacity: 1 } 70% { opacity: .85 } 100% { opacity: 0 } }
@keyframes lgrSeraphColumn { 0% { transform: scaleY(0) scaleX(.35); opacity: 0 } 10% { opacity: 1 } 38% { transform: scaleY(1) scaleX(.6); opacity: 1 } 62% { transform: scaleY(1) scaleX(1); opacity: .95 } 100% { transform: scaleY(1) scaleX(1.25); opacity: 0 } }
@keyframes lgrSeraphRay { 0% { transform: translateY(0); opacity: 0 } 20% { opacity: 1 } 100% { transform: translateY(var(--ry)); opacity: 0 } }
@keyframes lgrSeraphDrift { 0% { transform: translate(0, 0) rotate(-24deg); opacity: 0 } 15% { opacity: 1 } 40% { transform: translate(var(--sx), calc(var(--fy) * .38)) rotate(18deg) } 70% { transform: translate(calc(var(--sx) * -.4), calc(var(--fy) * .72)) rotate(-14deg); opacity: 1 } 100% { transform: translate(calc(var(--sx) * .5), var(--fy)) rotate(10deg); opacity: 0 } }
@keyframes lgrSeraphPool { 0% { transform: scaleX(.3); opacity: 0 } 30% { transform: scaleX(1); opacity: 1 } 100% { transform: scaleX(1.25); opacity: 0 } }

/* THE BODY */
@keyframes lgrSeraphSmite { 0% { transform: none } 22% { transform: translateY(-8px) scaleY(1.06) } 42% { transform: translateY(4px) scaleY(.95) } 62% { transform: translateY(-1px) scaleY(1.01) } 100% { transform: none } }
@keyframes lgrSeraphSmiteP3 { 0% { transform: none } 20% { transform: translateY(-10px) scaleY(1.08) rotate(-1deg) } 40% { transform: translateY(6px) scaleY(.93) rotate(1deg) } 60% { transform: translateY(-2px) scaleY(1.02) } 100% { transform: none } }
@keyframes lgrSeraphBow { 0% { transform: none } 40% { transform: translateY(6px) rotate(6deg) } 70% { transform: translateY(6px) rotate(6deg) } 100% { transform: none } }
@keyframes lgrSeraphAscend { 0% { transform: none } 32% { transform: translateY(-12px) scale(1.05) } 62% { transform: translateY(-10px) scale(1.045) } 84% { transform: translateY(1px) scale(.995) } 100% { transform: none } }
.lgr-seraph-wrath { transform-origin: 50% 85%; animation: lgrSeraphSmite 800ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-phase="3"] .lgr-seraph-wrath { animation-name: lgrSeraphSmiteP3 }
.lgr-seraph-mercy { transform-origin: 50% 95%; animation: lgrSeraphBow 1100ms cubic-bezier(.22,1,.36,1) both }
.lgr-seraph-grace { transform-origin: 50% 90%; animation: lgrSeraphAscend 1150ms cubic-bezier(.3,.8,.35,1) both }

/* THE REAL PARTS under each verdict. Played only while data-fx is set, which the arena never does in focus mode,
   with Still bosses or under reduced motion. The red eyes turn GOLD under grace (sepia + saturate: a hue turn made them green). */
@keyframes lgrSeraphWingSpread { 0% { rotate: 0deg; filter: none } 30% { rotate: 13deg; filter: sepia(.45) saturate(1.5) brightness(1.18) drop-shadow(0 0 1.5px #ffd23f) } 65% { rotate: 10deg; filter: sepia(.45) saturate(1.5) brightness(1.14) drop-shadow(0 0 1.5px #ffd23f) } 100% { rotate: 0deg; filter: none } }
@keyframes lgrSeraphWingSnap { 0% { rotate: 0deg; filter: none } 18% { rotate: 17deg; filter: brightness(1.35) drop-shadow(0 0 1.5px #ff7a1a) } 45% { rotate: 11deg; filter: brightness(1.2) drop-shadow(0 0 1px #ff7a1a) } 100% { rotate: 0deg; filter: none } }
@keyframes lgrSeraphWingFold { 0% { rotate: 0deg; filter: none } 35% { rotate: -13deg; filter: brightness(1.25) drop-shadow(0 0 1.5px #ffffff) } 70% { rotate: -11deg; filter: brightness(1.2) drop-shadow(0 0 1.5px #ffffff) } 100% { rotate: 0deg; filter: none } }
@keyframes lgrSeraphEyeGold { 0% { scale: 1; filter: none } 28% { scale: 1.12 1.32; filter: sepia(1) saturate(3) brightness(1.35) drop-shadow(0 0 2px #ffd23f) } 65% { scale: 1.08 1.22; filter: sepia(1) saturate(2.6) brightness(1.25) drop-shadow(0 0 1.5px #ffd23f) } 100% { scale: 1; filter: none } }
@keyframes lgrSeraphEyeWide { 0% { scale: 1 } 20% { scale: 1.2 1.45 } 70% { scale: 1.12 1.3 } 100% { scale: 1 } }
@keyframes lgrSeraphHaloGrace { 0% { scale: 1; filter: none } 25% { scale: 1.12; filter: brightness(1.5) drop-shadow(0 0 2px #ffd23f) } 60% { scale: 1.09; filter: brightness(1.5) drop-shadow(0 0 2px #ffd23f) } 100% { scale: 1; filter: none } }
@keyframes lgrSeraphHaloWrath { 0% { scale: 1; rotate: 0deg; filter: none } 25% { scale: 1.16; rotate: 30deg; filter: brightness(1.7) saturate(1.6) drop-shadow(0 0 3px #ff7a1a) } 60% { scale: 1.12; rotate: 40deg; filter: brightness(1.7) saturate(1.6) drop-shadow(0 0 3px #ff7a1a) } 100% { scale: 1; rotate: 45deg; filter: none } }
@keyframes lgrSeraphHaloMercy { 0% { scale: 1; filter: none } 25% { scale: 1.06; filter: brightness(1.4) drop-shadow(0 0 2px #ffffff) } 60% { scale: 1.05; filter: brightness(1.4) drop-shadow(0 0 2px #ffffff) } 100% { scale: 1; filter: none } }
/* the scales: wrath slams them onto the flame, grace tips them onto the feather, mercy swings them level */
@keyframes lgrSeraphBeamWrath { 0% { rotate: 0deg } 14% { rotate: calc(var(--sp-tip) * -.4) } 32% { rotate: calc(var(--sp-tip) * 1.25) } 46% { rotate: calc(var(--sp-tip) * .9) } 80% { rotate: var(--sp-tip) } 100% { rotate: 0deg } }
@keyframes lgrSeraphBeamGrace { 0% { rotate: 0deg } 30% { rotate: calc(var(--sp-tip) * -1) } 80% { rotate: calc(var(--sp-tip) * -1) } 100% { rotate: 0deg } }
@keyframes lgrSeraphBeamMercy { 0% { rotate: 0deg } 18% { rotate: calc(var(--sp-tip) * .8) } 38% { rotate: calc(var(--sp-tip) * -.55) } 58% { rotate: calc(var(--sp-tip) * .3) } 78% { rotate: calc(var(--sp-tip) * -.1) } 100% { rotate: 0deg } }
@keyframes lgrSeraphPanDown { 0% { translate: 0 0 } 14% { translate: 0 calc(var(--sp-dy) * -.4) } 32% { translate: 0 calc(var(--sp-dy) * 1.25) } 46% { translate: 0 calc(var(--sp-dy) * .9) } 80% { translate: 0 var(--sp-dy) } 100% { translate: 0 0 } }
@keyframes lgrSeraphPanUp { 0% { translate: 0 0 } 14% { translate: 0 calc(var(--sp-dy) * .4) } 32% { translate: 0 calc(var(--sp-dy) * -1.25) } 46% { translate: 0 calc(var(--sp-dy) * -.9) } 80% { translate: 0 calc(var(--sp-dy) * -1) } 100% { translate: 0 0 } }
@keyframes lgrSeraphPanSwing { 0% { translate: 0 0 } 18% { translate: 0 calc(var(--sp-dy) * .8 * var(--side)) } 38% { translate: 0 calc(var(--sp-dy) * -.55 * var(--side)) } 58% { translate: 0 calc(var(--sp-dy) * .3 * var(--side)) } 78% { translate: 0 calc(var(--sp-dy) * -.1 * var(--side)) } 100% { translate: 0 0 } }
.lg-boss[data-fx="grace"] .lgs-wing { animation: lgrSeraphWingSpread 1150ms cubic-bezier(.3,.8,.35,1) both }
.lg-boss[data-fx="grace"] .lgs-eye { animation: lgrSeraphEyeGold 1150ms cubic-bezier(.3,.8,.35,1) both }
.lg-boss[data-fx="grace"] .lgs-halo { animation: lgrSeraphHaloGrace 1100ms ease-in-out both }
.lg-boss[data-fx="grace"] .lgs-beam { animation: lgrSeraphBeamGrace 1150ms cubic-bezier(.3,.8,.35,1) both }
.lg-boss[data-fx="grace"] .lgs-panL { animation: lgrSeraphPanDown 1150ms cubic-bezier(.3,.8,.35,1) both }
.lg-boss[data-fx="grace"] .lgs-panR { animation: lgrSeraphPanUp 1150ms cubic-bezier(.3,.8,.35,1) both }
.lg-boss[data-fx="wrath"] .lgs-wing { animation: lgrSeraphWingSnap 800ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-fx="wrath"] .lgs-eye { animation: lgrSeraphEyeWide 1000ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-fx="wrath"] .lgs-halo { animation: lgrSeraphHaloWrath 1000ms ease-out both }
.lg-boss[data-fx="wrath"] .lgs-beam { animation: lgrSeraphBeamWrath 1100ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-fx="wrath"] .lgs-panR { animation: lgrSeraphPanDown 1100ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-fx="wrath"] .lgs-panL { animation: lgrSeraphPanUp 1100ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-fx="mercy"] .lgs-wing { animation: lgrSeraphWingFold 1100ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-fx="mercy"] .lgs-halo { animation: lgrSeraphHaloMercy 1100ms ease-in-out both }
.lg-boss[data-fx="mercy"] .lgs-beam { animation: lgrSeraphBeamMercy 1200ms ease-in-out both }
.lg-boss[data-fx="mercy"] .lgs-panR { --side: 1; animation: lgrSeraphPanSwing 1200ms ease-in-out both }
.lg-boss[data-fx="mercy"] .lgs-panL { --side: -1; animation: lgrSeraphPanSwing 1200ms ease-in-out both }
/* the arms act the verdicts too: wrath drives the scales down, mercy lowers them, grace lifts them to the light */
@keyframes lgrSeraphArmWrath { 0%, 100% { transform: none } 16% { transform: rotate(var(--a-up)) translateY(-3px) } 32% { transform: rotate(var(--a-dn)) translateY(3px) } 70% { transform: rotate(var(--a-dn)) translateY(2px) } }
@keyframes lgrSeraphArmMercy { 0%, 100% { transform: none } 35%, 75% { transform: rotate(var(--a-dn)) translateY(2px) } }
@keyframes lgrSeraphArmGrace { 0%, 100% { transform: none } 30%, 70% { transform: rotate(var(--a-up)) translateY(-3px) } }
@keyframes lgrSeraphHeadMercy { 0%, 100% { transform: none } 35%, 75% { transform: translateY(2px) rotate(-5deg) } }
@keyframes lgrSeraphHeadGrace { 0%, 100% { transform: none } 30%, 70% { transform: translateY(-3px) rotate(-3deg) scale(1.04) } }
.lg-boss[data-motif="seraph"] .lg-seraph-armR { --a-up: -12deg; --a-dn: 8deg }
.lg-boss[data-motif="seraph"] .lg-seraph-armL { --a-up: 10deg; --a-dn: -8deg }
.lg-boss[data-fx="wrath"] .lg-seraph-armR, .lg-boss[data-fx="wrath"] .lg-seraph-armL { animation: lgrSeraphArmWrath 900ms cubic-bezier(.3,.7,.3,1) both }
.lg-boss[data-fx="mercy"] .lg-seraph-armR, .lg-boss[data-fx="mercy"] .lg-seraph-armL { animation: lgrSeraphArmMercy 1100ms ease-in-out both }
.lg-boss[data-fx="grace"] .lg-seraph-armR, .lg-boss[data-fx="grace"] .lg-seraph-armL { animation: lgrSeraphArmGrace 1150ms ease-in-out both }
.lg-boss[data-fx="mercy"] .lg-seraph-head { animation: lgrSeraphHeadMercy 1100ms ease-in-out both }
.lg-boss[data-fx="grace"] .lg-seraph-head { animation: lgrSeraphHeadGrace 1150ms ease-in-out both }

/* fx-layer motion: the tears of light spurt and run down from the eye, then thin out */
@keyframes lgrSeraphTearDrip { 0% { transform: translateY(-1px); opacity: 0 } 14% { transform: none; opacity: 1 } 70% { transform: translateY(2.4px); opacity: 1 } 100% { transform: translateY(3.2px); opacity: .5 } }
.lg-boss[data-fx="wrath"] .lgfa-seraph-tear { transform-box: fill-box; transform-origin: 50% 0%; animation: lgrSeraphTearDrip 1100ms cubic-bezier(.5,0,.7,1) both }
${PARTS_CSS}
${DOWN_CSS}
`,
}
