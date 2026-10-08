// /api/web-search?q=<query>: the chat's web search, through DuckDuckGo's HTML page (no API key, no CORS).
//   200 { results: [{ title, snippet, url }] }  (at most MAX_RESULTS; [] = the search ran and found nothing)
//   502 { error, results: [] }                  the search NEVER RAN (bot check, error page): a failure, never "nothing found"
//   400 / 500 { error }                         bad request / network error or timeout
// Pure of the dev server: the caller passes fetch, so tests run it on fixture pages.
export const MAX_RESULTS = 5
export const SEARCH_TIMEOUT_MS = 12000
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

// Text comes out of HTML, so its entities must be decoded: raw, the model and the source links saw "It&#x27;s"
// and "Q&amp;A" instead of the text. &amp; last, so "&amp;lt;" stays the literal text "&lt;".
export function decodeEntities(t) {
  return String(t)
    .replace(/&#x([0-9a-f]+);/gi, (m, h) => { try { return String.fromCodePoint(parseInt(h, 16)) } catch { return m } })
    .replace(/&#(\d+);/g, (m, d) => { try { return String.fromCodePoint(Number(d)) } catch { return m } })
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}
const text = (h) => decodeEntities(String(h).replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()

// The result__url text is a DISPLAY address ("www.site.com/page", no scheme), so the Sources links were relative
// and did not open. The real target is in the title link's redirect (//duckduckgo.com/l/?uddg=<encoded url>); the
// display address with https:// is the fallback. Only http(s) ever comes out (a javascript: target is dropped).
export function resultUrl(block, display) {
  const href = (block.match(/class="result__a"[^>]*href="([^"]+)"/) || block.match(/href="([^"]+)"[^>]*class="result__a"/) || [])[1]
  if (href) {
    const h = decodeEntities(href)
    try {
      const u = new URL(h, 'https://duckduckgo.com')
      const real = u.searchParams.get('uddg')
      if (real && /^https?:\/\/[^\s/]/i.test(real)) return real
      if (/^https?:$/.test(u.protocol) && !/(^|\.)duckduckgo\.com$/i.test(u.hostname)) return u.href
    } catch { /* fall through to the display address */ }
  }
  const d = String(display || '').trim().replace(/\s+/g, '')
  if (!d || /^[a-z][a-z0-9+.-]*:(?!\/\/)/i.test(d)) return '' // empty, or a scheme like javascript:
  return /^https?:\/\//i.test(d) ? d : `https://${d}`
}

// Parses DuckDuckGo's HTML results page. Ads are skipped: their class sits BEFORE the split marker, and their link
// is DuckDuckGo's y.js ad redirect (no uddg). They came back as the top results, with the display text as a made-up
// URL, and chat cited them as sources.
export function parseDdgHtml(html, max = MAX_RESULTS) {
  const results = []
  const blocks = String(html || '').split('result__body"')
  for (let i = 1; i < blocks.length && results.length < max; i++) {
    const block = blocks[i]
    if (/result--ad\b/.test(blocks[i - 1].slice(-400)) || /duckduckgo\.com\/y\.js/.test(block.slice(0, 1500))) continue
    const titleMatch = block.match(/class="result__a"[^>]*>(.*?)<\/a>/s)
    if (!titleMatch) continue
    const title = text(titleMatch[1])
    if (!title) continue
    const snippetMatch = block.match(/class="result__snippet"[^>]*>(.*?)<\/a>/s) || block.match(/class="result__snippet"[^>]*>(.*?)<\/td>/s)
    const urlMatch = block.match(/class="result__url"[^>]*>(.*?)<\/a>/s)
    results.push({ title, snippet: snippetMatch ? text(snippetMatch[1]) : '', url: resultUrl(block, urlMatch ? text(urlMatch[1]) : '') })
  }
  return results
}

// DuckDuckGo answers a bot check (HTTP 202, an "anomaly" page) instead of results when it blocks a client. Parsed,
// that is zero results, so the chat said it found nothing when it never searched at all.
export const searchBlocked = (status, html, results) => !results.length && (status !== 200 || /anomaly|captcha/i.test(String(html || '')))

export function createWebSearchRoute({ fetch: doFetch = globalThis.fetch, log = console, timeoutMs = SEARCH_TIMEOUT_MS } = {}) {
  // ASYNC handler: every throw is caught here ("//?q=x" is an invalid URL), an unhandled rejection took the server down.
  return async (req, res) => {
    const send = (status, body) => { if (res.writableEnded) return; res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)) }
    let url
    try { url = new URL(req.url, 'http://localhost') } catch { send(400, { error: 'bad request' }); return }
    const query = (url.searchParams.get('q') || '').trim()
    if (!query) { send(400, { error: 'q required' }); return }
    try {
      const resp = await doFetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query.slice(0, 500))}`, {
        headers: { 'User-Agent': UA },
        // Bounded: with no timeout a stalled response left the chat on "Searching..." forever.
        signal: AbortSignal.timeout(timeoutMs),
      })
      const html = await resp.text()
      const results = parseDdgHtml(html)
      if (searchBlocked(resp.status, html, results)) {
        log.log('[Web Search] blocked by DuckDuckGo (status', resp.status + ') for:', query)
        send(502, { error: 'The web search service is blocking requests right now. Try again later.', results: [] })
        return
      }
      log.log('[Web Search]', query, '-', results.length, 'results')
      send(200, { results })
    } catch (e) {
      log.error('[Web Search] error:', e && e.message)
      send(500, { error: (e && e.message) || 'search failed', results: [] })
    }
  }
}
