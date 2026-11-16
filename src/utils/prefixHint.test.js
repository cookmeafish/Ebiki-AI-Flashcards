import { describe, it, expect } from 'vitest'
import { prefixLen, prefixOf, prefixHint, hintAnswer, canHint, hasPrefixHint, stripPrefixHint, stripCountSkeleton, hasCountSkeleton, stripQuotedLetterCues, insertHint, typedPrompt, choicePromptText, longerPrefix, hintTokens, seamlessBlank, choicesShareHint, choicePromptFor } from './prefixHint'

describe('the prefix hint (the owner: about 20% of the word, never the length)', () => {
  it('shows about 20% of a one-word answer, at least 1, leaving 2+ hidden', () => {
    expect(prefixHint('perro')).toBe('(p…)')
    expect(prefixHint('sombrero')).toBe('(so…)')
    expect(prefixHint('pantalones')).toBe('(pa…)')
    expect(prefixHint('murciélago')).toBe('(mu…)')
    expect(prefixHint('electrodomésticos')).toBe('(ele…)')
    expect(prefixHint('sol')).toBe('(s…)')
    expect(prefixHint('yo')).toBe('') // two letters: one would be half of it
    expect(prefixLen(2)).toBe(0)
    for (let n = 3; n <= 40; n++) {
      const k = prefixLen(n)
      expect(k).toBeGreaterThanOrEqual(1)
      if (n >= 3) expect(n - k).toBeGreaterThanOrEqual(2)
    }
    expect(prefixLen(1)).toBe(0)
  })
  it('a multi-word answer gets the first letter of each word', () => {
    expect(prefixHint('buenos días')).toBe('(b… d…)')
    expect(prefixHint('el sombrero')).toBe('(… s…)') // a short word shows only "…"
    expect(prefixHint('  por   favor ')).toBe('(p… f…)')
  })
  it('never for Han or kana, a 1-letter answer, or nothing', () => {
    expect(prefixHint('雨伞')).toBe('')
    expect(prefixHint('がっこう')).toBe('')
    expect(prefixHint('カメラ')).toBe('')
    expect(prefixHint('y')).toBe('')
    expect(prefixHint('')).toBe('')
    expect(prefixHint('...')).toBe('')
    expect(prefixHint('학교')).toBe('') // two syllables: one would be half of it
    expect(prefixHint('собака')).toBe('(с…)')
  })
  it('keeps accents and inner marks as written', () => {
    expect(prefixOf('árbol', 1)).toBe('á')
    expect(prefixOf('col·lecció', 4)).toBe('col·l')
    expect(prefixOf('¡hola!', 2)).toBe('ho')
  })
  it('the display never reveals the length: two answers of different length show the same hint', () => {
    expect(prefixHint('pantalones')).toBe(prefixHint('pantalón')) // 10 and 8 letters → "pa…" both
    expect(prefixHint('perro')).toBe(prefixHint('pato'))
  })
  it('hintAnswer takes the main (first) accepted answer', () => {
    expect(hintAnswer(['sombrero', 'sombreros'])).toBe('sombrero')
    expect(hintAnswer([])).toBe('')
    expect(canHint(['走る', 'はしる'])).toBe(false)
    expect(canHint(['gorra'])).toBe(true)
  })
})

