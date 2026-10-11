import { describe, it, expect } from 'vitest'
import { hasLetterCue, letterSkeleton, appendLetterCue, needsLetterCue, blankedSubject, withLetterCount, hasCountSkeleton, stripLetterCues } from './letterCue'
import { rng } from './testRng'

const q = (question, acceptedAnswers, extra = {}) => ({ question, acceptedAnswers, type: 'recall', ...extra })

describe('first-letter cue', () => {
  it('detects a quoted letter that starts an accepted answer (any quote style)', () => {
    expect(hasLetterCue(q('Hat (starts with "s")', ['sombrero']))).toBe(true)
    expect(hasLetterCue(q('Hut (commence par «s»)', ['sombrero']))).toBe(true)
    expect(hasLetterCue(q('Hut („s“)', ['sombrero']))).toBe(true)
    expect(hasLetterCue(q('Hat (s·······)', ['sombrero']))).toBe(true)
  })
  it('a quoted letter that names another word is no cue; contractions are not quotes', () => {
    expect(hasLetterCue(q('Hat (starts with "g")', ['sombrero']))).toBe(false)
    expect(hasLetterCue(q("I'm at the park, what's 'hat'?", ['sombrero']))).toBe(false)
    expect(hasLetterCue(q('雨 means “rain”', ['あめ']))).toBe(false) // a quoted meaning is no cue
  })
  it('a kanji answer is cued by its reading', () => {
    expect(hasLetterCue(q('to run (「は」)', ['走る']))).toBe(true)
    expect(hasLetterCue(q('How do you say "I"?', ['私']))).toBe(false)
  })
  it('the prefix hint (no length) from the main answer, never from Han or kana', () => {
    expect(letterSkeleton(q('x', ['sombrero', 'gorra']))).toBe('so…')
    expect(letterSkeleton(q('x', ['走る']))).toBe('')
    expect(letterSkeleton(q('x', ['走る', 'はしる']))).toBe('')
    expect(letterSkeleton(q('x', ['a']))).toBe('')
    expect(hasLetterCue(q('Hat (so…)', ['sombrero']))).toBe(true)
  })
  it('appendLetterCue keeps the trailing punctuation after the hint', () => {
    expect(appendLetterCue(q('What is a hat?', ['gorra'])).question).toBe('What is a hat (g…)?')
    const none = q('What?', ['走る'])
    expect(appendLetterCue(none)).toBe(none)
  })
  it('only an answer the app cannot hint still needs a cue written by the model (Han, kana, one letter)', () => {
    expect(needsLetterCue(q('Hat?', ['gorra']), true, false)).toBe(false) // the app adds "(g…)" itself
    expect(needsLetterCue(q('Run?', ['走る']), true, false)).toBe(true)
    expect(needsLetterCue(q('Run (「は」)?', ['走る']), true, false)).toBe(false)
    expect(needsLetterCue(q('Run?', ['走る']), false, false)).toBe(false)
    expect(needsLetterCue(q('Run?', ['走る']), true, true)).toBe(false)
    expect(needsLetterCue(q('Run?', ['走る'], { type: 'explanation' }), true, false)).toBe(false)
  })
  it('blankedSubject spots a fully blanked quoted subject', () => {
    expect(blankedSubject(q("Translate: '___'", ['x']))).toBe(true)
    expect(blankedSubject(q('Translate: ___ (g····)', ['x']))).toBe(true)
    expect(blankedSubject(q('Fill in: el ___ es grande', ['x']))).toBe(false)
  })
  it('appending a hint always yields a detected cue, and never throws (property)', () => {
    const r = rng(5)
    const letters = ['a', 'b', 'é', 'ñ', 'й', 'ж', 'は', 'こ', ' ', "'", '/', '走']
    for (let i = 0; i < 1000; i++) {
      const ans = Array.from({ length: 1 + r.int(3) }, () => Array.from({ length: r.int(7) }, () => r.pick(letters)).join(''))
      const qq = q(Array.from({ length: r.int(12) }, () => r.pick([...letters, '?', '"', '«'])).join(''), ans)
      const out = appendLetterCue(qq)
      if (out !== qq) { expect(hasLetterCue(out)).toBe(true); expect(needsLetterCue(out, true, false)).toBe(false); expect(appendLetterCue(out)).toBe(out) }
      expect(out.question).not.toMatch(/·/)
      expect(typeof blankedSubject(qq)).toBe('boolean')
    }
    expect(hasLetterCue({})).toBe(false)
  })
  it('a 2-letter answer gets one letter; the legacy one-dot skeleton is replaced, never kept', () => {
    const once = appendLetterCue(q('Translate "eye"', ['ojo', 'yo']))
    expect(once.question).toBe('Translate "eye" (o…)')
    expect(appendLetterCue(once)).toBe(once)
    expect(appendLetterCue(q('Hi?', ['ok'])).question).toBe('Hi?') // two letters: no hint
    expect(appendLetterCue(q('Translate (y·)', ['yo'])).question).toBe('Translate') // the legacy skeleton goes, no hint for two letters
  })
  it('a single dot outside brackets is ordinary text, never a cue', () => {
    expect(hasLetterCue(q('Tradueix: col·lecció', ['col·lecció', 'lata']))).toBe(false)
    expect(hasLetterCue(q('a· b', ['ab']))).toBe(false)
    expect(hasLetterCue(q('Translate (z·)', ['yo']))).toBe(false)
  })
  it('multi-word answers: the first letter of each word', () => {
    const out = appendLetterCue(q('Hat?', ['el sombrero']))
    expect(out.question).toBe('Hat (… s…)?')
    expect(hasLetterCue(out)).toBe(true)
  })
})

