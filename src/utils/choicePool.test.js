import { describe, it, expect } from 'vitest'
import { planChoices, rankDistractors, rankMeanings, poolEntry, posOf, cardWord, cardMeaning, closeForm, sharesPrefix, shuffleChoices, wordOnBack, distractorRule, MIN_DISTRACTORS, meaningsOverlap, sameLemma, poolEntries, scriptOf, meaningLabel, sameContent, optionIsFair, fairModelOptions } from './choicePool'

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
    expect(meaningsOverlap('to swim', 'swimming')).toBe(true)
    expect(meaningsOverlap('car', 'card')).toBe(false)
    expect(meaningsOverlap('pen', 'pencil')).toBe(false)
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

describe('review fixes: the real default template, general-mode terms', () => {
  // The app's own default Spanish back (App.jsx defaultMode.backTemplate), as getCardBack renders it.
  const back = (ipa, tr, syn, def) => `Pronunciación: ${ipa}\nTraducción: ${tr}\nSinónimos: ${syn}\nDefinición: ${def}\nEjemplo: …`
  const TEMPLATE = 'Pronunciación: {pronunciation}\nTraducción: {translation}\nSinónimos: {synonyms}\nDefinición: {definition}\nEjemplo: {example}'
  it('reads the meaning from the translation line, never the IPA', () => {
    expect(meaningLabel(TEMPLATE)).toBe('Traducción')
    expect(cardMeaning(back('/ˈbwe.nos ˈdi.as/', 'good morning', 'buen día', 'saludo matinal'))).toBe('good morning')
    expect(cardMeaning(back('[ˈpe.ro]', 'dog', 'can', 'animal'), { label: 'Traducción' })).toBe('dog')
    expect(cardMeaning('perro\ndog\nEl perro ladra.', { head: 'perro' })).toBe('dog') // first line repeats the headword
    expect(cardMeaning('noun\ndog', { head: 'perro' })).toBe('dog')
  })
  it('with the default template the guard works: "buen día" and "bonito" are never wrong options', () => {
    const cards = [
      ['buen día', back('/bwen ˈdi.a/', 'good day', '', '')], ['bien dicho', back('/bjen ˈdi.tʃo/', 'well said', '', '')],
      ['bajo dos', back('/ˈba.xo ðos/', 'under two', '', '')], ['bello día', back('/ˈbe.ʎo ˈdi.a/', 'nice day', '', '')],
      ['bonito', back('/bo.ˈni.to/', 'beautiful, pretty', '', '')], ['barato', back('/ba.ˈra.to/', 'cheap', '', '')],
      ['blanco', back('/ˈblaŋ.ko/', 'white', '', '')], ['bueno', back('/ˈbwe.no/', 'good', '', '')],
    ]
    const asked = { front: 'buenos días', back: back('/ˈbwe.nos ˈdi.as/', 'good morning', '', '') }
    const es = poolEntries(cards.map(([front, b]) => ({ front, back: b })), { card: asked, label: 'Traducción' })
    expect(es.length).toBe(cards.length)
    const p = planChoices({ answer: 'buenos días', isLanguage: true, entries: es, head: 'buenos días', meaning: cardMeaning(asked.back, { label: 'Traducción' }) })
    expect(p.choices).not.toContain('buen día')
    const bello = { front: 'bello', back: back('/ˈbe.ʎo/', 'beautiful', '', '') }
    const p2 = planChoices({ answer: 'bello', isLanguage: true, entries: poolEntries(cards.map(([front, b]) => ({ front, back: b })), { card: bello }), head: 'bello', meaning: 'beautiful', hintSeen: false })
    expect(p2.choices).not.toContain('bonito')
  })
  it('a back whose first line repeats the headword keeps the pool', () => {
    const pool = [{ front: 'pato', back: 'pato\nduck' }, { front: 'pan', back: 'pan\nbread' }, { front: 'papa', back: 'papa\npotato' }]
    expect(poolEntries(pool, { card: { front: 'perro', back: 'perro\ndog' } }).map((e) => e.word)).toEqual(['pato', 'pan', 'papa'])
  })
  it('general modes: deck terms only when the answer IS the card\'s term', () => {
    const terms = deck([['Secure Boot', 'Boot checks.'], ['FDE', 'Full disk encryption.'], ['Hash function', 'One-way.'], ['HSM', 'Key appliance.'], ['PKI', 'Certificates.']])
    const ai = { choices: ['Trusted Platform Module', 'Total Privacy Mode', 'Trusted Process Manager', 'Token Protection Module'], answerIdx: 0 }
    const p = planChoices({ answer: 'Trusted Platform Module', isLanguage: false, entries: terms, head: 'TPM', ai })
    expect(p.kind).toBe('ai')
    expect(p.choices).not.toContain('Secure Boot')
    expect(planChoices({ answer: 'TPM', isLanguage: false, entries: terms, head: 'TPM' }).kind).toBe('word')
  })
})

