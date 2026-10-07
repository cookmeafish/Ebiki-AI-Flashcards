// RAID POWERS (powers.js + raid.js raidStep/applyBandage, fight.js raidRating).
import { describe, it, expect } from 'vitest'
import { POWERS, POWER_IDS, LOADOUT_MAX, POWER_WINDOW, FURY_MULT, SHARPEN_BONUS, bossesBeaten, unlockedPowers, nextUnlock, shapeLoadout, toggleLoadout, isFightPower, powerUsable, powerAfterAnswer, fiftyFifty, powerHint } from './powers'
import { raidStep, applyBandage, raidToday, raidBossIndex, RAID_ORDER, shapeRaid, raidAttemptOutcome } from './raid'
import { newFight, raidRating } from './fight'

const typedQ = { kind: 'typed', prompt: 'Q?', accepted: ['perro'], alt: { choices: ['gato', 'perro', 'casa', 'sol'], answerIdx: 1 }, _cardId: 1 }
const trophies = (motifs) => motifs.map((motif) => ({ motif, date: '2026-10-01' }))

describe('unlocks: different bosses beaten, spread to the whole roster', () => {
  it('counts each boss once', () => {
    expect(bossesBeaten({ trophies: trophies(['chronos', 'chronos', 'banshee']) })).toBe(2)
    expect(bossesBeaten(null)).toBe(0)
  })
  it('unlock in order, strictly increasing, the last one with every boss of the roster beaten', () => {
    const at = POWER_IDS.map((id) => POWERS[id].unlock)
    expect(at).toEqual([...at].sort((a, b) => a - b))
    expect(new Set(at).size).toBe(at.length)
    expect(at[0]).toBe(1)
    expect(Math.max(...at)).toBe(RAID_ORDER.length)
    expect(unlockedPowers(0)).toEqual([])
    expect(unlockedPowers(1)).toEqual(['shield'])
    expect(unlockedPowers(RAID_ORDER.length)).toEqual(POWER_IDS)
    expect(nextUnlock(0)).toEqual({ id: 'shield', beaten: 1 })
    expect(nextUnlock(RAID_ORDER.length)).toBeNull()
  })
  it('no gap between unlocks is longer than 3 bosses (something to look forward to all the way)', () => {
    const at = [0, ...POWER_IDS.map((id) => POWERS[id].unlock)]
    for (let i = 1; i < at.length; i++) expect(at[i] - at[i - 1]).toBeLessThanOrEqual(3)
  })
  it('a win over a NEW boss can unlock; beating the same boss again cannot', () => {
    const D = '2026-10-01'
    const besieged = (beaten, motif) => ({ boss: raidBossIndex(motif), day: { date: D, hp: 30, damage: 29, attempts: 0, won: false }, trophies: trophies(beaten), siege: { boss: raidBossIndex(motif), hp: 30, damage: 29, hearts: 4, date: D } })
    const fresh = raidAttemptOutcome(besieged([], RAID_ORDER[0]), { date: D, damage: 5, due: 5, motif: RAID_ORDER[0] }).state
    expect(bossesBeaten(fresh)).toBe(1)
    const again = raidAttemptOutcome(besieged([RAID_ORDER[0]], RAID_ORDER[0]), { date: D, damage: 5, due: 5, motif: RAID_ORDER[0] }).state
    expect(bossesBeaten(again)).toBe(1)
  })
})

