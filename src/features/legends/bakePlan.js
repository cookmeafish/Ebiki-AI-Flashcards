// BAKE PLAN (pure, tested): the decisions behind baking a boss drawing into a sprite rig (bake/web.js).
//
// A boss is thousands of vector shapes, and Chromium re-rasters every one of them on each frame an animation moves.
// A sprite rig keeps the drawing looking exactly the same but makes a frame nearly free: every run of shapes that
// never moves is rasterized ONCE into a bitmap at the screen's real pixel density, and the animation only moves those
// bitmaps (the same SMIL transforms, the same stacking order). What must stay live vector:
//   - an element that animates (it has an <animateTransform>/<animateMotion> child), and every element holding one;
//   - phase and photo layers (class lg-p1/lg-p2/lg-p3/lg-p12, lg-photo-*): the arena's CSS shows and hides them;
//   - every element the PAGE can reach (PAGE_CLASS: the ability effects' CSS shows, moves and animates classed parts
//     like lgfa-chronos-jaw, lg-ab-scream-2, lg-hydra-s3); its static children may still bake inside it;
//   - the WHOLE of an effect layer (SOLID_CLASS, lg-fx-*): its CSS also selects child shapes by tag and attribute;
//   - <image> (the photo ophanim's sprites: an SVG rasterized as an image cannot load them) and defs, gradients,
//     masks and clip paths (live wrappers still point at them).
// Everything else is static and joins the run it sits in. A baked run becomes a SPRITE (bake/web.js bakeRun): an
// invisible path with the run's exact box, its bitmap drawn by the path's marker, so no fill-box pivot ever moves.

export const ANIM_TAGS = ['animateTransform', 'animateMotion']
export const KEEP_TAGS = ['defs', 'title', 'desc', 'style', 'metadata', 'mask', 'clipPath', 'linearGradient', 'radialGradient', 'pattern', 'symbol', 'filter']
export const BOUNDARY_CLASS = /(^|\s)lg-(p\d+|photo[\w-]*)(\s|$)/
export const PAGE_CLASS = /(^|\s)(lg|lgfa|lgo|lgs)-[\w-]/
export const SOLID_CLASS = /(^|\s)lg-fx-[\w-]/
// Presentation properties a child inherits from its ancestors: a run cut out of its parents carries them along.
export const INHERITED = ['fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-linecap',
  'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset', 'color', 'paint-order', 'shape-rendering',
  'vector-effect', 'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'letter-spacing', 'visibility']

// A node for planning: { tag, cls, keep?, children: [node] }. Returns the same tree annotated with `live`.
export function markLive(node, solid = false) {
  const whole = solid || SOLID_CLASS.test(node.cls || '')
  const kids = (node.children || []).map((k) => markLive(k, whole))
  const animated = kids.some((k) => ANIM_TAGS.includes(k.tag))
  const boundary = BOUNDARY_CLASS.test(node.cls || '') || PAGE_CLASS.test(node.cls || '')
  const live = whole || node.tag === 'svg' || animated || boundary || node.tag === 'image' || kids.some((k) => k.live && !ANIM_TAGS.includes(k.tag) && !KEEP_TAGS.includes(k.tag))
  return { ...node, children: kids, live }
}

// The children of a LIVE element, grouped: [{ run: [i, j, ...] } | { live: i } | { keep: i }] in drawing order.
// Consecutive static children form one run; a live child or a kept one (defs, an animation) ends it.
export function planRuns(children) {
  const out = []
  let run = null
  children.forEach((k, i) => {
    if (ANIM_TAGS.includes(k.tag) || KEEP_TAGS.includes(k.tag) || k.hidden) { run = null; out.push({ keep: i }); return }
    if (k.live) { run = null; out.push({ live: i }); return }
    if (!run) { run = { run: [] }; out.push(run) }
    run.run.push(i)
  })
  return out
}

// CSS var() resolution for a run rasterized on its own: `lookup(name)` gives the page's value for a custom
// property ('' when unset), else the var's own fallback is used. Handles nested parentheses in fallbacks.
export function resolveVars(text, lookup) {
  let out = ''
  let i = 0
  while (i < text.length) {
    const at = text.indexOf('var(', i)
    if (at < 0) { out += text.slice(i); break }
    out += text.slice(i, at)
    let depth = 0
    let j = at + 3
    for (; j < text.length; j++) {
      if (text[j] === '(') depth++
      else if (text[j] === ')') { depth--; if (depth === 0) break }
    }
    const inner = text.slice(at + 4, j)
    const comma = topLevelComma(inner)
    const name = (comma < 0 ? inner : inner.slice(0, comma)).trim()
    const fallback = comma < 0 ? '' : inner.slice(comma + 1).trim()
    const v = (lookup(name) || '').trim()
    out += v || resolveVars(fallback, lookup)
    i = j + 1
  }
  return out
}
function topLevelComma(s) {
  let depth = 0
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++
    else if (s[i] === ')') depth--
    else if (s[i] === ',' && depth === 0) return i
  }
  return -1
}

