import { describe, it, expect } from 'vitest'
import { withoutSubjectPronoun, shapeConjugationPool, fallbackConjugationPool } from './conjugation.js'
import { exactAnswerMatch, answerNormalize } from './answers.js'

// The conjugation matcher as submitStudyAnswer calls it.
const conjMatch = (expected, typed) => {
  const ans = answerNormalize(typed)
  return exactAnswerMatch(expected, { ans, ansNoArt: ans, isConjugation: true })
}

describe('withoutSubjectPronoun', () => {
  it('drops a leading subject pronoun', () => {
    expect(withoutSubjectPronoun('yo hablo')).toBe('hablo')
    expect(withoutSubjectPronoun('nosotros hablamos')).toBe('hablamos')
    expect(withoutSubjectPronoun('Ich gehe')).toBe('gehe')
    expect(withoutSubjectPronoun("j'aime")).toBe('aime')
    expect(withoutSubjectPronoun('j’habite')).toBe('habite')
    expect(withoutSubjectPronoun('nous parlons')).toBe('parlons')
  })
  it('keeps object and reflexive pronouns, and single words', () => {
    expect(withoutSubjectPronoun('lo hablo')).toBeNull()
    expect(withoutSubjectPronoun('me levanto')).toBeNull()
    expect(withoutSubjectPronoun('hablo')).toBeNull()
    expect(withoutSubjectPronoun('es necesario')).toBeNull()
    expect(withoutSubjectPronoun('')).toBeNull()
    expect(withoutSubjectPronoun(null)).toBeNull()
  })
})

describe('conjugation matching stays exact', () => {
  it('accepts the bare form when the expected answer carries a subject pronoun', () => {
    expect(conjMatch('yo hablo', 'hablo')).toBe(true)
    expect(conjMatch("j'aime", 'aime')).toBe(true)
    expect(conjMatch('yo hablo', 'yo hablo')).toBe(true)
    expect(conjMatch('hablo', 'yo hablo')).toBe(true)
  })
  it('an accent is still the tense or person', () => {
    expect(conjMatch('yo hablé', 'hable')).toBe(false)
    expect(conjMatch('hablé', 'hable')).toBe(false)
    expect(conjMatch('él habló', 'hablo')).toBe(false)
    expect(conjMatch('él habló', 'habló')).toBe(true)
  })
  it('object pronouns stay part of the drilled form', () => {
    expect(conjMatch('lo hablo', 'hablo')).toBe(false)
    expect(conjMatch('me levanto', 'levanto')).toBe(false)
  })
})

describe('shapeConjugationPool', () => {
  const fronts = ['hablar (to speak)', 'comer/comida', 'el perro (sustantivo)']
  it('marks a deck verb fromDeck even when the model says "false"', () => {
    const words = shapeConjugationPool({ words: [{ word: 'hablar', meaning: 'to speak', fromDeck: 'false' }, { word: 'vivir', meaning: 'to live', fromDeck: false }] }, fronts)
    expect(words.find((w) => w.word === 'hablar').fromDeck).toBe(true)
    expect(words.find((w) => w.word === 'vivir').fromDeck).toBe(false)
  })
  it('reads "false" as false for words not in the deck', () => {
    const [w] = shapeConjugationPool({ words: [{ word: 'salir', fromDeck: 'false' }] }, fronts)
    expect(w.fromDeck).toBe(false)
  })
  it('keeps one entry per folded verb, preferring the deck copy', () => {
    const words = shapeConjugationPool({ words: [{ word: 'Comer', fromDeck: false }, { word: 'comer', fromDeck: true, meaning: 'to eat' }] }, [])
    expect(words).toHaveLength(1)
    expect(words[0].fromDeck).toBe(true)
  })
  it('drops junk and survives odd input', () => {
    expect(shapeConjugationPool(null)).toEqual([])
    expect(shapeConjugationPool({ words: [null, 3, { word: '' }, { word: 5 }, { word: '  ' }] })).toEqual([])
    const [w] = shapeConjugationPool({ words: [{ word: ' ir ', meaning: { en: 'to go' } }] }, null, { cardText: (v) => JSON.stringify(v) })
    expect(w.word).toBe('ir')
  })
})

describe('fallbackConjugationPool', () => {
  it('takes headwords once each, up to the cap', () => {
    const pool = fallbackConjugationPool(['cálido/cálida', 'el perro (sustantivo)', 'cálido/cálida', '', null], 20)
    expect(pool.map((w) => w.word)).toEqual(['cálido', 'el perro'])
    expect(pool.every((w) => w.fromDeck)).toBe(true)
    expect(fallbackConjugationPool(Array.from({ length: 30 }, (_, i) => `w${i}`), 5)).toHaveLength(5)
  })
})
