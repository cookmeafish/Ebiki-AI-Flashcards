// COURSE CARDS ARE NEVER DELETED (the owner: "cards from the default deck should not be deletable so that the career
// mode doesn't break"). A note carrying COURSE_TAG (every course card gets it: dev/careers/build-career.mjs) or a
// course's own tag is refused by srs.deleteNotes, whatever path asks (Deck tab, "I know this", a merge). Pure.
export const COURSE_TAG = 'ebiki-course'
// Courses shipped before COURSE_TAG existed: their own tag marks them too.
export const COURSE_TAGS = [COURSE_TAG, 'sy0-701']
export const isCourseNote = (note) => (note?.tags || []).some((t) => COURSE_TAGS.includes(String(t).toLowerCase()))
// → { allowed: ids, kept: ids } from the notes' info (a note the store did not return is allowed: it is gone anyway).
export function splitProtected(ids, notes) {
  const byId = new Map((notes || []).filter(Boolean).map((n) => [n.noteId, n]))
  const kept = ids.filter((id) => isCourseNote(byId.get(id)))
  return { allowed: ids.filter((id) => !kept.includes(id)), kept }
}
