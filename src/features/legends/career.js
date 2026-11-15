// CAREER MODE (pure, tested): a hand-built Legends map for a whole course, loaded from a PACKAGE instead of written by
// the AI (docs/plans/2026-11-14-career-mode.md). The owner: "an island per domain, and each island has all the content
// of the domain as lessons and bosses which are the tests".
//
//   island (area)      = a domain                    all islands open from the start (any domain first)
//   section            = an objective of the domain  all open; its lessons in order, then its checkpoint
//   lesson (learn)     = one outline bullet with its sub-items, at most LESSON_MAX items (split into parts)
//   checkpoint         = a test of the objective     CAREER.checkpointQuestions questions, PASS.checkpoint to clear
//   weak spots, boss   = as in every map             the boss opens once every checkpoint is cleared; it samples
//                                                    CAREER.bossItems items across the objectives (never all ~260)
//
// The package (public/careers/<id>.json, built by dev/careers/build-career.mjs from twice-reviewed cards; how to make
// one: docs/career-mode-guide.md):
//   { id, title, version, areas: [{ id, number, title, weight, theme, motif, palette, bossName, story, canDo,
//     sections: [{ id, title, short }], items: [{ id, kind, front, back, section }],
//     lessons: [{ section, title, itemIds }] }] }
// Nothing here talks to the network: the loader (`loadCareer`, CareerMap.jsx) fetches the file.
// Known gap: a started course keeps the card text it started with; a package fix reaches it only after Start over.

export const CAREER_MAP_VERSION = 2 // a career map: an older build (MAP_VERSION 1) reads it as "newer", never rewrites it
export const CAREER = {
  lessonMax: 4, checkpointItems: 24, checkpointQuestions: 12, bossItems: 30,
  // THE BOSS LADDER (the owner: a domain is a month or two of study, so one boss per domain was far too slow; Legends
  // paces 8 to 14 lessons, then a boss). An island is cut into REGIONS of regionMin..regionMax lessons, each ending in
  // its boss; the island ends in a RAID boss over the whole domain; every island cleared opens the FINAL raid.
  regionTarget: 30, // new things taught per region (a lesson teaches 1 to 4): about 8 to 14 lessons
  regionItems: 36, regionQuestions: 15,
  raidItems: 60, raidQuestions: 25,
  finalItems: 90, finalQuestions: 30,
  acronymLesson: 8, acronymDrill: 15, // the acronym track: lessons of 8, a drill of 15 questions over them all
}
// Has the learner played any step of this course (a finished step, or any attempt)? A course without is safe to rebuild.
export const careerHasProgress = (map) => Object.keys(map?.days || {}).length > 0 || (map?.helpers?.scroll || 0) > 0 || (map?.helpers?.shield || 0) > 0
  || (map?.areas || []).some((a) => a.storySeen || a.chestOpened || (a.nodes || []).some((n) => n.status === 'done' || (n.attempts || 0) > 0)
    || (a.items || []).some((it) => it.cardNoteId || (it.seen || 0) > 0 || it.missNudged))
