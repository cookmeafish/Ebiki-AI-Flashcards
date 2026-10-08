// THE IMPACT LAYER of a raid strike (strikeFx.js names the moment). Every raid boss plays its OWN impact for EACH of
// the nine moments (impact/styles.js): a hit, a critical (its own starburst), a Sharpen (its own honed blades), its plain
// strike on you, a heavy blow (a different, bigger move: the ground quakes), a block (its own barrier sigil and a parry),
// a Shield save (its glyphs glancing off the dome), Second wind (the heart and its flourish), its knockout. No moment
// reuses another's parts with a new label (the owner: every impact needs to be different). The label names the moment.
// CSS and inline SVG only (impact/parts.jsx), sized in container units of this layer, inside the boss box, never over
// the question; BossArena mounts it only while effects may play (not in focus mode, Still bosses or reduced motion) and
// fades it with the next question.
import { FONT } from '../../config/tokens'
import { WIND_HEARTS } from './powers'
import { FLOATER_OUTLINE } from './fx/_juice'
import { impactFor, koTiming } from './impact/styles'
import { PARTS, PARTS_CSS, withDelay, drawWithin } from './impact/parts'

const LABEL_CSS = `
@keyframes lgsLabel { 0% { transform: translateX(-50%) scale(2.4) rotate(-6deg); opacity: 0 } 16% { transform: translateX(-50%) scale(.9) rotate(2deg); opacity: 1 } 26% { transform: translateX(-50%) scale(1.08) rotate(-1deg) } 36% { transform: translateX(-50%) scale(1) rotate(0) } 78% { opacity: 1 } 100% { transform: translateX(-50%) translateY(-14px); opacity: 0 } }
@keyframes lgsStamp { 0% { transform: translate(-50%, -50%) scale(3.2) rotate(-16deg); opacity: 0 } 9% { transform: translate(-50%, -50%) scale(.9) rotate(-5deg); opacity: 1 } 14% { transform: translate(-50%, -50%) scale(1.07) rotate(-7deg) } 20% { transform: translate(-50%, -50%) scale(1) rotate(-6deg) } 74% { transform: translate(-50%, -50%) scale(1) rotate(-6deg); opacity: 1 } 100% { transform: translate(-50%, 40%) scale(.62) rotate(-4deg); opacity: 0 } }
`
// The defeated tag (under a beaten raid boss): the stamp's small, still form. It fades in as the knockout's stamp
// fades out, and it is ALL that shows when effects are off (focus mode, Still bosses, reduced motion): the calm
// knockout is the boss greyed with this tag. Under the boss, never over it.
const KO_TAG_CSS = '@keyframes lgsKoTag { 0% { transform: translateX(-50%) rotate(-4deg) scale(1.3); opacity: 0 } 100% { transform: translateX(-50%) rotate(-4deg) scale(1); opacity: 1 } }'
const plate = (color, big) => ({ whiteSpace: 'nowrap', fontFamily: FONT.display, fontWeight: 900, letterSpacing: '.06em', color: '#ffffff', WebkitTextStroke: `${big ? 2 : 1.5}px ${FLOATER_OUTLINE}`, paintOrder: 'stroke fill',
  background: '#1a1020e8', border: `${big ? 3 : 2}px solid ${color}`, borderRadius: big ? 10 : 7, boxShadow: big ? `0 0 18px ${color}, 0 4px 0 #000a` : '0 2px 0 #0008', pointerEvents: 'none' })
// `delay` (ms): when it fades in (after a knockout cinematic); null = shown at once, still.
export function KoTag({ t, motif, delay = null }) {
  const s = impactFor(motif)
  return (
    <div aria-hidden="true" data-ko-tag="" style={{ position: 'absolute', left: '50%', top: 'calc(100% - 10px)', transform: 'translateX(-50%) rotate(-4deg)', fontSize: 14, padding: '0 10px', zIndex: 2, ...plate(s.color, false),
      animation: delay == null ? undefined : `lgsKoTag 380ms cubic-bezier(.2,.9,.3,1) ${Math.round(delay)}ms both` }}>
      <style>{KO_TAG_CSS}</style>
      {t('lg_fxKo')}
    </div>
  )
}
const LABEL = { crit: 'lg_fxCrit', sharpen: 'lg_fxSharpen', block: 'lg_fxBlock', shield: 'lg_fxSaved', hurtBig: 'lg_fxHurtBig', wind: 'lg_fxWind', ko: 'lg_fxKo' } // the knockout's is its stamp
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

