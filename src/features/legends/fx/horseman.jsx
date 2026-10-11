// What The Midnight Ride (abilities/horseman.js) LOOKS like (design v2.1, #28). The fx contract is in fx/index.js.
//   gallop (tick)   your horse's shoes strike sparks down the road toward the bridge: three burning hoofprints stamp in
//                   a row across the bottom, dust kicks up (his horse tosses its head and paws at you).
//   close  (medium) he is ONE LENGTH behind you: the road behind floods with his soulfire, two green hoof flames slam
//                   down at the corners and the edges pulse with your heartbeat (he hauls the lantern up beside his
//                   collar, the soulfire roars tall, the horse lunges with its ears pinned).
//   caught (big)    RIDDEN DOWN: the lantern flail sweeps across the road in a burning arc, the ground shockwaves under
//                   the hooves, stones scatter and speed lines throw you back to the start (the horse rears, the
//                   lantern arm swings the whole arc, the rider looms over it).
//   cross  (big)    ACROSS THE BRIDGE: a covered bridge thunders up out of the bottom over white running water; he can
//                   not follow: his fire blows back off the planks in shards and a ring of green flame (the horse balks,
//                   he recoils with the lantern arm flung back, the lantern swings wild, the soulfire gutters).
import { center, anim, around, ring, shards } from './_kit'

// Fixed bright colors (never theme tokens over the art).
const H = { ink: '#1d2230', soul: '#6dff9c', soulHi: '#e2ffe6', soulLo: '#14945a', fire: '#ff7a1a', fireHi: '#ffd25a', ember: '#ff4a1c', wood: '#8e2a22', woodHi: '#c8503a', woodLo: '#4a1410', water: '#9fe6ff', waterHi: '#ffffff', dust: '#b39a7a', stone: '#6e6a74', pumpkin: '#f0781c' }

// A horseshoe print (inline SVG, burning).
const Shoe = ({ color, glow }) => (
  <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true" style={{ display: 'block', overflow: 'visible', filter: `drop-shadow(0 0 4px ${glow})` }}>
    <path d="M5 21C3 16 3 9 6 5.4C8 3 10 2.4 12 2.4C14 2.4 16 3 18 5.4C21 9 21 16 19 21L15.6 21C17 16 17 10.6 15.4 8C14.6 6.8 13.4 6.2 12 6.2C10.6 6.2 9.4 6.8 8.6 8C7 10.6 7 16 8.4 21Z" fill={color} stroke={H.ink} strokeWidth="1.3" strokeLinejoin="round" />
    <circle cx="6.6" cy="12" r="0.9" fill={H.ink} /><circle cx="17.4" cy="12" r="0.9" fill={H.ink} /><circle cx="7.8" cy="17" r="0.9" fill={H.ink} /><circle cx="16.2" cy="17" r="0.9" fill={H.ink} />
  </svg>
)
// A green hoof flame (a tongue of soulfire).
const Tongue = ({ color = H.soul, hi = H.soulHi }) => (
  <svg viewBox="0 0 20 30" width="100%" height="100%" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
    <path d="M3 28C0 20 4 14 7 8C8 13 10 15 11 9C12 4 11 2 10 0C16 6 20 14 17 24C16 27 13 29 10 29C7 29 4 29 3 28Z" fill={color} stroke={H.ink} strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M7 27C5 22 7 18 9 15C10 19 12 19 12.6 15C15 19 15 24 13 27C11 28.6 9 28.6 7 27Z" fill={hi} />
  </svg>
)
// The covered bridge (red barn-board shed with a dark mouth), rising out of the bottom.
const Bridge = () => (
  <svg viewBox="0 0 100 40" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
    <path d="M4 40L4 18L50 2L96 18L96 40Z" fill={H.wood} stroke={H.ink} strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M0 19L50 0L100 19L96 21L50 5L4 21Z" fill={H.woodHi} stroke={H.ink} strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M36 40L36 24C36 18 64 18 64 24L64 40Z" fill="#1a0a10" stroke={H.ink} strokeWidth="1.2" />
    <path d="M10 22V38M18 19V38M26 16V38M74 16V38M82 19V38M90 22V38" stroke={H.woodLo} strokeWidth="1.2" />
    <path d="M40 40L40 27C40 24 60 24 60 27L60 40Z" fill={H.fireHi} opacity=".35" />
  </svg>
)

