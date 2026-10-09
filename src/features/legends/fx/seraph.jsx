// What the Seraph's Verdicts (abilities/seraph.js) LOOK like. The fx contract is in fx/index.js, the juice in
// fx/_juice.js. Colors are fixed (gold judgment, white mercy, ember wrath) with a white-hot core, so they read over any
// palette. Every verdict shows the SCALES OF JUDGMENT (a ghostly gold balance in front of the Judge): wrath tips them
// to the flame, mercy swings them and lets them settle level (spared), grace tips them to the feather.
//   wrath (big): a pillar of golden light slams down through the boss under a crown of falling spears; the halo blazes
//                ember gold, the wings snap up, the true-form wheel lurches a turn.
//   mercy (big): white feathers burst from the boss and drift toward your hearts; a soft halo; the wings fold in like
//                a shelter, the halo glows white, the wheel turns back.
//   grace (big): heaven opens: a column of holy light descends onto the Judge, a crown of turning rays flares round
//                its halo, feathers and gold motes drift through the light, a soft shockwave lands; the Judge rises
//                and settles, its wings spread, every red eye (the great eye and the wing eyes) turns GOLD and
//                opens wide, the halo flares, the true-form wheel turns forward. Serene, judging, never angry.
// Boss reactions (body: .lgr-seraph-<key>): Smite (jolted up, slammed down), Bow (a slow forgiving bow), Ascend (a
// serene rise and settle). The face layers are the art's lg-fx-<key> layers; the real parts move through the hook
// classes in raids/seraph.svg (lgs-wing, lgs-eye, lgs-halo0, lgs-halo2, lgs-wheel: see the css below).
import { anim, around, ring, shards } from './_kit'

const GOLD = '#ffd23f'
const GOLD_HOT = '#fff4b8'
const WHITE = '#ffffff'
const EMBER = '#ff7a1a'
const MERCY = '#cfe7ff'
const INK = '#2a1a00' // the dark rim that keeps the gold scales readable inside the light
const FEATHER = 'radial-gradient(ellipse at 40% 30%, #ffffff 0%, #f8fbff 60%, #dcebff 100%)'
const GOLD_FEATHER = 'radial-gradient(ellipse at 40% 30%, #ffffff 0%, #fff6d6 50%, #ffd97a 100%)'
const STAR = 'polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%)'

// One feather: an asymmetric vane with two notches and a quill line (a pill shape read as a pill, not a feather).
const VANE = "path('M7 0 C12 5 13 14 10 22 L11.5 23 L9 24.5 C8 27 7.5 29 7 30 C6 26.5 3.5 22 1.5 17.5 L4 17 L1 13.5 C0 8 2.5 3 7 0 Z')"
const feather = (key, style, fill = FEATHER) => (
  <div key={key} className="lgx" style={{ width: 14, height: 30, filter: `drop-shadow(0 0 3px ${fill === FEATHER ? '#ffffff' : GOLD})`, ...style }}>
    <div style={{ position: 'absolute', inset: 0, clipPath: VANE, background: fill }}>
      <div style={{ position: 'absolute', left: '50%', top: '8%', bottom: '4%', width: 1.5, marginLeft: -0.75, background: fill === FEATHER ? '#a9c4ea' : '#d9a640' }} />
    </div>
  </div>
)

// The scales of judgment: a ghostly gold balance in front of the Judge's chest. The left pan holds a white feather
// (mercy), the right a flame (wrath). `verdict` picks the motion: 'wrath' tips right, 'grace' tips left, 'mercy' swings
// and settles level. The beam turns about its pivot; the pans ride up and down with the beam's ends (they stay level).
const TILT = { wrath: 14, grace: -14, mercy: 0 }
const scales = (verdict, delay = 120) => {
  const tilt = TILT[verdict] || 0
  const dy = (36 * Math.sin((tilt * Math.PI) / 180)).toFixed(2) // how far each pan moves with the beam's end
  const glow = verdict === 'wrath' ? EMBER : verdict === 'mercy' ? MERCY : GOLD
  const vars = { '--tilt': `${tilt}deg`, '--dy': `${dy}px`, '--ndy': `${-dy}px` }
  const name = verdict === 'mercy' ? 'Level' : 'Tip'
  return (
    <div key="scales" className="lgx" style={{ left: '50%', top: '50%', width: '66%', marginLeft: '-33%', marginTop: '-16%', filter: `drop-shadow(0 0 .8px ${INK}) drop-shadow(0 0 .8px ${INK}) drop-shadow(0 0 6px ${glow})`, animation: anim('lgrSeraphScalesIn', 1150, delay) }}>
      <svg viewBox="0 0 100 70" width="100%" style={{ display: 'block', overflow: 'visible' }}>
        {/* the post, the base and the orb at the top */}
        <path d="M50 14 L50 62 M38 63 Q50 57 62 63 Z" fill="none" stroke={GOLD} strokeWidth="3" strokeLinecap="round" />
        <circle cx="50" cy="10" r="3.2" fill={GOLD_HOT} stroke={GOLD} strokeWidth="1.2" />
        {/* the beam */}
        <g style={{ ...vars, transformBox: 'view-box', transformOrigin: '50px 16px', animation: anim(`lgrSeraphBeam${name}`, 1000, delay + 150, 'cubic-bezier(.34,1.3,.5,1)') }}>
          <path d="M14 16 L86 16" stroke={GOLD} strokeWidth="3.4" strokeLinecap="round" />
          <circle cx="14" cy="16" r="1.8" fill={GOLD_HOT} /><circle cx="86" cy="16" r="1.8" fill={GOLD_HOT} />
        </g>
        {/* the mercy pan (left): its feather */}
        <g style={{ ...vars, '--pdy': 'var(--ndy)', '--side': -1, animation: anim(`lgrSeraphPan${name}`, 1000, delay + 150, 'cubic-bezier(.34,1.3,.5,1)') }}>
          <path d="M14 16 L5 38 M14 16 L23 38" stroke={GOLD_HOT} strokeWidth="1.2" />
          <path d="M3 38 Q14 47 25 38 Z" fill="rgba(255,236,150,.85)" stroke={GOLD} strokeWidth="2" />
          <path d="M10 37 Q13 27 19 25 Q17 32 10 37 Z" fill={WHITE} stroke="#a9c4ea" strokeWidth=".6" />
        </g>
        {/* the wrath pan (right): its flame */}
        <g style={{ ...vars, '--pdy': 'var(--dy)', '--side': 1, animation: anim(`lgrSeraphPan${name}`, 1000, delay + 150, 'cubic-bezier(.34,1.3,.5,1)') }}>
          <path d="M86 16 L77 38 M86 16 L95 38" stroke={GOLD_HOT} strokeWidth="1.2" />
          <path d="M75 38 Q86 47 97 38 Z" fill="rgba(255,236,150,.85)" stroke={GOLD} strokeWidth="2" />
          <path d="M86 37 Q80 32 84 27 Q85 31 87 29 Q88 25 86 22 Q93 28 90 34 Q89 37 86 37 Z" fill={EMBER} stroke="#ffd23f" strokeWidth=".6" />
        </g>
      </svg>
    </div>
  )
}

