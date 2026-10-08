import { describe, it, expect } from 'vitest'
import { addRestDate, addDays, computeStreak, REST_DATES_MAX } from './engine'

const TODAY = '2026-10-07'
const player = (days, restDates) => ({
  id: 'p1',
  days: Object.fromEntries(Object.entries(days).map(([k, xp]) => [k, { m1: { xp } }])),
  restDates,
})

describe('addRestDate', () => {
  it('adds a future date, sorted, and refuses past, repeated or empty picks', () => {
    const p = player({}, ['2026-10-20'])
    expect(addRestDate(p, '2026-10-10', TODAY)).toEqual(['2026-10-10', '2026-10-20'])
    expect(addRestDate(p, '2026-10-01', TODAY)).toBeNull()
    expect(addRestDate(p, '2026-10-20', TODAY)).toBeNull()
    expect(addRestDate(p, '', TODAY)).toBeNull()
  })

  it('a full list never drops the past rest date that bridges a streak', () => {
    // Played every day from 70 days ago except one gap day, which a rest date covers.
    const start = addDays(TODAY, -70)
    const gap = addDays(TODAY, -65)
    const days = {}
    for (let d = start; d < TODAY; d = addDays(d, 1)) if (d !== gap) days[d] = 10
    // The bridging date is the OLDEST entry; the rest are past days that were played anyway.
    const played = Object.keys(days).sort().filter((d) => d > gap).slice(0, REST_DATES_MAX - 1)
    const p = player(days, [gap, ...played])
    expect(p.restDates.length).toBe(REST_DATES_MAX)
    const before = computeStreak(p, TODAY).streak
    const next = addRestDate(p, addDays(TODAY, 3), TODAY)
    expect(next).toHaveLength(REST_DATES_MAX)
    expect(next).toContain(gap)
    expect(next).toContain(addDays(TODAY, 3))
    expect(computeStreak({ ...p, restDates: next }, TODAY).streak).toBe(before)
  })

  it('drops the oldest bridging date only when nothing else can go', () => {
    const past = Array.from({ length: REST_DATES_MAX }, (_, i) => addDays(TODAY, -(REST_DATES_MAX - i)))
    const days = { [addDays(TODAY, -100)]: 5 } // played long before: every rest date bridges a gap
    const next = addRestDate(player(days, past), addDays(TODAY, 1), TODAY)
    expect(next).toHaveLength(REST_DATES_MAX)
    expect(next[0]).toBe(past[1])
    expect(next[next.length - 1]).toBe(addDays(TODAY, 1))
  })
})