describe('round 2 review: odd backs and the fight fallback guard', () => {
  it('cardMeaning reads the three odd formats', () => {
    expect(cardMeaning('🔊 Audio\nEN → dog', { head: 'perro' })).toBe('dog')
    expect(cardMeaning('n.\ndog', { head: 'perro' })).toBe('dog')
    expect(cardMeaning('/ˈpe.ro/ (n.) dog', { head: 'perro' })).toBe('dog')
    expect(cardMeaning('(adj) big, large')).toBe('big, large')
    expect(cardMeaning('(informal) cool')).toBe('(informal) cool') // not a part-of-speech tag: kept
  })
  it('sameContent: an article or little word less is the same answer', () => {
    expect(sameContent('el perro', 'perro')).toBe(true)
    expect(sameContent('a veces', 'veces')).toBe(true)
    expect(sameContent('el perro', 'el gato')).toBe(false)
    expect(sameContent('el', 'la')).toBe(false) // nothing but little words: never "the same"
  })
  it('optionIsFair / fairModelOptions guard the model options without the shape rule', () => {
    expect(optionIsFair('perro', 'el perro')).toBe(false)
    expect(optionIsFair('gato', 'el perro')).toBe(true)
    expect(optionIsFair('perros', 'perro')).toBe(false)
    expect(fairModelOptions({ ai: { choices: ['el perro', 'perro', 'gato', 'gato', 'casa'], answerIdx: 0 }, accepted: ['el perro'] })).toEqual(['gato', 'casa'])
    const entries = [{ word: 'can', meaning: 'dog' }]
    expect(fairModelOptions({ ai: { choices: ['perro', 'can', 'gato'], answerIdx: 0 }, accepted: ['perro'], meaning: 'dog', entries, head: 'perro' })).toEqual(['gato'])
  })
  it('planChoices never offers "perro" for "el perro" from the deck either', () => {
    const p = planChoices({ answer: 'el perro', isLanguage: true, hintSeen: false, entries: [{ word: 'perro', meaning: 'dog', studied: true }, { word: 'el gato', meaning: 'the cat', studied: true }], ai: { choices: ['el perro', 'perro', 'la casa', 'el gato'], answerIdx: 0 } })
    expect(p.choices).not.toContain('perro')
  })
})

describe('round 3 review: numbers and versions are the answer (general modes)', () => {
  const pairs = [['Port 22', 'Port 23'], ['RAID 5', 'RAID 6'], ['802.11ac', '802.11n'], ['IPv4', 'IPv6'], ['TLS 1.2', 'TLS 1.3']]
  it('two numbered or versioned answers are never "another form" of each other', () => {
    for (const [a, b] of pairs) {
      expect(optionIsFair(b, a, { accepted: [a], loose: true })).toBe(true)
      expect(fairModelOptions({ ai: { choices: [a, b, 'other'], answerIdx: 0 }, accepted: [a], isLanguage: false })).toContain(b)
    }
    for (const [a, b] of pairs.filter(([a]) => /\d\D*\d|\d/.test(a) && a !== '802.11ac')) {
      expect(closeForm(a, b)).toBe(false)
      expect(sameLemma(a, b)).toBe(false)
      expect(sameContent(a, b)).toBe(false)
    }
  })
  it('in a general mode "the same answer" is only case, spacing and punctuation', () => {
    expect(optionIsFair('raid5', 'RAID 5', { loose: true })).toBe(false)
    expect(optionIsFair('RAID-5', 'RAID 5', { loose: true })).toBe(false)
    expect(optionIsFair('RAID 50', 'RAID 5', { loose: true })).toBe(true)
  })
  it('the general raw fallback drops near copies of the right option', () => {
    const p = planChoices({ answer: 'RAID 5', isLanguage: false, ai: { choices: ['RAID 5', 'raid5', 'RAID-5', 'RAID 1'], answerIdx: 0 } })
    expect(p.choices).toEqual(['RAID 5', 'RAID 1'])
  })
  it('a language answer with digits still compares as words ("3 años" vs "tres años" untouched)', () => {
    expect(closeForm('3 años', '3 anos')).toBe(true)
  })
})

