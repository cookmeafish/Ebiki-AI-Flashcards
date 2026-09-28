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
