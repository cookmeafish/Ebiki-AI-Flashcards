import { describe, it, expect } from 'vitest'
import { sharedStem, formMistake, mistakeKindLine } from './mistakeKind'

describe('a wrong FORM of the right word is seen by code, before a note or taunt is written', () => {
  it('two forms of one word share a stem', () => {
    expect(sharedStem('corro', 'corre')).toBe('corr')
    expect(sharedStem('Hablé', 'hable')).toBe('') // the same letters once accents are folded: an accent slip, not a form
    expect(sharedStem('parlano', 'parla')).toBe('parla')
    expect(sharedStem('gatos', 'gato')).toBe('gato')
  })
  it('different words do not', () => {
    expect(sharedStem('gato', 'perro')).toBe('')
    expect(sharedStem('casa', 'cama')).toBe('') // two shared letters are not a stem
    expect(sharedStem('sol', 'sal')).toBe('')
    expect(sharedStem('correspondencia', 'corre')).toBe('') // far apart in length
    expect(sharedStem('buenos días', 'buenas')).toBe('') // a phrase is never judged
    expect(sharedStem('', 'x')).toBe('')
  })
  it('formMistake finds the accepted answer it is a form of', () => {
    expect(formMistake('corro', ['anda', 'corre'])).toEqual({ expected: 'corre', stem: 'corr' })
    expect(formMistake('salta', ['corre'])).toBeNull()
  })
  it('the prompt line: language modes only, names both words and the stem, forbids the other-word reading', () => {
    const line = mistakeKindLine('corro', ['corre'], { isLanguage: true })
    expect(line).toMatch(/"corro"/)
    expect(line).toMatch(/"corre"/)
    expect(line).toMatch(/WRONG FORM/)
    expect(mistakeKindLine('corro', ['corre'], { isLanguage: false })).toBe('')
    expect(mistakeKindLine('salta', ['corre'], { isLanguage: true })).toBe('')
  })
})