// Raid art per island, in package order, and the final raid's (raid boss drawings with three phases).
export const CAREER_RAID_MOTIFS = ['titan', 'hydra', 'chronos', 'vampire', 'seraph']
export const CAREER_FINAL_MOTIF = 'ophanim'
// DOMAIN PICTURES (the owner, 2026-11-15: "pictures that pertain to the topic of the domain"): per course, one topic
// picture per domain in package order, hand-drawn files in public/assets/legends/career/<topic>.svg (generic symbols,
// no logos). Chosen at RENDER time, never stored in the map, so older saved maps get them too; a course or domain
// with no entry keeps its adventure banner. Design: docs/plans/2026-11-15-domain-pictures.md.
export const CAREER_TOPICS = ['concepts', 'threats', 'architecture', 'operations', 'governance']
export const CAREER_TOPIC_ART = {
  'security-plus-sy0-701': ['concepts', 'threats', 'architecture', 'operations', 'governance'],
}
// The topic picture's URL for a course map's island ('' = none: keep the adventure banner).
export function careerTopicArt(map, area) {
  const list = CAREER_TOPIC_ART[map?.career?.id] || []
  const n = Math.round(Number(area?.number) || 0)
  const topic = n >= 1 ? list[n - 1] : ''
  return topic && CAREER_TOPICS.includes(topic) && !area?.final ? `/assets/legends/career/${topic}.svg` : ''
}
// EVERY REGION BOSS IS ITS OWN BOSS (the owner, 2026-11-15: no two bosses of a domain may be the same boss): a
// Legends boss drawing and a name of its own, per island in package order, region by region. No drawing repeats in the
// course or matches an island's own. An island with more regions than its list takes the next unused drawing.
export const CAREER_REGION_BOSSES = [
  [['dojo', 'The Control Sensei'], ['mirror', 'The Trust Mirror'], ['manor', 'The Change Butler'], ['crystal', 'The Cipher Crystal']],
  [['pirate', 'Captain Breach'], ['graveyard', 'The Unpatched Wraith'], ['hive', 'The Botnet Queen'], ['sewer', 'The Injection Rat'], ['underworld', 'The Ransom Lord']],
  [['city', 'The Segment Mayor'], ['space', 'The Cloud Drifter'], ['mountains', 'The Redundancy Giant'], ['ice', 'The Cold Storage Yeti']],
  [['arena', 'The Hardening Champion'], ['frontier', 'The Asset Sheriff'], ['mine', 'The Vuln Miner'], ['junkyard', 'The Scrap Logger'], ['volcano', 'The Alert Inferno'], ['fungal', 'The Identity Spore'], ['jungle', 'The Automation Ape'], ['savanna', 'The Incident Lion']],
  [['celestial', 'The Governance Oracle'], ['garden', 'The Risk Gardener'], ['stage', 'The Vendor Ringmaster'], ['sakura', 'The Compliance Blossom'], ['moonlit', 'The Audit Owl'], ['dream', 'The Awareness Dreamer']],
].map((list) => list.map(([motif, name]) => ({ motif, name })))
const SPARE_REGION_MOTIFS = ['arcade', 'carnival', 'desert', 'forest', 'ocean', 'primeval', 'sky', 'sweets']
// The boss of region `n` (1-based) on island `islandIndex`: { motif, name } (name '' = the generic "Region N Guardian").
export function regionBossFor(islandIndex, n) {
  const own = CAREER_REGION_BOSSES[islandIndex]?.[n - 1]
  if (own) return own
  const used = CAREER_REGION_BOSSES.reduce((k, l) => k + l.length, 0)
  return { motif: SPARE_REGION_MOTIFS[(islandIndex * 7 + n + used) % SPARE_REGION_MOTIFS.length], name: '' }
}
// Older saves built before every region boss had its own: fill the drawing and name in (pure; normalizeMap calls it).
export function fillRegionBosses(area, islandIndex) {
  if (!(area?.regions || []).length || !(area.nodes || []).some((n) => n.stage === 'region' && !n.motif)) return area
  return { ...area, nodes: area.nodes.map((n) => {
    if (n.stage !== 'region' || n.motif) return n
    const r = area.regions.find((x) => x.id === n.region)
    const b = regionBossFor(islandIndex, r?.n || 1)
    return { ...n, motif: b.motif, ...(b.name ? { bossName: b.name } : {}) }
  }) }
}
export const CAREER_LAYOUT = 2 // 1 = objective checkpoints + one boss; 2 = regions, region bosses, island raids, final raid
export const FINAL_AREA_ID = 'final'
// Quiz kinds over a whole objective, region or island: written from a SAMPLE of its items (CAREER.*Items), never all.
export const careerSampleMax = (kind, stage = '') => (kind === 'checkpoint' ? CAREER.checkpointItems
  : kind === 'boss' ? (stage === 'region' ? CAREER.regionItems : stage === 'raid' ? CAREER.raidItems : stage === 'final' ? CAREER.finalItems : CAREER.bossItems)
  : kind === 'legendary' ? CAREER.bossItems : 0)
