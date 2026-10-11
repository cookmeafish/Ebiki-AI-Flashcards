// POWERS ARE UNLOCKED FOR GOOD (powers.js keptPowers / powerProgress, raid.js shapeRaid `powers`): a roster change
// (a new raid boss raises the last thresholds), a trimmed trophy list or another computer on the shared folder never
// takes a power away. The stored high-water mark only grows and is written only after a successful read.
import { describe, it, expect, vi, beforeEach } from 'vitest'

// An in-memory feature store standing in for /api/feature-data: `disk` is the shared folder.
const disk = new Map()
let refuseRead = false
vi.mock('../storage', () => ({
  featureStore: () => ({
    read: async (key) => (refuseRead ? { ok: false, value: null } : { ok: true, value: disk.has(key) ? structuredClone(disk.get(key)) : null }),
    write: async (key, value) => { disk.set(key, structuredClone(value)); return true },
  }),
}))

const { POWERS, POWER_IDS, PAST_UNLOCKS, keptPowers, powerProgress, unlockedPowers, nextUnlock, shapeLoadout, toggleLoadout, beatenOf, bossesBeaten } = await import('./powers')
const { shapeRaid, newRaidState, raidAttemptOutcome, raidToday, raidMarkAsked, applyBandage, raidBossIndex, RAID_ORDER } = await import('./raid')
const { updateRaid, readRaid } = await import('./store')

const D = '2026-10-01'
const trophiesOf = (motifs) => motifs.map((motif) => ({ motif, date: D }))
const first = (n) => RAID_ORDER.slice(0, n)
// A raid one hit from beating `motif`, after the bosses in `beaten`.
const besieged = (beaten, motif, extra = {}) => ({ boss: raidBossIndex(motif), day: { date: D, hp: 30, damage: 29, attempts: 0, won: false }, trophies: trophiesOf(beaten), siege: { boss: raidBossIndex(motif), hp: 30, damage: 29, hearts: 4, date: D }, ...extra })

describe('kept unlocks: a power once unlocked never locks again', () => {
  it('a stored unlock beats a threshold that moved up (Fury and Steadfast after a new boss)', () => {
    const state = { trophies: trophiesOf(first(23)), powers: [...POWER_IDS] }
    expect(POWERS.fury.unlock).toBeGreaterThan(23) // the case this guards: the roster grew past the old table
    const prog = powerProgress(state)
    expect(unlockedPowers(prog)).toEqual(POWER_IDS)
    expect(nextUnlock(prog)).toBeNull()
    expect(shapeLoadout(['fury', 'steadfast'], prog)).toEqual(['fury', 'steadfast'])
    expect(toggleLoadout(['fury'], 'steadfast', prog)).toEqual(['fury', 'steadfast'])
    // The plain count alone would have locked them (the bug).
    expect(unlockedPowers(23)).not.toContain('fury')
  })
  it('a state from before the rule is seeded from the thresholds its builds used', () => {
    expect(PAST_UNLOCKS[0]).toEqual({ fury: 23, steadfast: 26 })
    expect(keptPowers({ trophies: trophiesOf(first(23)) })).toEqual(['fury'])
    expect(keptPowers({ trophies: trophiesOf(first(26)) })).toEqual(['fury', 'steadfast'])
    expect(keptPowers({ trophies: trophiesOf(first(22)) })).toEqual([])
    expect(unlockedPowers(powerProgress({ trophies: trophiesOf(first(26)) }))).toEqual(POWER_IDS)
    // A stored list (even empty) is the mark: a new player is held to today's thresholds.
    expect(keptPowers({ trophies: trophiesOf(first(23)), powers: [] })).toEqual([])
  })
  it('the next unlock skips a kept power, and the count still reads', () => {
    const prog = { beaten: 2, kept: ['sharpen'] }
    expect(unlockedPowers(prog)).toEqual(['shield', 'sharpen'])
    expect(nextUnlock(prog)).toEqual({ id: 'fifty', beaten: POWERS.fifty.unlock })
    expect(beatenOf(prog)).toBe(2)
    expect(beatenOf(7)).toBe(7)
    expect(unlockedPowers(null)).toEqual([])
    expect(unlockedPowers({ beaten: 'x', kept: 'shield' })).toEqual([])
  })
})

