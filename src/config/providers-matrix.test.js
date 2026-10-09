// THE PROVIDER COMPATIBILITY MATRIX: every reply shape the real model families send, through each provider's own
// .call (the one funnel every AI feature uses: aiCall -> PROVIDERS[p].call), with fetch stubbed (no key, no network).
// What it guards: whatever model a user pins for a job (Settings > AI & cost > Models per job), the text that comes
// out is the answer, never the model's thinking, never "" for a real call, never "[object Object]"; refusals and
// filters are "API 200: blocked" errors; every self-heal (token parameter, system role, output cap, thinking budget,
// Responses-only models, image refusals) runs in the provider layer and nowhere else.
//
// Shapes are written from each provider's documented reply format. Live-only facts (exact error wording of a model that
// ships tomorrow) cannot be pinned here: the heals match on the words the providers use today.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { PROVIDERS, imageInputRefused, setUsageListener } from './providers'
import { transcribe, synthesize, pcmRate } from '../speech/engines'

const json = (body, status = 200) => new Response(JSON.stringify(body), { status })
const err = (status, message, extra = {}) => json({ error: { message, ...extra } }, status)

let calls = []
const stub = (...replies) => {
  calls = []
  vi.stubGlobal('fetch', async (url, init) => {
    let body = null
    try { body = init?.body && typeof init.body === 'string' ? JSON.parse(init.body) : init?.body ?? null } catch { body = init.body }
    calls.push({ url: String(url), body, headers: init?.headers || {} })
    const r = replies[Math.min(calls.length, replies.length) - 1]
    return typeof r === 'function' ? r(calls.length, body) : r.clone()
  })
}
afterEach(() => { vi.unstubAllGlobals(); setUsageListener(null) })

const IMG = [{ mediaType: 'image/png', base64: 'iVBORw0KGgo=' }]
const call = (prov, { model = null, images, max = 2000, system = 'You are Ebi.', user = 'Say hi' } = {}) =>
  PROVIDERS[prov].call('k', system, user, model, images, max)

// ── Anthropic Messages API ──────────────────────────────────────────────────────────────────────────────────────────
const anth = (content, stop = 'end_turn', usage = { input_tokens: 9, output_tokens: 4 }) => json({ type: 'message', role: 'assistant', content, stop_reason: stop, usage })

