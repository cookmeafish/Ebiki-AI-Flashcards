// KITSUNE's own impact parts: drawers merged into impact/parts.jsx PARTS. Name each `kitsune<Name>` (never clashes).
// A drawer is (params, ctx) => node, like the shared ones (ctx: color, accent, glyph, scale, speed); CSS keyframes it
// needs go in `css` (prefix them lgkitsune). Deterministic, container units, transforms and opacity only.
//
// THE DRAWING ACTS EVERY MOMENT (raids/kitsune.svg wrappers):
//   .lg-kitsune-head / -hair   her face and the hair behind it, one pivot at the NECK JOINT under her chin (view-box
//                              60 70): every head move is a tilt or a scale ON that joint, never a translate (a head
//                              moved apart from the neck read as "dislocated", the owner 2026-10-10;
//                              dev/legends-gallery/check-joints.mjs fails it)
//   .lg-kitsune-bust           hair + kimono (with the neck) + head + the phase 1 fan arm: what moves the WHOLE figure
//                              (a cower, a rise, a duck, the knockout's sink), so the head rides along
//   .lg-kitsune-mask           the phase 1 fox mask on her head; -maskL / -maskR the two cracked halves in phase 2
//   .lg-kitsune-tails          the whole fan of tails per phase (pivot at their root)
//   .lg-kitsune-tailL / -tailR / -tailC   the left four, right four and middle tail, each turning on the same root
//   .lg-kitsune-fires          the ring of fox-fires (phases 1 and 3)      .lg-kitsune-body  the kimono (never moved alone)
//   (-headA, -hairA, -tailsA, -firesA are inner wrappers the attack on the player moves: fx/kitsune.jsx)
// hit      her head flinches, the tails bristle out and settle
// crit     her head snaps aside, the nine tails splay wide, the fox-fires scatter round the ring
// sharpen  the right tails are cut down and droop, her head jerks, the kimono flinches
// strike   (after her fox-fire burns your heart) she leans in with a smirk and whips the tails forward
// heavy    the tails rise into a towering fan, then WHIP down; she rears up and slams forward
// block    the tails fold shut in front of her like a closing fan, she ducks behind them
// shield   she turns her face away, the tails swish aside
// wind     a sly tilt of the head, the tails sway lazily, the fox-fires dim
// ko       (no spin) frozen on the blow; her power surges: fox-fire flames rise round her, the ring of fires flares,
//          the tails lift shivering, her head is thrown back, the mask trembles; at the climax the nine tails burst
//          into fox-fire, her fox spirit tears away upward, the mask flies off (phase 2: its halves split apart), a
//          shockwave and a storm of petals; then the fires gutter out, the tails wilt, her head bows and she sinks,
//          dimmed. fx/kitsune.jsx holds that fallen pose (data-down).
const sel = (moment, part) => `.lg-boss[data-motif="kitsune"][data-moment="${moment}"] .lg-kitsune-${part}`
// Written as longhands (name, duration, easing, delay): the part rules live in the global impact CSS.
const longhand = (a) => {
  const t = a.match(/cubic-bezier\([^)]*\)|\S+/g)
  const times = t.filter((x) => /^[\d.]+ms$/.test(x))
  const ease = t.find((x) => /^(cubic-bezier|ease|linear)/.test(x)) || 'ease'
  return `animation-name: ${t[0]}; animation-duration: ${times[0]}; animation-timing-function: ${ease}; animation-delay: ${times[1] || '0ms'}; animation-fill-mode: both`
}
const rule = (moment, parts, anim) => `${parts.split(' ').map((p) => sel(moment, p)).join(', ')} { ${longhand(anim)} }`

