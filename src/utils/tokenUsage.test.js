import { describe, it, expect, vi, afterEach } from 'vitest'
import { readUsage, PROVIDERS, setUsageListener } from '../config/providers'
import { priceFor, costOf, summarize, validPrice, addUsage, formatTokens, formatCost } from './tokenUsage'

describe('readUsage: each provider names its counts differently', () => {
  it('Anthropic (cache tokens are input too)', () => {
    expect(readUsage('anthropic', JSON.stringify({ usage: { input_tokens: 100, output_tokens: 20, cache_read_input_tokens: 5 } }))).toEqual({ input: 105, output: 20 })
  })
  it('OpenAI and xAI', () => {
    const body = JSON.stringify({ usage: { prompt_tokens: 50, completion_tokens: 30 } })
    expect(readUsage('openai', body)).toEqual({ input: 50, output: 30 })
    expect(readUsage('grok', body)).toEqual({ input: 50, output: 30 })
  })
  it('Gemini (thinking tokens are billed as output)', () => {
    expect(readUsage('gemini', JSON.stringify({ usageMetadata: { promptTokenCount: 40, candidatesTokenCount: 10, thoughtsTokenCount: 25 } }))).toEqual({ input: 40, output: 35 })
  })
  it('no usage block, or junk, is nothing', () => {
    expect(readUsage('openai', '{"choices":[]}')).toBeNull()
    expect(readUsage('openai', 'not json')).toBeNull()
  })
})

describe('every provider reports a successful call to the listener', () => {
  afterEach(() => { setUsageListener(null); vi.unstubAllGlobals() })
  const replies = {
    anthropic: { content: [{ type: 'text', text: 'hi' }], usage: { input_tokens: 11, output_tokens: 2 } },
    openai: { choices: [{ message: { content: 'hi' }, finish_reason: 'stop' }], usage: { prompt_tokens: 12, completion_tokens: 3 } },
    grok: { choices: [{ message: { content: 'hi' }, finish_reason: 'stop' }], usage: { prompt_tokens: 13, completion_tokens: 4 } },
    gemini: { candidates: [{ content: { parts: [{ text: 'hi' }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 14, candidatesTokenCount: 5 } },
  }
  for (const [prov, reply] of Object.entries(replies)) {
    it(prov, async () => {
      vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, text: async () => JSON.stringify(reply) })))
      const seen = []
      setUsageListener((u) => seen.push(u))
      expect(await PROVIDERS[prov].call('key', 'sys', 'user', 'some-model', undefined, 100)).toBe('hi')
      expect(seen).toHaveLength(1)
      expect(seen[0]).toMatchObject({ provider: prov, model: 'some-model' })
      expect(seen[0].input).toBeGreaterThan(0)
    })
  }
  it('a failed call reports nothing', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500, text: async () => '{"usage":{"prompt_tokens":5}}' })))
    const seen = []
    setUsageListener((u) => seen.push(u))
    await expect(PROVIDERS.openai.call('key', 'sys', 'user', 'm', undefined, 100)).rejects.toThrow()
    expect(seen).toHaveLength(0)
  })
})

describe('prices', () => {
  it('known models are priced, dated snapshots too', () => {
    expect(priceFor('openai', 'gpt-4o-mini-2024-07-18')).toEqual([0.15, 0.6])
    expect(priceFor('openai', 'gpt-4o')).toEqual([2.5, 10])
    expect(priceFor('anthropic', 'claude-haiku-4-5-20251001')).toEqual([1, 5])
    expect(priceFor('anthropic', 'claude-sonnet-4-6')).toEqual([3, 15])
    expect(priceFor('gemini', 'gemini-2.5-flash-lite')).toEqual([0.1, 0.4])
    expect(priceFor('grok', 'grok-3-mini-fast')).toEqual([0.6, 4])
  })
  it('an unknown model has NO price (never guessed)', () => {
    expect(priceFor('anthropic', 'claude-opus-5-5')).toBeNull()
    expect(priceFor('anthropic', 'claude-opus-4-6')).toBeNull()
    expect(priceFor('openai', 'gpt-5.4')).toBeNull()
  })
  it('cost and the summary keep unpriced tokens apart', () => {
    expect(costOf('openai', 'gpt-4o', 1e6, 1e6)).toBeCloseTo(12.5)
    const by = {}
    addUsage(by, { provider: 'openai', model: 'gpt-4o', input: 1000, output: 500 })
    addUsage(by, { provider: 'openai', model: 'gpt-4o', input: 1000, output: 500 })
    addUsage(by, { provider: 'anthropic', model: 'claude-opus-5-5', input: 300, output: 100 })
    const s = summarize(by)
    expect(s.calls).toBe(3)
    expect(s.tokens).toBe(3400)
    expect(s.unpricedTokens).toBe(400)
    expect(s.cost).toBeCloseTo(2000 / 1e6 * 2.5 + 1000 / 1e6 * 10)
  })
  it('formats', () => {
    expect(formatTokens(950)).toBe('950')
    expect(formatTokens(12345)).toBe('12k')
    expect(formatTokens(1234567)).toBe('1.23M')
    expect(formatCost(0.00123)).toBe('$0.0012')
    expect(formatCost(2.5)).toBe('$2.50')
  })
})

