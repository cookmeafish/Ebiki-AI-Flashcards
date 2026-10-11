// Legends art check: run it with the dev server up, before committing any change to public/assets/legends.
//   node dev/legends-gallery/check-art.mjs          (EBIKI_ONLY=raids/titan,hydra checks just those drawings)
// Needs Chrome/Edge and playwright-core in ~/.ebiki-drive (`npm run drive` installs it once).
// It measures every drawing the way the app plays it (sanitized, idle motion) and FAILS on:
//   frame   a boss or raid boss part that moves past its frame + the renderer's headroom (art.jsx BOSS_HEADROOM):
//           it is sliced flat there, the "invisible box" a flame hit
//   clip    any other visible part of ANY raid boss (static ones too) drawn past frame + headroom: sliced flat all the
//           time (judged on the real outline, never the rotated bounding box; approved backgrounds in CLIP_REVIEWED)
//   drift   an idle scale / skew whose part slides instead of pulsing or swinging in place (a pivot on the
//           picture's corner: give the part transform-box:fill-box + transform-origin)
//   joint   a raid boss's head that leaves its neck / body in any fight animation (check-joints.mjs, run at the end in
//           its own browser: strict for the bosses its STRICT lists, one warning per boss for the rest)
// and WARNS on banner parts cut by the picture's edge mid-motion (often fine: a spotlight running off the edge).
import fs from 'fs'
import os from 'os'
import path from 'path'
import { pathToFileURL } from 'url'
const DEPS = process.env.EBIKI_DRIVE_DEPS || path.join(os.homedir(), '.ebiki-drive')
const pw = path.join(DEPS, 'node_modules', 'playwright-core', 'index.mjs')
if (!fs.existsSync(pw)) { console.error('playwright-core is missing: run `npm run drive` once to install it.'); process.exit(2) }
const { chromium } = await import(pathToFileURL(pw).href)
// Playwright's bundled Chromium only (npm run drive installs it): the installed Chrome locked the owner's Windows account.
const URL = process.env.EBIKI_URL || 'http://localhost:3001/dev/legends-gallery/'
const HEADROOM = 0.2   // keep equal to art.jsx BOSS_HEADROOM
const DRIFT = 5        // units a part's centre may travel under an idle scale / skew
const browser = await chromium.launch({ headless: true, args: ['--mute-audio'] }) // never pass executablePath; muted
const page = await browser.newPage()
// No hot reload in a check run: another artist saving a file reloaded the page mid-check ("Execution context was
// destroyed"). The stub keeps Vite's client API so modules still load; CSS updates still apply.
await page.route('**/@vite/client', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: 'export const createHotContext = () => ({ accept(){}, dispose(){}, prune(){}, invalidate(){}, on(){}, off(){}, send(){}, data: {} }); export const injectQuery = (u) => u; export const updateStyle = (id, css) => { let s = document.querySelector(`style[data-vite-dev-id="${id}"]`); if (!s) { s = document.createElement("style"); s.setAttribute("data-vite-dev-id", id); document.head.appendChild(s) } s.textContent = css }; export const removeStyle = () => {};' }))
await page.goto(URL, { waitUntil: 'networkidle' })
// CLIP fails for EVERY raid boss (the owner, 2026-10-10: "the edges should not cut off the boss"; a Titan cut flat at
// the top in all three phases was found this way, and every older raid was then fixed to stay inside).
// Clips an eye has reviewed and the owner approved: an approved BACKGROUND may run to the box edge (the owner,
// 2026-10-10: the Rat King's backdrops are "simple and easy to look at"). "<file>|<start of the element's markup>".
const CLIP_REVIEWED = [
  'raids/ratking.svg|<path d="M-24 144 V20 C-24 -12 20 -26 60 -26', // the phase 2 casino backdrop arch
]
// EBIKI_ONLY=titan,raids/hydra checks just those drawings (quicker while fixing one)
const ONLY = (process.env.EBIKI_ONLY || '').split(',').filter(Boolean)
const res = await page.evaluate(async ({ HEADROOM, DRIFT, CLIP_REVIEWED, ONLY }) => {
  const { MOTIFS } = await import('/src/features/legends/map.js')
  const { RAID_MOTIFS } = await import('/src/features/legends/raid.js')
  const { sanitizeHtml } = await import('/src/components/Markdown.jsx')
  const { withMotion } = await import('/src/features/legends/art.jsx')
  const fails = [], warns = []
  const host = document.createElement('div'); host.style.cssText = 'position:absolute;left:0;top:0'; document.body.prepend(host)
  const own = (e, re) => [...e.children].some((c) => c.tagName === 'animateTransform' && re.test(c.getAttribute('type')))
  const pts = (a) => (a.getAttribute('values') || '').split(';').map((v) => v.trim().split(/[\s,]+/).map(Number))
  // a traveller (a bat crossing the moon, a tumbleweed) is MEANT to leave the frame
  const travels = (sh, span) => { for (let e = sh; e; e = e.parentElement) for (const a of e.children || []) if (a.tagName === 'animateTransform' && a.getAttribute('type') === 'translate' && Math.max(...pts(a).map((p) => Math.hypot(p[0] || 0, p[1] || 0))) >= span) return true; return false }
  // a flash or flick that collapses to (nearly) nothing on purpose (lightning, a tongue) is not a pivot slip
  const collapses = (e) => [...e.children].some((a) => a.tagName === 'animateTransform' && /scale/.test(a.getAttribute('type')) && pts(a).some((p) => p.some((x) => Math.abs(x) < 0.3)))
  // How far a shape's REAL outline (plus half its stroke) reaches past box b, in px. getBoundingClientRect is the
  // box of the transformed bounding box: a rotating gear or a tilted ladle reported its rotated corners (up to 41%
  // too far), a clip nothing on screen showed. Called only when the cheap box already says "past".
  const outlinePts = new WeakMap()
  const outline = (sh, b) => {
    const m = sh.getScreenCTM(); if (!m) return null
    let pts = outlinePts.get(sh)
    if (!pts) {
      const len = sh.getTotalLength ? sh.getTotalLength() : 0
      if (!(len > 0)) return null
      const n = Math.min(1500, Math.max(48, Math.ceil(len * 2)))
      pts = []; for (let k = 0; k <= n; k++) { const p = sh.getPointAtLength((len * k) / n); pts.push(p.x, p.y) }
      outlinePts.set(sh, pts)
    }
    let l = Infinity, t = Infinity, r = -Infinity, bo = -Infinity
    for (let k = 0; k < pts.length; k += 2) { const x = m.a * pts[k] + m.c * pts[k + 1] + m.e, y = m.b * pts[k] + m.d * pts[k + 1] + m.f; if (x < l) l = x; if (x > r) r = x; if (y < t) t = y; if (y > bo) bo = y }
    const cs = getComputedStyle(sh)
    const sw = cs.stroke !== 'none' ? (parseFloat(cs.strokeWidth) || 0) / 2 * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) : 0
    return Math.max(0, b.left - (l - sw), b.top - (t - sw), (r + sw) - b.right, (bo + sw) - b.bottom)
  }
  for (const kind of ['bosses', 'raids', 'areas']) for (const motif of kind === 'raids' ? RAID_MOTIFS : MOTIFS) {
    if (ONLY.length && !ONLY.includes(`${kind}/${motif}`) && !ONLY.includes(motif)) continue
    const file = `${kind}/${motif}.svg`
    host.innerHTML = withMotion(sanitizeHtml(await (await fetch(`/assets/legends/${file}`)).text(), { USE_PROFILES: { svg: true } }), 'idle')
    const svg = host.querySelector('svg')
    for (const el of svg.querySelectorAll('[style*="display:none"]')) el.style.display = 'inline' // raid phase layers
    const vb = svg.viewBox.baseVal, S = 4
    svg.setAttribute('width', vb.width * S); svg.setAttribute('height', vb.height * S)
    svg.pauseAnimations()
    // Long loops (a ring spinning once in 220 s, a vortex in 120 s) reach their extremes long after 8 s: sample their
    // whole period too (the ophanim's rings and the hydra's vortex were cut only late in the spin).
    const longest = Math.min(300, Math.max(8, ...[...svg.querySelectorAll('animateTransform,animateMotion')].map((a) => parseFloat(a.getAttribute('dur')) || 0)))
    const late = []; if (longest > 8) for (let k = 1; k <= 48; k++) late.push(8 + ((longest - 8) * k) / 48)
    const frameTimes = [...Array(81).keys()].map((k) => k / 10).concat(late)
    const clipTimes = [...Array(17).keys()].map((k) => k / 2).concat(late)
    const figure = kind !== 'areas'
    const pad = figure ? HEADROOM * Math.min(vb.width, vb.height) : 0
    // FRAME: shapes under a scale / skew / rotate loop that sit inside at some moment and past the edge at another
    const shapes = [...svg.querySelectorAll('path,circle,ellipse,rect,polygon,polyline,line')]
      .filter((sh) => { for (let e = sh; e && e !== svg; e = e.parentElement) if (own(e, /scale|skew|rotate/)) return !travels(sh, Math.min(vb.width, vb.height) / 2); return false })
      // a rotating circle reports its rotated corner box: judge circles by their centre + radius instead
    const stats = shapes.map(() => ({ min: Infinity, max: 0, t: 0 }))
    // DRIFT: elements with their own scale / skew loop and no transform-box pivot
    const drifters = [...svg.querySelectorAll('*')].filter((e) => own(e, /scale|skew/) && !collapses(e) && !/transform-box/.test(e.getAttribute('style') || ''))
    const dstats = drifters.map(() => 0)
    for (const t of frameTimes) {
      svg.setCurrentTime(t)
      const b = svg.getBoundingClientRect()
      shapes.forEach((sh, i) => {
        let q
        if (sh.tagName === 'circle') {
          const m = sh.getScreenCTM(), r = sh.r.baseVal.value * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c))
          const c = new DOMPoint(sh.cx.baseVal.value, sh.cy.baseVal.value).matrixTransform(m)
          q = { l: c.x - r, t: c.y - r, r: c.x + r, b: c.y + r }
        } else { const r = sh.getBoundingClientRect(); q = { l: r.left, t: r.top, r: r.right, b: r.bottom } }
        if (!(q.r > q.l)) return
        let o = Math.max(0, (b.left - q.l) / S, (b.top - q.t) / S, (q.r - b.right) / S, (q.b - b.bottom) / S)
        if (o > 0 && sh.tagName !== 'circle') { const px = outline(sh, b); if (px != null) o = Math.min(o, px / S) }
        const s = stats[i]
        if (o < s.min) s.min = o
        if (o > s.max) { s.max = o; s.t = t }
      })
      drifters.forEach((e, i) => {
        const bb = e.getBBox(); const cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2
        let m = svg.createSVGMatrix(); const list = e.transform.animVal
        for (let k = 0; k < list.numberOfItems; k++) m = m.multiply(list.getItem(k).matrix)
        if (Math.abs(m.a * m.d - m.b * m.c) < 0.05) return
        dstats[i] = Math.max(dstats[i], Math.hypot(m.a * cx + m.c * cy - cx, m.b * cx + m.d * cy - cy))
      })
    }
    // CLIP: every other visible part of a figure (static ones too) must stay inside frame + headroom; the frame check
    // above only sees looping parts that are inside at some moment (a Banshee phase 3 shipped organ-pipe caps sliced
    // flat on the clip line, drawn there all the time). Travellers are allowed to leave.
    // Raid bosses only: older Legends bosses run backdrops off the frame on purpose.
    if (kind === 'raids') {
      const looped = new Set(shapes)
      const rest = [...svg.querySelectorAll('path,circle,ellipse,rect,polygon,polyline,line')]
        .filter((sh) => !looped.has(sh) && !travels(sh, Math.min(vb.width, vb.height) / 2))
      const worst = rest.map(() => ({ o: 0, t: 0 }))
      for (const t of clipTimes) {
        svg.setCurrentTime(t)
        const b = svg.getBoundingClientRect()
        rest.forEach((sh, i) => {
          const cs = getComputedStyle(sh)
          if (cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return
          if (cs.fill === 'none' && cs.stroke === 'none') return
          const r = sh.getBoundingClientRect(); if (!(r.right > r.left)) return
          let o = Math.max(0, (b.left - r.left) / S, (b.top - r.top) / S, (r.right - b.right) / S, (r.bottom - b.bottom) / S)
          if (o > pad + 0.5) { const px = outline(sh, b); if (px != null) o = Math.min(o, px / S) }
          if (o > worst[i].o) worst[i] = { o, t }
        })
      }
      const seen = new Set()
      rest.forEach((sh, i) => { if (CLIP_REVIEWED.some((r) => r.startsWith(file + '|') && sh.outerHTML.startsWith(r.slice(file.length + 1)))) return; if (worst[i].o > pad + 0.5 && !seen.has(sh) && seen.add(sh)) fails.push(`clip   ${file}: ${sh.tagName} sits ${worst[i].o.toFixed(1)} past the frame (headroom ${pad.toFixed(1)}) at ${worst[i].t}s: ${sh.outerHTML.slice(0, 70)}`) })
    }
    shapes.forEach((sh, i) => {
      const s = stats[i]
      // a looping part that is never fully inside but reaches past the headroom is sliced all the time: a clip
      // (Kaleido's swaying phase 2 crystal blades were missed this way)
      if (kind === 'raids' && s.min > 0.01 && s.max > pad + 0.5) { fails.push(`clip   ${file}: ${sh.tagName} (looping) reaches ${s.max.toFixed(1)} past the frame (headroom ${pad.toFixed(1)}) at ${s.t.toFixed(1)}s: ${sh.outerHTML.slice(0, 70)}`); return }
      if (s.min > 0.01 || s.max <= 0.5) return
      const msg = `${file}: ${sh.tagName} goes ${s.max.toFixed(1)} past the frame at ${s.t.toFixed(1)}s: ${sh.outerHTML.slice(0, 70)}`
      if (figure) { if (s.max > pad) fails.push('frame  ' + msg) } else warns.push('edge   ' + msg)
    })
    drifters.forEach((e, i) => { if (dstats[i] > DRIFT) fails.push(`drift  ${file}: ${e.tagName} slides ${dstats[i].toFixed(1)} units: ${e.outerHTML.slice(0, 70)}`) })
  }
  return { fails, warns }
}, { HEADROOM, DRIFT, CLIP_REVIEWED, ONLY })

