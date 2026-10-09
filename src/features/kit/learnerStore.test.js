import { describe, it, expect, vi, beforeEach } from 'vitest'

// An in-memory feature store standing in for /api/feature-data: `disk` is what another computer may change.
const disk = new Map()
let refuseWrites = false
let readGate = null // a promise a read waits on (a slow read racing a write)
vi.mock('../storage', () => ({
  featureStore: () => ({
    read: async (key) => { const v = disk.has(key) ? structuredClone(disk.get(key)) : null; if (readGate) await readGate; return { ok: true, value: v } },
    write: async (key, value) => { if (refuseWrites) return false; disk.set(key, structuredClone(value)); return true },
  }),
}))
vi.mock('./learnerContextUse', () => ({ learnerContextText: () => '' }))

const { updateLearner, readLearner } = await import('./learnerStore')
const { newLearner, applyLearnerDelta } = await import('./learner')
const { EVENTS } = await import('../events')

const ctxWith = (emitted) => ({ subject: { modeId: 5 }, emit: (ev, p) => emitted.push([ev, p]) })
const nudge = (d) => (m) => (m ? applyLearnerDelta(m, d, 'study') : m)

describe('learner store: LEVEL_UP and shared-folder writes', () => {
  beforeEach(() => { disk.clear(); refuseWrites = false })

  it('fires once per new whole level above the best ever reached, never for a first level or a re-climb', async () => {
    const ev = []
    const ctx = ctxWith(ev)
    await updateLearner(ctx, 5, () => newLearner({ level: 40.5 }))  // a first level: no reward
    expect(ev).toHaveLength(0)
    await updateLearner(ctx, 5, nudge(0.3))                          // 40.8: same whole level
    expect(ev).toHaveLength(0)
    await updateLearner(ctx, 5, nudge(0.4))                          // 41.2: a new whole level
    expect(ev.map(([e]) => e)).toEqual([EVENTS.LEVEL_UP])
    expect(Math.floor(ev[0][1].to) - Math.floor(ev[0][1].from)).toBe(1)
    await updateLearner(ctx, 5, nudge(-2))                           // falls back to 39.2
    await updateLearner(ctx, 5, nudge(2.5))                          // climbs again to 41.7
    expect(ev).toHaveLength(1)                                       // still whole level 41: re-climbing pays nothing
    await updateLearner(ctx, 5, nudge(0.5))                          // 42.2: a NEW whole level
    expect(ev).toHaveLength(2)
  })

  it('quiet writes (placement, cheats) never fire it', async () => {
    const ev = []
    await updateLearner(ctxWith(ev), 5, () => newLearner({ level: 10 }))
    await updateLearner(ctxWith(ev), 5, (m) => ({ ...m, level: 30, peak: 30 }), { quiet: true })
    expect(ev).toHaveLength(0)
  })

  it('reads again before every write: another computer\'s level is the base, never overwritten by a stale copy', async () => {
    const ev = []
    await updateLearner(ctxWith(ev), 5, () => newLearner({ level: 10 }))
    expect((await readLearner(ctxWith(ev), 5)).value.level).toBe(10) // this page's cache says 10
    disk.set('level-5', newLearner({ level: 60 }))                    // the other computer's placement result
    await updateLearner(ctxWith(ev), 5, nudge(0.2))
    expect(disk.get('level-5').level).toBeCloseTo(60.2)
  })

  it('a refused write reports false and leaves the shown level alone', async () => {
    const ev = []
    await updateLearner(ctxWith(ev), 5, () => newLearner({ level: 20 }))
    refuseWrites = true
    expect(await updateLearner(ctxWith(ev), 5, nudge(5))).toBe(false)
    expect((await readLearner(ctxWith(ev), 5)).value.level).toBe(20)
    expect(ev).toHaveLength(0)
  })

  it('a slow plain read that started before a write never brings the old level back', async () => {
    const ev = []
    disk.set('level-7', newLearner({ level: 30 }))
    let open
    readGate = new Promise((r) => { open = r })
    const slow = readLearner({ subject: { modeId: 7 } }, 7)        // reads 30, then waits
    readGate = null
    await updateLearner(ctxWith(ev), 7, nudge(1.5))                // 31.5 written and cached meanwhile
    open()
    expect((await slow).value.level).toBeCloseTo(31.5)
    expect((await readLearner({ subject: { modeId: 7 } }, 7)).value.level).toBeCloseTo(31.5)
  })
})
