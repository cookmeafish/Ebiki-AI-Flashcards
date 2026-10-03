// THE CARD-BACKEND CONTRACT. Everything Ebiki does with cards, decks, schedules and review history goes
// through an object shaped like this, so Anki is one implementation (./anki) and can be replaced by
// another app or a home-grown store without touching App.jsx. See ./template.js for a starting point.
//
// The data shapes are Anki's (notes with named fields, cards with an interval and ease factor), because
// that is the model the app was built on and the one every serious SRS shares. A new backend returns
// these shapes; it does not have to store them this way.
//
// ── Shapes ────────────────────────────────────────────────────────────────────────────────────────
// Id: a number (Anki's ids are unix-ms timestamps). Keep ids numeric and unique per kind.
//
// Note (notesInfo):
//   { noteId, modelName, tags: string[], fields: { [name]: { value: html, order: 0.. } }, cards: cardId[],
//     mod?: seconds (last modified) }
//   Field ORDER matters: order 0 is the front, order 1 the back. Names are shown in the card editor.
//   Field values are HTML; AUDIO is written as `[sound:<file name>]` (Anki's markup, kept as the app's card format:
//   the pronunciation embed writes it, App strips it from text and keeps it through edits). A backend that plays
//   audio another way translates at its own boundary; one without files just leaves the markup in place.
//
// Card (cardsInfo):
//   { cardId, note: noteId, deckName, interval: days (0 = new/learning), factor: permille (2500 = 2.5x),
//     type: 0 new | 1 learning | 2 review | 3 relearning, reps, lapses, mod?: seconds,
//     fields: same as the note's, question?: html, answer?: html }
//
// DeckStats (deckStats): { [anyKey]: { name, new_count, learn_count, review_count, total_in_deck } }
//
// Query (findCards / findNotes), every key optional, all present keys AND together:
//   { deck, noteId, cardId, text, ignoreAccents, state: 'due'|'new'|'dueOrNew',
//     excludeSuspended, excludeBuried }
//   `deck` includes its subdecks ("Parent::Child"). `text` matches anywhere in the note's fields
//   (case-insensitive; accent-insensitive when `ignoreAccents`). A query with no keys is an error, never
//   "everything".
//
// Rating: ease 1 Again | 2 Hard | 3 Good | 4 Easy.
//
// Errors: a backend that cannot reach its store throws an Error whose `code` is one of STORE_DOWN_CODES ('notRunning',
// 'timeout', 'closed', or CHANGE_MAYBE_APPLIED: a CHANGE that timed out and may still be applied, so the caller must
// check before retrying). Any other error is a refusal or a bug and is shown as written.
export const CHANGE_MAYBE_APPLIED = 'timeoutChange'
export const STORE_DOWN_CODES = Object.freeze(['notRunning', 'timeout', CHANGE_MAYBE_APPLIED, 'closed'])
export const isStoreDown = (err) => STORE_DOWN_CODES.includes(err?.code)

// Methods every backend MUST implement (the app calls them unguarded).
export const REQUIRED_METHODS = [
  'ping',               // () → bool. Is the store reachable right now? Never throws.
  'getDecks',           // () → string[] deck names ("Parent::Child" for subdecks)
  'createDeck',         // (name) → any. Idempotent.
  'addNote',            // (deck, frontHtml, backHtml, tags[], allowDuplicate) → noteId. Duplicates judged within the deck.
  'canAddNote',         // (deck, frontHtml, backHtml) → bool. true on any doubt: it only warns.
  'copyNote',           // (deck, modelName, fields {name: html}, tags[]) → noteId. A NEW note (duplicates allowed).
  'moveCards',          // (cardIds, deck) → any. Scheduling travels with the cards.
  'resetCards',         // (cardIds) → any. Back to NEW; content untouched.
  'setNoteTags',        // (noteId, oldTags[], newTags[]) → any. Must never leave a note with NO tags on failure.
  'findCards',          // (Query) → cardId[]
  'findNotes',          // (Query) → noteId[]
  'cardsInfo',          // (cardIds) → Card[]
  'notesInfo',          // (noteIds) → Note[]
  'updateNoteFields',   // (noteId, { name: html }) → any. Only the named fields change; written AS GIVEN.
  'deleteNotes',        // (noteIds) → any
  'deckStats',          // (deckNames) → DeckStats
  'reviewsToday',       // () → number of answers recorded today
  'reviewsByDay',       // () → [["YYYY-MM-DD", count], ...] (local days)
  'todayReviewStats',   // () → { reviews, passed, day: "YYYY-MM-DD" } | null (unknown)
  // Record the study session's FINAL ratings. Each card must be recorded AT MOST ONCE; the hooks let the
  // app persist its guards as it goes (a reload mid-call must never answer a card twice).
  //   ({ deck, ratings: [{ cardId, ease, rating, front }], preSchedule(cardId) → {interval, factor}|undefined,
  //      hooks: { recorded(item), markUncertain(cardId, atMs), clearUncertain(cardId),
  //               uncertainSince(cardId) → atMs|undefined, forgetUncertain(cardId), notOurs(cardId) } })
  //   → { failed: item[] }
  // recorded(item): the review is stored (item may carry the ease the store ACTUALLY kept).
  // markUncertain before a call whose outcome can be lost; clearUncertain on a definite refusal.
  // uncertainSince / forgetUncertain: an earlier run's lost call; check your review log and settle it.
  // notOurs(cardId): the card was already answered elsewhere, nothing was recorded for us.
  'recordRatings',
  // Overturn an already-recorded rating with a follow-up review, one scheduling step from the card's
  // PRE-review schedule. ({ cardId, ease, preSchedule: {interval, factor} }) → new interval (days).
  'correctRating',
]

