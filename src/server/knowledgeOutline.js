// KNOWLEDGE-BASE OUTLINE: headings and table-of-contents matching for big knowledge bases (whole books).
// Pure (no fs): the server reads the files and hands { name, text } objects in. Moved out of vite.config.js
// so it can be tested; every regex here must stay LINEAR on adversarial lines (see knowledgeOutline.test.js).

export const TOC_NAME_RE = /(^|[^a-z])(toc|table[ _-]*of[ _-]*contents)([^a-z]|$)/i

// Chapter words in the languages Ebiki is used with, plus CJK "第N章/課/节" forms. English-only
// matching missed "Capítulo 3" / "第1章", merged their content into a neighbour and pushed a
// non-English book under the 4-heading threshold (the "no table of contents" warning).
export const CHAPTER_RE = /^(chapter|module|unit|part|section|lesson|domain|appendix|cap[ií]tulo|tema|unidad|lecci[oó]n|parte|chapitre|le[cç]on|partie|kapitel|lektion|teil|capitolo|lezione)\s+(\S+).{0,100}$/iu
// The chapter NUMBER: digits, an UPPERCASE Roman numeral ("CHAPTER IV", "Part II"; uppercase only,
// so "Unit mix" is not read as a numeral), or a spelled-out English number ("Chapter One"). These
// books got no outline at all and were cut to their first 60k characters.
const SPELLED_NUMS = new Set('one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty'.split(' '))
const chapterNumOk = (tok) => /^\d+(\.\d+)*[.:)]?$/.test(tok) || /^[IVXLCDM]+[.:)]?$/.test(tok) || SPELLED_NUMS.has(tok.toLowerCase().replace(/[.:)]$/, ''))
// Levels by the WORD: a Part holds chapters and a Section sits inside one. All level 1 made
// picking "Part 1" or "Chapter 1" return only the text up to the next line of that list.
const PART_WORDS = /^(part|parte|partie|teil)$/i
const SUB_WORDS = /^(section|lesson|lecci[oó]n|le[cç]on|lektion|lezione)$/i
// PROSE WRAPPED ONTO A NEW LINE is not a heading. PDF text has no paragraph breaks to go by, but a
// wrapped sentence gives itself away: its text after the number starts with a lowercase word
// ("Chapter 5 when we cover...", "1980 and was revised..."). Headings are "Chapter 5", "Chapter 5: Routing".
// Lowercase alone is not enough: "1.1 mRNA and translation", "2.2 malloc and free", "3.4 iOS setup"
// are headings. Prose shows itself by a FUNCTION word right after the number, or by its length.
const PROSE_WORDS = new Set(('and or but nor so yet was were is are be been has have had will would can could when while where which who that ' +
  'we you they it he she this these those than then if as by of in on at to for from with into y o u que de del en con por para es son era fue ' +
  'und oder aber ist sind war wird der die das den dem des mit von zu et ou mais est sont le les des du au aux e é são com na no').split(' '))
