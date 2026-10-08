// Date and time edge cases across the app's day-keyed logic, run under several time zones (Node honors a
// process.env.TZ change at runtime): DST spring-forward / fall-back days (incl. Lord Howe's 30-minute shift and
// zones whose DST switches AT midnight), half-hour and 45-minute offsets, year boundaries, leap days, Monday-first
// weeks, a clock moved backwards, and two computers in different zones sharing one player file.
import { describe, it, expect, afterAll } from 'vitest'
import { dateKey, addDays, daysBetween, weekStart, weekdayOf, computeStreak, weekRow, mergePlayers, dayTotals, leagueBoard, tierFor } from '../features/game/engine.js'
import { localDay, studyStreak, chartDays, todayNumbers, ankiDayOf } from './studyStats.js'
import { journeyCells } from '../features/legends/map.js'
import { todayKey, dayGap, regenSiege } from '../features/legends/raid.js'
import { rankFresh, recentTopics, logPractice } from '../features/kit/practiceLog.js'
import { isAbandoned, STUDY_SESSION_MAX_AGE_MS } from './studySession.js'
import { addSet, markAsked, pickSavedSet } from './questionBank.js'

const ZONES = ['UTC', 'America/New_York', 'Europe/London', 'Australia/Lord_Howe', 'Pacific/Chatham', 'Asia/Kolkata',
  'America/Santiago', 'America/Asuncion', 'Africa/Cairo', 'Asia/Tehran', 'America/Havana', 'Pacific/Kiritimati', 'Pacific/Pago_Pago']
const ORIGINAL_TZ = process.env.TZ
afterAll(() => { if (ORIGINAL_TZ === undefined) delete process.env.TZ; else process.env.TZ = ORIGINAL_TZ })
const inZone = (tz, fn) => { process.env.TZ = tz; try { fn() } finally { process.env.TZ = 'UTC' } }
const KEY_RE = /^\d{4}-\d{2}-\d{2}$/
// Every calendar day from a..b as a key, built with UTC arithmetic (zone-free ground truth).
const utcKeys = (a, b) => {
  const out = []
  for (let t = Date.UTC(...a); t <= Date.UTC(...b); t += 86400000) out.push(new Date(t).toISOString().slice(0, 10))
  return out
}
const DAYS = utcKeys([2023, 11, 25], [2026, 0, 10]) // two DST cycles, a year boundary, the 2024 leap day

