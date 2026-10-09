// Study's "Clear completed": which graded cards it may tuck away. Pure, tested (studyClear.test.js).
//
// Kept on screen:
// - a rated card still waiting for Anki (its Sync button, countdown and any sync error went with it);
// - a card whose grading FAILED and that has no rating yet: its rating menu is the only way to give it one, and
//   clearing it left a card that never reached Anki or the stats.
// Conjugation drills record nothing and rate nothing, so "Close" clears them all.
export const waitsForAnki = (cs) => !!(cs && cs.ease && cs.rating !== 'deleted' && !cs.synced && !cs.isConjugation && !cs.noSync)
export const waitsForRating = (cs) => !!(cs && cs.gradeFailed && !cs.rating && !cs.skipped && !cs.isConjugation)
export const clearableCard = (cs) => !!(cs && cs.done && Array.isArray(cs.results) && cs.results.length > 0 && !waitsForAnki(cs) && !waitsForRating(cs))
