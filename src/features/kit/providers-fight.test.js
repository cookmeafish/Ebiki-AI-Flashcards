// Legends and raid AI paths on EVERY provider (Anthropic, OpenAI, Gemini, xAI), through each provider's real request
// and response shape: the fight verdict (judgeStrike), the background explanation, the re-check, the boss taunt, the
// raid question list and a Legends quiz. fetch is stubbed (no key, no network). The `ai` below is the feature
// context's ai (App.jsx: aiCall -> PROVIDERS[p].call, the dash strip, parseAiJson), so a reply goes through exactly
// what the app runs.
//
// The rule these guard: a grading call that fails (a reasoning model that spent the tiny verdict budget thinking, a
// blocked reply, an outage) is NEVER a miss. A fight must not cost a heart, and a raid must not record an Again,
// because the grader could not answer.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { PROVIDERS } from '../../config/providers'
import { stripAiDashes } from '../../utils/dashes'
import { setPlatform } from '../../platform'
import { judgeStrike, explainStrike, recheckStrike, judgeAnswer } from './judge'
import { VERDICT_MAX_TOKENS } from './fightJudge'
import { fetchTaunt } from './tauntStore'
import { parseTaunt, TAUNT_MAX_TOKENS } from './taunt'
import { parseQuestions, fitQuestionsToKind, buildRaidPrompt, RAID_MAX_TOKENS } from '../legends/prompt'
import { raidCardIndex } from '../legends/raid'

import { parseAiJson } from '../../utils/aiJson'
// parseAiJson: the shared parser App.jsx hands features as ctx.ai.json (src/utils/aiJson.js).

const mem = new Map()
setPlatform({ kv: { getJson: (k, f = null) => (mem.has(k) ? JSON.parse(mem.get(k)) : f), setJson: (k, v) => { mem.set(k, JSON.stringify(v)); return true } } })

const PROVS = ['anthropic', 'openai', 'gemini', 'grok']
// Current reasoning-capable models on each: the ones that spend the budget thinking before they write.
const MODEL = { anthropic: 'claude-opus-5', openai: 'gpt-5.6', gemini: 'gemini-2.5-pro', grok: 'grok-4' }
const KEY = { anthropic: 'sk-ant-test', openai: 'sk-test', gemini: 'AIzaTest', grok: 'xai-test' }

