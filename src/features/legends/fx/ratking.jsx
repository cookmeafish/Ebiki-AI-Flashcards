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
`,
}
