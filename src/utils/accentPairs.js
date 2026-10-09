// Accent twins: an accented word whose spelling WITHOUT the accent is a different, common word of the same language
// (Spanish él "he" / el "the", más / mas, está / esta; French où / ou; Portuguese é / e). Pure data + one check,
// tested (accentPairs.test.js). Keyed by the LANGS code of src/config/languages.js; add words here, never a
// language branch in code.
//
// The Study accent drill uses it: inside a longer answer, an unaccented twin is the OTHER word used correctly ("el
// perro" on a card for "él"), never a slip of the target, so it must not ask for a retype. Typed as the whole answer
// it still drills (the learner answered the target itself).
export const ACCENT_TWINS = {
  spa: ['el', 'tu', 'mi', 'te', 'se', 'si', 'de', 'mas', 'aun', 'que', 'como', 'donde', 'adonde', 'cuando', 'quien', 'quienes',
    'cual', 'cuales', 'cuanto', 'cuanta', 'cuantos', 'cuantas', 'esta', 'este', 'estas', 'estos', 'esa', 'ese', 'esas', 'esos',
    'aquel', 'aquella', 'solo', 'o', 'porque', 'papa', 'ingles', 'hacia', 'sabia', 'continuo', 'practico', 'publico',
    'termino', 'animo', 'ultimo', 'estan', 'habia', 'tenia', 'seria', 'vario', 'envio', 'rio', 'rie'],
  fra: ['a', 'ou', 'la', 'du', 'sur', 'des', 'mur', 'cote', 'tache', 'jeune', 'pecher', 'peche', 'marche', 'eleve', 'age',
    'mais', 'notre', 'votre', 'roder'],
  por: ['e', 'esta', 'pais', 'nos', 'por', 'pode', 'avo', 'da', 'de', 'se', 'so', 'pe', 'para', 'pelo', 'pela', 'pois',
    'ha', 'as', 'a', 'sabia', 'secretaria', 'publico', 'pratica', 'ultimo', 'tem', 'vem', 'estas'],
  ita: ['e', 'la', 'li', 'si', 'se', 'ne', 'da', 'di', 'te', 'principi', 'subito', 'ancora', 'papa', 'meta', 'pero', 'cioe'],
}
const SETS = Object.fromEntries(Object.entries(ACCENT_TWINS).map(([code, list]) => [code, new Set(list)]))
const ANY = new Set(Object.values(ACCENT_TWINS).flat())

const fold = (s) => String(s ?? '').normalize('NFC').toLowerCase().trim()
const bare = (s) => fold(s).normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC')

// Is `word` (one word, accented) an accent twin in `lang` (a LANGS code; unknown = any listed language)?
export function isAccentTwin(word, lang) {
  const w = fold(word)
  if (!w || /\s/.test(w)) return false
  const b = bare(w)
  if (b === w) return false // no accent: nothing to twin with
  const set = (lang && SETS[lang]) || (lang ? null : ANY)
  return !!set && set.has(b)
}
