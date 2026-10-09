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
/* THE DRAWING'S OWN PARTS (raids/leviathan.svg lg-leviathan-*): their pivots, its attack on the player, how each
   ability moment moves them, and its knockout. Ability rules carry a doubled class (.lg-boss.lg-boss) so they win over
   a plain strike moment playing on the same part at the same time. */
.lg-boss[data-motif="leviathan"] [class*="lg-leviathan-"] { transform-box: fill-box; transform-origin: 50% 50% }
.lg-boss[data-motif="leviathan"] .lg-leviathan-town { transform-origin: 50% 100% }
.lg-boss[data-motif="leviathan"] .lg-leviathan-jaw { transform-origin: 50% 0 }
.lg-boss[data-motif="leviathan"] .lg-leviathan-brow { transform-origin: 50% 60% }
.lg-boss[data-motif="leviathan"] .lg-leviathan-horn { transform-origin: 10% 95% }
.lg-boss[data-motif="leviathan"] .lg-leviathan-tentacles { transform-origin: 50% 100% }
/* Its attack on the player (impact/AssaultFx: a tide rolls out across the card and the screen floods). The drawing
   does it: it draws a breath (jaw clamped, brow down, fins in), then heaves its jaw wide and bellows the sea at you,
   brow lifted and fins flared, the spiral maw of phase 3 spinning open with its flaps thrown wide. */
@keyframes lgrLeviathanAsJaw { 0% { transform: none } 16% { transform: translateY(-8%) } 40% { transform: translateY(30%) scaleX(1.06) } 70% { transform: translateY(22%) } 100% { transform: none } }
@keyframes lgrLeviathanAsBrow { 0% { transform: none } 16% { transform: translateY(8%) scaleY(.7) } 40% { transform: translateY(-12%) scaleY(1.2) } 70% { transform: translateY(-6%) scaleY(1.1) } 100% { transform: none } }
@keyframes lgrLeviathanAsFins { 0% { transform: none } 16% { transform: scaleX(.82) } 40% { transform: scaleX(1.3) } 70% { transform: scaleX(1.12) } 100% { transform: none } }
@keyframes lgrLeviathanAsMaw3 { 0% { transform: none } 16% { transform: scale(.78) rotate(-30deg) } 42% { transform: scale(1.32) rotate(100deg) } 70% { transform: scale(1.15) rotate(150deg) } 100% { transform: rotate(180deg) } }
@keyframes lgrLeviathanAsFlaps { 0% { transform: none } 16% { transform: scale(.84) } 42% { transform: scale(1.3) } 70% { transform: scale(1.12) } 100% { transform: none } }
.lg-boss[data-motif="leviathan"][data-assault-on] .lg-leviathan-jaw { animation: lgrLeviathanAsJaw 840ms cubic-bezier(.45,0,.2,1) both }
.lg-boss[data-motif="leviathan"][data-assault-on] .lg-leviathan-brow { animation: lgrLeviathanAsBrow 840ms cubic-bezier(.45,0,.2,1) both }
.lg-boss[data-motif="leviathan"][data-assault-on] .lg-leviathan-fins { animation: lgrLeviathanAsFins 840ms cubic-bezier(.45,0,.2,1) both }
.lg-boss[data-motif="leviathan"][data-assault-on] .lg-leviathan-maw3 { animation: lgrLeviathanAsMaw3 840ms cubic-bezier(.45,0,.2,1) both }
.lg-boss[data-motif="leviathan"][data-assault-on] .lg-leviathan-tentacles3 { animation: lgrLeviathanAsFlaps 840ms cubic-bezier(.45,0,.2,1) both }
/* Row: its eyes follow your boat (the brow lifts and tracks), the town on its crown bobs. Surf: spray hits it in the
   face (a quick squint). */
