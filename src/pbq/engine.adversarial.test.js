import { describe, it, expect } from 'vitest'
import { compilePbq, itemKey, parseSolverAnswer, compareToKey, gradePbq, pbqRatingScore, reshufflePbq, studentView } from './engine.js'

// Adversarial inputs: shapes and text real models send that the happy-path tests never cover.
const noShuffle = () => 0.999999
const base = { title: 'Do the thing', scenario: 'A realistic situation.' }
const allText = (pbq) => [pbq.title, pbq.scenario, ...(pbq.left || []), ...(pbq.right || []), ...(pbq.items || []), ...(pbq.categories || [])]

describe('model shapes that are not the documented ones', () => {
  it('pairs written as objects compile (left/right, term/definition)', () => {
    const r = compilePbq({ ...base, kind: 'matching', pairs: [
      { left: 'HTTP', right: '80' }, { left: 'HTTPS', right: '443' },
      { term: 'SSH', definition: '22' }, { term: 'DNS', definition: '53' },
    ] }, noShuffle)
    expect(r.ok).toBe(true)
    expect(r.pbq.left).toEqual(['HTTP', 'HTTPS', 'SSH', 'DNS'])
    expect(r.pbq.right).toEqual(['80', '443', '22', '53'])
  })

  it('numbers are items too (ports), never dropped', () => {
    const r = compilePbq({ ...base, kind: 'matching', pairs: [['HTTP', 80], ['HTTPS', 443], ['SSH', 22], ['DNS', 53]] }, noShuffle)
    expect(r.ok).toBe(true)
    expect(r.pbq.right).toEqual(['80', '443', '22', '53'])
  })

  it('steps written as objects compile; no "[object Object]" ever reaches the screen', () => {
    const r = compilePbq({ ...base, kind: 'ordering', steps: [{ step: 'Identify' }, { text: 'Contain' }, { text: 'Eradicate' }, { text: 'Recover' }] }, noShuffle)
    expect(r.ok).toBe(true)
    expect(r.pbq.items).toEqual(['Identify', 'Contain', 'Eradicate', 'Recover'])
    const junk = compilePbq({ ...base, kind: 'ordering', steps: [{ a: 1, b: 2 }, 'Contain', 'Eradicate', 'Recover'] }, noShuffle)
    if (junk.ok) expect(allText(junk.pbq).join(' ')).not.toMatch(/object Object/)
  })

  it('groups written as a list of {name, items} compile', () => {
    const r = compilePbq({ ...base, kind: 'categorize', groups: [
      { name: 'Malware', items: ['Worm', 'Trojan', 'Rootkit'] },
      { category: 'Social engineering', items: ['Phishing', 'Tailgating'] },
    ] }, noShuffle)
    expect(r.ok).toBe(true)
    expect(r.pbq.categories).toEqual(['Malware', 'Social engineering'])
    expect(r.pbq.items.length).toBe(5)
  })

  it('common kind spellings compile instead of costing a generation', () => {
    const groups = { A: ['a1', 'a2', 'a3'], B: ['b1', 'b2'] }
    expect(compilePbq({ ...base, kind: 'categorise', groups }, noShuffle).ok).toBe(true)
    expect(compilePbq({ ...base, kind: 'Categorization', groups }, noShuffle).ok).toBe(true)
    expect(compilePbq({ ...base, kind: 'sequence', steps: ['a', 'b', 'c', 'd'] }, noShuffle).ok).toBe(true)
    expect(compilePbq({ ...base, kind: 'match', pairs: [['a', '1'], ['b', '2'], ['c', '3'], ['d', '4']] }, noShuffle).ok).toBe(true)
    expect(compilePbq({ ...base, kind: 'essay' }).ok).toBe(false)
  })
})

