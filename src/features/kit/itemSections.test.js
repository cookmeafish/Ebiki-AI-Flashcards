// Lesson item backs shown as sections (itemSections.js).
import { describe, it, expect } from 'vitest'
import { itemSections, splitPoints, SECTION_ICON } from './itemSections'

describe('itemSections', () => {
  it('splits a course card into meaning, example, category and key points (as bullets)', () => {
    const s = itemSections('Definition: The CIA triad.\nExample: A locked server room.\nCategory: 1.2 Concepts\nKey Points: Confidentiality is secrecy; Integrity is no tampering; Availability is uptime')
    expect(s.map((x) => x.role)).toEqual(['meaning', 'example', 'category', 'points'])
    expect(s[3].points).toEqual(['Confidentiality is secrecy', 'Integrity is no tampering', 'Availability is uptime'])
  })
  it('reads labels in other languages, and keeps unknown labels as they are', () => {
    const s = itemSections('Pronunciación: PEH-roh\nTraducción: dog\nEjemplo: El perro corre.\nOrigen: latín')
    expect(s.map((x) => x.role)).toEqual(['sound', 'meaning', 'example', 'other'])
    expect(s[3].label).toBe('Origen')
  })
  it('a back without labels is one plain section; a wrapped line joins the one before', () => {
    expect(itemSections('Just a sentence about it.')).toEqual([{ role: 'other', label: '', text: 'Just a sentence about it.' }])
    expect(itemSections('Example: First line\nsecond line')[0].text).toBe('First line\nsecond line')
  })
  it('a long sentence with a colon is not mistaken for a label; a URL is not a label', () => {
    expect(itemSections('The rule for all of these cases is simple: use TLS.')[0].role).toBe('other')
    expect(itemSections('https://example.com/x')[0].label).toBe('')
  })
  it('synonym and grammar lines have their own roles (and icons), in several languages', () => {
    expect(itemSections('Sinónimos: lento, pausado\nSynonyms: slow\nGénero: femenino').map((s) => s.role)).toEqual(['similar', 'similar', 'grammar'])
    expect(SECTION_ICON.similar && SECTION_ICON.grammar).toBeTruthy()
  })
  it('splitPoints never splits on commas', () => { expect(splitPoints('a, b; c')).toEqual(['a, b', 'c']) })
})
