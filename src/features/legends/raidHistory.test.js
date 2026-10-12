import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { RAID_HISTORY_DIR, REJECTED_ID, REJECTED_DIR, NOW_ID, historyUrl, shapeHistory, versionList, restorePlan, restoreArgs, unsafeSvg, bossFiles } from './raidHistory'
import { RAID_MOTIFS } from './raid'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const DIR = path.join(ROOT, RAID_HISTORY_DIR)

describe('raid version picker (pure)', () => {
  it('urls live apart from the live files and refuse odd input', () => {
    expect(historyUrl('cerberus', '61c8cb2')).toBe('/dev/raid-history/cerberus/61c8cb2.svg')
    expect(historyUrl('cerberus', REJECTED_ID)).toBe('/dev/raid-history/cerberus/rejected-2026-10-11.svg')
    expect(historyUrl('cerberus', '../x')).toBe('')
    expect(historyUrl('../a', '61c8cb2')).toBe('')
  })
  it('shapes a manifest and puts the live file first', () => {
    const h = shapeHistory({ cerberus: [{ id: 'abc1234', date: '2026-10-08', subject: 'Art — fixes' }, { id: 'abc1234' }, { id: 'bad id' }], '../x': [] , kitsune: 'no' })
    expect(h).toEqual({ cerberus: [{ id: 'abc1234', date: '2026-10-08', subject: 'Art: fixes', source: 'git' }] })
    expect(versionList(h, 'cerberus').map((v) => v.id)).toEqual([NOW_ID, 'abc1234'])
    expect(versionList(null, 'cerberus')).toHaveLength(1)
    expect(shapeHistory('nope')).toEqual({})
  })
  it('the restore script needs a boss and a version', () => {
    expect(restoreArgs([]).error).toMatch(/usage/)
    expect(restoreArgs(['cerberus']).error).toMatch(/usage/)
    expect(restoreArgs(['cerberus', 'zzz']).error).toMatch(/version id/)
    expect(restoreArgs(['Cer/x', '61c8cb2']).error).toMatch(/boss/)
    const a = restoreArgs(['cerberus', '61c8cb2', '--dry-run'])
    expect(a.dryRun).toBe(true)
    expect(a.plan).toEqual(Object.values(bossFiles('cerberus')).map((to) => ({ to, git: '61c8cb2' })))
    expect(a.plan.map((s) => s.to)).toEqual([
      'public/assets/legends/raids/cerberus.svg', 'src/features/legends/fx/cerberus.jsx',
      'src/features/legends/impact/bosses/cerberus.js', 'src/features/legends/impact/bosses/cerberus.parts.jsx'])
    expect(restorePlan('kitsune', REJECTED_ID).map((s) => s.file)).toEqual([
      `${REJECTED_DIR}/raids/kitsune.svg`, `${REJECTED_DIR}/fx/kitsune.jsx`, `${REJECTED_DIR}/bosses/kitsune.js`, `${REJECTED_DIR}/bosses/kitsune.parts.jsx`])
  })
  it('the safe-SVG check', () => {
    const ok = '<svg viewBox="0 0 120 120"><path d="M0 0" fill="url(#g)"/></svg>\n'
    expect(unsafeSvg(ok)).toBe('')
    expect(unsafeSvg('<svg><script/></svg>')).toMatch(/forbidden/)
    expect(unsafeSvg('<svg><g onload="x"/></svg>')).toMatch(/handler/)
    expect(unsafeSvg('<svg><path fill="url(http://x)"/></svg>')).toMatch(/url/)
    expect(unsafeSvg('<svg><image/></svg>')).toMatch(/image/)
    expect(unsafeSvg('<svg><path d="M0 0"/>')).toBe('incomplete')
  })
})

// The generated files (gitignored; `node dev/legends-gallery/raid-history.mjs`): checked when present.
const generated = fs.existsSync(path.join(DIR, 'manifest.json'))
describe.skipIf(!generated)('raid version picker files', () => {
  const manifest = generated ? JSON.parse(fs.readFileSync(path.join(DIR, 'manifest.json'), 'utf8')) : {}
  it('the manifest names exactly the files on disk, for raid bosses only', () => {
    expect(shapeHistory(manifest)).toEqual(manifest)
    for (const m of Object.keys(manifest)) expect(RAID_MOTIFS, m).toContain(m)
    const onDisk = fs.readdirSync(DIR, { withFileTypes: true }).filter((e) => e.isDirectory())
      .flatMap((e) => fs.readdirSync(path.join(DIR, e.name)).map((f) => `${e.name}/${f}`)).sort()
    expect(Object.entries(manifest).flatMap(([m, l]) => l.map((v) => `${m}/${v.id}.svg`)).sort()).toEqual(onDisk)
  })
  it('every version is a safe, complete drawing', () => {
    for (const [m, list] of Object.entries(manifest)) for (const v of list) {
      expect(unsafeSvg(fs.readFileSync(path.join(DIR, m, `${v.id}.svg`), 'utf8')), `${m}/${v.id}`).toBe('')
    }
  })
  // The rejected redesigns come from a scratch snapshot that may be refreshed, so only git versions are compared.
  // ONE git process for every version (`cat-file --batch`): a `git show` per version (about 150) took over 5 s in the
  // full suite and timed the test out
  it('every git version is the file at its commit byte for byte', () => {
    const want = Object.entries(manifest).flatMap(([m, list]) => list.filter((v) => v.source === 'git').map((v) => ({ m, id: v.id })))
    let out
    try {
      out = execFileSync('git', ['cat-file', '--batch'], { cwd: ROOT, input: want.map((w) => `${w.id}:public/assets/legends/raids/${w.m}.svg`).join('\n') + '\n', maxBuffer: 1 << 30, stdio: ['pipe', 'pipe', 'ignore'] })
    } catch { return } // no git: nothing to compare
    let at = 0
    for (const { m, id } of want) {
      const nl = out.indexOf(10, at)
      const head = out.subarray(at, nl).toString()
      at = nl + 1
      if (head.endsWith(' missing')) continue // source gone (snapshot removed): nothing to compare
      const size = Number(head.split(' ')[2])
      const src = out.subarray(at, at + size)
      at += size + 1
      expect(Buffer.compare(fs.readFileSync(path.join(DIR, m, `${id}.svg`)), src), `${m}/${id}`).toBe(0)
    }
  }, 30000)
})
