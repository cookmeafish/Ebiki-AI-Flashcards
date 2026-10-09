// A delayed "give the composer its focus back" must not steal focus from something that opened on top meanwhile.
// After a Chat send the composer was refocused 60 ms later, but the send itself can open a modal (the game's streak
// celebration on the first chat of the day): the focus went back BEHIND the modal, so Tab walked the page underneath,
// Enter typed into the hidden composer and the voice badge floated over the modal.
export const COVER_SELECTOR = '[aria-modal="true"],[data-app-dialog],[data-top-overlay]'

// True when an open modal, app dialog or top overlay exists that does NOT contain `el`.
export function isCovered(el, doc = typeof document !== 'undefined' ? document : null) {
  if (!el || !doc || typeof doc.querySelectorAll !== 'function') return false
  for (const layer of doc.querySelectorAll(COVER_SELECTOR)) {
    if (layer && !(typeof layer.contains === 'function' && layer.contains(el))) return true
  }
  return false
}

// Focuses `el` unless a layer above it owns the focus now. Returns whether it focused.
export function focusUnlessCovered(el, opts, doc) {
  if (!el || typeof el.focus !== 'function' || el.isConnected === false) return false
  if (isCovered(el, doc)) return false
  el.focus(opts)
  return true
}
