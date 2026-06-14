// Discover Mode storage — Anki media files (cloud-synced) with a local fallback.
//
// Source of truth is an Anki media file per mode (e.g. _screenlens/profile__Mode.json).
// Underscore-prefixed media is never garbage-collected by Anki but still syncs to AnkiWeb,
// so the learner profile + ledger follow the user across machines. When Anki is offline we
// read/write the same JSON via /api/discover-store (cached under discover/ in the repo).

import { ankiStoreMediaFile, ankiRetrieveMediaFile, ankiSync } from '../utils/anki'

// UTF-8 safe base64 (btoa only handles latin1)
const b64encode = (str) => btoa(unescape(encodeURIComponent(str)))
const b64decode = (b64) => decodeURIComponent(escape(atob(b64)))

const sanitize = (name) => String(name || 'default').replace(/[^a-zA-Z0-9._-]/g, '-')
const mediaName = (kind, mode) => `_screenlens/${kind}__${sanitize(mode)}.json`

export const DEFAULT_LEDGER = { known: [], declined: [], carded: [], offered: [] }

// Read a blob. Tries Anki media first, then the local fallback. Returns the parsed
// object, or null if nothing is stored anywhere.
export async function readBlob(kind, mode) {
  try {
    const b64 = await ankiRetrieveMediaFile(mediaName(kind, mode))
    if (b64 && b64 !== false) return JSON.parse(b64decode(b64))
  } catch (err) {
    console.warn(`[Discover] media read failed for ${kind}, trying local`, err.message)
  }
  try {
    const r = await fetch(`/api/discover-store?kind=${kind}&mode=${encodeURIComponent(mode)}`)
    const d = await r.json()
    if (d && d.content) return JSON.parse(d.content)
  } catch {}
  return null
}

// Write a blob to both Anki media (if available) and the local fallback, then trigger a
// background AnkiWeb sync. Returns true if the Anki write succeeded.
export async function writeBlob(kind, mode, obj) {
  const json = JSON.stringify(obj, null, 2)
  let ankiOk = false
  try {
    await ankiStoreMediaFile(mediaName(kind, mode), b64encode(json))
    ankiOk = true
  } catch (err) {
    console.warn(`[Discover] media write failed for ${kind}`, err.message)
  }
  try {
    await fetch(`/api/discover-store?kind=${kind}&mode=${encodeURIComponent(mode)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: json }),
    })
  } catch {}
  if (ankiOk) ankiSync().catch((e) => console.warn('[Discover] sync after write failed:', e.message))
  return ankiOk
}
