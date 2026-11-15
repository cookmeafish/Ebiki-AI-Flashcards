// NOT TRACEABLE TO ITS SOURCES (the owner, 2026-11-15): fetches every web page and PDF a course cites (cards, extras,
// knowledge chapters) and reports each shipped text that shares a phrase of PROSE_WORDS+ words with one of them.
// Run after changing a course:  node dev/careers/check-sources.mjs <course-id> [--words 7]
// Public pages only, a generic user agent; nothing about the user is sent. Pages are kept in dev/careers/out/sources/
// (gitignored) so a rerun reads them from disk. Exit 1 when anything is found.
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { courseTexts, proseProblems, PROSE_WORDS } from './verbatim.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const id = process.argv[2]
if (!id) { console.error('usage: node dev/careers/check-sources.mjs <course-id> [--words N]'); process.exit(2) }
const wi = process.argv.indexOf('--words')
const WORDS = wi > 0 ? Number(process.argv[wi + 1]) : PROSE_WORDS
const SRC = path.join(HERE, 'sources', id)
const CACHE = path.join(HERE, 'out', 'sources', id); fs.mkdirSync(CACHE, { recursive: true })
const pkg = JSON.parse(fs.readFileSync(path.join(HERE, '..', '..', 'public', 'careers', `${id}.json`), 'utf8'))

const files = [...fs.readdirSync(path.join(SRC, 'cards')).map((f) => path.join(SRC, 'cards', f)), ...fs.readdirSync(path.join(SRC, 'knowledge')).map((f) => path.join(SRC, 'knowledge', f))]
const urls = new Set()
for (const f of files) for (const m of fs.readFileSync(f, 'utf8').matchAll(/https?:\/\/[^\s)"\]<>]+/g)) urls.add(m[0].replace(/[.,;]+$/, ''))
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#?\w+;/g, ' ').replace(/[ \t]+/g, ' ')
let pdfjs = null
async function pdfText(buf) {
  pdfjs ||= await import(pathToFileURL(path.join(HERE, '..', '..', 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.mjs')).href)
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), isEvalSupported: false }).promise
  const out = []
  for (let p = 1; p <= doc.numPages; p++) out.push((await (await doc.getPage(p)).getTextContent()).items.map((x) => x.str).join(' '))
  return out.join('\n')
}
const sources = []; const failed = []
for (const u of urls) {
  const file = path.join(CACHE, `${Buffer.from(u).toString('base64url').slice(0, 120)}.txt`)
  if (fs.existsSync(file)) { sources.push({ url: u, text: fs.readFileSync(file, 'utf8') }); continue }
  try {
    const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (course-source-check)' }, signal: AbortSignal.timeout(30000) })
    if (!r.ok) { failed.push(`${r.status} ${u}`); continue }
    const isPdf = /pdf/i.test(r.headers.get('content-type') || '') || /\.pdf($|\?)/i.test(u)
    const text = isPdf ? await pdfText(await r.arrayBuffer()) : strip(await r.text())
    fs.writeFileSync(file, text); sources.push({ url: u, text })
  } catch (e) { failed.push(`${e.name} ${u}`) }
}
const titles = pkg.areas.flatMap((a) => a.sections.map((s) => s.title))
const texts = courseTexts({ pkg })
let found = 0
for (const s of sources) {
  for (const p of proseProblems(texts, s.text, titles, WORDS)) { found++; console.log(`${p.where}: "${p.run}"\n   shared with ${s.url}`) }
}
console.log(`\n${urls.size} cited sources, ${sources.length} read, ${failed.length} unreadable${failed.length ? `:\n  ${failed.join('\n  ')}` : ''}`)
console.log(found ? `${found} shared phrases of ${WORDS}+ words: reword them` : `no shared phrase of ${WORDS}+ words`)
process.exit(found ? 1 : 0)
