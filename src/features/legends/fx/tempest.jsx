// What the Thunder God's storm measure (ability id `drums`) LOOKS like: Zeus keeps time with four storm orbs, the 4th
// ringed in gold (the art's lg-ab-drums-1..3 layers glow the charged ones). The fx contract is in fx/index.js, the juice
// format in fx/_juice.js. Fixed bright colors (an effect plays over any palette, in both themes); BossArena skips all of
// it in focus mode, with Still bosses and under reduced motion. The floater already starts with the answer's damage
// ("-3 THUNDER!"), so the floater texts never repeat the number.
import { anim, around, ring } from './_kit'

const CYAN = '#6fe3ff'

// THE DRAWING ACTS IT OUT (impact/bosses/README.md): Zeus's own parts in raids/tempest.svg move for every strike
// moment, his attack on you and the storm measure, keyed by the arena's data-moment / data-assault-on and
// .lgr-tempest-<fx>. Parts (lg-tempest-*, pivots set in the file): arm (the bolt arm, every phase), head (every phase),
// fist (the other arm, phases 1-2), beast (the sea dragon's head, phases 2-3). Here (not tempest.parts.jsx) because this
// CSS is in the arena all fight long and his bolt also lands on ability blows. Transforms and opacity only.
const B = '.lg-boss[data-motif="tempest"]'
const on = (state, parts) => Object.entries(parts).map(([p, a]) => `${B}${state} .lg-tempest-${p} { animation: ${a} }`).join('\n')
const DRAWING = `
@keyframes lgrTemSnapBack { 0% { transform: none } 14% { transform: translateY(-3px) rotate(-10deg) } 40% { transform: rotate(4deg) } 70% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgrTemClench { 0%, 100% { transform: none } 14% { transform: scale(.85) rotate(-8deg) } 45% { transform: scale(.95) } }
@keyframes lgrTemBeastFlinch { 0%, 100% { transform: none } 14% { transform: translate(-3px, -3px) rotate(-6deg) scale(.95) } 45% { transform: rotate(2deg) } }
@keyframes lgrTemWhiplash { 0% { transform: none } 10% { transform: translate(-4px, -4px) rotate(-18deg) scale(.92) } 30% { transform: rotate(10deg) } 54% { transform: rotate(-5deg) } 78% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgrTemLoseGrip { 0% { transform: none } 12% { transform: rotate(-28deg) translateY(4px) } 40% { transform: rotate(-12deg) translateY(2px) } 70% { transform: rotate(4deg) } 100% { transform: none } }
@keyframes lgrTemBeastRear { 0% { transform: none } 12% { transform: translateY(-8px) rotate(-12deg) scale(1.06) } 40% { transform: translateY(-3px) rotate(4deg) } 100% { transform: none } }
@keyframes lgrTemArmCut { 0%, 100% { transform: none } 6% { transform: rotate(14deg) translateY(3px) } 16% { transform: rotate(-8deg) } 26% { transform: rotate(6deg) } 38% { transform: rotate(-3deg) } 55% { transform: none } }
@keyframes lgrTemWince { 0%, 100% { transform: none } 10% { transform: scale(1.06, .88) rotate(6deg) } 45% { transform: scale(1.03, .94) rotate(3deg) } }
@keyframes lgrTemBeastSide { 0%, 100% { transform: none } 10% { transform: translateX(-8px) skewX(8deg) } 30% { transform: translateX(3px) skewX(-4deg) } 55% { transform: none } }
@keyframes lgrTemGlare { 0% { transform: none } 20% { transform: translateY(-2px) scale(.96) } 36% { transform: translateY(3px) rotate(4deg) scale(1.12) } 70% { transform: translateY(2px) rotate(3deg) scale(1.08) } 100% { transform: none } }
@keyframes lgrTemPunch { 0% { transform: none } 18% { transform: translate(-4px, -2px) rotate(-14deg) } 34% { transform: translate(8px, -2px) rotate(16deg) scale(1.18) } 60% { transform: translate(6px, -1px) rotate(12deg) scale(1.12) } 100% { transform: none } }
@keyframes lgrTemHurl { 0% { transform: none } 14% { transform: rotate(-30deg) } 24% { transform: rotate(48deg) translateY(2px) } 34% { transform: rotate(40deg) translateY(1px) } 62% { transform: rotate(34deg) } 100% { transform: none } }
@keyframes lgrTemBeastLunge { 0% { transform: none } 16% { transform: translateX(-4px) scale(.95) } 30% { transform: translate(10px, 3px) scale(1.16) } 56% { transform: translate(7px, 2px) scale(1.1) } 100% { transform: none } }
@keyframes lgrTemSlam { 0% { transform: none } 24% { transform: rotate(-48deg) translateY(-4px) } 38% { transform: rotate(62deg) translateY(4px) } 48% { transform: rotate(54deg) translateY(3px) } 74% { transform: rotate(38deg) } 100% { transform: none } }
@keyframes lgrTemRoar { 0% { transform: none } 22% { transform: translateY(-4px) rotate(-6deg) } 38% { transform: translateY(3px) rotate(3deg) scale(1.2) } 66% { transform: translateY(2px) scale(1.1) } 100% { transform: none } }
@keyframes lgrTemFistSlam { 0% { transform: none } 22% { transform: translateY(-10px) rotate(-30deg) } 38% { transform: translateY(5px) rotate(10deg) scale(1.2, .85) } 60% { transform: translateY(3px) scale(1.08, .94) } 100% { transform: none } }
@keyframes lgrTemChomp { 0% { transform: none } 20% { transform: translateY(-6px) scale(.92) } 34% { transform: translate(6px, 5px) scale(1.28) } 44% { transform: translate(5px, 3px) scale(1.18) } 54% { transform: translate(6px, 5px) scale(1.26) } 80% { transform: translate(2px, 1px) scale(1.06) } 100% { transform: none } }
@keyframes lgrTemGuard { 0% { transform: none } 14% { transform: rotate(72deg) translateY(4px) } 30% { transform: rotate(62deg) translateY(3px) } 44% { transform: rotate(68deg) translateY(4px) } 72% { transform: rotate(66deg) translateY(4px) } 100% { transform: none } }
@keyframes lgrTemTurnAway { 0% { transform: none } 16% { transform: translateX(-3px) rotate(-8deg) scale(.95) } 50% { transform: translateX(-2px) rotate(-6deg) scale(.96) } 100% { transform: none } }
@keyframes lgrTemBrace { 0%, 100% { transform: none } 16% { transform: translateY(-6px) rotate(-22deg) } 60% { transform: translateY(-5px) rotate(-18deg) } }
@keyframes lgrTemFury { 0%, 100% { transform: none } 10% { transform: rotate(-8deg) } 22% { transform: rotate(8deg) } 34% { transform: rotate(-7deg) } 46% { transform: rotate(5deg) } 60% { transform: rotate(-2deg) } 75% { transform: none } }
@keyframes lgrTemShakeBolt { 0%, 100% { transform: none } 8% { transform: rotate(-10deg) } 16% { transform: rotate(8deg) } 24% { transform: rotate(-9deg) } 32% { transform: rotate(7deg) } 44% { transform: rotate(-4deg) } 60% { transform: none } }
@keyframes lgrTemBeastSnap { 0% { transform: none } 16% { transform: translate(6px, 2px) scale(1.12) } 30% { transform: translate(-4px, -2px) scale(.9) } 55% { transform: none } 100% { transform: none } }
@keyframes lgrTemDroop { 0% { transform: none } 30% { transform: translateY(4px) rotate(8deg) scale(.97) } 70% { transform: translateY(4px) rotate(7deg) scale(.97) } 100% { transform: none } }
@keyframes lgrTemArmSag { 0% { transform: none } 30% { transform: rotate(-26deg) translateY(4px) } 70% { transform: rotate(-24deg) translateY(4px) } 100% { transform: none } }
@keyframes lgrTemFistOpen { 0%, 100% { transform: none } 30% { transform: translateY(4px) rotate(12deg) scale(.92) } 70% { transform: translateY(4px) rotate(10deg) scale(.93) } }
@keyframes lgrTemBeastSink { 0%, 100% { transform: none } 30% { transform: translateY(6px) rotate(6deg) } 70% { transform: translateY(5px) rotate(5deg) } }
@keyframes lgrTemKoArm { 0% { transform: none } 20% { transform: rotate(-12deg) } 30% { transform: rotate(10deg) } 40% { transform: rotate(-16deg) } 55% { transform: rotate(-40deg) translateY(-4px) } 72% { transform: rotate(-80deg) translateY(16px); opacity: 1 } 84% { transform: rotate(-74deg) translateY(14px) } 100% { transform: rotate(-76deg) translateY(15px); opacity: 1 } }
@keyframes lgrTemKoHead { 0% { transform: none } 20% { transform: rotate(6deg) } 32% { transform: rotate(-6deg) } 46% { transform: rotate(5deg) } 56% { transform: translateY(-4px) rotate(-14deg) scale(1.1) } 74% { transform: translateY(8px) rotate(18deg) } 86% { transform: translateY(6px) rotate(13deg) } 100% { transform: translateY(7px) rotate(15deg) } }
@keyframes lgrTemKoFist { 0%, 50% { transform: none } 72% { transform: translateY(10px) rotate(30deg) } 100% { transform: translateY(9px) rotate(26deg) } }
@keyframes lgrTemKoBeast { 0% { transform: none } 30% { transform: translateY(-4px) rotate(-6deg) } 52% { transform: translateY(-8px) rotate(-12deg) scale(1.1) } 74% { transform: translateY(22px) rotate(14deg) scale(.95) } 86% { transform: translateY(18px) rotate(10deg) scale(.95) } 100% { transform: translateY(20px) rotate(12deg) scale(.95) } }
${on('[data-moment="hit"]', { head: 'lgrTemSnapBack 520ms ease-out', fist: 'lgrTemClench 520ms ease-out', beast: 'lgrTemBeastFlinch 520ms ease-out' })}
${on('[data-moment="crit"]', { head: 'lgrTemWhiplash 820ms cubic-bezier(.2,.9,.3,1)', arm: 'lgrTemLoseGrip 820ms cubic-bezier(.2,.9,.3,1)', beast: 'lgrTemBeastRear 820ms ease-out', fist: 'lgrTemClench 700ms ease-out' })}
${on('[data-moment="sharpen"]', { arm: 'lgrTemArmCut 760ms linear', head: 'lgrTemWince 760ms ease-out', beast: 'lgrTemBeastSide 760ms ease-out' })}
${on('[data-moment="hurt"]', { head: 'lgrTemGlare 820ms cubic-bezier(.3,1.3,.5,1)', fist: 'lgrTemPunch 820ms cubic-bezier(.3,1.3,.5,1)' })}
${on('[data-assault-on]', { arm: 'lgrTemHurl 900ms cubic-bezier(.3,1.3,.5,1)', beast: 'lgrTemBeastLunge 900ms cubic-bezier(.3,1.3,.5,1)' })}
${on('[data-moment="hurtBig"]', { arm: 'lgrTemSlam 1000ms cubic-bezier(.3,1.2,.5,1)', head: 'lgrTemRoar 1000ms cubic-bezier(.3,1.2,.5,1)', fist: 'lgrTemFistSlam 950ms cubic-bezier(.3,1.2,.5,1)', beast: 'lgrTemChomp 1000ms cubic-bezier(.3,1.3,.5,1)' })}
${on('[data-moment="block"]', { arm: 'lgrTemGuard 700ms cubic-bezier(.2,.9,.3,1)', head: 'lgrTemTurnAway 700ms ease-out', fist: 'lgrTemBrace 700ms ease-out', beast: 'lgrTemBeastFlinch 700ms ease-out' })}
${on('[data-moment="shield"]', { head: 'lgrTemFury 760ms ease-out', arm: 'lgrTemShakeBolt 760ms linear', beast: 'lgrTemBeastSnap 760ms ease-out' })}
${on('[data-moment="wind"]', { head: 'lgrTemDroop 1100ms ease-in-out', arm: 'lgrTemArmSag 1100ms ease-in-out', fist: 'lgrTemFistOpen 1100ms ease-in-out', beast: 'lgrTemBeastSink 1100ms ease-in-out' })}
${on('[data-moment="ko"]', { arm: 'lgrTemKoArm 2100ms ease-in both', head: 'lgrTemKoHead 2100ms ease-in-out both', fist: 'lgrTemKoFist 2100ms ease-in both', beast: 'lgrTemKoBeast 2100ms ease-in both' })}
${B}[data-down] .lg-tempest-arm { transform: rotate(-76deg) translateY(15px) }
${B}[data-down] .lg-tempest-head { transform: translateY(7px) rotate(15deg) }
${B}[data-down] .lg-tempest-fist { transform: translateY(9px) rotate(26deg) }
${B}[data-down] .lg-tempest-beast { transform: translateY(20px) rotate(12deg) scale(.95) }
/* the storm measure: each beat his free fist pounds the drum and he nods to it; a dud measure he shrugs and lowers the
   bolt; the THUNDER he hurls it two-handed overhead while the dragon bellows */
@keyframes lgrTemDrumFist { 0%, 100% { transform: none } 30% { transform: translateY(5px) scale(1.12, .88) } 60% { transform: translateY(-1px) } }
@keyframes lgrTemNod { 0%, 100% { transform: none } 30% { transform: translateY(3px) rotate(6deg) } }
@keyframes lgrTemArmBeat { 0%, 100% { transform: none } 30% { transform: rotate(10deg) } }
@keyframes lgrTemShrug { 0%, 100% { transform: none } 40% { transform: translateY(-2px) rotate(-8deg) } }
@keyframes lgrTemArmDud { 0%, 100% { transform: none } 40% { transform: rotate(-18deg) translateY(3px) } }
@keyframes lgrTemThunderArm { 0% { transform: none } 22% { transform: rotate(-40deg) translateY(-6px) scale(1.08) } 36% { transform: rotate(-44deg) translateY(-7px) scale(1.1) } 48% { transform: rotate(58deg) translateY(3px) } 70% { transform: rotate(40deg) } 100% { transform: none } }
${B} .lgr-tempest-drum .lg-tempest-fist { animation: lgrTemDrumFist 320ms cubic-bezier(.22,1,.36,1) }
${B} .lgr-tempest-drum .lg-tempest-head { animation: lgrTemNod 320ms ease-out }
${B} .lgr-tempest-drum .lg-tempest-arm { animation: lgrTemArmBeat 320ms ease-out }
${B} .lgr-tempest-dud .lg-tempest-head { animation: lgrTemShrug 340ms ease-out }
${B} .lgr-tempest-dud .lg-tempest-arm { animation: lgrTemArmDud 340ms ease-out }
${B} .lgr-tempest-thunder .lg-tempest-arm { animation: lgrTemThunderArm 1000ms cubic-bezier(.3,1.2,.5,1) }
${B} .lgr-tempest-thunder .lg-tempest-head { animation: lgrTemRoar 1000ms cubic-bezier(.3,1.2,.5,1) }
${B} .lgr-tempest-thunder .lg-tempest-beast { animation: lgrTemChomp 1000ms cubic-bezier(.3,1.3,.5,1) 120ms }
${B} .lgr-tempest-thunder .lg-tempest-fist { animation: lgrTemFistSlam 950ms cubic-bezier(.3,1.2,.5,1) 80ms }
`

