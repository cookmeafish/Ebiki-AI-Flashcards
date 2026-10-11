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
/* THE DRAWING'S OWN PARTS (raids/chimera.svg lg-chimera-*). Each part carries its pivot inline (transform-box:
   view-box, origin at its joint): the lion's head at the seam of its mane on the chest, the goat and the serpent at the
   roots of their necks, the paws at the shoulders, the body at its feet; only the jaw pivots on its own top edge. Lion
   head moves are tilts and swells on that seam (it never slides off its neck); anything that travels moves the body.
   Ability rules carry a doubled class (.lg-boss.lg-boss) so they win over a plain strike moment on the same part. */
/* Its attack on the player (impact/AssaultFx: a pounce, then claw rakes across the screen): the beast drops low, then
   lunges at you with the lion's jaws wide and snaps them on your heart, while the right paw rakes down. */
@keyframes lgrChimeraAsBody { 0% { transform: none } 16% { transform: translateY(5px) scaleY(.94) } 40% { transform: translateY(-2px) } 60% { transform: translateY(1px) } 100% { transform: none } }
@keyframes lgrChimeraAsHead { 0% { transform: none } 16% { transform: rotate(-3deg) scale(.92) } 40% { transform: rotate(2deg) scale(1.12) } 56% { transform: scale(1.09) } 80% { transform: scale(1.04) } 100% { transform: none } }
@keyframes lgrChimeraAsJaw { 0% { transform: none } 16% { transform: scaleY(.5) } 36% { transform: scaleY(1.8) scaleX(1.1) } 46% { transform: scaleY(.55) } 70% { transform: scaleY(.85) } 100% { transform: none } }
@keyframes lgrChimeraAsRake { 0% { transform: none } 20% { transform: rotate(18deg) } 44% { transform: rotate(-22deg) } 62% { transform: rotate(-14deg) } 100% { transform: none } }
@keyframes lgrChimeraAsBrace { 0% { transform: none } 20% { transform: rotate(-6deg) } 50% { transform: rotate(5deg) } 100% { transform: none } }
.lg-boss[data-motif="chimera"][data-assault-on] .lg-chimera-body { animation: lgrChimeraAsBody 800ms cubic-bezier(.45,0,.2,1) both }
.lg-boss[data-motif="chimera"][data-assault-on] .lg-chimera-head { animation: lgrChimeraAsHead 800ms cubic-bezier(.45,0,.2,1) both }
.lg-boss[data-motif="chimera"][data-assault-on] .lg-chimera-jaw { animation: lgrChimeraAsJaw 800ms cubic-bezier(.45,0,.2,1) both }
.lg-boss[data-motif="chimera"][data-assault-on] .lg-chimera-pawR { animation: lgrChimeraAsRake 800ms cubic-bezier(.5,0,.2,1) both }
.lg-boss[data-motif="chimera"][data-assault-on] .lg-chimera-pawL { animation: lgrChimeraAsBrace 800ms ease-out both }
/* A head falls: THAT head is struck down in the drawing (it snaps back, then slumps and hangs, its eyes shut by the
   lg-fx-fall* layer) while the other two rear up in rage. */
