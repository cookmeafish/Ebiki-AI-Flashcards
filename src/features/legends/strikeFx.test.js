import { describe, it, expect } from 'vitest'
import { strikeMoment, STRIKE_FX } from './strikeFx'
import { juiceOf } from './fx/_juice'

describe('the impact of a raid strike', () => {
  it('names every plain moment', () => {
    expect(strikeMoment(null)).toBe('')
    expect(strikeMoment({ kind: 'hit', damage: 2 })).toBe('hit')
    expect(strikeMoment({ kind: 'hit', damage: 3, crit: true })).toBe('crit')
    expect(strikeMoment({ kind: 'hit', damage: 4, sharpened: true })).toBe('sharpen')
    expect(strikeMoment({ kind: 'miss', lives: 1 })).toBe('hurt')
    expect(strikeMoment({ kind: 'miss', lives: 2, attack: true })).toBe('hurtBig')
    expect(strikeMoment({ kind: 'hit', damage: 1, attack: true })).toBe('block')
    expect(strikeMoment({ kind: 'block', lives: 0, shielded: true })).toBe('shield')
    expect(strikeMoment({ kind: 'wind' })).toBe('wind')
  })
  it("leaves an ability's own moment to its fx file, except the knockout", () => {
    expect(strikeMoment({ kind: 'hit', damage: 2, fx: 'sever' })).toBe('')
    expect(strikeMoment({ kind: 'hit', damage: 2, fx: 'sever' }, { down: true })).toBe('ko')
  })
  it('every moment is valid juice', () => {
    for (const [k, j] of Object.entries(STRIKE_FX)) expect(juiceOf(j), k).toMatchObject({ size: j.size, shake: j.shake, flash: j.flash, hitstop: j.hitstop })
  })
})
