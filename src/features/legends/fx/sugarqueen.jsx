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
      <div className="lgx" style={{ left: '74%', top: '8%', width: 22, height: 22, borderRadius: 4, boxShadow: `inset -4px -4px 0 ${S.ice}, 0 0 8px ${S.white}`, background: `linear-gradient(135deg, ${S.white}, ${S.ice})`, border: `1.5px solid ${S.ink}`, '--spin': '90deg', animation: anim('lgrSugarCubeDrop', 340, 0, 'ease-in') }} />
      {[0, 1, 2, 3, 4].map((i) => <div key={i} className="lgx" style={{ left: `${70 + i * 3}%`, top: '34%', width: 11, height: 11, background: i % 2 ? S.lemon : S.white, filter: `drop-shadow(0 0 2px ${S.ink})`, clipPath: 'polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%)', '--h': '-18px', animation: anim('lgxRise', 300, 160 + i * 30) }} />)}
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
      {/* a wrapped candy pops on the hit and sprinkles burst off it */}
      <svg className="lgx" viewBox="0 0 48 24" style={{ ...center, width: 60, height: 30, margin: '-15px 0 0 -30px', overflow: 'visible', filter: `drop-shadow(0 0 6px ${S.rose})`, animation: anim('lgrSugarPop', 330, 0, 'cubic-bezier(.3,1.6,.5,1)') }} aria-hidden="true">
        <path d="M2 4 13 12 2 20ZM46 4 35 12 46 20Z" fill={S.lemon} stroke={S.ink} strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="24" cy="12" r="11" fill={S.pink} stroke={S.ink} strokeWidth="1.6" />
        <path d="M17 8C20 5 28 5 31 8M16 15C20 19 28 19 32 15" fill="none" stroke={S.white} strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      {around(12, (i, a) => <div key={i} className="lgx" style={{ ...center, width: 6, height: 14, marginLeft: -3, borderRadius: 2, background: SPRINKLES[i % SPRINKLES.length], border: `1px solid ${S.ink}`, '--a': `${a + 20}deg`, '--d': '-58px', '--spin': '180deg', animation: anim('lgxShard', 330, 40) }} />)}
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
@keyframes lgrSugarPop { 0% { transform: scale(.2) rotate(-30deg); opacity: 0 } 45% { transform: scale(1.25) rotate(8deg); opacity: 1 } 70% { transform: scale(1) rotate(0); opacity: 1 } 100% { transform: scale(1.1); opacity: 0 } }
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
/* THE DRAWING ACTS IT OUT: her own SVG parts (lg-sugarqueen-arml = the scepter arm (phases 1, 2) or the hand on her
   hip (3), -armr = the jar arm (1), the bonbon-hurling hand (2) or the raised candy hand (3), -head, -crown (1, 2),
   -jar (the jar on the cake in 2, the heart pendant in 3); raids/sugarqueen.svg) move with every moment, her attack and
   each ability. Arms pivot at the shoulder (view-box units of their own group), the head at the neck. Played only while
   data-moment / data-assault-on / data-fx is set. */
.lg-sugarqueen-arml, .lg-sugarqueen-armr, .lg-sugarqueen-head { transform-box: view-box }
.lg-p1 .lg-sugarqueen-arml { transform-origin: 44px 72px } .lg-p1 .lg-sugarqueen-armr { transform-origin: 78px 72px } .lg-p1 .lg-sugarqueen-head { transform-origin: 60px 58px }
.lg-p2 .lg-sugarqueen-arml { transform-origin: 38px 60px } .lg-p2 .lg-sugarqueen-armr { transform-origin: 84px 68px } .lg-p2 .lg-sugarqueen-head { transform-origin: 60px 64px }
.lg-p3 .lg-sugarqueen-arml { transform-origin: 30px 90px } .lg-p3 .lg-sugarqueen-armr { transform-origin: 96px 100px } .lg-p3 .lg-sugarqueen-head { transform-origin: 60px 74px }
.lg-sugarqueen-crown { transform-box: fill-box; transform-origin: 50% 100% }
.lg-sugarqueen-jar { transform-box: fill-box; transform-origin: 50% 100% }