describe('reading, stripping and placing hints', () => {
  it('detects its own form, for the right answer only', () => {
    expect(hasPrefixHint('Hat (so…)?', ['sombrero'])).toBe(true)
    expect(hasPrefixHint('Hello (b… d…)', ['buenos días'])).toBe(true)
    expect(hasPrefixHint('Hat (go…)?', ['sombrero'])).toBe(false)
    expect(hasPrefixHint('Hat (wide brim)?', ['sombrero'])).toBe(false)
    expect(hintTokens('(b… d…)')).toEqual(['b', 'd'])
  })
  it('strips hints and legacy skeletons, never an abbreviation or an ordinary parenthesis', () => {
    expect(stripPrefixHint('Lleva un ___ (so…) al sol')).toBe('Lleva un ___ al sol')
    expect(stripCountSkeleton('Lleva un ___ (s·······) al sol')).toBe('Lleva un ___ al sol')
    expect(stripCountSkeleton('Say "I" (y·)')).toBe('Say "I"')
    expect(stripCountSkeleton('Say "I" (y_)')).toBe('Say "I"')
    expect(stripCountSkeleton('Lleva un ___ (e· ········)')).toBe('Lleva un ___')
    expect(stripCountSkeleton('See (p.) 4')).toBe('See (p.) 4')
    expect(hasCountSkeleton('x (s·······)')).toBe(true)
    expect(hasCountSkeleton('x (wide)')).toBe(false)
    expect(stripPrefixHint('Y así (y así sucesivamente…)')).toBe('Y así (y así sucesivamente…)')
  })
  it('strips the model\'s quoted first-letter cues, only for the answer\'s letter when answers are given', () => {
    expect(stripQuotedLetterCues('La gacela ___ (escapar de un peligro; empieza con "h") rápido', ['huye'])).toBe('La gacela ___ (escapar de un peligro) rápido')
    expect(stripQuotedLetterCues('How do you say "house"? It starts with "c".', ['casa'])).toBe('How do you say "house"?')
    expect(stripQuotedLetterCues('How do you say "dog"? Starts with "x".', ['perro'])).toBe('How do you say "dog"? Starts with "x".')
    expect(stripQuotedLetterCues('Hoy ___ mucho (to rain, "l").', ['llueve'])).toBe('Hoy ___ mucho (to rain).')
    expect(stripQuotedLetterCues('傘は日本語で？（「か」で始まる）')).toBe('傘は日本語で？')
  })
  it('places a hint after the blank, else before the closing punctuation', () => {
    expect(insertHint('Lleva un ___ al sol', '(so…)')).toBe('Lleva un ___ (so…) al sol')
    expect(insertHint('What is a hat?', '(go…)')).toBe('What is a hat (go…)?')
    expect(insertHint('Translate "eye"', '(o…)')).toBe('Translate "eye" (o…)')
  })
})

describe('typedPrompt: the one way a typed language question shows its hint', () => {
  const acc = ['sombrero']
  it('replaces the legacy skeleton and a quoted letter with the prefix', () => {
    expect(typedPrompt('How do you say "hat" (wide brim; starts with "s")? (s·······)', acc, { isLanguage: true })).toBe('How do you say "hat" (wide brim) (so…)?')
    expect(typedPrompt('Lleva un ___ (s·······) al sol', acc, { isLanguage: true })).toBe('Lleva un ___ (so…) al sol')
  })
  it('is idempotent and adds exactly one hint', () => {
    const once = typedPrompt('How do you say "hat"?', acc, { isLanguage: true })
    expect(once).toBe('How do you say "hat" (so…)?')
    expect(typedPrompt(once, acc, { isLanguage: true })).toBe(once)
    expect((once.match(/…/g) || []).length).toBe(1)
  })
  it('never in a general mode; an open "write a sentence" question is hinted too; Han keeps the model\'s reading cue', () => {
    expect(typedPrompt('What is TLS?', ['tls'], { isLanguage: false })).toBe('What is TLS?')
    // The word stays hidden, its first letters say WHICH word (the hint goes before the closing punctuation).
    expect(typedPrompt('Scrivi una frase con il nome che significa «il muoversi piano».', ['lentezza'], { isLanguage: true })).toBe('Scrivi una frase con il nome che significa «il muoversi piano» (le…).')
    expect(typedPrompt('雨伞は？（「y」）', ['雨伞'], { isLanguage: true })).toBe('雨伞は？（「y」）')
  })
  it('the choices view shows no hint at all', () => {
    expect(choicePromptText('Lleva un ___ (so…) (wide brim) al sol', acc)).toBe('Lleva un ___ (wide brim) al sol')
    expect(choicePromptText('Hat (s·······) (starts with "s")?', acc)).toBe('Hat?')
  })
  it('never throws on junk (property)', () => {
    const bits = ['a', 'é', ' ', '(', ')', '…', '·', '"', 'ñ', '___', '?', 'は', '走']
    let seed = 7
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
    for (let i = 0; i < 500; i++) {
      const s = Array.from({ length: Math.floor(rnd() * 14) }, () => bits[Math.floor(rnd() * bits.length)]).join('')
      const a = Array.from({ length: 1 + Math.floor(rnd() * 6) }, () => bits[Math.floor(rnd() * 3)]).join('')
      const out = typedPrompt(s, [a], { isLanguage: true })
      expect(typeof out).toBe('string')
      expect(typedPrompt(out, [a], { isLanguage: true })).toBe(out)
    }
  })
})

