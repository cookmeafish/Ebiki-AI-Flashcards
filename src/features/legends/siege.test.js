// THE RAID SIEGE (raid.js): each boss's health and hearts come from its profile (raidProfiles.js); wounds carry over
// until it is beaten, lost hearts for the day; each new day the hearts are full again and the boss heals its flat
// `heal`, lazily and only forward. The per-boss balance lives in profiles.test.js.
import { describe, it, expect } from 'vitest'
import { RAID, RAID_ORDER, RAID_ROSTER, raidBossIndex, dayGap, bossHp, bossHearts, bossHeal, raidRunSize, siegeOf, regenSiege, raidToday, applyRaidAttempt, raidAttemptOutcome, raidAsked, raidMarkAsked, shapeRaid, testRaidState, nextRaidCards, raidMinCards, raidOutOfQuestions, raidRunChoices } from './raid'
import { raidProfile, MAX_HEARTS } from './raidProfiles'

const D1 = '2026-10-01'
const plus = (date, n) => new Date(Date.UTC(2026, 9, 1) + (Number(date.slice(8, 10)) - 1 + n) * 86400000).toISOString().slice(0, 10)
const FIRST = raidBossIndex(RAID_ORDER[0])
const P1 = raidProfile(RAID_ORDER[0])
// A siege of the first boss with `damage` dealt and `hearts` left, dated `date`.
const besieged = ({ hp = P1.hp, damage = 0, hearts = P1.hearts, date = D1, asked } = {}) => ({ boss: FIRST, day: { date, hp, damage, attempts: 1, won: false, ...(asked ? { asked } : {}) }, trophies: [], siege: { boss: FIRST, hp, damage, hearts, date } })

describe('siege numbers', () => {
  it('come from the boss profile, never from the cards due', () => {
    expect(bossHp(FIRST)).toBe(P1.hp)
    expect(bossHearts(FIRST)).toBe(P1.hearts)
    expect(bossHeal(FIRST)).toBe(P1.heal)
    expect(raidToday(null, D1, 3).siege.hp).toBe(raidToday(null, D1, 300).siege.hp)
  })
  it('run size is a setting with fixed choices', () => {
    expect(raidRunSize(undefined)).toBe(RAID.runSize)
    expect(raidRunSize(5)).toBe(5)
    expect(raidRunSize('30')).toBe(30)
    expect(raidRunSize(7)).toBe(RAID.runSize)
  })
  it('counts whole calendar days', () => {
    expect(dayGap('2026-10-01', '2026-10-01')).toBe(0)
    expect(dayGap('2026-10-01', '2026-10-04')).toBe(3)
    expect(dayGap('2026-10-31', '2026-11-01')).toBe(1)
    expect(dayGap('2026-12-31', '2027-01-01')).toBe(1)
    expect(dayGap('2026-03-28', '2026-03-30')).toBe(2)
    expect(dayGap('2026-10-04', '2026-10-01')).toBe(-3)
    expect(dayGap('d1', 'd2')).toBe(1)
  })
})

