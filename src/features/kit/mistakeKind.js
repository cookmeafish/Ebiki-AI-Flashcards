// WHAT KIND OF MISTAKE IS IT? (pure, tested) A code check made BEFORE a feedback note or a boss taunt is written.
// Judging real generated lines (2026-11-16) found a wrong verb FORM ("I hurt" for "it hurts") explained to the learner
// as a different word that happens to be spelled the same (a noun): a wrong fact, shown as teaching. A model reads the
// learner's answer cold; code can see that it shares its stem with the expected answer, and say so in the prompt.
// Language modes only (a general mode's answers are terms, not inflected forms).
import { stripAccents } from './grade'

const fold = (s) => stripAccents(String(s ?? '').trim().toLowerCase()).normalize('NFC')
const oneWord = (s) => /^[\p{L}\p{M}'’-]+$/u.test(s)
export const STEM_MIN = 3 // letters two forms must share from the start
export const STEM_SHARE = 0.6 // ...and that share of the shorter word
export const LENGTH_GAP_MAX = 3

// The stem two single words share when one looks like another FORM of the other, or ''.
export function sharedStem(answer, expected) {
  const a = fold(answer), b = fold(expected)
  if (!a || !b || a === b || !oneWord(a) || !oneWord(b)) return ''
  if (Math.abs(a.length - b.length) > LENGTH_GAP_MAX) return ''
  let p = 0
  while (p < a.length && p < b.length && a[p] === b[p]) p++
  return p >= STEM_MIN && p >= Math.ceil(STEM_SHARE * Math.min(a.length, b.length)) ? a.slice(0, p) : ''
}

// → { expected, stem } for the first accepted answer the learner's answer looks like a form of, or null.
export function formMistake(answer, accepted = []) {
  for (const x of Array.isArray(accepted) ? accepted : [accepted]) {
    const stem = sharedStem(answer, x)
    if (stem) return { expected: String(x).trim(), stem }
  }
  return null
}

// The prompt line for the writer of a note or a taunt ('' when nothing was found).
export function mistakeKindLine(answer, accepted = [], { isLanguage = false } = {}) {
  if (!isLanguage) return ''
  const hit = formMistake(answer, accepted)
  if (!hit) return ''
  return `CODE CHECK: the learner's answer "${String(answer).trim()}" and the right answer "${hit.expected}" share the stem "${hit.stem}". This is most likely the RIGHT WORD IN THE WRONG FORM (another ending: person, tense, number or gender). Check that first. If so, say it is the wrong form and which form was needed, and do NOT explain "${String(answer).trim()}" as a different word with another meaning, even if such a word exists.`
}
