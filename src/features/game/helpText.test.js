import { describe, it, expect } from 'vitest'
import { gameHelpText } from './helpText'

describe('gameHelpText', () => {
  it('describes today, the streak, quests and the league', () => {
    const today = '2026-10-01'
    const player = { id: 'p1', name: 'Ana', goalXp: 30, days: { [today]: { m1: { xp: 12, cards: 4, quests: ['xp:30', 'cards:10'] } }, '2026-09-30': { m1: { xp: 40 } } } }
    const text = gameHelpText(player, [{ id: 'p2', name: 'Bo', days: {} }], today)
    expect(text).toContain('12 XP of a daily goal of 30 XP (18 XP to go)')
    expect(text).toContain('Streak: 2 days')
    expect(text).toContain("NOT Anki's review streak")
    expect(text).toContain('Friends on this data folder: Bo')
    expect(text).not.toMatch(/[—–]/)
  })
  it('is empty without a player and survives junk', () => {
    expect(gameHelpText(null)).toBe('')
    expect(() => gameHelpText({ id: 'x', days: { bad: null } }, [])).not.toThrow()
  })
})
