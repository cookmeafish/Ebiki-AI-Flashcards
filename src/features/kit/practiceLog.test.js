import { describe, it, expect } from 'vitest'
import { logPractice, emptyLog, lastPracticed, rankFresh, recentTopics, avoidLine, foldKey, LOG_MAX, COOLDOWN_MS } from './practiceLog'

const DAY = 24 * 60 * 60 * 1000

describe('practice log', () => {
  it('folds case, spacing, punctuation and markup into one key', () => {
    expect(foldKey('  <b>Ser</b> / estar! ')).toBe(foldKey('ser / estar'))
  })
  it('counts repeats instead of duplicating, and keeps cards and topics apart', () => {
    let l = logPractice(emptyLog(), [{ kind: 'card', label: 'perro', src: 'mistake-gym' }], 1)
    l = logPractice(l, [{ kind: 'card', label: 'Perro', src: 'scenes' }, { kind: 'topic', label: 'perro' }], 2)
    expect(l.items.filter((x) => x.kind === 'card')).toHaveLength(1)
    expect(l.items.find((x) => x.kind === 'card')).toMatchObject({ n: 2, at: 2, src: 'scenes' })
    expect(l.items).toHaveLength(2)
  })
  it('stays capped', () => {
    const entries = Array.from({ length: LOG_MAX + 20 }, (_, i) => ({ label: `c${i}` }))
    expect(logPractice(emptyLog(), entries).items).toHaveLength(LOG_MAX)
  })
  it('puts cards practiced recently last, never-practiced first', () => {
    const now = 10 * DAY
    const log = logPractice(logPractice(emptyLog(), [{ label: 'a' }], now - DAY), [{ label: 'b' }], now - 5 * DAY)
    const items = [{ front: 'a' }, { front: 'b' }, { front: 'c' }]
    expect(rankFresh(items, log, { now }).map((x) => x.front)).toEqual(['c', 'b', 'a'])
    expect(rankFresh(items, log, { now, strict: true }).map((x) => x.front)).toEqual(['c', 'b'])
    expect(lastPracticed(log, 'A')).toBe(now - DAY)
    expect(now - lastPracticed(log, 'a') < COOLDOWN_MS).toBe(true)
  })
  it('names recent topics for prompts, not old ones or cards', () => {
    const now = 30 * DAY
    let log = logPractice(emptyLog(), [{ kind: 'topic', label: 'Ordering coffee' }], now - DAY)
    log = logPractice(log, [{ kind: 'topic', label: 'Old trip' }], now - 20 * DAY)
    log = logPractice(log, [{ kind: 'card', label: 'perro' }], now)
    expect(recentTopics(log, { now })).toEqual(['Ordering coffee'])
    expect(avoidLine(['x'])).toMatch(/choose different/)
    expect(avoidLine([])).toBe('')
  })
})