export const css = `
@keyframes lgkitsuneFlinch { 0% { transform: none } 14% { transform: rotate(-9deg) } 44% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgkitsuneBristleL { 0% { transform: none } 14% { transform: rotate(-7deg) } 40% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgkitsuneBristleR { 0% { transform: none } 14% { transform: rotate(7deg) } 40% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgkitsuneSnap { 0% { transform: none } 10% { transform: rotate(17deg) scale(1.03) } 30% { transform: rotate(-7deg) } 52% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgkitsuneSplayL { 0% { transform: none } 12% { transform: rotate(-20deg) } 30% { transform: rotate(-14deg) } 48% { transform: rotate(4deg) } 70% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgkitsuneSplayR { 0% { transform: none } 12% { transform: rotate(20deg) } 30% { transform: rotate(14deg) } 48% { transform: rotate(-4deg) } 70% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgkitsuneStretch { 0% { transform: none } 12% { transform: scaleY(1.16) } 40% { transform: scaleY(.95) } 100% { transform: none } }
@keyframes lgkitsuneScatter { 0% { transform: none; opacity: 1 } 12% { transform: scale(1.4) rotate(50deg); opacity: .6 } 30% { transform: scale(1.2) rotate(80deg); opacity: 1 } 100% { transform: rotate(120deg) } }
@keyframes lgkitsuneDroop { 0% { transform: none } 10% { transform: rotate(26deg) } 40% { transform: rotate(20deg) } 70% { transform: rotate(6deg) } 100% { transform: none } }
@keyframes lgkitsuneJerk { 0% { transform: none } 10% { transform: rotate(-11deg) } 40% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgkitsuneCower { 0% { transform: none } 12% { transform: scale(.95, 1.03) } 40% { transform: scale(1.01, .99) } 100% { transform: none } }
@keyframes lgkitsuneSmirk { 0% { transform: none } 30% { transform: rotate(11deg) scale(1.08) } 70% { transform: rotate(8deg) scale(1.05) } 100% { transform: none } }
@keyframes lgkitsuneWhip { 0% { transform: none } 22% { transform: rotate(-8deg) scale(.96) } 40% { transform: rotate(9deg) scale(1.14) } 64% { transform: rotate(2deg) scale(1.03) } 100% { transform: none } }
@keyframes lgkitsuneFanUpL { 0% { transform: none } 34% { transform: rotate(-16deg) } 48% { transform: rotate(7deg) } 62% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgkitsuneFanUpR { 0% { transform: none } 34% { transform: rotate(16deg) } 48% { transform: rotate(-7deg) } 62% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgkitsuneTower { 0% { transform: none } 34% { transform: translateY(-7%) scale(1.22) } 48% { transform: translateY(4%) scale(1.04, .94) } 64% { transform: scale(1.02) } 100% { transform: none } }
@keyframes lgkitsuneRearSlam { 0% { transform: none } 34% { transform: rotate(-7deg) scale(1.02) } 48% { transform: rotate(6deg) scale(1.12) } 66% { transform: scale(1.03) } 100% { transform: none } }
@keyframes lgkitsuneRise { 0% { transform: none } 34% { transform: translateY(-3.4px) } 48% { transform: translateY(1.4px) scale(1.03, .96) } 66% { transform: none } 100% { transform: none } }
@keyframes lgkitsuneFoldL { 0% { transform: none } 18% { transform: rotate(34deg) } 60% { transform: rotate(28deg) } 100% { transform: none } }
@keyframes lgkitsuneFoldR { 0% { transform: none } 18% { transform: rotate(-34deg) } 60% { transform: rotate(-28deg) } 100% { transform: none } }
@keyframes lgkitsuneDuck { 0% { transform: none } 18% { transform: rotate(-5deg) scale(.95) } 60% { transform: rotate(-4deg) scale(.96) } 100% { transform: none } }
@keyframes lgkitsuneLookAway { 0% { transform: none } 22% { transform: rotate(-15deg) } 58% { transform: rotate(-11deg) } 100% { transform: none } }
@keyframes lgkitsuneSwish { 0% { transform: none } 22% { transform: rotate(-11deg) } 46% { transform: rotate(7deg) } 70% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgkitsuneSlyTilt { 0% { transform: none } 35% { transform: rotate(9deg) } 70% { transform: rotate(7deg) } 100% { transform: none } }
@keyframes lgkitsuneLazyL { 0%, 100% { transform: none } 30% { transform: rotate(-6deg) } 65% { transform: rotate(4deg) } }
@keyframes lgkitsuneLazyR { 0%, 100% { transform: none } 30% { transform: rotate(6deg) } 65% { transform: rotate(-4deg) } }
@keyframes lgkitsuneDim { 0%, 100% { opacity: 1 } 35%, 70% { opacity: .35 } }
@keyframes lgkitsuneDuckBust { 0% { transform: none } 18% { transform: translateY(4px) scale(.98) } 60% { transform: translateY(3.5px) scale(.98) } 100% { transform: none } }
/* THE KNOCKOUT (2500 ms, climax at 56% = 1400 ms); every part ends in the fallen pose fx/kitsune.jsx holds */
@keyframes lgkitsuneKoFires { 0% { transform: none; opacity: 1 } 8% { transform: scale(1.1); opacity: 1 } 30% { transform: scale(1.12) rotate(25deg); opacity: 1 } 50% { transform: scale(1.2) rotate(45deg); opacity: 1 } 56% { transform: scale(1.28) rotate(55deg); opacity: 1 } 64% { transform: scale(.7) rotate(75deg); opacity: .5 } 74% { transform: scale(.3) rotate(90deg); opacity: 0 } 100% { transform: scale(.3) rotate(90deg); opacity: 0 } }
@keyframes lgkitsuneKoTailL { 0% { transform: none } 3%, 12% { transform: rotate(-4deg) } 26% { transform: rotate(-9deg) scaleY(1.04) } 32% { transform: rotate(-7deg) scaleY(1.04) } 38% { transform: rotate(-11deg) scaleY(1.06) } 44% { transform: rotate(-9deg) scaleY(1.06) } 52% { transform: rotate(-14deg) scaleY(1.08) } 58% { transform: rotate(-24deg) scaleY(1.12) } 72% { transform: rotate(34deg) scaleY(.76) } 80% { transform: rotate(28deg) scaleY(.8) } 100% { transform: rotate(36deg) scaleY(.74) } }
@keyframes lgkitsuneKoTailR { 0% { transform: none } 3%, 12% { transform: rotate(4deg) } 26% { transform: rotate(9deg) scaleY(1.04) } 32% { transform: rotate(7deg) scaleY(1.04) } 38% { transform: rotate(11deg) scaleY(1.06) } 44% { transform: rotate(9deg) scaleY(1.06) } 52% { transform: rotate(14deg) scaleY(1.08) } 58% { transform: rotate(24deg) scaleY(1.12) } 72% { transform: rotate(-34deg) scaleY(.76) } 80% { transform: rotate(-28deg) scaleY(.8) } 100% { transform: rotate(-36deg) scaleY(.74) } }
@keyframes lgkitsuneKoTailC { 0% { transform: none } 26% { transform: scaleY(1.05) } 52% { transform: scaleY(1.1) } 58% { transform: scaleY(1.16) } 72% { transform: scaleY(.66) } 80% { transform: scaleY(.7) } 100% { transform: scaleY(.62) } }
@keyframes lgkitsuneKoHead { 0% { transform: none } 3%, 12% { transform: rotate(-6deg) } 30% { transform: rotate(-9deg) scale(1.03) } 52% { transform: rotate(-11deg) scale(1.05) } 58% { transform: rotate(-12deg) scale(1.06) } 70% { transform: rotate(13deg) scale(.98) } 78% { transform: rotate(10deg) scale(.98) } 100% { transform: rotate(14deg) scale(.97) } }
@keyframes lgkitsuneKoBust { 0% { transform: none } 56% { transform: translateY(-1px) } 70% { transform: translateY(5px) scale(1.02, .95) } 78% { transform: translateY(4px) scale(1.02, .96) } 100% { transform: translateY(5px) scale(1.02, .95) } }
@keyframes lgkitsuneKoMask { 0%, 30% { transform: none; opacity: 1 } 36% { transform: rotate(-7deg) } 42% { transform: rotate(6deg) } 48% { transform: rotate(-9deg) } 54% { transform: rotate(8deg); opacity: 1 } 60% { transform: translate(-4px, -16px) rotate(-50deg) scale(1.1); opacity: 1 } 74% { transform: translate(-12px, -34px) rotate(-150deg) scale(.9); opacity: 0 } 100% { transform: translate(-12px, -34px) rotate(-150deg) scale(.9); opacity: 0 } }
@keyframes lgkitsuneKoMaskL { 0%, 30% { transform: none; opacity: 1 } 40% { transform: rotate(-5deg) } 50% { transform: rotate(4deg) } 56% { transform: rotate(-3deg); opacity: 1 } 64% { transform: translate(-10px, 8px) rotate(-45deg); opacity: 1 } 76% { transform: translate(-22px, 26px) rotate(-110deg); opacity: 0 } 100% { transform: translate(-22px, 26px) rotate(-110deg); opacity: 0 } }
@keyframes lgkitsuneKoMaskR { 0%, 30% { transform: none; opacity: 1 } 40% { transform: rotate(5deg) } 50% { transform: rotate(-4deg) } 56% { transform: rotate(3deg); opacity: 1 } 64% { transform: translate(10px, 8px) rotate(45deg); opacity: 1 } 76% { transform: translate(22px, 26px) rotate(110deg); opacity: 0 } 100% { transform: translate(22px, 26px) rotate(110deg); opacity: 0 } }
@keyframes lgkitsuneFlare { 0% { transform: scale(.2); opacity: 0 } 18% { transform: scale(.85); opacity: 1 } 36% { transform: scale(1.05, .92); opacity: 1 } 54% { transform: scale(.95, 1.12) } 78% { transform: scale(1.35); opacity: 1 } 90% { transform: scale(.6, .4); opacity: .7 } 100% { transform: scale(.1, 0); opacity: 0 } }
@keyframes lgkitsuneSpirit { 0% { transform: translateY(6cqw) scale(.6); opacity: 0 } 14% { transform: translateY(0) scale(.9); opacity: .9 } 50% { transform: translateY(-10cqw) scale(1.05); opacity: .75 } 100% { transform: translateY(-22cqw) scale(1.2); opacity: 0 } }
@keyframes lgkitsuneWisp { 0% { transform: translate(0, 0) scale(.3); opacity: 0 } 15% { opacity: 1 } 70% { transform: translate(var(--x), var(--y)) scale(1.6); opacity: 1 } 100% { transform: translate(calc(var(--x) * 1.2), calc(var(--y) * 1.2)) scale(2.4); opacity: 0 } }
@keyframes lgkitsuneSweep { 0% { transform: rotate(-150deg) scaleY(.6); opacity: 0 } 18% { opacity: .95 } 55% { transform: rotate(calc(var(--r) * 1deg)) scaleY(1.05); opacity: .95 } 100% { transform: rotate(calc(var(--r) * 1deg + 40deg)) scaleY(1); opacity: 0 } }
${rule('hit', 'head hair', 'lgkitsuneFlinch 540ms ease-out both')}
${rule('hit', 'tailL', 'lgkitsuneBristleL 520ms ease-out both')}
${rule('hit', 'tailR', 'lgkitsuneBristleR 520ms ease-out both')}
${rule('crit', 'head hair', 'lgkitsuneSnap 700ms cubic-bezier(.2,.9,.3,1) both')}
${rule('crit', 'tailL', 'lgkitsuneSplayL 720ms cubic-bezier(.2,.9,.3,1) both')}
${rule('crit', 'tailR', 'lgkitsuneSplayR 720ms cubic-bezier(.2,.9,.3,1) both')}
${rule('crit', 'tailC', 'lgkitsuneStretch 700ms ease-out both')}
${rule('crit', 'fires', 'lgkitsuneScatter 720ms ease-out both')}
${rule('sharpen', 'tailR', 'lgkitsuneDroop 760ms cubic-bezier(.15,.9,.3,1) both')}
${rule('sharpen', 'head hair', 'lgkitsuneJerk 600ms ease-out both')}
${rule('sharpen', 'bust', 'lgkitsuneCower 600ms ease-out both')}
${rule('hurt', 'head hair', 'lgkitsuneSmirk 700ms cubic-bezier(.3,.7,.3,1) 200ms both')}
${rule('hurt', 'tails', 'lgkitsuneWhip 640ms cubic-bezier(.3,.7,.3,1) 160ms both')}
${rule('hurtBig', 'tailL', 'lgkitsuneFanUpL 840ms cubic-bezier(.4,0,.2,1) both')}
${rule('hurtBig', 'tailR', 'lgkitsuneFanUpR 840ms cubic-bezier(.4,0,.2,1) both')}
${rule('hurtBig', 'tails', 'lgkitsuneTower 840ms cubic-bezier(.4,0,.2,1) both')}
${rule('hurtBig', 'head hair', 'lgkitsuneRearSlam 840ms cubic-bezier(.4,0,.2,1) both')}
${rule('hurtBig', 'bust', 'lgkitsuneRise 840ms cubic-bezier(.4,0,.2,1) both')}
${rule('block', 'tailL', 'lgkitsuneFoldL 640ms cubic-bezier(.2,.9,.3,1) both')}
${rule('block', 'tailR', 'lgkitsuneFoldR 640ms cubic-bezier(.2,.9,.3,1) both')}
${rule('block', 'head hair', 'lgkitsuneDuck 640ms ease-out both')}
${rule('block', 'bust', 'lgkitsuneDuckBust 640ms ease-out both')}
${rule('shield', 'head hair', 'lgkitsuneLookAway 700ms ease-out both')}
${rule('shield', 'tails', 'lgkitsuneSwish 700ms ease-out both')}
${rule('wind', 'head hair', 'lgkitsuneSlyTilt 1000ms ease-in-out both')}
${rule('wind', 'tailL', 'lgkitsuneLazyL 1000ms ease-in-out both')}
${rule('wind', 'tailR', 'lgkitsuneLazyR 1000ms ease-in-out both')}
${rule('wind', 'fires', 'lgkitsuneDim 1000ms ease-in-out both')}
${rule('ko', 'fires', 'lgkitsuneKoFires 2500ms ease-out both')}
${rule('ko', 'tailL', 'lgkitsuneKoTailL 2500ms cubic-bezier(.3,.6,.4,1) both')}
${rule('ko', 'tailR', 'lgkitsuneKoTailR 2500ms cubic-bezier(.3,.6,.4,1) both')}
${rule('ko', 'tailC', 'lgkitsuneKoTailC 2500ms cubic-bezier(.3,.6,.4,1) both')}
${rule('ko', 'head hair', 'lgkitsuneKoHead 2500ms cubic-bezier(.3,.6,.4,1) both')}
${rule('ko', 'bust', 'lgkitsuneKoBust 2500ms cubic-bezier(.3,.6,.4,1) both')}
${rule('ko', 'mask', 'lgkitsuneKoMask 2500ms ease-out both')}
${rule('ko', 'maskL', 'lgkitsuneKoMaskL 2500ms ease-out both')}
${rule('ko', 'maskR', 'lgkitsuneKoMaskR 2500ms ease-out both')}
`

