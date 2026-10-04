import { describe, it, expect } from 'vitest'
import { buildVerdictPrompt, parseVerdict, verdictOf, buildExplainPrompt, parseExplain, buildRecheckPrompt, parseRecheck } from './fightJudge'
import { judgeStrike, recheckStrike } from './judge'

const lang = { name: 'Spanish', isLanguage: true, learnLang: 'Spanish', userLang: 'English' }
const comptia = { name: 'CompTIA A+', isLanguage: false, userLang: 'English' }
const q = { prompt: 'Which port does HTTPS use?', accepted: ['443'], target: 'HTTPS port' }

describe('fast verdict', () => {
  it('asks only for the three flags (no note, no fix)', () => {
    const { system, user } = buildVerdictPrompt(comptia, q, '8443')
    expect(system).toContain('"target"')
    expect(system).not.toContain('note')
    expect(system).not.toContain('fix')
    expect(user).toContain('Student answer: 8443')
    expect(user).not.toMatch(/translate/i)
  })
  it('a language mode judges the tested form', () => {
    expect(buildVerdictPrompt(lang, { prompt: 'p', accepted: ['bebe'] }, 'beber').user).toContain('Spanish')
  })
  it('reads string flags and refuses a reply without target', () => {
    expect(parseVerdict({ target: 'true', all: 'False', accentsOnly: 'no' })).toEqual({ target: true, all: false, accentsOnly: false })
    expect(parseVerdict({ all: true })).toBeNull()
    expect(parseVerdict(null)).toBeNull()
  })
  it('maps flags to verdicts with the accent setting', () => {
    expect(verdictOf({ target: false })).toBe('miss')
    expect(verdictOf({ target: true, all: true })).toBe('clean')
    expect(verdictOf({ target: true, all: false, accentsOnly: true }, { strictAccents: true })).toBe('glancing')
    expect(verdictOf({ target: true, all: false, accentsOnly: true }, { strictAccents: false })).toBe('clean')
    expect(verdictOf({ target: true, all: false })).toBe('glancing')
    expect(verdictOf(null)).toBe('error')
  })
})

describe('explanation (background)', () => {
  it('asks for a fix only for a glancing answer whose slip is not only accents', () => {
    expect(buildExplainPrompt(comptia, q, 'x', { verdict: 'glancing' }).system).toContain('fix')
    expect(buildExplainPrompt(comptia, q, 'x', { verdict: 'miss' }).system).not.toContain('fix')
    expect(buildExplainPrompt(lang, q, 'x', { verdict: 'glancing', accentsOnly: true }).system).not.toContain('fix')
  })
  it('parses the note and the fix', () => {
    expect(parseExplain({ note: ' Port 443. ', fix: { question: 'Q?', answer: 'A' } })).toEqual({ note: 'Port 443.', attack: { prompt: 'Q?', accepted: ['A'] } })
    expect(parseExplain({ note: 'n', fix: null })).toEqual({ note: 'n' })
    expect(parseExplain('x')).toBeNull()
  })
})

describe('re-check and appeal', () => {
  it('carries the appeal reason and the fairness rules', () => {
    const { user } = buildRecheckPrompt(comptia, q, 'four four three', { verdict: 'miss', reason: 'I wrote the number in words' })
    expect(user).toContain('I wrote the number in words')
    expect(user).toMatch(/synonyms/)
    expect(buildRecheckPrompt(comptia, q, 'x').user).not.toContain('appeals')
  })
  it('only ever raises a verdict', () => {
    expect(parseRecheck({ right: true, all: true, why: 'Same.' }, 'miss')).toEqual({ verdict: 'clean', overturned: true, why: 'Same.' })
    expect(parseRecheck({ right: true, all: false }, 'miss')).toMatchObject({ verdict: 'glancing', overturned: true })
    expect(parseRecheck({ right: true, all: false }, 'glancing')).toMatchObject({ verdict: 'glancing', overturned: false })
    expect(parseRecheck({ right: false }, 'glancing')).toMatchObject({ verdict: 'glancing', overturned: false })
    expect(parseRecheck({ right: 'maybe' }, 'miss')).toBeNull()
  })
})

