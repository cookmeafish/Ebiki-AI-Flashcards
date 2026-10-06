// What the Inferno's Pressure Vent (abilities/inferno.js) LOOKS like. The fx contract is in fx/index.js, the juice in
// fx/_juice.js. Fixed fire colors with a white-hot core, so they read over any palette.
//   heat (tick): embers rise; the gauge glows hotter.
//   cool (tick): a puff of steam.
//   vent (medium): a long flame cone roars across the boss from the left edge.
//   blast (big): the same vent from a hotter gauge: a double cone, a fire ring and a spray of sparks.
//   erupt (big): the floor splits, a column of fire fills the arena height, lava blobs arc out and fall.
// Boss reactions (body only; faces are the art pass's lg-fx-<key> layers): Blowback (vent, blast, erupt), Hiss, Smolder.
import { anim, around, ring, shards } from './_kit'

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
`,
}
