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
      {rose('r', { left: '8%', top: '78%', '--spin': '0deg', animation: anim('lgrShowmanToss', 340, 0, 'cubic-bezier(.3,.7,.4,1)') })}
      {[0, 1].map((i) => <div key={i} className="lgx" style={{ left: `${34 + i * 30}%`, top: `${30 + i * 6}%`, width: 8, height: 8, background: T.gold, clipPath: 'polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%)', '--h': '-16px', animation: anim('lgxRise', 300, 60 + i * 60) }} />)}
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
      <div className="lgx" style={{ right: '17%', top: '14%', width: 9, height: 12, borderRadius: '50% 50% 50% 50% / 64% 64% 36% 36%', background: `radial-gradient(circle at 40% 60%, ${T.white}, ${T.tear} 55%, #2f8fd0)`, border: `1.5px solid ${T.ink}`, animation: anim('lgrShowmanTear', 340, 0, 'ease-in') }} />
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
`,
}
