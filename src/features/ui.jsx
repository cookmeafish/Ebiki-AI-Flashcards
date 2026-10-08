// Shared building blocks for feature screens: layered cards (hairline + soft shadow, docs/ui-overhaul.md), a solid
// "3D" bottom edge on the chunky buttons, rounded corners. Colors come from tokens only, so both themes work.
import { useEffect, useRef } from 'react'
import { C, FONT, RADIUS, SHADOW, TYPE, fillFor } from '../config/tokens'
import { DEFAULT_SHRIMP, shrimpUrl } from '../config/shrimp'
import { useNavLayer } from '../nav/react'

export const UI = {
  cardBorder: 1,           // px, card outline (a hairline: depth comes from the shadow)
  edgeWidth: 2,            // px, side borders of a pressable 3D control (depthBorder)
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
export const depthBorder = (color, { width = UI.edgeWidth, depth = UI.buttonDepth, bottomColor = shade(color) } = {}) => ({
  borderStyle: 'solid', borderWidth: `${width}px ${width}px ${depth}px`, borderColor: `${color} ${color} ${bottomColor}`,
})

export function Card({ children, style, onClick, title }) {
  // A clickable card is a button for the keyboard too (Tab to it, Enter or Space opens it).
  const keys = onClick ? { role: 'button', tabIndex: 0, onKeyDown: (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); onClick(e) } } } : {}
  return (
    // Surface, hairline and shadow come from the .ui-card class (not inline), so .ui-lift's hover shadow can win.
    <div onClick={onClick} {...keys} className={onClick ? 'ui-card ui-lift' : 'ui-card'} style={{
      borderRadius: RADIUS.lg, padding: 18, cursor: onClick ? 'pointer' : undefined, ...style,
    }}>
      {title && <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: TYPE.h3 + 1, letterSpacing: TYPE.tight, color: C.ink, marginBottom: 10 }}>{title}</div>}
      {children}
    </div>
  )
}

// The main call to action: solid color, uppercase, with a pressable bottom edge (moves only on :active,
// via the app-wide .btn-press rule).
export function ChunkyButton({ children, onClick, color = C.brand, textColor = C.white, disabled, style, variant = 'solid', type = 'button' }) {
  const ghost = variant === 'ghost'
  // White text sits on the deep FILL of a token color (AA in both themes); other text colors keep the color itself.
  const fill = textColor === C.white ? fillFor(color) : color
  return (
    // The solid glow lives in the .ui-chunky class (color via --chunky), never inline: an inline shadow would block
    // the hover cue. The ghost variant keeps the generic hover tint.
    <button type={type} onClick={onClick} disabled={disabled} className={ghost ? 'btn-press' : 'btn-press ui-chunky'} style={{
      '--chunky': fill,
      fontFamily: FONT.body, fontWeight: 800, fontSize: 14, letterSpacing: '.04em', textTransform: 'uppercase',
      padding: '11px 18px', borderRadius: RADIUS.md, cursor: disabled ? 'default' : 'pointer',
      // A flat face with a pressable edge (solid; second pass: no gradient wash); a quiet surface with a hairline edge (ghost).
      background: ghost ? C.surface : fill,
      color: ghost ? color : textColor,
      ...depthBorder(ghost ? C.border : shade(fill, 12), { width: 1, depth: UI.buttonDepth, bottomColor: ghost ? C.borderStrong : shade(fill) }),
      opacity: disabled ? 0.5 : 1, ...style,
    }}>{children}</button>
  )
}

export function ProgressBar({ value, max, color = C.warning, height = UI.barHeight, style, label }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  return (
    <div role="progressbar" aria-label={label || undefined} aria-valuemin={0} aria-valuemax={max > 0 ? max : 0} aria-valuenow={Math.max(0, Math.min(Number(value) || 0, max > 0 ? max : 0))}
      style={{ height, borderRadius: RADIUS.pill, background: C.surfaceSunken, overflow: 'hidden', boxShadow: `inset 0 1px 2px color-mix(in srgb, ${C.ink} 12%, transparent)`, ...style }}>
      <div style={{
        width: `${pct}%`, height: '100%', borderRadius: RADIUS.pill, transition: 'width .4s var(--ease-out)',
        background: `linear-gradient(90deg, color-mix(in srgb, ${color} 80%, white), ${color})`,
        boxShadow: pct > 0 ? 'inset 0 1px 0 rgba(255,255,255,.3)' : undefined,
      }} />
    </div>
  )
}

