import { describe, it, expect } from 'vitest'
import { bossOdds, bossOutcome, forgivenMisses } from './BossArena'
import { buildTalkSystem, buildTalkHintPrompt, buildTalkScorePrompt, hintGivesAway, buildAreaPrompt, buildBossNamePrompt, parseBossName } from './prompt'
import { parseAreaDetail, setBossName } from './map'

const spanish = { name: 'Spanish', isLanguage: true, learnLang: 'Spanish', userLang: 'English', rules: '' }
const comptia = { name: 'CompTIA', isLanguage: false, learnLang: 'English', userLang: 'English', rules: '' }
const area = { id: 'a', title: 'Greetings', theme: 'Saying hello' }
const items = [{ id: 'i1', front: '¿Cómo estás?', back: 'How are you?' }, { id: 'i2', front: 'Mucho gusto (formal)', back: 'Nice to meet you' }]

describe('boss fight', () => {
  it('gives the boss as much health as right answers are needed to pass', () => {
    expect(bossOdds(15)).toEqual({ need: 11, allowed: 4, lives: 5, bonus: 0 }) // 11/15 = 73% >= 70%
    expect(bossOdds(14)).toEqual({ need: 10, allowed: 4, lives: 5, bonus: 0 })
    expect(bossOdds(1)).toEqual({ need: 1, allowed: 0, lives: 1, bonus: 0 })
    expect(bossOdds(0).need).toBe(1) // never a boss with no health
  })
  it('ends the fight on the last life or the last hit, exactly when the pass is decided', () => {
    expect(bossOutcome(14, 3, 4)).toBe('')        // one life left: 10 of 14 is still possible
    expect(bossOutcome(14, 3, 5)).toBe('lost')    // 9 of 14 at best: below 70%
    expect(bossOutcome(14, 10, 2)).toBe('won')
    for (let total = 1; total <= 30; total++) {
      const { need, lives } = bossOdds(total)
      expect((total - lives) / total).toBeLessThan(0.7)   // losing every life can never still pass
      expect(need / total).toBeGreaterThanOrEqual(0.7)    // emptying the health bar always passes
    }
  })
})

describe('talk steps', () => {
  it('plays the step scene and keeps the conversation moving', () => {
    const s = buildTalkSystem(spanish, area, items, { scene: 'Conversation with your uncle' })
    expect(s).toMatch(/PLAY that person/)
    expect(s).toMatch(/Conversation with your uncle/)
    expect(s).toMatch(/never ask again for something the learner already told you/)
    expect(buildTalkSystem(spanish, area, items)).not.toMatch(/scene/)
  })
  it('hints say what to do, never the words', () => {
    const p = buildTalkHintPrompt(spanish, area, items, [{ role: 'ebi', text: 'Hola, sobrino.' }], { scene: 'Your uncle', unused: ['Mucho gusto'] })
    expect(p.system).toMatch(/Never give the Spanish words/)
    expect(p.user).toMatch(/Partner: Hola, sobrino\./)
    expect(p.user).toMatch(/WITHOUT writing it\): Mucho gusto/)
    expect(hintGivesAway('Ask your uncle how he is doing.', spanish, items)).toBe(false)
    expect(hintGivesAway('Say "¿Cómo estás?" to him.', spanish, items)).toBe(true)
    expect(hintGivesAway('Try: mucho gusto!', spanish, items)).toBe(true) // the "(formal)" label is not part of the phrase
    expect(hintGivesAway('Say ¿Cómo estás?', comptia, items)).toBe(false) // general subjects: naming a term is fine
  })
  it('tells the scorer how many hints were used', () => {
    const history = [{ role: 'ebi', text: 'Hola' }, { role: 'me', text: 'Hola' }]
    expect(buildTalkScorePrompt(spanish, area, history, { hints: 2 }).user).toMatch(/asked for 2 hint/)
    expect(buildTalkScorePrompt(spanish, area, history).user).not.toMatch(/hint/)
  })
})

describe('boss names', () => {
  const clean = (s) => s
  const raw = { boss: '"El Relojero Tic-Tac"', items: [1, 2, 3, 4, 5].map((i) => ({ kind: 'term', front: `w${i}`, back: `b${i}` })), nodes: [] }
  it('comes with the area detail, without its quotes', () => {
    expect(parseAreaDetail(raw, clean, { areaId: 'x' }).bossName).toBe('El Relojero Tic-Tac')
    expect(parseAreaDetail({ ...raw, boss: undefined }, clean, { areaId: 'x' }).bossName).toBe('')
    expect(buildAreaPrompt(spanish, area).user).toMatch(/boss: a playful, memorable name/)
    expect(buildAreaPrompt(spanish, area).user).toMatch(/in English, 2 to 5 words/)
  })
  it('is made once for older areas, and never replaces a name', () => {
    const map = { areas: [{ id: 'a', title: 'Numbers', frozen: true }, { id: 'b', title: 'Food', bossName: 'Chef Hambre' }] }
    expect(setBossName(map, 'a', 'Tick Tock').areas[0].bossName).toBe('Tick Tock')
    expect(setBossName(map, 'b', 'Other').areas[1].bossName).toBe('Chef Hambre')
    expect(setBossName(map, 'a', '')).toBe(map)
    const p = buildBossNamePrompt(spanish, { title: 'Numbers', theme: 'Counting', items: [{ front: 'diez' }] })
    expect(p.user).toMatch(/It teaches: diez/)
    expect(parseBossName({ name: '«Tick Tock»' }, clean)).toBe('Tick Tock')
    expect(parseBossName(null, clean)).toBe('')
  })
})

describe('the Weak spots life in the fight', () => {
  it('is one more heart and one hit less', () => {
    expect(bossOdds(20)).toMatchObject({ need: 14, lives: 7 })
    expect(bossOdds(20, { bonus: 1 })).toMatchObject({ need: 13, lives: 8, bonus: 1 })
    expect(bossOutcome(20, 13, 7, { bonus: 1 })).toBe('won')
    expect(bossOutcome(20, 12, 8, { bonus: 1 })).toBe('lost')
    expect(forgivenMisses(20, 13, { bonus: 1 })).toBe(1)
    expect(forgivenMisses(20, 14, { bonus: 1 })).toBe(0) // won without needing it
  })
  it('asks 90% in a Legendary run', () => {
    expect(bossOdds(20, { pass: 0.9 })).toMatchObject({ need: 18, lives: 3 })
  })
})
