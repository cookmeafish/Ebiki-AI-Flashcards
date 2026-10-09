// What the lich raid ability (minions: Raise Dead) LOOKS like. The fx contract is in fx/index.js, the juice in
// fx/_juice.js. Fixed bright colors (never theme tokens over the art).
import { center, anim, around, ring, flash } from './_kit'

const SOUL = '#5dff9a'
const BONE = '#f4f1e4'

// THE DRAWING ACTS IT OUT (impact/bosses/README.md): the lich's own SVG parts (raids/lich.svg, `lg-lich-*` wrappers
// with their pivots) move for every strike moment, his attack on you and each ability, keyed by the arena's
// data-moment / data-assault-on and the .lgr-lich-<fx> class. Phases 1-2: head, eyes, crown, book, staff, phylactery
// (gem); phase 3: head, gem, the spirit face (spirit), the hood and the two soulfire hands (flamel, flamer). It lives
// here, not in lich.parts.jsx, because this CSS is in the arena all fight long (the parts CSS only while a strike
// moment plays, and his attack also lands on ability blows). Transforms and opacity only; never while effects are off
// (the arena sets none of these attributes then). Fallen: the dead pose holds while the arena greys him out.
const B = '.lg-boss[data-motif="lich"]'
const on = (state, parts) => Object.entries(parts).map(([p, a]) => `${B}${state} .lg-lich-${p} { animation: ${a} }`).join('\n')
const DRAWING = `
@keyframes lgrLichHitHead { 0% { transform: none } 14% { transform: translate(-2px, -2px) rotate(-10deg) } 38% { transform: rotate(4deg) } 64% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgrLichBlink { 0%, 100% { opacity: 1 } 12% { opacity: .1 } 40% { opacity: .1 } 55% { opacity: 1 } }
@keyframes lgrLichGemFlicker { 0%, 100% { opacity: 1 } 15% { opacity: .35 } 30% { opacity: 1 } 45% { opacity: .5 } }
@keyframes lgrLichCritHead { 0% { transform: none } 10% { transform: translate(5px, 2px) rotate(18deg) scale(.9) } 30% { transform: rotate(-9deg) } 52% { transform: rotate(5deg) } 76% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgrLichCrownPop { 0% { transform: none } 12% { transform: translate(7px, -14px) rotate(40deg) } 34% { transform: translate(10px, -18px) rotate(75deg) } 62% { transform: translate(2px, -2px) rotate(-8deg) } 80% { transform: rotate(4deg) } 100% { transform: none } }
@keyframes lgrLichGemCrack { 0% { transform: none } 10% { transform: scale(1.3) } 20% { transform: scale(.82) } 32% { transform: scale(1.12) translateX(1px) } 46% { transform: scale(.95) translateX(-1px) } 100% { transform: none } }
@keyframes lgrLichSpiritReel { 0% { transform: none } 12% { transform: translateY(-5px) rotate(-8deg) scale(.9) } 40% { transform: rotate(4deg) } 70% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgrLichBookSlam { 0% { transform: none } 10% { transform: translateY(4px) rotate(28deg) scaleX(.55) } 55% { transform: translateY(6px) rotate(20deg) scaleX(.6) } 100% { transform: none } }
@keyframes lgrLichStaffJar { 0%, 100% { transform: none } 8% { transform: translateX(3px) rotate(6deg) } 18% { transform: translateX(-3px) rotate(-5deg) } 28% { transform: translateX(2px) rotate(4deg) } 40% { transform: translateX(-1px) rotate(-2deg) } 55% { transform: none } }
@keyframes lgrLichWince { 0%, 100% { transform: none } 10% { transform: scale(1.2, .2) } 45% { transform: scale(1.15, .3) } 60% { transform: none } }
@keyframes lgrLichSnuff { 0% { transform: none; opacity: 1 } 12% { transform: scale(.25, .15); opacity: .2 } 50% { transform: scale(.3, .2); opacity: .3 } 80% { transform: scale(1.15); opacity: 1 } 100% { transform: none; opacity: 1 } }
@keyframes lgrLichHoodRip { 0%, 100% { transform: none } 10% { transform: skewX(-6deg) scaleX(1.04) } 22% { transform: skewX(5deg) } 36% { transform: skewX(-3deg) } 52% { transform: none } }
@keyframes lgrLichCackle { 0% { transform: none } 16% { transform: translateY(2px) rotate(4deg) scale(1.05) } 26% { transform: translateY(-1px) rotate(4deg) scale(1.05) } 36% { transform: translateY(2px) rotate(3deg) scale(1.05) } 46% { transform: translateY(-1px) rotate(3deg) scale(1.04) } 56% { transform: translateY(2px) rotate(2deg) scale(1.03) } 100% { transform: none } }
@keyframes lgrLichFlare { 0%, 100% { transform: none; opacity: 1 } 15% { transform: scale(1.45); opacity: .6 } 22% { transform: scale(1.3); opacity: 1 } 40% { transform: scale(1.25) } 70% { transform: scale(1.05) } }
@keyframes lgrLichBookLift { 0% { transform: none } 20% { transform: translate(-2px, -6px) rotate(-14deg) } 60% { transform: translate(-2px, -5px) rotate(-12deg) } 100% { transform: none } }
@keyframes lgrLichSpiritBite { 0% { transform: none } 18% { transform: translateY(-3px) scale(.94) } 34% { transform: translateY(6px) scale(1.22) } 58% { transform: translateY(4px) scale(1.14) } 100% { transform: none } }
@keyframes lgrLichCastStaff { 0% { transform: none } 15% { transform: translate(-3px, 1px) rotate(-30deg) } 30% { transform: translate(9px, -3px) rotate(40deg) } 58% { transform: translate(7px, -2px) rotate(34deg) } 100% { transform: none } }
@keyframes lgrLichCastGem { 0%, 100% { transform: none } 12% { transform: scale(.85) } 28% { transform: scale(1.4) } 46% { transform: scale(1.12) } }
@keyframes lgrLichHurl { 0% { transform: none; opacity: 1 } 15% { transform: translate(-3px, 2px) scale(1.3) } 30% { transform: translate(14px, -5px) scale(2) ; opacity: .4 } 42% { transform: scale(.2); opacity: 0 } 70% { transform: scale(.5); opacity: .6 } 100% { transform: none; opacity: 1 } }
@keyframes lgrLichCharge { 0%, 100% { transform: none } 20% { transform: scale(1.5) } 40% { transform: scale(1.25) } }
@keyframes lgrLichRoar { 0% { transform: none } 22% { transform: translateY(-5px) rotate(-5deg) scale(1.05) } 38% { transform: translateY(3px) rotate(2deg) scale(1.2) } 66% { transform: translateY(2px) scale(1.1) } 100% { transform: none } }
@keyframes lgrLichBookRaise { 0% { transform: none } 22% { transform: translate(-4px, -16px) rotate(-38deg) } 40% { transform: translate(6px, -3px) rotate(12deg) } 70% { transform: translate(3px, -1px) rotate(6deg) } 100% { transform: none } }
@keyframes lgrLichStaffSlam { 0% { transform: none } 24% { transform: translateY(-6px) rotate(-62deg) } 40% { transform: translate(11px, 4px) rotate(48deg) } 52% { transform: translate(9px, 3px) rotate(42deg) } 74% { transform: translate(6px, 2px) rotate(30deg) } 100% { transform: none } }
@keyframes lgrLichCrownBlaze { 0%, 100% { transform: none } 25% { transform: translateY(-4px) scale(1.18) } 45% { transform: translateY(-2px) scale(1.1) } }
@keyframes lgrLichSurge { 0%, 100% { transform: none } 20% { transform: scale(.8) } 38% { transform: scale(1.65) } 56% { transform: scale(1.3) } 78% { transform: scale(1.08) } }
@keyframes lgrLichHoodFlare { 0%, 100% { transform: none } 22% { transform: scale(.97, 1.02) } 40% { transform: scale(1.1, 1.05) } 70% { transform: scale(1.04) } }
@keyframes lgrLichSpiritMaw { 0% { transform: none } 22% { transform: translateY(-6px) scale(.9) } 40% { transform: translateY(10px) scale(1.38) } 68% { transform: translateY(6px) scale(1.2) } 100% { transform: none } }
@keyframes lgrLichGuard { 0% { transform: none } 14% { transform: translate(-6px, -4px) rotate(-82deg) } 28% { transform: translate(-3px, -2px) rotate(-68deg) } 40% { transform: translate(-5px, -3px) rotate(-78deg) } 70% { transform: translate(-5px, -3px) rotate(-76deg) } 100% { transform: none } }
@keyframes lgrLichFlinch { 0% { transform: none } 16% { transform: translateX(-3px) rotate(-6deg) } 40% { transform: translateX(-2px) rotate(-4deg) } 100% { transform: none } }
@keyframes lgrLichCrossL { 0%, 100% { transform: none } 18% { transform: translate(8px, 2px) rotate(34deg) } 60% { transform: translate(7px, 2px) rotate(30deg) } }
@keyframes lgrLichCrossR { 0%, 100% { transform: none } 18% { transform: translate(-8px, 2px) rotate(-34deg) } 60% { transform: translate(-7px, 2px) rotate(-30deg) } }
@keyframes lgrLichCurtain { 0%, 100% { transform: none } 18% { transform: scaleX(.93) } 30% { transform: scaleX(.96) } 60% { transform: scaleX(.94) } }
@keyframes lgrLichDeny { 0%, 100% { transform: none } 12% { transform: translateY(-2px) rotate(-7deg) } 26% { transform: rotate(7deg) } 40% { transform: rotate(-5deg) } 54% { transform: rotate(4deg) } 68% { transform: rotate(-2deg) } 82% { transform: none } }
@keyframes lgrLichGlare { 0%, 100% { transform: none } 12% { transform: scale(1.45) } 60% { transform: scale(1.3) } }
@keyframes lgrLichDim { 0%, 100% { opacity: 1 } 20% { opacity: .4 } 70% { opacity: .45 } }
@keyframes lgrLichRecoilUp { 0%, 100% { transform: none } 14% { transform: translateY(-6px) scale(.9) } 50% { transform: translateY(-4px) scale(.93) } }
@keyframes lgrLichSag { 0% { transform: none } 30% { transform: translateY(3px) rotate(8deg) } 70% { transform: translateY(3px) rotate(7deg) } 100% { transform: none } }
@keyframes lgrLichFade { 0%, 100% { opacity: 1 } 30% { opacity: .25 } 70% { opacity: .3 } }
@keyframes lgrLichGemWane { 0%, 100% { transform: none; opacity: 1 } 30% { transform: scale(.85); opacity: .4 } 70% { transform: scale(.88); opacity: .45 } }
@keyframes lgrLichBookSag { 0% { transform: none } 30% { transform: translateY(5px) rotate(18deg) } 70% { transform: translateY(4px) rotate(16deg) } 100% { transform: none } }
@keyframes lgrLichGutter { 0%, 100% { transform: none; opacity: 1 } 30% { transform: scale(.45, .35); opacity: .5 } 70% { transform: scale(.5, .4); opacity: .55 } }
@keyframes lgrLichHoodSag { 0%, 100% { transform: none } 30% { transform: scaleY(.95) } 70% { transform: scaleY(.96) } }
/* the knockout (2.3 s, climax at 1.35 s): the phylactery shudders, flares and shatters; his head jerks up in a last
   scream and drops, the crown topples, the staff and book fall, the eyes go out; phase 3's spirit is torn away */
@keyframes lgrLichKoGem { 0% { transform: none; opacity: 1 } 10% { transform: translateX(-1px) } 20% { transform: translateX(1.5px) scale(1.05) } 30% { transform: translateX(-2px) scale(1.08) } 40% { transform: translateX(2.5px) scale(1.12) } 50% { transform: translateX(-3px) scale(1.2) } 56% { transform: scale(1.7); opacity: 1 } 62% { transform: scale(2.1); opacity: 0 } 100% { transform: scale(.7); opacity: .25 } }
@keyframes lgrLichKoHead { 0% { transform: none } 10% { transform: rotate(-3deg) } 20% { transform: rotate(3deg) } 30% { transform: rotate(-4deg) } 40% { transform: rotate(4deg) } 50% { transform: translateY(-3px) rotate(-5deg) } 58% { transform: translateY(-6px) rotate(-12deg) scale(1.08) } 74% { transform: translateY(7px) rotate(14deg) } 86% { transform: translateY(3px) rotate(7deg) } 100% { transform: translateY(4px) rotate(9deg) } }
@keyframes lgrLichKoCrown { 0%, 56% { transform: none; opacity: 1 } 64% { transform: translate(5px, -10px) rotate(35deg) } 80% { transform: translate(16px, 26px) rotate(110deg); opacity: 1 } 90% { transform: translate(18px, 34px) rotate(125deg); opacity: 0 } 100% { transform: translate(18px, 34px) rotate(125deg); opacity: 0 } }
@keyframes lgrLichKoEyes { 0%, 56% { opacity: 1 } 60% { opacity: 1; transform: scale(1.4) } 66% { opacity: .1; transform: none } 72% { opacity: .5 } 78%, 100% { opacity: .08 } }
@keyframes lgrLichKoStaff { 0%, 58% { transform: none } 76% { transform: translate(6px, 8px) rotate(62deg) } 84% { transform: translate(6px, 7px) rotate(54deg) } 100% { transform: translate(6px, 8px) rotate(58deg) } }
@keyframes lgrLichKoBook { 0%, 58% { transform: none } 76% { transform: translate(-2px, 12px) rotate(40deg) } 86% { transform: translate(-2px, 10px) rotate(34deg) } 100% { transform: translate(-2px, 11px) rotate(36deg) } }
@keyframes lgrLichKoSpirit { 0% { transform: none; opacity: 1 } 50% { transform: translateY(-2px) scale(1.04); opacity: 1 } 58% { transform: translateY(-4px) scale(1.25); opacity: 1 } 80% { transform: translateY(-20px) scale(1.5); opacity: 0 } 100% { transform: translateY(-20px) scale(1.5); opacity: 0 } }
@keyframes lgrLichKoFlame { 0%, 56% { transform: none; opacity: 1 } 62% { transform: scale(1.5); opacity: 1 } 74%, 100% { transform: scale(.1); opacity: 0 } }
@keyframes lgrLichKoHood { 0%, 58% { transform: none } 80% { transform: scaleY(.88) } 100% { transform: scaleY(.9) } }
${on('[data-moment="hit"]', { head: 'lgrLichHitHead 480ms ease-out', eyes: 'lgrLichBlink 480ms linear', gem: 'lgrLichGemFlicker 480ms linear', spirit: 'lgrLichBlink 480ms linear' })}
${on('[data-moment="crit"]', { head: 'lgrLichCritHead 760ms cubic-bezier(.2,.9,.3,1)', crown: 'lgrLichCrownPop 900ms cubic-bezier(.2,.9,.3,1)', gem: 'lgrLichGemCrack 700ms ease-out', spirit: 'lgrLichSpiritReel 760ms ease-out', eyes: 'lgrLichBlink 600ms linear' })}
${on('[data-moment="sharpen"]', { book: 'lgrLichBookSlam 800ms cubic-bezier(.2,.9,.3,1)', staff: 'lgrLichStaffJar 700ms linear', eyes: 'lgrLichWince 700ms ease-out', flamel: 'lgrLichSnuff 900ms ease-out', flamer: 'lgrLichSnuff 900ms ease-out 60ms', hood: 'lgrLichHoodRip 700ms ease-out' })}
${on('[data-moment="hurt"]', { head: 'lgrLichCackle 800ms ease-out', eyes: 'lgrLichFlare 800ms ease-out', book: 'lgrLichBookLift 800ms ease-out', spirit: 'lgrLichSpiritBite 760ms cubic-bezier(.3,1.4,.5,1)' })}
${on('[data-assault-on]', { staff: 'lgrLichCastStaff 900ms cubic-bezier(.3,1.3,.5,1)', gem: 'lgrLichCastGem 800ms ease-out', flamer: 'lgrLichHurl 900ms ease-out', flamel: 'lgrLichCharge 700ms ease-out' })}
${on('[data-moment="hurtBig"]', { head: 'lgrLichRoar 1050ms cubic-bezier(.3,1.2,.5,1)', book: 'lgrLichBookRaise 1000ms cubic-bezier(.3,1.2,.5,1)', staff: 'lgrLichStaffSlam 1000ms cubic-bezier(.3,1.2,.5,1)', crown: 'lgrLichCrownBlaze 900ms ease-out', gem: 'lgrLichSurge 1000ms ease-out', eyes: 'lgrLichFlare 900ms ease-out', hood: 'lgrLichHoodFlare 1000ms ease-out', spirit: 'lgrLichSpiritMaw 1050ms cubic-bezier(.3,1.3,.5,1)', flamel: 'lgrLichHurl 900ms ease-out 80ms', flamer: 'lgrLichHurl 900ms ease-out' })}
${on('[data-moment="block"]', { staff: 'lgrLichGuard 680ms cubic-bezier(.2,.9,.3,1)', head: 'lgrLichFlinch 600ms ease-out', gem: 'lgrLichGemFlicker 600ms linear', flamel: 'lgrLichCrossL 680ms ease-out', flamer: 'lgrLichCrossR 680ms ease-out', hood: 'lgrLichCurtain 680ms ease-out' })}
${on('[data-moment="shield"]', { head: 'lgrLichDeny 760ms ease-out', eyes: 'lgrLichGlare 700ms ease-out', gem: 'lgrLichDim 760ms ease-out', spirit: 'lgrLichRecoilUp 700ms ease-out' })}
${on('[data-moment="wind"]', { head: 'lgrLichSag 1100ms ease-in-out', eyes: 'lgrLichFade 1100ms ease-in-out', gem: 'lgrLichGemWane 1100ms ease-in-out', book: 'lgrLichBookSag 1100ms ease-in-out', flamel: 'lgrLichGutter 1100ms ease-in-out', flamer: 'lgrLichGutter 1100ms ease-in-out', hood: 'lgrLichHoodSag 1100ms ease-in-out', spirit: 'lgrLichFade 1100ms ease-in-out' })}
${on('[data-moment="ko"]', { gem: 'lgrLichKoGem 2300ms linear both', head: 'lgrLichKoHead 2300ms ease-in-out both', crown: 'lgrLichKoCrown 2300ms ease-in both', eyes: 'lgrLichKoEyes 2300ms linear both', staff: 'lgrLichKoStaff 2300ms ease-in both', book: 'lgrLichKoBook 2300ms ease-in both', spirit: 'lgrLichKoSpirit 2300ms ease-in both', flamel: 'lgrLichKoFlame 2300ms ease-in both', flamer: 'lgrLichKoFlame 2300ms ease-in both', hood: 'lgrLichKoHood 2300ms ease-in both' })}
${B}[data-down] .lg-lich-head { transform: translateY(4px) rotate(9deg) }
${B}[data-down] .lg-lich-crown, ${B}[data-down] .lg-lich-spirit, ${B}[data-down] .lg-lich-flamel, ${B}[data-down] .lg-lich-flamer { opacity: 0 }
${B}[data-down] .lg-lich-eyes { opacity: .08 }
${B}[data-down] .lg-lich-gem { transform: scale(.7); opacity: .25 }
${B}[data-down] .lg-lich-staff { transform: translate(6px, 8px) rotate(58deg) }
${B}[data-down] .lg-lich-book { transform: translate(-2px, 11px) rotate(36deg) }
${B}[data-down] .lg-lich-hood { transform: scaleY(.9) }
/* the abilities: Raise Dead lifts staff and book together and his eyes blaze; Bone Burst (his minion smashed) jolts
   the crown and dims the phylactery; an escape pours the soul into the swelling phylactery as he throws his head back */
@keyframes lgrLichRaiseArm { 0% { transform: none } 25% { transform: translateY(-8px) rotate(-14deg) } 70% { transform: translateY(-7px) rotate(-12deg) } 100% { transform: none } }
@keyframes lgrLichRaiseBook { 0% { transform: none } 25% { transform: translateY(-9px) rotate(-20deg) scale(1.08) } 70% { transform: translateY(-8px) rotate(-18deg) scale(1.06) } 100% { transform: none } }
@keyframes lgrLichRaiseFlame { 0%, 100% { transform: none } 25% { transform: translateY(-6px) scale(1.4, 1.7) } 70% { transform: translateY(-5px) scale(1.3, 1.5) } }
@keyframes lgrLichJolt { 0%, 100% { transform: none } 10% { transform: translate(-4px, -6px) rotate(-22deg) } 30% { transform: translate(2px, -2px) rotate(10deg) } 50% { transform: rotate(-4deg) } 70% { transform: none } }
@keyframes lgrLichSwallow { 0%, 100% { transform: none } 60% { transform: scale(.9) } 75% { transform: scale(1.5) } 88% { transform: scale(1.2) } }
@keyframes lgrLichGloat { 0%, 100% { transform: none } 55% { transform: translateY(-2px) rotate(-8deg) } 75% { transform: translateY(-3px) rotate(-12deg) scale(1.05) } 90% { transform: rotate(-4deg) } }
${B} .lgr-lich-raise .lg-lich-staff { animation: lgrLichRaiseArm 800ms cubic-bezier(.3,1.3,.5,1) }
${B} .lgr-lich-raise .lg-lich-book { animation: lgrLichRaiseBook 800ms cubic-bezier(.3,1.3,.5,1) }
${B} .lgr-lich-raise .lg-lich-eyes { animation: lgrLichGlare 800ms ease-out }
${B} .lgr-lich-raise .lg-lich-flamel, ${B} .lgr-lich-raise .lg-lich-flamer { animation: lgrLichRaiseFlame 800ms ease-out }
${B} .lgr-lich-raise .lg-lich-spirit { animation: lgrLichRecoilUp 800ms ease-out reverse }
${B} .lgr-lich-burst .lg-lich-crown { animation: lgrLichJolt 700ms ease-out }
${B} .lgr-lich-burst .lg-lich-gem { animation: lgrLichGemCrack 700ms ease-out }
${B} .lgr-lich-burst .lg-lich-eyes { animation: lgrLichWince 700ms ease-out }
${B} .lgr-lich-burst .lg-lich-spirit { animation: lgrLichSpiritReel 700ms ease-out }
${B} .lgr-lich-burst .lg-lich-flamel, ${B} .lgr-lich-burst .lg-lich-flamer { animation: lgrLichSnuff 700ms ease-out }
${B} .lgr-lich-escape .lg-lich-gem { animation: lgrLichSwallow 700ms ease-out }
${B} .lgr-lich-escape .lg-lich-head { animation: lgrLichGloat 700ms ease-out }
${B} .lgr-lich-escape .lg-lich-spirit { animation: lgrLichSpiritBite 700ms ease-out 300ms }
`

