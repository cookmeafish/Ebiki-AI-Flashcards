// STILL SNAPSHOTS (browser only). A small STILL drawing (an asset view tile, a map icon, a boss portrait) is a picture
// that never moves, yet as inline SVG a raid boss is about 3000 vector shapes from a file of up to 1 MB: every tile
// fetched and sanitized its whole file and the page re-rastered all of them (26 raid tiles = about 80,000 shapes) on
// load and scroll. So each one is drawn ONCE into a bitmap at its real size on this screen (box x app zoom x pixel
// density) and shown as an <img>. Snapshots are kept between sessions in Cache Storage, keyed by the file's version
// (its ETag / Last-Modified), the colors it resolved (palette, theme) and the pixel size: a returning visit shows every
// tile at once without touching the SVG files. Any failure answers null and the caller keeps the vector drawing.
import { resolveVars, hashText } from '../bakePlan'
import { encodePng } from '../bake/web'

const STORE = 'ebiki-art-snap-v1'
const KEPT_MAX = 600
const BUILD_AT_ONCE = 3
const mem = new Map() // key -> Promise<href | null>
const sigs = new Map() // url -> Promise<string>
const hasCaches = () => typeof caches !== 'undefined' && typeof caches.open === 'function'
const idOf = (key) => `/__ebiki-art-snap/${hashText(key)}${key.length.toString(36)}`

// The file's version, without downloading it (a HEAD answers from its headers), asked once per page load. '' = unknown.
export function fileSig(url) {
  if (!sigs.has(url)) {
    sigs.set(url, fetch(url, { method: 'HEAD', cache: 'no-cache' })
      .then((r) => (r.ok ? (r.headers.get('etag') || r.headers.get('last-modified') || '') + '|' + (r.headers.get('content-length') || '') : ''))
      .catch(() => ''))
  }
  return sigs.get(url)
}

// The colors a drawing resolves from its box (palette tint, theme ink), as one string for the key and a lookup.
export function boxColors(box, markup) {
  const cs = getComputedStyle(box)
  const names = new Set()
  if (markup) for (const m of markup.matchAll(/var\(\s*(--[\w-]+)/g)) names.add(m[1])
  else for (const n of ['--lg-ink', '--lg-tint', '--lg-tint-hi', '--lg-tint-lo']) names.add(n)
  const vals = {}
  for (const n of [...names].sort()) vals[n] = cs.getPropertyValue(n).trim()
  return vals
}
const colorKey = (box) => Object.entries(boxColors(box)).map(([k, v]) => `${k}:${v}`).join(';')

// A snapshot's identity without the file version (`base`) and with it (`key`). The INDEX remembers, per base, the key
// of the newest snapshot kept (localStorage), so a visit shows it at once and checks the file's version AFTER, in the
// background: a tab switch never waits on 26 requests to a busy server. A page-life map answers before the first paint.
export const snapBase = (url, box, pxW, pxH) => `${url}|${pxW}x${pxH}|${colorKey(box)}`
export const snapKeyOf = (base, sig) => `${base}|${sig}`
const INDEX_KEY = 'ebiki-art-snap-index'
const INDEX_MAX = 600
let index = null
const readIndex = () => {
  if (!index) {
    try { index = new Map(Object.entries(JSON.parse(localStorage.getItem(INDEX_KEY) || '{}'))) } catch { index = new Map() }
  }
  return index
}
let indexTimer = 0
function remember(base, key) {
  const ix = readIndex()
  ix.delete(base)
  ix.set(base, key)
  while (ix.size > INDEX_MAX) ix.delete(ix.keys().next().value)
  clearTimeout(indexTimer)
  indexTimer = setTimeout(() => { try { localStorage.setItem(INDEX_KEY, JSON.stringify(Object.fromEntries(ix))) } catch { /* full: memory only */ } }, 500)
}
export const indexedKey = (base) => readIndex().get(base) || ''
const shownByBase = new Map() // base -> object URL shown this page life
export const peekSnap = (base) => shownByBase.get(base) || ''
// The kept snapshot for `base` (whatever version the index names), or ''.
export async function findSnap(base) {
  if (shownByBase.has(base)) return shownByBase.get(base)
  const key = indexedKey(base)
  const href = key ? await readSnap(key) : null
  if (href) shownByBase.set(base, href)
  return href || ''
}
// After a fresh snapshot (or a kept one of the current version) is shown for `base`.
export function adoptSnap(base, key, href) {
  shownByBase.set(base, href)
  remember(base, key)
}

// A kept snapshot for `key` (an object URL), or null.
export async function readSnap(key) {
  if (mem.has(key)) return mem.get(key)
  if (!hasCaches()) return null
  try {
    const res = await (await caches.open(STORE)).match(idOf(key))
    if (!res) return null
    const href = URL.createObjectURL(await res.blob())
    mem.set(key, Promise.resolve(href))
    return href
  } catch { return null }
}

let building = 0
const waiting = []
const slot = () => (building < BUILD_AT_ONCE ? (building++, Promise.resolve()) : new Promise((r) => waiting.push(r)))
const release = () => { const next = waiting.shift(); if (next) next(); else building-- }

// Draws `markup` (the still drawing exactly as the page would inline it) into a pxW x pxH bitmap. `grow` = how far a
// figure may draw past its frame on each side, as a share of the frame (the bitmap then covers frame + headroom).
export function makeSnap(key, markup, box, pxW, pxH, grow = 0) {
  if (mem.has(key)) return mem.get(key)
  const vals = boxColors(box, markup)
  const p = (async () => {
    await slot()
    try {
      const W = Math.round(pxW * (1 + 2 * grow)), H = Math.round(pxH * (1 + 2 * grow))
      const doc = new DOMParser().parseFromString(resolveVars(markup, (n) => vals[n] || ''), 'text/html')
      const svg = doc.body.querySelector('svg')
      if (!svg) return null
      svg.setAttribute('width', W)
      svg.setAttribute('height', H)
      const vb = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number)
      if (grow && vb.length === 4 && vb.every(Number.isFinite)) {
        const [x, y, w, h] = vb
        svg.setAttribute('viewBox', `${x - w * grow} ${y - h * grow} ${w * (1 + 2 * grow)} ${h * (1 + 2 * grow)}`)
      }
      const xml = new XMLSerializer().serializeToString(svg)
      const src = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml' }))
      try {
        const img = new Image()
        img.src = src
        await img.decode()
        const png = await encodePng(img, W, H)
        const href = URL.createObjectURL(png)
        if (hasCaches()) {
          caches.open(STORE).then(async (store) => {
            await store.put(idOf(key), new Response(png, { headers: { 'Content-Type': 'image/png' } }))
            const keys = await store.keys()
            for (const k of keys.slice(0, Math.max(0, keys.length - KEPT_MAX))) await store.delete(k)
          }).catch(() => {})
        }
        return href
      } finally { URL.revokeObjectURL(src) }
    } catch { return null } finally { release() }
  })()
  mem.set(key, p)
  p.then((href) => { if (!href) mem.delete(key) })
  return p
}
