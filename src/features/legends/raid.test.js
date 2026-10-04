// Raids: health from the cards due, wounds kept for the day, a trophy and the next boss on a win, Anki's order.
// Plus the raid art: one file per raid boss, plain drawing, three phases.
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { RAID, siegeHp, healPerDay, RAID_MOTIFS, RAID_ROSTER, RAID_RETIRED, RAID_ORDER, raidBossNumber, raidBossIndex, nextBossIndex, raidMotif, isRaidMotif, raidHp, raidToday, applyRaidAttempt, raidOrder, shapeRaid, newRaidState, testRaidState, raidAttemptOutcome, raidHelpText, raidReviews } from './raid'
import { artUrl, REALISTIC_ART } from './art'

describe('raid rules', () => {
  it('scales the boss with the cards due, within bounds', () => {
    expect(raidHp(0)).toBe(RAID.minHp)
    expect(raidHp(10)).toBe(15)
    expect(raidHp(1000)).toBe(RAID.maxHp)
  })
  it('rounds health DOWN with a floor of 7, so a small raid answered right by choices then typed can always win', () => {
    expect(RAID.minHp).toBe(7)
    expect(raidHp(5)).toBe(7) // 7.5 floored
    expect(raidHp(7)).toBe(10) // 10.5 floored (round made it 11)
    expect(raidHp(4)).toBe(RAID.minHp)
    // 5 cards, all right: choices while phase 1 allows them (1 + 1 + 1), then typed clean (2 + 2) = 7.
    expect(1 + 1 + 1 + 2 + 2).toBeGreaterThanOrEqual(raidHp(5))
  })
  it('keeps the wounds across the day and heals only 20% overnight (the siege)', () => {
    let s = raidToday(newRaidState(), '2026-09-29', 10)
    const hp = s.day.hp
    expect(hp).toBe(siegeHp(10))
    s = applyRaidAttempt(s, '2026-09-29', 6).state
    expect(s.day.damage).toBe(6)
    expect(raidToday(s, '2026-09-29', 3).day.damage).toBe(6) // the same day: still wounded, same health
    expect(raidToday(s, '2026-09-29', 3).day.hp).toBe(hp)
    expect(raidToday(s, '2026-09-30', 50).day.hp).toBe(hp) // the health was set once: today's due cards do not change it
    expect(raidToday(s, '2026-09-30', 10).day.damage).toBe(6 - healPerDay(hp))
  })
  it('gives a trophy once and brings out the next boss', () => {
    let s = raidToday(newRaidState(), '2026-09-29', 6)
    const r1 = applyRaidAttempt(s, '2026-09-29', 5)
    expect(r1.won).toBe(false)
    const r2 = applyRaidAttempt(r1.state, '2026-09-29', 100)
    expect(r2.firstWin).toBe(true)
    expect(r2.state.trophies).toEqual([{ motif: RAID_MOTIFS[0], date: '2026-09-29' }])
    expect(RAID_ROSTER[r2.state.boss]).toBe(RAID_ORDER[1])
    expect(applyRaidAttempt(r2.state, '2026-09-29', 5).firstWin).toBe(false)
  })
  it('ignores an attempt for another day and survives damaged data', () => {
    const s = raidToday(newRaidState(), '2026-09-29', 6)
    expect(applyRaidAttempt(s, '2026-09-28', 99).state.day.damage).toBe(0)
    expect(shapeRaid({ boss: 99, trophies: [{ motif: 'nope' }] })).toEqual({ boss: 99 % RAID_ROSTER.length, day: null, trophies: [], siege: null })
  })
  it("a stored retired boss (today's or tomorrow's) moves on to the next active boss, keeping today's wounds", () => {
    expect(RAID_RETIRED).toContain('glutton')
    expect(RAID_MOTIFS).not.toContain('glutton')
    const gi = RAID_ROSTER.indexOf('glutton') // the index older builds stored
    const old = { boss: gi, day: { date: '2026-10-01', hp: 20, damage: 8, attempts: 2, won: false, ab: { bloat: 4 } }, trophies: [] }
    const s = shapeRaid(old)
    expect(RAID_ROSTER[s.boss]).toBe(RAID_ROSTER[gi + 1])
    expect(raidMotif(old)).toBe('puppeteer')
    expect(isRaidMotif(raidMotif(old))).toBe(true)
    expect(s.day).toEqual({ date: '2026-10-01', hp: 20, damage: 8, attempts: 2, won: false }) // the old ability's state is dropped
    // Active bosses keep their stored index (older builds on a shared folder read the same one).
    expect(shapeRaid({ boss: gi + 1 }).boss).toBe(gi + 1)
    expect(shapeRaid({ boss: RAID_ROSTER.length - 1 }).boss).toBe(RAID_ROSTER.length - 1)
    // A win follows RAID_ORDER, never the roster (and never lands on the retired boss).
    const before = raidToday({ boss: gi - 1, day: null, trophies: [] }, '2026-10-01', 6)
    const won = applyRaidAttempt(before, '2026-10-01', 100)
    expect(won.firstWin).toBe(true)
    expect(RAID_ROSTER[won.state.boss]).toBe(RAID_ORDER[(RAID_ORDER.indexOf(RAID_ROSTER[gi - 1]) + 1) % RAID_ORDER.length])
    // The rotation never lands on a retired boss and wraps to the start.
    let st = newRaidState()
    for (let i = 0; i < RAID_ROSTER.length * 2; i++) {
      expect(RAID_RETIRED).not.toContain(raidMotif(st))
      st = applyRaidAttempt(raidToday(st, `d${i}`, 6), `d${i}`, 100).state
    }
  })
  it('keeps an old trophy of a retired boss (the count stays honest) and the hall can tell it apart', () => {
    const trophies = [{ motif: 'hydra', date: '2026-09-01' }, { motif: 'glutton', date: '2026-09-02' }, { motif: 'titan', date: '2026-09-03' }]
    const s = shapeRaid({ boss: 0, trophies })
    expect(s.trophies).toEqual(trophies)
    expect(s.trophies.filter((x) => !isRaidMotif(x.motif)).map((x) => x.motif)).toEqual(['glutton'])
    // A new win keeps the old trophy.
    const won = applyRaidAttempt(raidToday(s, '2026-10-01', 6), '2026-10-01', 100)
    expect(won.state.trophies.length).toBe(4)
    expect(won.state.trophies[1]).toEqual({ motif: 'glutton', date: '2026-09-02' })
    // Junk is still dropped.
    expect(shapeRaid({ trophies: [{ motif: '../x', date: 'd' }, { motif: 'hydra' }, null] }).trophies).toEqual([])
  })
  it('orders cards like Anki: learning first, then reviews by due day', () => {
    const cards = [{ cardId: 1, queue: 2, due: 30 }, { cardId: 2, queue: 1, due: 5 }, { cardId: 3, queue: 2, due: 10 }, { cardId: 4, queue: 3, due: 1 }]
    expect(raidOrder(cards).map((c) => c.cardId)).toEqual([4, 2, 3, 1])
  })
})

