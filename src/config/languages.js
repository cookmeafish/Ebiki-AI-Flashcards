export const LANGS = [
  { code: 'auto', label: 'Detect Language' },
  { code: 'spa', label: 'Spanish' },
  { code: 'fra', label: 'French' },
  { code: 'deu', label: 'German' },
  { code: 'por', label: 'Portuguese' },
  { code: 'ita', label: 'Italian' },
  { code: 'jpn', label: 'Japanese' },
  { code: 'kor', label: 'Korean' },
  { code: 'chi_sim', label: 'Chinese (Simplified)' },
  { code: 'chi_tra', label: 'Chinese (Traditional)' },
  { code: 'rus', label: 'Russian' },
  { code: 'ara', label: 'Arabic' },
  { code: 'hin', label: 'Hindi' },
  { code: 'tha', label: 'Thai' },
  { code: 'vie', label: 'Vietnamese' },
  { code: 'pol', label: 'Polish' },
  { code: 'nld', label: 'Dutch' },
  { code: 'eng', label: 'English' },
]

// Other names a learner gives a language mode ("Mandarin Chinese", "Inglés", "日本語"). Only the full
// English label used to count, so a mode named "Chinese" or "Mandarin" (the label is "Chinese
// (Simplified)") or in the learner's own language was taught in the GLOBAL translation language.
// Data, not code: add a name here. Traditional-Chinese names are checked before the Simplified ones.
const LANG_ALIASES = [
  ['chi_tra', ['traditional chinese', 'cantonese', '繁體', '繁体', '粤语', '粵語', '廣東話']],
  ['chi_sim', ['chinese', 'mandarin', '中文', '汉语', '漢語', '普通话', '華語', '华语']],
  ['spa', ['español', 'espanol', 'castellano']],
  ['fra', ['français', 'francais']],
  ['deu', ['deutsch']],
  ['por', ['português', 'portugues']],
  ['ita', ['italiano']],
  ['jpn', ['日本語', 'nihongo']],
  ['kor', ['한국어', 'hangul']],
  ['rus', ['русский']],
  ['ara', ['العربية']],
  ['hin', ['हिन्दी', 'हिंदी']],
  ['tha', ['ไทย']],
  ['vie', ['tiếng việt', 'tieng viet']],
  ['pol', ['polski']],
  ['nld', ['nederlands']],
  ['eng', ['inglés', 'ingles', 'anglais', 'englisch', '英语', '英語', '영어']],
]
// "\\p" in the pattern STRING: a template literal turns "\p" into a plain "p", which made the boundary
// "[^p{L}]" ("perspanish" and "Spanishx" matched Spanish).
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const hasWord = (text, w) => (/^[\p{Script=Latin}\s]+$/u.test(w)
  ? new RegExp(`(^|[^\\p{L}])${escRe(w)}([^\\p{L}]|$)`, 'iu').test(text)
  : text.includes(w))

// Spoken languages that share a SCRIPT (and so an OCR code) with another language but not its sounds:
// "Cantonese" resolves to Chinese (Traditional) for text recognition, yet its audio and its name as a studied
// language must stay Cantonese (Mandarin recordings were embedded into Cantonese cards).
export const DISTINCT_SPOKEN = ['cantonese', '粤语', '粵語', '廣東話', '广东话', 'hokkien', 'taiwanese', 'shanghainese']
export const isDistinctSpoken = (name) => { const n = String(name || '').toLowerCase(); return DISTINCT_SPOKEN.some((w) => n.includes(w)) }

// The LANGS entry a free-text language or mode name refers to, or null.
export function langFromName(name) {
  const n = String(name || '').trim().toLowerCase()
  if (!n) return null
  const opts = LANGS.filter((l) => l.code !== 'auto')
  const exact = opts.find((l) => l.label.toLowerCase() === n)
  if (exact) return exact
  const byLabel = opts.find((l) => hasWord(n, l.label.toLowerCase()))
  if (byLabel) return byLabel
  for (const [code, names] of LANG_ALIASES) if (names.some((w) => hasWord(n, w))) return opts.find((l) => l.code === code) || null
  return null
}

// What a LANGS label is called in the app language, for SHOWING it only: the stored value stays the English label
// (prompts, OCR and saved settings read it). A Spanish screen listed "Spanish, French..." and said "Igual que
// Spanish". Only an exact label is renamed (a free-text name like "Spanish for travel" or "Cantonese" is shown as
// written); English, an unknown language or a runtime without Intl.DisplayNames keeps the label.
const LANG_BCP47 = { spa: 'es', fra: 'fr', deu: 'de', por: 'pt', ita: 'it', jpn: 'ja', kor: 'ko', chi_sim: 'zh-Hans', chi_tra: 'zh-Hant', rus: 'ru', ara: 'ar', hin: 'hi', tha: 'th', vie: 'vi', pol: 'pl', nld: 'nl', eng: 'en' }
const displayNamesCache = {}
export function langDisplayName(name, uiLang, { capitalize = false } = {}) {
  const raw = String(name || '').trim()
  const l = LANGS.find((x) => x.code !== 'auto' && x.label.toLowerCase() === raw.toLowerCase())
  if (!l || !uiLang || uiLang === 'en' || !LANG_BCP47[l.code]) return raw
  try {
    const dn = displayNamesCache[uiLang] || (displayNamesCache[uiLang] = new Intl.DisplayNames([uiLang], { type: 'language' }))
    const out = dn.of(LANG_BCP47[l.code])
    if (!out || out === LANG_BCP47[l.code]) return raw
    return capitalize ? out.charAt(0).toLocaleUpperCase(uiLang) + out.slice(1) : out
  } catch { return raw }
}
