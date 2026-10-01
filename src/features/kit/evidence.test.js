import { describe, it, expect } from 'vitest'
import { summarizeEvidence, evidenceText, buildEvidenceLevelPrompt, parseEvidenceLevel, EVIDENCE } from './evidence'
import { bandsFor } from './learner'

const card = (front, interval, lapses = 0, reps = interval ? 5 : 0) => ({ front, interval, lapses, reps })

describe('summarizeEvidence', () => {
  it('counts reviewed, mature, struggling and unseen cards', () => {
    const s = summarizeEvidence({ cards: [card('casa', 40), card('perro', 3), card('llover', 2, 4), card('ojalá', 0)] })
    expect(s).toMatchObject({ total: 4, reviewed: 3, mature: 1, young: 1, struggling: 1, unseen: 1, enough: false })
    expect(s.known).toEqual(['casa'])
    expect(s.weak).toEqual(['llover'])
    expect(s.notYet).toEqual(['ojalá'])
  })

  it('is enough with many reviewed cards, or fewer plus graded study answers', () => {
    const many = Array.from({ length: EVIDENCE.minReviewed }, (_, i) => card(`w${i}`, 30))
    expect(summarizeEvidence({ cards: many }).enough).toBe(true)
    const few = many.slice(0, EVIDENCE.minReviewedWithStudy)
    expect(summarizeEvidence({ cards: few }).enough).toBe(false)
    const sessions = [{ cardsStudied: 30, totalQuestions: EVIDENCE.minStudyAnswers, correct: 45 }]
    const s = summarizeEvidence({ cards: few, sessions })
    expect(s.enough).toBe(true)
    expect(s.accuracy).toBe(75)
  })

  it('never counts unstudied cards as evidence (a fresh import is not knowledge)', () => {
    const imported = Array.from({ length: 500 }, (_, i) => card(`w${i}`, 0))
    expect(summarizeEvidence({ cards: imported })).toMatchObject({ reviewed: 0, enough: false })
  })

  it('survives junk input', () => {
    expect(summarizeEvidence({ cards: [null, {}, { front: '  ' }], sessions: 'x', slips: [null] })).toMatchObject({ total: 0, sessions: 0, accuracy: null, enough: false })
    expect(summarizeEvidence()).toMatchObject({ total: 0 })
  })

  it('samples fronts across the deck, capped', () => {
    const many = Array.from({ length: 300 }, (_, i) => card(`w${i}`, 30 + i))
    const s = summarizeEvidence({ cards: many })
    expect(s.known.length).toBe(EVIDENCE.sampleKnown)
    expect(s.known[0]).toBe('w299') // longest interval first
  })
})

describe('evidence prompt', () => {
  const subject = { name: 'Spanish', isLanguage: true, learnLang: 'Spanish', userLang: 'English' }
  it('quotes the fronts and gives the scale', () => {
    const sum = summarizeEvidence({ cards: [card('casa', 40), card('"tricky"', 2, 5)], slips: [{ text: 'ser vs estar', n: 3 }] })
    const p = buildEvidenceLevelPrompt(subject, sum, { bands: bandsFor(true), levelMax: 130 })
    expect(p.user).toContain('"casa"')
    expect(p.user).toContain('"\\"tricky\\""')
    expect(p.user).toContain('ser vs estar (x3)')
    expect(p.user).toContain('A1 (beginner)')
    expect(p.system + p.user).not.toMatch(/[—–]/)
    expect(evidenceText(null)).toBe('')
  })

  it('parses a level, clamps it and caps the confidence', () => {
    expect(parseEvidenceLevel({ level: '42', confidence: 0.95, strengths: ['greetings'], gaps: ['past tense', 3], why: 'You know the basics.' }))
      .toEqual({ level: 42, confidence: 0.7, strengths: ['greetings'], gaps: ['past tense', '3'], why: 'You know the basics.' })
    expect(parseEvidenceLevel({ level: 500 }).level).toBe(130)
    expect(parseEvidenceLevel({ level: 20, confidence: 30 }).confidence).toBe(0.3)
    expect(parseEvidenceLevel({ level: '' })).toBeNull()
    expect(parseEvidenceLevel(null)).toBeNull()
    expect(parseEvidenceLevel('42')).toBeNull()
  })
})
