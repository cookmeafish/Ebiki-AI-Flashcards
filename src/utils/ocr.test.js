import { describe, it, expect } from 'vitest'
import { preprocessPixels, filterTessWords, dedupeOcrWords, tidyOcrWords, fitCjkBox, untranslatedOcrWords } from './ocr'

const box = (x0, y0, x1, y1) => ({ x0, y0, x1, y1 })
const tw = (text, b, confidence = 90) => ({ text, bbox: b, confidence })
const px = (...rgba) => new Uint8ClampedArray(rgba.flat())

describe('preprocessPixels', () => {
  it('keeps dark text dark on a light opaque page', () => {
    const d = preprocessPixels(px([255, 255, 255, 255], [255, 255, 255, 255], [255, 255, 255, 255], [10, 10, 10, 255]))
    expect([d[0], d[12]]).toEqual([255, 0])
    expect(d[15]).toBe(255)
  })
  it('inverts a dark page so text ends up dark on white', () => {
    const d = preprocessPixels(px([18, 18, 18, 255], [18, 18, 18, 255], [18, 18, 18, 255], [227, 227, 227, 255]))
    expect([d[0], d[12]]).toEqual([255, 0])
  })
  it('dark text on a transparent background: white backdrop, text stays dark', () => {
    const d = preprocessPixels(px([0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [17, 17, 17, 255]))
    expect([d[0], d[12]]).toEqual([255, 0])
    expect([d[3], d[7], d[11], d[15]]).toEqual([255, 255, 255, 255])
  })
  it('WHITE text on a transparent background: black backdrop, then inverted (it vanished on white)', () => {
    const d = preprocessPixels(px([0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [255, 255, 255, 255]))
    expect([d[0], d[12]]).toEqual([255, 0])
  })
  it('anti-aliased edges blend with the backdrop', () => {
    const d = preprocessPixels(px([0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [255, 255, 255, 255], [255, 255, 255, 128]))
    expect(d[16]).toBeGreaterThan(0)
    expect(d[16]).toBeLessThan(255)
  })
  it('an empty buffer is left alone', () => {
    expect(preprocessPixels(new Uint8ClampedArray(0)).length).toBe(0)
  })
})

describe('filterTessWords', () => {
  const opts = { realW: 900, realH: 300 }
  it('keeps confident words in any script and trims their punctuation', () => {
    const out = filterTessWords([tw('¿Dónde', box(0, 0, 80, 30)), tw('мир!', box(90, 0, 150, 30)), tw('بالعالم', box(160, 0, 260, 30))], opts)
    expect(out.map((w) => w.text)).toEqual(['Dónde', 'мир', 'بالعالم'])
  })
  it('a single Latin letter needs 85%, a single CJK character only 60% (real reads: を 84%, 气)', () => {
    const out = filterTessWords([tw('l', box(0, 0, 4, 30), 84), tw('を', box(166, 187, 183, 215), 84), tw('气', box(200, 0, 230, 30), 62), tw('猫', box(240, 0, 270, 30), 40)], opts)
    expect(out.map((w) => w.text)).toEqual(['を', '气'])
  })
  it('a letter with its vowel signs is a word, not a stray single letter (Hindi है, Thai ที่)', () => {
    const out = filterTessWords([tw('है', box(0, 0, 30, 30), 70), tw('ที่', box(40, 0, 70, 30), 70), tw('é', box(80, 0, 100, 30), 70)], opts)
    expect(out.map((w) => w.text)).toEqual(['है', 'ที่'])
  })
  it('drops letterless reads, unconfident short words, slivers, tiny boxes, banners', () => {
    const log = []
    const out = filterTessWords([
      tw('©', box(0, 0, 20, 20), 99), tw('|||', box(0, 0, 5, 40), 99),
      tw('ab', box(0, 0, 30, 30), 50), tw('word', box(0, 0, 300, 10), 95), tw('tiny', box(0, 0, 9, 30), 95),
      tw('banner', box(0, 0, 600, 60), 95), tw('fine', box(0, 0, 60, 30), 40),
    ], { ...opts, log: (m) => log.push(m) })
    expect(out.map((w) => w.text)).toEqual(['fine'])
    expect(log.length).toBe(4)
  })
  it('scales boxes back up when the OCR copy was downscaled', () => {
    const [w] = filterTessWords([tw('hola', box(10, 10, 50, 30))], { realW: 5120, realH: 2880, bboxScale: 2 })
    expect(w.bbox).toEqual(box(20, 20, 100, 60))
  })
  it('survives junk input', () => {
    expect(filterTessWords(null)).toEqual([])
    expect(filterTessWords([null, { text: 'x' }])).toEqual([])
  })
})

describe('dedupeOcrWords', () => {
  it('the same text read twice with a sloppy wide box keeps the tight one (real Japanese 日)', () => {
    const out = dedupeOcrWords([tw('日', box(43, 187, 88, 215), 96), tw('本', box(102, 188, 123, 215)), tw('日', box(42, 186, 226, 215), 97)])
    expect(out.map((w) => w.text)).toEqual(['日', '本'])
    expect(out[0].bbox.x1).toBe(88)
  })
  it('the tight copy arriving second replaces the wide one', () => {
    const out = dedupeOcrWords([tw('Home', box(10, 10, 200, 30), 95), tw('Home', box(10, 10, 60, 30), 90)])
    expect(out).toHaveLength(1)
    expect(out[0].bbox.x1).toBe(60)
  })
  it('overlapping different reads keep the more confident one', () => {
    const out = dedupeOcrWords([tw('Hcme', box(10, 10, 60, 30), 50), tw('Home', box(11, 10, 61, 30), 90)])
    expect(out.map((w) => w.text)).toEqual(['Home'])
  })
  it('a big bad box does not eat the words inside it', () => {
    const out = dedupeOcrWords([tw('a', box(0, 0, 40, 30)), tw('xxxxxxxx', box(0, 0, 400, 30)), tw('b', box(50, 0, 90, 30))])
    expect(out).toHaveLength(3)
  })
  it('the same word twice on a page stays twice', () => {
    expect(dedupeOcrWords([tw('the', box(0, 0, 40, 30)), tw('the', box(200, 0, 240, 30))])).toHaveLength(2)
  })
})

describe('tidyOcrWords', () => {
  it('trims edge punctuation, drops punctuation and icon reads, keeps numbers', () => {
    const out = tidyOcrWords([tw('dog.', box(0, 0, 1, 1)), tw('。', box(0, 0, 1, 1)), tw('©', box(0, 0, 1, 1)), tw('2024', box(0, 0, 1, 1)), tw('¿Dónde', box(0, 0, 1, 1)), tw('「猫」', box(0, 0, 1, 1)), { text: 'x' }])
    expect(out.map((w) => w.text)).toEqual(['dog', '2024', 'Dónde', '猫'])
    expect(out[0].confidence).toBe(90)
  })
})

describe('fitCjkBox', () => {
  it('cuts a runaway CJK box back from its (correct) left edge (real read: 天気 229px wide, 30px tall)', () => {
    expect(fitCjkBox('天気', box(134, 46, 363, 76))).toEqual(box(134, 46, 200, 76))
  })
  it('leaves sane CJK boxes, other scripts and vertical text alone', () => {
    expect(fitCjkBox('今日', box(38, 46, 93, 75))).toEqual(box(38, 46, 93, 75))
    expect(fitCjkBox('elephant', box(0, 0, 400, 30))).toEqual(box(0, 0, 400, 30))
    expect(fitCjkBox('東京', box(0, 0, 30, 200))).toEqual(box(0, 0, 30, 200))
    expect(fitCjkBox('東京', null)).toBe(null)
  })
  it('applies inside filterTessWords and tidyOcrWords', () => {
    expect(filterTessWords([tw('天気', box(134, 46, 363, 76))], { realW: 900, realH: 300 })[0].bbox.x1).toBe(200)
    expect(tidyOcrWords([tw('天気。', box(134, 46, 363, 76))])[0].bbox.x1).toBe(200)
  })
})

describe('untranslatedOcrWords', () => {
  it('keeps text, box and confidence and marks every word untranslated', () => {
    const out = untranslatedOcrWords([tw(' perro ', box(0, 0, 10, 10), 88), tw('gato', box(12, 0, 20, 10))])
    expect(out.map((w) => w.text)).toEqual(['perro', 'gato'])
    expect(out[0]).toMatchObject({ bbox: box(0, 0, 10, 10), confidence: 88, _untranslated: true, translation: '', isEnglish: false, _globalIdx: 0 })
    expect(out[1]._globalIdx).toBe(1)
  })
  it('drops empty or boxless reads and tolerates junk input', () => {
    expect(untranslatedOcrWords([tw('  ', box(0, 0, 1, 1)), { text: 'x' }, null])).toEqual([])
    expect(untranslatedOcrWords(null)).toEqual([])
  })
})
