import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { installCourseKnowledge, courseFilePrefix } from './courseKnowledge.js'

const readUtf8 = (p) => fs.readFileSync(p, 'utf8')
const writeFileAtomic = (p, s) => fs.writeFileSync(p, s)
let root, src, dest
const manifest = (files) => fs.writeFileSync(path.join(src, 'manifest.json'), JSON.stringify({ course: 'demo-course', files }))
const chapter = (file, text) => fs.writeFileSync(path.join(src, file), text)
const run = (o = {}) => installCourseKnowledge({ course: 'demo-course', srcDir: src, destDir: dest, fs, path, writeFileAtomic, readUtf8, ...o })
const P = courseFilePrefix('demo-course')
const list = () => fs.readdirSync(dest).filter((f) => !f.startsWith('.')).sort()

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'ck-'))
  src = path.join(root, 'src'); dest = path.join(root, 'knowledge')
  fs.mkdirSync(src)
  chapter('a.md', '# A v1'); chapter('b.md', '# B v1')
  manifest([{ file: 'a.md', title: 'A', version: '1' }, { file: 'b.md', title: 'B', version: '1' }])
})

describe('a course study guide in the knowledge base', () => {
  it('installs every chapter under the course prefix, beside the learner\'s own notes, which stay untouched', () => {
    fs.mkdirSync(dest); fs.writeFileSync(path.join(dest, 'my notes.md'), 'mine')
    const r = run()
    expect(r.installed).toEqual([`${P}a.md`, `${P}b.md`])
    expect(list()).toEqual([`${P}a.md`, `${P}b.md`, 'my notes.md'])
    expect(readUtf8(path.join(dest, 'my notes.md'))).toBe('mine')
  })
  it('a second run with nothing new changes nothing', () => {
    run()
    const r = run()
    expect(r.kept).toHaveLength(2); expect(r.installed).toEqual([]); expect(r.updated).toEqual([])
  })
  it('a newer version replaces the chapter in place; a switched-off chapter stays off', () => {
    run()
    fs.renameSync(path.join(dest, `${P}b.md`), path.join(dest, `${P}b.md.disabled`))
    chapter('a.md', '# A v2'); chapter('b.md', '# B v2')
    manifest([{ file: 'a.md', title: 'A', version: '2' }, { file: 'b.md', title: 'B', version: '2' }])
    const r = run()
    expect(r.updated.sort()).toEqual([`${P}a.md`, `${P}b.md`])
    expect(readUtf8(path.join(dest, `${P}a.md`))).toBe('# A v2')
    expect(readUtf8(path.join(dest, `${P}b.md.disabled`))).toBe('# B v2')
    expect(fs.existsSync(path.join(dest, `${P}b.md`))).toBe(false)
  })
  it('a chapter the learner deleted is not put back, unless they ask to restore', () => {
    run()
    fs.rmSync(path.join(dest, `${P}a.md`))
    expect(run().skipped).toEqual([`${P}a.md`])
    expect(fs.existsSync(path.join(dest, `${P}a.md`))).toBe(false)
    expect(run({ restore: true }).installed).toEqual([`${P}a.md`])
  })
  it('a chapter dropped from the course (an older layout) is removed, on or off; other files stay', () => {
    run()
    fs.writeFileSync(path.join(dest, `${P}old.md.disabled`), 'old'); fs.writeFileSync(path.join(dest, 'course-other-x.md'), 'other course')
    manifest([{ file: 'a.md', title: 'A', version: '1' }])
    const r = run()
    expect(r.removed.sort()).toEqual([`${P}b.md`, `${P}old.md.disabled`])
    expect(list()).toEqual([`${P}a.md`, 'course-other-x.md'])
  })
  it('refuses a bad course id and a manifest naming a path outside its folder', () => {
    expect(() => run({ course: '../x' })).toThrow()
    manifest([{ file: '../escape.md', title: 'x', version: '1' }, { file: 'a.md', title: 'A', version: '1' }])
    expect(run().installed).toEqual([`${P}a.md`])
  })
})
