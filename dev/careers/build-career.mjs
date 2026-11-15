// Builds a CAREER MODE package (src/features/legends/career.js) and an Anki import from a course's source folder,
// and FAILS (exit 1) unless every line of the official outline has exactly one reviewed card.
// How to make a course: docs/career-mode-guide.md.
//
//   node dev/careers/build-career.mjs <course-id> [--knowledge "<mode name>"]
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
import { rankAcronyms } from './acronymRank.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const id = process.argv[2]
if (!id || id.startsWith('--')) { console.error('usage: node dev/careers/build-career.mjs <course-id> [--knowledge "<mode name>"]'); process.exit(2) }
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
let acronymTierLine = ''
const acrFile = path.join(SRC, 'acronyms.txt')
if (fs.existsSync(acrFile)) for (const line of fs.readFileSync(acrFile, 'utf8').split(/\r?\n/)) {
  const i = line.indexOf('|'); if (i < 0) continue
  const a = line.slice(0, i).trim(); const x = line.slice(i + 1).trim()
  if (!acr.has(a)) acr.set(a, []); if (!acr.get(a).includes(x)) acr.get(a).push(x)
}
// ── ACRONYMS IN THE COURSE (the owner: learning the acronyms is a big part of the exam): every acronym joins ONE
// island, the one whose cards use it most (the acronym itself counts 3, its spelled-out form 2, each of its longer
// words 1), in the order the island first uses it; never-used ones go last, alphabetically. The map makes lessons
// and a drill from them (src/features/legends/career.js withAcronyms).
{
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const textOf = (a) => a.items.map((it) => `${it.front}\n${it.back}`)
  const STOP = new Set('and the for with of to in on a an or by protocol system service security standard'.split(' '))
  // A FAIR spread: an acronym the cards really use (by name or spelled out) joins its island; one they never use is a
  // weak guess, so it goes to the best-matching island that still has room (each holds at most its share + 30%).
  const byArea = areas.map(() => [])
  const loose = []
  for (const [a, xs] of acr) {
    const re = new RegExp(`(^|[^A-Za-z0-9])${escRe(a)}([^A-Za-z0-9]|$)`)
    const longWords = [...new Set(xs.join(' ').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !STOP.has(w)))]
    const scored = areas.map((ar, i) => {
      let strong = 0; let weak = 0; let at = Infinity
      textOf(ar).forEach((t, k) => {
        const low = t.toLowerCase()
        const s = (re.test(t) ? 3 : 0) + (xs.some((x) => low.includes(x.toLowerCase())) ? 2 : 0)
        if (s) { strong += s; if (k < at) at = k }
        weak += longWords.filter((w) => low.includes(w)).length
      })
      return { i, strong, weak, at }
    })
    const top = scored.reduce((x, y) => (y.strong > x.strong ? y : x))
    if (top.strong > 0) byArea[top.i].push({ acronym: a, expansions: xs, at: top.at })
    else loose.push({ acronym: a, expansions: xs, order: [...scored].sort((x, y) => y.weak - x.weak || x.i - y.i).map((s) => s.i) })
  }
  const cap = Math.ceil((acr.size / areas.length) * 1.3)
  for (const l of loose.sort((x, y) => x.acronym.localeCompare(y.acronym))) {
    const i = l.order.find((k) => byArea[k].length < cap) ?? l.order[0]
    byArea[i].push({ acronym: l.acronym, expansions: l.expansions, at: Infinity })
  }
  // BY IMPORTANCE (./acronymRank.mjs): Must know (named in the outline or used in 3+ cards), Good to know, then the ones
  // no lesson uses. Ships only `tier` and `uses`, never outline text.
  const outlineText = fs.readFileSync(path.join(SRC, 'outline.md'), 'utf8')
  const allCards = areas.flatMap(textOf)
  // Foundational acronyms the cards rarely use, judged core by a review (a reason each in the file).
  const coreFile = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), 'acronym-core.json')
  const core = fs.existsSync(coreFile) ? Object.keys(JSON.parse(fs.readFileSync(coreFile, 'utf8')).core || {}) : []
  const unknownCore = core.filter((c) => !byArea.some((list) => list.some((x) => x.acronym === c)))
  if (unknownCore.length) problems.push(`acronym-core.json names acronyms not on the list: ${unknownCore.join(', ')}`)
  // The standard name where the list's expansion differs (DES is the Data Encryption Standard); the list's wording is
  // kept as `listed` so a learner who studied the list is never marked wrong.
  const fixFile = path.join(path.dirname(coreFile), 'acronym-fixes.json')
  const fixes = fs.existsSync(fixFile) ? JSON.parse(fs.readFileSync(fixFile, 'utf8')).fixes || {} : {}
  const fixUsed = new Set()
  const fixed = (x) => {
    const f = fixes[x.acronym]
    if (!f) return {}
    if (!x.expansions.includes(f.listed)) { problems.push(`acronym-fixes.json: ${x.acronym} is not listed as "${f.listed}"`); return {} }
    fixUsed.add(x.acronym)
    return { expansions: x.expansions.map((e) => (e === f.listed ? f.name : e)), listed: [f.listed] }
  }
  areas.forEach((ar, i) => {
    ar.acronyms = rankAcronyms(byArea[i], { outline: outlineText, cards: allCards, core })
      .map((x) => ({ id: acronymId(x.acronym), acronym: x.acronym, expansions: x.expansions, tier: x.tier, uses: x.uses, ...fixed(x) }))
  })
  for (const k of Object.keys(fixes)) if (!fixUsed.has(k)) problems.push(`acronym-fixes.json names ${k}, not on the list`)
  const tierCount = (tier) => areas.reduce((n, ar) => n + ar.acronyms.filter((x) => x.tier === tier).length, 0)
  acronymTierLine = `acronyms by tier: ${tierCount('must')} core, ${tierCount('good')} good to know, ${tierCount('rare')} extra`
  // Ids are unique across the course (the final raid pools every island): two acronyms differing only in case
  // ("SoC" and "SOC") once shared one id, so only one could ever be asked.
  const ids = areas.flatMap((ar) => ar.acronyms.map((x) => x.id))
  for (const d of new Set(ids.filter((x, i) => ids.indexOf(x) !== i))) problems.push(`two acronyms share the id ${d}`)
}
// An acronym's item id: its letters, lowercased; a mixed-case one ("SoC") adds its case pattern so it never collides
// with the all-caps one ("SOC").
function acronymId(a) {
  const slug = a.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return a === a.toUpperCase() ? `acr-${slug}` : `acr-${slug}-${[...a].filter((c) => /[a-z]/i.test(c)).map((c) => (c === c.toLowerCase() ? 'l' : 'u')).join('')}`
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
  ...(acronymTierLine ? [acronymTierLine] : []),
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

// (No option fills a deck: the course is a library in Legends and the learner's deck holds only what they add. The
// former --anki push was removed on the owner's decision, 2026-11-15.)
