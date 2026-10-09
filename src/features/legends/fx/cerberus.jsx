// What Shackles (abilities/cerberus.js) LOOKS like (design v2.1, #27). The fx contract is in fx/index.js.
//   bindFire   (tick)   a chain lashes in from the left and wraps the Fire head's snout, embers spit (the head is
//                       yanked down and to the side).
//   bindIron   (tick)   a padlock slams shut on the Iron head's chain with a spark ring (the head is jerked down).
//   bindShadow (tick)   its own smoke is pulled out of the shadows into a chain (the Shadow head is dragged right).
//   bound      (big)    three chains shoot in and meet over him, the gate's iron bars crash down in front of him and
//                       a great padlock clamps shut (he is slammed down and strains against it, every head pinned).
//   snap       (medium) the Fire head's chain bursts: links fly, its mane flares (it rears up and shakes its head).
import { center, anim, around, ring, shards } from './_kit'

// Fixed bright colors (never theme tokens over the art).
const T = { iron: '#9aa3b3', ironHi: '#e3e8f0', ironLo: '#4a5160', ink: '#1d2230', fire: '#ff7a1a', fireHi: '#ffd36a', ember: '#ff4a1c', smoke: '#7a5aa8', smokeHi: '#c8a8ff', gold: '#ffc23a', soul: '#5ff0d2' }

