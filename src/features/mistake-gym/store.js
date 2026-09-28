// Per-mode mistake lists, kept in the framework JSON store (data folder: features/mistake-gym/).
// Writes are serialized and only follow a successful read of the same list (never a blind overwrite).
import { useEffect, useSyncExternalStore } from 'react'
import { featureStore } from '../storage'
import { emptyList } from './mistakes'

export const GYM_FEATURE_ID = 'mistake-gym'

let blocked = () => false
export const configureGym = ({ isBlocked }) => { if (typeof isBlocked === 'function') blocked = isBlocked }
const store = featureStore(GYM_FEATURE_ID, { isBlocked: () => blocked() })

const keyFor = (modeId) => `mistakes-${String(modeId ?? 'default').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'default'}`
const cache = new Map()      // key -> list (only lists that were read successfully)
const failed = new Set()     // keys whose last read failed
const listeners = new Set()
let version = 0
const notify = () => { version++; for (const l of listeners) l() }
let chain = Promise.resolve()

async function ensure(key) {
  if (cache.has(key)) return cache.get(key)
  const r = await store.read(key)
  if (!r.ok) { failed.add(key); notify(); return null }
  failed.delete(key)
  cache.set(key, r.value && Array.isArray(r.value.items) ? r.value : emptyList())
  notify()
  return cache.get(key)
}

export function loadMistakes(modeId) { return ensure(keyFor(modeId)) }

// Apply fn(list) → list for a mode, persisted. Serialized so two quick events never race.
export function updateMistakes(modeId, fn) {
  const key = keyFor(modeId)
  chain = chain.then(async () => {
    const list = await ensure(key)
    if (!list) return // unreadable: never write
    const next = fn(list)
    cache.set(key, next)
    notify()
    await store.write(key, next)
  }).catch(() => {})
  return chain
}

// { list, failed } for a mode; loads on first use.
export function useMistakes(modeId) {
  const key = keyFor(modeId)
  useSyncExternalStore((fn) => { listeners.add(fn); return () => listeners.delete(fn) }, () => version)
  useEffect(() => { ensure(key) }, [key])
  return { list: cache.get(key) || null, failed: failed.has(key) }
}
