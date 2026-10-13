// What the Chronos's Time Loop (abilities/chronos.js) LOOKS like. The fx contract is in fx/index.js, the juice in
// fx/_juice.js. Fixed brass, sand and frozen-blue colors, so they read over any palette. Each effect is its own event:
//   grain (tick): a brass hourglass flips over the titan and one grain drops; the great key gives one click.
//   rewind (big): the arena runs BACKWARDS: a sepia wash, VHS rewind bars, a clock spinning its hands back three turns
//     with ghost clocks sliding right to left; the titan jerks back through its last blow in four steps.
//   paradox (medium): two moments at once: the clock face splits into a cyan and a magenta copy that tear apart, its
//     twelve numerals flung outward; the head glitches sideways between the two.
//   timestop (big): everything goes grey inside a frozen blue ring, icicle shards hang in the air, then color snaps back
//     on the hit; the titan freezes palms up, then lurches.
//   overflow (medium): the chest glass brims and a curtain of sand pours down the titan, splashing; a frozen-blue
//     hourglass pulses (time is about to stop).
import { anim, around, ring, shards } from './_kit'

const BRASS = '#ffc94a'
const SAND = '#f5c26b'
const SEPIA = 'rgba(176,122,52,.38)'
const FROST = '#7fd8ff'
// Time Stop's grey veil sits inside the boss's headroom (-18%: past it the veil greyed the card's edge and the page
// under it) with a soft hole over the face (the frost eyes in every phase sit within 35..68% x 33..51% of the box), so
// the eyes stay blue; the drawing greys itself around them (css below).
const FACE_HOLE = 'radial-gradient(ellipse 20% 12% at 50.4% 43.4%, transparent 70%, #000 100%)'
// Time Stop's ice shards burst out SIDEWAYS from the frost ring on his chest (80% down the box), never down: aimed down
// they flew past the bottom of the arena card onto the page from 300 ms on. At most 25 degrees below level and 24 to 32%
// of the box out (container units of their own box, so the same at every arena size): the lowest ends near 94% of the
// box, inside the card's headroom.
const SHARD_ANGLES = [65, 85, 100, 115, 245, 260, 275, 295]
const NUMERALS = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']

