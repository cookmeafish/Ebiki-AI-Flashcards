import { describe, it, expect } from 'vitest'
import { shapeModeType, shapeTagCategories, shapeChatSuggestions, shapeDiscoverKinds } from './modeSpec'
import { buildGenericCardPrompt, GENERIC_CARD_PROMPT, LANGUAGE_CARD_PROMPT } from './prompts'
import { buildSuggestionPrompt, buildProfilePrompt } from '../discover/prompts'

const DASH = /[–—]/

describe('mode type from a model', () => {
  it('reads every way a model says "language"', () => {
    for (const v of ['language', 'Language', ' LANGUAGE ', 'Language learning', 'foreign language', 'language-course', 'lang'])
      expect(shapeModeType(v)).toBe('language')
  })
  it('keeps everything else general', () => {
    for (const v of ['general', 'General', 'general (not a language)', 'not a language', 'certification', '', null, undefined, 3, {}, ['x']])
      expect(shapeModeType(v)).toBe('general')
  })
})

describe('tag categories, chips and Discover kinds from messy replies', () => {
  it('turns any list or string into clean unique tokens', () => {
    expect(shapeTagCategories(['Ports', 'ports', { en: 'Attack Types' }, null, 7, ''])).toEqual(['ports', 'attack-types', '7'])
    expect(shapeTagCategories('ports, crypto\nprotocols')).toEqual(['ports', 'crypto', 'protocols'])
    expect(shapeTagCategories(Array.from({ length: 20 }, (_, i) => `t${i}`))).toHaveLength(12)
    expect(shapeTagCategories(undefined)).toEqual([])
  })
  it('reads chat chips sent as a list, a numbered string or objects', () => {
    expect(shapeChatSuggestions('1. Explain subnetting\n2. Quiz me on ports\n3. Make a card for DNS\n4. extra')).toEqual(['Explain subnetting', 'Quiz me on ports', 'Make a card for DNS'])
    expect(shapeChatSuggestions([{ en: 'Explain VFR' }, '', null, 'Quiz me'])).toEqual(['Explain VFR', 'Quiz me'])
    expect(shapeChatSuggestions(42)).toEqual([])
  })
  it('keeps one Discover kind per key and never the reserved "both"', () => {
    const got = shapeDiscoverKinds([
      { key: 'both', label: 'All', rule: 'x' },
      { key: 'Chords', label: 'Chords', rule: 'Suggest a chord.' },
      { key: 'chords', label: 'Again', rule: 'dup' },
      { key: 'scales', label: { en: 'Scales' }, rule: 'Suggest a scale.' },
      { key: 'x', label: '', rule: 'no label' },
      'junk', null,
    ])
    expect(got).toEqual([{ key: 'chords', label: 'Chords', rule: 'Suggest a chord.' }, { key: 'scales', label: 'Scales', rule: 'Suggest a scale.' }])
  })
})

const SUBJECTS = [
  { name: 'Security+', desc: 'CompTIA Security+ SY0-701 exam' },
  { name: 'Private Pilot', desc: 'FAA private pilot license ground school' },
  { name: 'Cooking', desc: 'French home cooking techniques' },
  { name: 'Piano Theory', desc: 'chords, scales and harmony' },
  { name: 'Contract Law', desc: 'first-year law school contracts' },
]

describe('card prompts for any subject', () => {
  for (const s of SUBJECTS) {
    it(`generic card prompt for ${s.name} is complete, honest and dash-free`, () => {
      const p = buildGenericCardPrompt({ mode: s.name, type: 'general', userLang: 'Spanish', description: `\nMode description: ${s.desc} $& $1`, format: ' Choose labels.', tagRules: '\n  TAG RULES: ebiki' })
      expect(p).not.toMatch(/\{(MODE|TYPE|USER_LANG|DESCRIPTION|FORMAT|TAG_RULES)\}/)
      expect(p).toContain(`"${s.name}"`)
      expect(p).toContain('$& $1') // inserted literally
      expect(p).toContain('in Spanish')
      expect(p).toMatch(/Keep in their original form: the front term itself, proper nouns, technical terms/)
      expect(p).toMatch(/ACCURACY IS CRITICAL/)
      expect(p).toMatch(/"correction"/)
      expect(p).not.toMatch(DASH)
      // Never language-course wording for a non-language subject.
      expect(p).not.toMatch(/part of speech|pronunciation|translation\(s\)|learned language/i)
    })
  }
  it('every placeholder is filled even when it appears twice', () => {
    expect(GENERIC_CARD_PROMPT.match(/\{USER_LANG\}/g)?.length || 0).toBeGreaterThan(0)
    const p = buildGenericCardPrompt({})
    expect(p).not.toMatch(/\{[A-Z_]+\}/)
  })
  it('the language card prompt has no stray placeholder once filled', () => {
    const p = LANGUAGE_CARD_PROMPT.replace(/\{LEARN_LANG\}/g, 'Japanese').replace(/\{USER_LANG\}/g, 'English').replace(/\{DIALECT_PRON\}/g, '')
    expect(p).not.toMatch(/\{[A-Z_]+\}/)
    expect(p).not.toMatch(DASH)
  })
})

describe('Discover prompts for any subject', () => {
  for (const s of SUBJECTS) {
    it(`${s.name}: no exam framing unless it is an exam, no part of speech, dash-free`, () => {
      const p = buildSuggestionPrompt({ profile: null, modeType: 'general', modeName: s.name, modeDescription: s.desc, excludeList: [], itemType: 'scenario', userLanguage: 'Japanese' })
      expect(p).not.toMatch(DASH)
      expect(p).not.toMatch(/exam-style/)
      expect(p).toMatch(/"partOfSpeech": "" \(always empty/)
      expect(p).toContain('in Japanese')
      expect(p).not.toMatch(/target language/)
      const prof = buildProfilePrompt({ modeType: 'general', modeName: s.name, modeDescription: s.desc, evidence: 'none', userLanguage: 'Japanese' })
      expect(prof).not.toMatch(DASH)
    })
  }
  it('a language mode still asks for the part of speech in the learner language', () => {
    const p = buildSuggestionPrompt({ profile: null, modeType: 'language', modeName: 'Spanish', studyLanguage: 'Spanish', excludeList: [], itemType: 'word', userLanguage: 'English' })
    expect(p).toMatch(/"partOfSpeech": "<part of speech in English/)
    expect(p).toMatch(/The item must be in Spanish/)
  })
})