describe('the loadout: up to 3 brought, chosen by the player', () => {
  it('defaults to the first unlocked ones; keeps only known, unlocked, distinct ids', () => {
    expect(shapeLoadout(undefined, 5)).toEqual(['shield', 'fifty', 'wind'])
    expect(shapeLoadout(undefined, 1)).toEqual(['shield'])
    expect(shapeLoadout(['fury', 'shield', 'shield', 'nope', 'hint'], 12)).toEqual(['shield', 'hint'])
    expect(shapeLoadout(['a', 'b', 'c', 'd', 'e'].map(() => 'shield').concat(['fifty', 'wind', 'sharpen']), 26)).toHaveLength(LOADOUT_MAX)
    expect(shapeLoadout([], 26)).toEqual([]) // bringing none is a choice
  })
  it('toggles: off when in it, on when there is room and it is unlocked', () => {
    expect(toggleLoadout(['shield', 'fifty', 'wind'], 'fifty', 5)).toEqual(['shield', 'wind'])
    expect(toggleLoadout(['shield', 'fifty', 'wind'], 'sharpen', 8)).toEqual(['shield', 'fifty', 'wind']) // full
    expect(toggleLoadout(['shield', 'wind'], 'sharpen', 8)).toEqual(['shield', 'wind', 'sharpen'])
    expect(toggleLoadout(['shield'], 'fury', 8)).toEqual(['shield']) // locked
  })
  it('the Bandage and Steadfast are never fight buttons', () => {
    expect(isFightPower('bandage')).toBe(false)
    expect(isFightPower('steadfast')).toBe(false)
    expect(POWER_IDS.filter(isFightPower)).toHaveLength(POWER_IDS.length - 2)
  })
})

describe('using powers: each brought one once per fight, one per question', () => {
  const loadout = POWER_IDS
  const base = { q: typedQ, loadout, used: [] }
  it('only brought, unused powers, one per question', () => {
    expect(powerUsable('fifty', base)).toBe(true)
    expect(powerUsable('fifty', { ...base, loadout: ['shield'] })).toBe(false)
    expect(powerUsable('fifty', { ...base, used: ['fifty'] })).toBe(false)
    expect(powerUsable('shield', { ...base, used: ['fifty'] })).toBe(true) // others still work
    expect(powerUsable('fifty', { ...base, usedOnQ: true })).toBe(false)
    expect(powerUsable('bandage', base)).toBe(false)
    expect(powerUsable('steadfast', base)).toBe(false)
  })
  it('question aids never on an attack or an inserted question; Shield works there', () => {
    expect(powerUsable('fifty', { ...base, q: { ...typedQ, _attack: true } })).toBe(false)
    expect(powerUsable('hint', { ...base, q: { ...typedQ, _inserted: 'minion' } })).toBe(false)
    expect(powerUsable('shield', { ...base, q: { ...typedQ, _attack: true } })).toBe(true)
  })
  it('each power has its own condition', () => {
    expect(powerUsable('fifty', { ...base, asChoice: true })).toBe(true)
    expect(powerUsable('fifty', { ...base, q: { ...typedQ, alt: { choices: ['a', 'b'], answerIdx: 0 } } })).toBe(false)
    expect(powerUsable('hint', { ...base, q: { ...typedQ, accepted: [] } })).toBe(false)
    expect(powerUsable('wind', base)).toBe(false)
    expect(powerUsable('wind', { ...base, livesLost: 1 })).toBe(true)
    expect(powerUsable('shield', { ...base, armed: { shield: true } })).toBe(false)
    expect(powerUsable('ward', base)).toBe(false) // only against an attack
    expect(powerUsable('ward', { ...base, q: { ...typedQ, _attack: true } })).toBe(true)
    expect(powerUsable('focus', { ...base, q: { ...typedQ, _attack: true } })).toBe(false) // windows open on a raid question
    expect(powerUsable('fury', { ...base, asChoice: true })).toBe(false) // pays on typed answers only
    expect(powerUsable('momentum', { ...base, armed: { momentum: 2 } })).toBe(false)
  })
  it('50:50 keeps the answer and one wrong choice', () => {
    const v = fiftyFifty(typedQ.alt, () => 0.99)
    expect(v.choices).toHaveLength(2)
    expect(v.choices[v.answerIdx]).toBe('perro')
    expect(fiftyFifty({ choices: ['a'], answerIdx: 0 })).toBeNull()
  })
  it('the hint shows half of each word, more than the cue\'s first letter, never the whole word', () => {
    expect(powerHint('buenos días')).toBe('bue··· dí··')
    expect(powerHint('ir')).toBe('i·')
    expect(powerHint('a')).toBe('a')
    expect(powerHint("l'eau")).toBe("l'e··")
  })
})

