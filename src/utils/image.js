// ─── Image helpers for vision/multimodal AI calls ───────────────────────────
// Convert a data URL into the neutral shape our providers consume, and downscale
// large screenshots before upload (faster, cheaper, within vision model limits).

// Split a `data:<mime>;base64,<data>` URL into { mediaType, base64 }.
// Falls back to image/png if the prefix is malformed.
export function dataUrlToImagePart(dataUrl) {
  const m = /^data:([^;,]+)?(?:;[^,]*)?,(.*)$/s.exec(dataUrl || '')
  if (!m) return { mediaType: 'image/png', base64: '' }
  // "image/jpg" is not a registered type and providers reject it; it is the same bytes as image/jpeg.
  const mediaType = (m[1] || 'image/png').toLowerCase().replace(/^image\/jpg$/, 'image/jpeg')
  // Strip any whitespace that can sneak into base64 payloads.
  const base64 = (m[2] || '').replace(/\s/g, '')
  return { mediaType, base64 }
}

// Rough VISUAL-noise estimate: mean absolute luminance difference between horizontal
// neighbors on a small grayscale thumbnail (~30ms). Flat UI screenshots (app windows,
// web pages, plain backgrounds) score low; busy game scenes / photos score high.
// Returns ~0.01-0.04 for clean screens, ~0.08+ for busy ones; 1 (=busy) on failure.
export function estimateImageNoise(dataUrl, sample = 96) {
  return new Promise((resolve) => {
    try {
      const img = new Image()
      img.onload = () => {
        try {
          const w = sample
          const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * sample))
          const c = document.createElement('canvas')
          c.width = w; c.height = h
          const ctx = c.getContext('2d')
          ctx.drawImage(img, 0, 0, w, h)
          const d = ctx.getImageData(0, 0, w, h).data
          let sum = 0, n = 0
          for (let y = 0; y < h; y++) {
            for (let x = 1; x < w; x++) {
              const i = (y * w + x) * 4, j = i - 4
              const la = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
              const lb = 0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2]
              sum += Math.abs(la - lb); n++
            }
          }
          resolve(n ? (sum / n) / 255 : 1)
        } catch { resolve(1) }
      }
      img.onerror = () => resolve(1)
      img.src = dataUrl
    } catch { resolve(1) }
  })
}

// Re-encode a data URL so its longest edge is <= maxEdge. Returns the original
// data URL unchanged when it's already small enough (or on any failure).
// Vision models (Claude ~1568px, others similar) gain nothing from larger inputs,
// and smaller payloads upload faster and cost fewer tokens.
// Formats every provider accepts in an image part. Anything else the browser can decode (BMP, AVIF, SVG,
// ICO) is re-encoded even when small: sent as-is it got a 400 from every provider, and because the chat
// re-attaches recent images, every later message in that chat failed too.
// JPEG and PNG only: GIF is not a Gemini type, xAI takes jpg/png only, and OpenAI refuses an animated
// GIF, so GIF/WebP are re-encoded (first frame) like any other format.
const PORTABLE_IMAGE = /^data:image\/(jpeg|jpg|png)[;,]/i
export function downscaleDataUrl(dataUrl, maxEdge = 1500, mimeType = 'image/jpeg', quality = 0.9) {
  return new Promise((resolve) => {
    try {
      const img = new Image()
      img.onload = () => {
        const portable = PORTABLE_IMAGE.test(String(dataUrl || ''))
        let longEdge = Math.max(img.naturalWidth, img.naturalHeight)
        if (portable && (!longEdge || longEdge <= maxEdge)) { resolve(dataUrl); return }
        let w0 = img.naturalWidth, h0 = img.naturalHeight
        if (!longEdge) { w0 = h0 = longEdge = 1024 } // an SVG with no intrinsic size
        const scale = Math.min(1, maxEdge / longEdge)
        const c = document.createElement('canvas')
        c.width = Math.max(1, Math.round(w0 * scale))
        c.height = Math.max(1, Math.round(h0 * scale))
        const ctx = c.getContext('2d')
        // JPEG has no alpha, so transparent pixels came out BLACK: a big pasted PNG of dark text on a
        // transparent background became dark text on black, and the vision model read nothing. Paint a
        // white page first. An opaque image (every screenshot) covers it completely, so it is unchanged.
        if (!/png|webp|gif/i.test(mimeType)) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height) }
        ctx.drawImage(img, 0, 0, c.width, c.height)
        try { resolve(c.toDataURL(mimeType, quality)) }
        catch { resolve(dataUrl) }
      }
      img.onerror = () => resolve(dataUrl)
      img.src = dataUrl
    } catch { resolve(dataUrl) }
  })
}

