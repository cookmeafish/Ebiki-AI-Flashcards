// Per-mode Legends maps in the framework JSON store (data folder: features/legends/map-<modeId>.json).
// Writes are serialized and only follow a successful read of the same map (never a blind overwrite), and
// every async writer names the mode it STARTED for (a mode switch mid-generation must not file its result
// under the new mode).
import { useEffect, useSyncExternalStore } from 'react'
import { featureStore } from '../storage'
import { shapeMap } from './map'
import { isCareerMap } from './career'
import { fnv } from './hash.js'

export const LEGENDS_ID = 'legends'
// The intent that opens the Legends screen (= the nav id); payload { edit: '<request>' } opens "Change my map". Here,
// not in LegendsScreen, so the rail's LevelCard can open it without pulling the whole screen into the startup bundle.
export const LEGENDS_INTENT = 'legends'

let blocked = () => false
export const configureLegends = (ctx) => { if (ctx?.isDataSwitching) blocked = () => !!ctx.isDataSwitching() }
const store = featureStore(LEGENDS_ID, { isBlocked: () => blocked() })

const keyFor = (modeId) => `map-${String(modeId ?? 'default').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'default'}`
const cache = new Map()     // key -> map | null (read OK; null = no map yet)
const failed = new Set()
const listeners = new Set()
let version = 0
const notify = () => { version++; for (const l of listeners) l() }
let chain = Promise.resolve()

async function ensure(key, { fresh = false } = {}) {
  if (cache.has(key) && !fresh) return { ok: true, value: cache.get(key) }
  const r = await store.read(key)
  if (!r.ok) { failed.add(key); notify(); return { ok: false, value: null } }
  // A saved map this build cannot read (written by a newer version, or damaged) is NOT "no map yet": treated
  // as unreadable, so nothing (a new plan, Start over) is ever written over it.
  const shaped = shapeMap(r.value)
  if (r.value != null && shaped == null) { failed.add(key); notify(); return { ok: false, value: null } }
  failed.delete(key)
  cache.set(key, shaped)
  notify()
  return { ok: true, value: cache.get(key) }
}

export const loadMap = (modeId, opts) => ensure(keyFor(modeId), opts)
export const peekMap = (modeId) => cache.get(keyFor(modeId)) || null

// Apply fn(map | null) → map (or null to delete, or the same object to do nothing), persisted in order.
// Resolves to the map as saved (or the unchanged one), or undefined when the map could not be read or written.
export function updateMap(modeId, fn) {
  const key = keyFor(modeId)
  const run = chain.then(async () => {
    // Read the file again before every write: on a shared data folder another computer may have saved since this
    // page loaded, and writing the whole map from the old copy erased that computer's progress.
    const r = await ensure(key, { fresh: true })
    if (!r.ok) return undefined
    const next = fn(r.value)
    if (next === r.value) return r.value
    if (!(await store.write(key, next ?? null))) return undefined
    cache.set(key, next ?? null)
    notify()
    return next ?? null
  })
  chain = run.catch(() => {})
  return run.catch(() => undefined)
}

