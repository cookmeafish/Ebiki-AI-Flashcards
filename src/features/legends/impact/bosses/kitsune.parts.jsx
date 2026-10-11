// KITSUNE's own impact parts: drawers merged into impact/parts.jsx PARTS. Name each `kitsune<Name>` (never clashes).
// A drawer is (params, ctx) => node, like the shared ones (ctx: color, accent, glyph, scale, speed); CSS keyframes it
// needs go in `css` (prefix them lgkitsune). Deterministic, container units, transforms and opacity only.
//
// THE DRAWING ACTS EVERY MOMENT (raids/kitsune.svg wrappers):
//   .lg-kitsune-head / -hair   her face and the hair behind it, one pivot on her CHIN SEAM, where the neck meets it (view-box
//                              60 81): every head move is a TILT on that joint, never a translate (a head moved apart
//                              from the neck read as "dislocated", the owner 2026-10-10; check-joints.mjs fails it)
//                              and never a scale up (her ears and hair spikes reach the top of the frame)
//   .lg-kitsune-bust           hair + kimono (with the neck) + head + the phase 1 fan arm: what moves the WHOLE figure
//                              (a cower, a crouch, a duck, the knockout's sink), so the head rides along
//   .lg-kitsune-mask           the phase 1 fox mask on her head; -maskL / -maskR the two cracked halves in phase 2
//   .lg-kitsune-up / -down     her own eyes and mouth (phases 2 and 3) / the defeated face the knockout swaps in
//   .lg-kitsune-tails          the whole fan of tails per phase (pivot at their root)
//   .lg-kitsune-tailL / -tailR / -tailC   the left four, right four and middle tail, each turning on the same root
//   .lg-kitsune-fires          the ring of fox-fires (phases 1 and 3)      .lg-kitsune-body  the kimono (never moved alone)
//   (-headA, -hairA, -tailsA, -firesA are inner wrappers the attack on the player moves: fx/kitsune.jsx)
// THE FAN FILLS THE FRAME (phase 2 flung wide, phase 3's corona: the owner's phase contrast), so a tail can only FOLD
// INWARD in a fight moment, never swing out: `fold` writes those keyframes and pulls the fan in by how far it turns, so
// no tip ever passes the arena's clip (dev/legends-gallery/check-moment-clip.mjs fails a cut).
// hit      her head flinches, the tails bristle in and settle
// crit     her head snaps aside, the nine tails clench shut and spring back, the fox-fires scatter round the ring
// sharpen  the right tails recoil as if cut, her head jerks, the kimono flinches
// strike   (after her fox-fire burns your heart) she tilts in with a smirk and whips the tails forward
// heavy    the tails coil low, then WHIP up and in; she rears and slams forward
// block    the tails fold shut in front of her like a closing fan, she ducks behind them
// shield   she turns her face away, the tails swish in
// wind     a sly tilt of the head, the tails sway lazily, the fox-fires dim
// ko       (no spin) frozen on the blow; fox-fire flames rise all round her as she is lifted, trembling, her
//          head thrown back and jerking against the fire, the mask shaking; at the climax she glows, her tails
//          burst into fox-fire and break loose, her fox spirit tears away above her ears, the mask flies off
//          (phase 2: its halves split apart), a shockwave from her chest and a storm of petals; then the fires gutter
//          out, the tails wilt in, her face falls (eyes shut, a frown), her head bows and she sinks, dimmed.
//          fx/kitsune.jsx holds that fallen pose (data-down).
const sel = (moment, part) => `.lg-boss[data-motif="kitsune"][data-moment="${moment}"] .lg-kitsune-${part}`
// Written as longhands (name, duration, easing, delay): the part rules live in the global impact CSS.
const longhand = (a) => {
  const t = a.match(/cubic-bezier\([^)]*\)|\S+/g)
  const times = t.filter((x) => /^[\d.]+ms$/.test(x))
  const ease = t.find((x) => /^(cubic-bezier|ease|linear)/.test(x)) || 'ease'
  return `animation-name: ${t[0]}; animation-duration: ${times[0]}; animation-timing-function: ${ease}; animation-delay: ${times[1] || '0ms'}; animation-fill-mode: both`
}
const rule = (moment, parts, anim) => `${parts.split(' ').map((p) => sel(moment, p)).join(', ')} { ${longhand(anim)} }`

