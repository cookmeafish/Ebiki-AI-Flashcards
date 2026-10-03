// What the hydra raid ability (heads: Many Heads) LOOKS like. The fx contract is in fx/index.js, the juice in
// fx/_juice.js. Fixed bright colors (never theme tokens over the art).
import { center, anim, around, slash, ring, shards, flash } from './_kit'

const CYAN = '#7ff7ff'
const ICHOR = '#8dff5a'
const FIRE = '#ff8a1f'
const EMBER = '#ffd23f'

// THE REAL PARTS: raids/hydra.svg draws exactly data-ab-heads heads in every phase (the king + slot heads
// lg-hydra-s2..s6; a cut s2/s3 is a seared stump, lg-hydra-stump2/3). The moments move those heads, keyed on the head
// count AFTER the strike:
//   grow       the two newest slots (N-1, N) burst up out of the body;
//   sever      the slot just cut (N+1) is lopped off and falls away, a fresh stump flares;
//   cauterize  s2 and s3 regrow out of the flames.
// Played only while data-fx is set (never in focus mode, with Still bosses or under reduced motion); the head count
// itself always shows (a static change). Transforms go only on slot groups (they carry no transform attribute; a CSS
// transform would replace one), stumps get filters (the phase 3 stumps carry a transform).
export const HYDRA_MAX_HEADS = 6
const slot = (k) => `.lg-hydra-s${k}`
const at = (fx, n) => `.lg-boss[data-fx="${fx}"][data-ab-heads="${n}"]`
export function headCss() {
  const grow = []
  const lop = []
  const sear = []
  for (let n = 3; n <= HYDRA_MAX_HEADS; n++) grow.push(`${at('grow', n)} ${slot(n - 1)}, ${at('grow', n)} ${slot(n)}`)
  for (let n = 1; n < HYDRA_MAX_HEADS; n++) {
    lop.push(`${at('sever', n)} ${slot(n + 1)}`)
    if (n + 1 <= 3) sear.push(`${at('sever', n)} .lg-hydra-stump${n + 1}`)
  }
  return [
    '@keyframes lgrHydraSprout { 0% { transform: translateY(14px) scale(.15, .3); opacity: 0 } 35% { opacity: 1 } 65% { transform: translateY(-3px) scale(1.12, 1.08) } 82% { transform: translateY(1px) scale(.97) } 100% { transform: none } }',
    '@keyframes lgrHydraLop { 0% { transform: none; opacity: 1 } 16% { transform: translateY(-4px) rotate(6deg) } 70% { opacity: .9 } 100% { transform: translateY(42px) rotate(-24deg) scale(.55, .35); opacity: 0 } }',
    '@keyframes lgrHydraSear { 0%, 100% { filter: none } 25% { filter: brightness(2.2) drop-shadow(0 0 3px #ff8a1f) } 60% { filter: brightness(1.5) drop-shadow(0 0 2px #ffd23f) } }',
    [2, 3, 4, 5, 6].map((k) => `.lg-boss ${slot(k)}`).join(', ') + ' { transform-box: fill-box; transform-origin: 50% 100% }',
    `${grow.join(', ')} { animation: lgrHydraSprout 760ms cubic-bezier(.22,1,.36,1) both }`,
    // The head just cut stays on screen while it falls (the state rule already hides it: this one is more specific).
    `${lop.join(', ')} { display: inline !important; transform-origin: 50% 25%; animation: lgrHydraLop 680ms cubic-bezier(.45,0,.8,.3) forwards }`,
    `${sear.join(', ')} { animation: lgrHydraSear 700ms ease-out both }`,
    '.lg-boss[data-fx="cauterize"] .lg-hydra-s2, .lg-boss[data-fx="cauterize"] .lg-hydra-s3 { animation: lgrHydraSprout 820ms 260ms cubic-bezier(.22,1,.36,1) both }',
  ].join('\n')
}
const HEAD_CSS = headCss()

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
  // The asset view's Try it: the head count right after each moment (a cut from 3, a growth from 3, a burn).
  demo: {
    sever: { kind: 'hit', damage: 2, lives: 0, ab: { heads: 2, burns: 0 } },
    grow: { kind: 'miss', damage: 0, lives: 1, fxVars: { n: 2 }, ab: { heads: 5, burns: 0 } },
    cauterize: { kind: 'hit', damage: 4, lives: 0, fxVars: { n: 2 }, ab: { heads: 3, burns: 1 } },
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
`,
}