// A chain: rings alternating with edge-on bars, ink under a light stroke.
const chain = (n, extra, key = 'c', size = 9) => (
  <div key={key} className="lgx" style={{ display: 'flex', alignItems: 'center', ...extra }}>
    {Array.from({ length: n }, (_, i) => (i % 2
      ? <div key={i} style={{ width: size * 0.9, height: size * 0.32, marginLeft: -size * 0.18, borderRadius: size, background: T.ironLo, border: `1.5px solid ${T.ink}`, boxShadow: `inset 0 1px 0 ${T.ironHi}` }} />
      : <div key={i} style={{ width: size * 1.15, height: size * 0.8, marginLeft: -size * 0.18, borderRadius: '50%', border: `${size * 0.26}px solid ${T.iron}`, boxShadow: `0 0 0 1.5px ${T.ink}, inset 0 0 0 1.5px ${T.ink}` }} />))}
  </div>
)
const padlock = (extra, key = 'p', s = 1) => (
  <div key={key} className="lgx" style={{ width: 22 * s, height: 26 * s, marginLeft: -11 * s, marginTop: -13 * s, ...extra }}>
    <div style={{ position: 'absolute', left: 4 * s, top: 0, width: 14 * s, height: 14 * s, borderRadius: `${7 * s}px ${7 * s}px 0 0`, border: `${3 * s}px solid ${T.iron}`, borderBottom: 'none', boxShadow: `0 0 0 1.5px ${T.ink}` }} />
    <div style={{ position: 'absolute', left: 0, top: 10 * s, width: 22 * s, height: 16 * s, borderRadius: 3 * s, background: `linear-gradient(${T.gold}, #b07a12)`, border: `1.5px solid ${T.ink}` }}>
      <div style={{ position: 'absolute', left: '50%', top: 4 * s, width: 4 * s, height: 7 * s, marginLeft: -2 * s, borderRadius: 2 * s, background: T.ink }} />
    </div>
  </div>
)
// THE DRAWING ACTS IT OUT (impact/bosses/README.md): his own parts in raids/cerberus.svg move for every strike moment,
// his attack on you and the abilities, keyed by the arena's data-moment / data-assault-on and .lgr-cerberus-<fx>. The
// three heads are the art's own hook groups (lgfa-cerberus-fire / iron / shadow, the key), plus lg-cerberus-pawl /
// pawr (front paws) and chainl / chainr (side chains). Here (not cerberus.parts.jsx) because this CSS is in the arena all
// fight long and his attack lands on ability blows too. Transforms and opacity only; the dead pose holds while greyed.
const B = '.lg-boss[data-motif="cerberus"]'
const SEL = { fire: '.lgfa-cerberus-fire', iron: '.lgfa-cerberus-iron', shadow: '.lgfa-cerberus-shadow', key: '.lgfa-cerberus-key', pawl: '.lg-cerberus-pawl', pawr: '.lg-cerberus-pawr', chainl: '.lg-cerberus-chainl', chainr: '.lg-cerberus-chainr' }
const PIVOT = { fire: '60% 95%', iron: '50% 95%', shadow: '40% 95%', key: '50% 0%' }
const on = (state, parts) => Object.entries(parts).map(([p, a]) => `${B}${state} ${SEL[p]} { ${PIVOT[p] ? `transform-box: fill-box; transform-origin: ${PIVOT[p]}; ` : ''}animation: ${a} }`).join('\n')
const DRAWING = `
@keyframes lgrCerbYelp { 0% { transform: none } 14% { transform: translateY(-4px) rotate(-4deg) scale(.95) } 40% { transform: translateY(-1px) rotate(2deg) } 70% { transform: rotate(-1deg) } 100% { transform: none } }
@keyframes lgrCerbFlinchL { 0% { transform: none } 16% { transform: rotate(-9deg) translateX(-2px) } 50% { transform: rotate(-3deg) } 100% { transform: none } }
@keyframes lgrCerbFlinchR { 0% { transform: none } 16% { transform: rotate(9deg) translateX(2px) } 50% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgrCerbKnockC { 0% { transform: none } 10% { transform: translate(-3px, -7px) rotate(-14deg) scale(.88) } 32% { transform: rotate(8deg) } 56% { transform: rotate(-4deg) } 78% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgrCerbWhipL { 0% { transform: none } 12% { transform: translateX(-6px) rotate(-24deg) } 36% { transform: rotate(10deg) } 60% { transform: rotate(-5deg) } 100% { transform: none } }
@keyframes lgrCerbWhipR { 0% { transform: none } 12% { transform: translateX(6px) rotate(24deg) } 36% { transform: rotate(-10deg) } 60% { transform: rotate(5deg) } 100% { transform: none } }
@keyframes lgrCerbKeySwing { 0%, 100% { transform: none } 12% { transform: rotate(48deg) } 32% { transform: rotate(-36deg) } 52% { transform: rotate(22deg) } 72% { transform: rotate(-10deg) } 88% { transform: rotate(4deg) } }
@keyframes lgrCerbGash { 0%, 100% { transform: none } 8% { transform: translate(-4px, 3px) scale(1.08, .86) rotate(-10deg) } 24% { transform: translate(2px, -1px) rotate(5deg) } 40% { transform: rotate(-3deg) } 60% { transform: none } }
@keyframes lgrCerbDuck { 0%, 100% { transform: none } 12% { transform: translateY(6px) scale(.92) } 50% { transform: translateY(4px) scale(.95) } }
@keyframes lgrCerbRattle { 0%, 100% { transform: none } 10% { transform: rotate(10deg) } 20% { transform: rotate(-9deg) } 30% { transform: rotate(7deg) } 40% { transform: rotate(-5deg) } 55% { transform: rotate(3deg) } 70% { transform: none } }
@keyframes lgrCerbBite { 0% { transform: none } 22% { transform: translateY(-4px) scale(.96, 1.04) } 38% { transform: translateY(6px) scale(1.24, 1.14) } 46% { transform: translateY(5px) scale(1.2, 1.06) } 54% { transform: translateY(6px) scale(1.22, 1.12) } 78% { transform: translateY(2px) scale(1.06) } 100% { transform: none } }
@keyframes lgrCerbLeanInL { 0%, 100% { transform: none } 30% { transform: translateX(4px) rotate(8deg) } 60% { transform: translateX(3px) rotate(6deg) } }
@keyframes lgrCerbRake { 0% { transform: none } 18% { transform: translate(-2px, -10px) rotate(-26deg) } 34% { transform: translate(10px, 2px) rotate(22deg) scale(1.15) } 56% { transform: translate(8px, 1px) rotate(16deg) scale(1.1) } 100% { transform: none } }
@keyframes lgrCerbChainLash { 0% { transform: none } 16% { transform: rotate(-22deg) } 32% { transform: rotate(38deg) scale(1.08) } 50% { transform: rotate(18deg) } 70% { transform: rotate(-6deg) } 100% { transform: none } }
@keyframes lgrCerbLungeR { 0% { transform: none } 16% { transform: translateX(-3px) rotate(-6deg) } 32% { transform: translate(12px, 3px) rotate(14deg) scale(1.12) } 58% { transform: translate(9px, 2px) rotate(10deg) scale(1.08) } 100% { transform: none } }
@keyframes lgrCerbSnap3 { 0% { transform: none } 18% { transform: translateY(-5px) scale(.94) } 30% { transform: translateY(7px) scale(1.28, 1.16) } 42% { transform: translateY(4px) scale(1.16, 1.06) } 52% { transform: translateY(7px) scale(1.26, 1.14) } 80% { transform: translateY(2px) scale(1.05) } 100% { transform: none } }
@keyframes lgrCerbStomp { 0% { transform: none } 22% { transform: translateY(-12px) rotate(-8deg) } 36% { transform: translateY(2px) scale(1.18, .82) } 50% { transform: translateY(0) scale(1.06, .94) } 100% { transform: none } }
@keyframes lgrCerbTaut { 0%, 100% { transform: none } 30% { transform: scale(1.04, 1.1) } 40% { transform: scale(1.02, 1.05) rotate(3deg) } 50% { transform: scale(1.04, 1.1) rotate(-3deg) } }
@keyframes lgrCerbCower { 0% { transform: none } 14% { transform: translateY(-5px) scale(.88) rotate(-3deg) } 40% { transform: translateY(-3px) scale(.92) } 100% { transform: none } }
@keyframes lgrCerbPullInL { 0% { transform: none } 14% { transform: translateX(-5px) rotate(-12deg) scale(.92) } 50% { transform: translateX(-3px) rotate(-8deg) scale(.95) } 100% { transform: none } }
@keyframes lgrCerbPullInR { 0% { transform: none } 14% { transform: translateX(5px) rotate(12deg) scale(.92) } 50% { transform: translateX(3px) rotate(8deg) scale(.95) } 100% { transform: none } }
@keyframes lgrCerbGuardPaw { 0% { transform: none } 14% { transform: translateY(-14px) rotate(18deg) scale(1.15) } 34% { transform: translateY(-11px) rotate(12deg) scale(1.12) } 60% { transform: translateY(-12px) rotate(15deg) scale(1.13) } 100% { transform: none } }
@keyframes lgrCerbBounceOff { 0% { transform: none } 18% { transform: translate(6px, 3px) rotate(10deg) scale(1.1) } 30% { transform: translate(-4px, -3px) rotate(-12deg) scale(.92) } 50% { transform: rotate(6deg) } 70% { transform: rotate(-3deg) } 100% { transform: none } }
@keyframes lgrCerbShakeNo { 0%, 100% { transform: none } 12% { transform: rotate(-8deg) } 26% { transform: rotate(8deg) } 40% { transform: rotate(-6deg) } 54% { transform: rotate(5deg) } 68% { transform: rotate(-2deg) } }
@keyframes lgrCerbBackOff { 0%, 100% { transform: none } 20% { transform: translateY(-3px) scale(.9) } 60% { transform: translateY(-2px) scale(.94) } }
@keyframes lgrCerbDroopL { 0% { transform: none } 30% { transform: translateY(5px) rotate(-14deg) } 70% { transform: translateY(5px) rotate(-12deg) } 100% { transform: none } }
@keyframes lgrCerbDroopR { 0% { transform: none } 30% { transform: translateY(5px) rotate(14deg) } 70% { transform: translateY(5px) rotate(12deg) } 100% { transform: none } }
@keyframes lgrCerbDroopC { 0% { transform: none } 30% { transform: translateY(6px) rotate(3deg) scale(.96) } 70% { transform: translateY(5px) rotate(2deg) scale(.97) } 100% { transform: none } }
@keyframes lgrCerbSlack { 0%, 100% { transform: none } 30% { transform: scaleY(.85) rotate(4deg) } 70% { transform: scaleY(.88) rotate(3deg) } }
@keyframes lgrCerbKoL { 0%, 22% { transform: none } 30% { transform: translateY(-4px) rotate(10deg) } 42% { transform: translateY(16px) rotate(-38deg) } 50% { transform: translateY(13px) rotate(-32deg) } 100% { transform: translateY(14px) rotate(-34deg) } }
@keyframes lgrCerbKoR { 0%, 36% { transform: none } 44% { transform: translateY(-4px) rotate(-10deg) } 56% { transform: translateY(16px) rotate(38deg) } 64% { transform: translateY(13px) rotate(32deg) } 100% { transform: translateY(14px) rotate(34deg) } }
@keyframes lgrCerbKoC { 0% { transform: none } 40% { transform: translateY(-2px) rotate(-2deg) } 54% { transform: translateY(-9px) rotate(-6deg) scale(1.1) } 60% { transform: translateY(-10px) rotate(-6deg) scale(1.12) } 74% { transform: translateY(14px) rotate(10deg) scale(.95) } 82% { transform: translateY(11px) rotate(7deg) scale(.95) } 100% { transform: translateY(12px) rotate(8deg) scale(.95) } }
@keyframes lgrCerbKoChainL { 0%, 8% { transform: none; opacity: 1 } 14% { transform: rotate(-30deg) } 30% { transform: translate(-10px, 20px) rotate(-80deg); opacity: .8 } 46%, 100% { transform: translate(-14px, 34px) rotate(-100deg); opacity: 0 } }
@keyframes lgrCerbKoChainR { 0%, 8% { transform: none; opacity: 1 } 14% { transform: rotate(30deg) } 30% { transform: translate(10px, 20px) rotate(80deg); opacity: .8 } 46%, 100% { transform: translate(14px, 34px) rotate(100deg); opacity: 0 } }
@keyframes lgrCerbKoKey { 0%, 58% { transform: none; opacity: 1 } 64% { transform: rotate(40deg) } 80% { transform: translateY(26px) rotate(150deg); opacity: 1 } 92%, 100% { transform: translateY(30px) rotate(170deg); opacity: 0 } }
@keyframes lgrCerbKoPaw { 0%, 60% { transform: none } 76% { transform: translateY(3px) scale(1.12, .8) } 100% { transform: translateY(3px) scale(1.1, .82) } }
${on('[data-moment="hit"]', { iron: 'lgrCerbYelp 520ms ease-out', fire: 'lgrCerbFlinchL 520ms ease-out', shadow: 'lgrCerbFlinchR 520ms ease-out 40ms' })}
${on('[data-moment="crit"]', { iron: 'lgrCerbKnockC 820ms cubic-bezier(.2,.9,.3,1)', fire: 'lgrCerbWhipL 820ms cubic-bezier(.2,.9,.3,1) 70ms', shadow: 'lgrCerbWhipR 820ms cubic-bezier(.2,.9,.3,1) 140ms', key: 'lgrCerbKeySwing 1000ms ease-out' })}
${on('[data-moment="sharpen"]', { fire: 'lgrCerbGash 760ms ease-out', shadow: 'lgrCerbDuck 700ms ease-out 60ms', iron: 'lgrCerbDuck 700ms ease-out', chainl: 'lgrCerbRattle 760ms linear', chainr: 'lgrCerbRattle 760ms linear 50ms' })}
${on('[data-moment="hurt"]', { iron: 'lgrCerbBite 820ms cubic-bezier(.3,1.3,.5,1)', fire: 'lgrCerbLeanInL 820ms ease-out', key: 'lgrCerbKeySwing 900ms ease-out' })}
${on('[data-assault-on]', { pawr: 'lgrCerbRake 900ms cubic-bezier(.3,1.3,.5,1)', chainr: 'lgrCerbChainLash 900ms cubic-bezier(.3,1.3,.5,1)', chainl: 'lgrCerbChainLash 900ms cubic-bezier(.3,1.3,.5,1) 60ms', shadow: 'lgrCerbLungeR 900ms cubic-bezier(.3,1.3,.5,1)' })}
${on('[data-moment="hurtBig"]', { fire: 'lgrCerbSnap3 1000ms cubic-bezier(.3,1.3,.5,1)', iron: 'lgrCerbSnap3 1000ms cubic-bezier(.3,1.3,.5,1) 110ms', shadow: 'lgrCerbSnap3 1000ms cubic-bezier(.3,1.3,.5,1) 220ms', pawl: 'lgrCerbStomp 900ms ease-out', pawr: 'lgrCerbStomp 900ms ease-out 120ms', chainl: 'lgrCerbTaut 1000ms ease-out', chainr: 'lgrCerbTaut 1000ms ease-out', key: 'lgrCerbKeySwing 1100ms ease-out' })}
${on('[data-moment="block"]', { iron: 'lgrCerbCower 700ms cubic-bezier(.2,.9,.3,1)', fire: 'lgrCerbPullInL 700ms ease-out', shadow: 'lgrCerbPullInR 700ms ease-out', pawl: 'lgrCerbGuardPaw 700ms cubic-bezier(.2,.9,.3,1)', pawr: 'lgrCerbGuardPaw 700ms cubic-bezier(.2,.9,.3,1)' })}
${on('[data-moment="shield"]', { fire: 'lgrCerbBounceOff 760ms ease-out', iron: 'lgrCerbShakeNo 760ms ease-out', shadow: 'lgrCerbBackOff 700ms ease-out' })}
${on('[data-moment="wind"]', { fire: 'lgrCerbDroopL 1100ms ease-in-out', iron: 'lgrCerbDroopC 1100ms ease-in-out', shadow: 'lgrCerbDroopR 1100ms ease-in-out', chainl: 'lgrCerbSlack 1100ms ease-in-out', chainr: 'lgrCerbSlack 1100ms ease-in-out' })}
${on('[data-moment="ko"]', { fire: 'lgrCerbKoL 2200ms ease-in both', shadow: 'lgrCerbKoR 2200ms ease-in both', iron: 'lgrCerbKoC 2200ms ease-in-out both', chainl: 'lgrCerbKoChainL 2200ms ease-out both', chainr: 'lgrCerbKoChainR 2200ms ease-out both', key: 'lgrCerbKoKey 2200ms ease-in both', pawl: 'lgrCerbKoPaw 2200ms ease-in both', pawr: 'lgrCerbKoPaw 2200ms ease-in both' })}
${B}[data-down] .lgfa-cerberus-fire { transform-box: fill-box; transform-origin: 60% 95%; transform: translateY(14px) rotate(-34deg) }
${B}[data-down] .lgfa-cerberus-shadow { transform-box: fill-box; transform-origin: 40% 95%; transform: translateY(14px) rotate(34deg) }
${B}[data-down] .lgfa-cerberus-iron { transform-box: fill-box; transform-origin: 50% 95%; transform: translateY(12px) rotate(8deg) scale(.95) }
${B}[data-down] .lg-cerberus-chainl, ${B}[data-down] .lg-cerberus-chainr, ${B}[data-down] .lgfa-cerberus-key { opacity: 0 }
${B}[data-down] .lg-cerberus-pawl, ${B}[data-down] .lg-cerberus-pawr { transform: translateY(3px) scale(1.1, .82) }
/* the abilities, on top of the art's own head yanks: Bound splays the paws flat and draws both chains taut; the Fire
   head's chain whips loose on a snap; each bind pulls its own side */
@keyframes lgrCerbSplay { 0%, 100% { transform: none } 22% { transform: translateY(3px) scale(1.25, .75) } 64% { transform: translateY(3px) scale(1.22, .78) } }
${B} .lgr-cerberus-bound .lg-cerberus-pawl, ${B} .lgr-cerberus-bound .lg-cerberus-pawr { animation: lgrCerbSplay 1150ms ease-out }
${B} .lgr-cerberus-bound .lg-cerberus-chainl, ${B} .lgr-cerberus-bound .lg-cerberus-chainr { animation: lgrCerbTaut 1150ms ease-out }
${B} .lgr-cerberus-snap .lg-cerberus-chainl { animation: lgrCerbChainLash 760ms cubic-bezier(.3,1.3,.5,1) }
${B} .lgr-cerberus-bindFire .lg-cerberus-chainl, ${B} .lgr-cerberus-bindShadow .lg-cerberus-chainr { animation: lgrCerbTaut 330ms ease-out }
${B} .lgr-cerberus-bindIron .lg-cerberus-pawl, ${B} .lgr-cerberus-bindIron .lg-cerberus-pawr { animation: lgrCerbSplay 330ms ease-out }
`

