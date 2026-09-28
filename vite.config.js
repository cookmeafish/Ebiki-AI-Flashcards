import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import http from 'http'
import crypto from 'crypto'
import os from 'os'
import { spawn, execFile } from 'child_process'
import { fileURLToPath } from 'url'
import { mergeConfigPatch } from './src/utils/configDiff.js'
import { featureDataEntries, featureDataRoutes, featureLocalFiles, registerFeatureRoutes } from './src/features/server.js'
import { createEbiImages } from './src/server/ebi-images.js'

// Text files a person may have edited by hand (config.json, a mode's config, .env, datadir.json) can start
// with a UTF-8 byte-order mark: Windows PowerShell 5.1 writes one, and so did older Notepad. JSON.parse
// rejects it, so a valid config.json was set aside as "corrupt" and the app started over from onboarding,
// and the first key of such a .env was never found. Every text read that is parsed goes through here.
function readUtf8(file) {
  return fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, '')
}

// libuv's threadpool (default 4 workers) is where every ASYNC fs call actually
// runs, including the bounded dead-share probe below (dataEntriesPresentAsync) -
// that is the whole point, since it keeps the main thread free to answer other
// requests while a worker sits stuck on a dead network path. But a worker stuck
// on the network still occupies its slot until the OS gives up on it, and with
// only 4 of them, a few concurrent probes (the DATA_ROUTES guard, /api/keys,
// the backup timer) can exhaust the pool and start queuing unrelated async fs
// work behind them. Raised here, before any fs call runs — libuv reads this
// lazily on first use, so setting it this early still takes effect.
if (!process.env.UV_THREADPOOL_SIZE) process.env.UV_THREADPOOL_SIZE = '8'

// THIS FILE's own folder. `path.resolve('.')` answers "wherever this process was
// started from", which is not the same question: a launch whose working
// directory is the SHARED data folder would resolve .env to the share and write
// an API key onto an SMB volume - a credential leaving this machine, and one
// computer's key silently landing in another's app folder. The credential files
// are pinned here so they are ALWAYS beside the code, whatever the cwd.
const SELF_DIR = path.dirname(fileURLToPath(import.meta.url))

// Everything credential-related lives in ONE directory, pinned to the code above.
// EBIKI_ENV_DIR exists so the tests can exercise the real read/write/merge logic
// against a temp folder instead of the developer's own .env - a test that has to
// touch the real key file is a test nobody dares run.
const ENV_DIR = process.env.EBIKI_ENV_DIR ? path.resolve(process.env.EBIKI_ENV_DIR) : SELF_DIR
const ENV_FILE = path.join(ENV_DIR, '.env')   // machine-local on purpose: API keys stay per computer
const LOG_DIR = path.resolve('logs')    // machine-local on purpose: diagnostic logs
const APP_ROOT = path.resolve('.')

// ── Optional shared data directory ──────────────────────────────────────────
// ALL user data (config.json, ankiformat.json, modes/, decks/, chats/,
// discover/, cache/) lives under DATA_DIR. By default that is the app folder,
// so a normal single-computer install needs no setup and behaves exactly as
// before. Optionally (Settings > General > Data folder, or the EBIKI_DATA_DIR
// env var) the user can point it at any folder — e.g. a mapped SMB share — so
// several computers run the app locally but read/write the same data. The
// pointer itself is machine-local (datadir.json, gitignored) because it
// answers "where is my data?" per machine and cannot live inside the data.
const DATA_DIR_POINTER = path.resolve('datadir.json')
// How THIS computer opens Ebiki: 'app' = the chrome-free Electron window, 'browser' = a normal tab.
// MACHINE-LOCAL on purpose, exactly like datadir.json and logs/: two computers sharing one data
// folder should be free to disagree (a single-monitor laptop wants the browser tab so it can
// multitask, a desktop with room wants the app window), and config.json cannot serve this at all -
// it lives INSIDE the data folder, which may be an unreachable share, and scripts/launch.ps1 has to
// read this BEFORE the dev server it would ask exists.
const LAUNCH_MODE_POINTER = path.resolve('launchmode.json')
const readLaunchMode = () => {
  try {
    const m = JSON.parse(readUtf8(LAUNCH_MODE_POINTER))?.mode
    return m === 'browser' ? 'browser' : 'app'
  } catch { return 'app' }   // unset/corrupt = the current default, the app window
}
// The app language, copied MACHINE-LOCAL for the launcher, installer, splash and app window (applang.json,
// gitignored): they run before this server exists, and config.json may sit on an unreachable share. Pinned to
// the code folder like .env (a launch with the share as cwd must not write it there). Written whenever a
// config read or save names a language; readers fall back to the system language, then English.
const APP_LANG_POINTER = path.join(SELF_DIR, 'applang.json')
function rememberAppLanguage(lang) {
  if (typeof lang !== 'string' || !/^[a-z]{2,3}(-[A-Za-z0-9]+)?$/.test(lang)) return
  try { if (JSON.parse(readUtf8(APP_LANG_POINTER))?.lang === lang) return } catch { /* missing or unreadable: write it */ }
  try { writeFileAtomic(APP_LANG_POINTER, JSON.stringify({ lang }) + '\n') } catch (e) { console.warn('[Config] could not save applang.json:', e.message) }
}
// Features add their own data folders (src/features/server.js), so removing a feature removes its entry.
const DATA_ENTRIES = ['config.json', 'ankiformat.json', 'keys.json', 'modes', 'decks', 'chats', 'discover', 'cache', ...featureDataEntries()]
function resolveDataDir() {
  const env = (process.env.EBIKI_DATA_DIR || '').trim()
  if (env) return path.resolve(env)
  try {
    const saved = String(JSON.parse(readUtf8(DATA_DIR_POINTER)).dataDir || '').trim()
    if (saved) return path.resolve(saved)
  } catch { /* no pointer file → app folder */ }
  return APP_ROOT
}
let DATA_DIR = resolveDataDir()
// Reads/writes go to the OFFLINE working copy while the share is down (see the
// offline-mode section below); everywhere else this is just DATA_DIR.
const dataPath = (...segs) => path.join(offlineActive ? OFFLINE_DIR : DATA_DIR, ...segs)

// Deep-merge two parsed JSON values so BOTH sides are preserved: objects merge
// key-by-key (recursively), arrays are unioned (dedup by value), and a scalar
// that genuinely differs keeps the target's value (a single field can't hold two
// values — this is the only non-additive case, and it's a preference, not lost
// content). Used for settings/metadata/learner-progress JSON.
//
// With a BASE (the offline reconcile knows what both sides started from), a scalar conflict is only a
// real conflict when BOTH sides changed it. A value only the source changed (the target still equals
// the base) takes the source's value; without this, a setting changed offline was silently thrown
// away whenever another computer had touched anything else in the same file meanwhile.
const isPlainObject = (v) => v && typeof v === 'object' && !Array.isArray(v)
const NO_BASE = Symbol('no base')
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b)
function deepMergeJson(target, source, base = NO_BASE) {
  if (Array.isArray(target) && Array.isArray(source)) {
    // With a base (offline reconcile), a list only ONE side changed is that side's list: the union brought
    // back an item deleted offline and kept an edited item twice (old and new). Both changed: union.
    if (base !== NO_BASE) {
      if (sameJson(source, base)) return target
      if (sameJson(target, base)) return source
    }
    const seen = new Set(target.map((x) => JSON.stringify(x)))
    for (const item of source) { const k = JSON.stringify(item); if (!seen.has(k)) { target.push(item); seen.add(k) } }
    return target
  }
  if (isPlainObject(target) && isPlainObject(source)) {
    const hasBase = base !== NO_BASE && isPlainObject(base)
    for (const key of Object.keys(source)) {
      const sub = hasBase && key in base ? base[key] : NO_BASE
      if (key in target) target[key] = deepMergeJson(target[key], source[key], sub)
      // The TARGET deleted it and the source never changed it: stays deleted (a removed model override or
      // hook came back whenever the other side touched anything else in the file).
      else if (hasBase && key in base && sameJson(source[key], base[key])) continue
      else target[key] = source[key]
    }
    // The SOURCE deleted it and the target never changed it: deleted here too (it stayed forever).
    if (hasBase) for (const key of Object.keys(target)) {
      if (!(key in source) && key in base && sameJson(target[key], base[key])) delete target[key]
    }
    return target
  }
  if (base !== NO_BASE && sameJson(target, base) && !sameJson(source, base)) return source
  return target
}

// TRUE merge of `from` into `to` — never an overwrite, nothing is dropped:
//   • a file/folder only on the `from` side is added,
//   • a JSON file present on both is DEEP-MERGED (arrays unioned, objects merged),
//     so e.g. a mode on both computers becomes ONE mode carrying both machines'
//     question preferences, chat suggestions, learner progress, etc.,
//   • a NON-JSON file present on both with identical bytes is skipped, and if it
//     DIFFERS both are kept — the incoming one written alongside as
//     "name (from <label>).ext" — so no text/knowledge file is ever clobbered,
//   • directories recurse.
// `acc` accumulates { added, merged, keptBoth } across the whole tree. `basePath` (optional, a single
// file) is the common ancestor for a JSON file on both sides (see deepMergeJson).
function deepMergeInto(from, to, label, acc, basePath = null) {
  if (!fs.existsSync(from)) return acc
  if (fs.statSync(from).isDirectory()) {
    fs.mkdirSync(to, { recursive: true })
    for (const name of fs.readdirSync(from)) {
      if (/\.\d+\.tmp$/.test(name)) continue // another computer's half-written temp file, not data
      // One odd entry (a folder on one side where the other has a FILE of the same name) used to throw
      // and abort the whole merge partway, so every later sibling was never copied. Contain it.
      try { deepMergeInto(path.join(from, name), path.join(to, name), label, acc) }
      catch (e) { console.log('[Merge] skipped', name, ':', e.message) }
    }
    return acc
  }
  if (!fs.existsSync(to)) {
    fs.mkdirSync(path.dirname(to), { recursive: true })
    writeFileAtomic(to, fs.readFileSync(from)) // atomic: `to` can be the share (a dropped copy left a truncated file)
    acc.added++
    return acc
  }
  // Both exist as files.
  // Chats are ORDERED LOGS, not sets: the list merge de-duplicates by value, which dropped a repeated
  // "ok" and put three assistant replies back to back. A chat that differs is kept as both copies.
  // A chat file sits DIRECTLY in a "chats" folder. Testing the whole absolute path also caught a data folder
  // under e.g. D:\team\chats\ (every JSON there was kept as two copies, never merged) and a mode named "chats".
  const chatDir = path.dirname(to)
  const isChat = path.basename(chatDir).toLowerCase() === 'chats' && path.basename(path.dirname(chatDir)).toLowerCase() !== 'modes'
  if (!isChat && to.toLowerCase().endsWith('.json') && from.toLowerCase().endsWith('.json')) {
    try {
      const before = readUtf8(to)
      let base = NO_BASE
      if (basePath) { try { base = JSON.parse(readUtf8(basePath)) } catch { base = NO_BASE } }
      const merged = deepMergeJson(JSON.parse(before), JSON.parse(readUtf8(from)), base)
      const out = JSON.stringify(merged, null, 2) + '\n'
      if (out !== before) { writeFileAtomic(to, out); acc.merged++ } // atomic: this can be the share
      return acc
    } catch { /* not valid JSON on one side → fall through to keep-both */ }
  }
  try { if (fs.readFileSync(from).equals(fs.readFileSync(to))) return acc } catch { /* unreadable → keep both */ }
  // A chat that one side merely CONTINUED (the other's messages are a prefix of it), or only re-saved (a new
  // date), is one chat: keep the longer history under the target's title/type/mode. Kept as two, the list
  // filled with duplicates of the most-used chats after every offline spell or return. Only histories that
  // really diverge are kept as both.
  if (isChat) {
    try {
      const a = JSON.parse(readUtf8(to)), b = JSON.parse(readUtf8(from))
      const ma = Array.isArray(a?.messages) ? a.messages : null, mb = Array.isArray(b?.messages) ? b.messages : null
      if (ma && mb) {
        const key = (m) => JSON.stringify([m?.role, m?.content ?? m?.text ?? ''])
        const [short, long] = ma.length <= mb.length ? [ma, mb] : [mb, ma]
        if (short.every((m, i) => key(m) === key(long[i]))) {
          if (long !== ma) { writeFileAtomic(to, JSON.stringify({ ...a, messages: long, date: b.date || a.date }, null, 2)); acc.merged++ }
          return acc
        }
      }
    } catch { /* unreadable → keep both */ }
  }
  const ext = path.extname(to); const base = path.basename(to, ext); const dir = path.dirname(to)
  let dest, n = 2
  if (isChat) {
    // A chat's FILE NAME is its id, and ids must pass isSafeChatId: "123 (from X).json" was listed but could
    // never be opened or deleted (400). The kept copy gets a safe id instead.
    dest = path.join(dir, `${base}-copy${ext}`)
    while (fs.existsSync(dest)) dest = path.join(dir, `${base}-copy${n++}${ext}`)
  } else {
    dest = path.join(dir, `${base} (from ${label})${ext}`)
    while (fs.existsSync(dest)) dest = path.join(dir, `${base} (from ${label} ${n++})${ext}`)
  }
  writeFileAtomic(dest, fs.readFileSync(from)) // atomic, like every write that can land on the share
  acc.keptBoth++
  return acc
}

// What does `from` have that `to` is missing, at the granularity the user sees in
// the app? Modes and decks are folders (report names); chats and discover are
// flat files (report counts). Drives the merge/skip prompt; empty ⇒ no choice
// to make. `cache` and the config files are intentionally omitted (silently
// unioned when merging — cache is disposable, settings can't be meaningfully
// merged so the shared folder's win).
function sourceOnlySummary(from, to) {
  const dirChildren = (base, sub, filter) => {
    const d = path.join(base, sub)
    if (!fs.existsSync(d)) return []
    try { return fs.readdirSync(d).filter(filter) } catch { return [] }
  }
  const onlyIn = (sub, filter) => {
    const src = dirChildren(from, sub, filter)
    return src.filter((n) => !fs.existsSync(path.join(to, sub, n)))
  }
  const modes = onlyIn('modes', (n) => n !== '_meta.json' && !n.startsWith('.'))
  const decks = onlyIn('decks', (n) => !n.startsWith('.'))
  const chats = onlyIn('chats', (n) => n.endsWith('.json'))
  const discover = onlyIn('discover', (n) => n.endsWith('.json'))
  const has = modes.length || decks.length || chats.length || discover.length
  return { modes, decks, chats: chats.length, discover: discover.length, has: !!has }
}

// This computer's OWN data, stashed here while a shared folder is in use. It lets
// "Back to the app folder" restore what this machine had before it joined a share
// (rather than keeping a copy of the shared data). Gitignored, hidden by the dot.
const LOCAL_HOME = path.join(APP_ROOT, '.local-home')
const dataEntriesPresent = (dir) => DATA_ENTRIES.some((e) => fs.existsSync(path.join(dir, e)))
// Is the data source actually readable? The app folder always is. A configured
// SHARED folder that shows NO data entries is unreachable (a disconnected mapped
// drive reads as empty) — callers must NOT read that emptiness as "no data /
// first run" and overwrite the real files. See shareReachable()/dataMode() below,
// which add caching and the .local-offline fallback on top of this.
//
// dataEntriesPresent() ABOVE IS SYNCHRONOUS AND MUST NEVER BE CALLED AGAINST
// DATA_DIR (a possibly-networked path) — only against a local path (BACKUP_DIR,
// LOCAL_HOME). A mapped drive that is unreachable in the "hangs" sense (the
// remote host stopped answering, as opposed to one that was cleanly unmapped)
// does not fail fast: fs.existsSync blocks on the OS/SMB connection attempt,
// which can run into tens of seconds. Node is single-threaded, so ONE such call
// freezes every request the server is holding, not only the one that triggered
// it — reproduced live: the dev server kept accepting TCP connections (so a
// window already showing the app looked merely "stuck", not crashed or closed)
// while every HTTP request, including /api/alive, timed out with zero bytes for
// as long as the probe was wedged. That is what a launch that "doesn't fix
// itself when reopened" actually was: reopening reconnects to the very same
// share, which is still unreachable the same way, so the identical freeze
// reproduces on the very first request. The dev server has no other CPU thread,
// so a synchronous DATA_DIR probe reachable from ANY request handler is a
// standing freeze waiting for a bad network moment to trigger it.
function dataEntriesPresentAsync(dir, timeoutMs = 1500) {
  return new Promise((resolve) => {
    let settled = false
    const finish = (ok) => { if (!settled) { settled = true; resolve(ok) } }
    // fs.access's ASYNC form runs on libuv's threadpool, off the main thread —
    // a worker can still sit stuck on the network call, but the event loop
    // stays free to answer every OTHER request in the meantime. Bounded on top
    // of that so a single check is never the thing a request waits on forever;
    // an abandoned probe just finishes late in the background and is ignored.
    const timer = setTimeout(() => finish(false), timeoutMs)
    if (timer.unref) timer.unref()
    let remaining = DATA_ENTRIES.length
    for (const e of DATA_ENTRIES) {
      fs.access(path.join(dir, e), fs.constants.F_OK, (err) => {
        if (!err) { clearTimeout(timer); finish(true); return }
        if (--remaining === 0) { clearTimeout(timer); finish(false) }
      })
    }
  })
}
// Move every data entry from `srcDir` into `destDir`. NEVER deletes: if `destDir`
// already holds an entry, that existing copy is parked in a dated backup first.
function moveDataEntries(srcDir, destDir) {
  let moved = 0
  for (const entry of DATA_ENTRIES) {
    const from = path.join(srcDir, entry)
    if (!fs.existsSync(from)) continue
    const to = path.join(destDir, entry)
    if (fs.existsSync(to)) {
      const backupDir = path.join(APP_ROOT, `local-data-backup-${new Date().toISOString().slice(0, 10)}`)
      fs.mkdirSync(backupDir, { recursive: true })
      let dest = path.join(backupDir, entry); let n = 2
      while (fs.existsSync(dest)) dest = path.join(backupDir, `${entry}-${n++}`)
      fs.renameSync(to, dest)
    }
    fs.mkdirSync(path.dirname(to), { recursive: true })
    fs.renameSync(from, to)
    moved++
  }
  return moved
}

// ── Auto-backup: one-way mirror of the shared data folder down to this computer ──
// When the data lives on a shared folder (e.g. an SMB share), a timer copies it
// into .local-sync/ every few minutes so a recent snapshot always exists on this
// machine even if the share goes offline. STRICTLY one-way (never writes back to
// the share, so it can never conflict), incremental (copies only new/changed
// files by size+mtime), and it skips silently when the share is unreachable so a
// dropped connection just leaves the last good snapshot in place. `cache/` is
// excluded (disposable, regenerates). This snapshot doubles as the merge BASE for
// any future offline-edit reconcile.
const BACKUP_DIR = path.join(APP_ROOT, '.local-sync')
const BACKUP_ENTRIES = DATA_ENTRIES.filter((e) => e !== 'cache')
let lastBackup = { at: null, files: 0, error: null }
function copyNewer(from, to, acc) {
  // Another computer's in-progress atomic write (`<file>.<pid>.tmp`) is not data: copying it put a stray
  // file into the merge base, and when it was renamed away between the listing and the stat, the ENOENT
  // aborted the WHOLE backup (every later file skipped until the next tick).
  if (/\.\d+\.tmp$/.test(from)) return
  let st
  try { st = fs.statSync(from) } catch (e) { if (e.code === 'ENOENT') return; throw e } // vanished mid-walk
  if (st.isDirectory()) {
    fs.mkdirSync(to, { recursive: true })
    const names = fs.readdirSync(from)
    for (const name of names) copyNewer(path.join(from, name), path.join(to, name), acc)
    // A MIRROR: a mode renamed or deleted on the share stayed in the base, came back in offline mode (with a
    // duplicate id) and was written back to the share on reconcile. Only from a listing that has entries: a
    // dying share can read as an empty folder, and that must never empty the base.
    if (names.length) {
      // Names compare like the file system does (case-blind on Windows/macOS): after a case-only rename on the
      // share ("Spanish" -> "spanish") the copy above wrote INTO the old-cased folder, which was then deleted.
      const fold = (n) => (process.platform === 'win32' || process.platform === 'darwin' ? n.toLowerCase() : n)
      const keep = new Set(names.map(fold))
      let mine = []
      try { mine = fs.readdirSync(to) } catch { mine = [] }
      for (const name of mine) {
        if (keep.has(fold(name)) || /\.\d+\.tmp$/.test(name)) continue
        try { fs.rmSync(path.join(to, name), { recursive: true, force: true }); acc.n++ } catch { /* next run */ }
      }
    }
    return
  }
  let need = true
  try { const d = fs.statSync(to); need = st.size !== d.size || st.mtimeMs > d.mtimeMs } catch { need = true }
  if (!need) return
  fs.mkdirSync(path.dirname(to), { recursive: true })
  // Via a temp copy + rename: this folder is the offline merge BASE, and a copy cut off midway (shutdown,
  // share dropped) left a truncated file there that the next 3-way merge read as the common ancestor.
  const tmp = `${to}.${process.pid}.tmp`
  try {
    fs.copyFileSync(from, tmp)
    fs.renameSync(tmp, to)
  } catch (e) {
    try { fs.rmSync(tmp, { force: true }) } catch { /* nothing to clean */ }
    if (e.code === 'ENOENT') return // the source was renamed away mid-copy: picked up next time
    // One file that can't be read (held open on the share, no permission) is skipped and reported; rethrown,
    // it stopped every backup at that file, so later files were never refreshed.
    acc.failed = (acc.failed || 0) + 1
    if (!acc.firstError) acc.firstError = `${path.basename(from)}: ${e.code || e.message}`
    return
  }
  acc.n++
}
// Which data folder `.local-sync` mirrors. Without it, after a switch from share A to share B the base still
// held A's files, and B going down before the next backup ran offline mode on A's modes and chats as B's
// (merged into B on reconnect). A snapshot of ANOTHER folder is parked in `.previous` (kept, never deleted)
// before a backup of this one; a base with no stamp (older builds) is taken as this folder's, as before.
const BACKUP_SOURCE = path.join(BACKUP_DIR, '.source.json')
function backupSource() {
  try { const d = JSON.parse(readUtf8(BACKUP_SOURCE)).dataDir; return typeof d === 'string' && d ? d : null } catch { return null }
}
function backupIsForOtherFolder() {
  const src = backupSource()
  return !!(src && !sameFolder(src, DATA_DIR))
}

async function runBackup() {
  // The folder is read ONCE: a data-folder switch during the reachability probe made the rest of the run park
  // the old share's snapshot and back up the NEW folder (or run synchronously against a dead share).
  const dir = DATA_DIR
  if (dir === APP_ROOT) return { skipped: 'local' }          // data already lives on this computer
  // Never while offline edits wait to be merged: .local-sync IS the 3-way merge base. Refreshing it to
  // the share's current state made every file the other computer changed look like "changed by me",
  // and "Merge them in" then fast-forwarded the stale offline copy over their work (reproduced).
  // reconcileOffline removes OFFLINE_DIR before its own refresh, so the post-merge backup still runs.
  // Recorded so the GET reports WHY the snapshot is getting old (it used to show the last success only).
  if (fs.existsSync(OFFLINE_META)) { lastBackup = { ...lastBackup, skipped: 'offline-pending' }; return { skipped: 'offline-pending' } }
  try {
    if (!(await dataEntriesPresentAsync(dir))) { lastBackup = { ...lastBackup, error: 'source unreachable', skipped: 'unreachable' }; return { skipped: 'unreachable' } }
    // Offline mode may have started DURING that probe (seeded from this very base): refreshing it now made the
    // other computer's changes look like this one's (see above).
    if (offlineActive || fs.existsSync(OFFLINE_META)) { lastBackup = { ...lastBackup, skipped: 'offline-pending' }; return { skipped: 'offline-pending' } }
    if (DATA_DIR !== dir) return { skipped: 'switched' } // the folder changed during the probe: the next run covers the new one
    if (backupIsForOtherFolder()) {
      const parked = path.join(BACKUP_DIR, '.previous')
      fs.rmSync(parked, { recursive: true, force: true })
      fs.mkdirSync(parked, { recursive: true })
      for (const entry of BACKUP_ENTRIES) {
        const from = path.join(BACKUP_DIR, entry)
        if (fs.existsSync(from)) fs.renameSync(from, path.join(parked, entry))
      }
      console.log('[Backup] the snapshot belonged to', backupSource(), '; parked in .local-sync/.previous')
      // Stamped NOW: from here the base holds only this folder's files. Stamped after the copy, one unreadable
      // file left the old stamp, and the next run deleted the parked snapshot and parked the partial copy.
      writeFileAtomic(BACKUP_SOURCE, JSON.stringify({ dataDir: dir }, null, 2) + '\n')
    }
    const acc = { n: 0 }
    for (const entry of BACKUP_ENTRIES) copyNewer(path.join(dir, entry), path.join(BACKUP_DIR, entry), acc)
    writeFileAtomic(BACKUP_SOURCE, JSON.stringify({ dataDir: dir }, null, 2) + '\n')
    const error = acc.failed ? `${acc.failed} file(s) could not be copied (${acc.firstError})` : null
    lastBackup = { at: new Date().toISOString(), files: acc.n, error, skipped: null }
    return { ok: true, files: acc.n, ...(error ? { error } : {}) }
  } catch (e) { lastBackup = { ...lastBackup, error: e.message }; return { error: e.message } }
}


// ── Offline mode: run from the local snapshot while the share is down ────────
// The auto-backup above keeps `.local-sync/` as a mirror of the shared folder.
// This is the other half: when the share becomes unreachable, the app RUNS from
// a local working copy instead of going dead, and the edits made offline are
// reconciled back into the share on reconnect.
//
// THREE folders, three distinct jobs — do not collapse them:
//   • DATA_DIR (e.g. Y:\)   the shared truth, written only by an explicit merge
//   • .local-sync/          the BASE: last known state of the share, read-only here
//   • .local-offline/       the offline WORKING copy, seeded from the base on entry
// Keeping the base pristine is what makes the reconcile a real 3-way merge: for
// every file we can tell "did I change it?" (offline vs base) apart from "did
// someone else change it?" (share vs base), so a fast-forward never has to be
// guessed at and a genuine conflict is never silently resolved.
const OFFLINE_DIR = path.join(APP_ROOT, '.local-offline')
const OFFLINE_META = path.join(OFFLINE_DIR, '.offline.json')
let offlineActive = false
let datadirSwitching = false
let datadirSwitchedAt = 0 // when the last switch finished (see the DATA_ROUTES guard)
let offlineReconciling = false
let ankiConnectInstallWaiters = null // /api/ankiconnect POST: responses waiting on the running install // /api/offline POST (merge or discard) in progress // /api/datadir POST in progress (one switch at a time)
let offlineSince = null

// Probing a dead mapped drive is slow (SMB timeouts), and every data request asks.
// Cache the answer briefly so a page load doesn't stack dozens of probes. The
// cache window is ASYMMETRIC on purpose: once the share is known unreachable,
// hold that answer longer (15s) rather than re-probing every 3s — each probe
// still occupies a threadpool worker for up to its own timeout even though it
// no longer blocks the server, and there is no reason to spend four of them
// re-confirming what a request 3 seconds ago already established. A share
// that comes back is still picked up within 15s, well inside the client's own
// 30s /api/offline poll.
let reachCache = { at: 0, ok: false }
const REACH_TTL_ONLINE_MS = 3000
const REACH_TTL_OFFLINE_MS = 15000
async function shareReachable() {
  if (DATA_DIR === APP_ROOT) return true
  const now = Date.now()
  const ttl = reachCache.ok ? REACH_TTL_ONLINE_MS : REACH_TTL_OFFLINE_MS
  if (now - reachCache.at < ttl) return reachCache.ok
  const dir = DATA_DIR
  const ok = await dataEntriesPresentAsync(dir)
  // A probe of the PREVIOUS folder finishing after a switch must not answer for the new one.
  if (DATA_DIR !== dir) return shareReachable()
  reachCache = { at: now, ok }
  return ok
}

// Seed (once) and activate the offline working copy. Returns false when there is
// no snapshot to run from — a machine that joined a share and never completed a
// backup has nothing local, and inventing empty data would be worse than an error.
// The data folder a pending offline copy was made from (null when there is none or it is unreadable).
function offlineCopyDataDir() {
  try { const d = JSON.parse(readUtf8(OFFLINE_META)).dataDir; return d ? path.resolve(d) : null } catch { return null }
}
// A pending offline copy made from a DIFFERENT data folder: never served, merged or discarded here.
// It stays on disk until the user switches back to the folder it belongs to.
// Folder identity the way the OS sees it: Windows and macOS paths are case-insensitive, so a folder
// re-picked as y:\ebiki instead of Y:\Ebiki must not make its own offline copy "foreign".
function sameFolder(a, b) {
  const norm = (p) => { const r = path.resolve(p); return process.platform === 'win32' || process.platform === 'darwin' ? r.toLowerCase() : r }
  return norm(a) === norm(b)
}
function offlineCopyIsForeign() {
  if (!fs.existsSync(OFFLINE_META)) return false
  const owner = offlineCopyDataDir()
  return !!owner && !sameFolder(owner, DATA_DIR)
}

