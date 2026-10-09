// /api/chats + /api/chat-load: saved chat sessions, one file per chat in chats/ (the FILE name is the id).
//   GET    /api/chats          → [{ ...chat, id, messages: undefined, messageCount }] newest first
//   POST   /api/chats          body { id?, messages, title?, keepTitle?, type?, mode? } → { id, ok, forked? }
//   DELETE /api/chats?id=      → { ok }
//   GET    /api/chat-load?id=  → the chat file (404 only when it is MISSING)
// The disk copy is read STRICTLY before a save (only ENOENT = new; a busy file retries once, then 503; true non-JSON
// is kept aside as .corrupt-<stamp>), and a disk copy that is not a prefix of the incoming messages FORKS (planChatSave).
// Pure of the dev server: the caller passes the data-folder helpers, so tests run it on a temp folder.
import { planChatSave } from './chatSave.js'

// Chat ids name files: letters, digits, _ and - only (never a path from raw client input).
export const isSafeChatId = (id) => typeof id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(id)

export function createChatsRoute({ dataPath, readUtf8, writeFileAtomic, fs, path, log = console.log }) {
  return (req, res) => {
    const chatsDir = dataPath('chats')
    try { if (!fs.existsSync(chatsDir)) fs.mkdirSync(chatsDir, { recursive: true }) } catch { /* see the offline-share guard */ }

    if (req.method === 'GET') {
      // List all chat sessions
      try {
        // One stat per file, not two per COMPARISON: the comparator used to stat inside the sort,
        // which is O(n log n) disk hits on a folder that may live on a network share.
        const mtime = new Map()
        for (const f of fs.readdirSync(chatsDir)) {
          if (!f.endsWith('.json')) continue
          try { mtime.set(f, fs.statSync(path.join(chatsDir, f)).mtimeMs) } catch { /* vanished mid-list */ }
        }
        const files = [...mtime.keys()].sort((a, b) => mtime.get(b) - mtime.get(a))
        const sessions = files.map(f => {
          try {
            const data = JSON.parse(readUtf8(path.join(chatsDir, f)))
            // The FILE name is the id: an "id" field inside a merged or hand-edited file must not replace it (the list then
            // named a chat chat-load refuses, which could never be opened or deleted).
            return { ...data, id: f.replace('.json', ''), messages: undefined, messageCount: Array.isArray(data.messages) ? data.messages.length : 0 }
          } catch { return null }
        }).filter(Boolean)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(sessions))
      } catch (e) {
        res.statusCode = 500
        res.end(JSON.stringify({ error: e.message }))
      }
    } else if (req.method === 'POST') {
      // Save or update a chat session
      let body = ''
      req.on('data', c => body += c)
      req.on('end', () => {
        try {
          const sent = JSON.parse(body)
          const { id } = sent || {}
          // A save with no message list wrote a chat with none (a blank entry in the list), and on an
          // existing id it could only fork a pointless copy.
          if (!sent || !Array.isArray(sent.messages)) { res.statusCode = 400; res.end(JSON.stringify({ error: 'messages required' })); return }
          // A NEW id is the time in ms, and two computers on one shared folder (or a fork in the same ms)
          // could pick the same one: the second save replaced the first chat. Step until the name is free.
          const freshChatId = () => { let n = Date.now(); while (fs.existsSync(path.join(chatsDir, `${n}.json`))) n++; return String(n) }
          let chatId = id || freshChatId()
          if (!isSafeChatId(String(chatId))) { res.statusCode = 400; res.end(JSON.stringify({ error: 'bad id' })); return }
          let file = path.join(chatsDir, `${chatId}.json`)
          // The SAME chat open on two computers (a shared folder, restore-on-refresh): a save whose
          // messages do not start with what is already on disk would erase the other computer's turns.
          // It is saved as a COPY under a new id instead (the client adopts the id it gets back).
          let forked = false
          // Read what is on disk STRICTLY: only a missing file is "new". A busy/locked file (another computer
          // mid-write on the share) or a torn read used to count as new too, and this save replaced the chat
          // (the other computer's turns lost, a rename undone). One retry, then refuse (the client keeps its id).
          let onDiskChat = null
          if (id) {
            for (let attempt = 0; ; attempt++) {
              try { onDiskChat = JSON.parse(readUtf8(file)); break }
              catch (e) {
                if (e && e.code === 'ENOENT') break
                if (attempt >= 1) {
                  // Truly unparseable (not a busy file): kept aside, and this save becomes the chat, like config.json.
                  // A 503 here refused every later save of this chat forever.
                  if (e instanceof SyntaxError) {
                    try { fs.renameSync(file, `${file}.corrupt-${Date.now()}`) } catch { /* left in place; the write below replaces it */ }
                    break
                  }
                  res.statusCode = 503; res.end(JSON.stringify({ error: 'The chat file could not be read right now. Try again.' })); return
                }
                const until = Date.now() + 300; while (Date.now() < until) { /* short wait for the other writer */ }
              }
            }
          }
          // Fork, per-card state, kept title/type/mode and dropped error bubbles: src/server/chatSave.js (tested).
          const plan = planChatSave({ ...sent, hasId: !!id }, id ? onDiskChat : null)
          const { messages, title, type, mode } = plan
          if (plan.fork) {
            chatId = freshChatId()
            file = path.join(chatsDir, `${chatId}.json`)
            forked = true
            log('[Chat] chat', id, 'changed on disk since it was loaded; saved as a copy', chatId)
          }
          writeFileAtomic(file, JSON.stringify({ title, messages, date: new Date().toISOString(), ...(type ? { type } : {}), ...(mode ? { mode } : {}) }, null, 2))
          log('[Chat] saved:', chatId, '-', title)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ id: chatId, ok: true, ...(forked ? { forked: true } : {}) }))
        } catch (e) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: e.message }))
        }
      })
    } else if (req.method === 'DELETE') {
      const url = new URL(req.url, 'http://localhost')
      const id = url.searchParams.get('id')
      if (!isSafeChatId(id)) { res.statusCode = 400; res.end(JSON.stringify({ error: 'id required' })); return }
      const file = path.join(chatsDir, `${id}.json`)
      res.setHeader('Content-Type', 'application/json')
      try {
        // Gone already (another computer deleted it between a check and the unlink) is a done delete, not a 500.
        try { fs.unlinkSync(file) } catch (e) { if (!e || e.code !== 'ENOENT') throw e }
        res.end(JSON.stringify({ ok: true }))
      } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) }
    } else { res.statusCode = 405; res.end('') }
  }
}

export function createChatLoadRoute({ dataPath, readUtf8 }) {
  return (req, res) => {
    const url = new URL(req.url, 'http://localhost')
    const id = url.searchParams.get('id')
    if (!isSafeChatId(id)) { res.statusCode = 400; res.end(JSON.stringify({ error: 'id required' })); return }
    const file = dataPath('chats', `${id}.json`)
    res.setHeader('Content-Type', 'application/json')
    // Only ENOENT is "not found" (Help treats a 404 as deleted and starts over; existsSync was false on any stat
    // error, a share blip). readUtf8 strips a BOM a hand edit left, which r.json() refused.
    try {
      if (!file) throw Object.assign(new Error('not found'), { code: 'ENOENT' })
      res.end(readUtf8(file))
    } catch (e) {
      res.statusCode = e && e.code === 'ENOENT' ? 404 : 500
      res.end(JSON.stringify({ error: e && e.code === 'ENOENT' ? 'not found' : e.message }))
    }
  }
}
