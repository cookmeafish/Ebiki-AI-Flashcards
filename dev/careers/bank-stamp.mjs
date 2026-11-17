// A REVIEW PASS STAMP for bank questions (docs/plans/2026-11-16-exam-format-questions.md D3.2): records that a pass
// was done on the text exactly as it is now. Any later edit changes the hash and the question stops shipping until
// that pass is done again (build-bank.mjs, check C21).
//
//   node dev/careers/bank-stamp.mjs <pass> <obj> [qid ...] [--course <id>] [--src <dir>]
//
// <pass> = p1 (accuracy), p2 (blind solve), p2b (second solver for BEST and MOST), p3 (clarity and format),
// p4 (fact check of key and why lines), oversight. <obj> = "N.N". No ids = every question of the objective.
// `miss` records that a blind solver picked ANOTHER answer on the text as it is now (ids required): p2 and p2b are then
// refused, and the build fails it, until the text changes (a rewrite); a second solver agreeing never settles it.
// A question that fails its shape (C1) is never stamped.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { PASSES, questionHash, sourceFile } from './bankBuild.mjs'
import { shapeExamQuestion } from '../../src/features/legends/exam/examQuestion.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const argv = process.argv.slice(2)
const flags = new Map()
const pos = []
for (let i = 0; i < argv.length; i++) { if (argv[i].startsWith('--')) flags.set(argv[i], argv[++i]); else pos.push(argv[i]) }
const [pass, obj, ...ids] = pos
if (!(PASSES.includes(pass) || pass === 'miss') || !/^\d+\.\d+$/.test(obj || '')) { console.error(`usage: node dev/careers/bank-stamp.mjs <${PASSES.join('|')}|miss> <N.N> [qid ...] [--course <id>] [--src <dir>]`); process.exit(2) }
const course = flags.get('--course') || 'security-plus-sy0-701'
const SRC = flags.get('--src') ? path.resolve(flags.get('--src')) : path.join(ROOT, 'dev', 'careers', 'sources', course)
const qf = path.join(SRC, 'bank', sourceFile(obj))
if (!fs.existsSync(qf)) { console.error(`no questions: ${qf}`); process.exit(1) }
const questions = JSON.parse(fs.readFileSync(qf, 'utf8').replace(/^﻿/, ''))
const sf = path.join(SRC, 'bank', 'stamps', sourceFile(obj))
const stamps = fs.existsSync(sf) ? JSON.parse(fs.readFileSync(sf, 'utf8')) : {}
if (pass === 'miss' && !ids.length) { console.error('miss needs the question ids'); process.exit(2) }
const want = ids.length ? new Set(ids) : null
let n = 0
let refused = 0
for (const q of questions) {
  if (want && !want.has(q.id)) continue
  const s = shapeExamQuestion(q)
  if (!s.ok) { console.log(`not stamped ${q.id}: ${s.problems[0]}`); refused++; continue }
  const h = questionHash(s.q)
  const prev = stamps[q.id] || {}
  if (pass === 'miss') { stamps[q.id] = { ...prev, miss: [...new Set([...(prev.miss || []), h])] }; n++; continue }
  if ((pass === 'p2' || pass === 'p2b') && (prev.miss || []).includes(h)) { console.log(`not stamped ${q.id}: a blind solver picked another answer on this exact text; rewrite it first`); refused++; continue }
  stamps[q.id] = { ...prev, [pass]: h }
  n++
}
if (want) for (const id of want) if (!questions.some((q) => q.id === id)) { console.log(`no question ${id} in ${sourceFile(obj)}`); refused++ }
const sorted = Object.fromEntries(Object.keys(stamps).sort().map((k) => [k, stamps[k]]))
fs.mkdirSync(path.dirname(sf), { recursive: true })
fs.writeFileSync(sf, `${JSON.stringify(sorted, null, 1)}\n`, 'utf8')
console.log(`stamped ${pass} on ${n} question(s) of ${obj}${refused ? `, ${refused} refused` : ''}`)
process.exit(refused ? 1 : 0)