// A crown of turning rays round the halo (the head in phases 1 and 2, the heart of the wheel in phase 3: .lgrs-head).
const crown = (color, core, delay = 0, ms = 1150) => (
  <div key="crown" className="lgx lgrs-head" style={{ width: '74%', aspectRatio: '1', marginLeft: '-37%', marginTop: '-37%', borderRadius: '50%',
    background: `repeating-conic-gradient(from 0deg, ${color} 0deg 3deg, rgba(255,255,255,0) 6deg 24deg)`,
    WebkitMaskImage: 'radial-gradient(circle, transparent 0 34%, #000 40% 58%, transparent 72%)', maskImage: 'radial-gradient(circle, transparent 0 34%, #000 40% 58%, transparent 72%)',
    filter: `drop-shadow(0 0 4px ${core})`, animation: anim('lgrSeraphCrown', ms, delay) }} />
)

// Keyframes that turn and scale an SVG group about (cx, cy) of ITS PARENT's user space without touching its own
// transform attribute (or the SMIL animating it): the individual translate / rotate / scale properties compose in
// front of it, with the pivot folded into translate (t = c - R S c). Frames: [percent, deg, scale, extra css].
const pivotKeyframes = (name, cx, cy, frames) => `@keyframes ${name} { ${frames.map(([p, deg = 0, s = 1, extra = '']) => {
  const r = (deg * Math.PI) / 180
  const x = cx - s * (Math.cos(r) * cx - Math.sin(r) * cy)
  const y = cy - s * (Math.sin(r) * cx + Math.cos(r) * cy)
  return `${p}% { translate: ${x.toFixed(2)}px ${y.toFixed(2)}px; rotate: ${deg}deg; scale: ${s}; ${extra} }`
}).join(' ')} }`
const NOGLOW = 'filter: none'
const HALO_GOLD = 'filter: brightness(1.5) drop-shadow(0 0 2px #ffd23f)'
const HALO_EMBER = 'filter: brightness(1.7) saturate(1.6) drop-shadow(0 0 3px #ff7a1a)'
const HALO_WHITE = 'filter: brightness(1.4) drop-shadow(0 0 2px #ffffff)'
const HALO_FRAMES = (glow, s) => [[0, 0, 1, NOGLOW], [25, 0, s, glow], [60, 0, s * 0.97, glow], [100, 0, 1, NOGLOW]]
const PIVOT_CSS = [
  // phase 1's halo pivots on its own origin; phase 2's halo on (60, 36); phase 3's wheel of wings on (60, 58)
  pivotKeyframes('lgrSeraphHaloGrace0', 0, 0, HALO_FRAMES(HALO_GOLD, 1.12)),
  pivotKeyframes('lgrSeraphHaloGrace2', 60, 36, HALO_FRAMES(HALO_GOLD, 1.1)),
  pivotKeyframes('lgrSeraphHaloWrath0', 0, 0, HALO_FRAMES(HALO_EMBER, 1.16)),
  pivotKeyframes('lgrSeraphHaloWrath2', 60, 36, HALO_FRAMES(HALO_EMBER, 1.14)),
  pivotKeyframes('lgrSeraphHaloMercy0', 0, 0, HALO_FRAMES(HALO_WHITE, 1.06)),
  pivotKeyframes('lgrSeraphHaloMercy2', 60, 36, HALO_FRAMES(HALO_WHITE, 1.05)),
  pivotKeyframes('lgrSeraphWheelGrace', 60, 58, [[0, 0, 1, NOGLOW], [15, 8, 1.03, HALO_GOLD], [30, 16, 1.06, HALO_GOLD], [45, 24, 1.06, HALO_GOLD], [60, 30, 1.05, HALO_GOLD], [75, 34, 1.03, HALO_GOLD], [90, 36, 1.01], [100, 36, 1, NOGLOW]]),
  pivotKeyframes('lgrSeraphWheelWrath', 60, 58, [[0, 0, 1, NOGLOW], [10, -10, 1.05, HALO_EMBER], [20, 20, 1.08, HALO_EMBER], [30, 50, 1.06, HALO_EMBER], [40, 75, 1.04, HALO_EMBER], [55, 100, 1.02, HALO_EMBER], [70, 112, 1, HALO_EMBER], [85, 118, 1], [100, 120, 1, NOGLOW]]),
  pivotKeyframes('lgrSeraphWheelMercy', 60, 58, [[0, 0, 1, NOGLOW], [20, -6, 1, HALO_WHITE], [40, -14, 1, HALO_WHITE], [60, -20, 1, HALO_WHITE], [80, -23, 1], [100, -24, 1, NOGLOW]]),
].join('\n')

