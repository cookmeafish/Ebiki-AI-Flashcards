// What Moonfall (abilities/moonmaw.js) LOOKS like (design v2.1, #21). The fx contract is in fx/index.js.
//   charge  (tick)   a silver glint: one moon pip charges.
//   launch  (medium) a glowing moon arcs up from below and settles into an orbit ring above him.
//   impact  (big)    the moon streaks down from the top left with a long comet tail and craters into him.
// The art (raids/moonmaw.svg, the Lunar Strix) has its own layers per phase: lg-fx-charge (a glint where the next
// moon gathers), lg-fx-launch (a moonlet rising, the eyes glancing UP at it), lg-fx-impact (a fresh crater blown into
// the moon face, one eye squeezed shut), and lg-ab-orbit-1/2 (the moonlets in orbit while they wait to land).
import { center, anim, around, ring } from './_kit'
import { pivots, FALLEN } from '../impact/bosses/moonmaw.parts'

// THE STRIX'S OWN PARTS (raids/moonmaw.svg hook classes; pivots in impact/bosses/moonmaw.parts.jsx) for what is not a
// plain strike moment: its swoop on the player (data-assault-on, from the moment it fires: it hauls its wings up and
// draws the moon face back, then SWOOPS: the wings sweep down, the face lunges at the screen with the beak open, the
// talons drive out and clench as the bite lands; a heavy blow clenches twice), its ability reactions
// (.lgr-moonmaw-<fx>) and its fallen pose after the knockout. Off with every effect (lg-fx-off).
const P = '.lg-boss[data-motif="moonmaw"]'
const A = `${P}[data-assault-on]`
const H = `${P}[data-assault-on][data-moment="hurtBig"]`
const on = (sel, parts, anim) => `${parts.map((p) => `${sel} .lg-moonmaw-${p}`).join(', ')} { animation: ${anim} }`
const PARTS_CSS = `
@keyframes lgrMoonmawSwoopHead { 0% { transform: none } 7% { transform: translateY(-9%) scale(.92) } 10% { transform: translateY(8%) scale(1.22) } 14% { transform: translateY(7%) scale(1.25) } 32% { transform: translateY(6%) scale(1.2) } 36% { transform: translateY(8%) scale(1.24) } 55% { transform: translateY(-1%) } 100% { transform: none } }
@keyframes lgrMoonmawSwoopWingL { 0% { transform: none } 7% { transform: rotate(30deg) } 11% { transform: rotate(-22deg) } 16% { transform: rotate(-26deg) } 40% { transform: rotate(-16deg) } 70% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgrMoonmawSwoopWingR { 0% { transform: none } 7% { transform: rotate(-30deg) } 11% { transform: rotate(22deg) } 16% { transform: rotate(26deg) } 40% { transform: rotate(16deg) } 70% { transform: rotate(-3deg) } 100% { transform: none } }
@keyframes lgrMoonmawSwoopTalon { 0% { transform: none } 7% { transform: translateY(-16%) scale(.9) } 11% { transform: translateY(14%) scale(1.35) } 30% { transform: translateY(12%) scale(1.3) } 34% { transform: translateY(14%) scale(1.22, 1.1) } 50% { transform: translateY(4%) } 100% { transform: none } }
@keyframes lgrMoonmawSwoopBeak { 0% { transform: none } 7% { transform: scaleY(1.3) } 10%, 28% { transform: scaleY(1.9) } 33% { transform: scaleY(.7) } 45% { transform: scaleY(1.05) } 60% { transform: none } }
@keyframes lgrMoonmawSwoopEyes { 0% { transform: none } 7% { transform: scaleY(.55) } 10% { transform: scale(1.18) } 40% { transform: scale(1.12) } 70% { transform: none } }
@keyframes lgrMoonmawSwoopTufts { 0% { transform: none } 7% { transform: scale(.85) } 10% { transform: scale(1.25) } 40% { transform: scale(1.15) } 70% { transform: none } }
${on(A, ['head'], 'lgrMoonmawSwoopHead 1400ms cubic-bezier(.3,.7,.4,1) both')}
${on(A, ['wingl'], 'lgrMoonmawSwoopWingL 1400ms cubic-bezier(.3,.7,.4,1) both')}
${on(A, ['wingr'], 'lgrMoonmawSwoopWingR 1400ms cubic-bezier(.3,.7,.4,1) both')}
${on(A, ['talonl', 'talonr'], 'lgrMoonmawSwoopTalon 1400ms cubic-bezier(.3,.7,.4,1) both')}
${on(A, ['beak'], 'lgrMoonmawSwoopBeak 1400ms ease-out both')}
${on(A, ['eyes'], 'lgrMoonmawSwoopEyes 1400ms ease-out both')}
${on(A, ['tuftl', 'tuftr'], 'lgrMoonmawSwoopTufts 1400ms ease-out both')}
@keyframes lgrMoonmawSwoop2Head { 0% { transform: translateY(-9%) scale(.92) } 3% { transform: translateY(10%) scale(1.28) } 22% { transform: translateY(8%) scale(1.22) } 26% { transform: translateY(-2%) scale(1.1) } 34% { transform: translateY(12%) scale(1.32) } 55% { transform: translateY(6%) scale(1.18) } 78% { transform: none } 100% { transform: none } }
@keyframes lgrMoonmawSwoop2Beak { 0% { transform: scaleY(1.3) } 3%, 20% { transform: scaleY(2) } 24% { transform: scaleY(.6) } 30%, 50% { transform: scaleY(2) } 56% { transform: scaleY(.65) } 75% { transform: none } 100% { transform: none } }
${on(H, ['head'], 'lgrMoonmawSwoop2Head 1300ms cubic-bezier(.3,.7,.4,1) both')}
${on(H, ['beak'], 'lgrMoonmawSwoop2Beak 1300ms linear both')}

@keyframes lgrMoonmawChargeEyes { 0%, 100% { transform: none } 40% { transform: translateY(-12%) scale(1.12) } }
@keyframes lgrMoonmawChargeTufts { 0%, 100% { transform: none } 40% { transform: scale(1.18) translateY(-6%) } }
${on('.lgr-moonmaw-charge', ['eyes'], 'lgrMoonmawChargeEyes 320ms ease-out both')}
${on('.lgr-moonmaw-charge', ['tuftl', 'tuftr'], 'lgrMoonmawChargeTufts 320ms ease-out both')}
@keyframes lgrMoonmawFlingL { 0% { transform: none } 20% { transform: rotate(-12deg) } 38% { transform: rotate(34deg) } 60% { transform: rotate(26deg) } 100% { transform: none } }
@keyframes lgrMoonmawFlingR { 0% { transform: none } 20% { transform: rotate(12deg) } 38% { transform: rotate(-34deg) } 60% { transform: rotate(-26deg) } 100% { transform: none } }
@keyframes lgrMoonmawWatch { 0% { transform: none } 35% { transform: translate(-10%, -18%) scale(1.1) } 75% { transform: translate(-12%, -20%) scale(1.08) } 100% { transform: none } }
@keyframes lgrMoonmawHoot { 0% { transform: none } 30% { transform: scaleY(1.6) } 55% { transform: scaleY(1.3) } 100% { transform: none } }
${on('.lgr-moonmaw-launch', ['wingl'], 'lgrMoonmawFlingL 760ms ease-out both')}
${on('.lgr-moonmaw-launch', ['wingr'], 'lgrMoonmawFlingR 760ms ease-out both')}
${on('.lgr-moonmaw-launch', ['eyes'], 'lgrMoonmawWatch 760ms ease-out both')}
${on('.lgr-moonmaw-launch', ['beak'], 'lgrMoonmawHoot 760ms ease-out both')}
@keyframes lgrMoonmawCrashHead { 0%, 28% { transform: none } 34% { transform: translate(6%, 14%) rotate(14deg) scale(.9) } 52% { transform: translate(3%, 8%) rotate(8deg) scale(.94) } 75% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgrMoonmawCrashEyes { 0%, 28% { transform: none } 32% { transform: scaleY(.1) } 60% { transform: scaleY(.15) } 75% { transform: none } 100% { transform: none } }
@keyframes lgrMoonmawCrashWingL { 0%, 28% { transform: none } 34% { transform: rotate(36deg) } 50% { transform: rotate(-10deg) } 66% { transform: rotate(12deg) } 100% { transform: none } }
@keyframes lgrMoonmawCrashWingR { 0%, 28% { transform: none } 34% { transform: rotate(-36deg) } 50% { transform: rotate(10deg) } 66% { transform: rotate(-12deg) } 100% { transform: none } }
@keyframes lgrMoonmawCrashTalon { 0%, 28% { transform: none } 34% { transform: translateY(-14%) scale(1.15, .7) } 60% { transform: translateY(-6%) scale(1.05, .85) } 100% { transform: none } }
@keyframes lgrMoonmawCrashTufts { 0%, 28% { transform: none } 34% { transform: scale(.6) rotate(-20deg) } 70% { transform: scale(.85) } 100% { transform: none } }
${on('.lgr-moonmaw-impact', ['head'], 'lgrMoonmawCrashHead 1100ms ease-out both')}
${on('.lgr-moonmaw-impact', ['eyes'], 'lgrMoonmawCrashEyes 1100ms linear both')}
${on('.lgr-moonmaw-impact', ['wingl'], 'lgrMoonmawCrashWingL 1100ms ease-out both')}
${on('.lgr-moonmaw-impact', ['wingr'], 'lgrMoonmawCrashWingR 1100ms ease-out both')}
${on('.lgr-moonmaw-impact', ['talonl', 'talonr'], 'lgrMoonmawCrashTalon 1100ms ease-out both')}
${on('.lgr-moonmaw-impact', ['tuftl', 'tuftr'], 'lgrMoonmawCrashTufts 1100ms ease-out both')}

${Object.entries(FALLEN).map(([p, t]) => `${P}:not(.lg-fx-off):has([data-ko-tag]):not([data-moment]) .lg-moonmaw-${p} { transform: ${t} }`).join('\n')}
`

