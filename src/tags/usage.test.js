import { describe, it, expect } from 'vitest'
import {
  FREQ_SCALE, isUsageTag, isRegionTag, isFreqTag, isRegisterTag,
  sortTagsUsageFirst, normalizeUsageTag, normalizeUsageTags, reconcileUsageTags,
  usageTagStyle, usageTagTip,
} from './usage.js'

describe('predicates', () => {
  it('classifies each family', () => {
    expect(isRegionTag('region-mexico')).toBe(true)
    expect(isFreqTag('freq-core')).toBe(true)
    expect(isRegisterTag('register-literary')).toBe(true)
    expect(isUsageTag('adjetivo')).toBe(false)
  })
})

describe('sortTagsUsageFirst', () => {
  it('orders region, then freq, then register, then the rest', () => {
    const out = sortTagsUsageFirst(['adjetivo', 'register-formal', 'clima', 'freq-uncommon', 'region-global'])
    expect(out).toEqual(['region-global', 'freq-uncommon', 'register-formal', 'adjetivo', 'clima'])
  })
  it('is stable for non-usage tags', () => {
    expect(sortTagsUsageFirst(['zeta', 'alfa', 'ebiki'])).toEqual(['zeta', 'alfa', 'ebiki'])
  })
  it('does not mutate its input', () => {
    const input = ['ebiki', 'region-global']
    sortTagsUsageFirst(input)
    expect(input).toEqual(['ebiki', 'region-global'])
  })
})

describe('normalizeUsageTag', () => {
  it('folds aliases onto the closed vocabulary', () => {
    expect(normalizeUsageTag('freq-everyday')).toBe('freq-core')
    expect(normalizeUsageTag('register-politics')).toBe('register-political')
    expect(normalizeUsageTag('region-latin-america')).toBe('region-latam')
    expect(normalizeUsageTag('Region-USA')).toBe('region-us')
  })
  it('drops neutral registers and unknown invented ones', () => {
    expect(normalizeUsageTag('register-neutral')).toBeNull()
    expect(normalizeUsageTag('register-formal-literary-ish')).toBeNull()
    expect(normalizeUsageTag('freq-sometimes')).toBeNull()
  })
  it('keeps unknown places (any real region is legitimate)', () => {
    expect(normalizeUsageTag('region-canary-islands')).toBe('region-canary-islands')
    expect(normalizeUsageTag('region-')).toBeNull()
  })
  it('passes non-usage tags through untouched in kind', () => {
    expect(normalizeUsageTag('ebiki')).toBe('ebiki')
  })
})

describe('normalizeUsageTags', () => {
  it('keeps the most conservative freq when several are emitted', () => {
    expect(normalizeUsageTags(['freq-core', 'freq-rare'])).toEqual(['freq-rare'])
  })
  it('drops region-global when specific regions are also claimed', () => {
    expect(normalizeUsageTags(['region-global', 'region-mexico'])).toEqual(['region-mexico'])
  })
  it('keeps region-global when it is the only region claim', () => {
    expect(normalizeUsageTags(['region-global'])).toEqual(['region-global'])
  })
  it('dedupes and sorts', () => {
    expect(normalizeUsageTags(['ebiki', 'freq-common', 'ebiki', 'region-global']))
      .toEqual(['region-global', 'freq-common', 'ebiki'])
  })
})

describe('reconcileUsageTags — region', () => {
  it('confirms identical global claims', () => {
    const { tags, unverified } = reconcileUsageTags(['region-global'], ['region-global'])
    expect(tags).toEqual(['region-global'])
    expect(unverified).toEqual([])
  })
  it('demotes global to the specific set the other pass named, and counts it confirmed', () => {
    // global is a superset of the specific claim, so BOTH passes back those regions.
    const { tags, unverified } = reconcileUsageTags(['region-global'], ['region-mexico', 'region-latam'])
    expect(tags).toEqual(['region-mexico', 'region-latam'])
    expect(unverified).toEqual([])
  })
  it('keeps the intersection of two specific sets', () => {
    const { tags, unverified } = reconcileUsageTags(['region-spain', 'region-mexico'], ['region-mexico'])
    expect(tags).toEqual(['region-mexico'])
    expect(unverified).toEqual([])
  })
  it('flags disjoint sets instead of picking a winner', () => {
    const { tags, unverified } = reconcileUsageTags(['region-spain'], ['region-mexico'])
    expect(tags).toEqual(['region-spain', 'region-mexico'])
    expect(unverified).toEqual(['region-spain', 'region-mexico'])
  })
  it('flags a claim only one pass made', () => {
    const { tags, unverified } = reconcileUsageTags(['region-spain'], [])
    expect(unverified).toEqual(['region-spain'])
  })
})

