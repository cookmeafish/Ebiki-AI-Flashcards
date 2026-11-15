// CAREER MODE (./career.js): package shape, the built map, the career ladder (islands open, objectives climb on their
// own, checkpoint after lessons, boss after every checkpoint), item sampling, and older builds never rewriting it.
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { shapePackage, buildCareerMap, careerSections, checkpointsLeft, currentSection, careerQuizItems, careerMatches, careerSampleMax, CAREERS, CAREER, CAREER_MAP_VERSION, isCareerMap, nextCareerStep } from './career'
import { normalizeMap, shapeMap, applyNodeResult, needsMoreAreas, needsDetail, passRatio, PASS, MAP_VERSION } from './map'

const item = (id, section) => ({ id, kind: 'term', front: `Front ${id}`, back: `Back ${id}`, section })
const PKG = {
  id: 'test-course', title: 'Test course', version: '1',
  areas: [
    { id: 'd1', number: '1.0', title: 'Domain one', weight: 40, theme: 't', motif: 'castle', palette: 'original', bossName: 'Gatekeeper', story: ['s'], canDo: ['c'],
      sections: [{ id: '1.1', title: 'Objective one', short: 'One' }, { id: '1.2', title: 'Objective two', short: 'Two' }],
      items: [item('a', '1.1'), item('b', '1.1'), item('c', '1.1'), item('d', '1.2'), item('e', '1.2')],
      lessons: [{ section: '1.1', title: 'L1', itemIds: ['a', 'b'] }, { section: '1.1', title: 'L2', itemIds: ['c'] }, { section: '1.2', title: 'L3', itemIds: ['d', 'e'] }] },
    { id: 'd2', number: '2.0', title: 'Domain two', weight: 60, theme: 't', motif: 'lab', palette: 'original', bossName: 'Swarm',
      sections: [{ id: '2.1', title: 'Objective three', short: 'Three' }],
      items: [item('f', '2.1'), item('g', '2.1')],
      lessons: [{ section: '2.1', title: 'L4', itemIds: ['f', 'g'] }] },
  ],
}
const map0 = () => normalizeMap(buildCareerMap(shapePackage(PKG), { modeId: 11, subject: { name: 'Security+' } }, 1000))
const nodeOf = (map, areaId, id) => map.areas.find((a) => a.id === areaId).nodes.find((n) => n.id === `${areaId}-${id}`)
const win = (map, areaId, id) => applyNodeResult(map, areaId, `${areaId}-${id}`, { total: 10, correct: 10 }).map

describe('career package', () => {
  it('keeps a good package and refuses a broken one', () => {
    expect(shapePackage(PKG).areas).toHaveLength(2)
    expect(shapePackage({ ...PKG, areas: [{ ...PKG.areas[0], lessons: [] }] })).toBeNull()
    expect(shapePackage({ id: 'x', areas: [] })).toBeNull()
    expect(shapePackage(null)).toBeNull()
  })
  it('a lesson pointing at an unknown item drops that id', () => {
    const p = shapePackage({ ...PKG, areas: [{ ...PKG.areas[0], lessons: [{ section: '1.1', title: 'L', itemIds: ['a', 'zzz'] }] }, PKG.areas[1]] })
    expect(p.areas[0].lessons[0].itemIds).toEqual(['a'])
  })
  it('the Security+ course matches its mode by name or description', () => {
    const sec = CAREERS.find((c) => c.id === 'security-plus-sy0-701')
    expect(careerMatches(sec, { name: 'Security+' })).toBe(true)
    expect(careerMatches(sec, { name: 'Cyber', description: 'CompTIA SY0-701 prep' })).toBe(true)
    expect(careerMatches(sec, { name: 'Spanish' })).toBe(false)
  })
})

