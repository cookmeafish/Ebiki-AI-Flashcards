// ─── Tesseract helpers for the Picture tab (pure parts tested in ocr.test.js) ─────────────────
// preprocessForOCR makes the high-contrast copy Tesseract reads first; the rest clean Tesseract's
// word list (filter, de-duplicate, tidy) without touching the DOM.
import { ocrMatchKey } from './ocrBoxes'

const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b

// RGBA pixels (as read from a canvas the image was drawn on WITHOUT a backdrop) → grayscale, high
// contrast, dark text on a light page, fully opaque. Changes `data` in place and returns it.
// Transparent pixels are laid on a backdrop first. Its colour follows the CONTENT: white under dark
// content, black under light content. A plain white backdrop made white text on a transparent PNG
// (a dark theme export) white on white, and Tesseract read 4 words of 19.
export function preprocessPixels(data) {
  const d = data
  const n = d.length / 4
  if (!n) return d
  let alphaSum = 0, contentLum = 0, seeThrough = false
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3] / 255
    if (a < 1) seeThrough = true
    alphaSum += a
    contentLum += a * lum(d[i], d[i + 1], d[i + 2])
  }
  const backdrop = seeThrough && alphaSum > 0 && contentLum / alphaSum > 140 ? 0 : 255

  // Step 1: composite on the backdrop + grayscale
  let total = 0
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3] / 255
    const gray = lum(d[i], d[i + 1], d[i + 2]) * a + backdrop * (1 - a)
    d[i] = d[i + 1] = d[i + 2] = gray
    d[i + 3] = 255
    total += gray
  }
  // Step 2: dark page? (Tesseract prefers dark text on white)
  const isDark = total / n < 128
  // Step 3: moderate contrast (1.8x: 2.5 was crushing details), Step 4: invert a dark page
  for (let i = 0; i < d.length; i += 4) {
    let v = Math.max(0, Math.min(255, (d[i] - 128) * 1.8 + 128))
    if (isDark) v = 255 - v
    d[i] = d[i + 1] = d[i + 2] = v
  }
  return d
}

// The high-contrast copy as a PNG data URL. Resolves the ORIGINAL when the image can't be read back
// (a tainted canvas: an SVG with foreignObject; a 0x0 SVG; undecodable): it threw and the promise never
// settled, so Picture sat on "Preparing image" forever.
export function preprocessForOCR(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        if (!img.width || !img.height) { resolve(dataUrl); return }
        const c = document.createElement('canvas')
        c.width = img.width
        c.height = img.height
        const ctx = c.getContext('2d')
        ctx.drawImage(img, 0, 0) // no backdrop here: preprocessPixels picks one from the content
        const imageData = ctx.getImageData(0, 0, c.width, c.height)
        preprocessPixels(imageData.data)
        ctx.putImageData(imageData, 0, 0)
        resolve(c.toDataURL('image/png'))
      } catch { resolve(dataUrl) }
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

// One character of a script written without spaces (Han, kana, Hangul syllable) is a whole WORD.
const CJK_CHAR = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]$/u
const CJK_TEXT = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}ー々]+$/u
const SINGLE_LETTER_CONF = 85
const SINGLE_CJK_CONF = 60

// Tesseract's Japanese/Chinese boxes can run far past their word: 天気 (2 characters, 30px tall) came back
// 229px wide, covering the four words after it. The left edge is right, so a horizontal CJK box wider than
// 1.6 em per character is cut back to 1.1 em per character. Other scripts and vertical text are untouched.
export function fitCjkBox(text, bbox) {
  const t = String(text ?? '').trim()
  if (!bbox || !CJK_TEXT.test(t)) return bbox
  const n = [...t].length, w = bbox.x1 - bbox.x0, h = bbox.y1 - bbox.y0
  if (h <= 0 || w <= h || w <= n * h * 1.6) return bbox
  return { ...bbox, x1: Math.round(bbox.x0 + n * h * 1.1) }
}

const EDGE_JUNK = /^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu

