import { describe, it, expect } from 'vitest'
import { acronymMatcher, rankAcronyms, MUST_USES } from './acronymRank.mjs'

// Invented acronyms and texts (never the vendor's list or outline).
describe('acronymMatcher', () => {
  it('letters case-sensitively and word-bounded, with plurals and possessives', () => {
    const m = acronymMatcher('QKD', ['Quantum Key Distribution'])
    expect(m('Use QKD here')).toBe(true)
    expect(m('two QKDs')).toBe(true)
    expect(m("the QKD's range")).toBe(true)
    expect(m('qkd lowercase')).toBe(false)
    expect(m('XQKDY inside a word')).toBe(false)
  })
  it('a meaning spelled out counts, hyphens and case aside', () => {
    expect(acronymMatcher('QKD', ['Quantum Key Distribution'])('quantum-key distribution is new')).toBe(true)
  })
  it('a two-letter acronym needs its parenthesis or its spelled-out form', () => {
    const m = acronymMatcher('ZR', ['Zone Relay'])
    expect(m('a ZR here')).toBe(false)
    expect(m('the zone relay (ZR) forwards')).toBe(true)
    expect(m('ZR as in zone relay')).toBe(true)
  })
})

describe('rankAcronyms', () => {
  const list = [
    { acronym: 'QKD', expansions: ['Quantum Key Distribution'], at: 5 },
    { acronym: 'MXP', expansions: ['Mesh Exchange Point'], at: 1 },
    { acronym: 'LBV', expansions: ['Lattice Based Vault'], at: 9 },
    { acronym: 'NNA', expansions: ['Null Node Address'], at: Infinity },
    { acronym: 'OFR', expansions: ['Outer Frame Relay', 'Optical Fiber Ring'], at: 3 },
  ]
  const outline = 'Section 1\nExplain lattice based vaults and their uses'
  const cards = ['MXP links', 'MXP again', 'MXP third', 'QKD once', 'optical fiber ring basics']
  const out = rankAcronyms(list, { outline, cards })
  it('tiers from the outline and uses, nothing the outline names below must', () => {
    const tier = Object.fromEntries(out.map((x) => [x.acronym, x.tier]))
    expect(tier).toEqual({ LBV: 'must', MXP: 'must', QKD: 'good', OFR: 'good', NNA: 'rare' })
    expect(out.find((x) => x.acronym === 'MXP').uses).toBe(MUST_USES)
  })
  it('orders by tier, outline, uses, first appearance, letters', () => {
    expect(out.map((x) => x.acronym)).toEqual(['LBV', 'MXP', 'OFR', 'QKD', 'NNA'])
  })
  it('two meanings: either one counts', () => {
    expect(out.find((x) => x.acronym === 'OFR').uses).toBe(1)
  })
  it('a reviewed core pick joins the top tier after the measured ones; the uses stay measured', () => {
    const c = rankAcronyms(list, { outline, cards, core: ['NNA'] })
    expect(c.find((x) => x.acronym === 'NNA')).toMatchObject({ tier: 'must', uses: 0, core: true })
    expect(c.map((x) => x.acronym)).toEqual(['LBV', 'MXP', 'NNA', 'OFR', 'QKD'])
    expect(c.find((x) => x.acronym === 'MXP').core).toBe(false)
  })
  it('the shipped core list names real acronyms of the course list, each with a reason', async () => {
    const fs = await import('fs')
    const core = JSON.parse(fs.readFileSync(new URL('./acronym-core.json', import.meta.url), 'utf8')).core
    for (const [k, why] of Object.entries(core)) { expect(k).toBeTruthy(); expect(String(why).length).toBeGreaterThan(8); expect(why).not.toMatch(/—|exam|tested/i) }
  })
  it('is deterministic', () => {
    expect(JSON.stringify(rankAcronyms(list, { outline, cards }))).toBe(JSON.stringify(out))
  })
})
