import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import http from 'http'
import crypto from 'crypto'
import { spawn, execFile } from 'child_process'

const ENV_FILE = path.resolve('.env')   // machine-local on purpose: API keys stay per computer
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
    const m = JSON.parse(fs.readFileSync(LAUNCH_MODE_POINTER, 'utf-8'))?.mode
    return m === 'browser' ? 'browser' : 'app'
  } catch { return 'app' }   // unset/corrupt = the current default, the app window
}
const DATA_ENTRIES = ['config.json', 'ankiformat.json', 'keys.json', 'modes', 'decks', 'chats', 'discover', 'cache']
function resolveDataDir() {
  const env = (process.env.EBIKI_DATA_DIR || '').trim()
  if (env) return path.resolve(env)
  try {
    const saved = String(JSON.parse(fs.readFileSync(DATA_DIR_POINTER, 'utf-8')).dataDir || '').trim()
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
const isPlainObject = (v) => v && typeof v === 'object' && !Array.isArray(v)
function deepMergeJson(target, source) {
  if (Array.isArray(target) && Array.isArray(source)) {
    const seen = new Set(target.map((x) => JSON.stringify(x)))
    for (const item of source) { const k = JSON.stringify(item); if (!seen.has(k)) { target.push(item); seen.add(k) } }
    return target
  }
  if (isPlainObject(target) && isPlainObject(source)) {
    for (const key of Object.keys(source)) target[key] = (key in target) ? deepMergeJson(target[key], source[key]) : source[key]
    return target
  }
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
// `acc` accumulates { added, merged, keptBoth } across the whole tree.
function deepMergeInto(from, to, label, acc) {
  if (!fs.existsSync(from)) return acc
  if (fs.statSync(from).isDirectory()) {
    fs.mkdirSync(to, { recursive: true })
    for (const name of fs.readdirSync(from)) deepMergeInto(path.join(from, name), path.join(to, name), label, acc)
    return acc
  }
  if (!fs.existsSync(to)) {
    fs.mkdirSync(path.dirname(to), { recursive: true })
    fs.copyFileSync(from, to)
    acc.added++
    return acc
  }
  // Both exist as files.
  if (to.toLowerCase().endsWith('.json') && from.toLowerCase().endsWith('.json')) {
    try {
      const before = fs.readFileSync(to, 'utf-8')
      const merged = deepMergeJson(JSON.parse(before), JSON.parse(fs.readFileSync(from, 'utf-8')))
      const out = JSON.stringify(merged, null, 2) + '\n'
      if (out !== before) { fs.writeFileSync(to, out, 'utf-8'); acc.merged++ }
      return acc
    } catch { /* not valid JSON on one side → fall through to keep-both */ }
  }
  try { if (fs.readFileSync(from).equals(fs.readFileSync(to))) return acc } catch { /* unreadable → keep both */ }
  const ext = path.extname(to); const base = path.basename(to, ext); const dir = path.dirname(to)
  let dest = path.join(dir, `${base} (from ${label})${ext}`); let n = 2
  while (fs.existsSync(dest)) dest = path.join(dir, `${base} (from ${label} ${n++})${ext}`)
  fs.copyFileSync(from, dest)
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
  if (!fs.existsSync(from)) return
  const st = fs.statSync(from)
  if (st.isDirectory()) {
    fs.mkdirSync(to, { recursive: true })
    for (const name of fs.readdirSync(from)) copyNewer(path.join(from, name), path.join(to, name), acc)
    return
  }
  let need = true
  try { const d = fs.statSync(to); need = st.size !== d.size || st.mtimeMs > d.mtimeMs } catch { need = true }
  if (need) { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); acc.n++ }
}
function runBackup() {
  if (DATA_DIR === APP_ROOT) return { skipped: 'local' }          // data already lives on this computer
  try {
    if (!dataEntriesPresent(DATA_DIR)) { lastBackup = { ...lastBackup, error: 'source unreachable' }; return { skipped: 'unreachable' } }
    const acc = { n: 0 }
    for (const entry of BACKUP_ENTRIES) copyNewer(path.join(DATA_DIR, entry), path.join(BACKUP_DIR, entry), acc)
    lastBackup = { at: new Date().toISOString(), files: acc.n, error: null }
    return { ok: true, files: acc.n }
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
let offlineSince = null

// Probing a dead mapped drive is slow (SMB timeouts), and every data request asks.
// Cache the answer briefly so a page load doesn't stack dozens of blocking probes.
let reachCache = { at: 0, ok: false }
const REACH_TTL_MS = 3000
function shareReachable() {
  if (DATA_DIR === APP_ROOT) return true
  const now = Date.now()
  if (now - reachCache.at < REACH_TTL_MS) return reachCache.ok
  const ok = dataEntriesPresent(DATA_DIR)
  reachCache = { at: now, ok }
  return ok
}

// Seed (once) and activate the offline working copy. Returns false when there is
// no snapshot to run from — a machine that joined a share and never completed a
// backup has nothing local, and inventing empty data would be worse than an error.
function enterOffline() {
  if (offlineActive) return true
  if (!dataEntriesPresent(BACKUP_DIR)) return false
  try {
    if (!fs.existsSync(OFFLINE_META)) {
      fs.mkdirSync(OFFLINE_DIR, { recursive: true })
      for (const entry of BACKUP_ENTRIES) {
        const from = path.join(BACKUP_DIR, entry)
        if (fs.existsSync(from)) fs.cpSync(from, path.join(OFFLINE_DIR, entry), { recursive: true })
      }
      fs.writeFileSync(OFFLINE_META, JSON.stringify({ since: new Date().toISOString(), dataDir: DATA_DIR }, null, 2) + '\n', 'utf-8')
      console.log('[Offline] share unreachable. Running from a local copy in .local-offline')
    }
    offlineSince = JSON.parse(fs.readFileSync(OFFLINE_META, 'utf-8')).since || new Date().toISOString()
    offlineActive = true
    return true
  } catch (e) { console.log('[Offline] could not start offline mode:', e.message); return false }
}

// The state every data endpoint branches on. Called per request (cheaply), so a
// share that comes back mid-session is picked up without a restart: offline goes
// false immediately, while `.local-offline/` STAYS on disk holding the offline
// edits until the user reconciles or discards them.
function dataMode() {
  if (shareReachable()) { offlineActive = false; return 'online' }
  return enterOffline() ? 'offline' : 'down'
}

// Walk the offline working copy against the base. `changed` = files this computer
// actually touched while offline (new or differing bytes); anything identical to
// the base is not an edit and is left out of the reconcile entirely.
function offlineChangedFiles(rel = '', out = []) {
  const here = path.join(OFFLINE_DIR, rel)
  if (!fs.existsSync(here)) return out
  for (const name of fs.readdirSync(here)) {
    if (!rel && name === '.offline.json') continue
    const r = rel ? path.join(rel, name) : name
    const abs = path.join(OFFLINE_DIR, r)
    if (fs.statSync(abs).isDirectory()) { offlineChangedFiles(r, out); continue }
    const base = path.join(BACKUP_DIR, r)
    let same = false
    try { same = fs.existsSync(base) && fs.readFileSync(base).equals(fs.readFileSync(abs)) } catch { same = false }
    if (!same) out.push(r)
  }
  return out
}

function offlineStatus() {
  const has = fs.existsSync(OFFLINE_META)
  return {
    offline: offlineActive,
    pending: has && !offlineActive,                    // edits waiting to go back to a share that is up again
    since: has ? offlineSince : null,
    changes: has ? offlineChangedFiles().length : 0,
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
function reconcileOffline() {
  const acc = { added: 0, merged: 0, keptBoth: 0 }
  const fastForward = []
  for (const rel of offlineChangedFiles()) {
    const mine = path.join(OFFLINE_DIR, rel)
    const base = path.join(BACKUP_DIR, rel)
    const theirs = path.join(DATA_DIR, rel)
    let shareMoved = false
    if (fs.existsSync(theirs)) {
      try { shareMoved = !(fs.existsSync(base) && fs.readFileSync(base).equals(fs.readFileSync(theirs))) } catch { shareMoved = true }
    }
    if (!fs.existsSync(theirs) || !shareMoved) {
      fs.mkdirSync(path.dirname(theirs), { recursive: true })
      fs.copyFileSync(mine, theirs)
      fastForward.push(rel)
    } else {
      deepMergeInto(mine, theirs, 'this computer offline', acc)
    }
  }
  fs.rmSync(OFFLINE_DIR, { recursive: true, force: true })
  offlineActive = false
  offlineSince = null
  reachCache = { at: 0, ok: false }
  runBackup()   // refresh the base so it matches the share we just wrote
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
const ENV_BAK = path.resolve('.env.bak')         // last content of .env that had keys
const ENV_CLEARED = path.resolve('.env.cleared') // the user emptied it ON PURPOSE: never heal over that

const readEnvFile = (file) => {
  if (!fs.existsSync(file)) return {}
  const providers = { ANTHROPIC: 'anthropic', OPENAI: 'openai', GEMINI: 'gemini', GROK: 'grok' }
  const keys = {}
  for (const line of fs.readFileSync(file, 'utf-8').split('\n')) {
    const match = line.match(/^VITE_(\w+)_API_KEY=(.*)$/)
    if (match && providers[match[1]]) keys[providers[match[1]]] = match[2].trim()
  }
  return keys
}
const hasKeys = (keys) => Object.values(keys).some((v) => v)

// Keep .env.bak as the most recent content that HELD keys. Mirroring on READ
// (not only on write) means the safety copy exists from the first time the app
// asks for the keys, instead of waiting for the user to change something.
function mirrorEnv() {
  try {
    const a = fs.readFileSync(ENV_FILE, 'utf-8')
    if (!fs.existsSync(ENV_BAK) || fs.readFileSync(ENV_BAK, 'utf-8') !== a) fs.writeFileSync(ENV_BAK, a, 'utf-8')
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
    return readEnvFile(ENV_FILE)
  } catch { return backup }
}

function writeEnv(keys) {
  const providers = { anthropic: 'ANTHROPIC', openai: 'OPENAI', gemini: 'GEMINI', grok: 'GROK' }
  // REFUSE a write that would erase every stored key while sending none. That is
  // not something a user does, only something a BROKEN CLIENT does: the app posts
  // its WHOLE key set on change, so a page that failed to read /api/keys (server
  // restarting, request dropped) holds {} and writes that emptiness straight back,
  // silently deleting the key. Clearing a key from the UI still works - it posts
  // that provider with an empty value, so the object itself is not empty.
  if (Object.keys(keys).length === 0 && hasKeys(parseEnv())) {
    console.log('[Keys] refused an empty write that would have erased the stored API keys')
    return { ok: false, refused: true }
  }
  let existing = []
  if (fs.existsSync(ENV_FILE)) {
    existing = fs.readFileSync(ENV_FILE, 'utf-8').split('\n')
      .filter((l) => !l.match(/^VITE_\w+_API_KEY=/))
      .filter((l) => l.trim() !== '')
  }
  const keyLines = Object.entries(keys)
    .filter(([, v]) => v)
    .map(([k, v]) => `VITE_${providers[k] || k.toUpperCase()}_API_KEY=${v}`)
  const content = [...existing, ...keyLines].join('\n') + '\n'
  fs.writeFileSync(ENV_FILE, content, 'utf-8')
  // Mirror only when the write STORED keys. A write that clears them leaves the
  // previous snapshot alone - that is precisely the version worth keeping.
  if (keyLines.length) mirrorEnv()
  // Record INTENT so the self-heal in parseEnv can tell an empty .env that the
  // user asked for (they cleared the field, so that provider arrives NAMED with
  // an empty value) from one that lost its keys some other way.
  try {
    if (keyLines.length) fs.rmSync(ENV_CLEARED, { force: true })
    else if (Object.keys(keys).length) fs.writeFileSync(ENV_CLEARED, new Date().toISOString() + '\n', 'utf-8')
  } catch { /* best effort */ }
  return { ok: true }
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
function syncSharedKeys(opts) {
  const authoritative = !!(opts && opts.authoritative)
  if (DATA_DIR === APP_ROOT) return { skipped: 'no share' }
  if (!shareReachable()) return { skipped: 'unreachable' }
  const file = path.join(DATA_DIR, 'keys.json')
  try {
    const local = readEnvFile(ENV_FILE)
    let shared = {}
    try { shared = JSON.parse(fs.readFileSync(file, 'utf-8')) || {} } catch { shared = {} }

    // Pull down: only providers this computer has nothing for.
    const merged = { ...local }
    const pulled = []
    for (const [prov, val] of Object.entries(shared)) {
      if (val && typeof val === 'string' && !merged[prov]) { merged[prov] = val; pulled.push(prov) }
    }
    if (pulled.length) {
      writeEnv(merged)
      // Adopting a key from the share is a deliberate new key, so the
      // "cleared on purpose" marker no longer applies.
      try { fs.rmSync(ENV_CLEARED, { force: true }) } catch { /* best effort */ }
      console.log('[Keys] adopted from the shared folder:', pulled.join(', '))
    }

    // Push up: only providers the share has nothing for.
    const out = { ...shared }
    const pushed = []
    for (const [prov, val] of Object.entries(merged)) {
      if (val && (!out[prov] || (authoritative && out[prov] !== val))) { out[prov] = val; pushed.push(prov) }
    }
    if (pushed.length) {
      fs.writeFileSync(file, JSON.stringify(out, null, 2) + '\n', 'utf-8')
      console.log('[Keys] saved to the shared folder:', pushed.join(', '))
    }
    return { pulled, pushed }
  } catch (e) {
    console.log('[Keys] shared-key sync skipped:', e.message)
    return { error: e.message }
  }
}

function readConfig() {
  try {
    return fs.existsSync(dataPath('config.json')) ? JSON.parse(fs.readFileSync(dataPath('config.json'), 'utf-8')) : {}
  } catch { return {} }
}

function writeConfig(data) {
  const existing = readConfig()
  const merged = { ...existing, ...data }
  fs.writeFileSync(dataPath('config.json'), JSON.stringify(merged, null, 2) + '\n', 'utf-8')
}

function apiPlugin() {
  return {
    name: 'api-plugin',
    configureServer(server) {
      // Auto-backup timer: mirror the shared data folder to this computer every
      // 10 minutes (and once ~20s after start). Unref'd so it never holds the
      // process open; cleared when the dev server closes.
      const backupTimer = setInterval(() => { runBackup(); syncSharedKeys() }, 10 * 60 * 1000)
      if (backupTimer.unref) backupTimer.unref()
      // Unref'd like the interval above: this hook also runs under vitest, where a
      // live 20s handle kept the test process from exiting ("something prevents
      // Vite server from exiting") and would mask a real hang from the timer below.
      const firstBackup = setTimeout(() => { runBackup(); syncSharedKeys() }, 20000)
      if (firstBackup.unref) firstBackup.unref()
      server.httpServer?.once('close', () => clearInterval(backupTimer))

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
          if (process.platform === 'win32') spawn('taskkill', ['/F', '/T', '/PID', String(toastGuard.pid)], { shell: true })
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
          res.end(JSON.stringify({ autoExit: process.env.EBIKI_AUTO_EXIT === '1', lastBeatAgoMs: lastBeat ? Date.now() - lastBeat : null }))
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
              if (process.platform === 'win32') spawn('taskkill', ['/F', '/T', '/PID', String(overlayProcess.pid)], { shell: true })
              else overlayProcess.kill()
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
        const lifeTimer = setInterval(() => {
          const now = Date.now()
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
      server.middlewares.use('/api/sync-backup', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        if (req.method === 'POST') { const r = runBackup(); res.end(JSON.stringify({ ...r, ...lastBackup, dir: BACKUP_DIR, enabled: DATA_DIR !== APP_ROOT })) }
        else { res.end(JSON.stringify({ enabled: DATA_DIR !== APP_ROOT, dir: BACKUP_DIR, ...lastBackup })) }
      })

      // Offline mode status + reconcile. GET reports whether we're running from
      // the local copy, or whether offline edits are waiting for a share that is
      // back up. POST reconciles them into the share (or discards them) — the
      // share is still only ever written by an explicit user action, exactly like
      // the join/return merge.
      server.middlewares.use('/api/offline', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        if (req.method === 'GET') { dataMode(); res.end(JSON.stringify(offlineStatus())); return }
        if (req.method !== 'POST') { res.statusCode = 405; res.end(''); return }
        let body = ''
        req.on('data', (c) => { body += c })
        req.on('end', () => {
          try {
            const discard = !!JSON.parse(body || '{}').discard
            if (!fs.existsSync(OFFLINE_META)) { res.end(JSON.stringify({ ok: true, nothing: true })); return }
            if (discard) {
              fs.rmSync(OFFLINE_DIR, { recursive: true, force: true })
              offlineActive = false; offlineSince = null
              res.end(JSON.stringify({ ok: true, discarded: true }))
              return
            }
            if (!shareReachable()) { res.statusCode = 409; res.end(JSON.stringify({ error: 'The shared folder is still unreachable.' })); return }
            res.end(JSON.stringify(reconcileOffline()))
          } catch (e) { res.statusCode = 400; res.end(JSON.stringify({ error: e.message })) }
        })
      })

      // ── App update (git) ────────────────────────────────────────────────
      // GET  → is a newer version on the remote? (fast: local HEAD vs the remote
      //        branch head via `git ls-remote`, no object download). reachable:
      //        false when git is missing or the network is down.
      // POST → git pull --ff-only, then npm install; report restartRequired.
      // All git runs in APP_ROOT (wherever the app was installed), never a fixed
      // path. `available:false` also covers "git not installed" so the UI degrades.
      const git = (args, cb, timeout = 15000) => execFile('git', args, { cwd: APP_ROOT, timeout, windowsHide: true }, cb)
      server.middlewares.use('/api/update', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        // 'master' is the release branch we publish to; compare against it
        // regardless of which local branch this clone happens to sit on.
        if (req.method === 'GET') {
          git(['rev-parse', 'HEAD'], (e1, local) => {
            if (e1) { res.end(JSON.stringify({ ok: true, gitAvailable: false })); return }
            git(['ls-remote', 'origin', 'master'], (e3, remoteOut) => {
              if (e3) { res.end(JSON.stringify({ ok: true, gitAvailable: true, reachable: false })); return }
              const localSha = (local || '').trim()
              const remoteSha = ((remoteOut || '').trim().split(/\s+/)[0]) || ''
              res.end(JSON.stringify({ ok: true, gitAvailable: true, reachable: true, updateAvailable: !!remoteSha && remoteSha !== localSha, current: localSha.slice(0, 7), remote: remoteSha.slice(0, 7) }))
            }, 12000)
          })
        } else if (req.method === 'POST') {
          git(['pull', '--ff-only', 'origin', 'master'], (e, out, err) => {
            if (e) { res.end(JSON.stringify({ ok: false, error: String(err || e.message || 'git pull failed').slice(0, 600) })); return }
            // Dependencies may have changed - run npm install (fast if nothing did).
            execFile(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install', '--no-audit', '--no-fund'], { cwd: APP_ROOT, timeout: 300000, windowsHide: true }, () => {
              res.end(JSON.stringify({ ok: true, updated: true, restartRequired: true, output: String(out || '').slice(0, 600) }))
            })
          }, 120000)
        } else { res.statusCode = 405; res.end('') }
      })

      // API keys endpoint
      server.middlewares.use('/api/keys', (req, res) => {
        if (req.method === 'GET') {
          syncSharedKeys()   // a page load is the moment a blank machine should adopt the shared key
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(parseEnv()))
        } else if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => { body += chunk })
          req.on('end', () => {
            try {
              const r = writeEnv(JSON.parse(body))
              // ?source=user marks a key the person actually typed (see setCurrentKey);
              // that one is allowed to replace the shared copy, a background save is not.
              syncSharedKeys({ authoritative: /[?&]source=user/.test(req.originalUrl || req.url || '') })
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true, ...r }))
            } catch {
              res.statusCode = 400
              res.end('{"error":"invalid json"}')
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
                ankiRes.on('data', (chunk) => { data += chunk })
                ankiRes.on('end', () => {
                  console.log('[Anki proxy] response:', data.substring(0, 200))
                  res.setHeader('Content-Type', 'application/json')
                  res.end(data)
                })
              }
            )
            ankiReq.on('error', (err) => {
              console.log('[Anki proxy] error:', err.message)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Anki is not running or AnkiConnect is not installed' }))
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
      // /api/keys, /api/log, /api/anki, /api/update, /api/web-search, /api/tts.
      const DATA_ROUTES = ['/config', '/ankiformat', '/modes', '/knowledge-sections', '/deck-progress', '/discover-store', '/chats', '/chat-load']
      server.middlewares.use('/api', (req, res, next) => {
        const p = (req.url || '').split('?')[0].replace(/\/+$/, '') || '/'
        if (!DATA_ROUTES.some((r) => p === r || p.startsWith(r + '/'))) return next()
        const mode = dataMode()
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
              fs.writeFileSync(dataPath('ankiformat.json'), bodyStr, 'utf-8')
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
            if (fs.existsSync(cacheFile)) {
              res.setHeader('Content-Type', 'audio/mpeg')
              res.end(fs.readFileSync(cacheFile))
              return
            }
            const r = await fetch(`${ttsUrl}/v1/audio/speech`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: 'kokoro', input, voice, response_format: 'mp3' }),
            })
            if (!r.ok) { res.statusCode = 502; res.end('tts server error ' + r.status); return }
            const buf = Buffer.from(await r.arrayBuffer())
            try { fs.mkdirSync(cacheDir, { recursive: true }); fs.writeFileSync(cacheFile, buf) } catch { /* cache is best-effort */ }
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
          .map((f) => ({ name: f, text: fs.readFileSync(path.join(knowledgeDir, f), 'utf-8') }))
      }
      const detectHeadings = (file) => {
        const out = []
        const lines = file.text.split('\n')
        let off = 0
        for (const line of lines) {
          const t = line.trim()
          let m
          if ((m = t.match(/^(#{1,6})\s+(.{2,120})$/))) {
            out.push({ file: file.name, title: m[2].trim(), level: m[1].length, start: off })
          } else if (t.match(/^(chapter|module|unit|part|section|lesson|domain|appendix)\s+\d+\b.{0,100}$/i)) {
            out.push({ file: file.name, title: t.slice(0, 120), level: 1, start: off })
          } else if (t.length <= 110 && t.match(/^\d+(\.\d+){0,3}[.)]?\s+[A-Za-z].{2,100}$/)) {
            const num = t.match(/^(\d+(?:\.\d+)*)/)
            out.push({ file: file.name, title: t.slice(0, 120), level: Math.min(4, num[1].split('.').length), start: off })
          }
          off += line.length + 1
        }
        return out
      }
      const extractOutline = (files) => {
        const tocFiles = files.filter((f) => TOC_NAME_RE.test(f.name))
        const contentFiles = files.filter((f) => !TOC_NAME_RE.test(f.name))
        let outline = []
        if (tocFiles.length && contentFiles.length) {
          const titles = tocFiles.flatMap((f) => f.text.split('\n'))
            .map((l) => l.trim()
              .replace(/\.{3,}\s*\d+$/, '')   // dotted leaders + page number ("Title .... 123")
              .replace(/\s+\d+$/, '')          // bare trailing page number
              .replace(/^[-*•>\s]+/, '')       // list bullets
              .trim())
            .filter((t) => t.length >= 3 && t.length <= 120)
          for (const title of titles) {
            const num = title.match(/^(\d+(?:\.\d+)*)/)
            const level = num ? Math.min(4, num[1].split('.').length) : 1
            // Locate the title in the content files (case-insensitive; also try without numbering).
            const needles = [title, title.replace(/^\d+(?:\.\d+)*[.)]?\s*/, '')].filter((n) => n.length >= 3)
            let found = null
            for (const f of contentFiles) {
              const hay = f.text.toLowerCase()
              for (const n of needles) {
                const idx = hay.indexOf(n.toLowerCase())
                if (idx !== -1) { found = { file: f.name, title, level, start: idx }; break }
              }
              if (found) break
            }
            if (found) outline.push(found)
          }
          outline.sort((a, b) => (a.file === b.file ? a.start - b.start : a.file.localeCompare(b.file)))
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
          const modeName = (url.searchParams.get('mode') || '').replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, ' ').trim()
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
        const sanitized = (modeName || '').replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, ' ').trim()
        const knowledgeDir = dataPath('modes', sanitized, 'knowledge')

        if (!sanitized) { res.end(JSON.stringify({ files: [], content: null, fileCount: 0 })); return }

        if (req.method === 'GET') {
          try {
            if (!fs.existsSync(knowledgeDir)) { res.end(JSON.stringify({ files: [], content: null, fileCount: 0 })); return }
            const allFiles = fs.readdirSync(knowledgeDir)
            const files = allFiles.filter(f => f.match(/\.(txt|md)(\.disabled)?$/i)).map(f => {
              const disabled = f.endsWith('.disabled')
              const name = disabled ? f.replace(/\.disabled$/, '') : f
              const size = fs.statSync(path.join(knowledgeDir, f)).size
              return { name, disabled, size }
            })
            const enabledFiles = allFiles.filter(f => f.match(/\.(txt|md)$/i))
            const content = enabledFiles.map(f => {
              const text = fs.readFileSync(path.join(knowledgeDir, f), 'utf-8')
              return `--- ${f} ---\n${text}`
            }).join('\n\n')
            // Outline (capped) so the client can offer TOC-guided section retrieval for big KBs.
            const outline = extractOutline(readKnowledgeFiles(knowledgeDir)).slice(0, 400)
              .map(({ file, title, level }) => ({ file, title, level }))
            res.end(JSON.stringify({ files, content: content || null, fileCount: enabledFiles.length, outline }))
          } catch { res.end(JSON.stringify({ files: [], content: null, fileCount: 0, outline: [] })) }
        } else if (req.method === 'POST') {
          const handleBody = (bodyStr) => {
            try {
              if (!fs.existsSync(knowledgeDir)) fs.mkdirSync(knowledgeDir, { recursive: true })
              const { filename, content } = JSON.parse(bodyStr)
              const safeName = (filename || 'file.txt').replace(/[<>:"/\\|?*]/g, '')
              fs.writeFileSync(path.join(knowledgeDir, safeName), content, 'utf-8')
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
            const filePath = path.join(knowledgeDir, safeName)
            const disabledPath = filePath + '.disabled'
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

        // Sanitize mode name for folder: remove invalid chars, trim, fallback to id
        const sanitizeName = (name, id) => {
          const clean = (name || '').replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, ' ').trim()
          return clean || `mode-${id}`
        }

        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          try {
            const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf-8')) : {}

            // Migrate legacy numbered folders/files
            const entries = fs.readdirSync(MODES_DIR)
            for (const entry of entries) {
              const full = path.join(MODES_DIR, entry)
              // Legacy flat file: 1.json → read, create named folder
              if (entry.match(/^\d+\.json$/)) {
                try {
                  const mode = JSON.parse(fs.readFileSync(full, 'utf-8'))
                  const folderName = sanitizeName(mode.name, mode.id)
                  const newDir = path.join(MODES_DIR, folderName)
                  if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true })
                  fs.writeFileSync(path.join(newDir, 'config.json'), JSON.stringify(mode, null, 2), 'utf-8')
                  fs.unlinkSync(full)
                } catch {}
              }
              // Legacy numbered folder: 1/ → read config, rename to named folder
              if (entry.match(/^\d+$/) && fs.statSync(full).isDirectory()) {
                const cfgFile = path.join(full, 'config.json')
                if (fs.existsSync(cfgFile)) {
                  try {
                    const mode = JSON.parse(fs.readFileSync(cfgFile, 'utf-8'))
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
            const allDirs = fs.readdirSync(MODES_DIR).filter((d) => {
              const full = path.join(MODES_DIR, d)
              return d !== '_meta.json' && d !== 'Default' && fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, 'config.json'))
            })
            const modes = allDirs.map((d) => {
              try { return JSON.parse(fs.readFileSync(path.join(MODES_DIR, d, 'config.json'), 'utf-8')) } catch { return null }
            }).filter(Boolean)
            res.end(JSON.stringify({ modes, activeModeId: meta.activeModeId || (modes[0]?.id) || 1 }))
          } catch { res.end('{"modes":[],"activeModeId":1}') }
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
              if (data.modes) {
                // Track which folders should exist
                const activeFolders = new Set(['_meta.json'])
                for (const mode of data.modes) {
                  const folderName = sanitizeName(mode.name, mode.id)
                  activeFolders.add(folderName)
                  const dir = path.join(MODES_DIR, folderName)
                  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
                  fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify(mode, null, 2), 'utf-8')
                }
                // Remove folders for deleted/renamed modes
                fs.readdirSync(MODES_DIR).forEach((d) => {
                  const full = path.join(MODES_DIR, d)
                  if (d !== 'Default' && fs.statSync(full).isDirectory() && !activeFolders.has(d)) {
                    fs.rmSync(full, { recursive: true, force: true })
                  }
                })
                // Save meta
                fs.writeFileSync(metaFile, JSON.stringify({ activeModeId: data.activeModeId }), 'utf-8')
              }
              res.setHeader('Content-Type', 'application/json')
              res.end('{"ok":true}')
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
            fs.writeFileSync(LAUNCH_MODE_POINTER, JSON.stringify({ mode }, null, 2), 'utf-8')
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
              try {
                if (mode === 'browser') {
                  const url = 'http://localhost:3000?handoff=1'
                  if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref()
                  else if (process.platform === 'darwin') spawn('open', [url], { detached: true, stdio: 'ignore' }).unref()
                  else spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref()
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
                  if (exe) spawn(exe, [mainScript, '--from-launcher'], { cwd: APP_ROOT, detached: true, stdio: 'ignore' }).unref()
                  else {
                    const cli = path.resolve('node_modules/electron/cli.js')
                    if (!fs.existsSync(cli)) throw new Error('Electron is not installed')
                    spawn(process.execPath, [cli, mainScript, '--from-launcher'], { cwd: APP_ROOT, detached: true, stdio: 'ignore' }).unref()
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

      server.middlewares.use('/api/launch-overlay', (req, res) => {
        console.log('[Overlay API] request:', req.method, req.url)
        if (req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json')
          if (overlayProcess && !overlayProcess.killed) {
            console.log('[Overlay API] already running')
            res.end(JSON.stringify({ ok: true, status: 'already running' }))
            return
          }
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
            overlayProcess = spawn(process.execPath, [electronCli, mainScript, '--overlay'], {
              stdio: 'inherit', detached: false,
            })
            overlayProcess.on('exit', (code) => { console.log('[Overlay API] process exited, code:', code); overlayProcess = null })
            overlayProcess.on('error', (err) => { console.error('[Overlay API] process error:', err.message); overlayProcess = null })
            console.log('[Overlay API] Electron process launched, pid:', overlayProcess.pid)
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
            const check = spawn('tasklist', ['/FI', 'IMAGENAME eq electron.exe', '/NH'], { shell: true })
            let output = ''
            check.stdout.on('data', d => output += d)
            check.on('close', () => {
              const running = output.includes('electron.exe')
              res.end(JSON.stringify({ running }))
            })
          } else {
            res.end(JSON.stringify({ running: false }))
          }
        } else if (req.method === 'DELETE') {
          res.setHeader('Content-Type', 'application/json')
          console.log('[Overlay API] stopping all electron processes')
          try {
            if (overlayProcess) {
              overlayProcess.kill()
              overlayProcess = null
            }
            // Force kill ALL electron processes on Windows
            if (process.platform === 'win32') {
              spawn('taskkill', ['/F', '/IM', 'electron.exe'], { shell: true })
            }
          } catch (e) { console.error('[Overlay API] kill error:', e.message) }
          overlayProcess = null
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
        const file = path.resolve('electron/last-capture.png')
        if (fs.existsSync(file)) {
          res.setHeader('Content-Type', 'image/png')
          res.end(fs.readFileSync(file))
        } else {
          res.statusCode = 404
          res.end('')
        }
      })

      // Ensure directory endpoint
      server.middlewares.use('/api/ensure-dir', (req, res) => {
        if (req.method === 'POST') {
          const handleBody = (bodyStr) => {
            try {
              const { dir } = JSON.parse(bodyStr)
              const full = path.resolve(DATA_DIR, dir)
              if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true })
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true, path: full }))
            } catch (e) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: e.message }))
            }
          }
          if (req.body) { handleBody(typeof req.body === 'string' ? req.body : JSON.stringify(req.body)) }
          else { let b = ''; req.on('data', c => b += c); req.on('end', () => handleBody(b)) }
        } else { res.statusCode = 405; res.end('') }
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
          req.on('end', () => {
            try {
              if (envOverride) { res.statusCode = 409; res.end(JSON.stringify({ error: 'The EBIKI_DATA_DIR environment variable is set and overrides this setting. Unset it to change the data folder here.' })); return }
              const parsed = JSON.parse(body || '{}')
              const raw = String(parsed.dataDir || '').trim()
              const merge = parsed.merge   // true | false | undefined (ask)
              const next = raw ? path.resolve(raw) : APP_ROOT
              if (next === DATA_DIR) { res.end(JSON.stringify({ ok: true, unchanged: true, dataDir: DATA_DIR, isDefault: DATA_DIR === APP_ROOT, copied: [], merged: 0, restored: false })); return }
              const prev = DATA_DIR
              let copied = []; let restored = false
              const acc = { added: 0, merged: 0, keptBoth: 0 }   // deep-merge tallies

              if (next === APP_ROOT) {
                // ── RETURN to the app folder: restore THIS computer's own data ──
                if (dataEntriesPresent(LOCAL_HOME)) {
                  // Before restoring, offer to also pull down anything the share
                  // gained that this computer's stash doesn't have.
                  if (prev !== APP_ROOT && merge === undefined) {
                    const sourceOnly = sourceOnlySummary(prev, LOCAL_HOME)
                    if (sourceOnly.has) { res.end(JSON.stringify({ needsChoice: true, context: 'return', dataDir: next, sourceOnly })); return }
                  }
                  moveDataEntries(LOCAL_HOME, APP_ROOT)   // restore home (parks any stray app-folder data)
                  restored = true
                  if (merge === true && prev !== APP_ROOT) {
                    for (const entry of DATA_ENTRIES) deepMergeInto(path.join(prev, entry), path.join(APP_ROOT, entry), 'the shared folder', acc)
                  }
                } else {
                  // No stash (this machine only ever used a share): copy it down.
                  for (const entry of DATA_ENTRIES) {
                    const from = path.join(prev, entry)
                    if (fs.existsSync(from) && !fs.existsSync(path.join(APP_ROOT, entry))) { fs.cpSync(from, path.join(APP_ROOT, entry), { recursive: true }); copied.push(entry) }
                  }
                }
                if (fs.existsSync(DATA_DIR_POINTER)) fs.unlinkSync(DATA_DIR_POINTER)
              } else {
                // ── JOIN a shared folder (from the app folder or another share) ──
                if (merge === undefined && DATA_ENTRIES.some((e) => fs.existsSync(path.join(next, e)))) {
                  const sourceOnly = sourceOnlySummary(prev, next)
                  if (sourceOnly.has) { res.end(JSON.stringify({ needsChoice: true, context: 'join', dataDir: next, sourceOnly })); return }
                }
                fs.mkdirSync(next, { recursive: true })
                for (const entry of DATA_ENTRIES) {
                  const from = path.join(prev, entry)
                  const to = path.join(next, entry)
                  if (!fs.existsSync(from)) continue
                  if (merge === true) deepMergeInto(from, to, 'this computer', acc)   // true deep merge (nothing dropped)
                  else if (!fs.existsSync(to)) { fs.cpSync(from, to, { recursive: true }); copied.push(entry) }
                }
                // Coming FROM the app folder: stash this computer's own data so a
                // later return restores it instead of the shared data.
                if (prev === APP_ROOT) moveDataEntries(APP_ROOT, LOCAL_HOME)
                fs.writeFileSync(DATA_DIR_POINTER, JSON.stringify({ dataDir: next }, null, 2) + '\n', 'utf-8')
              }
              DATA_DIR = next
              const merged = acc.added + acc.merged   // items brought in or combined
              const keptBoth = acc.keptBoth           // conflicting files kept as a second copy
              console.log('[Data dir] switched to', next, restored ? "(restored this computer's data)" : '', merge === true ? `(added ${acc.added}, combined ${acc.merged}, kept-both ${acc.keptBoth})` : copied.length ? `(copied: ${copied.join(', ')})` : '')
              res.end(JSON.stringify({ ok: true, dataDir: next, isDefault: next === APP_ROOT, copied, merged, keptBoth, restored }))
            } catch (e) { res.statusCode = 400; res.end(JSON.stringify({ error: e.message })) }
          })
        } else { res.statusCode = 405; res.end('') }
      })

      // Config endpoint
      server.middlewares.use('/api/config', (req, res) => {
        // Unreachable-source handling lives in the shared data-route guard above
        // (503 when there is nothing to serve, .local-offline when there is), so
        // an empty read can never reach here and clobber the real file.
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(readConfig()))
        } else if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => { body += chunk })
          req.on('end', () => {
            try {
              writeConfig(JSON.parse(body))
              res.setHeader('Content-Type', 'application/json')
              res.end('{"ok":true}')
            } catch {
              res.statusCode = 400
              res.end('{"error":"invalid json"}')
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
          const file = dataPath('decks', deck, 'progress-observations.md')
          res.setHeader('Content-Type', 'application/json')
          if (fs.existsSync(file)) {
            res.end(JSON.stringify({ content: fs.readFileSync(file, 'utf8') }))
          } else {
            res.end(JSON.stringify({ content: '' }))
          }
        } else if (req.method === 'POST') {
          let body = ''
          req.on('data', c => body += c)
          req.on('end', () => {
            try {
              const { deck, content } = JSON.parse(body)
              const dir = dataPath('decks', deck)
              if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
              fs.writeFileSync(path.join(dir, 'progress-observations.md'), content, 'utf8')
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
          if (fs.existsSync(file)) res.end(JSON.stringify({ content: fs.readFileSync(file, 'utf8') }))
          else res.end(JSON.stringify({ content: '' }))
        } else if (req.method === 'POST') {
          let body = ''
          req.on('data', c => body += c)
          req.on('end', () => {
            try {
              const { content } = JSON.parse(body)
              const dir = dataPath('discover')
              if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
              fs.writeFileSync(file, content, 'utf8')
              res.end(JSON.stringify({ ok: true }))
            } catch (e) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: e.message }))
            }
          })
        } else { res.statusCode = 405; res.end('') }
      })

      // Chat sessions — saved to chats/ folder
      server.middlewares.use('/api/chats', (req, res) => {
        const chatsDir = dataPath('chats')
        try { if (!fs.existsSync(chatsDir)) fs.mkdirSync(chatsDir, { recursive: true }) } catch { /* see the offline-share guard */ }

        if (req.method === 'GET') {
          // List all chat sessions
          try {
            const files = fs.readdirSync(chatsDir).filter(f => f.endsWith('.json')).sort((a, b) => {
              return fs.statSync(path.join(chatsDir, b)).mtimeMs - fs.statSync(path.join(chatsDir, a)).mtimeMs
            })
            const sessions = files.map(f => {
              try {
                const data = JSON.parse(fs.readFileSync(path.join(chatsDir, f), 'utf8'))
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
              const { id, title, messages, type, mode } = JSON.parse(body)
              const chatId = id || Date.now().toString()
              const file = path.join(chatsDir, `${chatId}.json`)
              fs.writeFileSync(file, JSON.stringify({ title, messages, date: new Date().toISOString(), ...(type ? { type } : {}), ...(mode ? { mode } : {}) }, null, 2), 'utf8')
              console.log('[Chat] saved:', chatId, '-', title)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ id: chatId, ok: true }))
            } catch (e) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: e.message }))
            }
          })
        } else if (req.method === 'DELETE') {
          const url = new URL(req.url, 'http://localhost')
          const id = url.searchParams.get('id')
          if (!id) { res.statusCode = 400; res.end(JSON.stringify({ error: 'id required' })); return }
          const file = path.join(chatsDir, `${id}.json`)
          if (fs.existsSync(file)) fs.unlinkSync(file)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: true }))
        } else { res.statusCode = 405; res.end('') }
      })

      // Load a single chat session
      server.middlewares.use('/api/chat-load', (req, res) => {
        const url = new URL(req.url, 'http://localhost')
        const id = url.searchParams.get('id')
        if (!id) { res.statusCode = 400; res.end(JSON.stringify({ error: 'id required' })); return }
        const file = dataPath('chats', `${id}.json`)
        res.setHeader('Content-Type', 'application/json')
        if (fs.existsSync(file)) {
          res.end(fs.readFileSync(file, 'utf8'))
        } else {
          res.statusCode = 404
          res.end(JSON.stringify({ error: 'not found' }))
        }
      })

      // Web search proxy — uses DuckDuckGo HTML lite
      server.middlewares.use('/api/web-search', async (req, res) => {
        const url = new URL(req.url, 'http://localhost')
        const query = url.searchParams.get('q')
        if (!query) { res.statusCode = 400; res.end(JSON.stringify({ error: 'q required' })); return }
        res.setHeader('Content-Type', 'application/json')
        try {
          const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
          const resp = await fetch(ddgUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
          })
          const html = await resp.text()
          // Parse results from DuckDuckGo HTML
          const results = []
          const resultBlocks = html.split('result__body"')
          for (let i = 1; i < resultBlocks.length && results.length < 5; i++) {
            const block = resultBlocks[i]
            const titleMatch = block.match(/class="result__a"[^>]*>(.*?)<\/a>/s)
            const snippetMatch = block.match(/class="result__snippet"[^>]*>(.*?)<\/a>/s) || block.match(/class="result__snippet"[^>]*>(.*?)<\/td>/s)
            const urlMatch = block.match(/class="result__url"[^>]*>(.*?)<\/a>/s)
            if (titleMatch) {
              results.push({
                title: titleMatch[1].replace(/<[^>]+>/g, '').trim(),
                snippet: snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, '').trim() : '',
                url: urlMatch ? urlMatch[1].replace(/<[^>]+>/g, '').trim() : '',
              })
            }
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
    watch: {
      // Native fs.watch fails on this drive (network/mapped volume) — poll instead
      usePolling: true,
      interval: 300,
      // vite.config.js must be ignored too: on this share the watcher fires a
      // phantom change event on it after every restart → infinite restart loop.
      // Config edits therefore require a manual dev-server restart.
      ignored: ['**/.env', '**/config.json', '**/ankiformat.json', '**/vite.config.js', '**/datadir.json', '**/.app-ready', '**/modes/**', '**/decks/**', '**/chats/**', '**/local-data-backup-*/**', '**/.local-sync/**', '**/.local-home/**', '**/.local-offline/**'],
    },
  },
})