// A fight that clears its island: the raid (or an older course's single boss) and the final raid; a region boss never does.
export const clearsIsland = (node) => node?.kind === 'boss' && node.stage !== 'region'
export const isFinalArea = (area) => !!area?.final

// Cut an island's lessons (in objective order) into regions that are FAIR to study (the owner: never "2 new things,
// then a boss" next to "30 new things, then a boss"): balanced by the number of NEW THINGS taught (a lesson teaches 1
// to 4 items), never by the lesson count. The island gets round(items / regionTarget) regions; an exact search picks
// the cut points making every region's item count as even as possible, preferring to cut where an objective ends (a
// cut inside an objective costs extra). -> [[lesson, ...], ...] (pure, tested).
export function cutRegions(sections, lessons, { target = CAREER.regionTarget } = {}) {
  const seq = sections.flatMap((sec) => lessons.filter((l) => l.section === sec.id))
  const n = seq.length
  if (!n) return []
  const w = seq.map((l) => Math.max(1, (l.itemIds || []).length))
  const pre = [0]; for (const x of w) pre.push(pre[pre.length - 1] + x)
  const total = pre[n]
  const k = Math.max(1, Math.min(n, Math.round(total / target)))
  const avg = total / k
  const midCut = (avg * 0.3) ** 2 // the extra cost of a cut inside an objective
  const cutCost = (i) => (i >= n || seq[i].section !== seq[i - 1].section ? 0 : midCut)
  // best[j][i]: the cheapest way to cut the first i lessons into j regions.
  const best = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(Infinity))
  const from = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(-1))
  best[0][0] = 0
  for (let j = 1; j <= k; j++) {
    for (let i = j; i <= n - (k - j); i++) {
      for (let h = j - 1; h < i; h++) {
        if (best[j - 1][h] === Infinity) continue
        const c = best[j - 1][h] + (pre[i] - pre[h] - avg) ** 2 + cutCost(i)
        if (c < best[j][i]) { best[j][i] = c; from[j][i] = h }
      }
    }
  }
  const cuts = []
  for (let j = k, i = n; j > 0; j--) { const h = from[j][i]; cuts.unshift([h, i]); i = h }
  return cuts.map(([h, i]) => seq.slice(h, i))
}

// The courses this build knows. `match`: a mode whose name or description is about it gets the tile first.
export const CAREERS = [
  // `noticeKey`: the course's trademark line, shown on its screens (we name the exam only to describe it).
  { id: 'security-plus-sy0-701', titleKey: 'lg_careerSecPlus', noticeKey: 'lg_careerSecPlusNotice', deck: 'Security+', url: '/careers/security-plus-sy0-701.json', match: /security\s*\+|security\s*plus|sy0-?701/i },
]
export const careerFor = (id) => CAREERS.find((c) => c.id === id) || null
// A course fits a mode about it, and NEVER a language mode (a course in a Spanish mode was quizzed and graded as Spanish).
export const careerMatches = (career, subject) => !subject?.isLanguage && subject?.type !== 'language' && !!career?.match?.test(`${subject?.name || ''} ${subject?.description || ''}`)
// The modes a course fits ([{ id, name, ... }] from ctx.modes.list()), the one using the course's deck first.
export const courseModes = (career, modes) => (Array.isArray(modes) ? modes : []).filter((m) => careerMatches(career, { ...m, isLanguage: m.type === 'language' }))
  .sort((a, b) => (b.ankiDeck === career?.deck) - (a.ankiDeck === career?.deck))

