// What the hydra raid ability (heads: Many Heads) LOOKS like. The fx contract is in fx/index.js, the juice in
// fx/_juice.js. Fixed bright colors (never theme tokens over the art).
import { center, anim, around, slash, ring, shards, flash } from './_kit'

const CYAN = '#7ff7ff'
const ICHOR = '#8dff5a'
const FIRE = '#ff8a1f'
const EMBER = '#ffd23f'

export default {
  effects: {
    // Sever (tick): a thin cyan blade glint across one neck, three water drops fall.
    sever: () => <>
      {slash(-28, CYAN, 0, '70%', 4)}
      {[0, 1, 2].map((i) => <div key={i} className="lgx" style={{ left: `${44 + i * 6}%`, top: '46%', width: 6, height: 9, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', background: '#bff9ff', boxShadow: `0 0 6px ${CYAN}`, '--spin': '0deg', animation: anim('lgxFall', 600, 60 + i * 50, 'ease-in') }} />)}
    </>,
    // Grow (medium): two small heads burst up from a stump with an ichor splash.
    grow: () => <>
      {ring(ICHOR, 0, 1.3, 3, 500)}
      {shards(10, ICHOR, -60, 8, true)}
      {[-1, 1].map((d) => (
        <div key={d} className="lgx" style={{ left: `${50 + d * 9}%`, top: '58%', width: 22, height: 22, marginLeft: -11, fontSize: 22, lineHeight: '22px', textAlign: 'center', filter: `drop-shadow(0 0 6px ${ICHOR})`, '--h': `${-70 - (d + 1) * 8}px`, animation: anim('lgrHydraFxSprout', 800, d > 0 ? 90 : 0, 'cubic-bezier(.34,1.56,.64,1)') }}>🐍</div>
      ))}
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
  floaters: { sever: 'lg_fx_sever', grow: 'lg_fx_grow', cauterize: 'lg_fx_cauterize' },
  floaterTone: { sever: 'info', grow: 'success', cauterize: 'warning' },
  juice: {
    sever: { size: 'tick' },
    grow: { size: 'medium', shake: 1, flash: 1, hitstop: 1, sfx: 'hydra.grow' },
    cauterize: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'hydra.cauterize' },
  },
  css: `
@keyframes lgrHydraFxRace { 0% { transform: translate(-50%, -50%) rotate(0) scale(.7); opacity: 0 } 15% { opacity: 1 } 70% { opacity: 1 } 100% { transform: translate(-50%, -50%) rotate(540deg) scale(1.1); opacity: 0 } }
@keyframes lgrHydraFxSprout { 0% { transform: translateY(0) scale(.2) rotate(-20deg); opacity: 0 } 25% { opacity: 1 } 60% { transform: translateY(var(--h)) scale(1.15) rotate(8deg) } 100% { transform: translateY(var(--h)) scale(1) rotate(0); opacity: 0 } }
@keyframes lgrHydraNick { 0%, 100% { transform: none } 30% { transform: translateX(5px) rotate(2deg) } 65% { transform: translateX(-3px) rotate(-1deg) } }
@keyframes lgrHydraPreen { 0%, 100% { transform: none } 25% { transform: translateY(-8px) rotate(5deg) scale(1.04) } 50% { transform: translateY(-4px) rotate(-5deg) } 75% { transform: translateY(-6px) rotate(3deg) scale(1.02) } }
@keyframes lgrHydraWhip { 0%, 100% { transform: none } 20% { transform: skewX(8deg) translateX(6px) } 45% { transform: skewX(-6deg) translateX(-6px) } 70% { transform: skewX(3deg) translateX(2px) } }
@keyframes lgrHydraWhipP3 { 0%, 100% { transform: none } 18% { transform: skewX(11deg) translateX(8px) } 40% { transform: skewX(-9deg) translateX(-8px) } 62% { transform: skewX(5deg) translateX(3px) } 82% { transform: skewX(-2deg) } }
.lgr-hydra-sever { animation: lgrHydraNick 320ms ease-out both }
.lgr-hydra-grow { transform-origin: 50% 90%; animation: lgrHydraPreen 780ms cubic-bezier(.22,1,.36,1) both }
.lgr-hydra-cauterize { transform-origin: 50% 100%; animation: lgrHydraWhip 800ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-phase="3"] .lgr-hydra-cauterize { animation-name: lgrHydraWhipP3; animation-duration: 950ms }
/* THE REAL PARTS: the state layer this ability draws on the boss (its lg-ab-* group in raids/hydra.svg) moves with
   the moment, not only the whole figure. Played only while data-fx is set (never in focus mode, with Still bosses or
   under reduced motion). */
@keyframes lgrHydraHeadsRise { 0% { transform: translateY(6px) scale(.6) } 45% { transform: translateY(-2px) scale(1.15) } 100% { transform: none } }
.lg-boss[data-fx="grow"] [class*="lg-ab-heads-"] { transform-box: fill-box; transform-origin: center bottom; animation: lgrHydraHeadsRise 700ms cubic-bezier(.22,1,.36,1) both }
`,
}
