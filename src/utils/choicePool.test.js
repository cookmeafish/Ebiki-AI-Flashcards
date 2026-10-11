import { describe, it, expect } from 'vitest'
import { planChoices, rankDistractors, rankMeanings, poolEntry, posOf, cardWord, cardMeaning, closeForm, sharesPrefix, shuffleChoices, wordOnBack, distractorRule, MIN_DISTRACTORS, meaningsOverlap, sameLemma, poolEntries, scriptOf } from './choicePool'

const deck = (rows) => rows.map(([front, back, studied = true]) => poolEntry({ front, back, studied }))

describe('pool entries', () => {
  it('reads the word, its meaning and its part of speech from a card', () => {
    expect(poolEntry({ front: 'perro (n.)', back: 'dog\nEl perro ladra.' })).toEqual({ word: 'perro', meaning: 'dog', pos: 'noun', studied: true })
    expect(poolEntry({ front: 'correr', back: 'Meaning: to run\nVerb' }).pos).toBe('verb')
    expect(poolEntry({ front: 'rápido', back: 'Tipo: adjetivo\nfast' }).pos).toBe('adj')
    expect(poolEntry({ front: 'casa', back: 'house, home (a place to live)' }).pos).toBe('')
    expect(poolEntry({ front: '', back: 'x' })).toBe(null)
    expect(poolEntry({ front: 'dog', back: 'perro', swap: true }).word).toBe('perro')
  })
  it('a single letter inside a meaning is never a part-of-speech tag', () => {
    expect(posOf('vez', 'time (as in "one time"), v for victory')).toBe('')
  })
  it('cardWord / cardMeaning clean the edges and labels', () => {
    expect(cardWord('¡Hola! (interj)')).toBe('Hola')
    expect(cardMeaning('**Significado:** perro grande\nEjemplo')).toBe('perro grande')
  })
  it('wordOnBack reads a reversed card from its answer', () => {
    expect(wordOnBack({ front: 'dog', back: 'perro\nel perro ladra' }, ['perro'])).toBe(true)
    expect(wordOnBack({ front: 'perro', back: 'dog' }, ['perro'])).toBe(false)
  })
})

describe('distractors that neither the prefix hint nor "it\'s in my deck" can give away', () => {
  const pool = deck([
    ['pantalones', 'trousers'], ['pañuelo', 'handkerchief'], ['paraguas', 'umbrella'], ['pasaporte', 'passport'],
    ['pantalón', 'trousers'], ['palabra', 'word'], ['perro', 'dog'], ['zapato', 'shoe'], ['papel', 'paper', false],
  ])
  it('picks studied cards sharing the shown prefix ("pa…" for pantalones)', () => {
    const picks = rankDistractors('pantalones', pool, { prefix: ['pa'] })
    expect(picks).toEqual(['pañuelo', 'paraguas', 'pasaporte', 'palabra'])
    expect(picks).not.toContain('papel') // never studied: "not in my deck" for the learner
    expect(picks).not.toContain('pantalón') // another form: could be right
    expect(picks).not.toContain('perro') // another prefix: the hint would rule it out
  })
  it('a known other part of speech is left out, the same one comes first', () => {
    const p = deck([['pasar (v)', 'to pass'], ['patio (n)', 'yard'], ['pared (n)', 'wall'], ['pan', 'bread'], ['pato (n)', 'duck']])
    expect(rankDistractors('papel', p, { prefix: ['pa'], pos: 'noun' })).toEqual(['patio', 'pared', 'pato', 'pan'])
  })
  it('a phrase needs the same number of words with the same initials', () => {
    const p = deck([['buenas noches', 'good night'], ['bien dicho', 'well said'], ['buen día', 'good day'], ['bajo demanda', 'on demand'], ['de nada', 'you are welcome']])
    expect(rankDistractors('buenos días', p, { prefix: ['b', 'd'] })).toEqual(['bien dicho', 'buen día', 'bajo demanda'])
  })
  it('a synonym (same meaning) is never a wrong option', () => {
    const p = deck([['sombrío', 'gloomy'], ['soleado', 'sunny'], ['sombrerito', 'hat'], ['sonido', 'sound']])
    // sombrerito means hat too; sombrío shares the stem (a related form is never a fair wrong option either).
    expect(rankDistractors('sombrero', p, { prefix: ['so'], meaning: 'hat' })).toEqual(['soleado', 'sonido'])
  })
  it('closeForm and sharesPrefix', () => {
    expect(closeForm('perro', 'perra')).toBe(true)
    expect(closeForm('pantalón', 'pantalones')).toBe(true)
    expect(closeForm('perro', 'pera')).toBe(false) // two edits: another word
    expect(closeForm('niño', 'niña')).toBe(true)
    expect(closeForm('paraguas', 'pasaporte')).toBe(false)
    expect(sharesPrefix('Pañuelo', ['pa'])).toBe(true)
    expect(sharesPrefix('pa', ['pa'])).toBe(false) // the prefix itself is no word
    expect(sharesPrefix('bien dicho', ['b', 'd'])).toBe(true)
  })
})

