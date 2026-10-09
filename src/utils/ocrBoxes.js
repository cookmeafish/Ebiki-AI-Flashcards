// ─── Picture tab geometry (pure, tested in ocrBoxes.test.js) ────────────────
// Placing the vision model's words on the picture and laying out their overlays. The vision read
// gives accurate TEXT but rough boxes; Tesseract gives accurate boxes but rough text. Words are
// matched by text and take Tesseract's box; a word that can't be matched gets `_approxBox` and is
// shown only in the reading panel (never a misplaced overlay).

// Text key for matching: case, accents and punctuation ignored, any script kept. NFD splits accents
// (and Japanese voicing marks) off as combining marks, which the \p{L}\p{N} filter then drops. Recomposed
// after (NFC): NFD also splits a Hangul syllable into 2 to 3 jamo LETTERS, so "아" was a prefix of "안", a slice
// of "안녕" was placed on it, and slices of Korean words were measured in jamo, not characters.
export const ocrMatchKey = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[^\p{L}\p{N}]/gu, '').normalize('NFC')

const center = (b) => ({ cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2 })
const union = (bs) => ({
  x0: Math.min(...bs.map((b) => b.x0)), y0: Math.min(...bs.map((b) => b.y0)),
  x1: Math.max(...bs.map((b) => b.x1)), y1: Math.max(...bs.map((b) => b.y1)),
})
// Two Tesseract boxes on one text line: vertical centres closer than ~70% of the taller box.
const sameLine = (a, b) => {
  const ha = a.y1 - a.y0, hb = b.y1 - b.y0
  return Math.abs((a.y0 + a.y1) / 2 - (b.y0 + b.y1) / 2) <= Math.max(ha, hb) * 0.7
}
const MAX_RUN = 8 // longest run of Tesseract words one vision word may span ("Ministerio de Asuntos Exteriores")

// words: the vision words ({ text, bbox }), changed IN PLACE: matched ones get Tesseract's box,
//   `confidence` and `_snapped`; the rest get `_approxBox`.
// tessWords: Tesseract's words in its reading order ({ text, bbox, confidence }).
// Three passes, each only over words the earlier ones left unplaced, nearest candidate first:
//   1. one Tesseract word with the same text (the common case);
//   2. a RUN of neighbouring Tesseract words on one line that spells the word: a phrase the model
//      kept together ("por favor", "New York") or a CJK word Tesseract cut into single characters;
//   3. a SLICE of one wide Tesseract word that contains the word: Tesseract read a run of CJK text
//      (no spaces) as one word and the model split it ("你好世界" → "你好", "世界"). The slice is
//      proportional to the characters, horizontal text only.
// Returns the number of words placed.
export function snapWordsToBoxes(words, tessWords) {
  const tess = (Array.isArray(tessWords) ? tessWords : [])
    .filter((tw) => tw && tw.bbox)
    .map((tw) => ({ n: ocrMatchKey(tw.text), bbox: tw.bbox, confidence: tw.confidence, used: false, slices: [], ...center(tw.bbox) }))
    .filter((tw) => tw.n)
  const list = Array.isArray(words) ? words : []
  const keys = list.map((w) => ocrMatchKey(w?.text))
  const placed = new Array(list.length).fill(false)
  // A word that came without a box of its own can still take a matching one (any candidate is as near as any other).
  const dist = (w, c) => { if (!w.bbox) return 0; const { cx, cy } = center(w.bbox); return (c.cx - cx) ** 2 + (c.cy - cy) ** 2 }
  const place = (i, bbox, confidence) => {
    const w = list[i]
    w.bbox = bbox; w.confidence = confidence; w._snapped = true; delete w._approxBox
    placed[i] = true
  }

  // 1. Exact single word.
  list.forEach((w, i) => {
    if (!w || !keys[i]) return
    let best = null, bestD = Infinity
    for (const tw of tess) {
      if (tw.used || tw.n !== keys[i]) continue
      const d = dist(w, tw)
      if (d < bestD) { bestD = d; best = tw }
    }
    if (best) { best.used = true; place(i, best.bbox, best.confidence) }
  })

  // 2. A run of neighbouring words on one line.
  list.forEach((w, i) => {
    if (!w || placed[i] || !keys[i]) return
    let best = null, bestD = Infinity
    for (let s = 0; s < tess.length; s++) {
      if (tess[s].used || !keys[i].startsWith(tess[s].n)) continue
      let joined = tess[s].n
      for (let e = s + 1; e < tess.length && e - s < MAX_RUN; e++) {
        const t = tess[e]
        if (t.used || !sameLine(tess[e - 1].bbox, t.bbox)) break
        joined += t.n
        if (!keys[i].startsWith(joined)) break
        if (joined === keys[i]) {
          const run = tess.slice(s, e + 1)
          const box = union(run.map((r) => r.bbox))
          const d = dist(w, center(box))
          if (d < bestD) { bestD = d; best = { run, box } }
          break
        }
      }
    }
    if (best) {
      best.run.forEach((r) => { r.used = true })
      place(i, best.box, Math.min(...best.run.map((r) => Number(r.confidence) || 0)))
    }
  })

  // 3. A slice of one wide word.
  list.forEach((w, i) => {
    if (!w || placed[i] || !keys[i]) return
    let best = null, bestD = Infinity
    for (const tw of tess) {
      if (tw.used || tw.n.length <= keys[i].length) continue
      const bw = tw.bbox.x1 - tw.bbox.x0, bh = tw.bbox.y1 - tw.bbox.y0
      if (bw <= bh) continue // vertical or square: no left-to-right reading to slice by
      const chars = [...tw.n], key = [...keys[i]]
      for (let at = 0; at + key.length <= chars.length; at++) {
        if (chars.slice(at, at + key.length).join('') !== keys[i]) continue
        if (tw.slices.some(([a, b]) => at < b && at + key.length > a)) continue // that part is already someone's
        const per = bw / chars.length
        const box = { x0: Math.round(tw.bbox.x0 + at * per), y0: tw.bbox.y0, x1: Math.round(tw.bbox.x0 + (at + key.length) * per), y1: tw.bbox.y1 }
        const d = dist(w, center(box))
        if (d < bestD) { bestD = d; best = { tw, box, at, len: key.length } }
      }
    }
    if (best) { best.tw.slices.push([best.at, best.at + best.len]); place(i, best.box, best.tw.confidence) }
  })

  list.forEach((w, i) => { if (w && !placed[i]) w._approxBox = true })
  return placed.filter(Boolean).length
}

