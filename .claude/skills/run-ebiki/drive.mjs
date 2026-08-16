// Headless-Chromium driver for the Ebiki dev server. See SKILL.md.
//
//   node drive.mjs                      smoke: load app, open Settings > Learning modes
//   node drive.mjs --studio "brief"     also opens Ebi Studio with that brief (COSTS one AI call)
//   SHOTS=/some/dir node drive.mjs      where screenshots land (default /tmp/ebiki-run/shots)
//
// Needs playwright-core resolvable and a chromium binary; SKILL.md has the one-liner.
import { chromium } from 'playwright-core'
import fs from 'fs'

const APP_URL = process.env.APP_URL || 'http://localhost:3000/'
const CHROME = process.env.CHROME_BIN || '/usr/bin/chromium'
const SHOTS = (process.env.SHOTS || '/tmp/ebiki-run/shots').replace(/\/?$/, '/')
const studioAt = process.argv.indexOf('--studio')
const brief = studioAt > -1 ? (process.argv[studioAt + 1] || 'Learn persuasion and negotiation') : null

fs.mkdirSync(SHOTS, { recursive: true })
const errors = []
let n = 0

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`) })

const shot = async (label) => {
  const f = `${SHOTS}${String(++n).padStart(2, '0')}-${label}.png`
  await page.screenshot({ path: f })
  console.log('shot:', f)
}

// "Talk to Ebi" is the header button: it only exists once the app is past config
// load and onboarding, so it is the real ready signal (the shell paints earlier).
await page.goto(APP_URL, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('text=Talk to Ebi', { timeout: 30000 })
await shot('app')

await page.getByRole('button', { name: /⚙/ }).first().click()
await page.waitForSelector('text=Settings', { timeout: 10000 })
await page.getByRole('button', { name: 'Learning modes' }).first().click()
await page.waitForSelector('input[placeholder^="What do you want to learn"]', { timeout: 10000 })
await shot('modes-pane')

if (brief) {
  await page.fill('input[placeholder^="What do you want to learn"]', brief)
  await page.getByRole('button', { name: /Design in depth with Ebi/ }).click()
  await page.waitForSelector('text=Design a learning mode with Ebi', { timeout: 10000 })
  await page.waitForTimeout(400)
  await shot('studio-opened')
  console.log('brief seeded into the conversation:', (await page.locator(`text=${brief}`).count()) > 0)
  console.log('panel box:', JSON.stringify(await panelBox(page)))
  await page.waitForTimeout(15000)   // Ebi's first reply
  await shot('studio-reply')
}

console.log('console errors:', errors.length ? JSON.stringify(errors.slice(0, 10), null, 2) : 'none')
await browser.close()

// Geometry of the studio panel against the real viewport. Modal overflow bugs in
// this app come from body { zoom: 1.35 }, so measure instead of eyeballing:
// left/top should equal vw-right / vh-bottom (centered) and nothing may be < 0.
async function panelBox(p) {
  return p.locator('text=Design a learning mode with Ebi').evaluate((el) => {
    const panel = el.closest('div[style*="flex-direction: column"]') || el.parentElement.parentElement
    const r = panel.getBoundingClientRect()
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, vw: window.innerWidth, vh: window.innerHeight }
  })
}