// THE DRAWING ACTS IT OUT (impact/bosses/README.md). His parts in raids/horseman.svg are wrapper groups. -horse holds
// EVERYTHING (the horse, its saddle and the rider), so a move on the horse carries the rider and the reins stay on the
// bit. Inside it the forelegs leave the chest as -legn (near) / -legf (far), the mane is -mane, and the whole rider is
// -body: his cloak -cloak (phases 1 and 2; phase 3 one sheet of soulfire -wingl with its ragged hem -wingr), his thigh
// and boot -leg, the torso -rider, the reins arm -armr, the lantern arm -arml (the lantern head -lantern pivots in its
// fist), the shoulders with the collar -shoulders and the soulfire -flame; a move on -body carries every part of him and
// nothing detaches (transform-box: view-box, each point in its group's own units). This CSS is on the page the whole raid: the
// strike moments (data-moment), his attack on your heart (data-assault-on, also when an ability takes the heart),
// the abilities (.lgr-horseman-<fx> on the art box, data-fx on the arena) and the fallen pose (data-down).
// Transforms and opacity only.
const B = '.lg-boss[data-motif="horseman"]'
// The 2026-10-10 redraw (round 4): the whole horse in profile with the rider on top, a different POSE per phase
// (standing, rearing, a diving leap), so the pivots are PER PHASE. Rider parts use the rider's own coordinates (hips
// 60,100; collar 60,41; shoulders 27,59 and 93,59; in phase 3 he swaps hands: the lantern arm is the near one); horse
// parts use the drawing's units inside the phase's placement: the hind hip, the forelegs' elbows and the crest.
const RIDER_PIV = { body: [60, 100], rider: [60, 100], shoulders: [60, 100], flame: [60, 41], leg: [44, 100], cloak: [84, 54], wingl: [90, 60], wingr: [86, 84], arml: [93, 59], armr: [27, 59], reins: [27, 59] }
const PIV = {
  1: { ...RIDER_PIV, lantern: [101, 104], horse: [97, 79], legn: [45, 99], legf: [50, 98], mane: [51, 69] },
  2: { ...RIDER_PIV, cloak: [94, 56], arml: [93, 58], lantern: [110, 12], horse: [86, 84], legn: [34, 64.1], legf: [38.4, 66.7], mane: [58.5, 45.8] },
  3: { ...RIDER_PIV, arml: [27, 59], armr: [93, 59], lantern: [-14, 34], horse: [94, 62], legn: [52, 98.6], legf: [56.3, 95.9], mane: [47.4, 68.3] },
}
const BODY = ['body'] // the rider's whole upper body (torso, both arms, shoulders) moves as ONE piece: every group of class lg-horseman-body
// `parts` = { part or 'body': animation }; `state` = '[data-moment="hit"]' etc. One rule per phase per part.
const on = (state, parts, only) => Object.entries(parts).flatMap(([p, a]) => (p === 'body' ? BODY : [p]).map((q) => [q, a])).flatMap(([p, a]) =>
  [1, 2, 3].filter((ph) => !only || only.includes(ph)).map((ph) => `${B}[data-phase="${ph}"]${state} .lg-horseman-${p} { transform-box: view-box; transform-origin: ${PIV[ph][p][0]}px ${PIV[ph][p][1]}px; animation: ${a} }`)).join('\n')
const rest = (parts) => Object.entries(parts).flatMap(([p, t]) => (p === 'body' ? BODY : [p]).map((q) => [q, t])).flatMap(([p, t]) =>
  [1, 2, 3].map((ph) => `${B}[data-phase="${ph}"][data-down] .lg-horseman-${p} { transform-box: view-box; transform-origin: ${PIV[ph][p][0]}px ${PIV[ph][p][1]}px; transform: ${t} }`)).join('\n')