describe('prices the user typed', () => {
  it('price a model the table does not know, and win over the table', () => {
    const prices = { 'anthropic|claude-opus-5-5': [5, 25], 'openai|gpt-4o': [1, 2] }
    expect(priceFor('anthropic', 'claude-opus-5-5', prices)).toEqual([5, 25])
    expect(priceFor('openai', 'gpt-4o', prices)).toEqual([1, 2])
    expect(costOf('anthropic', 'claude-opus-5-5', 1e6, 1e6, prices)).toBe(30)
    const sum = summarize({ a: { provider: 'anthropic', model: 'claude-opus-5-5', input: 1e6, output: 0, calls: 1 } }, prices)
    expect(sum.cost).toBe(5)
    expect(sum.unpricedTokens).toBe(0)
    expect(sum.rows[0].ownPrice).toBe(true)
  })
  it('ignores a malformed price', () => {
    expect(priceFor('anthropic', 'claude-opus-5-5', { 'anthropic|claude-opus-5-5': ['5', 25] })).toBeNull()
    expect(validPrice([1, -1])).toBe(false)
    expect(validPrice([0, 0])).toBe(true)
  })
})

describe('prices: snapshots with their own published price, and non-text models', () => {
  it('the first gpt-4o snapshot and chatgpt-4o-latest kept the older, higher price', () => {
    expect(priceFor('openai', 'gpt-4o-2024-05-13')).toEqual([5, 15])
    expect(priceFor('openai', 'chatgpt-4o-latest')).toEqual([5, 15])
    expect(priceFor('openai', 'gpt-4o-2024-08-06')).toEqual([2.5, 10])
  })
  it('audio, realtime, speech, image and embedding models are never priced at the text rate', () => {
    for (const [prov, id] of [['openai', 'gpt-4o-realtime-preview'], ['openai', 'gpt-4o-audio-preview'], ['openai', 'gpt-4o-mini-tts'],
      ['openai', 'gpt-4o-transcribe'], ['openai', 'gpt-4o-mini-transcribe'], ['gemini', 'gemini-2.5-flash-image-preview'],
      ['gemini', 'gemini-2.5-flash-preview-tts'], ['gemini', 'gemini-2.0-flash-live-001'], ['gemini', 'gemini-2.5-flash-native-audio-dialog']]) {
      expect(priceFor(prov, id), id).toBeNull()
    }
    // a price the user typed still wins
    expect(priceFor('openai', 'gpt-4o-mini-tts', { 'openai|gpt-4o-mini-tts': [0.6, 12] })).toEqual([0.6, 12])
  })
  it('current ids without a published table price stay unpriced', () => {
    for (const [prov, id] of [['anthropic', 'claude-sonnet-5-5'], ['anthropic', 'claude-fable-5-1'], ['gemini', 'gemini-3-pro-preview'], ['openai', 'gpt-5.1']]) {
      expect(priceFor(prov, id), id).toBeNull()
    }
  })
  it('a total whose numbers were saved as text still adds up (never string concatenation)', () => {
    const sum = summarize({ a: { provider: 'openai', model: 'gpt-4o', input: '1000', output: '500', calls: '2' } })
    expect(sum.tokens).toBe(1500)
    expect(sum.calls).toBe(2)
  })
})

describe('the tracker keeps a batch the server did not take', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.resetModules() })
  it('a failed flush is sent again with the next one', async () => {
    vi.resetModules()
    const mod = await import('./tokenUsage')
    const bodies = []
    let fail = true
    vi.stubGlobal('fetch', vi.fn(async (url, init) => {
      if (fail) throw new Error('server restarting')
      bodies.push(JSON.parse(init.body))
      return { ok: true, status: 200, json: async () => ({}) }
    }))
    mod.recordUsage({ provider: 'openai', model: 'gpt-4o', input: 10, output: 5 })
    await mod.flushUsageNow()
    fail = false
    mod.recordUsage({ provider: 'openai', model: 'gpt-4o', input: 20, output: 6 })
    await mod.flushUsageNow()
    expect(bodies).toHaveLength(1)
    expect(bodies[0].add.map((u) => u.input)).toEqual([10, 20])
  })
  it('a refused flush (server answered non-OK) is kept too', async () => {
    vi.resetModules()
    const mod = await import('./tokenUsage')
    const bodies = []
    let status = 503
    vi.stubGlobal('fetch', vi.fn(async (url, init) => { bodies.push(JSON.parse(init.body)); return { ok: status === 200, status, json: async () => ({}) } }))
    mod.recordUsage({ provider: 'grok', model: 'grok-4', input: 1, output: 1 })
    await mod.flushUsageNow()
    status = 200
    await mod.flushUsageNow()
    expect(bodies).toHaveLength(2)
    expect(bodies[1].add).toHaveLength(1)
  })
})

describe('the by-model list never hides a model that needs a price', () => {
  it('rowsToShow keeps the top rows plus every unpriced one', async () => {
    const { rowsToShow } = await import('./tokenUsage')
    const rows = Array.from({ length: 14 }, (_, i) => ({ provider: 'openai', model: `m${i}`, cost: i === 12 ? null : 1 }))
    const shown = rowsToShow(rows, 10)
    expect(shown.map((r) => r.model)).toEqual([...rows.slice(0, 10).map((r) => r.model), 'm12'])
    expect(rowsToShow(rows.slice(0, 3), 10)).toHaveLength(3)
    // a row the user just priced stays reachable (to edit or remove the price)
    const priced = rows.map((r, i) => (i === 12 ? { ...r, cost: 3, ownPrice: true } : r))
    expect(rowsToShow(priced, 10).map((r) => r.model)).toContain('m12')
  })
})
