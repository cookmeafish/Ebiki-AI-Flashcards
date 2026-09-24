import { describe, it, expect } from 'vitest'
import { storageKey } from './storage'

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
