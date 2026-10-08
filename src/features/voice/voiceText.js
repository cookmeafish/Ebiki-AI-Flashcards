// Pure rules of voice typing (no DOM): where dictated text goes, which keys toggle it, which fields look secret.
// web.js applies them to real fields; VoiceTyping.jsx to real key events. Tested in voiceText.test.js.

// Dictated `text` replacing value[start, end): one space between it and the words around it, never a doubled one.
// Returns { insert (exactly what to type at the selection), next (the whole new value), caret (after the text) }.
export function planInsert(value, start, end, text) {
  const v = String(value ?? '')
  const s = Math.max(0, Math.min(v.length, Number.isFinite(start) ? start : v.length))
  const e = Math.max(s, Math.min(v.length, Number.isFinite(end) ? end : s))
  const words = String(text ?? '')
  const before = v.slice(0, s)
  const after = v.slice(e)
  const pad = before && !/\s$/.test(before) ? ' ' : ''
  const tail = after && !/^\s/.test(after) ? ' ' : ''
  const insert = pad + words + tail
  return { insert, next: before + insert + after, caret: (before + pad + words).length }
}

// Alt + V toggles voice typing. By the PHYSICAL key too: on a Mac, Option+V types "√" (e.key), and on a Cyrillic,
// Greek or Arabic layout e.key is that script's letter, so matching e.key alone never fired there.
export function isVoiceShortcut(e, key = 'v') {
  if (!e || !e.altKey || e.ctrlKey || e.metaKey) return false
  return String(e.key || '').toLowerCase() === key || e.code === `Key${key.toUpperCase()}`
}

// A field whose name, id, placeholder or autocomplete hints at a secret is never dictated into (key fields also
// carry data-no-voice). The Google key prefix "AIza" is matched with its exact case (case-insensitive it caught
// ordinary words containing "aiza").
export function looksSecret(hint) {
  const h = String(hint || '')
  return /\b(api[ _-]?key|token|secret|password|passcode)\b|\bsk-/i.test(h) || /AIza/.test(h)
}
