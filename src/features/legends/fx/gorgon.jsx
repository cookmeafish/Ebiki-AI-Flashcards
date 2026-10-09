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
  <div key={key} className="lgx" style={{ left: '50%', top: '34%', width: '135%', height: 3, borderRadius: 3, background: `linear-gradient(90deg, transparent, ${GAZE} 30%, #ffffff 50%, ${GAZE} 70%, transparent)`, boxShadow: `0 0 8px ${GAZE}`, '--r0': `${r0}deg`, '--r1': `${r1}deg`, animation: anim('lgrGorgonRaySweep', 320, delay) }} />
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
      <div className="lgx" style={{ left: '50%', top: '34%', width: 10, height: '52%', marginLeft: -5, borderRadius: 6, transformOrigin: '50% 100%', background: `linear-gradient(0deg, #ffffff, ${GAZE} 40%, #19c96a)`, boxShadow: `0 0 14px ${GAZE}`, animation: anim('lgrGorgonBeamBack', 650, 200, 'ease-out') }} />
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
/* THE REAL PARTS: the state layer this ability draws on the boss (its lg-ab-* group in raids/gorgon.svg) moves with
   the moment, not only the whole figure. Played only while data-fx is set (never in focus mode, with Still bosses or
   under reduced motion). */
@keyframes lgrGorgonGazeGlare { 0%, 100% { transform: none; filter: none } 40% { transform: scale(1.18); filter: brightness(1.7) saturate(1.3) } }
.lg-boss[data-fx="charge"] [class*="lg-ab-gaze-"] { transform-box: fill-box; transform-origin: center; animation: lgrGorgonGazeGlare 320ms cubic-bezier(.22,1,.36,1) both }
/* THE DRAWING'S OWN PARTS (raids/gorgon.svg lg-gorgon-*): their pivots, her attack on the player, and how each ability
   moment moves them. The ability rules carry a doubled class (.lg-boss.lg-boss) so they win over a plain strike
   moment playing on the same part at the same time. */
.lg-boss[data-motif="gorgon"] [class*="lg-gorgon-"] { transform-box: fill-box; transform-origin: 50% 50% }
.lg-boss[data-motif="gorgon"] .lg-gorgon-face, .lg-boss[data-motif="gorgon"] .lg-gorgon-face2 { transform-origin: 50% 88% }
.lg-boss[data-motif="gorgon"] .lg-gorgon-maw { transform-origin: 50% 0 }
.lg-boss[data-motif="gorgon"] .lg-gorgon-crown { transform-origin: 50% 95% }
.lg-boss[data-motif="gorgon"] .lg-gorgon-front, .lg-boss[data-motif="gorgon"] .lg-gorgon-wings { transform-origin: 50% 85% }
.lg-boss[data-motif="gorgon"] .lg-gorgon-armR { transform-origin: 8% 92% }
.lg-boss[data-motif="gorgon"] .lg-gorgon-armL { transform-origin: 92% 12% }
.lg-boss[data-motif="gorgon"] .lg-gorgon-halfL { transform-origin: 100% 100% }
.lg-boss[data-motif="gorgon"] .lg-gorgon-halfR { transform-origin: 0 100% }
/* Her attack on the player (impact/AssaultFx: her gaze travels to your heart as a beam and stone frosts the screen).
   The drawing does it: she rears back and squints (the charge), then thrusts her head at you with her eyes blazing and
   her jaws wide as the gaze leaves her, holding the glare while it lands. */
