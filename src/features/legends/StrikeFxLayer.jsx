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
import { labelFontSize } from './impact/labelFit'

const LABEL_CSS = `
@keyframes lgsLabel { 0% { transform: translateX(-50%) scale(2.4) rotate(-6deg); opacity: 0 } 16% { transform: translateX(-50%) scale(.9) rotate(2deg); opacity: 1 } 26% { transform: translateX(-50%) scale(1.08) rotate(-1deg) } 36% { transform: translateX(-50%) scale(1) rotate(0) } 78% { opacity: 1 } 100% { transform: translateX(-50%) translateY(calc(-1 * min(8px, 6cqh))); opacity: 0 } }
@keyframes lgsStamp { 0% { transform: translate(-50%, -50%) scale(3.2) rotate(-16deg); opacity: 0 } 9% { transform: translate(-50%, -50%) scale(.9) rotate(-5deg); opacity: 1 } 14% { transform: translate(-50%, -50%) scale(1.07) rotate(-7deg) } 20% { transform: translate(-50%, -50%) scale(1) rotate(-6deg) } 74% { transform: translate(-50%, -50%) scale(1) rotate(-6deg); opacity: 1 } 100% { transform: translate(-50%, 40%) scale(.62) rotate(-4deg); opacity: 0 } }
`
// The defeated tag (under a beaten raid boss): the stamp's small, still form. It is ALL that shows when effects are off
// (focus mode, Still bosses, reduced motion): the calm knockout is the boss greyed with this tag. Under the boss, never
// over it.
// THE HANDOVER after a knockout cinematic: the stamp's own layer plays the tag's pop (KoTagIn), on the stamp's clock, as
// the stamp fades out, and hides the real tag until the layer goes (a CSS rule on its next sibling). The layer then
// leaves the real tag, already finished, in exactly the same place: one plate becomes the other. The real tag's own
// timer ran on another clock (the arena's mount, not the juice timer): it popped in while the stamp still faded, about
// 200 ms of two DEFEATED plates on every boss, longer on a busy page.
const KO_TAG_CSS = '@keyframes lgsKoTag { 0% { transform: translateX(-50%) rotate(-4deg) scale(1.3); opacity: 0 } 100% { transform: translateX(-50%) rotate(-4deg) scale(1); opacity: 1 } }'
// The pop starts this long before the stamp's end (it is under 3% opaque by then).
export const KO_TAG_LEAD = 40
const KO_TAG_POP = 380
// The tag's size: 14 px, 10.5 px on the compact arena (a 68 px boss; at 14 px the tag was wider than the boss and its
// headroom and hung past the arena's left edge). The layer's copy picks it by a container query on the box width.
const KO_TAG_SIZE = { font: 14, pad: '0 10px' }
const KO_TAG_SMALL = { font: 10.5, pad: '0 6px' }
const KO_HANDOVER_CSS = `[data-strike-fx="ko"] ~ [data-ko-tag] { opacity: 0 !important }
.lgs-kotag { font-size: ${KO_TAG_SIZE.font}px; padding: ${KO_TAG_SIZE.pad} }
@container (max-width: 100px) { .lgs-kotag { font-size: ${KO_TAG_SMALL.font}px; padding: ${KO_TAG_SMALL.pad} } }`
const plate = (color, big) => ({ whiteSpace: 'nowrap', fontFamily: FONT.display, fontWeight: 900, letterSpacing: '.06em', color: '#ffffff', WebkitTextStroke: `${big ? 2 : 1.5}px ${FLOATER_OUTLINE}`, paintOrder: 'stroke fill',
  background: '#1a1020e8', border: `${big ? 3 : 2}px solid ${color}`, borderRadius: big ? 10 : 7, boxShadow: big ? `0 0 18px ${color}, 0 4px 0 #000a` : '0 2px 0 #0008', pointerEvents: 'none' })
