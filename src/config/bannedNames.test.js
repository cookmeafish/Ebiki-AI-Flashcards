// BANNED NAMES: words that must never appear anywhere in this repository (code, course packages and their sources,
// docs, reviews, tests). The owner, 2026-11-15: a third-party course creator's name and site are not to be used in
// the app ("if you used it in the code i need you to wipe it"). Course content keeps its facts in our own words and
// never credits, quotes or links that creator. Add a name here to ban it; the pattern itself lives only in this file.
import { describe, it, expect } from 'vitest'
import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(__dirname, '../..')
const BANNED = [
  { name: 'a third-party course creator (2026-11-15)', re: new RegExp(['pro', 'fessor\\s*', 'mes', 'ser|\\bmes', 'ser\\b'].join(''), 'i') },
]
const SELF = path.relative(ROOT, __filename).replace(/\\/g, '/')
const TEXT = /\.(js|jsx|mjs|cjs|ts|json|md|txt|html|css|svg|ps1|sh|bat|vbs|hta|yml|yaml)$/i

describe('banned names never appear in the repository', () => {
  const files = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter((f) => f && TEXT.test(f) && f !== SELF)
  it('scans the tracked files', () => { expect(files.length).toBeGreaterThan(100) })
  for (const b of BANNED) {
    it(`no file names ${b.name}`, () => {
      const hits = []
      for (const f of files) {
        let s = ''
        try { s = fs.readFileSync(path.join(ROOT, f), 'utf8') } catch { continue }
        if (b.re.test(s)) hits.push(f)
      }
      expect(hits).toEqual([])
    })
  }
})
