import { describe, it, expect } from 'vitest'
import { isSlashEnding, expandSlashAnswers, answerNormalize, stripLeadArticles, stripAccArticlesFor, stripAccentsKeepYot, exactAnswerMatch } from './answers'
import { rng } from './testRng'

const forms = (a) => expandSlashAnswers([a])

describe('expandSlashAnswers', () => {
  it('expands gender endings', () => {
    expect(forms('niño/a')).toEqual(['niño/a', 'niño', 'niña'])
    expect(forms('tío/a')).toContain('tía')
    expect(forms('bonito/-a')).toContain('bonita')
    expect(forms('nosotros/as')).toContain('nosotras')
  })
  it('expands mío/a/os/as to all four forms and never a bare ending', () => {
    const f = forms('mío/a/os/as')
    for (const w of ['mío', 'mía', 'míos', 'mías']) expect(f).toContain(w)
    for (const bare of ['a', 'os', 'as']) expect(f).not.toContain(bare)
  })
  it('spells z to ces plurals', () => {
    expect(forms('lápiz/ces')).toContain('lápices')
    expect(forms('luz/ces')).toContain('luces')
    expect(forms('lápiz/ces')).not.toContain('ces')
  })
  it('keeps two pronouns and two words apart', () => {
    expect(forms('nos/os')).toEqual(['nos/os', 'nos', 'os'])
    expect(forms('tus/os')).toContain('tus')
    expect(forms('esta/esa')).toEqual(['esta/esa', 'esta', 'esa'])
  })
  it('keeps an accented final vowel (fatigué/e = fatiguée) and drops a moved accent (alemán/a = alemana)', () => {
    expect(forms('fatigué/e')).toContain('fatiguée')
    expect(forms('alemán/a')).toContain('alemana')
    expect(forms('inglés/esa')).toContain('inglesa')
  })
  it('handles articles: el/la phrase, and an unslashed article fixing the gender', () => {
    expect(forms('el/la estudiante')).toEqual(expect.arrayContaining(['el estudiante', 'la estudiante']))
    expect(forms('el/la estudiante')).not.toContain('el')
    const medico = forms('el médico/a')
    expect(medico).toContain('el médico')
    expect(medico).not.toContain('el médica')
    expect(forms('hace frío/sol')).toEqual(expect.arrayContaining(['hace frío', 'hace sol']))
  })
  it('never splits a fraction or a unit', () => {
    expect(forms('1/2 taza')).toEqual(['1/2 taza'])
    expect(forms('km/h')).toEqual(['km/h'])
  })
  it('spelled endings need their base shape', () => {
    expect(forms('heureux/se')).toContain('heureuse')
    expect(forms('acteur/rice')).toContain('actrice')
    expect(isSlashEnding('se', 'casa')).toBe(false)
    expect(isSlashEnding('la', 'casa')).toBe(false)
  })
  it('never throws and is idempotent on junk (property)', () => {
    const r = rng(7)
    const atoms = ['a', 'o', 'os', 'as', '/', ' ', 'niño', 'el', 'la', 'ces', 'z', '-a', '1', '½', 'й', '日本', '', '́']
    for (let i = 0; i < 1500; i++) {
      const s = Array.from({ length: r.int(8) }, () => r.pick(atoms)).join('')
      const once = expandSlashAnswers([s, null, 3])
      expect(Array.isArray(once)).toBe(true)
      expect(new Set(once).size).toBe(once.length) // no duplicates
      // Expanding the output again adds nothing new for answers without slashes (entries are trimmed).
      const plain = [...new Set(once.filter((x) => !x.includes('/')).map((x) => x.trim()).filter(Boolean))]
      expect(expandSlashAnswers(plain)).toEqual(plain)
    }
    expect(expandSlashAnswers(undefined)).toEqual([])
  })
  it('a stray slash (empty piece) adds no half-form: no leading or trailing space, no bare word', () => {
    expect(expandSlashAnswers(['/asos 1ces'])).toEqual(['/asos 1ces'])
    expect(expandSlashAnswers(['el o/'])).toEqual(['el o/'])
    expect(expandSlashAnswers(['niñoa el/'])).toEqual(['niñoa el/'])
    // Real slashes keep working beside it.
    expect(expandSlashAnswers(['el/la estudiante'])).toEqual(['el/la estudiante', 'el estudiante', 'la estudiante'])
    expect(expandSlashAnswers(['hace frío/sol'])).toEqual(['hace frío/sol', 'hace frío', 'hace sol'])
  })
  it('every output is trimmed and non-empty, and re-expanding plain outputs adds nothing (property)', () => {
    const atoms = ['a', 'o', 'os', 'as', '/', ' ', 'niño', 'el', 'la', 'ces', 'z', '-a', '1', '½', 'й', '日本', '', '́']
    for (const seed of [7, 11, 13]) {
      const r = rng(seed)
      for (let i = 0; i < 3000; i++) {
        const s = Array.from({ length: r.int(8) }, () => r.pick(atoms)).join('')
        const once = expandSlashAnswers([s])
        for (const o of once) { expect(o).toBe(o.trim()); expect(o.length).toBeGreaterThan(0) }
        const plain = [...new Set(once.filter((x) => !x.includes('/')))]
        expect(expandSlashAnswers(plain)).toEqual(plain)
      }
    }
  })
})

