// THE LOOPBACK HOST RULE (node only; tested in hostGuard.test.js). The server listens on loopback only, so every real
// request names a loopback Host. Plugin middlewares run BEFORE Vite's own allowedHosts check, so a DNS-rebound site
// (evil.example resolving to 127.0.0.1) reaches them with Host: evil.example; this rule refuses it. Shared by the /api
// guard (apiRequestAllowed, vite.config.js) and the built app (builtRequestAllowed, builtApp.js).
export const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]'])

// The Host header read the way the URL parser reads it (lowercased, default port dropped). `ok` = a loopback name with
// any port; `key` = host[:port] as an Origin's `host` would spell it. Userinfo ("evil@localhost") is never a Host a
// browser sends: refused rather than read past.
export function parseHost(host) {
  const h = String(host || '')
  if (!h) return { ok: false, empty: true, key: '' }
  let name = ''
  let key = ''
  try { const u = new URL(`http://${h}`); name = u.hostname; key = u.host } catch { /* malformed Host */ }
  return { ok: LOOPBACK_HOSTNAMES.has(name) && !h.includes('@'), empty: false, key }
}

// Requests a browser makes on behalf of ANOTHER site (Sec-Fetch-Site). The app and overlay send "same-origin", a typed
// URL "none", Electron main / the launch scripts / curl send nothing.
export function crossSiteFetch(headers = {}) {
  const site = String(headers['sec-fetch-site'] || '').toLowerCase()
  return site === 'cross-site' || site === 'same-site'
}
