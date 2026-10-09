// The game feature's client state: who is playing on this computer, their player file, and friends.
// A tiny external store (subscribe/getSnapshot) so any component can read it with useGame().
//
// Writes follow the app's clobber rules: nothing is saved until the players list was READ successfully,
// saves pause while the data folder is switching, and the server merges every write with what is on
// disk (engine.mergePlayers), so a stale or repeated save can never lower a counter.
import { useSyncExternalStore } from 'react'
import { platform, apiFetch } from '../../platform'
import { dateKey, addDays, dayTotals, eventDelta, mergePlayers, pickQuests, computeStreak, COUNTERS, DEFAULT_GOAL, dayMeta } from './engine'

const SAVE_DEBOUNCE_MS = 1500
const SAVE_RETRY_MS = 30000        // a failed save tries again (else it waited for the next award or the page closing)
const SEND_DAYS = 14               // a save carries only recent days: the server merges into the full file
const REFRESH_MS = 120000          // pull friends' progress (and this player's other computers) this often
const LOCAL_BACKUP_KEY = 'ebiki-game-unsaved' // this computer's unsaved player, if the last save failed
const API = { players: '/api/players', local: '/api/player-local', inbox: '/api/game-inbox' }
const INBOX_MS = 15000             // the main window collects awards the Alt+Q overlay relayed (it never loads a player)

let state = {
  status: 'idle',        // idle | loading | ready | choose (several players, none picked here) | error
  machineId: '',
  player: null,          // this computer's player
  others: [],            // every other player in the data folder
  lastXp: null,          // { xp, at } the latest award, for the +XP pop
  panel: null,           // which game modal is open ('streak' | 'goal' | null): UI only, never saved
  error: '',
}
const listeners = new Set()
const set = (patch) => { state = { ...state, ...patch }; for (const l of listeners) l() }
export const getGame = () => state
export const subscribeGame = (fn) => { listeners.add(fn); return () => listeners.delete(fn) }
export const useGame = () => useSyncExternalStore(subscribeGame, getGame)

let readOk = false
let blocked = () => false      // App's "data folder is switching" signal
let installed = () => ({})     // ids of installed features, for quests
let saveTimer = null
let dirty = false
let refreshTimer = null
const pending = []             // awards that arrived before the player was loaded
let initCalled = false         // false in a window that never loads the game (the overlay): its awards are relayed
let inboxTimer = null
let retryTimer = null
let retries = 0
let saving = 0                 // saves in flight
const RETRY_MS = [5000, 15000, 30000, 60000] // a failed load tries again (else every award of the session was lost)

const newId = () => platform.randomId().slice(0, 16)

async function getJson(url, init) {
  const r = await apiFetch(url, init)
  if (!r.ok) throw new Error(`${url} ${r.status}`)
  return r.json()
}

export const openGamePanel = (panel) => set({ panel })
export const closeGamePanel = () => set({ panel: null })

export function configureGame({ isBlocked, features }) {
  if (typeof isBlocked === 'function') blocked = isBlocked
  if (typeof features === 'function') installed = features
}

// Load identity + players. Safe to call again (a data-folder change reloads the page anyway).
export async function initGame() {
  initCalled = true
  if (state.status === 'loading') return
  set({ status: 'loading', error: '' })
  try {
    const local = await getJson(API.local)
    const { players, unreadable } = await getJson(API.players)
    // This computer's player exists but could not be read (a locked file on the share): a FAILED read. Never create
    // or choose another player then (this computer switched to a new empty player and lost its streak).
    if (local.playerId && Array.isArray(unreadable) && unreadable.includes(local.playerId)) throw new Error('player file unreadable')
    // No player picked here yet and the folder's only players are unreadable: "no players" would make a new one and pin it.
    if (!local.playerId && !players.length && Array.isArray(unreadable) && unreadable.length) throw new Error('player files unreadable')
    readOk = true
    retries = 0
    let mine = players.find((p) => p.id === local.playerId) || null
    // Awards not yet saved (the save debounce, a failed save) are kept when the load runs again.
    if (mine && state.player?.id === mine.id) { mine = mergePlayers(mine, state.player); dirty = true }
    try { // a save that failed last time is folded back in (the merge never double counts)
      const unsaved = platform.kv.getJson(LOCAL_BACKUP_KEY)
      if (unsaved?.id && mine && unsaved.id === mine.id) { mine = mergePlayers(mine, unsaved); dirty = true }
    } catch { /* nothing kept */ }
    const others = players.filter((p) => p.id !== mine?.id)
    if (mine) {
      set({ status: 'ready', machineId: local.machineId, player: mine, others })
    } else if (!players.length) {
      set({ machineId: local.machineId })
      await createPlayer('')
    } else {
      set({ status: 'choose', machineId: local.machineId, player: null, others: players })
    }
    flushPending()
    drainInbox()
    clearInterval(inboxTimer)
    inboxTimer = setInterval(drainInbox, INBOX_MS)
    if (dirty) scheduleSave()
    clearInterval(refreshTimer)
    refreshTimer = setInterval(refresh, REFRESH_MS)
  } catch (e) {
    readOk = false
    set({ status: 'error', error: String(e.message || e) })
    clearTimeout(retryTimer)
    retryTimer = setTimeout(initGame, RETRY_MS[Math.min(retries++, RETRY_MS.length - 1)])
  }
}