const MODAL_STACK = []
let modalSeq = 0 // each Modal's nav layer key
// A centered modal that respects the app's body zoom (a fixed inset:0 box would cover 135% of the view).
export function Modal({ open, onClose, children, width = UI.modalWidth, zoom = 1, dismissable = true, label }) {
  const rootRef = useRef(null)
  // Back / Forward (src/nav): an open modal is a layer, so Back (a mouse's back button, a phone's) closes it instead of
  // changing the screen underneath it; one that cannot be dismissed keeps Back from moving at all while it is up.
  const layerKey = useRef(null)
  if (!layerKey.current) layerKey.current = `ui.modal.${++modalSeq}`
  useNavLayer(layerKey.current, open, onClose, { closable: dismissable && typeof onClose === 'function' })
  // Open modals in opening order: only the TOP one takes Esc (each one's capture listener ran in registration
  // order, so a celebration opened over the Gold blitz left Esc closing the blitz underneath).
  const tokenRef = useRef(null)
  useEffect(() => {
    if (!open) return
    const tok = {}; tokenRef.current = tok; MODAL_STACK.push(tok)
    return () => { const i = MODAL_STACK.indexOf(tok); if (i >= 0) MODAL_STACK.splice(i, 1) }
  }, [open])
  useEffect(() => {
    if (!open || !dismissable) return
    // Capture + marked handled: the Picture tab's Esc also reset a finished analysis, and the Chat "+" menu closed
    // with it. Not an IME composition's Esc (it cancels only the candidate: a blitz lost every answer), not one an
    // app dialog above owns, and not one meant for Ebi's Help panel when the focus is there.
    const onKey = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented || e.isComposing || e.keyCode === 229) return
      if (MODAL_STACK[MODAL_STACK.length - 1] !== tokenRef.current) return
      if (document.querySelector('[data-app-dialog]')) return
      const a = document.activeElement
      if (a && !rootRef.current?.contains(a) && a.closest?.('[data-help-panel]')) return
      e.preventDefault(); onClose?.()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, dismissable, onClose])
  // Keyboard users land INSIDE the dialog (focus stayed on the button behind the backdrop, so Tab walked the page
  // underneath) and return to where they were when it closes.
  const dialogRef = useRef(null)
  useEffect(() => {
    if (!open) return
    const back = document.activeElement
    const box = dialogRef.current
    if (box && !box.contains(document.activeElement)) {
      const first = box.querySelector('input, textarea, select, button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')
      ;(first || box).focus({ preventScroll: true })
    }
    return () => { if (back && back.isConnected && typeof back.focus === 'function') back.focus({ preventScroll: true }) }
  }, [open])
  // A dialog needs a name for screen readers: the caller's `label`, else its first heading, else its first line of
  // text (content can render a moment later, so look again shortly after opening).
  useEffect(() => {
    if (!open || label) return
    const name = () => {
      const box = dialogRef.current
      if (!box || box.getAttribute('aria-labelledby')) return
      const h = box.querySelector('h1, h2, h3, h4, [data-modal-title]')
      if (h) { if (!h.id) h.id = `${layerKey.current.replace(/\./g, '-')}-title`; box.setAttribute('aria-labelledby', h.id); box.removeAttribute('aria-label'); return }
      const line = String(box.innerText || '').split(/\r?\n/).map((x) => x.trim()).find(Boolean)
      if (line) box.setAttribute('aria-label', line.slice(0, 80))
    }
    name()
    const id = setTimeout(name, 300)
    return () => clearTimeout(id)
  }, [open, label])
  if (!open) return null
  return (
    <div ref={rootRef} onMouseDown={(e) => { if (dismissable && e.target === e.currentTarget) onClose?.() }} style={{
      position: 'fixed', top: 0, left: 0, width: `calc(100vw / var(--app-zoom, ${zoom}))`, height: `calc(100vh / var(--app-zoom, ${zoom}))`,
      background: 'rgba(6,10,14,.5)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      zIndex: UI.zModal, display: 'grid', placeItems: 'center', padding: 'clamp(8px, 3vw, 16px)', boxSizing: 'border-box', animation: 'fadeIn .18s ease',
    }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={label || undefined} tabIndex={-1} className="ui-pop" style={{
        outline: 'none',
        width: '100%', maxWidth: width, maxHeight: '100%', overflow: 'auto', background: C.surface, color: C.ink,
        border: `${UI.cardBorder}px solid ${C.border}`, borderRadius: RADIUS.xl, padding: 'clamp(14px, 5vw, 24px)', boxSizing: 'border-box', // less on a phone
        fontFamily: FONT.body, boxShadow: SHADOW.xl,
      }}>{children}</div>
    </div>
  )
}

// Ebi talking: mascot on the left, a speech bubble on the right (the onboarding look).
export function EbiSays({ pose = DEFAULT_SHRIMP, children, size = 96 }) {
  return (
    // Wraps on a phone-width screen: the bubble drops under Ebi instead of squeezing to a word per line.
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
      <img src={shrimpUrl(pose)} alt="" width={size} style={{ flexShrink: 0, height: 'auto', filter: 'drop-shadow(var(--sh-sm))' }} />
      <div style={{
        position: 'relative', flex: '1 1 200px', minWidth: 0, overflowWrap: 'anywhere', background: C.surface, border: `${UI.cardBorder}px solid ${C.border}`, borderRadius: RADIUS.lg,
        borderBottomLeftRadius: 6, boxShadow: SHADOW.card,
        padding: '11px 15px', fontSize: 15, fontWeight: 700, color: C.ink, lineHeight: 1.4,
      }}>{children}</div>
    </div>
  )
}
