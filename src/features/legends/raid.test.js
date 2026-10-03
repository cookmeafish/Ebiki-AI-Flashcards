// Raids: health from the cards due, wounds kept for the day, a trophy and the next boss on a win, Anki's order.
// Plus the raid art: one file per raid boss, plain drawing, three phases.
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { RAID, RAID_MOTIFS, RAID_ROSTER, RAID_RETIRED, raidMotif, isRaidMotif, raidHp, raidToday, applyRaidAttempt, raidOrder, shapeRaid, newRaidState } from './raid'
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
  it('keeps the wounds for the day and heals overnight', () => {
    let s = raidToday(newRaidState(), '2026-09-29', 10)
    const hp = s.day.hp
    s = applyRaidAttempt(s, '2026-09-29', 6).state
    expect(s.day.damage).toBe(6)
    expect(raidToday(s, '2026-09-29', 3).day.damage).toBe(6) // the same day: still wounded, same health
    expect(raidToday(s, '2026-09-29', 3).day.hp).toBe(hp)
    expect(raidToday(s, '2026-09-30', 10).day.damage).toBe(0)
  })
  it('gives a trophy once and brings out the next boss', () => {
    let s = raidToday(newRaidState(), '2026-09-29', 6)
    const r1 = applyRaidAttempt(s, '2026-09-29', 5)
    expect(r1.won).toBe(false)
    const r2 = applyRaidAttempt(r1.state, '2026-09-29', 100)
    expect(r2.firstWin).toBe(true)
    expect(r2.state.trophies).toEqual([{ motif: RAID_MOTIFS[0], date: '2026-09-29' }])
    expect(r2.state.boss).toBe(1)
    expect(applyRaidAttempt(r2.state, '2026-09-29', 5).firstWin).toBe(false)
  })
  it('ignores an attempt for another day and survives damaged data', () => {
    const s = raidToday(newRaidState(), '2026-09-29', 6)
    expect(applyRaidAttempt(s, '2026-09-28', 99).state.day.damage).toBe(0)
    expect(shapeRaid({ boss: 99, trophies: [{ motif: 'nope' }] })).toEqual({ boss: 99 % RAID_ROSTER.length, day: null, trophies: [] })
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
    // A win against the boss before it skips the retired one.
    const before = raidToday({ boss: gi - 1, day: null, trophies: [] }, '2026-10-01', 6)
    const won = applyRaidAttempt(before, '2026-10-01', 100)
    expect(won.firstWin).toBe(true)
    expect(RAID_ROSTER[won.state.boss]).toBe('puppeteer')
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
