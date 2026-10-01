// Fixes from a full review of Legends (2026-09).
import { describe, it, expect } from 'vitest'
import { shapeMap, needsMoreAreas } from './map'
import { itemIdFor } from './prompt'

const area = (id, done = 0, status = 'open') => ({ id, title: id, status, detailed: true, items: [], nodes: Array.from({ length: 3 }, (_, i) => ({ id: `${id}-n${i}`, kind: 'learn', status: i < done ? 'done' : 'locked' })) })

describe('review fixes', () => {
  it('keeps one copy of an area a merge listed twice: the more finished one, in the first place', () => {
    const m = shapeMap({ version: 1, areas: [area('a', 1), area('b'), area('a', 3)] })
    expect(m.areas.map((a) => a.id)).toEqual(['a', 'b'])
    expect(m.areas[0].nodes.filter((n) => n.status === 'done').length).toBe(3)
  })
  it('refuses a map from a newer build (never treated as "no map")', () => {
    expect(shapeMap({ version: 99, areas: [area('a')] })).toBeNull()
  })
  it('keeps planning once every area is finished (no dead end after a failed plan)', () => {
    expect(needsMoreAreas({ areas: [area('a', 3, 'done'), area('b', 3, 'done')] })).toBe(true)
    expect(needsMoreAreas({ areas: [area('a', 3, 'done'), area('b'), area('c', 0, 'locked')] })).toBe(false)
  })
  it('never matches a one or two letter target to an item', () => {
    const items = [{ id: 'i1', front: 'la manzana' }, { id: 'i2', front: 'el pan' }]
    expect(itemIdFor({ target: 'a' }, items)).toBe('')
    expect(itemIdFor({ target: 'el' }, items)).toBe('')
    expect(itemIdFor({ target: 'manzana' }, items)).toBe('i1')
    expect(itemIdFor({ target: 'el pan' }, items)).toBe('i2')
  })
})