async function refresh() {
  if (!readOk || blocked() || platform.isHidden()) return
  try {
    const { players } = await getJson(API.players)
    const me = state.player && players.find((p) => p.id === state.player.id)
    const patch = { others: players.filter((p) => p.id !== state.player?.id), ...(me ? { player: mergePlayers(me, state.player) } : {}) }
    // Nothing new (the usual case every 2 minutes): no new objects, so the header, rail and panels don't re-render.
    const same = (a, b) => { try { return JSON.stringify(a) === JSON.stringify(b) } catch { return false } }
    if (same(patch.others, state.others) && (!patch.player || same(patch.player, state.player))) return
    set(patch)
  } catch { /* try again next time */ }
}

export async function choosePlayer(id) {
  let p = state.others.find((x) => x.id === id)
  if (!p) return
  await getJson(API.local, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerId: id }) })
  // This player's save that failed last time (before a switch away) is folded back in, as initGame does.
  const unsaved = platform.kv.getJson(LOCAL_BACKUP_KEY)
  if (unsaved?.id === id) { p = mergePlayers(p, unsaved); dirty = true }
  set({ status: 'ready', player: p, others: state.others.filter((x) => x.id !== id) })
  flushPending()
  if (dirty) scheduleSave()
}

export async function createPlayer(name) {
  const player = { id: newId(), name: String(name || '').trim().slice(0, 40), avatar: '', goalXp: DEFAULT_GOAL, createdAt: Date.now(), profileAt: Date.now(), days: {} }
  await getJson(API.local, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerId: player.id }) })
  set({ status: 'ready', player, others: state.others })
  dirty = true
  await save()
  flushPending()
}

export function updateProfile(patch) {
  if (!state.player) return
  const allowed = {}
  for (const k of ['name', 'avatar', 'goalXp', 'restDays', 'restDaysHistory', 'restDates']) if (patch[k] !== undefined) allowed[k] = patch[k]
  set({ player: { ...state.player, ...allowed, profileAt: Date.now() } })
  dirty = true
  scheduleSave()
}

// Today's record on THIS computer, created with the day's goal and quests the first time it's touched.
function todayRecord(player) {
  const key = dateKey()
  const recs = player.days?.[key] || {}
  const mine = recs[state.machineId] || Object.fromEntries(COUNTERS.map((c) => [c, 0]))
  const anyQuests = dayMeta(player, key).quests // by sorted machine id, like computeStreak
  return {
    key,
    rec: {
      ...mine,
      goal: mine.goal || player.goalXp || DEFAULT_GOAL,
      quests: mine.quests?.length ? mine.quests : anyQuests || pickQuests(player.id, key, player.goalXp || DEFAULT_GOAL, installed()),
    },
  }
}

// Make sure today's quests exist (so the rail can show them before anything is earned).
export function ensureToday() {
  const p = state.player
  if (!p || state.machineId === '') return
  const { key, rec } = todayRecord(p)
  if (p.days?.[key]?.[state.machineId]?.quests?.length) return
  set({ player: { ...p, days: { ...p.days, [key]: { ...(p.days?.[key] || {}), [state.machineId]: rec } } } })
  dirty = true
  scheduleSave()
}