describe('raid progression (RAID_ORDER)', () => {
  it('holds every active boss once, no retired one, and RAID_MOTIFS follows it', () => {
    expect(new Set(RAID_ORDER).size).toBe(RAID_ORDER.length)
    expect([...RAID_ORDER].sort()).toEqual(RAID_ROSTER.filter((m) => !RAID_RETIRED.includes(m)).sort())
    for (const m of RAID_RETIRED) expect(RAID_ORDER).not.toContain(m)
    expect(RAID_MOTIFS).toEqual(RAID_ORDER)
    expect(RAID_ORDER.slice(0, 3)).toEqual(['chronos', 'banshee', 'seraph'])
    expect(RAID_ORDER[RAID_ORDER.length - 1]).toBe('void')
  })
  it('numbers raid bosses from 1 and nothing else', () => {
    expect(raidBossNumber('chronos')).toBe(1)
    expect(raidBossNumber('chimera')).toBe(7)
    expect(raidBossNumber('void')).toBe(RAID_ORDER.length)
    expect(raidBossNumber('glutton')).toBe(0)
    expect(raidBossNumber('forest')).toBe(0)
  })
  it('a new raid starts at the first boss of the order (stored as its roster index)', () => {
    expect(raidMotif(newRaidState())).toBe(RAID_ORDER[0])
    expect(newRaidState().boss).toBe(RAID_ROSTER.indexOf(RAID_ORDER[0]))
    expect(raidMotif(null)).toBe(RAID_ORDER[0])
    expect(raidMotif({ trophies: [] })).toBe(RAID_ORDER[0])
  })
  it('an existing player keeps their boss and continues from its place in the order', () => {
    const hydra = raidBossIndex('hydra')
    expect(hydra).toBe(0) // the old first boss: index 0 stays hydra
    expect(raidMotif({ boss: hydra })).toBe('hydra')
    const won = applyRaidAttempt(raidToday({ boss: hydra, trophies: [] }, 'd', 6), 'd', 100)
    expect(RAID_ROSTER[won.state.boss]).toBe('kaleido') // after hydra in RAID_ORDER
  })
  it('walks the whole order after wins and wraps from the last boss to the first', () => {
    let st = newRaidState()
    const seen = []
    for (let i = 0; i < RAID_ORDER.length + 1; i++) {
      seen.push(raidMotif(st))
      st = applyRaidAttempt(raidToday(st, `d${i}`, 6), `d${i}`, 100).state
    }
    expect(seen).toEqual([...RAID_ORDER, RAID_ORDER[0]])
    expect(RAID_ROSTER[nextBossIndex(raidBossIndex('void'))]).toBe('chronos')
  })
  it('a stored retired boss resolves to an active one and progresses through the order from there', () => {
    const gi = raidBossIndex('glutton')
    const now = raidMotif({ boss: gi })
    expect(isRaidMotif(now)).toBe(true)
    const won = applyRaidAttempt(raidToday({ boss: gi, trophies: [] }, 'd', 6), 'd', 100)
    expect(RAID_ROSTER[won.state.boss]).toBe(RAID_ORDER[(RAID_ORDER.indexOf(now) + 1) % RAID_ORDER.length])
  })
})

