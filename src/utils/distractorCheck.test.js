import { describe, it, expect } from 'vitest'
import { buildDistractorCheckPrompt, parseDistractorCheck, swapFlagged } from './distractorCheck'

const items = [
  { question: 'How do you say "good morning"?', answer: 'buenos días', options: ['bien dicho', 'buenos días', 'buen día', 'bajo dos'], meaning: 'good morning' },
  { question: 'Which port does SSH use?', answer: '22', options: ['21', '22', '23', '80'] },
]

describe('the option check', () => {
  it('asks about the WRONG options only, with the answer and its meaning, dash free', () => {
    const { system, user } = buildDistractorCheckPrompt(items, { isLanguage: true, learnLang: 'Spanish' })
    expect(user).toMatch(/Correct answer: buenos días \(it means: good morning\)/)
    expect(user).toMatch(/Wrong options: "bien dicho", "buen día", "bajo dos"/)
    expect(system).toMatch(/also accept/i)
    expect(`${system}${user}`).not.toMatch(/[—–]/)
  })
  it('reads the flagged options, only real wrong options of that question', () => {
    const got = parseDistractorCheck({ flagged: [{ i: 0, options: ['Buen día', 'buenos días', 'nope'] }, { i: 5, options: ['x'] }] }, items)
    expect([...got.get(0)]).toEqual(['buen día'])
    expect(got.has(1)).toBe(false)
    expect(parseDistractorCheck({ Flagged: [] }, items).size).toBe(0)
    expect(parseDistractorCheck('prose', items)).toBe(null)
  })
  it('swaps a flagged option for a spare in place, drops it while 2 wrong ones remain, else gives up', () => {
    const set = { choices: ['bien dicho', 'buenos días', 'buen día', 'bajo dos'], answerIdx: 1, spare: ['bello día'] }
    expect(swapFlagged(set, new Set(['buen día']))).toEqual({ choices: ['bien dicho', 'buenos días', 'bello día', 'bajo dos'], answerIdx: 1, spare: [] })
    expect(swapFlagged({ ...set, spare: [] }, new Set(['buen día']))).toEqual({ choices: ['bien dicho', 'buenos días', 'bajo dos'], answerIdx: 1, spare: [] })
    expect(swapFlagged({ ...set, spare: [] }, new Set(['buen día', 'bajo dos']))).toBe(null)
    expect(swapFlagged(set, new Set())).toBe(set)
  })
})
