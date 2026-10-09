// THE BUILT APP (server side, node only; tested in builtApp.test.js). A shortcut launch serves the page from an
// optimized build (`vite build`: minified, React's production build, no inline source maps; about 2.5 MB instead of
// 22 MB of development modules, and React's development checks on every render gone) while the dev server keeps
// answering everything else exactly as before: /api, the art and public files, the dev pages.
// The build lives in BUILD_DIR, stamped with a FINGERPRINT of everything that goes into it. It is served only when the
// stamp equals the fingerprint of the code as it is NOW, so a stale build is never shown: after an update or a manual
// git pull the session runs on the dev server as before and a new build is made in the background for the next start.

export const BUILD_DIR = '.ebiki-build'
export const BUILD_TMP = '.ebiki-build.tmp'
export const BUILD_ASSETS = '_app' // the build's own files (hashed names), apart from public/assets
export const STAMP_FILE = '.stamp'

// What a build is made from: the app's code and the files that steer the build. Tests and scratch copies are not.
const INPUT_FILES = ['index.html', 'vite.config.js', 'package.json', 'package-lock.json']
const INPUT_DIRS = ['src']
const SKIP = /(^|[\\/])(\.scratch|node_modules)([\\/]|$)|\.test\.[jt]sx?$/

export function sourceFingerprint(root, { fs, path, crypto }) {
  const h = crypto.createHash('sha256')
  const add = (rel) => {
    let buf
    try { buf = fs.readFileSync(path.join(root, rel)) } catch { return }
    h.update(rel.split(path.sep).join('/'))
    h.update('\0')
    h.update(buf)
    h.update('\0')
  }
  for (const f of INPUT_FILES) add(f)
  const walk = (rel) => {
    let names
    try { names = fs.readdirSync(path.join(root, rel), { withFileTypes: true }) } catch { return }
    for (const d of names.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
      const r = path.join(rel, d.name)
      if (SKIP.test(r)) continue
      if (d.isDirectory()) walk(r)
      else if (d.isFile()) add(r)
    }
  }
  for (const d of INPUT_DIRS) walk(d)
  return h.digest('hex').slice(0, 32)
}

// The built file answering `urlPath` (the request path, query already removed), or null to let the dev server
// answer. Only the page itself and the build's own files; never a path outside the build.
export function builtFileFor(urlPath, buildDir, path) {
  let p
  try { p = decodeURIComponent(urlPath || '') } catch { return null }
  if (p === '/' || p === '/index.html') return path.join(buildDir, 'index.html')
  if (!p.startsWith(`/${BUILD_ASSETS}/`)) return null
  const rest = p.slice(BUILD_ASSETS.length + 2)
  if (!rest || rest.includes('\\') || rest.includes('\0') || rest.split('/').some((s) => s === '..' || s === '.' || s === '')) return null
  return path.join(buildDir, BUILD_ASSETS, ...rest.split('/'))
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.map': 'application/json' }
export const contentTypeOf = (file) => TYPES[(file.match(/\.[a-z0-9]+$/i) || [''])[0].toLowerCase()] || 'application/octet-stream'

// A new build swapped in WHILE this session serves the old one (the background build after an update): the open
// pages still name the old build's hashed files, and their lazy screens (Legends, Settings...) load them only when
// first opened. Removed with the old folder, those loads fell through to the dev server and the screen failed for the
// rest of the session. The old build's files the new one lacks are carried into it (hashed names never clash in
// meaning; the next start's pages name only the new ones). Returns how many were carried.
export function carryOldAssets(oldDir, newDir, { fs, path }) {
  let carried = 0
  const walk = (rel) => {
    let names
    try { names = fs.readdirSync(path.join(oldDir, rel), { withFileTypes: true }) } catch { return }
    for (const d of names) {
      const r = path.join(rel, d.name)
      if (d.isDirectory()) { walk(r); continue }
      if (!d.isFile()) continue
      const to = path.join(newDir, r)
      if (fs.existsSync(to)) continue
      try { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(path.join(oldDir, r), to); carried++ } catch { /* that one stays missing */ }
    }
  }
  walk(BUILD_ASSETS)
  return carried
}
