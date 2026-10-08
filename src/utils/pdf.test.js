// Rebuilding a PDF page's LINES from pdf.js text items: the knowledge outline needs each heading on its own
// line, words split by a font change kept whole, and no spaces pushed into Chinese/Japanese text.
import { describe, it, expect } from 'vitest'
import { linesFromItems } from './pdf.js'

const item = (str, x, y, w, h = 10, hasEOL = false) => ({ str, transform: [h, 0, 0, h, x, y], width: w, height: h, hasEOL })

describe('linesFromItems', () => {
  it('keeps a word whose font changes midway whole (small caps)', () => {
    expect(linesFromItems([item('C', 0, 100, 7), item('HAPTER 3', 7, 100, 50)])).toEqual(['CHAPTER 3'])
  })
  it('starts a new line on a real line step, not on a superscript', () => {
    expect(linesFromItems([item('E = mc', 0, 40, 30), item('2', 30, 44, 4, 6), item(' end', 34, 40, 20), item('Next', 0, 20, 20)]))
      .toEqual(['E = mc2 end', 'Next'])
  })
  it('never puts a space between Chinese or Japanese characters', () => {
    expect(linesFromItems([item('日本', 0, 60, 20), item('語の', 25, 60, 20)])).toEqual(['日本語の'])
  })
  it('keeps the space between Korean words that are apart', () => {
    expect(linesFromItems([item('한국', 0, 20, 20), item('어', 30, 20, 10)])).toEqual(['한국 어'])
  })
  it('right-to-left runs drawn out of order still get their space', () => {
    expect(linesFromItems([item('שלום', 100, 20, 30), item('עולם', 50, 20, 30)])).toEqual(['שלום עולם'])
  })
  it('honours pdf.js end-of-line marks and skips empty items', () => {
    expect(linesFromItems([item('Title', 0, 20, 20), item('', 0, 20, 0, 10, true), item('Body', 0, 20, 20)])).toEqual(['Title', 'Body'])
  })
  it('without positions falls back to a space between runs', () => {
    expect(linesFromItems([{ str: 'a' }, { str: 'b' }])).toEqual(['a b'])
    expect(linesFromItems(undefined)).toEqual([])
  })
})
