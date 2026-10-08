import { describe, it, expect } from 'vitest'
import { shapeProfile } from './profile'
import { rng } from '../utils/testRng'

describe('shapeProfile', () => {
  it('reads a summary keyed by language and keeps a level range hyphen', () => {
    const p = shapeProfile({ summary: { en: 'Solid A2.' }, level: { estimate: 'A2–B1', scale: 'CEFR' }, domains: ['Grammar'] })
    expect(p.summary).toBe('Solid A2.')
    expect(p.level).toEqual({ estimate: 'A2-B1', scale: 'CEFR' })
    expect(p.domains).toEqual([{ name: 'Grammar', status: '' }])
  })
  it('drops a non-object level and junk domains', () => {
    const p = shapeProfile({ summary: 'x', level: 'B1', domains: { Grammar: 0.4 } })
    expect(p.level).toBeUndefined()
    expect(p.domains).toEqual([])
    expect(shapeProfile({ domains: [null, 3, { name: '' }, { name: 'Ports', status: ['weak'] }] }).domains).toEqual([{ name: 'Ports', status: 'weak' }])
  })
  it('dashes in prose become commas, never in the hyphenated range', () => {
    expect(shapeProfile({ level: { estimate: 'B1 — solid' } }).level.estimate).toBe('B1-solid')
  })
  it('passes non-objects through and never throws on junk (property)', () => {
    expect(shapeProfile(null)).toBe(null)
    expect(shapeProfile('x')).toBe('x')
    const r = rng(3)
    const junk = () => r.pick([null, 0, 'A2–B1', [], {}, { en: 3 }, ['a', null], { name: 'x', status: { a: 1 } }, NaN])
    for (let i = 0; i < 1000; i++) {
      const p = shapeProfile({ summary: junk(), level: r.bool() ? { estimate: junk(), scale: junk() } : junk(), domains: r.bool() ? [junk(), junk()] : junk() })
      expect(typeof p.summary).toBe('string')
      expect(Array.isArray(p.domains)).toBe(true)
      for (const d of p.domains) { expect(typeof d.name).toBe('string'); expect(d.name).not.toBe('') }
      if (p.level) expect(typeof p.level.estimate).toBe('string')
    }
  })
})
