import { describe, it, expect } from 'vitest'
import { createMap, applyAreaDetail, normalizeMap } from './map'
import { cheatCompleteNode, cheatCompleteArea, cheatUnlockTo, cheatResetNode, cheatResetArea, cheatClearArea } from './cheats'

const plan = [1, 2, 3].map((i) => ({ title: `Area ${i}`, theme: 't', motif: 'city', palette: 'brand' }))
const detail = {
  items: [{ id: 'x1', kind: 'term', front: 'a', back: 'b' }, { id: 'x2', kind: 'term', front: 'c', back: 'd' }],
  nodes: [{ id: 'n1', kind: 'learn', itemIds: ['x1'] }, { id: 'n2', kind: 'practice', itemIds: ['x2'] }, { id: 'boss', kind: 'boss', itemIds: ['x1', 'x2'] }],
}
const mapWithDetail = () => {
  let m = createMap({ modeId: 1, subject: { name: 'S' }, start: null, plan })
  for (const a of m.areas) m = applyAreaDetail(normalizeMap({ ...m, areas: m.areas.map((x) => (x.id === a.id ? { ...x } : x)) }), a.id, detail)
  return m
}
const area = (m, k) => m.areas[k]
const node = (m, k, id) => area(m, k).nodes.find((n) => n.id === id)

describe('Legends cheats', () => {
  it('completes a locked step, and the boss finishes its area', () => {
    let m = mapWithDetail()
    expect(node(m, 0, 'n2').status).toBe('locked')
    m = cheatCompleteNode(m, area(m, 0).id, 'n2')
    expect(node(m, 0, 'n2')).toMatchObject({ status: 'done', stars: 3 })
    m = cheatCompleteNode(m, area(m, 0).id, 'boss')
    expect(area(m, 0).status).toBe('done')
    expect(area(m, 1).status).toBe('open')
  })
  it('completes an area and unlocks a later one', () => {
    let m = mapWithDetail()
    m = cheatCompleteArea(m, area(m, 0).id)
    expect(area(m, 0).nodes.every((n) => n.status === 'done')).toBe(true)
    m = cheatUnlockTo(mapWithDetail(), area(m, 2).id)
    expect(m.areas.map((a) => a.status)).toEqual(['done', 'done', 'open'])
  })
  it('resets a step and an area', () => {
    const m0 = mapWithDetail()
    const id = area(m0, 0).id
    let m = cheatCompleteArea(m0, id)
    expect(area(m, 0).status).toBe('done')
    m = cheatResetNode(m, id, 'boss')
    expect(area(m, 0).status).toBe('open')
    expect(node(m, 0, 'boss').status).not.toBe('done')
    m = cheatResetArea(cheatCompleteArea(m, id), id)
    expect(area(m, 0)).toMatchObject({ status: 'open', frozen: false })
    expect(area(m, 0).nodes.filter((n) => n.status === 'done')).toHaveLength(0)
  })
  it('clears an area so it can be written again', () => {
    const m0 = mapWithDetail()
    const m = cheatClearArea(m0, area(m0, 1).id)
    expect(area(m, 1)).toMatchObject({ detailed: false, frozen: false, items: [], nodes: [] })
    expect(applyAreaDetail(m, area(m, 1).id, detail).areas[1].detailed).toBe(true)
  })
})