const GOLD = '#fff3a0'
const BOLT = 'M24 0 L10 46 L22 46 L8 100 L34 38 L21 38 L32 0Z'

// One jagged bolt striking down onto the boss (left %, delay ms, tilt deg), with a white impact star where it lands.
const bolt = (left, delay, tilt) => (
  <div key={left} className="lgx" style={{ left: `${left}%`, top: '-60%', width: '26%', height: '125%', transform: `rotate(${tilt}deg)`, transformOrigin: 'bottom center' }}>
    <svg className="lgx" viewBox="0 0 40 100" preserveAspectRatio="none" style={{ left: 0, top: 0, width: '100%', height: '100%', filter: `drop-shadow(0 0 6px ${CYAN})`, animation: anim('lgrTempestStrike', 950, delay, 'linear') }}>
      <path d={BOLT} fill="#ffffff" stroke={CYAN} strokeWidth="3" strokeLinejoin="round" />
      <path d={BOLT} fill={GOLD} transform="translate(8 6) scale(.6)" />
    </svg>
    <div className="lgx" style={{ left: '50%', bottom: '-6%', width: 34, height: 34, marginLeft: -17, background: 'radial-gradient(circle, #fff 0 30%, rgba(111,227,255,.9) 45%, transparent 70%)', clipPath: 'polygon(50% 0, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0 50%, 39% 39%)', animation: anim('lgrTempestImpact', 600, delay + 60) }} />
  </div>
)

