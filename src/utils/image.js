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
