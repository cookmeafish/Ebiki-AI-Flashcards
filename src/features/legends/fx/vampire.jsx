// What the Vampire's Blood Wards (abilities/vampire.js) LOOK like. The fx contract is in fx/index.js, the juice in
// fx/_juice.js. Fixed crimson with a white-hot glint, so it reads over any palette.
//   drip (tick): one blood drop falls.
//   ward (big): crimson droplets swirl and harden into a glassy red hex shield that settles toward your hearts.
//   burst (big): the shield explodes and its shards fly AT the boss.
//   feast (big): bat silhouettes swarm and dive into the boss under a pulsing crimson vignette.
// Boss reactions (body only; faces are the art pass's lg-fx-<key> layers): Recoil, Cower, Swoon, Flick.
import { anim, around, ring } from './_kit'

const BLOOD = '#e0102f'
const BLOOD_HOT = '#ff4d6a'
const GLINT = '#ffd6de'
const HEX = 'polygon(25% 3%, 75% 3%, 100% 50%, 75% 97%, 25% 97%, 0 50%)'

const bat = (key, style) => (
  <div key={key} className="lgx" style={{ width: 30, height: 14, background: '#2a0008', clipPath: 'polygon(0 20%, 18% 0, 30% 35%, 42% 20%, 50% 40%, 58% 20%, 70% 35%, 82% 0, 100% 20%, 86% 55%, 70% 50%, 58% 90%, 50% 70%, 42% 90%, 30% 50%, 14% 55%)', filter: `drop-shadow(0 0 3px ${BLOOD_HOT})`, ...style }} />
)

