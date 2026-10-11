// THE PREFIX HINT (pure, tested by prefixHint.test.js): the one hint a typed LANGUAGE question shows about its answer,
// for Study (utils/letterCue.js) and every fight or quiz (kit/fightSettings.js, QuizRunner, raids, Legends). It replaced
// the letter-count skeleton "(s·······)" (the owner, 2026-10-10: the first letter plus the length gave the answer away
// the moment the question was switched to its choices). Now:
//   - one word: its first ~20% of letters, at least 1, never leaving under 2 letters hidden: perro → "(p…)",
//     sombrero → "(so…)", pantalones → "(pa…)";
//   - several words: the first letter of EACH word: buenos días → "(b… d…)";
//   - the length is never shown (the "…" stands for any number of letters);
//   - an answer written in Han characters or kana gets none (its cue is the reading's first sound, which only the model
//     can write, as a quoted letter); a 1-letter answer gets none (the hint would be the answer).
// Only LANGUAGE modes (general modes are graded on understanding, answers in any language), only typed recall and
// fill-in questions, never an open tier, never a question answered with its choices.
export const HINT_MARK = '…'
const isLetter = (ch) => /\p{L}/u.test(ch)
const NO_HINT_SCRIPT = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u
export const fold = (s) => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').replace(/[’‘`]/g, "'").toLowerCase()
const lettersIn = (w) => [...String(w || '')].filter(isLetter).length
const firstLetter = (w) => [...String(w || '')].find(isLetter) || ''
const wordsOf = (a) => String(a || '').normalize('NFC').trim().split(/\s+/).filter((w) => lettersIn(w) > 0)

