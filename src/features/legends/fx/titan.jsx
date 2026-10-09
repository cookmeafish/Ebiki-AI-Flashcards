// What the titan raid ability (plates: Forge Plates) LOOKS like. The fx contract is in fx/index.js, the juice in
// fx/_juice.js. Fixed bright colors (never theme tokens over the art).
import { center, anim, around, ring, flash } from './_kit'

const HOT = '#fff3c4'
const FORGE = '#ff5a1f'
const IRON = '#ffb347'

// THE DRAWING ACTS EVERY MOMENT (impact/bosses/README.md): the hook classes in raids/titan.svg move with the arena's
// data-moment (a plain strike moment), data-assault-on (its blow on the player) and data-fx (its ability). Pivots are in
// the drawing's own units (transform-box: view-box): the furnace head on its neck, the giant right fist at the elbow
// above it, the left piston-arm at its shoulder, the pauldrons at the collar, the boiler torso from its base. Iron is
// heavy: slow wind-ups, a dead-stop on impact, a stiff ring-out. Every move ends on the drawn pose.
const P = '.lg-boss[data-motif="titan"]'
const PARTS_CSS = `
${P} .lg-titan-head { transform-box: view-box; transform-origin: 60px 70px }
${P} .lg-titan-armR { transform-box: view-box; transform-origin: 96px 58px }
${P} .lg-titan-armL { transform-box: view-box; transform-origin: 16px 46px }
${P} .lg-titan-shoulders { transform-box: view-box; transform-origin: 60px 44px }
${P} .lg-titan-torso { transform-box: view-box; transform-origin: 60px 108px }
/* HIT: a clang on iron: the head rings in short hard jolts, the pauldrons rattle, the fist twitches. */
@keyframes lgrTitanMHitHead { 0%, 100% { transform: none } 8% { transform: translate(-2px, 1px) rotate(-3deg) } 16% { transform: translate(2px, 0) rotate(2deg) } 24% { transform: translate(-1.5px, 0) rotate(-1.5deg) } 32% { transform: translate(1px, 0) rotate(1deg) } 44% { transform: none } }
@keyframes lgrTitanMHitRattle { 0%, 100% { transform: none } 10% { transform: translateY(1.5px) } 20% { transform: translateY(-1px) } 30% { transform: translateY(1px) } 40% { transform: none } }
@keyframes lgrTitanMHitFist { 0%, 100% { transform: none } 12% { transform: rotate(5deg) } 36% { transform: rotate(-2deg) } }
${P}[data-moment="hit"] .lg-titan-head { animation: lgrTitanMHitHead 520ms linear both }
${P}[data-moment="hit"] .lg-titan-shoulders { animation: lgrTitanMHitRattle 520ms linear both }
${P}[data-moment="hit"] .lg-titan-armR { animation: lgrTitanMHitFist 520ms ease-out both }
/* CRITICAL: the blow buckles it: the head is wrenched sideways on its neck, the boiler caves, the pauldrons tip, the
   fist jerks up and the piston-arm swings loose. */
@keyframes lgrTitanMCritHead { 0% { transform: none } 12% { transform: translate(-4px, 2px) rotate(-12deg) } 30% { transform: translate(-3px, 2px) rotate(-10deg) } 46% { transform: rotate(4deg) } 70% { transform: rotate(-1.5deg) } 100% { transform: none } }
@keyframes lgrTitanMCritTorso { 0%, 100% { transform: none } 12% { transform: scale(1.06, .9) } 34% { transform: scale(.98, 1.03) } 56% { transform: scale(1.01, .99) } }
@keyframes lgrTitanMCritShoulders { 0%, 100% { transform: none } 12% { transform: rotate(-6deg) translateY(2px) } 40% { transform: rotate(2deg) } }
@keyframes lgrTitanMCritFist { 0%, 100% { transform: none } 12% { transform: rotate(-18deg) translateY(-3px) } 40% { transform: rotate(6deg) } 64% { transform: rotate(-2deg) } }
@keyframes lgrTitanMCritPiston { 0%, 100% { transform: none } 14% { transform: rotate(-14deg) } 40% { transform: rotate(6deg) } 64% { transform: rotate(-2deg) } }
${P}[data-moment="crit"] .lg-titan-head { animation: lgrTitanMCritHead 640ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="crit"] .lg-titan-torso { animation: lgrTitanMCritTorso 640ms ease-out both }
${P}[data-moment="crit"] .lg-titan-shoulders { animation: lgrTitanMCritShoulders 640ms ease-out both }
${P}[data-moment="crit"] .lg-titan-armR { animation: lgrTitanMCritFist 640ms ease-out both }
${P}[data-moment="crit"] .lg-titan-armL { animation: lgrTitanMCritPiston 640ms ease-out both }
/* SHARPENED: a clean cut through the plate: the pauldrons shear apart along the blade, the head ducks under it. */
@keyframes lgrTitanMCutShoulders { 0% { transform: none } 10% { transform: skewX(-10deg) translateX(3px) } 28% { transform: skewX(6deg) translateX(-2px) } 50% { transform: skewX(-2deg) } 100% { transform: none } }
@keyframes lgrTitanMCutHead { 0% { transform: none } 10% { transform: translateY(4px) scale(.94) } 40% { transform: translateY(1px) } 100% { transform: none } }
@keyframes lgrTitanMCutPiston { 0%, 100% { transform: none } 12% { transform: rotate(10deg) translateX(-2px) } 46% { transform: rotate(-3deg) } }
${P}[data-moment="sharpen"] .lg-titan-shoulders { animation: lgrTitanMCutShoulders 600ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="sharpen"] .lg-titan-head { animation: lgrTitanMCutHead 600ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="sharpen"] .lg-titan-armL { animation: lgrTitanMCutPiston 600ms ease-out both }
/* ITS BLOW ON THE PLAYER (data-assault-on): the giant right fist draws back and up with the shoulder (anticipation),
   then is HURLED at the camera as the lunge leaves (impact/assault.js travelAt): it swells toward you, the head and
   pauldrons drive in behind it, it holds there and grinds back. */
@keyframes lgrTitanMBlowFist { 0% { transform: none } 13% { transform: rotate(-22deg) translate(4px, -6px) scale(.88) } 22% { transform: rotate(6deg) translate(-8px, -4px) scale(1.75) } 30% { transform: rotate(4deg) translate(-7px, -3px) scale(1.68) } 54% { transform: rotate(3deg) translate(-6px, -3px) scale(1.6) } 100% { transform: none } }
@keyframes lgrTitanMBlowHead { 0% { transform: none } 13% { transform: translate(2px, -2px) rotate(4deg) } 22% { transform: translate(-1px, 3px) rotate(-3deg) scale(1.1) } 54% { transform: translateY(2px) scale(1.06) } 100% { transform: none } }
@keyframes lgrTitanMBlowShoulders { 0% { transform: none } 13% { transform: rotate(5deg) } 22% { transform: rotate(-4deg) translateY(2px) scale(1.04) } 54% { transform: rotate(-2deg) } 100% { transform: none } }
${P}[data-assault-on] .lg-titan-armR { animation: lgrTitanMBlowFist 840ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-assault-on] .lg-titan-head { animation: lgrTitanMBlowHead 840ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-assault-on] .lg-titan-shoulders { animation: lgrTitanMBlowShoulders 840ms cubic-bezier(.3,.7,.3,1) both }
/* ITS STRIKE (hurt, with the punch above): the furnace roars: the boiler heaves and the piston-arm braces back. */
@keyframes lgrTitanMHeave { 0%, 100% { transform: none } 16% { transform: scale(1.06, .95) } 40% { transform: scale(.98, 1.02) } }
@keyframes lgrTitanMBrace { 0%, 100% { transform: none } 16%, 46% { transform: rotate(12deg) } }
${P}[data-moment="hurt"] .lg-titan-torso { animation: lgrTitanMHeave 640ms ease-out both }
${P}[data-moment="hurt"] .lg-titan-armL { animation: lgrTitanMBrace 640ms ease-in-out both }
/* ITS HEAVY BLOW (hurtBig): the crushing hammer-fall: the fist climbs high overhead, the piston-arm rises with it, and
   both come down like a drop hammer, the head ducking into it and the boiler crushed flat under the force. */
@keyframes lgrTitanMHeavyFist { 0% { transform: none } 22% { transform: rotate(-46deg) translate(6px, -12px) scale(1.05) } 32% { transform: rotate(10deg) translate(-6px, 4px) scale(1.65) } 42% { transform: rotate(8deg) translate(-6px, 5px) scale(1.6) } 66% { transform: rotate(5deg) translate(-4px, 3px) scale(1.4) } 100% { transform: none } }
@keyframes lgrTitanMHeavyPiston { 0% { transform: none } 22% { transform: rotate(-30deg) translateY(-4px) } 32% { transform: rotate(12deg) translateY(3px) } 66% { transform: rotate(6deg) } 100% { transform: none } }
@keyframes lgrTitanMHeavyHead { 0% { transform: none } 22% { transform: translateY(-4px) rotate(-4deg) } 32% { transform: translateY(5px) scale(1.12) } 60% { transform: translateY(3px) scale(1.06) } 100% { transform: none } }
@keyframes lgrTitanMHeavyTorso { 0%, 22%, 100% { transform: none } 32% { transform: scale(1.12, .84) } 46% { transform: scale(.97, 1.04) } 60% { transform: scale(1.02, .98) } }
${P}[data-moment="hurtBig"] .lg-titan-armR, ${P}[data-assault-on][data-moment="hurtBig"] .lg-titan-armR { animation: lgrTitanMHeavyFist 940ms cubic-bezier(.4,.2,.3,1) both }
${P}[data-moment="hurtBig"] .lg-titan-armL, ${P}[data-assault-on][data-moment="hurtBig"] .lg-titan-armL { animation: lgrTitanMHeavyPiston 940ms cubic-bezier(.4,.2,.3,1) both }
${P}[data-moment="hurtBig"] .lg-titan-head, ${P}[data-assault-on][data-moment="hurtBig"] .lg-titan-head { animation: lgrTitanMHeavyHead 940ms cubic-bezier(.4,.2,.3,1) both }
${P}[data-moment="hurtBig"] .lg-titan-torso { animation: lgrTitanMHeavyTorso 940ms ease-out both }
${P}[data-moment="hurtBig"] .lg-titan-shoulders { animation: lgrTitanMHitRattle 700ms linear 300ms both }
/* BLOCKED: the punch meets a wall: the fist drives in, stops dead with a judder, and is shoved back down; the head
   jerks back from the jolt. */
@keyframes lgrTitanMBlockFist { 0% { transform: none } 12% { transform: rotate(4deg) translate(-6px, -3px) scale(1.45) } 16% { transform: rotate(3deg) translate(-5px, -2px) scale(1.4) } 20% { transform: rotate(5deg) translate(-6px, -3px) scale(1.42) } 24% { transform: rotate(3deg) translate(-5px, -2px) scale(1.4) } 40% { transform: rotate(14deg) translate(4px, 5px) scale(.94) } 60% { transform: rotate(6deg) translate(2px, 2px) } 100% { transform: none } }
@keyframes lgrTitanMBlockHead { 0% { transform: none } 22% { transform: translate(2px, -3px) rotate(5deg) } 50% { transform: rotate(-2deg) } 100% { transform: none } }
${P}[data-moment="block"] .lg-titan-armR { animation: lgrTitanMBlockFist 680ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="block"] .lg-titan-head { animation: lgrTitanMBlockHead 680ms ease-out both }
/* SAVED: the punch skids off the shield: the fist slews outward and grinds sideways, the whole frame twisting after it,
   the head turned away. */
@keyframes lgrTitanMSkidFist { 0% { transform: none } 14% { transform: rotate(4deg) translate(-5px, -3px) scale(1.35) } 34% { transform: rotate(-28deg) translate(10px, -2px) scale(1.1) } 54% { transform: rotate(-20deg) translate(9px, 0) } 100% { transform: none } }
@keyframes lgrTitanMSkidHead { 0%, 100% { transform: none } 30%, 56% { transform: translateX(3px) rotate(8deg) } }
@keyframes lgrTitanMSkidShoulders { 0%, 100% { transform: none } 30%, 56% { transform: rotate(5deg) translateX(2px) } }
${P}[data-moment="shield"] .lg-titan-armR { animation: lgrTitanMSkidFist 760ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="shield"] .lg-titan-head { animation: lgrTitanMSkidHead 760ms ease-in-out both }
${P}[data-moment="shield"] .lg-titan-shoulders { animation: lgrTitanMSkidShoulders 760ms ease-in-out both }
/* SECOND WIND: its pressure drops: the head sags, the pauldrons slump, the fist sinks, the boiler settles low. */
@keyframes lgrTitanMWindHead { 0%, 100% { transform: none } 35%, 70% { transform: translateY(4px) rotate(3deg) scale(.96) } }
@keyframes lgrTitanMWindShoulders { 0%, 100% { transform: none } 35%, 70% { transform: translateY(3px) scale(.97) } }
@keyframes lgrTitanMWindFist { 0%, 100% { transform: none } 35%, 70% { transform: rotate(8deg) translateY(4px) } }
@keyframes lgrTitanMWindTorso { 0%, 100% { transform: none } 35%, 70% { transform: scale(1.02, .95) } }
${P}[data-moment="wind"] .lg-titan-head { animation: lgrTitanMWindHead 1000ms ease-in-out both }
${P}[data-moment="wind"] .lg-titan-shoulders { animation: lgrTitanMWindShoulders 1000ms ease-in-out both }
${P}[data-moment="wind"] .lg-titan-armR { animation: lgrTitanMWindFist 1000ms ease-in-out both }
${P}[data-moment="wind"] .lg-titan-torso { animation: lgrTitanMWindTorso 1000ms ease-in-out both }
/* KNOCKOUT (topple): the furnace stutters (the head shudders in jerks, the fist twitches), then the iron gives: the
   head lolls and sinks, the pauldrons drop, the fist and piston fall slack, the boiler buckles; the parts settle as the
   box topples. */
@keyframes lgrTitanMKoHead { 0% { transform: none } 6% { transform: translateX(-2px) } 10% { transform: translateX(2px) } 14% { transform: translateX(-2px) rotate(-2deg) } 18% { transform: translateX(1px) } 24%, 50% { transform: none } 64% { transform: translateY(8px) rotate(14deg) scale(.94) } 74% { transform: translateY(6px) rotate(10deg) } 86% { transform: translateY(7px) rotate(12deg) } 100% { transform: none } }
@keyframes lgrTitanMKoFist { 0%, 50% { transform: none } 10% { transform: rotate(-6deg) } 20% { transform: rotate(3deg) } 66% { transform: rotate(16deg) translateY(8px) } 80% { transform: rotate(12deg) translateY(6px) } 100% { transform: none } }
@keyframes lgrTitanMKoPiston { 0%, 52% { transform: none } 68% { transform: rotate(22deg) translateY(6px) } 82% { transform: rotate(16deg) translateY(4px) } 100% { transform: none } }
@keyframes lgrTitanMKoShoulders { 0%, 52% { transform: none } 66% { transform: translateY(6px) rotate(-4deg) } 82% { transform: translateY(4px) rotate(-2deg) } 100% { transform: none } }
@keyframes lgrTitanMKoTorso { 0%, 54% { transform: none } 66% { transform: scale(1.08, .86) } 80% { transform: scale(1.04, .92) } 100% { transform: none } }
${P}[data-moment="ko"] .lg-titan-head { animation: lgrTitanMKoHead 2400ms ease-in-out both }
${P}[data-moment="ko"] .lg-titan-armR { animation: lgrTitanMKoFist 2400ms ease-in-out both }
${P}[data-moment="ko"] .lg-titan-armL { animation: lgrTitanMKoPiston 2400ms ease-in-out both }
${P}[data-moment="ko"] .lg-titan-shoulders { animation: lgrTitanMKoShoulders 2400ms ease-in-out both }
${P}[data-moment="ko"] .lg-titan-torso { animation: lgrTitanMKoTorso 2400ms ease-in-out both }
/* ITS ABILITY, acted by the drawing.
   Crack (a plate gives): the pauldrons judder where the plate split and the head flinches. */
@keyframes lgrTitanMCrackHead { 0%, 100% { transform: none } 20% { transform: rotate(-4deg) translateY(1px) } 50% { transform: rotate(2deg) } }
${P}[data-fx="crack"] .lg-titan-shoulders { animation: lgrTitanMHitRattle 320ms linear both }
${P}[data-fx="crack"] .lg-titan-head { animation: lgrTitanMCrackHead 320ms ease-out both }
/* Shatter (the armor bursts): the pauldrons blow outward and drop lower, the head reels back, the fist flails up and the
   piston-arm swings wide, the boiler bulging. */
@keyframes lgrTitanMShatterShoulders { 0% { transform: none } 12% { transform: scale(1.16) translateY(-3px) } 30% { transform: scale(1.04) translateY(3px) } 52% { transform: translateY(2px) } 100% { transform: none } }
@keyframes lgrTitanMShatterHead { 0% { transform: none } 12% { transform: translateY(-5px) rotate(-8deg) scale(.94) } 34% { transform: translateY(2px) rotate(4deg) } 60% { transform: rotate(-1deg) } 100% { transform: none } }
@keyframes lgrTitanMShatterFist { 0%, 100% { transform: none } 14% { transform: rotate(-20deg) translateY(-4px) } 40% { transform: rotate(6deg) } }
@keyframes lgrTitanMShatterPiston { 0%, 100% { transform: none } 14% { transform: rotate(-18deg) } 40% { transform: rotate(6deg) } }
${P}[data-fx="shatter"] .lg-titan-shoulders { animation: lgrTitanMShatterShoulders 1000ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-fx="shatter"] .lg-titan-head { animation: lgrTitanMShatterHead 1000ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-fx="shatter"] .lg-titan-armR { animation: lgrTitanMShatterFist 1000ms ease-out both }
${P}[data-fx="shatter"] .lg-titan-armL { animation: lgrTitanMShatterPiston 1000ms ease-out both }
${P}[data-fx="shatter"] .lg-titan-torso { animation: lgrTitanMCritTorso 1000ms ease-out both }
/* Exposed hit (a blow on the bare core): the boiler flinches in around the wound and the head doubles forward. */
@keyframes lgrTitanMExposedTorso { 0%, 100% { transform: none } 18% { transform: scale(.92, .96) } 50% { transform: scale(1.02) } }
@keyframes lgrTitanMExposedHead { 0%, 100% { transform: none } 18% { transform: translateY(3px) scale(.95) } 50% { transform: translateY(1px) } }
${P}[data-fx="exposedHit"] .lg-titan-torso { animation: lgrTitanMExposedTorso 320ms ease-out both }
${P}[data-fx="exposedHit"] .lg-titan-head { animation: lgrTitanMExposedHead 320ms ease-out both }
`