describe('the built map', () => {
  it('is a fully built career map: every island detailed, lessons then a checkpoint per objective, then weak spots and the boss', () => {
    const m = map0()
    expect(isCareerMap(m)).toBe(true)
    expect(m.version).toBe(CAREER_MAP_VERSION)
    expect(m.areas.every((a) => a.detailed)).toBe(true)
    expect(m.areas[0].nodes.map((n) => n.kind)).toEqual(['learn', 'learn', 'checkpoint', 'learn', 'checkpoint', 'weak', 'boss'])
    expect(m.areas[0].bossName).toBe('Gatekeeper')
    expect(nodeOf(m, 'd1', '1.1-check').itemIds).toEqual(['a', 'b', 'c'])
    expect(nodeOf(m, 'd1', 'boss').itemIds).toEqual(['a', 'b', 'c', 'd', 'e'])
  })
  it('is ready to show AS BUILT: every objective\'s first lesson open without normalizing (the store caches what is written)', () => {
    const raw = buildCareerMap(shapePackage(PKG), { modeId: 11, subject: { name: 'Security+' } })
    const n = (aid, id) => raw.areas.find((a) => a.id === aid).nodes.find((x) => x.id === `${aid}-${id}`).status
    expect([n('d1', '1.1-l1'), n('d1', '1.2-l1'), n('d2', '2.1-l1')]).toEqual(['open', 'open', 'open'])
    expect([n('d1', '1.1-l2'), n('d1', '1.1-check'), n('d1', 'boss')]).toEqual(['locked', 'locked', 'locked'])
  })
  it('never needs AI detail or extra areas', () => {
    const m = map0()
    expect(needsDetail(m)).toEqual([])
    expect(needsMoreAreas(m)).toBe(false)
  })
})

describe('the career ladder', () => {
  it('every island is open; every objective starts on its first lesson; checkpoints and the boss wait', () => {
    const m = map0()
    expect(m.areas.map((a) => a.status)).toEqual(['open', 'open'])
    expect(nodeOf(m, 'd1', '1.1-l1').status).toBe('open')
    expect(nodeOf(m, 'd1', '1.2-l1').status).toBe('open') // a later objective is reachable at once
    expect(nodeOf(m, 'd1', '1.1-l2').status).toBe('locked')
    expect(nodeOf(m, 'd1', '1.1-check').status).toBe('locked')
    expect(nodeOf(m, 'd1', 'boss').status).toBe('locked')
    expect(nodeOf(m, 'd1', 'weak').status).toBe('locked')
    expect(nodeOf(m, 'd2', '2.1-l1').status).toBe('open')
  })
  it('a checkpoint opens after its objective\'s last lesson; the boss only after EVERY checkpoint', () => {
    let m = map0()
    m = win(m, 'd1', '1.1-l1')
    expect(nodeOf(m, 'd1', '1.1-l2').status).toBe('open')
    m = win(m, 'd1', '1.1-l2')
    expect(nodeOf(m, 'd1', '1.1-check').status).toBe('open')
    m = win(m, 'd1', '1.1-check')
    expect(nodeOf(m, 'd1', 'boss').status).toBe('locked') // objective 1.2 is not cleared yet
    m = win(win(m, 'd1', '1.2-l1'), 'd1', '1.2-check')
    expect(nodeOf(m, 'd1', 'boss').status).toBe('open')
    expect(nodeOf(m, 'd1', 'weak').status).toBe('open')
    const r = applyNodeResult(m, 'd1', 'd1-boss', { total: 20, correct: 18 })
    expect(r.areaDone).toBe(true)
    expect(r.map.areas[0].status).toBe('done')
    expect(r.map.areas[1].status).toBe('open')
  })
  it('a checkpoint passes at 70%', () => {
    expect(passRatio('checkpoint')).toBe(PASS.checkpoint)
    let m = win(win(map0(), 'd1', '1.1-l1'), 'd1', '1.1-l2')
    expect(applyNodeResult(m, 'd1', 'd1-1.1-check', { total: 10, correct: 6 }).passed).toBe(false)
    expect(applyNodeResult(m, 'd1', 'd1-1.1-check', { total: 10, correct: 7 }).passed).toBe(true)
  })
  it('the island page knows each objective\'s progress and which one to show open', () => {
    let m = win(map0(), 'd1', '1.1-l1')
    const secs = careerSections(m.areas[0])
    expect(secs.map((s) => [s.id, s.lessons, s.lessonsDone, s.done])).toEqual([['1.1', 2, 1, false], ['1.2', 1, 0, false]])
    expect(checkpointsLeft(m.areas[0])).toBe(2)
    expect(currentSection(m.areas[0])).toBe('1.1')
    m = win(win(m, 'd1', '1.1-l2'), 'd1', '1.1-check')
    expect(currentSection(m.areas[0])).toBe('1.2')
  })
})

