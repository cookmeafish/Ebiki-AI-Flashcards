// What Kingpin's Hoard (abilities/ratking.js) LOOKS like (design v2.1, #24). The fx contract is in fx/index.js.
//   loot     (tick)   a gold coin flips out of his pile and down into your counter (his grin falters).
//   stolen   (medium) three rats scurry across the bottom and snatch a coin back (he gloats).
//   bomb     (big)    a wheel of cheese arcs in, lands on him and explodes yellow-green with spinning coins.
//   buyTail  (medium) a golden rat tail curls up under him: your next lost heart is covered.
//   tail     (big)    the golden tail flashes and snaps: a heart saved (he scowls and chomps his cigar).
import { center, anim, around, ring } from './_kit'

// Fixed bright colors (never theme tokens over the art).
const R = { gold: '#ffd34d', goldHi: '#fffbe0', goldLo: '#c38a1e', cheese: '#ffe066', rind: '#f0a830', stink: '#9dff6a', rat: '#4a3f52', ink: '#1d2230', white: '#ffffff' }
const COIN = `radial-gradient(circle at 35% 35%, ${R.goldHi} 0 18%, ${R.gold} 45%, ${R.goldLo} 100%)`
const coin = (style) => ({ borderRadius: '50%', background: COIN, border: `1.5px solid ${R.ink}`, boxShadow: `0 0 6px ${R.gold}`, ...style })

