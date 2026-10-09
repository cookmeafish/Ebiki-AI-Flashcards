// What the Dreamer's raid ability (sleep: Deep Sleep) LOOKS like. The fx contract is in fx/index.js, the juice numbers
// in fx/_juice.js, the design in design-v2.md section 20. Fixed colors: nightmare purple-black, wake red, lullaby
// pastels (never theme tokens). Also the one persistent idle reaction it is allowed: the slow sleep drift.
import { center, anim, around, flash } from './_kit'

const POP = 'cubic-bezier(.34,1.56,.64,1)'
const SETTLE = 'cubic-bezier(.22,1,.36,1)'
const DREAM = '#b48cff'
const NIGHT = '#2a0f3d'
const RED = '#ff3355'

// THE DRAWING ACTS IT OUT (impact/bosses/README.md): the Sleeper's own parts in raids/dreamer.svg move for every strike
// moment, its attack on you and Deep Sleep, keyed by the arena's data-moment / data-assault-on and .lgr-dreamer-<fx>.
// Parts (lg-dreamer-*, pivots set in the file): head, eyes (the eight eyes), tentout / tentin (the outer and inner
// tentacle beard), claws, bubbles (phase 1's dream bubbles), wingl / wingr (phase 2), and phase 3's split skull: halfl,
// halfr and the void between them. Here (not dreamer.parts.jsx) because this CSS is in the arena all fight long and its
// attack lands on ability blows too. Transforms and opacity only; it never wakes in a way that hides the face.
const B = '.lg-boss[data-motif="dreamer"]'
const on = (state, parts) => Object.entries(parts).map(([p, a]) => `${B}${state} .lg-dreamer-${p} { animation: ${a} }`).join('\n')
const DRAWING = `
@keyframes lgrDrTwitch { 0% { transform: none } 12% { transform: translateY(-3px) rotate(-4deg) } 30% { transform: translateY(1px) rotate(2deg) } 55% { transform: rotate(-1deg) } 100% { transform: none } }
@keyframes lgrDrCurl { 0%, 100% { transform: none } 14% { transform: scaleY(.8) } 45% { transform: scaleY(.92) } }
@keyframes lgrDrSqueeze { 0%, 100% { transform: none } 12% { transform: scale(1.1, .6) } 40% { transform: scale(1.05, .8) } }
@keyframes lgrDrRock { 0% { transform: none } 10% { transform: translate(-4px, -4px) rotate(-10deg) scale(.94) } 32% { transform: rotate(6deg) } 56% { transform: rotate(-3deg) } 80% { transform: rotate(1deg) } 100% { transform: none } }
@keyframes lgrDrFlail { 0%, 100% { transform: none } 10% { transform: scale(1.22, .85) } 24% { transform: scale(.9, 1.12) rotate(4deg) } 40% { transform: scale(1.08, .96) rotate(-3deg) } 60% { transform: none } }
@keyframes lgrDrPop { 0% { transform: none; opacity: 1 } 12% { transform: scale(1.4); opacity: 0 } 60% { transform: scale(.4); opacity: 0 } 100% { transform: none; opacity: 1 } }
@keyframes lgrDrSpreadL { 0%, 100% { transform: none } 12% { transform: rotate(-12deg) translateX(-3px) } 40% { transform: rotate(-5deg) } }
@keyframes lgrDrSpreadR { 0%, 100% { transform: none } 12% { transform: rotate(12deg) translateX(3px) } 40% { transform: rotate(5deg) } }
@keyframes lgrDrVoidBlink { 0%, 100% { transform: none } 12% { transform: scale(1.2, .2) } 40% { transform: scale(1.1, .5) } 60% { transform: none } }
@keyframes lgrDrSever { 0%, 100% { transform: none } 8% { transform: translateY(-6px) scaleY(.7) skewX(-8deg) } 22% { transform: translateY(-2px) scaleY(.9) skewX(5deg) } 40% { transform: skewX(-2deg) } 60% { transform: none } }
@keyframes lgrDrClawTwitch { 0%, 100% { transform: none } 10% { transform: translateY(-4px) scale(1.06, .94) } 26% { transform: translateY(1px) } 44% { transform: translateY(-2px) } 60% { transform: none } }
@keyframes lgrDrLash { 0% { transform: none } 18% { transform: translateY(-6px) scale(.9, .75) } 34% { transform: translateY(9px) scale(1.3, 1.5) } 56% { transform: translateY(6px) scale(1.18, 1.32) } 100% { transform: none } }
@keyframes lgrDrWhip { 0% { transform: none } 18% { transform: scale(.8, .9) } 34% { transform: scale(1.32, 1.22) rotate(5deg) } 50% { transform: scale(1.22, 1.14) rotate(-5deg) } 100% { transform: none } }
@keyframes lgrDrLurch { 0% { transform: none } 20% { transform: translateY(-5px) scale(.95) } 36% { transform: translateY(6px) scale(1.15) } 66% { transform: translateY(4px) scale(1.08) } 100% { transform: none } }
@keyframes lgrDrJawL { 0% { transform: none } 18% { transform: rotate(-10deg) } 34% { transform: rotate(14deg) translateX(4px) } 60% { transform: rotate(10deg) translateX(3px) } 100% { transform: none } }
@keyframes lgrDrJawR { 0% { transform: none } 18% { transform: rotate(10deg) } 34% { transform: rotate(-14deg) translateX(-4px) } 60% { transform: rotate(-10deg) translateX(-3px) } 100% { transform: none } }
@keyframes lgrDrReach { 0% { transform: none } 16% { transform: translateY(5px) scale(.92) } 32% { transform: translateY(-18px) scale(1.45) } 60% { transform: translateY(-14px) scale(1.35) } 100% { transform: none } }
@keyframes lgrDrSlit { 0%, 100% { transform: none } 20% { transform: scale(1.15, .35) } 40% { transform: scale(1.25, 1.2) } 70% { transform: scale(1.1, 1.05) } }
@keyframes lgrDrLeanIn { 0% { transform: none } 22% { transform: translateY(3px) scale(1.06) } 60% { transform: translateY(2px) scale(1.04) } 100% { transform: none } }
@keyframes lgrDrVoidStare { 0%, 100% { transform: none } 20% { transform: scale(.7) } 36% { transform: scale(1.45) } 64% { transform: scale(1.2) } }
@keyframes lgrDrWingSweepL { 0% { transform: none } 18% { transform: rotate(-14deg) } 34% { transform: rotate(16deg) } 60% { transform: rotate(10deg) } 100% { transform: none } }
@keyframes lgrDrWingSweepR { 0% { transform: none } 18% { transform: rotate(14deg) } 34% { transform: rotate(-16deg) } 60% { transform: rotate(-10deg) } 100% { transform: none } }
@keyframes lgrDrLoom { 0% { transform: none } 22% { transform: translateY(-5px) scale(.96) } 40% { transform: translateY(7px) scale(1.18) } 70% { transform: translateY(4px) scale(1.1) } 100% { transform: none } }
@keyframes lgrDrEyesFlare { 0%, 100% { transform: none } 30% { transform: scale(1.35) } 60% { transform: scale(1.2) } }
@keyframes lgrDrStorm { 0% { transform: none } 16% { transform: scale(.85, 1.1) } 30% { transform: scale(1.35, 1.2) rotate(4deg) } 44% { transform: scale(1.2, 1.1) rotate(-4deg) } 58% { transform: scale(1.3, 1.15) rotate(3deg) } 100% { transform: none } }
@keyframes lgrDrClawSlam { 0% { transform: none } 22% { transform: translateY(-12px) scale(1.12) } 38% { transform: translateY(3px) scale(1.25, .85) } 56% { transform: translateY(1px) scale(1.1, .95) } 100% { transform: none } }
@keyframes lgrDrGapeL { 0% { transform: none } 20% { transform: rotate(-22deg) translateX(-5px) } 38% { transform: rotate(16deg) translateX(5px) } 60% { transform: rotate(10deg) translateX(3px) } 100% { transform: none } }
@keyframes lgrDrGapeR { 0% { transform: none } 20% { transform: rotate(22deg) translateX(5px) } 38% { transform: rotate(-16deg) translateX(-5px) } 60% { transform: rotate(-10deg) translateX(-3px) } 100% { transform: none } }
@keyframes lgrDrRecoilUp { 0% { transform: none } 14% { transform: translateY(-5px) scaleY(.6) } 45% { transform: translateY(-3px) scaleY(.75) } 100% { transform: none } }
@keyframes lgrDrPullBack { 0% { transform: none } 14% { transform: translateY(-3px) scale(.92) } 45% { transform: translateY(-2px) scale(.95) } 100% { transform: none } }
@keyframes lgrDrClawsUp { 0% { transform: none } 14% { transform: translateY(-9px) rotate(-6deg) } 50% { transform: translateY(-7px) rotate(-4deg) } 100% { transform: none } }
@keyframes lgrDrFuss { 0%, 100% { transform: none } 12% { transform: rotate(-5deg) } 26% { transform: rotate(5deg) } 40% { transform: rotate(-4deg) } 54% { transform: rotate(3deg) } 70% { transform: none } }
@keyframes lgrDrWobble { 0%, 100% { transform: none } 15% { transform: scale(1.2, .85) } 30% { transform: scale(.88, 1.12) } 48% { transform: scale(1.06, .96) } 65% { transform: none } }
@keyframes lgrDrNodOff { 0% { transform: none } 40% { transform: translateY(7px) rotate(6deg) scale(.95) } 75% { transform: translateY(6px) rotate(5deg) scale(.96) } 100% { transform: none } }
@keyframes lgrDrDroop { 0%, 100% { transform: none } 40% { transform: scaleY(1.14) translateY(2px) } 75% { transform: scaleY(1.12) translateY(2px) } }
@keyframes lgrDrEyesCalm { 0%, 100% { transform: none } 40% { transform: scaleY(.55) } 75% { transform: scaleY(.6) } }
@keyframes lgrDrSettleL { 0%, 100% { transform: none } 40% { transform: rotate(-6deg) translateY(2px) } }
@keyframes lgrDrSettleR { 0%, 100% { transform: none } 40% { transform: rotate(6deg) translateY(2px) } }
@keyframes lgrDrKoHead { 0% { transform: none } 18% { transform: rotate(4deg) } 30% { transform: rotate(-4deg) } 46% { transform: translateY(-5px) scale(1.06) } 54% { transform: translateY(-7px) scale(1.1) } 74% { transform: translateY(14px) rotate(6deg) scale(.96) } 86% { transform: translateY(11px) rotate(4deg) scale(.96) } 100% { transform: translateY(12px) rotate(5deg) scale(.96) } }
@keyframes lgrDrKoTent { 0% { transform: none } 40% { transform: scale(1.1, .9) } 54% { transform: scale(1.25, 1.1) } 74% { transform: scaleY(1.3) translateY(6px) skewX(6deg) } 100% { transform: scaleY(1.25) translateY(5px) skewX(5deg) } }
@keyframes lgrDrKoEyes { 0%, 50% { transform: none } 56% { transform: scale(1.3) } 70%, 100% { transform: scale(1.1, .08) } }
@keyframes lgrDrKoBubbles { 0%, 30% { transform: none; opacity: 1 } 40% { transform: scale(1.5); opacity: 0 } 100% { transform: scale(1.5); opacity: 0 } }
@keyframes lgrDrKoClaws { 0%, 56% { transform: none } 76% { transform: translateY(10px) scale(1.06, .9) } 100% { transform: translateY(9px) scale(1.06, .9) } }
@keyframes lgrDrKoHalfL { 0%, 40% { transform: none } 54% { transform: rotate(8deg) } 76% { transform: rotate(-32deg) translate(-10px, 12px) } 100% { transform: rotate(-28deg) translate(-9px, 11px) } }
@keyframes lgrDrKoHalfR { 0%, 40% { transform: none } 54% { transform: rotate(-8deg) } 76% { transform: rotate(32deg) translate(10px, 12px) } 100% { transform: rotate(28deg) translate(9px, 11px) } }
@keyframes lgrDrKoVoid { 0% { transform: none; opacity: 1 } 50% { transform: scale(1.3); opacity: 1 } 62% { transform: scale(1.6); opacity: 1 } 78%, 100% { transform: scale(0); opacity: 0 } }
@keyframes lgrDrKoWingL { 0%, 54% { transform: none } 78%, 100% { transform: rotate(-30deg) translateY(10px) } }
@keyframes lgrDrKoWingR { 0%, 54% { transform: none } 78%, 100% { transform: rotate(30deg) translateY(10px) } }
${on('[data-moment="hit"]', { head: 'lgrDrTwitch 520ms ease-out', tentin: 'lgrDrCurl 520ms ease-out', eyes: 'lgrDrSqueeze 520ms ease-out', void: 'lgrDrVoidBlink 520ms ease-out', halfl: 'lgrDrSpreadL 520ms ease-out', halfr: 'lgrDrSpreadR 520ms ease-out' })}
${on('[data-moment="crit"]', { head: 'lgrDrRock 820ms cubic-bezier(.2,.9,.3,1)', tentout: 'lgrDrFlail 820ms ease-out', tentin: 'lgrDrFlail 820ms ease-out 60ms', bubbles: 'lgrDrPop 900ms ease-out', halfl: 'lgrDrGapeL 820ms ease-out', halfr: 'lgrDrGapeR 820ms ease-out', void: 'lgrDrVoidBlink 820ms ease-out', wingl: 'lgrDrSpreadL 820ms ease-out', wingr: 'lgrDrSpreadR 820ms ease-out' })}
${on('[data-moment="sharpen"]', { tentin: 'lgrDrSever 760ms ease-out', tentout: 'lgrDrSever 760ms ease-out 50ms', eyes: 'lgrDrSqueeze 760ms ease-out', claws: 'lgrDrClawTwitch 760ms linear', halfl: 'lgrDrSpreadL 700ms ease-out', void: 'lgrDrVoidBlink 700ms ease-out' })}
${on('[data-moment="hurt"]', { tentin: 'lgrDrLash 820ms cubic-bezier(.3,1.3,.5,1)', tentout: 'lgrDrWhip 820ms cubic-bezier(.3,1.3,.5,1)', head: 'lgrDrLurch 820ms ease-out', halfl: 'lgrDrJawL 820ms cubic-bezier(.3,1.3,.5,1)', halfr: 'lgrDrJawR 820ms cubic-bezier(.3,1.3,.5,1)' })}
${on('[data-assault-on]', { claws: 'lgrDrReach 1000ms cubic-bezier(.3,1.3,.5,1)', eyes: 'lgrDrSlit 1000ms ease-out', void: 'lgrDrVoidStare 1000ms ease-out', wingl: 'lgrDrWingSweepL 1000ms ease-out', wingr: 'lgrDrWingSweepR 1000ms ease-out' })}
${on('[data-moment="hurtBig"]', { head: 'lgrDrLoom 1050ms cubic-bezier(.3,1.2,.5,1)', eyes: 'lgrDrEyesFlare 1000ms ease-out', tentout: 'lgrDrStorm 1050ms ease-out', tentin: 'lgrDrStorm 1050ms ease-out 80ms', claws: 'lgrDrClawSlam 1000ms cubic-bezier(.3,1.2,.5,1)', halfl: 'lgrDrGapeL 1050ms cubic-bezier(.3,1.2,.5,1)', halfr: 'lgrDrGapeR 1050ms cubic-bezier(.3,1.2,.5,1)', void: 'lgrDrVoidStare 1000ms ease-out' })}
${on('[data-moment="block"]', { tentin: 'lgrDrRecoilUp 700ms cubic-bezier(.2,.9,.3,1)', tentout: 'lgrDrRecoilUp 700ms cubic-bezier(.2,.9,.3,1) 40ms', head: 'lgrDrPullBack 700ms ease-out', claws: 'lgrDrClawsUp 700ms ease-out', halfl: 'lgrDrSettleL 700ms ease-out', halfr: 'lgrDrSettleR 700ms ease-out' })}
${on('[data-moment="shield"]', { head: 'lgrDrFuss 760ms ease-out', bubbles: 'lgrDrWobble 760ms ease-out', tentin: 'lgrDrCurl 760ms ease-out', void: 'lgrDrWobble 760ms ease-out' })}
${on('[data-moment="wind"]', { head: 'lgrDrNodOff 1100ms ease-in-out', tentin: 'lgrDrDroop 1100ms ease-in-out', tentout: 'lgrDrDroop 1100ms ease-in-out', eyes: 'lgrDrEyesCalm 1100ms ease-in-out', halfl: 'lgrDrSettleL 1100ms ease-in-out', halfr: 'lgrDrSettleR 1100ms ease-in-out' })}
${on('[data-moment="ko"]', { head: 'lgrDrKoHead 2100ms ease-in-out both', tentin: 'lgrDrKoTent 2100ms ease-in both', tentout: 'lgrDrKoTent 2100ms ease-in both', eyes: 'lgrDrKoEyes 2100ms ease-in both', bubbles: 'lgrDrKoBubbles 2100ms ease-out both', claws: 'lgrDrKoClaws 2100ms ease-in both', halfl: 'lgrDrKoHalfL 2100ms ease-in both', halfr: 'lgrDrKoHalfR 2100ms ease-in both', void: 'lgrDrKoVoid 2100ms ease-in both', wingl: 'lgrDrKoWingL 2100ms ease-in both', wingr: 'lgrDrKoWingR 2100ms ease-in both' })}
${B}[data-down] .lg-dreamer-head { transform: translateY(12px) rotate(5deg) scale(.96) }
${B}[data-down] .lg-dreamer-tentin, ${B}[data-down] .lg-dreamer-tentout { transform: scaleY(1.25) translateY(5px) skewX(5deg) }
${B}[data-down] .lg-dreamer-eyes { transform: scale(1.1, .08) }
${B}[data-down] .lg-dreamer-bubbles, ${B}[data-down] .lg-dreamer-void { opacity: 0 }
${B}[data-down] .lg-dreamer-claws { transform: translateY(9px) scale(1.06, .9) }
${B}[data-down] .lg-dreamer-halfl { transform: rotate(-28deg) translate(-9px, 11px) }
${B}[data-down] .lg-dreamer-halfr { transform: rotate(28deg) translate(9px, 11px) }
${B}[data-down] .lg-dreamer-wingl { transform: rotate(-30deg) translateY(10px) }
${B}[data-down] .lg-dreamer-wingr { transform: rotate(30deg) translateY(10px) }
/* Deep Sleep: deeper sinks the head and lifts the bubbles; its hum sways the beard; the NIGHTMARE makes every
   tentacle writhe while the claws clench and the split skull gapes; waking snaps the eyes wide and flares the beard;
   the lullaby curls everything in and lowers the head */
@keyframes lgrDrSinkHead { 0%, 100% { transform: none } 45% { transform: translateY(4px) scale(.98) } }
@keyframes lgrDrRise { 0%, 100% { transform: none } 50% { transform: translateY(-6px) scale(1.1) } }
@keyframes lgrDrSway { 0%, 100% { transform: none } 30% { transform: skewX(6deg) } 70% { transform: skewX(-5deg) } }
@keyframes lgrDrWrithe { 0%, 100% { transform: none } 12% { transform: skewX(12deg) scaleY(1.1) } 26% { transform: skewX(-12deg) scaleY(.9) } 40% { transform: skewX(10deg) scaleY(1.12) } 54% { transform: skewX(-9deg) scaleY(.92) } 70% { transform: skewX(5deg) } 85% { transform: none } }
@keyframes lgrDrClench { 0%, 100% { transform: none } 15% { transform: translateY(-6px) scale(1.12, .9) } 50% { transform: translateY(-4px) scale(1.1, .92) } }
@keyframes lgrDrWide { 0%, 100% { transform: none } 15% { transform: scale(1.4) } 45% { transform: scale(1.2) } }
@keyframes lgrDrStartleHead { 0% { transform: none } 14% { transform: translateY(-6px) scale(1.06) } 45% { transform: translateY(-2px) } 100% { transform: none } }
@keyframes lgrDrFlare { 0%, 100% { transform: none } 14% { transform: scale(1.25, .85) } 40% { transform: scale(1.1, .95) } }
@keyframes lgrDrCurlIn { 0%, 100% { transform: none } 40% { transform: scale(.85, .8) translateY(-2px) } 75% { transform: scale(.9, .85) } }
${B} .lgr-dreamer-deeper .lg-dreamer-head { animation: lgrDrSinkHead 300ms ease-out }
${B} .lgr-dreamer-deeper .lg-dreamer-bubbles, ${B} .lgr-dreamer-deeper .lg-dreamer-void { animation: lgrDrRise 300ms ease-out }
${B} .lgr-dreamer-hum .lg-dreamer-tentin, ${B} .lgr-dreamer-hum .lg-dreamer-tentout { animation: lgrDrSway 300ms ease-in-out }
${B} .lgr-dreamer-nightmare .lg-dreamer-tentin, ${B} .lgr-dreamer-nightmare .lg-dreamer-tentout { animation: lgrDrWrithe 1000ms ease-in-out }
${B} .lgr-dreamer-nightmare .lg-dreamer-claws { animation: lgrDrClench 1000ms ease-out }
${B} .lgr-dreamer-nightmare .lg-dreamer-halfl { animation: lgrDrGapeL 1000ms ease-out }
${B} .lgr-dreamer-nightmare .lg-dreamer-halfr { animation: lgrDrGapeR 1000ms ease-out }
${B} .lgr-dreamer-nightmare .lg-dreamer-wingl { animation: lgrDrWingSweepL 1000ms ease-out }
${B} .lgr-dreamer-nightmare .lg-dreamer-wingr { animation: lgrDrWingSweepR 1000ms ease-out }
${B} .lgr-dreamer-wake .lg-dreamer-eyes, ${B} .lgr-dreamer-wake .lg-dreamer-void { animation: lgrDrWide 600ms ease-out }
${B} .lgr-dreamer-wake .lg-dreamer-head { animation: lgrDrStartleHead 600ms ease-out }
${B} .lgr-dreamer-wake .lg-dreamer-tentin, ${B} .lgr-dreamer-wake .lg-dreamer-tentout { animation: lgrDrFlare 600ms ease-out }
${B} .lgr-dreamer-lullaby .lg-dreamer-tentin, ${B} .lgr-dreamer-lullaby .lg-dreamer-tentout { animation: lgrDrCurlIn 780ms ease-in-out }
${B} .lgr-dreamer-lullaby .lg-dreamer-head { animation: lgrDrNodOff 780ms ease-in-out }
${B} .lgr-dreamer-lullaby .lg-dreamer-halfl { animation: lgrDrSettleL 780ms ease-in-out }
${B} .lgr-dreamer-lullaby .lg-dreamer-halfr { animation: lgrDrSettleR 780ms ease-in-out }
`


