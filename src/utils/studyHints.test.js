import { describe, expect, it } from 'vitest'
import { answerLetterCounts, countAnswerLetters, correctLetterHint } from './studyHints'

describe('study letter hints', () => {
  it('corrects the combined slash-separated count without changing the hint language', () => {
    expect(correctLetterHint('15 letras', ['repleto/repleta'])).toBe('7 letras')
    expect(correctLetterHint('15 letters', ['repleto', 'repleta'])).toBe('7 letters')
  })

  it('shows distinct lengths when accepted alternatives differ', () => {
    expect(correctLetterHint('12 letras', ['actor/actriz'])).toBe('5/6 letras')
    expect(answerLetterCounts(['actor', 'actriz', 'actor'])).toEqual([5, 6])
  })

  it('counts Unicode letters without spaces, punctuation, or extra accent marks', () => {
    expect(countAnswerLetters(' cafe\u0301! ')).toBe(4)
    expect(correctLetterHint('12 letters', ['ice cream'])).toBe('8 letters')
    expect(correctLetterHint('9文字', ['食べる'])).toBe('3文字')
  })

  it('corrects a count that is not at the start of the hint', () => {
    expect(correctLetterHint('Tiene 12 letras', ['repleto'])).toBe('Tiene 7 letras')
    expect(correctLetterHint('It has 9 letters', ['actor/actriz'])).toBe('It has 5/6 letters')
    expect(correctLetterHint('有9个字母', ['lluvia'])).toBe('有6个字母')
    expect(correctLetterHint('2 words, 9 letters', ['ice cream'])).toBe('2 words, 9 letters')
  })

  it('preserves absent or nonnumeric hints and hints without usable answers', () => {
    expect(correctLetterHint(null, ['repleto'])).toBeNull()
    expect(correctLetterHint('Think about fullness', ['repleto'])).toBe('Think about fullness')
    expect(correctLetterHint('7 letras', [])).toBe('7 letras')
  })
})

describe('answerLetterCounts with slash forms', () => {
  it('counts the expanded forms, not endings or articles', () => {
    expect(answerLetterCounts(['nosotros/as', 'nosotros', 'nosotras'])).toEqual([8])
    expect(answerLetterCounts(['bueno/a'])).toEqual([5])
    expect(answerLetterCounts(['雨'])).toEqual([1]) // a one-character answer still counts
  })
})