export const HINT_SHARE = 0.2
// How many letters of a one-word answer the hint shows.
export function prefixLen(letters, share = HINT_SHARE) {
  const n = Number(letters) || 0
  if (n < 2) return 0
  return Math.max(1, Math.min(Math.max(1, Math.round(n * share)), n - 2))
}
// The word's first `k` letters (from its first letter on; marks and inner punctuation kept as written).
export function prefixOf(word, k) {
  const chars = [...String(word || '').normalize('NFC')]
  const start = chars.findIndex(isLetter)
  if (start < 0 || k <= 0) return ''
  let out = ''
  let seen = 0
  for (const ch of chars.slice(start)) {
    if (isLetter(ch)) { if (seen >= k) break; seen++ }
    else if (seen >= k) break
    out += ch
  }
  return out
}
// An ELIDED article or preposition at a word's start ("l'eau", "d'accord", "qu'il", "dell'acqua"): the hint is about
// the word after it, so the elision is shown whole ("l'e…"). Longer leads ("aujourd'hui") are part of the word.
const ELISION = /^((?:\p{L}{1,2}|dell|dall|nell|sull|all|quell|bell)['’])(?=\p{L})/iu
export function splitElision(w) {
  const m = String(w || '').match(ELISION)
  return m ? [m[1], String(w).slice(m[1].length)] : ['', String(w || '')]
}
// A SHORT word inside a phrase ("a", "de", "la"): its letter would be the whole word, so it shows only "…".
export const SHORT_WORD = 2
// One word of a PHRASE as the hint shows it: an elision whole plus the next letter, a short word "…", else its
// first letter.
function phraseToken(w) {
  const [lead, rest] = splitElision(w)
  if (lead) return `${lead}${firstLetter(rest)}${HINT_MARK}`
  return lettersIn(w) <= SHORT_WORD ? HINT_MARK : `${firstLetter(w)}${HINT_MARK}`
}
// "(pa…)" / "(b… d…)" / "(… v…)" / "(l'e…)" / '' (see the header).
export function prefixHint(answer) {
  const words = wordsOf(answer)
  if (!words.length || words.some((w) => NO_HINT_SCRIPT.test(firstLetter(w)))) return ''
  if (words.length === 1) {
    const [lead, rest] = splitElision(words[0])
    const k = prefixLen(lettersIn(rest))
    if (lead) return lettersIn(rest) ? `(${lead}${k ? prefixOf(rest, k) : ''}${HINT_MARK})` : ''
    return k ? `(${prefixOf(words[0], k)}${HINT_MARK})` : ''
  }
  const tokens = words.map(phraseToken)
  return tokens.some((tk) => tk !== HINT_MARK) ? `(${tokens.join(' ')})` : ''
}
// The answer a hint is made from: the first accepted answer (the model lists its main answer first).
export function hintAnswer(accepted = []) {
  const list = (Array.isArray(accepted) ? accepted : [accepted]).map((a) => String(a ?? '').trim()).filter(Boolean)
  return list[0] || ''
}
export const canHint = (accepted) => !!prefixHint(hintAnswer(accepted))
// An answer only the model can cue (its reading's first sound): written in Han characters or kana.
export const needsReadingCue = (answer) => wordsOf(answer).some((w) => NO_HINT_SCRIPT.test(firstLetter(w)))
// The tokens a hint shows ("(b… d…)" → ['b', 'd']), folded for comparison.
// A short word's bare "…" stays as '' (any word fits it), so tokens and words line up one to one.
export const hintTokens = (hint) => String(hint || '').replace(/[()（）]/g, '').trim().split(/\s+/).filter((t) => t.length).map((t) => fold(t.replace(/…/g, '')))

// A hint in a text: "(" + 1 to 4 tokens each ending in "…" + ")". Tokens are short (a word's start), so ordinary
// parentheses ("(y así sucesivamente…)") are not read as one.
const TOKEN = `(?:[\\p{L}\\p{M}][^\\s()（）…]{0,14})?${HINT_MARK}`
const HINT_RE = new RegExp(`[(（]\\s*(${TOKEN}(?:\\s+${TOKEN}){0,3})\\s*[)）]`, 'gu')
// Does the text already show a hint for these answers (its first token starts one of their words)?
const answerWords = (accepted) => {
  const words = new Set()
  for (const a of accepted || []) for (const w of wordsOf(a)) words.add(fold(w).replace(/^[^\p{L}]+/u, ''))
  return words
}
// The group's first LETTERED token starts one of the answers' words (a group of bare "…" is never a hint).
const startsAnswer = (group, words) => {
  const first = hintTokens(group).find(Boolean)
  return !!first && [...words].some((w) => w.startsWith(first))
}
export function hasPrefixHint(text, accepted = []) {
  const words = answerWords(accepted)
  for (const m of String(text || '').matchAll(HINT_RE)) if (startsAnswer(m[1], words)) return true
  return false
}
// With the answers known, only a group whose first token starts one of their words goes ("(etc…)", "(bueno…)" in the
// question's own text stay); without them, every hint-shaped group goes.
export function stripPrefixHint(text, accepted = null) {
  const words = Array.isArray(accepted) && accepted.length ? answerWords(accepted) : null
  return String(text || '').replace(new RegExp(`\\s*${HINT_RE.source}`, 'gu'), (all, group) => ((words ? startsAnswer(group, words) : hintTokens(group).some(Boolean)) ? '' : all))
}

// The LEGACY letter-count skeleton ("(s·······)", "(e· ········)", Study's two-letter "(y·)" or "(y_)"), still in
// questions saved before the prefix hint: it shows the length, so it is always taken out. A single "." never counts
// ("(p.)" is an abbreviation).
const SKELETON_RE = /\s*[(（]\s*\p{L}(?:[·.]{2,}|·|_+)[^()（）]*[)）]/gu
export const stripCountSkeleton = (text) => String(text || '').replace(SKELETON_RE, '')
export const hasCountSkeleton = (text) => new RegExp(SKELETON_RE.source, 'u').test(String(text || ''))

// THE MODEL'S OWN LETTER CUES ("(to rain, "l")", '(sense; starts with "h")', 'It starts with "c".'): a quoted single
// letter. With `answers`, only a letter that starts one of them goes (any other quoted letter is the question's own
// text); without, every such cue goes. The sense cue stays.
export const CUE_QUOTES_PLAIN = '"«»‹›“”„「」『』'
export const CUE_APOS = "'`‘’‚"
const LQ = `${CUE_QUOTES_PLAIN}${CUE_APOS}`
const LETTER_CLAUSE = new RegExp(`\\s*[;,，；]\\s*[^;,，；()（）]*?[${LQ}]\\s*(\\p{L})\\s*[${LQ}][^;,，；()（）]*(?=[)）])`, 'gu')
const LETTER_PAREN = new RegExp(`\\s*[(（][^()（）]*?[${LQ}]\\s*(\\p{L})\\s*[${LQ}][^()（）]*[)）]`, 'gu')
// A cue written as its OWN sentence after the question, never the first sentence (a quoted "I" in 'Listen. How do you
// say "I"?' is the subject, not a cue), and only with answers.
const LETTER_SENTENCE = new RegExp(`([.?!。？！][${CUE_QUOTES_PLAIN}’]*\\s*)(?![${LQ}])([^.?!。？！()（）_\\n]{0,60}?[${LQ}]\\s*(\\p{L})\\s*[${LQ}][^.?!。？！()（）_\\n]{0,40}?(?:[.?!。？！]|$))`, 'gu')
export const answerInitials = (answers = []) => {
  const set = new Set()
  for (const a of answers || []) for (const w of String(a ?? '').split(/[\s/'’]+/)) { const c = firstLetter(w); if (c) set.add(fold(c)) }
  return set
}
export function stripQuotedLetterCues(text, answers = null) {
  const firsts = Array.isArray(answers) && answers.length ? answerInitials(answers) : null
  const hit = (letter) => !firsts || firsts.has(fold(letter))
  let out = String(text || '')
    .replace(LETTER_CLAUSE, (all, letter) => (hit(letter) ? '' : all))
    .replace(LETTER_PAREN, (all, letter) => (hit(letter) ? '' : all))
  if (firsts && firsts.size) {
    const cut = out.replace(LETTER_SENTENCE, (all, lead, _s, letter) => (firsts.has(fold(letter)) ? lead.trimEnd() : all)).trimEnd()
    if (cut.trim()) out = cut
  }
  return out
}

// Where a hint goes: right after the first blank, else before the closing punctuation.
export function insertHint(text, hint) {
  const s = String(text || '')
  if (!hint) return s
  if (/_{2,}/.test(s)) return s.replace(/_{2,}/, (m) => `${m} ${hint}`)
  const t = s.trimEnd()
  const m = t.match(/([?？!！.。]+)$/u)
  return m ? `${t.slice(0, t.length - m[1].length).trimEnd()} ${hint}${m[1]}` : `${t} ${hint}`
}

// THE TYPED PROMPT of a language question: every letter-count skeleton and quoted first-letter cue out, the prefix hint
// in (once). Idempotent. No hint possible (Han, kana, a 1-letter answer): only the skeleton goes, the model's reading
// cue stays. Not a language question, or an open one: unchanged.
export function typedPrompt(text, accepted = [], { isLanguage = false, open = false } = {}) {
  const s = String(text ?? '')
  if (!isLanguage || open) return s
  const hint = prefixHint(hintAnswer(accepted))
  const base = stripCountSkeleton(s)
  if (!hint) return base
  const clean = stripQuotedLetterCues(stripPrefixHint(base, accepted), accepted)
  const out = insertHint(clean, hint)
  return out === s ? s : out
}
// The question as shown with its CHOICES: no hint of any kind (its letters would pick the tile).
export function choicePromptText(text, answers = null) {
  return stripQuotedLetterCues(stripPrefixHint(stripCountSkeleton(text), answers), answers)
}

// A LONGER prefix, for a hint asked for after a miss (Study's retry hint) or bought (a raid's Hint power): each word's
// first `share` of letters, at least one more than the prefix hint shows, never the whole word ("pantalones" at 0.4 →
// "pant…", "buenos días" at 0.5 → "bue… dí…"). '' when it could show nothing new. No dots: the length stays hidden.
export function longerPrefix(answer, share = 0.4) {
  const words = wordsOf(answer)
  if (!words.length || words.some((w) => NO_HINT_SCRIPT.test(firstLetter(w)))) return ''
  let more = false
  const out = words.map((w0) => {
    const [lead, w] = splitElision(w0)
    const n = lettersIn(w)
    if (!lead && words.length > 1 && n <= SHORT_WORD) return HINT_MARK // a short word stays hidden (its letters are all of it)
    const shown = words.length === 1 ? (lead ? Math.min(1, prefixLen(n)) : prefixLen(n)) : Math.min(1, n)
    const k = Math.min(n - 1, Math.max(shown + 1, Math.round(n * share)))
    if (k > shown) more = true
    if (n < 2 || k < 1) return `${lead}${lead ? (n ? prefixOf(w, Math.max(shown, 0)) : '') : w}${lead ? HINT_MARK : ''}`
    return `${lead}${prefixOf(w, k)}${HINT_MARK}`
  })
  return more ? out.join(' ') : ''
}
