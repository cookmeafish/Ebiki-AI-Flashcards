import { describe, it, expect } from 'vitest'
import { tallyStudiedCard,
  slug, parseMapPlan, parseAreaDetail, createMap, normalizeMap, shapeMap, needsDetail, applyAreaDetail, applyNodeResult,
  starsFor, adaptiveSplit, mapProgress, weakItems, ensureWeakNodes, applyLegendaryResult, WEAK_BONUS_LIVES, mergeEdit, parseMapEdit, editChanged, appendAreas, needsMoreAreas, currentArea, MAP_VERSION, AREAS,
} from './map'

const id = (s) => s
const plan = (n) => Array.from({ length: n }, (_, i) => ({ title: `Area ${i + 1}`, theme: `theme ${i + 1}`, motif: 'forest', palette: 'ocean' }))
const detailRaw = (n = 6) => ({
  items: Array.from({ length: n }, (_, i) => ({ kind: i === 0 ? 'rule' : 'term', front: `front ${i + 1}`, back: `back ${i + 1}` })),
  nodes: [
    { kind: 'learn', title: 'Meet them', items: [2, 3] },
    { kind: 'practice', title: 'Use them', items: [2, 3] },
    { kind: 'rule', title: 'The rule', items: [1] },
    { kind: 'talk', title: 'Chat', items: [] },
    { kind: 'scene', title: 'A story', items: [4, 5, 6] },
    { kind: 'boss', title: 'ignored: the app adds its own' },
  ],
})
const newMap = () => {
  let m = createMap({ modeId: 7, subject: { name: 'Spanish' }, start: { reason: 'travel' }, plan: plan(4) }, 1)
  for (const a of needsDetail(m)) m = applyAreaDetail(m, a, parseAreaDetail(detailRaw(), id, { areaId: a }), 2)
  return m
}
const clearArea = (m, areaId) => {
  for (const n of m.areas.find((a) => a.id === areaId).nodes) if (!n.optional) m = applyNodeResult(m, areaId, n.id, { total: 10, correct: 10 }).map
  return m
}

describe('parsing the plan', () => {
  it('makes unique readable ids', () => {
    const used = new Set()
    expect(slug('Ça va? Greetings!', used)).toBe('ca-va-greetings')
    expect(slug('Ça va? Greetings!', used)).toBe('ca-va-greetings-2')
    expect(slug('日本語', used)).toBe('area')
  })
  it('keeps valid areas and refuses a plan that is too short', () => {
    expect(parseMapPlan({ areas: plan(2) }, id)).toBeNull()
    const p = parseMapPlan({ areas: [...plan(3), { title: 'Area 1' }, { theme: 'no title' }, { title: 'X', motif: 'moon', palette: 'rgb' }] }, id)
    expect(p.map((a) => a.title)).toEqual(['Area 1', 'Area 2', 'Area 3', 'X'])
    expect(p[3].motif).not.toBe('moon')
    expect(parseMapPlan({ areas: plan(40) }, id)).toHaveLength(AREAS.max)
  })
  it('turns area detail into items and a ladder ending with the boss', () => {
    const d = parseAreaDetail(detailRaw(), id, { areaId: 'a1' })
    expect(d.items).toHaveLength(6)
    expect(d.items[0].id).toBe('a1-i1')
    expect(d.nodes.map((n) => n.kind)).toEqual(['learn', 'rule', 'talk', 'scene', 'weak', 'boss']) // a practice step (re-drill) is dropped
    expect(d.nodes.find((n) => n.kind === 'talk').optional).toBe(true)
    expect(d.nodes.at(-1).itemIds).toHaveLength(6)
    expect(d.nodes.find((n) => n.kind === 'talk').itemIds.length).toBeGreaterThan(0)
  })
  it('teaches every item in exactly one level, and never repeats one', () => {
    const d = parseAreaDetail({
      items: detailRaw(9).items,
      nodes: [
        { kind: 'learn', title: 'A', items: [1, 2] }, { kind: 'learn', title: 'B', items: [2, 3] }, { kind: 'rule', title: 'C', items: [4] },
        { kind: 'talk', title: 'Chat', items: [1, 2] }, { kind: 'scene', title: 'D', items: [5, 6] },
      ],
    }, id, { areaId: 'c' })
    const teaching = d.nodes.filter((n) => !['talk', 'weak', 'boss'].includes(n.kind))
    const taught = teaching.flatMap((n) => n.itemIds)
    expect(new Set(taught).size).toBe(taught.length)            // no item twice
    expect(taught.sort()).toEqual(d.items.map((it) => it.id).sort()) // and none left for the boss alone (7 to 9 got a level)
    expect(teaching[1].itemIds).toEqual(['c-i3'])                 // B lost the repeated item 2
    expect(d.nodes.find((n) => n.kind === 'talk').itemIds).toEqual(['c-i1', 'c-i2']) // Talk practices, teaches nothing
  })
  it('builds a default ladder when the model gave too few steps, and refuses too few items', () => {
    const d = parseAreaDetail({ items: detailRaw(6).items, nodes: [] }, id, { areaId: 'b' })
    expect(d.nodes.filter((n) => n.kind === 'learn').length).toBe(2)
    expect(d.nodes.at(-1).kind).toBe('boss')
    expect(parseAreaDetail({ items: detailRaw(2).items }, id)).toBeNull()
    expect(parseAreaDetail(null, id)).toBeNull()
  })
})