// THE DRAWING ACTS EVERY MOMENT (impact/bosses/README.md): the arena's data-moment (a plain strike moment),
// data-assault-on (its judgment on the player) and data-fx (its ability) move the real parts. The lgs-* hooks keep
// their own SMIL, so they move by the individual rotate / scale properties (as above); the wrapped parts
// (lg-seraph-head, the scale-bearing arms armL/armR, the staff hands handL/handR, phase 3's cage ring) have no SMIL of
// their own and take a plain transform about the shoulder or neck. Every move ends on the drawn pose.
const P = '.lg-boss[data-motif="seraph"]'
const PARTS_CSS = [
  // the halos and the phase 3 wheel turn about their own centers (pivotKeyframes)
  pivotKeyframes('lgrSeraphMHalo2Hit', 60, 36, [[0, 0, 1], [14, -8, 0.92], [40, 4, 1.03], [100, 0, 1]]),
  pivotKeyframes('lgrSeraphMWheelHit', 60, 58, [[0, 0, 1], [14, -10, 0.95], [44, 4, 1.02], [100, 0, 1]]),
  pivotKeyframes('lgrSeraphMWheelCrit', 60, 58, [[0, 0, 1], [14, 40, 0.9, 'filter: brightness(1.5)'], [40, -12, 1.05], [70, 4, 1], [100, 0, 1, 'filter: none']]),
  pivotKeyframes('lgrSeraphMWheelCut', 60, 58, [[0, 0, 1], [10, -24, 0.94], [40, 6, 1.02], [100, 0, 1]]),
  pivotKeyframes('lgrSeraphMWheelBlow', 60, 58, [[0, 0, 1], [13, -30, 0.9], [24, 70, 1.22, 'filter: brightness(1.6) drop-shadow(0 0 3px #ffb300)'], [50, 84, 1.16, 'filter: brightness(1.3)'], [100, 90, 1, 'filter: none']]),
  pivotKeyframes('lgrSeraphMWheelHeavy', 60, 58, [[0, 0, 1], [18, -40, 0.86], [32, 150, 1.32, 'filter: brightness(1.8) drop-shadow(0 0 4px #ff7a1a)'], [60, 170, 1.2, 'filter: brightness(1.3)'], [100, 180, 1, 'filter: none']]),
  pivotKeyframes('lgrSeraphMWheelBlock', 60, 58, [[0, 0, 1], [10, 30, 1.12], [28, -26, 0.9], [56, 6, 1], [100, 0, 1]]),
  pivotKeyframes('lgrSeraphMWheelShield', 60, 58, [[0, 0, 1], [16, 24, 1.1], [36, -40, 0.92], [62, -50, 0.96], [100, -60, 1]]),
  pivotKeyframes('lgrSeraphMWheelWind', 60, 58, [[0, 0, 1], [40, -12, 0.92, 'filter: brightness(.8) saturate(.7)'], [70, -16, 0.93, 'filter: brightness(.8) saturate(.7)'], [100, -20, 1, 'filter: none']]),
  pivotKeyframes('lgrSeraphMWheelKo', 60, 58, [[0, 0, 1], [20, 240, 1.15, 'filter: brightness(1.8)'], [45, 330, 1.05, 'filter: brightness(1.2)'], [62, 352, 0.88, 'filter: brightness(.7) saturate(.5)'], [80, 358, 0.92], [100, 360, 1, 'filter: none']]),
  pivotKeyframes('lgrSeraphMHalo2Blow', 60, 36, [[0, 0, 1], [13, 0, 0.9], [24, 0, 1.22, 'filter: brightness(1.7) drop-shadow(0 0 3px #ffb300)'], [55, 0, 1.12, 'filter: brightness(1.3)'], [100, 0, 1, 'filter: none']]),
  pivotKeyframes('lgrSeraphMHalo2Ko', 60, 36, [[0, 0, 1], [20, 0, 1.2, 'filter: brightness(1.8)'], [55, 14, 0.9, 'filter: brightness(.6) saturate(.4)'], [80, 10, 0.94], [100, 0, 1, 'filter: none']]),
].join('\n') + `
${P} .lg-seraph-head { transform-box: fill-box; transform-origin: 50% 92% }
${P} .lg-seraph-armL { transform-box: view-box; transform-origin: 46px 56px }
${P} .lg-seraph-armR { transform-box: view-box; transform-origin: 74px 56px }
${P} .lg-seraph-handL { transform-box: view-box; transform-origin: 44px 80px }
${P} .lg-seraph-handR { transform-box: view-box; transform-origin: 76px 80px }
${P}[data-phase="2"] .lg-seraph-handL { transform-origin: 44px 76px }
${P}[data-phase="2"] .lg-seraph-handR { transform-origin: 76px 76px }
${P} .lg-seraph-ring { transform-box: fill-box; transform-origin: 50% 50% }
/* HIT: the judge is rocked: the hood jerks back, the eye pinches, every wing flinches in, the scales jolt. */
@keyframes lgrSeraphMHitHead { 0% { transform: none } 12% { transform: translateY(-2px) rotate(-6deg) } 36% { transform: rotate(3deg) } 62% { transform: rotate(-1deg) } 100% { transform: none } }
@keyframes lgrSeraphMHitWing { 0%, 100% { rotate: 0deg } 12% { rotate: -8deg } 40% { rotate: 3deg } 64% { rotate: -1deg } }
@keyframes lgrSeraphMHitEye { 0%, 100% { scale: 1 } 12%, 40% { scale: 1.15 .3 } }
@keyframes lgrSeraphMHitArmL { 0%, 100% { transform: none } 14% { transform: rotate(-8deg) } 44% { transform: rotate(3deg) } }
@keyframes lgrSeraphMHitArmR { 0%, 100% { transform: none } 14% { transform: rotate(8deg) } 44% { transform: rotate(-3deg) } }
${P}[data-moment="hit"] .lg-seraph-head { animation: lgrSeraphMHitHead 520ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="hit"] .lgs-wing { animation: lgrSeraphMHitWing 560ms ease-out both }
${P}[data-moment="hit"] .lgs-eye { animation: lgrSeraphMHitEye 520ms ease-out both }
${P}[data-moment="hit"] .lg-seraph-armL { animation: lgrSeraphMHitArmL 520ms ease-out both }
${P}[data-moment="hit"] .lg-seraph-armR { animation: lgrSeraphMHitArmR 520ms ease-out both }
${P}[data-moment="hit"] .lgs-halo2 { animation: lgrSeraphMHalo2Hit 520ms ease-out both }
${P}[data-moment="hit"] .lgs-wheel { animation: lgrSeraphMWheelHit 520ms ease-out both }
/* CRITICAL: the wings are blasted wide and shudder, the hood whips aside, both scale-arms fly up, the wheel lurches. */
@keyframes lgrSeraphMCritWing { 0% { rotate: 0deg } 12% { rotate: 20deg } 22% { rotate: 14deg } 30% { rotate: 18deg } 40% { rotate: 12deg } 60% { rotate: 4deg } 100% { rotate: 0deg } }
@keyframes lgrSeraphMCritHead { 0% { transform: none } 12% { transform: translateX(3px) rotate(14deg) scale(.94) } 34% { transform: translateX(-1px) rotate(-7deg) } 58% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgrSeraphMCritArmL { 0%, 100% { transform: none } 14% { transform: rotate(24deg) } 42% { transform: rotate(-6deg) } 66% { transform: rotate(3deg) } }
@keyframes lgrSeraphMCritArmR { 0%, 100% { transform: none } 14% { transform: rotate(-24deg) } 42% { transform: rotate(6deg) } 66% { transform: rotate(-3deg) } }
@keyframes lgrSeraphMCritEye { 0%, 100% { scale: 1 } 10% { scale: 1.4 1.5 } 30%, 50% { scale: 1.2 .25 } }
${P}[data-moment="crit"] .lgs-wing { animation: lgrSeraphMCritWing 680ms ease-out both }
${P}[data-moment="crit"] .lg-seraph-head { animation: lgrSeraphMCritHead 640ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="crit"] .lg-seraph-armL { animation: lgrSeraphMCritArmL 640ms ease-out both }
${P}[data-moment="crit"] .lg-seraph-armR { animation: lgrSeraphMCritArmR 640ms ease-out both }
${P}[data-moment="crit"] .lgs-eye { animation: lgrSeraphMCritEye 640ms ease-out both }
${P}[data-moment="crit"] .lgs-wheel { animation: lgrSeraphMWheelCrit 680ms ease-out both }
${P}[data-moment="crit"] .lg-seraph-ring { animation: lgrSeraphMRingCrit 680ms ease-out both }
@keyframes lgrSeraphMRingCrit { 0%, 100% { transform: none } 14% { transform: rotate(-24deg) scale(1.06) } 44% { transform: rotate(8deg) } }
/* SHARPENED: the blade shears the hood along its line, clips the wings on one side and knocks the left staff down. */
@keyframes lgrSeraphMCutHead { 0% { transform: none } 10% { transform: skewX(-12deg) translateX(2px) } 26% { transform: skewX(8deg) } 46% { transform: skewX(-3deg) } 100% { transform: none } }
@keyframes lgrSeraphMCutWing { 0%, 100% { rotate: 0deg } 10% { rotate: -16deg } 34% { rotate: 4deg } 60% { rotate: -2deg } }
@keyframes lgrSeraphMCutHand { 0%, 100% { transform: none } 12% { transform: rotate(-20deg) translateY(2px) } 46% { transform: rotate(-6deg) } }
${P}[data-moment="sharpen"] .lg-seraph-head { animation: lgrSeraphMCutHead 600ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="sharpen"] .lgs-wing { animation: lgrSeraphMCutWing 600ms ease-out both }
${P}[data-moment="sharpen"] .lg-seraph-handL { animation: lgrSeraphMCutHand 600ms ease-out both }
${P}[data-moment="sharpen"] .lgs-wheel { animation: lgrSeraphMWheelCut 600ms ease-out both }
/* ITS JUDGMENT ON THE PLAYER (data-assault-on): the seraph mantles (wings rear wide, the right staff lifts, the eye
   narrows), then as the lance of light leaves it (impact/assault.js travelAt) it points the staff straight at you: the
   staff arm drives forward, the great eye blazes open, the wings snap in toward the camera and the halo flares; phase 3's
   wheel whips a quarter turn with its eye ablaze. */
@keyframes lgrSeraphMBlowWing { 0% { rotate: 0deg } 13% { rotate: 14deg } 24% { rotate: -14deg } 48% { rotate: -10deg } 100% { rotate: 0deg } }
@keyframes lgrSeraphMBlowEye { 0% { scale: 1 } 13% { scale: 1.1 .35 } 24% { scale: 1.5 1.7; filter: brightness(1.6) drop-shadow(0 0 2px #ffb300) } 52% { scale: 1.3 1.45; filter: brightness(1.3) } 100% { scale: 1; filter: none } }
@keyframes lgrSeraphMBlowHandR { 0% { transform: none } 13% { transform: rotate(-34deg) translateY(-3px) } 24% { transform: rotate(16deg) translate(4px, 3px) scale(1.4) } 52% { transform: rotate(12deg) translate(3px, 2px) scale(1.3) } 100% { transform: none } }
@keyframes lgrSeraphMBlowHandL { 0%, 100% { transform: none } 13% { transform: rotate(10deg) } 28% { transform: rotate(-8deg) scale(1.1) } }
@keyframes lgrSeraphMBlowHead { 0% { transform: none } 13% { transform: translateY(-2px) scale(.96) } 24% { transform: translateY(2px) scale(1.12) } 52% { transform: translateY(1px) scale(1.08) } 100% { transform: none } }
${P}[data-assault-on] .lgs-wing { animation: lgrSeraphMBlowWing 820ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-assault-on] .lgs-eye { animation: lgrSeraphMBlowEye 820ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-assault-on] .lg-seraph-handR { animation: lgrSeraphMBlowHandR 820ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-assault-on] .lg-seraph-handL { animation: lgrSeraphMBlowHandL 820ms ease-out both }
${P}[data-assault-on] .lg-seraph-head { animation: lgrSeraphMBlowHead 820ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-assault-on] .lgs-halo2 { animation: lgrSeraphMHalo2Blow 820ms ease-out both }
${P}[data-assault-on] .lgs-wheel { animation: lgrSeraphMWheelBlow 820ms cubic-bezier(.3,.7,.3,1) both }
/* ITS STRIKE (hurt, with the judgment above): the scales of judgment tip down hard on the guilty side. */
@keyframes lgrSeraphMTipL { 0%, 100% { transform: none } 18%, 55% { transform: rotate(-14deg) translateY(2px) } }
@keyframes lgrSeraphMTipR { 0%, 100% { transform: none } 18%, 55% { transform: rotate(-10deg) translateY(-2px) } }
${P}[data-moment="hurt"] .lg-seraph-armL { animation: lgrSeraphMTipL 720ms ease-in-out both }
${P}[data-moment="hurt"] .lg-seraph-armR { animation: lgrSeraphMTipR 720ms ease-in-out both }
${P}[data-moment="hurt"] .lg-seraph-ring { animation: lgrSeraphMRingCrit 720ms ease-out both }
/* ITS HEAVY BLOW (hurtBig): a full sentence: both staffs rise high and come down together, the wings open to their
   widest and slam forward, the hood rears and bows into it, the wheel spins half round ablaze. */
@keyframes lgrSeraphMHeavyHandL { 0% { transform: none } 18% { transform: rotate(40deg) translateY(-4px) } 32% { transform: rotate(-12deg) translateY(3px) scale(1.3) } 60% { transform: rotate(-8deg) translateY(2px) scale(1.2) } 100% { transform: none } }
@keyframes lgrSeraphMHeavyHandR { 0% { transform: none } 18% { transform: rotate(-40deg) translateY(-4px) } 32% { transform: rotate(12deg) translateY(3px) scale(1.3) } 60% { transform: rotate(8deg) translateY(2px) scale(1.2) } 100% { transform: none } }
@keyframes lgrSeraphMHeavyWing { 0% { rotate: 0deg } 18% { rotate: 22deg } 32% { rotate: -18deg } 60% { rotate: -12deg } 100% { rotate: 0deg } }
@keyframes lgrSeraphMHeavyHead { 0% { transform: none } 18% { transform: translateY(-4px) rotate(-5deg) } 32% { transform: translateY(3px) scale(1.14) } 60% { transform: translateY(2px) scale(1.08) } 100% { transform: none } }
${P}[data-moment="hurtBig"] .lg-seraph-handL, ${P}[data-assault-on][data-moment="hurtBig"] .lg-seraph-handL { animation: lgrSeraphMHeavyHandL 900ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-moment="hurtBig"] .lg-seraph-handR, ${P}[data-assault-on][data-moment="hurtBig"] .lg-seraph-handR { animation: lgrSeraphMHeavyHandR 900ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-moment="hurtBig"] .lgs-wing, ${P}[data-assault-on][data-moment="hurtBig"] .lgs-wing { animation: lgrSeraphMHeavyWing 900ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-moment="hurtBig"] .lg-seraph-head, ${P}[data-assault-on][data-moment="hurtBig"] .lg-seraph-head { animation: lgrSeraphMHeavyHead 900ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-moment="hurtBig"] .lgs-wheel, ${P}[data-assault-on][data-moment="hurtBig"] .lgs-wheel { animation: lgrSeraphMWheelHeavy 900ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-moment="hurtBig"] .lg-seraph-armL { animation: lgrSeraphMTipL 900ms ease-in-out both }
${P}[data-moment="hurtBig"] .lg-seraph-armR { animation: lgrSeraphMTipR 900ms ease-in-out both }
/* BLOCKED: the staff's thrust is turned: the right staff drives in and is knocked up and away, the hood jerks back and
   the wings flare to keep balance. */
@keyframes lgrSeraphMBlockHand { 0% { transform: none } 12% { transform: rotate(16deg) translate(3px, 3px) scale(1.3) } 30% { transform: rotate(-36deg) translateY(-4px) } 54% { transform: rotate(-20deg) } 100% { transform: none } }
@keyframes lgrSeraphMBlockHead { 0% { transform: none } 12% { transform: scale(1.06) } 30% { transform: translateY(-3px) rotate(-6deg) scale(.95) } 56% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgrSeraphMBlockWing { 0%, 100% { rotate: 0deg } 30% { rotate: 12deg } 56% { rotate: -3deg } }
${P}[data-moment="block"] .lg-seraph-handR { animation: lgrSeraphMBlockHand 640ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="block"] .lg-seraph-head { animation: lgrSeraphMBlockHead 640ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="block"] .lgs-wing { animation: lgrSeraphMBlockWing 640ms ease-out both }
${P}[data-moment="block"] .lgs-wheel { animation: lgrSeraphMWheelBlock 640ms ease-out both }
/* SAVED: its judgment rebounds off the shield: the wings wrap in to shelter it, the eye squeezes shut and the hood turns
   away, the staffs crossed before it. */
@keyframes lgrSeraphMShieldWing { 0%, 100% { rotate: 0deg } 18%, 60% { rotate: -18deg } }
@keyframes lgrSeraphMShieldEye { 0%, 100% { scale: 1 } 16%, 60% { scale: 1.1 .08 } }
@keyframes lgrSeraphMShieldHead { 0%, 100% { transform: none } 18%, 60% { transform: rotate(10deg) translateX(2px) scale(.95) } }
@keyframes lgrSeraphMShieldHandL { 0%, 100% { transform: none } 18%, 60% { transform: rotate(-26deg) } }
@keyframes lgrSeraphMShieldHandR { 0%, 100% { transform: none } 18%, 60% { transform: rotate(26deg) } }
${P}[data-moment="shield"] .lgs-wing { animation: lgrSeraphMShieldWing 760ms ease-in-out both }
${P}[data-moment="shield"] .lgs-eye { animation: lgrSeraphMShieldEye 760ms ease-in-out both }
${P}[data-moment="shield"] .lg-seraph-head { animation: lgrSeraphMShieldHead 760ms ease-in-out both }
${P}[data-moment="shield"] .lg-seraph-handL { animation: lgrSeraphMShieldHandL 760ms ease-in-out both }
${P}[data-moment="shield"] .lg-seraph-handR { animation: lgrSeraphMShieldHandR 760ms ease-in-out both }
${P}[data-moment="shield"] .lgs-wheel { animation: lgrSeraphMWheelShield 760ms ease-in-out both }
/* SECOND WIND: the judge falters: the wings sag, the hood bows, the scales hang slack, the wheel slows and dims. */
@keyframes lgrSeraphMWindWing { 0%, 100% { rotate: 0deg } 35%, 70% { rotate: -11deg } }
@keyframes lgrSeraphMWindHead { 0%, 100% { transform: none } 35%, 70% { transform: translateY(3px) rotate(6deg) scale(.96) } }
@keyframes lgrSeraphMWindArmL { 0%, 100% { transform: none } 35%, 70% { transform: rotate(-12deg) } }
@keyframes lgrSeraphMWindArmR { 0%, 100% { transform: none } 35%, 70% { transform: rotate(12deg) } }
${P}[data-moment="wind"] .lgs-wing { animation: lgrSeraphMWindWing 1000ms ease-in-out both }
${P}[data-moment="wind"] .lg-seraph-head { animation: lgrSeraphMWindHead 1000ms ease-in-out both }
${P}[data-moment="wind"] .lg-seraph-armL { animation: lgrSeraphMWindArmL 1000ms ease-in-out both }
${P}[data-moment="wind"] .lg-seraph-armR { animation: lgrSeraphMWindArmR 1000ms ease-in-out both }
${P}[data-moment="wind"] .lgs-wheel { animation: lgrSeraphMWheelWind 1000ms ease-in-out both }
/* KNOCKOUT (fall from grace): the wings flare wide in a last blaze and the eye opens to the sky, then the halo sinks and
   dims, the wings collapse inward, the hood bows to its chest, the staffs and scales drop, the wheel spins down; the
   parts settle as the box falls. */
@keyframes lgrSeraphMKoWing { 0% { rotate: 0deg } 18% { rotate: 22deg } 40% { rotate: 18deg } 62% { rotate: -24deg } 82% { rotate: -16deg } 100% { rotate: 0deg } }
@keyframes lgrSeraphMKoEye { 0% { scale: 1 } 18%, 40% { scale: 1.4 1.6 } 62%, 86% { scale: 1.1 .06 } 100% { scale: 1 } }
@keyframes lgrSeraphMKoHead { 0%, 40% { transform: none } 18% { transform: translateY(-3px) rotate(-6deg) } 62% { transform: translateY(5px) rotate(10deg) scale(.94) } 84% { transform: translateY(3px) rotate(6deg) } 100% { transform: none } }
@keyframes lgrSeraphMKoHandL { 0%, 40% { transform: none } 64% { transform: rotate(-26deg) translateY(5px) } 86% { transform: rotate(-14deg) translateY(3px) } 100% { transform: none } }
@keyframes lgrSeraphMKoHandR { 0%, 40% { transform: none } 64% { transform: rotate(26deg) translateY(5px) } 86% { transform: rotate(14deg) translateY(3px) } 100% { transform: none } }
@keyframes lgrSeraphMKoRing { 0% { transform: none } 50% { transform: rotate(60deg) scale(1.04) } 70% { transform: rotate(80deg) translateY(4px) scale(.94) } 100% { transform: none } }
${P}[data-moment="ko"] .lgs-wing { animation: lgrSeraphMKoWing 2300ms ease-in-out both }
${P}[data-moment="ko"] .lgs-eye { animation: lgrSeraphMKoEye 2300ms ease-in-out both }
${P}[data-moment="ko"] .lg-seraph-head { animation: lgrSeraphMKoHead 2300ms ease-in-out both }
${P}[data-moment="ko"] .lg-seraph-handL { animation: lgrSeraphMKoHandL 2300ms ease-in-out both }
${P}[data-moment="ko"] .lg-seraph-handR { animation: lgrSeraphMKoHandR 2300ms ease-in-out both }
${P}[data-moment="ko"] .lg-seraph-armL { animation: lgrSeraphMKoHandL 2300ms ease-in-out both }
${P}[data-moment="ko"] .lg-seraph-armR { animation: lgrSeraphMKoHandR 2300ms ease-in-out both }
${P}[data-moment="ko"] .lgs-halo2 { animation: lgrSeraphMHalo2Ko 2300ms ease-in-out both }
${P}[data-moment="ko"] .lgs-wheel { animation: lgrSeraphMWheelKo 2300ms ease-in-out both }
${P}[data-moment="ko"] .lg-seraph-ring { animation: lgrSeraphMKoRing 2300ms ease-in-out both }
/* ITS ABILITY, acted by the arms and hood too (the wings, eyes, halos and wheel move above).
   Wrath: both staffs smite down and the scales slam toward the flame. */
@keyframes lgrSeraphMWrathHand { 0%, 100% { transform: none } 16% { transform: rotate(var(--up)) translateY(-3px) } 30% { transform: rotate(var(--down)) translateY(3px) scale(1.2) } 60% { transform: rotate(var(--down)) translateY(2px) scale(1.12) } }
${P}[data-fx="wrath"] .lg-seraph-handL { --up: 34deg; --down: -10deg; animation: lgrSeraphMWrathHand 900ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-fx="wrath"] .lg-seraph-handR { --up: -34deg; --down: 10deg; animation: lgrSeraphMWrathHand 900ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-fx="wrath"] .lg-seraph-armL { animation: lgrSeraphMTipL 900ms ease-in-out both }
${P}[data-fx="wrath"] .lg-seraph-armR { animation: lgrSeraphMTipR 900ms ease-in-out both }
/* Mercy: the staffs lower, the scale-arms open level and low, the hood bows. */
@keyframes lgrSeraphMMercyHandL { 0%, 100% { transform: none } 35%, 75% { transform: rotate(-16deg) translateY(2px) } }
@keyframes lgrSeraphMMercyHandR { 0%, 100% { transform: none } 35%, 75% { transform: rotate(16deg) translateY(2px) } }
@keyframes lgrSeraphMMercyHead { 0%, 100% { transform: none } 35%, 75% { transform: translateY(2px) rotate(-5deg) } }
${P}[data-fx="mercy"] .lg-seraph-handL { animation: lgrSeraphMMercyHandL 1100ms ease-in-out both }
${P}[data-fx="mercy"] .lg-seraph-handR { animation: lgrSeraphMMercyHandR 1100ms ease-in-out both }
${P}[data-fx="mercy"] .lg-seraph-armL { animation: lgrSeraphMWindArmL 1100ms ease-in-out both }
${P}[data-fx="mercy"] .lg-seraph-armR { animation: lgrSeraphMWindArmR 1100ms ease-in-out both }
${P}[data-fx="mercy"] .lg-seraph-head { animation: lgrSeraphMMercyHead 1100ms ease-in-out both }
/* Grace: the arms rise open to the light, the hood lifts, the cage ring turns slowly. */
@keyframes lgrSeraphMGraceArmL { 0%, 100% { transform: none } 30%, 70% { transform: rotate(18deg) } }
@keyframes lgrSeraphMGraceArmR { 0%, 100% { transform: none } 30%, 70% { transform: rotate(-18deg) } }
@keyframes lgrSeraphMGraceHead { 0%, 100% { transform: none } 30%, 70% { transform: translateY(-3px) rotate(-3deg) scale(1.04) } }
${P}[data-fx="grace"] .lg-seraph-armL, ${P}[data-fx="grace"] .lg-seraph-handL { animation: lgrSeraphMGraceArmL 1150ms ease-in-out both }
${P}[data-fx="grace"] .lg-seraph-armR, ${P}[data-fx="grace"] .lg-seraph-handR { animation: lgrSeraphMGraceArmR 1150ms ease-in-out both }
${P}[data-fx="grace"] .lg-seraph-head { animation: lgrSeraphMGraceHead 1150ms ease-in-out both }
${P}[data-fx="grace"] .lg-seraph-ring { animation: lgrSeraphMKoRing 1150ms ease-in-out both }
`