export default {
  effects: {
    // Crack (tick): a white-hot crack line flashes across one plate, four sparks fall.
    // (the crack runs across the chest plate as a drawn, branching white-hot line over a dark groove)
    crack: () => <>
      <svg className="lgx" viewBox="0 0 100 60" style={{ left: '14%', top: '30%', width: '72%', height: '42%', overflow: 'visible', filter: `drop-shadow(0 0 6px ${HOT})` }} aria-hidden="true">
        {[['#2a1408', 10], [FORGE, 6], [HOT, 3]].map(([c, w], k) => (
          <path key={k} d="M2 30 L18 22 L27 36 L42 18 L55 38 L68 24 L80 34 L98 26 M42 18 L46 6 M55 38 L52 54 M68 24 L76 12" fill="none" stroke={c} strokeWidth={w} strokeLinejoin="bevel" strokeLinecap="round"
            style={{ strokeDasharray: 160, animation: anim('lgrTitanDraw', 330, 0, 'cubic-bezier(.2,.8,.3,1)') }} />
        ))}
      </svg>
      {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="lgx" style={{ left: `${32 + i * 7}%`, top: '50%', width: 6, height: 6, borderRadius: '50%', background: HOT, boxShadow: `0 0 0 1.5px ${FORGE}, 0 0 8px ${IRON}`, '--spin': '0deg', animation: anim('lgxFall', 340, 60 + i * 25, 'ease-in') }} />)}
    </>,
    // Shatter (big): the plates burst outward as tumbling glowing iron shards, a forge-red shockwave ring.
    shatter: () => <>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>{flash('#ffd7a8')}</div>
      {around(16, (i, a) => <div key={i} className="lgx" style={{ ...center, width: 16 + (i % 3) * 6, height: 12 + (i % 2) * 8, background: `linear-gradient(135deg, ${HOT}, ${IRON} 40%, #7a3416)`, border: '2px solid #2a1408', boxShadow: `0 0 10px ${FORGE}`, clipPath: 'polygon(20% 0, 100% 15%, 85% 100%, 0 70%)', '--a': `${a + i * 5}deg`, '--d': `${-110 - (i % 4) * 18}px`, '--spin': `${(i % 2 ? 1 : -1) * (300 + i * 20)}deg`, animation: anim('lgxShard', 1000 + (i % 3) * 100, 60) }} />)}
      {ring(FORGE, 0, 2.4, 7, 800)}
      {ring(HOT, 120, 1.8, 3, 700)}
    </>,
    // Exposed hit (tick): the strike lands on bare molten core: a jagged white-orange impact star punches in and
    // eight anvil sparks spray out.
    exposedHit: () => <>
      <svg className="lgx" viewBox="0 0 40 40" style={{ ...center, width: 64, height: 64, marginLeft: -32, marginTop: -32, overflow: 'visible', filter: `drop-shadow(0 0 8px ${FORGE})`, animation: anim('lgrTitanStar', 330, 0, 'cubic-bezier(.2,1.4,.4,1)') }} aria-hidden="true">
        <path d="M20 1 24 13 36 7 28 18 39 22 27 25 32 38 21 29 12 39 14 26 1 24 12 18 5 6 17 12Z" fill={HOT} stroke={FORGE} strokeWidth="2" strokeLinejoin="round" />
        <circle cx="20" cy="21" r="5" fill="#ffffff" />
      </svg>
      {around(8, (i, a) => <div key={i} className="lgx" style={{ ...center, width: 4, height: 12, borderRadius: 2, background: i % 2 ? HOT : IRON, boxShadow: `0 0 6px ${FORGE}`, '--a': `${a + 22}deg`, '--d': `${-44 - (i % 3) * 8}px`, '--spin': '0deg', animation: anim('lgxShard', 330, 30) }} />)}
    </>,
  },
  floaters: { crack: 'lg_fx_crack', shatter: 'lg_fx_plateShatter', exposedHit: 'lg_fx_exposedHit' },
  floaterTone: { crack: 'ink', shatter: 'warning', exposedHit: 'warning' },
  juice: {
    crack: { size: 'tick' },
    shatter: { size: 'big', shake: 3, flash: 2, hitstop: 1, sfx: 'titan.shatter' },
    exposedHit: { size: 'tick' },
  },
  css: `
@keyframes lgrTitanDraw { 0% { stroke-dashoffset: 160; opacity: 1 } 45% { stroke-dashoffset: 0; opacity: 1 } 100% { stroke-dashoffset: 0; opacity: 0 } }
@keyframes lgrTitanStar { 0% { transform: scale(.2) rotate(-25deg); opacity: 0 } 30% { transform: scale(1.25) rotate(5deg); opacity: 1 } 60% { transform: scale(1) rotate(0); opacity: 1 } 100% { transform: scale(1.1); opacity: 0 } }
@keyframes lgrTitanRattle { 0%, 100% { transform: none } 20% { transform: translateX(4px) rotate(1deg) } 40% { transform: translateX(-4px) rotate(-1deg) } 60% { transform: translateX(3px) } 80% { transform: translateX(-1px) } }
@keyframes lgrTitanFlinch { 0%, 100% { transform: none } 40% { transform: translateY(5px) scale(.96) rotate(-2deg) } 75% { transform: translateY(1px) } }
@keyframes lgrTitanBuckle { 0% { transform: none } 22% { transform: translateY(10px) rotate(4deg) scaleY(.94) } 45% { transform: translateY(9px) rotate(3deg) scaleY(.95) } 100% { transform: none } }
@keyframes lgrTitanBuckleP3 { 0% { transform: none } 18% { transform: translateY(14px) rotate(6deg) scaleY(.9) } 30% { transform: translateY(11px) rotate(-2deg) scaleY(.93) } 52% { transform: translateY(12px) rotate(3deg) scaleY(.94) } 100% { transform: none } }
.lgr-titan-crack { animation: lgrTitanRattle 320ms linear both }
.lgr-titan-exposedHit { animation: lgrTitanFlinch 320ms ease-out both }
.lgr-titan-shatter { transform-origin: 50% 100%; animation: lgrTitanBuckle 1100ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-phase="3"] .lgr-titan-shatter { animation-name: lgrTitanBuckleP3 }
/* THE REAL PARTS: the state layer this ability draws on the boss (its lg-ab-* group in raids/titan.svg) moves with
   the moment, not only the whole figure. Played only while data-fx is set (never in focus mode, with Still bosses or
   under reduced motion). */
@keyframes lgrTitanPlateJolt { 0%, 100% { transform: none } 20% { transform: translateX(2px) rotate(3deg) } 40% { transform: translateX(-2px) rotate(-3deg) } 60% { transform: translateX(1.5px) rotate(2deg) } 80% { transform: translateX(-1px) } }
.lg-boss[data-fx="crack"] [class*="lg-ab-plates-"] { transform-box: fill-box; transform-origin: center; animation: lgrTitanPlateJolt 320ms cubic-bezier(.22,1,.36,1) both }
@keyframes lgrTitanCoreFlare { 0%, 100% { transform: none; filter: none } 40% { transform: scale(1.18); filter: brightness(1.7) saturate(1.3) } }
.lg-boss[data-fx="exposedHit"] [class*="lg-ab-exposed-"] { transform-box: fill-box; transform-origin: center; animation: lgrTitanCoreFlare 320ms cubic-bezier(.22,1,.36,1) both }
${PARTS_CSS}
`,
}
