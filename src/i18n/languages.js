// EVERY APP LANGUAGE WITH ALL ITS STRINGS, for tests and the launcher-strings build (Node). The app itself does
// NOT import this file: it reads the list from ./catalog.js and loads one locale at a time (./index.js), so the
// unused languages stay out of the startup bundle. The list (code, label, name, pickerName, ocr) lives in
// ./catalog.js; adding a language = a catalog entry + a loader there + one import and one STRINGS entry here.
import en from './locales/en.js'
import es from './locales/es.js'
import zh from './locales/zh.js'
import ja from './locales/ja.js'
import { LANGUAGE_META, FALLBACK_LANGUAGE } from './catalog.js'

const STRINGS = { en, es, zh, ja }

export const LANGUAGES = LANGUAGE_META.map((l) => ({ ...l, strings: STRINGS[l.code] }))

export { FALLBACK_LANGUAGE }
