import { describe, it, expect } from 'vitest'
import {
  buildPlacementPrompt, buildMapPrompt, buildAreaPrompt, buildQuizPrompt, buildTalkSystem, buildTalkTurn, buildTalkScorePrompt,
  buildMapEditPrompt, parseQuestions, itemIdFor, parseTalkScore, buildRaidPrompt,
} from './prompt'

const id = (s) => s
const spanish = { name: 'Spanish', description: '', isLanguage: true, learnLang: 'Spanish', userLang: 'English', rules: 'Use Latin American Spanish.' }
const comptia = { name: 'CompTIA A+', description: 'IT certification', isLanguage: false, learnLang: 'English', userLang: 'English', rules: '' }
const area = { id: 'a1', title: 'At the market', theme: 'Buying food at a busy market', motif: 'city', palette: 'sunset', items: [], frozen: false, status: 'open' }
const items = [{ id: 'a1-i1', kind: 'term', front: 'la manzana', back: 'apple' }, { id: 'a1-i2', kind: 'rule', front: 'When does "el" carry an accent?', back: '...' }]
const all = (p) => (typeof p === 'string' ? p : `${p.system}\n${p.user}`)

describe('prompts', () => {
  const built = [
    buildPlacementPrompt(spanish, 2, 5, { avoid: ['old question'] }),
    buildPlacementPrompt(comptia, 4, 5),
    buildMapPrompt(spanish, { start: { reason: 'travel' }, level: 'level 30' }),
    buildMapPrompt(comptia, { after: ['Hardware basics'] }),
    buildAreaPrompt(spanish, area, { before: ['Greetings'] }),
    buildAreaPrompt(comptia, area),
    buildQuizPrompt(spanish, area, { kind: 'practice', title: 'Use them' }, { choiceItems: items.slice(0, 1), typedItems: items.slice(1) }),
    buildQuizPrompt(comptia, area, { kind: 'boss' }, { typedItems: items }),
    buildTalkSystem(spanish, area, items),
    buildTalkScorePrompt(comptia, area, [{ role: 'ebi', text: 'Hi' }, { role: 'me', text: 'Hello' }]),
    buildMapEditPrompt(comptia, { areas: [area] }, 'add an area about subnetting'),
  ]
  it('never contain dashes the model could copy', () => {
    for (const p of built) expect(all(p)).not.toMatch(/[–—]/)
  })
  it('keep a general subject out of language lessons, and carry the language rules', () => {
    expect(all(built[1])).toMatch(/never a language lesson/)
    expect(all(built[3])).toMatch(/Hardware basics/)
    expect(all(built[0])).toMatch(/Latin American Spanish/)
    expect(all(built[0])).toMatch(/old question/)
    expect(all(built[6])).toMatch(/multiple choice\): la manzana/)
  })
  it('tells the editor which areas are started', () => {
    expect(all(built[10])).toMatch(/"started":false/)
    expect(all(buildMapEditPrompt(comptia, { areas: [{ ...area, frozen: true }] }, 'x'))).toMatch(/"started":true/)
  })
  it('asks questions only about the material the learner was shown', () => {
    const three = [
      { id: 'i1', kind: 'phrase', front: 'Hello / Hi', back: 'Hola. "Hello" is more formal, "Hi" more casual.' },
      { id: 'i2', kind: 'phrase', front: 'Good morning', back: 'Buenos días' },
      { id: 'i3', kind: 'phrase', front: 'How are you?', back: '¿Cómo estás?' },
    ]
    const p = all(buildQuizPrompt(spanish, area, { kind: 'learn' }, { choiceItems: three, knowledge: 'A whole textbook about travel.' }))
    expect(p).toMatch(/only source of questions/)
    expect(p).toMatch(/Hello \/ Hi = Hola\. "Hello" is more formal/)   // the full taught text, not only the fronts
    expect(p).toMatch(/Spread the 9 questions over these 3 items/) // a lesson asks 10, capped at 3 per item
    expect(p).toMatch(/never ask about anything in it that the learning material above does not teach/)
    expect(p).not.toMatch(/NOT in the material above/)
    expect(all(buildQuizPrompt(spanish, area, { kind: 'learn' }, { choiceItems: three, strict: true }))).toMatch(/NOT in the material above/)
    // never more than three questions per taught item
    expect(all(buildQuizPrompt(spanish, area, { kind: 'boss' }, { typedItems: three.slice(0, 2) }))).toMatch(/Spread the 6 questions over these 2 items/)
  })
  it('matches a question to the taught item it checks, and nothing else', () => {
    expect(itemIdFor({ target: 'la manzana' }, items)).toBe('a1-i1')
    expect(itemIdFor({ target: 'el perro' }, items)).toBe('')
    expect(itemIdFor({}, items)).toBe('')
  })
  it('writes the conversation turn', () => {
    expect(buildTalkTurn([])).toMatch(/opening question/)
    expect(buildTalkTurn([{ role: 'ebi', text: 'Hola' }, { role: 'me', text: 'Buenas' }])).toBe('Ebi: Hola\nLearner: Buenas\nEbi:')
  })
})

