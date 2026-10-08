// POST /api/anki: forwards one AnkiConnect request to 127.0.0.1:8765 and answers its reply as is. When Anki cannot
// answer, the reply is { code, error } (and timedOut on a timeout), which src/cards/anki translates:
//   notRunning     nothing listens (Anki closed, add-on missing)
//   timeout        no answer in time to a READ (Anki is sitting on a modal dialog: AnkiConnect runs on its UI thread)
//   timeoutChange  no answer in time to a CHANGE: it is still queued in Anki and runs once Anki is free, so the
//                  caller must not retry it blindly (that made duplicate cards)
//   closed         Anki closed the connection mid-reply (quit or crashed)
// Pure of the dev server: the caller passes http.request, so tests run it against a fake AnkiConnect.
export const ANKI_TIMEOUT_MS = 2 * 60 * 1000
// Only a collection sync can legitimately take minutes (a first full download).
export const ANKI_SYNC_TIMEOUT_MS = 15 * 60 * 1000

// Actions that CHANGE the collection (AnkiConnect's names). A read timing out is safe to retry; a change is not.
// multi is counted as a change: it can carry any action. guiAnswerCard records a review; guiAddCards can add one.
const CHANGE_ACTION = /^(add|remove|update|insert|replace|delete|set|forget|change|answer|store|create|suspend|unsuspend|relearn|import|clone|save|clear|multi|guiAnswerCard|guiAddCards|model(Field|Template)(Add|Remove|Rename|Reposition|Set))/i

export const isChangeAction = (action) => CHANGE_ACTION.test(String(action || ''))
export const ankiLimitMs = (action) => (action === 'sync' ? ANKI_SYNC_TIMEOUT_MS : ANKI_TIMEOUT_MS)

export function actionOf(bodyStr) {
  try { const a = JSON.parse(bodyStr); return a && typeof a === 'object' && typeof a.action === 'string' ? a.action : '' } catch { return '' }
}

// AnkiConnect actions that reach OUTSIDE Anki's collection: they read or write any path on this computer
// (importPackage, exportPackage, guiImportFile) or make Anki fetch a file path or URL into its media folder
// (storeMediaFile with `path` or `url`). Ebiki never sends them (media goes in as base64 `data`), so the proxy refuses
// them, also inside a `multi`: any script running in the app's origin (an injected reply, a shared deck's markup that
// slipped past the sanitizer) could otherwise read local files through Anki or reach other hosts from it.
const OUTSIDE_ACTIONS = new Set(['importpackage', 'exportpackage', 'guiimportfile'])
export function refusedAnkiAction(bodyStr) {
  let parsed
  try { parsed = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr } catch { return '' }
  const check = (req, depth) => {
    if (!req || typeof req !== 'object') return ''
    const action = typeof req.action === 'string' ? req.action : ''
    const a = action.toLowerCase()
    const params = req.params && typeof req.params === 'object' ? req.params : {}
    if (OUTSIDE_ACTIONS.has(a)) return action
    if (a === 'storemediafile' && (params.path != null || params.url != null)) return action
    if (a === 'multi' && Array.isArray(params.actions)) {
      if (depth > 4) return action
      for (const inner of params.actions) { const hit = check(inner, depth + 1); if (hit) return hit }
    }
    return ''
  }
  return check(parsed, 0)
}

// The { code, error } reply for a request that failed before Anki answered.
export function ankiProxyError(err, action) {
  const timedOut = /timed out/.test(String((err && err.message) || ''))
  if (!timedOut) return { code: 'notRunning', error: 'Anki is not running or AnkiConnect is not installed' }
  return isChangeAction(action)
    ? { timedOut: true, code: 'timeoutChange', error: 'Anki did not answer in time. If Anki is showing a window or a question, answer it. The change may still be applied once Anki is free, so check Anki before trying again.' }
    : { timedOut: true, code: 'timeout', error: 'Anki did not answer. If Anki is showing a window or a question, answer it, then try again.' }
}
export const ANKI_CLOSED = { code: 'closed', error: 'Anki closed the connection before answering. Check that Anki is still open, then try again.' }

export function createAnkiProxy({ request, hostname = '127.0.0.1', port = 8765, log = console, limitMs = ankiLimitMs }) {
  return (req, res) => {
    if (req.method !== 'POST') { res.statusCode = 405; res.end(''); return }
    const answer = (obj) => {
      if (res.headersSent || res.writableEnded) return
      res.setHeader('Content-Type', 'application/json')
      res.end(typeof obj === 'string' ? obj : JSON.stringify(obj))
    }
    const forward = (bodyStr) => {
      const refused = refusedAnkiAction(bodyStr)
      if (refused) {
        log.log('[Anki proxy] refused an action that reaches outside the collection:', refused)
        res.statusCode = 403
        answer({ code: 'refused', error: `Ebiki does not send "${refused}" to Anki.` })
        return
      }
      log.log('[Anki proxy] forwarding:', bodyStr.substring(0, 200))
      const action = actionOf(bodyStr)
      let ankiReq
      try {
        ankiReq = request(
          { hostname, port, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) } },
          (ankiRes) => {
            let data = ''
            // A notesInfo reply for a whole deck spans many chunks and is full of accents: decode as one stream.
            ankiRes.setEncoding('utf8')
            ankiRes.on('data', (chunk) => { data += chunk })
            ankiRes.on('end', () => { log.log('[Anki proxy] response:', data.substring(0, 200)); answer(data) })
            // Anki quitting or crashing MID-REPLY closes the socket with no 'end' and no request 'error' (the timeout
            // was already cleared by the headers), so the caller waited forever.
            ankiRes.on('error', () => { /* answered by 'close' below */ })
            ankiRes.on('close', () => { if (!ankiRes.complete) answer(ANKI_CLOSED) })
          },
        )
      } catch (e) { answer(ankiProxyError(e, action)); return }
      // AnkiConnect answers on Anki's UI thread, so while Anki sits on a modal dialog a request is never answered:
      // with no timeout a deck or study screen spun forever and every boot-watcher ping left a socket open.
      const ms = limitMs(action)
      ankiReq.setTimeout(ms, () => ankiReq.destroy(new Error(`timed out after ${ms / 1000}s (${action || 'request'})`)))
      ankiReq.on('error', (err) => { log.log('[Anki proxy] error:', err && err.message); answer(ankiProxyError(err, action)) })
      ankiReq.write(bodyStr)
      ankiReq.end()
    }
    // Vite may have parsed the body already; else read the stream.
    if (req.body) { forward(typeof req.body === 'string' ? req.body : JSON.stringify(req.body)); return }
    let raw = ''
    req.on('data', (chunk) => { raw += chunk })
    req.on('end', () => forward(raw))
  }
}
