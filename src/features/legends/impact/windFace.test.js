// SECOND WIND STAYS OFF THE FACE (the owner: effects never cover a boss's face). The heart rose across the Banshee's
// mouth, her pulse turned her face cyan and the gust rings circled every face: every part of every boss's wind now
// plays in the lower half of the box (faces sit in the upper half), measured from the parts' own numbers (PART_TOP).
import { describe, it, expect } from 'vitest'
import { PART_TOP } from './parts'
import { RAID_IMPACT } from './styles'
import { momentParts } from '../StrikeFxLayer'
import { RAID_ORDER } from '../raid'

describe('Second wind', () => {
  it('every boss plays it under the face', () => {
    for (const m of RAID_ORDER) {
      for (const [name, p] of momentParts('wind', RAID_IMPACT[m]).parts) {
        const top = PART_TOP[name]
        expect(top, `${m}: no face line for its wind part ${name}`).toBeTypeOf('function')
        expect(top(p), `${m}: its wind part ${name} reaches ${top(p).toFixed(1)}cqw from the centre`).toBeGreaterThanOrEqual(0)
      }
    }
  })
  it('the face lines follow the parts (the old centred parts measure above the centre)', () => {
    expect(PART_TOP.pulse({})).toBeLessThan(0)
    expect(PART_TOP.gust({ n: 3 })).toBeLessThan(0)
    expect(PART_TOP.rise({})).toBeLessThan(-50)
    expect(PART_TOP.glint({})).toBe(-40)
    expect(PART_TOP.drops({})).toBeLessThan(-50)
  })
})
