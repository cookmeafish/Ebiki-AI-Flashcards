// Discover Mode storage — Anki media files (cloud-synced) with a local fallback.
//
// Source of truth is an Anki media file per mode (e.g. _screenlens/profile__Mode.json).
// Underscore-prefixed media is never garbage-collected by Anki but still syncs to AnkiWeb,
// so the learner profile + ledger follow the user across machines. When Anki is offline we
// read/write the same JSON via /api/discover-store (cached under discover/ in the repo).

import { srs } from '../cards'
import { apiFetch } from '../platform'

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
// Anki media names cannot contain "/". With the old `_screenlens/...` name AnkiConnect read the
// basename while its store step deleted the name WITH the slash (matching nothing), so every write
// after the first became a new hash-suffixed copy and every read returned the FIRST version ever
// saved (measured: 138 orphan copies; hooks read back as a months-old 1-hook file). Flat name now,
// "_" prefix kept so Check Media leaves it alone. The legacy name is read once as a migration source.
const mediaName = (kind, key) => `_ebiki_${kind}__${key}.json`
const legacyMediaName = (kind, key) => `_screenlens/${kind}__${key}.json`

// { ok, value }. ok:false means the stored blob could NOT be read (as opposed to "nothing stored"):
// every writer replaces the whole blob with what it loaded plus its change, so a caller that writes
// after a failed read overwrites everything stored (all of a mode's memory hooks, say) with one item.
// Anki answers `false` for a missing file and THROWS when it cannot answer; the local store answers
// 200 {content:''} for missing and 503 when the shared folder is down. A blob that is not valid JSON
// counts as read (nothing to keep), so a damaged one can be replaced rather than blocking writes forever.
// A write that reached the local store but NOT Anki (AnkiConnect down, or stuck behind a dialog) left
// Anki holding the OLDER copy, and reads try Anki first, so the next read returned the old blob and
// the next write replaced the newer one with it: hooks and grammar slips vanished. Such a write marks
// the key "local is newer" (per browser), reads prefer the local copy while the mark stands, and the
// next successful Anki write clears it.
const dirtyKey = (kind, key) => `ebiki-blob-local-newer:${kind}:${key}`
// The opposite case, only needed with a SHARED data folder (where the store is read first): the store write
// failed while Anki took it, so Anki holds the newer copy here. Cleared by the next write that reaches the store.
const ankiNewerKey = (kind, key) => `ebiki-blob-anki-newer:${kind}:${key}`
const isAnkiNewer = (kind, key) => { try { return localStorage.getItem(ankiNewerKey(kind, key)) === '1' } catch { return false } }
const setAnkiNewer = (kind, key, on) => { try { on ? localStorage.setItem(ankiNewerKey(kind, key), '1') : localStorage.removeItem(ankiNewerKey(kind, key)) } catch {} }
const isLocalNewer = (kind, key) => { try { return localStorage.getItem(dirtyKey(kind, key)) === '1' } catch { return false } }
const setLocalNewer = (kind, key, on) => { try { on ? localStorage.setItem(dirtyKey(kind, key), '1') : localStorage.removeItem(dirtyKey(kind, key)) } catch {} }
// Writes per key in this page. The read's push-back clears the mark only if no write happened meanwhile:
// a write that failed to reach Anki DURING the push re-set the mark, and the older push then wiped it.
const writeSeq = new Map()
// Per-blob write queue (see writeBlob).
const blobChains = new Map()   // dirty key -> promise of the last queued write
const blobLatest = new Map()   // dirty key -> { json, seq } of the newest write asked for

