// THE RAID SIEGE (raid.js): the boss's health is set once and its wounds carry over, the player's hearts carry over,
// each new day gives one heart back and heals the boss 20%, lazily and only forward. Plus the balance it gives
// (SIEGE=1 npx vitest run src/features/legends/siege.test.js prints the table).
import { describe, it, expect } from 'vitest'
import { RAID, RAID_ORDER, RAID_ROSTER, raidBossIndex, dayGap, siegeHp, healPerDay, siegeOf, regenSiege, raidToday, applyRaidAttempt, raidAttemptOutcome, raidAsked, raidMarkAsked, shapeRaid, newRaidState, testRaidState, nextRaidCards, raidMinCards, raidOutOfQuestions, raidRunChoices } from './raid'
import { simulateSiege, seededAnswer } from './abilities/_sim'

const D1 = '2026-10-01'
const plus = (date, n) => new Date(Date.UTC(2026, 9, 1) + (Number(date.slice(8, 10)) - 1 + n) * 86400000).toISOString().slice(0, 10)
// A siege of the first boss with `damage` dealt and `hearts` left, dated `date`.
const besieged = ({ hp = 30, damage = 0, hearts = RAID.lives, date = D1, asked } = {}) => {
  const boss = raidBossIndex(RAID_ORDER[0])
  return { boss, day: { date, hp, damage, attempts: 1, won: false, ...(asked ? { asked } : {}) }, trophies: [], siege: { boss, hp, damage, hearts, date } }
}

describe('siege numbers', () => {
  it('lives in one place', () => {
    expect(RAID).toMatchObject({ lives: 3, heartsPerDay: 1, healPerDay: 0.2, nextBossSameDay: true })
  })
  it('sizes a fresh boss for a typical day, never the backlog', () => {
    expect(siegeHp(0)).toBe(RAID.minHp)
    expect(siegeHp(8)).toBe(Math.floor(8 * RAID.hpPerCard * RAID.siegeHpDays))
    expect(siegeHp(RAID.typicalDay)).toBe(siegeHp(60))
    expect(siegeHp(500)).toBe(siegeHp(RAID.typicalDay))
  })
  it('heals 20% of the health a day, at least 1', () => {
    expect(healPerDay(30)).toBe(6)
    expect(healPerDay(24)).toBe(5) // 4.8 rounded up
    expect(healPerDay(1)).toBe(1)
  })
  it('counts whole calendar days', () => {
    expect(dayGap('2026-10-01', '2026-10-01')).toBe(0)
    expect(dayGap('2026-10-01', '2026-10-04')).toBe(3)
    expect(dayGap('2026-10-31', '2026-11-01')).toBe(1)
    expect(dayGap('2026-12-31', '2027-01-01')).toBe(1)
    expect(dayGap('2026-03-28', '2026-03-30')).toBe(2) // across a clock change: still whole days
    expect(dayGap('2026-10-04', '2026-10-01')).toBe(-3)
    expect(dayGap('d1', 'd2')).toBe(1)
  })
})

