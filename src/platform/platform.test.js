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

describe('portability', () => {
  it('feature logic stays platform-neutral', () => {
    const bad = []
    for (const f of walk(path.join(SRC, 'features')).filter((x) => x.endsWith('.js') && !EXEMPT_LOGIC.test(rel(x)))) {
      const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/)
      lines.forEach((line, i) => {
        if (/^\s*\/\//.test(line)) return // comments may mention them
        for (const [re, name] of FORBIDDEN_IN_LOGIC) if (re.test(line)) bad.push(`${rel(f)}:${i + 1} uses ${name}`)
        // fetch only to outside services (an AI provider); Ebiki's own routes go through apiFetch.
        if (/\bfetch\(/.test(line) && !/https?:\/\//.test(line)) bad.push(`${rel(f)}:${i + 1} calls fetch directly`)
      })
    }
    expect(bad).toEqual([])
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
})
