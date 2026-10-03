// What the "Use what Ebiki knows" tile says, and whether it can be picked (pure, tested). `evidence` is the
// screen's read of the learner context: null | { status: 'loading' } | { status: 'ready', ok, sum } (sum =
// kit/evidence.js summarizeEvidence). The tile is offered whenever Ebiki has ANYTHING for the mode (studied or new
// cards, study sessions, chats, slips...); whether it is enough is decided after the click, on a fresh read.
// Each reason names what really happened: a closed Anki is said as such, with what else was used.

export const sourcesText = (t, sum) => (sum?.sources || []).map((id) => t(`lg_src_${id}`)).join(t('lg_srcJoin'))

// → { key, vars, enabled, recheck } for the tile (and the resume screen's button).
export function knownTile(t, evidence) {
  if (!evidence || evidence.status !== 'ready') return { key: 'lg_startKnownChecking', vars: {}, enabled: false, recheck: false }
  const sum = evidence.sum
  if (!evidence.ok || !sum) return { key: 'lg_startKnownDeckFailed', vars: {}, enabled: false, recheck: true }
  const sources = sourcesText(t, sum)
  if (sum.any) {
    if (sum.deckUnreachable) return { key: 'lg_startKnownNoAnkiPartial', vars: { sources }, enabled: true, recheck: true }
    if (sum.enough) return { key: 'lg_startKnownDesc', vars: { sources }, enabled: true, recheck: false }
    return { key: 'lg_startKnownMaybe', vars: { sources }, enabled: true, recheck: false }
  }
  if (sum.deckUnreachable) return { key: 'lg_startKnownNoAnki', vars: {}, enabled: false, recheck: true }
  if (sum.deckFailed) return { key: 'lg_startKnownDeckFailed', vars: {}, enabled: false, recheck: true }
  return { key: 'lg_startKnownNone', vars: {}, enabled: false, recheck: true }
}

// The message after a click that found too little (judgeLevelFromEvidence answered 'thin' or 'read').
export function knownThinText(t, error, sum) {
  if (error === 'read' || !sum) return t('lg_startKnownDeckFailed')
  if (sum.deckUnreachable) return sum.any ? t('lg_knownThinNoAnki', { sources: sourcesText(t, sum) }) : t('lg_startKnownNoAnki')
  if (!sum.any) return t('lg_knownThinNothing')
  return sum.missing === 1 ? t('lg_knownThinOne') : t('lg_knownThin', { n: sum.missing })
}
