// Ebi's pictures, resized automatically (server side, used by vite.config.js).
//
// The ORIGINALS live in public/assets/shrimp/ and are the only files anyone adds or edits: any size, any common
// format (PNG, JPEG, WebP, GIF with animation, AVIF, TIFF; SVG is served as is). The app asks for them through
// EBI_ROUTE (shrimpUrl in src/config/shrimp.js). The first request makes a copy at most EBI_MAX_PX on its longest
// side, as WebP (transparency kept), saves it in the machine-local cache and serves it; later requests serve the
// saved copy until the original changes. Never enlarges a small picture. If resizing is not possible (the optional
// `sharp` package missing, an unreadable file), the ORIGINAL is served, so a picture never goes missing.
import fs from 'fs'
import path from 'path'

export const EBI_ROUTE = '/assets/ebi/'
// Largest Ebi on screen is about 130 CSS px; x1.35 body zoom x2.5 for the sharpest screens is about 450 px.
export const EBI_MAX_PX = 512
const WEBP = { quality: 90, alphaQuality: 100, effort: 4 }
const SOURCE_EXT = /\.(png|jpe?g|webp|gif|avif|tiff?|svg)$/i
const NAME_OK = /^[\w .@()+-]{1,160}$/ // a plain file name: no separators, never built from a path

const sniffType = (buf) => {
  if (buf[0] === 0x89 && buf[1] === 0x50) return 'image/png'
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg'
  if (buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return 'image/webp'
  if (buf.slice(0, 3).toString() === 'GIF') return 'image/gif'
  const head = buf.slice(0, 200).toString()
  if (/<svg[\s>]/i.test(head) || /^<\?xml/.test(head)) return 'image/svg+xml'
  return 'application/octet-stream'
}

// loadSharp: () => Promise<sharp> (injected so tests can simulate it missing).
export function createEbiImages({ srcDir, cacheDir, loadSharp, maxPx = EBI_MAX_PX, log = () => {} }) {
  let sharpP = null
  // sharp's file cache keeps originals OPEN on Windows (a replaced picture could not be saved over), so it is off.
  const getSharp = () => (sharpP ||= Promise.resolve().then(loadSharp).then((s) => { try { s.cache?.(false) } catch { /* older sharp */ } return s }).catch((e) => { log(`resizing off (${e?.message || e}); serving originals`); return null }))
  const inflight = new Map()

  // A known source file for this request name, or null. Never trusts the name beyond a plain file name.
  function sourceFor(name) {
    if (!name || name !== path.basename(name) || !NAME_OK.test(name) || !SOURCE_EXT.test(name) || name.startsWith('.')) return null
    const file = path.join(srcDir, name)
    try { const st = fs.statSync(file); return st.isFile() ? { file, mtimeMs: st.mtimeMs } : null } catch { return null }
  }

  // { file, type, resized } to send, or null (unknown name).
  async function resolve(name) {
    const src = sourceFor(name)
    if (!src) return null
    const original = () => { let type = 'application/octet-stream'; try { const fd = fs.openSync(src.file, 'r'); const b = Buffer.alloc(256); fs.readSync(fd, b, 0, 256, 0); fs.closeSync(fd); type = sniffType(b) } catch { /* sent anyway */ } return { file: src.file, type, resized: false } }
    const first = original()
    if (first.type === 'image/svg+xml') return first // vector: already sharp at any size
    const out = path.join(cacheDir, `${name}.${maxPx}.webp`)
    // The copy carries its original's modified time and is used only while they MATCH: a replaced picture with an
    // OLDER date (an Explorer copy keeps the source's date) kept serving the old copy under "newer wins".
    try { if (Math.abs(fs.statSync(out).mtimeMs - src.mtimeMs) < 2) return { file: out, type: 'image/webp', resized: true } } catch { /* not made yet */ }
    const sharp = await getSharp()
    if (!sharp) return first
    if (!inflight.has(out)) {
      inflight.set(out, (async () => {
        fs.mkdirSync(cacheDir, { recursive: true })
        const tmp = `${out}.${process.pid}.tmp`
        try {
          await sharp(src.file, { animated: true })
            .resize({ width: maxPx, height: maxPx, fit: 'inside', withoutEnlargement: true })
            .webp(WEBP).toFile(tmp)
          fs.renameSync(tmp, out)
          try { const tm = new Date(src.mtimeMs); fs.utimesSync(out, tm, tm) } catch { /* remade next time */ }
          return true
        } catch (e) {
          try { fs.rmSync(tmp, { force: true }) } catch { /* nothing to clean */ }
          log(`could not resize ${name}: ${e?.message || e}; serving the original`)
          return false
        }
      })().finally(() => inflight.delete(out)))
    }
    return (await inflight.get(out)) ? { file: out, type: 'image/webp', resized: true } : first
  }

  // Connect middleware for EBI_ROUTE.
  async function middleware(req, res, next) {
    const url = String(req.url || '')
    if (!url.startsWith(EBI_ROUTE)) return next()
    let name = ''
    try { name = decodeURIComponent(url.slice(EBI_ROUTE.length).split(/[?#]/)[0]) } catch { name = '' }
    let r = null
    try { r = await resolve(name) } catch { r = null }
    if (!r) { res.statusCode = 404; res.end('not found'); return }
    res.setHeader('Content-Type', r.type)
    res.setHeader('Cache-Control', 'no-cache') // revalidate: a replaced original shows at once
    res.setHeader('X-Content-Type-Options', 'nosniff')
    fs.createReadStream(r.file).on('error', () => { if (!res.headersSent) res.statusCode = 500; res.end() }).pipe(res)
  }

  // Make every copy in the background (so the first view is instant). Sequential: never hogs the machine.
  async function warm() {
    let names = []
    try { names = fs.readdirSync(srcDir) } catch { return 0 }
    let made = 0
    for (const n of names) { try { if ((await resolve(n))?.resized) made++ } catch { /* next one */ } }
    return made
  }

  return { resolve, middleware, warm }
}
