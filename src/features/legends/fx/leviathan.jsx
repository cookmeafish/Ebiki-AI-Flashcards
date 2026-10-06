// What the Leviathan's Ride the Current (abilities/leviathan.js) LOOKS like. The fx contract is in fx/index.js, the
// juice in fx/_juice.js. Fixed sea colors (deep blue, foam white, a gold harpoon), so they read over any palette.
//   row (tick): a small wake curls behind the boat.
//   crest (big): a wall of water rises from the arena floor and a golden harpoon streaks up into the boss trailing its
//     chain; spray everywhere.
//   surf (tick): a spray arc off the crest.
//   pulled (tick): a little undertow swirl.
//   wipeout (medium): a blue spiral wipe swirls over the arena.
// Boss reactions (body only; faces are the art pass's lg-fx-<key> layers): Breach, Roll, Bob, Flinch, Sway.
import { anim, around, ring, shards } from './_kit'

const DEEP = '#1e7bff'
const SEA = '#3fc4ff'
const FOAM = '#eafcff'
const HARPOON = '#ffcf3a'

const drop = (key, style) => <div key={key} className="lgx" style={{ width: 9, height: 9, borderRadius: '50% 50% 50% 0', background: FOAM, boxShadow: `0 0 6px ${SEA}`, ...style }} />

