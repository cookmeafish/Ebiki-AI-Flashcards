import Dropdown from './Dropdown'
import { C, RADIUS, FONT } from '../config/tokens'

// The header's mode + deck switcher as ONE split control: the mode on the left, the deck THAT MODE
// studies on the right, inside one shared shell with a link glyph between them, so it reads as a
// pair ("this mode uses this deck"). Presentation only: App passes the existing handlers
// (switchActiveMode / setAnkiDeck) and option lists, so every guard they carry still applies.
//
// deck: null = no deck segment (Anki state unknown yet); { disabled: true, label } = Anki not
// connected (shown greyed, not clickable); else { value, options, onChange, ariaLabel }.
const SEG_MAX = 220 // CSS px per segment before the name ellipsizes

const segStyle = (color, side) => ({
  padding: '7px 11px', fontSize: 13, fontFamily: FONT.body, fontWeight: 700, cursor: 'pointer', outline: 'none',
  color, background: 'transparent', border: 'none',
  borderRadius: side === 'both' ? RADIUS.md - 1
    : side === 'left' ? `${RADIUS.md - 1}px 0 0 ${RADIUS.md - 1}px` : `0 ${RADIUS.md - 1}px ${RADIUS.md - 1}px 0`,
  minWidth: 0, maxWidth: '100%',
})

const segWrap = { display: 'flex', minWidth: 0, flex: '0 1 auto', maxWidth: SEG_MAX }

function LinkGlyph() {
  // A small chain link straddling the divider line.
  return (
    <span aria-hidden="true" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 1, alignSelf: 'stretch', background: C.border, flex: 'none' }}>
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

export default function ModeDeckSwitch({ mode, deck, tip, getZoom }) {
  return (
    <div role="group" aria-label={tip} className="tip tip-b" data-tip={tip}
      style={{
        display: 'inline-flex', alignItems: 'stretch', minWidth: 0, maxWidth: '100%',
        border: `1px solid ${C.borderStrong}`, borderRadius: RADIUS.md, background: C.surface, cursor: 'default',
      }}>
      <Dropdown value={mode.value} getZoom={getZoom} onChange={mode.onChange} options={mode.options}
        ariaLabel={mode.ariaLabel} wrapStyle={segWrap} style={segStyle(C.brand, deck ? 'left' : 'both')} />
      {deck && <LinkGlyph />}
      {deck && (deck.disabled ? (
        <button type="button" disabled aria-label={deck.ariaLabel}
          style={{ ...segStyle(C.inkDim, 'right'), flex: '0 1 auto', maxWidth: SEG_MAX, display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', cursor: 'default', opacity: 0.5 }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{deck.label}</span>
        </button>
      ) : (
        <Dropdown value={deck.value} getZoom={getZoom} onChange={deck.onChange} options={deck.options}
          ariaLabel={deck.ariaLabel} wrapStyle={segWrap} style={segStyle(C.success, 'right')} />
      ))}
    </div>
  )
}
