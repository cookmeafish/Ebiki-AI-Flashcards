// What the Gorgon's raid ability (mirror: Mirror Shield) LOOKS like. The fx contract is in fx/index.js, the juice
// numbers in fx/_juice.js, the design in design-v2.md section 17. Fixed bright colors (never theme tokens).
import { anim, around, flash } from './_kit'

const POP = 'cubic-bezier(.34,1.56,.64,1)'
const SETTLE = 'cubic-bezier(.22,1,.36,1)'
const GAZE = '#5dff9a'
const STONE = '#a7a29a'
const STONE_DARK = '#5f5a52'

// A thin gaze ray from her eyes, sweeping from r0 to r1.
const ray = (key, r0, r1, delay) => (
  <div key={key} className="lgx" style={{ left: '50%', top: '34%', width: '135%', height: 3, borderRadius: 3, background: `linear-gradient(90deg, transparent, ${GAZE} 30%, #ffffff 50%, ${GAZE} 70%, transparent)`, boxShadow: `0 0 8px ${GAZE}`, '--r0': `${r0}deg`, '--r1': `${r1}deg`, animation: anim('lgrGorgonRaySweep', 320, delay) }} />
)

export default {
  effects: {
    // Charge (tick): two thin green rays sweep the arena from her eyes.
    charge: () => <>{ray('a', -28, 14, 0)}{ray('b', 22, -12, 40)}</>,
    // Reflect (big): a silver mirror spins up in front of you, her green beam bends back into her, stone creeps out from
    // the impact and shatters into gray chunks.
    reflect: () => <>
      {flash('#e8fff0')}
      <div className="lgx" style={{ left: '50%', top: '86%', width: 46, height: 46, marginLeft: -23, marginTop: -23, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #ffffff 0 18%, #dfe6ee 40%, #9aa6b4 75%, #5c6672 100%)', border: '3px solid #2a3038', boxShadow: '0 0 16px #ffffff', animation: anim('lgrGorgonMirror', 700, 0, POP) }} />
      <div className="lgx" style={{ left: '50%', top: '34%', width: 10, height: '52%', marginLeft: -5, borderRadius: 6, transformOrigin: '50% 100%', background: `linear-gradient(0deg, #ffffff, ${GAZE} 40%, #19c96a)`, boxShadow: `0 0 14px ${GAZE}`, animation: anim('lgrGorgonBeamBack', 650, 200, 'ease-out') }} />
      <div className="lgx" style={{ left: '50%', top: '34%', width: '70%', height: '70%', borderRadius: '50%', background: `radial-gradient(circle, ${STONE} 0 45%, rgba(167,162,154,.6) 62%, transparent 72%)`, mixBlendMode: 'hard-light', animation: anim('lgrGorgonStoneCreep', 700, 380, SETTLE) }} />
      <svg className="lgx" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ left: '50%', top: '34%', width: '70%', height: '70%', overflow: 'visible', animation: anim('lgrGorgonStoneCreep', 700, 420, SETTLE) }}>
        {['M50 48 L30 30 L22 12', 'M50 48 L72 26 L80 8', 'M50 48 L46 74 L36 92', 'M50 48 L78 58 L94 70', 'M50 48 L20 60 L6 66'].map((d, i) => <path key={i} d={d} fill="none" stroke={STONE_DARK} strokeWidth="2.5" strokeLinejoin="round" />)}
      </svg>
      {around(12, (i, a) => <div key={i} className="lgx" style={{ left: '50%', top: '36%', width: 9 + (i % 3) * 4, height: 8 + (i % 2) * 5, background: STONE, border: `2px solid ${STONE_DARK}`, borderRadius: 3, '--a': `${a + 11 * i}deg`, '--d': `${-70 - (i % 3) * 18}px`, '--spin': `${(i % 2 ? 1 : -1) * 200}deg`, animation: anim('lgxShard', 520, 680 + (i % 4) * 25) }} />)}
    </>,
    // Stoned (medium, a missed gaze): a cold gray tint flickers over her, and gray hearts drift off toward yours.
    stoned: () => <>
      <div className="lgx lgx-full" style={{ borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,162,154,.75) 0, rgba(95,90,82,.45) 55%, transparent 72%)', animation: anim('lgrGorgonGrayFlicker', 760) }} />
      {[0, 1, 2].map((i) => <div key={i} className="lgx" style={{ left: '50%', top: `${40 + i * 10}%`, fontSize: 18, fontWeight: 900, color: STONE, WebkitTextStroke: `1.5px ${STONE_DARK}`, '--tx': `${120 + i * 20}px`, '--ty': `${20 - i * 15}px`, animation: anim('lgxToHearts', 700, i * 90) }}>♥</div>)}
    </>,
  },
  floaters: { charge: 'lg_fx_mirrorCharge', reflect: 'lg_fx_mirrorReflect', stoned: 'lg_fx_mirrorStoned' },
  floaterTone: { charge: 'success', reflect: 'ink', stoned: 'danger' },
  demo: { charge: { kind: 'hit', damage: 2, lives: 0 }, reflect: { kind: 'hit', damage: 5, lives: 0 }, stoned: { kind: 'miss', damage: 0, lives: 1 } },
  juice: {
    charge: { size: 'tick', sfx: 'gorgon.charge' },
    reflect: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'gorgon.reflect' },
    stoned: { size: 'medium', shake: 1, hitstop: 1, sfx: 'gorgon.stoned' },
  },
  // Reactions on the boss art box. Petrify: she freezes in grayscale with the contrast up, then a crack-shake breaks
  // it. Coil: a slow, smug coil (scale 1.03, a 2 deg sway). Glare: a tiny lean in as the gaze charges.
  css: `
.lgr-gorgon-charge { animation: lgrGorgonGlare 300ms ease-out both; transform-origin: 50% 100% }
.lgr-gorgon-reflect { animation: lgrGorgonPetrify 1200ms linear both; transform-origin: 50% 60% }
.lg-boss[data-phase="3"] .lgr-gorgon-reflect { animation-name: lgrGorgonPetrifyP3 }
.lgr-gorgon-stoned { animation: lgrGorgonCoil 780ms ease-in-out both; transform-origin: 50% 100% }
@keyframes lgrGorgonGlare { 0%, 100% { transform: none } 45% { transform: translateY(-6px) scale(1.06) } 75% { transform: translateY(-2px) scale(1.02) } }
@keyframes lgrGorgonPetrify { 0% { filter: none; transform: none } 8%, 50% { filter: grayscale(1) contrast(1.45) brightness(1.08); transform: scale(1.03) } 54% { transform: translate(-6px, 1px) } 58% { transform: translate(6px, -1px) } 62% { transform: translate(-4px, 0) } 66% { transform: translate(3px, 1px) } 70%, 82% { filter: grayscale(1) contrast(1.45) brightness(1.08); transform: none } 100% { filter: none; transform: none } }
@keyframes lgrGorgonPetrifyP3 { 0% { filter: none; transform: none } 8%, 50% { filter: grayscale(1) contrast(1.6) brightness(1.12); transform: scale(1.04) } 54% { transform: translate(-8px, 2px) } 58% { transform: translate(8px, -2px) } 62% { transform: translate(-5px, 0) } 66% { transform: translate(4px, 1px) } 70%, 82% { filter: grayscale(1) contrast(1.6) brightness(1.12); transform: none } 100% { filter: none; transform: none } }
@keyframes lgrGorgonCoil { 0%, 100% { transform: none } 30% { transform: scale(1.09) rotate(-5deg) } 62% { transform: scale(1.07) rotate(4deg) } 85% { transform: scale(1.02) rotate(-1deg) } }
@keyframes lgrGorgonRaySweep { 0% { transform: translate(-50%, -50%) rotate(var(--r0)) scaleX(.2); opacity: 0 } 25% { opacity: 1 } 80% { opacity: .9 } 100% { transform: translate(-50%, -50%) rotate(var(--r1)) scaleX(1); opacity: 0 } }
@keyframes lgrGorgonMirror { 0% { transform: scale(0) rotateY(0); opacity: 0 } 30% { transform: scale(1.2) rotateY(540deg); opacity: 1 } 55% { transform: scale(1) rotateY(720deg); opacity: 1 } 85% { opacity: 1 } 100% { transform: scale(.9) rotateY(720deg); opacity: 0 } }
@keyframes lgrGorgonBeamBack { 0% { transform: scaleY(0); opacity: 0 } 30% { transform: scaleY(1); opacity: 1 } 70% { transform: scaleY(1) scaleX(1.6); opacity: 1 } 100% { transform: scaleY(1) scaleX(.2); opacity: 0 } }
@keyframes lgrGorgonStoneCreep { 0% { transform: translate(-50%, -50%) scale(.1); opacity: 0 } 30% { opacity: .95 } 75% { transform: translate(-50%, -50%) scale(1); opacity: .95 } 100% { transform: translate(-50%, -50%) scale(1.05); opacity: 0 } }
@keyframes lgrGorgonGrayFlicker { 0% { opacity: 0 } 12% { opacity: .9 } 22% { opacity: .3 } 34% { opacity: .85 } 48% { opacity: .35 } 62% { opacity: .7 } 100% { opacity: 0 } }
/* THE REAL PARTS: the state layer this ability draws on the boss (its lg-ab-* group in raids/gorgon.svg) moves with
   the moment, not only the whole figure. Played only while data-fx is set (never in focus mode, with Still bosses or
   under reduced motion). */
@keyframes lgrGorgonGazeGlare { 0%, 100% { transform: none; filter: none } 40% { transform: scale(1.18); filter: brightness(1.7) saturate(1.3) } }
.lg-boss[data-fx="charge"] [class*="lg-ab-gaze-"] { transform-box: fill-box; transform-origin: center; animation: lgrGorgonGazeGlare 320ms cubic-bezier(.22,1,.36,1) both }
`,
}
