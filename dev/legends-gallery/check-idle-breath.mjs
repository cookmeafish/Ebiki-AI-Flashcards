// Raid boss IDLE BREATH check: does an idle loop move the WHOLE figure by so little that it reads as a glitch? Run by
// check-art.mjs; alone:
//   node dev/legends-gallery/check-idle-breath.mjs                 every raid boss (dev server up on 3001)
//   node dev/legends-gallery/check-idle-breath.mjs chronos titan   just those (EBIKI_ONLY=raids/chronos works too)
//   BREATH_TABLE=1 prints every whole-figure loop it found (boss, phase, part, share, px at panel and arena size, period)
// The owner, 2026-10-11, on the Chronos: "a lot of the raid bosses weirdly breath where the whole svg moves a little bit.
// if breathing makes sense then keep it but this guy is a hunk of metal and the breathing movement is so slow and subtle
// that it looks like he's glitching up and down". So:
// Then, 2026-10-13, in capitals, after that rule (whole figure at least 2 px) had shipped: "THE SLOW STUTTERING
// BOBBING/WEIRD BREATHING IS STILL THERE. ITS LOW FRAMERATE AND CHOPPY". Measured on the presented frames: the playback
// was smooth (the Banshee's face moved a few hundredths of a pixel every frame, none dropped). The motion ITSELF was the
// fault: a whole figure drifting 2 to 5 px over 2 to 3 s moves under 0.03 px a frame, so its outlines step one pixel
// about every half second and the eye reads that as a low frame rate, on a 60 Hz or a 480 Hz screen alike. So:
//   FAIL  DRIFT: ANY boss with a whole-figure idle oscillation (a translate / scale / rotate that returns to its start,
//         moving MIN_SHARE or more of the painted pixels). Idle life goes in the PARTS (hair, hands, fire, eyes)
//   FAIL  CREEP: a loop moving a BIG PART (CREEP_SHARE to MIN_SHARE of the figure) under CREEP_PX at panel size: it only
//         creeps. A big part moves clearly (the kitsune's hair sways 4 to 7 px) or not at all
// HOW: each phase is built as the arena shows it (sanitized, idle motion only, the phase layers switched by data-phase)
// at the panel's real screen size (VIEW.phase 180 CSS px x the default app zoom 1.35) and the fight arena's (BOSS.arena
// 120 x 1.35). The painted pixels are sampled on a grid (hit testing: the topmost painted shape under each point).
// Every idle animateTransform that returns to its start (spins and travellers do not) is grouped with its twins (the
// same type, values, dur and begin: a bob split over sibling groups counts as one) and its targets' SHARE of the painted
// grid points is counted. A group moving MIN_SHARE or more of the figure is "whole figure"; its amplitude is the
// farthest any of those painted points travels through the targets' OWN animated transform over one period, in screen
// px (the parents held at frame 0, so a child is not blamed for its parent's motion).
import fs from 'fs'
import os from 'os'
import path from 'path'
import { pathToFileURL } from 'url'
const DEPS = process.env.EBIKI_DRIVE_DEPS || path.join(os.homedir(), '.ebiki-drive')
const pw = path.join(DEPS, 'node_modules', 'playwright-core', 'index.mjs')
if (!fs.existsSync(pw)) { console.error('playwright-core is missing: run `npm run drive` once to install it.'); process.exit(2) }
const { chromium } = await import(pathToFileURL(pw).href)
const URL = process.env.EBIKI_URL || 'http://localhost:3001/dev/legends-gallery/'
const ZOOM = 1.35          // the default app zoom (src/config/zoom.js: shown as 100%)
const PANEL = 180          // AssetView VIEW.phase: the owner's "Phase drawings" panel
const ARENA = 120          // BossArena BOSS.arena
const MIN_SHARE = 0.5      // share of the painted figure an idle loop must move to count as "the whole figure"
const CREEP_SHARE = 0.3    // a loop moving this share of the figure (under MIN_SHARE) moves a BIG PART
const CREEP_PX = 3         // screen px at panel size a big part must travel; under it the part only creeps (reads as stutter)
const GRID = 3             // px between hit-test samples
const CHOP_SHARE = 0.02    // a loop moving at least this share of the painted figure is judged for judder
const HZ = 120             // samples per second of a loop's own motion
const ABRUPT = 0.5         // a change of velocity between two samples over this share of the loop's peak speed = judder
// Bosses that are MACHINES, OBJECTS or ARMOUR, never breathing flesh: no whole-figure breathing at all. A living boss
// that is not here may breathe (clearly). Why each one:
const CONSTRUCTS = {
  chronos: 'a clockwork man with a pocket-watch head: brass and gears',
  titan: 'a stone and bronze colossus',
  kaleido: 'a knight of mirror armour and prisms',
  ophanim: 'wheels within wheels covered in eyes: a celestial object',
  puppeteer: 'a wooden marionette master: the puppet body is a doll',
}
const args = process.argv.slice(2)
const ONLY = [
  ...args.filter((a) => !a.startsWith('--')),
  ...(process.env.EBIKI_ONLY || '').split(',').filter((o) => o && (!o.includes('/') || o.startsWith('raids/'))).map((o) => o.replace(/^raids\//, '')),
]
if (process.env.EBIKI_ONLY && !ONLY.length) { console.log('0 idle breath failure(s) (EBIKI_ONLY names no raid boss)'); process.exit(0) }

const browser = await chromium.launch({ headless: true, args: ['--mute-audio'] }) // Playwright's bundled Chromium only, muted
const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } })
await page.route('**/api/**', (r) => (r.request().method() === 'GET' ? r.continue() : r.fulfill({ status: 204, body: '' })))
await page.route('**/@vite/client', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: 'export const createHotContext = () => ({ accept(){}, dispose(){}, prune(){}, invalidate(){}, on(){}, off(){}, send(){}, data: {} }); export const injectQuery = (u) => u; export const updateStyle = (id, css) => { let s = document.querySelector(`style[data-vite-dev-id="${id}"]`); if (!s) { s = document.createElement("style"); s.setAttribute("data-vite-dev-id", id); document.head.appendChild(s) } s.textContent = css }; export const removeStyle = () => {};' }))
// BREATH_SVG_DIR=<dir>: <dir>/<motif>.svg instead of the served drawing (an older copy, to prove the check)
if (process.env.BREATH_SVG_DIR) for (const f of fs.readdirSync(process.env.BREATH_SVG_DIR).filter((x) => x.endsWith('.svg'))) {
  const body = fs.readFileSync(path.join(process.env.BREATH_SVG_DIR, f), 'utf8')
  await page.route((u) => u.pathname === `/assets/legends/raids/${f}`, (r) => r.fulfill({ status: 200, contentType: 'image/svg+xml', body }))
}
const NOEASE = !!process.env.BREATH_NOEASE // prove the judder rule: measure the files as they played before easeMotion.js
const ready = async () => { await page.goto(URL, { waitUntil: 'networkidle' }); await page.evaluate(async (NOEASE) => {
  for (const e of document.body.children) e.style.display = 'none' // the gallery animates every drawing: off the page
  const { RAID_MOTIFS } = await import('/src/features/legends/raid.js')
  const { sanitizeHtml } = await import('/src/components/Markdown.jsx')
  const { withMotion } = await import('/src/features/legends/art.jsx')
  const { easeTurns } = await import('/src/features/legends/easeMotion.js')
  const style = document.createElement('style')
  style.textContent = `.lg-boss[data-phase="2"] .lg-p2, .lg-boss[data-phase="3"] .lg-p2, .lg-boss[data-phase="3"] .lg-p3 { display: inline !important }
.lg-boss[data-phase="2"] .lg-p1, .lg-boss[data-phase="3"] .lg-p1, .lg-boss[data-phase="3"] .lg-p12 { display: none !important }`
  document.head.appendChild(style)
  const raw = {}
  window.__br = {
    RAID_MOTIFS,
    async svg(m, phase) { raw[m] ||= (NOEASE ? (x) => x : easeTurns)(sanitizeHtml(await (await fetch(`/assets/legends/raids/${m}.svg`, { cache: 'no-store' })).text(), { USE_PROFILES: { svg: true } })); return withMotion(raw[m], 'idle', phase) },
  }
}, NOEASE) }
await ready()
const retry = async (fn) => { for (let i = 0; ; i++) { try { return await fn() } catch (e) { if (i >= 3) throw e; await ready() } } }

