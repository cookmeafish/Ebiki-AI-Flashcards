// The learner level's storage: one model per mode in the framework JSON store (features/learner/ in the data
// folder). Legends creates it (placement exam or "I'm new"); every feature may read it and nudge it. Same clobber
// rules as every store: writes are serialized and only follow a successful read.
import { useEffect, useSyncExternalStore } from 'react'
import { featureStore } from '../storage'
import { EVENTS } from '../events'
import { shapeLearner, learnerLine } from './learner'
import { learnerContextText } from './learnerContextUse'

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

// Batches already applied to a level (ids, newest last). A batch a page kept on the device while its write ran can
// be adopted by the next page even though the write landed before the page died: its id here makes the second
// application a no-op. Bounded: a batch is retried within minutes, never after 50 newer ones.
export const APPLIED_BATCHES_MAX = 50
const appliedOf = (raw) => (Array.isArray(raw?.appliedBatches)
  ? raw.appliedBatches.filter((s) => typeof s === 'string' && s).slice(-APPLIED_BATCHES_MAX) : [])
// shapeLearner keeps only the level's own fields; the applied list rides along on the cached and written copies.
const withApplied = (model, applied) => (model && applied.length ? { ...model, appliedBatches: applied } : model)

const configure = (ctx) => { if (ctx?.isDataSwitching) blocked = () => !!ctx.isDataSwitching() }

async function ensure(key, { fresh = false } = {}) {
  if (cache.has(key) && !fresh) return { ok: true, value: cache.get(key) }
  const r = await store.read(key)
  // A plain read that lost a race with a write (or a fresh read): the cached level is newer. Taking this read's copy
  // showed the OLD level after a level up (the rail card, the prompts' level line) until the next write.
  if (!fresh && cache.has(key)) return { ok: true, value: cache.get(key) }
  if (!r.ok) { failed.add(key); notify(); return { ok: false, value: null } }
  failed.delete(key)
  cache.set(key, withApplied(shapeLearner(r.value), appliedOf(r.value)))
  notify()
  return { ok: true, value: cache.get(key) }
}

// { ok, value } for the ACTIVE mode (value null = no level yet).
export async function readLearner(ctx, modeId = ctx?.subject?.modeId) {
  configure(ctx)
  return ensure(keyFor(modeId))
}

// The prompt line for the active mode ('' without a level): "level 47 of 130, B1 (intermediate); weak at: ...".
// `context`: the practice features' one-line hook into the learner context (kit/learnerContextUse.js): the level
// line followed by a short block of what Ebiki knows (remembered snapshot only, never waited for; '' parts drop).
export async function learnerLevelLine(ctx, { context = false } = {}) {
  const r = await readLearner(ctx)
  const line = r.ok && r.value ? learnerLine(r.value, !!ctx?.subject?.isLanguage) : ''
  if (!context) return line
  const block = learnerContextText(ctx, 'practice')
  return block ? `${line || 'not measured yet'}
${block}
(end of what Ebiki knows about the learner)` : line
}

// Apply fn(model | null) → model | null for a mode, persisted. Never writes after a failed read; returning the
// same object (or null) writes nothing. `modeId` is pinned by the caller when the work STARTED.
// `quiet`: no LEVEL_UP event (Legends cheat mode sets a level without earning its rewards).
// `batchId`: a batch applied at most once (recorded in the level's `appliedBatches`; a second time writes nothing
// and answers true). Every write keeps the list, whoever writes.
export function updateLearner(ctx, modeId, fn, { quiet = false, batchId = '' } = {}) {
  configure(ctx)
  const key = keyFor(modeId)
  chain = chain.then(async () => {
    // Read again before every write: on a shared data folder another computer may have saved a level since this page
    // loaded (a graded card here wrote level 10 over the other computer's placement result of 60).
    const r = await ensure(key, { fresh: true })
    if (!r.ok) return false
    const applied = appliedOf(r.value)
    if (batchId && applied.includes(batchId)) return true
    let next = fn(r.value)
    if (!next || next === r.value) return true
    next = withApplied({ ...next }, batchId ? [...applied, String(batchId)].slice(-APPLIED_BATCHES_MAX) : applied)
    // Shown only once saved: a refused write (folder switching, share down) must not show a level that is not stored.
    if (!(await store.write(key, next))) return false
    cache.set(key, next)
    notify()
    // A NEW whole level (above the best ever reached) is a fact other features reward (the game pays XP for it).
    // Falling back and climbing again pays nothing; a first level neither (the placement exam has its own reward).
    const best = r.value ? Math.max(r.value.peak ?? r.value.level, r.value.level) : null
    if (!quiet && best != null && Math.floor(next.level) > Math.floor(best)) ctx?.emit?.(EVENTS.LEVEL_UP, { mode: modeId, from: best, to: next.level })
    return true
  }).catch(() => false)
  return chain // resolves true when stored (or nothing to store), false when not
}

// { model, failed } for a mode; loads on first use.
export function useLearner(modeId) {
  const key = keyFor(modeId)
  useSyncExternalStore((fn) => { listeners.add(fn); return () => listeners.delete(fn) }, () => version)
  useEffect(() => { ensure(key) }, [key])
  return { model: cache.get(key) || null, loaded: cache.has(key), failed: failed.has(key) }
}
