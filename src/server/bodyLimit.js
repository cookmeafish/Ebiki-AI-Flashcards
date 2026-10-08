// ONE size limit for every /api request body (the handlers read with `body += chunk` and had no cap, so a
// runaway or hostile body filled memory before any handler looked at it). Mounted as an /api middleware right
// after the guard: a body over its route's cap answers 413 {error:'too large'} and the route's handler never sees
// it (its 'data'/'end' listeners are silenced), so no handler answers twice.
//
// Caps are generous where real payloads are big (chats carry photos as data URLs, knowledge uploads are whole
// books, the Anki proxy stores audio and images) and modest elsewhere. Routes with their OWN smaller cap
// (/api/log, /api/feature-data, the game routes) keep it: this one only sits above theirs.

const MB = 1024 * 1024

// Paths are relative to the /api mount (connect strips it from req.url). Longest matching prefix wins.
export const BODY_CAPS = [
  ['/chats', 64 * MB],
  ['/modes/knowledge', 64 * MB],
  ['/anki', 64 * MB],
  ['/discover-store', 32 * MB],
  ['/modes', 16 * MB],
  ['/feature-data', 8 * MB],
  ['/keys', 256 * 1024],
  ['/usage', 1 * MB],
  ['/web-search', 64 * 1024],
]
export const DEFAULT_BODY_CAP = 8 * MB

export function bodyCapFor(pathname = '') {
  const p = String(pathname).split('?')[0].toLowerCase().replace(/^\/api(?=\/|$)/, '')
  let best = null
  for (const [prefix, cap] of BODY_CAPS) {
    if ((p === prefix || p.startsWith(prefix + '/') || p.startsWith(prefix + '?')) && (!best || prefix.length > best[0].length)) best = [prefix, cap]
  }
  return best ? best[1] : DEFAULT_BODY_CAP
}

const sendTooLarge = (res, cap) => {
  if (res.headersSent || res.writableEnded) return
  res.statusCode = 413
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Connection', 'close')
  res.end(JSON.stringify({ error: 'too large', limit: cap }))
}

// Connect middleware. `capFor` is injectable for tests.
export function limitBody(capFor = bodyCapFor) {
  return (req, res, next) => {
    const method = String(req.method || 'GET').toUpperCase()
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next()
    const cap = capFor(req.url || '')
    const declared = Number(req.headers?.['content-length'])
    // Declared too big: refuse before reading a byte (the browser's fetch always declares string/Blob bodies).
    if (Number.isFinite(declared) && declared > cap) { sendTooLarge(res, cap); return }
    // Undeclared (chunked) or lying: count as it streams. Handlers' 'data'/'end' listeners are wrapped so they go
    // quiet once the cap is passed; the rest of the body drains and is thrown away.
    let seen = 0
    let over = false
    const count = (chunk) => {
      if (over) return
      seen += typeof chunk === 'string' ? Buffer.byteLength(chunk) : (chunk?.length || 0)
      if (seen > cap) { over = true; sendTooLarge(res, cap) }
    }
    // Counted INSIDE the first handler 'data' listener, never by a listener of our own: attaching one here put the
    // request into flowing mode at once, and every route behind an ASYNC step (the data-route guard awaits a share
    // probe) attached its listener after the body had already streamed past. config, modes, chats... then saw an
    // empty body ("invalid json") and nothing could be saved. Until a handler listens, the request stays paused.
    let counting = false
    const silence = (fn) => function (...args) { if (!over) return fn.apply(this, args) }
    const wrapData = (fn) => {
      const counts = !counting
      counting = true
      return function (chunk, ...rest) { if (counts) count(chunk); if (!over) return fn.call(this, chunk, ...rest) }
    }
    for (const name of ['on', 'addListener', 'once', 'prependListener', 'prependOnceListener']) {
      if (typeof req[name] !== 'function') continue
      const orig = req[name].bind(req)
      req[name] = (ev, fn) => (typeof fn !== 'function' ? orig(ev, fn) : ev === 'data' ? orig(ev, wrapData(fn)) : ev === 'end' ? orig(ev, silence(fn)) : orig(ev, fn))
    }
    next()
  }
}
