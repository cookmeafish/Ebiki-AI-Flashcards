// Rules for every locale file (src/i18n/locales/<code>.js), so a new language is checked the moment it is
// added to languages.js: the same keys as English, the same {placeholders}, no dashes, no duplicate keys,
// count labels paired.
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { LANGUAGES, FALLBACK_LANGUAGE } from './languages'
import { makeT, APP_LANGUAGES, langMeta } from './index'

const DASHES = /[–—]/ // en dash, em dash: banned in user-facing text
const placeholders = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
// Keys that merely END in "One" and are not the singular of a count label.
const NOT_COUNTS = new Set(['fbr_ankiCorrectedOne', 'pronOnlyOne', 'sessionLabelOne', 'cardLabelOne', 'd_getOne'])
const base = LANGUAGES.find((l) => l.code === FALLBACK_LANGUAGE).strings

describe('languages list', () => {
  it('has unique codes, each with a locale file and every field', () => {
    const codes = LANGUAGES.map((l) => l.code)
    expect(new Set(codes).size).toBe(codes.length)
    for (const l of LANGUAGES) {
      for (const f of ['code', 'label', 'name', 'pickerName', 'ocr']) expect(l[f], `${l.code}.${f}`).toBeTruthy()
      expect(fs.existsSync(path.join('src/i18n/locales', `${l.code}.js`)), l.code).toBe(true)
    }
    expect(APP_LANGUAGES.map((l) => l.code)).toEqual(codes)
    expect(langMeta('xx').code).toBe(FALLBACK_LANGUAGE)
  })
})

for (const lang of LANGUAGES) {
  describe(`locale ${lang.code}`, () => {
    const dict = lang.strings
    it('has exactly the English keys', () => {
      const missing = Object.keys(base).filter((k) => dict[k] == null)
      const extra = Object.keys(dict).filter((k) => base[k] == null)
      expect({ missing, extra }).toEqual({ missing: [], extra: [] })
    })
    it('keeps every {placeholder} of the English text', () => {
      // A singular ("...One") may still say {n}: Chinese and Japanese use one form for every count.
      const same = (k) => { const want = placeholders(base[k]).join(); const got = placeholders(dict[k]); return got.join() === want || (k.endsWith('One') && got.filter((p) => p !== 'n').join() === want) }
      const bad = Object.keys(base).filter((k) => dict[k] != null && !same(k))
      expect(bad).toEqual([])
    })
    it('has no em or en dashes', () => {
      expect(Object.entries(dict).filter(([, v]) => DASHES.test(v)).map(([k]) => k)).toEqual([])
    })
    it('declares no key twice (the later one would silently win)', () => {
      const src = fs.readFileSync(path.join('src/i18n/locales', `${lang.code}.js`), 'utf8')
      const seen = new Set(); const dup = []
      for (const m of src.matchAll(/(?:^|[,{]\s*|\n\s*)([A-Za-z_$][\w$]*)\s*:\s*['"`]/g)) { if (seen.has(m[1])) dup.push(m[1]); seen.add(m[1]) }
      expect(dup).toEqual([])
    })
    it('pairs count labels (key / keyOne)', () => {
      const unpaired = Object.keys(dict).filter((k) => k.endsWith('One') && !NOT_COUNTS.has(k) && dict[k.slice(0, -3)] == null)
      expect(unpaired).toEqual([])
    })
    it('reaches t()', () => {
      const [k] = Object.keys(dict)
      expect(makeT(lang.code)(k)).toBe(dict[k])
    })
  })
}

// The launcher, installer, splash and app window read the `ln_*` keys from a generated copy.
describe('launcher text (scripts/launcher-strings.json)', () => {
  it('matches the locale files (run `npm run i18n:launcher` after editing ln_* keys)', async () => {
    const { buildLauncherStrings, OUT } = await import('../../scripts/build-launcher-strings.mjs')
    expect(fs.readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n')).toBe(await buildLauncherStrings())
  })
  it('is read in the saved or system language, English otherwise, with {placeholders} filled', async () => {
    const { createRequire } = await import('module')
    const { launcherText } = createRequire(import.meta.url)('../../scripts/launcher-i18n.cjs')
    const ja = launcherText('ja-JP')
    const saved = (() => { try { return JSON.parse(fs.readFileSync('applang.json', 'utf8')).lang } catch { return null } })()
    if (!saved) expect(ja.lang).toBe('ja') // an applang.json on this machine wins over the system language
    expect(ja.t('ln_ankiUpdated', { version: '26.5' })).toContain('26.5')
    expect(ja.t('ln_missingKey')).toBe('ln_missingKey')
  })
})
