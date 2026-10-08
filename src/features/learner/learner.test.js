import { describe, it, expect, vi, beforeEach } from 'vitest'

// The store answers what each test says: a refused write first, then a stored one.
const writes = []
let answers = []
let stored = { level: 10 }
vi.mock('../kit/learnerStore', () => ({
  readLearner: async () => ({ ok: true, value: stored }),
  updateLearner: async (ctx, modeId, fn) => {
    const ok = answers.length ? answers.shift() : true
    writes.push({ modeId, ok, next: fn(stored) })
    return ok
  },
}))
const judge = vi.fn(async () => ({ error: 'thin' }))
vi.mock('../kit/evidenceJudge', () => ({ judgeLevelFromEvidence: (...a) => judge(...a) }))

const { default: feature, setLiveCtx } = await import('./index.js')
const { EVENTS } = await import('../events')

describe('learner study batches', () => {
  beforeEach(() => { writes.length = 0; answers = []; stored = { level: 10 }; judge.mockClear(); vi.useFakeTimers() })

  it('a refused batch write is tried again while the page lives', async () => {
    answers = [false, true]
    const ctx = { subject: { modeId: 7 }, ai: { hasKey: false } }
    for (let i = 0; i < 25; i++) feature.on[EVENTS.CARD_GRADED]({ correct: true, mode: 7 }, ctx) // 25 = flush at once
    await vi.advanceTimersByTimeAsync(0)
    expect(writes).toHaveLength(1)
    expect(writes[0].ok).toBe(false)
    await vi.advanceTimersByTimeAsync(20000)
    expect(writes).toHaveLength(2)
    expect(writes[1].ok).toBe(true)
    expect(writes[1].next.level).toBeCloseTo(writes[0].next.level) // the same 25 cards, not lost and not doubled
    await vi.advanceTimersByTimeAsync(60000)
    expect(writes).toHaveLength(2)
    vi.useRealTimers()
  })

  // The ctx a graded card arrived with is an old render's: after switching to another mode, the batch flush 20s
  // later still saw the old mode as "active" and seeded it from evidence.
  it('never seeds a mode the learner switched away from before the batch flushed', async () => {
    stored = null // no level yet: a flush would try to seed
    judge.mockImplementation(async () => ({ level: 40, confidence: 0.5, strengths: [], gaps: [] }))
    const oldCtx = { subject: { modeId: 21 }, ai: { hasKey: true } }
    setLiveCtx(oldCtx)
    feature.on[EVENTS.CARD_GRADED]({ correct: true, mode: 21 }, oldCtx)
    setLiveCtx({ subject: { modeId: 22 }, ai: { hasKey: true } }) // the learner switched modes
    await vi.advanceTimersByTimeAsync(20000)
    expect(judge).not.toHaveBeenCalled()
    // Back on the mode: the next flush seeds it (once).
    setLiveCtx(oldCtx)
    feature.on[EVENTS.CARD_GRADED]({ correct: true, mode: 21 }, oldCtx)
    await vi.advanceTimersByTimeAsync(20000)
    expect(judge).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})