describe.each(ZONES)('day keys in %s', (tz) => {
  it('addDays / daysBetween / weekStart walk every calendar day exactly once', () => inZone(tz, () => {
    for (let i = 1; i < DAYS.length; i++) {
      expect(addDays(DAYS[i - 1], 1)).toBe(DAYS[i])
      expect(addDays(DAYS[i], -1)).toBe(DAYS[i - 1])
      expect(daysBetween(DAYS[i - 1], DAYS[i])).toBe(1)
      expect(dayGap(DAYS[i - 1], DAYS[i])).toBe(1)
    }
    expect(daysBetween(DAYS[0], DAYS[DAYS.length - 1])).toBe(DAYS.length - 1)
    for (const k of DAYS) {
      const mon = weekStart(k)
      expect(weekdayOf(mon)).toBe(0)
      expect(daysBetween(mon, k)).toBe(weekdayOf(k))
      expect(weekdayOf(k)).toBe((new Date(k + 'T00:00:00Z').getUTCDay() + 6) % 7)
    }
  }))

  it('every clock hour of a day maps to that day in all key helpers', () => inZone(tz, () => {
    for (const k of DAYS.filter((_, i) => i % 3 === 0 || ['2024-03-10', '2024-11-03', '2024-03-31', '2024-10-27', '2024-04-07', '2024-10-06', '2024-09-08', '2024-04-06', '2024-02-29', '2024-12-31', '2025-01-01'].includes(_))) {
      const [y, m, d] = k.split('-').map(Number)
      for (let h = 0; h < 24; h++) for (const min of [0, 30, 59]) {
        const at = new Date(y, m - 1, d, h, min)
        if (at.getDate() !== d) continue // a wall time that does not exist on this day (DST gap at midnight)
        expect(dateKey(at)).toBe(k)
        expect(localDay(at)).toBe(k)
        expect(todayKey(at)).toBe(k)
      }
    }
  }))

  it('the Stats chart has 14 distinct consecutive days ending today, at any hour', () => inZone(tz, () => {
    for (const k of DAYS.filter((_, i) => i % 5 === 0)) {
      const [y, m, d] = k.split('-').map(Number)
      for (const h of [0, 1, 2, 3, 12, 23]) {
        const now = new Date(y, m - 1, d, h, 30)
        if (now.getDate() !== d) continue
        const days = chartDays(null, [], now).map((x) => x.date)
        expect(days[13]).toBe(k)
        for (let i = 1; i < 14; i++) expect(addDays(days[i - 1], 1)).toBe(days[i])
      }
    }
  }))

  it('a study streak counts each studied day once across DST', () => inZone(tz, () => {
    const byDay = Object.fromEntries(DAYS.slice(-400).map((k) => [k, 3]))
    const last = DAYS[DAYS.length - 1]
    const [y, m, d] = last.split('-').map(Number)
    for (const h of [0, 3, 12, 23]) expect(studyStreak({ byDay }, [], new Date(y, m - 1, d, h, 59))).toBe(400)
  }))

  it('the Legends journey has whole Monday-first weeks ending this week, today never in the future', () => inZone(tz, () => {
    for (const k of DAYS) {
      const [y, m, d] = k.split('-').map(Number)
      for (const h of [0, 1, 23]) {
        const now = new Date(y, m - 1, d, h, 45)
        if (now.getDate() !== d) continue
        const cells = journeyCells(now, { [k]: 2 })
        expect(weekdayOf(cells[0].key)).toBe(0)
        for (let i = 1; i < cells.length; i++) expect(addDays(cells[i - 1].key, 1)).toBe(cells[i].key)
        const today = cells.find((c) => c.key === k)
        expect(today && !today.future && today.n === 2).toBe(true)
        expect(cells.filter((c) => !c.future).at(-1).key).toBe(k)
      }
    }
  }), 60000)

  it("Anki's day (4am rollover) follows the wall clock, also on DST days", () => inZone(tz, () => {
    for (const k of DAYS) {
      const [y, m, d] = k.split('-').map(Number)
      for (const [h, min] of [[0, 30], [3, 59], [4, 0], [4, 30], [5, 0], [12, 0], [23, 59]]) {
        const now = new Date(y, m - 1, d, h, min)
        if (now.getDate() !== d || now.getHours() !== h) continue // a wall time this day skipped
        expect(ankiDayOf(now)).toBe(h < 4 ? addDays(k, -1) : k)
      }
    }
  }))

  it('a streak survives a whole year of daily play through DST and the year boundary', () => inZone(tz, () => {
    const days = {}
    for (const k of utcKeys([2024, 0, 1], [2025, 0, 1])) days[k] = { m1: { xp: 10 } }
    const s = computeStreak({ days }, '2025-01-01')
    expect(s.streak).toBe(367)
    expect(s.frozen).toEqual([])
    const row = weekRow({ days }, '2025-01-01')
    expect(row.map((r) => r.date)).toEqual(['2024-12-30', '2024-12-31', '2025-01-01', '2025-01-02', '2025-01-03', '2025-01-04', '2025-01-05'])
    expect(row.map((r) => r.status)).toEqual(['done', 'done', 'done', 'future', 'future', 'future', 'future'])
  }))
})

describe('two computers in different time zones on one player file', () => {
  it('merging keeps each machine its own counters per day and never sums twice', () => {
    // Kolkata is already on the 2nd while New York is still on the 1st: each files XP under its own local day.
    const ny = { id: 'p', days: { '2025-01-01': { ny: { xp: 30, cards: 2 } } } }
    const in1 = { id: 'p', days: { '2025-01-02': { in: { xp: 20, cards: 1 } } } }
    const m = mergePlayers(ny, in1)
    const again = mergePlayers(mergePlayers(m, ny), in1)
    for (const k of ['2025-01-01', '2025-01-02']) expect(dayTotals(again, k)).toEqual(dayTotals(m, k))
    expect(dayTotals(m, '2025-01-01').xp).toBe(30)
    expect(dayTotals(m, '2025-01-02').xp).toBe(20)
    // New York still on the 1st: Kolkata's "tomorrow" is not counted yet, and today keeps the streak.
    expect(computeStreak(m, '2025-01-01')).toMatchObject({ streak: 1, todayDone: true })
    expect(computeStreak(m, '2025-01-02')).toMatchObject({ streak: 2, frozen: [] })
  })

  it('a day written by a clock that ran ahead does not count before its day and breaks nothing', () => {
    const p = { days: { '2025-03-01': { a: { xp: 10 } }, '2025-03-02': { a: { xp: 10 } }, '2030-01-01': { b: { xp: 99 } } } }
    expect(computeStreak(p, '2025-03-02')).toMatchObject({ streak: 2, longest: 2 })
    const b = leagueBoard(p, [], '2025-03-02')
    expect(b.rows[0].xp).toBe(20) // Mon Feb 24 .. Sun Mar 2; the 2030 day is not this week
    expect(tierFor(p, weekStart('2025-03-02'))).toBeGreaterThanOrEqual(0)
  })
})

