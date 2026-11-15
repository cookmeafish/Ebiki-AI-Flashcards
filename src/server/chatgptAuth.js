// "Sign in with ChatGPT" plan usage (OpenAI's official flow for open-source, locally run apps, 2026-11): the user signs in
// to OpenAI in their own browser and Ebiki's AI requests run on their ChatGPT Plus / Pro plan instead of an API key.
// Docs: developers.openai.com/siwc/token-sharing-open-source (sign-in, models-and-inference, errors-and-recovery,
// preview-limitations). Plan in docs/plans/2026-11-14-subscription-sign-in.md.
//
// SECURITY: tokens live ONLY here, in the server, in a machine-local file (never the shared data folder, .env or
// keys.json), never sent to the page, never logged. The page talks to /api/chatgpt/*; the server adds the token.
// The loopback callback listens on 127.0.0.1 only, for one path, one attempt, 5 minutes, and checks `state`.
//
// Pure parts are exported for tests; createChatgptAuth() wires them to fetch, http and a file.

export const AUTH_BASE = 'https://auth.openai.com'
export const AUTHORIZE_URL = `${AUTH_BASE}/api/accounts/authorize`
export const TOKEN_URL = `${AUTH_BASE}/api/accounts/oauth/token`
export const JWKS_URL = `${AUTH_BASE}/.well-known/jwks.json`
export const OIDC_CONFIG_URL = `${AUTH_BASE}/.well-known/openid-configuration`
export const RESOURCE = 'https://api.openai.com/v1'
export const RESPONSES_URL = 'https://api.openai.com/v1/responses'
export const MODELS_URL = 'https://api.openai.com/v1/models'
export const PLAN_SCOPE = 'chatgpt.tokens.use.direct'
export const SCOPES = `openid profile email offline_access resource.invoke ${PLAN_SCOPE}`
export const FIRST_CLIENT = 'dynamic_agent_client' // the registration entry point, never saved or exchanged with
export const CALLBACK_PATH = '/auth/callback'
export const FIRST_PORT = 1455
export const LATER_PORTS = [1455, 1456, 1457, 1458, 1459, 1460]
export const AGENT_NAME = 'Ebiki'
export const MANAGE_USAGE_URL = 'https://chatgpt.com/settings/usage'
export const SIGNIN_TIMEOUT_MS = 5 * 60 * 1000
export const CALL_TIMEOUT_MS = 5 * 60 * 1000
export const REFRESH_EARLY_MS = 2 * 60 * 1000 // refresh this long before the 1-hour access token runs out
export const MODELS_TTL_MS = 10 * 60 * 1000
export const AUTO_MODEL = 'auto' // the provider's presets: the server sends the first model the account lists
// Refresh errors after which the grant is gone: sign in again (errors-and-recovery).
export const TERMINAL_REFRESH = ['invalid_grant', 'invalid_refresh_token', 'token_expired', 'refresh_token_expired', 'refresh_token_invalidated', 'refresh_token_reused']
// Fields plan usage refuses (preview-limitations): never sent.
export const REFUSED_FIELDS = ['background', 'conversation', 'max_output_tokens', 'max_tool_calls', 'metadata', 'moderation', 'multi_agent', 'prompt',
  'prompt_cache_retention', 'safety_identifier', 'temperature', 'top_logprobs', 'top_p', 'truncation', 'user', 'previous_response_id']

const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const fromB64url = (s) => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64')

export function pkcePair(crypto) {
  const verifier = b64url(crypto.randomBytes(48))
  const challenge = b64url(crypto.createHash('sha256').update(verifier).digest())
  return { verifier, challenge }
}
export const randomToken = (crypto) => b64url(crypto.randomBytes(24))
export const newHostId = (crypto) => `urn:uuid:${crypto.randomUUID()}`
export const redirectUriFor = (port) => `http://127.0.0.1:${port}${CALLBACK_PATH}`

