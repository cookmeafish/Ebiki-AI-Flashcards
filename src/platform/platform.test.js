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
  // Other doors to the browser: aliases of window, and web-only APIs a phone build doesn't have.
  [/(?<![.\w$])(?:globalThis|self|location)\./, 'globalThis/self/location'],
  [/\b(?:XMLHttpRequest|EventSource|WebSocket|indexedDB|speechSynthesis|matchMedia)\b/, 'a web-only API'],
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
      if (/\b(?:fetch|sendBeacon|EventSource|WebSocket)\(\s*['"`]\/api/.test(text) || /\.open\(\s*['"`][A-Z]+['"`]\s*,\s*['"`]\/api/.test(text)) bad.push(rel(f))
    }
    expect(bad).toEqual([])
  })
})

// CLAUDE.md lists every /api route as one a phone build must answer or as desktop-only. A route added on the server
// without a place in that list is a hole in the phone port, so the two are kept equal here.
describe('the phone route list', () => {
  it('names every /api route the server answers, once', () => {
    const ROOT = path.resolve(SRC, '..')
    const serverFiles = [path.join(ROOT, 'vite.config.js'), ...walk(path.join(SRC, 'server')), ...walk(path.join(SRC, 'features'))]
      .filter((f) => /\.(js|cjs|mjs)$/.test(f) && !/\.test\./.test(f) && (/vite\.config\.js$/.test(f) || /[\\/]server[\\/]/.test(f) || /(server|storage-server)\.js$/.test(f)))
    const served = new Set()
    for (const f of serverFiles) {
      for (const m of fs.readFileSync(f, 'utf8').matchAll(/middlewares\.use\(\s*['"`]\/api\/([\w/-]+)['"`]/g)) served.add(m[1])
    }
    const doc = fs.readFileSync(path.join(ROOT, 'CLAUDE.md'), 'utf8')
    const section = doc.slice(doc.indexOf('**Routes an on-device router must answer**'), doc.indexOf('Keep this list current when adding a route'))
    expect(section.length, 'the route list section of CLAUDE.md moved').toBeGreaterThan(100)
    const [phonePart, desktopPart] = section.split('**Desktop-only**')
    const names = (s) => [...s.matchAll(/`([a-z][\w/-]*)`/g)].map((m) => m[1])
    const phone = names(phonePart); const desktop = names(desktopPart)
    expect(phone.filter((r) => desktop.includes(r)), 'listed as both').toEqual([])
    const listed = new Set([...phone, ...desktop])
    // A sub-path (launchmode/hello, update/restart) belongs to its parent route.
    const unlisted = [...served].filter((r) => !listed.has(r) && !listed.has(r.split('/')[0]))
    expect(unlisted, 'served but missing from the CLAUDE.md phone route list').toEqual([])
    const stale = [...listed].filter((r) => ![...served].some((s) => s === r || s.startsWith(`${r}/`) || r.startsWith(`${s}/`)))
    expect(stale, 'listed in CLAUDE.md but not served').toEqual([])
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

describe('audio.play', () => {
  it('stop() settles done and frees the clip URL (a paused clip fires no ended event)', async () => {
    const revoked = []
    const oldAudio = globalThis.Audio
    const oldCreate = URL.createObjectURL
    const oldRevoke = URL.revokeObjectURL
    globalThis.Audio = class { constructor() { this.paused = false } play() { return Promise.resolve() } pause() { this.paused = true } }
    URL.createObjectURL = () => 'blob:clip'
    URL.revokeObjectURL = (u) => revoked.push(u)
    try {
      const h = platform.audio.play(new Blob(['x']))
      h.stop()
      const r = await Promise.race([h.done.then(() => 'done'), new Promise((res) => setTimeout(() => res('hung'), 200))])
      expect(r).toBe('done')
      expect(revoked).toEqual(['blob:clip'])
    } finally {
      globalThis.Audio = oldAudio; URL.createObjectURL = oldCreate; URL.revokeObjectURL = oldRevoke
    }
  })
})
