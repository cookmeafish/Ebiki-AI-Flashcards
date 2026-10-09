// What the Inferno's Pressure Vent (abilities/inferno.js) LOOKS like. The fx contract is in fx/index.js, the juice in
// fx/_juice.js. Fixed fire colors with a white-hot core, so they read over any palette.
//   heat (tick): embers rise; the gauge glows hotter.
//   cool (tick): a puff of steam.
//   vent (medium): a long flame cone roars across the boss from the left edge.
//   blast (big): the same vent from a hotter gauge: a double cone, a fire ring and a spray of sparks.
//   erupt (big): the floor splits, a column of fire fills the arena height, lava blobs arc out and fall.
// Boss reactions (body only; faces are the art pass's lg-fx-<key> layers): Blowback (vent, blast, erupt), Hiss, Smolder.
import { anim, around, ring, shards } from './_kit'
import { pivots } from '../impact/bosses/inferno.parts'

// THE BOSS'S OWN PARTS (raids/inferno.svg hook classes; pivots in impact/bosses/inferno.parts.jsx) for what is not a
// plain strike moment: its fire-breath attack on the player (data-assault-on, from the moment the attack fires: it rears
// back, lunges at the player with the jaw gaping and roars while the breath crosses the card; a heavy blow lunges harder
// and snaps a second time when the second blast lands), its ability reactions (.lgr-inferno-<fx>) and its fallen pose
// once the knockout cinematic has played (held while the defeated tag is up). Off with every effect (lg-fx-off).
const P = '.lg-boss[data-motif="inferno"]'
const A = `${P}[data-assault-on]`
const H = `${P}[data-assault-on][data-moment="hurtBig"]`
const PARTS_CSS = `
@keyframes lgrInfernoBreathHead { 0% { transform: none } 8% { transform: translate(-5%, -12%) rotate(-12deg) scale(.95) } 11% { transform: translate(12%, 4%) rotate(11deg) scale(1.16) } 14% { transform: translate(14%, 5%) rotate(12deg) scale(1.2) } 22% { transform: translate(11%, 4%) rotate(10deg) scale(1.15) } 26% { transform: translate(13%, 5%) rotate(12deg) scale(1.17) } 32% { transform: translate(11%, 3%) rotate(10deg) scale(1.15) } 46% { transform: translate(10%, 3%) rotate(9deg) scale(1.13) } 70% { transform: translate(-2%, -1%) rotate(-2deg) } 100% { transform: none } }
@keyframes lgrInfernoBreathJaw { 0% { transform: none } 8% { transform: scaleY(1.2) } 11% { transform: scaleY(1.7) } 46% { transform: scaleY(1.6) } 62% { transform: scaleY(.85) } 76% { transform: none } }
@keyframes lgrInfernoBreathWingL { 0% { transform: none } 8% { transform: rotate(14deg) } 12% { transform: rotate(-6deg) } 18% { transform: rotate(4deg) } 50% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgrInfernoBreathWingR { 0% { transform: none } 8% { transform: rotate(-14deg) } 12% { transform: rotate(6deg) } 18% { transform: rotate(-4deg) } 50% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgrInfernoBreathBody { 0% { transform: none } 8% { transform: translate(-2%, 1%) } 12% { transform: translate(3%, -1%) } 50% { transform: translate(2%, 0) } 100% { transform: none } }
@keyframes lgrInfernoBreathSkull { 0% { transform: none } 8% { transform: scale(.85, 1.1) } 12% { transform: translate(10%, 4%) scale(1.3) } 46% { transform: translate(8%, 3%) scale(1.25) } 100% { transform: none } }
${A} .lg-inferno-head { animation: lgrInfernoBreathHead 1300ms cubic-bezier(.3,.7,.4,1) both }
${A} .lg-inferno-jaw { animation: lgrInfernoBreathJaw 1300ms ease-out both }
${A} .lg-inferno-wingl { animation: lgrInfernoBreathWingL 1300ms ease-out both }
${A} .lg-inferno-wingr { animation: lgrInfernoBreathWingR 1300ms ease-out both }
${A} .lg-inferno-body { animation: lgrInfernoBreathBody 1300ms ease-out both }
${A} .lg-inferno-flameskull { animation: lgrInfernoBreathSkull 1300ms ease-out both }
@keyframes lgrInfernoInfernoHead { 0% { transform: translate(-5%, -12%) rotate(-12deg) scale(.95) } 3% { transform: translate(16%, 6%) rotate(14deg) scale(1.14) } 8% { transform: translate(14%, 5%) rotate(12deg) scale(1.12) } 30% { transform: translate(13%, 5%) rotate(12deg) scale(1.1) } 33% { transform: translate(-2%, -8%) rotate(-6deg) scale(1.05) } 37% { transform: translate(18%, 7%) rotate(15deg) scale(1.18) } 55% { transform: translate(13%, 5%) rotate(11deg) scale(1.1) } 78% { transform: translate(-2%, -1%) rotate(-2deg) } 100% { transform: none } }
@keyframes lgrInfernoInfernoJaw { 0% { transform: scaleY(1.2) } 3%, 30% { transform: scaleY(1.85) } 33% { transform: scaleY(1.2) } 37%, 55% { transform: scaleY(1.95) } 70% { transform: scaleY(.85) } 82% { transform: none } }
${H} .lg-inferno-head { animation: lgrInfernoInfernoHead 1300ms cubic-bezier(.3,.7,.4,1) both }
${H} .lg-inferno-jaw { animation: lgrInfernoInfernoJaw 1300ms ease-out both }

@keyframes lgrInfernoHeatHead { 0% { transform: none } 40% { transform: translateY(-7%) scale(1.06) } 100% { transform: none } }
@keyframes lgrInfernoHeatFire { 0% { transform: none } 35% { transform: scale(1.25, 1.8) } 100% { transform: none } }
.lgr-inferno-heat .lg-inferno-head { animation: lgrInfernoHeatHead 340ms ease-out both }
.lgr-inferno-heat .lg-inferno-kindle, .lgr-inferno-heat .lg-inferno-flameskull { animation: lgrInfernoHeatFire 340ms ease-out both }
@keyframes lgrInfernoCoolFire { 0% { transform: none } 30% { transform: scale(.75, .3) } 100% { transform: none } }
@keyframes lgrInfernoCoolRiver { 0% { transform: none } 30% { transform: translateY(8%) scaleY(.85) } 100% { transform: none } }
@keyframes lgrInfernoCoolArm { 0% { transform: none } 30% { transform: scale(.92, .86) } 100% { transform: none } }
.lgr-inferno-cool .lg-inferno-kindle { animation: lgrInfernoCoolFire 340ms ease-out both }
.lgr-inferno-cool .lg-inferno-river { animation: lgrInfernoCoolRiver 340ms ease-out both }
.lgr-inferno-cool .lg-inferno-arml, .lgr-inferno-cool .lg-inferno-armr { animation: lgrInfernoCoolArm 340ms ease-out both }
@keyframes lgrInfernoVentHead { 0% { transform: none } 14% { transform: translate(12%, -4%) rotate(16deg) } 34% { transform: translate(10%, -3%) rotate(13deg) } 60% { transform: translate(-3%, 0) rotate(-4deg) } 100% { transform: none } }
@keyframes lgrInfernoVentJaw { 0% { transform: none } 14% { transform: scaleY(1.45) } 40% { transform: scaleY(1.35) } 70% { transform: none } }
@keyframes lgrInfernoVentWingL { 0% { transform: none } 14% { transform: rotate(-24deg) } 40% { transform: rotate(-18deg) } 70% { transform: rotate(6deg) } 100% { transform: none } }
@keyframes lgrInfernoVentWingR { 0% { transform: none } 18% { transform: rotate(-12deg) } 42% { transform: rotate(-8deg) } 72% { transform: rotate(4deg) } 100% { transform: none } }
.lgr-inferno-vent .lg-inferno-head { animation: lgrInfernoVentHead 780ms ease-out both }
.lgr-inferno-vent .lg-inferno-jaw { animation: lgrInfernoVentJaw 780ms ease-out both }
.lgr-inferno-vent .lg-inferno-wingl { animation: lgrInfernoVentWingL 780ms ease-out both }
.lgr-inferno-vent .lg-inferno-wingr { animation: lgrInfernoVentWingR 780ms ease-out both }
@keyframes lgrInfernoBlastHead { 0% { transform: none } 10% { transform: translate(10%, -10%) rotate(14deg) } 20% { transform: translate(6%, -6%) rotate(8deg) } 30% { transform: translate(14%, -14%) rotate(20deg) scale(.95) } 55% { transform: translate(10%, -9%) rotate(14deg) } 80% { transform: translate(-2%, 1%) rotate(-3deg) } 100% { transform: none } }
@keyframes lgrInfernoBlastWingL { 0% { transform: none } 10% { transform: rotate(-30deg) } 22% { transform: rotate(-16deg) } 32% { transform: rotate(-36deg) } 48% { transform: rotate(-28deg) } 56% { transform: rotate(-33deg) } 80% { transform: rotate(6deg) } 100% { transform: none } }
@keyframes lgrInfernoBlastWingR { 0% { transform: none } 12% { transform: rotate(-20deg) } 24% { transform: rotate(-6deg) } 34% { transform: rotate(-28deg) } 50% { transform: rotate(-20deg) } 58% { transform: rotate(-25deg) } 82% { transform: rotate(5deg) } 100% { transform: none } }
@keyframes lgrInfernoBlastArmL { 0% { transform: none } 12% { transform: translate(-6%, -12%) rotate(-16deg) } 34% { transform: translate(-8%, -16%) rotate(-20deg) } 70% { transform: none } }
@keyframes lgrInfernoBlastArmR { 0% { transform: none } 12% { transform: translate(6%, -12%) rotate(16deg) } 34% { transform: translate(8%, -16%) rotate(20deg) } 70% { transform: none } }
.lgr-inferno-blast .lg-inferno-head { animation: lgrInfernoBlastHead 1150ms ease-out both }
.lgr-inferno-blast .lg-inferno-jaw { animation: lgrInfernoVentJaw 1150ms ease-out both }
.lgr-inferno-blast .lg-inferno-wingl { animation: lgrInfernoBlastWingL 1150ms ease-out both }
.lgr-inferno-blast .lg-inferno-wingr { animation: lgrInfernoBlastWingR 1150ms ease-out both }
.lgr-inferno-blast .lg-inferno-arml { animation: lgrInfernoBlastArmL 1150ms ease-out both }
.lgr-inferno-blast .lg-inferno-armr { animation: lgrInfernoBlastArmR 1150ms ease-out both }
@keyframes lgrInfernoEruptRiver { 0% { transform: none } 10% { transform: translateY(-16%) scaleY(1.45) } 22% { transform: translateY(-10%) scaleY(1.3) } 34% { transform: translateY(-18%) scaleY(1.5) } 60% { transform: translateY(-6%) scaleY(1.15) } 100% { transform: none } }
@keyframes lgrInfernoEruptBody { 0% { transform: none } 10% { transform: translateY(-8%) scale(1.1, 1.12) } 16% { transform: translate(-1.5%, -9%) } 22% { transform: translate(1.5%, -8%) } 28% { transform: translate(-1.5%, -9%) } 34% { transform: translate(1%, -10%) } 60% { transform: translateY(-4%) } 76% { transform: translateY(1.5%) } 100% { transform: none } }
@keyframes lgrInfernoEruptHead { 0% { transform: none } 12% { transform: translateY(-18%) rotate(-14deg) scale(1.08) } 22% { transform: translateY(-16%) rotate(-10deg) scale(1.08) } 34% { transform: translateY(-20%) rotate(-16deg) scale(1.1) } 60% { transform: translateY(-8%) rotate(-6deg) } 82% { transform: translateY(2%) } 100% { transform: none } }
@keyframes lgrInfernoEruptJaw { 0% { transform: none } 12%, 60% { transform: scaleY(1.8) } 18%, 30%, 44% { transform: scaleY(1.6) } 80% { transform: none } }
@keyframes lgrInfernoEruptWingL { 0% { transform: none } 12% { transform: rotate(32deg) } 18%, 30%, 42% { transform: rotate(27deg) } 24%, 36%, 48% { transform: rotate(33deg) } 70% { transform: rotate(8deg) } 100% { transform: none } }
@keyframes lgrInfernoEruptWingR { 0% { transform: none } 12% { transform: rotate(-32deg) } 18%, 30%, 42% { transform: rotate(-27deg) } 24%, 36%, 48% { transform: rotate(-33deg) } 70% { transform: rotate(-8deg) } 100% { transform: none } }
@keyframes lgrInfernoEruptFire { 0% { transform: none } 12% { transform: scale(1.4, 2.4) } 40% { transform: scale(1.3, 2.1) } 100% { transform: none } }
.lgr-inferno-erupt .lg-inferno-river { animation: lgrInfernoEruptRiver 1200ms ease-out both }
.lgr-inferno-erupt .lg-inferno-body, .lgr-inferno-erupt .lg-inferno-throne { animation: lgrInfernoEruptBody 1200ms linear both }
.lgr-inferno-erupt .lg-inferno-head { animation: lgrInfernoEruptHead 1200ms ease-out both }
.lgr-inferno-erupt .lg-inferno-jaw { animation: lgrInfernoEruptJaw 1200ms linear both }
.lgr-inferno-erupt .lg-inferno-wingl { animation: lgrInfernoEruptWingL 1200ms ease-out both }
.lgr-inferno-erupt .lg-inferno-wingr { animation: lgrInfernoEruptWingR 1200ms ease-out both }
.lgr-inferno-erupt .lg-inferno-kindle, .lgr-inferno-erupt .lg-inferno-flameskull { animation: lgrInfernoEruptFire 1200ms ease-out both }

${P}:not(.lg-fx-off):has([data-ko-tag]):not([data-moment]) .lg-inferno-head { transform: translateY(18%) rotate(12deg) scale(.92) }
${P}:not(.lg-fx-off):has([data-ko-tag]):not([data-moment]) .lg-inferno-jaw { transform: scaleY(1.32) rotate(4deg) }
${P}:not(.lg-fx-off):has([data-ko-tag]):not([data-moment]) .lg-inferno-wingl { transform: rotate(-36deg) }
${P}:not(.lg-fx-off):has([data-ko-tag]):not([data-moment]) .lg-inferno-wingr { transform: rotate(36deg) }
${P}:not(.lg-fx-off):has([data-ko-tag]):not([data-moment]) .lg-inferno-arml { transform: translate(-4%, 12%) rotate(12deg) }
${P}:not(.lg-fx-off):has([data-ko-tag]):not([data-moment]) .lg-inferno-armr { transform: translate(4%, 12%) rotate(-12deg) }
${P}:not(.lg-fx-off):has([data-ko-tag]):not([data-moment]) .lg-inferno-kindle, ${P}:not(.lg-fx-off):has([data-ko-tag]):not([data-moment]) .lg-inferno-flameskull { transform: scale(.4, .06) }
${P}:not(.lg-fx-off):has([data-ko-tag]):not([data-moment]) .lg-inferno-river { transform: translateY(14%) scaleY(.8) }
`

