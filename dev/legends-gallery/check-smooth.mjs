// SMOOTH MOTION check: does every part of every drawing move on EVERY display frame, and look exactly as before?
//   node dev/legends-gallery/check-smooth.mjs                 every raid boss, Legends boss and banner (dev server on 3001)
//   node dev/legends-gallery/check-smooth.mjs banshee kaleido just those (EBIKI_ONLY=raids/banshee works too)
//   SMOOTH_SKIP_SAME=1  only the frame check (fast); SMOOTH_SHEET=<dir> writes a side-by-side png of every mismatch
// The owner, 2026-10-11: the Banshee's float and the Kaleido's crystals moved at a "low choppy framerate", "thats the
// issue with a lot of the animations ... make sure that every animation even subtle isn't low framerate". SMIL ran on
// the main thread (every frame re-ran the page's style, paint and layerization: the asset view dropped 100 to 400 of 480
// frames a second, more on a slower machine), so art.jsx plays every live drawing as COMPOSITED MOTION
// (src/features/legends/motion/plan.js): Web Animations the compositor runs, a new position every display frame.
// Anything that pulls a drawing back onto the main thread brings the stutter back, so this FAILS:
//   smil    a live drawing that still has a SMIL animation after the conversion (its timeline ticks the whole page on
//           every frame): a new SMIL shape motion/plan.js cannot map (teach it), or a stripped one left behind
//   comp    an animation the browser refuses to composite (its trace says why: a CSS zoom other than exactly 1 on the
//           SVG, composite 'add', a property other than transform...)
//   frames  main-thread frames while only the drawing plays (over MAX_MAIN a second): something still animates there
//   lost    a converted animation on an element that is not drawn (a wrapper inside a shape): the motion vanished
//   same    a converted drawing that does not look like its SMIL at the same moments (over SAME_MAX of the pixels off by
//           more than 64): the conversion changed a pose, a pivot, a timing or an easing. Raid bosses: every phase, the
//           entrance, every ability effect; Legends bosses and banners: idle.
// HOW: each drawing mounts LIVE through the real LegendsArt (dev/bake-sweep/harness.jsx) at the app's default zoom
// (1.35, so the SVG's inverse zoom is exercised), raid bosses BAKED as the app shows them; a Chrome trace counts
// main-thread frames, compositor frames and composite failures. The look check freezes both versions (vector) at the
// same moments. Playwright's bundled Chromium only (never the installed Chrome), muted, with the GPU when it starts.
import fs from 'fs'
import os from 'os'
import path from 'path'
import { pathToFileURL } from 'url'
import { createRequire } from 'module'
const DEPS = process.env.EBIKI_DRIVE_DEPS || path.join(os.homedir(), '.ebiki-drive')
const pw = path.join(DEPS, 'node_modules', 'playwright-core', 'index.mjs')
if (!fs.existsSync(pw)) { console.error('playwright-core is missing: run `npm run drive` once to install it.'); process.exit(2) }
const { chromium } = await import(pathToFileURL(pw).href)
const sharp = createRequire(path.resolve('package.json'))('sharp')
const APP = (process.env.EBIKI_URL || 'http://localhost:3001/').replace(/dev\/legends-gallery\/?$/, '')
const ZOOM = 1.35
const MAX_MAIN = 5        // main-thread frames a second allowed while only the drawing plays (none are needed)
const SAME_MAX = 0.8      // % of pixels off by more than 64 between the SMIL and the composited drawing. A moving part
// rastered as its own compositor layer resamples its edges at sub-pixel positions (lich P3 0.69%, celestial banner 0.47%,
// measured 2026-10-11: pose and timing exact); that edge AA is accepted for smooth motion. Over 0.8% is a real change.
const TIMES = { idle: [0.7, 2.2, 3.9], intro: [0.35, 1.1, 3.2] }
const args = process.argv.slice(2)
const ONLY = [...args.filter((a) => !a.startsWith('--')), ...(process.env.EBIKI_ONLY || '').split(',').filter(Boolean).map((o) => o.replace(/^(raids|bosses|areas)\//, ''))]
const SHEET = process.env.SMOOTH_SHEET
if (SHEET) fs.mkdirSync(SHEET, { recursive: true })

const GPU = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-gpu-rasterization']
let browser
try { browser = await chromium.launch({ headless: true, channel: 'chromium', args: ['--mute-audio', ...(process.platform === 'win32' ? GPU : [])] }) } catch { browser = await chromium.launch({ headless: true, args: ['--mute-audio'] }) }
const ctx = await browser.newContext({ viewport: { width: 640, height: 640 } })
await ctx.addInitScript(() => { try { window.speechSynthesis.speak = () => {} } catch { /* none */ } })
const page = await ctx.newPage()
await page.route('**/api/**', (r) => (r.request().method() === 'GET' ? r.continue() : r.fulfill({ status: 204, body: '' })))
// no hot reload: an art file saved while this runs must not reload the page under it
await page.route('**/@vite/client', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: 'export const createHotContext = () => ({ accept(){}, dispose(){}, prune(){}, invalidate(){}, on(){}, off(){}, send(){}, data: {} }); export const injectQuery = (u) => u; export const updateStyle = (id, css) => { let s = document.querySelector(`style[data-vite-dev-id="${id}"]`); if (!s) { s = document.createElement("style"); s.setAttribute("data-vite-dev-id", id); document.head.appendChild(s) } s.textContent = css }; export const removeStyle = () => {};' }))
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await page.goto(APP, { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => [...document.querySelectorAll('style')].some((s) => s.textContent.includes('--c-brand')), null, { timeout: 90000 })
const all = await page.evaluate(async (ZOOM) => {
  const { MOTIFS } = await import('/src/features/legends/map.js')
  const { RAID_MOTIFS, RAID_ABILITY } = await import('/src/features/legends/raid.js')
  const { abilityById } = await import('/src/features/legends/abilities/index.js')
  const { fxDemoFor } = await import('/src/features/legends/fx/index.js')
  const style = [...document.querySelectorAll('style')].map((s) => s.outerHTML).join('')
  document.body.innerHTML = `${style}<div id="host" style="display:inline-block"></div>`
  document.body.style.zoom = String(ZOOM)
  document.documentElement.style.setProperty('--app-zoom', String(ZOOM))
  const list = []
  for (const m of RAID_MOTIFS) {
    for (const phase of [1, 2, 3]) list.push({ kind: 'raids', motif: m, animated: 'idle', phase, size: 180 })
    list.push({ kind: 'raids', motif: m, animated: 'intro', phase: 1, size: 180 })
    const ability = RAID_ABILITY[m]
    for (const fx of abilityById(ability)?.fxKeys || []) list.push({ kind: 'raids', motif: m, animated: 'idle', phase: 2, ability, fx, ab: fxDemoFor(ability, fx)?.ab || {}, size: 180, sameOnly: true })
  }
  for (const m of MOTIFS) { list.push({ kind: 'bosses', motif: m, animated: 'idle', size: 120 }); list.push({ kind: 'areas', motif: m, animated: 'idle', size: 140 }) }
  return list
}, ZOOM)
const configs = all.filter((c) => !ONLY.length || ONLY.includes(c.motif))
const name = (c) => `${c.kind}/${c.motif} ${c.animated}${c.phase ? ' p' + c.phase : ''}${c.fx ? ' fx ' + c.fx : ''}`
const cdp = await ctx.newCDPSession(page)

async function mount(c, { composite, bake }) {
  await page.evaluate(async ({ c, composite, bake }) => {
    window.__ebikiNoComposite = !composite
    window.__ebikiNoBake = !bake
    const { mount } = await import('/dev/bake-sweep/harness.jsx')
    mount(document.getElementById('host'), c)
  }, { c, composite, bake })
  const ok = await page.waitForFunction(({ bake, composite }) => {
    const s = document.querySelector('#host svg')
    if (!s || (bake && !s.querySelector('image'))) return false
    return !composite || !!s.__lgComposited
  }, { bake, composite }, { timeout: bake ? 90000 : 30000, polling: 100 }).then(() => true, () => false)
  return ok
}

// FRAMES: the drawing alone, live, as the app shows it. One second of trace, again (up to WINDOWS times) while the
// bake or a swap is still settling; then every running animation is restarted inside a short trace, so each reports
// whether the browser composites it.
const WINDOWS = 4
async function traced(cats, ms, during) {
  const events = []
  const onData = (d) => events.push(...d.value)
  cdp.on('Tracing.dataCollected', onData)
  const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r))
  await cdp.send('Tracing.start', { categories: cats, transferMode: 'ReportEvents' })
  if (during) await during()
  await page.waitForTimeout(ms)
  await cdp.send('Tracing.end'); await done
  cdp.off('Tracing.dataCollected', onData)
  return events
}
async function frames(c) {
  const isRaid = c.kind === 'raids'
  if (!await mount(c, { composite: true, bake: isRaid && !process.env.SMOOTH_NO_BAKE })) return { fail: 'did not mount (bake or conversion never came)' }
  await page.waitForTimeout(400)
  // each part STARTS on the compositor with a main-thread frame or two at its SMIL begin (a banner whose parts begin one
  // by one over 6 s pays them then, once): measured from the last begin on, the steady state the owner watches
  const wait = await page.evaluate(() => { const s = document.querySelector('#host svg'), k = s.__lgComposited
    const last = Math.max(0, ...(k ? k.anims : []).map((a) => a.__lgDelay || 0).filter(Number.isFinite))
    return Math.min(10000, Math.max(0, last - s.getCurrentTime() * 1000 + 300)) })
  if (wait) await page.waitForTimeout(wait)
  let main = Infinity, draws = 0
  for (let w = 0; w < WINDOWS && main > MAX_MAIN; w++) {
    const ev = await traced('devtools.timeline,disabled-by-default-devtools.timeline.frame', 1000)
    main = ev.filter((e) => e.name === 'BeginMainThreadFrame').length
    draws = ev.filter((e) => e.name === 'DrawFrame').length
  }
  const ev = await traced('devtools.timeline,blink.animations,devtools.timeline.async', 300, () => page.evaluate(() => {
    const s = document.querySelector('#host svg'), k = s.__lgComposited
    // a part hidden right now (an ability layer before its effect, display none) cannot composite until it shows, and
    // the browser composites it the moment it does: only the parts on screen are asked
    const shown = (t) => { for (let e = t; e && e !== s; e = e.parentElement) if (getComputedStyle(e).display === 'none') return false; return true }
    for (const a of k ? k.anims : []) if (a.playState === 'running' && shown(a.effect.target)) { a.pause(); a.play() }
  }))
  const failed = ev.filter((e) => e.name === 'Animation' && e.args && e.args.data && e.args.data.compositeFailed).map((e) => e.args.data.compositeFailed)
  const state = await page.evaluate(() => { const s = document.querySelector('#host svg'); const k = s.__lgComposited; const drawn = (a) => { let e = a.effect && a.effect.target; if (!e || !e.isConnected) return false; for (e = e.parentElement; e && e !== s; e = e.parentElement) if (!['g', 'a', 'switch'].includes(e.localName)) return false; return true }
    return { crisp: !!(k && k.crisp), anims: k ? k.anims.length : 0, lost: k ? k.anims.filter((a) => !drawn(a)).length : 0, smil: s.querySelectorAll('animateTransform, animateMotion').length, zoom: s.currentCSSZoom } })
  return { ...state, failed: [...new Set(failed)], main, draws }
}

