import { describe, it, expect } from 'vitest'
import { withPoolChoices, withPoolChoicesAll } from './fightChoices'
import { ensurePrefixHint } from './fightSettings'

const t = (k, v) => (k === 'qt_meaningPick' ? `What does "${v.w}" mean?` : k)
const typed = (accepted, alt) => ({ kind: 'typed', prompt: 'Trousers? (pa…)', accepted, open: false, ...(alt ? { alt } : {}) })
const pool = [
  { front: 'paraguas', back: 'umbrella' }, { front: 'pasaporte', back: 'passport' }, { front: 'pañuelo', back: 'handkerchief' },
  { front: 'zapato', back: 'shoe' }, { front: 'camisa', back: 'shirt' }, { front: 'pantalones', back: 'trousers' },
]
const fixed = () => 0.5

describe('fight choices from the deck', () => {
  it('replaces the model\'s options with studied cards sharing the hint', () => {
    const q = typed(['pantalones'], { choices: ['pantalones', 'falda', 'gorro', 'abrigo'], answerIdx: 0 })
    const out = withPoolChoices(q, { card: { front: 'pantalones', back: 'trousers' }, pool, isLanguage: true, t, rnd: fixed })
    expect(out.alt.from).toBe('word')
    expect(out.alt.choices[out.alt.answerIdx]).toBe('pantalones')
    expect([...out.alt.choices].sort()).toEqual(['pantalones', 'pañuelo', 'paraguas', 'pasaporte'].sort())
  })
  it('never the meaning form in a fight (the typed question the learner read named the meaning): the model\'s options fill up', () => {
    const q = typed(['sombrero'], { choices: ['sombrero', 'sonido', 'soleado', 'soporte'], answerIdx: 0 })
    const out = withPoolChoices(q, { card: { front: 'sombrero', back: 'hat\nUn sombrero grande.' }, pool, isLanguage: true, t, rnd: fixed })
    expect(out.alt.meaning).toBeUndefined()
    expect(out.alt.choices[out.alt.answerIdx]).toBe('sombrero')
    expect([...out.alt.choices].sort()).toEqual(['sombrero', 'sonido', 'soleado', 'soporte'].sort())
  })
  it('keeps the model\'s options when nothing fits, and then shows NO hint (the answer would be the only "so…"); leaves open and choice questions alone', () => {
    const q = { ...typed(['sombrero'], { choices: ['sombrero', 'gorra', 'casco', 'boina'], answerIdx: 0 }), prompt: 'Lleva un ___ (so…).' }
    const out = withPoolChoices(q, { card: { front: 'sombrero', back: 'hat' }, pool: [], isLanguage: true, t })
    expect([...out.alt.choices].sort()).toEqual(['boina', 'casco', 'gorra', 'sombrero']) // the model's options, planned for a question without a hint
    expect(out.noHint).toBe(true)
    expect(out.prompt).toBe('Lleva un ___.')
    expect(ensurePrefixHint(out, { isLanguage: true }).prompt).toBe('Lleva un ___.')
    expect(ensurePrefixHint(q, { isLanguage: true }).prompt).toBe('Lleva un ___ (so…).')
    const open = { ...q, open: true }
    expect(withPoolChoices(open, { card: { front: 'x', back: 'y' }, pool, isLanguage: true, t })).toBe(open)
    const choice = { kind: 'choice', prompt: 'x', choices: ['a', 'b'], answerIdx: 0 }
    expect(withPoolChoices(choice, { card: { front: 'x', back: 'y' }, pool, isLanguage: true, t })).toBe(choice)
    expect(withPoolChoices(q, { card: null, pool, isLanguage: true, t })).toBe(q)
  })
  it('a reversed card (the learned word on the back) reads its pool the same way', () => {
    const rev = pool.map(({ front, back }) => ({ front: back, back: front }))
    const q = typed(['pantalones'])
    const out = withPoolChoices(q, { card: { front: 'trousers', back: 'pantalones' }, pool: rev, isLanguage: true, t, rnd: fixed })
    expect(out.alt.from).toBe('word')
    expect(out.alt.choices).toContain('paraguas')
  })
  it('a whole run, each question with its own card', () => {
    const qs = [{ ...typed(['pantalones']), _cardId: 6 }]
    const out = withPoolChoicesAll(qs, { cardOf: () => pool[5], pool, isLanguage: true, t, rnd: fixed })
    expect(out[0].alt.from).toBe('word')
  })
})

describe('fight choices: no hint the options give away, the guard, choice-only questions', () => {
  it('without options sharing the hint, deck words of the kind (no prefix needed) and NO hint', () => {
    const q = { ...typed(['sombrero'], { choices: ['sombrero', 'gorra', 'casco', 'boina'], answerIdx: 0 }), prompt: 'Lleva un ___ (so…).' }
    const out = withPoolChoices(q, { card: { front: 'sombrero', back: 'hat' }, pool, isLanguage: true, t, rnd: fixed })
    expect(out.noHint).toBe(true)
    expect(out.prompt).toBe('Lleva un ___.')
    expect(out.alt.from).toBe('word')
    expect(out.alt.choices).toContain('sombrero')
  })
  it('never a pool card that means the same as the answer', () => {
    const p = [{ front: 'buen día', back: 'good day' }, { front: 'bien dicho', back: 'well said' }, { front: 'bajo dos', back: 'under two' }, { front: 'bello día', back: 'nice day' }]
    const q = typed(['buenos días'], { choices: ['buenos días', 'gorra', 'casa', 'mesa'], answerIdx: 0 })
    const out = withPoolChoices(q, { card: { front: 'buenos días', back: 'good morning' }, pool: p, isLanguage: true, t, rnd: fixed })
    expect(out.alt.choices).not.toContain('buen día')
    expect(out.noHint).toBeUndefined()
  })
  it('a choice-only question whose answer is the item\'s word gets studied distractors', () => {
    const q = { kind: 'choice', prompt: 'Which word means "trousers"?', choices: ['pantalones', 'falda', 'gorro', 'abrigo'], answerIdx: 0 }
    const out = withPoolChoices(q, { card: { front: 'pantalones', back: 'trousers' }, pool, isLanguage: true, t, rnd: fixed })
    expect(out.choices[out.answerIdx]).toBe('pantalones')
    expect(out.choices.filter((c) => c !== 'pantalones').every((c) => ['paraguas', 'pasaporte', 'pañuelo', 'zapato', 'camisa'].includes(c))).toBe(true)
  })
})
