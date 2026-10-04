// Left navigation: rounded rows with an icon and a sentence-case label; the current screen gets a brand tint, ring
// and lit left edge (docs/ui-overhaul.md). Collapses to icons on narrow windows, or when the user collapses it with the
// toggle at the bottom (onToggle; null while a narrow window forces icon-only).
// Hovering (after FLYOUT.delayMs) or keyboard-focusing a row shows a flyout beside it: the screen's name and what it
// is for (item.desc). The flyout is portaled to <html>, OUTSIDE the zoomed body and the scrolling nav (like Dropdown):
// position:fixed in REAL px, scaled with transform:scale(zoom), so it is never clipped and hit-tests correctly.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { C, FONT, RADIUS, SHADOW } from '../config/tokens'
import { SHELL } from './layout'

const ROW_H = 46
const ICON_SIZE = 22
const ART_SIZE = 28 // a drawn icon (public/assets/nav/<art>.svg) fills its square, an emoji does not

const FLYOUT = {
  delayMs: 150,  // hover delay (keyboard focus shows at once)
  gap: 10,       // real px between the row and the flyout
  margin: 8,     // real px kept free at the viewport edges
  maxWidth: 260, // CSS px before the zoom scale
  arrow: 7,      // arrow square size (CSS px)
}
const FLYOUT_ID = 'ebiki-nav-flyout'
// A host <div> under <html> (outside the body zoom). React warns about a <div> rendered straight into <html>.
function flyoutHost() {
  let h = document.getElementById('ebiki-nav-flyout-host')
  if (!h) { h = document.createElement('div'); h.id = 'ebiki-nav-flyout-host'; document.documentElement.appendChild(h) }
  return h
}

// The flyout itself. `anchor` = the row's rect in real px. Rendered hidden first, measured, then placed: to the right
// of the row (flipped left when there is no room), vertically centred on it and clamped to the viewport.
function NavFlyout({ anchor, title, desc, z }) {
  const ref = useRef(null)
  const [pos, setPos] = useState(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const box = el.getBoundingClientRect() // real px (after the scale)
    const vw = window.innerWidth, vh = window.innerHeight, M = FLYOUT.margin
    let left = anchor.right + FLYOUT.gap
    let side = 'right'
    if (left + box.width > vw - M && anchor.left - FLYOUT.gap - box.width >= M) { left = anchor.left - FLYOUT.gap - box.width; side = 'left' }
    left = Math.max(M, Math.min(left, vw - box.width - M))
    const mid = (anchor.top + anchor.bottom) / 2
    const top = Math.max(M, Math.min(mid - box.height / 2, vh - box.height - M))
    // Arrow: points at the row's middle, kept inside the box's rounded corners (intrinsic px).
    const arrowY = Math.max(10, Math.min((mid - top) / z, box.height / z - 10))
    setPos({ left, top, side, arrowY })
  }, [anchor.left, anchor.right, anchor.top, anchor.bottom, title, desc, z])
  const a = FLYOUT.arrow
  return createPortal(
    <div ref={ref} id={FLYOUT_ID} role="tooltip" style={{
      position: 'fixed', zIndex: 11000, left: pos ? pos.left : 0, top: pos ? pos.top : 0,
      visibility: pos ? 'visible' : 'hidden', pointerEvents: 'none',
      transform: `scale(${z})`, transformOrigin: 'top left',
      width: 'max-content', maxWidth: FLYOUT.maxWidth, boxSizing: 'border-box', padding: '9px 12px',
      background: C.surfaceRaised, color: C.ink, border: `1.5px solid ${C.border}`, borderRadius: RADIUS.md,
      boxShadow: SHADOW.lg, fontFamily: FONT.body, fontSize: 12.5, lineHeight: 1.4,
      textTransform: 'none', letterSpacing: 'normal', textAlign: 'left',
    }}>
      {pos && (
        <span aria-hidden="true" style={{
          position: 'absolute', top: pos.arrowY - a / 2 - 1, width: a, height: a, background: C.surfaceRaised,
          ...(pos.side === 'right'
            ? { left: -a / 2 - 1, borderLeft: `1.5px solid ${C.border}`, borderBottom: `1.5px solid ${C.border}` }
            : { right: -a / 2 - 1, borderRight: `1.5px solid ${C.border}`, borderTop: `1.5px solid ${C.border}` }),
          transform: 'rotate(45deg)',
        }} />
      )}
      <div style={{ fontWeight: 800, fontSize: 13.5 }}>{title}</div>
      {desc && <div style={{ color: C.inkDim, marginTop: 3, fontWeight: 600 }}>{desc}</div>}
    </div>,
    flyoutHost()
  )
}