describe('Anthropic reply shapes', () => {
  it('one text block', async () => {
    stub(anth([{ type: 'text', text: 'hola' }]))
    expect(await call('anthropic', { model: 'claude-haiku-4-5' })).toBe('hola')
  })
  it('thinking + redacted thinking + text: only the text', async () => {
    stub(anth([{ type: 'thinking', thinking: 'The answer is {"x":1}', signature: 's' }, { type: 'redacted_thinking', data: 'zz' }, { type: 'text', text: '{"x":2}' }]))
    expect(await call('anthropic', { model: 'claude-opus-5' })).toBe('{"x":2}')
  })
  it('several text blocks are joined in order', async () => {
    stub(anth([{ type: 'text', text: '[{"a":1},' }, { type: 'text', text: '{"a":2}]' }]))
    expect(await call('anthropic')).toBe('[{"a":1},{"a":2}]')
  })
  it('a reply cut at max_tokens without thinking is returned as is (parseAiJson salvages it)', async () => {
    stub(anth([{ type: 'text', text: '[{"a":1},{"a":' }], 'max_tokens'))
    expect(await call('anthropic')).toBe('[{"a":1},{"a":')
    expect(calls).toHaveLength(1)
  })
  it('the whole budget spent thinking: one roomier retry, then the text', async () => {
    stub(anth([{ type: 'thinking', thinking: 'hmm', signature: 's' }], 'max_tokens'), anth([{ type: 'thinking', thinking: 'hmm', signature: 's' }, { type: 'text', text: 'ok' }]))
    expect(await call('anthropic', { max: 120 })).toBe('ok')
    expect(calls[1].body.max_tokens).toBeGreaterThan(120)
  })
  it('a refusal (stop_reason refusal, no text) is a blocked error', async () => {
    stub(anth([], 'refusal'))
    await expect(call('anthropic')).rejects.toThrow(/^API 200: blocked/)
  })
  it('an empty end_turn reply to a real call is an error, never ""', async () => {
    stub(anth([], 'end_turn'))
    await expect(call('anthropic')).rejects.toThrow(/^API 200: empty/)
  })
  it('a probe (4 tokens) may come back empty without an error', async () => {
    stub(anth([], 'max_tokens'))
    expect(await call('anthropic', { max: 4 })).toBe('')
  })
  it('an older model\'s output cap is healed at the number the API names', async () => {
    stub(err(400, 'max_tokens: 8000 > 4096, which is the maximum allowed number of output tokens for claude-3-haiku-20240307'), anth([{ type: 'text', text: 'ok' }]))
    expect(await call('anthropic', { model: 'claude-3-haiku-20240307', max: 8000 })).toBe('ok')
    expect(calls[1].body.max_tokens).toBe(4096)
  })
  it('request: system in `system`, images as base64 blocks BEFORE the text, no sampling knobs', async () => {
    stub(anth([{ type: 'text', text: 'ok' }]))
    await call('anthropic', { images: IMG })
    const b = calls[0].body
    expect(b.system).toBe('You are Ebi.')
    expect(b.messages[0].content[0]).toEqual({ type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'iVBORw0KGgo=' } })
    expect(b.messages[0].content[1]).toEqual({ type: 'text', text: 'Say hi' })
    expect(b).not.toHaveProperty('temperature')
    expect(b).not.toHaveProperty('thinking')
  })
  it('overloaded (529) keeps the "API <status>:" shape the failover reads', async () => {
    stub(json({ type: 'error', error: { type: 'overloaded_error', message: 'Overloaded' } }, 529))
    await expect(call('anthropic')).rejects.toThrow(/^API 529: \[overloaded_error\]/)
  })
})

// ── OpenAI Chat Completions (and the Responses API for the models that only speak it) ─────────────────────────────
const oa = (message, finish = 'stop', usage = { prompt_tokens: 9, completion_tokens: 4 }) => json({ object: 'chat.completion', choices: [{ index: 0, message: { role: 'assistant', ...message }, finish_reason: finish }], usage })

