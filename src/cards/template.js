// A STARTING POINT for your own card store. Copy this file (e.g. ./mystore/index.js), fill in each
// method, then in ./index.js: `registerBackend(myBackend)` and `selectBackend('mystore')`.
// Shapes, argument lists and the at-most-once rules are in ./contract.js; ./anki/index.js is the full
// reference implementation. Nothing imports this file.
//
// Tips:
// - Keep ids numeric and unique (Date.now()-based works). Notes need fields with `order` 0 (front) and
//   1 (back); App.jsx reads them by order.
// - Run new card content through sanitizeCardHtml (../html) in addNote, as the Anki backend does.
// - findCards/findNotes get a structured Query object, never a search string.
// - Without your own scheduler, oneStepInterval (../contract) gives Anki-like SM-2 steps for
//   recordRatings and correctRating.
// - Leave out optional methods you don't support (and their capability): the app hides those surfaces.
// - Throw errors with a `code` from STORE_DOWN_CODES (../contract) when the store is unreachable, so the app says
//   "not reachable" instead of "failed" (CHANGE_MAYBE_APPLIED for a write that may still land).
// - Card fields keep the app's format: HTML, audio as `[sound:<file>]` (see the Note shape in ../contract).
// - With a file store (capability `files`): storeFile/readFile, and optionally blobFileName/legacyBlobFileName.
const notYet = (name) => async () => { throw new Error(`${name} is not implemented yet`) }

export const templateBackend = {
  id: 'template',
  label: 'My card store',
  capabilities: { cloudSync: false, files: false, setup: false },
  ping: async () => false,
  getDecks: notYet('getDecks'),
  createDeck: notYet('createDeck'),
  addNote: notYet('addNote'),
  canAddNote: async () => true,
  copyNote: notYet('copyNote'),
  moveCards: notYet('moveCards'),
  resetCards: notYet('resetCards'),
  setNoteTags: notYet('setNoteTags'),
  findCards: notYet('findCards'),
  findNotes: notYet('findNotes'),
  cardsInfo: notYet('cardsInfo'),
  notesInfo: notYet('notesInfo'),
  updateNoteFields: notYet('updateNoteFields'),
  deleteNotes: notYet('deleteNotes'),
  deckStats: notYet('deckStats'),
  reviewsToday: async () => 0,
  reviewsByDay: async () => [],
  todayReviewStats: async () => null,
  // For each rating: store the review, move the card's due date, then hooks.recorded(item).
  // Return { failed: [items you could not record] }.
  recordRatings: notYet('recordRatings'),
  correctRating: notYet('correctRating'),
}
