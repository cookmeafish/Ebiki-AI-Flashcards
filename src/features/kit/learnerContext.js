// LEARNER CONTEXT: everything Ebiki knows about the learner in ONE mode, as one structured snapshot (pure, tested).
// THE way to get learner context anywhere in the app: App gathers the raw facts (`ctx.learning.context(opts)`:
// the mode deck's scheduling and its NEW cards, study sessions, logged slips, chats tagged with the mode, the
// Discover profile, the level, the practice log, and whatever features register below), this file shapes them
// into bounded parts and formats them for prompts (`formatLearnerContext(snapshot, { budget, sections })`).
//
// Every part carries `ok`: a part that could not be read says so, and never reads as "knows nothing" (a closed Anki
// is not an empty deck, and a failed chat list is not "never chatted"). Platform-neutral: no window, no fetch.

export const LC = {
  ttlMs: 60000,           // a cached snapshot is reused this long (any app event clears it sooner)
  sampleStudied: 300,     // studied cards read from the deck (spread over the whole deck)
  sampleNew: 60,          // new cards read from the deck (the scope: what the learner chose to study)
  infoBatch: 100,         // card ids per info call (a whole-deck call was megabytes on a big deck)
  matureDays: 21,         // Anki's own "mature" line
  struggleLapses: 3,
  chats: 8,               // most recent chats of the mode read in full
  chatLearnerLines: 6,    // the learner's own messages kept per chat
  chatEbiLines: 3,        // Ebi's replies kept per chat (short excerpts: corrections, explanations)
  lineMax: 220,
  frontMax: 80,
  backMax: 90,
  sessionsShown: 8,
  slips: 12,
  practiceShown: 15,
  weakShown: 12,          // forgotten cards listed by the compact `weak` section
  topicsShown: 8,         // chat titles listed by the compact `topics` section
  staleMs: 180000,        // a remembered snapshot older than this is refreshed in the background (ctx.learning.cached)
  extraMax: 1500,         // one feature section (Legends map, raids...)
  // What a prompt gets per section (characters), in this order unless the caller names other sections.
  budget: 6000,
}

export const SECTIONS = ['level', 'deck', 'studied', 'new', 'study', 'slips', 'chats', 'discover', 'practice', 'extra']

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)
export const clip = (s, n) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim()
  return t.length > n ? `${t.slice(0, n - 1)}…` : t
}
const arr = (v) => (Array.isArray(v) ? v : [])
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null)

// Evenly spread pick (never only the oldest or newest cards of a big deck).
export function spread(list, n) {
  const l = arr(list)
  if (l.length <= n) return l
  const step = l.length / n
  return Array.from({ length: n }, (_, i) => l[Math.floor(i * step)])
}

// Card ids in batches for the info call.
export function batches(ids, size = LC.infoBatch) {
  const out = []
  for (let i = 0; i < arr(ids).length; i += size) out.push(ids.slice(i, i + size))
  return out
}

// ── Feature sources ───────────────────────────────────────────────────────────────────────────────────────────
// A feature adds what it knows (Legends: map progress and raids) with ONE call at module load:
//   registerLearnerContextSource('legends', async (ctx, modeId) => ({ title: 'Legends map', text: '...' }))
// A source that throws or returns nothing is reported as { ok: false } and never blocks the rest.
const sources = new Map()
export function registerLearnerContextSource(id, fn) {
  if (id && typeof fn === 'function') sources.set(String(id), fn)
}
export const learnerContextSources = () => [...sources.entries()]

export async function readFeatureSources(ctx, modeId) {
  const out = []
  for (const [id, fn] of sources) {
    try {
      const r = await fn(ctx, modeId)
      if (r && String(r.text || '').trim()) out.push({ id, ok: true, title: clip(r.title || id, 60), text: String(r.text).slice(0, LC.extraMax) })
      else if (r && r.ok === false) out.push({ id, ok: false, title: clip(r.title || id, 60), text: '' })
    } catch { out.push({ id, ok: false, title: id, text: '' }) }
  }
  return out
}