describe('career quiz items', () => {
  const big = (n, sections) => {
    const items = Array.from({ length: n }, (_, i) => ({ ...item(`i${i}`, sections[i % sections.length]), seen: 0, right: 0 }))
    return { area: { items }, all: items.map((x) => x.id) }
  }
  it('a checkpoint takes at most CAREER.checkpointItems, shakiest first, and the SAME sample while the tallies stay the same', () => {
    const { area, all } = big(40, ['1.1'])
    area.items[39].seen = 5; area.items[39].right = 0 // answered wrong every time: shakier than "never asked"? never asked first
    const n = { kind: 'checkpoint', itemIds: all }
    const a = careerQuizItems(area, n, { max: CAREER.checkpointItems })
    expect(a).toHaveLength(CAREER.checkpointItems)
    expect(careerQuizItems(area, n, { max: CAREER.checkpointItems }).map((x) => x.id)).toEqual(a.map((x) => x.id))
  })
  it('a boss spreads its sample over every objective', () => {
    const { area, all } = big(260, ['4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7', '4.8', '4.9'])
    const got = careerQuizItems(area, { kind: 'boss', itemIds: all }, { max: CAREER.bossItems })
    expect(got).toHaveLength(CAREER.bossItems)
    expect(new Set(got.map((x) => x.section)).size).toBe(9)
  })
  it('a boss over many small objectives and one big one still asks every objective (the big one gives way)', () => {
    const items = [
      ...Array.from({ length: 200 }, (_, i) => ({ ...item(`b${i}`, 'big'), seen: 0, right: 0 })),
      ...Array.from({ length: 40 }, (_, i) => ({ ...item(`s${i}`, `small${i}`), seen: 0, right: 0 })),
    ]
    const got = careerQuizItems({ items }, { kind: 'boss', itemIds: items.map((x) => x.id) }, { max: CAREER.bossItems })
    expect(got).toHaveLength(CAREER.bossItems)
    // 41 objectives, 30 places: every place goes to a different objective (none takes two while another has none).
    expect(new Set(got.map((x) => x.section)).size).toBe(CAREER.bossItems)
  })
  it('Legendary samples like the boss (never the whole island)', () => {
    const { area, all } = big(260, ['4.1', '4.2', '4.3'])
    expect(careerSampleMax('legendary')).toBe(CAREER.bossItems)
    expect(careerQuizItems(area, { kind: 'legendary', itemIds: all }, { max: careerSampleMax('legendary') })).toHaveLength(CAREER.bossItems)
    expect(careerSampleMax('learn')).toBe(0)
  })
  it('a small pool is asked whole', () => {
    const { area, all } = big(5, ['1.1'])
    expect(careerQuizItems(area, { kind: 'boss', itemIds: all }, { max: 30 })).toHaveLength(5)
  })
})

describe('stored career maps', () => {
  it('this build reads a career map and keeps its version; a plain map stays version 1', () => {
    const m = map0()
    expect(shapeMap(JSON.parse(JSON.stringify(m))).version).toBe(CAREER_MAP_VERSION)
    expect(shapeMap({ version: 1, areas: [] }).version).toBe(MAP_VERSION)
  })
  it('a build before career mode (MAP_VERSION 1) treats it as newer and leaves it alone', () => {
    expect(CAREER_MAP_VERSION).toBeGreaterThan(MAP_VERSION)
  })
})

