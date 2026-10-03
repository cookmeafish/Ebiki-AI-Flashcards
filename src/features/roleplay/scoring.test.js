import { describe, it, expect } from 'vitest'
import { parseScenarios, cleanScenario, normalizeScorecard, axesFor, scoreAsPractice, mistakesAsMisses, SCORE_AXES, MAX_SCENARIOS, MAX_CARDS, MAX_TIPS } from './scoring'
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
  it('keeps real mistakes (said, better), drops echoes and halves, caps them', () => {
    const mistakes = [{ said: 'yo soy hambre', better: 'tengo hambre', why: 'hunger is had' }, { said: 'Hola', better: 'hola' }, { said: 'x' }, 'junk',
      ...Array.from({ length: 9 }, (_, i) => ({ said: `s${i}`, better: `b${i}` }))]
    const sc = normalizeScorecard({ overall: 3, mistakes }, SCORE_AXES.language)
    expect(sc.mistakes[0]).toEqual({ said: 'yo soy hambre', better: 'tengo hambre', why: 'hunger is had' })
    expect(sc.mistakes.some((m) => m.said === 'Hola')).toBe(false)
    expect(sc.mistakes).toHaveLength(MAX_TIPS)
    expect(normalizeScorecard({ overall: 3 }, SCORE_AXES.general).mistakes).toEqual([])
  })
  it('turns mistakes into Mistake Gym misses (front = the version to learn)', () => {
    expect(mistakesAsMisses([{ said: 'a', better: 'b', why: 'c' }, { said: 'x' }], 'Q')).toEqual([{ front: 'b', back: 'c', question: 'Q', answer: 'a', expected: 'b', feedback: 'c' }])
    expect(mistakesAsMisses(undefined, 'Q')).toEqual([])
  })
  it('reads the 1 to 5 scale as practice evidence with 1 = nothing right', () => {
    expect(scoreAsPractice(1)).toEqual({ total: 4, correct: 0 })
    expect(scoreAsPractice(5)).toEqual({ total: 4, correct: 4 })
    expect(scoreAsPractice(3)).toEqual({ total: 4, correct: 2 })
    expect(scoreAsPractice(undefined)).toEqual({ total: 4, correct: 0 })
  })
  it('drops lists and objects where text belongs', () => {
    const sc = normalizeScorecard({ overall: 3, summary: { a: 1 }, tips: [{ x: 1 }, 'ok'], cards: [{ front: ['a'], back: 'b' }, { front: 'c', back: { d: 1 } }, { front: 'e', back: 'f' }] }, SCORE_AXES.general)
    expect(sc.summary).toBe('')
    expect(sc.tips).toEqual(['ok'])
    expect(sc.cards).toEqual([{ front: 'e', back: 'f' }])
    expect(cleanScenario({ title: ['x'], setting: 'A shop', role: { r: 1 } })).toBe(null)
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
    expect(splitSceneReply('¿Qué desea?\nLearner: Un café, por favor.\nEbi: ¡Claro!')).toEqual({ text: '¿Qué desea?', ended: false })
    expect(splitSceneReply('Bien.\n**User:** ok <scene-end/>')).toEqual({ text: 'Bien.', ended: true })
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
