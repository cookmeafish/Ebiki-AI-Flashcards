// THE SHIPPED STUDY GUIDE (public/careers/<course>/knowledge/, written by dev/careers/build-career.mjs): the chapters
// Ebi reads from must be reachable by the app's own outline reader, every `###` section findable by its title, and the
// install record must match the files. A guide that ships but cannot be read section by section is useless to Ebi.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { extractOutline } from './knowledgeOutline'
import { OUTLINE_MAX } from './knowledgeRoute'

const ROOT = path.resolve(__dirname, '..', '..')
const COURSES = path.join(ROOT, 'public', 'careers')
const guides = fs.existsSync(COURSES) ? fs.readdirSync(COURSES).filter((d) => fs.existsSync(path.join(COURSES, d, 'knowledge', 'manifest.json'))) : []

describe.each(guides.map((g) => [g]))('the shipped study guide of %s', (course) => {
  const dir = path.join(COURSES, course, 'knowledge')
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'))
  const files = manifest.files.map((f) => ({ name: `course-${course}-${f.file}`, text: fs.readFileSync(path.join(dir, f.file), 'utf8'), meta: f }))

  it('the manifest names exactly the chapter files on disk, each with a title and a version', () => {
    const onDisk = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()
    expect(manifest.course).toBe(course)
    expect(manifest.files.map((f) => f.file).sort()).toEqual(onDisk)
    for (const f of manifest.files) { expect(f.title).toBeTruthy(); expect(f.version).toMatch(/^r\d+-/) }
  })

  it('every section heading is found by the app\'s outline reader, and they fit under the outline cap', () => {
    const heads = files.flatMap((f) => f.text.split(/\r?\n/).filter((l) => /^#{2,3} /.test(l)).map((l) => l.replace(/^#+\s*/, '').trim()))
    const outline = extractOutline(files.map(({ name, text }) => ({ name, text })))
    const titles = new Set(outline.map((o) => o.title))
    const missing = heads.filter((h) => !titles.has(h))
    expect(missing).toEqual([])
    expect(outline.length).toBeLessThanOrEqual(OUTLINE_MAX)
  })

  it('section titles are unique across the whole guide, at most 110 characters; sections at most 4,000 characters', () => {
    const titles = files.flatMap((f) => f.text.split(/\r?\n/).filter((l) => /^### /.test(l)).map((l) => l.slice(4).trim()))
    const dupes = titles.filter((t, i) => titles.indexOf(t) !== i)
    expect(dupes).toEqual([])
    for (const t of titles) expect(t.length).toBeLessThanOrEqual(110)
    for (const f of files) {
      const sections = f.text.split(/\r?\n(?=### )/).slice(1)
      for (const s of sections) expect(s.length, s.split('\n')[0]).toBeLessThanOrEqual(4000)
    }
  })

  it('no links, web addresses or dashes in the text the learner and Ebi read', () => {
    for (const f of files) {
      expect(f.text, f.name).not.toMatch(/https?:\/\//)
      expect(f.text, f.name).not.toMatch(/[–—]/)
    }
  })
})
