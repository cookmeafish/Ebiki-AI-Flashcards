// Ebiki's gamification, as PURE functions over one stored thing: per-day activity counters.
//
// A player's file holds `days: { 'YYYY-MM-DD': { [machineId]: DayRecord } }`. Each computer only ever
// RAISES its own counters, so two computers on one shared data folder merge by taking the max per
// counter per machine and nothing is lost or double counted. Everything shown (streak, freezes, quests,
// league tier, friend streaks) is DERIVED from those counters, so there is no second copy of the truth
// to drift, and a merge can never produce an impossible state.
//
// DayRecord: { xp, cards, correct, added, chat, gym, gymDone, legends, calls, learn, roleplays, practiced, bossWins, levelUps,
//             goal, quests: [id] }
// Subject-agnostic on purpose: a "card" is a card in any mode, language or CompTIA or music theory.

export const COUNTERS = ['xp', 'cards', 'correct', 'added', 'chat', 'gym', 'gymDone', 'legends', 'calls', 'learn', 'roleplays', 'practiced', 'bossWins', 'levelUps', 'legendsTries']

// Daily goals, in XP. Minutes are the rough time at about a card a minute (10 XP each).
export const GOALS = [
  { key: 'relaxed', xp: 10, minutes: 3 },
  { key: 'normal', xp: 30, minutes: 10 },
  { key: 'serious', xp: 50, minutes: 15 },
  { key: 'intense', xp: 100, minutes: 30 },
]
export const DEFAULT_GOAL = 30
export const MAX_FREEZES = 2
export const START_FREEZES = 1
export const CHAT_XP_CAP = 20 // chat is worth something, but it must not out-earn studying
// A failed Legends step or a Blitz run pays a little practice XP, at most this many times a day: losing a boss on
// purpose (three quick misses) paid a flat 10 XP every time, more than a cleared step's replay.
export const LEGENDS_TRY_XP_CAP = 6

// XP per event. Kept small and legible: a studied card is the unit (10 XP).
export const XP = { card: 10, cardCorrect: 5, learn: 5, cardAdded: 3, chat: 1, gym: 5, gymDone: 10, legends: 20, call: 10, placement: 30, roleplay: 15, practiceDone: 10, legendsTry: 5, bossWin: 50, levelUp: 10 }
// A Legends step is worth more further up the map: + LEGENDS_AREA_XP per area climbed, up to LEGENDS_AREA_CAP areas.
export const LEGENDS_AREA_XP = 5
export const LEGENDS_AREA_CAP = 6
export const LEVEL_UP_CAP = 3 // whole learner levels paid for at once (a placement-sized jump is not an XP windfall)
// A Legends step pays for the EFFORT its answers show (typed power strikes most, safe choices least: 0.5 .. 1.3,
// computed by Legends) and less each time an already cleared step is replayed (farming easy content pays little).
export const EFFORT_RANGE = { min: 0.5, max: 1.3 }
export const REPLAY_DECAY = 0.6
export const REPLAY_MIN = 0.25
export const replayFactor = (replays) => Math.max(REPLAY_MIN, REPLAY_DECAY ** Math.max(0, Math.round(Number(replays) || 0)))
export function legendsXp({ area = 0, effort = 1, replays = 0 } = {}) {
  const base = XP.legends + LEGENDS_AREA_XP * Math.max(0, Math.min(LEGENDS_AREA_CAP, Math.round(Number(area) || 0)))
  const e = Math.max(EFFORT_RANGE.min, Math.min(EFFORT_RANGE.max, Number(effort) || 1))
  return Math.max(1, Math.round(base * e * replayFactor(replays)))
}

// ─── Dates (LOCAL days, like Anki's) ───────────────────────────────────────────
export const dateKey = (d = new Date()) => {
  const x = d instanceof Date ? d : new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12) } // noon: DST-proof
export const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return dateKey(d) }
export const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000)
// Monday of the key's week (weeks start on Monday, like Duolingo's leagues).
export const weekStart = (k) => { const d = parseKey(k); const dow = (d.getDay() + 6) % 7; return addDays(k, -dow) }

// ─── Counters ──────────────────────────────────────────────────────────────────
const emptyCounters = () => Object.fromEntries(COUNTERS.map((c) => [c, 0]))