/* HER STRIKE (data-assault-on from the first frame, then data-moment="hurt"): a spoiled royal's throw. She draws back
   (100 ms), then HURLS: phase 1 the scepter chops out at you and the jar arm flings its sugar; phase 2 the cocked
   scepter arm whips forward like a pitch and the other hand shoves the bonbons at you; phase 3 the candy hand flicks
   its orbiting sweets out toward your hearts. The head snaps forward with the throw, the crown rocks. */
@keyframes lgrSqThrow { 0% { transform: none } 11% { transform: rotate(-16deg) } 17% { transform: rotate(-18deg) scale(1.02) }
  26% { transform: rotate(34deg) scale(1.22) } 33% { transform: rotate(27deg) scale(1.16) } 40% { transform: rotate(31deg) scale(1.19) } 66% { transform: rotate(12deg) scale(1.06) } 100% { transform: none } }
@keyframes lgrSqChop { 0% { transform: none } 11% { transform: rotate(10deg) translateY(-3px) } 17% { transform: rotate(12deg) translateY(-4px) }
  26% { transform: rotate(-26deg) translateY(2px) scale(1.34) } 33% { transform: rotate(-21deg) translateY(2px) scale(1.27) } 40% { transform: rotate(-24deg) translateY(2px) scale(1.3) } 66% { transform: rotate(-10deg) scale(1.1) } 100% { transform: none } }
@keyframes lgrSqShove { 0% { transform: none } 11% { transform: rotate(12deg) translate(-2px, 1px) } 17% { transform: rotate(13deg) translate(-2px, 1px) }
  27% { transform: rotate(-20deg) translate(3px, -2px) scale(1.2) } 40% { transform: rotate(-14deg) translate(2px, -1px) scale(1.14) } 100% { transform: none } }
@keyframes lgrSqFlick { 0% { transform: none } 11% { transform: rotate(-9deg) } 17% { transform: rotate(-10deg) } 27% { transform: rotate(24deg) translate(3px, 2px) scale(1.18) }
  40% { transform: rotate(18deg) translate(2px, 1px) scale(1.12) } 66% { transform: rotate(7deg) } 100% { transform: none } }
@keyframes lgrSqHeadStrike { 0% { transform: none } 11% { transform: rotate(-7deg) translateY(-2px) } 17% { transform: rotate(-8deg) translateY(-2px) }
  27% { transform: rotate(7deg) translate(2px, 3px) scale(1.07) } 48% { transform: rotate(3deg) translate(1px, 1px) scale(1.03) } 100% { transform: none } }
