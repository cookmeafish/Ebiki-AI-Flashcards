import { describe, it, expect } from 'vitest'
import { shapeLedger, mergeLedgers, mergeGrammarLogs } from './merge'

describe('mergeLedgers', () => {
  it('unions every list, offered by value and the rest by term', () => {
    const a = { offered: ['casa', 'perro'], known: [{ term: 'casa' }], declined: ['gato'], carded: [] }
    const b = { offered: ['perro', 'sol'], known: [{ term: 'casa' }, { term: 'sol' }], declined: [], carded: ['luna'] }
    expect(mergeLedgers(a, b)).toEqual({
      offered: ['casa', 'perro', 'sol'],
      known: [{ term: 'casa' }, { term: 'sol' }],
      declined: ['gato'],
      carded: ['luna'],
    })
  })

  it('survives lists stored as null or an object (the rename migration threw on them and skipped the ledger)', () => {
    const out = mergeLedgers({ offered: null, known: { x: 1 }, declined: ['a'], carded: undefined }, { known: ['b'] })
    expect(out).toEqual({ offered: [], known: ['b'], declined: ['a'], carded: [] })
  })

  it('one side missing or not a ledger returns the other, shaped', () => {
    expect(mergeLedgers(null, { known: ['x'] })).toEqual({ known: ['x'], offered: [], declined: [], carded: [] })
    expect(mergeLedgers(['junk'], null)).toBe(null)
  })

  it('keeps accented and plain terms apart (papá is not papa)', () => {
    expect(mergeLedgers({ known: ['papa'] }, { known: ['papá'] }).known).toEqual(['papa', 'papá'])
  })

  it('drops null entries', () => {
    expect(shapeLedger({ known: [null, 'x', undefined] }).known).toEqual(['x'])
  })
})

describe('mergeGrammarLogs', () => {
  const key = (s) => String(s).toLowerCase().replace(/\s+/g, ' ').trim()

  it('the same slip in both copies keeps the larger count and the later time, never the sum', () => {
    const out = mergeGrammarLogs([{ t: 'de el → del', n: 3, at: 10 }], [{ t: 'De  el → del', n: 2, at: 50 }], key)
    expect(out).toEqual([{ t: 'de el → del', n: 3, at: 50 }])
  })

  it('keeps accent-different slips apart and orders by last seen', () => {
    const out = mergeGrammarLogs([{ t: 'use él', at: 30 }], [{ t: 'use el', at: 20 }], key)
    expect(out.map((e) => e.t)).toEqual(['use el', 'use él'])
  })

  it('caps to the newest entries and ignores junk', () => {
    const many = Array.from({ length: 5 }, (_, i) => ({ t: `s${i}`, at: i }))
    expect(mergeGrammarLogs(many, [null, { n: 2 }], key, 3).map((e) => e.t)).toEqual(['s2', 's3', 's4'])
    expect(mergeGrammarLogs(null, 'x', key)).toEqual([])
  })
})
