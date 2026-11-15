// CAREER MODE (./career.js): package shape, the built map, the career ladder (islands open, objectives climb on their
// own, checkpoint after lessons, boss after every checkpoint), item sampling, and older builds never rewriting it.
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { shapePackage, buildCareerMap, careerQuizItems, careerMatches, careerSampleMax, CAREERS, CAREER, CAREER_MAP_VERSION, isCareerMap, nextCareerStep, courseCtx, courseModes,
  cutRegions, careerRegions, currentRegion, regionBossesLeft, careerFight, raidLook, careerHasProgress, CAREER_LAYOUT, CAREER_RAID_MOTIFS, CAREER_FINAL_MOTIF, FINAL_AREA_ID } from './career'
import { cheatCompleteNode, cheatCompleteArea, cheatResetNode } from './cheats'
import { normalizeMap, shapeMap, applyNodeResult, needsMoreAreas, needsDetail, passRatio, PASS, MAP_VERSION, MOTIFS } from './map'

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
  it('a course never fits a language mode, even one that names it', () => {
    const sec = CAREERS.find((c) => c.id === 'security-plus-sy0-701')
    expect(careerMatches(sec, { name: 'Portuguese (Brazil)', type: 'language', isLanguage: true, description: 'Security+ terms in Portuguese' })).toBe(false)
    const modes = [
      { id: 41, name: 'Portuguese (Brazil)', type: 'language', ankiDeck: 'Português' },
      { id: 42, name: 'Cert prep', type: 'general', description: 'my sy0-701 notes', ankiDeck: 'Cert prep' },
      { id: 43, name: 'Security+', type: 'general', ankiDeck: 'Security+' },
    ]
    expect(courseModes(sec, modes).map((m) => m.id)).toEqual([43, 42]) // the mode on the course's own deck first
  })
  it('a course runs as a general subject in the app language, whatever mode holds it', () => {
    const map = { career: { id: 'security-plus-sy0-701', title: 'CompTIA Security+ SY0-701' } }
    const ctx = {
      lang: 'en',
      subject: { modeId: 41, name: 'Portuguese (Brazil)', type: 'language', isLanguage: true, learnLang: 'Portuguese', learnLangIso: 'pt', userLang: 'English', rules: 'dialect: Brazil', accents: true, grammarSlips: () => 'slips', grammarSlipList: () => [{ text: 'x' }] },
      study: { rules: () => ({ studyLanguage: 'Portuguese', quizLanguage: 'Portuguese', dialect: 'Brazil', wordHints: true, accentDrill: true, questionLadder: true }), setRules: () => true },
    }
    const c = courseCtx(ctx, map)
    expect(c.subject).toMatchObject({ modeId: 41, isLanguage: false, type: 'general', learnLang: 'English', learnLangIso: 'en', rules: '', accents: false, name: 'CompTIA Security+ SY0-701' })
    expect(c.subject.grammarSlips()).toBe('')
    expect(c.subject.grammarSlipList()).toEqual([])
    expect(c.study.rules()).toMatchObject({ studyLanguage: '', quizLanguage: '', dialect: '', wordHints: false, accentDrill: false, questionLadder: true })
    expect(c.study.setRules({ studyLanguage: 'Portuguese' })).toBe(false) // a course never writes the mode's language settings
    expect(courseCtx(ctx, { areas: [] })).toBe(ctx) // an adventure map keeps the mode as it is
  })
})

