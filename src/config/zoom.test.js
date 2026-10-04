import { describe, it, expect } from 'vitest'
import { ZOOM, clampZoom, parseZoom, zoomPercent, formatZoom, stepZoom, canZoomIn, canZoomOut, zoomKeyAction, applyZoomAction, isDefaultZoom } from './zoom'

describe('app zoom', () => {
  it('parses and clamps stored values', () => {
    expect(parseZoom(null)).toBe(ZOOM.default)
    expect(parseZoom('')).toBe(ZOOM.default)
    expect(parseZoom('junk')).toBe(ZOOM.default)
    expect(parseZoom('1.62')).toBe(1.62)
    expect(parseZoom('9')).toBe(ZOOM.max)
    expect(parseZoom('0.2')).toBe(ZOOM.min)
    expect(clampZoom(-1)).toBe(ZOOM.default)
  })

  it('shows the default as 100%', () => {
    expect(zoomPercent(ZOOM.default)).toBe(100)
    expect(formatZoom(ZOOM.default)).toBe('100%')
    expect(zoomPercent(ZOOM.max)).toBe(148)
    expect(zoomPercent(ZOOM.min)).toBe(74)
  })

  it('steps 10% of the default and stops at the limits', () => {
    expect(zoomPercent(stepZoom(ZOOM.default, 1))).toBe(110)
    expect(zoomPercent(stepZoom(ZOOM.default, -1))).toBe(90)
    let z = ZOOM.default
    for (let i = 0; i < 20; i++) z = stepZoom(z, 1)
    expect(z).toBe(ZOOM.max)
    expect(canZoomIn(z)).toBe(false)
    expect(zoomPercent(stepZoom(z, -1))).toBe(140)
    for (let i = 0; i < 20; i++) z = stepZoom(z, -1)
    expect(z).toBe(ZOOM.min)
    expect(canZoomOut(z)).toBe(false)
    expect(zoomPercent(stepZoom(z, 1))).toBe(80)
    // Stepping back and forth returns to the default exactly.
    expect(stepZoom(stepZoom(ZOOM.default, 1), -1)).toBe(ZOOM.default)
    expect(isDefaultZoom(stepZoom(stepZoom(ZOOM.default, -1), 1))).toBe(true)
  })

  it('maps keys to actions', () => {
    expect(zoomKeyAction({ ctrlKey: true, key: '=' })).toBe('in')
    expect(zoomKeyAction({ ctrlKey: true, key: '+' })).toBe('in')
    expect(zoomKeyAction({ metaKey: true, key: '-' })).toBe('out')
    expect(zoomKeyAction({ ctrlKey: true, key: '_' })).toBe('out')
    expect(zoomKeyAction({ ctrlKey: true, key: '0' })).toBe('reset')
    expect(zoomKeyAction({ ctrlKey: true, code: 'NumpadAdd', key: '+' })).toBe('in')
    expect(zoomKeyAction({ key: '=' })).toBe(null)
    expect(zoomKeyAction({ ctrlKey: true, altKey: true, key: '=' })).toBe(null)
    expect(zoomKeyAction({ ctrlKey: true, key: '=', isComposing: true })).toBe(null)
    expect(zoomKeyAction({ ctrlKey: true, key: 'a' })).toBe(null)
    expect(applyZoomAction(1.62, 'reset')).toBe(ZOOM.default)
  })
})
