// Linux file systems are case-sensitive; Windows and macOS (by default) are not. A path written with the wrong case
// works on the machine where it was written and 404s (an asset) or fails to build (an import) on Linux. This test reads
// every import / require / dynamic import and every static asset URL in src/, dev/, electron/ and scripts/, plus the
// data-driven asset lists (Ebi poses, nav icons, Legends and raid art, power icons, the ophanim photo sprites), and
// checks each target exists with EXACT case on disk.
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { builtinModules } from 'module'
import { SHRIMP } from './config/shrimp'
import { CORE_NAV } from './shell/layout'
import { MOTIFS } from './features/legends/map'
import { RAID_MOTIFS } from './features/legends/raid'
import { POWER_IDS } from './features/legends/powers'
import { PHOTO_SPRITES, artUrl } from './features/legends/art'

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const SCAN = ['src', 'dev', 'electron', 'scripts']
const CODE = /\.(m?jsx?|cjs|tsx?)$/
const HTML = /\.html?$/
const SKIP_DIR = new Set(['node_modules', '.scratch', 'dist', '.git'])
const RESOLVE_EXT = ['', '.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.json', '/index.js', '/index.jsx', '/index.mjs']

function walk(dir, out = []) {
  let entries
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return out }
  for (const e of entries) {
    if (SKIP_DIR.has(e.name)) continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (CODE.test(e.name) || HTML.test(e.name)) out.push(p)
  }
  return out
}

const listing = new Map()
const names = (dir) => {
  if (!listing.has(dir)) { try { listing.set(dir, fs.readdirSync(dir)) } catch { listing.set(dir, null) } }
  return listing.get(dir)
}
// 'ok' (exists, exact case), 'case' (exists only with other case: the Linux bug), 'missing'
function caseState(abs) {
  const rel = path.relative(ROOT, abs)
  if (rel.startsWith('..') || path.isAbsolute(rel)) return fs.existsSync(abs) ? 'ok' : 'missing'
  let dir = ROOT
  for (const seg of rel.split(/[\\/]/).filter(Boolean)) {
    const list = names(dir)
    if (!list) return 'missing'
    if (!list.includes(seg)) return list.some((n) => n.toLowerCase() === seg.toLowerCase()) ? 'case' : 'missing'
    dir = path.join(dir, seg)
  }
  return 'ok'
}
// an import specifier resolved like the bundler: first candidate that exists (any case) decides
function resolveState(base) {
  let sawCase = false
  for (const ext of RESOLVE_EXT) {
    const s = caseState(base + ext)
    if (s === 'ok') return 'ok'
    if (s === 'case') sawCase = true
  }
  return sawCase ? 'case' : 'missing'
}

// Comments hold plenty of example paths; drop them (strings are kept: a // inside quotes is a URL, not a comment).
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1')
    .replace(/<!--[\s\S]*?-->/g, '')
}

