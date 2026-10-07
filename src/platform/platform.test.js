// Portability rules (for a future iOS / Android build), enforced:
//  - feature LOGIC (src/features/**/*.js) never touches the browser or the local server directly; it goes
//    through src/platform. UI (*.jsx) is web by nature and is exempt, as are declared web adapters (web.js)
//    and the desktop server halves (server.js, storage-server.js).
//  - nothing in src calls Ebiki's own /api without the platform seam.
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { platform, setPlatform, apiFetch } from './index'

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
const SRC = path.resolve(__dirname, '..')
const rel = (f) => path.relative(SRC, f).split(path.sep).join('/')

const FORBIDDEN_IN_LOGIC = [
  [/\bwindow\./, 'window'], [/\bdocument\./, 'document'], [/\blocalStorage\b/, 'localStorage'],
  [/\bsessionStorage\b/, 'sessionStorage'], [/\bnavigator\./, 'navigator'],
]
const EXEMPT_LOGIC = /(\.test\.js|(^|\/)server\.js|storage-server\.js|(^|\/)web\.js)$/

// Feature logic files (not tests, not declared web adapters or server halves).
const featureLogic = () => walk(path.join(SRC, 'features')).filter((x) => x.endsWith('.js') && !EXEMPT_LOGIC.test(rel(x)))
// Every line of `files` that touches the browser, or fetches anything but an outside https service.
function scanLogic(files) {
  const bad = []
  for (const f of files) {
    fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach((line, i) => {
      if (/^\s*\/\//.test(line)) return // comments may mention them
      for (const [re, name] of FORBIDDEN_IN_LOGIC) if (re.test(line)) bad.push(`${rel(f)}:${i + 1} uses ${name}`)
      // fetch only to outside services (an AI provider); Ebiki's own routes go through apiFetch.
      if (/\bfetch\(/.test(line) && !/https?:\/\//.test(line)) bad.push(`${rel(f)}:${i + 1} calls fetch directly`)
    })
  }
  return bad
}

describe('portability', () => {
  it('feature logic stays platform-neutral', () => {
    expect(scanLogic(featureLogic())).toEqual([])
  })

  // The app-level modules feature LOGIC imports (src/config/grading.js, src/cards, src/i18n ...) are part of that logic
  // on a phone too, so they follow the same rule; so do the pure modules App.jsx keeps its study rules in.
  it('app-level modules that feature logic imports stay platform-neutral too', () => {
    const PURE_APP = ['config/grading.js', 'config/study.js', 'utils/studyDepth.js']
    const targets = new Set(PURE_APP.map((r) => path.join(SRC, r)))
    const resolve = (from, spec) => {
      const base = path.resolve(path.dirname(from), spec)
      for (const c of [base, `${base}.js`, path.join(base, 'index.js')]) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c
      return null
    }
    for (const f of featureLogic()) {
      for (const m of fs.readFileSync(f, 'utf8').matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
        const hit = resolve(f, m[1])
        if (!hit || !hit.endsWith('.js')) continue
        const r = rel(hit)
        if (r.startsWith('features/') || r.startsWith('platform/') || r.startsWith('i18n/locales/') || r.startsWith('..')) continue
        targets.add(hit)
      }
    }
    for (const r of PURE_APP) expect(fs.existsSync(path.join(SRC, r)), r).toBe(true)
    expect(scanLogic([...targets])).toEqual([])
  })

  it('no file reaches /api except through the platform seam', () => {
    const bad = []
    for (const f of walk(SRC).filter((x) => /\.(js|jsx)$/.test(x) && !/\.test\.js$/.test(x) && !rel(x).startsWith('platform/') && !/server\.js$/.test(x))) {
      const text = fs.readFileSync(f, 'utf8')
      if (/\bfetch\(\s*['"`]\/api/.test(text) || /sendBeacon\(\s*['"`]\/api/.test(text)) bad.push(rel(f))
    }
    expect(bad).toEqual([])
  })
})

describe('platform adapters', () => {
  it('can be overridden piece by piece (a phone build replaces only what differs)', async () => {
    const orig = { api: platform.api, get: platform.kv.get }
    const store = new Map([['k', 'v']])
    setPlatform({ api: async (p) => ({ ok: true, path: p }), kv: { get: (k) => store.get(k) ?? null } })
    expect(await apiFetch('/api/x')).toEqual({ ok: true, path: '/api/x' })
    expect(platform.kv.get('k')).toBe('v')
    expect(typeof platform.kv.setJson).toBe('function') // untouched parts keep working
    setPlatform({ api: orig.api, kv: { get: orig.get } })
  })
  it('never throws when storage is unavailable', () => {
    expect(() => platform.kv.set('a', 'b')).not.toThrow()
    expect(platform.kv.getJson('missing', 7)).toBe(7)
  })
  it('every device adapter sits where the app reads it', () => {
    // onDeviceZoom once lived inside platform.history; App called platform.onDeviceZoom and the zoom keys did nothing.
    for (const fn of ['onDeviceZoom', 'onPageHide', 'beacon', 'isHidden', 'randomId']) expect(typeof platform[fn], fn).toBe('function')
    for (const fn of ['onDeviceNav', 'onPop', 'push', 'replace', 'go']) expect(typeof platform.history[fn], fn).toBe('function')
  })
})
