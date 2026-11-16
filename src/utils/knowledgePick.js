// NARROWING A BIG TABLE OF CONTENTS before the section pick (getKnowledgeContext, App.jsx). A course study guide has
// hundreds of term sections; sending every title to the picker for every card cost about 9,000 tokens a pick. The
// headings that share words with the task (a card's term names its own section) plus every top-level heading are
// enough for the picker, at about a fifth of the size. Free, deterministic, pure (knowledgePick.test.js).
//   outline: [{ title, level, i? }]   task: the text the pick is for
// → the entries to list (same objects, original order). The WHOLE outline when it is small, or when too few titles
//   match to trust the narrowing (the picker then sees everything, as before).
export const NARROW_ABOVE = 250 // outlines up to this size are sent whole
export const NARROW_KEEP = 140 // matched term headings kept at most
export const NARROW_MIN_HITS = 6 // fewer matches than this: don't narrow

const STOP = new Set(('the a an of to in on for and or with by from as at is are was were be been it its this that these those which what when how why who ' +
  'not no can may must should will would could do does did has have had than then so if into about over under between you your we our they their ' +
  'card front back question answer explain define definition example term using used use uses vs versus de la el los las un una y o en que por para con del').split(' '))
// Words of 2+ characters (acronyms count: "AH", "IV"), lower-cased; letters and digits of any script.
export function pickWords(text) {
  return (String(text || '').toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}+.#'-]*/gu) || [])
    .map((w) => w.replace(/[.'-]+$/, '')).filter((w) => w.length >= 2 && !STOP.has(w))
}

export function narrowOutline(outline, task, { above = NARROW_ABOVE, keep = NARROW_KEEP, minHits = NARROW_MIN_HITS } = {}) {
  const list = Array.isArray(outline) ? outline : []
  if (list.length <= above) return list
  const want = new Map() // word → weight (a word said often in the task counts more, capped)
  for (const w of pickWords(task)) want.set(w, Math.min(3, (want.get(w) || 0) + 1))
  if (!want.size) return list
  const scored = list.map((h, pos) => {
    const words = new Set(pickWords(h.title))
    let s = 0
    for (const w of words) if (want.has(w)) s += want.get(w) * (w.length >= 5 ? 2 : 1) // long words say more than "ip"
    return { h, pos, s }
  })
  const hits = scored.filter((x) => x.s > 0 && (x.h.level || 1) > 2)
  if (hits.length < minHits) return list
  const best = new Set(hits.sort((a, b) => b.s - a.s || a.pos - b.pos).slice(0, keep).map((x) => x.pos))
  return scored.filter((x) => (x.h.level || 1) <= 2 || best.has(x.pos)).map((x) => x.h)
}
