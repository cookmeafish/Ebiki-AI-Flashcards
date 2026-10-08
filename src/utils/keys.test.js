import { describe, it, expect } from 'vitest'
import { imeActive, choiceIndex } from './keys'

describe('imeActive', () => {
  it('sees a composition on the event, on nativeEvent, and Safari keyCode 229', () => {
    expect(imeActive({ key: 'Enter', isComposing: true })).toBe(true)
    expect(imeActive({ key: 'Enter', nativeEvent: { isComposing: true } })).toBe(true)
    expect(imeActive({ key: 'Enter', keyCode: 229 })).toBe(true)
    expect(imeActive({ key: 'Enter', nativeEvent: { keyCode: 229, isComposing: false } })).toBe(true)
  })
  it('is false for plain keys and junk', () => {
    expect(imeActive({ key: 'Enter', keyCode: 13 })).toBe(false)
    expect(imeActive(null)).toBe(false)
    expect(imeActive(undefined)).toBe(false)
  })
})

describe('choiceIndex', () => {
  it('maps digits to 0-based choices within the count', () => {
    expect(choiceIndex({ key: '1' }, 4)).toBe(0)
    expect(choiceIndex({ key: '4' }, 4)).toBe(3)
    expect(choiceIndex({ key: '5' }, 4)).toBe(-1)
    expect(choiceIndex({ key: '0' }, 4)).toBe(-1)
  })
  it('falls back to the physical key (AZERTY top row, numpad)', () => {
    expect(choiceIndex({ key: '&', code: 'Digit1' }, 4)).toBe(0)
    expect(choiceIndex({ key: 'é', code: 'Digit2' }, 4)).toBe(1)
    expect(choiceIndex({ key: 'End', code: 'Numpad1' }, 4)).toBe(0)
  })
  it('ignores modifiers, auto-repeat and IME composition', () => {
    expect(choiceIndex({ key: '1', ctrlKey: true }, 4)).toBe(-1)
    expect(choiceIndex({ key: '1', metaKey: true }, 4)).toBe(-1)
    expect(choiceIndex({ key: '1', altKey: true }, 4)).toBe(-1)
    expect(choiceIndex({ key: '1', repeat: true }, 4)).toBe(-1)
    expect(choiceIndex({ key: '1', keyCode: 229 }, 4)).toBe(-1)
  })
  it('is -1 for letters, junk and a missing count', () => {
    expect(choiceIndex({ key: 'a', code: 'KeyA' }, 4)).toBe(-1)
    expect(choiceIndex({ key: '1' }, 0)).toBe(-1)
    expect(choiceIndex({ key: '1' }, undefined)).toBe(-1)
    expect(choiceIndex(null, 4)).toBe(-1)
  })
})
