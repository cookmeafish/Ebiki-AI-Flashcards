// Vector and baked side by side in ONE page, frozen at chosen moments, 3x device pixels.
// node dev/bake-sweep/pair-look.mjs <kind> <motif> <animated> <phase> <t,t,...>
import os from 'os'
import path from 'path'
import { pathToFileURL } from 'url'
const { chromium } = await import(pathToFileURL(path.join(os.homedir(), '.ebiki-drive', 'node_modules', 'playwright-core', 'index.mjs')).href)
const [kind = 'raids', motif = 'vampire', animated = 'intro', phase = '1', times = '0.2,0.35,0.6', waitMs = '200', dprA = '3'] = process.argv.slice(2)
const browser = await chromium.launch({ headless: true, args: ['--mute-audio'] })
const ctx = await browser.newContext({ viewport: { width: 700, height: 360 }, deviceScaleFactor: +dprA })
const page = await ctx.newPage()
await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => [...document.querySelectorAll('style')].some((s) => s.textContent.includes('--c-brand')), null, { timeout: 90000 })
await page.evaluate(async ({ kind, motif, animated, phase }) => {
  const style = [...document.querySelectorAll('style')].map((s) => s.outerHTML).join('')
  document.body.innerHTML = `${style}<div style="display:flex;background:#1b1f2a"><div id="a"></div><div id="b"></div></div>`
  document.body.style.zoom = '1'
  const h1 = await import('/dev/bake-sweep/harness.jsx?a')
  const h2 = await import('/dev/bake-sweep/harness.jsx?b')
  window.__ebikiNoBake = true
  h1.mount(document.getElementById('a'), { kind, motif, animated, phase: +phase, size: 200 })
  await new Promise((r) => setTimeout(r, 400))
  window.__ebikiNoBake = false
  h2.mount(document.getElementById('b'), { kind, motif, animated, phase: +phase, size: 200 })
}, { kind, motif, animated, phase })
await page.waitForFunction(() => !!document.querySelector('#b svg image[href^="blob:"]'), null, { timeout: 120000 })
await page.waitForTimeout(500)
for (const t of times.split(',')) {
  await page.evaluate((t) => {
    window.__ebikiArtFreeze = true
    for (const s of document.querySelectorAll('svg')) { try { s.pauseAnimations(); s.setCurrentTime(+t) } catch { /* nested */ } }
    for (const a of document.getAnimations()) { try { a.pause(); a.currentTime = 250 } catch { /* gone */ } }
  }, t)
  await page.waitForTimeout(+waitMs)
  await page.screenshot({ path: `.scratch/bake-sweep/pair-${motif}-${animated}-${t}-w${waitMs}.png` })
  console.log(`.scratch/bake-sweep/pair-${motif}-${animated}-${t}-w${waitMs}.png`)
}
await browser.close()
