// Conjugation drill helpers (pure: no React, no app state). App.jsx imports them.

// SUBJECT pronouns that may lead an expected conjugated form. The question already names the subject
// ("yo, present: hablar"), so a typed "hablo" is the drilled form even when the model listed "yo hablo".
// Data, not `if (lang === ...)`: one table across languages. OBJECT and reflexive pronouns ("lo hablo",
// "me levanto") are NOT here: they are part of the form being drilled.
export const SUBJECT_PRONOUNS = new Set([
  // Spanish
  'yo', 'tú', 'tu', 'vos', 'él', 'ella', 'usted', 'nosotros', 'nosotras', 'vosotros', 'vosotras', 'ellos', 'ellas', 'ustedes',
  // French (je/j' handled below as well)
  'je', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles',
  // Italian
  'io', 'lui', 'lei', 'noi', 'voi', 'loro',
  // Portuguese
  'eu', 'você', 'ele', 'nós', 'vós', 'vocês', 'eles', 'elas',
  // German
  'ich', 'du', 'er', 'sie', 'wir', 'ihr', // not 'es': a Spanish form ('es') would lose its verb
  // Catalan
  'jo', 'vosaltres', 'nosaltres', 'ells', 'elles',
])

// The expected form without a leading subject pronoun, or null when it has none (or nothing would be left).
// Runs on the RAW text: the matcher's normalize drops apostrophes, so French "j'aime" must lose "j'" first.
export const withoutSubjectPronoun = (expected) => {
  const s = String(expected ?? '').normalize('NFC').trim()
  const elided = s.match(/^(?:j|t)['’ʼ]\s*(\S.*)$/i)
  if (elided) return elided[1]
  const m = s.match(/^(\S+)\s+(\S.*)$/u)
  if (!m) return null
  return SUBJECT_PRONOUNS.has(m[1].toLowerCase()) ? m[2] : null
}

// A model's yes/no for "fromDeck" (it sends "false" as a string, which is truthy).
const flag = (v) => v === true || v === 1 || /^(true|yes|1)$/i.test(String(v ?? '').trim())

// Fold for duplicate checks only (never for matching answers: the accent is the test there).
export const foldWord = (w) => String(w ?? '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').trim()

// The headword of a deck front, as the fallback pool reads it: "(notes)" dropped, the first "/" form.
export const frontHeadword = (f) => String(f ?? '').replace(/\([^)]*\)/g, ' ').split('/')[0].replace(/\s+/g, ' ').trim()

// The word list from the model's pool reply. One entry per verb (folded), the deck's copy preferred. `fromDeck`
// is the model's claim OR'd with a match against the deck's own headwords: a deck verb the model marked
// "false" (or the string "false") got an Add-to-Anki button and was added to the deck a second time.
export const shapeConjugationPool = (parsed, deckFronts = [], { cardText = (v) => (typeof v === 'string' ? v : String(v ?? '')) } = {}) => {
  const deckKeys = new Set((Array.isArray(deckFronts) ? deckFronts : []).map((f) => foldWord(frontHeadword(f))).filter(Boolean))
  const byKey = new Map()
  for (const w of (Array.isArray(parsed?.words) ? parsed.words : [])) {
    if (!w || typeof w.word !== 'string' || !w.word.trim()) continue
    const word = w.word.trim()
    const k = foldWord(word)
    if (!k) continue
    const fromDeck = flag(w.fromDeck) || deckKeys.has(k)
    const prev = byKey.get(k)
    if (!prev || (fromDeck && !prev.fromDeck)) byKey.set(k, { word, meaning: cardText(w.meaning), fromDeck })
  }
  return [...byKey.values()]
}

// The deck's own fronts as a pool (headwords only, once each), when the model gave nothing usable.
export const fallbackConjugationPool = (deckFronts = [], max = 20) => {
  const seen = new Set()
  const out = []
  for (const f of (Array.isArray(deckFronts) ? deckFronts : [])) {
    const w = frontHeadword(f)
    const k = w.toLowerCase().normalize('NFC')
    if (!w || seen.has(k)) continue
    seen.add(k); out.push({ word: w, meaning: '', fromDeck: true })
    if (out.length >= max) break
  }
  return out
}
