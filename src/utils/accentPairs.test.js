import { describe, expect, it } from 'vitest'
import { ACCENT_TWINS, isAccentTwin } from './accentPairs'

describe('isAccentTwin', () => {
  it('knows the words whose bare spelling is another word', () => {
    expect(isAccentTwin('él', 'spa')).toBe(true)
    expect(isAccentTwin('Más', 'spa')).toBe(true)
    expect(isAccentTwin('está', 'spa')).toBe(true)
    expect(isAccentTwin('où', 'fra')).toBe(true)
    expect(isAccentTwin('é', 'por')).toBe(true)
  })
  it('never a real target word without a twin', () => {
    expect(isAccentTwin('cálida', 'spa')).toBe(false)
    expect(isAccentTwin('brújula', 'spa')).toBe(false)
    expect(isAccentTwin('el', 'spa')).toBe(false) // no accent
    expect(isAccentTwin('él es', 'spa')).toBe(false) // one word only
    expect(isAccentTwin('', 'spa')).toBe(false)
  })
  it('is per language, any listed language when unknown', () => {
    expect(isAccentTwin('où', 'spa')).toBe(false)
    expect(isAccentTwin('où', 'deu')).toBe(false)
    expect(isAccentTwin('où', null)).toBe(true)
  })
  it('lists bare, lowercase spellings only', () => {
    for (const list of Object.values(ACCENT_TWINS)) for (const w of list) {
      expect(w).toBe(w.toLowerCase())
      expect(w.normalize('NFD').replace(/\p{M}/gu, '')).toBe(w)
    }
  })
})
