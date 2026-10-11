// Restores ONE raid boss to its BEFORE state (src/features/legends/raidBefore.js): its drawing and fight files as they
// were at RAID_BEFORE_COMMIT, read with `git show` (read-only on git: no checkout, stash or reset).
//   node dev/legends-gallery/restore-before.mjs <motif> [--dry-run]
// Prints every file it writes. A file the boss did not have back then is left alone and named. Shared files that also
// changed (impact/body.js, art.jsx) are only reported: other bosses live in them.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { RAID_BEFORE_COMMIT, RAID_BEFORE_SHARED, restoreArgs } from '../../src/features/legends/raidBefore.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const git = (...args) => execFileSync('git', args, { cwd: ROOT, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })
const atCommit = (file) => { try { return git('show', `${RAID_BEFORE_COMMIT}:${file}`) } catch { return null } }

const args = restoreArgs(process.argv.slice(2))
if (args.error) { console.error(args.error); process.exit(1) }
const { motif, dryRun, files } = args
console.log(`${dryRun ? '[dry run] ' : ''}Restoring ${motif} to ${RAID_BEFORE_COMMIT}`)
let written = 0
for (const file of files) {
  const old = atCommit(file)
  const abs = path.join(ROOT, file)
  if (!old) { console.log(`  skip   ${file} (not in ${RAID_BEFORE_COMMIT}${fs.existsSync(abs) ? '; the current file stays' : ''})`); continue }
  const same = fs.existsSync(abs) && Buffer.compare(fs.readFileSync(abs), old) === 0
  if (same) { console.log(`  same   ${file}`); continue }
  console.log(`  ${dryRun ? 'would write' : 'write'}  ${file} (${old.length} bytes)`)
  if (!dryRun) { fs.writeFileSync(abs, old); written++ }
}
for (const file of RAID_BEFORE_SHARED) {
  let changed = false
  try { git('diff', '--quiet', RAID_BEFORE_COMMIT, '--', file) } catch { changed = true }
  if (changed) console.log(`  note   ${file} changed since ${RAID_BEFORE_COMMIT} (shared, not restored; check it by hand)`)
}
console.log(dryRun ? 'Nothing written (--dry-run).' : `${written} file(s) written. Run npx vitest run and check-art.mjs next.`)
