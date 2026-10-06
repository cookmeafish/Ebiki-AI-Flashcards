// RAID POWERS (powers.js + raid.js raidStep/applyBandage/applyRunPowers, fight.js raidRating).
import { describe, it, expect } from 'vitest'
import { POWERS, POWER_IDS, unlockedPowers, bagSize, nextUnlock, shapeBag, bagCount, rollDrops, updateBag, powerUsable, fiftyFifty, powerHint, SHARPEN_BONUS, DROP } from './powers'
import { raidStep, applyBandage, applyRunPowers, raidToday, raidBossIndex, RAID_ORDER, shapeRaid } from './raid'
import { newFight, raidRating } from './fight'

const seq = (...v) => { let i = 0; return () => v[i++ % v.length] }
const typedQ = { kind: 'typed', prompt: 'Q?', accepted: ['perro'], alt: { choices: ['gato', 'perro', 'casa', 'sol'], answerIdx: 1 }, _cardId: 1 }

describe('unlocks and the bag', () => {
  it('unlock with raid wins, in order; the bag grows at milestones', () => {
    expect(unlockedPowers(0)).toEqual([])
    expect(unlockedPowers(1)).toEqual(['shield'])
    expect(unlockedPowers(13)).toEqual(POWER_IDS)
    expect(bagSize(0)).toBe(3)
    expect(bagSize(13)).toBe(4)
    expect(bagSize(25)).toBe(5)
    expect(nextUnlock(0)).toEqual({ id: 'shield', wins: 1 })
    expect(nextUnlock(13)).toBeNull()
  })
  it('a stored bag keeps known powers and whole counts only', () => {
    expect(shapeBag({ shield: 2, fifty: '1', nope: 4, wind: -1, hint: 1.7 })).toEqual({ shield: 2, fifty: 1, hint: 1 })
    expect(shapeBag(null)).toEqual({})
  })
})

describe('drops (random, earned by effort)', () => {
  it('nothing before the first unlock', () => {
    expect(rollDrops({ wins: 0, answered: 15, won: true, bestStreak: 9 })).toEqual([])
  })
  it('one for a full run, one for a clean streak, one for a win; never past the bag', () => {
    expect(rollDrops({ wins: 1, answered: 15, rnd: () => 0 })).toEqual(['shield'])
    expect(rollDrops({ wins: 13, answered: 15, bestStreak: DROP.streak, won: true, rnd: () => 0 })).toHaveLength(3)
    expect(rollDrops({ wins: 13, answered: 4, runSize: 15, rnd: () => 0 })).toEqual([]) // a short run of a long setting
    expect(rollDrops({ wins: 13, answered: 5, runSize: 5, rnd: () => 0 })).toHaveLength(1) // a whole short run counts
    expect(rollDrops({ wins: 13, bag: { shield: 3 }, answered: 15, won: true, rnd: () => 0 })).toHaveLength(1) // 4 slots, 3 used
  })
  it('a rough run leans toward survival powers', () => {
    const count = (opts) => { let n = 0; for (let i = 0; i < 200; i++) { const r = rollDrops({ wins: 13, answered: 15, rnd: () => (i + 0.5) / 200, ...opts })[0]; if (POWERS[r].kind === 'survival') n++ } return n }
    expect(count({ livesLost: 4, hearts: 6 })).toBeGreaterThan(count({ livesLost: 0, hearts: 6 }))
  })
  it('the bag update spends what was used and adds what fits', () => {
    expect(updateBag({ shield: 1, fifty: 2 }, { used: ['fifty', 'shield'], drops: ['wind'], wins: 5 })).toEqual({ fifty: 1, wind: 1 })
    expect(updateBag({ shield: 3 }, { drops: ['wind', 'wind'], wins: 5 })).toEqual({ shield: 3 })
    expect(bagCount(updateBag({}, { used: ['shield'] }))).toBe(0)
  })
})

