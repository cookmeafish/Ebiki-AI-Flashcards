// What the titan raid ability (plates: Forge Plates) LOOKS like. The fx contract is in fx/index.js, the juice in
// fx/_juice.js. Fixed bright colors (never theme tokens over the art).
import { center, anim, around, ring, flash } from './_kit'

const HOT = '#fff3c4'
const FORGE = '#ff5a1f'
const IRON = '#ffb347'

export default {
  effects: {
    // Crack (tick): a white-hot crack line flashes across one plate, four sparks fall.
    crack: () => <>
      <div className="lgx" style={{ ...center, width: '46%', height: 14, marginLeft: '-23%', marginTop: -7, background: HOT, boxShadow: `0 0 10px ${IRON}`, clipPath: 'polygon(0 45%, 18% 20%, 30% 70%, 48% 10%, 62% 80%, 78% 30%, 100% 55%, 100% 70%, 78% 45%, 62% 95%, 48% 25%, 30% 85%, 18% 35%, 0 60%)', animation: anim('lgxFade', 340) }} />
      {[0, 1, 2, 3].map((i) => <div key={i} className="lgx" style={{ left: `${36 + i * 9}%`, top: '50%', width: 4, height: 4, borderRadius: '50%', background: IRON, boxShadow: `0 0 6px ${FORGE}`, '--spin': '0deg', animation: anim('lgxFall', 340, i * 30, 'ease-in') }} />)}
    </>,
    // Shatter (big): the plates burst outward as tumbling glowing iron shards, a forge-red shockwave ring.
    shatter: () => <>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>{flash('#ffd7a8')}</div>
      {around(16, (i, a) => <div key={i} className="lgx" style={{ ...center, width: 16 + (i % 3) * 6, height: 12 + (i % 2) * 8, background: `linear-gradient(135deg, ${HOT}, ${IRON} 40%, #7a3416)`, border: '2px solid #2a1408', boxShadow: `0 0 10px ${FORGE}`, clipPath: 'polygon(20% 0, 100% 15%, 85% 100%, 0 70%)', '--a': `${a + i * 5}deg`, '--d': `${-110 - (i % 4) * 18}px`, '--spin': `${(i % 2 ? 1 : -1) * (300 + i * 20)}deg`, animation: anim('lgxShard', 1000 + (i % 3) * 100, 60) }} />)}
      {ring(FORGE, 0, 2.4, 7, 800)}
      {ring(HOT, 120, 1.8, 3, 700)}
    </>,
    // Exposed hit (tick): a small orange spark on the hit.
    exposedHit: () => <>
      <div className="lgx" style={{ ...center, width: 34, height: 34, borderRadius: '50%', background: `radial-gradient(circle, #fff 0 18%, ${IRON} 40%, transparent 70%)`, '--s': 1.6, animation: anim('lgxRing', 330) }} />
      {around(4, (i, a) => <div key={i} className="lgx" style={{ ...center, width: 4, height: 10, background: IRON, '--a': `${a + 45}deg`, '--d': '-34px', '--spin': '0deg', animation: anim('lgxShard', 320) }} />)}
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
