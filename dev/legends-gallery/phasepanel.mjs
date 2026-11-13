// The owner's view of a raid boss: the asset view's "Phase drawings" panel, all phases side by side, as he sees it.
//   node dev/legends-gallery/phasepanel.mjs <motif> <out.png> [deviceScaleFactor=1]
// Needs the agent dev server (`npm run dev:agent`, port 3001; EBIKI_APP_URL overrides) and cheat mode on so the
// Asset view button shows. Every data write is stubbed; port 3000 is the OWNER's app: never point this at it.
import fs from 'fs'
import os from 'os'
import path from 'path'
import { pathToFileURL } from 'url'
const DEPS = process.env.EBIKI_DRIVE_DEPS || path.join(os.homedir(), '.ebiki-drive')
const pw = path.join(DEPS, 'node_modules', 'playwright-core', 'index.mjs')
if (!fs.existsSync(pw)) { console.error('playwright-core is missing: run `npm run drive` once to install it.'); process.exit(2) }
const { chromium } = await import(pathToFileURL(pw).href)
const motif = process.argv[2]
const out = process.argv[3]
if (!motif || !out) { console.error('usage: phasepanel.mjs <motif> <out.png> [deviceScaleFactor]'); process.exit(2) }
const browser = await chromium.launch({ headless: true, args: ['--mute-audio'] })
const ctx = await browser.newContext({ deviceScaleFactor: Number(process.argv[4] || 1), viewport: { width: 1600, height: 1000 }, colorScheme: 'dark' })
const page = await ctx.newPage()
await page.addInitScript(() => { try { window.speechSynthesis.speak = () => {}; HTMLMediaElement.prototype.play = () => Promise.resolve() } catch {} })
await page.route('**/api/**', (r) => (r.request().method() === 'GET' ? r.continue() : r.fulfill({ status: 204, body: '' })))
await page.route((u) => u.pathname === '/api/config', async (r) => { if (r.request().method() !== 'GET') return r.fulfill({ status: 204, body: '' }); const res = await r.fetch(); const j = await res.json(); j.lastModelCheck = Date.now(); r.fulfill({ response: res, json: j }) })
await page.route('**/@vite/client', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: 'export const createHotContext = () => ({ accept(){}, dispose(){}, prune(){}, invalidate(){}, on(){}, off(){}, send(){}, data: {} }); export const injectQuery = (u) => u; export const updateStyle = (id, css) => { let s = document.querySelector(`style[data-vite-dev-id="${id}"]`); if (!s) { s = document.createElement("style"); s.setAttribute("data-vite-dev-id", id); document.head.appendChild(s) } s.textContent = css }; export const removeStyle = () => {};' }))
await page.goto(process.env.EBIKI_APP_URL || 'http://localhost:3001/')
await page.getByText('Talk to Ebi').first().waitFor({ timeout: 30000 })
await page.getByRole('button', { name: /Asset view/ }).first().click()
await page.getByText(/Raid bosses/).first().click()
await page.waitForTimeout(1500)
let found = false
for (let i = 0; i < 40; i++) {
  const f = await page.evaluate(() => [...document.querySelectorAll('span')].map((n) => n.textContent).find((t) => /^raids\/\w+\.svg$/.test(t)))
  if (f === `raids/${motif}.svg`) { found = true; break }
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(250)
}
if (!found) { console.log('motif not found'); await browser.close(); process.exit(1) }
const head = page.getByText('Phase drawings').first()
await head.scrollIntoViewIfNeeded()
await page.waitForTimeout(2500)
const b = await head.boundingBox()
await page.screenshot({ path: out, clip: { x: 0, y: Math.max(0, b.y - 10), width: 1600, height: 640 } })
console.log('ok')
await browser.close()
