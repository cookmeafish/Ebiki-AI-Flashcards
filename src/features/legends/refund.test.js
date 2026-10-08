import { describe, it, expect } from 'vitest'
import { newFight, strike, refundFor, applyRefund, strikeCost, fightOutcome, DAMAGE, refundRunningFight } from './fight'
import { regradeItem } from './map'
import { raidStep } from './raid'

describe('refunds (a re-check or an appeal says the answer was right)', () => {
  it('a typed miss overturned to clean gives the heart back and deals the clean damage', () => {
    const before = newFight()
    const after = strike(before, { verdict: 'miss', mode: 'typed' })
    expect(after.livesLost).toBe(1)
    const r = refundFor({ to: 'clean' }, strikeCost(before, after))
    expect(r).toEqual({ lives: 1, damage: DAMAGE.clean, shield: false })
    const s = applyRefund(after, { ...r, from: 'miss', to: 'clean' })
    expect(s.livesLost).toBe(0)
    expect(s.damage).toBe(DAMAGE.clean)
    expect(s.misses).toBe(0)
    expect(s.clean).toBe(1)
    expect(s.last).toMatchObject({ kind: 'refund', healedLives: 1, damage: DAMAGE.clean })
    expect(s.refundN).toBe(1)
  })
  it('glancing overturned to clean deals only the difference, no heart', () => {
    const before = newFight()
    const after = strike(before, { verdict: 'glancing', mode: 'typed' })
    const r = refundFor({ to: 'clean' }, strikeCost(before, after))
    expect(r).toEqual({ lives: 0, damage: DAMAGE.clean - DAMAGE.glancing, shield: false })
    const s = applyRefund(after, { ...r, from: 'glancing', to: 'clean' })
    expect(s.glancing).toBe(0)
    expect(s.clean).toBe(1)
  })
  it('a missed attack overturned gives both hearts back and the counter', () => {
    const before = newFight()
    const after = strike(before, { verdict: 'miss', mode: 'typed', attack: true })
    const r = refundFor({ kind: 'attack', to: 'clean' }, strikeCost(before, after))
    expect(r.lives).toBe(2)
    expect(r.damage).toBe(DAMAGE.counter)
  })
  it('a weak item adds its bonus; a choice deals the safe strike', () => {
    expect(refundFor({ to: 'clean', weak: true }, { lives: 1 }).damage).toBe(DAMAGE.clean + DAMAGE.weak)
    expect(refundFor({ to: 'clean', mode: 'choice' }, { lives: 1 }).damage).toBe(DAMAGE.choice)
  })
  it('a shielded miss gives no heart (none was lost), the damage, and the Shield back', () => {
    const before = newFight()
    const after = strike(before, { verdict: 'miss', mode: 'typed' }, { shield: true })
    expect(after.livesLost).toBe(0)
    expect(after.shieldUsed).toBe(true)
    const r = refundFor({ to: 'clean' }, strikeCost(before, after))
    expect(r).toEqual({ lives: 0, damage: DAMAGE.clean, shield: true })
    const s = applyRefund(after, { ...r, from: 'miss', to: 'clean' })
    expect(s.shieldUsed).toBe(false)
    expect(s.last.shieldBack).toBe(true)
    // The Shield takes the next lost heart again.
    expect(strike(s, { verdict: 'miss', mode: 'typed' }, { shield: true }).livesLost).toBe(0)
  })
  it('a power window up on the overturned answer counts (Fury, Momentum, Focus), never on a choice', () => {
    const miss = { lives: 1, damage: 0 }
    expect(refundFor({ to: 'clean' }, { ...miss, boost: { fury: 2 } }).damage).toBe(DAMAGE.clean * 2)
    expect(refundFor({ to: 'clean' }, { ...miss, boost: { momentum: true } }).damage).toBe(DAMAGE.clean + DAMAGE.crit * 2)
    expect(refundFor({ to: 'glancing' }, { ...miss, boost: { focus: true } }).damage).toBe(DAMAGE.clean)
    expect(refundFor({ to: 'glancing' }, { ...miss, boost: { fury: 2 } }).damage).toBe(DAMAGE.glancing)
    expect(refundFor({ to: 'clean', mode: 'choice' }, { ...miss, boost: { fury: 2, momentum: true } }).damage).toBe(DAMAGE.choice)
    expect(refundFor({ to: 'clean', kind: 'attack' }, { ...miss, boost: { fury: 2 } }).damage).toBe(DAMAGE.counter)
  })
  it('the refund matches what a right answer would have dealt in that window', () => {
    for (const [verdict, flag, opts] of [['clean', 'fury', { fury: 2 }], ['clean', 'momentum', { momentum: true }], ['glancing', 'focus', { focus: true }]]) {
      const right = strike(newFight(), { verdict, mode: 'typed' }, opts)
      const before = newFight()
      const after = strike(before, { verdict: 'miss', mode: 'typed' }, opts)
      const r = refundFor({ to: verdict }, { ...strikeCost(before, after), boost: { [flag]: opts[flag] } })
      expect(r.damage).toBe(right.damage)
    }
  })
  it('never gives back more hearts than were lost; a refund can win the fight', () => {
    const s = applyRefund(newFight(), { lives: 3, damage: 5 })
    expect(s.livesLost).toBe(0)
    expect(fightOutcome(s, { need: 5, lives: 3 })).toBe('won')
  })
  it('an upheld verdict refunds nothing', () => {
    expect(refundFor({ to: 'miss' }, { lives: 1 })).toEqual({ lives: 0, damage: 0, shield: false })
  })
})