// Pixels per user unit for a run: the drawing's device density, times the LARGEST scale its part reaches on screen,
// times headroom for the page's own effects that grow the whole box (a hit, a lunge), kept within sane bounds; and the
// bitmap size for a box of w x h units at that density. A bitmap clamped below `minShare` of the density it needs
// stays vector. (Pixel art never bakes: bake/web.js keeps crispEdges runs vector.)
export const BAKE = { grow: 1.35, minDensity: 0.5, maxDensity: 24, maxSide: 2048, pad: 1, minShare: 0.75, minShapes: 100 }
// A drawing is worth baking only with enough shapes to cost real raster time (the arcade's pixel art is 76 shapes: it redraws
// for next to nothing, and any bitmap softens its pixel-exact edges).
const SHAPE_TAG = /<(path|circle|ellipse|rect|polygon|polyline|line)\b/g
export function worthBaking(markup) {
  let n = 0
  for (const _ of String(markup).matchAll(SHAPE_TAG)) if (++n >= BAKE.minShapes) return true // eslint-disable-line no-unused-vars
  return false
}
export function runDensity(rootDensity, localScale) {
  return Math.max(BAKE.minDensity, Math.min(BAKE.maxDensity, rootDensity * (localScale || 1) * BAKE.grow))
}
// The moments a drawing's timeline is sampled at to find each part's largest size: the entrance and its settle (to
// 3.2 s) for 'intro', a long stretch of the idle loops (to 9 s) otherwise. Every animation in the files is a few seconds.
export function sampleTimes(_root, intro) {
  const end = intro ? 3.2 : 9
  const step = intro ? 0.04 : 0.08
  const out = []
  for (let t = 0; t <= end + 1e-9; t += step) out.push(Math.round(t * 1000) / 1000)
  return out
}
// How far a stroke reaches past the shape's box: half its width (round or bevel joins, butt or round caps), about
// 0.71 x the width for square caps, and up to half the miter limit times the width at a sharp miter corner.
export function strokePad({ width = 0, join = 'miter', cap = 'butt', miter = 4 } = {}) {
  let r = width / 2
  if (cap === 'square') r = Math.max(r, width * Math.SQRT1_2)
  if (join === 'miter' || join === 'miter-clip' || join === 'arcs') r = Math.max(r, (width * Math.max(1, miter)) / 2)
  return r
}
export function bitmapSize(w, h, density) {
  let d = density
  const longest = Math.max(w, h) * d
  if (longest > BAKE.maxSide) d = (BAKE.maxSide / Math.max(w, h))
  return { width: Math.max(1, Math.ceil(w * d)), height: Math.max(1, Math.ceil(h * d)), density: d }
}
// A density rounded to a step, so drawings a pixel apart share one bake.
export const densityBucket = (d) => Math.max(BAKE.minDensity, Math.round(d * 4) / 4)

// The ids a piece of markup points at (url(#id), href="#id", xlink:href="#id"): a run copies only these definitions
// (and what they point at in turn), never every gradient of the drawing.
export function referencedIds(markup) {
  const ids = new Set()
  for (const m of String(markup).matchAll(/url\(\s*['"]?#([^'")\s]+)['"]?\s*\)|href="#([^"]+)"/g)) ids.add(m[1] || m[2])
  return ids
}
// `defs`: id -> its markup. The markup of every definition `markup` needs, transitively, in a stable order.
export function neededDefs(markup, defs) {
  const out = []
  const seen = new Set()
  const visit = (text) => {
    for (const id of referencedIds(text)) {
      if (seen.has(id) || !defs.has(id)) continue
      seen.add(id)
      visit(defs.get(id))
      out.push(defs.get(id))
    }
  }
  visit(markup)
  return out
}

// BAKES KEPT BETWEEN SESSIONS: a finished bake is stored as ONE record (bake/web.js puts it in the browser's Cache
// Storage) so a returning user never waits for the same bake twice, on any device. Format: 4 bytes (the header's
// length), the header as JSON ({ v, markup, sizes }), then the PNG files back to back. In `markup` each bitmap's
// address is the placeholder BAKE_SLOT(i), swapped for a fresh blob URL on load.
export const BAKE_FORMAT = 7 // bump whenever the baked output changes (older kept bakes are dropped)
export const BAKE_SLOT = (i) => `__ebikiBake${i}__`
export function packBake(markup, pngs) {
  const header = new TextEncoder().encode(JSON.stringify({ v: BAKE_FORMAT, markup, sizes: pngs.map((p) => p.byteLength) }))
  const total = 4 + header.byteLength + pngs.reduce((a, p) => a + p.byteLength, 0)
  const out = new Uint8Array(total)
  new DataView(out.buffer).setUint32(0, header.byteLength)
  out.set(header, 4)
  let at = 4 + header.byteLength
  for (const p of pngs) { out.set(new Uint8Array(p), at); at += p.byteLength }
  return out.buffer
}
// { markup, pngs: [ArrayBuffer] } or null for anything that is not a whole record of this format.
export function unpackBake(buffer) {
  try {
    const bytes = new Uint8Array(buffer)
    const len = new DataView(bytes.buffer, bytes.byteOffset).getUint32(0)
    const head = JSON.parse(new TextDecoder().decode(bytes.subarray(4, 4 + len)))
    if (head.v !== BAKE_FORMAT || typeof head.markup !== 'string' || !Array.isArray(head.sizes)) return null
    let at = 4 + len
    const pngs = head.sizes.map((n) => { const p = bytes.slice(at, at + n).buffer; at += n; return p })
    if (at !== bytes.byteLength) return null
    return { markup: head.markup, pngs }
  } catch { return null }
}
// A short, stable fingerprint of a drawing's markup (FNV-1a, 32 bits, as hex): a changed file never reuses a bake.
export function hashText(text) {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) }
  return (h >>> 0).toString(16).padStart(8, '0')
}
