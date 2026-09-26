// AnkiConnect API wrapper — communicates via Vite proxy at /api/anki
import DOMPurify from 'dompurify'

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
  const res = await fetch('/api/anki', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, version: 6, params }),
  })
  // A reply cut off mid-stream (Anki closed while answering) is not JSON; say that instead of
  // surfacing the parser's "Unexpected end of JSON input" to the user.
  let data
  try { data = await res.json() } catch { throw new Error('Anki sent an incomplete reply. Check that Anki is open, then try again.') }
  ankiLog(`response: ${action}`, data)
  if (data && data.error) throw new Error(data.error)
  if (!data) throw new Error('Anki sent an empty reply. Check that Anki is open, then try again.')
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
  if (!candidates.length) throw new Error('No two-field note type (like "Basic") exists in this Anki collection.')
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

// Plain text that contains "<" (code: "#include <stdio.h>", "vector<int>", "a < b") was written to
// Anki as HTML, where "<stdio.h>" parses as a tag and disappears from the card. Every "<" that does NOT
// open a real HTML element (or a comment) is escaped on the way in, so the app's own markup (<b>,
// <br>, <div>, the audio credit <a>) and any HTML already on a card pass through untouched.
const HTML_TAGS = new Set(('a abbr address area article aside audio b base bdi bdo big blockquote body br button canvas caption ' +
  'center cite code col colgroup data dd del details dfn dialog div dl dt em embed fieldset figcaption figure font footer form ' +
  'h1 h2 h3 h4 h5 h6 head header hr html i iframe img input ins kbd label legend li link main map mark math meta meter nav ' +
  'noscript object ol optgroup option output p param picture pre progress q rp rt ruby s samp script section select small ' +
  'source span strike strong style sub summary sup svg table tbody td template textarea tfoot th thead time title tr track tt u ul var video wbr ' +
  // ruby (furigana). NOT generic SVG/MathML names: "<path>", "<text>", "<line>" are everyday code
  // placeholders ("git add <path>"), and only NEW text reaches this function now (ankiUpdateNote writes
  // existing card HTML as given).
  'rb rtc nobr').split(' '))
export const escapeStrayLt = (html) => {
  const text = String(html ?? '')
  // A hyphenated name is a custom element only when the text also CLOSES it (<anki-mathjax>…</anki-mathjax>);
  // on its own it is a placeholder ("git checkout <branch-name>") and must stay visible.
  const closed = new Set([...text.matchAll(/<\/([a-zA-Z][\w-]*-[\w-]*)\s*>/g)].map((m) => m[1].toLowerCase()))
  // Kept as markup only when it really is a tag: a known name FOLLOWED by whitespace, "/", ">" or the end
  // ("a<b && c>d" and "j<i;" are code, not <b>/<i>), not a lone uppercase letter (the generics in
  // "PhantomData<S>", "fn f<A, B>"), and "<!" only for a comment ("List<?> items" lost its "<?>" to the
  // HTML parser's bogus-comment rule, "<?php ... ?>" vanished).
  return text.replace(/<(?!!--)(\/?)([a-zA-Z][\w-]*)?/g, (m, slash, name, offset) => {
    const next = text.charAt(offset + m.length)
    // With attributes, what follows must READ as attributes up to the ">" ("<b && c>" is code).
    const attrsOk = !/\s/.test(next) || /^(\s+[a-zA-Z_:][\w:.-]*(\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+))?)*\s*\/?>/.test(text.slice(offset + m.length))
    // A real tag CLOSES: ">" or "/>" right after the name, or attributes up to ">" (attrsOk). At the END of the
    // text or before a bare "/" it is not one ("True when a<b", "if a<b/2 then c"): kept as markup, the HTML
    // parser threw away everything from there.
    const real = name && (next === '>' || text.startsWith('/>', offset + m.length) || /\s/.test(next)) && attrsOk && !/^[A-Z]$/.test(name)
      && (HTML_TAGS.has(name.toLowerCase()) || (name.includes('-') && closed.has(name.toLowerCase())))
    return real ? m : '&lt;' + slash + (name || '')
  })
}