// A giant eye over the arena: white, an iris of `iris`, a slit pupil.
const eye = (iris, name, ms, delay = 0) => (
  <div className="lgx" style={{ ...center, width: '96%', height: '46%', transform: 'translate(-50%, -50%)', borderRadius: '50%', background: `radial-gradient(circle, #0b0410 0 11%, ${iris} 13%, ${iris} 30%, #fff6fb 33%, #f4e6ff 62%, ${NIGHT} 70%)`, border: `3px solid ${NIGHT}`, boxShadow: `0 0 18px ${iris}`, animation: anim(name, ms, delay, 'linear') }} />
)

export default {
  effects: {
    // Deeper (tick): a dream bubble floats up out of it.
    deeper: () => <>
      {/* a thought bubble chain swells up out of its head, the last one holding a sleepy z */}
      {[0, 1, 2].map((i) => <div key={`t${i}`} className="lgx" style={{ left: `${58 + i * 9}%`, top: `${30 - i * 10}%`, width: 8 + i * 9, height: 8 + i * 9, marginLeft: -(4 + i * 4.5), borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #ffffff 0 20%, #e9dcff 55%, #c9b0ff)', border: `2px solid ${NIGHT}`, boxShadow: `0 0 8px ${DREAM}`, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 14, color: NIGHT, animation: anim('lgrDreamerBubble', 330, i * 60, POP) }}>{i === 2 ? 'z' : ''}</div>)}
      {[0, 1].map((i) => <div key={i} className="lgx" style={{ left: `${44 + i * 14}%`, top: '40%', width: 16 - i * 5, height: 16 - i * 5, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #ffffff 0 18%, rgba(214,190,255,.55) 45%, rgba(180,140,255,.25) 100%)', border: '1.5px solid #e9dcff', '--h': `${-46 - i * 10}px`, animation: anim('lgxRise', 340, i * 70) }} />)}
    </>,
    // Hum (tick, awake): a first lullaby note drifts up.
    hum: () => <>
      {/* a soft sound arc, and three notes bob up from its mouth */}
      <div className="lgx" style={{ left: '56%', top: '44%', width: 50, height: 50, borderRadius: '50%', border: '3px solid #9fe2ff', borderLeftColor: 'transparent', borderBottomColor: 'transparent', filter: 'drop-shadow(0 0 4px #9fe2ff)', '--s': 1.6, animation: anim('lgxRing', 330) }} />
      {['♪', '♫', '♪'].map((n, i) => <div key={i} className="lgx" style={{ left: `${52 + i * 9}%`, top: '42%', fontSize: 22 + (i % 2) * 6, fontWeight: 900, color: ['#9fe2ff', '#ffc4e8', '#fff3a8'][i], WebkitTextStroke: '1.5px #1a1020', '--h': `${-40 - i * 10}px`, animation: anim('lgxRise', 330, i * 50) }}>{n}</div>)}
    </>,
    // Nightmare (big): a purple-black ripple wipes in, giant eyelids snap open and shut, tendrils lash from the corners.
    nightmare: () => <>
      {flash(DREAM)}
      <div className="lgx" style={{ ...center, width: '140%', height: '140%', borderRadius: '50%', background: `radial-gradient(circle, rgba(42,15,61,.92) 0 38%, rgba(120,60,200,.55) 52%, transparent 68%)`, animation: anim('lgrDreamerRipple', 1150, 0, SETTLE) }} />
      {eye(DREAM, 'lgrDreamerLidSnap', 900, 150)}
      {[[-8, -8, 0, 'top left'], [108, -8, 90, 'top right'], [108, 108, 180, 'bottom right'], [-8, 108, 270, 'bottom left']].map(([x, y, r, o], i) => (
        <div key={i} className="lgx" style={{ left: `${x}%`, top: `${y}%`, width: '58%', height: '58%', transformOrigin: '0 0', '--r': `${r}deg`, animation: anim('lgrDreamerLash', 800, 120 + i * 70, 'ease-in-out') }}>
          <div style={{ width: '100%', height: '100%', borderTop: `7px solid ${NIGHT}`, borderRight: `4px solid ${DREAM}`, borderRadius: '0 100% 0 0', filter: `drop-shadow(0 0 4px ${DREAM})` }} />
        </div>
      ))}
    </>,
    // Wake (big): one huge red eye opens over the arena and blinks.
    wake: () => <>
      <div className="lgx lgx-full" style={{ borderRadius: '50%', background: `radial-gradient(circle, transparent 35%, rgba(255,51,85,.45) 70%)`, animation: anim('lgxVignette', 1100) }} />
      {eye(RED, 'lgrDreamerWakeEye', 1150)}
    </>,
    // Lullaby (medium): pastel stars and Zs spiral down over it.
    lullaby: () => <>{around(8, (i) => (
      <div key={i} className="lgx" style={{ left: `${18 + i * 9}%`, top: '18%', fontWeight: 900, fontSize: 20 + (i % 3) * 5, filter: 'drop-shadow(0 0 4px #d9c8ff)', color: ['#ffc4e8', '#bfe6ff', '#fff3a8', '#d9c8ff'][i % 4], WebkitTextStroke: '1px #3a2a55', '--x': `${(i % 2 ? 1 : -1) * (10 + (i % 3) * 6)}px`, animation: anim('lgrDreamerSpiral', 760, i * 55, SETTLE) }}>{i % 2 ? 'z' : '✦'}</div>
    ))}
      {/* a crescent-moon cradle rocks above it */}
      <svg className="lgx" viewBox="0 0 40 40" style={{ left: '50%', top: '0%', width: 52, height: 52, marginLeft: -26, overflow: 'visible', transformOrigin: '50% 0', filter: 'drop-shadow(0 0 8px #fff3a8)', animation: anim('lgrDreamerCradle', 760, 0, 'ease-in-out') }} aria-hidden="true">
        <path d="M26 4A16 16 0 1 0 36 30 13 13 0 1 1 26 4Z" fill="#fff3a8" stroke="#3a2a55" strokeWidth="2" />
      </svg>
    </>,
  },
  floaters: { deeper: 'lg_fx_sleepDeeper', hum: 'lg_fx_sleepHum', nightmare: 'lg_fx_sleepNightmare', wake: 'lg_fx_sleepWake', lullaby: 'lg_fx_sleepLullaby' },
  floaterTone: { deeper: 'purple', hum: 'info', nightmare: 'purple', wake: 'danger', lullaby: 'info' },
  demo: { deeper: { kind: 'hit', damage: 2, lives: 0 }, hum: { kind: 'hit', damage: 2, lives: 0 }, nightmare: { kind: 'hit', damage: 5, lives: 0 }, wake: { kind: 'miss', damage: 0, lives: 1 }, lullaby: { kind: 'hit', damage: 4, lives: 0 } },
  juice: {
    deeper: { size: 'tick', sfx: 'dreamer.deeper' },
    hum: { size: 'tick', sfx: 'dreamer.hum' },
    nightmare: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'dreamer.nightmare' },
    wake: { size: 'big', shake: 1, flash: 1, hitstop: 1, sfx: 'dreamer.wake' },
    lullaby: { size: 'medium', hitstop: 1, sfx: 'dreamer.lullaby' },
  },
  // Reactions on the boss art box. Writhe: a skewY ripple through the body. Startle: a jump-scare jolt up with a
  // swell, quick settle. Settle: a slow contented sink. Sink / hum: tiny nudges. Drift: the persistent sleep breath
  // (the idle reaction, kept on while it sleeps).
  css: `
@keyframes lgrDreamerBubble { 0% { transform: scale(0); opacity: 0 } 50% { transform: scale(1.15); opacity: 1 } 75% { transform: scale(1) translateY(-4px); opacity: 1 } 100% { transform: scale(1.05) translateY(-10px); opacity: 0 } }
@keyframes lgrDreamerCradle { 0% { transform: rotate(-20deg) scale(.6); opacity: 0 } 20% { opacity: 1 } 40% { transform: rotate(16deg) scale(1) } 65% { transform: rotate(-12deg) } 85% { transform: rotate(6deg); opacity: 1 } 100% { transform: rotate(0); opacity: 0 } }
.lgr-dreamer-deeper { animation: lgrDreamerSink 300ms ease-out both; transform-origin: 50% 100% }
.lgr-dreamer-hum { animation: lgrDreamerHum 300ms ease-out both; transform-origin: 50% 100% }
.lgr-dreamer-nightmare { animation: lgrDreamerWrithe 1000ms ease-in-out both; transform-origin: 50% 100% }
.lg-boss[data-phase="3"] .lgr-dreamer-nightmare { animation-name: lgrDreamerWritheP3 }
.lgr-dreamer-wake { animation: lgrDreamerStartle 600ms ${SETTLE} both; transform-origin: 50% 100% }
.lgr-dreamer-lullaby { animation: lgrDreamerSettle 780ms ease-in-out both; transform-origin: 50% 100% }
.lgr-dreamer-idle-asleep { animation: lgrDreamerDrift 4s ease-in-out infinite; transform-origin: 50% 100% }
@keyframes lgrDreamerSink { 0%, 100% { transform: none } 50% { transform: translateY(6px) scale(1.03, .96) } }
@keyframes lgrDreamerHum { 0%, 100% { transform: none } 30% { transform: rotate(-5deg) translateY(1px) } 65% { transform: rotate(4deg) } 88% { transform: rotate(-1deg) } }
@keyframes lgrDreamerWrithe { 0%, 100% { transform: none } 15% { transform: skewY(7deg) } 32% { transform: skewY(-7deg) } 50% { transform: skewY(5deg) } 68% { transform: skewY(-4deg) } 84% { transform: skewY(1.5deg) } }
@keyframes lgrDreamerWritheP3 { 0%, 100% { transform: none } 12% { transform: skewY(9deg) scale(1.05) } 28% { transform: skewY(-9deg) } 44% { transform: skewY(7deg) scale(1.04) } 60% { transform: skewY(-5deg) } 76% { transform: skewY(3deg) } 90% { transform: skewY(-1deg) } }
@keyframes lgrDreamerStartle { 0% { transform: none } 18% { transform: translateY(-10px) scale(1.12) } 35% { transform: translateY(-7px) scale(1.08) } 60% { transform: translateY(1px) scale(.99) } 100% { transform: none } }
@keyframes lgrDreamerSettle { 0% { transform: none } 55% { transform: translateY(6px) } 80% { transform: translateY(5px) } 100% { transform: none } }
@keyframes lgrDreamerDrift { 0%, 100% { transform: none } 50% { transform: scaleY(1.015) } }
@keyframes lgrDreamerRipple { 0% { transform: translate(-50%, -50%) scale(.1); opacity: 0 } 25% { opacity: 1 } 70% { transform: translate(-50%, -50%) scale(1); opacity: .95 } 100% { transform: translate(-50%, -50%) scale(1.1); opacity: 0 } }
@keyframes lgrDreamerLidSnap { 0% { transform: translate(-50%, -50%) scaleY(0); opacity: 0 } 12% { transform: translate(-50%, -50%) scaleY(1.05); opacity: 1 } 30% { transform: translate(-50%, -50%) scaleY(1) } 38% { transform: translate(-50%, -50%) scaleY(.03) } 46% { transform: translate(-50%, -50%) scaleY(1.05) } 54% { transform: translate(-50%, -50%) scaleY(.03) } 62% { transform: translate(-50%, -50%) scaleY(1) } 85% { opacity: 1 } 100% { transform: translate(-50%, -50%) scaleY(0); opacity: 0 } }
@keyframes lgrDreamerWakeEye { 0% { transform: translate(-50%, -50%) scaleY(0); opacity: 0 } 18% { transform: translate(-50%, -50%) scaleY(1.06); opacity: 1 } 30% { transform: translate(-50%, -50%) scaleY(1) } 52% { transform: translate(-50%, -50%) scaleY(1) } 58% { transform: translate(-50%, -50%) scaleY(.04) } 66% { transform: translate(-50%, -50%) scaleY(1) } 85% { opacity: 1 } 100% { transform: translate(-50%, -50%) scaleY(.9); opacity: 0 } }
@keyframes lgrDreamerLash { 0% { transform: rotate(var(--r)) scale(.4) rotate(-35deg); opacity: 0 } 25% { opacity: 1 } 45% { transform: rotate(var(--r)) scale(1) rotate(12deg) } 70% { transform: rotate(var(--r)) scale(.9) rotate(-8deg); opacity: 1 } 100% { transform: rotate(var(--r)) scale(.5) rotate(-30deg); opacity: 0 } }
@keyframes lgrDreamerSpiral { 0% { transform: translate(var(--x), -30px) rotate(0) scale(.6); opacity: 0 } 20% { opacity: 1 } 100% { transform: translate(calc(var(--x) * -1), 70px) rotate(300deg) scale(1); opacity: 0 } }
/* fx-layer motion: on the lullaby, the lids of the phase 2 eyes and the phase 3 ringed eyes slide down shut from
   their top edge (all together: the lids are separate groups with no order a CSS delay could follow). */
@keyframes lgrDreamerLidDrop { 0% { transform: scaleY(.15) } 60% { transform: scaleY(1.06) } 100% { transform: none } }
.lg-boss[data-fx="lullaby"] .lg-p2 .lg-fx-lullaby, .lg-boss[data-phase="3"][data-fx="lullaby"] .lg-p3 .lg-fx-lullaby { transform-box: fill-box; transform-origin: 50% 0%; animation: lgrDreamerLidDrop 520ms cubic-bezier(.4,0,.3,1) both }
` + DRAWING,
}
