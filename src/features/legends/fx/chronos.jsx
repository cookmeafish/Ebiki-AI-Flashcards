// What the Chronos's Time Loop (abilities/chronos.js) LOOKS like. The fx contract is in fx/index.js, the juice in
// fx/_juice.js. Fixed brass, sand and frozen-blue colors, so they read over any palette.
//   grain (tick): one grain of sand drops into the glass.
//   rewind (big): the arena runs backwards: a clock face spins its hands counterclockwise three times in a sepia wash,
//     ghost clock faces sliding right to left.
//   paradox (medium): the clock face cracks into its twelve numerals, flung outward.
//   timestop (big): a grayscale freeze inside a frozen blue ring, then color snaps back on the hit.
//   overflow (medium): sand spills over the full glass: time is about to stop.
// Boss reactions (body only; faces are the art pass's lg-fx-<key> layers): Rewind (four stepped jerks backwards with
// afterimages), Freeze (dead still in grayscale, then a jolt), Stagger, Tick, Brim.
import { anim, around, ring, shards } from './_kit'

const BRASS = '#ffc94a'
const SAND = '#f5c26b'
const SEPIA = 'rgba(176,122,52,.38)'
const FROST = '#7fd8ff'
const NUMERALS = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']

// A clock face with two hands; `spin` is the keyframe on the hands' box.
const clock = (key, style, spin) => (
  <div key={key} className="lgx" style={{ left: '50%', top: '50%', width: '80%', height: '80%', marginLeft: '-40%', marginTop: '-40%', borderRadius: '50%', border: `5px solid ${BRASS}`, boxShadow: `0 0 16px ${BRASS}, inset 0 0 18px rgba(255,201,74,.45)`, background: 'radial-gradient(circle, rgba(255,246,214,.5), rgba(255,201,74,.1) 70%)', ...style }}>
    {around(12, (i, a) => <div key={i} style={{ position: 'absolute', left: '50%', top: '50%', width: 3, height: i % 3 ? 6 : 11, marginLeft: -1.5, background: BRASS, transform: `rotate(${a}deg) translateY(-${i % 3 ? 44 : 41}%)`, transformOrigin: 'center top' }} />)}
    <div style={{ position: 'absolute', inset: 0, animation: spin }}>
      <div style={{ position: 'absolute', left: '50%', top: '14%', width: 5, height: '36%', marginLeft: -2.5, background: '#ffffff', borderRadius: 3, boxShadow: `0 0 6px ${BRASS}` }} />
      <div style={{ position: 'absolute', left: '50%', top: '26%', width: 7, height: '24%', marginLeft: -3.5, background: BRASS, borderRadius: 3 }} />
    </div>
  </div>
)

