// The game store against a fake server: first run creates a player, awards land on today's record for
// THIS computer, saves go through the server merge, and nothing is written after a failed read.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mergePlayers, dateKey } from './engine'

function fakeServer({ players = [], local = { machineId: 'mach01', playerId: '' }, failRead = false } = {}) {
  const disk = new Map(players.map((p) => [p.id, p]))
  const state = { local: { ...local }, posts: 0, failPost: false }
  globalThis.fetch = vi.fn(async (url, init = {}) => {
    const body = init.body ? JSON.parse(init.body) : null
    const ok = (j) => ({ ok: true, status: 200, json: async () => j })
    if (url === '/api/player-local') {
      if (init.method === 'POST') state.local.playerId = body.playerId
      return ok(state.local)
    }
    if (url === '/api/players') {
      if (init.method === 'POST') {
        state.posts++
        if (state.failPost) return { ok: false, status: 503, json: async () => ({}) }
        const merged = mergePlayers(disk.get(body.player.id), body.player)
        disk.set(merged.id, merged)
        return ok({ player: merged })
      }
      if (failRead) return { ok: false, status: 503, json: async () => ({ unreachable: true }) }
      return ok({ players: [...disk.values()] })
    }
    throw new Error('unexpected ' + url)
  })
  return { disk, state }
}

// A fresh store module per test (it keeps module-level state).
async function freshStore() {
  vi.resetModules()
  return import('./store')
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
  globalThis.localStorage = { store: {}, getItem(k) { return this.store[k] ?? null }, setItem(k, v) { this.store[k] = String(v) }, removeItem(k) { delete this.store[k] } }
})

describe('game store', () => {
  it('creates a player on the first run and remembers it for this computer', async () => {
    const srv = fakeServer()
    const s = await freshStore()
    await s.initGame()
    expect(s.getGame().status).toBe('ready')
    const id = s.getGame().player.id
    expect(srv.state.local.playerId).toBe(id)
    expect(srv.disk.has(id)).toBe(true)
  })

  it('awards XP to today on this machine and saves it merged', async () => {
    const srv = fakeServer()
    const s = await freshStore()
    await s.initGame()
    expect(s.award('card', { correct: true })).toBe(15)
    s.award('chat')
    const p = s.getGame().player
    expect(p.days[dateKey()].mach01).toMatchObject({ xp: 16, cards: 1, correct: 1, chat: 1 })
    expect(p.days[dateKey()].mach01.quests).toHaveLength(3)
    await vi.advanceTimersByTimeAsync(2000)
    expect(srv.disk.get(p.id).days[dateKey()].mach01.xp).toBe(16)
  })

  it('asks who is studying when the folder has players but this computer picked none', async () => {
    fakeServer({ players: [{ id: 'player-a1', name: 'Ana', days: {} }, { id: 'player-b2', name: 'Bo', days: {} }] })
    const s = await freshStore()
    await s.initGame()
    expect(s.getGame().status).toBe('choose')
    s.award('card') // before a choice: held, not lost
    await s.choosePlayer('player-b2')
    expect(s.getGame().player.name).toBe('Bo')
    expect(s.getGame().player.days[dateKey()].mach01.cards).toBe(1)
  })

  it('never writes after a failed read', async () => {
    const srv = fakeServer({ failRead: true })
    const s = await freshStore()
    await s.initGame()
    expect(s.getGame().status).toBe('error')
    s.award('card')
    await vi.advanceTimersByTimeAsync(5000)
    expect(srv.state.posts).toBe(0)
  })

  it('tries a failed save again by itself (no later award needed)', async () => {
    const srv = fakeServer()
    const s = await freshStore()
    await s.initGame()
    const id = s.getGame().player.id
    srv.state.failPost = true
    s.award('card')
    await vi.advanceTimersByTimeAsync(2000) // the debounced save fails
    const failed = srv.state.posts
    srv.state.failPost = false // the share is back
    await vi.advanceTimersByTimeAsync(31000)
    expect(srv.state.posts).toBeGreaterThan(failed)
    expect(srv.disk.get(id).days[dateKey()].mach01.cards).toBe(1)
    expect(localStorage.getItem('ebiki-game-unsaved')).toBe(null)
  })

  it('pauses saving while the data folder is switching', async () => {
    const srv = fakeServer()
    const s = await freshStore()
    let switching = false
    s.configureGame({ isBlocked: () => switching })
    await s.initGame()
    const before = srv.state.posts
    switching = true
    s.award('card')
    await vi.advanceTimersByTimeAsync(5000)
    expect(srv.state.posts).toBe(before)
  })

  it("keeps another player's unsaved backup when the next player saves, and folds it back on choosing them", async () => {
    const srv = fakeServer({ players: [{ id: 'player-a1', name: 'Ana', days: {} }, { id: 'player-b2', name: 'Bo', days: {} }], local: { machineId: 'mach01', playerId: 'player-a1' } })
    const s = await freshStore()
    await s.initGame()
    expect(s.getGame().player.id).toBe('player-a1')
    srv.state.failPost = true
    s.award('card')
    await s.saveGameNow() // fails: kept on this device
    expect(JSON.parse(localStorage.getItem('ebiki-game-unsaved')).id).toBe('player-a1')
    srv.state.failPost = false
    srv.state.local.playerId = '' // "Switch player"
    await s.initGame()
    expect(s.getGame().status).toBe('choose')
    await s.choosePlayer('player-b2')
    s.award('chat')
    await s.saveGameNow()
    expect(JSON.parse(localStorage.getItem('ebiki-game-unsaved')).id).toBe('player-a1') // Bo's save never erased Ana's
    srv.state.local.playerId = ''
    await s.initGame()
    await s.choosePlayer('player-a1')
    expect(s.getGame().player.days[dateKey()].mach01.cards).toBe(1)
    await vi.advanceTimersByTimeAsync(2000)
    expect(srv.disk.get('player-a1').days[dateKey()].mach01.cards).toBe(1)
    expect(localStorage.getItem('ebiki-game-unsaved')).toBe(null)
  })

  it('streakOf computes once per player object and again for a changed player', async () => {
    fakeServer()
    const s = await freshStore()
    await s.initGame()
    const p = s.getGame().player
    const a = s.streakOf(p)
    expect(s.streakOf(p)).toBe(a) // same object: no second walk
    s.award('card')
    const b = s.streakOf(s.getGame().player)
    expect(b).not.toBe(a)
    expect(b.todayDone).toBe(true)
    expect(a.todayDone).toBe(false)
  })
})