async function readKeyChecked(kind, key) {
  if (isLocalNewer(kind, key)) {
    try {
      const r = await apiFetch(`/api/discover-store?kind=${kind}&mode=${encodeURIComponent(key)}`)
      // The newer copy lives ONLY here and the store refused (a 503 share): Anki's copy is known to be older, and
      // returned as a good read its next write replaced the newer items (and cleared this mark). Not readable.
      if (!r.ok) return { ok: false, value: null }
      const d = await r.json()
      if (r.ok && d && d.content) {
        let value = null
        try { value = JSON.parse(d.content) } catch { value = null }
        // Put the newer copy back into Anki so other computers get it too (fail-soft). In the blob's write
        // queue, and only while no write came after this read: pushed on its own, it could land AFTER a newer
        // write and put this older copy back in Anki with the "local is newer" mark already cleared.
        const dk = dirtyKey(kind, key)
        const seq = writeSeq.get(dk) || 0
        const push = (blobChains.get(dk) || Promise.resolve()).catch(() => false).then(async () => {
          if ((writeSeq.get(dk) || 0) !== seq) return null
          await srs.storeFile(mediaName(kind, key), b64encode(d.content))
          if ((writeSeq.get(dk) || 0) === seq) setLocalNewer(kind, key, false)
          return true
        }).catch(() => false)
        blobChains.set(dk, push)
        push.finally(() => { if (blobChains.get(dk) === push) blobChains.delete(dk) }).catch(() => {})
        return { ok: true, value }
      }
    } catch { /* fall through to the normal order */ }
  }
  // Shared data folder: the store copy is the freshest (see /api/discover-store `shared`), so it wins when it
  // holds something. Anki (synced through AnkiWeb, minutes or days behind) is only the fallback.
  if (!isAnkiNewer(kind, key)) {
    try {
      const r = await apiFetch(`/api/discover-store?kind=${kind}&mode=${encodeURIComponent(key)}`)
      const d = r.ok ? await r.json() : null
      if (d && d.shared && d.content) {
        try { return { ok: true, value: JSON.parse(d.content) } } catch { return { ok: true, value: null } }
      }
    } catch { /* fall through to the normal order */ }
  }
  let ankiFailed = false
  try {
    const b64 = await srs.readFile(mediaName(kind, key))
    if (b64 && b64 !== false) {
      try { return { ok: true, value: JSON.parse(b64decode(b64)) } } catch { return { ok: true, value: null } }
    }
  } catch (err) {
    ankiFailed = true
    console.warn(`[Discover] media read failed for ${kind}, trying local`, err.message)
  }
  try {
    const r = await apiFetch(`/api/discover-store?kind=${kind}&mode=${encodeURIComponent(key)}`)
    const d = await r.json()
    if (!r.ok) throw new Error(`local store ${r.status}`)
    if (d && d.content) {
      try { return { ok: true, value: JSON.parse(d.content) } } catch { return { ok: true, value: null } }
    }
    // Nothing under the new name or locally: migrate from the legacy (frozen, first-version) Anki
    // file if one exists. Only a true "nothing stored" if Anki also answered.
    if (!ankiFailed) {
      const old = await srs.readFile(legacyMediaName(kind, key)).catch(() => null)
      if (old && old !== false) {
        try { return { ok: true, value: JSON.parse(b64decode(old)) } } catch { /* damaged: nothing to keep */ }
      }
    }
    return { ok: !ankiFailed, value: null }
  } catch {
    return { ok: false, value: null }
  }
}
async function readKey(kind, key) {
  return (await readKeyChecked(kind, key)).value
}

export const DEFAULT_LEDGER = { known: [], declined: [], carded: [], offered: [] }

// May a name with nothing under its hashed key read the pre-hash LEGACY key? Only when that key can
// have been written by this name alone. A legacy key with no letter or digit left ("日本語" and
// "韓国語" both became "---") is shared by every same-length name in another script, so reading it
// would hand a NEW mode another mode's profile, hooks and grammar log (and the next functional hook
// write would save them under the new key for good). `siblings` (the other names in use, e.g. every
// mode name) lets such a key through when no sibling maps to it.
export const legacyFallbackAllowed = (name, siblings) => {
  const legacy = legacyKey(name)
  if (legacy === storageKey(name)) return false // ASCII name: the legacy key IS its key
  if (/[a-zA-Z0-9]/.test(legacy)) return true
  if (!Array.isArray(siblings)) return false
  return !siblings.some((s) => s !== name && legacyKey(s) === legacy)
}