// The authorize URL. First registration: dynamic_agent_client + agent_name_hint. Later: the issued client id, the last
// ID token as id_token_hint (skips the account picker) and the saved email as login_hint.
export function buildAuthorizeUrl({ clientId, hostId, redirectUri, state, nonce, challenge, idTokenHint, loginHint }) {
  const first = !clientId
  const p = new URLSearchParams()
  p.set('client_id', first ? FIRST_CLIENT : clientId)
  if (first) p.set('agent_name_hint', AGENT_NAME)
  p.set('ext_agent_host_id', hostId)
  if (!first && idTokenHint) p.set('id_token_hint', idTokenHint)
  if (loginHint) p.set('login_hint', loginHint)
  p.set('response_type', 'code')
  p.set('redirect_uri', redirectUri)
  p.set('scope', SCOPES)
  p.set('resource', RESOURCE)
  p.set('state', state)
  p.set('nonce', nonce)
  p.set('code_challenge', challenge)
  p.set('code_challenge_method', 'S256')
  return `${AUTHORIZE_URL}?${p.toString()}`
}

// The token request body (application/x-www-form-urlencoded). No client secret: a public client.
export function tokenForm({ grant, clientId, code, verifier, redirectUri, refreshToken }) {
  const p = new URLSearchParams()
  if (grant === 'refresh') {
    p.set('grant_type', 'refresh_token'); p.set('client_id', clientId); p.set('refresh_token', refreshToken)
  } else {
    p.set('grant_type', 'authorization_code'); p.set('client_id', clientId); p.set('code', code)
    p.set('code_verifier', verifier); p.set('redirect_uri', redirectUri)
  }
  p.set('resource', RESOURCE)
  return p.toString()
}

// The callback's query. A new registration MUST bring the issued client id; a returning one may omit it but never
// change it. `state` must be the one this attempt sent.
export function parseCallback(search, { state, savedClientId }) {
  const q = new URLSearchParams(String(search || '').replace(/^\?/, ''))
  if (!state || q.get('state') !== state) return { ok: false, error: 'state' }
  const err = q.get('error')
  if (err) return { ok: false, error: err === 'access_denied' ? 'denied' : 'oauth', detail: err }
  const code = q.get('code')
  if (!code) return { ok: false, error: 'oauth', detail: 'no code' }
  const issued = q.get('client_id') || ''
  if (!savedClientId && !issued) return { ok: false, error: 'registration' }
  if (savedClientId && issued && issued !== savedClientId) return { ok: false, error: 'registration' }
  return { ok: true, code, clientId: savedClientId || issued, scope: q.get('scope') || '' }
}

export const scopeList = (s) => (Array.isArray(s) ? s : String(s || '').split(/\s+/)).filter(Boolean)
export const hasPlanScope = (s) => scopeList(s).includes(PLAN_SCOPE)

export function decodeJwt(token) {
  const parts = String(token || '').split('.')
  if (parts.length !== 3) throw new Error('not a JWT')
  return {
    header: JSON.parse(fromB64url(parts[0]).toString('utf8')),
    payload: JSON.parse(fromB64url(parts[1]).toString('utf8')),
    signingInput: `${parts[0]}.${parts[1]}`,
    signature: fromB64url(parts[2]),
  }
}

// The ID token: RS256 only, signed by a key in OpenAI's JWKS, issued by auth.openai.com, for this client, unexpired,
// with this attempt's nonce. Returns the payload or throws. (`sub` is the identity; email is display only.)
export function verifyIdToken(token, { jwks, clientId, nonce, crypto, now = Date.now() }) {
  const { header, payload, signingInput, signature } = decodeJwt(token)
  if (header.alg !== 'RS256') throw new Error('id token: unexpected alg')
  const keys = Array.isArray(jwks?.keys) ? jwks.keys : []
  const jwk = keys.find((k) => k && k.kid === header.kid && (k.kty === 'RSA')) || (!header.kid && keys.length === 1 ? keys[0] : null)
  if (!jwk) throw new Error('id token: unknown key')
  const pub = crypto.createPublicKey({ key: { kty: jwk.kty, n: jwk.n, e: jwk.e }, format: 'jwk' })
  if (!crypto.verify('RSA-SHA256', Buffer.from(signingInput), pub, signature)) throw new Error('id token: bad signature')
  if (payload.iss !== AUTH_BASE) throw new Error('id token: wrong issuer')
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
  if (!aud.includes(clientId)) throw new Error('id token: wrong audience')
  if (aud.length > 1 && payload.azp !== undefined && payload.azp !== clientId) throw new Error('id token: wrong authorized party')
  if (!(Number(payload.exp) * 1000 > now - 60000)) throw new Error('id token: expired')
  if (nonce && payload.nonce !== nonce) throw new Error('id token: wrong nonce')
  if (!payload.sub) throw new Error('id token: no subject')
  return payload
}

