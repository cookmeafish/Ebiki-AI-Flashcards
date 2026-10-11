import { longerPrefix, hintAnswer, fold } from './prefixHint'

// THE RETRY HINTS (after a wrong typed answer; pure, tested). The letter COUNT is gone (the owner, 2026-10-10: a length
// gives the answer away once the question shows its choices; utils/prefixHint.js), so a miss reveals, in order:
//   1. a LONGER prefix of the answer ("pant…" for pantalones; never its length, never the whole word),
//   2. the model's own clue about the meaning or context (hint1/hint2), when it is one: a count ("8 letters", "Tiene 5
//      letras") or a first-letter cue ('starts with "s"': the prefix hint already shows more) is no clue and is dropped.
// → [{ kind: 'prefix', prefix } | { kind: 'clue', text }], at most 2.
const QUOTED_ONE = /["'“”‘’«»‹›„「」『』]\s*\p{L}\s*["'“”‘’«»‹›„「」『』]/u
const isCountHint = (h) => /\d/.test(h) && h.replace(/\d+/g, '').replace(/[\s/,.()]+/g, '').length <= 20
const isLetterHint = (h) => QUOTED_ONE.test(h) || /\bstarts?\s+with\s+\S{1,3}\s*$/i.test(h)
// `noPrefix`: the question shows no prefix hint (its options could not keep to one), so a retry hint shows no letters
// either (the options would give the answer away after it).
export function retryHints({ hint1 = null, hint2 = null, accepted = [], noPrefix = false } = {}) {
  const out = []
  const longer = noPrefix ? '' : longerPrefix(hintAnswer(accepted))
  if (longer) out.push({ kind: 'prefix', prefix: longer })
  const clue = [hint1, hint2].map((h) => (typeof h === 'string' ? h.trim() : '')).find((h) => h && !isCountHint(h) && !isLetterHint(h))
  if (clue) out.push({ kind: 'clue', text: clue })
  return out.slice(0, 2)
}
// Does a typed answer already start the way a prefix hint shows (so showing it would teach nothing)?
// Every token of the prefix ("… ve…": a short word's bare "…" fits anything) against the answer's words in order.
export const answerShowsPrefix = (answer, prefix) => {
  const toks = String(prefix || '').trim().split(/\s+/).filter(Boolean).map((t) => fold(t.replace(/…/g, '')))
  if (!toks.some(Boolean)) return false
  const ws = fold(String(answer || '').trim()).split(/\s+/).filter(Boolean)
  if (toks.length === 1) return !!ws.length && fold(String(answer || '').trim()).startsWith(toks[0])
  return ws.length >= toks.length && toks.every((t, i) => ws[i].startsWith(t))
}
