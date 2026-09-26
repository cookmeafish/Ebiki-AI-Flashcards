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
