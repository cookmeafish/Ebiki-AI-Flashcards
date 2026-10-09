import { describe, it, expect, vi } from 'vitest'

// A closed page left a batch on the device whose write had ALREADY landed (the page died before it could clear the
// entry). The next page adopts it: it must keep its id, so the store applies it once, not twice.
const mem = new Map()
const memKv = {
  get: (k) => (mem.has(k) ? mem.get(k) : null), set: (k, v) => { mem.set(k, String(v)); return true }, remove: (k) => { mem.delete(k) },
  getJson: (k, f = null) => (mem.has(k) ? JSON.parse(mem.get(k)) : f), setJson: (k, v) => { mem.set(k, JSON.stringify(v)); return true },
}
const { setPlatform } = await import('../../platform')
setPlatform({ kv: memKv })
mem.set('ebiki-learner-pending', JSON.stringify([
  { owner: 'closedpage', seenAt: 0, id: 'closedpage-3', modeId: 7, total: 10, correct: 10 }, // sent, landed
  { owner: 'closedpage', seenAt: 0, modeId: 7, total: 4, correct: 4 },                        // never sent
]))

// The store, in memory, with the real at-most-once rule: an applied batch id writes nothing.
let level = 10
const applied = new Set(['closedpage-3'])
const writes = []
vi.mock('../kit/learnerStore', () => ({
  readLearner: async () => ({ ok: true, value: { level } }),
  updateLearner: async (ctx, modeId, fn, opts = {}) => {
    if (opts.batchId && applied.has(opts.batchId)) { writes.push({ id: opts.batchId, skipped: true }); return true }
    const next = fn({ level })
    level = next.level
    if (opts.batchId) applied.add(opts.batchId)
    writes.push({ id: opts.batchId, skipped: false })
    return true
  },
}))
vi.mock('../kit/evidenceJudge', () => ({ judgeLevelFromEvidence: async () => ({ error: 'thin' }) }))

const { seedActiveMode } = await import('./index.js')

describe('adopted learner batches', () => {
  it('an adopted batch whose write already landed is not counted again; unsent counts are', async () => {
    vi.useFakeTimers()
    seedActiveMode({ subject: { modeId: 7 }, ai: { hasKey: false } })
    await vi.advanceTimersByTimeAsync(20000)
    const landed = writes.filter((w) => w.id === 'closedpage-3')
    expect(landed).toEqual([{ id: 'closedpage-3', skipped: true }])     // same id, a no-op
    const fresh = writes.filter((w) => w.id !== 'closedpage-3')
    expect(fresh).toHaveLength(1)                                       // the 4 never-sent cards, in a new batch
    expect(fresh[0].skipped).toBe(false)
    expect(level).toBeGreaterThan(10)
    expect(level).toBeCloseTo(10.8)                                     // 4 cards (0.2 each), not 14
    expect(mem.has('ebiki-learner-pending')).toBe(false)               // nothing left on the device
    vi.useRealTimers()
  })
})
