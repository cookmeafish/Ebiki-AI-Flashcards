import { describe, it, expect } from 'vitest'
import { planInsert, isVoiceShortcut, looksSecret } from './voiceText'

describe('planInsert', () => {
  it('appends with one space after a word, none after a space', () => {
    expect(planInsert('hola', 4, 4, 'mundo')).toEqual({ insert: ' mundo', next: 'hola mundo', caret: 10 })
    expect(planInsert('hola ', 5, 5, 'mundo')).toEqual({ insert: 'mundo', next: 'hola mundo', caret: 10 })
  })
  it('pads both sides at a caret in the middle and keeps the caret after the words', () => {
    const p = planInsert('ab', 1, 1, 'X')
    expect(p.next).toBe('a X b')
    expect(p.caret).toBe(3)
  })
  it('replaces a selection', () => {
    expect(planInsert('one two three', 4, 7, 'TWO').next).toBe('one TWO three')
  })
  it('handles an empty field, bad positions and missing text', () => {
    expect(planInsert('', 0, 0, 'hi')).toEqual({ insert: 'hi', next: 'hi', caret: 2 })
    expect(planInsert('abc', undefined, undefined, 'd').next).toBe('abc d')
    expect(planInsert('abc', 99, 99, 'd').next).toBe('abc d')
    expect(planInsert('abc', 2, 1, 'd').next).toBe('ab d c')
    expect(planInsert(null, 0, 0, null).next).toBe('')
  })
})

describe('isVoiceShortcut', () => {
  it('matches Alt+V by key', () => expect(isVoiceShortcut({ altKey: true, key: 'v', code: 'KeyV' })).toBe(true))
  it('matches the physical key on a Mac (Option+V types √) and on other layouts', () => {
    expect(isVoiceShortcut({ altKey: true, key: '√', code: 'KeyV' })).toBe(true)
    expect(isVoiceShortcut({ altKey: true, key: 'м', code: 'KeyV' })).toBe(true)
  })
  it('ignores other chords and plain v', () => {
    expect(isVoiceShortcut({ altKey: false, key: 'v', code: 'KeyV' })).toBe(false)
    expect(isVoiceShortcut({ altKey: true, ctrlKey: true, key: 'v', code: 'KeyV' })).toBe(false)
    expect(isVoiceShortcut({ altKey: true, metaKey: true, key: 'v', code: 'KeyV' })).toBe(false)
    expect(isVoiceShortcut({ altKey: true, key: 'q', code: 'KeyQ' })).toBe(false)
    expect(isVoiceShortcut(null)).toBe(false)
  })
})

describe('looksSecret', () => {
  it('catches key, token, secret and password hints', () => {
    for (const h of ['apiKey field', 'api_key', 'token ', 'Your secret', 'current-password', 'sk-proj-...', 'AIzaSy...']) expect(looksSecret(h)).toBe(true)
  })
  it('leaves ordinary fields alone', () => {
    for (const h of ['Ask Ebi anything', 'Type your answer', 'Search cards', 'Plaza mayor', 'MAIZAL', 'tokens of affection']) expect(looksSecret(h)).toBe(false)
  })
})