// Totals for one day across every machine that recorded it.
export function dayTotals(player, key) {
  const out = emptyCounters()
  const recs = player?.days?.[key]
  if (!recs) return out
  for (const rec of Object.values(recs)) for (const c of COUNTERS) out[c] += Number(rec?.[c]) || 0
  return out
}
// The day's goal and quest list: the first machine (by id) that recorded one wins, so every computer agrees.
function dayMeta(player, key) {
  const recs = player?.days?.[key]
  if (!recs) return { goal: null, quests: null }
  let goal = null, quests = null
  for (const id of Object.keys(recs).sort()) {
    if (goal == null && Number(recs[id]?.goal) > 0) goal = Number(recs[id].goal)
    if (!quests && Array.isArray(recs[id]?.quests) && recs[id].quests.length) quests = recs[id].quests
  }
  return { goal, quests }
}

// What an event adds to TODAY's counters on this machine. `today` = this machine's counters so far today
// (for caps). Returns increments; unknown events add nothing.
export function eventDelta(kind, opts = {}, today = {}) {
  const n = Math.max(1, Math.round(Number(opts.n) || 1))
  switch (kind) {
    case 'card': return { cards: 1, correct: opts.correct ? 1 : 0, xp: XP.card + (opts.correct ? XP.cardCorrect : 0) }
    case 'learn': return { learn: 1, xp: XP.learn }
    case 'cardAdded': return { added: n, xp: XP.cardAdded * n }
    case 'chat': return { chat: 1, xp: (Number(today.chat) || 0) < CHAT_XP_CAP ? XP.chat : 0 }
    case 'gym': return { gym: 1, xp: XP.gym }
    case 'gymDone': return { gymDone: 1, xp: XP.gymDone }
    case 'legends': return { legends: 1, xp: legendsXp(opts) }
    case 'bossWin': return { bossWins: 1, xp: XP.bossWin } // also earns a streak freeze (computeStreak)
    case 'levelUp': { const k = Math.min(LEVEL_UP_CAP, n); return { levelUps: k, xp: XP.levelUp * k } }
    case 'call': return { calls: 1, xp: XP.call + XP.card * Math.max(0, Number(opts.cards) || 0) }
    case 'placement': return { xp: XP.placement }
    case 'roleplay': return { roleplays: 1, xp: XP.roleplay }
    case 'practiceDone': return { practiced: 1, xp: XP.practiceDone } // any other finished practice activity
    case 'legendsTry': return { practiced: 1, legendsTries: 1, xp: (Number(today.legendsTries) || 0) < LEGENDS_TRY_XP_CAP ? XP.legendsTry : 0 }
    default: return {}
  }
}

// Merge two player files (server side on every write, and client side after a read): counters take the
// max PER MACHINE, so each computer's own progress is monotonic and nothing is summed twice.
export function mergePlayers(a, b) {
  if (!a) return b || null
  if (!b) return a
  const out = { ...a, ...b, days: { ...(a.days || {}) } }
  for (const [key, recs] of Object.entries(b.days || {})) {
    const into = { ...(out.days[key] || {}) }
    for (const [machine, rec] of Object.entries(recs || {})) {
      const prev = into[machine] || {}
      const merged = { ...prev }
      for (const c of COUNTERS) merged[c] = Math.max(Number(prev[c]) || 0, Number(rec?.[c]) || 0)
      if (Number(rec?.goal) > 0) merged.goal = prev.goal || Number(rec.goal)
      if (Array.isArray(rec?.quests) && rec.quests.length && !(Array.isArray(prev.quests) && prev.quests.length)) merged.quests = rec.quests
      into[machine] = merged
    }
    out.days[key] = into
  }
  // Profile fields: the newer edit wins.
  if ((Number(a.profileAt) || 0) > (Number(b.profileAt) || 0)) {
    for (const f of PROFILE_FIELDS) if (a[f] !== undefined) out[f] = a[f]
  }
  return out
}

// Profile fields (not counters): the newer edit wins in a merge.
export const PROFILE_FIELDS = ['name', 'avatar', 'goalXp', 'restDays', 'restDates', 'profileAt']