describe('OpenAI reply shapes', () => {
  it('content as a string', async () => {
    stub(oa({ content: 'hola' }))
    expect(await call('openai', { model: 'gpt-4o' })).toBe('hola')
  })
  it('content as a list of parts (text and output_text)', async () => {
    stub(oa({ content: [{ type: 'text', text: '{"a":' }, { type: 'output_text', text: '1}' }] }))
    expect(await call('openai')).toBe('{"a":1}')
  })
  it('a leading <think> block from a reasoning model is dropped', async () => {
    stub(oa({ content: '<think>maybe [1,2]</think>\n[3]' }))
    expect(await call('openai')).toBe('[3]')
  })
  it('reasoning models: max_completion_tokens, and an empty "length" reply gets one roomier retry', async () => {
    stub(oa({ content: '' }, 'length', { prompt_tokens: 9, completion_tokens: 600, completion_tokens_details: { reasoning_tokens: 600 } }), oa({ content: 'done' }))
    expect(await call('openai', { model: 'o4-mini', max: 600 })).toBe('done')
    expect(calls[0].body.max_completion_tokens).toBe(600)
    expect(calls[0].body).not.toHaveProperty('max_tokens')
    expect(calls[1].body.max_completion_tokens).toBeGreaterThan(600)
  })
  it('an o-series model refusing the system role: instructions folded into the user turn', async () => {
    stub(err(400, "Unsupported value: 'messages[0].role' does not support 'system' with this model.", { code: 'unsupported_value' }), oa({ content: 'ok' }))
    expect(await call('openai', { model: 'o1-mini' })).toBe('ok')
    expect(calls[1].body.messages).toHaveLength(1)
    expect(calls[1].body.messages[0].role).toBe('user')
    expect(calls[1].body.messages[0].content).toContain('You are Ebi.')
  })
  it('a refusal field (content null) is a blocked error', async () => {
    stub(oa({ content: null, refusal: "I'm sorry, I can't help with that." }))
    await expect(call('openai')).rejects.toThrow(/^API 200: blocked \(refusal/)
  })
  it('a content filter is a blocked error', async () => {
    stub(oa({ content: null }, 'content_filter'))
    await expect(call('openai')).rejects.toThrow(/^API 200: blocked \(content_filter\)/)
  })
  it('an empty "stop" reply is an error, never ""', async () => {
    stub(oa({ content: '' }))
    await expect(call('openai')).rejects.toThrow(/^API 200: empty/)
  })
  it('an older model\'s output cap is healed at the number the error names', async () => {
    stub(err(400, 'max_tokens is too large: 8000. This model supports at most 4096 completion tokens, whereas you provided 8000.'), oa({ content: 'ok' }))
    expect(await call('openai', { model: 'gpt-4', max: 8000 })).toBe('ok')
    expect(calls[1].body.max_completion_tokens).toBe(4096)
  })
  it('images go as data-URL image_url parts after the text', async () => {
    stub(oa({ content: 'ok' }))
    await call('openai', { images: IMG })
    const parts = calls[0].body.messages[1].content
    expect(parts[0]).toEqual({ type: 'text', text: 'Say hi' })
    expect(parts[1]).toEqual({ type: 'image_url', image_url: { url: 'data:image/png;base64,iVBORw0KGgo=' } })
  })
  it('no forced JSON mode and no sampling knobs (reasoning models reject temperature)', async () => {
    stub(oa({ content: 'ok' }))
    await call('openai', { model: 'gpt-5.6' })
    expect(calls[0].body).not.toHaveProperty('response_format')
    expect(calls[0].body).not.toHaveProperty('temperature')
  })
})

const resp = (output, extra = {}) => json({ object: 'response', status: 'completed', output, usage: { input_tokens: 12, output_tokens: 30, output_tokens_details: { reasoning_tokens: 20 } }, ...extra })
const ONLY_RESPONSES = err(404, 'This model is only supported in v1/responses and not in v1/chat/completions.', { type: 'invalid_request_error' })

describe('OpenAI models served only by the Responses API (the -pro and codex models)', () => {
  it('re-sends through /v1/responses and reads the message text, skipping reasoning items', async () => {
    stub(ONLY_RESPONSES, resp([{ type: 'reasoning', summary: [] }, { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: '{"ok":true}', annotations: [] }] }]))
    expect(await call('openai', { model: 'gpt-5-pro', images: IMG })).toBe('{"ok":true}')
    expect(calls[1].url).toBe('https://api.openai.com/v1/responses')
    const b = calls[1].body
    expect(b.instructions).toBe('You are Ebi.')
    expect(b.max_output_tokens).toBe(2000)
    expect(b.input[0].content[0]).toEqual({ type: 'input_text', text: 'Say hi' })
    expect(b.input[0].content[1]).toEqual({ type: 'input_image', image_url: 'data:image/png;base64,iVBORw0KGgo=' })
  })
  it('incomplete at max_output_tokens with no text: one roomier retry', async () => {
    stub(ONLY_RESPONSES, resp([{ type: 'reasoning', summary: [] }], { status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' } }), resp([{ type: 'message', content: [{ type: 'output_text', text: 'fine' }] }]))
    expect(await call('openai', { model: 'o3-pro', max: 300 })).toBe('fine')
    expect(calls[2].body.max_output_tokens).toBeGreaterThan(300)
  })
  it('a refusal part is a blocked error', async () => {
    stub(ONLY_RESPONSES, resp([{ type: 'message', content: [{ type: 'refusal', refusal: 'No.' }] }]))
    await expect(call('openai', { model: 'gpt-5-pro' })).rejects.toThrow(/^API 200: blocked \(refusal/)
  })
  it('a probe stays a probe (the API minimum of 16 tokens is respected)', async () => {
    stub(ONLY_RESPONSES, resp([{ type: 'message', content: [{ type: 'output_text', text: 'h' }] }]))
    expect(await PROVIDERS.openai.call('k', 'ping', 'hi', 'gpt-5-pro', undefined, 4)).toBe('h')
    expect(calls[1].body.max_output_tokens).toBe(16)
  })
  it('its usage is counted like any other call', async () => {
    const seen = []
    setUsageListener((u) => seen.push(u))
    stub(ONLY_RESPONSES, resp([{ type: 'message', content: [{ type: 'output_text', text: 'x' }] }]))
    await call('openai', { model: 'gpt-5-pro' })
    expect(seen).toEqual([{ provider: 'openai', model: 'gpt-5-pro', input: 12, output: 30 }])
  })
})

// ── Google Gemini generateContent ───────────────────────────────────────────────────────────────────────────────────
const gem = (parts, finish = 'STOP', usage = { promptTokenCount: 9, candidatesTokenCount: 4 }) => json({ candidates: [{ content: parts ? { role: 'model', parts } : undefined, finishReason: finish, index: 0 }], usageMetadata: usage })

describe('Gemini reply shapes', () => {
  it('thought parts are never the answer', async () => {
    stub(gem([{ text: 'Thinking about [1]', thought: true }, { text: '[2]' }]))
    expect(await call('gemini', { model: 'gemini-2.5-pro' })).toBe('[2]')
  })
  it('several text parts are joined', async () => {
    stub(gem([{ text: '{"a":' }, { text: '1}' }]))
    expect(await call('gemini')).toBe('{"a":1}')
  })
  it('thinking spent maxOutputTokens with no text: one roomier retry', async () => {
    stub(gem(null, 'MAX_TOKENS', { promptTokenCount: 9, thoughtsTokenCount: 600 }), gem([{ text: 'ok' }]))
    expect(await call('gemini', { model: 'gemini-2.5-flash', max: 600 })).toBe('ok')
    expect(calls[1].body.generationConfig.maxOutputTokens).toBeGreaterThan(600)
  })
  it('SAFETY, RECITATION and a blocked prompt are blocked errors', async () => {
    stub(gem(null, 'SAFETY'))
    await expect(call('gemini')).rejects.toThrow(/^API 200: blocked \(SAFETY\)/)
    stub(gem(null, 'RECITATION'))
    await expect(call('gemini')).rejects.toThrow(/^API 200: blocked \(RECITATION\)/)
    stub(json({ promptFeedback: { blockReason: 'PROHIBITED_CONTENT' } }))
    await expect(call('gemini')).rejects.toThrow(/^API 200: blocked \(PROHIBITED_CONTENT\)/)
  })
  it('an empty "OTHER" stop is an error, never ""', async () => {
    stub(gem(null, 'OTHER'))
    await expect(call('gemini')).rejects.toThrow(/^API 200: empty/)
    stub(gem(null, 'OTHER'))
    await expect(PROVIDERS.gemini.call('k', 's', 'u', 'gemini-2.5-flash', undefined, undefined)).rejects.toThrow(/^API 200: empty/)
  })
  it('a Gemma model without system instructions: folded into the user turn', async () => {
    stub(err(400, 'Developer instruction is not enabled for models/gemma-3-27b-it', { status: 'INVALID_ARGUMENT' }), gem([{ text: 'ok' }]))
    expect(await call('gemini', { model: 'gemma-3-27b-it' })).toBe('ok')
    expect(calls[1].body).not.toHaveProperty('system_instruction')
    expect(calls[1].body.contents[0].parts[0].text).toContain('You are Ebi.')
  })
  it('an id with Google\'s "models/" prefix still names the model once in the URL', async () => {
    stub(gem([{ text: 'ok' }]))
    await call('gemini', { model: 'models/gemini-2.5-pro' })
    expect(calls[0].url).toContain('/v1beta/models/gemini-2.5-pro:generateContent')
  })
  it('a model\'s output cap is healed at the number the error names', async () => {
    stub(err(400, 'Unable to submit request because it has a maxOutputTokens value of 32000 but the supported range is from 1 (inclusive) to 8193 (exclusive). Update the value and try again.', { status: 'INVALID_ARGUMENT' }), gem([{ text: 'ok' }]))
    expect(await call('gemini', { model: 'gemma-3-12b-it', max: 32000 })).toBe('ok')
    expect(calls[1].body.generationConfig.maxOutputTokens).toBe(8192)
  })
  it('images as inline_data after the text; no forced JSON mime type', async () => {
    stub(gem([{ text: 'ok' }]))
    await call('gemini', { images: IMG })
    const b = calls[0].body
    expect(b.contents[0].parts[1]).toEqual({ inline_data: { mime_type: 'image/png', data: 'iVBORw0KGgo=' } })
    expect(b.generationConfig).not.toHaveProperty('responseMimeType')
    expect(b.system_instruction.parts[0].text).toBe('You are Ebi.')
  })
})

// ── xAI (OpenAI-compatible) ─────────────────────────────────────────────────────────────────────────────────────────
describe('xAI reply shapes', () => {
  it('reasoning_content (grok-3-mini) is never the answer', async () => {
    stub(oa({ content: 'answer', reasoning_content: 'Let me think about {"x":1}' }))
    expect(await call('grok', { model: 'grok-3-mini' })).toBe('answer')
  })
  it('an endpoint that still wants max_tokens gets it', async () => {
    stub(err(400, 'Unrecognized request argument supplied: max_completion_tokens'), oa({ content: 'ok' }))
    expect(await call('grok', { model: 'grok-4' })).toBe('ok')
    expect(calls[1].body.max_tokens).toBe(2000)
  })
  it('reasoning tokens outside completion_tokens: an empty "length" reply retries', async () => {
    stub(oa({ content: '' }, 'length', { prompt_tokens: 9, completion_tokens: 0, completion_tokens_details: { reasoning_tokens: 300 } }), oa({ content: 'ok' }))
    expect(await call('grok', { model: 'grok-4', max: 300 })).toBe('ok')
  })
  it('a text-only model refusing an image raises an error aiCall recognizes (it moves to the vision model)', async () => {
    stub(err(400, 'Image inputs are not supported by this model.'))
    const e = await call('grok', { model: 'grok-3', images: IMG }).catch((x) => x)
    expect(imageInputRefused(e.message)).toBe(true)
  })
})

// ── The image-refusal test aiCall uses ──────────────────────────────────────────────────────────────────────────────
describe('imageInputRefused', () => {
  it('recognizes each provider\'s "this model cannot read images"', () => {
    for (const m of [
      'API 400: [invalid_request_error] Invalid content type. image_url is only supported by certain models.',
      'API 400: Image inputs are not supported by this model.',
      'API 400: [invalid_request_error] claude-3-5-haiku-20241022 does not support image input.',
      'API 400: [INVALID_ARGUMENT] This model does not support multimodal input.',
      'API 404: [model_not_found] The model gpt-3.5-turbo does not support vision.',
    ]) expect(imageInputRefused(m), m).toBe(true)
  })
  it('never a size/format complaint, a non-image error or a success', () => {
    for (const m of [
      'API 400: image exceeds 5 MB maximum: 6291456 bytes > 5242880 bytes',
      'API 400: Image does not match the provided media type image/png',
      'API 429: Rate limit reached',
      'API 400: max_tokens is too large',
      'API 200: blocked (SAFETY)',
    ]) expect(imageInputRefused(m), m).toBe(false)
  })
})

// ── The same JSON request through every provider: the text the parsers get is the JSON, whatever the shape ──────────
describe('one JSON answer, every provider and shape', () => {
  const ANSWER = '[{"q":"¿Qué es?","a":"perro"}]'
  const shapes = {
    anthropic: [anth([{ type: 'text', text: ANSWER }]), anth([{ type: 'thinking', thinking: '[{"q":"draft"}]', signature: 's' }, { type: 'text', text: ANSWER }])],
    openai: [oa({ content: ANSWER }), oa({ content: [{ type: 'text', text: ANSWER }] }), oa({ content: `<think>[{"q":"draft"}]</think>${ANSWER}` })],
    gemini: [gem([{ text: ANSWER }]), gem([{ text: '[{"q":"draft"}]', thought: true }, { text: ANSWER }]), gem([{ text: ANSWER.slice(0, 10) }, { text: ANSWER.slice(10) }])],
    grok: [oa({ content: ANSWER, reasoning_content: '[{"q":"draft"}]' }), oa({ content: [{ type: 'text', text: ANSWER }] })],
  }
  for (const [prov, list] of Object.entries(shapes)) {
    it(prov, async () => {
      for (const r of list) {
        stub(r)
        expect(JSON.parse(await call(prov, { max: 4000 }))).toEqual([{ q: '¿Qué es?', a: 'perro' }])
      }
    })
  }
})

// ── Speech engines ──────────────────────────────────────────────────────────────────────────────────────────────────
describe('speech engines with a picked model', () => {
  const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/webm' })
  it('a wrong STT model falls back to the engine\'s built-in model once', async () => {
    stub(err(400, "Model 'gpt-4o' is not supported for transcription."), json({ text: 'hola' }))
    expect(await transcribe(blob, { engine: 'openai', keys: { openai: 'k' }, model: 'gpt-4o' })).toBe('hola')
    expect(calls).toHaveLength(2)
    expect(calls[1].body.get('model')).toBe('gpt-4o-mini-transcribe')
  })
  it('a key or credit problem is not retried with another model', async () => {
    stub(err(400, 'Incorrect API key provided'))
    await expect(transcribe(blob, { engine: 'openai', keys: { openai: 'k' }, model: 'whisper-1' })).rejects.toThrow(/^API 400/)
    expect(calls).toHaveLength(1)
  })
  it('Gemini transcription skips thought parts, strips "models/" and reports a blocked recording', async () => {
    stub(gem([{ text: 'thinking', thought: true }, { text: 'buenos días' }]))
    expect(await transcribe(blob, { engine: 'gemini', keys: { gemini: 'k' }, model: 'models/gemini-2.5-flash' })).toBe('buenos días')
    expect(calls[0].url).toContain('/models/gemini-2.5-flash:generateContent')
    stub(json({ promptFeedback: { blockReason: 'SAFETY' } }))
    await expect(transcribe(blob, { engine: 'gemini', keys: { gemini: 'k' } })).rejects.toThrow(/blocked/)
  })
  it('a wrong TTS model falls back to the built-in one; Gemini audio keeps the sample rate it names', async () => {
    stub(err(404, 'models/gemini-2.5-pro is not found for API version v1beta, or is not supported for generateContent.'),
      json({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/L16;codec=pcm;rate=16000', data: 'AAAA' } }] } }] }))
    const wav = await synthesize('hola', { engine: 'gemini', keys: { gemini: 'k' }, model: 'gemini-2.5-pro' })
    expect(calls[1].url).toContain('gemini-2.5-flash-preview-tts')
    const v = new DataView(await wav.arrayBuffer())
    expect(v.getUint32(24, true)).toBe(16000)
    expect(pcmRate('audio/L16;codec=pcm')).toBe(24000)
  })
})
