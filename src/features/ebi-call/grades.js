// Ebi Call grading, pure and tested. Every reply of Ebi's carries a hidden block grading only what the
// learner's LAST message attempted: <grades>[{"id": "...", "verdict": "good"|"hard"|"again", "why": "..."}]</grades>
// The FIRST verdict a target gets is the one that counts (like a real first try), and only targets that were
// actually attempted are ever recorded in the review schedule.
export const VERDICTS = ['good', 'hard', 'again']
export const EASE = { again: 1, hard: 2, good: 3 }          // Anki ease buttons (no "easy" from a conversation)
export const CALL_CARDS = 6                                  // due cards woven into one call
const GRADES_RE = /<grades>([\s\S]*?)<\/grades>/i

// Split a reply into what Ebi says and the hidden grades (ids restricted to the call's targets).
export function splitReply(text, targetIds, parseJson) {
  const s = String(text || '')
  const m = s.match(GRADES_RE)
  const say = s.replace(GRADES_RE, '').replace(/<grades>[\s\S]*$/i, '').trim() // an unclosed block is hidden too
  const known = new Set((targetIds || []).map(String))
  let grades = []
  if (m) {
    let arr = null
    try { arr = (parseJson || JSON.parse)(m[1]) } catch { arr = null }
    // One attempted card comes back as a lone object, and "Good" as often as "good": both were dropped (never graded).
    if (arr && !Array.isArray(arr) && typeof arr === 'object') arr = [arr]
    if (Array.isArray(arr)) {
      const v = (g) => String(g?.verdict ?? '').trim().toLowerCase()
      grades = arr.filter((g) => g && known.has(String(g.id)) && VERDICTS.includes(v(g)))
        .map((g) => ({ id: String(g.id), verdict: v(g), why: String(g.why || '').trim() }))
    }
  }
  return { say, grades }
}

// Fold new grades into the call state: the first verdict per target sticks.
export function applyGrades(state, grades, now = Date.now()) {
  const next = { ...state }
  const fresh = []
  for (const g of grades || []) {
    if (next[g.id]) continue
    next[g.id] = { verdict: g.verdict, why: g.why, at: now }
    fresh.push(g)
  }
  return { state: next, fresh }
}

// Ratings to record: [{ cardId, ease, rating, front }] for graded targets only.
export function ratingsFrom(targets, state) {
  return (targets || []).filter((tg) => state[String(tg.cardId)]).map((tg) => {
    const v = state[String(tg.cardId)].verdict
    return { cardId: tg.cardId, ease: EASE[v], rating: v, front: tg.front }
  })
}
