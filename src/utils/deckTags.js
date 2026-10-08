// The card editor's tag save: apply only what the user added or removed in the editor (openTags → newTags)
// onto the note's CURRENT tags (re-read from Anki), so a tag added elsewhere since the editor opened
// (Anki's leech, a Tag audit) is kept. Removals match case-insensitively (Anki's tags are); a case-only
// rename ("Verb" → "verb") is a removal plus an add.
export function editorTagTarget(openTags, newTags, curTags) {
  const open = Array.isArray(openTags) ? openTags : []
  const next = Array.isArray(newTags) ? newTags : []
  const cur = Array.isArray(curTags) ? curTags : []
  const lc = (x) => String(x).toLowerCase()
  const removed = new Set(open.filter((x) => !next.includes(x)).map(lc))
  const added = next.filter((x) => !open.includes(x))
  return [...cur.filter((x) => !removed.has(lc(x)) || added.includes(x)), ...added.filter((x) => !cur.includes(x))]
}
