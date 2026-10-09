// What Comedy and Tragedy (abilities/showman.js) LOOKS like (design v2.1, #26). The fx contract is in fx/index.js.
//   laugh   (tick)   a rose is tossed into his ring from the crowd and two sparkles pop (he tips his hat).
//   encore  (big)    two spotlights swing in from the wings and cross on him, the house throws roses and his own cards
//                    rain back down on him, a gold ring of applause rolls out (he is forced into a deep bow).
//   tear    (tick)   one blue tear runs down from the tragedy mask (he leans back, smug).
//   twist   (medium) the great mask spins round from tragedy to comedy and his cards whirl backwards (he reels).
import { center, anim, around, ring } from './_kit'

// Fixed bright circus colors (never theme tokens over the art).
const T = { gold: '#ffd166', amber: '#f2b441', rose: '#e8173f', roseHi: '#ff6b8a', leaf: '#3fae5a', beam: 'rgba(255, 244, 194, .32)', tear: '#7fd4ff', white: '#ffffff', card: '#fbf7ef', ink: '#1d2230', violet: '#c58bff' }
const SUITS = ['♠', '♥', '♦', '♣']
const suitColor = (i) => (i % 2 ? '#d0103a' : '#15111c')
const card = (i, extra) => (
  <div key={i} className="lgx" style={{ width: 11, height: 15, marginLeft: -5.5, borderRadius: 2, background: T.card, border: `1.5px solid ${T.ink}`, color: suitColor(i), fontSize: 9, lineHeight: '13px', textAlign: 'center', fontWeight: 700, ...extra }}>{SUITS[i % 4]}</div>
)
const rose = (key, extra) => (
  <div key={key} className="lgx" style={{ width: 10, height: 10, borderRadius: '50% 50% 50% 10%', background: `radial-gradient(circle at 40% 40%, ${T.roseHi}, ${T.rose} 60%, #8a0a24)`, border: `1.5px solid ${T.ink}`, boxShadow: `3px 4px 0 -2px ${T.leaf}`, ...extra }} />
)

