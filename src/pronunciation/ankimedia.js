// Tier 0 — audio already embedded in the Anki card itself. Once a native recording has
// been embedded ([sound:…] on the back), every later play is served straight from Anki's
// local media folder: instant, offline, and it never touches Wikimedia again (no rate
// limits). Only runs when the surface knows its note/card id.
import { ankiCardsInfo, ankiNotesInfo, ankiRetrieveMediaFile } from '../utils/anki'

const MIME = { ogg: 'audio/ogg', oga: 'audio/ogg', wav: 'audio/wav', mp3: 'audio/mpeg', opus: 'audio/ogg', flac: 'audio/flac' }

export async function resolveAnkiMedia({ noteId, cardId }) {
  if (!noteId && !cardId) return null
  try {
    const nid = noteId || (await ankiCardsInfo([cardId]))?.[0]?.note
    if (!nid) return null
    const note = (await ankiNotesInfo([nid]))?.[0]
    if (!note) return null
    const allFields = Object.values(note.fields || {}).map((f) => f.value).join('\n')
    const m = allFields.match(/\[sound:([^\]]+)\]/)
    if (!m) return null
    const b64 = await ankiRetrieveMediaFile(m[1])
    if (!b64 || typeof b64 !== 'string') return null
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
    const ext = m[1].split('.').pop().toLowerCase()
    const blob = new Blob([bytes], { type: MIME[ext] || 'audio/ogg' })
    return { kind: 'url', source: 'anki', audioUrl: URL.createObjectURL(blob), fileName: m[1] }
  } catch { return null } // Anki closed / file missing → fall through to the network tiers
}
