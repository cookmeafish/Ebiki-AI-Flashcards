import { describe, it, expect } from 'vitest'
import { buildLegendsHelpText } from './helpContext'

const map = {
  start: { reason: 'moving to Texas', goal: 'talk with my uncle' },
  helpers: { scroll: 1, shield: 0 },
  days: { '2026-09-30': 3 },
  areas: [
    { id: 'a', title: 'Greetings', status: 'done', detailed: true, bossName: 'El Saludador', legendary: true,
      nodes: [{ id: 'n1', kind: 'learn', status: 'done', stars: 3 }, { id: 'b', kind: 'boss', status: 'done', stars: 2 }],
      items: [{ id: 'i1', front: 'hola', back: 'hello', seen: 5, right: 5, bossRight: 1 }] },
    { id: 'c', title: 'Numbers', status: 'open', detailed: true,
      nodes: [{ id: 'n2', kind: 'learn', title: 'One to five', status: 'done', stars: 1, attempts: 2 }, { id: 'n3', kind: 'learn', status: 'open' }, { id: 'b2', kind: 'boss', status: 'locked' }],
      items: [{ id: 'j1', front: 'uno', back: 'one', seen: 4, right: 1 }, { id: 'j2', front: 'dos', back: 'two', seen: 0, right: 0 }],
      nemesis: { itemIds: ['j1'] } },
  ],
}
const learner = { level: 42, confidence: 0.5, strengths: [], gaps: ['numbers'], history: [] }

describe('Legends facts for Ebi\'s Help', () => {
  it('describes the map, the level, the current area and its weak items', () => {
    const t = buildLegendsHelpText({ map, learner, isLanguage: true, raid: { boss: 1, day: { date: '2026-10-01', hp: 20, damage: 5, attempts: 1 }, trophies: [{ motif: 'hydra', date: '2026-09-30' }] }, today: '2026-10-01' })
    expect(t).toMatch(/level 42/)
    expect(t).toMatch(/1\/2 areas cleared/)
    expect(t).toMatch(/El Saludador" beaten/)
    expect(t).toMatch(/Legendary challenge won/)
    expect(t).toMatch(/Current area "Numbers"/)
    expect(t).toMatch(/uno: one/) // meanings shared while nothing runs
    expect(t).toMatch(/rematch asks again: uno/)
    expect(t).toMatch(/titan .*health 15\/20/)
    expect(t).toMatch(/1 raid trophies/)
  })
  it('never shares an item\'s meaning while a step or a raid runs', () => {
    for (const view of ['node', 'raid', 'placement']) {
      const t = buildLegendsHelpText({ map, learner, live: { view, node: { kind: 'learn', title: 'Six to ten' }, area: { title: 'Numbers' } } })
      expect(t).not.toMatch(/: one\b/)
      expect(t).not.toMatch(/: two\b/)
      expect(t).not.toMatch(/uno/) // fronts are answers while a question runs (a language card's front IS the answer)
    }
  })
  it('says when there is no map yet', () => {
    expect(buildLegendsHelpText({ map: null, learner: null })).toMatch(/none yet/)
  })
})

describe('Legends facts off the Legends screen', () => {
  it('lists no items (fronts can be another screen\'s answers) and never throws on a damaged map', () => {
    const t = buildLegendsHelpText({ map, learner, onLegends: false })
    expect(t).toMatch(/Numbers/)
    expect(t).not.toMatch(/uno/)
    const bad = { areas: [null, { id: 'x', title: 'X', status: 'open', detailed: true, items: {}, nodes: 'n', canDo: 'text' }] }
    expect(() => buildLegendsHelpText({ map: bad, learner: null })).not.toThrow()
  })
  it('hides meanings while a blitz or the chest runs over the map', () => {
    expect(buildLegendsHelpText({ map, learner, held: true })).not.toMatch(/: one\b/)
  })
})

describe('a long map when the map is not shown', () => {
  const area = (i, status) => ({ id: `a${i}`, title: `Area ${i}`, status, detailed: true, nodes: [{ id: `n${i}`, kind: 'learn', status: status === 'done' ? 'done' : 'open' }], items: [] })
  const big = { areas: Array.from({ length: 20 }, (_, i) => area(i, i < 10 ? 'done' : i === 10 ? 'open' : 'locked')) }
  it('keeps the areas near the current one in full and names the others', () => {
    const t = buildLegendsHelpText({ map: big, learner: null, onLegends: false })
    expect(t).toMatch(/^11\. "Area 10": open, CURRENT/m)
    expect(t).toMatch(/^9\. "Area 8"/m)
    expect(t).not.toMatch(/^1\. "Area 0"/m)
    expect(t).toMatch(/Earlier areas \(8, 8 cleared\): 1\. "Area 0", .*8\. "Area 7"\./)
    expect(t).toMatch(/Later areas \(7, 0 cleared\): 14\. "Area 13", .*20\. "Area 19"\./)
  })
  it('lists every area in full while the map is on screen, and windows it while a raid covers the map', () => {
    expect(buildLegendsHelpText({ map: big, learner: null })).toMatch(/^1\. "Area 0"/m)
    expect(buildLegendsHelpText({ map: big, learner: null, live: { view: 'raid' } })).not.toMatch(/^1\. "Area 0"/m)
  })
  it('a finished map keeps its last areas in full', () => {
    const done = { areas: big.areas.map((a) => ({ ...a, status: 'done' })) }
    const t = buildLegendsHelpText({ map: done, learner: null, onLegends: false })
    expect(t).toMatch(/^20\. "Area 19"/m)
    expect(t).toMatch(/Earlier areas \(17, 17 cleared\)/)
  })
})
