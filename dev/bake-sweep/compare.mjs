// SWEEP: every boss and raid boss (each phase, the entrance, each ability effect), baked vs vector at the same frozen
// moments, pixel-diffed. Playwright's bundled Chromium only (never the installed Chrome), muted.
// node dev/bake-sweep/compare.mjs [filter] [dpr]
import fs from 'fs'
import os from 'os'
import path from 'path'
import { pathToFileURL } from 'url'
import { createRequire } from 'module'
const { chromium } = await import(pathToFileURL(path.join(os.homedir(), '.ebiki-drive', 'node_modules', 'playwright-core', 'index.mjs')).href)
const sharp = createRequire(path.resolve('package.json'))('sharp')
const [filter = '', dprArg = '1'] = process.argv.slice(2)
const S = 200
const OUT = '.scratch/bake-sweep'
fs.mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ headless: true, args: ['--mute-audio'] })
const ctx = await browser.newContext({ viewport: { width: 520, height: 520 }, deviceScaleFactor: +dprArg })
await ctx.addInitScript(() => { try { window.speechSynthesis.speak = () => {} } catch { /* none */ } })
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text().slice(0, 240)) })
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => [...document.querySelectorAll('style')].some((s) => s.textContent.includes('--c-brand')), null, { timeout: 90000 })
const setup = await page.evaluate(async () => {
  const { MOTIFS } = await import('/src/features/legends/map.js')
  const { RAID_MOTIFS, RAID_ABILITY } = await import('/src/features/legends/raid.js')
  const { abilityById } = await import('/src/features/legends/abilities/index.js')
  const { fxDemoFor } = await import('/src/features/legends/fx/index.js')
  const style = [...document.querySelectorAll('style')].map((s) => s.outerHTML).join('')
  document.body.innerHTML = `${style}<div id="host" style="background:#1b1f2a;display:inline-block"></div>`
  document.body.style.zoom = '1'
  const list = []
  for (const m of MOTIFS) { list.push({ kind: 'bosses', motif: m, animated: 'idle' }); list.push({ kind: 'bosses', motif: m, animated: 'intro' }); list.push({ kind: 'areas', motif: m, animated: 'idle' }) }
  for (const m of RAID_MOTIFS) {
    for (const phase of [1, 2, 3]) list.push({ kind: 'raids', motif: m, animated: 'idle', phase })
    list.push({ kind: 'raids', motif: m, animated: 'intro', phase: 1 })
    const ability = RAID_ABILITY[m]
    for (const fx of abilityById(ability)?.fxKeys || []) list.push({ kind: 'raids', motif: m, animated: 'idle', phase: 2, ability, fx, ab: fxDemoFor(ability, fx)?.ab || {} })
  }
  return list
})
const configs = setup.filter((c) => !filter || `${c.kind}/${c.motif}`.includes(filter))
const name = (c) => `${c.kind}-${c.motif}-${c.animated}${c.phase ? '-p' + c.phase : ''}${c.fx ? '-' + c.fx : ''}`
const TIMES = { idle: [0.7, 2.2, 3.9], intro: [0.35, 1.1, 3.2] }

async function shots(c, noBake) {
  await page.evaluate(async ({ c, noBake }) => {
    window.__ebikiArtFreeze = false
    window.__ebikiNoBake = noBake
    const { mount } = await import('/dev/bake-sweep/harness.jsx')
    mount(document.getElementById('host'), c)
  }, { c, noBake })
  const ok = noBake
    ? await page.waitForFunction(() => !!document.querySelector('#host svg'), null, { timeout: 30000 }).then(() => true, () => false)
    : await page.waitForFunction(() => !!document.querySelector('#host svg image[href^="blob:"]'), null, { timeout: 60000 }).then(() => true, () => false)
  if (!ok) return null
  await page.waitForTimeout(300)
  const out = []
  for (const t of TIMES[c.animated]) {
    await page.evaluate((t) => {
      window.__ebikiArtFreeze = true
      for (const s of document.querySelectorAll('#host svg')) { try { s.pauseAnimations(); s.setCurrentTime(t) } catch { /* inner svg */ } }
      for (const a of document.getAnimations()) { try { a.pause(); a.currentTime = 250 } catch { /* gone */ } }
    }, t)
    await page.waitForTimeout(+(process.env.FREEZE_WAIT || 120))
    out.push(await page.locator('#host').screenshot())
  }
  return out
}

const rows = []
for (const [i, c] of configs.entries()) {
  // a drawing under the bake threshold stays vector on purpose: identical by definition
  const worth = await page.evaluate(async (c) => {
    const { worthBaking } = await import('/src/features/legends/bakePlan.js')
    return worthBaking(await (await fetch(`/assets/legends/${c.kind}/${c.motif}.svg`)).text())
  }, c)
  if (!worth) { rows.push({ name: name(c), big: 0, mean: 0, vector: true }); console.log(i + 1, '/', configs.length, name(c), 'stays vector (small drawing)'); continue }
  const vec = await shots(c, true)
  const bak = await shots(c, false)
  if (!vec || !bak) { rows.push({ name: name(c), fail: !bak ? 'no bake' : 'no vector' }); console.log(i, name(c), 'FAILED'); continue }
  let worst = { big: 0, mean: 0, k: 0 }
  for (let k = 0; k < vec.length; k++) {
    const a = await sharp(vec[k]).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const b = await sharp(bak[k]).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    if (a.info.width !== b.info.width || a.info.height !== b.info.height) { worst = { big: 100, mean: 255, k }; break }
    let diff = 0, big = 0
    const px = a.data.length / 4
    for (let j = 0; j < a.data.length; j += 4) {
      const d = Math.max(Math.abs(a.data[j] - b.data[j]), Math.abs(a.data[j + 1] - b.data[j + 1]), Math.abs(a.data[j + 2] - b.data[j + 2]))
      diff += d
      if (d > 64) big++
    }
    const r = { big: (big / px) * 100, mean: diff / px, k }
    if (r.big > worst.big) worst = r
    if (r.big > 0.3) {
      const w = a.info.width
      await sharp({ create: { width: w * 2 + 8, height: a.info.height, channels: 4, background: '#ffffff' } })
        .composite([{ input: vec[k], left: 0, top: 0 }, { input: bak[k], left: w + 8, top: 0 }]).png().toFile(`${OUT}/${name(c)}-${k}.png`)
    }
  }
  rows.push({ name: name(c), big: +worst.big.toFixed(3), mean: +worst.mean.toFixed(2) })
  console.log(i + 1, '/', configs.length, name(c), `worst moment: ${worst.big.toFixed(3)}% pixels off > 64, mean ${worst.mean.toFixed(2)}`)
}
fs.writeFileSync(`${OUT}/results-dpr${dprArg}.json`, JSON.stringify(rows, null, 1))
const bad = rows.filter((r) => r.fail || r.big > 0.3)
console.log(`\n${rows.length} configs, ${bad.length} over 0.3% (see ${OUT})`)
for (const r of bad) console.log(' ', r.name, r.fail || `${r.big}%`)
console.log(errors.length ? 'console:\n' + [...new Set(errors)].join('\n') : 'no console errors or warnings')
await browser.close()