describe('longerPrefix (a retry hint, the raid Hint power)', () => {
  it('shows more than the prefix hint, never the whole word, never the length', () => {
    expect(longerPrefix('pantalones')).toBe('pant…')
    expect(longerPrefix('perro')).toBe('pe…')
    expect(longerPrefix('buenos días', 0.5)).toBe('bue… dí…')
    expect(longerPrefix('yo')).toBe('')
    expect(longerPrefix('雨伞')).toBe('')
  })
})

describe('stripPrefixHint with the answers known', () => {
  it('takes out only the hint of THESE answers, never the question\'s own "(etc…)"', () => {
    expect(stripPrefixHint('Lleva un ___ (so…) (y así, etc…).', ['sombrero'])).toBe('Lleva un ___ (y así, etc…).')
    expect(stripPrefixHint('Dijo (bueno…) que sí (s…).', ['sí'])).toBe('Dijo (bueno…) que sí.')
    expect(stripPrefixHint('Dijo (bueno…) que sí (s…).')).toBe('Dijo que sí.')
  })
})

describe('short words and elisions', () => {
  it('a short word in a phrase shows only "…", never its whole self', () => {
    expect(prefixHint('a veces')).toBe('(… v…)')
    expect(prefixHint('de nada')).toBe('(… n…)')
    expect(prefixHint('no sé')).toBe('') // every word short: any letter would be it
    expect(hintTokens('(… v…)')).toEqual(['', 'v'])
    expect(longerPrefix('a veces')).toBe('… ve…')
  })
  it('an elision hints the content word', () => {
    expect(prefixHint("l'eau")).toBe("(l'e…)")
    expect(prefixHint("l'eau froide")).toBe("(l'e… f…)")
    expect(prefixHint("d'accord")).toBe("(d'a…)")
    expect(prefixHint("aujourd'hui")).toBe('(au…)') // not an elision
    expect(longerPrefix("l'eau")).toBe("l'ea…")
  })
  it('the typed prompt carries and finds these hints (idempotent), the choice view drops them', () => {
    const once = typedPrompt('¿Cómo se dice "sometimes"?', ['a veces'], { isLanguage: true })
    expect(once).toBe('¿Cómo se dice "sometimes" (… v…)?')
    expect(typedPrompt(once, ['a veces'], { isLanguage: true })).toBe(once)
    expect(hasPrefixHint(once, ['a veces'])).toBe(true)
    expect(choicePromptText(once, ['a veces'])).toBe('¿Cómo se dice "sometimes"?')
    expect(choicePromptText('Y entonces (…) llegó.')).toBe('Y entonces (…) llegó.') // a bare "(…)" is the text's own
  })
})

describe('review fixes: numbers, two-letter words, Hangul, Arabic punctuation', () => {
  it('a leading number is hidden like a short word', () => {
    expect(prefixHint('3 años')).toBe('(… a…)')
    expect(hintTokens(prefixHint('3 años'))).toEqual(['', 'a'])
  })
  it('a two-letter word gets no hint (one letter would be half of it)', () => {
    expect(prefixHint('yo')).toBe('')
    expect(prefixHint('sol')).toBe('(s…)')
  })
  it('a short Hangul word gets no hint; a long one its first syllable', () => {
    expect(prefixHint('사과')).toBe('')
    expect(prefixHint('바나나')).toBe('')
    expect(prefixHint('컴퓨터실')).toBe('(컴…)')
  })
  it('the Arabic question mark closes a question like "?"', () => {
    expect(insertHint('كيف تقول "book"؟', '(ك…)')).toBe('كيف تقول "book" (ك…)؟')
  })
})

