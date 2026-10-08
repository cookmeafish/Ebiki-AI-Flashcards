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
`,
}
