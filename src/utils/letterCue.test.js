import { describe, it, expect } from 'vitest'
import { hasLetterCue, letterSkeleton, appendLetterCue, needsLetterCue, blankedSubject } from './letterCue'
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
  it('skeleton from the shortest answer, never from a Han-first answer', () => {
    expect(letterSkeleton(q('x', ['sombrero', 'gorra']))).toBe('g····')
    expect(letterSkeleton(q('x', ['走る']))).toBe('')
    expect(letterSkeleton(q('x', ['走る', 'はしる']))).toBe('は··')
    expect(letterSkeleton(q('x', ['a']))).toBe('')
  })
  it('appendLetterCue keeps the trailing punctuation after the cue', () => {
    expect(appendLetterCue(q('What is a hat?', ['gorra'])).question).toBe('What is a hat (g····)?')
    const none = q('What?', ['走る'])
    expect(appendLetterCue(none)).toBe(none)
  })
  it('only typed language recall/fill_blank needs a cue', () => {
    expect(needsLetterCue(q('Hat?', ['gorra']), true, false)).toBe(true)
    expect(needsLetterCue(q('Hat?', ['gorra']), false, false)).toBe(false)
    expect(needsLetterCue(q('Hat?', ['gorra']), true, true)).toBe(false)
    expect(needsLetterCue(q('Hat?', ['gorra'], { type: 'explanation' }), true, false)).toBe(false)
  })
  it('blankedSubject spots a fully blanked quoted subject', () => {
    expect(blankedSubject(q("Translate: '___'", ['x']))).toBe(true)
    expect(blankedSubject(q('Translate: ___ (g····)', ['x']))).toBe(true)
    expect(blankedSubject(q('Fill in: el ___ es grande', ['x']))).toBe(false)
  })
  it('appending a cue always yields a detected cue, and never throws (property)', () => {
    const r = rng(5)
    const letters = ['a', 'b', 'é', 'ñ', 'й', 'ж', 'は', 'こ', ' ', "'", '/', '走']
    for (let i = 0; i < 1000; i++) {
      const ans = Array.from({ length: 1 + r.int(3) }, () => Array.from({ length: r.int(7) }, () => r.pick(letters)).join(''))
      const qq = q(Array.from({ length: r.int(12) }, () => r.pick([...letters, '?', '"', '«'])).join(''), ans)
      const out = appendLetterCue(qq)
      // Every appended skeleton is read back as a cue, a 2-letter one ("(x·)") too: else a recheck appended a second.
      if (out !== qq) { expect(hasLetterCue(out)).toBe(true); expect(needsLetterCue(out, true, false)).toBe(false) }
      expect(typeof blankedSubject(qq)).toBe('boolean')
    }
    expect(hasLetterCue({})).toBe(false)
  })
  it('a 2-letter answer gets one cue: its one-dot skeleton is recognized, so no second one is appended', () => {
    const once = appendLetterCue(q('Translate "eye"', ['ojo', 'yo']))
    expect(once.question).toBe('Translate "eye" (y·)')
    expect(hasLetterCue(once)).toBe(true)
    expect(needsLetterCue(once, true, false)).toBe(false)
    expect(appendLetterCue(q('Hi?', ['ok'])).question).toBe('Hi (o·)?')
    expect(hasLetterCue(q('Translate (y·)', ['yo']))).toBe(true)
    expect(hasLetterCue(q('Translate (y_)', ['yo']))).toBe(true)
  })
  it('a single dot outside brackets is ordinary text, never a cue', () => {
    // Catalan l·l and a middle dot between words must not count.
    expect(hasLetterCue(q('Tradueix: col·lecció', ['col·lecció', 'lata']))).toBe(false)
    expect(hasLetterCue(q('a· b', ['ab']))).toBe(false)
    // A bracketed one-dot skeleton naming the WRONG letter is not a cue.
    expect(hasLetterCue(q('Translate (z·)', ['yo']))).toBe(false)
  })
  it('1-letter answers get no skeleton (it would be the answer itself)', () => {
    const one = q('The letter?', ['y'])
    expect(letterSkeleton(one)).toBe('')
    expect(appendLetterCue(one)).toBe(one)
  })
  it('multi-word answers: the skeleton starts with the first word and is recognized', () => {
    const out = appendLetterCue(q('Hat?', ['el sombrero']))
    expect(out.question).toBe('Hat (e·········)?')
    expect(hasLetterCue(out)).toBe(true)
  })
})
