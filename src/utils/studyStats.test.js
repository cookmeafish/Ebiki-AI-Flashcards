import { describe, it, expect } from 'vitest'
import { shapeHistory, dayCount, studyStreak, todayNumbers, chartDays, groupSessions, deckBreakdown, localDay } from './studyStats.js'

const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h, 0, 0)
const NOW = at(2026, 10, 7, 15)
const TODAY = localDay(NOW)
const ds = (offset) => { const d = new Date(NOW); d.setDate(d.getDate() + offset); return localDay(d) }

describe('shapeHistory', () => {
  it('keeps only real entries and turns counts stored as text into numbers', () => {
    const h = shapeHistory([null, 3, { date: 5 }, { date: TODAY, deck: 'D', cardsStudied: '5', correct: '3', totalQuestions: '4', accuracy: '75' }])
    expect(h).toHaveLength(1)
    expect(h[0]).toMatchObject({ cardsStudied: 5, correct: 3, totalQuestions: 4, accuracy: 75 })
    expect(shapeHistory({ not: 'a list' })).toEqual([])
  })
  it('an unknown accuracy stays null, never 0', () => {
    expect(shapeHistory([{ date: TODAY, accuracy: null }])[0].accuracy).toBe(null)
    expect(shapeHistory([{ date: TODAY }])[0].accuracy).toBe(null)
  })
  it('local cards add as numbers in every total', () => {
    const h = shapeHistory([{ date: TODAY, deck: 'D', cardsStudied: '5' }, { date: TODAY, deck: 'D', cardsStudied: '7' }])
    expect(todayNumbers(null, h, NOW).cards).toBe(12)
    expect(deckBreakdown(h)[0].cards).toBe(12)
  })
})

describe('dayCount', () => {
  it('takes the larger of Anki and the local history for that ANKI day', () => {
    const h = shapeHistory([{ date: TODAY, ankiDay: ds(-1), cardsStudied: 4 }, { date: ds(-1), cardsStudied: 3 }])
    expect(dayCount({ byDay: { [ds(-1)]: 5 } }, h, ds(-1))).toBe(7) // local 4 + 3 beats Anki's 5
    expect(dayCount({ byDay: { [ds(-1)]: 9 } }, h, ds(-1))).toBe(9)
    expect(dayCount(null, h, TODAY)).toBe(0) // the 00:30 session is filed on Anki's previous day
  })
})

describe('studyStreak', () => {
  it('counts back from today, or from yesterday when today has nothing yet', () => {
    const byDay = { [ds(0)]: 2, [ds(-1)]: 3, [ds(-2)]: 1, [ds(-4)]: 9 }
    expect(studyStreak({ byDay }, [], NOW)).toBe(3)
    const noToday = { [ds(-1)]: 3, [ds(-2)]: 1 }
    expect(studyStreak({ byDay: noToday }, [], NOW)).toBe(2)
    expect(studyStreak(null, [], NOW)).toBe(0)
  })
  it('has no 365-day cap', () => {
    const byDay = {}
    for (let i = 0; i < 400; i++) byDay[ds(-i)] = 1
    expect(studyStreak({ byDay }, [], NOW)).toBe(400)
  })
})

describe('todayNumbers', () => {
  const h = shapeHistory([{ date: TODAY, deck: 'D', cardsStudied: 4, correct: 3, totalQuestions: 4 }])
  it('uses Anki only when it was read today', () => {
    expect(todayNumbers({ day: TODAY, today: 10, accuracy: 90 }, h, NOW)).toMatchObject({ cards: 10, accuracy: 90 })
    expect(todayNumbers({ day: ds(-1), today: 10, accuracy: 90 }, h, NOW)).toMatchObject({ cards: 4, accuracy: 75 })
  })
  it('cards take the larger source; an unknown Anki accuracy falls back to local', () => {
    expect(todayNumbers({ day: TODAY, today: 1, accuracy: null }, h, NOW)).toMatchObject({ cards: 4, accuracy: 75 })
  })
  it('nothing answered is null, never 0%', () => {
    expect(todayNumbers(null, [], NOW).accuracy).toBe(null)
    expect(todayNumbers({ day: TODAY, today: 0, accuracy: null }, shapeHistory([{ date: TODAY, cardsStudied: 2, totalQuestions: 0 }]), NOW).accuracy).toBe(null)
  })
  it('a PBQ partial score counts its share', () => {
    const p = shapeHistory([{ date: TODAY, cardsStudied: 1, correct: 0.5, totalQuestions: 1 }])
    expect(todayNumbers(null, p, NOW).accuracy).toBe(50)
  })
  it('just after midnight a yesterday session is not today', () => {
    const late = shapeHistory([{ date: '2026-10-06', ankiDay: '2026-10-06', cardsStudied: 8 }])
    expect(todayNumbers(null, late, at(2026, 10, 7, 0)).cards).toBe(0)
  })
})

describe('chartDays', () => {
  it('14 local days, oldest first, ending today', () => {
    const c = chartDays({ byDay: { [TODAY]: 3 } }, [], NOW)
    expect(c).toHaveLength(14)
    expect(c[13]).toMatchObject({ date: TODAY, cards: 3 })
    expect(c[0].date).toBe(ds(-13))
  })
  it('keeps calendar days across a DST change (no day repeated or skipped)', () => {
    const c = chartDays(null, [], at(2026, 11, 3, 0), 14) // early hours, around the US autumn change
    expect(new Set(c.map((x) => x.date)).size).toBe(14)
  })
})

describe('groupSessions', () => {
  it('groups by date and deck, newest date first, card-weighted accuracy over known entries only', () => {
    const h = shapeHistory([
      { date: ds(-3), deck: 'A', cardsStudied: 2, accuracy: 50 },
      { date: TODAY, deck: 'A', cardsStudied: 3, accuracy: 100 },
      { date: TODAY, deck: 'A', cardsStudied: 1, accuracy: 0 },
      { date: TODAY, deck: 'A', cardsStudied: 5, accuracy: null },
      { date: TODAY, deck: 'B', cardsStudied: 1, accuracy: null },
    ])
    const g = groupSessions(h)
    expect(g.map((x) => `${x.date}|${x.deck}`)).toEqual([`${TODAY}|A`, `${TODAY}|B`, `${ds(-3)}|A`])
    expect(g[0]).toMatchObject({ cardsStudied: 9, accuracy: 75 })
    expect(g[1].accuracy).toBe(null)
  })
  it('caps the rows', () => {
    const h = shapeHistory(Array.from({ length: 30 }, (_, i) => ({ date: ds(-i), deck: 'A', cardsStudied: 1 })))
    expect(groupSessions(h, 20)).toHaveLength(20)
  })
})

describe('deckBreakdown', () => {
  it('handles deck names that are object keys', () => {
    const d = deckBreakdown(shapeHistory([{ date: TODAY, deck: '__proto__', cardsStudied: 1 }, { date: ds(-2), deck: 'constructor', cardsStudied: 2 }]))
    expect(d.map((x) => x.deck)).toEqual(['__proto__', 'constructor'])
  })
})
