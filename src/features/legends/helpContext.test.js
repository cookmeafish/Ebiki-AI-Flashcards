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
