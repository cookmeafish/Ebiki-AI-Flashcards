export const PROVIDERS = {
  anthropic: {
    label: 'Anthropic (Claude)',
    placeholder: 'sk-ant-...',
    keyPrefix: 'sk-ant-',
    color: '#d2a8ff',
    url: 'https://console.anthropic.com/settings/keys',
    billingUrl: 'https://console.anthropic.com/settings/plans',
    model: 'claude-haiku-4-5-20251001',
    questionModel: 'claude-sonnet-4-6',
    // List the model ids currently offered by the provider (newest first).
    listModels: async (apiKey) => {
      const resp = await fetch('https://api.anthropic.com/v1/models?limit=1000', {
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      })
      if (!resp.ok) throw new Error(`API ${resp.status}: ${(await resp.text()).slice(0, 200)}`)
      const data = await resp.json()
      return (data.data || []).map((m) => m.id).filter(Boolean)
    },
    call: async (apiKey, systemPrompt, userContent, modelOverride) => {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: modelOverride || 'claude-haiku-4-5-20251001',
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{ role: 'user', content: userContent }],
        }),
      })
      if (!resp.ok) {
        const errBody = await resp.text()
        throw new Error(`API ${resp.status}: ${errBody.slice(0, 200)}`)
      }
      const data = await resp.json()
      return data.content?.map((c) => (c.type === 'text' ? c.text : '')).join('')
    },
  },
  openai: {
    label: 'OpenAI (GPT)',
    placeholder: 'sk-...',
    keyPrefix: 'sk-',
    color: '#74aa9c',
    url: 'https://platform.openai.com/api-keys',
    billingUrl: 'https://platform.openai.com/settings/organization/billing',
    model: 'gpt-4o-mini',
    questionModel: 'gpt-4o-mini',
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
    call: async (apiKey, systemPrompt, userContent, modelOverride) => {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelOverride || 'gpt-4o-mini',
          max_tokens: 4000,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
        }),
      })
      if (!resp.ok) {
        const errBody = await resp.text()
        throw new Error(`API ${resp.status}: ${errBody.slice(0, 200)}`)
      }
      const data = await resp.json()
      return data.choices?.[0]?.message?.content || ''
    },
  },
  gemini: {
    label: 'Google (Gemini)',
    placeholder: 'AIza...',
    keyPrefix: 'AIza',
    color: '#4285f4',
    url: 'https://aistudio.google.com/apikey',
    billingUrl: 'https://aistudio.google.com/apikey',
    model: 'gemini-2.0-flash',
    questionModel: 'gemini-2.0-flash',
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
    call: async (apiKey, systemPrompt, userContent, modelOverride) => {
      const model = modelOverride || 'gemini-2.0-flash'
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: userContent }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      )
      if (!resp.ok) {
        const errBody = await resp.text()
        throw new Error(`API ${resp.status}: ${errBody.slice(0, 200)}`)
      }
      const data = await resp.json()
      return data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || ''
    },
  },
  grok: {
    label: 'xAI (Grok)',
    placeholder: 'xai-...',
    keyPrefix: 'xai-',
    color: '#e6e6e6',
    url: 'https://console.x.ai/',
    billingUrl: 'https://console.x.ai/',
    model: 'grok-3-mini-fast',
    questionModel: 'grok-3-mini-fast',
    listModels: async (apiKey) => {
      const resp = await fetch('https://api.x.ai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })
      if (!resp.ok) throw new Error(`API ${resp.status}: ${(await resp.text()).slice(0, 200)}`)
      const data = await resp.json()
      return (data.data || []).map((m) => m.id).filter((id) => id.includes('grok')).sort()
    },
    call: async (apiKey, systemPrompt, userContent, modelOverride) => {
      const resp = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelOverride || 'grok-3-mini-fast',
          max_tokens: 4000,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
        }),
      })
      if (!resp.ok) {
        const errBody = await resp.text()
        throw new Error(`API ${resp.status}: ${errBody.slice(0, 200)}`)
      }
      const data = await resp.json()
      return data.choices?.[0]?.message?.content || ''
    },
  },
}