function enterOffline() {
  if (offlineActive) return true
  if (!dataEntriesPresent(BACKUP_DIR)) return false
  // A snapshot of ANOTHER data folder is not this one's data (see backupSource): unreachable is honest.
  if (!fs.existsSync(OFFLINE_META) && backupIsForOtherFolder()) { console.log('[Offline] the local snapshot belongs to', backupSource(), '; not using it for', DATA_DIR); return false }
  // An offline copy left from ANOTHER data folder (the user switched folders with edits pending) is
  // not this folder's data: serving it would show, and then save, one share's files as another's.
  const owner = fs.existsSync(OFFLINE_META) ? offlineCopyDataDir() : null
  if (owner && !sameFolder(owner, DATA_DIR)) { console.log('[Offline] the pending offline copy belongs to', owner, '; not using it for', DATA_DIR); return false }
  try {
    if (!fs.existsSync(OFFLINE_META)) {
      fs.mkdirSync(OFFLINE_DIR, { recursive: true })
      for (const entry of BACKUP_ENTRIES) {
        const from = path.join(BACKUP_DIR, entry)
        if (fs.existsSync(from)) fs.cpSync(from, path.join(OFFLINE_DIR, entry), { recursive: true })
      }
      writeFileAtomic(OFFLINE_META, JSON.stringify({ since: new Date().toISOString(), dataDir: DATA_DIR }, null, 2) + '\n')
      console.log('[Offline] share unreachable. Running from a local copy in .local-offline')
    }
    offlineSince = JSON.parse(readUtf8(OFFLINE_META)).since || new Date().toISOString()
    offlineActive = true
    return true
  } catch (e) { console.log('[Offline] could not start offline mode:', e.message); return false }
}

// The state every data endpoint branches on. Called per request (cheaply), so a
// share that comes back mid-session is picked up without a restart: offline goes
// false immediately, while `.local-offline/` STAYS on disk holding the offline
// edits until the user reconciles or discards them.
async function dataMode() {
  if (await shareReachable()) { offlineActive = false; return 'online' }
  return enterOffline() ? 'offline' : 'down'
}

// Walk the offline working copy against the base. `changed` = files this computer
// actually touched while offline (new or differing bytes); anything identical to
// the base is not an edit and is left out of the reconcile entirely.
// Files an earlier, PARTIAL merge already applied (recorded in .offline.json). Merged again on the retry, a kept
// copy was written once more per retry ("-copy2", "-copy3") and a value changed online since was put back to the
// offline one. They no longer count as pending either.
// Keyed by the content hash it had when merged: edited again offline since (the share dropped a second time),
// it is pending again.
const offlineFileHash = (rel) => { try { return crypto.createHash('sha1').update(fs.readFileSync(path.join(OFFLINE_DIR, rel))).digest('hex') } catch { return null } }
function offlineApplied() {
  try { const a = JSON.parse(readUtf8(OFFLINE_META)).applied; return a && typeof a === 'object' && !Array.isArray(a) ? a : {} } catch { return {} }
}
function offlinePendingFiles() {
  const applied = offlineApplied()
  return offlineChangedFiles().filter((r) => !(applied[r] && applied[r] === offlineFileHash(r)))
}
function offlineChangedFiles(rel = '', out = []) {
  const here = path.join(OFFLINE_DIR, rel)
  if (!fs.existsSync(here)) return out
  for (const name of fs.readdirSync(here)) {
    if (!rel && name === '.offline.json') continue
    if (!rel && name === 'cache') continue // never backed up (so every cached clip read as a "change" and paused backups)
    if (/\.\d+\.tmp$/.test(name)) continue // a crashed write's temp file is not a change (it blocked the zero-change cleanup, and Merge copied it to the share)
    const r = rel ? path.join(rel, name) : name
    const abs = path.join(OFFLINE_DIR, r)
    // A dangling link or an entry removed mid-walk threw, and the /api/offline GET never answered: counted as a
    // change instead (never a silent drop).
    let isDir = false
    try { isDir = fs.statSync(abs).isDirectory() } catch { out.push(r); continue }
    if (isDir) { offlineChangedFiles(r, out); continue }
    const base = path.join(BACKUP_DIR, r)
    let same = false
    try { same = fs.existsSync(base) && fs.readFileSync(base).equals(fs.readFileSync(abs)) } catch { same = false }
    if (!same) out.push(r)
  }
  return out
}

function offlineStatus() {
  const has = fs.existsSync(OFFLINE_META)
  const owner = has ? offlineCopyDataDir() : null
  return {
    otherFolder: !!(owner && !sameFolder(owner, DATA_DIR)) ? owner : null, // edits made to a different data folder
    offline: offlineActive,
    // Edits waiting to go back to a share that is up again. NOT a copy from another folder: the
    // banner would offer "Merge them in" and write one share's edits into a different one.
    pending: has && !offlineActive && !(owner && !sameFolder(owner, DATA_DIR)),
    since: has ? offlineSince : null,
    changes: has ? offlinePendingFiles().length : 0,
    dataDir: DATA_DIR,
  }
}

// Push the offline edits back into the share, 3-way. Per changed file:
//   • share missing, or share still identical to the base  → fast-forward (copy)
//   • share ALSO moved since the base                      → true merge via
//     deepMergeInto (JSON deep-merged, non-JSON kept-both), the same
//     nothing-is-dropped rule the join/return merge uses.
// Deletions made offline are deliberately NOT replayed: an absent file is
// indistinguishable from one that was never synced, and re-deleting shared data
// on someone else's behalf is the one unrecoverable move here.
async function reconcileOffline() {
  if (offlineCopyIsForeign()) return { ok: false, code: 'otherFolder', error: 'These offline changes belong to a different shared folder. Switch back to it to merge them.' }
  const acc = { added: 0, merged: 0, keptBoth: 0 }
  const fastForward = []
  // A mode folder that no longer exists on the share under this name, whose mode (same id) lives in another
  // folder there: renamed by another computer. The offline edit goes into THAT folder; copied as it was, it
  // recreated the old folder and the load repair turned it into a ghost duplicate mode (rename undone).
  const modeHomeOnShare = new Map()
  // Ids another computer DELETED (writeModeFolders' tombstones): an offline edit of such a mode re-created its
  // folder on the share, and the mode came back on every computer. Its files are skipped (recorded as applied).
  let shareTombs = null
  const tombstoned = (id) => {
    if (shareTombs === null) {
      shareTombs = new Set()
      try { const t = JSON.parse(readUtf8(path.join(DATA_DIR, 'modes', '.deleted.json'))); if (Array.isArray(t)) t.forEach((x) => { if (x && x.id !== undefined && x.id !== null) shareTombs.add(String(x.id)) }) } catch { /* none */ }
    }
    return id !== undefined && id !== null && shareTombs.has(String(id))
  }
  const offlineIdOf = (dir) => { try { return JSON.parse(readUtf8(path.join(OFFLINE_DIR, 'modes', dir, 'config.json'))).id } catch { return undefined } }
  // The share folder of the offline mode's id, wherever it is now (another computer renamed it), or null.
  const homeOf = (dir) => {
    if (!modeHomeOnShare.has(dir)) {
      let home = null
      const id = offlineIdOf(dir)
      if (id !== undefined && id !== null) {
        try {
          for (const d of fs.readdirSync(path.join(DATA_DIR, 'modes'))) {
            try { if (String(JSON.parse(readUtf8(path.join(DATA_DIR, 'modes', d, 'config.json'))).id) === String(id)) { home = d; break } } catch { /* not a mode */ }
          }
        } catch { /* no modes folder */ }
      }
      modeHomeOnShare.set(dir, home)
    }
    return modeHomeOnShare.get(dir)
  }
  // A folder the share ALSO has, holding ANOTHER mode (both computers made a "Chemistry"): deep-merged, the two
  // unrelated modes fused (the share's id won, fields and templates unioned, knowledge mixed). The offline mode
  // goes to a free folder name instead, and its config gets that name (as an online save's conflict would).
  const clashTarget = new Map() // dir -> the free name used for a clashing offline mode
  const idsClash = (dir) => {
    try {
      const mineId = offlineIdOf(dir)
      const theirId = JSON.parse(readUtf8(path.join(DATA_DIR, 'modes', dir, 'config.json'))).id
      return mineId !== undefined && mineId !== null && theirId !== undefined && theirId !== null && String(mineId) !== String(theirId)
    } catch { return false } // no config on one side: the usual merge
  }
  const freeClashName = (dir) => {
    if (!clashTarget.has(dir)) {
      const taken = new Set(fs.readdirSync(path.join(DATA_DIR, 'modes')).map(folderKey))
      let target = null
      for (let n = 2; n < 1000 && !target; n++) if (!taken.has(folderKey(`${dir} ${n}`))) target = `${dir} ${n}`
      clashTarget.set(dir, target)
    }
    return clashTarget.get(dir)
  }
  // Where an offline mode-folder file goes, checked in this order for EVERY case: the mode's own folder on the
  // share (moved by a rename elsewhere, even when its old name now holds another mode), nowhere if another
  // computer deleted it, a free "<name> N" for a same-name clash, else where it was.
  const redirect = (rel) => {
    const m = rel.match(/^modes[\\/]([^\\/]+)[\\/](.+)$/) // both separators: rel is built with path.join (backslashes on Windows)
    if (!m) return rel
    const dir = m[1]
    const onShare = fs.existsSync(path.join(DATA_DIR, 'modes', dir))
    const clash = onShare && idsClash(dir)
    if (onShare && !clash) return rel // the same mode (or no config to tell): the usual merge
    // Not on the share and not in the BASE: a folder new in the offline copy (a rename or create made HERE);
    // redirecting it into the old folder silently undid that rename.
    const baseHad = fs.existsSync(path.join(BACKUP_DIR, 'modes', dir))
    if (clash || baseHad) {
      const home = homeOf(dir)
      if (home) return path.join('modes', home, m[2])
    }
    if (tombstoned(offlineIdOf(dir))) return null // deleted on another computer: not revived
    if (clash) { const to = freeClashName(dir); return to ? path.join('modes', to, m[2]) : rel }
    return rel
  }
  // Per file: one file that could not be written (read-only on the share, locked by another client, unreadable
  // here) stopped the whole merge at that file, on every retry, and only Discard (losing every edit) got out.
  // The rest is merged now; the offline copy stays until everything went through, and the files already merged are
  // recorded (offlineApplied) so a retry merges only what failed.
  const failed = []
  const applied = {}
  for (const rel0 of offlinePendingFiles()) {
    try {
    const rel = redirect(rel0)
    if (rel === null) { applied[rel0] = offlineFileHash(rel0); console.log('[Offline] not reviving', rel0, '(its mode was deleted on another computer)'); continue }
    const mine = path.join(OFFLINE_DIR, rel0)
    const base = path.join(BACKUP_DIR, rel0)
    const theirs = path.join(DATA_DIR, rel)
    let shareMoved = false
    if (fs.existsSync(theirs)) {
      try { shareMoved = !(fs.existsSync(base) && fs.readFileSync(base).equals(fs.readFileSync(theirs))) } catch { shareMoved = true }
    }
    if (!fs.existsSync(theirs) || !shareMoved) {
      fs.mkdirSync(path.dirname(theirs), { recursive: true })
      // Atomic: this writes the SHARE's real file; a copy cut off by a dropped connection left a truncated
      // config.json there, which every other computer then set aside as corrupt (back to onboarding).
      let bytes = fs.readFileSync(mine)
      // A clashing mode moved to a free folder carries that folder's name (else it was the same name twice).
      const cm = rel0.match(/^modes[\\/]([^\\/]+)[\\/]config\.json$/)
      if (cm && clashTarget.get(cm[1])) {
        try { const c = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, '')); bytes = Buffer.from(JSON.stringify({ ...c, name: clashTarget.get(cm[1]) }, null, 2)) } catch { /* copied as is */ }
      }
      writeFileAtomic(theirs, bytes)
      fastForward.push(rel)
    } else {
      deepMergeInto(mine, theirs, 'this computer offline', acc, fs.existsSync(base) ? base : null)
    }
    applied[rel0] = offlineFileHash(rel0)
    } catch (e) { failed.push(`${rel0} (${e.code || e.message})`) }
  }
  if (failed.length) {
    try {
      const meta = JSON.parse(readUtf8(OFFLINE_META))
      writeFileAtomic(OFFLINE_META, JSON.stringify({ ...meta, applied: { ...offlineApplied(), ...applied } }, null, 2) + '\n')
    } catch (e) { console.log('[Offline] could not record the files already merged:', e.message) }
    console.log('[Offline] could not merge', failed.length, 'file(s):', failed.join(', '))
    throw new Error(`${failed.length} file(s) could not be merged yet and are kept on this computer: ${failed.slice(0, 5).join(', ')}${failed.length > 5 ? ', ...' : ''}. Everything else was merged. Try again once they can be written.`)
  }
  fs.rmSync(OFFLINE_DIR, { recursive: true, force: true })
  offlineActive = false
  offlineSince = null
  reachCache = { at: 0, ok: false }
  await runBackup()   // refresh the base so it matches the share we just wrote
  console.log('[Offline] reconciled', fastForward.length, 'file(s) forward,', acc.merged, 'merged,', acc.keptBoth, 'kept-both')
  return { ok: true, forwarded: fastForward.length, merged: acc.merged + acc.added, keptBoth: acc.keptBoth }
}

// The API key is the ONE piece of the user's state with nowhere else to live:
// everything else they own sits on the share or is mirrored into .local-sync,
// while .env stays machine-local on purpose (a credential must never travel to
// an SMB folder). That made a single bad write PERMANENT, which is exactly what
// happened once. So the last content that HELD keys is kept beside it and a
// .env that has lost its keys heals itself from that copy on the next read, with
// no user step. Both files are machine-local and gitignored, like .env itself.
const ENV_BAK = path.join(ENV_DIR, '.env.bak')         // last content of .env that had keys
const ENV_CLEARED = path.join(ENV_DIR, '.env.cleared') // the user emptied it ON PURPOSE: never heal over that
// Providers the user cleared ON PURPOSE on this computer (JSON array, machine-local).
// The shared-folder pull skips them: without this, clearing a key on a share was
// undone before the response went out, because keys.json still held it and "this
// computer has nothing for that provider" is exactly the pull condition. keys.json
// itself is left alone (it never shrinks - it may be another computer's copy).
const ENV_DECLINED = path.join(ENV_DIR, '.env.declined')
function readDeclined() {
  try { const a = JSON.parse(readUtf8(ENV_DECLINED)); return Array.isArray(a) ? a : [] } catch { return [] }
}
function writeDeclined(list) {
  try {
    if (list.length) fs.writeFileSync(ENV_DECLINED, JSON.stringify(list) + '\n', 'utf-8')
    else fs.rmSync(ENV_DECLINED, { force: true })
  } catch { /* best effort */ }
}
const KEY_LOG = path.join(ENV_DIR, 'logs', 'keys.log')  // an audit trail for every key write

const ENV_PROVIDERS = { ANTHROPIC: 'anthropic', OPENAI: 'openai', GEMINI: 'gemini', GROK: 'grok' }
const ENV_VAR = { anthropic: 'ANTHROPIC', openai: 'OPENAI', gemini: 'GEMINI', grok: 'GROK' }

const readEnvFile = (file) => {
  if (!fs.existsSync(file)) return {}
  const keys = {}
  // CRLF too (a .env saved from Notepad): with a "\r" left on each line, `(.*)$` could not reach the
  // end of the line, so every stored key read as missing.
  for (const line of readUtf8(file).split(/\r?\n/)) {
    const match = line.match(/^VITE_(\w+)_API_KEY=(.*)$/)
    if (match && ENV_PROVIDERS[match[1]]) keys[ENV_PROVIDERS[match[1]]] = match[2].trim()
  }
  return keys
}
const hasKeys = (keys) => Object.values(keys).some((v) => v)

// Rewrite `file` so its API-key lines are exactly `keys`, preserving every OTHER
// line the file already had (it is a real .env and may hold unrelated settings).
function renderEnvFile(file, keys) {
  let existing = []
  if (fs.existsSync(file)) {
    existing = readUtf8(file).split(/\r?\n/)
      .filter((l) => !l.match(/^VITE_\w+_API_KEY=/))
      .filter((l) => l.trim() !== '')
  }
  const keyLines = Object.entries(keys)
    .filter(([, v]) => v)
    .map(([k, v]) => `VITE_${ENV_VAR[k] || k.toUpperCase()}_API_KEY=${v}`)
  return { content: [...existing, ...keyLines].join('\n') + '\n', keyLines }
}

// An audit trail for every key write. Updates get logs/update.log for exactly
// this reason - "it changed on its own" has to be answerable afterwards - and a
// vanished API key was the one event with no record at all, so a real report
// ("my Anthropic key is gone since I rejoined the share") could not be traced to
// the write that did it. PROVIDER NAMES ONLY: a key value must never reach a log.
function logKeys(action, detail) {
  try {
    fs.mkdirSync(path.dirname(KEY_LOG), { recursive: true })
    fs.appendFileSync(KEY_LOG, `${new Date().toISOString()}  ${action}  ${detail}\n`, 'utf-8')
  } catch { /* best effort: a log must never break a save */ }
}

// Keep .env.bak as the safety copy. Mirroring on READ (not only on write) means
// it exists from the first time the app asks for the keys.
// It only ever GROWS. It used to be a straight copy of .env, so a write that
// dropped a provider promptly overwrote the backup with the reduced set - the
// safety net destroyed by the very accident it exists to catch (measured on a
// real machine: .env.bak reduced to a single provider and byte-identical to
// .env, leaving nothing to restore from). It now holds the UNION of the backup
// and what is on disk, so a key can only leave it when the user CLEARS that
// provider on purpose, which is the one case that must not come back.
function mirrorEnv(clearedProviders) {
  try {
    const union = { ...readEnvFile(ENV_BAK), ...readEnvFile(ENV_FILE) }
    for (const prov of clearedProviders || []) delete union[prov]
    const { content } = renderEnvFile(ENV_BAK, union)
    let before = null
    try { before = fs.readFileSync(ENV_BAK, 'utf-8') } catch { /* no backup yet */ }
    if (before !== content) writeFileAtomic(ENV_BAK, content)
  } catch { /* best effort */ }
}

function parseEnv() {
  const keys = readEnvFile(ENV_FILE)
  if (hasKeys(keys)) { mirrorEnv(); return keys }
  // Nothing on disk. Deliberate, or an accident? Only the accident heals -
  // otherwise a key the user removed on purpose would keep coming back.
  if (fs.existsSync(ENV_CLEARED)) return keys
  const backup = readEnvFile(ENV_BAK)
  if (!hasKeys(backup)) return keys
  try {
    fs.copyFileSync(ENV_BAK, ENV_FILE)
    console.log('[Keys] .env had lost its keys. Restored them from .env.bak')
    logKeys('restored', `from .env.bak: ${Object.keys(backup).join(', ')}`)
    return readEnvFile(ENV_FILE)
  } catch { return backup }
}

// MERGE, never replace. `keys` is what the caller is ASSERTING, not the complete
// desired state of the file: a provider it does not mention is left alone, and a
// provider is deleted ONLY when it arrives NAMED with an empty value (which is
// exactly how the Settings field clears one).
//
// This used to rebuild every VITE_*_API_KEY line out of the argument, so any
// provider missing from the payload was silently erased. The only guard was a
// completely empty object, which meant `{openai: "sk-..."}` - non-empty, so it
// walked straight past the refusal - deleted the user's Anthropic key and left
// no .env.cleared marker behind. That really happened, and because .env.bak was
// a straight copy the backup went with it. A caller holding a partial picture of
// the keys (a page that read them before the other provider was added, a shared
// -folder sync that saw a short read) can no longer destroy what it did not know
// about. Deleting a key now requires SAYING SO.
function writeEnv(keys, opts) {
  const source = (opts && opts.source) || 'api'
  const payload = (keys && typeof keys === 'object') ? keys : {}
  const disk = parseEnv()
  const merged = { ...disk }
  const stored = []
  const cleared = []
  for (const [prov, val] of Object.entries(payload)) {
    if (typeof val !== 'string') continue          // never let a stray non-string delete a key
    const v = val.trim()
    if (v) { if (merged[prov] !== v) stored.push(prov); merged[prov] = v }
    else if (merged[prov]) { cleared.push(prov); delete merged[prov] }
  }
  if (!stored.length && !cleared.length) {
    // Nothing asserted that we did not already have. The old code would have
    // rewritten the file anyway; a no-op write is the moment a bug gets to
    // truncate something, so it simply does not happen now.
    return { ok: true, unchanged: true }
  }
  const { content, keyLines } = renderEnvFile(ENV_FILE, merged)
  writeFileAtomic(ENV_FILE, content) // atomic: a cut-off write left half a key, which is not "no key", so the backup never healed it
  logKeys('write', `source=${source} stored=[${stored.join(' ')}] cleared=[${cleared.join(' ')}] now=[${Object.keys(merged).join(' ')}]`)
  // Mirror whatever survives, minus anything the user just cleared on purpose.
  if (keyLines.length || cleared.length) mirrorEnv(cleared)
  // Record INTENT so the self-heal in parseEnv can tell an empty .env that the
  // user asked for from one that lost its keys some other way.
  try {
    if (keyLines.length) fs.rmSync(ENV_CLEARED, { force: true })
    else if (cleared.length) fs.writeFileSync(ENV_CLEARED, new Date().toISOString() + '\n', 'utf-8')
  } catch { /* best effort */ }
  // Per-provider intent for the shared-folder pull (see ENV_DECLINED): a cleared
  // provider stays declined until a key for it is stored again.
  const declined = readDeclined()
  const nextDeclined = [...new Set([...declined.filter((p) => !stored.includes(p)), ...cleared])]
  if (nextDeclined.join() !== declined.join()) writeDeclined(nextDeclined)
  return { ok: true, stored, cleared }
}

// ── API keys follow the shared folder ───────────────────────────────────────
// .env stays machine-local (it is where the app reads keys from), but a copy
// lives in the shared folder as keys.json so a second computer does not start
// blank and a wiped .env has a source outside this machine. Strictly ADDITIVE,
// in both directions, and it NEVER overwrites a key that already exists:
//   • this computer has a key the share lacks  -> push it up
//   • the share has a key this computer lacks  -> pull it down
//   • both have one for the same provider      -> leave both alone
// A key on THIS machine always wins, so a shared copy can never replace the one
// you are actually using. Skipped entirely when no share is configured or the
// share is unreachable, so it can never block or throw on a dead mapped drive.
// `authoritative` = the user just TYPED this key, so it is the freshest thing in
// the system and replaces the share's entry for that provider. Without it a bad
// key that once reached the share would be permanent: every new computer would
// adopt it and no correction could ever displace it. Background saves are never
// authoritative, so a routine autosave can't clobber another machine's key.
async function syncSharedKeys(opts) {
  const authoritative = !!(opts && opts.authoritative)
  // Which providers the user typed. Authority is per provider: the others still follow the additive rule.
  // (No list, from an older page: every provider, the previous behaviour.)
  const typedProviders = Array.isArray(opts?.providers) && opts.providers.length ? opts.providers : null
  if (DATA_DIR === APP_ROOT) return { skipped: 'no share' }
  if (!(await shareReachable())) return { skipped: 'unreachable' }
  const file = path.join(DATA_DIR, 'keys.json')
  try {
    // parseEnv(), NOT readEnvFile(): this function WRITES what it reads, so it
    // must read through the .env.bak self-heal. Reading the raw file meant a
    // short read here became a short WRITE below - the "never write back what
    // you failed to read" shape, in the one function the guard list missed. The
    // empty-write refusal could not catch it either, because `merged` carries
    // the key just pulled from the share and so is never empty.
    const local = parseEnv()
    // Only a MISSING file is "nothing shared". A read or parse failure (another computer mid-write, a
    // locked or torn file) used to count as {} too, so every local key was "pushed" and keys.json was
    // rewritten with this machine's keys only, dropping the other computers' copies.
    // Same rule as readConfigSettled: retry once (another computer mid-write), and a file that is still
    // not JSON after that is set aside as keys.json.corrupt-<stamp> (kept, never deleted) so sharing can
    // heal; refusing forever meant a new computer never received keys again. An IO error just skips.
    let shared = {}
    const readShared = () => JSON.parse(readUtf8(file)) || {}
    try { shared = readShared() } catch (e) {
      if (e && e.code === 'ENOENT') shared = {}
      else {
        await new Promise((r) => setTimeout(r, 1000))
        try { shared = readShared() } catch (e2) {
          if (e2 && e2.code === 'ENOENT') shared = {}
          else if (e2 instanceof SyntaxError) {
            try { fs.renameSync(file, `${file}.corrupt-${Date.now()}`) } catch { return { skipped: 'unreadable' } }
            console.log('[Keys] shared keys.json was not valid JSON; kept it aside and starting a fresh one')
            shared = {}
          } else { console.log('[Keys] shared keys.json unreadable, sync skipped:', e2 && e2.message); return { skipped: 'unreadable' } }
        }
      }
    }
    if (!shared || typeof shared !== 'object' || Array.isArray(shared)) return { skipped: 'unreadable' }

    // Pull down: only providers this computer has nothing for, and never one the
    // user cleared here on purpose (that would undo the removal they just asked for).
    const merged = { ...local }
    const pulled = []
    const declined = readDeclined()
    for (const [prov, val] of Object.entries(shared)) {
      if (val && typeof val === 'string' && !merged[prov] && !declined.includes(prov)) { merged[prov] = val; pulled.push(prov) }
    }
    if (pulled.length) {
      // Only the ADOPTED providers are asserted. writeEnv merges, so naming just
      // these can never disturb a key this computer already holds, whatever this
      // function believed it read a moment ago.
      const adopted = {}
      for (const prov of pulled) adopted[prov] = merged[prov]
      writeEnv(adopted, { source: 'shared-folder-pull' })
      // Adopting a key from the share is a deliberate new key, so the
      // "cleared on purpose" marker no longer applies.
      try { fs.rmSync(ENV_CLEARED, { force: true }) } catch { /* best effort */ }
      console.log('[Keys] adopted from the shared folder:', pulled.join(', '))
    }

    // Push up: only providers the share has nothing for.
    const out = { ...shared }
    const pushed = []
    for (const [prov, val] of Object.entries(merged)) {
      if (val && (!out[prov] || (authoritative && (!typedProviders || typedProviders.includes(prov)) && out[prov] !== val))) { out[prov] = val; pushed.push(prov) }
    }
    if (pushed.length) {
      // Never publish a set SMALLER than what the share already holds: keys.json
      // is another computer's only copy of its own key. `out` starts from
      // `shared` so it can only grow, but assert it rather than trust it.
      if (Object.keys(out).length >= Object.keys(shared).length) {
        writeFileAtomic(file, JSON.stringify(out, null, 2) + '\n') // readers never see a half-written file
        logKeys('share-push', `providers=[${pushed.join(' ')}]`)
        console.log('[Keys] saved to the shared folder:', pushed.join(', '))
      }
    }
    return { pulled, pushed }
  } catch (e) {
    console.log('[Keys] shared-key sync skipped:', e.message)
    return { error: e.message }
  }
}

// ── Mode folders (modes/<name>/config.json + knowledge/) ─────────────────────────────────────────
// The folder a mode lives in. Windows silently drops trailing dots and spaces from folder names, so
// "Intro to C." was written into "Intro to C" and the save's sweep (which removes every folder the
// payload does not name) then deleted it, knowledge base included. "." and ".." resolved outside the
// mode's own folder (".." wrote a mode config over the data folder's config.json). Device names
// (CON, NUL, COM1...) cannot be folders on Windows. Every name that was already valid maps to itself.
const WIN_RESERVED_NAME = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i
function modeFolderName(name, id) {
  let clean = String(name || '').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().replace(/[. ]+$/, '')
  if (WIN_RESERVED_NAME.test(clean)) clean += '_'
  return clean || (id !== undefined && id !== null ? `mode-${id}` : '')
}

// The folder of a mode known only by NAME (the knowledge endpoints). A name with nothing usable in it
// ("???", "...") is saved under mode-<id>, but by name alone it resolved to '' and that mode's knowledge
// base could never be used. Only then, the folder whose saved config carries exactly this name.
function modeFolderForName(modesDir, name) {
  const direct = modeFolderName(name)
  if (direct || !name) return direct
  try {
    for (const d of fs.readdirSync(modesDir)) {
      try { if (JSON.parse(readUtf8(path.join(modesDir, d, 'config.json')))?.name === name) return d } catch { /* not a mode folder */ }
    }
  } catch { /* no modes folder */ }
  return ''
}