describe('the built map', () => {
  it('is a fully built career map: per island its regions (lessons, then the region boss), weak spots, the raid; then the final raid', () => {
    const m = map0()
    expect(isCareerMap(m)).toBe(true)
    expect(m.version).toBe(CAREER_MAP_VERSION)
    expect(m.career.layout).toBe(CAREER_LAYOUT)
    expect(m.areas.every((a) => a.detailed)).toBe(true)
    expect(m.areas.map((a) => a.id)).toEqual(['d1', 'd2', FINAL_AREA_ID])
    expect(m.areas[0].nodes.map((n) => `${n.kind}${n.stage ? `:${n.stage}` : ''}`)).toEqual(['learn', 'learn', 'learn', 'boss:region', 'weak', 'boss:raid'])
    expect(m.areas[0].bossName).toBe('Gatekeeper')
    expect(nodeOf(m, 'd1', 'r1-boss').itemIds).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(nodeOf(m, 'd1', 'boss')).toMatchObject({ stage: 'raid', motif: CAREER_RAID_MOTIFS[0], count: CAREER.raidQuestions })
    expect(nodeOf(m, 'd2', 'boss').motif).toBe(CAREER_RAID_MOTIFS[1])
    const final = m.areas.at(-1)
    expect(final).toMatchObject({ final: true, status: 'locked', items: [] })
    expect(final.nodes).toHaveLength(1)
    expect(final.nodes[0]).toMatchObject({ kind: 'boss', stage: 'final', motif: CAREER_FINAL_MOTIF, status: 'locked' })
  })
  it('is ready to show AS BUILT: every region\'s first lesson open without normalizing (the store caches what is written)', () => {
    const raw = buildCareerMap(shapePackage(PKG), { modeId: 11, subject: { name: 'Security+' } })
    const n = (aid, id) => raw.areas.find((a) => a.id === aid).nodes.find((x) => x.id === `${aid}-${id}`).status
    expect([n('d1', '1.1-l1'), n('d2', '2.1-l1')]).toEqual(['open', 'open'])
    expect([n('d1', '1.1-l2'), n('d1', 'r1-boss'), n('d1', 'boss')]).toEqual(['locked', 'locked', 'locked'])
  })
  it('a saved course reads back whole (regions, stages, the final raid area with no items)', () => {
    const raw = buildCareerMap(shapePackage(PKG), { modeId: 11, subject: { name: 'Security+' } })
    const back = shapeMap(JSON.parse(JSON.stringify(raw)))
    expect(back.areas.map((a) => a.id)).toEqual(['d1', 'd2', FINAL_AREA_ID])
    expect(back.areas.at(-1)).toMatchObject({ final: true, status: 'locked' })
    expect(back.areas.at(-1).nodes[0]).toMatchObject({ stage: 'final', motif: CAREER_FINAL_MOTIF, count: CAREER.finalQuestions })
    expect(back.areas[0].regions).toEqual([{ id: 'r1', n: 1, sections: ['1.1', '1.2'] }])
    expect(back.areas[0].nodes.find((n) => n.stage === 'region')).toMatchObject({ region: 'r1', count: CAREER.regionQuestions })
    expect(back.career.layout).toBe(CAREER_LAYOUT)
  })
  it('never needs AI detail or extra areas', () => {
    const m = map0()
    expect(needsDetail(m)).toEqual([])
    expect(needsMoreAreas(m)).toBe(false)
  })
})