const UNIT_WORDS = new Set('hz khz mhz ghz thz kb mb gb tb pb kbps mbps gbps ms ns km cm mm kg mg ml px pt dpi rpm bit bits byte bytes percent'.split(' '))
const ABBREV_WORDS = new Set('vs etc fig eg ie no st mt cf al approx ch sec vol ed'.split(' '))
export const proseAfterNumber = (rest) => {
  const words = String(rest).trim().split(/\s+/).filter(Boolean)
  if (!words.length) return false
  const bare = (w) => w.toLowerCase().replace(/[^\p{L}]/gu, '')
  // Wrapped PDF prose that starts with a number and a capital: a unit ("5 GHz band, which offers..."),
  // a sentence break inside ("2.4 GHz band used by 802.11b/g. Both are"), or a function word at the END
  // ("443 HTTPS and port 22 SSH, which you will see on"). Headings do none of these.
  if (words.length >= 2) {
    // A unit as written in prose (GHz, MB, kbps), not a Title-case word ("2.1 Bits and Bytes", "1.4 Hz and frequency").
    if (UNIT_WORDS.has(bare(words[0])) && !/^\p{Lu}\p{Ll}+$/u.test(words[0].replace(/[^\p{L}]/gu, ''))) return true
    // A sentence ending mid-line: a lowercase word + "." + a capital. Not an abbreviation ("vs. Stateless",
    // "U.S. Law", "Fig. 3").
    if (words.some((w, i) => i < words.length - 1 && /^\p{Ll}{2,}[.!?]$/u.test(w) && !ABBREV_WORDS.has(bare(w)) && /^\p{Lu}/u.test(words[i + 1]))) return true
    // Title Case capitalizes a final particle ("Logging In", "Turning It On"); prose leaves it lowercase.
    const last = words[words.length - 1]
    // Only WITH another prose sign (a comma, or a long line): sentence-case headings end on a preposition
    // too ("1.2 Who this book is for", "Chapter 5 What to look for").
    if (words.length >= 3 && /^\p{Ll}/u.test(last) && PROSE_WORDS.has(bare(last)) && (/,/.test(words.join(' ')) || words.length >= 8)) return true
  }
  if (!/^\p{Ll}/u.test(words[0])) return false
  if (PROSE_WORDS.has(bare(words[0]))) return true
  // A line that ENDS on a function word ("...across the campus by") was cut mid-sentence. That and the
  // length rule apply only to a plain lowercase first word: "1.1 mRNA and translation of proteins in
  // cells" and "3.4 iOS setup for the app" are long headings whose first word is a mixed-case term.
  if (!/^\p{Ll}+$/u.test(words[0].replace(/[^\p{L}]/gu, ''))) return false
  return PROSE_WORDS.has(bare(words[words.length - 1])) || words.length >= 6
}
export const chapterLevel = (t) => {
  const m = t.match(CHAPTER_RE)
  if (!m || !chapterNumOk(m[2])) return null
  // A separator after the number ("Chapter 1: the basics", "Chapter 3 · the basics") marks a title.
  const restCh = t.slice(m[0].indexOf(m[2]) + m[2].length)
  // A SENTENCE that opens with a chapter word ("Part 2 explains this later.", "Chapter 5 covers routing.")
  // is prose: as a heading it cut the real chapter short at that line.
  // Only WITHOUT a separator, and only a period: "Chapter 1: What is a Network?" is a real title.
  const sepCh = /[.:)]$/.test(m[2]) || /^\s*[:·\-–—.|]/.test(restCh)
  // ...and only when the text after the number starts LOWERCASE ("Chapter 7 The End." and "Chapter 3 Life in
  // the U.S." are titles) and the period is not an ellipsis ("What Comes Next...").
  if (!sepCh && /(?<!\.)[.。]$/.test(t) && /^\p{Ll}/u.test(restCh.trim()) && restCh.trim().split(/\s+/).length >= 2) return null
  if (!sepCh && proseAfterNumber(restCh)) return null
  if (PART_WORDS.test(m[1])) return 0
  // "Lesson 1" is a top-level unit (its "1.1 Vocabulary" sits below it); "Section 1.2" nests by its dots.
  if (SUB_WORDS.test(m[1])) return Math.min(3, m[2].replace(/[.:)]$/, '').split('.').length)
  return 1
}
// Full-width digits (Japanese PDFs use them; JS \d is ASCII only) and Korean "제N장".
const CJK_CHAPTER_RE = /^(第\s*[\d０-９一二三四五六七八九十百]+\s*[章課课节節回部編编]|제\s*[\d０-９]+\s*[장과부편]).{0,100}$/u
// Level by the unit character, like the chapter words: 部/編/编/부/편 (part) 0, 章/課/课/回/장/과 1,
// 节/節 (section) 2. All level 1 made picking 第一章 return only its intro before 第一节.
// A CJK chapter line that ends like a sentence (第三章介绍了…。) is prose, as above.
export const cjkHead = (t) => CJK_CHAPTER_RE.test(t) && !/[。.]$/.test(t) // 第一章 什么是网络？ is a title
export const cjkLevel = (t) => {
  const m = t.match(/^(?:第\s*[\d０-９一二三四五六七八九十百]+\s*([章課课节節回部編编])|제\s*[\d０-９]+\s*([장과부편]))/u)
  if (!m) return null
  const u = m[1] || m[2]
  return /[部編编부편]/u.test(u) ? 0 : /[节節]/u.test(u) ? 2 : 1
}
// For DETECTION only (titles keep what was written): full-width digits and their "．" / "）" (Japanese PDFs),
// and Arabic-Indic / Persian digits with the Arabic decimal mark "٫". "１．２ カタカナ" and "١٫١ مقدمة" missed the
// ASCII \d numbering rule. One character in, one out, so offsets and slices stay valid.
const DIGIT_MAP = { '．': '.', '）': ')', '٫': '.' }
export const normDigits = (s) => String(s).replace(/[０-９．）٠-٩۰-۹٫]/g, (c) => {
  const n = c.charCodeAt(0)
  if (n >= 0xff10 && n <= 0xff19) return String(n - 0xff10)
  if (n >= 0x0660 && n <= 0x0669) return String(n - 0x0660)
  if (n >= 0x06f0 && n <= 0x06f9) return String(n - 0x06f0)
  return DIGIT_MAP[c] || c
})