// The Responses body plan usage accepts: instructions (never a system message), the input as one user turn (text and
// images), store:false and stream:true, and NOTHING from REFUSED_FIELDS.
export function buildResponsesBody({ model, instructions, input, images }) {
  const content = []
  for (const im of Array.isArray(images) ? images : []) {
    const type = String(im?.mediaType || '')
    const data = String(im?.base64 || '')
    if (!/^image\/(png|jpeg|gif|webp)$/.test(type) || !/^[A-Za-z0-9+/=]+$/.test(data)) continue
    content.push({ type: 'input_image', image_url: `data:${type};base64,${data}` })
  }
  content.push({ type: 'input_text', text: String(input ?? '') })
  const body = { model: String(model || ''), input: [{ role: 'user', content }], store: false, stream: true }
  const ins = String(instructions ?? '').trim()
  if (ins) body.instructions = ins
  return body
}

// The streamed reply (SSE). Text = the output_text deltas; success ONLY with response.completed (a stream that ends
// without it, or response.incomplete / response.failed / error, is a failure).
export function parseSse(raw) {
  let text = ''
  let done = ''
  let completed = false
  let usage = null
  let error = null
  let refusal = ''
  for (const block of String(raw || '').split(/\r?\n\r?\n/)) {
    const data = block.split(/\r?\n/).filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trimStart()).join('\n')
    if (!data || data === '[DONE]') continue
    let ev
    try { ev = JSON.parse(data) } catch { continue }
    const type = ev?.type || (block.match(/^event:\s*(.+)$/m) || [])[1]
    if (type === 'response.refusal.delta' && typeof ev.delta === 'string') refusal += ev.delta
    else if (type === 'response.output_text.delta' && typeof ev.delta === 'string') text += ev.delta
    else if (type === 'response.output_text.done' && typeof ev.text === 'string') done += ev.text
    else if (type === 'response.completed') { completed = true; usage = ev.response?.usage || null }
    else if (type === 'response.failed') error = { code: ev.response?.error?.code || 'failed', message: ev.response?.error?.message || '' }
    else if (type === 'response.incomplete') error = { code: 'incomplete', message: ev.response?.incomplete_details?.reason || '' }
    else if (type === 'error') error = { code: ev.code || ev.error?.code || 'error', message: ev.message || ev.error?.message || '' }
  }
  if (!text && done) text = done
  // A refusal or a safety stop with no text is the app's one "blocked" error (as "" it became a blank saved bubble).
  if (!text && refusal) error = { code: 'blocked', message: `refusal: ${refusal.slice(0, 120)}` }
  else if (!text && error?.code === 'incomplete' && /content_filter/.test(error.message)) error = { code: 'blocked', message: 'content_filter' }
  return { text, completed: completed && !error, usage, error }
}

// An error body (pre-stream {"detail": ...} or a Responses {"error": {code, message}}) as the app's one error shape,
// `API <status>: <code> <message>`, so the AI error classifier, failover and probes read it like every provider's.
export function planError(status, bodyText) {
  let code = ''
  let message = ''
  try {
    const j = JSON.parse(bodyText)
    if (j?.error && typeof j.error === 'object') { code = j.error.code || j.error.type || ''; message = j.error.message || '' }
    else if (typeof j?.error === 'string') code = j.error
    if (typeof j?.detail === 'string') message = message || j.detail
    else if (j?.detail && typeof j.detail === 'object') { code = code || j.detail.code || ''; message = message || j.detail.message || '' }
  } catch { message = String(bodyText || '').slice(0, 200) }
  return `API ${status}: ${[code, message].filter(Boolean).join(' ').slice(0, 300) || 'error'}`
}

// The models the account may use, in OpenAI's order: entries with visibility "list" (models-and-inference). The
// standard `data` list is accepted too.
export function shapeModels(json) {
  const list = Array.isArray(json?.models) ? json.models : Array.isArray(json?.data) ? json.data : []
  return list
    .filter((m) => m && (m.visibility === undefined || m.visibility === 'list'))
    .map((m) => ({ id: String(m.slug || m.id || ''), name: String(m.display_name || m.slug || m.id || '') }))
    .filter((m) => m.id)
}

