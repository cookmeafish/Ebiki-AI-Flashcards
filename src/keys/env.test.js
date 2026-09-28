// Regression tests for the API-key file layer.
//
// Every case here is a bug that actually destroyed a user's key: a save that
// mentioned one provider deleted another, and the backup meant to recover from
// that had already been overwritten with the reduced set. The whole point of
// these is that a key can only ever leave .env because someone SAID SO.
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ebiki-keys-'))
process.env.EBIKI_ENV_DIR = DIR

const { readEnvFile, parseEnv, writeEnv, ENV_FILE, ENV_BAK, ENV_CLEARED, ENV_DECLINED, readDeclined } = await import('../../vite.config.js')

const ANT = 'sk-ant-aaaaaaaaaaaaaaaaaaaa'
const OAI = 'sk-proj-bbbbbbbbbbbbbbbbbbbb'

const seed = (content) => fs.writeFileSync(ENV_FILE, content, 'utf-8')
const wipe = () => {
  for (const f of [ENV_FILE, ENV_BAK, ENV_CLEARED, ENV_DECLINED]) fs.rmSync(f, { force: true })
}

beforeEach(wipe)
afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }))

describe('writeEnv merges instead of replacing', () => {
  it('a save naming ONE provider does not delete the other (the reported bug)', () => {
    seed(`VITE_ANTHROPIC_API_KEY=${ANT}\nVITE_OPENAI_API_KEY=${OAI}\n`)
    writeEnv({ openai: OAI })
    expect(readEnvFile(ENV_FILE)).toEqual({ anthropic: ANT, openai: OAI })
  })

  it('a client that read only one provider cannot erase the other', () => {
    seed(`VITE_ANTHROPIC_API_KEY=${ANT}\nVITE_OPENAI_API_KEY=${OAI}\n`)
    writeEnv({ openai: 'sk-proj-newnewnewnewnewnew' })
    const after = readEnvFile(ENV_FILE)
    expect(after.anthropic).toBe(ANT)
    expect(after.openai).toBe('sk-proj-newnewnewnewnewnew')
  })

  it('an empty payload changes nothing', () => {
    seed(`VITE_ANTHROPIC_API_KEY=${ANT}\n`)
    writeEnv({})
    expect(readEnvFile(ENV_FILE)).toEqual({ anthropic: ANT })
  })

  it('a non-string value can never delete a key', () => {
    seed(`VITE_ANTHROPIC_API_KEY=${ANT}\n`)
    writeEnv({ anthropic: null, openai: undefined })
    expect(readEnvFile(ENV_FILE)).toEqual({ anthropic: ANT })
  })

  it('deleting requires SAYING SO: a named empty value still clears', () => {
    seed(`VITE_ANTHROPIC_API_KEY=${ANT}\nVITE_OPENAI_API_KEY=${OAI}\n`)
    writeEnv({ anthropic: '' })
    expect(readEnvFile(ENV_FILE)).toEqual({ openai: OAI })
  })

  it('reads and rewrites a .env with Windows (CRLF) line endings', () => {
    seed(`SOME_OTHER=1\r\nVITE_ANTHROPIC_API_KEY=${ANT}\r\nVITE_OPENAI_API_KEY=${OAI}\r\n`)
    expect(readEnvFile(ENV_FILE)).toEqual({ anthropic: ANT, openai: OAI })
    writeEnv({ openai: 'sk-proj-dddddddddddddddddddd' })
    expect(readEnvFile(ENV_FILE)).toEqual({ anthropic: ANT, openai: 'sk-proj-dddddddddddddddddddd' })
    expect(fs.readFileSync(ENV_FILE, 'utf-8')).toContain('SOME_OTHER=1')
  })

  it('preserves unrelated lines in the file', () => {
    seed(`SOME_OTHER=1\nVITE_OPENAI_API_KEY=${OAI}\n`)
    writeEnv({ anthropic: ANT })
    expect(fs.readFileSync(ENV_FILE, 'utf-8')).toContain('SOME_OTHER=1')
  })
})

describe('.env.bak only ever grows', () => {
  it('a write that drops a provider cannot poison the backup', () => {
    seed(`VITE_ANTHROPIC_API_KEY=${ANT}\nVITE_OPENAI_API_KEY=${OAI}\n`)
    parseEnv()                                   // mirrors both into the backup
    expect(readEnvFile(ENV_BAK)).toEqual({ anthropic: ANT, openai: OAI })
    writeEnv({ openai: 'sk-proj-cccccccccccccccccccc' })
    expect(readEnvFile(ENV_BAK).anthropic).toBe(ANT)   // still recoverable
  })

  it('a deliberate clear DOES leave the backup, so it never comes back', () => {
    seed(`VITE_ANTHROPIC_API_KEY=${ANT}\nVITE_OPENAI_API_KEY=${OAI}\n`)
    parseEnv()
    writeEnv({ anthropic: '' })
    expect(readEnvFile(ENV_BAK).anthropic).toBeUndefined()
    expect(readEnvFile(ENV_BAK).openai).toBe(OAI)
  })

  it('an emptied .env heals from the backup', () => {
    seed(`VITE_ANTHROPIC_API_KEY=${ANT}\n`)
    parseEnv()
    seed('\n')                                   // something wiped it
    expect(parseEnv()).toEqual({ anthropic: ANT })
  })

  it('does NOT heal what the user cleared on purpose', () => {
    seed(`VITE_ANTHROPIC_API_KEY=${ANT}\n`)
    parseEnv()
    writeEnv({ anthropic: '' })                  // user cleared the only key
    expect(fs.existsSync(ENV_CLEARED)).toBe(true)
    expect(parseEnv()).toEqual({})
  })
})

describe('a provider cleared on purpose is remembered per provider', () => {
  // The shared-folder pull skips declined providers; without this record, clearing
  // a key on a share was undone by the very next sync.
  it('clearing one provider declines it and leaves the other alone', () => {
    seed(`VITE_ANTHROPIC_API_KEY=${ANT}\nVITE_OPENAI_API_KEY=${OAI}\n`)
    writeEnv({ anthropic: '' })
    expect(readDeclined()).toEqual(['anthropic'])
    expect(readEnvFile(ENV_FILE)).toEqual({ openai: OAI })
  })

  it('storing a key again lifts the decline', () => {
    seed(`VITE_ANTHROPIC_API_KEY=${ANT}\n`)
    writeEnv({ anthropic: '' })
    writeEnv({ anthropic: ANT })
    expect(readDeclined()).toEqual([])
    expect(fs.existsSync(ENV_DECLINED)).toBe(false)
  })
})

describe('a .env saved with a UTF-8 byte-order mark', () => {
  it('still finds the first key, and a save does not duplicate it', () => {
    seed(`﻿VITE_ANTHROPIC_API_KEY=${ANT}\nVITE_OPENAI_API_KEY=${OAI}\n`)
    expect(readEnvFile(ENV_FILE)).toMatchObject({ anthropic: ANT, openai: OAI })
    writeEnv({ openai: 'sk-proj-newnewnewnewnewnew' })
    const text = fs.readFileSync(ENV_FILE, 'utf-8')
    expect(text.match(/VITE_ANTHROPIC_API_KEY=/g)).toHaveLength(1)
    expect(readEnvFile(ENV_FILE)).toMatchObject({ anthropic: ANT, openai: 'sk-proj-newnewnewnewnewnew' })
  })
})
