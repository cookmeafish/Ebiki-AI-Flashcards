// When the streak celebration may show (pure, tested). A celebration is OWED once the day's first XP extends the
// streak; it shows only after the user has been free (nothing busy, nothing holding focus) for CELEBRATE_SETTLE_MS.
// The settle time covers the gaps between one quiz or batch and the next (a raid's Continue?, a remounted runner),
// which used to read as "idle" for a moment and pop the modal over the fight.
export const CELEBRATE_SETTLE_MS = 1500

// Returns how long to wait before showing (0 = show now), or -1 = nothing to show / still busy.
export function celebrateWait({ owed, busy, freeSince, now }) {
  if (!owed || busy) return -1
  if (!Number.isFinite(freeSince)) return CELEBRATE_SETTLE_MS
  const left = CELEBRATE_SETTLE_MS - Math.max(0, now - freeSince)
  return left > 0 ? left : 0
}
