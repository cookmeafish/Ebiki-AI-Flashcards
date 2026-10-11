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
import { prefixHint, typedPrompt, choicePromptText, hasPrefixHint, answerInitials, fold } from '../../utils/prefixHint'

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

// ── The prefix hint (Study's guarantee, for fight questions: ONE engine, utils/prefixHint.js) ───────────────────
// A typed language question pins ONE answer with a sense cue AND the app's prefix hint: the answer's first ~20% of
// letters ("(so…)" for sombrero, "(b… d…)" for buenos días), never its length (the owner: the letter count gave a
// question away once it was switched to its choices). Han and kana answers get none: their cue is the romanization's
// initial, written by the model.
export function hasLetterCue(prompt, accepted = []) {
  if (hasPrefixHint(prompt, accepted)) return true
  const firsts = answerInitials(accepted)
  return [...String(prompt || '').matchAll(QUOTED_LETTER)].some((m) => firsts.has(fold(m[1])))
}
const QUOTED_LETTER = /["'“”‘’«»‹›„‚「」『』]\s*(\p{L})\s*["'“”‘’«»‹›„‚「」『』]/gu
// The hint for an answer, '' when none can be shown.
export const letterHint = (answer) => prefixHint(answer)
// The prompt as answered with its CHOICES: no hint of any kind (its letters would pick the tile).
export const stripLetterHints = (prompt, accepted = null) => choicePromptText(prompt, accepted)
// A typed language question shows its prefix hint (a legacy skeleton or a quoted first letter gives way to it); open
// and choice questions never (a hint would leak).
export function ensurePrefixHint(q, { isLanguage = false } = {}) {
  if (!isLanguage || !q || q.kind !== 'typed' || q.open) return q
  const acc = Array.isArray(q.accepted) ? q.accepted.filter(Boolean) : []
  if (!acc.length) return q
  // Its choices could not keep to the hint (kit/fightChoices.js `noHint`): no hint at all, so "Show choices" gives
  // nothing away.
  if (q.noHint) { const bare = choicePromptText(String(q.prompt || ''), acc); return bare === q.prompt ? q : { ...q, prompt: bare } }
  const prompt = typedPrompt(String(q.prompt || ''), acc, { isLanguage: true })
  return prompt === q.prompt ? q : { ...q, prompt }
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