const FIRE = (c) => `radial-gradient(circle at 50% 62%, #ffffff 0 18%, ${c} 42%, ${c}00 72%)`

export default {
  // Her strike: three fox-fire wisps leap off her ring and come at you, growing, one cyan and two pink.
  kitsuneWisps: (p, ctx) => [[-14, 30, '#7fe8ff'], [6, 38, '#ff5a7a'], [24, 26, '#ffd6e0']].map(([x, y, c], i) => (
    <div key={`kw${i}`} style={{ position: 'absolute', left: `${40 + i * 8}%`, top: '30%', width: '16cqw', height: '22cqw', borderRadius: '50% 50% 45% 45% / 65% 65% 35% 35%', background: FIRE(c), filter: `drop-shadow(0 0 2cqw ${c})`,
      '--x': `${x}cqw`, '--y': `${y}cqw`, animation: `lgkitsuneWisp ${700 * ctx.speed}ms cubic-bezier(.4,0,.6,1) ${i * 70}ms both` }} />
  )),
  // Her knockout build-up: nine fox-fire flames rise round her silhouette (beside the shoulders, round the head, never
  // over the face), flare, and gutter out just before the climax.
  kitsuneFlare: (p, ctx) => Array.from({ length: 9 }, (_, i) => {
    const a = (Math.PI * (i + 0.5)) / 9 // an arch over her, left shoulder to right shoulder
    const x = 50 - Math.cos(a) * 52, y = 74 - Math.sin(a) * 70
    const c = i % 3 === 1 ? '#7fe8ff' : '#ff5a7a'
    return (
      <div key={`kf${i}`} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 0, height: 0 }}>
        <div style={{ position: 'absolute', left: '-7cqw', top: '-20cqw', width: '14cqw', height: '20cqw', transformOrigin: '50% 100%', borderRadius: '50% 50% 45% 45% / 65% 65% 35% 35%', background: FIRE(c), filter: `drop-shadow(0 0 1.6cqw ${c})`,
          animation: `lgkitsuneFlare ${(p.ms || 1100) * ctx.speed}ms cubic-bezier(.3,.7,.4,1) ${Math.round(Math.abs(i - 4) * 45)}ms both` }} />
      </div>
    )
  }),
  // Her climax: her fox spirit (a fox head of white fox-fire with nine flame tails) tears away from her and rises, fading.
  kitsuneSpirit: (p, ctx) => (
    <div key="ksp" style={{ position: 'absolute', left: '50%', top: '6%', width: 0, height: 0 }}>
      <div style={{ position: 'absolute', left: '-30cqw', top: '-26cqw', width: '60cqw', height: '52cqw', filter: 'drop-shadow(0 0 2.5cqw #7fe8ff) drop-shadow(0 0 1cqw #ffffff)',
        animation: `lgkitsuneSpirit ${(p.ms || 1000) * ctx.speed}ms cubic-bezier(.25,.7,.4,1) both` }}>
        <svg viewBox="0 0 120 100" width="100%" height="100%" aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => <path key={i} d="M60 64 C52 46 50 26 60 6 C70 26 68 46 60 64Z" fill={i % 2 ? '#7fe8ff' : '#ffd6e0'} opacity=".55" transform={`rotate(${-80 + i * 20} 60 64)`} />)}
          <path d="M60 86 L46 76 L40 60 L38 44 L48 52 L56 50 L60 50 L64 50 L72 52 L82 44 L80 60 L74 76Z" fill="#ffffff" opacity=".9" />
          <path d="M48 64 L56 66 M72 64 L64 66" stroke="#7fe8ff" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M60 50 L57 58 L60 62 L63 58Z" fill="#ff5a7a" />
        </svg>
      </div>
    </div>
  ),
  // Her heavy blow: nine ghostly tails sweep across the camera like a fan snapping open.
  kitsuneSweep: (p, ctx) => Array.from({ length: 9 }, (_, i) => (
    <div key={`ks${i}`} style={{ position: 'absolute', left: '50%', top: '92%', width: '12cqw', height: '78cqw', marginLeft: '-6cqw', marginTop: '-78cqw', transformOrigin: '50% 100%', borderRadius: '50% 50% 30% 30% / 40% 40% 10% 10%',
      background: `linear-gradient(#ffffff, ${i % 2 ? '#7fe8ff' : '#ffd6e0'} 30%, ${i % 2 ? '#7fe8ff00' : '#ff5a7a00'})`, filter: `drop-shadow(0 0 1.5cqw ${i % 2 ? '#7fe8ff' : '#ff5a7a'})`,
      '--r': -64 + i * 16, animation: `lgkitsuneSweep ${820 * ctx.speed}ms cubic-bezier(.3,.7,.3,1) ${i * 28}ms both` }} />
  )),
}