export default function Sidebar({ items, active, onPick, collapsed, onToggle, toggleLabel, getZoom }) {
  const [tip, setTip] = useState(null) // { key, title, desc, anchor, z }
  const timer = useRef(null)
  const clearTimer = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null } }
  const hide = useCallback(() => { clearTimer(); setTip(null) }, [])
  const show = (el, key, title, desc) => {
    clearTimer()
    const r = el.getBoundingClientRect()
    const z = (typeof getZoom === 'function' && getZoom()) || 1
    setTip({ key, title, desc, z, anchor: { left: r.left, right: r.right, top: r.top, bottom: r.bottom } })
  }
  // Hover waits a moment; keyboard focus shows at once (a mouse click also focuses, but not :focus-visible).
  const tipProps = (key, title, desc) => ({
    onMouseEnter: (e) => { const el = e.currentTarget; clearTimer(); timer.current = setTimeout(() => show(el, key, title, desc), FLYOUT.delayMs) },
    onMouseLeave: hide,
    onFocus: (e) => { let kb = true; try { kb = e.currentTarget.matches(':focus-visible') } catch { /* old engine */ } if (kb) show(e.currentTarget, key, title, desc) },
    onBlur: hide,
    'aria-describedby': tip && tip.key === key ? FLYOUT_ID : undefined,
  })
  useEffect(() => {
    if (!tip) return
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); hide() } }
    window.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide)
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('scroll', hide, true)
      window.removeEventListener('resize', hide)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [tip, hide])
  useEffect(() => hide, [hide]) // unmount: no timer left behind
  useEffect(() => { hide() }, [collapsed, active, hide]) // the row moved or changed under the flyout

  return (
    <nav aria-label="Ebiki" style={{
      width: collapsed ? SHELL.sidebarCollapsed : SHELL.sidebarWidth, flexShrink: 0, boxSizing: 'border-box',
      // UI overhaul (docs/ui-overhaul.md): a quiet glass column with a hairline edge.
      padding: '14px 10px', borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 4,
      overflowY: 'auto', background: `color-mix(in srgb, ${C.surface} 35%, transparent)`,
    }}>
      {items.map((it) => {
        const on = it.id === active
        return (
          <button key={it.id} onClick={() => { hide(); if (!on) onPick(it.id) }} aria-current={on ? 'page' : undefined} aria-label={it.label}
            className={on ? 'ui-tab-current' : 'click-dim'}
            {...tipProps(it.id, it.label, it.desc)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, height: ROW_H, padding: collapsed ? 0 : '0 14px',
              justifyContent: collapsed ? 'center' : 'flex-start', boxSizing: 'border-box', width: '100%',
              // Current screen (second pass): a raised card with a red marker, no pink wash. Red stays the accent.
              borderRadius: RADIUS.md, border: `1px solid ${on ? C.border : 'transparent'}`,
              background: on ? C.surface : 'transparent',
              ...(on ? { boxShadow: `inset 3px 0 0 ${C.brand}, ${SHADOW.card}` } : {}),
              color: on ? C.ink : C.inkDim, cursor: on ? 'default' : 'pointer',
              fontFamily: FONT.body, fontWeight: on ? 800 : 700, fontSize: 14.5, letterSpacing: '.01em',
            }}>
            {it.art
              ? <img src={`/assets/nav/${it.art}.svg`} alt="" aria-hidden="true" draggable={false} width={ART_SIZE} height={ART_SIZE} style={{ flexShrink: 0, display: 'block' }} />
              : <span style={{ fontSize: ICON_SIZE, lineHeight: 1, width: ICON_SIZE + 6, textAlign: 'center' }}>{it.icon}</span>}
            {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</span>}
          </button>
        )
      })}
      {onToggle && (
        <button type="button" onClick={() => { hide(); onToggle() }} aria-label={toggleLabel} aria-expanded={!collapsed}
          className="click-dim" {...tipProps('__toggle', toggleLabel, '')}
          style={{
            marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 14, height: ROW_H - 8, padding: collapsed ? 0 : '0 14px', width: '100%', boxSizing: 'border-box', flexShrink: 0,
            borderRadius: RADIUS.md, border: '1px solid transparent', background: 'transparent', color: C.inkFaint,
            cursor: 'pointer', fontFamily: FONT.body, fontWeight: 700, fontSize: 12.5, letterSpacing: '.01em',
          }}>
          <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1, width: ICON_SIZE + 6, textAlign: 'center' }}>{collapsed ? '»' : '«'}</span>
          {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{toggleLabel}</span>}
        </button>
      )}
      {tip && <NavFlyout key={tip.key} anchor={tip.anchor} title={tip.title} desc={tip.desc} z={tip.z} />}
    </nav>
  )
}
