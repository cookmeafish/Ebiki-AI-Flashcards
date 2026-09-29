// LEGENDS MAP (pure, tested): the per-mode map of areas, each a ladder of nodes with a boss on top.
// Everything here is data in, data out: unlock rules, stars, freezing, lazy area detail, merging an edit from
// Ebi. Prompts live in ./prompt.js, storage in ./store.js, screens in the .jsx files.
//
// LegendsMap { version, modeId, subject: { name, description }, createdAt, updatedAt,
//              start: { reason, selfRating, goal, placement: { level, answered, at } | null }, areas: Area[] }
// Area  { id, title, theme, motif, palette, status: 'locked'|'open'|'done',
//         detailed, frozen, items: Item[], nodes: Node[] }            (first area = bottom of the map)
// Node  { id, kind, title, itemIds, status, stars (0..3), bestScore (0..1), attempts, optional }
// Item  { id, kind: 'term'|'rule'|'skill', front, back, cardNoteId, seen, right }
export const MAP_VERSION = 1
export const AREAS = { min: 3, max: 12, plan: 8 }       // areas planned at once (titles only, detail comes later)
export const ITEMS = { min: 4, max: 24 }
export const NODES = { min: 3, max: 8 }                 // not counting the boss
// A new area is LESSONS levels, each teaching PER_LESSON new items and then quizzing them (a Learn step and a
// Practice step over the same items read as the same level twice). Older maps keep their practice steps.
export const LESSONS = 8
export const PER_LESSON = { min: 2, max: 3 }
export const LOOKAHEAD = 2                              // areas kept fully detailed ahead of the learner
export const NODE_KINDS = ['learn', 'practice', 'scene', 'rule', 'talk', 'boss']
export const ITEM_KINDS = ['term', 'rule', 'skill']
export const MOTIFS = ['forest', 'city', 'ocean', 'mountains', 'lab', 'stage', 'sky', 'desert']
export const PALETTES = ['brand', 'ocean', 'forest', 'sunset', 'night', 'sand', 'candy', 'steel']
export const PASS = { node: 0.6, boss: 0.7, legendary: 0.9 } // share of answers right to clear a node
// Weak spots: the level before the boss, made from the island's shakiest items. Clearing it ONCE earns the area
// one extra boss life (`bonusLife`); a replay never adds another.
export const WEAK = { items: 6 }
export const WEAK_BONUS_LIVES = 1
export const STAR_AT = [0.8, 0.95]                      // 2 stars, 3 stars (1 star = cleared)
export const WEAK_RATIO = 0.6                           // an item answered right less often than this is weak
export const NEW_SEEN = 2                               // an item seen fewer times than this is new
const TITLE_MAX = 60
const THEME_MAX = 160
const FRONT_MAX = 160
const BACK_MAX = 700

const str = (v, max, clean = (s) => s) => clean(String(v ?? '').replace(/\s+/g, ' ').trim()).slice(0, max)
const pick = (v, list, fallback) => (list.includes(String(v || '').toLowerCase()) ? String(v).toLowerCase() : fallback)

// A stable, readable id: lowercase ASCII, unique within `used` (a Set that is updated).
export function slug(text, used = new Set(), fallback = 'area') {
  const base = String(text || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 20) || fallback
  let id = base; let n = 2
  while (used.has(id)) id = `${base}-${n++}`
  used.add(id)
  return id
}

// ── Parsing what the model planned ──────────────────────────────────────────────────────────────────────────

// Map plan → [{ title, theme, motif, palette }] or null when too little came back.
export function parseMapPlan(raw, clean) {
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.areas) ? raw.areas : []
  const out = []
  const seen = new Set()
  for (const a of list) {
    const title = str(a?.title, TITLE_MAX, clean)
    if (!title || seen.has(title.toLowerCase())) continue
    seen.add(title.toLowerCase())
    out.push({ title, theme: str(a?.theme, THEME_MAX, clean), motif: pick(a?.motif, MOTIFS, MOTIFS[out.length % MOTIFS.length]), palette: pick(a?.palette, PALETTES, PALETTES[out.length % PALETTES.length]) })
    if (out.length >= AREAS.max) break
  }
  return out.length >= AREAS.min ? out : null
}

