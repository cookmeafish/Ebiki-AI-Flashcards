// "Add to deck" for Legends items: through ctx.cards.addNew (the app's one door for new cards, which also
// announces CARDS_ADDED), into the deck SAVED on the mode (never a silent fallback to the first deck: the learner
// picks it next to the add buttons), tagged so the learner can find them. Only ever on a click.
import { updateMap, peekMap } from './store'
import { areaIndex } from './map'

export const CARD_TAGS = ['ebiki', 'legends']
export const areaTag = (areaId) => `lg-${String(areaId || '').replace(/[^a-z0-9-]/g, '')}`

// Items being added right now, by mode + item id. One item can be offered by its own button AND by "Add all";
// a click on both (or a double click) must not add it twice (card adds allow duplicates, so Anki won't catch it).
const inFlight = new Set()
const flightKey = (modeId, itemId) => `${modeId}:${itemId}`
export const isAdding = (modeId, itemId) => inFlight.has(flightKey(modeId, itemId))

// Adds the items not added yet; returns { added, failed, message }. Items already carrying a note id, or being
// added by another click, are skipped.
export async function addItemsToDeck(ctx, modeId, areaId, items) {
  const { subject, cards } = ctx
  const deck = subject.modeDeck
  if (!deck || ctx.ankiConnected === false) return { added: 0, failed: items.length, message: ctx.t('lg_noDeck') }
  const mine = items.filter((it) => !it.cardNoteId && !inFlight.has(flightKey(modeId, it.id)))
  for (const it of mine) inFlight.add(flightKey(modeId, it.id))
  const done = new Map()
  let failed = 0; let message = ''
  try {
    for (const it of mine) {
      try {
        const id = await cards.addNew(deck, cards.frontHtml(it.front), cards.backHtml(it.back), [...CARD_TAGS, areaTag(areaId)])
        done.set(it.id, id || true)
      } catch (e) { failed++; message = String(e?.message || e) }
    }
    if (done.size) await markAdded(modeId, areaId, done)
  } finally {
    for (const it of mine) inFlight.delete(flightKey(modeId, it.id))
  }
  return { added: done.size, failed, message }
}

async function markAdded(modeId, areaId, done) {
  await updateMap(modeId, (m) => {
    const k = m ? areaIndex(m, areaId) : -1
    if (k < 0) return m
    return { ...m, areas: m.areas.map((a, j) => (j !== k ? a : { ...a, items: a.items.map((it) => (done.has(it.id) ? { ...it, cardNoteId: done.get(it.id) } : it)) })) }
  })
}

// The live copy of an area's items (after an add, the map in the store has the note ids).
export const liveItems = (modeId, areaId, ids) => {
  const a = peekMap(modeId)?.areas?.find((x) => x.id === areaId)
  const byId = new Map((a?.items || []).map((it) => [it.id, it]))
  return (ids || []).map((id) => byId.get(id)).filter(Boolean)
}