const measure = (motif, phase, box) => retry(() => page.evaluate(async ({ motif, phase, box, GRID, MIN_SHARE, CHOP_SHARE, HZ }) => {
  const markup = await window.__br.svg(motif, phase)
  document.getElementById('br-host')?.remove()
  const host = document.createElement('div'); host.id = 'br-host'
  const pad = Math.ceil(box * 0.2)
  host.style.cssText = `position:fixed;z-index:99999;left:0;top:0;padding:${pad}px;background:transparent`
  const root = document.createElement('div'); root.className = 'lg-boss'; root.dataset.phase = String(phase)
  root.style.cssText = `position:relative;width:${box}px;height:${box}px`
  root.innerHTML = markup; host.appendChild(root); document.body.prepend(host)
  const svg = root.querySelector('svg'); svg.setAttribute('width', box); svg.setAttribute('height', box); svg.setAttribute('overflow', 'visible'); svg.style.display = 'block'
  svg.pauseAnimations(); svg.setCurrentTime(0)
  // the painted grid at frame 0 (the rest pose)
  const r = svg.getBoundingClientRect()
  const hits = []
  for (let y = r.top - pad; y < r.bottom + pad; y += GRID) for (let x = r.left - pad; x < r.right + pad; x += GRID) {
    const e = document.elementFromPoint(x, y)
    if (e && e !== svg && svg.contains(e)) hits.push({ x, y, e })
  }
  const secs = (v) => { const m = /^([\d.]+)(ms|s)?$/.exec((v || '').trim()); return m ? parseFloat(m[1]) / (m[2] === 'ms' ? 1000 : 1) : 0 }
  const vals = (a) => (a.getAttribute('values') || [a.getAttribute('from'), a.getAttribute('to')].filter(Boolean).join(';')).split(';').map((s) => s.trim().split(/[\s,]+/).map(Number))
  const hiddenNow = (e) => { for (let p = e; p && p !== svg; p = p.parentElement) if (getComputedStyle(p).display === 'none') return true; return false }
  // oscillating idle loops: the first and last values are the same (spins and travellers wrap instead)
  const groups = new Map()
  for (const a of svg.querySelectorAll('animateTransform')) {
    const type = a.getAttribute('type')
    if (!/^(translate|scale|rotate)$/.test(type) || a.classList.contains('lg-in')) continue
    const v = vals(a); if (v.length < 2) continue
    const f = v[0], l = v[v.length - 1]
    if (f.length !== l.length || f.some((x, i) => Math.abs(x - l[i]) > 1e-6)) continue
    if (v.every((p) => p.every((x, i) => Math.abs(x - f[i]) < 1e-9))) continue
    const tgt = a.parentElement
    if (!tgt || hiddenNow(tgt)) continue
    const key = [type, a.getAttribute('values'), a.getAttribute('dur'), a.getAttribute('begin') || '0', a.getAttribute('keyTimes') || ''].join('|')
    const kt = (a.getAttribute('keyTimes') || '').split(';').filter(Boolean).map(Number)
    const stepped = kt.length === v.length && v.some((p, i) => i && kt[i] - kt[i - 1] < 0.01 && p.some((x, j) => Math.abs(x - v[i - 1][j]) > 1e-9))
    if (!groups.has(key)) groups.set(key, { type, dur: secs(a.getAttribute('dur')), begin: secs(a.getAttribute('begin')), values: a.getAttribute('values'), stepped, targets: new Set() })
    groups.get(key).targets.add(tgt)
  }
  const label = (e) => { for (let p = e; p && p !== svg; p = p.parentElement) { const c = [...p.classList].find((k) => k.startsWith('lg-') && !/^lg-(loop|in|p1|p2|p3|p12)$/.test(k)); if (c) return c + (p === e ? '' : ' >') } const kids = [...new Set([...e.querySelectorAll('[class]')].flatMap((k) => [...k.classList]).filter((k) => k.startsWith('lg-') && !/^lg-(loop|in|p1|p2|p3|p12)$/.test(k)))].slice(0, 3); return `${e.tagName}${kids.length ? '(holds ' + kids.join(', ') + ')' : ''}` }
  const dm = (x) => new DOMMatrix([x.a, x.b, x.c, x.d, x.e, x.f])
  const own = (t) => { let m = new DOMMatrix(); const l = t.transform.animVal; for (let i = 0; i < l.numberOfItems; i++) { m = m.multiply(dm(l.getItem(i).matrix)) } return m }
  const out = []
  for (const g of groups.values()) {
    const tg = [...g.targets]
    // a target inside another target of the same group is counted once (by its outermost)
    const top = tg.filter((t) => !tg.some((o) => o !== t && o.contains(t)))
    const mine = hits.filter((h) => top.some((t) => t.contains(h.e)))
    const share = hits.length ? mine.length / hits.length : 0
    if (share < CHOP_SHARE || !mine.length) continue
    // every painted point of the group, in its target's local frame at t = 0, with the parent's screen CTM held at 0
    const frames = top.map((t) => {
      const pm = dm(t.parentElement.getScreenCTM())
      const m0 = own(t)
      const inv = pm.multiply(m0).inverse()
      const pts = mine.filter((h) => t.contains(h.e)).map((h) => new DOMPoint(h.x, h.y).matrixTransform(inv))
      return { t, pm, m0, pts }
    })
    // the group's own motion over one period, sampled at HZ: every painted point for the amplitude, the farthest
    // mover for the velocity (a part that turns at full speed, or starts from a hold at full speed, judders)
    const dur = g.dur || 1, N = Math.min(1500, Math.max(96, Math.ceil(dur * HZ)))
    const at = (k) => { svg.setCurrentTime(g.begin + (k * dur) / N); return frames.map((f) => f.pm.multiply(own(f.t))) }
    let amp = 0, ampY = 0, far = null
    const rest = frames.map((f) => f.pm.multiply(f.m0))
    for (let k = 1; k <= 32; k++) {
      const ms = at(Math.round((k * N) / 32))
      frames.forEach((f, i) => { for (const p of f.pts) { const a = p.matrixTransform(ms[i]), b0 = p.matrixTransform(rest[i]); const d = Math.hypot(a.x - b0.x, a.y - b0.y); if (d > amp) { amp = d; far = [i, p] } if (Math.abs(a.y - b0.y) > ampY) ampY = Math.abs(a.y - b0.y) } })
    }
    let jerk = 0, peak = 0, jerkAt = 0
    if (far && amp >= 0.3) {
      const pos = []
      for (let k = 0; k <= N + 1; k++) { const m = at(k)[far[0]]; const q = far[1].matrixTransform(m); pos.push([q.x, q.y]) }
      const v = pos.slice(1).map((q, k) => [q[0] - pos[k][0], q[1] - pos[k][1]])
      peak = Math.max(...v.map((d) => Math.hypot(d[0], d[1])))
      for (let k = 0; k + 1 < v.length; k++) { const j = Math.hypot(v[k + 1][0] - v[k][0], v[k + 1][1] - v[k][1]); if (j > jerk) { jerk = j; jerkAt = k / N } }
    }
    out.push({ type: g.type, part: label(top[0]) + (top.length > 1 ? ` +${top.length - 1}` : ''), share, amp, ampY, dur: g.dur, values: g.values, stepped: g.stepped, abrupt: peak > 0 ? jerk / peak : 0, abruptAt: jerkAt, speed: (peak * N) / dur })
  }
  host.remove()
  return { painted: hits.length, loops: out }
}, { motif, phase, box, GRID, MIN_SHARE, CHOP_SHARE, HZ }))

