import { describe, it, expect } from 'vitest'
import { judgeStrike, judgeAnswer, flagOf } from './judge'
import { parseVerdict } from './fightJudge'
import { matchTyped, normalizeAnswer, sanitizeQuestions } from './grade'
import { phrasesOf, sharesPhrase } from './taunt'

const noKey = { hasKey: false }
const comptia = { name: 'CompTIA A+', isLanguage: false, userLang: 'English' }
const japanese = { name: 'Japanese', isLanguage: true, learnLang: 'Japanese', userLang: 'English' }

describe('without an AI key nothing is silently graded wrong', () => {
  it('a fight answer the local matcher cannot settle is not a miss (no lost heart, no Anki Again)', async () => {
    const q = { prompt: 'Which port does HTTPS use?', accepted: ['443'] }
    const j = await judgeStrike(noKey, comptia, q, 'four four three')
    expect(j.verdict).toBe('error')
    expect(j.noKey).toBe(true)
  })
  it('an open fight question without a key is not a miss either', async () => {
    const j = await judgeStrike(noKey, comptia, { prompt: 'Explain RAID 1', accepted: [], open: true }, 'mirroring')
    expect(j.verdict).toBe('error')
    expect(j.noKey).toBe(true)
  })
  it('a local exact match still counts without a key', async () => {
    expect((await judgeStrike(noKey, comptia, { prompt: 'Port?', accepted: ['443'] }, '443')).verdict).toBe('clean')
  })
  it('an empty answer is still a miss', async () => {
    expect((await judgeStrike(noKey, comptia, { prompt: 'Port?', accepted: ['443'] }, '  ')).verdict).toBe('miss')
  })
  it('judgeAnswer says it could not grade (null), never a verdict', async () => {
    expect(await judgeAnswer(noKey, comptia, { prompt: 'Explain', open: true }, 'x')).toBeNull()
  })
})

describe('model flags', () => {
  it('reads booleans written as words, with punctuation, in several languages', () => {
    expect(flagOf('True.')).toBe(true)
    expect(flagOf(' yes! ')).toBe(true)
    expect(flagOf('sí')).toBe(true)
    expect(flagOf('falso')).toBe(false)
    expect(flagOf('Non')).toBe(false)
    expect(flagOf('maybe')).toBe(null)
    expect(flagOf('')).toBe(null)
  })
  it('a verdict written with "correct" instead of "target" is still read', () => {
    expect(parseVerdict({ correct: true })).toEqual({ target: true, all: true, accentsOnly: false })
    expect(parseVerdict({ correct: 'false' })).toEqual({ target: false, all: false, accentsOnly: false })
    expect(parseVerdict({ note: 'hi' })).toBeNull()
  })
})

describe('local matching across scripts', () => {
  it('a missing dakuten is a different word, not an accent slip', () => {
    expect(matchTyped('かき', ['がき'])).toBe(null)
    expect(matchTyped('パン', ['バン'])).toBe(null)
  })
  it('Indic and Thai vowel signs are letters, not accents', () => {
    expect(matchTyped('क', ['का'])).toBe(null)
    expect(matchTyped('กน', ['กิน'])).toBe(null)
  })
  it('Latin accents and Arabic vowel marks are still accent slips', () => {
    expect(matchTyped('cancion', ['canción'])).toBe('accent')
    expect(matchTyped('كتب', ['كَتَبَ'])).toBe('accent')
  })
  it('full-width forms and CJK punctuation match', () => {
    expect(matchTyped('猫。', ['猫'])).toBe('exact')
    expect(matchTyped('ＲＡＩＤ　５', ['RAID 5'])).toBe('exact')
    expect(normalizeAnswer('「はい」')).toBe('はい')
  })
})

describe('sanitizeQuestions', () => {
  it('keeps a typed question whose answer came back as a number (a port, a year)', () => {
    const out = sanitizeQuestions([{ question: 'Which port does HTTPS use?', answer: 443 }])
    expect(out).toHaveLength(1)
    expect(out[0].accepted).toEqual(['443'])
  })
  it('a numeric typed answer still joins the accepted list', () => {
    const out = sanitizeQuestions([{ question: 'Year the web was proposed?', answer: 1989, accepted: ['1989', 'nineteen eighty-nine'] }])
    expect(out[0].accepted).toEqual(['1989', 'nineteen eighty-nine'])
  })
})

describe('taunt overlap in scripts without spaces', () => {
  it('Thai lines are compared by character runs too', () => {
    expect(phrasesOf('คุณตอบผิดอีกแล้ว').size).toBeGreaterThan(0)
    expect(sharesPhrase('คุณตอบผิดอีกแล้ว', ['ตอบผิดอีกครั้ง'])).toBe(true)
  })
})

describe('Japanese relaxed accents', () => {
  it('a missing dakuten is never waved through as clean without a key', async () => {
    const j = await judgeStrike(noKey, japanese, { prompt: 'Kid (slang)?', accepted: ['がき'] }, 'かき', { strictAccents: false })
    expect(j.verdict).not.toBe('clean')
  })
})
