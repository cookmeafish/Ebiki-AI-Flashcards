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

  it('preserves absent or nonnumeric hints and hints without usable answers', () => {
    expect(correctLetterHint(null, ['repleto'])).toBeNull()
    expect(correctLetterHint('Think about fullness', ['repleto'])).toBe('Think about fullness')
    expect(correctLetterHint('7 letras', [])).toBe('7 letras')
  })
})
