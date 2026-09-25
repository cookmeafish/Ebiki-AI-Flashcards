// Regression tests for config.json reads and writes.
//
// A config.json that exists but can't be parsed (half-written, locked, a short read over SMB) used to be
// served as {}: the client took that for a first run, showed onboarding again, and the autosave wrote
// defaults over the real file. It must read as a FAILURE, never as empty, and writes must never leave a
// half-written file for another reader to see.
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ebiki-config-'))
process.env.EBIKI_DATA_DIR = DIR
process.env.EBIKI_ENV_DIR = DIR

const { readConfigChecked, readConfigSettled, writeConfig } = await import('../../vite.config.js')
const FILE = path.join(DIR, 'config.json')

beforeEach(() => {
  for (const f of fs.readdirSync(DIR)) if (f.startsWith('config.json')) fs.rmSync(path.join(DIR, f), { force: true })
})
afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }))

describe('readConfigChecked', () => {
  it('a missing file is a genuine first run: ok and empty', () => {
    expect(readConfigChecked()).toEqual({ ok: true, data: {} })
  })

  it('a corrupt file is a failure, never an empty config', () => {
    fs.writeFileSync(FILE, '{"onboarded": true, "appLang', 'utf-8')
    const r = readConfigChecked()
    expect(r.ok).toBe(false)
    expect(r.data).toBeUndefined()
  })

  it('a valid file reads back as-is', () => {
    fs.writeFileSync(FILE, JSON.stringify({ onboarded: true, appTheme: 'dark' }), 'utf-8')
    expect(readConfigChecked()).toEqual({ ok: true, data: { onboarded: true, appTheme: 'dark' } })
  })
})

describe('readConfigSettled (what GET /api/config serves)', () => {
  it('a file that settles while retrying is served as written (another computer mid-write)', async () => {
    fs.writeFileSync(FILE, '', 'utf-8') // truncated mid-write
    setTimeout(() => fs.writeFileSync(FILE, JSON.stringify({ onboarded: true }), 'utf-8'), 300)
    expect(await readConfigSettled()).toEqual({ ok: true, data: { onboarded: true } })
  })

  it('a file that stays corrupt is kept aside, never deleted, and the app is not locked out', async () => {
    fs.writeFileSync(FILE, '{"onboarded": tr', 'utf-8')
    expect(await readConfigSettled()).toEqual({ ok: true, data: {} })
    expect(fs.existsSync(FILE)).toBe(false)
    const kept = fs.readdirSync(DIR).filter((f) => f.startsWith('config.json.corrupt-'))
    expect(kept).toHaveLength(1)
    expect(fs.readFileSync(path.join(DIR, kept[0]), 'utf-8')).toBe('{"onboarded": tr')
  })
})

describe('writeConfig', () => {
  it('merges into the existing file and leaves no temp file behind', () => {
    fs.writeFileSync(FILE, JSON.stringify({ onboarded: true, provider: 'openai' }), 'utf-8')
    writeConfig({ appTheme: 'dark' })
    expect(JSON.parse(fs.readFileSync(FILE, 'utf-8'))).toEqual({ onboarded: true, provider: 'openai', appTheme: 'dark' })
    expect(fs.readdirSync(DIR).filter((f) => f.endsWith('.tmp'))).toEqual([])
  })

  it('creates the file when there is none', () => {
    writeConfig({ onboarded: true })
    expect(readConfigChecked()).toEqual({ ok: true, data: { onboarded: true } })
  })
})
