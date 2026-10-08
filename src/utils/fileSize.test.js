import { describe, it, expect } from 'vitest'
import { fileSizeLabel } from './fileSize.js'

describe('fileSizeLabel', () => {
  it('never shows a non-empty file as 0.0 KB', () => {
    expect(fileSizeLabel(20)).toBe('20 B')
    expect(fileSizeLabel(0)).toBe('0 B')
  })
  it('KB and MB with one decimal', () => {
    expect(fileSizeLabel(3482)).toBe('3.4 KB')
    expect(fileSizeLabel(1024 * 1024 * 1.25)).toBe('1.3 MB')
  })
  it('odd input is blank, never NaN', () => {
    expect(fileSizeLabel(undefined)).toBe('')
    expect(fileSizeLabel('x')).toBe('')
    expect(fileSizeLabel(-5)).toBe('')
  })
})