// Fixed bright moonlight colors (never theme tokens over the art).
const M = { core: '#ffffff', moon: '#e8f0ff', rim: '#9fc4ff', glow: '#7fb2ff', dust: '#c9d6f2', crater: '#5a6a96', ink: '#141a2e' }
const MOON = `radial-gradient(circle at 36% 34%, ${M.core} 0 16%, ${M.moon} 38%, ${M.rim} 72%, ${M.crater} 100%)`

// The orbit widget beside the HUD: every moon in orbit and the answers until it lands.
function Hud({ t, state, compact }) {
  const orbit = (state && state.ab && state.ab.orbit) || []
  if (!orbit.length) return null
  const size = compact ? 13 : 16
  return (
    <span role="img" aria-label={t('lg_hud_moonsOrbit', { n: orbit[0] })} style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontWeight: 900, fontSize: 11.5, color: M.rim }}>
      {orbit.map((n, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          <span style={{ width: size, height: size, borderRadius: '50%', background: MOON, boxShadow: `0 0 8px ${M.glow}`, border: `1.5px solid ${M.ink}` }} />
          <span>{n}</span>
        </span>
      ))}
      <span style={{ whiteSpace: 'nowrap' }}>{t('lg_hud_moonsOrbit', { n: orbit[0] })}</span>
    </span>
  )
}

