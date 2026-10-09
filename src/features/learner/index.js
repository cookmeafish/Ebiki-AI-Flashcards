// LEARNER LEVEL for every learner, not only those who open Legends. The level itself lives in the kit
// (kit/learner.js pure, kit/learnerStore.js storage) so any feature reads it; this feature MOVES it:
//   - finished activities and graded study cards nudge an existing level (study cards in one batch per session
//     burst, not a store write per card);
//   - a mode with NO level gets one from what Ebiki has already seen (the app-wide learner context: the mode deck's
//     studied and new cards, study sessions, slips, chats, Discover, practice: kit/evidenceJudge.js) once there is
//     enough of it. One background AI call, at most once per mode per app
//     session, only for the ACTIVE mode. Legends' placement exam or "Use what Ebiki knows" replaces it any time.
// Remove this folder and its line in ../index.js to drop it: levels then only come from Legends.
import { EVENTS } from '../events'
import { readLearner, updateLearner } from '../kit/learnerStore'
import { applyLearnerDelta, deltaFor, newLearner } from '../kit/learner'
import { judgeLevelFromEvidence } from '../kit/evidenceJudge'
import { platform } from '../../platform'
import LearnerMount from './Mount'

export const LEARNER_FEATURE_ID = 'learner-level'
// Which finished practice session counts as which kind of evidence (kit/learner.js STEP). Legends applies its own.
const STEP_OF = { 'mistake-gym': 'gym', roleplay: 'roleplay', 'ebi-call': 'call' }
const SKIP_SOURCES = /^legends/ // Legends steps, raids, blitz and placement update the level themselves
const STUDY_FLUSH_MS = 20000    // graded study cards are added up and applied once things go quiet
const STUDY_FLUSH_MAX = 25      // ... or once this many have piled up

const pending = new Map()       // modeId -> { total, correct } (not sent yet, no id yet)
// Batches being written or waiting for a retry, each with its OWN id. With pending, kept on this device
// (PENDING_KEY) until stored: the emitted cards are never emitted again (emitOnce), so closing Ebiki within the
// quiet window lost the whole session's level change. The id goes into the level record when the write lands
// (learnerStore `batchId`), so a batch whose write landed just before the page died, then adopted by the next
// page, is applied once, not twice.
const batches = new Map()       // id -> { id, modeId, total, correct, sending }
const PENDING_KEY = 'ebiki-learner-pending'
// The key is shared by every Ebiki tab (browser mode opens one per shortcut click): each page writes only ITS OWN
// entries (owner + seenAt), and adopts another page's only once that page has been silent for ADOPT_AFTER_MS (it
// closed). Copying a live tab's entries counted that session twice; rewriting the key from one tab's memory erased
// the other's.
const PAGE_ID = platform.randomId()
const ADOPT_AFTER_MS = 60000
let batchSeq = 0
const newBatchId = () => `${PAGE_ID}-${++batchSeq}`
function readStored() { const v = platform.kv.getJson(PENDING_KEY, []); return Array.isArray(v) ? v : [] }
function persistPending() {
  const now = Date.now()
  const mine = []
  for (const [modeId, p] of pending) mine.push({ owner: PAGE_ID, seenAt: now, modeId, total: p.total, correct: p.correct })
  for (const b of batches.values()) mine.push({ owner: PAGE_ID, seenAt: now, id: b.id, modeId: b.modeId, total: b.total, correct: b.correct })
  const out = [...readStored().filter((b) => b && b.owner !== PAGE_ID), ...mine]
  if (out.length) platform.kv.setJson(PENDING_KEY, out); else platform.kv.remove(PENDING_KEY)
}
// What a closed page left unsaved joins this page: a batch it had SENT keeps its id (its write may have landed),
// counts it never sent join this page's next batch.
function adoptAbandoned() {
  const now = Date.now()
  const stored = readStored()
  const keep = []
  let took = false
  for (const b of stored) {
    // Counts as numbers: a "3" from a hand-edited or older copy joined as text ("0" + "3" + ...).
    const total = Math.floor(Number(b?.total)) || 0
    if (!b || b.modeId == null || !(total > 0)) continue
    if (b.owner === PAGE_ID || (b.owner && now - (Number(b.seenAt) || 0) < ADOPT_AFTER_MS)) { keep.push(b); continue }
    const correct = Math.max(0, Math.min(Math.floor(Number(b.correct)) || 0, total))
    took = true
    if (typeof b.id === 'string' && b.id) {
      if (!batches.has(b.id)) batches.set(b.id, { id: b.id, modeId: b.modeId, total, correct, sending: false })
      continue
    }
    const p = pending.get(b.modeId) || { total: 0, correct: 0 }
    p.total += total; p.correct += correct
    pending.set(b.modeId, p)
  }
  if (took) { if (keep.length) platform.kv.setJson(PENDING_KEY, keep); else platform.kv.remove(PENDING_KEY); persistPending() }
}
adoptAbandoned()
let flushTimer = null
let lastCtx = null
// The feature context is a new object per App render, so one held by a timer is a snapshot: after a mode switch its
// subject still named the OLD mode, and the batch flush 20s later seeded that (no longer active) mode. The Mount keeps
// the newest one here; every "is it still the active mode?" check reads it.
let liveCtx = null
export function setLiveCtx(ctx) { if (ctx) liveCtx = ctx }
const currentCtx = () => liveCtx || lastCtx
const activeModeId = () => currentCtx()?.subject?.modeId
const seedTried = new Set()     // modes whose level was already read from evidence this app session

