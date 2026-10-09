// Pure helpers for the Discover panel (src/components/DiscoverPanel.jsx), kept here so they are tested.

// A web source's link. The search proxy returns scheme-less urls ("en.wiktionary.org/wiki/..."), which as a bare
// href resolved RELATIVE to the app and opened a blank localhost page; any non-http scheme ("javascript:") becomes a
// harmless https url. An empty or blank url is no link at all (it rendered href="https://", an empty tab).
export function sourceHref(url) {
  const u = String(url ?? '').trim()
  if (!u) return null
  if (/^https?:\/\//i.test(u)) return u
  const bare = u.replace(/^[a-z][a-z0-9+.-]*:(\/\/)?/i, '')
  return bare ? `https://${bare}` : null
}

// The sources worth showing: each with a link, at most once per link.
export function shownSources(sources, max = 4) {
  const seen = new Set()
  const out = []
  for (const s of Array.isArray(sources) ? sources : []) {
    if (!s || typeof s !== 'object') continue
    const href = sourceHref(s.url)
    if (!href || seen.has(href)) continue
    seen.add(href)
    out.push({ href, label: String(s.title || '').trim() || href.replace(/^https?:\/\//i, '') })
    if (out.length >= max) break
  }
  return out
}

// The kind chip that is really selected: a key no longer offered (a general mode's AI-made kinds were replaced)
// falls back to 'both' ("Anything"), so the setup row and the at-a-glance chip never show an empty selection.
export function resolveKind(itemType, options) {
  const keys = (Array.isArray(options) ? options : []).map((o) => o[0])
  return keys.includes(itemType) ? itemType : 'both'
}

// What the level chip shows: the estimate and a 0..1 confidence (a percentage like 70 is read as 0.7), or null when
// there is nothing to show. A level with no estimate rendered a bare "Level:" chip (the domain-coverage scale says
// "in progress" instead, so it still shows).
export function levelBadge(level) {
  if (!level || typeof level !== 'object' || Array.isArray(level)) return null
  const scale = typeof level.scale === 'string' ? level.scale : ''
  const estimate = String(level.estimate ?? '').trim()
  if (!estimate && scale !== 'domain-coverage') return null
  const raw = level.confidence
  let confidence = raw === '' || raw == null || typeof raw === 'boolean' ? NaN : Number(raw)
  if (!Number.isFinite(confidence)) confidence = null
  else { if (confidence > 1) confidence /= 100; confidence = Math.max(0, Math.min(1, confidence)) }
  return { scale, estimate, confidence }
}
