import { describe, it, expect } from 'vitest'
import { storageKey, legacyFallbackAllowed } from './storage'

describe('legacyFallbackAllowed', () => {
  it('never applies to ASCII names (their legacy key is their key)', () => {
    expect(legacyFallbackAllowed('Spanish')).toBe(false)
  })

  it('allows a legacy key that still has letters or digits in it', () => {
    expect(legacyFallbackAllowed('Español')).toBe(true) // "Espa-ol"
  })

  it('refuses an all-dash legacy key another name could have written (the 日本語/韓国語 "---" case)', () => {
    expect(legacyFallbackAllowed('韓国語')).toBe(false)
    expect(legacyFallbackAllowed('韓国語', ['日本語', '韓国語'])).toBe(false)
  })

  it('allows an all-dash legacy key when no other name in use maps to it', () => {
    expect(legacyFallbackAllowed('日本語', ['日本語', 'Spanish', '中文'])).toBe(true) // "---" vs "--"
  })
})

describe('storageKey', () => {
  it('keeps the exact legacy key for ASCII-only names, so existing data stays where it is', () => {
    expect(storageKey('Spanish')).toBe('Spanish')
    expect(storageKey('Language Learning')).toBe('Language-Learning')
    expect(storageKey('Security+')).toBe('Security-')
    expect(storageKey('')).toBe('default')
  })

  it('no longer lets non-ASCII names that sanitize alike share one store', () => {
    // Both used to become "---".
    expect(storageKey('日本語')).not.toBe(storageKey('韓国語'))
    expect(storageKey('西班牙语')).not.toBe(storageKey('日语学习'))
  })

  it('is stable for the same name and keeps the legacy prefix readable', () => {
    expect(storageKey('Español')).toBe(storageKey('Español'))
    expect(storageKey('Español')).toMatch(/^Espa-ol-[0-9a-f]{8}$/)
  })

  it('only ever produces characters the server-side sanitizer leaves untouched', () => {
    for (const name of ['日本語', 'Español', 'Ελληνικά', 'C++ & C#', 'a/b\\c']) {
      const k = storageKey(name)
      expect(k.replace(/[^a-zA-Z0-9._-]/g, '-')).toBe(k)
    }
  })
})
