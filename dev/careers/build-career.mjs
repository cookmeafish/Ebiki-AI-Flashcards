// Builds a CAREER MODE package (src/features/legends/career.js) and an Anki import from a course's source folder,
// and FAILS (exit 1) unless every line of the official outline has exactly one reviewed card.
// How to make a course: docs/career-mode-guide.md.
//
//   node dev/careers/build-career.mjs <course-id> [--anki] [--knowledge "<mode name>"]
//
// Source folder: dev/careers/sources/<course-id>/ (in git, except outline.md and acronyms.txt: the vendor's own text)
//   course.json    { id, title, version, deck, tagPrefix, areas: [{ number, title, weight, motif, palette, bossName,
//                    theme, story: [], canDo: [] }], standardNames: { ACR: 'note' } }
//   outline.md     "# 1.0 <domain> (12%)", "## 1.1 <objective>", then "- item" / "  - sub-item" (2 spaces a level)
//   cards/         <prefix>-cards[.rN].json: [{ obj, path, term, definition, example, category, keyPoints }]
//                  the HIGHEST review pass per prefix is used (d1-cards.r2.json over d1-cards.r1.json over d1-cards.json)
//                  <prefix>-extras[.rN].json: EXTRA cards no outline line names but a learner needs (latest pass per
//                  prefix): [{ obj, extra: true, term, definition, example, category, keyPoints, sources: ['url'] }],
//                  each an item of its objective, taught in that objective's "Extras" lesson(s) before its checkpoint
//   knowledge/     <prefix>-knowledge[.rN].md (latest pass per prefix), copied to the mode's knowledge folder
//   acronyms.txt   optional "ACR|Expansion" lines
// Writes: public/careers/<course-id>.json (in git: every clone gets the course; the app offers it when this answers),
//         dev/careers/out/<course-id>-anki-import.txt + -report.txt (gitignored).
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { outlineGrams, courseTexts, verbatimProblems, proseProblems, RUN_WORDS, PROSE_WORDS } from './verbatim.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const id = process.argv[2]
if (!id || id.startsWith('--')) { console.error('usage: node dev/careers/build-career.mjs <course-id> [--anki] [--knowledge "<mode name>"]'); process.exit(2) }
const SRC = path.join(ROOT, 'dev', 'careers', 'sources', id)
const course = JSON.parse(fs.readFileSync(path.join(SRC, 'course.json'), 'utf8').replace(/^﻿/, ''))
const LESSON_MAX = 4 // keep equal to CAREER.lessonMax (career.js)
const problems = []

