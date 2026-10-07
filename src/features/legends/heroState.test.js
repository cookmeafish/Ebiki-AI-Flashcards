import { describe, it, expect } from 'vitest'
import { raidHeroState, raidUses, RAID_TINT } from './heroState'
import { RAID, RAID_ORDER, RAID_ABILITY, raidBossIndex } from './raid'
import { raidProfile } from './raidProfiles'
import { makeT } from '../../i18n'

const DATE = '2026-10-03'
const first = RAID_ORDER[0]

describe('raid hero state', () => {
  it('shows the first boss of the progression for a raid never fought', () => {
    const s = raidHeroState({ stored: null, date: DATE, due: 9 })
    expect(s.kind).toBe('ready')
    expect(s.motif).toBe(first)
    expect(s.num).toBe(1)
    expect(s.total).toBe(RAID_ORDER.length)
    expect(s.ability).toBe(RAID_ABILITY[first])
    expect(s.hp).toBe(raidProfile(first).hp) // the boss's own health, not the cards due
    expect(s).toMatchObject({ hearts: raidProfile(first).hearts, heartsMax: raidProfile(first).hearts, heal: raidProfile(first).heal, runs: 1, powers: 0 })
    expect(s.left).toBe(s.hp)
    expect(s.attempts).toBe(0)
  })
  it("carries the siege's wounds and hearts; a new day heals the boss's heal and refills the hearts", () => {
    const boss = raidBossIndex('titan')
    const stored = { boss, day: { date: DATE, hp: 20, damage: 6, attempts: 2, won: false }, trophies: [], siege: { boss, hp: 20, damage: 6, hearts: 1, date: DATE } }
    const s = raidHeroState({ stored, date: DATE, due: 12 })
    expect(s).toMatchObject({ kind: 'ready', motif: 'titan', hp: 20, damage: 6, left: 14, attempts: 2, hearts: 1, healthKnown: true })
    const later = raidHeroState({ stored: { ...stored, day: { ...stored.day, date: '2026-10-02' }, siege: { ...stored.siege, date: '2026-10-02' } }, date: DATE, due: 12 })
    expect(later).toMatchObject({ damage: 6 - raidProfile('titan').heal, attempts: 0, hp: 20, hearts: raidProfile('titan').hearts })
  })
  it('never locks the raid for lost hearts (a siege left at 0 by an older build is full again)', () => {
    const boss = raidBossIndex('titan')
    const stored = { boss, day: { date: DATE, hp: 20, damage: 6, attempts: 2, won: false }, trophies: [], siege: { boss, hp: 20, damage: 6, hearts: 0, date: DATE } }
    const h = raidHeroState({ stored, date: DATE, due: 12, anki: false })
    expect(h.kind).not.toBe('hearts')
    expect(h.hearts).toBe(h.heartsMax)
  })
  it('counts only due notes not yet answered today, and the runs they make', () => {
    const boss = raidBossIndex(first)
    const stored = { boss, day: { date: DATE, hp: 30, damage: 4, attempts: 1, won: false, asked: [1, 2, 3] }, trophies: [], siege: { boss, hp: 30, damage: 4, hearts: 2, date: DATE } }
    const ids = Array.from({ length: 34 }, (_, i) => i + 1)
    expect(raidHeroState({ stored, date: DATE, dueIds: ids })).toMatchObject({ due: 31, runs: 3, uses: RAID.runSize })
    // The run size is the player's setting.
    expect(raidHeroState({ stored, date: DATE, dueIds: ids, runSize: 10 })).toMatchObject({ runs: 4, uses: 10 })
    // Any number of cards can fight (the health is the boss's own).
    expect(raidHeroState({ stored, date: DATE, dueIds: [1, 2, 3, 4] }).kind).toBe('ready')
    expect(raidHeroState({ stored: null, date: DATE, due: 1 }).kind).toBe('ready')
  })
  it('after a win the next boss is out the same day, fresh, with full hearts', () => {
    const stored = { boss: raidBossIndex(RAID_ORDER[1]), day: { date: DATE, hp: 10, damage: 10, attempts: 1, won: true }, trophies: [{ motif: first, date: DATE }], siege: null }
    expect(raidHeroState({ stored, date: DATE, due: 12 })).toMatchObject({ kind: 'ready', motif: RAID_ORDER[1], num: 2, beatenToday: first, hearts: raidProfile(RAID_ORDER[1]).hearts, damage: 0, hp: raidProfile(RAID_ORDER[1]).hp })
  })
  it('counts the cards the fight uses, capped', () => {
    expect(raidUses(40)).toBe(RAID.maxCards)
    expect(raidHeroState({ date: DATE, due: 40 }).uses).toBe(RAID.maxCards)
  })
  it('names every calm state', () => {
    expect(raidHeroState({ date: DATE, due: null }).kind).toBe('counting')
    expect(raidHeroState({ date: DATE, due: null }).healthKnown).toBe(false)
    expect(raidHeroState({ date: DATE, due: NaN }).kind).toBe('unknown')
    expect(raidHeroState({ date: DATE, due: 0 }).kind).toBe('none')
    expect(raidHeroState({ date: DATE, due: 9, anki: false }).kind).toBe('anki')
    expect(raidHeroState({ date: DATE, due: 9, hasKey: false }).kind).toBe('nokey')
  })
  it('with nextBossSameDay off, a boss beaten today shows the win, with the next boss tomorrow', () => {
    const was = RAID.nextBossSameDay
    RAID.nextBossSameDay = false
    try {
      const stored = { boss: raidBossIndex(RAID_ORDER[1]), day: { date: DATE, hp: 10, damage: 10, attempts: 1, won: true }, trophies: [{ motif: first, date: DATE }] }
      const s = raidHeroState({ stored, date: DATE, due: 0, anki: false })
      expect(s.kind).toBe('beaten')
      expect(s.beaten).toBe(first)
      expect(s.motif).toBe(RAID_ORDER[1])
    } finally { RAID.nextBossSameDay = was }
  })
})

describe('raid hero art data and text', () => {
  it('has a tint for every raid boss', () => {
    for (const m of RAID_ORDER) expect(RAID_TINT[m], m).toMatch(/^#[0-9a-f]{6}$/)
  })
  it('has a one-line rule for every raid ability in every language', () => {
    for (const lang of ['en', 'es', 'zh', 'ja']) {
      const t = makeT(lang)
      for (const m of RAID_ORDER) {
        const key = `lg_abilityLine_${RAID_ABILITY[m]}`
        expect(t(key), `${lang} ${key}`).not.toBe(key)
        expect(t(key).length, `${lang} ${key} is one line`).toBeLessThan(90)
      }
    }
  })
})
