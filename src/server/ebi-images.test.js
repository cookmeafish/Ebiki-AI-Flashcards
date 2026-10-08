import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import { createEbiImages } from './ebi-images.js'

// Test folders live inside the repo's gitignored .cache/, never the OS temp folder.
const ROOT = path.resolve('.cache', `test-ebi-${process.pid}`)
const SRC = path.join(ROOT, 'src')
const CACHE = path.join(ROOT, 'cache')
const loadSharp = () => import('sharp').then((m) => m.default || m)
let sharp = null

const makePng = (file, w, h) => sharp({ create: { width: w, height: h, channels: 4, background: { r: 223, g: 37, b: 64, alpha: 0.5 } } }).png().toFile(path.join(SRC, file))

beforeAll(async () => {
  try { sharp = await loadSharp(); sharp.cache(false) } catch { sharp = null }
  fs.mkdirSync(SRC, { recursive: true })
  if (sharp) { await makePng('big.png', 1024, 800); await makePng('small.png', 100, 80) }
  fs.writeFileSync(path.join(SRC, 'vec.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>')
  fs.writeFileSync(path.join(SRC, 'notes.txt'), 'not a picture')
})
afterAll(() => { sharp?.cache?.(false); try { fs.rmSync(ROOT, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }) } catch { /* Windows may hold a handle a moment longer */ } })

describe('Ebi images', () => {
  it('shrinks a large picture to at most 512 px WebP, keeping transparency', async () => {
    if (!sharp) return
    const ebi = createEbiImages({ srcDir: SRC, cacheDir: CACHE, loadSharp })
    const r = await ebi.resolve('big.png')
    expect(r.resized).toBe(true)
    expect(r.type).toBe('image/webp')
    const meta = await sharp(r.file).metadata()
    expect(meta.format).toBe('webp')
    expect(Math.max(meta.width, meta.height)).toBe(512)
    expect(meta.hasAlpha).toBe(true)
  })

  it('never enlarges a small picture', async () => {
    if (!sharp) return
    const ebi = createEbiImages({ srcDir: SRC, cacheDir: CACHE, loadSharp })
    const r = await ebi.resolve('small.png')
    const meta = await sharp(r.file).metadata()
    expect(meta.width).toBe(100)
  })

  it('makes a new copy when the original is replaced', async () => {
    if (!sharp) return
    const ebi = createEbiImages({ srcDir: SRC, cacheDir: CACHE, loadSharp })
    await ebi.resolve('small.png')
    await makePng('small.png', 200, 50)
    const later = new Date(Date.now() + 5000)
    fs.utimesSync(path.join(SRC, 'small.png'), later, later)
    const r = await ebi.resolve('small.png')
    expect((await sharp(r.file).metadata()).width).toBe(200)
  })

  it('makes a new copy when the original is replaced by one with an OLDER date', async () => {
    if (!sharp) return
    const ebi = createEbiImages({ srcDir: SRC, cacheDir: CACHE, loadSharp })
    await makePng('old.png', 300, 300)
    await ebi.resolve('old.png')
    await makePng('old.png', 120, 60)
    const earlier = new Date(Date.now() - 86400000)
    fs.utimesSync(path.join(SRC, 'old.png'), earlier, earlier)
    const r = await ebi.resolve('old.png')
    expect((await sharp(r.file).metadata()).width).toBe(120)
  })

  it('serves the original when a picture cannot be resized', async () => {
    if (!sharp) return
    const ebi = createEbiImages({ srcDir: SRC, cacheDir: CACHE, loadSharp })
    fs.writeFileSync(path.join(SRC, 'broken.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x01, 0x02]))
    const r = await ebi.resolve('broken.png')
    expect(r.resized).toBe(false)
    expect(r.file).toBe(path.join(SRC, 'broken.png'))
    expect(fs.readdirSync(CACHE).some((f) => f.endsWith('.tmp'))).toBe(false)
  })

  it('turns sharp\'s file cache off', async () => {
    let cacheArg
    const fake = Object.assign(() => ({ resize() { return this }, webp() { return this }, toFile: async () => { throw new Error('x') } }), { cache: (v) => { cacheArg = v } })
    const ebi = createEbiImages({ srcDir: SRC, cacheDir: path.join(ROOT, 'fake'), loadSharp: () => fake })
    await ebi.resolve('raw.png').catch(() => {})
    fs.writeFileSync(path.join(SRC, 'raw2.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]))
    await ebi.resolve('raw2.png')
    expect(cacheArg).toBe(false)
  })

  it('refuses Windows stream and device-style names', async () => {
    const ebi = createEbiImages({ srcDir: SRC, cacheDir: CACHE, loadSharp })
    for (const n of ['big.png::$DATA', 'big.png.', 'big.png ', 'C:big.png', 'big%2Fpng']) {
      expect(await ebi.resolve(n)).toBe(null)
    }
  })

  it('serves the original when resizing is not available', async () => {
    const ebi = createEbiImages({ srcDir: SRC, cacheDir: path.join(ROOT, 'none'), loadSharp: () => { throw new Error('missing') } })
    fs.writeFileSync(path.join(SRC, 'raw.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    const r = await ebi.resolve('raw.png')
    expect(r.resized).toBe(false)
    expect(r.type).toBe('image/png')
    expect(r.file).toBe(path.join(SRC, 'raw.png'))
  })

  it('serves SVG as is', async () => {
    const ebi = createEbiImages({ srcDir: SRC, cacheDir: CACHE, loadSharp })
    const r = await ebi.resolve('vec.svg')
    expect(r.type).toBe('image/svg+xml')
    expect(r.resized).toBe(false)
  })

  it('refuses paths, hidden files and non-pictures', async () => {
    const ebi = createEbiImages({ srcDir: SRC, cacheDir: CACHE, loadSharp })
    for (const n of ['../package.json', '..\\big.png', 'sub/big.png', '.hidden.png', 'notes.txt', 'missing.png', '']) {
      expect(await ebi.resolve(n)).toBe(null)
    }
  })

  it('answers 404 through the middleware for an unknown name and passes other URLs on', async () => {
    const ebi = createEbiImages({ srcDir: SRC, cacheDir: CACHE, loadSharp })
    const res = { statusCode: 200, end() { this.ended = true }, setHeader() {} }
    await ebi.middleware({ url: '/assets/ebi/..%2Fpackage.json' }, res, () => {})
    expect(res.statusCode).toBe(404)
    let passed = false
    await ebi.middleware({ url: '/api/config' }, res, () => { passed = true })
    expect(passed).toBe(true)
  })
})