@keyframes lgrChimeraLionFall { 0% { transform: none } 10% { transform: rotate(-8deg) scale(1.04) } 30% { transform: rotate(11deg) scale(.88) } 70% { transform: rotate(9deg) scale(.9) } 100% { transform: none } }
@keyframes lgrChimeraJawHang { 0% { transform: none } 30%, 70% { transform: scaleY(1.45) rotate(6deg) } 100% { transform: none } }
@keyframes lgrChimeraGoatFall { 0% { transform: none } 10% { transform: rotate(-6deg) } 30% { transform: rotate(18deg) translateY(12px) scale(.88) } 70% { transform: rotate(15deg) translateY(10px) scale(.9) } 100% { transform: none } }
@keyframes lgrChimeraSerpentFall { 0% { transform: none } 10% { transform: rotate(8deg) } 30% { transform: rotate(-20deg) translateY(10px) scale(.84) } 70% { transform: rotate(-17deg) translateY(8px) scale(.86) } 100% { transform: none } }
@keyframes lgrChimeraRage { 0% { transform: none } 14% { transform: scale(1.02) } 30% { transform: rotate(-3deg) } 50% { transform: rotate(3deg) } 100% { transform: none } }
.lg-boss.lg-boss[data-fx="fallLion"] .lg-chimera-head { animation: lgrChimeraLionFall 1150ms cubic-bezier(.3,0,.3,1) both }
.lg-boss.lg-boss[data-fx="fallLion"] .lg-chimera-jaw { animation: lgrChimeraJawHang 1150ms ease-out both }
.lg-boss.lg-boss[data-fx="fallLion"] .lg-chimera-goat, .lg-boss.lg-boss[data-fx="fallLion"] .lg-chimera-serpent { animation: lgrChimeraRage 1150ms ease-out both }
.lg-boss.lg-boss[data-fx="fallGoat"] .lg-chimera-goat { animation: lgrChimeraGoatFall 1150ms cubic-bezier(.3,0,.3,1) both }
.lg-boss.lg-boss[data-fx="fallGoat"] .lg-chimera-head, .lg-boss.lg-boss[data-fx="fallGoat"] .lg-chimera-serpent { animation: lgrChimeraRage 1150ms ease-out both }
.lg-boss.lg-boss[data-fx="fallSerpent"] .lg-chimera-serpent { animation: lgrChimeraSerpentFall 1150ms cubic-bezier(.3,0,.3,1) both }
.lg-boss.lg-boss[data-fx="fallSerpent"] .lg-chimera-head, .lg-boss.lg-boss[data-fx="fallSerpent"] .lg-chimera-goat { animation: lgrChimeraRage 1150ms ease-out both }
/* Goat block: the Goat swings its horns down in front of the others and takes the blow, braced; they duck. */
@keyframes lgrChimeraGoatGuard { 0% { transform: none } 18% { transform: rotate(-22deg) translateY(10px) } 34% { transform: rotate(-19deg) translateY(12px) scale(1.02, .97) } 60% { transform: rotate(-21deg) translateY(11px) } 100% { transform: none } }
@keyframes lgrChimeraDuck { 0% { transform: none } 18%, 60% { transform: scale(.93) } 100% { transform: none } }
.lg-boss.lg-boss[data-fx="goatBlock"] .lg-chimera-goat { animation: lgrChimeraGoatGuard 760ms cubic-bezier(.3,0,.2,1) both }
.lg-boss.lg-boss[data-fx="goatBlock"] .lg-chimera-head, .lg-boss.lg-boss[data-fx="goatBlock"] .lg-chimera-serpent { animation: lgrChimeraDuck 760ms ease-out both }
/* Aim: the head you aim at leans out and bares itself at you. Maul: that head is struck and snaps back. */
@keyframes lgrChimeraAimLean { 0%, 100% { transform: none } 40% { transform: scale(1.04) translateY(2px) } 70% { transform: scale(1.02) translateY(1px) } }
@keyframes lgrChimeraMauled { 0%, 100% { transform: none } 25% { transform: rotate(-9deg) scale(.88) } 60% { transform: rotate(4deg) } }
.lg-boss.lg-boss[data-fx="aim"]:not([data-ab-aim="1"]):not([data-ab-aim="2"]) .lg-chimera-head, .lg-boss.lg-boss[data-fx="aim"][data-ab-aim="1"] .lg-chimera-goat, .lg-boss.lg-boss[data-fx="aim"][data-ab-aim="2"] .lg-chimera-serpent { animation: lgrChimeraAimLean 340ms cubic-bezier(.22,1,.36,1) both }
.lg-boss.lg-boss[data-fx="maul"]:not([data-ab-aim="1"]):not([data-ab-aim="2"]) .lg-chimera-head, .lg-boss.lg-boss[data-fx="maul"][data-ab-aim="1"] .lg-chimera-goat, .lg-boss.lg-boss[data-fx="maul"][data-ab-aim="2"] .lg-chimera-serpent { animation: lgrChimeraMauled 340ms cubic-bezier(.2,.8,.3,1) both }
/* THE KNOCKOUT (data-moment="ko", 2300 ms, climax at 1400 = 61%): three last roars, Lion (280 ms), Goat (630),
   Serpent (980), each head rearing as its roar ring goes out; at the climax all three drop at once: the lion's head
   slumps on its chest with the jaw hanging, the goat's neck sinks behind the shoulder, the serpent falls limp to the
   side, the forepaws give way, the body sinks, and every eye shuts. data-down HOLDS that fallen pose afterwards
   (each held value = the last keyframe), so nothing snaps back to the idle when the moment ends. */
