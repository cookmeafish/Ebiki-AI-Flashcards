// THE BANK BUILD, as data in and data out (no file access; dev/careers/build-bank.mjs does the reading and writing,
// dev/careers/bank-build.test.js drives this directly). Design: docs/plans/2026-11-16-exam-format-questions.md D3.
//
// A question SHIPS only when it passes every check of src/features/legends/exam/examChecks.js and every required
// review pass stamped the text exactly as it is now (C21). Any failure fails the whole build: nothing is written, so a
// question changed after a pass can never ship quietly.
import crypto from 'crypto'
import { canonicalQuestion, shapeExamQuestion, cardSig, slotCode, EXAM_FORMAT } from '../../src/features/legends/exam/examQuestion.js'
import { courseIndex, checkQuestion, checkSet, checkOwnWords, checkStamps, checkForbidden, requiredPasses } from '../../src/features/legends/exam/examChecks.js'

export const PASSES = ['p1', 'p2', 'p2b', 'p3', 'p4', 'oversight']
// SHA-256 of the question's JSON with its keys in the frozen order, `rev` left out.
export const questionHash = (q) => crypto.createHash('sha256').update(JSON.stringify(canonicalQuestion(q, { withRev: false }))).digest('hex')
export const objFile = (obj) => `q-${obj.replace('.', '-')}.json`
export const sourceFile = (obj) => `${obj.replace('.', '-')}.json`
export const domainOf = (obj) => String(obj).split('.')[0]