// THE SHIPPED SECURITY+ COURSE (public/careers/security-plus-sy0-701.json, built by dev/careers/build-career.mjs from
// twice-reviewed cards): every domain and objective of SY0-701, one card per outline line, each in exactly one lesson,
// a checkpoint per objective and a boss over the whole island.
describe('the shipped Security+ course', () => {
  const raw = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../public/careers/security-plus-sy0-701.json'), 'utf8'))
  const pkg = shapePackage(raw)
  const OBJECTIVES = { '1.0': ['1.1', '1.2', '1.3', '1.4'], '2.0': ['2.1', '2.2', '2.3', '2.4', '2.5'], '3.0': ['3.1', '3.2', '3.3', '3.4'],
    '4.0': ['4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7', '4.8', '4.9'], '5.0': ['5.1', '5.2', '5.3', '5.4', '5.5', '5.6'] }
  const WEIGHT = { '1.0': 12, '2.0': 22, '3.0': 18, '4.0': 28, '5.0': 20 }
  it('shapes whole: five domains with their exam weights and every objective', () => {
    expect(pkg).not.toBeNull()
    expect(pkg.areas.map((a) => a.number)).toEqual(Object.keys(OBJECTIVES))
    for (const a of pkg.areas) {
      expect(a.weight).toBe(WEIGHT[a.number])
      expect(a.sections.map((s) => s.id)).toEqual(OBJECTIVES[a.number])
      expect(a.bossName).toBeTruthy()
    }
  })
  it('holds 853 cards (830, one per outline line, plus 23 extras), every card but a briefing in exactly one lesson of its own objective, no lesson over the limit', () => {
    expect(pkg.areas.reduce((n, a) => n + a.items.length, 0)).toBe(853)
    // The extras sit in each objective's "Extras" lesson(s), the objective's last lessons (before its checkpoint).
    const extraLessons = pkg.areas.flatMap((a) => a.lessons.filter((l) => /^Extras( \(\d+\/\d+\))?$/.test(l.title)))
    expect(extraLessons.reduce((n, l) => n + l.itemIds.length, 0)).toBe(23)
    for (const a of pkg.areas) for (const l of a.lessons.filter((x) => x.title.startsWith('Extras'))) {
      const own = a.lessons.filter((x) => x.section === l.section)
      expect(own.slice(own.indexOf(l)).every((x) => x.title.startsWith('Extras'))).toBe(true)
    }
    for (const a of pkg.areas) {
      const seen = new Map()
      for (const l of a.lessons) {
        expect(l.itemIds.length).toBeLessThanOrEqual(CAREER.lessonMax)
        for (const id of l.itemIds) { seen.set(id, (seen.get(id) || 0) + 1); expect(a.items.find((it) => it.id === id).section).toBe(l.section) }
      }
      for (const it of a.items) expect(seen.get(it.id) || 0).toBe(it.kind === 'brief' ? 0 : 1)
      expect(new Set(a.items.map((it) => it.front.toLowerCase())).size).toBe(a.items.length)
      for (const it of a.items) { expect(it.back).toMatch(/^Definition: /); expect(it.back).not.toMatch(/[—–]/) }
    }
  })
  it('builds a map: every objective ends in a checkpoint over its cards, every island ends in weak spots and a boss over all of them', () => {
    const m = normalizeMap(buildCareerMap(pkg, { modeId: 1, subject: { name: 'Security+' } }))
    for (const a of m.areas) {
      for (const s of a.sections) {
        const own = a.nodes.filter((n) => n.section === s.id)
        expect(own.at(-1).kind).toBe('checkpoint')
        expect([...own.at(-1).itemIds].sort()).toEqual(a.items.filter((it) => it.section === s.id && it.kind !== 'brief').map((it) => it.id).sort())
        expect(own[0].status).toBe('open')
      }
      expect(a.nodes.slice(-2).map((n) => n.kind)).toEqual(['weak', 'boss'])
      expect(a.nodes.at(-1).itemIds).toHaveLength(a.items.filter((it) => it.kind !== 'brief').length)
    }
  })
  it('BRIEFINGS: every domain and objective has its overview as a briefing, never in a lesson, a checkpoint, a boss or a quiz sample', () => {
    const m = normalizeMap(buildCareerMap(pkg, { modeId: 1, subject: { name: 'Security+' } }))
    for (const a of m.areas) {
      const briefs = new Set(a.items.filter((it) => it.kind === 'brief').map((it) => it.id))
      expect(briefs.has(a.brief)).toBe(true)
      for (const s of a.sections) expect(briefs.has(s.brief)).toBe(true)
      for (const n of a.nodes) for (const id of n.itemIds || []) expect(briefs.has(id)).toBe(false)
      const boss = a.nodes.find((n) => n.kind === 'boss')
      for (const it of careerQuizItems(a, boss, { max: 999 })) expect(it.kind).not.toBe('brief')
    }
  })
  it('CONTINUE leads to the first lesson of a new course, then the next open step', () => {
    let m = normalizeMap(buildCareerMap(pkg, { modeId: 1, subject: { name: 'Security+' } }))
    const first = nextCareerStep(m.areas)
    expect(first.area.number).toBe('1.0')
    expect(first.node.id).toBe(`${first.area.id}-1.1-l1`)
    m = applyNodeResult(m, first.area.id, first.node.id, { total: 10, correct: 10 }).map
    expect(nextCareerStep(m.areas).node.id).toBe(`${first.area.id}-1.1-l2`)
  })
})

