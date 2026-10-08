// JOIN of a folder that ends up with no data entry (a computer with no data of its own joining a new empty share)
// must still count as a data folder, else every data route answered 503 there and nothing could ever be saved.
import { describe, it, expect, afterAll } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ebiki-join-empty-'))
process.env.EBIKI_DATA_DIR = DIR
process.env.EBIKI_ENV_DIR = DIR
const { markJoinedFolder } = await import('../../vite.config.js')
afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }))

describe('markJoinedFolder', () => {
  it('gives an empty joined folder a modes/ entry', () => {
    const share = path.join(DIR, 'empty-share')
    fs.mkdirSync(share)
    markJoinedFolder(share)
    expect(fs.statSync(path.join(share, 'modes')).isDirectory()).toBe(true)
  })

  it('leaves a folder that already holds data alone', () => {
    const share = path.join(DIR, 'used-share')
    fs.mkdirSync(share)
    fs.writeFileSync(path.join(share, 'config.json'), '{"onboarded":true}')
    markJoinedFolder(share)
    expect(fs.readdirSync(share)).toEqual(['config.json'])
  })
})
