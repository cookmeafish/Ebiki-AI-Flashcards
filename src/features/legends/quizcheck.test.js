// THE OPTION CHECK in Legends quizzes (generate.js makeQuiz + applyOptionCheck): a question keeps at least one fair
// wrong option (two options are still a choice), a typed question whose every wrong option was flagged stays typed,
// only a choice-only question with no fair option leaves, and the set is topped back up.
import { describe, it, expect, vi } from 'vitest'
import { applyChoiceCheck } from '../kit/choiceCheck'
import { parseAiJson } from '../../utils/aiJson'

vi.mock('./store', () => ({
  updateMap: vi.fn(), peekMap: () => null,
  readStep: async () => ({ ok: true, value: null }), readStepAny: async () => null, saveStep: async () => true,
  stepSig: (items) => (items || []).map((it) => it.id).join(','),
}))
vi.mock('../kit/learnerStore', () => ({ learnerLevelLine: async () => '' }))

const { makeQuiz, applyOptionCheck } = await import('./generate')

const typedQ = (prompt, right, wrong) => ({ kind: 'typed', prompt, accepted: [right], open: false, alt: { choices: [right, ...wrong], answerIdx: 0 } })
const choiceQ = (prompt, right, wrong) => ({ kind: 'choice', prompt, choices: [right, ...wrong], answerIdx: 0 })

describe('applyOptionCheck', () => {
  it('keeps a question with ONE fair wrong option left (a 2-option choice)', () => {
    const qs = [typedQ('Say dog', 'perro', ['can', 'chucho', 'gato'])]
    const fixes = applyChoiceCheck(qs, [0], new Map([[0, new Set(['can', 'chucho'])]]))
    const { kept, dropped } = applyOptionCheck(qs, fixes)
    expect(dropped).toBe(0)
    expect(kept[0].alt.choices).toEqual(['perro', 'gato'])
  })
  it('a typed question with every wrong option flagged stays, typed only; a choice-only one leaves', () => {
    const qs = [typedQ('Say dog', 'perro', ['can', 'chucho', 'pichicho']), choiceQ('Which is a dog?', 'perro', ['can', 'chucho', 'pichicho']), choiceQ('Cat?', 'gato', ['perro', 'casa', 'mesa'])]
    const all = new Set(['can', 'chucho', 'pichicho'])
    const fixes = applyChoiceCheck(qs, [0, 1], new Map([[0, all], [1, all]]))
    const { kept, dropped } = applyOptionCheck(qs, fixes)
    expect(dropped).toBe(1)
    expect(kept).toHaveLength(2)
    expect(kept[0].kind).toBe('typed')
    expect(kept[0].alt).toBeUndefined()
    expect(kept[1].prompt).toBe('Cat?')
  })
  it('no verdict: nothing changes', () => {
    const qs = [choiceQ('Cat?', 'gato', ['perro', 'casa', 'mesa'])]
    expect(applyOptionCheck(qs, new Map())).toEqual({ kept: qs, dropped: 0 })
  })
})

describe('makeQuiz tops the set back up after the option check', () => {
  const items = ['perro', 'gato', 'casa', 'mesa'].map((w, i) => ({ id: `i${i}`, kind: 'word', front: w, back: ['dog', 'cat', 'house', 'table'][i] }))
  const area = { id: 'a1', title: 'Home', theme: 'home', items, nodes: [{ id: 'n1', kind: 'practice', itemIds: items.map((it) => it.id) }] }
  const node = area.nodes[0]
  const q = (n, target) => ({ question: `Question ${n} about ${target}?`, choices: [target, 'zapato', 'camisa', 'bufanda'], answer: target, target })
  it('a choice question whose every option is flagged goes, and a new one takes its place', async () => {
    const quizCalls = []
    const ai = {
      json: parseAiJson,
      clean: (s) => s,
      call: async (system, user, { job }) => {
        if (job === 'legends.quiz') {
          quizCalls.push(user)
          if (quizCalls.length === 1) return JSON.stringify(Array.from({ length: 8 }, (_, i) => q(i, items[i % 4].front)).map((x, i) => (i === 2 ? { ...x, question: 'FLAGME which one?' } : x)))
          return JSON.stringify([q('new-1', 'mesa'), q('new-2', 'casa')])
        }
        if (/multiple-choice options before a learner/.test(system)) {
          const rows = user.split(/\n(?=\d+\. Question:)/)
          const flagged = rows.map((r, i) => (/FLAGME/.test(r) ? { i, options: [...r.split('Wrong options:')[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]) } : null)).filter(Boolean)
          return JSON.stringify({ flagged })
        }
        return JSON.stringify({ bad: [] }) // the review pass: everything fine
      },
    }
    const ctx = { ai, t: (k) => k, subject: { name: 'Spanish', isLanguage: false, learnLang: 'Spanish', userLang: 'English', rules: '', knowledge: () => '' }, study: { rules: () => ({ questionLadder: false }) } }
    const out = await makeQuiz(ctx, 1, area, node)
    expect(out).toHaveLength(8)
    expect(out.some((x) => /FLAGME/.test(x.prompt))).toBe(false)
    expect(out.some((x) => /new-1/.test(x.prompt))).toBe(true)
    expect(quizCalls).toHaveLength(2) // one refill call, for the emptied place only
  })
})
