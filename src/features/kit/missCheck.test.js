import { describe, it, expect, vi } from 'vitest'
import { checkTexts, checkMissText, expectMissText } from './missCheck'
import { checkedNote, explainStrike } from './judge'
import { fetchTaunt } from './tauntStore'
import { factCheckReadable } from '../../utils/factCheck'

vi.mock('../../platform', () => ({ platform: { kv: { getJson: () => ({}), setJson: () => {} } } }))

const q = () => ({ kind: 'typed', prompt: 'Means "to go up".', accepted: ['salire'], _guard: { meaning: 'to go up' } })
const flag = (quote) => [{ quote, fix: 'That is not what it means.' }]

describe('one fact check per miss: the note and the taunt in ONE request', () => {
  it('both announced: one check reads both texts, each flag goes back to its own text', async () => {
    const calls = []
    const ai = { factCheck: async ({ reply, always, strict }) => { calls.push({ reply, always, strict }); return flag('falls down') } }
    const qq = q()
    expectMissText(qq, 'scendere', 'note'); expectMissText(qq, 'scendere', 'taunt')
    const [n, t] = await Promise.all([
      checkMissText(ai, qq, 'scendere', 'note', 'Wrong: it means to go up.'),
      checkMissText(ai, qq, 'scendere', 'taunt', 'Ha, that word falls down, it never climbs.'),
    ])
    expect(calls).toHaveLength(1)
    expect(calls[0].reply).toMatch(/to go up/)
    expect(calls[0].reply).toMatch(/falls down/)
    expect(calls[0]).toMatchObject({ always: true, strict: true })
    expect(n.note).toEqual([])
    expect(t.taunt).toHaveLength(1)
  })
  it('only the note announced (a glancing answer has no taunt): checked alone at once', async () => {
    let n = 0
    const ai = { factCheck: async () => { n++; return [] } }
    const qq = q()
    expectMissText(qq, 'x', 'note')
    const r = await checkMissText(ai, qq, 'x', 'note', 'A note.')
    expect(n).toBe(1)
    expect(r.failed).toBe(false)
  })
  it('a check that throws, or a reply that cannot be read, FAILS CLOSED', async () => {
    const boom = await checkTexts({ factCheck: async () => { throw new Error('timeout') } }, q(), 'a', { note: 'n', taunt: 't' })
    expect(boom.failed).toBe(true)
    const junk = await checkTexts({ factCheck: async () => null }, q(), 'a', { note: 'n' })
    expect(junk.failed).toBe(true)
    expect(factCheckReadable('not json at all', JSON.parse)).toBe(false)
    expect(factCheckReadable('{"mistakes": []}', JSON.parse)).toBe(true)
  })
})

describe('the note, fail closed', () => {
  it('a failed check hides the note, the attack question is kept', async () => {
    const ai = { factCheck: async () => { throw new Error('down') } }
    const out = await checkedNote(ai, q(), 'scendere', { note: 'A note.', attack: { prompt: 'p', accepted: ['a'] } }, async () => ({}))
    expect(out.note).toBe('')
    expect(out.attack).toBeTruthy()
  })
  it('the whole note path through explainStrike: a timed-out check shows no note', async () => {
    const ai = { hasKey: true, json: (s) => JSON.parse(s), clean: (s) => s, call: async () => '{"note": "It means to go down."}', factCheck: async () => { throw new Error('timeout') } }
    const out = await explainStrike(ai, { userLang: 'English' }, q(), 'scendere')
    expect(out.note).toBe('')
  })
})

describe('the taunt, checked with its miss', () => {
  const voiceOpts = (missQ, extra = {}) => ({ bossKey: 'raid:test', voice: 'A boss.', sample: 'A generic boss line.', sampleUsed: () => false, markSample: () => {}, missQ, isLanguage: true, question: 'Means "to go up".', expected: 'salire', answer: 'scendere', userLang: 'English', ...extra })
  it('a clean taunt is shown', async () => {
    const ai = { hasKey: true, clean: (s) => s, call: async () => 'Scendere goes down; the word was salire.', factCheck: async () => [] }
    const r = await fetchTaunt(ai, voiceOpts(q()))
    expect(r).toMatchObject({ source: 'ai' })
  })
  it('a false taunt is rewritten once with the claim named; still false = the generic line', async () => {
    const prompts = []
    const ai = { hasKey: true, clean: (s) => s, call: async (sys, user) => { prompts.push(user); return prompts.length === 1 ? 'Scendere means to sleep, silly.' : 'Scendere means to sleep again.' }, factCheck: async () => flag('means to sleep') }
    const r = await fetchTaunt(ai, voiceOpts(q()))
    expect(prompts[1]).toMatch(/FALSE claims/)
    expect(r).toEqual({ line: 'A generic boss line.', source: 'sample' })
  })
  it('a failed check (timeout) = the generic line, never the unchecked taunt', async () => {
    const ai = { hasKey: true, clean: (s) => s, call: async () => 'A taunt with a word fact.', factCheck: async () => { throw new Error('timeout') } }
    const r = await fetchTaunt(ai, voiceOpts(q()))
    expect(r).toEqual({ line: 'A generic boss line.', source: 'sample' })
  })
  it('a Legends boss uses the same path (no missQ = no card to check against: shown as before)', async () => {
    const ai = { hasKey: true, clean: (s) => s, call: async () => 'Any line.', factCheck: async () => { throw new Error('never called') } }
    const r = await fetchTaunt(ai, voiceOpts(null))
    expect(r).toMatchObject({ line: 'Any line.', source: 'ai' })
  })
})