describe('unlocking and progress', () => {
  it('opens only the first area and its first step', () => {
    const m = newMap()
    expect(m.version).toBe(MAP_VERSION)
    expect(m.areas.map((a) => a.status)).toEqual(['open', 'locked', 'locked', 'locked'])
    const nodes = m.areas[0].nodes
    expect(nodes.map((n) => n.status)).toEqual(['open', 'locked', 'open', 'locked', 'locked', 'locked'])
    expect(needsDetail(m)).toEqual([])
    expect(m.areas[1].detailed).toBe(true)
    expect(m.areas[2].detailed).toBe(false)
  })
  it('never asks to detail a frozen or finished area (applyAreaDetail would refuse it: a repeated paid call)', () => {
    let m = createMap({ modeId: 7, subject: { name: 'Spanish' }, plan: plan(4) }, 1)
    m = applyAreaDetail(m, m.areas[0].id, parseAreaDetail(detailRaw(), id, { areaId: m.areas[0].id }), 2)
    // Cheat mode finished area 2 while it was still unbuilt (frozen, done, no nodes).
    m = normalizeMap({ ...m, areas: m.areas.map((a, k) => (k === 1 ? { ...a, frozen: true, status: 'done' } : a)) })
    expect(m.areas[0].status).toBe('open')
    const todo = needsDetail(m)
    expect(todo).toEqual([])
    for (const a of todo) expect(applyAreaDetail(m, a, parseAreaDetail(detailRaw(), id, { areaId: a }))).not.toBe(m)
    // A frozen but unfinished undetailed area ahead is skipped too.
    const m2 = normalizeMap({ ...m, areas: m.areas.map((a, k) => (k === 1 ? { ...a, status: 'locked' } : a)) })
    expect(needsDetail(m2)).toEqual([])
    // An untouched one is still detailed.
    const m3 = normalizeMap({ ...m, areas: m.areas.map((a, k) => (k === 1 ? { ...a, status: 'locked', frozen: false } : a)) })
    expect(needsDetail(m3)).toEqual([m.areas[1].id])
  })
  it('stars and passes by the share right, and a pass opens the next step', () => {
    expect(starsFor(0.5, 'learn')).toBe(0)
    expect(starsFor(0.6, 'learn')).toBe(1)
    expect(starsFor(0.65, 'boss')).toBe(0)
    expect(starsFor(0.85, 'boss')).toBe(2)
    expect(starsFor(1, 'practice')).toBe(3)
    let m = newMap()
    const a = m.areas[0]
    const r = applyNodeResult(m, a.id, a.nodes[0].id, { total: 5, correct: 5, items: [{ itemId: a.items[0].id, correct: true }] })
    expect(r.passed).toBe(true)
    expect(r.stars).toBe(3)
    m = r.map
    expect(m.areas[0].frozen).toBe(true)
    expect(m.areas[0].nodes[1].status).toBe('open')
    expect(m.areas[0].items[0]).toMatchObject({ seen: 1, right: 1 })
  })
  it('a failed attempt counts but keeps the step open and the next locked', () => {
    const m = newMap()
    const a = m.areas[0]
    const r = applyNodeResult(m, a.id, a.nodes[0].id, { total: 5, correct: 1 })
    expect(r.passed).toBe(false)
    expect(r.map.areas[0].nodes[0]).toMatchObject({ status: 'open', attempts: 1 })
    expect(r.map.areas[0].nodes[1].status).toBe('locked')
    expect(r.map.areas[0].frozen).toBe(true)
  })
  it('refuses a locked step', () => {
    const m = newMap()
    const r = applyNodeResult(m, m.areas[0].id, m.areas[0].nodes[1].id, { total: 1, correct: 1 })
    expect(r.map).toBe(m)
  })
  it('the boss opens last; beating it finishes the area and opens the next one', () => {
    let m = newMap()
    const a = m.areas[0]
    for (const n of a.nodes.filter((x) => !x.optional && x.kind !== 'boss')) m = applyNodeResult(m, a.id, n.id, { total: 4, correct: 4 }).map
    expect(m.areas[0].nodes.at(-1).status).toBe('open')
    const r = applyNodeResult(m, a.id, a.nodes.at(-1).id, { total: 15, correct: 12 })
    expect(r.areaDone).toBe(true)
    expect(r.nextAreaId).toBe(m.areas[1].id)
    expect(r.map.areas.map((x) => x.status)).toEqual(['done', 'open', 'locked', 'locked'])
    expect(currentArea(r.map).id).toBe(m.areas[1].id)
    expect(needsDetail(r.map)).toEqual([m.areas[2].id])
    expect(mapProgress(r.map)).toMatchObject({ areasDone: 1, areasTotal: 4 })
  })
  it('asks new or weak items as multiple choice', () => {
    const area = { items: [{ id: 'a', seen: 0, right: 0 }, { id: 'b', seen: 5, right: 5 }, { id: 'c', seen: 5, right: 1 }] }
    const s = adaptiveSplit(area, ['a', 'b', 'c', 'zzz'])
    expect(s.choice.map((x) => x.id)).toEqual(['a', 'c'])
    expect(s.typed.map((x) => x.id)).toEqual(['b'])
  })
  it('shapes a stored map and refuses one from a newer build', () => {
    expect(shapeMap(null)).toBeNull()
    expect(shapeMap({ version: MAP_VERSION + 1, areas: [] })).toBeNull()
    expect(shapeMap({ areas: [{ id: 'x', status: 'locked', nodes: [] }] }).areas[0].status).toBe('open')
  })
  it('plans more areas when the learner reaches the last one', () => {
    let m = newMap()
    expect(needsMoreAreas(m)).toBe(false)
    for (const a of m.areas.slice(0, 3)) { m = clearArea(m, a.id); for (const d of needsDetail(m)) m = applyAreaDetail(m, d, parseAreaDetail(detailRaw(), id, { areaId: d })) }
    expect(needsMoreAreas(m)).toBe(true)
    const more = appendAreas(m, [{ title: 'Area 4' }, { title: 'Brand new', theme: 't' }])
    expect(more.areas.map((a) => a.title).slice(-1)).toEqual(['Brand new'])
  })
})