// Tesseract's words → the words worth showing (the offline OCR path). Keeps any script; drops
// unconfident reads, slivers, banners and tiny boxes; trims punctuation off the ends; scales boxes by
// `bboxScale` (the OCR copy was downscaled). `log(msg)` hears every drop.
// A single letter needs 85% (stray "l", "I" from icons and borders), but a single CJK character is a
// word in its own right: at 85% the Japanese を (84%) and the Chinese 气 were dropped from sentences.
export function filterTessWords(words, { realW, realH, bboxScale = 1, log = () => {} } = {}) {
  return (Array.isArray(words) ? words : [])
    .filter((w) => {
      if (!w || !w.bbox) return false
      const t = String(w.text ?? '').trim()
      if (t.length === 0) return false
      if (!/\p{L}/u.test(t)) return false // any script: a-z only reported "No readable text" for Russian, Greek, Korean...
      // Clean text first (strip leading/trailing non-letters): use cleaned length for thresholds
      const cleaned = t.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '') || t
      const letters = cleaned.match(/\p{L}/gu) || []
      if (letters.length < 2) {
        if (letters.length === 1 && w.confidence >= (CJK_CHAR.test(letters[0]) ? SINGLE_CJK_CONF : SINGLE_LETTER_CONF)) return true
        return false
      }
      const minConf = cleaned.length <= 2 ? 65 : cleaned.length <= 3 ? 45 : 35
      if (w.confidence < minConf) {
        log(`[FILTERED conf] "${cleaned}" conf=${Math.round(w.confidence)} < ${minConf}`)
        return false
      }
      const bw = w.bbox.x1 - w.bbox.x0, bh = w.bbox.y1 - w.bbox.y0
      if (bw > 0 && bh > 0 && (bw / bh > 15 || bh / bw > 5)) {
        log(`[FILTERED shape] "${cleaned}" aspect=${(bw / bh).toFixed(1)} (${bw}x${bh})`)
        return false
      }
      if (bw < 10 || bh < 10) {
        log(`[FILTERED tiny] "${cleaned}" (${bw}x${bh})`)
        return false
      }
      // Reject oversized bboxes (UI banners, not individual words)
      const scaledBw = bw * bboxScale, scaledBh = bh * bboxScale
      if (realW && realH && scaledBw * scaledBh > realW * realH * 0.05) {
        log(`[FILTERED huge] "${cleaned}" covers ${((scaledBw * scaledBh) / (realW * realH) * 100).toFixed(1)}% of image`)
        return false
      }
      if (realW && scaledBw > realW * 0.4) {
        log(`[FILTERED wide] "${cleaned}" width=${Math.round(scaledBw)} > 40% of image`)
        return false
      }
      return true
    })
    .map((w) => {
      const text = w.text.trim().replace(EDGE_JUNK, '') || w.text.trim() // any script: Latin-1 only cut "był" to "by" and kept Cyrillic/CJK punctuation
      return {
        text,
        bbox: fitCjkBox(text, {
          x0: Math.round(w.bbox.x0 * bboxScale), y0: Math.round(w.bbox.y0 * bboxScale),
          x1: Math.round(w.bbox.x1 * bboxScale), y1: Math.round(w.bbox.y1 * bboxScale),
        }),
        confidence: w.confidence,
      }
    })
}

const area = (b) => Math.max(0, b.x1 - b.x0) * Math.max(0, b.y1 - b.y0)
const overlap = (a, b) => {
  const ix = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), iy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)
  return ix > 0 && iy > 0 ? ix * iy : 0
}

// One read per piece of text. The two OCR passes (and Tesseract itself) can report the same text twice:
// - boxes overlapping by IoU > 0.4 keep the more confident read (IoU, so a large bad box can't eat
//   valid words);
// - the SAME text whose smaller box lies mostly inside the other's is one word read twice with a sloppy
//   box: the tighter box wins. Japanese 日 came back at 45px and at 184px wide (IoU 0.24), and the
//   reading panel said "日 日 本 語".
export function dedupeOcrWords(words, log = () => {}) {
  const out = []
  for (const w of Array.isArray(words) ? words : []) {
    if (!w || !w.bbox) continue
    const wa = area(w.bbox), wk = ocrMatchKey(w.text)
    let dominated = false
    for (let k = out.length - 1; k >= 0; k--) {
      const d = out[k]
      const inter = overlap(w.bbox, d.bbox)
      if (!inter) continue
      const da = area(d.bbox)
      const iou = inter / (wa + da - inter)
      if (wk && wk === ocrMatchKey(d.text) && inter / Math.min(wa, da) > 0.6) {
        if (wa < da) { log(`[DEDUP] "${d.text}" read twice: kept the tighter box`); out.splice(k, 1); continue }
        dominated = true
        break
      }
      if (iou > 0.4) {
        if (w.confidence > d.confidence) {
          log(`[DEDUP] "${d.text}" (${Math.round(d.confidence)}%) replaced by "${w.text}" (${Math.round(w.confidence)}%) IoU=${(iou * 100).toFixed(0)}%`)
          out.splice(k, 1)
        } else {
          log(`[DEDUP] "${w.text}" (${Math.round(w.confidence)}%) dropped, kept "${d.text}" (${Math.round(d.confidence)}%) IoU=${(iou * 100).toFixed(0)}%`)
          dominated = true
          break
        }
      }
    }
    if (!dominated) out.push(w)
  }
  return out
}

// Box-finder words (the clean fast path translates these as they are): punctuation trimmed off the ends,
// reads with no letter or digit dropped, runaway CJK boxes cut back (fitCjkBox). "。" became a word of
// its own (a chip, a translation, a hover box) and a gear icon came back as "©". Digits stay: a vision
// "2024" snaps onto its box.
export function tidyOcrWords(words) {
  return (Array.isArray(words) ? words : [])
    .map((w) => {
      const t = String(w?.text ?? '').trim()
      const text = t.replace(/^[^\p{L}\p{M}\p{N}]+|[^\p{L}\p{M}\p{N}]+$/gu, '')
      return { ...w, text, bbox: fitCjkBox(text, w?.bbox) }
    })
    .filter((w) => w.bbox && /[\p{L}\p{N}]/u.test(w.text))
}

// OCR words with no translation yet (click-to-translate mode, or a scan with no API key): each keeps its
// text, box and confidence and gets an empty translation, so the boxes and the reading panel show the words
// and a hover/click (or a key added later) fills the meaning in. Never a "Loading…" text stored as the
// translation (it stayed when the retry failed).
export function untranslatedOcrWords(words) {
  return (Array.isArray(words) ? words : []).filter((w) => w && w.bbox && String(w.text ?? '').trim()).map((w, idx) => ({
    ...w, text: String(w.text).trim(), _untranslated: true, translation: '', synonyms: [], category: 'foreign',
    partOfSpeech: '', pronunciation: '', isEnglish: false, _own: false, _globalIdx: idx,
  }))
}
