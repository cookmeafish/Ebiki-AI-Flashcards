// Shared building blocks for feature screens, in the chunky, friendly style (thick borders, a solid
// "3D" bottom edge on buttons, rounded cards). Colors come from tokens only, so both themes work.
import { useEffect } from 'react'
import { C, FONT, RADIUS } from '../config/tokens'
import { DEFAULT_SHRIMP, shrimpUrl } from '../config/shrimp'

export const UI = {
  cardBorder: 2,           // px, card outline
  buttonDepth: 4,          // px, the solid bottom edge that makes a button look pressable
  barHeight: 12,           // px, progress bars
  modalWidth: 420,         // px, default modal width
  zModal: 1500,            // above the settings modal (1000), below toasts (10001)
}

// Count labels: `key` for n != 1, `keyOne` for exactly one (zh/ja define both the same).
export const tCount = (t, key, n, vars = {}) => (Number(n) === 1 ? t(`${key}One`, vars) : t(key, { n, ...vars }))

// A darker shade of any token color for the 3D edge, theme-safe (no hardcoded hex).
export const shade = (color, pct = 22) => `color-mix(in srgb, ${color} ${100 - pct}%, black)`

// A border whose BOTTOM edge is thicker and darker: the pressable look. Longhand properties only, so React
// never mixes a `border` shorthand with a per-side width on re-render.
export const depthBorder = (color, { width = UI.cardBorder, depth = UI.buttonDepth, bottomColor = shade(color) } = {}) => ({
  borderStyle: 'solid', borderWidth: `${width}px ${width}px ${depth}px`, borderColor: `${color} ${color} ${bottomColor}`,
})

export function Card({ children, style, onClick, title }) {
  // A clickable card is a button for the keyboard too (Tab to it, Enter or Space opens it).
  const keys = onClick ? { role: 'button', tabIndex: 0, onKeyDown: (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); onClick(e) } } } : {}
  return (
    <div onClick={onClick} {...keys} className={onClick ? 'click-dim' : undefined} style={{
      background: C.surface, border: `${UI.cardBorder}px solid ${C.border}`, borderRadius: RADIUS.lg,
      padding: 16, cursor: onClick ? 'pointer' : undefined, ...style,
    }}>
      {title && <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 16, color: C.ink, marginBottom: 10 }}>{title}</div>}
      {children}
    </div>
  )
}

// The main call to action: solid color, uppercase, with a pressable bottom edge (moves only on :active,
// via the app-wide .btn-press rule).
export function ChunkyButton({ children, onClick, color = C.brand, textColor = C.white, disabled, style, variant = 'solid', type = 'button' }) {
  const ghost = variant === 'ghost'
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="btn-press" style={{
      fontFamily: FONT.body, fontWeight: 800, fontSize: 14, letterSpacing: '.04em', textTransform: 'uppercase',
      padding: '11px 18px', borderRadius: RADIUS.md, cursor: disabled ? 'default' : 'pointer',
      background: ghost ? C.surface : color, color: ghost ? color : textColor,
      ...depthBorder(ghost ? C.border : color, { bottomColor: ghost ? C.border : shade(color) }),
      opacity: disabled ? 0.5 : 1, ...style,
    }}>{children}</button>
  )
}

export function ProgressBar({ value, max, color = C.warning, height = UI.barHeight, style }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  return (
    <div style={{ height, borderRadius: RADIUS.pill, background: C.surfaceSunken, overflow: 'hidden', ...style }}>
      <div style={{ width: `${pct}%`, height: '100%', borderRadius: RADIUS.pill, background: color, transition: 'width .4s ease' }} />
    </div>
  )
}

// A centered modal that respects the app's body zoom (a fixed inset:0 box would cover 135% of the view).
export function Modal({ open, onClose, children, width = UI.modalWidth, zoom = 1, dismissable = true }) {
  useEffect(() => {
    if (!open || !dismissable) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, dismissable, onClose])
  if (!open) return null
  return (
    <div onMouseDown={(e) => { if (dismissable && e.target === e.currentTarget) onClose?.() }} style={{
      position: 'fixed', top: 0, left: 0, width: `calc(100vw / ${zoom})`, height: `calc(100vh / ${zoom})`,
      background: 'rgba(0,0,0,.45)', zIndex: UI.zModal, display: 'grid', placeItems: 'center', padding: 16, boxSizing: 'border-box',
    }}>
      <div role="dialog" style={{
        width: '100%', maxWidth: width, maxHeight: '100%', overflow: 'auto', background: C.surface, color: C.ink,
        border: `${UI.cardBorder}px solid ${C.border}`, borderRadius: RADIUS.xl, padding: 22, boxSizing: 'border-box',
        fontFamily: FONT.body, animation: 'fadeIn .2s ease',
      }}>{children}</div>
    </div>
  )
}

// Ebi talking: mascot on the left, a speech bubble on the right (the onboarding look).
export function EbiSays({ pose = DEFAULT_SHRIMP, children, size = 96 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <img src={shrimpUrl(pose)} alt="" width={size} style={{ flexShrink: 0, height: 'auto' }} />
      <div style={{
        position: 'relative', background: C.surface, border: `${UI.cardBorder}px solid ${C.border}`, borderRadius: RADIUS.lg,
        padding: '10px 14px', fontSize: 15, fontWeight: 700, color: C.ink, lineHeight: 1.4,
      }}>{children}</div>
    </div>
  )
}
