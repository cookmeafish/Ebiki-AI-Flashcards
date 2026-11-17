// Builds a course's PRE-MADE QUESTION BANK (docs/plans/2026-11-16-exam-format-questions.md D3) and FAILS (exit 1)
// unless every question passes checks C1 to C23 (src/features/legends/exam/examChecks.js), the own-words check, the
// private forbidden phrase list, and every required review pass stamped the text exactly as it is (bank-stamp.mjs).
//
//   node dev/careers/build-bank.mjs <course-id> [--allow-short] [--preview]
//        [--src <dir>] [--package <file>] [--out <dir>] [--reviews <dir>] [--phrases <file>]
//
// Reads (dev only):  <src>/bank/<N-N>.json         the questions of objective N.N (a list in the frozen v1 shape)
//                    <src>/bank/stamps/<N-N>.json  { "<qid>": { "p1": hash, "p2": hash, "p2b": hash, ... } }
//                    <src>/knowledge/*.md          the chapters (C20), <src>/outline.md (C19, local, gitignored)
//                    dev/careers/private/forbidden-phrases.json  { phrases: [...] } (local, gitignored; optional)
// Writes:            <out>/manifest.json + <out>/q-N-N.json   (default public/careers/<id>/bank)
//                    <reviews>/bank-dN.jsonl                  (default docs/reviews)
//   --preview        writes every question, stamped or not, with its check results to
//                    dev/careers/out/bank-preview/<id>.json for the /dev/exam-preview/ page; never touches public/.
//   --allow-short    a card may ship with 6 to 10 questions instead of exactly 10.
// Defaults: --src dev/careers/sources/<id>, --package public/careers/<id>.json.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { buildBank } from './bankBuild.mjs'
import { outlineGrams, verbatimProblems, proseProblems } from './verbatim.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const argv = process.argv.slice(2)
const id = argv[0]
if (!id || id.startsWith('--')) { console.error('usage: node dev/careers/build-bank.mjs <course-id> [--allow-short] [--preview] [--src dir] [--package file] [--out dir] [--reviews dir] [--phrases file]'); process.exit(2) }
const opt = (name, dflt) => { const i = argv.indexOf(name); return i > 0 && argv[i + 1] ? path.resolve(argv[i + 1]) : dflt }
const SRC = opt('--src', path.join(ROOT, 'dev', 'careers', 'sources', id))
const PKG = opt('--package', path.join(ROOT, 'public', 'careers', `${id}.json`))
const OUT = opt('--out', path.join(ROOT, 'public', 'careers', id, 'bank'))
const REVIEWS = opt('--reviews', path.join(ROOT, 'docs', 'reviews'))
const PHRASES = opt('--phrases', path.join(ROOT, 'dev', 'careers', 'private', 'forbidden-phrases.json'))
const preview = argv.includes('--preview')
const allowShort = argv.includes('--allow-short')
const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, ''))

const pkg = readJson(PKG)
const bankDir = path.join(SRC, 'bank')
const sources = {}
const stamps = {}
for (const f of fs.existsSync(bankDir) ? fs.readdirSync(bankDir).sort() : []) {
  if (!/^\d+-\d+\.json$/.test(f)) continue
  sources[f] = readJson(path.join(bankDir, f))
  const sf = path.join(bankDir, 'stamps', f)
  stamps[f] = fs.existsSync(sf) ? readJson(sf) : {}
}
if (!Object.keys(sources).length) { console.error(`no question files in ${path.relative(ROOT, bankDir)} (expected N-N.json)`); process.exit(1) }
const kdir = path.join(SRC, 'knowledge')
const chapters = (fs.existsSync(kdir) ? fs.readdirSync(kdir) : []).filter((f) => f.endsWith('.md')).map((name) => ({ name, text: fs.readFileSync(path.join(kdir, name), 'utf8') }))

// C19: the own-words check against the outline (12-word runs and the shorter prose phrases), objective titles allowed.
const outlineFile = path.join(SRC, 'outline.md')
let findCopies = null
if (fs.existsSync(outlineFile)) {
  const outline = fs.readFileSync(outlineFile, 'utf8')
  const grams = outlineGrams(outline)
  const allowed = (pkg.areas || []).flatMap((a) => (a.sections || []).map((s) => s.title))
  findCopies = (texts) => [...verbatimProblems(texts, grams, allowed), ...proseProblems(texts, outline, allowed)]
}

// The private forbidden phrase list (never printed, never copied anywhere tracked).
let phrases = null
if (fs.existsSync(PHRASES)) {
  const p = readJson(PHRASES).phrases
  if (!Array.isArray(p) || p.some((x) => typeof x !== 'string')) { console.error(`${PHRASES}: expected { "phrases": [string] }`); process.exit(1) }
  phrases = p
} else console.log(`warning: no forbidden phrase list (${path.relative(ROOT, PHRASES).replace(/\\/g, '/')}), that check is skipped`)

const previous = { manifest: null, files: {} }
if (fs.existsSync(OUT)) for (const f of fs.readdirSync(OUT)) {
  if (f === 'manifest.json') { try { previous.manifest = readJson(path.join(OUT, f)) } catch { /* rebuilt */ } }
  else if (f.endsWith('.json')) previous.files[f] = fs.readFileSync(path.join(OUT, f), 'utf8')
}

const r = buildBank({ courseId: id, pkg, sources, stamps, chapters, findCopies, phrases, allowShort, preview, previous })
for (const w of r.warnings) console.log(`warn ${w}`)
for (const p of r.problems) console.log(p)
const count = Object.values(sources).reduce((n, l) => n + (Array.isArray(l) ? l.length : 0), 0)

if (preview) {
  const dir = path.join(ROOT, 'dev', 'careers', 'out', 'bank-preview')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, `${id}.json`), `${JSON.stringify(r.preview, null, 1)}\n`, 'utf8')
  const list = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'index.json').map((f) => f.replace(/\.json$/, ''))
  fs.writeFileSync(path.join(dir, 'index.json'), `${JSON.stringify({ courses: list })}\n`, 'utf8')
  console.log(`\npreview: dev/careers/out/bank-preview/${id}.json (${count} questions; stamps are not required in a preview)`)
  console.log(r.problems.length ? `${r.problems.length} problems` : 'no problems')
  process.exit(r.problems.length ? 1 : 0)
}
if (r.problems.length) { console.log(`\n${r.problems.length} problems: nothing written`); process.exit(1) }

fs.mkdirSync(OUT, { recursive: true })
for (const [f, text] of Object.entries(r.files)) fs.writeFileSync(path.join(OUT, f), text, 'utf8')
for (const f of fs.readdirSync(OUT)) if (/^q-\d+-\d+\.json$/.test(f) && !r.files[f]) fs.rmSync(path.join(OUT, f))
fs.writeFileSync(path.join(OUT, 'manifest.json'), `${JSON.stringify(r.manifest, null, 1)}\n`, 'utf8')
fs.mkdirSync(REVIEWS, { recursive: true })
for (const [f, text] of Object.entries(r.reviews)) fs.writeFileSync(path.join(REVIEWS, f), text, 'utf8')
const objs = Object.keys(r.manifest.objectives)
console.log(`\nBUILT ${path.relative(ROOT, OUT).replace(/\\/g, '/')}: ${count} questions, ${objs.length} objective(s) (${objs.join(', ')}), manifest rev ${r.manifest.rev}`)
console.log('no problems')