// The feature context a course runs with: ALWAYS a general subject in the app language, whatever mode holds it. Questions,
// grading, hints and fights read ctx.subject and ctx.study.rules(); a language mode's learned language, dialect,
// accents and slips never reach a course (a course held by a language mode graded right answers as wrong-language).
export function courseCtx(ctx, map) {
  if (!ctx?.subject || !isCareerMap(map)) return ctx
  const s = ctx.subject
  const title = map.career?.title || s.name
  const subject = {
    ...s, name: title, type: 'general', isLanguage: false, description: title,
    learnLang: s.userLang || s.learnLang, learnLangIso: ctx.lang || '', rules: '', accents: false,
    grammarSlips: () => '', grammarSlipList: () => [],
  }
  const study = ctx.study ? { ...ctx.study, rules: () => ({ ...(ctx.study.rules?.() || {}), studyLanguage: '', quizLanguage: '', dialect: '', wordHints: false, accentDrill: false }), setRules: () => false } : ctx.study
  return { ...ctx, subject, study }
}

const str = (v, max = 4000) => String(v ?? '').replace(/\s+\n/g, '\n').trim().slice(0, max)

// A package in the shape the map needs, or null when it is not one (a bad file never becomes a broken map).
export function shapePackage(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.areas) || !raw.areas.length || !raw.id) return null
  const areas = raw.areas.map((a) => {
    const items = (Array.isArray(a?.items) ? a.items : []).filter((it) => it?.id && it.front && it.back && it.section)
      .map((it) => ({ id: String(it.id), kind: ['term', 'rule', 'skill', 'brief'].includes(it.kind) ? it.kind : 'term', front: str(it.front, 200), back: str(it.back, 2000), section: String(it.section) }))
    const ids = new Set(items.map((it) => it.id))
    const sections = (Array.isArray(a?.sections) ? a.sections : []).filter((s) => s?.id && s.title).map((s) => ({ id: String(s.id), title: str(s.title, 200), short: str(s.short || s.title, 60), ...(s.brief && ids.has(String(s.brief)) ? { brief: String(s.brief) } : {}) }))
    const lessons = (Array.isArray(a?.lessons) ? a.lessons : [])
      .map((l) => ({ section: String(l?.section || ''), title: str(l?.title, 80), itemIds: (Array.isArray(l?.itemIds) ? l.itemIds : []).map(String).filter((id) => ids.has(id)) }))
      .filter((l) => l.itemIds.length && sections.some((s) => s.id === l.section))
    return {
      id: String(a?.id || ''), number: str(a?.number, 10), title: str(a?.title, 120), weight: Number(a?.weight) || 0, theme: str(a?.theme, 300),
      motif: str(a?.motif, 30), palette: str(a?.palette, 30), bossName: str(a?.bossName, 60), story: (a?.story || []).map((s) => str(s, 220)).filter(Boolean).slice(0, 3),
      canDo: (a?.canDo || []).map((s) => str(s, 140)).filter(Boolean).slice(0, 4), sections, items, lessons,
      ...(a?.brief && ids.has(String(a.brief)) ? { brief: String(a.brief) } : {}),
      acronyms: (Array.isArray(a?.acronyms) ? a.acronyms : []).filter((x) => x?.id && x.acronym && Array.isArray(x.expansions) && x.expansions.length)
        .map((x) => ({ id: String(x.id), acronym: str(x.acronym, 30), expansions: x.expansions.map((e) => str(e, 160)).filter(Boolean).slice(0, 4) })),
    }
  }).filter((a) => a.id && a.title && a.items.length && a.sections.length && a.lessons.length)
  if (areas.length !== raw.areas.length) return null
  return { id: String(raw.id), title: str(raw.title, 120), version: String(raw.version || '1'), areas }
}

const node = (areaId, k, fields) => ({ id: `${areaId}-${k}`, title: '', status: 'locked', stars: 0, bestScore: 0, attempts: 0, optional: false, ...fields })

