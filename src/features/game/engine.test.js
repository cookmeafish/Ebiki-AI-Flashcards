import { describe, it, expect } from 'vitest'
import {
  dateKey, addDays, weekStart, dayTotals, eventDelta, mergePlayers, pickQuests, questProgress,
  computeStreak, weekRow, weekXp, tierFor, leagueBoard, friendStreak, CHAT_XP_CAP, MAX_FREEZES, XP, LEGENDS_AREA_XP, LEGENDS_AREA_CAP, LEVEL_UP_CAP,
} from './engine'

// A player with XP on the given days (one machine), optionally with that day's quests.
const player = (days, extra = {}) => ({
  id: 'p1', name: 'Me',
  days: Object.fromEntries(Object.entries(days).map(([k, v]) => [k, { m1: typeof v === 'number' ? { xp: v } : v }])),
  ...extra,
})

describe('dates', () => {
  it('counts local days and Monday weeks', () => {
    expect(dateKey(new Date(2026, 8, 28, 23, 59))).toBe('2026-09-28')
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01')
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09') // across a DST change
    expect(weekStart('2026-09-28')).toBe('2026-09-28') // a Monday
    expect(weekStart('2026-10-04')).toBe('2026-09-28') // its Sunday
  })
})

describe('events and merging', () => {
  it('a card is 10 XP, 15 when answered right; chat stops earning at the cap', () => {
    expect(eventDelta('card', { correct: false })).toEqual({ cards: 1, correct: 0, xp: 10 })
    expect(eventDelta('card', { correct: true })).toEqual({ cards: 1, correct: 1, xp: 15 })
    expect(eventDelta('chat', {}, { chat: CHAT_XP_CAP - 1 }).xp).toBe(1)
    expect(eventDelta('chat', {}, { chat: CHAT_XP_CAP }).xp).toBe(0)
    expect(eventDelta('cardAdded', { n: 3 })).toEqual({ added: 3, xp: 9 })
    expect(eventDelta('nonsense')).toEqual({})
  })
  it('sums machines for a day, and a merge takes the max per machine (never double counts)', () => {
    const a = { id: 'p', days: { '2026-09-28': { m1: { xp: 40, cards: 3 }, m2: { xp: 10 } } } }
    const b = { id: 'p', days: { '2026-09-28': { m1: { xp: 25, cards: 5 } }, '2026-09-29': { m2: { xp: 7 } } } }
    const m = mergePlayers(a, b)
    expect(m.days['2026-09-28'].m1).toMatchObject({ xp: 40, cards: 5 })
    expect(dayTotals(m, '2026-09-28').xp).toBe(50)
    expect(dayTotals(m, '2026-09-29').xp).toBe(7)
    expect(mergePlayers(m, m)).toEqual(mergePlayers(m, m)) // idempotent
    expect(dayTotals(mergePlayers(m, a), '2026-09-28').xp).toBe(50)
  })
  it('keeps the first recorded quest list and the newer profile', () => {
    const a = { id: 'p', name: 'Old', profileAt: 1, days: { d: { m1: { xp: 1, quests: ['xp:40'] } } } }
    const b = { id: 'p', name: 'New', profileAt: 2, days: { d: { m1: { xp: 2, quests: ['xp:99'] } } } }
    const m = mergePlayers(a, b)
    expect(m.name).toBe('New')
    expect(m.days.d.m1.quests).toEqual(['xp:40'])
    expect(mergePlayers(b, a).name).toBe('New')
  })
})