describe('parsers', () => {
  it('sanitizes questions (drops unusable ones)', () => {
    const qs = parseQuestions({ questions: [
      { type: 'choice', question: 'Pick', choices: ['a', 'b', 'c', 'd'], answer: 2, target: 'la manzana' },
      { type: 'typed', question: 'Say apple', accepted: ['la manzana'], target: 'la manzana' },
      { type: 'typed', question: 'no answer' },
      { type: 'typed', question: 'The answer is la manzana', accepted: ['la manzana'] },
    ] }, id)
    expect(qs.map((q) => q.kind)).toEqual(['choice', 'typed'])
    expect(qs[0].target).toBe('la manzana')
    expect(parseQuestions(null, id)).toEqual([])
  })
  it('finds the item a question checks', () => {
    expect(itemIdFor({ target: 'La manzana' }, items)).toBe('a1-i1')
    expect(itemIdFor({ target: 'manzana' }, items)).toBe('a1-i1')
    expect(itemIdFor({ target: '' }, items)).toBe('')
    expect(itemIdFor({}, items)).toBe('')
  })
  it('reads a talk score in either scale', () => {
    expect(parseTalkScore({ score: 80, note: 'Good', gaps: ['ser vs estar', 1] }, id)).toMatchObject({ score: 0.8, gaps: ['ser vs estar', '1'] })
    expect(parseTalkScore({ score: 0.5 }, id).score).toBe(0.5)
    expect(parseTalkScore({ score: 'x' }, id)).toBeNull()
  })
})

describe('review and the hard fights', () => {
  const items = [{ id: 'n1', front: 'Hola', back: 'Hello' }, { id: 'n2', front: 'Adiós', back: 'Bye' }]
  const earlier = [{ id: 'e1', front: 'Gracias', back: 'Thanks' }]
  const sp = { name: 'Spanish', isLanguage: true, learnLang: 'Spanish', userLang: 'English', rules: '' }
  const ar = { id: 'a', title: 'Greetings', theme: '' }
  it('mixes earlier levels into a lesson, grounded in their text', () => {
    const p = buildQuizPrompt(sp, ar, { kind: 'learn' }, { choiceItems: items, reviewItems: earlier })
    expect(p.user).toMatch(/REVIEW: the last 1 items above were taught in EARLIER levels \(Gracias\)/)
    expect(p.user).toMatch(/Gracias = Thanks/)
    expect(p.user).not.toMatch(/New or shaky/) // a lesson asks each new item both ways itself
  })
  it('makes the boss and a Legendary run hard, never unfair', () => {
    expect(buildQuizPrompt(sp, ar, { kind: 'boss' }, { typedItems: items }).user).toMatch(/Push the learner to the limit.*never unfair/s)
    expect(buildQuizPrompt(sp, ar, { kind: 'legendary' }, { typedItems: items }).user).toMatch(/EVERY question typed/)
  })
})

describe('raid prompt follows the fight settings', () => {
  const cards = [{ front: 'llover', back: 'to rain' }]
  it('immersion, dialect and the letter cue', () => {
    const s = { name: 'Spanish', isLanguage: true, learnLang: 'Spanish', userLang: 'Spanish', rules: 'DIALECT Mexican Spanish', phrasing: 'FULL IMMERSION: write EVERYTHING in Spanish' }
    const { user } = buildRaidPrompt(s, cards)
    expect(user).toMatch(/FULL IMMERSION/)
    expect(user).toMatch(/DIALECT Mexican Spanish/)
    expect(user).toMatch(/first letter/)
    expect(user).toMatch(/romanization/)
    expect(user).toMatch(/Ask in Spanish/)
  })
  it('a general mode in Japanese keeps its terms', () => {
    const s = { name: 'CompTIA A+', isLanguage: false, learnLang: 'English', userLang: 'Japanese', phrasing: 'Phrase everything in Japanese. Subject terms ... never translated' }
    const { user } = buildRaidPrompt(s, [{ front: 'Port 443', back: 'HTTPS' }])
    expect(user).toMatch(/Phrase everything in Japanese/)
    expect(user).not.toMatch(/first letter/)
  })
})