describe('the siege carries over', () => {
  it('sets the health once and keeps the wounds and lost hearts across runs; a new day refills the hearts', () => {
    let s = raidToday(null, D1, 8)
    expect(s.siege).toEqual({ boss: s.boss, hp: P1.hp, damage: 0, hearts: P1.hearts, date: D1 })
    s = applyRaidAttempt(s, D1, 10, undefined, { livesLost: 2 }).state
    expect(s.siege).toMatchObject({ damage: 10, hearts: P1.hearts - 2 })
    // A second run the same day: no heal, no heart back.
    const again = raidToday(s, D1, 40)
    expect(again.siege).toMatchObject({ hp: P1.hp, damage: 10, hearts: P1.hearts - 2 })
    // The next day: full hearts, the boss's flat heal.
    const next = raidToday(s, plus(D1, 1), 40)
    expect(next.siege).toMatchObject({ hp: P1.hp, damage: 10 - P1.heal, hearts: P1.hearts, date: plus(D1, 1) })
    expect(next.day).toMatchObject({ date: plus(D1, 1), hp: P1.hp, damage: 10 - P1.heal, attempts: 0 })
  })
  it('applies every missed day (wounds never below 0)', () => {
    const s = besieged({ damage: 20, hearts: 0 })
    expect(raidToday(s, plus(D1, 3), 5).siege).toMatchObject({ damage: 20 - 3 * P1.heal, hearts: P1.hearts })
    expect(raidToday(s, plus(D1, 30), 5).siege).toMatchObject({ damage: 0, hearts: P1.hearts })
  })
  it('a Bandage skips the first night\'s heal only', () => {
    const s = { ...besieged({ damage: 20 }), siege: { ...besieged({ damage: 20 }).siege, bandage: D1 } }
    expect(raidToday(s, plus(D1, 1), 5).siege).toMatchObject({ damage: 20 })
    expect(raidToday(s, plus(D1, 1), 5).siege.bandage).toBeUndefined()
    expect(raidToday(s, plus(D1, 2), 5).siege).toMatchObject({ damage: 20 - P1.heal })
    // A bandage from an earlier day does nothing.
    const old = { ...besieged({ damage: 20, date: plus(D1, 1) }), siege: { ...besieged({ damage: 20, date: plus(D1, 1) }).siege, bandage: D1 } }
    expect(raidToday(old, plus(D1, 2), 5).siege).toMatchObject({ damage: 20 - P1.heal })
  })
  it('is lazy and idempotent: reading twice, or a state already brought forward, never heals twice', () => {
    const s = besieged({ damage: 20, hearts: 1 })
    const day2 = plus(D1, 2)
    const once = raidToday(s, day2, 5)
    expect(raidToday(once, day2, 5)).toEqual(once)
    const a = raidAttemptOutcome(s, { date: day2, damage: 1, due: 5, motif: RAID_ORDER[0] }).state
    expect(a.siege).toMatchObject({ date: day2, damage: 20 - 2 * P1.heal + 1, hearts: P1.hearts })
    expect(raidToday(a, day2, 5).siege).toEqual(a.siege)
    expect(regenSiege(a.siege, D1)).toBe(a.siege)
    expect(raidToday(a, D1, 5).siege).toEqual(a.siege)
  })
  it('keeps day.hp and day.damage in step with the siege (older builds read only the day)', () => {
    let s = raidToday(null, D1, 10)
    for (const [date, dmg] of [[D1, 4], [D1, 3], [plus(D1, 1), 2]]) {
      s = raidAttemptOutcome(s, { date, damage: dmg, livesLost: 1, due: 10, motif: RAID_ORDER[0] }).state
      expect([s.day.hp, s.day.damage]).toEqual([s.siege.hp, s.siege.damage])
      expect(s.day.date).toBe(s.siege.date)
    }
  })
})

describe('hearts', () => {
  it('a fight starts with the hearts left; at 0 no raid until tomorrow, then full', () => {
    const s = applyRaidAttempt(raidToday(null, D1, 10), D1, 3, undefined, { livesLost: P1.hearts }).state
    expect(raidToday(s, D1, 10).siege.hearts).toBe(0)
    expect(raidToday(s, plus(D1, 1), 10).siege.hearts).toBe(P1.hearts)
  })
  it('never goes below 0 or above the most any boss gives', () => {
    expect(applyRaidAttempt(besieged({ hearts: 1 }), D1, 0, undefined, { livesLost: 5 }).state.siege.hearts).toBe(0)
    expect(shapeRaid({ ...besieged(), siege: { ...besieged().siege, hearts: 99 } }).siege.hearts).toBe(MAX_HEARTS)
  })
})

