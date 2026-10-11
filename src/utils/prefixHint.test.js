import { describe, it, expect } from 'vitest'
import { prefixLen, prefixOf, prefixHint, hintAnswer, canHint, hasPrefixHint, stripPrefixHint, stripCountSkeleton, hasCountSkeleton, stripQuotedLetterCues, insertHint, typedPrompt, choicePromptText, longerPrefix, hintTokens } from './prefixHint'

describe('the prefix hint (the owner: about 20% of the word, never the length)', () => {
  it('shows about 20% of a one-word answer, at least 1, leaving 2+ hidden', () => {
    expect(prefixHint('perro')).toBe('(p…)')
    expect(prefixHint('sombrero')).toBe('(so…)')
    expect(prefixHint('pantalones')).toBe('(pa…)')
    expect(prefixHint('murciélago')).toBe('(mu…)')
    expect(prefixHint('electrodomésticos')).toBe('(ele…)')
    expect(prefixHint('sol')).toBe('(s…)')
    expect(prefixHint('yo')).toBe('(y…)')
    for (let n = 2; n <= 40; n++) {
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
    expect(prefixHint('학교')).toBe('(학…)') // Hangul is letters
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
  it('never in a general mode or an open question; Han keeps the model\'s reading cue', () => {
    expect(typedPrompt('What is TLS?', ['tls'], { isLanguage: false })).toBe('What is TLS?')
    expect(typedPrompt('Write a sentence', acc, { isLanguage: true, open: true })).toBe('Write a sentence')
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
