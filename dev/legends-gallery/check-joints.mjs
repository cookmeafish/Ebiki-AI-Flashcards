// Raid boss JOINT check: does the head stay on the neck in every fight animation? Run by check-art.mjs; alone:
//   node dev/legends-gallery/check-joints.mjs                 every raid boss (dev server up)
//   node dev/legends-gallery/check-joints.mjs kitsune --sheet <dir>   also a contact sheet per animation (PNG)
//   JOINTS_VERBOSE=1 every animation's number; JOINTS_PHASE=2 / JOINTS_STATE="moment crit" narrow it
// The owner (2026-10-10): "on some animations of kitsune her head gets dislocated from her body". Every impact moment
// (data-moment), ability effect (data-fx, data-fx-pending), the attack on the player (data-assault-on, alone and with
// its strike and heavy blow) and the knockout hold (data-down) is played in all three phases with the boss's real CSS
// (impact/bosses parts CSS + fx/<motif>.jsx css), frozen every STEP ms. Three probes along the CHIN SEAM (the head's
// lowest drawn point on the neck axis, and 4 units to each side) are followed once through the head's wrappers
// (lg-<motif>-head / face, or -mask for MASK_FACE bosses) and once through the body's (lg-<motif>-body / torso / neck / chest / shoulders, or
// the still figure): each pair must land within MAX_GAP view-box units. A boss with heads but no head wrapper is
// REPORTED as not checked (a warning naming its head classes), never skipped silently. A tilt pivoting on the
// neck passes; a head rotated round a pivot far below it (hers sat on the collar, 18 units under the chin), or
// translated / scaled while the body is not, fails. Hair (lg-<motif>-hair) must follow the head the same way.
// It reads CSS transforms only; the SVG's own idle SMIL is check-art's job.
import fs from 'fs'
import os from 'os'
import path from 'path'
import { pathToFileURL } from 'url'
const DEPS = process.env.EBIKI_DRIVE_DEPS || path.join(os.homedir(), '.ebiki-drive')
const pw = path.join(DEPS, 'node_modules', 'playwright-core', 'index.mjs')
if (!fs.existsSync(pw)) { console.error('playwright-core is missing: run `npm run drive` once to install it.'); process.exit(2) }
const { chromium } = await import(pathToFileURL(pw).href)
const URL = process.env.EBIKI_URL || 'http://localhost:3001/dev/legends-gallery/'
const MAX_GAP = 2.5   // view-box units (of 120) the head's joint may leave the neck: a natural tilt stays under 1
const STEP = 60       // ms between sampled frames
const SPAN = 2600     // ms sampled per animation (the longest knockout is 2.6 s)
// Bosses whose head is MEANT to leave the body, or that have no head on a body to check:
const SKIP = {
  horseman: 'headless: his head is the lantern he throws',
  hydra: 'the heads ride their own necks (lg-hydra-n*), grown and burnt by the ability',
  ophanim: 'an eye in wheels, no head on a body',
  void: 'a face in a black hole, no neck',
}
// FAILS for the bosses checked clean (add a boss here once its art passes); every other boss WARNS with its worst
// moment until its artist fixes it (2026-10-10: 18 bosses part the head from the body somewhere; 2026-10-11, measured
// at the chin seam: banshee and showman pass and joined, seraph's phase 2 crit is 2.6). JOINTS_STRICT=all
// makes every boss fail.
// Bosses whose FACE is a mask (lg-<motif>-mask is the head). Anywhere else a mask is a prop (the kitsune's pushed-up fox
// mask): never measured as the head, so a boss that lost its head wrapper is reported as not checked.
const MASK_FACE = ['puppeteer']
const STRICT = ['kitsune', 'banshee', 'showman']
const args = process.argv.slice(2)
const sheetAt = args.indexOf('--sheet')
const SHEET = sheetAt >= 0 ? args[sheetAt + 1] : ''
const ONLY = args.filter((a, i) => !a.startsWith('--') && !(sheetAt >= 0 && i === sheetAt + 1))

