// What the Berserker's All In (allin) LOOKS like. The fx contract is in fx/index.js, the juice format in fx/_juice.js.
// Fixed bright colors; BossArena skips all of it in focus mode, with Still bosses and under reduced motion. The floater
// already starts with the answer's damage, so the texts never repeat the number.
import { anim, around, ring, slash } from './_kit'

const RED = '#ff3a2e'
const EMBER = '#ffb43a'

// THE DRAWING ACTS IT OUT (impact/bosses/README.md): the Berserker's own parts in raids/berserker.svg move for every
// strike moment, his attack on you and All In, keyed by the arena's data-moment / data-assault-on and
// .lgr-berserker-<fx>. Parts (lg-berserker-*, pivots at the shoulders, set in the file): head, jaw (phases 2-3), axe (the
// weapon arm), arm2 (the other arm: the chained gauntlet, then the manacled arm, then the upper right arm), lowl / lowr
// (phase 3's lower arms). Here (not berserker.parts.jsx) because this CSS is in the arena all fight long and his axe
// also lands on ability blows. Transforms and opacity only; the dead pose holds while the arena greys him.
const B = '.lg-boss[data-motif="berserker"]'
const on = (state, parts) => Object.entries(parts).map(([p, a]) => `${B}${state} .lg-berserker-${p} { animation: ${a} }`).join('\n')
const DRAWING = `
@keyframes lgrBeJerk { 0% { transform: none } 12% { transform: translateY(-3px) rotate(-8deg) } 36% { transform: rotate(3deg) } 66% { transform: rotate(-1deg) } 100% { transform: none } }
@keyframes lgrBeAxeDip { 0%, 100% { transform: none } 14% { transform: rotate(-10deg) translateY(3px) } 45% { transform: rotate(-3deg) } }
@keyframes lgrBeKnock { 0% { transform: none } 10% { transform: translate(5px, -2px) rotate(16deg) scale(.92) } 30% { transform: rotate(-8deg) } 54% { transform: rotate(4deg) } 78% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgrBeFlungBack { 0% { transform: none } 12% { transform: rotate(-38deg) translate(-4px, 2px) } 40% { transform: rotate(-14deg) } 70% { transform: rotate(4deg) } 100% { transform: none } }
@keyframes lgrBeGape { 0%, 100% { transform: none } 14% { transform: scaleY(1.35) translateY(1px) } 45% { transform: scaleY(1.15) } }
@keyframes lgrBeCut { 0%, 100% { transform: none } 6% { transform: rotate(16deg) translateY(4px) } 16% { transform: rotate(-9deg) } 28% { transform: rotate(6deg) } 42% { transform: rotate(-3deg) } 60% { transform: none } }
@keyframes lgrBeFlinch { 0%, 100% { transform: none } 10% { transform: translateX(-3px) rotate(-6deg) scale(.95) } 45% { transform: translateX(-1px) rotate(-2deg) } }
@keyframes lgrBeRattle { 0%, 100% { transform: none } 10% { transform: rotate(8deg) } 22% { transform: rotate(-7deg) } 34% { transform: rotate(5deg) } 48% { transform: rotate(-3deg) } 64% { transform: none } }
@keyframes lgrBeHeadbutt { 0% { transform: none } 20% { transform: translateY(-4px) rotate(-6deg) } 34% { transform: translateY(6px) rotate(4deg) scale(1.16) } 60% { transform: translateY(3px) scale(1.08) } 100% { transform: none } }
@keyframes lgrBeRoar { 0%, 100% { transform: none } 20% { transform: scaleY(.85) } 34% { transform: scale(1.12, 1.45) translateY(1px) } 70% { transform: scale(1.06, 1.25) } }
@keyframes lgrBeJab { 0% { transform: none } 18% { transform: translate(-3px, -2px) rotate(-14deg) } 34% { transform: translate(8px, 2px) rotate(14deg) scale(1.15) } 60% { transform: translate(5px, 1px) rotate(9deg) scale(1.08) } 100% { transform: none } }
@keyframes lgrBeHurl { 0% { transform: none } 14% { transform: rotate(-42deg) translateY(-3px) } 26% { transform: rotate(72deg) translate(8px, 4px) scale(1.1) } 36% { transform: rotate(62deg) translate(7px, 3px) } 62% { transform: rotate(40deg) translate(4px, 2px) } 100% { transform: none } }
@keyframes lgrBeHurlR { 0% { transform: none } 14% { transform: rotate(30deg) } 26% { transform: rotate(-50deg) translateX(4px) } 62% { transform: rotate(-26deg) } 100% { transform: none } }
@keyframes lgrBeLowSwing { 0% { transform: none } 20% { transform: rotate(-22deg) } 34% { transform: rotate(30deg) scale(1.1) } 62% { transform: rotate(14deg) } 100% { transform: none } }
@keyframes lgrBeSlam { 0% { transform: none } 26% { transform: rotate(-60deg) translateY(-6px) scale(1.06) } 40% { transform: rotate(84deg) translate(6px, 8px) scale(1.12) } 50% { transform: rotate(76deg) translate(6px, 7px) } 74% { transform: rotate(50deg) translate(3px, 4px) } 100% { transform: none } }
@keyframes lgrBeSlamR { 0% { transform: none } 26% { transform: rotate(40deg) translateY(-6px) } 40% { transform: rotate(-60deg) translate(-4px, 8px) scale(1.12) } 74% { transform: rotate(-34deg) } 100% { transform: none } }
@keyframes lgrBeHeadDrive { 0% { transform: none } 26% { transform: translateY(-6px) rotate(-8deg) scale(1.04) } 40% { transform: translateY(8px) rotate(5deg) scale(1.2) } 70% { transform: translateY(4px) scale(1.1) } 100% { transform: none } }
@keyframes lgrBeStomp { 0% { transform: none } 24% { transform: translateY(-8px) rotate(-10deg) } 40% { transform: translateY(4px) scale(1.15, .85) } 60% { transform: translateY(1px) } 100% { transform: none } }
@keyframes lgrBeGuard { 0% { transform: none } 14% { transform: rotate(56deg) translate(4px, -4px) } 28% { transform: rotate(46deg) translate(2px, -2px) } 42% { transform: rotate(54deg) translate(4px, -4px) } 70% { transform: rotate(52deg) translate(4px, -4px) } 100% { transform: none } }
@keyframes lgrBeDuck { 0% { transform: none } 14% { transform: translateY(5px) scale(.94) } 50% { transform: translateY(3px) scale(.96) } 100% { transform: none } }
@keyframes lgrBeBrace { 0%, 100% { transform: none } 14% { transform: rotate(-20deg) translateY(-4px) } 60% { transform: rotate(-16deg) translateY(-3px) } }
@keyframes lgrBeFume { 0%, 100% { transform: none } 10% { transform: rotate(-8deg) } 22% { transform: rotate(8deg) } 34% { transform: rotate(-7deg) } 46% { transform: rotate(5deg) } 60% { transform: rotate(-2deg) } 75% { transform: none } }
@keyframes lgrBeSnapSnap { 0%, 100% { transform: none } 12% { transform: scaleY(1.35) } 22% { transform: scaleY(.85) } 34% { transform: scaleY(1.3) } 46% { transform: scaleY(.9) } 60% { transform: none } }
@keyframes lgrBeBang { 0%, 100% { transform: none } 14% { transform: rotate(-24deg) } 26% { transform: rotate(14deg) } 40% { transform: rotate(-16deg) } 54% { transform: rotate(8deg) } 70% { transform: none } }
@keyframes lgrBeSag { 0% { transform: none } 30% { transform: translateY(5px) rotate(6deg) scale(.97) } 70% { transform: translateY(5px) rotate(5deg) scale(.97) } 100% { transform: none } }
@keyframes lgrBeDrag { 0% { transform: none } 30% { transform: rotate(-24deg) translateY(6px) } 70% { transform: rotate(-22deg) translateY(6px) } 100% { transform: none } }
@keyframes lgrBeHang { 0% { transform: none } 30% { transform: rotate(14deg) translateY(4px) } 70% { transform: rotate(12deg) translateY(4px) } 100% { transform: none } }
@keyframes lgrBePant { 0%, 100% { transform: none } 20% { transform: scaleY(1.2) } 40% { transform: scaleY(1.05) } 60% { transform: scaleY(1.2) } 80% { transform: scaleY(1.05) } }
@keyframes lgrBeKoAxe { 0% { transform: none } 14% { transform: rotate(-20deg) } 28% { transform: rotate(10deg) } 44% { transform: rotate(-30deg) translateY(-4px) } 58% { transform: rotate(-60deg) translateY(-6px) } 74% { transform: rotate(-110deg) translate(-6px, 18px); opacity: 1 } 88% { transform: rotate(-104deg) translate(-6px, 16px) } 100% { transform: rotate(-106deg) translate(-6px, 17px) } }
@keyframes lgrBeKoHead { 0% { transform: none } 16% { transform: rotate(5deg) } 30% { transform: rotate(-5deg) } 46% { transform: translateY(-4px) rotate(-10deg) scale(1.06) } 58% { transform: translateY(-7px) rotate(-14deg) scale(1.1) } 74% { transform: translateY(12px) rotate(16deg) scale(.96) } 86% { transform: translateY(9px) rotate(11deg) scale(.96) } 100% { transform: translateY(10px) rotate(13deg) scale(.96) } }
@keyframes lgrBeKoJaw { 0%, 40% { transform: none } 58% { transform: scaleY(1.5) } 76%, 100% { transform: scaleY(1.3) translateY(2px) } }
@keyframes lgrBeKoArm { 0%, 56% { transform: none } 76% { transform: rotate(30deg) translateY(12px) } 100% { transform: rotate(26deg) translateY(11px) } }
@keyframes lgrBeKoLow { 0%, 60% { transform: none } 80%, 100% { transform: rotate(-24deg) translateY(8px) } }
${on('[data-moment="hit"]', { head: 'lgrBeJerk 500ms ease-out', axe: 'lgrBeAxeDip 500ms ease-out' })}
${on('[data-moment="crit"]', { head: 'lgrBeKnock 820ms cubic-bezier(.2,.9,.3,1)', axe: 'lgrBeFlungBack 820ms cubic-bezier(.2,.9,.3,1)', jaw: 'lgrBeGape 800ms ease-out', arm2: 'lgrBeRattle 760ms linear', lowl: 'lgrBeRattle 700ms linear', lowr: 'lgrBeRattle 700ms linear 60ms' })}
${on('[data-moment="sharpen"]', { arm2: 'lgrBeCut 760ms ease-out', head: 'lgrBeFlinch 760ms ease-out', lowl: 'lgrBeRattle 760ms linear', lowr: 'lgrBeRattle 760ms linear 40ms' })}
${on('[data-moment="hurt"]', { head: 'lgrBeHeadbutt 820ms cubic-bezier(.3,1.3,.5,1)', jaw: 'lgrBeRoar 820ms ease-out', arm2: 'lgrBeJab 820ms cubic-bezier(.3,1.3,.5,1)' })}
${on('[data-assault-on]', { axe: 'lgrBeHurl 900ms cubic-bezier(.3,1.3,.5,1)', lowl: 'lgrBeLowSwing 900ms ease-out', lowr: 'lgrBeLowSwing 900ms ease-out 80ms' })}
${on('[data-moment="hurtBig"]', { axe: 'lgrBeSlam 1050ms cubic-bezier(.3,1.2,.5,1)', arm2: 'lgrBeSlamR 1050ms cubic-bezier(.3,1.2,.5,1)', head: 'lgrBeHeadDrive 1050ms cubic-bezier(.3,1.2,.5,1)', jaw: 'lgrBeRoar 1000ms ease-out', lowl: 'lgrBeStomp 950ms ease-out', lowr: 'lgrBeStomp 950ms ease-out 90ms' })}
${on('[data-moment="block"]', { axe: 'lgrBeGuard 700ms cubic-bezier(.2,.9,.3,1)', head: 'lgrBeDuck 700ms ease-out', arm2: 'lgrBeBrace 700ms ease-out', lowl: 'lgrBeBrace 700ms ease-out' })}
${on('[data-moment="shield"]', { head: 'lgrBeFume 760ms ease-out', jaw: 'lgrBeSnapSnap 760ms ease-out', axe: 'lgrBeBang 760ms ease-out' })}
${on('[data-moment="wind"]', { head: 'lgrBeSag 1100ms ease-in-out', axe: 'lgrBeDrag 1100ms ease-in-out', arm2: 'lgrBeHang 1100ms ease-in-out', jaw: 'lgrBePant 1100ms ease-in-out', lowl: 'lgrBeHang 1100ms ease-in-out', lowr: 'lgrBeHang 1100ms ease-in-out' })}
${on('[data-moment="ko"]', { axe: 'lgrBeKoAxe 2200ms ease-in both', head: 'lgrBeKoHead 2200ms ease-in-out both', jaw: 'lgrBeKoJaw 2200ms ease-in both', arm2: 'lgrBeKoArm 2200ms ease-in both', lowl: 'lgrBeKoLow 2200ms ease-in both', lowr: 'lgrBeKoLow 2200ms ease-in both' })}
${B}[data-down] .lg-berserker-axe { transform: rotate(-106deg) translate(-6px, 17px) }
${B}[data-down] .lg-berserker-head { transform: translateY(10px) rotate(13deg) scale(.96) }
${B}[data-down] .lg-berserker-jaw { transform: scaleY(1.3) translateY(2px) }
${B}[data-down] .lg-berserker-arm2 { transform: rotate(26deg) translateY(11px) }
${B}[data-down] .lg-berserker-lowl, ${B}[data-down] .lg-berserker-lowr { transform: rotate(-24deg) translateY(8px) }
/* All In: a CLEAVE knocks the axe spinning out of his grip and his head reels; a whiff he throws his head back
   guffawing, axe raised; his taunt pounds the chest and bellows */
@keyframes lgrBeAxeSpin { 0% { transform: none } 12% { transform: rotate(-50deg) translate(-4px, 2px) } 30% { transform: rotate(-150deg) translate(-8px, 8px) } 52% { transform: rotate(-60deg) translate(-3px, 3px) } 74% { transform: rotate(-14deg) } 100% { transform: none } }
@keyframes lgrBeReel { 0% { transform: none } 12% { transform: translate(6px, -3px) rotate(18deg) scale(.9) } 40% { transform: rotate(-6deg) } 70% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgrBeGuffaw { 0%, 100% { transform: none } 18% { transform: translateY(-3px) rotate(-12deg) } 30% { transform: translateY(-1px) rotate(-10deg) } 42% { transform: translateY(-3px) rotate(-12deg) } 54% { transform: translateY(-1px) rotate(-9deg) } 70% { transform: rotate(-6deg) } }
@keyframes lgrBeChatter { 0%, 100% { transform: none } 15% { transform: scaleY(1.3) } 27% { transform: scaleY(1) } 39% { transform: scaleY(1.3) } 51% { transform: scaleY(1) } 63% { transform: scaleY(1.25) } }
@keyframes lgrBeAxeHigh { 0%, 100% { transform: none } 25% { transform: rotate(-30deg) translateY(-5px) } 70% { transform: rotate(-26deg) translateY(-4px) } }
@keyframes lgrBePound { 0%, 100% { transform: none } 25% { transform: translate(-4px, 2px) rotate(-14deg) } 50% { transform: rotate(4deg) } 75% { transform: translate(-4px, 2px) rotate(-14deg) } }
${B} .lgr-berserker-cleave .lg-berserker-axe { animation: lgrBeAxeSpin 900ms cubic-bezier(.22,1,.36,1) }
${B} .lgr-berserker-cleave .lg-berserker-head { animation: lgrBeReel 900ms cubic-bezier(.22,1,.36,1) }
${B} .lgr-berserker-cleave .lg-berserker-jaw { animation: lgrBeGape 900ms ease-out }
${B} .lgr-berserker-cleave .lg-berserker-lowl, ${B} .lgr-berserker-cleave .lg-berserker-lowr { animation: lgrBeRattle 800ms linear }
${B} .lgr-berserker-whiff .lg-berserker-head { animation: lgrBeGuffaw 800ms ease-in-out }
${B} .lgr-berserker-whiff .lg-berserker-jaw { animation: lgrBeChatter 800ms linear }
${B} .lgr-berserker-whiff .lg-berserker-axe { animation: lgrBeAxeHigh 800ms ease-out }
${B} .lgr-berserker-taunt .lg-berserker-arm2 { animation: lgrBePound 330ms ease-in-out }
${B} .lgr-berserker-taunt .lg-berserker-jaw { animation: lgrBeRoar 330ms ease-out }
${B} .lgr-berserker-taunt .lg-berserker-head { animation: lgrBeHeadbutt 330ms ease-out }
`