// Overlay boxes for the drawn words: each box shrunk 10% top and bottom (so lines don't touch), moved
// by `offset`, and same-row neighbours clamped so they never overlap (a hover then always lands on the
// word under the pointer). `skip(i)` marks words that are NOT drawn (`_approxBox`): their rough boxes
// must not clip a real neighbour. Returns one box per word, in the same order.
export function overlayBoxes(words, offset = { x: 0, y: 0 }, skip = () => false) {
  const off = offset || { x: 0, y: 0 }
  const boxes = (Array.isArray(words) ? words : []).map((word) => {
    const { x0, y0, x1, y1 } = word?.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 }
    const vPad = Math.round((y1 - y0) * 0.1)
    return { x0: x0 + off.x, y0: y0 + vPad + off.y, x1: x1 + off.x, y1: y1 - vPad + off.y }
  })
  for (let i = 0; i < boxes.length; i++) {
    if (skip(i)) continue
    for (let j = i + 1; j < boxes.length; j++) {
      if (skip(j)) continue
      const a = boxes[i], b = boxes[j]
      const avgH = ((a.y1 - a.y0) + (b.y1 - b.y0)) / 2
      if (Math.abs(a.y0 - b.y0) > avgH * 0.5) continue
      if (a.x1 > b.x0 && a.x0 < b.x0) a.x1 = b.x0 - 1
      else if (b.x1 > a.x0 && b.x0 < a.x0) b.x1 = a.x0 - 1
    }
  }
  return boxes
}

// Right-to-left scripts: a line mostly written in one reads from its RIGHTMOST word.
const RTL_LETTER = /[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}]/u
const isRtlLine = (texts) => {
  let rtl = 0, all = 0
  for (const t of texts) for (const ch of String(t ?? '')) { if (/\p{L}/u.test(ch)) { all++; if (RTL_LETTER.test(ch)) rtl++ } }
  return all > 0 && rtl * 2 > all
}

// Reading-order lines inferred from the BOXES (for word lists that came without the vision model's own
// `line`: Tesseract, the clean-screenshot fast path). Top to bottom; a new line when the vertical centre
// jumps by more than ~70% of the word height. Within a line words go in READING order: left to right, or
// right to left for an Arabic/Hebrew line (the reading panel lays each line out with dir="auto", so a
// left-to-right list showed every RTL line backwards). Returns [{ line, idxs }] with indices into `words`.
export function readingLines(words) {
  const list = Array.isArray(words) ? words : []
  const order = list.map((w, i) => i).filter((i) => list[i]?.bbox)
    .sort((a, b) => (list[a].bbox.y0 - list[b].bbox.y0) || (list[a].bbox.x0 - list[b].bbox.x0))
  const lines = []
  let prev = null
  for (const i of order) {
    const { y0, y1 } = list[i].bbox
    const cy = (y0 + y1) / 2, hgt = y1 - y0
    if (!prev || Math.abs(cy - prev.cy) > Math.max(hgt, prev.hgt) * 0.7) lines.push([])
    lines[lines.length - 1].push(i)
    prev = { cy, hgt }
  }
  return lines.map((idxs, line) => {
    const rtl = isRtlLine(idxs.map((i) => list[i].text))
    return { line, idxs: idxs.slice().sort((a, b) => rtl ? list[b].bbox.x0 - list[a].bbox.x0 : list[a].bbox.x0 - list[b].bbox.x0) }
  })
}

// Where a hover tooltip goes, in LAYOUT px (the body is zoomed: rects are real px). Above the word,
// or below it when there is less than `roomAbove` layout px above; centred on the word, kept
// `half` px from both edges of the zoom-adjusted viewport.
export function hoverTooltipPos(rect, zoom, viewportWidth, { half = 160, roomAbove = 180, gap = 6 } = {}) {
  const z = Number(zoom) > 0 ? Number(zoom) : 1
  const vw = (Number(viewportWidth) || 0) / z
  let x = (rect.left + rect.width / 2) / z
  let y = rect.top / z - gap
  let anchor = 'above'
  if (rect.top / z < roomAbove) { y = rect.bottom / z + gap; anchor = 'below' }
  // A viewport narrower than the tooltip: centre it rather than letting min/max cross over.
  x = vw > half * 2 ? Math.max(half, Math.min(vw - half, x)) : vw / 2
  return { x, y, anchor }
}