describe('planChoices: word choices, else the meaning form, else the model\'s', () => {
  const big = deck([['paraguas', 'umbrella'], ['pasaporte', 'passport'], ['pañuelo', 'handkerchief'], ['zapato', 'shoe'], ['camisa', 'shirt'], ['gorra', 'cap']])
  it(`offers word choices when at least ${MIN_DISTRACTORS} studied distractors share the prefix`, () => {
    const p = planChoices({ answer: 'pantalones', isLanguage: true, entries: big, meaning: 'trousers' })
    expect(p.kind).toBe('word')
    expect(p.choices[0]).toBe('pantalones')
    expect(p.choices).toHaveLength(4)
  })
  it('falls back to the MEANING form when the deck has fewer than 3 such words of its kind and the options open first', () => {
    const p = planChoices({ answer: 'buenos días', isLanguage: true, entries: big, head: 'buenos días', meaning: 'good morning', hintSeen: false })
    expect(p.kind).toBe('meaning')
    expect(p.word).toBe('buenos días')
    expect(p.choices[0]).toBe('good morning')
    expect(p.choices.slice(1).every((m) => m !== 'good morning')).toBe(true)
    expect(p.choices).toHaveLength(4)
  })
  it('the model\'s options only as a last resort, preferring the ones that obey the prefix', () => {
    const tiny = deck([['casa', 'house']])
    const ai = { choices: ['sombrilla', 'sombrero', 'sonaja', 'soplo', 'gorra'], answerIdx: 1 }
    const p = planChoices({ answer: 'sombrero', isLanguage: true, entries: tiny, meaning: 'hat', ai })
    expect(p.kind).toBe('ai')
    expect(p.choices).toEqual(['sombrero', 'sombrilla', 'sonaja', 'soplo'])
    const loose = planChoices({ answer: 'sombrero', isLanguage: true, entries: tiny, meaning: 'hat', ai: { choices: ['sombrero', 'gorra', 'casco', 'boina'], answerIdx: 0 } })
    expect(loose.loose).toBe(true)
    expect(planChoices({ answer: 'sombrero', isLanguage: true, entries: tiny })).toBe(null)
    expect(planChoices({ answer: '', isLanguage: true, entries: big })).toBe(null)
  })
  it('never the meaning form after the typed question was seen (it named the meaning)', () => {
    expect(planChoices({ answer: 'sombrero', isLanguage: true, entries: big, head: 'sombrero', meaning: 'hat' })).toBe(null)
  })
  it('options opening first need no shared prefix (no hint was shown)', () => {
    const p = planChoices({ answer: 'sombrero', isLanguage: true, entries: big, head: 'sombrero', meaning: 'hat', hintSeen: false })
    expect(p.kind).toBe('word')
    expect(p.choices[0]).toBe('sombrero')
  })
  it('an INFLECTED answer never gets headword distractors (the conjugated form would stand out)', () => {
    const verbs = deck([['comer', 'to eat'], ['cantar', 'to sing'], ['correr', 'to run'], ['coser', 'to sew'], ['cocinar', 'to cook']])
    expect(planChoices({ answer: 'comió', isLanguage: true, entries: verbs, head: 'comer', meaning: 'to eat' })).toBe(null)
    expect(planChoices({ answer: 'comió', isLanguage: true, entries: verbs, head: 'comer', meaning: 'to eat', hintSeen: false }).kind).toBe('meaning')
  })
  it('the deck\'s fitting words and the model\'s fitting options fill up together', () => {
    const two = deck([['sonido', 'sound'], ['soleado', 'sunny'], ['casa', 'house']])
    const ai = { choices: ['sombrero', 'gorra', 'sopa', 'casco'], answerIdx: 0 }
    const p = planChoices({ answer: 'sombrero', isLanguage: true, entries: two, head: 'sombrero', meaning: 'hat', ai })
    expect(p.choices).toEqual(['sombrero', 'sonido', 'soleado', 'sopa'])
    expect(p.loose).toBeUndefined()
  })
  it('a LONGER prefix the learner saw (a retry hint) is the one options must share', () => {
    const more = deck([['pantano', 'swamp'], ['pantera', 'panther'], ['pantufla', 'slipper']])
    const p = planChoices({ answer: 'pantalones', isLanguage: true, entries: [...big, ...more], meaning: 'trousers', shownPrefix: ['pant'] })
    expect(p.kind).toBe('word')
    expect(p.choices.slice(1).every((c) => c.startsWith('pant'))).toBe(true)
  })
  it('the card itself is never its own distractor', () => {
    const w = planChoices({ answer: 'paraguas', isLanguage: true, entries: [...big, ...deck([['palabra', 'word']])], head: 'paraguas', meaning: 'umbrella' })
    expect(w.kind).toBe('word')
    expect(w.choices.filter((c) => c === 'paraguas')).toHaveLength(1)
    const m = planChoices({ answer: 'paraguas', isLanguage: true, entries: big, head: 'paraguas', meaning: 'umbrella', hintSeen: false })
    expect(m.kind).toBe('word') // no hint shown: any studied word of its kind
    expect(m.choices.filter((c) => c === 'paraguas')).toHaveLength(1)
  })
  it('general modes: deck terms of the same shape, else the model\'s options; never a prefix', () => {
    const terms = deck([['TPM', 'chip'], ['HSM', 'module'], ['PKI', 'infra'], ['Kerberos', 'auth'], ['What is a VPN?', 'x']])
    const p = planChoices({ answer: 'TEE', isLanguage: false, entries: terms })
    expect(p.kind).toBe('word')
    expect(p.choices).toEqual(['TEE', 'TPM', 'HSM', 'PKI'])
    const ai = { choices: ['21', '22', '23', '80'], answerIdx: 1 }
    expect(planChoices({ answer: '22', isLanguage: false, entries: terms, ai })).toMatchObject({ kind: 'ai', choices: ['22', '21', '23', '80'], answerIdx: 0 })
  })
  it('rankMeanings skips the card and repeated meanings', () => {
    const p = deck([['a1', 'dog'], ['b1', 'cat'], ['c1', 'dog'], ['perro', 'x']])
    expect(rankMeanings('hound', p, { head: 'perro' })).toEqual(['dog', 'cat'])
  })
  it('shuffleChoices keeps the right one marked', () => {
    let s = 3
    const r = shuffleChoices(['a', 'b', 'c', 'd'], 0, () => ((s = (s * 7) % 11) / 11))
    expect(r.choices[r.answerIdx]).toBe('a')
    expect([...r.choices].sort()).toEqual(['a', 'b', 'c', 'd'])
  })
  it('the prompt rule names the prefix for language modes only', () => {
    expect(distractorRule(true, 'Spanish')).toMatch(/SAME LETTERS/)
    expect(distractorRule(false)).not.toMatch(/LETTERS/)
  })
})

