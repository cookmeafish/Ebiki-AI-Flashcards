// The /api/players handler against a real temp folder: a damaged player file must not block saves forever.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import crypto from 'crypto'
import { EventEmitter } from 'events'
import game from './server.js'

let root
let routes

const writeFileAtomic = (file, text) => { const tmp = `${file}.${process.pid}.tmp`; fs.writeFileSync(tmp, text); fs.renameSync(tmp, file) }

const call = (route, method, body) => new Promise((resolve) => {
  const req = new EventEmitter()
  req.method = method
  req.destroy = () => {}
  const res = { statusCode: 0, setHeader() {}, end: (text) => resolve({ status: res.statusCode, body: JSON.parse(text) }) }
  routes[route](req, res)
  setTimeout(() => { if (body !== undefined) req.emit('data', typeof body === 'string' ? body : JSON.stringify(body)); req.emit('end') }, 0)
})

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'ebiki-game-'))
  routes = {}
  const server = { middlewares: { use: (p, fn) => { routes[p] = fn } } }
  game.register(server, {
    dataPath: (p) => path.join(root, p), readUtf8: (f) => fs.readFileSync(f, 'utf8'),
    writeFileAtomic, appRoot: root, fs, path, crypto,
  })
})
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }) })

const player = { id: 'player-one', name: 'P', days: { '2026-10-07': { machine1: { xp: 30 } } } }

describe('/api/players', () => {
  it('saves and reads back a player', async () => {
    const r = await call('/api/players', 'POST', { player })
    expect(r.status).toBe(200)
    const g = await call('/api/players', 'GET')
    expect(g.body.players.map((p) => p.id)).toEqual(['player-one'])
  })

  it('a damaged player file is parked and the save still lands', async () => {
    fs.mkdirSync(path.join(root, 'players'))
    fs.writeFileSync(path.join(root, 'players', 'player-one.json'), '{"id":"player-one","days":{')
    const r = await call('/api/players', 'POST', { player })
    expect(r.status).toBe(200)
    const names = fs.readdirSync(path.join(root, 'players'))
    expect(names).toContain('player-one.json')
    expect(names.some((n) => n.startsWith('player-one.json.corrupt-'))).toBe(true)
    expect(JSON.parse(fs.readFileSync(path.join(root, 'players', 'player-one.json'), 'utf8')).id).toBe('player-one')
  })

  it('a file repaired before the re-read is merged, not parked', async () => {
    const file = path.join(root, 'players', 'player-one.json')
    fs.mkdirSync(path.join(root, 'players'))
    fs.writeFileSync(file, '{"id":"player-one"')
    const other = { ...player, days: { '2026-10-06': { machine2: { xp: 50 } } } }
    setTimeout(() => fs.writeFileSync(file, JSON.stringify(other)), 300) // another computer finishes its write
    const r = await call('/api/players', 'POST', { player })
    expect(r.status).toBe(200)
    expect(fs.readdirSync(path.join(root, 'players')).some((n) => n.includes('.corrupt-'))).toBe(false)
    expect(Object.keys(r.body.player.days).sort()).toEqual(['2026-10-06', '2026-10-07'])
  })

  it('a malformed request body is a 400', async () => {
    const r = await call('/api/players', 'POST', '{not json')
    expect(r.status).toBe(400)
  })
})