describe('raid siege days', () => {
  const siege = { boss: 0, hp: 30, damage: 20, hearts: 1, date: '2024-03-09' }
  it('heals once per calendar day across DST, leap day and year end, and is idempotent', () => {
    for (const tz of ZONES) inZone(tz, () => {
      const one = regenSiege(siege, '2024-03-10')
      const two = regenSiege(one, '2024-03-11')
      expect(regenSiege(siege, '2024-03-11')).toEqual(two)
      expect(regenSiege(two, '2024-03-11')).toBe(two)
      expect(dayGap('2024-02-28', '2024-03-01')).toBe(2)
      expect(dayGap('2024-12-31', '2025-01-01')).toBe(1)
    })
  })
  it('a siege dated later (another computer ahead, or a clock moved back) is never healed backwards', () => {
    expect(regenSiege(siege, '2024-03-08')).toBe(siege)
  })
})

describe('a clock that jumped ahead and came back', () => {
  const DAY = 86400000
  const now = Date.UTC(2025, 5, 1)
  it('practice log: a timestamp far in the future does not keep a card "just practiced" for good', () => {
    const log = logPractice({ items: [] }, [{ kind: 'card', label: 'perro' }], now + 365 * DAY)
    expect(rankFresh([{ front: 'gato' }, { front: 'perro' }], log, { now, strict: true }).map((x) => x.front)).toEqual(['gato', 'perro'])
    // A small skew (another computer a few minutes ahead) still counts as just practiced.
    const near = logPractice({ items: [] }, [{ kind: 'card', label: 'perro' }], now + 5 * 60000)
    expect(rankFresh([{ front: 'perro' }, { front: 'gato' }], near, { now, strict: true }).map((x) => x.front)).toEqual(['gato'])
  })
  it('practice log: a far-future topic is not "recent" for good', () => {
    const log = logPractice({ items: [] }, [{ kind: 'topic', label: 'at the bank' }], now + 365 * DAY)
    expect(recentTopics(log, { now })).toEqual([])
    const near = logPractice({ items: [] }, [{ kind: 'topic', label: 'at the bank' }], now + 60000)
    expect(recentTopics(near, { now })).toEqual(['at the bank'])
  })
  it('study session: progress stamped far in the future is stale, a little skew is not', () => {
    expect(isAbandoned({ activeAt: now + 30 * DAY }, now)).toBe(true)
    expect(isAbandoned({ activeAt: now + 60000 }, now)).toBe(false)
    expect(isAbandoned({ activeAt: now - STUDY_SESSION_MAX_AGE_MS - 1 }, now)).toBe(true)
  })
  it('question bank: a set stamped by a fast clock still rotates', () => {
    const key = { text: 't', sig: 's' }
    let bank = addSet(null, key, [{ q: 1 }], now + 365 * DAY) // asked under a clock a year ahead
    bank = addSet(bank, key, [{ q: 2 }], now)
    bank = addSet(bank, key, [{ q: 3 }], now + 1)
    const seen = []
    for (let i = 0; i < 6; i++) {
      const set = pickSavedSet(bank, key, 1, 3)
      seen.push(set.questions[0].q)
      bank = markAsked(bank, set.id, now + 10 + i)
    }
    expect(new Set(seen.slice(0, 3)).size).toBe(3)
    expect(seen.slice(3)).toEqual(seen.slice(0, 3))
  })
})
