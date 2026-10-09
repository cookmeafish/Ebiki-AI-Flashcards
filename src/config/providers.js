// ── OpenAI-compatible chat completions (OpenAI, xAI/Grok, anything else that
//    speaks that dialect) ───────────────────────────────────────────────────
//
// TOKEN PARAMETER. OpenAI RETIRED `max_tokens` on its newer models: the o-series
// and everything from gpt-5 onwards reject it outright with
//     400 Unsupported parameter: 'max_tokens' is not supported with this model.
//         Use 'max_completion_tokens' instead.
// That is the error that broke Discover the moment the model advisor picked a
// current model. Verified live against a real account across the whole range -
// gpt-3.5-turbo, gpt-4, gpt-4o-mini, gpt-4.1, o1, o3-mini, o4-mini, gpt-5.4,
// gpt-5.6 - and `max_completion_tokens` is accepted by EVERY one of them, while
// `max_tokens` fails on everything gpt-5 and newer. So the modern name is what
// we send; there is no model left that needs the old one.
//
// The FALLBACK is for the OTHER servers speaking this dialect: xAI, and any
// local or third-party endpoint, may still only know the old name. Rather than
// keep a hardcoded table of who supports what - which is exactly what left the
// app broken here - a 400 that names the parameter is retried once with the old
// one. Self-healing, and correct for endpoints that do not exist yet.
//
// EMPTY REPLIES. A reasoning model spends the SAME budget on hidden reasoning
// BEFORE it writes anything, so too small a cap comes back with
// finish_reason:"length", content:"" and NO error - a silent failure that reads
// as "the feature is broken" rather than as an API problem. Measured: o4-mini at
// a 16-token cap spent all 16 on reasoning and returned "". One bounded retry on
// a bigger budget covers it, and only ever runs in that case.
// The provider's own error code goes FIRST in the message (`API 429: [RESOURCE_EXHAUSTED] ...`): the body is
// cut to 200 characters, and the code that tells one provider's per-minute limit apart from another's
// empty balance ("insufficient_quota", both worded "You exceeded your current quota") sat past the cut,
// so a rate limit that clears on its own was reported as "out of credits".
function errText(text) {
  const body = String(text || '')
  let tag = ''
  try { const e = JSON.parse(body)?.error; const c = e && (e.status || e.code || e.type); if (typeof c === 'string' && c) tag = `[${c}] ` } catch { /* not JSON */ }
  return tag + body.slice(0, 200)
}
const OPENAI_COMPAT_DEFAULT_TOKENS = 4000
// Every request is bounded. With no limit a stalled connection never answered: the Chat sat on "typing"
// for good (its send lock held, so switching chats was refused too) and a model-list read kept the model
// choice "in flight" until a reload. Generous for real answers (a 20-card deck batch on a slow reasoning
// model takes minutes); an abort lands in the caller's catch like any other failed call.
const CALL_TIMEOUT_MS = 5 * 60 * 1000
const LIST_TIMEOUT_MS = 30 * 1000
const timeoutSignal = (ms) => (typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined)
// Below this, a request is a liveness probe rather than a real answer - see the retry guard.
const MIN_CONTENT_BUDGET = 64

// TOKEN USAGE. Every successful request's usage block is reported to ONE listener (the app's token tracker), so
// every feature on every provider is counted without any caller knowing: retries and probes are real spend too.
// Each provider names the counts differently; thinking/reasoning tokens are billed as output everywhere.
let usageListener = null
export const setUsageListener = (fn) => { usageListener = typeof fn === 'function' ? fn : null }
export function readUsage(provider, raw) {
  let j = null
  try { j = typeof raw === 'string' ? JSON.parse(raw) : raw } catch { return null }
  if (!j || typeof j !== 'object') return null
  const n = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : 0)
  let input = 0, output = 0
  if (provider === 'anthropic') {
    const u = j.usage || {}
    input = n(u.input_tokens) + n(u.cache_creation_input_tokens) + n(u.cache_read_input_tokens)
    output = n(u.output_tokens)
  } else if (provider === 'gemini') {
    const u = j.usageMetadata || {}
    input = n(u.promptTokenCount)
    output = n(u.candidatesTokenCount) + n(u.thoughtsTokenCount)
  } else {
    // OpenAI counts reasoning inside completion_tokens; xAI does NOT (it is only in total_tokens and
    // completion_tokens_details.reasoning_tokens, billed as output): Grok's cost showed a small fraction.
    const u = j.usage || {}
    input = n(u.prompt_tokens ?? u.input_tokens)
    output = Math.max(n(u.completion_tokens ?? u.output_tokens), n(u.total_tokens) - input)
  }
  return input || output ? { input, output } : null
}
function reportUsage(provider, model, raw) {
  if (!usageListener) return
  try { const u = readUsage(provider, raw); if (u) usageListener({ provider, model: String(model || ''), ...u }) } catch { /* never breaks a call */ }
}

