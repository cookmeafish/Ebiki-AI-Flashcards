// AnkiConnect API wrapper — communicates via Vite proxy at /api/anki

function ankiLog(msg, data) {
  const entry = data !== undefined ? `${msg} ${JSON.stringify(data)}` : msg
  console.log(`[Anki] ${entry}`)
}

async function ankiRequest(action, params = {}) {
  ankiLog(`request: ${action}`, params)
  const res = await fetch('/api/anki', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, version: 6, params }),
  })
  const data = await res.json()
  ankiLog(`response: ${action}`, data)
  if (data.error) throw new Error(data.error)
  return data.result
}

export async function ankiPing() {
  try {
    const version = await ankiRequest('version')
    ankiLog(`connected, AnkiConnect version: ${version}`)
    return true
  } catch (err) {
    ankiLog(`ping failed: ${err.message}`)
    return false
  }
}

export async function ankiGetDecks() {
  const decks = await ankiRequest('deckNames')
  ankiLog(`found ${decks.length} decks`, decks)
  return decks
}

export async function ankiCreateDeck(deckName) {
  ankiLog(`creating deck "${deckName}"`)
  return ankiRequest('createDeck', { deck: deckName })
}

export async function ankiAddNote(deckName, front, back, tags = [], allowDuplicate = false) {
  ankiLog(`adding note to deck "${deckName}"`, { front, back, tags })
  const noteId = await ankiRequest('addNote', {
    note: {
      deckName,
      modelName: 'Basic',
      fields: { Front: front, Back: back },
      options: { allowDuplicate },
      tags,
    },
  })
  ankiLog(`note added, id: ${noteId}`)
  return noteId
}

// Duplicate pre-check. Returns true if the note can be added (no duplicate). On any error
// (e.g. Anki not running) returns true so we never block adding on a flaky check.
export async function ankiCanAddNote(deckName, front, back) {
  try {
    const res = await ankiRequest('canAddNotes', {
      notes: [{ deckName, modelName: 'Basic', fields: { Front: front, Back: back }, tags: [] }],
    })
    return Array.isArray(res) ? res[0] !== false : true
  } catch {
    return true
  }
}

export async function ankiFindCards(query) {
  ankiLog(`finding cards: ${query}`)
  const cards = await ankiRequest('findCards', { query })
  ankiLog(`found ${cards.length} cards`)
  return cards
}

export async function ankiCardsInfo(cards) {
  ankiLog(`getting info for ${cards.length} cards`)
  return ankiRequest('cardsInfo', { cards })
}

export async function ankiAnswerCards(answers) {
  ankiLog(`answering ${answers.length} cards`, answers)
  return ankiRequest('answerCards', { answers })
}

// --- GUI reviewer actions ---------------------------------------------------
// answerCards (above) only works on the card at the TOP of the scheduler queue;
// it throws "not at top of queue" for anything else (e.g. a new card, or cards
// answered out of order). To reliably record reviews with correct SM-2/FSRS
// intervals we drive Anki's real reviewer: start a review, then for each card
// the scheduler presents, show the answer and answer it with our rating.
export async function ankiGuiDeckReview(name) {
  ankiLog(`gui deck review: ${name}`)
  return ankiRequest('guiDeckReview', { name })
}

export async function ankiGuiCurrentCard() {
  return ankiRequest('guiCurrentCard')
}

export async function ankiGuiShowAnswer() {
  return ankiRequest('guiShowAnswer')
}

export async function ankiGuiAnswerCard(ease) {
  ankiLog(`gui answer card: ease ${ease}`)
  return ankiRequest('guiAnswerCard', { ease })
}

export async function ankiGuiDeckBrowser() {
  return ankiRequest('guiDeckBrowser')
}

export async function ankiGetDeckStats(decks) {
  ankiLog(`getting deck stats for: ${decks.join(', ')}`)
  return ankiRequest('getDeckStats', { decks })
}

// Number of reviews done today (matches Anki's own "reviews today" figure).
export async function ankiGetNumCardsReviewedToday() {
  return ankiRequest('getNumCardsReviewedToday')
}

// Reviews per day: [["YYYY-MM-DD", count], ...] (used for the chart + streak).
export async function ankiGetNumCardsReviewedByDay() {
  return ankiRequest('getNumCardsReviewedByDay')
}

// Today's pass-rate straight from the review log (every review since local midnight, across all
// decks). Cumulative — a card failed then re-passed counts as one fail + one pass — so the number
// is STABLE and won't flip between refreshes the way a most-recent-ease query does.
export async function ankiGetTodayReviewStats() {
  const decks = await ankiRequest('deckNames')
  const midnight = new Date(); midnight.setHours(0, 0, 0, 0)
  const startID = midnight.getTime() // revlog ids are unix-ms timestamps
  let reviews = 0, passed = 0
  for (const deck of decks) {
    let rows = []
    try { rows = await ankiRequest('cardReviews', { deck, startID }) } catch { continue }
    for (const r of (rows || [])) {
      reviews++
      if (Number(r[3]) >= 2) passed++ // r[3] = button pressed: 1 Again, 2 Hard, 3 Good, 4 Easy
    }
  }
  return { reviews, passed }
}

export async function ankiFindNotes(query) {
  ankiLog(`finding notes: ${query}`)
  return ankiRequest('findNotes', { query })
}

export async function ankiNotesInfo(notes) {
  ankiLog(`getting info for ${notes.length} notes`)
  return ankiRequest('notesInfo', { notes })
}

export async function ankiUpdateNote(id, fields) {
  ankiLog(`updating note ${id}`, fields)
  return ankiRequest('updateNoteFields', { note: { id, fields } })
}

export async function ankiDeleteNotes(notes) {
  ankiLog(`deleting ${notes.length} notes`, notes)
  return ankiRequest('deleteNotes', { notes })
}

export async function ankiSync() {
  ankiLog('triggering sync to AnkiWeb...')
  await ankiRequest('sync')
  ankiLog('sync complete')
}

// ─── Media files (used as a cloud-synced key/value store) ───────────────────
// Files prefixed with "_" are ignored by Anki's "Check Media" and never garbage
// collected, but still sync to AnkiWeb — the documented way to store config data.
export async function ankiStoreMediaFile(filename, dataBase64) {
  ankiLog(`storing media file "${filename}"`)
  return ankiRequest('storeMediaFile', { filename, data: dataBase64 })
}

// Returns the base64-encoded file contents, or false if the file does not exist.
export async function ankiRetrieveMediaFile(filename) {
  ankiLog(`retrieving media file "${filename}"`)
  return ankiRequest('retrieveMediaFile', { filename })
}
