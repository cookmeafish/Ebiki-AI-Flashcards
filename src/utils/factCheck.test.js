import { describe, it, expect } from 'vitest'
import { parseAiJson } from './aiJson'
import { buildFactCheckPrompt, parseFactCheck, shouldFactCheck, FACT_CHECK_MAX_NOTES } from './factCheck'

const REPLY = 'In Portuguese, "saudade" is a feeling of longing. It is always a happy word, and "nostalgia" means the same thing exactly.'

describe('parseFactCheck: only notes that point at the reply\'s own words', () => {
  it('keeps a mistake whose quote is in the reply', () => {
    const out = parseFactCheck('{"mistakes":[{"quote":"It is always a happy word","fix":"Saudade is usually bittersweet, not happy."}]}', REPLY, parseAiJson)
    expect(out).toEqual([{ quote: 'It is always a happy word', fix: 'Saudade is usually bittersweet, not happy.' }])
  })
  it('drops a quote that is not in the reply (an invented target)', () => {
    expect(parseFactCheck('{"mistakes":[{"quote":"saudade is a verb","fix":"It is a noun."}]}', REPLY, parseAiJson)).toEqual([])
  })
  it('matches through case, spacing, curly quotes and bold', () => {
    const r = 'Use **"está"** for   location.  Ser is ALWAYS permanent.'
    expect(parseFactCheck('{"mistakes":[{"quote":"ser is always permanent","fix":"The rule breaks: la fiesta es en casa."}]}', r, parseAiJson)).toHaveLength(1)
  })
  it('drops style-only fixes, empty fields and duplicates, and caps the count', () => {
    const many = JSON.stringify({ mistakes: [
      { quote: 'It is always a happy word', fix: 'This could be clearer.' },
      { quote: 'It is always a happy word', fix: '' },
      { quote: 'always a happy word', fix: 'It is bittersweet.' },
      { quote: 'always a happy word', fix: 'It is bittersweet.' },
      { quote: 'means the same thing exactly', fix: 'Nostalgia is close, not the same.' },
      { quote: 'a feeling of longing', fix: 'Fine, but a third one.' },
    ] })
    const out = parseFactCheck(many, REPLY, parseAiJson)
    expect(out).toHaveLength(FACT_CHECK_MAX_NOTES)
    expect(out.map((o) => o.quote)).toEqual(['always a happy word', 'means the same thing exactly'])
  })
  it('reads the reply shapes models send, and nothing from junk', () => {
    expect(parseFactCheck('```json\n{"mistakes": []}\n```', REPLY, parseAiJson)).toEqual([])
    expect(parseFactCheck('[{"quote":"always a happy word","correction":"It is bittersweet."}]', REPLY, parseAiJson)).toHaveLength(1)
    expect(parseFactCheck('{"errors":[{"quote":"always a happy word","fix":"It is bittersweet."}]}', REPLY, parseAiJson)).toHaveLength(1)
    expect(parseFactCheck('no idea', REPLY, parseAiJson)).toEqual([])
    expect(parseFactCheck('{"mistakes":[{"quote":"always a happy word"}]}', REPLY, parseAiJson)).toEqual([])
  })
})

describe('the prompt', () => {
  it('names the learned language for grammar, the app language for the fix, and the checked material', () => {
    const { system, user } = buildFactCheckPrompt({ reply: 'x', question: 'q?', context: 'CARD TEXT', subject: { language: 'Portuguese' }, userLang: 'German' })
    expect(system).toMatch(/studies Portuguese/)
    expect(system).toMatch(/in German/)
    expect(system).toMatch(/NOT mistakes/)
    expect(system).not.toMatch(/—/)
    expect(user).toMatch(/CHECKED MATERIAL:\nCARD TEXT/)
    expect(user).toMatch(/THE LEARNER ASKED:\nq\?/)
  })
  it('a general subject asks no grammar check', () => {
    expect(buildFactCheckPrompt({ reply: 'x', subject: { topic: 'networking' } }).system).not.toMatch(/studies/)
  })
  it('skips replies too short to teach anything', () => {
    expect(shouldFactCheck('¡Claro! ¿Y tú?')).toBe(false)
    expect(shouldFactCheck(REPLY)).toBe(true)
  })
})