const browser = await chromium.launch({ headless: true, args: ['--mute-audio'] }) // bundled Chromium only, muted
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
// Set up the page: the boss CSS and a helper that renders one boss in an arena-like box. Again after the dev server
// reloads the page (an edit elsewhere): every measurement retries on a fresh page.
// No hot reload: an edit anywhere in src/ reloaded the page mid-measurement.
await page.route('**/@vite/client', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: 'export const createHotContext = () => ({ accept(){}, dispose(){}, prune(){}, invalidate(){}, on(){}, off(){}, send(){}, data: {} }); export const injectQuery = (u) => u; export const updateStyle = (id, css) => { let s = document.querySelector(`style[data-vite-dev-id="${id}"]`); if (!s) { s = document.createElement("style"); s.setAttribute("data-vite-dev-id", id); document.head.appendChild(s) } s.textContent = css }; export const removeStyle = () => {};' }))
const ready = async () => { await page.goto(URL, { waitUntil: 'networkidle' }); await page.evaluate(async () => {
  const { RAID_MOTIFS, RAID_ABILITY } = await import('/src/features/legends/raid.js')
  const { sanitizeHtml } = await import('/src/components/Markdown.jsx')
  const { withMotion } = await import('/src/features/legends/art.jsx')
  const { PARTS_CSS } = await import('/src/features/legends/impact/parts.jsx')
  const { abilityCss } = await import('/src/features/legends/fx/index.js')
  const { abilityById } = await import('/src/features/legends/abilities/index.js')
  const phaseCss = `.lg-boss[data-phase="2"] .lg-p2, .lg-boss[data-phase="3"] .lg-p2, .lg-boss[data-phase="3"] .lg-p3 { display: inline !important }
.lg-boss[data-phase="2"] .lg-p1, .lg-boss[data-phase="3"] .lg-p1, .lg-boss[data-phase="3"] .lg-p12 { display: none !important }`
  const style = document.createElement('style')
  style.textContent = PARTS_CSS + '\n' + phaseCss + '\n' + RAID_MOTIFS.map((m) => abilityCss(RAID_ABILITY[m])).join('\n')
  document.head.appendChild(style)
  const texts = {}
  window.__joints = {
    RAID_MOTIFS,
    fxKeys: (m) => abilityById(RAID_ABILITY[m])?.fxKeys || [],
    async svg(m) { texts[m] ||= withMotion(sanitizeHtml(await (await fetch(`/assets/legends/raids/${m}.svg`, { cache: 'no-store' })).text(), { USE_PROFILES: { svg: true } }), 'idle'); return texts[m] },
  }
}) }
await ready()
const retry = async (fn) => { for (let i = 0; ; i++) { try { return await fn() } catch (e) { if (i >= 3) throw e; await ready() } } }

// The animations played per phase: [name, attributes on the arena root].
const MOMENTS = ['hit', 'crit', 'sharpen', 'hurt', 'hurtBig', 'block', 'shield', 'wind', 'ko']
const statesFor = (fxKeys) => [
  ...MOMENTS.map((m) => [`moment ${m}`, { 'data-moment': m }]),
  ['assault', { 'data-assault-on': '1' }],
  ['assault + strike', { 'data-assault-on': '1', 'data-moment': 'hurt' }],
  ['assault + heavy', { 'data-assault-on': '1', 'data-moment': 'hurtBig' }],
  ['knocked out', { 'data-down': '1' }],
  ...fxKeys.flatMap((k) => [[`fx ${k}`, { 'data-fx': k }], [`fx-pending ${k}`, { 'data-fx-pending': k }]]),
]

