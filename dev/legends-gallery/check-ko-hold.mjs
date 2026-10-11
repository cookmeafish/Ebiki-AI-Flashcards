// Raid boss KNOCKOUT HOLD check: does the fallen boss stay exactly as the knockout cinematic left him? Run by
// check-art.mjs; alone:
//   node dev/legends-gallery/check-ko-hold.mjs                     every raid boss (dev server up on 3001)
//   node dev/legends-gallery/check-ko-hold.mjs showman --sheet <dir>   also a sheet per failing phase (last frame, +300 ms, +2 s)
//   EBIKI_ONLY=raids/showman (as check-art) or names as arguments limit it; KO_PHASE=2 narrows it; KO_VERBOSE=1 prints
//   every part's jump. CLIP_OVERRIDE="<src path>=<old file>;..." serves an older boss CSS module (check-moment-clip.mjs).
// The owner saw the Showman's knockout "pop": when the ko moment ended (about 2.9 s) his arms, head, masks and wings
// dropped their knockout animations and snapped back to the idle pose while the fallen body stayed (the kitsune too).
// HOW (BossArena's real sequence, useJuice + StrikeFxLayer): at the killing blow the arena root gets data-down; JUICE.delay
// later data-moment="ko" and the strike layer's CSS (impact/parts.jsx PARTS_CSS, every impact/bosses css with it) come on;
// at JUICE.delay + koTiming(motif).ms + 250 the moment ends: data-moment goes AND that CSS leaves the page. Only the
// fx/<motif>.jsx css (+ the generated layer rules) stays, so the held pose must come from [data-down] rules there. The
// boss is built as in check-moment-clip (an .lg-boss root, the clipped art box, the SVG's idle at frame 0: the arena
// shows a fallen boss still) and played on a virtual clock: every CSS animation is paused and set to the time since it
// started. The drawing at the LAST cinematic frame (1 ms before the moment ends) is compared with the held pose 300 ms
// and 2 s later. Every named part (lg-<motif>-*) is judged on its OWN move (relative to the nearest named part above
// it, measured in view-box units by its bounding-box corners): a jump over POS_TOL units, an opacity change over OP_TOL
// or a part appearing / vanishing FAILS. The body wrapper outside the art box (impact/body.js ko move) is not measured:
// it is one element that never remounts.
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
const HEADROOM = 0.2  // keep equal to art.jsx HEADROOM_SHARE
const POS_TOL = 1.0   // view-box units (of 120) a part may move between the last cinematic frame and the held pose
const OP_TOL = 0.15   // opacity it may change
const LATER = [300, 2000] // ms after the moment ends
const BOX = 240
const args = process.argv.slice(2)
const sheetAt = args.indexOf('--sheet')
const SHEET = sheetAt >= 0 ? args[sheetAt + 1] : ''
const ONLY = [
  ...args.filter((a, i) => !a.startsWith('--') && !(sheetAt >= 0 && i === sheetAt + 1)),
  ...(process.env.EBIKI_ONLY || '').split(',').filter((o) => o && (!o.includes('/') || o.startsWith('raids/'))).map((o) => o.replace(/^raids\//, '')),
]
if (process.env.EBIKI_ONLY && !ONLY.length) { console.log('0 ko hold failure(s) (EBIKI_ONLY names no raid boss)'); process.exit(0) }

const t0 = Date.now()
const browser = await chromium.launch({ headless: true, args: ['--mute-audio'] }) // Playwright's bundled Chromium only, muted
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
await page.route('**/api/**', (r) => (r.request().method() === 'GET' ? r.continue() : r.fulfill({ status: 204, body: '' })))
await page.route('**/@vite/client', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: 'export const createHotContext = () => ({ accept(){}, dispose(){}, prune(){}, invalidate(){}, on(){}, off(){}, send(){}, data: {} }); export const injectQuery = (u) => u; export const updateStyle = (id, css) => { let s = document.querySelector(`style[data-vite-dev-id="${id}"]`); if (!s) { s = document.createElement("style"); s.setAttribute("data-vite-dev-id", id); document.head.appendChild(s) } s.textContent = css }; export const removeStyle = () => {};' }))
const overrides = [] // [url matcher, compiled module] for every page this check opens
// CLIP_SVG_DIR=<dir>: <dir>/<motif>.svg instead of the served drawing (an older copy, to prove the check)
if (process.env.CLIP_SVG_DIR) for (const f of fs.readdirSync(process.env.CLIP_SVG_DIR).filter((x) => x.endsWith('.svg'))) {
  const body = fs.readFileSync(path.join(process.env.CLIP_SVG_DIR, f), 'utf8')
  overrides.push([(u) => u.pathname === `/assets/legends/raids/${f}`, body, 'image/svg+xml'])
}
// CLIP_OVERRIDE: as in check-moment-clip.mjs (an older copy compiled here, JSX inert, relative imports to the live folder)
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
  const match = (u) => u.pathname === '/' + rel.replace(/^\//, '')
  overrides.push([match, code])
  await page.route(match, (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: code }))
}
for (const [u, body, type] of overrides) if (type) await page.route(u, (r) => r.fulfill({ status: 200, contentType: type, body }))
const ready = async () => { await page.goto(URL, { waitUntil: 'networkidle' }); await page.evaluate(async () => {
  for (const e of document.body.children) e.style.display = 'none' // the gallery animates every drawing: off the page
  const { RAID_MOTIFS, RAID_ABILITY } = await import('/src/features/legends/raid.js')
  const { sanitizeHtml } = await import('/src/components/Markdown.jsx')
  const { withMotion } = await import('/src/features/legends/art.jsx')
  const { PARTS_CSS } = await import('/src/features/legends/impact/parts.jsx')
  const { koTiming } = await import('/src/features/legends/impact/styles.js')
  const { JUICE } = await import('/src/features/legends/fx/_juice.js')
  const { abilityCss } = await import('/src/features/legends/fx/index.js')
  const phaseCss = `.lg-boss[data-phase="2"] .lg-p2, .lg-boss[data-phase="3"] .lg-p2, .lg-boss[data-phase="3"] .lg-p3 { display: inline !important }
.lg-boss[data-phase="2"] .lg-p1, .lg-boss[data-phase="3"] .lg-p1, .lg-boss[data-phase="3"] .lg-p12 { display: none !important }`
  const style = document.createElement('style'); style.textContent = phaseCss; document.head.appendChild(style)
  const texts = {}
  window.__ko = {
    RAID_MOTIFS, PARTS_CSS, delay: JUICE.delay,
    koMs: (m) => koTiming(m).ms,
    css: (m) => abilityCss(RAID_ABILITY[m], {}),
    async svg(m) { texts[m] ||= withMotion(sanitizeHtml(await (await fetch(`/assets/legends/raids/${m}.svg`, { cache: 'no-store' })).text(), { USE_PROFILES: { svg: true } }), 'idle'); return texts[m] },
  }
}) }
await ready()
const retry = async (fn) => { for (let i = 0; ; i++) { try { return await fn() } catch (e) { if (i >= 3) throw e; await ready() } } }