// The numbers a moment's label shows come from the strike itself (`last`), never the locale: Second wind's hearts.
const labelVars = (moment, last) => (moment === 'wind' ? { n: last?.heartsBack || WIND_HEARTS } : {})

export default function StrikeFxLayer({ t, moment, motif, n, fading = false, last = null }) {
  if (!moment) return null
  const style = impactFor(motif)
  const { scale, parts } = momentParts(moment, style)
  const ctx = { color: style.color, accent: style.accent, glyph: style.glyph, scale, speed: 1 }
  // A part's `at` (ms) stages it: everything in it starts that much later and it stays unseen until then (the knockout
  // plays as a cinematic: the killing blow, the build-up, the boss's own death, the shockwave, the stamp).
  // A knockout part is fitted into the cinematic: one that would still play when it ends plays faster instead.
  const ko = moment === 'ko'
  const kt = ko ? koTiming(motif) : null
  const nodes = parts.map(([name, params], i) => {
    const draw = PARTS[name]
    if (!draw) return null
    const p = params || {}
    const at = Math.max(0, Number(p.at) || 0)
    const node = ko ? drawWithin(draw, p, ctx, kt.ms - at) : draw(p, ctx)
    return <div key={`${name}${i}`} data-at={at || undefined} style={{ position: 'absolute', inset: 0, animation: at ? `lgiGate 1ms linear ${at}ms both` : undefined }}>{withDelay(node, at)}</div>
  })
  const label = LABEL[moment]
  return (
    // A knockout's debris may fly past the box only as far as the boss's headroom (art.jsx BOSS_HEADROOM, 20%).
    <div key={`sf${n}`} aria-hidden="true" data-strike-fx={moment} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, containerType: 'size', clipPath: ko ? 'inset(-20%)' : 'inset(-30%)', opacity: fading ? 0 : 1, transition: 'opacity 200ms ease-in' }}>
      <style>{PARTS_CSS + LABEL_CSS}</style>
      {nodes}
      {/* THE STAMP: after the climax, a heavy DEFEATED plate slams onto the boss in its colors, a white ring where it
          lands, then slides down and shrinks away as the cinematic ends (the defeated tag under the boss takes over) */}
      {ko && <>
        <div key="kr" style={{ position: 'absolute', inset: 0, animation: `lgiGate 1ms linear ${kt.land}ms both` }}>
          <div style={{ position: 'absolute', left: '50%', top: '54%', width: '70cqw', height: '30cqw', borderRadius: '50%', border: '3px solid #ffffff', boxShadow: `0 0 2cqw ${style.color}`, '--s0': 0.6, '--s1': 1.7,
            animation: `lgiRing 420ms ease-out ${kt.land}ms both` }} />
        </div>
        <div key="ks" data-ko-stamp="" style={{ position: 'absolute', left: '50%', top: '54%', fontSize: 'clamp(12px, 13cqw, 30px)', padding: '0.4cqw 4cqw', zIndex: 2, ...plate(style.color, true),
          animation: `lgsStamp ${kt.stampMs}ms cubic-bezier(.2,.9,.3,1) ${kt.stampAt}ms both` }}>
          {t('lg_fxKo')}
        </div>
      </>}
      {label && !ko && (
        <div style={{ position: 'absolute', left: '50%', top: '20%', whiteSpace: 'nowrap', fontFamily: FONT.display, fontWeight: 900,
          fontSize: 20, letterSpacing: '.04em', color: LABEL_FILL[moment], WebkitTextStroke: `2px ${FLOATER_OUTLINE}`, paintOrder: 'stroke fill',
          animation: `lgsLabel 950ms cubic-bezier(.22,1,.36,1) 60ms both`, zIndex: 2 }}>
          {t(label, labelVars(moment, last))}
        </div>
      )}
    </div>
  )
}
