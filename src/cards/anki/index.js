// The ANKI card backend: talks to Anki through the AnkiConnect add-on, via the dev server's /api/anki
// proxy (vite.config.js). Implements the contract in ../contract.js; the app never imports this file
// directly (it goes through ../index.js), so everything Anki-specific (search syntax, the GUI reviewer,
// revlog tuples, setDueDate's "!" suffix, the AnkiConnect setup endpoints) stays in here.
import { sanitizeCardHtml } from '../html'
import { tr as ankiText } from '../i18n'
import { oneStepInterval } from '../contract'
import { apiFetch, platform } from '../../platform'

// Logged payloads are capped. Every request AND response used to be stringified in full, which for
// a whole-deck notesInfo reply or a base64 audio upload meant serializing megabytes on each call just
// to print them, and the DevTools console keeps every one of those strings alive for the session.
const LOG_MAX = 400
function ankiLog(msg, data) {
  let entry = msg
  if (data !== undefined) {
    let s
    try { s = JSON.stringify(data) } catch { s = String(data) }
    if (s && s.length > LOG_MAX) s = `${s.slice(0, LOG_MAX)}… (${s.length} chars)`
    entry = `${msg} ${s}`
  }
  console.log(`[Anki] ${entry}`)
}

async function ankiRequest(action, params = {}) {
  ankiLog(`request: ${action}`, params)
  let res
  try {
    res = await apiFetch('/api/anki', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, version: 6, params }),
    })
  } catch { throw new Error(ankiText('anki_errNoServer', "Ebiki's background service did not answer, so Anki could not be reached.")) } // "Failed to fetch" was English
  // A reply cut off mid-stream (Anki closed while answering) is not JSON; say that instead of
  // surfacing the parser's "Unexpected end of JSON input" to the user.
  let data
  try { data = await res.json() } catch { throw new Error(ankiText('anki_errIncomplete', 'Anki sent an incomplete reply. Check that Anki is open, then try again.')) }
  ankiLog(`response: ${action}`, data)
  // The proxy's own messages carry a code: shown in the app language. AnkiConnect's errors pass through as written.
  const PROXY_ERR = { notRunning: 'anki_errNotRunning', timeout: 'anki_errTimeout', timeoutChange: 'anki_errTimeoutChange', closed: 'anki_errClosed', refused: 'anki_errRefused' }
  if (data && data.error) {
    const e = new Error(PROXY_ERR[data.code] ? ankiText(PROXY_ERR[data.code], data.error) : data.error)
    if (data.code) e.code = data.code // 'timeoutChange' = the change is still queued in Anki: a retry would repeat it
    throw e
  }
  if (!data) throw new Error(ankiText('anki_errEmpty', 'Anki sent an empty reply. Check that Anki is open, then try again.'))
  return data.result
}

async function ankiPing() {
  try {
    const version = await ankiRequest('version')
    ankiLog(`connected, AnkiConnect version: ${version}`)
    return true
  } catch (err) {
    ankiLog(`ping failed: ${err.message}`)
    return false
  }
}

async function ankiGetDecks() {
  const decks = await ankiRequest('deckNames')
  ankiLog(`found ${decks.length} decks`, decks)
  return decks
}

async function ankiCreateDeck(deckName) {
  ankiLog(`creating deck "${deckName}"`)
  return ankiRequest('createDeck', { deck: deckName })
}

// Anki names its built-in note types in the language the COLLECTION was created in: a Spanish
// install has "Básico" with "Anverso"/"Reverso", so a hardcoded 'Basic'/'Front'/'Back' failed every
// add with "model was not found". 'Basic' stays the fast path (English collections, and any
// collection that has it); only on that error do we find the collection's own two-field basic
// type once, cache it, and fill its fields by ORDER (front first).
let basicModelCache = null
const isMissingModelError = (e) => /model was not found|model.*not.?found/i.test(String(e?.message || e))
async function resolveBasicModel() {
  if (basicModelCache) return basicModelCache
  const names = (await ankiRequest('modelNames', {})) || []
  const candidates = []
  for (const name of names) {
    if (/cloze|reverse|revers|inver|type in|escrib|typing/i.test(name)) continue
    const fields = await ankiRequest('modelFieldNames', { modelName: name }).catch(() => null)
    if (Array.isArray(fields) && fields.length === 2) candidates.push({ name, fields })
  }
  if (!candidates.length) throw new Error(ankiText('anki_errNoBasic', 'No two-field note type (like "Basic") exists in this Anki collection.'))
  basicModelCache = candidates.find((c) => /basic|b[aá]sico|basique|einfach|基本|基础|базов/i.test(c.name)) || candidates[0]
  return basicModelCache
}
// Try 'Basic' first; on a missing-model error, retry against the collection's own basic type.
// The "Basic" type's REAL field names, read once: a Basic whose fields were renamed ("Word"/"Meaning")
// silently dropped Front/Back, so every add failed with "cannot create note because it is empty" and
// every Quick Add card looked like a duplicate. Not cached on a failed read (Anki offline): retried.
let basicFieldsCache
async function basicFieldNames() {
  if (basicFieldsCache === undefined) {
    try {
      const f = await ankiRequest('modelFieldNames', { modelName: 'Basic' })
      basicFieldsCache = Array.isArray(f) && f.length >= 2 ? f.slice(0, 2) : null
    } catch (e) {
      if (isMissingModelError(e)) basicFieldsCache = null
      else return ['Front', 'Back']
    }
  }
  return basicFieldsCache || ['Front', 'Back']
}
async function withBasicModel(run) {
  try {
    return await run({ modelName: 'Basic', fieldNames: await basicFieldNames() })
  } catch (e) {
    if (!isMissingModelError(e)) throw e
    const m = await resolveBasicModel()
    return run({ modelName: m.name, fieldNames: m.fields })
  }
}