// One phase of one boss. `sheet`: also leave the three frames on the page side by side (#ko-host) for a screenshot.
const measure = (motif, phase, sheet) => retry(() => page.evaluate(async ({ motif, phase, BOX, HEADROOM, POS_TOL, OP_TOL, LATER, sheet }) => {
  const K = window.__ko
  const markup = await K.svg(motif)
  document.getElementById('ko-host')?.remove()
  for (const id of ['ko-ab-css', 'ko-parts-css']) document.getElementById(id)?.remove()
  const ab = document.createElement('style'); ab.id = 'ko-ab-css'; ab.textContent = K.css(motif); document.head.appendChild(ab)
  const host = document.createElement('div'); host.id = 'ko-host'
  host.style.cssText = `position:absolute;z-index:99999;left:0;top:0;background:#151a24;display:flex;gap:${Math.round(BOX * 0.5)}px;padding:${Math.round(BOX * 0.3)}px`
  document.body.prepend(host)
  const end = K.delay + K.koMs(motif) + 250 // when useJuice ends the ko moment
  const stamps = [end - 1, ...LATER.map((d) => end + d)]
  // the same knockout played once per frame (sheet) or once in all (measure): each box keeps its own virtual clock
  const boxes = (sheet ? stamps : [stamps[0]]).map(() => {
    const root = document.createElement('div'); root.className = 'lg-boss'; root.dataset.motif = motif; root.dataset.phase = String(phase)
    root.style.cssText = `position:relative;flex:none;width:${BOX}px;height:${BOX}px`
    const art = document.createElement('div'); art.dataset.lgArt = ''
    art.style.cssText = `width:${BOX}px;height:${BOX}px;overflow:visible;clip-path:inset(-${HEADROOM * 100}%)`
    const inner = document.createElement('div'); inner.style.cssText = 'width:100%;height:100%'; inner.innerHTML = markup
    art.appendChild(inner); root.appendChild(art); host.appendChild(root)
    const svg = inner.querySelector('svg'); svg.setAttribute('width', BOX); svg.setAttribute('height', BOX); svg.setAttribute('overflow', 'visible'); svg.style.display = 'block'
    svg.pauseAnimations(); svg.setCurrentTime(0)
    return { root, art, svg, birth: new Map() }
  })
  const parts = document.createElement('style'); parts.id = 'ko-parts-css'; parts.textContent = K.PARTS_CSS
  // virtual clock: an animation's time is the clock minus when it started (new ones start at `vt`)
  const seek = (b, vt) => { getComputedStyle(b.svg).width; for (const a of b.root.getAnimations({ subtree: true })) { if (!b.birth.has(a)) b.birth.set(a, vt); a.pause(); a.currentTime = Math.max(0, vt - b.birth.get(a)) } }
  const play = (b, upTo) => {
    b.root.setAttribute('data-down', '1'); seek(b, 0)                                       // the killing blow
    document.head.appendChild(parts); b.root.setAttribute('data-moment', 'ko'); seek(b, K.delay) // the cinematic
    if (upTo < end) { seek(b, upTo); return }
    seek(b, end - 1)
    b.root.removeAttribute('data-moment'); parts.remove(); seek(b, end)                     // the moment ends
    seek(b, upTo)
  }
  const P = `lg-${motif}-`
  const named = (e) => [...e.classList].find((c) => c.startsWith(P))
  // every named part: its own move (corners of its box through its transform relative to the nearest named part
  // above it, read in that parent's frame at the first snapshot), opacity and whether it is shown
  const snap = (b, base) => {
    const { svg, art } = b
    const toArt = (e) => { const m = e.getScreenCTM(); const a = art.getBoundingClientRect(); return m ? new DOMMatrix([m.a, m.b, m.c, m.d, m.e - a.left, m.f - a.top]) : null }
    const unit = (svg.viewBox.baseVal.width || 120) / art.getBoundingClientRect().width
    const out = new Map()
    for (const g of svg.querySelectorAll('g')) {
      const name = named(g); if (!name) continue
      let par = g.parentElement; while (par && par !== svg && !named(par)) par = par.parentElement
      const cs = getComputedStyle(g)
      let pe = 1; for (let e = g.parentElement; e && e !== svg.parentElement; e = e.parentElement) pe *= parseFloat(getComputedStyle(e).opacity) // what the parents let through
      const r = g.getBoundingClientRect()
      const shown = cs.display !== 'none' && r.width + r.height > 0 && !g.closest('[style*="display: none"]')
      let bb = null; try { bb = g.getBBox() } catch { /* not rendered */ }
      const mg = toArt(g), mp = toArt(par || svg)
      const rel = mg && mp ? mp.inverse().multiply(mg) : null
      out.set(g, { name: name.slice(P.length), par: par && par !== svg ? named(par).slice(P.length) : '', shown, op: parseFloat(cs.opacity), pe, bb, rel, mp, unit })
    }
    if (!base) return out
    const res = []
    for (const [g, s] of out) {
      const a = base.get(g); if (!a) continue
      if (a.shown !== s.shown) { res.push({ part: a.name, par: a.par, kind: s.shown ? 'appears' : 'vanishes', v: 99 }); continue }
      if (!a.shown) continue
      // a part nobody can see (faded out with its parent, or itself, in both pictures) may go where it likes
      const dop = Math.abs(a.op - s.op)
      if (dop > OP_TOL && Math.max(a.pe, s.pe) > 0.05) res.push({ part: a.name, par: a.par, kind: 'opacity', v: dop, from: a.op, to: s.op })
      if (Math.max(a.op * a.pe, s.op * s.pe) > 0.05 && a.bb && a.rel && s.rel && a.mp && (a.bb.width + a.bb.height) > 0) {
        const { x, y, width: w, height: h } = a.bb
        let d = 0
        for (const [cx, cy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) {
          const p1 = new DOMPoint(cx, cy).matrixTransform(a.rel).matrixTransform(a.mp), p2 = new DOMPoint(cx, cy).matrixTransform(s.rel).matrixTransform(a.mp)
          d = Math.max(d, Math.hypot(p1.x - p2.x, p1.y - p2.y) * a.unit)
        }
        if (d > POS_TOL) res.push({ part: a.name, par: a.par, kind: 'moves', v: d })
      }
    }
    return res
  }
  if (sheet) {
    // the strike layer's css is page-wide: play the held boxes first, the last cinematic frame (which needs it) last
    ;[...boxes.keys()].reverse().forEach((i) => {
      const b = boxes[i]
      play(b, stamps[i])
      const lab = document.createElement('div'); lab.textContent = i ? `held +${LATER[i - 1]} ms` : `last ko frame (${end - 1} ms)`
      lab.style.cssText = `position:absolute;left:0;top:-${HEADROOM * 100 + 9}%;font:12px monospace;color:#9ab;white-space:nowrap`; b.root.appendChild(lab)
      const fr = document.createElement('div'); fr.style.cssText = `position:absolute;inset:-${HEADROOM * 100}%;outline:1px dashed #f55;pointer-events:none`; b.root.appendChild(fr)
    })
    boxes.slice(1).forEach((b, i) => seek(b, stamps[i + 1])) // anything the css re-added on a held box: paused
    return null
  }
  const b = boxes[0]
  play(b, end - 1)
  const base = snap(b)
  const found = []
  b.root.removeAttribute('data-moment'); parts.remove(); seek(b, end)
  for (const d of LATER) { seek(b, end + d); for (const r of snap(b, base)) found.push({ ...r, at: d }) }
  host.remove(); document.getElementById('ko-ab-css')?.remove()
  // worst per part
  const by = new Map(); for (const f of found) { const k = f.part + f.kind; if (!by.has(k) || by.get(k).v < f.v) by.set(k, f) }
  return { end, jumps: [...by.values()].sort((x, y) => y.v - x.v) }
}, { motif, phase, BOX, HEADROOM, POS_TOL, OP_TOL, LATER, sheet }))

const motifs = ONLY.length ? [...new Set(ONLY)] : await retry(() => page.evaluate(() => window.__ko.RAID_MOTIFS))
const fails = [], table = {}
for (const motif of motifs) {
  table[motif] = { phases: [], parts: 0, worst: 0 }
  for (const phase of (process.env.KO_PHASE ? [Number(process.env.KO_PHASE)] : [1, 2, 3])) {
    const { end, jumps } = await measure(motif, phase, false)
    if (process.env.KO_VERBOSE) for (const j of jumps) console.log(`  ${motif} p${phase} ${j.part}${j.par ? ` (in ${j.par})` : ''} ${j.kind} ${j.v.toFixed(2)} at +${j.at}`)
    if (!jumps.length) continue
    table[motif].phases.push(phase); table[motif].parts += jumps.length; table[motif].worst = Math.max(table[motif].worst, jumps[0].v === 99 ? 0 : jumps[0].v)
    const list = jumps.slice(0, 8).map((j) => `${j.part} ${j.kind === 'moves' ? `moves ${j.v.toFixed(1)}` : j.kind === 'opacity' ? `opacity ${j.from.toFixed(2)}->${j.to.toFixed(2)}` : j.kind} (+${j.at} ms)`).join(', ')
    fails.push(`ko     ${motif} p${phase}: ${jumps.length} part(s) jump when the knockout ends at ${end} ms: ${list}${jumps.length > 8 ? ', ...' : ''}`)
    if (SHEET) {
      fs.mkdirSync(SHEET, { recursive: true })
      await measure(motif, phase, true)
      await page.waitForTimeout(150)
      await page.locator('#ko-host').screenshot({ path: path.join(SHEET, `${motif}-p${phase}-ko-hold.png`) })
      await page.evaluate(() => { document.getElementById('ko-host')?.remove(); document.getElementById('ko-parts-css')?.remove(); document.getElementById('ko-ab-css')?.remove() })
    }
  }
}
// FRAME: where the held fallen boss ends up IN THE REAL ARENA (a reviewer saw the Horseman's held knockout end below the
// arena card's bottom border: the ko body move plus the drawing's own drop took him off the card, only the skull read,
// and nothing popped). The real BossArena (dev/raid-impact ?arena=, knocked out after mount; a fallen boss always
// shows its LAST phase) plays its knockout, then, held, the boss's painted pixels are found by screenshots with the
// drawing hidden and shown (the DEFEATED tag hidden for the total, shown for what still reads). FAILS when more than
// FRAME_LOST of the figure's pixels are LOST (outside the card's own box, or under the tag), or more than FRAME_TAG
// under the tag alone. Calibrated 2026-10-11 on all 27: the reviewer's Horseman (compact arena, only the skull reads)
// loses 64%; the most any accepted boss loses is 48% (leviathan compact; the hydra 46%, its tilted backdrop 22% under
// the card edge, so "outside" alone at 15% failed it while it reads fine).
const FRAME_LOST = 0.55
const FRAME_TAG = 0.5
if (!process.env.KO_PHASE && !process.env.KO_NOFRAME) {
  const sharp = (await import(pathToFileURL(path.join(ROOT, 'node_modules/sharp/dist/index.cjs')).href)).default
  const ARENA_URL = URL.replace(/\/dev\/legends-gallery\/?$/, '/dev/raid-impact/')
  // BOTH arena layouts: the full one, and the COMPACT one a window under ARENA_COMPACT_BELOW (900) px tall shows (the
  // reviewer's Horseman dropped off the compact card; on the full one he stayed in)
  const LAYOUTS = [['full', 1000], ['compact', 700]]
  const koMax = await page.evaluate((ms) => Math.max(...ms.map((m) => window.__ko.koMs(m))), motifs).catch(() => 2600)
  for (const [layout, vh] of LAYOUTS) {
    const fp = await browser.newPage({ viewport: { width: 1000, height: vh } })
    await fp.route('**/api/**', (r) => (r.request().method() === 'GET' ? r.continue() : r.fulfill({ status: 204, body: '' })))
    await fp.route('**/@vite/client', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: 'export const createHotContext = () => ({ accept(){}, dispose(){}, prune(){}, invalidate(){}, on(){}, off(){}, send(){}, data: {} }); export const injectQuery = (u) => u; export const updateStyle = (id, css) => { let s = document.querySelector(`style[data-vite-dev-id="${id}"]`); if (!s) { s = document.createElement("style"); s.setAttribute("data-vite-dev-id", id); document.head.appendChild(s) } s.textContent = css }; export const removeStyle = () => {};' }))
    for (const [u, body, type] of overrides) await fp.route(u, (r) => r.fulfill({ status: 200, contentType: type || 'application/javascript', body }))
    const pixels = async (clip) => { const { data, info } = await sharp(await fp.screenshot({ clip, animations: 'allow' })).raw().toBuffer({ resolveWithObject: true }); return { data, w: info.width, h: info.height, ch: info.channels } }
    for (let i = 0; i < motifs.length; i += 9) {
      const batch = motifs.slice(i, i + 9)
      await fp.goto(`${ARENA_URL}?arena=${batch.join(',')}`, { waitUntil: 'networkidle' })
      await fp.waitForFunction((n) => document.querySelectorAll('[data-arena="fx"] [data-lg-art] svg').length >= n, batch.length, { timeout: 30000 })
      await fp.evaluate(() => window.replay()) // every knockout from the same moment
      await fp.waitForTimeout(100 + koMax + 250 + 1500)
      for (let k = 0; k < batch.length; k++) {
        // this card on screen, 150 px from the top: rects and the clip in viewport pixels
        const b = await fp.evaluate((k) => {
          const card = document.querySelectorAll('[data-arena="fx"]')[k].querySelector('[data-motif]')
          window.scrollTo(0, card.getBoundingClientRect().top + scrollY - 150)
          const r = card.getBoundingClientRect(); const bw = parseFloat(getComputedStyle(card).borderTopWidth) || 0
          return { motif: card.dataset.motif, card: { l: r.left + bw, t: r.top + bw, r: r.right - bw, b: r.bottom - bw } }
        }, k)
        const M = 140
        const clip = { x: Math.max(0, b.card.l - M), y: Math.max(0, b.card.t - M), width: Math.min(1000, b.card.r + M) - Math.max(0, b.card.l - M), height: Math.min(vh, b.card.b + M) - Math.max(0, b.card.t - M) }
        const vis = (sel, v) => fp.evaluate(({ k, sel, v }) => { const cell = document.querySelectorAll('[data-arena="fx"]')[k]; for (const e of cell.querySelectorAll(sel)) e.style.visibility = v }, { k, sel, v })
        const shot = async (art, tag) => { await vis('[data-lg-art] > *', art ? '' : 'hidden'); await vis('[data-ko-tag]', tag ? '' : 'hidden'); await fp.waitForTimeout(60); return pixels(clip) }
        const all = await shot(true, false), none = await shot(false, false), seen = await shot(true, true), bare = await shot(false, true)
        await shot(true, true)
        const diff = (A, B, idx) => { let s = 0; for (let c = 0; c < 3; c++) s += Math.abs(A.data[idx + c] - B.data[idx + c]); return s > 24 }
        let total = 0, outside = 0, readable = 0, kept = 0; const sides = { left: 0, top: 0, right: 0, bottom: 0 }
        for (let y = 0; y < all.h; y++) for (let x = 0; x < all.w; x++) {
          const idx = (y * all.w + x) * all.ch
          if (!diff(all, none, idx)) continue
          total++
          const reads = diff(seen, bare, idx); if (reads) readable++
          const X = clip.x + x, Y = clip.y + y
          if (reads && X >= b.card.l && X <= b.card.r && Y >= b.card.t && Y <= b.card.b) kept++
          if (X < b.card.l || X > b.card.r || Y < b.card.t || Y > b.card.b) { outside++; const d = { left: b.card.l - X, right: X - b.card.r, top: b.card.t - Y, bottom: Y - b.card.b }; sides[Object.entries(d).sort((p, q) => q[1] - p[1])[0][0]]++ }
        }
        const out = total ? outside / total : 0, under = total ? 1 - readable / total : 1, lost = total ? 1 - kept / total : 1
        const side = Object.entries(sides).sort((p, q) => q[1] - p[1])[0][0]
        const row = (table[b.motif] ||= { phases: [], parts: 0, worst: 0 }); row[layout] = { out: +out.toFixed(3), side, underTag: +under.toFixed(3), lost: +lost.toFixed(3), px: total }
        if (process.env.KO_VERBOSE) console.log(`  ${b.motif} ${layout} arena: ${(out * 100).toFixed(1)}% outside the card (${side}), ${(under * 100).toFixed(1)}% under the tag, ${(lost * 100).toFixed(1)}% lost, ${total} px`)
        const why = []
        if (!total) why.push('no painted pixels found')
        if (lost > FRAME_LOST) why.push(`${(lost * 100).toFixed(0)}% of the figure is lost: ${(out * 100).toFixed(0)}% outside the arena card (mostly ${side}), ${(under * 100).toFixed(0)}% under the DEFEATED tag`)
        if (under > FRAME_TAG) why.push(`${(under * 100).toFixed(0)}% of the figure is under the DEFEATED tag`)
        if (why.length) fails.push(`ko     ${b.motif} held knockout in the ${layout} arena: ${why.join('; ')}`)
        if (SHEET && (why.length || process.env.KO_SHEET_ALL)) { fs.mkdirSync(SHEET, { recursive: true }); await fp.screenshot({ clip, path: path.join(SHEET, `${b.motif}-ko-frame-${layout}.png`) }) }
      }
    }
    await fp.close()
  }
}
await browser.close()
if (process.env.KO_TABLE) fs.writeFileSync(process.env.KO_TABLE, JSON.stringify(table, null, 1))
for (const f of fails) console.log('FAIL  ', f)
console.log(`${fails.length} ko hold failure(s), ${((Date.now() - t0) / 1000).toFixed(0)} s`)
process.exit(fails.length ? 1 : 0)