// ── Shaping ───────────────────────────────────────────────────────────────────────────────────────────────────
const isStudied = (c) => num(c.interval) > 0 || num(c.reps) > 0 || (c.type != null && num(c.type) > 0)

function shapeCard(c, withStats) {
  const front = clip(c.front, LC.frontMax)
  if (!front) return null
  const back = clip(c.back, LC.backMax)
  if (!withStats) return { front, back }
  return { front, back, interval: num(c.interval), lapses: num(c.lapses), reps: num(c.reps), ease: c.factor ? Math.round(num(c.factor) / 10) : null }
}

// deck: { ok, name, error, total, newTotal, studied: [card], fresh: [card] }   card: { front, back, interval, lapses,
// reps, factor, type }. Counts are EXACT for total/new/studied; mature/young/struggling are scaled from the sample.
export function shapeDeck(raw) {
  const d = obj(raw) || {}
  const name = String(d.name || '')
  if (d.ok === false) return { ok: false, name, error: clip(d.error || 'read', 200), unreachable: !!d.unreachable, total: 0, studied: 0, new: 0, mature: 0, young: 0, struggling: 0, sampleStudied: [], sampleNew: [] }
  const studiedRaw = arr(d.studied).filter((c) => obj(c) && String(c.front || '').trim())
  const freshRaw = arr(d.fresh).filter((c) => obj(c) && String(c.front || '').trim())
  // A card listed as studied that Anki says was never answered is new after all (and the other way round).
  const studiedCards = [...studiedRaw.filter(isStudied), ...freshRaw.filter(isStudied)]
  const newCards = [...freshRaw.filter((c) => !isStudied(c)), ...studiedRaw.filter((c) => !isStudied(c))]
  const total = Math.max(num(d.total), studiedCards.length + newCards.length)
  const newTotal = Math.min(total, Math.max(num(d.newTotal), newCards.length))
  const studied = Math.max(0, total - newTotal)
  const mature = studiedCards.filter((c) => num(c.interval) >= LC.matureDays).length
  const weak = studiedCards.filter((c) => num(c.lapses) >= LC.struggleLapses).length
  const scale = studiedCards.length ? studied / studiedCards.length : 0
  const byInterval = (a, b) => num(b.interval) - num(a.interval)
  return {
    ok: true,
    name,
    total,
    studied,
    new: newTotal,
    mature: Math.round(mature * scale),
    struggling: Math.round(weak * scale),
    young: Math.max(0, studied - Math.round(mature * scale)),
    sampled: studiedCards.length,
    sampleStudied: spread([...studiedCards].sort(byInterval), LC.sampleStudied).map((c) => shapeCard(c, true)).filter(Boolean),
    sampleNew: spread(newCards, LC.sampleNew).map((c) => shapeCard(c, false)).filter(Boolean),
  }
}

// sessions: the study history entries of this mode ({ date, cardsStudied, totalQuestions, correct, accuracy }).
export function shapeStudy(raw) {
  const d = obj(raw) || {}
  if (d.ok === false) return { ok: false, sessions: 0, cards: 0, answers: 0, accuracy: null, recent: [] }
  const list = arr(d.sessions).filter(obj)
  const answers = list.reduce((n, s) => n + num(s.totalQuestions), 0)
  const right = list.reduce((n, s) => n + num(s.correct), 0)
  return {
    ok: true,
    sessions: list.length,
    cards: list.reduce((n, s) => n + num(s.cardsStudied), 0),
    answers,
    accuracy: answers > 0 ? Math.round((right / answers) * 100) : null,
    recent: list.slice(0, LC.sessionsShown).map((s) => ({ date: clip(s.date, 12), cards: num(s.cardsStudied), accuracy: s.accuracy == null || s.accuracy === '' ? null : num(s.accuracy) })),
  }
}

export function shapeSlips(raw) {
  const d = obj(raw) || {}
  if (d.ok === false) return { ok: false, count: 0, items: [] }
  const list = arr(d.items).filter((s) => obj(s) && String(s.text || '').trim())
  return { ok: true, count: list.length, items: list.slice(0, LC.slips).map((s) => `${clip(s.text, 120)}${num(s.n) > 1 ? ` (x${num(s.n)})` : ''}`) }
}

