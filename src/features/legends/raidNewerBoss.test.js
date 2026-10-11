// A stored raid boss index a NEWER build wrote (it appended a boss to RAID_ROSTER) is never wrapped onto another boss
// (`% length` turned it into the Hydra): the state is kept exactly as stored by every writer, no fight starts, and the
// screens and Help ask to update Ebiki (raid.js isNewerRaidBoss).
import { describe, it, expect } from 'vitest'
import { RAID_ROSTER, isNewerRaidBoss, shapeRaid, raidMotif, siegeOf, raidToday, applyRaidAttempt, raidAttemptOutcome, raidMarkAsked, applyBandage, raidAsked, raidBossIndex, raidHelpText, raidWhere } from './raid'
import { raidHeroState } from './heroState'
import { raidProgressText, raidCatalogText } from './bestiaryHelp'

const D = '2026-10-05'
const N = RAID_ROSTER.length // the first index a newer build may write
const newer = (extra = {}) => ({
  boss: N + 1,
  day: { date: D, hp: 60, damage: 12, attempts: 2, won: false, ab: { future: 1 }, asked: [11, 12] },
  siege: { boss: N + 1, hp: 60, damage: 12, hearts: 5, date: D, variant: 'nightmare', futureField: 'x' },
  trophies: [{ motif: 'chronos', date: '2026-10-01' }, { motif: 'futureboss', date: '2026-10-02' }],
  powers: ['shield', 'fifty'],
  ...extra,
})
const keepsBossAndSiege = (s, before = newer()) => {
  expect(s.boss).toBe(before.boss)
  expect(s.siege).toEqual(before.siege)
  expect(s.day).toEqual(before.day)
}

describe('a boss this build does not know', () => {
  it('is recognised only at or past the end of the roster', () => {
    expect(isNewerRaidBoss({ boss: N })).toBe(true)
    expect(isNewerRaidBoss({ boss: N - 1 })).toBe(false)
    expect(isNewerRaidBoss({ boss: 0 })).toBe(false)
    expect(isNewerRaidBoss(null)).toBe(false)
    expect(isNewerRaidBoss({ boss: '30' })).toBe(false)
  })
  it('is never wrapped onto another boss', () => {
    const s = shapeRaid(newer())
    keepsBossAndSiege(s)
    expect(s.boss).not.toBe((N + 1) % N)
    expect(raidMotif(s)).toBe('')
    expect(siegeOf(s)).toBeNull()
    expect(s.trophies).toHaveLength(2) // its trophy too (shown generically)
    expect(s.powers).toEqual(['shield', 'fifty'])
  })
  it('every writer leaves boss, day and siege exactly as stored', () => {
    keepsBossAndSiege(raidToday(newer(), '2026-10-09', 15))
    const a = applyRaidAttempt(newer(), D, 999, { x: 1 }, { livesLost: 3, asked: [99] })
    expect(a.won).toBe(false)
    keepsBossAndSiege(a.state)
    const o = raidAttemptOutcome(newer(), { date: D, damage: 999, livesLost: 3, asked: [99], due: 15, motif: 'hydra' })
    expect(o.won).toBe(false)
    expect(o.firstWin).toBe(false)
    keepsBossAndSiege(o.state)
    keepsBossAndSiege(raidMarkAsked(newer(), D, [99]))
    expect(applyBandage(newer({ powers: ['shield', 'fifty', 'wind', 'sharpen', 'hint', 'bandage'] }), D)).toBeNull()
    expect(raidAsked(newer(), D)).toEqual([11, 12]) // read only
    // Saved and read again (JSON round trip): still the same boss and siege.
    keepsBossAndSiege(shapeRaid(JSON.parse(JSON.stringify(o.state))))
  })
  it('the raid hero shows the update note, never a fight', () => {
    const h = raidHeroState({ stored: newer(), date: D, due: 20 })
    expect(h.kind).toBe('newer')
    expect(h.motif).toBe('')
  })
  it('Help says to update, never names another boss as the current one', () => {
    expect(raidProgressText((k) => k, newer(), D)).toMatch(/newer version of Ebiki/)
    expect(raidCatalogText({ t: (k) => k, raid: newer(), today: D })).toMatch(/Current boss: one from a newer version of Ebiki/)
  })
  it('the raid screen tells Help to update, naming no boss', () => {
    expect(raidHelpText({ view: 'newer' })).toMatch(/newer version of Ebiki/)
    expect(raidWhere({ view: 'newer', boss: '' })).toMatch(/newer version of Ebiki/)
  })
  it('a known boss still shapes as before', () => {
    expect(shapeRaid({ boss: raidBossIndex('hydra') }).boss).toBe(raidBossIndex('hydra'))
  })
})
