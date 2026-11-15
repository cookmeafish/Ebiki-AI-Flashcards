// "Sign in with ChatGPT" plan usage: the wire protocol (authorize URL, token forms, callback rules, ID token checks,
// the Responses body and stream) and a whole sign-in → request → refresh → sign-out run against a fake OpenAI.
import { describe, it, expect, afterEach } from 'vitest'
import crypto from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'path'
import http from 'http'
import { EventEmitter } from 'events'
import {
  buildAuthorizeUrl, tokenForm, parseCallback, hasPlanScope, verifyIdToken, buildResponsesBody, parseSse, planError,
  shapeModels, publicStatus, pkcePair, createChatgptAuth, createChatgptRoute, FIRST_CLIENT, SCOPES, RESOURCE, PLAN_SCOPE, AUTH_BASE,
  TOKEN_URL, JWKS_URL, RESPONSES_URL, MODELS_URL, OIDC_CONFIG_URL, REFUSED_FIELDS,
} from './chatgptAuth.js'

const b64url = (b) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256', use: 'sig' }
const JWKS = { keys: [jwk] }
const signJwt = (payload, header = { alg: 'RS256', kid: 'k1', typ: 'JWT' }) => {
  const input = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`
  return `${input}.${b64url(crypto.sign('RSA-SHA256', Buffer.from(input), privateKey))}`
}
const claims = (over = {}) => ({ iss: AUTH_BASE, aud: 'oaiapp_123', sub: 'user-1', email: 'a@b.c', exp: Math.floor(Date.now() / 1000) + 3600, nonce: 'n1', ...over })

describe('authorize URL', () => {
  it('first registration uses the dynamic client and names the app; never an id token hint', () => {
    const u = new URL(buildAuthorizeUrl({ clientId: '', hostId: 'urn:uuid:x', redirectUri: 'http://127.0.0.1:1455/auth/callback', state: 's', nonce: 'n', challenge: 'c', idTokenHint: 'old' }))
    expect(u.origin + u.pathname).toBe('https://auth.openai.com/api/accounts/authorize')
    const q = u.searchParams
    expect(q.get('client_id')).toBe(FIRST_CLIENT)
    expect(q.get('agent_name_hint')).toBe('Ebiki')
    expect(q.get('id_token_hint')).toBeNull()
    expect(q.get('scope')).toBe(SCOPES)
    expect(q.get('scope').split(' ')).toContain(PLAN_SCOPE)
    expect(q.get('resource')).toBe(RESOURCE)
    expect(q.get('code_challenge_method')).toBe('S256')
    expect(q.get('response_type')).toBe('code')
    expect(q.get('ext_agent_host_id')).toBe('urn:uuid:x')
  })
  it('a returning sign-in uses the issued client id and the hints', () => {
    const q = new URL(buildAuthorizeUrl({ clientId: 'oaiapp_1', hostId: 'h', redirectUri: 'r', state: 's', nonce: 'n', challenge: 'c', idTokenHint: 'tok', loginHint: 'a@b.c' })).searchParams
    expect(q.get('client_id')).toBe('oaiapp_1')
    expect(q.get('agent_name_hint')).toBeNull()
    expect(q.get('id_token_hint')).toBe('tok')
    expect(q.get('login_hint')).toBe('a@b.c')
  })
  it('PKCE challenge is the S256 of the verifier, base64url without padding', () => {
    const { verifier, challenge } = pkcePair(crypto)
    expect(challenge).toBe(b64url(crypto.createHash('sha256').update(verifier).digest()))
    expect(challenge).not.toMatch(/[=+/]/)
  })
})

describe('token forms', () => {
  it('code grant carries verifier, redirect and resource, no secret', () => {
    const q = new URLSearchParams(tokenForm({ grant: 'code', clientId: 'oaiapp_1', code: 'c', verifier: 'v', redirectUri: 'r' }))
    expect(Object.fromEntries(q)).toEqual({ grant_type: 'authorization_code', client_id: 'oaiapp_1', code: 'c', code_verifier: 'v', redirect_uri: 'r', resource: RESOURCE })
  })
  it('refresh grant keeps the scope (none sent)', () => {
    const q = new URLSearchParams(tokenForm({ grant: 'refresh', clientId: 'oaiapp_1', refreshToken: 'rt' }))
    expect(Object.fromEntries(q)).toEqual({ grant_type: 'refresh_token', client_id: 'oaiapp_1', refresh_token: 'rt', resource: RESOURCE })
  })
})

describe('callback', () => {
  it('refuses a wrong state', () => { expect(parseCallback('?state=x&code=c&client_id=oaiapp_1', { state: 's' }).error).toBe('state') })
  it('a new registration needs the issued client id', () => {
    expect(parseCallback('?state=s&code=c', { state: 's' }).error).toBe('registration')
    expect(parseCallback('?state=s&code=c&client_id=oaiapp_9', { state: 's' })).toMatchObject({ ok: true, clientId: 'oaiapp_9' })
  })
  it('a returning sign-in may omit the client id but never change it', () => {
    expect(parseCallback('?state=s&code=c', { state: 's', savedClientId: 'oaiapp_1' })).toMatchObject({ ok: true, clientId: 'oaiapp_1' })
    expect(parseCallback('?state=s&code=c&client_id=oaiapp_2', { state: 's', savedClientId: 'oaiapp_1' }).error).toBe('registration')
  })
  it('a declined consent is "denied", never exchanged', () => {
    expect(parseCallback('?state=s&error=access_denied', { state: 's' })).toMatchObject({ ok: false, error: 'denied' })
  })
  it('plan usage needs the direct scope', () => {
    expect(hasPlanScope('openid profile email')).toBe(false)
    expect(hasPlanScope(SCOPES)).toBe(true)
  })
})

describe('ID token', () => {
  const opts = { jwks: JWKS, clientId: 'oaiapp_123', nonce: 'n1', crypto }
  it('accepts a good token', () => { expect(verifyIdToken(signJwt(claims()), opts).sub).toBe('user-1') })
  it('refuses a tampered payload', () => {
    const [h, , s] = signJwt(claims()).split('.')
    expect(() => verifyIdToken(`${h}.${b64url(JSON.stringify(claims({ sub: 'evil' })))}.${s}`, opts)).toThrow(/signature/)
  })
  it('refuses alg none / HS256', () => {
    expect(() => verifyIdToken(signJwt(claims(), { alg: 'none', kid: 'k1' }), opts)).toThrow(/alg/)
    expect(() => verifyIdToken(signJwt(claims(), { alg: 'HS256', kid: 'k1' }), opts)).toThrow(/alg/)
  })
  it('refuses wrong issuer, audience, nonce and an expired token', () => {
    expect(() => verifyIdToken(signJwt(claims({ iss: 'https://evil' })), opts)).toThrow(/issuer/)
    expect(() => verifyIdToken(signJwt(claims({ aud: 'other' })), opts)).toThrow(/audience/)
    expect(() => verifyIdToken(signJwt(claims({ nonce: 'x' })), opts)).toThrow(/nonce/)
    expect(() => verifyIdToken(signJwt(claims({ exp: 1000 })), opts)).toThrow(/expired/)
  })
  it('refuses an unknown key id', () => { expect(() => verifyIdToken(signJwt(claims(), { alg: 'RS256', kid: 'zz' }), opts)).toThrow(/key/) })
})

describe('Responses body and stream', () => {
  it('instructions, one user turn, store false, stream true, none of the refused fields', () => {
    const b = buildResponsesBody({ model: 'm', instructions: 'be nice', input: 'hi', images: [{ mediaType: 'image/png', base64: 'AAAA' }, { mediaType: 'text/html', base64: 'x' }] })
    expect(b).toEqual({
      model: 'm', store: false, stream: true, instructions: 'be nice',
      input: [{ role: 'user', content: [{ type: 'input_image', image_url: 'data:image/png;base64,AAAA' }, { type: 'input_text', text: 'hi' }] }],
    })
    for (const f of REFUSED_FIELDS) expect(b).not.toHaveProperty(f)
    expect(JSON.stringify(b)).not.toMatch(/"role":"system"/)
  })
  const sse = (...evs) => evs.map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join('')
  it('joins the deltas; success only with response.completed', () => {
    const ok = parseSse(sse({ type: 'response.output_text.delta', delta: 'Hel' }, { type: 'response.output_text.delta', delta: 'lo' }, { type: 'response.completed', response: { usage: { input_tokens: 3, output_tokens: 2 } } }))
    expect(ok).toMatchObject({ text: 'Hello', completed: true, usage: { input_tokens: 3, output_tokens: 2 } })
    expect(parseSse(sse({ type: 'response.output_text.delta', delta: 'Hel' })).completed).toBe(false)
  })
  it('a failed stream carries its code', () => {
    const r = parseSse(sse({ type: 'response.failed', response: { error: { code: 'subscription_sharing_usage_limit_exceeded', message: 'limit' } } }))
    expect(r).toMatchObject({ completed: false, error: { code: 'subscription_sharing_usage_limit_exceeded' } })
  })
  it('errors keep the app\'s "API <status>:" shape', () => {
    expect(planError(429, JSON.stringify({ error: { code: 'subscription_sharing_usage_limit_exceeded', message: 'Limit' } }))).toBe('API 429: subscription_sharing_usage_limit_exceeded Limit')
    expect(planError(401, JSON.stringify({ detail: 'nope' }))).toBe('API 401: nope')
  })
  it('models: only visibility "list", in order', () => {
    expect(shapeModels({ models: [{ slug: 'a', display_name: 'A', visibility: 'list' }, { slug: 'b', visibility: 'hide' }, { slug: 'c', visibility: 'list' }] }).map((m) => m.id)).toEqual(['a', 'c'])
  })
  it('the page status never carries a token', () => {
    const s = publicStatus({ sub: 'u', refreshToken: 'SECRET', accessToken: 'SECRET2', idToken: 'SECRET3', scopes: SCOPES.split(' '), email: 'a@b.c' }, null)
    expect(s).toMatchObject({ signedIn: true, planUsage: true, email: 'a@b.c' })
    expect(JSON.stringify(s)).not.toMatch(/SECRET/)
  })
})

// ─── A whole run against a fake OpenAI ─────────────────────────────────────────────────────────────────────────
describe('sign-in, request, refresh, sign-out (fake OpenAI)', () => {
  let dir
  afterEach(() => { if (dir) fs.rmSync(dir, { recursive: true, force: true }); dir = null })

  const setup = ({ scope = SCOPES } = {}) => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ebiki-siwc-'))
    const file = path.join(dir, 'chatgpt-auth.json')
    const calls = []
    let nonce = ''
    let refreshN = 0
    let respondStatus = 200
    const fakeFetch = async (url, init = {}) => {
      calls.push({ url, init })
      const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } })
      if (url === TOKEN_URL) {
        const q = new URLSearchParams(init.body)
        if (q.get('grant_type') === 'refresh_token') {
          if (q.get('refresh_token') === 'dead') return json({ error: 'invalid_grant' }, 400)
          refreshN++
          return json({ access_token: `at${refreshN + 1}`, refresh_token: `rt${refreshN + 1}`, expires_in: 3600, scope })
        }
        return json({ access_token: 'at1', refresh_token: 'rt1', id_token: signJwt(claims({ aud: q.get('client_id'), nonce })), expires_in: 3600, scope })
      }
      if (url === JWKS_URL) return json(JWKS)
      if (url === MODELS_URL) return json({ models: [{ slug: 'gpt-x', display_name: 'GPT X', visibility: 'list' }] })
      if (url === OIDC_CONFIG_URL) return json({ revocation_endpoint: 'https://auth.openai.com/oauth/revoke' })
      if (url === 'https://auth.openai.com/oauth/revoke') return new Response('', { status: 200 })
      if (url === RESPONSES_URL) {
        if (respondStatus !== 200) return json({ error: { code: 'subscription_sharing_usage_limit_exceeded', message: 'Limit' } }, respondStatus)
        const body = `data: ${JSON.stringify({ type: 'response.output_text.delta', delta: 'ok' })}\n\ndata: ${JSON.stringify({ type: 'response.completed', response: { usage: { input_tokens: 1, output_tokens: 1 } } })}\n\n`
        return new Response(body, { status: 200 })
      }
      throw new Error('unexpected ' + url)
    }
    const port = 20000 + Math.floor(Math.random() * 20000)
    const auth = createChatgptAuth({
      file, fs, http, crypto, fetch: fakeFetch,
      writeFileAtomic: (f, d) => { fs.writeFileSync(f + '.tmp', d); fs.renameSync(f + '.tmp', f) },
      readUtf8: (f) => fs.readFileSync(f, 'utf8'),
      ports: { first: [port], later: [port] },
    })
    return { auth, file, calls, setNonce: (n) => { nonce = n }, setRespondStatus: (s) => { respondStatus = s } }
  }
  const getUrl = (u) => new Promise((resolve, reject) => { http.get(u, (res) => { let b = ''; res.on('data', (c) => { b += c }); res.on('end', () => resolve({ status: res.statusCode, body: b })) }).on('error', reject) })

  it('signs in, answers on the plan, refreshes, and signs out without leaking a token to the page', async () => {
    const { auth, file, calls, setNonce } = setup()
    const url = new URL(await auth.start())
    expect(auth.status()).toMatchObject({ signedIn: false, pending: true })
    setNonce(url.searchParams.get('nonce'))
    const cb = new URL(url.searchParams.get('redirect_uri'))
    expect(cb.hostname).toBe('127.0.0.1')
    // a stray request with the wrong state does not end the attempt
    expect((await getUrl(`${cb.href}?state=wrong&code=x&client_id=oaiapp_123`)).status).toBe(400)
    const done = await getUrl(`${cb.href}?state=${url.searchParams.get('state')}&code=thecode&client_id=oaiapp_123&scope=${encodeURIComponent(SCOPES)}`)
    expect(done.status).toBe(200)
    const st = auth.status()
    expect(st).toMatchObject({ signedIn: true, planUsage: true, email: 'a@b.c', pending: false })
    expect(JSON.stringify(st)).not.toMatch(/at1|rt1/)
    expect(JSON.parse(fs.readFileSync(file, 'utf8'))).toMatchObject({ clientId: 'oaiapp_123', sub: 'user-1', accessToken: 'at1' })

    const r = await auth.respond({ model: 'auto', instructions: 'sys', input: 'hi' })
    expect(r).toMatchObject({ text: 'ok', model: 'gpt-x' })
    const sent = calls.find((c) => c.url === RESPONSES_URL)
    expect(sent.init.headers.Authorization).toBe('Bearer at1')
    expect(JSON.parse(sent.init.body)).toMatchObject({ model: 'gpt-x', instructions: 'sys', store: false, stream: true })

    // an access token near its end is refreshed (rotated) once, even for two requests at the same time
    const rec = JSON.parse(fs.readFileSync(file, 'utf8')); rec.expiresAt = Date.now(); fs.writeFileSync(file, JSON.stringify(rec))
    await Promise.all([auth.respond({ model: 'gpt-x', input: 'a' }), auth.respond({ model: 'gpt-x', input: 'b' })])
    expect(calls.filter((c) => c.url === TOKEN_URL && /refresh_token/.test(c.init.body))).toHaveLength(1)
    expect(JSON.parse(fs.readFileSync(file, 'utf8'))).toMatchObject({ accessToken: 'at2', refreshToken: 'rt2' })

    expect(await auth.signOut()).toEqual({ ok: true, revoked: true })
    const after = JSON.parse(fs.readFileSync(file, 'utf8'))
    expect(after).toMatchObject({ clientId: 'oaiapp_123', email: 'a@b.c' })
    expect(after.refreshToken).toBeUndefined()
    expect(after.accessToken).toBeUndefined()
    expect(auth.status().signedIn).toBe(false)
  })

  it('a sign-in without the plan scope is signed in but has no plan usage', async () => {
    const { auth, setNonce } = setup({ scope: 'openid profile email offline_access' })
    const url = new URL(await auth.start())
    setNonce(url.searchParams.get('nonce'))
    await getUrl(`${url.searchParams.get('redirect_uri')}?state=${url.searchParams.get('state')}&code=c&client_id=oaiapp_123`)
    expect(auth.status()).toMatchObject({ signedIn: true, planUsage: false, error: 'noPlan' })
  })

  it('a refused refresh signs out and asks to sign in again; the limit error keeps its code', async () => {
    const { auth, file, setRespondStatus } = setup()
    fs.writeFileSync(file, JSON.stringify({ hostId: 'h', clientId: 'oaiapp_123', sub: 'u', refreshToken: 'dead', accessToken: 'x', expiresAt: 0, scopes: SCOPES.split(' ') }))
    await expect(auth.respond({ model: 'gpt-x', input: 'a' })).rejects.toThrow(/^API 401: signed_out/)
    expect(auth.status()).toMatchObject({ signedIn: false, needsSignIn: true })
    fs.writeFileSync(file, JSON.stringify({ hostId: 'h', clientId: 'oaiapp_123', sub: 'u', refreshToken: 'rt', accessToken: 'x', expiresAt: Date.now() + 3600e3, scopes: SCOPES.split(' ') }))
    setRespondStatus(429)
    await expect(auth.respond({ model: 'gpt-x', input: 'a' })).rejects.toThrow('API 429: subscription_sharing_usage_limit_exceeded Limit')
  })

  it('a lost grant (needsSignIn) is not "signed in", even with tokens left in the file', () => {
    expect(publicStatus({ sub: 'u', refreshToken: 'rt', scopes: SCOPES.split(' '), needsSignIn: true }, null)).toMatchObject({ signedIn: false, planUsage: false, needsSignIn: true })
  })

  it('a refresh refused because ANOTHER server already rotated the token uses that token instead of signing out', async () => {
    const { auth, file } = setup()
    // this server read 'dead' (refused as reused); meanwhile the other server wrote rt9/at9
    fs.writeFileSync(file, JSON.stringify({ hostId: 'h', clientId: 'oaiapp_123', sub: 'u', refreshToken: 'dead', accessToken: 'x', expiresAt: 0, scopes: SCOPES.split(' ') }))
    const realRead = fs.readFileSync
    let reads = 0
    const spy = (f, ...a) => { if (String(f) === file && ++reads > 1) return JSON.stringify({ hostId: 'h', clientId: 'oaiapp_123', sub: 'u', refreshToken: 'rt9', accessToken: 'at9', expiresAt: Date.now() + 3600e3, scopes: SCOPES.split(' ') }); return realRead(f, ...a) }
    fs.readFileSync = spy
    try { await expect(auth.respond({ model: 'gpt-x', input: 'a' })).resolves.toMatchObject({ text: 'ok' }) } finally { fs.readFileSync = realRead }
  })

  it('a busy callback port is reported as "port", and the scope can come from the access token', async () => {
    const blocker = http.createServer()
    const port = await new Promise((r) => blocker.listen(0, '127.0.0.1', () => r(blocker.address().port)))
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ebiki-siwc-'))
    const auth = createChatgptAuth({ file: path.join(dir, 'a.json'), fs, http, crypto, readUtf8: (f) => fs.readFileSync(f, 'utf8'), ports: { first: [port], later: [port] }, fetch: async () => { throw new Error('no') } })
    await expect(auth.start()).rejects.toThrow()
    expect(auth.status()).toMatchObject({ pending: false, error: 'port' })
    blocker.close()
    const at = signJwt({ scope: SCOPES })
    const { accessTokenScopes } = await import('./chatgptAuth.js')
    expect(hasPlanScope(accessTokenScopes(at))).toBe(true)
    expect(accessTokenScopes('not-a-jwt')).toEqual([])
  })

  it('the route never hands out tokens and maps errors to their status', async () => {
    const { auth, file } = setup()
    fs.writeFileSync(file, JSON.stringify({ hostId: 'h', clientId: 'oaiapp_123', sub: 'u', email: 'a@b.c', refreshToken: 'SECRET', accessToken: 'SECRET', expiresAt: Date.now() + 3600e3, scopes: SCOPES.split(' ') }))
    const route = createChatgptRoute({ auth })
    const run = (method, url, body) => new Promise((resolve) => {
      const req = Object.assign(new EventEmitter(), { method, url })
      const res = { statusCode: 200, headers: {}, writableEnded: false, setHeader(k, v) { this.headers[k] = v }, end(b) { this.writableEnded = true; resolve({ status: this.statusCode, body: b, headers: this.headers }) } }
      route(req, res)
      if (body !== undefined) { req.emit('data', JSON.stringify(body)); req.emit('end') }
    })
    const s = await run('GET', '/status')
    expect(s.body).not.toMatch(/SECRET/)
    expect(JSON.parse(s.body)).toMatchObject({ signedIn: true, planUsage: true })
    const ok = await run('POST', '/respond', { model: 'gpt-x', instructions: 'i', input: 'x' })
    expect(JSON.parse(ok.body).text).toBe('ok')
    expect((await run('GET', '/nope')).status).toBe(404)
  })
})