describe('the siege carries over', () => {
  it('sets the health once and keeps the wounds and lost hearts across runs and days', () => {
    let s = raidToday(null, D1, 8)
    expect(s.siege).toEqual({ boss: s.boss, hp: siegeHp(8), damage: 0, hearts: 3, date: D1 })
    s = applyRaidAttempt(s, D1, 10, undefined, { livesLost: 2 }).state
    expect(s.siege).toMatchObject({ damage: 10, hearts: 1 })
    // A second run the same day: no heal, no heart back.
    const again = raidToday(s, D1, 40)
    expect(again.siege).toMatchObject({ hp: siegeHp(8), damage: 10, hearts: 1 })
    expect(again.day.attempts).toBe(1)
    // The next day: one heart back, 20% healed, the same health.
    const next = raidToday(s, plus(D1, 1), 40)
    expect(next.siege).toMatchObject({ hp: siegeHp(8), damage: 10 - healPerDay(siegeHp(8)), hearts: 2, date: plus(D1, 1) })
    expect(next.day).toMatchObject({ date: plus(D1, 1), hp: siegeHp(8), damage: 10 - healPerDay(siegeHp(8)), attempts: 0 })
  })
  it('applies every missed day (hearts capped, wounds never below 0)', () => {
    const s = besieged({ hp: 30, damage: 20, hearts: 0 })
    const three = raidToday(s, plus(D1, 3), 5)
    expect(three.siege).toMatchObject({ damage: 20 - 3 * 6, hearts: 3 })
    const ten = raidToday(s, plus(D1, 10), 5)
    expect(ten.siege).toMatchObject({ damage: 0, hearts: 3 })
    expect(raidToday(besieged({ hearts: 1 }), plus(D1, 1), 5).siege.hearts).toBe(2)
  })
  it('is lazy and idempotent: reading twice, or a state already brought forward, never heals twice', () => {
    const s = besieged({ hp: 30, damage: 20, hearts: 1 })
    const day2 = plus(D1, 2)
    const once = raidToday(s, day2, 5)
    expect(raidToday(once, day2, 5)).toEqual(once)
    // Computer A fights on day 2 and writes; computer B reads that on day 2: no second heal.
    const a = raidAttemptOutcome(s, { date: day2, damage: 1, due: 5, motif: RAID_ORDER[0] }).state
    expect(a.siege).toMatchObject({ date: day2, damage: 20 - 12 + 1, hearts: 3 })
    expect(raidToday(a, day2, 5).siege).toEqual(a.siege)
    // Only forward: a reader whose clock is a day behind takes the newer state as it is.
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
  it('a fight starts with the hearts left; at 0 no raid until tomorrow', () => {
    const s = applyRaidAttempt(raidToday(null, D1, 10), D1, 3, undefined, { livesLost: 3 }).state
    expect(raidToday(s, D1, 10).siege.hearts).toBe(0)
    expect(raidToday(s, plus(D1, 1), 10).siege.hearts).toBe(RAID.heartsPerDay)
  })
  it('never goes below 0 or above the maximum', () => {
    const s = applyRaidAttempt(besieged({ hearts: 1 }), D1, 0, undefined, { livesLost: 5 }).state
    expect(s.siege.hearts).toBe(0)
    expect(shapeRaid({ ...besieged(), siege: { ...besieged().siege, hearts: 9 } }).siege.hearts).toBe(RAID.lives)
  })
})

describe('beating the boss', () => {
  it('pays once, brings out the next boss the same day with full hearts and a fresh health; overkill does not spill', () => {
    const s = besieged({ hp: 24, damage: 20, hearts: 1 })
    const w = raidAttemptOutcome(s, { date: D1, damage: 40, livesLost: 1, due: 6, motif: RAID_ORDER[0], asked: [11, 12] })
    expect(w).toMatchObject({ won: true, firstWin: true })
    expect(w.state.trophies).toEqual([{ motif: RAID_ORDER[0], date: D1 }])
    expect(RAID_ROSTER[w.state.boss]).toBe(RAID_ORDER[1])
    expect(w.state.siege).toBeNull()
    expect(w.state.day).toMatchObject({ won: true, damage: 24, hp: 24 }) // older builds: today's boss beaten
    const next = raidToday(w.state, D1, 30)
    expect(next.siege).toEqual({ boss: w.state.boss, hp: siegeHp(30), damage: 0, hearts: RAID.lives, date: D1 })
    expect(next.day).toMatchObject({ won: false, attempts: 0, damage: 0 })
    expect(raidAsked(next, D1)).toEqual([11, 12]) // today's answered cards stay answered
    // The next boss takes its own damage; a second win the same day pays again (another boss).
    const w2 = raidAttemptOutcome(w.state, { date: D1, damage: 999, due: 30, motif: RAID_ORDER[1] })
    expect(w2.firstWin).toBe(true)
    expect(w2.state.trophies.map((x) => x.motif)).toEqual([RAID_ORDER[0], RAID_ORDER[1]])
  })
  it('never pays twice for a boss beaten on another computer meanwhile', () => {
    const won = raidAttemptOutcome(besieged({ hp: 10, damage: 9 }), { date: D1, damage: 5, due: 10, motif: RAID_ORDER[0] }).state
    const late = raidAttemptOutcome(won, { date: D1, damage: 50, due: 10, motif: RAID_ORDER[0], asked: [7] })
    expect(late).toMatchObject({ won: false, firstWin: false })
    expect(late.state.trophies).toHaveLength(1)
    expect(late.state.boss).toBe(won.boss)
    expect(raidAsked(late.state, D1)).toContain(7)
  })
  it('with nextBossSameDay off, the day stays beaten', () => {
    const was = RAID.nextBossSameDay
    RAID.nextBossSameDay = false
    try {
      const w = raidAttemptOutcome(besieged({ hp: 10, damage: 9 }), { date: D1, damage: 5, due: 10 }).state
      expect(raidToday(w, D1, 10).day.won).toBe(true)
      expect(raidToday(w, plus(D1, 1), 10).siege).toMatchObject({ damage: 0, hearts: RAID.lives })
    } finally { RAID.nextBossSameDay = was }
  })
})

describe('older builds on a shared folder', () => {
  it('starts the siege from the day record when `siege` is missing (hearts full)', () => {
    const old = { boss: raidBossIndex(RAID_ORDER[0]), day: { date: D1, hp: 15, damage: 6, attempts: 2, won: false }, trophies: [] }
    expect(siegeOf(old)).toEqual({ boss: old.boss, hp: 15, damage: 6, hearts: RAID.lives, date: D1 })
    expect(raidToday(old, D1, 50).siege).toMatchObject({ hp: 15, damage: 6, hearts: 3 })
    // An older day record: the days since are applied as heals.
    expect(raidToday(old, plus(D1, 1), 50).siege).toMatchObject({ hp: 15, damage: 6 - healPerDay(15), hearts: 3 })
  })
  it('an older build that wrote over the siege (dropping it) is picked up from its day; a beaten day starts the next boss fresh', () => {
    const newer = besieged({ hp: 30, damage: 12, hearts: 1 })
    const olderWrote = { boss: newer.boss, day: { ...newer.day, damage: 15, attempts: 2 }, trophies: [] }
    expect(raidToday(olderWrote, D1, 5).siege).toMatchObject({ damage: 15, hearts: 3 })
    const olderWon = { boss: raidBossIndex(RAID_ORDER[1]), day: { ...newer.day, damage: 30, won: true }, trophies: [{ motif: RAID_ORDER[0], date: D1 }] }
    expect(raidToday(olderWon, D1, 8).siege).toMatchObject({ hp: siegeHp(8), damage: 0, hearts: 3 })
  })
  it('a siege stored for another boss index is dropped (never applied to the wrong boss)', () => {
    const s = { ...besieged({ damage: 20 }), siege: { boss: 5, hp: 30, damage: 20, hearts: 0, date: D1 } }
    expect(shapeRaid(s).siege).toBeNull()
    expect(siegeOf(s)).toMatchObject({ damage: 20, hearts: 3 }) // from the day record
  })
})

describe('several runs a day', () => {
  it('each run adds its damage and remembers the notes it answered (the next run takes other due cards)', () => {
    let s = raidToday(null, D1, 30)
    s = raidAttemptOutcome(s, { date: D1, damage: 8, livesLost: 1, due: 30, asked: [1, 2, 3], motif: RAID_ORDER[0] }).state
    s = raidAttemptOutcome(s, { date: D1, damage: 9, livesLost: 1, due: 30, asked: [4, 5], motif: RAID_ORDER[0] }).state
    expect(s.siege).toMatchObject({ damage: 17, hearts: 1 })
    expect(s.day.attempts).toBe(2)
    expect(raidAsked(s, D1)).toEqual([1, 2, 3, 4, 5])
    expect(raidAsked(s, plus(D1, 1))).toEqual([])
    expect(raidAsked(raidMarkAsked(s, D1, [5, 6]), D1)).toEqual([1, 2, 3, 4, 5, 6])
    // A new day starts with nothing answered yet.
    expect(raidToday(s, plus(D1, 1), 30).day.asked).toBeUndefined()
  })
  it('keeps the asked list bounded', () => {
    const many = Array.from({ length: RAID.askedKeep + 50 }, (_, i) => i)
    const s = raidMarkAsked(besieged({ asked: [] }), D1, many)
    expect(raidAsked(s, D1)).toHaveLength(RAID.askedKeep)
  })
})

describe('runs: the next cards, Continue?, and the result choices', () => {
  const infos = [
    { cardId: 1, note: 10, queue: 2, due: 5 }, { cardId: 2, note: 10, queue: 2, due: 6 }, // reversed siblings
    { cardId: 3, note: 11, queue: 1, due: 9 }, { cardId: 4, note: 12, queue: 2, due: 1 }, { cardId: 5, note: 13, queue: 2, due: 3 },
  ]
  it('takes the next due cards in Anki order, one per note, never one answered today or already in the run', () => {
    expect(nextRaidCards(infos).map((c) => c.cardId)).toEqual([3, 4, 5, 1])
    expect(nextRaidCards(infos, { asked: [11] }).map((c) => c.cardId)).toEqual([4, 5, 1])
    expect(nextRaidCards(infos, { asked: ['12'], inRun: [10] }).map((c) => c.cardId)).toEqual([3, 5]) // ids compare as strings
    expect(nextRaidCards(infos, { max: 2 }).map((c) => c.cardId)).toEqual([3, 4])
    // 30 due: two full runs then the rest.
    const many = Array.from({ length: 34 }, (_, i) => ({ cardId: i, note: i, queue: 2, due: i }))
    const run1 = nextRaidCards(many)
    const run2 = nextRaidCards(many, { asked: run1.map((c) => c.note) })
    const run3 = nextRaidCards(many, { asked: [...run1, ...run2].map((c) => c.note) })
    expect([run1.length, run2.length, run3.length]).toEqual([RAID.maxCards, RAID.maxCards, 4])
    expect(new Set([...run1, ...run2, ...run3].map((c) => c.note)).size).toBe(34)
  })
  it('needs a raid of cards only for a fresh boss', () => {
    expect(raidMinCards(false)).toBe(RAID.minCards)
    expect(raidMinCards(true)).toBe(1)
  })
  it('offers Continue only while the boss lives, hearts are left and due cards wait', () => {
    expect(raidOutOfQuestions({ damage: 5, need: 10, livesLost: 1, lives: 3, next: 7 })).toBe('continue')
    expect(raidOutOfQuestions({ damage: 5, need: 10, livesLost: 1, lives: 3, next: 0 })).toBe('empty')
    expect(raidOutOfQuestions({ damage: 10, need: 10, next: 7 })).toBe('over')
    expect(raidOutOfQuestions({ damage: 1, need: 10, livesLost: 2, lives: 2, next: 7 })).toBe('over')
  })
  it('never forces the aftermath: a win offers next boss / Victory lap / Done, a loss leaves the cards due', () => {
    expect(raidRunChoices({ won: true, unasked: 4, dueLeft: 20, hearts: 0 })).toEqual({ nextBoss: true, lap: 4, again: false, stayDue: 0 })
    expect(raidRunChoices({ won: true, unasked: 0, dueLeft: 0 })).toEqual({ nextBoss: false, lap: 0, again: false, stayDue: 0 })
    expect(raidRunChoices({ won: false, unasked: 3, dueLeft: 9, hearts: 1 })).toEqual({ nextBoss: false, lap: 0, again: true, stayDue: 3 })
    expect(raidRunChoices({ won: false, unasked: 3, dueLeft: 9, hearts: 0 }).again).toBe(false)
  })
})

describe('test fights stay out of the siege', () => {
  it('full hearts, a fresh boss, nothing written', () => {
    const t = testRaidState('lich', D1, 30)
    expect(t.siege).toMatchObject({ hp: siegeHp(30), damage: 0, hearts: RAID.lives })
    expect(raidAttemptOutcome(besieged({ hearts: 0 }), { date: D1, damage: 3, livesLost: 2, due: 30, test: 'lich' }).state).toBeNull()
  })
})

// THE BALANCE (seeded learners through the real fight engine and every boss's ability; _sim.js simulateSiege). The
// owner's targets: a big day (30 due) beats a boss within the day when answered well; 8 due a day beats one in about 2
// to 4 days; a 5-card day still makes progress.
describe('siege balance', () => {
  const SEEDS = 30
  const median = (v) => { const x = [...v].sort((a, b) => a - b); return x[Math.floor(x.length / 2)] }
  const run = (opts, right) => Array.from({ length: SEEDS }, (_, i) => simulateSiege({ ...opts, answer: seededAnswer(right, i + 1 + Math.round(right * 1000)) }))
  it('meets the targets', () => {
    const rows = []
    const firstKill = (sims) => sims.map((r) => r.kills[0]?.day ?? 99)
    const cards = (sims) => sims.map((r) => r.kills[0]?.cards ?? 999)
    const big85 = run({ days: 6, perDay: 0, firstDay: 30 }, 0.85)
    const big75 = run({ days: 6, perDay: 0, firstDay: 30 }, 0.75)
    const eight75 = run({ days: 20, perDay: 8 }, 0.75)
    const eight85 = run({ days: 20, perDay: 8 }, 0.85)
    const five75 = run({ days: 20, perDay: 5 }, 0.75)
    rows.push(`30 due once, 85% right: first boss beaten on day ${median(firstKill(big85))} after ${median(cards(big85))} cards`)
    rows.push(`30 due once, 75% right: first boss beaten on day ${median(firstKill(big75))} after ${median(cards(big75))} cards`)
    rows.push(`8 due a day, 75% right: first boss beaten on day ${median(firstKill(eight75))} (${Math.min(...firstKill(eight75))} to ${Math.max(...firstKill(eight75))}), bosses in 20 days ${median(eight75.map((r) => r.kills.length))}`)
    rows.push(`8 due a day, 85% right: first boss beaten on day ${median(firstKill(eight85))}, bosses in 20 days ${median(eight85.map((r) => r.kills.length))}`)
    rows.push(`5 due a day, 75% right: first boss beaten on day ${median(firstKill(five75))}`)
    if (process.env.SIEGE) process.stdout.write(`\n${rows.join('\n')}\n`)
    expect(median(firstKill(big85))).toBe(1) // a big day answered well beats it within the day
    expect(median(cards(big85))).toBeLessThanOrEqual(2 * RAID.maxCards) // about two runs of cards at most
    expect(median(firstKill(big75))).toBeLessThanOrEqual(2)
    expect(median(firstKill(eight75))).toBeGreaterThanOrEqual(2)
    expect(median(firstKill(eight75))).toBeLessThanOrEqual(4)
    expect(median(firstKill(five75))).toBeLessThanOrEqual(5) // a small day still makes progress
    for (const r of five75) expect(r.kills.length).toBeGreaterThan(0)
  })
})