// What the page may know: never a token.
export function publicStatus(rec, pending) {
  const signedIn = !!(rec && rec.refreshToken && rec.sub && !rec.needsSignIn)
  return {
    signedIn,
    planUsage: signedIn && hasPlanScope(rec.scopes),
    email: signedIn ? String(rec.email || '') : '',
    needsSignIn: !!rec?.needsSignIn,
    pending: !!(pending && !pending.done),
    error: pending?.error || '',
    welcomed: !!rec?.welcomed,
    manageUrl: MANAGE_USAGE_URL,
  }
}

// The scopes an access token carries (its `scope` claim): the fallback when the token reply leaves `scope` out (OAuth
// lets it, meaning "as requested"), so a granted plan never reads as "no plan".
export function accessTokenScopes(token) {
  try { return scopeList(decodeJwt(token).payload.scope) } catch { return [] }
}

export const START_FAILED_PAGE = `<!doctype html><meta charset="utf-8"><title>Ebiki</title>
<body style="font-family:system-ui,sans-serif;background:#0f1720;color:#e8eef5;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<div style="text-align:center;max-width:440px"><div style="font-size:40px">&#10007;</div><h2>Sign-in could not start</h2>
<p>Close this tab and look in Ebiki for what went wrong.</p></div></body>`

const SUCCESS_PAGE = (ok) => `<!doctype html><meta charset="utf-8"><title>Ebiki</title>
<body style="font-family:system-ui,sans-serif;background:#0f1720;color:#e8eef5;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<div style="text-align:center;max-width:420px"><div style="font-size:40px">${ok ? '&#10003;' : '&#10007;'}</div>
<h2>${ok ? 'Signed in' : 'Sign-in did not finish'}</h2><p>${ok ? 'You can close this tab and go back to Ebiki.' : 'Close this tab and try again in Ebiki.'}</p></div></body>`

