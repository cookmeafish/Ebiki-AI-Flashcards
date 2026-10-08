// WEB-ONLY half of voice typing (writing into DOM text fields). A phone build does not
// need it: iOS and Android keyboards already have a dictation mic. Engines live in src/speech.
import { planInsert, looksSecret } from './voiceText'

// Put text into a React-controlled input/textarea at the caret, the way typing would. The browser's own
// "insertText" edit runs first: it fires the same input event React listens to AND lands on the field's undo stack
// (assigning the value, even through the native setter React tracks, wiped Ctrl+Z history for everything typed
// before). Where that cannot run (the field is not focused, or the browser refuses), the native setter + an input
// event is the fallback. `focus: false` = type into the field without taking focus from where the learner went.
export function insertIntoField(el, text, { focus = true } = {}) {
  if (!el || !text) return
  if (el.isContentEditable) {
    // Only the browser's edit can type into rich text: borrow the focus and hand it back when asked not to take it.
    const back = focus ? null : document.activeElement
    el.focus(); document.execCommand('insertText', false, text)
    if (back && back !== el) { try { back.focus() } catch { /* gone */ } }
    return
  }
  const value = el.value || ''
  let start = value.length, end = value.length
  try { if (typeof el.selectionStart === 'number') { start = el.selectionStart; end = el.selectionEnd } } catch { /* type without selection */ }
  const plan = planInsert(value, start, end, text)
  let done = false
  if (focus) {
    try {
      el.focus()
      if (document.activeElement === el) {
        try { el.setSelectionRange(start, end) } catch { /* type without selection */ }
        done = document.execCommand('insertText', false, plan.insert) && el.value === plan.next
      }
    } catch { done = false }
  }
  if (!done) {
    if (el.value !== value) return // the browser edit landed some other way: never type the words twice
    const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
    if (setter) setter.call(el, plan.next); else el.value = plan.next
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  if (focus) {
    try { el.setSelectionRange(plan.caret, plan.caret) } catch { /* type without selection */ }
    el.focus()
  }
}

// Fields voice typing may write into: plain text entry only, never secrets or non-text inputs.
export function isDictatable(el) {
  if (!el || el.disabled || el.readOnly) return false
  if (el.closest?.('[data-no-voice]')) return false
  if (el.matches?.(':disabled')) return false // inside a disabled <fieldset>
  if (el.tagName === 'TEXTAREA') return true
  if (el.isContentEditable) return true
  if (el.tagName !== 'INPUT') return false
  const type = (el.getAttribute('type') || 'text').toLowerCase()
  if (!['text', 'search', ''].includes(type)) return false
  // Key fields carry data-no-voice; this catches any other field that looks like a secret.
  return !looksSecret(`${el.name || ''} ${el.id || ''} ${el.placeholder || ''} ${el.getAttribute('autocomplete') || ''}`)
}