const fakeAi = (replies) => {
  const calls = []
  return { calls, hasKey: true, clean: (s) => String(s || '').trim(), json: (x) => x,
    call: async (system, user, opts) => { calls.push({ system, user, opts }); const r = replies.shift(); if (r instanceof Error) throw r; return r } }
}

describe('judgeStrike is fast: one small verdict call, the note later', () => {
  it('local exact needs no AI', async () => {
    const ai = fakeAi([])
    expect((await judgeStrike(ai, comptia, q, '443')).verdict).toBe('clean')
    expect(ai.calls.length).toBe(0)
  })
  it('a miss returns at once with the note as a background promise', async () => {
    const ai = fakeAi([{ target: false }, { note: 'HTTPS uses 443.' }])
    const j = await judgeStrike(ai, comptia, q, '80')
    expect(j).toMatchObject({ verdict: 'miss', note: '', ai: true })
    expect(ai.calls[0].opts.maxTokens).toBeLessThanOrEqual(150)
    expect(await j.later).toEqual({ note: 'HTTPS uses 443.' })
  })
  it('a glancing answer gets its fix in the background', async () => {
    const ai = fakeAi([{ target: true, all: false }, { note: 'n', fix: { question: 'Fix?', answer: 'ok' } }])
    const j = await judgeStrike(ai, comptia, q, 'port 443 udp')
    expect(j.verdict).toBe('glancing')
    expect(j.fixLater).toBe(true)
    expect((await j.later).attack).toEqual({ prompt: 'Fix?', accepted: ['ok'] })
  })
  it('a failed verdict call is an error (ask again), never a miss', async () => {
    expect((await judgeStrike(fakeAi([new Error('net')]), comptia, q, '80')).verdict).toBe('error')
    expect((await judgeStrike(fakeAi([{ nope: 1 }]), comptia, q, '80')).verdict).toBe('error')
  })
  it('a failed explanation resolves to {}', async () => {
    const j = await judgeStrike(fakeAi([{ target: false }, new Error('x')]), comptia, q, '80')
    expect(await j.later).toEqual({})
  })
  it('recheckStrike returns null when the check cannot run', async () => {
    expect(await recheckStrike(fakeAi([new Error('x')]), comptia, q, '80')).toBeNull()
    expect(await recheckStrike({ hasKey: false }, comptia, q, '80')).toBeNull()
    expect(await recheckStrike(fakeAi([{ right: true, all: true, why: 'w' }]), comptia, q, '443 ')).toMatchObject({ overturned: true, verdict: 'clean' })
  })
})

describe('fight settings reach the graders', () => {
  const q = { kind: 'typed', prompt: 'Ayer yo ___ (to eat, "c")', accepted: ['comí'], target: 'comer' }
  const base = { isLanguage: true, learnLang: 'Spanish', userLang: 'English', name: 'Spanish' }
  it('grammar feedback off: grammar outside the tested word does not count', () => {
    expect(buildVerdictPrompt({ ...base, grammarFeedback: false }, q, 'comí').user).toMatch(/do NOT count/)
    expect(buildVerdictPrompt({ ...base, grammarFeedback: true }, q, 'comí').user).toMatch(/grammar, agreement, spelling, accents/)
    expect(buildVerdictPrompt(base, q, 'comí').user).toMatch(/grammar, agreement, spelling, accents/) // no setting: as before
  })
  it('the phrasing line and the fight language reach every grader', () => {
    const s = { ...base, userLang: 'Spanish', phrasing: 'FULL IMMERSION: write EVERYTHING in Spanish' }
    expect(buildVerdictPrompt(s, q, 'x').user).toMatch(/FULL IMMERSION/)
    expect(buildExplainPrompt(s, q, 'x').user).toMatch(/note" in Spanish/)
    expect(buildRecheckPrompt(s, q, 'x').user).toMatch(/why" in Spanish/)
  })
})