// ─── The wired service ─────────────────────────────────────────────────────────────────────────────────────────
// file: the machine-local record (app folder, gitignored). Record: { hostId, clientId, sub, email, idToken,
// accessToken, refreshToken, scopes[], expiresAt, needsSignIn, welcomed }.
export function createChatgptAuth({ file, fs, http, crypto, writeFileAtomic, readUtf8, fetch: doFetch = globalThis.fetch, log = () => {}, ports = { first: [FIRST_PORT], later: LATER_PORTS } }) {
  let pending = null    // { state, nonce, verifier, redirectUri, server, timer, done, error }
  let refreshing = null // one refresh at a time (rotation: two parallel refreshes would reuse a refresh token)
  let modelsCache = null

  const read = () => {
    try { const j = JSON.parse(readUtf8(file)); return j && typeof j === 'object' ? j : {} } catch { return {} }
  }
  // Atomic AND private from the first byte: the temp file is created 0600 (a plain write left the token file readable by
  // other users on macOS/Linux until a chmod ran). Windows ignores the mode; the app folder is the user's own.
  const write = (rec) => {
    const tmp = `${file}.${process.pid}.tmp`
    try {
      fs.writeFileSync(tmp, JSON.stringify(rec, null, 2), { mode: 0o600 })
      fs.renameSync(tmp, file)
    } catch (e) {
      try { fs.rmSync(tmp, { force: true }) } catch { /* */ }
      if (typeof writeFileAtomic !== 'function') throw e
      writeFileAtomic(file, JSON.stringify(rec, null, 2))
    }
    try { fs.chmodSync(file, 0o600) } catch { /* Windows: best effort */ }
  }
  const hostId = () => {
    const rec = read()
    if (rec.hostId) return rec.hostId
    rec.hostId = newHostId(crypto)
    write(rec)
    return rec.hostId
  }

  // Closes the callback listener; resolves once the port is free (a second Continue click reused port 1455 before the
  // first listener had let go of it, and failed).
  const closePending = () => {
    if (!pending) return Promise.resolve()
    clearTimeout(pending.timer)
    const server = pending.server
    pending.server = null
    if (!server) return Promise.resolve()
    return new Promise((resolve) => { try { server.close(() => resolve()) } catch { resolve() } })
  }

  const listen = (ports) => new Promise((resolve, reject) => {
    const tryPort = (i) => {
      if (i >= ports.length) { reject(new Error('no free port for the sign-in callback')); return }
      const server = http.createServer()
      server.once('error', () => { try { server.close() } catch { /* */ } tryPort(i + 1) })
      server.listen(ports[i], '127.0.0.1', () => resolve({ server, port: ports[i] }))
    }
    tryPort(0)
  })

  const exchange = async (form) => {
    const r = await doFetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form, signal: AbortSignal.timeout(30000) })
    const text = await r.text()
    let j = null
    try { j = JSON.parse(text) } catch { j = null }
    if (!r.ok || !j?.access_token) {
      const err = new Error(`token ${r.status}: ${j?.error || ''}`)
      err.oauthError = j?.error || ''
      err.status = r.status
      throw err
    }
    return j
  }

  const fetchJwks = async () => {
    const r = await doFetch(JWKS_URL, { signal: AbortSignal.timeout(15000) })
    if (!r.ok) throw new Error(`jwks ${r.status}`)
    return r.json()
  }

  const onCallback = async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1')
    if (url.pathname !== CALLBACK_PATH || !pending || pending.done) { res.statusCode = 404; res.end(); return }
    const rec = read()
    const cb = parseCallback(url.search, { state: pending.state, savedClientId: rec.clientId || '' })
    if (!cb.ok && cb.error === 'state') { res.statusCode = 400; res.end(); return } // a stray request: keep waiting for the real one
    const attempt = pending
    attempt.done = true
    try {
      if (!cb.ok) throw Object.assign(new Error(cb.error), { code: cb.error })
      const tok = await exchange(tokenForm({ grant: 'code', clientId: cb.clientId, code: cb.code, verifier: attempt.verifier, redirectUri: attempt.redirectUri }))
      const claims = verifyIdToken(tok.id_token, { jwks: await fetchJwks(), clientId: cb.clientId, nonce: attempt.nonce, crypto })
      const fromToken = accessTokenScopes(tok.access_token)
      const scopes = tok.scope ? scopeList(tok.scope) : fromToken.length ? fromToken : scopeList(cb.scope)
      // One registration per client id + subject: another account through the same client starts clean.
      write({
        hostId: rec.hostId || attempt.hostId,
        clientId: cb.clientId,
        sub: claims.sub,
        email: String(claims.email || ''),
        idToken: tok.id_token,
        accessToken: tok.access_token,
        refreshToken: tok.refresh_token || '',
        scopes,
        expiresAt: Date.now() + (Number(tok.expires_in) || 3600) * 1000,
        needsSignIn: false,
        welcomed: rec.sub === claims.sub ? !!rec.welcomed : false,
      })
      modelsCache = null
      attempt.error = hasPlanScope(scopes) ? '' : 'noPlan'
      log(`signed in (plan usage ${hasPlanScope(scopes) ? 'granted' : 'NOT granted'})`)
      res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(SUCCESS_PAGE(true))
    } catch (e) {
      attempt.error = e.code || 'failed'
      log(`sign-in failed: ${e.code || e.message}`)
      res.statusCode = 400; res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(SUCCESS_PAGE(false))
    } finally {
      closePending()
    }
  }

  // Starts a sign-in and returns the URL to open. A new start replaces an unfinished one.
  async function start() {
    await closePending()
    const rec = read()
    const hid = rec.hostId || hostId()
    let server, port
    try { ({ server, port } = await listen(rec.clientId ? ports.later : ports.first)) } catch (e) {
      // Another program holds the callback port: the page must SAY so (it waited 5 minutes on a raw JSON tab).
      pending = { done: true, error: 'port' }
      log(`sign-in could not start: ${e.message}`)
      throw Object.assign(e, { code: 'port' })
    }
    const { verifier, challenge } = pkcePair(crypto)
    const state = randomToken(crypto)
    const nonce = randomToken(crypto)
    const redirectUri = redirectUriFor(port)
    pending = { state, nonce, verifier, redirectUri, server, hostId: hid, done: false, error: '' }
    server.on('request', (req, res) => { onCallback(req, res).catch(() => { try { res.statusCode = 500; res.end() } catch { /* */ } }) })
    pending.timer = setTimeout(() => { if (pending && !pending.done) { pending.done = true; pending.error = 'timeout'; closePending() } }, SIGNIN_TIMEOUT_MS)
    if (pending.timer.unref) pending.timer.unref()
    return buildAuthorizeUrl({ clientId: rec.clientId || '', hostId: hid, redirectUri, state, nonce, challenge, idTokenHint: rec.idToken || '', loginHint: rec.email || '' })
  }

  const status = () => publicStatus(read(), pending)

  // A valid access token, refreshed when it is about to run out. Throws `API 401: signed_out` when the grant is gone.
  async function accessToken() {
    const rec = read()
    if (!rec.refreshToken || !rec.clientId) throw new Error('API 401: signed_out Sign in with ChatGPT again')
    if (rec.accessToken && Number(rec.expiresAt) - REFRESH_EARLY_MS > Date.now()) return rec.accessToken
    if (!refreshing) {
      refreshing = (async () => {
        try {
          const tok = await exchange(tokenForm({ grant: 'refresh', clientId: rec.clientId, refreshToken: rec.refreshToken }))
          const cur = read()
          // Signed out (or signed in again) while this refresh ran: never write these tokens back over that.
          if (cur.refreshToken !== rec.refreshToken) {
            if (!cur.refreshToken) throw new Error('API 401: signed_out Sign in with ChatGPT again')
            return cur.accessToken || tok.access_token
          }
          // A new ID token is kept only once it checks out (it is sent back as id_token_hint).
          let idToken = cur.idToken
          if (tok.id_token) {
            try { verifyIdToken(tok.id_token, { jwks: await fetchJwks(), clientId: rec.clientId, nonce: '', crypto }); idToken = tok.id_token } catch { /* keep the old one */ }
          }
          write({ ...cur, accessToken: tok.access_token, refreshToken: tok.refresh_token || cur.refreshToken, idToken,
            scopes: tok.scope ? scopeList(tok.scope) : cur.scopes, expiresAt: Date.now() + (Number(tok.expires_in) || 3600) * 1000, needsSignIn: false })
          return tok.access_token
        } catch (e) {
          if (/^API 401: signed_out/.test(e.message)) throw e
          if (TERMINAL_REFRESH.includes(e.oauthError)) {
            const cur = read()
            // Another server on this computer (the owner's app and a second copy share this file) refreshed first and
            // rotated the token: use its result instead of signing the user out.
            if (cur.refreshToken && cur.refreshToken !== rec.refreshToken && !cur.needsSignIn) {
              log(`refresh raced another server (${e.oauthError}): using its token`)
              return cur.accessToken
            }
            write({ ...cur, accessToken: '', refreshToken: '', needsSignIn: true })
            log(`refresh refused (${e.oauthError}): sign in again`)
            throw new Error('API 401: signed_out Sign in with ChatGPT again')
          }
          throw new Error(`API 503: refresh_unavailable ${e.message}`)
        } finally { refreshing = null }
      })()
    }
    return refreshing
  }

  async function models() {
    if (modelsCache && Date.now() - modelsCache.at < MODELS_TTL_MS) return modelsCache.list
    const token = await accessToken()
    const r = await doFetch(MODELS_URL, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30000) })
    const text = await r.text()
    if (!r.ok) throw new Error(planError(r.status, text))
    let j = null
    try { j = JSON.parse(text) } catch { j = null }
    const list = shapeModels(j)
    modelsCache = { at: Date.now(), list }
    return list
  }

  // One AI request. Returns { text, usage, model } or throws `API <status>: ...`.
  async function respond({ model, instructions, input, images }) {
    const token = await accessToken()
    let m = String(model || '').trim()
    if (!m || m === AUTO_MODEL) {
      const list = await models()
      if (!list.length) throw new Error('API 403: no_models Your ChatGPT plan lists no models for apps')
      m = list[0].id
    }
    const body = buildResponsesBody({ model: m, instructions, input, images })
    const r = await doFetch(RESPONSES_URL, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
    })
    const raw = await r.text()
    if (!r.ok) {
      const err = planError(r.status, raw)
      if (r.status === 401 && /subscription_sharing_invalid_user/.test(err)) { const cur = read(); write({ ...cur, accessToken: '', refreshToken: '', needsSignIn: true }) }
      throw new Error(err)
    }
    const got = parseSse(raw)
    if (got.error?.code === 'blocked') throw new Error(`API 200: blocked (${got.error.message})`)
    if (got.error) {
      const st = got.error.code === 'subscription_sharing_usage_limit_exceeded' ? 429 : got.error.code === 'incomplete' ? 200 : 500
      throw new Error(`API ${st}: ${got.error.code} ${got.error.message}`.trim())
    }
    if (!got.completed) throw new Error('API 502: stream_ended The reply stopped before it finished')
    return { text: got.text, usage: got.usage, model: m }
  }

  // Sign out: revoke the refresh token, then forget the tokens (the host id, client id and email stay for next time).
  async function signOut() {
    const rec = read()
    let revoked = !rec.refreshToken
    if (rec.refreshToken && rec.clientId) {
      try {
        let endpoint = ''
        try { const c = await (await doFetch(OIDC_CONFIG_URL, { signal: AbortSignal.timeout(15000) })).json(); endpoint = c?.revocation_endpoint || '' } catch { endpoint = '' }
        if (/^https:\/\/auth\.openai\.com\//.test(endpoint)) {
          const p = new URLSearchParams({ token: rec.refreshToken, token_type_hint: 'refresh_token', client_id: rec.clientId })
          const r = await doFetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString(), signal: AbortSignal.timeout(15000) })
          revoked = r.ok
        }
      } catch { revoked = false }
    }
    write({ hostId: rec.hostId, clientId: rec.clientId, email: rec.email, welcomed: rec.welcomed })
    modelsCache = null
    await closePending(); pending = null
    log(`signed out (revoked: ${revoked})`)
    return { ok: true, revoked }
  }

  const markWelcomed = () => { const rec = read(); if (rec.sub) write({ ...rec, welcomed: true }) }
  const cancel = () => { if (pending && !pending.done) { pending.done = true; pending.error = '' } return closePending() }

  return { start, status, signOut, models, respond, markWelcomed, cancel, _read: read }
}