const DRAWING = `
@keyframes lgrHorseReel { 0% { transform: none } 14% { transform: rotate(5deg) translate(1px, -1px) } 40% { transform: rotate(-2deg) } 70% { transform: rotate(1deg) } 100% { transform: none } }
@keyframes lgrHorseFlameDuck { 0%, 100% { transform: none } 16% { transform: scale(1.12, .7) rotate(-6deg) } 45% { transform: scale(.95, 1.1) } }
@keyframes lgrHorseHeadToss { 0%, 100% { transform: none } 18% { transform: rotate(-7deg) } 46% { transform: rotate(4deg) } }
@keyframes lgrHorseKnockBack { 0% { transform: none } 10% { transform: rotate(9deg) translate(2px, -2px) scale(.97) } 34% { transform: rotate(-4deg) } 58% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgrHorseLanternSpin { 0% { transform: none } 12% { transform: rotate(-70deg) } 40% { transform: rotate(40deg) } 62% { transform: rotate(-18deg) } 82% { transform: rotate(6deg) } 100% { transform: none } }
@keyframes lgrHorseFlameBlown { 0% { transform: none } 12% { transform: rotate(-24deg) scale(.8, .6) } 36% { transform: rotate(10deg) scale(1.1, 1.2) } 64% { transform: rotate(-4deg) } 100% { transform: none } }
@keyframes lgrHorseCloakCut { 0%, 100% { transform: none } 14% { transform: skewX(-12deg) rotate(4deg) } 34% { transform: skewX(6deg) rotate(-3deg) } 58% { transform: skewX(-2deg) } }
@keyframes lgrHorseFlameSplit { 0%, 100% { transform: none } 12% { transform: skewX(24deg) scale(1.1, .85) } 32% { transform: skewX(-14deg) } 55% { transform: skewX(5deg) } }
@keyframes lgrHorseFlinch { 0%, 100% { transform: none } 14% { transform: rotate(-4deg) translateY(1px) } 40% { transform: rotate(2deg) } }
/* his strike: the lantern arm winds back, then HURLS forward at you; the lantern flies out of the fist toward the
   camera on its bail and swings back; the horse lunges after it */
@keyframes lgrHorseWindThrow { 0% { transform: none } 22% { transform: rotate(-38deg) } 38% { transform: rotate(52deg) } 54% { transform: rotate(40deg) } 78% { transform: rotate(8deg) } 100% { transform: none } }
@keyframes lgrHorseLanternFly { 0%, 30% { transform: none } 42% { transform: translate(-10px, 14px) scale(1.7) rotate(-30deg) } 56% { transform: translate(-14px, 18px) scale(1.95) rotate(-50deg) } 76% { transform: translate(-4px, 6px) scale(1.3) rotate(-14deg) } 100% { transform: none } }
@keyframes lgrHorseLunge { 0% { transform: none } 24% { transform: rotate(-4deg) translateY(-2px) } 42% { transform: rotate(5deg) translate(-3px, 3px) scale(1.06) } 70% { transform: rotate(1deg) } 100% { transform: none } }
@keyframes lgrHorseLeanIn { 0%, 100% { transform: none } 40% { transform: rotate(-6deg) translate(-2px, 1px) } 60% { transform: rotate(-4deg) } }
/* the heavy blow: the horse REARS and stamps both forelegs, the lantern swung all the way round overhead */
@keyframes lgrHorseRearUp { 0% { transform: none } 26% { transform: rotate(10deg) translateY(-2px) } 46% { transform: rotate(-4deg) translateY(1px) scale(1.04) } 60% { transform: rotate(1deg) } 100% { transform: none } }
@keyframes lgrHorseStomp { 0% { transform: none } 24% { transform: rotate(34deg) } 44% { transform: rotate(-10deg) scale(1.05) } 58% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgrHorseOverhead { 0% { transform: none } 18% { transform: rotate(-60deg) } 40% { transform: rotate(-150deg) } 56% { transform: rotate(40deg) scale(1.05) } 76% { transform: rotate(12deg) } 100% { transform: none } }
@keyframes lgrHorseFlameRoar { 0%, 100% { transform: none } 20% { transform: scale(.9, 1.15) } 44% { transform: scale(1.18, 1.5) } 70% { transform: scale(1.05, 1.15) } }
/* the player blocks: he jerks the lantern up across his collar as a guard, the horse shies back */
@keyframes lgrHorseGuard { 0% { transform: none } 16% { transform: rotate(-30deg) translate(-2px, -2px) } 50% { transform: rotate(-26deg) translate(-2px, -2px) } 100% { transform: none } }
@keyframes lgrHorseShy { 0% { transform: none } 16% { transform: rotate(8deg) translate(3px, -2px) } 46% { transform: rotate(5deg) translate(2px, -1px) } 100% { transform: none } }
/* the Shield saves your heart: the thrown lantern bounces off it and swings wild, the flame flickers */
@keyframes lgrHorseBounce { 0% { transform: none } 18% { transform: rotate(60deg) } 32% { transform: rotate(-44deg) } 48% { transform: rotate(28deg) } 64% { transform: rotate(-12deg) } 100% { transform: none } }
@keyframes lgrHorseFlicker { 0%, 100% { transform: none } 12% { transform: scale(.7, .5) } 24% { transform: scale(1.1, 1.2) } 36% { transform: scale(.8, .6) } 50% { transform: scale(1.05) } }
/* Second wind: he sags in the saddle, the lantern dips, the soulfire burns low */
@keyframes lgrHorseSag { 0% { transform: none } 34% { transform: rotate(4deg) translateY(3px) } 70% { transform: rotate(3deg) translateY(2px) } 100% { transform: none } }
@keyframes lgrHorseDim { 0% { transform: none } 34% { transform: scale(.75, .55) } 70% { transform: scale(.8, .62) } 100% { transform: none } }
@keyframes lgrHorseDip { 0% { transform: none } 34% { transform: rotate(16deg) translateY(4px) } 70% { transform: rotate(12deg) translateY(3px) } 100% { transform: none } }
/* THE KNOCKOUT (2400 ms, climax 1400): the killing blow rocks him, the horse rears one last time and screams, then
   COLLAPSES: the forelegs buckle under the chest and the front of the horse drops; the rider is thrown up out of the
   saddle and falls forward off its shoulder, the lantern slips from his fist and drops, the soulfire gutters down to a
   wisp. The fallen pose holds (data-down). */
@keyframes lgrHorseKoBody { 0% { transform: none } 10% { transform: rotate(-6deg) } 30% { transform: translate(0, -8px) rotate(6deg) } 48% { transform: translate(-12px, -6px) rotate(-30deg) } 62% { transform: translate(-30px, 16px) rotate(-84deg) } 70% { transform: translate(-29px, 12px) rotate(-78deg) } 100% { transform: translate(-30px, 14px) rotate(-80deg) } }
/* he lets go of the reins as he is thrown */
@keyframes lgrHorseKoReins { 0%, 40% { opacity: 1 } 52%, 100% { opacity: 0 } }
@keyframes lgrHorseKoHorse { 0% { transform: none } 12% { transform: rotate(7deg) translateY(-2px) } 30% { transform: rotate(9deg) translateY(-3px) } 50% { transform: rotate(-5deg) translateY(2px) } 62% { transform: rotate(-11deg) translateY(5px) } 70% { transform: rotate(-9deg) translateY(4px) } 100% { transform: rotate(-10deg) translateY(4px) } }
@keyframes lgrHorseKoLegs { 0%, 40% { transform: none } 56% { transform: rotate(-48deg) } 64% { transform: rotate(-70deg) } 72% { transform: rotate(-62deg) } 100% { transform: rotate(-66deg) } }
@keyframes lgrHorseKoLantern { 0%, 36% { transform: none; opacity: 1 } 44% { transform: rotate(30deg); opacity: 1 } 56% { transform: translateY(16px) rotate(70deg); opacity: 1 } 59%, 100% { transform: translateY(20px) rotate(80deg); opacity: 0 } }
/* the falling head is gone at the climax: the knockout part cracks it open right where it fell (horsemanShatter) */
@keyframes lgrHorseKoFlame { 0% { transform: none } 12% { transform: scale(1.3, 1.6) } 40% { transform: scale(.9, .7) } 56% { transform: scale(.5, .3) } 70% { transform: scale(.3, .2) } 100% { transform: scale(.25, .14) } }
@keyframes lgrHorseKoCloak { 0% { transform: none } 50% { transform: rotate(-8deg) } 70% { transform: rotate(10deg) translateY(6px) } 100% { transform: rotate(9deg) translateY(6px) } }
${on('[data-moment="hit"]', { body: 'lgrHorseReel 520ms ease-out', flame: 'lgrHorseFlameDuck 520ms ease-out', horse: 'lgrHorseHeadToss 520ms ease-out 40ms' })}
${on('[data-moment="crit"]', { body: 'lgrHorseKnockBack 820ms cubic-bezier(.2,.9,.3,1)', lantern: 'lgrHorseLanternSpin 900ms cubic-bezier(.2,.9,.3,1)', flame: 'lgrHorseFlameBlown 820ms cubic-bezier(.2,.9,.3,1)', horse: 'lgrHorseShy 700ms ease-out 60ms' })}
${on('[data-moment="sharpen"]', { cloak: 'lgrHorseCloakCut 760ms ease-out', wingl: 'lgrHorseCloakCut 760ms ease-out', wingr: 'lgrHorseCloakCut 760ms ease-out 50ms', flame: 'lgrHorseFlameSplit 760ms ease-out', body: 'lgrHorseFlinch 700ms ease-out' })}
${on('[data-assault-on]', { arml: 'lgrHorseWindThrow 1100ms cubic-bezier(.3,1.2,.5,1)', lantern: 'lgrHorseLanternFly 1100ms cubic-bezier(.3,1.2,.5,1)', horse: 'lgrHorseLunge 1000ms cubic-bezier(.3,1.3,.5,1)', body: 'lgrHorseLeanIn 1000ms ease-out' })}
${on('[data-moment="hurtBig"]', { horse: 'lgrHorseRearUp 1000ms cubic-bezier(.3,1.3,.5,1)', legn: 'lgrHorseStomp 900ms ease-out', legf: 'lgrHorseStomp 900ms ease-out 100ms', mane: 'lgrHorseFlameRoar 1000ms ease-out', arml: 'lgrHorseOverhead 1000ms cubic-bezier(.3,1.2,.5,1)', flame: 'lgrHorseFlameRoar 1000ms ease-out' })}
${on('[data-moment="block"]', { arml: 'lgrHorseGuard 700ms cubic-bezier(.2,.9,.3,1)', horse: 'lgrHorseShy 700ms ease-out', flame: 'lgrHorseFlameDuck 600ms ease-out' })}
${on('[data-moment="shield"]', { lantern: 'lgrHorseBounce 760ms ease-out', flame: 'lgrHorseFlicker 760ms ease-out', horse: 'lgrHorseHeadToss 700ms ease-out' })}
${on('[data-moment="wind"]', { body: 'lgrHorseSag 1100ms ease-in-out', flame: 'lgrHorseDim 1100ms ease-in-out', lantern: 'lgrHorseDip 1100ms ease-in-out' })}
${on('[data-moment="ko"]', { body: 'lgrHorseKoBody 2400ms ease-in both', horse: 'lgrHorseKoHorse 2400ms ease-in-out both', legn: 'lgrHorseKoLegs 2400ms ease-in both', legf: 'lgrHorseKoLegs 2400ms ease-in both', reins: 'lgrHorseKoReins 2400ms linear both', lantern: 'lgrHorseKoLantern 2400ms ease-in both', flame: 'lgrHorseKoFlame 2400ms ease-in both', cloak: 'lgrHorseKoCloak 2400ms ease-in both', wingl: 'lgrHorseKoCloak 2400ms ease-in both', wingr: 'lgrHorseKoCloak 2400ms ease-in both' })}
${B}[data-down] .lg-horseman-reins { opacity: 0 }
/* phase 3: his near arm (the lantern arm there) folds in against him as he falls, so the fallen pose stays in frame */
@keyframes lgrHorseKoArmIn { 0%, 40% { transform: none } 62%, 100% { transform: rotate(70deg) } }
${B}[data-phase="3"][data-moment="ko"] .lg-horseman-arml { transform-box: view-box; transform-origin: 27px 59px; animation: lgrHorseKoArmIn 2400ms ease-in both }
${B}[data-phase="3"][data-down] .lg-horseman-arml { transform-box: view-box; transform-origin: 27px 59px; transform: rotate(70deg) }
${rest({ body: 'translate(-30px, 14px) rotate(-80deg)', horse: 'rotate(-10deg) translateY(4px)', legn: 'rotate(-66deg)', legf: 'rotate(-66deg)', lantern: 'translateY(20px) rotate(80deg) scale(0)', flame: 'scale(.25, .14)', cloak: 'rotate(9deg) translateY(6px)', wingl: 'rotate(9deg) translateY(6px)', wingr: 'rotate(9deg) translateY(6px)' })}
/* THE ABILITY ON THE REAL PARTS (data-fx while each effect plays) */
@keyframes lgrHorseNod { 0%, 100% { transform: none } 30% { transform: rotate(7deg) translateY(1px) } 62% { transform: rotate(-3deg) } }
@keyframes lgrHorsePaw { 0%, 100% { transform: none } 30% { transform: rotate(26deg) } 64% { transform: rotate(-6deg) } }
@keyframes lgrHorseHaulUp { 0% { transform: none } 22% { transform: rotate(-46deg) translate(-2px, -3px) } 70% { transform: rotate(-40deg) translate(-2px, -3px) } 100% { transform: none } }
@keyframes lgrHorseLanternSwell { 0%, 100% { transform: none } 24% { transform: scale(1.35) rotate(-12deg) } 50% { transform: scale(1.22) rotate(8deg) } 75% { transform: scale(1.3) rotate(-4deg) } }
@keyframes lgrHorseFlameTower { 0%, 100% { transform: none } 22% { transform: scale(1.2, 1.7) } 55% { transform: scale(1.1, 1.45) } 80% { transform: scale(1.15, 1.6) } }
@keyframes lgrHorsePinLunge { 0%, 100% { transform: none } 24% { transform: rotate(-9deg) translate(-3px, 2px) scale(1.05) } 60% { transform: rotate(-6deg) translate(-2px, 1px) scale(1.03) } }
@keyframes lgrHorseFlailArc { 0% { transform: none } 16% { transform: rotate(-80deg) } 38% { transform: rotate(-170deg) } 56% { transform: rotate(50deg) scale(1.06) } 72% { transform: rotate(20deg) } 100% { transform: none } }
@keyframes lgrHorseFlailSwing { 0% { transform: none } 16% { transform: rotate(40deg) } 38% { transform: rotate(90deg) } 56% { transform: rotate(-60deg) } 76% { transform: rotate(20deg) } 100% { transform: none } }
@keyframes lgrHorseRearHigh { 0% { transform: none } 22% { transform: rotate(-20deg) translateY(-2px) } 50% { transform: rotate(-18deg) translateY(-2px) } 70% { transform: rotate(6deg) translateY(1px) } 100% { transform: none } }
@keyframes lgrHorseLoom { 0% { transform: none } 24% { transform: rotate(-5deg) translateY(-4px) scale(1.04) } 60% { transform: rotate(-3deg) translateY(-3px) scale(1.03) } 100% { transform: none } }
@keyframes lgrHorseFlungBack { 0%, 30% { transform: none } 42% { transform: rotate(-58deg) translate(3px, -2px) } 62% { transform: rotate(-40deg) translate(2px, -1px) } 100% { transform: none } }
@keyframes lgrHorseGutter { 0%, 30% { transform: none } 44% { transform: rotate(-30deg) scale(.7, .45) } 64% { transform: rotate(12deg) scale(1.1, 1.3) } 100% { transform: none } }
@keyframes lgrHorseBalk { 0% { transform: none } 36% { transform: none } 48% { transform: rotate(12deg) translate(4px, -4px) } 70% { transform: rotate(5deg) translate(2px, -1px) } 100% { transform: none } }
@keyframes lgrHorseBob { 0%, 100% { transform: none } 30% { transform: translateY(-2px) rotate(-1deg) } 62% { transform: translateY(1px) } }
@keyframes lgrHorseSpur { 0%, 100% { transform: none } 24% { transform: rotate(-22deg) } 52% { transform: rotate(10deg) } }
@keyframes lgrHorseRecoil { 0%, 36% { transform: none } 48% { transform: rotate(6deg) translate(3px, -2px) } 74% { transform: rotate(2deg) } 100% { transform: none } }
${on('[data-fx="gallop"]', { horse: 'lgrHorseNod 340ms ease-out', legn: 'lgrHorsePaw 340ms ease-out', legf: 'lgrHorsePaw 340ms ease-out 60ms' })}
${on('[data-fx="gallop"]', { body: 'lgrHorseBob 340ms ease-out', leg: 'lgrHorseSpur 340ms ease-out' }, [1, 2])}
${on('[data-moment="hurtBig"]', { leg: 'lgrHorseSpur 700ms ease-out', body: 'lgrHorseLeanIn 900ms ease-out' }, [1, 2])}
${on('[data-fx="close"]', { arml: 'lgrHorseHaulUp 780ms cubic-bezier(.2,.9,.3,1)', lantern: 'lgrHorseLanternSwell 780ms ease-in-out', flame: 'lgrHorseFlameTower 780ms ease-in-out', horse: 'lgrHorsePinLunge 780ms cubic-bezier(.2,.9,.3,1)', mane: 'lgrHorseFlameTower 780ms ease-in-out' })}
${on('[data-fx="caught"]', { arml: 'lgrHorseFlailArc 1150ms cubic-bezier(.3,1.1,.5,1)', lantern: 'lgrHorseFlailSwing 1150ms cubic-bezier(.3,1.1,.5,1)', horse: 'lgrHorseRearHigh 1150ms cubic-bezier(.3,1.2,.5,1)', legn: 'lgrHorseStomp 1000ms ease-out 80ms', legf: 'lgrHorseStomp 1000ms ease-out 180ms', body: 'lgrHorseLoom 1100ms ease-out' })}
${on('[data-fx="cross"]', { arml: 'lgrHorseFlungBack 1150ms cubic-bezier(.3,1.2,.5,1)', lantern: 'lgrHorseBounce 1150ms ease-out', flame: 'lgrHorseGutter 1150ms ease-out', horse: 'lgrHorseBalk 1150ms ease-out', body: 'lgrHorseRecoil 1150ms ease-out' })}
`