// Overdraw hits an eye has reviewed and kept on purpose (branches, antlers, legs, reeds, fence posts, fur tufts,
// a necklace, cloak folds): "<file>|<start of the stroke's d>". Add one only after looking at it.
const REVIEWED = new Set([
  "raids/horseman.svg|M60 74C50 86 6.82 51.03 ", // the rein runs from his fist over the coat to the bit
  'raids/ratking.svg|<circle cx="45.4" cy="-1', // the gold earrings hang off the ear
  "raids/chronos.svg|M5.6 -3.75 L8.6 -3.6 L11", // the gauntlet fingers drum out past the palm
  "raids/chronos.svg|M5.6 -1.25 L8.6 -1.1 L11", // the gauntlet fingers drum out past the palm
  "raids/chronos.svg|M5.6 1.25 L8.6 1.4 L11 1", // the gauntlet fingers drum out past the palm
  "raids/chronos.svg|M5.6 3.75 L8.6 3.9 L11 4", // the gauntlet fingers drum out past the palm
  "raids/ophanim.svg|M-49.12 0A49.12 21.12 0 ", // the wheel rings pass in front of the body
  "raids/ophanim.svg|M-49.2 0A49.2 21.2 0 0 1", // the wheel rings pass in front of the body
  "raids/ophanim.svg|M-50.23 0A50.23 21.23 0 ", // the wheel rings pass in front of the body
  "raids/ophanim.svg|M-49.82 0A49.82 20.82 0 ", // the wheel rings pass in front of the body
  "raids/ophanim.svg|M-49.74 0A49.74 20.74 0 ", // the wheel rings pass in front of the body
  "raids/ophanim.svg|M-50.07 0A50.07 21.07 0 ", // the wheel rings pass in front of the body
  "raids/ophanim.svg|M-50.56 0A50.56 21.56 0 ", // the wheel rings pass in front of the body
  "raids/ophanim.svg|M-50.89 0A50.89 21.89 0 ", // the wheel rings pass in front of the body
  "raids/ophanim.svg|M-45.97 0A45.97 16.97 0 ", // the wheel rings pass in front of the body
  "raids/ophanim.svg|M-45.15 0A45.15 16.15 0 ", // the wheel rings pass in front of the body
  "raids/ophanim.svg|M-53.02 0A53.02 24.02 0 ", // the wheel rings pass in front of the body
  "raids/ophanim.svg|M-53.1 0A53.1 24.1 0 0 0", // the wheel rings pass in front of the body
  "raids/ophanim.svg|M-44.9 0A44.9 15.9 0 0 0", // the wheel rings pass in front of the body
  "raids/hydra.svg|M14 -4 L10 10 L16 12 L8 ", // lightning forks out of the storm clouds
  "raids/hydra.svg|M108 -4 L112 8 L106 10 L",
  "raids/seraph.svg|M5 -1.6 L14.6 -4.7 L23.3", // bone fingers reach out of the clawed palms
  "raids/seraph.svg|M5.1 1.3 L14.9 3.7 L22.4",
  "raids/seraph.svg|M2.1 2 L6.1 5.9 L8.5 10",
  "raids/seraph.svg|M1.9 -2.2 L5.5 -6.5 L9.4",
  "raids/reaper.svg|M116.2 53.4L118.6 53.6L1", // a finger of the lantern hand hangs past the robe
  "raids/void.svg|M-47 0 A47 47 0 0 0 47 0", // the near half of the accretion disk passes in front of the body
  "raids/void.svg|M-52.6 0 A52.6 52.6 0 0 ", // the near half of the disk's hot band, in front of the body
  "raids/void.svg|M-30 36 A47 47 0 0 1 -46", // a turning violet streak on the back half of the disk
  "areas/swamp.svg|M384 124 C384 110 388 10",
  "areas/swamp.svg|M8 126 C8 112 4 104 6 94",
  "areas/manor.svg|M56 112 V96",
  "areas/manor.svg|M68 112 V96",
  "areas/manor.svg|M332 112 V96",
  "areas/manor.svg|M344 112 V96",
  "areas/primeval.svg|M352 126 C352 114 356 10",
  "bosses/stage.svg|M22 66 C24 84 28 100 30 ",
  "bosses/stage.svg|M98 66 C96 84 92 100 90 ",
  "bosses/volcano.svg|M26 84 H38",
  "bosses/volcano.svg|M29 76 H40",
  "bosses/underworld.svg|M50 70 C50 76 52 78 52 7",
  "bosses/moonlit.svg|M18 50 l-3 2",
  "bosses/moonlit.svg|M22 58 l-3 3",
  "bosses/hive.svg|M44 74 L28 80 L22 94",
  "bosses/hive.svg|M76 74 L92 80 L98 94",
  "bosses/dream.svg|M4 70 L60 50 L116 70",
  "bosses/dream.svg|M26 28 C40 34 80 34 94 2",
  "bosses/sakura.svg|M40 88 C50 96 70 96 80 8",
  "raids/hydra.svg|M30 104 C40 96 80 96 90 ",
  "raids/hydra.svg|M24 98 C44 90 78 90 98 9"
])

