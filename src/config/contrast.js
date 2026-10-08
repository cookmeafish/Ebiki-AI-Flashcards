// WCAG contrast for the app palettes (src/config/palette.js). Pure: parses the --c-* blocks, composites translucent
// colors over their real background, and lists every text/background pair the UI actually uses, so a test can fail
// when a token change drops a pair below AA. Target AA: 4.5:1 for text, 3:1 for large text and UI parts.

export const AA_TEXT = 4.5

// The --c-* values of one theme block (':root' or '[data-theme="dark"]').
export function paletteVars(css, selector) {
  const i = css.indexOf(selector + ' {')
  if (i < 0) return {}
  const body = css.slice(i, css.indexOf('}', i))
  const out = {}
  for (const m of body.matchAll(/--c-([a-z0-9-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim()
  return out
}

export function parseColor(s) {
  const v = String(s || '').trim()
  let m = v.match(/^#([0-9a-f]{6})$/i)
  if (m) { const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255, 1] }
  m = v.match(/^rgba?\(([^)]+)\)$/i)
  if (m) { const p = m[1].split(',').map((x) => Number(x.trim())); return [p[0], p[1], p[2], Number.isFinite(p[3]) ? p[3] : 1] }
  throw new Error(`not a color: ${s}`)
}

// fg (possibly translucent) painted over an opaque bg.
export const over = (fg, bg) => [0, 1, 2].map((k) => fg[k] * fg[3] + bg[k] * (1 - fg[3])).concat(1)
// color-mix(in srgb, c pct%, transparent) over base, i.e. a chip tint.
export const tintOver = (c, pct, base) => over([c[0], c[1], c[2], pct], base)

export function luminance(c) {
  const f = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2])
}

export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

// Text tokens used for small text (labels, hints, chips, ghost buttons) and the backgrounds they sit on.
export const TEXT_TOKENS = ['ink', 'ink-dim', 'ink-faint', 'success', 'warning', 'danger', 'info', 'purple', 'teal']
export const SURFACES = ['bg', 'surface', 'surface-alt', 'surface-sunken', 'surface-raised']
// The brand red is the app's identity (#DF2540 light): held to AA on cards, and to 4.2 on the page background.
export const BRAND_MIN_ON_BG = 4.2
// Solid fills that carry --c-on-brand text (CTAs, badges): each must give white text AA in both themes.
export const FILL_TOKENS = ['brand-fill', 'success-fill', 'danger-fill', 'warning-fill', 'purple-fill', 'info-fill']

// Every audited pair of one theme: { name, ratio, min }.
export function contrastPairs(vars) {
  const col = (k) => parseColor(vars[k])
  const surf = col('surface')
  const bgs = Object.fromEntries(SURFACES.map((k) => [k, col(k)]))
  bgs.hover = over(col('hover'), surf)
  const pairs = []
  for (const t of TEXT_TOKENS) {
    const c = col(t)
    for (const [b, bg] of Object.entries(bgs)) pairs.push({ name: `${t} on ${b}`, ratio: contrast(c, bg), min: AA_TEXT })
    if (t !== 'ink' && t !== 'ink-dim' && t !== 'ink-faint') pairs.push({ name: `${t} on its 12% tint`, ratio: contrast(c, tintOver(c, 0.12, surf)), min: AA_TEXT })
  }
  const brand = col('brand')
  pairs.push({ name: 'brand on surface', ratio: contrast(brand, surf), min: AA_TEXT })
  pairs.push({ name: 'brand on bg', ratio: contrast(brand, bgs.bg), min: BRAND_MIN_ON_BG })
  // A selected tab or tile: brand-text on the brand tint and on a 12% brand mix.
  const bt = col('brand-text')
  pairs.push({ name: 'brand-text on brand-tint', ratio: contrast(bt, over(col('brand-tint'), surf)), min: AA_TEXT })
  pairs.push({ name: 'brand-text on 12% brand', ratio: contrast(bt, tintOver(brand, 0.12, surf)), min: AA_TEXT })
  for (const f of FILL_TOKENS) pairs.push({ name: `on-brand on ${f}`, ratio: contrast(col('on-brand'), col(f)), min: AA_TEXT })
  pairs.push({ name: 'on-ink on ink-solid', ratio: contrast(col('on-ink'), col('ink-solid')), min: AA_TEXT })
  return pairs
}
