// Model version parsing + comparison.
//
// The app used to only recover from RETIRED models (a 404 on a dead id). That meant a
// still-working-but-outdated default (e.g. claude-opus-4-8 long after claude-opus-5 shipped)
// never moved, because nothing ever errored. This module supplies the missing half: given the
// provider's live model list, work out whether something strictly NEWER exists in the same
// family as what we're running.
//
// "Same family" is deliberate. Newest-first list order alone is not enough — a provider can ship
// a small/cheap model after a flagship, and blindly taking the newest id would quietly downgrade
// the Max tier. Comparing within a family (opus→opus, sonnet→sonnet) keeps the tier intact.

// Aliases and pre-release builds we never auto-adopt: "-latest" pointers move under us, and
// preview/experimental builds are not something to silently switch a user onto.
const PRERELEASE = /(preview|experimental|nightly|alpha|beta|snapshot|latest|-exp\b|\bexp-)/i

/**
 * Split a model id into a comparable { family, version[], date }.
 *
 * Segments are classified rather than positionally parsed, so families that put the version
 * before the name (claude-3-5-sonnet) and after it (claude-sonnet-4-6) land in the same family.
 *
 *   claude-opus-4-8            → { family: 'claude-opus',  version: [4, 8], date: null }
 *   claude-opus-5              → { family: 'claude-opus',  version: [5],    date: null }
 *   claude-haiku-4-5-20251001  → { family: 'claude-haiku', version: [4, 5], date: 20251001 }
 *   claude-3-5-sonnet-20241022 → { family: 'claude-sonnet',version: [3, 5], date: 20241022 }
 *   gpt-4o-mini                → { family: 'gpt-o-mini',   version: [4],    date: null }
 *   o3-mini                    → { family: 'o-mini',       version: [3],    date: null }
 *   gemini-2.5-pro             → { family: 'gemini-pro',   version: [2, 5], date: null }
 *
 * Returns null for anything unparseable, which callers treat as "leave it alone".
 */
export function parseModelId(id) {
  if (typeof id !== 'string' || !id.trim()) return null
  const raw = id.trim()
  // Gemini's REST list returns "models/gemini-2.5-pro"; compare on the bare id.
  const bare = raw.replace(/^models\//, '').toLowerCase()

  const words = []
  const version = []
  let date = null

  for (const seg of bare.split(/[-_.]/)) {
    if (!seg) continue
    // 8-digit snapshot date (20251001) — a tiebreak, never a version component.
    if (/^\d{8}$/.test(seg)) { date = Number(seg); continue }
    if (/^\d+$/.test(seg)) { version.push(Number(seg)); continue }
    // "4o" → version 4, family word "o"
    const digitFirst = /^(\d+)([a-z]+)$/.exec(seg)
    if (digitFirst) { version.push(Number(digitFirst[1])); words.push(digitFirst[2]); continue }
    // "o3" → family word "o", version 3
    const letterFirst = /^([a-z]+)(\d+)$/.exec(seg)
    if (letterFirst) { words.push(letterFirst[1]); version.push(Number(letterFirst[2])); continue }
    words.push(seg)
  }

  if (!words.length) return null
  return { id: raw, family: words.join('-'), version, date }
}

/**
 * Order two models by version. Returns -1 (a older), 0 (same), 1 (a newer).
 *
 * Version arrays compare left-to-right with missing components as 0, so [5] beats [4, 8] —
 * claude-opus-5 is correctly newer than claude-opus-4-8.
 *
 * The date is only a tiebreak when BOTH ids carry one. Otherwise a dateless alias
 * (claude-haiku-4-5) and its dated snapshot (claude-haiku-4-5-20251001) compare equal, so we
 * never nag a user to move from a stable alias onto a pinned snapshot of the same model.
 */
export function compareModels(a, b) {
  const pa = typeof a === 'string' ? parseModelId(a) : a
  const pb = typeof b === 'string' ? parseModelId(b) : b
  if (!pa || !pb) return 0

  const n = Math.max(pa.version.length, pb.version.length)
  for (let i = 0; i < n; i++) {
    const x = pa.version[i] ?? 0
    const y = pb.version[i] ?? 0
    if (x !== y) return x < y ? -1 : 1
  }
  if (pa.date != null && pb.date != null && pa.date !== pb.date) return pa.date < pb.date ? -1 : 1
  return 0
}

/**
 * Find a strictly newer model in the same family as `currentId`.
 *
 * `rejectedId` is the last model the user declined for this slot. Anything at or below it is
 * skipped, so a "No" is remembered — but a release newer than the rejected one still surfaces,
 * which is the whole point of storing the id rather than a boolean.
 *
 * Returns the winning model id, or null when we're already current.
 */
export function pickUpgrade(currentId, availableIds, rejectedId = null) {
  const cur = parseModelId(currentId)
  if (!cur || !Array.isArray(availableIds)) return null

  let best = null
  for (const id of availableIds) {
    if (typeof id !== 'string' || PRERELEASE.test(id)) continue
    const p = parseModelId(id)
    if (!p || p.family !== cur.family) continue
    if (compareModels(p, cur) <= 0) continue
    if (rejectedId && compareModels(p, rejectedId) <= 0) continue
    if (!best || compareModels(p, best) > 0) best = p
  }
  return best ? best.id : null
}

/**
 * Newest model in the same family, ignoring any prior rejection.
 *
 * Used at onboarding: a brand-new user has no history to respect and no basis to judge a
 * version prompt, so we silently start them on the current model instead of asking.
 */
export function pickNewest(currentId, availableIds) {
  return pickUpgrade(currentId, availableIds, null)
}
