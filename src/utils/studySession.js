// Study session staleness (pure, platform-neutral; tests in studySession.test.js).
//
// A saved or live study session that nobody touched for STUDY_SESSION_MAX_AGE_MS is ABANDONED. The clock is the
// learner's last PROGRESS (`activeAt`), never the last snapshot save: the restore itself (sanitizing, the mode
// check, re-grades) saves the snapshot, so a `savedAt` clock was refreshed on every launch and a session left weeks
// ago never expired (it kept blocking raids and Ebi Call with "finish your study session first").

export const STUDY_SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000

// What the learner DID: per card its progress (done, rating, ease, question reached, answers given) and how many
// reviews reached Anki. Nothing the restore or sanitize pass changes (gradedAt, mnemonicLoading, pendingRest,
// the `synced` display flag, the cursor over unstarted cards).
export function activitySignature({ studyCardState, syncedIds } = {}) {
  const cards = Array.isArray(studyCardState) ? studyCardState : []
  const parts = cards.map((cs) => {
    if (!cs || typeof cs !== 'object') return '-'
    const answers = Array.isArray(cs.answers) ? cs.answers.length : 0
    return [cs.cardId ?? '', cs.done ? 1 : 0, cs.rating || '', cs.ease || 0, Number(cs.questionIdx) || 0, answers].join(':')
  })
  const synced = syncedIds && typeof syncedIds.size === 'number' ? syncedIds.size : Array.isArray(syncedIds) ? syncedIds.length : 0
  return `${parts.join('|')}#${synced}`
}

// When the learner last made progress in a stored snapshot (older snapshots only have savedAt).
export function lastActiveAt(snapshot) {
  const at = Number(snapshot?.activeAt ?? snapshot?.savedAt)
  return Number.isFinite(at) && at > 0 ? at : 0
}

// A snapshot (or a live session's { activeAt }) with no progress for maxAgeMs. No timestamp at all = abandoned. So is
// progress stamped more than maxAgeMs in the FUTURE: the clock was moved back since (or was set ahead then), and the
// session never expired until the real clock caught up with the stamp.
export function isAbandoned(snapshot, now = Date.now(), maxAgeMs = STUDY_SESSION_MAX_AGE_MS) {
  const at = lastActiveAt(snapshot)
  return !at || now - at > maxAgeMs || at - now > maxAgeMs
}

// Rated cards (or cards whose grade is still owed) that Anki has not received, counted in a stored snapshot.
export function unsyncedInSnapshot(snapshot) {
  const done = new Set(Array.isArray(snapshot?.syncedIds) ? snapshot.syncedIds : [])
  const cards = Array.isArray(snapshot?.studyCardState) ? snapshot.studyCardState : []
  return cards.filter((cs) => cs && cs.done && (cs.ease || ((cs.evaluating || cs.gradeFailed) && !cs.isConjugation && cs.rating !== 'deleted'))
    && !cs.noSync && !cs.synced && cs.cardId && !done.has(cs.cardId)).length
}

// Rated cards of a LIVE session that still need to reach Anki (the same rule exitStudy flushes by).
export function pendingRatings(studyCardState, syncedIds) {
  const has = (id) => (syncedIds && typeof syncedIds.has === 'function' ? syncedIds.has(id) : false)
  return (Array.isArray(studyCardState) ? studyCardState : []).filter((cs) => cs && cs.done && cs.ease && cs.rating !== 'deleted'
    && !cs.synced && !cs.isConjugation && !cs.noSync && !has(cs.cardId))
}

// Did the learner do anything in it (worth telling them it was closed)?
export function hadProgress(studyCardState) {
  return (Array.isArray(studyCardState) ? studyCardState : []).some((cs) => cs && (cs.done || (Array.isArray(cs.answers) && cs.answers.length > 0)))
}
