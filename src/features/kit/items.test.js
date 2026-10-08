import { describe, it, expect, vi, beforeEach } from 'vitest'

// A deck of 1000 cards where only the last 30 ids were ever studied (a mostly-new deck).
const ALL = Array.from({ length: 1000 }, (_, i) => i + 1)
const SEEN = new Set(ALL.slice(-30))
const DUE = [995, 996]
let infoCalls = 0
vi.mock('../../cards', () => ({
  srs: {
    findCards: async (q) => (q.state === 'due' ? DUE : ALL),
    cardsInfo: async (ids) => { infoCalls++; return ids.map((id) => ({ cardId: id, type: SEEN.has(id) ? 2 : 0, fields: { F: { value: `w${id}` } } })) },
  },
}))
vi.mock('./practiceLogStore', () => ({ readPracticeLog: async () => null }))

const { pickCardItems } = await import('./items')
const ctx = {
  ankiConnected: true,
  subject: { deck: 'D' },
  cards: { noteText: (c) => ({ front: c.fields.F.value, back: 'b', fieldNames: ['F'] }) },
}

describe('pickCardItems', () => {
  beforeEach(() => { infoCalls = 0 })
  it('finds studied cards in a mostly-new deck by scanning in batches', async () => {
    const items = await pickCardItems(ctx, 5)
    expect(items).toHaveLength(5)
    for (const it of items) expect(SEEN.has(it.cardId)).toBe(true)
    expect(items[0]).toEqual(expect.objectContaining({ front: expect.any(String), back: 'b', fieldNames: ['F'] }))
  })
  it('includes the due cards asked for, never twice, and stays capped', async () => {
    const items = await pickCardItems(ctx, 30, { due: 2 })
    const ids = items.map((x) => x.cardId)
    expect(ids).toEqual(expect.arrayContaining(DUE))
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.length).toBeLessThanOrEqual(30)
    expect(infoCalls).toBeLessThanOrEqual(12)
  })
  it('takes one card per note: a reversed note never drills the same word twice', async () => {
    // Every studied card has a sibling (the same note, the same fields).
    const sib = { ...ctx, cards: { noteText: (c) => ({ front: `w${Math.ceil(c.cardId / 2)}`, back: 'b', fieldNames: ['F'] }) } }
    const items = await pickCardItems(sib, 30)
    const fronts = items.map((x) => x.front)
    expect(fronts.length).toBeGreaterThan(0)
    expect(new Set(fronts).size).toBe(fronts.length)
  })
  it('returns [] without a card store or deck', async () => {
    expect(await pickCardItems({ ...ctx, ankiConnected: false }, 5)).toEqual([])
    expect(await pickCardItems({ ...ctx, subject: {} }, 5)).toEqual([])
  })
})
