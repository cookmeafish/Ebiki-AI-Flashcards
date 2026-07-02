// ─── Image helpers for vision/multimodal AI calls ───────────────────────────
// Convert a data URL into the neutral shape our providers consume, and downscale
// large screenshots before upload (faster, cheaper, within vision model limits).

// Split a `data:<mime>;base64,<data>` URL into { mediaType, base64 }.
// Falls back to image/png if the prefix is malformed.
export function dataUrlToImagePart(dataUrl) {
  const m = /^data:([^;,]+)?(?:;[^,]*)?,(.*)$/s.exec(dataUrl || '')
  if (!m) return { mediaType: 'image/png', base64: '' }
  const mediaType = m[1] || 'image/png'
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
export function downscaleDataUrl(dataUrl, maxEdge = 1500, mimeType = 'image/jpeg', quality = 0.9) {
  return new Promise((resolve) => {
    try {
      const img = new Image()
      img.onload = () => {
        const longEdge = Math.max(img.naturalWidth, img.naturalHeight)
        if (!longEdge || longEdge <= maxEdge) { resolve(dataUrl); return }
        const scale = maxEdge / longEdge
        const c = document.createElement('canvas')
        c.width = Math.round(img.naturalWidth * scale)
        c.height = Math.round(img.naturalHeight * scale)
        const ctx = c.getContext('2d')
        ctx.drawImage(img, 0, 0, c.width, c.height)
        try { resolve(c.toDataURL(mimeType, quality)) }
        catch { resolve(dataUrl) }
      }
      img.onerror = () => resolve(dataUrl)
      img.src = dataUrl
    } catch { resolve(dataUrl) }
  })
}
