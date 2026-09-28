// App-language i18n for Ebiki's UI (everything outside flashcard content). This file is only the engine:
// every string lives in ./locales/<code>.js and the languages are listed once in ./languages.js.
// t(key, vars) returns the string for the active language, falling back to English, then to the key itself.
import { LANGUAGES, FALLBACK_LANGUAGE } from './languages.js'

export { LANGUAGES }
// { code, label } for the language pickers.
export const APP_LANGUAGES = LANGUAGES.map(({ code, label }) => ({ code, label }))
export const I18N_LANGS = LANGUAGES.map((l) => l.code)
const DICTS = Object.fromEntries(LANGUAGES.map((l) => [l.code, l.strings]))
const FALLBACK = DICTS[FALLBACK_LANGUAGE] || {}

// A language's details (unknown codes get the fallback language's).
export const langMeta = (code) => LANGUAGES.find((l) => l.code === code) || LANGUAGES.find((l) => l.code === FALLBACK_LANGUAGE)

// Build a t() bound to a language. Optional `vars` interpolates {placeholders}; an unknown placeholder is left
// as-is so a missing value shows the token rather than "undefined".
export function makeT(lang) {
  const dict = DICTS[lang] || FALLBACK
  return (key, vars) => {
    const raw = dict[key] != null ? dict[key] : FALLBACK[key] != null ? FALLBACK[key] : key
    if (!vars) return raw
    return String(raw).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m))
  }
}
