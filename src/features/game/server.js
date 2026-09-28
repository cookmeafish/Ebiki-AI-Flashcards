// SERVER half of the game feature, loaded by vite.config.js through ../server.js (never by the page).
//
// Storage:
//   <data folder>/players/<playerId>.json  one file per PLAYER (a person), shared by every computer on the
//                                          data folder: a family sees each other, one person on two
//                                          computers picks the same player on both.
//   <app folder>/player.json               THIS computer: { machineId, playerId }. Machine-local on
//                                          purpose (which person uses this computer), gitignored.
// Every write MERGES with the file on disk (counters take the max per machine, see engine.js), so two
// computers writing at once can't lose each other's progress.
import { mergePlayers } from './engine.js'

const PLAYERS_DIR = 'players'
const LOCAL_FILE = 'player.json'
const ID_RE = /^[a-z0-9-]{6,48}$/
const MAX_BODY_BYTES = 2 * 1024 * 1024

const newId = (crypto) => crypto.randomUUID().replace(/-/g, '').slice(0, 16)

export default {
  id: 'game',
  dataEntries: [PLAYERS_DIR],
  dataRoutes: ['/players'],
  localFiles: [LOCAL_FILE],
  register(server, { dataPath, readUtf8, writeFileAtomic, appRoot, fs, path, crypto }) {
    const send = (res, status, body) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)) }
    const readBody = (req) => new Promise((resolve, reject) => {
      let b = ''
      req.on('data', (c) => { b += c; if (b.length > MAX_BODY_BYTES) { reject(new Error('too large')); req.destroy() } })
      req.on('end', () => { try { resolve(JSON.parse(b || '{}')) } catch (e) { reject(e) } })
    })
    // A MISSING file is "nothing yet"; any other read error must not be mistaken for it (a write would
    // then replace real progress with just this computer's).
    const readJson = (file) => {
      try { return JSON.parse(readUtf8(file)) } catch (e) { if (e?.code === 'ENOENT') return null; throw e }
    }
    const localFile = path.join(appRoot, LOCAL_FILE)
    const readLocal = () => {
      let cur = null
      try { cur = readJson(localFile) } catch { cur = null } // damaged: start over (it only names ids)
      if (cur?.machineId && ID_RE.test(cur.machineId)) return cur
      const fresh = { machineId: newId(crypto), playerId: ID_RE.test(cur?.playerId || '') ? cur.playerId : '' }
      writeFileAtomic(localFile, JSON.stringify(fresh, null, 2))
      return fresh
    }

    // This computer's identity. NOT a data route: it must answer with the share down.
    server.middlewares.use('/api/player-local', async (req, res) => {
      try {
        if (req.method === 'GET') return send(res, 200, readLocal())
        if (req.method !== 'POST') return send(res, 405, { error: 'method' })
        const { playerId } = await readBody(req)
        if (playerId !== '' && !ID_RE.test(String(playerId || ''))) return send(res, 400, { error: 'bad player id' })
        const next = { ...readLocal(), playerId }
        writeFileAtomic(localFile, JSON.stringify(next, null, 2))
        send(res, 200, next)
      } catch (e) { send(res, 500, { error: e.message }) }
    })

    server.middlewares.use('/api/players', async (req, res) => {
      const dir = dataPath(PLAYERS_DIR)
      try {
        if (req.method === 'GET') {
          const players = []
          let names = []
          try { names = fs.readdirSync(dir) } catch (e) { if (e?.code !== 'ENOENT') throw e }
          for (const n of names) {
            if (!n.endsWith('.json') || !ID_RE.test(n.slice(0, -5))) continue
            try { const p = readJson(path.join(dir, n)); if (p?.id) players.push(p) } catch { /* one damaged file hides one player */ }
          }
          return send(res, 200, { players })
        }
        if (req.method !== 'POST') return send(res, 405, { error: 'method' })
        const { player } = await readBody(req)
        if (!player || !ID_RE.test(String(player.id || '')) || typeof player.days !== 'object') return send(res, 400, { error: 'player required' })
        const file = path.join(dir, `${player.id}.json`) // id checked above: never a path from raw input
        const merged = mergePlayers(readJson(file), player)
        fs.mkdirSync(dir, { recursive: true })
        writeFileAtomic(file, JSON.stringify(merged))
        send(res, 200, { player: merged })
      } catch (e) { send(res, e instanceof SyntaxError ? 400 : 500, { error: e.message }) }
    })
  },
}
