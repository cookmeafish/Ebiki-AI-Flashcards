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