// A clock face with two hands; `spin` is the keyframe on the hands' box.
// Every ability effect plays OFF his face (the dial sits at about 41% of the box): low() moves a centred effect down
// onto his chest; the clocks are drawn small there.
const low = (key, children) => <div key={key} className="lgx" style={{ left: 0, right: 0, top: '30%', height: '100%' }}>{children}</div>
// The mantle (lg-chronos-cape) moves exactly with the torso: every torso rule is given to it too. It is its own group so
// the torso's top stays the chest (the neck joint), never the tips of a mantle blown up past the shoulders.
const withCape = (css) => css.replace(/([^{}]*?\.lg-chronos-torso\b[^{}]*)\{/g, (m, sel) => `${sel.trimEnd()}, ${sel.trim().replace(/\.lg-chronos-torso\b/g, '.lg-chronos-cape')} {`)
const clock = (key, style, spin, color = BRASS) => (
  <div key={key} className="lgx" style={{ left: '50%', top: '50%', width: '80%', height: '80%', marginLeft: '-40%', marginTop: '-40%', borderRadius: '50%', border: `5px solid ${color}`, boxShadow: `0 0 8px ${color}, inset 0 0 14px rgba(255,201,74,.45)`, background: 'radial-gradient(circle, rgba(255,246,214,.5), rgba(255,201,74,.1) 70%)', ...style }}>
    {around(12, (i, a) => <div key={i} style={{ position: 'absolute', left: '50%', top: '50%', width: 3, height: i % 3 ? 6 : 11, marginLeft: -1.5, background: color, transform: `rotate(${a}deg) translateY(-${i % 3 ? 44 : 41}%)`, transformOrigin: 'center top' }} />)}
    <div style={{ position: 'absolute', inset: 0, animation: spin }}>
      <div style={{ position: 'absolute', left: '50%', top: '14%', width: 5, height: '36%', marginLeft: -2.5, background: '#ffffff', borderRadius: 3, boxShadow: `0 0 6px ${color}` }} />
      <div style={{ position: 'absolute', left: '50%', top: '26%', width: 7, height: '24%', marginLeft: -3.5, background: color, borderRadius: 3 }} />
    </div>
  </div>
)

// A small brass hourglass (outlined dark so it reads over the gold art).
const hourglass = (glass = '#fff3d0') => (
  <svg viewBox="0 0 30 40" width="100%" height="100%" aria-hidden="true">
    <path d="M3 2h24v4H3zM3 34h24v4H3z" fill={BRASS} stroke="#3a2406" strokeWidth="1.4" />
    <path d="M6 6h18c0 8-7 10-7 14s7 6 7 14H6c0-8 7-10 7-14S6 14 6 6Z" fill={glass} fillOpacity=".55" stroke="#3a2406" strokeWidth="1.4" />
    <path d="M9 9h12c-1 4-5 6-6 9-1-3-5-5-6-9ZM8 33c2-4 5-5 7-6 2 1 5 2 7 6Z" fill={SAND} />
  </svg>
)

// THE DRAWING ACTS EVERY MOMENT (impact/bosses/README.md): the hook classes in raids/chronos.svg move with the arena's
// data-moment (a plain strike moment), data-assault-on (its blow on the player), data-fx (its ability) and data-down
// (the fallen pose after the knockout). Parts: head (pivot at the neck), brow (the hour and minute hands, on the hub),
// crown, jaw, torso (pivot at its base), armL (the viewer's left arm with the great winding key in phases 1 and 2),
// armR (the presenting palm under the floating hourglass, the HALT palm, the sand-pouring palm in phase 3), key (pivot: the
// fist that holds it). Since the 2026-10-10 redraw every phase shares one framing: shoulders (the bell tops) at 28 81 and
// 92 81 (broadened 2026-10-11), the neck at 60 73.4 (phase 2 sits 2 lower: its stance hunches); only the key's fist moves per phase (PIV, from .scratch/raid-kitsune/chronos/gen.mjs). The
// brow sits in the head's own space with the hub at 0 0; the crown pivots on its own stem (inline fill-box style).
// Every move ends on the drawn pose.
const P = '.lg-boss[data-motif="chronos"]'
const PIV = {
  // (in each part's OWN coordinates: the body's growth and phase 2's lean wrap these parts, so the joints stay put)
  1: { armL: [28, 81], armR: [92, 81], head: [60, 73.4], torso: [60, 70], key: [21.4, 79] },
  2: { armL: [28, 83], armR: [92, 83], head: [60, 75.4], torso: [60, 72], key: [14.6, 64.4] },
  3: { armL: [28, 81], armR: [92, 81], head: [60, 73.4], torso: [60, 70], key: [16.4, 42.6] },
}
const PARTS = ['armL', 'armR', 'head', 'torso', 'key']
const origins = Object.entries(PIV).map(([ph, pv]) => PARTS.map((p) => `${P}${ph === '1' ? '' : `[data-phase="${ph}"]`} .lg-chronos-${p} { transform-box: view-box; transform-origin: ${pv[p][0]}px ${pv[p][1]}px }`).join('\n')).join('\n')
// THE FALL IN PHASES 2 AND 3: the arms there are raised (the key swung overhead, both arms flung up in a V), so a small
// droop reads as nothing. They fall the whole way: the raised arm drops from the shoulder past horizontal, the key
// tumbles from the slack fist, the head slumps hard on its neck and the hourglass body crumbles lower than in phase 1.
// Each knockout ends exactly on its held pose (data-down), with one rebound on the way.
const FALL = {
  // phase 1 SINKS: the titan slumps down into its own sand, head tipped, arms fallen, the key toppled
  1: { armL: 'translate(-3px, 18px) rotate(-34deg)', armR: 'translate(4px, 18px) rotate(38deg)', head: 'translate(0px, 16px) rotate(-26deg) scale(.94)', torso: 'translateY(16px) scale(1.06, .8)', key: 'translate(4px, 10px) rotate(19deg)', crown: 'translate(-6px, 8px) rotate(-30deg)' },
  // phase 2 SHATTERS: the limbs are blown apart from the burst chest and hang there, broken; the head stays seated on the
  // slumped torso (it rides the torso's tilt and squash: a review found it 12 units off its neck)
  2: { armL: 'translate(-8px, -2px) rotate(-24deg)', armR: 'translate(5px, 12px) rotate(42deg)', head: 'translate(-1px, 8.5px) rotate(6deg) scale(.92)', torso: 'translate(0px, 10px) rotate(10deg) scale(.96, .82)', key: 'translate(-2px, 3px) rotate(10deg)', crown: 'translate(-8px, -12px) rotate(-56deg)' },
  // phase 3 CRUMBLES INTO SAND: the raised arms drop, the body slumps down into its own heap of sand, the key falls
  // across it and the halo fades; the fallen pose stays above the card's bottom edge (about 104 drawing units)
  3: { armL: 'translate(8px, 14px) rotate(-38deg)', armR: 'translate(-8px, 6px) rotate(34deg)', head: 'translate(0px, 10px) rotate(-14deg) scale(.92)', torso: 'translateY(10px) scale(.92, .62)', key: 'translate(0px, 44px) rotate(60deg)', crown: 'translate(-4px, 16px) rotate(-24deg)' },
}
const FALL_AT = { armL: 50, armR: 50, head: 52, torso: 52, key: 44, crown: 46 }
function phaseFalls() {
  return Object.entries(FALL).map(([ph, parts]) => {
    const st = `${P}[data-phase="${ph}"]`
    return Object.entries(parts).map(([part, end]) => {
      const name = `lgrChronosKo${part[0].toUpperCase()}${part.slice(1)}P${ph}`
      const at = FALL_AT[part]
      return `@keyframes ${name} { 0%, ${at}% { transform: none } ${at + 16}% { transform: ${end} } ${at + 28}% { transform: translateY(-5px) ${end} } 100% { transform: ${end} } }
${st}[data-moment="ko"] .lg-chronos-${part} { animation: ${name} 2200ms ease-in both }
${st}[data-down] .lg-chronos-${part} { transform: ${end} }`
    }).join('\n')
  }).join('\n')
}
// Every part rule made here is also recorded (ON_CALLS), so FIT below can give one phase a smaller copy of a move.
const ON_CALLS = []
const on = (state, parts) => Object.entries(parts).map(([p, a]) => { ON_CALLS.push([state, p, a]); return `${P}${state} .${p.startsWith('lgfa') ? p : `lg-chronos-${p}`} { animation: ${a} }` }).join('\n')
// INSIDE THE FRAME (check-moment-clip.mjs: nothing may pass the art box's 20% headroom in any fight moment). The moves
// above are written once for all three phases, but the phases differ in where their parts sit: phase 2's mantle spans
// the whole box, phase 3's sand-pouring palm (with its falling sand, lg-chronos-vortex) rests at the right edge, phase 2
// holds the great key across the body in both hands. FIT gives a phase its OWN, smaller copy of a part's move: the same
// keyframes with the clockwise rotations and skews (rot), the counterclockwise ones (rotN), translations (tr) and scales
// (sc) multiplied, so every move keeps its timing and its feeling, just within the frame.
// { phase, part, states (default: every state the part moves in), rot, rotN, tr, sc }, or { phase, part, states, use }:
// a move of its own for that phase (an animation written below).
// Phase 3's big palm moves, [state, length in ms]: the sand stream breaks for them (lgrChronosSandBreak).
const SAND_BREAK = [['[data-assault-on]', 820], ['[data-moment="hurtBig"]', 900], ['[data-assault-on][data-moment="hurtBig"]', 900], ['[data-moment="shield"]', 760], ['[data-moment="block"]', 680]]
const SAND_SWING = { rot: 0.1, rotN: 0.8, tr: 0.2, sc: 0.2 }
const FIT = [
  // phase 1: the mantle's shear and swell, and the crown's jolt, a little smaller
  { phase: 1, part: 'cape', states: ['[data-moment="sharpen"]', '[data-fx="overflow"]'], rot: 0.75, rotN: 0.75, sc: 0.75 },
  { phase: 1, part: 'crown', states: ['[data-moment="hurtBig"]'], tr: 0.75 },
  // phase 2: the mantle already fills the box (it only flexes), the key held in both hands only rocks
  { phase: 2, part: 'cape', rot: 0.25, rotN: 0.25, tr: 0.25, sc: 0.2 },
  { phase: 2, part: 'key', rot: 0.05, rotN: 0.05, tr: 0.05, sc: 0.05 },
  { phase: 1, part: 'armL', states: ['[data-moment="hurtBig"]', '[data-assault-on][data-moment="hurtBig"]'], rot: 0.8, rotN: 0.8, tr: 0.8, sc: 0.8 },
  // phase 1 (broadened 2026-10-11): the presenting arm sits nearer the right edge, so its blows reach a little less
  { phase: 1, part: 'armR', rot: 0.6, rotN: 0.6, tr: 0.5, sc: 0.5 },
  { phase: 2, part: 'armL', states: ['[data-moment="hurtBig"]', '[data-assault-on][data-moment="hurtBig"]'], rot: 0.45, rotN: 0.45, tr: 0.5, sc: 0.2 },
  // phase 3: the palm rests at the right edge with its sand pouring from it (lg-chronos-vortex). In the small moves it
  // only jolts (a turn of more than a degree tips the stream past the edge)...
  { phase: 3, part: 'armR', rot: 0.04, rotN: 0.04, tr: 0.08, sc: 0.05 },
  // ...but in its BIG moves the stream BREAKS as he jerks (SAND_BREAK below) and the palm swings with real punch,
  // the stream pouring back as it settles; the palm itself still stays inside the frame
  ...SAND_BREAK.map(([state]) => ({ phase: 3, part: 'armR', states: [state], ...SAND_SWING })),
  // (the heavy blow's swell and the parry's knock outward are the moves that reach for the edge: those grow less)
  { phase: 3, part: 'armR', states: ['[data-moment="hurtBig"]', '[data-assault-on][data-moment="hurtBig"]'], ...SAND_SWING, rotN: 0.55, sc: 0.08 },
  { phase: 3, part: 'armR', states: ['[data-moment="block"]'], ...SAND_SWING, tr: 0.08 },
  { phase: 3, part: 'head', states: ['[data-assault-on]'], use: 'lgrChronosStrikeHead 820ms cubic-bezier(.2,.9,.3,1) both' },
  { phase: 3, part: 'crown', states: ['[data-moment="hurtBig"]'], tr: 0 },
  { phase: 3, part: 'head', states: ['[data-moment="hurtBig"]'], sc: 0.6 },
]
const fitNum = (v, f) => +(v * f).toFixed(2)
const fitFrames = (body, { rot = 1, rotN = rot, tr = 1, sc = 1 }) => body
  .replace(/rotate\((-?[\d.]+)deg\)/g, (m, v) => `rotate(${fitNum(+v, +v > 0 ? rot : rotN)}deg)`)
  .replace(/skew([XY])\((-?[\d.]+)deg\)/g, (m, ax, v) => `skew${ax}(${fitNum(+v, +v > 0 ? rot : rotN)}deg)`)
  .replace(/(-?[\d.]+)px/g, (m, v) => `${fitNum(+v, tr)}px`)
  .replace(/scale([XY]?)\(([^)]*)\)/g, (m, ax, args) => `scale${ax}(${args.split(',').map((a) => +(1 + (+a - 1) * sc).toFixed(3)).join(', ')})`)
