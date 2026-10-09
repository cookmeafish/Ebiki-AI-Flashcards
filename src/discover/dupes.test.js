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

describe('language-aware articles', () => {
  it('strips only the given language\'s articles', () => {
    expect(termKeys('as well', { lang: 'English' }).has('well')).toBe(false)
    expect(termKeys('die hard', { lang: 'eng' }).has('hard')).toBe(false)
    expect(termKeys('an apple', { lang: 'English' }).has('apple')).toBe(true)
    expect(termKeys('der Hund', { lang: 'German' }).has('hund')).toBe(true)
    expect(termKeys('el perro', { lang: 'Spanish' }).has('perro')).toBe(true)
    expect(termKeys('el perro', { lang: 'Español' }).has('perro')).toBe(true)
    expect(termKeys('the cloud', { lang: 'Spanish' }).has('cloud')).toBe(false)
    expect(termKeys('de hond', { lang: 'Dutch' }).has('hond')).toBe(true)
    expect(termKeys('de nada', { lang: 'Spanish' }).has('nada')).toBe(false)
    expect(termKeys("l'eau", { lang: 'French' }).has('eau')).toBe(true)
    expect(termKeys("l'eau", { lang: 'German' }).has('eau')).toBe(false)
    expect(termKeys('犬', { lang: 'Japanese' }).has('犬')).toBe(true)
  })
  it('keeps the old union for an unknown language', () => {
    expect(termKeys('as well').has('well')).toBe(true)
    expect(termKeys('der Hund', { lang: 'Klingon' }).has('hund')).toBe(true)
    expect(termKeys('a menudo', { lang: '' }).has('menudo')).toBe(false)
  })
  it('passes the language through termIndex and termIn', () => {
    const deck = termIndex(['as well', 'the dog'], new Set(), { lang: 'English' })
    expect(termIn('well', deck, { lang: 'English' })).toBe(false)
    expect(termIn('dog', deck, { lang: 'English' })).toBe(true)
  })
})
