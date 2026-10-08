import { describe, it, expect, vi, beforeEach } from 'vitest'

// The store is replaced by a recorder: the event handlers' job is to route misses to the right mode's list.
const calls = []
vi.mock('./store', () => ({
  GYM_FEATURE_ID: 'mistake-gym',
  configureGym: () => {},
  updateMistakes: (mode, fn) => { calls.push({ mode, fn }); return Promise.resolve() },
  useMistakes: () => ({ list: null, failed: false }),
  loadMistakes: () => Promise.resolve(null),
}))
vi.mock('./GymScreen', () => ({ default: () => null, GymBadge: () => null }))

const { default: gym } = await import('./index')
const { EVENTS } = await import('../events')
const { addMisses, applyPractice, pickForWorkout, shapeList, emptyList, FIELD_MAX } = await import('./mistakes')
const { buildWorkoutPrompt } = await import('./prompt')
const { logPractice, lastPracticed, rankFresh, recentTopics, shapeLog, emptyLog } = await import('../kit/practiceLog')
const { parseRuleCard } = await import('../kit/ruleCard')

beforeEach(() => { calls.length = 0 })

describe('misses reach the gym', () => {
  it('Study grades land in the mode they came from', () => {
    gym.on[EVENTS.CARD_GRADED]({ mode: 42, front: 'perro', back: 'dog', misses: [{ question: 'q', answer: 'gato', expected: 'perro' }] }, {})
    expect(calls).toHaveLength(1)
    expect(calls[0].mode).toBe(42)
    expect(calls[0].fn(emptyList()).items[0]).toMatchObject({ front: 'perro', question: 'q', answer: 'gato' })
  })
  it('other activities add theirs; the gym never feeds itself', () => {
    gym.on[EVENTS.PRACTICE_MISSED]({ source: 'scenes', mode: 7, misses: [{ front: 'a', question: 'qa' }, { front: 'b', question: 'qb' }] }, {})
    gym.on[EVENTS.PRACTICE_MISSED]({ source: 'mistake-gym', mode: 7, misses: [{ front: 'c', question: 'qc' }] }, {})
    expect(calls).toHaveLength(1)
    expect(calls[0].fn(emptyList()).items.map((m) => m.front).sort()).toEqual(['a', 'b'])
  })
  it('a grade with no misses writes nothing', () => {
    gym.on[EVENTS.CARD_GRADED]({ mode: 1, misses: [] }, {})
    gym.on[EVENTS.PRACTICE_MISSED]({ source: 'x', mode: 1, misses: [] }, {})
    expect(calls).toHaveLength(0)
  })
})

describe('a damaged mistake list never blocks new mistakes', () => {
  const junk = { items: [null, 'x', 42, { question: '' }, { front: 'ok', question: 'kept', at: 'soon', n: 'lots' }, { front: { a: 1 }, question: ['q'] }] }
  it('shapes junk out and keeps usable rows', () => {
    const l = shapeList(junk)
    expect(l.items).toHaveLength(1)
    expect(l.items[0]).toMatchObject({ front: 'ok', question: 'kept', n: 1, cleared: 0 })
    expect(typeof l.items[0].at).toBe('number')
    expect(typeof l.items[0].id).toBe('string')
    expect(shapeList(null)).toEqual(emptyList())
    expect(shapeList({ items: 'nope' })).toEqual(emptyList())
  })
  it('adding, practicing and picking all work over a damaged list', () => {
    const l = addMisses(junk, { front: 'new', misses: [{ question: 'fresh' }] }, 5)
    expect(l.items.map((m) => m.question)).toEqual(['fresh', 'kept'])
    expect(() => applyPractice(junk, [{ target: 'x', correct: true }])).not.toThrow()
    expect(() => pickForWorkout(junk, 8, { log: { items: [null, 5] } })).not.toThrow()
  })
  it('rows without a time sort after dated ones', () => {
    const l = addMisses({ items: [{ id: 'a', front: 'f', question: 'old' }] }, { front: 'g', misses: [{ question: 'new' }] }, 100)
    expect(l.items[0].question).toBe('new')
  })
})

describe('size stays bounded over long use', () => {
  it('caps every stored field', () => {
    const big = 'x'.repeat(20000)
    const [m] = addMisses(emptyList(), { front: big, back: big, misses: [{ question: big, answer: big, expected: big, feedback: big }] }, 1).items
    for (const k of ['front', 'back', 'question', 'answer', 'expected', 'feedback']) expect(m[k].length).toBeLessThanOrEqual(FIELD_MAX[k])
  })
  it('a long question still dedupes against itself', () => {
    const q = 'y'.repeat(5000)
    let l = addMisses(emptyList(), { front: 'f', misses: [{ question: q }] }, 1)
    l = addMisses(l, { front: 'f', misses: [{ question: q }] }, 2)
    expect(l.items).toHaveLength(1)
    expect(l.items[0].n).toBe(2)
  })
})

describe('workout prompt', () => {
  const subj = { name: 'Spanish', isLanguage: true, learnLang: 'Spanish', userLang: 'English' }
  it('says "no answer" instead of an empty answer line (Ebi Call misses)', () => {
    const { user } = buildWorkoutPrompt(subj, [{ id: 'a', front: 'perro', question: 'Say it', answer: '' }])
    expect(user).toMatch(/learner answered: \(no answer\)/)
    expect(user).not.toMatch(/learner answered: \n/)
  })
})

describe('practice log over damaged data', () => {
  const junk = { items: [null, 7, { kind: 'card', key: 'a', at: 5, label: 'a' }, { kind: 'card' }] }
  it('reads, ranks and records without throwing', () => {
    expect(lastPracticed(junk, 'a')).toBe(5)
    expect(() => rankFresh([{ front: 'a' }, { front: 'b' }], junk, { now: 10 })).not.toThrow()
    expect(() => recentTopics(junk)).not.toThrow()
    const l = logPractice(junk, [{ label: 'b' }], 9)
    expect(l.items.every((x) => x && typeof x === 'object' && x.key)).toBe(true)
  })
  it('shapes a damaged log', () => {
    expect(shapeLog(junk).items).toHaveLength(1)
    expect(shapeLog('x')).toEqual(emptyLog())
  })
})

describe('rule card replies', () => {
  it('reads a skip written as text', () => {
    expect(parseRuleCard({ skip: 'yes', why: 'a typo' })).toMatchObject({ skip: true })
    expect(parseRuleCard({ skip: 'True' })).toMatchObject({ skip: true })
  })
  it('reads tags sent as one string', () => {
    expect(parseRuleCard({ front: 'f?', back: 'b', tags: 'Accents, ser estar' }).tags).toEqual(['ebiki', 'rule', 'accents', 'ser-estar'])
  })
})
