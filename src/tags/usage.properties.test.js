import { describe, it, expect } from 'vitest'
import {
  FREQ_SCALE, REGISTERS, isFreqTag, isRegisterTag, isRegionTag, isUsageTag,
  normalizeUsageTags, reconcileUsageTags, collapseSpanningRegions, sortTagsUsageFirst,
  usageTagStyle, usageTagLabel,
} from './usage.js'
import { makeT } from '../i18n/index.js'
import { rng } from '../utils/testRng.js'

// A pool mixing real vocabulary, aliases, junk and other tags, the way model output arrives.
const POOL = [
  ...FREQ_SCALE, ...REGISTERS, 'region-global', 'region-spain', 'region-latam', 'region-mexico', 'region-us', 'region-uk',
  'freq-everyday', 'freq_core', 'FREQ-RARE', 'freq-bogus', 'register-neutral', 'register-politics', 'register-made-up',
  'region-', 'region_global', 'Region-USA', 'adjetivo', 'ebiki', 'topic::food', '', '   ', 'verb',
]
const gen = (r) => Array.from({ length: r.int(7) }, () => r.pick(POOL))
const famRank = (t) => (isRegionTag(t) ? 0 : isFreqTag(t) ? 1 : isRegisterTag(t) ? 2 : 3)
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x))

describe('usage tags: properties', () => {
  it('normalizeUsageTags: idempotent, at most one freq from FREQ_SCALE, only closed registers, family order', () => {
    const r = rng(7)
    for (let i = 0; i < 1500; i++) {
      const out = normalizeUsageTags(gen(r))
      expect(normalizeUsageTags(out)).toEqual(out)
      const fq = out.filter(isFreqTag)
      expect(fq.length).toBeLessThanOrEqual(1)
      for (const f of fq) expect(FREQ_SCALE).toContain(f)
      for (const g of out.filter(isRegisterTag)) expect(REGISTERS).toContain(g)
      expect(new Set(out).size).toBe(out.length)
      for (let k = 1; k < out.length; k++) expect(famRank(out[k - 1])).toBeLessThanOrEqual(famRank(out[k]))
      if (out.filter(isRegionTag).length > 1) expect(out).not.toContain('region-global')
    }
  })

  it('reconcileUsageTags: never adds a register both passes did not name, freq conservative, unverified a subset', () => {
    const r = rng(11)
    for (let i = 0; i < 1500; i++) {
      const a = gen(r)
      const b = gen(r)
      const { tags, unverified } = reconcileUsageTags(a, b)
      const A = normalizeUsageTags(a)
      const B = normalizeUsageTags(b)
      for (const g of tags.filter(isRegisterTag)) { expect(A).toContain(g); expect(B).toContain(g) }
      const fq = tags.filter(isFreqTag)
      expect(fq.length).toBeLessThanOrEqual(1)
      if (fq.length) {
        expect(FREQ_SCALE).toContain(fq[0])
        const claims = [...A, ...B].filter(isFreqTag).map((f) => FREQ_SCALE.indexOf(f))
        expect(FREQ_SCALE.indexOf(fq[0])).toBe(Math.max(...claims)) // the rarer claim always wins
      }
      for (const u of unverified) expect(tags).toContain(u)
      for (const t of tags) expect(isUsageTag(t)).toBe(true) // only usage families come out
      // Symmetric: the order of the two passes never changes WHAT ships.
      const swapped = reconcileUsageTags(b, a)
      expect(sameSet(swapped.tags, tags)).toBe(true)
      expect(sameSet(swapped.unverified, unverified)).toBe(true)
    }
  })

  it('reconcile of one pass with itself is that pass, fully verified', () => {
    const r = rng(13)
    for (let i = 0; i < 800; i++) {
      const a = gen(r)
      const usage = normalizeUsageTags(a).filter(isUsageTag)
      const { tags, unverified } = reconcileUsageTags(a, a)
      expect(tags).toEqual(usage)
      expect(unverified).toEqual([])
    }
  })

  it('foldUsageTags (normalize then collapse) is idempotent for every spanned language and alias', () => {
    const r = rng(17)
    const fold = (t, lang) => collapseSpanningRegions(normalizeUsageTags(t), lang)
    for (let i = 0; i < 1000; i++) {
      const lang = r.pick(['Spanish', 'Español', 'Spanish (Mexico)', 'English', 'Inglés', 'French', 'Klingon', ''])
      const once = fold(gen(r), lang)
      expect(fold(once, lang)).toEqual(once)
    }
    expect(fold(['region-spain', 'region-latam', 'freq-core'], 'Español')).toEqual(['region-global', 'freq-core'])
  })
})

describe('chips', () => {
  it('sortTagsUsageFirst treats a non-list as no tags (a string is not spread into letters)', () => {
    expect(sortTagsUsageFirst('freq-core')).toEqual([])
    expect(sortTagsUsageFirst(null)).toEqual([])
    expect(sortTagsUsageFirst({ 0: 'x' })).toEqual([])
  })

  it('tints come from the theme tokens, never fixed dark-theme rgba', () => {
    for (const tag of ['region-global', 'freq-rare', 'register-slang']) {
      const s = usageTagStyle(tag)
      expect(s.background).toMatch(/var\(--c-(success|warning)\)/)
      expect(s.border).toMatch(/var\(--c-(success|warning)\)/)
      expect(JSON.stringify(s)).not.toMatch(/rgba/)
    }
    expect(JSON.stringify(usageTagStyle('freq-core', { unverified: true }))).not.toMatch(/rgba/)
  })

  it('usageTagLabel spells the meaning out for screen readers, in every locale', () => {
    for (const code of ['en', 'es', 'zh', 'ja']) {
      const t = makeT(code)
      const label = usageTagLabel('freq-uncommon', { t })
      expect(label.startsWith('freq-uncommon: ')).toBe(true)
      expect(label.length).toBeGreaterThan('freq-uncommon: '.length + 3)
      expect(label).not.toMatch(/tag_/)
      expect(usageTagLabel('region-global', { t, unverified: true })).toContain(t('tag_unconfirmed'))
    }
    expect(usageTagLabel('adjetivo', { t: makeT('en') })).toBe('adjetivo')
    expect(usageTagLabel('freq-core')).toBe('freq-core') // no t: never a raw key
  })
})