describe('after an answer: what is spent, what counts down', () => {
  it('window powers count down on raid questions only, whatever the answer', () => {
    expect(powerAfterAnswer({ focus: POWER_WINDOW }, { kind: 'normal' }).armed.focus).toBe(POWER_WINDOW - 1)
    expect(powerAfterAnswer({ focus: 1 }, { kind: 'normal' }).armed.focus).toBe(0)
    expect(powerAfterAnswer({ focus: 2 }, { kind: 'attack' }).changed).toBe(false)
  })
  it('Shield, Sharpen and Ward are spent by their one effect', () => {
    expect(powerAfterAnswer({ shield: true }, { last: { shielded: true } }).armed.shield).toBe(false)
    expect(powerAfterAnswer({ shield: true }, { last: {} }).armed.shield).toBe(true)
    expect(powerAfterAnswer({ sharpen: true }, { last: { sharpened: true } }).armed.sharpen).toBe(false)
    expect(powerAfterAnswer({ ward: true }, { last: { warded: true }, kind: 'attack' })).toMatchObject({ armed: { ward: false }, proc: 'ward' })
  })
  it('names the power that did something (for its flourish)', () => {
    expect(powerAfterAnswer({ fury: 3 }, { last: { fury: true } }).proc).toBe('fury')
    expect(powerAfterAnswer({ siphon: 2 }, { last: { siphoned: true } }).proc).toBe('siphon')
    expect(powerAfterAnswer({}, { last: { fury: true } }).proc).toBeNull()
  })
})

describe('powers in the fight', () => {
  const opts = { need: 50, lives: 4, dayHp: 50, questions: [typedQ] }
  const clean = { verdict: 'clean', mode: 'typed' }
  it('an aided right answer strikes like a choice and is recorded as Hard', () => {
    const { next } = raidStep(newFight(), typedQ, { verdict: 'clean', mode: 'choice', aided: true }, opts)
    expect(next.damage).toBe(1)
    expect(raidRating({ verdict: 'clean', mode: 'choice', aided: true }).rating).toBe('hard')
    expect(raidRating({ verdict: 'clean', mode: 'typed', aided: true }, { interval: 60 }).rating).toBe('hard')
    expect(raidRating({ verdict: 'miss', aided: true }).rating).toBe('again')
  })
  it('Sharpen adds its bonus to a clean typed answer only', () => {
    expect(raidStep(newFight(), typedQ, clean, { ...opts, sharpen: true }).next.damage).toBe(2 + SHARPEN_BONUS)
    expect(raidStep(newFight(), typedQ, { verdict: 'glancing', mode: 'typed' }, { ...opts, sharpen: true }).next.last?.sharpened).toBeFalsy()
  })
  it('Sharpen damage is part of the strike: crossing a phase line on that strike', () => {
    const crossed = raidStep({ ...newFight(), damage: 7 }, typedQ, clean, { ...opts, need: 30, dayHp: 30, ability: 'scream', sharpen: true }).next
    expect(crossed.damage).toBe(9 + SHARPEN_BONUS)
    expect(crossed.phaseSeen).toBe(2)
  })
  it('a Shield takes the next lost heart', () => {
    const first = raidStep(newFight(), typedQ, { verdict: 'miss', mode: 'typed' }, { ...opts, shield: true }).next
    expect(first.livesLost).toBe(0)
    expect(first.last.shielded).toBe(true)
  })
  it('Focus: a glancing answer hits like a clean one and keeps the streak; a miss is still a miss', () => {
    const g = { verdict: 'glancing', mode: 'typed' }
    const plain = raidStep(newFight(), typedQ, g, opts).next
    const focused = raidStep(newFight(), typedQ, g, { ...opts, focus: true }).next
    expect(focused.damage).toBe(2)
    expect(focused.damage).toBeGreaterThan(plain.damage)
    expect(focused.last.focused).toBe(true)
    expect(focused.combo).toBe(1)
    expect(raidStep(newFight(), typedQ, { verdict: 'miss', mode: 'typed' }, { ...opts, focus: true }).next.livesLost).toBe(1)
    expect(raidRating({ verdict: 'glancing', mode: 'typed' }).rating).toBe('hard') // Anki keeps the real grade
  })
  it('Momentum: every clean answer crits; Fury: a clean typed answer deals double', () => {
    const m = raidStep(newFight(), typedQ, clean, { ...opts, momentum: true }).next
    expect(m.damage).toBe(4)
    expect(m.last.crit).toBe(true)
    const f = raidStep(newFight(), typedQ, clean, { ...opts, fury: true }).next
    expect(f.damage).toBe(2 * FURY_MULT)
    expect(raidStep(newFight(), typedQ, { verdict: 'clean', mode: 'choice' }, { ...opts, fury: true }).next.damage).toBe(1)
  })
  it('Siphon: a clean answer gives back one lost heart, never past full', () => {
    const hurt = { ...newFight(), livesLost: 2 }
    expect(raidStep(hurt, typedQ, clean, { ...opts, siphon: true }).next.livesLost).toBe(1)
    expect(raidStep(newFight(), typedQ, clean, { ...opts, siphon: true }).next.livesLost).toBe(0)
    expect(raidStep(hurt, typedQ, { verdict: 'glancing', mode: 'typed' }, { ...opts, siphon: true }).next.livesLost).toBe(2)
  })
  it('Ward: the attack it was raised against costs no hearts', () => {
    const atk = { ...typedQ, _attack: true }
    expect(raidStep(newFight(), atk, { verdict: 'miss', mode: 'typed' }, opts).next.livesLost).toBeGreaterThan(0)
    const w = raidStep(newFight(), atk, { verdict: 'miss', mode: 'typed' }, { ...opts, ward: true }).next
    expect(w.livesLost).toBe(0)
    expect(w.last.warded).toBe(true)
  })
})

