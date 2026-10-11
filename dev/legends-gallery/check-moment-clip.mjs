// Raid boss MOMENT CLIP check: is any part of the boss cut flat by the arena's clip in a fight animation? Run by
// check-art.mjs; alone:
//   node dev/legends-gallery/check-moment-clip.mjs                every raid boss (dev server up on 3001)
//   node dev/legends-gallery/check-moment-clip.mjs horseman --sheet <dir>   also a contact sheet per failing animation
//   EBIKI_ONLY=raids/horseman (as check-art) or names as arguments limit it; CLIP_PHASE=2 / CLIP_STATE="moment crit"
//   narrow it; CLIP_VERBOSE=1 prints every animation's worst reach.
// The owner (2026-10-10): "the edges should not cut off the boss". check-art.mjs measures the idle and entrance motion
// only; a Headless Horseman review then found his lantern and his horse's muzzle sliced flat at the clip edge in
// hurtBig, caught, close, cross, crit, shield, assault and knockout frames that every other check missed.
// HOW: the boss renders the way BossArena plays it: the art box (LegendsArt's data-lg-art div, clip-path inset(-20%),
// art.jsx BOSS_HEADROOM) inside an .lg-boss root carrying data-phase and the state's attribute (data-moment,
// data-fx, data-fx-pending, data-assault-on, data-down, the ability's data-ab-* state layers), with the boss's real
// CSS (impact/parts.jsx PARTS_CSS incl. every impact/bosses css, fx/<motif>.jsx css + the generated fx/state layer
// rules). The body moves and lgr- reactions run on wrappers OUTSIDE that box (the clip moves with them), so only the
// CSS that moves parts INSIDE the SVG can cut, and that is what is played: every CSS animation is frozen every STEP ms
// over its whole length (an infinite loop: one iteration), plus the held end pose. The SVG's own idle SMIL stays at
// frame 0 (its extremes are check-art's job). Each visible shape (fill or stroke, effective opacity > MIN_OPACITY) is
// judged on its REAL outline (getTotalLength samples plus half the stroke, never the rotated bounding box): a shape
// partly inside the clip and reaching more than TOL view-box units past it is CUT. A shape wholly outside is hidden on
// purpose (parked), and a shape already cut at rest in that phase is reported once as "rest" (check-art's clip line).
// Effects outside the art box (StrikeFxLayer flashes and plates, floaters, PowerFx, AssaultFx) are not the boss
// drawing and are not measured; fx layers drawn INSIDE the boss SVG (lg-fx-*) are.
import fs from 'fs'
import os from 'os'
import path from 'path'
import { pathToFileURL, fileURLToPath } from 'url'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..') // the app folder, whatever the cwd
const DEPS = process.env.EBIKI_DRIVE_DEPS || path.join(os.homedir(), '.ebiki-drive')
const pw = path.join(DEPS, 'node_modules', 'playwright-core', 'index.mjs')
if (!fs.existsSync(pw)) { console.error('playwright-core is missing: run `npm run drive` once to install it.'); process.exit(2) }
const { chromium } = await import(pathToFileURL(pw).href)
const URL = process.env.EBIKI_URL || 'http://localhost:3001/dev/legends-gallery/'
const HEADROOM = 0.2     // keep equal to art.jsx HEADROOM_SHARE
const TOL = 0.5          // view-box units (of 120) a part may reach past the clip before it reads as cut flat
const MIN_OPACITY = 0.05 // a part fading out below this is not seen
const STEP = 60          // ms between sampled frames
const SPAN = 2600        // ms at most per animation (the longest knockout is 2.6 s)
const BOX = 240          // px of the art box (precision: 2 px per view-box unit)
const MOMENTS = ['hit', 'crit', 'sharpen', 'hurt', 'hurtBig', 'block', 'shield', 'wind', 'ko']
const args = process.argv.slice(2)
const sheetAt = args.indexOf('--sheet')
const SHEET = sheetAt >= 0 ? args[sheetAt + 1] : ''
const ONLY = [
  ...args.filter((a, i) => !a.startsWith('--') && !(sheetAt >= 0 && i === sheetAt + 1)),
  ...(process.env.EBIKI_ONLY || '').split(',').filter((o) => o && (!o.includes('/') || o.startsWith('raids/'))).map((o) => o.replace(/^raids\//, '')),
]
if (process.env.EBIKI_ONLY && !ONLY.length) { console.log('0 moment clip failure(s) (EBIKI_ONLY names no raid boss)'); process.exit(0) }

const t0 = Date.now()
const browser = await chromium.launch({ headless: true, args: ['--mute-audio'] }) // Playwright's bundled Chromium only, muted
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
// Nothing this check does may write: every non-GET /api request is answered here.
await page.route('**/api/**', (r) => (r.request().method() === 'GET' ? r.continue() : r.fulfill({ status: 204, body: '' })))
// No hot reload: an edit anywhere in src/ reloaded the page mid-measurement.
await page.route('**/@vite/client', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: 'export const createHotContext = () => ({ accept(){}, dispose(){}, prune(){}, invalidate(){}, on(){}, off(){}, send(){}, data: {} }); export const injectQuery = (u) => u; export const updateStyle = (id, css) => { let s = document.querySelector(`style[data-vite-dev-id="${id}"]`); if (!s) { s = document.createElement("style"); s.setAttribute("data-vite-dev-id", id); document.head.appendChild(s) } s.textContent = css }; export const removeStyle = () => {};' }))
// CLIP_SVG_DIR=<dir>: read <dir>/<motif>.svg instead of the served file (to prove the check on an older drawing)
const SVG_DIR = process.env.CLIP_SVG_DIR || ''
if (SVG_DIR) await page.route('**/assets/legends/raids/*.svg', (r) => { const f = path.join(SVG_DIR, path.basename(new globalThis.URL(r.request().url()).pathname)); return fs.existsSync(f) ? r.fulfill({ status: 200, contentType: 'image/svg+xml', body: fs.readFileSync(f, 'utf8') }) : r.continue() })
// CLIP_OVERRIDE="src/features/legends/fx/hydra.jsx=<file>;...": serve an older copy of a boss CSS module (to prove the
// check on art from before a fix). The copy is compiled here (esbuild, JSX made inert: only its css strings matter) and
// its relative imports point at the live folder.
for (const pair of (process.env.CLIP_OVERRIDE || '').split(';').filter(Boolean)) {
  const [rel, file] = pair.split('=')
  const { transformSync } = await import(pathToFileURL(path.join(ROOT, 'node_modules/esbuild/lib/main.js')).href)
  const dir = path.posix.dirname('/' + rel.replace(/\\/g, '/').replace(/^\//, ''))
  const fix = (spec) => {
    if (!spec.startsWith('.')) return spec
    const abs = path.posix.join(dir, spec)
    const hit = ['', '.js', '.jsx', '/index.js'].find((e) => fs.existsSync(path.join(ROOT, abs + e)))
    return abs + (hit ?? '')
  }
  const code = transformSync(fs.readFileSync(file, 'utf8'), { loader: 'jsx', jsx: 'transform', jsxFactory: '__clipH', jsxFragment: '__clipF', banner: 'const __clipH = () => null, __clipF = null;' }).code
    .replace(/(from\s*|import\s*\(?\s*)(['"])([^'"]+)\2/g, (m, a, q, spec) => `${a}${q}${fix(spec)}${q}`)
  await page.route((u) => u.pathname === '/' + rel.replace(/^\//, ''), (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: code }))
}
const ready = async () => { await page.goto(URL, { waitUntil: 'networkidle' }); await page.evaluate(async () => {
  // the gallery itself animates every drawing: take it off the page so it costs nothing
  for (const e of document.body.children) e.style.display = 'none'
  const { RAID_MOTIFS, RAID_ABILITY } = await import('/src/features/legends/raid.js')
  const { sanitizeHtml } = await import('/src/components/Markdown.jsx')
  const { withMotion, withPhotoEye } = await import('/src/features/legends/art.jsx')
  const { PARTS_CSS } = await import('/src/features/legends/impact/parts.jsx')
  const { abilityCss, fxDemoFor } = await import('/src/features/legends/fx/index.js')
  const { abilityById } = await import('/src/features/legends/abilities/index.js')
  const phaseCss = `.lg-boss[data-phase="2"] .lg-p2, .lg-boss[data-phase="3"] .lg-p2, .lg-boss[data-phase="3"] .lg-p3 { display: inline !important }
.lg-boss[data-phase="2"] .lg-p1, .lg-boss[data-phase="3"] .lg-p1, .lg-boss[data-phase="3"] .lg-p12 { display: none !important }`
  const style = document.createElement('style'); style.id = 'clip-css'
  style.textContent = PARTS_CSS + '\n' + phaseCss
  document.head.appendChild(style)
  const texts = {}
  window.__clip = {
    RAID_MOTIFS,
    fxKeys: (m) => abilityById(RAID_ABILITY[m])?.fxKeys || [],
    // per fx key: the data-ab-* attributes of the state its demo fires it in (empty when the demo names none)
    fxAb(m) {
      const mod = abilityById(RAID_ABILITY[m]); const out = {}
      for (const k of mod?.fxKeys || []) {
        const ab = fxDemoFor(RAID_ABILITY[m], k)?.ab
        if (!ab || !mod.artState) continue
        try { out[k] = Object.fromEntries(Object.entries(mod.artState({ ab }, { phase: 1, K: mod.K || {} }) || {}).filter(([a, v]) => /^data-ab-/.test(a) && v != null).map(([a, v]) => [a, String(v)])) } catch { /* a demo state this module cannot read: none */ }
      }
      return out
    },
    // the photo ophanim as the app shows it: art.jsx PHOTO LAYERS fill its empty lg-photo-* groups with <image> cells
    async svg(m) { const u = `/assets/legends/raids/${m}.svg`; texts[m] ||= withMotion(withPhotoEye(sanitizeHtml(await (await fetch(u, { cache: 'no-store' })).text(), { USE_PROFILES: { svg: true } }), u), 'idle'); return texts[m] },
    // this boss's fx css plus a state-layer rule for every data-ab-* value its drawing has a layer for, and the
    // data-ab-* states its css names: [[attr, value]]
    async boss(m) {
      const markup = await this.svg(m)
      const pairs = new Map()
      for (const [, , name, v] of markup.matchAll(/\blg-(ab|abh)-([\w-]+)-([\w]+)\b/g)) pairs.set(`data-ab-${name}=${v}`, [`data-ab-${name}`, v])
      let css = abilityCss(RAID_ABILITY[m], {})
      // the same state-layer rule abilityCss writes for the value shown right now (fx/index.js)
      for (const [a, v] of pairs.values()) { const n = a.slice(8); css += `\n.lg-boss[${a}="${v}"] .lg-ab-${n}-${v} { display: inline !important } .lg-boss[${a}="${v}"] .lg-abh-${n}-${v} { display: none !important }` }
      for (const [, a, v] of css.matchAll(/\[(data-ab-[\w-]+)="?([\w.-]+)"?\]/g)) if (!pairs.has(`${a}=${v}`)) pairs.set(`${a}=${v}`, [a, v])
      return { css, ab: [...pairs.values()] }
    },
  }
}) }
await ready()
const retry = async (fn) => { for (let i = 0; ; i++) { try { return await fn() } catch (e) { if (i >= 3) throw e; await ready() } } }

// The fight moments, alone or on top of an ability state.
const fightStates = (pre, extra) => [
  ...MOMENTS.map((m) => [`${pre}moment ${m}`, { ...extra, 'data-moment': m }]),
  [`${pre}assault`, { ...extra, 'data-assault-on': '1' }],
  [`${pre}assault + strike`, { ...extra, 'data-assault-on': '1', 'data-moment': 'hurt' }],
  [`${pre}assault + heavy`, { ...extra, 'data-assault-on': '1', 'data-moment': 'hurtBig' }],
  [`${pre}knocked out`, { ...extra, 'data-down': '1' }],
]
// The MOST VISIBLE ability state(s): every data-ab-* attribute at its largest number (the Hydra's six heads up,
// every orbit, every lantern lit); an attribute with word values (seraph mercy / wrath) gives one state per word.
// A Hydra with all six heads was never run through a moment, and its outer heads were cut in hurt, assault and ko.
const maxStates = (ab) => {
  const by = new Map(); for (const [a, v] of ab) by.set(a, [...(by.get(a) || []), v])
  const base = {}, words = []
  for (const [a, vs] of by) {
    const nums = vs.filter((v) => /^-?\d+(\.\d+)?$/.test(v)).map(Number)
    if (nums.length) base[a] = String(Math.max(...nums))
    const w = vs.filter((v) => !/^-?\d+(\.\d+)?$/.test(v)); if (w.length) words.push([a, w])
  }
  const combos = [base]
  for (const [a, w] of words) { const prev = combos.splice(0); for (const c of prev) for (const v of w) combos.push({ ...c, [a]: v }) }
  return combos.filter((c) => Object.keys(c).length).slice(0, 4)
}
const tag = (c) => Object.entries(c).map(([a, v]) => `${a.slice(8)}=${v}`).join(' ')
const statesFor = (motif, css, fxKeys, ab, fxAb = {}) => { const idle = [...new Set([...css.matchAll(new RegExp(`\\.lgr-${motif}-idle-([\\w-]+)`, 'g'))].map((x) => x[1]))]; return [
  ...fightStates('', {}),
  // an effect plays with the ability state its demo fires it in (fx/<motif>.jsx demo ab: a grow on five heads)
  // the arena puts the boss's REACTION class (.lgr-<motif>-<fx>, fx/<motif>.jsx css) on with data-fx: an Inferno
  // erupt threw the river 81 units past the top there, unseen while only data-fx was played
  ...fxKeys.flatMap((k) => [[`fx ${k}`, { ...fxAb[k], 'data-fx': k, react: `lgr-${motif}-${k}` }], [`fx-pending ${k}`, { ...fxAb[k], 'data-fx-pending': k }]]),
  ...idle.map((k) => [`idle reaction ${k}`, { react: `lgr-${motif}-idle-${k}` }]),
  ...ab.map(([a, v]) => [`ab ${a.slice(8)}=${v}`, { [a]: v }]),
  ...maxStates(ab).flatMap((c) => [
    ...fightStates(`[${tag(c)}] `, c),
    ...fxKeys.map((k) => [`[${tag(c)}] fx ${k}`, { ...c, 'data-fx': k, react: `lgr-${motif}-${k}` }]),
    ...idle.map((k) => [`[${tag(c)}] idle reaction ${k}`, { ...c, react: `lgr-${motif}-idle-${k}` }]),
  ]),
] }

// One phase of one boss: every state played and measured. With `sheet` = [state, times], draws that state's frames
// side by side instead (for the contact sheet).
const measure = (motif, css, states, phase, sheet) => retry(() => page.evaluate(async ({ motif, css, states, phase, STEP, SPAN, BOX, HEADROOM, TOL, MIN_OPACITY, sheet }) => {
  const markup = await window.__clip.svg(motif)
  document.getElementById('clip-boss-css')?.remove()
  const st = document.createElement('style'); st.id = 'clip-boss-css'; st.textContent = css; document.head.appendChild(st)
  const host = document.createElement('div'); host.id = 'clip-host'
  host.style.cssText = `position:absolute;z-index:99999;left:0;top:0;background:#151a24;display:flex;flex-wrap:wrap;gap:${Math.round(BOX * 0.5)}px;padding:${Math.round(BOX * 0.3)}px;width:1600px;box-sizing:border-box`
  document.getElementById('clip-host')?.remove(); document.body.prepend(host)
  const mk = (size) => {
    const root = document.createElement('div'); root.className = 'lg-boss'; root.dataset.motif = motif; root.dataset.phase = String(phase)
    root.style.cssText = `position:relative;flex:none;width:${size}px;height:${size}px`
    const art = document.createElement('div'); art.dataset.lgArt = ''
    art.style.cssText = `width:${size}px;height:${size}px;overflow:visible;clip-path:inset(-${HEADROOM * 100}%)`
    const inner = document.createElement('div'); inner.style.cssText = 'width:100%;height:100%'; inner.innerHTML = markup
    art.appendChild(inner)
    // BossArena's reaction wrapper (.lgr-<motif>-<fx>, .lgr-<motif>-idle-<key>) sits between the root and the art box
    const react = document.createElement('div'); react.dataset.clipReact = ''; react.appendChild(art); root.appendChild(react); host.appendChild(root)
    const svg = inner.querySelector('svg'); svg.setAttribute('width', size); svg.setAttribute('height', size); svg.setAttribute('overflow', 'visible'); svg.style.display = 'block'
    svg.pauseAnimations(); svg.setCurrentTime(0)
    return { root, art, svg }
  }
  const put = (root, attrs) => { const react = root.querySelector('[data-clip-react]'); react.className = ''; for (const [k, v] of Object.entries(attrs)) { if (k === 'react') react.className = v; else root.setAttribute(k, v) } }
  const seek = (root, t) => root.getAnimations({ subtree: true }).forEach((a) => { a.pause(); a.currentTime = t })
  const spanOf = (root) => {
    let end = 0
    for (const a of root.getAnimations({ subtree: true })) {
      const c = a.effect?.getComputedTiming?.(); if (!c) continue
      const e = Number.isFinite(c.endTime) ? c.endTime : (a.effect.getTiming().delay || 0) + (Number(c.duration) || 0)
      if (e > end) end = e
    }
    return Math.min(SPAN, Math.ceil(end))
  }
  if (sheet) {
    const [[, attrs], times] = sheet
    for (const t of times) {
      const { root, art } = mk(BOX)
      put(root, attrs)
      const frame = document.createElement('div'); frame.style.cssText = `position:absolute;inset:-${HEADROOM * 100}%;outline:1px dashed #f55;pointer-events:none`
      root.appendChild(frame)
      const lab = document.createElement('div'); lab.textContent = `${t} ms`; lab.style.cssText = `position:absolute;left:-${HEADROOM * 100}%;top:-${HEADROOM * 100 + 9}%;font:12px monospace;color:#9ab`
      root.appendChild(lab); void art
    }
    getComputedStyle(host).width
    ;[...host.children].forEach((root, i) => seek(root, times[i]))
    return null
  }
  const { root, art, svg } = mk(BOX)
  const vbw = svg.viewBox.baseVal.width || 120
  const SKIPTAG = /^(defs|clipPath|mask|marker|pattern|symbol|linearGradient|radialGradient|filter)$/
  const shapes = [...svg.querySelectorAll('path,circle,ellipse,rect,polygon,polyline,line,image')].filter((s) => { for (let e = s.parentElement; e && e !== svg; e = e.parentElement) if (SKIPTAG.test(e.tagName)) return false; return true })
  // each photo cell's PAINTED box (alpha over 16 of 255), as fractions of the picture: a cell's transparent margin is
  // never cut, so the image is judged by the corners of what it paints
  const painted = new Map()
  for (const href of new Set([...svg.querySelectorAll('image')].map((i) => i.getAttribute('href')).filter(Boolean))) {
    painted.set(href, await new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight
        const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0)
        const d = cx.getImageData(0, 0, cv.width, cv.height).data
        let x0 = cv.width, y0 = cv.height, x1 = -1, y1 = -1
        for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (d[(y * cv.width + x) * 4 + 3] > 16) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
        resolve(x1 < 0 ? null : { x0: x0 / cv.width, y0: y0 / cv.height, x1: (x1 + 1) / cv.width, y1: (y1 + 1) / cv.height })
      }
      img.onerror = () => resolve({ x0: 0, y0: 0, x1: 1, y1: 1 }) // unreadable: its whole box
      img.src = href
    }))
  }
  const outPts = new WeakMap()
  const pointsOf = (sh) => {
    let p = outPts.get(sh); if (p) return p
    // an <image> (the photo ophanim's cells) by its own box: a 9 x 9 grid of points, corners included, so its
    // transformed corners give the extent and a big picture overlapping the clip still counts as inside
    if (sh.tagName === 'image') {
      const b = painted.get(sh.getAttribute('href'))
      p = []
      if (!b) { outPts.set(sh, p); return p } // a fully transparent cell paints nothing
      const X = sh.x.baseVal.value, Y = sh.y.baseVal.value, W = sh.width.baseVal.value, H = sh.height.baseVal.value
      const x = X + W * b.x0, y = Y + H * b.y0, w = W * (b.x1 - b.x0), h = H * (b.y1 - b.y0)
 for (let i = 0; i <= 8; i++) for (let j = 0; j <= 8; j++) p.push(x + (w * i) / 8, y + (h * j) / 8)
      outPts.set(sh, p); return p
    }
    const len = sh.getTotalLength ? sh.getTotalLength() : 0
    p = []
    if (len > 0) { const n = Math.min(1200, Math.max(48, Math.ceil(len * 2))); for (let k = 0; k <= n; k++) { const q = sh.getPointAtLength((len * k) / n); p.push(q.x, q.y) } }
    outPts.set(sh, p); return p
  }
  const opacityOf = (sh) => { let o = 1; for (let e = sh; e && e !== art; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity); return o }
  const partOf = (sh) => {
    let first = ''
    for (let e = sh.parentElement; e && e !== svg; e = e.parentElement) for (const c of e.classList) {
      if (c.startsWith(`lg-${motif}-`)) return c.slice(`lg-${motif}-`.length)
      if (!first && /^lg-(fx|ab)/.test(c)) first = c
    }
    // no named part above it: the shape itself, as check-art names it
    return first || (sh.getAttribute('id') ? '#' + sh.getAttribute('id') : sh.outerHTML.slice(0, 48))
  }
  // per frame: for every visible shape crossing the clip, how far past it (view-box units) and on which side
  const frame = () => {
    // inset(-20%) follows each axis: a reaction scaling the boss unevenly gives different side and top pads
    const a = art.getBoundingClientRect(); const padX = a.width * HEADROOM, padY = a.height * HEADROOM
    const c = { l: a.left - padX, t: a.top - padY, r: a.right + padX, b: a.bottom + padY }
    const u = vbw / a.width
    const hits = []
    for (const sh of shapes) {
      const r = sh.getBoundingClientRect()
      if (!(r.width > 0 || r.height > 0)) continue
      // cheap first: the box (strokes ignored by the rect, so allow a margin) must cross an edge and touch the inside
      const m = 6
      if (r.left > c.l + m && r.top > c.t + m && r.right < c.r - m && r.bottom < c.b - m) continue
      if (r.right < c.l || r.left > c.r || r.bottom < c.t || r.top > c.b) continue
      const cs = getComputedStyle(sh)
      const fill = cs.fill !== 'none' && parseFloat(cs.fillOpacity) > 0, stroke = cs.stroke !== 'none' && parseFloat(cs.strokeOpacity) > 0 && parseFloat(cs.strokeWidth) > 0
      if (!fill && !stroke && sh.tagName !== 'image') continue
      if (cs.visibility === 'hidden') continue
      const op = opacityOf(sh); if (op < MIN_OPACITY) continue
      const M = sh.getScreenCTM(); if (!M) continue
      const sc = Math.sqrt(Math.abs(M.a * M.d - M.b * M.c)); if (sc < 1e-6) continue
      const sw = stroke ? (parseFloat(cs.strokeWidth) || 0) / 2 * sc : 0
      const pts = pointsOf(sh); if (!pts.length) continue
      let l = Infinity, t = Infinity, rr = -Infinity, bb = -Infinity, inside = false
      for (let k = 0; k < pts.length; k += 2) {
        const x = M.a * pts[k] + M.c * pts[k + 1] + M.e, y = M.b * pts[k] + M.d * pts[k + 1] + M.f
        if (x < l) l = x; if (x > rr) rr = x; if (y < t) t = y; if (y > bb) bb = y
        if (!inside && x > c.l && x < c.r && y > c.t && y < c.b) inside = true
      }
      if (!inside) continue // wholly outside: parked off canvas on purpose, never seen
      const side = { left: (c.l - (l - sw)) * u, top: (c.t - (t - sw)) * u, right: ((rr + sw) - c.r) * u, bottom: ((bb + sw) - c.b) * u }
      const [s, o] = Object.entries(side).sort((x, y) => y[1] - x[1])[0]
      if (o > TOL) hits.push({ sh, side: s, o, op })
    }
    return hits
  }
  // at rest in this phase: shapes already cut are check-art's clip line, reported once and left out below
  // (painted shapes). An <image> is NOT check-art's (it never loads the photo cells): cut at rest it FAILS here. A shape
  // cut at rest that a moment pushes further past the clip than that is reported for the moment too.
  const rest = new Map(frame().map((h) => [h.sh, h]))
  const restParts = [...new Set([...rest.keys()].filter((sh) => sh.tagName !== 'image').map(partOf))]
  const restImages = []
  for (const h of rest.values()) if (h.sh.tagName === 'image') { const w = restImages.find((x) => x.part === partOf(h.sh) && x.side === h.side); if (!w) restImages.push({ part: partOf(h.sh), side: h.side, o: h.o, href: h.sh.getAttribute('href') }); else if (h.o > w.o) Object.assign(w, { o: h.o, href: h.sh.getAttribute('href') }) }
  const out = []
  for (const [name, attrs] of states) {
    for (const k of [...root.attributes].map((x) => x.name)) if (!['class', 'style', 'data-motif', 'data-phase'].includes(k)) root.removeAttribute(k)
    put(root, attrs)
    getComputedStyle(svg).width
    const span = spanOf(root)
    const anims = root.getAnimations({ subtree: true }).length
    const times = []; for (let t = 0; t < span; t += STEP) times.push(t); times.push(span)
    const worst = new Map() // part|side -> { o, t, times: [] }
    let reach = 0
    for (const t of times) {
      seek(root, t)
      for (const h of frame()) {
        if (rest.has(h.sh) && h.o <= rest.get(h.sh).o + TOL) continue
        // one row per named part and side; shapes under no named part share one row (named by the worst shape)
        const p = partOf(h.sh), named = !p.startsWith('<')
        const key = `${named ? p : '?'}|${h.side}`
        const w = worst.get(key) || { part: p, side: h.side, o: 0, t: 0, times: [], tag: h.sh.tagName }
        if (h.o > w.o) Object.assign(w, { o: h.o, t, tag: h.sh.tagName, ...(named ? {} : { part: p }) })
        if (!w.times.includes(t)) w.times.push(t)
        worst.set(key, w); if (h.o > reach) reach = h.o
      }
    }
    seek(root, 0)
    out.push({ name, anims, span, reach, cuts: [...worst.values()] })
  }
  host.remove()
  return { rest: restParts, restImages, rows: out }
}, { motif, css, states, phase, STEP, SPAN, BOX, HEADROOM, TOL, MIN_OPACITY, sheet }))

const motifs = ONLY.length ? [...new Set(ONLY)] : await retry(() => page.evaluate(() => window.__clip.RAID_MOTIFS))
const fails = [], warns = [], table = []
for (const motif of motifs) {
  const tb = Date.now()
  const fxKeys = await retry(() => page.evaluate((m) => window.__clip.fxKeys(m), motif))
  const { css, ab } = await retry(() => page.evaluate((m) => window.__clip.boss(m), motif))
  const fxAb = await retry(() => page.evaluate((m) => window.__clip.fxAb(m), motif))
  const states = statesFor(motif, css, fxKeys, ab, fxAb).filter(([name]) => !process.env.CLIP_STATE || name === process.env.CLIP_STATE)
  let n = 0
  for (const phase of (process.env.CLIP_PHASE ? [Number(process.env.CLIP_PHASE)] : [1, 2, 3])) {
    const { rest, restImages, rows } = await measure(motif, css, states, phase, null)
    for (const c of restImages) { n++; fails.push(`cut    ${motif} p${phase} at rest: ${c.part} image ${c.href.split('/').pop()} cut flat at the ${c.side} edge, ${c.o.toFixed(1)} units past the clip`); table.push({ motif, phase, state: 'rest (image)', part: c.part, side: c.side, o: c.o, t: 0, frames: 1 }) }
    if (rest.length) warns.push(`cut    ${motif} p${phase} at rest (check-art's clip): ${rest.join(', ')}`)
    for (const r of rows) {
      if (process.env.CLIP_VERBOSE) console.log(`  ${motif} p${phase} ${r.name.padEnd(24)} anims ${String(r.anims).padStart(3)} ${String(r.span).padStart(4)} ms  reach ${r.reach.toFixed(1)}`)
      for (const c of r.cuts.sort((a, b) => b.o - a.o)) {
        n++
        const ts = c.times.length > 6 ? `${c.times.slice(0, 6).join('/')}/... (${c.times.length} frames)` : c.times.join('/')
        fails.push(`cut    ${motif} p${phase} ${r.name}: ${c.part || c.tag} cut flat at the ${c.side} edge, ${c.o.toFixed(1)} units past the clip at ${c.t} ms (frames ${ts} ms)`)
        table.push({ motif, phase, state: r.name, part: c.part || c.tag, side: c.side, o: c.o, t: c.t, frames: c.times.length })
      }
      if (SHEET && r.cuts.length) {
        fs.mkdirSync(SHEET, { recursive: true })
        const all = [...new Set(r.cuts.flatMap((c) => c.times))].sort((a, b) => a - b)
        const pick = all.length <= 8 ? all : [...Array(8).keys()].map((k) => all[Math.round((k * (all.length - 1)) / 7)])
        const st = states.find(([nm]) => nm === r.name)
        await measure(motif, css, [st], phase, [st, pick])
        await page.waitForTimeout(150)
        await page.locator('#clip-host').screenshot({ path: path.join(SHEET, `${motif}-p${phase}-${r.name.replace(/[^\w]+/g, '_')}.png`) })
        await page.evaluate(() => document.getElementById('clip-host')?.remove())
      }
    }
  }
  if (process.env.CLIP_VERBOSE || motifs.length > 1) console.log(`  ${motif}: ${n} cut(s), ${((Date.now() - tb) / 1000).toFixed(1)} s`)
}
await browser.close()
if (process.env.CLIP_TABLE) fs.writeFileSync(process.env.CLIP_TABLE, JSON.stringify(table, null, 1))
for (const w of warns) console.log('warn  ', w)
for (const f of fails) console.log('FAIL  ', f)
console.log(`${fails.length} moment clip failure(s), ${warns.length} warning(s), ${((Date.now() - t0) / 1000).toFixed(0)} s`)
process.exit(fails.length ? 1 : 0)