export default {
  effects: {
    grain: () => (
      <div className="lgx" style={{ left: '50%', top: '18%', width: 6, height: 6, marginLeft: -3, borderRadius: '50%', background: SAND, boxShadow: `0 0 5px ${BRASS}`, animation: anim('lgrChronosGrain', 340, 0, 'ease-in') }} />
    ),
    rewind: () => <>
      <div className="lgx lgx-full" style={{ background: SEPIA, mixBlendMode: 'multiply', borderRadius: '30%', animation: anim('lgxFade', 1150) }} />
      {[0, 1, 2].map((i) => clock(`g${i}`, { opacity: 0, animation: anim('lgrChronosGhost', 900, 120 + i * 140) }, 'none'))}
      {clock('main', { animation: anim('lgxFade', 1150) }, anim('lgrChronosHands', 1000, 0, 'cubic-bezier(.45,0,.2,1)'))}
    </>,
    paradox: () => <>
      {clock('c', { animation: anim('lgrChronosCrack', 420, 0, 'ease-in') }, 'none')}
      {around(12, (i, a) => (
        <div key={i} className="lgx" style={{ left: '50%', top: '50%', fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: 15, color: BRASS, textShadow: '0 0 5px #ffffff, 0 1px 0 #6b4a10', '--a': `${a}deg`, '--d': `${-80 - (i % 3) * 14}px`, '--spin': `${(i % 2 ? 1 : -1) * 260}deg`, animation: anim('lgxShard', 760, 320 + i * 12) }}>{NUMERALS[i]}</div>
      ))}
    </>,
    timestop: () => <>
      <div className="lgx lgx-full" style={{ backdropFilter: 'grayscale(1) contrast(1.15)', WebkitBackdropFilter: 'grayscale(1) contrast(1.15)', borderRadius: '30%', animation: anim('lgrChronosStill', 900, 0, 'linear') }} />
      <div className="lgx" style={{ left: '50%', top: '50%', width: '96%', height: '96%', marginLeft: '-48%', marginTop: '-48%', borderRadius: '50%', border: `6px solid ${FROST}`, boxShadow: `0 0 22px ${FROST}, inset 0 0 22px ${FROST}`, animation: anim('lgrChronosFrostRing', 900, 0, 'linear') }} />
      {ring('#ffffff', 600, 1.9, 6, 500)}
      {shards(14, FROST, -110, 10)}
    </>,
    overflow: () => <>
      {around(9, (i) => (
        <div key={i} className="lgx" style={{ left: `${40 + (i % 3) * 10}%`, top: '14%', width: 6, height: 6, borderRadius: '50%', background: SAND, boxShadow: `0 0 4px ${BRASS}`, '--vx': `${(i % 2 ? 1 : -1) * (14 + i * 4)}px`, animation: anim('lgrChronosSpill', 760, i * 35, 'ease-in') }} />
      ))}
      {ring(BRASS, 0, 1.3, 3, 600)}
    </>,
  },
  floaters: { grain: 'lg_fx_sandGrain', rewind: 'lg_fx_rewind', paradox: 'lg_fx_paradox', timestop: 'lg_fx_timeStop', overflow: 'lg_fx_sandOverflow' },
  floaterTone: { grain: 'warning', rewind: 'warning', paradox: 'warning', timestop: 'info', overflow: 'info' },
  demo: { grain: { kind: 'hit', damage: 2, lives: 0 }, rewind: { kind: 'block', damage: 0, lives: 0 }, paradox: { kind: 'hit', damage: 1, lives: 0 }, timestop: { kind: 'hit', damage: 4, lives: 0 }, overflow: { kind: 'hit', damage: 2, lives: 0 } },
  juice: {
    grain: { size: 'tick' },
    rewind: { size: 'big', shake: 1, flash: 1, hitstop: 1, sfx: 'chronos.rewind' },
    paradox: { size: 'medium', shake: 1, flash: 1, hitstop: 1, sfx: 'chronos.paradox' },
    timestop: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'chronos.stop' },
    overflow: { size: 'medium', sfx: 'chronos.overflow' },
  },
  css: `
@keyframes lgrChronosGrain { 0% { transform: translateY(0); opacity: 0 } 20% { opacity: 1 } 100% { transform: translateY(46px); opacity: 0 } }
@keyframes lgrChronosHands { 0% { transform: rotate(0) } 100% { transform: rotate(-1080deg) } }
@keyframes lgrChronosGhost { 0% { transform: translateX(45%) scale(.9); opacity: 0 } 20% { opacity: .35 } 100% { transform: translateX(-55%) scale(.9); opacity: 0 } }
@keyframes lgrChronosCrack { 0% { transform: scale(1); opacity: 1 } 60% { transform: scale(1.04) rotate(-3deg); opacity: 1 } 100% { transform: scale(1.1) rotate(4deg); opacity: 0 } }
@keyframes lgrChronosStill { 0%, 60% { opacity: 1 } 61%, 100% { opacity: 0 } }
@keyframes lgrChronosFrostRing { 0% { transform: scale(1.3); opacity: 0 } 12% { transform: scale(1); opacity: 1 } 60% { transform: scale(1); opacity: 1 } 64% { transform: scale(1.06); opacity: 1 } 100% { transform: scale(1.5); opacity: 0 } }
@keyframes lgrChronosSpill { 0% { transform: translate(0, 0); opacity: 0 } 15% { opacity: 1 } 100% { transform: translate(var(--vx), 70px); opacity: 0 } }

@keyframes lgrChronosRewind { 0% { transform: none; filter: none } 20% { transform: translateX(4px); filter: drop-shadow(-8px 0 0 rgba(255,201,74,.45)) } 45% { transform: translateX(8px); filter: drop-shadow(-8px 0 0 rgba(255,201,74,.4)) drop-shadow(-16px 0 0 rgba(255,201,74,.25)) } 70% { transform: translateX(12px); filter: drop-shadow(-8px 0 0 rgba(255,201,74,.35)) drop-shadow(-18px 0 0 rgba(255,201,74,.2)) } 100% { transform: none; filter: none } }
@keyframes lgrChronosFreeze { 0% { transform: none; filter: none } 8%, 62% { transform: scale(1.04); filter: grayscale(1) brightness(1.15) } 70% { transform: translateX(7px) scale(1.02); filter: none } 80% { transform: translateX(-6px) } 90% { transform: translateX(2px) } 100% { transform: none; filter: none } }
@keyframes lgrChronosStagger { 0%, 100% { transform: none } 22% { transform: rotate(8deg) translateX(6px) } 48% { transform: rotate(-7deg) translateX(-5px) } 72% { transform: rotate(3deg) translateX(2px) } 88% { transform: rotate(-1deg) } }
@keyframes lgrChronosTick { 0%, 100% { transform: none } 25% { transform: rotate(-6deg) } 50% { transform: rotate(0) } 75% { transform: rotate(6deg) } }
@keyframes lgrChronosBrim { 0%, 100% { transform: none } 35% { transform: scale(1.1, .92) translateY(3px) } 60% { transform: scale(.96, 1.06) translateY(-4px) } 82% { transform: scale(1.02, .99) } }
.lgr-chronos-rewind { animation: lgrChronosRewind 1000ms steps(4, end) both }
.lgr-chronos-timestop { animation: lgrChronosFreeze 800ms linear both }
.lgr-chronos-paradox { transform-origin: 50% 90%; animation: lgrChronosStagger 600ms ease-in-out both }
.lgr-chronos-grain { transform-origin: 50% 90%; animation: lgrChronosTick 320ms steps(2, end) both }
.lgr-chronos-overflow { transform-origin: 50% 100%; animation: lgrChronosBrim 600ms cubic-bezier(.34,1.56,.64,1) both }
/* fx-layer motion. Hands pivot on the clock hub in the drawing's own coordinates (view-box), so they turn in place.
   Rewind: the brow hands spin one full turn counterclockwise (phase 1 and 3), the red seconds hand spins back twice
   (phase 2), the phase 3 dial-jaw shuts and opens again backwards. Paradox: the phase 3 jaw clacks twice. Every
   part ends on its drawn pose (each keeps its own translate). */
@keyframes lgrChronosBrowSpin { 0% { transform: rotate(0deg) } 100% { transform: rotate(-360deg) } }
@keyframes lgrChronosSecondsBack { 0% { transform: rotate(0deg) } 100% { transform: rotate(-720deg) } }
@keyframes lgrChronosJawRewind { 0% { transform: translate(0, 0) } 30% { transform: translate(0, -10px) } 55% { transform: translate(0, -1px) } 80%, 100% { transform: translate(0, -9px) } }
@keyframes lgrChronosJawClack { 0%, 100% { transform: translate(0, -5px) } 18% { transform: translate(0, -10px) } 38% { transform: translate(0, -3px) } 58% { transform: translate(0, -10px) } 80% { transform: translate(0, -4px) } }
.lg-boss[data-fx="rewind"] .lgfa-chronos-brow { transform-box: view-box; transform-origin: 60px 31.6px; animation: lgrChronosBrowSpin 1000ms cubic-bezier(.45,0,.2,1) both }
.lg-boss[data-phase="3"][data-fx="rewind"] .lgfa-chronos-brow { transform-origin: 60px 33px }
.lg-boss[data-fx="rewind"] .lgfa-chronos-seconds { transform-box: view-box; transform-origin: 60px 34.4px; animation: lgrChronosSecondsBack 1050ms cubic-bezier(.3,.6,.3,1) both }
.lg-boss[data-fx="rewind"] .lgfa-chronos-jaw { animation: lgrChronosJawRewind 1000ms steps(4, end) both }
.lg-boss[data-fx="paradox"] .lgfa-chronos-jaw { animation: lgrChronosJawClack 640ms ease-in-out both }
/* THE REAL PARTS: the state layer this ability draws on the boss (its lg-ab-* group in raids/chronos.svg) moves with
   the moment, not only the whole figure. Played only while data-fx is set (never in focus mode, with Still bosses or
   under reduced motion). */
@keyframes lgrChronosSandShift { 0%, 100% { transform: none } 20% { transform: translateX(2px) rotate(3deg) } 40% { transform: translateX(-2px) rotate(-3deg) } 60% { transform: translateX(1.5px) rotate(2deg) } 80% { transform: translateX(-1px) } }
.lg-boss[data-fx="grain"] [class*="lg-ab-sand-"], .lg-boss[data-fx="overflow"] [class*="lg-ab-sand-"] { transform-box: fill-box; transform-origin: center; animation: lgrChronosSandShift 320ms cubic-bezier(.22,1,.36,1) both }
`,
}
