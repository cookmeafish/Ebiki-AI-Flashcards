import { describe, it, expect } from 'vitest'
import { mergeUsage, DAYS_KEPT } from './usageMerge'

describe('mergeUsage', () => {
  it('adds per model, per job and per day', () => {
    const out = mergeUsage({ since: 'x', byModel: {} }, [
      { provider: 'openai', model: 'gpt-x', input: 100, output: 10, job: 'chat.reply' },
      { provider: 'openai', model: 'gpt-x', input: 50, output: 5, job: 'chat.reply' },
      { provider: 'openai', model: 'gpt-x', input: 1, output: 1 },
    ], { today: '2026-11-15', now: 7 })
    expect(out.byModel['openai|gpt-x']).toMatchObject({ input: 151, output: 16, calls: 3 })
    expect(out.byJob['chat.reply']['openai|gpt-x']).toEqual({ input: 150, output: 15, calls: 2, last: 7 })
    expect(out.byDay['2026-11-15']['openai|gpt-x']).toEqual({ input: 151, output: 16, calls: 3 })
    expect(out.since).toBe('x')
  })
  it('skips junk and reads counts saved as text as numbers', () => {
    const out = mergeUsage({ byModel: { 'openai|m': { provider: 'openai', model: 'm', input: '5', output: 0, calls: '1' } } }, [
      { provider: 'openai', model: 'm', input: 3, output: 0, job: '../evil' },
      { provider: 'BAD!', model: 'm', input: 3 },
      null,
    ], { today: 'not a day' })
    expect(out.byModel['openai|m']).toMatchObject({ input: 8, calls: 2 })
    expect(out.byJob).toBeUndefined()
    expect(out.byDay).toBeUndefined()
  })
  it(`keeps only the last ${DAYS_KEPT} days`, () => {
    const days = Array.from({ length: DAYS_KEPT + 5 }, (_, i) => new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10))
    const start = Object.fromEntries(days.map((d) => [d, {}]))
    const out = mergeUsage({ byModel: {}, byDay: start }, [{ provider: 'openai', model: 'm', input: 1 }], { today: '2026-12-31' })
    expect(Object.keys(out.byDay)).toHaveLength(DAYS_KEPT)
    expect(out.byDay['2026-12-31']).toBeTruthy()
    expect(out.byDay[days[0]]).toBeUndefined()
  })
})