describe('regradeItem (a won appeal after the result)', () => {
  const map = { areas: [{ id: 'a1', items: [{ id: 'i1', seen: 3, right: 1, bossRight: 0 }] }] }
  it('moves right and bossRight by the difference', () => {
    const m = regradeItem(map, 'a1', 'i1', 'again', 'good', true)
    expect(m.areas[0].items[0]).toMatchObject({ seen: 3, right: 2, bossRight: 1 })
  })
  it('hard counts right but not toward gold', () => {
    expect(regradeItem(map, 'a1', 'i1', 'again', 'hard', true).areas[0].items[0]).toMatchObject({ right: 2, bossRight: 0 })
  })
  it('no change returns the same map', () => {
    expect(regradeItem(map, 'a1', 'i1', 'good', 'good')).toBe(map)
    expect(regradeItem(map, 'a1', 'zz', 'again', 'good')).toBe(map)
  })
})

describe('raidStep tags attacks for the second look', () => {
  const opts = { ability: '', need: 30, lives: 3, dayHp: 30, pos: 0, questions: [] }
  it('a miss attack carries the answer id (a re-check can cancel it)', () => {
    const { groups } = raidStep(newFight(), { prompt: 'p', accepted: ['a'], _cardId: 1 }, { verdict: 'miss', mode: 'typed', aid: 'x1' }, opts)
    expect(groups[0].insert[0]).toMatchObject({ _attack: true, _attackOf: 'x1' })
  })
  it('a glancing follow-up still being written is a placeholder', () => {
    const { groups } = raidStep(newFight(), { prompt: 'p', accepted: ['a'], _cardId: 1 }, { verdict: 'glancing', mode: 'typed', aid: 'x2', attackQ: { pending: 'x2' } }, opts)
    expect(groups[0].insert[0]).toMatchObject({ _attack: true, _pending: 'x2', prompt: '' })
  })
  it('under Focus a glancing slip hits clean and does not come back as an attack', () => {
    const q = { prompt: 'p', accepted: ['a'], _cardId: 1 }
    const { next, groups } = raidStep(newFight(), q, { verdict: 'glancing', mode: 'typed', aid: 'x3', attackQ: { prompt: 'fix', accepted: ['b'] } }, { ...opts, focus: true })
    expect(next.last.focused).toBe(true)
    expect(groups).toEqual([])
    // A miss under Focus still comes back.
    expect(raidStep(newFight(), q, { verdict: 'miss', mode: 'typed', aid: 'x4' }, { ...opts, focus: true }).groups.length).toBe(1)
  })
  it('names the power windows up on the answer (for a refund), none on attacks', () => {
    const q = { prompt: 'p', accepted: ['a'], _cardId: 1 }
    expect(raidStep(newFight(), q, { verdict: 'miss', mode: 'typed' }, { ...opts, fury: true, momentum: true, focus: true }).boost).toEqual({ fury: 2, momentum: true, focus: true })
    expect(raidStep(newFight(), q, { verdict: 'miss', mode: 'choice' }, { ...opts, fury: true, momentum: true }).boost).toEqual({})
    expect(raidStep(newFight(), { ...q, _attack: true }, { verdict: 'miss', mode: 'typed' }, { ...opts, fury: true }).boost).toEqual({})
  })
})

describe('refundRunningFight (the one refund path NodeRun and RaidRun share)', () => {
  const odds = { need: 10, lives: 3 }
  it('gives back what the overturned verdict cost while the fight runs', () => {
    const before = newFight()
    const after = strike(before, { verdict: 'miss', mode: 'typed' })
    const next = refundRunningFight(after, odds, { first: 'miss', mode: 'typed', cost: strikeCost(before, after) }, 'clean')
    expect(next.livesLost).toBe(0)
    expect(next.damage).toBe(DAMAGE.clean)
    expect(next.last.kind).toBe('refund')
  })
  it('changes nothing in a decided fight, without odds, or when the verdict cost nothing', () => {
    const lost = { ...newFight(), livesLost: 3 }
    expect(refundRunningFight(lost, odds, { first: 'miss', cost: { lives: 1 } }, 'clean')).toBe(null)
    expect(refundRunningFight(newFight(), null, { first: 'miss', cost: { lives: 1 } }, 'clean')).toBe(null)
    expect(refundRunningFight(newFight(), odds, { kind: 'inserted', first: 'miss', cost: {} }, 'clean')).toBe(null)
  })
})