// Optional abilities. The facade supplies a harmless default for each when a backend lacks it, and
// `hasCapability(name)` lets the UI hide what doesn't apply (no "sign in to AnkiWeb" banner for a store
// with no cloud account).
export const OPTIONAL_METHODS = {
  // cloudSync: the store syncs with a remote copy.
  sync: 'cloudSync',            // () → Promise. Awaited only where the result is needed next.
  syncSoon: 'cloudSync',        // () → void. Coalesced, fire-and-forget; never throws.
  cloudAuthState: 'cloudSync',  // () → 'signed-in' | 'signed-out' | 'unknown'
  // files: a small file store that travels with the collection (memory hooks, Discover ledger, audio).
  storeFile: 'files',           // (name, base64) → any
  readFile: 'files',            // (name) → base64 | false (missing)
  // The file names the app's own JSON blobs (memory hooks, grammar log, Discover ledger...) are stored under in that
  // file store; `kind` and `key` are already safe ([a-z0-9_-]). Sync, never throw.
  blobFileName: 'files',        // (kind, key) → name
  legacyBlobFileName: 'files',  // (kind, key) → an OLDER name to migrate from once, or null (none)
  // setup: the store is a separate program the app can diagnose, install into, focus and start.
  setupStatus: 'setup',         // () → object for the setup banner | null
  installConnector: 'setup',    // () → { ok, alreadyInstalled?, ankiRunning?, error? }
  focusApp: 'setup',            // () → { ok }
  startApp: 'setup',            // () → { ok }
  // suspend: cards can be suspended (left out of reviews) and brought back.
  suspendedCards: 'suspend',    // (cardIds) → bool[] (same order: true = suspended)
  unsuspendCards: 'suspend',    // (cardIds) → any. Back into reviews, schedule untouched.
}

// Names of REQUIRED methods a candidate backend is missing (empty = usable).
export function missingMethods(backend) {
  if (!backend || typeof backend !== 'object') return [...REQUIRED_METHODS]
  return REQUIRED_METHODS.filter((m) => typeof backend[m] !== 'function')
}

// Anki-style one-step interval for a rating: the SM-2 step every backend without its own scheduler can
// use, and the math the Anki adapter falls back to when its reviewer is blocked.
export function oneStepInterval(ease, interval, factor) {
  const curIvl = interval > 0 ? interval : 1
  const f = factor >= 1300 ? factor : 2500 // permille (2500 = 2.5x)
  let next
  if (ease === 1) next = 0                                                  // Again → relearn (due today)
  else if (ease === 2) next = Math.max(1, Math.round(curIvl * 1.2))         // Hard
  else if (ease === 3) next = Math.max(1, Math.round(curIvl * f / 1000))    // Good
  else next = Math.max(Math.max(1, Math.round(curIvl * f / 1000)) + 1, Math.round(curIvl * f / 1000 * 1.3)) // Easy (+ bonus), always past Good
  return { curIvl, factor: f, next: Math.min(next, 36500) }
}