const IMPORT_RES = [
  /\b(?:import|export)\s+(?:[^'"`;]*?\s+from\s*)?['"]([^'"\n]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"\n]+)['"]\s*\)/g,
  /\brequire\s*\(\s*['"]([^'"\n]+)['"]\s*\)/g,
  /\bnew\s+URL\s*\(\s*['"]([^'"\n]+)['"]\s*,\s*import\.meta\.url/g,
]
const HTML_RES = [/\b(?:src|href)\s*=\s*["']([^"'#?]+)["']/g]
// a static app URL into public/ (assets, the app icon, the art folders); template parts are checked up to the first ${
const ASSET_RE = /['"`(](\/(?:assets|legends|ebi|icons?|fonts?|sounds?|audio|img|images)\/[^'"`\s?#)]*)/g

const builtins = new Set(builtinModules.flatMap((m) => [m, `node:${m}`]))
function bareState(spec) {
  if (builtins.has(spec) || spec.startsWith('node:') || spec.startsWith('virtual:') || spec.includes('?')) return 'ok'
  const parts = spec.split('/')
  const pkg = spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
  const s = caseState(path.join(ROOT, 'node_modules', pkg))
  return s === 'case' ? 'case' : 'ok' // an uninstalled optional package is not a case problem
}

const files = SCAN.flatMap((d) => walk(path.join(ROOT, d)))

describe('paths match the disk with exact case (Linux is case-sensitive)', () => {
  it('scans a real tree, and the checker catches a wrong case', () => {
    expect(files.length).toBeGreaterThan(100)
    expect(caseState(path.join(ROOT, 'src', 'Config', 'shrimp.js'))).toBe('case')
    expect(resolveState(path.join(ROOT, 'src', 'config', 'Shrimp'))).toBe('case')
    expect(caseState(path.join(PUBLIC, 'assets', 'legends', 'raids', 'Ophanim.svg'))).toBe('case')
    expect(resolveState(path.join(ROOT, 'src', 'config', 'shrimp'))).toBe('ok')
  })

  it('every relative / root import, require and dynamic import names a file with its exact case', () => {
    const bad = []
    let checked = 0
    for (const file of files) {
      const raw = fs.readFileSync(file, 'utf8')
      const src = stripComments(raw)
      const res = HTML.test(file) ? HTML_RES : IMPORT_RES
      for (const re of res) {
        for (const m of src.matchAll(re)) {
          const spec = m[1]
          if (/^(https?:|data:|mailto:|\/\/)/.test(spec) || spec.includes('${')) continue
          let state
          if (spec.startsWith('.')) state = resolveState(path.resolve(path.dirname(file), spec))
          else if (spec.startsWith('/')) {
            // root paths: the app root (vite serves /src, /dev) or public/ (assets)
            const a = resolveState(path.join(ROOT, spec)), b = resolveState(path.join(PUBLIC, spec))
            state = a === 'ok' || b === 'ok' ? 'ok' : (a === 'case' || b === 'case' ? 'case' : (HTML.test(file) ? 'missing' : 'ok'))
          } else if (HTML.test(file)) continue
          else state = bareState(spec)
          checked++
          if (state !== 'ok') bad.push(`${path.relative(ROOT, file)}: ${spec} (${state})`)
        }
      }
    }
    expect(checked).toBeGreaterThan(1000)
    expect(bad).toEqual([])
  })

  it('every static asset URL string points at a public/ file or folder with its exact case', () => {
    const bad = []
    let assets = 0
    for (const file of files) {
      const src = stripComments(fs.readFileSync(file, 'utf8'))
      for (const m of src.matchAll(ASSET_RE)) {
        let url = m[1]
        const tpl = url.indexOf('${')
        // a template: check the folder part before the first interpolation
        if (tpl >= 0) url = url.slice(0, url.lastIndexOf('/', tpl) + 1)
        url = url.replace(/\/+$/, '')
        if (!url || url.startsWith('/assets/ebi/') || url === '/assets/ebi') continue // served resized by ebi-images.js
        let decoded = url
        try { decoded = decodeURIComponent(url) } catch { /* keep as written */ }
        assets++
        const state = caseState(path.join(PUBLIC, decoded))
        if (state === 'case') bad.push(`${path.relative(ROOT, file)}: ${url} (case)`)
        // only a FILE name is required to exist: a bare prefix like '/assets/legends' is a base, checked as a folder
        else if (state === 'missing') bad.push(`${path.relative(ROOT, file)}: ${url} (missing)`)
      }
    }
    expect(assets).toBeGreaterThan(10)
    expect(bad).toEqual([])
  })

  it('data-driven assets (poses, nav icons, Legends and raid art, power icons, photo sprites) match exactly', () => {
    const urls = [
      ...SHRIMP.map((s) => `/assets/shrimp/${s.file}`),
      ...CORE_NAV.filter((n) => n.art).map((n) => `/assets/nav/${n.art}.svg`),
      ...MOTIFS.flatMap((m) => [artUrl('areas', m), artUrl('bosses', m)]),
      ...RAID_MOTIFS.map((m) => artUrl('raids', m)),
      ...POWER_IDS.map((id) => `/assets/legends/powers/${id}.svg`),
      ...Object.values(PHOTO_SPRITES).map((s) => s.url),
    ]
    // feature nav icons (`art: 'x'` inside navItems)
    for (const file of walk(path.join(ROOT, 'src', 'features'))) {
      if (!/[\\/]index\.jsx?$/.test(file)) continue
      for (const m of fs.readFileSync(file, 'utf8').matchAll(/\bart:\s*'([\w-]+)'/g)) urls.push(`/assets/nav/${m[1]}.svg`)
    }
    expect(urls.length).toBeGreaterThan(40)
    const bad = urls.filter((u) => caseState(path.join(PUBLIC, u)) !== 'ok').map((u) => `${u} (${caseState(path.join(PUBLIC, u))})`)
    expect(bad).toEqual([])
  })
})