// THE ACRONYM TRACK (the owner: acronyms are a big part of the exam): an island's acronyms (the package's
// `acronyms`, one island each, build-career.mjs) become items of kind 'acronym' (section ACRONYM_SECTION), lessons of
// CAREER.acronymLesson in the island's own order, and a DRILL over all of them. All optional (never block a boss) and
// open at once; region bosses and the raid never ask them (their item lists hold no acronym).
export const ACRONYM_SECTION = 'acr'
export const isAcronymTrack = (n) => n?.track === ACRONYM_SECTION
const acronymBack = (x, where) => [
  `Definition: ${x.acronym} stands for ${x.expansions.length > 1 ? x.expansions.map((e, i) => `(${i + 1}) ${e}`).join(', ') : x.expansions[0]}.`,
  'Category: Acronyms',
  `Key Points: ${[x.expansions.length > 1 ? 'More than one meaning on the exam list: the question tells you which one' : 'Know both directions: the letters from the name, the name from the letters', where ? `Where it shows up: ${where}` : ''].filter(Boolean).join('; ')}`,
].join('\n')
export function withAcronyms(area, acronyms) {
  const list = (acronyms || []).filter((x) => !(area.items || []).some((it) => it.id === x.id))
  if (!list.length || (area.nodes || []).some(isAcronymTrack)) return area
  const items = list.map((x) => {
    const re = new RegExp(`(^|[^A-Za-z0-9])${x.acronym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^A-Za-z0-9]|$)`)
    const where = (area.items || []).find((it) => it.kind !== 'brief' && it.kind !== 'acronym' && re.test(`${it.front}\n${it.back}`))?.front || ''
    return { id: x.id, kind: 'acronym', front: x.acronym, back: acronymBack(x, where), section: ACRONYM_SECTION, cardNoteId: null, seen: 0, right: 0 }
  })
  const n = Math.ceil(items.length / CAREER.acronymLesson)
  const size = Math.ceil(items.length / n)
  const lessons = Array.from({ length: n }, (_, i) => items.slice(i * size, (i + 1) * size)).filter((g) => g.length)
    .map((g, i, all) => node(area.id, `acr-l${i + 1}`, { kind: 'learn', track: ACRONYM_SECTION, optional: true, status: 'open', title: `${g[0].front} to ${g.at(-1).front} (${i + 1}/${all.length})`, itemIds: g.map((it) => it.id) }))
  const drill = node(area.id, 'acr-drill', { kind: 'practice', track: ACRONYM_SECTION, optional: true, status: 'open', title: '', count: CAREER.acronymDrill, itemIds: items.map((it) => it.id) })
  const at = (area.nodes || []).findIndex((x) => x.kind === 'weak')
  const nodes = at < 0 ? [...(area.nodes || []), ...lessons, drill] : [...area.nodes.slice(0, at), ...lessons, drill, ...area.nodes.slice(at)]
  return { ...area, items: [...(area.items || []), ...items], nodes }
}
// A course map saved before the acronym track: add it from the package (nothing else changes). Pure.
export function addAcronymTrack(map, pkg) {
  if (!isCareerMap(map) || !pkg) return map
  let changed = false
  const areas = map.areas.map((a) => {
    const src = pkg.areas.find((x) => x.id === a.id)
    const next = src ? withAcronyms(a, src.acronyms) : a
    if (next !== a) changed = true
    return next
  })
  return changed ? { ...map, areas, career: { ...map.career, acronyms: true } } : (map.career.acronyms ? map : { ...map, career: { ...map.career, acronyms: true } })
}

