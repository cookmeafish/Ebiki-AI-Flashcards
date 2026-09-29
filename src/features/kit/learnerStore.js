// The learner level's storage: one model per mode in the framework JSON store (features/learner/ in the data
// folder). Legends creates it (placement exam or "I'm new"); every feature may read it and nudge it. Same clobber
// rules as every store: writes are serialized and only follow a successful read.
import { useEffect, useSyncExternalStore } from 'react'
import { featureStore } from '../storage'
import { EVENTS } from '../events'
import { shapeLearner, learnerLine } from './learner'

export const LEARNER_ID = 'learner'

let blocked = () => false
const store = featureStore(LEARNER_ID, { isBlocked: () => blocked() })
const keyFor = (modeId) => `level-${String(modeId ?? 'default').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'default'}`
const cache = new Map()   // key -> model | null (read OK, nothing saved)
const failed = new Set()
const listeners = new Set()
let version = 0
const notify = () => { version++; for (const l of listeners) l() }
let chain = Promise.resolve()

const configure = (ctx) => { if (ctx?.isDataSwitching) blocked = () => !!ctx.isDataSwitching() }

async function ensure(key) {
  if (cache.has(key)) return { ok: true, value: cache.get(key) }
  const r = await store.read(key)
  if (!r.ok) { failed.add(key); notify(); return { ok: false, value: null } }
  failed.delete(key)
  cache.set(key, shapeLearner(r.value))
  notify()
  return { ok: true, value: cache.get(key) }
}

// { ok, value } for the ACTIVE mode (value null = no level yet).
export async function readLearner(ctx, modeId = ctx?.subject?.modeId) {
  configure(ctx)
  return ensure(keyFor(modeId))
}

// The prompt line for the active mode ('' without a level): "level 47 of 130, B1 (intermediate); weak at: ...".
export async function learnerLevelLine(ctx) {
  const r = await readLearner(ctx)
  return r.ok && r.value ? learnerLine(r.value, !!ctx?.subject?.isLanguage) : ''
}

// Apply fn(model | null) → model | null for a mode, persisted. Never writes after a failed read; returning the
// same object (or null) writes nothing. `modeId` is pinned by the caller when the work STARTED.
// `quiet`: no LEVEL_UP event (Legends cheat mode sets a level without earning its rewards).
export function updateLearner(ctx, modeId, fn, { quiet = false } = {}) {
  configure(ctx)
  const key = keyFor(modeId)
  chain = chain.then(async () => {
    const r = await ensure(key)
    if (!r.ok) return
    const next = fn(r.value)
    if (!next || next === r.value) return
    cache.set(key, next)
    notify()
    if (!(await store.write(key, next))) return
    // A NEW whole level (above the best ever reached) is a fact other features reward (the game pays XP for it).
    // Falling back and climbing again pays nothing; a first level neither (the placement exam has its own reward).
    const best = r.value ? Math.max(r.value.peak ?? r.value.level, r.value.level) : null
    if (!quiet && best != null && Math.floor(next.level) > Math.floor(best)) ctx?.emit?.(EVENTS.LEVEL_UP, { mode: modeId, from: best, to: next.level })
  }).catch(() => {})
  return chain
}

// { model, failed } for a mode; loads on first use.
export function useLearner(modeId) {
  const key = keyFor(modeId)
  useSyncExternalStore((fn) => { listeners.add(fn); return () => listeners.delete(fn) }, () => version)
  useEffect(() => { ensure(key) }, [key])
  return { model: cache.get(key) || null, loaded: cache.has(key), failed: failed.has(key) }
}
