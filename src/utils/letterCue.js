// The first-letter cue guarantee for typed language questions.
// Moved verbatim out of App.jsx (pure: no React, no app state) so they can be tested; App imports them back.
import { prefixHint, hintAnswer, canHint, needsReadingCue, typedPrompt, hasPrefixHint, choicePromptText, CUE_QUOTES_PLAIN, CUE_APOS } from './prefixHint'

// ── The cue guarantee (LANGUAGE-AGNOSTIC) ─────────────────────────────────────────────────────
// A typed translation / fill-in-the-blank is only fair if the student can tell WHICH word is
// wanted — "hat" is sombrero OR gorra, "run" is correr OR huir. The generator pins the target with a
// parenthetical SENSE cue, and the app adds the PREFIX HINT (utils/prefixHint.js: "(so…)", the first
// ~20% of the letters, never the length). These are the deterministic safety net around the prompt,
// working for ANY learned language + ANY Ebi-speaks language:
//   • hasLetterCue  — a cue already present: the prefix hint, or (for answers the app cannot hint:
//     Han, kana) a single letter or kana inside quotes ('…"s"…', '…«s»…', '…「や」…'), the way the model
//     writes a reading's first sound in every language.
//   • appendLetterCue — puts the prefix hint in (needs NO natural language).
// Apostrophe-type quotes are also contraction marks ("I'm", "don't", "What's 'umbrella'"), which
// read as a quoted letter and switched the cue guarantee OFF. For those, the quote must not touch a
// letter on the outside; the other quote kinds keep the plain rule (「ぼ」で has a letter after 」).
export { CUE_QUOTES_PLAIN, CUE_APOS } // „S“ (German, Polish, Czech) too: missed, every such card was regenerated
// Each alternative captures the cue's letter, so the cue is checked against the ANSWER: a quoted
// one-character meaning (Chinese “雨”) or a kana before a blank (公園で___) looked like a cue, and so
// did a cue naming the wrong letter; all three shipped the question with no real cue.
// A 2-letter answer's skeleton has ONE dot ("(y·)"): recognized only inside brackets (Catalan "col·lecció" is
// text), else a recheck missed it and appended a second cue.
export const letterCueRe = new RegExp(`[${CUE_QUOTES_PLAIN}]\\s*(\\p{L})\\s*[${CUE_QUOTES_PLAIN}]|(?<![\\p{Lu}\\p{Ll}])[${CUE_APOS}]\\s*(\\p{L})\\s*[${CUE_APOS}](?![\\p{Lu}\\p{Ll}])|(\\p{L})[·_]{2,}|[(（]\\s*(\\p{L})[·_]\\s*[)）]`, 'gu')
export const cueFold = (c) => String(c || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
export const cueAnswers = (q) => (q?.acceptedAnswers || []).map((x) => String(x).trim()).filter(Boolean)
// A cue counts only when its letter starts an accepted answer (or one of its words: "el sombrero").
export const hasLetterCue = (q) => {
  if (hasPrefixHint(q?.question, cueAnswers(q || {}))) return true
  const firsts = new Set()
  // Apostrophes split too: in "l'arbre" the cue names the a, not the l.
  for (const a of cueAnswers(q)) for (const w of a.split(/[\s/'’]+/)) { const c = [...w].find((ch) => /\p{L}/u.test(ch)); if (c) firsts.add(cueFold(c)) }
  // A kanji answer is cued by its READING's first kana (走る: 「は」), which no spelling check can derive.
  const kanjiAnswer = [...firsts].some((c) => /\p{Script=Han}/u.test(c))
  for (const m of String(q?.question || '').matchAll(letterCueRe)) {
    const c = cueFold(m[1] || m[2] || m[3] || m[4])
    // A Han answer is cued by its reading's first sound: a kana (走る: は) or a Latin pinyin initial (雨伞: y).
    // A quoted Latin letter only through a pinyin/romaji answer (in firsts): a quoted English "I" in
    // 'How do you say "I"' read as the reading cue for 私.
    if (firsts.has(c) || (kanjiAnswer && /[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(c) && !m[3] && !m[4])) return true
  }
  return false
}
// THE PREFIX HINT (utils/prefixHint.js) replaced the letter-count skeleton "(s·······)" (the owner, 2026-10-10: the
// first letter plus the length gave the answer away once the question showed its choices). The app adds it itself to
// every typed language recall/fill_blank: "(so…)" for sombrero, "(b… d…)" for buenos días, never the length.
// letterSkeleton keeps its name for its callers: it is the hint's text without brackets, '' when none can be shown
// (Han, kana, a 1-letter answer: those answers need the model's own reading cue, see needsLetterCue).
export const letterSkeleton = (q) => prefixHint(hintAnswer(cueAnswers(q))).replace(/^\(|\)$/g, '')
export const appendLetterCue = (q) => {
  const text = typedPrompt(String(q?.question || ''), cueAnswers(q || {}), { isLanguage: true })
  return text === String(q?.question || '') ? q : { ...q, question: text }
}
// Which questions MUST carry a first-letter cue: typed (non-MC) LANGUAGE recall/fill_blank that
// have a concrete word answer. Explanation questions and general-mode blind recall are exempt.
// The app adds the prefix hint to every answer it can hint, so only a Han or kana answer still needs the model to write
// its reading's first sound in quotes (a 1-letter or all-short answer gets no hint at all: any letter would be it).
export const needsLetterCue = (q, isLanguage, wantChoices) =>
  isLanguage && !wantChoices && (q.type === 'recall' || q.type === 'fill_blank') &&
  cueAnswers(q).length > 0 && !canHint(cueAnswers(q)) && needsReadingCue(hintAnswer(cueAnswers(q))) && !hasLetterCue(q)
// A scrub that blanked the whole quoted subject ("Translate: '___'"): nothing left to answer from (generation and
// Fix question both drop it).
export const blankedSubject = (q) => new RegExp(`[${CUE_QUOTES_PLAIN}${CUE_APOS}]\\s*___\\s*[${CUE_QUOTES_PLAIN}${CUE_APOS}]|[:：]\\s*___\\s*(?:[(（]|[?？.。!！]*\\s*$)`, 'u').test(String(q.question || ''))

// ── The question ladder: the PREFIX HINT and the choices view (same engine as fights, utils/prefixHint.js) ──────────
// Every typed language recall/fill_blank question (not an open tier) shows its prefix hint; a legacy count skeleton or a
// quoted first letter in a saved question is replaced by it.
export const hasCountSkeleton = (q) => hasPrefixHint(q?.question, cueAnswers(q || {}))
export function withLetterCount(q, { isLanguage = false, open = false } = {}) {
  if (!isLanguage || open || !q || typeof q !== 'object' || !(q.type === 'recall' || q.type === 'fill_blank')) return q
  const acc = cueAnswers(q)
  if (!acc.length) return q
  // `noHint`: no option set could keep to the hint (App planStudyChoices), so the question shows none at all.
  const text = q.noHint ? choicePromptText(String(q.question || ''), acc) : typedPrompt(String(q.question || ''), acc, { isLanguage: true })
  return text === q.question ? q : { ...q, question: text }
}
export const withPrefixHint = withLetterCount
// The question as shown with its CHOICES: no hint, no skeleton and no quoted first letter (the letters would pick the
// tile). A letter clause inside a parenthetical cue goes ("(sense; starts with "h")" → "(sense)"); the sense cue stays.
// `answers`: a letter cue written as its own sentence goes too, when its letter starts one of them.
export const stripLetterCues = (text, answers = null) => choicePromptText(text, answers)