// OVERDRAW ("drawn past the lines"): a decorative stroke (fill none) that lies on a filled shape for most of its
// length but whose END leaves the fill (rock strata past a mesa's slanted edge, finger lines wider than the hand).
// Reported as warnings: a branch or a leg leaving its trunk or body is meant to, so every hit needs an eye. Still
// pose; one path's separate strokes ("M0 50 H30 M0 70 H70") are judged one by one; the picture's border is a fair end.
const over = await page.evaluate(async (ONLY) => {
  const { MOTIFS } = await import('/src/features/legends/map.js')
  const { RAID_MOTIFS } = await import('/src/features/legends/raid.js')
  const { sanitizeHtml } = await import('/src/components/Markdown.jsx')
  const { withMotion } = await import('/src/features/legends/art.jsx')
  const out = []
  const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0'; document.body.prepend(host)
  for (const kind of ['areas', 'bosses', 'raids']) for (const motif of kind === 'raids' ? RAID_MOTIFS : MOTIFS) {
    if (ONLY.length && !ONLY.includes(`${kind}/${motif}`) && !ONLY.includes(motif)) continue
    const file = `${kind}/${motif}.svg`
    host.innerHTML = withMotion(sanitizeHtml(await (await fetch(`/assets/legends/${file}`)).text(), { USE_PROFILES: { svg: true } }), false)
    const svg = host.querySelector('svg'); const vb = svg.viewBox.baseVal
    const cs = (e) => getComputedStyle(e)
    const all = [...svg.querySelectorAll('path,line,polyline,rect,circle,ellipse,polygon')].filter((e) => !e.closest('[style*="display:none"]'))
    const isLine = (e) => cs(e).fill === 'none' && cs(e).stroke !== 'none'
    const toRoot = (e) => svg.getScreenCTM().inverse().multiply(e.getScreenCTM())
    const box = (e) => { const b = e.getBBox(), m = toRoot(e); const p = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(m)); return { l: Math.min(...p.map((q) => q.x)), r: Math.max(...p.map((q) => q.x)), t: Math.min(...p.map((q) => q.y)), b: Math.max(...p.map((q) => q.y)) } }
    const shapes = all.filter((e) => !isLine(e) && cs(e).fill !== 'none' && parseFloat(cs(e).fillOpacity || 1) > 0.3 && parseFloat(cs(e).opacity || 1) > 0.3)
      .map((e) => ({ e, b: box(e), inv: toRoot(e).inverse() }))
      .filter((s) => !(s.b.r - s.b.l >= vb.width * 0.98 && s.b.b - s.b.t >= vb.height * 0.98))
    const inAny = (x, y) => shapes.some((s) => x >= s.b.l && x <= s.b.r && y >= s.b.t && y <= s.b.b && s.e.isPointInFill(new DOMPoint(x, y).matrixTransform(s.inv)))
    const near = (x, y) => [[0, 0], [0.12, 0], [-0.12, 0], [0, 0.12], [0, -0.12]].some(([dx, dy]) => inAny(x + dx, y + dy))
    const pieces = []
    for (const st of all.filter(isLine)) {
      const d = st.getAttribute('d')
      const subs = st.tagName === 'path' && d && !/m/.test(d.slice(1)) ? d.split(/(?=M)/).map((x) => x.trim()).filter(Boolean) : [null]
      if (subs.length < 2) { pieces.push(st); continue }
      for (const sd of subs) { const c = st.cloneNode(false); c.setAttribute('d', sd); st.parentNode.insertBefore(c, st); pieces.push(c) }
    }
    for (const st of pieces) {
      if (!st.getTotalLength) continue
      const len = st.getTotalLength(); if (!(len > 2)) continue
      const m = toRoot(st), n = Math.max(10, Math.min(120, Math.round(len * 2)))
      let good = 0; const bad = []
      for (let i = 0; i <= n; i++) {
        const q = st.getPointAtLength((len * i) / n), p = new DOMPoint(q.x, q.y).matrixTransform(m)
        if (p.x < 1 || p.y < 1 || p.x > vb.width - 1 || p.y > vb.height - 1) continue
        if (near(p.x, p.y)) good++; else bad.push(i / n)
      }
      const total = good + bad.length
      if (total && bad.length && good / total >= 0.6 && bad.every((f) => f <= 0.25 || f >= 0.75)) out.push({ file, d: st.getAttribute('d') || st.outerHTML })
    }
  }
  return out
}, ONLY)
// JOINT: every fight animation of every raid boss, its head against its neck (check-joints.mjs)
{
  const { spawnSync } = await import('child_process')
  const { fileURLToPath } = await import('url')
  // with EBIKI_ONLY, just the raid bosses named (a raid name alone or raids/<name>); none named = no joint run
  const jointOnly = ONLY.filter((o) => !o.includes('/') || o.startsWith('raids/')).map((o) => o.replace(/^raids\//, ''))
  const j = ONLY.length && !jointOnly.length ? { stdout: '', status: 0 } : spawnSync(process.execPath, [path.join(path.dirname(fileURLToPath(import.meta.url)), 'check-joints.mjs'), ...jointOnly], { encoding: 'utf8', maxBuffer: 64 << 20, timeout: 30 * 60 * 1000 })
  const lines = (j.stdout || '').split(/\r?\n/)
  for (const l of lines) { if (l.startsWith('FAIL  ')) res.fails.push(l.slice(6).trim()); else if (l.startsWith('warn  ')) res.warns.push(l.slice(6).trim()) }
  if (j.status !== 0 && !lines.some((l) => l.startsWith('FAIL  '))) res.fails.push('joint  check-joints.mjs did not finish: ' + ((j.stderr || '').trim().split(/\r?\n/).slice(-3).join(' ') || j.error?.message || 'exit ' + j.status))
}
res.warns.push(...over.filter((o) => !REVIEWED.has(`${o.file}|${o.d.slice(0, 24)}`)).map((o) => `overdraw ${o.file}: a line leaves its shape: ${o.d.slice(0, 70)}`))
await browser.close()
for (const w of res.warns) console.log('warn  ', w)
for (const f of res.fails) console.log('FAIL  ', f)
console.log(`${res.fails.length} failure(s), ${res.warns.length} warning(s)`)
process.exit(res.fails.length ? 1 : 0)