const json = (body, status = 200) => new Response(JSON.stringify(body), { status })
// A normal reply with `text`, in the provider's own shape.
const ok = (prov, text) => {
  if (prov === 'anthropic') return json({ content: [{ type: 'text', text }], stop_reason: 'end_turn', usage: { input_tokens: 10, output_tokens: 5 } })
  if (prov === 'gemini') return json({ candidates: [{ content: { role: 'model', parts: [{ text }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 } })
  return json({ choices: [{ message: { role: 'assistant', content: text }, finish_reason: 'stop' }], usage: { prompt_tokens: 10, completion_tokens: 5 } })
}
// The SILENT exhaustion form: 200, the whole budget spent thinking, no text.
const exhausted = (prov) => {
  if (prov === 'anthropic') return json({ content: [{ type: 'thinking', thinking: 'Let me weigh this', signature: 'x' }], stop_reason: 'max_tokens' })
  if (prov === 'gemini') return json({ candidates: [{ content: { role: 'model' }, finishReason: 'MAX_TOKENS' }], usageMetadata: { promptTokenCount: 10, thoughtsTokenCount: 120 } })
  return json({ choices: [{ message: { role: 'assistant', content: '' }, finish_reason: 'length' }], usage: { prompt_tokens: 10, completion_tokens: 120, completion_tokens_details: { reasoning_tokens: 120 } } })
}
// A refused / filtered reply (200, no text).
const blocked = (prov) => {
  if (prov === 'anthropic') return json({ content: [], stop_reason: 'refusal' })
  if (prov === 'gemini') return json({ candidates: [{ content: { role: 'model' }, finishReason: 'SAFETY' }] })
  if (prov === 'grok') return json({ choices: [{ message: { content: '' }, finish_reason: 'content_filter' }] })
  return json({ choices: [{ message: { content: null, refusal: "I can't help with that." }, finish_reason: 'stop' }] })
}
// The budget each provider was sent, read from its own request field.
const budgetOf = (prov, body) => (prov === 'anthropic' ? body.max_tokens : prov === 'gemini' ? body.generationConfig?.maxOutputTokens : body.max_completion_tokens ?? body.max_tokens)

let calls = []
const stub = (replies) => {
  calls = []
  const queue = [...replies]
  vi.stubGlobal('fetch', async (url, init) => {
    calls.push({ url: String(url), body: init?.body ? JSON.parse(init.body) : null })
    const next = queue.length > 1 ? queue.shift() : queue[0]
    return typeof next === 'function' ? next(calls.length) : next.clone()
  })
}
afterEach(() => vi.unstubAllGlobals())
beforeEach(() => mem.clear())

// The feature context's ai, as App.jsx builds it.
const makeAi = (prov) => ({
  hasKey: true,
  call: async (system, user, { maxTokens } = {}) => stripAiDashes(await PROVIDERS[prov].call(KEY[prov], system, user, MODEL[prov], undefined, maxTokens)),
  json: parseAiJson,
  clean: (s) => String(s || '').replace(/[🦐🦞🦀]️?/gu, '').trim(),
})

const spanish = { name: 'Spanish', isLanguage: true, learnLang: 'Spanish', userLang: 'English', grammarFeedback: true }
const comptia = { name: 'CompTIA A+', isLanguage: false, learnLang: 'English', userLang: 'English' }
const qWord = { prompt: 'The word for "dog" ("p")', accepted: ['perro'], target: 'perro' }
const qPort = { prompt: 'Which protocol uses port 443?', accepted: ['HTTPS'], target: 'HTTPS' }

describe.each(PROVS)('%s: the fight verdict (judgeStrike)', (prov) => {
  it('sends the tiny verdict budget, no forced JSON, no sampling options, the system prompt where the provider wants it', async () => {
    stub([ok(prov, '{"target": true, "all": true, "accentsOnly": false}')])
    const j = await judgeStrike(makeAi(prov), comptia, qPort, 'hypertext secure')
    expect(j.verdict).toBe('clean')
    expect(calls).toHaveLength(1)
    const b = calls[0].body
    expect(budgetOf(prov, b)).toBe(VERDICT_MAX_TOKENS)
    for (const k of ['temperature', 'top_p', 'response_format', 'stop', 'thinking', 'reasoning_effort']) expect(b).not.toHaveProperty(k)
    if (prov === 'anthropic') { expect(typeof b.system).toBe('string'); expect(b.messages[0].role).toBe('user') }
    else if (prov === 'gemini') { expect(b.system_instruction.parts[0].text).toMatch(/JSON only/); expect(b.generationConfig).not.toHaveProperty('responseMimeType') }
    else { expect(b.messages[0].role).toBe('system'); expect(b).not.toHaveProperty('max_tokens') }
  })

  it.each([
    ['plain JSON', '{"target": false, "all": false, "accentsOnly": false}', 'miss'],
    ['a ```json fence', '```json\n{"target": true, "all": false, "accentsOnly": false}\n```', 'glancing'],
    ['flags as strings', '{"target": "True", "all": "true", "accentsOnly": "false"}', 'clean'],
    ['a preamble and a fence', 'Here is my grading:\n```\n{"target": true, "all": true, "accentsOnly": false}\n```', 'clean'],
    ['a list of one', '[{"target": true, "all": true, "accentsOnly": false}]', 'clean'],
    ['a wrapper key', '{"verdict": {"target": false, "all": false, "accentsOnly": false}}', 'miss'],
    ['the plain-question shape', '{"correct": "yes"}', 'clean'],
    ['flags in Spanish', '{"target": "sí", "all": "sí", "accentsOnly": "no"}', 'clean'],
  ])('reads %s', async (_, reply, verdict) => {
    stub([ok(prov, reply)])
    expect((await judgeStrike(makeAi(prov), comptia, qPort, 'something else')).verdict).toBe(verdict)
  })

  it('rescues a reasoning model that spent the 120-token verdict budget thinking (silent form): one roomier retry', async () => {
    stub([exhausted(prov), ok(prov, '{"target": true, "all": true, "accentsOnly": false}')])
    const j = await judgeStrike(makeAi(prov), spanish, qWord, 'el perro')
    expect(j.verdict).toBe('clean')
    expect(calls).toHaveLength(2)
    expect(budgetOf(prov, calls[0].body)).toBe(VERDICT_MAX_TOKENS)
    expect(budgetOf(prov, calls[1].body)).toBeGreaterThanOrEqual(4000)
  })

  it('still exhausted after the retry: "could not check" (error), never a miss', async () => {
    stub([exhausted(prov)])
    const j = await judgeStrike(makeAi(prov), spanish, qWord, 'el perro')
    expect(j.verdict).toBe('error')
    expect(calls).toHaveLength(2) // one bounded retry, no loop
  })

  it('a verdict cut off mid-JSON is unreadable (error), never read as a miss', async () => {
    const cut = prov === 'anthropic' ? json({ content: [{ type: 'text', text: '{"target": false, "all": fa' }], stop_reason: 'max_tokens' })
      : prov === 'gemini' ? json({ candidates: [{ content: { parts: [{ text: '{"target": false, "all": fa' }] }, finishReason: 'MAX_TOKENS' }] })
        : json({ choices: [{ message: { content: '{"target": false, "all": fa' }, finish_reason: 'length' }] })
    stub([cut])
    expect((await judgeStrike(makeAi(prov), spanish, qWord, 'gato')).verdict).toBe('error')
  })

  it('a blocked or refused reply is "could not check", never a miss', async () => {
    stub([blocked(prov)])
    expect((await judgeStrike(makeAi(prov), spanish, qWord, 'gato')).verdict).toBe('error')
  })

  it.each([[429, 'rate limited'], [500, 'server error'], [503, 'overloaded']])('an HTTP %s is "could not check"', async (status, text) => {
    stub([new Response(text, { status })])
    expect((await judgeStrike(makeAi(prov), spanish, qWord, 'gato')).verdict).toBe('error')
  })

  it('a network failure is "could not check"', async () => {
    vi.stubGlobal('fetch', async () => { throw new TypeError('Failed to fetch') })
    expect((await judgeStrike(makeAi(prov), spanish, qWord, 'gato')).verdict).toBe('error')
  })
})

describe('the exhaustion ERROR form (OpenAI-compatible: a 400 instead of an empty 200)', () => {
  it.each(['openai', 'grok'])('%s: retried with room, the verdict lands', async (prov) => {
    stub([json({ error: { message: 'Could not finish the message because max_tokens or model output limit was reached. Please try again with higher max_tokens.' } }, 400),
      ok(prov, '{"target": true, "all": false, "accentsOnly": false}')])
    const j = await judgeStrike(makeAi(prov), comptia, qPort, 'https maybe')
    expect(j.verdict).toBe('glancing')
    expect(calls.slice(0, 2).map((c) => budgetOf(prov, c.body))).toEqual([VERDICT_MAX_TOKENS, 4000]) // a third call is the background explanation
  })
  it.each(['openai', 'grok'])('%s: the error form then the silent form is "could not check"', async (prov) => {
    stub([json({ error: { message: 'Could not finish the message because max_tokens or model output limit was reached.' } }, 400), exhausted(prov)])
    expect((await judgeStrike(makeAi(prov), comptia, qPort, 'https maybe')).verdict).toBe('error')
    expect(calls).toHaveLength(2)
  })
  it('grok: an endpoint that only knows max_tokens is retried under the old name', async () => {
    stub([json({ error: { message: 'Argument not supported: max_completion_tokens' } }, 400), ok('grok', '{"target": true, "all": true, "accentsOnly": false}')])
    expect((await judgeStrike(makeAi('grok'), comptia, qPort, 'hypertext secure')).verdict).toBe('clean')
    expect(calls[1].body.max_tokens).toBe(VERDICT_MAX_TOKENS)
  })
})

describe('thinking that reaches the reply is never read as the answer', () => {
  it('anthropic: thinking blocks before the text block are skipped', async () => {
    stub([json({ content: [{ type: 'thinking', thinking: 'Draft: {"target": false, "all": false}' }, { type: 'redacted_thinking', data: 'x' }, { type: 'text', text: '{"target": true, "all": true, "accentsOnly": false}' }], stop_reason: 'end_turn' })])
    expect((await judgeStrike(makeAi('anthropic'), comptia, qPort, 'hypertext secure')).verdict).toBe('clean')
  })
  it('gemini: parts marked as thought are skipped', async () => {
    stub([json({ candidates: [{ content: { parts: [{ text: 'Draft: {"target": false, "all": false}', thought: true }, { text: '{"target": true, "all": true, "accentsOnly": false}' }] }, finishReason: 'STOP' }] })])
    expect((await judgeStrike(makeAi('gemini'), comptia, qPort, 'hypertext secure')).verdict).toBe('clean')
  })
  it.each(['openai', 'grok'])('%s: a leading <think> block in the content is dropped', async (prov) => {
    stub([ok(prov, '<think>The student said {"target": false} maybe</think>\n{"target": true, "all": true, "accentsOnly": false}')])
    expect((await judgeStrike(makeAi(prov), comptia, qPort, 'hypertext secure')).verdict).toBe('clean')
  })
  it.each(['openai', 'grok'])('%s: content sent as a list of text parts is read as text', async (prov) => {
    stub([json({ choices: [{ message: { content: [{ type: 'text', text: '{"target": true, "all": true, "accentsOnly": false}' }] }, finish_reason: 'stop' }] })])
    expect((await judgeStrike(makeAi(prov), comptia, qPort, 'hypertext secure')).verdict).toBe('clean')
  })
})

describe.each(PROVS)('%s: the background explanation and the careful re-check', (prov) => {
  it('explainStrike reads the note and a glancing answer\'s fix', async () => {
    stub([ok(prov, '```json\n{"note": "Use the article: el perro.", "fix": {"question": "Say it with its article", "answer": "el perro"}}\n```')])
    const r = await explainStrike(makeAi(prov), spanish, qWord, 'perro grande', { verdict: 'glancing' })
    expect(r.note).toBe('Use the article: el perro.')
    expect(r.attack).toEqual({ prompt: 'Say it with its article', accepted: ['el perro'] })
  })
  it('explainStrike never throws: a blocked reply is {}', async () => {
    stub([blocked(prov)])
    expect(await explainStrike(makeAi(prov), spanish, qWord, 'gato')).toEqual({})
  })
  it('recheckStrike overturns a miss (string flags too)', async () => {
    stub([ok(prov, '{"right": "true", "all": "true", "why": "HTTPS is right."}')])
    const r = await recheckStrike(makeAi(prov), comptia, qPort, 'https', { verdict: 'miss' })
    expect(r).toMatchObject({ verdict: 'clean', overturned: true })
  })
  it('recheckStrike after exhaustion is retried, and only RAISES', async () => {
    stub([exhausted(prov), ok(prov, '{"right": false, "all": false, "why": "No."}')])
    expect(await recheckStrike(makeAi(prov), comptia, qPort, 'ftp', { verdict: 'glancing' })).toMatchObject({ verdict: 'glancing', overturned: false })
  })
  it('recheckStrike that cannot run is null (no change), never a lower verdict', async () => {
    stub([blocked(prov)])
    expect(await recheckStrike(makeAi(prov), comptia, qPort, 'ftp')).toBeNull()
  })
  it('judgeAnswer (non-fight quizzes): a wrapped reply is read, a failed one is null (try again)', async () => {
    stub([ok(prov, '[{"correct": true, "note": "Yes."}]')])
    expect(await judgeAnswer(makeAi(prov), comptia, qPort, 'https')).toEqual({ correct: true, note: 'Yes.' })
    stub([exhausted(prov)])
    expect(await judgeAnswer(makeAi(prov), comptia, qPort, 'https')).toBeNull()
  })
})

describe.each(PROVS)('%s: boss taunts', (prov) => {
  const facts = { bossKey: `raid:titan:${prov}`, voice: 'You are the Titan.', sample: 'That weld will not hold.', question: 'q', answer: 'a', userLang: 'English' }
  it('a plain line, asked on the cheap budget', async () => {
    stub([ok(prov, 'Your answer rusted before it reached me.')])
    expect(await fetchTaunt(makeAi(prov), facts)).toEqual({ line: 'Your answer rusted before it reached me.', source: 'ai' })
    expect(budgetOf(prov, calls[0].body)).toBe(TAUNT_MAX_TOKENS)
  })
  it('a preamble line, a stage direction and markdown are not shown', async () => {
    stub([ok(prov, "Here's my taunt:\n*cackles* **\"Your rivets fell out mid sentence.\"**")])
    expect((await fetchTaunt(makeAi(prov), facts))?.line).toBe('Your rivets fell out mid sentence.')
  })
  it('a thinking model that spent the budget is retried once and still talks', async () => {
    stub([exhausted(prov), ok(prov, 'Even my gears laughed at that one.')])
    expect((await fetchTaunt(makeAi(prov), facts))?.line).toBe('Even my gears laughed at that one.')
  })
  it('a blocked reply falls back to the sample line (once), never an error on screen', async () => {
    stub([blocked(prov)])
    let used = false
    const g = { sampleUsed: () => used, markSample: () => { used = true } }
    expect(await fetchTaunt(makeAi(prov), { ...facts, ...g })).toEqual({ line: 'That weld will not hold.', source: 'sample' })
    expect(await fetchTaunt(makeAi(prov), { ...facts, ...g })).toBeNull()
  })
})

describe('parseTaunt keeps real lines', () => {
  it('a line in parentheses later in the sentence is kept whole', () => {
    expect(parseTaunt('You missed (again) by a mile.')).toBe('You missed (again) by a mile.')
  })
  it('a lone stage direction with nothing after it is not stripped to nothing', () => {
    expect(parseTaunt('*laughs*')).toBe('laughs')
  })
  it('a line ending in a colon with nothing after it stays', () => {
    expect(parseTaunt('Watch this:')).toBe('Watch this:')
  })
})

// RaidRun.writeQuestions, step for step (the component is not importable in a node test): one question per card,
// matched by its `card` number, every one standing typed.
async function raidQuestions(ai, subject, cards) {
  const { system, user } = buildRaidPrompt(subject, cards)
  const raw = ai.json(await ai.call(system, user, { maxTokens: RAID_MAX_TOKENS }))
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.questions) ? raw.questions : []
  const out = []
  const used = new Set()
  for (const q of list) {
    const card = cards[raidCardIndex(q?.card)]
    if (!card || used.has(card.cardId)) continue
    const [one] = fitQuestionsToKind(parseQuestions([q], ai.clean, { dual: true }), 'raid')
    if (!one) continue
    used.add(card.cardId)
    out.push({ ...one, _cardId: card.cardId })
  }
  return out
}
const raidCards = [{ cardId: 11, front: 'perro', back: 'dog' }, { cardId: 12, front: 'gato', back: 'cat' }]
const raidReply = JSON.stringify({ questions: [
  { card: 'Card 2', question: 'The word for "cat" ("g")', accepted: ['gato'], choices: ['gato', 'pato', 'gallo', 'ganso'], answer: 'gato', target: 'gato' },
  { card: 1, question: 'The word for "dog" ("p")', accepted: ['perro'], choices: ['perro', 'pero', 'pelo', 'peso'], answer: '0', target: 'perro' },
] })

describe.each(PROVS)('%s: raid questions and Legends quizzes', (prov) => {
  it('the raid list in a fence with "Card 2" numbering: one typed question per card, choices kept as the safe strike', async () => {
    stub([ok(prov, '```json\n' + raidReply + '\n```')])
    const qs = await raidQuestions(makeAi(prov), spanish, raidCards)
    expect(qs.map((q) => q._cardId).sort()).toEqual([11, 12])
    for (const q of qs) { expect(q.kind).toBe('typed'); expect(q.alt?.choices).toHaveLength(4) }
    expect(budgetOf(prov, calls[0].body)).toBe(RAID_MAX_TOKENS)
  })
  it('the raid list as a bare array', async () => {
    stub([ok(prov, JSON.stringify(JSON.parse(raidReply).questions))])
    expect(await raidQuestions(makeAi(prov), spanish, raidCards)).toHaveLength(2)
  })
  it('a Legends quiz under another key, with an index answer sent as a string', async () => {
    stub([ok(prov, 'Sure!\n{"quiz": [{"type": "choice", "question": "Port for HTTPS?", "choices": ["80", "443", "21", "22"], "answer": "1", "target": "HTTPS"}, {"type": "typed", "question": "What does TLS stand for?", "accepted": ["Transport Layer Security"], "target": "TLS"}]}')])
    const ai = makeAi(prov)
    const qs = parseQuestions(ai.json(await ai.call('s', 'u', { maxTokens: 5000 })), ai.clean)
    expect(qs).toHaveLength(2)
    const choice = qs.find((q) => q.kind === 'choice')
    expect(choice.choices[choice.answerIdx]).toBe('443')
  })
})

describe('anthropic: the thinking-exhaustion retry stays bounded', () => {
  it('a liveness probe (4 tokens) is never retried and still answers ""', async () => {
    stub([exhausted('anthropic')])
    expect(await PROVIDERS.anthropic.call('k', 'ping', 'hi', 'claude-opus-5', undefined, 4)).toBe('')
    expect(calls).toHaveLength(1)
  })
  it('after a cap-down retry an empty reply is an error, never a request past the model cap', async () => {
    stub([json({ error: { message: 'max_tokens: 8000 > 4096, which is the maximum allowed number of output tokens' } }, 400), exhausted('anthropic')])
    await expect(PROVIDERS.anthropic.call('k', 's', 'u', 'claude-3-haiku', undefined, 8000)).rejects.toThrow(/^API 200: empty/)
    expect(calls.map((c) => c.body.max_tokens)).toEqual([8000, 4096])
  })
})