// Area detail → { items, nodes } (ids assigned; the boss appended) or null when unusable.
// Nodes name their items by 1-based index ("items": [1, 3]); a node naming none gets a share of them.
// The Weak spots level (optional: it never blocks the boss). Its questions are picked from `weakItems` when it opens.
const weakNode = (areaId, items) => ({ id: `${areaId}-weak`, kind: 'weak', title: '', itemIds: items.map((x) => x.id), status: 'locked', stars: 0, bestScore: 0, attempts: 0, optional: true })
// The shakiest items first: most missed (by share right), then the least practiced. At most `n`.
export function weakItems(area, n = WEAK.items) {
  const items = [...(area?.items || [])]
  const score = (it) => ((it.seen || 0) ? (it.right || 0) / it.seen : 0.5)
  items.sort((a, b) => score(a) - score(b) || (a.seen || 0) - (b.seen || 0))
  return items.slice(0, n)
}
// Areas detailed before Weak spots existed get the level (before their boss) when the map loads.
export function ensureWeakNodes(map) {
  if (!map || !Array.isArray(map.areas)) return map
  let changed = false
  const areas = map.areas.map((a) => {
    const nodes = a.nodes || []
    const b = nodes.findIndex((n) => n.kind === 'boss')
    if (!a.detailed || b < 0 || nodes.some((n) => n.kind === 'weak')) return a
    changed = true
    return { ...a, nodes: [...nodes.slice(0, b), weakNode(a.id, a.items || []), ...nodes.slice(b)] }
  })
  return changed ? { ...map, areas } : map
}