describe('reconcileUsageTags — freq', () => {
  it('resolves a one-step disagreement to the less common value, confirmed', () => {
    const { tags, unverified } = reconcileUsageTags(['freq-common'], ['freq-uncommon'])
    expect(tags).toEqual(['freq-uncommon'])
    expect(unverified).toEqual([])
  })
  it('flags a two-step disagreement but still ships the conservative value', () => {
    const { tags, unverified } = reconcileUsageTags(['freq-core'], ['freq-uncommon'])
    expect(tags).toEqual(['freq-uncommon'])
    expect(unverified).toEqual(['freq-uncommon'])
  })
  it('confirms agreement', () => {
    expect(reconcileUsageTags(['freq-core'], ['freq-core'])).toEqual({ tags: ['freq-core'], unverified: [] })
  })
  it('never over-claims commonness across the whole scale', () => {
    for (const a of FREQ_SCALE) for (const b of FREQ_SCALE) {
      const { tags } = reconcileUsageTags([a], [b])
      const idx = FREQ_SCALE.indexOf(tags[0])
      expect(idx).toBe(Math.max(FREQ_SCALE.indexOf(a), FREQ_SCALE.indexOf(b)))
    }
  })
})

describe('reconcileUsageTags — register', () => {
  it('keeps only registers BOTH passes named', () => {
    const { tags } = reconcileUsageTags(['register-literary', 'register-formal'], ['register-literary'])
    expect(tags).toEqual(['register-literary'])
  })
  it('deletes a register only one pass guessed', () => {
    const { tags } = reconcileUsageTags(['register-political'], ['freq-common'])
    expect(tags.filter(isRegisterTag)).toEqual([])
  })
})

describe('reconcileUsageTags — shape', () => {
  it('returns usage tags in reading order', () => {
    const { tags } = reconcileUsageTags(
      ['register-literary', 'freq-uncommon', 'region-global'],
      ['region-global', 'freq-uncommon', 'register-literary'],
    )
    expect(tags).toEqual(['region-global', 'freq-uncommon', 'register-literary'])
  })
  it('handles empty input on both sides', () => {
    expect(reconcileUsageTags([], [])).toEqual({ tags: [], unverified: [] })
  })
  it('handles null input', () => {
    expect(reconcileUsageTags(null, undefined)).toEqual({ tags: [], unverified: [] })
  })
})

describe('presentation', () => {
  it('paints safe-to-use tags green and heads-up tags amber', () => {
    expect(usageTagStyle('region-global').color).toBe('var(--c-success)')
    expect(usageTagStyle('freq-core').color).toBe('var(--c-success)')
    expect(usageTagStyle('freq-rare').color).toBe('var(--c-warning)')
    expect(usageTagStyle('region-mexico').color).toBe('var(--c-warning)')
    expect(usageTagStyle('register-literary').color).toBe('var(--c-warning)')
  })
  it('marks unverified tags distinctly whatever the family', () => {
    expect(usageTagStyle('region-global', { unverified: true }).border).toContain('dashed')
  })
  it('leaves non-usage tags unstyled', () => {
    expect(usageTagStyle('adjetivo')).toEqual({})
  })
  it('explains every tag in plain words, with no em dashes', () => {
    for (const tag of ['region-global', 'region-mexico', 'freq-core', 'freq-rare', 'register-political']) {
      const tip = usageTagTip(tag)
      expect(tip.length).toBeGreaterThan(10)
      expect(tip).not.toMatch(/[—–]/)
    }
    expect(usageTagTip('adjetivo')).toBe('')
  })
  it('says so when a tag is unconfirmed', () => {
    expect(usageTagTip('freq-core', { unverified: true })).toContain('Not confirmed')
  })
})
