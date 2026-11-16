import { describe, it, expect } from 'vitest'
import { narrowOutline, pickWords, NARROW_ABOVE, NARROW_KEEP } from './knowledgePick'

// An invented guide: 2 chapters, 10 topics each, 20 term sections per topic (400 terms).
const big = []
for (let c = 1; c <= 2; c++) {
  big.push({ title: `Chapter ${c}`, level: 1 })
  for (let o = 1; o <= 10; o++) {
    big.push({ title: `${c}.${o} Topic group ${c}-${o}`, level: 2 })
    for (let k = 1; k <= 20; k++) big.push({ title: `Widget kind ${c}${o}${k} (WK${c}${o}${k})`, level: 3 })
  }
}
big.splice(50, 0, { title: 'Lattice vault rotation (LVR)', level: 3 }, { title: 'Lattice vault vs mesh vault', level: 3 }, { title: 'Mesh relay basics', level: 3 },
  { title: 'Vault key escrow', level: 3 }, { title: 'Rotation schedules for vault keys', level: 3 }, { title: 'Lattice mesh pairing', level: 3 })
big.forEach((h, i) => { h.i = i })

describe('narrowing a big table of contents before the section pick', () => {
  it('a small outline is sent whole', () => {
    const small = big.slice(0, NARROW_ABOVE)
    expect(narrowOutline(small, 'lattice vault rotation')).toBe(small)
  })
  it('keeps the headings that share words with the task and every top-level heading, in order', () => {
    const out = narrowOutline(big, 'Card: Lattice vault rotation (LVR). What does rotating the vault key protect in a mesh?')
    const titles = out.map((h) => h.title)
    expect(titles).toContain('Lattice vault rotation (LVR)')
    expect(titles).toContain('Vault key escrow')
    expect(out.filter((h) => h.level <= 2)).toHaveLength(22)
    expect(out.length).toBeLessThan(big.length / 3)
    expect(out.map((h) => h.i)).toEqual([...out.map((h) => h.i)].sort((a, b) => a - b))
    expect(out.every((h) => big.includes(h))).toBe(true) // same objects: their `i` still names the section
  })
  it('too few matches: the whole outline, as before', () => {
    expect(narrowOutline(big, 'something entirely unrelated to any heading here')).toBe(big)
    expect(narrowOutline(big, '')).toBe(big)
  })
  it('never keeps more matched headings than the cap', () => {
    const out = narrowOutline(big, 'widget kind') // matches all 400 term headings
    expect(out.filter((h) => h.level > 2).length).toBeLessThanOrEqual(NARROW_KEEP)
  })
  it('words: acronyms count, filler does not, any script', () => {
    expect(pickWords('What is the AH in IPsec?')).toEqual(['ah', 'ipsec'])
    expect(pickWords('暗号化 とは')).toEqual(['暗号化', 'とは'])
  })
})