// The map a career starts with: every island fully built (no AI plan or detail call). Per island: its regions in order
// (each region's lessons, then its region boss), Weak spots, then the island's RAID boss; after the last island, the
// FINAL raid (an area of its own, `final: true`, no items: its fight draws on every island). `start` as the
// questionnaire saved it.
export function buildCareerMap(pkg, { modeId, subject, start = null }, now = Date.now()) {
  const areas = pkg.areas.map((a, ai) => {
    const nodes = []
    const regions = cutRegions(a.sections, a.lessons).map((list, ri) => {
      const id = `r${ri + 1}`
      const secIds = [...new Set(list.map((l) => l.section))]
      const counters = {}
      for (const l of list) {
        const at = a.lessons.filter((x) => x.section === l.section).indexOf(l)
        counters[l.section] = (counters[l.section] || 0) + 1
        nodes.push(node(a.id, `${l.section}-l${at + 1}`, { kind: 'learn', section: l.section, region: id, title: l.title, itemIds: l.itemIds }))
      }
      const itemIds = [...new Set(list.flatMap((l) => l.itemIds))].filter((x) => a.items.find((it) => it.id === x)?.kind !== 'brief')
      const own = regionBossFor(ai, ri + 1)
      nodes.push(node(a.id, `${id}-boss`, { kind: 'boss', stage: 'region', region: id, itemIds, count: CAREER.regionQuestions, motif: own.motif, ...(own.name ? { bossName: own.name } : {}) }))
      return { id, n: ri + 1, sections: secIds }
    })
    nodes.push(node(a.id, 'weak', { kind: 'weak', itemIds: [], optional: true }))
    nodes.push(node(a.id, 'boss', { kind: 'boss', stage: 'raid', motif: CAREER_RAID_MOTIFS[ai % CAREER_RAID_MOTIFS.length], count: CAREER.raidQuestions, itemIds: a.items.filter((it) => it.kind !== 'brief').map((it) => it.id) }))
    return withAcronyms({
      id: a.id, title: a.title, theme: a.theme, motif: a.motif, palette: a.palette || 'original', status: 'open', detailed: true, frozen: false,
      number: a.number, weight: a.weight, sections: a.sections, regions, ...(a.brief ? { brief: a.brief } : {}), bossName: a.bossName, story: a.story, canDo: a.canDo,
      // Ready to show as built (the first lesson of every region open): the store caches what is written.
      items: a.items.map((it) => ({ ...it, cardNoteId: null, seen: 0, right: 0 })), nodes: normalizeCareerNodes(nodes, 'open'),
    }, a.acronyms)
  })
  const final = {
    id: FINAL_AREA_ID, final: true, title: pkg.title, theme: '', motif: areas[0]?.motif || '', palette: 'original', status: 'locked', detailed: true, frozen: false,
    number: '', weight: 0, sections: [], regions: [], bossName: '', story: [], canDo: [], items: [],
    nodes: [node(FINAL_AREA_ID, 'raid', { kind: 'boss', stage: 'final', motif: CAREER_FINAL_MOTIF, count: CAREER.finalQuestions, itemIds: [] })],
  }
  return {
    version: CAREER_MAP_VERSION, modeId, career: { id: pkg.id, title: pkg.title, version: pkg.version, layout: CAREER_LAYOUT, acronyms: true },
    subject: { name: String(subject?.name || ''), description: String(subject?.description || '') },
    createdAt: now, updatedAt: now, start, areas: [...areas, final], helpers: { scroll: 0, shield: 0 }, days: {},
  }
}

// THE CAREER LADDER (normalizeMap calls it for a career map): islands never lock; inside an island every region is
// open and climbs on its own (its lessons in order, then its region boss); the raid opens once every region boss (and
// every other required step) is done; Weak spots opens with the raid. An older course (layout 1) climbs per objective
// to its checkpoint the same way. The final raid's area is opened or locked by the map (careerAreaStatus).
export function normalizeCareerNodes(nodes, areaStatus) {
  const blocked = new Set()
  const isRaid = (n) => n.kind === 'boss' && n.stage !== 'region'
  const required = nodes.filter((n) => !n.optional && !isRaid(n) && n.kind !== 'weak')
  const allDone = required.every((n) => n.status === 'done')
  const regionDone = (r) => nodes.filter((n) => n.region === r && n.kind !== 'boss').every((n) => n.status === 'done')
  return nodes.map((n) => {
    if (n.status === 'done') return n
    if (areaStatus === 'done') return { ...n, status: 'open' }
    if (areaStatus === 'locked') return { ...n, status: 'locked' }
    if (n.stage === 'final') return { ...n, status: 'open' }
    if (isRaid(n)) return { ...n, status: allDone ? 'open' : 'locked' }
    if (n.kind === 'weak') return { ...n, status: allDone ? 'open' : 'locked' }
    if (n.kind === 'boss') return { ...n, status: regionDone(n.region) ? 'open' : 'locked' }
    if (n.optional) return { ...n, status: 'open' }
    const key = n.region || n.section || ''
    if (blocked.has(key)) return { ...n, status: 'locked' }
    blocked.add(key)
    return { ...n, status: 'open' }
  })
}
// An island's status in a course: the final raid's area opens once every island is cleared; islands are always open.
export function careerAreaStatus(area, areas) {
  if (area.status === 'done') return 'done'
  if (!isFinalArea(area)) return 'open'
  return (areas || []).filter((a) => !isFinalArea(a)).every((a) => a.status === 'done') ? 'open' : 'locked'
}

