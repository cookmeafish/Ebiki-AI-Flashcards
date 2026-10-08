import { describe, it, expect } from 'vitest'
import { parseDdgHtml, resultUrl, decodeEntities, searchBlocked, createWebSearchRoute, MAX_RESULTS } from './webSearchRoute.js'

// Fixtures shaped like html.duckduckgo.com/html/ pages.
const result = ({ title, href, display, snippet, ad = false }) => `
<div class="result results_links results_links_deep web-result${ad ? ' result--ad' : ''}">
  <div class="links_main links_deep result__body">
    <h2 class="result__title"><a rel="nofollow" class="result__a" href="${href}">${title}</a></h2>
    <div class="result__extras"><div class="result__extras__url">
      <a class="result__url" href="${href}">${display}</a>
    </div></div>
    <a class="result__snippet" href="${href}">${snippet}</a>
    <div class="clear"></div>
  </div>
</div>`
const page = (...blocks) => `<!DOCTYPE html><html><body><div class="serp__results"><div id="links" class="results">${blocks.join('')}</div></div></body></html>`
const uddg = (u, extra = '&amp;rut=abc123') => `//duckduckgo.com/l/?uddg=${encodeURIComponent(u)}${extra}`

const NORMAL = page(
  result({ title: 'Spanish <b>ser</b> vs <b>estar</b> &amp; when to use them', href: uddg('https://www.spanishdict.com/guide/ser-vs-estar?x=1&y=2'), display: 'www.spanishdict.com/guide/ser-vs-estar', snippet: 'It&#x27;s one of the &quot;hardest&quot; parts&#8230; Learn <b>Q&amp;A</b>' }),
  result({ title: 'Ad: learn Spanish fast', href: 'https://duckduckgo.com/y.js?ad_provider=bing&amp;u3=https%3A%2F%2Fads.example', display: 'ads.example', snippet: 'Buy now', ad: true }),
  result({ title: 'Ser and estar  (Wikipedia)', href: uddg('https://en.wikipedia.org/wiki/Romance_copula'), display: 'en.wikipedia.org/wiki/Romance_copula', snippet: 'Copulas in Romance languages' }),
)

describe('parseDdgHtml', () => {
  it('reads titles, snippets and the real target URL, decoding entities and dropping markup', () => {
    const r = parseDdgHtml(NORMAL)
    expect(r).toHaveLength(2)
    expect(r[0]).toEqual({
      title: 'Spanish ser vs estar & when to use them',
      snippet: 'It\'s one of the "hardest" parts… Learn Q&A',
      url: 'https://www.spanishdict.com/guide/ser-vs-estar?x=1&y=2',
    })
    expect(r[1].title).toBe('Ser and estar (Wikipedia)')
    expect(r[1].url).toBe('https://en.wikipedia.org/wiki/Romance_copula')
  })

  it('skips ads, both by class and by the y.js redirect', () => {
    const yjsOnly = page(result({ title: 'Sneaky', href: 'https://duckduckgo.com/y.js?u3=x', display: 'x.example', snippet: 's' }), result({ title: 'Real', href: uddg('https://real.example/'), display: 'real.example', snippet: 'r' }))
    expect(parseDdgHtml(yjsOnly).map((x) => x.title)).toEqual(['Real'])
    expect(parseDdgHtml(NORMAL).some((x) => /Ad:/.test(x.title))).toBe(false)
  })

  it('caps the results', () => {
    const many = page(...Array.from({ length: 12 }, (_, i) => result({ title: `T${i}`, href: uddg(`https://s${i}.example/`), display: `s${i}.example`, snippet: '' })))
    expect(parseDdgHtml(many)).toHaveLength(MAX_RESULTS)
  })

  it('gives nothing for a page without results or for junk', () => {
    expect(parseDdgHtml(page('<div class="no-results">No results.</div>'))).toEqual([])
    for (const junk of ['', null, undefined, 42, '<html', 'result__body"', 'result__body"<a class="result__a">unclosed']) expect(parseDdgHtml(junk)).toEqual([])
  })

  it('survives malformed blocks: a missing snippet, a title with no text, an unclosed tag', () => {
    const html = page(
      '<div class="result__body"><a class="result__a" href="' + uddg('https://a.example/') + '">A</a></div>',
      '<div class="result__body"><a class="result__a" href="' + uddg('https://b.example/') + '"><b></b></a></div>',
      '<div class="result__body"><a class="result__a" href="' + uddg('https://c.example/') + '">C <i>half</a><a class="result__snippet">snip',
    )
    const r = parseDdgHtml(html)
    expect(r.map((x) => x.title)).toEqual(['A', 'C half'])
    expect(r[0].snippet).toBe('')
  })
})

