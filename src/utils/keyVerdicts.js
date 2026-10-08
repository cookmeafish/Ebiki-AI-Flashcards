// One key, one ping. A typed API key used to be checked twice: Settings (or onboarding) pinged the provider
// to colour its hint, then the key-save path pinged again before giving the key authority over the shared
// copy. This keeps each check's verdict per EXACT provider + key string, so the save path can reuse it.
//
// Rules (CLAUDE.md "API keys"):
// - Only a DEFINITE verdict is kept (true, false, 'noCredit'). null = "could not check" is never cached, so an
//   unchecked key is checked again (the save path re-queues it and retries).
// - A check still running is SHARED by every caller asking about the same key (no second ping in parallel).
// - `reuse: true` (the save path) may take a kept verdict younger than `ttlMs`; a plain call (the Settings or
//   onboarding hint) asks the provider again and refreshes what is kept, unless the kept verdict is younger
//   than its `maxAgeMs` (the save path's ping for the same keystroke a moment earlier).
// - Keys are compared exactly as given (the caller trims); a different key never reuses another's verdict.

export const KEY_VERDICT_TTL_MS = 5 * 60 * 1000

const DEFINITE = (v) => v === true || v === false || v === 'noCredit'

export function createKeyVerdictCache({ ttlMs = KEY_VERDICT_TTL_MS, now = () => Date.now(), max = 20 } = {}) {
  const entries = new Map() // `${prov}\u0000${key}` -> { promise, done, verdict, at }
  const id = (prov, key) => `${prov}\u0000${key}`

  function run(prov, key, check, { reuse = false, maxAgeMs = 0 } = {}) {
    const k = id(prov, key)
    const e = entries.get(k)
    if (e && !e.done) return e.promise
    if (e && DEFINITE(e.verdict) && now() - e.at < (reuse ? ttlMs : Math.min(maxAgeMs, ttlMs))) return Promise.resolve(e.verdict)
    const entry = { done: false, verdict: null, at: 0, promise: null }
    entry.promise = Promise.resolve()
      .then(() => check(prov, key))
      .catch(() => null)
      .then((v) => {
        const verdict = DEFINITE(v) ? v : null
        entry.done = true; entry.verdict = verdict; entry.at = now()
        if (entries.get(k) === entry && verdict === null) entries.delete(k) // "could not tell" is never kept
        return verdict
      })
    entries.delete(k) // re-insert at the end: the oldest entry is the one dropped below
    entries.set(k, entry)
    while (entries.size > max) entries.delete(entries.keys().next().value)
    return entry.promise
  }

  // What is kept for this exact key (for tests and diagnostics), or undefined.
  function peek(prov, key) {
    const e = entries.get(id(prov, key))
    return e && e.done ? e.verdict : undefined
  }

  return { run, peek, clear: () => entries.clear() }
}
