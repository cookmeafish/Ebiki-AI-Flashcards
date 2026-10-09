import { describe, it, expect } from 'vitest'
import { needsRasterCopy, svgIntrinsicSize, svgTextOf, rasterSize } from './image'

describe('needsRasterCopy', () => {
  it('passes the formats the OCR reads, with a size', () => {
    for (const u of ['data:image/png;base64,x', 'data:image/jpeg;base64,x', 'data:image/jpg;base64,x', 'data:image/webp;base64,x']) expect(needsRasterCopy(u, 10, 10)).toBe(false)
  })
  it('re-encodes everything else, and anything without a size', () => {
    for (const u of ['data:image/svg+xml;base64,x', 'data:image/avif;base64,x', 'data:image/x-icon;base64,x', 'data:image/bmp;base64,x', 'data:image/gif;base64,x', '']) expect(needsRasterCopy(u, 10, 10)).toBe(true)
    expect(needsRasterCopy('data:image/png;base64,x', 0, 0)).toBe(true)
  })
})

describe('svgIntrinsicSize', () => {
  it('reads width/height, else the viewBox', () => {
    expect(svgIntrinsicSize('<svg width="300" height="100px">')).toEqual({ w: 300, h: 100 })
    expect(svgIntrinsicSize('<svg xmlns="x" viewBox="0 0 600 200">')).toEqual({ w: 600, h: 200 })
    expect(svgIntrinsicSize('<svg width="300" viewBox="0,0,600,200">')).toEqual({ w: 300, h: 100 })
    expect(svgIntrinsicSize('<svg width="50%" height="2em">')).toBe(null)
    expect(svgIntrinsicSize('not svg')).toBe(null)
  })
})

describe('svgTextOf', () => {
  it('decodes base64 (UTF-8) and URL-encoded SVG data URLs', () => {
    const svg = '<svg viewBox="0 0 10 10"><text>días</text></svg>'
    const b64 = 'data:image/svg+xml;base64,' + Buffer.from(svg, 'utf8').toString('base64')
    expect(svgTextOf(b64)).toBe(svg)
    expect(svgTextOf('data:image/svg+xml,' + encodeURIComponent(svg))).toBe(svg)
    expect(svgTextOf('data:image/png;base64,abc')).toBe('')
  })
})

describe('rasterSize', () => {
  it('keeps a bitmap size, caps huge ones, scales small vector art up', () => {
    expect(rasterSize(900, 300)).toEqual({ w: 900, h: 300 })
    expect(rasterSize(8192, 4096)).toEqual({ w: 4096, h: 2048 })
    expect(rasterSize(0, 0, { w: 600, h: 200 })).toEqual({ w: 1024, h: 341 })
    expect(rasterSize(0, 0, null)).toEqual({ w: 1024, h: 768 })
    expect(rasterSize(300, 150, { w: 600, h: 200 })).toEqual({ w: 1024, h: 341 }) // the declared aspect, not a default box
  })
})
