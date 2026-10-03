import { describe, it, expect } from 'vitest'
import { buildLearnChatPrompt, boldParts } from './learnIt'

describe('learn it chat', () => {
  it('a general subject is not a language lesson', () => {
    const { system, user } = buildLearnChatPrompt({ name: 'CompTIA', isLanguage: false, userLang: 'Japanese' }, { front: 'Port 443', back: 'HTTPS' }, [{ role: 'user', content: 'why?' }])
    expect(system).toContain('Japanese')
    expect(user).toContain('not a language lesson')
    expect(user).toContain('Learner: why?')
  })
  it('a language subject names the learned language and its rules', () => {
    const { user } = buildLearnChatPrompt({ isLanguage: true, learnLang: 'Spanish', rules: 'Use Latin American Spanish.' }, { front: 'barro' }, [])
    expect(user).toContain('Spanish')
    expect(user).toContain('Latin American')
  })
  it('splits bold parts', () => {
    expect(boldParts('a **b** c')).toEqual([{ text: 'a ', bold: false }, { text: 'b', bold: true }, { text: ' c', bold: false }])
  })
})
