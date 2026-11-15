import { describe, it, expect } from 'vitest'
import { VOICE_TURN_RULE, VOICE_TURN_REMINDER, hearingLang, spokenReplyProblems, trimSpoken, wantsMore, sentencesOf } from './voiceStyle'

describe('how Ebi talks out loud', () => {
  it('asks for a short, casual, person-like reply in the language just spoken', () => {
    expect(VOICE_TURN_RULE).toMatch(/1 or 2 short sentences/)
    expect(VOICE_TURN_RULE).toMatch(/OVERRIDE/)
    expect(VOICE_TURN_RULE).toMatch(/SAME language the learner just spoke/)
    expect(VOICE_TURN_RULE).toMatch(/Never offer a menu/)
    expect(VOICE_TURN_RULE).toMatch(/recast/)
    expect(VOICE_TURN_RULE + VOICE_TURN_REMINDER).not.toMatch(/[—–]/)
  })
  it('the recognizer expects the learned language in a language mode, the app language otherwise, or the panel pick', () => {
    expect(hearingLang({ isLanguage: true, learnIso: 'pt', appIso: 'en' })).toBe('pt')
    expect(hearingLang({ isLanguage: false, learnIso: 'en', appIso: 'en' })).toBe('en')
    expect(hearingLang({ isLanguage: true, learnIso: 'pt', appIso: 'en', choice: 'en' })).toBe('en')
    expect(hearingLang({ isLanguage: true, learnIso: 'pt', appIso: 'en', choice: 'auto' })).toBe('')
  })
})

