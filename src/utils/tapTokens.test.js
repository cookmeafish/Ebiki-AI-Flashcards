import { describe, it, expect } from 'vitest'
import { splitTapTokens, tapClean, tapLongEnough, sameLanguage, tapAllowed, splitCueParts } from './tapTokens'

const words = (text, seg) => splitTapTokens(text, seg).map(tapClean).filter((w) => w && tapLongEnough(w))

describe('splitTapTokens: every script', () => {
  it('Chinese is split into words, not one sentence', () => {
    const w = words('我喜欢吃苹果')
    expect(w.length).toBeGreaterThan(2)
    expect(w.join('')).toBe('我喜欢吃苹果')
  })
  it('Japanese mixes kanji and kana into words', () => {
    const w = words('私は学校へ行きます。')
    expect(w.length).toBeGreaterThan(3)
    expect(w).toContain('学校')
  })
  it('Thai has no spaces and is still split', () => {
    const w = words('ภาษาไทยง่าย')
    expect(w.length).toBeGreaterThan(1)
    expect(w.join('')).toBe('ภาษาไทยง่าย')
  })
  it('Korean keeps a token with its particle whole (the lookup explains stem and particle)', () => {
    expect(words('저는 학교에 갑니다')).toEqual(['저는', '학교에', '갑니다'])
  })
  it('Arabic splits on spaces and keeps marks', () => {
    expect(words('ذهبتُ إلى المدرسة.')).toEqual(['ذهبتُ', 'إلى', 'المدرسة'])
  })
  it('Hindi keeps its vowel signs', () => {
    expect(words('नमस्ते दोस्त')).toEqual(['नमस्ते', 'दोस्त'])
  })
  it('joining the tokens gives the text back', () => {
    for (const s of ['我喜欢吃苹果', 'Hola, ¿qué tal?', '저는 학교에 갑니다', 'ภาษาไทยง่าย', 'ذهبتُ إلى المدرسة.']) expect(splitTapTokens(s).join('')).toBe(s)
  })
  it('without a word segmenter, Han and kana fall back to one character per token', () => {
    expect(words('我喜欢', null)).toEqual(['我', '喜', '欢'])
    expect(words('学校へ', null)).toEqual(['学', '校', 'へ'])
    expect(splitTapTokens('苹果。', null).join('')).toBe('苹果。')
  })
})

describe('tapAllowed: data-driven, never per language', () => {
  it('language modes always tap', () => expect(tapAllowed({ isLanguage: true, textLang: 'English', appLang: 'English' })).toBe(true))
  it('a general mode taps only text in another language than the app', () => {
    expect(tapAllowed({ isLanguage: false, textLang: 'Japanese', appLang: 'English' })).toBe(true)
    expect(tapAllowed({ isLanguage: false, textLang: 'English', appLang: 'English' })).toBe(false)
    expect(tapAllowed({ isLanguage: false, textLang: '日本語', appLang: 'Japanese' })).toBe(false)
    expect(tapAllowed({ isLanguage: false, textLang: '', appLang: 'English' })).toBe(false)
  })
  it('sameLanguage folds names and aliases', () => {
    expect(sameLanguage('Spanish', 'español')).toBe(true)
    expect(sameLanguage('Mandarin', 'Chinese (Simplified)')).toBe(true)
    expect(sameLanguage('Cantonese', 'Chinese (Traditional)')).toBe(false)
    expect(sameLanguage('', '')).toBe(false)
  })
})

describe('splitCueParts', () => {
  it('marks parenthetical cues, full-width ones too', () => {
    expect(splitCueParts('Me gusta ___ (to rain, "l")')).toEqual([{ text: 'Me gusta ___ ', cue: false }, { text: '(to rain, "l")', cue: true }])
    expect(splitCueParts('私は___（がっこう）へ').map((p) => p.cue)).toEqual([false, true, false])
  })
})
