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

// Articles a noun card may lead with (data, per language). Deliberately NOT: Spanish "a"/"o" and Dutch/Spanish
// "de" (prepositions and conjunctions: "a menudo" and "de nada" are not "menudo" and "nada").
const ARTICLES = new Set([
  'the', 'an', // English
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', // Spanish
  'le', 'les', 'une', 'des', // French
  'il', 'lo', 'gli', 'uno', // Italian
  'os', 'as', 'um', 'uma', 'uns', 'umas', // Portuguese
  'der', 'die', 'das', 'den', 'dem', 'ein', 'eine', 'einen', 'einem', 'einer', // German
  'het', 'een', // Dutch
])
// Elided articles glued to the word: French/Italian l'eau, l’amico, un'amica.
const ELIDED = /^(?:l|un)['’](?=\p{L})/u

const EDGE = /^[\s"'“”‘’«»„‹›「」『』¿¡.,;:!?。、！？…·]+|[\s"'“”‘’«»„‹›「」『』¿¡.,;:!?。、！？…·]+$/gu

export const termFold = (s) => String(s ?? '').normalize('NFC').toLowerCase().replace(/\s+/g, ' ').replace(EDGE, '').trim()

// Every key a term is known by.
export function termKeys(term) {
  const raw = String(term ?? '').replace(/\[sound:[^\]]*\]/gi, '').replace(/\s*\([^)]*\)\s*$/, '').trim()
  const keys = new Set()
  if (!raw) return keys
  for (const form of expandSlashAnswers([raw])) {
    const k = termFold(form)
    if (!k) continue
    keys.add(k)
    const words = k.split(' ')
    if (words.length > 1 && ARTICLES.has(words[0])) keys.add(words.slice(1).join(' '))
    else if (ELIDED.test(k)) keys.add(k.replace(ELIDED, ''))
  }
  return keys
}

// One set of keys for a whole list (deck fronts, a ledger list). Entries may be strings or {term}.
export function termIndex(list, into = new Set()) {
  for (const x of Array.isArray(list) ? list : []) {
    const t = x && typeof x === 'object' ? x.term : x
    for (const k of termKeys(t)) into.add(k)
  }
  return into
}

// Is the term in the index?
export const termIn = (term, index) => {
  if (!index || typeof index.has !== 'function') return false
  for (const k of termKeys(term)) if (index.has(k)) return true
  return false
}
