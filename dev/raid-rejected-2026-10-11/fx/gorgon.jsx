// What the Gorgon's raid ability (mirror: Mirror Shield) LOOKS like. The fx contract is in fx/index.js, the juice
// numbers in fx/_juice.js, the design in design-v2.md section 17. Fixed bright colors (never theme tokens).
import { anim, around, flash } from './_kit'

const POP = 'cubic-bezier(.34,1.56,.64,1)'
const SETTLE = 'cubic-bezier(.22,1,.36,1)'
const GAZE = '#5dff9a'
const STONE = '#a7a29a'
const STONE_DARK = '#5f5a52'

// A thin gaze ray from her eyes, sweeping from r0 to r1.
const ray = (key, r0, r1, delay) => (
  <div key={key} className="lgx" style={{ left: '50%', top: '33%', width: '135%', height: 3, borderRadius: 3, background: `linear-gradient(90deg, transparent, ${GAZE} 30%, #ffffff 50%, ${GAZE} 70%, transparent)`, boxShadow: `0 0 8px ${GAZE}`, '--r0': `${r0}deg`, '--r1': `${r1}deg`, animation: anim('lgrGorgonRaySweep', 320, delay) }} />
)

export default {
  effects: {
    // Charge (tick): two thin green rays sweep the arena from her eyes.
    charge: () => <>{ray('a', -28, 14, 0)}{ray('b', 22, -12, 40)}</>,
    // Reflect (big): a silver mirror spins up in front of you, her green beam bends back into her, stone creeps out from
    // the impact and shatters into gray chunks.
    reflect: () => <>
      {flash('#e8fff0')}
      <div className="lgx" style={{ left: '50%', top: '86%', width: 46, height: 46, marginLeft: -23, marginTop: -23, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #ffffff 0 18%, #dfe6ee 40%, #9aa6b4 75%, #5c6672 100%)', border: '3px solid #2a3038', boxShadow: '0 0 16px #ffffff', animation: anim('lgrGorgonMirror', 700, 0, POP) }} />
      <div className="lgx" style={{ left: '50%', top: '33%', width: 10, height: '52%', marginLeft: -5, borderRadius: 6, transformOrigin: '50% 100%', background: `linear-gradient(0deg, #ffffff, ${GAZE} 40%, #19c96a)`, boxShadow: `0 0 14px ${GAZE}`, animation: anim('lgrGorgonBeamBack', 650, 200, 'ease-out') }} />
      <div className="lgx" style={{ left: '50%', top: '34%', width: '70%', height: '70%', borderRadius: '50%', background: `radial-gradient(circle, ${STONE} 0 45%, rgba(167,162,154,.6) 62%, transparent 72%)`, mixBlendMode: 'hard-light', animation: anim('lgrGorgonStoneCreep', 700, 380, SETTLE) }} />
      <svg className="lgx" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ left: '50%', top: '34%', width: '70%', height: '70%', overflow: 'visible', animation: anim('lgrGorgonStoneCreep', 700, 420, SETTLE) }}>
        {['M50 48 L30 30 L22 12', 'M50 48 L72 26 L80 8', 'M50 48 L46 74 L36 92', 'M50 48 L78 58 L94 70', 'M50 48 L20 60 L6 66'].map((d, i) => <path key={i} d={d} fill="none" stroke={STONE_DARK} strokeWidth="2.5" strokeLinejoin="round" />)}
      </svg>
      {around(12, (i, a) => <div key={i} className="lgx" style={{ left: '50%', top: '36%', width: 9 + (i % 3) * 4, height: 8 + (i % 2) * 5, background: STONE, border: `2px solid ${STONE_DARK}`, borderRadius: 3, '--a': `${a + 11 * i}deg`, '--d': `${-70 - (i % 3) * 18}px`, '--spin': `${(i % 2 ? 1 : -1) * 200}deg`, animation: anim('lgxShard', 520, 680 + (i % 4) * 25) }} />)}
    </>,
    // Stoned (medium, a missed gaze): a cold gray tint flickers over her, and gray hearts drift off toward yours.
    stoned: () => <>
      <div className="lgx lgx-full" style={{ borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,162,154,.75) 0, rgba(95,90,82,.45) 55%, transparent 72%)', animation: anim('lgrGorgonGrayFlicker', 760) }} />
      {[0, 1, 2].map((i) => <div key={i} className="lgx" style={{ left: '50%', top: `${40 + i * 10}%`, fontSize: 18, fontWeight: 900, color: STONE, WebkitTextStroke: `1.5px ${STONE_DARK}`, '--tx': `${120 + i * 20}px`, '--ty': `${20 - i * 15}px`, animation: anim('lgxToHearts', 700, i * 90) }}>♥</div>)}
    </>,
  },
  floaters: { charge: 'lg_fx_mirrorCharge', reflect: 'lg_fx_mirrorReflect', stoned: 'lg_fx_mirrorStoned' },
  floaterTone: { charge: 'success', reflect: 'ink', stoned: 'danger' },
  demo: { charge: { kind: 'hit', damage: 2, lives: 0 }, reflect: { kind: 'hit', damage: 5, lives: 0 }, stoned: { kind: 'miss', damage: 0, lives: 1 } },
  juice: {
    charge: { size: 'tick', sfx: 'gorgon.charge' },
    reflect: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'gorgon.reflect' },
    stoned: { size: 'medium', shake: 1, hitstop: 1, sfx: 'gorgon.stoned' },
  },
  // Reactions on the boss art box. Petrify: she freezes in grayscale with the contrast up, then a crack-shake breaks
  // it. Coil: a slow, smug coil (scale 1.03, a 2 deg sway). Glare: a tiny lean in as the gaze charges.
  css: `
.lgr-gorgon-charge { animation: lgrGorgonGlare 300ms ease-out both; transform-origin: 50% 100% }
.lgr-gorgon-reflect { animation: lgrGorgonPetrify 1200ms linear both; transform-origin: 50% 60% }
.lg-boss[data-phase="3"] .lgr-gorgon-reflect { animation-name: lgrGorgonPetrifyP3 }
.lgr-gorgon-stoned { animation: lgrGorgonCoil 780ms ease-in-out both; transform-origin: 50% 100% }
@keyframes lgrGorgonGlare { 0%, 100% { transform: none } 45% { transform: translateY(-6px) scale(1.06) } 75% { transform: translateY(-2px) scale(1.02) } }
@keyframes lgrGorgonPetrify { 0% { filter: none; transform: none } 8%, 50% { filter: grayscale(1) contrast(1.45) brightness(1.08); transform: scale(1.03) } 54% { transform: translate(-6px, 1px) } 58% { transform: translate(6px, -1px) } 62% { transform: translate(-4px, 0) } 66% { transform: translate(3px, 1px) } 70%, 82% { filter: grayscale(1) contrast(1.45) brightness(1.08); transform: none } 100% { filter: none; transform: none } }
@keyframes lgrGorgonPetrifyP3 { 0% { filter: none; transform: none } 8%, 50% { filter: grayscale(1) contrast(1.6) brightness(1.12); transform: scale(1.04) } 54% { transform: translate(-8px, 2px) } 58% { transform: translate(8px, -2px) } 62% { transform: translate(-5px, 0) } 66% { transform: translate(4px, 1px) } 70%, 82% { filter: grayscale(1) contrast(1.6) brightness(1.12); transform: none } 100% { filter: none; transform: none } }
@keyframes lgrGorgonCoil { 0%, 100% { transform: none } 30% { transform: scale(1.09) rotate(-5deg) } 62% { transform: scale(1.07) rotate(4deg) } 85% { transform: scale(1.02) rotate(-1deg) } }
@keyframes lgrGorgonRaySweep { 0% { transform: translate(-50%, -50%) rotate(var(--r0)) scaleX(.2); opacity: 0 } 25% { opacity: 1 } 80% { opacity: .9 } 100% { transform: translate(-50%, -50%) rotate(var(--r1)) scaleX(1); opacity: 0 } }
@keyframes lgrGorgonMirror { 0% { transform: scale(0) rotateY(0); opacity: 0 } 30% { transform: scale(1.2) rotateY(540deg); opacity: 1 } 55% { transform: scale(1) rotateY(720deg); opacity: 1 } 85% { opacity: 1 } 100% { transform: scale(.9) rotateY(720deg); opacity: 0 } }
@keyframes lgrGorgonBeamBack { 0% { transform: scaleY(0); opacity: 0 } 30% { transform: scaleY(1); opacity: 1 } 70% { transform: scaleY(1) scaleX(1.6); opacity: 1 } 100% { transform: scaleY(1) scaleX(.2); opacity: 0 } }
@keyframes lgrGorgonStoneCreep { 0% { transform: translate(-50%, -50%) scale(.1); opacity: 0 } 30% { opacity: .95 } 75% { transform: translate(-50%, -50%) scale(1); opacity: .95 } 100% { transform: translate(-50%, -50%) scale(1.05); opacity: 0 } }
@keyframes lgrGorgonGrayFlicker { 0% { opacity: 0 } 12% { opacity: .9 } 22% { opacity: .3 } 34% { opacity: .85 } 48% { opacity: .35 } 62% { opacity: .7 } 100% { opacity: 0 } }
/* THE REAL PARTS: the state layer this ability draws on the boss (its lg-ab-gaze-* groups in raids/gorgon.svg: light
   behind the veil, round the open eyes, round the great eye) moves with the moment. Played only while data-fx is set
   (never in focus mode, with Still bosses or under reduced motion). */
@keyframes lgrGorgonGazeGlare { 0%, 100% { transform: none; filter: none } 40% { transform: scale(1.18); filter: brightness(1.7) saturate(1.3) } }
.lg-boss[data-fx="charge"] [class*="lg-ab-gaze-"] { transform-box: fill-box; transform-origin: center; animation: lgrGorgonGazeGlare 320ms cubic-bezier(.22,1,.36,1) both }
/* THE DRAWING'S OWN PARTS (raids/gorgon.svg lg-gorgon-*, redrawn 2026-10-11): their pivots, her attack on the player,
   how each ability moment moves them, and the knockout. Pivots are in the drawing's own units (view-box): her chin
   (60, 60), the scalp, the shoulders, the hood's base. The ability rules carry a doubled class (.lg-boss.lg-boss) so
   they win over a plain strike moment playing on the same part at the same time. */
.lg-boss[data-motif="gorgon"] [class*="lg-gorgon-"] { transform-box: fill-box; transform-origin: 50% 50%; --gg: 1 }
.lg-boss[data-motif="gorgon"] .lg-gorgon-face { transform-box: view-box; transform-origin: 60px 60px; --gf: 1 }
.lg-boss[data-motif="gorgon"] .lg-p12 .lg-gorgon-face { --gf: .45 }
.lg-boss[data-motif="gorgon"] .lg-gorgon-maw { transform-origin: 50% 0 }
.lg-boss[data-motif="gorgon"] .lg-gorgon-crown { transform-box: view-box; transform-origin: 60px 22px; --gg: .5 }
.lg-boss[data-motif="gorgon"] .lg-gorgon-halfL { transform-box: view-box; transform-origin: 46px 30px; --gg: .45 }
.lg-boss[data-motif="gorgon"] .lg-gorgon-halfR { transform-box: view-box; transform-origin: 74px 30px; --gg: .45 }
.lg-boss[data-motif="gorgon"] .lg-gorgon-veil { transform-box: view-box; transform-origin: 60px 26px }
.lg-boss[data-motif="gorgon"] .lg-gorgon-beams { transform-box: view-box; transform-origin: 60px 36px }
.lg-boss[data-motif="gorgon"] .lg-gorgon-armL { transform-box: view-box; transform-origin: 40px 74px }
.lg-boss[data-motif="gorgon"] .lg-gorgon-armR { transform-box: view-box; transform-origin: 80px 74px }
.lg-boss[data-motif="gorgon"] .lg-gorgon-hood { transform-box: view-box; transform-origin: 60px 80px; --gg: .3 }
.lg-boss[data-motif="gorgon"] .lg-gorgon-heads3 { --gg: .3 }
/* Her attack on the player (impact/AssaultFx: her gaze travels to your heart as a beam and stone frosts the screen).
   The drawing does it: she rears back and squints (the charge), then thrusts her face at you with her eyes blazing
   and her jaws wide as the gaze leaves her (phase 1: the veil lifts off her eyes; phase 2: the beams flare; phase 3:
   the great eye blazes and the hood fans), holding the glare while it lands. */
@keyframes lgrGorgonAsHead { 0% { transform: none } 16% { transform: rotate(calc(-6deg * var(--gf, 1))) scale(calc(1 + -0.03 * var(--gf, 1))) } 40% { transform: rotate(calc(3deg * var(--gf, 1))) scale(calc(1 + 0.07 * var(--gf, 1))) } 80% { transform: rotate(calc(1deg * var(--gf, 1))) scale(calc(1 + 0.03 * var(--gf, 1))) } 100% { transform: none } }
@keyframes lgrGorgonAsEyes { 0% { transform: none; filter: none } 16% { transform: scaleY(.2) scaleX(1.15); filter: brightness(1.4) } 34% { transform: scale(1.6); filter: brightness(2.6) saturate(1.5) drop-shadow(0 0 2px #5dff9a) } 70% { transform: scale(1.4); filter: brightness(2) drop-shadow(0 0 2px #5dff9a) } 100% { transform: none; filter: none } }
@keyframes lgrGorgonAsMaw { 0% { transform: none } 16% { transform: scaleY(.6) } 38% { transform: scaleY(1.8) scaleX(1.1) } 75% { transform: scaleY(1.5) } 100% { transform: none } }
@keyframes lgrGorgonAsEye3 { 0% { transform: none; filter: none } 16% { transform: scale(.9) scaleY(.3); filter: brightness(1.3) } 36% { transform: scale(1.22); filter: brightness(2.4) saturate(1.5) } 72% { transform: scale(1.12); filter: brightness(1.7) } 100% { transform: none; filter: none } }
@keyframes lgrGorgonAsVeil { 0% { transform: none } 18% { transform: translateY(-3%) } 40% { transform: translateY(-16%) rotate(-5deg) } 80% { transform: translateY(-12%) rotate(-3deg) } 100% { transform: none } }
@keyframes lgrGorgonAsBeams { 0% { filter: none } 30% { filter: brightness(2.2) } 75% { filter: brightness(1.5) } 100% { filter: none } }
@keyframes lgrGorgonAsHood { 0% { transform: none } 18% { transform: scaleX(.97) } 40% { transform: scaleX(calc(1 + 0.08 * var(--gg, 1))) scaleY(calc(1 + 0.03 * var(--gg, 1))) } 80% { transform: scaleX(calc(1 + 0.05 * var(--gg, 1))) } 100% { transform: none } }
.lg-boss[data-motif="gorgon"][data-assault-on] .lg-gorgon-face { animation: lgrGorgonAsHead 800ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="gorgon"][data-assault-on] .lg-gorgon-eye { animation: lgrGorgonAsEyes 800ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="gorgon"][data-assault-on] .lg-gorgon-maw { animation: lgrGorgonAsMaw 800ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="gorgon"][data-assault-on] .lg-gorgon-eye3 { animation: lgrGorgonAsEye3 800ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="gorgon"][data-assault-on] .lg-gorgon-veil { animation: lgrGorgonAsVeil 800ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="gorgon"][data-assault-on] .lg-gorgon-beams { animation: lgrGorgonAsBeams 800ms ease-out both }
.lg-boss[data-motif="gorgon"][data-assault-on] .lg-gorgon-hood { animation: lgrGorgonAsHood 800ms cubic-bezier(.4,0,.2,1) both }
/* Charge: her eyes swell and burn brighter (the gaze filling), the veil stirs, the beams brighten. */
@keyframes lgrGorgonChargeEyes { 0%, 100% { transform: none; filter: none } 40% { transform: scale(1.4); filter: brightness(2.2) drop-shadow(0 0 2px #5dff9a) } }
@keyframes lgrGorgonChargeVeil { 0%, 100% { transform: none } 40% { transform: translateY(-5%) rotate(-2deg) } }
@keyframes lgrGorgonChargeEye3 { 0%, 100% { transform: none; filter: none } 40% { transform: scale(1.1); filter: brightness(2) drop-shadow(0 0 2px #5dff9a) } }
.lg-boss.lg-boss[data-fx="charge"] .lg-gorgon-eye { animation: lgrGorgonChargeEyes 340ms cubic-bezier(.22,1,.36,1) both }
.lg-boss.lg-boss[data-fx="charge"] .lg-gorgon-eye3 { animation: lgrGorgonChargeEye3 340ms cubic-bezier(.22,1,.36,1) both }
.lg-boss.lg-boss[data-fx="charge"] .lg-gorgon-veil { animation: lgrGorgonChargeVeil 340ms cubic-bezier(.22,1,.36,1) both }
.lg-boss.lg-boss[data-fx="charge"] .lg-gorgon-beams { animation: lgrGorgonAsBeams 340ms ease-out both }
/* Reflect: her own gaze slams back into her face (snapped back, eyes screwed shut: the lg-fx-reflect layer), she
   locks rigid as stone, the snakes frozen mid-writhe, then a crack-shake runs through her and she breaks free. */
@keyframes lgrGorgonReflectFace { 0% { transform: none } 14% { transform: rotate(calc(-11deg * var(--gf, 1))) scale(calc(1 + -0.05 * var(--gf, 1))) } 22%, 52% { transform: rotate(calc(-9deg * var(--gf, 1))) scale(calc(1 + -0.04 * var(--gf, 1))) } 55% { transform: rotate(calc(-6deg * var(--gf, 1))) } 58% { transform: rotate(calc(-11deg * var(--gf, 1))) } 62% { transform: rotate(calc(-7deg * var(--gf, 1))) } 80% { transform: rotate(calc(-2deg * var(--gf, 1))) } 100% { transform: none } }
@keyframes lgrGorgonReflectEyes { 0% { transform: none } 12%, 70% { transform: scaleY(.06) scaleX(1.15) } 85% { transform: scaleY(1.2) } 100% { transform: none } }
@keyframes lgrGorgonReflectRigid { 0% { transform: none } 14% { transform: scale(calc(1 + 0.1 * var(--gg, 1))) } 22%, 52% { transform: scale(calc(1 + 0.08 * var(--gg, 1))) } 56% { transform: scale(calc(1 + 0.08 * var(--gg, 1))) rotate(calc(-2deg * var(--gg, 1))) } 60% { transform: scale(calc(1 + 0.08 * var(--gg, 1))) rotate(calc(2deg * var(--gg, 1))) } 64% { transform: scale(calc(1 + 0.04 * var(--gg, 1))) } 100% { transform: none } }
@keyframes lgrGorgonReflectBeams { 0% { transform: none; opacity: 1 } 10%, 70% { transform: scaleX(.2); opacity: 0 } 100% { transform: none; opacity: 1 } }
.lg-boss.lg-boss[data-fx="reflect"] .lg-gorgon-face { animation: lgrGorgonReflectFace 1200ms linear both }
.lg-boss.lg-boss[data-fx="reflect"] :is(.lg-gorgon-eye, .lg-gorgon-eye3) { animation: lgrGorgonReflectEyes 1200ms linear both }
.lg-boss.lg-boss[data-fx="reflect"] :is(.lg-gorgon-crown, .lg-gorgon-halfL, .lg-gorgon-halfR, .lg-gorgon-hood) { animation: lgrGorgonReflectRigid 1200ms linear both }
.lg-boss.lg-boss[data-fx="reflect"] .lg-gorgon-beams { animation: lgrGorgonReflectBeams 1200ms linear both }
/* Stoned (her gaze took your heart): a smug tilt of the head, the snakes sway, the cobra hood fans out in triumph,
   her eyes half lidded (the lg-fx-stoned layer). */
@keyframes lgrGorgonSmugTilt { 0%, 100% { transform: none } 30% { transform: rotate(calc(5deg * var(--gf, 1))) } 70% { transform: rotate(calc(4deg * var(--gf, 1))) } }
@keyframes lgrGorgonSmugSway { 0%, 100% { transform: none } 22% { transform: rotate(calc(-5deg * var(--gg, 1))) scale(calc(1 + 0.05 * var(--gg, 1))) } 48% { transform: rotate(calc(4deg * var(--gg, 1))) scale(calc(1 + 0.06 * var(--gg, 1))) } 74% { transform: rotate(calc(-2deg * var(--gg, 1))) } }
@keyframes lgrGorgonHoodFan { 0%, 100% { transform: none } 30% { transform: scaleX(calc(1 + 0.12 * var(--gg, 1))) scaleY(calc(1 + 0.04 * var(--gg, 1))) } 70% { transform: scaleX(calc(1 + 0.08 * var(--gg, 1))) } }
.lg-boss.lg-boss[data-fx="stoned"] .lg-gorgon-face { animation: lgrGorgonSmugTilt 800ms ease-in-out both }
.lg-boss.lg-boss[data-fx="stoned"] :is(.lg-gorgon-crown, .lg-gorgon-halfL, .lg-gorgon-halfR, .lg-gorgon-heads3) { animation: lgrGorgonSmugSway 800ms ease-in-out both }
.lg-boss.lg-boss[data-fx="stoned"] .lg-gorgon-hood { animation: lgrGorgonHoodFan 800ms ease-in-out both }
/* THE KNOCKOUT (data-moment="ko", 2300 ms; kept here, not in impact/bosses/gorgon.parts.jsx, because the fallen pose
   is HELD by data-down below and the impact layer's style is shared by every boss): her own gaze turns her to stone.
   She freezes mid-recoil, eyes wide while the stone climbs (the body move stoneSet greys her), the beams die, a
   tremor, then the head cracks and drops forward, the eyes go dark, the snakes and the hood sag, the arms fall. */
@keyframes lgrGorgonKoFace { 0% { transform: none } 10%, 55% { transform: rotate(calc(-7deg * var(--gf, 1))) } 58% { transform: rotate(calc(-5deg * var(--gf, 1))) } 61% { transform: rotate(calc(-8deg * var(--gf, 1))) } 64% { transform: rotate(calc(11deg * var(--gf, 1))) } 70% { transform: rotate(calc(7deg * var(--gf, 1))) } 78%, 100% { transform: rotate(calc(9deg * var(--gf, 1))) } }
@keyframes lgrGorgonKoEyes { 0% { transform: none } 10%, 55% { transform: scale(1.35) } 60%, 100% { transform: scaleY(.12) } }
@keyframes lgrGorgonKoEye3 { 0% { transform: none } 10%, 55% { transform: scale(1.15) } 62%, 100% { transform: scaleY(.08) } }
@keyframes lgrGorgonKoCrown { 0% { transform: none } 10%, 55% { transform: scale(calc(1 + 0.06 * var(--gg, 1))) } 64% { transform: scaleY(.84) } 72%, 100% { transform: scaleY(.88) } }
@keyframes lgrGorgonKoHalfL { 0% { transform: none } 10%, 55% { transform: rotate(calc(3deg * var(--gg, 1))) } 64% { transform: rotate(-16deg) } 72%, 100% { transform: rotate(-13deg) } }
@keyframes lgrGorgonKoHalfR { 0% { transform: none } 10%, 55% { transform: rotate(calc(-3deg * var(--gg, 1))) } 64% { transform: rotate(16deg) } 72%, 100% { transform: rotate(13deg) } }
@keyframes lgrGorgonKoHood { 0% { transform: none } 10%, 55% { transform: scaleX(calc(1 + 0.05 * var(--gg, 1))) } 64% { transform: scale(.93, .9) } 72%, 100% { transform: scale(.95, .93) } }
@keyframes lgrGorgonKoHeads { 0% { transform: none } 10%, 55% { transform: scale(1.03) } 64%, 100% { transform: scale(.94) } }
@keyframes lgrGorgonKoArmL { 0% { transform: none } 10%, 55% { transform: rotate(-3deg) } 66% { transform: rotate(-14deg) translate(0, 7px) } 74%, 100% { transform: rotate(-12deg) translate(0, 6px) } }
@keyframes lgrGorgonKoArmR { 0% { transform: none } 10%, 55% { transform: rotate(3deg) } 66% { transform: rotate(14deg) translate(0, 7px) } 74%, 100% { transform: rotate(12deg) translate(0, 6px) } }
@keyframes lgrGorgonKoArmL1 { 0% { transform: none } 10%, 55% { transform: rotate(-3deg) } 66% { transform: rotate(16deg) } 74%, 100% { transform: rotate(13deg) } }
@keyframes lgrGorgonKoBeams { 0% { opacity: 1 } 14% { opacity: .3 } 26%, 100% { opacity: 0 } }
.lg-boss[data-motif="gorgon"][data-moment="ko"] .lg-gorgon-face { animation: lgrGorgonKoFace 2300ms cubic-bezier(.3,.6,.4,1) both }
.lg-boss[data-motif="gorgon"][data-moment="ko"] .lg-gorgon-eye { animation: lgrGorgonKoEyes 2300ms cubic-bezier(.3,.6,.4,1) both }
.lg-boss[data-motif="gorgon"][data-moment="ko"] .lg-gorgon-eye3 { animation: lgrGorgonKoEye3 2300ms cubic-bezier(.3,.6,.4,1) both }
.lg-boss[data-motif="gorgon"][data-moment="ko"] .lg-gorgon-crown { animation: lgrGorgonKoCrown 2300ms cubic-bezier(.3,.6,.4,1) both }
.lg-boss[data-motif="gorgon"][data-moment="ko"] .lg-gorgon-halfL { animation: lgrGorgonKoHalfL 2300ms cubic-bezier(.3,.6,.4,1) both }
.lg-boss[data-motif="gorgon"][data-moment="ko"] .lg-gorgon-halfR { animation: lgrGorgonKoHalfR 2300ms cubic-bezier(.3,.6,.4,1) both }
.lg-boss[data-motif="gorgon"][data-moment="ko"] .lg-gorgon-hood { animation: lgrGorgonKoHood 2300ms cubic-bezier(.3,.6,.4,1) both }
.lg-boss[data-motif="gorgon"][data-moment="ko"] .lg-gorgon-heads3 { animation: lgrGorgonKoHeads 2300ms cubic-bezier(.3,.6,.4,1) both }
.lg-boss[data-motif="gorgon"][data-moment="ko"] .lg-p12 .lg-gorgon-armL { animation: lgrGorgonKoArmL 2300ms cubic-bezier(.3,.6,.4,1) both }
.lg-boss[data-motif="gorgon"][data-moment="ko"] .lg-p12 .lg-gorgon-armR { animation: lgrGorgonKoArmR 2300ms cubic-bezier(.3,.6,.4,1) both }
.lg-boss[data-motif="gorgon"][data-moment="ko"] .lg-p1 .lg-gorgon-armL { animation: lgrGorgonKoArmL1 2300ms cubic-bezier(.3,.6,.4,1) both }
.lg-boss[data-motif="gorgon"][data-moment="ko"] .lg-gorgon-beams { animation: lgrGorgonKoBeams 2300ms linear both }
/* KNOCKED OUT: the cinematic ends in this pose and data-down HOLDS it (each value = the last keyframe above). */
.lg-boss[data-motif="gorgon"][data-down]:not([data-moment="ko"]) .lg-gorgon-face { transform: rotate(calc(9deg * var(--gf, 1))) }
.lg-boss[data-motif="gorgon"][data-down]:not([data-moment="ko"]) .lg-gorgon-eye { transform: scaleY(.12) }
.lg-boss[data-motif="gorgon"][data-down]:not([data-moment="ko"]) .lg-gorgon-eye3 { transform: scaleY(.08) }
.lg-boss[data-motif="gorgon"][data-down]:not([data-moment="ko"]) .lg-gorgon-crown { transform: scaleY(.88) }
.lg-boss[data-motif="gorgon"][data-down]:not([data-moment="ko"]) .lg-gorgon-halfL { transform: rotate(-13deg) }
.lg-boss[data-motif="gorgon"][data-down]:not([data-moment="ko"]) .lg-gorgon-halfR { transform: rotate(13deg) }
.lg-boss[data-motif="gorgon"][data-down]:not([data-moment="ko"]) .lg-gorgon-hood { transform: scale(.95, .93) }
.lg-boss[data-motif="gorgon"][data-down]:not([data-moment="ko"]) .lg-gorgon-heads3 { transform: scale(.94) }
.lg-boss[data-motif="gorgon"][data-down]:not([data-moment="ko"]) .lg-p12 .lg-gorgon-armL { transform: rotate(-12deg) translate(0, 6px) }
.lg-boss[data-motif="gorgon"][data-down]:not([data-moment="ko"]) .lg-p12 .lg-gorgon-armR { transform: rotate(12deg) translate(0, 6px) }
.lg-boss[data-motif="gorgon"][data-down]:not([data-moment="ko"]) .lg-p1 .lg-gorgon-armL { transform: rotate(13deg) }
.lg-boss[data-motif="gorgon"][data-down]:not([data-moment="ko"]) .lg-gorgon-beams { opacity: 0 }
`,
}
