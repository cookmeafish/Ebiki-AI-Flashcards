import { describe, expect, it } from 'vitest'
import { levelBadge, resolveKind, shownSources, sourceHref } from './panel'

describe('sourceHref', () => {
  it('keeps http(s) urls and adds https to scheme-less ones', () => {
    expect(sourceHref('https://a.org/x')).toBe('https://a.org/x')
    expect(sourceHref('HTTP://a.org')).toBe('HTTP://a.org')
    expect(sourceHref('en.wiktionary.org/wiki/perro')).toBe('https://en.wiktionary.org/wiki/perro')
  })
  it('turns other schemes into a harmless https url', () => {
    expect(sourceHref('javascript:alert(1)')).toBe('https://alert(1)')
    expect(sourceHref('ftp://x.org/a')).toBe('https://x.org/a')
  })
  it('gives no link for an empty url', () => {
    expect(sourceHref('')).toBe(null)
    expect(sourceHref('   ')).toBe(null)
    expect(sourceHref(null)).toBe(null)
    expect(sourceHref('javascript:')).toBe(null)
  })
})

describe('shownSources', () => {
  it('drops entries without a link, repeats and junk, and caps the list', () => {
    const out = shownSources([
      { title: 'A', url: 'a.org' }, { title: 'A again', url: 'https://a.org' }, { title: 'No link', url: '' },
      null, 'x', { url: 'b.org' }, { title: 'C', url: 'c.org' }, { title: 'D', url: 'd.org' }, { title: 'E', url: 'e.org' },
    ])
    expect(out.map((s) => s.href)).toEqual(['https://a.org', 'https://b.org', 'https://c.org', 'https://d.org'])
    expect(out[1].label).toBe('b.org')
  })
  it('handles a missing list', () => {
    expect(shownSources(undefined)).toEqual([])
  })
})

describe('resolveKind', () => {
  const opts = [['acronym', 'Acronyms'], ['port', 'Ports'], ['both', 'Anything']]
  it('keeps an offered kind', () => expect(resolveKind('port', opts)).toBe('port'))
  it('falls back to Anything for a kind no longer offered', () => {
    expect(resolveKind('scenario', opts)).toBe('both')
    expect(resolveKind(undefined, opts)).toBe('both')
  })
})

describe('levelBadge', () => {
  it('shows nothing for a level without an estimate (a bare "Level:" chip)', () => {
    expect(levelBadge({ scale: 'CEFR', estimate: '', confidence: 0.7 })).toBe(null)
    expect(levelBadge({ scale: 'tier', estimate: '   ' })).toBe(null)
    expect(levelBadge(null)).toBe(null)
    expect(levelBadge([])).toBe(null)
  })
  it('keeps the domain-coverage scale (shown as in progress)', () => {
    expect(levelBadge({ scale: 'domain-coverage', estimate: '' })).toEqual({ scale: 'domain-coverage', estimate: '', confidence: null })
  })
  it('reads the confidence as 0..1', () => {
    expect(levelBadge({ scale: 'CEFR', estimate: 'B1', confidence: 70 }).confidence).toBe(0.7)
    expect(levelBadge({ scale: 'CEFR', estimate: 'B1', confidence: '0.4' }).confidence).toBe(0.4)
    expect(levelBadge({ scale: 'CEFR', estimate: 'B1', confidence: 250 }).confidence).toBe(1)
    expect(levelBadge({ scale: 'CEFR', estimate: 'B1', confidence: '' }).confidence).toBe(null)
    expect(levelBadge({ scale: 'CEFR', estimate: 'B1', confidence: 'high' }).confidence).toBe(null)
    expect(levelBadge({ scale: 'CEFR', estimate: 'B1', confidence: true }).confidence).toBe(null)
  })
})
