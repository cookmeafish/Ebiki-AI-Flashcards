import { describe, it, expect } from 'vitest'
import { buildSuggestionPrompt } from './prompts'

const base = { profile: { level: { scale: 'cefr', estimate: 'A2' } }, modeType: 'language', modeName: 'Spanish', studyLanguage: 'Spanish', excludeList: [], itemType: 'word', focus: '', difficulty: 'level' }

describe('Discover and the Legends level', () => {
  it('adds the measured level only when it is passed (the learner opted in)', () => {
    expect(buildSuggestionPrompt(base)).not.toMatch(/MEASURED LEVEL/)
    const p = buildSuggestionPrompt({ ...base, learnerLevel: 'level 47 of 130, B1; weak at: food' })
    expect(p).toMatch(/MEASURED LEVEL .*level 47 of 130, B1; weak at: food/)
    expect(p).toMatch(/outranks the estimate below/)
  })
  it('writes no dashes', () => {
    expect(buildSuggestionPrompt({ ...base, learnerLevel: 'level 3 of 130, A1' })).not.toMatch(/[\u2013\u2014]/)
  })
})

describe('Discover prompts fit any subject', () => {
  const general = { ...base, modeType: 'general', modeName: 'Italian cooking', studyLanguage: '', itemType: 'term' }
  it('never frames a non-exam subject as an exam', () => {
    const p = buildSuggestionPrompt(general)
    expect(p).not.toMatch(/under-covered exam domain/)
    expect(p).toMatch(/under-covered domain or area/)
  })
  it('never prints an undefined level', () => {
    expect(buildSuggestionPrompt({ ...general, profile: { level: { scale: 'tiers' } } })).not.toMatch(/undefined/)
    expect(buildSuggestionPrompt({ ...general, profile: null })).toMatch(/tiers = beginner/)
    expect(buildSuggestionPrompt({ ...general, profile: { level: { scale: 'tiers' } } })).toMatch(/tiers = unknown/)
  })
})

describe('the exclude list in the prompt', () => {
  it('lists each term once (the ledger and the deck repeat terms)', () => {
    const p = buildSuggestionPrompt({ ...base, excludeList: ['perro', 'Perro', 'gato', 'perro ', 'gato'] })
    expect(p.match(/^ {2}- /gm)).toHaveLength(2)
  })
  it('survives a missing list and a damaged domains entry', () => {
    expect(() => buildSuggestionPrompt({ ...base, excludeList: undefined, profile: { domains: [null, { name: 'food' }] } })).not.toThrow()
    expect(buildSuggestionPrompt({ ...base, excludeList: undefined })).toMatch(/\(none yet\)/)
  })
})
