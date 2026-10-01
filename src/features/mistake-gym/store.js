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
const unsaved = new Set()     // keys whose last write failed

// `fresh`: read again before a write (another computer on a shared folder may have added mistakes since).
async function ensure(key, { fresh = false } = {}) {
  if (cache.has(key) && !fresh) return cache.get(key)
  const r = await store.read(key)
  if (!r.ok) { failed.add(key); notify(); return null }
  failed.delete(key)
  cache.set(key, r.value && Array.isArray(r.value.items) ? r.value : emptyList())
  notify()
  return cache.get(key)
}

export function loadMistakes(modeId) { return ensure(keyFor(modeId)) }

// Apply fn(list) → list for a mode, persisted. Serialized so two quick events never race.
const unsavedOps = new Map() // key -> changes not saved yet (re-applied over the next fresh read)
export function updateMistakes(modeId, fn) {
  const key = keyFor(modeId)
  chain = chain.then(async () => {
    // Always a FRESH read (another computer on a shared folder may have saved since), then every change that has not
    // been saved yet is applied on top: building on the cached list after a failed write erased that computer's items.
    const ops = [...(unsavedOps.get(key) || []), fn]
    unsavedOps.set(key, ops)
    const list = await ensure(key, { fresh: true })
    if (!list) return // unreadable: never write (the change waits for the next one)
    const next = ops.reduce((l, op) => op(l), list)
    cache.set(key, next)
    notify()
    if (await store.write(key, next)) { unsavedOps.delete(key); unsaved.delete(key) } else unsaved.add(key)
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
