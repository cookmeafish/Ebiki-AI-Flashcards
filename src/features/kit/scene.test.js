import { describe, it, expect } from 'vitest'
import { parseScene, buildScenePrompt, voiceFor, SCENE_LINES } from './scene'

const gen = { name: 'Music theory', isLanguage: false, userLang: 'English', learnLang: 'English' }
const lang = { name: 'Spanish', isLanguage: true, userLang: 'English', learnLang: 'Spanish', rules: '' }

describe('scenes', () => {
  it('parses lines, defaults unknown speakers to the narrator, drops empty lines', () => {
    const s = parseScene({
      title: 'At the market', cast: { A: 'Ana' },
      lines: [{ speaker: 'a', text: 'Hola' }, { speaker: 'Z', text: 'Era lunes.' }, { speaker: 'B', text: '' }, { speaker: 'B', text: '¿Qué tal?', gloss: 'How are you?' }],
      questions: [{ question: 'Who greets first?', choices: ['Ana', 'B'], answer: 0 }],
    })
    expect(s.lines.map((l) => l.speaker)).toEqual(['A', 'N', 'B'])
    expect(s.cast).toEqual({ A: 'Ana', B: 'B' })
    expect(s.questions).toHaveLength(1)
  })
  it('refuses a scene too short to tell, and caps a long one', () => {
    expect(parseScene({ lines: [{ text: 'one' }] })).toBe(null)
    expect(parseScene({ lines: Array.from({ length: 40 }, () => ({ text: 'x' })) }).lines).toHaveLength(SCENE_LINES.max)
  })
  it('never lets a list or object stand in for text (no "[object Object]", no crash in the cleaner)', () => {
    const clean = (x) => x.replace(/!/g, '')
    const s = parseScene({ title: ['Bad'], cast: { A: { name: 'Ana' }, B: 'Luis' },
      lines: [{ speaker: 'A', text: 'Hola!' }, { speaker: 'B', text: { t: 'x' } }, { speaker: 'B', text: 'Adiós', gloss: ['bye'] }, { speaker: 'N', text: 3 }],
      questions: [{ question: { q: 'x' }, choices: ['a', 'b'], answer: 0 }, null, { question: 'Who left?', choices: ['Ana', 'Luis'], answer: 1 }] }, clean)
    expect(s.title).toBe('')
    expect(s.cast).toEqual({ A: 'A', B: 'Luis' })
    expect(s.lines.map((l) => l.text)).toEqual(['Hola', 'Adiós', '3'])
    expect(s.lines[1].gloss).toBe('')
    expect(s.questions.map((q) => q.prompt)).toEqual(['Who left?'])
  })
  it('gives the two characters different voices', () => {
    expect(voiceFor('A')).not.toBe(voiceFor('B'))
  })
  it('makes a case study for a general subject, never a language lesson', () => {
    expect(buildScenePrompt(gen, []).user).toMatch(/case study/)
    expect(buildScenePrompt(gen, []).user).toMatch(/Never a language lesson/)
    expect(buildScenePrompt(lang, [{ front: 'perro', back: 'dog' }]).user).toMatch(/story in Spanish/)
  })
})
