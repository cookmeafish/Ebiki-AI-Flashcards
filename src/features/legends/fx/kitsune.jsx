// What Starball Rally (abilities/kitsune.js) LOOKS like (design v2.1, #22). The fx contract is in fx/index.js.
//   volley    (tick)   her jewel ball streaks back across with a fox-fire trail that grows with every return
//                      (the arena's data-ab-rally sets the trail length).
//   starfall  (big)    the ball bursts into a meteor shower of pink and cyan stars with cherry petals.
//   caught    (medium) the ball bounces away from you and her nine tails flick.
import { center, anim, around, ring } from './_kit'

// Fixed bright fox-fire colors (never theme tokens over the art).
const F = { white: '#ffffff', cyan: '#6ff3ff', ice: '#c8fbff', pink: '#ff7ac8', petal: '#ffc1dc', violet: '#b98cff', gold: '#ffd76b', ink: '#1d2230' }
const BALL = `radial-gradient(circle at 40% 38%, ${F.white} 0 20%, ${F.ice} 38%, ${F.cyan} 66%, #17a9c9 100%)`
const star = (color) => ({ clipPath: 'polygon(50% 0, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)', background: color })

export default {
  effects: {
    volley: () => <>
      <div className="lgx lgr-kitsune-trail" style={{ top: '40%', right: '6%', height: 10, borderRadius: 5, background: `linear-gradient(90deg, transparent, ${F.violet} 30%, ${F.pink} 70%, ${F.white})`, filter: `drop-shadow(0 0 6px ${F.pink})`, animation: anim('lgrKitsuneVolley', 340, 0, 'cubic-bezier(.22,1,.36,1)') }} />
      <div className="lgx" style={{ top: '40%', right: '6%', width: 28, height: 28, marginTop: -9, borderRadius: '50%', background: BALL, border: `2.5px solid ${F.ink}`, boxShadow: `0 0 14px ${F.cyan}, 0 0 4px ${F.white}`, animation: anim('lgrKitsuneVolley', 340, 0, 'cubic-bezier(.22,1,.36,1)') }} />
      {/* the smack where it lands: a pink star pops and three fox-fire wisps flick off */}
      <div className="lgx" style={{ left: '50%', top: '42%', width: 44, height: 44, margin: '-22px 0 0 -22px', ...star(F.white), filter: `drop-shadow(0 0 6px ${F.pink}) drop-shadow(0 0 2px ${F.ink})`, animation: anim('lgrKitsuneSmack', 200, 150, 'cubic-bezier(.2,1.5,.4,1)') }} />
      {[0, 1, 2].map((i) => <div key={i} className="lgx" style={{ left: `${46 + i * 5}%`, top: '42%', width: 10, height: 16, borderRadius: '50% 50% 40% 40% / 70% 70% 30% 30%', background: `linear-gradient(${F.white}, ${F.cyan} 60%, ${F.violet})`, boxShadow: `0 0 0 1px ${F.ink}`, '--h': `${-30 - i * 10}px`, animation: anim('lgxRise', 200, 160 + i * 20) }} />)}
    </>,
    starfall: () => <>
      <div className="lgx" style={{ ...center, width: 34, height: 34, marginLeft: -17, marginTop: -17, borderRadius: '50%', background: BALL, border: `2px solid ${F.ink}`, boxShadow: `0 0 30px ${F.white}, 0 0 60px ${F.pink}`, animation: anim('lgrKitsuneBurst', 420) }} />
      {ring(F.white, 140, 1.8, 6, 500)}{ring(F.pink, 200, 2.5, 4, 700)}{ring(F.cyan, 280, 3.1, 3, 800)}
      {around(10, (i, a) => <div key={i} className="lgx" style={{ ...center, width: 16, height: 16, marginLeft: -8, ...star(i % 2 ? F.pink : F.cyan), filter: `drop-shadow(0 0 6px ${i % 2 ? F.pink : F.cyan})`, '--a': `${a}deg`, '--d': `${-80 - (i % 3) * 18}px`, '--spin': `${i % 2 ? 300 : -300}deg`, animation: anim('lgxShard', 900, 160 + (i % 3) * 30) }} />)}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <div key={`m${i}`} className="lgx" style={{ left: `${8 + i * 12}%`, top: '-14%', width: 12, height: 12, ...star(i % 2 ? F.gold : F.ice), filter: `drop-shadow(0 0 5px ${F.gold})`, '--spin': `${i % 2 ? 200 : -200}deg`, animation: anim('lgxFall', 950, 260 + i * 55, 'ease-in') }} />)}
      {[0, 1, 2, 3, 4, 5].map((i) => <div key={`p${i}`} className="lgx" style={{ left: `${14 + i * 14}%`, top: '-6%', width: 11, height: 8, borderRadius: '80% 0 80% 0', background: F.petal, border: `1px solid ${F.pink}`, '--spin': `${i % 2 ? 340 : -340}deg`, animation: anim('lgxFall', 1150, 330 + i * 70, 'ease-in') }} />)}
    </>,
    caught: () => <>
      <div className="lgx" style={{ left: '46%', top: '58%', width: 22, height: 22, borderRadius: '50%', background: BALL, border: `2px solid ${F.ink}`, boxShadow: `0 0 12px ${F.cyan}`, animation: anim('lgrKitsuneBounce', 780, 0, 'ease-out') }} />
      {/* nine tails flick: nine violet fox-fire strokes fanning behind her */}
      {around(9, (i) => <div key={i} className="lgx" style={{ left: '50%', bottom: '18%', width: 7, height: '46%', marginLeft: -3.5, borderRadius: '50% 50% 4px 4px', background: `linear-gradient(${F.white}, ${F.violet} 40%, transparent)`, opacity: 0.85, transformOrigin: 'bottom center', '--r': `${-64 + i * 16}deg`, animation: anim('lgrKitsuneFlick', 620, i * 20) }} />)}
    </>,
  },
  floaters: { volley: 'lg_fx_ballVolley', starfall: 'lg_fx_starfall', caught: 'lg_fx_ballCaught' },
  floaterTone: { volley: 'info', starfall: 'brand', caught: 'purple' },
  demo: { caught: { kind: 'miss', damage: 0, lives: 1 } },
  juice: {
    volley: { size: 'tick' },
    starfall: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'kitsune.starfall' },
    caught: { size: 'medium', shake: 1, sfx: 'kitsune.caught' },
  },
  css: `
@keyframes lgrKitsuneSmack { 0% { transform: scale(.2) rotate(-40deg); opacity: 0 } 50% { transform: scale(1.2) rotate(10deg); opacity: 1 } 100% { transform: scale(1.4) rotate(30deg); opacity: 0 } }
.lgr-kitsune-trail { width: 22% }
.lg-boss[data-ab-rally="2"] .lgr-kitsune-trail { width: 40%; height: 12px }
.lg-boss[data-ab-rally="3"] .lgr-kitsune-trail { width: 62%; height: 14px }
@keyframes lgrKitsuneVolley { 0% { transform: translateX(110px); opacity: 0 } 20% { opacity: 1 } 100% { transform: translateX(-30px); opacity: 0 } }
@keyframes lgrKitsuneBurst { 0% { transform: scale(.4); opacity: 0 } 40% { transform: scale(1.5); opacity: 1 } 100% { transform: scale(2.6); opacity: 0 } }
@keyframes lgrKitsuneBounce { 0% { transform: translate(0, 0); opacity: 1 } 35% { transform: translate(38px, -46px) } 60% { transform: translate(70px, -10px) } 80% { transform: translate(92px, -26px); opacity: 1 } 100% { transform: translate(120px, -4px); opacity: 0 } }
@keyframes lgrKitsuneFlick { 0% { transform: rotate(0) scaleY(.3); opacity: 0 } 30% { transform: rotate(var(--r)) scaleY(1.05); opacity: .9 } 60% { transform: rotate(calc(var(--r) * .7)) scaleY(1) } 100% { transform: rotate(var(--r)) scaleY(.6); opacity: 0 } }
.lgr-kitsune-volley { animation: lgrKitsuneSway 320ms ease-out both; transform-origin: 50% 90% }
@keyframes lgrKitsuneSway { 0%, 100% { transform: none } 40% { transform: rotate(-6deg) translateX(-3px) } 75% { transform: rotate(2deg) } }
.lgr-kitsune-starfall { animation: lgrKitsuneTwirl 900ms cubic-bezier(.22,1,.36,1) both }
@keyframes lgrKitsuneTwirl { 0% { transform: perspective(500px) rotateY(0) } 60% { transform: perspective(500px) rotateY(330deg) scale(1.03) } 82% { transform: perspective(500px) rotateY(372deg) } 100% { transform: perspective(500px) rotateY(360deg) } }
.lgr-kitsune-caught { animation: lgrKitsuneHop 600ms cubic-bezier(.34,1.56,.64,1) both; transform-origin: 50% 100% }
@keyframes lgrKitsuneHop { 0% { transform: none } 35% { transform: translateY(-10px) scale(.98, 1.03) } 62% { transform: translateY(0) scale(1.05, .93) } 80% { transform: scale(.99, 1.01) } 100% { transform: none } }
/* THE REAL PARTS: the state layer this ability draws on the boss (its lg-ab-* group in raids/kitsune.svg) moves with
   the moment, not only the whole figure. Played only while data-fx is set (never in focus mode, with Still bosses or
   under reduced motion). */
@keyframes lgrKitsuneRallyPop { 0% { transform: none } 35% { transform: scale(1.25) } 65% { transform: scale(.94) } 100% { transform: none } }
.lg-boss[data-fx="volley"] [class*="lg-ab-rally-"] { transform-box: fill-box; transform-origin: center; animation: lgrKitsuneRallyPop 320ms cubic-bezier(.22,1,.36,1) both }
`,
}
