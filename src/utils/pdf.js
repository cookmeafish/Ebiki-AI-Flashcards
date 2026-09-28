// PDF → plain text extraction (client-side, pdf.js). The library is lazy-loaded so its
// ~1MB only ever downloads when a user actually uploads a PDF. Line breaks are rebuilt
// from each text item's y-position (+ pdf.js's own hasEOL flags) because the knowledge
// outline extractor depends on real LINES — chapter headings and TOC entries must land
// on their own line, not inside one giant paragraph.
// Han ideographs, kana, CJK punctuation and full-width forms: text written without inter-word spaces.
const CJK = '\\u3000-\\u303f\\u3040-\\u30ff\\u31f0-\\u31ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff\\uff00-\\uffef'
const CJK_END = new RegExp(`[${CJK}]$`)
const CJK_START = new RegExp(`^[${CJK}]`)

export async function extractPdfText(file, onProgress) {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  const data = await file.arrayBuffer()
  // Adobe's predefined CMaps: a Chinese/Japanese PDF whose font relies on one (UniJIS-UCS2-H...) came back
  // with NO text and was reported as a scanned PDF. Served by the dev server from the installed package.
  const doc = await pdfjs.getDocument({
    data,
    cMapUrl: '/node_modules/pdfjs-dist/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: '/node_modules/pdfjs-dist/standard_fonts/',
  }).promise
  const pages = []
  try {
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p)
      const tc = await page.getTextContent()
      const lines = []
      let line = []
      let lastY = null
      let lastH = 0
      let prevEnd = null // x where the previous run ended (null = unknown)
      let prevStart = null // x where it started
      const flush = () => { if (line.length) { lines.push(line.join('').replace(/\s+$/, '')); line = [] } prevEnd = null; prevStart = null }
      const push = (s, gap) => {
        if (!s) return
        // pdf.js splits a visual line into many items and emits its own " " item for a real gap. Between
        // two runs with no space on either side, a space goes in only when they are APART on the page:
        // a word whose font changes midway ("C" + "HAPTER 3" in small caps, bold "Impor" + "tant") is one
        // word (it came out "C HAPTER 3" and the outline lost its chapters). Without positions, the old
        // rule (always a space) stands. Never between two Chinese/Japanese characters ("日本語の" became
        // "日 本 語 の"); Hangul uses spaces, so it keeps the rule.
        const prev = line.length ? line[line.length - 1] : ''
        if (line.length && !/\s$/.test(prev) && !/^\s/.test(s) && !(CJK_END.test(prev) && CJK_START.test(s)) && gap !== false) line.push(' ')
        line.push(s)
      }
      for (const item of tc.items) {
        if (typeof item.str !== 'string') continue
        const tr = Array.isArray(item.transform) ? item.transform : null
        const y = tr ? Math.round(tr[5]) : null
        const h = Math.abs(Number(item.height) || (tr ? Number(tr[3]) || Number(tr[0]) : 0) || 0)
        // A new LINE only past a real line step: superscripts, subscripts and footnote marks sit a few
        // units off the baseline and cut "E = mc²" into three lines.
        if (lastY !== null && y !== null && Math.abs(y - lastY) > Math.max(2, 0.7 * Math.max(lastH, h))) flush()
        const x = tr ? Number(tr[4]) : NaN
        // Apart on EITHER side: past the previous run's end, or (right-to-left text, runs drawn out of order)
        // ending well before its start. A run that touches either edge, or sits back over the previous one (an
        // accent drawn over its letter, kerning), is the same word.
        const w = Number(item.width)
        const thr = 0.2 * (h || lastH || 10)
        const gap = (prevEnd === null || !Number.isFinite(x)) ? undefined
          : (x - prevEnd > thr || (prevStart !== null && Number.isFinite(w) && prevStart - (x + w) > thr))
        push(item.str, gap)
        prevEnd = Number.isFinite(x) && Number.isFinite(w) ? x + w : null
        prevStart = Number.isFinite(x) ? x : null
        if (item.hasEOL) flush()
        if (y !== null) { lastY = y; lastH = h || lastH }
      }
      flush()
      pages.push(lines.join('\n'))
      onProgress?.(p, doc.numPages)
      page.cleanup()
    }
  } finally {
    try { doc.destroy() } catch { /* already destroyed */ }
  }
  return pages.join('\n\n')
}
