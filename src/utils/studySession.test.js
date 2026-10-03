import { describe, it, expect } from 'vitest'
import { activitySignature, isAbandoned, lastActiveAt, unsyncedInSnapshot, pendingRatings, hadProgress, STUDY_SESSION_MAX_AGE_MS } from './studySession.js'

const H = 60 * 60 * 1000

describe('activitySignature', () => {
  const base = [{ cardId: 1, done: true, rating: 'good', ease: 3, questionIdx: 2, answers: ['a', 'b'], gradedAt: 5 }, { cardId: 2, questionIdx: 0, answers: [] }]
  it('ignores what the restore sanitizes', () => {
    const sanitized = base.map((cs) => ({ ...cs, gradedAt: 999, mnemonicLoading: false, synced: true }))
    expect(activitySignature({ studyCardState: sanitized, syncedIds: new Set([1]) })).toBe(activitySignature({ studyCardState: base, syncedIds: [1] }))
  })
  it('changes on an answer, a rating or a review reaching Anki', () => {
    const s0 = activitySignature({ studyCardState: base, syncedIds: new Set() })
    expect(activitySignature({ studyCardState: [base[0], { ...base[1], answers: ['x'], questionIdx: 1 }], syncedIds: new Set() })).not.toBe(s0)
    expect(activitySignature({ studyCardState: [{ ...base[0], rating: 'easy', ease: 4 }, base[1]], syncedIds: new Set() })).not.toBe(s0)
    expect(activitySignature({ studyCardState: base, syncedIds: new Set([1]) })).not.toBe(s0)
  })
  it('survives junk', () => {
    expect(typeof activitySignature({ studyCardState: [null, 3] })).toBe('string')
    expect(typeof activitySignature()).toBe('string')
  })
})

describe('isAbandoned', () => {
  const now = 1_000_000_000_000
  it('uses activeAt, not savedAt', () => {
    expect(isAbandoned({ activeAt: now - 14 * 24 * H, savedAt: now }, now)).toBe(true)
    expect(isAbandoned({ activeAt: now - 7 * H, savedAt: now - 9 * H }, now)).toBe(false)
  })
  it('falls back to savedAt for older snapshots, and calls a timeless one abandoned', () => {
    expect(isAbandoned({ savedAt: now - 9 * H }, now)).toBe(true)
    expect(isAbandoned({ savedAt: now - H }, now)).toBe(false)
    expect(isAbandoned({}, now)).toBe(true)
    expect(isAbandoned(null, now)).toBe(true)
  })
  it('defaults to 8 hours', () => {
    expect(STUDY_SESSION_MAX_AGE_MS).toBe(8 * H)
    expect(isAbandoned({ activeAt: now - 8 * H + 1 }, now)).toBe(false)
    expect(isAbandoned({ activeAt: now - 8 * H - 1 }, now)).toBe(true)
    expect(lastActiveAt({ activeAt: 'x', savedAt: 5 })).toBe(0)
  })
})

describe('unsynced and pending', () => {
  const cards = [
    { cardId: 1, done: true, ease: 3, rating: 'good' },
    { cardId: 2, done: true, ease: 3, rating: 'good', synced: true },
    { cardId: 3, done: true, ease: 1, rating: 'again', noSync: true },
    { cardId: 4, done: true, evaluating: true },
    { cardId: 5, done: true, ease: 2, rating: 'hard' },
    { cardId: 6, questionIdx: 1, answers: ['a'] },
  ]
  it('counts a snapshot like the restore did', () => {
    expect(unsyncedInSnapshot({ studyCardState: cards, syncedIds: [5] })).toBe(2) // 1 and the one still grading
  })
  it('lists a live session\'s rated, unsent cards', () => {
    expect(pendingRatings(cards, new Set([5])).map((c) => c.cardId)).toEqual([1])
    expect(pendingRatings(null, null)).toEqual([])
  })
  it('knows a session with progress', () => {
    expect(hadProgress([{ cardId: 1 }])).toBe(false)
    expect(hadProgress([{ cardId: 1, answers: ['x'] }])).toBe(true)
  })
})
