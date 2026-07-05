import { describe, it, expect } from 'vitest'
import { compilePbq, checkCitations, studentView, parseSolverAnswer, gradePbq, compareToKey } from './engine.js'

// Deterministic rng: identity shuffle (Fisher–Yates with rng()=0 swaps i with 0... use a
// sequence that keeps order stable: rng returning values so j===i every time → rng = (i+? )
// Simpler: rng that always returns just-below-1 makes j===i (no swap) at every step.
const noShuffle = () => 0.999999

const MATCHING = {
  kind: 'matching',
  title: 'Match each attack to its description',
  scenario: 'Your SOC has flagged four alerts. Classify each one.',
  pairs: [
    ['Phishing', 'Fraudulent email tricks a user into revealing credentials'],
    ['Vishing', 'Voice call impersonation extracts sensitive data'],
    ['Smishing', 'Malicious SMS lures a user to a fake site'],
    ['Whaling', 'Spear phishing aimed at an executive'],
  ],
  citations: [{ quote: 'Whaling targets high-profile executives' }],
}

const ORDERING = {
  kind: 'ordering',
  title: 'Order the incident response steps',
  scenario: 'A ransomware infection was just confirmed on a workstation.',
  steps: ['Preparation', 'Identification', 'Containment', 'Eradication', 'Recovery'],
}

const CATEGORIZE = {
  kind: 'categorize',
  title: 'Sort each control into its type',
  scenario: 'An auditor asks you to classify the controls below.',
  groups: {
    Technical: ['Firewall', 'Disk encryption', 'IDS'],
    Administrative: ['Security policy', 'Awareness training'],
  },
}

describe('compilePbq', () => {
  it('compiles matching with a consistent key under shuffle', () => {
    for (let i = 0; i < 10; i++) {
      const r = compilePbq(MATCHING)
      expect(r.ok).toBe(true)
      const { pbq } = r
      expect(pbq.left).toHaveLength(4)
      expect(pbq.right).toHaveLength(4)
      // every left item's key must point at its original partner wherever it landed
      pbq.left.forEach((l, li) => {
        const original = MATCHING.pairs.find(p => p[0] === l)
        expect(pbq.right[pbq.answer[li]]).toBe(original[1])
      })
    }
  })

  it('compiles ordering: answer maps each shuffled item to its correct position', () => {
    for (let i = 0; i < 10; i++) {
      const { ok, pbq } = compilePbq(ORDERING)
      expect(ok).toBe(true)
      pbq.items.forEach((item, ii) => {
        expect(ORDERING.steps[pbq.answer[ii]]).toBe(item)
      })
    }
  })

  it('compiles categorize: answer maps each item to its authored category', () => {
    for (let i = 0; i < 10; i++) {
      const { ok, pbq } = compilePbq(CATEGORIZE)
      expect(ok).toBe(true)
      expect(pbq.categories).toEqual(['Technical', 'Administrative'])
      pbq.items.forEach((item, ii) => {
        const cat = pbq.categories[pbq.answer[ii]]
        expect(CATEGORIZE.groups[cat]).toContain(item)
      })
    }
  })

  it('rejects wrong sizes, duplicates, and junk', () => {
    expect(compilePbq(null).ok).toBe(false)
    expect(compilePbq({ kind: 'simulation' }).ok).toBe(false)
    expect(compilePbq({ ...MATCHING, pairs: MATCHING.pairs.slice(0, 2) }).ok).toBe(false)
    expect(compilePbq({ ...MATCHING, pairs: [...MATCHING.pairs.slice(0, 3), ['Phishing', 'Duplicate left']] }).ok).toBe(false)
    expect(compilePbq({ ...ORDERING, steps: [...ORDERING.steps.slice(0, 4), 'preparation'] }).ok).toBe(false) // dup ignoring case
    expect(compilePbq({ ...CATEGORIZE, groups: { OnlyOne: ['a', 'b', 'c', 'd', 'e'] } }).ok).toBe(false)
    expect(compilePbq({ ...CATEGORIZE, groups: { A: ['x', 'y', 'z', 'w', 'v'], B: [] } }).ok).toBe(false)
    expect(compilePbq({ ...MATCHING, title: '' }).ok).toBe(false)
  })
})

