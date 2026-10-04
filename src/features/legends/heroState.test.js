import { describe, it, expect } from 'vitest'
import { raidHeroState, raidUses, RAID_TINT } from './heroState'
import { RAID, RAID_ORDER, RAID_ABILITY, raidBossIndex, raidHp } from './raid'
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
    expect(s.hp).toBe(raidHp(9))
    expect(s.left).toBe(s.hp)
    expect(s.attempts).toBe(0)
  })
  it('carries today\'s wounds and tries, ignores yesterday\'s', () => {
    const stored = { boss: raidBossIndex('titan'), day: { date: DATE, hp: 20, damage: 6, attempts: 2, won: false }, trophies: [] }
    const s = raidHeroState({ stored, date: DATE, due: 12 })
    expect(s).toMatchObject({ kind: 'ready', motif: 'titan', hp: 20, damage: 6, left: 14, attempts: 2, healthKnown: true })
    const old = raidHeroState({ stored: { ...stored, day: { ...stored.day, date: '2026-10-02' } }, date: DATE, due: 12 })
    expect(old).toMatchObject({ damage: 0, attempts: 0, hp: raidHp(12) })
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
    expect(raidHeroState({ date: DATE, due: RAID.minCards - 1 }).kind).toBe('few')
    expect(raidHeroState({ date: DATE, due: 9, anki: false }).kind).toBe('anki')
    expect(raidHeroState({ date: DATE, due: 9, hasKey: false }).kind).toBe('nokey')
  })
  it('a boss beaten today shows the win, with tomorrow\'s boss next', () => {
    const stored = { boss: raidBossIndex(RAID_ORDER[1]), day: { date: DATE, hp: 10, damage: 10, attempts: 1, won: true }, trophies: [{ motif: first, date: DATE }] }
    const s = raidHeroState({ stored, date: DATE, due: 0, anki: false })
    expect(s.kind).toBe('beaten')
    expect(s.beaten).toBe(first)
    expect(s.motif).toBe(RAID_ORDER[1])
    expect(s.num).toBe(2)
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
