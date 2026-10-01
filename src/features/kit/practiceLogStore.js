// The practice log's storage: one list per mode in the framework JSON store (features/practice-log/ in the
// data folder). Same clobber rules as every store: writes are serialized and only follow a successful read.
import { featureStore } from '../storage'
import { emptyLog, logPractice } from './practiceLog'

export const PRACTICE_LOG_ID = 'practice-log'

let blocked = () => false
const store = featureStore(PRACTICE_LOG_ID, { isBlocked: () => blocked() })
const keyFor = (modeId) => `log-${String(modeId ?? 'default').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'default'}`
const cache = new Map()
let chain = Promise.resolve()
const unsaved = new Set() // keys whose last write failed

const configure = (ctx) => { if (ctx?.isDataSwitching) blocked = () => !!ctx.isDataSwitching() }

// `fresh`: read again before a write (another computer on a shared folder may have added entries since).
async function ensure(key, { fresh = false } = {}) {
  if (cache.has(key) && !fresh) return cache.get(key)
  const r = await store.read(key)
  if (!r.ok) return null
  cache.set(key, r.value && Array.isArray(r.value.items) ? r.value : emptyLog())
  return cache.get(key)
}

// The mode's log, or an empty one when it can't be read (reading never blocks an activity).
export async function readPracticeLog(ctx) {
  configure(ctx)
  return (await ensure(keyFor(ctx?.subject?.modeId))) || emptyLog()
}

// Record what an activity practiced: entries [{ kind: 'card'|'topic', label }], tagged with `src`.
const unsavedLogs = new Map() // key -> entry batches not saved yet
export function recordPractice(ctx, src, entries) {
  configure(ctx)
  const key = keyFor(ctx?.subject?.modeId)
  const list = (entries || []).filter((e) => e?.label).map((e) => ({ ...e, src }))
  if (!list.length) return chain
  chain = chain.then(async () => {
    // Always a FRESH read (another computer may have logged since), then every entry not saved yet on top: building on
    // the cached log after a failed write erased the other computer's entries.
    const batches = [...(unsavedLogs.get(key) || []), list]
    unsavedLogs.set(key, batches)
    const log = await ensure(key, { fresh: true })
    if (!log) return // unreadable: never write (the entries wait for the next record)
    const next = batches.reduce((l, b) => logPractice(l, b), log)
    cache.set(key, next)
    if (await store.write(key, next)) { unsavedLogs.delete(key); unsaved.delete(key) } else unsaved.add(key)
  }).catch(() => {})
  return chain
}