// A side of tails folding INWARD by `f` degrees (L turns clockwise, R counter-clockwise), shrunk toward their root by
// as much as the turn could lift a tip (upper tails rise when they turn toward upright, the lowest ones swing wider),
// times an extra scale `s` (never above 1). frames: [percent, f, s?, extra transform?, extra declarations?].
export const FOLD_PULL = 0.0095
export const foldT = (side, f, s = 1, extra = '') => {
  const k = Math.min(1, s) / (1 + FOLD_PULL * Math.abs(f))
  const turn = f ? `rotate(${side === 'L' ? f : -f}deg) ` : ''
  const t = `${turn}${k < 0.9995 ? `scale(${+k.toFixed(3)}) ` : ''}${extra}`.trim()
  return t || 'none'
}
export const fold = (name, side, frames) => `@keyframes ${name} { ${frames.map(([p, f, s, extra, decl]) => `${p} { transform: ${foldT(side, f, s, extra)}${decl ? `; ${decl}` : ''} }`).join(' ')} }`
const pair = (name, frames) => fold(name + 'L', 'L', frames) + '\n' + fold(name + 'R', 'R', frames)

// THE KNOCKOUT clock (impact/bosses/kitsune.js koMs / koPeak): 2500 ms, the climax at 56% (1400 ms).
const KO_TAIL = [['0%', 0], ['3%, 12%', 3], ['20%', 7, 0.99], ['24%', 4], ['28%', 9, 0.99], ['32%', 6], ['36%', 11, 0.98], ['40%', 8], ['44%', 13, 0.97], ['48%', 10], ['53%', 15, 0.96, '', 'filter: brightness(1.05)'],
  ['57%', 4, 0.8, '', 'filter: brightness(1.1)'], ['64%', 26, 0.85, 'scaleY(.9)', 'filter: brightness(1.2)'], ['72%', 40, 1, 'scaleY(.74)', 'filter: brightness(1)'], ['80%', 35, 1, 'scaleY(.78)'], ['100%', 42, 1, 'scaleY(.72)']]