function fitted(css) {
  const frames = {}
  css.replace(/@keyframes (\w+) \{((?:[^{}]*\{[^{}]*\})*)\s*\}/g, (m, name, body) => { frames[name] = body; return m })
  const out = []
  FIT.forEach((fit, k) => {
    // the mantle moves with the torso (withCape), so its moves are the torso's; the knockout is never fitted here (its falls are per phase, FALL, and must end on the held data-down pose)
    if (fit.use) { fit.states.forEach((state) => out.push(`${P}[data-phase="${fit.phase}"]${state} .lg-chronos-${fit.part} { animation: ${fit.use} }`)); return }
    const calls = ON_CALLS.filter(([state, p]) => (p === fit.part || (fit.part === 'cape' && p === 'torso')) && (fit.states ? fit.states.includes(state) : state !== '[data-moment="ko"]'))
    calls.forEach(([state, , a]) => {
      const anim = a.split(/,\s*(?=lgr)/).map((one) => {
        const name = one.trim().split(/\s+/)[0]
        if (!frames[name]) return one
        const nn = `${name}Fit${fit.phase}${fit.part}${k}`
        if (!frames[nn]) { frames[nn] = fitFrames(frames[name], fit); out.push(`@keyframes ${nn} {${frames[nn]} }`) }
        return one.replace(name, nn)
      }).join(', ')
      out.push(`${P}[data-phase="${fit.phase}"]${state} .lg-chronos-${fit.part} { animation: ${anim} }`)
    })
  })
  return `${css}\n/* INSIDE THE FRAME (FIT above) */\n${out.join('\n')}\n`
}
const PARTS_CSS = `
${origins}
${P} .lg-chronos-brow, ${P} .lg-chronos-crown, ${P} .lgfa-chronos-brow, ${P} .lgfa-chronos-seconds { transform-box: view-box; transform-origin: 0px 0px }
${P} .lg-chronos-jaw, ${P} .lgfa-chronos-jaw { transform-box: fill-box; transform-origin: 50% 0% }
/* HIT: the dial is knocked back on its neck and the brow hands jump one hour, like a struck clock. */
@keyframes lgrChronosHitHead { 0% { transform: none} 10% { transform: rotate(-20deg) scale(.9)} 42% { transform: rotate(-13deg) scale(.94)} 64% { transform: rotate(4deg)} 82% { transform: rotate(-1.5deg)} 100% { transform: none} }
@keyframes lgrChronosHitTorso { 0%, 100% { transform: none} 12%, 40% { transform: rotate(-5deg)} 66% { transform: rotate(1.5deg)} }
@keyframes lgrChronosHitBrow { 0%, 8% { transform: none } 9%, 62% { transform: rotate(30deg) } 63%, 100% { transform: none } }
@keyframes lgrChronosHitArmL { 0%, 100% { transform: none } 12% { transform: rotate(-13deg) } 42% { transform: rotate(-6deg) } 64% { transform: rotate(4deg) } }
@keyframes lgrChronosHitArmR { 0%, 100% { transform: none } 12% { transform: rotate(13deg) } 42% { transform: rotate(6deg) } 64% { transform: rotate(-4deg) } }
${on('[data-moment="hit"]', { torso: 'lgrChronosHitTorso 520ms ease-out both', head: 'lgrChronosHitHead 520ms cubic-bezier(.2,.9,.3,1) both', brow: 'lgrChronosHitBrow 520ms linear both', armL: 'lgrChronosHitArmL 520ms ease-out both', armR: 'lgrChronosHitArmR 520ms ease-out both' })}
/* CRITICAL: the head whips round, the brow hands spin a whole turn out of control, the crown rattles loose, the arms
   are flung wide and the jaw drops. */
@keyframes lgrChronosCritHead { 0% { transform: none} 10% { transform: rotate(-24deg) scale(.88)} 26% { transform: rotate(18deg) scale(1.06)} 44% { transform: rotate(-12deg) scale(.96)} 62% { transform: rotate(6deg)} 80% { transform: rotate(-2deg)} 100% { transform: none} }
@keyframes lgrChronosCritTorso { 0%, 100% { transform: none} 10% { transform: scale(1.06, .9)} 26% { transform: scale(.95, 1.06) rotate(3deg)} 44% { transform: scale(1.03, .96) rotate(-2deg)} 64% { transform: rotate(1deg)} }
@keyframes lgrChronosCritBrow { 0% { transform: none } 70% { transform: rotate(390deg) } 85% { transform: rotate(352deg) } 100% { transform: rotate(360deg) } }
@keyframes lgrChronosCritCrown { 0%, 100% { transform: none } 14% { transform: translate(2px, -5px) rotate(14deg) } 34% { transform: translate(-1px, -2px) rotate(-8deg) } 56% { transform: rotate(4deg) } }
@keyframes lgrChronosCritArmL { 0%, 100% { transform: none } 16% { transform: rotate(30deg) translate(-3px, 2px) } 42% { transform: rotate(-8deg) } 66% { transform: rotate(3deg) } }
@keyframes lgrChronosCritArmR { 0%, 100% { transform: none } 16% { transform: rotate(-30deg) translate(3px, 2px) } 42% { transform: rotate(8deg) } 66% { transform: rotate(-3deg) } }
@keyframes lgrChronosCritJaw { 0%, 100% { transform: none } 14% { transform: translateY(5px) scaleY(1.2) } 50% { transform: translateY(2px) } }
${on('[data-moment="crit"]', { torso: 'lgrChronosCritTorso 640ms ease-out both', head: 'lgrChronosCritHead 640ms cubic-bezier(.2,.9,.3,1) both', brow: 'lgrChronosCritBrow 640ms cubic-bezier(.15,.8,.3,1) both', crown: 'lgrChronosCritCrown 640ms ease-out both', armL: 'lgrChronosCritArmL 640ms ease-out both', armR: 'lgrChronosCritArmR 640ms ease-out both', jaw: 'lgrChronosCritJaw 640ms ease-out both' })}
/* SHARPENED: a clean cut across the glass: the hourglass torso shears, the head ducks down the blade's line, the key
   arm jerks up too late to guard. */
@keyframes lgrChronosCutTorso { 0%, 100% { transform: none} 10% { transform: skewX(-9deg)} 24% { transform: skewX(6deg)} 40% { transform: skewX(-3deg)} 60% { transform: skewX(1deg)} }
@keyframes lgrChronosCutHead { 0% { transform: none} 10% { transform: rotate(7deg)} 28% { transform: rotate(-4deg)} 52% { transform: rotate(1.5deg)} 100% { transform: none} }
@keyframes lgrChronosCutArmL { 0%, 100% { transform: none } 22% { transform: rotate(16deg) translate(2px, -3px) } 60% { transform: rotate(5deg) } }
${on('[data-moment="sharpen"]', { torso: 'lgrChronosCutTorso 600ms cubic-bezier(.2,.9,.3,1) both', head: 'lgrChronosCutHead 600ms cubic-bezier(.2,.9,.3,1) both', armL: 'lgrChronosCutArmL 600ms ease-out both' })}
/* ITS BLOW ON THE PLAYER (data-assault-on: every heart it takes, its plain strike and an ability's blow alike): the
   viewer's right arm cocks back (anticipation), then drives forward at the camera, growing, the instant the gear storm
   leaves; the great key swings round in the other hand. */
@keyframes lgrChronosBlowArmR { 0% { transform: none } 13% { transform: rotate(18deg) translate(4px, -6px) scale(.92) } 24% { transform: rotate(-22deg) translate(-8px, 8px) scale(1.5) } 32% { transform: rotate(-18deg) translate(-7px, 7px) scale(1.44) } 52% { transform: rotate(-14deg) translate(-5px, 5px) scale(1.34) } 100% { transform: none } }
@keyframes lgrChronosBlowArmL { 0%, 100% { transform: none } 13% { transform: rotate(10deg) } 26% { transform: rotate(-12deg) } 55% { transform: rotate(-5deg) } }
@keyframes lgrChronosBlowKey { 0%, 100% { transform: none } 14% { transform: rotate(-20deg) } 28% { transform: rotate(34deg) } 56% { transform: rotate(12deg) } }
${on('[data-assault-on]', { armR: 'lgrChronosBlowArmR 820ms cubic-bezier(.3,.7,.3,1) both', armL: 'lgrChronosBlowArmL 820ms ease-out both', key: 'lgrChronosBlowKey 820ms ease-out both' })}
/* ITS STRIKE (data-moment hurt, with the blow above): the head lunges in behind the blow, the jaw gapes, the hourglass
   leans into it. */
@keyframes lgrChronosStrikeHead { 0% { transform: none} 14% { transform: rotate(7deg) scale(1.1)} 40% { transform: rotate(5deg) scale(1.06)} 100% { transform: none} }
@keyframes lgrChronosStrikeJaw { 0%, 100% { transform: none } 12%, 40% { transform: translateY(4px) scaleY(1.28) } }
@keyframes lgrChronosStrikeTorso { 0%, 100% { transform: none} 16%, 40% { transform: rotate(4deg)} }
${on('[data-moment="hurt"]', { head: 'lgrChronosStrikeHead 620ms cubic-bezier(.2,.9,.3,1) both', jaw: 'lgrChronosStrikeJaw 620ms ease-out both', torso: 'lgrChronosStrikeTorso 620ms ease-out both' })}
/* ...in phase 3 the sand pouring from its palm BREAKS off as the palm jerks into a big move (a gap in the stream, gone in
   60 ms) and pours back as the palm settles: the palm swings with its full weight and the stream never crosses the
   frame's edge (SAND_BREAK, FIT above). */
@keyframes lgrChronosSandBreak { 0% { opacity: 1 } 6%, 82% { opacity: 0 } 100% { opacity: 1 } }
${SAND_BREAK.map(([state, ms]) => `${P}[data-phase="3"]${state} .lg-chronos-vortex { animation: lgrChronosSandBreak ${ms}ms linear both }`).join('\n')}
/* ITS HEAVY BLOW (hurtBig): no single blow: BOTH arms heave up over the dial and hammer down together like a bell
   clapper, the head bowing into the slam, the hourglass squashing under it and the crown jolting. */
@keyframes lgrChronosHeavyArmL { 0% { transform: none } 22% { transform: rotate(34deg) translate(4px, -6px) } 34% { transform: rotate(-14deg) translate(2px, 6px) scale(1.16) } 44% { transform: rotate(-9deg) translate(1px, 4px) scale(1.12) } 70% { transform: rotate(-5deg) translateY(2px) scale(1.05) } 100% { transform: none } }
@keyframes lgrChronosHeavyArmR { 0% { transform: none } 22% { transform: rotate(-34deg) translate(-4px, -6px) } 34% { transform: rotate(14deg) translate(-2px, 6px) scale(1.16) } 44% { transform: rotate(9deg) translate(-1px, 4px) scale(1.12) } 70% { transform: rotate(5deg) translateY(2px) scale(1.05) } 100% { transform: none } }
@keyframes lgrChronosHeavyHead { 0% { transform: none} 22% { transform: rotate(-3deg)} 34% { transform: scale(1.1)} 50% { transform: scale(1.05)} 100% { transform: none} }
@keyframes lgrChronosHeavyTorso { 0%, 22%, 100% { transform: none} 34% { transform: scale(1.08, .9)} 48% { transform: scale(.97, 1.04)} 62% { transform: scale(1.02, .98)} }
@keyframes lgrChronosHeavyCrown { 0%, 30%, 100% { transform: none } 36% { transform: translateY(-6px) } 52% { transform: translateY(1px) } 66% { transform: translateY(-2px) } }
${on('[data-moment="hurtBig"]', { armL: 'lgrChronosHeavyArmL 900ms cubic-bezier(.3,.7,.3,1) both', armR: 'lgrChronosHeavyArmR 900ms cubic-bezier(.3,.7,.3,1) both', head: 'lgrChronosHeavyHead 900ms cubic-bezier(.3,.7,.3,1) both', torso: 'lgrChronosHeavyTorso 900ms ease-out both', jaw: 'lgrChronosStrikeJaw 900ms ease-out both', crown: 'lgrChronosHeavyCrown 900ms ease-out both' })}
${on('[data-assault-on][data-moment="hurtBig"]', { armL: 'lgrChronosHeavyArmL 900ms cubic-bezier(.3,.7,.3,1) both', armR: 'lgrChronosHeavyArmR 900ms cubic-bezier(.3,.7,.3,1) both' })}
/* BLOCKED: its blow is stopped dead and driven back: the right arm thrusts, jars to a halt and is knocked up and away,
   the head snapping back from the parry and the key ringing in the other hand. */
@keyframes lgrChronosBlockArmR { 0% { transform: none } 12% { transform: rotate(-24deg) translate(-6px, 3px) scale(1.2) } 16% { transform: rotate(-22deg) translate(-5px, 3px) scale(1.18) } 30% { transform: rotate(24deg) translate(4px, -6px) scale(.94) } 42% { transform: rotate(18deg) translate(3px, -4px) } 50% { transform: rotate(21deg) translate(4px, -5px) } 100% { transform: none } }
@keyframes lgrChronosBlockHead { 0% { transform: none} 14% { transform: scale(1.06)} 26% { transform: rotate(10deg) scale(.94)} 52% { transform: rotate(8deg) scale(.95)} 74% { transform: rotate(-2deg)} 100% { transform: none} }
@keyframes lgrChronosBlockTorso { 0%, 100% { transform: none} 14% { transform: rotate(-3deg)} 28%, 54% { transform: rotate(5deg)} 76% { transform: rotate(-1deg)} }
@keyframes lgrChronosBlockKey { 0%, 100% { transform: none } 28% { transform: rotate(6deg) } 36% { transform: rotate(-5deg) } 44% { transform: rotate(4deg) } 52% { transform: rotate(-2deg) } }
${on('[data-moment="block"]', { torso: 'lgrChronosBlockTorso 680ms cubic-bezier(.2,.9,.3,1) both', armR: 'lgrChronosBlockArmR 680ms cubic-bezier(.2,.9,.3,1) both', head: 'lgrChronosBlockHead 680ms cubic-bezier(.2,.9,.3,1) both', key: 'lgrChronosBlockKey 680ms linear both' })}
/* SAVED: the blow glances off the shield and the arm is flung high, spinning the titan half round; the dazed dial
   wobbles and its brow hands wind dizzily backwards. */
@keyframes lgrChronosShieldArmR { 0% { transform: none } 14% { transform: rotate(-22deg) translate(-5px, 3px) scale(1.18) } 34% { transform: rotate(-70deg) translate(2px, -8px) scale(1.05) } 52% { transform: rotate(-54deg) translate(1px, -6px) } 100% { transform: none } }
@keyframes lgrChronosShieldHead { 0%, 100% { transform: none} 22% { transform: rotate(9deg)} 40% { transform: rotate(-8deg)} 58% { transform: rotate(6deg)} 74% { transform: rotate(-3deg)} }
@keyframes lgrChronosShieldBrow { 0%, 20% { transform: none } 80% { transform: rotate(-200deg) } 100% { transform: rotate(-180deg) } }
@keyframes lgrChronosShieldBrowBack { 0% { transform: rotate(-180deg) } 100% { transform: none } }
${on('[data-moment="shield"]', { armR: 'lgrChronosShieldArmR 760ms cubic-bezier(.2,.9,.3,1) both', head: 'lgrChronosShieldHead 760ms ease-in-out both', brow: 'lgrChronosShieldBrow 620ms ease-in-out both, lgrChronosShieldBrowBack 140ms ease-out 620ms both' })}
/* SECOND WIND: the titan sags: the dial tips back in disbelief, both arms drop slack, the hourglass settles low, the
   crown slips askew. */
@keyframes lgrChronosWindHead { 0% { transform: none} 30% { transform: rotate(-6deg) scale(.96)} 65% { transform: rotate(-4deg) scale(.97)} 100% { transform: none} }
@keyframes lgrChronosWindArmL { 0%, 100% { transform: none } 35%, 65% { transform: rotate(-12deg) translateY(4px) } }
@keyframes lgrChronosWindArmR { 0%, 100% { transform: none } 35%, 65% { transform: rotate(12deg) translateY(4px) } }
@keyframes lgrChronosWindTorso { 0%, 100% { transform: none} 35%, 65% { transform: scale(1.03, .95)} }
@keyframes lgrChronosWindCrown { 0%, 100% { transform: none } 35%, 65% { transform: rotate(-9deg) translate(-1px, 1px) } }
${on('[data-moment="wind"]', { head: 'lgrChronosWindHead 1000ms ease-in-out both', armL: 'lgrChronosWindArmL 1000ms ease-in-out both', armR: 'lgrChronosWindArmR 1000ms ease-in-out both', torso: 'lgrChronosWindTorso 1000ms ease-in-out both', crown: 'lgrChronosWindCrown 1000ms ease-in-out both' })}
/* KNOCKOUT (its time runs out, it shatters into sand): the brow hands race three turns and STOP dead; the head stutters
   frame by frame in the frozen second; then everything gives: the crown topples off, the key drops from the slack hand,
   the arms fall, the hourglass body crumbles down into its own sand and the dial lolls forward. It HOLDS that fallen
   pose (data-down) while the arena greys it. */
@keyframes lgrChronosKoBrow { 0% { transform: none } 40% { transform: rotate(1080deg) } 100% { transform: rotate(1080deg) } }
@keyframes lgrChronosKoHead { 0%, 10% { transform: none} 14% { transform: none} 18% { transform: none} 22% { transform: none} 26%, 50% { transform: none} 62% { transform: rotate(-16deg) scale(.95)} 72% { transform: rotate(-11deg) scale(.95)} 84% { transform: rotate(-14deg) scale(.95)} 100% { transform: rotate(-18deg) scale(.94)} }
@keyframes lgrChronosKoCrown { 0%, 46% { transform: none } 58% { transform: translate(-3px, -8px) rotate(-24deg) } 74% { transform: translate(6px, 6px) rotate(28deg) } 86% { transform: translate(5px, 4px) rotate(22deg) } 100% { transform: translate(3px, 3px) rotate(14deg) } }
@keyframes lgrChronosKoKey { 0%, 44% { transform: none } 60% { transform: rotate(-30deg) translateY(6px) } 74% { transform: rotate(-52deg) translateY(10px) } 86% { transform: rotate(-46deg) translateY(9px) } 100% { transform: rotate(-48deg) translateY(10px) } }
@keyframes lgrChronosKoArmL { 0%, 50% { transform: none } 64% { transform: rotate(-22deg) translateY(10px) } 76% { transform: rotate(-16deg) translateY(8px) } 100% { transform: rotate(-26deg) translateY(14px) } }
@keyframes lgrChronosKoArmR { 0%, 50% { transform: none } 66% { transform: rotate(22deg) translateY(10px) } 78% { transform: rotate(16deg) translateY(8px) } 100% { transform: rotate(26deg) translateY(14px) } }
@keyframes lgrChronosKoTorso { 0%, 52% { transform: none} 64% { transform: scale(1.1, .8)} 76% { transform: scale(1.04, .9)} 88% { transform: scale(1.07, .85)} 100% { transform: scale(1.08, .8)} }
@keyframes lgrChronosKoJaw { 0%, 56% { transform: none } 66% { transform: translateY(5px) rotate(8deg) } 100% { transform: translateY(4px) rotate(6deg) } }
${on('[data-moment="ko"]', { brow: 'lgrChronosKoBrow 2200ms cubic-bezier(.3,0,.2,1) both', head: 'lgrChronosKoHead 2200ms linear both', crown: 'lgrChronosKoCrown 2200ms ease-in both', key: 'lgrChronosKoKey 2200ms ease-in both', armL: 'lgrChronosKoArmL 2200ms ease-in-out both', armR: 'lgrChronosKoArmR 2200ms ease-in-out both', torso: 'lgrChronosKoTorso 2200ms ease-in-out both', jaw: 'lgrChronosKoJaw 2200ms ease-in-out both' })}
${P}[data-down] .lg-chronos-head { transform: rotate(-18deg) scale(.94) }
${P}[data-down] .lg-chronos-crown { transform: translate(3px, 3px) rotate(14deg) }
${P}[data-down] .lg-chronos-key { transform: rotate(-48deg) translateY(10px) }
${P}[data-down] .lg-chronos-armL { transform: rotate(-26deg) translateY(14px) }
${P}[data-down] .lg-chronos-armR { transform: rotate(26deg) translateY(14px) }
${P}[data-down] .lg-chronos-torso { transform: scale(1.08, .8) }
${P}[data-down] .lg-chronos-jaw { transform: translateY(4px) rotate(6deg) }
${phaseFalls()}
/* ...the eyes go out on the fallen pose, and the hourglass it levitated drops into the sand. */
${P}[data-down] .lg-chronos-eyes { filter: saturate(0) brightness(.22) }
${P}[data-phase="3"][data-down] .lg-chronos-vortex, ${P}[data-phase="3"][data-moment="ko"] .lg-chronos-vortex { display: none }
${P}[data-down] .lg-chronos-float { transform: translate(0px, 30px) rotate(80deg) }
@keyframes lgrChronosFloatDrop { 0%, 46% { transform: none } 62% { transform: translate(0px, 30px) rotate(80deg) } 70% { transform: translate(0px, 26px) rotate(76deg) } 100% { transform: translate(0px, 30px) rotate(80deg) } }
${P}[data-moment="ko"] .lg-chronos-float { transform-box: fill-box; transform-origin: center; animation: lgrChronosFloatDrop 2200ms ease-in both }
${P}[data-down] .lg-chronos-float { transform-box: fill-box; transform-origin: center }
/* ...and it is a heap of sand: its own sand rises over it from the base as the body crumbles, the dial splits. */
@keyframes lgrChronosRuinRise { 0%, 50% { transform: translateY(14px) scaleY(.2); opacity: 0 } 58% { opacity: 1 } 80% { transform: translateY(-2px) scaleY(1.05) } 100% { transform: none; opacity: 1 } }
@keyframes lgrChronosCrackIn { 0%, 30% { opacity: 0 } 34%, 100% { opacity: 1 } }
${P}[data-moment="ko"] .lg-chronos-ruin { display: inline !important; transform-box: fill-box; transform-origin: 50% 100%; animation: lgrChronosRuinRise 2200ms ease-out both }
${P}[data-down] .lg-chronos-ruin, ${P}[data-down] .lg-chronos-ruincrack { display: inline !important }
/* ...in phase 2 it bursts outward (shards, plates, cogs, a spiral of sand); in phase 3 he crumbles into a heap of sand
   under his fading halo. */
@keyframes lgrChronosShardOut { 0%, 48% { transform: scale(.2); opacity: 0 } 58% { opacity: 1 } 100% { transform: none; opacity: 1 } }
@keyframes lgrChronosHeapGrow { 0%, 50% { transform: scale(.25); opacity: 0 } 58% { opacity: 1 } 80% { transform: scale(1.04) } 100% { transform: none; opacity: 1 } }
@keyframes lgrChronosAuraOut { 0%, 44% { opacity: 1; transform: none } 72% { opacity: .3; transform: scale(.96) } 100% { opacity: .3; transform: scale(.96) } }
${P}[data-phase="2"][data-moment="ko"] .lg-chronos-ruin { transform-origin: 50% 50%; animation: lgrChronosShardOut 2200ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-phase="3"][data-moment="ko"] .lg-chronos-ruin { transform-origin: 50% 100%; animation: lgrChronosHeapGrow 2200ms ease-out both }
${P}[data-phase="3"][data-moment="ko"] .lg-chronos-aura { transform-box: fill-box; transform-origin: center; animation: lgrChronosAuraOut 2200ms ease-in both }
${P}[data-phase="3"][data-down] .lg-chronos-aura { transform-box: fill-box; transform-origin: center; opacity: .3; transform: scale(.96) }
${P}[data-moment="ko"] .lg-chronos-ruincrack { display: inline !important; animation: lgrChronosCrackIn 2200ms linear both }
/* ITS ABILITY, acted by the drawing.
   Grain: the dial ticks one notch and the great key gives one click, like a clock counting the grain. */
@keyframes lgrChronosGrainHead { 0%, 100% { transform: none} 20%, 60% { transform: rotate(4deg)} }
@keyframes lgrChronosGrainBrow { 0%, 15% { transform: none } 16%, 70% { transform: rotate(-30deg) } 71%, 100% { transform: none } }
@keyframes lgrChronosGrainKey { 0%, 100% { transform: none } 18%, 64% { transform: rotate(12deg) } }
${on('[data-fx="grain"]', { head: 'lgrChronosGrainHead 340ms steps(1, end) both', brow: 'lgrChronosGrainBrow 340ms linear both', key: 'lgrChronosGrainKey 340ms steps(1, end) both' })}
/* Rewind: the arms swing BACKWARDS through the last blow in four stepped jerks while the head steps back and the
   crown turns back a notch at a time. */
@keyframes lgrChronosRewindArmL { 0% { transform: none } 25% { transform: rotate(12deg) } 50% { transform: rotate(-10deg) } 75% { transform: rotate(8deg) } 100% { transform: none } }
@keyframes lgrChronosRewindArmR { 0% { transform: none } 25% { transform: rotate(-12deg) } 50% { transform: rotate(10deg) } 75% { transform: rotate(-8deg) } 100% { transform: none } }
@keyframes lgrChronosRewindHead { 0% { transform: none} 25% { transform: rotate(4deg)} 50% { transform: rotate(-3deg)} 75% { transform: rotate(2deg)} 100% { transform: none} }
@keyframes lgrChronosRewindCrown { 0% { transform: none } 100% { transform: rotate(-60deg) } }
${on('[data-fx="rewind"]', { armL: 'lgrChronosRewindArmL 1000ms steps(4, end) both', armR: 'lgrChronosRewindArmR 1000ms steps(4, end) both', head: 'lgrChronosRewindHead 1000ms steps(4, end) both', crown: 'lgrChronosRewindCrown 1000ms steps(4, start) both' })}
/* Paradox: the dial glitches between two moments at once: the head tears sideways in hard steps, the arms jitter out
   of sync, the crown flickers between two tilts. */
@keyframes lgrChronosParadoxHead { 0%, 100% { transform: none} 12% { transform: skewX(10deg)} 24% { transform: skewX(-8deg)} 36% { transform: none} 48% { transform: skewX(6deg)} 60% { transform: none} 72% { transform: none} }
@keyframes lgrChronosParadoxArmL { 0%, 100% { transform: none } 15% { transform: rotate(10deg) } 35% { transform: rotate(-8deg) } 55% { transform: rotate(6deg) } }
@keyframes lgrChronosParadoxArmR { 0%, 100% { transform: none } 25% { transform: rotate(-10deg) } 45% { transform: rotate(8deg) } 65% { transform: rotate(-5deg) } }
@keyframes lgrChronosParadoxCrown { 0%, 100% { transform: none } 20% { transform: rotate(12deg) } 40% { transform: rotate(-12deg) } 60% { transform: rotate(8deg) } 80% { transform: rotate(-4deg) } }
${on('[data-fx="paradox"]', { head: 'lgrChronosParadoxHead 640ms steps(1, end) both', armL: 'lgrChronosParadoxArmL 640ms steps(1, end) both', armR: 'lgrChronosParadoxArmR 640ms steps(1, end) both', crown: 'lgrChronosParadoxCrown 640ms steps(1, end) both' })}
/* Time Stop: both arms snap up (halt!) and the dial rears, frozen there while the world is grey, then the whole titan
   lurches as time snaps back on the hit. */
@keyframes lgrChronosStopArmL { 0% { transform: none } 8%, 60% { transform: rotate(24deg) translate(3px, -5px) } 68% { transform: rotate(-6deg) translateY(2px) } 82% { transform: rotate(4deg) } 100% { transform: none } }
@keyframes lgrChronosStopArmR { 0% { transform: none } 8%, 60% { transform: rotate(-24deg) translate(-3px, -5px) } 68% { transform: rotate(6deg) translateY(2px) } 82% { transform: rotate(-4deg) } 100% { transform: none } }
@keyframes lgrChronosStopHead { 0% { transform: none} 8%, 60% { transform: scale(1.06)} 68% { transform: rotate(6deg)} 82% { transform: rotate(-3deg)} 100% { transform: none} }
${on('[data-fx="timestop"]', { armL: 'lgrChronosStopArmL 900ms cubic-bezier(.2,.9,.3,1) both', armR: 'lgrChronosStopArmR 900ms cubic-bezier(.2,.9,.3,1) both', head: 'lgrChronosStopHead 900ms cubic-bezier(.2,.9,.3,1) both' })}
/* Overflow: the hourglass body swells against its frame as sand brims over, the arms brace outward to hold it and the
   crown rises on the pressure. */
@keyframes lgrChronosOverflowTorso { 0%, 100% { transform: none} 30% { transform: scale(1.1, .95)} 50% { transform: scale(1.05, 1.02)} 70% { transform: scale(1.08, .97)} }
@keyframes lgrChronosOverflowArmL { 0%, 100% { transform: none } 30%, 70% { transform: rotate(12deg) translateX(-2px) } }
@keyframes lgrChronosOverflowArmR { 0%, 100% { transform: none } 30%, 70% { transform: rotate(-12deg) translateX(2px) } }
@keyframes lgrChronosOverflowHead { 0%, 100% { transform: none} 30% { transform: none} 55% { transform: none} 75% { transform: none} }
@keyframes lgrChronosOverflowCrown { 0%, 100% { transform: none } 30%, 70% { transform: translateY(-3px) scale(1.06) } }
${on('[data-fx="overflow"]', { torso: 'lgrChronosOverflowTorso 760ms ease-in-out both', armL: 'lgrChronosOverflowArmL 760ms ease-in-out both', armR: 'lgrChronosOverflowArmR 760ms ease-in-out both', head: 'lgrChronosOverflowHead 760ms ease-in-out both', crown: 'lgrChronosOverflowCrown 760ms ease-in-out both' })}
`