const prints = [0, 1, 2]

export default {
  effects: {
    gallop: () => <>
      {prints.map((i) => <div key={i} className="lgx" style={{ left: `${14 + i * 26}%`, bottom: `${4 + (i % 2) * 7}%`, width: 22, height: 22, transform: `rotate(${i % 2 ? 12 : -12}deg)`, animation: anim('lgrHorsemanStamp', 300, i * 60, 'cubic-bezier(.2,1.6,.4,1)') }}><Shoe color={i % 2 ? H.fireHi : H.fire} glow={H.ember} /></div>)}
      {prints.map((i) => <div key={`d${i}`} className="lgx" style={{ left: `${10 + i * 26}%`, bottom: `${2 + (i % 2) * 7}%`, width: 30, height: 12, borderRadius: '50%', background: H.dust, opacity: 0.7, '--h': '-14px', animation: anim('lgxRise', 320, 40 + i * 60) }} />)}
    </>,
    close: () => <>
      <div className="lgx lgx-full" style={{ boxShadow: `inset 0 0 22px 3px ${H.soul}`, borderRadius: '30%', animation: anim('lgrHorsemanPulse', 780) }} />
      {[0, 1].map((i) => <div key={i} className="lgx" style={{ [i ? 'right' : 'left']: '-7%', bottom: '-9%', width: 22, height: 34, transformOrigin: '50% 100%', animation: anim('lgrHorsemanSlam', 620, i * 90, 'cubic-bezier(.2,1.5,.4,1)') }}><Tongue /></div>)}
      <div className="lgx" style={{ right: '4%', top: '38%', width: 48, height: 48, borderRadius: '50%', border: `3px solid ${H.fireHi}`, boxShadow: `0 0 14px ${H.fire}`, '--s': 2.2, animation: anim('lgxRing', 700, 120) }} />
    </>,
    caught: () => <>
      {/* the lantern flail's burning arc sweeping across the road (lower half) */}
      <div className="lgx" style={{ left: '50%', top: '66%', width: '120%', height: '60%', borderRadius: '50%', border: '7px solid transparent', borderTopColor: H.fire, borderLeftColor: H.fireHi, filter: `drop-shadow(0 0 8px ${H.ember})`, animation: anim('lgxArc', 760, 120, 'cubic-bezier(.3,.7,.4,1)') }} />
      {/* the ground shockwave under the hooves */}
      <div className="lgx" style={{ left: '50%', bottom: '2%', width: '70%', height: 16, marginLeft: '-35%', borderRadius: '50%', border: `4px solid ${H.dust}`, '--s': 2, animation: anim('lgrHorsemanQuake', 700, 380) }} />
      {around(8, (i, a) => <div key={i} className="lgx" style={{ left: '50%', bottom: '6%', width: 9, height: 7, borderRadius: 2, background: H.stone, border: `1.5px solid ${H.ink}`, '--a': `${a * 0.5 - 90}deg`, '--d': `${-50 - (i % 3) * 16}px`, '--spin': `${i % 2 ? 260 : -260}deg`, animation: anim('lgxShard', 720, 400 + i * 15) }} />)}
      {/* speed lines throwing you back down the road */}
      {[0, 1, 2, 3, 4].map((i) => <div key={`s${i}`} className="lgx" style={{ left: '-10%', top: `${52 + i * 8}%`, width: '60%', height: 3, borderRadius: 3, background: i % 2 ? H.soul : H.dust, opacity: 0.85, animation: anim('lgrHorsemanThrown', 520, 520 + i * 40, 'ease-in') }} />)}
    </>,
    cross: () => <>
      {/* the covered bridge thunders up out of the bottom over white running water */}
      <div className="lgx" style={{ left: '14%', bottom: '-9%', width: '72%', height: '24%', transformOrigin: '50% 100%', animation: anim('lgrHorsemanBridge', 1150, 0, 'cubic-bezier(.2,1.3,.4,1)') }}><Bridge /></div>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <div key={`w${i}`} className="lgx" style={{ left: `${6 + i * 13}%`, bottom: '-2%', width: 8, height: 12, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', background: i % 2 ? H.water : H.waterHi, border: `1.2px solid ${H.ink}`, '--h': `${-34 - (i % 3) * 12}px`, animation: anim('lgxRise', 700, 150 + i * 40) }} />)}
      {/* the bridge's power throws him back: shards of his lantern's fire and a ring of green fire blowing back from the planks */}
      <div className="lgx" style={{ left: '50%', top: '64%' }}>{shards(10, H.pumpkin, -70, 11)}</div>
      <div className="lgx" style={{ left: '50%', top: '64%', width: '50%', height: '30%', marginLeft: '-25%', marginTop: '-15%' }}>{ring(H.soul, 720, 2.4, 5, 620)}{ring(H.fireHi, 760, 1.8, 3, 520)}</div>
    </>,
  },
  floaters: { gallop: 'lg_fx_rideGallop', close: 'lg_fx_rideClose', caught: 'lg_fx_rideCaught', cross: 'lg_fx_rideCross' },
  floaterTone: { gallop: 'warning', close: 'danger', caught: 'danger', cross: 'success' },
  demo: {
    gallop: { kind: 'hit', damage: 2, lives: 0, ab: { road: 2, lead: 2 } },
    close: { kind: 'miss', damage: 0, lives: 1, ab: { road: 2, lead: 1 } },
    caught: { kind: 'miss', damage: 0, lives: 1, ab: { road: 0, lead: 2 } },
    cross: { kind: 'hit', damage: 5, lives: 0, ab: { road: 0, lead: 2 } },
  },
  juice: {
    gallop: { size: 'tick' },
    close: { size: 'medium', shake: 1, sfx: 'horseman.close' },
    caught: { size: 'big', shake: 3, flash: 1, hitstop: 1, sfx: 'horseman.caught' },
    cross: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'horseman.cross' },
  },
  css: `
@keyframes lgrHorsemanStamp { 0% { transform: scale(2.2) translateY(-20px); opacity: 0 } 40% { transform: scale(.9); opacity: 1 } 70% { transform: scale(1.05); opacity: 1 } 100% { transform: scale(1); opacity: 0 } }
@keyframes lgrHorsemanPulse { 0% { opacity: 0 } 18% { opacity: .9 } 34% { opacity: .35 } 52% { opacity: .85 } 100% { opacity: 0 } }
@keyframes lgrHorsemanSlam { 0% { transform: translateY(40px) scale(.3, 1.6); opacity: 0 } 30% { transform: translateY(0) scale(1.15, .85); opacity: 1 } 55% { transform: scale(.95, 1.1) } 80% { transform: scale(1); opacity: 1 } 100% { transform: scale(1, .4); opacity: 0 } }
@keyframes lgrHorsemanQuake { 0% { transform: scale(.3); opacity: 0 } 20% { opacity: 1 } 100% { transform: scale(var(--s, 2)); opacity: 0 } }
@keyframes lgrHorsemanThrown { 0% { transform: translateX(120%) scaleX(.2); opacity: 0 } 30% { opacity: .9 } 100% { transform: translateX(-60%) scaleX(1.2); opacity: 0 } }
@keyframes lgrHorsemanBridge { 0% { transform: translateY(100%) scaleY(.6); opacity: 0 } 18% { transform: translateY(-6%) scaleY(1.08); opacity: 1 } 30% { transform: translateY(0) scaleY(.96) } 40% { transform: scaleY(1) } 85% { transform: none; opacity: 1 } 100% { transform: translateY(20%); opacity: 0 } }
.lgr-horseman-gallop { animation: lgrHorsemanStride 340ms ease-out both; transform-origin: 50% 100% }
@keyframes lgrHorsemanStride { 0%, 100% { transform: none } 25% { transform: translateY(-5px) rotate(-1.5deg) } 50% { transform: translateY(1px) } 75% { transform: translateY(-3px) rotate(1deg) } }
.lgr-horseman-close { animation: lgrHorsemanLoomUp 780ms cubic-bezier(.2,.9,.3,1) both; transform-origin: 50% 100% }
@keyframes lgrHorsemanLoomUp { 0%, 100% { transform: none } 24% { transform: translateY(-10px) scale(1.14) rotate(-3deg) } 60% { transform: translateY(-6px) scale(1.1) rotate(-2deg) } }
.lgr-horseman-caught { animation: lgrHorsemanRide 1150ms cubic-bezier(.3,1.1,.5,1) both; transform-origin: 50% 100% }
@keyframes lgrHorsemanRide { 0% { transform: none } 18% { transform: translateX(10px) rotate(-6deg) scale(1.04) } 40% { transform: translateX(-12px) rotate(5deg) scale(1.1) } 60% { transform: translateX(4px) rotate(-2deg) scale(1.03) } 100% { transform: none } }
.lgr-horseman-cross { animation: lgrHorsemanBlowback 1150ms ease-out both; transform-origin: 50% 100% }
@keyframes lgrHorsemanBlowback { 0%, 30% { transform: none } 44% { transform: translateY(-6px) rotate(4deg) scale(.95) } 62% { transform: translateY(2px) rotate(-2deg) scale(1.02) } 100% { transform: none } }
` + DRAWING,
}
