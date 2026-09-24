// Discover Mode storage — Anki media files (cloud-synced) with a local fallback.
//
// Source of truth is an Anki media file per mode (e.g. _screenlens/profile__Mode.json).
// Underscore-prefixed media is never garbage-collected by Anki but still syncs to AnkiWeb,
// so the learner profile + ledger follow the user across machines. When Anki is offline we
// read/write the same JSON via /api/discover-store (cached under discover/ in the repo).

import { ankiStoreMediaFile, ankiRetrieveMediaFile, ankiSyncSoon } from '../utils/anki'

// UTF-8 safe base64 (btoa only handles latin1)
const b64encode = (str) => btoa(unescape(encodeURIComponent(str)))
const b64decode = (b64) => decodeURIComponent(escape(atob(b64)))

const legacyKey = (name) => String(name || 'default').replace(/[^a-zA-Z0-9._-]/g, '-')
// FNV-1a, 32-bit: short, stable, dependency-free. Only used to tell apart names that sanitize alike.
const fnv1a = (s) => {
  let h = 0x811c9dc5
  for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) }
  return (h >>> 0).toString(16).padStart(8, '0')
}
// The sanitizer turns EVERY non-ASCII character into "-", so modes named in another script
// collided: "日本語" and "韓国語" both became "---" and silently shared one learner profile, one
// hook store and one grammar log. Names that contain non-ASCII characters now carry a hash of the
// real name. ASCII-only names keep EXACTLY the key they always had, so existing data (and other
// computers on the shared folder running an older build) are unaffected.
export const storageKey = (name) => {
  const legacy = legacyKey(name)
  return /[^\x20-\x7E]/.test(String(name || '')) ? `${legacy}-${fnv1a(name)}` : legacy
}
const mediaName = (kind, key) => `_screenlens/${kind}__${key}.json`

async function readKey(kind, key) {
  try {
    const b64 = await ankiRetrieveMediaFile(mediaName(kind, key))
    if (b64 && b64 !== false) return JSON.parse(b64decode(b64))
  } catch (err) {
    console.warn(`[Discover] media read failed for ${kind}, trying local`, err.message)
  }
  try {
    const r = await fetch(`/api/discover-store?kind=${kind}&mode=${encodeURIComponent(key)}`)
    const d = await r.json()
    if (d && d.content) return JSON.parse(d.content)
  } catch {}
  return null
}

export const DEFAULT_LEDGER = { known: [], declined: [], carded: [], offered: [] }

// Read a blob. Tries Anki media first, then the local fallback. Returns the parsed
// object, or null if nothing is stored anywhere.
export async function readBlob(kind, mode) {
  const key = storageKey(mode)
  const found = await readKey(kind, key)
  if (found !== null) return found
  // A non-ASCII name saved before the hashed key existed: its data is still under the legacy key.
  // The next write moves it to the new key.
  const legacy = legacyKey(mode)
  return legacy !== key ? readKey(kind, legacy) : null
}

// Write a blob to both Anki media (if available) and the local fallback. Returns true if the
// Anki write succeeded.
//
// A FULL AnkiWeb sync is NOT triggered by default. Storing the media file already persists it in
// Anki's local collection immediately; the blob (profile/ledger/hooks) is best-effort cross-machine
// state and does not warrant a whole-collection sync every time a Discover suggestion is offered,
// skipped, or marked known — that spammed an AnkiWeb sync on essentially every Discover card. Pass
// { sync: true } only for a change worth pushing right away (and even then, carding already runs its
// own ankiSync after adding the note, which carries the media file along).
export async function writeBlob(kind, mode, obj, { sync = false } = {}) {
  const json = JSON.stringify(obj, null, 2)
  const key = storageKey(mode)
  let ankiOk = false
  try {
    await ankiStoreMediaFile(mediaName(kind, key), b64encode(json))
    ankiOk = true
  } catch (err) {
    console.warn(`[Discover] media write failed for ${kind}`, err.message)
  }
  try {
    await fetch(`/api/discover-store?kind=${kind}&mode=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: json }),
    })
  } catch {}
  if (ankiOk && sync) ankiSyncSoon()   // coalesced: see the toast note on ankiSyncSoon
  return ankiOk
}