describe('saves from before career mode', () => {
  // A version-1 AI map as an older build wrote it: it loads, stays version 1 (older builds keep reading it) and
  // unlocks exactly as before (areas in order, steps one by one, the boss last).
  const OLD = { version: 1, modeId: 3, subject: { name: 'Spanish' }, createdAt: 1, updatedAt: 1, start: { path: 'new' }, helpers: { scroll: 0, shield: 0 }, days: {},
    areas: [
      { id: 'cafe', title: 'Cafe', theme: '', motif: 'city', palette: 'original', status: 'open', detailed: true, frozen: false,
        items: [{ id: 'cafe-a', kind: 'term', front: 'el cafe', back: 'coffee', seen: 0, right: 0 }, { id: 'cafe-b', kind: 'term', front: 'la leche', back: 'milk', seen: 0, right: 0 }],
        nodes: [
          { id: 'cafe-l1', kind: 'learn', title: 'L1', itemIds: ['cafe-a'], status: 'done', stars: 2, bestScore: 0.9, attempts: 1, optional: false },
          { id: 'cafe-l2', kind: 'learn', title: 'L2', itemIds: ['cafe-b'], status: 'locked', stars: 0, bestScore: 0, attempts: 0, optional: false },
          { id: 'cafe-boss', kind: 'boss', title: '', itemIds: ['cafe-a', 'cafe-b'], status: 'locked', stars: 0, bestScore: 0, attempts: 0, optional: false },
        ] },
      { id: 'market', title: 'Market', theme: '', motif: 'desert', palette: 'original', status: 'locked', detailed: false, frozen: false, items: [], nodes: [] },
    ] }
  it('loads unchanged in shape and progress', () => {
    const m = shapeMap(JSON.parse(JSON.stringify(OLD)))
    expect(m.version).toBe(1)
    expect(isCareerMap(m)).toBe(false)
    expect(m.areas.map((a) => a.status)).toEqual(['open', 'locked'])
    const n = Object.fromEntries(m.areas[0].nodes.map((x) => [x.id, x.status]))
    expect(n['cafe-l1']).toBe('done')
    expect(n['cafe-l2']).toBe('open')
    expect(n['cafe-boss']).toBe('locked')
    expect(passRatio('learn')).toBe(PASS.node)
  })
})