describe('the question ladder prefix hint (it replaced the letter count)', () => {
  const q = (question, extra = {}) => ({ question, type: 'recall', acceptedAnswers: ['sombrero'], ...extra })
  it('replaces a quoted first letter and a legacy skeleton with the prefix', () => {
    const out = withLetterCount(q('How do you say "hat" (wide brim; starts with "s")?'), { isLanguage: true })
    expect(out.question).toBe('How do you say "hat" (wide brim) (so…)?')
    expect(hasCountSkeleton(out)).toBe(true)
    expect(withLetterCount(q('Lleva un ___ (s·······) al sol', { type: 'fill_blank' }), { isLanguage: true }).question).toBe('Lleva un ___ (so…) al sol')
  })
  it('puts it after a blank; never twice; not for open tiers, explanations or general modes', () => {
    expect(withLetterCount(q('Lleva un ___ al sol', { type: 'fill_blank' }), { isLanguage: true }).question).toBe('Lleva un ___ (so…) al sol')
    const once = withLetterCount(q('x'), { isLanguage: true })
    expect(withLetterCount(once, { isLanguage: true })).toBe(once)
    for (const [qq, o] of [[q('x'), { isLanguage: true, open: true }], [q('x', { type: 'explanation' }), { isLanguage: true }], [q('x'), { isLanguage: false }]]) expect(withLetterCount(qq, o)).toBe(qq)
  })
  it('the choices view drops every letter cue but keeps the sense', () => {
    expect(stripLetterCues('La gacela ___ (s·······) (escapar de un peligro; empieza con "h") rápido')).toBe('La gacela ___ (escapar de un peligro) rápido')
    expect(stripLetterCues('How do you say "hat" (starts with "s")?')).toBe('How do you say "hat"?')
    expect(stripLetterCues('Say "I" (y·)')).toBe('Say "I"')
    expect(stripLetterCues('Lleva un ___ (so…) al sol', ['sombrero'])).toBe('Lleva un ___ al sol')
    expect(stripLetterCues('傘は日本語で？（「か」で始まる）')).toBe('傘は日本語で？')
    expect(stripLetterCues('No cue here (a sense note)')).toBe('No cue here (a sense note)')
  })
  it('the choices view also drops a letter cue written as its own sentence (only for an answer initial)', () => {
    expect(stripLetterCues('How do you say "house"? It starts with "c".', ['casa'])).toBe('How do you say "house"?')
    expect(stripLetterCues('¿Cómo se dice "run away"? Empieza con "h". (h···)', ['huir'])).toBe('¿Cómo se dice "run away"?')
    expect(stripLetterCues('How do you say "house"? It starts with "c". Think of a home.', ['casa'])).toBe('How do you say "house"? Think of a home.')
    expect(stripLetterCues('Completa: "Voy ___ la playa." Pista: empieza con «a».', ['a'])).toBe('Completa: "Voy ___ la playa."')
    // Not a cue: the subject of the question, another letter, the only sentence, or no answers given.
    expect(stripLetterCues('Listen. How do you say "I"?', ['yo'])).toBe('Listen. How do you say "I"?')
    expect(stripLetterCues('How do you say "dog"? Starts with "x".', ['perro'])).toBe('How do you say "dog"? Starts with "x".')
    expect(stripLetterCues('It starts with "c".', ['casa'])).toBe('It starts with "c".')
    expect(stripLetterCues('How do you say "house"? It starts with "c".')).toBe('How do you say "house"? It starts with "c".')
  })
})

describe('noHint: options that could not keep to the hint mean no hint at all', () => {
  it('withLetterCount takes the hint out of a noHint question, and never asks a short phrase or a 1-letter answer for a letter', () => {
    const q = { type: 'recall', question: 'Lleva un ___ (so…).', acceptedAnswers: ['sombrero'], noHint: true }
    expect(withLetterCount(q, { isLanguage: true }).question).toBe('Lleva un ___.')
    expect(withLetterCount({ ...q, noHint: false }, { isLanguage: true }).question).toBe('Lleva un ___ (so…).')
    expect(needsLetterCue({ type: 'recall', question: '¿Cómo se dice "I don\'t know"?', acceptedAnswers: ['no sé'] }, true, false)).toBe(false)
    expect(needsLetterCue({ type: 'recall', question: 'How do you say "rain"?', acceptedAnswers: ['雨'] }, true, false)).toBe(true)
  })
})