export default {
  effects: {
    charge: () => <>
      {/* a four-point silver star flares where the moon gathers, a crescent sketches itself round it */}
      <svg className="lgx" viewBox="0 0 40 40" style={{ left: '28%', top: '20%', width: 52, height: 52, margin: '-26px 0 0 -26px', overflow: 'visible', filter: `drop-shadow(0 0 8px ${M.glow})`, animation: anim('lgrMoonmawStarFlare', 330, 0, 'cubic-bezier(.2,1.4,.4,1)') }} aria-hidden="true">
        <path d="M27 6A15 15 0 1 0 34 30 12 12 0 1 1 27 6Z" fill="none" stroke={M.rim} strokeWidth="3" />
        <path d="M20 4C21 15 25 19 36 20 25 21 21 25 20 36 19 25 15 21 4 20 15 19 19 15 20 4Z" fill={M.core} stroke={M.ink} strokeWidth="1.2" />
      </svg>
      <div className="lgx" style={{ left: '28%', top: '18%', width: 16, height: 16, borderRadius: '50%', background: `radial-gradient(circle, ${M.core} 0 25%, ${M.rim} 60%, transparent 70%)`, boxShadow: `0 0 12px ${M.glow}`, '--s': 1.8, animation: anim('lgxRing', 340) }} />
      {[0, 1, 2].map((i) => <div key={i} className="lgx" style={{ left: `${26 + i * 4}%`, top: `${17 + (i % 2) * 4}%`, width: 4, height: 4, borderRadius: '50%', background: M.core, boxShadow: `0 0 6px ${M.glow}`, '--h': '-26px', animation: anim('lgxRise', 330, i * 40) }} />)}
    </>,
    launch: () => <>
      {/* the orbit ring the moon joins, tilted like a planet's ring */}
      <div className="lgx" style={{ left: '50%', top: '14%', width: '78%', height: '22%', marginLeft: '-39%', borderRadius: '50%', border: `3px dashed ${M.rim}`, boxShadow: `0 0 14px ${M.glow}`, transform: 'rotate(-8deg)', animation: anim('lgxFade', 800) }} />
      <div className="lgx" style={{ left: '50%', bottom: '-6%', width: 34, height: 34, marginLeft: -17, borderRadius: '50%', background: MOON, border: `2px solid ${M.ink}`, boxShadow: `0 0 18px ${M.glow}, 0 0 40px ${M.glow}`, animation: anim('lgrMoonmawArcUp', 780, 0, 'cubic-bezier(.22,1,.36,1)') }} />
      {[0, 1, 2, 3, 4].map((i) => <div key={i} className="lgx" style={{ left: `${44 + i * 3}%`, bottom: `${4 + i * 9}%`, width: 6 - i, height: 6 - i, borderRadius: '50%', background: M.dust, boxShadow: `0 0 6px ${M.glow}`, animation: anim('lgxFade', 600, 60 + i * 50) }} />)}
    </>,
    impact: () => <>
      {/* the comet: a moon with a long tail, streaking in from the top left */}
      <div className="lgx" style={{ left: '-22%', top: '-26%', width: '95%', height: 22, borderRadius: 11, transformOrigin: 'right center', background: `linear-gradient(90deg, transparent, ${M.glow} 55%, ${M.moon} 88%, ${M.core})`, filter: `drop-shadow(0 0 10px ${M.glow})`, animation: anim('lgrMoonmawStreak', 520, 0, 'cubic-bezier(.55,0,.9,.5)') }} />
      <div className="lgx" style={{ left: '50%', top: '46%', width: 40, height: 40, margin: '-20px 0 0 -20px', borderRadius: '50%', background: MOON, border: `2px solid ${M.ink}`, boxShadow: `0 0 26px ${M.core}`, animation: anim('lgrMoonmawCrater', 1150) }} />
      {ring(M.core, 330, 1.7, 6, 500)}{ring(M.rim, 400, 2.4, 4, 750)}{ring(M.dust, 480, 3, 2, 800)}
      {around(18, (i, a) => <div key={i} className="lgx" style={{ ...center, width: i % 3 ? 8 : 12, height: i % 3 ? 8 : 12, marginLeft: -4, borderRadius: i % 2 ? '50%' : 2, background: i % 4 ? M.dust : M.core, boxShadow: `0 0 6px ${M.glow}`, '--a': `${a}deg`, '--d': `${-70 - (i % 4) * 16}px`, '--spin': `${(i % 2 ? 1 : -1) * 260}deg`, animation: anim('lgxShard', 760 + (i % 3) * 120, 340 + (i % 3) * 20) }} />)}
      {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="lgx" style={{ left: `${20 + i * 11}%`, top: '58%', width: 14, height: 9, borderRadius: '50%', background: M.dust, opacity: 0.8, '--spin': `${i % 2 ? 40 : -40}deg`, animation: anim('lgxFall', 700, 420 + i * 40) }} />)}
    </>,
  },
  floaters: { charge: 'lg_fx_moonCharge', launch: 'lg_fx_moonLaunch', impact: 'lg_fx_moonfall' },
  floaterTone: { charge: 'info', launch: 'info', impact: 'ink' },
  demo: { charge: { kind: 'hit', damage: 2, lives: 0 }, launch: { kind: 'hit', damage: 2, lives: 0 }, impact: { kind: 'hit', damage: 2, lives: 0 } },
  juice: {
    charge: { size: 'tick' },
    launch: { size: 'medium', shake: 1, sfx: 'moonmaw.launch' },
    impact: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'moonmaw.impact' },
  },
  Hud,
  css: `
@keyframes lgrMoonmawStarFlare { 0% { transform: scale(.2) rotate(-60deg); opacity: 0 } 45% { transform: scale(1.2) rotate(10deg); opacity: 1 } 70% { transform: scale(1) rotate(0); opacity: 1 } 100% { transform: scale(.8) rotate(20deg); opacity: 0 } }
@keyframes lgrMoonmawArcUp { 0% { transform: translate(0, 0) scale(.5); opacity: 0 } 12% { opacity: 1 } 70% { transform: translate(-40px, -150px) scale(.9) } 100% { transform: translate(-70px, -175px) scale(.55); opacity: .85 } }
@keyframes lgrMoonmawStreak { 0% { transform: translate(-60px, -40px) rotate(38deg) scaleX(.2); opacity: 0 } 15% { opacity: 1 } 100% { transform: translate(60px, 105px) rotate(38deg) scaleX(1); opacity: 0 } }
@keyframes lgrMoonmawCrater { 0%, 26% { transform: scale(0); opacity: 0 } 30% { transform: scale(1.35); opacity: 1 } 42% { transform: scale(.9) } 60% { transform: scale(1); opacity: 1 } 100% { transform: scale(1.6); opacity: 0 } }
.lgr-moonmaw-charge { animation: lgrMoonmawGlint 300ms cubic-bezier(.22,1,.36,1) both }
@keyframes lgrMoonmawGlint { 0%, 100% { transform: none } 45% { transform: translateY(-5px) scale(1.04) } }
.lgr-moonmaw-launch { animation: lgrMoonmawLook 620ms cubic-bezier(.22,1,.36,1) both; transform-origin: 50% 70% }
@keyframes lgrMoonmawLook { 0%, 100% { transform: none } 35% { transform: rotate(-9deg) translateY(-6px) } 65% { transform: rotate(-6deg) translateY(-4px) } }
.lgr-moonmaw-impact { animation: lgrMoonmawKnock 900ms cubic-bezier(.22,1,.36,1) both; transform-origin: 60% 80% }
@keyframes lgrMoonmawKnock { 0% { transform: none } 28% { transform: none } 36% { transform: rotate(8deg) translate(4px, 6px) } 55% { transform: rotate(-3deg) translate(-1px, -2px) } 75% { transform: rotate(1.5deg) translateY(1px) } 100% { transform: none } }
.lg-boss[data-phase="3"] .lgr-moonmaw-impact { animation-name: lgrMoonmawKnockEclipse }
@keyframes lgrMoonmawKnockEclipse { 0% { transform: none } 28% { transform: none } 36% { transform: rotate(8deg) translate(4px, 6px) scale(1.04, .9) } 55% { transform: rotate(-3deg) translate(-1px, -2px) scale(.98, 1.03) } 75% { transform: rotate(1.5deg) translateY(1px) } 100% { transform: none } }
/* THE REAL PARTS: the state layer this ability draws on the boss (its lg-ab-* group in raids/moonmaw.svg) moves with
   the moment, not only the whole figure. Played only while data-fx is set (never in focus mode, with Still bosses or
   under reduced motion). */
@keyframes lgrMoonmawOrbitPop { 0% { transform: none } 35% { transform: scale(1.25) } 65% { transform: scale(.94) } 100% { transform: none } }
.lg-boss[data-fx="charge"] [class*="lg-ab-orbit-"], .lg-boss[data-fx="launch"] [class*="lg-ab-orbit-"] { transform-box: fill-box; transform-origin: center; animation: lgrMoonmawOrbitPop 320ms cubic-bezier(.22,1,.36,1) both }
` + pivots + PARTS_CSS,
}
