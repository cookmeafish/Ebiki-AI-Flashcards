// Tap-to-look-up tokens (pure, tested: tapTokens.test.js). Shared by Study (App.jsx) and every feature surface that
// renders tappable text through ctx.words (fights, quizzes, Learn it).
// Whitespace splits most scripts, but some are written WITHOUT spaces (Chinese, Japanese, Thai, Lao, Khmer, Myanmar):
// a whole sentence used to be one tap target. Those runs go through the browser's word segmenter; without one, a Han
// or kana run falls back to one character per token (one Han character is a word), other no-space scripts stay whole.
// Combining marks (\p{M}) are part of a word: stripping them cut Hindi vowel signs off ("नमस्ते" became "नमस्त").
// Korean writes spaces but attaches particles (학교에): the whole token is tapped, and the lookup explains stem + particle.
// DATA, never `if (lang === ...)`: add a script to the tables below.
import { langFromName, isDistinctSpoken } from '../config/languages'

// Scripts written without spaces between words.
export const NO_SPACE_SCRIPTS = ['Han', 'Hiragana', 'Katakana', 'Thai', 'Lao', 'Khmer', 'Myanmar']
// Of those, the ones where a single character is a usable fallback token when no segmenter exists.
export const CHAR_FALLBACK_SCRIPTS = ['Han', 'Hiragana', 'Katakana']
const scriptRe = (list) => new RegExp(`[${list.map((s) => `\\p{Script=${s}}`).join('')}]`, 'u')
export const TAP_NO_SPACE = scriptRe(NO_SPACE_SCRIPTS)
const CHAR_FALLBACK = scriptRe(CHAR_FALLBACK_SCRIPTS)

const defaultSegmenter = () => ((typeof Intl !== 'undefined' && Intl.Segmenter) ? new Intl.Segmenter(undefined, { granularity: 'word' }) : null)
const SEGMENTER = defaultSegmenter()

// text → tokens (whitespace kept as its own tokens, so joining them gives the text back).
// `segmenter`: injectable for tests (null = no Intl.Segmenter).
export function splitTapTokens(text, segmenter = SEGMENTER) {
  return String(text ?? '').split(/(\s+)/).flatMap((tok) => {
    if (!tok || !TAP_NO_SPACE.test(tok)) return [tok]
    if (segmenter) return [...segmenter.segment(tok)].map((x) => x.segment)
    // No segmenter: Han/kana one character at a time (punctuation and other letters stay grouped).
    if (!CHAR_FALLBACK.test(tok)) return [tok]
    const out = []
    let run = ''
    for (const ch of tok) {
      if (CHAR_FALLBACK.test(ch)) { if (run) out.push(run); run = ''; out.push(ch) } else run += ch
    }
    if (run) out.push(run)
    return out
  })
}
// A token without the punctuation around it.
export const tapClean = (tok) => String(tok).replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu, '')
// Worth a lookup: one character in a no-space script is a word; elsewhere 2+ characters.
export const tapLongEnough = (clean) => [...String(clean || '')].length >= (TAP_NO_SPACE.test(clean) ? 1 : 2)

// Two language names for the same language ("Spanish" / "español" / "Spanish (Mexico)"). Spoken varieties that
// share a script (Cantonese) stay themselves.
const langKey = (name) => {
  const n = String(name || '').trim().toLowerCase()
  if (!n) return ''
  if (isDistinctSpoken(n)) return n
  return langFromName(n)?.code || n
}
export const sameLanguage = (a, b) => !!langKey(a) && langKey(a) === langKey(b)

// May a word of this text be tapped for a lookup? Language modes: always (questions mix the learned language with the
// one Ebi speaks). Any other mode: only when the text is in a language other than the app language (a CompTIA fight in
// Japanese for an English speaker); in the app language there is nothing to look up.
export const tapAllowed = ({ isLanguage = false, textLang = '', appLang = '' } = {}) => !!isLanguage || (!!textLang && !sameLanguage(textLang, appLang))

// "(...)" sense cues inside a question: [{ text, cue }] (a cue is a hint, rendered muted, never the sentence).
export const splitCueParts = (s) => String(s ?? '').split(/(\([^)]*\)|（[^）]*）)/).filter((p) => p !== '').map((p) => ({ text: p, cue: /^(\([^)]*\)|（[^）]*）)$/.test(p) }))
