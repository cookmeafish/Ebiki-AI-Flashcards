// The data-route guard's mode for ONE request. Reads may use the cached reachability answer (up to 3s old while the
// share is up), but a WRITE to a shared folder is confirmed with a fresh probe first. Trusting the cache, a write in
// the first seconds after the share vanished was served "online": its handler's mkdirSync(..., { recursive: true })
// RE-CREATED the missing share folder (players/<id>.json on the first beat), from then on that one entry made the
// share look present, offline mode never started, and every later save went into that empty stand-in instead of the
// offline copy (reproduced end to end with a renamed share folder).
//   dataMode()   -> 'online' | 'offline' | 'down'  (the server's own, cached)
//   freshProbe() -> true when the data folder really holds data right now (no cache)
//   invalidate() -> drop the cached answer so the next dataMode() probes again
export async function guardMode({ isWrite, shared, dataMode, freshProbe, invalidate }) {
  const mode = await dataMode()
  if (!isWrite || !shared || mode !== 'online') return mode
  if (await freshProbe()) return mode
  invalidate()
  return dataMode()
}

// Is this /api request (url relative to the /api mount) one of the data routes the guard fronts? Matched the way
// connect matches a mount: case-insensitively, and the route may be followed by "/" or "." or nothing. Matching only
// "/" let /api/config.x, /api/chats.json or /api/modes.anything reach their handler with NO guard (connect hands
// "/config.x" to the /api/config handler): no 503 on a dead share, no fresh probe before a write, no refusal in the
// seconds after a folder switch.
export function isDataRoute(url, routes) {
  const p = (String(url || '').split('?')[0].split('#')[0].replace(/\/+$/, '') || '/').toLowerCase()
  return routes.some((r) => { const k = String(r).toLowerCase(); return p === k || p.startsWith(k + '/') || p.startsWith(k + '.') })
}