describe('beating the boss', () => {
  it('pays once, brings out the next boss the same day with its own health and hearts; overkill does not spill', () => {
    const s = besieged({ damage: P1.hp - 4, hearts: 1 })
    const w = raidAttemptOutcome(s, { date: D1, damage: 40, livesLost: 1, due: 6, motif: RAID_ORDER[0], asked: [11, 12] })
    expect(w).toMatchObject({ won: true, firstWin: true })
    expect(w.state.trophies).toEqual([{ motif: RAID_ORDER[0], date: D1 }])
    expect(RAID_ROSTER[w.state.boss]).toBe(RAID_ORDER[1])
    expect(w.state.siege).toBeNull()
    expect(w.state.day).toMatchObject({ won: true, damage: P1.hp, hp: P1.hp })
    const P2 = raidProfile(RAID_ORDER[1])
    const next = raidToday(w.state, D1, 30)
    expect(next.siege).toEqual({ boss: w.state.boss, hp: P2.hp, damage: 0, hearts: P2.hearts, date: D1 })
    expect(next.day).toMatchObject({ won: false, attempts: 0, damage: 0 })
    expect(raidAsked(next, D1)).toEqual([11, 12])
    const w2 = raidAttemptOutcome(w.state, { date: D1, damage: 999, due: 30, motif: RAID_ORDER[1] })
    expect(w2.firstWin).toBe(true)
    expect(w2.state.trophies.map((x) => x.motif)).toEqual([RAID_ORDER[0], RAID_ORDER[1]])
  })
  it('keeps the power bag across a win', () => {
    const s = { ...besieged({ damage: P1.hp - 1 }), powers: { shield: 2 } }
    const w = raidAttemptOutcome(s, { date: D1, damage: 5, due: 6, motif: RAID_ORDER[0] })
    expect(shapeRaid(w.state).powers).toEqual({ shield: 2 })
  })
  it('never pays twice for a boss beaten on another computer meanwhile', () => {
    const won = raidAttemptOutcome(besieged({ damage: P1.hp - 1 }), { date: D1, damage: 5, due: 10, motif: RAID_ORDER[0] }).state
    const late = raidAttemptOutcome(won, { date: D1, damage: 50, due: 10, motif: RAID_ORDER[0], asked: [7] })
    expect(late).toMatchObject({ won: false, firstWin: false })
    expect(late.state.trophies).toHaveLength(1)
    expect(raidAsked(late.state, D1)).toContain(7)
  })
  it('with nextBossSameDay off, the day stays beaten', () => {
    const was = RAID.nextBossSameDay
    RAID.nextBossSameDay = false
    try {
      const w = raidAttemptOutcome(besieged({ damage: P1.hp - 1 }), { date: D1, damage: 5, due: 10 }).state
      expect(raidToday(w, D1, 10).day.won).toBe(true)
      expect(raidToday(w, plus(D1, 1), 10).siege).toMatchObject({ damage: 0, hearts: raidProfile(RAID_ORDER[1]).hearts })
    } finally { RAID.nextBossSameDay = was }
  })
})

describe('older builds on a shared folder', () => {
  it('starts the siege from the day record when `siege` is missing (the boss\'s hearts)', () => {
    const old = { boss: FIRST, day: { date: D1, hp: 15, damage: 6, attempts: 2, won: false }, trophies: [] }
    expect(siegeOf(old)).toEqual({ boss: FIRST, hp: 15, damage: 6, hearts: P1.hearts, date: D1 })
    expect(raidToday(old, D1, 50).siege).toMatchObject({ hp: 15, damage: 6, hearts: P1.hearts })
    expect(raidToday(old, plus(D1, 1), 50).siege).toMatchObject({ hp: 15, damage: 6 - P1.heal, hearts: P1.hearts })
  })
  it('a siege an older build sized from the due cards keeps its health until beaten', () => {
    const s = besieged({ hp: 21, damage: 5 })
    expect(raidToday(s, plus(D1, 1), 99).siege.hp).toBe(21)
  })
  it('a siege stored for another boss index is dropped (never applied to the wrong boss)', () => {
    const s = { ...besieged({ damage: 20 }), siege: { boss: 5, hp: 30, damage: 20, hearts: 0, date: D1 } }
    expect(shapeRaid(s).siege).toBeNull()
    expect(siegeOf(s)).toMatchObject({ damage: 20, hearts: P1.hearts })
  })
})

