import { describe, it, expect } from 'vitest'
import { heartChange, nextHeart, heartSelector, demoHearts, demoBlow, demoGain, demoHeartsFull, demoSteadfast, demoHeartsLeft } from './heartTargets'
import { newFight, livesLeft, applyRefund } from './fight'

const red = (i) => ({ gold: false, i })
const gold = (i) => ({ gold: true, i })

describe('heartChange: which heart a blow takes', () => {
  it('a blow takes the LAST full heart, then the next, walking the row from its end', () => {
    // BossArena's Lives: heart i is lost when i >= left, so with 5 hearts the first loss is index 4.
    let full = 5
    const seen = []
    for (let k = 0; k < 5; k++) {
      const c = heartChange({ red: full }, { red: full - 1 }, { took: 1 })
      expect(c.lost).toEqual([red(full - 1)])
      expect(c.aim).toEqual([red(full - 1)])
      seen.push(c.aim[0].i)
      full--
    }
    expect(seen).toEqual([4, 3, 2, 1, 0])
  })
  it('matches livesLeft: the heart aimed at is the first one shown empty after the blow', () => {
    const lives = 6
    for (let lost = 0; lost < lives; lost++) {
      const before = livesLeft({ ...newFight(), livesLost: lost }, lives)
      const after = livesLeft({ ...newFight(), livesLost: lost + 1 }, lives)
      const { aim } = heartChange({ red: before }, { red: after }, { took: 1 })
      expect(aim[0].i).toBe(after) // Lives: `lost = i >= left`, so index `after` just went grey
    }
  })
  it('a heavy blow hits both hearts it takes, the end one first', () => {
    const c = heartChange({ red: 5 }, { red: 3 }, { took: 2 })
    expect(c.aim).toEqual([red(4), red(3)])
    expect(c.lost).toEqual([red(4), red(3)])
  })
  it('a heavy blow on the last heart takes only that one', () => {
    const c = heartChange({ red: 1 }, { red: 0 }, { took: 2 })
    expect(c.aim).toEqual([red(0)])
  })
  it('Steadfast gold hearts are aimed at first, from their end, then the red row', () => {
    expect(heartChange({ red: 4, gold: 2 }, { red: 4, gold: 1 }, { took: 1 }).aim).toEqual([gold(1)])
    expect(heartChange({ red: 4, gold: 1 }, { red: 4, gold: 0 }, { took: 1 }).aim).toEqual([gold(0)])
    expect(heartChange({ red: 4, gold: 0 }, { red: 3, gold: 0 }, { took: 1 }).aim).toEqual([red(3)])
  })
  it('a heavy blow across the gold and red rows hits the last gold heart, then the last red one', () => {
    expect(heartChange({ red: 4, gold: 1 }, { red: 3, gold: 0 }, { took: 2 }).aim).toEqual([gold(0), red(3)])
  })
  it('a strike that took a heart the row does not show (healed back at once) still aims at the next heart', () => {
    const c = heartChange({ red: 4 }, { red: 4 }, { took: 1 })
    expect(c.lost).toEqual([])
    expect(c.aim).toEqual([red(3)])
  })
  it('no lives taken: nothing aimed, nothing lost (a hit, a shield save, a reset)', () => {
    expect(heartChange({ red: 5 }, { red: 3 }, { took: 0 })).toEqual({ lost: [], gained: [], aim: [] })
    expect(heartChange({ red: 3 }, { red: 5 }, { took: 0 })).toEqual({ lost: [], gained: [], aim: [] })
  })
  it('a refund brings back the heart that was lost (the most recent first)', () => {
    expect(heartChange({ red: 3 }, { red: 4 }, { refund: true }).gained).toEqual([red(3)])
    expect(heartChange({ red: 2 }, { red: 4 }, { refund: true }).gained).toEqual([red(2), red(3)])
    expect(heartChange({ red: 4, gold: 0 }, { red: 4, gold: 1 }, { refund: true }).gained).toEqual([gold(0)])
  })
  it('a refund after a blow gives back exactly the heart the blow aimed at (fight.js)', () => {
    const lives = 5
    const s0 = newFight()
    const s1 = { ...s0, livesLost: 1 }
    const s2 = applyRefund(s1, { lives: 1 })
    const hit = heartChange({ red: livesLeft(s0, lives) }, { red: livesLeft(s1, lives) }, { took: 1 }).aim[0]
    const back = heartChange({ red: livesLeft(s1, lives) }, { red: livesLeft(s2, lives) }, { refund: s2.last.kind === 'refund' }).gained[0]
    expect(back).toEqual(hit)
  })
  it('nextHeart and selectors', () => {
    expect(nextHeart({ red: 3, gold: 2 })).toEqual(gold(1))
    expect(nextHeart({ red: 3 })).toEqual(red(2))
    expect(nextHeart({ red: 0 })).toEqual(red(0))
    expect(heartSelector(red(2))).toBe('[data-heart="2"]')
    expect(heartSelector(gold(0))).toBe('[data-heart-gold="0"]')
  })
})

describe('the asset view demo hearts', () => {
  it('each blow removes the heart it hits until empty, never below', () => {
    let h = demoHearts(4)
    const took = []
    for (let k = 0; k < 6; k++) { const r = demoBlow(h, 1); took.push(r.took); h = r.hearts }
    expect(took).toEqual([1, 1, 1, 1, 0, 0])
    expect(demoHeartsLeft(h)).toBe(0)
  })
  it('a heavy blow takes two, or what is left', () => {
    let r = demoBlow(demoHearts(3), 2)
    expect(r.took).toBe(2)
    r = demoBlow(r.hearts, 2)
    expect(r.took).toBe(1)
    expect(r.hearts.lost).toBe(3)
  })
  it('gold first, gain gives back red first then gold, reset fills all', () => {
    let h = demoSteadfast(demoHearts(3), 2)
    h = demoBlow(h, 2).hearts
    expect(h).toMatchObject({ gold: 0, lost: 0 })
    h = demoBlow(h, 1).hearts
    expect(h).toMatchObject({ gold: 0, lost: 1 })
    let g = demoGain(h)
    expect(g.healed).toBe(1)
    expect(g.hearts).toMatchObject({ gold: 0, lost: 0 })
    g = demoGain(g.hearts)
    expect(g.hearts).toMatchObject({ gold: 1, lost: 0 })
    g = demoGain(demoGain(g.hearts).hearts)
    expect(g.healed).toBe(0) // all full
    expect(demoHeartsFull(demoBlow(demoBlow(h, 2).hearts, 2).hearts)).toMatchObject({ gold: 2, lost: 0 })
  })
})