@keyframes lgrLeviathanTrack { 0%, 100% { transform: none } 40% { transform: translate(5%, -6%) } 75% { transform: translate(3%, -2%) } }
@keyframes lgrLeviathanTownBob { 0%, 100% { transform: none } 40% { transform: translateY(-6%) rotate(2deg) } 75% { transform: translateY(2%) } }
@keyframes lgrLeviathanSpray { 0%, 100% { transform: none } 30% { transform: scaleY(.5) translateY(6%) } 60% { transform: scaleY(.8) } }
.lg-boss.lg-boss[data-fx="row"] .lg-leviathan-brow { animation: lgrLeviathanTrack 330ms ease-out both }
.lg-boss.lg-boss[data-fx="row"] .lg-leviathan-town, .lg-boss.lg-boss[data-fx="surf"] .lg-leviathan-town { animation: lgrLeviathanTownBob 330ms ease-out both }
.lg-boss.lg-boss[data-fx="surf"] .lg-leviathan-brow, .lg-boss.lg-boss[data-fx="surf"] .lg-leviathan-maw3 { animation: lgrLeviathanSpray 330ms ease-out both }
/* Crest: your harpoon strikes home from the top of the wave: the brow is wrenched up in pain, the jaw gapes, the horn
   snaps back and the whole town on its head is tossed into the air and crashes back down. */
