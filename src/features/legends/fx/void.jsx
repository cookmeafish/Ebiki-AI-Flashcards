// What the void raid ability (horizon: Event Horizon) LOOKS like. The fx contract is in fx/index.js, the juice in
// fx/_juice.js. Fixed bright colors (never theme tokens over the art).
import { center, anim, around, ring } from './_kit'

const VIOLET = '#b26bff'
const HOT = '#f3e6ff'

export default {
  effects: {
    // Absorb (tick): the strike's sparks curve into an orbit around the boss.
    absorb: () => <>
      <div className="lgx" style={{ ...center, width: '74%', height: '74%', animation: anim('lgrVoidFxOrbit', 340, 0, 'ease-in') }}>
        {[0, 72, 144, 216, 288].map((a) => <div key={a} style={{ position: 'absolute', left: '50%', top: '50%', width: 11, height: 11, marginLeft: -5.5, marginTop: -5.5, borderRadius: '50%', background: HOT, boxShadow: `0 0 0 1.5px #1a0830, 0 0 10px ${VIOLET}, -10px 0 8px -2px ${VIOLET}`, transform: `rotate(${a}deg) translateY(-40px)` }} />)}
      </div>
      {/* the event horizon itself: a black lens with a violet rim swells round it */}
      <div className="lgx" style={{ ...center, width: 110, height: 110, borderRadius: '50%', border: `5px solid ${VIOLET}`, boxShadow: `0 0 0 3px #1a0830, 0 0 16px ${VIOLET}, inset 0 0 18px ${VIOLET}`, '--s': 1.3, animation: anim('lgxRing', 340) }} />
    </>,
    // Spill (medium): the ring flickers and drops its sparks into the bar.
    spill: () => <>
      <div className="lgx" style={{ ...center, width: '80%', height: '80%', borderRadius: '50%', border: `4px dashed ${VIOLET}`, boxShadow: `0 0 12px ${VIOLET}`, animation: anim('lgrVoidFxFlicker', 700) }} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <div key={i} className="lgx" style={{ left: `${18 + i * 9}%`, top: `${22 + (i % 3) * 10}%`, width: 6, height: 6, borderRadius: '50%', background: i % 2 ? HOT : VIOLET, boxShadow: `0 0 6px ${VIOLET}`, '--spin': '0deg', animation: anim('lgxFall', 700, 120 + i * 35, 'ease-in') }} />)}
    </>,
    // Collapse (big): the arena pulls into a pinpoint, then a violet-white jet bursts through the boss with debris.
    collapse: () => <>
      <div className="lgx" style={{ ...center, width: '130%', height: '130%', borderRadius: '50%', background: `radial-gradient(circle, #000 0 16%, ${VIOLET} 30%, rgba(178,107,255,.35) 48%, transparent 66%)`, animation: anim('lgxVortex', 600, 0, 'ease-in') }} />
      <div className="lgx" style={{ ...center, width: 26, height: '160%', marginLeft: -13, marginTop: '-80%', borderRadius: 13, background: `linear-gradient(to bottom, transparent, ${VIOLET} 20%, #ffffff 50%, ${VIOLET} 80%, transparent)`, boxShadow: `0 0 24px ${VIOLET}`, animation: anim('lgrVoidFxJet', 600, 560) }} />
      <div className="lgx lgx-full" style={{ background: HOT, borderRadius: '50%', mixBlendMode: 'screen', opacity: 0, animation: anim('lgrVoidFxBloom', 420, 560) }} />
      {around(20, (i, a) => <div key={i} className="lgx" style={{ ...center, width: 6 + (i % 3) * 3, height: 6 + (i % 3) * 3, background: i % 2 ? HOT : VIOLET, borderRadius: i % 3 ? 2 : '50%', boxShadow: `0 0 6px ${VIOLET}`, '--a': `${a + i * 9}deg`, '--d': `${-100 - (i % 4) * 14}px`, '--spin': `${(i % 2 ? 1 : -1) * 260}deg`, animation: anim('lgxShard', 650, 580) }} />)}
      {ring(HOT, 580, 2.4, 5, 600)}
    </>,
  },
  floaters: { absorb: 'lg_fx_absorb', spill: 'lg_fx_spill', collapse: 'lg_fx_collapse' },
  floaterTone: { absorb: 'purple', spill: 'purple', collapse: 'purple' },
  juice: {
    absorb: { size: 'tick' },
    spill: { size: 'medium', shake: 1, sfx: 'void.spill' },
    collapse: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'void.collapse' },
  },
  css: `
@keyframes lgrVoidFxOrbit { 0% { transform: translate(-50%, -50%) rotate(0) scale(1.2); opacity: 0 } 25% { opacity: 1 } 100% { transform: translate(-50%, -50%) rotate(300deg) scale(.7); opacity: 0 } }
@keyframes lgrVoidFxFlicker { 0% { transform: translate(-50%, -50%) rotate(0); opacity: 0 } 10% { opacity: 1 } 20% { opacity: .2 } 30% { opacity: 1 } 42% { opacity: .3 } 55% { opacity: 1 } 100% { transform: translate(-50%, -50%) rotate(90deg) scale(.9); opacity: 0 } }
@keyframes lgrVoidFxJet { 0% { transform: scaleY(0) scaleX(.4); opacity: 0 } 20% { transform: scaleY(1) scaleX(1.4); opacity: 1 } 60% { opacity: 1 } 100% { transform: scaleY(1.1) scaleX(.2); opacity: 0 } }
@keyframes lgrVoidFxBloom { 0% { opacity: 0 } 15% { opacity: .35 } 100% { opacity: 0 } }
@keyframes lgrVoidPull { 0%, 100% { transform: none } 45% { transform: scale(.93) rotate(-4deg) } 80% { transform: scale(.99) } }
@keyframes lgrVoidHiccup { 0%, 100% { transform: none } 20% { transform: scale(1.1, .88) } 40% { transform: scale(.98, 1.03) } 60% { transform: scale(1.07, .92) } 80% { transform: none } }
@keyframes lgrVoidImplode { 0% { transform: none } 45% { transform: scale(.85) rotate(8deg) } 70% { transform: scale(1.12) rotate(-2deg) } 85% { transform: scale(.98) } 100% { transform: none } }
.lgr-void-absorb { animation: lgrVoidPull 320ms ease-in-out both }
.lgr-void-spill { transform-origin: 50% 100%; animation: lgrVoidHiccup 500ms ease-out both }
.lgr-void-collapse { animation: lgrVoidImplode 1100ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-phase="3"] .lgr-void-collapse { animation-duration: 1180ms }
/* THE ATTACK ON THE PLAYER (impact/assault.js orb + drain; data-assault-on, the orb leaves at 120 ms and lands near
   520 ms): it rears back, its tentacles reach out toward your heart and the maw gapes, then it GULPS the light down in
   hard swallows while the ring tilts toward you. Inner wrappers (-faceA/-ringA/-tendrilLA/-tendrilRA). */
@keyframes lgrVoidGulp { 0% { transform: none } 7% { transform: scale(.9) } 22% { transform: translateX(3%) scale(1.14, 1.24) } 38% { transform: translateX(3%) scale(1.04, 1.06) } 48% { transform: translateX(3%) scale(1.14, 1.22) } 60% { transform: translateX(2%) scale(1.03, 1.05) } 70% { transform: translateX(2%) scale(1.12, 1.18) } 82% { transform: scale(1.02) } 100% { transform: none } }
@keyframes lgrVoidTilt { 0% { transform: none } 7% { transform: rotate(8deg) } 24% { transform: rotate(-12deg) scale(1.1) } 70% { transform: rotate(-8deg) scale(1.05) } 100% { transform: none } }
@keyframes lgrVoidReachR { 0% { transform: none } 7% { transform: rotate(14deg) scale(.92) } 24% { transform: rotate(-26deg) scale(1.22) } 44% { transform: rotate(-12deg) scale(1.1) } 56% { transform: rotate(-22deg) scale(1.18) } 72% { transform: rotate(-6deg) } 100% { transform: none } }
@keyframes lgrVoidReachL { 0% { transform: none } 7% { transform: rotate(-10deg) } 26% { transform: rotate(14deg) scale(1.1) } 50% { transform: rotate(6deg) } 66% { transform: rotate(12deg) scale(1.06) } 100% { transform: none } }
.lg-boss[data-motif="void"][data-assault-on] .lg-void-faceA { animation: lgrVoidGulp 1550ms cubic-bezier(.3,.7,.3,1) both }
.lg-boss[data-motif="void"][data-assault-on] .lg-void-ringA { animation: lgrVoidTilt 1500ms cubic-bezier(.3,.7,.3,1) both }
.lg-boss[data-motif="void"][data-assault-on] .lg-void-tendrilRA { animation: lgrVoidReachR 1500ms cubic-bezier(.3,.7,.3,1) both }
.lg-boss[data-motif="void"][data-assault-on] .lg-void-tendrilLA { animation: lgrVoidReachL 1500ms cubic-bezier(.3,.7,.3,1) 60ms both }
/* THE ABILITY ON THE REAL PARTS: absorb = the ring swells and rocks as it takes the sparks in, the eye narrows greedily;
   spill = the ring buckles, the tentacles sag and the face winces as the sparks drop out; collapse = the sphere implodes
   and bursts, the tentacles fling wide, the face gapes in shock. */
@keyframes lgrVoidTakeIn { 0% { transform: none } 40% { transform: scale(1.14) rotate(-6deg) } 100% { transform: none } }
@keyframes lgrVoidGreed { 0%, 100% { transform: none } 40% { transform: scale(1.06, .82) } }
@keyframes lgrVoidBuckle { 0% { transform: none } 20% { transform: scale(1.05, .6) rotate(10deg) } 45% { transform: scale(.98, .85) rotate(-6deg) } 70% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgrVoidSagL { 0%, 100% { transform: none } 35% { transform: rotate(-16deg) } }
@keyframes lgrVoidSagR { 0%, 100% { transform: none } 35% { transform: rotate(16deg) } }
@keyframes lgrVoidWince { 0%, 100% { transform: none } 25% { transform: scale(.94, .82) translateY(2%) } }
@keyframes lgrVoidImplodeBody { 0% { transform: none } 30% { transform: scale(.62) } 42% { transform: scale(1.24) } 60% { transform: scale(.94) } 80% { transform: scale(1.03) } 100% { transform: none } }
@keyframes lgrVoidFlingL { 0% { transform: none } 30% { transform: rotate(-40deg) scale(.7) } 44% { transform: rotate(28deg) scale(1.2) } 70% { transform: rotate(-5deg) } 100% { transform: none } }
@keyframes lgrVoidFlingR { 0% { transform: none } 30% { transform: rotate(40deg) scale(.7) } 44% { transform: rotate(-28deg) scale(1.2) } 70% { transform: rotate(5deg) } 100% { transform: none } }
@keyframes lgrVoidShock { 0% { transform: none } 30% { transform: scale(.8) } 44% { transform: scale(1.2, 1.4) } 75% { transform: scale(1.06, 1.12) } 100% { transform: none } }
.lg-boss[data-motif="void"][data-fx="absorb"] .lg-void-ring { animation: lgrVoidTakeIn 340ms ease-out both }
.lg-boss[data-motif="void"][data-fx="absorb"] .lg-void-face { animation: lgrVoidGreed 340ms ease-out both }
.lg-boss[data-motif="void"][data-fx="spill"] .lg-void-ring { animation: lgrVoidBuckle 560ms ease-out both }
.lg-boss[data-motif="void"][data-fx="spill"] .lg-void-tendrilL { animation: lgrVoidSagL 560ms ease-out both }
.lg-boss[data-motif="void"][data-fx="spill"] .lg-void-tendrilR { animation: lgrVoidSagR 560ms ease-out both }
.lg-boss[data-motif="void"][data-fx="spill"] .lg-void-face { animation: lgrVoidWince 560ms ease-out both }
.lg-boss[data-motif="void"][data-fx="collapse"] .lg-void-body, .lg-boss[data-motif="void"][data-fx="collapse"] .lg-void-spikes { animation: lgrVoidImplodeBody 1100ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="void"][data-fx="collapse"] .lg-void-tendrilL { animation: lgrVoidFlingL 1100ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="void"][data-fx="collapse"] .lg-void-tendrilR { animation: lgrVoidFlingR 1100ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="void"][data-fx="collapse"] .lg-void-face { animation: lgrVoidShock 1100ms cubic-bezier(.4,0,.2,1) both }
`,
}