describe('quests', () => {
  it('are reproducible, start with an XP quest above the goal, and skip missing features', () => {
    const q = pickQuests('p1', '2026-09-28', 30, {})
    expect(q).toEqual(pickQuests('p1', '2026-09-28', 30, {}))
    expect(q).toHaveLength(3)
    expect(q[0]).toBe('xp:45')
    expect(q.some((id) => /^(gym|legends|call):/.test(id))).toBe(false)
    expect(new Set(q.map((id) => id.split(':')[0])).size).toBe(3)
  })
  it('favor preferred kinds when available', () => {
    expect(pickQuests('p1', '2026-09-28', 30, { 'mistake-gym': true }, ['gym'])[1]).toBe('gym:1')
  })
  it('measure progress from the day totals', () => {
    expect(questProgress('cards:10', { cards: 4 })).toMatchObject({ value: 4, target: 10, done: false })
    expect(questProgress('gym:1', { gymDone: 2 })).toMatchObject({ value: 1, done: true })
  })
})

describe('streak', () => {
  it('counts consecutive days, and today pending does not break it', () => {
    const p = player({ '2026-09-25': 10, '2026-09-26': 10, '2026-09-27': 10 })
    expect(computeStreak(p, '2026-09-27')).toMatchObject({ streak: 3, todayDone: true })
    expect(computeStreak(p, '2026-09-28')).toMatchObject({ streak: 3, todayDone: false })
  })
  it('a missed day spends the starting freeze, a second one ends the streak', () => {
    const p = player({ '2026-09-20': 10, '2026-09-21': 10, '2026-09-23': 10 })
    const s = computeStreak(p, '2026-09-23')
    expect(s).toMatchObject({ streak: 3, freezes: 0, frozen: ['2026-09-22'] })
    const p2 = player({ '2026-09-20': 10, '2026-09-22': 10, '2026-09-24': 10 })
    expect(computeStreak(p2, '2026-09-24').streak).toBe(1)
  })
  it('finishing every quest of a day earns a freeze, capped', () => {
    const done = { xp: 100, cards: 20, correct: 20, added: 9, chat: 20, quests: ['xp:45', 'cards:10', 'chat:5'] }
    const p = player({ '2026-09-20': done, '2026-09-21': done, '2026-09-22': done })
    expect(computeStreak(p, '2026-09-22').freezes).toBe(MAX_FREEZES)
  })
  it('lays out the week Monday to Sunday', () => {
    const p = player({ '2026-09-28': 10 })
    const row = weekRow(p, '2026-09-29')
    expect(row.map((r) => r.status)).toEqual(['done', 'today', 'future', 'future', 'future', 'future', 'future'])
  })
})

describe('league', () => {
  it('sums a week up to a weekday', () => {
    const p = player({ '2026-09-28': 10, '2026-09-29': 20, '2026-10-01': 5 })
    expect(weekXp(p, '2026-09-28', 1)).toBe(30)
    expect(weekXp(p, '2026-09-28')).toBe(35)
  })
  it('promotes by beating every ghost week, demotes on an empty week', () => {
    const p = player({ '2026-09-07': 200, '2026-09-14': 300, '2026-09-21': 50 })
    expect(tierFor(p, '2026-09-14')).toBe(1) // 200 XP with no ghosts, 5 x goal met
    expect(tierFor(p, '2026-09-21')).toBe(2) // 300 beat the 200 ghost
    expect(tierFor(p, '2026-09-28')).toBe(1) // 50 fell below both ghosts
    expect(tierFor(p, '2026-10-12')).toBe(0) // an empty week on the way down
  })
  it('races ghosts by the same weekday and lists friends', () => {
    const me = player({ '2026-09-21': 30, '2026-09-22': 30, '2026-09-28': 50 })
    const friend = { id: 'p2', name: 'Ana', days: { '2026-09-28': { m9: { xp: 80 } } } }
    const b = leagueBoard(me, [friend], '2026-09-28')
    expect(b.rows.map((r) => [r.kind, r.xp])).toEqual([['friend', 80], ['me', 50], ['ghost', 30]])
    expect(b.rows.find((r) => r.kind === 'ghost').finalXp).toBe(60)
    expect(b.daysLeft).toBe(6)
  })
  it('counts friend streaks back from today or yesterday', () => {
    const a = player({ '2026-09-26': 5, '2026-09-27': 5 })
    const b = player({ '2026-09-26': 5, '2026-09-27': 5, '2026-09-28': 5 })
    expect(friendStreak(a, b, '2026-09-28')).toBe(2)
  })
})

