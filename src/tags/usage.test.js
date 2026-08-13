import { describe, it, expect } from 'vitest'
import {
  FREQ_SCALE, REGISTERS, isUsageTag, isRegionTag, isFreqTag, isRegisterTag,
  sortTagsUsageFirst, normalizeUsageTag, normalizeUsageTags, reconcileUsageTags,
  collapseSpanningRegions, usageTagStyle, usageTagTip,
} from './usage.js'
import { makeT } from '../i18n/index.js'

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
    const t = makeT('en')
    for (const tag of ['region-global', 'region-mexico', 'freq-core', 'freq-rare', 'register-political']) {
      const tip = usageTagTip(tag, { t })
      expect(tip.length).toBeGreaterThan(10)
      expect(tip).not.toMatch(/[—–]/)
    }
    expect(usageTagTip('adjetivo', { t })).toBe('')
  })
  it('says so when a tag is unconfirmed', () => {
    expect(usageTagTip('freq-core', { unverified: true, t: makeT('en') })).toContain('Not confirmed')
  })
  it('renders nothing rather than a raw key when no translator is passed', () => {
    expect(usageTagTip('freq-core')).toBe('')
  })
})

// A missing i18n key renders as the raw key name on screen, so every tag tooltip is checked
// against every dictionary rather than only English.
describe('tooltips are translated in all four app languages', () => {
  const TAGS = ['region-global', 'region-mexico', ...FREQ_SCALE, ...REGISTERS]
  for (const lang of ['en', 'es', 'zh', 'ja']) {
    it(`has real text for every usage tag in ${lang}`, () => {
      const t = makeT(lang)
      for (const tag of TAGS) {
        const tip = usageTagTip(tag, { t })
        expect(tip, `${lang}/${tag}`).toBeTruthy()
        // A raw key leaking through would contain "tag_" and no spaces.
        expect(tip, `${lang}/${tag}`).not.toMatch(/tag_[a-zA-Z]/)
        expect(tip, `${lang}/${tag}`).not.toMatch(/[—–]/) // project-wide dash ban
      }
      expect(usageTagTip('freq-rare', { unverified: true, t })).not.toMatch(/tag_[a-zA-Z]/)
    })
  }
})

describe('collapseSpanningRegions', () => {
  it('collapses a region set that covers the whole language into region-global', () => {
    expect(collapseSpanningRegions(['region-spain', 'region-latam', 'freq-rare'], 'Spanish'))
      .toEqual(['region-global', 'freq-rare'])
    expect(collapseSpanningRegions(['region-uk', 'region-us'], 'English')).toEqual(['region-global'])
    expect(collapseSpanningRegions(['region-portugal', 'region-brazil'], 'Portuguese')).toEqual(['region-global'])
  })
  it('leaves a genuinely partial claim alone', () => {
    expect(collapseSpanningRegions(['region-spain', 'region-mexico'], 'Spanish'))
      .toEqual(['region-spain', 'region-mexico'])
    expect(collapseSpanningRegions(['region-latam'], 'Spanish')).toEqual(['region-latam'])
  })
  it('is a no-op for a language with no span data', () => {
    expect(collapseSpanningRegions(['region-x', 'region-y'], 'Klingon')).toEqual(['region-x', 'region-y'])
    expect(collapseSpanningRegions(['region-spain', 'region-latam'], '')).toEqual(['region-spain', 'region-latam'])
  })
  it('keeps non-region tags untouched', () => {
    expect(collapseSpanningRegions(['region-uk', 'region-us', 'ebiki', 'freq-core'], 'english'))
      .toEqual(['region-global', 'freq-core', 'ebiki'])
  })
})
