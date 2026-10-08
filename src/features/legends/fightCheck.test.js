import { describe, it, expect } from 'vitest'
import { FIGHT_EXTRAS, fightExtrasFor, isWrongish, expectedOf, needsRecheck, appealOpen, appealOffered, debriefEntries, resolveFightQuestion, learnItemFor, missRowParts, arenaPinMode } from './fightCheck'

const OFF = Object.fromEntries(Object.keys(FIGHT_EXTRAS).map((k) => [k, false]))

describe('fight extras switches', () => {
  it('every piece is on by default', () => {
    for (const k of ['recheck', 'refund', 'appeal', 'learnIt', 'debrief', 'taunts']) expect(FIGHT_EXTRAS[k], k).toBe(true)
  })
  it('taunts follow the user setting and focus mode', () => {
    expect(fightExtrasFor({}).taunts).toBe(true)
    expect(fightExtrasFor({ taunts: false }).taunts).toBe(false)
    expect(fightExtrasFor({}, { focus: true }).taunts).toBe(false)
    expect(fightExtrasFor({}, {}, { ...FIGHT_EXTRAS, taunts: false }).taunts).toBe(false)
  })
})

describe('second looks', () => {
  it('re-checks only AI misses/glancing answers with an answer and a key', () => {
    const base = { viaAi: true, verdict: 'miss', answer: 'x', hasKey: true }
    expect(needsRecheck(base)).toBe(true)
    expect(needsRecheck({ ...base, verdict: 'glancing' })).toBe(true)
    expect(needsRecheck({ ...base, verdict: 'clean' })).toBe(false)
    expect(needsRecheck({ ...base, viaAi: false })).toBe(false)
    expect(needsRecheck({ ...base, answer: '  ' })).toBe(false)
    expect(needsRecheck({ ...base, hasKey: false })).toBe(false)
    expect(needsRecheck(base, OFF)).toBe(false)
  })
  it('an appeal starts once (a failed one may retry) and never on a right answer', () => {
    expect(appealOpen({ appeal: null })).toBe(true)
    expect(appealOpen({ appeal: 'failed' })).toBe(true)
    for (const a of ['pending', 'won', 'lost']) expect(appealOpen({ appeal: a })).toBe(false)
    expect(appealOpen({ overturned: true })).toBe(false)
    expect(appealOpen(null)).toBe(false)
    expect(appealOpen({}, OFF)).toBe(false)
  })
  it('the Appeal button waits for the automatic re-check and needs an answer and a key', () => {
    const e = { answer: 'x', status: 'idle' }
    expect(appealOffered(e, { hasKey: true })).toBe(true)
    expect(appealOffered(e, { hasKey: false })).toBe(false)
    expect(appealOffered({ ...e, status: 'checking' }, { hasKey: true })).toBe(false)
    expect(appealOffered({ ...e, answer: '' }, { hasKey: true })).toBe(false)
  })
  it('the debrief lists applied misses and glancing answers', () => {
    const list = [{ first: 'miss', attached: true }, { first: 'clean', attached: true }, { first: 'glancing', attached: false }, { first: 'glancing', attached: true }]
    expect(debriefEntries(list)).toEqual([list[0], list[3]])
    expect(debriefEntries(list, OFF)).toEqual([])
    expect(isWrongish('miss') && isWrongish('glancing') && !isWrongish('clean')).toBe(true)
  })
})

describe('resolveFightQuestion', () => {
  it('cancels the attack of an overturned answer and fills a written follow-up', () => {
    const cancelled = new Set(['a1'])
    const fixes = new Map([['a2', { prompt: 'Fix it', accepted: ['ok'] }]])
    expect(resolveFightQuestion({ _attackOf: 'a1', prompt: 'p' }, cancelled, fixes)).toBe(null)
    expect(resolveFightQuestion({ _pending: 'a1' }, cancelled, fixes)).toBe(null)
    expect(resolveFightQuestion({ _pending: 'a3' }, cancelled, fixes)).toBe(null) // not written in time
    expect(resolveFightQuestion({ _pending: 'a2', kind: 'typed' }, cancelled, fixes)).toEqual({ kind: 'typed', prompt: 'Fix it', accepted: ['ok'] })
    const q = { prompt: 'plain' }
    expect(resolveFightQuestion(q, cancelled, fixes)).toBe(q)
    expect(resolveFightQuestion(null)).toBe(null)
  })
})

describe('learnItemFor', () => {
  const q = { kind: 'typed', prompt: 'Which port?', accepted: ['22'] }
  it('uses the card or item, else the question and its answer', () => {
    expect(learnItemFor({ front: 'SSH', back: 'port 22', noteId: 5 }, q)).toEqual({ front: 'SSH', back: 'port 22', noteId: 5 })
    expect(learnItemFor({ front: 'hola', back: 'hello', cardNoteId: 9 }, q, { noteKey: 'cardNoteId' })).toEqual({ front: 'hola', back: 'hello', noteId: 9 })
    expect(learnItemFor({ front: 'hola', back: 'hello' }, q, { noteKey: 'cardNoteId' }).noteId).toBe(null)
    expect(learnItemFor(null, q)).toEqual({ front: 'Which port?', back: '22' })
    expect(learnItemFor(undefined, null, { fallback: { front: 'a', back: 'b' } })).toEqual({ front: 'a', back: 'b' })
    expect(expectedOf({ kind: 'choice', choices: ['x', 'y'], answerIdx: 1 })).toBe('y')
  })

  it('a miss row hides the grader note and the rule card once the answer was found right', () => {
    const miss = { first: 'miss', note: 'Not the word asked for.', overturned: false }
    expect(missRowParts(miss, { rule: true, hasKey: true })).toEqual({ note: true, ruleCard: true })
    expect(missRowParts(miss, { rule: true, hasKey: false }).ruleCard).toBe(false)
    expect(missRowParts(miss).ruleCard).toBe(false)
    expect(missRowParts({ ...miss, overturned: true }, { rule: true, hasKey: true })).toEqual({ note: false, ruleCard: false })
    expect(missRowParts({ ...miss, note: '  ' }).note).toBe(false)
    expect(missRowParts(null)).toEqual({ note: false, ruleCard: false })
  })
})

describe('arenaPinMode', () => {
  it('pins everything while it fits in 40% of the screen', () => {
    expect(arenaPinMode(200, 80, 1000)).toBe('all')
    expect(arenaPinMode(200, 0, 500)).toBe('all')
  })
  it('lets the taunt and notice scroll when only the arena fits', () => {
    expect(arenaPinMode(200, 120, 600)).toBe('arena')
  })
  it('unpins an arena too tall on its own', () => {
    expect(arenaPinMode(260, 0, 600)).toBe('none')
    expect(arenaPinMode(260, 90, 600)).toBe('none')
  })
  it('pins while the screen is not measured', () => {
    expect(arenaPinMode(260, 90, 0)).toBe('all')
  })
})
