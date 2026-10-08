// THE LIST OF APP LANGUAGES, without their strings. The app loads only the language in use (plus English, the
// fallback) at run time, so the other locale files stay out of the startup bundle; ./languages.js joins this
// list with every locale's strings for tests and the launcher-strings build.
// To add a language: copy locales/en.js to locales/<code>.js and translate the values (keep the keys and every
// {placeholder}), then add one entry below, one loader in LOCALE_LOADERS and one import in ./languages.js.
// Nothing else in the app names languages: pickers, prompts ("explain in Spanish") and picture reading all read
// this list.
//   code        ISO 639-1; also the locale file name
//   label       the language's own name, shown in the language pickers
//   name        its English name, used inside AI prompts
//   pickerName  the same language in the study-language list (src/config/languages.js labels)
//   ocr         Tesseract code for reading pictures in this language
export const LANGUAGE_META = [
  { code: 'en', label: 'English', name: 'English', pickerName: 'English', ocr: 'eng' },
  { code: 'es', label: 'Español', name: 'Spanish', pickerName: 'Spanish', ocr: 'spa' },
  { code: 'zh', label: '中文 (简体)', name: 'Chinese', pickerName: 'Chinese (Simplified)', ocr: 'chi_sim' },
  { code: 'ja', label: '日本語', name: 'Japanese', pickerName: 'Japanese', ocr: 'jpn' },
]

export const FALLBACK_LANGUAGE = 'en' // missing keys fall back to this language, then to the key itself

// Every language except the fallback (which ./index.js imports up front), fetched on first use.
export const LOCALE_LOADERS = {
  es: () => import('./locales/es.js'),
  zh: () => import('./locales/zh.js'),
  ja: () => import('./locales/ja.js'),
}
