// A RAID POWER BEING USED (powers.js), played in the boss box the moment the button is pressed: the power's own look
// (Shield: a blue dome slams up; 50:50: shears snip twice; Sharpen: a blade glints and sparks; Hint: a scroll unrolls in
// gold light), its icon popping and a label. Second wind plays the strike layer's 'wind' moment instead. While armed,
// Shield and Sharpen stay visible (PowerArmed): the hearts carry a blue ward, the boss a gold target lock, until the
// answer spends them. Same rules as every effect: only while effects may play (not focus mode, Still bosses or
// reduced motion), fixed bright colors, inside the boss box.
import { FONT } from '../../../config/tokens'
import { FLOATER_OUTLINE } from '../fx/_juice'
import { POWERS } from '../powers'
import { PARTS, PARTS_CSS } from './parts'

export const POWER_FX = {
  shield: { color: '#6fc3ff', label: 'lg_fxCast_shield', parts: [['bubble', {}], ['ring', { color: '#6fc3ff', scale: 2, width: 4 }], ['sparks', { n: 10, color: '#d6f0ff' }]] },
  fifty: { color: '#ff6bd5', label: 'lg_fxCast_fifty', parts: [['cleave', { small: true }], ['ring', { color: '#ff6bd5', scale: 1.8 }]], snip: true },
  sharpen: { color: '#ffd23a', label: 'lg_fxCast_sharpen', parts: [['sparks', { n: 14, color: '#fff2b0', reach: 1.2 }], ['ring', { color: '#ffd23a', scale: 2.2, width: 4 }]], glint: true },
  hint: { color: '#ffb84a', label: 'lg_fxCast_hint', parts: [['rays', { n: 10, color: '#ffd27a' }], ['rise', { n: 6, glyph: 'star4', size: 0.5, color: '#fff2b0' }]] },
}

const CSS = `
@keyframes lgpIcon { 0% { transform: translate(-50%, -50%) scale(.2) rotate(-20deg); opacity: 0 } 25% { transform: translate(-50%, -50%) scale(1.35) rotate(6deg); opacity: 1 } 40% { transform: translate(-50%, -50%) scale(1) rotate(0) } 75% { opacity: 1 } 100% { transform: translate(-50%, -80%) scale(1.1); opacity: 0 } }
@keyframes lgpLabel { 0% { transform: translateX(-50%) scale(2); opacity: 0 } 20% { transform: translateX(-50%) scale(.95); opacity: 1 } 32% { transform: translateX(-50%) scale(1) } 78% { opacity: 1 } 100% { transform: translateX(-50%) translateY(-10px); opacity: 0 } }
@keyframes lgpSnip { 0% { transform: translate(-50%, -50%) rotate(var(--a)) scaleX(0); opacity: 0 } 30% { opacity: 1; transform: translate(-50%, -50%) rotate(var(--a)) scaleX(1) } 100% { transform: translate(-50%, -50%) rotate(var(--a)) scaleX(1); opacity: 0 } }
@keyframes lgpGlint { 0% { transform: translateX(-60cqw) rotate(25deg); opacity: 0 } 20% { opacity: 1 } 100% { transform: translateX(60cqw) rotate(25deg); opacity: 0 } }
@keyframes lgpWard { 0%, 100% { box-shadow: 0 0 0 2px #6fc3ff, 0 0 8px #6fc3ff } 50% { box-shadow: 0 0 0 3px #6fc3ff, 0 0 18px #6fc3ff } }
@keyframes lgpLock { 0% { transform: rotate(0deg) scale(1) } 50% { transform: rotate(45deg) scale(.94) } 100% { transform: rotate(90deg) scale(1) } }
@keyframes lgpLockIn { 0% { opacity: 0; transform: translate(-50%, -50%) scale(1.8) } 100% { opacity: 1; transform: translate(-50%, -50%) scale(1) } }
`

