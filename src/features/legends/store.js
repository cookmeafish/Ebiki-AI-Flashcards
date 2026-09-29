// Per-mode Legends maps in the framework JSON store (data folder: features/legends/map-<modeId>.json).
// Writes are serialized and only follow a successful read of the same map (never a blind overwrite), and
// every async writer names the mode it STARTED for (a mode switch mid-generation must not file its result
// under the new mode).
import { useEffect, useSyncExternalStore } from 'react'
import { featureStore } from '../storage'
import { shapeMap } from './map'

export const LEGENDS_ID = 'legends'

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
  failed.delete(key)
  cache.set(key, shapeMap(r.value))
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
    const r = await ensure(key)
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
const hash = (s) => { let h = 0x811c9dc5; for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0 } return h.toString(36) }
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