describe('edits from Ebi', () => {
  it('parses a whole-map proposal', () => {
    expect(parseMapEdit({}, id)).toBeNull()
    expect(parseMapEdit({ areas: [{ id: 'x', title: 'T' }], note: 'ok' }, id)).toMatchObject({ areas: [{ id: 'x', title: 'T' }], note: 'ok' })
  })
  it('never touches a started or finished area, and keeps them first', () => {
    let m = newMap()
    const [a1, a2, a3, a4] = m.areas
    m = applyNodeResult(m, a1.id, a1.nodes[0].id, { total: 2, correct: 2 }).map // a1 started
    const { map, changes } = mergeEdit(m, { areas: [
      { id: a3.id, title: a3.title, theme: 'spooky version', motif: 'forest', palette: 'night' },
      { id: a1.id, title: 'Renamed started area', theme: 'x' },
      { title: 'Subnetting', theme: 'new', motif: 'lab' },
      { id: a2.id, title: a2.title, theme: a2.theme, motif: a2.motif, palette: a2.palette },
    ] })
    expect(map.areas.map((a) => a.id)).toEqual([a1.id, a3.id, 'subnetting', a2.id])
    expect(map.areas[0]).toEqual(m.areas[0])
    expect(map.areas[1]).toMatchObject({ theme: 'spooky version', detailed: false, items: [] })
    expect(map.areas[3].detailed).toBe(true)
    expect(changes.find((c) => c.id === a4.id).kind).toBe('removed')
    expect(changes.find((c) => c.id === 'subnetting').kind).toBe('added')
    expect(changes.find((c) => c.id === a1.id).kind).toBe('kept')
    expect(editChanged(changes)).toBe(true)
    expect(map.areas.map((a) => a.status)).toEqual(['open', 'locked', 'locked', 'locked'])
  })
  it('a look-only change keeps the content and takes the new look', () => {
    const m = newMap()
    const a2 = { ...m.areas[1] }
    const { map } = mergeEdit(m, { areas: m.areas.map((a) => (a.id === a2.id ? { ...a, palette: 'candy', motif: 'stage' } : a)) })
    const b = map.areas.find((a) => a.id === a2.id)
    expect(b.palette).toBe('candy')
    expect(b.motif).toBe('stage')
    expect(b.detailed).toBe(true)
  })
  it('refuses a proposal that would leave nothing ahead of the learner', () => {
    const m = newMap()
    const r = mergeEdit(m, { areas: [] })
    expect(r.map).toBe(m)
    expect(editChanged(r.changes)).toBe(false)
  })
  it('normalizes a hand-built map', () => {
    const m = normalizeMap({ areas: [{ id: 'a', status: 'done', nodes: [] }, { id: 'b', status: 'locked', nodes: [{ id: 'n', status: 'locked' }] }] })
    expect(m.areas.map((a) => a.status)).toEqual(['done', 'open'])
    expect(m.areas[1].nodes[0].status).toBe('open')
  })
})

