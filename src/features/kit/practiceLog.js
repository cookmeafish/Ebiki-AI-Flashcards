// PRACTICE LOG (pure, tested): what was practiced where, per mode, so one activity doesn't drill the card or
// topic another activity (or itself) just did. Entries are cards (keyed by their front) and topics (a gym
// diagnosis, a roleplay scene, a story theme). Study reviews are NOT filtered by this: Anki's schedule decides
// those, and skipping a due review would break the spacing.
export const LOG_MAX = 400
export const COOLDOWN_MS = 2 * 24 * 60 * 60 * 1000   // a card practiced in the last 2 days waits
export const TOPIC_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000
export const AVOID_TOPICS = 12                         // recent topics named in prompts

export const foldKey = (s) => String(s || '').toLowerCase().normalize('NFC').replace(/<[^>]*>/g, ' ').replace(/[\s.,;:!?¡¿"'`()[\]]+/g, ' ').trim().slice(0, 120)
export const emptyLog = () => ({ items: [] })

// entries: [{ kind: 'card'|'topic', label, src }]. Repeats bump n/at; newest first, capped.
export function logPractice(log, entries, now = Date.now()) {
  const items = [...(log?.items || [])]
  for (const e of entries || []) {
    const kind = e?.kind === 'topic' ? 'topic' : 'card'
    const key = foldKey(e?.label)
    if (!key) continue
    const i = items.findIndex((x) => x.kind === kind && x.key === key)
    const src = String(e.src || '')
    if (i >= 0) items[i] = { ...items[i], at: now, n: (items[i].n || 1) + 1, src, label: String(e.label).slice(0, 160) }
    else items.push({ kind, key, label: String(e.label).slice(0, 160), src, at: now, n: 1 })
  }
  items.sort((a, b) => b.at - a.at)
  return { items: items.slice(0, LOG_MAX) }
}

// When was this card/topic last practiced (0 = never)? `excludeSrc`: ignore an activity's own entries.
export function lastPracticed(log, label, kind = 'card', { excludeSrc = '' } = {}) {
  const key = foldKey(label)
  const hit = (log?.items || []).find((x) => x.kind === kind && x.key === key)
  return hit && (!excludeSrc || hit.src !== excludeSrc) ? hit.at : 0
}

// Items ordered freshest-to-practice first: never practiced, then longest ago. Those inside the cooldown go
// last and are only used when nothing else is left (`strict` drops them instead).
export function rankFresh(items, log, { now = Date.now(), cooldown = COOLDOWN_MS, labelOf = (x) => x.front, strict = false } = {}) {
  const scored = (items || []).map((x, i) => ({ x, i, at: lastPracticed(log, labelOf(x)) }))
  const cold = scored.filter((s) => !s.at || now - s.at >= cooldown).sort((a, b) => a.at - b.at || a.i - b.i)
  const hot = scored.filter((s) => s.at && now - s.at < cooldown).sort((a, b) => a.at - b.at)
  return [...cold, ...(strict ? [] : hot)].map((s) => s.x)
}

// Topics practiced recently, newest first, for "pick something else" lines in prompts.
export function recentTopics(log, { now = Date.now(), within = TOPIC_COOLDOWN_MS, limit = AVOID_TOPICS } = {}) {
  return (log?.items || []).filter((x) => x.kind === 'topic' && now - x.at < within).slice(0, limit).map((x) => x.label)
}

export const avoidLine = (topics) => (topics?.length ? `Recently practiced already (choose different ones): ${topics.join('; ')}` : '')