export const css = `
@keyframes lgkitsuneFlinch { 0% { transform: none } 14% { transform: rotate(-9deg) } 44% { transform: rotate(3deg) } 100% { transform: none } }
${pair('lgkitsuneBristle', [['0%', 0], ['14%', 9, 0.97], ['40%', 2], ['100%', 0]])}
@keyframes lgkitsuneSnap { 0% { transform: none } 10% { transform: rotate(17deg) scale(.95) } 30% { transform: rotate(-7deg) scale(.99) } 52% { transform: rotate(3deg) } 100% { transform: none } }
${pair('lgkitsuneClench', [['0%', 0], ['12%', 24, 0.95], ['30%', 16], ['48%', 0, 0.97], ['70%', 3], ['100%', 0]])}
@keyframes lgkitsuneStretch { 0% { transform: none } 12% { transform: scaleY(.84) } 40% { transform: scaleY(.98) } 100% { transform: none } }
@keyframes lgkitsuneScatter { 0% { transform: none; opacity: 1 } 12% { transform: scale(1.1) rotate(50deg); opacity: .6 } 30% { transform: scale(1.06) rotate(80deg); opacity: 1 } 100% { transform: rotate(120deg) } }
${fold('lgkitsuneCutR', 'R', [['0%', 0], ['10%', 20, 0.86], ['40%', 15, 0.9], ['70%', 5], ['100%', 0]])}
@keyframes lgkitsuneJerk { 0% { transform: none } 10% { transform: rotate(-11deg) } 40% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgkitsuneCower { 0% { transform: none } 12% { transform: scale(.95, .97) } 40% { transform: scale(1.01, .99) } 100% { transform: none } }
@keyframes lgkitsuneSmirk { 0% { transform: none } 30% { transform: rotate(11deg) scale(.97) } 70% { transform: rotate(8deg) scale(.98) } 100% { transform: none } }
${pair('lgkitsuneWhip', [['0%', 0], ['22%', 0, 0.9], ['40%', 16], ['64%', 4], ['100%', 0]])}
@keyframes lgkitsuneWhipC { 0% { transform: none } 22% { transform: scaleY(.88) } 40% { transform: scaleY(.98) } 100% { transform: none } }
${pair('lgkitsuneFanUp', [['0%', 0], ['34%', 0, 0.86], ['48%', 22], ['62%', 6], ['100%', 0]])}
@keyframes lgkitsuneTower { 0% { transform: none } 34% { transform: translateY(4px) scale(.9) } 48% { transform: none } 64% { transform: scale(.98) } 100% { transform: none } }
@keyframes lgkitsuneRearSlam { 0% { transform: none } 34% { transform: rotate(-7deg) } 48% { transform: rotate(6deg) } 66% { transform: rotate(1deg) } 100% { transform: none } }
@keyframes lgkitsuneRise { 0% { transform: none } 34% { transform: translateY(2px) scale(1, .97) } 48% { transform: translateY(3px) scale(1.04, .94) } 66% { transform: none } 100% { transform: none } }
${pair('lgkitsuneFold', [['0%', 0], ['18%', 34], ['60%', 28], ['100%', 0]])}
@keyframes lgkitsuneDuck { 0% { transform: none } 18% { transform: rotate(-5deg) scale(.95) } 60% { transform: rotate(-4deg) scale(.96) } 100% { transform: none } }
@keyframes lgkitsuneLookAway { 0% { transform: none } 22% { transform: rotate(-15deg) scale(.95) } 58% { transform: rotate(-11deg) scale(.97) } 100% { transform: none } }
${pair('lgkitsuneSwish', [['0%', 0], ['22%', 14], ['46%', 4], ['70%', 0, 0.97], ['100%', 0]])}
@keyframes lgkitsuneSlyTilt { 0% { transform: none } 35% { transform: rotate(9deg) } 70% { transform: rotate(7deg) } 100% { transform: none } }
${pair('lgkitsuneLazy', [['0%, 100%', 0], ['30%', 7], ['65%', 1]])}
@keyframes lgkitsuneDim { 0%, 100% { opacity: 1 } 35%, 70% { opacity: .35 } }
@keyframes lgkitsuneDuckBust { 0% { transform: none } 18% { transform: translateY(4px) scale(.98) } 60% { transform: translateY(3.5px) scale(.98) } 100% { transform: none } }
/* THE KNOCKOUT (2500 ms, climax at 56% = 1400 ms); every part ends in the fallen pose fx/kitsune.jsx holds */
@keyframes lgkitsuneKoFires { 0% { transform: none; opacity: 1 } 8% { transform: scale(1.04); opacity: 1 } 30% { transform: scale(1.08) rotate(25deg); opacity: 1 } 50% { transform: scale(1.1) rotate(45deg); opacity: 1 } 56% { transform: scale(1.12) rotate(55deg); opacity: 1; filter: brightness(1.1) } 64% { transform: scale(.7) rotate(75deg); opacity: .5; filter: none } 74% { transform: scale(.3) rotate(90deg); opacity: 0 } 100% { transform: scale(.3) rotate(90deg); opacity: 0 } }
${fold('lgkitsuneKoTailL', 'L', KO_TAIL)}
${fold('lgkitsuneKoTailR', 'R', KO_TAIL)}
@keyframes lgkitsuneKoTailC { 0% { transform: none } 52% { transform: scaleY(.97); filter: brightness(1.05) } 57% { transform: scaleY(.8); filter: brightness(1.1) } 64% { transform: scaleY(.7); filter: brightness(1.2) } 72% { transform: scaleY(.6); filter: brightness(1) } 100% { transform: scaleY(.58) } }
@keyframes lgkitsuneKoHead { 0% { transform: none } 3%, 12% { transform: rotate(-6deg) } 16% { transform: rotate(-13deg) scale(.97) } 20% { transform: rotate(-9deg) scale(.97) } 25% { transform: rotate(-14deg) scale(.97) } 30% { transform: rotate(-10deg) scale(.97) } 36% { transform: rotate(-14deg) scale(.96) } 41% { transform: rotate(-10deg) scale(.96) } 47% { transform: rotate(-15deg) scale(.96) } 52% { transform: rotate(-11deg) scale(.96) } 58% { transform: rotate(-12deg) scale(.96) } 70% { transform: rotate(13deg) scale(.98) } 78% { transform: rotate(10deg) scale(.98) } 100% { transform: rotate(14deg) scale(.97) } }
@keyframes lgkitsuneKoBust { 0% { transform: none } 56% { transform: none } 70% { transform: translateY(5px) scale(1.02, .95) } 78% { transform: translateY(4px) scale(1.02, .96) } 100% { transform: translateY(5px) scale(1.02, .95) } }
@keyframes lgkitsuneKoMask { 0%, 30% { transform: none; opacity: 1 } 36% { transform: rotate(-7deg) } 42% { transform: rotate(6deg) } 48% { transform: rotate(-9deg) } 54% { transform: rotate(8deg); opacity: 1 } 60% { transform: translate(6px, -6px) rotate(40deg) scale(1.05); opacity: 1 } 74% { transform: translate(16px, 26px) rotate(130deg) scale(.9); opacity: 0 } 100% { transform: translate(16px, 26px) rotate(130deg) scale(.9); opacity: 0 } }
@keyframes lgkitsuneKoMaskL { 0%, 30% { transform: none; opacity: 1 } 40% { transform: rotate(-5deg) } 50% { transform: rotate(4deg) } 56% { transform: rotate(-3deg); opacity: 1 } 64% { transform: translate(-10px, 8px) rotate(-45deg); opacity: 1 } 76% { transform: translate(-18px, 22px) rotate(-110deg); opacity: 0 } 100% { transform: translate(-18px, 22px) rotate(-110deg); opacity: 0 } }
@keyframes lgkitsuneKoMaskR { 0%, 30% { transform: none; opacity: 1 } 40% { transform: rotate(5deg) } 50% { transform: rotate(-4deg) } 56% { transform: rotate(3deg); opacity: 1 } 64% { transform: translate(10px, 8px) rotate(45deg); opacity: 1 } 76% { transform: translate(18px, 22px) rotate(110deg); opacity: 0 } 100% { transform: translate(18px, 22px) rotate(110deg); opacity: 0 } }
@keyframes lgkitsuneFaceUp { 0%, 63% { opacity: 1 } 66%, 100% { opacity: 0 } }
@keyframes lgkitsuneFaceDown { 0%, 63% { opacity: 0 } 66%, 100% { opacity: 1 } }
@keyframes lgkitsuneFlare { 0% { transform: scale(.2, .1); opacity: 0 } 14% { transform: scale(.8); opacity: 1 } 80% { transform: scale(1.25, 1.35); opacity: 1 } 90% { transform: scale(.7, .5); opacity: .8 } 100% { transform: scale(.1, 0); opacity: 0 } }
@keyframes lgkitsuneFlicker { 0% { transform: scale(1, 1) skewX(0deg) } 33% { transform: scale(.88, 1.12) skewX(-6deg) } 66% { transform: scale(1.08, .92) skewX(5deg) } 100% { transform: scale(1, 1) skewX(0deg) } }
@keyframes lgkitsuneSpirit { 0% { transform: translateY(30cqw) scale(.35); opacity: 0 } 8% { transform: translateY(18cqw) scale(.6); opacity: .9 } 22% { transform: translateY(0) scale(1); opacity: 1 } 80% { transform: translateY(-1cqw) scale(1.02); opacity: 1 } 100% { transform: translateY(-2cqw) scale(1.03); opacity: 0 } }
@keyframes lgkitsuneShock { 0% { transform: translate(var(--x0), var(--y0)) rotate(var(--r)) scale(.4); opacity: 0 } 15% { opacity: 1 } 100% { transform: translate(var(--x1), var(--y1)) rotate(calc(var(--r) + var(--spin))) scale(1); opacity: 0 } }
@keyframes lgkitsuneWisp { 0% { transform: translate(0, 0) scale(.3); opacity: 0 } 15% { opacity: 1 } 70% { transform: translate(var(--x), var(--y)) scale(1.6); opacity: 1 } 100% { transform: translate(calc(var(--x) * 1.2), calc(var(--y) * 1.2)) scale(2.4); opacity: 0 } }
@keyframes lgkitsuneSweep { 0% { transform: rotate(-150deg) scaleY(.6); opacity: 0 } 18% { opacity: .95 } 55% { transform: rotate(calc(var(--r) * 1deg)) scaleY(1.05); opacity: .95 } 100% { transform: rotate(calc(var(--r) * 1deg + 40deg)) scaleY(1); opacity: 0 } }
${rule('hit', 'head hair', 'lgkitsuneFlinch 540ms ease-out both')}
${rule('hit', 'tailL', 'lgkitsuneBristleL 520ms ease-out both')}
${rule('hit', 'tailR', 'lgkitsuneBristleR 520ms ease-out both')}
${rule('crit', 'head hair', 'lgkitsuneSnap 700ms cubic-bezier(.2,.9,.3,1) both')}
${rule('crit', 'tailL', 'lgkitsuneClenchL 720ms cubic-bezier(.2,.9,.3,1) both')}
${rule('crit', 'tailR', 'lgkitsuneClenchR 720ms cubic-bezier(.2,.9,.3,1) both')}
${rule('crit', 'tailC', 'lgkitsuneStretch 700ms ease-out both')}
${rule('crit', 'fires', 'lgkitsuneScatter 720ms ease-out both')}
${rule('sharpen', 'tailR', 'lgkitsuneCutR 760ms cubic-bezier(.15,.9,.3,1) both')}
${rule('sharpen', 'head hair', 'lgkitsuneJerk 600ms ease-out both')}
${rule('sharpen', 'bust', 'lgkitsuneCower 600ms ease-out both')}
${rule('hurt', 'head hair', 'lgkitsuneSmirk 700ms cubic-bezier(.3,.7,.3,1) 200ms both')}
${rule('hurt', 'tailL', 'lgkitsuneWhipL 640ms cubic-bezier(.3,.7,.3,1) 160ms both')}
${rule('hurt', 'tailR', 'lgkitsuneWhipR 640ms cubic-bezier(.3,.7,.3,1) 160ms both')}
${rule('hurt', 'tailC', 'lgkitsuneWhipC 640ms cubic-bezier(.3,.7,.3,1) 160ms both')}
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
${rule('shield', 'tailL', 'lgkitsuneSwishL 700ms ease-out both')}
${rule('shield', 'tailR', 'lgkitsuneSwishR 700ms ease-out both')}
${rule('wind', 'head hair', 'lgkitsuneSlyTilt 1000ms ease-in-out both')}
${rule('wind', 'tailL', 'lgkitsuneLazyL 1000ms ease-in-out both')}
${rule('wind', 'tailR', 'lgkitsuneLazyR 1000ms ease-in-out both')}
${rule('wind', 'fires', 'lgkitsuneDim 1000ms ease-in-out both')}
${rule('ko', 'fires', 'lgkitsuneKoFires 2500ms ease-out both')}
${rule('ko', 'tailL', 'lgkitsuneKoTailL 2500ms linear both')}
${rule('ko', 'tailR', 'lgkitsuneKoTailR 2500ms linear both')}
${rule('ko', 'tailC', 'lgkitsuneKoTailC 2500ms linear both')}
${rule('ko', 'head hair', 'lgkitsuneKoHead 2500ms cubic-bezier(.3,.6,.4,1) both')}
${rule('ko', 'bust', 'lgkitsuneKoBust 2500ms cubic-bezier(.3,.6,.4,1) both')}
${rule('ko', 'mask', 'lgkitsuneKoMask 2500ms ease-out both')}
${rule('ko', 'maskL', 'lgkitsuneKoMaskL 2500ms ease-out both')}
${rule('ko', 'maskR', 'lgkitsuneKoMaskR 2500ms ease-out both')}
${rule('ko', 'up', 'lgkitsuneFaceUp 2500ms linear both')}
${rule('ko', 'down', 'lgkitsuneFaceDown 2500ms linear both')}
${sel('ko', 'down')} { display: inline !important }
`