// ── A mode keeps BOTH a course and its own adventure ─────────────────────────────────────────────────────────
// One map is on screen per mode; the other kind waits PARKED (park-<mode>-course / park-<mode>-adventure), whole,
// with its progress (the owner: leaving career mode for the adventure must not throw the course away).
const parkKey = (modeId, kind) => `park-${keyFor(modeId).slice(4)}-${kind}`
const kindOf = (map) => (isCareerMap(map) ? 'course' : 'adventure')
const parked = new Map() // key -> map | null (last read)
async function readPark(key) {
  const r = await store.read(key)
  if (!r.ok) return { ok: false, value: null }
  const v = r.value == null ? null : shapeMap(r.value)
  if (r.value != null && v == null) return { ok: false, value: null } // newer or damaged: never written over
  parked.set(key, v); notify()
  return { ok: true, value: v }
}
// Park a map in an EMPTY slot (the store writes only a key it has read; a slot already holding a map is never
// overwritten). true = parked.
async function park(key, map) {
  const r = await readPark(key)
  if (!r.ok || r.value) return false
  if (!(await store.write(key, map))) return false
  parked.set(key, map); notify()
  return true
}
// { course, adventure } waiting for a mode (null = none), read once per mode.
export function useParkedMaps(modeId) {
  useSyncExternalStore((fn) => { listeners.add(fn); return () => listeners.delete(fn) }, () => version)
  const kc = parkKey(modeId, 'course'); const ka = parkKey(modeId, 'adventure')
  useEffect(() => { if (!parked.has(kc)) readPark(kc); if (!parked.has(ka)) readPark(ka) }, [kc, ka])
  return { course: parked.get(kc) || null, adventure: parked.get(ka) || null }
}
// Swap the map on screen for the other kind: the shown one is parked FIRST (nothing is lost if a later write fails),
// then the parked one (or none: the start screen) comes back. Resolves true when done.
export function switchMapKind(modeId, to) {
  const key = keyFor(modeId)
  const run = chain.then(async () => {
    const cur = await ensure(key, { fresh: true })
    if (!cur.ok) return false
    if (cur.value && kindOf(cur.value) === to) return true
    const back = await readPark(parkKey(modeId, to))
    if (!back.ok) return false
    if (cur.value && !(await park(parkKey(modeId, kindOf(cur.value)), cur.value))) return false
    if (!(await store.write(key, back.value ?? null))) return false
    cache.set(key, back.value ?? null)
    if (back.value) { await store.write(parkKey(modeId, to), null); parked.set(parkKey(modeId, to), null) }
    notify()
    return true
  })
  chain = run.catch(() => {})
  return run.catch(() => false)
}
// Move a course that sits in the wrong mode (a language mode) to the mode it belongs to: it becomes that mode's map
// (an adventure there is parked, never lost; a course already there wins and this copy is kept parked there), and
// this mode gets its parked adventure back (or the start screen). Resolves true when done.
export function moveCourse(fromId, toId) {
  const from = keyFor(fromId); const to = keyFor(toId)
  const run = chain.then(async () => {
    const src = await ensure(from, { fresh: true })
    if (!src.ok || !isCareerMap(src.value)) return false
    const dst = await ensure(to, { fresh: true })
    if (!dst.ok) return false
    const course = { ...src.value, modeId: toId }
    if (isCareerMap(dst.value)) {
      if (!(await park(parkKey(toId, 'course'), course))) return false
    } else {
      if (dst.value && !(await park(parkKey(toId, 'adventure'), dst.value))) return false
      if (!(await store.write(to, course))) return false
      cache.set(to, course)
    }
    const back = await readPark(parkKey(fromId, 'adventure'))
    const next = back.ok ? back.value : null
    if (!(await store.write(from, next ?? null))) return false
    cache.set(from, next ?? null)
    if (next) await store.write(parkKey(fromId, 'adventure'), null)
    parked.clear(); notify()
    return true
  })
  chain = run.catch(() => {})
  return run.catch(() => false)
}

// ── One-time rewards ────────────────────────────────────────────────────────────────────────────────────────
// Rewards a mode has already paid (the placement exam, each boss's first win), kept OUTSIDE the map: "Start over"
// writes a null map, and a new map used to pay them all again. true = this call claimed it (pay now); false =
// already paid, or the record could not be read or written (pay nothing rather than twice).
const rewardsKey = (modeId) => `rewards-${keyFor(modeId).slice(4)}`
let rewardChain = Promise.resolve()
export const rewardKeyFor = (kind, title = '') => `${kind}:${String(title).toLowerCase().replace(/\s+/g, ' ').trim()}`.slice(0, 120)
export function claimReward(modeId, rewardKey) {
  const key = rewardsKey(modeId)
  const run = rewardChain.then(async () => {
    const r = await store.read(key)
    if (!r.ok) return false
    const paid = Array.isArray(r.value?.paid) ? r.value.paid : []
    if (paid.includes(rewardKey)) return false
    return store.write(key, { paid: [...paid, rewardKey].slice(-500) })
  })
  rewardChain = run.catch(() => {})
  return run.catch(() => false)
}