// Record an app event (see ../events.js mapping in ./index.js). Returns the XP it earned.
export function award(kind, opts = {}) {
  if (!state.player) {
    // A window that never loads the game (the overlay: cards added from a screen capture) hands the award to this
    // computer's inbox; the main window adds it. Loading a player here would make a second writer for one machine.
    if (!initCalled) { relayAward(kind, opts); return 0 }
    pending.push([kind, opts]); return 0
  }
  const p = state.player
  const { key, rec } = todayRecord(p)
  const delta = eventDelta(kind, opts, rec)
  if (!Object.keys(delta).length) return 0
  const next = { ...rec }
  for (const [c, n] of Object.entries(delta)) next[c] = (Number(next[c]) || 0) + n
  set({
    player: { ...p, days: { ...p.days, [key]: { ...(p.days?.[key] || {}), [state.machineId]: next } } },
    ...(delta.xp ? { lastXp: { xp: delta.xp, at: Date.now() } } : {}),
  })
  dirty = true
  scheduleSave()
  return delta.xp || 0
}

function relayAward(kind, opts) {
  try { apiFetch(API.inbox, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ add: [[kind, opts]] }) }).catch(() => {}) } catch { /* best effort */ }
}

let draining = false
async function drainInbox() {
  if (!state.player || !readOk || blocked() || draining) return
  draining = true
  try {
    const { items } = await getJson(API.inbox, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ take: true }) })
    for (const it of Array.isArray(items) ? items : []) if (Array.isArray(it) && typeof it[0] === 'string') award(it[0], it[1] && typeof it[1] === 'object' ? it[1] : {})
  } catch { /* next time */ } finally { draining = false }
}

function flushPending() {
  if (!state.player) return
  while (pending.length) { const [k, o] = pending.shift(); award(k, o) }
}

// The player with only recent days: small enough for a keepalive request, and the server's merge keeps the rest.
function outgoing() {
  const p = state.player
  const from = addDays(dateKey(), -SEND_DAYS)
  return { ...p, days: Object.fromEntries(Object.entries(p.days || {}).filter(([k]) => k >= from)) }
}

function scheduleSave(ms = SAVE_DEBOUNCE_MS) {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(save, ms)
}

// Save now (before a player switch, so awards still waiting in the debounce are not lost).
export const saveGameNow = () => { clearTimeout(saveTimer); return save() }

async function save() {
  if (!dirty || !readOk || !state.player) return
  // Writers frozen (a folder switch, the share back after a failed merge): kept for the next load instead (initGame
  // folds it back in for the same player), never sent now.
  if (blocked()) { try { platform.kv.setJson(LOCAL_BACKUP_KEY, state.player) } catch { /* storage full */ } return }
  dirty = false
  const sent = outgoing()
  saving++
  try {
    const { player } = await getJson(API.players, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ player: sent }) })
    if (player?.id === state.player?.id) set({ player: mergePlayers(player, state.player) })
    // Only THIS player's backup is now saved: another player's (a failed save before "Switch player") stays until that
    // player is loaded again, else its unsaved progress was lost.
    if (platform.kv.getJson(LOCAL_BACKUP_KEY)?.id === sent.id) platform.kv.remove(LOCAL_BACKUP_KEY)
  } catch {
    dirty = true
    platform.kv.setJson(LOCAL_BACKUP_KEY, state.player) // storage full: in memory only
    // Tried again on its own: a share that blinked out (503) left the day's XP unsaved on this computer, invisible to
    // the player's other computers and friends, until the next award or the page closing. An award meanwhile re-arms the
    // short debounce (it replaces this timer).
    scheduleSave(SAVE_RETRY_MS)
  } finally { saving-- }
}

// Unsaved progress goes out as the app closes (keepalive survives the unload).
// A save still in flight counts too: `dirty` was cleared when it started, and closing the page cancels its request.
platform.onPageHide(() => {
  if ((!dirty && !saving) || !readOk || !state.player) return
  if (blocked()) { try { platform.kv.setJson(LOCAL_BACKUP_KEY, state.player) } catch { /* storage full */ } return }
  try { apiFetch(API.players, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ player: outgoing() }) }) } catch { /* best effort */ }
})

// Convenience for components.
export const todayTotals = (player) => dayTotals(player, dateKey())

// Today's streak for a player object, computed once per object and day. The header chip, the rail cards, the week dots
// and the streak modal each walked every day since the first one on every app render (about 4 ms each after a few years
// of play). Safe because this store never edits a player in place: every change makes a new object.
const streakMemo = new WeakMap()
export function streakOf(player) {
  if (!player || typeof player !== 'object') return computeStreak(player)
  const day = dateKey()
  const hit = streakMemo.get(player)
  if (hit && hit.day === day) return hit.s
  const s = computeStreak(player, day)
  streakMemo.set(player, { day, s })
  return s
}
