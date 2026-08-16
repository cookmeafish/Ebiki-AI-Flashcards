// Headless-browser driver for the running Ebiki dev server. See SKILL.md.
//
//   npm run drive                        smoke: load app, open Settings > Learning modes
//   npm run drive -- --studio "brief"    also opens Ebi Studio with that brief (COSTS one AI call)
//   npm run drive -- --url http://…      point at a different host/port
//
// Self-bootstrapping: playwright-core is installed on first run into a folder
// OUTSIDE the repo (~/.ebiki-drive, override with EBIKI_DRIVE_DEPS), so a fresh
// clone needs no setup and package.json gains no dependency. The browser is the
// one already on the machine (Chrome / Chromium / Edge); nothing is downloaded.
import { spawnSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { pathToFileURL } from 'url'

const argv = process.argv.slice(2)
const flag = (name, dflt = null) => { const i = argv.indexOf(name); return i > -1 ? (argv[i + 1] ?? true) : dflt }

const APP_URL = flag('--url') || process.env.APP_URL || 'http://localhost:3000/'
const SHOTS = path.join(flag('--shots') || process.env.SHOTS || path.join(os.tmpdir(), 'ebiki-drive-shots'), '/')
const brief = argv.includes('--studio') ? (flag('--studio') === true ? 'Learn persuasion and negotiation' : flag('--studio')) : null

// ── deps ───────────────────────────────────────────────────────────────────
const DEPS = process.env.EBIKI_DRIVE_DEPS || path.join(os.homedir(), '.ebiki-drive')
const entry = path.join(DEPS, 'node_modules', 'playwright-core', 'index.mjs')
if (!fs.existsSync(entry)) {
  console.log('installing playwright-core into', DEPS, '(first run only)')
  fs.mkdirSync(DEPS, { recursive: true })
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const r = spawnSync(npm, ['install', '--no-fund', '--no-audit', 'playwright-core'], { cwd: DEPS, stdio: 'inherit', shell: process.platform === 'win32' })
  if (r.status !== 0 || !fs.existsSync(entry)) { console.error('could not install playwright-core'); process.exit(1) }
}
const { chromium } = await import(pathToFileURL(entry).href)

// ── browser ────────────────────────────────────────────────────────────────
// Whatever Chromium-family browser the machine already has. Ebiki targets
// Windows first, so Chrome and Edge paths matter as much as the Linux ones.
const CANDIDATES = {
  linux: ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/snap/bin/chromium'],
  darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'],
  win32: [
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ],
}
const CHROME = process.env.CHROME_BIN || (CANDIDATES[process.platform] || []).find((p) => p && fs.existsSync(p))
if (!CHROME) {
  console.error(`no Chrome/Chromium/Edge found for ${process.platform}. Install one, or set CHROME_BIN to its executable.`)
  process.exit(1)
}

// ── drive ──────────────────────────────────────────────────────────────────
fs.mkdirSync(SHOTS, { recursive: true })
const errors = []
let n = 0

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
// The generic "Failed to load resource" console line names no URL, so it is dropped
// in favour of the CDP feed below, which does. Browser-initiated requests (favicon)
// never reach page.on('response'), which is why that lone 404 looks anonymous.
page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
const cdp = await context.newCDPSession(page)
await cdp.send('Network.enable')
cdp.on('Network.responseReceived', (e) => {
  if (e.response.status >= 400 && !/\/favicon\.ico$/.test(e.response.url)) errors.push(`${e.response.status} ${e.response.url}`)
})

const shot = async (label) => {
  const f = `${SHOTS}${String(++n).padStart(2, '0')}-${label}.png`
  await page.screenshot({ path: f })
  console.log('shot:', f)
}

try {
  // "Talk to Ebi" is the header button: it only exists once config has loaded and
  // onboarding is past, so it is the real ready signal (the shell paints earlier).
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
} catch (e) {
  await shot('failure')                // a screenshot of the stuck state beats the stack alone
  console.error('drive failed:', e.message)
  process.exitCode = 1
} finally {
  console.log('console errors:', errors.length ? JSON.stringify(errors.slice(0, 10), null, 2) : 'none')
  await browser.close()
}

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
