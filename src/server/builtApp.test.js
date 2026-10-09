import { describe, it, expect } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import crypto from 'crypto'
import { sourceFingerprint, builtFileFor, builtRequestAllowed, contentTypeOf, carryOldAssets, BUILD_ASSETS } from './builtApp'

describe('builtRequestAllowed (the build is served before Vite checks the Host)', () => {
  it('lets the app window, the overlay and a tab load the page and its files', () => {
    expect(builtRequestAllowed({ host: 'localhost:3000' })).toBe(true)                                  // Electron's first load
    expect(builtRequestAllowed({ host: 'localhost:3000', 'sec-fetch-site': 'none', 'sec-fetch-dest': 'document' })).toBe(true) // typed URL / window
    expect(builtRequestAllowed({ host: 'localhost:3000', 'sec-fetch-site': 'same-origin', 'sec-fetch-dest': 'script', origin: 'http://localhost:3000' })).toBe(true) // module script
    expect(builtRequestAllowed({ host: 'LOCALHOST:3000' })).toBe(true)
    expect(builtRequestAllowed({ host: '127.0.0.1:3000' })).toBe(true)
    expect(builtRequestAllowed({ host: '[::1]:3000' })).toBe(true)
    expect(builtRequestAllowed({ host: 'localhost' })).toBe(true)
  })
  it('refuses a DNS-rebound host, another site and a missing or odd Host', () => {
    expect(builtRequestAllowed({ host: 'evil.example:3000' })).toBe(false)
    expect(builtRequestAllowed({ host: 'evil.example' })).toBe(false)
    expect(builtRequestAllowed({ host: 'localhost.evil.example:3000' })).toBe(false)
    expect(builtRequestAllowed({ host: 'evil@localhost:3000' })).toBe(false)
    expect(builtRequestAllowed({ host: '0.0.0.0:3000' })).toBe(false)
    expect(builtRequestAllowed({ host: 'localhost:3000', 'sec-fetch-site': 'cross-site' })).toBe(false)
    expect(builtRequestAllowed({ host: 'localhost:3000', 'sec-fetch-site': 'Same-Site' })).toBe(false)
    expect(builtRequestAllowed({})).toBe(false)
    expect(builtRequestAllowed()).toBe(false)
  })
})

const deps = { fs, path, crypto }
function tree(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ebiki-built-'))
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true })
    fs.writeFileSync(path.join(root, rel), text)
  }
  return root
}

describe('sourceFingerprint', () => {
  it('changes with any app code or build input, not with tests or scratch copies', () => {
    const root = tree({ 'index.html': 'a', 'src/App.jsx': 'x', 'src/a.test.js': 't', 'package.json': '{}' })
    const fp = sourceFingerprint(root, deps)
    fs.writeFileSync(path.join(root, 'src/a.test.js'), 't2')
    fs.mkdirSync(path.join(root, 'src/.scratch'))
    fs.writeFileSync(path.join(root, 'src/.scratch/z.js'), 'z')
    expect(sourceFingerprint(root, deps)).toBe(fp)
    fs.writeFileSync(path.join(root, 'src/App.jsx'), 'y')
    const fp2 = sourceFingerprint(root, deps)
    expect(fp2).not.toBe(fp)
    fs.writeFileSync(path.join(root, 'src/new.js'), '')
    expect(sourceFingerprint(root, deps)).not.toBe(fp2)
    fs.writeFileSync(path.join(root, 'package.json'), '{"v":2}')
    expect(sourceFingerprint(root, deps)).not.toBe(fp2)
  })
  it('a renamed file is a change even with the same content', () => {
    const a = sourceFingerprint(tree({ 'src/a.js': 'same' }), deps)
    const b = sourceFingerprint(tree({ 'src/b.js': 'same' }), deps)
    expect(a).not.toBe(b)
  })
})

describe('builtFileFor', () => {
  const dir = path.join('C:', 'app', '.ebiki-build')
  it('answers the page and the build files only', () => {
    expect(builtFileFor('/', dir, path)).toBe(path.join(dir, 'index.html'))
    expect(builtFileFor('/index.html', dir, path)).toBe(path.join(dir, 'index.html'))
    expect(builtFileFor(`/${BUILD_ASSETS}/index-abc.js`, dir, path)).toBe(path.join(dir, BUILD_ASSETS, 'index-abc.js'))
    for (const p of ['/api/config', '/assets/legends/raids/hydra.svg', '/dev/legends-gallery/', '/src/App.jsx', '/@vite/client']) expect(builtFileFor(p, dir, path), p).toBe(null)
  })
  it('never leaves the build folder', () => {
    for (const p of [`/${BUILD_ASSETS}/../vite.config.js`, `/${BUILD_ASSETS}/%2e%2e/.env`, `/${BUILD_ASSETS}/a\\..\\b`, `/${BUILD_ASSETS}/`, `/${BUILD_ASSETS}//x`, `/${BUILD_ASSETS}/%E0%A4%A`, `/${BUILD_ASSETS}/a%00b`]) {
      expect(builtFileFor(p, dir, path), p).toBe(null)
    }
  })
  it('names the content types the build ships', () => {
    expect(contentTypeOf('a.js')).toMatch(/javascript/)
    expect(contentTypeOf('a.CSS')).toMatch(/css/)
    expect(contentTypeOf('a.wasm')).toBe('application/wasm')
    expect(contentTypeOf('a.xyz')).toBe('application/octet-stream')
  })
})

describe('carryOldAssets', () => {
  it('keeps the old build files open pages still load, never replacing the new build', () => {
    const old = tree({ 'index.html': 'old', [`${BUILD_ASSETS}/index-old.js`]: 'o', [`${BUILD_ASSETS}/Legends-old.js`]: 'l', [`${BUILD_ASSETS}/vendor-react-same.js`]: 'old copy', '.stamp': 'a' })
    const neu = tree({ 'index.html': 'new', [`${BUILD_ASSETS}/index-new.js`]: 'n', [`${BUILD_ASSETS}/vendor-react-same.js`]: 'new copy', '.stamp': 'b' })
    expect(carryOldAssets(old, neu, deps)).toBe(2)
    const read = (rel) => fs.readFileSync(path.join(neu, rel), 'utf8')
    expect(read(`${BUILD_ASSETS}/Legends-old.js`)).toBe('l')
    expect(read(`${BUILD_ASSETS}/index-old.js`)).toBe('o')
    expect(read(`${BUILD_ASSETS}/vendor-react-same.js`)).toBe('new copy')
    expect(read('index.html')).toBe('new')
    expect(read('.stamp')).toBe('b')
  })
  it('no old build: nothing to carry', () => {
    expect(carryOldAssets(path.join(os.tmpdir(), 'ebiki-built-missing-' + Date.now()), tree({ 'index.html': 'n' }), deps)).toBe(0)
  })
})
