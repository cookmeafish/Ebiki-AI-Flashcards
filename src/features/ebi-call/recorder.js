// Saving a call's grades as reviews: the kit's recordReviews (at-most-once, guarded per call in local storage).
import { recordReviews } from '../kit/reviews'

const GUARD_KEY = 'ebiki-call-guards'

// ratings: [{ cardId, ease, rating, front }], preSchedule: Map cardId -> { interval, factor }
// → { recorded: [cardId], failed: [cardId] }
export const recordCall = ({ callId, deck, ratings, preSchedule }) => recordReviews({ guardKey: GUARD_KEY, runId: callId, deck, ratings, preSchedule })