const tagStyle = (color) => ({ position: 'absolute', left: '50%', top: 'calc(100% - 10px)', transform: 'translateX(-50%) rotate(-4deg)', zIndex: 2, ...plate(color, false) })
// `delay` (ms): when it fades in (after a knockout cinematic); null = shown at once, still. `small`: the compact arena.
export function KoTag({ t, motif, delay = null, small = false }) {
  const s = impactFor(motif)
  const size = small ? KO_TAG_SMALL : KO_TAG_SIZE
  return (
    <div aria-hidden="true" data-ko-tag="" style={{ ...tagStyle(s.color), fontSize: size.font, padding: size.pad,
      animation: delay == null ? undefined : `lgsKoTag ${KO_TAG_POP}ms cubic-bezier(.2,.9,.3,1) ${Math.round(delay)}ms both` }}>
      <style>{KO_TAG_CSS}</style>
      {t('lg_fxKo')}
    </div>
  )
}
// The tag's pop inside the knockout layer, `at` ms into the cinematic (see THE HANDOVER above).
function KoTagIn({ t, color, at }) {
  return (
    <div aria-hidden="true" data-ko-tag-in="" className="lgs-kotag" style={{ ...tagStyle(color), animation: `lgsKoTag ${KO_TAG_POP}ms cubic-bezier(.2,.9,.3,1) ${Math.round(at)}ms both` }}>
      <style>{KO_TAG_CSS + KO_HANDOVER_CSS}</style>
      {t('lg_fxKo')}
    </div>
  )
}
export const MOMENT_LABEL = { crit: 'lg_fxCrit', sharpen: 'lg_fxSharpen', block: 'lg_fxBlock', shield: 'lg_fxSaved', hurtBig: 'lg_fxHurtBig', wind: 'lg_fxWind', ko: 'lg_fxKo' } // the knockout's is its stamp
// The largest SETTLED scale of each word's animation (after its slam-in): what the label fit sizes for (labelFit.js).
export const LABEL_PEAK = 1.08 // lgsLabel 26%
export const STAMP_PEAK = 1.07 // lgsStamp 14%
// Its height: the label sits in the boss's headroom (20% of the box) plus the top 10% of the box, and must stay inside
// the arena card with its peak scale and its fading rise (at most 6cqh): at a tighter line (LABEL_LINE, the glyphs kept
// where Baloo's own 1.6 em line had them) its top is 0.1H - 1.44 em above the box, so 16cqh leaves the card's 2 px border
// clear at the peak (at a fixed 20 px and 1.6 em its top rose 3 to 7 px above the card on every boss).
export const LABEL_LINE = 1.1
export const LABEL_FIT = { maxPx: 20, peak: LABEL_PEAK, capH: 16 }
// The knockout stamp's plate: 4cqw padding and a 3 px border on each side, under a 13cqw cap (its look on a normal arena).
export const STAMP_FIT = { maxPx: 30, floorPx: 12, peak: STAMP_PEAK, spacing: 0.06, pad: { cqw: 8, px: 6 }, cap: 13 }
const LABEL_FILL = { crit: '#ffd23a', sharpen: '#ffd23a', block: '#8fe3ff', shield: '#6fc3ff', hurtBig: '#ff3b3b', wind: '#ff6b9a', ko: '#ffffff' }

