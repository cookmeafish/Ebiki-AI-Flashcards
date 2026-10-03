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
`,
}