// Windows and macOS folders are case-insensitive: "spanish" and "Spanish" are one folder there.
const folderKey = (d) => (process.platform === 'linux' ? d : d.toLowerCase())

// Persist the whole modes list: one folder per mode, and every other folder removed (a deleted mode).
//   • A RENAMED mode keeps its folder (it is moved to the new name, found by id among the folders
//     about to be removed). Writing the config under the new name and sweeping the old folder used
//     to delete the mode's knowledge base.
//   • Names are compared the way the file system compares them, so a case-only rename on Windows no
//     longer writes into the existing folder and then deletes it as "not named".
//   • deletedIds (the current client always sends it, possibly empty): delete ONLY those modes. A
//     list merely missing a mode is not a deletion: on a shared folder a second computer holding
//     an older list removed modes the first had just created. With no deletedIds (an older build),
//     the historical "absent = deleted" rule still applies.
// Old builds shipped a "Default" TEMPLATE folder (a config with no id). It is skipped when listing and
// never swept, but only that template: a real mode the user NAMED "Default" has an id, and hiding every
// folder called Default made such a mode vanish on the next load, settings and knowledge base included.
function isDefaultTemplate(modesDir, d) {
  if (String(d).toLowerCase() !== 'default') return false
  try { const c = JSON.parse(readUtf8(path.join(modesDir, d, 'config.json'))); return c?.id === undefined || c?.id === null } catch (e) { return e?.code === 'ENOENT' } // unreadable for a moment (SMB lock, a write in flight): not the template, so the listing retries it instead of hiding a real mode
}

// `changedIds` (optional): the modes this save CHANGED. Only those are written; the rest of the list is context
// (conflict checks, what to keep). A whole-list write from one computer put its stale copy of every OTHER mode
// back over what a second computer on the shared folder had just changed (and moved a renamed folder back),
// on every keystroke in Settings. No list = every mode is written, as before (create, delete, rename, repair).
// `renamedIds` (optional): the modes this save RENAMES. With the list present, a mode whose folder is missing
// is moved from its same-id folder ONLY when named here: a stale list still showing the old name (another
// computer renamed it since) moved the folder BACK and undid that rename. It is reported with the folder's
// current name instead, which the client adopts. No list (an older client) = the old behaviour.
function writeModeFolders(modesDir, modes, activeModeId, deletedIds, changedIds, renamedIds) {
  const renamed = Array.isArray(renamedIds) ? new Set(renamedIds.map((x) => (x === undefined || x === null ? undefined : String(x)))) : null
  const changed = Array.isArray(changedIds) ? new Set(changedIds.map((v) => (v === undefined || v === null ? undefined : String(v)))) : null
  const isDir = (d) => { try { return fs.statSync(path.join(modesDir, d)).isDirectory() } catch { return false } }
  const targets = modes.map((m) => modeFolderName(m.name, m.id))
  const keep = new Set(['_meta.json', ...fs.readdirSync(modesDir).filter((d) => isDefaultTemplate(modesDir, d)), ...targets].map(folderKey))
  const idOf = (d) => { try { return JSON.parse(readUtf8(path.join(modesDir, d, 'config.json'))).id } catch { return undefined } }
  // Ids compared as TEXT: a config holding "5" (hand edit, an older merge) is the same mode the client now
  // sends as 5 (the load repair converts it). Strictly, "5" !== 5 looked like ANOTHER computer's folder: a
  // conflict, a rename to "X 2" that left the knowledge base behind, and one more copy on every launch.
  const idKey = (v) => (v === undefined || v === null ? undefined : String(v))
  const leaving = new Map(fs.readdirSync(modesDir).filter((d) => !keep.has(folderKey(d)) && isDir(d)).map((d) => [d, idOf(d)]))
  // Each mode's name as saved BEFORE this write, by id, so a rename can carry its chats along (below).
  // Only ids held by ONE folder: the load's duplicate-id repair keeps the id on one of two same-id modes
  // and re-ids the other, and reading "the last folder with id 5" made that look like a rename of the
  // other mode, re-filing all of its chats under this one's name (not undoable: both then share a tag).
  const nameBefore = new Map()
  const idSeenTwice = new Set()
  for (const d of fs.readdirSync(modesDir)) {
    if (!isDir(d)) continue
    try {
      const c = JSON.parse(readUtf8(path.join(modesDir, d, 'config.json')))
      if (c && idKey(c.id) !== undefined && typeof c.name === 'string') { const k = idKey(c.id); if (nameBefore.has(k)) idSeenTwice.add(k); nameBefore.set(k, c.name) }
    } catch { /* not a mode folder */ }
  }
  for (const id of idSeenTwice) nameBefore.delete(id)
  const keptIds = new Set(modes.map((m) => idKey(m.id)))
  // A folder that holds a mode this list does not know (another computer on the shared folder made "Chem"
  // after this one loaded) is NOT overwritten: its config was replaced, that mode vanished everywhere and
  // this one took over its knowledge base. Reported with a free name; the client renames and saves again.
  const conflicts = []
  const takenKeys = new Set([...fs.readdirSync(modesDir), ...targets].map(folderKey))
  const skipped = new Set() // modes NOT written (a name owned by another computer's mode, or a failed folder move)
  const renameFailed = []
  // Ids deleted on purpose (`.deleted.json`, written by the delete sweep below). A second computer still holding
  // a deleted mode re-created its folder on its next save of that mode (a deck pick, a hook), and the mode came
  // back everywhere. Such a mode is not written again; the client drops it (`deletedElsewhere`). New ids are
  // minted from the clock (`mintModeId`), so a real create never hits a tombstone.
  const tombFile = path.join(modesDir, '.deleted.json')
  let tombs = []
  // Only a MISSING file is "none yet". A read that failed otherwise (an SMB lock while another computer renames
  // its temp file) is retried once; still unreadable, no tombstone is written this time (writing the new one alone
  // would erase every earlier one). A damaged (unparsable) file is replaced, as before.
  let tombsReadable = true
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const t = JSON.parse(readUtf8(tombFile)); if (Array.isArray(t)) tombs = t.filter((x) => x && idKey(x.id) !== undefined)
      tombsReadable = true; break
    } catch (e) {
      tombsReadable = e?.code === 'ENOENT' || e instanceof SyntaxError
      if (tombsReadable) break
    }
  }
  const tombIds = new Set(tombs.map((x) => idKey(x.id)))
  const deletedElsewhere = []
  const untouched = new Set() // modes this save did not change: never written, moved or re-tagged
  modes.forEach((mode, i) => {
    if (changed && !changed.has(idKey(mode.id))) { untouched.add(idKey(mode.id)); return }
    const dir = path.join(modesDir, targets[i])
    const owner = fs.existsSync(dir) ? idOf(targets[i]) : undefined
    // Foreign also when the owner is in the list but NOT being written (a one-mode save): another computer
    // renamed that mode INTO this name, and writing here took over its folder and knowledge base.
    // And in a WHOLE-list save (no changedIds: create, delete, repair) ANY other mode's folder is foreign: a
    // stale list still naming that mode by its old name wrote over it (knowledge base and all). Only a save
    // that changes BOTH modes (a real swap) may move one into the other's folder.
    // Two names of one payload that map to ONE folder ("CON" and "CON_") are a conflict for the later one.
    const dupTarget = targets.findIndex((t2, j) => j < i && folderKey(t2) === folderKey(targets[i])) >= 0
    if (dupTarget || (idKey(owner) !== undefined && idKey(owner) !== idKey(mode.id) && (!keptIds.has(idKey(owner)) || (!changed && !idSeenTwice.has(idKey(owner))) || (changed && !changed.has(idKey(owner)))))) {
      // (An id held by TWO folders is the load repair re-iding one of them: that folder is its own.)
      let suggested = null
      for (let n = 2; n < 1000 && !suggested; n++) {
        const cand = `${mode.name} ${n}`
        const key = folderKey(modeFolderName(cand, mode.id))
        if (!takenKeys.has(key)) { suggested = cand; takenKeys.add(key) }
      }
      conflicts.push({ id: mode.id, name: mode.name, suggested: suggested || `${mode.name} ${Date.now()}` })
      console.log('[Modes] not overwriting', JSON.stringify(targets[i]), '(it belongs to mode', owner, 'which this list does not know)')
      skipped.add(idKey(mode.id))
      return
    }
    // The target exists but holds NO mode (the old id-less "Default" template, a folder a knowledge upload made,
    // a config set aside as corrupt): the renamed mode's own folder must still move in, or its knowledge base
    // stayed behind in the old folder. The id-less folder is parked beside it, never deleted.
    if (fs.existsSync(dir) && idKey(owner) === undefined && idKey(mode.id) !== undefined) {
      const same = [...leaving].filter(([, id]) => idKey(id) === idKey(mode.id))
      if (same.length === 1) {
        const parked = `${targets[i]} (parked ${new Date().toISOString().slice(0, 10)} ${Date.now() % 100000})`
        try {
          fs.renameSync(dir, path.join(modesDir, parked)); keep.add(folderKey(parked))
          // Its id-less config set aside too: listed, it came back as a ghost mode on every launch (re-id'd, and
          // its conflict pushed the user's real mode of that name to "... 3").
          // Only a config that READ as id-less: one that could not be read (locked on the share) may be another
          // computer's mode, and setting it aside would hide that mode everywhere.
          const pc = path.join(modesDir, parked, 'config.json')
          let idless = false
          try { const c = JSON.parse(readUtf8(pc)); idless = !c || c.id === undefined || c.id === null } catch { idless = false }
          if (idless) fs.renameSync(pc, pc + '.parked')
        } catch (e) { console.log('[Modes] could not park', JSON.stringify(targets[i]), e.message) }
      }
    }
    if (!fs.existsSync(dir) && mode.id !== undefined && mode.id !== null) {
      // Only an UNAMBIGUOUS rename: two folders sharing this id (modes made on two computers by an older
      // build) cannot tell which one this is, and guessing overwrote the other mode.
      const sameId = [...leaving].filter(([, id]) => idKey(id) !== undefined && idKey(id) === idKey(mode.id))
      const prev = sameId.length === 1 ? sameId[0][0] : undefined
      let prevName = prev
      if (prev !== undefined) { try { prevName = JSON.parse(readUtf8(path.join(modesDir, prev, 'config.json'))).name || prev } catch { /* the folder name */ } }
      // A folder whose own config already names THIS target is only misnamed (a rename whose config write failed,
      // a hand rename, an older build's folder rule): it is moved as before. "Adopting" its name, which is the
      // mode's current name, repeated the same conflict on every save and the mode was never written again.
      const misnamed = prev !== undefined && folderKey(modeFolderName(prevName, mode.id)) === folderKey(targets[i])
      if (prev !== undefined && renamed && !renamed.has(idKey(mode.id)) && !misnamed) {
        keep.add(folderKey(prev)); leaving.delete(prev)
        conflicts.push({ id: mode.id, name: mode.name, suggested: prevName, adopt: true }) // this same mode, renamed elsewhere
        skipped.add(idKey(mode.id))
        return
      }
      if (prev !== undefined) {
        try {
          fs.renameSync(path.join(modesDir, prev), dir)
          leaving.delete(prev)
          console.log('[Modes] renamed folder', JSON.stringify(prev), '→', JSON.stringify(targets[i]))
        } catch (e) {
          // The move failed (Windows refuses while a file inside is open: an editor, antivirus, a share
          // lock). Writing the new folder anyway left TWO folders with this id (a ghost copy of the mode,
          // the knowledge base on only one), and without explicit deletes the old one was swept with its
          // knowledge base. Leave this mode exactly as it was and report it; the client restores the name.
          console.log('[Modes] could not move the renamed mode\'s folder:', e.message)
          keep.add(folderKey(prev)); leaving.delete(prev)
          renameFailed.push({ id: mode.id, name: mode.name, previous: nameBefore.get(idKey(mode.id)) ?? null })
          skipped.add(idKey(mode.id))
          return
        }
      }
    }
    // This mode already lives in ANOTHER folder that stays (another computer renamed it; this list is older):
    // creating this one made a second folder with the same id and no knowledge base. Reported with the
    // folder's current name, which the client adopts.
    if (!fs.existsSync(dir) && idKey(mode.id) !== undefined) {
      const home = fs.readdirSync(modesDir).find((d) => folderKey(d) !== folderKey(targets[i]) && keep.has(folderKey(d)) && isDir(d) && idKey(idOf(d)) === idKey(mode.id))
      if (home) {
        let homeName = home
        try { homeName = JSON.parse(readUtf8(path.join(modesDir, home, 'config.json'))).name || home } catch { /* the folder name */ }
        conflicts.push({ id: mode.id, name: mode.name, suggested: homeName, adopt: true })
        skipped.add(idKey(mode.id))
        return
      }
    }
    if (!fs.existsSync(dir) && tombIds.has(idKey(mode.id))) {
      console.log('[Modes] not re-creating deleted mode', JSON.stringify(mode.name), mode.id)
      deletedElsewhere.push({ id: mode.id, name: mode.name })
      skipped.add(idKey(mode.id))
      return
    }
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    writeFileAtomic(path.join(dir, 'config.json'), JSON.stringify(mode, null, 2))
  })
  const explicit = Array.isArray(deletedIds) ? new Set(deletedIds.map(idKey)) : null
  for (const d of fs.readdirSync(modesDir)) {
    if (keep.has(folderKey(d)) || !isDir(d)) continue
    if (explicit) {
      const id = idOf(d)
      if (idKey(id) === undefined || !explicit.has(idKey(id)) || keptIds.has(idKey(id))) continue
      if (!tombIds.has(idKey(id))) { tombIds.add(idKey(id)); tombs.push({ id, at: Date.now() }) }
    }
    fs.rmSync(path.join(modesDir, d), { recursive: true, force: true })
  }
  if (!tombsReadable) console.log('[Modes] deleted-mode record unreadable; not updated this time')
  if (explicit && tombs.length && tombsReadable) {
    try { writeFileAtomic(tombFile, JSON.stringify(tombs.slice(-500))) } catch (e) { console.log('[Modes] could not record deleted ids:', e.message) }
  }
  writeFileAtomic(path.join(modesDir, '_meta.json'), JSON.stringify({ activeModeId })) // atomic: a torn read failed another computer's whole modes load
  // A renamed mode keeps its chats: they are tagged with the mode NAME, the Discover learner profile reads
  // only chats tagged with the current name, and a chat keeps its tag on save, so after a rename every
  // earlier chat silently dropped out of that mode's profile. Best effort; never fails the modes save.
  try {
    // A name still used by a mode in this list keeps its chats (a swap, or the repair case above).
    const namesNow = new Set(modes.map((m) => m.name))
    // Not a rename that was REFUSED (the name belongs to another computer's mode): its chats moved to that mode.
    const renames = modes.filter((m) => !skipped.has(idKey(m.id)) && !untouched.has(idKey(m.id)) && nameBefore.has(idKey(m.id)) && nameBefore.get(idKey(m.id)) !== m.name && !namesNow.has(nameBefore.get(idKey(m.id)))).map((m) => [nameBefore.get(idKey(m.id)), m.name])
    const chatsDir = path.join(path.dirname(modesDir), 'chats')
    if (renames.length && fs.existsSync(chatsDir)) {
      const map = new Map(renames)
      for (const f of fs.readdirSync(chatsDir)) {
        if (!f.endsWith('.json')) continue
        try {
          const file = path.join(chatsDir, f)
          const chat = JSON.parse(readUtf8(file))
          if (chat && typeof chat.mode === 'string' && map.has(chat.mode)) writeFileAtomic(file, JSON.stringify({ ...chat, mode: map.get(chat.mode) }, null, 2))
        } catch { /* one unreadable chat must not stop the rest */ }
      }
    }
  } catch (e) { console.log('[Modes] could not re-tag chats after a rename:', e.message) }
  return { conflicts, renameFailed, deletedElsewhere }
}

// A config.json that EXISTS but cannot be read or parsed (a half-written file, a lock, a short SMB read)
// is NOT an empty config. Reporting it as {} made the client think this was a first run: onboarding came
// back and the autosave wrote defaults over the real file. `ok: false` lets the GET answer 503 instead,
// which the client already treats as "unreachable" (autosave off, banner shown, file left alone).
function readConfigChecked() {
  const file = dataPath('config.json')
  if (!fs.existsSync(file)) return { ok: true, data: {} }
  try { return { ok: true, data: JSON.parse(readUtf8(file)) } }
  catch (e) { return { ok: false, error: e.message, corrupt: e instanceof SyntaxError } }
}

// What the GET serves. A failed read is retried for about a second first: another computer on the
// share (an older build writes in place) may be mid-write, which settles on its own. After that:
//   • still an IO error (lock, short read) → not ok, the GET answers 503 and a reload recovers;
//   • the file really is not JSON → it is moved aside as config.json.corrupt-<stamp> (kept, never
//     deleted) and the app continues as a fresh config. Without this, one bad file would lock the
//     app behind the "unreachable" banner on every launch with no way out.
async function readConfigSettled() {
  let r = readConfigChecked()
  for (let i = 0; i < 4 && !r.ok; i++) {
    await new Promise((ok) => setTimeout(ok, 250))
    r = readConfigChecked()
  }
  if (r.ok || !r.corrupt) return r
  const file = dataPath('config.json')
  const kept = `${file}.corrupt-${new Date().toISOString().replace(/[:.]/g, '-')}`
  try {
    fs.renameSync(file, kept)
    console.log('[Config] config.json was not valid JSON; kept it as', path.basename(kept), 'and started fresh:', r.error)
    return { ok: true, data: {} }
  } catch (e) {
    return { ok: false, error: `${r.error} (could not set it aside: ${e.message})` }
  }
}

function readConfig() {
  const r = readConfigChecked()
  return r.ok ? r.data : {}
}

// Write-then-rename so a reader (possibly another computer on the shared folder) never sees a
// half-written file, and an interrupted write (share dropped, app closed) cannot leave a truncated
// one behind. If the rename is refused (antivirus/indexer lock on Windows), fall back to a plain write.
// Used for every whole-file data write: config, chats, mode configs, deck notes, Discover blobs.
function writeFileAtomic(file, text) {
  const tmp = `${file}.${process.pid}.tmp`
  // A failed TEMP write (disk full, quota, share gone) throws WITHOUT touching the real file: falling back
  // to a plain write there truncated it first (O_TRUNC), leaving an empty config.json or mode config.
  try { fs.writeFileSync(tmp, text, 'utf-8') } catch (e) {
    try { fs.rmSync(tmp, { force: true }) } catch { /* nothing to clean */ }
    throw e
  }
  try { fs.renameSync(tmp, file) } catch {
    try { fs.rmSync(tmp, { force: true }) } catch { /* nothing to clean */ }
    fs.writeFileSync(file, text, 'utf-8')
  }
}

// Merges over what is on disk, so it must never merge over a FAILED read: readConfig's {} fallback
// made a torn or locked file look empty, and the save then replaced it with just the new keys.
// Is HEAD on PUBLISHED history? (Same rule as launch.ps1 Test-HeadPublished / launch.sh head_published.)
// Published = on ANY value origin/master has had (its reflog): an earlier fetch (the launcher's, a try refused
// as dirty) already moved the ref, and checking only its last value refused forever. Plus every commit HEAD was
// set to FROM the remote (a clone does not log origin/master's first value). `extra`: one more remote value.
function headPublished(git, extra, cb) {
  git(['reflog', 'show', '--format=%H', 'refs/remotes/origin/master'], (eRl, rlOut) => {
    git(['reflog', 'show', '--format=%H %gs', 'HEAD'], (eHl, hlOut) => {
      const fromRemote = eHl ? [] : String(hlOut || '').split(/\r?\n/).slice(0, 500)
        .filter((l) => /^[0-9a-f]+ (clone:|reset: moving to FETCH_HEAD\s*$|(pull[^:]*|merge [0-9a-f]{7,}): Fast-forward\s*$)/.test(l)).map((l) => l.split(' ')[0])
      const cands = [...new Set([...(eRl ? [] : String(rlOut || '').split(/\s+/).slice(0, 200)), ...fromRemote, extra].filter(Boolean))]
      const tryNext = (i) => {
        if (i >= cands.length) { cb(false); return }
        git(['merge-base', '--is-ancestor', 'HEAD', cands[i]], (ePub) => { if (ePub) tryNext(i + 1); else cb(true) })
      }
      tryNext(0)
    })
  })
}

function writeConfig(data) {
  const r = readConfigChecked()
  if (!r.ok) throw new Error(`config.json could not be read (${r.error}); not overwriting it`)
  // Nested per-provider / per-model maps merge one level deep (see src/utils/configDiff.js).
  const merged = mergeConfigPatch(r.data, data)
  writeFileAtomic(dataPath('config.json'), JSON.stringify(merged, null, 2) + '\n')
}

// May this request reach an /api route? Every handler parses its body as JSON whatever the
// Content-Type says, so a web page on ANY site could send a "simple" text/plain POST to
// localhost:3000 with no CORS preflight: it cannot read the reply, but the side effect happens
// (a /api/modes POST naming one mode deletes every other mode folder; /api/datadir repoints the
// data folder). And plugin middlewares run BEFORE Vite's own allowedHosts check, so a DNS-rebound
// domain pointing at 127.0.0.1 would reach them too. Two rules, neither of which any real caller
// breaks: the page and the overlay are same-origin, and the Electron main process, the launch
// scripts and curl send no Origin at all.
//   1. Host must be a loopback name (the server listens on loopback only).
//   2. An Origin, when present, must be this same host. 'null' (sandboxed frames, file pages) fails.
const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]'])
// Chat ids are Date.now() strings. Anything else (a "../" in particular) is refused rather than
// joined into a path, so a bad id can never read, write or delete a file outside chats/.
const isSafeChatId = (id) => typeof id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(id)

// Folder name for a deck's progress log. Anki subdecks are named "Parent::Child", and ":" is not allowed
// in a Windows file name, so the progress log of every subdeck failed to save (mkdir ENOENT) and
// "Generate Insights" silently did nothing for it. "::" becomes "--", other characters Windows refuses
// become "_", trailing dots/spaces go. A name that was already valid maps to ITSELF, so existing
// folders are found exactly as before. Also can never climb out of decks/ (no separators, no "..").
const deckDirName = (deck) => {
  const n = String(deck || '').replace(/::/g, '--').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/[. ]+$/, '')
  return !n || n === '.' || n === '..' ? '_' : n
}

function apiRequestAllowed(headers = {}) {
  const host = String(headers.host || '')
  if (host) {
    let name = ''
    try { name = new URL(`http://${host}`).hostname } catch { /* malformed Host */ }
    if (!LOOPBACK_HOSTNAMES.has(name)) return false
  }
  // Requests a browser makes on behalf of ANOTHER site. An <img src="http://localhost:3000/api/...">
  // carries no Origin at all, so without this any web page could make this server spawn a
  // PowerShell (/api/ankiconnect) or git (/api/update) process per tag, hundreds at once. Every
  // current browser sends Sec-Fetch-Site; the app and overlay send "same-origin", a typed URL
  // "none", and Electron main / the launch scripts / curl send nothing, so real callers still pass.
  const site = headers['sec-fetch-site']
  if (site === 'cross-site' || site === 'same-site') return false
  // Only fetch()/sendBeacon ("empty") or a typed URL ("document") may reach the API. An <img>, <audio>
  // or stylesheet URL inside rendered content is SAME-origin and so passed the check above: an image tag
  // in a shared-deck card or an injected reply could fire /api calls (each spawning a process) at will.
  const dest = headers['sec-fetch-dest']
  if (dest && dest !== 'empty' && dest !== 'document') return false
  const origin = headers.origin
  if (origin === undefined) return true
  try {
    const o = new URL(String(origin))
    return (o.protocol === 'http:' || o.protocol === 'https:') && !!host && o.host === host
  } catch { return false }
}

// Ebi's pictures (see configureServer). `sharp` is optional: without it the originals are served.
const ebiImages = createEbiImages({
  srcDir: path.join(SELF_DIR, 'public', 'assets', 'shrimp'),
  cacheDir: path.join(SELF_DIR, '.cache', 'ebi'),
  loadSharp: () => import('sharp').then((m) => m.default || m),
  log: (m) => console.log('[Ebi images]', m),
})