// Read a blob and say whether the read actually worked: { ok, value } (see readKeyChecked). Callers
// that WRITE the blob back must not write when ok is false.
export async function readBlobChecked(kind, mode, { siblings } = {}) {
  const key = storageKey(mode)
  const found = await readKeyChecked(kind, key)
  if (found.value !== null && found.value !== undefined) return found
  if (!found.ok) return found
  // A non-ASCII name saved before the hashed key existed: its data is still under the legacy key.
  // The next write moves it to the new key.
  return legacyFallbackAllowed(mode, siblings) ? readKeyChecked(kind, legacyKey(mode)) : { ok: true, value: null }
}

// Read a blob. Tries Anki media first, then the local fallback. Returns the parsed
// object, or null if nothing is stored anywhere (or it could not be read).
export async function readBlob(kind, mode, opts = {}) {
  return (await readBlobChecked(kind, mode, opts)).value
}

// Write a blob to both Anki media (if available) and the local fallback. Returns true if the
// Anki write succeeded.
//
// A FULL AnkiWeb sync is NOT triggered by default. Storing the media file already persists it in
// Anki's local collection immediately; the blob (profile/ledger/hooks) is best-effort cross-machine
// state and does not warrant a whole-collection sync every time a Discover suggestion is offered,
// skipped, or marked known — that spammed an AnkiWeb sync on essentially every Discover card. Pass
// { sync: true } only for a change worth pushing right away (and even then, carding already runs its
// own srs.sync after adding the note, which carries the media file along).
// Writes of ONE blob run one at a time, newest content first-class: two quick writes (two hooks saved a
// moment apart) went out in parallel, and when the older one landed last (Anki and the local store each
// take their own time) the stored blob went BACK to it, losing the newer hook. A write that finds a newer
// one queued behind it skips straight to that content.
// Writer freeze (the shared folder came back after offline mode, or a data-folder switch is
// reloading the page): this page still holds the OLD copy of every blob, and each write replaces the
// whole stored blob, so a hook or a Discover "Skip" here overwrote what another computer had added.
let writesPaused = false
export const setBlobWritesPaused = (on) => { writesPaused = !!on }

export async function writeBlob(kind, mode, obj, { sync = false } = {}) {
  if (writesPaused) return false
  const json = JSON.stringify(obj, null, 2)
  const key = storageKey(mode)
  const dk = dirtyKey(kind, key)
  const seq = (writeSeq.get(dk) || 0) + 1
  writeSeq.set(dk, seq)
  blobLatest.set(dk, { json, seq })
  const run = (blobChains.get(dk) || Promise.resolve()).catch(() => false).then(async () => {
    if (writesPaused) return false // frozen while queued (the check at entry came before the freeze)
    const latest = blobLatest.get(dk)
    if (!latest || latest.seq !== seq) return null // superseded: the newer write carries this content forward
    return writeBlobNow(kind, key, latest.json, sync)
  })
  blobChains.set(dk, run)
  run.finally(() => { if (blobChains.get(dk) === run) { blobChains.delete(dk); blobLatest.delete(dk) } }).catch(() => {})
  const r = await run
  // Superseded: report the outcome of the write that stored the newer content.
  if (r !== null) return r
  const after = blobChains.get(dk)
  return after ? ((await after.catch(() => false)) !== false) : true
}
async function writeBlobNow(kind, key, json, sync) {
  let ankiOk = false
  if (writesPaused) return false
  try {
    await srs.storeFile(mediaName(kind, key), b64encode(json))
    ankiOk = true
  } catch (err) {
    console.warn(`[Discover] media write failed for ${kind}`, err.message)
  }
  let localOk = false
  // Frozen during the Anki call (up to its 2-minute timeout): the store now points at the other folder.
  if (writesPaused) return false
  try {
    const r = await apiFetch(`/api/discover-store?kind=${kind}&mode=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: json }),
    })
    localOk = r.ok
  } catch {}
  if (ankiOk) setLocalNewer(kind, key, false)
  else if (localOk) setLocalNewer(kind, key, true)
  if (localOk) setAnkiNewer(kind, key, false)
  else if (ankiOk) setAnkiNewer(kind, key, true)
  if (ankiOk && sync) srs.syncSoon()   // coalesced: see the toast note on srs.syncSoon
  return ankiOk
}