const msgText = (m) => {
  const c = m?.content
  if (typeof c === 'string') return c
  if (Array.isArray(c)) return c.map((p) => (typeof p === 'string' ? p : p?.text || '')).join(' ')
  return ''
}
// Machine tags the chat keeps inside replies (cards, sources, progress notes) are not what was said.
const stripTags = (s) => String(s || '').replace(/<(anki-card|sources|progress-update|offer-search|action)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')
const words = (s) => (String(s).match(/[\p{L}\p{N}]+/gu) || []).length

// chats: { ok, total, items: [{ title, date, messages: [{ role, content }] }] } (newest first, this mode only).
export function shapeChats(raw) {
  const d = obj(raw) || {}
  if (d.ok === false) return { ok: false, count: 0, learnerMessages: 0, learnerWords: 0, items: [] }
  const items = arr(d.items).filter(obj).slice(0, LC.chats)
  let learnerMessages = 0
  let learnerWords = 0
  const shaped = items.map((c) => {
    const msgs = arr(c.messages).filter((m) => obj(m) && !m.error)
    const mine = msgs.filter((m) => m.role === 'user').map((m) => stripTags(msgText(m)).trim()).filter(Boolean)
    const ebi = msgs.filter((m) => m.role === 'assistant').map((m) => stripTags(msgText(m)).trim()).filter(Boolean)
    learnerMessages += mine.length
    learnerWords += mine.reduce((n, s) => n + words(s), 0)
    return {
      title: clip(c.title, 80),
      date: clip(c.date || '', 12),
      learner: mine.slice(-LC.chatLearnerLines).map((s) => clip(s, LC.lineMax)),
      ebi: ebi.slice(-LC.chatEbiLines).map((s) => clip(s, LC.lineMax)),
    }
  }).filter((c) => c.learner.length || c.ebi.length)
  return { ok: true, count: Math.max(num(d.total), items.length), learnerMessages, learnerWords, items: shaped }
}

export function shapeProfile(raw) {
  const d = obj(raw) || {}
  if (d.ok === false) return { ok: false, profile: null }
  const p = obj(d.profile)
  return { ok: true, profile: p && (p.summary || p.level) ? { summary: clip(p.summary, 400), level: clip(p.level, 60) } : null }
}

export function shapeLevel(raw) {
  const d = obj(raw) || {}
  if (d.ok === false) return { ok: false, value: null, line: '' }
  const lv = d.value === '' || d.value == null ? NaN : Number(d.value)
  return { ok: true, value: Number.isFinite(lv) ? lv : null, line: clip(d.line || '', 300) }
}

// The practice log's items ({ kind, label, src, at }), newest last as the log keeps them.
export function shapePractice(raw) {
  const d = obj(raw) || {}
  if (d.ok === false) return { ok: false, count: 0, recent: [] }
  const list = arr(d.items).filter((x) => obj(x) && String(x.label || '').trim())
  const recent = [...list].sort((a, b) => num(b.at) - num(a.at)).slice(0, LC.practiceShown).map((x) => `${clip(x.label, 80)}${x.src ? ` (${clip(x.src, 20)})` : ''}`)
  return { ok: true, count: list.length, recent }
}

// The whole snapshot from the raw parts App gathered.
export function buildLearnerSnapshot(raw = {}, now = Date.now()) {
  const r = obj(raw) || {}
  return {
    at: now,
    modeId: r.modeId ?? null,
    modeName: clip(r.modeName || '', 80),
    isLanguage: !!r.isLanguage,
    deck: shapeDeck(r.deck),
    study: shapeStudy(r.study),
    slips: shapeSlips(r.slips),
    chats: shapeChats(r.chats),
    discover: shapeProfile(r.discover),
    level: shapeLevel(r.level),
    practice: shapePractice(r.practice),
    extra: arr(r.extra).filter(obj).map((x) => ({ id: String(x.id || ''), ok: x.ok !== false, title: clip(x.title || x.id || '', 60), text: String(x.text || '').slice(0, LC.extraMax) })),
  }
}

// Which parts hold anything at all (the Legends tile is offered when any does).
export function contextSources(snap) {
  if (!snap) return []
  const out = []
  if (snap.deck?.ok && snap.deck.studied > 0) out.push('cards')
  if (snap.deck?.ok && snap.deck.new > 0) out.push('newCards')
  if (snap.study?.sessions > 0) out.push('sessions')
  if (snap.chats?.items?.length > 0) out.push('chats')
  if (snap.slips?.count > 0) out.push('slips')
  if (snap.discover?.profile) out.push('discover')
  if (snap.practice?.count > 0) out.push('practice')
  if (arr(snap.extra).some((x) => x.ok && x.text)) out.push('features')
  return out
}

// ── Formatting ────────────────────────────────────────────────────────────────────────────────────────────────
// Each section as prompt text (English, for the model). Card fronts and chat lines are DATA, quoted.
const q = (s) => JSON.stringify(String(s))
const SECTION_TEXT = {
  level: (s) => (s.level.ok && (s.level.value != null || s.level.line) ? `CURRENT EBIKI LEVEL: ${s.level.line || `${s.level.value} of 130`}` : ''),
  deck: (s) => {
    const d = s.deck
    if (!d.ok) return `DECK${d.name ? ` "${d.name}"` : ''}: could not be read${d.unreachable ? ' (the card app is not answering)' : ''}, so card scheduling is unknown (NOT a sign the learner knows nothing).`
    if (!d.name) return 'DECK: none chosen for this subject.'
    return `DECK "${d.name}": ${d.total} cards. ${d.studied} studied by the learner (about ${d.mature} mature, interval ${LC.matureDays}+ days, so reliably known; about ${d.young} younger, still being learned; about ${d.struggling} forgotten ${LC.struggleLapses}+ times). ${d.new} new, never studied.`
  },
  studied: (s) => {
    const list = s.deck.ok ? s.deck.sampleStudied : []
    if (!list.length) return ''
    return `STUDIED CARDS (sample, real stats: ivl = days until the next review, longer = better known; lapses = times forgotten):\n${list.map((c) => `- ${q(c.front)}${c.back ? ` = ${q(c.back)}` : ''} | ivl ${c.interval}d, reps ${c.reps}, lapses ${c.lapses}${c.ease ? `, ease ${c.ease}%` : ''}`).join('\n')}`
  },
  new: (s) => {
    const list = s.deck.ok ? s.deck.sampleNew : []
    if (!list.length) return ''
    return `NEW CARDS THE LEARNER CHOSE TO STUDY NEXT (never studied: they show the scope and the level the learner is aiming for, NOT what they know):\n${list.map((c) => `- ${q(c.front)}${c.back ? ` = ${q(c.back)}` : ''}`).join('\n')}`
  },
  study: (s) => {
    const st = s.study
    if (!st.ok || !st.sessions) return ''
    const recent = st.recent.map((r) => `${r.date}: ${r.cards} cards${r.accuracy != null ? `, ${r.accuracy}% right` : ''}`).join('; ')
    return `STUDY SESSIONS IN EBIKI: ${st.sessions} (${st.cards} cards, ${st.answers} graded answers${st.accuracy != null ? `, ${st.accuracy}% right` : ''}). Recent: ${recent}.`
  },
  slips: (s) => (s.slips.items.length ? `RECURRING MISTAKES logged while studying:\n${s.slips.items.map((x) => `- ${q(x)}`).join('\n')}` : ''),
  chats: (s) => {
    const c = s.chats
    if (!c.items.length) return ''
    const body = c.items.map((it) => [
      `Chat ${q(it.title || 'untitled')}${it.date ? ` (${it.date})` : ''}:`,
      ...it.learner.map((l) => `  learner: ${q(l)}`),
      ...it.ebi.map((l) => `  Ebi: ${q(l)}`),
    ].join('\n')).join('\n')
    return `CHATS WITH EBI ABOUT THIS SUBJECT (${c.count}; the learner wrote ${c.learnerMessages} messages, about ${c.learnerWords} words; the newest first, the learner's own words show what they can produce and ask about, Ebi's replies show corrections and explanations):\n${body}`
  },
  discover: (s) => (s.discover.profile ? `EARLIER ESTIMATE (Discover tab): ${s.discover.profile.level || '?'}. ${s.discover.profile.summary || ''}`.trim() : ''),
  practice: (s) => (s.practice.recent.length ? `PRACTICED RECENTLY in Ebiki's activities (${s.practice.count} entries):\n${s.practice.recent.map((x) => `- ${x}`).join('\n')}` : ''),
  extra: (s) => arr(s.extra).filter((x) => x.ok && x.text).map((x) => `${x.title.toUpperCase()}:\n${x.text}`).join('\n\n'),
  // Compact views for small prompt blocks (not in the default SECTIONS: they repeat parts of `studied` and `chats`).
  weak: (s) => {
    const list = s.deck.ok ? [...s.deck.sampleStudied].filter((c) => c.lapses >= LC.struggleLapses).sort((a, b) => b.lapses - a.lapses).slice(0, LC.weakShown) : []
    if (!list.length) return ''
    return `CARDS THE LEARNER KEEPS FORGETTING (forgotten ${LC.struggleLapses}+ times, from a sample of the deck):\n${list.map((c) => `- ${q(c.front)}${c.back ? ` = ${q(c.back)}` : ''} (forgotten ${c.lapses}x)`).join('\n')}`
  },
  topics: (s) => {
    const titles = s.chats.items.map((c) => c.title).filter(Boolean).slice(0, LC.topicsShown)
    if (!titles.length) return ''
    return `RECENT CHAT TOPICS WITH EBI (${s.chats.count} chats in this subject, newest first): ${titles.map(q).join(', ')}.`
  },
}
// Every section formatLearnerContext knows (SECTIONS plus the compact views).
export const ALL_SECTIONS = [...SECTIONS, 'weak', 'topics']

// Cut text to n characters on a line break when one is near, marked with "…".
function cut(text, n) {
  if (text.length <= n) return text
  if (n < 2) return ''
  const head = text.slice(0, n - 1)
  const nl = head.lastIndexOf('\n')
  return `${nl > n * 0.6 ? head.slice(0, nl) : head}…`
}

// A compact, bounded prompt block: `sections` in the order given (default all), at most `budget` characters in all.
// A section that does not fit is cut; once too little room is left, the rest is left out.
export function formatLearnerContext(snap, { budget = LC.budget, sections = SECTIONS } = {}) {
  if (!snap) return ''
  const parts = []
  let left = Math.max(0, Number(budget) || 0)
  for (const id of arr(sections)) {
    const fn = SECTION_TEXT[id]
    if (!fn) continue
    let text = ''
    try { text = fn(snap) || '' } catch { text = '' }
    if (!text) continue
    const sep = parts.length ? 2 : 0
    if (left - sep < 40) break
    const piece = cut(text, left - sep)
    if (!piece) break
    parts.push(piece)
    left -= piece.length + sep
  }
  return parts.join('\n\n')
}

// ── Cache: one snapshot per mode, reused for LC.ttlMs, cleared by any app event ──────────────────────────────────
export function createLearnerContextCache({ ttlMs = LC.ttlMs, now = () => Date.now() } = {}) {
  const entries = new Map() // modeKey -> { at, gen, promise }
  let gen = 0
  return {
    // load(): the snapshot. `fresh` reads again. Two callers at once share one read.
    get(modeId, load, { fresh = false } = {}) {
      const key = String(modeId ?? '')
      const e = entries.get(key)
      if (!fresh && e && e.gen === gen && now() - e.at < ttlMs) return e.promise
      const entry = { at: now(), gen, promise: null }
      entry.promise = Promise.resolve().then(load).catch((err) => { if (entries.get(key) === entry) entries.delete(key); throw err })
      entries.set(key, entry)
      return entry.promise
    },
    invalidate() { gen++ },
  }
}
