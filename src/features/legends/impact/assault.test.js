import { describe, it, expect } from 'vitest'
import { RAID_ASSAULT, TRAVELS, IMPACTS, assaultFor, landAt, assaultMs, ASSAULT } from './assault'
import { RAID_ORDER } from '../raid'
import { TRAVEL_DRAW, IMPACT_DRAW } from './AssaultFx'

describe('every raid boss attacks the player its own way', () => {
  it('every boss in the progression has an attack', () => {
    for (const m of RAID_ORDER) expect(RAID_ASSAULT[m], m).toBeTruthy()
  })
  it('only known travels and impacts, each one drawn', () => {
    for (const [m, a] of Object.entries(RAID_ASSAULT)) {
      expect(TRAVELS, m).toContain(a.travel)
      expect(IMPACTS, m).toContain(a.impact)
    }
    for (const k of TRAVELS) expect(typeof TRAVEL_DRAW[k], k).toBe('function')
    for (const k of IMPACTS) expect(typeof IMPACT_DRAW[k], k).toBe('function')
    for (const k of TRAVELS) expect(ASSAULT.travelMs[k], k).toBeGreaterThan(0)
  })
  it('no two bosses share both their travel and their impact', () => {
    const seen = new Map()
    for (const [m, a] of Object.entries(RAID_ASSAULT)) {
      const key = `${a.travel}+${a.impact}`
      expect(seen.get(key), `${m} repeats ${seen.get(key)}`).toBeUndefined()
      seen.set(key, m)
    }
  })
  it('lands after it leaves and ends after it lands', () => {
    for (const k of TRAVELS) {
      expect(landAt(k)).toBeGreaterThan(ASSAULT.travelAt)
      expect(assaultMs(k)).toBeGreaterThan(landAt(k))
    }
    expect(assaultFor('nobody').travel).toBeTruthy()
  })
})