// A boss's name: a short character name, no wrapping quotes.
export const BOSS_NAME_MAX = 40
export const cleanBossName = (v, clean) => str(v, BOSS_NAME_MAX, clean).replace(/^["'«»“”‘’\s]+|["'«»“”‘’\s]+$/g, '')
export function parseAreaDetail(raw, clean, { areaId = 'a' } = {}) {
  if (!raw || typeof raw !== 'object') return null
  const used = new Set()
  const items = []
  for (const it of Array.isArray(raw.items) ? raw.items : []) {
    const front = str(it?.front, FRONT_MAX, clean)
    const back = clean(String(it?.back ?? '').replace(/\\n/g, '\n').replace(/[ \t]+/g, ' ').trim()).slice(0, BACK_MAX)
    if (!front || !back || items.some((x) => x.front.toLowerCase() === front.toLowerCase())) continue
    items.push({ id: `${areaId}-i${items.length + 1}`, kind: pick(it?.kind, ITEM_KINDS, 'term'), front, back, cardNoteId: null, seen: 0, right: 0 })
    if (items.length >= ITEMS.max) break
  }
  if (items.length < ITEMS.min) return null
  const nodes = []
  const rawNodes = (Array.isArray(raw.nodes) ? raw.nodes : []).filter((n) => String(n?.kind || '').toLowerCase() !== 'boss')
  for (const n of rawNodes) {
    const kind = pick(n?.kind, NODE_KINDS, 'learn')
    if (kind === 'boss' || kind === 'practice') continue // every level teaches something new (no re-drill steps)
    // An item is taught by ONE level: a later level naming it again drops it (and gets the untaught ones below).
    const all = (Array.isArray(n?.items) ? n.items : []).map((x) => Number(x) - 1).filter((i) => Number.isInteger(i) && i >= 0 && i < items.length)
    const idx = kind === 'talk' ? all : all.filter((i) => !nodes.some((o) => o.kind !== 'talk' && o.itemIdx.includes(i)))
    nodes.push({ kind, title: str(n?.title, TITLE_MAX, clean), itemIdx: [...new Set(idx)] })
    if (nodes.filter((x) => x.kind !== 'talk').length >= NODES.max) break
  }
  // Too few steps (or none): a plain ladder of lessons over slices of the items.
  if (nodes.filter((x) => x.kind !== 'talk').length < NODES.min) {
    nodes.length = 0
    const per = 3
    for (let i = 0; i < items.length; i += per) {
      const idx = Array.from({ length: Math.min(per, items.length - i) }, (_, k) => i + k)
      nodes.push({ kind: 'learn', title: '', itemIdx: idx })
    }
  }
  // A Learn or Rule step needs items to teach; any step with none gets the items no step covers yet (or all).
  const covered = new Set(nodes.filter((n) => n.kind !== 'talk').flatMap((n) => n.itemIdx))
  const rest = items.map((_, i) => i).filter((i) => !covered.has(i))
  for (const n of nodes) if (!n.itemIdx.length && rest.length) n.itemIdx = rest.splice(0, PER_LESSON.max)
  // A level left with nothing new to teach (every item it named is taught earlier) is dropped; a Talk step with no
  // items practices them all.
  for (let k = nodes.length - 1; k >= 0; k--) {
    if (nodes[k].itemIdx.length) continue
    if (nodes[k].kind === 'talk') nodes[k].itemIdx = items.map((_, i) => i)
    else nodes.splice(k, 1)
  }
  // Items no level teaches would first appear in the boss: they get lessons of their own (or join the last one).
  while (rest.length) {
    const chunk = rest.splice(0, PER_LESSON.max)
    const teaching = nodes.filter((x) => x.kind !== 'talk')
    if (teaching.length < NODES.max) nodes.splice(nodes.lastIndexOf(teaching[teaching.length - 1]) + 1, 0, { kind: 'learn', title: '', itemIdx: chunk })
    else teaching[teaching.length - 1].itemIdx.push(...chunk)
  }
  const out = nodes.map((n, i) => ({
    id: slug(`${areaId}-n${i + 1}`, used), kind: n.kind, title: n.title, itemIds: n.itemIdx.map((k) => items[k].id),
    status: 'locked', stars: 0, bestScore: 0, attempts: 0, optional: n.kind === 'talk',
  }))
  out.push(weakNode(areaId, items))
  out.push({ id: slug(`${areaId}-boss`, used), kind: 'boss', title: '', itemIds: items.map((x) => x.id), status: 'locked', stars: 0, bestScore: 0, attempts: 0, optional: false })
  return { items, nodes: out, bossName: cleanBossName(raw.boss, clean) }
}

// ── Creating and keeping the map consistent ─────────────────────────────────────────────────────────────────

const newArea = (a, used) => ({
  id: slug(a.title, used), title: a.title, theme: a.theme || '', motif: a.motif || MOTIFS[0], palette: a.palette || PALETTES[0],
  status: 'locked', detailed: false, frozen: false, items: [], nodes: [],
})

export function createMap({ modeId, subject, start, plan }, now = Date.now()) {
  const used = new Set()
  const map = {
    version: MAP_VERSION, modeId, subject: { name: String(subject?.name || ''), description: String(subject?.description || '') },
    createdAt: now, updatedAt: now, start: start || null, areas: (plan || []).map((a) => newArea(a, used)),
  }
  return normalizeMap(map)
}

// Recompute every status from what is DONE: areas unlock in order (all before an area done → it opens), nodes
// in the open area unlock one by one (optional Talk steps never block), and the boss opens last.
export function normalizeMap(map) {
  if (!map || !Array.isArray(map.areas)) return map
  let openFound = false
  const areas = map.areas.map((a) => {
    let status
    if (a.status === 'done') status = 'done'
    else if (!openFound) { status = 'open'; openFound = true }
    else status = 'locked'
    return { ...a, status, nodes: normalizeNodes(a.nodes || [], status) }
  })
  return { ...map, areas }
}

function normalizeNodes(nodes, areaStatus) {
  if (areaStatus === 'locked') return nodes.map((n) => ({ ...n, status: n.status === 'done' ? 'done' : 'locked' }))
  let blocked = false
  return nodes.map((n) => {
    if (n.status === 'done') return n
    if (n.kind === 'weak') return { ...n, status: blocked && areaStatus !== 'done' ? 'locked' : 'open' } // opens with the boss
    if (n.optional) return { ...n, status: 'open' }             // Talk steps: extra, never in the way
    if (areaStatus === 'done') return { ...n, status: 'open' }  // a finished area can be replayed
    if (n.kind === 'boss') return { ...n, status: blocked ? 'locked' : 'open' }
    const status = blocked ? 'locked' : 'open'
    blocked = true
    return { ...n, status }
  })
}

// Migrations for a stored map (future format changes land here); null when it is not a map at all.
export function shapeMap(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.areas)) return null
  if ((raw.version || 1) > MAP_VERSION) return null // written by a newer build: leave it alone
  return normalizeMap(ensureWeakNodes({ ...raw, version: MAP_VERSION }))
}