// ─── Rest days ─────────────────────────────────────────────────────────────────
// Planned days off never break the streak and never spend a freeze: every week on some weekdays (0 = Monday ..
// 6 = Sunday), or single dates planned ahead. A rest day with XP still counts as a normal day.
export const REST_DATES_MAX = 60
export const weekdayOf = (k) => (parseKey(k).getDay() + 6) % 7
export function isRestDay(player, key) {
  const days = Array.isArray(player?.restDays) ? player.restDays : []
  const dates = Array.isArray(player?.restDates) ? player.restDates : []
  return days.includes(weekdayOf(key)) || dates.includes(key)
}

// ─── Quests ────────────────────────────────────────────────────────────────────
// A quest id is "<kind>:<target>". The list for a day is picked once (seeded, so reproducible) and stored
// in that day's record, so a later change of goal or features never rewrites past quests.
const QUESTS = {
  xp: { metric: 'xp' },
  cards: { metric: 'cards', targets: [5, 10, 15] },
  correct: { metric: 'correct', targets: [5, 8, 12] },
  added: { metric: 'added', targets: [2, 3, 5] },
  chat: { metric: 'chat', targets: [5, 10] },
  gym: { metric: 'gymDone', targets: [1], feature: 'mistake-gym' },
  legends: { metric: 'legends', targets: [1, 2], feature: 'legends' },
  call: { metric: 'calls', targets: [1], feature: 'ebi-call' },
  roleplay: { metric: 'roleplays', targets: [1], feature: 'roleplay' },
}
export const questKinds = () => Object.keys(QUESTS)

function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }

// Three quests: always "earn XP" (a bit above the goal), plus two others the player can actually do today.
// `features` = ids of the installed features (src/features/index.js): a quest that needs a feature only
// appears once it exists. `prefer` = quest kinds to favor (weak spots).
export function pickQuests(seed, key, goalXp = DEFAULT_GOAL, features = {}, prefer = []) {
  const r = rng(hashStr(`${seed}|${key}`))
  const xpTarget = Math.max(goalXp + 10, Math.round((goalXp * 1.5) / 5) * 5)
  const pool = Object.keys(QUESTS).filter((k) => k !== 'xp' && (!QUESTS[k].feature || features[QUESTS[k].feature]))
  const out = [`xp:${xpTarget}`]
  const ordered = [...prefer.filter((k) => pool.includes(k)), ...pool.map((k) => [k, r()]).sort((a, b) => a[1] - b[1]).map(([k]) => k)]
  for (const k of ordered) {
    if (out.length >= 3) break
    if (out.some((q) => q.startsWith(k + ':'))) continue
    const ts = QUESTS[k].targets
    out.push(`${k}:${ts[Math.floor(r() * ts.length)]}`)
  }
  return out
}

export function questProgress(id, totals) {
  const [kind, target] = String(id).split(':')
  const q = QUESTS[kind]
  const need = Math.max(1, Number(target) || 1)
  const have = q ? Number(totals?.[q.metric]) || 0 : 0
  return { id, kind, target: need, value: Math.min(have, need), done: have >= need }
}

// ─── Streak and freezes ────────────────────────────────────────────────────────
// Any XP on a day keeps the streak ("do anything that earns XP today"); the goal is separate.
// Freezes: start with one; finishing ALL of a day's quests earns one, and so does each Legends boss beaten (hold at
// most two). A missed day spends a freeze automatically if one is held, so the streak survives.
export function computeStreak(player, today = dateKey()) {
  const keys = Object.keys(player?.days || {}).filter((k) => k <= today && dayTotals(player, k).xp > 0).sort()
  const empty = { streak: 0, longest: 0, freezes: START_FREEZES, frozen: [], rested: [], todayDone: false, first: null }
  if (!keys.length) return empty
  let streak = 0, longest = 0, freezes = START_FREEZES
  const frozen = []
  const rested = []
  for (let d = keys[0]; d <= today; d = addDays(d, 1)) {
    const tot = dayTotals(player, d)
    if (tot.xp > 0) {
      streak++
      longest = Math.max(longest, streak)
      const { quests } = dayMeta(player, d)
      if (quests && quests.length && quests.every((q) => questProgress(q, tot).done)) freezes = Math.min(MAX_FREEZES, freezes + 1)
      if (tot.bossWins > 0) freezes = Math.min(MAX_FREEZES, freezes + tot.bossWins)
    } else if (d === today) {
      // Today isn't over: the streak stands until midnight.
    } else if (isRestDay(player, d)) {
      rested.push(d) // a planned day off: nothing breaks, nothing is spent
    } else if (streak > 0 && freezes > 0) {
      freezes--
      frozen.push(d)
    } else {
      streak = 0
    }
  }
  return { streak, longest, freezes, frozen, rested, todayDone: dayTotals(player, today).xp > 0, first: keys[0] }
}