// The headings of the latest chapter file per prefix, by domain: an objective N.M reads the chapters of domain N
// (prefix dN, dNa, dNb ...) and the reference chapter d0 (the one home of exact numbers).
export function headingsByDomain(chapters) {
  const latest = new Map()
  for (const c of chapters) {
    const m = c.name.match(/^(d(\d+)[a-z]*)-knowledge(?:\.r(\d+))?\.md$/)
    if (!m) continue
    const pass = Number(m[3] || 0)
    if (!latest.has(m[1]) || latest.get(m[1]).pass < pass) latest.set(m[1], { domain: m[2], pass, text: c.text })
  }
  const byDomain = new Map()
  for (const { domain, text } of latest.values()) {
    if (!byDomain.has(domain)) byDomain.set(domain, new Set())
    for (const l of text.split(/\r?\n/)) { const h = l.match(/^#{1,6}\s+(.*\S)\s*$/); if (h) byDomain.get(domain).add(h[1].trim()) }
  }
  return (obj) => new Set([...(byDomain.get(domainOf(obj)) || []), ...(byDomain.get('0') || [])])
}

const fmt = (f) => `${f.check} ${f.id}: ${f.msg}`

// → { problems: [string], warnings: [string], files: { name: text } (public bank dir), manifest, reviews: { name: text },
//     preview } . `sources` = { 'N-N.json': questions[] }, `stamps` = { 'N-N.json': { qid: { p1: hash, ... } } }.
// `previous` = { manifest, files: { name: text } } of the bank already in public (for revs).
// `findCopies(texts)` = the own-words check (C19); null = no outline, reported as a problem unless `noOutlineOk`.
// `phrases` = the private forbidden phrase list, or null (skipped; the caller prints the warning).
export function buildBank({ courseId, pkg, sources, stamps = {}, chapters = [], findCopies = null, phrases = null, allowShort = false, preview = false, previous = null }) {
  const problems = []
  const warnings = []
  const ctx = { ...courseIndex(pkg), headingsFor: headingsByDomain(chapters) }
  const shaped = []
  const results = new Map()
  const note = (q, f) => { if (!results.has(q)) results.set(q, []); results.get(q).push(f) }
  if (!findCopies) problems.push('C19 own words: the outline is missing, so the own-words check cannot run')

  for (const [name, list] of Object.entries(sources)) {
    if (!Array.isArray(list)) { problems.push(`${name}: must hold a list of questions`); continue }
    const fileObj = name.replace(/\.json$/, '').replace('-', '.')
    for (const raw of list) {
      const s = shapeExamQuestion(raw)
      const fs = s.ok ? checkQuestion(s.q, ctx) : s.problems.map((msg) => ({ check: 'C1', level: 'fail', id: raw?.id ?? '?', msg }))
      const q = s.ok ? s.q : raw
      if (s.ok && q.obj !== fileObj) fs.push({ check: 'C3', level: 'fail', id: q.id, msg: `in ${name}, but obj is ${q.obj}` })
      if (s.ok && findCopies) fs.push(...checkOwnWords(q, findCopies))
      if (s.ok && phrases) fs.push(...checkForbidden(q, phrases))
      if (s.ok) {
        const st = checkStamps(q, (stamps[name] || {})[q.id], questionHash)
        if (preview) for (const f of st) f.level = 'info'
        fs.push(...st)
        shaped.push(q)
      }
      if (!results.has(q)) results.set(q, [])
      for (const f of fs) note(q, f)
    }
  }
  const setFindings = checkSet(shaped, ctx, { allowShort })
  const byId = new Map(shaped.map((q) => [q.id, q]))
  for (const f of setFindings) { const q = byId.get(f.id); if (q) note(q, f); else (f.level === 'fail' ? problems : warnings).push(fmt(f)) }
  for (const fs of results.values()) for (const f of fs) { if (f.level === 'fail') problems.push(fmt(f)); else if (f.level === 'warn') warnings.push(fmt(f)) }

  // A shipped question whose text changed must carry a higher rev.
  const prevQuestions = new Map()
  for (const [name, text] of Object.entries(previous?.files || {})) {
    if (!/^q-\d+-\d+\.json$/.test(name)) continue
    try { for (const q of JSON.parse(text).questions || []) prevQuestions.set(q.id, q) } catch { /* a damaged old file is replaced */ }
  }
  for (const q of shaped) {
    const old = prevQuestions.get(q.id)
    if (old && questionHash(old) !== questionHash(q) && !(q.rev > old.rev)) problems.push(`rev ${q.id}: the text changed since it shipped, raise rev above ${old.rev}`)
  }

  const out = { problems, warnings, files: {}, manifest: null, reviews: {}, preview: null }
  if (preview) {
    out.preview = {
      course: courseId, format: EXAM_FORMAT,
      questions: [...results.entries()].map(([q, fs]) => ({
        q, front: ctx.items.get(q.item)?.front || '', findings: fs.filter((f) => f.check !== 'C21'),
        stamps: Object.fromEntries((q.word !== undefined ? requiredPasses(q) : []).map((p) => {
          const st = (stamps[sourceFile(q.obj || '0.0')] || {})[q.id]
          return [p, !st?.[p] ? 'missing' : st[p] === questionHash(q) ? 'ok' : 'stale']
        })),
      })).sort((a, b) => cmpStr(String(a.q.id), String(b.q.id))),
    }
    return out
  }
  if (problems.length) return out

  // ── what ships: one file per objective, the manifest, one review line per question ──
  const prevManifest = previous?.manifest || null
  const objectives = {}
  const byObj = new Map()
  for (const q of shaped) { if (!byObj.has(q.obj)) byObj.set(q.obj, []); byObj.get(q.obj).push(q) }
  for (const obj of [...byObj.keys()].sort(cmpObj)) {
    const list = byObj.get(obj).sort((a, b) => cmpStr(a.item, b.item) || a.slot - b.slot)
    const file = objFile(obj)
    const prevRev = prevManifest?.objectives?.[obj]?.rev || 0
    // Compact, one question per line (about 10 MB for a whole course; a changed question is a one-line diff).
    const body = (rev) => `{"course":${JSON.stringify(courseId)},"format":${EXAM_FORMAT},"obj":${JSON.stringify(obj)},"rev":${rev},"questions":[\n${list.map((q) => JSON.stringify(q)).join(',\n')}\n]}\n`
    const same = previous?.files?.[file] && previous.files[file] === body(prevRev)
    const rev = same ? prevRev : prevRev + 1
    out.files[file] = body(rev)
    const cards = {}
    for (const q of list) {
      if (!cards[q.item]) cards[q.item] = { sig: cardSig(ctx.items.get(q.item)), slots: Array(10).fill('--') }
      cards[q.item].slots[q.slot] = slotCode(q)
    }
    for (const c of Object.values(cards)) c.slots = c.slots.join('')
    objectives[obj] = { file, rev, cards }
    const dom = `bank-d${domainOf(obj)}.jsonl`
    out.reviews[dom] = (out.reviews[dom] || '') + list.map((q) => JSON.stringify({
      id: q.id, obj: q.obj, stem: q.stem, bullets: q.bullets, ask: q.ask, artifact: q.artifact,
      options: q.options.map((o) => o.t), key: q.options.map((o, i) => (o.ok ? i : -1)).filter((i) => i >= 0),
      why: q.options.map((o) => o.why), source: q.source,
    })).join('\n') + '\n'
  }
  const core = { course: courseId, format: EXAM_FORMAT, package: String(pkg?.version ?? ''), objectives }
  const prevCore = prevManifest ? { ...prevManifest } : null
  if (prevCore) delete prevCore.rev
  const rev = prevManifest && JSON.stringify(prevCore) === JSON.stringify(core) ? prevManifest.rev : (prevManifest?.rev || 0) + 1
  out.manifest = { course: courseId, format: EXAM_FORMAT, rev, package: core.package, objectives }
  return out
}

// THE SHIPPED BANK, re-checked (bank-package.test.js): whatever is in public/ passes C1 to C18 and C22 and agrees with
// its manifest, so a hand edit cannot ship a broken file. `files` = { 'q-N-N.json': text }. → [string] problems.
export const SHIPPED_CHECKS = new Set(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12', 'C13', 'C14', 'C15', 'C16', 'C17', 'C18', 'C22'])
export function validateShipped({ manifest, files, pkg, allowShort = false }) {
  const problems = []
  if (!manifest || manifest.format !== EXAM_FORMAT) return [`manifest format must be ${EXAM_FORMAT}`]
  if (!(Number.isInteger(manifest.rev) && manifest.rev >= 1)) problems.push('manifest rev must be an integer >= 1')
  const ctx = courseIndex(pkg)
  const all = []
  for (const [obj, entry] of Object.entries(manifest.objectives || {})) {
    if (entry.file !== objFile(obj)) problems.push(`${obj}: file must be ${objFile(obj)}`)
    const text = files[entry.file]
    if (text === undefined) { problems.push(`${obj}: ${entry.file} is missing`); continue }
    let body
    try { body = JSON.parse(text) } catch { problems.push(`${entry.file}: not JSON`); continue }
    if (body.obj !== obj || body.rev !== entry.rev || body.format !== EXAM_FORMAT || body.course !== manifest.course) problems.push(`${entry.file}: course, format, obj or rev differ from the manifest`)
    const slots = {}
    for (const raw of body.questions || []) {
      const s = shapeExamQuestion(raw)
      if (!s.ok) { problems.push(...s.problems.map((m) => `C1 ${raw?.id}: ${m}`)); continue }
      if (JSON.stringify(s.q) !== JSON.stringify(raw)) problems.push(`${raw.id}: keys are not in the frozen order`)
      all.push(s.q)
      for (const f of checkQuestion(s.q, ctx)) if (f.level === 'fail' && SHIPPED_CHECKS.has(f.check)) problems.push(`${f.check} ${f.id}: ${f.msg}`)
      if (!slots[s.q.item]) slots[s.q.item] = Array(10).fill('--')
      slots[s.q.item][s.q.slot] = slotCode(s.q)
    }
    const want = Object.fromEntries(Object.entries(slots).map(([k, v]) => [k, { sig: cardSig(ctx.items.get(k)), slots: v.join('') }]))
    if (JSON.stringify(sortKeys(want)) !== JSON.stringify(sortKeys(entry.cards || {}))) problems.push(`${obj}: the manifest's cards (sig, slots) do not match ${entry.file}`)
  }
  for (const f of checkSet(all, ctx, { allowShort })) if (f.level === 'fail' && SHIPPED_CHECKS.has(f.check)) problems.push(`${f.check} ${f.id}: ${f.msg}`)
  return problems
}
const sortKeys = (o) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]))

// Plain code-unit order: the same on every machine (localeCompare follows the machine's locale).
const cmpStr = (a, b) => (a < b ? -1 : a > b ? 1 : 0)
const cmpObj = (a, b) => { const [a1, a2] = a.split('.').map(Number); const [b1, b2] = b.split('.').map(Number); return a1 - b1 || a2 - b2 }
