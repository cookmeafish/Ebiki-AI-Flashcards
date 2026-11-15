// OWN WORDS ONLY (pure): course content we ship in git is written in our own words; the exam vendor's outline stays
// local (gitignored). This finds every run of RUN_WORDS or more consecutive words a shipped text shares with the
// outline. Words compare lowercased with punctuation stripped. Allowed on purpose: an objective's own title, kept as
// the label of its section (one short line naming what the exam covers, never more of the document).
export const RUN_WORDS = 12

const words = (s) => String(s || '').toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}+#./-]+/gu, ' ').split(' ').map((w) => w.replace(/^[./-]+|[./-]+$/g, '')).filter(Boolean)

// Every RUN_WORDS-long word sequence of the outline (each line on its own, and each line run on into the next, since a
// copied passage can cross a line).
export function outlineGrams(outlineText, n = RUN_WORDS) {
  const lines = String(outlineText || '').split(/\r?\n/).map((l) => l.replace(/^\s*(#+|-)\s*/, '').replace(/^\d+\.\d+\s+/, '')).filter((l) => l.trim())
  const all = words(lines.join(' '))
  const grams = new Set()
  for (let i = 0; i + n <= all.length; i++) grams.add(all.slice(i, i + n).join(' '))
  return grams
}

// The runs of `text` found in the outline: [{ at, run }] (overlapping hits merged into one run each).
export function copiedRuns(text, grams, n = RUN_WORDS) {
  const w = words(text)
  const hits = []
  for (let i = 0; i + n <= w.length; i++) {
    if (!grams.has(w.slice(i, i + n).join(' '))) continue
    const last = hits[hits.length - 1]
    if (last && i <= last.end) last.end = i + n
    else hits.push({ at: i, end: i + n })
  }
  return hits.map((h) => ({ at: h.at, run: w.slice(h.at, h.end).join(' ') }))
}

// Every shipped text of a course with where it comes from: cards (all fields), knowledge chapters, the package.
// `allowed`: texts that may match (the objective titles).
export function courseTexts({ cards = [], chapters = [], pkg = null }) {
  const out = []
  for (const c of cards) for (const f of ['term', 'definition', 'example', 'category', 'keyPoints']) {
    const v = Array.isArray(c[f]) ? c[f].join(' ') : c[f]
    if (v) out.push({ where: `card "${c.term}" ${f}`, text: String(v) })
  }
  for (const ch of chapters) out.push({ where: `chapter ${ch.name}`, text: ch.text })
  for (const a of pkg?.areas || []) {
    for (const it of a.items || []) out.push({ where: `package item "${it.front}"`, text: `${it.front}\n${it.back}` })
    for (const l of a.lessons || []) out.push({ where: `package lesson "${l.title}"`, text: l.title })
    out.push({ where: `package island ${a.number}`, text: [a.title, a.theme, ...(a.story || []), ...(a.canDo || [])].join('\n') })
  }
  return out
}

// → [{ where, run }] for every copied run not covered by an allowed text.
export function verbatimProblems(texts, grams, allowed = []) {
  const ok = new Set(allowed.map((s) => words(s).join(' ')))
  const out = []
  for (const { where, text } of texts) {
    // An allowed title quoted inside a text is taken out before looking (a card may restate its objective's name).
    let t = ` ${words(text).join(' ')} `
    for (const a of ok) if (a) t = t.split(` ${a} `).join(' | ')
    for (const r of copiedRuns(t, grams)) out.push({ where, run: r.run })
  }
  return out
}
