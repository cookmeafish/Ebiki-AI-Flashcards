import { describe, it, expect } from 'vitest'
import { checkedNote } from './judge'
import { buildExplainPrompt } from './fightJudge'

const q = { kind: 'typed', prompt: 'Means "to go up".', accepted: ['salire'], _guard: { meaning: 'to go up' } }

describe('a fight note is fact checked before the learner reads it', () => {
  it('a clean note is kept as written (one check, no rewrite)', async () => {
    let checks = 0, rewrites = 0
    const ai = { factCheck: async () => { checks++; return [] } }
    const out = await checkedNote(ai, q, 'scendere', { note: 'A fine note.' }, async () => { rewrites++; return {} })
    expect(out.note).toBe('A fine note.')
    expect([checks, rewrites]).toEqual([1, 0])
  })
  it('a false claim: one rewrite told what was false, checked again, then shown', async () => {
    const seen = []
    const ai = { factCheck: async ({ reply, context, always }) => { expect(always).toBe(true); seen.push(context); return reply.includes('bad') ? [{ quote: 'bad claim', fix: 'It means something else.' }] : [] } }
    let told = null
    const out = await checkedNote(ai, q, 'scendere', { note: 'A bad claim here.', attack: { prompt: 'p', accepted: ['a'] } }, async (wrong) => { told = wrong; return { note: 'A corrected note.' } })
    expect(out.note).toBe('A corrected note.')
    expect(told[0].quote).toBe('bad claim')
    expect(out.attack).toEqual({ prompt: 'p', accepted: ['a'] }) // the follow-up question survives the rewrite
    expect(seen[0]).toMatch(/salire/)
    expect(seen[0]).toMatch(/to go up/)
  })
  it('still false after the rewrite: no note at all (never a wrong fact), the attack kept', async () => {
    const ai = { factCheck: async () => [{ quote: 'x', fix: 'y' }] }
    const out = await checkedNote(ai, q, 'scendere', { note: 'x is wrong', attack: { prompt: 'p', accepted: ['a'] } }, async () => ({ note: 'x again' }))
    expect(out.note).toBe('')
    expect(out.attack).toBeTruthy()
  })
  it('no fact check available, a check that throws, or an empty note: unchanged', async () => {
    expect((await checkedNote({}, q, 'a', { note: 'n' }, async () => ({}))).note).toBe('n')
    expect((await checkedNote({ factCheck: async () => { throw new Error('down') } }, q, 'a', { note: 'n' }, async () => ({}))).note).toBe('n')
    expect(await checkedNote({ factCheck: async () => [] }, q, 'a', {}, async () => ({}))).toEqual({})
  })
  it('the rewrite prompt names each false claim', () => {
    const { user } = buildExplainPrompt({ userLang: 'English' }, q, 'scendere', { wrong: [{ quote: 'bad claim', fix: 'It means something else.' }] })
    expect(user).toMatch(/FALSE claims/)
    expect(user).toMatch(/bad claim/)
  })
})
