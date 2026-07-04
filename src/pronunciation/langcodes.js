// Language code data for the pronunciation system. Pure DATA, not branching —
// per the design rule, any per-language tuning lives in config/data tables.
// Keys are the English labels used across the app (LANGS labels, studyRules.studyLanguage).
export const LANG_CODES = {
  'Spanish':               { iso1: 'es', iso3: ['spa'], bcp47: 'es' },
  'French':                { iso1: 'fr', iso3: ['fra', 'fre'], bcp47: 'fr' },
  'German':                { iso1: 'de', iso3: ['deu', 'ger'], bcp47: 'de' },
  'Portuguese':            { iso1: 'pt', iso3: ['por'], bcp47: 'pt' },
  'Italian':               { iso1: 'it', iso3: ['ita'], bcp47: 'it' },
  'Japanese':              { iso1: 'ja', iso3: ['jpn'], bcp47: 'ja' },
  'Korean':                { iso1: 'ko', iso3: ['kor'], bcp47: 'ko' },
  'Chinese':               { iso1: 'zh', iso3: ['cmn', 'zho'], bcp47: 'zh' },
  'Chinese (Simplified)':  { iso1: 'zh', iso3: ['cmn', 'zho'], bcp47: 'zh-CN' },
  'Chinese (Traditional)': { iso1: 'zh', iso3: ['cmn', 'zho'], bcp47: 'zh-TW' },
  'Russian':               { iso1: 'ru', iso3: ['rus'], bcp47: 'ru' },
  'Arabic':                { iso1: 'ar', iso3: ['ara'], bcp47: 'ar' },
  'Hindi':                 { iso1: 'hi', iso3: ['hin'], bcp47: 'hi' },
  'Thai':                  { iso1: 'th', iso3: ['tha'], bcp47: 'th' },
  'Vietnamese':            { iso1: 'vi', iso3: ['vie'], bcp47: 'vi' },
  'Polish':                { iso1: 'pl', iso3: ['pol'], bcp47: 'pl' },
  'Dutch':                 { iso1: 'nl', iso3: ['nld', 'dut'], bcp47: 'nl' },
  'English':               { iso1: 'en', iso3: ['eng'], bcp47: 'en' },
  'Catalan':               { iso1: 'ca', iso3: ['cat'], bcp47: 'ca' },
  'Swedish':               { iso1: 'sv', iso3: ['swe'], bcp47: 'sv' },
  'Norwegian':             { iso1: 'no', iso3: ['nor', 'nob'], bcp47: 'no' },
  'Danish':                { iso1: 'da', iso3: ['dan'], bcp47: 'da' },
  'Finnish':               { iso1: 'fi', iso3: ['fin'], bcp47: 'fi' },
  'Czech':                 { iso1: 'cs', iso3: ['ces', 'cze'], bcp47: 'cs' },
  'Greek':                 { iso1: 'el', iso3: ['ell', 'gre'], bcp47: 'el' },
  'Hebrew':                { iso1: 'he', iso3: ['heb'], bcp47: 'he' },
  'Turkish':               { iso1: 'tr', iso3: ['tur'], bcp47: 'tr' },
  'Ukrainian':             { iso1: 'uk', iso3: ['ukr'], bcp47: 'uk' },
  'Indonesian':            { iso1: 'id', iso3: ['ind'], bcp47: 'id' },
}

// Every ISO-639-1 code we know about — used ONLY to reject a candidate audio file whose
// filename prefix identifies a DIFFERENT language (e.g. "Nl-hola.ogg" when Spanish was asked).
// A prefix that isn't a known language code is left alone (never reject on a guess).
export const KNOWN_ISO1 = new Set(Object.values(LANG_CODES).map((l) => l.iso1))
export const KNOWN_ISO3 = new Set(Object.values(LANG_CODES).flatMap((l) => l.iso3))

// Resolve a language given an app label ('Spanish'), a LANGS/Tesseract code ('spa',
// 'chi_sim'), or a bare ISO-639-1 code ('es'). Returns { iso1, iso3:[…], bcp47 } or null.
export function langInfo(labelOrCode) {
  if (!labelOrCode) return null
  const s = String(labelOrCode).trim()
  if (LANG_CODES[s]) return LANG_CODES[s]
  const lower = s.toLowerCase()
  for (const [label, info] of Object.entries(LANG_CODES)) {
    if (label.toLowerCase() === lower) return info
    if (info.iso1 === lower) return info
    if (info.iso3.includes(lower)) return info
  }
  if (lower.startsWith('chi_')) return LANG_CODES['Chinese']
  return null
}
