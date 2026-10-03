import { describe, it, expect } from 'vitest'
import { summarizeEvidence, evidenceText, buildEvidenceLevelPrompt, parseEvidenceLevel, EVIDENCE } from './evidence'
import { buildLearnerSnapshot } from './learnerContext'
import { bandsFor } from './learner'

const card = (front, interval, lapses = 0, reps = interval ? 5 : 0) => ({ front, back: `${front} means`, interval, lapses, reps })
const deckOf = (studied = [], fresh = [], extra = {}) => ({ ok: true, name: 'Spanish', total: studied.length + fresh.length, newTotal: fresh.length, studied, fresh, ...extra })
const snap = (parts) => buildLearnerSnapshot({ modeName: 'Spanish', isLanguage: true, ...parts })
const many = (n, interval = 30) => Array.from({ length: n }, (_, i) => card(`w${i}`, interval))
const chat = (userTexts) => ({ title: 'Ordering food', messages: userTexts.flatMap((u) => [{ role: 'user', content: u }, { role: 'assistant', content: 'Good! Say "quisiera" instead of "quiero".' }]) })

describe('summarizeEvidence', () => {
  it('counts studied cards with their stats, new cards apart', () => {
    const s = summarizeEvidence(snap({ deck: deckOf([card('casa', 40), card('perro', 3), card('llover', 2, 4)], [card('ojalá', 0)]) }))
    expect(s).toMatchObject({ total: 4, reviewed: 3, mature: 1, struggling: 1, fresh: 1, enough: false, deckOk: true })
  })

  it('is enough with many studied cards (mature and young count alike)', () => {
    expect(summarizeEvidence(snap({ deck: deckOf(many(EVIDENCE.minScore, 30)) })).enough).toBe(true)
    expect(summarizeEvidence(snap({ deck: deckOf(many(EVIDENCE.minScore, 2)) })).enough).toBe(true)
    expect(summarizeEvidence(snap({ deck: deckOf(many(EVIDENCE.minScore - 1)) })).enough).toBe(false)
  })

  it('counts study answers and chats toward enough, even with few reviews', () => {
    const few = deckOf(many(10))
    expect(summarizeEvidence(snap({ deck: few })).enough).toBe(false)
    const sessions = [{ cardsStudied: 30, totalQuestions: 60, correct: 45 }]
    const s = summarizeEvidence(snap({ deck: few, study: { ok: true, sessions } }))
    expect(s.score).toBe(30)
    expect(s.accuracy).toBe(75)
    // A learner who wrote a lot in chats with Ebi.
    const talk = Array.from({ length: 8 }, () => chat(Array(3).fill('Hola, quiero pedir una mesa para dos personas esta noche por favor, gracias')))
    const t = summarizeEvidence(snap({ deck: few, study: { ok: true, sessions }, chats: { ok: true, items: talk } }))
    expect(t.chatWords).toBe(312)
    expect(t.enough).toBe(true)
    expect(t.cautious).toBe(true)
  })

  it('never counts new cards as known, but a deck that shows its scope allows a cautious level', () => {
    const imported = deckOf([], many(500, 0))
    expect(summarizeEvidence(snap({ deck: imported }))).toMatchObject({ reviewed: 0, fresh: 500, enough: false, any: true })
    const s = summarizeEvidence(snap({ deck: deckOf(many(EVIDENCE.minScoreWithScope), many(EVIDENCE.minScope, 0)) }))
    expect(s).toMatchObject({ enough: true, cautious: true })
    expect(summarizeEvidence(snap({ deck: deckOf(many(EVIDENCE.minScoreWithScope), many(EVIDENCE.minScope - 1, 0)) })).enough).toBe(false)
  })

  it('a deck that could not be read still lets the other evidence count, and says so', () => {
    const sessions = [{ cardsStudied: 100, totalQuestions: 150, correct: 120 }]
    const s = summarizeEvidence(snap({ deck: { ok: false, name: 'Spanish', error: 'Anki is not running', unreachable: true }, study: { ok: true, sessions } }))
    expect(s).toMatchObject({ deckOk: false, deckUnreachable: true, reviewed: 0, enough: true, any: true })
    expect(s.sources).toEqual(['sessions'])
  })

  it('says how much is missing', () => {
    const s = summarizeEvidence(snap({ deck: deckOf(many(25)) }))
    expect(s).toMatchObject({ enough: false, missing: 15 })
    expect(summarizeEvidence(snap({})).missing).toBe(EVIDENCE.minScore)
  })

  it('survives junk input', () => {
    expect(summarizeEvidence(snap({ deck: { studied: [null, {}, { front: '  ' }] }, study: 'x', slips: { items: [null] } }))).toMatchObject({ total: 0, sessions: 0, accuracy: null, enough: false, any: false })
    expect(summarizeEvidence(undefined)).toMatchObject({ total: 0, enough: false })
  })
})

