import { describe, it, expect, vi, afterEach } from 'vitest'
import { resolveWiktionary } from './wiktionary'

// A scripted Wikimedia: `pages[edition][title]` = files on that Wiktionary page, `search` = Commons search hits,
// `info[file]` = its imageinfo (null = no metadata). Every URL is logged. No real network.
function fakeWiki({ pages = {}, search = [], info = {}, down = [] }) {
  const urls = []
  globalThis.fetch = vi.fn(async (url) => {
    urls.push(url)
    const u = new URL(url)
    const ok = (body) => ({ ok: true, status: 200, json: async () => body })
    const ed = u.hostname.split('.')[0]
    if (u.pathname.includes('/media-list/')) {
      if (down.includes(ed)) return { ok: false, status: 503, json: async () => ({}) }
      const title = decodeURIComponent(u.pathname.split('/media-list/')[1])
      return ok({ items: (pages[ed]?.[title] || []).map((t) => ({ type: 'audio', title: `File:${t}` })) })
    }
    const p = u.searchParams
    if (p.get('action') === 'parse') return ok({ parse: { wikitext: { '*': '' } } })
    if (p.get('list') === 'search') return ok({ query: { search: search.map((t) => ({ title: `File:${t}` })) } })
    if (p.get('prop')?.startsWith('imageinfo')) {
      const file = p.get('titles').replace(/^File:/, '')
      const i = info[file]
      if (!i) return ok({ query: { pages: { '-1': { missing: '' } } } })
      return ok({ query: { pages: { 1: { imageinfo: [{ url: `https://upload/${file}`, descriptionurl: `https://commons/${file}`, extmetadata: i }], categories: [] } } } })
    }
    return { ok: false, status: 404, json: async () => ({}) }
  })
  return urls
}
const LICENSED = { Artist: { value: 'Someone' }, LicenseShortName: { value: 'CC BY-SA 4.0' } }

afterEach(() => { vi.restoreAllMocks() })

describe('resolveWiktionary', () => {
  it('searches Commons for the WHOLE phrase, quoted', async () => {
    const urls = fakeWiki({ search: ['LL-Q1321 (spa)-Rodelar-buenos días.wav'], info: { 'LL-Q1321 (spa)-Rodelar-buenos días.wav': LICENSED } })
    const r = await resolveWiktionary({ word: 'buenos días', lang: 'Spanish' })
    const q = new URL(urls.find((u) => u.includes('list=search'))).searchParams.get('srsearch')
    expect(q).toBe('intitle:"buenos días" filetype:audio')
    expect(r?.fileName).toBe('LL-Q1321 (spa)-Rodelar-buenos días.wav')
    expect(r.attribution.license).toBe('CC BY-SA 4.0')
  }, 15000)
  it('never plays a recording without a license, and moves to the next one', async () => {
    fakeWiki({
      pages: { es: { perro: ['Es-perro.ogg', 'LL-Q1321 (spa)-X-perro.wav'] } },
      info: { 'Es-perro.ogg': { Artist: { value: 'A' } }, 'LL-Q1321 (spa)-X-perro.wav': LICENSED },
    })
    const r = await resolveWiktionary({ word: 'perro', lang: 'Spanish' })
    expect(r?.fileName).toBe('LL-Q1321 (spa)-X-perro.wav')
  }, 15000)
  it('a word with no recording anywhere is not remembered as a miss', async () => {
    fakeWiki({})
    expect(await resolveWiktionary({ word: 'gato', lang: 'Spanish' })).toBe(null)
    const urls = fakeWiki({ pages: { es: { gato: ['Es-gato.ogg'] } }, info: { 'Es-gato.ogg': LICENSED } })
    const r = await resolveWiktionary({ word: 'gato', lang: 'Spanish' })
    expect(urls.length).toBeGreaterThan(0)
    expect(r?.fileName).toBe('Es-gato.ogg')
  }, 15000)
  it('↻ keeps the voices already heard in place and adds search hits after them', async () => {
    fakeWiki({
      pages: { es: { casa: ['Es-casa.ogg'] } },
      search: ['LL-Q1321 (spa)-B-casa.wav'],
      info: { 'Es-casa.ogg': LICENSED, 'LL-Q1321 (spa)-B-casa.wav': LICENSED },
    })
    const first = await resolveWiktionary({ word: 'casa', lang: 'Spanish' })
    expect(first.fileName).toBe('Es-casa.ogg')
    const next = await resolveWiktionary({ word: 'casa', lang: 'Spanish', variant: 1 })
    expect(next.fileName).toBe('LL-Q1321 (spa)-B-casa.wav') // the search hit scores higher, yet comes AFTER the heard voice
    expect(next.variantCount).toBe(2)
  }, 20000)
  it('a weak list gathered while a lookup FAILED is not kept for the session', async () => {
    // es.wiktionary is down: only a bare search hit (no language evidence) is found.
    fakeWiki({ down: ['es', 'en'], search: ['Lluvia.ogg'], info: { 'Lluvia.ogg': LICENSED } })
    await resolveWiktionary({ word: 'lluvia', lang: 'Spanish' })
    // Back up: the real, language-tagged recording is found (the weak list was not cached).
    const urls = fakeWiki({ pages: { es: { lluvia: ['Es-lluvia.ogg'] } }, info: { 'Es-lluvia.ogg': LICENSED } })
    const r = await resolveWiktionary({ word: 'lluvia', lang: 'Spanish' })
    expect(urls.some((u) => u.includes('/media-list/'))).toBe(true)
    expect(r?.fileName).toBe('Es-lluvia.ogg')
  }, 15000)
})
