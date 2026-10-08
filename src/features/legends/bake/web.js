// SPRITE-RIG BAKER (browser only; the plan and its reasons are bakePlan.js). Bakes one boss drawing, as the page
// shows it, into the same SVG with every static run replaced by a bitmap <image> rendered ONCE at the screen's pixel
// density. The animations, stacking, phase layers and photo layers stay exactly as they were, so the drawing looks
// the same and moves the same, but a frame re-rasters a few hundred bitmaps instead of thousands of vector shapes.
//
// Work happens in a hidden copy of the drawing, in small slices between frames (never one long freeze), one drawing
// at a time; each run's PNG is encoded by a small pool of workers in parallel (OffscreenCanvas), or on the page where
// a platform has none. Results are cached by the caller's key (drawing, motion, palette, density) for the page's
// life, AND kept between sessions in the browser's Cache Storage (bakePlan.js packBake), so a returning user never
// waits for the same bake twice. Any failure answers null and the caller keeps the vector drawing.
import { markLive, planRuns, resolveVars, runDensity, bitmapSize, neededDefs, packBake, unpackBake, hashText, sampleTimes, strokePad, worthBaking, BAKE, BAKE_FORMAT, BAKE_SLOT, BOUNDARY_CLASS, PAGE_CLASS, INHERITED } from '../bakePlan'

const NS = 'http://www.w3.org/2000/svg'
const DROPPED = new Error('bake no longer wanted')
const SLICE_MS = 6 // work per slice before giving the page a frame
const cache = new Map() // key -> { promise, urls: [] }
const CACHE_MAX = 48
let queue = Promise.resolve()

const pause = () => new Promise((r) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(() => r(), { timeout: 120 }) : setTimeout(r, 16)))

// The baked markup for `markup` (null on failure or when nobody wants it any more). `box` = the drawing's box in
// the page (its CSS variables and its size on screen). `density` = device pixels per drawing unit on screen (the
// caller measures it; see LegendsArt). `wanted()` says whether the asker still shows this drawing: concurrent asks
// for one key share one bake, and a bake nobody wants any more (a boss stepped past in the asset view, a screen left)
// is dropped before it starts or between its slices, so the queue never works for drawings already gone.
export function bakeArt(key, markup, box, { intro = false, density = 0, wanted = () => true } = {}) {
  if (!worthBaking(markup)) return Promise.resolve(null) // a small drawing redraws cheaply and stays exact vector
  const hit = cache.get(key)
  if (hit) { cache.delete(key); cache.set(key, hit); hit.wants.push(wanted); return hit.promise }
  const entry = { urls: [], wants: [wanted] }
  const stillWanted = () => entry.wants.some((f) => { try { return f() } catch { return false } })
  const stored = `/__ebiki-bake/${hashText(`${BAKE_FORMAT}|${key}|${markup}`)}` // a changed file or key never matches
  entry.promise = (queue = queue.then(async () => {
    if (!stillWanted()) { if (cache.get(key) === entry) cache.delete(key); return null }
    const kept = await readKept(stored, entry.urls)
    if (kept) return kept
    const out = await bakeNow(markup, box, entry.urls, intro, density, stillWanted, `lgbk${hashText(key)}`)
    if (out) keep(stored, out, entry.urls)
    else if (cache.get(key) === entry) cache.delete(key) // dropped midway: a later ask starts afresh
    return out
  }).catch((e) => {
    if (cache.get(key) === entry) cache.delete(key)
    console.warn('[legends] sprite-rig bake failed, the vector drawing stays:', key, e) // eslint-disable-line no-console
    return null
  }))
  cache.set(key, entry)
  while (cache.size > CACHE_MAX) {
    const [oldKey, old] = cache.entries().next().value
    cache.delete(oldKey)
    old.promise.then(() => revokeWhenUnused(old.urls))
  }
  return entry.promise
}
// A bake dropped from the memory cache may still be on screen (a boss that stayed up while many others came and
// went): its bitmaps are released only once no drawing in the page shows them, else the next redraw lost them.
function revokeWhenUnused(urls, tries = 0) {
  if (!urls.length || typeof document === 'undefined') return
  const shown = urls.some((u) => document.querySelector(`image[href="${u.href}"]`))
  if (!shown) { for (const u of urls) URL.revokeObjectURL(u.href); return }
  if (tries < 120) setTimeout(() => revokeWhenUnused(urls, tries + 1), 30000) // looked at again for up to an hour
}

