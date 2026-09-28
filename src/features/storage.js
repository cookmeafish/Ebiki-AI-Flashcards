// Client for the framework JSON store (./storage-server.js). Follows the app's clobber rule: a key is only
// written after it was READ successfully in this page (a failed read must never be followed by a write of
// what little the page has), and never while the data folder is switching.
import { apiFetch } from '../platform'

const API = '/api/feature-data'

export function featureStore(featureId, { isBlocked = () => false } = {}) {
  const readOk = new Set()
  const url = (key) => `${API}?feature=${encodeURIComponent(featureId)}&key=${encodeURIComponent(key)}`
  return {
    // { ok, value }: ok=false means NOT readable (network, share down, damaged file); value null = nothing saved.
    async read(key) {
      try {
        const r = await apiFetch(url(key))
        if (!r.ok) return { ok: false, value: null }
        const { value } = await r.json()
        readOk.add(key)
        return { ok: true, value: value ?? null }
      } catch { return { ok: false, value: null } }
    },
    // true when written. Refused (false) without a successful read first, or while switching folders.
    async write(key, value) {
      if (!readOk.has(key) || isBlocked()) return false
      try {
        const r = await apiFetch(url(key), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value }) })
        return r.ok
      } catch { return false }
    },
    canWrite: (key) => readOk.has(key),
  }
}
