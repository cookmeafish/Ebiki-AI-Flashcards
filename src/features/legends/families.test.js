// Boss families (EXPERIMENTAL; see the removal list at the top of families.js).
import { describe, it, expect } from 'vitest'
import { FAMILY_TREES, FAMILY_MISFITS, MAX_PARENTS, familyKind, familyNode, familyMotifs } from './families'
import { MOTIFS } from './map'
import { RAID_MOTIFS } from './raid'
import { LANGUAGES } from '../../i18n/languages'

const allMotifs = [...MOTIFS, ...RAID_MOTIFS]

describe('boss families', () => {
  it('Legends and raid motifs never share a name (a motif decides its kind)', () => {
    expect(MOTIFS.filter((m) => RAID_MOTIFS.includes(m))).toEqual([])
  })

  it('every Legends and raid motif appears exactly once across all trees (misfits included)', () => {
    const drawn = [...FAMILY_TREES.flatMap(familyMotifs), ...FAMILY_MISFITS.motifs]
    const count = {}
    for (const m of drawn) count[m] = (count[m] || 0) + 1
    expect(Object.entries(count).filter(([, n]) => n !== 1)).toEqual([])
    expect([...drawn].sort()).toEqual([...allMotifs].sort())
  })

  it('every link is used by its tree (nothing hangs outside the drawing)', () => {
    for (const tree of FAMILY_TREES) {
      const drawn = new Set(familyMotifs(tree))
      for (const child of Object.keys(tree.links)) expect(drawn.has(child), `${tree.id}: ${child}`).toBe(true)
    }
  })

  it('each child is a raid boss with 1 to 3 valid, distinct parents', () => {
    for (const tree of FAMILY_TREES) {
      expect(familyKind(tree.top), tree.id).toBe('raids')
      for (const [child, parents] of Object.entries(tree.links)) {
        expect(familyKind(child), `${tree.id}: ${child}`).toBe('raids')
        expect(parents.length, `${tree.id}: ${child}`).toBeGreaterThanOrEqual(1)
        expect(parents.length, `${tree.id}: ${child}`).toBeLessThanOrEqual(MAX_PARENTS)
        expect(new Set(parents).size).toBe(parents.length)
        for (const p of parents) expect(allMotifs, `${tree.id}: ${p}`).toContain(p)
      }
    }
  })

  it('has no cycles', () => {
    for (const tree of FAMILY_TREES) {
      const visit = (m, path) => {
        expect(path.includes(m), `${tree.id}: ${[...path, m].join(' <- ')}`).toBe(false)
        for (const p of tree.links[m] || []) visit(p, [...path, m])
      }
      visit(tree.top, [])
    }
  })

  it('every raid boss has parents (only Misfits are parentless, and they are all Legends bosses)', () => {
    const children = new Set(FAMILY_TREES.flatMap((t) => Object.keys(t.links)))
    expect(RAID_MOTIFS.filter((m) => !children.has(m))).toEqual([])
    for (const m of FAMILY_MISFITS.motifs) expect(familyKind(m), m).toBe('bosses')
  })

  it('builds nested nodes top-down', () => {
    const theater = familyNode(FAMILY_TREES.find((t) => t.id === 'theater'))
    expect(theater.motif).toBe('puppeteer')
    expect(theater.parents.map((n) => n.motif)).toEqual(['showman'])
    expect(theater.parents[0].parents.map((n) => n.motif)).toEqual(['stage', 'carnival'])
    expect(theater.parents[0].parents[0].kind).toBe('bosses')
  })

  it('tree ids are unique and every lg_fam text exists in all four locales', () => {
    const ids = [...FAMILY_TREES.map((t) => t.id), FAMILY_MISFITS.id]
    expect(new Set(ids).size).toBe(ids.length)
    const keys = ['lg_famTab', 'lg_famIntro', 'lg_famRaid', 'lg_famLegend', 'lg_famOpen',
      ...ids.flatMap((id) => [`lg_famTree_${id}`, `lg_famWhy_${id}`]),
      ...RAID_MOTIFS.map((m) => `lg_raidBoss_${m}`)]
    for (const lang of LANGUAGES) {
      const missing = keys.filter((k) => typeof lang.strings[k] !== 'string' || !lang.strings[k].trim())
      expect(missing, lang.code).toEqual([])
    }
  })
})
