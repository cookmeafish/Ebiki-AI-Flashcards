import { describe, it, expect } from 'vitest'
import { ocrMatchKey, snapWordsToBoxes, overlayBoxes, hoverTooltipPos, readingLines } from './ocrBoxes'

const box = (x0, y0, x1, y1) => ({ x0, y0, x1, y1 })
const vw = (text, b) => ({ text, bbox: b })
const tw = (text, b, confidence = 90) => ({ text, bbox: b, confidence })

describe('ocrMatchKey', () => {
  it('ignores case, accents and punctuation in any script', () => {
    expect(ocrMatchKey('¡Hola,')).toBe('hola')
    expect(ocrMatchKey('Café')).toBe('cafe')
    expect(ocrMatchKey('Привет!')).toBe('привет')
    expect(ocrMatchKey('「猫」')).toBe('猫')
    expect(ocrMatchKey('…')).toBe('')
    expect(ocrMatchKey(null)).toBe('')
  })
})

describe('snapWordsToBoxes', () => {
  it('takes the nearest Tesseract box with the same text', () => {
    const words = [vw('el', box(0, 0, 10, 10)), vw('el', box(200, 0, 210, 10))]
    const tess = [tw('el', box(205, 2, 215, 12)), tw('El', box(3, 2, 13, 12))]
    expect(snapWordsToBoxes(words, tess)).toBe(2)
    expect(words[0].bbox).toEqual(box(3, 2, 13, 12))
    expect(words[1].bbox).toEqual(box(205, 2, 215, 12))
    expect(words.every((w) => w._snapped && !w._approxBox)).toBe(true)
  })

  it('a word that came without a box still takes a matching one instead of throwing', () => {
    const words = [{ text: 'hola' }, { text: 'mundo' }]
    const tess = [tw('hola', box(0, 0, 40, 10)), tw('mun', box(50, 0, 70, 10)), tw('do', box(72, 0, 90, 10))]
    expect(snapWordsToBoxes(words, tess)).toBe(2)
    expect(words[0].bbox).toEqual(box(0, 0, 40, 10))
    expect(words[1].bbox).toEqual(box(50, 0, 90, 10))
  })

  it('places a phrase the model kept together over the run of words that spells it', () => {
    const words = [vw('por favor', box(0, 0, 100, 20))]
    const tess = [tw('Por', box(2, 2, 40, 22), 88), tw('favor.', box(46, 2, 98, 22), 75)]
    expect(snapWordsToBoxes(words, tess)).toBe(1)
    expect(words[0].bbox).toEqual(box(2, 2, 98, 22))
    expect(words[0].confidence).toBe(75)
  })

  it('places a CJK word Tesseract cut into single characters', () => {
    const words = [vw('你好', box(0, 0, 40, 20))]
    const tess = [tw('你', box(0, 0, 20, 20)), tw('好', box(20, 0, 40, 20))]
    expect(snapWordsToBoxes(words, tess)).toBe(1)
    expect(words[0].bbox).toEqual(box(0, 0, 40, 20))
  })

  it('never joins words from different lines', () => {
    const words = [vw('New York', box(0, 0, 100, 60))]
    const tess = [tw('New', box(0, 0, 40, 20)), tw('York', box(0, 40, 50, 60))]
    snapWordsToBoxes(words, tess)
    expect(words[0]._approxBox).toBe(true)
    expect(words[0]._snapped).toBeUndefined()
  })

  it('slices one wide Tesseract word the model split in two', () => {
    const words = [vw('你好', box(0, 0, 40, 20)), vw('世界', box(40, 0, 80, 20))]
    const tess = [tw('你好世界', box(0, 0, 80, 20))]
    expect(snapWordsToBoxes(words, tess)).toBe(2)
    expect(words[0].bbox).toEqual(box(0, 0, 40, 20))
    expect(words[1].bbox).toEqual(box(40, 0, 80, 20))
  })

  it('does not give the same slice to two words', () => {
    const words = [vw('猫', box(0, 0, 20, 20)), vw('猫', box(0, 0, 20, 20))]
    const tess = [tw('猫犬', box(0, 0, 40, 20))]
    expect(snapWordsToBoxes(words, tess)).toBe(1)
    expect(words[1]._approxBox).toBe(true)
  })

  it('does not slice vertical text', () => {
    const words = [vw('你好', box(0, 0, 20, 40))]
    const tess = [tw('你好世界', box(0, 0, 20, 80))]
    snapWordsToBoxes(words, tess)
    expect(words[0]._approxBox).toBe(true)
  })

  it('uses each Tesseract word once and marks the rest approximate', () => {
    const words = [vw('de', box(0, 0, 10, 10)), vw('de', box(0, 0, 10, 10)), vw('???', box(0, 0, 1, 1))]
    const tess = [tw('de', box(0, 0, 10, 10))]
    expect(snapWordsToBoxes(words, tess)).toBe(1)
    expect(words[1]._approxBox).toBe(true)
    expect(words[2]._approxBox).toBe(true)
  })

  it('survives missing input', () => {
    expect(snapWordsToBoxes([], null)).toBe(0)
    const words = [vw('a', box(0, 0, 1, 1))]
    expect(snapWordsToBoxes(words, [null, { text: 'a' }])).toBe(0)
    expect(words[0]._approxBox).toBe(true)
  })
})

