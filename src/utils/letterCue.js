// The first-letter cue guarantee for typed language questions.
// Moved verbatim out of App.jsx (pure: no React, no app state) so they can be tested; App imports them back.
import { ensureLetterCue, stripLetterSkeleton } from '../features/kit/fightSettings'

// ── First-letter cue guarantee (LANGUAGE-AGNOSTIC) ────────────────────────────────────────────
// A typed translation / fill-in-the-blank is only fair if the student can tell WHICH word is
// wanted — "hat" is sombrero OR gorra, "run" is correr OR huir. The generator is told to ALWAYS
// pin the target with a parenthetical cue that carries the answer's first letter, phrased in
// whatever language Ebi speaks. These are the deterministic safety net around the prompt, working
// for ANY learned language + ANY Ebi-speaks language:
//   • hasLetterCue  — detect a first-letter cue already present. Language-neutral: a single letter
//     inside quotes ('…"s"…', '…«s»…', '…「や」…') OR a letter-skeleton ("s···"). Covers the way the
//     model writes the cue in every language (the letter is always quoted), not English phrases.
//   • appendLetterCue — last resort: append a letter skeleton (first letter + a dot per remaining
//     letter), which needs NO natural language, so it is correct regardless of script/tongue.
// Apostrophe-type quotes are also contraction marks ("I'm", "don't", "What's 'umbrella'"), which
// read as a quoted letter and switched the cue guarantee OFF. For those, the quote must not touch a
// letter on the outside; the other quote kinds keep the plain rule (「ぼ」で has a letter after 」).
export const CUE_QUOTES_PLAIN = '"«»‹›“”„「」『』' // „S“ (German, Polish, Czech) too: missed, every such card was regenerated
export const CUE_APOS = "'`‘’‚"
// Each alternative captures the cue's letter, so the cue is checked against the ANSWER: a quoted
// one-character meaning (Chinese “雨”) or a kana before a blank (公園で___) looked like a cue, and so
// did a cue naming the wrong letter; all three shipped the question with no real cue.
// A 2-letter answer's skeleton has ONE dot ("(y·)"): recognized only inside brackets (Catalan "col·lecció" is
// text), else a recheck missed it and appended a second cue.
export const letterCueRe = new RegExp(`[${CUE_QUOTES_PLAIN}]\\s*(\\p{L})\\s*[${CUE_QUOTES_PLAIN}]|(?<![\\p{Lu}\\p{Ll}])[${CUE_APOS}]\\s*(\\p{L})\\s*[${CUE_APOS}](?![\\p{Lu}\\p{Ll}])|(\\p{L})[·_]{2,}|[(（]\\s*(\\p{L})[·_]\\s*[)）]`, 'gu')
export const cueFold = (c) => String(c || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
export const cueAnswers = (q) => (q.acceptedAnswers || []).map((x) => String(x).trim()).filter(Boolean)
// A cue counts only when its letter starts an accepted answer (or one of its words: "el sombrero").
export const hasLetterCue = (q) => {
  const firsts = new Set()
  // Apostrophes split too: in "l'arbre" the cue names the a, not the l.
  for (const a of cueAnswers(q)) for (const w of a.split(/[\s/'’]+/)) { const c = [...w].find((ch) => /\p{L}/u.test(ch)); if (c) firsts.add(cueFold(c)) }
  // A kanji answer is cued by its READING's first kana (走る: 「は」), which no spelling check can derive.
  const kanjiAnswer = [...firsts].some((c) => /\p{Script=Han}/u.test(c))
  for (const m of String(q.question || '').matchAll(letterCueRe)) {
    const c = cueFold(m[1] || m[2] || m[3] || m[4])
    // A Han answer is cued by its reading's first sound: a kana (走る: は) or a Latin pinyin initial (雨伞: y).
    // A quoted Latin letter only through a pinyin/romaji answer (in firsts): a quoted English "I" in
    // 'How do you say "I"' read as the reading cue for 私.
    if (firsts.has(c) || (kanjiAnswer && /[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(c) && !m[3] && !m[4])) return true
  }
  return false
}
// Skeleton from the SHORTEST accepted answer (letters only): first letter + '·' per remaining letter.
export const letterSkeleton = (q) => {
  // Not from a Han answer: its first character is half the word (走る → "走·"). A kana or pinyin reading
  // among the answers is used instead, else no skeleton.
  const ans = cueAnswers(q).map((a) => [...a].filter((c) => /\p{L}/u.test(c))).filter((l) => l.length && !/\p{Script=Han}/u.test(l[0]))
  const shortest = ans.filter((l) => l.length).sort((a, b) => a.length - b.length)[0]
  if (!shortest || shortest.length < 2) return ''
  return shortest[0] + '·'.repeat(shortest.length - 1)
}
export const appendLetterCue = (q) => {
  const skel = letterSkeleton(q)
  if (!skel) return q
  let text = String(q.question || '').trimEnd()
  const m = text.match(/([?？!！.。]+)$/u) // keep trailing sentence punctuation after the cue
  const cue = ` (${skel})`
  text = m ? text.slice(0, text.length - m[1].length).trimEnd() + cue + m[1] : text + cue
  return { ...q, question: text }
}
// Which questions MUST carry a first-letter cue: typed (non-MC) LANGUAGE recall/fill_blank that
// have a concrete word answer. Explanation questions and general-mode blind recall are exempt.
export const needsLetterCue = (q, isLanguage, wantChoices) =>
  isLanguage && !wantChoices && (q.type === 'recall' || q.type === 'fill_blank') &&
  cueAnswers(q).length > 0 && !hasLetterCue(q)
// A scrub that blanked the whole quoted subject ("Translate: '___'"): nothing left to answer from (generation and
// Fix question both drop it).
export const blankedSubject = (q) => new RegExp(`[${CUE_QUOTES_PLAIN}${CUE_APOS}]\\s*___\\s*[${CUE_QUOTES_PLAIN}${CUE_APOS}]|[:：]\\s*___\\s*(?:[(（]|[?？.。!！]*\\s*$)`, 'u').test(String(q.question || ''))

// ── The question ladder: the LETTER COUNT and the choices view (same as fights, kit/fightSettings.js) ──────────────
// Every typed language recall/fill_blank question (not an open tier) shows the answer's skeleton "(s·······)": the first
// letter AND how many letters, even beside a quoted first letter. A skeleton already there (any length, Study's own
// "(y·)" for a 2-letter word too) is kept.
const ANY_SKELETON = /[(（]\s*(\p{L})[·.]+[^)）]*[)）]/gu
const answerInitials = (q) => {
  const set = new Set()
  for (const a of cueAnswers(q)) for (const w of a.split(/[\s/'’]+/)) { const c = [...w].find((ch) => /\p{L}/u.test(ch)); if (c) set.add(cueFold(c)) }
  return set
}
export const hasCountSkeleton = (q) => {
  const firsts = answerInitials(q)
  return [...String(q?.question || '').matchAll(ANY_SKELETON)].some((m) => firsts.has(cueFold(m[1])))
}
export function withLetterCount(q, { isLanguage = false, open = false } = {}) {
  if (!isLanguage || open || !q || typeof q !== 'object' || !(q.type === 'recall' || q.type === 'fill_blank')) return q
  const acc = cueAnswers(q)
  if (!acc.length || hasCountSkeleton(q)) return q
  const out = ensureLetterCue({ kind: 'typed', prompt: String(q.question || ''), accepted: acc, open: false }, { isLanguage: true })
  return out.prompt === q.question ? q : { ...q, question: out.prompt }
}
// The question as shown with its CHOICES: no skeleton and no quoted first letter (the letters would pick the tile).
// A letter clause inside a parenthetical cue goes ("(sense; starts with "h")" → "(sense)"); a parenthetical that is only
// the letter cue goes whole. The sense cue stays.
const LQ = `${CUE_QUOTES_PLAIN}${CUE_APOS}`
const LETTER_CLAUSE = new RegExp(`\\s*[;,，；]\\s*[^;,，；()（）]*?[${LQ}]\\s*\\p{L}\\s*[${LQ}][^;,，；()（）]*(?=[)）])`, 'gu')
const LETTER_PAREN = new RegExp(`\\s*[(（][^()（）]*?[${LQ}]\\s*\\p{L}\\s*[${LQ}][^()（）]*[)）]`, 'gu')
// `answers` (the question's accepted answers): a letter cue written as its OWN sentence after the question ('How do you
// say "house"? It starts with "c".') goes too, but only when its quoted letter starts an answer, and never the first
// sentence (a quoted "I" in 'Listen. How do you say "I"?' is the subject, not a cue).
const LETTER_SENTENCE = new RegExp(`([.?!。？！][${CUE_QUOTES_PLAIN}’]*\\s*)(?![${LQ}])([^.?!。？！()（）_\\n]{0,60}?[${LQ}]\\s*(\\p{L})\\s*[${LQ}][^.?!。？！()（）_\\n]{0,40}?(?:[.?!。？！]|$))`, 'gu')
export const stripLetterCues = (text, answers = null) => {
  let out = stripLetterSkeleton(String(text || ''))
    .replace(/\s*[(（]\s*\p{L}·\s*[)）]/gu, '')
    .replace(LETTER_CLAUSE, '')
    .replace(LETTER_PAREN, '')
  const firsts = Array.isArray(answers) && answers.length ? answerInitials({ acceptedAnswers: answers }) : null
  if (firsts && firsts.size) {
    const cut = out.replace(LETTER_SENTENCE, (all, lead, _s, letter) => (firsts.has(cueFold(letter)) ? lead.trimEnd() : all)).trimEnd()
    if (cut.trim()) out = cut
  }
  return out
}
