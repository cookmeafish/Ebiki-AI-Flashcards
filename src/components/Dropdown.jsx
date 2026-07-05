import { useState, useRef, useEffect } from 'react'

// A custom, always-scrollable dropdown to replace native <select> for lists that can grow long
// (modes, languages, decks). Native popups are positioned by the OS and can push items off the top
// of the screen (inaccessible). This menu instead:
//  - caps its height to the available space and scrolls internally (overflowY:auto),
//  - opens upward or downward toward whichever side has more room,
//  - is measured in VISUAL px (getBoundingClientRect) and converted to layout px via the body zoom,
//    so it fits the real viewport even with the app's `body { zoom:1.35 }`.
//
// options: [{ value, label, icon?, color?, divider? }]. `divider:true` draws a separator above the row.
export default function Dropdown({ value, onChange, options, style = {}, menuAlign = 'left', title, getZoom }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ up: false, maxH: 300 })
  const wrapRef = useRef(null)
  const btnRef = useRef(null)

  const current = options.find((o) => String(o.value) === String(value))

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  const toggle = () => {
    if (open) { setOpen(false); return }
    const z = getZoom ? getZoom() : 1
    const rect = btnRef.current.getBoundingClientRect()         // visual px
    const below = window.innerHeight - rect.bottom              // visual px available below
    const above = rect.top                                      // visual px available above
    const up = below < above
    const avail = (up ? above : below) - 16                     // leave a margin
    setPos({ up, maxH: Math.max(120, Math.floor(avail / z)) })  // convert to layout px for the menu
    setOpen(true)
  }

  return (
    // A width passed in `style` must apply to the WRAPPER (the button's width:100% would be
    // circular against an inline-block wrapper that shrink-wraps its content).
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block', width: style.width }}>
      <button ref={btnRef} type="button" onClick={toggle} title={title}
        style={{ boxSizing: 'border-box', ...style, display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {current ? `${current.icon ? current.icon + ' ' : ''}${current.label}` : ''}
        </span>
        <span style={{ fontSize: 10, opacity: 0.8 }}>▾</span>
      </button>
      {open && (
        <div role="listbox" style={{
          position: 'absolute', zIndex: 5000,
          [menuAlign === 'right' ? 'right' : 'left']: 0,
          [pos.up ? 'bottom' : 'top']: 'calc(100% + 4px)',
          minWidth: '100%', maxHeight: pos.maxH, overflowY: 'auto',
          background: 'var(--c-surface)', border: '1px solid var(--c-border)',
          borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.35)', padding: 4,
        }}>
          {options.map((o) => {
            const selected = String(o.value) === String(value)
            return (
              <div key={o.value} role="option" aria-selected={selected}
                onClick={() => { onChange(o.value); setOpen(false) }}
                style={{
                  padding: '6px 10px', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 13,
                  fontWeight: selected ? 700 : 500, color: o.color || 'var(--c-ink)',
                  background: selected ? 'var(--c-brand-tint)' : 'transparent',
                  borderTop: o.divider ? '1px solid var(--c-border)' : undefined,
                  marginTop: o.divider ? 4 : 0, paddingTop: o.divider ? 8 : 6,
                }}
                onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = 'var(--c-surface-alt)' }}
                onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = 'transparent' }}>
                {o.icon ? `${o.icon} ` : ''}{o.label}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