const PUBLIC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../public')
describe('raid art', () => {
  for (const motif of RAID_MOTIFS) {
    it(`raids/${motif}.svg is plain drawing with three phases`, () => {
      const svg = fs.readFileSync(path.join(PUBLIC, artUrl('raids', motif)), 'utf8')
      expect(svg).toMatch(/viewBox="0 0 120 120"/)
      // REALISTIC_ART files may hold local gradients (ids, url(#id)); art.test.js checks those references.
      if (REALISTIC_ART.includes(`raids/${motif}.svg`)) expect(svg).not.toMatch(/<(script|foreignObject|image|use|a|style|filter)\b|\son\w+\s*=|javascript:|<animate[\s>/]|<set\b|calcMode/i)
      else expect(svg).not.toMatch(/<(script|foreignObject|image|use|a|style)\b|\son\w+\s*=|url\s*\(|javascript:|href=|<animate[\s>/]|<set\b|\sid=|calcMode/i)
      for (const m of svg.matchAll(/var\((--[\w-]+)(,[^)]*)?\)/g)) expect(m[2], `${m[1]} in raids/${motif}`).toBeTruthy()
      const anims = [...svg.matchAll(/<animate(Transform|Motion)\b[^>]*>/g)].map((m) => m[0])
      for (const a of anims) expect(a).toMatch(/class="lg-(in|loop)"/)
      for (const a of anims) {
        const kt = /keyTimes="([^"]*)"/.exec(a)
        if (!kt) continue
        const times = kt[1].split(';').map(Number)
        expect(times.length, a).toBe((/values="([^"]*)"/.exec(a)?.[1] || '').split(';').length)
        expect([times[0], times[times.length - 1]]).toEqual([0, 1])
      }
      expect(anims.some((a) => a.includes('lg-in'))).toBe(true)
      expect(anims.some((a) => a.includes('lg-loop'))).toBe(true)
      // Phases: layers for phase 2 and 3 start hidden (the arena's data-phase shows them).
      for (const p of ['lg-p2', 'lg-p3']) expect(svg, `${motif} ${p}`).toMatch(new RegExp(`class="${p}"[^>]*style="display:none"`))
    })
  }
})

