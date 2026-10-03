// Finding leeches (cards you keep failing) and reading the doctor's reply. Pure, tested.
export const LEECH_LAPSES = 4       // same threshold as the deck browser's ⚠ badge
export const MAX_PATIENTS = 8       // cards diagnosed per visit (one AI call)
export const CAUSES = ['confusable', 'unpinned', 'thin', 'hook', 'wrong']

// cardsInfo entries → one patient per NOTE (its worst card), worst first.
export function findLeeches(cards, min = LEECH_LAPSES) {
  const byNote = new Map()
  for (const c of cards || []) {
    if (!c || !(Number(c.lapses) >= min)) continue
    const prev = byNote.get(c.note)
    if (!prev || c.lapses > prev.lapses) byNote.set(c.note, { noteId: c.note, cardId: c.cardId, lapses: Number(c.lapses), reps: Number(c.reps) || 0 })
  }
  return [...byNote.values()].sort((a, b) => b.lapses - a.lapses)
}

// The model's diagnoses, keyed by noteId; anything malformed is dropped, an unknown cause becomes 'hook'.
export function parseDiagnoses(json, patients) {
  const ids = new Set((patients || []).map((p) => String(p.noteId)))
  const out = new Map()
  for (const d of Array.isArray(json?.diagnoses) ? json.diagnoses : []) {
    const id = String(d?.noteId ?? '')
    if (!ids.has(id) || !d.explanation) continue
    const fix = d.fix && typeof d.fix === 'object' ? { front: String(d.fix.front || '').trim(), back: String(d.fix.back || '').trim() } : null
    out.set(id, {
      cause: CAUSES.includes(d.cause) ? d.cause : 'hook',
      confusedWith: String(d.confusedWith || '').trim(),
      explanation: String(d.explanation).trim(),
      mentor: String(d.mentor || '').trim(),
      fix: fix && (fix.front || fix.back) ? fix : null,
    })
  }
  return out
}

// The card's own text for the doctor and the before/after: the embedded audio's [sound:] tag and its credit line
// are not card text. Shown to the model, a fix kept the tag and dropped the credit (the CC-BY-SA link was lost);
// left out, the rewrite puts the recording back with its credit (cards.rewriteField).
export const cardTextOnly = (s) => String(s || '').replace(/\[sound:[^\]]*\]/gi, '').replace(/^[ \t]*\u{1F50A}.*$/gmu, '').replace(/\n{3,}/g, '\n\n').trim()
export const soundTags = (html) => String(html || '').match(/\[sound:[^\]]+\]/gi) || []

// Does a proposed fix change the card at all? ("" = that side stays.) A fix that changes nothing showed Apply and then
// said "applied" for a card left as it was.
export const fixChangesCard = (fix, card) => !!fix && ((!!fix.front && fix.front !== card?.front) || (!!fix.back && fix.back !== card?.back))

// TREATED cards (per mode): a fixed card stops being a patient until it lapses AGAIN after the fix. The lapse count at
// treatment is kept, so only a new lapse brings it back. { notes: { [noteId]: { lapses, at } } }, newest TREATED_MAX.
export const TREATED_MAX = 500
export const emptyTreated = () => ({ notes: {} })
export const shapeTreated = (v) => (v && typeof v === 'object' && v.notes && typeof v.notes === 'object' && !Array.isArray(v.notes) ? v : emptyTreated())
export function markTreated(value, noteId, lapses, now = Date.now()) {
  const notes = { ...shapeTreated(value).notes, [String(noteId)]: { lapses: Number(lapses) || 0, at: now } }
  const keep = Object.entries(notes).sort((a, b) => (b[1]?.at || 0) - (a[1]?.at || 0)).slice(0, TREATED_MAX)
  return { notes: Object.fromEntries(keep) }
}
// Still resting after its treatment: no lapse since the fix.
export const isTreated = (value, patient) => {
  const t = shapeTreated(value).notes[String(patient?.noteId)]
  return !!t && Number(patient?.lapses) <= Number(t.lapses)
}

// The label of the mentor button follows the cause: a confusion is taught as a difference, a hard to remember card
// gets a way to remember it, anything else a lesson on the card.
export const mentorLabelKey = (cause) => (cause === 'confusable' ? 'doc_mentor' : cause === 'hook' ? 'doc_mentorHook' : 'doc_mentorOther')