// Per region: { id, n, sections: [section], lessons, lessonsDone, boss (node|null), done, nodes } (the island page).
export function careerRegions(area) {
  const nodes = area?.nodes || []
  return (area?.regions || []).map((r) => {
    const own = nodes.filter((n) => n.region === r.id)
    const lessons = own.filter((n) => n.kind !== 'boss')
    const boss = own.find((n) => n.kind === 'boss') || null
    const sections = (r.sections || []).map((id) => (area.sections || []).find((s) => s.id === id)).filter(Boolean)
    return { ...r, sections, nodes: own, lessons: lessons.length, lessonsDone: lessons.filter((n) => n.status === 'done').length, boss, done: !!boss && boss.status === 'done' }
  })
}
export const regionBossesLeft = (area) => careerRegions(area).filter((r) => r.boss && !r.done).length
// The region to show open: the first one started but not finished, else the first not finished.
export function currentRegion(area) {
  const list = careerRegions(area)
  return (list.find((r) => !r.done && r.nodes.some((n) => n.status === 'done')) || list.find((r) => !r.done) || list[0] || null)?.id || null
}
// The area a course fight runs on: a region boss is named after its region, a raid wears its raid art (its own motif)
// and the island's boss name, the final raid draws on every island (items and objectives of all of them).
// → { area, node } (the node of the final raid lists every island's items).
export function careerFight(area, node, areas, { regionName = '', finalName = '' } = {}) {
  if (node?.kind !== 'boss' || !node.stage) return { area, node }
  if (node.stage === 'region') return { area: { ...area, motif: node.motif || area.motif, bossName: node.bossName || regionName || area.bossName }, node }
  if (node.stage === 'raid') return { area: { ...area, motif: node.motif || area.motif }, node }
  const islands = (areas || []).filter((a) => !isFinalArea(a))
  const items = islands.flatMap((a) => a.items || [])
  return {
    area: { ...area, motif: node.motif || area.motif, bossName: finalName || area.bossName, items, sections: islands.flatMap((a) => a.sections || []) },
    node: { ...node, itemIds: items.filter((it) => it.kind !== 'brief').map((it) => it.id) },
  }
}
// Is this fight drawn as a RAID boss (raid art, three phases)?
export const raidLook = (node) => node?.kind === 'boss' && (node.stage === 'raid' || node.stage === 'final')

// Per objective: { id, title, short, lessons, lessonsDone, checkpoint (node|null), done } (the island page's cards).
export function careerSections(area) {
  const nodes = area?.nodes || []
  return (area?.sections || []).map((s) => {
    const own = nodes.filter((n) => n.section === s.id)
    const lessons = own.filter((n) => n.kind !== 'checkpoint')
    const checkpoint = own.find((n) => n.kind === 'checkpoint') || null
    return { ...s, nodes: own, lessons: lessons.length, lessonsDone: lessons.filter((n) => n.status === 'done').length, checkpoint, done: !!checkpoint && checkpoint.status === 'done' }
  })
}
export const checkpointsLeft = (area) => careerSections(area).filter((s) => s.checkpoint && !s.done).length
// The objective to show open: the first one started but not finished, else the first not finished.
export function currentSection(area) {
  const list = careerSections(area)
  return (list.find((s) => !s.done && s.nodes.some((n) => n.status === 'done')) || list.find((s) => !s.done) || list[0] || null)?.id || null
}

