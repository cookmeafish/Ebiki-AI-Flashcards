// LEGENDS MAP (pure, tested): the per-mode map of areas, each a ladder of nodes with a boss on top.
// Everything here is data in, data out: unlock rules, stars, freezing, lazy area detail, merging an edit from
// Ebi. Prompts live in ./prompt.js, storage in ./store.js, screens in the .jsx files.
//
// LegendsMap { version, modeId, subject: { name, description }, createdAt, updatedAt,
//              start: { reason, selfRating, goal, placement: { level, answered, at } | null }, areas: Area[] }
// Area  { id, title, theme, motif, palette, status: 'locked'|'open'|'done',
//         detailed, frozen, items: Item[], nodes: Node[] }            (first area = bottom of the map)
// Node  { id, kind, title, itemIds, status, stars (0..3), bestScore (0..1), attempts, optional, goal?, flawless?, allPower? }
// Item  { id, kind: 'term'|'rule'|'skill', front, back, cardNoteId, seen, right, bossRight?, missNudged? }
// Area extras: story (lines shown when it opens), canDo (the passport stamp), bonus (the chest's phrase),
//              storySeen, chestOpened, nemesis ({ itemIds, at } after a lost boss fight), bonusLife, legendary
// Map extras:  helpers ({ scroll, shield }), days ({ 'YYYY-MM-DD': steps finished }) for the journey heatmap
export const MAP_VERSION = 1
export const AREAS = { min: 3, max: 12, plan: 8 }       // areas planned at once (titles only, detail comes later)
export const ITEMS = { min: 4, max: 24 }
export const NODES = { min: 3, max: 8 }                 // not counting the boss
// A new area is LESSONS levels, each teaching PER_LESSON new items and then quizzing them (a Learn step and a
// Practice step over the same items read as the same level twice). Older maps keep their practice steps.
export const LESSONS = 8
export const PER_LESSON = { min: 2, max: 3 }
export const LOOKAHEAD = 2                              // areas kept fully detailed ahead of the learner
export const NODE_KINDS = ['learn', 'practice', 'scene', 'rule', 'talk', 'adventure', 'boss']
// Optional steps: never block the ladder (a Talk conversation, an Adventure with a goal).
export const OPTIONAL_KINDS = new Set(['talk', 'adventure'])
export const STORY = { lines: 3, max: 220 }
export const CAN_DO = { lines: 4, max: 140 }
export const GOAL_MAX = 200
export const ITEM_KINDS = ['term', 'rule', 'skill']
export const MOTIFS = ['forest', 'city', 'ocean', 'mountains', 'lab', 'stage', 'sky', 'desert', 'volcano', 'ice',
  'swamp', 'castle', 'graveyard', 'jungle', 'space', 'clockwork', 'carnival', 'underworld', 'moonlit', 'fungal',
  'pirate', 'dojo', 'crystal', 'arcade', 'library', 'sewer', 'arena', 'hive', 'garden', 'sweets',
  'savanna', 'mirror', 'manor', 'junkyard', 'dream', 'sakura', 'mine', 'frontier', 'primeval', 'celestial']
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
// Every motif is a hand-made banner + boss in public/assets/legends/. A map takes each one at most once while unused
// ones remain (the model sometimes names one motif for several areas: the same boss twice on one map). The model's
// pick wins when it is free; otherwise the first motif no area uses. `used` is updated.
export function freshMotif(want, used) {
  const w = pick(want, MOTIFS, '')
  const m = w && !used.has(w) ? w : MOTIFS.find((x) => !used.has(x)) || w || MOTIFS[used.size % MOTIFS.length]
  used.add(m)
  return m
}

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
  const motifs = new Set()
  for (const a of list) {
    const title = str(a?.title, TITLE_MAX, clean)
    if (!title || seen.has(title.toLowerCase())) continue
    seen.add(title.toLowerCase())
    out.push({ title, theme: str(a?.theme, THEME_MAX, clean), motif: freshMotif(a?.motif, motifs), palette: pick(a?.palette, PALETTES, PALETTES[out.length % PALETTES.length]) })
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
  const opt = (x) => OPTIONAL_KINDS.has(x.kind)
  const rawNodes = (Array.isArray(raw.nodes) ? raw.nodes : []).filter((n) => String(n?.kind || '').toLowerCase() !== 'boss')
  for (const n of rawNodes) {
    const kind = pick(n?.kind, NODE_KINDS, 'learn')
    if (kind === 'boss' || kind === 'practice') continue // every level teaches something new (no re-drill steps)
    // One optional step of each kind is enough (a model listing three Adventures would crowd the ladder).
    if (OPTIONAL_KINDS.has(kind) && nodes.some((o) => o.kind === kind)) continue
    const goal = kind === 'adventure' ? str(n?.goal, GOAL_MAX, clean) : ''
    if (kind === 'adventure' && !goal) continue // an Adventure is its goal
    // An item is taught by ONE level: a later level naming it again drops it (and gets the untaught ones below).
    const all = (Array.isArray(n?.items) ? n.items : []).map((x) => Number(x) - 1).filter((i) => Number.isInteger(i) && i >= 0 && i < items.length)
    const idx = OPTIONAL_KINDS.has(kind) ? all : all.filter((i) => !nodes.some((o) => !opt(o) && o.itemIdx.includes(i)))
    nodes.push({ kind, title: str(n?.title, TITLE_MAX, clean), itemIdx: [...new Set(idx)], ...(goal ? { goal } : {}) })
    if (nodes.filter((x) => !opt(x)).length >= NODES.max) break
  }
  // Too few steps (or none): a plain ladder of lessons over slices of the items.
  if (nodes.filter((x) => !opt(x)).length < NODES.min) {
    nodes.length = 0
    const per = 3
    for (let i = 0; i < items.length; i += per) {
      const idx = Array.from({ length: Math.min(per, items.length - i) }, (_, k) => i + k)
      nodes.push({ kind: 'learn', title: '', itemIdx: idx })
    }
  }
  // A Learn or Rule step needs items to teach; any step with none gets the items no step covers yet (or all).
  const covered = new Set(nodes.filter((n) => !opt(n)).flatMap((n) => n.itemIdx))
  const rest = items.map((_, i) => i).filter((i) => !covered.has(i))
  for (const n of nodes) if (!opt(n) && !n.itemIdx.length && rest.length) n.itemIdx = rest.splice(0, PER_LESSON.max)
  // A level left with nothing new to teach (every item it named is taught earlier) is dropped; an optional step with
  // no items practices them all.
  for (let k = nodes.length - 1; k >= 0; k--) {
    if (nodes[k].itemIdx.length) continue
    if (opt(nodes[k])) nodes[k].itemIdx = items.map((_, i) => i)
    else nodes.splice(k, 1)
  }
  // Items no level teaches would first appear in the boss: they get lessons of their own (or join the last one).
  while (rest.length) {
    const chunk = rest.splice(0, PER_LESSON.max)
    const teaching = nodes.filter((x) => !opt(x))
    if (teaching.length < NODES.max) nodes.splice(nodes.lastIndexOf(teaching[teaching.length - 1]) + 1, 0, { kind: 'learn', title: '', itemIdx: chunk })
    else teaching[teaching.length - 1].itemIdx.push(...chunk)
  }
  const out = nodes.map((n, i) => ({
    id: slug(`${areaId}-n${i + 1}`, used), kind: n.kind, title: n.title, itemIds: n.itemIdx.map((k) => items[k].id),
    status: 'locked', stars: 0, bestScore: 0, attempts: 0, optional: OPTIONAL_KINDS.has(n.kind), ...(n.goal ? { goal: n.goal } : {}),
  }))
  out.push(weakNode(areaId, items))
  out.push({ id: slug(`${areaId}-boss`, used), kind: 'boss', title: '', itemIds: items.map((x) => x.id), status: 'locked', stars: 0, bestScore: 0, attempts: 0, optional: false })
  return { items, nodes: out, bossName: cleanBossName(raw.boss, clean), ...parseAreaExtras(raw, clean) }
}