describe('numbered siblings lead in a general mode', () => {
  it('"Port 22": the model\'s "Port 23/21/443" beat deck terms of other kinds', () => {
    const entries = ['802.11ac', 'TLS 1.3', 'IPv6', 'RAID 5'].map((w) => ({ word: w, meaning: 'x ' + w, studied: true }))
    const p = planChoices({ answer: 'Port 22', head: 'Port 22', isLanguage: false, entries, ai: { choices: ['Port 22', 'Port 23', 'Port 21', 'Port 443'], answerIdx: 0 } })
    expect(p.choices).toEqual(['Port 22', 'Port 23', 'Port 21', 'Port 443'])
    const w = planChoices({ answer: '802.11ac', head: '802.11ac', isLanguage: false, entries, ai: { choices: ['802.11ac', '802.11n', '802.11ax', 'WPA3'], answerIdx: 0 } })
    expect(w.choices.slice(0, 3)).toEqual(['802.11ac', '802.11n', '802.11ax'])
  })
})

describe('round 4 review: near forms of a general answer are no wrong options', () => {
  const near = [['Firewall', 'Firewalls'], ['TPM', 'the TPM'], ['Trusted Platform Module', 'Trusted Platform Modules'], ['Port 22', 'Port 22 (SSH)'], ['TPM', 'TPMs']]
  const siblings = [['RAID 5', 'RAID 6'], ['802.11ac', '802.11n'], ['Port 22', 'Port 23'], ['TLS 1.3', 'TLS 1.2'], ['IPv6', 'IPv4'], ['HTTP', 'HTTPS'], ['RAID 5', 'RAID 50']]
  it('optionIsFair refuses a near form, keeps a numbered or coded sibling', () => {
    for (const [a, b] of near) {
      expect(optionIsFair(b, a, { loose: true })).toBe(false)
      expect(optionIsFair(b, 'something else', { accepted: [a], loose: true })).toBe(false)
    }
    for (const [a, b] of siblings) expect(optionIsFair(b, a, { accepted: [a], loose: true })).toBe(true)
  })
  it('fights (fairModelOptions) drop the near forms and keep the siblings', () => {
    for (const [a, b] of near) expect(fairModelOptions({ ai: { choices: [a, b, 'Proxy', 'VPN'], answerIdx: 0 }, accepted: [a], isLanguage: false })).toEqual(['Proxy', 'VPN'])
    for (const [a, b] of siblings) expect(fairModelOptions({ ai: { choices: [a, b, 'Proxy'], answerIdx: 0 }, accepted: [a], isLanguage: false })).toEqual([b, 'Proxy'])
  })
  it('Study (planChoices) never offers a near form, keeps the siblings', () => {
    for (const [a, b] of near) {
      const p = planChoices({ answer: a, isLanguage: false, ai: { choices: [a, b, 'Proxy', 'VPN', 'IDS'], answerIdx: 0 } })
      expect(p.choices[0]).toBe(a)
      expect(p.choices).not.toContain(b)
    }
    for (const [a, b] of siblings) {
      const p = planChoices({ answer: a, isLanguage: false, ai: { choices: [a, b, 'Proxy', 'VPN'], answerIdx: 0 } })
      expect(p.choices).toContain(b)
    }
  })
  it('only words SET OFF after the answer make it the same answer (round 6: added words alone are another thing)', () => {
    expect(optionIsFair('SSH tunneling', 'SSH', { loose: true })).toBe(true)
    expect(optionIsFair('Port 22 - SSH', 'Port 22', { loose: true })).toBe(false)
    expect(optionIsFair('Firewall: network', 'Firewall', { loose: true })).toBe(false)
    expect(optionIsFair('Port 22', 'Port 22 (SSH)', { loose: true })).toBe(false)
    expect(optionIsFair('Port 220', 'Port 22', { loose: true })).toBe(true)
    expect(optionIsFair('Proxy server', 'Firewall', { loose: true })).toBe(true)
  })
  it('the language branch is unchanged', () => {
    expect(optionIsFair('perros', 'perro')).toBe(false)
    expect(optionIsFair('gato', 'perro')).toBe(true)
  })
})

