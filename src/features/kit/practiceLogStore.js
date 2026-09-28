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

const configure = (ctx) => { if (ctx?.isDataSwitching) blocked = () => !!ctx.isDataSwitching() }

async function ensure(key) {
  if (cache.has(key)) return cache.get(key)
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
export function recordPractice(ctx, src, entries) {
  configure(ctx)
  const key = keyFor(ctx?.subject?.modeId)
  const list = (entries || []).filter((e) => e?.label).map((e) => ({ ...e, src }))
  if (!list.length) return chain
  chain = chain.then(async () => {
    const log = await ensure(key)
    if (!log) return // unreadable: never write
    const next = logPractice(log, list)
    cache.set(key, next)
    await store.write(key, next)
  }).catch(() => {})
  return chain
}
