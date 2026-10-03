import { describe, it, expect } from 'vitest'
import { buildCallSystem, buildCallTurn, HISTORY_TURNS } from './prompt'

const subject = { name: 'Spanish', isLanguage: true, learnLang: 'Spanish', userLang: 'English', rules: '' }
const targets = [{ cardId: 11, front: 'gato', back: 'cat' }, { cardId: 12, front: 'perro', back: 'dog' }]

describe('buildCallSystem', () => {
  it('marks items already graded so Ebi moves on', () => {
    const s = buildCallSystem(subject, targets, { done: ['11'] })
    expect(s).toMatch(/id 11: gato = cat \(ALREADY USED/)
    expect(s).not.toMatch(/id 12: perro = dog \(ALREADY USED/)
  })
  it('has no dashes and works for a general subject', () => {
    const s = buildCallSystem({ name: 'CompTIA', isLanguage: false, userLang: 'English' }, targets)
    expect(s).not.toMatch(/[–—]/)
    expect(s).toMatch(/never a language lesson/)
  })
})

describe('buildCallTurn', () => {
  it('opens the call with no history and sends only the recent turns', () => {
    expect(buildCallTurn([])).toMatch(/just connected/)
    const many = Array.from({ length: HISTORY_TURNS + 4 }, (_, i) => ({ role: i % 2 ? 'ebi' : 'me', text: `m${i}` }))
    const turn = buildCallTurn(many)
    expect(turn).not.toMatch(/: m0\n/)
    expect(turn).toMatch(new RegExp(`m${HISTORY_TURNS + 3}`))
  })
})
