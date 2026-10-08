// App-language i18n for Ebiki's UI (everything outside flashcard content). This file is only the engine:
// every string lives in ./locales/<code>.js and the languages are listed once in ./catalog.js.
// t(key, vars) returns the string for the active language, falling back to English, then to the key itself.
// Only English ships in the startup bundle; another language is fetched on first use (loadLocale), and makeT()
// for a language not loaded yet answers in English. The App waits for the chosen language before its first
// paint and keeps showing the previous one while a newly picked language loads (useLocale in ./useLocale.js),
// so neither English nor raw keys flash.
import { LANGUAGE_META, FALLBACK_LANGUAGE, LOCALE_LOADERS } from './catalog.js'
import en from './locales/en.js'

export const LANGUAGES = LANGUAGE_META
export { FALLBACK_LANGUAGE }
// { code, label } for the language pickers.
export const APP_LANGUAGES = LANGUAGE_META.map(({ code, label }) => ({ code, label }))
export const I18N_LANGS = LANGUAGE_META.map((l) => l.code)
const DICTS = { [FALLBACK_LANGUAGE]: en }
const FALLBACK = en

// A language's details (unknown codes get the fallback language's).
export const langMeta = (code) => LANGUAGE_META.find((l) => l.code === code) || LANGUAGE_META.find((l) => l.code === FALLBACK_LANGUAGE)

// Ready to use synchronously: the fallback, an already fetched language, or a code with no locale file (which
// can only ever answer in the fallback, so there is nothing to wait for).
export const isLocaleLoaded = (code) => !!DICTS[code] || !LOCALE_LOADERS[code]

// Hand a language's strings to the engine directly (tests, and hosts that bundle every locale).
export function registerLocale(code, dict) {
  if (code && dict && typeof dict === 'object') DICTS[code] = dict
}

// Fetch a language once. Resolves true when it can be used, false when the fetch failed (the caller falls back
// to English; a later call tries again).
const pending = {}
export function loadLocale(code) {
  if (isLocaleLoaded(code)) return Promise.resolve(true)
  if (!pending[code]) {
    pending[code] = Promise.resolve()
      .then(LOCALE_LOADERS[code])
      .then((m) => { registerLocale(code, m?.default || m); return isLocaleLoaded(code) })
      .catch(() => false)
      .finally(() => { delete pending[code] })
  }
  return pending[code]
}

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