describe('raid test fights and the save outcome', () => {
  it('a test fight is a fresh day of the chosen boss and never writes the stored raid', () => {
    const t = testRaidState('lich', '2026-10-03', 10)
    expect(RAID_ROSTER[t.boss]).toBe('lich')
    expect(t.day).toEqual({ date: '2026-10-03', hp: siegeHp(10), damage: 0, attempts: 0, won: false })
    expect(t.siege).toMatchObject({ hp: siegeHp(10), damage: 0, hearts: RAID.lives })
    const stored = { boss: 0, day: { date: '2026-10-03', hp: 20, damage: 5, attempts: 1, won: false }, trophies: [] }
    const before = JSON.stringify(stored)
    const win = raidAttemptOutcome(stored, { date: '2026-10-03', damage: 100, due: 10, test: 'lich' })
    expect(win).toEqual({ state: null, won: true, firstWin: false })
    expect(raidAttemptOutcome(stored, { date: '2026-10-03', damage: 1, due: 10, test: 'lich' })).toEqual({ state: null, won: false, firstWin: false })
    expect(JSON.stringify(stored)).toBe(before)
  })
  it('a retired or unknown motif falls back to an active boss', () => {
    expect(isRaidMotif(RAID_ROSTER[testRaidState('glutton', 'd', 5).boss])).toBe(true)
    expect(isRaidMotif(RAID_ROSTER[testRaidState('nope', 'd', 5).boss])).toBe(true)
  })
  it('a real attempt writes the wounds and pays the first win once', () => {
    const r = raidAttemptOutcome(null, { date: '2026-10-03', damage: 3, due: 6 })
    expect(r.state.day.damage).toBe(3)
    expect(r.won).toBe(false)
    const w = raidAttemptOutcome(r.state, { date: '2026-10-03', damage: 100, due: 6 })
    expect(w.firstWin).toBe(true)
    expect(w.state.trophies).toHaveLength(1)
  })
  it("an attempt from yesterday lands on the day another window already started, never healing it backwards", () => {
    const stored = { boss: 2, day: { date: '2026-10-04', hp: 15, damage: 4, attempts: 1, won: false }, trophies: [], siege: { boss: 2, hp: 15, damage: 4, hearts: 2, date: '2026-10-04' } }
    const r = raidAttemptOutcome(stored, { date: '2026-10-03', damage: 3, livesLost: 1, due: 10, dayAb: { x: 1 } })
    expect(r.won).toBe(false)
    expect(r.state.day).toMatchObject({ date: '2026-10-04', hp: 15, damage: 7, attempts: 2 })
    expect(r.state.day.ab).toBeUndefined() // the old day's ability state is not the new day's
    expect(r.state.siege).toMatchObject({ date: '2026-10-04', damage: 7, hearts: 1 })
    expect(r.state.boss).toBe(2)
  })
  it('Help hears the fight state, never an answer', () => {
    expect(raidHelpText({ view: 'fight', boss: 'The Lich', hpLeft: 5, hpMax: 10, livesLeft: 2, phase: 2, asked: 3, total: 8 })).toMatch(/health 5\/10, phase 2 of 3, 2\/3 hearts left, 3 of 8/)
    expect(raidHelpText({ view: 'more', boss: 'X', hpLeft: 4, hpMax: 10, livesLeft: 1, nextCards: 6 })).toMatch(/out of questions.*next 6 due cards/)
    expect(raidHelpText({ view: 'hearts', boss: 'X' })).toMatch(/no hearts left.*tomorrow/)
    expect(raidHelpText({ view: 'intro', boss: 'X' })).toMatch(/SIEGE/)
    expect(raidHelpText({ view: 'done', boss: 'X', result: { won: false, recorded: 4, failed: 1 } })).toMatch(/4 review\(s\) saved.*1 could NOT/)
    expect(raidHelpText({ view: 'fight', test: true })).toMatch(/TEST fight/)
    expect(raidHelpText({ view: 'none' })).toBe('')
  })
})

describe('raid reviews: a test fight grades exactly like a normal raid', () => {
  // The answers of one fight, as RaidRun's firstHit holds them (first answers only).
  const hits = () => new Map([
    [1, { verdict: 'clean', mode: 'typed' }],   // mature card: Easy
    [2, { verdict: 'clean', mode: 'typed' }],   // young card: Good
    [3, { verdict: 'clean', mode: 'choice' }],  // a choice: at most Good, even mature
    [4, { verdict: 'glancing', mode: 'typed' }], // Hard
    [5, { verdict: 'miss', mode: 'typed' }],    // Again
  ])
  const pre = new Map([[1, { interval: 30, factor: 2500 }], [2, { interval: 3, factor: 2500 }], [3, { interval: 40, factor: 2500 }], [4, { interval: 10 }], [5, { interval: 50 }]])
  it('the shared one-answer rule, mature Easy from the pre-raid interval', () => {
    expect(raidReviews(hits(), pre, (id) => `f${id}`).map((r) => [r.cardId, r.rating, r.ease, r.front])).toEqual([
      [1, 'easy', 4, 'f1'], [2, 'good', 3, 'f2'], [3, 'good', 3, 'f3'], [4, 'hard', 2, 'f4'], [5, 'again', 1, 'f5'],
    ])
  })
  it('the same answers give the same review list whichever boss (or test fight) they were given to', () => {
    // RaidRun builds the list with raidReviews alone: no boss, motif or test flag reaches it.
    expect(raidReviews.length).toBe(2) // (firstHits, pre, frontOf = ...): nothing else to pass
    const a = raidReviews(hits(), pre)
    const b = raidReviews(hits(), pre)
    expect(a).toEqual(b)
    expect(raidReviews(new Map(), pre)).toEqual([])
  })
})