export default {
  effects: {
    // (three coins pop off his pile, spin through the air toward your counter on the right; a gold glint where they left)
    loot: () => <>
      <div className="lgx" style={{ left: '50%', top: '66%', width: 40, height: 40, background: `radial-gradient(circle, ${R.white} 0 15%, ${R.gold} 35%, transparent 65%)`, '--s': 1.8, animation: anim('lgxRing', 300) }} />
      {[0, 1, 2].map((i) => <div key={i} className="lgx" style={{ left: '50%', top: '66%', ...coin({ width: 18, height: 18, marginLeft: -9, marginTop: -9 }), '--tx': `${70 + i * 18}px`, '--ty': `${-50 + i * 14}px`, animation: anim('lgrRatkingCoinArc', 330, i * 40, 'cubic-bezier(.3,.6,.5,1)') }} />)}
    </>,
    stolen: () => <>
      {[0, 1, 2].map((i) => (
        <div key={i} className="lgx" style={{ left: '-30%', bottom: `${6 + i * 10}%`, width: 30, height: 15, animation: anim('lgrRatkingScurry', 760, i * 70, 'linear') }}><div style={{ position: 'absolute', inset: 0, transform: 'scale(1.7)', transformOrigin: 'left bottom', filter: `drop-shadow(0 0 3px ${R.gold})` }}>
          {/* a rat silhouette: body, head, ear, tail; the first one carries the coin */}
          <div style={{ position: 'absolute', left: 6, top: 3, width: 18, height: 11, borderRadius: '60% 50% 40% 40%', background: R.rat, border: `1.5px solid ${R.ink}` }} />
          <div style={{ position: 'absolute', left: 20, top: 5, width: 10, height: 7, borderRadius: '30% 70% 60% 40%', background: R.rat, border: `1.5px solid ${R.ink}` }} />
          <div style={{ position: 'absolute', left: 20, top: 1, width: 5, height: 5, borderRadius: '50%', background: R.rat, border: `1.5px solid ${R.ink}` }} />
          <div style={{ position: 'absolute', left: -6, top: 9, width: 14, height: 2, borderRadius: 2, background: R.rat, transform: 'rotate(-12deg)' }} />
          <div style={{ position: 'absolute', left: 25, top: -6, ...coin({ width: 10, height: 10 }) }} />
        </div></div>
      ))}
    </>,
    bomb: () => <>
      {/* the cheese wheel lobbed in from the player's side */}
      <div className="lgx" style={{ left: '50%', top: '44%', width: 46, height: 30, margin: '-15px 0 0 -23px', borderRadius: '50% / 40%', background: `radial-gradient(circle at 30% 40%, ${R.rind} 0 9%, transparent 10%), radial-gradient(circle at 68% 62%, ${R.rind} 0 8%, transparent 9%), ${R.cheese}`, border: `3px solid ${R.ink}`, boxShadow: `inset 0 -5px 0 ${R.rind}`, animation: anim('lgrRatkingLob', 520, 0, 'cubic-bezier(.3,0,.7,1)') }} />
      <div className="lgx" style={{ ...center, width: '70%', height: '70%', margin: '-35% 0 0 -35%', borderRadius: '50%', background: `radial-gradient(circle, ${R.white} 0 12%, ${R.cheese} 30%, ${R.stink} 58%, transparent 70%)`, animation: anim('lgrRatkingBlast', 900, 470) }} />
      {ring(R.cheese, 480, 2, 6, 500)}{ring(R.stink, 540, 2.8, 4, 700)}
      {around(14, (i, a) => <div key={i} className="lgx" style={{ ...center, ...(i % 2 ? coin({ width: 12, height: 12 }) : { width: 13, height: 10, background: R.cheese, border: `1.5px solid ${R.ink}`, clipPath: 'polygon(0 100%, 100% 100%, 50% 0)' }), marginLeft: -6, '--a': `${a}deg`, '--d': `${-80 - (i % 3) * 16}px`, '--spin': `${i % 2 ? 360 : -280}deg`, animation: anim('lgxShard', 850, 480 + (i % 3) * 25) }} />)}
    </>,
    buyTail: () => <>
      <svg className="lgx" viewBox="0 0 120 70" style={{ left: '50%', bottom: '2%', width: 130, height: 76, marginLeft: -65, overflow: 'visible', filter: `drop-shadow(0 0 8px ${R.gold})` }} aria-hidden="true">
        {[[R.ink, 11], [R.goldLo, 8], [R.gold, 5], [R.goldHi, 1.6]].map(([c, w], k) => <path key={k} d="M6 62C30 66 60 64 78 50S96 14 76 12 58 34 74 40 96 30 100 20" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" style={{ strokeDasharray: 230, animation: anim('lgrRatkingTailDraw', 780, 0, 'cubic-bezier(.3,.7,.3,1)') }} />)}
      </svg>
      {[0, 1, 2, 3].map((i) => <div key={i} className="lgx" style={{ left: `${38 + i * 8}%`, bottom: '10%', width: 5, height: 5, borderRadius: '50%', background: R.goldHi, boxShadow: `0 0 6px ${R.gold}`, '--h': '-34px', animation: anim('lgxRise', 600, 120 + i * 60) }} />)}
    </>,
    tail: () => <>
      <div className="lgx lgx-full" style={{ background: `radial-gradient(circle at 50% 85%, ${R.goldHi}, transparent 55%)`, animation: anim('lgxFlash', 420) }} />
      <div className="lgx" style={{ left: '50%', bottom: '6%', width: 70, height: 36, marginLeft: -35, borderRadius: '50%', border: `5px solid ${R.gold}`, borderTopColor: 'transparent', borderRightColor: 'transparent', boxShadow: `0 0 16px ${R.goldHi}`, '--r': '-18deg', animation: anim('lgxSnap', 900) }} />
      <div className="lgx" style={{ left: '50%', bottom: '10%', fontSize: 26, marginLeft: -13, filter: `drop-shadow(0 0 8px ${R.gold})`, animation: anim('lgrRatkingHeartSave', 1000, 150) }}>❤️</div>
      {around(8, (i, a) => <div key={i} className="lgx" style={{ left: '50%', top: '80%', width: 8, height: 3, marginLeft: -4, background: R.gold, borderRadius: 2, '--a': `${a}deg`, '--d': '-46px', '--spin': '90deg', animation: anim('lgxShard', 600, 200) }} />)}
    </>,
  },
  floaters: { loot: 'lg_fx_hoardCoin', stolen: 'lg_fx_hoardStolen', bomb: 'lg_fx_cheeseBomb', buyTail: 'lg_fx_luckyTail', tail: 'lg_fx_tailSave' },
  floaterTone: { loot: 'warning', stolen: 'danger', bomb: 'warning', buyTail: 'success', tail: 'success' },
  demo: { stolen: { kind: 'miss', damage: 0, lives: 1 }, buyTail: { kind: 'block', damage: 0, lives: 0 }, tail: { kind: 'block', damage: 0, lives: 0 } },
  juice: {
    loot: { size: 'tick' },
    stolen: { size: 'medium', shake: 1, sfx: 'ratking.stolen' },
    bomb: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'ratking.bomb' },
    buyTail: { size: 'medium', sfx: 'ratking.buyTail' },
    tail: { size: 'big', shake: 1, flash: 1, hitstop: 1, sfx: 'ratking.tail' },
  },
  css: `
@keyframes lgrRatkingCoinArc { 0% { transform: translate(0, 0) rotateY(0) scale(.5); opacity: 0 } 15% { opacity: 1 } 50% { transform: translate(calc(var(--tx) * .5), calc(var(--ty) - 24px)) rotateY(360deg) scale(1.15) } 100% { transform: translate(var(--tx), var(--ty)) rotateY(720deg) scale(.8); opacity: 0 } }
@keyframes lgrRatkingTailDraw { 0% { stroke-dashoffset: 230; opacity: 0 } 10% { opacity: 1 } 55% { stroke-dashoffset: 0 } 80% { stroke-dashoffset: 0; opacity: 1 } 100% { stroke-dashoffset: 0; opacity: 0 } }
@keyframes lgrRatkingScurry { 0% { transform: translateX(0) translateY(0) } 25% { transform: translateX(80px) translateY(-4px) } 50% { transform: translateX(160px) translateY(0) } 75% { transform: translateX(240px) translateY(-4px) } 100% { transform: translateX(340px) translateY(0) } }
@keyframes lgrRatkingLob { 0% { transform: translate(-70px, 110px) rotate(-120deg) scale(.6); opacity: 0 } 15% { opacity: 1 } 60% { transform: translate(-25px, -30px) rotate(-30deg) scale(1) } 100% { transform: translate(0, 0) rotate(0) scale(1.1); opacity: 1 } }
@keyframes lgrRatkingBlast { 0% { transform: scale(.2); opacity: 0 } 15% { transform: scale(1); opacity: 1 } 100% { transform: scale(1.5); opacity: 0 } }
@keyframes lgrRatkingHeartSave { 0% { transform: scale(.4); opacity: 0 } 30% { transform: scale(1.3); opacity: 1 } 60% { transform: scale(1) } 100% { transform: translateY(-20px) scale(1); opacity: 0 } }
.lgr-ratking-loot { animation: lgrRatkingFlinch 320ms ease-out both }
@keyframes lgrRatkingFlinch { 0%, 100% { transform: none } 30% { transform: translateX(-6px) rotate(-3deg) } 65% { transform: translateX(2px) } }
.lgr-ratking-stolen { animation: lgrRatkingGloat 780ms cubic-bezier(.22,1,.36,1) both; transform-origin: 50% 100% }
@keyframes lgrRatkingGloat { 0% { transform: none } 22% { transform: rotate(-8deg) translateX(-6px) scale(1.04) } 42% { transform: rotate(-2deg) } 62% { transform: rotate(-7deg) translateX(-4px) scale(1.03) } 82% { transform: rotate(-1deg) } 100% { transform: none } }
.lgr-ratking-bomb { animation: lgrRatkingDoubleOver 1000ms cubic-bezier(.22,1,.36,1) both; transform-origin: 50% 100% }
@keyframes lgrRatkingDoubleOver { 0%, 40% { transform: none; filter: none } 52% { transform: rotate(10deg) translateY(8px); filter: drop-shadow(0 0 6px ${R.stink}) } 58% { transform: rotate(9deg) translate(1.5px, 8px) } 64% { transform: rotate(10deg) translate(-1.5px, 8px) } 70% { transform: rotate(9deg) translate(1px, 7px); filter: drop-shadow(0 0 4px ${R.stink}) } 88% { transform: rotate(2deg) translateY(2px); filter: none } 100% { transform: none; filter: none } }
.lgr-ratking-buyTail { animation: lgrRatkingSneer 520ms cubic-bezier(.22,1,.36,1) both; transform-origin: 50% 100% }
@keyframes lgrRatkingSneer { 0%, 100% { transform: none } 35% { transform: rotate(6deg) translateY(2px) skewX(-3deg) } 70% { transform: rotate(4deg) translateY(1px) } }
.lgr-ratking-tail { animation: lgrRatkingScowl 800ms ease-out both; transform-origin: 50% 70% }
@keyframes lgrRatkingScowl { 0%, 100% { transform: none } 18% { transform: rotate(7deg) translateY(3px) } 36% { transform: rotate(-7deg) } 54% { transform: rotate(5deg) } 72% { transform: rotate(-3deg) } 88% { transform: rotate(1deg) } }
/* fx-layer motion: the gloating sparkle on the stolen coin twinkles (spins and pulses in place, own translate kept) */
@keyframes lgrRatkingSparkle { 0% { transform: translate(-3.7px, 7px) scale(0) rotate(0deg) } 25% { transform: translate(-3.7px, 7px) scale(1.4) rotate(45deg) } 45% { transform: translate(-3.7px, 7px) scale(.7) rotate(70deg) } 65% { transform: translate(-3.7px, 7px) scale(1.2) rotate(90deg) } 100% { transform: translate(-3.7px, 7px) scale(1) rotate(90deg) } }
.lg-boss[data-fx="stolen"] .lgfa-ratking-sparkle { transform-box: fill-box; transform-origin: center; animation: lgrRatkingSparkle 700ms ease-out both }
/* THE REAL PARTS: the state layer this ability draws on the boss (its lg-ab-* group in raids/ratking.svg) moves with
   the moment, not only the whole figure. Played only while data-fx is set (never in focus mode, with Still bosses or
   under reduced motion). */
@keyframes lgrRatkingHoardRattle { 0%, 100% { transform: none } 20% { transform: translateX(2px) rotate(3deg) } 40% { transform: translateX(-2px) rotate(-3deg) } 60% { transform: translateX(1.5px) rotate(2deg) } 80% { transform: translateX(-1px) } }
.lg-boss[data-fx="loot"] [class*="lg-ab-hoard-"], .lg-boss[data-fx="stolen"] [class*="lg-ab-hoard-"] { transform-box: fill-box; transform-origin: center bottom; animation: lgrRatkingHoardRattle 320ms cubic-bezier(.22,1,.36,1) both }
/* THE DRAWING ACTS IT OUT: his own SVG parts (lg-ratking-arml = the scepter or card hand, -armr = the coin paw, the chip
   shove or the goblet, -head, -crown, -cigar in raids/ratking.svg, all three phases) move with every moment, his attack
   and each ability. Pivots in the drawing's own units (view-box); crown and cigar about themselves. Played only while
   data-moment / data-assault-on / data-fx is set (never in focus mode, with Still bosses or under reduced motion). */
.lg-ratking-arml, .lg-ratking-armr, .lg-ratking-head { transform-box: view-box }
.lg-p1 .lg-ratking-arml { transform-origin: 13px 84px } .lg-p1 .lg-ratking-armr { transform-origin: 96px 84px } .lg-p1 .lg-ratking-head { transform-origin: 60px 88px }
.lg-p2 .lg-ratking-arml { transform-origin: 26px 80px } .lg-p2 .lg-ratking-armr { transform-origin: 88px 80px } .lg-p2 .lg-ratking-head { transform-origin: 58px 82px }
.lg-p3 .lg-ratking-arml { transform-origin: 10px 108px } .lg-p3 .lg-ratking-armr { transform-origin: 112px 130px } .lg-p3 .lg-ratking-head { transform-origin: 60px 90px }
.lg-ratking-crown { transform-box: fill-box; transform-origin: 50% 100% }
.lg-ratking-cigar { transform-box: fill-box; transform-origin: 85% 50% }

/* HIS STRIKE (data-assault-on from the first frame, then data-moment="hurt"): he rears back, the scepter cocks behind
   him (100 ms), then BATS the coins out at your hearts: the scepter whips through and comes at the camera, the paw
   flicks (phase 1), shoves the chips (phase 2) or flings the goblet's coins (phase 3), the head lunges with a sneer. */
@keyframes lgrRkArmStrike { 0% { transform: none } 11% { transform: rotate(-28deg) } 16% { transform: rotate(-31deg) scale(1.03) }
  25% { transform: rotate(40deg) scale(1.24) } 31% { transform: rotate(33deg) scale(1.18) } 38% { transform: rotate(37deg) scale(1.2) }
  65% { transform: rotate(22deg) scale(1.08) } 100% { transform: none } }
@keyframes lgrRkPawStrike { 0% { transform: none } 11% { transform: rotate(-20deg) translate(-2px, 2px) } 18% { transform: rotate(-22deg) translate(-2px, 2px) }
  27% { transform: rotate(32deg) translate(3px, -3px) scale(1.16) } 40% { transform: rotate(24deg) scale(1.1) } 100% { transform: none } }
@keyframes lgrRkChipShove { 0% { transform: none } 11% { transform: translate(-5px, -2px) rotate(-6deg) } 18% { transform: translate(-6px, -2px) rotate(-7deg) }
  27% { transform: translate(9px, 5px) rotate(8deg) scale(1.18) } 40% { transform: translate(7px, 4px) rotate(5deg) scale(1.12) } 100% { transform: none } }
@keyframes lgrRkGobletFling { 0% { transform: none } 11% { transform: rotate(18deg) } 18% { transform: rotate(20deg) translateY(2px) }
  27% { transform: rotate(-48deg) translate(4px, -6px) scale(1.2) } 40% { transform: rotate(-40deg) translate(3px, -4px) scale(1.14) } 100% { transform: none } }
@keyframes lgrRkHeadStrike { 0% { transform: none } 11% { transform: rotate(-9deg) translateY(-3px) } 18% { transform: rotate(-10deg) translateY(-3px) }
  27% { transform: rotate(8deg) translate(4px, 3px) scale(1.07) } 45% { transform: rotate(4deg) translate(2px, 1px) scale(1.03) } 100% { transform: none } }
@keyframes lgrRkCrownStrike { 0% { transform: none } 11% { transform: rotate(-7deg) } 29% { transform: rotate(12deg) translateY(-4px) } 42% { transform: rotate(-5deg) } 60% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgrRkCigarStrike { 0% { transform: none } 11% { transform: rotate(10deg) } 27% { transform: rotate(-22deg) } 50% { transform: rotate(-12deg) } 100% { transform: none } }
.lg-boss[data-motif="ratking"][data-assault-on] .lg-ratking-arml, .lg-boss[data-motif="ratking"][data-moment="hurt"] .lg-ratking-arml { animation: lgrRkArmStrike 900ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="ratking"][data-assault-on] .lg-ratking-armr, .lg-boss[data-motif="ratking"][data-moment="hurt"] .lg-ratking-armr { animation: lgrRkPawStrike 900ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="ratking"][data-assault-on] .lg-p2 .lg-ratking-armr, .lg-boss[data-motif="ratking"][data-moment="hurt"] .lg-p2 .lg-ratking-armr { animation-name: lgrRkChipShove }
.lg-boss[data-motif="ratking"][data-assault-on] .lg-p3 .lg-ratking-armr, .lg-boss[data-motif="ratking"][data-moment="hurt"] .lg-p3 .lg-ratking-armr { animation-name: lgrRkGobletFling }
.lg-boss[data-motif="ratking"][data-assault-on] .lg-ratking-head, .lg-boss[data-motif="ratking"][data-moment="hurt"] .lg-ratking-head { animation: lgrRkHeadStrike 900ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="ratking"][data-assault-on] .lg-ratking-crown, .lg-boss[data-motif="ratking"][data-moment="hurt"] .lg-ratking-crown { animation: lgrRkCrownStrike 900ms ease-out both }
.lg-boss[data-motif="ratking"][data-assault-on] .lg-ratking-cigar, .lg-boss[data-motif="ratking"][data-moment="hurt"] .lg-ratking-cigar { animation: lgrRkCigarStrike 900ms ease-out both }

/* HIS HEAVY BLOW (data-moment="hurtBig", 100 ms into the strike, starting from its cocked pose): the scepter goes up
   over his head and SLAMS down at you, the head drives in behind it, the crown bounces off his skull. */
@keyframes lgrRkArmHeavy { 0% { transform: rotate(-28deg) } 16% { transform: rotate(-46deg) translateY(-4px) scale(1.06) } 20% { transform: rotate(-47deg) translateY(-4px) scale(1.06) }
  28% { transform: rotate(58deg) translateY(5px) scale(1.36) } 32% { transform: rotate(50deg) translateY(6px) scale(1.3) } 36% { transform: rotate(56deg) translateY(5px) scale(1.33) }
  70% { transform: rotate(40deg) translateY(3px) scale(1.18) } 100% { transform: none } }
@keyframes lgrRkPawHeavy { 0% { transform: rotate(-20deg) translate(-2px, 2px) } 18% { transform: rotate(-34deg) translate(-4px, -3px) } 28% { transform: rotate(40deg) translate(4px, 4px) scale(1.25) }
  36% { transform: rotate(34deg) translate(3px, 3px) scale(1.2) } 100% { transform: none } }
@keyframes lgrRkChipHeavy { 0% { transform: translate(-5px, -2px) rotate(-6deg) } 18% { transform: translate(-9px, -5px) rotate(-12deg) } 28% { transform: translate(12px, 7px) rotate(12deg) scale(1.3) }
  36% { transform: translate(10px, 6px) rotate(9deg) scale(1.24) } 100% { transform: none } }
@keyframes lgrRkGobletHeavy { 0% { transform: rotate(18deg) } 18% { transform: rotate(28deg) translateY(3px) } 28% { transform: rotate(-70deg) translate(6px, -8px) scale(1.3) }
  36% { transform: rotate(-62deg) translate(5px, -7px) scale(1.24) } 100% { transform: none } }
@keyframes lgrRkHeadHeavy { 0% { transform: rotate(-9deg) translateY(-3px) } 18% { transform: rotate(-13deg) translateY(-5px) } 28% { transform: rotate(11deg) translate(5px, 5px) scale(1.13) }
  34% { transform: rotate(8deg) translate(4px, 4px) scale(1.1) } 60% { transform: rotate(5deg) translate(2px, 2px) scale(1.05) } 100% { transform: none } }
@keyframes lgrRkCrownHeavy { 0% { transform: rotate(-7deg) } 18% { transform: rotate(-10deg) } 30% { transform: translateY(-10px) rotate(22deg) } 44% { transform: translateY(0) rotate(-8deg) }
  52% { transform: translateY(-3px) rotate(4deg) } 62% { transform: none } 100% { transform: none } }
.lg-boss[data-motif="ratking"][data-moment="hurtBig"] .lg-ratking-arml { animation: lgrRkArmHeavy 1150ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="ratking"][data-moment="hurtBig"] .lg-ratking-armr { animation: lgrRkPawHeavy 1150ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="ratking"][data-moment="hurtBig"] .lg-p2 .lg-ratking-armr { animation-name: lgrRkChipHeavy }
.lg-boss[data-motif="ratking"][data-moment="hurtBig"] .lg-p3 .lg-ratking-armr { animation-name: lgrRkGobletHeavy }
.lg-boss[data-motif="ratking"][data-moment="hurtBig"] .lg-ratking-head { animation: lgrRkHeadHeavy 1150ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="ratking"][data-moment="hurtBig"] .lg-ratking-crown { animation: lgrRkCrownHeavy 1150ms ease-out both }

/* HIT: your blow knocks his head back, the crown jolts crooked, the paw clutches his money, the cigar droops. */
@keyframes lgrRkHeadHit { 0% { transform: none } 12% { transform: rotate(-13deg) translate(-4px, -2px) } 30% { transform: rotate(5deg) } 48% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgrRkCrownHit { 0% { transform: none } 12% { transform: rotate(-24deg) translate(-3px, -5px) } 34% { transform: rotate(9deg) translateY(-1px) } 56% { transform: rotate(-3deg) } 100% { transform: none } }
@keyframes lgrRkPawHit { 0% { transform: none } 14% { transform: rotate(-15deg) translate(-3px, 2px) scale(.94) } 60% { transform: rotate(-8deg) translate(-1px, 1px) } 100% { transform: none } }
@keyframes lgrRkCigarHit { 0% { transform: none } 14% { transform: rotate(28deg) } 50% { transform: rotate(16deg) } 100% { transform: none } }
.lg-boss[data-motif="ratking"][data-moment="hit"] .lg-ratking-head { animation: lgrRkHeadHit 700ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="ratking"][data-moment="hit"] .lg-ratking-crown { animation: lgrRkCrownHit 700ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="ratking"][data-moment="hit"] .lg-ratking-armr { animation: lgrRkPawHit 700ms ease-out both }
.lg-boss[data-motif="ratking"][data-moment="hit"] .lg-ratking-cigar { animation: lgrRkCigarHit 700ms ease-out both }

/* CRIT: the crown is knocked clean off his head, flips over in the air and drops back on; his head whips, both arms
   fly up (the scepter nearly lost, the paw throws its money). */
@keyframes lgrRkCrownCrit { 0% { transform: none } 10% { transform: translate(-4px, -20px) rotate(-60deg) } 32% { transform: translate(-6px, -34px) rotate(-200deg) }
  54% { transform: translate(-1px, -6px) rotate(-340deg) } 60% { transform: translateY(0) rotate(-372deg) } 70% { transform: translateY(-3px) rotate(-352deg) } 82% { transform: rotate(-362deg) } 100% { transform: rotate(-360deg) } }
@keyframes lgrRkHeadCrit { 0% { transform: none } 10% { transform: rotate(-17deg) translate(-5px, -3px) scale(.95) } 28% { transform: rotate(7deg) translateX(1px) } 46% { transform: rotate(-4deg) } 64% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgrRkArmCrit { 0% { transform: none } 10% { transform: rotate(-30deg) translateY(-2px) } 36% { transform: rotate(12deg) } 58% { transform: rotate(-5deg) } 100% { transform: none } }
@keyframes lgrRkPawCrit { 0% { transform: none } 10% { transform: rotate(30deg) translateY(-3px) } 36% { transform: rotate(-10deg) } 58% { transform: rotate(4deg) } 100% { transform: none } }
.lg-boss[data-motif="ratking"][data-moment="crit"] .lg-ratking-crown { transform-origin: 50% 50%; animation: lgrRkCrownCrit 1000ms cubic-bezier(.3,.7,.4,1) both }
.lg-boss[data-motif="ratking"][data-moment="crit"] .lg-ratking-head { animation: lgrRkHeadCrit 1000ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="ratking"][data-moment="crit"] .lg-ratking-arml { animation: lgrRkArmCrit 1000ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="ratking"][data-moment="crit"] .lg-ratking-armr { animation: lgrRkPawCrit 1000ms cubic-bezier(.2,.8,.3,1) both }

/* SHARPEN: two honed cuts, two ways: the head is slapped left then right, the crown spins on its rim like a flipped
   coin, the cigar is clipped and spins. */
@keyframes lgrRkHeadSharpen { 0% { transform: none } 8% { transform: translateX(-5px) rotate(-7deg) } 20% { transform: translateX(1px) } 30% { transform: translateX(5px) rotate(7deg) } 46% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgrRkCrownSharpen { 0% { transform: none } 8% { transform: scaleX(-1) rotate(10deg) } 18% { transform: scaleX(1) rotate(-6deg) } 30% { transform: scaleX(-1) rotate(-12deg) } 42% { transform: scaleX(1) rotate(5deg) } 60% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgrRkCigarSharpen { 0% { transform: none } 30% { transform: rotate(0) } 40% { transform: rotate(160deg) translateY(4px) } 60% { transform: rotate(330deg) translateY(2px) } 74% { transform: rotate(360deg) } 100% { transform: rotate(360deg) } }
@keyframes lgrRkArmSharpen { 0% { transform: none } 8% { transform: rotate(-9deg) } 30% { transform: rotate(9deg) } 50% { transform: none } 100% { transform: none } }
.lg-boss[data-motif="ratking"][data-moment="sharpen"] .lg-ratking-head { animation: lgrRkHeadSharpen 750ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="ratking"][data-moment="sharpen"] .lg-ratking-crown { animation: lgrRkCrownSharpen 750ms linear both }
.lg-boss[data-motif="ratking"][data-moment="sharpen"] .lg-ratking-cigar { animation: lgrRkCigarSharpen 750ms ease-out both }
.lg-boss[data-motif="ratking"][data-moment="sharpen"] .lg-ratking-arml, .lg-boss[data-motif="ratking"][data-moment="sharpen"] .lg-ratking-armr { animation: lgrRkArmSharpen 750ms ease-out both }

/* BLOCK: his scepter swing is parried: it comes in, rings off your guard and is flung back behind him; he shakes the
   sting out of the paw and recoils. */
@keyframes lgrRkArmBlock { 0% { transform: none } 14% { transform: rotate(32deg) scale(1.16) } 22% { transform: rotate(34deg) scale(1.18) } 32% { transform: rotate(-38deg) scale(.96) }
  48% { transform: rotate(-14deg) } 66% { transform: rotate(6deg) } 82% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgrRkHeadBlock { 0% { transform: none } 14% { transform: rotate(5deg) translate(2px, 1px) } 32% { transform: rotate(-11deg) translate(-4px, -2px) } 56% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgrRkPawBlock { 0% { transform: none } 32% { transform: rotate(-6deg) } 40% { transform: rotate(8deg) } 48% { transform: rotate(-7deg) } 56% { transform: rotate(5deg) } 64% { transform: rotate(-3deg) } 100% { transform: none } }
.lg-boss[data-motif="ratking"][data-moment="block"] .lg-ratking-arml { animation: lgrRkArmBlock 800ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="ratking"][data-moment="block"] .lg-ratking-head { animation: lgrRkHeadBlock 800ms ease-out both }
.lg-boss[data-motif="ratking"][data-moment="block"] .lg-ratking-armr { animation: lgrRkPawBlock 800ms linear both }

/* SHIELD: his blow glances off the dome: the scepter skids past and overreaches, he stumbles forward after it, the
   crown slides down over one eye and is shoved back up. */
@keyframes lgrRkArmShield { 0% { transform: none } 14% { transform: rotate(-22deg) } 26% { transform: rotate(30deg) scale(1.14) } 38% { transform: rotate(52deg) translateY(5px) scale(1.1) }
  60% { transform: rotate(24deg) translateY(2px) } 100% { transform: none } }
@keyframes lgrRkHeadShield { 0% { transform: none } 14% { transform: rotate(-6deg) translateY(-2px) } 38% { transform: rotate(9deg) translate(4px, 3px) } 60% { transform: rotate(-3deg) } 100% { transform: none } }
@keyframes lgrRkCrownShield { 0% { transform: none } 38% { transform: rotate(16deg) translate(3px, 2px) } 64% { transform: rotate(14deg) translate(3px, 2px) } 76% { transform: rotate(-4deg) translateY(-2px) } 100% { transform: none } }
.lg-boss[data-motif="ratking"][data-moment="shield"] .lg-ratking-arml { animation: lgrRkArmShield 820ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="ratking"][data-moment="shield"] .lg-ratking-head { animation: lgrRkHeadShield 820ms ease-out both }
.lg-boss[data-motif="ratking"][data-moment="shield"] .lg-ratking-crown { animation: lgrRkCrownShield 820ms ease-out both }

/* SECOND WIND: you got back up and he is NOT pleased: the head shakes no, the paw hugs his money to his chest, the
   scepter taps impatiently twice. */
@keyframes lgrRkHeadWind { 0% { transform: none } 10% { transform: rotate(-6deg) } 24% { transform: rotate(6deg) } 38% { transform: rotate(-5deg) } 52% { transform: rotate(4deg) } 66% { transform: rotate(-1deg) } 100% { transform: none } }
@keyframes lgrRkPawWind { 0% { transform: none } 20% { transform: rotate(-22deg) translate(-5px, 1px) scale(.9) } 75% { transform: rotate(-20deg) translate(-4px, 1px) scale(.92) } 100% { transform: none } }
@keyframes lgrRkArmWind { 0% { transform: none } 22% { transform: rotate(-8deg) translateY(-2px) } 30% { transform: translateY(1px) } 44% { transform: rotate(-8deg) translateY(-2px) } 52% { transform: translateY(1px) } 62% { transform: none } 100% { transform: none } }
.lg-boss[data-motif="ratking"][data-moment="wind"] .lg-ratking-head { animation: lgrRkHeadWind 900ms ease-in-out both }
.lg-boss[data-motif="ratking"][data-moment="wind"] .lg-ratking-armr { animation: lgrRkPawWind 900ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="ratking"][data-moment="wind"] .lg-ratking-arml { animation: lgrRkArmWind 900ms linear both }

/* KNOCKOUT, DETHRONED: he reels, the crown is knocked off and tumbles down into his lap, the scepter falls out of his
   grip, the money spills from the paw (the goblet tips over), the cigar drops and the head slumps. */
@keyframes lgrRkCrownKo { 0% { transform: none } 8% { transform: translateY(-4px) rotate(-10deg) } 24% { transform: translateY(-16px) rotate(35deg) } 46% { transform: translate(4px, -12px) rotate(170deg) }
  64% { transform: translate(12px, 58px) rotate(262deg) } 70% { transform: translate(12px, 53px) rotate(250deg) } 76% { transform: translate(13px, 58px) rotate(256deg) } 100% { transform: translate(13px, 58px) rotate(254deg) } }
@keyframes lgrRkArmKo { 0% { transform: none } 12% { transform: rotate(-14deg) } 40% { transform: rotate(-6deg) } 60% { transform: rotate(72deg) translateY(10px) } 68% { transform: rotate(86deg) translateY(16px) }
  74% { transform: rotate(80deg) translateY(14px) } 100% { transform: rotate(83deg) translateY(15px) } }
@keyframes lgrRkPawKo { 0% { transform: none } 12% { transform: rotate(16deg) translateY(-2px) } 40% { transform: rotate(4deg) } 62% { transform: rotate(-58deg) translateY(8px) } 72% { transform: rotate(-50deg) translateY(10px) } 100% { transform: rotate(-54deg) translateY(10px) } }
@keyframes lgrRkPawKoRight { 0% { transform: none } 12% { transform: rotate(-16deg) translateY(-2px) } 40% { transform: rotate(-4deg) } 62% { transform: rotate(58deg) translateY(8px) } 72% { transform: rotate(50deg) translateY(10px) } 100% { transform: rotate(54deg) translateY(10px) } }
@keyframes lgrRkHeadKo { 0% { transform: none } 12% { transform: rotate(-12deg) translate(-3px, -3px) } 30% { transform: rotate(6deg) } 44% { transform: rotate(-4deg) }
  62% { transform: rotate(15deg) translateY(7px) scale(.97) } 72% { transform: rotate(19deg) translateY(10px) scale(.96) } 100% { transform: rotate(18deg) translateY(10px) scale(.96) } }
@keyframes lgrRkCigarKo { 0% { transform: none } 40% { transform: rotate(10deg) } 62% { transform: rotate(-70deg) translateY(8px) } 100% { transform: rotate(-80deg) translateY(10px) } }
.lg-boss[data-motif="ratking"][data-moment="ko"] .lg-ratking-crown { animation: lgrRkCrownKo 2200ms cubic-bezier(.4,0,.6,1) both }
.lg-boss[data-motif="ratking"][data-moment="ko"] .lg-ratking-arml { animation: lgrRkArmKo 2200ms ease-in-out both }
.lg-boss[data-motif="ratking"][data-moment="ko"] .lg-ratking-armr { animation: lgrRkPawKoRight 2200ms ease-in-out both }
.lg-boss[data-motif="ratking"][data-moment="ko"] .lg-p3 .lg-ratking-armr { animation-name: lgrRkPawKo }
.lg-boss[data-motif="ratking"][data-moment="ko"] .lg-ratking-head { animation: lgrRkHeadKo 2200ms ease-in-out both }
.lg-boss[data-motif="ratking"][data-moment="ko"] .lg-ratking-cigar { animation: lgrRkCigarKo 2200ms ease-in both }


/* Phase 2: the card fan THRUSTS at the camera (the cards come at you big), same timing as the swing. Phase 1: the
   scepter is held at its middle and drawn behind his head, so it CHOPS: raised high, then brought down at you with the
   skull coming at the camera on the left (a swing to the right would vanish behind his head). */
@keyframes lgrRkChop { 0% { transform: none } 11% { transform: rotate(12deg) translateY(-6px) } 16% { transform: rotate(14deg) translateY(-7px) scale(1.04) }
  25% { transform: rotate(-38deg) translate(-2px, 4px) scale(1.5) } 31% { transform: rotate(-32deg) translate(-2px, 3px) scale(1.42) } 38% { transform: rotate(-35deg) translate(-2px, 4px) scale(1.45) }
  65% { transform: rotate(-15deg) translateY(1px) scale(1.15) } 100% { transform: none } }
@keyframes lgrRkChopHeavy { 0% { transform: rotate(12deg) translateY(-6px) } 16% { transform: rotate(18deg) translateY(-10px) scale(1.08) } 20% { transform: rotate(19deg) translateY(-10px) scale(1.08) }
  28% { transform: rotate(-48deg) translate(-2px, 6px) scale(1.7) } 32% { transform: rotate(-42deg) translate(-2px, 6px) scale(1.58) } 36% { transform: rotate(-46deg) translate(-2px, 6px) scale(1.64) }
  70% { transform: rotate(-24deg) translateY(2px) scale(1.25) } 100% { transform: none } }
@keyframes lgrRkChopBlock { 0% { transform: none } 14% { transform: rotate(-30deg) translateY(3px) scale(1.4) } 22% { transform: rotate(-32deg) translateY(3px) scale(1.42) }
  32% { transform: rotate(20deg) translateY(-5px) scale(.96) } 48% { transform: rotate(8deg) translateY(-2px) } 66% { transform: rotate(-4deg) } 82% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgrRkChopShield { 0% { transform: none } 14% { transform: rotate(12deg) translateY(-5px) } 26% { transform: rotate(-30deg) translateY(3px) scale(1.35) }
  38% { transform: rotate(-52deg) translate(-3px, 7px) scale(1.3) } 60% { transform: rotate(-20deg) translateY(2px) scale(1.1) } 100% { transform: none } }
@keyframes lgrRkThrust { 0% { transform: none } 11% { transform: rotate(-18deg) } 16% { transform: rotate(-20deg) scale(1.04) }
  25% { transform: rotate(28deg) translate(6px, -4px) scale(1.5) } 31% { transform: rotate(22deg) translate(5px, -3px) scale(1.42) } 38% { transform: rotate(25deg) translate(6px, -4px) scale(1.45) }
  65% { transform: rotate(12deg) translate(2px, -1px) scale(1.15) } 100% { transform: none } }
@keyframes lgrRkThrustHeavy { 0% { transform: rotate(-18deg) } 16% { transform: rotate(-30deg) translateY(-6px) scale(1.08) } 20% { transform: rotate(-31deg) translateY(-6px) scale(1.08) }
  28% { transform: rotate(35deg) translate(8px, 2px) scale(1.7) } 32% { transform: rotate(29deg) translate(8px, 3px) scale(1.58) } 36% { transform: rotate(33deg) translate(8px, 2px) scale(1.64) }
  70% { transform: rotate(18deg) translate(4px, 1px) scale(1.25) } 100% { transform: none } }
@keyframes lgrRkThrustBlock { 0% { transform: none } 14% { transform: rotate(22deg) translate(5px, -3px) scale(1.4) } 22% { transform: rotate(24deg) translate(5px, -3px) scale(1.42) }
  32% { transform: rotate(-26deg) translate(-2px, 1px) scale(.94) } 48% { transform: rotate(-10deg) } 66% { transform: rotate(5deg) } 82% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgrRkThrustShield { 0% { transform: none } 14% { transform: rotate(-15deg) } 26% { transform: rotate(20deg) translate(5px, -3px) scale(1.35) }
  38% { transform: rotate(38deg) translate(9px, 4px) scale(1.3) } 60% { transform: rotate(18deg) translate(3px, 1px) scale(1.1) } 100% { transform: none } }
@keyframes lgrRkDropKo { 0% { transform: none } 12% { transform: rotate(-12deg) } 40% { transform: rotate(-4deg) } 60% { transform: rotate(-58deg) translateY(10px) } 68% { transform: rotate(-72deg) translateY(16px) }
  74% { transform: rotate(-66deg) translateY(14px) } 100% { transform: rotate(-69deg) translateY(15px) } }
.lg-boss[data-motif="ratking"][data-assault-on] :is(.lg-p2) .lg-ratking-arml, .lg-boss[data-motif="ratking"][data-moment="hurt"] :is(.lg-p2) .lg-ratking-arml { animation-name: lgrRkThrust }
.lg-boss[data-motif="ratking"][data-moment="hurtBig"] :is(.lg-p2) .lg-ratking-arml { animation-name: lgrRkThrustHeavy }
.lg-boss[data-motif="ratking"][data-moment="block"] :is(.lg-p2) .lg-ratking-arml { animation-name: lgrRkThrustBlock }
.lg-boss[data-motif="ratking"][data-moment="shield"] :is(.lg-p2) .lg-ratking-arml { animation-name: lgrRkThrustShield }
.lg-boss[data-motif="ratking"][data-assault-on] :is(.lg-p1) .lg-ratking-arml, .lg-boss[data-motif="ratking"][data-moment="hurt"] :is(.lg-p1) .lg-ratking-arml { animation-name: lgrRkChop }
.lg-boss[data-motif="ratking"][data-moment="hurtBig"] :is(.lg-p1) .lg-ratking-arml { animation-name: lgrRkChopHeavy }
.lg-boss[data-motif="ratking"][data-moment="block"] :is(.lg-p1) .lg-ratking-arml { animation-name: lgrRkChopBlock }
.lg-boss[data-motif="ratking"][data-moment="shield"] :is(.lg-p1) .lg-ratking-arml { animation-name: lgrRkChopShield }
.lg-boss[data-motif="ratking"][data-moment="ko"] :is(.lg-p1, .lg-p2) .lg-ratking-arml { animation-name: lgrRkDropKo }

/* THE ABILITIES on his own parts (after the strike rules: an ability's own reaction wins on a part both touch). */
/* loot: you rob a coin: the paw jerks empty, his head dips. */
@keyframes lgrRkPawLoot { 0% { transform: none } 30% { transform: rotate(-18deg) translate(-3px, 2px) } 70% { transform: rotate(5deg) } 100% { transform: none } }
@keyframes lgrRkHeadLoot { 0% { transform: none } 30% { transform: rotate(-4deg) translateY(2px) } 100% { transform: none } }
.lg-boss[data-motif="ratking"][data-fx="loot"] .lg-ratking-armr { animation: lgrRkPawLoot 340ms ease-out both }
.lg-boss[data-motif="ratking"][data-fx="loot"] .lg-ratking-head { animation: lgrRkHeadLoot 340ms ease-out both }
/* stolen: his rats grab the coin back: he reaches down for it and raises it to his chest, chin up, crown tipped back. */
@keyframes lgrRkPawStolen { 0% { transform: none } 22% { transform: rotate(26deg) translate(3px, 4px) } 48% { transform: rotate(-26deg) translate(-4px, -5px) scale(1.12) } 72% { transform: rotate(-20deg) translate(-3px, -4px) scale(1.08) } 100% { transform: none } }
@keyframes lgrRkHeadStolen { 0% { transform: none } 26% { transform: rotate(-10deg) translateY(-3px) } 72% { transform: rotate(-8deg) translateY(-2px) } 100% { transform: none } }
@keyframes lgrRkCrownStolen { 0% { transform: none } 30% { transform: rotate(-14deg) } 72% { transform: rotate(-12deg) } 100% { transform: none } }
@keyframes lgrRkArmStolen { 0% { transform: none } 30% { transform: rotate(-12deg) } 44% { transform: rotate(5deg) } 58% { transform: rotate(-8deg) } 100% { transform: none } }
.lg-boss[data-motif="ratking"][data-fx="stolen"] .lg-ratking-armr { animation: lgrRkPawStolen 800ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-motif="ratking"][data-fx="stolen"] .lg-ratking-head { animation: lgrRkHeadStolen 800ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-motif="ratking"][data-fx="stolen"] .lg-ratking-crown { animation: lgrRkCrownStolen 800ms ease-out both }
.lg-boss[data-motif="ratking"][data-fx="stolen"] .lg-ratking-arml { animation: lgrRkArmStolen 800ms ease-out both }
/* bomb: he looks up at the cheese coming, it lands on his head (470 ms): the head is squashed, the crown blown off to
   the side, both arms thrown up. */
@keyframes lgrRkHeadBomb { 0% { transform: none } 30% { transform: rotate(-10deg) translateY(-3px) } 39% { transform: rotate(-11deg) translateY(-3px) } 42% { transform: translateY(5px) scale(1.08, .84) }
  52% { transform: translateY(1px) scale(.96, 1.04) } 64% { transform: rotate(5deg) translateY(2px) } 100% { transform: none } }
@keyframes lgrRkCrownBomb { 0% { transform: none } 39% { transform: rotate(-6deg) } 44% { transform: translate(-14px, -22px) rotate(-80deg) } 62% { transform: translate(-12px, -8px) rotate(-48deg) } 82% { transform: rotate(-12deg) } 100% { transform: none } }
@keyframes lgrRkArmBomb { 0% { transform: none } 40% { transform: none } 46% { transform: rotate(-32deg) translateY(-3px) } 66% { transform: rotate(-20deg) } 100% { transform: none } }
@keyframes lgrRkPawBomb { 0% { transform: none } 40% { transform: none } 46% { transform: rotate(30deg) translateY(-3px) } 66% { transform: rotate(18deg) } 100% { transform: none } }
.lg-boss[data-motif="ratking"][data-fx="bomb"] .lg-ratking-head { animation: lgrRkHeadBomb 1200ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="ratking"][data-fx="bomb"] .lg-ratking-crown { animation: lgrRkCrownBomb 1200ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="ratking"][data-fx="bomb"] .lg-ratking-arml { animation: lgrRkArmBomb 1200ms ease-out both }
.lg-boss[data-motif="ratking"][data-fx="bomb"] .lg-ratking-armr { animation: lgrRkPawBomb 1200ms ease-out both }
/* buyTail: the lucky tail curls under him and he sneers: leans on the scepter, wags the paw (tsk tsk), crown cocked. */
@keyframes lgrRkArmTail { 0% { transform: none } 30% { transform: rotate(9deg) translateY(1px) } 75% { transform: rotate(8deg) } 100% { transform: none } }
@keyframes lgrRkPawWag { 0% { transform: none } 18% { transform: rotate(-12deg) } 34% { transform: rotate(10deg) } 50% { transform: rotate(-12deg) } 66% { transform: rotate(8deg) } 100% { transform: none } }
@keyframes lgrRkCrownCock { 0% { transform: none } 30% { transform: rotate(12deg) translateX(2px) } 75% { transform: rotate(10deg) translateX(2px) } 100% { transform: none } }
.lg-boss[data-motif="ratking"][data-fx="buyTail"] .lg-ratking-arml { animation: lgrRkArmTail 800ms ease-out both }
.lg-boss[data-motif="ratking"][data-fx="buyTail"] .lg-ratking-armr { animation: lgrRkPawWag 800ms ease-in-out both }
.lg-boss[data-motif="ratking"][data-fx="buyTail"] .lg-ratking-crown { animation: lgrRkCrownCock 800ms ease-out both }
/* tail: the tail saves your heart: he scowls, bangs the scepter down in a rage, the paw clenches, the crown rattles. */
@keyframes lgrRkArmRage { 0% { transform: none } 14% { transform: rotate(-16deg) translateY(-5px) } 24% { transform: rotate(5deg) translateY(3px) } 34% { transform: rotate(-12deg) translateY(-4px) }
  44% { transform: rotate(4deg) translateY(3px) } 60% { transform: none } 100% { transform: none } }
@keyframes lgrRkPawClench { 0% { transform: none } 20% { transform: rotate(-12deg) scale(.88) } 70% { transform: rotate(-10deg) scale(.9) } 100% { transform: none } }
@keyframes lgrRkCrownRattle { 0% { transform: none } 24% { transform: rotate(6deg) translateY(-2px) } 30% { transform: rotate(-5deg) } 44% { transform: rotate(5deg) translateY(-2px) } 50% { transform: rotate(-3deg) } 64% { transform: none } 100% { transform: none } }
.lg-boss[data-motif="ratking"][data-fx="tail"] .lg-ratking-arml { animation: lgrRkArmRage 1100ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="ratking"][data-fx="tail"] .lg-ratking-armr { animation: lgrRkPawClench 1100ms ease-out both }
.lg-boss[data-motif="ratking"][data-fx="tail"] .lg-ratking-crown { animation: lgrRkCrownRattle 1100ms linear both }
`,
}