@keyframes lgrSqCrownRock { 0% { transform: none } 11% { transform: rotate(-8deg) } 29% { transform: rotate(14deg) translateY(-3px) } 44% { transform: rotate(-6deg) } 62% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgrSqJarHop { 0% { transform: none } 22% { transform: translateY(-5px) rotate(-8deg) } 32% { transform: translateY(1px) scale(1.08, .9) } 44% { transform: translateY(-2px) rotate(4deg) } 60% { transform: none } 100% { transform: none } }
.lg-boss[data-motif="sugarqueen"][data-assault-on] .lg-sugarqueen-arml, .lg-boss[data-motif="sugarqueen"][data-moment="hurt"] .lg-sugarqueen-arml { animation: lgrSqThrow 900ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="sugarqueen"][data-assault-on] .lg-p1 .lg-sugarqueen-arml, .lg-boss[data-motif="sugarqueen"][data-moment="hurt"] .lg-p1 .lg-sugarqueen-arml { animation-name: lgrSqChop }
.lg-boss[data-motif="sugarqueen"][data-assault-on] .lg-p3 .lg-sugarqueen-arml, .lg-boss[data-motif="sugarqueen"][data-moment="hurt"] .lg-p3 .lg-sugarqueen-arml { animation-name: lgrSqShove }
.lg-boss[data-motif="sugarqueen"][data-assault-on] .lg-sugarqueen-armr, .lg-boss[data-motif="sugarqueen"][data-moment="hurt"] .lg-sugarqueen-armr { animation: lgrSqShove 900ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="sugarqueen"][data-assault-on] .lg-p3 .lg-sugarqueen-armr, .lg-boss[data-motif="sugarqueen"][data-moment="hurt"] .lg-p3 .lg-sugarqueen-armr { animation-name: lgrSqFlick }
.lg-boss[data-motif="sugarqueen"][data-assault-on] .lg-sugarqueen-head, .lg-boss[data-motif="sugarqueen"][data-moment="hurt"] .lg-sugarqueen-head { animation: lgrSqHeadStrike 900ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="sugarqueen"][data-assault-on] .lg-sugarqueen-crown, .lg-boss[data-motif="sugarqueen"][data-moment="hurt"] .lg-sugarqueen-crown { animation: lgrSqCrownRock 900ms ease-out both }
.lg-boss[data-motif="sugarqueen"][data-assault-on] .lg-sugarqueen-jar, .lg-boss[data-motif="sugarqueen"][data-moment="hurt"] .lg-sugarqueen-jar { animation: lgrSqJarHop 900ms ease-out both }

/* Phase 2: the cocked scepter arm is drawn behind her head, so its pitch stays left of it and comes at the camera. */
@keyframes lgrSqPitch { 0% { transform: none } 11% { transform: rotate(-16deg) } 17% { transform: rotate(-18deg) scale(1.02) }
  26% { transform: rotate(16deg) translate(-2px, 3px) scale(1.34) } 33% { transform: rotate(12deg) translate(-2px, 3px) scale(1.27) } 40% { transform: rotate(14deg) translate(-2px, 3px) scale(1.3) } 66% { transform: rotate(6deg) scale(1.1) } 100% { transform: none } }
@keyframes lgrSqPitchHeavy { 0% { transform: rotate(-16deg) } 16% { transform: rotate(-28deg) translateY(-3px) } 20% { transform: rotate(-29deg) translateY(-3px) }
  29% { transform: rotate(20deg) translate(-3px, 5px) scale(1.5) } 34% { transform: rotate(15deg) translate(-3px, 5px) scale(1.4) } 39% { transform: rotate(18deg) translate(-3px, 5px) scale(1.45) } 70% { transform: rotate(8deg) scale(1.15) } 100% { transform: none } }
.lg-boss[data-motif="sugarqueen"][data-assault-on] .lg-p2 .lg-sugarqueen-arml, .lg-boss[data-motif="sugarqueen"][data-moment="hurt"] .lg-p2 .lg-sugarqueen-arml { animation-name: lgrSqPitch }

/* HER HEAVY BLOW (data-moment="hurtBig", 100 ms in, from the drawn-back pose): a full tantrum: she winds up higher
   and slams everything at you twice as hard, the head drives in, the crown jumps off her head and lands crooked. */
@keyframes lgrSqThrowHeavy { 0% { transform: rotate(-16deg) } 16% { transform: rotate(-28deg) translateY(-3px) } 20% { transform: rotate(-29deg) translateY(-3px) }
  29% { transform: rotate(48deg) scale(1.34) } 34% { transform: rotate(40deg) scale(1.26) } 39% { transform: rotate(45deg) scale(1.3) } 70% { transform: rotate(18deg) scale(1.1) } 100% { transform: none } }
@keyframes lgrSqChopHeavy { 0% { transform: rotate(10deg) translateY(-3px) } 16% { transform: rotate(18deg) translateY(-6px) } 20% { transform: rotate(19deg) translateY(-6px) }
  29% { transform: rotate(-34deg) translateY(4px) scale(1.5) } 34% { transform: rotate(-28deg) translateY(4px) scale(1.4) } 39% { transform: rotate(-32deg) translateY(4px) scale(1.45) } 70% { transform: rotate(-12deg) scale(1.15) } 100% { transform: none } }
@keyframes lgrSqShoveHeavy { 0% { transform: rotate(12deg) translate(-2px, 1px) } 18% { transform: rotate(20deg) translate(-4px, 1px) } 29% { transform: rotate(-30deg) translate(4px, -3px) scale(1.32) }
  38% { transform: rotate(-24deg) translate(3px, -2px) scale(1.25) } 100% { transform: none } }
@keyframes lgrSqFlickHeavy { 0% { transform: rotate(-9deg) } 18% { transform: rotate(-14deg) } 29% { transform: rotate(34deg) translate(4px, 3px) scale(1.3) } 38% { transform: rotate(28deg) translate(3px, 2px) scale(1.22) } 100% { transform: none } }
@keyframes lgrSqHeadHeavy { 0% { transform: rotate(-7deg) translateY(-2px) } 18% { transform: rotate(-11deg) translateY(-4px) } 29% { transform: rotate(9deg) translate(3px, 5px) scale(1.13) }
  38% { transform: rotate(6deg) translate(2px, 4px) scale(1.09) } 70% { transform: rotate(2deg) scale(1.03) } 100% { transform: none } }
@keyframes lgrSqCrownHeavy { 0% { transform: rotate(-8deg) } 18% { transform: rotate(-12deg) } 30% { transform: translateY(-12px) rotate(26deg) } 46% { transform: translateY(0) rotate(-14deg) } 58% { transform: rotate(-9deg) } 100% { transform: none } }
.lg-boss[data-motif="sugarqueen"][data-moment="hurtBig"] .lg-sugarqueen-arml { animation: lgrSqThrowHeavy 1150ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="sugarqueen"][data-moment="hurtBig"] .lg-p1 .lg-sugarqueen-arml { animation-name: lgrSqChopHeavy }
.lg-boss[data-motif="sugarqueen"][data-moment="hurtBig"] .lg-p3 .lg-sugarqueen-arml { animation-name: lgrSqShoveHeavy }
.lg-boss[data-motif="sugarqueen"][data-moment="hurtBig"] .lg-p2 .lg-sugarqueen-arml { animation-name: lgrSqPitchHeavy }
.lg-boss[data-motif="sugarqueen"][data-moment="hurtBig"] .lg-sugarqueen-armr { animation: lgrSqShoveHeavy 1150ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="sugarqueen"][data-moment="hurtBig"] .lg-p3 .lg-sugarqueen-armr { animation-name: lgrSqFlickHeavy }
.lg-boss[data-motif="sugarqueen"][data-moment="hurtBig"] .lg-sugarqueen-head { animation: lgrSqHeadHeavy 1150ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="sugarqueen"][data-moment="hurtBig"] .lg-sugarqueen-crown { animation: lgrSqCrownHeavy 1150ms ease-out both }

/* HIT: her head is knocked aside (a gasp), the crown jolts, the hands flinch in. */
@keyframes lgrSqHeadHit { 0% { transform: none } 12% { transform: rotate(-16deg) translate(-4px, -2px) scale(.97) } 30% { transform: rotate(5deg) } 50% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgrSqCrownHit { 0% { transform: none } 12% { transform: rotate(-22deg) translate(-2px, -4px) } 34% { transform: rotate(9deg) } 56% { transform: rotate(-3deg) } 100% { transform: none } }
@keyframes lgrSqFlinchR { 0% { transform: none } 14% { transform: rotate(-12deg) translate(-2px, 2px) scale(.94) } 60% { transform: rotate(-5deg) } 100% { transform: none } }
.lg-boss[data-motif="sugarqueen"][data-moment="hit"] .lg-sugarqueen-head { animation: lgrSqHeadHit 700ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="sugarqueen"][data-moment="hit"] .lg-sugarqueen-crown { animation: lgrSqCrownHit 700ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="sugarqueen"][data-moment="hit"] .lg-sugarqueen-armr { animation: lgrSqFlinchR 700ms ease-out both }

/* CRIT: the crown is knocked clean off and pirouettes in the air before dropping back on; her head whips, both arms
   fly out, the jar jumps. */
@keyframes lgrSqCrownCrit { 0% { transform: none } 10% { transform: translate(4px, -14px) rotate(50deg) } 32% { transform: translate(6px, -26px) rotate(200deg) scale(.95) }
  54% { transform: translate(1px, -6px) rotate(345deg) } 60% { transform: rotate(372deg) } 70% { transform: translateY(-2px) rotate(352deg) } 82% { transform: rotate(362deg) } 100% { transform: rotate(360deg) } }
@keyframes lgrSqHeadCrit { 0% { transform: none } 10% { transform: rotate(-16deg) translate(-4px, -2px) scale(.95) } 28% { transform: rotate(6deg) } 46% { transform: rotate(-3deg) } 100% { transform: none } }
@keyframes lgrSqArmCritL { 0% { transform: none } 10% { transform: rotate(-18deg) } 36% { transform: rotate(6deg) } 60% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgrSqArmCritR { 0% { transform: none } 10% { transform: rotate(18deg) } 36% { transform: rotate(-6deg) } 60% { transform: rotate(2deg) } 100% { transform: none } }
.lg-boss[data-motif="sugarqueen"][data-moment="crit"] .lg-sugarqueen-crown { transform-origin: 50% 50%; animation: lgrSqCrownCrit 1000ms cubic-bezier(.3,.7,.4,1) both }
.lg-boss[data-motif="sugarqueen"][data-moment="crit"] .lg-sugarqueen-head { animation: lgrSqHeadCrit 1000ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="sugarqueen"][data-moment="crit"] .lg-sugarqueen-arml { animation: lgrSqArmCritL 1000ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="sugarqueen"][data-moment="crit"] .lg-sugarqueen-armr { animation: lgrSqArmCritR 1000ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="sugarqueen"][data-moment="crit"] .lg-sugarqueen-jar { animation: lgrSqJarHop 1000ms ease-out both }

/* SHARPEN: a honed cut through the sugar: the head is snapped one way then the other, the crown spins on its band
   like spun sugar, the hands jerk. */
@keyframes lgrSqHeadSharpen { 0% { transform: none } 8% { transform: translateX(-4px) rotate(-7deg) } 20% { transform: translateX(1px) } 30% { transform: translateX(4px) rotate(7deg) } 46% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgrSqCrownSpin { 0% { transform: none } 8% { transform: scaleX(-1) } 18% { transform: scaleX(1) rotate(-6deg) } 30% { transform: scaleX(-1) rotate(8deg) } 42% { transform: scaleX(1) } 60% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgrSqJerk { 0% { transform: none } 8% { transform: rotate(-8deg) } 30% { transform: rotate(8deg) } 50% { transform: none } 100% { transform: none } }
.lg-boss[data-motif="sugarqueen"][data-moment="sharpen"] .lg-sugarqueen-head { animation: lgrSqHeadSharpen 760ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="sugarqueen"][data-moment="sharpen"] .lg-sugarqueen-crown { animation: lgrSqCrownSpin 760ms linear both }
.lg-boss[data-motif="sugarqueen"][data-moment="sharpen"] :is(.lg-sugarqueen-arml, .lg-sugarqueen-armr) { animation: lgrSqJerk 760ms ease-out both }

/* BLOCK: her throw is parried: the arm lunges, is knocked back past her shoulder and she shakes the sting out of it,
   head snapping back in outrage. */
@keyframes lgrSqArmBlock { 0% { transform: none } 14% { transform: rotate(24deg) scale(1.12) } 22% { transform: rotate(25deg) scale(1.12) } 32% { transform: rotate(-24deg) scale(.96) }
  44% { transform: rotate(-10deg) } 52% { transform: rotate(-16deg) } 60% { transform: rotate(-6deg) } 76% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgrSqArmBlockP1 { 0% { transform: none } 14% { transform: rotate(-20deg) scale(1.25) } 22% { transform: rotate(-21deg) scale(1.25) } 32% { transform: rotate(14deg) translateY(-3px) scale(.96) }
  44% { transform: rotate(5deg) } 52% { transform: rotate(10deg) } 60% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgrSqHeadBlock { 0% { transform: none } 14% { transform: rotate(4deg) translateY(1px) } 32% { transform: rotate(-11deg) translate(-3px, -2px) } 56% { transform: rotate(3deg) } 100% { transform: none } }
.lg-boss[data-motif="sugarqueen"][data-moment="block"] .lg-sugarqueen-arml { animation: lgrSqArmBlock 800ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="sugarqueen"][data-moment="block"] .lg-p1 .lg-sugarqueen-arml { animation-name: lgrSqArmBlockP1 }
.lg-boss[data-motif="sugarqueen"][data-moment="block"] .lg-p3 .lg-sugarqueen-armr { animation: lgrSqArmBlock 800ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="sugarqueen"][data-moment="block"] .lg-sugarqueen-head { animation: lgrSqHeadBlock 800ms ease-out both }

/* SHIELD: her sweets glance off the dome: the throwing hand overreaches and she stumbles after it, crown sliding. */
@keyframes lgrSqOverreach { 0% { transform: none } 14% { transform: rotate(10deg) } 26% { transform: rotate(-18deg) scale(1.1) } 40% { transform: rotate(-30deg) translateY(3px) scale(1.06) } 64% { transform: rotate(-10deg) } 100% { transform: none } }
@keyframes lgrSqOverreachP3 { 0% { transform: none } 14% { transform: rotate(-8deg) } 26% { transform: rotate(18deg) scale(1.1) } 40% { transform: rotate(32deg) translate(3px, 3px) scale(1.06) } 64% { transform: rotate(10deg) } 100% { transform: none } }
@keyframes lgrSqHeadShield { 0% { transform: none } 26% { transform: rotate(4deg) } 40% { transform: rotate(9deg) translate(3px, 3px) } 64% { transform: rotate(-3deg) } 100% { transform: none } }
@keyframes lgrSqCrownSlide { 0% { transform: none } 40% { transform: rotate(16deg) translate(3px, 2px) } 66% { transform: rotate(14deg) translate(3px, 2px) } 78% { transform: rotate(-4deg) translateY(-2px) } 100% { transform: none } }
.lg-boss[data-motif="sugarqueen"][data-moment="shield"] .lg-sugarqueen-armr { animation: lgrSqOverreach 820ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="sugarqueen"][data-moment="shield"] .lg-p3 .lg-sugarqueen-armr { animation-name: lgrSqOverreachP3 }
.lg-boss[data-motif="sugarqueen"][data-moment="shield"] .lg-sugarqueen-head { animation: lgrSqHeadShield 820ms ease-out both }
.lg-boss[data-motif="sugarqueen"][data-moment="shield"] .lg-sugarqueen-crown { animation: lgrSqCrownSlide 820ms ease-out both }

/* SECOND WIND: you got back up: a royal huff: she tosses her head away, both hands drop to her sides, the jar rattles. */
@keyframes lgrSqHeadHuff { 0% { transform: none } 18% { transform: rotate(14deg) translateY(-3px) } 70% { transform: rotate(12deg) translateY(-2px) } 100% { transform: none } }
@keyframes lgrSqDropL { 0% { transform: none } 20% { transform: rotate(-12deg) translateY(4px) } 72% { transform: rotate(-10deg) translateY(4px) } 100% { transform: none } }
@keyframes lgrSqDropR { 0% { transform: none } 20% { transform: rotate(12deg) translateY(4px) } 72% { transform: rotate(10deg) translateY(4px) } 100% { transform: none } }
@keyframes lgrSqJarRattle { 0% { transform: none } 20% { transform: rotate(-9deg) } 30% { transform: rotate(8deg) } 40% { transform: rotate(-7deg) } 50% { transform: rotate(5deg) } 60% { transform: none } 100% { transform: none } }
.lg-boss[data-motif="sugarqueen"][data-moment="wind"] .lg-sugarqueen-head { animation: lgrSqHeadHuff 900ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="sugarqueen"][data-moment="wind"] .lg-sugarqueen-arml { animation: lgrSqDropL 900ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="sugarqueen"][data-moment="wind"] .lg-sugarqueen-armr { animation: lgrSqDropR 900ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="sugarqueen"][data-moment="wind"] .lg-sugarqueen-jar { animation: lgrSqJarRattle 900ms linear both }

/* KNOCKOUT, MELTED: she reels, then wilts like warm sugar: the head sags far over, the arms droop and hang, the crown
   slides off her hair and falls, the jar topples. */
@keyframes lgrSqHeadKo { 0% { transform: none } 12% { transform: rotate(-10deg) translateY(-3px) } 30% { transform: rotate(5deg) } 44% { transform: rotate(-3deg) }
  66% { transform: rotate(18deg) translateY(9px) scale(1.02, .94) } 100% { transform: rotate(22deg) translateY(12px) scale(1.03, .92) } }
@keyframes lgrSqCrownKo { 0% { transform: none } 10% { transform: translateY(-4px) rotate(-10deg) } 30% { transform: translateY(-10px) rotate(30deg) } 52% { transform: translate(10px, 10px) rotate(110deg) }
  70% { transform: translate(16px, 40px) rotate(170deg) } 78% { transform: translate(16px, 36px) rotate(162deg) } 100% { transform: translate(17px, 40px) rotate(166deg) } }
@keyframes lgrSqArmKoL { 0% { transform: none } 12% { transform: rotate(-10deg) } 40% { transform: rotate(-4deg) } 66% { transform: rotate(-26deg) translateY(10px) } 100% { transform: rotate(-30deg) translateY(12px) } }
@keyframes lgrSqArmKoR { 0% { transform: none } 12% { transform: rotate(10deg) } 40% { transform: rotate(4deg) } 66% { transform: rotate(26deg) translateY(10px) } 100% { transform: rotate(30deg) translateY(12px) } }
@keyframes lgrSqJarKo { 0% { transform: none } 50% { transform: none } 64% { transform: rotate(-30deg) } 72% { transform: rotate(-84deg) translateX(-2px) } 78% { transform: rotate(-80deg) } 100% { transform: rotate(-84deg) translateX(-2px) } }
.lg-boss[data-motif="sugarqueen"][data-moment="ko"] .lg-sugarqueen-head { animation: lgrSqHeadKo 2300ms ease-in-out both }
.lg-boss[data-motif="sugarqueen"][data-moment="ko"] .lg-sugarqueen-crown { animation: lgrSqCrownKo 2300ms cubic-bezier(.4,0,.6,1) both }
.lg-boss[data-motif="sugarqueen"][data-moment="ko"] .lg-sugarqueen-arml { animation: lgrSqArmKoL 2300ms ease-in-out both }
.lg-boss[data-motif="sugarqueen"][data-moment="ko"] .lg-sugarqueen-armr { animation: lgrSqArmKoR 2300ms ease-in-out both }
.lg-boss[data-motif="sugarqueen"][data-moment="ko"] .lg-sugarqueen-jar { animation: lgrSqJarKo 2300ms ease-in both }

/* THE ABILITIES on her own parts (after the strike rules: an ability's own reaction wins on a part both touch). */
/* cube: a sugar cube clinks into her jar: the jar hops, she gives it a satisfied little nod. */
@keyframes lgrSqHeadNod { 0% { transform: none } 40% { transform: rotate(4deg) translateY(2px) } 100% { transform: none } }
@keyframes lgrSqJarClink { 0% { transform: none } 30% { transform: translateY(3px) scale(1.1, .88) } 60% { transform: translateY(-2px) scale(.96, 1.06) } 100% { transform: none } }
@keyframes lgrSqJarArmClink { 0% { transform: none } 30% { transform: rotate(6deg) translateY(2px) } 60% { transform: rotate(-3deg) } 100% { transform: none } }
.lg-boss[data-motif="sugarqueen"][data-fx="cube"] .lg-sugarqueen-head { animation: lgrSqHeadNod 340ms ease-out both }
.lg-boss[data-motif="sugarqueen"][data-fx="cube"] .lg-sugarqueen-jar { animation: lgrSqJarClink 340ms ease-out both }
.lg-boss[data-motif="sugarqueen"][data-fx="cube"] .lg-p1 .lg-sugarqueen-armr { animation: lgrSqJarArmClink 340ms ease-out both }
/* rush: the Sugar Rush: she blows a kiss: the free hand sweeps up to her lips and out at you, the head tilts in, the
   jar (or pendant) swells with sugar. */
@keyframes lgrSqKiss { 0% { transform: none } 20% { transform: rotate(-24deg) translateY(-3px) } 40% { transform: rotate(-26deg) translateY(-3px) } 56% { transform: rotate(16deg) scale(1.16) } 76% { transform: rotate(10deg) scale(1.08) } 100% { transform: none } }
@keyframes lgrSqKissP3 { 0% { transform: none } 20% { transform: rotate(-16deg) } 40% { transform: rotate(-18deg) } 56% { transform: rotate(18deg) scale(1.16) } 76% { transform: rotate(10deg) scale(1.08) } 100% { transform: none } }
@keyframes lgrSqHeadKiss { 0% { transform: none } 20% { transform: rotate(-6deg) } 56% { transform: rotate(6deg) translate(2px, 2px) scale(1.05) } 80% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgrSqJarSwell { 0% { transform: none } 30% { transform: scale(1.18) } 45% { transform: scale(1.06) } 60% { transform: scale(1.2) } 100% { transform: none } }
.lg-boss[data-motif="sugarqueen"][data-fx="rush"] .lg-sugarqueen-armr { animation: lgrSqKiss 1000ms cubic-bezier(.3,.6,.4,1) both }
.lg-boss[data-motif="sugarqueen"][data-fx="rush"] .lg-p3 .lg-sugarqueen-armr { animation-name: lgrSqKissP3 }
.lg-boss[data-motif="sugarqueen"][data-fx="rush"] .lg-sugarqueen-head { animation: lgrSqHeadKiss 1000ms cubic-bezier(.3,.6,.4,1) both }
.lg-boss[data-motif="sugarqueen"][data-fx="rush"] .lg-sugarqueen-jar { animation: lgrSqJarSwell 1000ms ease-in-out both }
/* sweet: a boosted hit in the rush: she giggles, a quick head bob and a twirl of the scepter (or a hip pop). */
@keyframes lgrSqGiggle { 0% { transform: none } 20% { transform: rotate(-5deg) translateY(-1px) } 40% { transform: rotate(4deg) } 60% { transform: rotate(-3deg) translateY(-1px) } 100% { transform: none } }
@keyframes lgrSqTwirl { 0% { transform: none } 30% { transform: rotate(-12deg) } 65% { transform: rotate(6deg) } 100% { transform: none } }
.lg-boss[data-motif="sugarqueen"][data-fx="sweet"] .lg-sugarqueen-head { animation: lgrSqGiggle 340ms ease-out both }
.lg-boss[data-motif="sugarqueen"][data-fx="sweet"] .lg-sugarqueen-arml { animation: lgrSqTwirl 340ms ease-out both }
/* crash: her rush shatters: she pouts: the head drops and turns away, the arms fall slack, the crown slips. */
@keyframes lgrSqHeadPout { 0% { transform: none } 22% { transform: rotate(-12deg) translateY(4px) } 70% { transform: rotate(-10deg) translateY(4px) } 100% { transform: none } }
@keyframes lgrSqSlackL { 0% { transform: none } 22% { transform: rotate(-14deg) translateY(4px) } 70% { transform: rotate(-12deg) translateY(4px) } 100% { transform: none } }
@keyframes lgrSqSlackR { 0% { transform: none } 22% { transform: rotate(14deg) translateY(4px) } 70% { transform: rotate(12deg) translateY(4px) } 100% { transform: none } }
@keyframes lgrSqCrownSlip { 0% { transform: none } 24% { transform: rotate(-18deg) translate(-3px, 2px) } 70% { transform: rotate(-16deg) translate(-3px, 2px) } 100% { transform: none } }
.lg-boss[data-motif="sugarqueen"][data-fx="crash"] .lg-sugarqueen-head { animation: lgrSqHeadPout 800ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-motif="sugarqueen"][data-fx="crash"] .lg-sugarqueen-arml { animation: lgrSqSlackL 800ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-motif="sugarqueen"][data-fx="crash"] .lg-sugarqueen-armr { animation: lgrSqSlackR 800ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-motif="sugarqueen"][data-fx="crash"] .lg-sugarqueen-crown { animation: lgrSqCrownSlip 800ms cubic-bezier(.22,1,.36,1) both }
`,
}