// The area's extras: a short story shown when it opens, the passport's "you can now" lines, and the chest's bonus
// phrase. Each is optional (older replies and failed parts leave it out).
export function parseAreaExtras(raw, clean) {
  const lines = (v, n, max) => (Array.isArray(v) ? v : typeof v === 'string' ? v.split(/\n+/) : [])
    .map((x) => str(typeof x === 'object' ? x?.text : x, max, clean)).filter(Boolean).slice(0, n)
  const out = {}
  const story = lines(raw?.story, STORY.lines, STORY.max)
  if (story.length) out.story = story
  const canDo = lines(raw?.canDo ?? raw?.can_do, CAN_DO.lines, CAN_DO.max)
  if (canDo.length) out.canDo = canDo
  const bf = str(raw?.bonus?.front, FRONT_MAX, clean)
  const bb = clean(String(raw?.bonus?.back ?? '').replace(/\\n/g, '\n').replace(/[ \t]+/g, ' ').trim()).slice(0, BACK_MAX)
  if (bf && bb) out.bonus = { front: bf, back: bb }
  return out
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
  const extras = Object.fromEntries(['story', 'canDo', 'bonus'].filter((k) => detail[k]).map((k) => [k, detail[k]]))
  const areas = map.areas.map((x, k) => (k === i ? { ...x, items: detail.items, nodes: detail.nodes, detailed: true, bossName: detail.bossName || x.bossName || '', ...extras } : x))
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
// applyNodeResult. Only a done area can be legendary. The answers count for the codex like a boss's.
export function applyLegendaryResult(map, areaId, result, now = Date.now()) {
  const i = areaIndex(map, areaId)
  const area = map?.areas?.[i]
  const none = { map, passed: false, stars: 0, areaDone: false, nextAreaId: null, firstLegend: false }
  if (!area || area.status !== 'done') return none
  const total = Math.max(0, Number(result?.total) || 0)
  const ratio = total ? Math.max(0, Math.min(1, (Number(result?.correct) || 0) / total)) : 0
  const stars = fightStars(ratio, 'legendary', result?.outcome)
  const items = tallyItems(area.items, result?.items, true)
  if (!stars) return { ...none, map: { ...map, updatedAt: now, areas: map.areas.map((x, k) => (k === i ? { ...x, items } : x)) } }
  const next = { ...map, updatedAt: now, areas: map.areas.map((x, k) => (k === i ? { ...x, items, legendary: true } : x)) }
  return { map: next, passed: true, stars, areaDone: false, nextAreaId: null, firstLegend: !area.legendary }
}
export function starsFor(ratio, kind) {
  const r = Number(ratio) || 0
  if (r < passRatio(kind)) return 0
  return r >= STAR_AT[1] ? 3 : r >= STAR_AT[0] ? 2 : 1
}
// A fight's stars: its OUTCOME decides the pass (a won fight always clears with at least one star, a lost one never
// does, whatever the ratio); without an outcome (older callers, cheats) the ratio alone decides.
export function fightStars(ratio, kind, outcome) {
  if (outcome === 'lost') return 0
  const s = starsFor(ratio, kind)
  return outcome === 'won' ? Math.max(1, s) : s
}
// Add a result's answers to the items' tallies (`fight`: right answers in a boss or Legendary also count for gold).
function tallyItems(items, results, fight) {
  const hits = new Map()
  for (const r of results || []) {
    if (!r?.itemId) continue
    const h = hits.get(r.itemId) || { seen: 0, right: 0 }
    h.seen++; if (r.correct) h.right++
    hits.set(r.itemId, h)
  }
  return (items || []).map((it) => {
    const h = hits.get(it.id)
    if (!h) return it
    return { ...it, seen: (it.seen || 0) + h.seen, right: (it.right || 0) + h.right, ...(fight ? { bossRight: (it.bossRight || 0) + h.right } : {}) }
  })
}

// ── The codex: every item of an area, with a tier from how the learner does with it in Legends ─────────────────
// 'new' (never asked) → 'bronze' (answered right once) → 'silver' (steady: 3+ right, 70%+) → 'gold' (silver, 80%+,
// and right in a boss fight or Legendary run). The tier is computed, so an item the learner starts missing fades.
export const TIER = { silverRight: 3, silverRatio: 0.7, goldRatio: 0.8 }
export const CODEX_TIERS = ['new', 'bronze', 'silver', 'gold']
export function itemTier(it) {
  const seen = it?.seen || 0
  const right = it?.right || 0
  if (!seen || !right) return 'new'
  const ratio = right / seen
  if (right >= TIER.silverRight && ratio >= TIER.goldRatio && (it.bossRight || 0) > 0) return 'gold'
  if (right >= TIER.silverRight && ratio >= TIER.silverRatio) return 'silver'
  return 'bronze'
}
// { new, bronze, silver, gold, total, complete } for one area (complete = every item gold).
export function areaCodex(area) {
  const out = { new: 0, bronze: 0, silver: 0, gold: 0, total: 0, complete: false }
  for (const it of area?.items || []) { out[itemTier(it)]++; out.total++ }
  out.complete = out.total > 0 && out.gold === out.total
  return out
}

// ── Helpers: a hint scroll (shows an answer's first letter) or a shield (absorbs one lost life) ─────────────────
// Earned only by practice (a flawless level: a scroll; a flawless Weak spots: a shield), held at most HELPERS_MAX
// together, never bought.
export const HELPERS_MAX = 2
export const helperCount = (map) => (map?.helpers?.scroll || 0) + (map?.helpers?.shield || 0)
export function earnHelper(map, kind) {
  if (!map || !['scroll', 'shield'].includes(kind) || helperCount(map) >= HELPERS_MAX) return map
  return { ...map, helpers: { scroll: 0, shield: 0, ...(map.helpers || {}), [kind]: (map.helpers?.[kind] || 0) + 1 } }
}
export function spendHelper(map, kind) {
  if (!map || !(map.helpers?.[kind] > 0)) return map
  return { ...map, helpers: { ...map.helpers, [kind]: map.helpers[kind] - 1 } }
}

// ── The journey: steps finished per local day, for the heatmap (the last JOURNEY_DAYS kept) ─────────────────────
export const JOURNEY_DAYS = 120
export function logDay(map, key) {
  if (!map || !key) return map
  const days = { ...(map.days || {}), [key]: (map.days?.[key] || 0) + 1 }
  const keys = Object.keys(days).sort()
  for (const k of keys.slice(0, Math.max(0, keys.length - JOURNEY_DAYS))) delete days[k]
  return { ...map, days }
}

// One area's own flags (storySeen, chestOpened, an item's missNudged): a plain merge, no status change.
export function patchArea(map, areaId, patch) {
  const i = areaIndex(map, areaId)
  if (i < 0) return map
  return { ...map, areas: map.areas.map((x, k) => (k === i ? { ...x, ...(typeof patch === 'function' ? patch(x) : patch) } : x)) }
}
export function patchItem(map, areaId, itemId, patch) {
  return patchArea(map, areaId, (a) => ({ items: (a.items || []).map((it) => (it.id === itemId ? { ...it, ...patch } : it)) }))
}

// Record a finished node: { total, correct, items: [{ itemId, correct }], outcome?: 'won'|'lost', power?: bool }.
// Starting an area freezes it (an edit from Ebi can no longer change it). A fight's outcome decides its pass
// (fightStars). A flawless level (no miss) earns a hint scroll the first time, a flawless Weak spots a shield; a lost
// boss fight remembers the items it missed (the nemesis rematch), a won one forgets them.
// Returns { map, passed, stars, areaDone, nextAreaId, flawless, helper }.
export function applyNodeResult(map, areaId, nodeId, result, now = Date.now()) {
  const i = areaIndex(map, areaId)
  const area = map?.areas?.[i]
  const node = area?.nodes?.find((n) => n.id === nodeId)
  if (!node || node.status === 'locked') return { map, passed: false, stars: 0, areaDone: false, nextAreaId: null, flawless: false, helper: '' }
  const total = Math.max(0, Number(result?.total) || 0)
  const correct = Number(result?.correct) || 0
  // A boss won with the Weak spots life: the forgiven miss counts as right (at most the lives the area earned).
  const forgiven = node.kind === 'boss' ? Math.min(Number(result?.forgiven) || 0, area.bonusLife ? WEAK_BONUS_LIVES : 0) : 0
  const ratio = total ? Math.max(0, Math.min(1, (correct + forgiven) / total)) : 0
  const fight = node.kind === 'boss'
  const stars = total ? (fight ? fightStars(ratio, node.kind, result?.outcome) : starsFor(ratio, node.kind)) : 0
  const passed = stars > 0
  const flawless = passed && total > 0 && correct >= total && !OPTIONAL_KINDS.has(node.kind)
  const firstFlawless = flawless && !node.flawless
  const nodes = area.nodes.map((n) => (n.id !== nodeId ? n : {
    ...n, attempts: (n.attempts || 0) + 1, bestScore: Math.max(n.bestScore || 0, ratio), stars: Math.max(n.stars || 0, stars),
    status: passed || n.status === 'done' ? 'done' : n.status,
    ...(flawless ? { flawless: true } : {}), ...(fight && passed && result?.power ? { allPower: true } : {}),
  }))
  const items = tallyItems(area.items, result?.items, fight)
  const areaDone = area.status !== 'done' && node.kind === 'boss' && passed
  const bonusLife = area.bonusLife || (node.kind === 'weak' && passed)
  // The nemesis: a lost fight's missed items (asked again in the rematch), cleared by a win.
  const missed = [...new Set((result?.items || []).filter((r) => r?.itemId && !r.correct).map((r) => r.itemId))]
  const nemesis = !fight ? area.nemesis : result?.outcome === 'lost' && missed.length ? { itemIds: missed, at: now } : passed ? null : area.nemesis
  const areas = map.areas.map((x, k) => (k === i ? { ...x, nodes, items, frozen: true, bonusLife, status: areaDone ? 'done' : x.status, ...(nemesis ? { nemesis } : { nemesis: null }) } : x))
  let next = normalizeMap({ ...map, areas, updatedAt: now })
  let helper = ''
  if (firstFlawless) {
    const kind = node.kind === 'weak' ? 'shield' : 'scroll'
    const earned = earnHelper(next, kind)
    if (earned !== next) { next = earned; helper = kind }
  }
  return { map: next, passed, stars, areaDone, nextAreaId: areaDone ? next.areas[i + 1]?.id || null : null, flawless, helper }
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
  // Motifs held by areas that stay; an open area keeps its own unless the proposal moves it onto a free one.
  const motifs = new Set(fixed.map((a) => a.motif))
  for (const p of proposal?.areas || []) {
    if (fixedIds.has(p.id)) continue // the model re-listed a started area: it stays as it is, where it is
    const old = open.get(p.id)
    if (old && !taken.has(old.id)) {
      taken.add(old.id)
      const next = { ...old, title: p.title || old.title, theme: p.theme || old.theme, motif: freshMotif(p.motif || old.motif, motifs), palette: p.palette || old.palette }
      const topicMoved = next.title !== old.title || next.theme !== old.theme
      const looksMoved = next.motif !== old.motif || next.palette !== old.palette
      if (topicMoved) Object.assign(next, { detailed: false, items: [], nodes: [], bossName: '', bonusLife: false, legendary: false })
      out.push(next)
      changes.push(topicMoved || looksMoved ? { kind: 'changed', id: old.id, title: next.title, before: old.title } : { kind: 'kept', id: old.id, title: old.title })
    } else if (p.title) {
      const a = newArea({ title: p.title, theme: p.theme, motif: freshMotif(p.motif, motifs), palette: p.palette || PALETTES[(fixed.length + out.length) % PALETTES.length] }, used)
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
