// THE LIST OF APP LANGUAGES. Every UI string lives in ./locales/<code>.js (one file per language, app and
// features alike). To add a language: copy locales/en.js to locales/<code>.js, translate the values (keep the
// keys and every {placeholder}), import it below and add one entry. Nothing else in the app names languages:
// pickers, prompts ("explain in Spanish") and picture reading all read this list.
//   code        ISO 639-1; also the locale file name
//   label       the language's own name, shown in the language pickers
//   name        its English name, used inside AI prompts
//   pickerName  the same language in the study-language list (src/config/languages.js labels)
//   ocr         Tesseract code for reading pictures in this language
import en from './locales/en.js'
import es from './locales/es.js'
import zh from './locales/zh.js'
import ja from './locales/ja.js'

export const LANGUAGES = [
  { code: 'en', label: 'English', name: 'English', pickerName: 'English', ocr: 'eng', strings: en },
  { code: 'es', label: 'Español', name: 'Spanish', pickerName: 'Spanish', ocr: 'spa', strings: es },
  { code: 'zh', label: '中文 (简体)', name: 'Chinese', pickerName: 'Chinese (Simplified)', ocr: 'chi_sim', strings: zh },
  { code: 'ja', label: '日本語', name: 'Japanese', pickerName: 'Japanese', ocr: 'jpn', strings: ja },
]

export const FALLBACK_LANGUAGE = 'en' // missing keys fall back to this language, then to the key itself