export const detectHeadings = (file) => {
  const out = []
  const lines = file.text.split('\n')
  // Lines inside ``` / ~~~ fences are code: a "# install deps" comment there is not a heading.
  const inFence = []
  // A fence closes only on its OWN marker: a ~~~ inside a ``` block toggled it, and the rest of the file
  // (every heading after it) was taken for code.
  let fence = ''
  for (const line of lines) {
    const t = line.trim()
    const mk = (t.match(/^(```|~~~)/) || [])[1]
    if (mk && (!fence || fence === mk)) { inFence.push(true); fence = fence ? '' : mk; continue }
    inFence.push(!!fence)
  }
  // A file with markdown headings has its structure in them. Numbered and chapter-word lines
  // there are body text (a "1. HTTP uses port 80" list became three level-1 sections and the
  // last one swallowed the next real section).
  // Trusted in a .md file; in a .txt (every PDF upload) one stray "# of hosts" or indented code comment
  // switched the whole book to markdown mode and threw its chapter outline away, so a .txt needs 3+
  // such lines and no chapter-word / CJK chapter lines.
  const mdLines = lines.filter((line, i) => !inFence[i] && /^#{1,6}\s+\S/.test(line.trim())).length
  const hasMarkdown = mdLines > 0 && (/\.(md|markdown)$/i.test(file.name || '') ||
    (mdLines >= 3 && !lines.some((l, i) => !inFence[i] && (chapterLevel(l.trim()) !== null || cjkHead(l.trim())))))
  // "1. Introduction" is a chapter heading in plenty of PDF text; it is a list item when the line
  // right above or below is another "N." item (headings are separated by body text).
  const listMarker = (l) => /^\d+[.)]\s/.test(normDigits(String(l || '').trim()))
  const isListRun = (i) => listMarker(lines[i - 1]) || listMarker(lines[i + 1])
  let off = 0
  lines.forEach((line, i) => {
    const t = line.trim()
    const d = normDigits(t) // detection; the title keeps t
    let m
    if (inFence[i]) { /* code */ }
    // A CONTENTS-PAGE line ("Chapter 3 IP Addressing .......... 41"): its "section" is that one line, and as the
    // first copy of the title it came before the real chapter start (a picked chapter returned the contents page).
    else if (!hasMarkdown && TOC_LEADER_RE.test(d)) { /* contents line */ }
    // Only in markdown mode: in a PDF's text a stray "# of hosts per subnet" row became a level-1 heading
    // that cut its chapter short (it falls through to the numbered/chapter checks instead).
    else if (hasMarkdown && (m = t.match(/^(#{1,6})\s+(.{2,120})$/))) {
      out.push({ file: file.name, title: m[2].trim(), level: m[1].length, start: off, md: true })
    } else if (!hasMarkdown && (chapterLevel(d) !== null || cjkHead(d))) {
      out.push({ file: file.name, title: t.slice(0, 120), level: cjkHead(d) ? cjkLevel(d) : chapterLevel(d), start: off })
    // CJK titles are short ("2.1 助詞", "3.2 帧"): two characters are a whole title there.
    } else if (!hasMarkdown && d.length <= 110 && /^\d+(\.\d+){0,3}[.)]?\s+(?:\p{L}.{2,100}|[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}].{0,100})$/u.test(d)
      // Title-like only: a sentence ("2024 was the year it changed.") ends in a period, and a
      // bare "1. " / "1) " is a list marker, not "1.2 Title" numbering.
      && !/[.!?。]$/.test(d) && !(/^\d+[.)]\s/.test(d) && isListRun(i))
      && !proseAfterNumber(d.replace(/^\d+(\.\d+){0,3}[.)]?/, ''))) { // "1980 and was revised..." is wrapped prose
      const num = d.match(/^(\d+(?:\.\d+)*)/)
      out.push({ file: file.name, title: t.slice(0, 120), level: Math.min(4, num[1].split('.').length), start: off })
    }
    off += line.length + 1
  })
  // RUNNING HEADS: a PDF book repeats "46 Networking Basics" / "Chapter 3 Routing 47" at the top of
  // every page, and each copy became a heading (a 600-page book: 300 of 315 outline entries), so a
  // chosen chapter came back as one page. A detected title that repeats 3+ times (page numbers set
  // aside) keeps only its FIRST occurrence, the chapter's real start. Markdown headings are left
  // alone: a repeated "## Summary" there is a real section each time.
  // A bare "Chapter 7" (nothing after the number) keeps its number: stripped, all chapters of a book
  // laid out "CHAPTER N" / title-on-the-next-line folded into ONE key and only the first survived.
  const headKey = (h) => {
    const t = normDigits(h.title).toLowerCase()
    const m = t.match(CHAPTER_RE)
    if (m && !t.slice(m[0].indexOf(m[2]) + m[2].length).trim()) return t.trim()
    return t.replace(/^\d+\s+/, '').replace(/(?<!\s)\s+\d+$/, '').trim()
  }
  // Keys once, indices grouped by key: filtering the whole outline per repeated title cost 2 s on a
  // 1500-section book, on every knowledge read.
  const keys = out.map(headKey)
  const byKey = new Map()
  out.forEach((h, i) => { if (!h.md) { if (!byKey.has(keys[i])) byKey.set(keys[i], []); byKey.get(keys[i]).push(i) } })
  const counts = new Map([...byKey].map(([k, v]) => [k, v.length]))
  // Which copy is the REAL chapter start: the one followed by the most text before the next heading.
  // Keeping simply the first kept the contents-page line ("Chapter 2 Routing 20"), whose "section"
  // is that one line.
  const gap = (i) => (i + 1 < out.length ? out[i + 1].start : file.text.length) - out[i].start
  // A copy with a TRAILING page number ("Chapter 2 Switching 47") is a running head or a contents
  // line; the real start has none. Measured by gap alone, the true start (followed at once by its
  // "2.1" subsection) lost to a running head a page later. Gap only decides among equals.
  const pageTail = (h) => /(?<!\s)\s+\d+$/.test(normDigits(h.title))
  const best = new Map()
  out.forEach((h, i) => {
    if (h.md || (counts.get(keys[i]) || 0) < 3) return
    const k = keys[i]
    if (!best.has(k)) { best.set(k, i); return }
    const cur = out[best.get(k)]
    if (pageTail(cur) && !pageTail(h)) { best.set(k, i); return }
    if (pageTail(h) && !pageTail(cur)) return
    if (gap(i) > gap(best.get(k)) * 1.2) best.set(k, i) // a near tie keeps the earlier copy
  })
  // A title whose EVERY copy carries a page number, and not the same one ("2 Networking Essentials",
  // "4 Networking Essentials" on every even page), is the book's running head, not a chapter: one
  // kept copy became a fake chapter that cut the real one short.
  // Numbers in the SAME place on every copy: a real "2 Routing" (number in front) with running heads
  // "Routing 15", "Routing 17" (behind) is a chapter plus its heads, and keeps its start.
  const leadNum = (h) => (h.title.match(/^(\d+)\s+/) || [])[1]
  const tailNum = (h) => (h.title.match(/\s+(\d+)$/) || [])[1]
  const pureRunningHead = new Set()
  for (const k of best.keys()) {
    const copies = (byKey.get(k) || []).map((i) => out[i])
    // Leading numbers only: trailing-number heads ("Chapter 2 Switching 47") can be the only trace
    // of a chapter whose own heading line was not detected, so they keep their best copy.
    // ...unless one copy is a numbered CHAPTER: the copy followed by its own "3.1" section is the real
    // "3 Routing", and the others ("48 Routing", "50 Routing") are its verso running heads.
    // Not when the title AFTER the number is itself a chapter line: "1 Chapter 1 Networking" is page 1's running
    // head, and its "1." test matched the "1.2" section after it, so it beat the real "Chapter 1 Networking".
    const realAt = (byKey.get(k) || []).find((i) => leadNum(out[i]) && out[i + 1] && out[i + 1].title.startsWith(leadNum(out[i]) + '.')
      && chapterLevel(out[i].title.replace(/^\d+\s+/, '')) === null) ?? -1
    if (realAt >= 0) { best.set(k, realAt); continue }
    const nums = copies.map(leadNum)
    // A trailing number the SAME on every copy is part of the title ("2 Microsoft Excel 2019"), not a page.
    if (nums.every(Boolean) && (!copies.some(tailNum) || new Set(copies.map(tailNum)).size === 1) && new Set(nums).size > 1) pureRunningHead.add(k)
  }
  // Seen fewer than 3 times, WITH and WITHOUT a trailing page number: the numbered copy is the contents
  // line ("Chapter 2 Routing 20"), whose section is that one line. Only the real start is kept.
  const hasPlain = new Set(out.map((h, i) => (!h.md && !pageTail(h) ? keys[i] : null)).filter((k) => k !== null))
  // Also by the EXACT title minus one page number: "Chapter 2: Windows 11 21" is the contents copy of
  // "Chapter 2: Windows 11" (both end in a number, so the key test above never told them apart).
  const exactTitles = new Set(out.filter((h) => !h.md).map((h) => h.title.toLowerCase()))
  const contentsCopy = (h, i) => !h.md && pageTail(h) && (counts.get(keys[i]) || 0) < 3
    && (hasPlain.has(keys[i]) || exactTitles.has(h.title.replace(/\s+\d+$/, '').toLowerCase()))
  const kept = out.filter((h, i) => h.md || ((counts.get(keys[i]) || 0) < 3 ? !contentsCopy(h, i) : (best.get(keys[i]) === i && !pureRunningHead.has(keys[i]))))
  // A BARE chapter line ("CHAPTER 3" with its title on the next line, the usual PDF layout) gets that title:
  // an outline of "CHAPTER 1, CHAPTER 2, ..." gave Ebi nothing to choose sections by. Done after the
  // running-head pass (whose keys stay the bare form), and only for a short, title-like next line.
  const starts = new Set(out.map((h) => h.start))
  return kept.map(({ md, ...h }) => {
    if (md) return h
    const m = h.title.match(CHAPTER_RE)
    const bare = (m && !h.title.slice(m[0].indexOf(m[2]) + m[2].length).trim()) || /^(第\s*[\d０-９一二三四五六七八九十百]+\s*[章課课节節回部編编]|제\s*[\d０-９]+\s*[장과부편])$/u.test(h.title)
    if (!bare) return h
    const lineEnd = file.text.indexOf('\n', h.start)
    if (lineEnd < 0) return h
    let pos = lineEnd + 1
    let next = ''
    // The next non-empty line (at most 2 blank lines in between).
    for (let k = 0; k < 3 && pos < file.text.length; k++) {
      const e = file.text.indexOf('\n', pos)
      const line = file.text.slice(pos, e < 0 ? undefined : e).trim()
      if (line) { next = starts.has(pos) ? '' : line; break }
      if (e < 0) break
      pos = e + 1
    }
    if (next.length < 2 || next.length > 60 || /[.,;:!?。、，]$/u.test(next) || !/^[\p{Lu}\p{Lo}\d]/u.test(next) || TOC_LEADER_RE.test(next)) return h
    return { ...h, title: `${h.title}: ${next}`.slice(0, 120) }
  })
}
// A TOC entry or content line reduced to comparable text: lowercase, no list bullet, no dotted
// leader + page number. keepNum keeps a trailing number, because it can be part of the title
// ("Windows 11", "Appendix 2"); the stripped form is only a fallback.
// A dotted leader before the page number, in the forms PDF tools actually write: "....", ". . . .",
// "····" and "……" (only "..." was recognised, so a real toc.txt matched nothing and was dropped).
// Whitespace has ONE owner per step: "(?:\s*[.]\s*){2,}" let a space belong to either neighbour, so a
// spaced leader that did not end in digits ("Preface . . . . xi") backtracked 2^n ways and froze the
// whole server (26 dots = 24 s, per knowledge load). Roman page numbers (front matter) count too.
// A ROMAN page number only after a real leader (4+ leader characters): prose ellipses are 3 dots or one
// "…", and "Ready, Set... Mix" / "Vitamins ... c" lost their last word (the heading then never matched).
// Each alternative starts only where a leader run STARTS (lookbehind): starting inside a long run made
// every position try the rest of it (30,000 dots took 2.4 s, on every knowledge load).
export const TOC_LEADER_RE = /(?<![.·…_\s])\s*(?:[.·…_]\s*){2,}\d+$|(?<!…)…+\s*\d+$|(?<![.·…_\s])\s*(?:[.·…_]\s*){4,}[ivxlcdm]+$/i
export const tocNorm = (l, keepNum) => {
  // Digits normalized on BOTH sides of the match: a full-width page number ("……１２") was never stripped.
  let t = normDigits(String(l).trim()).replace(/^[-*•>\s]+/, '').replace(TOC_LEADER_RE, '')
  if (!keepNum) t = t.replace(/(?<!\s)\s+\d+$/, '') // (?<!\s): each whitespace run is tried ONCE (unanchored, a 5000-space run inside a line was quadratic)
  return t.trim().toLowerCase()
}
export const extractOutline = (files) => {
  const tocFiles = files.filter((f) => TOC_NAME_RE.test(f.name))
  // NATURAL order (ch2 before ch10): the TOC search walks the files in order from the last match, and
  // alphabetical order put ch10-ch12 before ch2, so their entries were never found.
  const contentFiles = files.filter((f) => !TOC_NAME_RE.test(f.name)).slice().sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
  let outline = []
  if (tocFiles.length && contentFiles.length) {
    const titles = tocFiles.flatMap((f) => f.text.split('\n'))
      .map((l) => ({ raw: tocNorm(l, true), bare: tocNorm(l, false), shown: String(l).trim().replace(/^[-*•>\s]+/, '').replace(TOC_LEADER_RE, '').trim(), indent: String(l).replace(/\t/g, '    ').match(/^\s*/)[0].length }))
      .filter((t) => t.bare.length >= 3 && t.bare.length <= 120)
    // Every content line once, with its offset, in file order.
    const lines = []
    for (const f of contentFiles) {
      let off = 0
      for (const line of f.text.split('\n')) {
        lines.push({ file: f.name, start: off, leader: TOC_LEADER_RE.test(line.trim()), raw: tocNorm(line, true), bare: tocNorm(line, false) })
        off += line.length + 1
      }
    }
    const unnumbered = (s) => s.replace(/^\d+(?:\.\d+)*[.)]?\s*/, '')
    for (const ln of lines) ln.un = unnumbered(ln.bare)
    // Number-stripped forms compare only when at most ONE side had a trailing number: "Chapter 1" matched the
    // line "Chapter 2" (both stripped to "chapter"), and every later entry landed a chapter late.
    const numOk = (ln, t) => ln.raw === ln.bare || t.raw === t.bare
    const sameLine = (ln, t) => ln.raw === t.raw || (!!ln.bare && ln.bare === t.bare && numOk(ln, t))
      || (ln.un.length >= 3 && ln.un === unnumbered(t.bare) && numOk(ln, t))
    // Lines indexed by each comparable form: an entry that matched nothing scanned the whole book with two
    // regex replaces per line (800 entries x 50k lines = 2 s per knowledge load).
    const index = new Map()
    const addIdx = (k, i) => { if (!k) return; const a = index.get(k); if (a) a.push(i); else index.set(k, [i]) }
    lines.forEach((ln, i) => { addIdx('r:' + ln.raw, i); addIdx(ln.bare ? 'b:' + ln.bare : '', i); addIdx(ln.un.length >= 3 ? 'u:' + ln.un : '', i) })
    const candidatesFrom = (t, from) => {
      const tu = unnumbered(t.bare)
      const all = [...(index.get('r:' + t.raw) || []), ...(index.get('b:' + t.bare) || []), ...(tu.length >= 3 ? index.get('u:' + tu) || [] : [])]
      return [...new Set(all)].filter((i) => i >= from).sort((x, y) => x - y)
    }
    // WHOLE LINES, searched IN ORDER from after the previous match. First-substring-anywhere matched
    // every entry to the book's own contents page ("Introduction 1"), a mention in earlier prose, or
    // (for a repeated "Summary") the first chapter's copy every time.
    // Indentation steps of the toc file, for entries with no number and no chapter word.
    const indents = [...new Set(titles.map((t) => t.indent))].sort((x, y) => x - y)
    // Part / Chapter / Section and CJK units nest like in detectHeadings; numbers nest by depth;
    // otherwise the indentation. All-unnumbered-at-level-1 made "Part I" and "Chapter 1" end at
    // their first subsection.
    const tocLevel = (t, num) => {
      const cl = chapterLevel(t.shown) ?? cjkLevel(t.shown)
      if (cl !== null) return cl
      if (num) return Math.min(4, num[1].split('.').length)
      return Math.min(4, 1 + Math.max(0, indents.indexOf(t.indent)))
    }
    let cursor = 0
    titles.forEach((t, ti) => {
      const next = titles[ti + 1]
      for (const i of candidatesFrom(t, cursor)) {
        if (!sameLine(lines[i], t)) continue
        // A contents page lists the NEXT entries right below this one: that is the list, not the chapter.
        // Only when the line carries a page number or TWO following entries line up in a row: a real
        // chapter title is often followed directly by its first subsection ("Chapter 1" / "1.1 OSI").
        let j = i + 1
        while (j < lines.length && !lines[j].bare) j++
        if (next && j < lines.length && sameLine(lines[j], next)) {
          let k = j + 1
          while (k < lines.length && !lines[k].bare) k++
          const next2 = titles[ti + 2]
          const listed = next2 && k < lines.length && sameLine(lines[k], next2)
          // A contents line has a dotted leader, or it AND the next line end in page numbers; a heading
          // "Chapter 1" followed by "1.1 Intro" is the real start (it was skipped as a contents line).
          // Numbers the toc entries THEMSELVES end in ("Chapter 1" / "1.1 Installing Windows 11") are titles.
          const titleNums = lines[i].raw === t.raw && lines[j].raw === next.raw
          if (lines[i].leader || (!titleNums && lines[i].raw !== lines[i].bare && lines[j].raw !== lines[j].bare) || listed) continue
        }
        const num = t.bare.match(/^(\d+(?:\.\d+)*)/)
        outline.push({ file: lines[i].file, title: (lines[i].raw === t.raw ? t.shown : t.shown.replace(/(?<!\s)\s+\d+$/, '')).slice(0, 120), level: tocLevel(t, num), start: lines[i].start })
        cursor = i + 1
        break
      }
    })
    outline.sort((a, b) => (a.file === b.file ? a.start - b.start : a.file.localeCompare(b.file, undefined, { numeric: true }))) // natural order: ch2 before ch10
  }
  if (outline.length < 4) outline = contentFiles.flatMap(detectHeadings)
  return outline
}
export const sliceSections = (files, outline, ids, cap) => {
  const byFile = Object.fromEntries(files.map((f) => [f.name, f.text]))
  const parts = []
  for (const id of ids) {
    const h = outline[id]
    const text = h && byFile[h.file]
    if (!text) continue
    // Section runs until the next heading in the same file at the same or higher level.
    let end = text.length
    for (let j = id + 1; j < outline.length; j++) {
      const n = outline[j]
      if (n.file !== h.file) break
      if (n.level <= h.level) { end = n.start; break }
    }
    parts.push(`### ${h.title} (${h.file})\n${text.slice(h.start, end).trim()}`)
  }
  let joined = parts.join('\n\n')
  if (joined.length > cap) joined = joined.slice(0, cap)
  return joined
}
