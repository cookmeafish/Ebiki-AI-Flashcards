import { describe, expect, it } from 'vitest'
import { termFold, termIn, termIndex, termKeys } from './dupes'

const keys = (t) => [...termKeys(t)].sort()

describe('termKeys', () => {
  it('folds case, Unicode form, spaces and edge punctuation, keeping accents', () => {
    expect(keys('  Perro ')).toEqual(['perro'])
    expect(termFold('buenos   días')).toBe('buenos días')
    expect(keys('¡Hola!')).toEqual(['hola'])
    expect(keys('¿Qué tal?')).toEqual(['qué tal'])
    expect(termFold('café')).toBe(termFold('café'))
    expect(keys('papá')).not.toEqual(keys('papa'))
  })
  it('drops a trailing part of speech and an audio embed', () => {
    expect(keys('perro (sustantivo masculino)')).toEqual(['perro'])
    expect(keys('perro [sound:ebiki-perro.mp3]')).toEqual(['perro'])
  })
  it('expands slash fronts like answers do', () => {
    expect(termKeys('niño/a').has('niña')).toBe(true)
    expect(termKeys('niño/a').has('a')).toBe(false)
    expect(termKeys('el/la estudiante').has('estudiante')).toBe(true)
    expect(termKeys('el/la estudiante').has('el')).toBe(false)
    expect(termKeys('perro/gato').has('gato')).toBe(true)
  })
  it('makes a leading article optional', () => {
    expect(termKeys('el perro').has('perro')).toBe(true)
    expect(termKeys('der Hund').has('hund')).toBe(true)
    expect(termKeys("l'eau").has('eau')).toBe(true)
    expect(termKeys('The cloud').has('cloud')).toBe(true)
  })
  it('never treats a preposition or a lone article as one', () => {
    expect(termKeys('a menudo').has('menudo')).toBe(false)
    expect(termKeys('de nada').has('nada')).toBe(false)
    expect(keys('la')).toEqual(['la'])
  })
  it('is empty for nothing', () => {
    expect(termKeys('').size).toBe(0)
    expect(termKeys(null).size).toBe(0)
    expect(termKeys('¡!').size).toBe(0)
  })
})

describe('termIn / termIndex', () => {
  it('finds a suggestion among deck fronts and ledger entries', () => {
    const deck = termIndex(['el perro (sustantivo)', 'niño/a', '<b>x</b>'])
    expect(termIn('perro', deck)).toBe(true)
    expect(termIn('Niña', deck)).toBe(true)
    expect(termIn('la perra', deck)).toBe(false)
    const ledger = termIndex([{ term: 'la casa' }, { term: null }, null, 'gato'])
    expect(termIn('casa', ledger)).toBe(true)
    expect(termIn('el gato', ledger)).toBe(true)
    expect(termIn('perro', ledger)).toBe(false)
  })
  it('keeps accents apart', () => {
    expect(termIn('te', termIndex(['té']))).toBe(false)
    expect(termIn('papá', termIndex(['papa']))).toBe(false)
  })
  it('tolerates a missing index or list', () => {
    expect(termIn('x', null)).toBe(false)
    expect(termIndex(undefined).size).toBe(0)
  })
})
