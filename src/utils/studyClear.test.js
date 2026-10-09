import { describe, expect, it } from 'vitest'
import { clearableCard, waitsForRating } from './studyClear'

const done = (x = {}) => ({ done: true, results: [{ correct: true }], ...x })

describe('clearableCard', () => {
  it('clears synced, deleted and practice cards', () => {
    expect(clearableCard(done({ rating: 'good', ease: 3, synced: true }))).toBe(true)
    expect(clearableCard(done({ rating: 'deleted', ease: 1 }))).toBe(true)
    expect(clearableCard(done({ rating: 'good', ease: 3, noSync: true }))).toBe(true)
  })
  it('keeps a rated card still waiting for Anki', () => {
    expect(clearableCard(done({ rating: 'good', ease: 3, synced: false }))).toBe(false)
  })
  it('keeps a failed grading still waiting for a manual rating', () => {
    const failed = done({ gradeFailed: true, rating: null, ease: null })
    expect(waitsForRating(failed)).toBe(true)
    expect(clearableCard(failed)).toBe(false)
    expect(clearableCard({ ...failed, noSync: true })).toBe(false)
  })
  it('clears a failed grading once rated and synced', () => {
    expect(clearableCard(done({ gradeFailed: true, rating: 'hard', ease: 2, synced: true }))).toBe(true)
  })
  it('clears conjugation drills and never an unfinished card', () => {
    expect(clearableCard(done({ isConjugation: true, gradeFailed: true, rating: null }))).toBe(true)
    expect(clearableCard({ done: false, results: [] })).toBe(false)
    expect(clearableCard(done({ results: [] }))).toBe(false)
    expect(clearableCard(null)).toBe(false)
  })
})