// The reply TEXT of an OpenAI-compatible message. Some compatible endpoints send `content` as a list of parts
// ([{type:'text', text}]) instead of a string: returned as is, a caller's String(reply) read "[object Object]" and a
// fight's verdict was unreadable. Reasoning models served through such an endpoint may also put their thinking in the
// content as a leading <think>...</think> block: dropped, so a JSON draft inside it is never read as the answer.
function replyText(content) {
  const text = Array.isArray(content)
    ? content.map((p) => (typeof p === 'string' ? p : p && (p.type === 'text' || p.type === 'output_text') && typeof p.text === 'string' ? p.text : '')).join('')
    : typeof content === 'string' ? content : ''
  return text.replace(/^\s*<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>\s*/i, '')
}

// A 400 saying the model takes no system role / system instruction (OpenAI-style role errors, Gemini's
// "Developer instruction is not enabled"). Never a size or parameter error that merely quotes a message.
export const systemRoleRefused = (text) => {
  const t = String(text || '')
  return (/role/i.test(t) && /'?system'?/i.test(t) && /unsupported|not supported|does not support|invalid|not allowed|unknown/i.test(t))
    || /(developer|system)[ _]instruction[s]? (is |are )?not (enabled|supported)/i.test(t)
}

const foldedPrompt = (systemPrompt, userContent) => `${systemPrompt}\n\n${userContent}`

// A model that cannot read images (an older or text-only model picked for an image job): the provider says so in a
// 4xx ("image_url is only supported by certain models", "does not support image input"). aiCall moves the request to
// a vision model on this (and only this) refusal. Never a size or format complaint about an image the model CAN read.
export const imageInputRefused = (msg) => {
  const t = String(msg || '')
  return /\bAPI 4\d\d\b/.test(t) && /image|vision|multimodal|multi-modal/i.test(t)
    && /not support|unsupported|only supported|does not support|doesn't support|not enabled|invalid content type|not allowed|cannot (?:read|process|accept)|no vision/i.test(t)
    && !/too (?:large|big)|exceeds|maximum (?:size|allowed)|dimensions|media type/i.test(t)
}

// A real call (not a liveness probe) whose reply has no text at all: an error, never "". Returned empty, Chat saved a
// blank bubble, a quiz read "no questions" and a grader read "no verdict" from a model that simply said nothing.
const EMPTY_REPLY = 'API 200: empty (no text in the reply)'

// A model served ONLY by OpenAI's Responses API (the "-pro" and codex models): Chat Completions answers 404/400
// "This model is only supported in v1/responses and not in v1/chat/completions". They are in the provider's model
// list, so a user can pick one for any job; the call is re-sent through the Responses API instead.
const responsesOnly = (status, text) => (status === 404 || status === 400)
  && /v1\/responses|responses api|only supported in (?:the )?(?:v1\/)?responses/i.test(String(text || ''))