// { map, loaded, failed, retry } for a mode; loads on first use.
export function useLegendsMap(modeId) {
  const key = keyFor(modeId)
  useSyncExternalStore((fn) => { listeners.add(fn); return () => listeners.delete(fn) }, () => version)
  useEffect(() => { ensure(key) }, [key])
  return { map: cache.get(key) || null, loaded: cache.has(key), failed: failed.has(key), retry: () => ensure(key, { fresh: true }) }
}

// ── Saved step content ──────────────────────────────────────────────────────────────────────────────────────
// A step's questions (or scene) are made ONCE and kept, one file per step (features/legends/step-<hash>.json in the
// data folder, gitignored): every later visit and retry reuses them instead of paying for new ones. `sig` is the
// step's taught content; when "Change my map" rewrites the area, the old set no longer matches and a new one is made.
const hash = fnv
export const stepKey = (modeId, areaId, nodeId) => `step-${hash(`${modeId}|${areaId}|${nodeId}`)}-${hash(`${nodeId}|${areaId}|${modeId}`)}`
export const stepSig = (items) => hash(items.map((it) => `${it.id}\u0001${it.front}\u0001${it.back}`).join('\u0002'))

// { ok, value }: value = the saved content for this sig, or null (none, or made for other items). ok=false: unreadable.
export async function readStep(modeId, areaId, nodeId, sig) {
  const r = await store.read(stepKey(modeId, areaId, nodeId))
  if (!r.ok) return { ok: false, value: null }
  const v = r.value
  return { ok: true, value: v && v.sig === sig && v.data ? v.data : null }
}
// Saved only after a successful read of the same key (featureStore refuses otherwise). Never throws.
export async function saveStep(modeId, areaId, nodeId, sig, kind, data) {
  try { return await store.write(stepKey(modeId, areaId, nodeId), { sig, kind, data, at: Date.now() }) } catch { return false }
}
// Whatever a step has saved, whichever items it was made for (the other steps' questions, to avoid repeating them).
export async function readStepAny(modeId, areaId, nodeId) {
  const r = await store.read(stepKey(modeId, areaId, nodeId))
  return r.ok && r.value?.data ? r.value.data : null
}
// Forget a step's saved content (cheat mode "New questions"): the next visit makes a new set. true when done.
export async function clearStep(modeId, areaId, nodeId) {
  const key = stepKey(modeId, areaId, nodeId)
  const r = await store.read(key)
  return r.ok ? store.write(key, null) : false
}

// ── Raids ───────────────────────────────────────────────────────────────────────────────────────────────────
// One raid state per mode (features/legends/raid-<modeId>.json): the boss in rotation, today's wounds, trophies.
// Read-modify-write, serialized, never after a failed read. Resolves to the saved state, or undefined.
const raidKey = (modeId) => `raid-${String(modeId ?? 'default').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'default'}`
let raidChain = Promise.resolve()
// Told after every saved raid (Help's raid facts re-read: a raid from the Practice tile changes no Legends view).
const raidListeners = new Set()
export const onRaidSaved = (fn) => { raidListeners.add(fn); return () => raidListeners.delete(fn) }
export async function readRaid(modeId) {
  const r = await store.read(raidKey(modeId))
  return r.ok ? { ok: true, value: r.value || null } : { ok: false, value: null }
}
export function updateRaid(modeId, fn) {
  const run = raidChain.then(async () => {
    const r = await store.read(raidKey(modeId))
    if (!r.ok) return undefined
    const next = fn(r.value || null)
    if (!(await store.write(raidKey(modeId), next))) return undefined
    for (const l of raidListeners) { try { l(modeId) } catch { /* a listener's problem */ } }
    return next
  })
  raidChain = run.catch(() => {})
  return run.catch(() => undefined)
}
