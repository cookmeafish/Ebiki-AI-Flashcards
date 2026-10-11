// What Comedy and Tragedy (abilities/showman.js) LOOKS like (design v2.1, #26). The fx contract is in fx/index.js.
//   laugh   (tick)   a rose is tossed into his ring from the crowd and two sparkles pop (he tips his hat).
//   encore  (big)    two spotlights swing in from the wings and cross on him, the house throws roses and his own cards
//                    rain back down on him, a gold ring of applause rolls out (he is forced into a deep bow).
//   tear    (tick)   a big blue tear wells out of Tragedy's own eye and runs down the mask (the lg-fx-tear layer
//                    inside each Tragedy in raids/showman.svg, so it lands on the mask in every phase); he leans back, smug.
//   twist   (medium) his own two masks spin round edge on inside a violet glow (lg-fx-twist in the SVG) and his
//                    cards whirl backwards round him (he reels). Nothing is drawn over his face.
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
      <div className="lgx lgx-full" style={{ background: 'radial-gradient(circle, transparent 52%, rgba(127, 212, 255, .22))', animation: anim('lgxFlash', 340) }} />
    </>,
    twist: () => <>
      <div className="lgx lgx-full" style={{ background: 'radial-gradient(circle, rgba(197, 139, 255, .4), transparent 58%)', animation: anim('lgxFlash', 520) }} />
      {/* his cards whirl backwards round him */}
      {/* ...on an orbit OUTSIDE his face (never crossing it) */}
      {[80, 106, 132, 158, 184, 210, 236, 262, 288].map((a, i) => card(i, { left: '50%', top: '60%', '--a': `${a}deg`, animation: anim('lgrShowmanWhirl', 760, i * 18) }))}
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
@keyframes lgrShowmanWhirl { 0% { transform: translate(-50%, -50%) rotate(var(--a)) translateY(-58px) rotate(0); opacity: 0 } 15% { opacity: 1 } 70% { opacity: 1 } 100% { transform: translate(-50%, -50%) rotate(calc(var(--a) - 70deg)) translateY(-66px) rotate(-420deg); opacity: 0 } }
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
/* THE DRAWING ACTS IT OUT, MAGIC INCLUDED: his own SVG parts (raids/showman.svg, all three phases; lg-showman-arml = the
   arm on the left of the picture: the levitating glove under Comedy in phase 1, the claw hand flung wide in phase 2, the
   raised arm gripping burning Comedy by the chin in phase 3 (mask and grip ride in the arm group); -armr = the other arm (the fist on his hip with the cane in phase 1, the other claw
   hand flung wide in phase 2; each arm group in phase 2 also carries its half of the torn cape); -head = hat, hair, face and
   horns; -comedy and -tragedy = the two living masks; -fan = HIS RING (the gold marquee ring, the violet storm the masks ride,
   the flame wings); -shadow = his horns (ghost-fire horns, horns, great horns); -fire = the ghost flame over his
   fingertips, the hellfire pillars from his palms, the violet fire off his askew hat, the crown of fire and the fire wings breaking out of his shoulders; -sigil = the brand on his brow in
   phases 2 and 3) move with every moment, his attack and each ability. Arms pivot at the shoulder (under the epaulette) in
   every phase, the head at the neck, masks, horns, fire and brand about themselves. Played only while data-moment / data-assault-on / data-fx is set. */
.lg-showman-arml, .lg-showman-armr, .lg-showman-head, .lg-showman-fan { transform-box: view-box }
.lg-p1 .lg-showman-arml { transform-origin: 17px 92px } .lg-p1 .lg-showman-armr { transform-origin: 103px 92px } .lg-p1 .lg-showman-head { transform-origin: 60px 75px }
.lg-p2 .lg-showman-arml { transform-origin: 17px 92px } .lg-p2 .lg-showman-armr { transform-origin: 103px 92px } .lg-p2 .lg-showman-head { transform-origin: 60px 75px }
.lg-p3 .lg-showman-arml { transform-origin: 17px 92px } .lg-p3 .lg-showman-armr { transform-origin: 103px 92px } .lg-p3 .lg-showman-head { transform-origin: 60px 75px }
.lg-showman-fan { transform-origin: 60px 52px } .lg-p2 .lg-showman-fan { transform-origin: 60px 44px } .lg-p3 .lg-showman-fan { transform-origin: 60px 88px }
.lg-showman-comedy, .lg-showman-tragedy { transform-box: fill-box; transform-origin: 50% 50% }
.lg-showman-shadow, .lg-showman-fire { transform-box: fill-box; transform-origin: 50% 100% }
/* the magic acts too: his demon shadow lunges with every blow and recoils when he is hit; the fire roars when he strikes,
   gutters when he is hurt, dies when he falls, and the shadow shrinks away at the knockout */