// NEW card content (AI-written, or typed) as safe card HTML. Anki's reviewer RUNS script in a card, and
// AnkiWeb carries the card to every device, so text a web-search result, a knowledge file or an
// attached deck smuggled into a model reply ("<img src=x onerror=…>") would execute on every review.
// Script-capable markup goes; formatting, [sound:…] and ordinary inline styles stay. Never applied to
// HTML read back from an existing card (copies, the audio embed): that is the user's own content.
const CARD_FORBID = ['script', 'iframe', 'frame', 'object', 'embed', 'style', 'link', 'meta', 'base', 'form', 'input', 'textarea', 'select', 'button']
export const sanitizeCardHtml = (html) => {
  const s = escapeStrayLt(html)
  try { return (DOMPurify && DOMPurify.isSupported) ? DOMPurify.sanitize(s, { FORBID_TAGS: CARD_FORBID }) : s } catch { return s }
}

export async function ankiAddNote(deckName, front, back, tags = [], allowDuplicate = false) {
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
      options: { allowDuplicate },
      tags,
    },
  }))
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

// Replace a note's tags with newTags. Tags are space-separated in AnkiConnect.
// It used to remove EVERY old tag and then add the new set, so a failure between the two calls
// (Anki closed, a dialog, the proxy timeout) left the card with no tags at all. Now only the
// difference moves, and the adds go first: a failure part-way leaves extra tags, never none.
// Anki matches tags case-insensitively, so a case-only change is a remove + re-add, and removing
// "a" also removes its children ("a::b"), so any wanted child of a removed tag is added back after.
export async function ankiSetNoteTags(noteId, oldTags = [], newTags = []) {
  ankiLog(`setting tags on note ${noteId}`, newTags)
  const clean = (a) => [...new Set((a || []).map((t) => String(t).trim()).filter(Boolean))]
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
  if (removed.length) await ankiRequest('removeTags', { notes: [noteId], tags: removed.join(' ') })
  const addAfter = newList.filter(hitByRemove)
  if (addAfter.length) await ankiRequest('addTags', { notes: [noteId], tags: addAfter.join(' ') })
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
    const res = await withBasicModel(({ modelName, fieldNames }) => ankiRequest('canAddNotes', {
      // The SAME text ankiAddNote stores: checked raw, "vector<int>" compared as "vector" and never matched.
      notes: [{ deckName, modelName, fields: { [fieldNames[0]]: sanitizeCardHtml(front), [fieldNames[1]]: sanitizeCardHtml(back) }, tags: [] }],
    }))
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
  const all = []
  for (const deck of decks) {
    try { all.push(...((await ankiRequest('cardReviews', { deck, startID })) || [])) } catch { continue }
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
  return { reviews, passed }
}

// Revlog ids (unix ms) of the rows Ebiki inserted as post-lock corrections, kept on this computer.
const CORRECTION_KEY = 'ebiki-correction-revlog'
function correctionReviewIds() {
  try { return new Set((JSON.parse(localStorage.getItem(CORRECTION_KEY) || '[]') || []).map(Number)) } catch { return new Set() }
}
export function markCorrectionReview(id) {
  try {
    const keep = [...correctionReviewIds()].filter((x) => x > Date.now() - 3 * 86400000)
    localStorage.setItem(CORRECTION_KEY, JSON.stringify([...keep, Number(id)].slice(-200)))
  } catch { /* stats only */ }
}

export async function ankiFindNotes(query) {
  ankiLog(`finding notes: ${query}`)
  return ankiRequest('findNotes', { query })
}

export async function ankiNotesInfo(notes) {
  ankiLog(`getting info for ${notes.length} notes`)
  return ankiRequest('notesInfo', { notes })
}

// Fields are written AS GIVEN: callers send either HTML read back from Anki (the audio embed re-sends
// the whole back, and escaping there garbled tags like <rb> or <svg> children on a card nobody edited)
// or plain text they have already escaped. A caller writing raw AI text runs escapeStrayLt itself.
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
    // Signed in, but the first sync after signing in needs a full upload/download ("Sync status ... not one
    // of ..."): auth exists, which is all this asks.
    if (/sync status/i.test(String(err?.message || ''))) return 'signed-in'
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

// A deck search term with the deck name ESCAPED. Inside Anki's search syntax `_` matches any one
// character and `*` any run, so `deck:"Unit_1"` also matched "Unit 1" and "Unit-1" - and a study
// session then pulled another deck's cards, which the reviewer never presents, so they fell to the
// setDueDate fallback and had reviews recorded that nobody made. Subdecks still match (Parent::*).
export const ankiDeckTerm = (deck) => `deck:"${String(deck || '').replace(/[\\"*_]/g, (c) => '\\' + c)}"`