describe('Legends rewards', () => {
  it('a step is worth more further up the map, capped', () => {
    expect(eventDelta('legends', { area: 0 })).toEqual({ legends: 1, xp: XP.legends })
    expect(eventDelta('legends', { area: 2 }).xp).toBe(XP.legends + 2 * LEGENDS_AREA_XP)
    expect(eventDelta('legends', { area: 99 }).xp).toBe(XP.legends + LEGENDS_AREA_CAP * LEGENDS_AREA_XP)
  })
  it('pays for whole levels gained, capped', () => {
    expect(eventDelta('levelUp', { n: 1 })).toEqual({ levelUps: 1, xp: XP.levelUp })
    expect(eventDelta('levelUp', { n: 40 }).levelUps).toBe(LEVEL_UP_CAP)
  })
  it('a beaten boss earns a streak freeze, still capped', () => {
    const used = player({ '2026-09-20': 10, '2026-09-22': 10 }) // the 21st spent the starting freeze
    expect(computeStreak(used, '2026-09-22').freezes).toBe(0)
    const boss = player({ '2026-09-20': 10, '2026-09-22': { xp: 60, bossWins: 1 } })
    expect(computeStreak(boss, '2026-09-22').freezes).toBe(1)
    const many = player({ '2026-09-22': { xp: 150, bossWins: 3 } })
    expect(computeStreak(many, '2026-09-22').freezes).toBe(MAX_FREEZES)
    expect(eventDelta('bossWin')).toEqual({ bossWins: 1, xp: XP.bossWin })
  })
})

describe('failed Legends tries pay a little, capped per day', () => {
  it('pays legendsTry XP until the daily cap, then nothing (still counted as practice)', async () => {
    const { eventDelta, LEGENDS_TRY_XP_CAP, XP } = await import('./engine')
    expect(eventDelta('legendsTry', {}, { legendsTries: 0 })).toEqual({ practiced: 1, legendsTries: 1, xp: XP.legendsTry })
    expect(eventDelta('legendsTry', {}, { legendsTries: LEGENDS_TRY_XP_CAP }).xp).toBe(0)
    expect(XP.legendsTry).toBeLessThan(XP.practiceDone)
  })
})

describe('rest weekdays change from the day they are changed', () => {
  it('dropping a weekday keeps the past rest days on it', async () => {
    const { restDaysPatch, isRestDay } = await import('./engine')
    const p0 = { restDays: [6] } // Sundays off
    const p1 = { ...p0, ...restDaysPatch(p0, [], '2026-10-01') }
    expect(isRestDay(p1, '2026-09-27')).toBe(true)  // a past Sunday: still a rest day
    expect(isRestDay(p1, '2026-10-04')).toBe(false) // a coming Sunday: not any more
  })
  it('adding a weekday does not turn past missed days into rest days', async () => {
    const { restDaysPatch, isRestDay } = await import('./engine')
    const p1 = { restDays: [], ...restDaysPatch({ restDays: [] }, [6], '2026-10-01') }
    expect(isRestDay(p1, '2026-09-27')).toBe(false)
    expect(isRestDay(p1, '2026-10-04')).toBe(true)
  })
})

describe('league tier and a later goal change', () => {
  it('judges the first week against the goal recorded then, not today\'s', async () => {
    const { tierFor, weekStart } = await import('./engine')
    const day = (xp) => ({ m1: { xp, goal: 30 } })
    const p = { id: 'p', days: { '2026-06-01': day(80), '2026-06-02': day(80), '2026-06-08': day(100), '2026-06-09': day(100) } }
    const mon = weekStart('2026-06-17')
    expect(tierFor(p, mon, 50)).toBe(tierFor(p, mon, 30))
  })
})
