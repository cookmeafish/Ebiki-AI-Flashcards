// COVERAGE: every line of a course's official outline (domain, objective, item, every sub-item at every depth) has
// exactly one card, and every card carries a concrete example. The outline is the vendor's own text, local and
// gitignored: without it this check is skipped (like ./verbatim.test.js). EXTRA cards (concepts a learner needs that
// no outline line names, <prefix>-extras[.rN].json) are allowed outside the outline only when marked `extra: true`,
// tied to a real objective, with no outline path and at least one source; they never count as an outline line's card.
// Same parser and card selection as
// ./build-career.mjs (latest review pass per prefix). Rule: docs/career-mode-guide.md.
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SOURCES = path.join(HERE, 'sources')

// Every outline line, as { obj, path, line }. Mirrors the outline parser in build-career.mjs.
export function outlineLines(text) {
  const lines = []
  const stack = []
  let obj = null
  let n = 0
  for (const raw of text.split(/\r?\n/)) {
    n++
    let m
    if ((m = raw.match(/^# (\d+)\.0 (.+?)(?: \((\d+)%\))?\s*$/))) { obj = null; lines.push({ obj: `${m[1]}.0`, path: [], line: n }); continue }
    if ((m = raw.match(/^## (\d+\.\d+) (.+)$/))) { obj = m[1]; stack.length = 0; lines.push({ obj, path: [], line: n }); continue }
    if ((m = raw.match(/^( *)- (.+)$/)) && obj && m[1].length % 2 === 0) {
      const depth = m[1].length / 2
      if (depth > stack.length) continue
      stack.length = depth
      stack[depth] = m[2].trim()
      lines.push({ obj, path: stack.slice(0, depth + 1), line: n })
    }
  }
  return lines
}
const keyOf = (c) => `${c.obj}|${(c.path || []).map((s) => String(s).trim().toLowerCase()).join(' > ')}`

// The cards the builder uses: the highest review pass per prefix, of the outline cards or the extras.
function latestCards(dir, kind = 'cards') {
  const best = new Map()
  const re = kind === 'extras' ? /^(\w+)-extras(?:\.r(\d+))?\.json$/ : /^(\w+)-cards(?:\.r(\d+))?\.json$/
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
    const m = f.match(re)
    if (!m) continue
    const pass = Number(m[2] || 0)
    if (!best.has(m[1]) || best.get(m[1]).pass < pass) best.set(m[1], { f, pass })
  }
  return [...best.values()].flatMap((x) => JSON.parse(fs.readFileSync(path.join(dir, x.f), 'utf8')))
}

describe('the outline parser', () => {
  it('reads domains, objectives and sub-items at every depth', () => {
    const got = outlineLines('# 1.0 General (12%)\n## 1.1 Controls.\n- Categories\n  - Technical\n    - Deep\n- Types')
    expect(got.map((l) => keyOf(l))).toEqual(['1.0|', '1.1|', '1.1|categories', '1.1|categories > technical', '1.1|categories > technical > deep', '1.1|types'])
  })
})

const courses = fs.existsSync(SOURCES) ? fs.readdirSync(SOURCES).filter((d) => fs.existsSync(path.join(SOURCES, d, 'course.json'))) : []
describe.each(courses)('course %s', (id) => {
  const dir = path.join(SOURCES, id)
  const hasOutline = fs.existsSync(path.join(dir, 'outline.md'))
  it.skipIf(!hasOutline)('has exactly one card for every outline line, each with an example', () => {
    const lines = outlineLines(fs.readFileSync(path.join(dir, 'outline.md'), 'utf8'))
    const all = [...latestCards(path.join(dir, 'cards')), ...latestCards(path.join(dir, 'cards'), 'extras')]
    const extras = all.filter((c) => c.extra === true)
    const cards = all.filter((c) => c.extra !== true)
    const objectives = new Set(lines.filter((l) => !l.path.length && !l.obj.endsWith('.0')).map((l) => l.obj))
    const badExtras = extras.filter((c) => !objectives.has(c.obj) || c.path || !Array.isArray(c.sources) || !c.sources.some((u) => /^https:\/\//.test(String(u))))
      .map((c) => c.term || c.obj)
    const count = new Map()
    for (const c of cards) count.set(keyOf(c), (count.get(keyOf(c)) || 0) + 1)
    const expected = new Set(lines.map(keyOf))
    const missing = lines.filter((l) => !count.has(keyOf(l))).map((l) => `line ${l.line}: ${keyOf(l)}`)
    const doubled = [...count].filter(([k, n]) => n > 1).map(([k, n]) => `${k} (${n} cards)`)
    const extra = cards.filter((c) => !expected.has(keyOf(c))).map(keyOf)
    const noExample = all.filter((c) => !String(c.example || '').trim()).map((c) => c.term || keyOf(c))
    const covered = lines.filter((l) => count.get(keyOf(l)) === 1).length
    const subItems = lines.filter((l) => l.path.length)
    const subCovered = subItems.filter((l) => count.get(keyOf(l)) === 1).length
    console.log(`${id}: ${covered} of ${lines.length} outline lines covered (${subCovered} of ${subItems.length} sub-items), ${extras.length} extra cards, ${all.length - noExample.length} of ${all.length} cards with an example`)
    expect({ missing, doubled, extra, noExample, badExtras }).toEqual({ missing: [], doubled: [], extra: [], noExample: [], badExtras: [] })
    expect(covered).toBe(lines.length)
    expect(cards.length).toBe(lines.length)
  })
})
