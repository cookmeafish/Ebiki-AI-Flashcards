// Discover's duplicate check: is a suggested term already a card, known, skipped or carded? Pure, tested
// (dupes.test.js). App.jsx feeds it the deck's fronts and the ledger lists.
//
// Identity keeps ACCENTS (té is not te, papá is not papa) but folds case, Unicode form (NFC), runs of spaces
// (an NBSP from Anki's editor), the edge punctuation a phrase card carries ("¡Hola!", "¿Qué tal?"), a trailing
// "(part of speech)" and an audio embed. Slash fronts expand like answers do ("niño/a" is niño AND niña,
// "el/la estudiante" is el estudiante AND la estudiante): split on the bare slash, "niño/a" gave the key "a"
// and never "niña". A leading ARTICLE is optional on either side: a deck card "el perro" is the suggestion
// "perro" (language decks write nouns with their article; the old check compared whole strings and offered
// "perro" again).
import { expandSlashAnswers } from '../utils/answers'
import { LANGS, langFromName } from '../config/languages'

// Articles a noun card may lead with (data, per language, keyed by the LANGS code of src/config/languages.js).
// Deliberately NOT: "a"/"o" (Spanish and Portuguese prepositions, conjunctions, pronouns: "a menudo" is not "menudo")
// and Spanish "de" ("de nada" is not "nada"); Dutch "de" IS an article and is stripped only in a Dutch deck.
// Only the LEARNED language's articles are stripped: several of these are ordinary words elsewhere (English "as", "an"; "die", "den"), and in an English deck "as well" made "well" count as carded.
export const ARTICLES_BY_LANG = {
  eng: ['the', 'an'],
  spa: ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas'],
  fra: ['le', 'la', 'les', 'un', 'une', 'des'],
  ita: ['il', 'lo', 'la', 'gli', 'le', 'un', 'uno', 'una'],
  por: ['os', 'as', 'um', 'uma', 'uns', 'umas'],
  deu: ['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'eines'],
  nld: ['de', 'het', 'een'],
}
// The language is unknown: every language's articles, as before (no "a", "o" or "de": prepositions elsewhere).
const ALL_ARTICLES = new Set([
  'the', 'an', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'le', 'les', 'une', 'des', 'il', 'lo', 'gli',
  'uno', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'der', 'die', 'das', 'den', 'dem', 'ein', 'eine', 'einen', 'einem',
  'einer', 'het', 'een',
])
const ARTICLE_SETS = Object.fromEntries(Object.entries(ARTICLES_BY_LANG).map(([code, list]) => [code, new Set(list)]))
// Languages that elide an article onto the word (l'eau, l’amico, un'amica); unknown = allowed, as before.
const ELIDING = new Set(['fra', 'ita'])
// `lang`: a LANGS code ("spa") or a language / mode name ("Spanish", "Español"); anything else = unknown.
const langCode = (lang) => {
  const s = String(lang ?? '').trim()
  if (!s) return null
  if (ARTICLE_SETS[s] || LANGS.some((l) => l.code === s)) return s
  return langFromName(s)?.code || null
}
const articlesFor = (lang) => {
  const code = langCode(lang)
  if (!code) return { articles: ALL_ARTICLES, elides: true }
  return { articles: ARTICLE_SETS[code] || new Set(), elides: ELIDING.has(code) }
}
// Elided articles glued to the word: French/Italian l'eau, l’amico, un'amica.
const ELIDED = /^(?:l|un)['’](?=\p{L})/u

const EDGE = /^[\s"'“”‘’«»„‹›「」『』¿¡.,;:!?。、！？…·]+|[\s"'“”‘’«»„‹›「」『』¿¡.,;:!?。、！？…·]+$/gu

export const termFold = (s) => String(s ?? '').normalize('NFC').toLowerCase().replace(/\s+/g, ' ').replace(EDGE, '').trim()

// Every key a term is known by. `opts.lang` = the language the terms are written in (see articlesFor).
export function termKeys(term, { lang } = {}) {
  const raw = String(term ?? '').replace(/\[sound:[^\]]*\]/gi, '').replace(/\s*\([^)]*\)\s*$/, '').trim()
  const keys = new Set()
  if (!raw) return keys
  const { articles, elides } = articlesFor(lang)
  for (const form of expandSlashAnswers([raw])) {
    const k = termFold(form)
    if (!k) continue
    keys.add(k)
    const words = k.split(' ')
    if (words.length > 1 && articles.has(words[0])) keys.add(words.slice(1).join(' '))
    else if (elides && ELIDED.test(k)) keys.add(k.replace(ELIDED, ''))
  }
  return keys
}

// One set of keys for a whole list (deck fronts, a ledger list). Entries may be strings or {term}.
export function termIndex(list, into = new Set(), opts = {}) {
  for (const x of Array.isArray(list) ? list : []) {
    const t = x && typeof x === 'object' ? x.term : x
    for (const k of termKeys(t, opts)) into.add(k)
  }
  return into
}

// Is the term in the index?
export const termIn = (term, index, opts = {}) => {
  if (!index || typeof index.has !== 'function') return false
  for (const k of termKeys(term, opts)) if (index.has(k)) return true
  return false
}
