import { describe, it, expect } from 'vitest'
import { fightRules, rulesPatch, fightSubject, fightWords, isImmersive, phrasingLine, generationKey, hasLetterCue, letterSkeleton, ensureLetterCue, stripLetterSkeleton, questionAnswersOf } from './fightSettings'

const es = { isLanguage: true, learnLang: 'Spanish', userLang: 'English', name: 'Spanish' }
const comptia = { isLanguage: false, learnLang: 'English', userLang: 'English', name: 'CompTIA A+' }

describe('fightRules', () => {
  it('shapes damaged rules and keeps today\'s defaults', () => {
    const r = fightRules(null, { isLanguage: true, learnLang: 'Spanish' })
    expect(r).toEqual({ learnLang: 'Spanish', speaks: '', dialect: '', grammarFeedback: false, wordHints: false, strictAccents: true, learnMoment: true, answerStyle: 'typed' })
  })
  it('reads the study settings (one setting with Study)', () => {
    const r = fightRules({ studyLanguage: 'Japanese', quizLanguage: 'Japanese', dialect: ' Kansai ', wordHints: true, grammarFeedback: true, accentDrill: false, learnMoment: false, fightAnswerStyle: 'choices' }, { isLanguage: true, learnLang: 'Spanish' })
    expect(r).toMatchObject({ learnLang: 'Japanese', speaks: 'Japanese', dialect: 'Kansai', wordHints: true, grammarFeedback: true, strictAccents: false, learnMoment: false, answerStyle: 'choices' })
  })
  it('language-only settings are off in general modes', () => {
    const r = fightRules({ wordHints: true, grammarFeedback: true, dialect: 'x', quizLanguage: 'Japanese' }, { isLanguage: false })
    expect(r).toMatchObject({ learnLang: '', dialect: '', wordHints: false, grammarFeedback: false, speaks: 'Japanese' })
  })
  it('a strange answer style falls back to typed', () => expect(fightRules({ fightAnswerStyle: 'voice' }).answerStyle).toBe('typed'))
})

describe('rulesPatch', () => {
  it('maps panel changes to studyRules keys and drops the rest', () => {
    expect(rulesPatch({ speaks: ' Spanish ', strictAccents: 0, answerStyle: 'nope', bogus: 1 })).toEqual({ quizLanguage: 'Spanish', accentDrill: false, fightAnswerStyle: 'typed' })
    expect(rulesPatch({ learnLang: 'Korean', wordHints: 1, learnMoment: false, grammarFeedback: 'yes' })).toEqual({ studyLanguage: 'Korean', wordHints: true, learnMoment: false, grammarFeedback: true })
  })
})

describe('fightSubject: who speaks', () => {
  it('unset keeps the app language (today)', () => {
    const r = fightRules({}, { isLanguage: true, learnLang: 'Spanish' })
    const s = fightSubject(es, r)
    expect(s.userLang).toBe('English')
    expect(s.appLang).toBe('English')
    expect(s.immersive).toBe(false)
    expect(s.phrasing).toBe('')
  })
  it('Ebi speaks the learned language = full immersion, dialect kept', () => {
    const r = fightRules({ quizLanguage: 'español', dialect: 'Mexican Spanish' }, { isLanguage: true, learnLang: 'Spanish' })
    const s = fightSubject(es, r)
    expect(s.userLang).toBe('español')
    expect(s.immersive).toBe(true)
    expect(isImmersive(es, r)).toBe(true)
    expect(s.phrasing).toMatch(/FULL IMMERSION/)
    expect(s.phrasing).toMatch(/Mexican Spanish/)
  })
  it('works for any learned language (Korean, Arabic, Chinese)', () => {
    for (const lang of ['Korean', 'Arabic', 'Chinese (Simplified)', 'Thai']) {
      const subj = { ...es, learnLang: lang, name: lang }
      const s = fightSubject(subj, fightRules({ quizLanguage: lang }, { isLanguage: true, learnLang: lang }))
      expect(s.immersive).toBe(true)
      expect(s.phrasing).toContain(lang)
    }
    // "Mandarin" and "Chinese (Simplified)" are one language
    expect(isImmersive({ ...es, learnLang: 'Mandarin' }, fightRules({ quizLanguage: 'Chinese (Simplified)' }, { isLanguage: true, learnLang: 'Mandarin' }))).toBe(true)
  })
  it('a general mode phrased in Japanese keeps terms and grades understanding', () => {
    const r = fightRules({ quizLanguage: 'Japanese' }, { isLanguage: false })
    const s = fightSubject(comptia, r)
    expect(s.userLang).toBe('Japanese')
    expect(s.immersive).toBe(false)
    expect(s.phrasing).toMatch(/never translated/)
    expect(s.phrasing).toMatch(/any language/)
  })
  it('phrasing is empty when Ebi speaks the app language', () => {
    expect(phrasingLine(comptia, fightRules({ quizLanguage: 'English' }))).toBe('')
  })
  it('a second fightSubject keeps the original app language', () => {
    const r = fightRules({ quizLanguage: 'Japanese' })
    expect(fightSubject(fightSubject(comptia, r), r).appLang).toBe('English')
  })
})

