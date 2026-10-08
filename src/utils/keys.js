// Shared keyboard guards (pure: takes a DOM KeyboardEvent or a React synthetic one).

// True while an IME (Chinese/Japanese/Korean typing) owns the key: Enter then only commits the candidate and Esc
// only cancels it. Chromium sets isComposing; Safari (iOS/macOS WebViews) fires the committing keydown AFTER
// compositionend with isComposing false but keyCode 229, so both are checked, on the event and on nativeEvent.
export function imeActive(e) {
  if (!e) return false
  const n = e.nativeEvent || null
  return !!(e.isComposing || n?.isComposing || e.keyCode === 229 || n?.keyCode === 229)
}

// The 0-based choice a key picks ("1".."9", or the same physical key by e.code: AZERTY's top row types "&é\"'..."
// without Shift), or -1. Never with Ctrl/Cmd/Alt (Ctrl+1 is the browser's tab switch), never an auto-repeat (a held
// key ran through the next questions), never during an IME composition.
export function choiceIndex(e, count) {
  if (!e || e.ctrlKey || e.metaKey || e.altKey || e.repeat || imeActive(e)) return -1
  let n = -1
  if (/^[1-9]$/.test(e.key || '')) n = Number(e.key) - 1
  else {
    const m = /^(?:Digit|Numpad)([1-9])$/.exec(e.code || '')
    if (m) n = Number(m[1]) - 1
  }
  return n >= 0 && n < (Number(count) || 0) ? n : -1
}