describe('the raid state carries the mark', () => {
  it('shapeRaid writes the union of the mark and what the trophies give now; unknown ids dropped', () => {
    expect(newRaidState().powers).toEqual([])
    expect(shapeRaid(null).powers).toEqual([])
    expect(shapeRaid({ trophies: trophiesOf(first(3)), powers: ['steadfast', 'nope'] }).powers).toEqual(['shield', 'fifty', 'steadfast'])
  })
  it('a trimmed trophy list never takes a power away', () => {
    // 250 trophies, the first 26 bosses early and the rest one boss again and again: shapeRaid keeps the newest 200.
    const many = [...trophiesOf(first(26)), ...trophiesOf(Array(224).fill(RAID_ORDER[0]))]
    const once = shapeRaid({ trophies: many })
    expect(bossesBeaten(once)).toBeLessThan(26)
    expect(once.powers).toContain('steadfast')
    expect(shapeRaid(once).powers).toContain('steadfast') // and the saved copy keeps it
  })
  it('every raid writer keeps it, and a first win adds the power it unlocks', () => {
    const won = raidAttemptOutcome(besieged([], RAID_ORDER[0], { powers: [] }), { date: D, damage: 5, due: 5, motif: RAID_ORDER[0] })
    expect(won.won).toBe(true)
    expect(won.state.powers).toEqual(['shield'])
    const kept = besieged(first(2), RAID_ORDER[2], { powers: ['shield', 'fury'] })
    const lost = raidAttemptOutcome(kept, { date: D, damage: 0, livesLost: 1, due: 5, motif: RAID_ORDER[2] })
    expect(lost.state.powers).toContain('fury')
    expect(raidToday(kept, '2026-10-02', 5).powers).toContain('fury')
    expect(raidMarkAsked(kept, D, [1]).powers).toContain('fury')
    // Another computer beat this boss meanwhile: only the asked notes are kept, the mark too.
    expect(raidAttemptOutcome(kept, { date: D, damage: 3, due: 5, motif: RAID_ORDER[5] }).state.powers).toContain('fury')
  })
  it('the Bandage reads the kept unlocks too', () => {
    const s = besieged(first(3), RAID_ORDER[3], { powers: ['shield', 'bandage'] })
    expect(applyBandage(s, D)?.siege?.bandage).toBe(D)
    expect(applyBandage({ ...s, powers: [] }, D)).toBeNull()
  })
})

describe('shared folder: the mark merges by max, never shrinks', () => {
  beforeEach(() => { disk.clear(); refuseRead = false })
  it('a save from a computer holding an old copy keeps what the other computer unlocked', async () => {
    const key = 'raid-1'
    // Computer A beat 23 bosses under the 26-boss table and wrote the mark with Fury.
    disk.set(key, { ...besieged(first(23), RAID_ORDER[23]), powers: ['shield', 'fifty', 'wind', 'sharpen', 'hint', 'bandage', 'focus', 'siphon', 'ward', 'momentum', 'fury'] })
    // Computer B, whose copy predates it, saves a run: updateRaid re-reads the folder first.
    const stale = { ...besieged(first(20), RAID_ORDER[23]), powers: [] }
    expect(unlockedPowers(powerProgress(stale))).not.toContain('fury')
    const next = await updateRaid(1, (cur) => raidAttemptOutcome(cur, { date: D, damage: 0, livesLost: 1, due: 5, motif: RAID_ORDER[23] }).state)
    expect(next.powers).toContain('fury')
    expect(disk.get(key).powers).toContain('fury')
    const r = await readRaid(1)
    expect(unlockedPowers(powerProgress(r.value))).toContain('fury')
  })
  it('an older build that dropped the field: the next save restores what its table gave', async () => {
    disk.set('raid-2', { ...besieged(first(26), RAID_ORDER[26]) }) // no `powers`: written by an older build
    const next = await updateRaid(2, (cur) => raidMarkAsked(raidToday(cur, D, 5), D, [7]))
    expect(next.powers).toEqual(POWER_IDS)
  })
  it('nothing is written after a failed read', async () => {
    disk.set('raid-3', { ...besieged(first(5), RAID_ORDER[5]), powers: ['shield', 'fifty', 'wind'] })
    refuseRead = true
    expect(await updateRaid(3, () => newRaidState())).toBeUndefined()
    expect(disk.get('raid-3').powers).toEqual(['shield', 'fifty', 'wind'])
  })
})
