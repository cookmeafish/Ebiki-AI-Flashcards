// What a chat save (POST /api/chats) writes, given the chat already on disk. Pure: vite.config.js does the
// file reads, the id choice and the write.
//
//   planChatSave({ messages, title, type, mode, keepTitle, hasId }, onDisk)
//     → { fork, messages, title, type, mode }
//
// Rules (CLAUDE.md, "Chat saves read the disk copy STRICTLY"):
//   • `error: true` bubbles are never compared or SAVED. A new chat and a forked copy used to keep them, so the
//     next save from the other surface (Help drops them) no longer started with what was on disk and forked.
//   • A disk copy that is not a PREFIX of the incoming turns forks (the same chat open on two computers).
//   • The same turns keep the disk's `synced`/`addedTo` on chat cards (same position, front and back), else a
//     stale window reset "Added" and a second click made a duplicate note.
//   • keepTitle: the title, type and mode already on disk win (a rename, a Help chat continued from Chat, the
//     mode a chat was made in). A fork takes them from the chat it copies.
//   • A Help chat belongs to no mode.

const notError = (m) => !(m && m.error)
const turnKey = (m) => `${(m && m.role) || ''}\u0000${String((m && (m.content ?? m.text)) ?? '')}`

export function planChatSave(body, onDisk) {
  const { keepTitle, hasId } = body || {}
  let messages = (Array.isArray(body?.messages) ? body.messages : []).filter(notError)
  let title = typeof body?.title === 'string' ? body.title : ''
  let type = body?.type
  let mode = body?.mode
  let fork = false
  const disk = hasId && onDisk && typeof onDisk === 'object' ? onDisk : null
  if (disk) {
    const had = (Array.isArray(disk.messages) ? disk.messages : []).filter(notError)
    if (had.length > messages.length || had.some((m, i) => turnKey(m) !== turnKey(messages[i]))) {
      fork = true
    } else {
      messages = messages.map((m, i) => {
        const hadCards = Array.isArray(had[i]?.cards) ? had[i].cards : []
        if (i >= had.length || !hadCards.some((c) => c && c.synced) || !m || !Array.isArray(m.cards)) return m
        return { ...m, cards: m.cards.map((c, j) => {
          const d = hadCards[j]
          const done = c && !c.synced && d && d.synced && d.front === c.front && d.back === c.back && d
          return done ? { ...c, synced: true, ...(done.addedTo ? { addedTo: done.addedTo } : {}) } : c
        }) }
      })
    }
    if (keepTitle) {
      if (typeof disk.title === 'string' && disk.title) title = disk.title
      if (!type && typeof disk.type === 'string') type = disk.type
      if (typeof disk.mode === 'string' && disk.mode) mode = disk.mode
    }
  }
  if (type === 'help') mode = undefined
  return { fork, messages, title, type, mode }
}
