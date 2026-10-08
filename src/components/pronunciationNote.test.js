import { describe, it, expect, vi } from 'vitest'

vi.mock('../pronunciation', () => ({ getPronunciation: async () => null }))
const { floatNotePos } = await import('./Pronunciation.jsx')

const vp = { width: 1000, height: 800 }

describe('floatNotePos (the floating "only one recording" note and credit)', () => {
  it('sits just above the anchor', () => {
    expect(floatNotePos({ left: 200, top: 300, bottom: 320 }, { width: 120, height: 20 }, vp)).toEqual({ left: 200, top: 276 })
  })
  it('drops below the anchor when there is no room above', () => {
    expect(floatNotePos({ left: 200, top: 10, bottom: 30 }, { width: 120, height: 20 }, vp)).toEqual({ left: 200, top: 34 })
  })
  it('stays inside the right edge', () => {
    const p = floatNotePos({ left: 980, top: 300, bottom: 320 }, { width: 120, height: 20 }, vp)
    expect(p.left + 120).toBeLessThanOrEqual(996)
  })
  it('converts real px to layout px under the body zoom', () => {
    // At zoom 2 a real rect at (400, 600) is layout (200, 300); the viewport is 500x400 layout px.
    expect(floatNotePos({ left: 400, top: 600, bottom: 640 }, { width: 100, height: 20 }, vp, 2)).toEqual({ left: 200, top: 276 })
    const edge = floatNotePos({ left: 990, top: 600, bottom: 640 }, { width: 100, height: 20 }, vp, 2)
    expect(edge.left + 100).toBeLessThanOrEqual(496)
  })
  it('never goes off the top or left, even for a note wider than the window', () => {
    const p = floatNotePos({ left: -50, top: 2, bottom: 4 }, { width: 5000, height: 20 }, vp)
    expect(p.left).toBeGreaterThanOrEqual(4)
    expect(p.top).toBeGreaterThanOrEqual(4)
  })
  it('handles a bad zoom', () => {
    expect(floatNotePos({ left: 200, top: 300, bottom: 320 }, { width: 120, height: 20 }, vp, 0)).toEqual({ left: 200, top: 276 })
  })
})