async function ankiAddNote(deckName, front, back, tags = [], allowDuplicate = false) {
  front = sanitizeCardHtml(front)
  back = sanitizeCardHtml(back)
  // One tag per entry: Anki splits a tag on whitespace, so "machine learning" became two tags (machine, learning).
  tags = [...new Set((Array.isArray(tags) ? tags : []).map((tg) => String(tg ?? '').trim().split(/\s+/).join('-')).filter(Boolean))]
  ankiLog(`adding note to deck "${deckName}"`, { front, back, tags })
  const noteId = await withBasicModel(({ modelName, fieldNames }) => ankiRequest('addNote', {
    note: {
      deckName,
      modelName,
      fields: { [fieldNames[0]]: front, [fieldNames[1]]: back },
      // Duplicates are judged within the TARGET deck (and its subdecks): without a scope Anki checks the
      // whole collection, so "Firewall" in one mode's deck blocked adding it to another mode's deck.
      options: { allowDuplicate, duplicateScope: 'deck', duplicateScopeOptions: { deckName, checkChildren: true } },
      tags,
    },
  }))
  ankiLog(`note added, id: ${noteId}`)
  return noteId
}

// Copy a note into another deck as a NEW note (same model, fields, tags). allowDuplicate is
// intentional — the whole point of a copy is that it exists in both decks.
async function ankiCopyNote(deckName, modelName, fields, tags = []) {
  ankiLog(`copying note into deck "${deckName}"`)
  return ankiRequest('addNote', {
    note: { deckName, modelName: modelName || 'Basic', fields, options: { allowDuplicate: true }, tags },
  })
}

// Replace a note's tags with newTags. Tags are space-separated in AnkiConnect.
// It used to remove EVERY old tag and then add the new set, so a failure between the two calls
// (Anki closed, a dialog, the proxy timeout) left the card with no tags at all. Now only the
// difference moves, and the adds go first: a failure part-way leaves extra tags, never none.
// Anki matches tags case-insensitively, so a case-only change is a remove + re-add, and removing
// "a" also removes its children ("a::b"), so any wanted child of a removed tag is added back after.
async function ankiSetNoteTags(noteId, oldTags = [], newTags = []) {
  ankiLog(`setting tags on note ${noteId}`, newTags)
  // One tag per entry, as in ankiAddNote: tags travel space-separated, so a proposed "machine learning"
  // arrived as two tags (and, being "new", was added again on every later save).
  const clean = (a) => [...new Set((a || []).map((t) => String(t).trim().split(/\s+/).join('-')).filter(Boolean))]
  const oldList = clean(oldTags)
  const newList = clean(newTags)
  const lower = (t) => t.toLowerCase()
  const newLower = new Set(newList.map(lower))
  const removed = oldList.filter((t) => !newLower.has(lower(t)) || !newList.includes(t))
  const removedLower = removed.map(lower)
  const hitByRemove = (t) => removedLower.some((r) => lower(t) === r || lower(t).startsWith(`${r}::`))
  const added = newList.filter((t) => !oldList.includes(t))
  const addFirst = added.filter((t) => !hitByRemove(t))
  if (addFirst.length) await ankiRequest('addTags', { notes: [noteId], tags: addFirst.join(' ') })
  // Anki matches removals as PATTERNS ("_" = any one character, "*" = any run), so removing "Lesson_1"
  // also stripped "Lesson-1". Escaped, each removal names only its own tag.
  if (removed.length) await ankiRequest('removeTags', { notes: [noteId], tags: removed.map((t) => t.replace(/[\\*_]/g, '\\$&')).join(' ') })
  const addAfter = newList.filter(hitByRemove)
  if (addAfter.length) await ankiRequest('addTags', { notes: [noteId], tags: addAfter.join(' ') })
}

