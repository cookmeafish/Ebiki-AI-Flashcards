import { describe, expect, it } from 'vitest'
import { asText, shapeSuggestion } from './suggestion'

describe('shapeSuggestion', () => {
  it('turns object, list and number fields into text', () => {
    const s = shapeSuggestion({ term: { es: 'perro' }, translation: ['dog', 'hound'], why: 3, partOfSpeech: null, draftMeaning: ' x ' })
    expect(s.term).toBe('perro')
    expect(s.translation).toBe('dog, hound')
    expect(s.why).toBe('3')
    expect(s.partOfSpeech).toBe('')
    expect(s.draftMeaning).toBe('x')
  })
  it('takes the first item of a list reply', () => {
    expect(shapeSuggestion([null, { term: 'gato' }, { term: 'perro' }]).term).toBe('gato')
  })
  it('unwraps {"suggestion": {...}}', () => {
    expect(shapeSuggestion({ suggestion: { term: 'casa', translation: 'house' } }).translation).toBe('house')
    expect(shapeSuggestion({ items: 1, item: [{ term: 'mesa' }] }).term).toBe('mesa')
  })
  it('gives null for nothing usable', () => {
    expect(shapeSuggestion(null)).toBe(null)
    expect(shapeSuggestion('perro')).toBe(null)
    expect(shapeSuggestion([])).toBe(null)
    expect(shapeSuggestion({ foo: 1 }).term).toBe('')
  })
  it('asText reads nested values', () => {
    expect(asText({ a: 1, b: 'two' })).toBe('two')
    expect(asText([{ x: 'a' }, 'b'])).toBe('a, b')
  })
})
