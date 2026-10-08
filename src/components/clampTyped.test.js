import { describe, it, expect } from 'vitest'
import { clampTyped } from './SettingsModal'

describe('clampTyped (Settings number boxes)', () => {
  it('a whole number past a limit becomes that limit', () => {
    expect(clampTyped('15', 1, 10)).toBe(10)
    expect(clampTyped('0', 1, 10)).toBe(1)
    expect(clampTyped('-3', 1, 120)).toBe(1)
    expect(clampTyped(' 999 ', 1, 50)).toBe(50)
  })
  it('in range, empty or not a whole number gives nothing to commit', () => {
    expect(clampTyped('5', 1, 10)).toBeNull()
    expect(clampTyped('', 1, 10)).toBeNull()
    expect(clampTyped('1.5', 1, 10)).toBeNull()
    expect(clampTyped('abc', 1, 10)).toBeNull()
  })
})