describe('weak spots, the extra life and legendary', () => {
  it('opens Weak spots with the boss, never in its way, and pays the extra life once', () => {
    let m = newMap()
    const a = m.areas[0]
    for (const n of a.nodes) if (!n.optional && n.kind !== 'boss') m = applyNodeResult(m, a.id, n.id, { total: 10, correct: 10 }).map
    const nodes = m.areas[0].nodes
    expect(nodes.find((n) => n.kind === 'weak').status).toBe('open')
    expect(nodes.find((n) => n.kind === 'boss').status).toBe('open') // not blocked by the optional Weak spots
    const weak = nodes.find((n) => n.kind === 'weak')
    m = applyNodeResult(m, a.id, weak.id, { total: 10, correct: 3 }).map
    expect(m.areas[0].bonusLife).toBeFalsy()
    m = applyNodeResult(m, a.id, weak.id, { total: 10, correct: 9 }).map
    expect(m.areas[0].bonusLife).toBe(true)
    expect(WEAK_BONUS_LIVES).toBe(1) // a replay sets the same flag: never a second life
  })
  it('counts the forgiven miss only when the life was earned', () => {
    let m = newMap()
    const a = m.areas[0]
    for (const n of a.nodes) if (!n.optional && n.kind !== 'boss') m = applyNodeResult(m, a.id, n.id, { total: 10, correct: 10 }).map
    const boss = m.areas[0].nodes.find((n) => n.kind === 'boss')
    expect(applyNodeResult(m, a.id, boss.id, { total: 20, correct: 13, forgiven: 1 }).passed).toBe(false) // no life earned
    const weak = m.areas[0].nodes.find((n) => n.kind === 'weak')
    m = applyNodeResult(m, a.id, weak.id, { total: 10, correct: 10 }).map
    expect(applyNodeResult(m, a.id, boss.id, { total: 20, correct: 13, forgiven: 1 }).passed).toBe(true)
    expect(applyNodeResult(m, a.id, boss.id, { total: 20, correct: 12, forgiven: 5 }).passed).toBe(false) // at most one
  })
  it('picks the shakiest items and adds the level to older maps', () => {
    const area = { items: [{ id: 'a', seen: 4, right: 4 }, { id: 'b', seen: 4, right: 1 }, { id: 'c', seen: 0, right: 0 }] }
    expect(weakItems(area, 2).map((x) => x.id)).toEqual(['b', 'c'])
    const old = { areas: [{ id: 'x', detailed: true, items: [], nodes: [{ id: 'x-n1', kind: 'learn' }, { id: 'x-boss', kind: 'boss' }] }] }
    expect(ensureWeakNodes(old).areas[0].nodes.map((n) => n.kind)).toEqual(['learn', 'weak', 'boss'])
    expect(ensureWeakNodes(ensureWeakNodes(old)).areas[0].nodes).toHaveLength(3)
  })
  it('makes a cleared area legendary at 90%', () => {
    let m = clearArea(newMap(), newMap().areas[0].id)
    const id = m.areas[0].id
    expect(applyLegendaryResult(m, id, { total: 20, correct: 17 }).passed).toBe(false)
    const r = applyLegendaryResult(m, id, { total: 20, correct: 18 })
    expect(r.passed && r.firstLegend && r.map.areas[0].legendary).toBe(true)
    expect(applyLegendaryResult(r.map, id, { total: 20, correct: 20 }).firstLegend).toBe(false)
    expect(applyLegendaryResult(newMap(), newMap().areas[0].id, { total: 20, correct: 20 }).passed).toBe(false) // not cleared yet
  })
})