export default {
  effects: {
    wrath: () => <>
      {/* the pillar: a white-hot core inside a gold column, slamming down from above the frame */}
      <div className="lgx" style={{ left: '50%', top: '-70%', width: '46%', height: '175%', marginLeft: '-23%', transformOrigin: 'top', borderRadius: '0 0 40% 40%', background: `linear-gradient(to right, rgba(255,210,63,0), ${GOLD} 22%, ${GOLD_HOT} 42%, ${WHITE} 50%, ${GOLD_HOT} 58%, ${GOLD} 78%, rgba(255,210,63,0))`, boxShadow: `0 0 40px ${GOLD}`, animation: anim('lgrSeraphPillar', 1000, 0, 'cubic-bezier(.22,1,.36,1)') }} />
      {/* the halo blazes into a crown of ember rays */}
      {crown('rgba(255,150,40,.95)', EMBER, 80, 1000)}
      {/* the crown of spears, falling in a fan */}
      {around(7, (i) => (
        <div key={i} className="lgx" style={{ left: `${20 + i * 10}%`, top: '-30%', width: 6, height: 62, marginLeft: -3, background: `linear-gradient(to bottom, ${WHITE}, ${GOLD})`, clipPath: 'polygon(50% 100%, 100% 22%, 70% 22%, 70% 0, 30% 0, 30% 22%, 0 22%)', filter: `drop-shadow(0 0 4px ${GOLD})`, '--x': `${(i - 3) * 6}px`, animation: anim('lgrSeraphSpear', 560, 60 + Math.abs(i - 3) * 45, 'cubic-bezier(.55,0,1,.45)') }} />
      ))}
      {/* the verdict: the scales slam toward the flame */}
      {scales('wrath', 60)}
      {/* the impact: a gold shockwave, sparks and rising embers */}
      {ring(GOLD, 330, 2, 6, 650)}
      {ring(WHITE, 380, 1.4, 3, 500)}
      {shards(14, GOLD, -110, 9)}
      {around(8, (i) => <div key={`e${i}`} className="lgx" style={{ left: `${30 + i * 6}%`, bottom: '6%', width: 5, height: 5, borderRadius: '50%', background: i % 2 ? EMBER : GOLD_HOT, boxShadow: `0 0 6px ${EMBER}`, '--h': `${-60 - (i % 3) * 20}px`, animation: anim('lgxRise', 800, 360 + (i % 4) * 60) }} />)}
    </>,
    mercy: () => <>
      <div className="lgx" style={{ left: '50%', top: '50%', width: '70%', height: '70%', marginLeft: '-35%', marginTop: '-35%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,.85) 0%, rgba(214,234,255,.45) 45%, rgba(255,255,255,0) 70%)', animation: anim('lgrSeraphHalo', 1100) }} />
      {/* a soft white crown round the halo */}
      {crown('rgba(235,245,255,.9)', MERCY, 60, 1100)}
      {ring(MERCY, 0, 1.9, 4, 900)}
      {/* the verdict: the scales swing and settle level: spared */}
      {scales('mercy', 80)}
      {around(10, (i, a) => feather(i, { left: '50%', top: '45%', '--a': `${a}deg`, '--d': `${70 + (i % 3) * 18}px`, animation: anim('lgrSeraphFeatherBurst', 1250, i * 25) }))}
      {/* two feathers settle toward the hearts (they sit to the right of the boss) */}
      {[0, 1].map((i) => feather(`h${i}`, { left: '55%', top: '40%', '--tx': `${150 + i * 18}px`, '--ty': `${36 + i * 10}px`, animation: anim('lgxToHearts', 1100, 250 + i * 120) }))}
    </>,
    grace: () => <>
      {/* heaven opens: a soft gold dawn above the Judge */}
      <div className="lgx" style={{ left: '-20%', right: '-20%', top: '-34%', height: '70%', background: 'radial-gradient(ellipse at 50% 0%, rgba(255,250,225,.95) 0%, rgba(255,226,130,.55) 35%, rgba(255,210,63,0) 70%)', animation: anim('lgrSeraphDawn', 1150) }} />
      {/* the column of holy light descends onto the Judge (from the top down), then widens and fades */}
      <div className="lgx" style={{ left: '50%', top: '-36%', width: '38%', height: '150%', marginLeft: '-19%', transformOrigin: 'top center', borderRadius: '0 0 50% 50% / 0 0 12% 12%',
        background: `linear-gradient(to right, rgba(255,240,180,0), rgba(255,236,160,.3) 16%, rgba(255,250,230,.5) 40%, rgba(255,255,255,.72) 50%, rgba(255,250,230,.5) 60%, rgba(255,236,160,.3) 84%, rgba(255,240,180,0))`,
        WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 70%, transparent 100%)', maskImage: 'linear-gradient(to bottom, #000 0%, #000 70%, transparent 100%)',
        boxShadow: `0 0 30px rgba(255,226,130,.7)`, animation: anim('lgrSeraphColumn', 1150, 40, 'cubic-bezier(.25,.9,.35,1)') }} />
      {/* thin rays streaming down inside the column */}
      {[-3, -1, 0, 1, 3].map((d, i) => <div key={`r${i}`} className="lgx" style={{ left: `calc(50% + ${d * 7}%)`, top: '-30%', width: d ? 2 : 3, height: '45%', marginLeft: -1, borderRadius: 2, background: `linear-gradient(to bottom, rgba(255,255,255,0), ${WHITE}, rgba(255,255,255,0))`, '--ry': '150%', animation: anim('lgrSeraphRay', 700, 120 + i * 70, 'ease-in') }} />)}
      {/* the crown of turning rays flares round the halo, a gold ring with it */}
      {crown('rgba(255,244,190,1)', GOLD, 300)}
      <div className="lgx lgrs-head" style={{ width: '46%', aspectRatio: '1', marginLeft: '-23%', marginTop: '-23%', borderRadius: '50%', border: `3px solid ${GOLD_HOT}`, boxShadow: `0 0 14px ${GOLD}, inset 0 0 10px ${GOLD}`, animation: anim('lgrSeraphHaloFlare', 900, 260) }} />
      {/* the verdict: the scales tip toward the feather */}
      {scales('grace', 320)}
      {/* feathers drift down through the light, swaying */}
      {[[30, 0, 14], [64, 90, -16], [44, 200, 18], [72, 300, -12], [24, 380, 10], [56, 470, -18]].map(([x, d, sx], i) => feather(`f${i}`, { left: `${x}%`, top: '-6%', width: 11, height: 24, '--sx': `${sx}px`, '--fy': `${110 + (i % 3) * 22}px`, animation: anim('lgrSeraphDrift', 1050 - (i % 2) * 120, 180 + d, 'ease-in-out') }, i % 2 ? GOLD_FEATHER : FEATHER))}
      {/* gold motes rise slowly in the column */}
      {around(12, (i) => <div key={`m${i}`} className="lgx" style={{ left: `${38 + ((i * 37) % 25)}%`, top: `${40 + ((i * 23) % 45)}%`, width: i % 3 ? 4 : 7, height: i % 3 ? 4 : 7, background: i % 3 ? GOLD_HOT : WHITE, borderRadius: i % 3 ? '50%' : 0, clipPath: i % 3 ? 'none' : STAR, boxShadow: i % 3 ? `0 0 6px ${GOLD}` : 'none', filter: i % 3 ? 'none' : `drop-shadow(0 0 3px ${GOLD})`, '--h': `${-34 - (i % 4) * 12}px`, animation: anim('lgxRise', 850, 300 + (i % 6) * 70) }} />)}
      {/* the light lands: a soft shockwave and a glow on the ground */}
      <div className="lgx" style={{ left: '50%', bottom: '2%', width: '90%', height: '16%', marginLeft: '-45%', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,250,225,.9) 0%, rgba(255,210,63,.45) 45%, rgba(255,210,63,0) 72%)', animation: anim('lgrSeraphPool', 900, 300) }} />
      {ring(GOLD_HOT, 340, 2.1, 3, 850)}
      {ring(WHITE, 420, 1.6, 2, 700)}
    </>,
  },
  floaters: { wrath: 'lg_fx_seraphWrath', mercy: 'lg_fx_seraphMercy', grace: 'lg_fx_seraphGrace' },
  floaterTone: { wrath: 'warning', mercy: 'ink', grace: 'warning' },
  demo: { mercy: { kind: 'block', damage: 0, lives: 0 }, grace: { kind: 'hit', damage: 3, lives: 0 }, wrath: { kind: 'hit', damage: 4, lives: 0 } },
  juice: {
    wrath: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'seraph.wrath' },
    mercy: { size: 'big', shake: 1, flash: 1, hitstop: 1, sfx: 'seraph.mercy' },
    grace: { size: 'big', shake: 1, flash: 1, hitstop: 1, sfx: 'seraph.grace' },
  },
  css: `
@keyframes lgrSeraphPillar { 0% { transform: scaleY(0); opacity: 0 } 12% { opacity: 1 } 30% { transform: scaleY(1); opacity: 1 } 70% { transform: scaleY(1) scaleX(1); opacity: 1 } 100% { transform: scaleY(1) scaleX(.15); opacity: 0 } }
@keyframes lgrSeraphSpear { 0% { transform: translate(var(--x), -60px); opacity: 0 } 20% { opacity: 1 } 80% { transform: translate(0, 120px); opacity: 1 } 100% { transform: translate(0, 128px) scaleY(.6); opacity: 0 } }
@keyframes lgrSeraphHalo { 0% { transform: scale(.3); opacity: 0 } 25% { transform: scale(1.05); opacity: 1 } 70% { opacity: .8 } 100% { transform: scale(1.25); opacity: 0 } }
@keyframes lgrSeraphFeatherBurst { 0% { transform: rotate(var(--a)) translateY(0) rotate(0); opacity: 0 } 10% { opacity: 1 } 35% { transform: rotate(var(--a)) translateY(calc(var(--d) * -1)) rotate(40deg) } 100% { transform: rotate(var(--a)) translateY(calc(var(--d) * -1)) translateX(14px) rotate(-30deg) translateY(50px); opacity: 0 } }

/* the scales of judgment: fade in, tip (or swing and settle level), fade out */
@keyframes lgrSeraphScalesIn { 0% { transform: translateY(8px) scale(.9); opacity: 0 } 18% { transform: none; opacity: .95 } 75% { opacity: .95 } 100% { transform: translateY(-4px); opacity: 0 } }
@keyframes lgrSeraphBeamTip { 0% { transform: rotate(0) } 22% { transform: rotate(calc(var(--tilt) * -.25)) } 55% { transform: rotate(var(--tilt)) } 75% { transform: rotate(calc(var(--tilt) * .85)) } 100% { transform: rotate(var(--tilt)) } }
@keyframes lgrSeraphPanTip { 0% { transform: translateY(0) } 22% { transform: translateY(calc(var(--pdy) * -.25)) } 55% { transform: translateY(var(--pdy)) } 75% { transform: translateY(calc(var(--pdy) * .85)) } 100% { transform: translateY(var(--pdy)) } }
@keyframes lgrSeraphBeamLevel { 0% { transform: rotate(0) } 20% { transform: rotate(12deg) } 42% { transform: rotate(-8deg) } 62% { transform: rotate(4deg) } 80% { transform: rotate(-1.5deg) } 100% { transform: rotate(0) } }
@keyframes lgrSeraphPanLevel { 0% { transform: translateY(0) } 20% { transform: translateY(calc(7.5px * var(--side))) } 42% { transform: translateY(calc(-5px * var(--side))) } 62% { transform: translateY(calc(2.5px * var(--side))) } 80% { transform: translateY(calc(-1px * var(--side))) } 100% { transform: translateY(0) } }

/* the crown of rays and the halo ring sit on the head (phases 1 and 2) or the wheel's heart (phase 3) */
.lgrs-head { left: 50%; top: 24% }
.lg-boss[data-phase="2"] .lgrs-head { top: 26% }
.lg-boss[data-phase="3"] .lgrs-head { top: 50% }
@keyframes lgrSeraphCrown { 0% { transform: rotate(0) scale(.5); opacity: 0 } 20% { opacity: 1 } 55% { transform: rotate(50deg) scale(1.08); opacity: 1 } 100% { transform: rotate(110deg) scale(1.2); opacity: 0 } }
@keyframes lgrSeraphHaloFlare { 0% { transform: scale(.6); opacity: 0 } 25% { transform: scale(1.05); opacity: 1 } 60% { transform: scale(1.12); opacity: .85 } 100% { transform: scale(1.4); opacity: 0 } }

/* grace: the dawn, the descending column, its rays, the drifting feathers, the pool of light */
@keyframes lgrSeraphDawn { 0% { opacity: 0 } 20% { opacity: 1 } 70% { opacity: .85 } 100% { opacity: 0 } }
@keyframes lgrSeraphColumn { 0% { transform: scaleY(0) scaleX(.35); opacity: 0 } 10% { opacity: 1 } 38% { transform: scaleY(1) scaleX(.6); opacity: 1 } 62% { transform: scaleY(1) scaleX(1); opacity: .95 } 100% { transform: scaleY(1) scaleX(1.25); opacity: 0 } }
@keyframes lgrSeraphRay { 0% { transform: translateY(0); opacity: 0 } 20% { opacity: 1 } 100% { transform: translateY(var(--ry)); opacity: 0 } }
@keyframes lgrSeraphDrift { 0% { transform: translate(0, 0) rotate(-24deg); opacity: 0 } 15% { opacity: 1 } 40% { transform: translate(var(--sx), calc(var(--fy) * .38)) rotate(18deg) } 70% { transform: translate(calc(var(--sx) * -.4), calc(var(--fy) * .72)) rotate(-14deg); opacity: 1 } 100% { transform: translate(calc(var(--sx) * .5), var(--fy)) rotate(10deg); opacity: 0 } }
@keyframes lgrSeraphPool { 0% { transform: scaleX(.3); opacity: 0 } 30% { transform: scaleX(1); opacity: 1 } 100% { transform: scaleX(1.25); opacity: 0 } }

/* THE BODY */
@keyframes lgrSeraphSmite { 0% { transform: none } 22% { transform: translateY(-8px) scaleY(1.06) } 42% { transform: translateY(4px) scaleY(.95) } 62% { transform: translateY(-1px) scaleY(1.01) } 100% { transform: none } }
@keyframes lgrSeraphSmiteP3 { 0% { transform: none } 20% { transform: translateY(-10px) scaleY(1.08) rotate(-1deg) } 40% { transform: translateY(6px) scaleY(.93) rotate(1deg) } 60% { transform: translateY(-2px) scaleY(1.02) } 100% { transform: none } }
@keyframes lgrSeraphBow { 0% { transform: none } 40% { transform: translateY(6px) rotate(6deg) } 70% { transform: translateY(6px) rotate(6deg) } 100% { transform: none } }
@keyframes lgrSeraphAscend { 0% { transform: none } 32% { transform: translateY(-12px) scale(1.05) } 62% { transform: translateY(-10px) scale(1.045) } 84% { transform: translateY(1px) scale(.995) } 100% { transform: none } }
@keyframes lgrSeraphAscendP3 { 0% { transform: none } 32% { transform: translateY(-10px) scale(1.07) rotate(4deg) } 62% { transform: translateY(-8px) scale(1.06) rotate(6deg) } 84% { transform: translateY(1px) scale(.995) rotate(1deg) } 100% { transform: none } }
.lgr-seraph-wrath { transform-origin: 50% 85%; animation: lgrSeraphSmite 800ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-phase="3"] .lgr-seraph-wrath { animation-name: lgrSeraphSmiteP3 }
.lgr-seraph-mercy { transform-origin: 50% 95%; animation: lgrSeraphBow 1100ms cubic-bezier(.22,1,.36,1) both }
.lgr-seraph-grace { transform-origin: 50% 90%; animation: lgrSeraphAscend 1150ms cubic-bezier(.3,.8,.35,1) both }
.lg-boss[data-phase="3"] .lgr-seraph-grace { transform-origin: 50% 50%; animation-name: lgrSeraphAscendP3 }

/* THE REAL PARTS (hook classes in raids/seraph.svg). Each hook is a bare group whose own SMIL (entrance, idle) keeps
   running: these use the individual translate / rotate / scale properties, which compose in front of it.
     lgs-wing   the bare group at each wing's root (local origin = the root; + spreads, - folds), phases 1 and 2
     lgs-eye    the great eye (every phase) and phase 2's hood eyes (local origin = the eye's center)
     lgs-halo0  phase 1's halo (local origin = its center); lgs-halo2 phase 2's halo (center 60, 36)
     lgs-wheel  phase 3's wheel of wings (center 60, 58)
   The red eyes turn GOLD under grace through a hue turn (white stays white). Played only while data-fx is set, which
   the arena never does in focus mode, with Still bosses or under reduced motion. */
.lg-boss .lgs-wing, .lg-boss .lgs-eye, .lg-boss .lgs-halo0, .lg-boss .lgs-halo2, .lg-boss .lgs-wheel { transform-box: view-box; transform-origin: 0 0 }
${PIVOT_CSS}
@keyframes lgrSeraphWingSpread { 0% { rotate: 0deg; filter: none } 30% { rotate: 13deg; filter: hue-rotate(50deg) saturate(1.4) brightness(1.2) drop-shadow(0 0 1.5px #ffd23f) } 65% { rotate: 10deg; filter: hue-rotate(50deg) saturate(1.4) brightness(1.15) drop-shadow(0 0 1.5px #ffd23f) } 100% { rotate: 0deg; filter: none } }
@keyframes lgrSeraphWingSnap { 0% { rotate: 0deg; filter: none } 18% { rotate: 17deg; filter: brightness(1.35) drop-shadow(0 0 1.5px #ff7a1a) } 45% { rotate: 11deg; filter: brightness(1.2) drop-shadow(0 0 1px #ff7a1a) } 100% { rotate: 0deg; filter: none } }
@keyframes lgrSeraphWingFold { 0% { rotate: 0deg; filter: none } 35% { rotate: -13deg; filter: brightness(1.25) drop-shadow(0 0 1.5px #ffffff) } 70% { rotate: -11deg; filter: brightness(1.2) drop-shadow(0 0 1.5px #ffffff) } 100% { rotate: 0deg; filter: none } }
@keyframes lgrSeraphEyeGold { 0% { scale: 1; filter: none } 28% { scale: 1.12 1.32; filter: hue-rotate(50deg) saturate(1.6) brightness(1.3) drop-shadow(0 0 2px #ffd23f) } 65% { scale: 1.08 1.22; filter: hue-rotate(50deg) saturate(1.5) brightness(1.2) drop-shadow(0 0 1.5px #ffd23f) } 100% { scale: 1; filter: none } }
.lg-boss[data-fx="grace"] .lgs-wing { animation: lgrSeraphWingSpread 1150ms cubic-bezier(.3,.8,.35,1) both }
.lg-boss[data-fx="grace"] .lgs-eye { animation: lgrSeraphEyeGold 1150ms cubic-bezier(.3,.8,.35,1) both }
/* the true form's great eye is gold already: it only opens wider and blazes white-gold (a hue turn made it green) */
.lg-boss[data-phase="3"][data-fx="grace"] .lgs-eye { animation-name: lgrSeraphEyeBlaze }
@keyframes lgrSeraphEyeBlaze { 0% { scale: 1; filter: none } 28% { scale: 1.1 1.28; filter: brightness(1.4) drop-shadow(0 0 2.5px #fff4b8) } 65% { scale: 1.06 1.18; filter: brightness(1.25) drop-shadow(0 0 2px #ffd23f) } 100% { scale: 1; filter: none } }
.lg-boss[data-fx="grace"] .lgs-halo0 { animation: lgrSeraphHaloGrace0 1100ms ease-in-out both }
.lg-boss[data-fx="grace"] .lgs-halo2 { animation: lgrSeraphHaloGrace2 1100ms ease-in-out both }
.lg-boss[data-fx="grace"] .lgs-wheel { animation: lgrSeraphWheelGrace 1150ms ease-in-out both }
.lg-boss[data-fx="wrath"] .lgs-wing { animation: lgrSeraphWingSnap 800ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-fx="wrath"] .lgs-halo0 { animation: lgrSeraphHaloWrath0 1000ms ease-out both }
.lg-boss[data-fx="wrath"] .lgs-halo2 { animation: lgrSeraphHaloWrath2 1000ms ease-out both }
.lg-boss[data-fx="wrath"] .lgs-wheel { animation: lgrSeraphWheelWrath 1100ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-fx="mercy"] .lgs-wing { animation: lgrSeraphWingFold 1100ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-fx="mercy"] .lgs-halo0 { animation: lgrSeraphHaloMercy0 1100ms ease-in-out both }
.lg-boss[data-fx="mercy"] .lgs-halo2 { animation: lgrSeraphHaloMercy2 1100ms ease-in-out both }
.lg-boss[data-fx="mercy"] .lgs-wheel { animation: lgrSeraphWheelMercy 1100ms ease-in-out both }

/* fx-layer motion: the blood tears spurt and drip down from where they are drawn, then thin out */
@keyframes lgrSeraphTearDrip { 0% { transform: translateY(-1px); opacity: 0 } 14% { transform: none; opacity: 1 } 70% { transform: translateY(2.4px); opacity: 1 } 100% { transform: translateY(3.2px); opacity: .5 } }
.lg-boss[data-fx="wrath"] .lgfa-seraph-tear { transform-box: fill-box; transform-origin: 50% 0%; animation: lgrSeraphTearDrip 1100ms cubic-bezier(.5,0,.7,1) both }
${PARTS_CSS}
`,
}
