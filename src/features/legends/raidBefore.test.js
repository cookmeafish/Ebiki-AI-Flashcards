import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { RAID_BEFORE, RAID_BEFORE_COMMIT, RAID_BEFORE_FILES, hasRaidBefore, raidBeforeUrl, restoreArgs } from './raidBefore'
import { RAID_MOTIFS } from './raid'
import { REALISTIC_ART } from './art'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const DIR = path.join(ROOT, 'public/assets/legends/raids-before')

describe('raid BEFORE copies', () => {
  it('the manifest lists exactly the files in raids-before, each a raid boss', () => {
    const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4)).sort()
    expect([...RAID_BEFORE].sort()).toEqual(files)
    for (const m of RAID_BEFORE) expect(RAID_MOTIFS, m).toContain(m)
  })
  it('urls live apart from the current files (caches key by URL)', () => {
    expect(raidBeforeUrl('kitsune')).toBe('/assets/legends/raids-before/kitsune.svg')
    expect(raidBeforeUrl('nope')).toBe('')
    expect(hasRaidBefore('kitsune')).toBe(true)
  })
  for (const motif of RAID_BEFORE) {
    it(`raids-before/${motif}.svg is a safe, complete drawing`, () => {
      const svg = fs.readFileSync(path.join(DIR, `${motif}.svg`), 'utf8')
      expect(svg.trim().endsWith('</svg>')).toBe(true)
      expect(svg).toMatch(/viewBox="0 0 120 120"/)
      expect(svg).not.toMatch(/<(script|foreignObject|image|use|a|style)\b|\son\w+\s*=|javascript:|href=/i)
      // only the painted 3D files may reference their own gradients, and only locally
      if (REALISTIC_ART.includes(`raids/${motif}.svg`)) expect(svg.match(/url\(([^)]*)\)/g)?.every((u) => /^url\(#[\w-]+\)$/.test(u)) ?? true).toBe(true)
      else expect(svg).not.toMatch(/url\s*\(/i)
    })
  }
  it(`each copy is the drawing at ${RAID_BEFORE_COMMIT} byte for byte`, () => {
    let git
    try { git = (f) => execFileSync('git', ['show', `${RAID_BEFORE_COMMIT}:${f}`], { cwd: ROOT, maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] }) } catch { return }
    for (const m of RAID_BEFORE) {
      let old
      try { old = git(`public/assets/legends/raids/${m}.svg`) } catch { return } // no git history (a ZIP install): nothing to compare
      expect(Buffer.compare(fs.readFileSync(path.join(DIR, `${m}.svg`)), old), m).toBe(0)
    }
  })
})

describe('restore-before arguments', () => {
  it('refuses without a known motif', () => {
    expect(restoreArgs([]).error).toMatch(/usage/)
    expect(restoreArgs(['--dry-run']).error).toMatch(/usage/)
    expect(restoreArgs(['nope']).error).toMatch(/no BEFORE/)
  })
  it('names the drawing and the fight files', () => {
    expect(restoreArgs(['showman', '--dry-run'])).toEqual({ motif: 'showman', dryRun: true, files: RAID_BEFORE_FILES('showman') })
    expect(RAID_BEFORE_FILES('showman')).toEqual([
      'public/assets/legends/raids/showman.svg',
      'src/features/legends/fx/showman.jsx',
      'src/features/legends/impact/bosses/showman.js',
      'src/features/legends/impact/bosses/showman.parts.jsx',
    ])
    expect(restoreArgs(['showman']).dryRun).toBe(false)
  })
})