describe('round 5 review: near forms only, never a spelling distance (general modes)', () => {
  const kept = [['Phishing', 'Vishing'], ['Phishing', 'Smishing'], ['Hypothyroidism', 'Hyperthyroidism'], ['Hypertension', 'Hypotension'],
    ['Ileum', 'Ilium'], ['Prussia', 'Russia'], ['Austria', 'Australia'], ['Mitosis', 'Meiosis'], ['Afferent', 'Efferent'],
    ['Port 22', 'Port 2222'], ['Port 22', 'Port 23'], ['RAID 1', 'RAID 10'], ['HTTP', 'HTTPS'], ['HTTP', 'HTTP/2'], ['HTTP', 'HTTP 1.1'], ['Windows', 'Windows 11'],
    ['Louis XIV', 'Louis XVI'], ['Henry VIII', 'Henry VII'], ['Type 1 diabetes', 'Type 2 diabetes'], ['SHA-1', 'SHA-256'], ['WPA2', 'WPA3'],
    ['TCP', 'UDP'], ['World War I', 'World War II'], ['802.11ac', '802.11n'], ['802.11ac', '802.1X'],
    // undecided by the review, fair for now (an answer's fragment is not refused)
    ['Trusted Platform Module', 'Platform Module'], ['Treaty of Versailles', 'Versailles'], ['Battle of Hastings', 'Hastings']]
  const rejected = [['TPM', 'the TPM'], ['TPM', 'TPMs'], ['TPM', 'tpms'], ['Firewall', 'Firewalls'], ['Firewall', 'a firewall'],
    ['Port 22', 'Port 22 (SSH)'], ['TPM', 'Trusted Platform Module'], ['Trusted Platform Module', 'TPM'], ['AES', 'Advanced Encryption Standard'],
    ['802.11ax', 'Wi-Fi 6'], ['Trusted Platform Module', 'Trusted Platform Modules'], ['Security policy', 'Security policies']]
  it('optionIsFair keeps classic exam distractors and siblings', () => {
    for (const [a, o] of kept) expect([a, o, optionIsFair(o, a, { accepted: [a], loose: true })]).toEqual([a, o, true])
  })
  it('optionIsFair refuses plurals, articles, added endings, containment, acronym expansions', () => {
    for (const [a, o] of rejected) expect([a, o, optionIsFair(o, a, { accepted: [a], loose: true })]).toEqual([a, o, false])
  })
  it('a fight keeps all three wrong options for "Which attack uses voice calls?"', () => {
    expect(fairModelOptions({ ai: { choices: ['Vishing', 'Phishing', 'Smishing', 'Whaling'], answerIdx: 0 }, accepted: ['Vishing'], isLanguage: false })).toEqual(['Phishing', 'Smishing', 'Whaling'])
    const p = planChoices({ answer: 'Vishing', isLanguage: false, ai: { choices: ['Vishing', 'Phishing', 'Smishing', 'Whaling'], answerIdx: 0 } })
    expect(p.choices).toEqual(['Vishing', 'Phishing', 'Smishing', 'Whaling'])
  })
  it('the language branch still refuses spelling neighbours', () => {
    expect(optionIsFair('perra', 'perro')).toBe(false)
  })
})

