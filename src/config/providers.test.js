import { describe, it, expect, vi, afterEach } from 'vitest'
import { PROVIDERS } from './providers'

// Cross-provider request compatibility.
//
// Every AI feature in the app - Chat, Study, Deck, Discover, Picture, Stats, Help, Mascot - goes
// through aiCall -> PROVIDERS[provider].call(), so the request each provider builds is the ONE place
// that decides whether a given model works. That is where "Claude works but OpenAI 400s" came from:
// OpenAI retired `max_tokens` for its newer models and we were still sending it.
//
// These tests stub fetch, so they assert the REQUEST SHAPE and the recovery behaviour without a key
// or a network - which is the only way to cover Anthropic/Gemini/Grok paths in CI.

const okOpenAi = (content, finish = 'stop') =>
  new Response(JSON.stringify({ choices: [{ message: { content }, finish_reason: finish }] }), { status: 200 })
const badRequest = (message) =>
  new Response(JSON.stringify({ error: { message } }), { status: 400 })

const stub = (impl) => {
  const calls = []
  vi.stubGlobal('fetch', async (url, init) => {
    const body = init?.body ? JSON.parse(init.body) : null
    calls.push({ url: String(url), body })
    return impl(calls.length, body)
  })
  return calls
}

afterEach(() => vi.unstubAllGlobals())

describe('OpenAI-compatible providers: token parameter', () => {
  it('sends max_completion_tokens, not the retired max_tokens', async () => {
    const calls = stub(() => okOpenAi('hi'))
    await PROVIDERS.openai.call('k', 'sys', 'user', 'gpt-5.6-sol', undefined, 8000)
    expect(calls).toHaveLength(1)
    expect(calls[0].body.max_completion_tokens).toBe(8000)
    expect(calls[0].body).not.toHaveProperty('max_tokens')
  })

  it('falls back to max_tokens when an endpoint rejects the new name', async () => {
    // xAI, a local server, or any other OpenAI-compatible endpoint that predates the rename.
    const calls = stub((n) => (n === 1
      ? badRequest("Unrecognized request argument supplied: max_completion_tokens")
      : okOpenAi('hi')))
    const out = await PROVIDERS.grok.call('k', 'sys', 'user', 'grok-4', undefined, 2000)
    expect(out).toBe('hi')
    expect(calls).toHaveLength(2)
    expect(calls[1].body.max_tokens).toBe(2000)
    expect(calls[1].body).not.toHaveProperty('max_completion_tokens')
  })

  it('does NOT retry a 400 that is about something else', async () => {
    const calls = stub(() => badRequest('The model `nope` does not exist'))
    await expect(PROVIDERS.openai.call('k', 'sys', 'user', 'nope', undefined, 2000)).rejects.toThrow(/API 400/)
    expect(calls).toHaveLength(1)
  })

  it('keeps the "API <status>:" error shape that failover and probing parse', async () => {
    stub(() => new Response('nope', { status: 429 }))
    await expect(PROVIDERS.openai.call('k', 'sys', 'user', 'gpt-4o', undefined, 100))
      .rejects.toThrow(/^API 429: /)
  })

  it('routes grok to x.ai and openai to openai.com', async () => {
    const a = stub(() => okOpenAi('x'))
    await PROVIDERS.openai.call('k', 's', 'u', 'gpt-4o', undefined, 100)
    expect(a[0].url).toContain('api.openai.com')
    vi.unstubAllGlobals()
    const b = stub(() => okOpenAi('x'))
    await PROVIDERS.grok.call('k', 's', 'u', 'grok-4', undefined, 100)
    expect(b[0].url).toContain('api.x.ai')
  })
})

describe('reasoning models that spend the whole budget on thinking', () => {
  it('retries once with a bigger budget when content is empty and it hit the cap', async () => {
    // Measured against a real account: o4-mini at a 16-token cap returns finish_reason "length"
    // with content "" and NO error - a silent failure that looks like a broken feature.
    const calls = stub((n) => (n === 1 ? okOpenAi('', 'length') : okOpenAi('the real answer')))
    const out = await PROVIDERS.openai.call('k', 'sys', 'user', 'o4-mini', undefined, 600)
    expect(out).toBe('the real answer')
    expect(calls).toHaveLength(2)
    expect(calls[1].body.max_completion_tokens).toBeGreaterThan(600)
  })

  it('retries when the budget is exhausted as a 400 instead of an empty 200', async () => {
    // Measured live: o4-mini with NO system message returns 200 + content:"" + finish:"length",
    // but the SAME call WITH a system message - which is every call Ebiki makes - returns a 400
    // instead. Handling only the 200 form left every real feature still broken on reasoning models.
    const calls = stub((n) => (n === 1
      ? badRequest('Could not finish the message because max_tokens or model output limit was reached. Please try again with higher max_tokens.')
      : okOpenAi('Canberra')))
    const out = await PROVIDERS.openai.call('k', 'Be terse.', 'question', 'o4-mini', undefined, 600)
    expect(out).toBe('Canberra')
    expect(calls).toHaveLength(2)
    expect(calls[1].body.max_completion_tokens).toBeGreaterThan(600)
  })

  it('does NOT retry the exhaustion 400 for a liveness probe', async () => {
    const calls = stub(() => badRequest('Could not finish the message because max_tokens or model output limit was reached.'))
    await expect(PROVIDERS.openai.call('k', 'ping', 'hi', 'o4-mini', undefined, 4)).rejects.toThrow(/API 400/)
    expect(calls).toHaveLength(1)
  })

  it('does NOT retry for a liveness probe (probeModel calls with maxTokens=4)', async () => {
    // "Test connections" probes the whole catalog - 71 models on a real account - so a retry here
    // would fire a second 4000-token call per reasoning model for no benefit.
    const calls = stub(() => okOpenAi('', 'length'))
    await PROVIDERS.openai.call('k', 'ping', 'hi', 'o4-mini', undefined, 4)
    expect(calls).toHaveLength(1)
  })

  it('does not retry when the model simply answered nothing without hitting the cap', async () => {
    const calls = stub(() => okOpenAi('', 'stop'))
    await PROVIDERS.openai.call('k', 'sys', 'user', 'gpt-4o', undefined, 600)
    expect(calls).toHaveLength(1)
  })
})