// ── the outline: every line is one expected card ──
const expected = []
const domains = []
let obj = null
const stack = []
let lineNo = 0
for (const raw of fs.readFileSync(path.join(SRC, 'outline.md'), 'utf8').split(/\r?\n/)) {
  lineNo++
  let m
  if ((m = raw.match(/^# (\d+)\.0 (.+?)(?: \((\d+)%\))?\s*$/))) { domains.push({ number: `${m[1]}.0`, title: m[2].trim(), weight: Number(m[3]) || 0 }); obj = null; expected.push({ obj: `${m[1]}.0`, path: [] }); continue }
  if ((m = raw.match(/^## (\d+\.\d+) (.+)$/))) { obj = m[1]; expected.push({ obj, path: [], title: m[2].trim().replace(/\.$/, '') }); continue }
  if ((m = raw.match(/^( *)- (.+)$/))) {
    if (!obj) { problems.push(`outline line ${lineNo}: a bullet before any "## <objective>" line`); continue }
    if (m[1].length % 2) { problems.push(`outline line ${lineNo}: indent with 2 spaces a level (found ${m[1].length})`); continue }
    const depth = m[1].length / 2
    if (depth > stack.length) { problems.push(`outline line ${lineNo}: a sub-item two levels under its parent`); continue }
    stack.length = depth
    stack[depth] = m[2].trim()
    expected.push({ obj, path: stack.slice(0, depth + 1) })
  }
}
const key = (c) => `${c.obj}|${(c.path || []).map((s) => String(s).trim().toLowerCase()).join(' > ')}`

// ── the cards: latest review pass per prefix ──
const latest = (dir, re) => {
  const best = new Map()
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
    const m = f.match(re); if (!m) continue
    const pass = Number(m[2] || 0)
    if (!best.has(m[1]) || best.get(m[1]).pass < pass) best.set(m[1], { f, pass })
  }
  return [...best.values()].map((x) => ({ file: path.join(dir, x.f), pass: x.pass }))
}
const cardFiles = latest(path.join(SRC, 'cards'), /^(\w+)-cards(?:\.r(\d+))?\.json$/)
const cards = cardFiles.flatMap((x) => JSON.parse(fs.readFileSync(x.file, 'utf8')))
const byKey = new Map()
for (const c of cards) { const k = key(c); if (byKey.has(k)) problems.push(`duplicate outline line: ${k}`); byKey.set(k, c) }
const expectedKeys = new Set(expected.map(key))
for (const e of expected) if (!byKey.has(key(e))) problems.push(`missing card: ${key(e)}`)
for (const c of cards) if (!expectedKeys.has(key(c))) problems.push(`card is not an outline line: ${key(c)}`)
const fronts = new Set()
for (const c of cards) {
  const f = String(c.term || '').trim().toLowerCase()
  if (fronts.has(f)) problems.push(`duplicate front: ${c.term}`)
  fronts.add(f)
  if (!c.term || !c.definition || !c.keyPoints || !c.category) problems.push(`card missing a field: ${c.term || key(c)}`)
  if (/[—–]/.test(JSON.stringify(c))) problems.push(`dash in card: ${c.term}`)
  if (/<[a-z][^>]*>/i.test(JSON.stringify(c))) problems.push(`HTML in card: ${c.term}`)
}
// ── extra cards: concepts a learner needs that no outline line names (reviewers' proposals), one objective each ──
const extraFiles = latest(path.join(SRC, 'cards'), /^(\w+)-extras(?:\.r(\d+))?\.json$/)
const extras = extraFiles.flatMap((x) => JSON.parse(fs.readFileSync(x.file, 'utf8')))
const objectiveIds = new Set(expected.filter((e) => !e.path.length && !e.obj.endsWith('.0')).map((e) => e.obj))
for (const c of extras) {
  const f = String(c.term || '').trim().toLowerCase()
  if (c.extra !== true) problems.push(`extra card without "extra": true: ${c.term}`)
  if (!objectiveIds.has(c.obj)) problems.push(`extra card for an unknown objective ${c.obj}: ${c.term}`)
  if (c.path) problems.push(`extra card with an outline path (extras name no outline line): ${c.term}`)
  if (!Array.isArray(c.sources) || !c.sources.some((u) => /^https:\/\//.test(String(u)))) problems.push(`extra card without a source: ${c.term}`)
  if (fronts.has(f)) problems.push(`duplicate front: ${c.term}`)
  fronts.add(f)
  if (!c.term || !c.definition || !c.example || !c.keyPoints || !c.category) problems.push(`extra card missing a field: ${c.term || c.obj}`)
  if (/[—–]/.test(JSON.stringify(c))) problems.push(`dash in extra card: ${c.term}`)
  if (/<[a-z][^>]*>/i.test(JSON.stringify(c))) problems.push(`HTML in extra card: ${c.term}`)
}
const unreviewed = cardFiles.filter((x) => x.pass < 2).map((x) => path.basename(x.file))
if (unreviewed.length) problems.push(`not reviewed twice (need .r2 or later): ${unreviewed.join(', ')}`)

// ── the package: islands = domains, sections = objectives, lessons = top-level bullets (parts of LESSON_MAX) ──
const keyPoints = (c) => (Array.isArray(c.keyPoints) ? c.keyPoints.join('; ') : String(c.keyPoints || ''))
const backText = (c) => [`Definition: ${c.definition}`, c.example ? `Example: ${c.example}` : '', `Category: ${c.category}`, `Key Points: ${keyPoints(c)}`].filter(Boolean).join('\n')
const itemId = (c) => `i${c.obj.replace('.', '-')}-${crypto.createHash('sha1').update(c.extra ? `extra|${c.obj}|${c.term}` : key(c)).digest('hex').slice(0, 8)}`
// An objective's item ids as lessons of at most LESSON_MAX, split evenly ("Title (1/2)", "Title (2/2)").
const lessonChunks = (section, title, ids) => {
  const parts = Math.ceil(ids.length / LESSON_MAX)
  return Array.from({ length: parts }, (_, p) => ({ section, title: parts > 1 ? `${title} (${p + 1}/${parts})` : title,
    itemIds: ids.slice(Math.round((p * ids.length) / parts), Math.round(((p + 1) * ids.length) / parts)) }))
}
const areas = domains.map((d, di) => {
  const meta = course.areas?.[di] || {}
  const dn = d.number.split('.')[0]
  const objs = expected.filter((e) => e.obj.startsWith(`${dn}.`) && e.obj !== d.number && !e.path.length)
  const items = []
  const sections = []
  const lessons = []
  // kind 'brief' = the domain's and each objective's OVERVIEW card: read as a briefing on the island and objective
  // (the owner: background to know first, never quizzed like a flashcard), never a lesson item.
  const add = (c, section, kind = 'term') => { const it = { id: itemId(c), kind, front: c.term, back: backText(c), section }; items.push(it); return it.id }
  let brief = ''
  for (const o of objs) {
    const oc = byKey.get(key(o))
    const lines = expected.filter((e) => e.obj === o.obj && e.path.length)
    const tops = lines.filter((e) => e.path.length === 1)
    // An objective with no sub-items keeps its overview as its one lesson (else it would have nothing to learn).
    const briefKind = tops.length ? 'brief' : 'term'
    const lead = []
    if (sections.length === 0 && byKey.get(key({ obj: d.number, path: [] }))) brief = add(byKey.get(key({ obj: d.number, path: [] })), o.obj, 'brief')
    const sectionBrief = oc && briefKind === 'brief' ? add(oc, o.obj, 'brief') : ''
    if (oc && briefKind === 'term') lead.push(add(oc, o.obj))
    sections.push({ id: o.obj, title: o.title, short: String(oc?.category || o.title).replace(/^\d+\.\d+\s*/, ''), ...(sectionBrief ? { brief: sectionBrief } : {}) })
    tops.forEach((top, ti) => {
      const group = lines.filter((e) => e.path[0] === top.path[0]).map((e) => byKey.get(key(e))).filter(Boolean).map((c) => add(c, o.obj))
      const ids = ti === 0 ? [...lead, ...group] : group
      lessons.push(...lessonChunks(o.obj, top.path[0], ids))
    })
    if (!tops.length && lead.length) lessons.push({ section: o.obj, title: o.title, itemIds: lead })
    // EXTRAS: the objective's extra cards, after its outline lessons (so before its checkpoint), in their own lesson(s).
    const extraIds = extras.filter((c) => c.obj === o.obj).map((c) => add(c, o.obj))
    if (extraIds.length) lessons.push(...lessonChunks(o.obj, 'Extras', extraIds))
  }
  return { id: `${id.split('-')[0]}-d${dn}`, number: d.number, title: meta.title || d.title, weight: meta.weight ?? d.weight, theme: meta.theme || '', motif: meta.motif || 'castle',
    palette: meta.palette || 'original', bossName: meta.bossName || '', story: meta.story || [], canDo: meta.canDo || [], ...(brief ? { brief } : {}), sections, items, lessons }
})
const counted = areas.reduce((n, a) => n + a.items.length, 0)
if (counted !== cards.length + extras.length) problems.push(`package holds ${counted} items, cards are ${cards.length + extras.length} (${cards.length} outline + ${extras.length} extra)`)
for (const a of areas) for (const l of a.lessons) if (l.itemIds.length > LESSON_MAX) problems.push(`lesson over ${LESSON_MAX} items: ${a.number} ${l.title}`)
const pkg = { id, title: course.title, version: course.version || '1', areas }

// OWN WORDS ONLY (./verbatim.mjs; rule in docs/career-mode-guide.md): nothing shipped copies 12+ words of the outline.
const chapterFiles = latest(path.join(SRC, 'knowledge'), /^(\w+)-knowledge(?:\.r(\d+))?\.md$/)
const copied = verbatimProblems(courseTexts({ cards: [...cards, ...extras], pkg, chapters: chapterFiles.map((x) => ({ name: path.basename(x.file), text: fs.readFileSync(x.file, 'utf8') })) }),
  outlineGrams(fs.readFileSync(path.join(SRC, 'outline.md'), 'utf8')), areas.flatMap((a) => a.sections.map((s) => s.title)))
for (const c of copied) problems.push(`copied from the outline (${RUN_WORDS}+ words), rewrite in our own words: ${c.where}: "${c.run}"`)
// Not traceable either: no shorter shared PHRASE (PROSE_WORDS+ words that read as a sentence, not a list of term names).
for (const c of proseProblems(courseTexts({ pkg }), fs.readFileSync(path.join(SRC, 'outline.md'), 'utf8'), areas.flatMap((a) => a.sections.map((s) => s.title))))
  problems.push(`shares a ${PROSE_WORDS}+ word phrase with the outline, reword it: ${c.where}: "${c.run}"`)

// ── acronym cards (Anki only; not on the map) ──
const acr = new Map()
const acrFile = path.join(SRC, 'acronyms.txt')
if (fs.existsSync(acrFile)) for (const line of fs.readFileSync(acrFile, 'utf8').split(/\r?\n/)) {
  const i = line.indexOf('|'); if (i < 0) continue
  const a = line.slice(0, i).trim(); const x = line.slice(i + 1).trim()
  if (!acr.has(a)) acr.set(a, []); if (!acr.get(a).includes(x)) acr.get(a).push(x)
}
const std = course.standardNames || {}
const acronymCards = [...acr].map(([a, xs]) => ({ obj: 'acr', term: `${a} (${course.title} acronym)`,
  definition: xs.length > 1 ? `${a} has ${xs.length} meanings on the official list: ${xs.join('; ')}.` : xs[0], example: '', category: 'Acronym list',
  keyPoints: [std[a] ? `Standard name: ${std[a]}` : '', xs.length > 1 ? 'Read the question to know which one is meant' : ''].filter(Boolean).join('; ') || 'Know the spelled-out form and what it does' }))

// ── reports and files ──
const outDir = path.join(ROOT, 'dev', 'careers', 'out')
fs.mkdirSync(outDir, { recursive: true })
const report = [`course ${id}: ${expected.length} outline lines, ${cards.length} cards (${cardFiles.map((x) => path.basename(x.file)).join(', ')}), ${extras.length} extra cards (${extraFiles.map((x) => path.basename(x.file)).join(', ') || 'none'}), ${acronymCards.length} acronym cards`,
  ...areas.map((a) => `  ${a.number} ${a.title}: ${a.sections.length} objectives, ${a.lessons.length} lessons, ${a.items.length} items`),
  problems.length ? `PROBLEMS (${problems.length}):` : 'no problems', ...problems.slice(0, 200).map((p) => `  ${p}`)].join('\n')
fs.writeFileSync(path.join(outDir, `${id}-report.txt`), report, 'utf8')
console.log(report)
if (problems.length) { console.error(`\nNOT BUILT: fix the ${problems.length} problem(s) above.`); process.exit(1) }

fs.mkdirSync(path.join(ROOT, 'public', 'careers'), { recursive: true })
fs.writeFileSync(path.join(ROOT, 'public', 'careers', `${id}.json`), JSON.stringify(pkg), 'utf8')
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const DECK = course.deck || course.title
const domainName = Object.fromEntries(domains.map((d) => [d.number.split('.')[0], `${d.number} ${d.title}`]))
const notes = [...cards, ...extras, ...acronymCards].map((c) => ({
  front: esc(c.term),
  back: [`<b>Definition:</b> ${esc(c.definition)}`, c.example ? `<b>Example:</b> ${esc(c.example)}` : '', `<b>Category:</b> ${esc(c.category)}`, `<b>Key Points:</b> ${esc(keyPoints(c))}`].filter(Boolean).join('<br>'),
  deck: c.obj === 'acr' ? `${DECK}::Acronyms` : `${DECK}::${domainName[c.obj.split('.')[0]]}`,
  tags: c.obj === 'acr' ? `ebiki ebiki-course ${course.tagPrefix || id} acronym` : `ebiki ebiki-course ${course.tagPrefix || id} domain-${c.obj.split('.')[0]} obj-${c.obj.replace('.', '-')}${c.extra ? ' extra' : ''}`,
}))
const cell = (s) => String(s).replace(/[\t\r\n]+/g, ' ')
fs.writeFileSync(path.join(outDir, `${id}-anki-import.txt`), ['#separator:tab', '#html:true', '#notetype:Basic', '#deck column:3', '#tags column:4',
  ...notes.map((n) => [n.front, n.back, n.deck, n.tags].map(cell).join('\t'))].join('\n'), 'utf8')
console.log(`\nBUILT public/careers/${id}.json and dev/careers/out/${id}-anki-import.txt (${notes.length} notes)`)

// ── the knowledge base: one chapter per prefix into the mode's knowledge folder ──
const ki = process.argv.indexOf('--knowledge')
if (ki > 0 && process.argv[ki + 1]) {
  const mode = process.argv[ki + 1]
  // The app folder's modes/ only (with a shared data folder or a renamed mode folder, upload the chapters in
  // Settings > Knowledge instead).
  const dest = path.join(ROOT, 'modes', mode, 'knowledge')
  if (!fs.existsSync(path.join(ROOT, 'modes', mode))) { console.error(`no mode folder modes/${mode}`); process.exit(1) }
  fs.mkdirSync(dest, { recursive: true })
  for (const x of latest(path.join(SRC, 'knowledge'), /^(\w+)-knowledge(?:\.r(\d+))?\.md$/)) {
    const name = `${id}-${path.basename(x.file).replace(/\.r\d+\.md$/, '.md')}`
    fs.copyFileSync(x.file, path.join(dest, name))
    console.log(`knowledge: modes/${mode}/knowledge/${name}`)
  }
}

if (process.argv.includes('--anki')) {
  const call = async (action, params) => {
    const r = await fetch('http://127.0.0.1:8765', { method: 'POST', body: JSON.stringify({ action, version: 6, params }) })
    const j = await r.json(); if (j.error) throw new Error(`${action}: ${j.error}`); return j.result
  }
  for (const d of [...new Set(notes.map((n) => n.deck))]) await call('createDeck', { deck: d })
  // Fronts already anywhere in the deck tree are skipped (a deck may have cards before; a rerun adds nothing twice).
  const existing = await call('findNotes', { query: `"deck:${DECK}"` })
  const info = existing.length ? await call('notesInfo', { notes: existing }) : []
  const plain = (h) => String(h || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim().toLowerCase()
  const have = new Set(info.map((n) => plain(Object.values(n.fields)[0]?.value)))
  const todo = notes.filter((n) => !have.has(plain(n.front)))
  console.log(`already in Anki: ${notes.length - todo.length}; adding ${todo.length}`)
  let added = 0; let failed = 0
  for (let i = 0; i < todo.length; i += 50) {
    const batch = todo.slice(i, i + 50).map((n) => ({ deckName: n.deck, modelName: 'Basic', fields: { Front: n.front, Back: n.back }, tags: n.tags.split(' '),
      options: { allowDuplicate: false, duplicateScope: 'deck', duplicateScopeOptions: { deckName: DECK, checkChildren: true } } }))
    const res = await call('addNotes', { notes: batch }).catch((e) => { console.log(e.message); return batch.map(() => null) })
    for (const r of res) (r ? added++ : failed++)
  }
  console.log(`added ${added}, not added ${failed}`)
}