describe('overlayBoxes', () => {
  it('pads rows and clamps same-row overlaps', () => {
    const words = [vw('a', box(0, 0, 60, 20)), vw('b', box(50, 0, 100, 20))]
    const out = overlayBoxes(words)
    expect(out[0]).toEqual({ x0: 0, y0: 2, x1: 49, y1: 18 })
    expect(out[1]).toEqual({ x0: 50, y0: 2, x1: 100, y1: 18 })
  })

  it('never lets an undrawn word clip a drawn one', () => {
    const words = [vw('a', box(0, 0, 60, 20)), vw('rough', box(10, 0, 200, 20))]
    const out = overlayBoxes(words, undefined, (i) => i === 1)
    expect(out[0].x1).toBe(60)
  })

  it('moves boxes by the offset', () => {
    const out = overlayBoxes([vw('a', box(0, 0, 10, 10))], { x: 5, y: 7 })
    expect(out[0]).toEqual({ x0: 5, y0: 8, x1: 15, y1: 16 })
  })
})

describe('hoverTooltipPos', () => {
  const rect = (left, top, width, height) => ({ left, top, width, height, bottom: top + height })
  it('converts real px to layout px and goes above with room', () => {
    expect(hoverTooltipPos(rect(540, 540, 54, 27), 1.35, 1350)).toEqual({ x: 420, y: 394, anchor: 'above' })
  })
  it('goes below near the top', () => {
    const p = hoverTooltipPos(rect(400, 50, 40, 20), 1, 1000)
    expect(p.anchor).toBe('below')
    expect(p.y).toBe(76)
  })
  it('keeps the tooltip inside both edges', () => {
    expect(hoverTooltipPos(rect(0, 400, 10, 10), 1, 1000).x).toBe(160)
    expect(hoverTooltipPos(rect(990, 400, 10, 10), 1, 1000).x).toBe(840)
  })
  it('centres it in a viewport narrower than the tooltip', () => {
    expect(hoverTooltipPos(rect(0, 400, 10, 10), 2, 400).x).toBe(100)
  })
})

describe('readingLines', () => {
  it('groups by line, top to bottom, left to right', () => {
    const words = [vw('world', box(60, 0, 110, 20)), vw('next', box(0, 40, 40, 60)), vw('hello', box(0, 2, 50, 22))]
    expect(readingLines(words)).toEqual([{ line: 0, idxs: [2, 0] }, { line: 1, idxs: [1] }])
  })
  it('reads an Arabic or Hebrew line from its rightmost word', () => {
    const words = [vw('بالعالم', box(0, 0, 60, 20)), vw('مرحبا', box(80, 0, 140, 20)), vw('שלום', box(0, 40, 50, 60)), vw('עולם', box(60, 40, 110, 60))]
    expect(readingLines(words)).toEqual([{ line: 0, idxs: [1, 0] }, { line: 1, idxs: [3, 2] }])
  })
  it('keeps a mostly Latin line left to right even with one Arabic word', () => {
    const words = [vw('Hello', box(0, 0, 50, 20)), vw('there', box(60, 0, 110, 20)), vw('سلام', box(120, 0, 160, 20))]
    expect(readingLines(words)[0].idxs).toEqual([0, 1, 2])
  })
  it('ignores words without a box', () => {
    expect(readingLines([{ text: 'x' }, vw('a', box(0, 0, 10, 10))])).toEqual([{ line: 0, idxs: [1] }])
    expect(readingLines(null)).toEqual([])
  })
})
