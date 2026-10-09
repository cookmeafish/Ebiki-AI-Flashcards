// What Grace of the Wheel (abilities/ophanim.js) LOOKS like (design v2.1, #23). The fx contract is in fx/index.js.
//   open   (medium) the great eye's lids open wide (the real lids, raids/ophanim.svg lgo-* hooks) and the lit wheel eye
//                  pulses; gold motes rise off it. No overlay ever covers the real eye (a drawn stand-in eye hid it).
//   blink  (tick)  the great eye truly blinks (lids shut and reopen); two glints flick at its corners.
//   beam   (big)   a spear of white light from the player's side pierces the great eye; a spinning gold ring fills
//                  the arena and gold sparks scatter; the eye flares wide and the wheels spin a full turn.
//   grace  (big)   gold light pours down toward the hearts and one fills again; the wings spread and glow, the
//                  wheels turn and the great eye glows gold.
// Serene, never angry: the reactions are all in the wheel and the eyes.
import { center, anim, around, ring } from './_kit'

// Fixed bright holy colors (never theme tokens over the art).
const H = { white: '#ffffff', gold: '#ffd257', deep: '#e7a520', pale: '#fff4cc', iris: '#6fc3ff', heart: '#ff5a72', ink: '#1d2230' }

export default {
  effects: {
    open: () => <>
      {/* a wheel of gold light rays turns out from around the eye (a ring, so the real eye stays seen) */}
      <div className="lgx" style={{ left: '50%', top: '46%', width: 150, height: 150, margin: '-75px 0 0 -75px', borderRadius: '50%', background: `repeating-conic-gradient(rgba(255,244,204,.8) 0 6deg, transparent 6deg 30deg)`, WebkitMaskImage: 'radial-gradient(circle, transparent 0 24%, #000 30%, transparent 70%)', maskImage: 'radial-gradient(circle, transparent 0 24%, #000 30%, transparent 70%)', animation: anim('lgrOphanimRays', 780) }} />
      {ring(H.gold, 0, 1.6, 4, 600)}
      {[0, 1, 2, 3, 4].map((i) => <div key={`m${i}`} className="lgx" style={{ left: `${36 + i * 7}%`, top: '30%', width: 9, height: 9, background: H.pale, clipPath: 'polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%)', filter: `drop-shadow(0 0 4px ${H.gold})`, '--h': `${-40 - (i % 2) * 18}px`, animation: anim('lgxRise', 700, 80 + i * 60) }} />)}
      {[0, 1, 2].map((i) => <div key={i} className="lgx" style={{ left: `${46 + i * 4}%`, top: '26%', width: 4, height: 4, borderRadius: '50%', background: H.pale, boxShadow: `0 0 6px ${H.gold}`, '--h': '-22px', animation: anim('lgxRise', 320, 40 + i * 40) }} />)}
    </>,
    blink: () => <>
      {/* glints at the eye's corners, never over the eye itself */}
      {[-1, 1].map((d) => <div key={d} className="lgx" style={{ left: `calc(50% + ${d * 30}px)`, top: '44%', width: 16, height: 16, marginLeft: -8, background: H.pale, clipPath: 'polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%)', filter: `drop-shadow(0 0 3px ${H.gold})`, '--h': '-8px', animation: anim('lgxRise', 300, 60) }} />)}
    </>,
    beam: () => <>
      {/* the spinning gold ring that fills the arena */}
      <div className="lgx" style={{ ...center, width: '96%', height: '96%', margin: '-48% 0 0 -48%', borderRadius: '50%', border: `6px double ${H.gold}`, boxShadow: `0 0 26px ${H.gold}, inset 0 0 22px ${H.pale}`, animation: anim('lgrOphanimHalo', 1150) }} />
      {/* the great eye it pierces is the REAL one: its lids flare open and the wheels spin (css below) */}
      {/* the spear of light, from the player's side (below) */}
      <div className="lgx" style={{ left: '50%', top: '50%', width: 18, height: '95%', marginLeft: -9, borderRadius: 9, transformOrigin: 'top center', background: `linear-gradient(${H.white}, ${H.pale} 40%, ${H.gold} 80%, transparent)`, boxShadow: `0 0 24px ${H.white}, 0 0 50px ${H.gold}`, animation: anim('lgrOphanimSpear', 700, 60, 'cubic-bezier(.22,1,.36,1)') }} />
      {ring(H.white, 240, 1.6, 6, 450)}{ring(H.gold, 300, 2.4, 4, 700)}
      {around(16, (i, a) => <div key={i} className="lgx" style={{ ...center, width: i % 2 ? 6 : 9, height: i % 2 ? 6 : 9, marginLeft: -3, background: i % 3 ? H.gold : H.white, clipPath: 'polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%)', filter: `drop-shadow(0 0 4px ${H.gold})`, '--a': `${a}deg`, '--d': `${-74 - (i % 4) * 14}px`, '--spin': '180deg', animation: anim('lgxShard', 820, 280 + (i % 4) * 25) }} />)}
    </>,
    grace: () => <>
      {/* a column of gold light pours down over the hearts */}
      <div className="lgx" style={{ left: '50%', top: '-20%', width: '42%', height: '150%', marginLeft: '-21%', background: `linear-gradient(${H.white}, ${H.pale} 30%, rgba(255, 210, 87, .55) 70%, transparent)`, filter: 'blur(2px)', transformOrigin: 'top center', animation: anim('lgxBeam', 1150) }} />
      {ring(H.gold, 120, 2.2, 4, 800)}
      {/* a heart fills and flies down to the lives */}
      <div className="lgx" style={{ ...center, fontSize: 30, marginLeft: -15, marginTop: -18, filter: `drop-shadow(0 0 10px ${H.gold})`, '--tx': '0px', '--ty': '130px', animation: anim('lgxToHearts', 1100, 220, 'ease-in') }}>💛</div>
      {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="lgx" style={{ left: `${36 + i * 5}%`, top: '-4%', width: 5, height: 5, borderRadius: '50%', background: H.pale, boxShadow: `0 0 6px ${H.gold}`, '--spin': '0deg', animation: anim('lgxFall', 1000, 120 + i * 80, 'ease-in') }} />)}
    </>,
  },
  floaters: { open: 'lg_fx_eyeOpen', blink: 'lg_fx_eyeBlink', beam: 'lg_fx_holyBeam', grace: 'lg_fx_wheelGrace' },
  floaterTone: { open: 'warning', blink: 'ink', beam: 'warning', grace: 'success' },
  demo: { blink: { kind: 'miss', damage: 0, lives: 1 }, grace: { kind: 'block', damage: 0, lives: 0 } },
  juice: {
    open: { size: 'medium', sfx: 'ophanim.open' },
    blink: { size: 'tick' },
    beam: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'ophanim.beam' },
    grace: { size: 'big', shake: 1, flash: 1, hitstop: 1, sfx: 'ophanim.grace' },
  },
  css: `
@keyframes lgrOphanimRays { 0% { transform: rotate(0) scale(.5); opacity: 0 } 25% { opacity: 1 } 100% { transform: rotate(40deg) scale(1.15); opacity: 0 } }
@keyframes lgrOphanimHalo { 0% { transform: rotate(0) scale(.3); opacity: 0 } 25% { transform: rotate(120deg) scale(1.05); opacity: 1 } 75% { transform: rotate(330deg) scale(1); opacity: .9 } 100% { transform: rotate(420deg) scale(1.15); opacity: 0 } }
@keyframes lgrOphanimSpear { 0% { transform: scaleY(0) translateY(60%); opacity: 0 } 18% { opacity: 1 } 45% { transform: scaleY(1) translateY(0); opacity: 1 } 100% { transform: scaleY(1) scaleX(.2); opacity: 0 } }
.lgr-ophanim-open { animation: lgrOphanimRise 620ms cubic-bezier(.22,1,.36,1) both }
@keyframes lgrOphanimRise { 0%, 100% { transform: none } 40% { transform: translateY(-6px) scale(1.03) } 75% { transform: translateY(-1px) } }
.lgr-ophanim-blink { animation: lgrOphanimSway 320ms ease-out both }
@keyframes lgrOphanimSway { 0%, 100% { transform: none } 45% { transform: translateY(4px) rotate(-2deg) scale(.98) } }
.lgr-ophanim-beam, .lgr-ophanim-grace { animation: lgrOphanimTilt 1100ms cubic-bezier(.22,1,.36,1) both }
@keyframes lgrOphanimTilt { 0% { transform: perspective(600px) } 30% { transform: perspective(600px) rotateX(18deg) rotateY(-14deg) } 55% { transform: perspective(600px) rotateX(-8deg) rotateY(7deg) } 78% { transform: perspective(600px) rotateX(3deg) rotateY(-2deg) } 100% { transform: perspective(600px) } }
/* THE REAL PARTS (hooks in raids/ophanim.svg): the great eye's almond masks (.lgo-alm) and lids (.lgo-lids) scale about
   the eye's center, so the lids truly open, blink and flare; the wheels (.lgo-wa / .lgo-wb) spin; the wings (.lgo-wing)
   spread. Every move ends on the phase's own resting eye (phase 1 half-closed, 2 open, 3 widest). Played only while
   data-fx is set, which the arena never does in focus mode, with Still bosses or under reduced motion. */
.lg-boss .lgo-alm, .lg-boss .lgo-lids, .lg-boss .lgo-eye { transform-box: view-box; transform-origin: 60px 55px }
.lg-boss .lgo-wa { transform-box: view-box; transform-origin: 60px 56px }
.lg-boss .lgo-wb { transform-box: view-box; transform-origin: 60px 60px }
.lg-boss .lgo-wing { transform-box: view-box; transform-origin: 60px 54px }
.lg-boss [class^="lg-ab-lit-"] { transform-box: fill-box; transform-origin: center }
@keyframes lgrOphanimLidsOpen { 0% { transform: none } 35% { transform: scaleY(1.45) } 60% { transform: scaleY(1.3) } 100% { transform: none } }
@keyframes lgrOphanimLidsOpenP3 { 0% { transform: none } 35% { transform: scaleY(1.18) } 60% { transform: scaleY(1.1) } 100% { transform: none } }
@keyframes lgrOphanimLidsBlink { 0%, 100% { transform: none } 40%, 55% { transform: scaleY(.05) } }
@keyframes lgrOphanimLidsFlare { 0% { transform: none } 20% { transform: scaleY(1.4) scaleX(1.06) } 55% { transform: scaleY(1.3) scaleX(1.04) } 100% { transform: none } }
@keyframes lgrOphanimEyeFlare { 0% { transform: none; filter: none } 20% { transform: scale(1.08); filter: brightness(1.6) saturate(1.3) } 60% { transform: scale(1.05); filter: brightness(1.3) } 100% { transform: none; filter: none } }
@keyframes lgrOphanimEyeGlow { 0%, 100% { transform: none; filter: none } 30% { transform: scale(1.06); filter: brightness(1.4) sepia(.35) } 65% { transform: scale(1.02); filter: brightness(1.15) sepia(.2) } }
@keyframes lgrOphanimLitPulse { 0%, 100% { transform: none } 40% { transform: scale(1.7) } }
@keyframes lgrOphanimSpinA { 0% { transform: none } 100% { transform: rotate(360deg) } }
@keyframes lgrOphanimSpinB { 0% { transform: none } 100% { transform: rotate(-360deg) } }
@keyframes lgrOphanimTurnA { 0%, 100% { transform: none } 50% { transform: rotate(35deg) } }
@keyframes lgrOphanimTurnB { 0%, 100% { transform: none } 50% { transform: rotate(-35deg) } }
@keyframes lgrOphanimWingSpread { 0%, 100% { transform: none; filter: none } 35% { transform: scale(1.14, 1.06); filter: brightness(1.35) drop-shadow(0 0 2px #ffd257) } 70% { transform: scale(1.08, 1.03); filter: brightness(1.15) } }
.lg-boss[data-fx="open"] .lgo-alm, .lg-boss[data-fx="open"] .lgo-lids { animation: lgrOphanimLidsOpen 620ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-phase="3"][data-fx="open"] .lgo-alm, .lg-boss[data-phase="3"][data-fx="open"] .lgo-lids { animation-name: lgrOphanimLidsOpenP3 }
.lg-boss[data-fx="open"] [class^="lg-ab-lit-"] { animation: lgrOphanimLitPulse 620ms ease-out both }
.lg-boss[data-fx="blink"] .lgo-alm, .lg-boss[data-fx="blink"] .lgo-lids { animation: lgrOphanimLidsBlink 320ms ease-in-out both }
.lg-boss[data-fx="beam"] .lgo-alm, .lg-boss[data-fx="beam"] .lgo-lids { animation: lgrOphanimLidsFlare 1100ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-fx="beam"] .lgo-eye { animation: lgrOphanimEyeFlare 1100ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-fx="beam"] .lgo-wa { animation: lgrOphanimSpinA 1100ms cubic-bezier(.45,0,.2,1) both }
.lg-boss[data-fx="beam"] .lgo-wb { animation: lgrOphanimSpinB 1100ms cubic-bezier(.45,0,.2,1) both }
.lg-boss[data-fx="grace"] .lgo-wing { animation: lgrOphanimWingSpread 1100ms ease-in-out both }
.lg-boss[data-fx="grace"] .lgo-wa { animation: lgrOphanimTurnA 1100ms ease-in-out both }
.lg-boss[data-fx="grace"] .lgo-wb { animation: lgrOphanimTurnB 1100ms ease-in-out both }
.lg-boss[data-fx="grace"] .lgo-eye { animation: lgrOphanimEyeGlow 1100ms ease-in-out both }
/* THE ATTACK ON THE PLAYER (impact/assault.js arc + blast; data-assault-on, the wheels leave at 120 ms and land near
   420 ms): every wheel winds back a little, then WHIRLS a full turn as the sweep leaves for your heart, the wings draw
   in and lash out wide behind it, the great eye leans after it. Outer wrappers (lg-ophanim-wheelA / -wingA / -eyeA),
   so the strike moment's own moves on the lgo-* groups play over it. */
.lg-boss .lg-ophanim-wheelA { transform-box: view-box; transform-origin: 60px 57px }
.lg-boss .lg-ophanim-wingA { transform-box: view-box; transform-origin: 60px 54px }
.lg-boss .lg-ophanim-eyeA { transform-box: view-box; transform-origin: 60px 55px }
@keyframes lgrOphanimWhirl { 0% { transform: none } 7% { transform: rotate(-26deg) scale(.94) } 26% { transform: rotate(210deg) scale(1.1) } 50% { transform: rotate(320deg) scale(1.03) } 100% { transform: rotate(360deg) } }
@keyframes lgrOphanimLash { 0% { transform: none } 7% { transform: scale(.88, .94) } 22% { transform: scale(1.2, 1.1) } 50% { transform: scale(1.06, 1.03) } 100% { transform: none } }
@keyframes lgrOphanimLean { 0% { transform: none } 7% { transform: scale(.92) } 24% { transform: translateX(4%) scale(1.14) } 60% { transform: translateX(2%) scale(1.05) } 100% { transform: none } }
.lg-boss[data-motif="ophanim"][data-assault-on] .lg-ophanim-wheelA { animation: lgrOphanimWhirl 1500ms cubic-bezier(.3,.7,.3,1) both }
.lg-boss[data-motif="ophanim"][data-assault-on] .lg-ophanim-wingA { animation: lgrOphanimLash 1300ms cubic-bezier(.3,.7,.3,1) both }
.lg-boss[data-motif="ophanim"][data-assault-on] .lg-ophanim-eyeA { animation: lgrOphanimLean 1300ms cubic-bezier(.3,.7,.3,1) both }
/* More of the drawing in each ability (the eye alone was too small to read at arena size): open = the wings lift and
   the wheels part to unveil the eye; blink = the wings flick and the eye shivers; beam = the spear of light shoves the
   wings back. */
@keyframes lgrOphanimUnveil { 0% { transform: none } 35% { transform: scale(1.1, 1.08) translateY(-3%) } 100% { transform: none } }
@keyframes lgrOphanimPartA { 0% { transform: none } 35% { transform: rotate(24deg) scale(1.06) } 100% { transform: none } }
@keyframes lgrOphanimPartB { 0% { transform: none } 35% { transform: rotate(-24deg) scale(1.06) } 100% { transform: none } }
@keyframes lgrOphanimWingFlick { 0%, 100% { transform: none } 45% { transform: scale(1.04, .9) } }
@keyframes lgrOphanimShiver { 0%, 100% { transform: none } 25% { transform: translateX(-2%) } 50% { transform: translateX(2%) } 75% { transform: translateX(-1%) } }
@keyframes lgrOphanimShoved { 0% { transform: none } 18% { transform: scale(.82, .9) translateY(-2%) } 55% { transform: scale(.94, .96) } 100% { transform: none } }
.lg-boss[data-motif="ophanim"][data-fx="open"] .lgo-wing { animation: lgrOphanimUnveil 640ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-motif="ophanim"][data-fx="open"] .lgo-wa { animation: lgrOphanimPartA 640ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-motif="ophanim"][data-fx="open"] .lgo-wb { animation: lgrOphanimPartB 640ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-motif="ophanim"][data-fx="blink"] .lgo-wing { animation: lgrOphanimWingFlick 320ms ease-in-out both }
.lg-boss[data-motif="ophanim"][data-fx="blink"] .lgo-eye { animation: lgrOphanimShiver 320ms linear both }
.lg-boss[data-motif="ophanim"][data-fx="beam"] .lgo-wing { animation: lgrOphanimShoved 1100ms cubic-bezier(.2,.9,.3,1) both }
`,
}
