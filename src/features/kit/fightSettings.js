// FIGHT SETTINGS (pure, tested: fightSettings.test.js). A fight (a raid, a Legends boss or Legendary) uses the SAME
// per-mode study settings as Study (studyRules: learned language, "Ebi speaks", dialect, grammar feedback, word
// hints, the accent drill, Learn-it moments), read and written through ctx.study.rules() / ctx.study.setRules(patch):
// ONE setting, never a second copy. The fight panel (legends/FightSettings.jsx) only shows them in a compact way.
//
// "Ebi speaks" in a fight: unset ('') keeps the app language (fights always spoke it); set, the WHOLE fight speaks it
// (questions, cues, hints, feedback notes, taunts, Learn it, the debrief), because every fight prompt writes in
// `subject.userLang`. fightSubject() returns the subject with userLang = that language, so nothing downstream needs
// to know. Ebi speaking the LEARNED language is full immersion; glosses and tap-a-word lookups (in the app language)
// are the safety net. Any subject: a general mode phrased in another language keeps its terms untranslated and grades
// understanding in any language.
import { sameLanguage, tapAllowed } from '../../utils/tapTokens'

export const FIGHT_STYLES = ['typed', 'choices']

const str = (v) => (typeof v === 'string' ? v.trim() : '')

// studyRules (any shape, possibly damaged) → the values a fight uses.
// ctxInfo: { isLanguage, learnLang (the mode's derived learned language), appLang }
export function fightRules(raw, { isLanguage = false, learnLang = '' } = {}) {
  const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  return {
    learnLang: isLanguage ? (str(r.studyLanguage) || str(learnLang)) : '',
    speaks: str(r.quizLanguage), // '' = the app language (today's fights)
    dialect: isLanguage ? str(r.dialect) : '',
    grammarFeedback: isLanguage && r.grammarFeedback === true,
    wordHints: isLanguage && r.wordHints === true,
    strictAccents: r.accentDrill !== false,
    learnMoment: r.learnMoment !== false,
    answerStyle: r.fightAnswerStyle === 'choices' ? 'choices' : 'typed',
    // THE QUESTION LADDER (utils/questionTier.js): one setting with Study (studyRules.questionLadder, default ON).
    questionLadder: r.questionLadder !== false,
  }
}
// The ladder from any studyRules (a lesson's ctx.study.rules(), a fight's rules): on unless explicitly off.
export const ladderOn = (rules) => !(rules && typeof rules === 'object' && rules.questionLadder === false)

// The panel's change → the studyRules patch it writes. Unknown keys are dropped; values are shaped.
const PATCH_KEYS = {
  learnLang: (v) => ({ studyLanguage: str(v) }),
  speaks: (v) => ({ quizLanguage: str(v) }),
  grammarFeedback: (v) => ({ grammarFeedback: !!v }),
  wordHints: (v) => ({ wordHints: !!v }),
  strictAccents: (v) => ({ accentDrill: !!v }),
  learnMoment: (v) => ({ learnMoment: !!v }),
  answerStyle: (v) => ({ fightAnswerStyle: FIGHT_STYLES.includes(v) ? v : 'typed' }),
  questionLadder: (v) => ({ questionLadder: !!v }),
}
export function rulesPatch(change = {}) {
  const out = {}
  for (const [k, v] of Object.entries(change || {})) if (PATCH_KEYS[k]) Object.assign(out, PATCH_KEYS[k](v))
  return out
}

// The language a fight's text is written in.
export const fightSpeaks = (subject = {}, rules = {}) => rules.speaks || subject.appLang || subject.userLang || 'English'
// Ebi speaks the learned language: the whole fight is in it.
export const isImmersive = (subject = {}, rules = {}) => !!subject.isLanguage && !!rules.learnLang && sameLanguage(fightSpeaks(subject, rules), rules.learnLang)

// One line every fight prompt carries (quiz prompts and the graders read `subject.phrasing`).
export function phrasingLine(subject = {}, rules = {}) {
  const appLang = subject.appLang || subject.userLang || 'English'
  const speaks = fightSpeaks(subject, rules)
  const dialect = rules.dialect ? ` (${rules.dialect})` : ''
  if (isImmersive(subject, rules)) {
    return `FULL IMMERSION: write EVERYTHING the learner reads (questions, instructions, cues, hints, explanations, notes) in ${rules.learnLang}${dialect}, never in ${appLang}. Keep it simple enough for the learner's level; a sense cue is a short ${rules.learnLang} definition or synonym, never a translation.`
  }
  if (sameLanguage(speaks, appLang)) return ''
  if (subject.isLanguage) return `Ebi speaks ${speaks}: instructions, cues, hints and explanations are written in ${speaks}; answers stay in ${rules.learnLang || subject.learnLang}${dialect}.`
  return `Phrase everything in ${speaks}. Subject terms, acronyms, commands, code, numbers, units and proper nouns stay exactly as written (never translated). The learner may answer in any language: grade the understanding, never the language. Never turn it into a language lesson.`
}

// The subject a fight's prompts see. `appLang` keeps the app language (tap-a-word lookups explain in it).
export function fightSubject(subject = {}, rules = {}) {
  const appLang = subject.appLang || subject.userLang || 'English'
  const speaks = fightSpeaks({ ...subject, appLang }, rules)
  return {
    ...subject,
    appLang,
    userLang: speaks,
    ...(subject.isLanguage && rules.learnLang ? { learnLang: rules.learnLang } : {}),
    immersive: isImmersive(subject, rules),
    grammarFeedback: !!rules.grammarFeedback,
    phrasing: phrasingLine({ ...subject, appLang }, rules),
  }
}

