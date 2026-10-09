// What the chimera raid ability (threeheads: Three Heads) LOOKS like. The fx contract is in fx/index.js, the juice in
// fx/_juice.js. Fixed bright colors per head (never theme tokens over the art): gold Lion, bone-white Goat,
// venom-green Serpent.
import { center, anim, around, slash, ring, flash } from './_kit'

const LION = '#ffc531'
const GOAT = '#f6f0dc'
const SERPENT = '#5dff6a'

// A head falls: three claw rakes in its color, its icon slams down and shatters.
const fall = (color, icon) => () => <>
  <div style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>{flash(color)}</div>
  {slash(-62, color, 0, '115%', 10)}{slash(-62, '#ffffff', 90, '100%', 5)}{slash(-62, color, 180, '115%', 10)}
  <div className="lgx" style={{ ...center, fontSize: 56, lineHeight: 1, filter: `drop-shadow(0 0 14px ${color})`, animation: anim('lgrChimeraFxSlam', 700, 160, 'cubic-bezier(.34,1.56,.64,1)') }}>{icon}</div>
  {around(18, (i, a) => <div key={i} className="lgx" style={{ ...center, width: 8 + (i % 3) * 3, height: 12 + (i % 2) * 6, background: i % 3 ? color : '#ffffff', border: '1.5px solid #1d1408', clipPath: 'polygon(50% 0, 100% 100%, 0 100%)', '--a': `${a + i * 6}deg`, '--d': `${-90 - (i % 4) * 15}px`, '--spin': `${(i % 2 ? 1 : -1) * 280}deg`, animation: anim('lgxShard', 850, 520 + (i % 3) * 20) }} />)}
  {ring(color, 520, 2.2, 5, 700)}
</>

