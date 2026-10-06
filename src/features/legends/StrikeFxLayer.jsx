// THE IMPACT LAYER of a raid strike (strikeFx.js names the moment). Every raid boss plays its OWN impact
// (impact/styles.js): its glyph flung by your hits, its own strike on you (Chronos' clock hands, the Tempest's
// lightning, the Vampire's fangs...), its own knockout. Shared on top, so the moment always reads: a white ring and
// "CRITICAL!" on a critical, a gold cleave on a Sharpen, a red crack and "HEAVY BLOW!" on a missed attack, a parry on a
// blocked attack (the strike played smaller behind it), a shield bubble, a heart rising on Second wind, "DEFEATED!".
// CSS and inline SVG only (impact/parts.jsx), sized in container units of this layer, inside the boss box, never over
// the question; BossArena mounts it only while effects may play (not in focus mode, Still bosses or reduced motion) and
// fades it with the next question.
import { FONT } from '../../config/tokens'
import { FLOATER_OUTLINE } from './fx/_juice'
import { impactFor } from './impact/styles'
import { PARTS, PARTS_CSS } from './impact/parts'

const LABEL_CSS = `
@keyframes lgsLabel { 0% { transform: translateX(-50%) scale(2.4) rotate(-6deg); opacity: 0 } 16% { transform: translateX(-50%) scale(.9) rotate(2deg); opacity: 1 } 26% { transform: translateX(-50%) scale(1.08) rotate(-1deg) } 36% { transform: translateX(-50%) scale(1) rotate(0) } 78% { opacity: 1 } 100% { transform: translateX(-50%) translateY(-14px); opacity: 0 } }
`
const LABEL = { crit: 'lg_fxCrit', sharpen: 'lg_fxSharpen', block: 'lg_fxBlock', shield: 'lg_fxSaved', hurtBig: 'lg_fxHurtBig', wind: 'lg_fxWind', ko: 'lg_fxKo' }
const LABEL_FILL = { crit: '#ffd23a', sharpen: '#ffd23a', block: '#8fe3ff', shield: '#6fc3ff', hurtBig: '#ff3b3b', wind: '#ff6b9a', ko: '#ffffff' }

// Which parts a moment plays, and at what scale (the strike smaller under a block or a Shield, bigger on a heavy blow).
export function momentParts(moment, style) {
  switch (moment) {
    case 'hit': return { scale: 1, parts: [['flash', {}], ...style.hit] }
    case 'crit': return { scale: 1.1, parts: [['flash', { big: true }], ...style.crit, ['ring', { color: '#ffffff', scale: 2.2, width: 4 }]] }
    case 'sharpen': return { scale: 1.1, parts: [['flash', { big: true }], ...style.crit, ['cleave', { small: true }], ['ring', { color: '#ffd23a', scale: 2.4, width: 5 }]], cleaveColor: '#ffd23a' }
    case 'hurt': return { scale: 1, parts: style.strike }
    case 'hurtBig': return { scale: 1.25, parts: [['crack', { n: 4, color: '#ff5a4a' }], ...style.strike, ...(style.strike.some(([p]) => p === 'vignette') ? [] : [['vignette', {}]])] }
    case 'block': return { scale: 0.75, parts: [...style.strike.filter(([p]) => p !== 'vignette'), ['parry', {}], ['sparks', { n: 10, color: '#8fe3ff' }]] }
    case 'shield': return { scale: 0.75, parts: [...style.strike.filter(([p]) => p !== 'vignette'), ['bubble', {}]] }
    case 'wind': return { scale: 1, parts: [['heart', {}], ['ring', { color: '#ff6b9a', scale: 1.8 }]] }
    case 'ko': return { scale: 1, parts: style.ko }
    default: return { scale: 1, parts: [] }
  }
}

export default function StrikeFxLayer({ t, moment, motif, n, fading = false }) {
  if (!moment) return null
  const style = impactFor(motif)
  const { scale, parts, cleaveColor } = momentParts(moment, style)
  const ctx = { color: style.color, accent: style.accent, glyph: style.glyph, scale, speed: 1 }
  const nodes = parts.map(([name, params], i) => {
    const draw = PARTS[name]
    if (!draw) return null
    const c = name === 'cleave' && cleaveColor ? { ...ctx, color: cleaveColor } : ctx
    return <div key={`${name}${i}`} style={{ position: 'absolute', inset: 0 }}>{draw(params || {}, c)}</div>
  })
  const label = LABEL[moment]
  return (
    <div key={`sf${n}`} aria-hidden="true" data-strike-fx={moment} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, containerType: 'size', clipPath: 'inset(-30%)', opacity: fading ? 0 : 1, transition: 'opacity 200ms ease-in' }}>
      <style>{PARTS_CSS + LABEL_CSS}</style>
      {nodes}
      {label && (
        <div style={{ position: 'absolute', left: '50%', top: moment === 'ko' ? '38%' : '20%', whiteSpace: 'nowrap', fontFamily: FONT.display, fontWeight: 900,
          fontSize: moment === 'ko' ? 28 : 20, letterSpacing: '.04em', color: LABEL_FILL[moment], WebkitTextStroke: `2px ${FLOATER_OUTLINE}`, paintOrder: 'stroke fill',
          animation: `lgsLabel ${moment === 'ko' ? 1500 : 950}ms cubic-bezier(.22,1,.36,1) 60ms both`, zIndex: 2 }}>
          {t(label)}
        </div>
      )}
    </div>
  )
}
