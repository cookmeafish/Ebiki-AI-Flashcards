import { describe, expect, it } from 'vitest'
import { retryHints, answerShowsPrefix } from './studyHints'

describe('retry hints (no letter count any more)', () => {
  it('a longer prefix first, then the model clue; counts and first-letter cues dropped', () => {
    expect(retryHints({ hint1: '10 letters', hint2: "starts with 'p'", accepted: ['pantalones'] })).toEqual([{ kind: 'prefix', prefix: 'pant…' }])
    expect(retryHints({ hint1: 'Tiene 5 letras', hint2: 'Lo llevas en las piernas', accepted: ['pantalones'] })).toEqual([{ kind: 'prefix', prefix: 'pant…' }, { kind: 'clue', text: 'Lo llevas en las piernas' }])
    expect(retryHints({ hint1: 'empieza con "y"', accepted: ['yo'] })).toEqual([])
    expect(retryHints({ hint1: 'a clue', accepted: ['走る'] })).toEqual([{ kind: 'clue', text: 'a clue' }])
    expect(retryHints({})).toEqual([])
    expect(retryHints({ hint1: 'Lo llevas en las piernas', accepted: ['pantalones'], noPrefix: true })).toEqual([{ kind: 'clue', text: 'Lo llevas en las piernas' }]) // no hint shown: no letters after a miss either
  })
  it('answerShowsPrefix', () => {
    expect(answerShowsPrefix('Pantalón', 'pant…')).toBe(true)
    expect(answerShowsPrefix('falda', 'pant…')).toBe(false)
    expect(answerShowsPrefix('x', '')).toBe(false)
    expect(answerShowsPrefix('a veces', '… ve…')).toBe(true)
    expect(answerShowsPrefix('a vamos', '… ve…')).toBe(false)
    expect(answerShowsPrefix('buenos dias', 'bu… dí…')).toBe(true)
  })
})
