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

async function openAiCompatibleCall({ provider = 'openai', endpoint, apiKey, systemPrompt, userContent, model, images, maxTokens }) {
  const userMsg = (images && images.length)
    ? [
        { type: 'text', text: userContent },
        ...images.map((im) => ({ type: 'image_url', image_url: { url: `data:${im.mediaType};base64,${im.base64}` } })),
      ]
    : userContent
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMsg },
  ]

  const post = async (tokenParam, budget) => {
    const resp = await fetch(endpoint, {
      method: 'POST', signal: timeoutSignal(CALL_TIMEOUT_MS),
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      // No forced response_format: JSON-expecting prompts already say "output JSON" and
      // parseAiJson() extracts it - while forcing json_object breaks free-form chat/help
      // (and errors unless the prompt contains the word "json"). Mirrors Claude's behavior.
      body: JSON.stringify({ model, [tokenParam]: budget, messages }),
    })
    const text = await resp.text()
    if (resp.ok) reportUsage(provider, model, text)
    return { ok: resp.ok, status: resp.status, text }
  }

  const budget = maxTokens || OPENAI_COMPAT_DEFAULT_TOKENS
  // One step up, bounded, for the two ways a reasoning model can exhaust its budget.
  const roomier = Math.min(Math.max(budget * 4, 4000), 32000)
  let tokenParam = 'max_completion_tokens'
  let r = await post(tokenParam, budget)

  // An endpoint that predates the rename (xAI, a local server) rejects the new name.
  // Only when the NAME is refused: "max_completion_tokens is too large ... at most 4096" also names it, and the
  // retry with max_tokens failed the same way (and hid the real error on newer models).
  if (!r.ok && r.status === 400 && /max_completion_tokens/.test(r.text) && /unsupported|unrecognized|unknown|not supported|extra (inputs|fields)|not permitted/i.test(r.text)) {
    tokenParam = 'max_tokens'
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
      return { content: choice?.message?.content || '', finish: choice?.finish_reason, refusal, reasoning }
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
  return content
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
      let r = await post(maxTokens || 4000)
      if (!r.ok && r.status === 400 && /max_tokens/.test(r.text)) {
        const cap = Number((r.text.match(/>\s*(\d+)/) || [])[1])
        // Only DOWN: the context-overflow error also names max_tokens ("195000 + 8000 > 200000") and its
        // number is the context size, so retrying at it asked for 200000 output tokens and showed a
        // confusing cap error instead of the real "input too long" one.
        if (cap > 0 && cap < (maxTokens || 4000)) r = await post(cap)
      }
      if (!r.ok) throw new Error(`API ${r.status}: ${errText(r.text)}`)
      let body = null
      try { body = JSON.parse(r.text) } catch { return '' }
      const out = body?.content?.map((c) => (c.type === 'text' ? c.text : '')).join('') || ''
      // A refusal is 200 + stop_reason "refusal" and no text (see the OpenAI note above).
      if (!out && body?.stop_reason === 'refusal') throw new Error('API 200: blocked (refusal)')
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
        .filter((id) => (/^(gpt|chatgpt|o\d)/.test(id)) && !/(embedding|audio|tts|whisper|image|realtime|moderation|transcribe|search|dall)/.test(id))
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
      const model = modelOverride || 'gemini-2.0-flash'
      const parts = [
        { text: userContent },
        ...((images && images.length) ? images.map((im) => ({ inline_data: { mime_type: im.mediaType, data: im.base64 } })) : []),
      ]
      const post = async (budget) => {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST', signal: timeoutSignal(CALL_TIMEOUT_MS),
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemPrompt }] },
              contents: [{ parts }],
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
          return { text: c?.content?.parts?.map((p) => p.text || '').join('') || '', finish: c?.finishReason, blocked: j.promptFeedback?.blockReason, thoughts: Number(j.usageMetadata?.thoughtsTokenCount) || 0 }
        } catch { return { text: '', finish: null, thoughts: 0 } }
      }

      const budget = maxTokens || 0
      let r = await post(budget)
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
      // Safety blocks are 200 with no text: a blocked PROMPT has no candidates (promptFeedback.blockReason),
      // a blocked ANSWER has finishReason SAFETY/RECITATION/... (see the OpenAI note above).
      if (!text && (blocked || /^(SAFETY|RECITATION|PROHIBITED_CONTENT|BLOCKLIST|SPII|IMAGE_SAFETY)$/.test(String(finish || '')))) {
        throw new Error(`API 200: blocked (${blocked || finish})`)
      }
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
