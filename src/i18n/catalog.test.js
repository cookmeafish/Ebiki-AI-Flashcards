import { describe, it, expect } from 'vitest'
import { LANGUAGE_META, LOCALE_LOADERS, FALLBACK_LANGUAGE } from './catalog.js'
import { LANGUAGES } from './languages.js'

describe('language catalog (on-demand locales)', () => {
  it('has a loader for every language but the fallback, and nothing else', () => {
    const want = LANGUAGE_META.map((l) => l.code).filter((c) => c !== FALLBACK_LANGUAGE).sort()
    expect(Object.keys(LOCALE_LOADERS).sort()).toEqual(want)
  })

  it('every loader brings the same strings languages.js bundles', async () => {
    for (const l of LANGUAGES) {
      expect(l.strings, l.code).toBeTruthy()
      if (l.code === FALLBACK_LANGUAGE) continue
      const m = await LOCALE_LOADERS[l.code]()
      expect(m.default, l.code).toBe(l.strings)
    }
  })

  it('languages.js keeps the catalog order and fields', () => {
    expect(LANGUAGES.map(({ strings, ...meta }) => meta)).toEqual(LANGUAGE_META)
  })
})

describe('loading a locale', () => {
  it('loadLocale resolves true and makeT answers in that language', async () => {
    const { loadLocale, makeT, isLocaleLoaded } = await import('./index.js')
    expect(await loadLocale('ja')).toBe(true)
    expect(isLocaleLoaded('ja')).toBe(true)
    const ja = LANGUAGES.find((l) => l.code === 'ja').strings
    const key = Object.keys(ja).find((k) => ja[k] && !/\{/.test(ja[k]))
    expect(makeT('ja')(key)).toBe(ja[key])
  })

  it('an unknown code needs no loading and answers in the fallback', async () => {
    const { loadLocale, makeT, isLocaleLoaded } = await import('./index.js')
    expect(isLocaleLoaded('xx')).toBe(true)
    expect(await loadLocale('xx')).toBe(true)
    const en = LANGUAGES.find((l) => l.code === FALLBACK_LANGUAGE).strings
    const key = Object.keys(en)[0]
    expect(makeT('xx')(key)).toBe(en[key])
  })
})