describe('checkCitations', () => {
  const source = 'Chapter 2. Social engineering: Whaling targets high-profile executives, while smishing uses SMS messages.'
  it('passes when every quote appears (normalization-insensitive)', () => {
    expect(checkCitations({ citations: [{ quote: 'whaling TARGETS high-profile executives' }] }, source).ok).toBe(true)
  })
  it('fails on fabricated quotes or no usable citations', () => {
    const r = checkCitations({ citations: [{ quote: 'Whaling is harmless in most cases' }] }, source)
    expect(r.ok).toBe(false)
    expect(r.missing).toHaveLength(1)
    expect(checkCitations({ citations: [] }, source).ok).toBe(false)
    expect(checkCitations({}, source).ok).toBe(false)
  })
})

describe('studentView', () => {
  it('never leaks the answer key', () => {
    for (const raw of [MATCHING, ORDERING, CATEGORIZE]) {
      const { pbq } = compilePbq(raw)
      const v = studentView(pbq)
      expect(v.answer).toBeUndefined()
      expect(JSON.stringify(v)).not.toContain('"answer"')
    }
  })
})

describe('parseSolverAnswer + compareToKey', () => {
  it('accepts a perfect text-based matching answer (case/accents ignored)', () => {
    const { pbq } = compilePbq(MATCHING, noShuffle)
    const solved = { pairs: pbq.left.map((l, li) => [l.toUpperCase(), pbq.right[pbq.answer[li]]]) }
    const assign = parseSolverAnswer(pbq, solved)
    expect(compareToKey(pbq, assign).match).toBe(true)
  })

  it('flags a disagreement with readable diffs', () => {
    const { pbq } = compilePbq(MATCHING, noShuffle)
    const solved = { pairs: pbq.left.map((l, li) => [l, pbq.right[pbq.answer[(li + 1) % pbq.left.length]]]) }
    const cmp = compareToKey(pbq, parseSolverAnswer(pbq, solved))
    expect(cmp.match).toBe(false)
    expect(cmp.diffs.length).toBeGreaterThan(0)
    expect(cmp.diffs[0]).toContain('key says')
  })

  it('handles ordering answers given as ordered text', () => {
    const { pbq } = compilePbq(ORDERING)
    const correctSeq = [...pbq.items].sort((a, b) => pbq.answer[pbq.items.indexOf(a)] - pbq.answer[pbq.items.indexOf(b)])
    expect(compareToKey(pbq, parseSolverAnswer(pbq, { order: correctSeq })).match).toBe(true)
    expect(compareToKey(pbq, parseSolverAnswer(pbq, { order: [...correctSeq].reverse() })).match).toBe(false)
  })

  it('handles categorize answers and treats garbage as mismatch, never a crash', () => {
    const { pbq } = compilePbq(CATEGORIZE)
    const groups = {}
    pbq.items.forEach((item, ii) => {
      const cat = pbq.categories[pbq.answer[ii]]
      ;(groups[cat] = groups[cat] || []).push(item)
    })
    expect(compareToKey(pbq, parseSolverAnswer(pbq, { groups })).match).toBe(true)
    expect(compareToKey(pbq, parseSolverAnswer(pbq, { unrelated: true })).match).toBe(false)
    expect(compareToKey(pbq, parseSolverAnswer(pbq, null)).match).toBe(false)
    expect(compareToKey(pbq, null).match).toBe(false)
  })
})

describe('gradePbq', () => {
  it('scores partial answers per item', () => {
    const { pbq } = compilePbq(MATCHING, noShuffle)
    const assign = [...pbq.answer]
    assign[0] = (assign[0] + 1) % pbq.right.length // one wrong
    assign[1] = null                                // one unanswered
    const g = gradePbq(pbq, assign)
    expect(g.total).toBe(4)
    expect(g.correct).toBe(2)
    expect(g.perItem[0].correct).toBe(false)
    expect(g.perItem[0].expectedText).toBe(pbq.right[pbq.answer[0]])
    expect(g.perItem[1].gotText).toBe(null)
    expect(g.fraction).toBe(0.5)
  })

  it('grades a skipped (null) answer as all wrong', () => {
    const { pbq } = compilePbq(ORDERING)
    const g = gradePbq(pbq, null)
    expect(g.correct).toBe(0)
    expect(g.fraction).toBe(0)
  })
})
