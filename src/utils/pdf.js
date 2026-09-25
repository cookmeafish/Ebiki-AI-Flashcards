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
  const doc = await pdfjs.getDocument({ data }).promise
  const pages = []
  try {
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p)
      const tc = await page.getTextContent()
      const lines = []
      let line = []
      let lastY = null
      const flush = () => { if (line.length) { lines.push(line.join('').replace(/\s+$/, '')); line = [] } }
      const push = (s) => {
        if (!s) return
        // pdf.js splits a visual line into many items; add a space between items when
        // neither side carries one, so words don't fuse ("HelloWorld"). Except between two
        // Chinese/Japanese characters: those scripts put no spaces between words, and pdf.js often
        // splits them into short runs, so the rule turned "日本語の" into "日 本 語 の" (and broke
        // the heading detection the outline relies on). Hangul uses spaces, so it keeps the rule.
        const prev = line.length ? line[line.length - 1] : ''
        if (line.length && !/\s$/.test(prev) && !/^\s/.test(s) && !(CJK_END.test(prev) && CJK_START.test(s))) line.push(' ')
        line.push(s)
      }
      for (const item of tc.items) {
        if (typeof item.str !== 'string') continue
        const y = Array.isArray(item.transform) ? Math.round(item.transform[5]) : null
        if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) flush()
        push(item.str)
        if (item.hasEOL) flush()
        if (y !== null) lastY = y
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
