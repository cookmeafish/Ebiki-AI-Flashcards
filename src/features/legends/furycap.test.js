import { describe, it, expect } from 'vitest'
import { POWER_WINDOW, FURY_MULT } from './powers'
import { raidStep, RAID_ABILITY, RAID_ORDER, applyRaidAttempt, raidToday, raidBossIndex, raidCardIndex, SIEGE_RULE, raidWhere } from './raid'
import { POWERS, POWER_IDS, STEADFAST_HEARTS } from './powers'
import { newFight, strike, refundFor } from './fight'

// Powers vs abilities (the owner: useful, never broken): Fury multiplies the strike, not an ability's burst.
const qs = Array.from({ length: 30 }, (_, i) => ({ kind: 'typed', prompt: 'q' + i, accepted: ['a'], _cardId: 1000 + i }))
const clean = { verdict: 'clean', mode: 'typed' }
const run = (ability, furyAt) => {
  let s = newFight()
  const base = { ability, need: 999, lives: 9, dayHp: 999, questions: qs }
  for (let i = 0; i < 18; i++) {
    const fury = furyAt >= 0 && i >= furyAt && i < furyAt + POWER_WINDOW
    s = raidStep(s, qs[i], clean, { ...base, pos: i, fury }).next
  }
  return s.damage
}

describe('Fury with every raid boss ability', () => {
  it('a Fury window adds at most 8 damage over plain play, whatever the boss and wherever the window falls', () => {
    const worst = {}
    for (const m of RAID_ORDER) {
      const ab = RAID_ABILITY[m]
      const plain = run(ab, -1)
      let max = 0
      for (let at = 0; at <= 15; at++) max = Math.max(max, run(ab, at) - plain)
      worst[m] = max
      expect(max, m).toBeLessThanOrEqual(8)
    }
    if (process.env.FURY) console.warn('FURYWORST', JSON.stringify(worst))
  })

  it('a slip Focus made hit clean is multiplied too', () => {
    const glance = { verdict: 'glancing', mode: 'typed' }
    const focused = strike(newFight(), glance, { focus: true }).damage
    const both = strike(newFight(), glance, { focus: true, fury: FURY_MULT })
    expect(both.damage).toBe(focused * FURY_MULT)
    expect(both.last.fury).toBe(true)
    // Without Focus a slip stays a slip: Fury does nothing.
    expect(strike(newFight(), glance, { fury: FURY_MULT }).last.fury).toBeFalsy()
    // An overturned slip under Focus + Fury is refunded what it would have dealt.
    expect(refundFor({ to: 'glancing' }, { damage: 0, boost: { focus: true, fury: FURY_MULT } }).damage).toBe(focused * FURY_MULT)
  })
})

describe('a rally tells the ability (onRally)', () => {
  it('the Chimera head split saved for the day shrinks with the bar after a rally', () => {
    const date = '2026-10-07'
    const boss = raidBossIndex('chimera')
    let state = raidToday({ boss, day: null, trophies: [], siege: null }, date, 0)
    const hearts = state.siege.hearts
    // A run deals 10 and loses every heart: the boss rallies back 5, the bar reads 5.
    const out = applyRaidAttempt(state, date, 10, { hurt: [4, 4, 2] }, { livesLost: hearts })
    expect(out.rallied).toBe(5)
    const saved = out.state.day.ab.hurt
    expect(saved.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(out.state.siege.damage)
    expect(saved[0]).toBeGreaterThanOrEqual(saved[2])
  })
  it('a run that did not fall keeps the split as it was', () => {
    const date = '2026-10-07'
    const state = raidToday({ boss: raidBossIndex('chimera'), day: null, trophies: [], siege: null }, date, 0)
    const out = applyRaidAttempt(state, date, 10, { hurt: [4, 4, 2] }, { livesLost: 0 })
    expect(out.state.day.ab.hurt).toEqual([4, 4, 2])
  })
})

describe('Sharpen and Siphon follow Focus', () => {
  const opts = { need: 999, lives: 9, dayHp: 999, questions: qs }
  const glance = { verdict: 'glancing', mode: 'typed' }
  it('a slip Focus makes hit clean spends Sharpen and pays its bonus', () => {
    const r = raidStep(newFight(), qs[0], glance, { ...opts, focus: true, sharpen: true }).next
    expect(r.last.sharpened).toBe(true)
    expect(raidStep(newFight(), qs[0], glance, { ...opts, sharpen: true }).next.last.sharpened).toBeFalsy()
  })
  it('Siphon gives a heart back on a slip Focus made clean', () => {
    const hurt = { ...newFight(), livesLost: 1 }
    expect(raidStep(hurt, qs[0], glance, { ...opts, focus: true, siphon: true }).next.livesLost).toBe(0)
    expect(raidStep(hurt, qs[0], glance, { ...opts, siphon: true }).next.livesLost).toBe(1)
  })
})

describe('raid odds and ends', () => {
  it('the card number of a question is read from 2, "2", "Card 2" or "#2"', () => {
    expect(raidCardIndex(2)).toBe(1)
    expect(raidCardIndex('2')).toBe(1)
    expect(raidCardIndex('Card 2')).toBe(1)
    expect(raidCardIndex('#12')).toBe(11)
    for (const bad of [0, -1, 1.5, '', 'none', null, undefined]) expect(raidCardIndex(bad)).toBe(-1)
  })
  it('the siege rule for Help takes every power number from powers.js', () => {
    for (const id of POWER_IDS) expect(SIEGE_RULE).toContain(` ${POWERS[id].unlock}`)
    expect(SIEGE_RULE).toContain(`last ${POWER_WINDOW} questions`)
    expect(SIEGE_RULE).toContain(`gives ${STEADFAST_HEARTS} extra hearts`)
  })
  it('no "no hearts left today" stage is left (a fall rallies)', () => {
    expect(raidWhere({ view: 'hearts' })).toBe('the daily raid against the raid boss')
  })
})