export default {
  effects: {
    fallLion: fall(LION, '🦁'),
    fallGoat: fall(GOAT, '🐐'),
    fallSerpent: fall(SERPENT, '🐍'),
    // Goat block (medium): a horn-shaped shield flashes over the hearts.
    // (a huge curled ram horn sweeps in front of the hearts like a shield and takes the blow: clang sparks fly)
    goatBlock: () => <>
      <svg className="lgx" viewBox="0 0 100 100" style={{ left: '50%', top: '50%', width: 120, height: 120, margin: '-60px 0 0 -60px', overflow: 'visible', filter: `drop-shadow(0 0 8px ${GOAT})`, animation: anim('lgrChimeraHornSweep', 760, 0, 'cubic-bezier(.3,1.3,.4,1)') }} aria-hidden="true">
        <path d="M50 8C78 8 94 30 90 54S62 86 46 74 34 46 52 42 68 54 60 62" fill="none" stroke="#3a2a12" strokeWidth="20" strokeLinecap="round" />
        <path d="M50 8C78 8 94 30 90 54S62 86 46 74 34 46 52 42 68 54 60 62" fill="none" stroke={GOAT} strokeWidth="14" strokeLinecap="round" />
        <path d="M56 12C76 14 88 30 86 50M84 62C76 76 60 80 50 72" fill="none" stroke="#c9b98a" strokeWidth="3" strokeDasharray="4 5" />
      </svg>
      {around(10, (i, a) => <div key={i} className="lgx" style={{ ...center, width: 4, height: 12, borderRadius: 2, background: i % 2 ? '#ffffff' : '#ffe08a', boxShadow: '0 0 6px #ffe08a', '--a': `${a}deg`, '--d': `${-58 - (i % 3) * 10}px`, '--spin': '0deg', animation: anim('lgxShard', 420, 260) }} />)}
      <div className="lgx" style={{ left: '50%', top: '78%', width: 70, height: 60, background: `radial-gradient(circle at 50% 30%, #ffffff 0 20%, ${GOAT} 45%, #c9b98a 80%)`, border: '3px solid #3a2a12', clipPath: 'polygon(50% 0, 100% 18%, 92% 62%, 50% 100%, 8% 62%, 0 18%)', '--s': 1.3, animation: anim('lgxRing', 760) }} />
      <div className="lgx" style={{ left: '50%', bottom: '10%', fontSize: 26, marginLeft: -13, animation: anim('lgxFade', 760) }}>🐐</div>
      {ring(GOAT, 80, 1.5, 3, 600)}
    </>,
    // Maul (tick): a right answer wounds the aimed head: three red claw rakes across it and a few sparks.
    maul: () => <>
      {slash(-58, '#ff4a3d', 0, '62%', 6)}{slash(-58, '#ffffff', 50, '56%', 3)}{slash(-58, '#ff4a3d', 100, '62%', 6)}
      {around(6, (i, a) => <div key={i} className="lgx" style={{ ...center, width: 5, height: 5, borderRadius: '50%', background: i % 2 ? '#ffc531' : '#ffffff', '--a': `${a + 20}deg`, '--d': '-40px', '--spin': '0deg', animation: anim('lgxShard', 320, 60) }} />)}
    </>,
    // Aim (tick): a reticle snaps onto the head.
    aim: () => <>
      {[0, 90, 180, 270].map((r) => <div key={r} className="lgx" style={{ ...center, width: 0, height: 0, transform: `rotate(${r}deg)` }}><div style={{ position: 'absolute', left: -44, top: -44, width: 22, height: 22, borderTop: '5px solid #ff3d3d', borderLeft: '5px solid #ff3d3d', filter: 'drop-shadow(0 0 2px #1d1408) drop-shadow(0 0 6px #ff3d3d)', animation: anim('lgrChimeraBracket', 330, 0, 'cubic-bezier(.3,1.5,.5,1)') }} /></div>)}
      <div className="lgx" style={{ ...center, width: 54, height: 54, marginLeft: -27, marginTop: -27, borderRadius: '50%', border: '3px solid #ff3d3d', boxShadow: '0 0 0 1.5px #1d1408, 0 0 10px #ff3d3d', background: 'linear-gradient(#ff3d3d, #ff3d3d) center / 2px 100% no-repeat, linear-gradient(#ff3d3d, #ff3d3d) center / 100% 2px no-repeat', animation: anim('lgrChimeraFxLock', 330, 0, 'cubic-bezier(.34,1.56,.64,1)') }} />
    </>,
  },
  floaters: { fallLion: 'lg_fx_lionFalls', fallGoat: 'lg_fx_goatFalls', fallSerpent: 'lg_fx_serpentFalls', goatBlock: 'lg_fx_goatBlock', aim: 'lg_fx_aim', maul: 'lg_fx_maul' },
  floaterTone: { fallLion: 'warning', fallGoat: 'ink', fallSerpent: 'success', goatBlock: 'success', aim: 'danger', maul: 'danger' },
  juice: {
    fallLion: { size: 'big', shake: 3, flash: 2, hitstop: 1, sfx: 'chimera.fall' },
    fallGoat: { size: 'big', shake: 3, flash: 2, hitstop: 1, sfx: 'chimera.fall' },
    fallSerpent: { size: 'big', shake: 3, flash: 2, hitstop: 1, sfx: 'chimera.fall' },
    goatBlock: { size: 'medium', shake: 1, flash: 1, sfx: 'chimera.block' },
    aim: { size: 'tick' },
    maul: { size: 'tick' },
  },
  // The asset view's replay buttons fake these strikes.
  demo: { goatBlock: { kind: 'block', damage: 0, lives: 0 }, aim: { kind: 'block', damage: 0, lives: 0 } },
  css: `
@keyframes lgrChimeraHornSweep { 0% { transform: translateX(-80px) rotate(-120deg) scale(.5); opacity: 0 } 35% { transform: translateX(6px) rotate(8deg) scale(1.1); opacity: 1 } 50% { transform: translateX(0) rotate(0) scale(1) } 80% { opacity: 1 } 100% { transform: scale(1.05); opacity: 0 } }
@keyframes lgrChimeraBracket { 0% { transform: translate(-26px, -26px); opacity: 0 } 50% { transform: translate(2px, 2px); opacity: 1 } 70% { transform: none; opacity: 1 } 100% { transform: none; opacity: 0 } }
@keyframes lgrChimeraFxSlam { 0% { transform: translate(-50%, -160%) scale(1.6); opacity: 0 } 25% { opacity: 1 } 45% { transform: translate(-50%, -50%) scale(1) } 60% { transform: translate(-50%, -48%) scale(1.08, .9) } 75% { transform: translate(-50%, -50%) scale(1); opacity: 1 } 100% { transform: translate(-50%, -50%) scale(.2); opacity: 0 } }
@keyframes lgrChimeraFxLock { 0% { transform: scale(2.2) rotate(45deg); opacity: 0 } 60% { transform: scale(.95) rotate(0); opacity: 1 } 100% { transform: scale(1); opacity: 0 } }
@keyframes lgrChimeraSag { 0% { transform: none } 25% { transform: translateX(var(--lgr-side, 0)) rotate(calc(var(--lgr-tilt, 0deg))) } 55% { transform: translateX(calc(var(--lgr-side, 0) * .6)) translateY(6px) } 100% { transform: none } }
@keyframes lgrChimeraBrace { 0%, 100% { transform: none } 30% { transform: translateY(7px) scale(1.06, .9) } 55% { transform: translateY(-5px) scale(.97, 1.05) } 78% { transform: translateY(1px) } }
@keyframes lgrChimeraGlance { 0%, 100% { transform: none } 40% { transform: translateY(-5px) rotate(var(--lgr-look, 0deg)) } 70% { transform: translateY(-1px) rotate(calc(var(--lgr-look, 0deg) * .5)) } }
.lgr-chimera-fallLion, .lgr-chimera-fallGoat, .lgr-chimera-fallSerpent { transform-origin: 50% 100%; animation: lgrChimeraSag 1000ms cubic-bezier(.22,1,.36,1) both }
/* Sides follow the drawing: Lion in the CENTER, Serpent upper LEFT, Goat RIGHT (every phase). */
.lgr-chimera-fallLion { --lgr-side: 0px; --lgr-tilt: 0deg }
.lgr-chimera-fallGoat { --lgr-side: 12px; --lgr-tilt: 5deg }
.lgr-chimera-fallSerpent { --lgr-side: -12px; --lgr-tilt: -5deg }
.lg-boss[data-phase="3"] .lgr-chimera-fallLion, .lg-boss[data-phase="3"] .lgr-chimera-fallGoat, .lg-boss[data-phase="3"] .lgr-chimera-fallSerpent { animation-duration: 1150ms }
.lgr-chimera-goatBlock { transform-origin: 50% 100%; animation: lgrChimeraBrace 620ms ease-out both }
.lgr-chimera-aim { transform-origin: 50% 90%; animation: lgrChimeraGlance 320ms ease-out both }
/* maul: the wounded head (the one aimed at) snaps back, the body rocks toward its side */
@keyframes lgrChimeraRecoil { 0%, 100% { transform: none } 30% { transform: translateY(5px) rotate(calc(var(--lgr-look, 0deg) * -1)) scale(.97) } 65% { transform: translateY(-1px) rotate(calc(var(--lgr-look, 0deg) * .4)) } }
.lgr-chimera-maul { transform-origin: 50% 90%; animation: lgrChimeraRecoil 320ms ease-out both }
/* aim 0 = Lion (centre: no glance), 1 = Goat (right), 2 = Serpent (left) */
.lg-boss[data-ab-aim="1"] .lgr-chimera-aim, .lg-boss[data-ab-aim="1"] .lgr-chimera-maul { --lgr-look: 7deg }
.lg-boss[data-ab-aim="2"] .lgr-chimera-aim, .lg-boss[data-ab-aim="2"] .lgr-chimera-maul { --lgr-look: -7deg }
/* THE DRAWING'S OWN PARTS (raids/chimera.svg lg-chimera-*): their pivots, its attack on the player, how each ability
   moment moves them, and its knockout. Ability rules carry a doubled class (.lg-boss.lg-boss) so they win over a plain
   strike moment playing on the same part at the same time. */
.lg-boss[data-motif="chimera"] [class*="lg-chimera-"] { transform-box: fill-box; transform-origin: 50% 90% }
.lg-boss[data-motif="chimera"] .lg-chimera-jaw { transform-origin: 50% 0 }
.lg-boss[data-motif="chimera"] .lg-chimera-goat { transform-origin: 30% 95% }
.lg-boss[data-motif="chimera"] .lg-chimera-serpent { transform-origin: 70% 100% }
.lg-boss[data-motif="chimera"] .lg-chimera-body { transform-origin: 50% 100% }
.lg-boss[data-motif="chimera"] .lg-chimera-pawL { transform-origin: 60% 0 }
.lg-boss[data-motif="chimera"] .lg-chimera-pawR { transform-origin: 40% 0 }
.lg-boss[data-motif="chimera"] .lg-chimera-wingL { transform-origin: 100% 100% }
.lg-boss[data-motif="chimera"] .lg-chimera-wingR { transform-origin: 0 100% }
/* Its attack on the player (impact/AssaultFx: a pounce, then claw rakes across the screen). The drawing does it: the
   Lion crouches with its jaws shut, then lunges at you with them wide and snaps them on your heart, while the right
   paw rakes down across the screen and the left braces. */
@keyframes lgrChimeraAsLion { 0% { transform: none } 16% { transform: translateY(-10%) scale(.86) rotate(-4deg) } 40% { transform: translateY(18%) scale(1.5) rotate(3deg) } 52% { transform: translateY(15%) scale(1.42) } 78% { transform: translateY(6%) scale(1.14) } 100% { transform: none } }
@keyframes lgrChimeraAsJaw { 0% { transform: none } 16% { transform: scaleY(.5) } 36% { transform: scaleY(2) scaleX(1.12) } 46% { transform: scaleY(.55) } 70% { transform: scaleY(.8) } 100% { transform: none } }
@keyframes lgrChimeraAsRake { 0% { transform: none } 20% { transform: rotate(40deg) translateY(-14%) } 44% { transform: rotate(-36deg) translateY(10%) scale(1.15) } 62% { transform: rotate(-26deg) translateY(7%) } 100% { transform: none } }
@keyframes lgrChimeraAsBrace { 0% { transform: none } 20% { transform: rotate(-10deg) translateY(4%) } 50% { transform: rotate(8deg) translateY(6%) } 100% { transform: none } }
.lg-boss[data-motif="chimera"][data-assault-on] .lg-chimera-lion { animation: lgrChimeraAsLion 800ms cubic-bezier(.45,0,.2,1) both }
.lg-boss[data-motif="chimera"][data-assault-on] .lg-chimera-jaw { animation: lgrChimeraAsJaw 800ms cubic-bezier(.45,0,.2,1) both }
.lg-boss[data-motif="chimera"][data-assault-on] .lg-chimera-pawR { animation: lgrChimeraAsRake 800ms cubic-bezier(.5,0,.2,1) both }
.lg-boss[data-motif="chimera"][data-assault-on] .lg-chimera-pawL { animation: lgrChimeraAsBrace 800ms ease-out both }
/* A head falls: THAT head is struck down in the drawing (it snaps back, then slumps and hangs) while the other two
   rear up in rage. */
@keyframes lgrChimeraLionFall { 0% { transform: none } 10% { transform: translateY(-14%) rotate(-12deg) scale(.9) } 30% { transform: translateY(22%) rotate(14deg) scale(.86) } 70% { transform: translateY(18%) rotate(10deg) scale(.88) } 100% { transform: none } }
@keyframes lgrChimeraJawHang { 0% { transform: none } 30%, 70% { transform: scaleY(1.5) rotate(6deg) } 100% { transform: none } }
@keyframes lgrChimeraGoatFall { 0% { transform: none } 10% { transform: rotate(-16deg) translateY(-10%) } 30% { transform: rotate(38deg) translate(10%, 22%) scale(.9) } 70% { transform: rotate(32deg) translate(8%, 18%) scale(.9) } 100% { transform: none } }
@keyframes lgrChimeraSerpentFall { 0% { transform: none } 10% { transform: rotate(14deg) scaleY(1.1) } 30% { transform: rotate(-34deg) scaleY(.6) translateX(-10%) } 70% { transform: rotate(-28deg) scaleY(.66) translateX(-8%) } 100% { transform: none } }
@keyframes lgrChimeraRage { 0% { transform: none } 14% { transform: scale(1.18) translateY(-6%) } 30% { transform: scale(1.1) translateY(-3%) rotate(-4deg) } 50% { transform: scale(1.12) rotate(4deg) } 100% { transform: none } }
.lg-boss.lg-boss[data-fx="fallLion"] .lg-chimera-lion { animation: lgrChimeraLionFall 1150ms cubic-bezier(.3,0,.3,1) both }
.lg-boss.lg-boss[data-fx="fallLion"] .lg-chimera-jaw { animation: lgrChimeraJawHang 1150ms ease-out both }
.lg-boss.lg-boss[data-fx="fallLion"] .lg-chimera-goat, .lg-boss.lg-boss[data-fx="fallLion"] .lg-chimera-serpent { animation: lgrChimeraRage 1150ms ease-out both }
.lg-boss.lg-boss[data-fx="fallGoat"] .lg-chimera-goat { animation: lgrChimeraGoatFall 1150ms cubic-bezier(.3,0,.3,1) both }
.lg-boss.lg-boss[data-fx="fallGoat"] .lg-chimera-lion, .lg-boss.lg-boss[data-fx="fallGoat"] .lg-chimera-serpent { animation: lgrChimeraRage 1150ms ease-out both }
.lg-boss.lg-boss[data-fx="fallSerpent"] .lg-chimera-serpent { animation: lgrChimeraSerpentFall 1150ms cubic-bezier(.3,0,.3,1) both }
.lg-boss.lg-boss[data-fx="fallSerpent"] .lg-chimera-lion, .lg-boss.lg-boss[data-fx="fallSerpent"] .lg-chimera-goat { animation: lgrChimeraRage 1150ms ease-out both }
/* Goat block: the Goat swings its horns down in front of the others and takes the blow, braced. */
@keyframes lgrChimeraGoatGuard { 0% { transform: none } 18% { transform: rotate(-30deg) translate(-18%, 8%) scale(1.12) } 34% { transform: rotate(-26deg) translate(-14%, 10%) scale(1.06, .94) } 60% { transform: rotate(-28deg) translate(-16%, 8%) scale(1.1) } 100% { transform: none } }
@keyframes lgrChimeraDuck { 0% { transform: none } 18%, 60% { transform: translateY(8%) scale(.92) } 100% { transform: none } }
.lg-boss.lg-boss[data-fx="goatBlock"] .lg-chimera-goat { animation: lgrChimeraGoatGuard 760ms cubic-bezier(.3,0,.2,1) both }
.lg-boss.lg-boss[data-fx="goatBlock"] .lg-chimera-lion, .lg-boss.lg-boss[data-fx="goatBlock"] .lg-chimera-serpent { animation: lgrChimeraDuck 760ms ease-out both }
/* Aim: the head you aim at leans out and bares itself at you. Maul: that head is struck and snaps back. */
@keyframes lgrChimeraAimLean { 0%, 100% { transform: none } 40% { transform: scale(1.22) translateY(6%) } 70% { transform: scale(1.12) translateY(3%) } }
@keyframes lgrChimeraMauled { 0%, 100% { transform: none } 25% { transform: translateY(-14%) rotate(-14deg) scale(.82) } 60% { transform: translateY(-4%) rotate(5deg) } }
.lg-boss.lg-boss[data-fx="aim"]:not([data-ab-aim="1"]):not([data-ab-aim="2"]) .lg-chimera-lion, .lg-boss.lg-boss[data-fx="aim"][data-ab-aim="1"] .lg-chimera-goat, .lg-boss.lg-boss[data-fx="aim"][data-ab-aim="2"] .lg-chimera-serpent { animation: lgrChimeraAimLean 340ms cubic-bezier(.22,1,.36,1) both }
.lg-boss.lg-boss[data-fx="maul"]:not([data-ab-aim="1"]):not([data-ab-aim="2"]) .lg-chimera-lion, .lg-boss.lg-boss[data-fx="maul"][data-ab-aim="1"] .lg-chimera-goat, .lg-boss.lg-boss[data-fx="maul"][data-ab-aim="2"] .lg-chimera-serpent { animation: lgrChimeraMauled 340ms cubic-bezier(.2,.8,.3,1) both }
/* THE KNOCKOUT (data-moment="ko", kept here because its 2300 ms outlasts the shortest knockout and the impact layer
   style is shared by every boss): three last roars, Lion (280 ms), Goat (630), Serpent (980), each head rearing up
   as its roar ring goes out, then at the climax (1400) all three drop and the body sinks. */
@keyframes lgrChimeraKoLion { 0% { transform: none } 12%, 20% { transform: translateY(-14%) rotate(-6deg) scale(1.12) } 30%, 58% { transform: translateY(-4%) } 64% { transform: translateY(20%) rotate(12deg) scale(.9) } 90% { transform: translateY(16%) rotate(10deg) scale(.9) } 100% { transform: none } }
@keyframes lgrChimeraKoJaw { 0% { transform: none } 12%, 20% { transform: scaleY(2) } 30%, 60% { transform: scaleY(1.2) } 66%, 90% { transform: scaleY(1.5) rotate(8deg) } 100% { transform: none } }
@keyframes lgrChimeraKoGoat { 0%, 22% { transform: none } 28%, 36% { transform: rotate(-24deg) translate(6%, -14%) } 46%, 58% { transform: rotate(-6deg) } 64% { transform: rotate(40deg) translate(10%, 24%) scale(.88) } 90% { transform: rotate(34deg) translate(8%, 20%) scale(.88) } 100% { transform: none } }
@keyframes lgrChimeraKoSerpent { 0%, 37% { transform: none } 43%, 52% { transform: scaleY(1.25) rotate(16deg) } 58% { transform: scaleY(1.1) } 64% { transform: scaleY(.55) rotate(-36deg) translateX(-10%) } 90% { transform: scaleY(.6) rotate(-30deg) translateX(-8%) } 100% { transform: none } }
@keyframes lgrChimeraKoSink { 0%, 58% { transform: none } 64% { transform: translateY(8%) scaleY(.92) } 90% { transform: translateY(6%) scaleY(.94) } 100% { transform: none } }
.lg-boss[data-motif="chimera"][data-moment="ko"] .lg-chimera-lion { animation: lgrChimeraKoLion 2300ms linear both }
.lg-boss[data-motif="chimera"][data-moment="ko"] .lg-chimera-jaw { animation: lgrChimeraKoJaw 2300ms linear both }
.lg-boss[data-motif="chimera"][data-moment="ko"] .lg-chimera-goat { animation: lgrChimeraKoGoat 2300ms linear both }
.lg-boss[data-motif="chimera"][data-moment="ko"] .lg-chimera-serpent { animation: lgrChimeraKoSerpent 2300ms linear both }
.lg-boss[data-motif="chimera"][data-moment="ko"] .lg-chimera-body, .lg-boss[data-motif="chimera"][data-moment="ko"] .lg-chimera-wingL, .lg-boss[data-motif="chimera"][data-moment="ko"] .lg-chimera-wingR { animation: lgrChimeraKoSink 2300ms ease-out both }
`,
}