describe('seamlessBlank: the blank carries the hint (display only)', () => {
  it('one word: the letters sit in the blank', () => {
    expect(seamlessBlank('El gato ___ (du…) en la silla.')).toBe('El gato du___ en la silla.')
    expect(seamlessBlank('El gato _____(du…) aquí')).toBe('El gato du_____ aquí')
  })
  it('several words: one blank each; a word with no letters shown is a bare blank', () => {
    expect(seamlessBlank('Dijo ___ (h… l…) al salir.')).toBe('Dijo h___ l___ al salir.')
    expect(seamlessBlank('Viene ___ (… v…) al parque.')).toBe('Viene ___ v___ al parque.')
  })
  it('a sense cue after the hint stays; other parentheses and a hint with no blank are untouched', () => {
    expect(seamlessBlank('Ella ___ (ca…) mucho. (moverse a pie)')).toBe('Ella ca___ mucho. (moverse a pie)')
    expect(seamlessBlank('¿Cómo se dice "dog" (pe…)?')).toBe('¿Cómo se dice "dog" (pe…)?')
    expect(seamlessBlank('Llena ___ (el hueco, etc…)')).toBe('Llena ___ (el hueco, etc…)')
    expect(seamlessBlank('Nada ___ (…) aquí')).toBe('Nada ___ (…) aquí')
  })
  it('the stored form still strips and detects as before', () => {
    const stored = typedPrompt('El gato ___ en la silla.', ['duerme'], { isLanguage: true })
    expect(stored).toBe('El gato ___ (d…) en la silla.')
    expect(choicePromptText(stored, ['duerme'])).toBe('El gato ___ en la silla.')
    expect(seamlessBlank(seamlessBlank(stored))).toBe('El gato d___ en la silla.')
  })
})

describe('the hint beside choices: kept only when every option shares it', () => {
  const q = 'La ___ (te…) duró una hora.'
  it('every option starts with the shown letters: the hint stays', () => {
    expect(choicesShareHint(q, ['tertulia'], ['tertulia', 'tela', 'tensión', 'tecla'])).toBe(true)
    expect(choicePromptFor(q, ['tertulia'], ['tertulia', 'tela', 'tensión', 'tecla'])).toBe(q)
    expect(choicePromptFor(q, ['tertulia'], ['Tertulia', 'tela'])).toBe(q) // two options (a 50:50), case aside
  })
  it('one option that does not share it: the hint goes, as before', () => {
    expect(choicePromptFor(q, ['tertulia'], ['tertulia', 'reunión', 'tela', 'tecla'])).toBe('La ___ duró una hora.')
    expect(choicePromptFor(q, ['tertulia'], ['tertulia', 'una tela', 'tensión', 'tecla'])).toBe('La ___ duró una hora.') // another word count
  })
  it('several words: each word against its own letters; a bare "…" word matches any', () => {
    const p = 'Llegó ___ (… t…) como siempre.'
    expect(choicePromptFor(p, ['a tiempo'], ['a tiempo', 'a tientas', 'de tarde'])).toBe(p)
    expect(choicePromptFor(p, ['a tiempo'], ['a tiempo', 'a veces'])).toBe('Llegó ___ como siempre.')
  })
  it('no options, or no hint in the text: nothing kept, nothing invented', () => {
    expect(choicePromptFor(q, ['tertulia'], [])).toBe('La ___ duró una hora.')
    expect(choicePromptFor('La ___ duró una hora.', ['tertulia'], ['tertulia', 'tela'])).toBe('La ___ duró una hora.')
  })
})