// Which parts a moment plays, and at what scale (the strike smaller under a block or a Shield, bigger on a heavy blow).
export function momentParts(moment, style) {
  switch (moment) {
    // Each moment plays the boss's OWN spec for it (impact/styles.js), never another moment's parts with a new label.
    // style.flash (optional { y, size }) moves the shared white hit flash, e.g. off a face that sits where it lands
    case 'hit': return { scale: 1, parts: [['flash', { ...style.flash }], ...style.hit] }
    case 'crit': return { scale: 1.1, parts: [['flash', { big: true, ...style.flash }], ...style.crit] }
    case 'sharpen': return { scale: 1.1, parts: style.sharpen || style.crit }
    case 'hurt': return { scale: 1, parts: style.strike }
    case 'hurtBig': return { scale: 1.2, parts: style.heavy || [...style.strike, ['quake', {}]] }
    case 'block': return { scale: 0.85, parts: [...(style.block || []), ['parry', { color: style.color }]] }
    // A save and Second wind carry the boss's OWN colors and glyphs on top of their shared sign (the dome, the heart):
    // its blow sparks off the dome in its color; its glyphs scatter away while the heart comes back.
    case 'shield': return { scale: 0.85, parts: [...(style.shield || [['bubble', {}]]), ['ring', { color: style.color, scale: 1.35, width: 6, delay: 200, ...(style.shieldRingTop != null ? { top: style.shieldRingTop } : {}) }], ['sparks', { n: 12, color: style.color, reach: 1.25 }]] }
    case 'wind': return { scale: 1, parts: [...(style.wind || [['heart', {}]]), ['burst', { n: 9, size: 0.85, reach: 0.6, spin: 160, y: 36 }]] } // the flourish under the face, round the heart
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
  const label = MOMENT_LABEL[moment]
  const text = label && !ko ? t(label, labelVars(moment, last)) : ''
  return (
    // A knockout's debris may fly past the box only as far as the boss's headroom (art.jsx BOSS_HEADROOM, 20%).
    // The parts are clipped there; the WORDS (the label, the stamp) sit outside the clip, sized to the box (labelFit.js),
    // so they always show whole (at a fixed 20 px "HEAVY BLOW!" read "EAVY BLOW" on the compact arena).
    <div key={`sf${n}`} aria-hidden="true" data-strike-fx={moment} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, containerType: 'size', opacity: fading ? 0 : 1, transition: 'opacity 200ms ease-in' }}>
      <style>{PARTS_CSS + LABEL_CSS}</style>
      <div data-strike-clip="" style={{ position: 'absolute', inset: 0, clipPath: ko ? 'inset(-20%)' : 'inset(-30%)' }}>
      {nodes}
      {/* THE STAMP: after the climax, a heavy DEFEATED plate slams onto the boss in its colors, a white ring where it
          lands, then slides down and shrinks away as the cinematic ends (the defeated tag under the boss takes over) */}
      {ko && <>
        <div key="kr" style={{ position: 'absolute', inset: 0, animation: `lgiGate 1ms linear ${kt.land}ms both` }}>
          <div style={{ position: 'absolute', left: '50%', top: '54%', width: '70cqw', height: '30cqw', borderRadius: '50%', border: '3px solid #ffffff', boxShadow: `0 0 2cqw ${style.color}`, '--s0': 0.6, '--s1': 1.7,
            animation: `lgiRing 420ms ease-out ${kt.land}ms both` }} />
        </div>
      </>}
      </div>
      {ko && <>
        <div key="ks" data-ko-stamp="" style={{ position: 'absolute', left: '50%', top: '54%', fontSize: labelFontSize(t('lg_fxKo'), STAMP_FIT), padding: '0.4cqw 4cqw', zIndex: 2, ...plate(style.color, true),
          animation: `lgsStamp ${kt.stampMs}ms cubic-bezier(.2,.9,.3,1) ${kt.stampAt}ms both` }}>
          {t('lg_fxKo')}
        </div>
        <KoTagIn t={t} color={style.color} at={kt.ms - KO_TAG_LEAD} />
      </>}
      {text && (
        // Over the boss's head, never across its face (at 20% down the box "HEAVY BLOW!" covered every boss's eyes): the
        // label's bottom edge just inside the box top, the text in the headroom above. Its size fits the box; the outline
        // scales with it (2 px at the full 20 px).
        <div data-strike-label="" style={{ position: 'absolute', left: '50%', bottom: `calc(90% + ${Math.round(((1.6 - LABEL_LINE) / 2) * 100) / 100}em)`, lineHeight: LABEL_LINE, transformOrigin: 'center bottom', whiteSpace: 'nowrap', fontFamily: FONT.display, fontWeight: 900,
          fontSize: labelFontSize(text, LABEL_FIT), letterSpacing: '.04em', color: LABEL_FILL[moment], WebkitTextStroke: `.1em ${FLOATER_OUTLINE}`, paintOrder: 'stroke fill',
          animation: `lgsLabel 950ms cubic-bezier(.22,1,.36,1) 60ms both`, zIndex: 2 }}>
          {text}
        </div>
      )}
    </div>
  )
}