export default {
  effects: {
    drip: () => (
      <div className="lgx" style={{ left: '56%', top: '30%', width: 9, height: 13, borderRadius: '50% 50% 50% 50% / 65% 65% 35% 35%', background: `radial-gradient(circle at 40% 35%, ${GLINT}, ${BLOOD} 55%)`, animation: anim('lgxFall', 340, 0, 'ease-in') }} />
    ),
    ward: () => <>
      {/* droplets swirl in */}
      {around(10, (i, a) => (
        <div key={i} className="lgx" style={{ left: '50%', top: '50%', width: 10, height: 10, marginLeft: -5, marginTop: -5, borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, ${GLINT}, ${BLOOD})`, '--a': `${a}deg`, animation: anim('lgrVampireSwirl', 560, i * 20, 'cubic-bezier(.55,0,1,.45)') }} />
      ))}
      {/* the glass hex shield hardens, then settles toward the hearts (right of the boss) */}
      <div className="lgx" style={{ left: '50%', top: '50%', width: '58%', height: '58%', marginLeft: '-29%', marginTop: '-29%', clipPath: HEX, background: `linear-gradient(135deg, rgba(255,214,222,.85), rgba(224,16,47,.55) 40%, rgba(120,0,20,.65))`, animation: anim('lgrVampireHex', 1150, 420, 'cubic-bezier(.34,1.56,.64,1)') }}>
        <div style={{ position: 'absolute', inset: '12%', clipPath: HEX, border: `2px solid ${GLINT}`, background: 'linear-gradient(160deg, rgba(255,255,255,.55), rgba(255,255,255,0) 45%)' }} />
      </div>
      {ring(BLOOD_HOT, 420, 1.5, 4, 600)}
    </>,
    burst: () => <>
      <div className="lgx" style={{ left: '50%', top: '50%', width: '58%', height: '58%', marginLeft: '-29%', marginTop: '-29%', clipPath: HEX, background: `linear-gradient(135deg, rgba(255,214,222,.9), rgba(224,16,47,.7))`, animation: anim('lgrVampireShatter', 260, 0, 'ease-in') }} />
      {/* shards fly from the hearts' side and around, converging on the boss */}
      {around(14, (i, a) => (
        <div key={i} className="lgx" style={{ left: '50%', top: '50%', width: 10, height: 16, background: `linear-gradient(${GLINT}, ${BLOOD})`, clipPath: 'polygon(50% 0, 100% 100%, 0 100%)', '--x0': `${Math.round(Math.cos((a * Math.PI) / 180) * 130) + 40}px`, '--y0': `${Math.round(Math.sin((a * Math.PI) / 180) * 90)}px`, animation: anim('lgxFly', 520, 160 + i * 18, 'cubic-bezier(.55,0,1,.45)') }} />
      ))}
      {ring(BLOOD, 620, 1.9, 7, 560)}
      {ring('#ffffff', 660, 1.2, 3, 420)}
    </>,
    feast: () => <>
      <div className="lgx lgx-full" style={{ background: 'radial-gradient(circle, rgba(224,16,47,0) 35%, rgba(224,16,47,.55) 70%, rgba(90,0,16,.85))', borderRadius: '25%', animation: anim('lgxVignette', 1150) }} />
      {around(9, (i, a) => bat(i, { left: '50%', top: '50%', marginLeft: -15, marginTop: -7, '--x0': `${Math.round(Math.cos((a * Math.PI) / 180) * 150)}px`, '--y0': `${Math.round(Math.sin((a * Math.PI) / 180) * 110) - 30}px`, animation: anim('lgxFly', 700, 80 + i * 55, 'cubic-bezier(.55,0,1,.45)') }))}
      {ring(BLOOD_HOT, 700, 1.7, 5, 500)}
    </>,
  },
  floaters: { drip: 'lg_fx_bloodDrip', ward: 'lg_fx_bloodWard', burst: 'lg_fx_wardBurst', feast: 'lg_fx_bloodFeast' },
  floaterTone: { drip: 'danger', ward: 'danger', burst: 'danger', feast: 'danger' },
  demo: { drip: { kind: 'hit', damage: 2, lives: 0 }, ward: { kind: 'hit', damage: 2, lives: 0 }, burst: { kind: 'hit', damage: 2, lives: 0 }, feast: { kind: 'hit', damage: 5, lives: 0 } },
  juice: {
    drip: { size: 'tick' },
    ward: { size: 'big', shake: 1, flash: 1, hitstop: 1, sfx: 'vampire.ward' },
    burst: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'vampire.burst' },
    feast: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'vampire.feast' },
  },
  css: `
@keyframes lgrVampireSwirl { 0% { transform: rotate(var(--a)) translateY(-90px) rotate(0); opacity: 0 } 20% { opacity: 1 } 100% { transform: rotate(calc(var(--a) + 220deg)) translateY(-8px) rotate(220deg); opacity: .2 } }
@keyframes lgrVampireHex { 0% { transform: scale(.2) rotate(-30deg); opacity: 0 } 25% { transform: scale(1.1) rotate(0); opacity: 1 } 40% { transform: scale(1) } 70% { transform: scale(1) translate(0, 0); opacity: 1 } 100% { transform: scale(.35) translate(170px, 60px); opacity: 0 } }
@keyframes lgrVampireShatter { 0% { transform: scale(1); opacity: 1 } 60% { transform: scale(1.12); opacity: 1 } 100% { transform: scale(1.3); opacity: 0 } }

@keyframes lgrVampireRecoil { 0% { transform: none } 30% { transform: translateX(-8px) scale(.94) } 70% { transform: translateX(-5px) scale(.96) } 100% { transform: none } }
@keyframes lgrVampireCower { 0% { transform: none } 18% { transform: translateY(6px) scaleY(.9) } 30% { transform: translate(-1.5px, 6px) scaleY(.9) } 42% { transform: translate(1.5px, 6px) scaleY(.9) } 54% { transform: translate(-1px, 5px) scaleY(.92) } 100% { transform: none } }
@keyframes lgrVampireSwoon { 0% { transform: none } 30% { transform: rotate(-7deg) } 55% { transform: rotate(-4deg) translateX(2px) } 78% { transform: rotate(-6deg) } 100% { transform: none } }
@keyframes lgrVampireFlick { 0%, 100% { transform: none } 45% { transform: translateY(-5px) rotate(-3deg) } 80% { transform: translateY(-1px) } }
.lgr-vampire-ward { transform-origin: 50% 90%; animation: lgrVampireRecoil 700ms cubic-bezier(.22,1,.36,1) both }
.lgr-vampire-burst { transform-origin: 50% 100%; animation: lgrVampireCower 900ms ease-out both }
.lgr-vampire-feast { transform-origin: 50% 85%; animation: lgrVampireSwoon 1100ms ease-in-out both }
.lgr-vampire-drip { animation: lgrVampireFlick 320ms ease-out both }
/* State-layer motion: the ward droplets circle her on the dotted orbit (one or two, opposite each other), a 6 s loop
   along the ellipse (cx 60, cy 44, rx 34, ry 9; the droplet's own rotate and scale kept), dimmed on the far side
   so it reads as passing behind her head. BossArena's lg-fx-off turns
   it off with the reactions (focus mode, Still bosses, reduced motion). */
@keyframes lgrVampireOrbit { 0% { transform: translate(26.6px, 46.6px) rotate(-70deg) scale(1.7); opacity: 1 } 6.25% { transform: translate(26.2px, 43.1px) rotate(-65deg) scale(1.7); opacity: 1 } 12.5% { transform: translate(30px, 39.8px) rotate(-49deg) scale(1.7); opacity: 0.55 } 18.75% { transform: translate(38.4px, 37.1px) rotate(-27deg) scale(1.7); opacity: 0.3 } 25% { transform: translate(50.1px, 35.4px) rotate(0deg) scale(1.7); opacity: 0.25 } 31.25% { transform: translate(63.3px, 35px) rotate(27deg) scale(1.7); opacity: 0.25 } 37.5% { transform: translate(76px, 36.1px) rotate(49deg) scale(1.7); opacity: 0.3 } 43.75% { transform: translate(86.2px, 38.3px) rotate(65deg) scale(1.7); opacity: 0.55 } 50% { transform: translate(93.4px, 41.4px) rotate(70deg) scale(1.7); opacity: 1 } 56.25% { transform: translate(93.8px, 44.9px) rotate(65deg) scale(1.7); opacity: 1 } 62.5% { transform: translate(90px, 48.2px) rotate(49deg) scale(1.7); opacity: 1 } 68.75% { transform: translate(81.6px, 50.9px) rotate(27deg) scale(1.7); opacity: 1 } 75% { transform: translate(69.9px, 52.6px) rotate(0deg) scale(1.7); opacity: 1 } 81.25% { transform: translate(56.7px, 53px) rotate(-27deg) scale(1.7); opacity: 1 } 87.5% { transform: translate(44px, 51.9px) rotate(-49deg) scale(1.7); opacity: 1 } 93.75% { transform: translate(33.8px, 49.7px) rotate(-65deg) scale(1.7); opacity: 1 } 100% { transform: translate(26.6px, 46.6px) rotate(-70deg) scale(1.7); opacity: 1 } }
.lgfa-vampire-orbit > g { transform-box: view-box; transform-origin: 0 0; animation: lgrVampireOrbit 6s linear infinite }
.lgfa-vampire-orbit > g + g { animation-delay: -3s }
/* THE REAL PARTS: the state layer this ability draws on the boss (its lg-ab-* group in raids/vampire.svg) moves with
   the moment, not only the whole figure. Played only while data-fx is set (never in focus mode, with Still bosses or
   under reduced motion). */
@keyframes lgrVampireWardRise { 0% { transform: translateY(6px) scale(.6) } 45% { transform: translateY(-2px) scale(1.15) } 100% { transform: none } }
.lg-boss[data-fx="ward"] [class*="lg-ab-wards-"] { transform-box: fill-box; transform-origin: center bottom; animation: lgrVampireWardRise 700ms cubic-bezier(.22,1,.36,1) both }
`,
}
