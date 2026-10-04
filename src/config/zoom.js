// App zoom: the ONE source of truth for how big the UI is drawn (pure, tested in zoom.test.js).
// The app draws in fixed px, so the body carries a CSS zoom (default 1.35: 100% browser zoom looked small on
// typical Windows displays). The user can zoom further in or out (Settings > General > Zoom, Ctrl/Cmd + = - 0).
// The level is ABSOLUTE (the body's zoom factor); the label shows it RELATIVE to the default (default = 100%).
// App.jsx applies it as `body.style.zoom` AND the CSS variable `--app-zoom` on <html>: every fixed box that must
// cover the viewport divides by it (`calc(100vw / var(--app-zoom))`), JS divides by the live getZoom().
// Never in the overlay: OCR boxes must stay 1:1 with the captured screen.

export const ZOOM = {
  default: 1.35,
  min: 1.0,
  max: 2.0,
  step: 0.1,          // one step = 10% of the default
  kvKey: 'ebiki-ui-zoom',
}

const round2 = (n) => Math.round(n * 100) / 100

// Any input (stored string, number, junk) to a valid absolute zoom.
export function clampZoom(z) {
  const n = typeof z === 'string' ? parseFloat(z) : z
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) return ZOOM.default
  return round2(Math.min(ZOOM.max, Math.max(ZOOM.min, n)))
}

// The stored preference (platform.kv value) to a zoom; missing or broken = the default.
export const parseZoom = (raw) => (raw == null || raw === '' ? ZOOM.default : clampZoom(raw))

// Relative percent shown to the user: the default is 100%.
export const zoomPercent = (z) => Math.round((clampZoom(z) / ZOOM.default) * 100)

export const formatZoom = (z) => `${zoomPercent(z)}%`

// One step in (dir > 0) or out (dir < 0), on the 10%-of-default grid, clamped to [min, max].
export function stepZoom(z, dir) {
  const rel = Math.round((clampZoom(z) / ZOOM.default) / ZOOM.step) * ZOOM.step
  const next = rel + (dir > 0 ? ZOOM.step : dir < 0 ? -ZOOM.step : 0)
  return clampZoom(ZOOM.default * next)
}

export const canZoomIn = (z) => clampZoom(z) < ZOOM.max
export const canZoomOut = (z) => clampZoom(z) > ZOOM.min
export const isDefaultZoom = (z) => clampZoom(z) === ZOOM.default

// A keydown to a zoom action: 'in' | 'out' | 'reset' | null. Ctrl (Cmd on macOS) with = + - _ 0 (main row or
// numpad); never with Alt, never during IME composition.
export function zoomKeyAction(e) {
  if (!e || !(e.ctrlKey || e.metaKey) || e.altKey || e.isComposing || e.keyCode === 229) return null
  const k = e.key
  const code = e.code || ''
  if (k === '=' || k === '+' || code === 'NumpadAdd') return 'in'
  if (k === '-' || k === '_' || code === 'NumpadSubtract') return 'out'
  if (k === '0' || code === 'Numpad0') return 'reset'
  return null
}

// Apply an action to a level.
export function applyZoomAction(z, action) {
  if (action === 'in') return stepZoom(z, 1)
  if (action === 'out') return stepZoom(z, -1)
  if (action === 'reset') return ZOOM.default
  return clampZoom(z)
}