export default {
  effects: {
    // Raise (medium): green soul-fire bursts from the floor, skeletal hands claw up along the bottom.
    raise: () => <>
      <div className="lgx" style={{ left: '50%', bottom: '-12%', width: '70%', height: '70%', transformOrigin: 'bottom', background: `radial-gradient(ellipse at 50% 100%, #e8fff0 0 12%, ${SOUL} 35%, rgba(93,255,154,0) 70%)`, animation: anim('lgxBeam', 800) }} />
      {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="lgx" style={{ left: `${12 + i * 14}%`, bottom: '-4%', fontSize: 20, color: BONE, filter: `drop-shadow(0 0 5px ${SOUL})`, transform: `scaleX(${i % 2 ? -1 : 1})`, animation: anim('lgrLichFxClaw', 760, i * 60, 'cubic-bezier(.34,1.56,.64,1)') }}>✋</div>)}
    </>,
    // Burst (big): the skeleton explodes into spinning bones; a green-white skull flash shrinks away.
    burst: () => <>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>{flash('#d8ffe6')}</div>
      {around(16, (i, a) => <div key={i} className="lgx" style={{ ...center, fontSize: 16 + (i % 3) * 3, lineHeight: 1, '--a': `${a + i * 4}deg`, '--d': `${-100 - (i % 4) * 16}px`, '--spin': `${(i % 2 ? 1 : -1) * (360 + i * 25)}deg`, filter: `drop-shadow(0 0 4px ${SOUL})`, animation: anim('lgxShard', 950 + (i % 3) * 90, 40) }}>🦴</div>)}
      <div className="lgx" style={{ ...center, fontSize: 64, lineHeight: 1, filter: `drop-shadow(0 0 16px ${SOUL}) brightness(1.4)`, animation: anim('lgxGulp', 900, 100) }}>💀</div>
      {ring(SOUL, 0, 2.3, 5, 800)}
    </>,
    // Escape (medium): a green wisp flies into him.
    escape: () => <>
      <div className="lgx" style={{ left: '50%', top: '50%', width: 22, height: 30, marginLeft: -11, marginTop: -15, borderRadius: '50% 50% 45% 45%', background: `radial-gradient(circle at 50% 40%, #fff 0 18%, ${SOUL} 50%, rgba(93,255,154,0) 75%)`, '--x0': '-90px', '--y0': '80px', animation: anim('lgxFly', 700, 0, 'ease-in') }} />
      {[0, 1, 2].map((i) => <div key={i} className="lgx" style={{ left: '50%', top: '50%', width: 8, height: 8, borderRadius: '50%', background: SOUL, opacity: 0.7, '--x0': `${-80 + i * 10}px`, '--y0': `${70 + i * 8}px`, animation: anim('lgxFly', 700, 60 + i * 50, 'ease-in') }} />)}
      {ring(SOUL, 520, 1.2, 3, 300)}
    </>,
  },
  floaters: { raise: 'lg_fx_raiseDead', burst: 'lg_fx_boneBurst', escape: 'lg_fx_minionEscape' },
  floaterTone: { raise: 'success', burst: 'success', escape: 'danger' },
  // The asset view's Try it: an escape heals him by K.heal (abilities/lich.js), shown in its floater.
  demo: { escape: { kind: 'miss', damage: 0, lives: 0, fxVars: { n: 2 } } },
  juice: {
    raise: { size: 'medium', shake: 1, flash: 1, hitstop: 1, sfx: 'lich.raise' },
    burst: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'lich.burst' },
    escape: { size: 'medium', shake: 1, sfx: 'lich.escape' },
  },
  css: `
@keyframes lgrLichFxClaw { 0% { transform: translateY(40px) rotate(-10deg); opacity: 0 } 30% { opacity: 1 } 55% { transform: translateY(-14px) rotate(6deg) } 80% { transform: translateY(-8px) rotate(-4deg); opacity: 1 } 100% { transform: translateY(30px); opacity: 0 } }
@keyframes lgrLichAscend { 0% { transform: none } 30% { transform: translateY(-10px) } 65% { transform: translateY(-10px) } 100% { transform: none } }
@keyframes lgrLichShudder { 0%, 100% { transform: none } 15% { transform: translateX(-8px) rotate(-7deg) } 30% { transform: translateX(6px) rotate(5deg) } 45% { transform: translateX(-4px) rotate(-3deg) } 60% { transform: translateX(2px) rotate(2deg) } 78% { transform: translateX(-1px) rotate(-1deg) } }
@keyframes lgrLichInhale { 0%, 100% { transform: none } 45% { transform: scale(.93, 1.1) translateY(-4px) } 70% { transform: scale(.97, 1.04) } }
.lgr-lich-raise { animation: lgrLichAscend 800ms cubic-bezier(.22,1,.36,1) both }
.lgr-lich-burst { transform-origin: 50% 15%; animation: lgrLichShudder 700ms ease-out both }
.lg-boss[data-phase="3"] .lgr-lich-burst { animation-duration: 900ms }
.lgr-lich-escape { transform-origin: 50% 100%; animation: lgrLichInhale 700ms cubic-bezier(.22,1,.36,1) both }
/* fx-layer motion: the phase 1 grin chatters, three quick beats of the jaw from its top edge */
@keyframes lgrLichChatter { 0%, 100% { transform: none } 12% { transform: translateY(1.3px) } 24% { transform: none } 40% { transform: translateY(1.3px) } 52% { transform: none } 68% { transform: translateY(1.3px) } 80% { transform: none } }
.lg-boss[data-fx="raise"] .lgfa-lich-chatter { transform-box: fill-box; transform-origin: 50% 0%; animation: lgrLichChatter 640ms ease-in-out both }
` + DRAWING,
}
