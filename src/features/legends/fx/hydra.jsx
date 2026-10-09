// What the hydra raid ability (heads: Many Heads) LOOKS like. The fx contract is in fx/index.js, the juice in
// fx/_juice.js. Fixed bright colors (never theme tokens over the art).
import { center, anim, around, slash, ring, shards, flash } from './_kit'

const CYAN = '#7ff7ff'
const ICHOR = '#8dff5a'
const FIRE = '#ff8a1f'
const EMBER = '#ffd23f'

// THE REAL PARTS: raids/hydra.svg is built from the heads out: one body with six fixed neck roots, filled in order
// (1 the King, never cut; 2 and 3 the inner pair; 4 the low front head; 5 and 6 the outer pair). Slot k is the same head
// on the same root in every phase. Slot heads are lg-hydra-s2..s6 (shown by data-ab-heads through their lg-ab-/lg-abh-
// classes); EVERY slot has a seared stump at its root, lg-hydra-stump2..6, standing while heads < k <= data-ab-top (the
// most heads since the last burn: abilities/hydra.js). The moments move those parts, keyed on the state AFTER the strike:
//   grow       the slots that just grew (data-ab-grew of them: N-grew+1..N) burst up out of their roots; the first
//              data-ab-regrew of them came out of a stump, which bursts open under them;
//   sever      the slot just cut (N+1) is lopped off and falls away, its stump flares white-hot from the first frame;
//   cauterize  every stump (2..data-ab-burnt) flares and burns away while s2 and s3 regrow out of the flames.
// The state changes the moment the answer is judged, but the arena starts the moment JUICE.delay later (data-fx).
// BossArena marks that gap with data-fx-pending="<key>", and the HOLD rules below keep the BEFORE picture for it
// (else a grown head popped in whole, vanished and sprouted again, and a cut head blinked out and came back to fall).
// Played only while data-fx is set (never in focus mode, with Still bosses or under reduced motion); the head count
// and the stumps always show (a static change). Slot and stump groups carry no transform attribute, so CSS may move them.
export const HYDRA_MAX_HEADS = 6
// Where each slot's neck meets the body, per phase (raids/hydra.svg user units: the pivot of the slot's own idle sway;
// hydraArt.test.js keeps them equal). Key 1 is the King. A head sprouts out of THAT point (transform-box: view-box), so
// it grows along its neck; the moments below swing each neck about it too.
export const HYDRA_ROOTS = {
  1: { 1: [60, 80], 2: [46, 83], 3: [74, 83], 4: [70, 118], 5: [33, 90], 6: [87, 90] },
  2: { 1: [57.5, 82.2], 2: [43.9, 86.1], 3: [71.6, 82.2], 4: [79.5, 123.5], 5: [31.4, 98], 6: [86.9, 90.2] },
  3: { 1: [60, 72], 2: [50, 76], 3: [70, 76], 4: [60, 120], 5: [42, 84], 6: [78, 84] },
}
// Which way each neck leans out (-1 left of the King, 1 right), so moments fan the heads apart, never into each other.
const DIR = { 2: -1, 3: 1, 4: 1, 5: -1, 6: 1 }
const SLOTS = [2, 3, 4, 5, 6]
const slot = (k) => `.lg-hydra-s${k}`
const stump = (k) => `.lg-hydra-stump${k}`
const range = (a, b) => { const out = []; for (let i = a; i <= b; i++) out.push(i); return out }
const at = (fx, n, extra = '', attr = 'data-fx') => `.lg-boss[${attr}="${fx}"][data-ab-heads="${n}"]${extra}`
export function headCss() {
  const stumpsUp = []
  const grow = [], holdGrow = [], burst = [], holdBurst = []
  const lop = [], sear = [], holdCut = [], holdStump = []
  const burn = [], holdBurn = []
  // STUMPS: slot k stands as a stump while heads < k <= top
  for (const k of SLOTS) for (let h = 1; h < k; h++) for (let t = k; t <= HYDRA_MAX_HEADS; t++) stumpsUp.push(`.lg-boss[data-ab-heads="${h}"][data-ab-top="${t}"] ${stump(k)}`)
  for (let n = 2; n <= HYDRA_MAX_HEADS; n++) {
    for (let g = 1; g <= 2 && n - g >= 1; g++) {
      for (let k = n - g + 1; k <= n; k++) {
        grow.push(`${at('grow', n, `[data-ab-grew="${g}"]`)} ${slot(k)}`)
        holdGrow.push(`${at('grow', n, `[data-ab-grew="${g}"]`, 'data-fx-pending')} ${slot(k)}`)
      }
      for (let r = 1; r <= g; r++) for (let k = n - g + 1; k <= n - g + r; k++) {
        burst.push(`${at('grow', n, `[data-ab-grew="${g}"][data-ab-regrew="${r}"]`)} ${stump(k)}`)
        holdBurst.push(`${at('grow', n, `[data-ab-grew="${g}"][data-ab-regrew="${r}"]`, 'data-fx-pending')} ${stump(k)}`)
      }
    }
  }
  for (let n = 1; n < HYDRA_MAX_HEADS; n++) {
    lop.push(`${at('sever', n)} ${slot(n + 1)}`)
    sear.push(`${at('sever', n)} ${stump(n + 1)}`)
    holdCut.push(`${at('sever', n, '', 'data-fx-pending')} ${slot(n + 1)}`)
    holdStump.push(`${at('sever', n, '', 'data-fx-pending')} ${stump(n + 1)}`)
  }
  // a burn shows the stumps it burns (2..burnt; a state from before data-ab-burnt counts as the base three)
  for (const b of [0, 3, 4, 5, 6]) for (const k of range(2, Math.max(3, b))) {
    burn.push(`.lg-boss[data-fx="cauterize"][data-ab-burnt="${b}"] ${stump(k)}`)
    holdBurn.push(`.lg-boss[data-fx-pending="cauterize"][data-ab-burnt="${b}"] ${stump(k)}`)
  }
  const preBurn = '.lg-boss[data-fx-pending="cauterize"]'
  return [
    '@keyframes lgrHydraSprout { 0% { transform: scale(.08, .12); opacity: 0 } 30% { opacity: 1 } 62% { transform: scale(1.1, 1.08) } 80% { transform: scale(.97) } 100% { transform: none } }',
    '@keyframes lgrHydraLop { 0% { transform: none; opacity: 1 } 16% { transform: translateY(-4px) rotate(6deg) } 70% { opacity: .9 } 100% { transform: translateY(42px) rotate(-24deg) scale(.55, .35); opacity: 0 } }',
    '@keyframes lgrHydraSear { 0% { filter: brightness(2.4) drop-shadow(0 0 3px #ffd23f) } 25% { filter: brightness(2.2) drop-shadow(0 0 3px #ff8a1f) } 60% { filter: brightness(1.5) drop-shadow(0 0 2px #ffd23f) } 100% { filter: none } }',
    '@keyframes lgrHydraBurn { 0% { filter: none; opacity: 1 } 18% { filter: brightness(2.4) drop-shadow(0 0 3px #ff8a1f) } 40% { filter: brightness(3) saturate(.4) drop-shadow(0 0 4px #ffd23f); opacity: 1 } 62% { filter: brightness(3.4) saturate(0) drop-shadow(0 0 4px #fff); opacity: 0 } 100% { filter: none; opacity: 0 } }',
    '@keyframes lgrHydraBurst { 0% { transform: none; opacity: 1; filter: brightness(1.6) } 30% { transform: scale(1.25, .8); opacity: 1; filter: brightness(2) drop-shadow(0 0 3px #8dff5a) } 100% { transform: scale(1.4, .4); opacity: 0; filter: none } }',
    ...Object.entries(HYDRA_ROOTS).flatMap(([ph, roots]) => SLOTS.map((k) => `.lg-boss[data-phase="${ph}"] :is(${slot(k)}, ${stump(k)}) { transform-box: view-box; transform-origin: ${roots[k][0]}px ${roots[k][1]}px }`)),
    `${stumpsUp.join(', ')} { display: inline !important }`,
    `${grow.join(', ')} { animation: lgrHydraSprout 760ms cubic-bezier(.22,1,.36,1) both }`,
    // the stump a head grows back out of bursts open under it
    `${burst.join(', ')} { display: inline !important; animation: lgrHydraBurst 520ms ease-out forwards }`,
    // The head just cut stays on screen while it falls (the state rule already hides it: this one is more specific).
    `${lop.join(', ')} { display: inline !important; transform-box: fill-box; transform-origin: 50% 25%; animation: lgrHydraLop 680ms cubic-bezier(.45,0,.8,.3) forwards }`,
    // Its stump shows from the cut on, white-hot (filled from the first frame, so it never waits dark behind the head).
    `${sear.join(', ')} { animation: lgrHydraSear 700ms ease-out both }`,
    // Cauterize: the count is back at three, yet the burn must show every stump it burns, so they stay up and flare out.
    `${burn.join(', ')} { display: inline !important; animation: lgrHydraBurn 900ms ease-out forwards }`,
    '.lg-boss[data-fx="cauterize"] .lg-hydra-s2, .lg-boss[data-fx="cauterize"] .lg-hydra-s3 { animation: lgrHydraSprout 820ms 260ms cubic-bezier(.22,1,.36,1) both }',
    // THE HOLD (data-fx-pending): the picture from before the strike until the moment starts.
    `${holdGrow.join(', ')} { opacity: 0 }`,
    `${holdBurst.join(', ')} { display: inline !important }`,
    `${holdCut.join(', ')} { display: inline !important }`,
    `${holdStump.join(', ')}, ${preBurn} .lg-hydra-s2, ${preBurn} .lg-hydra-s3 { display: none !important }`,
    `${holdBurn.join(', ')} { display: inline !important }`,
  ].join('\n')
}
const HEAD_CSS = headCss()

