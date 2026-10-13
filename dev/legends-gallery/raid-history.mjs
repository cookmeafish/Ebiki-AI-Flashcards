// Writes the VERSION PICKER's files (src/features/legends/raidHistory.js): every distinct version of each raid boss
// drawing in git history to dev/raid-history/<motif>/<sha>.svg (via `git show`, never the working tree; read-only on
// git), plus the rejected 2026-10-11 redesigns from .scratch/restore-1011/now/raids/, and manifest.json
// (motif -> [{ id, date, subject, source }], newest first). Skipped: a content already listed (a newer commit with the
// same drawing), a version equal to the live file (that is "Now"), and a file failing the safe-SVG check (named).
// Run again after any art change:  node dev/legends-gallery/raid-history.mjs
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { RAID_HISTORY_DIR, REJECTED_ID, REJECTED_DIR, unsafeSvg } from '../../src/features/legends/raidHistory.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const git = (...args) => execFileSync('git', args, { cwd: ROOT, maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'pipe'] })
const hash = (buf) => crypto.createHash('sha1').update(buf).digest('hex')
const OUT = path.join(ROOT, RAID_HISTORY_DIR)
const RAIDS = path.join(ROOT, 'public/assets/legends/raids')

fs.rmSync(OUT, { recursive: true, force: true }) // only our own generated folder
const manifest = {}
let files = 0
const skipped = []
for (const name of fs.readdirSync(RAIDS).filter((f) => f.endsWith('.svg')).sort()) {
  const motif = name.slice(0, -4)
  const rel = `public/assets/legends/raids/${name}`
  const seen = new Set([hash(fs.readFileSync(path.join(RAIDS, name)))]) // the live file is "Now"
  const list = []
  const add = (id, buf, entry) => {
    const h = hash(buf)
    if (seen.has(h)) return
    seen.add(h)
    const bad = unsafeSvg(buf.toString('utf8'))
    if (bad) { skipped.push(`${motif} ${id}: ${bad}`); return }
    fs.mkdirSync(path.join(OUT, motif), { recursive: true })
    fs.writeFileSync(path.join(OUT, motif, `${id}.svg`), buf)
    list.push({ id, ...entry })
    files++
  }
  const rejected = path.join(ROOT, REJECTED_DIR, 'raids', name)
  const commits = git('log', '--format=%h|%ad|%s', '--date=format:%Y-%m-%d', '--', rel).toString().trim().split('\n').filter(Boolean)
  // the rejected redesigns are newer than every commit: listed first
  if (fs.existsSync(rejected)) add(REJECTED_ID, fs.readFileSync(rejected), { date: '2026-10-11', subject: 'the 2026-10-11 version, before all bosses were restored', source: 'rejected' })
  for (const line of commits) {
    const [sha, date, ...subject] = line.split('|')
    let buf
    try { buf = git('show', `${sha}:${rel}`) } catch { continue } // the commit deleted it
    add(sha, buf, { date, subject: subject.join('|'), source: 'git' })
  }
  manifest[motif] = list
}
fs.mkdirSync(OUT, { recursive: true })
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1))
console.log(`${files} versions of ${Object.keys(manifest).length} bosses in ${RAID_HISTORY_DIR}/`)
for (const [m, l] of Object.entries(manifest)) console.log(`  ${m.padEnd(11)} ${l.length}`)
if (skipped.length) console.log(`skipped as unsafe:\n  ${skipped.join('\n  ')}`)
