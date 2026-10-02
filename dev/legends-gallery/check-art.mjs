// Legends art check: run it with the dev server up, before committing any change to public/assets/legends.
//   node dev/legends-gallery/check-art.mjs
// Needs Chrome/Edge and playwright-core in ~/.ebiki-drive (`npm run drive` installs it once).
// It measures every drawing the way the app plays it (sanitized, idle motion) and FAILS on:
//   frame   a boss or raid boss part that moves past its frame + the renderer's headroom (art.jsx BOSS_HEADROOM):
//           it is sliced flat there, the "invisible box" a flame hit
//   drift   an idle scale / skew whose part slides instead of pulsing or swinging in place (a pivot on the
//           picture's corner: give the part transform-box:fill-box + transform-origin)
// and WARNS on banner parts cut by the picture's edge mid-motion (often fine: a spotlight running off the edge).
import fs from 'fs'
import os from 'os'
import path from 'path'
import { pathToFileURL } from 'url'
const DEPS = process.env.EBIKI_DRIVE_DEPS || path.join(os.homedir(), '.ebiki-drive')
const pw = path.join(DEPS, 'node_modules', 'playwright-core', 'index.mjs')
if (!fs.existsSync(pw)) { console.error('playwright-core is missing: run `npm run drive` once to install it.'); process.exit(2) }
const { chromium } = await import(pathToFileURL(pw).href)
const CHROME = [process.env.CHROME_BIN, `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => p && fs.existsSync(p))
const URL = process.env.EBIKI_URL || 'http://localhost:3000/dev/legends-gallery/'
const HEADROOM = 0.2   // keep equal to art.jsx BOSS_HEADROOM
const DRIFT = 5        // units a part's centre may travel under an idle scale / skew
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage()
await page.goto(URL, { waitUntil: 'networkidle' })
const res = await page.evaluate(async ({ HEADROOM, DRIFT }) => {
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
  for (const kind of ['bosses', 'raids', 'areas']) for (const motif of kind === 'raids' ? RAID_MOTIFS : MOTIFS) {
    const file = `${kind}/${motif}.svg`
    host.innerHTML = withMotion(sanitizeHtml(await (await fetch(`/assets/legends/${file}`)).text(), { USE_PROFILES: { svg: true } }), 'idle')
    const svg = host.querySelector('svg')
    for (const el of svg.querySelectorAll('[style*="display:none"]')) el.style.display = 'inline' // raid phase layers
    const vb = svg.viewBox.baseVal, S = 4
    svg.setAttribute('width', vb.width * S); svg.setAttribute('height', vb.height * S)
    svg.pauseAnimations()
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
    for (let t = 0; t <= 8; t += 0.1) {
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
        const o = Math.max(0, (b.left - q.l) / S, (b.top - q.t) / S, (q.r - b.right) / S, (q.b - b.bottom) / S)
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
    shapes.forEach((sh, i) => {
      const s = stats[i]
      if (s.min > 0.01 || s.max <= 0.5) return
      const msg = `${file}: ${sh.tagName} goes ${s.max.toFixed(1)} past the frame at ${s.t.toFixed(1)}s: ${sh.outerHTML.slice(0, 70)}`
      if (figure) { if (s.max > pad) fails.push('frame  ' + msg) } else warns.push('edge   ' + msg)
    })
    drifters.forEach((e, i) => { if (dstats[i] > DRIFT) fails.push(`drift  ${file}: ${e.tagName} slides ${dstats[i].toFixed(1)} units: ${e.outerHTML.slice(0, 70)}`) })
  }
  return { fails, warns }
}, { HEADROOM, DRIFT })

// Overdraw hits an eye has reviewed and kept on purpose (branches, antlers, legs, reeds, fence posts, fur tufts,
// a necklace, cloak folds): "<file>|<start of the stroke's d>". Add one only after looking at it.
const REVIEWED = new Set([
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
  "areas/forest.svg|M196 50 L182 28 L168 20",
  "areas/forest.svg|M224 50 L238 28 L252 20",
  "areas/swamp.svg|M384 124 C384 110 388 10",
  "areas/swamp.svg|M8 126 C8 112 4 104 6 94",
  "areas/manor.svg|M56 112 V96",
  "areas/manor.svg|M68 112 V96",
  "areas/manor.svg|M332 112 V96",
  "areas/manor.svg|M344 112 V96",
  "areas/primeval.svg|M352 126 C352 114 356 10",
  "bosses/forest.svg|M44 40 L34 20 L22 12",
  "bosses/forest.svg|M76 40 L86 20 L98 12",
  "bosses/forest.svg|M38 66 C26 70 16 66 10 5",
  "bosses/forest.svg|M82 66 C94 70 104 66 110",
  "bosses/forest.svg|M40 46 C38 56 42 60 40 7",
  "bosses/forest.svg|M80 46 C82 56 78 62 80 7",
  "bosses/forest.svg|M-30 -28 C-32 -38 -30 -4", // an antler tine and the vine winding it run past the leaves on it
  "bosses/forest.svg|M-30 -28 C-29.9 -28.3 -2",
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
const over = await page.evaluate(async () => {
  const { MOTIFS } = await import('/src/features/legends/map.js')
  const { RAID_MOTIFS } = await import('/src/features/legends/raid.js')
  const { sanitizeHtml } = await import('/src/components/Markdown.jsx')
  const { withMotion } = await import('/src/features/legends/art.jsx')
  const out = []
  const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0'; document.body.prepend(host)
  for (const kind of ['areas', 'bosses', 'raids']) for (const motif of kind === 'raids' ? RAID_MOTIFS : MOTIFS) {
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
})
res.warns.push(...over.filter((o) => !REVIEWED.has(`${o.file}|${o.d.slice(0, 24)}`)).map((o) => `overdraw ${o.file}: a line leaves its shape: ${o.d.slice(0, 70)}`))
await browser.close()
for (const w of res.warns) console.log('warn  ', w)
for (const f of res.fails) console.log('FAIL  ', f)
console.log(`${res.fails.length} failure(s), ${res.warns.length} warning(s)`)
process.exit(res.fails.length ? 1 : 0)