// The pivots the moments swing about: every neck where it meets the body, per phase, and its lean.
function pivotCss() {
  const out = ['.lg-hydra-king, .lg-hydra-neck { transform-box: view-box }', '.lg-hydra-coils { transform-box: fill-box; transform-origin: 50% 100% }']
  for (const [ph, roots] of Object.entries(HYDRA_ROOTS)) {
    const p = ph === '1' ? '.lg-p1' : ph === '2' ? '.lg-p2' : '.lg-p3'
    out.push(`${p} .lg-hydra-king { transform-origin: ${roots[1][0]}px ${roots[1][1]}px }`)
    for (const k of SLOTS) out.push(`${p} .lg-hydra-n${k} { transform-origin: ${roots[k][0]}px ${roots[k][1]}px; --hy-dir: ${DIR[k]} }`)
  }
  out.push('.lg-hydra-n3 { --hy-lag: 60ms } .lg-hydra-n4 { --hy-lag: 150ms } .lg-hydra-n5 { --hy-lag: 110ms } .lg-hydra-n6 { --hy-lag: 190ms }')
  return out.join('\n')
}

export default {
  effects: {
    // Sever (medium): a thin cyan blade glint across one neck, three water drops fall.
    sever: () => <>
      {slash(-28, CYAN, 0, '70%', 4)}
      {[0, 1, 2].map((i) => <div key={i} className="lgx" style={{ left: `${44 + i * 6}%`, top: '46%', width: 6, height: 9, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', background: '#bff9ff', boxShadow: `0 0 6px ${CYAN}`, '--spin': '0deg', animation: anim('lgxFall', 600, 60 + i * 50, 'ease-in') }} />)}
    </>,
    // Grow (medium): an ichor splash where the new heads burst out (the REAL heads sprout: headCss).
    grow: () => <>
      {ring(ICHOR, 0, 1.3, 3, 500)}
      {shards(10, ICHOR, -60, 8, true)}
    </>,
    // Cauterize (big): an orange ring of fire races round every stump, embers burst and a steam column rises.
    cauterize: () => <>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>{flash('#ffe2b0')}</div>
      <div className="lgx" style={{ ...center, width: '96%', height: '96%', borderRadius: '50%', background: `conic-gradient(from 0deg, transparent 0 8%, ${EMBER} 14%, ${FIRE} 30%, #ff3b1f 46%, transparent 52%, transparent 58%, ${EMBER} 64%, ${FIRE} 80%, #ff3b1f 94%, transparent 100%)`, WebkitMask: 'radial-gradient(circle, transparent 58%, #000 61%, #000 70%, transparent 73%)', mask: 'radial-gradient(circle, transparent 58%, #000 61%, #000 70%, transparent 73%)', filter: `drop-shadow(0 0 10px ${FIRE})`, animation: anim('lgrHydraFxRace', 1000) }} />
      {around(20, (i, a) => <div key={i} className="lgx" style={{ ...center, width: 6 + (i % 3) * 2, height: 6 + (i % 3) * 2, borderRadius: '50%', background: `radial-gradient(circle, #fff 0 25%, ${i % 2 ? EMBER : FIRE} 60%)`, '--a': `${a + i * 7}deg`, '--d': `${-80 - (i % 4) * 16}px`, '--spin': '0deg', animation: anim('lgxShard', 800 + (i % 3) * 100, 120 + (i % 5) * 20) }} />)}
      <div className="lgx" style={{ left: '50%', bottom: '10%', width: '40%', height: '110%', transformOrigin: 'bottom', background: 'linear-gradient(to top, rgba(255,255,255,.85), rgba(220,240,255,.35) 55%, rgba(255,255,255,0))', borderRadius: '50% 50% 30% 30%', filter: 'blur(3px)', animation: anim('lgxBeam', 1100, 250) }} />
      {ring(FIRE, 80, 2.1, 5, 800)}
    </>,
  },
  // The asset view's Try it: the state right after each moment (a cut from 3, two heads growing back from 3 where one
  // stump stood, a burn of four stumps after the hydra had reached five heads).
  demo: {
    sever: { kind: 'hit', damage: 2, lives: 0, ab: { heads: 2, top: 3, burns: 0 } },
    grow: { kind: 'miss', damage: 0, lives: 1, fxVars: { n: 2 }, ab: { heads: 5, top: 5, grew: 2, regrew: 1, burns: 0 } },
    cauterize: { kind: 'hit', damage: 4, lives: 0, fxVars: { n: 2 }, ab: { heads: 3, top: 3, burnt: 5, burns: 1 } },
  },
  floaters: { sever: 'lg_fx_sever', grow: 'lg_fx_grow', cauterize: 'lg_fx_cauterize' },
  floaterTone: { sever: 'info', grow: 'success', cauterize: 'warning' },
  juice: {
    sever: { size: 'medium' }, // long enough to watch the head fall
    grow: { size: 'medium', shake: 1, flash: 1, hitstop: 1, sfx: 'hydra.grow' },
    cauterize: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'hydra.cauterize' },
  },
  css: `
@keyframes lgrHydraFxRace { 0% { transform: translate(-50%, -50%) rotate(0) scale(.7); opacity: 0 } 15% { opacity: 1 } 70% { opacity: 1 } 100% { transform: translate(-50%, -50%) rotate(540deg) scale(1.1); opacity: 0 } }
@keyframes lgrHydraNick { 0%, 100% { transform: none } 25% { transform: translateX(8px) rotate(3deg) } 60% { transform: translateX(-4px) rotate(-2deg) } }
@keyframes lgrHydraPreen { 0%, 100% { transform: none } 25% { transform: translateY(-8px) rotate(5deg) scale(1.04) } 50% { transform: translateY(-4px) rotate(-5deg) } 75% { transform: translateY(-6px) rotate(3deg) scale(1.02) } }
@keyframes lgrHydraWhip { 0%, 100% { transform: none } 20% { transform: skewX(8deg) translateX(6px) } 45% { transform: skewX(-6deg) translateX(-6px) } 70% { transform: skewX(3deg) translateX(2px) } }
@keyframes lgrHydraWhipP3 { 0%, 100% { transform: none } 18% { transform: skewX(11deg) translateX(8px) } 40% { transform: skewX(-9deg) translateX(-8px) } 62% { transform: skewX(5deg) translateX(3px) } 82% { transform: skewX(-2deg) } }
.lgr-hydra-sever { animation: lgrHydraNick 520ms ease-out both }
.lgr-hydra-grow { transform-origin: 50% 90%; animation: lgrHydraPreen 780ms cubic-bezier(.22,1,.36,1) both }
.lgr-hydra-cauterize { transform-origin: 50% 100%; animation: lgrHydraWhip 800ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-phase="3"] .lgr-hydra-cauterize { animation-name: lgrHydraWhipP3; animation-duration: 950ms }
${HEAD_CSS}
/* THE DRAWING ACTS IT OUT (the nine moments, its attack, the knockout held, and the King's and the body's share of each
   ability). These move only the wrappers raids/hydra.svg made for them: lg-hydra-king (the crowned head and its neck),
   lg-hydra-neck lg-hydra-n<k> (INSIDE each slot group, so the head rules above keep the slot groups to themselves) and
   lg-hydra-coils (the body). Every neck pivots where it meets the body (HYDRA_ROOTS, per phase).
   --hy-dir: which way a neck leans out, so the heads fan apart, never into each other; --hy-lag: one after another.
   Played only while data-moment / data-assault-on / data-fx is set; data-down holds the fallen pose. */
${pivotCss()}

/* ITS STRIKE (data-assault-on from the first frame, then data-moment="hurt"): every head rears back and coils (100 ms),
   then they STRIKE at you one after another, the King first, jaws coming at the camera (the fangs and the venom fly
   from them), and snap back; the body heaves under them. */
@keyframes lgrHyRear { 0% { transform: none } 11% { transform: translateY(-4px) rotate(calc(var(--hy-dir, 0) * -10deg)) scale(.92) } 17% { transform: translateY(-5px) rotate(calc(var(--hy-dir, 0) * -12deg)) scale(.9) }
  25% { transform: translateY(16px) rotate(calc(var(--hy-dir, 0) * 9deg)) scale(1.22) } 31% { transform: translateY(14px) rotate(calc(var(--hy-dir, 0) * 6deg)) scale(1.17) } 38% { transform: translateY(15px) rotate(calc(var(--hy-dir, 0) * 8deg)) scale(1.2) }
  64% { transform: translateY(4px) scale(1.05) } 100% { transform: none } }
@keyframes lgrHyHeave { 0% { transform: none } 14% { transform: translateY(2px) scale(1.04, .94) } 28% { transform: translateY(-3px) scale(.97, 1.06) } 46% { transform: translateY(1px) } 100% { transform: none } }
.lg-boss[data-motif="hydra"][data-assault-on] :is(.lg-hydra-king, .lg-hydra-neck), .lg-boss[data-motif="hydra"][data-moment="hurt"] :is(.lg-hydra-king, .lg-hydra-neck) { animation: lgrHyRear 900ms cubic-bezier(.3,0,.3,1) var(--hy-lag, 0ms) both }
.lg-boss[data-motif="hydra"][data-assault-on] .lg-hydra-coils, .lg-boss[data-motif="hydra"][data-moment="hurt"] .lg-hydra-coils { animation: lgrHyHeave 900ms ease-out both }

/* ITS HEAVY BLOW (data-moment="hurtBig", 100 ms in, from the reared pose): a frenzy: every head strikes TWICE, the
   second bite deeper, the whole body surging up out of the water behind them. */
@keyframes lgrHyFrenzy { 0% { transform: translateY(-4px) rotate(calc(var(--hy-dir, 0) * -10deg)) scale(.92) } 12% { transform: translateY(-6px) rotate(calc(var(--hy-dir, 0) * -14deg)) scale(.88) }
  22% { transform: translateY(16px) rotate(calc(var(--hy-dir, 0) * 10deg)) scale(1.22) } 30% { transform: translateY(-3px) rotate(calc(var(--hy-dir, 0) * -6deg)) scale(1) }
  40% { transform: translateY(24px) rotate(calc(var(--hy-dir, 0) * 12deg)) scale(1.34) } 46% { transform: translateY(21px) rotate(calc(var(--hy-dir, 0) * 9deg)) scale(1.28) } 52% { transform: translateY(23px) rotate(calc(var(--hy-dir, 0) * 11deg)) scale(1.31) }
  78% { transform: translateY(6px) scale(1.07) } 100% { transform: none } }
@keyframes lgrHySurge { 0% { transform: none } 20% { transform: translateY(-5px) scale(1.04, 1.08) } 40% { transform: translateY(-7px) scale(1.06, 1.1) } 60% { transform: translateY(2px) scale(1.04, .94) } 100% { transform: none } }
.lg-boss[data-motif="hydra"][data-moment="hurtBig"] :is(.lg-hydra-king, .lg-hydra-neck) { animation: lgrHyFrenzy 1150ms cubic-bezier(.3,0,.3,1) var(--hy-lag, 0ms) both }
.lg-boss[data-motif="hydra"][data-moment="hurtBig"] .lg-hydra-coils { animation: lgrHySurge 1150ms ease-out both }

/* HIT: your blow snaps the King's head back on its neck; the other heads flinch away from it, out to the sides. */
@keyframes lgrHyKingHit { 0% { transform: none } 12% { transform: translateY(-3px) rotate(-10deg) scale(.95) } 30% { transform: rotate(5deg) } 50% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgrHyFlinch { 0% { transform: none } 14% { transform: rotate(calc(var(--hy-dir, 0) * 14deg)) scale(.94) } 40% { transform: rotate(calc(var(--hy-dir, 0) * -4deg)) } 64% { transform: rotate(calc(var(--hy-dir, 0) * 2deg)) } 100% { transform: none } }
.lg-boss[data-motif="hydra"][data-moment="hit"] .lg-hydra-king { animation: lgrHyKingHit 700ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="hydra"][data-moment="hit"] .lg-hydra-neck { animation: lgrHyFlinch 700ms cubic-bezier(.2,.8,.3,1) both }

/* CRIT: the King's head is knocked right round on its neck and lolls back up; the other heads whip wildly, the body
   lurches. */
@keyframes lgrHyKingCrit { 0% { transform: none } 10% { transform: translate(-3px, -4px) rotate(-26deg) scale(.9) } 26% { transform: rotate(14deg) scale(1.02) } 42% { transform: rotate(-8deg) } 60% { transform: rotate(4deg) } 78% { transform: rotate(-1deg) } 100% { transform: none } }
@keyframes lgrHyWhip { 0% { transform: none } 10% { transform: rotate(calc(var(--hy-dir, 0) * 22deg)) } 24% { transform: rotate(calc(var(--hy-dir, 0) * -16deg)) } 40% { transform: rotate(calc(var(--hy-dir, 0) * 10deg)) } 58% { transform: rotate(calc(var(--hy-dir, 0) * -5deg)) } 100% { transform: none } }
@keyframes lgrHyLurch { 0% { transform: none } 12% { transform: translateX(-4px) skewX(5deg) } 30% { transform: translateX(3px) skewX(-3deg) } 50% { transform: none } 100% { transform: none } }
.lg-boss[data-motif="hydra"][data-moment="crit"] .lg-hydra-king { animation: lgrHyKingCrit 1000ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="hydra"][data-moment="crit"] .lg-hydra-neck { animation: lgrHyWhip 1000ms ease-out both }
.lg-boss[data-motif="hydra"][data-moment="crit"] .lg-hydra-coils { animation: lgrHyLurch 1000ms ease-out both }

/* SHARPEN: honed cuts across the necks: each one is struck and jerks, the King's head is cut one way then the other. */
@keyframes lgrHyCut { 0% { transform: none } 8% { transform: translateX(calc(var(--hy-dir, 1) * 4px)) rotate(calc(var(--hy-dir, 1) * 8deg)) } 20% { transform: none } 32% { transform: translateX(calc(var(--hy-dir, 1) * -4px)) rotate(calc(var(--hy-dir, 1) * -8deg)) } 48% { transform: rotate(calc(var(--hy-dir, 1) * 2deg)) } 100% { transform: none } }
.lg-boss[data-motif="hydra"][data-moment="sharpen"] :is(.lg-hydra-king, .lg-hydra-neck) { animation: lgrHyCut 760ms cubic-bezier(.2,.8,.3,1) var(--hy-lag, 0ms) both }

/* BLOCK: the heads strike and you parry: they snap in and are batted back high, jaws reeling. */
@keyframes lgrHyParried { 0% { transform: none } 14% { transform: translateY(15px) rotate(calc(var(--hy-dir, 0) * 8deg)) scale(1.2) } 22% { transform: translateY(15px) rotate(calc(var(--hy-dir, 0) * 8deg)) scale(1.21) }
  32% { transform: translateY(-6px) rotate(calc(var(--hy-dir, 0) * -16deg)) scale(.9) } 50% { transform: translateY(-2px) rotate(calc(var(--hy-dir, 0) * -6deg)) } 70% { transform: rotate(calc(var(--hy-dir, 0) * 3deg)) } 100% { transform: none } }
.lg-boss[data-motif="hydra"][data-moment="block"] :is(.lg-hydra-king, .lg-hydra-neck) { animation: lgrHyParried 800ms cubic-bezier(.3,0,.3,1) var(--hy-lag, 0ms) both }

/* SHIELD: the bites glance off the dome: each head strikes and skids past to the side, the body sways after them. */
@keyframes lgrHyGlance { 0% { transform: none } 14% { transform: translateY(-3px) scale(.94) } 26% { transform: translateY(13px) scale(1.16) } 38% { transform: translate(calc(var(--hy-dir, 1) * 6px), 10px) rotate(calc(var(--hy-dir, 1) * 20deg)) scale(1.08) } 62% { transform: rotate(calc(var(--hy-dir, 1) * 6deg)) } 100% { transform: none } }
@keyframes lgrHySway { 0% { transform: none } 38% { transform: skewX(-4deg) translateX(2px) } 64% { transform: skewX(2deg) } 100% { transform: none } }
.lg-boss[data-motif="hydra"][data-moment="shield"] :is(.lg-hydra-king, .lg-hydra-neck) { animation: lgrHyGlance 820ms cubic-bezier(.3,0,.3,1) var(--hy-lag, 0ms) both }
.lg-boss[data-motif="hydra"][data-moment="shield"] .lg-hydra-coils { animation: lgrHySway 820ms ease-out both }

/* SECOND WIND: you got back up: the heads rise tall and hiss, swaying like cobras, the King looming over them. */
@keyframes lgrHyHiss { 0% { transform: none } 18% { transform: translateY(-4px) scale(1.06, 1.1) } 34% { transform: translateY(-4px) rotate(calc(var(--hy-dir, 1) * 6deg)) scale(1.06, 1.1) } 52% { transform: translateY(-4px) rotate(calc(var(--hy-dir, 1) * -6deg)) scale(1.06, 1.1) } 70% { transform: translateY(-3px) rotate(calc(var(--hy-dir, 1) * 3deg)) scale(1.04, 1.06) } 100% { transform: none } }
.lg-boss[data-motif="hydra"][data-moment="wind"] :is(.lg-hydra-king, .lg-hydra-neck) { animation: lgrHyHiss 900ms ease-in-out var(--hy-lag, 0ms) both }

/* KNOCKOUT, SEVERED: the heads give out one after another, each neck sagging out to its side and down into the water,
   the King last: it sways, topples forward and sinks; the body settles under the waves. data-down HOLDS that fallen
   pose after the moment (the same values as the last keyframes). */
@keyframes lgrHyDroop { 0% { transform: none } 14% { transform: rotate(calc(var(--hy-dir, 1) * -6deg)) } 34% { transform: rotate(calc(var(--hy-dir, 1) * 30deg)) translateY(6px) scale(.96) }
  44% { transform: rotate(calc(var(--hy-dir, 1) * 26deg)) translateY(5px) scale(.96) } 64% { transform: rotate(calc(var(--hy-dir, 1) * 46deg)) translateY(14px) scale(.9) } 100% { transform: rotate(calc(var(--hy-dir, 1) * 48deg)) translateY(15px) scale(.9) } }
@keyframes lgrHyKingKo { 0% { transform: none } 12% { transform: rotate(-8deg) translateY(-3px) } 30% { transform: rotate(6deg) } 44% { transform: rotate(-4deg) } 58% { transform: rotate(10deg) translateY(4px) }
  70% { transform: rotate(22deg) translateY(16px) scale(.92) } 78% { transform: rotate(19deg) translateY(14px) scale(.92) } 100% { transform: rotate(21deg) translateY(17px) scale(.92) } }
@keyframes lgrHySink { 0% { transform: none } 55% { transform: none } 75% { transform: translateY(5px) scale(1, .9) } 100% { transform: translateY(6px) scale(1, .88) } }
.lg-boss[data-motif="hydra"][data-moment="ko"] .lg-hydra-neck { animation: lgrHyDroop 2100ms cubic-bezier(.4,0,.6,1) calc(var(--hy-lag, 0ms) * 2) both }
.lg-boss[data-motif="hydra"][data-moment="ko"] .lg-hydra-king { animation: lgrHyKingKo 2450ms cubic-bezier(.4,0,.6,1) both }
.lg-boss[data-motif="hydra"][data-moment="ko"] .lg-hydra-coils { animation: lgrHySink 2450ms ease-in both }
.lg-boss[data-motif="hydra"][data-down]:not([data-moment="ko"]) .lg-hydra-neck { transform: rotate(calc(var(--hy-dir, 1) * 48deg)) translateY(15px) scale(.9) }
.lg-boss[data-motif="hydra"][data-down]:not([data-moment="ko"]) .lg-hydra-king { transform: rotate(21deg) translateY(17px) scale(.92) }
.lg-boss[data-motif="hydra"][data-down]:not([data-moment="ko"]) .lg-hydra-coils { transform: translateY(6px) scale(1, .88) }

/* THE ABILITIES: the slot heads and stumps are the head rules' (above); the King and the body react around them. */
/* sever: a head is cut off: the King rears back screaming, the body recoils. */
@keyframes lgrHyKingScream { 0% { transform: none } 16% { transform: translateY(-5px) rotate(-8deg) scale(1.06) } 40% { transform: translateY(-4px) rotate(-6deg) scale(1.05) } 64% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgrHyRecoil { 0% { transform: none } 16% { transform: translateY(3px) scale(1.04, .94) } 44% { transform: translateY(-1px) } 100% { transform: none } }
.lg-boss[data-motif="hydra"][data-fx="sever"] .lg-hydra-king { animation: lgrHyKingScream 800ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss[data-motif="hydra"][data-fx="sever"] .lg-hydra-coils { animation: lgrHyRecoil 800ms ease-out both }
/* grow: new heads burst out: the King rises up tall and roars in triumph, the body swells. */
@keyframes lgrHyKingRoar { 0% { transform: none } 22% { transform: translateY(-6px) scale(1.1, 1.14) } 36% { transform: translateY(-5px) rotate(4deg) scale(1.1, 1.14) } 50% { transform: translateY(-5px) rotate(-4deg) scale(1.1, 1.14) } 72% { transform: translateY(-2px) scale(1.04) } 100% { transform: none } }
@keyframes lgrHySwell { 0% { transform: none } 26% { transform: scale(1.06, 1.1) } 56% { transform: scale(1.03, 1.05) } 100% { transform: none } }
.lg-boss[data-motif="hydra"][data-fx="grow"] .lg-hydra-king { animation: lgrHyKingRoar 800ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-motif="hydra"][data-fx="grow"] .lg-hydra-coils { animation: lgrHySwell 800ms cubic-bezier(.22,1,.36,1) both }
/* cauterize: the stumps are seared shut: the King writhes in agony, the body thrashes in the water. */
@keyframes lgrHyKingWrithe { 0% { transform: none } 12% { transform: rotate(-12deg) translateY(-3px) } 26% { transform: rotate(10deg) } 40% { transform: rotate(-9deg) translateY(-2px) } 54% { transform: rotate(6deg) } 70% { transform: rotate(-3deg) } 100% { transform: none } }
@keyframes lgrHyThrash { 0% { transform: none } 14% { transform: translateX(-4px) skewX(6deg) } 28% { transform: translateX(4px) skewX(-6deg) } 42% { transform: translateX(-3px) skewX(4deg) } 58% { transform: translateX(2px) skewX(-2deg) } 100% { transform: none } }
.lg-boss[data-motif="hydra"][data-fx="cauterize"] .lg-hydra-king { animation: lgrHyKingWrithe 1150ms ease-out both }
.lg-boss[data-motif="hydra"][data-fx="cauterize"] .lg-hydra-coils { animation: lgrHyThrash 1150ms ease-out both }
`,
}