export default {
  effects: {
    laugh: () => <>
      {[0, 1, 2].map((i) => rose(`r${i}`, { left: `${4 + i * 6}%`, top: `${74 + i * 5}%`, width: 18, height: 18, '--spin': '0deg', animation: anim('lgrShowmanToss', 330, i * 45, 'cubic-bezier(.3,.7,.4,1)') }))}
      {around(6, (i, a) => <div key={i} className="lgx" style={{ left: '50%', top: '34%', width: 13, height: 13, marginLeft: -6.5, background: i % 2 ? T.gold : T.white, clipPath: 'polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%)', filter: `drop-shadow(0 0 3px ${T.amber})`, '--a': `${a}deg`, '--d': '-42px', '--spin': '90deg', animation: anim('lgxShard', 320, 120) }} />)}
    </>,
    encore: () => <>
      {/* the two spotlights swing in from the wings and cross on him */}
      <div className="lgx" style={{ left: '-6%', top: '-30%', width: '34%', height: '150%', background: `linear-gradient(${T.beam}, rgba(255, 244, 194, .12))`, clipPath: 'polygon(42% 0, 58% 0, 100% 100%, 0 100%)', transformOrigin: '50% 0', '--r0': '-58deg', '--r1': '-24deg', animation: anim('lgrShowmanBeam', 1150) }} />
      <div className="lgx" style={{ right: '-6%', top: '-30%', width: '34%', height: '150%', background: `linear-gradient(${T.beam}, rgba(255, 244, 194, .12))`, clipPath: 'polygon(42% 0, 58% 0, 100% 100%, 0 100%)', transformOrigin: '50% 0', '--r0': '58deg', '--r1': '24deg', animation: anim('lgrShowmanBeam', 1150) }} />
      {ring(T.gold, 260, 2.4, 6, 650)}{ring(T.amber, 360, 3, 4, 750)}
      {/* his own cards rain back down on him, roses thrown from the house */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => card(i, { left: `${10 + i * 11}%`, top: '-16%', '--spin': `${i % 2 ? 320 : -320}deg`, animation: anim('lgxFall', 1000, 200 + i * 60, 'ease-in') }))}
      {[0, 1, 2, 3, 4, 5].map((i) => rose(`r${i}`, { left: `${16 + i * 13}%`, top: '-8%', '--spin': `${i % 2 ? 260 : -260}deg`, animation: anim('lgxFall', 1100, 380 + i * 70, 'ease-in') }))}
      {around(12, (i, a) => <div key={`s${i}`} className="lgx" style={{ ...center, width: 7, height: 7, marginLeft: -3.5, background: i % 2 ? T.gold : T.white, clipPath: 'polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%)', '--a': `${a}deg`, '--d': `${i % 2 ? -70 : -96}px`, '--spin': '180deg', animation: anim('lgxShard', 820, 300 + (i % 3) * 40) }} />)}
    </>,
    tear: () => <>
      <div className="lgx" style={{ right: 'calc(17% + 5px)', top: '14%', width: 6, height: '30%', transformOrigin: 'top', borderRadius: 3, background: `linear-gradient(${T.tear}, rgba(127,212,255,0))`, animation: anim('lgrShowmanStreak', 340) }} />
      <div className="lgx" style={{ right: '17%', top: '14%', width: 16, height: 22, borderRadius: '50% 50% 50% 50% / 64% 64% 36% 36%', background: `radial-gradient(circle at 40% 60%, ${T.white}, ${T.tear} 55%, #2f8fd0)`, border: `2px solid ${T.ink}`, boxShadow: `0 0 8px ${T.tear}`, animation: anim('lgrShowmanTear', 340, 0, 'ease-in') }} />
    </>,
    twist: () => <>
      <div className="lgx lgx-full" style={{ background: 'radial-gradient(circle, rgba(197, 139, 255, .4), transparent 58%)', animation: anim('lgxFlash', 520) }} />
      {/* his cards whirl backwards round him */}
      {around(10, (i, a) => card(i, { ...center, '--a': `${a}deg`, '--d': '-64px', '--spin': '-420deg', animation: anim('lgxShard', 760, i * 18) }))}
      {/* the great mask turns round from tragedy to comedy */}
      <div className="lgx" style={{ ...center, fontSize: 46, lineHeight: '50px', width: 56, height: 56, margin: '-28px 0 0 -28px', textAlign: 'center', filter: `drop-shadow(0 0 10px ${T.violet})`, animation: anim('lgrShowmanFlip', 780, 0, 'cubic-bezier(.34,1.4,.64,1)') }}>🎭</div>
    </>,
  },
  floaters: { laugh: 'lg_fx_showLaugh', encore: 'lg_fx_showEncore', tear: 'lg_fx_showTear', twist: 'lg_fx_showTwist' },
  floaterTone: { laugh: 'warning', encore: 'warning', tear: 'info', twist: 'purple' },
  demo: { laugh: { kind: 'hit', damage: 1, lives: 0 }, encore: { kind: 'hit', damage: 4, lives: 0 }, tear: { kind: 'miss', damage: 0, lives: 1 }, twist: { kind: 'miss', damage: 0, lives: 1 } },
  juice: {
    laugh: { size: 'tick' },
    encore: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'showman.encore' },
    tear: { size: 'tick' },
    twist: { size: 'medium', shake: 1, flash: 1, sfx: 'showman.twist' },
  },
  css: `
@keyframes lgrShowmanToss { 0% { transform: translate(0, 0) rotate(0); opacity: 0 } 15% { opacity: 1 } 55% { transform: translate(40px, -60px) rotate(200deg) } 100% { transform: translate(70px, -26px) rotate(380deg); opacity: 0 } }
@keyframes lgrShowmanBeam { 0% { transform: rotate(var(--r0)); opacity: 0 } 18% { opacity: 1 } 45% { transform: rotate(var(--r1)) } 80% { transform: rotate(var(--r1)); opacity: 1 } 100% { transform: rotate(var(--r1)); opacity: 0 } }
@keyframes lgrShowmanStreak { 0% { transform: scaleY(0); opacity: 0 } 30% { opacity: 1 } 80% { transform: scaleY(1); opacity: .9 } 100% { transform: scaleY(1); opacity: 0 } }
@keyframes lgrShowmanTear { 0% { transform: translateY(0) scale(.4); opacity: 0 } 25% { transform: translateY(0) scale(1); opacity: 1 } 100% { transform: translateY(34px) scale(.9, 1.1); opacity: 0 } }
@keyframes lgrShowmanFlip { 0% { transform: perspective(300px) rotateY(0) scale(.3); opacity: 0 } 20% { opacity: 1 } 60% { transform: perspective(300px) rotateY(540deg) scale(1.25) } 82% { transform: perspective(300px) rotateY(720deg) scale(1); opacity: 1 } 100% { transform: perspective(300px) rotateY(720deg) scale(1.1); opacity: 0 } }
.lgr-showman-laugh { animation: lgrShowmanTip 320ms ease-out both; transform-origin: 50% 90% }
@keyframes lgrShowmanTip { 0%, 100% { transform: none } 40% { transform: rotate(-7deg) translateY(2px) } 75% { transform: rotate(-2deg) } }
.lgr-showman-tear { animation: lgrShowmanSmug 320ms ease-out both; transform-origin: 50% 100% }
@keyframes lgrShowmanSmug { 0%, 100% { transform: none } 45% { transform: rotate(5deg) translateY(-5px) scale(1.03) } 80% { transform: rotate(1deg) } }
.lgr-showman-encore { animation: lgrShowmanBow 1100ms cubic-bezier(.3,.6,.4,1) both; transform-origin: 50% 100% }
@keyframes lgrShowmanBow { 0% { transform: none } 18% { transform: rotate(-2deg) translateY(-2px) } 46% { transform: rotate(9deg) translateY(7px) scale(1, .94) } 64% { transform: rotate(8deg) translateY(6px) scale(1, .95) } 84% { transform: rotate(-1.5deg) translateY(-2px) } 100% { transform: none } }
.lgr-showman-twist { animation: lgrShowmanReel 760ms cubic-bezier(.22,1,.36,1) both; transform-origin: 50% 100% }
@keyframes lgrShowmanReel { 0% { transform: none } 22% { transform: translateX(7px) rotate(4deg) } 44% { transform: translateX(-5px) rotate(-3deg) } 66% { transform: translateX(2px) rotate(1.5deg) } 100% { transform: none } }
/* fx-layer motion: on the Encore the comedy mask on his arch glows and pulses in place */
@keyframes lgrShowmanMaskPulse { 0%, 100% { transform: none } 25% { transform: scale(1.25) } 50% { transform: scale(1) } 75% { transform: scale(1.18) } }
.lg-boss[data-fx="encore"] .lgfa-showman-comedy { transform-box: fill-box; transform-origin: center; animation: lgrShowmanMaskPulse 1000ms ease-in-out both }
/* THE REAL PARTS: the state layer this ability draws on the boss (its lg-ab-* group in raids/showman.svg) moves with
   the moment, not only the whole figure. Played only while data-fx is set (never in focus mode, with Still bosses or
   under reduced motion). */
@keyframes lgrShowmanComedyPop { 0% { transform: none } 35% { transform: scale(1.25) } 65% { transform: scale(.94) } 100% { transform: none } }
.lg-boss[data-fx="laugh"] [class*="lg-ab-comedy-"] { transform-box: fill-box; transform-origin: center; animation: lgrShowmanComedyPop 320ms cubic-bezier(.22,1,.36,1) both }
@keyframes lgrShowmanTragedyPop { 0% { transform: none } 35% { transform: scale(1.25) } 65% { transform: scale(.94) } 100% { transform: none } }
.lg-boss[data-fx="tear"] [class*="lg-ab-tragedy-"] { transform-box: fill-box; transform-origin: center; animation: lgrShowmanTragedyPop 320ms cubic-bezier(.22,1,.36,1) both }
/* THE DRAWING ACTS IT OUT: his own SVG parts (lg-showman-arml = the Comedy arm, -armr = the Tragedy arm, -head,
   -comedy and -tragedy = the two masks, -fan = the fan of giant cards behind him in phase 3; raids/showman.svg, all three
   phases) move with every moment, his attack and each ability. Arms pivot at the shoulder (view-box units), the head at
   the neck, masks and fan about themselves. Played only while data-moment / data-assault-on / data-fx is set. */
.lg-showman-arml, .lg-showman-armr, .lg-showman-head, .lg-showman-fan { transform-box: view-box }
.lg-p1 .lg-showman-arml { transform-origin: 12px 140px } .lg-p1 .lg-showman-armr { transform-origin: 112px 140px } .lg-p1 .lg-showman-head { transform-origin: 60px 80px }
.lg-p2 .lg-showman-arml { transform-origin: 28px 114px } .lg-p2 .lg-showman-armr { transform-origin: 96px 114px } .lg-p2 .lg-showman-head { transform-origin: 60px 94px }
.lg-p3 .lg-showman-arml { transform-origin: 34px 100px } .lg-p3 .lg-showman-armr { transform-origin: 86px 100px } .lg-p3 .lg-showman-head { transform-origin: 60px 92px }
.lg-showman-fan { transform-origin: 60px 100px }
.lg-showman-comedy, .lg-showman-tragedy { transform-box: fill-box; transform-origin: 50% 50% }
.lg-p3 :is(.lg-showman-arml, .lg-showman-armr) { --sm-k: .6 }

/* HIS STRIKE (data-assault-on from the first frame, then data-moment="hurt"): a magician's flourish turned deadly. He
   draws back (100 ms), then FLINGS: the Comedy arm whips through and the Comedy mask spins off it at the camera like a
   thrown blade and snaps back, the Tragedy hand flicks the razor cards out, his chin juts with a grin. */
@keyframes lgrSmArmStrikeL { 0% { transform: none } 11% { transform: rotate(calc(-14deg * var(--sm-k, 1))) } 17% { transform: rotate(calc(-16deg * var(--sm-k, 1))) }
  26% { transform: rotate(calc(22deg * var(--sm-k, 1))) scale(1.1) } 34% { transform: rotate(calc(17deg * var(--sm-k, 1))) scale(1.07) } 60% { transform: rotate(calc(8deg * var(--sm-k, 1))) scale(1.03) } 100% { transform: none } }
@keyframes lgrSmArmStrikeR { 0% { transform: none } 11% { transform: rotate(calc(10deg * var(--sm-k, 1))) } 17% { transform: rotate(calc(12deg * var(--sm-k, 1))) }
  26% { transform: rotate(calc(-18deg * var(--sm-k, 1))) scale(1.08) } 34% { transform: rotate(calc(-14deg * var(--sm-k, 1))) scale(1.06) } 60% { transform: rotate(calc(-6deg * var(--sm-k, 1))) } 100% { transform: none } }
@keyframes lgrSmMaskThrow { 0% { transform: none } 11% { transform: rotate(-20deg) scale(.95) } 17% { transform: rotate(-24deg) scale(.95) }
  30% { transform: translate(26px, 14px) rotate(330deg) scale(1.9) } 44% { transform: translate(18px, 10px) rotate(540deg) scale(1.6) }
  66% { transform: translate(4px, 2px) rotate(700deg) scale(1.1) } 78% { transform: rotate(735deg) } 88% { transform: rotate(712deg) } 100% { transform: rotate(720deg) } }
@keyframes lgrSmMaskFlick { 0% { transform: none } 11% { transform: rotate(10deg) } 26% { transform: rotate(-24deg) scale(1.16) } 45% { transform: rotate(8deg) } 64% { transform: rotate(-4deg) } 100% { transform: none } }
@keyframes lgrSmHeadStrike { 0% { transform: none } 11% { transform: rotate(-7deg) translateY(-2px) } 17% { transform: rotate(-8deg) translateY(-2px) }
  27% { transform: rotate(6deg) translate(3px, 2px) scale(1.06) } 48% { transform: rotate(3deg) translate(1px, 1px) scale(1.03) } 100% { transform: none } }
@keyframes lgrSmFanStrike { 0% { transform: none } 11% { transform: scale(.94) } 26% { transform: scale(1.16) rotate(4deg) } 40% { transform: scale(1.08) rotate(-2deg) } 100% { transform: none } }
.lg-boss[data-motif="showman"][data-assault-on] .lg-showman-arml, .lg-boss[data-motif="showman"][data-moment="hurt"] .lg-showman-arml { animation: lgrSmArmStrikeL 900ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"][data-assault-on] .lg-showman-armr, .lg-boss[data-motif="showman"][data-moment="hurt"] .lg-showman-armr { animation: lgrSmArmStrikeR 900ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"][data-assault-on] .lg-showman-comedy, .lg-boss[data-motif="showman"][data-moment="hurt"] .lg-showman-comedy { animation: lgrSmMaskThrow 900ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"][data-assault-on] .lg-showman-tragedy, .lg-boss[data-motif="showman"][data-moment="hurt"] .lg-showman-tragedy { animation: lgrSmMaskFlick 900ms ease-out both }
.lg-boss[data-motif="showman"][data-assault-on] .lg-showman-head, .lg-boss[data-motif="showman"][data-moment="hurt"] .lg-showman-head { animation: lgrSmHeadStrike 900ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"][data-assault-on] .lg-showman-fan, .lg-boss[data-motif="showman"][data-moment="hurt"] .lg-showman-fan { animation: lgrSmFanStrike 900ms cubic-bezier(.3,0,.3,1) both }

/* HIS HEAVY BLOW (data-moment="hurtBig", 100 ms in, from the drawn-back pose): BOTH masks are hurled at you at once
   (Comedy spins in from the left, Tragedy from the right), both arms follow through, the card fan bursts wide. */
@keyframes lgrSmArmHeavyL { 0% { transform: rotate(calc(-14deg * var(--sm-k, 1))) } 16% { transform: rotate(calc(-24deg * var(--sm-k, 1))) } 20% { transform: rotate(calc(-25deg * var(--sm-k, 1))) }
  30% { transform: rotate(calc(30deg * var(--sm-k, 1))) scale(1.16) } 38% { transform: rotate(calc(24deg * var(--sm-k, 1))) scale(1.12) } 70% { transform: rotate(calc(10deg * var(--sm-k, 1))) scale(1.04) } 100% { transform: none } }
@keyframes lgrSmArmHeavyR { 0% { transform: rotate(calc(10deg * var(--sm-k, 1))) } 16% { transform: rotate(calc(22deg * var(--sm-k, 1))) } 20% { transform: rotate(calc(23deg * var(--sm-k, 1))) }
  30% { transform: rotate(calc(-28deg * var(--sm-k, 1))) scale(1.16) } 38% { transform: rotate(calc(-22deg * var(--sm-k, 1))) scale(1.12) } 70% { transform: rotate(calc(-9deg * var(--sm-k, 1))) scale(1.04) } 100% { transform: none } }
@keyframes lgrSmComedyHeavy { 0% { transform: rotate(-20deg) scale(.95) } 18% { transform: rotate(-40deg) scale(.9) } 32% { transform: translate(30px, 18px) rotate(380deg) scale(2.2) }
  46% { transform: translate(22px, 14px) rotate(560deg) scale(1.9) } 70% { transform: translate(4px, 2px) rotate(700deg) scale(1.15) } 82% { transform: rotate(732deg) } 100% { transform: rotate(720deg) } }
@keyframes lgrSmTragedyHeavy { 0% { transform: rotate(10deg) } 18% { transform: rotate(30deg) scale(.9) } 34% { transform: translate(-10px, 16px) rotate(-380deg) scale(2.1) }
  48% { transform: translate(-7px, 12px) rotate(-560deg) scale(1.8) } 72% { transform: translate(-2px, 2px) rotate(-700deg) scale(1.1) } 84% { transform: rotate(-732deg) } 100% { transform: rotate(-720deg) } }
@keyframes lgrSmHeadHeavy { 0% { transform: rotate(-7deg) translateY(-2px) } 18% { transform: rotate(-10deg) translateY(-4px) } 30% { transform: rotate(8deg) translate(3px, 4px) scale(1.12) }
  40% { transform: rotate(5deg) translate(2px, 3px) scale(1.08) } 70% { transform: rotate(2deg) scale(1.03) } 100% { transform: none } }
@keyframes lgrSmFanHeavy { 0% { transform: scale(.94) } 18% { transform: scale(.88) } 30% { transform: scale(1.32) } 38% { transform: scale(1.2) rotate(-3deg) } 50% { transform: scale(1.26) rotate(2deg) } 100% { transform: none } }
.lg-boss[data-motif="showman"][data-moment="hurtBig"] .lg-showman-arml { animation: lgrSmArmHeavyL 1150ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="hurtBig"] .lg-showman-armr { animation: lgrSmArmHeavyR 1150ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="hurtBig"] .lg-showman-comedy { animation: lgrSmComedyHeavy 1150ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="hurtBig"] .lg-showman-tragedy { animation: lgrSmTragedyHeavy 1150ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="hurtBig"] .lg-showman-head { animation: lgrSmHeadHeavy 1150ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="hurtBig"] .lg-showman-fan { animation: lgrSmFanHeavy 1150ms cubic-bezier(.3,0,.3,1) both }

/* HIT: the blow knocks his head aside, the Comedy mask's grin is jolted crooked, the Tragedy mask bobs. */
@keyframes lgrSmHeadHit { 0% { transform: none } 12% { transform: rotate(14deg) translate(4px, -2px) } 30% { transform: rotate(-5deg) } 50% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgrSmMaskJolt { 0% { transform: none } 12% { transform: rotate(-34deg) translate(-3px, -5px) scale(1.1) } 34% { transform: rotate(12deg) } 56% { transform: rotate(-4deg) } 100% { transform: none } }
@keyframes lgrSmMaskBob { 0% { transform: none } 14% { transform: translateY(7px) rotate(14deg) } 40% { transform: translateY(-3px) rotate(-6deg) } 100% { transform: none } }
.lg-boss[data-motif="showman"][data-moment="hit"] .lg-showman-head { animation: lgrSmHeadHit 700ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="hit"] .lg-showman-comedy { animation: lgrSmMaskJolt 700ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="hit"] .lg-showman-tragedy { animation: lgrSmMaskBob 700ms ease-out both }

/* CRIT: the Comedy mask is knocked clean out of his act, cartwheels up and away and lands back in place; his head
   whips round, the arms flail, the fan of cards shudders. */
@keyframes lgrSmComedyCrit { 0% { transform: none } 10% { transform: translate(-6px, -10px) rotate(-90deg) } 30% { transform: translate(-12px, -22px) rotate(-300deg) scale(.9) }
  52% { transform: translate(-4px, -6px) rotate(-640deg) } 60% { transform: rotate(-735deg) } 70% { transform: rotate(-710deg) } 82% { transform: rotate(-724deg) } 100% { transform: rotate(-720deg) } }
@keyframes lgrSmHeadCrit { 0% { transform: none } 10% { transform: rotate(14deg) translate(4px, -2px) scale(.95) } 28% { transform: rotate(-6deg) } 46% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgrSmArmCritL { 0% { transform: none } 10% { transform: rotate(-16deg) } 36% { transform: rotate(6deg) } 60% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgrSmArmCritR { 0% { transform: none } 10% { transform: rotate(16deg) } 36% { transform: rotate(-6deg) } 60% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgrSmFanShudder { 0% { transform: none } 10% { transform: scale(.92) rotate(-3deg) } 20% { transform: scale(1.04) rotate(3deg) } 30% { transform: rotate(-2deg) } 44% { transform: none } 100% { transform: none } }
.lg-boss[data-motif="showman"][data-moment="crit"] .lg-showman-comedy { animation: lgrSmComedyCrit 1000ms cubic-bezier(.3,.7,.4,1) both }
.lg-boss[data-motif="showman"][data-moment="crit"] .lg-showman-head { animation: lgrSmHeadCrit 1000ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="crit"] .lg-showman-arml { animation: lgrSmArmCritL 1000ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="crit"] .lg-showman-armr { animation: lgrSmArmCritR 1000ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="crit"] .lg-showman-fan { animation: lgrSmFanShudder 1000ms ease-out both }

/* SHARPEN: honed cuts through the act: both masks are slashed and flip edge on (a cut card), the head is struck one
   way then the other. */
@keyframes lgrSmMaskSlash { 0% { transform: none } 8% { transform: scaleX(.12) rotate(18deg) } 18% { transform: scaleX(1) rotate(-6deg) } 30% { transform: scaleX(.12) rotate(-18deg) } 42% { transform: scaleX(1) rotate(4deg) } 60% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgrSmHeadSharpen { 0% { transform: none } 8% { transform: translateX(4px) rotate(6deg) } 20% { transform: translateX(-1px) } 30% { transform: translateX(-4px) rotate(-6deg) } 46% { transform: rotate(2deg) } 100% { transform: none } }
.lg-boss[data-motif="showman"][data-moment="sharpen"] :is(.lg-showman-comedy, .lg-showman-tragedy) { animation: lgrSmMaskSlash 760ms linear both }
.lg-boss[data-motif="showman"][data-moment="sharpen"] .lg-showman-head { animation: lgrSmHeadSharpen 760ms cubic-bezier(.2,.8,.3,1) both }

/* BLOCK: his flourish is parried: the Comedy arm lunges in, is batted back past his shoulder and the mask spins on
   its baton; he flinches back. */
@keyframes lgrSmArmBlock { 0% { transform: none } 14% { transform: rotate(18deg) scale(1.08) } 22% { transform: rotate(19deg) scale(1.08) } 32% { transform: rotate(-24deg) scale(.96) }
  48% { transform: rotate(-9deg) } 66% { transform: rotate(4deg) } 100% { transform: none } }
@keyframes lgrSmMaskParried { 0% { transform: none } 22% { transform: rotate(10deg) } 34% { transform: rotate(-200deg) } 52% { transform: rotate(-330deg) } 64% { transform: rotate(-368deg) } 76% { transform: rotate(-356deg) } 100% { transform: rotate(-360deg) } }
@keyframes lgrSmHeadBlock { 0% { transform: none } 14% { transform: rotate(-4deg) translateY(1px) } 32% { transform: rotate(-10deg) translate(-3px, -2px) } 56% { transform: rotate(3deg) } 100% { transform: none } }
.lg-boss[data-motif="showman"][data-moment="block"] .lg-showman-arml { animation: lgrSmArmBlock 800ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="block"] .lg-showman-comedy { animation: lgrSmMaskParried 800ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="block"] .lg-showman-head { animation: lgrSmHeadBlock 800ms ease-out both }

/* SHIELD: the thrown Tragedy mask glances off the dome: it flies out, ricochets sideways and wobbles home; his arm
   overreaches after it and his head follows, put out. */
@keyframes lgrSmTragedyGlance { 0% { transform: none } 22% { transform: translate(-8px, 10px) rotate(-120deg) scale(1.5) } 34% { transform: translate(10px, 4px) rotate(-60deg) scale(1.3) }
  58% { transform: translate(3px, -2px) rotate(-20deg) } 76% { transform: rotate(8deg) } 100% { transform: none } }
@keyframes lgrSmArmShield { 0% { transform: none } 14% { transform: rotate(8deg) } 26% { transform: rotate(-16deg) scale(1.07) } 40% { transform: rotate(-26deg) scale(1.05) } 64% { transform: rotate(-8deg) } 100% { transform: none } }
@keyframes lgrSmHeadShield { 0% { transform: none } 26% { transform: rotate(-4deg) } 40% { transform: rotate(-8deg) translate(-2px, 2px) } 64% { transform: rotate(3deg) } 100% { transform: none } }
.lg-boss[data-motif="showman"][data-moment="shield"] .lg-showman-tragedy { animation: lgrSmTragedyGlance 820ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="shield"] .lg-showman-armr { animation: lgrSmArmShield 820ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="shield"] .lg-showman-head { animation: lgrSmHeadShield 820ms ease-out both }

/* SECOND WIND: you got back up: the showman is unamused: the Tragedy mask sulks low, Comedy turns its back (flips
   edge on), his head tilts with a slow disapproving shake. */
@keyframes lgrSmTragedySulk { 0% { transform: none } 24% { transform: translateY(10px) rotate(24deg) scale(.86) } 76% { transform: translateY(9px) rotate(20deg) scale(.88) } 100% { transform: none } }
@keyframes lgrSmComedyTurn { 0% { transform: none } 20% { transform: scaleX(-1) } 76% { transform: scaleX(-1) } 100% { transform: none } }
@keyframes lgrSmHeadWind { 0% { transform: none } 14% { transform: rotate(5deg) } 30% { transform: rotate(-5deg) } 46% { transform: rotate(4deg) } 62% { transform: rotate(-2deg) } 100% { transform: none } }
.lg-boss[data-motif="showman"][data-moment="wind"] .lg-showman-tragedy { animation: lgrSmTragedySulk 900ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="wind"] .lg-showman-comedy { animation: lgrSmComedyTurn 900ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="showman"][data-moment="wind"] .lg-showman-head { animation: lgrSmHeadWind 900ms ease-in-out both }
@keyframes lgrSmShrugL { 0% { transform: none } 22% { transform: rotate(-9deg) translateY(4px) } 76% { transform: rotate(-8deg) translateY(4px) } 100% { transform: none } }
@keyframes lgrSmShrugR { 0% { transform: none } 22% { transform: rotate(9deg) translateY(4px) } 76% { transform: rotate(8deg) translateY(4px) } 100% { transform: none } }
.lg-boss[data-motif="showman"][data-moment="wind"] .lg-showman-arml { animation: lgrSmShrugL 900ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="wind"] .lg-showman-armr { animation: lgrSmShrugR 900ms cubic-bezier(.2,.8,.3,1) both }

/* KNOCKOUT, THE CURTAIN CALL: he takes one last deep bow, then the act falls apart: both masks slip from his hands and
   tumble down out of the light, the arms drop, the head hangs, the fan of cards collapses. */
@keyframes lgrSmHeadKo { 0% { transform: none } 12% { transform: rotate(-6deg) translateY(-2px) } 34% { transform: rotate(4deg) translateY(8px) scale(.97) } 46% { transform: rotate(2deg) translateY(6px) }
  66% { transform: rotate(12deg) translateY(12px) scale(.95) } 100% { transform: rotate(14deg) translateY(13px) scale(.95) } }
@keyframes lgrSmComedyKo { 0% { transform: none } 40% { transform: rotate(-10deg) } 58% { transform: translate(-6px, 30px) rotate(-160deg) } 72% { transform: translate(-8px, 56px) rotate(-250deg) }
  80% { transform: translate(-8px, 52px) rotate(-240deg) } 100% { transform: translate(-8px, 56px) rotate(-246deg) } }
@keyframes lgrSmTragedyKo { 0% { transform: none } 44% { transform: rotate(10deg) } 62% { transform: translate(6px, 30px) rotate(150deg) } 76% { transform: translate(8px, 56px) rotate(230deg) }
  84% { transform: translate(8px, 52px) rotate(222deg) } 100% { transform: translate(8px, 56px) rotate(226deg) } }
@keyframes lgrSmArmKoL { 0% { transform: none } 12% { transform: rotate(-10deg) } 40% { transform: rotate(-4deg) } 66% { transform: rotate(-30deg) translateY(10px) } 100% { transform: rotate(-32deg) translateY(12px) } }
@keyframes lgrSmArmKoR { 0% { transform: none } 12% { transform: rotate(10deg) } 40% { transform: rotate(4deg) } 66% { transform: rotate(30deg) translateY(10px) } 100% { transform: rotate(32deg) translateY(12px) } }
@keyframes lgrSmFanKo { 0% { transform: none } 50% { transform: none } 72% { transform: scale(.7, .5) translateY(30px) } 100% { transform: scale(.66, .46) translateY(34px) } }
.lg-boss[data-motif="showman"][data-moment="ko"] .lg-showman-head { animation: lgrSmHeadKo 2400ms ease-in-out both }
.lg-boss[data-motif="showman"][data-moment="ko"] .lg-showman-comedy { animation: lgrSmComedyKo 2400ms cubic-bezier(.4,0,.6,1) both }
.lg-boss[data-motif="showman"][data-moment="ko"] .lg-showman-tragedy { animation: lgrSmTragedyKo 2400ms cubic-bezier(.4,0,.6,1) both }
.lg-boss[data-motif="showman"][data-moment="ko"] .lg-showman-arml { animation: lgrSmArmKoL 2400ms ease-in-out both }
.lg-boss[data-motif="showman"][data-moment="ko"] .lg-showman-armr { animation: lgrSmArmKoR 2400ms ease-in-out both }
.lg-boss[data-motif="showman"][data-moment="ko"] .lg-showman-fan { animation: lgrSmFanKo 2400ms ease-in both }

/* THE ABILITIES on his own parts (after the strike rules: an ability's own reaction wins on a part both touch). */
/* laugh: the crowd laughs: the Comedy mask cackles (rattles with glee), his head tips with a pleased nod. */
@keyframes lgrSmComedyCackle { 0% { transform: none } 15% { transform: rotate(-12deg) scale(1.12) } 30% { transform: rotate(10deg) scale(1.14) } 45% { transform: rotate(-8deg) scale(1.1) } 65% { transform: rotate(4deg) } 100% { transform: none } }
@keyframes lgrSmHeadNod { 0% { transform: none } 35% { transform: rotate(-4deg) translateY(2px) } 70% { transform: rotate(-1deg) } 100% { transform: none } }
.lg-boss[data-motif="showman"][data-fx="laugh"] .lg-showman-comedy { animation: lgrSmComedyCackle 340ms ease-out both }
.lg-boss[data-motif="showman"][data-fx="laugh"] .lg-showman-head { animation: lgrSmHeadNod 340ms ease-out both }
/* tear: Tragedy weeps: the mask sags and sobs twice, his head tilts back, smug. */
@keyframes lgrSmTragedySob { 0% { transform: none } 25% { transform: translateY(4px) scale(1.06, .92) } 45% { transform: translateY(2px) scale(.98, 1.04) } 65% { transform: translateY(4px) scale(1.05, .93) } 100% { transform: none } }
@keyframes lgrSmHeadSmug { 0% { transform: none } 40% { transform: rotate(5deg) translateY(-3px) } 100% { transform: none } }
.lg-boss[data-motif="showman"][data-fx="tear"] .lg-showman-tragedy { animation: lgrSmTragedySob 340ms ease-in-out both }
.lg-boss[data-motif="showman"][data-fx="tear"] .lg-showman-head { animation: lgrSmHeadSmug 340ms ease-out both }
/* encore: forced into a deep bow: the head dips low, both arms sweep out wide in a flourish, the masks are raised high,
   the fan of cards opens like applause. */
@keyframes lgrSmHeadBow { 0% { transform: none } 18% { transform: rotate(-3deg) translateY(-2px) } 46% { transform: rotate(4deg) translateY(10px) scale(.96) } 66% { transform: rotate(3deg) translateY(9px) scale(.96) } 86% { transform: translateY(-1px) } 100% { transform: none } }
@keyframes lgrSmArmFlourishL { 0% { transform: none } 18% { transform: rotate(8deg) } 46% { transform: rotate(-22deg) } 66% { transform: rotate(-20deg) } 100% { transform: none } }
@keyframes lgrSmArmFlourishR { 0% { transform: none } 18% { transform: rotate(-8deg) } 46% { transform: rotate(22deg) } 66% { transform: rotate(20deg) } 100% { transform: none } }
@keyframes lgrSmFanApplause { 0% { transform: none } 20% { transform: scale(1.12) } 30% { transform: scale(1.02) } 40% { transform: scale(1.12) } 50% { transform: scale(1.02) } 60% { transform: scale(1.1) } 100% { transform: none } }
.lg-boss[data-motif="showman"][data-fx="encore"] .lg-showman-head { animation: lgrSmHeadBow 1150ms cubic-bezier(.3,.6,.4,1) both }
.lg-boss[data-motif="showman"][data-fx="encore"] .lg-showman-arml { animation: lgrSmArmFlourishL 1150ms cubic-bezier(.3,.6,.4,1) both }
.lg-boss[data-motif="showman"][data-fx="encore"] .lg-showman-armr { animation: lgrSmArmFlourishR 1150ms cubic-bezier(.3,.6,.4,1) both }
.lg-boss[data-motif="showman"][data-fx="encore"] .lg-showman-fan { animation: lgrSmFanApplause 1150ms ease-out both }
/* twist: the act turns: both masks spin round edge on (Tragedy into Comedy), his head reels side to side. */
@keyframes lgrSmMaskTwist { 0% { transform: none } 15% { transform: scaleX(.1) } 30% { transform: scaleX(-1) rotate(-8deg) } 45% { transform: scaleX(.1) } 60% { transform: scaleX(1) rotate(6deg) } 78% { transform: rotate(-3deg) } 100% { transform: none } }
@keyframes lgrSmHeadReel { 0% { transform: none } 22% { transform: rotate(7deg) translateX(3px) } 44% { transform: rotate(-6deg) translateX(-3px) } 66% { transform: rotate(3deg) } 100% { transform: none } }
.lg-boss[data-motif="showman"][data-fx="twist"] :is(.lg-showman-comedy, .lg-showman-tragedy) { animation: lgrSmMaskTwist 780ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-motif="showman"][data-fx="twist"] .lg-showman-head { animation: lgrSmHeadReel 780ms cubic-bezier(.22,1,.36,1) both }
`,
}
