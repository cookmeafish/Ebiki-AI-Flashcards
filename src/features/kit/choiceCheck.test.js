import { describe, it, expect } from 'vitest'
import { choiceCheckItems, applyChoiceCheck, checkChoices } from './choiceCheck'

const typed = { kind: 'typed', prompt: 'How do you say "good morning"?', accepted: ['buenos días'], alt: { choices: ['bien dicho', 'buenos días', 'buen día', 'bajo dos'], answerIdx: 1, spare: ['bello día'] } }
const choice = { kind: 'choice', prompt: 'Which port does SSH use?', choices: ['21', '22', '23', '80'], answerIdx: 1 }
const open = { kind: 'typed', prompt: 'Explain', open: true, accepted: [] }

describe('the option check in fights and quizzes', () => {
  it('asks about every question with options (typed alt and choice), never an open one', () => {
    const { at, items } = choiceCheckItems([typed, open, choice])
    expect(at).toEqual([0, 2])
    expect(items[0]).toMatchObject({ answer: 'buenos días', options: typed.alt.choices })
  })
  it('swaps a flagged option for a spare, or marks the options unusable', () => {
    const fixes = applyChoiceCheck([typed, choice], [0, 1], new Map([[0, new Set(['buen día'])], [1, new Set(['21', '23'])]]))
    expect(fixes.get(0).alt.choices).toEqual(['bien dicho', 'buenos días', 'bello día', 'bajo dos'])
    expect(fixes.get(1)).toBe(null) // one wrong option left: unusable (the caller rewrites the question)
    const one = applyChoiceCheck([choice], [0], new Map([[0, new Set(['21'])]]))
    expect(one.get(0).choices).toEqual(['22', '23', '80'])
  })
  it('one call for the batch; a failed call changes nothing', async () => {
    const ai = { call: async () => '{"flagged":[{"i":0,"options":["buen día"]}]}', json: (r) => JSON.parse(r) }
    const got = await checkChoices(ai, [typed, choice], { isLanguage: true, job: 'raid.check' })
    expect(got.get(0).alt.choices).toContain('bello día')
    expect(got.has(1)).toBe(false)
    const broken = { call: async () => { throw new Error('down') }, json: (r) => r }
    expect((await checkChoices(broken, [typed], {})).size).toBe(0)
  })
})
