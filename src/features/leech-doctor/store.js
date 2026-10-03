// The per-mode list of TREATED cards, in the framework JSON store (data folder: features/leech-doctor/).
// Writes are serialized, always follow a FRESH read (another computer on a shared folder may have treated cards since)
// and never follow a failed one.
import { featureStore } from '../storage'
import { shapeTreated, markTreated } from './leeches'

export const DOCTOR_FEATURE_ID = 'leech-doctor'

let blocked = () => false
const store = featureStore(DOCTOR_FEATURE_ID, { isBlocked: () => blocked() })
const configure = (ctx) => { if (ctx?.isDataSwitching) blocked = () => !!ctx.isDataSwitching() }
const keyFor = (modeId) => `treated-${String(modeId ?? 'default').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'default'}`
let chain = Promise.resolve()

// { ok, value } (value shaped; ok false = unreadable: nothing is hidden then).
export async function readTreated(ctx, modeId) {
  configure(ctx)
  const r = await store.read(keyFor(modeId))
  return r.ok ? { ok: true, value: shapeTreated(r.value) } : { ok: false, value: shapeTreated(null) }
}

// Record a fixed card (its lapse count now). Resolves true when saved.
export function saveTreated(ctx, modeId, noteId, lapses) {
  configure(ctx)
  const key = keyFor(modeId)
  const run = chain.then(async () => {
    const r = await store.read(key)
    if (!r.ok) return false
    return store.write(key, markTreated(r.value, noteId, lapses))
  }).catch(() => false)
  chain = run
  return run
}