export default {
  effects: {
    // Grain (tick): a brass hourglass flips over above the boss, a thin stream of sand pours through it and a gear
    // ring ticks one notch round it.
    grain: () => <>
      <div className="lgx" style={{ left: '86%', top: '6%', width: 34, height: 45, marginLeft: -17, filter: `drop-shadow(0 0 6px ${BRASS})`, animation: anim('lgrChronosFlip', 340, 0, 'cubic-bezier(.34,1.56,.64,1)') }}>{hourglass()}</div>
      <div className="lgx" style={{ left: '86%', top: '6%', width: 58, height: 58, marginLeft: -29, marginTop: -6, borderRadius: '50%', border: `3px dashed ${BRASS}`, animation: anim('lgrChronosTickRing', 340, 0, 'steps(2, end)') }} />
      {[0, 1, 2, 3, 4].map((i) => <div key={i} className="lgx" style={{ left: `calc(86% + ${(i % 2 ? 1 : -1) * i}px)`, top: '20%', width: 5, height: 5, marginLeft: -2.5, borderRadius: '50%', background: SAND, boxShadow: '0 0 0 1px #6b4a10', animation: anim('lgrChronosGrain', 300, 40 + i * 45, 'ease-in') }} />)}
    </>,
    // Rewind (big): sepia, VHS rewind bars racing right to left, ghost clocks, the main clock spinning back three turns.
    rewind: () => <>
      <div className="lgx lgx-full" style={{ background: SEPIA, mixBlendMode: 'multiply', borderRadius: '30%', animation: anim('lgxFade', 1150) }} />
      {[0, 1, 2, 3].map((i) => <div key={`b${i}`} className="lgx" style={{ left: 0, right: 0, top: `${58 + i * 12}%`, height: 5, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,243,208,.85), rgba(255,255,255,0))', animation: anim('lgrChronosVhs', 520, i * 90, 'linear') }} />)}
      {[0, 1, 2].map((i) => clock(`g${i}`, { ...{ top: '78%', width: '46%', height: '46%', marginLeft: '-23%', marginTop: '-23%' }, opacity: 0, animation: anim('lgrChronosGhost', 900, 120 + i * 140) }, 'none'))}
      {clock('main', { ...{ top: '78%', width: '46%', height: '46%', marginLeft: '-23%', marginTop: '-23%' }, animation: anim('lgxFade', 1150) }, anim('lgrChronosHands', 1000, 0, 'cubic-bezier(.45,0,.2,1)'))}
    </>,
    // Paradox (medium): the clock splits into a cyan and a magenta copy that tear apart, then cracks into numerals.
    paradox: () => <>
      {clock('cy', { ...{ top: '78%', width: '46%', height: '46%', marginLeft: '-23%', marginTop: '-23%' }, animation: anim('lgrChronosSplitL', 420, 0, 'steps(3, end)') }, 'none', '#4ff2ff')}
      {clock('mg', { ...{ top: '78%', width: '46%', height: '46%', marginLeft: '-23%', marginTop: '-23%' }, animation: anim('lgrChronosSplitR', 420, 0, 'steps(3, end)'), mixBlendMode: 'screen' }, 'none', '#ff4fd8')}
      {clock('c', { ...{ top: '78%', width: '46%', height: '46%', marginLeft: '-23%', marginTop: '-23%' }, animation: anim('lgrChronosCrack', 420, 0, 'ease-in') }, 'none')}
      {around(12, (i, a) => (
        <div key={i} className="lgx" style={{ left: '50%', top: '78%', fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: 15, color: BRASS, textShadow: '0 0 5px #ffffff, 0 1px 0 #6b4a10', '--a': `${a}deg`, '--d': `${-52 - (i % 3) * 10}px`, '--spin': `${(i % 2 ? 1 : -1) * 260}deg`, animation: anim('lgxShard', 760, 320 + i * 12) }}>{NUMERALS[i]}</div>
      ))}
    </>,
    // Time Stop (big): grey world, a frozen blue ring, icicles hanging still in the air, then color snaps back.
    timestop: () => <>
      <div className="lgx" style={{ inset: '-18%', backdropFilter: 'grayscale(1) contrast(1.15)', WebkitBackdropFilter: 'grayscale(1) contrast(1.15)', borderRadius: '30%', maskImage: FACE_HOLE, WebkitMaskImage: FACE_HOLE, animation: anim('lgrChronosStill', 900, 0, 'linear') }} />
      <div className="lgx" style={{ left: '50%', top: '80%', width: '48%', height: '30%', marginLeft: '-24%', marginTop: '-15%', borderRadius: '50%', border: `5px solid ${FROST}`, boxShadow: `0 0 22px ${FROST}, inset 0 0 22px ${FROST}`, animation: anim('lgrChronosFrostRing', 900, 0, 'linear') }} />
      {[0, 5].map((i) => <div key={`ic${i}`} className="lgx" style={{ left: `${i ? 94 : 2}%`, top: `${8 + (i % 3) * 7}%`, width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `${22 + (i % 2) * 10}px solid ${FROST}`, filter: 'drop-shadow(0 0 4px #e6fbff)', animation: anim('lgrChronosIcicle', 900, i * 30, 'linear') }} />)}
      {low('lr', ring('#ffffff', 600, 0.7, 6, 500))}
      {<div key="ls" className="lgx" style={{ left: 0, right: 0, top: '30%', height: '100%', containerType: 'size' }}>{SHARD_ANGLES.map((a, i) => <div key={`fs${i}`} className="lgx" style={{ left: '50%', top: '50%', width: 9, height: 14, background: FROST, clipPath: 'polygon(50% 0, 100% 100%, 0 100%)', '--a': `${a}deg`, '--d': `${-24 - (i % 3) * 4}cqw`, '--spin': `${(i % 2 ? 1 : -1) * 200}deg`, animation: anim('lgxShard', 600, i * 20) }} />)}</div>}
    </>,
    // Overflow (medium): the glass brims over: a thick curtain of sand pours down the boss, splashes at its feet and a
    // frozen-blue hourglass pulses (time is about to stop).
    overflow: () => <>
      <div className="lgx" style={{ left: '50%', top: '60%', width: '26%', height: '40%', marginLeft: '-13%', transformOrigin: 'top', borderRadius: '0 0 40% 40%', background: `linear-gradient(90deg, rgba(245,194,107,0), ${SAND} 25%, #fff3d0 50%, ${SAND} 75%, rgba(245,194,107,0))`, boxShadow: '0 0 0 1.5px rgba(107,74,16,.7)', animation: anim('lgrChronosPour', 760, 0, 'cubic-bezier(.3,.7,.4,1)') }} />
      {around(12, (i) => (
        <div key={i} className="lgx" style={{ left: '50%', top: '82%', width: 6, height: 6, marginLeft: -3, borderRadius: '50%', background: SAND, boxShadow: '0 0 0 1px #6b4a10', '--vx': `${(i - 5.5) * 9}px`, animation: anim('lgrChronosSplash', 520, 260 + (i % 4) * 30, 'cubic-bezier(.2,.8,.4,1)') }} />
      ))}
      <div className="lgx" style={{ left: '86%', top: '6%', width: 34, height: 44, marginLeft: -17, filter: `drop-shadow(0 0 8px ${FROST})`, animation: anim('lgrChronosBrimPulse', 760) }}>{hourglass(FROST)}</div>
      {low('or', ring(FROST, 300, 1.1, 4, 460))}
    </>,
  },
  floaters: { grain: 'lg_fx_sandGrain', rewind: 'lg_fx_rewind', paradox: 'lg_fx_paradox', timestop: 'lg_fx_timeStop', overflow: 'lg_fx_sandOverflow' },
  floaterTone: { grain: 'warning', rewind: 'warning', paradox: 'warning', timestop: 'info', overflow: 'info' },
  demo: { grain: { kind: 'hit', damage: 2, lives: 0 }, rewind: { kind: 'block', damage: 0, lives: 0 }, paradox: { kind: 'hit', damage: 1, lives: 0 }, timestop: { kind: 'hit', damage: 4, lives: 0 }, overflow: { kind: 'hit', damage: 2, lives: 0 } },
  juice: {
    grain: { size: 'tick' },
    rewind: { size: 'big', shake: 1, flash: 1, hitstop: 1, sfx: 'chronos.rewind' },
    paradox: { size: 'medium', shake: 1, flash: 1, hitstop: 1, sfx: 'chronos.paradox' },
    timestop: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'chronos.stop' },
    overflow: { size: 'medium', sfx: 'chronos.overflow' },
  },
  css: fitted(withCape(`
@keyframes lgrChronosGrain { 0% { transform: translateY(0); opacity: 0 } 20% { opacity: 1 } 100% { transform: translateY(46px); opacity: 0 } }
@keyframes lgrChronosFlip { 0% { transform: rotate(-180deg) scale(.5); opacity: 0 } 45% { transform: rotate(12deg) scale(1.15); opacity: 1 } 70% { transform: rotate(0) scale(1); opacity: 1 } 100% { transform: rotate(0) scale(.9); opacity: 0 } }
@keyframes lgrChronosTickRing { 0% { transform: rotate(0); opacity: .9 } 100% { transform: rotate(30deg); opacity: 0 } }
@keyframes lgrChronosPour { 0% { transform: scaleY(0); opacity: 0 } 15% { opacity: 1 } 45% { transform: scaleY(1); opacity: 1 } 80% { transform: scaleY(1); opacity: .9 } 100% { transform: scaleY(1) scaleX(.3); opacity: 0 } }
@keyframes lgrChronosSplash { 0% { transform: translate(0, 0) scale(.6); opacity: 0 } 15% { opacity: 1 } 55% { transform: translate(calc(var(--vx) * .7), -26px) scale(1) } 100% { transform: translate(var(--vx), 4px) scale(.8); opacity: 0 } }
@keyframes lgrChronosBrimPulse { 0% { transform: scale(.4); opacity: 0 } 20% { transform: scale(1.2); opacity: 1 } 35% { transform: scale(1) } 55% { transform: scale(1.12) } 70% { transform: scale(1) } 100% { transform: scale(1); opacity: 0 } }
@keyframes lgrChronosHands { 0% { transform: rotate(0) } 100% { transform: rotate(-1080deg) } }
@keyframes lgrChronosGhost { 0% { transform: translateX(45%) scale(.9); opacity: 0 } 20% { opacity: .35 } 100% { transform: translateX(-55%) scale(.9); opacity: 0 } }
@keyframes lgrChronosVhs { 0% { transform: translateX(60%); opacity: 0 } 15% { opacity: .9 } 85% { opacity: .9 } 100% { transform: translateX(-60%); opacity: 0 } }
@keyframes lgrChronosCrack { 0% { transform: scale(1); opacity: 1 } 60% { transform: scale(1.04) rotate(-3deg); opacity: 1 } 100% { transform: scale(1.1) rotate(4deg); opacity: 0 } }
@keyframes lgrChronosSplitL { 0% { transform: translate(0, 0); opacity: .9 } 100% { transform: translate(-24%, -4%); opacity: 0 } }
@keyframes lgrChronosSplitR { 0% { transform: translate(0, 0); opacity: .9 } 100% { transform: translate(24%, 4%); opacity: 0 } }
@keyframes lgrChronosStill { 0%, 60% { opacity: 1 } 61%, 100% { opacity: 0 } }
@keyframes lgrChronosIcicle { 0% { transform: translateY(-20px); opacity: 0 } 10%, 60% { transform: none; opacity: 1 } 64% { transform: translateY(4px); opacity: 1 } 100% { transform: translateY(60px); opacity: 0 } }
@keyframes lgrChronosFrostRing { 0% { transform: scale(1.3); opacity: 0 } 12% { transform: scale(1); opacity: 1 } 60% { transform: scale(1); opacity: 1 } 64% { transform: scale(1.06); opacity: 1 } 100% { transform: scale(1.5); opacity: 0 } }

@keyframes lgrChronosRewind { 0% { transform: none; filter: none } 20% { transform: translateX(4px); filter: drop-shadow(-8px 0 0 rgba(255,201,74,.45)) } 45% { transform: translateX(8px); filter: drop-shadow(-8px 0 0 rgba(255,201,74,.4)) drop-shadow(-16px 0 0 rgba(255,201,74,.25)) } 70% { transform: translateX(12px); filter: drop-shadow(-8px 0 0 rgba(255,201,74,.35)) drop-shadow(-18px 0 0 rgba(255,201,74,.2)) } 100% { transform: none; filter: none } }
@keyframes lgrChronosFreeze { 0% { transform: none; --lgrChronosGrey: 0 } 8%, 62% { transform: scale(1.04); --lgrChronosGrey: 1 } 70% { transform: translateX(7px) scale(1.02); --lgrChronosGrey: 0 } 80% { transform: translateX(-6px) } 90% { transform: translateX(2px) } 100% { transform: none; --lgrChronosGrey: 0 } }
@keyframes lgrChronosStagger { 0%, 100% { transform: none } 22% { transform: rotate(8deg) translateX(6px) } 48% { transform: rotate(-7deg) translateX(-5px) } 72% { transform: rotate(3deg) translateX(2px) } 88% { transform: rotate(-1deg) } }
@keyframes lgrChronosTick { 0%, 100% { transform: none } 25% { transform: rotate(-6deg) } 50% { transform: rotate(0) } 75% { transform: rotate(6deg) } }
@keyframes lgrChronosBrim { 0%, 100% { transform: none } 35% { transform: scale(1.1, .92) translateY(3px) } 60% { transform: scale(.96, 1.06) translateY(-4px) } 82% { transform: scale(1.02, .99) } }
.lgr-chronos-rewind { animation: lgrChronosRewind 1000ms steps(4, end) both }
.lgr-chronos-timestop { animation: lgrChronosFreeze 800ms linear both }
/* TIME STOP KEEPS HIS EYES: the freeze greys the drawing part by part instead of as one box, so the frost eyes (the
   face layer lg-fx-timestop) stay out of the grey: every element beside the path down to that layer takes the filter,
   the layer itself never does. The grey amount is one animated custom property on the reaction box (a filter on the
   box would grey the eyes with it; an animation on the parts would replace their own moves). The eyes are pale blue
   with a dark ink edge so they read on the white dial, and the grey veil over the box has a hole over the face. */
@property --lgrChronosGrey { syntax: '<number>'; inherits: true; initial-value: 0 }
.lgr-chronos-timestop svg :has(.lg-fx-timestop) > :not(:has(.lg-fx-timestop)):not(.lg-fx-timestop) { filter: grayscale(var(--lgrChronosGrey)) brightness(calc(1 + var(--lgrChronosGrey) * .15)) }
.lg-boss[data-fx="timestop"] .lg-fx-timestop path[fill="#bfeaff"] { fill: #a6e2ff; stroke: #10283f; stroke-width: 1.1px }
.lg-boss[data-fx="timestop"] .lg-fx-timestop path[fill="#f2fbff"] { opacity: .3 }
.lgr-chronos-paradox { transform-origin: 50% 90%; animation: lgrChronosStagger 600ms ease-in-out both }
.lgr-chronos-grain { transform-origin: 50% 90%; animation: lgrChronosTick 320ms steps(2, end) both }
.lgr-chronos-overflow { transform-origin: 50% 100%; animation: lgrChronosBrim 600ms cubic-bezier(.34,1.56,.64,1) both }
/* fx-layer motion. The ability face layers' hands pivot on the hub (the head's own 0 0). Rewind: the brow hands spin one
   full turn counterclockwise and the red seconds hand spins back twice; the jaw shuts and opens again backwards.
   Paradox: the jaw clacks twice. Every part ends on its drawn pose. */
@keyframes lgrChronosBrowSpin { 0% { transform: rotate(0deg) } 100% { transform: rotate(-360deg) } }
@keyframes lgrChronosSecondsBack { 0% { transform: rotate(0deg) } 100% { transform: rotate(-720deg) } }
@keyframes lgrChronosJawRewind { 0% { transform: none } 30% { transform: translateY(-5px) scaleY(.7) } 55% { transform: none } 80% { transform: translateY(-4px) scaleY(.75) } 100% { transform: none } }
@keyframes lgrChronosJawClack { 0%, 100% { transform: none } 18% { transform: translateY(-4px) scaleY(.75) } 38% { transform: translateY(2px) } 58% { transform: translateY(-4px) scaleY(.75) } 80% { transform: translateY(1px) } }
.lg-boss[data-fx="rewind"] .lgfa-chronos-brow { animation: lgrChronosBrowSpin 1000ms cubic-bezier(.45,0,.2,1) both }
.lg-boss[data-fx="rewind"] .lgfa-chronos-seconds { animation: lgrChronosSecondsBack 1050ms cubic-bezier(.3,.6,.3,1) both }
.lg-boss[data-fx="rewind"] .lgfa-chronos-jaw { animation: lgrChronosJawRewind 1000ms steps(4, end) both }
.lg-boss[data-fx="paradox"] .lgfa-chronos-jaw { animation: lgrChronosJawClack 640ms ease-in-out both }
/* THE REAL PARTS: the state layer this ability draws on the boss (its lg-ab-* sand in the chest glass) moves with the
   moment, not only the whole figure. Played only while data-fx is set (never in focus mode, with Still bosses or under
   reduced motion). */
@keyframes lgrChronosSandShift { 0%, 100% { transform: none } 20% { transform: translateX(2px) rotate(3deg) } 40% { transform: translateX(-2px) rotate(-3deg) } 60% { transform: translateX(1.5px) rotate(2deg) } 80% { transform: translateX(-1px) } }
.lg-boss[data-fx="grain"] [class*="lg-ab-sand-"], .lg-boss[data-fx="overflow"] [class*="lg-ab-sand-"] { transform-box: fill-box; transform-origin: center; animation: lgrChronosSandShift 320ms cubic-bezier(.22,1,.36,1) both }
${PARTS_CSS}
`)),
}
