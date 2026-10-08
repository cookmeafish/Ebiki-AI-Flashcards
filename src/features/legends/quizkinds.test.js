import { describe, it, expect } from 'vitest'
import { fitQuestionsToKind, buildQuizPrompt, buildRaidPrompt } from './prompt'

const choice = { kind: 'choice', prompt: 'Which port does HTTPS use?', choices: ['80', '443', '22', '21'], answerIdx: 1 }
const typed = { kind: 'typed', prompt: 'Name the port HTTPS uses.', accepted: ['443'] }
const dual = { kind: 'typed', prompt: 'Which port carries SSH?', accepted: ['22'], alt: { choices: ['22', '23', '25', '110'], answerIdx: 0 } }

describe('fitQuestionsToKind', () => {
  it('a Legendary set is typed only: choice-only questions go, a dual question loses its choices', () => {
    const out = fitQuestionsToKind([choice, typed, dual], 'legendary')
    expect(out.map((q) => q.prompt)).toEqual([typed.prompt, dual.prompt])
    expect(out.every((q) => q.kind === 'typed' && !q.alt)).toBe(true)
  })
  it('steps that are not fights keep every question as it is', () => {
    for (const kind of ['learn', 'practice', 'rule', 'weak']) {
      expect(fitQuestionsToKind([choice, typed, dual], kind)).toEqual([choice, typed, dual])
    }
  })
  it('handles a missing list', () => {
    expect(fitQuestionsToKind(null, 'legendary')).toEqual([])
    expect(fitQuestionsToKind(undefined, 'boss')).toEqual([])
  })

  // The boss enrages at half health and the header says "no safe strikes": a choice-only question still showed its
  // tiles and dealt a safe strike. Every fight question must stand typed, its choices only the optional `alt`.
  describe('boss and raid fights: every question can be typed', () => {
    for (const kind of ['boss', 'raid']) {
      it(`${kind}: a choice-only question that stands alone becomes typed, its options kept as the alt`, () => {
        const out = fitQuestionsToKind([choice, typed, dual], kind)
        expect(out).toHaveLength(3)
        expect(out.every((q) => q.kind === 'typed')).toBe(true)
        const conv = out[0]
        expect(conv.prompt).toBe(choice.prompt)
        expect(conv.accepted).toEqual(['443'])
        expect(conv.alt.choices[conv.alt.answerIdx]).toBe('443')
        expect([...conv.alt.choices].sort()).toEqual([...choice.choices].sort())
        expect(out[1]).toEqual(typed)
        expect(out[2]).toEqual(dual)
      })
    }
    it('a question that cannot stand without its options is dropped', () => {
      const needs = [
        { kind: 'choice', prompt: 'Which of these is a secure protocol?', choices: ['HTTP', 'SSH', 'Telnet', 'FTP'], answerIdx: 1 },
        { kind: 'choice', prompt: 'Which of the following uses port 22?', choices: ['SSH', 'DNS', 'SMTP', 'POP3'], answerIdx: 0 },
        { kind: 'choice', prompt: 'Pick the correct sentence.', choices: ['Yo soy', 'Yo es', 'Yo eres', 'Yo somos'], answerIdx: 0 },
        { kind: 'choice', prompt: 'Choose the right greeting for the morning.', choices: ['Buenos días', 'Buenas noches', 'Adiós', 'Hasta luego'], answerIdx: 0 },
        { kind: 'choice', prompt: '¿Cuál de estas palabras es un color?', choices: ['rojo', 'mesa', 'perro', 'casa'], answerIdx: 0 },
        { kind: 'choice', prompt: '以下哪个是颜色？', choices: ['红', '桌子', '狗', '房子'], answerIdx: 0 },
        { kind: 'choice', prompt: '次のうち、色はどれですか。', choices: ['赤', '机', '犬', '家'], answerIdx: 0 },
        { kind: 'choice', prompt: 'What does TCP guarantee?', choices: ['Delivery', 'Speed', 'Both of the above', 'None of the above'], answerIdx: 2 },
        { kind: 'choice', prompt: 'Is HTTP encrypted?', choices: ['True', 'False'], answerIdx: 1 },
      ]
      expect(fitQuestionsToKind(needs, 'boss')).toEqual([])
      expect(fitQuestionsToKind(needs, 'raid')).toEqual([])
    })
    it('a choice question whose prompt holds its own answer is dropped, never turned into a giveaway', () => {
      const leaks = { kind: 'choice', prompt: 'HTTPS runs on 443. What port is that?', choices: ['80', '443', '22', '21'], answerIdx: 1 }
      expect(fitQuestionsToKind([leaks], 'boss')).toEqual([])
    })
    it('keeps the question extras (audio, target, explanation)', () => {
      const q = { ...choice, target: 'HTTPS', explanation: 'Secure web.', audio: { text: 'x', lang: 'en' } }
      const [out] = fitQuestionsToKind([q], 'boss')
      expect(out).toMatchObject({ kind: 'typed', target: 'HTTPS', explanation: 'Secure web.', audio: { text: 'x', lang: 'en' } })
    })
    it('skips junk entries', () => {
      expect(fitQuestionsToKind([null, 5, 'x', { kind: 'choice', prompt: 'Q?', choices: ['a'], answerIdx: 3 }], 'boss')).toEqual([])
    })
  })
})

describe('fight prompts ask for typed answers', () => {
  const subject = { name: 'CompTIA A+', isLanguage: false, userLang: 'English', learnLang: 'English' }
  const area = { title: 'Ports', theme: 'Ports', items: [{ id: 'a', front: 'HTTPS', back: '443' }] }
  it('the boss prompt makes every question typed, choices only as an extra way to answer', () => {
    const { user, system } = buildQuizPrompt(subject, area, { kind: 'boss', title: 'Boss' }, { typedItems: area.items, count: 20 })
    const text = `${system}\n${user}`
    expect(text).not.toMatch(/a few multiple choice/i)
    expect(text).toMatch(/every question[^.]*"accepted"/i)
    expect(text).toMatch(/which of these/i) // named as forbidden
  })
  it('the raid prompt forbids questions that need their options', () => {
    const cards = [{ cardId: 1, front: 'HTTPS', back: '443' }]
    const { system, user } = buildRaidPrompt(subject, cards, {})
    expect(`${system}\n${user}`).toMatch(/which of these/i)
  })
})
