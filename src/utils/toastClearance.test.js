import { describe, it, expect } from 'vitest'
import { toastClearance, TOAST_BASE } from './toastClearance'

const rect = (top, height, width = 600) => ({ top, bottom: top + height, height, width })

describe('toastClearance', () => {
  it('keeps the base offset with no composer on screen', () => {
    expect(toastClearance([], 800, 1)).toBe(TOAST_BASE)
    expect(toastClearance(null, 800, 1.35)).toBe(TOAST_BASE)
  })
  it('lifts the stack above a bottom composer, in layout px', () => {
    // A composer 60px tall at the bottom of an 800px window, zoom 1: 60 + 8 gap.
    expect(toastClearance([rect(740, 60)], 800, 1)).toBe(68)
    // Zoom 2: the same real px are half the layout px.
    expect(toastClearance([rect(680, 120)], 800, 2)).toBe(68)
  })
  it('ignores hidden and off-screen composers', () => {
    expect(toastClearance([rect(700, 0), rect(900, 60), { top: 0, bottom: 0, height: 0, width: 0 }], 800, 1)).toBe(TOAST_BASE)
    expect(toastClearance([rect(700, 50, 0)], 800, 1)).toBe(TOAST_BASE)
  })
  it('a composer high on the page (Talk mid-screen) lifts only within the cap', () => {
    // Top at 100px of 800: would lift 708, capped at 60% of the window (480).
    expect(toastClearance([rect(100, 80)], 800, 1)).toBe(480)
  })
  it('takes the highest of several', () => {
    expect(toastClearance([rect(760, 40), rect(700, 100)], 800, 1)).toBe(108)
  })
})
