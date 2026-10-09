import { describe, it, expect, vi } from 'vitest'
import { isCovered, focusUnlessCovered, COVER_SELECTOR } from './focusGuard'

const fakeDoc = (layers) => ({ querySelectorAll: (sel) => { expect(sel).toBe(COVER_SELECTOR); return layers } })
const layer = (children = []) => ({ contains: (el) => children.includes(el) })

describe('focusUnlessCovered', () => {
  it('focuses when nothing is open above', () => {
    const el = { focus: vi.fn() }
    expect(focusUnlessCovered(el, undefined, fakeDoc([]))).toBe(true)
    expect(el.focus).toHaveBeenCalledOnce()
  })
  it('does not steal focus from a modal that opened meanwhile', () => {
    const el = { focus: vi.fn() }
    expect(isCovered(el, fakeDoc([layer()]))).toBe(true)
    expect(focusUnlessCovered(el, undefined, fakeDoc([layer()]))).toBe(false)
    expect(el.focus).not.toHaveBeenCalled()
  })
  it('focuses a field that lives INSIDE the open layer', () => {
    const el = { focus: vi.fn() }
    expect(focusUnlessCovered(el, { preventScroll: true }, fakeDoc([layer([el])]))).toBe(true)
    expect(el.focus).toHaveBeenCalledWith({ preventScroll: true })
  })
  it('is a no-op for a missing or detached element', () => {
    expect(focusUnlessCovered(null, undefined, fakeDoc([]))).toBe(false)
    const gone = { focus: vi.fn(), isConnected: false }
    expect(focusUnlessCovered(gone, undefined, fakeDoc([]))).toBe(false)
    expect(gone.focus).not.toHaveBeenCalled()
  })
})