async function openAiCompatibleCall({ provider = 'openai', endpoint, apiKey, systemPrompt, userContent, model, images, maxTokens }) {
  const userMsg = (images && images.length)
    ? [
        { type: 'text', text: userContent },
        ...images.map((im) => ({ type: 'image_url', image_url: { url: `data:${im.mediaType};base64,${im.base64}` } })),
      ]
    : userContent
  // SYSTEM ROLE. A model or endpoint without a system role (an older reasoning model: "Unsupported value:
  // 'messages[0].role' does not support 'system' with this model"; chat templates of some local models) refused
  // every call. Healed like the token parameter: once refused, the instructions ride at the top of the user turn.
  let foldSystem = false
  const messagesFor = () => (foldSystem
    ? [{ role: 'user', content: Array.isArray(userMsg)
        ? [{ type: 'text', text: foldedPrompt(systemPrompt, userContent) }, ...userMsg.slice(1)]
        : foldedPrompt(systemPrompt, userContent) }]
    : [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }])

  const post = async (tokenParam, budget) => {
    const resp = await fetch(endpoint, {
      method: 'POST', signal: timeoutSignal(CALL_TIMEOUT_MS),
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      // No forced response_format: JSON-expecting prompts already say "output JSON" and
      // parseAiJson() extracts it - while forcing json_object breaks free-form chat/help
      // (and errors unless the prompt contains the word "json"). Mirrors Claude's behavior.
      body: JSON.stringify({ model, [tokenParam]: budget, messages: messagesFor() }),
    })
    const text = await resp.text()
    if (resp.ok) reportUsage(provider, model, text)
    return { ok: resp.ok, status: resp.status, text }
  }

  const budget = maxTokens || OPENAI_COMPAT_DEFAULT_TOKENS
  // One step up, bounded, for the two ways a reasoning model can exhaust its budget.
  // `let`: once the model names its output cap, no later retry may ask past it (it only met the cap error again).
  let roomier = Math.min(Math.max(budget * 4, 4000), 32000)
  let tokenParam = 'max_completion_tokens'
  let r = await post(tokenParam, budget)
  if (!r.ok && responsesOnly(r.status, r.text) && /\/chat\/completions$/.test(endpoint)) {
    return responsesApiCall({ provider, endpoint: endpoint.replace(/\/chat\/completions$/, '/responses'), apiKey, systemPrompt, userContent, model, images, budget })
  }

  // An endpoint that predates the rename (xAI, a local server) rejects the new name.
  // Only when the NAME is refused: "max_completion_tokens is too large ... at most 4096" also names it, and the
  // retry with max_tokens failed the same way (and hid the real error on newer models).
  if (!r.ok && r.status === 400 && /max_completion_tokens/.test(r.text) && /unsupported|unrecognized|unknown|not supported|extra (inputs|fields)|not permitted/i.test(r.text)) {
    tokenParam = 'max_tokens'
    r = await post(tokenParam, budget)
  }

  if (!r.ok && r.status === 400 && systemRoleRefused(r.text)) {
    foldSystem = true
    r = await post(tokenParam, budget)
  }

  let sent = budget // the budget of the request that produced `r`
  // OVER THIS MODEL'S OUTPUT CAP: "max_tokens is too large: 6000. This model supports at most 4096 completion
  // tokens" (OpenAI; other compatible endpoints word it alike). Retry once at the number the error names, the
  // same heal as Anthropic's cap below (it goes DOWN). Without it every feature asking for more than an older
  // model's cap (Picture 8000, bulk edit 8000, workouts 6000) failed outright on that model.
  const cap = !r.ok && r.status === 400 && /too large|exceeds|greater than|at most|maximum/i.test(r.text)
    ? Number((r.text.match(/(?:at most|maximum(?: of| is)?|up to|limit(?: is| of)?)\s+(\d{2,6})\s+(?:completion |output )?tokens/i) || [])[1])
    : 0
  if (cap && cap < sent && cap >= MIN_CONTENT_BUDGET) {
    r = await post(tokenParam, cap)
    sent = cap
    roomier = Math.min(roomier, cap)
  }
  // BUDGET EXHAUSTED, ERROR FORM. The same underlying situation as the empty-content case below,
  // but OpenAI reports it two different ways depending on the request - measured live: o4-mini with
  // no system message returns 200 + content:"" + finish:"length", while the SAME call WITH a system
  // message (which is every call Ebiki makes) returns
  //   400 Could not finish the message because max_tokens or model output limit was reached.
  //       Please try again with higher max_tokens.
  // Handling only the 200 form left every real feature call still broken on reasoning models.
  // Note this asks for MORE room, the opposite of Anthropic's over-the-cap 400, which asks for less.
  if (!r.ok && r.status === 400 && /output limit was reached|higher max_tokens/i.test(r.text)
      && budget >= MIN_CONTENT_BUDGET && roomier > budget) {
    r = await post(tokenParam, roomier)
    sent = roomier
  }
  // Error text keeps the `API <status>: <body>` shape on purpose - healRetiredModel,
  // tryModelFailover and probeModel all read the status back out of this message.
  if (!r.ok) throw new Error(`API ${r.status}: ${errText(r.text)}`)

  const read = (raw) => {
    try {
      const j = JSON.parse(raw)
      const choice = j.choices?.[0]
      const refusal = typeof choice?.message?.refusal === 'string' ? choice.message.refusal.trim() : ''
      const reasoning = Number(j.usage?.completion_tokens_details?.reasoning_tokens ?? j.usage?.output_tokens_details?.reasoning_tokens) || 0
      return { content: replyText(choice?.message?.content), finish: choice?.finish_reason, refusal, reasoning }
    } catch { return { content: '', finish: null, refusal: '', reasoning: 0 } }
  }
  let { content, finish, refusal, reasoning } = read(r.text)
  // CUT OFF BY ITS OWN REASONING: some text, finish "length", and reasoning took the budget (a 600-token Help reply on
  // a reasoning model: 450 thinking, 150 written, shown as if complete). One retry with room; kept only if it has text.
  if (content && finish === 'length' && reasoning > 0 && budget >= MIN_CONTENT_BUDGET && roomier > sent) {
    try {
      const retry = await post(tokenParam, roomier)
      if (retry.ok) { const got = read(retry.text); if (got.content) { content = got.content; finish = got.finish } }
    } catch { /* keep the cut reply */ }
  }

  // MIN_CONTENT_BUDGET keeps probeModel out of this. It calls with maxTokens=4 purely to see
  // whether a model answers at all, and "Test connections" probes the ENTIRE catalog (71 models on
  // a real OpenAI account) - so without the floor, every reasoning model in the list would trigger
  // a second, 4000-token call just to be told what the probe already knew. No real feature asks for
  // fewer than 64 tokens.
  // BUDGET EXHAUSTED, SILENT FORM: 200 OK, finish_reason "length", content "". No error at all,
  // so without this the feature just looks broken.
  // Against the budget actually SENT: after the error-form retry above, comparing with the original budget
  // posted the identical roomier request a second time (up to 32k more reasoning tokens) and then failed anyway.
  if (!content && finish === 'length' && budget >= MIN_CONTENT_BUDGET && roomier > sent) {
    const retry = await post(tokenParam, roomier)
    // A failed or still-empty retry is an ERROR, not "": returned empty, chat saved a blank Ebi bubble.
    if (!retry.ok) throw new Error(`API ${retry.status}: ${errText(retry.text)}`)
    content = read(retry.text).content
    if (!content) throw new Error('API 200: empty (output limit reached)')
  }
  // Still empty at the largest budget (the error-form retry already sent it): an error, never "".
  if (!content && finish === 'length' && budget >= MIN_CONTENT_BUDGET) throw new Error('API 200: empty (output limit reached)')
  // A content-filtered reply is 200 with no text. Returned as "", chat showed and SAVED a blank Ebi
  // bubble and other features read it as "no result". Status 200 in the message keeps it out of the
  // retired-model heal and the failover (the model answered; the request was refused).
  if (!content && finish === 'content_filter') throw new Error('API 200: blocked (content_filter)')
  // A REFUSAL is the other empty-200 form: content null, a `refusal` message, finish_reason "stop".
  if (!content && refusal) throw new Error(`API 200: blocked (refusal: ${refusal.slice(0, 120)})`)
  if (!content && budget >= MIN_CONTENT_BUDGET) throw new Error(EMPTY_REPLY)
  return content
}

