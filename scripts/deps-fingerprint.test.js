// The launchers install before starting when the dependency lists changed since the last install (a manual git
// pull, a branch switch, several updates at once). These tests use a scratch folder, never the app's own.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fingerprint, needsInstall, writeStamp, STAMP_FILE } from './deps-fingerprint.mjs'

let dir
const write = (name, obj) => fs.writeFileSync(path.join(dir, name), typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2))
const pkg = (extra = {}) => ({ name: 'ebiki', version: '1.0.0', dependencies: { react: '^19.0.0' }, ...extra })
const lock = (version = '1.0.0', react = '19.0.0') => ({ name: 'ebiki', version, lockfileVersion: 3, packages: { '': { name: 'ebiki', version }, 'node_modules/react': { version: react } } })

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ebiki-deps-'))
  write('package.json', pkg()); write('package-lock.json', lock())
  fs.mkdirSync(path.join(dir, 'node_modules'))
})
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

describe('dependency fingerprint', () => {
  it('asks for an install when nothing was ever stamped, then not after a stamp', () => {
    expect(needsInstall(dir)).toBe(true)
    writeStamp(dir)
    expect(fs.existsSync(path.join(dir, STAMP_FILE))).toBe(true)
    expect(needsInstall(dir)).toBe(false)
  })
  it('a new release that only bumps the version needs no install', () => {
    writeStamp(dir)
    write('package.json', pkg({ version: '1.3.0' })); write('package-lock.json', lock('1.3.0'))
    expect(needsInstall(dir)).toBe(false)
  })
  it('a new dependency, or a different locked version, needs an install (however many releases ago it came)', () => {
    writeStamp(dir)
    write('package.json', pkg({ version: '1.3.0', dependencies: { react: '^19.0.0', sharp: '^0.35.5' } }))
    expect(needsInstall(dir)).toBe(true)
    writeStamp(dir)
    write('package-lock.json', lock('1.3.0', '19.1.0'))
    expect(needsInstall(dir)).toBe(true)
  })
  it('a missing node_modules always needs an install; an unreadable package.json cannot tell', () => {
    writeStamp(dir)
    fs.rmSync(path.join(dir, 'node_modules'), { recursive: true })
    expect(needsInstall(dir)).toBe(true)
    write('package.json', '{ not json')
    expect(needsInstall(dir)).toBeNull()
    expect(fingerprint(dir)).toBeNull()
  })
  it('reads files saved with a byte order mark', () => {
    writeStamp(dir)
    write('package.json', '﻿' + JSON.stringify(pkg()))
    expect(needsInstall(dir)).toBe(false)
  })
})
