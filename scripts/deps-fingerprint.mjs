// Are the installed dependencies the ones this code needs?
//
// Every update path runs `npm install` after it moves the code, but code can also change WITHOUT them: a manual
// `git pull`, a branch switch, a copy synced from another computer. Then the new code runs on the old
// node_modules (a missing package breaks the server or a feature). So a successful install records a
// fingerprint of the dependency lists (`--stamp`, run by the postinstall hook, so EVERY install writes it), and
// the launchers ask `--check` before starting the server: a different fingerprint means install first.
//
// Only what decides node_modules counts: package.json's dependency sections and the lockfile's package list
// (not the app's own version, which changes every release), plus the Node ABI and platform (a Node upgrade
// needs native packages rebuilt). Being behind several updates is fine: it compares the code AS IT IS NOW.
//
//   node scripts/deps-fingerprint.mjs --check   exit 0 = up to date, 1 = install needed, 2 = cannot tell
//   node scripts/deps-fingerprint.mjs --stamp   record the current fingerprint (after a successful install)
//   node scripts/deps-fingerprint.mjs           print the fingerprint
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const STAMP_FILE = '.deps-installed' // machine-local, gitignored
const DEP_KEYS = ['dependencies', 'devDependencies', 'optionalDependencies', 'overrides']

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''))

// The fingerprint of what node_modules should hold, or null when package.json can't be read.
export function fingerprint(app = APP) {
  let pkg
  try { pkg = readJson(path.join(app, 'package.json')) } catch { return null }
  const deps = Object.fromEntries(DEP_KEYS.map((k) => [k, pkg[k] || null]))
  let lock = null
  try {
    const l = readJson(path.join(app, 'package-lock.json'))
    const pkgs = { ...(l.packages || {}) }
    delete pkgs[''] // the app itself: its version changes every release
    lock = Object.keys(pkgs).sort().map((k) => [k, pkgs[k]?.version || '', pkgs[k]?.resolved || ''])
  } catch { lock = null }
  const env = { abi: process.versions.modules, platform: process.platform, arch: process.arch }
  return crypto.createHash('sha256').update(JSON.stringify({ deps, lock, env })).digest('hex')
}

// true = install needed (no node_modules, no stamp, or a different fingerprint); null = cannot tell.
export function needsInstall(app = APP) {
  const fp = fingerprint(app)
  if (!fp) return null
  if (!fs.existsSync(path.join(app, 'node_modules'))) return true
  let stamp = ''
  try { stamp = fs.readFileSync(path.join(app, STAMP_FILE), 'utf8').trim() } catch { return true }
  return stamp !== fp
}

export function writeStamp(app = APP) {
  const fp = fingerprint(app)
  if (fp) fs.writeFileSync(path.join(app, STAMP_FILE), `${fp}\n`)
  return fp
}

// Run as a script (not when imported by a test).
const same = (a, b) => (process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b)
// Real paths on both sides: import.meta.url is the RESOLVED path, argv[1] the typed one, so a folder reached through
// a junction or symlink never matched and --check silently said 'up to date' (the server ran on old node_modules).
const real = (p) => { try { return fs.realpathSync(p) } catch { return path.resolve(p) } }
if (process.argv[1] && same(real(process.argv[1]), real(fileURLToPath(import.meta.url)))) {
  const arg = process.argv[2]
  try {
    if (arg === '--check') { const r = needsInstall(); process.exit(r === null ? 2 : r ? 1 : 0) }
    else if (arg === '--stamp') { writeStamp() } // never fails the install it follows
    else console.log(fingerprint() || '')
  } catch (e) {
    console.error('[deps] ', e.message)
    process.exit(arg === '--check' ? 2 : 0)
  }
}
