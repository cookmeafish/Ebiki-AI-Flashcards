// Puts ONE raid boss back to a version from the asset view's version picker (src/features/legends/raidHistory.js):
// its drawing and, when that version had them, its fight files (fx, impact style, impact parts).
//   node dev/legends-gallery/restore-version.mjs <motif> <sha | rejected-2026-10-11> [--dry-run]
// Commits are read with `git show` (read-only on git: no checkout, stash or reset); the rejected redesigns come from
// .scratch/restore-1011/now/. Prints every file it writes. A file the version did not have is left alone and named.
// impact/body.js and art.jsx are shared by every boss: only reported, never written.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SHARED_FILES, restoreArgs } from '../../src/features/legends/raidHistory.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const git = (...args) => execFileSync('git', args, { cwd: ROOT, maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'pipe'] })
const read = (step) => {
  try { return step.git ? git('show', `${step.git}:${step.to}`) : fs.readFileSync(path.join(ROOT, step.file)) } catch { return null }
}

const args = restoreArgs(process.argv.slice(2))
if (args.error) { console.error(args.error); process.exit(1) }
const { motif, id, dryRun, plan } = args
if (plan[0].git) { try { git('cat-file', '-e', `${id}^{commit}`) } catch { console.error(`no commit "${id}"`); process.exit(1) } }
const svg = read(plan[0])
if (!svg) { console.error(`${id} has no drawing for ${motif}; nothing written`); process.exit(1) }
console.log(`${dryRun ? '[dry run] ' : ''}Restoring ${motif} to ${id}`)
let written = 0
for (const step of plan) {
  const old = step === plan[0] ? svg : read(step)
  const abs = path.join(ROOT, step.to)
  const from = step.git ? `${step.git}:${step.to}` : step.file
  if (!old) { console.log(`  skip         ${step.to} (not in ${id}; the current file stays)`); continue }
  if (fs.existsSync(abs) && Buffer.compare(fs.readFileSync(abs), old) === 0) { console.log(`  same         ${step.to}`); continue }
  console.log(`  ${dryRun ? 'would write' : 'write      '}  ${step.to}  <- ${from} (${old.length} bytes)`)
  if (!dryRun) { fs.writeFileSync(abs, old); written++ }
}
for (const file of SHARED_FILES) {
  if (!plan[0].git) { console.log(`  shared       ${file} (other bosses live here too; check it by hand)`); continue }
  let changed = false
  try { git('diff', '--quiet', id, '--', file) } catch { changed = true }
  if (changed) console.log(`  shared       ${file} differs from ${id} (other bosses live here too; not restored, check it by hand)`)
}
if (plan[0].git) console.log(`  note: files from ${id} were written for the code of that day; today's fight code and checks may expect newer
        parts (lg-${motif}-* wrappers, impact files). Run the tests and check-art.mjs and look at a fight.`)
console.log(dryRun ? 'Nothing written (--dry-run).' : `${written} file(s) written. Next: npx vitest run, check-art.mjs, then raid-history.mjs to refresh the picker.`)
