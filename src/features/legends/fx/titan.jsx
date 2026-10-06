// What the titan raid ability (plates: Forge Plates) LOOKS like. The fx contract is in fx/index.js, the juice in
// fx/_juice.js. Fixed bright colors (never theme tokens over the art).
import { center, anim, around, ring, flash } from './_kit'

const HOT = '#fff3c4'
const FORGE = '#ff5a1f'
const IRON = '#ffb347'

export default {
  effects: {
    // Crack (tick): a white-hot crack line flashes across one plate, four sparks fall.
    // (the crack runs across the chest plate as a drawn, branching white-hot line over a dark groove)
    crack: () => <>
      <svg className="lgx" viewBox="0 0 100 60" style={{ left: '14%', top: '30%', width: '72%', height: '42%', overflow: 'visible', filter: `drop-shadow(0 0 6px ${HOT})` }} aria-hidden="true">
        {[['#2a1408', 10], [FORGE, 6], [HOT, 3]].map(([c, w], k) => (
          <path key={k} d="M2 30 L18 22 L27 36 L42 18 L55 38 L68 24 L80 34 L98 26 M42 18 L46 6 M55 38 L52 54 M68 24 L76 12" fill="none" stroke={c} strokeWidth={w} strokeLinejoin="bevel" strokeLinecap="round"
            style={{ strokeDasharray: 160, animation: anim('lgrTitanDraw', 330, 0, 'cubic-bezier(.2,.8,.3,1)') }} />
        ))}
      </svg>
      {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="lgx" style={{ left: `${32 + i * 7}%`, top: '50%', width: 6, height: 6, borderRadius: '50%', background: HOT, boxShadow: `0 0 0 1.5px ${FORGE}, 0 0 8px ${IRON}`, '--spin': '0deg', animation: anim('lgxFall', 340, 60 + i * 25, 'ease-in') }} />)}
    </>,
    // Shatter (big): the plates burst outward as tumbling glowing iron shards, a forge-red shockwave ring.
    shatter: () => <>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>{flash('#ffd7a8')}</div>
      {around(16, (i, a) => <div key={i} className="lgx" style={{ ...center, width: 16 + (i % 3) * 6, height: 12 + (i % 2) * 8, background: `linear-gradient(135deg, ${HOT}, ${IRON} 40%, #7a3416)`, border: '2px solid #2a1408', boxShadow: `0 0 10px ${FORGE}`, clipPath: 'polygon(20% 0, 100% 15%, 85% 100%, 0 70%)', '--a': `${a + i * 5}deg`, '--d': `${-110 - (i % 4) * 18}px`, '--spin': `${(i % 2 ? 1 : -1) * (300 + i * 20)}deg`, animation: anim('lgxShard', 1000 + (i % 3) * 100, 60) }} />)}
      {ring(FORGE, 0, 2.4, 7, 800)}
      {ring(HOT, 120, 1.8, 3, 700)}
    </>,
    // Exposed hit (tick): the strike lands on bare molten core: a jagged white-orange impact star punches in and
    // eight anvil sparks spray out.
    exposedHit: () => <>
      <svg className="lgx" viewBox="0 0 40 40" style={{ ...center, width: 64, height: 64, marginLeft: -32, marginTop: -32, overflow: 'visible', filter: `drop-shadow(0 0 8px ${FORGE})`, animation: anim('lgrTitanStar', 330, 0, 'cubic-bezier(.2,1.4,.4,1)') }} aria-hidden="true">
        <path d="M20 1 24 13 36 7 28 18 39 22 27 25 32 38 21 29 12 39 14 26 1 24 12 18 5 6 17 12Z" fill={HOT} stroke={FORGE} strokeWidth="2" strokeLinejoin="round" />
        <circle cx="20" cy="21" r="5" fill="#ffffff" />
      </svg>
      {around(8, (i, a) => <div key={i} className="lgx" style={{ ...center, width: 4, height: 12, borderRadius: 2, background: i % 2 ? HOT : IRON, boxShadow: `0 0 6px ${FORGE}`, '--a': `${a + 22}deg`, '--d': `${-44 - (i % 3) * 8}px`, '--spin': '0deg', animation: anim('lgxShard', 330, 30) }} />)}
    </>,
  },
  floaters: { crack: 'lg_fx_crack', shatter: 'lg_fx_plateShatter', exposedHit: 'lg_fx_exposedHit' },
  floaterTone: { crack: 'ink', shatter: 'warning', exposedHit: 'warning' },
  juice: {
    crack: { size: 'tick' },
    shatter: { size: 'big', shake: 3, flash: 2, hitstop: 1, sfx: 'titan.shatter' },
    exposedHit: { size: 'tick' },
  },
  css: `
@keyframes lgrTitanDraw { 0% { stroke-dashoffset: 160; opacity: 1 } 45% { stroke-dashoffset: 0; opacity: 1 } 100% { stroke-dashoffset: 0; opacity: 0 } }
@keyframes lgrTitanStar { 0% { transform: scale(.2) rotate(-25deg); opacity: 0 } 30% { transform: scale(1.25) rotate(5deg); opacity: 1 } 60% { transform: scale(1) rotate(0); opacity: 1 } 100% { transform: scale(1.1); opacity: 0 } }
@keyframes lgrTitanRattle { 0%, 100% { transform: none } 20% { transform: translateX(4px) rotate(1deg) } 40% { transform: translateX(-4px) rotate(-1deg) } 60% { transform: translateX(3px) } 80% { transform: translateX(-1px) } }
@keyframes lgrTitanFlinch { 0%, 100% { transform: none } 40% { transform: translateY(5px) scale(.96) rotate(-2deg) } 75% { transform: translateY(1px) } }
@keyframes lgrTitanBuckle { 0% { transform: none } 22% { transform: translateY(10px) rotate(4deg) scaleY(.94) } 45% { transform: translateY(9px) rotate(3deg) scaleY(.95) } 100% { transform: none } }
@keyframes lgrTitanBuckleP3 { 0% { transform: none } 18% { transform: translateY(14px) rotate(6deg) scaleY(.9) } 30% { transform: translateY(11px) rotate(-2deg) scaleY(.93) } 52% { transform: translateY(12px) rotate(3deg) scaleY(.94) } 100% { transform: none } }
.lgr-titan-crack { animation: lgrTitanRattle 320ms linear both }
.lgr-titan-exposedHit { animation: lgrTitanFlinch 320ms ease-out both }
.lgr-titan-shatter { transform-origin: 50% 100%; animation: lgrTitanBuckle 1100ms cubic-bezier(.22,1,.36,1) both }
.lg-boss[data-phase="3"] .lgr-titan-shatter { animation-name: lgrTitanBuckleP3 }
/* THE REAL PARTS: the state layer this ability draws on the boss (its lg-ab-* group in raids/titan.svg) moves with
   the moment, not only the whole figure. Played only while data-fx is set (never in focus mode, with Still bosses or
   under reduced motion). */
@keyframes lgrTitanPlateJolt { 0%, 100% { transform: none } 20% { transform: translateX(2px) rotate(3deg) } 40% { transform: translateX(-2px) rotate(-3deg) } 60% { transform: translateX(1.5px) rotate(2deg) } 80% { transform: translateX(-1px) } }
.lg-boss[data-fx="crack"] [class*="lg-ab-plates-"] { transform-box: fill-box; transform-origin: center; animation: lgrTitanPlateJolt 320ms cubic-bezier(.22,1,.36,1) both }
@keyframes lgrTitanCoreFlare { 0%, 100% { transform: none; filter: none } 40% { transform: scale(1.18); filter: brightness(1.7) saturate(1.3) } }
.lg-boss[data-fx="exposedHit"] [class*="lg-ab-exposed-"] { transform-box: fill-box; transform-origin: center; animation: lgrTitanCoreFlare 320ms cubic-bezier(.22,1,.36,1) both }
`,
}
