import Dropdown from './Dropdown'
import { C, RADIUS, FONT, SHADOW } from '../config/tokens'

// The header's mode + deck switcher as ONE split control: the mode on the left, the deck THAT MODE
// studies on the right, inside one shared shell with a link glyph between them, so it reads as a
// pair ("this mode uses this deck"). Presentation only: App passes the existing handlers
// (switchActiveMode / setAnkiDeck) and option lists, so every guard they carry still applies.
//
// deck: null = no deck segment (Anki state unknown yet); { disabled: true, label } = Anki not
// connected (shown greyed, not clickable); else { value, options, onChange, ariaLabel }.
// compact (phone width): the control fills its row and the two halves share it EQUALLY, without the option icons and
// with tighter padding, so a phone shows both names instead of "🌐 ▾ | 🗂️ A...". rowWidth (CSS px the compact control
// gets): under two readable halves (COMPACT_SEG_MIN each) the deck goes UNDER the mode, each at full width.
const COMPACT_SEG_MIN = 110 // CSS px a compact half needs to show a name
const SEG_MAX = 220 // CSS px per segment before the name ellipsizes

const segStyle = (color, side) => ({
  padding: '7px 11px', fontSize: 13, fontFamily: FONT.body, fontWeight: 700, cursor: 'pointer', // no inline outline: it hid the global :focus-visible ring (keyboard focus was invisible)
  color, background: 'transparent', border: 'none',
  borderRadius: side === 'both' ? RADIUS.md - 1
    : side === 'left' ? `${RADIUS.md - 1}px 0 0 ${RADIUS.md - 1}px`
    : side === 'top' ? `${RADIUS.md - 1}px ${RADIUS.md - 1}px 0 0`
    : side === 'bottom' ? `0 0 ${RADIUS.md - 1}px ${RADIUS.md - 1}px` : `0 ${RADIUS.md - 1}px ${RADIUS.md - 1}px 0`,
  minWidth: 0, maxWidth: '100%',
})

const segWrap = { display: 'flex', minWidth: 0, flex: '0 1 auto', maxWidth: SEG_MAX }
const segWrapCompact = { display: 'flex', minWidth: 0, flex: '1 1 0', maxWidth: 'none' }
const COMPACT_SEG = { padding: '6px 9px', fontSize: 12.5, width: '100%' }
const noIcons = (options) => options.map(({ icon, ...o }) => o) // eslint-disable-line no-unused-vars

function LinkGlyph({ across = false }) {
  // A small chain link straddling the divider line (`across`: a horizontal line, the halves stacked).
  return (
    <span aria-hidden="true" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', ...(across ? { height: 1 } : { width: 1 }), alignSelf: 'stretch', background: C.border, flex: 'none' }}>
      <span style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 16, height: 16, borderRadius: RADIUS.pill, background: C.surface, border: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.inkDim, zIndex: 1,
      }}>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
          <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
        </svg>
      </span>
    </span>
  )
}

export default function ModeDeckSwitch({ mode, deck, tip, getZoom, compact = false, rowWidth = Infinity }) {
  const stacked = compact && !!deck && rowWidth < 2 * COMPACT_SEG_MIN
  const wrap = compact ? segWrapCompact : segWrap
  const seg = (color, side) => (compact ? { ...segStyle(color, side), ...COMPACT_SEG } : segStyle(color, side))
  const opts = (options) => (compact ? noIcons(options) : options)
  return (
    <div role="group" aria-label={tip} className="tip tip-b" data-tip={tip}
      style={{
        display: compact ? 'flex' : 'inline-flex', flexDirection: stacked ? 'column' : 'row', alignItems: 'stretch', minWidth: 0, maxWidth: '100%', ...(compact ? { width: '100%' } : {}),
        border: `1px solid ${C.border}`, borderRadius: RADIUS.md, background: C.surface, cursor: 'default', boxShadow: SHADOW.sm,
      }}>
      <Dropdown value={mode.value} getZoom={getZoom} onChange={mode.onChange} options={opts(mode.options)}
        ariaLabel={mode.ariaLabel} wrapStyle={wrap} style={seg(C.brand, deck ? (stacked ? 'top' : 'left') : 'both')} />
      {deck && <LinkGlyph across={stacked} />}
      {deck && (deck.disabled ? (
        <button type="button" disabled aria-label={deck.ariaLabel}
          style={{ ...seg(C.inkDim, stacked ? 'bottom' : 'right'), flex: compact ? '1 1 0' : '0 1 auto', maxWidth: compact ? 'none' : SEG_MAX, display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', cursor: 'default', opacity: 0.5 }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{deck.label}</span>
        </button>
      ) : (
        <Dropdown value={deck.value} getZoom={getZoom} onChange={deck.onChange} options={opts(deck.options)}
          ariaLabel={deck.ariaLabel} wrapStyle={wrap} style={seg(C.success, stacked ? 'bottom' : 'right')} />
      ))}
    </div>
  )
}