@keyframes lgrLeviathanCrestBrow { 0% { transform: none } 12% { transform: translateY(-16%) rotate(-6deg) scaleY(1.25) } 40% { transform: translateY(-10%) rotate(4deg) scaleY(1.15) } 70% { transform: translateY(-2%) } 100% { transform: none } }
@keyframes lgrLeviathanCrestJaw { 0% { transform: none } 12%, 45% { transform: translateY(26%) rotate(-3deg) } 70% { transform: translateY(8%) } 100% { transform: none } }
@keyframes lgrLeviathanCrestHorn { 0% { transform: none } 12% { transform: rotate(-38deg) } 34% { transform: rotate(12deg) } 54% { transform: rotate(-8deg) } 100% { transform: none } }
@keyframes lgrLeviathanCrestTown { 0% { transform: none } 14% { transform: translateY(-34%) rotate(-8deg) } 32% { transform: translateY(-38%) rotate(6deg) } 46% { transform: translateY(4%) rotate(-3deg) scaleY(.94) } 58% { transform: translateY(-6%) } 72% { transform: none } 100% { transform: none } }
@keyframes lgrLeviathanCrestMaw3 { 0% { transform: none } 12% { transform: scale(.6) rotate(-60deg) } 45% { transform: scale(.7) rotate(-80deg) } 100% { transform: none } }
.lg-boss.lg-boss[data-fx="crest"] .lg-leviathan-brow { animation: lgrLeviathanCrestBrow 1150ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss.lg-boss[data-fx="crest"] .lg-leviathan-jaw { animation: lgrLeviathanCrestJaw 1150ms ease-out both }
.lg-boss.lg-boss[data-fx="crest"] .lg-leviathan-horn { animation: lgrLeviathanCrestHorn 1150ms ease-out both }
.lg-boss.lg-boss[data-fx="crest"] .lg-leviathan-town { animation: lgrLeviathanCrestTown 1150ms cubic-bezier(.3,0,.3,1) both }
.lg-boss.lg-boss[data-fx="crest"] .lg-leviathan-maw3, .lg-boss.lg-boss[data-fx="crest"] .lg-leviathan-tentacles3 { animation: lgrLeviathanCrestMaw3 1150ms ease-out both }
/* Pulled: its undertow drags you in: the jaw sinks open, the fins sweep inward, the phase 3 maw turns like a drain. */
@keyframes lgrLeviathanSuckJaw { 0%, 100% { transform: none } 40% { transform: translateY(16%) } 75% { transform: translateY(10%) } }
@keyframes lgrLeviathanSuckFins { 0%, 100% { transform: none } 40% { transform: scaleX(.78) } }
@keyframes lgrLeviathanDrain { 0% { transform: none } 50% { transform: rotate(-70deg) scale(.88) } 100% { transform: rotate(-90deg) } }
.lg-boss.lg-boss[data-fx="pulled"] .lg-leviathan-jaw { animation: lgrLeviathanSuckJaw 340ms ease-in-out both }
.lg-boss.lg-boss[data-fx="pulled"] .lg-leviathan-fins { animation: lgrLeviathanSuckFins 340ms ease-in-out both }
.lg-boss.lg-boss[data-fx="pulled"] .lg-leviathan-maw3 { animation: lgrLeviathanDrain 340ms ease-in both }
/* Wipeout: you fall off the current and it rolls in triumph: the town lists hard over, the horn swings round, the
   tentacles thrash, the jaw grins wide. */
@keyframes lgrLeviathanWipeTown { 0%, 100% { transform: none } 30% { transform: rotate(-16deg) translateX(-8%) } 62% { transform: rotate(10deg) translateX(5%) } 84% { transform: rotate(-3deg) } }
@keyframes lgrLeviathanWipeHorn { 0%, 100% { transform: none } 30% { transform: rotate(-28deg) } 62% { transform: rotate(18deg) } }
@keyframes lgrLeviathanGrin { 0%, 100% { transform: none } 30%, 70% { transform: translateY(14%) scaleX(1.06) } }
@keyframes lgrLeviathanThrash { 0%, 100% { transform: none } 25% { transform: scale(1.2) rotate(-6deg) } 50% { transform: scale(1.1) rotate(6deg) } 75% { transform: scale(1.15) rotate(-3deg) } }
.lg-boss.lg-boss[data-fx="wipeout"] .lg-leviathan-town { animation: lgrLeviathanWipeTown 800ms ease-in-out both }
.lg-boss.lg-boss[data-fx="wipeout"] .lg-leviathan-horn { animation: lgrLeviathanWipeHorn 800ms ease-in-out both }
.lg-boss.lg-boss[data-fx="wipeout"] .lg-leviathan-jaw { animation: lgrLeviathanGrin 800ms ease-in-out both }
.lg-boss.lg-boss[data-fx="wipeout"] .lg-leviathan-tentacles, .lg-boss.lg-boss[data-fx="wipeout"] .lg-leviathan-tentacles3 { animation: lgrLeviathanThrash 800ms ease-in-out both }
/* THE KNOCKOUT (data-moment="ko", kept here because its 2300 ms outlasts the shortest knockout and the impact layer
   style is shared by every boss): it founders. The flood rises, the town on its crown tilts and slides as the head
   rolls, the eyes squeeze shut, the jaw hangs slack taking on water, the horn sags; at the climax (1400) everything
   lurches down into the maelstrom. */
@keyframes lgrLeviathanKoTown { 0% { transform: none } 14% { transform: translateY(-10%) rotate(-5deg) } 40% { transform: rotate(9deg) translateX(4%) } 58% { transform: rotate(14deg) translate(7%, 2%) } 64% { transform: rotate(24deg) translate(12%, 16%) } 92% { transform: rotate(22deg) translate(11%, 14%) } 100% { transform: none } }
@keyframes lgrLeviathanKoBrow { 0% { transform: none } 14% { transform: translateY(-10%) scaleY(1.2) } 40%, 58% { transform: translateY(6%) scaleY(.6) } 64%, 92% { transform: translateY(10%) scaleY(.3) } 100% { transform: none } }
@keyframes lgrLeviathanKoJaw { 0% { transform: none } 14% { transform: translateY(24%) } 40%, 58% { transform: translateY(14%) rotate(2deg) } 64%, 92% { transform: translateY(30%) rotate(4deg) } 100% { transform: none } }
@keyframes lgrLeviathanKoHorn { 0% { transform: none } 14% { transform: rotate(-16deg) } 40%, 58% { transform: rotate(10deg) } 64%, 92% { transform: rotate(34deg) translateY(10%) } 100% { transform: none } }
@keyframes lgrLeviathanKoMaw3 { 0% { transform: none } 30% { transform: rotate(160deg) scale(1.1) } 58% { transform: rotate(300deg) scale(.9) } 64%, 92% { transform: rotate(380deg) scale(.5) } 100% { transform: rotate(360deg) } }
.lg-boss[data-motif="leviathan"][data-moment="ko"] .lg-leviathan-town { animation: lgrLeviathanKoTown 2300ms linear both }
.lg-boss[data-motif="leviathan"][data-moment="ko"] .lg-leviathan-brow { animation: lgrLeviathanKoBrow 2300ms linear both }
.lg-boss[data-motif="leviathan"][data-moment="ko"] .lg-leviathan-jaw { animation: lgrLeviathanKoJaw 2300ms linear both }
.lg-boss[data-motif="leviathan"][data-moment="ko"] .lg-leviathan-horn { animation: lgrLeviathanKoHorn 2300ms linear both }
.lg-boss[data-motif="leviathan"][data-moment="ko"] .lg-leviathan-maw3, .lg-boss[data-motif="leviathan"][data-moment="ko"] .lg-leviathan-tentacles3 { animation: lgrLeviathanKoMaw3 2300ms linear both }
`,
}