describe('the case the options are shown in', () => {
  it('a general term keeps its own spelling; the answer is shown as the card writes it', () => {
    const terms = deck([['TPM', 'chip'], ['Key escrow', 'k'], ['Tokenization', 't'], ['Salting', 's']])
    const p = planChoices({ answer: 'secure enclave', accepted: ['secure enclave'], isLanguage: false, entries: terms, head: 'Secure enclave' })
    expect(p.choices[0]).toBe('Secure enclave')
    expect(p.choices).toContain('Key escrow')
  })
  it('a language answer in lowercase gets lowercase options', () => {
    const p = planChoices({ answer: 'pantalones', isLanguage: true, entries: deck([['Paraguas', 'u'], ['Pasaporte', 'p'], ['Pañuelo', 'h']]) })
    expect(p.choices).toEqual(['pantalones', 'paraguas', 'pasaporte', 'pañuelo'])
  })
})

describe('THE GUARD: a wrong option is never also right', () => {
  it('meanings that overlap: a shared gloss word, the same back, one class of stand-ins', () => {
    expect(meaningsOverlap('good day', 'good morning')).toBe(true)
    expect(meaningsOverlap('hello', 'good morning')).toBe(true) // both greetings
    expect(meaningsOverlap('thanks a lot', 'thank you')).toBe(true)
    expect(meaningsOverlap('to run', 'running')).toBe(true)
    expect(meaningsOverlap('umbrella', 'trousers')).toBe(false)
    expect(meaningsOverlap('a hat', 'the cat')).toBe(false) // short and stop words never count
    // general modes: long definitions share ordinary words; only a mostly-shared one counts
    expect(meaningsOverlap('A chip that stores keys in hardware', 'A firewall that filters network traffic', { loose: true })).toBe(false)
    expect(meaningsOverlap('Hardware chip storing encryption keys', 'Chip in hardware that stores encryption keys', { loose: true })).toBe(true)
  })
  it('another form of the answer: sameLemma', () => {
    expect(sameLemma('hablar', 'hablé')).toBe(true)
    expect(sameLemma('pantalones', 'pantalón')).toBe(true)
    expect(sameLemma('pantalones', 'pantano')).toBe(false)
  })
  it('"buen día" never stands as a wrong option for "buenos días" (good morning in Latin America too)', () => {
    const pool = deck([['buen día', 'good day'], ['bien dicho', 'well said'], ['buena dama', 'good lady'], ['bajo dos', 'under two'], ['bello día', 'nice day']])
    const p = planChoices({ answer: 'buenos días', isLanguage: true, entries: pool, head: 'buenos días', meaning: 'good morning' })
    expect(p.choices).not.toContain('buen día')
    expect([...p.choices].sort()).toEqual(['bajo dos', 'bello día', 'bien dicho', 'buenos días']) // "buena dama" (good lady) shares "good": out too
  })
  it('the model\'s options are guarded too: a form of the answer, or a pool card meaning the same', () => {
    const pool = deck([['soleado', 'sunny'], ['sonido', 'sound'], ['sopa', 'soup'], ['sombrerito', 'little hat']])
    const ai = { choices: ['sombrero', 'sombreros', 'sombrerito', 'soplo', 'sótano'], answerIdx: 0 }
    const p = planChoices({ answer: 'sombrero', isLanguage: true, entries: pool, head: 'sombrero', meaning: 'hat', ai })
    expect(p.choices).not.toContain('sombreros')
    expect(p.choices).not.toContain('sombrerito')
    expect(p.choices).toHaveLength(4)
  })
  it('the meaning form never offers a second right meaning', () => {
    const pool = deck([['hola', 'hello'], ['casa', 'house'], ['perro', 'dog'], ['gato', 'cat'], ['buen día', 'good day']])
    const p = planChoices({ answer: 'buenos días', isLanguage: true, entries: pool, head: 'buenos días', meaning: 'good morning', hintSeen: false, typedSeen: false })
    expect(p.kind).toBe('meaning')
    expect(p.choices).not.toContain('hello')
    expect(p.choices).not.toContain('good day')
  })
  it('spares come along for a swap after the review flags an option', () => {
    const pool = deck([['paraguas', 'umbrella'], ['pasaporte', 'passport'], ['pañuelo', 'handkerchief'], ['palabra', 'word'], ['pato', 'duck']])
    const p = planChoices({ answer: 'pantalones', isLanguage: true, entries: pool, meaning: 'trousers' })
    expect(p.spare.length).toBe(2)
  })
})