// The colored emoji form (a bare 🛡 or ⚔ draws as a thin outline on Windows).
export const colorEmoji = (s = '') => (s && !s.endsWith('️') && s.length <= 2 ? `${s}️` : s)

export function PowerFx({ t, power, fading = false }) {
  const spec = power && POWER_FX[power.id]
  if (!spec) return null
  const ctx = { color: spec.color, accent: '#1a1020', glyph: 'star4', scale: 1, speed: 1 }
  return (
    <div key={`pw${power.n}`} aria-hidden="true" data-power-fx={power.id} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2, containerType: 'size', clipPath: 'inset(-30%)', opacity: fading ? 0 : 1, transition: 'opacity 200ms ease-in' }}>
      <style>{PARTS_CSS + CSS}</style>
      {spec.parts.map(([name, params], i) => <div key={`${name}${i}`} style={{ position: 'absolute', inset: 0 }}>{PARTS[name](params, ctx)}</div>)}
      {spec.snip && [-28, 28].map((a, i) => (
        <div key={`sn${i}`} style={{ position: 'absolute', left: '50%', top: '50%', width: '110cqw', height: '2.6cqw', borderRadius: 4, background: `linear-gradient(90deg, transparent, #fff, ${spec.color}, #fff, transparent)`, boxShadow: `0 0 2cqw ${spec.color}`,
          '--a': `${a}deg`, animation: `lgpSnip 420ms cubic-bezier(.2,.9,.3,1) ${120 + i * 160}ms both` }} />
      ))}
      {spec.glint && <div style={{ position: 'absolute', left: '50%', top: '-20%', width: '14cqw', height: '140%', marginLeft: '-7cqw', background: 'linear-gradient(90deg, transparent, #fffbe6, transparent)', filter: 'blur(1px)', animation: 'lgpGlint 620ms ease-in-out 100ms both' }} />}
      <div style={{ position: 'absolute', left: '50%', top: '50%', fontSize: '34cqw', lineHeight: 1, filter: `drop-shadow(0 0 3cqw ${spec.color})`, animation: 'lgpIcon 1000ms cubic-bezier(.22,1,.36,1) both' }}>{colorEmoji(POWERS[power.id]?.icon)}</div>
      <div style={{ position: 'absolute', left: '50%', top: '14%', whiteSpace: 'nowrap', fontFamily: FONT.display, fontWeight: 900, fontSize: 20, letterSpacing: '.04em', color: spec.color, WebkitTextStroke: `2px ${FLOATER_OUTLINE}`, paintOrder: 'stroke fill', animation: 'lgpLabel 1000ms cubic-bezier(.22,1,.36,1) 80ms both' }}>
        {t(spec.label)}
      </div>
    </div>
  )
}

// Sharpen armed: a gold target lock turning slowly over the boss, until the answer spends it.
export function SharpenLock() {
  return (
    <div aria-hidden="true" data-power-armed="sharpen" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
      <style>{CSS}</style>
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: '78%', height: '78%', animation: 'lgpLockIn 300ms ease-out both' }}>
        <div style={{ position: 'absolute', inset: 0, animation: 'lgpLock 2.4s linear infinite' }}>
          <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true" style={{ overflow: 'visible', filter: 'drop-shadow(0 0 4px #ffd23a)' }}>
            <circle cx="50" cy="50" r="44" fill="none" stroke="#ffd23a" strokeWidth="2.5" strokeDasharray="20 14" />
            {[0, 90, 180, 270].map((a) => <path key={a} d="M50 0v14" stroke="#fff6c8" strokeWidth="3.5" strokeLinecap="round" transform={`rotate(${a} 50 50)`} />)}
          </svg>
        </div>
      </div>
    </div>
  )
}

// Shield armed: the hearts row wears a pulsing blue ward and a shield badge.
export function wardStyle(on) {
  return on ? { borderRadius: 999, padding: '1px 6px', animation: 'lgpWard 1.6s ease-in-out infinite' } : null
}
export const POWER_ARMED_CSS = CSS
