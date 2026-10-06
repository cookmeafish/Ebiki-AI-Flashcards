// What the lich raid ability (minions: Raise Dead) LOOKS like. The fx contract is in fx/index.js, the juice in
// fx/_juice.js. Fixed bright colors (never theme tokens over the art).
import { center, anim, around, ring, flash } from './_kit'

const SOUL = '#5dff9a'
const BONE = '#f4f1e4'

export default {
  effects: {
    // Raise (medium): green soul-fire bursts from the floor, skeletal hands claw up along the bottom.
    raise: () => <>
      <div className="lgx" style={{ left: '50%', bottom: '-12%', width: '70%', height: '70%', transformOrigin: 'bottom', background: `radial-gradient(ellipse at 50% 100%, #e8fff0 0 12%, ${SOUL} 35%, rgba(93,255,154,0) 70%)`, animation: anim('lgxBeam', 800) }} />
      {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="lgx" style={{ left: `${12 + i * 14}%`, bottom: '-4%', fontSize: 20, color: BONE, filter: `drop-shadow(0 0 5px ${SOUL})`, transform: `scaleX(${i % 2 ? -1 : 1})`, animation: anim('lgrLichFxClaw', 760, i * 60, 'cubic-bezier(.34,1.56,.64,1)') }}>✋</div>)}
    </>,
    // Burst (big): the skeleton explodes into spinning bones; a green-white skull flash shrinks away.
    burst: () => <>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>{flash('#d8ffe6')}</div>
      {around(16, (i, a) => <div key={i} className="lgx" style={{ ...center, fontSize: 16 + (i % 3) * 3, lineHeight: 1, '--a': `${a + i * 4}deg`, '--d': `${-100 - (i % 4) * 16}px`, '--spin': `${(i % 2 ? 1 : -1) * (360 + i * 25)}deg`, filter: `drop-shadow(0 0 4px ${SOUL})`, animation: anim('lgxShard', 950 + (i % 3) * 90, 40) }}>🦴</div>)}
      <div className="lgx" style={{ ...center, fontSize: 64, lineHeight: 1, filter: `drop-shadow(0 0 16px ${SOUL}) brightness(1.4)`, animation: anim('lgxGulp', 900, 100) }}>💀</div>
      {ring(SOUL, 0, 2.3, 5, 800)}
    </>,
    // Escape (medium): a green wisp flies into him.
    escape: () => <>
      <div className="lgx" style={{ left: '50%', top: '50%', width: 22, height: 30, marginLeft: -11, marginTop: -15, borderRadius: '50% 50% 45% 45%', background: `radial-gradient(circle at 50% 40%, #fff 0 18%, ${SOUL} 50%, rgba(93,255,154,0) 75%)`, '--x0': '-90px', '--y0': '80px', animation: anim('lgxFly', 700, 0, 'ease-in') }} />
      {[0, 1, 2].map((i) => <div key={i} className="lgx" style={{ left: '50%', top: '50%', width: 8, height: 8, borderRadius: '50%', background: SOUL, opacity: 0.7, '--x0': `${-80 + i * 10}px`, '--y0': `${70 + i * 8}px`, animation: anim('lgxFly', 700, 60 + i * 50, 'ease-in') }} />)}
      {ring(SOUL, 520, 1.2, 3, 300)}
    </>,
  },
  floaters: { raise: 'lg_fx_raiseDead', burst: 'lg_fx_boneBurst', escape: 'lg_fx_minionEscape' },
  floaterTone: { raise: 'success', burst: 'success', escape: 'danger' },
  // The asset view's Try it: an escape heals him by K.heal (abilities/lich.js), shown in its floater.
  demo: { escape: { kind: 'miss', damage: 0, lives: 0, fxVars: { n: 2 } } },
  juice: {
    raise: { size: 'medium', shake: 1, flash: 1, hitstop: 1, sfx: 'lich.raise' },
    burst: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'lich.burst' },
    escape: { size: 'medium', shake: 1, sfx: 'lich.escape' },
  },
  css: `
@keyframes lgrLichFxClaw { 0% { transform: translateY(40px) rotate(-10deg); opacity: 0 } 30% { opacity: 1 } 55% { transform: translateY(-14px) rotate(6deg) } 80% { transform: translateY(-8px) rotate(-4deg); opacity: 1 } 100% { transform: translateY(30px); opacity: 0 } }
@keyframes lgrLichAscend { 0% { transform: none } 30% { transform: translateY(-10px) } 65% { transform: translateY(-10px) } 100% { transform: none } }
@keyframes lgrLichShudder { 0%, 100% { transform: none } 15% { transform: translateX(-8px) rotate(-7deg) } 30% { transform: translateX(6px) rotate(5deg) } 45% { transform: translateX(-4px) rotate(-3deg) } 60% { transform: translateX(2px) rotate(2deg) } 78% { transform: translateX(-1px) rotate(-1deg) } }
@keyframes lgrLichInhale { 0%, 100% { transform: none } 45% { transform: scale(.93, 1.1) translateY(-4px) } 70% { transform: scale(.97, 1.04) } }
.lgr-lich-raise { animation: lgrLichAscend 800ms cubic-bezier(.22,1,.36,1) both }
.lgr-lich-burst { transform-origin: 50% 15%; animation: lgrLichShudder 700ms ease-out both }
.lg-boss[data-phase="3"] .lgr-lich-burst { animation-duration: 900ms }
.lgr-lich-escape { transform-origin: 50% 100%; animation: lgrLichInhale 700ms cubic-bezier(.22,1,.36,1) both }
/* fx-layer motion: the phase 1 grin chatters, three quick beats of the jaw from its top edge */
@keyframes lgrLichChatter { 0%, 100% { transform: none } 12% { transform: translateY(1.3px) } 24% { transform: none } 40% { transform: translateY(1.3px) } 52% { transform: none } 68% { transform: translateY(1.3px) } 80% { transform: none } }
.lg-boss[data-fx="raise"] .lgfa-lich-chatter { transform-box: fill-box; transform-origin: 50% 0%; animation: lgrLichChatter 640ms ease-in-out both }
`,
}