function apiPlugin() {
  return {
    name: 'api-plugin',
    // `vite preview` of a build: Ebi's pictures still resolve (the /api routes exist only on the dev server).
    configurePreviewServer(server) { server.middlewares.use(ebiImages.middleware) },
    configureServer(server) {
      // A rejected promise nobody handled (an async middleware throwing outside its try) is FATAL on current
      // Node: the dev server exited and every window lost its backend. Logged instead; registered once.
      if (!globalThis.__ebikiRejectionGuard) {
        globalThis.__ebikiRejectionGuard = true
        process.on('unhandledRejection', (err) => console.error('[Server] unhandled rejection (kept running):', err?.stack || err))
      }
      // Decode every /api request body as UTF-8 BEFORE any handler reads it. The handlers below
      // build their body with `body += chunk`, which decodes each network chunk on its own, so a
      // multi-byte character (é, ñ, 日) that straddles a chunk boundary turned into U+FFFD and was
      // then SAVED that way: into chats, mode configs, knowledge files and notes sent to Anki.
      // Measured: a 600 KB body of accented text came through with 7 corrupted characters.
      // setEncoding routes the stream through a StringDecoder, which carries a split character
      // over to the next chunk. Every handler reads text, so nothing here wants raw bytes.
      // Registered FIRST so it runs ahead of every /api handler.
      server.middlewares.use('/api', (req, res, next) => {
        if (!apiRequestAllowed(req.headers)) {
          console.log('[API] refused a cross-site request:', req.method, req.originalUrl || req.url, 'origin=', req.headers.origin, 'host=', req.headers.host)
          res.statusCode = 403
          res.end('{"error":"forbidden"}')
          return
        }
        next()
      })
      // Vite's own "open this file in your editor" route (a dev convenience) sits OUTSIDE /api, so any
      // website could fire it with an <img src="http://localhost:3000/__open-in-editor?file=…">. Nothing
      // in Ebiki uses it; same rules as /api.
      server.middlewares.use('/__open-in-editor', (req, res, next) => {
        if (!apiRequestAllowed(req.headers)) { res.statusCode = 403; res.end('forbidden'); return }
        next()
      })
      server.middlewares.use('/api', (req, _res, next) => { try { req.setEncoding('utf8') } catch { /* already consumed */ } next() })

      // Auto-backup timer: mirror the shared data folder to this computer every
      // 10 minutes (and once ~20s after start). Unref'd so it never holds the
      // process open; cleared when the dev server closes.
      const backupTimer = setInterval(() => { runBackup().catch(() => {}); syncSharedKeys().catch(() => {}) }, 10 * 60 * 1000)
      if (backupTimer.unref) backupTimer.unref()
      // Unref'd like the interval above: this hook also runs under vitest, where a
      // live 20s handle kept the test process from exiting ("something prevents
      // Vite server from exiting") and would mask a real hang from the timer below.
      const firstBackup = setTimeout(() => { runBackup().catch(() => {}); syncSharedKeys().catch(() => {}) }, 20000)
      if (firstBackup.unref) firstBackup.unref()
      server.httpServer?.once('close', () => { clearInterval(backupTimer); clearTimeout(firstBackup) })

      // ── Keep Anki's sync toast off the top of Ebiki (Windows) ─────────────
      // Anki pops a frameless ALWAYS-ON-TOP "Collection sync complete." popup after every sync,
      // which floats over Ebiki for a second or two. It is an open upstream bug
      // (ankitects/anki#4188) with no Anki setting to turn it off, so a tiny helper demotes the
      // popup out of the topmost band as it appears. See scripts/anki-toast-behind.ps1 for the
      // safety rules - it can only ever touch Qt TOOLTIP windows, and it does nothing at all while
      // Anki is the foreground app.
      //
      // Owned by the DEV SERVER rather than by Electron because it has to cover BOTH launch modes:
      // the app window and the browser tab. The server is the only thing both share, and its
      // lifetime is already the app's lifetime.
      let toastGuard = null
      const stopToastGuard = () => {
        if (!toastGuard || toastGuard.killed) return
        try {
          if (process.platform === 'win32') spawn('taskkill', ['/F', '/T', '/PID', String(toastGuard.pid)], { shell: true }).on('error', () => {})
          else toastGuard.kill()
        } catch { /* best effort */ }
        toastGuard = null
      }
      // VITEST runs the whole config too, and a live child process there keeps the test runner from
      // ever exiting ("something prevents Vite server from exiting"). Nothing under test wants a
      // window watchdog, so it is skipped outright - and unref()'d below in any case, so it can
      // never be the reason a Node process stays alive.
      if (process.platform === 'win32' && !process.env.VITEST) {
        try {
          const guardScript = path.resolve('scripts/anki-toast-behind.ps1')
          if (fs.existsSync(guardScript)) {
            toastGuard = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', guardScript], {
              stdio: 'ignore', windowsHide: true,
            })
            toastGuard.unref()
            toastGuard.on('exit', () => { toastGuard = null })
            toastGuard.on('error', (e) => { console.warn('[Anki toast] guard could not start:', e.message); toastGuard = null })
            console.log('[Anki toast] guard running, pid', toastGuard.pid)
          }
        } catch (e) {
          console.warn('[Anki toast] guard could not start:', e.message)   // never fatal
        }
        // Covers Ctrl+C on a manual `npm run dev` as well as the auto-exit path below.
        process.on('exit', stopToastGuard)
        process.on('SIGINT', () => { stopToastGuard(); process.exit(0) })
        process.on('SIGTERM', () => { stopToastGuard(); process.exit(0) })
      }

      // Set to the auto-exit shutdown when the shortcut owns this server (a restart request uses it).
      let requestShutdown = null
      // ── Shortcut launches own their lifetime (EBIKI_AUTO_EXIT=1) ──────────
      // The Desktop / Start Menu shortcut starts this server HIDDEN, so nothing
      // on screen says it is still running: closing the tab left it alive for
      // days. That is how a server kept serving a vite.config.js from BEFORE an
      // update (the config file is deliberately watch-ignored, see server.watch
      // below, so Vite never restarts itself when it changes) and kept crashing
      // on a bug that was already fixed on disk. So a shortcut-started server
      // now shuts itself down once no browser tab is talking to it. A manual
      // `npm run dev` sets no flag and lives until you stop it - that is the
      // supported way to run a second copy on purpose.
      //
      // The tab announces itself; absence of the announcement ends the server.
      // Both endpoints always exist (a manual run just ignores them); only the
      // timer below is gated, so the client never needs to know which it is.
      let lastBeat = 0        // last /api/alive from a real browser tab
      let byeAt = 0           // last /api/bye beacon (a tab closing OR reloading)
      server.middlewares.use('/api/alive', (req, res) => {
        // GET is read-only on purpose: "is a tab actually checking in?" is the
        // first question to ask when a server exits (or refuses to) unexpectedly.
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          // updateRunning: the launchers skip their own update check while Settings is updating (two npm installs
          // in one node_modules could break it).
          res.end(JSON.stringify({ autoExit: process.env.EBIKI_AUTO_EXIT === '1', lastBeatAgoMs: lastBeat ? Date.now() - lastBeat : null, updateRunning }))
          return
        }
        lastBeat = Date.now(); res.statusCode = 204; res.end()
      })
      // POST only: sendBeacon posts, and a stray GET (someone opening the URL)
      // must not be able to announce that the app closed.
      server.middlewares.use('/api/bye', (req, res) => { if (req.method === 'POST') byeAt = Date.now(); res.statusCode = 204; res.end() })
      if (process.env.EBIKI_AUTO_EXIT === '1') {
        // A BACKGROUND tab is throttled by the browser to roughly one beat per
        // minute, so the silent-idle window has to be far longer than the 5s
        // beat; the explicit goodbye beacon is what makes a real close fast.
        const IDLE_MS = 150000     // no beat at all -> the tab is gone
        const BYE_MS = 10000       // goodbye beacon -> wait for a reload to re-announce
        // Generous: a first cold start has to transform a very large App.jsx
        // before the tab it opened can run anything, and exiting under a browser
        // that is still loading would look exactly like a broken app.
        const STARTUP_MS = 300000  // the browser never connected at all
        const startedAt = Date.now()
        let exiting = false
        const shutdown = (why) => {
          if (exiting) return
          exiting = true
          console.log(`[Ebiki] ${why}. Shutting the dev server down (started by the shortcut).`)
          // Kill the overlay TREE, never `taskkill /IM electron.exe` - that would
          // take down every other Electron app on the machine.
          try {
            if (overlayProcess && !overlayProcess.killed) {
              if (process.platform === 'win32') spawn('taskkill', ['/F', '/T', '/PID', String(overlayProcess.pid)], { shell: true }).on('error', () => {})
              else overlayProcess.kill()
            }
            // An UNTRACKED overlay (left by a crashed earlier server) is ours too, and held Alt+Q forever
            // with no server behind it. Found by its command line like the toggle's DELETE; detached so the
            // sweep finishes after this process exits.
            if (process.platform === 'win32') {
              const orphanKill = "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'electron.exe' -and $_.CommandLine -like '*main.cjs*' -and $_.CommandLine -like '*--overlay*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
              spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', orphanKill], { windowsHide: true, stdio: 'ignore', detached: true }).on('error', () => {}).unref()
            }
          } catch { /* best effort - we are leaving anyway */ }
          stopToastGuard()
          setTimeout(() => process.exit(0), 1500)   // hard stop: close() can hang on a held socket
          Promise.resolve(server.close()).then(() => process.exit(0)).catch(() => process.exit(0))
        }
        // NEVER leave on suspicion alone. Both signals below can be wrong about a
        // tab that is still open: a goodbye may come from ONE of several tabs,
        // and silence may just be a hidden tab whose timers the browser throttled
        // to about one tick a minute. So a suspicion only starts a PROBE - a ping
        // down Vite's HMR socket, which a throttled tab still answers at once
        // (message handlers are not throttled the way timers are). Nobody answers,
        // nobody is there. The overlay window never registers for this ping, so it
        // can't hold the server open by itself.
        const PROBE_MS = 4000
        let probeAt = 0
        requestShutdown = shutdown
        const lifeTimer = setInterval(() => {
          const now = Date.now()
          // Never mid-update: closing the window during one killed git (a left-behind index.lock broke every
          // later update) or orphaned npm. The update's own watchdog bounds this; the check resumes after.
          if (updateRunning) { probeAt = 0; return }
          if (!lastBeat) { if (now - startedAt > STARTUP_MS) shutdown('the browser never connected'); return }
          // A goodbye only counts when no tab has checked in since: a RELOAD fires
          // the same beacon and then immediately beats again from the new page.
          const closed = byeAt > lastBeat && now - byeAt > BYE_MS
          const silent = now - lastBeat > IDLE_MS
          if (!closed && !silent) { probeAt = 0; return }
          if (!probeAt) {
            probeAt = now
            try { (server.hot || server.ws).send({ type: 'custom', event: 'ebiki:ping' }) } catch { /* no client connected */ }
            return
          }
          if (now - probeAt < PROBE_MS) return          // give them a moment to answer
          if (lastBeat > probeAt) { probeAt = 0; return }  // someone answered: still in use
          shutdown(closed ? 'the last tab was closed' : 'no browser tab left')
        }, 2000)
        if (lifeTimer.unref) lifeTimer.unref()
        server.httpServer?.once('close', () => clearInterval(lifeTimer))
      }

      // Auto-backup status / manual trigger
      server.middlewares.use('/api/sync-backup', async (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        if (req.method === 'POST') { const r = await runBackup(); res.end(JSON.stringify({ ...r, ...lastBackup, dir: BACKUP_DIR, enabled: DATA_DIR !== APP_ROOT })) }
        else { res.end(JSON.stringify({ enabled: DATA_DIR !== APP_ROOT, dir: BACKUP_DIR, ...lastBackup })) }
      })

      // Offline mode status + reconcile. GET reports whether we're running from
      // the local copy, or whether offline edits are waiting for a share that is
      // back up. POST reconciles them into the share (or discards them) — the
      // share is still only ever written by an explicit user action, exactly like
      // the join/return merge.
      server.middlewares.use('/api/offline', async (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        if (req.method === 'GET') {
          try {
          await dataMode()
          let st = offlineStatus()
          // Share back and the offline copy holds NO edits (a slow probe entered offline mode, nothing was
          // changed): nothing to merge, so it goes. Left in place it paused backups for good (runBackup skips
          // while it exists) and the UI had no Merge/Discard to offer for 0 changes. offlineChangedFiles counts
          // an unreadable file as changed, so an error never makes this drop real edits.
          if (st.pending && st.changes === 0 && !offlineReconciling) { // never under a running merge
            try { fs.rmSync(OFFLINE_DIR, { recursive: true, force: true }); offlineSince = null; runBackup().catch(() => {}) } catch { /* next poll */ } // backups resume now, not in 10 min
            st = offlineStatus()
          }
          res.end(JSON.stringify(st))
          } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) } // always an answer
          return
        }
        if (req.method !== 'POST') { res.statusCode = 405; res.end(''); return }
        let body = ''
        req.on('data', (c) => { body += c })
        req.on('end', async () => {
          // One reconcile at a time: a double click (or the bar in two windows) merged the same offline copy
          // into the share twice at once, and a Discard could delete it mid-merge.
          if (offlineReconciling) { res.statusCode = 409; res.end(JSON.stringify({ code: 'busy', error: 'The offline changes are already being merged. Wait for it to finish.' })); return }
          offlineReconciling = true
          try {
            const discard = !!JSON.parse(body || '{}').discard
            // A foreign copy (another share's pending edits) is neither merged nor discarded from here.
            if (!fs.existsSync(OFFLINE_META) || offlineCopyIsForeign()) { res.end(JSON.stringify({ ok: true, nothing: true })); return }
            if (discard) {
              fs.rmSync(OFFLINE_DIR, { recursive: true, force: true })
              offlineActive = false; offlineSince = null
              runBackup().catch(() => {}) // Settings said "backup paused" until the next timer run
              res.end(JSON.stringify({ ok: true, discarded: true }))
              return
            }
            if (!(await shareReachable())) { res.statusCode = 409; res.end(JSON.stringify({ code: 'unreachable', error: 'The shared folder is still unreachable.' })); return }
            // Merging edits made to one share into ANOTHER folder (the user switched data folders with
            // offline edits pending) would write that share's files into the wrong place.
            const owner = offlineCopyDataDir()
            if (owner && !sameFolder(owner, DATA_DIR)) { res.statusCode = 409; res.end(JSON.stringify({ code: 'otherFolder', error: `These offline changes were made to ${owner}, not the current data folder. Switch back to that folder to merge them, or discard them.` })); return }
            res.end(JSON.stringify(await reconcileOffline()))
          } catch (e) { res.statusCode = 400; res.end(JSON.stringify({ error: e.message })) }
          finally { offlineReconciling = false }
        })
      })

      // ── App update (git) ────────────────────────────────────────────────
      // GET  → is a newer version on the remote? (fast: local HEAD vs the remote
      //        branch head via `git ls-remote`, no object download). reachable:
      //        false when git is missing or the network is down.
      // POST → git pull --ff-only, then npm install; report restartRequired.
      // All git runs in APP_ROOT (wherever the app was installed), never a fixed
      // path. `available:false` also covers "git not installed" so the UI degrades.
      // git must never be able to BLOCK this request, and there are two ways it can.
      // A credential prompt: Git Credential Manager opens a GUI and waits forever,
      // and nothing here would ever see it - on a machine where that fires the
      // request simply never comes back. And a network that neither answers nor
      // refuses, which the per-call timeout covers. Both are shut off explicitly
      // rather than hoped about, because the symptom (a request that hangs) is
      // indistinguishable from the app being broken.
      const GIT_ENV = { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never', GIT_ASKPASS: 'echo', SSH_ASKPASS: 'echo' }
      const git = (args, cb, timeout = 15000) => execFile('git', args, { cwd: APP_ROOT, timeout, windowsHide: true, env: GIT_ENV }, cb)
      // Can this machine restart ITSELF after an update? An update only really lands on a
      // restart (the dev server can't reload vite.config.js or new deps live), and "close and
      // reopen it yourself" is exactly the step a non-technical user skips, so the app offers
      // to do it. Only possible when the shortcut owns the server's lifetime (EBIKI_AUTO_EXIT,
      // so it exits with the last page and frees port 3000) and the launcher is there to start
      // the new one. Anything else falls back to the manual wording.
      let updateRunning = false   // one `git pull` + `npm install` at a time (see the POST below)
      const RELAUNCH_VBS = path.join(APP_ROOT, 'launch-ebiki.vbs')
      const RELAUNCH_PS1 = path.join(APP_ROOT, 'scripts', 'relaunch.ps1')
      const canSelfRestart = () => process.platform === 'win32' && process.env.EBIKI_AUTO_EXIT === '1' &&
        fs.existsSync(RELAUNCH_VBS) && fs.existsSync(RELAUNCH_PS1)
      server.middlewares.use('/api/update', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        const sub = (req.url || '').split('?')[0].replace(/\/+$/, '') || '/'
        // POST /api/update/restart — hand the relaunch to a DETACHED helper and answer at once.
        // It can't be done in-process: this server is what has to die first, so the thing that
        // starts the next one must outlive it. relaunch.ps1 waits for port 3000 to go quiet
        // (the client closes its window as soon as this responds) and then runs the ordinary
        // launcher, so the restart is the same code path as a normal shortcut click.
        if (sub === '/restart') {
          if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ error: 'method' })); return }
          if (!canSelfRestart()) { res.end(JSON.stringify({ ok: false, error: 'restart not available here' })); return }
          try {
            spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', RELAUNCH_PS1],
              { cwd: APP_ROOT, detached: true, stdio: 'ignore', windowsHide: true }).on('error', (e) => console.warn('[Update] relaunch helper failed:', e.message)).unref()
            console.log('[Update] relaunch helper spawned')
            res.end(JSON.stringify({ ok: true }))
            // Leave by ourselves: another window or tab still beating kept this (old) server alive, so the
            // helper gave up and the launcher reopened the OLD code (and skipped the pending npm install).
            if (requestShutdown) setTimeout(() => requestShutdown('a restart was requested'), 1500)
          } catch (e) {
            res.end(JSON.stringify({ ok: false, error: String(e.message || e).slice(0, 300) }))
          }
          return
        }
        // 'master' is the release branch we publish to; compare against it
        // regardless of which local branch this clone happens to sit on.
        if (req.method === 'GET') {
          // ANSWER, whatever happens. A request that never completes is worse than
          // one that fails: the browser eventually rejects the fetch with a bare
          // "Failed to fetch", which says nothing a user can act on and leaves the
          // card dead. Every exit below goes through send(), and the watchdog wins
          // if some future git call finds a way to hang anyway.
          let answered = false
          // Whatever has been learned so far. The watchdog used to answer with just
          // `{gitAvailable, reachable:false}` - no sha, no version - so a caller that
          // needed to know WHICH commit this is (the post-update verification, and
          // the version line) got a reply carrying nothing it could use, and kept
          // asking. Local facts are known long before the network is; send them.
          let known = {}
          const send = (payload) => {
            if (answered) return
            answered = true
            clearTimeout(watchdog)
            res.end(JSON.stringify(payload))
          }
          const watchdog = setTimeout(() => send({ ok: true, gitAvailable: true, reachable: false, ...known }), 25000)
          // ?local=1 skips the network entirely. Verifying an update only needs to
          // know which commit is checked out NOW, and asking GitHub for that costs a
          // round trip that can take 25s on a bad connection - which is what turned
          // "Checking whether the update landed..." into a freeze.
          const localOnly = /[?&]local=1/.test(req.originalUrl || req.url || '')
          // What a PERSON can read. A bare commit sha ("you are on version 0a84d36")
          // is an identifier, not a version: it does not say how old the copy is,
          // and two of them cannot be compared by eye. This project ships from
          // master with no tags, so the release date IS the version, and the commit
          // count is a build number that only ever goes up. The sha stays alongside
          // for the times an exact answer is wanted.
          // Counted only when the history is real: an older installer linked ZIP
          // folders with --depth 1, and a shallow repo would report "build 1".
          // %cd with --date=format: renders the commit's OWN stored timezone, so it is
          // the same string on every machine. The version used to be assembled on the
          // client with new Date().getFullYear()/getMonth()/getDate(), which are
          // LOCAL-time methods: the identical commit then showed as 2026.08.28 here
          // and 2026.08.29 to anyone far enough east, so two people on the same build
          // could not agree on what they were running. Measured both ways.
          // (--date=format-local: is the one that converts to the viewer; never use it
          // here.) %cI is still sent for anything that wants the precise instant.
          // Ebiki's OWN checkout only: a ZIP copy with no .git inside another repository (a home-folder
          // dotfiles repo) reported and "updated" THAT repository. Same guard in both launchers.
          if (!fs.existsSync(path.join(APP_ROOT, '.git'))) { send({ ok: true, gitAvailable: false }); return }
          git(['log', '-1', '--date=format:%Y.%m.%d', '--format=%H|%cI|%cd'], (e1, local) => {
            if (e1) { send({ ok: true, gitAvailable: false }); return }
            const [headSha, headDate, headVersion] = String(local || '').trim().split('|')
            const shallow = fs.existsSync(path.join(APP_ROOT, '.git', 'shallow'))
            git(['rev-list', '--count', 'HEAD'], (e2, countOut) => {
              const build = (!shallow && !e2) ? parseInt(String(countOut || '').trim(), 10) || null : null
              // Which branch this clone sits on. Updates ALWAYS track master, so a
              // copy parked on anything else compares its HEAD against origin/master
              // forever: permanently "an update is available", and permanently unable
              // to apply it, because a fast-forward from another branch is not a
              // thing. Naming the branch is what lets the UI say so instead of
              // offering an update that cannot work.
              git(['rev-parse', '--abbrev-ref', 'HEAD'], (e4, branchOut) => {
                const branch = e4 ? '' : String(branchOut || '').trim()
                // TWO different things, and both are wanted. `appVersion` is the DECLARED
                // version from package.json - a number a person can say out loud and ask
                // someone else about. The rest is the DERIVED build identity, which is
                // correct by construction on every machine and needs nobody to remember
                // anything. Keeping both means a forgotten bump is never invisible: two
                // builds that wrongly claim the same 1.1.0 still differ by date, build
                // number and sha. Read per request, so a pull is reflected without a
                // restart of this file's own logic.
                let appVersion = ''
                try { appVersion = JSON.parse(readUtf8(path.join(APP_ROOT, 'package.json'))).version || '' } catch { /* no package.json = no declared version */ }
                const base = { current: (headSha || '').slice(0, 7), currentDate: headDate || '', version: headVersion || '', appVersion, build, branch, onMaster: branch === 'master' }
                known = base
                if (localOnly) { send({ ok: true, gitAvailable: true, reachable: null, ...base }); return }
                git(['ls-remote', 'origin', 'refs/heads/master'], (e3, remoteOut) => { // exact ref: "master" also matches "*/master"
                  if (e3) { send({ ok: true, gitAvailable: true, reachable: false, ...base }); return }
                  const localSha = (headSha || '').trim()
                  const remoteSha = ((remoteOut || '').trim().split(/\s+/)[0]) || ''
                  // Reachable, but master is not there: the branch was renamed or removed.
                  // Reporting "no update" would be a lie that hides it forever.
                  if (!remoteSha) { send({ ok: true, gitAvailable: true, reachable: true, remoteMissing: true, updateAvailable: false, ...base }); return }
                  const answer = (available, more = {}) => send({ ok: true, gitAvailable: true, reachable: true, updateAvailable: available, ...base, remote: remoteSha.slice(0, 7), canRestart: canSelfRestart(), ...more })
                  if (remoteSha === localSha) { answer(false); return }
                  // This copy has its own (never published) commits on master: the update is always refused
                  // (localCommits), yet Settings offered it forever. Not only when AHEAD: once master moves on, the
                  // copy has DIVERGED. The current origin/master counts as published. A retracted release is offered.
                  git(['rev-parse', '-q', '--verify', 'refs/remotes/origin/master'], (eO, oOut) => {
                    headPublished(git, eO ? '' : String(oOut || '').trim(), (pub) => answer(pub, pub ? {} : { localCommits: true }))
                  })
                }, 12000)
              })
            })
          })
        } else if (req.method === 'POST') {
          // ONE update at a time. There are two buttons that reach here now (the
          // banner and the Settings card) plus a page that may be open twice, and
          // two `git pull` + `npm install` runs on top of each other is a broken
          // checkout, not a slow one.
          if (updateRunning) { res.end(JSON.stringify({ ok: false, busy: true })); return }
          let done = false
          const finish = (payload) => {
            if (done) return
            done = true
            updateRunning = false
            clearTimeout(guard2)
            res.end(JSON.stringify(payload))
          }
          // npm install can legitimately take minutes, so this is generous - it exists
          // only so a wedged child can never leave the request (and the lock) hanging.
          // Above the sum of the step timeouts (fetch 120s + merge/reset 120s + npm 300s + small ones): at 400s it
          // reported a failure for an update still finishing, and released the lock under a running npm.
          const guard2 = setTimeout(() => finish({ ok: false, error: 'the update took too long and was stopped' }), 660000)
          updateRunning = true
          // Updates track master. Pulling master into some other branch is not a
          // fast-forward, so git would refuse with something the user cannot act on;
          // say which branch it is instead, and change nothing.
          if (!fs.existsSync(path.join(APP_ROOT, '.git'))) { finish({ ok: false, error: 'this folder is not a git checkout of Ebiki' }); return } // see the GET
          git(['rev-parse', '--abbrev-ref', 'HEAD'], (eb, branchOut) => {
            const branch = eb ? '' : String(branchOut || '').trim()
            if (branch && branch !== 'master') { finish({ ok: false, wrongBranch: branch }); return }
            // MATCH master, do not merely move toward it. `git pull --ff-only` is only
            // correct while master goes forwards, and a maintainer who retracts a bad
            // release moves it BACKWARDS. Measured: with the local commit ahead of the
            // rewound master, that pull exits 0 saying "Already up to date" and changes
            // nothing - so the app reported an update forever, claimed every attempt
            // succeeded, and never moved a single file. A silent permanent loop, which
            // is far worse than a visible failure.
            // So: fetch, then work out which way master actually went.
            // Where master WAS before this fetch (see the reset below).
            git(['rev-parse', '-q', '--verify', 'refs/remotes/origin/master'], (eOld, oldOut) => {
            const oldOrigin = eOld ? '' : String(oldOut || '').trim()
            git(['fetch', 'origin', 'master'], (ef, fo, fe) => {
              if (ef) { finish({ ok: false, error: String(fe || ef.message || 'could not reach GitHub').slice(0, 600) }); return }
              const afterMove = (out) => {
                // Same audit trail as the launcher (see Write-UpdateLog): every update
                // that actually moves this checkout says so, in one line, on this
                // computer. An in-app update only ever starts from a button press.
                try {
                  const dir = path.join(APP_ROOT, 'logs')
                  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
                  fs.appendFileSync(path.join(dir, 'update.log'), `${new Date().toISOString()}  app: update requested from the UI\n`)
                } catch { /* logging must never break an update */ }
                // Dependencies may have changed - run npm install (fast if nothing did).
                // Through cmd on Windows: current Node refuses to spawn a .cmd without a shell (throws
                // EINVAL synchronously, the CVE-2024-27980 fix). That throw, inside this git callback,
                // killed the server right after the code moved, so the dependencies were never installed.
                const npmCmd = process.platform === 'win32' ? 'cmd' : 'npm'
                const npmArgs = process.platform === 'win32' ? ['/d', '/s', '/c', 'npm install --no-audit --no-fund'] : ['install', '--no-audit', '--no-fund']
                const onNpm = (npmErr, _npmOut, npmStderr) => {
                  // The launch-time popup must not re-offer an update the app just installed.
                  try { fs.rmSync(path.join(APP_ROOT, '.update-snooze'), { force: true }) } catch { /* nothing to clear */ }
                  // The code moved but its dependencies did not install (network drop, a locked
                  // node_modules). Reporting success here offered a restart into a build that
                  // cannot start; say what failed so the user can run the installer again.
                  if (npmErr) {
                    // The launcher installs it on the next start (see .npm-install-pending in launch.ps1).
                    try { fs.writeFileSync(path.join(APP_ROOT, '.npm-install-pending'), new Date().toISOString()) } catch { /* best effort */ }
                    try { fs.appendFileSync(path.join(APP_ROOT, 'logs', 'update.log'), `${new Date().toISOString()}  app: code updated but npm install failed: ${String(npmErr.message || npmErr).slice(0, 200)}\n`) } catch { /* logging must never break an update */ }
                    finish({ ok: false, updated: true, error: `The update downloaded, but installing its dependencies failed. Run "Install Ebiki.bat" once to finish it. (${String(npmStderr || npmErr.message || '').trim().slice(0, 400)})` })
                    return
                  }
                  try { fs.rmSync(npmPending, { force: true }) } catch { /* nothing to clear */ }
                  finish({ ok: true, updated: true, restartRequired: true, canRestart: canSelfRestart(), output: String(out || '').slice(0, 600) })
                }
                // Marked BEFORE it runs, cleared on success: a server that stopped mid-install (the install
                // itself taking it down, the window closed, a reboot) left no marker, HEAD already matched
                // master, and the new code ran on old dependencies for good.
                const npmPending = path.join(APP_ROOT, '.npm-install-pending')
                try { fs.writeFileSync(npmPending, new Date().toISOString()) } catch { /* best effort */ }
                // Our own timeout that kills the whole TREE: execFile's kills only cmd.exe, npm's node.exe kept
                // installing, and the next start's pending install then ran beside it (a broken node_modules).
                let npmChild = null
                const npmTimer = setTimeout(() => {
                  try {
                    if (process.platform === 'win32' && npmChild?.pid) spawn('taskkill', ['/F', '/T', '/PID', String(npmChild.pid)], { windowsHide: true, stdio: 'ignore' }).on('error', () => {})
                    else npmChild?.kill()
                  } catch { /* it is being reported as failed either way */ }
                }, 300000)
                try { npmChild = execFile(npmCmd, npmArgs, { cwd: APP_ROOT, windowsHide: true, maxBuffer: 16 * 1024 * 1024 }, (...a) => { clearTimeout(npmTimer); onNpm(...a) }) }
                catch (spawnErr) { clearTimeout(npmTimer); onNpm(spawnErr, '', '') }
                // The install's PID goes into the marker: when it takes this server down it keeps running (an
                // orphan), and the launcher waits for it before its own pending install (two in one node_modules).
                try { if (npmChild?.pid) fs.writeFileSync(npmPending, JSON.stringify({ at: new Date().toISOString(), pid: npmChild.pid })) } catch { /* the plain marker stays */ }
              }
              // Is our commit an ancestor of the fetched one? Yes = master moved forward
              // and a fast-forward is exactly right. No = it was rewound or rewritten.
              git(['merge-base', '--is-ancestor', 'HEAD', 'FETCH_HEAD'], (eAnc) => {
                if (!eAnc) {
                  git(['merge', '--ff-only', 'FETCH_HEAD'], (e, out, err) => {
                    if (e) { finish({ ok: false, error: String(err || e.message || 'git merge failed').slice(0, 600) }); return }
                    afterMove(out)
                  }, 120000)
                  return
                }
                // Rewound or diverged. The only way back to what master IS now is to
                // match it exactly - but never at the cost of somebody's own edits, so
                // this is refused outright if any TRACKED file has been modified. User
                // data (config.json, modes/, decks/, .env) is gitignored, i.e. untracked,
                // so a normal install is always clean here and a developer's work is safe.
                git(['status', '--porcelain', '--untracked-files=no'], (eSt, stOut) => {
                  if (!eSt && String(stOut || '').trim()) { finish({ ok: false, dirty: true }); return }
                  // Only a checkout on PUBLISHED history is reset (a retracted release). Commits made on master
                  // here were never published: "not an ancestor" looked the same, and the reset threw them away.
                  const doReset = () => git(['reset', '--hard', 'FETCH_HEAD'], (eR, rOut, rErr) => {
                    if (eR) { finish({ ok: false, error: String(rErr || eR.message || 'could not match the released version').slice(0, 600) }); return }
                    console.log('[Update] master had moved backwards or been rewritten; matched it exactly')
                    afterMove(rOut)
                  }, 120000)
                  headPublished(git, oldOrigin, (pub) => { if (pub) doReset(); else finish({ ok: false, localCommits: true }) })
                })
              })
            }, 120000)
            })
          })
        } else { res.statusCode = 405; res.end('') }
      })


      // ── AnkiConnect: is the add-on there, and put it there if not ────────
      // Ebiki reads and writes every card through AnkiConnect, so a machine with
      // Anki but no add-on shows nothing but "Anki is not connected" and reads as
      // Ebiki being broken. The installer sets it up, but an installer only runs
      // once and can miss (a ZIP download running an older setup script, a
      // download blocked by a proxy or antivirus, someone who installed Anki
      // afterwards), and nobody re-runs an installer that said it was finished.
      // So the APP can check and repair it, which is the only path that does not
      // depend on the install having gone right.
      // NOT in DATA_ROUTES on purpose, same as /api/datadir and /api/launchmode:
      // this is machine-local and has to work when the shared folder is down.
      const ankiBaseDir = () => process.env.ANKI_BASE || (
        process.platform === 'win32' ? path.join(process.env.APPDATA || '', 'Anki2')
          : process.platform === 'darwin' ? path.join(os.homedir(), 'Library', 'Application Support', 'Anki2')
            : path.join(process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share'), 'Anki2')) // Anki honors XDG (Flatpak)
      // By SIGNATURE (a config.json carrying webBindPort), never by add-on code:
      // forks like "Anki Connect Plus" serve the same API and Anki marks them as
      // CONFLICTING with the original, so a machine running one must be reported
      // as already having it rather than offered a second, conflicting copy.
      const findAnkiConnect = () => {
        try {
          const dir = path.join(ankiBaseDir(), 'addons21')
          for (const name of fs.readdirSync(dir)) {
            const d = path.join(dir, name)
            const cfg = path.join(d, 'config.json')
            if (!fs.existsSync(path.join(d, '__init__.py')) || !fs.existsSync(cfg)) continue
            if (!/webBindPort/.test(fs.readFileSync(cfg, 'utf-8'))) continue
            let meta = {}
            try { meta = JSON.parse(readUtf8(path.join(d, 'meta.json'))) } catch { /* Anki writes it on first load */ }
            return { dir: d, name: meta.name || name, disabled: !!meta.disabled }
          }
        } catch { /* no Anki folder yet = not installed */ }
        return null
      }
      server.middlewares.use('/api/ankiconnect', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        const script = path.join(APP_ROOT, 'scripts', 'install-ankiconnect.ps1')
        if (req.method === 'GET') {
          const found = findAnkiConnect()
          // Has Anki ever finished SETUP? Read from Anki's own source rather than
          // guessed: prefs21.db is the WRONG file to test - `_loadMeta` does
          // `firstTime = not os.path.exists(prefs21.db)` and then creates it
          // immediately, so it exists from the first moments of start-up, long
          // before the language dialog is answered. Testing it reported "configured"
          // for an Anki that was still asking its first question, which is how the
          // app ended up telling someone to restart Anki while Anki sat waiting on a
          // dialog. A profile's collection.anki2 is only written once a profile is
          // actually opened, i.e. once setup is genuinely done.
          const configured = (() => {
            try {
              return fs.readdirSync(ankiBaseDir(), { withFileTypes: true })
                .some((d) => d.isDirectory() && fs.existsSync(path.join(ankiBaseDir(), d.name, 'collection.anki2')))
            } catch { return false }
          })()
          const payload = {
            ok: true,
            installed: !!found,
            addon: found,
            configured,
            base: ankiBaseDir(),
            // Whether we can do anything about it from here. The installer script
            // is PowerShell, so on any other platform the UI must give
            // instructions instead of a button that cannot work.
            canInstall: process.platform === 'win32' && fs.existsSync(script),
          }
          // WHAT IS ANKI DOING? Its own windows say so (scripts/anki-state.ps1):
          // whether it is running, whether its MAIN window exists, and whether it is
          // stopped on a dialog waiting to be answered. That last one is the state no
          // amount of restarting or reinstalling can clear, and the one Ebiki could
          // never see before - so it told people to do things that could not work.
          const stateScript = path.join(APP_ROOT, 'scripts', 'anki-state.ps1')
          if (process.platform !== 'win32' || !fs.existsSync(stateScript)) { res.end(JSON.stringify(payload)); return }
          execFile('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', stateScript],
            { timeout: 12000, windowsHide: true }, (e, out) => {
              try {
                const st = JSON.parse(String(out || '').trim().split(/\r?\n/).filter(Boolean).pop())
                payload.ankiRunning = !!st.running
                payload.ankiMainWindow = !!st.mainWindow
                payload.ankiAwaitingInput = !!st.awaitingInput
                payload.ankiDialogs = Array.isArray(st.dialogs) ? st.dialogs.slice(0, 3) : []
                // Anki's own launcher left in its console (a failed update waiting on "Press enter to
                // close"). An `anki` process exists, so this used to read as "running but hasn't loaded
                // the add-on" and told the user to restart Anki, which cannot help.
                payload.ankiLauncherStuck = !!st.launcherStuck
                payload.ankiListening = !!st.listening // port open but silent = Anki is on a modal dialog
              } catch { /* could not look: leave the fields undefined rather than guess */ }
              res.end(JSON.stringify(payload))
            })
          return
        }
        if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ error: 'method' })); return }
        if (process.platform !== 'win32' || !fs.existsSync(script)) {
          res.end(JSON.stringify({ ok: false, error: 'automatic install is only available on Windows' }))
          return
        }
        // One install at a time: a double click (or the banner in two windows) ran two installers into the
        // same add-on folder, each seeing it missing. A second request gets the running install's answer.
        if (ankiConnectInstallWaiters) { ankiConnectInstallWaiters.push(res); return }
        ankiConnectInstallWaiters = [res]
        const answerAll = (payload) => { const all = ankiConnectInstallWaiters || []; ankiConnectInstallWaiters = null; for (const r of all) { try { r.end(payload) } catch { /* client gone */ } } }
        // The SAME script the installer uses (scripts/install-ankiconnect.ps1), so
        // the two can never drift. It prints one JSON line; anything else it wrote
        // is console noise.
        execFile('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, '-Install'],
          { cwd: APP_ROOT, timeout: 120000, windowsHide: true }, (err, stdout, stderr) => {
            const line = String(stdout || '').trim().split(/\r?\n/).filter(Boolean).pop()
            let parsed = null
            try { parsed = JSON.parse(line) } catch { /* fall through to the error below */ }
            if (!parsed) {
              console.warn('[AnkiConnect] install produced no result:', String(stderr || err || '').slice(0, 300))
              answerAll(JSON.stringify({ ok: false, error: String(stderr || (err && err.message) || 'the install did not report a result').slice(0, 400) }))
              return
            }
            console.log('[AnkiConnect] install:', line)
            answerAll(JSON.stringify(parsed))
          })
      })


      // Bring Anki's window forward. Ebiki never handles an AnkiWeb password (see
      // scripts/focus-anki.ps1), so signing in happens in Anki's own dialog - this
      // just removes the part people actually get stuck on, which is finding the
      // Anki window. Machine-local, so not in DATA_ROUTES.
      server.middlewares.use('/api/anki-focus', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ error: 'method' })); return }
        const script = path.join(APP_ROOT, 'scripts', 'focus-anki.ps1')
        if (process.platform !== 'win32' || !fs.existsSync(script)) {
          res.end(JSON.stringify({ ok: false, reason: 'unsupported' }))
          return
        }
        execFile('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script],
          { cwd: APP_ROOT, timeout: 15000, windowsHide: true }, (err, stdout) => {
            const line = String(stdout || '').trim().split(/\r?\n/).filter(Boolean).pop()
            try { res.end(JSON.stringify(JSON.parse(line))) }
            catch { res.end(JSON.stringify({ ok: false, reason: 'no-window' })) }
          })
      })

      // Start Anki when it is not open at all (the "Open Anki" button when there is no window to bring
      // forward). Runs scripts/anki-start.ps1 -Start: the SAME start-up the shortcut uses, so it also
      // closes a launcher console stuck on a failed update, offers/applies an Anki update (a topmost
      // dialog stands in for the splash) and repairs a launcher left mid-install. DETACHED and
      // answered at once: an update question can wait for minutes, and the client already notices
      // AnkiConnect coming up through its Anki boot watcher. One run at a time. Machine-local, so
      // not in DATA_ROUTES.
      let ankiStarting = 0
      server.middlewares.use('/api/anki-start', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ error: 'method' })); return }
        const script = path.join(APP_ROOT, 'scripts', 'anki-start.ps1')
        if (process.platform !== 'win32' || !fs.existsSync(script)) { res.end(JSON.stringify({ ok: false, reason: 'unsupported' })); return }
        if (Date.now() - ankiStarting < 60000) { res.end(JSON.stringify({ ok: true, alreadyStarting: true })); return }
        ankiStarting = Date.now()
        try {
          const child = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', script, '-Start'],
            { cwd: APP_ROOT, detached: true, stdio: 'ignore', windowsHide: true })
          child.on('exit', () => { ankiStarting = 0 })
          child.on('error', (e) => { ankiStarting = 0; console.warn('[Anki] start failed:', e.message) }) // unhandled, it crashed the server
          child.unref()
          res.end(JSON.stringify({ ok: true, started: true }))
        } catch (e) {
          ankiStarting = 0
          res.end(JSON.stringify({ ok: false, error: String(e.message || e).slice(0, 300) }))
        }
      })

      // API keys endpoint
      server.middlewares.use('/api/keys', (req, res) => {
        if (req.method === 'GET') {
          // Fire-and-forget on purpose: the read below must never wait on it. It is
          // async and bounded now (see shareReachable), so a dead share delays this
          // background call by at most its own probe timeout, never the response.
          syncSharedKeys().catch(() => {})   // a page load is the moment a blank machine should adopt the shared key
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(parseEnv()))
        } else if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => { body += chunk })
          req.on('end', () => {
            try {
              // ?source=user marks a key the person actually typed (see setCurrentKey);
              // that one is allowed to replace the shared copy, a background save is not.
              const typed = /[?&]source=user/.test(req.originalUrl || req.url || '')
              const r = writeEnv(JSON.parse(body), { source: typed ? 'user-typed' : 'app-autosave' })
              const provMatch = /[?&]providers=([^&]*)/.exec(req.originalUrl || req.url || '')
              const providers = provMatch ? decodeURIComponent(provMatch[1]).split(',').map((p) => p.trim()).filter(Boolean) : []
              syncSharedKeys({ authoritative: typed, providers }).catch(() => {})
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true, ...r }))
            } catch (e) {
              // A bad body is the client's fault; a failed .env write is not, and
              // calling it "invalid json" hid the real reason a key did not save.
              const bad = e instanceof SyntaxError
              res.statusCode = bad ? 400 : 500
              res.end(JSON.stringify({ error: bad ? 'invalid json' : `could not save the key: ${e.message}` }))
            }
          })
        } else {
          res.statusCode = 405
          res.end('')
        }
      })

      // Log endpoint — writes OCR pipeline logs to logs/ directory
      server.middlewares.use('/api/log', (req, res) => {
        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => { body += chunk })
          req.on('end', () => {
            try {
              if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true })
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
              const logFile = path.join(LOG_DIR, `ocr-${timestamp}.log`)
              fs.writeFileSync(logFile, body, 'utf-8')
              // Newest 50 only: one file per scan, each holding the text read off the screen, piled up forever.
              try {
                const old = fs.readdirSync(LOG_DIR).filter((f) => /^ocr-.*\.log$/.test(f)).sort().slice(0, -50)
                for (const f of old) fs.rmSync(path.join(LOG_DIR, f), { force: true })
              } catch { /* pruning is housekeeping only */ }
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true, file: logFile }))
            } catch (e) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: e.message }))
            }
          })
        } else {
          res.statusCode = 405
          res.end('')
        }
      })

      // Token usage totals for THIS computer (machine-local like the logs, never on a shared data folder: each
      // computer's key pays its own bill). GET = the totals; POST {add:[{provider, model, input, output}]} adds
      // (the app window, a browser tab and the overlay all report here); POST {reset:true} starts over.
      server.middlewares.use('/api/usage', (req, res) => {
        const file = path.join(LOG_DIR, 'token-usage.json')
        const read = () => {
          try { const j = JSON.parse(readUtf8(file)); if (j && typeof j === 'object' && j.byModel && typeof j.byModel === 'object') return j } catch { /* none yet or damaged: start over */ }
          return { since: new Date().toISOString(), byModel: {} }
        }
        const send = (code, obj) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)) }
        if (req.method === 'GET') { send(200, read()); return }
        if (req.method !== 'POST') { send(405, { error: 'method' }); return }
        const handle = (bodyStr) => {
          try {
            const body = JSON.parse(bodyStr || '{}')
            if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true })
            // Prices the user typed for models the app has no price for ({provider, model, price: [in, out] | null}).
            // Kept in the same file, and kept across a reset (a reset clears the counts, not the prices).
            if (body.setPrice && typeof body.setPrice === 'object') {
              const { provider, model, price } = body.setPrice
              if (typeof provider !== 'string' || !/^[a-z]{2,20}$/.test(provider)) { send(400, { error: 'provider' }); return }
              const key = `${provider}|${String(model || '').slice(0, 120)}`
              const cur = read()
              const prices = { ...(cur.prices && typeof cur.prices === 'object' ? cur.prices : {}) }
              if (price === null) delete prices[key]
              else if (Array.isArray(price) && price.length === 2 && price.every((v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 10000)) prices[key] = price
              else { send(400, { error: 'price' }); return }
              const next = { ...cur, prices }
              writeFileAtomic(file, JSON.stringify(next, null, 2))
              send(200, next); return
            }
            if (body.reset === true) {
              const old = read()
              const fresh = { since: new Date().toISOString(), byModel: {}, ...(old.prices ? { prices: old.prices } : {}) }
              writeFileAtomic(file, JSON.stringify(fresh, null, 2))
              send(200, fresh); return
            }
            const cur = read()
            const n = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.round(Number(v)) : 0)
            for (const u of (Array.isArray(body.add) ? body.add : []).slice(0, 5000)) {
              if (!u || typeof u.provider !== 'string' || !/^[a-z]{2,20}$/.test(u.provider)) continue
              const model = String(u.model || '').slice(0, 120)
              const key = `${u.provider}|${model}`
              const r = cur.byModel[key] || { provider: u.provider, model, input: 0, output: 0, calls: 0 }
              cur.byModel[key] = { ...r, input: r.input + n(u.input), output: r.output + n(u.output), calls: r.calls + 1 }
            }
            writeFileAtomic(file, JSON.stringify(cur, null, 2))
            send(200, cur)
          } catch (e) { send(500, { error: e.message }) }
        }
        if (req.body) { handle(typeof req.body === 'string' ? req.body : JSON.stringify(req.body)); return }
        let body = ''
        req.on('data', (chunk) => { body += chunk })
        req.on('end', () => handle(body))
      })

      // AnkiConnect proxy endpoint
      server.middlewares.use('/api/anki', (req, res) => {
        if (req.method === 'POST') {
          // Vite may have already parsed the body — check req.body first
          const forwardBody = (bodyStr) => {
            console.log('[Anki proxy] forwarding:', bodyStr.substring(0, 200))
            const ankiReq = http.request(
              { hostname: '127.0.0.1', port: 8765, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) } },
              (ankiRes) => {
                let data = ''
                // Same split-character hazard as request bodies (see the /api decoder at the top):
                // a notesInfo reply for a whole deck spans many chunks and is full of accents.
                ankiRes.setEncoding('utf8')
                ankiRes.on('data', (chunk) => { data += chunk })
                ankiRes.on('end', () => {
                  console.log('[Anki proxy] response:', data.substring(0, 200))
                  res.setHeader('Content-Type', 'application/json')
                  res.end(data)
                })
                // Anki quitting or crashing MID-REPLY closes the socket with no 'end' and no request
                // 'error' (the timeout was already cleared by the headers), so the caller waited forever.
                ankiRes.on('error', () => { /* answered by 'close' below */ })
                ankiRes.on('close', () => {
                  if (ankiRes.complete || res.headersSent || res.writableEnded) return
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ code: 'closed', error: 'Anki closed the connection before answering. Check that Anki is still open, then try again.' }))
                })
              }
            )
            // AnkiConnect answers on Anki's UI thread, so while Anki sits on a modal dialog (a sync
            // conflict, the profile picker, an update prompt) a request is never answered at all. With
            // no timeout here the caller waited forever: a deck or study screen spun with no message,
            // and every boot-watcher ping left another open socket behind. Only a collection sync can
            // legitimately take minutes (a first full download), so it gets a much longer allowance.
            let action = ''
            try { action = String(JSON.parse(bodyStr).action || '') } catch { /* forwarded as-is */ }
            const limitMs = action === 'sync' ? 15 * 60 * 1000 : 2 * 60 * 1000
            ankiReq.setTimeout(limitMs, () => ankiReq.destroy(new Error(`timed out after ${limitMs / 1000}s (${action || 'request'})`)))
            ankiReq.on('error', (err) => {
              console.log('[Anki proxy] error:', err.message)
              if (res.headersSent || res.writableEnded) return
              res.setHeader('Content-Type', 'application/json')
              // A request Anki could not answer in time is still QUEUED there and runs once Anki is free, so a
              // change (a card add, tags, a review) must not be retried blindly: that made duplicate cards.
              const changes = /^(add|remove|update|insert|replace|delete|set|forget|change|answer|store)/i.test(String(action || ''))
              // `code` lets the page show the message in the app language (the English text is the fallback).
              res.end(JSON.stringify({ timedOut: /timed out/.test(err.message) || undefined, code: /timed out/.test(err.message) ? (changes ? 'timeoutChange' : 'timeout') : 'notRunning', error: /timed out/.test(err.message)
                ? (changes
                  ? 'Anki did not answer in time. If Anki is showing a window or a question, answer it. The change may still be applied once Anki is free, so check Anki before trying again.'
                  : 'Anki did not answer. If Anki is showing a window or a question, answer it, then try again.')
                : 'Anki is not running or AnkiConnect is not installed' }))
            })
            ankiReq.write(bodyStr)
            ankiReq.end()
          }
          // Handle both pre-parsed body and raw stream
          if (req.body) {
            forwardBody(typeof req.body === 'string' ? req.body : JSON.stringify(req.body))
          } else {
            let raw = ''
            req.on('data', (chunk) => { raw += chunk })
            req.on('end', () => forwardBody(raw))
          }
        } else {
          res.statusCode = 405
          res.end('')
        }
      })


      // ── Offline-share guard for every data-backed endpoint ──────────────────
      // A disconnected mapped drive (Y:) reads as EMPTY, and worse, touching it
      // THROWS (`UNKNOWN: unknown error, mkdir 'Y:\modes'`). Those handlers create
      // their directory at the top, outside any try, so an unreachable share used
      // to blow up as an uncaught middleware error — Vite's full-screen dev error
      // overlay on top of the app, which reads as "the update broke everything".
      // Answer 503 {unreachable:true} FIRST instead (same contract /api/config
      // already uses): the client keeps its last good data, shows the offline
      // banner, and never writes an empty default back over the real files.
      // NOT guarded on purpose: /api/datadir (the way back to the app folder),
      // /api/keys, /api/log, /api/anki, /api/update, /api/ankiconnect, /api/anki-focus,
      // /api/web-search, /api/tts.
      const DATA_ROUTES = ['/config', '/ankiformat', '/modes', '/knowledge-sections', '/deck-progress', '/discover-store', '/question-bank', '/chats', '/chat-load', ...featureDataRoutes()]
      server.middlewares.use('/api', async (req, res, next) => {
        const p = (req.url || '').split('?')[0].replace(/\/+$/, '') || '/'
        if (!DATA_ROUTES.some((r) => p === r || p.startsWith(r + '/'))) return next()
        // A folder switch runs synchronously for seconds; writes the page sent meanwhile were handled right after it,
        // in the NEW folder, before the page froze its writers. Refused for a short window after the switch.
        if (req.method !== 'GET' && Date.now() - datadirSwitchedAt < 3000) {
          res.statusCode = 503
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'The data folder just changed. Try again.' }))
          return
        }
        const mode = await dataMode()
        // 'down' = the share is gone AND there is no local snapshot to fall back
        // on, the only case where the app truly cannot serve data.
        if (mode === 'down') {
          res.statusCode = 503
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ unreachable: true, dataDir: DATA_DIR }))
          return
        }
        // Offline is a NORMAL serving state (reads and writes both hit
        // .local-offline). The header rides along on every data response so the
        // client can show the offline banner without a second request.
        if (mode === 'offline') res.setHeader('X-Ebiki-Offline', '1')
        next()
      })
      // Feature routes (src/features/server.js), AFTER the guard so their data routes are fronted by it.
      registerFeatureRoutes(server, { dataPath, readUtf8, writeFileAtomic, appRoot: APP_ROOT, fs, path, crypto })

      // Ebi's pictures, resized automatically (src/server/ebi-images.js): originals in public/assets/shrimp/, small
      // WebP copies in the machine-local .cache/ebi/ (gitignored), served at /assets/ebi/<file>. Copies are made
      // in the background shortly after start, and on demand for anything new.
      server.middlewares.use(ebiImages.middleware)
      // Delayed so it never competes with start-up (the first App.jsx transform); every request resizes on demand anyway.
      if (!process.env.VITEST) { const t = setTimeout(() => { ebiImages.warm().then((n) => { if (n) console.log('[Ebi images] ready:', n, 'resized copies') }).catch((e) => console.log('[Ebi images] warm-up failed:', e?.message || e)) }, 15000); t.unref?.() }

      // Anki format endpoint
      server.middlewares.use('/api/ankiformat', (req, res) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          try {
            const data = fs.existsSync(dataPath('ankiformat.json'))
              ? fs.readFileSync(dataPath('ankiformat.json'), 'utf-8')
              : '{}'
            res.end(data)
          } catch { res.end('{}') }
        } else if (req.method === 'POST') {
          const handleBody = (bodyStr) => {
            try {
              writeFileAtomic(dataPath('ankiformat.json'), bodyStr)
              res.setHeader('Content-Type', 'application/json')
              res.end('{"ok":true}')
            } catch {
              res.statusCode = 400
              res.end('{"error":"invalid json"}')
            }
          }
          if (req.body) {
            handleBody(typeof req.body === 'string' ? req.body : JSON.stringify(req.body))
          } else {
            let body = ''
            req.on('data', (chunk) => { body += chunk })
            req.on('end', () => handleBody(body))
          }
        } else {
          res.statusCode = 405
          res.end('')
        }
      })

      // ── Local TTS proxy + disk cache (pronunciation Tier 2) ─────────────
      // POST /api/tts {input, voice, lang} → forwards to the OpenAI-compatible TTS
      // server configured in config.json (pronunciation.ttsUrl). STRICTLY OPT-IN:
      // no URL configured → 404 and the client tier falls through instantly, so
      // machines without a local TTS server pay zero cost. The browser never talks
      // to the TTS server directly (no CORS issues, URL stays server-side).
      // Synthesized clips are disk-cached (TTS output has no redistribution limits).
      server.middlewares.use('/api/tts', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(''); return }
        let raw = ''
        req.on('data', (c) => { raw += c })
        req.on('end', async () => {
          try {
            const { input, voice, lang } = JSON.parse(raw || '{}')
            const ttsUrl = String(readConfig().pronunciation?.ttsUrl || '').trim().replace(/\/+$/, '')
            if (!ttsUrl || !input || !voice) { res.statusCode = 404; res.end('tts not configured'); return }
            const key = crypto.createHash('sha1').update(`${input}|${lang || ''}|${voice}`).digest('hex')
            const cacheDir = dataPath('cache', 'tts')
            const cacheFile = path.join(cacheDir, key + '.mp3')
            // A cached file under 200 bytes is a failed synthesis saved by an older build: skip it (and
            // replace it below) instead of replaying silence on every request, across restarts.
            if (fs.existsSync(cacheFile) && fs.statSync(cacheFile).size >= 200) {
              res.setHeader('Content-Type', 'audio/mpeg')
              res.end(fs.readFileSync(cacheFile))
              return
            }
            const r = await fetch(`${ttsUrl}/v1/audio/speech`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: 'kokoro', input, voice, response_format: 'mp3' }),
              signal: AbortSignal.timeout(20000), // a hung local TTS server must not hold the 🔊 button forever
            })
            if (!r.ok) { res.statusCode = 502; res.end('tts server error ' + r.status); return }
            const buf = Buffer.from(await r.arrayBuffer())
            // Only real audio is cached: a 200 with an empty body or a JSON error (a local server still
            // loading its model) was cached for good, and the word never got TTS audio again.
            const isAudio = /^audio\//i.test(r.headers.get('content-type') || 'audio/mpeg')
            // Not audio: an error, so the client falls through to browser speech (answered as a 200
            // "audio/mpeg" it was an unplayable success and the 🔊 button just failed).
            if (buf.length < 200 || !isAudio) { res.statusCode = 502; res.end('tts server returned no audio'); return }
            // Atomic: a play of the same word while this was writing read a half-written file (over 200 bytes,
            // so it counted as cached) and a cut-off write stayed cached for good.
            try { fs.mkdirSync(cacheDir, { recursive: true }); writeFileAtomic(cacheFile, buf) } catch { /* cache is best-effort */ }
            res.setHeader('Content-Type', 'audio/mpeg')
            res.end(buf)
          } catch (e) { res.statusCode = 500; res.end(String(e.message || e)) }
        })
      })

      // ── Knowledge outline & section slicing ─────────────────────────────
      // Huge knowledge bases (whole books) can't be prompt-stuffed, so we extract a
      // navigable OUTLINE (headings) and serve individual sections on demand. A file
      // whose NAME looks like a table of contents (toc.txt, "table of contents.md" …)
      // overrides detection: each of its lines is treated as a chapter/section title
      // and located in the other files — so a user can upload a book + its TOC and
      // the AI navigates by TOC even when the book text has no markdown headings.
      const TOC_NAME_RE = /(^|[^a-z])(toc|table[ _-]*of[ _-]*contents)([^a-z]|$)/i
      const readKnowledgeFiles = (knowledgeDir) => {
        if (!fs.existsSync(knowledgeDir)) return []
        return fs.readdirSync(knowledgeDir)
          .filter((f) => f.match(/\.(txt|md)$/i))
          // A file listed but already gone (another computer removed it; SMB lists it ~10s longer) is skipped:
          // thrown, the whole knowledge GET answered 500 and sections came back empty.
          .map((f) => { try { return { name: f, text: fs.readFileSync(path.join(knowledgeDir, f), 'utf-8') } } catch (e) { if (e && e.code === 'ENOENT') return null; throw e } })
          .filter(Boolean)
      }
      // Chapter words in the languages Ebiki is used with, plus CJK "第N章/課/节" forms. English-only
      // matching missed "Capítulo 3" / "第1章", merged their content into a neighbour and pushed a
      // non-English book under the 4-heading threshold (the "no table of contents" warning).
      const CHAPTER_RE = /^(chapter|module|unit|part|section|lesson|domain|appendix|cap[ií]tulo|tema|unidad|lecci[oó]n|parte|chapitre|le[cç]on|partie|kapitel|lektion|teil|capitolo|lezione)\s+(\S+).{0,100}$/iu
      // The chapter NUMBER: digits, an UPPERCASE Roman numeral ("CHAPTER IV", "Part II"; uppercase only,
      // so "Unit mix" is not read as a numeral), or a spelled-out English number ("Chapter One"). These
      // books got no outline at all and were cut to their first 60k characters.
      const SPELLED_NUMS = new Set('one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty'.split(' '))
      const chapterNumOk = (tok) => /^\d+(\.\d+)*[.:)]?$/.test(tok) || /^[IVXLCDM]+[.:)]?$/.test(tok) || SPELLED_NUMS.has(tok.toLowerCase().replace(/[.:)]$/, ''))
      // Levels by the WORD: a Part holds chapters and a Section sits inside one. All level 1 made
      // picking "Part 1" or "Chapter 1" return only the text up to the next line of that list.
      const PART_WORDS = /^(part|parte|partie|teil)$/i
      const SUB_WORDS = /^(section|lesson|lecci[oó]n|le[cç]on|lektion|lezione)$/i
      // PROSE WRAPPED ONTO A NEW LINE is not a heading. PDF text has no paragraph breaks to go by, but a
      // wrapped sentence gives itself away: its text after the number starts with a lowercase word
      // ("Chapter 5 when we cover...", "1980 and was revised..."). Headings are "Chapter 5", "Chapter 5: Routing".
      // Lowercase alone is not enough: "1.1 mRNA and translation", "2.2 malloc and free", "3.4 iOS setup"
      // are headings. Prose shows itself by a FUNCTION word right after the number, or by its length.
      const PROSE_WORDS = new Set(('and or but nor so yet was were is are be been has have had will would can could when while where which who that ' +
        'we you they it he she this these those than then if as by of in on at to for from with into y o u que de del en con por para es son era fue ' +
        'und oder aber ist sind war wird der die das den dem des mit von zu et ou mais est sont le les des du au aux e é são com na no').split(' '))
      const UNIT_WORDS = new Set('hz khz mhz ghz thz kb mb gb tb pb kbps mbps gbps ms ns km cm mm kg mg ml px pt dpi rpm bit bits byte bytes percent'.split(' '))
      const ABBREV_WORDS = new Set('vs etc fig eg ie no st mt cf al approx ch sec vol ed'.split(' '))
      const proseAfterNumber = (rest) => {
        const words = String(rest).trim().split(/\s+/).filter(Boolean)
        if (!words.length) return false
        const bare = (w) => w.toLowerCase().replace(/[^\p{L}]/gu, '')
        // Wrapped PDF prose that starts with a number and a capital: a unit ("5 GHz band, which offers..."),
        // a sentence break inside ("2.4 GHz band used by 802.11b/g. Both are"), or a function word at the END
        // ("443 HTTPS and port 22 SSH, which you will see on"). Headings do none of these.
        if (words.length >= 2) {
          // A unit as written in prose (GHz, MB, kbps), not a Title-case word ("2.1 Bits and Bytes", "1.4 Hz and frequency").
          if (UNIT_WORDS.has(bare(words[0])) && !/^\p{Lu}\p{Ll}+$/u.test(words[0].replace(/[^\p{L}]/gu, ''))) return true
          // A sentence ending mid-line: a lowercase word + "." + a capital. Not an abbreviation ("vs. Stateless",
          // "U.S. Law", "Fig. 3").
          if (words.some((w, i) => i < words.length - 1 && /^\p{Ll}{2,}[.!?]$/u.test(w) && !ABBREV_WORDS.has(bare(w)) && /^\p{Lu}/u.test(words[i + 1]))) return true
          // Title Case capitalizes a final particle ("Logging In", "Turning It On"); prose leaves it lowercase.
          const last = words[words.length - 1]
          // Only WITH another prose sign (a comma, or a long line): sentence-case headings end on a preposition
          // too ("1.2 Who this book is for", "Chapter 5 What to look for").
          if (words.length >= 3 && /^\p{Ll}/u.test(last) && PROSE_WORDS.has(bare(last)) && (/,/.test(words.join(' ')) || words.length >= 8)) return true
        }
        if (!/^\p{Ll}/u.test(words[0])) return false
        if (PROSE_WORDS.has(bare(words[0]))) return true
        // A line that ENDS on a function word ("...across the campus by") was cut mid-sentence. That and the
        // length rule apply only to a plain lowercase first word: "1.1 mRNA and translation of proteins in
        // cells" and "3.4 iOS setup for the app" are long headings whose first word is a mixed-case term.
        if (!/^\p{Ll}+$/u.test(words[0].replace(/[^\p{L}]/gu, ''))) return false
        return PROSE_WORDS.has(bare(words[words.length - 1])) || words.length >= 6
      }
      const chapterLevel = (t) => {
        const m = t.match(CHAPTER_RE)
        if (!m || !chapterNumOk(m[2])) return null
        // A separator after the number ("Chapter 1: the basics", "Chapter 3 · the basics") marks a title.
        const restCh = t.slice(m[0].indexOf(m[2]) + m[2].length)
        // A SENTENCE that opens with a chapter word ("Part 2 explains this later.", "Chapter 5 covers routing.")
        // is prose: as a heading it cut the real chapter short at that line.
        // Only WITHOUT a separator, and only a period: "Chapter 1: What is a Network?" is a real title.
        const sepCh = /[.:)]$/.test(m[2]) || /^\s*[:·\-–—.|]/.test(restCh)
        // ...and only when the text after the number starts LOWERCASE ("Chapter 7 The End." and "Chapter 3 Life in
        // the U.S." are titles) and the period is not an ellipsis ("What Comes Next...").
        if (!sepCh && /(?<!\.)[.。]$/.test(t) && /^\p{Ll}/u.test(restCh.trim()) && restCh.trim().split(/\s+/).length >= 2) return null
        if (!sepCh && proseAfterNumber(restCh)) return null
        if (PART_WORDS.test(m[1])) return 0
        // "Lesson 1" is a top-level unit (its "1.1 Vocabulary" sits below it); "Section 1.2" nests by its dots.
        if (SUB_WORDS.test(m[1])) return Math.min(3, m[2].replace(/[.:)]$/, '').split('.').length)
        return 1
      }
      // Full-width digits (Japanese PDFs use them; JS \d is ASCII only) and Korean "제N장".
      const CJK_CHAPTER_RE = /^(第\s*[\d０-９一二三四五六七八九十百]+\s*[章課课节節回部編编]|제\s*[\d０-９]+\s*[장과부편]).{0,100}$/u
      // Level by the unit character, like the chapter words: 部/編/编/부/편 (part) 0, 章/課/课/回/장/과 1,
      // 节/節 (section) 2. All level 1 made picking 第一章 return only its intro before 第一节.
      // A CJK chapter line that ends like a sentence (第三章介绍了…。) is prose, as above.
      const cjkHead = (t) => CJK_CHAPTER_RE.test(t) && !/[。.]$/.test(t) // 第一章 什么是网络？ is a title
      const cjkLevel = (t) => {
        const m = t.match(/^(?:第\s*[\d０-９一二三四五六七八九十百]+\s*([章課课节節回部編编])|제\s*[\d０-９]+\s*([장과부편]))/u)
        if (!m) return null
        const u = m[1] || m[2]
        return /[部編编부편]/u.test(u) ? 0 : /[节節]/u.test(u) ? 2 : 1
      }
      const detectHeadings = (file) => {
        const out = []
        const lines = file.text.split('\n')
        // Lines inside ``` / ~~~ fences are code: a "# install deps" comment there is not a heading.
        const inFence = []
        // A fence closes only on its OWN marker: a ~~~ inside a ``` block toggled it, and the rest of the file
        // (every heading after it) was taken for code.
        let fence = ''
        for (const line of lines) {
          const t = line.trim()
          const mk = (t.match(/^(```|~~~)/) || [])[1]
          if (mk && (!fence || fence === mk)) { inFence.push(true); fence = fence ? '' : mk; continue }
          inFence.push(!!fence)
        }
        // A file with markdown headings has its structure in them. Numbered and chapter-word lines
        // there are body text (a "1. HTTP uses port 80" list became three level-1 sections and the
        // last one swallowed the next real section).
        // Trusted in a .md file; in a .txt (every PDF upload) one stray "# of hosts" or indented code comment
        // switched the whole book to markdown mode and threw its chapter outline away, so a .txt needs 3+
        // such lines and no chapter-word / CJK chapter lines.
        const mdLines = lines.filter((line, i) => !inFence[i] && /^#{1,6}\s+\S/.test(line.trim())).length
        const hasMarkdown = mdLines > 0 && (/\.(md|markdown)$/i.test(file.name || '') ||
          (mdLines >= 3 && !lines.some((l, i) => !inFence[i] && (chapterLevel(l.trim()) !== null || cjkHead(l.trim())))))
        // "1. Introduction" is a chapter heading in plenty of PDF text; it is a list item when the line
        // right above or below is another "N." item (headings are separated by body text).
        const listMarker = (l) => /^\d+[.)]\s/.test(String(l || '').trim())
        const isListRun = (i) => listMarker(lines[i - 1]) || listMarker(lines[i + 1])
        let off = 0
        lines.forEach((line, i) => {
          const t = line.trim()
          let m
          if (inFence[i]) { /* code */ }
          else if ((m = t.match(/^(#{1,6})\s+(.{2,120})$/))) {
            out.push({ file: file.name, title: m[2].trim(), level: m[1].length, start: off, md: true })
          } else if (!hasMarkdown && (chapterLevel(t) !== null || cjkHead(t))) {
            out.push({ file: file.name, title: t.slice(0, 120), level: cjkHead(t) ? cjkLevel(t) : chapterLevel(t), start: off })
          } else if (!hasMarkdown && t.length <= 110 && /^\d+(\.\d+){0,3}[.)]?\s+\p{L}.{2,100}$/u.test(t)
            // Title-like only: a sentence ("2024 was the year it changed.") ends in a period, and a
            // bare "1. " / "1) " is a list marker, not "1.2 Title" numbering.
            && !/[.!?。]$/.test(t) && !(/^\d+[.)]\s/.test(t) && isListRun(i))
            && !proseAfterNumber(t.replace(/^\d+(\.\d+){0,3}[.)]?/, ''))) { // "1980 and was revised..." is wrapped prose
            const num = t.match(/^(\d+(?:\.\d+)*)/)
            out.push({ file: file.name, title: t.slice(0, 120), level: Math.min(4, num[1].split('.').length), start: off })
          }
          off += line.length + 1
        })
        // RUNNING HEADS: a PDF book repeats "46 Networking Basics" / "Chapter 3 Routing 47" at the top of
        // every page, and each copy became a heading (a 600-page book: 300 of 315 outline entries), so a
        // chosen chapter came back as one page. A detected title that repeats 3+ times (page numbers set
        // aside) keeps only its FIRST occurrence, the chapter's real start. Markdown headings are left
        // alone: a repeated "## Summary" there is a real section each time.
        // A bare "Chapter 7" (nothing after the number) keeps its number: stripped, all chapters of a book
        // laid out "CHAPTER N" / title-on-the-next-line folded into ONE key and only the first survived.
        const headKey = (h) => {
          const t = h.title.toLowerCase()
          const m = t.match(CHAPTER_RE)
          if (m && !t.slice(m[0].indexOf(m[2]) + m[2].length).trim()) return t.trim()
          return t.replace(/^\d+\s+/, '').replace(/(?<!\s)\s+\d+$/, '').trim()
        }
        // Keys once, indices grouped by key: filtering the whole outline per repeated title cost 2 s on a
        // 1500-section book, on every knowledge read.
        const keys = out.map(headKey)
        const byKey = new Map()
        out.forEach((h, i) => { if (!h.md) { if (!byKey.has(keys[i])) byKey.set(keys[i], []); byKey.get(keys[i]).push(i) } })
        const counts = new Map([...byKey].map(([k, v]) => [k, v.length]))
        // Which copy is the REAL chapter start: the one followed by the most text before the next heading.
        // Keeping simply the first kept the contents-page line ("Chapter 2 Routing 20"), whose "section"
        // is that one line.
        const gap = (i) => (i + 1 < out.length ? out[i + 1].start : file.text.length) - out[i].start
        // A copy with a TRAILING page number ("Chapter 2 Switching 47") is a running head or a contents
        // line; the real start has none. Measured by gap alone, the true start (followed at once by its
        // "2.1" subsection) lost to a running head a page later. Gap only decides among equals.
        const pageTail = (h) => /(?<!\s)\s+\d+$/.test(h.title)
        const best = new Map()
        out.forEach((h, i) => {
          if (h.md || (counts.get(keys[i]) || 0) < 3) return
          const k = keys[i]
          if (!best.has(k)) { best.set(k, i); return }
          const cur = out[best.get(k)]
          if (pageTail(cur) && !pageTail(h)) { best.set(k, i); return }
          if (pageTail(h) && !pageTail(cur)) return
          if (gap(i) > gap(best.get(k)) * 1.2) best.set(k, i) // a near tie keeps the earlier copy
        })
        // A title whose EVERY copy carries a page number, and not the same one ("2 Networking Essentials",
        // "4 Networking Essentials" on every even page), is the book's running head, not a chapter: one
        // kept copy became a fake chapter that cut the real one short.
        // Numbers in the SAME place on every copy: a real "2 Routing" (number in front) with running heads
        // "Routing 15", "Routing 17" (behind) is a chapter plus its heads, and keeps its start.
        const leadNum = (h) => (h.title.match(/^(\d+)\s+/) || [])[1]
        const tailNum = (h) => (h.title.match(/\s+(\d+)$/) || [])[1]
        const pureRunningHead = new Set()
        for (const k of best.keys()) {
          const copies = (byKey.get(k) || []).map((i) => out[i])
          // Leading numbers only: trailing-number heads ("Chapter 2 Switching 47") can be the only trace
          // of a chapter whose own heading line was not detected, so they keep their best copy.
          // ...unless one copy is a numbered CHAPTER: the copy followed by its own "3.1" section is the real
          // "3 Routing", and the others ("48 Routing", "50 Routing") are its verso running heads.
          const realAt = (byKey.get(k) || []).find((i) => leadNum(out[i]) && out[i + 1] && out[i + 1].title.startsWith(leadNum(out[i]) + '.')) ?? -1
          if (realAt >= 0) { best.set(k, realAt); continue }
          const nums = copies.map(leadNum)
          if (nums.every(Boolean) && !copies.some(tailNum) && new Set(nums).size > 1) pureRunningHead.add(k)
        }
        // Seen fewer than 3 times, WITH and WITHOUT a trailing page number: the numbered copy is the contents
        // line ("Chapter 2 Routing 20"), whose section is that one line. Only the real start is kept.
        const hasPlain = new Set(out.map((h, i) => (!h.md && !pageTail(h) ? keys[i] : null)).filter((k) => k !== null))
        const contentsCopy = (h, i) => !h.md && pageTail(h) && (counts.get(keys[i]) || 0) < 3 && hasPlain.has(keys[i])
        return out.filter((h, i) => h.md || ((counts.get(keys[i]) || 0) < 3 ? !contentsCopy(h, i) : (best.get(keys[i]) === i && !pureRunningHead.has(keys[i]))))
          .map(({ md, ...h }) => h)
      }
      // A TOC entry or content line reduced to comparable text: lowercase, no list bullet, no dotted
      // leader + page number. keepNum keeps a trailing number, because it can be part of the title
      // ("Windows 11", "Appendix 2"); the stripped form is only a fallback.
      // A dotted leader before the page number, in the forms PDF tools actually write: "....", ". . . .",
      // "····" and "……" (only "..." was recognised, so a real toc.txt matched nothing and was dropped).
      // Whitespace has ONE owner per step: "(?:\s*[.]\s*){2,}" let a space belong to either neighbour, so a
      // spaced leader that did not end in digits ("Preface . . . . xi") backtracked 2^n ways and froze the
      // whole server (26 dots = 24 s, per knowledge load). Roman page numbers (front matter) count too.
      // A ROMAN page number only after a real leader (4+ leader characters): prose ellipses are 3 dots or one
      // "…", and "Ready, Set... Mix" / "Vitamins ... c" lost their last word (the heading then never matched).
      // Each alternative starts only where a leader run STARTS (lookbehind): starting inside a long run made
      // every position try the rest of it (30,000 dots took 2.4 s, on every knowledge load).
      const TOC_LEADER_RE = /(?<![.·…_\s])\s*(?:[.·…_]\s*){2,}\d+$|(?<!…)…+\s*\d+$|(?<![.·…_\s])\s*(?:[.·…_]\s*){4,}[ivxlcdm]+$/i
      const tocNorm = (l, keepNum) => {
        let t = String(l).trim().replace(/^[-*•>\s]+/, '').replace(TOC_LEADER_RE, '')
        if (!keepNum) t = t.replace(/(?<!\s)\s+\d+$/, '') // (?<!\s): each whitespace run is tried ONCE (unanchored, a 5000-space run inside a line was quadratic)
        return t.trim().toLowerCase()
      }
      const extractOutline = (files) => {
        const tocFiles = files.filter((f) => TOC_NAME_RE.test(f.name))
        // NATURAL order (ch2 before ch10): the TOC search walks the files in order from the last match, and
        // alphabetical order put ch10-ch12 before ch2, so their entries were never found.
        const contentFiles = files.filter((f) => !TOC_NAME_RE.test(f.name)).slice().sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
        let outline = []
        if (tocFiles.length && contentFiles.length) {
          const titles = tocFiles.flatMap((f) => f.text.split('\n'))
            .map((l) => ({ raw: tocNorm(l, true), bare: tocNorm(l, false), shown: String(l).trim().replace(/^[-*•>\s]+/, '').replace(TOC_LEADER_RE, '').trim(), indent: String(l).replace(/\t/g, '    ').match(/^\s*/)[0].length }))
            .filter((t) => t.bare.length >= 3 && t.bare.length <= 120)
          // Every content line once, with its offset, in file order.
          const lines = []
          for (const f of contentFiles) {
            let off = 0
            for (const line of f.text.split('\n')) {
              lines.push({ file: f.name, start: off, leader: TOC_LEADER_RE.test(line.trim()), raw: tocNorm(line, true), bare: tocNorm(line, false) })
              off += line.length + 1
            }
          }
          const unnumbered = (s) => s.replace(/^\d+(?:\.\d+)*[.)]?\s*/, '')
          for (const ln of lines) ln.un = unnumbered(ln.bare)
          // Number-stripped forms compare only when at most ONE side had a trailing number: "Chapter 1" matched the
          // line "Chapter 2" (both stripped to "chapter"), and every later entry landed a chapter late.
          const numOk = (ln, t) => ln.raw === ln.bare || t.raw === t.bare
          const sameLine = (ln, t) => ln.raw === t.raw || (!!ln.bare && ln.bare === t.bare && numOk(ln, t))
            || (ln.un.length >= 3 && ln.un === unnumbered(t.bare) && numOk(ln, t))
          // Lines indexed by each comparable form: an entry that matched nothing scanned the whole book with two
          // regex replaces per line (800 entries x 50k lines = 2 s per knowledge load).
          const index = new Map()
          const addIdx = (k, i) => { if (!k) return; const a = index.get(k); if (a) a.push(i); else index.set(k, [i]) }
          lines.forEach((ln, i) => { addIdx('r:' + ln.raw, i); addIdx(ln.bare ? 'b:' + ln.bare : '', i); addIdx(ln.un.length >= 3 ? 'u:' + ln.un : '', i) })
          const candidatesFrom = (t, from) => {
            const tu = unnumbered(t.bare)
            const all = [...(index.get('r:' + t.raw) || []), ...(index.get('b:' + t.bare) || []), ...(tu.length >= 3 ? index.get('u:' + tu) || [] : [])]
            return [...new Set(all)].filter((i) => i >= from).sort((x, y) => x - y)
          }
          // WHOLE LINES, searched IN ORDER from after the previous match. First-substring-anywhere matched
          // every entry to the book's own contents page ("Introduction 1"), a mention in earlier prose, or
          // (for a repeated "Summary") the first chapter's copy every time.
          // Indentation steps of the toc file, for entries with no number and no chapter word.
          const indents = [...new Set(titles.map((t) => t.indent))].sort((x, y) => x - y)
          // Part / Chapter / Section and CJK units nest like in detectHeadings; numbers nest by depth;
          // otherwise the indentation. All-unnumbered-at-level-1 made "Part I" and "Chapter 1" end at
          // their first subsection.
          const tocLevel = (t, num) => {
            const cl = chapterLevel(t.shown) ?? cjkLevel(t.shown)
            if (cl !== null) return cl
            if (num) return Math.min(4, num[1].split('.').length)
            return Math.min(4, 1 + Math.max(0, indents.indexOf(t.indent)))
          }
          let cursor = 0
          titles.forEach((t, ti) => {
            const next = titles[ti + 1]
            for (const i of candidatesFrom(t, cursor)) {
              if (!sameLine(lines[i], t)) continue
              // A contents page lists the NEXT entries right below this one: that is the list, not the chapter.
              // Only when the line carries a page number or TWO following entries line up in a row: a real
              // chapter title is often followed directly by its first subsection ("Chapter 1" / "1.1 OSI").
              let j = i + 1
              while (j < lines.length && !lines[j].bare) j++
              if (next && j < lines.length && sameLine(lines[j], next)) {
                let k = j + 1
                while (k < lines.length && !lines[k].bare) k++
                const next2 = titles[ti + 2]
                const listed = next2 && k < lines.length && sameLine(lines[k], next2)
                // A contents line has a dotted leader, or it AND the next line end in page numbers; a heading
                // "Chapter 1" followed by "1.1 Intro" is the real start (it was skipped as a contents line).
                // Numbers the toc entries THEMSELVES end in ("Chapter 1" / "1.1 Installing Windows 11") are titles.
                const titleNums = lines[i].raw === t.raw && lines[j].raw === next.raw
                if (lines[i].leader || (!titleNums && lines[i].raw !== lines[i].bare && lines[j].raw !== lines[j].bare) || listed) continue
              }
              const num = t.bare.match(/^(\d+(?:\.\d+)*)/)
              outline.push({ file: lines[i].file, title: (lines[i].raw === t.raw ? t.shown : t.shown.replace(/(?<!\s)\s+\d+$/, '')).slice(0, 120), level: tocLevel(t, num), start: lines[i].start })
              cursor = i + 1
              break
            }
          })
          outline.sort((a, b) => (a.file === b.file ? a.start - b.start : a.file.localeCompare(b.file, undefined, { numeric: true }))) // natural order: ch2 before ch10
        }
        if (outline.length < 4) outline = contentFiles.flatMap(detectHeadings)
        return outline
      }
      const sliceSections = (files, outline, ids, cap) => {
        const byFile = Object.fromEntries(files.map((f) => [f.name, f.text]))
        const parts = []
        for (const id of ids) {
          const h = outline[id]
          const text = h && byFile[h.file]
          if (!text) continue
          // Section runs until the next heading in the same file at the same or higher level.
          let end = text.length
          for (let j = id + 1; j < outline.length; j++) {
            const n = outline[j]
            if (n.file !== h.file) break
            if (n.level <= h.level) { end = n.start; break }
          }
          parts.push(`### ${h.title} (${h.file})\n${text.slice(h.start, end).trim()}`)
        }
        let joined = parts.join('\n\n')
        if (joined.length > cap) joined = joined.slice(0, cap)
        return joined
      }

      // GET /api/knowledge-sections?mode=X&sections=1,4&cap=60000 → slice the requested
      // outline sections out of the mode's knowledge files. Indices match the `outline`
      // array returned by GET /api/modes/knowledge (recomputed here from the same files).
      server.middlewares.use('/api/knowledge-sections', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        try {
          const url = new URL(req.url, 'http://x')
          const modeName = modeFolderForName(dataPath('modes'), url.searchParams.get('mode') || '')
          if (!modeName) { res.end(JSON.stringify({ content: '', titles: [] })); return }
          const ids = (url.searchParams.get('sections') || '').split(',').map((s) => parseInt(s, 10)).filter((n) => Number.isInteger(n) && n >= 0).slice(0, 8)
          const cap = Math.min(200000, parseInt(url.searchParams.get('cap'), 10) || 60000)
          const all = readKnowledgeFiles(dataPath('modes', modeName, 'knowledge'))
          const outline = extractOutline(all)
          const content = sliceSections(all.filter((f) => !TOC_NAME_RE.test(f.name)), outline, ids, cap)
          res.end(JSON.stringify({ content, titles: ids.map((i) => outline[i]?.title).filter(Boolean) }))
        } catch (e) { res.end(JSON.stringify({ content: '', titles: [], error: e.message })) }
      })

      // Knowledge base endpoint — MUST be before /api/modes (prefix matching)
      // GET ?mode=X → list files + content + outline (headings/TOC for big-KB navigation)
      // POST ?mode=X (JSON {filename, content}) → upload file
      // DELETE ?mode=X&file=Y → delete file
      // PATCH ?mode=X&file=Y → toggle enable/disable
      server.middlewares.use('/api/modes/knowledge', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        const url = new URL(req.url, 'http://x')
        const modeName = url.searchParams.get('mode') || ''
        const sanitized = modeFolderForName(dataPath('modes'), modeName)
        const knowledgeDir = dataPath('modes', sanitized, 'knowledge')

        if (!sanitized) { res.end(JSON.stringify({ files: [], content: null, fileCount: 0 })); return }

        if (req.method === 'GET') {
          try {
            if (!fs.existsSync(knowledgeDir)) { res.end(JSON.stringify({ files: [], content: null, fileCount: 0 })); return }
            const allFiles = fs.readdirSync(knowledgeDir)
            // A file listed but already gone (another computer deleted or toggled it; the SMB directory cache
            // lists it ~10s longer) is skipped, never the whole answer: one ENOENT used to report "no files" and
            // ran every AI call without the knowledge base.
            const gone = (e) => e && e.code === 'ENOENT'
            const files = allFiles.filter(f => f.match(/\.(txt|md)(\.disabled)?$/i)).map(f => {
              const disabled = f.endsWith('.disabled')
              const name = disabled ? f.replace(/\.disabled$/, '') : f
              let size
              try { size = fs.statSync(path.join(knowledgeDir, f)).size } catch (e) { if (gone(e)) return null; throw e }
              return { name, disabled, size }
            }).filter(Boolean)
            const enabledFiles = allFiles.filter(f => f.match(/\.(txt|md)$/i))
            const content = enabledFiles.map(f => {
              let text
              try { text = fs.readFileSync(path.join(knowledgeDir, f), 'utf-8') } catch (e) { if (gone(e)) return null; throw e }
              return `--- ${f} ---\n${text}`
            }).filter((x) => x !== null).join('\n\n')
            // Outline (capped) so the client can offer TOC-guided section retrieval for big KBs.
            // Over the cap, keep the TOP levels of the whole book rather than the first 400 entries:
            // a straight slice made every chapter after entry 400 unreachable. Each entry carries its
            // original index `i`, which is what /api/knowledge-sections slices by.
            let full = extractOutline(readKnowledgeFiles(knowledgeDir)).map((h, i) => ({ ...h, i }))
            for (let maxLevel = 3; full.length > 400 && maxLevel >= 1; maxLevel--) full = full.filter((h) => h.level <= maxLevel)
            const outline = full.slice(0, 400).map(({ file, title, level, i }) => ({ file, title, level, i }))
            res.end(JSON.stringify({ files, content: content || null, fileCount: enabledFiles.length, outline }))
          } catch (e) {
            // A read that FAILED is not an empty knowledge base: answered as one (200, no files), the list showed
            // "No files" and every AI call dropped the material. The client keeps what it has on a non-OK answer.
            res.statusCode = 500
            res.end(JSON.stringify({ error: e.message }))
          }
        } else if (req.method === 'POST') {
          const handleBody = (bodyStr) => {
            try {
              if (!fs.existsSync(knowledgeDir)) fs.mkdirSync(knowledgeDir, { recursive: true })
              const { filename, content, replace } = JSON.parse(bodyStr)
              const safeName = (filename || 'file.txt').replace(/[<>:"/\\|?*]/g, '')
              // Only what GET will list back (.txt/.md), never "." / ".." (the folder itself).
              if (!/\.(txt|md)$/i.test(safeName) || /^\.+$/.test(safeName)) throw new Error('only .txt, .md or .pdf files can be added')
              // A file of that name (any case: one file on Windows/macOS), on or switched off, is replaced
              // only when the client says so: "Book.pdf" is stored as book.txt and silently overwrote the
              // user's own book.txt.
              const lower = safeName.toLowerCase()
              const clash = fs.readdirSync(knowledgeDir).find((f) => f.toLowerCase() === lower || f.toLowerCase() === lower + '.disabled')
              if (clash && !replace) { res.statusCode = 409; res.end(JSON.stringify({ exists: true, filename: clash.replace(/\.disabled$/i, '') })); return }
              writeFileAtomic(path.join(knowledgeDir, safeName), content) // a cut-off write left a truncated book that every AI call then read
              // Re-uploading a file the user had switched off left BOTH copies: the list showed the
              // name twice, and switching the old one back on renamed it over the new upload. The
              // upload replaces the file of that name, the switched-off copy included.
              const staleDisabled = path.join(knowledgeDir, safeName + '.disabled')
              if (fs.existsSync(staleDisabled)) fs.rmSync(staleDisabled, { force: true })
              // A case-sensitive file system (Linux) kept "Notes.txt" beside the replacing "notes.txt": the text was
              // there twice. Removed only when it is really ANOTHER file (on Windows/macOS it is the same one).
              if (replace) {
                const mine = fs.statSync(path.join(knowledgeDir, safeName))
                for (const f of fs.readdirSync(knowledgeDir)) {
                  if (f === safeName || (f.toLowerCase() !== lower && f.toLowerCase() !== lower + '.disabled')) continue
                  try { const st = fs.statSync(path.join(knowledgeDir, f)); if (st.ino !== mine.ino || st.dev !== mine.dev) fs.rmSync(path.join(knowledgeDir, f), { force: true }) } catch { /* gone already */ }
                }
              }
              res.end(JSON.stringify({ ok: true, filename: safeName }))
            } catch (e) { res.statusCode = 400; res.end(JSON.stringify({ error: e.message })) }
          }
          if (req.body) { handleBody(typeof req.body === 'string' ? req.body : JSON.stringify(req.body)) }
          else { let b = ''; req.on('data', c => b += c); req.on('end', () => handleBody(b)) }
        } else if (req.method === 'DELETE') {
          try {
            const fileName = url.searchParams.get('file')
            if (!fileName) { res.statusCode = 400; res.end('{"error":"no file"}'); return }
            const safeName = fileName.replace(/[<>:"/\\|?*]/g, '')
            // "." or ".." named the knowledge folder or the MODE folder itself (a PATCH renamed the whole
            // mode to "<name>.disabled", dropping it from the list).
            if (/^[.\s]*$/.test(safeName)) { res.statusCode = 400; res.end('{"error":"bad file name"}'); return }
            const filePath = path.join(knowledgeDir, safeName)
            const disabledPath = filePath + '.disabled'
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
            if (fs.existsSync(disabledPath)) fs.unlinkSync(disabledPath)
            res.end('{"ok":true}')
          } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) }
        } else if (req.method === 'PATCH') {
          try {
            const fileName = url.searchParams.get('file')
            if (!fileName) { res.statusCode = 400; res.end('{"error":"no file"}'); return }
            const safeName = fileName.replace(/[<>:"/\\|?*]/g, '')
            // "." or ".." named the knowledge folder or the MODE folder itself (a PATCH renamed the whole
            // mode to "<name>.disabled", dropping it from the list).
            if (/^[.\s]*$/.test(safeName)) { res.statusCode = 400; res.end('{"error":"bad file name"}'); return }
            const filePath = path.join(knowledgeDir, safeName)
            const disabledPath = filePath + '.disabled'
            // `disabled=1|0`: the state the user asked for (a flip undid a double click, and re-enabled a file
            // another computer had just disabled). Already there = done. No parameter = the old flip.
            const want = new URL(req.url, 'http://x').searchParams.get('disabled')
            if (want === '1' && fs.existsSync(disabledPath) && !fs.existsSync(filePath)) { res.end(JSON.stringify({ ok: true, disabled: true })); return }
            if (want === '0' && fs.existsSync(filePath) && !fs.existsSync(disabledPath)) { res.end(JSON.stringify({ ok: true, disabled: false })); return }
            // BOTH copies exist (another computer, an offline merge): the flip renamed the switched-off copy over the
            // live one. With a wanted state nothing is overwritten: the copy in the way is kept beside it, switched off.
            if ((want === '0' || want === '1') && fs.existsSync(filePath) && fs.existsSync(disabledPath)) {
              const ext = path.extname(safeName)
              const kept = path.join(knowledgeDir, `${safeName.slice(0, safeName.length - ext.length)} (kept ${new Date().toISOString().slice(0, 10)} ${Date.now() % 100000})${ext}.disabled`)
              // want=1: the STALE switched-off copy is the one set aside, then the live file is switched off under
              // the real name (the other way round, re-enabling later brought back the old text).
              fs.renameSync(disabledPath, kept)
              if (want === '1') { fs.renameSync(filePath, disabledPath); res.end(JSON.stringify({ ok: true, disabled: true })); return }
              res.end(JSON.stringify({ ok: true, disabled: false })); return
            }
            if (fs.existsSync(disabledPath)) {
              fs.renameSync(disabledPath, filePath)
              res.end(JSON.stringify({ ok: true, disabled: false }))
            } else if (fs.existsSync(filePath)) {
              fs.renameSync(filePath, disabledPath)
              res.end(JSON.stringify({ ok: true, disabled: true }))
            } else {
              res.statusCode = 404; res.end('{"error":"file not found"}')
            }
          } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) }
        } else { res.statusCode = 405; res.end('') }
      })

      // Modes endpoint — per-mode named folders in modes/ directory
      // Each mode: modes/<sanitized-name>/config.json
      // Meta: modes/_meta.json
      server.middlewares.use('/api/modes', (req, res) => {
        const MODES_DIR = dataPath('modes')   // resolved per request so a live data-dir switch takes effect
        // Never let a failing mkdir escape as an uncaught middleware error (see the offline-share guard).
        try { if (!fs.existsSync(MODES_DIR)) fs.mkdirSync(MODES_DIR, { recursive: true }) } catch { /* handled below: reads fall back to empty, writes report the error */ }
        const metaFile = path.join(MODES_DIR, '_meta.json')

        const sanitizeName = modeFolderName

        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          try {
            // A torn or broken _meta.json only loses the active id (the client then picks the first mode); it
            // must not fail the whole read.
            let meta = {}
            try { meta = fs.existsSync(metaFile) ? (JSON.parse(readUtf8(metaFile)) || {}) : {} } catch { meta = {} }

            // Migrate legacy numbered folders/files
            const entries = fs.readdirSync(MODES_DIR)
            for (const entry of entries) {
              const full = path.join(MODES_DIR, entry)
              // Legacy flat file: 1.json → read, create named folder
              if (entry.match(/^\d+\.json$/)) {
                try {
                  const mode = JSON.parse(readUtf8(full))
                  const folderName = sanitizeName(mode.name, mode.id)
                  const newDir = path.join(MODES_DIR, folderName)
                  const target = path.join(newDir, 'config.json')
                  // Never over a mode that already has a folder (an old copy restored into a shared folder, a
                  // merge that kept both): that silently replaced the current config with the old one. The
                  // legacy file is kept aside instead, never deleted.
                  if (fs.existsSync(target)) { fs.renameSync(full, full + '.migrated'); continue }
                  if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true })
                  writeFileAtomic(target, JSON.stringify(mode, null, 2))
                  fs.unlinkSync(full)
                } catch {}
              }
              // Legacy numbered folder: 1/ → read config, rename to named folder
              if (entry.match(/^\d+$/) && fs.statSync(full).isDirectory()) {
                const cfgFile = path.join(full, 'config.json')
                if (fs.existsSync(cfgFile)) {
                  try {
                    const mode = JSON.parse(readUtf8(cfgFile))
                    const folderName = sanitizeName(mode.name, mode.id)
                    if (folderName !== entry) {
                      const newDir = path.join(MODES_DIR, folderName)
                      if (!fs.existsSync(newDir)) fs.renameSync(full, newDir)
                    }
                  } catch {}
                }
              }
            }

            // Read all mode folders
            const listDirs = () => fs.readdirSync(MODES_DIR).filter((d) => {
              const full = path.join(MODES_DIR, d)
              try { return d !== '_meta.json' && !isDefaultTemplate(MODES_DIR, d) && fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, 'config.json')) } catch { return false }
            })
            // A config that cannot be READ (an SMB sharing violation while another computer renames its temp
            // file) is retried once (folders listed again: one may have been renamed meanwhile), then fails the
            // request: answering a list without it unlocked saves on the in-memory default mode, which then
            // overwrote the real one. A folder that is GONE is just gone. A file that reads but is still not JSON
            // after the retry is renamed aside (config.json.corrupt-<stamp>, kept) and skipped, like config.json:
            // failing every launch on it locked mode saves for good.
            const readCfg = (d) => {
              let text
              try { text = readUtf8(path.join(MODES_DIR, d, 'config.json')) } catch (e) { return e && e.code === 'ENOENT' ? { gone: true } : { io: e } }
              try { return { mode: JSON.parse(text) } } catch { return { mode: null, torn: true, dir: d } }
            }
            let results = listDirs().map(readCfg)
            if (results.some((r) => r.io || r.torn)) {
              Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300)
              results = listDirs().map(readCfg)
            }
            const ioFail = results.find((r) => r.io)
            if (ioFail) throw ioFail.io
            for (const r of results) {
              if (!r.torn) continue
              const file = path.join(MODES_DIR, r.dir, 'config.json')
              // Only a STABLY broken file: one written in the last 30s may be another computer's save still
              // landing (renaming it would put the finished good copy aside). That, or a refused rename, is a
              // failed read (500, retried by the next load), never a list silently missing that mode.
              let age = 0
              try { age = Date.now() - fs.statSync(file).mtimeMs } catch { age = 0 }
              if (age < 30000) throw new Error(`mode config ${r.dir} is being written`)
              fs.renameSync(file, file + '.corrupt-' + new Date().toISOString().replace(/[:.]/g, '-'))
              console.warn('[Modes] set aside an unreadable config:', r.dir)
            }
            const modes = results.map((r) => r.mode).filter(Boolean)
            res.end(JSON.stringify({ modes, activeModeId: meta.activeModeId || (modes[0]?.id) || 1 }))
          } catch (e) {
            // A FAILED read (a transient SMB error) is not "no modes": answering an empty list made the
            // client run the legacy ankiformat.json migration and post years-old modes over the real ones.
            res.statusCode = 500
            res.end(JSON.stringify({ error: `modes could not be read: ${e.message}` }))
          }
        } else if (req.method === 'POST') {
          const handleBody = (bodyStr) => {
            try {
              const data = JSON.parse(bodyStr)
              // REFUSE an empty modes write. The sweep below DELETES every folder
              // not named in the payload, so `{modes: []}` would erase all of the
              // user's modes AND their knowledge bases, unrecoverably. The client
              // holds an empty list only when the modes READ failed (it falls back
              // to an in-memory default mode), and any deck picker then posts that
              // emptiness. A real "delete a mode" always sends the remaining ones,
              // and the app never lets the last mode go, so a legitimate save is
              // never empty. Same clobber shape as the /api/keys guard above.
              if (Array.isArray(data.modes) && data.modes.length === 0) {
                console.log('[Modes] refused an empty write that would have deleted every mode folder')
                res.setHeader('Content-Type', 'application/json')
                res.statusCode = 409
                res.end(JSON.stringify({ error: 'refused: empty modes list' }))
                return
              }
              const written = Array.isArray(data.modes) ? writeModeFolders(MODES_DIR, data.modes, data.activeModeId, data.deletedIds, data.changedIds, data.renamedIds) : null
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true, conflicts: written?.conflicts || [], renameFailed: written?.renameFailed || [], deletedElsewhere: written?.deletedElsewhere || [] }))
            } catch (e) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: e.message }))
            }
          }
          if (req.body) {
            handleBody(typeof req.body === 'string' ? req.body : JSON.stringify(req.body))
          } else {
            let body = ''
            req.on('data', (chunk) => { body += chunk })
            req.on('end', () => handleBody(body))
          }
        } else {
          res.statusCode = 405
          res.end('')
        }
      })

      // (old knowledge endpoint removed — moved before /api/modes)

      // Launch overlay endpoint
      let overlayProcess = null
      // How this computer opens Ebiki: the chrome-free app window, or a browser tab.
      // NOT in DATA_ROUTES on purpose (same reasoning as /api/datadir): the pointer is machine-local
      // and must stay switchable when the shared data folder is down.
      // Handoff state for a LIVE switch. The old page must not tear itself down until the new one is
      // actually on screen and beating (see the auto-exit note in the POST below), and the new page
      // is the only thing that can honestly report that. Each page says hello on mount with what it
      // is ('app' = Electron window, 'browser' = tab); a hello that matches the pending target AND
      // arrived after the request is the proof. The old page's own hello predates the request, and a
      // stray HMR remount of it reports the OLD kind, so neither can satisfy the handoff by mistake.
      let handoffPending = null   // { at, mode } | null
      let handoffReady = false
      server.middlewares.use('/api/launchmode', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        const sub = (req.url || '').split('?')[0].replace(/\/+$/, '') || '/'
        if (sub === '/hello') {
          if (req.method === 'POST') {
            let b = ''
            req.on('data', (c) => { b += c })
            req.on('end', () => {
              try {
                const kind = JSON.parse(b || '{}').kind === 'app' ? 'app' : 'browser'
                if (handoffPending && kind === handoffPending.mode && Date.now() >= handoffPending.at) {
                  handoffReady = true
                  console.log('[Launch mode] handoff complete:', kind, 'is up')
                }
              } catch { /* a malformed hello just means no handoff proof */ }
              res.statusCode = 204; res.end()
            })
            return
          }
          res.statusCode = 405; res.end(JSON.stringify({ error: 'method' })); return
        }
        // Whether the app window is even possible here - electron is an OPTIONAL dependency, so a
        // clone that never got it can only ever run in the browser and the UI must say so rather
        // than offering a choice that silently does nothing.
        const electronAvailable = ['node_modules/electron/dist/Ebiki.exe', 'node_modules/electron/dist/electron.exe', 'node_modules/electron/dist/electron', 'node_modules/electron/cli.js']
          .some((rel) => fs.existsSync(path.resolve(rel)))
        if (req.method === 'GET') {
          res.end(JSON.stringify({ mode: readLaunchMode(), electronAvailable, handoffReady, handoffPending: !!handoffPending }))
          return
        }
        if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ error: 'method' })); return }
        let body = ''
        req.on('data', (c) => { body += c })
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body || '{}')
            const mode = parsed.mode === 'browser' ? 'browser' : 'app'
            writeFileAtomic(LAUNCH_MODE_POINTER, JSON.stringify({ mode }, null, 2))
            console.log('[Launch mode] set to', mode)
            // switchNow = open the OTHER front end right now instead of waiting for the next launch.
            // The old window/tab is deliberately NOT closed from here: the dev server's auto-exit
            // watches for the last heartbeat, so tearing the old page down before the new one is up
            // and beating would look exactly like "everybody left" and take the server with it. The
            // client closes itself only once the new page reports in (see the handoff below).
            let launched = false
            let launchError = null
            if (parsed.switchNow) {
              handoffPending = { at: Date.now(), mode }
              handoffReady = false
              // spawn() reports ENOENT/EACCES as an 'error' EVENT, not a throw: with no listener it was an
              // uncaught exception that took the whole dev server down (no xdg-open on Linux, say).
              const onSpawnError = (e) => { handoffPending = null; console.warn('[Launch mode] switch-now failed:', e.message) }
              try {
                if (mode === 'browser') {
                  const url = 'http://localhost:3000?handoff=1'
                  if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).on('error', onSpawnError).unref()
                  else if (process.platform === 'darwin') spawn('open', [url], { detached: true, stdio: 'ignore' }).on('error', onSpawnError).unref()
                  else spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).on('error', onSpawnError).unref()
                } else {
                  // Prefer the branded Ebiki.exe for the same reason scripts/launch.ps1 does: Windows
                  // resolves a PINNED taskbar icon from the running EXE itself, so the plain
                  // electron.exe would pin the generic Electron logo.
                  const exe = ['node_modules/electron/dist/Ebiki.exe', 'node_modules/electron/dist/electron.exe', 'node_modules/electron/dist/electron']
                    .map((rel) => path.resolve(rel)).find((f) => fs.existsSync(f))
                  const mainScript = path.resolve('electron/main.cjs')
                  // --from-launcher: this server obviously exists, so the window must NOT run the
                  // bare-launch bootstrap in main.cjs (that path is for a taskbar pin of the exe,
                  // where nothing has started a server).
                  if (exe) spawn(exe, [mainScript, '--from-launcher'], { cwd: APP_ROOT, detached: true, stdio: 'ignore' }).on('error', onSpawnError).unref()
                  else {
                    const cli = path.resolve('node_modules/electron/cli.js')
                    if (!fs.existsSync(cli)) throw new Error('Electron is not installed')
                    spawn(process.execPath, [cli, mainScript, '--from-launcher'], { cwd: APP_ROOT, detached: true, stdio: 'ignore' }).on('error', onSpawnError).unref()
                  }
                }
                launched = true
              } catch (e) {
                launchError = e.message
                handoffPending = null
                console.warn('[Launch mode] switch-now failed:', e.message)
              }
            }
            res.end(JSON.stringify({ ok: true, mode, launched, launchError }))
          } catch (e) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: e.message }))
          }
        })
      })

      let overlayCheck = { at: 0, running: false, pending: null }
      const untrackedOverlayRunning = () => {
        if (Date.now() - overlayCheck.at < 15000) return Promise.resolve(overlayCheck.running)
        if (overlayCheck.pending) return overlayCheck.pending
        overlayCheck.pending = new Promise((resolve) => {
          const q = "@(Get-CimInstance Win32_Process -Filter \"Name='electron.exe'\" | Where-Object { $_.CommandLine -like '*main.cjs*' -and $_.CommandLine -like '*--overlay*' }).Count"
          const ps = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', q], { windowsHide: true })
          let out = ''
          ps.stdout.on('data', (d) => { out += d })
          let settled = false
          const done = (running) => { if (settled) return; settled = true; clearTimeout(timer); overlayCheck = { at: Date.now(), running, pending: null }; resolve(running) }
          // A stuck WMI service never lets Get-CimInstance return. Without a cap every GET awaited this
          // one promise forever, the 3s client poll piled up hung requests until the browser's
          // per-host connection limit was full, and every other /api call (heartbeats too) queued.
          const timer = setTimeout(() => { try { ps.kill() } catch { /* already gone */ } done(false) }, 10000)
          ps.on('close', () => done(parseInt(String(out).trim(), 10) > 0))
          ps.on('error', () => done(false))
        })
        return overlayCheck.pending
      }
      // A stop in progress (the orphan sweep runs async): a start right after it (a quick off-then-on)
      // waits for it, or the sweep could kill the NEW overlay by its command line.
      let overlayStopping = null
      // Launch POSTs run one at a time: two at once (a toggle click plus the page's auto-launch) both passed
      // the untracked-overlay check and spawned two overlays.
      let overlayLaunchChain = Promise.resolve()
      let overlayWanted = 0 // bumped by every stop: a launch still checking when the user switched it off must not spawn
      server.middlewares.use('/api/launch-overlay', async (req, res) => {
        console.log('[Overlay API] request:', req.method, req.url)
        if (req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json')
          const prevLaunch = overlayLaunchChain
          let releaseLaunch
          overlayLaunchChain = new Promise((r) => { releaseLaunch = r })
          // Released when the handler ANSWERS (every POST path ends with res.end), not when the connection
          // closes: a page reload mid-check freed the lock early and the next POST spawned a second overlay.
          const endLaunch = res.end.bind(res)
          res.end = (...args) => { releaseLaunch(); return endLaunch(...args) }
          const wantedAt = overlayWanted
          await prevLaunch
          if (overlayStopping) { try { await overlayStopping } catch { /* stopped either way */ } }
          if (overlayProcess && !overlayProcess.killed) {
            console.log('[Overlay API] already running')
            res.end(JSON.stringify({ ok: true, status: 'already running' }))
            return
          }
          // An overlay this server did not start (a crashed earlier server's) holds Alt+Q: a second
          // one could not register it and was the only one killed on exit, so they piled up.
          if (process.platform === 'win32') {
            overlayCheck = { at: 0, running: false, pending: null }
            if (await untrackedOverlayRunning()) {
              console.log('[Overlay API] an untracked overlay is already running')
              res.end(JSON.stringify({ ok: true, status: 'already running' }))
              return
            }
          }
          if (wantedAt !== overlayWanted) { res.end(JSON.stringify({ ok: true, status: 'cancelled' })); return } // stopped meanwhile
          const electronCli = path.resolve('node_modules/electron/cli.js')
          console.log('[Overlay API] electron cli path:', electronCli, 'exists:', fs.existsSync(electronCli))
          if (!fs.existsSync(electronCli)) {
            res.end(JSON.stringify({ error: 'Electron not installed. Run: npm install electron --save-optional' }))
            return
          }
          try {
            const mainScript = path.resolve('electron/main.cjs')
            // --overlay is REQUIRED here, not optional - electron/main.cjs defaults to opening
            // the main app window (a bare launch has to work for a naive taskbar pin that only
            // remembers the exe path, see package.json's "main" field), so without this flag the
            // overlay process would open a second full app window instead of the invisible
            // Alt+Q capture helper.
            console.log('[Overlay API] spawning:', process.execPath, electronCli, mainScript, '--overlay')
            const p = spawn(process.execPath, [electronCli, mainScript, '--overlay'], {
              stdio: 'inherit', detached: false,
            })
            overlayProcess = p
            // Clear only if it is still THIS child: the previous overlay exiting after a quick restart
            // cleared the reference to the new one, which then outlived Ebiki holding Alt+Q.
            p.on('exit', (code) => { console.log('[Overlay API] process exited, code:', code); if (overlayProcess === p) overlayProcess = null })
            p.on('error', (err) => { console.error('[Overlay API] process error:', err.message); if (overlayProcess === p) overlayProcess = null })
            console.log('[Overlay API] Electron process launched, pid:', overlayProcess.pid)
            overlayCheck = { at: 0, running: false, pending: null }
            res.end(JSON.stringify({ ok: true, status: 'launched' }))
          } catch (e) {
            console.error('[Overlay] Launch failed:', e.message)
            res.end(JSON.stringify({ error: 'Failed to launch: ' + e.message }))
          }
        } else if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          // Check if any electron process is running (not just tracked one)
          if (overlayProcess && !overlayProcess.killed) {
            res.end(JSON.stringify({ running: true }))
          } else if (process.platform === 'win32') {
            // An overlay this server did not start (left by an earlier server) is found by its
            // command line, exactly like the DELETE branch below. This used to ask whether ANY
            // electron.exe was running, which is always true in app-window mode (the app window is
            // Electron) and whenever VS Code, Slack or Discord is open, so the header showed the
            // overlay as ON when it was off. The page polls this every 3s, so the answer is cached
            // for 15s instead of spawning a process on every poll.
            untrackedOverlayRunning().then((running) => res.end(JSON.stringify({ running })))
          } else {
            res.end(JSON.stringify({ running: false }))
          }
        } else if (req.method === 'DELETE') {
          res.setHeader('Content-Type', 'application/json')
          overlayWanted++
          console.log('[Overlay API] stopping the overlay process')
          try {
            if (process.platform === 'win32') {
              // Only OUR overlay, never `taskkill /IM electron.exe`: that also takes down every other
              // Electron app on the machine (and an unbranded app window). The tracked process is
              // node running electron's cli.js, whose electron.exe is a CHILD, hence the tree kill.
              if (overlayProcess?.pid) spawn('taskkill', ['/F', '/T', '/PID', String(overlayProcess.pid)], { windowsHide: true, stdio: 'ignore' }).on('error', () => {})
              // An overlay left behind by an earlier server is untracked; it is still identifiable
              // exactly by its command line (electron.exe ... main.cjs --overlay).
              const orphanKill = "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'electron.exe' -and $_.CommandLine -like '*main.cjs*' -and $_.CommandLine -like '*--overlay*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
              const sweep = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', orphanKill], { windowsHide: true, stdio: 'ignore' })
              // At the cap the sweep is STOPPED, not just waited out: still running, it killed the overlay a
              // quick off/on had just launched (by the same command line).
              const stopping = new Promise((resolve) => { sweep.on('close', resolve); sweep.on('error', resolve); setTimeout(() => { try { sweep.kill() } catch { /* gone */ } resolve() }, 10000) })
              overlayStopping = stopping
              stopping.then(() => { if (overlayStopping === stopping) overlayStopping = null })
            } else if (overlayProcess) {
              overlayProcess.kill()
            }
          } catch (e) { console.error('[Overlay API] kill error:', e.message) }
          overlayProcess = null
          overlayCheck = { at: Date.now(), running: false, pending: null }
          res.end(JSON.stringify({ ok: true, status: 'stopped' }))
        } else { res.statusCode = 405; res.end('') }
      })

      // Serve overlay screenshot
      // Hide overlay window (called by ESC in overlay mode)
      server.middlewares.use('/api/overlay-hide', (req, res) => {
        if (req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json')
          // The overlay window will hide itself — Electron process stays running
          console.log('[Overlay API] hide requested')
          res.end('{"ok":true}')
        } else { res.statusCode = 405; res.end('') }
      })

      server.middlewares.use('/api/overlay-screenshot', (req, res) => {
        const file = path.join(SELF_DIR, 'electron', 'last-capture.png') // same file main.cjs writes (next to itself)
        if (fs.existsSync(file)) {
          res.setHeader('Content-Type', 'image/png')
          res.end(fs.readFileSync(file))
        } else {
          res.statusCode = 404
          res.end('')
        }
      })


      // ── Data folder endpoint (optional shared data directory) ───────────
      // GET → where the data lives now and how that was decided.
      // POST {dataDir} → switch LIVE (no restart). Two directions, each offering
      //   a merge choice the client resolves by re-POSTing with explicit `merge`:
      //   • JOIN a shared folder (from the app folder or another share): if the
      //     target already has data and this computer has items it lacks, reply
      //     {needsChoice, context:'join', sourceOnly}. merge:true unions this
      //     computer's data into the target (target files are NEVER overwritten);
      //     merge:false adopts the target as-is. Joining FROM the app folder
      //     stashes this computer's own data in .local-home/ so it can come back.
      //   • RETURN to the app folder ({dataDir:''}): restore this computer's OWN
      //     stashed data (what it had before it joined a share) — not a copy of
      //     the shared data. If the share gained items the stash lacks, reply
      //     {needsChoice, context:'return', sourceOnly}; merge:true also copies
      //     those shared extras into this computer, merge:false restores the
      //     stash only. With no stash (this machine only ever used a share), the
      //     shared data is copied down so local isn't empty.
      //   Nothing is ever deleted — collisions are parked in local-data-backup-
      //   <date>/. A shared folder is only ever written to by an explicit merge:true.
      server.middlewares.use('/api/datadir', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        const envOverride = (process.env.EBIKI_DATA_DIR || '').trim()
        if (req.method === 'GET') {
          res.end(JSON.stringify({ dataDir: DATA_DIR, appRoot: APP_ROOT, isDefault: DATA_DIR === APP_ROOT, envOverride: !!envOverride }))
        } else if (req.method === 'POST') {
          let body = ''
          req.on('data', (c) => { body += c })
          req.on('end', async () => {
            // One switch at a time: the switch awaits a reachability probe halfway, and two requests
            // (a double click, two windows) both started from the same folder and moved/merged its data twice.
            if (datadirSwitching) { res.statusCode = 409; res.end(JSON.stringify({ code: 'switching', error: 'A data folder change is already running. Wait for it to finish.' })); return }
            datadirSwitching = true
            try {
              if (envOverride) { res.statusCode = 409; res.end(JSON.stringify({ code: 'envOverride', error: 'The EBIKI_DATA_DIR environment variable is set and overrides this setting. Unset it to change the data folder here.' })); return }
              const parsed = JSON.parse(body || '{}')
              const raw = String(parsed.dataDir || '').trim()
              const merge = parsed.merge   // true | false | undefined (ask)
              // Compared as the FILE SYSTEM sees them: "c:\...\ebiki" is the app folder on Windows, and an
              // exact string test sent it down the JOIN path, which stashed this computer's data out of the
              // very folder it was switching to (every data route then answered 503 on every launch).
              // No realpath: it would TOUCH the paths, and the folder being left may be a dead share whose
              // every sync read blocks the whole server.
              const canon = (p) => { const x = path.resolve(p).replace(/[\\/]+$/, ''); return (process.platform === 'win32' || process.platform === 'darwin') ? x.toLowerCase() : x }
              const resolved = raw ? path.resolve(raw) : APP_ROOT
              const next = canon(resolved) === canon(APP_ROOT) ? APP_ROOT : canon(resolved) === canon(DATA_DIR) ? DATA_DIR : resolved
              // Never INSIDE this computer's own data (modes/, chats/, …) or its local copies: joining there
              // would move the target folder itself into .local-home.
              const relToApp = path.relative(canon(APP_ROOT), canon(next))
              if (next !== APP_ROOT && relToApp && !relToApp.startsWith('..') && !path.isAbsolute(relToApp)) {
                const first = relToApp.split(/[\\/]/)[0]
                if (DATA_ENTRIES.some((e) => e.toLowerCase() === first.toLowerCase()) || first.startsWith('.local-')) {
                  res.statusCode = 400; res.end(JSON.stringify({ code: 'insideData', error: "That folder is inside this computer's own Ebiki data. Pick a folder outside it." })); return
                }
              }
              if (next === DATA_DIR) { res.end(JSON.stringify({ ok: true, unchanged: true, dataDir: DATA_DIR, isDefault: DATA_DIR === APP_ROOT, copied: [], merged: 0, restored: false })); return }
              const prev = DATA_DIR
              // Probe the share we are LEAVING once, asynchronously and bounded. Every read of it
              // below is synchronous, and on a dead mapped drive each one blocks the whole server
              // (every request, the heartbeat included) for the SMB timeout - on the one route
              // that must keep working when the share is gone: the way back to the app folder.
              const prevReachable = prev === APP_ROOT || await shareReachable()
              let copied = []; let restored = false
              const acc = { added: 0, merged: 0, keptBoth: 0 }   // deep-merge tallies

              if (next === APP_ROOT) {
                // ── RETURN to the app folder: restore THIS computer's own data ──
                if (dataEntriesPresent(LOCAL_HOME)) {
                  // Before restoring, offer to also pull down anything the share
                  // gained that this computer's stash doesn't have.
                  if (prev !== APP_ROOT && merge === undefined && prevReachable) {
                    const sourceOnly = sourceOnlySummary(prev, LOCAL_HOME)
                    if (sourceOnly.has) { res.end(JSON.stringify({ needsChoice: true, context: 'return', dataDir: next, sourceOnly })); return }
                  }
                  moveDataEntries(LOCAL_HOME, APP_ROOT)   // restore home (parks any stray app-folder data)
                  restored = true
                  if (merge === true && prev !== APP_ROOT && prevReachable) {
                    for (const entry of DATA_ENTRIES) deepMergeInto(path.join(prev, entry), path.join(APP_ROOT, entry), 'the shared folder', acc)
                  }
                } else {
                  // No stash (this machine only ever used a share): copy it down (if it can be read). With the
                  // share DOWN nothing was copied and the app opened empty (onboarding, then defaults saved)
                  // although this computer holds copies of it: the offline working copy (newest, when it
                  // belongs to that share) or else the last backup.
                  const src = prevReachable ? prev
                    : (dataEntriesPresent(OFFLINE_DIR) && sameFolder(offlineCopyDataDir() || '', prev)) ? OFFLINE_DIR
                      : dataEntriesPresent(BACKUP_DIR) ? BACKUP_DIR : null
                  if (src) for (const entry of DATA_ENTRIES) {
                    const from = path.join(src, entry)
                    if (fs.existsSync(from) && !fs.existsSync(path.join(APP_ROOT, entry))) { fs.cpSync(from, path.join(APP_ROOT, entry), { recursive: true, filter: (x) => !/\.\d+\.tmp$/.test(x) }); copied.push(entry) }
                  }
                }
                if (fs.existsSync(DATA_DIR_POINTER)) fs.unlinkSync(DATA_DIR_POINTER)
              } else {
                // ── JOIN a shared folder (from the app folder or another share) ──
                // A DEAD share being left is never read (each sync read blocks the whole server for the
                // SMB timeout, on the route meant to be the way out): no comparison, no copy, the target
                // is simply adopted. Nothing is written to it and nothing is deleted.
                if (prevReachable && merge === undefined && DATA_ENTRIES.some((e) => fs.existsSync(path.join(next, e)))) {
                  const sourceOnly = sourceOnlySummary(prev, next)
                  if (sourceOnly.has) { res.end(JSON.stringify({ needsChoice: true, context: 'join', dataDir: next, sourceOnly })); return }
                }
                fs.mkdirSync(next, { recursive: true })
                // A new EMPTY folder (starting fresh after the old share died): with no data entry it never
                // counted as reachable, every data route answered 503 and nothing could ever be saved there.
                if (!prevReachable && !DATA_ENTRIES.some((e) => fs.existsSync(path.join(next, e)))) fs.mkdirSync(path.join(next, 'modes'), { recursive: true })
                if (prevReachable) for (const entry of DATA_ENTRIES) {
                  const from = path.join(prev, entry)
                  const to = path.join(next, entry)
                  if (!fs.existsSync(from)) continue
                  if (merge === true) deepMergeInto(from, to, 'this computer', acc)   // true deep merge (nothing dropped)
                  // merge:false = "use only the folder's data": nothing of this computer's goes onto the share
                  // (it used to copy every entry the share lacked, chats and decks included, then said
                  // "kept only the folder's data"). Seeding an empty share (no prompt, merge undefined) still copies.
                  else if (merge !== false && !fs.existsSync(to)) { fs.cpSync(from, to, { recursive: true, filter: (x) => !/\.\d+\.tmp$/.test(x) }); copied.push(entry) }
                }
                // The switch is recorded FIRST, then this computer's data is stashed. The other order left
                // the app on its own folder with that folder's data already moved out whenever the pointer
                // write failed (permissions, a lock): it came up empty, onboarding and all, and saved
                // defaults. A stash that fails now only leaves local data where it was (nothing is lost).
                writeFileAtomic(DATA_DIR_POINTER, JSON.stringify({ dataDir: next }, null, 2) + '\n') // atomic: a torn pointer reads as "no shared folder" and the app ran on local data
                // Coming FROM the app folder: stash this computer's own data so a
                // later return restores it instead of the shared data.
                if (prev === APP_ROOT) {
                  try { moveDataEntries(APP_ROOT, LOCAL_HOME) } catch (e) { console.log('[Data dir] could not stash local data (left in place):', e.message) }
                }
              }
              DATA_DIR = next
              datadirSwitchedAt = Date.now() // only a REAL switch (a needsChoice answer or a failure changed nothing)
              // The offline routing and the reachability answer described the OLD folder: left in place,
              // dataPath() kept serving the old share's offline copy as the new folder's data (up to 15s).
              offlineActive = false
              reachCache = { at: 0, ok: false }
              // A snapshot of the NEW folder at once: waiting for the 10-minute timer left the old folder's
              // snapshot as the only one if the new share went down meanwhile.
              if (next !== APP_ROOT) setTimeout(() => { runBackup().catch(() => {}) }, 2000)
              const merged = acc.added + acc.merged   // items brought in or combined
              const keptBoth = acc.keptBoth           // conflicting files kept as a second copy
              console.log('[Data dir] switched to', next, restored ? "(restored this computer's data)" : '', merge === true ? `(added ${acc.added}, combined ${acc.merged}, kept-both ${acc.keptBoth})` : copied.length ? `(copied: ${copied.join(', ')})` : '')
              res.end(JSON.stringify({ ok: true, dataDir: next, isDefault: next === APP_ROOT, copied, merged, keptBoth, restored }))
            } catch (e) { res.statusCode = 400; res.end(JSON.stringify({ error: e.message })) }
            finally { datadirSwitching = false }
          })
        } else { res.statusCode = 405; res.end('') }
      })

      // Config endpoint
      server.middlewares.use('/api/config', async (req, res) => {
        // Unreachable-source handling lives in the shared data-route guard above
        // (503 when there is nothing to serve, .local-offline when there is), so
        // an empty read can never reach here and clobber the real file.
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          const r = await readConfigSettled()
          if (!r.ok) {
            console.log('[Config] config.json exists but could not be read; refusing to serve it as empty:', r.error)
            res.statusCode = 503
            res.end(JSON.stringify({ unreadable: true, error: r.error }))
            return
          }
          rememberAppLanguage(r.data?.appLanguage)
          res.end(JSON.stringify(r.data))
        } else if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => { body += chunk })
          req.on('end', () => {
            let parsed
            try { parsed = JSON.parse(body) } catch {
              res.statusCode = 400
              res.end('{"error":"invalid json"}')
              return
            }
            try {
              writeConfig(parsed)
              rememberAppLanguage(parsed?.appLanguage)
              res.setHeader('Content-Type', 'application/json')
              res.end('{"ok":true}')
            } catch (e) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: `config.json was not saved: ${e.message}` }))
            }
          })
        } else {
          res.statusCode = 405
          res.end('')
        }
      })
      // Deck progress observations
      server.middlewares.use('/api/deck-progress', (req, res) => {
        if (req.method === 'GET') {
          const url = new URL(req.url, 'http://localhost')
          const deck = url.searchParams.get('deck')
          if (!deck) { res.statusCode = 400; res.end(JSON.stringify({ error: 'deck required' })); return }
          let file = dataPath('decks', deckDirName(deck), 'progress-observations.md')
          // A folder saved under the raw name before deckDirName existed (possible on macOS/Linux,
          // which allow ":"): read it if the new one does not exist yet. Only a name with no path
          // separators or ".." is tried.
          if (!fs.existsSync(file) && !/[\\/]|^\.\.?$/.test(deck)) {
            const legacy = dataPath('decks', deck, 'progress-observations.md')
            try { if (fs.existsSync(legacy)) file = legacy } catch { /* not a valid path here */ }
          }
          res.setHeader('Content-Type', 'application/json')
          try {
            // Only a MISSING file is "no notes yet": existsSync answers false on ANY error (a share dropping, a
            // denied folder), and that empty reply let Insights write a fresh file over the real notes.
            let content = ''
            try { content = readUtf8(file) } catch (e) { if (e.code !== 'ENOENT') throw e }
            res.end(JSON.stringify({ content })) // BOM-free: the client JSON.parses it, and a BOM read as "nothing stored"
          } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) }
        } else if (req.method === 'POST') {
          let body = ''
          req.on('data', c => body += c)
          req.on('end', () => {
            try {
              const { deck, content } = JSON.parse(body)
              // Both required: a missing deck wrote into decks/_, and missing content saved the text "undefined".
              if (typeof deck !== 'string' || !deck.trim() || typeof content !== 'string') { res.statusCode = 400; res.end(JSON.stringify({ error: 'deck and content required' })); return }
              const dir = dataPath('decks', deckDirName(deck))
              if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
              writeFileAtomic(path.join(dir, 'progress-observations.md'), content)
              console.log('[Deck Progress] saved for:', deck)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true }))
            } catch (e) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: e.message }))
            }
          })
        } else { res.statusCode = 405; res.end('') }
      })

      // Discover Mode fallback store — local cache for learner profile + ledger when Anki
      // (the cloud-synced source of truth) is offline. Stored flat under discover/.
      server.middlewares.use('/api/discover-store', (req, res) => {
        const url = new URL(req.url, 'http://localhost')
        const kind = (url.searchParams.get('kind') || '').replace(/[^a-z]/gi, '')
        const mode = (url.searchParams.get('mode') || '').replace(/[^a-zA-Z0-9._-]/g, '-')
        res.setHeader('Content-Type', 'application/json')
        if (!kind || !mode) { res.statusCode = 400; res.end(JSON.stringify({ error: 'kind and mode required' })); return }
        const file = dataPath('discover', `${kind}__${mode}.json`)
        if (req.method === 'GET') {
          try {
            // Only a MISSING file is "no notes yet": existsSync answers false on ANY error (a share dropping, a
            // denied folder), and that empty reply let Insights write a fresh file over the real notes.
            let content = ''
            try { content = readUtf8(file) } catch (e) { if (e.code !== 'ENOENT') throw e }
            // `shared`: the store lives in a data folder other computers write too. Every computer writes each blob
            // here AND to its own Anki, so this copy is the freshest; its Anki only catches up through AnkiWeb, and
            // reading Anki first let a lagging copy win (the next write then dropped the other computer's hooks).
            res.end(JSON.stringify({ content, shared: !sameFolder(DATA_DIR, APP_ROOT) })) // BOM-free: the client JSON.parses it, and a BOM read as "nothing stored"
          } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) }
        } else if (req.method === 'POST') {
          let body = ''
          req.on('data', c => body += c)
          req.on('end', () => {
            try {
              const { content } = JSON.parse(body)
              const dir = dataPath('discover')
              if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
              writeFileAtomic(file, content)
              res.end(JSON.stringify({ ok: true }))
            } catch (e) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: e.message }))
            }
          })
        } else { res.statusCode = 405; res.end('') }
      })

      // Question reuse (opt-in, Settings > AI & cost): the study questions generated for a card, saved with
      // the card's DECK so a later review can ask them again instead of paying for a new generation. One small
      // file per NOTE in decks/<deck>/questions/ (the same per-deck folder as the progress notes):
      //   GET    ?deck=<name>&note=<noteId>  → { bank }          (null = nothing saved)
      //   POST   same query, body { bank }   → { ok }
      //   DELETE ?deck=<name>                → { ok, removed }   ("Clear saved questions": the deck AND its
      //                                                           subdecks, Parent--Child folders)
      // The client only calls it while the setting is ON; nothing here runs for a user who never turns it on.
      server.middlewares.use('/api/question-bank', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        const url = new URL(req.url, 'http://x')
        const deck = url.searchParams.get('deck') || ''
        const note = url.searchParams.get('note') || ''
        if (!deck.trim()) { res.statusCode = 400; res.end(JSON.stringify({ error: 'deck required' })); return }
        const deckDir = deckDirName(deck) // never a path from raw input
        const qDir = dataPath('decks', deckDir, 'questions')
        const noteOk = /^\d{1,20}$/.test(note)
        if (req.method === 'GET') {
          if (!noteOk) { res.statusCode = 400; res.end(JSON.stringify({ error: 'note required' })); return }
          try {
            const file = path.join(qDir, `${note}.json`)
            // Only a MISSING file is "nothing saved": existsSync said false on any stat error (a share blip), and the
            // next save replaced every saved set with one.
            let bank = null
            try { bank = JSON.parse(readUtf8(file)) } catch (e) { if (e && (e.code === 'ENOENT' || e instanceof SyntaxError)) bank = null; else throw e } // damaged = nothing saved
            res.end(JSON.stringify({ bank }))
          } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) }
        } else if (req.method === 'POST') {
          if (!noteOk) { res.statusCode = 400; res.end(JSON.stringify({ error: 'note required' })); return }
          let body = ''
          req.on('data', (c) => { body += c })
          req.on('end', () => {
            try {
              const { bank } = JSON.parse(body || '{}')
              if (!bank || typeof bank !== 'object' || !Array.isArray(bank.sets)) { res.statusCode = 400; res.end(JSON.stringify({ error: 'bank required' })); return }
              fs.mkdirSync(qDir, { recursive: true })
              writeFileAtomic(path.join(qDir, `${note}.json`), JSON.stringify(bank))
              res.end(JSON.stringify({ ok: true }))
            } catch (e) { res.statusCode = e instanceof SyntaxError ? 400 : 500; res.end(JSON.stringify({ error: e.message })) }
          })
        } else if (req.method === 'DELETE') {
          try {
            const decksRoot = dataPath('decks')
            let removed = 0
            // exact=1: the client names the deck and each real subdeck (Anki's list). The folder-name prefix
            // can't be reversed ("::" and a literal "--" map alike, trailing dots are stripped): clearing
            // "Grammar" also cleared a separate deck "Grammar--Advanced", and "Vol. 1."'s subdecks were missed.
            const exact = url.searchParams.get('exact') === '1'
            const wanted = new Set([deckDir, ...url.searchParams.getAll('also').filter((n) => n.trim()).map(deckDirName)].map(folderKey))
            const dirs = !fs.existsSync(decksRoot) ? []
              : fs.readdirSync(decksRoot).filter((d) => (exact ? wanted.has(folderKey(d)) : (folderKey(d) === folderKey(deckDir) || folderKey(d).startsWith(folderKey(deckDir) + '--'))))
            for (const d of dirs) {
              const dir = path.join(decksRoot, d, 'questions')
              if (!fs.existsSync(dir)) continue
              for (const f of fs.readdirSync(dir)) if (f.endsWith('.json')) { fs.rmSync(path.join(dir, f), { force: true }); removed++ }
              try { fs.rmdirSync(dir) } catch { /* not empty (a stray file): leave it */ }
            }
            res.end(JSON.stringify({ ok: true, removed }))
          } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) }
        } else { res.statusCode = 405; res.end('') }
      })

      // Chat sessions — saved to chats/ folder
      server.middlewares.use('/api/chats', (req, res) => {
        const chatsDir = dataPath('chats')
        try { if (!fs.existsSync(chatsDir)) fs.mkdirSync(chatsDir, { recursive: true }) } catch { /* see the offline-share guard */ }

        if (req.method === 'GET') {
          // List all chat sessions
          try {
            // One stat per file, not two per COMPARISON: the comparator used to stat inside the sort,
            // which is O(n log n) disk hits on a folder that may live on a network share.
            const mtime = new Map()
            for (const f of fs.readdirSync(chatsDir)) {
              if (!f.endsWith('.json')) continue
              try { mtime.set(f, fs.statSync(path.join(chatsDir, f)).mtimeMs) } catch { /* vanished mid-list */ }
            }
            const files = [...mtime.keys()].sort((a, b) => mtime.get(b) - mtime.get(a))
            const sessions = files.map(f => {
              try {
                const data = JSON.parse(readUtf8(path.join(chatsDir, f)))
                return { id: f.replace('.json', ''), ...data, messages: undefined, messageCount: data.messages?.length || 0 }
              } catch { return null }
            }).filter(Boolean)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(sessions))
          } catch (e) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: e.message }))
          }
        } else if (req.method === 'POST') {
          // Save or update a chat session
          let body = ''
          req.on('data', c => body += c)
          req.on('end', () => {
            try {
              const { id, keepTitle } = JSON.parse(body)
              let { messages } = JSON.parse(body) // let: a save of the same turns keeps per-card state from disk (below)
              let { mode } = JSON.parse(body)
              let { title, type } = JSON.parse(body)
              // A save with no message list wrote a chat with none (a blank entry in the list), and on an
              // existing id it could only fork a pointless copy.
              if (!Array.isArray(messages)) { res.statusCode = 400; res.end(JSON.stringify({ error: 'messages required' })); return }
              if (typeof title !== 'string') title = ''
              // A NEW id is the time in ms, and two computers on one shared folder (or a fork in the same ms)
              // could pick the same one: the second save replaced the first chat. Step until the name is free.
              const freshChatId = () => { let n = Date.now(); while (fs.existsSync(path.join(chatsDir, `${n}.json`))) n++; return String(n) }
              let chatId = id || freshChatId()
              if (!isSafeChatId(String(chatId))) { res.statusCode = 400; res.end(JSON.stringify({ error: 'bad id' })); return }
              let file = path.join(chatsDir, `${chatId}.json`)
              const origFile = file // a fork's copy takes its title, type and mode from the chat it copies
              // The SAME chat open on two computers (a shared folder, restore-on-refresh): a save whose
              // messages do not start with what is already on disk would erase the other computer's turns.
              // It is saved as a COPY under a new id instead (the client adopts the id it gets back).
              let forked = false
              // Read what is on disk STRICTLY: only a missing file is "new". A busy/locked file (another computer
              // mid-write on the share) or a torn read used to count as new too, and this save replaced the chat
              // (the other computer's turns lost, a rename undone). One retry, then refuse (the client keeps its id).
              let onDiskChat = null
              if (id) {
                for (let attempt = 0; ; attempt++) {
                  try { onDiskChat = JSON.parse(readUtf8(file)); break }
                  catch (e) {
                    if (e && e.code === 'ENOENT') break
                    if (attempt >= 1) {
                      // Truly unparseable (not a busy file): kept aside, and this save becomes the chat, like config.json.
                      // A 503 here refused every later save of this chat forever.
                      if (e instanceof SyntaxError) {
                        try { fs.renameSync(file, `${file}.corrupt-${Date.now()}`) } catch { /* left in place; the write below replaces it */ }
                        break
                      }
                      res.statusCode = 503; res.end(JSON.stringify({ error: 'The chat file could not be read right now. Try again.' })); return
                    }
                    const until = Date.now() + 300; while (Date.now() < until) { /* short wait for the other writer */ }
                  }
                }
              }
              if (id && onDiskChat) {
                try {
                  const onDisk = onDiskChat
                  const key = (m) => `${(m && m.role) || ''}\u0000${String((m && (m.content ?? m.text)) ?? '')}`
                  // Error bubbles never count (Help drops them from its saves, the Chat tab used to keep them): one saved by
                  // one surface made the other's next save a fork. They are left out of the saved copy too.
                  const had = (Array.isArray(onDisk && onDisk.messages) ? onDisk.messages : []).filter((m) => !(m && m.error))
                  const inc = (Array.isArray(messages) ? messages : []).filter((m) => !(m && m.error))
                  if (had.length > inc.length || had.some((m, i) => key(m) !== key(inc[i]))) {
                    chatId = freshChatId()
                    file = path.join(chatsDir, `${chatId}.json`)
                    forked = true
                    console.log('[Chat] chat', id, 'changed on disk since it was loaded; saved as a copy', chatId)
                  } else if (Array.isArray(messages)) {
                    // Same turns: keep what another window recorded on them since (a chat card ADDED to Anki). A
                    // stale window's save reset it to "+ Add", and a second click made a duplicate note.
                    had.forEach((m, i) => {
                      const hadCards = Array.isArray(m && m.cards) ? m.cards : []
                      if (!hadCards.some((c) => c && c.synced) || !inc[i] || !Array.isArray(inc[i].cards)) return
                      inc[i] = { ...inc[i], cards: inc[i].cards.map((c, j) => {
                        // The SAME card (position, front and back): a multi-meaning word's cards share one front, and
                        // matching by front alone marked an unadded meaning "Added".
                        const d = hadCards[j]
                        const done = c && !c.synced && d && d.synced && d.front === c.front && d.back === c.back && d
                        return done ? { ...c, synced: true, ...(done.addedTo ? { addedTo: done.addedTo } : {}) } : c
                      }) }
                    })
                    messages = inc
                  }
                } catch { /* an odd shape on disk: save as sent */ }
              }
              // An ordinary save of an existing chat sends its first message as the title, which undid a
              // rename on the very next message. keepTitle: a title already on disk wins.
              if (keepTitle && id && onDiskChat) {
                try {
                  const prev = onDiskChat
                  if (prev && typeof prev.title === 'string' && prev.title) title = prev.title
                  // A Help chat continued from the Chat tab (which sends no type) stays a Help chat.
                  if (!type && prev && typeof prev.type === 'string') type = prev.type
                  // A chat keeps the mode it was made in: opening another chat re-saves the current one
                  // with whatever mode is active NOW, which filed a Spanish chat under Security+ and fed
                  // it into that mode's Discover learner profile.
                  if (prev && typeof prev.mode === 'string' && prev.mode) mode = prev.mode
                } catch { /* new or unreadable: use what was sent */ }
              }
              if (type === 'help') mode = undefined // Help chats span every mode; never part of one mode's profile
              writeFileAtomic(file, JSON.stringify({ title, messages, date: new Date().toISOString(), ...(type ? { type } : {}), ...(mode ? { mode } : {}) }, null, 2))
              console.log('[Chat] saved:', chatId, '-', title)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ id: chatId, ok: true, ...(forked ? { forked: true } : {}) }))
            } catch (e) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: e.message }))
            }
          })
        } else if (req.method === 'DELETE') {
          const url = new URL(req.url, 'http://localhost')
          const id = url.searchParams.get('id')
          if (!isSafeChatId(id)) { res.statusCode = 400; res.end(JSON.stringify({ error: 'id required' })); return }
          const file = path.join(chatsDir, `${id}.json`)
          res.setHeader('Content-Type', 'application/json')
          try {
            if (fs.existsSync(file)) fs.unlinkSync(file)
            res.end(JSON.stringify({ ok: true }))
          } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) }
        } else { res.statusCode = 405; res.end('') }
      })

      // Load a single chat session
      server.middlewares.use('/api/chat-load', (req, res) => {
        const url = new URL(req.url, 'http://localhost')
        const id = url.searchParams.get('id')
        if (!isSafeChatId(id)) { res.statusCode = 400; res.end(JSON.stringify({ error: 'id required' })); return }
        const file = dataPath('chats', `${id}.json`)
        res.setHeader('Content-Type', 'application/json')
        try {
          if (file && fs.existsSync(file)) {
            res.end(fs.readFileSync(file, 'utf8'))
          } else {
            res.statusCode = 404
            res.end(JSON.stringify({ error: 'not found' }))
          }
        } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) }
      })

      // Web search proxy — uses DuckDuckGo HTML lite
      server.middlewares.use('/api/web-search', async (req, res) => {
        // Guarded: this handler is ASYNC, so a throw here ("//?q=x" is an invalid URL) was an unhandled
        // rejection that took the dev server down, where the sync handlers just answer 500.
        let url
        try { url = new URL(req.url, 'http://localhost') } catch { res.statusCode = 400; res.end(JSON.stringify({ error: 'bad request' })); return }
        const query = url.searchParams.get('q')
        if (!query) { res.statusCode = 400; res.end(JSON.stringify({ error: 'q required' })); return }
        res.setHeader('Content-Type', 'application/json')
        try {
          const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
          const resp = await fetch(ddgUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            // Bounded: with no timeout a stalled response left the chat on "Searching..." forever.
            // A timeout lands in the catch below, which the chat already reports as a failed search.
            signal: AbortSignal.timeout(12000),
          })
          const html = await resp.text()
          // Parse results from DuckDuckGo HTML. Text comes out of HTML, so its entities must be decoded:
          // raw, the model and the source links saw "It&#x27;s" and "Q&amp;A" instead of the text.
          const decode = (t) => t
            .replace(/&#x([0-9a-f]+);/gi, (_, h) => { try { return String.fromCodePoint(parseInt(h, 16)) } catch { return _ } })
            .replace(/&#(\d+);/g, (_, d) => { try { return String.fromCodePoint(Number(d)) } catch { return _ } })
            .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
          const text = (h) => decode(h.replace(/<[^>]+>/g, '')).trim()
          // The result__url text is a DISPLAY address ("www.site.com/page", no scheme), so the Sources
          // links were relative and did not open. The real target is in the title link's redirect
          // (//duckduckgo.com/l/?uddg=<encoded url>); the display address with https:// is the fallback.
          const resultUrl = (block, display) => {
            const href = (block.match(/class="result__a"[^>]*href="([^"]+)"/) || block.match(/href="([^"]+)"[^>]*class="result__a"/) || [])[1]
            if (href) {
              const h = decode(href)
              try {
                const u = new URL(h, 'https://duckduckgo.com')
                const real = u.searchParams.get('uddg')
                if (real && /^https?:\/\//i.test(real)) return real
                if (/^https?:$/.test(u.protocol) && !/duckduckgo\.com$/i.test(u.hostname)) return u.href
              } catch { /* fall through to the display address */ }
            }
            const d = String(display || '').trim().replace(/\s+/g, '')
            return !d ? '' : /^https?:\/\//i.test(d) ? d : `https://${d}`
          }
          const results = []
          const resultBlocks = html.split('result__body"')
          for (let i = 1; i < resultBlocks.length && results.length < 5; i++) {
            const block = resultBlocks[i]
            // Ads: their class sits BEFORE the split marker, and their link is DuckDuckGo's y.js ad redirect
            // (no uddg). They came back as the top results, with the display text as a made-up URL, and
            // chat cited them as sources.
            if (/result--ad\b/.test(resultBlocks[i - 1].slice(-400)) || /duckduckgo\.com\/y\.js/.test(block.slice(0, 1500))) continue
            const titleMatch = block.match(/class="result__a"[^>]*>(.*?)<\/a>/s)
            const snippetMatch = block.match(/class="result__snippet"[^>]*>(.*?)<\/a>/s) || block.match(/class="result__snippet"[^>]*>(.*?)<\/td>/s)
            const urlMatch = block.match(/class="result__url"[^>]*>(.*?)<\/a>/s)
            if (titleMatch) {
              results.push({
                title: text(titleMatch[1]),
                snippet: snippetMatch ? text(snippetMatch[1]) : '',
                url: resultUrl(block, urlMatch ? text(urlMatch[1]) : ''),
              })
            }
          }
          // DuckDuckGo answers a bot check (HTTP 202, an "anomaly" page) instead of results when it
          // decides to block a client. Parsed, that is simply zero results, so the chat said it found
          // nothing when it never searched at all. Report it as the failure it is.
          if (!results.length && (resp.status !== 200 || /anomaly|captcha/i.test(html))) {
            console.log('[Web Search] blocked by DuckDuckGo (status', resp.status + ') for:', query)
            res.statusCode = 502
            res.end(JSON.stringify({ error: 'The web search service is blocking requests right now. Try again later.', results: [] }))
            return
          }
          console.log('[Web Search]', query, '-', results.length, 'results')
          res.end(JSON.stringify({ results }))
        } catch (e) {
          console.error('[Web Search] error:', e.message)
          res.statusCode = 500
          res.end(JSON.stringify({ error: e.message, results: [] }))
        }
      })

    },
  }
}