const YELLOW = '#ffe14a'
const ORANGE = '#ff8a1c'
const RED = '#ff3b1f'
const LAVA = '#ff5a00'
const STEAM = '#f2f6fa'
const FIRE = `linear-gradient(to right, rgba(255,59,31,0), ${RED} 18%, ${ORANGE} 45%, ${YELLOW} 75%, #ffffff)`

const cone = (key, top, h, delay, scale = 1) => (
  <div key={key} className="lgx" style={{ left: '-35%', top, width: '150%', height: h, transformOrigin: 'left center', clipPath: 'polygon(0 42%, 100% 0, 100% 100%, 0 58%)', background: FIRE, filter: `drop-shadow(0 0 10px ${ORANGE})`, '--s': scale, animation: anim('lgrInfernoCone', 760, delay, 'cubic-bezier(.22,1,.36,1)') }} />
)
const ember = (key, style) => <div key={key} className="lgx" style={{ width: 7, height: 7, borderRadius: '50%', background: `radial-gradient(circle, #ffffff, ${YELLOW} 40%, ${ORANGE})`, boxShadow: `0 0 6px ${ORANGE}`, ...style }} />

export default {
  effects: {
    heat: () => <>
      {/* three flame tongues lick up from the floor (dark-edged so they read over the fire art), embers ride them */}
      {[0, 1, 2].map((i) => (
        <svg key={`f${i}`} className="lgx" viewBox="0 0 20 34" style={{ left: `${26 + i * 22}%`, bottom: '0%', width: 26 + (i % 2) * 8, height: 44 + (i % 2) * 12, marginLeft: -13, overflow: 'visible', transformOrigin: '50% 100%', filter: `drop-shadow(0 0 6px ${ORANGE})`, animation: anim('lgrInfernoLick', 330, i * 40, 'cubic-bezier(.3,1.4,.5,1)') }} aria-hidden="true">
          <path d="M10 1C13 9 19 13 18 22 17 30 13 33 10 33S2 30 2 22C2 15 7 13 7 7 9 10 9 6 10 1Z" fill={RED} stroke="#3a0c00" strokeWidth="1.5" />
          <path d="M10 12C12 17 15 20 14 25 13 29 11 31 10 31S6 29 6 25C6 21 9 19 10 12Z" fill={YELLOW} />
        </svg>
      ))}
      {[0, 1, 2, 3].map((i) => ember(i, { left: `${25 + i * 16}%`, bottom: '18%', '--h': `${-50 - (i % 2) * 20}px`, animation: anim('lgxRise', 340, i * 25) }))}
    </>,
    cool: () => <>
      {[0, 1, 2].map((i) => (
        <div key={i} className="lgx" style={{ left: `${26 + i * 16}%`, bottom: '12%', width: 46, height: 34, borderRadius: '50% 55% 45% 50%', background: `radial-gradient(circle at 40% 40%, #ffffff, ${STEAM} 40%, #b9dcf2)`, boxShadow: '0 0 0 1.5px #3a6a8a, 0 0 10px #bfe6ff', '--h': `${-50 - i * 6}px`, animation: anim('lgxRise', 340, i * 30) }} />
      ))}
    </>,
    vent: () => <>
      {cone('a', '30%', '40%', 0)}
      {around(6, (i) => ember(i, { left: `${10 + i * 14}%`, top: `${38 + (i % 3) * 8}%`, '--h': `${-30 - (i % 3) * 18}px`, animation: anim('lgxRise', 600, 150 + i * 30) }))}
    </>,
    blast: () => <>
      {cone('a', '18%', '50%', 0, 1.1)}
      {cone('b', '42%', '38%', 90)}
      {ring(YELLOW, 260, 1.8, 5, 650)}
      {shards(16, ORANGE, -115, 9)}
    </>,
    erupt: () => <>
      {/* the floor splits: a glowing jagged crack */}
      <div className="lgx" style={{ left: '-10%', right: '-10%', bottom: '2%', height: 16, background: `linear-gradient(to right, transparent, ${LAVA} 15%, ${YELLOW} 50%, ${LAVA} 85%, transparent)`, clipPath: 'polygon(0 50%, 12% 20%, 22% 70%, 34% 10%, 46% 80%, 58% 15%, 70% 75%, 82% 25%, 92% 65%, 100% 50%, 92% 90%, 82% 55%, 70% 100%, 58% 45%, 46% 100%, 34% 40%, 22% 95%, 12% 55%)', filter: `drop-shadow(0 0 8px ${ORANGE})`, animation: anim('lgxFade', 1100) }} />
      {/* the column of fire, white-hot in the middle */}
      <div className="lgx" style={{ left: '50%', bottom: '-10%', width: '58%', height: '170%', marginLeft: '-29%', transformOrigin: 'bottom', borderRadius: '50% 50% 10% 10% / 30% 30% 5% 5%', background: `linear-gradient(to right, rgba(255,59,31,0), ${RED} 15%, ${ORANGE} 32%, ${YELLOW} 46%, #ffffff 50%, ${YELLOW} 54%, ${ORANGE} 68%, ${RED} 85%, rgba(255,59,31,0))`, boxShadow: `0 0 50px ${ORANGE}`, animation: anim('lgrInfernoColumn', 1150, 120, 'cubic-bezier(.22,1,.36,1)') }} />
      {/* lava blobs arc out and fall */}
      {around(10, (i) => (
        <div key={i} className="lgx" style={{ left: '50%', bottom: '20%', width: 12 + (i % 3) * 4, height: 12 + (i % 3) * 4, borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, ${YELLOW}, ${LAVA} 60%, #a32000)`, boxShadow: `0 0 8px ${LAVA}`, '--vx': `${(i % 2 ? 1 : -1) * (40 + (i % 5) * 22)}px`, '--vy': `${-90 - (i % 4) * 22}px`, animation: anim('lgrInfernoLava', 1000, 200 + i * 30, 'linear') }} />
      ))}
      {ring(ORANGE, 160, 2.1, 7, 700)}
    </>,
  },
  floaters: { heat: 'lg_fx_heat', cool: 'lg_fx_cool', vent: 'lg_fx_vent', blast: 'lg_fx_ventBlast', erupt: 'lg_fx_erupt' },
  floaterTone: { heat: 'warning', cool: 'info', vent: 'danger', blast: 'danger', erupt: 'danger' },
  demo: { heat: { kind: 'hit', damage: 2, lives: 0 }, cool: { kind: 'miss', damage: 0, lives: 1 }, vent: { kind: 'hit', damage: 1, lives: 0 }, blast: { kind: 'hit', damage: 2, lives: 0 }, erupt: { kind: 'hit', damage: 5, lives: 0 } },
  juice: {
    heat: { size: 'tick' },
    cool: { size: 'tick' },
    vent: { size: 'medium', shake: 1, flash: 1, hitstop: 1, sfx: 'inferno.vent' },
    blast: { size: 'big', shake: 2, flash: 1, hitstop: 1, sfx: 'inferno.blast' },
    erupt: { size: 'big', shake: 3, flash: 2, hitstop: 1, sfx: 'inferno.erupt' },
  },
  css: `
@keyframes lgrInfernoLick { 0% { transform: scale(.3, .1); opacity: 0 } 40% { transform: scale(1.1, 1.2); opacity: 1 } 65% { transform: scale(.9, 1) skewX(6deg) } 100% { transform: scale(.6, .2); opacity: 0 } }
@keyframes lgrInfernoCone { 0% { transform: scaleX(0) scaleY(.4); opacity: 0 } 18% { transform: scaleX(calc(.9 * var(--s, 1))) scaleY(1); opacity: 1 } 60% { transform: scaleX(var(--s, 1)) scaleY(1.06); opacity: 1 } 100% { transform: scaleX(var(--s, 1)) scaleY(.2) translateX(10%); opacity: 0 } }
@keyframes lgrInfernoColumn { 0% { transform: scaleY(0) scaleX(.5); opacity: 0 } 20% { transform: scaleY(1.05) scaleX(1); opacity: 1 } 40% { transform: scaleY(.97) scaleX(1.04) } 70% { opacity: 1 } 100% { transform: scaleY(1) scaleX(.15); opacity: 0 } }
@keyframes lgrInfernoLava { 0% { transform: translate(0, 0) scale(.6); opacity: 0 } 8% { opacity: 1 } 45% { transform: translate(calc(var(--vx) * .55), var(--vy)) scale(1) } 100% { transform: translate(var(--vx), 70px) scale(.8); opacity: 0 } }

@keyframes lgrInfernoBlowback { 0% { transform: none } 22% { transform: translateY(-4px) scale(.94) skewX(-6deg) } 50% { transform: translateY(-2px) scale(.97) skewX(-3deg) } 72% { transform: translateY(1px) scale(1.01) skewX(1deg) } 100% { transform: none } }
@keyframes lgrInfernoBlowbackP3 { 0% { transform: none } 18% { transform: translateY(-6px) scale(.9) skewX(-9deg) } 45% { transform: translateY(-3px) scale(.96) skewX(-4deg) } 70% { transform: translateY(2px) scale(1.02) skewX(2deg) } 100% { transform: none } }
@keyframes lgrInfernoHiss { 0%, 100% { transform: none; filter: none } 20% { transform: translateX(-4px) scale(.97); filter: brightness(.85) } 45% { transform: translateX(4px) scale(.97) } 70% { transform: translateX(-2px) } 90% { filter: none } }
@keyframes lgrInfernoSmolder { 0%, 100% { transform: none; filter: none } 45% { transform: scale(1.06) translateY(-2px); filter: brightness(1.2) saturate(1.3) } }
.lgr-inferno-blast, .lgr-inferno-erupt { transform-origin: 50% 90%; animation: lgrInfernoBlowback 900ms cubic-bezier(.22,1,.36,1) both }
.lgr-inferno-vent { transform-origin: 50% 90%; animation: lgrInfernoBlowback 760ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-phase="3"] .lgr-inferno-erupt { animation-name: lgrInfernoBlowbackP3 }
.lgr-inferno-cool { animation: lgrInfernoHiss 320ms linear both }
.lgr-inferno-heat { transform-origin: 50% 100%; animation: lgrInfernoSmolder 320ms ease-out both }
/* fx-layer motion: the phase 3 white-fire skull's jaw flaps open twice from its hinge (the part's own translate(0 5.4) kept) */
@keyframes lgrInfernoJawFlap { 0%, 100% { transform: translate(0, 5.4px) } 18% { transform: translate(0, 8.6px) scaleY(1.12) } 36% { transform: translate(0, 4.8px) } 56% { transform: translate(0, 8px) scaleY(1.08) } 76% { transform: translate(0, 5px) } }
.lg-boss[data-fx="vent"] .lgfa-inferno-jaw, .lg-boss[data-fx="blast"] .lgfa-inferno-jaw, .lg-boss[data-fx="erupt"] .lgfa-inferno-jaw { transform-box: fill-box; transform-origin: 50% 0%; animation: lgrInfernoJawFlap 720ms ease-in-out both }
/* THE REAL PARTS: the state layer this ability draws on the boss (its lg-ab-* group in raids/inferno.svg) moves with
   the moment, not only the whole figure. Played only while data-fx is set (never in focus mode, with Still bosses or
   under reduced motion). */
@keyframes lgrInfernoHeatFlare { 0%, 100% { transform: none; filter: none } 40% { transform: scale(1.18); filter: brightness(1.7) saturate(1.3) } }
.lg-boss[data-fx="heat"] [class*="lg-ab-heat-"] { transform-box: fill-box; transform-origin: center bottom; animation: lgrInfernoHeatFlare 320ms cubic-bezier(.22,1,.36,1) both }
` + pivots + PARTS_CSS,
}