export default {
  effects: {
    // (an oar bites the water at its feet: three thick foam crescents roll out and spray kicks up)
    row: () => <>
      {[0, 1, 2].map((i) => (
        <div key={i} className="lgx" style={{ left: `${24 + i * 9}%`, bottom: `${2 + i * 3}%`, width: '40%', height: 18, borderRadius: '50%', borderTop: `5px solid ${FOAM}`, filter: `drop-shadow(0 -1px 0 ${DEEP}) drop-shadow(0 0 5px ${SEA})`, opacity: 0, animation: anim('lgrLeviathanWake', 340, i * 50) }} />
      ))}
      {[0, 1, 2, 3].map((i) => drop(i, { left: `${36 + i * 8}%`, bottom: '12%', '--h': `${-34 - (i % 2) * 16}px`, animation: anim('lgxRise', 320, 40 + i * 30) }))}
    </>,
    crest: () => <>
      {/* the wall of water, foam on its lip */}
      <div className="lgx" style={{ left: '-25%', right: '-25%', bottom: '-12%', height: '58%', transformOrigin: 'bottom', borderRadius: '42% 58% 0 0 / 30% 30% 0 0', background: `linear-gradient(to top, ${DEEP}, rgba(63,196,255,.75) 60%, rgba(234,252,255,.9))`, boxShadow: `0 -8px 0 ${FOAM}, 0 0 30px ${SEA}`, opacity: 0.85, animation: anim('lgrLeviathanWall', 1150, 0, 'cubic-bezier(.22,1,.36,1)') }} />
      {/* the harpoon and its chain, streaking up from below into the boss */}
      <div className="lgx" style={{ left: '50%', bottom: '-40%', width: 8, height: '95%', marginLeft: -4, animation: anim('lgrLeviathanHarpoon', 700, 200, 'cubic-bezier(.3,0,.2,1)') }}>
        <div style={{ position: 'absolute', left: -9, top: -26, width: 26, height: 34, background: `linear-gradient(#ffffff, ${HARPOON})`, clipPath: 'polygon(50% 0, 100% 70%, 62% 60%, 62% 100%, 38% 100%, 38% 60%, 0 70%)', filter: `drop-shadow(0 0 6px ${HARPOON})` }} />
        <div style={{ position: 'absolute', left: 1, top: 6, bottom: 0, width: 6, background: `repeating-linear-gradient(to bottom, ${HARPOON} 0 7px, transparent 7px 10px)`, borderRadius: 3 }} />
      </div>
      {ring(FOAM, 520, 1.9, 5, 600)}
      {shards(16, FOAM, -120, 9, true)}
      {around(8, (i) => drop(i, { left: `${10 + i * 11}%`, bottom: '30%', '--h': `${-80 - (i % 3) * 30}px`, animation: anim('lgxRise', 900, 300 + i * 30) }))}
    </>,
    // (a curling wave lip breaks across the boss and throws spray off its crest)
    surf: () => <>
      <svg className="lgx" viewBox="0 0 120 50" style={{ left: '-5%', top: '34%', width: '110%', height: '30%', overflow: 'visible', filter: `drop-shadow(0 0 6px ${SEA})`, animation: anim('lgrLeviathanLip', 340, 0, 'cubic-bezier(.3,.7,.3,1)') }} aria-hidden="true">
        <path d="M0 46C24 46 34 14 62 8S100 16 92 30C88 22 76 20 70 28 64 36 76 46 120 46Z" fill={SEA} fillOpacity=".8" stroke={DEEP} strokeWidth="3" strokeLinejoin="round" />
        <path d="M8 44C28 42 38 18 62 12S96 18 92 30" fill="none" stroke={FOAM} strokeWidth="4" strokeLinecap="round" />
      </svg>
      {[0, 1, 2].map((i) => drop(i, { left: `${30 + i * 18}%`, top: '20%', '--h': '-40px', animation: anim('lgxRise', 340, i * 30) }))}
    </>,
    // (a whirlpool opens at its feet, a drawn spiral spinning inward, and a foam drop is sucked down)
    pulled: () => <>
      <svg className="lgx" viewBox="0 0 60 60" style={{ left: '50%', bottom: '0%', width: 84, height: 40, marginLeft: -42, overflow: 'visible', filter: `drop-shadow(0 0 5px ${SEA})` }} aria-hidden="true">
        <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: anim('lgrLeviathanUndertow', 340, 0, 'ease-in') }}>
          <path d="M30 30m-4 0a4 4 0 1 1 8 0 9 9 0 1 1-18 0 14 14 0 1 1 28 0 19 19 0 1 1-38 0 24 24 0 1 1 48 0" fill="none" stroke={DEEP} strokeWidth="6" strokeLinecap="round" />
          <path d="M30 30m-4 0a4 4 0 1 1 8 0 9 9 0 1 1-18 0 14 14 0 1 1 28 0 19 19 0 1 1-38 0 24 24 0 1 1 48 0" fill="none" stroke={FOAM} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </svg>
      {drop('d', { left: '50%', bottom: '30%', marginLeft: -4, '--x0': '-30px', '--y0': '-40px', animation: anim('lgxFly', 320, 0, 'ease-in') })}
    </>,
    wipeout: () => <>
      <div className="lgx" style={{ left: '50%', top: '50%', width: '150%', height: '150%', borderRadius: '50%', background: `conic-gradient(from 0deg, ${DEEP}, rgba(63,196,255,.2), ${SEA}, rgba(30,123,255,.15), ${FOAM}, ${DEEP})`, mixBlendMode: 'screen', opacity: 0.85, animation: anim('lgxVortex', 800, 0, 'ease-in') }} />
      {ring(SEA, 120, 0.4, 4, 600)}
    </>,
  },
  floaters: { row: 'lg_fx_row', crest: 'lg_fx_crest', surf: 'lg_fx_surf', pulled: 'lg_fx_undertow', wipeout: 'lg_fx_wipeout' },
  floaterTone: { row: 'info', crest: 'warning', surf: 'info', pulled: 'ink', wipeout: 'danger' },
  demo: { row: { kind: 'hit', damage: 2, lives: 0 }, crest: { kind: 'hit', damage: 3, lives: 0 }, surf: { kind: 'hit', damage: 3, lives: 0 }, pulled: { kind: 'miss', damage: 0, lives: 1 }, wipeout: { kind: 'miss', damage: 0, lives: 1 } },
  juice: {
    row: { size: 'tick' },
    crest: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'leviathan.crest' },
    surf: { size: 'tick' },
    pulled: { size: 'tick' },
    wipeout: { size: 'medium', shake: 1, hitstop: 1, sfx: 'leviathan.wipeout' },
  },
  css: `
@keyframes lgrLeviathanWake { 0% { transform: scaleX(.3); opacity: 0 } 30% { opacity: 1 } 100% { transform: scaleX(1.2) translateX(-12px); opacity: 0 } }
@keyframes lgrLeviathanWall { 0% { transform: translateY(70%) scaleY(.3); opacity: 0 } 20% { opacity: .95 } 45% { transform: translateY(-4%) scaleY(1.08) } 65% { transform: translateY(6%) scaleY(.96); opacity: .9 } 100% { transform: translateY(70%) scaleY(.5); opacity: 0 } }
@keyframes lgrLeviathanHarpoon { 0% { transform: translateY(60%); opacity: 0 } 15% { opacity: 1 } 60% { transform: translateY(-38%); opacity: 1 } 75% { transform: translateY(-34%) } 100% { transform: translateY(-36%); opacity: 0 } }
@keyframes lgrLeviathanLip { 0% { transform: translateX(-40%) scaleY(.5); opacity: 0 } 25% { opacity: 1 } 70% { transform: translateX(4%) scaleY(1.05); opacity: 1 } 100% { transform: translateX(14%) scaleY(.6); opacity: 0 } }
@keyframes lgrLeviathanUndertow { 0% { transform: rotate(0) scale(1.2); opacity: 0 } 25% { opacity: 1 } 100% { transform: rotate(-300deg) scale(.3); opacity: 0 } }

@keyframes lgrLeviathanBreach { 0% { transform: none } 30% { transform: translateY(14px) } 62% { transform: translateY(-8px) rotate(4deg) } 82% { transform: translateY(2px) rotate(-1deg) } 100% { transform: none } }
@keyframes lgrLeviathanRoll { 0% { transform: none } 25% { transform: rotate(-9deg) translateY(4px) } 60% { transform: rotate(8deg) translateY(2px) } 85% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgrLeviathanBob { 0%, 100% { transform: none } 50% { transform: translateY(6px) rotate(1deg) } }
@keyframes lgrLeviathanFlinch { 0%, 100% { transform: none } 35% { transform: translateX(7px) rotate(2deg) } 70% { transform: translateX(-2px) } }
@keyframes lgrLeviathanSway { 0%, 100% { transform: none } 45% { transform: rotate(-6deg) translateY(2px) } 80% { transform: rotate(1.5deg) } }
.lgr-leviathan-crest { transform-origin: 50% 100%; animation: lgrLeviathanBreach 1100ms cubic-bezier(.22,1,.36,1) both }
.lgr-leviathan-wipeout { transform-origin: 50% 80%; animation: lgrLeviathanRoll 780ms ease-in-out both }
.lgr-leviathan-row { animation: lgrLeviathanBob 320ms ease-out both }
.lgr-leviathan-surf { animation: lgrLeviathanFlinch 320ms ease-out both }
.lgr-leviathan-pulled { transform-origin: 50% 90%; animation: lgrLeviathanSway 320ms ease-in-out both }
/* fx-layer motion: in phase 3 the fanged rings spin faster while the wipeout face shows (each ring about its own
   centre, the middle one the other way) */
@keyframes lgrLeviathanRingsSpin { 0% { transform: rotate(0deg) } 100% { transform: rotate(200deg) } }
.lg-boss[data-fx="wipeout"] .lgfa-leviathan-rings { transform-box: fill-box; transform-origin: center; animation: lgrLeviathanRingsSpin 760ms cubic-bezier(.3,.7,.4,1) both }
.lg-boss[data-fx="wipeout"] .lgfa-leviathan-rings + .lgfa-leviathan-rings { animation-direction: reverse }
.lg-boss[data-fx="wipeout"] .lgfa-leviathan-rings + .lgfa-leviathan-rings + .lgfa-leviathan-rings { animation-direction: normal; animation-duration: 640ms }
/* THE REAL PARTS: the state layer this ability draws on the boss (its lg-ab-* group in raids/leviathan.svg) moves with
   the moment, not only the whole figure. Played only while data-fx is set (never in focus mode, with Still bosses or
   under reduced motion). */
@keyframes lgrLeviathanCurrentSurge { 0%, 100% { transform: none } 40% { transform: translateX(4px) scale(1.12, .92) } }
.lg-boss[data-fx="row"] [class*="lg-ab-current-"], .lg-boss[data-fx="surf"] [class*="lg-ab-current-"] { transform-box: fill-box; transform-origin: center; animation: lgrLeviathanCurrentSurge 320ms cubic-bezier(.22,1,.36,1) both }
`,
}
