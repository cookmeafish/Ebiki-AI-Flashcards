// The auto-backup's copy (copyNewer) is the offline merge BASE: a share file it fails to refresh leaves a stale base.
import { describe, it, expect, afterAll } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ebiki-backup-copy-'))
process.env.EBIKI_DATA_DIR = DIR
process.env.EBIKI_ENV_DIR = DIR
const { copyNewer } = await import('../../vite.config.js')
afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }))

describe('copyNewer', () => {
  it('copies a same-size edit whose mtime is OLDER (another computer with a clock behind)', () => {
    const src = path.join(DIR, 'share', 'config.json'), dst = path.join(DIR, 'base', 'config.json')
    fs.mkdirSync(path.dirname(src), { recursive: true })
    fs.writeFileSync(src, '{"a":1}')
    copyNewer(path.dirname(src), path.dirname(dst), { n: 0 })
    expect(fs.readFileSync(dst, 'utf8')).toBe('{"a":1}')
    // Same size, mtime an hour earlier than the copy's.
    fs.writeFileSync(src, '{"a":2}')
    const older = new Date(fs.statSync(dst).mtimeMs - 3600e3)
    fs.utimesSync(src, older, older)
    const acc = { n: 0 }
    copyNewer(path.dirname(src), path.dirname(dst), acc)
    expect(fs.readFileSync(dst, 'utf8')).toBe('{"a":2}')
    expect(acc.n).toBe(1)
  })

  it('an unchanged file is not copied again', () => {
    const src = path.join(DIR, 'share2', 'x.json'), dst = path.join(DIR, 'base2', 'x.json')
    fs.mkdirSync(path.dirname(src), { recursive: true })
    fs.writeFileSync(src, '{}')
    copyNewer(path.dirname(src), path.dirname(dst), { n: 0 })
    const acc = { n: 0 }
    copyNewer(path.dirname(src), path.dirname(dst), acc)
    expect(acc.n).toBe(0)
  })
})