const ember = (i, extra) => <div key={i} className="lgx" style={{ width: 6, height: 6, borderRadius: '50%', background: i % 2 ? T.fireHi : T.fire, boxShadow: `0 0 6px ${T.ember}`, ...extra }} />

export default {
  effects: {
    bindFire: () => <>
      {chain(9, { left: '-14%', top: '32%', transformOrigin: '0 50%', filter: `drop-shadow(0 0 4px ${T.fire})`, '--r0': '-40deg', '--r1': '8deg', animation: anim('lgrCerberusLash', 340, 0, 'cubic-bezier(.2,.9,.3,1)') }, 'c', 15)}
      <div className="lgx" style={{ left: '28%', top: '36%', width: 44, height: 44, borderRadius: '50%', background: `radial-gradient(circle, ${T.fireHi} 0 20%, ${T.fire} 45%, rgba(255,74,28,0) 70%)`, '--s': 1.6, animation: anim('lgxRing', 300, 120) }} />
      {[0, 1, 2, 3, 4, 5].map((i) => ember(i, { left: `${22 + i * 4}%`, top: '38%', width: 8, height: 8, '--h': `${-34 - i * 8}px`, animation: anim('lgxRise', 300, 80 + i * 25) }))}
    </>,
    bindIron: () => <>
      {chain(8, { left: '22%', top: '50%', width: '56%', animation: anim('lgxFade', 330) })}
      {padlock({ ...center, top: '52%', animation: anim('lgrCerberusClamp', 330, 0, 'cubic-bezier(.3,1.6,.5,1)') })}
      {ring(T.ironHi, 60, 1.1, 3, 300)}
    </>,
    bindShadow: () => <>
      {[0, 1, 2, 3, 4].map((i) => <div key={i} className="lgx" style={{ right: `${6 + i * 6}%`, top: `${30 + (i % 2) * 10}%`, width: 22, height: 22, borderRadius: '50%', background: `radial-gradient(circle, ${T.smokeHi}, ${T.smoke} 60%, transparent 70%)`, '--x0': '40px', '--y0': `${-20 + i * 10}px`, animation: anim('lgxFly', 320, i * 20) }} />)}
      {chain(7, { right: '-10%', top: '40%', transformOrigin: '100% 50%', flexDirection: 'row-reverse', filter: `drop-shadow(0 0 5px ${T.smokeHi})`, '--r0': '35deg', '--r1': '-6deg', animation: anim('lgrCerberusLash', 330, 60, 'cubic-bezier(.2,.9,.3,1)') }, 's', 14)}
    </>,
    bound: () => <>
      <div className="lgx lgx-full" style={{ background: `radial-gradient(circle, rgba(95, 240, 210, .28), transparent 60%)`, animation: anim('lgxFlash', 600) }} />
      {/* three chains shoot in from left, right and above and meet over him */}
      {chain(10, { left: '-20%', top: '40%', transformOrigin: '0 50%', '--r0': '-50deg', '--r1': '6deg', animation: anim('lgrCerberusLash', 420, 0, 'cubic-bezier(.2,.9,.3,1)') }, 'a')}
      {chain(10, { right: '-20%', top: '44%', transformOrigin: '100% 50%', flexDirection: 'row-reverse', '--r0': '50deg', '--r1': '-6deg', animation: anim('lgrCerberusLash', 420, 90, 'cubic-bezier(.2,.9,.3,1)') }, 'b')}
      {chain(8, { left: '50%', top: '-18%', transformOrigin: '0 50%', '--r0': '20deg', '--r1': '90deg', animation: anim('lgrCerberusLash', 420, 180, 'cubic-bezier(.2,.9,.3,1)') }, 'c')}
      {/* the gate's iron bars crash down in front of him (hidden until they fall: held at their start they hung above
          the arena; at rest they stay inside the frame and its headroom) */}
      {[0, 1, 2, 3, 4, 5].map((i) => <div key={`bar${i}`} className="lgx" style={{ left: `${8 + i * 16}%`, top: '-12%', width: 7, height: '104%', background: `linear-gradient(90deg, ${T.ironLo}, ${T.iron} 45%, ${T.ironLo})`, border: `1.5px solid ${T.ink}`, borderRadius: '3px 3px 1px 1px', clipPath: 'polygon(50% 0, 100% 6%, 100% 100%, 0 100%, 0 6%)', animation: anim('lgrCerberusBars', 1100, 260 + (i % 3) * 40, 'cubic-bezier(.5,0,.7,1)') }} />)}
      {padlock({ ...center, top: '56%', animation: anim('lgrCerberusClamp', 700, 480, 'cubic-bezier(.3,1.6,.5,1)') }, 'big', 1.7)}
      {ring(T.soul, 520, 1.8, 4, 650)}
      {shards(10, T.iron, -80, 9)}
    </>,
    snap: () => <>
      {/* links of the broken chain fly off the Fire head, its mane flares */}
      <div className="lgx" style={{ left: '28%', top: '34%', width: 70, height: 70, borderRadius: '50%', background: `radial-gradient(circle, ${T.fireHi} 0 15%, ${T.fire} 40%, rgba(255,74,28,0) 70%)`, '--s': 1.7, animation: anim('lgxRing', 520) }} />
      {around(8, (i, a) => <div key={i} className="lgx" style={{ left: '28%', top: '34%', width: 18, height: 13, borderRadius: '50%', border: `4px solid ${T.iron}`, boxShadow: `0 0 0 1.5px ${T.ink}`, '--a': `${a}deg`, '--d': `${-60 - (i % 3) * 14}px`, '--spin': `${i % 2 ? 300 : -300}deg`, animation: anim('lgxShard', 700, i * 15) }} />)}
      {[0, 1, 2].map((i) => <div key={`f${i}`} className="lgx" style={{ left: `${12 + i * 9}%`, top: `${6 + (i % 2) * 6}%`, width: 9, height: 22, borderRadius: '50% 50% 40% 40% / 70% 70% 30% 30%', background: `linear-gradient(${T.fireHi}, ${T.fire} 55%, ${T.ember})`, border: `1.5px solid ${T.ink}`, transformOrigin: '50% 100%', animation: anim('lgrCerberusFlare', 640, 40 + i * 50) }} />)}
    </>,
  },
  floaters: { bindFire: 'lg_fx_cerbFire', bindIron: 'lg_fx_cerbIron', bindShadow: 'lg_fx_cerbShadow', bound: 'lg_fx_cerbBound', snap: 'lg_fx_cerbSnap' },
  floaterTone: { bindFire: 'danger', bindIron: 'ink', bindShadow: 'purple', bound: 'success', snap: 'warning' },
  demo: { bindFire: { kind: 'hit', damage: 1, lives: 0 }, bindIron: { kind: 'hit', damage: 2, lives: 0 }, bindShadow: { kind: 'hit', damage: 1, lives: 0 }, bound: { kind: 'hit', damage: 5, lives: 0 }, snap: { kind: 'miss', damage: 0, lives: 1 } },
  juice: {
    bindFire: { size: 'tick' },
    bindIron: { size: 'tick' },
    bindShadow: { size: 'tick' },
    bound: { size: 'big', shake: 3, flash: 2, hitstop: 1, sfx: 'cerberus.bound' },
    snap: { size: 'medium', shake: 1, flash: 1, sfx: 'cerberus.snap' },
  },
  css: `
@keyframes lgrCerberusLash { 0% { transform: rotate(var(--r0)) scaleX(.1); opacity: 0 } 20% { opacity: 1 } 60% { transform: rotate(var(--r1)) scaleX(1.05) } 80% { transform: rotate(var(--r1)) scaleX(1); opacity: 1 } 100% { transform: rotate(var(--r1)) scaleX(1); opacity: 0 } }
@keyframes lgrCerberusClamp { 0% { transform: translateY(-30px) scale(1.6); opacity: 0 } 30% { opacity: 1 } 55% { transform: translateY(0) scale(.9) } 75% { transform: scale(1.06) } 88% { transform: scale(1); opacity: 1 } 100% { opacity: 0 } }
@keyframes lgrCerberusBars { 0% { transform: translateY(-55%); opacity: 0 } 12% { opacity: 1 } 34% { transform: translateY(0) } 42% { transform: translateY(-4%) } 50% { transform: translateY(0) } 85% { transform: translateY(0); opacity: 1 } 100% { transform: translateY(0); opacity: 0 } }
@keyframes lgrCerberusFlare { 0% { transform: scale(.4); opacity: 0 } 25% { transform: scale(1.25); opacity: 1 } 100% { transform: scale(1.5) translateY(-20px); opacity: 0 } }
.lgr-cerberus-bindFire { animation: lgrCerberusYankL 330ms cubic-bezier(.2,.9,.3,1) both; transform-origin: 50% 100% }
@keyframes lgrCerberusYankL { 0%, 100% { transform: none } 35% { transform: translate(-6px, 4px) rotate(-6deg) } 70% { transform: translate(-1px, 1px) rotate(-1.5deg) } }
.lgr-cerberus-bindIron { animation: lgrCerberusYankD 330ms cubic-bezier(.2,.9,.3,1) both; transform-origin: 50% 100% }
@keyframes lgrCerberusYankD { 0%, 100% { transform: none } 35% { transform: translateY(7px) scale(1.03, .94) } 70% { transform: translateY(1px) } }
.lgr-cerberus-bindShadow { animation: lgrCerberusYankR 330ms cubic-bezier(.2,.9,.3,1) both; transform-origin: 50% 100% }
@keyframes lgrCerberusYankR { 0%, 100% { transform: none } 35% { transform: translate(6px, 4px) rotate(6deg) } 70% { transform: translate(1px, 1px) rotate(1.5deg) } }
.lgr-cerberus-bound { animation: lgrCerberusPinned 1150ms cubic-bezier(.3,.7,.4,1) both; transform-origin: 50% 100% }
@keyframes lgrCerberusPinned { 0% { transform: none } 22% { transform: translateY(10px) scale(1.06, .86) } 34% { transform: translateY(8px) scale(1.04, .9) translateX(-3px) } 44% { transform: translateY(8px) scale(1.04, .9) translateX(3px) } 54% { transform: translateY(8px) scale(1.04, .9) translateX(-3px) } 64% { transform: translateY(8px) scale(1.04, .9) translateX(2px) } 84% { transform: translateY(2px) scale(1.01, .98) } 100% { transform: none } }
.lgr-cerberus-snap { animation: lgrCerberusRear 760ms cubic-bezier(.22,1,.36,1) both; transform-origin: 50% 100% }
@keyframes lgrCerberusRear { 0% { transform: none } 25% { transform: translateY(-8px) rotate(-5deg) scale(1.05) } 45% { transform: translateY(-3px) rotate(4deg) } 65% { transform: rotate(-2.5deg) } 85% { transform: rotate(1deg) } 100% { transform: none } }
/* THE REAL PARTS (hook classes in raids/cerberus.svg): the head an effect is about is yanked by its chain, the
   key or keyhole flares when he is bound. Played only while data-fx is set. */
@keyframes lgrCerberusHeadDown { 0%, 100% { transform: none } 35% { transform: translateY(5px) rotate(-9deg) } 70% { transform: translateY(1px) rotate(-2deg) } }
@keyframes lgrCerberusHeadDownR { 0%, 100% { transform: none } 35% { transform: translateY(5px) rotate(9deg) } 70% { transform: translateY(1px) rotate(2deg) } }
@keyframes lgrCerberusHeadDip { 0%, 100% { transform: none } 35% { transform: translateY(6px) scale(.95) } 70% { transform: translateY(1px) } }
@keyframes lgrCerberusHeadRear { 0% { transform: none } 30% { transform: translateY(-6px) rotate(-12deg) scale(1.1) } 55% { transform: rotate(8deg) } 75% { transform: rotate(-4deg) } 100% { transform: none } }
@keyframes lgrCerberusKeyFlare { 0%, 100% { transform: none } 30% { transform: scale(1.35) } 55% { transform: scale(.95) } 75% { transform: scale(1.15) } }
.lg-boss[data-fx="bindFire"] .lgfa-cerberus-fire, .lg-boss[data-fx="bound"] .lgfa-cerberus-fire { transform-box: fill-box; transform-origin: 50% 100%; animation: lgrCerberusHeadDown 330ms cubic-bezier(.2,.9,.3,1) both }
.lg-boss[data-fx="bindIron"] .lgfa-cerberus-iron, .lg-boss[data-fx="bound"] .lgfa-cerberus-iron { transform-box: fill-box; transform-origin: 50% 100%; animation: lgrCerberusHeadDip 330ms cubic-bezier(.2,.9,.3,1) both }
.lg-boss[data-fx="bindShadow"] .lgfa-cerberus-shadow, .lg-boss[data-fx="bound"] .lgfa-cerberus-shadow { transform-box: fill-box; transform-origin: 50% 100%; animation: lgrCerberusHeadDownR 330ms cubic-bezier(.2,.9,.3,1) both }
.lg-boss[data-fx="snap"] .lgfa-cerberus-fire { transform-box: fill-box; transform-origin: 50% 100%; animation: lgrCerberusHeadRear 700ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-fx="bound"] .lgfa-cerberus-key { transform-box: fill-box; transform-origin: center; animation: lgrCerberusKeyFlare 1000ms ease-in-out both }
` + DRAWING,
}
