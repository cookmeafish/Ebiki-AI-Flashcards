// langFromName resolves free-text mode/language names. Names match as WHOLE words: a name that merely
// contains a label ("perspanish") is not that language.
import { describe, it, expect } from 'vitest'
import { langFromName } from './languages'

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
