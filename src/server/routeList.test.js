// Every /api route the server registers is named in CLAUDE.md's "Porting to phones" list (on-device or desktop-only),
// and every name there is a real route. The list is what a phone build's on-device router is written from: a route
// added without it (or one removed while still listed) is found here, not on a phone.
// Temp data and key folders: registering the routes starts timers that touch both (the key sync, the backup).
import { describe, it, expect, afterAll } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ebiki-routelist-'))
process.env.EBIKI_DATA_DIR = DIR
process.env.EBIKI_ENV_DIR = DIR
const mod = await import('../../vite.config.js')
afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }))

const registered = new Set()
const plugin = mod.default.plugins.flat().find((p) => p && p.name === 'api-plugin')
plugin.configureServer({
  middlewares: { use: (a) => { if (typeof a === 'string' && a.startsWith('/api/')) registered.add(a.slice('/api/'.length)) } },
  httpServer: null, ws: { send() {} }, hot: { send() {} },
})

const claude = fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..', 'CLAUDE.md'), 'utf-8')
const section = (() => {
  const start = claude.indexOf('**Routes an on-device router must answer**')
  const end = claude.indexOf('Keep this list current', start)
  return start >= 0 && end > start ? claude.slice(start, end) : ''
})()
const listed = new Set([...section.matchAll(/`([a-z][a-z0-9/-]*)`/g)].map((m) => m[1]))
const NOT_MIDDLEWARE = new Set(['alive-ws']) // a WebSocket upgrade (src/server/aliveSocket.js), not a middleware mount

describe('the phone route list (CLAUDE.md) matches the server', () => {
  it('finds the list', () => {
    expect(section).not.toBe('')
    expect(listed.size).toBeGreaterThan(20)
  })
  it('names every registered /api route', () => {
    const missing = [...registered].filter((r) => !listed.has(r))
    expect(missing).toEqual([])
  })
  it('names no route that does not exist', () => {
    const stale = [...listed].filter((r) => !registered.has(r) && !NOT_MIDDLEWARE.has(r))
    expect(stale).toEqual([])
  })
})