describe('using powers', () => {
  const base = { q: typedQ, bag: { fifty: 1, hint: 1, shield: 1, sharpen: 1, wind: 1 }, slots: 2 }
  it('respects the per-run cap and one power per question', () => {
    expect(powerUsable('fifty', base)).toBe(true)
    expect(powerUsable('fifty', { ...base, usedRun: 2 })).toBe(false)
    expect(powerUsable('fifty', { ...base, usedOnQ: true })).toBe(false)
    expect(powerUsable('fifty', { ...base, bag: {} })).toBe(false)
    expect(powerUsable('bandage', { ...base, bag: { bandage: 1 } })).toBe(false) // between runs only
  })
  it('question aids never on an attack or an inserted question; Shield works there', () => {
    expect(powerUsable('fifty', { ...base, q: { ...typedQ, _attack: true } })).toBe(false)
    expect(powerUsable('hint', { ...base, q: { ...typedQ, _inserted: 'minion' } })).toBe(false)
    expect(powerUsable('shield', { ...base, q: { ...typedQ, _attack: true } })).toBe(true)
  })
  it('each power has its own condition', () => {
    expect(powerUsable('fifty', { ...base, asChoice: true })).toBe(false)
    expect(powerUsable('fifty', { ...base, q: { ...typedQ, alt: { choices: ['a', 'b'], answerIdx: 0 } } })).toBe(false)
    expect(powerUsable('hint', { ...base, q: { ...typedQ, accepted: [] } })).toBe(false)
    expect(powerUsable('wind', base)).toBe(false) // no heart lost yet
    expect(powerUsable('wind', { ...base, livesLost: 1 })).toBe(true)
    expect(powerUsable('wind', { ...base, livesLost: 1, windUsed: true })).toBe(false)
    expect(powerUsable('shield', { ...base, armed: { shield: true } })).toBe(false)
  })
  it('50:50 keeps the answer and one wrong choice', () => {
    const v = fiftyFifty(typedQ.alt, () => 0.99)
    expect(v.choices).toHaveLength(2)
    expect(v.choices[v.answerIdx]).toBe('perro')
    expect(fiftyFifty({ choices: ['a'], answerIdx: 0 })).toBeNull()
  })
  it('the hint shows first letters only', () => {
    expect(powerHint('buenos días')).toBe('b····· d···')
  })
})

describe('powers in the fight', () => {
  const opts = { need: 50, lives: 4, dayHp: 50, questions: [typedQ] }
  it('an aided right answer strikes like a choice and is recorded as Hard', () => {
    const { next } = raidStep(newFight(), typedQ, { verdict: 'clean', mode: 'choice', aided: true }, opts)
    expect(next.damage).toBe(1)
    expect(raidRating({ verdict: 'clean', mode: 'choice', aided: true }).rating).toBe('hard')
    expect(raidRating({ verdict: 'clean', mode: 'typed', aided: true }, { interval: 60 }).rating).toBe('hard')
    expect(raidRating({ verdict: 'miss', aided: true }).rating).toBe('again')
  })
  it('Sharpen adds its bonus to a clean typed answer only', () => {
    expect(raidStep(newFight(), typedQ, { verdict: 'clean', mode: 'typed' }, { ...opts, sharpen: true }).next.damage).toBe(2 + SHARPEN_BONUS)
    expect(raidStep(newFight(), typedQ, { verdict: 'glancing', mode: 'typed' }, { ...opts, sharpen: true }).next.last?.sharpened).toBeFalsy()
  })
  it('a Shield takes the next lost heart, even after an earlier shield was used', () => {
    const first = raidStep(newFight(), typedQ, { verdict: 'miss', mode: 'typed' }, { ...opts, shield: true }).next
    expect(first.livesLost).toBe(0)
    expect(first.last.shielded).toBe(true)
    const second = raidStep(first, typedQ, { verdict: 'miss', mode: 'typed' }, { ...opts, shield: true }).next
    expect(second.livesLost).toBe(0)
    expect(raidStep(second, typedQ, { verdict: 'miss', mode: 'typed' }, opts).next.livesLost).toBe(1)
  })
})

describe('the bag in the stored raid', () => {
  const D = '2026-10-01'
  const boss = raidBossIndex(RAID_ORDER[0])
  const wins = Array.from({ length: 13 }, () => ({ motif: 'chronos', date: D }))
  it('a run spends its powers and keeps its drops', () => {
    const s = { boss, trophies: wins, powers: { shield: 1 } }
    expect(applyRunPowers(s, { used: ['shield'], drops: ['fifty'] }).powers).toEqual({ fifty: 1 })
  })
  it('a Bandage marks the siege and spends one; not twice a day, not without a boss out', () => {
    const s = { ...raidToday({ boss, trophies: wins, powers: { bandage: 2 } }, D, 10) }
    const b = applyBandage(s, D)
    expect(b.siege.bandage).toBe(D)
    expect(b.powers).toEqual({ bandage: 1 })
    expect(applyBandage(b, D)).toBeNull()
    expect(applyBandage({ boss, trophies: wins, powers: {} }, D)).toBeNull()
    expect(shapeRaid(b).siege.bandage).toBe(D)
  })
})