describe('evidence prompt', () => {
  const subject = { name: 'Spanish', isLanguage: true, learnLang: 'Spanish', userLang: 'English' }
  it('quotes studied and new cards apart, with stats, chats and slips', () => {
    const s = snap({
      deck: deckOf([card('casa', 40), card('"tricky"', 2, 5)], [card('ojalá', 0)]),
      slips: { ok: true, items: [{ text: 'ser vs estar', n: 3 }] },
      chats: { ok: true, items: [chat(['Yo soy cansado hoy'])] },
    })
    const p = buildEvidenceLevelPrompt(subject, s, { bands: bandsFor(true), levelMax: 130 })
    expect(p.user).toContain('"casa"')
    expect(p.user).toContain('ivl 40d')
    expect(p.user).toContain('"\\"tricky\\""')
    expect(p.user).toMatch(/NEW CARDS[^\n]*NOT what they know[^\n]*\n- "ojalá"/)
    expect(p.user).toContain('learner: "Yo soy cansado hoy"')
    expect(p.user).toContain('ser vs estar (x3)')
    expect(p.user).toContain('A1 (beginner)')
    expect(p.system + p.user).not.toMatch(/[—–]/)
    expect(evidenceText(null)).toBe('')
  })

  it('stays bounded on a huge deck and many chats', () => {
    const s = snap({ deck: deckOf(many(2000), many(2000, 0)), chats: { ok: true, items: Array.from({ length: 30 }, () => chat(Array.from({ length: 40 }, () => 'palabra '.repeat(80)))) } })
    expect(evidenceText(s).length).toBeLessThanOrEqual(9000)
  })

  it('asks for a cautious level on limited evidence, and says when the deck could not be read', () => {
    const limited = snap({ deck: deckOf(many(20), many(40, 0)) })
    expect(buildEvidenceLevelPrompt(subject, limited, { bands: bandsFor(true) }).user).toContain('LIMITED')
    const down = snap({ deck: { ok: false, unreachable: true }, study: { ok: true, sessions: [{ totalQuestions: 200, correct: 150 }] } })
    expect(buildEvidenceLevelPrompt(subject, down, { bands: bandsFor(true) }).user).toContain('could not be read')
  })

  it('parses a level, clamps it and caps the confidence (lower when cautious)', () => {
    expect(parseEvidenceLevel({ level: '42', confidence: 0.95, strengths: ['greetings'], gaps: ['past tense', 3], why: 'You know the basics.' }))
      .toEqual({ level: 42, confidence: 0.7, strengths: ['greetings'], gaps: ['past tense', '3'], why: 'You know the basics.' })
    expect(parseEvidenceLevel({ level: 42, confidence: 0.9 }, undefined, 130, { cautious: true }).confidence).toBe(EVIDENCE.cautiousMax)
    expect(parseEvidenceLevel({ level: 500 }).level).toBe(130)
    expect(parseEvidenceLevel({ level: 20, confidence: 30 }).confidence).toBe(0.3)
    expect(parseEvidenceLevel({ level: '' })).toBeNull()
    expect(parseEvidenceLevel(null)).toBeNull()
    expect(parseEvidenceLevel('42')).toBeNull()
  })
})