// Reset cards to NEW — wipes scheduling (interval/ease/due) so they start over. The remedy for
// a card whose interval was inflated by bad syncs.
async function ankiForgetCards(cardIds) {
  ankiLog(`resetting ${cardIds.length} card(s) to new`)
  return ankiRequest('forgetCards', { cards: cardIds })
}

// Contract: suspendedCards / unsuspendCards (capability `suspend`). Anki's leech action can suspend a card.
async function ankiSuspendedCards(cardIds) {
  if (!cardIds?.length) return []
  const r = await ankiRequest('areSuspended', { cards: cardIds })
  return cardIds.map((_, i) => r?.[i] === true)
}
async function ankiUnsuspend(cardIds) {
  if (!cardIds?.length) return true
  ankiLog(`unsuspending ${cardIds.length} card(s)`)
  return ankiRequest('unsuspend', { cards: cardIds })
}

// Move cards to another deck — the scheduling state travels with them.
async function ankiChangeDeck(cardIds, deckName) {
  ankiLog(`moving ${cardIds.length} card(s) to deck "${deckName}"`)
  return ankiRequest('changeDeck', { cards: cardIds, deck: deckName })
}

// Duplicate pre-check. Returns true if the note can be added (no duplicate). On any error
// (e.g. Anki not running) returns true so we never block adding on a flaky check.
async function ankiCanAddNote(deckName, front, back) {
  try {
    const res = await withBasicModel(({ modelName, fieldNames }) => ankiRequest('canAddNotes', {
      // The SAME text ankiAddNote stores: checked raw, "vector<int>" compared as "vector" and never matched.
      notes: [{ deckName, modelName, fields: { [fieldNames[0]]: sanitizeCardHtml(front), [fieldNames[1]]: sanitizeCardHtml(back) }, tags: [],
        options: { duplicateScope: 'deck', duplicateScopeOptions: { deckName, checkChildren: true } } }], // like ankiAddNote
    }))
    return Array.isArray(res) ? res[0] !== false : true
  } catch {
    return true
  }
}

async function ankiFindCards(query) {
  ankiLog(`finding cards: ${query}`)
  const cards = await ankiRequest('findCards', { query })
  ankiLog(`found ${cards.length} cards`)
  return cards
}

async function ankiCardsInfo(cards) {
  ankiLog(`getting info for ${cards.length} cards`)
  return ankiRequest('cardsInfo', { cards })
}

async function ankiGetDeckStats(decks) {
  ankiLog(`getting deck stats for: ${decks.join(', ')}`)
  return ankiRequest('getDeckStats', { decks })
}

// Number of reviews done today (matches Anki's own "reviews today" figure).
async function ankiGetNumCardsReviewedToday() {
  return ankiRequest('getNumCardsReviewedToday')
}

// Reviews per day: [["YYYY-MM-DD", count], ...] (used for the chart + streak).
async function ankiGetNumCardsReviewedByDay() {
  return ankiRequest('getNumCardsReviewedByDay')
}

// Today's pass-rate straight from the review log (every review since local midnight, across all
// decks). Cumulative — a card failed then re-passed counts as one fail + one pass — so the number
// is STABLE and won't flip between refreshes the way a most-recent-ease query does.
async function ankiGetTodayReviewStats() {
  const decks = await ankiRequest('deckNames')
  const midnight = new Date(); midnight.setHours(0, 0, 0, 0)
  const startID = midnight.getTime() // revlog ids are unix-ms timestamps
  // The day these numbers are FOR: a slow read that crossed midnight stamped yesterday's total as today's.
  const day = `${midnight.getFullYear()}-${String(midnight.getMonth() + 1).padStart(2, '0')}-${String(midnight.getDate()).padStart(2, '0')}`
  let reviews = 0, passed = 0
  const all = []
  for (const deck of decks) {
    // A deck that could not be read makes the whole answer unknown (null keeps the last-known numbers): skipped,
    // a lower count and accuracy were shown and cached as complete.
    try { all.push(...((await ankiRequest('cardReviews', { deck, startID })) || [])) } catch { return null }
  }
  // A post-lock CORRECTION's row (see markCorrectionReview) is not a second answer: it replaces the
  // card's earlier outcome instead of adding one (it counted as an extra review, and a corrected
  // Again → Good as one fail plus one pass).
  const corrections = correctionReviewIds()
  const lastPass = new Map() // cardId -> outcome of its latest counted row
  all.sort((a, b) => Number(a[0]) - Number(b[0]))
  for (const r of all) {
    // Button 0 = a MANUAL row (setDueDate, forgetCards: Ebiki's own sync fallbacks, corrections and
    // "Reset progress"), not an answer. Counted, each was a phantom failed review in today's accuracy.
    if (!(Number(r[3]) >= 1)) continue
    const pass = Number(r[3]) >= 2 // r[3] = button pressed: 1 Again, 2 Hard, 3 Good, 4 Easy
    const cid = r[1]
    if (corrections.has(Number(r[0]))) {
      if (lastPass.has(cid) && lastPass.get(cid) !== pass) passed += pass ? 1 : -1
      if (lastPass.has(cid)) lastPass.set(cid, pass)
      continue
    }
    reviews++
    if (pass) passed++
    lastPass.set(cid, pass)
  }
  return { reviews, passed, day }
}