// Monday..Sunday of the current week: 'done' | 'frozen' | 'rest' | 'missed' | 'today' | 'future' | 'none'
// ('none' = before the player's first day).
export function weekRow(player, today = dateKey()) {
  const s = computeStreak(player, today)
  const frozen = new Set(s.frozen)
  const mon = weekStart(today)
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(mon, i)
    const xp = dayTotals(player, d).xp
    const status = d > today ? 'future'
      : xp > 0 ? 'done'
      : frozen.has(d) ? 'frozen'
      : d === today ? (isRestDay(player, d) ? 'rest' : 'today')
      : isRestDay(player, d) ? 'rest'
      : (!s.first || d < s.first) ? 'none' : 'missed'
    return { date: d, status }
  })
}

// ─── Leagues: race your own past weeks (and see friends) ───────────────────────
export const TIERS = ['plankton', 'krill', 'shrimp', 'prawn', 'crab', 'lobster', 'legend']

export function weekXp(player, monday, throughDay = 6) {
  let xp = 0
  for (let i = 0; i <= throughDay; i++) xp += dayTotals(player, addDays(monday, i)).xp
  return xp
}

// The tier for the week starting `monday`, from every completed week before it. A week promotes when it
// beats all of its ghosts (the four weeks before it that the player was around for) and demotes when it
// falls below all of them or earns nothing. With no ghosts yet, five days' worth of goal promotes.
export function tierFor(player, monday, goalXp = DEFAULT_GOAL) {
  const s = computeStreak(player, addDays(monday, -1))
  if (!s.first) return 0
  const firstWeek = weekStart(s.first)
  let tier = 0
  for (let w = firstWeek; w < monday; w = addDays(w, 7)) {
    const me = weekXp(player, w)
    const ghosts = [1, 2, 3, 4].map((n) => addDays(w, -7 * n)).filter((g) => g >= firstWeek).map((g) => weekXp(player, g))
    if (me === 0) tier = Math.max(0, tier - 1)
    else if (!ghosts.length) { if (me >= goalXp * 5) tier = Math.min(TIERS.length - 1, tier + 1) }
    else if (me > Math.max(...ghosts)) tier = Math.min(TIERS.length - 1, tier + 1)
    else if (me < Math.min(...ghosts)) tier = Math.max(0, tier - 1)
  }
  return tier
}

// This week's board: you, your ghosts (their XP by the SAME weekday, so it's a real race) and friends.
export function leagueBoard(player, friends = [], today = dateKey(), goalXp = DEFAULT_GOAL) {
  const mon = weekStart(today)
  const dayIdx = daysBetween(mon, today)
  const s = computeStreak(player, today)
  const firstWeek = s.first ? weekStart(s.first) : mon
  const rows = [{ kind: 'me', id: player?.id, name: player?.name, xp: weekXp(player, mon, dayIdx) }]
  for (const n of [1, 2, 3, 4]) {
    const g = addDays(mon, -7 * n)
    if (g < firstWeek) continue
    rows.push({ kind: 'ghost', weeksAgo: n, xp: weekXp(player, g, dayIdx), finalXp: weekXp(player, g) })
  }
  for (const f of friends) rows.push({ kind: 'friend', id: f.id, name: f.name, avatar: f.avatar, xp: weekXp(f, mon, dayIdx) })
  rows.sort((a, b) => b.xp - a.xp || (a.kind === 'me' ? -1 : b.kind === 'me' ? 1 : 0))
  return { tier: tierFor(player, mon, goalXp), rows, daysLeft: 6 - dayIdx }
}

// Consecutive days both players earned XP, ending today (if both did) or yesterday.
export function friendStreak(a, b, today = dateKey()) {
  const both = (d) => dayTotals(a, d).xp > 0 && dayTotals(b, d).xp > 0
  let d = both(today) ? today : addDays(today, -1)
  let n = 0
  while (both(d) && n < 3650) { n++; d = addDays(d, -1) }
  return n
}
