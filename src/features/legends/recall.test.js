import { describe, it, expect } from 'vitest'
import { recallOf } from './Extras'
import { matchTyped } from '../kit/grade'

const ok = (it, typed) => !!matchTyped(typed, recallOf(it).accepted)

describe('recallOf (Gold blitz, the chest)', () => {
  it('expands a slash ending: a bare ending is never the answer', () => {
    const it = { kind: 'term', front: 'niño/a', back: 'child' }
    expect(ok(it, 'niño')).toBe(true)
    expect(ok(it, 'niña')).toBe(true)
    expect(ok(it, 'a')).toBe(false)
  })
  it('keeps a unit whole ("h" is not km/h)', () => {
    const it = { kind: 'term', front: 'km/h', back: 'kilometres per hour' }
    expect(ok(it, 'km/h')).toBe(true)
    expect(ok(it, 'h')).toBe(false)
  })
  it('still takes real alternatives and drops a parenthetical', () => {
    const it = { kind: 'term', front: 'coche/carro (vehicle)', back: 'car' }
    expect(ok(it, 'coche')).toBe(true)
    expect(ok(it, 'carro')).toBe(true)
    expect(ok({ kind: 'term', front: 'hablar (verb)', back: 'to speak' }, 'hablar')).toBe(true)
  })
  it('no recall for rules and questions', () => {
    expect(recallOf({ kind: 'rule', front: 'ser vs estar', back: 'x' })).toBeNull()
    expect(recallOf({ kind: 'term', front: 'What is it?', back: 'x' })).toBeNull()
  })
})