// Revlog ids (unix ms) of the rows Ebiki inserted as post-lock corrections, kept on this computer.
const CORRECTION_KEY = 'ebiki-correction-revlog'
function correctionReviewIds() {
  try { return new Set((JSON.parse(localStorage.getItem(CORRECTION_KEY) || '[]') || []).map(Number)) } catch { return new Set() }
}
function markCorrectionReview(id) {
  try {
    const keep = [...correctionReviewIds()].filter((x) => x > Date.now() - 3 * 86400000)
    localStorage.setItem(CORRECTION_KEY, JSON.stringify([...keep, Number(id)].slice(-200)))
  } catch { /* stats only */ }
}

async function ankiFindNotes(query) {
  ankiLog(`finding notes: ${query}`)
  return ankiRequest('findNotes', { query })
}

async function ankiNotesInfo(notes) {
  ankiLog(`getting info for ${notes.length} notes`)
  return ankiRequest('notesInfo', { notes })
}

// Fields are written AS GIVEN: callers send either HTML read back from Anki (the audio embed re-sends
// the whole back, and escaping there garbled tags like <rb> or <svg> children on a card nobody edited)
// or plain text they have already escaped. A caller writing raw AI text runs escapeStrayLt itself.
async function ankiUpdateNote(id, fields) {
  ankiLog(`updating note ${id}`, fields)
  return ankiRequest('updateNoteFields', { note: { id, fields } })
}