// KEPT BAKES (Cache Storage, where the platform has it; never required). At most KEPT_MAX bakes, oldest out first;
// stores of an older format are deleted.
const KEPT_STORE = `ebiki-art-bake-v${BAKE_FORMAT}`
const KEPT_MAX = 160
const hasCaches = () => typeof caches !== 'undefined' && typeof caches.open === 'function'
let keptCleaned = false
async function readKept(id, urls) {
  if (!hasCaches()) return null
  try {
    if (!keptCleaned) {
      keptCleaned = true
      for (const name of await caches.keys()) if (name.startsWith('ebiki-art-bake-') && name !== KEPT_STORE) caches.delete(name)
    }
    const res = await (await caches.open(KEPT_STORE)).match(id)
    if (!res) return null
    const rec = unpackBake(await res.arrayBuffer())
    if (!rec) return null
    let markup = rec.markup
    rec.pngs.forEach((buf, i) => {
      const href = URL.createObjectURL(new Blob([buf], { type: 'image/png' }))
      urls.push({ href })
      markup = markup.split(BAKE_SLOT(i)).join(href)
    })
    return markup
  } catch { return null }
}
async function keep(id, markup, urls) {
  if (!hasCaches()) return
  try {
    const pngs = []
    let slotted = markup
    for (const u of urls) {
      if (!u.png) return // a bitmap this session did not make: nothing to keep
      slotted = slotted.split(u.href).join(BAKE_SLOT(pngs.length))
      pngs.push(await u.png.arrayBuffer())
    }
    const store = await caches.open(KEPT_STORE)
    await store.put(id, new Response(packBake(slotted, pngs), { headers: { 'Content-Type': 'application/octet-stream' } }))
    const keys = await store.keys()
    for (const k of keys.slice(0, Math.max(0, keys.length - KEPT_MAX))) await store.delete(k)
  } catch { /* storage full or refused: the bake still serves this session */ }
}