// ─── Pictures the Picture tab can read ──────────────────────────────────────
// Tesseract (Leptonica) reads PNG, JPEG and WebP data URLs; the vision upload takes JPEG and PNG (re-encoded by
// downscaleDataUrl). Anything else the browser can show (SVG, AVIF, ICO, BMP, GIF) is turned into a PNG ONCE,
// when the picture loads: the local OCR threw "Error attempting to read image" on an SVG or AVIF (the whole scan
// failed), and an SVG with no width/height had no size at all, so no word box could ever be drawn on it.
const OCR_READY_IMAGE = /^data:image\/(png|jpe?g|webp)[;,]/i
export const needsRasterCopy = (dataUrl, w, h) => !(Number(w) > 0 && Number(h) > 0) || !OCR_READY_IMAGE.test(String(dataUrl || ''))

// The size an SVG declares (width/height attributes in px, else its viewBox): an <img> of an SVG with only a
// viewBox reports 0x0. null when it declares nothing usable.
export function svgIntrinsicSize(svgText) {
  const tag = /<svg\b[^>]*>/i.exec(String(svgText || ''))?.[0]
  if (!tag) return null
  const attr = (name) => new RegExp(`\\s${name}\\s*=\\s*["']\\s*([^"']*)["']`, 'i').exec(tag)?.[1]
  const px = (v) => { const m = /^([\d.]+)\s*(px)?$/i.exec(String(v || '').trim()); const n = m ? Number(m[1]) : NaN; return n > 0 ? n : null }
  const w = px(attr('width')), h = px(attr('height'))
  const vb = String(attr('viewBox') || '').trim().split(/[\s,]+/).map(Number)
  const vw = vb.length === 4 && vb[2] > 0 ? vb[2] : null, vh = vb.length === 4 && vb[3] > 0 ? vb[3] : null
  if (w && h) return { w, h }
  if (w && vw && vh) return { w, h: w * vh / vw }
  if (h && vw && vh) return { w: h * vw / vh, h }
  if (vw && vh) return { w: vw, h: vh }
  return null
}

// The text of an SVG data URL (base64 or URL-encoded), else ''.
export function svgTextOf(dataUrl) {
  const m = /^data:image\/svg\+xml(;[^,]*)?,(.*)$/is.exec(String(dataUrl || ''))
  if (!m) return ''
  try { return /;base64/i.test(m[1] || '') ? new TextDecoder().decode(Uint8Array.from(atob(m[2].replace(/\s/g, '')), (c) => c.charCodeAt(0))) : decodeURIComponent(m[2]) } catch { return '' }
}

// Pixel size for the PNG copy: the picture's own size (or what an SVG declares), small vector art scaled up so
// text in it is large enough to read (an icon-sized 120px SVG gave Tesseract 8px letters), the longest edge kept
// at most `maxEdge`. Unknown size: 1024 wide, 4:3.
export function rasterSize(w, h, declared = null, { minEdge = 1024, maxEdge = 4096 } = {}) {
  // What an SVG declares wins: a browser may report a default 300x150 for a viewBox-only SVG (stretched copy).
  let W = declared?.w > 0 && declared?.h > 0 ? declared.w : Number(w) > 0 ? Number(w) : 0
  let H = declared?.w > 0 && declared?.h > 0 ? declared.h : Number(h) > 0 ? Number(h) : 0
  if (!(W > 0 && H > 0)) { W = 1024; H = 768 }
  const long = Math.max(W, H)
  const scale = declared && long < minEdge ? minEdge / long : long > maxEdge ? maxEdge / long : 1
  return { w: Math.max(1, Math.round(W * scale)), h: Math.max(1, Math.round(H * scale)) }
}

// A decoded <img> drawn into a PNG data URL of the given size (alpha kept: the OCR copy picks its own backdrop).
// null when the canvas can't be read back (an SVG with foreignObject taints it).
export function rasterizeImage(img, w, h) {
  try {
    const c = document.createElement('canvas')
    c.width = w; c.height = h
    c.getContext('2d').drawImage(img, 0, 0, w, h)
    return c.toDataURL('image/png')
  } catch { return null }
}
