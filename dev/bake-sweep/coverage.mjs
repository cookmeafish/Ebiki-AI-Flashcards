// How much of each drawing the bake turns into bitmaps: vector shapes left vs shapes in the source, per boss/mode.
// node dev/bake-sweep/coverage.mjs [filter]
import os from 'os'
import path from 'path'
import { pathToFileURL } from 'url'
const { chromium } = await import(pathToFileURL(path.join(os.homedir(), '.ebiki-drive', 'node_modules', 'playwright-core', 'index.mjs')).href)
const [filter = ''] = process.argv.slice(2)
const browser = await chromium.launch({ headless: true, args: ['--mute-audio'] })
const page = await browser.newPage({ viewport: { width: 520, height: 520 } })
await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => [...document.querySelectorAll('style')].some((s) => s.textContent.includes('--c-brand')), null, { timeout: 90000 })
const list = await page.evaluate(async () => {
  const { MOTIFS } = await import('/src/features/legends/map.js')
  const { RAID_MOTIFS } = await import('/src/features/legends/raid.js')
  const style = [...document.querySelectorAll('style')].map((s) => s.outerHTML).join('')
  document.body.innerHTML = `${style}<div id="host"></div>`
  document.body.style.zoom = '1'
  return [...RAID_MOTIFS.flatMap((m) => [['raids', m, 'idle'], ['raids', m, 'intro']]), ...MOTIFS.flatMap((m) => [['bosses', m, 'idle'], ['bosses', m, 'intro'], ['areas', m, 'idle']])]
})
const SHAPES = 'path,circle,ellipse,rect,polygon,polyline,line'
let tot = [0, 0]
for (const [kind, motif, animated] of list.filter((x) => !filter || x.join('/').includes(filter))) {
  const r = await page.evaluate(async ({ kind, motif, animated, SHAPES }) => {
    window.__ebikiNoBake = false
    const { mount } = await import('/dev/bake-sweep/harness.jsx')
    mount(document.getElementById('host'), { kind, motif, animated, phase: 2, size: 200 })
    for (let i = 0; i < 900 && !document.querySelector('#host svg image[href^="blob:"]'); i++) await new Promise((res) => setTimeout(res, 100))
    const svg = document.querySelector('#host svg')
    const src = await (await fetch(`/assets/legends/${kind}/${motif}.svg`)).text()
    const before = (src.match(/<(path|circle|ellipse|rect|polygon|polyline|line)\b/g) || []).length
    const left = svg ? svg.querySelectorAll(SHAPES).length : 0
    const imgs = svg ? svg.querySelectorAll('image[href^="blob:"]').length : 0
    const st = (window.__ebikiBakeStats || []).at(-1) || {}
    return { before, left, imgs, ms: st.ms, scaleMs: st.scaleMs }
  }, { kind, motif, animated, SHAPES })
  tot = [tot[0] + r.before, tot[1] + r.left]
  console.log(`${kind}/${motif} ${animated}`.padEnd(26), `shapes ${String(r.before).padStart(5)} -> vector ${String(r.left).padStart(5)} (${Math.round((r.left / r.before) * 100)}%), bitmaps ${r.imgs}, bake ${r.ms} ms (timeline ${r.scaleMs} ms)`)
}
console.log(`ALL: ${tot[0]} shapes, ${tot[1]} still vector (${Math.round((tot[1] / tot[0]) * 100)}%)`)
await browser.close()
