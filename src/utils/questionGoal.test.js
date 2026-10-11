import { describe, it, expect } from 'vitest'
import { questionGoal, cardGoal, shapeGoal, goalLine, goalAllowsHint, GOAL_CHECK_RULES, GOALS, LANGUAGE_GOALS, GENERAL_GOALS, goalField } from './questionGoal'

describe('the question goal: what a card needs the learner to reproduce or understand', () => {
  it('language cards: a word, an expression, or a rule', () => {
    expect(questionGoal({ isLanguage: true, front: 'perro', back: 'dog' })).toBe('word')
    expect(questionGoal({ isLanguage: true, front: 'el sombrero', back: 'hat' })).toBe('word')
    expect(questionGoal({ isLanguage: true, front: 'echar de menos', back: 'to miss someone' })).toBe('phrase')
    expect(questionGoal({ isLanguage: true, front: '¿Qué hora es?', back: 'What time is it?' })).toBe('phrase')
    expect(questionGoal({ isLanguage: true, front: 'Regla: ser vs estar', back: 'ser for identity' })).toBe('rule')
    expect(questionGoal({ isLanguage: true, front: 'por vs para', back: '...', kind: 'rule' })).toBe('rule')
    expect(questionGoal({ isLanguage: true, front: '¿Cuándo se usa el subjuntivo?', back: 'deseos, dudas' })).toBe('rule')
  })
  it('general cards: a concept by default (CompTIA "secure enclave"), facts, procedures, formulas', () => {
    expect(questionGoal({ front: 'Secure enclave', back: 'A hardware-isolated area of a processor that keeps keys and biometric data away from the main OS.' })).toBe('concept')
    expect(questionGoal({ front: 'Which port does SSH use?', back: '22' })).toBe('fact')
    expect(questionGoal({ front: 'Year the Berlin Wall fell', back: '1989' })).toBe('fact')
    expect(questionGoal({ front: 'Engine failure after takeoff', back: '1. Pitch for best glide\n2. Pick a field ahead\n3. Fuel, mixture, mags' })).toBe('procedure')
    expect(questionGoal({ front: 'Ohm\'s law', back: 'V = I × R' })).toBe('formula')
    expect(questionGoal({ front: 'Kerberos', back: 'x', kind: 'skill' })).toBe('procedure')
  })
  it('a goal the writer states is kept only when it fits the mode kind', () => {
    expect(questionGoal({ front: 'Secure enclave', back: 'x', aiGoal: 'Fact.' })).toBe('fact')
    expect(questionGoal({ front: 'Secure enclave', back: 'x', aiGoal: 'word' })).toBe('concept')
    expect(questionGoal({ isLanguage: true, front: 'perro', back: 'dog', aiGoal: 'concept' })).toBe('word')
    expect(shapeGoal(' Procedure ')).toBe('procedure')
    expect(shapeGoal('nonsense')).toBe('')
    expect(shapeGoal({})).toBe('')
  })
  it('is cached per card and never throws on junk', () => {
    const a = cardGoal({ front: 'TLS', back: 'Transport Layer Security encrypts traffic.' })
    expect(cardGoal({ front: 'TLS', back: 'Transport Layer Security encrypts traffic.' })).toBe(a)
    for (const junk of [undefined, null, {}, { front: 42, back: [1] }, { front: '', back: '' }]) expect(GOALS).toContain(questionGoal(junk || undefined))
  })
  it('every goal has a line at every tier; a concept stops asking only for its name past the lowest tiers', () => {
    for (const g of GOALS) for (let t = 0; t <= 5; t++) expect(goalLine(g, t)).toMatch(/THE GOAL/)
    expect(goalLine('concept', 1)).toMatch(/ask for the term/)
    expect(goalLine('concept', 2)).toMatch(/never its definition restated/)
    expect(goalLine('concept', 4)).toMatch(/explain|compare|troubleshoot/)
    expect(goalLine('word', 1)).toMatch(/produce the word/)
    expect(goalLine('word', 4)).toMatch(/use it/)
    expect(goalLine('rule', 3)).toMatch(/APPLY/)
    expect(goalLine('nope', 2)).toBe('')
  })
  it('only language goals get a prefix hint; the review rejects off-goal questions', () => {
    for (const g of LANGUAGE_GOALS) expect(goalAllowsHint(g)).toBe(true)
    for (const g of GENERAL_GOALS) expect(goalAllowsHint(g)).toBe(false)
    expect(GOAL_CHECK_RULES).toMatch(/CONCEPT card at TIER 2/)
    expect(GOAL_CHECK_RULES).toMatch(/not in a language course/)
    expect(goalField(false)).toMatch(/concept/)
    expect(goalField(true)).not.toMatch(/concept/)
  })
})