describe('a spoken reply is checked in code', () => {
  it('a short casual reply passes', () => {
    expect(spokenReplyProblems('Qué bien, ¿y adónde fueron después?')).toEqual([])
    expect(spokenReplyProblems('Yes. Next one: what does a SIEM collect?')).toEqual([])
  })
  it('too long, too many sentences, praise openers, assistant closers and menus are caught', () => {
    const lecture = 'A firewall filters traffic by rules. It sits between networks. It can be a host firewall or a network one. Stateful ones track connections, so replies are allowed back in without extra rules.'
    expect(spokenReplyProblems(lecture).join(' ')).toMatch(/words.*limit|sentences/)
    expect(spokenReplyProblems('Good question. A hash is one way.')).toContain('it opens with praise or filler')
    expect(spokenReplyProblems('Estoy bien. ¿Hay algo en lo que pueda ayudarte hoy?').join(' ')).toMatch(/assistant line/)
    expect(spokenReplyProblems('Sure. Anything else you would like to practice?').join(' ')).toMatch(/assistant line/)
    expect(spokenReplyProblems('That is a block cipher. Make sense?').join(' ')).toMatch(/assistant line/)
    expect(spokenReplyProblems('Todo bien. ¿Qué quieres practicar hoy?').join(' ')).toMatch(/assistant line/)
    expect(spokenReplyProblems('All good. What would you like to practice today?').join(' ')).toMatch(/assistant line/)
    expect(spokenReplyProblems('Qué bien. ¿Y qué comiste allí?')).toEqual([])
    // the general shape, not a list of verb forms (a third judge found "¿Qué vas a practicar hoy?" slipping through)
    for (const c of ['Muy bien. ¿Qué vas a practicar hoy?', 'Bien. ¿Qué vamos a practicar hoy?', 'Todo bien. ¿De qué querés hablar hoy?', 'Bien. ¿En qué te ayudo hoy?', 'Okay. What should we practice today?', 'Got it. Want to jump back into Spanish?'])
      expect(spokenReplyProblems(c).join(' '), c).toMatch(/assistant line/)
  })
  it('a run-on sentence, a spoken-out correction, and an all-English reply in a Spanish talk are caught', () => {
    const runOn = 'Hablaste de tu semana larga, de la cena con tus primos, del perro nuevo que adoptaron, de la película que viste y de que quieres aprender a nadar este verano.'
    expect(spokenReplyProblems(runOn, { more: true }).join(' ')).toMatch(/one sentence is/)
    expect(spokenReplyProblems('Bien. Ayer tu primo te llamó, no "me llama".').join(' ')).toMatch(/corrects them out loud/)
    expect(spokenReplyProblems('That sounds rough. Give it time.', { spanishTalk: true }).join(' ')).toMatch(/in Spanish/)
    expect(spokenReplyProblems('That sounds rough. ¿Seguimos en español?', { spanishTalk: true })).toEqual([])
    expect(spokenReplyProblems('Qué bien. ¿Y tu primo te llamó otra vez?')).toEqual([])
  })
  it('a bare praise opener is caught, a short verdict beat does not use a sentence slot, quoted Spanish is not an invite', () => {
    expect(spokenReplyProblems('¡Excelente! Los dibujos son muy bonitos.')).toContain('it opens with praise or filler')
    expect(spokenReplyProblems('Not quite. A worm spreads by itself across a network. A virus needs a host file to run.')).toEqual([])
    const t = trimSpoken('¡Genial! Las fotos quedaron muy bonitas. ¿Dónde las tomaste? Seguro fue un día largo.')
    expect(t).toBe('Las fotos quedaron muy bonitas. ¿Dónde las tomaste?')
    expect(spokenReplyProblems('That takes time. Pick one pattern, like "espero que...".', { spanishTalk: true }).join(' ')).toMatch(/in Spanish/)
    expect(sentencesOf('Try one pattern, like "espero que...", and use it daily.')).toHaveLength(1)
  })
  it('the learner\'s form of address is kept (no switch to vos when they use tú)', () => {
    expect(spokenReplyProblems('Bien. ¿Y vos, qué tal?', { learnerVoseo: false }).join(' ')).toMatch(/vos/)
    expect(spokenReplyProblems('Dale. Contame más del viaje.', { learnerVoseo: false }).join(' ')).toMatch(/vos/)
    expect(spokenReplyProblems('Bien. ¿Y vos, qué tal?', { learnerVoseo: true })).toEqual([])
    expect(spokenReplyProblems('Bien. ¿Y tú, qué tal?', { learnerVoseo: false })).toEqual([])
    expect(spokenReplyProblems('Bien. ¿Y vos, qué tal?')).toEqual([]) // not a Spanish talk: not checked
    expect(spokenReplyProblems('No problem, we can keep going slowly, or we can just switch and chat.')).toContain('it offers a menu of options')
  })
  it('"tell me more", "why", an example or a recap get more room', () => {
    expect(wantsMore('tell me more')).toBe(true)
    expect(wantsMore('¿Por qué?')).toBe(true)
    expect(wantsMore('Give me a quick recap of how I did.')).toBe(true)
    expect(wantsMore('what is a VLAN')).toBe(false)
    const three = 'Salting adds random data before hashing. So two equal passwords get different hashes. That breaks precomputed tables.'
    expect(spokenReplyProblems(three)).not.toEqual([])
    expect(spokenReplyProblems(three, { more: true })).toEqual([])
  })
  it('the card tags are not counted as speech', () => {
    expect(spokenReplyProblems('Lista, está abajo. <anki-card>{"front":"plazo","back":"deadline, a long back with many many words in it that is not said aloud at all by the voice"}</anki-card>')).toEqual([])
  })
  it('the trim keeps the first sentences that fit, drops an assistant closer and opener, keeps cards', () => {
    const t = trimSpoken('Great question. A token replaces the real card number. The real one stays in a vault. Anything else I can help with? <anki-card>{"front":"token"}</anki-card>')
    expect(t).toMatch(/^A token replaces the real card number\. The real one stays in a vault\./)
    expect(t).not.toMatch(/Anything else|Great question/)
    expect(t).toMatch(/<anki-card>/)
    expect(sentencesOf(t)).toHaveLength(2)
  })
})