// /api/chatgpt/* (mounted at /api/chatgpt; connect strips the mount from req.url).
//   GET  /start     302 to OpenAI (opened as a link, so the app window hands it to the real browser)
//   GET  /status    publicStatus (never a token)
//   POST /signout   { ok, revoked }
//   POST /welcomed  the "You're using your ChatGPT plan" notice was shown
//   POST /cancel    stops waiting for a sign-in
//   GET  /models    { models: [{ id, name }] }
//   POST /respond   { model, instructions, input, images } → { text, usage, model } | error { error: 'API ...' }
export function createChatgptRoute({ auth }) {
  const send = (res, status, obj) => { if (res.writableEnded) return; res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)) }
  const failStatus = (msg) => { const s = Number((String(msg).match(/^API (\d{3})/) || [])[1]); return s >= 400 && s <= 599 ? s : 502 }
  return (req, res) => {
    const p = (req.url || '/').split('?')[0].replace(/\/+$/, '') || '/'
    const route = `${req.method} ${p}`
    if (route === 'GET /start') {
      auth.start().then((url) => { res.statusCode = 302; res.setHeader('Location', url); res.setHeader('Cache-Control', 'no-store'); res.end() })
        .catch(() => { if (res.writableEnded) return; res.statusCode = 503; res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(START_FAILED_PAGE) })
      return
    }
    if (route === 'GET /status') { send(res, 200, auth.status()); return }
    if (route === 'POST /signout') { auth.signOut().then((r) => send(res, 200, r)).catch((e) => send(res, 500, { error: String(e?.message || e) })); return }
    if (route === 'POST /welcomed') { auth.markWelcomed(); send(res, 200, { ok: true }); return }
    if (route === 'POST /cancel') { auth.cancel(); send(res, 200, { ok: true }); return }
    if (route === 'GET /models') {
      auth.models().then((models) => send(res, 200, { models })).catch((e) => send(res, failStatus(e?.message), { error: String(e?.message || e) }))
      return
    }
    if (route === 'POST /respond') {
      let raw = ''
      req.on('data', (c) => { raw += c })
      req.on('end', () => {
        let body
        try { body = JSON.parse(raw || '{}') } catch { send(res, 400, { error: 'API 400: invalid json' }); return }
        if (!body || typeof body !== 'object') { send(res, 400, { error: 'API 400: invalid body' }); return }
        auth.respond({ model: body.model, instructions: body.instructions, input: body.input, images: body.images })
          .then((r) => send(res, 200, r))
          .catch((e) => send(res, failStatus(e?.message), { error: String(e?.message || e) }))
      })
      return
    }
    send(res, 404, { error: 'not found' })
  }
}
