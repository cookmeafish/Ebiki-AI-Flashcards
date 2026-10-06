// RAID BOSS PROFILES (raidProfiles.js): every boss, simulated with its own ability through the real fight engine
// (abilities/_sim.js). A learner fights one run of RUN questions a day, hearts full each day, the boss healing its
// profile's `heal` each night. FAIRNESS (the owner's rule): no boss needs near-perfect play.
// PROFILES=1 npx vitest run src/features/legends/profiles.test.js prints the table (runs to beat each boss).
import { describe, it, expect } from 'vitest'
import { RAID_PROFILES, raidProfile, MAX_HEARTS, DEFAULT_PROFILE } from './raidProfiles'
import { RAID_ORDER, RAID_ABILITY, RAID_ROSTER, RAID_RETIRED } from './raid'
import { simulateRaid, seededAnswer } from './abilities/_sim'

const RUN = 15
const SEEDS = 20
const MAX_DAYS = 40
function runsToBeat(motif, acc, seed) {
  const p = raidProfile(motif)
  const answer = seededAnswer(acc, seed * 7919 + Math.round(acc * 100))
  let dmg = 0
  for (let d = 1; d <= MAX_DAYS; d++) {
    if (d > 1) dmg = Math.max(0, dmg - p.heal)
    const r = simulateRaid(RAID_ABILITY[motif] || '', { n: RUN, answer, press: 'greedy', dayBefore: dmg, dayHp: p.hp, lives: p.hearts })
    dmg += r.state.damage
    if (dmg >= p.hp) return d
  }
  return 99
}
const stats = (motif, acc) => {
  const v = Array.from({ length: SEEDS }, (_, i) => runsToBeat(motif, acc, i + 1)).sort((a, b) => a - b)
  return { median: v[Math.floor(v.length / 2)], p90: v[Math.floor(v.length * 0.9)], worst: v[v.length - 1] }
}

describe('raid boss profiles', () => {
  it('every active raid boss has a profile; numbers are sane', () => {
    for (const m of RAID_ORDER) expect(RAID_PROFILES[m], m).toBeTruthy()
    for (const m of RAID_RETIRED) expect(RAID_PROFILES[m]).toBeUndefined()
    for (const [m, p] of Object.entries(RAID_PROFILES)) {
      expect(RAID_ROSTER).toContain(m)
      expect(p.hp).toBeGreaterThan(0)
      expect(p.hearts).toBeGreaterThanOrEqual(3)
      expect(p.heal).toBeGreaterThanOrEqual(1)
      expect(p.slots).toBeGreaterThanOrEqual(1)
    }
    expect(MAX_HEARTS).toBe(Math.max(...Object.values(RAID_PROFILES).map((p) => p.hearts)))
    expect(raidProfile('no-such-boss')).toEqual(DEFAULT_PROFILE)
  })
  it('a bigger boss comes with more hearts (or is a boss whose ability protects the player)', () => {
    const protects = new Set(['chronos', 'seraph', 'vampire', 'ophanim'])
    const list = RAID_ORDER.map((m) => ({ m, ...raidProfile(m) }))
    for (const a of list) for (const b of list) {
      if (b.hp >= a.hp + 30 && !protects.has(b.m)) expect(b.hearts, `${b.m} (${b.hp}) vs ${a.m} (${a.hp})`).toBeGreaterThan(a.hearts)
    }
  })
  it('is fair: a 65% learner beats every boss in a handful of runs, a 60% learner beats them all, later bosses take longer', () => {
    const rows = []
    const at75 = []
    for (const [i, m] of RAID_ORDER.entries()) {
      const s60 = stats(m, 0.6)
      const s65 = stats(m, 0.65)
      const s75 = stats(m, 0.75)
      const s95 = stats(m, 0.95)
      at75.push(s75.median)
      rows.push(`${String(i + 1).padStart(2)} ${m.padEnd(11)} hp ${raidProfile(m).hp} hearts ${raidProfile(m).hearts} | 60% ${s60.median}/${s60.worst} | 65% ${s65.median}/${s65.p90} | 75% ${s75.median} | 95% ${s95.median}`)
      expect(s65.median, `${m} at 65%`).toBeLessThanOrEqual(7)
      expect(s65.p90, `${m} at 65%, unlucky`).toBeLessThanOrEqual(10)
      expect(s60.worst, `${m} at 60%`).toBeLessThan(99)
      expect(s95.median, `${m} at 95%`).toBeLessThanOrEqual(4)
    }
    if (process.env.PROFILES) process.stdout.write(`\nruns of ${RUN} to beat each boss (median/unlucky)\n${rows.join('\n')}\n`)
    const avg = (v) => v.reduce((a, b) => a + b, 0) / v.length
    expect(avg(at75.slice(-6))).toBeGreaterThanOrEqual(avg(at75.slice(0, 6)) + 1.5) // the journey gets heavier
  }, 120000)
})
