// Keyboard and screen-reader access for a clickable element that is not a <button> (a row header that expands, a
// small "Cancel" or "×" span): it becomes focusable (Tab), announced as a button, and Enter or Space act like a click.
// Only when the element ITSELF has the focus: a key pressed on a control inside it belongs to that control (an Enter on
// a row's own button also toggled the row). Spread it onto the element beside its onClick:
//   <div onClick={toggle} {...pressable(toggle, { expanded: open })}>
// Use it only where the element holds no other interactive control (a role=button around buttons is nested-interactive:
// give such rows a real button for the toggle instead, like the chevrons in the deck list).
import { imeActive } from './keys.js'

export const PRESS_KEYS = ['Enter', ' ', 'Spacebar']

export function pressable(onPress, { expanded, label, disabled = false } = {}) {
  if (disabled) return {}
  return {
    role: 'button',
    tabIndex: 0,
    ...(typeof expanded === 'boolean' ? { 'aria-expanded': expanded } : {}),
    ...(label ? { 'aria-label': label } : {}),
    onKeyDown: (e) => {
      if (!e || e.target !== e.currentTarget) return
      if (e.defaultPrevented || imeActive(e) || !PRESS_KEYS.includes(e.key)) return // imeActive: React's event has no isComposing
      e.preventDefault() // Space would scroll the page
      onPress(e)
    },
  }
}