export const areaIndex = (map, areaId) => (map?.areas || []).findIndex((a) => a.id === areaId)
export const currentArea = (map) => (map?.areas || []).find((a) => a.status === 'open') || null
export const findNode = (map, areaId, nodeId) => map?.areas?.[areaIndex(map, areaId)]?.nodes?.find((n) => n.id === nodeId) || null

// Areas that should be fully detailed now: the open one and the next LOOKAHEAD - 1, when not detailed yet.
export function needsDetail(map, lookahead = LOOKAHEAD) {
  const i = (map?.areas || []).findIndex((a) => a.status === 'open')
  if (i < 0) return []
  return map.areas.slice(i, i + lookahead).filter((a) => !a.detailed).map((a) => a.id)
}

// Fill an area's items and nodes. Refused (map unchanged) for a started or already detailed area.
export function applyAreaDetail(map, areaId, detail, now = Date.now()) {
  const i = areaIndex(map, areaId)
  const a = map?.areas?.[i]
  if (!a || a.frozen || a.detailed || !detail?.items?.length) return map
  const areas = map.areas.map((x, k) => (k === i ? { ...x, items: detail.items, nodes: detail.nodes, detailed: true, bossName: detail.bossName || x.bossName || '' } : x))
  return normalizeMap({ ...map, areas, updatedAt: now })
}

// Name an area's boss (areas detailed before bosses had names). Only fills a missing name: cosmetic, so a
// started (frozen) area takes it too.
export function setBossName(map, areaId, name) {
  const i = areaIndex(map, areaId)
  if (i < 0 || !name || map.areas[i].bossName) return map
  return { ...map, areas: map.areas.map((x, k) => (k === i ? { ...x, bossName: name } : x)) }
}

export const passRatio = (kind) => (kind === 'boss' ? PASS.boss : kind === 'legendary' ? PASS.legendary : PASS.node)

// A Legendary run over a cleared area (not a node): a pass marks the area legendary. Same outcome shape as
// applyNodeResult. Only a done area can be legendary.
export function applyLegendaryResult(map, areaId, result, now = Date.now()) {
  const i = areaIndex(map, areaId)
  const area = map?.areas?.[i]
  const none = { map, passed: false, stars: 0, areaDone: false, nextAreaId: null, firstLegend: false }
  if (!area || area.status !== 'done') return none
  const total = Math.max(0, Number(result?.total) || 0)
  const ratio = total ? Math.max(0, Math.min(1, (Number(result?.correct) || 0) / total)) : 0
  const stars = total ? starsFor(ratio, 'legendary') : 0
  if (!stars) return none
  const next = { ...map, updatedAt: now, areas: map.areas.map((x, k) => (k === i ? { ...x, legendary: true } : x)) }
  return { map: next, passed: true, stars, areaDone: false, nextAreaId: null, firstLegend: !area.legendary }
}
export function starsFor(ratio, kind) {
  const r = Number(ratio) || 0
  if (r < passRatio(kind)) return 0
  return r >= STAR_AT[1] ? 3 : r >= STAR_AT[0] ? 2 : 1
}