// PNG ENCODERS: a few workers turn bitmaps into PNG files in parallel, off the page's thread. Made once, on first
// use, from inline code (no extra file to serve); none where a platform lacks workers or OffscreenCanvas.
const WORKER_CODE = `self.onmessage = async (e) => {
  const { id, bitmap } = e.data
  try {
    const c = new OffscreenCanvas(bitmap.width, bitmap.height)
    c.getContext('2d').drawImage(bitmap, 0, 0)
    bitmap.close()
    self.postMessage({ id, blob: await c.convertToBlob({ type: 'image/png' }) })
  } catch (err) { self.postMessage({ id, error: String(err) }) }
}`
let pool
let poolNext = 0
let jobSeq = 0
const jobs = new Map()
function encoders() {
  if (pool !== undefined) return pool
  pool = null
  try {
    if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined') return pool
    const url = URL.createObjectURL(new Blob([WORKER_CODE], { type: 'text/javascript' }))
    const n = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1))
    pool = Array.from({ length: n }, () => {
      const w = new Worker(url)
      w.onmessage = (e) => {
        const job = jobs.get(e.data.id)
        if (!job) return
        jobs.delete(e.data.id)
        if (e.data.blob) job.ok(e.data.blob); else job.fail(new Error(e.data.error))
      }
      return w
    })
  } catch { pool = null }
  return pool
}
async function encodePng(source, width, height) {
  const workers = encoders()
  if (workers) {
    try {
      const bitmap = await createImageBitmap(source, { resizeWidth: width, resizeHeight: height, resizeQuality: 'high' })
      const id = ++jobSeq
      return await new Promise((ok, fail) => {
        jobs.set(id, { ok, fail })
        workers[poolNext++ % workers.length].postMessage({ id, bitmap }, [bitmap])
      })
    } catch { /* fall back to the page */ }
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(source, 0, 0, width, height)
  const png = await new Promise((r) => canvas.toBlob(r, 'image/png'))
  if (!png) throw new Error('no bitmap')
  return png
}

// Diagnostics (perf scripts read window.__ebikiBakeStats): how long each bake took, its runs, and the encoder used.
const stats = []
if (typeof window !== 'undefined') window.__ebikiBakeStats = stats

async function bakeNow(markup, box, urls, intro, density, stillWanted = () => true, tag = 'lgbk') {
  if (!box || !box.isConnected || typeof document === 'undefined') return null
  const t0 = performance.now()
  let tWalk = 0
  const rect = box.getBoundingClientRect()
  if (!rect.width) return null
  const styles = getComputedStyle(box)
  const lookup = (name) => styles.getPropertyValue(name)
  const host = document.createElement('div')
  // The copy keeps the drawing's box size and colors, out of sight and out of layout.
  host.style.cssText = `position:fixed;left:-30000px;top:0;width:${box.clientWidth || 120}px;height:${box.clientHeight || 120}px;contain:strict;pointer-events:none`
  for (let i = 0; i < box.style.length; i++) {
    const p = box.style[i]
    if (p.startsWith('--')) host.style.setProperty(p, box.style.getPropertyValue(p))
  }
  host.innerHTML = markup
  document.body.appendChild(host)
  const pending = [] // runs whose PNG is still encoding
  try {
    const root = host.querySelector('svg')
    if (!root) return null
    try { root.pauseAnimations(); root.setCurrentTime(intro ? 3 : 0) } catch { /* no SMIL */ }
    // Device pixels per drawing unit: how the drawing really maps into its box (a banner is wider than its box and
    // fills it by cropping: slice), times device pixels per CSS pixel (the app zoom and the screen's density, from
    // the caller's measured `density` = device pixels across the box / 120).
    const perCss = density && box.offsetWidth ? (density * 120) / box.offsetWidth : (rect.width / (box.offsetWidth || rect.width)) * (window.devicePixelRatio || 1)
    const rootDensity = drawingScale(root, host) * perCss
    // Layers the page shows later start hidden in the file: phase layers (the arena's CSS), ability state and effect
    // layers (lg-ab-*, lg-fx-*: a Hydra's extra heads). Shown while measuring, so they bake too, then hidden again.
    const unhidden = []
    for (const el of root.querySelectorAll('*')) {
      if (el.style?.display === 'none' && pageShows(el.getAttribute('class') || '') && !/lg-photo-hide/.test(el.getAttribute('class'))) {
        el.style.display = ''
        unhidden.push(el)
      }
    }
    const marked = markLive(toTree(root))
    // The drawing's own timeline, sampled before anything changes: how big each live part ever gets on screen (an
    // entrance that grows a part from nothing, a pulse), so every run is drawn at its LARGEST size and a bat that
    // flies in tiny and lands full size is never a blown-up blur.
    const tScale = performance.now()
    const scales = await sampleTimeline(root, marked, intro, stillWanted)
    const scaleMs = Math.round(performance.now() - tScale)
    const defs = defsById(root, lookup)
    // The sprites' markers (see bakeRun), in one definitions block of their own.
    const sprites = document.createElementNS(NS, 'defs')
    root.appendChild(sprites)
    let spriteN = 0
    const nextId = () => `${tag}-${spriteN++}`
    let last = performance.now()
    const walk = async (node) => {
      for (const step of planRuns(node.children)) {
        if (step.live !== undefined) { await walk(node.children[step.live]); continue }
        if (!step.run) continue
        const job = await bakeRun(node.el, step.run.map((i) => node.children[i].el), { root, rootDensity, defs, lookup, urls, scale: scales.get(node.el), sprites, nextId })
        if (job) pending.push(job.done)
        if (performance.now() - last > SLICE_MS) {
          await pause()
          last = performance.now()
          if (!stillWanted()) throw DROPPED
        }
      }
    }
    try {
      if (!scales) throw DROPPED
      await walk(marked)
    } catch (e) {
      if (e !== DROPPED) throw e
      await Promise.allSettled(pending)
      for (const u of urls.splice(0)) URL.revokeObjectURL(u.href)
      return null
    }
    tWalk = performance.now() - t0
    await Promise.all(pending)
    stats.push({ ms: Math.round(performance.now() - t0), walkMs: Math.round(tWalk), scaleMs, runs: pending.length, workers: pool ? pool.length : 0 })
    if (stats.length > 50) stats.shift()
    for (const el of unhidden) el.style.display = 'none'
    // The photo ophanim's painted fallback never shows while its photos are in (they are, or it would not be marked):
    // thousands of hidden shapes the page would still hold and style.
    for (const el of root.querySelectorAll('.lg-photo-hide')) el.remove()
    return root.outerHTML
  } finally {
    host.remove()
  }
}

// A layer the page's CSS can show (phase, ability state, effect): baked like a visible one.
const pageShows = (cls) => BOUNDARY_CLASS.test(cls) || PAGE_CLASS.test(cls)

// CSS pixels per drawing unit for the root <svg> laid out in `host`, from its viewBox and preserveAspectRatio.
function drawingScale(root, host) {
  const vb = root.viewBox?.baseVal
  const W = root.clientWidth || host.clientWidth || 120
  const H = root.clientHeight || host.clientHeight || W
  if (!vb || !vb.width || !vb.height) return W / 120
  const sx = W / vb.width
  const sy = H / vb.height
  const par = root.preserveAspectRatio?.baseVal
  if (!par || par.align === 1 /* none */) return Math.max(sx, sy)
  return par.meetOrSlice === 2 /* slice */ ? Math.max(sx, sy) : Math.min(sx, sy)
}

function toTree(el) {
  const cls = el.getAttribute('class') || ''
  const hidden = /lg-photo-hide/.test(cls) || (el.style?.display === 'none' && !pageShows(cls))
  return { el, tag: el.localName, cls, hidden, children: [...el.children].map(toTree) }
}

// Every definition a run could point at, by id, colors resolved.
function defsById(root, lookup) {
  const ser = new XMLSerializer()
  const map = new Map()
  for (const e of root.querySelectorAll('linearGradient,radialGradient,mask,clipPath,pattern')) {
    if (e.id) map.set(e.id, resolveVars(ser.serializeToString(e), lookup))
  }
  return map
}

// The largest on-screen scale (drawing units per local unit) each live element reaches while the drawing plays: its
// own timeline sampled (sampleTimes), each live element's CTM read at every sample, in slices between frames. null
// when the bake is no longer wanted. Restores the bake moment after.
async function sampleTimeline(root, marked, intro, stillWanted) {
  const els = []
  const collect = (n) => {
    if (!n.live || typeof n.el.getScreenCTM !== 'function') return
    els.push(n.el)
    for (const k of n.children) collect(k)
  }
  collect(marked)
  const scales = new Map()
  const at = intro ? 3 : 0
  let last = performance.now()
  try {
    for (const t of sampleTimes(root, intro)) {
      root.setCurrentTime(t)
      const r = root.getScreenCTM()
      const base = r ? Math.sqrt(Math.abs(r.a * r.d - r.b * r.c)) : 0
      for (const el of els) {
        const m = el.getScreenCTM()
        if (!m || !base) continue
        const s = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) / base // drawing units, not screen pixels
        if (!(s <= (scales.get(el) || 0))) scales.set(el, s)
      }
      if (performance.now() - last > SLICE_MS) {
        await pause()
        last = performance.now()
        if (!stillWanted()) return null
        root.setCurrentTime(t) // (nothing else touches the copy, but a frame may have run)
      }
    }
  } catch { /* no SMIL: the base transforms decide (baseScale) */ }
  try { root.setCurrentTime(at) } catch { /* no SMIL */ }
  return scales
}

