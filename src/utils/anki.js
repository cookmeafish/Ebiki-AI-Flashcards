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

// Copy a note into another deck as a NEW note (same model, fields, tags). allowDuplicate is
// intentional — the whole point of a copy is that it exists in both decks.
export async function ankiCopyNote(deckName, modelName, fields, tags = []) {
  ankiLog(`copying note into deck "${deckName}"`)
  return ankiRequest('addNote', {
    note: { deckName, modelName: modelName || 'Basic', fields, options: { allowDuplicate: true }, tags },
  })
}

// Replace a note's tags (remove the old set, add the new). Tags are space-separated in AnkiConnect.
export async function ankiSetNoteTags(noteId, oldTags = [], newTags = []) {
  ankiLog(`setting tags on note ${noteId}`, newTags)
  const old = (oldTags || []).join(' ').trim()
  const next = (newTags || []).join(' ').trim()
  if (old) await ankiRequest('removeTags', { notes: [noteId], tags: old })
  if (next) await ankiRequest('addTags', { notes: [noteId], tags: next })
}

// Reset cards to NEW — wipes scheduling (interval/ease/due) so they start over. The remedy for
// a card whose interval was inflated by bad syncs.
export async function ankiForgetCards(cardIds) {
  ankiLog(`resetting ${cardIds.length} card(s) to new`)
  return ankiRequest('forgetCards', { cards: cardIds })
}

// Move cards to another deck — the scheduling state travels with them.
export async function ankiChangeDeck(cardIds, deckName) {
  ankiLog(`moving ${cardIds.length} card(s) to deck "${deckName}"`)
  return ankiRequest('changeDeck', { cards: cardIds, deck: deckName })
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

// Directly set a card's due date (days from today, e.g. "0", "3", "3-5"). Unlike answerCards this
// works on ANY card regardless of queue position — used as the last-resort fallback to record a
// rating for a brand-new / out-of-queue card the reviewer can't present.
export async function ankiSetDueDate(cards, days) {
  ankiLog(`setDueDate ${days} for ${cards.length} cards`, cards)
  return ankiRequest('setDueDate', { cards, days: String(days) })
}

// Write review-log (revlog) entries directly. setDueDate only reschedules a card; it does NOT add a
// revlog row, so Anki wouldn't count the card as "studied today". insertReviews adds the row so the
// review counts in stats/streak. Each review is a 9-tuple matching Anki's revlog columns:
//   [id(ms), cardId, usn(-1), ease(1-4), ivl(days), lastIvl(days), factor, timeMs, type(0 learn)]
export async function ankiInsertReviews(reviews) {
  ankiLog(`insertReviews x${reviews.length}`, reviews)
  return ankiRequest('insertReviews', { reviews })
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

// ─── Is Anki signed in to AnkiWeb? ──────────────────────────────────────────
// Signing in is OPTIONAL for Ebiki (everything works against the local
// collection), but a user who never signs in has no backup and no phone, and
// nothing anywhere told them so - Anki just silently keeps the cards on one
// computer. Worse, when Ebiki triggers a sync for a signed-out user, Anki throws
// and the failure surfaces as a generic error the user cannot act on.
//
// AnkiConnect's `sync` action checks `mw.pm.sync_auth()` FIRST and raises
// "sync: auth not configured" before touching anything, so this is the
// officially-supported way to ask, and it is FREE when the answer is "signed
// out". When the answer is "signed in" it performs a real sync, which is the
// thing the user wants anyway - and App.jsx only ever probes once per machine
// (see ankiWebAuth), so that costs exactly one sync, ever.
export function isAnkiAuthError(err) {
  return /auth not configured/i.test(String((err && err.message) || err || ''))
}

// 'signed-in' | 'signed-out' | 'unknown' (Anki closed, add-on missing, or a real
// sync error - never guess in that case, the UI must stay quiet).
export async function ankiSyncAuthState() {
  try {
    await ankiRequest('sync')
    return 'signed-in'
  } catch (err) {
    if (isAnkiAuthError(err)) return 'signed-out'
    ankiLog(`sync auth probe inconclusive: ${err.message}`)
    return 'unknown'
  }
}

export async function ankiSync() {
  ankiLog('triggering sync to AnkiWeb...')
  await ankiRequest('sync')
  ankiLog('sync complete')
}

// ─── Coalesced sync (use this for anything that is not a blocking pre-read) ──
// Anki shows a "Collection sync complete." toast on EVERY sync, and on Windows that toast is a
// FRAMELESS ALWAYS-ON-TOP window: it floats over whatever you are actually doing, Ebiki included,
// and it does not go away when you switch apps. That is an open upstream bug
// (ankitects/anki#4188), and Anki's maintainers answer requests to silence it with "Anki doesn't
// natively support background syncing - reduce the frequency of the add-on doing that".
//
// Here that add-on is US. Ebiki fired a sync from ~16 places (every card add, edit, tag change,
// deck move, merge), so one Quick Add batch or a run of Discover cards threw a burst of toasts
// across the screen. Fighting the window from outside would mean an always-on watchdog polling
// fast enough to catch a 3-second popup - the same shape as the Anki minimizer that already had to
// be taught to stop interfering. Removing the CAUSE is the honest fix.
//
// So a burst becomes ONE sync: every call restarts a quiet-period timer, and the sync runs once
// things settle. MAX_WAIT stops a steady drip of edits from starving it forever (a card every 15s
// would otherwise never reach a quiet period). Fire-and-forget: never awaited, never throws.
//
// Use ankiSync() directly ONLY where the result is needed before continuing - the pre-session
// AnkiWeb pull in App.jsx is the one such caller, and it must stay immediate and awaited.
const SYNC_QUIET_MS = 8000     // wait for things to go quiet
const SYNC_MAX_WAIT_MS = 90000 // ...but never postpone a pending sync longer than this
let syncTimer = null
let syncFirstRequestedAt = 0

function runCoalescedSync() {
  syncTimer = null
  syncFirstRequestedAt = 0
  ankiSync().catch((e) => ankiLog(`coalesced sync failed: ${e.message}`))
}

export function ankiSyncSoon() {
  const now = Date.now()
  if (!syncFirstRequestedAt) syncFirstRequestedAt = now
  // Already waited as long as we are willing to: go now rather than restarting the timer again.
  if (now - syncFirstRequestedAt >= SYNC_MAX_WAIT_MS) {
    if (syncTimer) { clearTimeout(syncTimer); syncTimer = null }
    runCoalescedSync()
    return
  }
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(runCoalescedSync, SYNC_QUIET_MS)
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
