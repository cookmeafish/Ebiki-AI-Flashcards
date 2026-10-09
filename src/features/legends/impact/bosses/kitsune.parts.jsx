// KITSUNE's own impact parts: drawers merged into impact/parts.jsx PARTS. Name each `kitsune<Name>` (never clashes).
// A drawer is (params, ctx) => node, like the shared ones (ctx: color, accent, glyph, scale, speed); CSS keyframes it
// needs go in `css` (prefix them lgkitsune). Deterministic, container units, transforms and opacity only.
//
// THE DRAWING ACTS EVERY MOMENT (raids/kitsune.svg wrappers):
//   .lg-kitsune-head / -hair   her face and the hair behind it, one pivot at the neck (view-box 60 92)
//   .lg-kitsune-tails          the whole fan of tails per phase (pivot at their root)
//   .lg-kitsune-tailL / -tailR / -tailC   the left four, right four and middle tail, each turning on the same root
//   .lg-kitsune-fires          the ring of fox-fires (phases 1 and 3)      .lg-kitsune-body  the kimono
//   (-headA, -hairA, -tailsA, -firesA are inner wrappers the attack on the player moves: fx/kitsune.jsx)
// hit      her head flinches, the tails bristle out and settle
// crit     her head snaps aside, the nine tails splay wide, the fox-fires scatter round the ring
// sharpen  the right tails are cut down and droop, her head jerks, the kimono flinches
// strike   (after her fox-fire burns your heart) she leans in with a smirk and whips the tails forward
// heavy    the tails rise into a towering fan, then WHIP down; she rears up and slams forward
// block    the tails fold shut in front of her like a closing fan, she ducks behind them
// shield   she turns her face away, the tails swish aside
// wind     a sly tilt of the head, the tails sway lazily, the fox-fires dim
// ko       the fox-fires gutter out, the tails wilt and droop one side then all, her head bows, she sinks
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
@keyframes lgkitsuneFlinch { 0% { transform: none } 14% { transform: rotate(-8deg) translateY(2%) } 44% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgkitsuneBristleL { 0% { transform: none } 14% { transform: rotate(-7deg) } 40% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgkitsuneBristleR { 0% { transform: none } 14% { transform: rotate(7deg) } 40% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgkitsuneSnap { 0% { transform: none } 10% { transform: rotate(16deg) translateX(5%) } 30% { transform: rotate(-6deg) translateX(-2%) } 52% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgkitsuneSplayL { 0% { transform: none } 12% { transform: rotate(-20deg) } 30% { transform: rotate(-14deg) } 48% { transform: rotate(4deg) } 70% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgkitsuneSplayR { 0% { transform: none } 12% { transform: rotate(20deg) } 30% { transform: rotate(14deg) } 48% { transform: rotate(-4deg) } 70% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgkitsuneStretch { 0% { transform: none } 12% { transform: scaleY(1.16) } 40% { transform: scaleY(.95) } 100% { transform: none } }
@keyframes lgkitsuneScatter { 0% { transform: none; opacity: 1 } 12% { transform: scale(1.4) rotate(50deg); opacity: .6 } 30% { transform: scale(1.2) rotate(80deg); opacity: 1 } 100% { transform: rotate(120deg) } }
@keyframes lgkitsuneDroop { 0% { transform: none } 10% { transform: rotate(26deg) } 40% { transform: rotate(20deg) } 70% { transform: rotate(6deg) } 100% { transform: none } }
@keyframes lgkitsuneJerk { 0% { transform: none } 10% { transform: rotate(-10deg) translateX(-3%) } 40% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgkitsuneCower { 0% { transform: none } 12% { transform: scale(.95, 1.03) } 40% { transform: scale(1.01, .99) } 100% { transform: none } }
@keyframes lgkitsuneSmirk { 0% { transform: none } 30% { transform: rotate(11deg) translateX(3%) scale(1.08) } 70% { transform: rotate(8deg) translateX(2%) scale(1.05) } 100% { transform: none } }
@keyframes lgkitsuneWhip { 0% { transform: none } 22% { transform: rotate(-8deg) scale(.96) } 40% { transform: rotate(9deg) scale(1.14) } 64% { transform: rotate(2deg) scale(1.03) } 100% { transform: none } }
@keyframes lgkitsuneFanUpL { 0% { transform: none } 34% { transform: rotate(-16deg) } 48% { transform: rotate(7deg) } 62% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgkitsuneFanUpR { 0% { transform: none } 34% { transform: rotate(16deg) } 48% { transform: rotate(-7deg) } 62% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgkitsuneTower { 0% { transform: none } 34% { transform: translateY(-7%) scale(1.22) } 48% { transform: translateY(4%) scale(1.04, .94) } 64% { transform: scale(1.02) } 100% { transform: none } }
@keyframes lgkitsuneRearSlam { 0% { transform: none } 34% { transform: translateY(-6%) rotate(-6deg) } 48% { transform: translateY(3%) rotate(5deg) scale(1.16) } 66% { transform: scale(1.04) } 100% { transform: none } }
@keyframes lgkitsuneRise { 0% { transform: none } 34% { transform: translateY(-5%) } 48% { transform: translateY(2%) scale(1.05, .93) } 66% { transform: none } 100% { transform: none } }
@keyframes lgkitsuneFoldL { 0% { transform: none } 18% { transform: rotate(34deg) } 60% { transform: rotate(28deg) } 100% { transform: none } }
@keyframes lgkitsuneFoldR { 0% { transform: none } 18% { transform: rotate(-34deg) } 60% { transform: rotate(-28deg) } 100% { transform: none } }
@keyframes lgkitsuneDuck { 0% { transform: none } 18% { transform: translateY(5%) scale(.94) } 60% { transform: translateY(4%) scale(.95) } 100% { transform: none } }
@keyframes lgkitsuneLookAway { 0% { transform: none } 22% { transform: rotate(-14deg) translateX(-4%) } 58% { transform: rotate(-10deg) translateX(-3%) } 100% { transform: none } }
@keyframes lgkitsuneSwish { 0% { transform: none } 22% { transform: rotate(-11deg) } 46% { transform: rotate(7deg) } 70% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgkitsuneSlyTilt { 0% { transform: none } 35% { transform: rotate(9deg) } 70% { transform: rotate(7deg) } 100% { transform: none } }
@keyframes lgkitsuneLazyL { 0%, 100% { transform: none } 30% { transform: rotate(-6deg) } 65% { transform: rotate(4deg) } }
@keyframes lgkitsuneLazyR { 0%, 100% { transform: none } 30% { transform: rotate(6deg) } 65% { transform: rotate(-4deg) } }
@keyframes lgkitsuneDim { 0%, 100% { opacity: 1 } 35%, 70% { opacity: .35 } }
@keyframes lgkitsuneOut { 0% { transform: none; opacity: 1 } 10% { transform: scale(1.15); opacity: 1 } 22% { transform: scale(.9); opacity: .6 } 30% { transform: scale(1.05); opacity: .85 } 46% { transform: scale(.5) rotate(-40deg); opacity: .3 } 58% { transform: scale(.2) rotate(-70deg); opacity: 0 } 100% { transform: scale(.2) rotate(-70deg); opacity: 0 } }
@keyframes lgkitsuneWiltL { 0% { transform: none } 12% { transform: rotate(-8deg) } 30% { transform: rotate(22deg) scaleY(.9) } 60% { transform: rotate(48deg) scaleY(.72) } 66% { transform: rotate(42deg) scaleY(.76) } 100% { transform: rotate(50deg) scaleY(.7) } }
@keyframes lgkitsuneWiltR { 0% { transform: none } 12% { transform: rotate(8deg) } 38% { transform: rotate(-16deg) scaleY(.92) } 60% { transform: rotate(-48deg) scaleY(.72) } 66% { transform: rotate(-42deg) scaleY(.76) } 100% { transform: rotate(-50deg) scaleY(.7) } }
@keyframes lgkitsuneWiltC { 0% { transform: none } 40% { transform: scaleY(.9) } 60% { transform: scaleY(.62) } 100% { transform: scaleY(.6) } }
@keyframes lgkitsuneBow { 0% { transform: none } 12% { transform: rotate(-10deg) translateY(-3%) } 30% { transform: rotate(4deg) } 60% { transform: rotate(18deg) translateY(9%) } 68% { transform: rotate(15deg) translateY(7%) } 100% { transform: rotate(19deg) translateY(10%) } }
@keyframes lgkitsuneSink { 0% { transform: none } 55% { transform: none } 62% { transform: translateY(6%) scale(1.03, .94) } 100% { transform: translateY(6%) scale(1.02, .95) } }
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
${rule('sharpen', 'body', 'lgkitsuneCower 600ms ease-out both')}
${rule('hurt', 'head hair', 'lgkitsuneSmirk 700ms cubic-bezier(.3,.7,.3,1) 200ms both')}
${rule('hurt', 'tails', 'lgkitsuneWhip 640ms cubic-bezier(.3,.7,.3,1) 160ms both')}
${rule('hurtBig', 'tailL', 'lgkitsuneFanUpL 840ms cubic-bezier(.4,0,.2,1) both')}
${rule('hurtBig', 'tailR', 'lgkitsuneFanUpR 840ms cubic-bezier(.4,0,.2,1) both')}
${rule('hurtBig', 'tails', 'lgkitsuneTower 840ms cubic-bezier(.4,0,.2,1) both')}
${rule('hurtBig', 'head hair', 'lgkitsuneRearSlam 840ms cubic-bezier(.4,0,.2,1) both')}
${rule('hurtBig', 'body', 'lgkitsuneRise 840ms cubic-bezier(.4,0,.2,1) both')}
${rule('block', 'tailL', 'lgkitsuneFoldL 640ms cubic-bezier(.2,.9,.3,1) both')}
${rule('block', 'tailR', 'lgkitsuneFoldR 640ms cubic-bezier(.2,.9,.3,1) both')}
${rule('block', 'head hair', 'lgkitsuneDuck 640ms ease-out both')}
${rule('shield', 'head hair', 'lgkitsuneLookAway 700ms ease-out both')}
${rule('shield', 'tails', 'lgkitsuneSwish 700ms ease-out both')}
${rule('wind', 'head hair', 'lgkitsuneSlyTilt 1000ms ease-in-out both')}
${rule('wind', 'tailL', 'lgkitsuneLazyL 1000ms ease-in-out both')}
${rule('wind', 'tailR', 'lgkitsuneLazyR 1000ms ease-in-out both')}
${rule('wind', 'fires', 'lgkitsuneDim 1000ms ease-in-out both')}
${rule('ko', 'fires', 'lgkitsuneOut 2400ms ease-in both')}
${rule('ko', 'tailL', 'lgkitsuneWiltL 2400ms cubic-bezier(.4,0,.6,1) both')}
${rule('ko', 'tailR', 'lgkitsuneWiltR 2400ms cubic-bezier(.4,0,.6,1) both')}
${rule('ko', 'tailC', 'lgkitsuneWiltC 2400ms cubic-bezier(.4,0,.6,1) both')}
${rule('ko', 'head hair', 'lgkitsuneBow 2400ms cubic-bezier(.4,0,.6,1) both')}
${rule('ko', 'body', 'lgkitsuneSink 2400ms ease-in both')}
`

const FIRE = (c) => `radial-gradient(circle at 50% 62%, #ffffff 0 18%, ${c} 42%, ${c}00 72%)`

export default {
  // Her strike: three fox-fire wisps leap off her ring and come at you, growing, one cyan and two pink.
  kitsuneWisps: (p, ctx) => [[-14, 30, '#7fe8ff'], [6, 38, '#ff5a7a'], [24, 26, '#ffd6e0']].map(([x, y, c], i) => (
    <div key={`kw${i}`} style={{ position: 'absolute', left: `${40 + i * 8}%`, top: '30%', width: '16cqw', height: '22cqw', borderRadius: '50% 50% 45% 45% / 65% 65% 35% 35%', background: FIRE(c), filter: `drop-shadow(0 0 2cqw ${c})`,
      '--x': `${x}cqw`, '--y': `${y}cqw`, animation: `lgkitsuneWisp ${700 * ctx.speed}ms cubic-bezier(.4,0,.6,1) ${i * 70}ms both` }} />
  )),
  // Her heavy blow: nine ghostly tails sweep across the camera like a fan snapping open.
  kitsuneSweep: (p, ctx) => Array.from({ length: 9 }, (_, i) => (
    <div key={`ks${i}`} style={{ position: 'absolute', left: '50%', top: '92%', width: '12cqw', height: '78cqw', marginLeft: '-6cqw', marginTop: '-78cqw', transformOrigin: '50% 100%', borderRadius: '50% 50% 30% 30% / 40% 40% 10% 10%',
      background: `linear-gradient(#ffffff, ${i % 2 ? '#7fe8ff' : '#ffd6e0'} 30%, ${i % 2 ? '#7fe8ff00' : '#ff5a7a00'})`, filter: `drop-shadow(0 0 1.5cqw ${i % 2 ? '#7fe8ff' : '#ff5a7a'})`,
      '--r': -64 + i * 16, animation: `lgkitsuneSweep ${820 * ctx.speed}ms cubic-bezier(.3,.7,.3,1) ${i * 28}ms both` }} />
  )),
}
