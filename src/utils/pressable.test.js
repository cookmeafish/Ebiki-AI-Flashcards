import { describe, it, expect, vi } from 'vitest'
import { pressable } from './pressable.js'

const key = (k, { self = true, ...rest } = {}) => {
  const el = {}
  return { key: k, target: el, currentTarget: self ? el : {}, defaultPrevented: false, isComposing: false, preventDefault: vi.fn(), ...rest }
}

describe('pressable', () => {
  it('makes the element a focusable button', () => {
    const p = pressable(() => {})
    expect(p.role).toBe('button')
    expect(p.tabIndex).toBe(0)
    expect('aria-expanded' in p).toBe(false)
  })

  it('Enter and Space press it and stop the page from scrolling', () => {
    for (const k of ['Enter', ' ', 'Spacebar']) {
      const fn = vi.fn()
      const e = key(k)
      pressable(fn).onKeyDown(e)
      expect(fn).toHaveBeenCalledTimes(1)
      expect(e.preventDefault).toHaveBeenCalled()
    }
  })

  it('a key on a control INSIDE the element is that control\'s, never a press of the row', () => {
    const fn = vi.fn()
    pressable(fn).onKeyDown(key('Enter', { self: false }))
    expect(fn).not.toHaveBeenCalled()
  })

  it('other keys, a handled key and IME composition do nothing', () => {
    const fn = vi.fn()
    const p = pressable(fn)
    p.onKeyDown(key('a'))
    p.onKeyDown(key('Tab'))
    p.onKeyDown(key('Enter', { defaultPrevented: true }))
    p.onKeyDown(key('Enter', { isComposing: true }))
    p.onKeyDown(key('Enter', { nativeEvent: { isComposing: true } })) // React's synthetic event
    p.onKeyDown(key('Enter', { keyCode: 229 })) // Safari commits after compositionend
    expect(fn).not.toHaveBeenCalled()
  })

  it('carries aria-expanded and a label when given; disabled gives nothing', () => {
    expect(pressable(() => {}, { expanded: false })['aria-expanded']).toBe(false)
    expect(pressable(() => {}, { expanded: true, label: 'Close' })).toMatchObject({ 'aria-expanded': true, 'aria-label': 'Close' })
    expect(pressable(() => {}, { disabled: true })).toEqual({})
  })
})