describe('resultUrl', () => {
  const block = (href) => `<a class="result__a" href="${href}">t</a>`
  it('prefers the uddg target, with its own encoded query intact', () => {
    expect(resultUrl(block(uddg('https://x.example/a?q=%20b&c=d')), '')).toBe('https://x.example/a?q=%20b&c=d')
  })
  it('takes a direct http(s) link that is not DuckDuckGo', () => {
    expect(resultUrl(block('https://direct.example/p'), '')).toBe('https://direct.example/p')
  })
  it('falls back to the display address with https://', () => {
    expect(resultUrl('<a class="result__a">t</a>', 'www.site.com/page')).toBe('https://www.site.com/page')
    expect(resultUrl(block('//duckduckgo.com/l/?kh=1'), 'site.org')).toBe('https://site.org')
  })
  it('never returns a non-http(s) target', () => {
    expect(resultUrl(block(uddg('javascript:alert(1)')), '')).toBe('')
    expect(resultUrl(block('javascript:alert(1)'), 'javascript:alert(1)')).toBe('')
    expect(resultUrl(block('data:text/html,hi'), '')).toBe('')
  })
})

describe('decodeEntities', () => {
  it('decodes named, decimal and hex entities, &amp; last', () => {
    expect(decodeEntities('a &amp;lt; b &#233; &#x1F600; &nbsp;x')).toBe('a &lt; b é 😀  x')
  })
  it('leaves an out-of-range code point as written', () => {
    expect(decodeEntities('&#99999999;')).toBe('&#99999999;')
  })
})

// --- the route, with fetch stubbed (no real requests) ---
const run = async (route, url) => {
  const res = { statusCode: 200, headers: {}, writableEnded: false, setHeader(k, v) { this.headers[k] = v }, end(b) { this.body = b; this.writableEnded = true } }
  await route({ url, method: 'GET' }, res)
  return { status: res.statusCode, body: JSON.parse(res.body) }
}
const quiet = { log() {}, error() {} }
const fakeFetch = (status, html, seen = []) => async (u, init) => { seen.push({ u, init }); return { status, text: async () => html } }

describe('createWebSearchRoute', () => {
  it('answers results and sends the encoded query with a timeout', async () => {
    const seen = []
    const out = await run(createWebSearchRoute({ fetch: fakeFetch(200, NORMAL, seen), log: quiet }), '/?q=ser%20%26%20estar')
    expect(out.status).toBe(200)
    expect(out.body.results).toHaveLength(2)
    expect(seen[0].u).toBe('https://html.duckduckgo.com/html/?q=ser%20%26%20estar')
    expect(seen[0].init.signal).toBeDefined()
  })
  it('a real empty search is 200 with no results', async () => {
    const out = await run(createWebSearchRoute({ fetch: fakeFetch(200, page('<div class="no-results">No results.</div>')), log: quiet }), '/?q=zzqx')
    expect(out).toEqual({ status: 200, body: { results: [] } })
  })
  it('a bot check (202 anomaly page) is a 502 failure, never "nothing found"', async () => {
    const out = await run(createWebSearchRoute({ fetch: fakeFetch(202, '<html><form id="challenge-form" action="//duckduckgo.com/anomaly.js">'), log: quiet }), '/?q=x')
    expect(out.status).toBe(502)
    expect(out.body.error).toBeTruthy()
    expect(out.body.results).toEqual([])
  })
  it('a 200 captcha page is a failure too', async () => {
    expect(searchBlocked(200, '<div>Please complete the CAPTCHA</div>', [])).toBe(true)
    expect(searchBlocked(200, 'anomaly in the text', [{}])).toBe(false) // results win
  })
  it('a network error or timeout is 500 with an error', async () => {
    const out = await run(createWebSearchRoute({ fetch: async () => { throw new Error('The operation was aborted due to timeout') }, log: quiet }), '/?q=x')
    expect(out.status).toBe(500)
    expect(out.body.error).toMatch(/timeout/)
  })
  it('refuses a missing query and a bad URL without throwing', async () => {
    const route = createWebSearchRoute({ fetch: fakeFetch(200, NORMAL), log: quiet })
    expect((await run(route, '/')).status).toBe(400)
    expect((await run(route, '/?q=%20%20')).status).toBe(400)
    expect((await run(route, '//?q=x')).status).not.toBe(200) // "//?q=x" is an invalid URL here
  })
})
