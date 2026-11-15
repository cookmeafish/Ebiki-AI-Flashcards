// OWN WORDS ONLY: shipped course content shares no run of RUN_WORDS+ words with the vendor's outline (the outline is
// local and gitignored: on a clone without it the course check is skipped, the logic tests always run).
// Rule: docs/career-mode-guide.md "Own words only".
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { outlineGrams, copiedRuns, courseTexts, verbatimProblems, RUN_WORDS } from './verbatim.mjs'

const OUTLINE = `# 1.0 General Security Concepts (12%)
## 1.1 Compare and contrast various types of security controls.
- Categories
  - Technical
## 1.2 Explain the importance of change management processes and the impact to security.
- Business processes impacting security operation`

describe('the copy check', () => {
  const grams = outlineGrams(OUTLINE)
  it('finds a copied run of 12+ words, even across a line break, and ignores case and punctuation', () => {
    expect(copiedRuns('As the guide says: EXPLAIN the importance of change management processes, and the impact to security!', grams)).toHaveLength(1)
    expect(copiedRuns('change management processes and the impact to security business processes impacting security operation', grams)).toHaveLength(1)
  })
  it('passes our own words, and short official names', () => {
    expect(copiedRuns('Change management is the approval and tracking of changes so they do not break security.', grams)).toHaveLength(0)
    expect(copiedRuns('Technical controls', grams)).toHaveLength(0)
  })
  it('lets an objective title stand as its own label', () => {
    const title = 'Explain the importance of change management processes and the impact to security'
    expect(verbatimProblems([{ where: 'x', text: `Objective 1.2: ${title}.` }], grams, [title])).toHaveLength(0)
    expect(verbatimProblems([{ where: 'x', text: `Objective 1.2: ${title}.` }], grams, [])).toHaveLength(1)
  })
  it('counts words the same way the outline does', () => { expect(RUN_WORDS).toBe(12) })
})

// The shipped courses against their local outlines.
const HERE = path.dirname(fileURLToPath(import.meta.url))
const SOURCES = path.join(HERE, 'sources')
const courses = fs.existsSync(SOURCES) ? fs.readdirSync(SOURCES).filter((d) => fs.existsSync(path.join(SOURCES, d, 'course.json'))) : []
describe.each(courses)('course %s', (id) => {
  const dir = path.join(SOURCES, id)
  const hasOutline = fs.existsSync(path.join(dir, 'outline.md'))
  it.skipIf(!hasOutline)('ships no run of 12+ words copied from the vendor outline', () => {
    const outline = fs.readFileSync(path.join(dir, 'outline.md'), 'utf8')
    const read = (sub, re) => (fs.existsSync(path.join(dir, sub)) ? fs.readdirSync(path.join(dir, sub)).filter((f) => re.test(f)) : [])
    const cards = read('cards', /\.json$/).flatMap((f) => JSON.parse(fs.readFileSync(path.join(dir, 'cards', f), 'utf8')))
    const chapters = read('knowledge', /\.md$/).map((f) => ({ name: f, text: fs.readFileSync(path.join(dir, 'knowledge', f), 'utf8') }))
    const pkgFile = path.join(HERE, '..', '..', 'public', 'careers', `${id}.json`)
    const pkg = fs.existsSync(pkgFile) ? JSON.parse(fs.readFileSync(pkgFile, 'utf8')) : null
    const titles = (pkg?.areas || []).flatMap((a) => (a.sections || []).map((s) => s.title))
    const problems = verbatimProblems(courseTexts({ cards, chapters, pkg }), outlineGrams(outline), titles)
    expect(problems.slice(0, 10), `${problems.length} copied runs`).toEqual([])
  })
})