// OpenAI's RESPONSES API, for the models Chat Completions refuses (see responsesOnly). Same contract as
// openAiCompatibleCall: text out, the same budget heal, blocked/empty replies are errors.
// Reply: { status: 'completed'|'incomplete', incomplete_details: { reason }, output: [{ type: 'reasoning' }, { type:
// 'message', content: [{ type: 'output_text', text } | { type: 'refusal', refusal }] }], usage: { input_tokens, ... } }.
async function responsesApiCall({ provider, endpoint, apiKey, systemPrompt, userContent, model, images, budget }) {
  const content = [
    { type: 'input_text', text: userContent },
    ...((images && images.length) ? images.map((im) => ({ type: 'input_image', image_url: `data:${im.mediaType};base64,${im.base64}` })) : []),
  ]
  // The Responses API refuses max_output_tokens below 16 (a liveness probe sends 4).
  const post = async (n) => {
    const resp = await fetch(endpoint, {
      method: 'POST', signal: timeoutSignal(CALL_TIMEOUT_MS),
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model, instructions: systemPrompt, input: [{ role: 'user', content }], max_output_tokens: Math.max(16, n) }),
    })
    const text = await resp.text()
    if (resp.ok) reportUsage(provider, model, text)
    return { ok: resp.ok, status: resp.status, text }
  }
  const read = (raw) => {
    try {
      const j = JSON.parse(raw)
      let text = '', refusal = ''
      if (typeof j.output_text === 'string') text = j.output_text
      else {
        for (const item of Array.isArray(j.output) ? j.output : []) {
          if (item?.type !== 'message' || !Array.isArray(item.content)) continue
          for (const c of item.content) {
            if (c?.type === 'output_text' && typeof c.text === 'string') text += c.text
            else if (c?.type === 'refusal' && typeof c.refusal === 'string') refusal += c.refusal
          }
        }
      }
      return { text, refusal: refusal.trim(), reason: j.status === 'incomplete' ? String(j.incomplete_details?.reason || '') : '' }
    } catch { return { text: '', refusal: '', reason: '' } }
  }
  const r = await post(budget)
  if (!r.ok) throw new Error(`API ${r.status}: ${errText(r.text)}`)
  let got = read(r.text)
  const roomier = Math.min(Math.max(budget * 4, 4000), 32000)
  // Reasoning spent the budget (no text, or text cut short): one roomier retry, as on Chat Completions. A cut reply
  // is kept when the retry fails.
  if (got.reason === 'max_output_tokens' && budget >= MIN_CONTENT_BUDGET && roomier > budget) {
    const retry = await post(roomier).catch((e) => { if (!got.text) throw e; return null })
    if (retry?.ok) { const g2 = read(retry.text); if (g2.text || !got.text) got = g2 }
    else if (retry && !got.text) throw new Error(`API ${retry.status}: ${errText(retry.text)}`)
  }
  if (!got.text && got.reason === 'content_filter') throw new Error('API 200: blocked (content_filter)')
  if (!got.text && got.refusal) throw new Error(`API 200: blocked (refusal: ${got.refusal.slice(0, 120)})`)
  if (!got.text && got.reason === 'max_output_tokens' && budget >= MIN_CONTENT_BUDGET) throw new Error('API 200: empty (output limit reached)')
  if (!got.text && budget >= MIN_CONTENT_BUDGET) throw new Error(EMPTY_REPLY)
  return got.text
}

