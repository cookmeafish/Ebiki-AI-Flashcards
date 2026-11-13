// THE ONE silhouette check for raid bosses (owner: "it needs to be more different each phase").
//   node dev/legends-gallery/silhouettes.mjs <motif> [size=60] [--hide=<css selector of background/aura>] [--file=<svg>] [--out=<dir>]
// Each phase is rendered still at FRAME 0 (what the app's still views show), in the boss box plus headroom
// (-24..144), as an alpha mask; pairwise IoU is printed for the boss and for the owner-approved kitsune pinned at
// commit e7328b3 (so a kitsune being edited never moves the bar). Rule: EACH pair must be no more alike than the
// kitsune's SAME pair (her highest pair alone let the owner-rejected Showman pass). Run it again with --hide=<its
// background> so the change is on the CHARACTER, not only its backdrop: body-only pairs get 0.05 of margin, except
// P1-P3, which gets none (CLAUDE.md checkmark 6). No browser server needed.
// Writes .scratch/silhouettes/<motif>/silhouettes[-nobg].png (gitignored; boss row over kitsune row, solid black).
import os from 'os'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { pathToFileURL, fileURLToPath } from 'url'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const sharp = require('sharp')
const DEPS = process.env.EBIKI_DRIVE_DEPS || path.join(os.homedir(), '.ebiki-drive')
const pw = path.join(DEPS, 'node_modules', 'playwright-core', 'index.mjs')
if (!fs.existsSync(pw)) { console.error('playwright-core is missing: run `npm run drive` once to install it.'); process.exit(2) }
const { chromium } = await import(pathToFileURL(pw).href)
const motif = process.argv[2]
if (!motif) { console.error('usage: silhouettes.mjs <motif> [size] [--hide=sel] [--file=svg] [--out=dir]'); process.exit(2) }
const SIZE = Number(process.argv.find((a, i) => i > 2 && /^\d+$/.test(a)) || 60)
const hide = (process.argv.find((a) => a.startsWith('--hide=')) || '').slice(7)
const box = (s) => s.replace(/viewBox="[^"]*"/, 'viewBox="-24 -24 168 168"')
const files = {
  [motif]: box(fs.readFileSync((process.argv.find((a) => a.startsWith('--file=')) || '').slice(7) || path.join(root, 'public/assets/legends/raids', `${motif}.svg`), 'utf8')),
  kitsuneRef: box(execSync('git show e7328b3:public/assets/legends/raids/kitsune.svg', { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26 })),
}
const b = await chromium.launch({ headless: true, args: ['--mute-audio'] })
const p = await b.newPage({ viewport: { width: SIZE, height: SIZE } })
const masks = {}, shots = {}
for (const [name, svg] of Object.entries(files)) {
  for (const phase of [1, 2, 3]) {
    await p.setContent(`<html><body style="margin:0;background:transparent"><div style="width:${SIZE}px;height:${SIZE}px">${svg}</div></body></html>`)
    await p.evaluate(({ phase, hide }) => {
      const s = document.querySelector('svg'); s.setAttribute('width', '100%'); s.setAttribute('height', '100%')
      const show = (sel, on) => document.querySelectorAll(sel).forEach((e) => { e.style.display = on ? '' : 'none' })
      show('.lg-p1', phase === 1); show('.lg-p2', phase >= 2); show('.lg-p3', phase >= 3); show('.lg-p12', phase < 3)
      document.querySelectorAll('.lg-in').forEach((e) => e.remove()) // the app strips the entrance in every still view; frame 0 must be the finished pose
      if (hide) document.querySelectorAll(hide).forEach((e) => { e.style.display = 'none' })
      s.pauseAnimations(); s.setCurrentTime(0)
    }, { phase, hide: name === 'kitsuneRef' ? (hide ? '.lg-kitsune-tails, .lg-kitsune-tail, .lg-kitsune-fires' : '') : hide }) // body-only runs compare BODY with BODY: her tails and fox-fires are her aura
    const buf = await p.screenshot({ omitBackground: true })
    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const m = new Uint8Array(info.width * info.height)
    const black = Buffer.alloc(m.length * 4)
    for (let i = 0; i < m.length; i++) { m[i] = data[i * 4 + 3] > 40 ? 1 : 0; black[i * 4 + 3] = m[i] ? 255 : 0 }
    masks[name + phase] = m
    shots[name + phase] = await sharp(black, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer()
  }
}
await b.close()
const iou = (a, c) => { let i = 0, u = 0; for (let k = 0; k < a.length; k++) { if (a[k] && c[k]) i++; if (a[k] || c[k]) u++ } return u ? i / u : 0 }
const pairs = [[1, 2], [2, 3], [1, 3]]
const row = (n) => pairs.map(([x, y]) => iou(masks[n + x], masks[n + y]))
const boss = row(motif), kit = row('kitsuneRef') // a separate key: run on the kitsune itself, live vs pinned (one key made both rows the pinned copy)
console.log(`frame 0, ${SIZE}px${hide ? `, hidden: ${hide}` : ''}`)
console.log('pair   ' + motif.padEnd(10) + 'kitsune(e7328b3)')
pairs.forEach(([x, y], i) => console.log(`P${x}-P${y}  ${boss[i].toFixed(3).padEnd(10)}${kit[i].toFixed(3)}`))
// Margins. Full view: none (calibrated with entrances stripped: the owner-rejected Showman 0.763/0.733/0.714 fails
// P1-P2 and P1-P3; 0.05 let P1-P3 through). Body-only (--hide): 0.05 on P1-P2 and P2-P3 (the owner-rejected Showman
// body 0.750/0.736/0.705 and Kaleido r12 0.705/0.730/0.732 still fail), none on P1-P3 (the owner's rule).
const tol = ([x, y]) => (hide && !(x === 1 && y === 3) ? 0.05 : 0)
const fails = pairs.filter((pr, i) => boss[i] > kit[i] + tol(pr))
const pass = fails.length === 0
console.log(pass
  ? `PASS (every pair within the kitsune's${hide ? ' + 0.05, P1-P3 + 0' : ''})`
  : 'FAIL: ' + fails.map((pr) => `P${pr[0]}-P${pr[1]} (margin ${tol(pr)})`).join(', ') + ' more alike than the kitsune pair')
const outArg = (process.argv.find((a) => a.startsWith('--out=')) || '').slice(6) // reviewers: --out=<your folder>, so the artist's sheets are not overwritten
const dir = outArg || path.join(root, '.scratch', 'silhouettes', motif); fs.mkdirSync(dir, { recursive: true })
const gap = 8, W = SIZE * 3 + gap * 4, H = SIZE * 2 + gap * 3
const comp = []; ['', 'kitsuneRef'].forEach((n, r) => [1, 2, 3].forEach((ph, c) => comp.push({ input: shots[(n || motif) + ph], left: gap + c * (SIZE + gap), top: gap + r * (SIZE + gap) })))
const file = path.join(dir, `silhouettes${hide ? '-nobg' : ''}.png`)
await sharp({ create: { width: W, height: H, channels: 4, background: '#ffffff' } }).composite(comp).png().toFile(file)
console.log(file)
process.exit(pass ? 0 : 1)