export default defineConfig({
  plugins: [react(), apiPlugin()],
  // vitest: never collect tests from the local scratch folder (tooling copies of src land there).
  test: { exclude: ['**/node_modules/**', '**/.scratch/**'] },
  server: {
    port: 3000,
    // A normal `npm run dev` still auto-opens a browser tab (handy while developing).
    // A shortcut launch (EBIKI_AUTO_EXIT=1) does NOT — scripts/launch.ps1 / launch.sh
    // open Ebiki as its own chrome-free Electron window instead of a browser tab, so
    // Vite opening a tab too would leave a redundant "looks like a website" tab
    // sitting alongside the actual app window.
    open: process.env.EBIKI_AUTO_EXIT !== '1',
    // A shortcut launch must own port 3000 or fail loudly: silently sliding to
    // 3001 would leave a second, invisible instance behind the very tab the
    // single-instance launcher just decided not to start. A manual `npm run dev`
    // keeps the normal fallback so a deliberate second copy still works.
    strictPort: process.env.EBIKI_AUTO_EXIT === '1',
    // Other local sites (any http://localhost:<port>) could READ this server's files with Vite's default
    // CORS: the last screen capture, chats, config. The app only ever fetches its own origin.
    cors: false,
    // Nobody frames Ebiki (the app window and the overlay load it top-level): a site that framed it
    // invisibly could steer clicks on a fully working app.
    headers: { 'X-Frame-Options': 'DENY', 'Content-Security-Policy': "frame-ancestors 'none'" },
    watch: {
      // Native fs.watch fails on this drive (network/mapped volume) — poll instead
      usePolling: true,
      interval: 300,
      // vite.config.js must be ignored too: on this share the watcher fires a
      // phantom change event on it after every restart → infinite restart loop.
      // Config edits therefore require a manual dev-server restart.
      // *.tmp: writeFileAtomic's temp files (e.g. .env.<pid>.tmp next to the app files).
      ignored: ['**/.env', '**/config.json', '**/config.json.*', '**/ankiformat.json', '**/vite.config.js', '**/datadir.json', '**/applang.json', '**/.cache/**', '**/.app-ready', '**/modes/**', '**/decks/**', '**/chats/**', '**/local-data-backup-*/**', '**/.local-sync/**', '**/.local-home/**', '**/.local-offline/**', '**/.scratch/**', '**/*.tmp',
        ...featureDataEntries().map((e) => `**/${e}/**`), ...featureLocalFiles().map((l) => `**/${l}`)],
    },
  },
})

// Exported for the key-safety tests only; Vite consumes the default export above.
export { readEnvFile, parseEnv, writeEnv, mirrorEnv, ENV_FILE, ENV_BAK, ENV_CLEARED, ENV_DECLINED, readDeclined, readConfigChecked, readConfigSettled, writeConfig, apiRequestAllowed, deckDirName, modeFolderName, modeFolderForName, writeModeFolders, deepMergeJson }
