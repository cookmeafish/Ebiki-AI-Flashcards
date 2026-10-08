// How far above the window's bottom the toast stack must sit so it never covers a composer (Chat, Ebi Call, Roleplay,
// Legends Talk: elements marked `data-composer`). The stack is fixed at the bottom; at 900px and zoom 2 a red toast sat
// on Ebi Call's input and Send. Pure: rects are real px (getBoundingClientRect), the answer is LAYOUT px (the body
// zoom divides it, like every fixed box). Never lifts the stack past `maxShare` of the window: a tall composer would
// otherwise push the toasts off the top.
export const TOAST_BASE = 16
export const TOAST_GAP = 8

export function toastClearance(rects, viewportH, zoom = 1, { base = TOAST_BASE, gap = TOAST_GAP, maxShare = 0.6 } = {}) {
  const z = zoom > 0 ? zoom : 1
  const vh = Number(viewportH) || 0
  let lift = base
  for (const r of rects || []) {
    if (!r || !(r.height > 0) || !(r.width > 0)) continue // hidden (display: none / unmounted tab)
    if (r.bottom <= 0 || r.top >= vh) continue // off screen
    lift = Math.max(lift, (vh - r.top) / z + gap)
  }
  const cap = (vh / z) * maxShare
  return Math.round(Math.min(lift, Math.max(base, cap)))
}
