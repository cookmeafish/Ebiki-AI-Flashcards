// THE IMPACT LAYER of a raid strike (strikeFx.js names the moment). Every raid boss plays its OWN impact for EACH of
// the nine moments (impact/styles.js): a hit, a critical (its own starburst), a Sharpen (its own honed blades), its plain
// strike on you, a heavy blow (a different, bigger move: the ground quakes), a block (its own barrier sigil and a parry),
// a Shield save (its glyphs glancing off the dome), Second wind (the heart and its flourish), its knockout. No moment
// reuses another's parts with a new label (the owner: every impact needs to be different). The label names the moment.
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
    // Each moment plays the boss's OWN spec for it (impact/styles.js), never another moment's parts with a new label.
    case 'hit': return { scale: 1, parts: [['flash', {}], ...style.hit] }
    case 'crit': return { scale: 1.1, parts: [['flash', { big: true }], ...style.crit] }
    case 'sharpen': return { scale: 1.1, parts: style.sharpen || style.crit }
    case 'hurt': return { scale: 1, parts: style.strike }
    case 'hurtBig': return { scale: 1.2, parts: style.heavy || [...style.strike, ['quake', {}]] }
    case 'block': return { scale: 0.85, parts: [...(style.block || []), ['parry', { color: style.color }]] }
    // A save and Second wind carry the boss's OWN colors and glyphs on top of their shared sign (the dome, the heart):
    // its blow sparks off the dome in its color; its glyphs scatter away while the heart comes back.
    case 'shield': return { scale: 0.85, parts: [...(style.shield || [['bubble', {}]]), ['ring', { color: style.color, scale: 1.35, width: 6, delay: 200 }], ['sparks', { n: 12, color: style.color, reach: 1.25 }]] }
    case 'wind': return { scale: 1, parts: [...(style.wind || [['heart', {}]]), ['burst', { n: 9, size: 0.85, reach: 1.25, spin: 160 }]] }
    case 'ko': return { scale: 1, parts: style.ko }
    default: return { scale: 1, parts: [] }
  }
}

export default function StrikeFxLayer({ t, moment, motif, n, fading = false }) {
  if (!moment) return null
  const style = impactFor(motif)
  const { scale, parts } = momentParts(moment, style)
  const ctx = { color: style.color, accent: style.accent, glyph: style.glyph, scale, speed: 1 }
  const nodes = parts.map(([name, params], i) => {
    const draw = PARTS[name]
    if (!draw) return null
    return <div key={`${name}${i}`} style={{ position: 'absolute', inset: 0 }}>{draw(params || {}, ctx)}</div>
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