@keyframes lgrChimeraKoLion { 0% { transform: none } 12%, 20% { transform: rotate(-4deg) scale(1.12) } 30%, 56% { transform: scale(1.02) } 64% { transform: rotate(13deg) scale(.86) } 72% { transform: rotate(10deg) scale(.89) } 100% { transform: rotate(11deg) scale(.88) } }
@keyframes lgrChimeraKoJaw { 0% { transform: none } 12%, 20% { transform: scaleY(1.9) } 30%, 58% { transform: scaleY(1.1) } 66%, 100% { transform: scaleY(1.35) rotate(7deg) } }
@keyframes lgrChimeraKoGoat { 0%, 22% { transform: none } 28%, 36% { transform: rotate(-4deg) translateY(2px) } 46%, 56% { transform: rotate(-1deg) translateY(1px) } 64% { transform: rotate(18deg) translateY(16px) scale(.84) } 72% { transform: rotate(14deg) translateY(13px) scale(.86) } 100% { transform: rotate(15deg) translateY(14px) scale(.85) } }
@keyframes lgrChimeraKoSerpent { 0%, 37% { transform: none } 43%, 52% { transform: rotate(9deg) scale(1.05) } 58% { transform: rotate(4deg) } 64% { transform: rotate(-21deg) translateY(12px) scale(.8) } 72% { transform: rotate(-16deg) translateY(10px) scale(.82) } 100% { transform: rotate(-18deg) translateY(11px) scale(.81) } }
@keyframes lgrChimeraKoSink { 0%, 58% { transform: none } 64% { transform: translateY(-3px) scaleY(.94) } 72% { transform: translateY(-7px) scaleY(.975) } 100% { transform: translateY(-6px) scaleY(.965) } }
@keyframes lgrChimeraKoPawL { 0%, 58% { transform: none } 66%, 100% { transform: rotate(7deg) } }
@keyframes lgrChimeraKoPawR { 0%, 58% { transform: none } 66%, 100% { transform: rotate(-7deg) } }
@keyframes lgrChimeraKoArmL { 0%, 58% { transform: none } 66% { transform: rotate(-84deg) } 74% { transform: rotate(-74deg) } 100% { transform: rotate(-78deg) } }
@keyframes lgrChimeraKoArmL2 { 0%, 58% { transform: none } 66% { transform: rotate(-24deg) } 74% { transform: rotate(-19deg) } 100% { transform: rotate(-22deg) } }
@keyframes lgrChimeraKoArmR { 0%, 58% { transform: none } 66% { transform: rotate(84deg) } 74% { transform: rotate(74deg) } 100% { transform: rotate(78deg) } }
@keyframes lgrChimeraKoEyesOpen { 0%, 60% { opacity: 1 } 63%, 100% { opacity: 0 } }
@keyframes lgrChimeraKoEyesShut { 0%, 60% { opacity: 0 } 63%, 100% { opacity: 1 } }
.lg-boss[data-motif="chimera"][data-moment="ko"] .lg-chimera-head { animation: lgrChimeraKoLion 2300ms linear both }
.lg-boss[data-motif="chimera"][data-moment="ko"] .lg-chimera-jaw { animation: lgrChimeraKoJaw 2300ms linear both }
.lg-boss[data-motif="chimera"][data-moment="ko"] .lg-chimera-goat { animation: lgrChimeraKoGoat 2300ms linear both }
.lg-boss[data-motif="chimera"][data-moment="ko"] .lg-chimera-serpent { animation: lgrChimeraKoSerpent 2300ms linear both }
.lg-boss[data-motif="chimera"][data-moment="ko"] .lg-chimera-body { animation: lgrChimeraKoSink 2300ms ease-out both }
.lg-boss[data-motif="chimera"][data-moment="ko"] .lg-p1 .lg-chimera-pawL { animation: lgrChimeraKoPawL 2300ms ease-out both }
.lg-boss[data-motif="chimera"][data-moment="ko"] :is(.lg-p1, .lg-p2) .lg-chimera-pawR { animation: lgrChimeraKoPawR 2300ms ease-out both }
.lg-boss[data-motif="chimera"][data-moment="ko"] :is(.lg-p2, .lg-p3) .lg-chimera-pawL { animation: lgrChimeraKoArmL 2300ms ease-out both }
.lg-boss[data-motif="chimera"][data-moment="ko"] .lg-p3 .lg-chimera-pawR { animation: lgrChimeraKoArmR 2300ms ease-out both }
.lg-boss[data-motif="chimera"][data-moment="ko"] .lg-p12 .lg-chimera-pawL { animation: lgrChimeraKoArmL2 2300ms ease-out both }
.lg-boss[data-motif="chimera"][data-moment="ko"] [class*="lg-abh-"] { animation: lgrChimeraKoEyesOpen 2300ms linear both }
.lg-boss[data-motif="chimera"][data-moment="ko"] [class*="lg-ab-"][class*="-down-1"] { display: inline !important; animation: lgrChimeraKoEyesShut 2300ms linear both }
.lg-boss[data-motif="chimera"][data-down]:not([data-moment="ko"]) .lg-chimera-head { transform: rotate(11deg) scale(.88) }
.lg-boss[data-motif="chimera"][data-down]:not([data-moment="ko"]) .lg-chimera-jaw { transform: scaleY(1.35) rotate(7deg) }
.lg-boss[data-motif="chimera"][data-down]:not([data-moment="ko"]) .lg-chimera-goat { transform: rotate(15deg) translateY(14px) scale(.85) }
.lg-boss[data-motif="chimera"][data-down]:not([data-moment="ko"]) .lg-chimera-serpent { transform: rotate(-18deg) translateY(11px) scale(.81) }
.lg-boss[data-motif="chimera"][data-down]:not([data-moment="ko"]) .lg-chimera-body { transform: translateY(-6px) scaleY(.965) }
.lg-boss[data-motif="chimera"][data-down]:not([data-moment="ko"]) .lg-p1 .lg-chimera-pawL { transform: rotate(7deg) }
.lg-boss[data-motif="chimera"][data-down]:not([data-moment="ko"]) :is(.lg-p1, .lg-p2) .lg-chimera-pawR { transform: rotate(-7deg) }
.lg-boss[data-motif="chimera"][data-down]:not([data-moment="ko"]) :is(.lg-p2, .lg-p3) .lg-chimera-pawL { transform: rotate(-78deg) }
.lg-boss[data-motif="chimera"][data-down]:not([data-moment="ko"]) .lg-p3 .lg-chimera-pawR { transform: rotate(78deg) }
.lg-boss[data-motif="chimera"][data-down]:not([data-moment="ko"]) .lg-p12 .lg-chimera-pawL { transform: rotate(-22deg) }
.lg-boss[data-motif="chimera"][data-down]:not([data-moment="ko"]) [class*="lg-abh-"] { opacity: 0 }
.lg-boss[data-motif="chimera"][data-down]:not([data-moment="ko"]) [class*="lg-ab-"][class*="-down-1"] { display: inline !important }
/* A FALLEN HEAD (the Three Heads ability, data-ab-<head>-down="1") stays part of the look: it slumps on its neck with
   its jaw shut and its eyes crossed out (the SVG's lg-ab-<head>-down-1 layers) and its power gone, while the live heads
   carry the phase. Individual transform properties, so every moment, fall and knockout (which animate transform) play
   on top of the slump. */
.lg-boss[data-motif="chimera"] .lg-chimera-head, .lg-boss[data-motif="chimera"] .lg-chimera-goat, .lg-boss[data-motif="chimera"] .lg-chimera-serpent { transition: rotate 500ms ease-out, translate 500ms ease-out, scale 500ms ease-out }
.lg-boss[data-motif="chimera"][data-ab-lion-down="1"] .lg-chimera-head { rotate: 6deg; scale: .92 }
.lg-boss[data-motif="chimera"][data-ab-goat-down="1"] .lg-chimera-goat { rotate: 9deg; translate: 0 13px; scale: .88 }
.lg-boss[data-motif="chimera"][data-ab-serpent-down="1"] .lg-chimera-serpent { rotate: -14deg; translate: 0 9px; scale: .86 }
.lg-boss[data-motif="chimera"][data-ab-goat-down="1"] .lg-p3 .lg-chimera-goat { rotate: 7deg; translate: 0 7px; scale: .88 }
`,
}
