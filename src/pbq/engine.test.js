import { describe, it, expect } from 'vitest'
import { compilePbq, checkCitations, studentView, parseSolverAnswer, gradePbq, compareToKey, iconFor, buildGeneratorPrompt, pbqRatingScore, reshufflePbq } from './engine.js'

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
  it('a quote that is mostly punctuation proves nothing', () => {
    // Its 12 characters normalized to "" or one letter, which every source "contains".
    expect(checkCitations({ citations: [{ quote: '............' }] }, source).ok).toBe(false)
    expect(checkCitations({ citations: [{ quote: '- - - - - - s' }] }, source).ok).toBe(false)
  })
})

describe('studentView', () => {
  it('never leaks the answer key (nor icons — the blind solver is text-only)', () => {
    for (const raw of [MATCHING, ORDERING, CATEGORIZE]) {
      const { pbq } = compilePbq({ ...raw, icons: { Phishing: '🎣' } })
      const v = studentView(pbq)
      expect(v.answer).toBeUndefined()
      expect(v.icons).toBeUndefined()
      expect(JSON.stringify(v)).not.toContain('"answer"')
    }
  })
})

describe('icons', () => {
  it('keeps valid emoji keyed by normalized text, drops junk', () => {
    const { pbq } = compilePbq({
      ...MATCHING,
      icons: {
        'PHISHING': '🎣',                    // case-insensitive key
        'Vishing': '📞',
        'Whaling': 'not-an-emoji',           // letters → dropped
        'Smishing': '🧑‍🤝‍🧑🧑‍🤝‍🧑🧑‍🤝‍🧑',  // over-long → dropped
        'Unknown item': '❓',                // unknown key is kept in the map but never looked up
      },
    })
    expect(iconFor(pbq, 'phishing')).toBe('🎣')
    expect(iconFor(pbq, 'Vishing')).toBe('📞')
    expect(iconFor(pbq, 'Whaling')).toBe(null)
    expect(iconFor(pbq, 'Smishing')).toBe(null)
  })

  it('compiles fine with no icons at all', () => {
    const { ok, pbq } = compilePbq(MATCHING)
    expect(ok).toBe(true)
    expect(iconFor(pbq, 'Phishing')).toBe(null)
    expect(iconFor(null, 'x')).toBe(null)
  })

  it('icons never affect grading or solver matching', () => {
    const { pbq } = compilePbq({ ...MATCHING, icons: { Phishing: '🎣' } })
    const solved = { pairs: pbq.left.map((l, li) => [l, pbq.right[pbq.answer[li]]]) }
    expect(compareToKey(pbq, parseSolverAnswer(pbq, solved)).match).toBe(true)
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

describe('buildGeneratorPrompt', () => {
  it('always carries the relevance gate (off-subject cards must be skipped, never bridged)', () => {
    const p = buildGeneratorPrompt({ subject: 'CompTIA Security+', front: 'sombrero', back: 'hat', lang: 'English', knowledgeContext: null, priorFailure: null })
    expect(p).toContain('"kind":"skip"')
    expect(p).toContain('RELEVANCE CHECK')
    expect(p).toContain('word-association bridge')
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

describe('real shuffles never show the exercise already solved', () => {
  it('an ordering is never presented in the correct order', () => {
    for (let i = 0; i < 500; i++) {
      const { pbq } = compilePbq(ORDERING)
      expect(gradePbq(pbq, pbq.items.map((_, k) => k)).correct).toBeLessThan(pbq.items.length)
    }
  })
})

describe('pbqRatingScore / reshufflePbq', () => {
  it('chance-corrects categorize so dumping everything in the biggest group rates Again', () => {
    const pbq = { kind: 'categorize', categories: ['A', 'B'], items: ['1', '2', '3', '4', '5'], answer: [0, 0, 0, 1, 1] }
    const dump = gradePbq(pbq, [0, 0, 0, 0, 0])
    expect(dump.fraction).toBeCloseTo(0.6)
    expect(pbqRatingScore(pbq, dump.fraction)).toBe(0)
    expect(pbqRatingScore(pbq, 1)).toBe(1)
    expect(pbqRatingScore({ kind: 'ordering', answer: [1, 0] }, 0.5)).toBe(0.5)
  })
  it('reshuffles a saved exercise without changing its key', () => {
    const m = { kind: 'matching', left: ['a', 'b', 'c', 'd'], right: ['C', 'A', 'D', 'B'], answer: [1, 3, 0, 2] }
    const r = reshufflePbq(m)
    m.left.forEach((l, i) => expect(r.right[r.answer[i]]).toBe(m.right[m.answer[i]]))
    const o = { kind: 'ordering', items: ['s3', 's1', 's4', 's2'], answer: [2, 0, 3, 1] }
    const ro = reshufflePbq(o)
    ro.items.forEach((it, i) => expect(ro.answer[i]).toBe(o.answer[o.items.indexOf(it)]))
    const c = { kind: 'categorize', categories: ['X', 'Y'], items: ['p', 'q', 'r'], answer: [0, 1, 0] }
    const rc = reshufflePbq(c)
    rc.items.forEach((it, i) => expect(rc.answer[i]).toBe(c.answer[c.items.indexOf(it)]))
  })
})

describe('item identity keeps symbols; numbered steps', () => {
  it('C++, C# and C are three different items', () => {
    const r = compilePbq({ kind: 'matching', title: 't', scenario: 's', pairs: [['C++', 'a'], ['C#', 'b'], ['C', 'c'], ['Go', 'd']] })
    expect(r.ok).toBe(true)
  })
  it('symbol-only categories are not empty', () => {
    const r = compilePbq({ kind: 'categorize', title: 't', scenario: 's', groups: [{ name: '<', items: ['1 < 2', '3 < 9'] }, { name: '>', items: ['5 > 2', '9 > 1'] }] })
    expect(r.errors || []).not.toContain('duplicate/empty categories: (empty), (empty)')
  })
  it('strips step numbers that give the order away', () => {
    const r = compilePbq({ kind: 'ordering', title: 't', scenario: 's', steps: ['1. Identify', '2. Theory', '3. Test', '4. Plan'] })
    expect(r.ok).toBe(true)
    expect(r.pbq.items.every((x) => !/^\d/.test(x))).toBe(true)
  })
  it('strips CJK and space-less numbering too', () => {
    for (const steps of [['1、识别问题', '2、收集信息', '3、制定方案', '4、实施方案'], ['1.识别问题', '2.收集信息', '3.制定方案', '4.实施方案'],
      ['１．問題を特定', '２．情報を集める', '３．案を作る', '４．実行する'], ['①問題を特定', '②情報を集める', '③案を作る', '④実行する'],
      ['第一步：识别问题', '第二步：收集信息', '第三步：制定方案', '第四步：实施方案'], ['1)Identify', '2)Theory', '3)Test', '4)Plan']]) {
      const r = compilePbq({ kind: 'ordering', title: 't', scenario: 's', steps })
      expect(r.ok).toBe(true)
      expect(r.pbq.items.every((x) => !/^[\d０-９①-⑳第]/.test(x))).toBe(true)
    }
  })
  it('keeps decimals and "e.g." intact', () => {
    const r = compilePbq({ kind: 'ordering', title: 't', scenario: 's', steps: ['1.5 cups flour', '2.5 ml oil', 'e.g. mix', 'Bake'] })
    expect(r.ok).toBe(true)
    expect(r.pbq.items).toEqual(expect.arrayContaining(['1.5 cups flour', '2.5 ml oil', 'e.g. mix']))
  })
})

describe('item identity across scripts and icons', () => {
  it('keeps vowel signs: two Hindi words are not duplicates', () => {
    const r = compilePbq({ kind: 'matching', title: 't', scenario: 's', pairs: [['कम', 'less'], ['काम', 'work'], ['नाम', 'name'], ['घर', 'house']] })
    expect(r.ok).toBe(true)
  })
  it('a new exercise never lends "C" its icon to "C++"', () => {
    const r = compilePbq({ kind: 'matching', title: 't', scenario: 's', pairs: [['C', 'a'], ['C++', 'b'], ['Go', 'c'], ['Rust', 'd']], icons: { C: '🅲' } })
    expect(r.ok).toBe(true)
    expect(iconFor(r.pbq, 'C')).toBe('🅲')
    expect(iconFor(r.pbq, 'C++')).toBe(null)
  })
  it('an exercise saved before item keys still finds its loose-keyed icons', () => {
    expect(iconFor({ icons: { firewall: '🧱' } }, 'Firewall.')).toBe('🧱')
  })
})

describe('solver answers against symbol-only items', () => {
  // A symbol item ("<", ">") normalizes to "", and every string "contains" the empty string: an unknown solver echo
  // resolved to the symbol item, so a solver answer that named nothing could still agree with the key.
  const pbq = { kind: 'matching', title: 't', scenario: 's', left: ['Less than', 'Greater than', 'Equal', 'Not equal'], right: ['<', 'Bigger', 'Same', 'Different'], answer: [0, 1, 2, 3] }
  it('an echo that names no item resolves to nothing', () => {
    const assign = parseSolverAnswer(pbq, { pairs: [['Less than', 'a made-up thing']] })
    expect(assign[0]).toBe(null)
  })
  it('a symbol item still resolves when the solver echoes it', () => {
    const assign = parseSolverAnswer(pbq, { pairs: [['Less than', '<'], ['Greater than', 'Bigger']] })
    expect(assign.slice(0, 2)).toEqual([0, 1])
  })
})