// A huge double axe (head at the top of a long haft), drawn pointing up from its pivot at the bottom centre.
const axe = (style) => (
  <svg className="lgx" viewBox="0 0 60 120" style={{ width: 70, height: 140, marginLeft: -35, transformOrigin: '50% 100%', ...style }}>
    <rect x="27" y="18" width="6" height="102" rx="2" fill="#6b4a2b" stroke="#2a1a0e" strokeWidth="1.5" />
    <path d="M30 6 C14 2 2 14 4 34 C14 30 22 30 30 32 Z M30 6 C46 2 58 14 56 34 C46 30 38 30 30 32 Z" fill="#e8eef5" stroke="#2a1a0e" strokeWidth="2" />
    <path d="M4 34 C14 30 22 30 30 32 C38 30 46 30 56 34" fill="none" stroke={RED} strokeWidth="2.5" />
  </svg>
)

export default {
  effects: {
    // Cleave (big): the double axe swings a 270 deg arc across the arena, a red cleave line splits it, sparks fly and a
    // shockwave rolls out.
    cleave: () => <>
      {axe({ left: '50%', top: '-45%', animation: anim('lgrBerserkerSwing', 700, 0, 'cubic-bezier(.5,0,.75,0)') })}
      {slash(-35, RED, 330, '150%', 12)}
      {slash(-35, '#ffffff', 360, '120%', 4)}
      {around(14, (i, a) => <div key={i} className="lgx" style={{ left: '50%', top: '50%', width: 5, height: 14, borderRadius: 3, background: i % 2 ? EMBER : '#ffffff', boxShadow: `0 0 8px ${EMBER}`, '--a': `${a}deg`, '--d': `${-80 - (i % 3) * 18}px`, '--spin': '60deg', animation: anim('lgxShard', 650, 360 + (i % 4) * 20) }} />)}
      {ring(RED, 380, 2.4, 6, 700)}
    </>,
    // Whiff (medium): the axe slams into the ground beside the boss; a red crack runs toward your hearts, dust rises.
    whiff: () => <>
      {axe({ left: '78%', top: '-10%', animation: anim('lgrBerserkerSlam', 500, 0, 'cubic-bezier(.6,0,.9,.4)') })}
      <svg className="lgx" viewBox="0 0 100 20" preserveAspectRatio="none" style={{ left: '70%', top: '92%', width: '70%', height: 16 }}>
        <path d="M0 10 L12 6 L20 13 L33 5 L45 12 L58 7 L70 14 L84 6 L100 10" fill="none" stroke={RED} strokeWidth="3" strokeLinejoin="round" style={{ strokeDasharray: 140, animation: anim('lgrBerserkerCrack', 600, 260) }} />
      </svg>
      {around(5, (i) => <div key={i} className="lgx" style={{ left: `${72 + i * 5}%`, top: '86%', width: 16, height: 16, borderRadius: '50%', background: '#b9a48c', '--h': '-34px', animation: anim('lgxRise', 600, 260 + i * 30) }} />)}
    </>,
    // Taunt (tick, cosmetic): two angry marks pop over his head.
    taunt: () => <>{[38, 58].map((x, i) => <div key={x} className="lgx" style={{ left: `${x}%`, top: '2%', fontSize: 20, lineHeight: 1, animation: anim('lgrBerserkerVein', 330, i * 70) }}>💢</div>)}</>,
  },
  floaters: { cleave: 'lg_fx_allinCleave', whiff: 'lg_fx_allinWhiff', taunt: 'lg_fx_allinTaunt' },
  floaterTone: { cleave: 'danger', whiff: 'danger', taunt: 'warning' },
  juice: {
    cleave: { size: 'big', shake: 3, flash: 2, hitstop: 1, sfx: 'berserker.cleave' },
    whiff: { size: 'medium', shake: 2, hitstop: 1, sfx: 'berserker.whiff' },
    taunt: { size: 'tick', sfx: 'berserker.taunt' },
  },
  demo: { cleave: { damage: 5, fxVars: { n: 5 } }, whiff: { kind: 'miss', damage: 0, lives: 2 }, taunt: { damage: 1 } },
  // Reactions (body only; the face layers come with the art pass): cleave = knocked sideways with a spin, recovers
  // (heavier and shorter in phase 3, the god of war barely gives ground); whiff = two chest-pump guffaw bounces;
  // taunt = two small forward thrusts.
  css: `
@keyframes lgrBerserkerSwing { 0% { transform: rotate(-135deg); opacity: 0 } 12% { opacity: 1 } 70% { transform: rotate(135deg); opacity: 1 } 100% { transform: rotate(150deg); opacity: 0 } }
@keyframes lgrBerserkerSlam { 0% { transform: rotate(-70deg); opacity: 0 } 20% { opacity: 1 } 55% { transform: rotate(18deg); opacity: 1 } 65% { transform: rotate(12deg) } 100% { transform: rotate(14deg); opacity: 0 } }
@keyframes lgrBerserkerCrack { 0% { stroke-dashoffset: 140; opacity: 1 } 70% { stroke-dashoffset: 0; opacity: 1 } 100% { stroke-dashoffset: 0; opacity: 0 } }
@keyframes lgrBerserkerVein { 0% { transform: scale(0); opacity: 0 } 40% { transform: scale(1.3); opacity: 1 } 100% { transform: scale(1) translateY(-8px); opacity: 0 } }
@keyframes lgrBerserkerStagger { 0% { transform: none } 18% { transform: translateX(12px) rotate(15deg) } 45% { transform: translateX(6px) rotate(6deg) } 70% { transform: translateX(-2px) rotate(-2deg) } 100% { transform: none } }
@keyframes lgrBerserkerStaggerP3 { 0% { transform: none } 18% { transform: translateX(7px) rotate(8deg) } 45% { transform: translateX(2px) rotate(2deg) } 100% { transform: none } }
@keyframes lgrBerserkerGuffaw { 0%, 100% { transform: none } 18% { transform: translateY(-8px) rotate(-5deg) scale(1.05) } 34% { transform: translateY(-2px) rotate(-1deg) } 52% { transform: translateY(-8px) rotate(-5deg) scale(1.05) } 70% { transform: translateY(-2px) rotate(-1deg) } 86% { transform: translateY(-4px) rotate(-2deg) scale(1.02) } }
@keyframes lgrBerserkerChestBeat { 0%, 100% { transform: none } 22% { transform: scale(1.07) translate(-3px, -4px) } 44% { transform: scale(1.01) } 66% { transform: scale(1.07) translate(3px, -4px) } 88% { transform: scale(1.01) } }
.lgr-berserker-cleave { animation: lgrBerserkerStagger 900ms cubic-bezier(.22,1,.36,1) both; transform-origin: bottom center }
.lg-boss[data-phase="3"] .lgr-berserker-cleave { animation-name: lgrBerserkerStaggerP3 }
.lgr-berserker-whiff { animation: lgrBerserkerGuffaw 800ms ease-in-out both; transform-origin: bottom center }
.lgr-berserker-taunt { animation: lgrBerserkerChestBeat 330ms ease-in-out both }
` + DRAWING,
}