// Record a finished node: { total, correct, items: [{ itemId, correct }] }. Starting an area freezes it (an
// edit from Ebi can no longer change it). Returns { map, passed, stars, areaDone, nextAreaId }.
export function applyNodeResult(map, areaId, nodeId, result, now = Date.now()) {
  const i = areaIndex(map, areaId)
  const area = map?.areas?.[i]
  const node = area?.nodes?.find((n) => n.id === nodeId)
  if (!node || node.status === 'locked') return { map, passed: false, stars: 0, areaDone: false, nextAreaId: null }
  const total = Math.max(0, Number(result?.total) || 0)
  // A boss won with the Weak spots life: the forgiven miss counts as right (at most the lives the area earned).
  const forgiven = node.kind === 'boss' ? Math.min(Number(result?.forgiven) || 0, area.bonusLife ? WEAK_BONUS_LIVES : 0) : 0
  const ratio = total ? Math.max(0, Math.min(1, ((Number(result?.correct) || 0) + forgiven) / total)) : 0
  const stars = total ? starsFor(ratio, node.kind) : 0
  const passed = stars > 0
  const hits = new Map()
  for (const r of result?.items || []) {
    if (!r?.itemId) continue
    const h = hits.get(r.itemId) || { seen: 0, right: 0 }
    h.seen++; if (r.correct) h.right++
    hits.set(r.itemId, h)
  }
  const nodes = area.nodes.map((n) => (n.id !== nodeId ? n : {
    ...n, attempts: (n.attempts || 0) + 1, bestScore: Math.max(n.bestScore || 0, ratio), stars: Math.max(n.stars || 0, stars),
    status: passed || n.status === 'done' ? 'done' : n.status,
  }))
  const items = area.items.map((it) => (hits.has(it.id) ? { ...it, seen: (it.seen || 0) + hits.get(it.id).seen, right: (it.right || 0) + hits.get(it.id).right } : it))
  const areaDone = area.status !== 'done' && node.kind === 'boss' && passed
  const bonusLife = area.bonusLife || (node.kind === 'weak' && passed)
  const areas = map.areas.map((x, k) => (k === i ? { ...x, nodes, items, frozen: true, bonusLife, status: areaDone ? 'done' : x.status } : x))
  const next = normalizeMap({ ...map, areas, updatedAt: now })
  return { map: next, passed, stars, areaDone, nextAreaId: areaDone ? next.areas[i + 1]?.id || null : null }
}

// Split a step's items by how well they are known: new or weak ones are asked as multiple choice.
export function adaptiveSplit(area, itemIds) {
  const byId = new Map((area?.items || []).map((it) => [it.id, it]))
  const choice = []; const typed = []
  for (const id of itemIds || []) {
    const it = byId.get(id)
    if (!it) continue
    const weak = (it.seen || 0) < NEW_SEEN || (it.right || 0) / Math.max(1, it.seen || 0) < WEAK_RATIO
    ;(weak ? choice : typed).push(it)
  }
  return { choice, typed }
}

export function mapProgress(map) {
  const areas = map?.areas || []
  const nodes = areas.flatMap((a) => (a.nodes || []).filter((n) => !n.optional))
  return {
    areasDone: areas.filter((a) => a.status === 'done').length, areasTotal: areas.length,
    nodesDone: nodes.filter((n) => n.status === 'done').length, nodesTotal: nodes.length,
    stars: nodes.reduce((s, n) => s + (n.stars || 0), 0), finished: areas.length > 0 && areas.every((a) => a.status === 'done'),
  }
}

// The map needs more areas planned: the learner is on its last area (or finished it).
export const needsMoreAreas = (map) => !!map?.areas?.length && map.areas.length < AREAS.max * 2 && map.areas.findIndex((a) => a.status === 'open') >= map.areas.length - 1