// The scale from `el`'s user space to the root's, from the files' own (base) transforms: the fallback where the
// timeline cannot be sampled.
function baseScale(el, root) {
  let m = new DOMMatrix()
  for (let p = el; p && p !== root; p = p.parentNode) {
    const list = p.transform?.baseVal
    if (!list) continue
    let own = new DOMMatrix()
    for (let i = 0; i < list.numberOfItems; i++) own = own.multiply(DOMMatrix.fromMatrix(list.getItem(i).matrix))
    m = own.multiply(m)
  }
  return Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1
}

function inheritedAttrs(container, root) {
  const got = {}
  for (let p = container; p && p.nodeType === 1; p = p.parentNode) {
    for (const prop of INHERITED) {
      if (got[prop] !== undefined) continue
      const v = p.style?.getPropertyValue(prop) || p.getAttribute?.(prop)
      if (v) got[prop] = v
    }
    if (p === root) break
  }
  return Object.entries(got).map(([k, v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`).join(' ')
}

// How far any stroke in the run reaches past its shape's box, in the container's units (strokePad, bakePlan.js): half
// the width for round joins and caps (nearly every stroke in the drawings), more for square caps and sharp corners;
// scaled by any transform between the shape and the container.
function strokeReach(els, container) {
  let reach = 0
  const cm = container.getCTM && container.getCTM()
  const cs0 = cm ? Math.sqrt(Math.abs(cm.a * cm.d - cm.b * cm.c)) : 1
  for (const top of els) {
    for (const e of [top, ...top.querySelectorAll('*')]) {
      const cs = getComputedStyle(e)
      if (!cs.stroke || cs.stroke === 'none') continue
      const width = parseFloat(cs.strokeWidth) || 0
      if (!width) continue
      const m = e.getCTM && e.getCTM()
      const k = m && cs0 ? Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) / cs0 : 1
      reach = Math.max(reach, strokePad({ width, join: cs.strokeLinejoin, cap: cs.strokeLinecap, miter: parseFloat(cs.strokeMiterlimit) || 4 }) * k)
    }
  }
  return reach
}

// One run: measured and rasterized now, its PNG encoded in the background. Returns { done: the encode } (it puts the
// sprite in when done, or leaves the run as vector), or null when the run draws nothing.
//
// THE SPRITE: one invisible path tracing the run's exact geometry box (no fill, no stroke), its bitmap drawn through
// the path's start marker. A marker never counts in a box (fill-box, getBBox), so every part keeps EXACTLY the box
// it had as vector shapes while its bitmap reaches past it as far as the strokes do: a pivot on a fill box (the
// files' own, and the ability effects' CSS: Hydra's heads, Cerberus, Inferno) stays exactly where it was, even when
// moving parts inside decide that box. (A plain <image> carried its stroke padding into the box and slid pivots.)
async function bakeRun(container, els, { root, rootDensity, defs, lookup, urls, scale, sprites, nextId }) {
  if (!els.length) return null
  const g = document.createElementNS(NS, 'g')
  container.insertBefore(g, els[0])
  for (const e of els) g.appendChild(e)
  let bb
  try { bb = g.getBBox() } catch { bb = null }
  if (!bb || !(bb.width > 0 || bb.height > 0)) { g.replaceWith(...els); return null }
  // getBBox leaves strokes out: the bitmap reaches as far as the strokes do, plus half a unit for antialiasing.
  const pad = strokeReach(els, container) + 0.5
  const x = bb.x - pad, y = bb.y - pad, w = bb.width + pad * 2, h = bb.height + pad * 2
  // Pixel art (shape-rendering: crispEdges) stays vector: crispEdges snaps every edge to the screen's pixels, which a
  // bitmap's own grid never matches (edges moved by a pixel), and plain rectangles are cheap to draw anyway.
  if (els.some((e) => getComputedStyle(e).shapeRendering === 'crispEdges')) { g.replaceWith(...els); return null }
  const want = runDensity(rootDensity, scale || baseScale(container, root))
  const size = bitmapSize(w, h, want)
  // A part that grows too big for one bitmap (a burst filling the screen) stays vector: simple shapes, and a giant
  // bitmap would cost more memory than its redraws.
  if (size.density < want * BAKE.minShare) { g.replaceWith(...els); return null }
  const ser = new XMLSerializer()
  const body = resolveVars(els.map((e) => ser.serializeToString(e)).join(''), lookup)
  const used = neededDefs(body, defs)
  const doc = `<svg xmlns="${NS}" width="${size.width}" height="${size.height}" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="none">${used.length ? `<defs>${used.join('')}</defs>` : ''}<g ${resolveVars(inheritedAttrs(container, root), lookup)}>${body}</g></svg>`
  const src = URL.createObjectURL(new Blob([doc], { type: 'image/svg+xml' }))
  try {
    const img = new Image()
    img.src = src
    await img.decode()
    // wrapped, so awaiting this async function does not also wait for the encode (that ran the pool one at a time)
    return { done: encodePng(img, size.width, size.height).then((png) => {
      const href = URL.createObjectURL(png)
      urls.push({ href, png })
      const id = nextId()
      const marker = document.createElementNS(NS, 'marker')
      for (const [k, v] of [['id', id], ['markerUnits', 'userSpaceOnUse'], ['markerWidth', 1], ['markerHeight', 1], ['refX', 0], ['refY', 0], ['orient', 0], ['overflow', 'visible']]) marker.setAttribute(k, v)
      const image = document.createElementNS(NS, 'image')
      image.setAttribute('x', x - bb.x)
      image.setAttribute('y', y - bb.y)
      image.setAttribute('width', w)
      image.setAttribute('height', h)
      image.setAttribute('preserveAspectRatio', 'none')
      image.setAttribute('href', href)
      marker.appendChild(image)
      sprites.appendChild(marker)
      const sprite = document.createElementNS(NS, 'path')
      const x1 = bb.x + bb.width, y1 = bb.y + bb.height
      sprite.setAttribute('d', `M${bb.x} ${bb.y}H${x1}V${y1}H${bb.x}Z`)
      sprite.setAttribute('fill', 'none')
      sprite.setAttribute('stroke', 'none')
      sprite.setAttribute('marker-start', `url(#${id})`)
      g.replaceWith(sprite)
    }, () => { g.replaceWith(...els) }).finally(() => URL.revokeObjectURL(src)) }
  } catch {
    URL.revokeObjectURL(src)
    g.replaceWith(...els)
    return null
  }
}