describe('regions are fair (balanced by NEW THINGS, never by lesson count)', () => {
  const L = (section, n, i) => ({ section, title: `${section}-${i}`, itemIds: Array.from({ length: n }, (_, k) => `${section}-${i}-${k}`) })
  it('a lesson-heavy stretch of 1-item lessons and a few 4-item lessons end up with about the same number of items', () => {
    const sections = [{ id: 's1' }, { id: 's2' }, { id: 's3' }]
    const lessons = [...Array.from({ length: 30 }, (_, i) => L('s1', 1, i)), ...Array.from({ length: 8 }, (_, i) => L('s2', 4, i)), ...Array.from({ length: 10 }, (_, i) => L('s3', 3, i))]
    const regions = cutRegions(sections, lessons, { target: 30 })
    const sizes = regions.map((r) => r.reduce((n, l) => n + l.itemIds.length, 0))
    expect(sizes.reduce((a, b) => a + b, 0)).toBe(92)
    expect(regions).toHaveLength(3)
    for (const n of sizes) { expect(n).toBeGreaterThanOrEqual(24); expect(n).toBeLessThanOrEqual(38) }
    expect(regions.flat()).toEqual(lessons) // every lesson once, in order
  })
  it('cuts where an objective ends when that is about as fair', () => {
    const sections = [{ id: 's1' }, { id: 's2' }]
    const lessons = [...Array.from({ length: 10 }, (_, i) => L('s1', 3, i)), ...Array.from({ length: 9 }, (_, i) => L('s2', 3, i))]
    const regions = cutRegions(sections, lessons, { target: 30 })
    expect(regions.map((r) => [...new Set(r.map((l) => l.section))])).toEqual([['s1'], ['s2']])
  })
  it('the shipped Security+ course: every region holds 20 to 40 new things', () => {
    const pkg = shapePackage(JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../public/careers/security-plus-sy0-701.json'), 'utf8')))
    let count = 0
    for (const a of pkg.areas) {
      const regions = cutRegions(a.sections, a.lessons)
      count += regions.length
      expect(regions.flat()).toHaveLength(a.lessons.length)
      for (const r of regions) {
        const items = r.reduce((n, l) => n + l.itemIds.length, 0)
        expect(items).toBeGreaterThanOrEqual(20)
        expect(items).toBeLessThanOrEqual(40)
      }
    }
    expect(count).toBeGreaterThanOrEqual(20) // many bosses per course, not five
  })
})

describe('the career ladder', () => {
  // A course with two regions in island d1 (target 2 new things per region).
  const BIG = { ...PKG, areas: [{ ...PKG.areas[0] }, PKG.areas[1]] }
  const twoRegions = () => {
    const pkg = shapePackage(BIG)
    const m = buildCareerMap(pkg, { modeId: 11, subject: { name: 'Security+' } }, 1000)
    // rebuild d1's regions by hand: r1 = objective 1.1, r2 = objective 1.2
    const a = m.areas[0]
    a.regions = [{ id: 'r1', n: 1, sections: ['1.1'] }, { id: 'r2', n: 2, sections: ['1.2'] }]
    a.nodes = [
      { ...nodeOf(m, 'd1', '1.1-l1'), region: 'r1' }, { ...nodeOf(m, 'd1', '1.1-l2'), region: 'r1' },
      { ...nodeOf(m, 'd1', 'r1-boss'), region: 'r1', itemIds: ['a', 'b', 'c'] },
      { ...nodeOf(m, 'd1', '1.2-l1'), region: 'r2', status: 'locked' },
      { ...nodeOf(m, 'd1', 'r1-boss'), id: 'd1-r2-boss', region: 'r2', itemIds: ['d', 'e'] },
      nodeOf(m, 'd1', 'weak'), nodeOf(m, 'd1', 'boss'),
    ]
    return normalizeMap(m)
  }
  it('every island is open; every region starts on its first lesson; region bosses, weak spots and the raid wait; the final raid is locked', () => {
    const m = twoRegions()
    expect(m.areas.map((a) => a.status)).toEqual(['open', 'open', 'locked'])
    expect(nodeOf(m, 'd1', '1.1-l1').status).toBe('open')
    expect(nodeOf(m, 'd1', '1.2-l1').status).toBe('open') // a later region is reachable at once
    expect(nodeOf(m, 'd1', '1.1-l2').status).toBe('locked')
    expect(nodeOf(m, 'd1', 'r1-boss').status).toBe('locked')
    expect(nodeOf(m, 'd1', 'boss').status).toBe('locked')
    expect(nodeOf(m, 'd1', 'weak').status).toBe('locked')
  })
  it('a region boss opens after its region\'s last lesson and never clears the island; the raid opens after EVERY region boss and clears it', () => {
    let m = twoRegions()
    m = win(win(m, 'd1', '1.1-l1'), 'd1', '1.1-l2')
    expect(nodeOf(m, 'd1', 'r1-boss').status).toBe('open')
    expect(nodeOf(m, 'd1', 'r2-boss').status).toBe('locked')
    const r1 = applyNodeResult(m, 'd1', 'd1-r1-boss', { total: 15, correct: 14, outcome: 'won' })
    expect(r1.passed).toBe(true)
    expect(r1.areaDone).toBe(false)
    m = r1.map
    expect(nodeOf(m, 'd1', 'boss').status).toBe('locked') // region 2 is not cleared yet
    m = win(m, 'd1', '1.2-l1')
    m = applyNodeResult(m, 'd1', 'd1-r2-boss', { total: 15, correct: 15, outcome: 'won' }).map
    expect(nodeOf(m, 'd1', 'boss').status).toBe('open')
    expect(nodeOf(m, 'd1', 'weak').status).toBe('open')
    const r = applyNodeResult(m, 'd1', 'd1-boss', { total: 25, correct: 23, outcome: 'won' })
    expect(r.areaDone).toBe(true)
    expect(r.map.areas[0].status).toBe('done')
    expect(r.map.areas.at(-1).status).toBe('locked') // island 2 is still open
  })
  it('the final raid opens once every island is cleared, and draws on every island', () => {
    let m = map0()
    for (const id of ['d1', 'd2']) {
      for (const n of m.areas.find((a) => a.id === id).nodes.filter((x) => x.kind === 'learn')) m = win(m, id, n.id.slice(id.length + 1))
      m = applyNodeResult(m, id, `${id}-r1-boss`, { total: 15, correct: 15, outcome: 'won' }).map
      m = applyNodeResult(m, id, `${id}-boss`, { total: 25, correct: 25, outcome: 'won' }).map
    }
    const final = m.areas.at(-1)
    expect(final.status).toBe('open')
    expect(final.nodes[0].status).toBe('open')
    const f = careerFight(final, final.nodes[0], m.areas, { finalName: 'The Final Exam' })
    expect(f.area.bossName).toBe('The Final Exam')
    expect(f.area.motif).toBe(CAREER_FINAL_MOTIF)
    expect(f.node.itemIds.sort()).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g'])
    expect(raidLook(f.node)).toBe(true)
    const done = applyNodeResult(m, FINAL_AREA_ID, `${FINAL_AREA_ID}-raid`, { total: 30, correct: 28, outcome: 'won' })
    expect(done.areaDone).toBe(true)
    expect(nextCareerStep(done.map.areas)).toBe(null)
  })
  it('the final raid tallies every answer on the island that owns the item', () => {
    let m = map0()
    for (const id of ['d1', 'd2']) m = cheatCompleteArea(m, id)
    const r = applyNodeResult(m, FINAL_AREA_ID, `${FINAL_AREA_ID}-raid`, { total: 3, correct: 2, outcome: 'won', items: [{ itemId: 'a', correct: true, grade: 'good' }, { itemId: 'f', correct: false }, { itemId: 'g', correct: true, grade: 'good' }] })
    const it = (aid, id) => r.map.areas.find((x) => x.id === aid).items.find((x) => x.id === id)
    expect([it('d1', 'a').seen, it('d1', 'a').right]).toEqual([1, 1])
    expect([it('d2', 'f').seen, it('d2', 'f').right]).toEqual([1, 0])
    expect(it('d1', 'b').seen).toBe(0)
  })
  it('clearing an island names the next island, never a final raid that is still locked', () => {
    let m = map0()
    for (const id of ['d2-2.1-l1', 'd2-r1-boss']) m = cheatCompleteNode(m, 'd2', id) // island 2's raid open
    expect(nodeOf(m, 'd2', 'boss').status).toBe('open')
    const d2 = applyNodeResult(cheatCompleteArea(m, 'd1'), 'd2', 'd2-boss', { total: 25, correct: 25, outcome: 'won' })
    expect(d2.nextAreaId).toBe(FINAL_AREA_ID) // every island cleared: the final raid just opened
    const lastFirst = applyNodeResult(m, 'd2', 'd2-boss', { total: 25, correct: 25, outcome: 'won' })
    expect(lastFirst.nextAreaId).toBe(null) // island 1 still open: the final raid stays locked, nothing to name
  })
  it('a lost fight\'s rematch belongs to THAT boss: losing a region boss never reshapes another boss, and a win clears only its own', () => {
    let m = win(win(map0(), 'd1', '1.1-l1'), 'd1', '1.1-l2')
    m = win(m, 'd1', '1.2-l1')
    const lost = applyNodeResult(m, 'd1', 'd1-r1-boss', { total: 15, correct: 3, outcome: 'lost', items: [{ itemId: 'a', correct: false }] }).map
    expect(lost.areas[0].nemesis).toMatchObject({ itemIds: ['a'], nodeId: 'd1-r1-boss' })
    // another fight on the island (here the raid, opened by a won region boss) leaves it alone when won
    const won = applyNodeResult(lost, 'd1', 'd1-r1-boss', { total: 15, correct: 15, outcome: 'won' }).map
    expect(won.areas[0].nemesis).toBe(null)
    const other = applyNodeResult({ ...lost, areas: lost.areas.map((a, i) => (i ? a : { ...a, nemesis: { itemIds: ['b'], at: 1, nodeId: 'd1-boss' } })) }, 'd1', 'd1-r1-boss', { total: 15, correct: 15, outcome: 'won' }).map
    expect(other.areas[0].nemesis).toMatchObject({ nodeId: 'd1-boss' })
  })
  it('cheats: completing or resetting a region boss never finishes or reopens the island', () => {
    const m = map0()
    expect(cheatCompleteNode(m, 'd1', 'd1-r1-boss').areas[0].status).toBe('open')
    expect(cheatCompleteNode(m, 'd1', 'd1-boss').areas[0].status).toBe('done')
    const done = cheatCompleteArea(m, 'd1')
    expect(cheatResetNode(done, 'd1', 'd1-r1-boss').areas[0].status).toBe('done')
  })
  it('an older course counts as played (never rebuilt) once anything was done with it', () => {
    const m = map0()
    expect(careerHasProgress(m)).toBe(false)
    expect(careerHasProgress({ ...m, days: { '2026-11-15': 1 } })).toBe(true)
    expect(careerHasProgress({ ...m, areas: m.areas.map((a, i) => (i ? a : { ...a, items: a.items.map((it, k) => (k ? it : { ...it, cardNoteId: 5 })) })) })).toBe(true)
    expect(careerHasProgress(win(m, 'd1', '1.1-l1'))).toBe(true)
  })
  it('a region boss is named after its region; a raid wears its raid art', () => {
    const m = map0()
    const a = m.areas[0]
    const own = careerFight(a, nodeOf(m, 'd1', 'r1-boss'), m.areas, { regionName: 'Region 1 Guardian' }).area
    expect(own).toMatchObject({ bossName: 'The Control Sensei', motif: 'dojo' }) // its own boss, never the island's
    const noName = { ...nodeOf(m, 'd1', 'r1-boss'), bossName: undefined }
    expect(careerFight(a, noName, m.areas, { regionName: 'Region 1 Guardian' }).area.bossName).toBe('Region 1 Guardian')
    expect(raidLook(nodeOf(m, 'd1', 'r1-boss'))).toBe(false)
    const raid = careerFight(a, nodeOf(m, 'd1', 'boss'), m.areas)
    expect(raid.area.motif).toBe(CAREER_RAID_MOTIFS[0])
    expect(raid.area.bossName).toBe('Gatekeeper')
    expect(raidLook(raid.node)).toBe(true)
  })
  it('sample sizes grow with the fight: region, raid, final', () => {
    expect(careerSampleMax('boss', 'region')).toBe(CAREER.regionItems)
    expect(careerSampleMax('boss', 'raid')).toBe(CAREER.raidItems)
    expect(careerSampleMax('boss', 'final')).toBe(CAREER.finalItems)
    expect(CAREER.regionItems < CAREER.raidItems && CAREER.raidItems < CAREER.finalItems).toBe(true)
  })
  it('the island page knows each region\'s progress and which one to show open', () => {
    let m = win(twoRegions(), 'd1', '1.1-l1')
    const regs = careerRegions(m.areas[0])
    expect(regs.map((r) => [r.id, r.lessons, r.lessonsDone, r.done])).toEqual([['r1', 2, 1, false], ['r2', 1, 0, false]])
    expect(regionBossesLeft(m.areas[0])).toBe(2)
    expect(currentRegion(m.areas[0])).toBe('r1')
    m = applyNodeResult(win(m, 'd1', '1.1-l2'), 'd1', 'd1-r1-boss', { total: 15, correct: 15, outcome: 'won' }).map
    expect(currentRegion(m.areas[0])).toBe('r2')
    expect(nextCareerStep(m.areas).node.id).toBe('d1-1.2-l1')
  })
  it('an older course (objective checkpoints, one boss) still climbs as before', () => {
    const old = { version: CAREER_MAP_VERSION, modeId: 1, career: { id: 'x', title: 'X' }, areas: [{ id: 'o', title: 'O', status: 'open', sections: [{ id: '1.1' }], items: [item('a', '1.1')], nodes: [
      { id: 'o-1.1-l1', kind: 'learn', section: '1.1', itemIds: ['a'], status: 'done' },
      { id: 'o-1.1-check', kind: 'checkpoint', section: '1.1', itemIds: ['a'], status: 'locked' },
      { id: 'o-weak', kind: 'weak', itemIds: [], optional: true, status: 'locked' },
      { id: 'o-boss', kind: 'boss', itemIds: ['a'], status: 'locked' },
    ] }] }
    let m = normalizeMap(old)
    expect(nodeOf(m, 'o', '1.1-check').status).toBe('open')
    expect(nodeOf(m, 'o', 'boss').status).toBe('locked')
    m = win(m, 'o', '1.1-check')
    expect(nodeOf(m, 'o', 'boss').status).toBe('open')
    expect(applyNodeResult(m, 'o', 'o-boss', { total: 20, correct: 19, outcome: 'won' }).areaDone).toBe(true)
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
  it('builds a map: every island is cut into fair regions, each ending in its boss over the region\'s cards, then weak spots and the raid over all of them; then the final raid', () => {
    const m = normalizeMap(buildCareerMap(pkg, { modeId: 1, subject: { name: 'Security+' } }))
    const islands = m.areas.filter((a) => !a.final)
    expect(islands).toHaveLength(5)
    for (const a of islands) {
      expect(a.regions.length).toBeGreaterThanOrEqual(3)
      for (const r of a.regions) {
        const own = a.nodes.filter((n) => n.region === r.id)
        expect(own.at(-1)).toMatchObject({ kind: 'boss', stage: 'region' })
        expect([...own.at(-1).itemIds].sort()).toEqual([...new Set(own.slice(0, -1).flatMap((n) => n.itemIds))].sort())
        expect(own[0].status).toBe('open')
      }
      expect(a.nodes.slice(-2).map((n) => n.kind)).toEqual(['weak', 'boss'])
      expect(a.nodes.at(-1).stage).toBe('raid')
      expect(a.nodes.at(-1).itemIds).toHaveLength(a.items.filter((it) => it.kind !== 'brief').length)
      expect(a.nodes.filter((n) => n.kind === 'checkpoint')).toHaveLength(0)
    }
    expect(m.areas.at(-1)).toMatchObject({ final: true, status: 'locked' })
  })
  it('EVERY BOSS IS ITS OWN: no region boss shares a drawing or a name with another boss in the course, nor an island\'s own drawing; every drawing exists', () => {
    const m = normalizeMap(buildCareerMap(pkg, { modeId: 1, subject: { name: 'Security+' } }))
    const islands = m.areas.filter((a) => !a.final)
    const regionBosses = islands.flatMap((a) => a.nodes.filter((n) => n.stage === 'region'))
    expect(regionBosses.length).toBeGreaterThanOrEqual(20)
    const motifs = regionBosses.map((n) => n.motif)
    expect(new Set(motifs).size).toBe(motifs.length)
    for (const mo of motifs) expect(MOTIFS).toContain(mo)
    for (const a of islands) for (const n of a.nodes.filter((x) => x.stage === 'region')) expect(n.motif).not.toBe(a.motif)
    expect(motifs.some((mo) => islands.some((a) => a.motif === mo))).toBe(false)
    const names = regionBosses.map((n) => n.bossName)
    expect(names.every(Boolean)).toBe(true)
    expect(new Set([...names, ...islands.map((a) => a.bossName)]).size).toBe(names.length + islands.length)
    // the fight wears it
    const a = islands[0]; const n = a.nodes.find((x) => x.stage === 'region')
    expect(careerFight(a, n, m.areas).area).toMatchObject({ motif: n.motif, bossName: n.bossName })
  })
  it('an older save without region boss drawings gets them filled in on load', () => {
    const raw = buildCareerMap(pkg, { modeId: 1, subject: { name: 'Security+' } })
    for (const a of raw.areas) for (const n of a.nodes) if (n.stage === 'region') { delete n.motif; delete n.bossName }
    const m = normalizeMap(raw)
    const firsts = m.areas.filter((a) => !a.final).map((a) => a.nodes.find((n) => n.stage === 'region').motif)
    expect(firsts).toEqual(['dojo', 'pirate', 'city', 'arena', 'celestial'])
  })
  it('BRIEFINGS: every domain and objective has its overview as a briefing, never in a lesson, a checkpoint, a boss or a quiz sample', () => {
    const m = normalizeMap(buildCareerMap(pkg, { modeId: 1, subject: { name: 'Security+' } }))
    for (const a of m.areas.filter((x) => !x.final)) {
      const briefs = new Set(a.items.filter((it) => it.kind === 'brief').map((it) => it.id))
      expect(briefs.has(a.brief)).toBe(true)
      for (const s of a.sections) expect(briefs.has(s.brief)).toBe(true)
      for (const n of a.nodes) for (const id of n.itemIds || []) expect(briefs.has(id)).toBe(false)
      for (const boss of a.nodes.filter((n) => n.kind === 'boss')) for (const it of careerQuizItems(a, boss, { max: 999 })) expect(it.kind).not.toBe('brief')
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