const motifs = ONLY.length ? [...new Set(ONLY)] : await retry(() => page.evaluate(() => window.__br.RAID_MOTIFS))
const fails = [], rows = []
for (const motif of motifs) {
  for (const phase of [1, 2, 3]) {
    const P = await measure(motif, phase, Math.round(PANEL * ZOOM))
    const A = await measure(motif, phase, Math.round(ARENA * ZOOM))
    for (const l of P.loops) {
      const a = A.loops.find((x) => x.part === l.part && x.values === l.values && x.dur === l.dur)
      const row = { motif, phase, ...l, ampArena: a ? a.amp : NaN }
      rows.push(row)
      const what = `${motif} p${phase}: idle ${l.type} of ${l.part} moves ${Math.round(l.share * 100)}% of the figure ${l.amp.toFixed(2)} px at panel size (${row.ampArena.toFixed(2)} px in the arena), ${l.dur}s`
      const loc = ` [type=${l.type} values="${l.values}" dur=${l.dur}s]`
      if (l.share >= MIN_SHARE) {
        row.whole = true
        fails.push(`drift ${what}: the whole picture drifting a few px over seconds reads as a slow, low-framerate stutter on any screen; put idle life in the parts${CONSTRUCTS[motif] ? ` (a construct, ${CONSTRUCTS[motif]}, never breathes)` : ''}${loc}`)
      } else if (l.share >= CREEP_SHARE && l.amp < CREEP_PX) {
        fails.push(`creep ${what}: a big part creeping under ${CREEP_PX} px reads as stutter, not motion; move it clearly or not at all${loc}`)
      }
      // judder: the motion turns or starts at full speed (no ease): with an eased file (easeMotion.js) none should
      if (!l.stepped && l.amp >= 0.3 && l.abrupt > ABRUPT) fails.push(`judder ${what}: its speed jumps by ${Math.round(l.abrupt * 100)}% of its peak in one ${Math.round(1000 / HZ)} ms step at ${Math.round(l.abruptAt * 100)}% of the loop (a turn or a start with no ease)`)
    }
  }
}
await browser.close()
if (process.env.BREATH_TABLE) {
  console.log('boss       ph type      share  panel px  arena px  period  abrupt  part')
  for (const r of rows.filter((x) => x.share >= 0.3 || process.env.BREATH_TABLE === 'all')) console.log(`${r.motif.padEnd(10)} ${r.phase}  ${r.type.padEnd(9)} ${(Math.round(r.share * 100) + '%').padStart(5)}  ${r.amp.toFixed(2).padStart(8)}  ${r.ampArena.toFixed(2).padStart(8)}  ${String(r.dur + 's').padStart(6)}  ${(Math.round(r.abrupt * 100) + '%').padStart(6)}  ${r.part}  [${r.values}]`)
}
for (const f of fails) console.log('FAIL  ', f)
console.log(`${fails.length} idle breath failure(s)`)
process.exit(fails.length ? 1 : 0)