describe('fightWords: tappable when the text is not in the app language', () => {
  it('language modes tap; hints follow the setting', () => {
    expect(fightWords(fightSubject(es, fightRules({}, { isLanguage: true, learnLang: 'Spanish' })), { wordHints: true })).toEqual({ tap: true, hints: true, lang: 'English' })
  })
  it('general modes tap only in another language, never glosses', () => {
    expect(fightWords(fightSubject(comptia, fightRules({ quizLanguage: 'Japanese' })), { wordHints: true })).toEqual({ tap: true, hints: false, lang: 'Japanese' })
    expect(fightWords(fightSubject(comptia, fightRules({})), {}).tap).toBe(false)
  })
})

it('generationKey changes only with what the questions are written in', () => {
  const a = fightRules({ quizLanguage: 'Spanish' }, { isLanguage: true, learnLang: 'Spanish' })
  expect(generationKey(a)).toBe(generationKey({ ...a, wordHints: true, answerStyle: 'choices' }))
  expect(generationKey(a)).not.toBe(generationKey({ ...a, dialect: 'Rioplatense' }))
})

describe('first-letter cue', () => {
  it('finds a quoted letter or skeleton that starts an answer', () => {
    expect(hasLetterCue('Tengo un ___ (umbrella, "p")', ['paraguas'])).toBe(true)
    expect(hasLetterCue('Tengo un ___ (p·······)', ['paraguas'])).toBe(true)
    expect(hasLetterCue('Tengo un ___ (umbrella)', ['paraguas'])).toBe(false)
    expect(hasLetterCue('“雨” ___', ['paraguas'])).toBe(false)
  })
  it('skeleton keeps the first letter only, never for Han or kana', () => {
    expect(letterSkeleton('el sombrero')).toBe('(e· ········)')
    expect(letterSkeleton('雨伞')).toBe('')
    expect(letterSkeleton('がっこう')).toBe('')
    expect(letterSkeleton('학교')).toBe('(학·)')
  })
  it('always shows the letter count, even beside a quoted first letter, and strips it for choices', () => {
    const q = { kind: 'typed', prompt: 'Hoy ___ mucho (to rain, "l").', accepted: ['llueve'] }
    expect(ensureLetterCue(q, { isLanguage: true }).prompt).toBe('Hoy ___ (l·····) mucho (to rain, "l").')
    const done = { ...q, prompt: 'Hoy ___ (l·····) mucho.' }
    expect(ensureLetterCue(done, { isLanguage: true })).toBe(done)
    expect(stripLetterSkeleton('Hoy ___ (l·····) mucho.')).toBe('Hoy ___ mucho.')
    expect(stripLetterSkeleton('Tengo (umbrella) un ___')).toBe('Tengo (umbrella) un ___')
  })
  it('adds a cue after the blank of a typed language question only', () => {
    const q = { kind: 'typed', prompt: 'Hoy ___ mucho (to rain).', accepted: ['llueve'] }
    expect(ensureLetterCue(q, { isLanguage: true }).prompt).toBe('Hoy ___ (l·····) mucho (to rain).')
    expect(ensureLetterCue(q, { isLanguage: false })).toBe(q)
    expect(ensureLetterCue({ ...q, kind: 'choice' }, { isLanguage: true }).prompt).toBe(q.prompt)
    expect(ensureLetterCue({ ...q, open: true }, { isLanguage: true }).prompt).toBe(q.prompt)
    expect(ensureLetterCue({ ...q, accepted: ['下雨'] }, { isLanguage: true }).prompt).toBe(q.prompt)
  })
})

describe('questionAnswersOf (the live-question guard)', () => {
  it('collects accepted answers and every correct choice, once', () => {
    expect(questionAnswersOf({ accepted: ['paraguas', ' '], choices: ['a', 'paraguas'], answerIdx: 1, alt: { choices: ['x', 'sombrilla'], answerIdx: 1 } })).toEqual(['paraguas', 'sombrilla'])
    expect(questionAnswersOf(null)).toEqual([])
    expect(questionAnswersOf({ choices: ['a'], answerIdx: 3 })).toEqual([])
  })
})