describe('typed-answer matcher pieces', () => {
  it('answerNormalize keeps accents, folds ё, NFC-composes and strips punctuation', () => {
    expect(answerNormalize('¡Él!')).toBe('él')
    expect(answerNormalize('ещё')).toBe('еще')
    expect(answerNormalize('café')).toBe('café')
    expect(answerNormalize("l'eau")).toBe('eau')
    expect(answerNormalize("all'una")).toBe('alluna') // all' is a preposition the blank tests: never stripped
  })
  it('stripAccentsKeepYot drops accents but keeps й', () => {
    expect(stripAccentsKeepYot('brújula')).toBe('brujula')
    expect(stripAccentsKeepYot('мой')).toBe('мой')
    expect(stripAccentsKeepYot('Йод')).toBe('Йод')
  })
  it('Spanish keeps phrase-initial a/lo/al; other languages strip the full list', () => {
    expect(stripAccArticlesFor('a menudo', true)).toBe('a menudo')
    expect(stripAccArticlesFor('el gato', true)).toBe('gato')
    expect(stripAccArticlesFor('to run', false)).toBe('run')
    expect(stripLeadArticles('lo siento')).toBe('siento')
  })
  const typed = (s, spanish = true) => { const ans = answerNormalize(s); return { ans, ansNoArt: stripLeadArticles(ans), spanishTarget: spanish } }
  it('exact match is accent-sensitive and finds a whole token', () => {
    expect(exactAnswerMatch('él', typed('el'))).toBe(false)
    expect(exactAnswerMatch('él', typed('Él'))).toBe(true)
    expect(exactAnswerMatch('lo siento', typed('Lo siento mucho'))).toBe(true)
    expect(exactAnswerMatch('gato', typed('el gato'))).toBe(true)
  })
  it('conjugation drills match the form as written', () => {
    expect(exactAnswerMatch('lo hablo', { ...typed('hablo'), isConjugation: true })).toBe(false)
    expect(exactAnswerMatch('hablé', { ...typed('hable'), isConjugation: true })).toBe(false)
    expect(exactAnswerMatch('hablé', { ...typed('hablé'), isConjugation: true })).toBe(true)
  })
  it('never throws on junk (property)', () => {
    const r = rng(11)
    const chars = ['a', 'é', '(', '[', '\\', '*', '?', ' ', 'й', '日', "'", '’', '.', '$']
    for (let i = 0; i < 1000; i++) {
      const a = Array.from({ length: r.int(10) }, () => r.pick(chars)).join('')
      const b = Array.from({ length: r.int(10) }, () => r.pick(chars)).join('')
      expect(typeof exactAnswerMatch(a, { ...typed(b, r.bool()), isConjugation: r.bool() })).toBe('boolean')
      expect(answerNormalize(answerNormalize(a))).toBe(answerNormalize(a)) // idempotent
      expect(stripAccentsKeepYot(stripAccentsKeepYot(a))).toBe(stripAccentsKeepYot(a))
    }
  })
})