@keyframes lgrSmShadowLunge { 0% { transform: none } 14% { transform: scale(.94) rotate(-3deg) } 30% { transform: scale(1.05) rotate(4deg) } 60% { transform: scale(1.02) } 100% { transform: none } }
@keyframes lgrSmShadowRecoil { 0% { transform: none } 14% { transform: scale(.86) rotate(6deg) } 40% { transform: scale(1.04) rotate(-2deg) } 100% { transform: none } }
@keyframes lgrSmShadowKo { 0% { transform: none } 30% { transform: scale(1.1) rotate(-4deg) } 70% { transform: scale(.4) rotate(14deg) translateY(10px) } 100% { transform: scale(.3) rotate(16deg) translateY(12px) } }
@keyframes lgrSmFireRoar { 0% { transform: none } 16% { transform: scale(1, .8) } 32% { transform: scale(1.02, 1.07) } 60% { transform: scale(1.01, 1.03) } 100% { transform: none } }
@keyframes lgrSmFireGutter { 0% { transform: none } 14% { transform: scale(1, .45) } 44% { transform: scale(1, 1.1) } 100% { transform: none } }
@keyframes lgrSmFireDie { 0% { transform: none; opacity: 1 } 30% { transform: scale(1, 1.06); opacity: 1 } 70% { transform: scale(1, .2); opacity: .4 } 100% { transform: scale(1, .1); opacity: 0 } }
.lg-boss[data-motif="showman"]:is([data-assault-on], [data-moment="hurt"], [data-moment="hurtBig"]) .lg-showman-shadow { animation: lgrSmShadowLunge 1000ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"]:is([data-assault-on], [data-moment="hurt"], [data-moment="hurtBig"], [data-fx="encore"]) .lg-showman-fire { animation: lgrSmFireRoar 1000ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"]:is([data-moment="hit"], [data-moment="crit"], [data-moment="sharpen"], [data-moment="block"], [data-moment="shield"]) .lg-showman-shadow { animation: lgrSmShadowRecoil 800ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="showman"]:is([data-moment="hit"], [data-moment="crit"], [data-moment="sharpen"], [data-fx="tear"], [data-fx="twist"]) .lg-showman-fire { animation: lgrSmFireGutter 800ms ease-out both }
.lg-boss[data-motif="showman"][data-moment="ko"] .lg-showman-shadow { animation: lgrSmShadowKo 2400ms ease-in-out both }
.lg-boss[data-motif="showman"][data-moment="ko"] .lg-showman-fire { animation: lgrSmFireDie 2400ms ease-in both }
/* phase 3's masks float at his cheeks: on his blows they lunge OUTWARD and back (never over his face) */
@keyframes lgrSmGiantLungeL { 0% { transform: none } 18% { transform: scale(.9) rotate(10deg) } 34% { transform: translate(-8px, -6px) scale(1.18) rotate(-24deg) } 60% { transform: translate(-3px, -2px) scale(1.06) rotate(-8deg) } 100% { transform: none } }
@keyframes lgrSmGiantLungeR { 0% { transform: none } 18% { transform: scale(.9) rotate(-10deg) } 34% { transform: translate(8px, -6px) scale(1.18) rotate(24deg) } 60% { transform: translate(3px, -2px) scale(1.06) rotate(8deg) } 100% { transform: none } }
.lg-boss[data-motif="showman"]:is([data-assault-on], [data-moment="hurt"], [data-moment="hurtBig"], [data-moment="crit"], [data-moment="block"], [data-moment="shield"]) .lg-p3 .lg-showman-comedy { animation: lgrSmGiantLungeL 1000ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"]:is([data-assault-on], [data-moment="hurt"], [data-moment="hurtBig"], [data-moment="crit"], [data-moment="block"], [data-moment="shield"]) .lg-p3 .lg-showman-tragedy { animation: lgrSmGiantLungeR 1000ms cubic-bezier(.3,0,.3,1) both }
/* beaten, the grin finally drops: the knockout face (eyes squeezed shut, a grimace) replaces his eyes and mouth */
.lg-boss[data-motif="showman"]:is([data-moment="ko"], [data-down]) .lg-showman-koface { display: inline !important }
.lg-boss[data-motif="showman"]:is([data-moment="ko"], [data-down]) .lg-showman-kohide { display: none !important }
/* phase 3's brand flares with his blows and burns out at the knockout */
.lg-showman-sigil { transform-box: fill-box; transform-origin: 50% 50% }
@keyframes lgrSmSigilFlare { 0% { transform: none } 18% { transform: scale(.94) rotate(-4deg) } 34% { transform: scale(1.12) rotate(6deg) } 100% { transform: none } }
@keyframes lgrSmSigilKo { 0% { transform: none } 40% { transform: scale(1.08) rotate(10deg) } 100% { transform: scale(.25) rotate(120deg) } }
.lg-boss[data-motif="showman"]:is([data-assault-on], [data-moment="hurt"], [data-moment="hurtBig"], [data-moment="crit"], [data-fx="encore"]) .lg-showman-sigil { animation: lgrSmSigilFlare 1000ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="ko"] .lg-showman-sigil { animation: lgrSmSigilKo 2400ms ease-in both }
/* the arms whip OUTWARD on a strike (a negative k), so a flung mask never crosses his face */
:is(.lg-showman-arml, .lg-showman-armr) { --sm-k: -.5 }
.lg-p3 :is(.lg-showman-arml, .lg-showman-armr) { --sm-k: -.35 }
.lg-boss[data-moment="hurtBig"] .lg-p3 :is(.lg-showman-arml, .lg-showman-armr) { --sm-k: -.18 }

/* HIS STRIKE (data-assault-on from the first frame, then data-moment="hurt"): a magician's flourish turned deadly. He
   draws back (100 ms), then FLINGS: the Comedy arm whips through and the Comedy mask spins off it at the camera like a
   thrown blade and snaps back, the other hand flicks out and his ring flares, his chin juts with a grin. */
@keyframes lgrSmArmStrikeL { 0% { transform: none } 11% { transform: rotate(calc(-14deg * var(--sm-k, 1))) } 17% { transform: rotate(calc(-16deg * var(--sm-k, 1))) }
  26% { transform: rotate(calc(22deg * var(--sm-k, 1))) scale(1.04) } 34% { transform: rotate(calc(17deg * var(--sm-k, 1))) scale(1.03) } 60% { transform: rotate(calc(8deg * var(--sm-k, 1))) scale(1.03) } 100% { transform: none } }
@keyframes lgrSmArmStrikeR { 0% { transform: none } 11% { transform: rotate(calc(10deg * var(--sm-k, 1))) } 17% { transform: rotate(calc(12deg * var(--sm-k, 1))) }
  26% { transform: rotate(calc(-18deg * var(--sm-k, 1))) scale(1.04) } 34% { transform: rotate(calc(-14deg * var(--sm-k, 1))) scale(1.03) } 60% { transform: rotate(calc(-6deg * var(--sm-k, 1))) } 100% { transform: none } }
@keyframes lgrSmMaskThrow { 0% { transform: none } 11% { transform: rotate(-20deg) scale(.95) } 17% { transform: rotate(-24deg) scale(.95) }
  30% { transform: translate(6px, 30px) rotate(330deg) scale(1.15) } 44% { transform: translate(4px, 22px) rotate(540deg) scale(1.1) }
  66% { transform: translate(4px, 2px) rotate(700deg) scale(1.1) } 78% { transform: rotate(735deg) } 88% { transform: rotate(712deg) } 100% { transform: rotate(720deg) } }
@keyframes lgrSmMaskFlick { 0% { transform: none } 11% { transform: rotate(10deg) } 26% { transform: rotate(-24deg) scale(1.16) } 45% { transform: rotate(8deg) } 64% { transform: rotate(-4deg) } 100% { transform: none } }
@keyframes lgrSmHeadStrike { 0% { transform: none } 11% { transform: rotate(-7deg) } 17% { transform: rotate(-8deg) }
  27% { transform: rotate(6deg) scale(1.02) } 48% { transform: rotate(3deg) scale(1.01) } 100% { transform: none } }
@keyframes lgrSmFanStrike { 0% { transform: none } 11% { transform: scale(.94) } 26% { transform: scale(1.05) rotate(3deg) } 40% { transform: scale(1.03) rotate(-2deg) } 100% { transform: none } }
.lg-boss[data-motif="showman"][data-assault-on] .lg-showman-arml, .lg-boss[data-motif="showman"][data-moment="hurt"] .lg-showman-arml { animation: lgrSmArmStrikeL 900ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"][data-assault-on] .lg-showman-armr, .lg-boss[data-motif="showman"][data-moment="hurt"] .lg-showman-armr { animation: lgrSmArmStrikeR 900ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"][data-assault-on] .lg-showman-comedy, .lg-boss[data-motif="showman"][data-moment="hurt"] .lg-showman-comedy { animation: lgrSmMaskThrow 900ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"][data-assault-on] .lg-showman-tragedy, .lg-boss[data-motif="showman"][data-moment="hurt"] .lg-showman-tragedy { animation: lgrSmMaskFlick 900ms ease-out both }
.lg-boss[data-motif="showman"][data-assault-on] .lg-showman-head, .lg-boss[data-motif="showman"][data-moment="hurt"] .lg-showman-head { animation: lgrSmHeadStrike 900ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"][data-assault-on] .lg-showman-fan, .lg-boss[data-motif="showman"][data-moment="hurt"] .lg-showman-fan { animation: lgrSmFanStrike 900ms cubic-bezier(.3,0,.3,1) both }

/* HIS HEAVY BLOW (data-moment="hurtBig", 100 ms in, from the drawn-back pose): BOTH masks are hurled at you at once
   (Comedy spins in from the left, Tragedy from the right), both arms follow through, the card fan bursts wide. */
@keyframes lgrSmArmHeavyL { 0% { transform: rotate(calc(-14deg * var(--sm-k, 1))) } 16% { transform: rotate(calc(-24deg * var(--sm-k, 1))) } 20% { transform: rotate(calc(-25deg * var(--sm-k, 1))) }
  30% { transform: rotate(calc(30deg * var(--sm-k, 1))) scale(1.05) } 38% { transform: rotate(calc(24deg * var(--sm-k, 1))) scale(1.01) } 70% { transform: rotate(calc(10deg * var(--sm-k, 1))) scale(1.01) } 100% { transform: none } }
@keyframes lgrSmArmHeavyR { 0% { transform: rotate(calc(10deg * var(--sm-k, 1))) } 16% { transform: rotate(calc(22deg * var(--sm-k, 1))) } 20% { transform: rotate(calc(23deg * var(--sm-k, 1))) }
  30% { transform: rotate(calc(-28deg * var(--sm-k, 1))) scale(1.05) } 38% { transform: rotate(calc(-22deg * var(--sm-k, 1))) scale(1.01) } 70% { transform: rotate(calc(-9deg * var(--sm-k, 1))) scale(1.01) } 100% { transform: none } }
@keyframes lgrSmComedyHeavy { 0% { transform: rotate(-20deg) scale(.95) } 18% { transform: rotate(-40deg) scale(.9) } 32% { transform: translate(6px, 36px) rotate(380deg) scale(1.18) }
  46% { transform: translate(4px, 26px) rotate(560deg) scale(1.12) } 70% { transform: translate(2px, 4px) rotate(700deg) scale(1.05) } 82% { transform: rotate(732deg) } 100% { transform: rotate(720deg) } }
@keyframes lgrSmTragedyHeavy { 0% { transform: rotate(10deg) } 18% { transform: rotate(30deg) scale(.9) } 34% { transform: translate(-6px, 36px) rotate(-380deg) scale(1.18) }
  48% { transform: translate(-4px, 26px) rotate(-560deg) scale(1.12) } 72% { transform: translate(-2px, 4px) rotate(-700deg) scale(1.05) } 84% { transform: rotate(-732deg) } 100% { transform: rotate(-720deg) } }
@keyframes lgrSmHeadHeavy { 0% { transform: rotate(-7deg) } 18% { transform: rotate(-10deg) } 30% { transform: rotate(8deg) scale(1.04) }
  40% { transform: rotate(5deg) scale(1.03) } 70% { transform: rotate(2deg) scale(1.01) } 100% { transform: none } }
@keyframes lgrSmFanHeavy { 0% { transform: scale(.94) } 18% { transform: scale(.88) } 30% { transform: scale(1.06) } 38% { transform: scale(1.04) rotate(-2deg) } 50% { transform: scale(1.05) rotate(2deg) } 100% { transform: none } }
.lg-boss[data-motif="showman"][data-moment="hurtBig"] .lg-showman-arml { animation: lgrSmArmHeavyL 1150ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="hurtBig"] .lg-showman-armr { animation: lgrSmArmHeavyR 1150ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="hurtBig"] .lg-showman-comedy { animation: lgrSmComedyHeavy 1150ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="hurtBig"] .lg-showman-tragedy { animation: lgrSmTragedyHeavy 1150ms cubic-bezier(.3,0,.3,1) both }
/* phase 2 holds the masks beside his face on a tilt: they are hurled OUT and away from it, never across it */
@keyframes lgrSmComedyHeavyP2 { 0% { transform: rotate(-20deg) scale(.95) } 18% { transform: rotate(-40deg) scale(.9) } 32% { transform: translate(-3px, 28px) rotate(380deg) scale(1.07) }
  46% { transform: translate(-2px, 20px) rotate(560deg) scale(1.05) } 70% { transform: translate(-2px, 4px) rotate(700deg) scale(1.04) } 82% { transform: rotate(732deg) } 100% { transform: rotate(720deg) } }
@keyframes lgrSmTragedyHeavyP2 { 0% { transform: none } 16% { transform: rotate(14deg) scale(.92) } 34% { transform: rotate(-22deg) scale(1.14) }
  52% { transform: rotate(12deg) scale(1.06) } 72% { transform: rotate(-5deg) } 100% { transform: none } }
.lg-boss[data-motif="showman"][data-moment="hurtBig"] .lg-p2 .lg-showman-comedy { animation-name: lgrSmComedyHeavyP2 }
.lg-boss[data-motif="showman"][data-moment="hurtBig"] .lg-p2 .lg-showman-tragedy { animation-name: lgrSmTragedyHeavyP2 }
.lg-boss[data-motif="showman"][data-moment="hurtBig"] .lg-showman-head { animation: lgrSmHeadHeavy 1150ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="hurtBig"] .lg-showman-fan { animation: lgrSmFanHeavy 1150ms cubic-bezier(.3,0,.3,1) both }

/* HIT: the blow knocks his head aside, the Comedy mask's grin is jolted crooked, the Tragedy mask bobs. */
@keyframes lgrSmHeadHit { 0% { transform: none } 12% { transform: rotate(14deg) } 30% { transform: rotate(-5deg) } 50% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgrSmMaskJolt { 0% { transform: none } 12% { transform: rotate(-34deg) translate(-3px, -5px) scale(1.1) } 34% { transform: rotate(12deg) } 56% { transform: rotate(-4deg) } 100% { transform: none } }
@keyframes lgrSmMaskBob { 0% { transform: none } 14% { transform: translateY(7px) rotate(14deg) } 40% { transform: translateY(-3px) rotate(-6deg) } 100% { transform: none } }
.lg-boss[data-motif="showman"][data-moment="hit"] .lg-showman-head { animation: lgrSmHeadHit 700ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="hit"] .lg-showman-comedy { animation: lgrSmMaskJolt 700ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="hit"] .lg-showman-tragedy { animation: lgrSmMaskBob 700ms ease-out both }

/* CRIT: the Comedy mask is knocked clean out of his act, cartwheels up and away and lands back in place; his head
   whips round, the arms flail, his ring shudders. */
@keyframes lgrSmComedyCrit { 0% { transform: none } 10% { transform: translate(-4px, 6px) rotate(-90deg) } 30% { transform: translate(-6px, 14px) rotate(-300deg) scale(.9) }
  52% { transform: translate(-2px, 4px) rotate(-640deg) } 60% { transform: rotate(-735deg) } 70% { transform: rotate(-710deg) } 82% { transform: rotate(-724deg) } 100% { transform: rotate(-720deg) } }
@keyframes lgrSmHeadCrit { 0% { transform: none } 10% { transform: rotate(14deg) scale(.95) } 28% { transform: rotate(-6deg) } 46% { transform: rotate(3deg) } 100% { transform: none } }
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
@keyframes lgrSmHeadSharpen { 0% { transform: none } 8% { transform: rotate(6deg) } 20% { transform: none } 30% { transform: rotate(-6deg) } 46% { transform: rotate(2deg) } 100% { transform: none } }
.lg-boss[data-motif="showman"][data-moment="sharpen"] :is(.lg-showman-comedy, .lg-showman-tragedy) { animation: lgrSmMaskSlash 760ms linear both }
.lg-boss[data-motif="showman"][data-moment="sharpen"] .lg-showman-head { animation: lgrSmHeadSharpen 760ms cubic-bezier(.2,.8,.3,1) both }

/* BLOCK: his flourish is parried: the Comedy arm lunges in, is batted back past his shoulder and the mask spins on
   its baton; he flinches back. */
@keyframes lgrSmArmBlock { 0% { transform: none } 14% { transform: rotate(18deg) scale(1.08) } 22% { transform: rotate(19deg) scale(1.08) } 32% { transform: rotate(-24deg) scale(.96) }
  48% { transform: rotate(-9deg) } 66% { transform: rotate(4deg) } 100% { transform: none } }
@keyframes lgrSmMaskParried { 0% { transform: none } 22% { transform: rotate(10deg) } 34% { transform: rotate(-200deg) } 52% { transform: rotate(-330deg) } 64% { transform: rotate(-368deg) } 76% { transform: rotate(-356deg) } 100% { transform: rotate(-360deg) } }
@keyframes lgrSmHeadBlock { 0% { transform: none } 14% { transform: rotate(-4deg) } 32% { transform: rotate(-10deg) } 56% { transform: rotate(3deg) } 100% { transform: none } }
.lg-boss[data-motif="showman"][data-moment="block"] .lg-showman-arml { animation: lgrSmArmBlock 800ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="block"] .lg-showman-comedy { animation: lgrSmMaskParried 800ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="block"] .lg-showman-head { animation: lgrSmHeadBlock 800ms ease-out both }

/* SHIELD: the thrown Tragedy mask glances off the dome: it flies out, ricochets sideways and wobbles home; his arm
   overreaches after it and his head follows, put out. */
@keyframes lgrSmTragedyGlance { 0% { transform: none } 22% { transform: translate(-4px, 24px) rotate(-120deg) scale(1.15) } 34% { transform: translate(4px, 14px) rotate(-60deg) scale(1.08) }
  58% { transform: translate(3px, -2px) rotate(-20deg) } 76% { transform: rotate(8deg) } 100% { transform: none } }
@keyframes lgrSmArmShield { 0% { transform: none } 14% { transform: rotate(8deg) } 26% { transform: rotate(-16deg) scale(1.07) } 40% { transform: rotate(-26deg) scale(1.05) } 64% { transform: rotate(-8deg) } 100% { transform: none } }
@keyframes lgrSmHeadShield { 0% { transform: none } 26% { transform: rotate(-4deg) } 40% { transform: rotate(-8deg) } 64% { transform: rotate(3deg) } 100% { transform: none } }
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

/* KNOCKOUT, THE CURTAIN CALL: he takes one last deep bow, then the magic breaks: both masks lose their spell and
   tumble down out of the light, the arms drop, the head hangs, his ring collapses, the fire dies, his horns
   shrink away and the brand burns out. */
@keyframes lgrSmHeadKo { 0% { transform: none } 12% { transform: rotate(-6deg) } 34% { transform: rotate(4deg) scale(.97) } 46% { transform: rotate(2deg) }
  66% { transform: rotate(11deg) scale(.95) } 100% { transform: rotate(12deg) scale(.95) } }
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
@keyframes lgrSmHeadNod { 0% { transform: none } 35% { transform: rotate(-4deg) } 70% { transform: rotate(-1deg) } 100% { transform: none } }
.lg-boss[data-motif="showman"][data-fx="laugh"] .lg-showman-comedy { animation: lgrSmComedyCackle 340ms ease-out both }
.lg-boss[data-motif="showman"][data-fx="laugh"] .lg-showman-head { animation: lgrSmHeadNod 340ms ease-out both }
/* tear: Tragedy weeps: the mask sags and sobs twice, his head tilts back, smug. */
@keyframes lgrSmTragedySob { 0% { transform: none } 25% { transform: translateY(4px) scale(1.06, .92) } 45% { transform: translateY(2px) scale(.98, 1.04) } 65% { transform: translateY(4px) scale(1.05, .93) } 100% { transform: none } }
@keyframes lgrSmHeadSmug { 0% { transform: none } 40% { transform: rotate(5deg) } 100% { transform: none } }
.lg-boss[data-motif="showman"][data-fx="tear"] .lg-showman-tragedy { animation: lgrSmTragedySob 340ms ease-in-out both }
.lg-boss[data-motif="showman"][data-fx="tear"] .lg-showman-head { animation: lgrSmHeadSmug 340ms ease-out both }
/* encore: forced into a deep bow: the head dips low, both arms sweep out wide in a flourish, the masks are raised high,
   his ring pulses like applause. */
@keyframes lgrSmHeadBow { 0% { transform: none } 18% { transform: rotate(-3deg) } 46% { transform: rotate(4deg) scale(.96) } 66% { transform: rotate(3deg) scale(.96) } 86% { transform: none } 100% { transform: none } }
@keyframes lgrSmArmFlourishL { 0% { transform: none } 18% { transform: rotate(calc(8deg * var(--sm-f, 1))) } 46% { transform: rotate(calc(-22deg * var(--sm-f, 1))) } 66% { transform: rotate(calc(-20deg * var(--sm-f, 1))) } 100% { transform: none } }
@keyframes lgrSmArmFlourishR { 0% { transform: none } 18% { transform: rotate(calc(-8deg * var(--sm-f, 1))) } 46% { transform: rotate(calc(22deg * var(--sm-f, 1))) } 66% { transform: rotate(calc(20deg * var(--sm-f, 1))) } 100% { transform: none } }
/* phase 3's steepled hands only part a little: a smaller flourish */
.lg-p1 :is(.lg-showman-arml, .lg-showman-armr) { --sm-f: .55 }
.lg-p3 :is(.lg-showman-arml, .lg-showman-armr) { --sm-f: .3 }
@keyframes lgrSmFanApplause { 0% { transform: none } 20% { transform: scale(1.12) } 30% { transform: scale(1.02) } 40% { transform: scale(1.12) } 50% { transform: scale(1.02) } 60% { transform: scale(1.1) } 100% { transform: none } }
.lg-boss[data-motif="showman"][data-fx="encore"] .lg-showman-head { animation: lgrSmHeadBow 1150ms cubic-bezier(.3,.6,.4,1) both }
.lg-boss[data-motif="showman"][data-fx="encore"] .lg-showman-arml { animation: lgrSmArmFlourishL 1150ms cubic-bezier(.3,.6,.4,1) both }
.lg-boss[data-motif="showman"][data-fx="encore"] .lg-showman-armr { animation: lgrSmArmFlourishR 1150ms cubic-bezier(.3,.6,.4,1) both }
.lg-boss[data-motif="showman"][data-fx="encore"] .lg-showman-fan { animation: lgrSmFanApplause 1150ms ease-out both }
/* twist: the act turns: both masks spin round edge on (Tragedy into Comedy), his head reels side to side. */
@keyframes lgrSmMaskTwist { 0% { transform: none } 15% { transform: scaleX(.1) } 30% { transform: scaleX(-1) rotate(-8deg) } 45% { transform: scaleX(.1) } 60% { transform: scaleX(1) rotate(6deg) } 78% { transform: rotate(-3deg) } 100% { transform: none } }
@keyframes lgrSmHeadReel { 0% { transform: none } 22% { transform: rotate(7deg) } 44% { transform: rotate(-6deg) } 66% { transform: rotate(3deg) } 100% { transform: none } }
.lg-boss[data-motif="showman"][data-fx="twist"] :is(.lg-showman-comedy, .lg-showman-tragedy) { animation: lgrSmMaskTwist 780ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-motif="showman"][data-fx="twist"] .lg-showman-head { animation: lgrSmHeadReel 780ms cubic-bezier(.22,1,.36,1) both }
/* tear: the drop wells out of Tragedy's eye and runs down the mask (the lg-fx-tear layer, shown by the arena) */
@keyframes lgrSmTearRun { 0% { transform: translateY(-2px) scale(.3); opacity: 0 } 25% { transform: none; opacity: 1 } 100% { transform: translateY(7px) scale(.9, 1.15); opacity: .2 } }
.lg-boss[data-motif="showman"][data-fx="tear"] .lgfa-showman-tear { transform-box: fill-box; transform-origin: 50% 0; animation: lgrSmTearRun 340ms ease-in both }
/* THE HELD MASKS (phase 3): each mask, its blaze and the hand gripping its chin are one group inside the arm, pivoting
   at the grip (its bottom centre), so every reaction moves mask and fingers together and the hand never lets go. These
   come after the free-mask rules above and win on the same specificity. */
.lg-p3 :is(.lg-showman-comedy, .lg-showman-tragedy) { transform-origin: 50% 94% }
@keyframes lgrSmHeldJolt { 0% { transform: none } 22% { transform: rotate(-9deg) scale(1.03) } 50% { transform: rotate(6deg) } 76% { transform: rotate(-3deg) } 100% { transform: none } }
@keyframes lgrSmHeldHeavy { 0% { transform: none } 16% { transform: rotate(8deg) scale(.95) } 34% { transform: rotate(-10deg) scale(1.05) } 52% { transform: rotate(6deg) scale(1.02) } 72% { transform: rotate(-3deg) } 100% { transform: none } }
@keyframes lgrSmHeldSob { 0% { transform: none } 25% { transform: rotate(6deg) scale(1.04, .94) } 45% { transform: rotate(2deg) scale(.98, 1.03) } 65% { transform: rotate(6deg) scale(1.04, .94) } 100% { transform: none } }
@keyframes lgrSmHeldTwist { 0% { transform: none } 18% { transform: scaleX(.35) rotate(-6deg) } 36% { transform: scaleX(.9) rotate(10deg) } 54% { transform: scaleX(.35) rotate(-4deg) } 72% { transform: scaleX(1.05) rotate(4deg) } 100% { transform: none } }
@keyframes lgrSmHeldSulk { 0% { transform: none } 30% { transform: rotate(16deg) scale(.94) } 75% { transform: rotate(14deg) scale(.95) } 100% { transform: none } }
@keyframes lgrSmHeldDrop { 0% { transform: none } 40% { transform: rotate(8deg) } 100% { transform: rotate(-34deg) scale(.92) } }
@keyframes lgrSmHeldDropR { 0% { transform: none } 40% { transform: rotate(-8deg) } 100% { transform: rotate(30deg) scale(.92) } }
@keyframes lgrSmHeldCackle { 0% { transform: none } 20% { transform: rotate(-10deg) scale(1.08) } 45% { transform: rotate(8deg) scale(1.08) } 70% { transform: rotate(-4deg) } 100% { transform: none } }
.lg-boss[data-motif="showman"]:is([data-assault-on], [data-moment="hit"], [data-moment="hurt"], [data-moment="crit"], [data-moment="sharpen"], [data-moment="block"], [data-moment="shield"]) .lg-p3 :is(.lg-showman-comedy, .lg-showman-tragedy) { animation: lgrSmHeldJolt 760ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="hurtBig"] .lg-p3 :is(.lg-showman-comedy, .lg-showman-tragedy) { animation: lgrSmHeldHeavy 1150ms cubic-bezier(.3,0,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="wind"] .lg-p3 :is(.lg-showman-comedy, .lg-showman-tragedy) { animation: lgrSmHeldSulk 900ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="showman"][data-moment="ko"] .lg-p3 .lg-showman-comedy { animation: lgrSmHeldDrop 2400ms ease-in both }
.lg-boss[data-motif="showman"][data-moment="ko"] .lg-p3 .lg-showman-tragedy { animation: lgrSmHeldDropR 2400ms ease-in both }
.lg-boss[data-motif="showman"][data-fx="laugh"] .lg-p3 .lg-showman-comedy { animation: lgrSmHeldCackle 340ms ease-out both }
.lg-boss[data-motif="showman"][data-fx="tear"] .lg-p3 .lg-showman-tragedy { animation: lgrSmHeldSob 340ms ease-in-out both }
.lg-boss[data-motif="showman"][data-fx="twist"] .lg-p3 :is(.lg-showman-comedy, .lg-showman-tragedy) { animation: lgrSmHeldTwist 780ms cubic-bezier(.22,1,.36,1) both }
/* phase 3's arms are RAISED, so the shared swings would fling the held masks out of frame: smaller arcs here, the parry
   a short check toward his face, the knockout a slump of both arms down and OUT, the masks tipping away from his face */
@keyframes lgrSmArmBlockP3 { 0% { transform: none } 14% { transform: rotate(8deg) } 32% { transform: rotate(-8deg) scale(.97) } 56% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgrSmArmKoP3L { 0% { transform: none; opacity: 1 } 12% { transform: rotate(5deg); opacity: 1 } 40% { transform: rotate(2deg); opacity: 1 } 66% { transform: rotate(-9deg) translateY(9px); opacity: .2 } 100% { transform: rotate(-8deg) translateY(10px); opacity: 0 } }
@keyframes lgrSmArmKoP3R { 0% { transform: none; opacity: 1 } 12% { transform: rotate(-5deg); opacity: 1 } 40% { transform: rotate(-2deg); opacity: 1 } 66% { transform: rotate(9deg) translateY(9px); opacity: .2 } 100% { transform: rotate(8deg) translateY(10px); opacity: 0 } }
.lg-boss[data-motif="showman"][data-moment="block"] .lg-p3 .lg-showman-arml { animation-name: lgrSmArmBlockP3 }
.lg-boss[data-motif="showman"][data-moment="ko"] .lg-p3 .lg-showman-arml { animation-name: lgrSmArmKoP3L }
.lg-boss[data-motif="showman"][data-moment="ko"] .lg-p3 .lg-showman-armr { animation-name: lgrSmArmKoP3R }
/* KNOCKED OUT: the cinematic ends in this pose and data-down HOLDS it (each value = the last keyframe of its knockout
   animation above), so the defeated drawing never pops back upright when the cinematic's moment ends */
.lg-boss[data-motif="showman"][data-down]:not([data-moment="ko"]) .lg-showman-arml { transform: rotate(-32deg) translateY(12px) }
.lg-boss[data-motif="showman"][data-down]:not([data-moment="ko"]) .lg-showman-armr { transform: rotate(32deg) translateY(12px) }
.lg-boss[data-motif="showman"][data-down]:not([data-moment="ko"]) .lg-p3 .lg-showman-arml { transform: rotate(-8deg) translateY(10px); opacity: 0 }
.lg-boss[data-motif="showman"][data-down]:not([data-moment="ko"]) .lg-p3 .lg-showman-armr { transform: rotate(8deg) translateY(10px); opacity: 0 }
.lg-boss[data-motif="showman"][data-down]:not([data-moment="ko"]) .lg-showman-head { transform: rotate(12deg) scale(.95) }
.lg-boss[data-motif="showman"][data-down]:not([data-moment="ko"]) .lg-showman-comedy { transform: translate(-8px, 56px) rotate(-246deg) }
.lg-boss[data-motif="showman"][data-down]:not([data-moment="ko"]) .lg-showman-tragedy { transform: translate(8px, 56px) rotate(226deg) }
.lg-boss[data-motif="showman"][data-down]:not([data-moment="ko"]) .lg-p3 .lg-showman-comedy { transform: rotate(-34deg) scale(.92) }
.lg-boss[data-motif="showman"][data-down]:not([data-moment="ko"]) .lg-p3 .lg-showman-tragedy { transform: rotate(30deg) scale(.92) }
.lg-boss[data-motif="showman"][data-down]:not([data-moment="ko"]) .lg-showman-fan { transform: scale(.66, .46) translateY(34px) }
.lg-boss[data-motif="showman"][data-down]:not([data-moment="ko"]) .lg-showman-shadow { transform: scale(.3) rotate(16deg) translateY(12px) }
.lg-boss[data-motif="showman"][data-down]:not([data-moment="ko"]) .lg-showman-fire { transform: scale(1, .1); opacity: 0 }
.lg-boss[data-motif="showman"][data-down]:not([data-moment="ko"]) .lg-showman-sigil { transform: scale(.25) rotate(120deg) }
/* THE FALLEN ARMS (phase 3): as the curtain closes the raised arms fade out and the limp ones fade in (forearms
   hanging, gloves open, Comedy slipping from his fingers upside down and cracked, Tragedy tipped off the other hand),
   while the whole figure is lifted a little (lg-showman-stage) so face, gloves and masks sit clear above the DEFEATED!
   tag. The held pose below ends exactly where the cinematic does (check-ko-hold). */
.lg-showman-stage { transform-box: view-box; transform-origin: 60px 0px }
.lg-boss[data-motif="showman"][data-down] .lg-showman-armsfallen { display: inline !important }
@keyframes lgrSmArmsFallenIn { 0% { opacity: 0 } 48% { opacity: 0 } 70% { opacity: .85 } 100% { opacity: 1 } }
@keyframes lgrSmStageDrop { 0% { transform: none } 45% { transform: none } 70% { transform: translate(0px, -30px) scale(.88) } 100% { transform: translate(0px, -30px) scale(.88) } }
.lg-boss[data-motif="showman"][data-moment="ko"] .lg-showman-armsfallen { animation: lgrSmArmsFallenIn 2400ms ease-in-out both }
.lg-boss[data-motif="showman"][data-moment="ko"] .lg-showman-stage { animation: lgrSmStageDrop 2400ms ease-in-out both }
.lg-boss[data-motif="showman"][data-down]:not([data-moment="ko"]) .lg-showman-armsfallen { opacity: 1 }
.lg-boss[data-motif="showman"][data-down]:not([data-moment="ko"]) .lg-showman-stage { transform: translate(0px, -30px) scale(.88) }
/* phase 3's fire wings burn out with him (folded wings left spikes poking up behind the fallen shoulders) */
@keyframes lgrSmFanKoP3 { 0% { transform: none; opacity: 1 } 50% { transform: none; opacity: 1 } 72% { transform: scale(.7, .5) translateY(30px); opacity: .2 } 100% { transform: scale(.66, .46) translateY(34px); opacity: 0 } }
.lg-boss[data-motif="showman"][data-moment="ko"] .lg-p3 .lg-showman-fan { animation-name: lgrSmFanKoP3 }
.lg-boss[data-motif="showman"][data-down]:not([data-moment="ko"]) .lg-p3 .lg-showman-fan { opacity: 0 }
`,
}
