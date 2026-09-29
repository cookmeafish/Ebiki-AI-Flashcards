// Step questions are made once, saved, asked again reshuffled, and never repeat another step's.
import { describe, it, expect } from 'vitest'
import { reshuffleQuiz } from './generate'
import { stepKey, stepSig } from './store'
import { buildQuizPrompt, buildQuizCheckPrompt, parseQuizCheck } from './prompt'

const spanish = { name: 'Spanish', isLanguage: true, learnLang: 'Spanish', userLang: 'English', rules: '' }
const area = { id: 'greetings', title: 'Greetings', theme: 'Saying hello' }
const items = [{ id: 'i1', kind: 'phrase', front: 'Hola', back: 'Hello' }, { id: 'i2', kind: 'phrase', front: 'Buenos días', back: 'Good morning' }]

describe('saved step questions', () => {
  it('reshuffles without losing the right answer', () => {
    const qs = [
      { kind: 'choice', prompt: 'Hello?', choices: ['Hola', 'Adiós', 'Gracias', 'Perro'], answerIdx: 0 },
      { kind: 'typed', prompt: 'Good morning?', accepted: ['buenos días'] },
    ]
    for (let i = 0; i < 20; i++) {
      const out = reshuffleQuiz(qs)
      expect(out).toHaveLength(2)
      const c = out.find((q) => q.kind === 'choice')
      expect(c.choices[c.answerIdx]).toBe('Hola')
      expect([...c.choices].sort()).toEqual([...qs[0].choices].sort())
    }
    expect(qs[0].answerIdx).toBe(0) // the saved copy is untouched
  })
  it('keys every step with a name the store accepts', () => {
    const k = stepKey(1759012345678, 'saludar-en-ingles-con-un-titulo-muy-largo', 'n12')
    expect(k).toMatch(/^[a-z0-9][a-z0-9-]{0,63}$/)
    expect(stepKey(1, 'a', 'n1')).not.toBe(stepKey(1, 'a', 'n2'))
  })
  it('recognizes when a step now teaches something else', () => {
    expect(stepSig(items)).toBe(stepSig(items.map((it) => ({ ...it }))))
    expect(stepSig(items)).not.toBe(stepSig([items[0], { ...items[1], back: 'Good day' }]))
  })
  it('tells the writer which questions the area already asked', () => {
    const p = buildQuizPrompt(spanish, area, { kind: 'practice' }, { typedItems: items, avoid: ['How do you say hello?'] })
    expect(p.user).toMatch(/already got in this area's other steps/)
    expect(p.user).toMatch(/- How do you say hello\?/)
    expect(buildQuizPrompt(spanish, area, { kind: 'practice' }, { typedItems: items }).user).not.toMatch(/other steps/)
  })
})

describe('quiz review pass', () => {
  const qs = [
    { kind: 'choice', prompt: 'The correct way to use "to be" with "I"?', choices: ['I am Carlos.', "I'm Carlos.", 'I is Carlos.', 'Me am Carlos.'], answerIdx: 1 },
    { kind: 'typed', prompt: 'Say hello', accepted: ['hello', 'hi'] },
  ]
  it('shows the reviewer the key, the material and what counts as unfair', () => {
    const p = buildQuizCheckPrompt(spanish, items, qs)
    expect(p.user).toMatch(/\[KEY\] I'm Carlos\./)
    expect(p.user).toMatch(/accepted: hello \| hi/)
    expect(p.user).toMatch(/Hola = Hello/)
    expect(p.system).toMatch(/second option \(not the \[KEY\]\) could also fairly be called correct/)
    expect(p.user).toMatch(/correct but less casual is still CORRECT/)
  })
  it('reads only real question indexes', () => {
    expect([...parseQuizCheck({ bad: [{ i: 0, why: 'I am is correct too' }, { i: 7 }, { i: 'x' }] }, 2)]).toEqual([0])
    expect(parseQuizCheck(null, 2).size).toBe(0)
    expect([...parseQuizCheck([1], 2)]).toEqual([1])
  })
  it('keeps the subject description out of quiz content', () => {
    expect(buildQuizPrompt(spanish, area, { kind: 'learn' }, { choiceItems: items }).user).toMatch(/never quiz content/)
  })
})