describe('duplicates', () => {
  it('case, spacing and full-width forms are the same item', () => {
    expect(compilePbq({ ...base, kind: 'ordering', steps: ['Back up data', 'back  up DATA', 'Wipe', 'Reinstall'] }).ok).toBe(false)
    expect(itemKey('ＣＰＵ')).toBe(itemKey('CPU'))
    expect(compilePbq({ ...base, kind: 'matching', pairs: [['ＣＰＵ', 'brain'], ['CPU', 'also brain?'], ['RAM', 'memory'], ['SSD', 'storage']] }).ok).toBe(false)
  })

  it('a trailing period does not make a second item', () => {
    expect(compilePbq({ ...base, kind: 'ordering', steps: ['Identify', 'Identify.', 'Contain', 'Recover'] }).ok).toBe(false)
    expect(compilePbq({ ...base, kind: 'ordering', steps: ['识别威胁', '识别威胁。', '遏制', '恢复'] }).ok).toBe(false)
  })

  it('symbols still make different items', () => {
    const r = compilePbq({ ...base, kind: 'categorize', groups: { Languages: ['C', 'C++', 'C#'], Operators: ['<', '>'] } }, noShuffle)
    expect(r.ok).toBe(true)
  })

  it('CJK items: same text is a duplicate, different text is not', () => {
    expect(compilePbq({ ...base, kind: 'ordering', steps: ['识别', '遏制', '识别', '恢复'] }).ok).toBe(false)
    expect(compilePbq({ ...base, kind: 'ordering', steps: ['识别', '遏制', '根除', '恢复'] }).ok).toBe(true)
    // Japanese voicing marks are different words (か vs が)
    expect(compilePbq({ ...base, kind: 'ordering', steps: ['か', 'が', 'さ', 'ざ'] }).ok).toBe(true)
  })
})

describe('step numbers that give the order away', () => {
  const stripped = (steps) => compilePbq({ ...base, kind: 'ordering', steps }, noShuffle).pbq.items
  it('dash and parenthesis numbering is stripped', () => {
    expect(stripped(['Step 1 - Identify', 'Step 2 - Contain', 'Step 3 - Eradicate', 'Step 4 - Recover'])).toEqual(['Identify', 'Contain', 'Eradicate', 'Recover'])
    expect(stripped(['1 – Identify', '2 – Contain', '3 – Eradicate', '4 – Recover'])).toEqual(['Identify', 'Contain', 'Eradicate', 'Recover'])
    expect(stripped(['(1) Identify', '(2) Contain', '(3) Eradicate', '(4) Recover'])).toEqual(['Identify', 'Contain', 'Eradicate', 'Recover'])
    expect(stripped(['Step 1 Identify', 'Step 2 Contain', 'Step 3 Eradicate', 'Step 4 Recover'])).toEqual(['Identify', 'Contain', 'Eradicate', 'Recover'])
  })
  it('real content starting with numbers is kept', () => {
    expect(stripped(['2FA enrollment', 'Password reset', 'Account review', 'Access removal'])).toEqual(['2FA enrollment', 'Password reset', 'Account review', 'Access removal'])
    expect(stripped(['10-minute backup window', 'Snapshot', 'Verify', 'Restore'])).toEqual(['10-minute backup window', 'Snapshot', 'Verify', 'Restore'])
    expect(stripped(['1-2 hours of logs', '3-4 hours of logs', '5-6 hours of logs', '7-8 hours of logs'])).toEqual(['1-2 hours of logs', '3-4 hours of logs', '5-6 hours of logs', '7-8 hours of logs'])
  })
})