describe('the pool, each card read on its own sides', () => {
  const asked = { front: 'perro', back: 'dog\nEl perro ladra.' }
  it('a reversed card (the meaning on its front, several lines) is read flipped', () => {
    const es = poolEntries([{ front: 'pig\nThe pig eats.', back: 'puerco' }, { front: 'pato', back: 'duck\nEl pato nada.' }], { card: asked })
    expect(es.map((e) => e.word).sort()).toEqual(['pato', 'puerco'])
  })
  it('a user-language word (another card\'s meaning, or a word of this card\'s meaning) is dropped', () => {
    const es = poolEntries([{ front: 'pig', back: 'cerdo' }, { front: 'cerdo', back: 'pig' }, { front: 'dog', back: 'perro' }], { card: { front: 'perro', back: 'dog' } })
    expect(es.map((e) => e.word)).toEqual(['cerdo'])
  })
  it('a script difference decides the sides', () => {
    expect(scriptOf('собака')).toBe('Cyrillic')
    const es = poolEntries([{ front: 'cat', back: 'кошка' }, { front: 'мышь', back: 'mouse' }, { front: 'casa', back: 'house' }], { card: { front: 'собака', back: 'dog' } })
    expect(es.map((e) => e.word).sort()).toEqual(['кошка', 'мышь'])
  })
})

describe('the model\'s options keep the answer\'s shape', () => {
  it('a language answer of two words never gets one-word model options beside its two-word deck ones', () => {
    const pool = deck([['bien dicho', 'well said'], ['casa', 'house']])
    const ai = { choices: ['buenos días', 'bufanda', 'gorra', 'bajo dos', 'bello día'], answerIdx: 0 }
    const p = planChoices({ answer: 'buenos días', isLanguage: true, entries: pool, head: 'buenos días', meaning: 'good morning', ai })
    expect(p.choices.every((c) => c.split(' ').length === 2)).toBe(true)
  })
})
