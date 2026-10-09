// The key file only ever holds the providers this build reads, one clean line each, and the shared keys.json can
// neither inject lines into it nor make it rewrite itself on every sync.
//   - An unknown provider in keys.json (a NEWER computer on the share, with a provider this build lacks) was "adopted"
//     on every sync: written as a VITE_<NAME>_API_KEY line readEnvFile never returns, so .env was rewritten and
//     logged on every page load, forever.
//   - A value holding a line break wrote a second VITE_* line, replacing another provider's key without a record.
// Plus the server's own housekeeping: atomic temp names are unique per write (two computers on one share can share a
// process id), and the watcher never polls the data files at the app root.
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ebiki-env-hard-'))
const ENV_DIR = path.join(DIR, 'env')
const SHARE = path.join(DIR, 'share')
fs.mkdirSync(ENV_DIR, { recursive: true })
fs.mkdirSync(SHARE, { recursive: true })
process.env.EBIKI_ENV_DIR = ENV_DIR
process.env.EBIKI_DATA_DIR = SHARE

const mod = await import('../../vite.config.js')
const { readEnvFile, writeEnv, syncSharedKeys, writeFileAtomic, ENV_FILE, ENV_BAK, ENV_CLEARED, ENV_DECLINED } = mod
const KEY_LOG = path.join(ENV_DIR, 'logs', 'keys.log')
const SHARED = path.join(SHARE, 'keys.json')

const ANT = 'sk-ant-aaaaaaaaaaaaaaaaaaaa'
const OAI = 'sk-proj-bbbbbbbbbbbbbbbbbbbb'

beforeEach(() => {
  for (const f of [ENV_FILE, ENV_BAK, ENV_CLEARED, ENV_DECLINED, KEY_LOG, SHARED]) fs.rmSync(f, { force: true })
})
afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }))

describe('writeEnv stores only clean keys of known providers', () => {
  it('an unknown provider is not written', () => {
    fs.writeFileSync(ENV_FILE, `VITE_ANTHROPIC_API_KEY=${ANT}\n`)
    const r = writeEnv({ mistral: 'ms-abcdefabcdef' })
    expect(r.unchanged).toBe(true)
    expect(fs.readFileSync(ENV_FILE, 'utf-8')).not.toMatch(/MISTRAL/)
  })
  it('a value with a line break cannot write a second key line', () => {
    fs.writeFileSync(ENV_FILE, `VITE_ANTHROPIC_API_KEY=${ANT}\n`)
    writeEnv({ openai: `${OAI}\nVITE_ANTHROPIC_API_KEY=sk-ant-evilevilevil` })
    expect(readEnvFile(ENV_FILE)).toEqual({ anthropic: ANT })
    expect(fs.readFileSync(ENV_FILE, 'utf-8').match(/VITE_/g)).toHaveLength(1)
  })
  it('a provider name holding a line break is refused too', () => {
    writeEnv({ 'openai=x\nVITE_ANTHROPIC': ANT })
    expect(fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf-8') : '').not.toMatch(/ANTHROPIC/)
  })
  it('surrounding whitespace is still trimmed, and a clean key is stored', () => {
    writeEnv({ openai: `  ${OAI}\n` })
    expect(readEnvFile(ENV_FILE)).toEqual({ openai: OAI })
  })
})

describe('syncSharedKeys with keys.json from a newer or damaged computer', () => {
  it('adopts the known provider once, never the unknown or broken ones, and stays quiet afterwards', async () => {
    fs.writeFileSync(SHARED, JSON.stringify({ openai: OAI, mistral: 'ms-abcdefabcdef', grok: 'xai-a\nVITE_ANTHROPIC_API_KEY=sk-ant-evil' }))
    const first = await syncSharedKeys()
    expect(first.pulled).toEqual(['openai'])
    expect(readEnvFile(ENV_FILE)).toEqual({ openai: OAI })
    const writesAfterFirst = fs.readFileSync(KEY_LOG, 'utf-8').split('\n').filter((l) => /\bwrite\b/.test(l)).length
    const second = await syncSharedKeys()
    expect(second.pulled).toEqual([])
    const writesAfterSecond = fs.readFileSync(KEY_LOG, 'utf-8').split('\n').filter((l) => /\bwrite\b/.test(l)).length
    expect(writesAfterSecond).toBe(writesAfterFirst)
    // The share keeps the other computer's entries untouched (keys.json never shrinks).
    expect(JSON.parse(fs.readFileSync(SHARED, 'utf-8'))).toMatchObject({ mistral: 'ms-abcdefabcdef' })
  })
})

describe('writeFileAtomic', () => {
  it('uses a fresh temp name per write, still shaped <file>.<digits>.tmp, and leaves none behind', () => {
    const file = path.join(DIR, 'a.json')
    const names = new Set()
    const origRename = fs.renameSync
    fs.renameSync = (from, to) => { names.add(path.basename(from)); return origRename(from, to) }
    try { for (let i = 0; i < 20; i++) writeFileAtomic(file, `{"n":${i}}`) } finally { fs.renameSync = origRename }
    expect(names.size).toBe(20)
    for (const n of names) expect(n).toMatch(/^a\.json\.\d+\.tmp$/)
    expect(fs.readFileSync(file, 'utf-8')).toBe('{"n":19}')
    expect(fs.readdirSync(DIR).filter((f) => f.endsWith('.tmp'))).toEqual([])
  })
})

describe('the dev server never polls the data at the app root', () => {
  const ignored = mod.default.server.watch.ignored
  const root = path.dirname(path.dirname(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')))).split(path.sep).join('/')
  it.each(['keys.json', 'discover', 'cache', 'logs', 'launchmode.json', 'electron/last-capture.png', 'players'])('%s is ignored, anchored at the app root', (entry) => {
    expect(ignored.some((g) => typeof g === 'string' && g.toLowerCase() === `${root}/${entry}/**`.toLowerCase())).toBe(true)
  })
  it('never with an unanchored glob that would also hide src/ (hot reload)', () => {
    for (const bad of ['**/discover/**', '**/cache/**', '**/logs/**', '**/features/**']) expect(ignored).not.toContain(bad)
  })
})