describe('review fixes', () => {
  it('drops a level with nothing new to teach instead of giving it every item', () => {
    const d = parseAreaDetail({
      items: detailRaw(6).items,
      nodes: [{ kind: 'learn', title: 'A', items: [1, 2, 3] }, { kind: 'learn', title: 'B', items: [4, 5, 6] }, { kind: 'rule', title: 'C', items: [1] }, { kind: 'learn', title: 'D', items: [2, 3] }],
    }, id, { areaId: 'r' })
    const teaching = d.nodes.filter((n) => !['talk', 'weak', 'boss'].includes(n.kind))
    expect(teaching.map((n) => n.title)).toEqual(['A', 'B'])
    expect(Math.max(...teaching.map((n) => n.itemIds.length))).toBe(3)
  })
  it('forgets the boss name, extra life and legendary mark when an area changes topic', () => {
    const m = newMap()
    const open = m.areas.find((a) => !a.frozen && a.detailed && a.id !== m.areas[0].id) || m.areas[1]
    const withName = { ...m, areas: m.areas.map((a) => (a.id === open.id ? { ...a, bossName: 'Old Boss', bonusLife: true } : a)) }
    const edited = mergeEdit(withName, { areas: withName.areas.map((a) => (a.id === open.id ? { id: a.id, title: 'A new topic', theme: 'else' } : { id: a.id, title: a.title })) })
    const area = (edited.map || edited).areas.find((a) => a.title === 'A new topic')
    expect(area.bossName).toBe('')
    expect(area.bonusLife).toBe(false)
  })
})

describe('tallyStudiedCard', () => {
  it('counts a Study answer on the item whose card it is (never gold)', () => {
    const map = { areas: [{ id: 'a', items: [{ id: 'i1', cardNoteId: 77, seen: 1, right: 1 }, { id: 'i2' }] }, { id: 'b', items: [] }] }
    const next = tallyStudiedCard(map, '77', false)
    expect(next.areas[0].items[0]).toMatchObject({ seen: 2, right: 1 })
    expect(next.areas[0].items[0].bossRight).toBeUndefined()
    expect(next.areas[1]).toBe(map.areas[1])
    expect(tallyStudiedCard(next, 77, true).areas[0].items[0]).toMatchObject({ seen: 3, right: 2 })
  })
  it('takes the Study grade when given: anything but Again counts right', () => {
    const map = { areas: [{ id: 'a', items: [{ id: 'i1', cardNoteId: 77, seen: 0, right: 0 }] }] }
    expect(tallyStudiedCard(map, 77, false, 'hard').areas[0].items[0]).toMatchObject({ seen: 1, right: 1 })
    expect(tallyStudiedCard(map, 77, true, 'again').areas[0].items[0]).toMatchObject({ seen: 1, right: 0 })
    expect(tallyStudiedCard(map, 77, false, 'easy').areas[0].items[0]).toMatchObject({ seen: 1, right: 1 })
  })
  it('returns the same map when no item has that card', () => {
    const map = { areas: [{ id: 'a', items: [{ id: 'i1' }] }] }
    expect(tallyStudiedCard(map, 5, true)).toBe(map)
    expect(tallyStudiedCard(null, 5, true)).toBe(null)
    expect(tallyStudiedCard(map, null, true)).toBe(map)
  })
})
