import { describe, it, expect } from 'vitest'
import { parseScenarios, cleanScenario, normalizeScorecard, axesFor, SCORE_AXES, MAX_SCENARIOS, MAX_CARDS } from './scoring'
import { splitSceneReply, buildSceneSystem, buildScorecardPrompt, buildScenarioPrompt } from './prompt'

const lang = { name: 'Spanish', isLanguage: true, learnLang: 'Spanish', userLang: 'English', rules: '' }
const gen = { name: 'CompTIA A+', isLanguage: false, learnLang: 'English', userLang: 'English', description: 'IT support' }

describe('roleplay scenarios', () => {
  it('keeps complete scenes, drops broken and duplicate ones, caps the list', () => {
    const raw = { scenarios: [
      { title: 'Café', setting: 'A busy café', role: 'barista', goal: 'Order' },
      { title: 'café', setting: 'dup', role: 'x' },
      { title: 'No role', setting: 'somewhere' },
      null,
      ...Array.from({ length: 10 }, (_, i) => ({ title: `S${i}`, setting: 's', role: 'r' })),
    ] }
    const list = parseScenarios(raw)
    expect(list[0]).toMatchObject({ title: 'Café', emoji: '🎭', role: 'barista' })
    expect(list.filter((s) => s.title.toLowerCase() === 'café')).toHaveLength(1)
    expect(list.some((s) => s.title === 'No role')).toBe(false)
    expect(list).toHaveLength(MAX_SCENARIOS)
  })
  it('accepts a bare array and gives an untitled scene a title', () => {
    expect(parseScenarios([{ setting: 'A help desk call', role: 'user' }])[0].title).toBe('A help desk call')
    expect(cleanScenario('nope')).toBe(null)
  })
})

describe('roleplay scorecard', () => {
  it('judges language on the language and everything else on the thinking', () => {
    expect(axesFor(lang)).toEqual(SCORE_AXES.language)
    expect(axesFor(gen)).toEqual(SCORE_AXES.general)
  })
  it('clamps scores, drops unknown axes, averages a missing overall', () => {
    const sc = normalizeScorecard({ scores: { accuracy: 9, complexity: 2, vocabulary: '3', bogus: 5 }, tips: ['a', '', 'b'] }, SCORE_AXES.language)
    expect(sc.scores).toEqual({ accuracy: 5, complexity: 2, vocabulary: 3 })
    expect(sc.overall).toBe(3)
    expect(sc.tips).toEqual(['a', 'b'])
    expect(sc.goalMet).toBe(false)
  })
  it('keeps only complete cards, capped', () => {
    const cards = [{ front: 'a', back: 'b' }, { front: 'x' }, ...Array.from({ length: 9 }, (_, i) => ({ front: `f${i}`, back: 'b' }))]
    expect(normalizeScorecard({ overall: 4, cards }, SCORE_AXES.general).cards).toHaveLength(MAX_CARDS)
  })
  it('refuses a reply with nothing judged', () => {
    expect(normalizeScorecard({ summary: 'hi' }, SCORE_AXES.general)).toBe(null)
    expect(normalizeScorecard(null, SCORE_AXES.general)).toBe(null)
  })
})

describe('roleplay prompts', () => {
  it('spots and strips the end-of-scene tag', () => {
    expect(splitSceneReply('Adiós! <scene-end/>')).toEqual({ text: 'Adiós!', ended: true })
    expect(splitSceneReply('Hola')).toEqual({ text: 'Hola', ended: false })
    expect(splitSceneReply('Ebi: ¿Qué desea?').text).toBe('¿Qué desea?')
  })
  it('never turns a general subject into a language lesson', () => {
    const scene = { setting: 'A help desk', role: 'an angry user', goal: 'fix the printer' }
    expect(buildSceneSystem(gen, scene)).toMatch(/apply CompTIA A\+/)
    expect(buildSceneSystem(gen, scene)).not.toMatch(/Speak only/)
    expect(buildSceneSystem(lang, scene)).toMatch(/Speak only Spanish/)
    expect(buildScenarioPrompt(gen).user).toMatch(/Never a language lesson/)
    expect(buildScorecardPrompt(gen, scene, [], SCORE_AXES.general).user).toMatch(/reasoning/)
  })
})
