import { describe, it, expect } from 'vitest'
import { newFight, strike } from '../fight'
import { raidStep } from '../raid'
import { MAX_INSERTED } from './_rules'
import { simulateRaid, ALL_CLEAN, ALL_MISS_HARSH, mixed } from './_sim'
import mod from './lich'

const K = mod.K
const qs = Array.from({ length: 15 }, (_, i) => ({ kind: 'typed', prompt: `p${i}`, _cardId: 100 + i }))
const clean = { verdict: 'clean', mode: 'typed' }
const miss = { verdict: 'miss', mode: 'typed' }
// Raid answers through raidStep (as RaidRun does), returning the state and every insert group.
function play(answers, { need = 100, lives = 9 } = {}) {
  let s = newFight()
  const groups = []
  answers.forEach((a, i) => {
    const r = raidStep(s, qs[i], a, { ability: 'minions', need, lives, dayHp: need, questions: qs, pos: i })
    s = r.next
    groups.push(...r.groups.filter((g) => g.insert[0]._inserted))
  })
  return { s, groups }
}

describe('raid ability: lich (minions)', () => {
  it('the candle burns down one per raid answer; at 0 the earliest right card is raised, asked next', () => {
    const { s, groups } = play(Array(K.every).fill(clean))
    expect(groups).toHaveLength(1)
    expect(groups[0].at).toBe(K.every - 1 + 1)
    expect(groups[0].insert[0]._cardId).toBe(100)
    expect(groups[0].insert[0]._inserted).toBe('minion')
    expect(s.ab.raiseIn).toBe(K.every)
    expect(s.ab.minions).toBe(1)
    expect(s.last.fx).toBe('raise')
  })
  it('never a missed card and never the card just answered; with none yet the candle stays out', () => {
    const { s, groups } = play([...Array(K.every - 1).fill(miss), clean])
    expect(groups).toHaveLength(0)
    expect(s.ab.raiseIn).toBe(0)
    const r = play([...Array(K.every - 1).fill(miss), clean, clean])
    expect(r.groups).toHaveLength(1)
    expect(r.groups[0].insert[0]._cardId).toBe(100 + K.every - 1)
  })
  it('a destroyed minion bursts for K.burst; an escaped one heals K.heal, floored, and costs no heart', () => {
    let s = strike(newFight(), { ...clean, inserted: 'minion', key: 1 }, { ability: 'minions', need: 50, lives: 3 })
    expect(s.damage).toBe(K.burst)
    expect(s.last.fx).toBe('burst')
    s = strike({ ...newFight(), damage: 5 }, { ...miss, inserted: 'minion', key: 1 }, { ability: 'minions', need: 50, lives: 3 })
    expect(s.damage).toBe(5 - K.heal)
    expect(s.livesLost).toBe(0)
    expect(s.last.fx).toBe('escape')
    s = strike({ ...newFight(), damage: 1 }, { ...miss, inserted: 'minion', key: 1 }, { ability: 'minions', need: 50, lives: 3 })
    expect(s.damage).toBe(0) // floored: never below what this attempt started with
  })
  it(`at most K.max minions, inside the shared MAX_INSERTED (${MAX_INSERTED})`, () => {
    const { s, groups } = play(Array(15).fill(clean))
    expect(groups.length).toBe(K.max)
    expect(s.insertedN).toBeLessThanOrEqual(MAX_INSERTED)
    const full = play(Array(15).fill(clean))
    expect(full.s.ab.raised).toHaveLength(K.max)
  })
  it('no minion is raised by the final blow', () => {
    // K.every clean answers deal 2 each plus a critical on the third: exactly the health
    const dealt = Array.from({ length: K.every }, (_, i) => 2 + ((i + 1) % 3 === 0 ? 1 : 0)).reduce((a, b) => a + b, 0)
    const { groups } = play(Array(K.every).fill(clean), { need: dealt })
    expect(groups).toHaveLength(0)
  })
  it('fair: all right wins, all wrong (minions missed too) never does', () => {
    for (const n of [5, 8, 15]) {
      expect(simulateRaid('minions', { n, answer: ALL_CLEAN }).outcome).toBe('won')
      expect(simulateRaid('minions', { n, answer: ALL_MISS_HARSH }).outcome).not.toBe('won')
      const r = simulateRaid('minions', { n, answer: mixed(0.3) })
      expect(r.log.filter((e) => e.q._inserted).length).toBeLessThanOrEqual(K.max)
    }
  })
})
