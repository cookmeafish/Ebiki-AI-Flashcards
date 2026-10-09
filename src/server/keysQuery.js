// /api/keys POST query (node only; tested in keysQuery.test.js). Read and validated BEFORE anything is written: a
// malformed query used to throw (decodeURIComponent on a stray "%") only AFTER writeEnv had saved the key, so the
// request answered 500 although the key was stored. Now a bad query is a 400 and nothing is written.
//   ?source=user          a key the person actually typed (see setCurrentKey): may replace the shared copy.
//   &providers=a,b        ONLY the providers the person typed (comma separated, URL-encoded).
// Returns { typed, providers } or throws a QueryError. `url` is req.originalUrl (connect rewrites req.url).
export class QueryError extends Error {}

const PROVIDER_RE = /^[A-Za-z0-9_-]{1,40}$/

export function parseKeysQuery(url) {
  const s = String(url || '')
  const q = s.includes('?') ? s.slice(s.indexOf('?') + 1) : ''
  let typed = false
  let providers = []
  for (const part of q.split('&')) {
    if (!part) continue
    const eq = part.indexOf('=')
    const rawName = eq < 0 ? part : part.slice(0, eq)
    const rawValue = eq < 0 ? '' : part.slice(eq + 1)
    let name, value
    try {
      name = decodeURIComponent(rawName.replace(/\+/g, ' '))
      value = decodeURIComponent(rawValue.replace(/\+/g, ' '))
    } catch { throw new QueryError('malformed query') }
    if (name === 'source') typed = value === 'user'
    else if (name === 'providers') {
      providers = value.split(',').map((p) => p.trim()).filter(Boolean)
      if (providers.some((p) => !PROVIDER_RE.test(p))) throw new QueryError('bad providers')
    }
  }
  return { typed, providers }
}