const measure = (motif, states, phase, sheet) => retry(() => page.evaluate(async ({ motif, states, phase, STEP, SPAN, sheet, maskFace }) => {
  const J = window.__joints
  const markup = await J.svg(motif)
  const cls = (re) => (e) => [...e.classList].some((c) => re.test(c))
  const P = `lg-${motif}-`
  const isHead = cls(new RegExp(`^${P}(head|face${maskFace ? '|mask' : ''})$`))
  const isHair = cls(new RegExp(`^${P}hair$`))
  const isBody = cls(new RegExp(`^${P}(body|torso|neck|chest|shoulders)$`))
  const times = []; for (let t = 0; t <= SPAN; t += STEP) times.push(t)
  // one arena per frame for the sheet (each frozen at its own time), one for the measurement
  const host = document.createElement('div'); host.id = 'joint-host'; host.style.cssText = 'position:absolute;z-index:99999;left:0;top:0;background:#151a24;display:flex;flex-wrap:wrap;gap:62px;padding:32px;width:1560px'
  document.body.prepend(host)
  const out = []
  const mk = () => {
    const box = document.createElement('div'); box.className = 'lg-boss'; box.dataset.motif = motif; box.dataset.phase = String(phase)
    box.style.cssText = 'position:relative;width:150px;height:150px;flex:none'
    box.innerHTML = markup
    const svg = box.querySelector('svg'); svg.setAttribute('width', '150'); svg.setAttribute('height', '150'); svg.setAttribute('overflow', 'visible'); svg.style.clipPath = 'inset(-20%)'
    host.appendChild(box); svg.pauseAnimations(); svg.setCurrentTime(0)
    return box
  }
  const visible = (e) => e.getBoundingClientRect().width > 0 && getComputedStyle(e).display !== 'none' && !e.closest('[style*="display: none"]')
  for (const [name, attrs] of states) {
    host.innerHTML = ''
    const box = mk(); const svg = box.querySelector('svg')
    const heads = [...svg.querySelectorAll('g')].filter(isHead).filter(visible)
    if (!heads.length) {
      const named = [...new Set([...svg.querySelectorAll('[class]')].flatMap((e) => [...e.classList]).filter((c) => /head|face|skull|jaw|neck/i.test(c)))]
      const hidden = [...svg.querySelectorAll('g')].some(isHead)
      out.push({ name, nohead: hidden ? `its lg-${motif}-head / face wrapper is not in this phase's drawing (head parts: ${named.slice(0, 6).join(', ')})` : named.length ? `no lg-${motif}-head / face wrapper, its heads are drawn as ${named.slice(0, 6).join(', ')}` : `no lg-${motif}-head / face wrapper` })
      host.remove(); return out
    }
    const head = heads[0]
    // the innermost wrapper of the head (head > headA ...): its probe sees every CSS move on the way down
    const inner = (root) => { let d = root; for (;;) { const k = [...d.children].find((c) => c.tagName === 'g' && [...c.classList].some((x) => x.startsWith(root.classList[0]))); if (!k) return d; d = k } }
    const headIn = inner(head)
    const bodies = [...svg.querySelectorAll('g')].filter(isBody).filter(visible)
    const bodyIn = bodies.length ? inner(bodies[0]) : svg
    const hairs = [...svg.querySelectorAll('g')].filter(isHair).filter(visible)
    const hairIn = hairs.length ? inner(hairs[0]) : null
    // the joint at rest, in the svg's user units (the wrappers carry no transform attribute of their own)
    const toRoot = (e) => svg.getScreenCTM().inverse().multiply(e.getScreenCTM())
    const bb = head.getBBox(); const m0 = toRoot(head)
    const corners = [[bb.x, bb.y], [bb.x + bb.width, bb.y], [bb.x, bb.y + bb.height], [bb.x + bb.width, bb.y + bb.height]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(m0))
    const hx = (Math.min(...corners.map((c) => c.x)) + Math.max(...corners.map((c) => c.x))) / 2
    const hTop = Math.min(...corners.map((c) => c.y)), hBottom = Math.max(...corners.map((c) => c.y))
    // THE JOINT: the CHIN SEAM, where the head meets the neck. The neck axis is the centre of the body part's top (else
    // the head's centre); the seam is the head's LOWEST drawn point on that axis (the lowest shape of the head crossing
    // it: the chin, never an ear tassel or a flame off to the side), probed there and 4 units to each side. A tilt
    // pivoting on the neck keeps all three on it; a head rotated round a pivot far above or below, or slid or scaled
    // while the body is not, moves them off. (Round 1 used the top of the body part when it lay inside the head: for
    // the kitsune that was her mouth, ten units above the chin, so a swinging chin passed.)
    const rootBox = (e) => { const b2 = e.getBBox(), m2 = toRoot(e); const p = [[b2.x, b2.y], [b2.x + b2.width, b2.y], [b2.x, b2.y + b2.height], [b2.x + b2.width, b2.y + b2.height]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(m2)); return { x0: Math.min(...p.map((q) => q.x)), x1: Math.max(...p.map((q) => q.x)), y0: Math.min(...p.map((q) => q.y)), y1: Math.max(...p.map((q) => q.y)) } }
    const ax = bodies.length ? (() => { const r = rootBox(bodies[0]); return (r.x0 + r.x1) / 2 })() : hx
    const shapes = [...head.querySelectorAll('path, ellipse, circle, rect, polygon')].filter((e) => !e.closest('[style*="display: none"]') && getComputedStyle(e).display !== 'none' && getComputedStyle(e).fill !== 'none' && e.getBBox().width > 0)
    const crossing = shapes.map(rootBox).filter((r) => r.x0 <= ax && r.x1 >= ax && r.y1 <= hBottom + 0.01)
    const chinY = crossing.length ? Math.max(...crossing.map((r) => r.y1)) : hBottom
    const seam = [ax - 4, ax, ax + 4].map((x) => ({ x, y: chinY }))
    const joint = seam[1]
    const mid = { x: ax, y: (hTop + chinY) / 2 }
    const probe = (parent, p) => { const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); const inv = toRoot(parent).inverse(); const q = new DOMPoint(p.x, p.y).matrixTransform(inv); c.setAttribute('cx', q.x); c.setAttribute('cy', q.y); c.setAttribute('r', '0.01'); c.setAttribute('fill', 'none'); parent.appendChild(c); return c }
    const pairs = seam.map((p) => [probe(headIn, p), probe(bodyIn, p)])
    const pH2 = hairIn ? probe(headIn, mid) : null, pR = hairIn ? probe(hairIn, mid) : null
    const at = (c) => { const r = c.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } }
    const unit = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width
    for (const [k, v] of Object.entries(attrs)) box.setAttribute(k, v)
    getComputedStyle(headIn).transform
    let worst = { gap: 0, t: 0 }, hairWorst = { gap: 0, t: 0 }
    for (const t of times) {
      box.getAnimations({ subtree: true }).forEach((a) => { a.pause(); a.currentTime = t })
      for (const [pH, pB] of pairs) {
        const a = at(pH), b = at(pB); const gap = Math.hypot(a.x - b.x, a.y - b.y) / unit
        if (gap > worst.gap) worst = { gap, t, dx: (a.x - b.x) / unit, dy: (a.y - b.y) / unit }
      }
      if (pR) { const c = at(pH2), d = at(pR); const g2 = Math.hypot(c.x - d.x, c.y - d.y) / unit; if (g2 > hairWorst.gap) hairWorst = { gap: g2, t } }
    }
    const anims = box.getAnimations({ subtree: true }).length
    out.push({ name, anims, joint, worst, hairWorst, body: bodies.length ? [...bodies[0].classList][0] : 'svg' })
    if (sheet && anims) {
      host.innerHTML = ''
      for (const t of times) {
        const b2 = mk(); for (const [k, v] of Object.entries(attrs)) b2.setAttribute(k, v)
        const lab = document.createElement('div'); lab.textContent = `${t}`; lab.style.cssText = 'position:absolute;left:-28px;top:-28px;font:11px monospace;color:#9ab'; b2.appendChild(lab)
      }
      for (const b2 of host.children) { getComputedStyle(b2).transform; b2.getAnimations({ subtree: true }).forEach((a) => { a.pause(); a.currentTime = Number(b2.lastChild.textContent) }) }
      out[out.length - 1].sheet = true
      return out
    }
  }
  host.remove()
  return out
}, { motif, states, phase, STEP, SPAN, sheet, maskFace: MASK_FACE.includes(motif) }))