describe('solver echoes', () => {
  it('a CJK echo with full-width punctuation still resolves', () => {
    const r = compilePbq({ ...base, kind: 'ordering', steps: ['识别威胁', '遏制感染', '清除恶意软件', '恢复系统'] }, noShuffle)
    const assign = parseSolverAnswer(r.pbq, { order: ['识别威胁。', '遏制感染', '清除恶意软件', '恢复系统'] })
    expect(compareToKey(r.pbq, assign).match).toBe(true)
  })
  it('a full-width echo resolves to its item', () => {
    const r = compilePbq({ ...base, kind: 'matching', pairs: [['CPU', 'Processor'], ['RAM', 'Memory'], ['SSD', 'Storage'], ['GPU', 'Graphics']] }, noShuffle)
    const assign = parseSolverAnswer(r.pbq, { pairs: [['ＣＰＵ', 'Processor'], ['RAM', 'Memory'], ['SSD', 'Storage'], ['GPU', 'Graphics']] })
    expect(compareToKey(r.pbq, assign).match).toBe(true)
  })
})

describe('chance-corrected categorize rating', () => {
  const pbq = compilePbq({ ...base, kind: 'categorize', groups: { A: ['a1', 'a2'], B: ['b1', 'b2'], C: ['c1', 'c2'] } }, noShuffle).pbq
  it('even groups: a dump scores 0, perfect 1, never negative or above 1', () => {
    const dump = gradePbq(pbq, pbq.answer.map(() => 0)).fraction
    expect(pbqRatingScore(pbq, dump)).toBe(0)
    expect(pbqRatingScore(pbq, 1)).toBe(1)
    expect(pbqRatingScore(pbq, 0)).toBe(0)
    for (let f = 0; f <= 1; f += 0.125) { const s = pbqRatingScore(pbq, f); expect(s).toBeGreaterThanOrEqual(0); expect(s).toBeLessThanOrEqual(1) }
  })
  it('an unanswered exercise scores 0', () => {
    expect(pbqRatingScore(pbq, gradePbq(pbq, null).fraction)).toBe(0)
  })
  it('matching and ordering are not corrected', () => {
    expect(pbqRatingScore({ kind: 'ordering', answer: [0, 1, 2, 3] }, 0.5)).toBe(0.5)
  })
})

describe('reshuffles', () => {
  it('a saved matching is never laid out solved, across many reshuffles', () => {
    const r = compilePbq({ ...base, kind: 'matching', pairs: [['a', '1'], ['b', '2'], ['c', '3'], ['d', '4']] })
    for (let i = 0; i < 300; i++) {
      const p = reshufflePbq(r.pbq)
      expect(p.answer.every((a, li) => a === li)).toBe(false)
      expect(compareToKey(p, p.answer).match).toBe(true)
      expect(p.left.map((l, li) => [l, p.right[p.answer[li]]])).toEqual(r.pbq.left.map((l, li) => [l, r.pbq.right[r.pbq.answer[li]]]))
    }
  })
  it('a saved ordering keeps under 40% of the steps in place', () => {
    const r = compilePbq({ ...base, kind: 'ordering', steps: ['s1', 's2', 's3', 's4', 's5'] })
    for (let i = 0; i < 300; i++) {
      const p = reshufflePbq(r.pbq)
      expect(p.answer.filter((pos, ii) => pos === ii).length / p.answer.length).toBeLessThan(0.4)
      expect([...p.items].sort((a, b) => p.answer[p.items.indexOf(a)] - p.answer[p.items.indexOf(b)])).toEqual(['s1', 's2', 's3', 's4', 's5'])
    }
  })
  it('a damaged saved exercise is returned untouched, never crashes', () => {
    const bad = { kind: 'matching', left: ['a'], right: ['1', '2'], answer: [0] }
    expect(reshufflePbq(bad)).toBe(bad)
    expect(reshufflePbq(null)).toBe(null)
  })
  it('studentView of a reshuffled exercise still has no key', () => {
    const r = compilePbq({ ...base, kind: 'categorize', groups: { A: ['a1', 'a2', 'a3'], B: ['b1', 'b2'] } })
    const v = studentView(reshufflePbq(r.pbq))
    expect(v.answer).toBeUndefined()
    expect(JSON.stringify(v)).not.toMatch(/answer/)
  })
})