// Append newly planned areas (titles only) after the existing ones.
export function appendAreas(map, plan, now = Date.now()) {
  const used = new Set(map.areas.map((a) => a.id))
  const titles = new Set(map.areas.map((a) => a.title.toLowerCase()))
  const add = (plan || []).filter((a) => !titles.has(String(a.title).toLowerCase())).map((a) => newArea(a, used))
  return add.length ? normalizeMap({ ...map, areas: [...map.areas, ...add], updatedAt: now }) : map
}

// ── Edits proposed by Ebi ───────────────────────────────────────────────────────────────────────────────────

// { areas: [{ id?, title, theme, motif, palette }], note } or null. The list is the WHOLE map as the model wants it.
export function parseMapEdit(raw, clean) {
  const list = Array.isArray(raw?.areas) ? raw.areas : null
  if (!list) return null
  const areas = list.map((a) => ({
    id: typeof a?.id === 'string' ? a.id.trim() : '', title: str(a?.title, TITLE_MAX, clean), theme: str(a?.theme, THEME_MAX, clean),
    motif: pick(a?.motif, MOTIFS, ''), palette: pick(a?.palette, PALETTES, ''),
  })).filter((a) => a.title || a.id)
  return areas.length ? { areas, note: str(raw?.note, 400, clean) } : null
}

// Merge a proposal into the map WITHOUT touching progress: started (frozen) and finished areas stay exactly as
// they are, first and in their order; everything after them is the proposal's list. An area whose topic changed
// loses its generated detail and art (they are made again for the new topic). Returns { map, changes } where
// changes = [{ kind: 'kept'|'changed'|'added'|'removed', id, title, before? }].
export function mergeEdit(map, proposal, now = Date.now()) {
  const fixed = map.areas.filter((a) => a.frozen || a.status === 'done')
  const fixedIds = new Set(fixed.map((a) => a.id))
  const open = new Map(map.areas.filter((a) => !fixedIds.has(a.id)).map((a) => [a.id, a]))
  const used = new Set(map.areas.map((a) => a.id))
  const changes = fixed.map((a) => ({ kind: 'kept', id: a.id, title: a.title }))
  const out = []
  const taken = new Set()
  for (const p of proposal?.areas || []) {
    if (fixedIds.has(p.id)) continue // the model re-listed a started area: it stays as it is, where it is
    const old = open.get(p.id)
    if (old && !taken.has(old.id)) {
      taken.add(old.id)
      const next = { ...old, title: p.title || old.title, theme: p.theme || old.theme, motif: p.motif || old.motif, palette: p.palette || old.palette }
      const topicMoved = next.title !== old.title || next.theme !== old.theme
      const looksMoved = next.motif !== old.motif || next.palette !== old.palette
      if (topicMoved) Object.assign(next, { detailed: false, items: [], nodes: [], bossName: '', bonusLife: false, legendary: false })
      out.push(next)
      changes.push(topicMoved || looksMoved ? { kind: 'changed', id: old.id, title: next.title, before: old.title } : { kind: 'kept', id: old.id, title: old.title })
    } else if (p.title) {
      const a = newArea({ title: p.title, theme: p.theme, motif: p.motif || MOTIFS[(fixed.length + out.length) % MOTIFS.length], palette: p.palette || PALETTES[(fixed.length + out.length) % PALETTES.length] }, used)
      out.push(a)
      changes.push({ kind: 'added', id: a.id, title: a.title })
    }
    if (fixed.length + out.length >= AREAS.max * 2) break
  }
  for (const a of open.values()) if (!taken.has(a.id)) changes.push({ kind: 'removed', id: a.id, title: a.title })
  // Never an empty map ahead of the learner: a proposal that drops everything keeps the old list.
  if (!out.length && open.size) return { map, changes: [] }
  const next = normalizeMap({ ...map, areas: [...fixed, ...out], updatedAt: now })
  return { map: next, changes }
}

export const editChanged = (changes) => (changes || []).some((c) => c.kind !== 'kept')
