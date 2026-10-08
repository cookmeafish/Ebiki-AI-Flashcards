// Cost per second of one animated boss, three ways: OLD (raw SMIL at the display's rate, no clock, no bake), CLOCK
// (the art clock, vector) and NOW (clock + sprite-rig bake). 3 s traces, Playwright's bundled Chromium, muted.
// node dev/bake-sweep/perf.mjs [size] [motif,motif,...]
import os from 'os'
import path from 'path'
import { pathToFileURL } from 'url'
const { chromium } = await import(pathToFileURL(path.join(os.homedir(), '.ebiki-drive', 'node_modules', 'playwright-core', 'index.mjs')).href)
const [sizeArg = '220', list = 'raids/ophanim,raids/hydra,raids/kitsune,raids/chronos,raids/inferno,bosses/forest,bosses/celestial'] = process.argv.slice(2)
const S = +sizeArg
const browser = await chromium.launch({ headless: true, args: ['--mute-audio'] })
const RASTER = ['RasterDecoderImpl::DoEndRasterCHROMIUM', 'RasterTask', 'TileTaskManagerImpl::RunTask', 'RasterizerTaskImpl::RunOnWorkerThread']
async function measure(kind, motif, how) {
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } })
  await page.addInitScript(() => { try { window.speechSynthesis.speak = () => {} } catch { /* none */ } })
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => [...document.querySelectorAll('style')].some((s) => s.textContent.includes('--c-brand')), null, { timeout: 90000 })
  await page.evaluate(async ({ kind, motif, how, S }) => {
    window.__ebikiArtEager = how === 'old'
    window.__ebikiNoBake = how === 'clock'
    const style = [...document.querySelectorAll('style')].map((s) => s.outerHTML).join('')
    document.body.innerHTML = `${style}<div id="host"></div>`
    document.body.style.zoom = '1'
    const { mount } = await import('/dev/bake-sweep/harness.jsx')
    mount(document.getElementById('host'), { kind, motif, phase: kind === 'raids' ? 3 : 1, size: S, animated: 'idle' })
  }, { kind, motif, how, S })
  if (how === 'now') await page.waitForFunction(() => !!document.querySelector('#host svg image[href^="blob:"]'), null, { timeout: 90000 })
  await page.waitForTimeout(2500)
  await browser.startTracing(page, { categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'blink', 'cc', 'viz', 'gpu'] })
  await page.waitForTimeout(3000)
  const ev = JSON.parse((await browser.stopTracing()).toString()).traceEvents
  await page.close()
  const sum = {}
  for (const e of ev) if (e.ph === 'X' && e.dur) sum[e.name] = (sum[e.name] || 0) + e.dur / 1000
  const per = (n) => (sum[n] || 0) / 3
  return { main: per('ProxyMain::BeginMainFrame') + per('TimerFire') + per('FireAnimationFrame'), raster: RASTER.reduce((a, n) => a + per(n), 0), paint: per('LocalFrameView::RunPaintLifecyclePhase') }
}
console.log(`size ${S}px, ms of work per second (lower is better)`)
for (const item of list.split(',')) {
  const [kind, motif] = item.split('/')
  const r = {}
  for (const how of ['old', 'clock', 'now']) r[how] = await measure(kind, motif, how)
  const f = (x) => `main ${x.main.toFixed(0).padStart(4)} raster ${x.raster.toFixed(0).padStart(4)} paint ${x.paint.toFixed(0).padStart(3)}`
  console.log(`${item.padEnd(16)} OLD ${f(r.old)} | CLOCK ${f(r.clock)} | NOW ${f(r.now)}`)
}
await browser.close()
