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
export const CAREER = { lessonMax: 4, checkpointItems: 24, checkpointQuestions: 12, bossItems: 30 }
// Quiz kinds over a whole objective or island: written from a SAMPLE of its items (CAREER.*Items), never all of them.
export const careerSampleMax = (kind) => (kind === 'checkpoint' ? CAREER.checkpointItems : kind === 'boss' || kind === 'legendary' ? CAREER.bossItems : 0)

// The courses this build knows. `match`: a mode whose name or description is about it gets the tile first.
export const CAREERS = [
  { id: 'security-plus-sy0-701', titleKey: 'lg_careerSecPlus', url: '/careers/security-plus-sy0-701.json', match: /security\s*\+|security\s*plus|sy0-?701/i },
]
export const careerFor = (id) => CAREERS.find((c) => c.id === id) || null
export const careerMatches = (career, subject) => !!career?.match?.test(`${subject?.name || ''} ${subject?.description || ''}`)

const str = (v, max = 4000) => String(v ?? '').replace(/\s+\n/g, '\n').trim().slice(0, max)

// A package in the shape the map needs, or null when it is not one (a bad file never becomes a broken map).
export function shapePackage(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.areas) || !raw.areas.length || !raw.id) return null
  const areas = raw.areas.map((a) => {
    const items = (Array.isArray(a?.items) ? a.items : []).filter((it) => it?.id && it.front && it.back && it.section)
      .map((it) => ({ id: String(it.id), kind: ['term', 'rule', 'skill'].includes(it.kind) ? it.kind : 'term', front: str(it.front, 200), back: str(it.back, 2000), section: String(it.section) }))
    const ids = new Set(items.map((it) => it.id))
    const sections = (Array.isArray(a?.sections) ? a.sections : []).filter((s) => s?.id && s.title).map((s) => ({ id: String(s.id), title: str(s.title, 200), short: str(s.short || s.title, 60) }))
    const lessons = (Array.isArray(a?.lessons) ? a.lessons : [])
      .map((l) => ({ section: String(l?.section || ''), title: str(l?.title, 80), itemIds: (Array.isArray(l?.itemIds) ? l.itemIds : []).map(String).filter((id) => ids.has(id)) }))
      .filter((l) => l.itemIds.length && sections.some((s) => s.id === l.section))
    return {
      id: String(a?.id || ''), number: str(a?.number, 10), title: str(a?.title, 120), weight: Number(a?.weight) || 0, theme: str(a?.theme, 300),
      motif: str(a?.motif, 30), palette: str(a?.palette, 30), bossName: str(a?.bossName, 60), story: (a?.story || []).map((s) => str(s, 220)).filter(Boolean).slice(0, 3),
      canDo: (a?.canDo || []).map((s) => str(s, 140)).filter(Boolean).slice(0, 4), sections, items, lessons,
    }
  }).filter((a) => a.id && a.title && a.items.length && a.sections.length && a.lessons.length)
  if (areas.length !== raw.areas.length) return null
  return { id: String(raw.id), title: str(raw.title, 120), version: String(raw.version || '1'), areas }
}

const node = (areaId, k, fields) => ({ id: `${areaId}-${k}`, title: '', status: 'locked', stars: 0, bestScore: 0, attempts: 0, optional: false, ...fields })

// The map a career starts with: every island fully built (no AI plan or detail call), each objective's lessons then its
// checkpoint, then Weak spots and the boss. `start` as the questionnaire saved it.
export function buildCareerMap(pkg, { modeId, subject, start = null }, now = Date.now()) {
  const areas = pkg.areas.map((a) => {
    const nodes = []
    for (const s of a.sections) {
      a.lessons.filter((l) => l.section === s.id).forEach((l, i) => nodes.push(node(a.id, `${s.id}-l${i + 1}`, { kind: 'learn', section: s.id, title: l.title, itemIds: l.itemIds })))
      const ids = a.items.filter((it) => it.section === s.id).map((it) => it.id)
      if (ids.length) nodes.push(node(a.id, `${s.id}-check`, { kind: 'checkpoint', section: s.id, title: '', itemIds: ids }))
    }
    nodes.push(node(a.id, 'weak', { kind: 'weak', itemIds: [], optional: true }))
    nodes.push(node(a.id, 'boss', { kind: 'boss', itemIds: a.items.map((it) => it.id) }))
    return {
      id: a.id, title: a.title, theme: a.theme, motif: a.motif, palette: a.palette || 'original', status: 'open', detailed: true, frozen: false,
      number: a.number, weight: a.weight, sections: a.sections, bossName: a.bossName, story: a.story, canDo: a.canDo,
      // Ready to show as built (the first lesson of every objective open): the store caches what is written.
      items: a.items.map((it) => ({ ...it, cardNoteId: null, seen: 0, right: 0 })), nodes: normalizeCareerNodes(nodes, 'open'),
    }
  })
  return {
    version: CAREER_MAP_VERSION, modeId, career: { id: pkg.id, title: pkg.title, version: pkg.version },
    subject: { name: String(subject?.name || ''), description: String(subject?.description || '') },
    createdAt: now, updatedAt: now, start, areas, helpers: { scroll: 0, shield: 0 }, days: {},
  }
}

// THE CAREER LADDER (normalizeMap calls it for a career map): islands never lock; inside an island every objective is
// open and climbs on its own (its lessons in order, then its checkpoint); the boss opens once every required step is
// done; Weak spots open with the boss.
export function normalizeCareerNodes(nodes, areaStatus) {
  const blocked = new Set()
  const required = nodes.filter((n) => !n.optional && n.kind !== 'boss' && n.kind !== 'weak')
  const allDone = required.every((n) => n.status === 'done')
  return nodes.map((n) => {
    if (n.status === 'done') return n
    if (areaStatus === 'done') return { ...n, status: 'open' }
    if (n.kind === 'boss') return { ...n, status: allDone ? 'open' : 'locked' }
    if (n.kind === 'weak') return { ...n, status: allDone ? 'open' : 'locked' }
    if (n.optional) return { ...n, status: 'open' }
    const key = n.section || ''
    if (blocked.has(key)) return { ...n, status: 'locked' }
    blocked.add(key)
    return { ...n, status: 'open' }
  })
}

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
export const currentIsland = (areas) => (areas || []).find((a) => a.status !== 'done' && (a.nodes || []).some((n) => n.status === 'done')) || (areas || []).find((a) => a.status !== 'done') || (areas || [])[0] || null

// How shaky an item is (lower = shakier): never asked counts as shaky, then the share answered right.
const shaky = (it) => (it.seen ? (it.right || 0) / it.seen : -1)

// The items a checkpoint or boss quiz is written from: at most `max`, shakiest first; a boss spreads them over the
// objectives by their size (every objective gets at least one). `rand` makes ties and the boss's spread vary per attempt.
export function careerQuizItems(area, node, { max, rand = Math.random } = {}) {
  const byId = new Map((area?.items || []).map((it) => [it.id, it]))
  const pool = (node?.itemIds || []).map((id) => byId.get(id)).filter(Boolean)
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