@keyframes lgrGorgonAsHead { 0% { transform: none } 16% { transform: translateY(-16%) rotate(-9deg) scale(.92) } 40% { transform: translateY(12%) rotate(3deg) scale(1.34) } 52% { transform: translateY(9%) scale(1.28) } 80% { transform: translateY(4%) scale(1.12) } 100% { transform: none } }
@keyframes lgrGorgonAsEyes { 0% { transform: none; filter: none } 16% { transform: scaleY(.2) scaleX(1.15); filter: brightness(1.4) } 34% { transform: scale(2.3); filter: brightness(3) saturate(1.5) drop-shadow(0 0 3px #5dff9a) } 70% { transform: scale(1.8); filter: brightness(2.2) drop-shadow(0 0 3px #5dff9a) } 100% { transform: none; filter: none } }
@keyframes lgrGorgonAsMaw { 0% { transform: none } 16% { transform: scaleY(.5) } 38% { transform: scaleY(2.4) scaleX(1.15) } 75% { transform: scaleY(1.9) } 100% { transform: none } }
@keyframes lgrGorgonAsEye3 { 0% { transform: none; filter: none } 16% { transform: scale(.7) scaleY(.3); filter: brightness(1.3) } 36% { transform: scale(1.6); filter: brightness(2.8) saturate(1.5) } 72% { transform: scale(1.35); filter: brightness(1.8) } 100% { transform: none; filter: none } }
.lg-boss[data-motif="gorgon"][data-assault-on] .lg-gorgon-face, .lg-boss[data-motif="gorgon"][data-assault-on] .lg-gorgon-face2 { animation: lgrGorgonAsHead 800ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="gorgon"][data-assault-on] .lg-gorgon-eye { animation: lgrGorgonAsEyes 800ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="gorgon"][data-assault-on] .lg-gorgon-maw { animation: lgrGorgonAsMaw 800ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="gorgon"][data-assault-on] .lg-gorgon-eye3 { animation: lgrGorgonAsEye3 800ms cubic-bezier(.4,0,.2,1) both }
/* Charge: her eyes swell and burn brighter (the gaze filling). */
@keyframes lgrGorgonChargeEyes { 0%, 100% { transform: none; filter: none } 40% { transform: scale(1.45); filter: brightness(2.2) drop-shadow(0 0 2px #5dff9a) } }
.lg-boss.lg-boss[data-fx="charge"] .lg-gorgon-eye, .lg-boss.lg-boss[data-fx="charge"] .lg-gorgon-eye3 { animation: lgrGorgonChargeEyes 340ms cubic-bezier(.22,1,.36,1) both }
/* Reflect: her own beam slams back into her face (snapped back, eyes shut tight), she locks rigid as stone, the snakes
   frozen mid-writhe, then a crack-shake runs through the statue and she breaks free. */
@keyframes lgrGorgonReflectFace { 0% { transform: none } 14% { transform: translateY(-7%) rotate(-11deg) scale(.92) } 22%, 52% { transform: translateY(-6%) rotate(-9deg) scale(.93) } 55% { transform: translateY(-6%) rotate(-7deg) translateX(-3%) } 58% { transform: translateY(-6%) rotate(-11deg) translateX(3%) } 62% { transform: translateY(-5%) rotate(-8deg) } 80% { transform: translateY(-1%) rotate(-2deg) } 100% { transform: none } }
@keyframes lgrGorgonReflectEyes { 0% { transform: none } 12%, 70% { transform: scaleY(.06) scaleX(1.15) } 85% { transform: scaleY(1.2) } 100% { transform: none } }
@keyframes lgrGorgonReflectRigid { 0% { transform: none } 14% { transform: scale(1.16) } 22%, 52% { transform: scale(1.12) } 56% { transform: scale(1.12) translateX(-2%) } 60% { transform: scale(1.12) translateX(2%) } 64% { transform: scale(1.06) translateY(3%) } 100% { transform: none } }
.lg-boss.lg-boss[data-fx="reflect"] .lg-gorgon-face, .lg-boss.lg-boss[data-fx="reflect"] .lg-gorgon-face2, .lg-boss.lg-boss[data-fx="reflect"] .lg-gorgon-eye3 { animation: lgrGorgonReflectFace 1200ms linear both }
.lg-boss.lg-boss[data-fx="reflect"] .lg-gorgon-eye { animation: lgrGorgonReflectEyes 1200ms linear both }
.lg-boss.lg-boss[data-fx="reflect"] .lg-gorgon-crown, .lg-boss.lg-boss[data-fx="reflect"] .lg-gorgon-front, .lg-boss.lg-boss[data-fx="reflect"] .lg-gorgon-wings, .lg-boss.lg-boss[data-fx="reflect"] .lg-gorgon-knot3, .lg-boss.lg-boss[data-fx="reflect"] .lg-gorgon-heads3 { animation: lgrGorgonReflectRigid 1200ms linear both }
/* Stoned (her gaze took your heart): she coils back smug, the snakes sway and the cobra hood fans out in triumph. */
@keyframes lgrGorgonSmugSway { 0%, 100% { transform: none } 22% { transform: rotate(-6deg) scale(1.08) } 48% { transform: rotate(5deg) scale(1.1) } 74% { transform: rotate(-2deg) scale(1.04) } }
@keyframes lgrGorgonHoodFan { 0%, 100% { transform: none } 30% { transform: scaleX(1.32) scaleY(1.06) } 70% { transform: scaleX(1.22) } }
.lg-boss.lg-boss[data-fx="stoned"] .lg-gorgon-crown, .lg-boss.lg-boss[data-fx="stoned"] .lg-gorgon-front, .lg-boss.lg-boss[data-fx="stoned"] .lg-gorgon-heads3 { animation: lgrGorgonSmugSway 800ms ease-in-out both }
.lg-boss.lg-boss[data-fx="stoned"] .lg-gorgon-hood, .lg-boss.lg-boss[data-fx="stoned"] .lg-gorgon-wings { animation: lgrGorgonHoodFan 800ms ease-in-out both }
/* THE KNOCKOUT (data-moment="ko"): kept here, not in impact/bosses/gorgon.parts.jsx, because its 2300 ms outlasts the
   shortest knockout and the impact layer's style is shared by every boss.
   the knockout: her own gaze turns her to stone, the snakes stiffen and sag, the head cracks and drops at the climax */
@keyframes lgrGorgonKoFace { 0% { transform: none } 8%, 55% { transform: translateY(-4%) rotate(-6deg) } 62% { transform: translateY(5%) rotate(5deg) } 66% { transform: translateY(4%) rotate(3deg) } 88% { transform: translateY(3%) rotate(2deg) } 100% { transform: none } }
@keyframes lgrGorgonKoSnakes { 0% { transform: none } 10%, 55% { transform: scale(1.12) } 63% { transform: scaleY(.84) translateY(9%) } 88% { transform: scaleY(.88) translateY(7%) } 100% { transform: none } }
@keyframes lgrGorgonKoWings { 0% { transform: none } 10%, 55% { transform: scaleX(1.1) } 63% { transform: translateY(7%) rotate(3deg) scaleX(.94) } 88% { transform: translateY(5%) rotate(2deg) } 100% { transform: none } }
@keyframes lgrGorgonKoEyes { 0% { transform: none } 10%, 55% { transform: scale(1.5) } 60% { transform: scaleY(.1) } 90% { transform: scaleY(.1) } 100% { transform: none } }
@keyframes lgrGorgonKoEye3 { 0% { transform: none } 10%, 55% { transform: scale(1.3) } 62% { transform: scale(.7) scaleY(.15) } 90% { transform: scale(.7) scaleY(.15) } 100% { transform: none } }
.lg-boss[data-motif="gorgon"][data-moment="ko"] .lg-gorgon-face, .lg-boss[data-motif="gorgon"][data-moment="ko"] .lg-gorgon-face2 { animation: lgrGorgonKoFace 2300ms cubic-bezier(.3,.6,.4,1) both }
.lg-boss[data-motif="gorgon"][data-moment="ko"] .lg-gorgon-crown, .lg-boss[data-motif="gorgon"][data-moment="ko"] .lg-gorgon-front, .lg-boss[data-motif="gorgon"][data-moment="ko"] .lg-gorgon-heads3 { animation: lgrGorgonKoSnakes 2300ms cubic-bezier(.3,.6,.4,1) both }
.lg-boss[data-motif="gorgon"][data-moment="ko"] .lg-gorgon-wings, .lg-boss[data-motif="gorgon"][data-moment="ko"] .lg-gorgon-hood { animation: lgrGorgonKoWings 2300ms cubic-bezier(.3,.6,.4,1) both }
.lg-boss[data-motif="gorgon"][data-moment="ko"] .lg-gorgon-eye { animation: lgrGorgonKoEyes 2300ms cubic-bezier(.3,.6,.4,1) both }
.lg-boss[data-motif="gorgon"][data-moment="ko"] .lg-gorgon-eye3 { animation: lgrGorgonKoEye3 2300ms cubic-bezier(.3,.6,.4,1) both }
.lg-boss[data-motif="gorgon"][data-moment="ko"] .lg-gorgon-knot3 { animation: lgrGorgonKoSnakes 2300ms cubic-bezier(.3,.6,.4,1) both }
`,
}
