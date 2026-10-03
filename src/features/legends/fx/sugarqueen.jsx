// What Sugar Rush (abilities/sugarqueen.js) LOOKS like (design v2.1, #25). The fx contract is in fx/index.js.
//   cube   (tick)   a sugar cube drops into her jar with a sparkle.
//   rush   (big)    a giant striped candy spins in and rainbow sprinkles radiate out (she blows a kiss).
//   sweet  (tick)   a boosted hit during the rush: a little sprinkle burst.
//   crash  (medium) hard candy shatters and the shards fall (she pouts).
import { center, anim, around, ring } from './_kit'

// Fixed bright candy colors (never theme tokens over the art).
const S = { pink: '#ff3d8b', rose: '#ff8fd0', blue: '#4fc8ff', lemon: '#ffe14d', mint: '#6fe38a', grape: '#b57bff', white: '#ffffff', ice: '#c9f6ff', ink: '#1d2230' }
const SPRINKLES = [S.pink, S.blue, S.lemon, S.mint, S.grape, S.white]

export default {
  effects: {
    cube: () => <>
      <div className="lgx" style={{ left: '74%', top: '8%', width: 13, height: 13, borderRadius: 3, background: `linear-gradient(135deg, ${S.white}, ${S.ice})`, border: `1.5px solid ${S.ink}`, '--spin': '90deg', animation: anim('lgrSugarCubeDrop', 340, 0, 'ease-in') }} />
      {[0, 1, 2].map((i) => <div key={i} className="lgx" style={{ left: `${72 + i * 3}%`, top: '34%', width: 5, height: 5, background: S.lemon, clipPath: 'polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%)', '--h': '-18px', animation: anim('lgxRise', 300, 160 + i * 30) }} />)}
    </>,
    rush: () => <>
      <div className="lgx lgx-full" style={{ background: `radial-gradient(circle, rgba(255, 143, 208, .55), transparent 60%)`, animation: anim('lgxFlash', 600) }} />
      {/* the giant striped candy, spinning in */}
      <div className="lgx" style={{ ...center, width: 74, height: 74, margin: '-37px 0 0 -37px', borderRadius: '50%', background: `repeating-conic-gradient(${S.pink} 0 22.5deg, ${S.white} 22.5deg 45deg)`, border: `4px solid ${S.ink}`, boxShadow: `0 0 26px ${S.rose}, 0 0 0 5px ${S.lemon}`, animation: anim('lgrSugarSpinIn', 1150, 0, 'cubic-bezier(.34,1.56,.64,1)') }} />
      {ring(S.pink, 300, 2.1, 6, 600)}{ring(S.blue, 380, 2.7, 4, 700)}{ring(S.lemon, 460, 3.2, 3, 800)}
      {around(22, (i, a) => <div key={i} className="lgx" style={{ ...center, width: 6, height: 15, marginLeft: -3, borderRadius: 3, background: SPRINKLES[i % SPRINKLES.length], border: `1.5px solid ${S.ink}`, '--a': `${a}deg`, '--d': `${i % 2 ? -78 : -112}px`, '--spin': `${i % 2 ? 260 : -260}deg`, animation: anim('lgxShard', 900, 320 + (i % 2) * 70) }} />)}
      <div className="lgx" style={{ left: '62%', top: '18%', fontSize: 22, '--h': '-60px', animation: anim('lgxRise', 900, 500) }}>💋</div>
    </>,
    sweet: () => <>
      {around(8, (i, a) => <div key={i} className="lgx" style={{ ...center, width: 4, height: 10, marginLeft: -2, borderRadius: 2, background: SPRINKLES[i % SPRINKLES.length], border: `1px solid ${S.ink}`, '--a': `${a + 20}deg`, '--d': '-44px', '--spin': '180deg', animation: anim('lgxShard', 330) }} />)}
    </>,
    crash: () => <>
      <div className="lgx" style={{ ...center, width: 54, height: 54, margin: '-27px 0 0 -27px', borderRadius: '50%', background: `repeating-conic-gradient(${S.pink} 0 22.5deg, ${S.white} 22.5deg 45deg)`, border: `3px solid ${S.ink}`, filter: 'saturate(.6)', animation: anim('lgrSugarCrack', 380) }} />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => <div key={i} className="lgx" style={{ left: `${30 + (i % 3) * 14}%`, top: `${36 + Math.floor(i / 3) * 9}%`, width: 14 + (i % 3) * 4, height: 16 + (i % 2) * 6, background: i % 2 ? S.rose : S.ice, border: `2px solid ${S.ink}`, clipPath: 'polygon(50% 0, 100% 40%, 70% 100%, 10% 85%, 0 30%)', '--spin': `${(i % 2 ? 1 : -1) * 190}deg`, animation: anim('lgxFall', 760, 300 + i * 30, 'ease-in') }} />)}
    </>,
  },
  floaters: { cube: 'lg_fx_sugarCube', rush: 'lg_fx_sugarRush', sweet: 'lg_fx_sugarSweet', crash: 'lg_fx_sugarCrash' },
  floaterTone: { cube: 'ink', rush: 'brand', sweet: 'brand', crash: 'info' },
  demo: { cube: { kind: 'hit', damage: 1, lives: 0 }, rush: { kind: 'hit', damage: 1, lives: 0 }, crash: { kind: 'miss', damage: 0, lives: 1 } },
  juice: {
    cube: { size: 'tick' },
    rush: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'sugarqueen.rush' },
    sweet: { size: 'tick' },
    crash: { size: 'medium', shake: 1, sfx: 'sugarqueen.crash' },
  },
  css: `
@keyframes lgrSugarCubeDrop { 0% { transform: translateY(0) rotate(0); opacity: 0 } 15% { opacity: 1 } 80% { transform: translateY(46px) rotate(90deg); opacity: 1 } 100% { transform: translateY(42px) rotate(90deg); opacity: 0 } }
@keyframes lgrSugarSpinIn { 0% { transform: rotate(-540deg) scale(0); opacity: 0 } 30% { transform: rotate(-60deg) scale(1.25); opacity: 1 } 45% { transform: rotate(0) scale(1) } 80% { transform: rotate(40deg) scale(1.05); opacity: 1 } 100% { transform: rotate(80deg) scale(1.6); opacity: 0 } }
@keyframes lgrSugarCrack { 0% { transform: scale(1); opacity: 1 } 60% { transform: scale(1.06) rotate(4deg); opacity: 1 } 100% { transform: scale(.9) rotate(-3deg); opacity: 0 } }
.lgr-sugarqueen-cube { animation: lgrSugarClink 320ms ease-out both }
@keyframes lgrSugarClink { 0%, 100% { transform: none } 40% { transform: translateY(4px) scale(1.04, .95) } 75% { transform: translateY(-2px) } }
.lgr-sugarqueen-sweet { animation: lgrSugarBlush 320ms ease-out both }
@keyframes lgrSugarBlush { 0%, 100% { transform: none; filter: none } 45% { transform: translateY(-5px) rotate(-3deg) scale(1.03); filter: saturate(1.4) brightness(1.1) } }
.lgr-sugarqueen-rush { animation: lgrSugarShimmy 1000ms ease-in-out both; transform-origin: 50% 100% }
@keyframes lgrSugarShimmy { 0%, 100% { transform: none } 16% { transform: translateX(6px) rotate(3deg) } 33% { transform: translateX(-6px) rotate(-3deg) } 50% { transform: translateX(6px) rotate(3deg) } 66% { transform: translateX(-6px) rotate(-3deg) } 84% { transform: translateX(2px) rotate(1deg) } }
.lgr-sugarqueen-crash { animation: lgrSugarSlump 780ms cubic-bezier(.22,1,.36,1) both; transform-origin: 50% 100% }
@keyframes lgrSugarSlump { 0% { transform: none } 35% { transform: translateY(8px) scaleX(1.03) rotate(-1.5deg) } 70% { transform: translateY(7px) scaleX(1.03) rotate(-1deg) } 100% { transform: none } }
/* fx-layer motion: in phase 3 the floating heart jewel pulses (two soft beats, in place) while she blows the kiss */
@keyframes lgrSugarJewelPulse { 0%, 100% { transform: none; filter: none } 18% { transform: scale(1.14); filter: brightness(1.35) } 34% { transform: scale(1); filter: none } 52% { transform: scale(1.1); filter: brightness(1.25) } 70% { transform: none; filter: none } }
.lg-boss[data-phase="3"][data-fx="rush"] .lgfa-sugarqueen-jewel { transform-box: fill-box; transform-origin: center; animation: lgrSugarJewelPulse 1000ms ease-in-out both }
/* THE REAL PARTS: the state layer this ability draws on the boss (its lg-ab-* group in raids/sugarqueen.svg) moves with
   the moment, not only the whole figure. Played only while data-fx is set (never in focus mode, with Still bosses or
   under reduced motion). */
@keyframes lgrSugarRushPop { 0% { transform: none } 35% { transform: scale(1.25) } 65% { transform: scale(.94) } 100% { transform: none } }
.lg-boss[data-fx="rush"] [class*="lg-ab-rush-"] { transform-box: fill-box; transform-origin: center; animation: lgrSugarRushPop 700ms cubic-bezier(.22,1,.36,1) both }
`,
}
