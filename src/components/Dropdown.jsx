import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

// A custom, always-scrollable dropdown to replace native <select> for lists that can grow long
// (modes, languages, decks). Native popups are positioned by the OS and can push items off the top
// of the screen (inaccessible). This menu instead:
//  - is PORTALED to document.body and positioned `fixed`, so it is never clipped by a scrolling/
//    overflow ancestor AND never mis-anchored by a `transform`-animated ancestor (e.g. the study
//    card's slideUp animation makes `position:fixed` resolve against the card, not the viewport —
//    a portal escapes that),
//  - caps its height to the space available in the real viewport and scrolls internally,
//  - opens upward or downward toward whichever side has more room, clamped on-screen,
//  - repositions on scroll/resize so it tracks the button and never drifts,
//  - is placed in LAYOUT px (real px from getBoundingClientRect / body zoom), matching the tooltip
//    convention elsewhere, so it lands correctly under the app's `body { zoom:1.35 }`.
//
// options: [{ value, label, icon?, color?, divider? }]. `divider:true` draws a separator above the row.
export default function Dropdown({ value, onChange, options, style = {}, menuAlign = 'left', title, getZoom }) {
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState({ left: 0, top: undefined, bottom: undefined, width: 0, maxH: 300 })
  const wrapRef = useRef(null)
  const btnRef = useRef(null)
  const menuRef = useRef(null)

  const current = options.find((o) => String(o.value) === String(value))

  // Compute the menu box in LAYOUT px from the button's current viewport rect. getBoundingClientRect()
  // and innerWidth/Height are REAL px; divide by the body zoom to get layout px (the space the fixed,
  // body-zoomed menu is drawn in) — same convention as the pinned-tooltip code in App.jsx.
  const place = useCallback(() => {
    if (!btnRef.current) return
    const z = getZoom ? getZoom() : 1
    const r = btnRef.current.getBoundingClientRect()
    const vw = window.innerWidth / z
    const vh = window.innerHeight / z
    const M = 8
    const bTop = r.top / z, bBottom = r.bottom / z, bLeft = r.left / z, bRight = r.right / z, bWidth = r.width / z
    const below = vh - bBottom - M
    const above = bTop - M
    const up = below < above
    const maxH = Math.max(120, up ? above : below)
    let left = menuAlign === 'right' ? bRight - bWidth : bLeft
    left = Math.max(M, Math.min(left, vw - bWidth - M))
    setMenu({ left, top: up ? undefined : bBottom + 4, bottom: up ? (vh - bTop + 4) : undefined, width: bWidth, maxH })
  }, [getZoom, menuAlign])

  const toggle = () => {
    if (open) { setOpen(false); return }
    place()
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (wrapRef.current && wrapRef.current.contains(e.target)) return
      if (menuRef.current && menuRef.current.contains(e.target)) return
      setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    // Scrolling the PAGE (or any ancestor) while open closes the menu — the standard select behavior,
    // and it avoids the menu appearing to float around as the page moves under it. Scrolls that
    // originate INSIDE the menu's own list (paging through the options) are ignored. Resize closes too.
    const onScroll = (e) => {
      if (e && e.target && menuRef.current && menuRef.current.contains && menuRef.current.contains(e.target)) return
      setOpen(false)
    }
    const onResize = () => setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open, place])

  return (
    // A width passed in `style` must apply to the WRAPPER (the button's width:100% would be
    // circular against an inline-block wrapper that shrink-wraps its content).
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block', width: style.width }}>
      <button ref={btnRef} type="button" onClick={toggle} title={title} className="ui-btn"
        style={{ boxSizing: 'border-box', ...style, display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {current ? `${current.icon ? current.icon + ' ' : ''}${current.label}` : ''}
        </span>
        <span style={{ fontSize: 10, opacity: 0.8 }}>▾</span>
      </button>
      {open && createPortal(
        <div ref={menuRef} role="listbox" style={{
          position: 'fixed', zIndex: 10000,
          left: menu.left, top: menu.top, bottom: menu.bottom,
          width: menu.width, maxHeight: menu.maxH, overflowY: 'auto',
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
        </div>,
        document.body
      )}
    </div>
  )
}