const motifs = ONLY.length ? ONLY : await retry(() => page.evaluate(() => window.__joints.RAID_MOTIFS))
const fails = [], skipped = [], soft = {}, unchecked = {}
for (const motif of motifs) {
  if (SKIP[motif] && !ONLY.includes(motif)) { skipped.push(`${motif} (${SKIP[motif]})`); continue }
  const fxKeys = await retry(() => page.evaluate((m) => window.__joints.fxKeys(m), motif))
  const states = statesFor(fxKeys).filter(([name]) => !process.env.JOINTS_STATE || name === process.env.JOINTS_STATE)
  for (const phase of (process.env.JOINTS_PHASE ? [Number(process.env.JOINTS_PHASE)] : [1, 2, 3])) {
    if (SHEET) {
      fs.mkdirSync(SHEET, { recursive: true })
      for (const st of states) {
        const r = await measure(motif, [st], phase, true)
        if (r[0]?.sheet) { await page.waitForTimeout(150); await page.locator('#joint-host').screenshot({ path: path.join(SHEET, `${motif}-p${phase}-${st[0].replace(/[^\w]+/g, '_')}.png`) }); await page.evaluate(() => document.getElementById('joint-host')?.remove()) }
        report(motif, phase, r)
      }
    } else report(motif, phase, await measure(motif, states, phase, false))
  }
}
function report(motif, phase, rows) {
  for (const r of rows) {
    if (r.nohead) { ((unchecked[motif] ||= {})[r.nohead] ||= []).push(phase); continue }
    const msg = `${motif} p${phase} ${r.name}: head leaves the ${r.body} by ${r.worst.gap.toFixed(1)} units at ${r.worst.t} ms`
    if (process.env.JOINTS_VERBOSE) console.log(`  ${motif} p${phase} ${r.name.padEnd(22)} anims ${String(r.anims).padStart(3)} joint ${r.joint.x.toFixed(1)},${r.joint.y.toFixed(1)} head ${r.worst.gap.toFixed(2)} (dx ${(r.worst.dx ?? 0).toFixed(1)} dy ${(r.worst.dy ?? 0).toFixed(1)}) @${r.worst.t}${r.hairWorst?.gap ? ` hair ${r.hairWorst.gap.toFixed(2)} @${r.hairWorst.t}` : ''}`)
    const hits = []
    if (r.worst.gap > MAX_GAP) hits.push([r.worst.gap, msg])
    if (r.hairWorst && r.hairWorst.gap > MAX_GAP) hits.push([r.hairWorst.gap, `${motif} p${phase} ${r.name}: hair leaves the head by ${r.hairWorst.gap.toFixed(1)} units at ${r.hairWorst.t} ms`])
    for (const [gap, m] of hits) {
      if (STRICT.includes(motif) || process.env.JOINTS_STRICT === 'all') fails.push(m)
      else { const w = (soft[motif] ||= { n: 0, gap: 0, msg: '' }); w.n++; if (gap > w.gap) Object.assign(w, { gap, msg: m }) }
    }
  }
}
await browser.close()
for (const s of [...new Set(skipped)]) console.log('skip  ', s)
for (const [m, w] of Object.entries(soft)) console.log('warn  ', `joint  ${m}: ${w.n} animation(s) part the head from the body, worst: ${w.msg}`)
for (const [m, w] of Object.entries(unchecked)) for (const [why, ph] of Object.entries(w)) console.log('warn  ', `joint  ${m} phase ${ph.join(', ')}: NOT checked, ${why}`)
for (const f of fails) console.log('FAIL  ', 'joint  ' + f)
console.log(`${fails.length} joint failure(s), ${Object.keys(soft).length} boss(es) warned, ${Object.keys(unchecked).length} not checked (no head wrapper)`)
process.exit(fails.length ? 1 : 0)