describe('round 6 review: names with + and #, chemical symbols, added words (general modes)', () => {
  const kept = [['C', 'C++'], ['C', 'C#'], ['C++', 'C#'], ['C', 'Objective-C'], ['Java', 'JavaScript'], ['SQL', 'MySQL'], ['SQL', 'NoSQL'],
    ['React', 'React Native'], ['Python', 'Python 3'], ['H2O', 'H2O2'], ['CO2', 'CO'], ['NaCl', 'KCl'], ['Sodium', 'Sodium chloride'],
    ['Iron', 'Iron oxide'], ['CO', 'Co'], ['COPD', 'Asthma'], ['MI', 'CHF'], ['Guinea', 'Guinea-Bissau'], ['Guinea', 'Equatorial Guinea'],
    ['Sudan', 'South Sudan'], ['Congo', 'Democratic Republic of the Congo'], ['Niger', 'Nigeria'], ['Dominica', 'Dominican Republic'],
    ['Charles I', 'Charles II'], ['Treaty of Versailles', 'Treaty of Paris'], ['Bach', 'C. P. E. Bach'], ['Richard Strauss', 'Johann Strauss'],
    ['Sonata', 'Sonatina'], ['Allegro', 'Allegretto'], ['Lessor', 'Lessee'], ['Mens rea', 'Actus reus'], ['Habeas corpus', 'Habeas data'],
    ['Port', 'Porter'], ['Hash', 'Hashing'], ['IDS', 'Intrusion Prevention System']]
  const rejected = [['JavaScript', 'JS'], ['NaCl', 'Sodium chloride'], ['H2O', 'Water'], ['MI', 'Myocardial infarction'],
    ['CHF', 'Congestive heart failure'], ['Myocardial infarction', 'Heart attack'], ['Angina', 'Angina pectoris'], ['USA', 'United States'],
    ['UK', 'United Kingdom'], ['Magna Carta', 'Magna Carta Libertatum'], ['Tort', 'Torts'], ['Certiorari', 'Writ of certiorari'],
    ['Stare decisis', 'Precedent'], ['Router', 'Routers'], ['Policy', 'Policies'], ['IDS', 'Intrusion Detection System']]
  // Known and accepted (left to the AI option check): "Lincoln" for "Abraham Lincoln" and back stay fair; a lowercase
  // "https" for "HTTP" is refused (read as the plural of "http", like "tpms" for "TPM").
  it('keeps distractors that add words, symbols or another case', () => {
    for (const [a, o] of kept) expect([a, o, optionIsFair(o, a, { accepted: [a], loose: true })]).toEqual([a, o, true])
  })
  it('refuses aliases, expansions and plurals', () => {
    for (const [a, o] of rejected) expect([a, o, optionIsFair(o, a, { accepted: [a], loose: true })]).toEqual([a, o, false])
  })
  it('a fight keeps C++ and C# for "C" (the duplicate check keeps + and #)', () => {
    expect(fairModelOptions({ ai: { choices: ['C', 'C++', 'C#', 'Objective-C'], answerIdx: 0 }, accepted: ['C'], isLanguage: false })).toEqual(['C++', 'C#', 'Objective-C'])
    expect(fairModelOptions({ ai: { choices: ['CO', 'Co', 'CO2', 'co'], answerIdx: 0 }, accepted: ['CO'], isLanguage: false })).toEqual(['Co', 'CO2'])
    const p = planChoices({ answer: 'C', isLanguage: false, ai: { choices: ['C', 'C++', 'C#', 'Objective-C'], answerIdx: 0 } })
    expect(p.choices).toEqual(['C', 'C++', 'C#', 'Objective-C'])
  })
  it('the language branch is unchanged', () => {
    expect(optionIsFair('perro', 'el perro', { accepted: ['el perro'] })).toBe(false)
    expect(optionIsFair('gato', 'perro', { accepted: ['perro'] })).toBe(true)
  })
})

describe('round 7 review: only 1 or 2 letters keep their case apart', () => {
  it('"Dns" and "Ssh" are DNS and SSH, never a wrong option', () => {
    for (const [a, o] of [['DNS', 'Dns'], ['SSH', 'Ssh'], ['TPM', 'Tpm']]) expect([a, o, optionIsFair(o, a, { accepted: [a], loose: true })]).toEqual([a, o, false])
    expect(fairModelOptions({ ai: { choices: ['DNS', 'Dns', 'DHCP', 'NTP'], answerIdx: 0 }, accepted: ['DNS'], isLanguage: false })).toEqual(['DHCP', 'NTP'])
  })
  it('chemical symbols still differ by case', () => {
    for (const [a, o] of [['CO', 'Co'], ['NO', 'No'], ['Hf', 'HF']]) expect([a, o, optionIsFair(o, a, { accepted: [a], loose: true })]).toEqual([a, o, true])
  })
})
