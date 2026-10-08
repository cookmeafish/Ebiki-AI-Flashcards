import { describe, it, expect } from 'vitest'
import { celebrateWait, CELEBRATE_SETTLE_MS } from './celebrate'

describe('celebrateWait', () => {
  it('shows nothing when nothing is owed', () => {
    expect(celebrateWait({ owed: false, busy: false, freeSince: 0, now: 99999 })).toBe(-1)
  })
  it('never shows while a fight, quiz or study question is busy', () => {
    expect(celebrateWait({ owed: true, busy: true, freeSince: 0, now: 99999 })).toBe(-1)
  })
  it('waits the full settle time right after the user became free (a gap between batches is not "done")', () => {
    expect(celebrateWait({ owed: true, busy: false, freeSince: 1000, now: 1000 })).toBe(CELEBRATE_SETTLE_MS)
    expect(celebrateWait({ owed: true, busy: false, freeSince: 1000, now: 1500 })).toBe(CELEBRATE_SETTLE_MS - 500)
  })
  it('shows at once once the user has been free long enough', () => {
    expect(celebrateWait({ owed: true, busy: false, freeSince: 1000, now: 1000 + CELEBRATE_SETTLE_MS })).toBe(0)
    expect(celebrateWait({ owed: true, busy: false, freeSince: 0, now: 10 * CELEBRATE_SETTLE_MS })).toBe(0)
  })
  it('treats an unknown free time as "just became free"', () => {
    expect(celebrateWait({ owed: true, busy: false, freeSince: NaN, now: 5 })).toBe(CELEBRATE_SETTLE_MS)
  })
})
