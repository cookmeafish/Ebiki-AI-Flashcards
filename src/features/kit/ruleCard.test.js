import { describe, it, expect } from 'vitest'
import { buildRuleCardPrompt, parseRuleCard, RULE_TAGS } from './ruleCard'

const lang = { name: 'Spanish', isLanguage: true, learnLang: 'Spanish', userLang: 'English', rules: '' }
const gen = { name: 'CompTIA A+', isLanguage: false, learnLang: 'English', userLang: 'English' }

describe('rule cards', () => {
  it('asks for grammar and orthography rules in a language, principles elsewhere', () => {
    expect(buildRuleCardPrompt(lang, { text: 'missing accent on qué' }).user).toMatch(/orthography/)
    const g = buildRuleCardPrompt(gen, { text: 'mixed up RAID 0 and 1' }).user
    expect(g).toMatch(/never a language lesson/)
    expect(g).not.toMatch(/orthography/)
  })
  it('names cards already made so they are not repeated', () => {
    expect(buildRuleCardPrompt(lang, { text: 'x' }, { avoid: ['When does qué carry an accent?'] }).user).toMatch(/never repeat/)
  })
  it('parses a card, keeps line breaks, adds the rule tags', () => {
    const c = parseRuleCard({ front: 'When does qué take an accent?', back: 'In questions.\nExample: ¿Qué hora es?', tags: ['Accents', 'tildes'] })
    expect(c.back.split('\n')).toHaveLength(2)
    expect(c.tags).toEqual([...RULE_TAGS, 'accents', 'tildes'])
  })
  it('honors a skip and refuses an incomplete card', () => {
    expect(parseRuleCard({ skip: true, why: 'a typo' })).toEqual({ skip: true, why: 'a typo' })
    expect(parseRuleCard({ front: 'x' })).toBe(null)
    expect(parseRuleCard(null)).toBe(null)
  })
  it('never shows an object as text, reads a back sent as a list of lines', () => {
    expect(parseRuleCard({ front: { text: 'x' }, back: 'y' })).toBe(null)
    expect(parseRuleCard({ front: 'Rule?', back: ['The rule.', 'Example one.', { x: 1 }] }).back).toBe('The rule.\nExample one.')
    expect(parseRuleCard({ skip: true, why: { a: 1 } })).toEqual({ skip: true, why: '' })
  })
})