export default {
  effects: {
    // Drum (tick): a beat charges an orb. A cyan storm orb flares up over the boss, a crackle of little bolts
    // snaps out of it and a ring of charge pulses away.
    drum: () => <>
      <div className="lgx" style={{ left: '50%', top: '26%', width: 46, height: 46, marginLeft: -23, marginTop: -23, borderRadius: '50%', background: `radial-gradient(circle at 42% 40%, #ffffff 0 22%, #bff4ff 34%, ${CYAN} 56%, rgba(43,184,234,.55) 72%, transparent 74%)`, boxShadow: `0 0 16px ${CYAN}, 0 0 4px #fff`, animation: anim('lgrTempestOrb', 380) }} />
      {around(6, (i, a) => <div key={i} className="lgx" style={{ left: '50%', top: '26%', width: 5, height: 20, background: '#ffffff', borderRadius: 2, boxShadow: `0 0 6px ${CYAN}, 0 0 2px #fff`, '--a': `${a + 18}deg`, '--d': `${-48 - (i % 2) * 10}px`, '--spin': '0deg', animation: anim('lgxShard', 380, 30 + (i % 2) * 50) }} />)}
      <div className="lgx" style={{ left: '50%', top: '26%', width: 40, height: 40, borderRadius: '50%', border: `3px solid ${CYAN}`, '--s': 1.9, animation: anim('lgxRing', 360, 60) }} />
    </>,
    // Dud (tick): a wrong beat. A grey orb sputters, shrinks and goes dark with a wisp of smoke.
    dud: () => <>
      <div className="lgx" style={{ left: '50%', top: '26%', width: 34, height: 34, marginLeft: -17, marginTop: -17, borderRadius: '50%', background: 'radial-gradient(circle at 42% 40%, #d7dce6 0 20%, #9aa3b5 45%, #5d6577 70%, transparent 72%)', boxShadow: `0 0 10px ${CYAN}`, animation: anim('lgrTempestFizzle', 420) }} />
      {around(3, (i) => <div key={i} className="lgx" style={{ left: `${44 + i * 6}%`, top: '20%', width: 9, height: 9, borderRadius: '50%', background: '#9aa3b5', '--h': '-26px', animation: anim('lgxRise', 360, 120 + i * 40) }} />)}
    </>,
    // Thunder (big): the arena goes dark, three bolts strike down onto the boss with white impact stars, sparks fly.
    thunder: () => <>
      <div className="lgx lgx-full" style={{ background: 'radial-gradient(circle, rgba(10,12,40,.15), rgba(6,8,30,.7))', borderRadius: '50%', animation: anim('lgrTempestDark', 1100) }} />
      {bolt(14, 0, -8)}{bolt(37, 90, 3)}{bolt(60, 200, 10)}
      {ring('#ffffff', 120, 1.9, 5, 600)}
      {ring(CYAN, 220, 2.3, 3, 800)}
      {around(12, (i, a) => <div key={`s${i}`} className="lgx" style={{ left: '50%', top: '62%', width: 6, height: 6, borderRadius: '50%', background: i % 2 ? GOLD : '#ffffff', boxShadow: `0 0 8px ${CYAN}`, '--a': `${a}deg`, '--d': `${-60 - (i % 3) * 18}px`, animation: anim('lgxShard', 700, 150 + (i % 4) * 30) }} />)}
    </>,
  },
  floaters: { drum: 'lg_fx_drumsDrum', dud: 'lg_fx_drumsDud', thunder: 'lg_fx_drumsThunder' },
  floaterTone: { drum: 'info', dud: 'ink', thunder: 'info' },
  juice: {
    drum: { size: 'tick', sfx: 'tempest.drum' },
    dud: { size: 'tick', sfx: 'tempest.dud' },
    thunder: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'tempest.thunder' },
  },
  demo: { drum: { damage: 2 }, dud: { kind: 'miss', damage: 0, lives: 1 }, thunder: { damage: 5, fxVars: { n: 3 } } },
  // Reactions (body only): thunder = an electrocution jolt (40 ms jitter steps with a brightness flicker, harder in
  // phase 3), drum = a 2 px bob as an orb charges, dud = a scornful head tilt at the fizzled orb.
  css: `
@keyframes lgrTempestStrike { 0%, 6% { opacity: 0 } 8%, 20% { opacity: 1 } 24% { opacity: .15 } 30%, 42% { opacity: 1 } 60% { opacity: .8 } 100% { opacity: 0 } }
@keyframes lgrTempestImpact { 0% { transform: scale(.2) rotate(0); opacity: 0 } 25% { transform: scale(1.5) rotate(20deg); opacity: 1 } 100% { transform: scale(.6) rotate(45deg); opacity: 0 } }
@keyframes lgrTempestDark { 0% { opacity: 0 } 12% { opacity: 1 } 70% { opacity: .9 } 100% { opacity: 0 } }
@keyframes lgrTempestOrb { 0% { transform: scale(.3); opacity: 0; filter: brightness(1) } 25% { transform: scale(1.25); opacity: 1; filter: brightness(1.7) } 45% { transform: scale(.95); filter: brightness(1.1) } 60% { transform: scale(1.08); filter: brightness(1.4) } 100% { transform: scale(.85); opacity: 0; filter: brightness(1) } }
@keyframes lgrTempestFizzle { 0% { transform: scale(.9); opacity: 0; box-shadow: 0 0 10px #6fe3ff } 20% { transform: scale(1); opacity: .95; box-shadow: 0 0 4px #6fe3ff } 32% { transform: translateX(-1px) scale(.92); opacity: .6 } 44% { transform: translateX(1px) scale(.96); opacity: .85; box-shadow: 0 0 0 transparent } 60% { transform: scale(.7); opacity: .5 } 100% { transform: scale(.35); opacity: 0 } }
@keyframes lgrTempestJolt { 0% { transform: none; filter: none } 8% { transform: translate(-6px, 2px) scale(1.04); filter: brightness(1.6) } 16% { transform: translate(6px, -2px); filter: none } 24% { transform: translate(-5px, -1px); filter: brightness(1.5) } 32% { transform: translate(4px, 2px); filter: none } 40% { transform: translate(-3px, 1px); filter: brightness(1.4) } 48% { transform: translate(2px, -1px); filter: none } 56% { transform: translate(-1px, 0); filter: brightness(1.2) } 64%, 100% { transform: none; filter: none } }
@keyframes lgrTempestJoltP3 { 0% { transform: none; filter: none } 8% { transform: translate(-8px, 3px) rotate(-2deg) scale(1.06); filter: brightness(1.8) } 16% { transform: translate(8px, -3px) rotate(2deg); filter: none } 24% { transform: translate(-6px, -1px); filter: brightness(1.7) } 32% { transform: translate(5px, 2px); filter: none } 40% { transform: translate(-3px, 1px); filter: brightness(1.5) } 48% { transform: translate(2px, -1px); filter: none } 56% { transform: translate(-1px, 0); filter: brightness(1.3) } 64%, 100% { transform: none; filter: none } }
@keyframes lgrTempestBeat { 0%, 100% { transform: none } 35% { transform: translateY(5px) scale(1.04, .96) } 70% { transform: translateY(-2px) } }
@keyframes lgrTempestScoff { 0%, 100% { transform: none } 45% { transform: rotate(-6deg) translateY(-3px) } 80% { transform: rotate(-1deg) } }
.lgr-tempest-thunder { animation: lgrTempestJolt 500ms steps(1, end) both }
.lg-boss[data-phase="3"] .lgr-tempest-thunder { animation-name: lgrTempestJoltP3 }
.lgr-tempest-drum { animation: lgrTempestBeat 320ms cubic-bezier(.22,1,.36,1) both }
.lgr-tempest-dud { animation: lgrTempestScoff 320ms cubic-bezier(.22,1,.36,1) both; transform-origin: bottom center }
/* THE REAL PARTS: the state layer this ability draws on the boss (its lg-ab-* group in raids/tempest.svg) moves with
   the moment, not only the whole figure. Played only while data-fx is set (never in focus mode, with Still bosses or
   under reduced motion). */
@keyframes lgrTempestDrumHit { 0% { transform: none } 35% { transform: scale(1.25) } 65% { transform: scale(.94) } 100% { transform: none } }
.lg-boss[data-fx="drum"] [class*="lg-ab-drums-"] { transform-box: fill-box; transform-origin: center; animation: lgrTempestDrumHit 320ms cubic-bezier(.22,1,.36,1) both }
` + DRAWING,
}
