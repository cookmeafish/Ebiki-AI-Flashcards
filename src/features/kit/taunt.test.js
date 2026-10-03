import { describe, it, expect } from 'vitest'
import { phrasesOf, sharesPhrase, pushRecent, buildTauntPrompt, parseTaunt, tauntRepeats, islandVoice, RECENT_MAX } from './taunt'

describe('the overlap check', () => {
  it('finds a shared run of three words, ignoring case and punctuation', () => {
    expect(sharesPhrase('That weld will not hold today.', ['Your weld will NOT hold, friend'])).toBe(true)
    expect(sharesPhrase('That weld cracked again.', ['Your weld will not hold'])).toBe(false)
  })
  it('two shared words are fine', () => {
    expect(sharesPhrase('the wrong card again', ['pick the wrong one'])).toBe(false)
  })
  it('works for scripts without spaces (runs of four characters)', () => {
    expect(sharesPhrase('你又选错了答案吧', ['我看你又选错了'])).toBe(true)
    expect(sharesPhrase('你又错了', ['今天天气很好'])).toBe(false)
  })
  it('a line shorter than a phrase never matches', () => {
    expect(phrasesOf('so close').size).toBe(0)
    expect(sharesPhrase('so close', ['so close'])).toBe(false)
  })
  it('a reply echoing the sample line is a repeat too', () => {
    expect(tauntRepeats('Ladies and gentlemen, watch this', [], 'Ladies and gentlemen, watch closely')).toBe(true)
    expect(tauntRepeats('A fresh new line here', ['old line said before'], 'sample line text')).toBe(false)
  })
})

describe('recent lines', () => {
  it('keeps the newest first, deduped, capped', () => {
    let l = []
    for (let i = 0; i < 20; i++) l = pushRecent(l, `line ${i}`)
    expect(l.length).toBe(RECENT_MAX)
    expect(l[0]).toBe('line 19')
    expect(pushRecent(['a', 'b'], 'b')).toEqual(['b', 'a'])
  })
})

describe('the taunt prompt', () => {
  const base = { voice: 'You are the Forge Titan.', rules: 'RULES', bossName: 'Titan', subjectName: 'Pilot license', question: 'What is V1?', expected: 'Decision speed', answer: 'rotation speed', userLang: 'Spanish' }
  it('works for any subject and answers in the learner language', () => {
    const { system, user } = buildTauntPrompt(base)
    expect(system).toContain('Spanish')
    expect(system).toContain('RULES')
    expect(user).toContain('Pilot license')
    expect(user).toContain('rotation speed')
    expect(user).not.toMatch(/translate/i)
  })
  it('sends the recent lines as never-repeat and names a rejected retry', () => {
    const { user } = buildTauntPrompt({ ...base, recent: ['That weld will not hold.'], retry: 'That weld will not hold again.' })
    expect(user).toContain('Never repeat them')
    expect(user).toContain('That weld will not hold.')
    expect(user).toContain('completely different')
  })
  it('a language mode names the learned language', () => {
    expect(buildTauntPrompt({ ...base, isLanguage: true, learnLang: 'French' }).user).toContain('French')
  })
})

describe('parseTaunt', () => {
  it('keeps the first line, strips quotes and labels', () => {
    expect(parseTaunt('"That seam cracked."\nextra')).toBe('That seam cracked.')
    expect(parseTaunt('Taunt: Nope.')).toBe('Nope.')
    expect(parseTaunt('')).toBe('')
    expect(parseTaunt('x'.repeat(400))).toBe('')
  })
  it('runs the cleaner (no dashes, no shrimp)', () => {
    expect(parseTaunt('a — b', (s) => s.replace(/—/g, ','))).toBe('a , b')
  })
})

describe('island voice', () => {
  it('builds a persona from the boss name and island', () => {
    const v = islandVoice({ bossName: 'El Relojero', areaTitle: 'Numbers and time' })
    expect(v).toContain('El Relojero')
    expect(v).toContain('Numbers and time')
  })
})
