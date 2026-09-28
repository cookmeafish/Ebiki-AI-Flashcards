// WEB-ONLY half of voice typing (writing into DOM text fields). A phone build does not
// need it: iOS and Android keyboards already have a dictation mic. Engines live in src/speech.

// Put text into a React-controlled input/textarea at the caret, the way typing would: React tracks the
// value through the native setter, so assigning .value alone would be undone on the next render.
export function insertIntoField(el, text) {
  if (!el || !text) return
  if (el.isContentEditable) { el.focus(); document.execCommand('insertText', false, text); return }
  const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
  const value = el.value || ''
  let start = value.length, end = value.length
  try { if (typeof el.selectionStart === 'number') { start = el.selectionStart; end = el.selectionEnd } } catch { /* type without selection */ }
  const before = value.slice(0, start)
  const after = value.slice(end)
  // A space between the dictated text and what is already there, never a doubled one.
  const pad = before && !/\s$/.test(before) ? ' ' : ''
  const next = before + pad + text + (after && !/^\s/.test(after) ? ' ' : '') + after
  if (setter) setter.call(el, next); else el.value = next
  el.dispatchEvent(new Event('input', { bubbles: true }))
  const caret = (before + pad + text).length
  try { el.setSelectionRange(caret, caret) } catch { /* type without selection */ }
  el.focus()
}

// Fields voice typing may write into: plain text entry only, never secrets or non-text inputs.
export function isDictatable(el) {
  if (!el || el.disabled || el.readOnly) return false
  if (el.closest?.('[data-no-voice]')) return false
  if (el.tagName === 'TEXTAREA') return true
  if (el.isContentEditable) return true
  if (el.tagName !== 'INPUT') return false
  const type = (el.getAttribute('type') || 'text').toLowerCase()
  if (!['text', 'search', ''].includes(type)) return false
  // Key fields carry data-no-voice; this catches any other field that looks like a secret.
  const hint = `${el.name || ''} ${el.id || ''} ${el.placeholder || ''} ${el.getAttribute('autocomplete') || ''}`
  return !/\b(api[ _-]?key|token|secret|password)\b|\bsk-|AIza/i.test(hint)
}