// What a fight's word surfaces may do: tap (lookups), glosses (word hints), and the text's language.
export function fightWords(subject = {}, rules = {}) {
  const appLang = subject.appLang || subject.userLang || 'English'
  const textLang = subject.userLang || appLang
  const tap = tapAllowed({ isLanguage: !!subject.isLanguage, textLang, appLang })
  return { tap, hints: tap && !!subject.isLanguage && !!rules.wordHints, lang: textLang }
}

// Settings that change what the questions are WRITTEN in: a change asks for new questions.
// The question ladder too: on, every question is written at its card's tier; off, all at today's middle question.
export const generationKey = (rules = {}) => [rules.learnLang || '', rules.speaks || '', rules.dialect || '', rules.questionLadder === false ? 'flat' : 'ladder'].join('|')

// ── The first-letter cue (Study's guarantee, for fight questions) ─────────────────────────────────────────────
// A typed language question pins ONE answer with a sense cue AND the answer's first letter. Scripts without letters
// to show (Han, kana) never get a skeleton: their cue is the romanization's initial, written by the model.
const NO_SKELETON = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u
const QUOTED_LETTER = /["'“”‘’«»‹›„‚「」『』]\s*(\p{L})\s*["'“”‘’«»‹›„‚「」『』]/gu
// A two-letter answer's skeleton has ONE dot ("(y·)", "(e· ········)" for "el sombrero"): a single middle dot counts
// too (a single "." never does: "(p.)" is an abbreviation).
const SKELETON = /\((\p{L})(?:[·.]{2,}|·)[^)]*\)/gu
const initials = (accepted = []) => {
  const set = new Set()
  for (const a of accepted) for (const w of String(a || '').split(/[\s/'’]+/)) { const c = [...w.trim()][0]; if (c) set.add(c.toLowerCase()) }
  return set
}
export function hasLetterCue(prompt, accepted = []) {
  const firsts = initials(accepted)
  if (!firsts.size) return false
  const found = [...String(prompt || '').matchAll(QUOTED_LETTER), ...String(prompt || '').matchAll(SKELETON)].map((m) => m[1].toLowerCase())
  return found.some((c) => firsts.has(c))
}
// "sombrero" → "(s·······)"; '' for an answer that starts with Han or kana.
export function letterSkeleton(answer) {
  const a = String(answer || '').trim()
  if (!a || NO_SKELETON.test(a)) return ''
  return `(${a.split(/(\s+)/).map((w, wi) => (/^\s+$/.test(w) ? w : [...w].map((ch, i) => (wi === 0 && i === 0 ? ch : /\p{L}/u.test(ch) ? '·' : ch)).join(''))).join('')})`
}
// The skeleton is there: the first letter AND how many letters (the owner: the count must always be shown, a quoted
// first letter alone left ambiguous questions unanswerable).
export function hasLetterSkeleton(prompt, accepted = []) {
  const firsts = initials(accepted)
  return [...String(prompt || '').matchAll(SKELETON)].some((m) => firsts.has(m[1].toLowerCase()))
}
// The prompt without its skeleton, for a question answered with its choices (the letters would pick the tile).
export const stripLetterSkeleton = (prompt) => String(prompt || '').replace(/\s*\((\p{L})(?:[·.]{2,}|·)[^)]*\)/gu, '')
// A typed language question without the skeleton gets it, even beside a quoted first letter (open and choice
// questions never: a cue would leak).
export function ensureLetterCue(q, { isLanguage = false } = {}) {
  if (!isLanguage || !q || q.kind !== 'typed' || q.open) return q
  const acc = Array.isArray(q.accepted) ? q.accepted.filter(Boolean) : []
  if (!acc.length || hasLetterSkeleton(q.prompt, acc)) return q
  const sk = letterSkeleton(acc[0])
  if (!sk) return q
  const prompt = /_{2,}/.test(q.prompt) ? String(q.prompt).replace(/_{2,}/, (m) => `${m} ${sk}`) : `${q.prompt} ${sk}`
  return { ...q, prompt }
}

// The context a fight runs with: the same ctx, its subject speaking the fight's language, plus `fight` = { rules,
// words, set(change) }. Everything that takes ctx (QuizRunner, the graders, taunts, Learn it, rule cards) follows.
export function fightCtx(ctx) {
  if (!ctx?.subject) return ctx
  const base = ctx.subject.appLang ? { ...ctx.subject, userLang: ctx.subject.appLang } : ctx.subject // never wrap twice
  const rules = fightRules(ctx.study?.rules?.() || null, { isLanguage: !!base.isLanguage, learnLang: base.learnLang })
  const subject = fightSubject(base, rules)
  return { ...ctx, subject, fight: { rules, words: fightWords(subject, rules), set: (change) => ctx.study?.setRules?.(rulesPatch(change)) } }
}

// Everything a question on screen hides: its accepted answers and the correct choice (its own, or its `alt` choices'
// when a typed question can be answered with them). Tap-a-word lookups and word hints are guarded against these.
export function questionAnswersOf(q) {
  if (!q || typeof q !== 'object') return []
  const out = [...(Array.isArray(q.accepted) ? q.accepted : [])]
  if (Array.isArray(q.choices) && Number.isInteger(q.answerIdx) && q.choices[q.answerIdx]) out.push(q.choices[q.answerIdx])
  if (q.alt && Array.isArray(q.alt.choices) && Number.isInteger(q.alt.answerIdx) && q.alt.choices[q.alt.answerIdx]) out.push(q.alt.choices[q.alt.answerIdx])
  return [...new Set(out.map((a) => String(a || '').trim()).filter(Boolean))]
}