function nudge(ctx, modeId, source, total, correct, { gaps = [], strengths = [] } = {}) {
  const d = deltaFor(source, total, correct)
  if (!d || modeId == null) return
  // Only an EXISTING level moves; a missing one is seeded from evidence instead (below).
  updateLearner(ctx, modeId, (m) => (m ? applyLearnerDelta(m, d, source, { gaps, strengths }) : m))
}

// A mode with no level and enough evidence gets one, quietly (no LEVEL_UP reward for a first level).
async function maybeSeed(ctxIn, modeId) {
  const ctx = currentCtx() || ctxIn
  if (!ctx || modeId == null || seedTried.has(modeId) || activeModeId() !== modeId || !ctx.ai?.hasKey) return
  if (ctx.isDataSwitching?.()) return
  seedTried.add(modeId) // claimed before any await: two triggers at once read and paid twice
  const cur = await readLearner(ctx, modeId)
  if (!cur.ok) { seedTried.delete(modeId); return }
  if (cur.value) return
  // The shared learner context (cached a minute): deck cards with their stats and new cards, study sessions, chats...
  const r = await judgeLevelFromEvidence(ctx, { fresh: false })
  if (r.error) { if (r.error === 'thin' || r.error === 'read') seedTried.delete(modeId); return } // try again after more study
  if (activeModeId() !== modeId) { seedTried.delete(modeId); return } // switched away mid-judge: try when it is active again
  await updateLearner(ctx, modeId, (m) => m || newLearner({ level: r.level, confidence: r.confidence, strengths: r.strengths, gaps: r.gaps, source: 'evidence' }), { quiet: true })
}

function sendBatch(ctx, b) {
  // Each card's own nudge, summed, then ONE write: deltaFor weighs a batch by sqrt(n), so a 25-card burst moved
  // the level a fifth as much as the same cards one by one, and fast and slow learners moved differently.
  const d = deltaFor('study', 1, 1) * b.correct + deltaFor('study', 1, 0) * (b.total - b.correct)
  if (!d) { batches.delete(b.id); return }
  b.sending = true
  updateLearner(ctx, b.modeId, (m) => (m ? applyLearnerDelta(m, d, 'study') : m), { batchId: b.id }).then((ok) => {
    b.sending = false
    // A refused write (share down, folder switching) is tried again with the SAME id while the page lives (kept
    // as this page's own entry it was never tried again; only another page adopted it, after close). The id makes
    // a write that landed despite the refusal count once.
    if (ok) batches.delete(b.id)
    else if (!flushTimer) flushTimer = setTimeout(flushStudy, STUDY_FLUSH_MS)
    persistPending()
  })
}

function flushStudy() {
  clearTimeout(flushTimer); flushTimer = null
  const ctx = currentCtx()
  if (!ctx) return
  adoptAbandoned()
  const seen = new Set()
  for (const [modeId, p] of pending) {
    pending.delete(modeId)
    if (modeId == null) continue
    const id = newBatchId()
    batches.set(id, { id, modeId, total: p.total, correct: p.correct, sending: false })
    seen.add(modeId)
  }
  for (const b of [...batches.values()]) {
    if (b.sending) continue
    sendBatch(ctx, b)
    seen.add(b.modeId)
  }
  for (const modeId of seen) maybeSeed(ctx, modeId).catch(() => {})
  persistPending()
}
// Leaving the app: apply what has piled up now instead of after the quiet window (kept on the device if it fails).
platform.onPageHide(() => { if (pending.size || [...batches.values()].some((b) => !b.sending)) flushStudy() })

// The active mode, once Anki answers (the Mount): a learner who only reviews in Anki gets a level too.
export function seedActiveMode(ctx) {
  lastCtx = ctx || lastCtx
  adoptAbandoned()
  if ((pending.size || batches.size) && !flushTimer) flushTimer = setTimeout(flushStudy, STUDY_FLUSH_MS)
  maybeSeed(ctx, ctx?.subject?.modeId).catch(() => {})
}

export default {
  id: LEARNER_FEATURE_ID,
  Mount: LearnerMount,
  on: {
    [EVENTS.CARD_GRADED]: ({ correct, mode }, ctx) => {
      if (mode == null) return
      lastCtx = ctx
      const p = pending.get(mode) || { total: 0, correct: 0 }
      p.total++; if (correct) p.correct++
      pending.set(mode, p)
      persistPending()
      clearTimeout(flushTimer)
      if (p.total >= STUDY_FLUSH_MAX) flushStudy()
      else flushTimer = setTimeout(flushStudy, STUDY_FLUSH_MS)
    },
    [EVENTS.PRACTICE_DONE]: ({ source, mode, total, correct, gaps, strengths }, ctx) => {
      lastCtx = ctx || lastCtx
      if ((pending.size || batches.size) && !flushTimer) flushTimer = setTimeout(flushStudy, STUDY_FLUSH_MS) // a previous run's leftovers
      if (SKIP_SOURCES.test(String(source || ''))) return
      nudge(ctx, mode, STEP_OF[source] || 'practice', total, correct, { gaps, strengths })
      maybeSeed(ctx, mode).catch(() => {})
    },
  },
}
