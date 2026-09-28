// Every text key the app uses (t('key'), tCount(t, 'key'), *Key: 'key') exists in EVERY language (a missing
// key falls back to English, or shows as its raw name when English lacks it too).
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { I18N_LANGS } from '../i18n'
import { LANGUAGES } from '../i18n/languages'

const ROOTS = ['src'] // the whole app: features, shell, components, App.jsx
const SOURCE = /\.(jsx?|mjs)$/
const files = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
  const p = path.join(dir, d.name)
  return d.isDirectory() ? (d.name === 'i18n' ? [] : files(p)) : SOURCE.test(d.name) && !/\.test\./.test(d.name) ? [p] : []
})

// t('key'), t("key"), tCount(t, 'key', n) (checks key and keyOne), and literal keys in *Key: 'x' fields.
function usedKeys(src) {
  const keys = new Set()
  for (const m of src.matchAll(/\bt\(\s*['"]([A-Za-z][\w]*)['"]/g)) keys.add(m[1])
  for (const m of src.matchAll(/\btCount\(\s*t\s*,\s*['"]([A-Za-z][\w]*)['"]/g)) { keys.add(m[1]); keys.add(`${m[1]}One`) }
  for (const m of src.matchAll(/\b(?:labelKey|titleKey|descKey|nameKey)\s*:\s*['"]([A-Za-z][\w]*)['"]/g)) keys.add(m[1])
  for (const k of keys) if (k.endsWith('_')) keys.delete(k) // t('tab_' + id): a prefix, checked where the ids are listed
  return keys
}

describe('translations used by the app', () => {
  const all = new Map()
  for (const root of ROOTS) for (const f of files(root)) for (const k of usedKeys(fs.readFileSync(f, 'utf8'))) all.set(k, f)
  const dict = Object.fromEntries(LANGUAGES.map((l) => [l.code, l.strings]))

  it('finds the keys it checks', () => { expect(all.size).toBeGreaterThan(300) })
  for (const l of I18N_LANGS) {
    it(`every used key is translated in ${l}`, () => {
      const missing = [...all].filter(([k]) => dict[l][k] == null).map(([k, f]) => `${k} (${f})`)
      expect(missing).toEqual([])
    })
  }
})