async function ankiDeleteNotes(notes) {
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
function isAnkiAuthError(err) {
  return /auth not configured/i.test(String((err && err.message) || err || ''))
}

// 'signed-in' | 'signed-out' | 'unknown' (Anki closed, add-on missing, or a real
// sync error - never guess in that case, the UI must stay quiet).
async function ankiSyncAuthState() {
  try {
    await ankiRequest('sync')
    return 'signed-in'
  } catch (err) {
    if (isAnkiAuthError(err)) return 'signed-out'
    // Signed in, but the first sync after signing in needs a full upload/download ("Sync status ... not one
    // of ..."): auth exists, which is all this asks.
    if (/sync status/i.test(String(err?.message || ''))) return 'signed-in'
    ankiLog(`sync auth probe inconclusive: ${err.message}`)
    return 'unknown'
  }
}

async function ankiSync() {
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

function ankiSyncSoon() {
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

// A sync still waiting for its quiet period when the window closes would never run: cards added in the
// last seconds stayed on this computer until the next sync from somewhere else. Hand it to the server as
// a beacon (survives the page going away; the /api/anki proxy reads any body as JSON).
platform.onPageHide(() => {
  if (!syncTimer) return
  clearTimeout(syncTimer); syncTimer = null; syncFirstRequestedAt = 0
  platform.beacon('/api/anki', JSON.stringify({ action: 'sync', version: 6, params: {} }))
})

// ─── Media files (used as a cloud-synced key/value store) ───────────────────
// Files prefixed with "_" are ignored by Anki's "Check Media" and never garbage
// collected, but still sync to AnkiWeb — the documented way to store config data.
async function ankiStoreMediaFile(filename, dataBase64) {
  ankiLog(`storing media file "${filename}"`)
  return ankiRequest('storeMediaFile', { filename, data: dataBase64 })
}

// Returns the base64-encoded file contents, or false if the file does not exist.
async function ankiRetrieveMediaFile(filename) {
  ankiLog(`retrieving media file "${filename}"`)
  return ankiRequest('retrieveMediaFile', { filename })
}

// ─── Queries ─────────────────────────────────────────────────────────────────
// A deck search term with the deck name ESCAPED. Inside Anki's search syntax `_` matches any one
// character and `*` any run, so `deck:"Unit_1"` also matched "Unit 1" and "Unit-1" - and a study
// session then pulled another deck's cards, which the reviewer never presents, so they fell to the
// setDueDate fallback and had reviews recorded that nobody made. Subdecks still match (Parent::*).
export const deckTerm = (deck) => `deck:"${String(deck || '').replace(/[\\"*_]/g, (c) => '\\' + c)}"`

const STATE_TERM = { due: 'is:due', new: 'is:new', dueOrNew: '(is:due OR is:new)' }
// The contract's structured Query as Anki search syntax. Term order is fixed (deck, note, card, text,
// state, exclusions) so the same query always compiles to the same string.
export function compileQuery(q) {
  if (!q || typeof q !== 'object') throw new Error('card query must be an object')
  const terms = []
  if (q.deck) terms.push(deckTerm(q.deck))
  if (q.noteId != null) terms.push(`nid:${Number(q.noteId)}`)
  if (q.cardId != null) terms.push(`cid:${Number(q.cardId)}`)
  if (q.text != null) {
    // Search operators ESCAPED, never deleted (deleting turned "dog_house" into a search for "doghouse" and
    // missed the card that exists): inside quotes `_`/`*` are wildcards, `:` starts a field search, `\` and
    // `"` end or escape the term. Parens and a leading `-` are literal inside quotes (negation and grouping
    // are parsed outside them).
    const raw = String(q.text).trim()
    if (!raw) throw new Error('card query text is empty')
    const safe = raw.replace(/[\\"*_:]/g, (c) => '\\' + c)
    // nc: = Anki's accent-insensitive search.
    terms.push(q.ignoreAccents ? `"nc:${safe}"` : `"${safe}"`)
  }
  if (q.state) {
    if (!STATE_TERM[q.state]) throw new Error(`unknown card state "${q.state}"`)
    terms.push(STATE_TERM[q.state])
  }
  if (q.excludeSuspended) terms.push('-is:suspended')
  if (q.excludeBuried) terms.push('-is:buried')
  // Never "everything": an empty query is a caller bug, and a whole-collection hit fed to a writer is a disaster.
  if (!terms.length) throw new Error('empty card query')
  return terms.join(' ')
}

// ─── Recording ratings ───────────────────────────────────────────────────────
// Contract: recordRatings. The strategy, in order:
//  0. An earlier run's answer call that threw may have been RECORDED: Anki's review log decides.
//  1. PRIMARY: drive Anki's real reviewer. `answerCards` only works on the card at the TOP of the
//     scheduler queue ("not at top of queue" otherwise, e.g. for a brand-new card), so start a review
//     on the deck and answer each card the scheduler presents with our rating. Anki computes the
//     correct SM-2/FSRS interval for every rating.
//  2. FALLBACK per card the reviewer never presented: skip if Anki says it is not due (already
//     recorded); try answerCards; a NEW card gets an approximate first interval + revlog row; a REVIEW
//     card is nudged due and answered by the reviewer; if still blocked, one SM-2 step from its own
//     interval.
const RATING_NAMES = ['again', 'hard', 'good', 'easy']
// The 1-4 button a rating stands for. A text "3" fell through every `=== 3` test (a new card then got
// the Again interval), and 0 or 5 reached Anki's answer calls as is.
const easeNum = (e) => Math.min(4, Math.max(1, Math.round(Number(e)) || 1))
// The rating as Anki RECORDED it. Capped to the card's buttons (Easy on a 3-button learning card is Good)
// and reported back as sent: the app locks the card showing this, and it used to show Easy for a Good.
const asSent = (cs, e) => (e === cs.ease ? cs : { ...cs, ease: e, rating: RATING_NAMES[e - 1] })

async function recordRatings({ deck, ratings, preSchedule = () => undefined, hooks }) {
  const wanted = new Map(ratings.map((cs) => [cs.cardId, Number.isInteger(cs.ease) && cs.ease >= 1 && cs.ease <= 4 ? cs : { ...cs, ease: easeNum(cs.ease) }]))
  let recordedCount = 0
  const recorded = (cs) => { recordedCount++; wanted.delete(cs.cardId); hooks.recorded(cs) }
  const syncStartedAt = Date.now()
  const uncertain = [] // cards whose answer call threw: not sent again in this run

  const unsure = [...wanted.keys()].filter((id) => hooks.uncertainSince(id) !== undefined)
  if (unsure.length) {
    try {
      const log = (await ankiRequest('getReviewsOfCards', { cards: unsure })) || {}
      for (const id of unsure) {
        const since = hooks.uncertainSince(id)
        const rows = Array.isArray(log[id]) ? log[id] : Array.isArray(log[String(id)]) ? log[String(id)] : []
        // A real ANSWER only (button 1-4): the nudge's setDueDate writes a manual row (button 0) just before the
        // answer call, and that row alone locked the card "Synced" though its rating never reached Anki.
        // Locked with the grade Anki RECORDED (the card's rating may have changed since the call that threw).
        const hit = rows.filter((r) => Number(r?.ease) >= 1 && Number(r?.id) >= since - 1000).sort((a, b) => Number(b.id) - Number(a.id))[0]
        if (hit) { const cs = wanted.get(id); const e = easeNum(hit.ease); if (cs) recorded(asSent(cs, e)) }
        hooks.forgetUncertain(id)
      }
    } catch {
      for (const id of unsure) { const cs = wanted.get(id); if (cs) { wanted.delete(id); uncertain.push(cs) } } // still unknown: not this run
    }
  }

  // Anki may queue these cards in a different order than we studied them, so each presented card is
  // looked up by id rather than assuming an order.
  try {
    const started = await ankiRequest('guiDeckReview', { name: deck })
    if (started) {
      let guard = ratings.length * 4 + 8
      while (wanted.size > 0 && guard-- > 0) {
        let cur
        try { cur = await ankiRequest('guiCurrentCard') } catch { cur = null }
        if (!cur || !cur.cardId) break          // queue exhausted
        const cs = wanted.get(cur.cardId)
        if (!cs) break                           // a card we didn't study is up next — stop, don't touch it
        // guiCurrentCard returns `buttons` as an ARRAY of the valid ease values (e.g. [1,2,3] for a
        // new/learning card, [1,2,3,4] for review) — NOT a count. Cap our ease to the highest available.
        const validEases = Array.isArray(cur.buttons) ? cur.buttons.filter((n) => typeof n === 'number') : []
        const maxEase = validEases.length ? Math.max(...validEases) : 4
        const ease = Math.min(cs.ease, maxEase)
        console.log('[Anki sync] gui-answering card', cur.cardId, 'ease', ease, 'rating', cs.rating, 'buttons', cur.buttons)
        try {
          await ankiRequest('guiShowAnswer')
          hooks.markUncertain(cs.cardId, Date.now()) // before the call: see clearUncertain
          const ok = await ankiRequest('guiAnswerCard', { ease })
          if (ok !== false) recorded(asSent(cs, ease))
          else { hooks.clearUncertain(cs.cardId); break } // a clean refusal: nothing recorded
        } catch {
          // Anki may have RECORDED it before the reply was lost (a timeout): the fallback below would then
          // answer it a second time (a fresh learning card still reads as due). Left for a later retry.
          wanted.delete(cs.cardId); uncertain.push(cs)
          hooks.markUncertain(cs.cardId, syncStartedAt)
          break
        }
      }
    }
  } catch (err) {
    console.error('[Anki sync] gui review failed', err.message)
  } finally {
    // Leave Anki on the deck list rather than stuck mid-review.
    try { await ankiRequest('guiDeckBrowser') } catch {}
  }

  // answerCards returns an ARRAY of booleans (one per card), or throws "not at top of queue".
  const ansOk = (r) => Array.isArray(r) ? r[0] !== false : r !== false
  // Map our 1-4 ease onto a due-date interval (days) for the last-resort path. Approximate, but it
  // records SOMETHING so a brand-new card (the common "not at top of queue" case) still syncs.
  const easeToDueDays = (ease) => ease >= 4 ? '4' : ease === 3 ? '2' : ease === 2 ? '1' : '0'
  const failed = [...uncertain]
  const find = (q) => ankiRequest('findCards', { query: compileQuery(q) })
  for (const cs of Array.from(wanted.values())) {
    // ANKI-SCHEDULE GUARD: never record a review for a card Anki does not consider due/new RIGHT
    // NOW (most often: its review was already recorded earlier today). The reviewer path above is
    // inherently schedule-respecting — this fallback wasn't, and force-recording off-schedule
    // reviews is exactly how a week of studying compounded intervals into years.
    try {
      const stillDue = await find({ cardId: cs.cardId, state: 'dueOrNew', excludeSuspended: true, excludeBuried: true })
      if (Array.isArray(stillDue) && stillDue.length === 0) {
        console.warn('[Anki sync] card', cs.cardId, `("${cs.front}") is not due in Anki — its review was already recorded. Skipping to protect the schedule.`)
        hooks.notOurs(cs.cardId) // nothing of OURS was recorded: a later correction must not add a review to it
        recorded(cs)
        continue
      }
    } catch { /* if the check itself fails, continue — answerCards fails safely for non-top cards */ }
    try {
      console.log('[Anki sync] answering card (fallback)', cs.cardId, 'ease', cs.ease, 'rating', cs.rating)
      let result
      let sentEase = cs.ease
      try {
        hooks.markUncertain(cs.cardId, Date.now()) // before the call: see clearUncertain
        result = await ankiRequest('answerCards', { answers: [{ cardId: cs.cardId, ease: cs.ease }] })
        // Retry once with a capped ease in case it was out of range (a new card with only 3 buttons).
        if (!ansOk(result)) { sentEase = Math.min(cs.ease, 3); result = await ankiRequest('answerCards', { answers: [{ cardId: cs.cardId, ease: sentEase }] }) }
        if (!ansOk(result)) hooks.clearUncertain(cs.cardId) // refused both times: nothing recorded
      } catch (eAns) {
        // "Not at top of queue" is a clean refusal (the fallbacks below). Anything else (a timeout: Anki
        // still has the change queued) may have been RECORDED: the nudge would then answer it again.
        if (!/top of|queue/i.test(String(eAns?.message || ''))) {
          hooks.markUncertain(cs.cardId, syncStartedAt)
          failed.push(cs)
          continue
        }
        hooks.clearUncertain(cs.cardId) // "not at top of queue": refused, nothing recorded
        throw eAns
      }
      if (ansOk(result)) { recorded(asSent(cs, sentEase)); continue }
      throw new Error('not at top of queue')
    } catch {
      try {
        const isNew = await find({ cardId: cs.cardId, state: 'new' }).then((r) => r.length > 0).catch(() => false)
        if (isNew) {
          // Brand-new card: approximate first interval + revlog row. No existing schedule to corrupt.
          const days = easeToDueDays(cs.ease)
          const ease = cs.ease
          console.log('[Anki sync] setDueDate+insertReviews fallback (new card)', cs.cardId, 'days', days, 'ease', ease)
          // "!" also sets the interval (not just the due date) so the new card graduates with the
          // right interval instead of staying ivl=0 (which Anki would then reschedule oddly).
          await ankiRequest('setDueDate', { cards: [cs.cardId], days: days + '!' })
          // setDueDate reschedules but writes no revlog row, so Anki would show "0 studied". Add the
          // revlog entry so the card counts in Cards Today / streak / accuracy. +n keeps the id unique.
          // Revlog 9-tuple: [id(ms), cardId, usn(-1), ease(1-4), ivl, lastIvl, factor, timeMs, type(0 learn, 1 review)]
          const ivl = Math.max(0, parseInt(days, 10) || 0)
          await ankiRequest('insertReviews', { reviews: [[Date.now() + failed.length + recordedCount, cs.cardId, -1, ease, ivl, 0, 2500, 0, 0]] })
            .catch((e) => console.warn('[Anki sync] insertReviews failed (rating still rescheduled):', e.message))
          recorded(cs)
          continue
        }
        // REVIEW card the reviewer didn't present: a bare setDueDate "0" nudges it due NOW but keeps its
        // interval (only "!" would change it), then Anki's own reviewer answers it. (1) leave the reviewer
        // FIRST (a stale queue won't rebuild), (2) give Anki a beat, (3) poll a few times.
        console.log('[Anki sync] nudge-due + reviewer fallback (review card)', cs.cardId, 'ease', cs.ease)
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
        await ankiRequest('setDueDate', { cards: [cs.cardId], days: '0' })
        try { await ankiRequest('guiDeckBrowser') } catch {}
        await sleep(350)
        let answered = false
        const started2 = await ankiRequest('guiDeckReview', { name: deck })
        if (started2) {
          for (let poll = 0; poll < 3 && !answered; poll++) {
            let cur2 = null
            try { cur2 = await ankiRequest('guiCurrentCard') } catch { cur2 = null }
            if (cur2?.cardId === cs.cardId) {
              const validEases2 = Array.isArray(cur2.buttons) ? cur2.buttons.filter((n) => typeof n === 'number') : []
              const maxEase2 = validEases2.length ? Math.max(...validEases2) : 4
              await ankiRequest('guiShowAnswer')
              let ok2
              const ease2 = Math.min(cs.ease, maxEase2)
              hooks.markUncertain(cs.cardId, Date.now()) // before the call: see clearUncertain
              try { ok2 = await ankiRequest('guiAnswerCard', { ease: ease2 }) }
              catch { hooks.markUncertain(cs.cardId, syncStartedAt); answered = 'uncertain'; break } // may be recorded (see above)
              if (ok2 !== false) { recorded(asSent(cs, ease2)); answered = true; break }
              hooks.clearUncertain(cs.cardId) // refused: nothing recorded
            }
            if (cur2?.cardId && cur2.cardId !== cs.cardId) break // a different card is genuinely ahead — polling won't change that
            await sleep(300) // no card yet (queue still rebuilding) — try again
          }
        }
        if (answered === 'uncertain') { failed.push(cs); continue } // checked against the revlog next run
        if (answered) continue
        // Reviewer still would not present it (an UNRELATED due card is ahead, or a daily limit). Record
        // ONE SM-2 step from the card's OWN interval + factor, from BEFORE this sync (else a live read).
        // With neither, do not guess (a failed read once meant "interval 1": a 300-day Good became 3 days).
        const info = preSchedule(cs.cardId) || await ankiRequest('cardsInfo', { cards: [cs.cardId] }).then((r) => r && r[0]).catch(() => null)
        if (!info) throw new Error('could not read the card\'s schedule from Anki')
        const { curIvl, factor, next: newIvl } = oneStepInterval(cs.ease, info.interval, info.factor)
        console.log('[Anki sync] computed-interval fallback (reviewer blocked)', cs.cardId, 'ivl', curIvl, '→', newIvl, 'ease', cs.ease)
        // "!" makes setDueDate ALSO set the interval, so the rating actually takes effect.
        await ankiRequest('setDueDate', { cards: [cs.cardId], days: newIvl + '!' })
        await ankiRequest('insertReviews', { reviews: [[Date.now() + failed.length + recordedCount, cs.cardId, -1, cs.ease, newIvl, curIvl, factor, 0, curIvl > 0 ? 1 : 0]] }) // type 1 = Review: a Learning (0) row on a mature card made FSRS drop its history
          .catch((e) => console.warn('[Anki sync] insertReviews failed (rating still rescheduled):', e.message))
        recorded(cs)
        continue
      } catch (err2) {
        console.error('[Anki sync] fallback failed for card', cs.cardId, err2.message)
        failed.push(cs)
      }
    }
  }
  // The nudge fallback may have left Anki mid-review — return it to the deck list.
  try { await ankiRequest('guiDeckBrowser') } catch {}
  return { failed }
}

// Contract: correctRating. The recorded review stays in history and a FOLLOW-UP corrected review is
// added, one SM-2 step from the PRE-sync interval (what a real mis-tap recovery looks like in Anki).
async function correctRating({ cardId, ease, preSchedule }) {
  const { curIvl, factor, next: newIvl } = oneStepInterval(ease, preSchedule.interval, preSchedule.factor)
  // "!" makes setDueDate ALSO set the interval (not just the due date).
  await ankiRequest('setDueDate', { cards: [cardId], days: newIvl + '!' })
  const revId = Date.now()
  await ankiRequest('insertReviews', { reviews: [[revId, cardId, -1, Math.min(Math.max(ease, 1), 4), newIvl, curIvl, factor, 0, curIvl > 0 ? 1 : 0]] }) // Review, not Learning (see recordRatings)
    .then(() => markCorrectionReview(revId)) // a correction, not a second answer, in today's stats
    .catch((e) => console.warn('[Anki correct] insertReviews failed (schedule still corrected):', e.message))
  console.log('[Anki correct] post-lock correction', cardId, 'pre-ivl', curIvl, '→', newIvl, 'ease', ease)
  return newIvl
}

// ─── Setup (Anki is a separate program) ──────────────────────────────────────
// Server routes in vite.config.js; see "Anki setup states" in CLAUDE.md.
const postJson = async (url) => (await apiFetch(url, { method: 'POST' })).json() // through the platform seam like every /api call
const setupStatus = async () => (await apiFetch('/api/ankiconnect')).json()
const installConnector = () => postJson('/api/ankiconnect')
const focusApp = () => postJson('/api/anki-focus')
const startApp = () => postJson('/api/anki-start')

// The Anki media names of the app's JSON blobs (discover/storage.js). FLAT names: a name with "/" (the old
// `_screenlens/...`) is unwritable in place (AnkiConnect reads the basename while its delete-before-store matches
// nothing, so every write became a hash-suffixed copy and every read returned the FIRST version). The "_" prefix
// keeps Anki's Check Media from listing them as unused. The legacy name is read once as a migration source.
const blobFileName = (kind, key) => `_ebiki_${kind}__${key}.json`
const legacyBlobFileName = (kind, key) => `_screenlens/${kind}__${key}.json`

export const ankiBackend = {
  id: 'anki',
  label: 'Anki',
  capabilities: { cloudSync: true, files: true, setup: true, suspend: true },
  ping: ankiPing,
  getDecks: ankiGetDecks,
  createDeck: ankiCreateDeck,
  addNote: ankiAddNote,
  canAddNote: ankiCanAddNote,
  copyNote: ankiCopyNote,
  moveCards: ankiChangeDeck,
  resetCards: ankiForgetCards,
  suspendedCards: ankiSuspendedCards,
  unsuspendCards: ankiUnsuspend,
  setNoteTags: ankiSetNoteTags,
  findCards: (q) => ankiFindCards(compileQuery(q)),
  findNotes: (q) => ankiFindNotes(compileQuery(q)),
  cardsInfo: ankiCardsInfo,
  notesInfo: ankiNotesInfo,
  updateNoteFields: ankiUpdateNote,
  deleteNotes: ankiDeleteNotes,
  deckStats: ankiGetDeckStats,
  reviewsToday: ankiGetNumCardsReviewedToday,
  reviewsByDay: ankiGetNumCardsReviewedByDay,
  todayReviewStats: ankiGetTodayReviewStats,
  recordRatings,
  correctRating,
  sync: ankiSync,
  syncSoon: ankiSyncSoon,
  cloudAuthState: ankiSyncAuthState,
  storeFile: ankiStoreMediaFile,
  readFile: ankiRetrieveMediaFile,
  blobFileName,
  legacyBlobFileName,
  setupStatus,
  installConnector,
  focusApp,
  startApp,
}
