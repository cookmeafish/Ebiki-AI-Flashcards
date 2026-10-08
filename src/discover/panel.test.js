import { describe, expect, it } from 'vitest'
import { resolveKind, shownSources, sourceHref } from './panel'

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
