// THE SHIPPED BANK (docs/plans/2026-11-16-exam-format-questions.md D3.2): whatever bank is in public/careers/<id>/bank/
// passes checks C1 to C18 and C22 again and agrees with its manifest, so a hand edit cannot ship a broken file. A course
// with no bank yet has nothing to check. The same validator is proven here on the invented fixture's build output.
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { buildBank, validateShipped } from './bankBuild.mjs'
import { outlineGrams, verbatimProblems } from './verbatim.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC = path.resolve(HERE, '..', '..', 'public', 'careers')
const readDir = (dir) => Object.fromEntries(fs.readdirSync(dir).filter((f) => /^q-\d+-\d+\.json$/.test(f)).map((f) => [f, fs.readFileSync(path.join(dir, f), 'utf8')]))

const banks = fs.readdirSync(PUBLIC).filter((id) => fs.existsSync(path.join(PUBLIC, id, 'bank', 'manifest.json')))

describe('every shipped bank in public/careers', () => {
  it('lists the banks (none is fine until the first objective ships)', () => {
    for (const id of banks) expect(fs.existsSync(path.join(PUBLIC, `${id}.json`))).toBe(true)
  })
  for (const id of banks) {
    it(`${id}: C1 to C18 and C22 pass and the manifest matches its files`, () => {
      const dir = path.join(PUBLIC, id, 'bank')
      const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'))
      const pkg = JSON.parse(fs.readFileSync(path.join(PUBLIC, `${id}.json`), 'utf8'))
      expect(manifest.course).toBe(id)
      // The build enforces 10 per card unless --allow-short; here at least 6 (the manifest does not record the flag).
      expect(validateShipped({ manifest, files: readDir(dir), pkg, allowShort: true })).toEqual([])
      const listed = new Set(Object.values(manifest.objectives).map((o) => o.file))
      expect(Object.keys(readDir(dir)).filter((f) => !listed.has(f))).toEqual([])
    })
  }
})

describe('the shipped-bank check itself (on the invented fixture)', () => {
  const FIX = path.join(HERE, 'fixtures', 'beekeeping-fixture')
  const read = (f) => JSON.parse(fs.readFileSync(path.join(FIX, f), 'utf8'))
  const pkg = read('beekeeping-fixture.json')
  const built = buildBank({ courseId: 'beekeeping-fixture', pkg, sources: { '7-1.json': read('bank/7-1.json') }, stamps: { '7-1.json': read('bank/stamps/7-1.json') },
    chapters: [{ name: 'd7-knowledge.r2.md', text: fs.readFileSync(path.join(FIX, 'knowledge', 'd7-knowledge.r2.md'), 'utf8') }],
    findCopies: (t) => verbatimProblems(t, outlineGrams(fs.readFileSync(path.join(FIX, 'outline.md'), 'utf8'))), allowShort: true })
  const check = (files, manifest = built.manifest) => validateShipped({ manifest, files, pkg, allowShort: true })
  it('passes the build output', () => expect(check(built.files)).toEqual([]))
  it('catches a hand edit that breaks a question', () => {
    const text = built.files['q-7-1.json'].replace('"Lets workers pass but stops the queen","ok":true', '"Lets workers pass but stops the queen","ok":false')
    expect(check({ 'q-7-1.json': text }).join('\n')).toMatch(/C1 i7-1-a1c3e5f7\.0/)
  })
  it('catches a stem leak written in by hand', () => {
    const text = built.files['q-7-1.json'].replace('"The queen has been laying up there."', '"A queen excluder is missing."').replace('The queen has been laying up there.', 'A queen excluder is missing.')
    expect(check({ 'q-7-1.json': text }).join('\n')).toMatch(/C9 i7-1-a1c3e5f7\.2/)
  })
  it('catches a manifest that disagrees with its file', () => {
    const m = JSON.parse(JSON.stringify(built.manifest))
    m.objectives['7.1'].cards['i7-1-a1c3e5f7'].slots = 'd1d1s1s1S2A1S1------'
    expect(check(built.files, m).join('\n')).toMatch(/do not match/)
    expect(check({}, built.manifest).join('\n')).toMatch(/q-7-1\.json is missing/)
  })
})