describe('several runs a day', () => {
  it('each run adds its damage and remembers the notes it answered', () => {
    let s = raidToday(null, D1, 30)
    s = raidAttemptOutcome(s, { date: D1, damage: 8, livesLost: 1, due: 30, asked: [1, 2, 3], motif: RAID_ORDER[0] }).state
    s = raidAttemptOutcome(s, { date: D1, damage: 9, livesLost: 1, due: 30, asked: [4, 5], motif: RAID_ORDER[0] }).state
    expect(s.siege).toMatchObject({ damage: 17, hearts: P1.hearts - 2 })
    expect(s.day.attempts).toBe(2)
    expect(raidAsked(s, D1)).toEqual([1, 2, 3, 4, 5])
    expect(raidAsked(raidMarkAsked(s, D1, [5, 6]), D1)).toEqual([1, 2, 3, 4, 5, 6])
    expect(raidToday(s, plus(D1, 1), 30).day.asked).toBeUndefined()
  })
  it('keeps the asked list bounded', () => {
    const many = Array.from({ length: RAID.askedKeep + 50 }, (_, i) => i)
    expect(raidAsked(raidMarkAsked(besieged({ asked: [] }), D1, many), D1)).toHaveLength(RAID.askedKeep)
  })
})

describe('runs: the next cards, Continue?, and the result choices', () => {
  const infos = [
    { cardId: 1, note: 10, queue: 2, due: 5 }, { cardId: 2, note: 10, queue: 2, due: 6 },
    { cardId: 3, note: 11, queue: 1, due: 9 }, { cardId: 4, note: 12, queue: 2, due: 1 }, { cardId: 5, note: 13, queue: 2, due: 3 },
  ]
  it('takes the next due cards in Anki order, one per note, never one answered today or already in the run', () => {
    expect(nextRaidCards(infos).map((c) => c.cardId)).toEqual([3, 4, 5, 1])
    expect(nextRaidCards(infos, { asked: [11] }).map((c) => c.cardId)).toEqual([4, 5, 1])
    expect(nextRaidCards(infos, { asked: ['12'], inRun: [10] }).map((c) => c.cardId)).toEqual([3, 5])
    expect(nextRaidCards(infos, { max: 2 }).map((c) => c.cardId)).toEqual([3, 4])
    const many = Array.from({ length: 34 }, (_, i) => ({ cardId: i, note: i, queue: 2, due: i }))
    const run1 = nextRaidCards(many, { max: 10 })
    const run2 = nextRaidCards(many, { asked: run1.map((c) => c.note), max: 10 })
    expect([run1.length, run2.length]).toEqual([10, 10])
  })
  it('any number of cards can fight (the health is the boss\'s own)', () => {
    expect(raidMinCards()).toBe(1)
  })
  it('offers Continue only while the boss lives, hearts are left and due cards wait', () => {
    expect(raidOutOfQuestions({ damage: 5, need: 10, livesLost: 1, lives: 3, next: 7 })).toBe('continue')
    expect(raidOutOfQuestions({ damage: 5, need: 10, livesLost: 1, lives: 3, next: 0 })).toBe('empty')
    expect(raidOutOfQuestions({ damage: 10, need: 10, next: 7 })).toBe('over')
    expect(raidOutOfQuestions({ damage: 1, need: 10, livesLost: 2, lives: 2, next: 7 })).toBe('over')
  })
  it('never forces the aftermath: a win offers next boss / Victory lap / Done, a loss leaves the cards due', () => {
    expect(raidRunChoices({ won: true, unasked: 4, dueLeft: 20, hearts: 0 })).toEqual({ nextBoss: true, lap: 4, again: false, stayDue: 0 })
    expect(raidRunChoices({ won: false, unasked: 3, dueLeft: 9, hearts: 1 })).toEqual({ nextBoss: false, lap: 0, again: true, stayDue: 3 })
  })
})

describe('test fights stay out of the siege', () => {
  it('full hearts, a fresh boss of its profile, nothing written', () => {
    const t = testRaidState('lich', D1, 30)
    expect(t.siege).toMatchObject({ hp: raidProfile('lich').hp, damage: 0, hearts: raidProfile('lich').hearts })
    expect(raidAttemptOutcome(besieged({ hearts: 0 }), { date: D1, damage: 3, livesLost: 2, due: 30, test: 'lich' }).state).toBeNull()
  })
})