// A key that carries ANOTHER provider's longer prefix ("sk-ant-" also starts with OpenAI's "sk-"): pasted in the
// wrong tab it passed the prefix check and went to that provider's API, and was stored under it.
// Returns that provider's config (for its label), or null.
export const keyOfOtherProvider = (providerConfig, key) => Object.values(PROVIDERS).find((p) => p !== providerConfig && p.keyPrefix
  && p.keyPrefix.length > String(providerConfig?.keyPrefix || '').length && String(key || '').startsWith(p.keyPrefix)) || null

export const PROVIDERS = {
  anthropic: {
    label: 'Anthropic (Claude)',
    placeholder: 'sk-ant-...',
    keyPrefix: 'sk-ant-',
    color: '#d2a8ff',
    url: 'https://console.anthropic.com/settings/keys',
    modelsUrl: 'https://docs.anthropic.com/en/docs/about-claude/models/overview',
    billingUrl: 'https://console.anthropic.com/settings/plans',
    model: 'claude-haiku-4-5-20251001',
    questionModel: 'claude-sonnet-5',
    // Intelligence presets — every feature uses one of these (Normal = balanced, Max = most capable).
    // These are only the FLOOR. modelPresets (App.jsx) overrides them with whatever the provider's
    // live list says is newest in the same family, so a stale constant here can no longer pin the
    // whole app to an old model the way claude-opus-4-8 did after claude-opus-5 shipped.
    // Three tiers. cheap = fast/low-cost (Haiku slot), normal = balanced, max = strongest. The
    // Optimized intelligence preset assigns each role a tier (see ROLE_TIER in App.jsx).
    presets: { cheap: 'claude-haiku-4-5', normal: 'claude-sonnet-5', max: 'claude-opus-5' },
    // List the model ids currently offered by the provider (newest first).
    listModels: async (apiKey) => {
      const resp = await fetch('https://api.anthropic.com/v1/models?limit=1000', {
        signal: timeoutSignal(LIST_TIMEOUT_MS),
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      })
      if (!resp.ok) throw new Error(`API ${resp.status}: ${errText(await resp.text())}`)
      const data = await resp.json()
      return (data.data || []).map((m) => m.id).filter(Boolean)
    },
    call: async (apiKey, systemPrompt, userContent, modelOverride, images, maxTokens) => {
      // When images are present, send a multimodal content array (images first, then text).
      const content = (images && images.length)
        ? [
            ...images.map((im) => ({ type: 'image', source: { type: 'base64', media_type: im.mediaType, data: im.base64 } })),
            { type: 'text', text: userContent },
          ]
        : userContent
      const post = async (budget) => {
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST', signal: timeoutSignal(CALL_TIMEOUT_MS),
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: modelOverride || 'claude-haiku-4-5-20251001',
            max_tokens: budget,
            system: systemPrompt,
            messages: [{ role: 'user', content }],
          }),
        })
        const text = await r.text()
        if (r.ok) reportUsage('anthropic', modelOverride || 'claude-haiku-4-5-20251001', text)
        return { ok: r.ok, status: r.status, text }
      }

      // Anthropic caps max_tokens PER MODEL and rejects anything over it with
      //   400 max_tokens: 8000 > 4096, which is the maximum allowed number of output tokens
      //       for claude-3-haiku-20240307
      // Ebiki asks for 8000 on the vision and long-JSON roles, which every current Claude model
      // allows - but a user is free to pick an older one in Settings > AI models, and then every
      // one of those roles fails. The cap is stated IN the error, so rather than carrying a
      // per-model table that goes stale, the request is retried once at the number the API itself
      // named. Same self-healing shape as the OpenAI token-parameter fallback above.
      const budget = maxTokens || 4000
      let r = await post(budget)
      let sent = budget
      if (!r.ok && r.status === 400 && /max_tokens/.test(r.text)) {
        const cap = Number((r.text.match(/>\s*(\d+)/) || [])[1])
        // Only DOWN: the context-overflow error also names max_tokens ("195000 + 8000 > 200000") and its
        // number is the context size, so retrying at it asked for 200000 output tokens and showed a
        // confusing cap error instead of the real "input too long" one.
        if (cap > 0 && cap < budget) { r = await post(cap); sent = cap }
      }
      if (!r.ok) throw new Error(`API ${r.status}: ${errText(r.text)}`)
      let body = null
      try { body = JSON.parse(r.text) } catch { body = null }
      // Only `text` blocks: a model that thinks returns `thinking` / `redacted_thinking` blocks first, never the answer.
      const textOf = (b) => b?.content?.map?.((c) => (c?.type === 'text' ? c.text || '' : '')).join('') || ''
      let out = textOf(body)
      // CUT OFF BY ITS OWN THINKING (a model that thinks by default): some text, stop_reason "max_tokens", and a
      // thinking block took part of the budget. One roomier retry, kept only when it has text (the other providers
      // do the same; a short Help reply was shown cut mid-sentence as if complete).
      const thought = (b) => Array.isArray(b?.content) && b.content.some((c) => c?.type === 'thinking' || c?.type === 'redacted_thinking')
      if (out && body?.stop_reason === 'max_tokens' && thought(body) && budget >= MIN_CONTENT_BUDGET && sent === budget) {
        const roomier = Math.min(Math.max(budget * 4, 4000), 32000)
        if (roomier > sent) {
          try {
            const retry = await post(roomier)
            if (retry.ok) { const b2 = JSON.parse(retry.text); const t2 = textOf(b2); if (t2) { out = t2; body = b2 } }
          } catch { /* keep the cut reply */ }
        }
      }
      // EVERYTHING SPENT ON THINKING (a model that thinks by default, the same budget for both): 200, stop_reason
      // "max_tokens", no text. The same bounded retry as the other providers; a still-empty reply is an error, never ""
      // (the fight verdict's 120 tokens, a taunt's 160). MIN_CONTENT_BUDGET keeps a liveness probe out of it.
      if (!out && body?.stop_reason === 'max_tokens' && budget >= MIN_CONTENT_BUDGET) {
        const roomier = Math.min(Math.max(budget * 4, 4000), 32000)
        if (roomier > sent && sent === budget) {
          const retry = await post(roomier)
          if (!retry.ok) throw new Error(`API ${retry.status}: ${errText(retry.text)}`)
          try { body = JSON.parse(retry.text) } catch { body = null }
          out = textOf(body)
        }
        if (!out) throw new Error('API 200: empty (output limit reached)')
      }
      // A refusal is 200 + stop_reason "refusal" and no text (see the OpenAI note above).
      if (!out && body?.stop_reason === 'refusal') throw new Error('API 200: blocked (refusal)')
      if (!out && budget >= MIN_CONTENT_BUDGET) throw new Error(EMPTY_REPLY)
      return out
    },
  },
  openai: {
    label: 'OpenAI (GPT)',
    placeholder: 'sk-...',
    keyPrefix: 'sk-',
    color: '#74aa9c',
    url: 'https://platform.openai.com/api-keys',
    modelsUrl: 'https://platform.openai.com/docs/models',
    billingUrl: 'https://platform.openai.com/settings/organization/billing',
    model: 'gpt-4o-mini',       // cheap/fast tier (vision-capable) — matches Claude's Haiku slot
    questionModel: 'gpt-4o',    // strong tier (vision-capable) — matches Claude's Sonnet slot
    presets: { cheap: 'gpt-4o-mini', normal: 'gpt-4o', max: 'gpt-4.1' }, // all vision-capable
    // Only chat-capable models (skip embeddings, tts, whisper, image, moderation).
    listModels: async (apiKey) => {
      const resp = await fetch('https://api.openai.com/v1/models', {
        signal: timeoutSignal(LIST_TIMEOUT_MS),
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })
      if (!resp.ok) throw new Error(`API ${resp.status}: ${errText(await resp.text())}`)
      const data = await resp.json()
      return (data.data || []).map((m) => m.id)
        .filter((id) => (/^(gpt|chatgpt|o\d)/.test(id)) && !/(embedding|audio|tts|whisper|image|realtime|moderation|transcribe|search|dall|instruct)/.test(id))
        .sort()
    },
    call: async (apiKey, systemPrompt, userContent, modelOverride, images, maxTokens) =>
      openAiCompatibleCall({
        endpoint: 'https://api.openai.com/v1/chat/completions',
        apiKey, systemPrompt, userContent, images, maxTokens,
        model: modelOverride || 'gpt-4o-mini',
      }),
  },
  gemini: {
    label: 'Google (Gemini)',
    placeholder: 'AIza...',
    keyPrefix: 'AIza',
    color: '#4285f4',
    url: 'https://aistudio.google.com/apikey',
    modelsUrl: 'https://ai.google.dev/gemini-api/docs/models',
    billingUrl: 'https://aistudio.google.com/apikey',
    model: 'gemini-2.0-flash',      // cheap/fast tier (vision-capable) — Haiku slot
    questionModel: 'gemini-2.5-pro', // strong tier (vision-capable) — Sonnet slot
    presets: { cheap: 'gemini-2.0-flash', normal: 'gemini-2.5-flash', max: 'gemini-2.5-pro' }, // all vision-capable
    // Models that support generateContent; strip the "models/" prefix.
    listModels: async (apiKey) => {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=1000`, { signal: timeoutSignal(LIST_TIMEOUT_MS) })
      if (!resp.ok) throw new Error(`API ${resp.status}: ${errText(await resp.text())}`)
      const data = await resp.json()
      return (data.models || [])
        .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
        .map((m) => (m.name || '').replace(/^models\//, ''))
        .filter((id) => id.includes('gemini'))
        .sort()
    },
    call: async (apiKey, systemPrompt, userContent, modelOverride, images, maxTokens) => {
      // An id copied from Google's own list carries a "models/" prefix ("models/gemini-2.5-pro"): sent as is, the URL
      // named models/models/... and every call 404'd (and the retired-model heal replaced a perfectly good pick).
      const model = String(modelOverride || 'gemini-2.0-flash').trim().replace(/^models\//, '')
      const parts = [
        { text: userContent },
        ...((images && images.length) ? images.map((im) => ({ inline_data: { mime_type: im.mediaType, data: im.base64 } })) : []),
      ]
      // A model without system instructions (a Gemma model typed as a custom id: "Developer instruction is not
      // enabled") refused every call: once refused, the instructions go at the top of the user turn instead.
      let foldSystem = false
      const post = async (budget) => {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST', signal: timeoutSignal(CALL_TIMEOUT_MS),
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...(foldSystem ? {} : { system_instruction: { parts: [{ text: systemPrompt }] } }),
              contents: [{ role: 'user', parts: foldSystem ? [{ text: foldedPrompt(systemPrompt, userContent) }, ...parts.slice(1)] : parts }],
              // No forced responseMimeType: it would break free-form chat/help. JSON roles still
              // work via the prompt + parseAiJson(), like Claude.
              generationConfig: { ...(budget ? { maxOutputTokens: budget } : {}) },
            }),
          }
        )
        const text = await r.text()
        if (r.ok) reportUsage('gemini', model, text)
        return { ok: r.ok, status: r.status, text }
      }
      const read = (raw) => {
        try {
          const j = JSON.parse(raw)
          const c = j.candidates?.[0]
          // A part marked `thought` is the model's thinking (sent when thoughts are included), never the answer.
          return { text: c?.content?.parts?.map((p) => (p?.thought ? '' : p?.text || '')).join('') || '', finish: c?.finishReason, blocked: j.promptFeedback?.blockReason, thoughts: Number(j.usageMetadata?.thoughtsTokenCount) || 0 }
        } catch { return { text: '', finish: null, thoughts: 0 } }
      }

      let budget = maxTokens || 0
      let r = await post(budget)
      if (!r.ok && r.status === 400 && systemRoleRefused(r.text)) { foldSystem = true; r = await post(budget) }
      // OVER THIS MODEL'S OUTPUT CAP ("maxOutputTokens value of 8000 but the supported range is from 1 (inclusive) to
      // 8193 (exclusive)", a Gemma or older model): once more at the number the error names, only ever DOWN.
      if (!r.ok && r.status === 400 && budget && /max_?output_?tokens/i.test(r.text)) {
        const m = r.text.match(/to (\d{2,6}) \(exclusive\)/i) || r.text.match(/(?:at most|maximum(?: of| is| allowed)?|up to|limit(?: is| of)?)\s*:?\s*(\d{2,6})/i)
        const cap = m ? Number(m[1]) - (/exclusive/i.test(m[0]) ? 1 : 0) : 0
        if (cap >= MIN_CONTENT_BUDGET && cap < budget) { budget = cap; r = await post(budget) }
      }
      if (!r.ok) throw new Error(`API ${r.status}: ${errText(r.text)}`)
      let { text, finish, blocked, thoughts } = read(r.text)
      // Cut off by its own thinking (some text, MAX_TOKENS, thoughts used): one roomier retry, kept only with text.
      if (text && finish === 'MAX_TOKENS' && thoughts > 0 && budget >= MIN_CONTENT_BUDGET) {
        const bigger = Math.min(Math.max(budget * 4, 4000), 32000)
        if (bigger > budget) {
          try { const retry = await post(bigger); if (retry.ok) { const got = read(retry.text); if (got.text) { text = got.text; finish = got.finish } } } catch { /* keep the cut reply */ }
        }
      }
      // Gemini's THINKING models (2.5 and later) spend maxOutputTokens on thinking before they
      // write anything, exactly like OpenAI's reasoning models - so a tight budget comes back
      // finishReason:"MAX_TOKENS" with no text and no error. Same bounded one-shot retry, same
      // MIN_CONTENT_BUDGET floor so a liveness probe never triggers it.
      if (!text && finish === 'MAX_TOKENS' && budget >= MIN_CONTENT_BUDGET) {
        const bigger = Math.min(Math.max(budget * 4, 4000), 32000)
        if (bigger > budget) {
          const retry = await post(bigger)
          if (!retry.ok) throw new Error(`API ${retry.status}: ${errText(retry.text)}`) // see openAiCompatibleCall
          text = read(retry.text).text
          if (!text) throw new Error('API 200: empty (output limit reached)')
        } else throw new Error('API 200: empty (output limit reached)') // already at the largest budget
      }
      // NO budget sent (a call without maxTokens) and still cut off with no text: the model's OWN output limit
      // ran out, and there is nothing roomier to ask for. An error, never "" (a blank reply was saved as a
      // bubble). A small explicit budget (probeModel's 4) stays out of this: its "" means "answered".
      if (!text && finish === 'MAX_TOKENS' && !budget) throw new Error('API 200: empty (output limit reached)')
      // Safety blocks are 200 with no text: a blocked PROMPT has no candidates (promptFeedback.blockReason),
      // a blocked ANSWER has finishReason SAFETY/RECITATION/... (see the OpenAI note above).
      if (!text && (blocked || /^(SAFETY|RECITATION|PROHIBITED_CONTENT|BLOCKLIST|SPII|IMAGE_SAFETY)$/.test(String(finish || '')))) {
        throw new Error(`API 200: blocked (${blocked || finish})`)
      }
      if (!text && (!budget || budget >= MIN_CONTENT_BUDGET)) throw new Error(EMPTY_REPLY)
      return text
    },
  },
  grok: {
    label: 'xAI (Grok)',
    placeholder: 'xai-...',
    keyPrefix: 'xai-',
    color: '#e6e6e6',
    url: 'https://console.x.ai/',
    modelsUrl: 'https://docs.x.ai/docs/models',
    billingUrl: 'https://console.x.ai/',
    model: 'grok-3-mini-fast', // cheap/fast tier — Haiku slot
    questionModel: 'grok-4',   // strong tier (multimodal/vision) — Sonnet slot
    presets: { cheap: 'grok-3-mini-fast', normal: 'grok-3', max: 'grok-4' }, // grok-4 is multimodal
    visionTier: 'max', // only the max preset reads images; aiCall moves image requests there
    listModels: async (apiKey) => {
      const resp = await fetch('https://api.x.ai/v1/models', {
        signal: timeoutSignal(LIST_TIMEOUT_MS),
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })
      if (!resp.ok) throw new Error(`API ${resp.status}: ${errText(await resp.text())}`)
      const data = await resp.json()
      return (data.data || []).map((m) => m.id).filter((id) => id.includes('grok')).sort()
    },
    // Same dialect as OpenAI, so the SAME code path - including the token-parameter
    // fallback, which is what makes this correct whether xAI wants the new name or
    // the old one.
    call: async (apiKey, systemPrompt, userContent, modelOverride, images, maxTokens) =>
      openAiCompatibleCall({
        provider: 'grok',
        endpoint: 'https://api.x.ai/v1/chat/completions',
        apiKey, systemPrompt, userContent, images, maxTokens,
        model: modelOverride || 'grok-3-mini-fast',
      }),
  },
}

// Every model id the provider lists, UNFILTERED (speech models included). `listModels` keeps only chat models (the
// advisor, failover and upgrade checks read it), so OpenAI's speech jobs had nothing to pick from. In memory only:
// Settings > Models per job filters this list for its speech rows. Providers without a raw endpoint give their
// normal list.
export async function listAllModels(prov, apiKey, fetchImpl = (...a) => fetch(...a)) {
  if (prov === 'openai') {
    const resp = await fetchImpl('https://api.openai.com/v1/models', {
      signal: timeoutSignal(LIST_TIMEOUT_MS),
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    if (!resp.ok) throw new Error(`API ${resp.status}: ${errText(await resp.text())}`)
    const data = await resp.json()
    return [...new Set((Array.isArray(data?.data) ? data.data : []).map((m) => m?.id).filter((id) => typeof id === 'string' && id))].sort()
  }
  const pc = PROVIDERS[prov]
  return pc?.listModels ? pc.listModels(apiKey) : []
}