describe('balance: useful, never broken', () => {
  const opts = { need: 999, lives: 9, dayHp: 999, questions: [typedQ] }
  const clean = { verdict: 'clean', mode: 'typed' }
  // Damage of POWER_WINDOW clean answers with a power vs without: the best damage power adds a few hits, not a fight.
  const windowDamage = (p) => { let s = newFight(); for (let i = 0; i < POWER_WINDOW; i++) s = raidStep(s, typedQ, clean, { ...opts, ...p }).next; return s.damage }
  it('no single power adds more than 8 damage over its window (late bosses have 56 to 120 health)', () => {
    const plain = windowDamage({})
    for (const p of [{ momentum: true }, { fury: true }, { focus: true }]) expect(windowDamage(p) - plain).toBeLessThanOrEqual(8)
  })
  it('later damage powers are worth more than earlier ones', () => {
    const plain = windowDamage({})
    const sharpen = SHARPEN_BONUS
    expect(windowDamage({ momentum: true }) - plain).toBeGreaterThan(sharpen)
    expect(windowDamage({ fury: true }) - plain).toBeGreaterThan(windowDamage({ momentum: true }) - plain)
  })
})

describe('the Bandage in the stored raid', () => {
  const D = '2026-10-01'
  const boss = raidBossIndex(RAID_ORDER[0])
  const beaten13 = trophies(RAID_ORDER.slice(0, 13))
  it('marks the siege; not twice a day, not before it is unlocked', () => {
    const s = raidToday({ boss, trophies: beaten13 }, D, 10)
    const b = applyBandage(s, D)
    expect(b.siege.bandage).toBe(D)
    expect(applyBandage(b, D)).toBeNull()
    expect(applyBandage(raidToday({ boss, trophies: trophies(RAID_ORDER.slice(0, 12)) }, D, 10), D)).toBeNull()
    expect(shapeRaid(b).siege.bandage).toBe(D)
  })
})
