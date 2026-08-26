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
const OPENAI_COMPAT_DEFAULT_TOKENS = 4000
// Below this, a request is a liveness probe rather than a real answer - see the retry guard.
const MIN_CONTENT_BUDGET = 64

async function openAiCompatibleCall({ endpoint, apiKey, systemPrompt, userContent, model, images, maxTokens }) {
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      // No forced response_format: JSON-expecting prompts already say "output JSON" and
      // parseAiJson() extracts it - while forcing json_object breaks free-form chat/help
      // (and errors unless the prompt contains the word "json"). Mirrors Claude's behavior.
      body: JSON.stringify({ model, [tokenParam]: budget, messages }),
    })
    return { ok: resp.ok, status: resp.status, text: await resp.text() }
  }

  const budget = maxTokens || OPENAI_COMPAT_DEFAULT_TOKENS
  // One step up, bounded, for the two ways a reasoning model can exhaust its budget.
  const roomier = Math.min(Math.max(budget * 4, 4000), 32000)
  let tokenParam = 'max_completion_tokens'
  let r = await post(tokenParam, budget)

  // An endpoint that predates the rename (xAI, a local server) rejects the new name.
  if (!r.ok && r.status === 400 && /max_completion_tokens/.test(r.text)) {
    tokenParam = 'max_tokens'
    r = await post(tokenParam, budget)
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
  }
  // Error text keeps the `API <status>: <body>` shape on purpose - healRetiredModel,
  // tryModelFailover and probeModel all read the status back out of this message.
  if (!r.ok) throw new Error(`API ${r.status}: ${r.text.slice(0, 200)}`)

  const read = (raw) => {
    try {
      const choice = JSON.parse(raw).choices?.[0]
      return { content: choice?.message?.content || '', finish: choice?.finish_reason }
    } catch { return { content: '', finish: null } }
  }
  let { content, finish } = read(r.text)

  // MIN_CONTENT_BUDGET keeps probeModel out of this. It calls with maxTokens=4 purely to see
  // whether a model answers at all, and "Test connections" probes the ENTIRE catalog (71 models on
  // a real OpenAI account) - so without the floor, every reasoning model in the list would trigger
  // a second, 4000-token call just to be told what the probe already knew. No real feature asks for
  // fewer than 64 tokens.
  // BUDGET EXHAUSTED, SILENT FORM: 200 OK, finish_reason "length", content "". No error at all,
  // so without this the feature just looks broken.
  if (!content && finish === 'length' && budget >= MIN_CONTENT_BUDGET && roomier > budget) {
    const retry = await post(tokenParam, roomier)
    if (retry.ok) content = read(retry.text).content
  }
  return content
}

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
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      })
      if (!resp.ok) throw new Error(`API ${resp.status}: ${(await resp.text()).slice(0, 200)}`)
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
          method: 'POST',
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
        return { ok: r.ok, status: r.status, text: await r.text() }
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
        if (cap > 0) r = await post(cap)
      }
      if (!r.ok) throw new Error(`API ${r.status}: ${r.text.slice(0, 200)}`)
      try {
        return JSON.parse(r.text).content?.map((c) => (c.type === 'text' ? c.text : '')).join('') || ''
      } catch { return '' }
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
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })
      if (!resp.ok) throw new Error(`API ${resp.status}: ${(await resp.text()).slice(0, 200)}`)
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
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=1000`)
      if (!resp.ok) throw new Error(`API ${resp.status}: ${(await resp.text()).slice(0, 200)}`)
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
            method: 'POST',
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
        return { ok: r.ok, status: r.status, text: await r.text() }
      }
      const read = (raw) => {
        try {
          const c = JSON.parse(raw).candidates?.[0]
          return { text: c?.content?.parts?.map((p) => p.text).join('') || '', finish: c?.finishReason }
        } catch { return { text: '', finish: null } }
      }

      const budget = maxTokens || 0
      let r = await post(budget)
      if (!r.ok) throw new Error(`API ${r.status}: ${r.text.slice(0, 200)}`)
      let { text, finish } = read(r.text)
      // Gemini's THINKING models (2.5 and later) spend maxOutputTokens on thinking before they
      // write anything, exactly like OpenAI's reasoning models - so a tight budget comes back
      // finishReason:"MAX_TOKENS" with no text and no error. Same bounded one-shot retry, same
      // MIN_CONTENT_BUDGET floor so a liveness probe never triggers it.
      if (!text && finish === 'MAX_TOKENS' && budget >= MIN_CONTENT_BUDGET) {
        const bigger = Math.min(Math.max(budget * 4, 4000), 32000)
        if (bigger > budget) {
          const retry = await post(bigger)
          if (retry.ok) text = read(retry.text).text
        }
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
    listModels: async (apiKey) => {
      const resp = await fetch('https://api.x.ai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })
      if (!resp.ok) throw new Error(`API ${resp.status}: ${(await resp.text()).slice(0, 200)}`)
      const data = await resp.json()
      return (data.data || []).map((m) => m.id).filter((id) => id.includes('grok')).sort()
    },
    // Same dialect as OpenAI, so the SAME code path - including the token-parameter
    // fallback, which is what makes this correct whether xAI wants the new name or
    // the old one.
    call: async (apiKey, systemPrompt, userContent, modelOverride, images, maxTokens) =>
      openAiCompatibleCall({
        endpoint: 'https://api.x.ai/v1/chat/completions',
        apiKey, systemPrompt, userContent, images, maxTokens,
        model: modelOverride || 'grok-3-mini-fast',
      }),
  },
}
