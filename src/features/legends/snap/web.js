// STILL SNAPSHOTS (browser only). A small STILL drawing (an asset view tile, a map icon, a boss portrait) is a picture
// that never moves, yet as inline SVG a raid boss is about 3000 vector shapes from a file of up to 1 MB: every tile
// fetched and sanitized its whole file and the page re-rastered all of them (26 raid tiles = about 80,000 shapes) on
// load and scroll. So each one is drawn ONCE into a bitmap at its real size on this screen (box x app zoom x pixel
// density) and shown as an <img>. Snapshots are kept between sessions in Cache Storage, keyed by the file's version
// (its ETag / Last-Modified), the colors it resolved (palette, theme) and the pixel size: a returning visit shows every
// tile at once without touching the SVG files. Any failure answers null and the caller keeps the vector drawing.
import { hashText } from '../bakePlan'
import { stillImageSvg } from './plan'
import { encodePng } from '../bake/web'

const STORE = 'ebiki-art-snap-v2'
const KEPT_MAX = 600
const BUILD_AT_ONCE = 4
const mem = new Map() // key -> Promise<href | null>
const sigs = new Map() // url -> Promise<string>
const hasCaches = () => typeof caches !== 'undefined' && typeof caches.open === 'function'
const idOf = (key) => `/__ebiki-art-snap/${hashText(key)}${key.length.toString(36)}`

// An art file's text, fetched ONCE for every user at the same time (each snapshot size and the vector drawing asked for
// it separately, and the dev server forbids the browser from reusing a file: the forest boss came three times at
// startup). Kept a minute after the last ask, so a 1 MB raid file does not stay in memory for the page's life.
const texts = new Map() // url -> { p, timer }
export function artText(url) {
  let e = texts.get(url)
  if (!e) {
    e = { p: fetch(url).then((r) => (r.ok ? r.text() : '')).catch(() => ''), timer: 0 }
    texts.set(url, e)
    e.p.then((t) => { if (!t) texts.delete(url) }) // a failed fetch is tried again next time
  }
  clearTimeout(e.timer)
  e.timer = setTimeout(() => { if (texts.get(url) === e) texts.delete(url) }, 60000)
  return e.p
}

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
const INDEX_KEY = 'ebiki-art-snap-index-v2'
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
let cleaned = false
export async function readSnap(key) {
  if (mem.has(key)) return mem.get(key)
  if (!hasCaches()) return null
  try {
    if (!cleaned) { // stores and index of an older snapshot format
      cleaned = true
      for (const name of await caches.keys()) if (name.startsWith('ebiki-art-snap-') && name !== STORE) caches.delete(name)
      try { localStorage.removeItem('ebiki-art-snap-index') } catch { /* blocked storage */ }
    }
    const res = await (await caches.open(STORE)).match(idOf(key))
    if (!res) return null
    const href = URL.createObjectURL(await res.blob())
    mem.set(key, Promise.resolve(href))
    return href
  } catch { return null }
}

// The snapshot's object URL, kept in Cache Storage for the next visits.
function keepSnap(key, png) {
  if (hasCaches()) {
    caches.open(STORE).then(async (store) => {
      await store.put(idOf(key), new Response(png, { headers: { 'Content-Type': 'image/png' } }))
      const keys = await store.keys()
      for (const k of keys.slice(0, Math.max(0, keys.length - KEPT_MAX))) await store.delete(k)
    }).catch(() => {})
  }
  return URL.createObjectURL(png)
}

let building = 0
const waiting = []
const slot = () => (building < BUILD_AT_ONCE ? (building++, Promise.resolve()) : new Promise((r) => waiting.push(r)))
const release = () => { const next = waiting.shift(); if (next) next(); else building-- }

// Draws the art FILE at `url` as a still pxW x pxH bitmap (`grow` = how far a figure may draw past its frame on each
// side, as a share of the frame: the bitmap then covers frame + headroom). Straight from the file by string edits
// (stillImageSvg), never through the page: no sanitize, no parse, nothing inserted into the document. Painted on a
// canvas and encoded by the worker pool (encodePng): canvas.toBlob waits for an IDLE moment, about 1.2 s per tile on
// a page with bosses animating. null on any failure (the caller then shows the vector drawing).
export function makeSnap(key, url, box, pxW, pxH, grow = 0) {
  if (mem.has(key)) return mem.get(key)
  const cs = getComputedStyle(box)
  const lookup = (n) => cs.getPropertyValue(n).trim()
  const p = (async () => {
    const W = Math.round(pxW * (1 + 2 * grow)), H = Math.round(pxH * (1 + 2 * grow))
    const text = await artText(url)
    await slot()
    try {
      const xml = stillImageSvg(text, { width: W, height: H, grow, lookup })
      if (!xml) return null
      const src = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml' }))
      try {
        const img = new Image()
        img.src = src
        await img.decode()
        const canvas = document.createElement('canvas')
        canvas.width = W
        canvas.height = H
        canvas.getContext('2d').drawImage(img, 0, 0, W, H)
        return keepSnap(key, await encodePng(canvas, W, H))
      } finally { URL.revokeObjectURL(src) }
    } catch { return null } finally { release() }
  })().catch(() => null)
  mem.set(key, p)
  p.then((href) => { if (!href) mem.delete(key) })
  return p
}

// WARMING. Every small still drawing shown is remembered (file, palette, CSS size, figure or banner), newest first, so a
// while after startup, at idle moments, its snapshot is checked against the file and the current zoom and screen
// density: one an update changed, or a new zoom needs, is drawn THEN, never while the learner waits on a screen.
const USED_KEY = 'ebiki-art-snap-used'
const USED_MAX = 160
export function noteSnapUse(use) {
  try {
    const id = `${use.url}|${use.palette || ''}|${use.w}x${use.h}`
    const list = JSON.parse(localStorage.getItem(USED_KEY) || '[]').filter((u) => `${u.url}|${u.palette || ''}|${u.w}x${u.h}` !== id)
    list.unshift(use)
    localStorage.setItem(USED_KEY, JSON.stringify(list.slice(0, USED_MAX)))
  } catch { /* storage blocked: no warming */ }
}
const idle = () => new Promise((r) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(() => r(), { timeout: 3000 }) : setTimeout(r, 50)))
let warming = false
// `vars(palette)` = the CSS variables a drawing's box gets for that palette (art.jsx artVars); `grow` = the headroom.
export async function warmSnaps(vars, grow) {
  if (warming || typeof document === 'undefined') return
  warming = true
  let uses = []
  try { uses = JSON.parse(localStorage.getItem(USED_KEY) || '[]') } catch { /* nothing remembered */ }
  const zoom = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-zoom')) || 1
  const dpr = window.devicePixelRatio || 1
  for (const u of uses) {
    await idle()
    if (document.hidden) { await new Promise((r) => setTimeout(r, 5000)); continue }
    const probe = document.createElement('div')
    probe.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden'
    for (const [k, v] of Object.entries(vars(u.palette))) probe.style.setProperty(k, v)
    document.body.appendChild(probe)
    try {
      const pxW = Math.round(u.w * zoom * dpr), pxH = Math.round(u.h * zoom * dpr)
      const base = snapBase(u.url, probe, pxW, pxH)
      const sig = await fileSig(u.url)
      if (!sig) continue
      const key = snapKeyOf(base, sig)
      if (indexedKey(base) === key) continue
      const kept = await readSnap(key)
      const href = kept || await makeSnap(key, u.url, probe, pxW, pxH, u.figure ? grow : 0)
      if (href) adoptSnap(base, key, href)
    } catch { /* the next one */ } finally { probe.remove() }
  }
  warming = false
}
