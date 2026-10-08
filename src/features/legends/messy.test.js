// Real model replies are messy: strings where numbers were asked, a list of names where objects were asked, item
// numbers given as the item's own text, an answer key spread over a list. The parsers must keep what is usable.
import { describe, it, expect } from 'vitest'
import { parseAreaDetail, parseMapPlan } from './map'
import { parseQuestions, buildRaidPrompt } from './prompt'
import { parseEvidenceLevel } from '../kit/evidence'

const id = (s) => s
const items = (n) => Array.from({ length: n }, (_, i) => ({ kind: 'term', front: `word${i + 1}`, back: `meaning ${i + 1}` }))

describe('parseAreaDetail with messy replies', () => {
  it('reads a level that names its items by their front text instead of numbers', () => {
    const raw = {
      items: items(6),
      nodes: [
        { kind: 'learn', title: 'One', items: ['word1', 'Word2'] },
        { kind: 'learn', title: 'Two', items: ['word3', 'word4'] },
        { kind: 'rule', title: 'Three', items: ['5', 6] },
      ],
    }
    const d = parseAreaDetail(raw, id, { areaId: 'a' })
    const teach = d.nodes.filter((n) => ['learn', 'rule'].includes(n.kind))
    expect(teach[0].itemIds).toEqual(['a-i1', 'a-i2'])
    expect(teach[1].itemIds).toEqual(['a-i3', 'a-i4'])
    expect(teach[2].itemIds).toEqual(['a-i5', 'a-i6'])
  })

  it('keeps a back written as a list of lines', () => {
    const raw = { items: [{ front: 'port 443', back: ['HTTPS uses it.', 'Example: https://example.com'] }, ...items(4)] }
    const d = parseAreaDetail(raw, id, { areaId: 'a' })
    expect(d.items[0].back).toBe('HTTPS uses it.\nExample: https://example.com')
  })

  it('maps common item kind names onto the three kinds', () => {
    const raw = { items: [
      { kind: 'Grammar', front: 'ser vs estar', back: 'ser: identity' },
      { kind: 'principle', front: 'least privilege', back: 'grant the minimum' },
      { kind: 'procedure', front: 'preflight check', back: 'walk around the plane' },
      { kind: 'vocabulary', front: 'perro', back: 'dog' },
    ] }
    const d = parseAreaDetail(raw, id, { areaId: 'a' })
    expect(d.items.map((it) => it.kind)).toEqual(['rule', 'rule', 'skill', 'term'])
  })
})

describe('parseMapPlan with messy replies', () => {
  it('reads areas given as plain titles', () => {
    const plan = parseMapPlan({ areas: ['Ports and protocols', 'Network devices', 'Wireless', 'Cabling'] }, id)
    expect(plan.map((a) => a.title)).toEqual(['Ports and protocols', 'Network devices', 'Wireless', 'Cabling'])
    expect(new Set(plan.map((a) => a.motif)).size).toBe(4)
  })
})

describe('parseQuestions with messy replies', () => {
  it('finds the question list under another key', () => {
    const raw = { quiz: [{ type: 'choice', question: 'Which port does HTTPS use?', choices: ['443', '80', '21', '25'], answer: 0, target: 'port 443' }] }
    expect(parseQuestions(raw, id)).toHaveLength(1)
  })
})

describe('buildRaidPrompt for any subject', () => {
  it('tells a non-language raid which language to write in', () => {
    const p = buildRaidPrompt({ name: 'CompTIA A+', isLanguage: false, userLang: 'Spanish' }, [{ front: 'port 443', back: 'HTTPS' }])
    expect(p.user).toMatch(/Spanish/)
  })
})

describe('parseEvidenceLevel with messy replies', () => {
  it('reads a level and confidence written with words or units', () => {
    const r = parseEvidenceLevel({ level: '45 of 130', confidence: '60%', strengths: 'greetings, numbers', gaps: 'past tense' })
    expect(r.level).toBe(45)
    expect(r.confidence).toBeCloseTo(0.6)
    expect(r.strengths).toEqual(['greetings', 'numbers'])
    expect(r.gaps).toEqual(['past tense'])
  })
  it('still refuses a reply with no number', () => {
    expect(parseEvidenceLevel({ level: 'B1' })).toBeNull()
  })
})
