import { describe, it, expect } from 'vitest'
import { newPlacement, afterBatch, placementLevel, startTier, TIERS, BATCH, MIN_QUESTIONS, MAX_QUESTIONS } from './placement'

const batch = (right, n = BATCH) => Array.from({ length: n }, (_, i) => ({ correct: i < right }))
// Runs the exam with a learner who gets `rateAt(tier)` of each batch right; returns the finished state.
function run(selfRating, rightAt) {
  let s = newPlacement(selfRating)
  for (let guard = 0; guard < 20 && !s.done; guard++) s = afterBatch(s, batch(rightAt(s.tier)))
  return s
}

describe('placement exam', () => {
  it('starts from the self-rating', () => {
    expect(startTier(1)).toBe(0)
    expect(startTier(3)).toBe(2)
    expect(startTier(5)).toBe(3)
    expect(startTier('x')).toBe(0)
  })
  it('climbs while batches are strong and stops at the top', () => {
    const s = run(1, () => BATCH)
    expect(s.done).toBe(true)
    expect(new Set(s.answered.map((a) => a.tier)).size).toBe(TIERS.length)
    expect(placementLevel(s.answered)).toBe(TIERS.at(-1).level)
  })
  it('never asks fewer than the minimum or more than the maximum', () => {
    const lo = run(3, () => 3) // a middling learner: the first batch alone is not enough
    expect(lo.answered.length).toBeGreaterThanOrEqual(MIN_QUESTIONS)
    let s = newPlacement(1)
    for (let i = 0; i < 50 && !s.done; i++) s = afterBatch({ ...s, tier: 0 }, batch(3))
    expect(s.answered.length).toBeLessThanOrEqual(MAX_QUESTIONS)
  })
  it('steps down while the self-rating was too high, then stops', () => {
    const s = run(5, (tier) => (tier >= 2 ? 1 : BATCH))
    expect(s.steppedDown).toBe(true)
    expect(s.done).toBe(true)
    expect(placementLevel(s.answered)).toBeGreaterThanOrEqual(TIERS[1].level)
    expect(placementLevel(s.answered)).toBeLessThan(TIERS[3].level)
  })
  it('ends a tier early on three misses in a row', () => {
    const s = afterBatch(newPlacement(3), [{ correct: true }, { correct: true }, { correct: false }, { correct: false }, { correct: false }])
    expect(s.tier).toBe(1) // stepped down instead of climbing, though 2/5 alone would not have climbed either
  })
  it('scores a beginner near zero and gives partial credit above the passed tier', () => {
    expect(placementLevel([{ tier: 0, correct: false }, { tier: 0, correct: false }])).toBe(0)
    const partial = [...batch(5).map((r) => ({ ...r, tier: 1 })), ...batch(2).map((r) => ({ ...r, tier: 2 }))]
    const lv = placementLevel(partial)
    expect(lv).toBeGreaterThan(TIERS[1].level)
    expect(lv).toBeLessThan(TIERS[2].level)
  })
})
