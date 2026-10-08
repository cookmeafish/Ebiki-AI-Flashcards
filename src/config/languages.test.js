// langFromName resolves free-text mode/language names. Names match as WHOLE words: a name that merely
// contains a label ("perspanish") is not that language.
import { describe, it, expect } from 'vitest'
import { langFromName, langDisplayName } from './languages'

const label = (n) => langFromName(n)?.label ?? null

describe('langFromName', () => {
  it('finds a language named inside a longer mode name', () => {
    expect(label('Learn Spanish')).toBe('Spanish')
    expect(label('Spanish-English')).toBe('Spanish')
    expect(label('Chinese (Simplified) HSK')).toBe('Chinese (Simplified)')
  })
  it('knows other names for a language', () => {
    expect(label('Mandarin Chinese')).toBe('Chinese (Simplified)')
    expect(label('Traditional Chinese')).toBe('Chinese (Traditional)')
    expect(label('Inglés para viajar')).toBe('English')
    expect(label('日本語')).toBe('Japanese')
  })
  it('never matches a label that is only part of a word', () => {
    expect(label('perspanish')).toBe(null)
    expect(label('Spanishx')).toBe(null)
  })
})

describe('langDisplayName', () => {
  it('names a language in the app language', () => {
    expect(langDisplayName('Spanish', 'es')).toBe('español')
    expect(langDisplayName('Chinese (Simplified)', 'es', { capitalize: true })).toBe('Chino simplificado')
    expect(langDisplayName('Spanish', 'zh')).toBe('西班牙语')
  })
  it('leaves English, free-text names and unknown languages as written', () => {
    expect(langDisplayName('Spanish', 'en')).toBe('Spanish')
    expect(langDisplayName('Spanish for travel', 'es')).toBe('Spanish for travel')
    expect(langDisplayName('Cantonese', 'es')).toBe('Cantonese')
    expect(langDisplayName('', 'es')).toBe('')
  })
})