// The island a learner is on: one in progress, else the first unfinished, else the first (the map screen and Help).
export const currentIsland = (areas) => {
  const list = (areas || []).filter((a) => !isFinalArea(a) || a.status !== 'locked')
  return list.find((a) => a.status !== 'done' && (a.nodes || []).some((n) => n.status === 'done')) || list.find((a) => a.status !== 'done') || list[0] || null
}

// THE NEXT STEP (the owner found the course map overwhelming: one obvious "Continue" now leads): on the island in
// progress, the first open step of the objective in progress (its lessons in order, then its checkpoint), else the
// boss when it is open. → { area, node, section } | null (everything done).
export function nextCareerStep(areas) {
  const area = currentIsland(areas)
  if (!area || area.status === 'done') return null
  if (area.regions?.length) {
    const regions = careerRegions(area)
    const cur = currentRegion(area)
    for (const r of [...regions.filter((x) => x.id === cur), ...regions.filter((x) => x.id !== cur)]) {
      const node = r.nodes.find((n) => n.status === 'open' && !n.optional)
      if (node) return { area, node, section: (area.sections || []).find((s) => s.id === node.section) || null, region: r }
    }
  } else {
    const sections = careerSections(area)
    const order = [...sections.filter((x) => x.id === currentSection(area)), ...sections.filter((x) => x.id !== currentSection(area))]
    for (const sec of order) {
      const node = sec.nodes.find((n) => n.status === 'open' && !n.optional)
      if (node) return { area, node, section: sec, region: null }
    }
  }
  const boss = (area.nodes || []).find((n) => n.kind === 'boss' && n.stage !== 'region' && n.status === 'open')
  return boss ? { area, node: boss, section: null, region: null } : null
}

// How shaky an item is (lower = shakier): never asked counts as shaky, then the share answered right.
const shaky = (it) => (it.seen ? (it.right || 0) / it.seen : -1)

// The items a checkpoint or boss quiz is written from: at most `max`, shakiest first; a boss spreads them over the
// objectives by their size (every objective gets at least one). `rand` makes ties and the boss's spread vary per attempt.
export function careerQuizItems(area, node, { max, rand = Math.random } = {}) {
  const byId = new Map((area?.items || []).map((it) => [it.id, it]))
  const pool = (node?.itemIds || []).map((id) => byId.get(id)).filter((it) => it && it.kind !== 'brief') // a briefing is never quizzed
  if (pool.length <= max) return pool
  // A checkpoint keeps the same sample while the tallies stay the same (its saved question set is keyed by the sample;
  // a lesson or an attempt that moves a tally picks a new sample). Only fights, written fresh every attempt, vary ties.
  const fresh = node.kind === 'boss' || node.kind === 'legendary'
  const order = (list) => list.map((it, i) => ({ it, k: shaky(it), r: fresh ? rand() : i })).sort((a, b) => a.k - b.k || a.r - b.r).map((x) => x.it)
  if (node.kind !== 'boss' && node.kind !== 'legendary') return order(pool).slice(0, max)
  const groups = new Map()
  for (const it of pool) { const g = groups.get(it.section) || []; g.push(it); groups.set(it.section, g) }
  const share = [...groups.entries()].map(([sec, list]) => ({ sec, list: order(list), n: Math.max(1, Math.floor((list.length / pool.length) * max)) }))
  // Over the cap (many small objectives at one each): take from the biggest groups first, never an objective's last one.
  while (share.reduce((n, g) => n + g.n, 0) > max) {
    const big = share.reduce((a, b) => (b.n > a.n ? b : a))
    if (big.n <= 1) break
    big.n--
  }
  // More objectives than places: one item each from the shakiest objectives' picks (never over `max`).
  const picked = order(share.flatMap((g) => g.list.slice(0, g.n))).slice(0, max)
  const left = order(pool.filter((it) => !picked.includes(it)))
  return [...picked, ...left.slice(0, max - picked.length)]
}

// A career map never grows, is never re-planned, and has no AI-written boss names.
export const isCareerMap = (map) => !!map?.career?.id
