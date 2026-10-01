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