describe('Anthropic per-model output cap', () => {
  const okClaude = (text) =>
    new Response(JSON.stringify({ content: [{ type: 'text', text }] }), { status: 200 })

  it('retries at the cap the API names when max_tokens is over a model limit', async () => {
    // Ebiki asks for 8000 on vision/long-JSON roles; an older Claude a user picks in Settings
    // caps lower and rejects the request outright.
    const calls = stub((n) => (n === 1
      ? badRequest('max_tokens: 8000 > 4096, which is the maximum allowed number of output tokens for claude-3-haiku-20240307')
      : okClaude('answer')))
    const out = await PROVIDERS.anthropic.call('k', 'sys', 'user', 'claude-3-haiku-20240307', undefined, 8000)
    expect(out).toBe('answer')
    expect(calls).toHaveLength(2)
    expect(calls[0].body.max_tokens).toBe(8000)
    expect(calls[1].body.max_tokens).toBe(4096)   // the number the API itself named
  })

  it('does not retry a 400 unrelated to max_tokens', async () => {
    const calls = stub(() => badRequest('model: claude-nope not found'))
    await expect(PROVIDERS.anthropic.call('k', 's', 'u', 'claude-nope', undefined, 8000)).rejects.toThrow(/API 400/)
    expect(calls).toHaveLength(1)
  })
})

describe('Gemini thinking models', () => {
  const okGem = (text, finish = 'STOP') =>
    new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] }, finishReason: finish }] }), { status: 200 })

  it('retries once when thinking consumed maxOutputTokens', async () => {
    const calls = stub((n) => (n === 1 ? okGem('', 'MAX_TOKENS') : okGem('answer')))
    const out = await PROVIDERS.gemini.call('k', 'sys', 'user', 'gemini-2.5-pro', undefined, 600)
    expect(out).toBe('answer')
    expect(calls).toHaveLength(2)
    expect(calls[1].body.generationConfig.maxOutputTokens).toBeGreaterThan(600)
  })

  it('does NOT retry for a liveness probe', async () => {
    const calls = stub(() => okGem('', 'MAX_TOKENS'))
    await PROVIDERS.gemini.call('k', 'ping', 'hi', 'gemini-2.5-pro', undefined, 4)
    expect(calls).toHaveLength(1)
  })
})

describe('every provider handles the shared call contract', () => {
  it('accepts images without throwing, on all four', async () => {
    const img = [{ mediaType: 'image/png', base64: 'AAAA' }]
    const responses = {
      anthropic: () => new Response(JSON.stringify({ content: [{ type: 'text', text: 'a' }] }), { status: 200 }),
      gemini: () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'a' }] }, finishReason: 'STOP' }] }), { status: 200 }),
      openai: () => okOpenAi('a'),
      grok: () => okOpenAi('a'),
    }
    for (const prov of Object.keys(PROVIDERS)) {
      vi.unstubAllGlobals()
      const calls = stub(responses[prov])
      const out = await PROVIDERS[prov].call('k', 'sys', 'describe', null, img, 8000)
      expect(out, `${prov} returned no text`).toBe('a')
      expect(JSON.stringify(calls[0].body), `${prov} did not send the image`).toContain('AAAA')
    }
  })

  it('returns a string (never undefined) so parseAiJson callers never crash', async () => {
    const empty = {
      anthropic: () => new Response(JSON.stringify({}), { status: 200 }),
      gemini: () => new Response(JSON.stringify({}), { status: 200 }),
      openai: () => new Response(JSON.stringify({}), { status: 200 }),
      grok: () => new Response(JSON.stringify({}), { status: 200 }),
    }
    for (const prov of Object.keys(PROVIDERS)) {
      vi.unstubAllGlobals()
      stub(empty[prov])
      const out = await PROVIDERS[prov].call('k', 'sys', 'u', null, undefined, 100)
      expect(typeof out, `${prov} returned a non-string`).toBe('string')
    }
  })
})