const FIRE = (c) => `radial-gradient(circle at 50% 62%, #ffffff 0 18%, ${c} 42%, ${c}00 72%)`
const INK = '#1d2230'

export default {
  // Her strike: three fox-fire wisps leap off her ring and come at you, growing, one cyan and two pink.
  kitsuneWisps: (p, ctx) => [[-14, 30, '#7fe8ff'], [6, 38, '#ff5a7a'], [24, 26, '#ffd6e0']].map(([x, y, c], i) => (
    <div key={`kw${i}`} style={{ position: 'absolute', left: `${40 + i * 8}%`, top: '30%', width: '16cqw', height: '22cqw', borderRadius: '50% 50% 45% 45% / 65% 65% 35% 35%', background: FIRE(c), filter: `drop-shadow(0 0 2cqw ${c})`,
      '--x': `${x}cqw`, '--y': `${y}cqw`, animation: `lgkitsuneWisp ${700 * ctx.speed}ms cubic-bezier(.4,0,.6,1) ${i * 70}ms both` }} />
  )),
  // Her knockout build-up: nine fox-fire FLAMES (inked teardrops with a white-hot core, each flickering) rise all round
  // her silhouette, beside the shoulders and over the head, never over the face; they swell and gutter out just before
  // the climax.
  kitsuneFlare: (p, ctx) => Array.from({ length: 9 }, (_, i) => {
    const a = (Math.PI * (i + 0.5)) / 9 // an arch over her, left shoulder to right shoulder
    const x = 50 - Math.cos(a) * 50, y = 82 - Math.sin(a) * 78
    const c = i % 3 === 1 ? '#7fe8ff' : '#ff5a7a'
    const lean = Math.round(-Math.cos(a) * 18)
    const ms = (p.ms || 1150) * ctx.speed
    return (
      <div key={`kf${i}`} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 0, height: 0 }}>
        <div style={{ position: 'absolute', left: '-6.5cqw', top: '-19cqw', width: '13cqw', height: '19cqw', transformOrigin: '50% 100%', rotate: `${lean}deg`,
          filter: `drop-shadow(0 0 1.4cqw ${c})`, animation: `lgkitsuneFlare ${ms}ms cubic-bezier(.3,.7,.4,1) ${Math.round(Math.abs(i - 4) * 45)}ms both` }}>
          <div style={{ width: '100%', height: '100%', transformOrigin: '50% 100%', animation: `lgkitsuneFlicker ${Math.round(150 + (i % 3) * 30)}ms ease-in-out ${Math.round(Math.abs(i - 4) * 45)}ms 6` }}>
            <svg viewBox="0 0 20 30" width="100%" height="100%" aria-hidden="true">
              <path d="M10 0.8 C12 6 18 11 17.6 19 C17.3 25 14 29 10 29 C6 29 2.7 25 2.4 19 C2.2 14 5 12 6.4 8 C7 11 8.4 12.4 9.4 12 C8.6 8 9.2 4 10 0.8Z" fill={c} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M10 10 C11.6 14 14 17 13.6 21.6 C13.4 25 12 27 10 27 C8 27 6.6 25 6.4 21.6 C6.2 18.6 8.4 15 10 10Z" fill="#ffffff" />
            </svg>
          </div>
        </div>
      </div>
    )
  }),
  // Her climax: her fox spirit tears out of her and AWAY: a white fox-fire fox head (ears, cyan eyes, her red marking)
  // crowned by nine flame tails, opaque and inked so it reads at the small arena size. It shoots up out of her in a
  // tenth of a second and hangs ABOVE her ears with a clear gap (never on her crown, where it read as a headdress or a
  // second face: round 3 review), then fades late (the DEFEATED plate lands under it, never over it). It lives in the
  // knockout's clip (inset(-20%)): it rests in the headroom over the box, -20% to +12%, while she drops below it (her
  // body move falls from the climax on), so a gap opens between her ears and the spirit.
  kitsuneSpirit: (p, ctx) => (
    <div key="ksp" style={{ position: 'absolute', left: '50%', top: `${p.top ?? 0}%`, width: 0, height: 0 }}>
      <div style={{ position: 'absolute', left: '-23cqw', top: '-20cqw', width: '46cqw', height: '32cqw', filter: 'drop-shadow(0 0 2cqw #7fe8ff) drop-shadow(0 0 0.6cqw #ffffff)',
        animation: `lgkitsuneSpirit ${(p.ms || 1050) * ctx.speed}ms cubic-bezier(.2,.8,.3,1) both` }}>
        <svg viewBox="4 4 136 94" width="100%" height="100%" aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => <path key={i} d="M72 70 C64 52 63 32 72 8 C81 32 80 52 72 70Z" fill={i % 2 ? '#7fe8ff' : '#ffd6e0'} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" transform={`rotate(${-76 + i * 19} 72 72)`} />)}
          <path d="M72 96 L57 86 L50 70 L48 50 L59 60 L67 58 L72 58 L77 58 L85 60 L96 50 L94 70 L87 86Z" fill="#ffffff" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <path d="M53 56 L57 62 M91 56 L87 62" stroke="#ff5a7a" strokeWidth="2" strokeLinecap="round" />
          <path d="M60 74 C63 71 66 71 68 74 M76 74 C78 71 81 71 84 74" fill="none" stroke="#17a9c9" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M72 60 L69 68 L72 72 L75 68Z" fill="#ff5a7a" stroke={INK} strokeWidth="1" />
          <path d="M70 87 L72 89 L74 87" fill="none" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  ),
  // Her climax debris: fox-fire flames and petals thrown out from her CHEST (never over the face).
  kitsuneShock: (p, ctx) => Array.from({ length: p.n || 14 }, (_, i) => {
    const n = p.n || 14
    const a = Math.PI + (Math.PI * (i + 0.5)) / n // the upper half: up and out from the chest
    const r = 56 * (0.8 + ((i * 37) % 10) / 25)
    const petal = i % 2
    const c = petal ? '#ffc1dc' : i % 4 === 0 ? '#7fe8ff' : '#ff5a7a'
    return (
      <div key={`kk${i}`} style={{ position: 'absolute', left: '50%', top: `${p.top ?? 78}%`, width: petal ? '7cqw' : '8cqw', height: petal ? '5cqw' : '12cqw', marginLeft: petal ? '-3.5cqw' : '-4cqw', marginTop: petal ? '-2.5cqw' : '-6cqw',
        borderRadius: petal ? '80% 0 80% 0' : '50% 50% 45% 45% / 65% 65% 35% 35%', background: petal ? c : FIRE(c), border: petal ? `0.3cqw solid ${INK}` : 'none', filter: petal ? 'none' : `drop-shadow(0 0 1cqw ${c})`,
        '--x0': '0cqw', '--y0': '0cqw', '--x1': `${(Math.cos(a) * r).toFixed(1)}cqw`, '--y1': `${(Math.sin(a) * r * 0.9).toFixed(1)}cqw`, '--r': `${((a * 180) / Math.PI + 90).toFixed(0)}deg`, '--spin': `${petal ? (i % 3 ? 220 : -220) : 0}deg`,
        animation: `lgkitsuneShock ${Math.round(820 * ctx.speed)}ms cubic-bezier(.15,.8,.3,1) ${(i % 3) * 30}ms both` }} />
    )
  }),
  // Her heavy blow: nine ghostly tails sweep across the camera like a fan snapping open.
  kitsuneSweep: (p, ctx) => Array.from({ length: 9 }, (_, i) => (
    <div key={`ks${i}`} style={{ position: 'absolute', left: '50%', top: '92%', width: '12cqw', height: '78cqw', marginLeft: '-6cqw', marginTop: '-78cqw', transformOrigin: '50% 100%', borderRadius: '50% 50% 30% 30% / 40% 40% 10% 10%',
      background: `linear-gradient(#ffffff, ${i % 2 ? '#7fe8ff' : '#ffd6e0'} 30%, ${i % 2 ? '#7fe8ff00' : '#ff5a7a00'})`, filter: `drop-shadow(0 0 1.5cqw ${i % 2 ? '#7fe8ff' : '#ff5a7a'})`,
      '--r': -64 + i * 16, animation: `lgkitsuneSweep ${820 * ctx.speed}ms cubic-bezier(.3,.7,.3,1) ${i * 28}ms both` }} />
  )),
}