async function shots(c, composite) {
  if (!await mount(c, { composite, bake: false })) return null
  await page.waitForTimeout(250)
  const out = []
  for (const t of TIMES[c.animated]) {
    await page.evaluate((t) => {
      for (const a of document.getAnimations()) if (a.animationName) { try { a.pause(); a.currentTime = 250 } catch { /* gone */ } } // the page's CSS (ability effects)
      for (const s of document.querySelectorAll('#host svg')) { if (s.ownerSVGElement) continue; try { s.pauseAnimations(); s.setCurrentTime(t) } catch { /* not an SVG document */ } }
    }, t)
    await page.waitForTimeout(150)
    out.push(await page.locator('#host').screenshot())
  }
  return out
}
async function diff(a, b) {
  const A = await sharp(a).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const B = await sharp(b).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  if (A.info.width !== B.info.width || A.info.height !== B.info.height) return 100
  let big = 0
  for (let j = 0; j < A.data.length; j += 4) if (Math.max(Math.abs(A.data[j] - B.data[j]), Math.abs(A.data[j + 1] - B.data[j + 1]), Math.abs(A.data[j + 2] - B.data[j + 2])) > 64) big++
  return (big / (A.data.length / 4)) * 100
}

const fails = [], warns = []
for (const [i, c] of configs.entries()) {
  const n = name(c)
  let line = `${String(i + 1).padStart(3)}/${configs.length} ${n}`
  if (!c.sameOnly) {
    const f = await frames(c)
    if (f.fail) fails.push(`frames ${n}: ${f.fail}`)
    else {
      if (f.crisp) { line += '  pixel art: stays SMIL (crispEdges, never composited)'; warns.push(`crisp  ${n}: pixel art plays as SMIL on purpose (the compositor blurs crisp edges)`) } else {
      line += `  anims ${f.anims}, smil left ${f.smil}, main ${f.main}/s, draws ${f.draws}/s, zoom ${f.zoom}`
      if (f.lost) fails.push(`lost   ${n}: ${f.lost} converted animation(s) sit where nothing is drawn (inside a shape, or detached): that motion vanished`)
      if (f.smil) fails.push(`smil   ${n}: ${f.smil} SMIL animation(s) left after the conversion (motion/plan.js cannot map them): they tick the page on the main thread every frame`)
      if (f.failed.length) fails.push(`comp   ${n}: the browser refused to composite (compositeFailed ${f.failed.join(', ')}); zoom on the SVG ${f.zoom}`)
      if (f.main > MAX_MAIN) fails.push(`frames ${n}: ${f.main} main-thread frames a second while only the drawing plays (max ${MAX_MAIN}): a part is animated off the compositor`)
      }
    }
  }
  if (!process.env.SMOOTH_SKIP_SAME) {
    const a = await shots(c, false), b = await shots(c, true)
    if (!a || !b) fails.push(`same   ${n}: could not render both versions`)
    else {
      let worst = 0, k = 0
      for (let j = 0; j < a.length; j++) { const d = await diff(a[j], b[j]); if (d > worst) { worst = d; k = j } }
      line += `  same: worst ${worst.toFixed(3)}%`
      if (worst > SAME_MAX) {
        fails.push(`same   ${n}: ${worst.toFixed(2)}% of the pixels differ from the SMIL drawing at ${TIMES[c.animated][k]} s (max ${SAME_MAX}%)`)
        if (SHEET) {
          const meta = await sharp(a[k]).metadata()
          await sharp({ create: { width: meta.width * 2 + 8, height: meta.height, channels: 4, background: '#ffffff' } })
            .composite([{ input: a[k], left: 0, top: 0 }, { input: b[k], left: meta.width + 8, top: 0 }]).png().toFile(path.join(SHEET, `${n.replace(/[^\w]+/g, '-')}.png`))
        }
      }
    }
  }
  console.log(line)
}
// The app zoom changes live (Ctrl and +): a drawing on screen must stay composited at the new zoom (THE ZOOM, web.js)
if (configs.some((c) => c.kind === 'raids')) {
  const c = configs.find((x) => x.kind === 'raids' && !x.sameOnly)
  await mount(c, { composite: true, bake: false })
  for (const z of [1.15, 1.7, 2]) {
    const zoom = await page.evaluate((z) => { document.body.style.zoom = String(z); document.documentElement.style.setProperty('--app-zoom', String(z)); window.dispatchEvent(new Event('resize')); return document.querySelector('#host svg').currentCSSZoom }, z)
    if (zoom !== 1) fails.push(`comp   app zoom ${z}: the SVG's own zoom came to ${zoom}, not exactly 1 (its animations leave the compositor)`)
  }
}
if (errors.length) warns.push('page errors: ' + [...new Set(errors)].slice(0, 5).join(' | '))
await browser.close()
for (const w of warns) console.log('warn  ', w)
for (const f of fails) console.log('FAIL  ', f)
console.log(`${fails.length} smooth motion failure(s)`)
process.exit(fails.length ? 1 : 0)
