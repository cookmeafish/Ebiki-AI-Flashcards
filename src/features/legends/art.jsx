// Legends art: hand-made SVG FILES shipped with the app (public/assets/legends/), never generated per user.
//   areas/<motif>.svg   the banner of an area (400 x 140)
//   bosses/<motif>.svg  the boss of an area (120 x 120)
// One file per motif (map.js MOTIFS). A file colors itself with the variables below, set here from the area's
// palette and the app theme, so one drawing fits every area and both light and dark mode; a variable the app does
// not set (or a file opened on its own) uses the fallback written in the file: var(--lg-far, #9fd4ad).
//   --lg-sky --lg-far --lg-near --lg-deep --lg-accent --lg-light
// Every drawing is painted in its OWN ideal colors (the palette "original" shows exactly that). A palette recolors only
// ONE part of each boss, chosen per drawing so the boss still looks right in any palette (its fire, its gems, its
// glow): that part alone uses --lg-tint (its main color), --lg-tint-hi (the lit side) and --lg-tint-lo (the shade),
// each with the ideal color as its fallback. The older variables above are no longer read by any drawing (a palette
// that repainted the whole boss made some unrecognizable); the frame still shows --lg-sky while a banner loads.
// The files are inlined (an <img> could not see the theme's variables) through the app's one sanitizer, loaded
// lazily (it needs a DOM). Edit or replace a file to change the art; public/assets/legends/README.md says how.
// Motion is SVG animation inside the file (<animateTransform>/<animateMotion>; the sanitizer drops <animate>/<set>):
// class="lg-in" = the entrance (played once when the file appears), class="lg-loop" = idle life (breathing, fire,
// waves). `animated` picks what plays: 'intro' = both, 'idle' = loops only, false = none (the file's own attributes
// are its resting pose, so a still file shows the finished boss). Reduced motion always gets false.
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFeatureCtx, featureCfg } from '../registry'
import { LEGENDS_ID } from './store'
import { RADIUS } from '../../config/tokens'
import { MOTIFS } from './map'
import { RAID_MOTIFS } from './raid'

export const ART_BASE = '/assets/legends'
export const BANNER = { w: 400, h: 140 }
// Raid bosses have their own list (raid.js); areas and bosses share the map's motifs.
export const artUrl = (kind, motif) => { const list = kind === 'raids' ? RAID_MOTIFS : MOTIFS; return `${ART_BASE}/${kind}/${list.includes(motif) ? motif : list[0]}.svg` }

const mix = (token, pct, base = 'var(--c-surface)') => `color-mix(in srgb, ${token} ${pct}%, ${base})`

// palette → [main color, accent], from theme colors (so both themes work). Every palette has its OWN main color: night
// and candy were both purple (sunset and sand both amber) and drew the same sky, hills and ground.
const tone = (a, pct, b) => `color-mix(in srgb, ${a} ${pct}%, ${b})`
const BASE = {
  brand: ['var(--c-brand)', 'var(--c-warning)'],
  ocean: ['var(--c-info)', 'var(--c-teal)'],
  forest: ['var(--c-success)', 'var(--c-warning)'],
  sunset: [tone('var(--c-warning)', 60, 'var(--c-brand)'), 'var(--c-purple)'],   // orange, a violet dusk
  night: [tone('var(--c-info)', 50, 'var(--c-purple)'), 'var(--c-warning)'],     // indigo, gold stars
  sand: [tone('var(--c-warning)', 55, 'var(--c-ink-dim)'), 'var(--c-teal)'],     // khaki, an oasis
  candy: [tone('var(--c-brand)', 55, 'var(--c-purple)'), 'var(--c-info)'],       // pink, sky blue sprinkles
  steel: [tone('var(--c-ink-dim)', 70, 'var(--c-info)'), 'var(--c-warning)'],    // blue grey, a warm light
}
// The one recolored part of a drawing, per palette: [main, lit, shade]. Fixed colors, like the drawings themselves (a
// boss looks the same in both themes). "original" sets none, so every part keeps the color written in its file.
const TINT = {
  brand: ['#df2540', '#ff7083', '#8e1428'],
  ocean: ['#2f8fe0', '#86c8ff', '#17508a'],
  forest: ['#2fb35a', '#8ee6a2', '#16663a'],
  sunset: ['#f07a1f', '#ffb870', '#9a4410'],
  night: ['#6a4de0', '#ad9bff', '#33237f'],
  sand: ['#d6a63a', '#f3da8e', '#86661a'],
  candy: ['#ee5fb0', '#ffadd9', '#982c6b'],
  steel: ['#6f8aa6', '#b8cadb', '#3b4e62'],
}
export const ORIGINAL_PALETTE = 'original'
export function paletteColors(name) {
  const [main, accent] = BASE[name] || BASE.brand
  return { sky: mix(main, 14), far: mix(main, 38), near: mix(main, 70), deep: main, accent, light: 'var(--c-surface)' }
}
export const artVars = (palette) => {
  const c = paletteColors(palette)
  const tint = TINT[palette]
  return {
    '--lg-sky': c.sky, '--lg-far': c.far, '--lg-near': c.near, '--lg-deep': c.deep, '--lg-accent': c.accent, '--lg-light': c.light,
    ...(tint ? { '--lg-tint': tint[0], '--lg-tint-hi': tint[1], '--lg-tint-lo': tint[2] } : {}),
  }
}

// Files allowed to use ids and gradients, for a painted 3D look (art.test.js holds every other file to flat cel
// drawing, no ids, no url()): the owner asked for a photoreal ophanim. The default stays flat.
export const REALISTIC_ART = ['raids/ophanim.svg']
// PHOTO LAYERS (an experiment the owner asked for: real photographs in the ophanim: its great eye, its wings, its
// wheels, its cloud bed and the holy light behind it). The sanitizer drops every <image> from a file (nothing a file holds may load a URL), so the file only
// marks WHERE (empty <g class="lg-photo-..."> groups) and this code, after sanitizing, puts the app's own fixed sprites
// there (PHOTO_SPRITES, hardcoded paths, never read from the file). Inside the SVG each photo keeps the file's stacking
// (wheels and lids in front), the motion of the group it sits in (iris look-around, wing flaps and unfolding, cloud
// drift) and the phase layers. The painted parts stay under it in the file as the fallback; those the photo replaces
// are wrapped in class lg-photo-hide and hidden while the photo is there.
//   eye    ophanim-eye.webp    2048 x 512, cells 512: 0 eyeball (iris painted out), 1 eyeball warm, 2 iris blue, 3 iris gold
//   wings  ophanim-wings.webp  2560 x 480, cells 640 x 240: four wings (root at the left), row 0 white, row 1 warm
//   cloud  ophanim-cloud.webp  1280 x 480, cells 640 x 240: 0 cloud, 1 mirrored, 2 and 3 the same warm (phase 3)
//   rings  ophanim-rings.webp  1536 x 750, cells 768 x 150: five rings flattened, column 0 the back (top) half, column 1
//          the front half; the file puts each half in its painted ring's back or front layer so the wheels still
//          pass behind and in front of the eye
//   light  ophanim-light.webp  1536 x 512, cells 512: the light plate (PHOTO LIGHT below), tinted for phase 1, 2, 3
// A wing, cloud or ring marker carries its own transform (the unit square becomes its cell); a wing shows the warm row
// in phase 3 (lg-p3) and the white one otherwise (lg-p12).
// To revert: delete this block, PHOTO LIGHT below and their uses (the call in loadArt, `photo` in LegendsArt), delete
// the five raids/ophanim-*.webp, restore ophanim.svg from the painted original (the scratchpad backup
// ophanim-backup-before-photo-eye).
export const PHOTO_SPRITES = {
  eye: { url: `${ART_BASE}/raids/ophanim-eye.webp`, w: 2048, h: 512, cw: 512, ch: 512, cols: 4 },
  wings: { url: `${ART_BASE}/raids/ophanim-wings.webp`, w: 2560, h: 480, cw: 640, ch: 240, cols: 4 },
  cloud: { url: `${ART_BASE}/raids/ophanim-cloud.webp`, w: 1280, h: 480, cw: 640, ch: 240, cols: 2 },
  rings: { url: `${ART_BASE}/raids/ophanim-rings.webp`, w: 1536, h: 750, cw: 768, ch: 150, cols: 2 },
  light: { url: `${ART_BASE}/raids/ophanim-light.webp`, w: 1536, h: 512, cw: 512, ch: 512, cols: 3 },
}
// The SVG never crops a sheet: every cell is its own file, raids/ophanim/<sprite>-<n>.webp, cut from the sheets above
// (the sheets stay as the source; light is a CSS background, so it keeps its sheet). A cell drawn as a nested
// <svg viewBox> window onto the whole sheet, scaled up from a 1-unit box, came out jumbled and misplaced on Linux.
export const PHOTO_CELLS = { eye: 4, wings: 8, cloud: 4, rings: 10 }
export const photoCellUrl = (sprite, n) => `${ART_BASE}/raids/ophanim/${sprite}-${n}.webp`
export const PHOTO_CELL_URLS = Object.entries(PHOTO_CELLS).flatMap(([k, n]) => Array.from({ length: n }, (_, i) => photoCellUrl(k, i)))
export const PHOTO_EYE_URL = PHOTO_SPRITES.eye.url
const PHOTO_FILE = `${ART_BASE}/raids/ophanim.svg`
const EYE_CELLS = { // class: [sprite cell, center x, center y, size] in the drawing's 120 x 120 units
  'lg-photo-ball': [0, 60, 54, 48.33], 'lg-photo-ball3': [1, 60, 54, 48.33],
  'lg-photo-iris': [2, 60, 56.4, 32.17], 'lg-photo-iris3': [3, 60, 56.4, 32.17],
}
// one sprite cell drawn into the box (x, y, w, h)
const photoCell = (sprite, cell, x, y, w, h) =>
  `<image href="${photoCellUrl(sprite, cell)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"/>`
// The photos must really load before the file's painted parts are hidden for them: a sprite that 404s, fails to decode
// or never arrives left the ophanim as broken-image boxes with no wings, wheels or cloud (seen on a Linux install).
// Every sprite is fetched and decoded once; if any fails (or takes over PHOTO_CHECK_MS) the painted file shows as is,
// without the photo light layers. null = not checked yet, then true/false for the page's life.
const PHOTO_CHECK_MS = 15000
let photoUsable = null
let photoCheck = null
export const photoSpritesUsable = () => photoUsable === true
function checkPhotoSprites() {
  if (photoCheck) return photoCheck
  if (typeof Image === 'undefined') { photoUsable = false; return (photoCheck = Promise.resolve(false)) }
  const one = (url) => new Promise((resolve) => {
    const img = new Image()
    let done = false
    const end = (ok) => { if (!done) { done = true; resolve(ok) } }
    const timer = setTimeout(() => end(false), PHOTO_CHECK_MS)
    img.onload = () => {
      // decode() catches a file that "loads" but cannot be painted; older engines without it count the load
      const p = typeof img.decode === 'function' ? img.decode() : Promise.resolve()
      p.then(() => end(img.naturalWidth > 0), () => end(false)).finally(() => clearTimeout(timer))
    }
    img.onerror = () => { clearTimeout(timer); end(false) }
    img.src = url
  })
  photoCheck = Promise.all([...PHOTO_CELL_URLS, PHOTO_SPRITES.light.url].map(one))
    .then((oks) => (photoUsable = oks.every(Boolean)))
  return photoCheck
}
export function withPhotoEye(svg, url) {
  if (url !== PHOTO_FILE || !svg) return svg
  return svg
    .replace(/class="lg-photo-hide([^"]*)"/g, 'class="lg-photo-hide$1" style="display:none"')
    .replace(/<g class="(lg-photo-(?:ball|iris)3?)"><\/g>/g, (m, cls) => {
      const [cell, cx, cy, size] = EYE_CELLS[cls]
      return `<g class="${cls}">${photoCell('eye', cell, cx - size / 2, cy - size / 2, size, size)}</g>`
    })
    .replace(/<g class="lg-photo-wing lg-pw-([0-3])"( transform="[^"]*")><\/g>/g, (m, cell, tr) =>
      `<g class="lg-photo-wing"${tr}><g class="lg-p12">${photoCell('wings', +cell, 0, 0, 1, 1)}</g>` +
      `<g class="lg-p3" style="display:none">${photoCell('wings', +cell + 4, 0, 0, 1, 1)}</g></g>`)
    .replace(/<g class="lg-photo-cloud lg-pc-([0-3])"( transform="[^"]*")><\/g>/g, (m, cell, tr) =>
      `<g class="lg-photo-cloud"${tr}>${photoCell('cloud', +cell, 0, 0, 1, 1)}</g>`)
    .replace(/<g class="lg-photo-ring lg-pr-(\d)"( transform="[^"]*")><\/g>/g, (m, cell, tr) =>
      `<g class="lg-photo-ring"${tr}>${photoCell('rings', +cell, 0, 0, 1, 1)}</g>`)
}

// PHOTO LIGHT (part of the photo experiment): the ophanim's sky and light are real CSS, which the sanitizer never sees
// because this is the app's own markup: HTML layers in the drawing's box, BEHIND the SVG (a deep sky with soft falloff,
// the owner's light plate pouring down, soft volumetric rays, far cloud wisps, bokeh and stars) and IN FRONT of it (a
// blurred bloom around the great eye). Light uses mix-blend-mode: screen (added light) and filter: blur, inside an
// isolated box so it only mixes with the drawing. The file's flat painted sky, haze, orbs and beam sticks are hidden
// (lg-photo-hide). Phases use the file's own classes (lg-p1, lg-p12 > lg-p2, lg-p3), which the arena's data-phase
// switches. Motion only plays when the drawing animates (never when still, reduced or locked).
const pct = (u) => `${(u / 120) * 100}%`
const box = (x, y, w, h) => ({ position: 'absolute', left: pct(x), top: pct(y), width: pct(w), height: pct(h), pointerEvents: 'none' })
const FILL = { position: 'absolute', inset: 0, pointerEvents: 'none' }
const PHOTO_LIGHT = { // per phase: sky stops, plate cell, plate strength, ray colour, bloom colour, wisp row, stars
  1: { sky: 'rgba(150,130,230,.95) 0%, #3b2a78 18%, #1c1442 38%, #0b0820 56%, rgba(6,5,18,.6) 66%, rgba(6,5,18,0) 72%',
    cell: 0, plate: 0.6, ray: 'rgba(196,186,255,.5)', bloom: 'rgba(170,150,255,.55)', wisp: 0, wispOp: 0.22, stars: 1 },
  2: { sky: 'rgba(240,248,255,1) 0%, #b9d2ff 12%, #5f84d0 26%, #26407e 42%, #0e1a3a 57%, rgba(8,14,32,.6) 66%, rgba(8,14,32,0) 72%',
    cell: 1, plate: 0.85, ray: 'rgba(225,238,255,.55)', bloom: 'rgba(200,225,255,.6)', wisp: 0, wispOp: 0.32, stars: 0.6 },
  3: { sky: 'rgba(255,252,235,1) 0%, #ffe08a 10%, #ff9a2a 22%, #c24a0c 36%, #5a1606 50%, #1c0604 60%, rgba(18,4,2,.6) 67%, rgba(18,4,2,0) 72%',
    cell: 2, plate: 1, ray: 'rgba(255,214,140,.6)', bloom: 'rgba(255,190,90,.7)', wisp: 2, wispOp: 0.3, stars: 0 },
}
const BOKEH = [[22, 30, 7], [96, 26, 5], [14, 70, 9], [104, 66, 6], [34, 12, 4], [88, 92, 8]] // x, y, size (units)
const STARS = [[18, 20], [30, 8], [92, 14], [104, 40], [12, 52], [84, 6], [108, 84], [8, 34]]
const LIGHT_CSS = `
@keyframes lgOphRays { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
@keyframes lgOphBreath { 0%, 100% { opacity: var(--o) } 50% { opacity: calc(var(--o) * .78) } }
@keyframes lgOphDrift { 0%, 100% { transform: translate(0, 0) } 50% { transform: translate(3%, -2%) } }
@keyframes lgOphTwinkle { 0%, 100% { opacity: .9 } 50% { opacity: .25 } }
`
function phaseLayer(p, children) {
  if (p === 1) return <div key={p} className="lg-p1" style={FILL}>{children}</div>
  if (p === 2) return <div key={p} className="lg-p12" style={FILL}><div className="lg-p2" style={{ ...FILL, display: 'none' }}>{children}</div></div>
  return <div key={p} className="lg-p3" style={{ ...FILL, display: 'none' }}>{children}</div>
}
const run = (motion, name, s, extra = '') => (motion ? `${name} ${s}s ${extra || 'ease-in-out'} infinite` : 'none')
export function PhotoLightBack({ motion }) {
  const L = PHOTO_SPRITES.light, C = PHOTO_SPRITES.cloud
  return (
    <div aria-hidden="true" style={{ ...FILL, zIndex: 0 }}>
      <style>{LIGHT_CSS}</style>
      {[1, 2, 3].map((p) => {
        const s = PHOTO_LIGHT[p]
        return phaseLayer(p, <>
          {/* the sky: one deep gradient from the core out to the dark rim, then nothing */}
          <div style={{ ...box(-8, -14, 136, 136), borderRadius: '50%', background: `radial-gradient(circle at 50% 46%, ${s.sky})` }} />
          {/* far cloud wisps low in the sky, faint and soft */}
          <div style={{ ...box(-14, 52, 148, 40), opacity: s.wispOp, filter: 'blur(1.2px)', backgroundImage: `url(${C.url})`,
            backgroundSize: '200% 200%', backgroundPosition: s.wisp ? '0 100%' : '0 0', backgroundRepeat: 'no-repeat',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, #000 30%, transparent 70%)', maskImage: 'radial-gradient(ellipse at 50% 50%, #000 30%, transparent 70%)' }} />
          {/* the light pouring down from above (the owner's plate), added on top of the sky */}
          <div style={{ ...box(-25, -26, 170, 150), mixBlendMode: 'screen', '--o': s.plate, opacity: s.plate, animation: run(motion, 'lgOphBreath', 9),
            backgroundImage: `url(${L.url})`, backgroundSize: '300% 100%', backgroundPosition: `${s.cell * 50}% 0`, backgroundRepeat: 'no-repeat',
            WebkitMaskImage: 'radial-gradient(circle at 50% 42%, #000 42%, transparent 70%)', maskImage: 'radial-gradient(circle at 50% 42%, #000 42%, transparent 70%)' }} />
          {/* soft volumetric rays from the core: blurred wedges that fade with distance */}
          <div style={{ ...box(-20, -26, 160, 160), mixBlendMode: 'screen', opacity: 0.55, filter: 'blur(2.5px)',
            WebkitMaskImage: 'radial-gradient(circle at 50% 50%, #000 8%, rgba(0,0,0,.5) 30%, transparent 62%)', maskImage: 'radial-gradient(circle at 50% 50%, #000 8%, rgba(0,0,0,.5) 30%, transparent 62%)' }}>
            <div style={{ ...FILL, borderRadius: '50%', animation: run(motion, 'lgOphRays', 160, 'linear'),
              background: `repeating-conic-gradient(from 7deg at 50% 50%, ${s.ray} 0deg 3deg, transparent 7deg 17deg, ${s.ray} 21deg 22.5deg, transparent 26deg 33deg)` }} />
          </div>
          {/* distant light, out of focus */}
          {BOKEH.map(([x, y, d], i) => (
            <div key={i} style={{ ...box(x - d / 2, y - d / 2, d, d), borderRadius: '50%', mixBlendMode: 'screen', opacity: 0.35, filter: 'blur(1.4px)',
              background: `radial-gradient(circle, ${s.bloom} 0%, transparent 70%)`, animation: run(motion, 'lgOphDrift', 11 + i * 2) }} />
          ))}
          {s.stars ? STARS.map(([x, y], i) => (
            <div key={`s${i}`} style={{ ...box(x - 0.5, y - 0.5, 1, 1), borderRadius: '50%', background: '#fff', opacity: 0.9 * s.stars,
              boxShadow: '0 0 3px 1px rgba(210,220,255,.8)', animation: run(motion, 'lgOphTwinkle', 2.5 + (i % 4)) }} />
          )) : null}
        </>)
      })}
    </div>
  )
}
export function PhotoLightFront({ motion }) {
  return (
    <div aria-hidden="true" style={{ ...FILL, zIndex: 2 }}>
      {[1, 2, 3].map((p) => {
        const s = PHOTO_LIGHT[p]
        // a blurred bloom just outside the eyeball: the core's light wrapping the wheels and wings that pass it
        return phaseLayer(p,
          <div style={{ ...box(14, 9, 92, 92), borderRadius: '50%', mixBlendMode: 'screen', filter: 'blur(3px)', '--o': p === 3 ? 0.8 : 0.6,
            opacity: p === 3 ? 0.8 : 0.6, animation: run(motion, 'lgOphBreath', 6),
            background: `radial-gradient(circle, transparent 24%, ${s.bloom} 27%, transparent 52%)` }} />)
      })}
    </div>
  )
}

// One file is inlined many times on one page (the raid strip, the hall, the arena): a second copy's url(#x) would paint
// with the FIRST copy's gradient, or with nothing once that copy is hidden. So the cached markup marks every id and
// every local reference to it once (idTemplate), and each mounted drawing swaps the mark for its own suffix (withIds,
// a plain string replace). A file without ids passes through untouched.
const ID_MARK = '__lgid__'
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
export function idTemplate(svg) {
  if (!/\sid="/.test(svg)) return svg
  const ids = [...new Set([...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))]
  const any = new RegExp(`(\\sid="|url\\(\\s*(?:&quot;|['"])?#|href="#)(${ids.map(escRe).join('|')})(?=["')&])`, 'g')
  return svg.replace(any, `$1$2${ID_MARK}`)
}
let artSeq = 0
export const withIds = (svg, suffix) => (svg && svg.includes(ID_MARK) ? svg.split(ID_MARK).join(`-${suffix}`) : svg)

// url → sanitized markup ('' = unusable), shared by every banner on the map.
// Sanitizing a raid boss (about 300 KB, 3000 shapes) takes a while: files are sanitized ONE AT A TIME, each in its own
// task, so opening a screen with many drawings (the asset view's strip of 22 raid bosses) no longer froze the page.
const cache = new Map()
// url → the markup once it is ready, read synchronously: a drawing that REMOUNTS (the fight arena keys its boss box
// per answer to replay the hit; every ability Play did the same) shows at once instead of an empty box for a frame
// or two while the promise settles.
const ready = new Map()
let sanitizeQueue = Promise.resolve()
const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0))
function loadArt(url) {
  if (!cache.has(url)) {
    cache.set(url, Promise.all([fetch(url).then((r) => (r.ok ? r.text() : '')), import('../../components/Markdown'),
      url === PHOTO_FILE ? checkPhotoSprites() : false])
      .then(([text, m, photos]) => {
        const job = sanitizeQueue.then(nextTask).then(() => {
          const out = text ? m.sanitizeHtml(text, { USE_PROFILES: { svg: true }, SANITIZE_NAMED_PROPS: false }) /* own files: ids feed url(#id) */ : ''
          const sized = out.replace(/<svg\b/i, '<svg preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true"')
          return /<svg[\s>]/i.test(out) ? idTemplate(photos ? withPhotoEye(sized, url) : sized) : ''
        })
        sanitizeQueue = job.catch(() => {})
        return job.then((svg) => { ready.set(url, svg); return svg })
      })
      .catch(() => { cache.delete(url); return '' })) // a failed fetch is tried again next time
  }
  return cache.get(url)
}

// A drawing is loaded only once it comes near the screen, and its SVG is in the page ONLY while it is near: a paused
// drawing still costs paint and layerize on every frame anything else on the page animates (the asset view, with its
// palettes and raid bosses of about 3000 shapes each, went from about 4 to about 40 ms a frame after one scroll). Its
// box keeps its size and the sanitized markup stays in state, so scrolling back in shows it at once (its idle loop
// starts over). The dev gallery (check-art measures every drawing at fixed moments) sets window.__ebikiArtEager to keep
// them all live.
// Hysteresis, in screens: a drawing comes in once it is within ART_NEAR viewports of the screen and leaves only past
// ART_FAR. A single 400px margin made art blink: smooth, fast scrolling crossed it in a frame, so a drawing arrived empty
// and popped in, and scrolling back and forth took it out and put it back.
const ART_NEAR = 1 // viewports: mount
const ART_FAR = 3 // viewports: unmount
const distanceInScreens = (el) => {
  const r = el.getBoundingClientRect()
  const vh = window.innerHeight || 1, vw = window.innerWidth || 1
  const dy = r.bottom < 0 ? -r.bottom / vh : r.top > vh ? (r.top - vh) / vh : 0
  const dx = r.right < 0 ? -r.right / vw : r.left > vw ? (r.left - vw) / vw : 0
  return Math.max(dy, dx)
}
// The margins must be measured against the box that SCROLLS (<main>, a modal, a panel), not the window: an element
// clipped by its scroll box counts as not intersecting no matter how wide the window's margin, so art only arrived
// once it was already on screen.
const scrollRootOf = (el) => {
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const o = getComputedStyle(p)
    if (/^(auto|scroll|overlay)$/.test(o.overflowY)) return p // the nearest VERTICAL scroller (a horizontal strip is not it)
  }
  return null
}
function useArtInView(ref) {
  const eager = typeof window === 'undefined' || typeof IntersectionObserver === 'undefined' || !!window.__ebikiArtEager
  const [near, setNear] = useState(eager)
  // Measured before the first paint too: the observer answers a frame or more later, and a remounted drawing on screen
  // (the arena's boss on every hit) blinked out until it did.
  useLayoutEffect(() => {
    const el = ref.current
    if (eager || !el) return
    if (distanceInScreens(el) <= ART_NEAR) setNear(true)
  }, [eager, ref])
  useEffect(() => {
    const el = ref.current
    if (eager || !el) return undefined
    // Two observers (margins are a share of the viewport): one says "come in", the other "you may leave".
    const root = scrollRootOf(el)
    const comeIn = new IntersectionObserver(([e]) => { if (e.isIntersecting) setNear(true) }, { root, rootMargin: `${ART_NEAR * 100}% ${ART_NEAR * 100}%` })
    const leave = new IntersectionObserver(([e]) => { if (!e.isIntersecting) setNear(false) }, { root, rootMargin: `${ART_FAR * 100}% ${ART_FAR * 100}%` })
    comeIn.observe(el)
    leave.observe(el)
    return () => { comeIn.disconnect(); leave.disconnect() }
  }, [eager, ref])
  return near
}

// ASLEEP: while the window is HIDDEN (minimized, another tab, covered on a platform that reports it), every drawing's
// idle life stops: SMIL paused, CSS animations inside art boxes ([data-lg-art]) and idle cards ([data-lg-idle], the
// raid hero) on hold. They cost style, layout and paint on every frame (the raid hero alone kept the Practice hub at
// about 190 layouts a second) for nobody watching. Everything resumes where it stopped on return. Wake unpauses EVERY
// drawing: one paused by the arena's hit-stop is unpaused by its own cleanup anyway, so nothing stays frozen. The dev
// gallery (window.__ebikiArtEager, check-art drives the clock itself) never sleeps. NOT on mere blur: a visible window
// behind another app (or under the screenshot tool) froze every boss mid-entrance, wheels still flat, and looked broken.
const ASLEEP_ATTR = 'data-lg-asleep'
const ASLEEP_CSS = `html[${ASLEEP_ATTR}] [data-lg-art], html[${ASLEEP_ATTR}] [data-lg-art] *, html[${ASLEEP_ATTR}] [data-lg-idle] * { animation-play-state: paused !important }`
let asleep = false
let sleepInstalled = false
const artSvgs = (root) => [...root.querySelectorAll('[data-lg-art] svg, svg[data-lg-art]')].filter((s) => !s.ownerSVGElement)
function setArtPlaying(svgs, play) {
  for (const svg of svgs) { try { if (play) svg.unpauseAnimations(); else svg.pauseAnimations() } catch { /* not an SVG document */ } }
}
function installArtSleep() {
  if (sleepInstalled || typeof document === 'undefined' || typeof window === 'undefined' || window.__ebikiArtEager) return
  sleepInstalled = true
  const style = document.createElement('style')
  style.textContent = ASLEEP_CSS
  document.head.appendChild(style)
  const apply = () => {
    const next = !!document.hidden
    if (next === asleep) return
    asleep = next
    document.documentElement.toggleAttribute(ASLEEP_ATTR, asleep)
    setArtPlaying(artSvgs(document), !asleep)
  }
  document.addEventListener('visibilitychange', apply)
  apply()
}

const ANIM_TAGS = new Set(['animatetransform', 'animatemotion'])
export const reducedMotion = () => { try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches } catch { return false } }
// The system's "reduce motion" (Windows: Animation effects off) stills every drawing. Two things override it: the
// Legends setting "Always animate the art" (features.legends.motion) and the asset view (ArtMotion), which is there
// to look at the motion. useArtMotionAlways() also lets BossArena keep its card entrances (the lg-motion class).
// The owner's "Still bosses" (features.legends.still, toggled on the fight screen and in Settings) stills them all
// for a learner who wants no distraction, and wins over "Always animate"; only the asset view ignores it.
export const ArtMotion = createContext(false)
export function useArtStill() {
  const forced = useContext(ArtMotion)
  const ctx = useFeatureCtx()
  return !forced && !!ctx && featureCfg(ctx, LEGENDS_ID).still === true
}
export function useArtMotionAlways() {
  const forced = useContext(ArtMotion)
  const ctx = useFeatureCtx()
  return forced || (!!ctx && featureCfg(ctx, LEGENDS_ID).motion === true && featureCfg(ctx, LEGENDS_ID).still !== true)
}
// Sanitized markup with only the motion `mode` allows (parsed inertly; nothing here runs the file).
// `phase` (a raid boss shown in fight phase 1, 2 or 3, under the arena's data-phase rules): the animations inside the
// phase layers that phase HIDES are dropped too (display:none does not stop SMIL: about half a raid boss's animations
// ticked unseen). No phase drops nothing for it. A phase change re-derives the markup, so the new layers animate.
const HIDDEN_IN_PHASE = { 1: ['lg-p2', 'lg-p3'], 2: ['lg-p1', 'lg-p3'], 3: ['lg-p1', 'lg-p12'] }
export function withMotion(svg, mode, phase) {
  const hidden = svg && svg.includes('lg-p') ? HIDDEN_IN_PHASE[phase] : null
  if (!svg || (mode === 'intro' && !hidden)) return svg
  const doc = new DOMParser().parseFromString(svg, 'text/html')
  const inHidden = (n) => {
    for (let p = n.parentElement; p; p = p.parentElement) if (hidden.some((c) => p.classList.contains(c))) return true
    return false
  }
  for (const n of [...doc.body.querySelectorAll('*')]) {
    if (!ANIM_TAGS.has(n.localName.toLowerCase())) continue
    const off = mode !== 'intro' && (mode !== 'idle' || n.classList.contains('lg-in'))
    if (off || (hidden && inHidden(n))) n.remove()
  }
  return doc.body.innerHTML
}
// withMotion parses the whole file (a raid boss is up to 1 MB), and every drawing ran it on every mount: Back to the
// asset view's Boss families re-parsed all 65 portraits (about 150 ms), a raid boss's page parsed its file once per
// copy (palettes, phases, sizes: about 300 ms for the hydra). The result depends only on (file, mode, phase), so it is
// kept here, newest first, within a size budget (characters) so a long session cannot hoard markup.
const MOTION_CACHE = { maxEntries: 64, maxChars: 40e6 }
const motionCache = new Map()
let motionChars = 0
export function motionMarkup(key, svg, mode, phase) {
  if (!svg) return svg
  const hidden = svg.includes('lg-p') ? HIDDEN_IN_PHASE[phase] : null
  if (mode === 'intro' && !hidden) return svg
  const k = `${key}|${mode}|${hidden ? phase : ''}`
  const hit = motionCache.get(k)
  if (hit && hit.src === svg) { motionCache.delete(k); motionCache.set(k, hit); return hit.out }
  if (hit) { motionCache.delete(k); motionChars -= hit.out.length }
  const out = withMotion(svg, mode, phase)
  motionCache.set(k, { src: svg, out })
  motionChars += out.length
  for (const [old, v] of motionCache) {
    if (motionCache.size <= MOTION_CACHE.maxEntries && motionChars <= MOTION_CACHE.maxChars) break
    if (old === k) continue
    motionCache.delete(old); motionChars -= v.out.length
  }
  return out
}

// The asset viewer names every drawing: a tag UNDER it with its file ("areas/frontier.svg"), so a screenshot says
// which file to open (under, never on the art). ONLY the asset view (AssetView.jsx) and the dev gallery provide it.
export const ArtLabels = createContext(false)
const LABEL_MIN_PX = 100 // smaller drawings (map icons, the stage strip) are too small for a readable tag

// A boss (or raid boss) is a figure on a backdrop, not a picture with edges: a flame or a wing that grows past the
// 120 x 120 frame was sliced flat, a visible invisible box. So a figure may draw up to BOSS_HEADROOM past its frame
// (the SVG overflows, the box clips at that wider edge). Parts parked far off canvas to hide them (a translate of
// 200) stay hidden. Banners are pictures: they clip at their own edge.
export const HEADROOM_SHARE = 0.2
// The space a figure of `size` px may draw past its frame: give it as margin wherever text or controls sit next to one.
export const headroomPx = (size) => Math.round(size * HEADROOM_SHARE)
const BOSS_HEADROOM = `${HEADROOM_SHARE * 100}%`
const freeFigure = (svg) => svg.replace(/<svg\b/, '<svg overflow="visible"')

// One art file, colored for `palette`. While it loads (or if it is missing) the frame shows the palette's sky.
// `room`: a figure wrapped in its headroom as real space (margin on every side), for places where text, buttons or
// other drawings sit next to it. The asset view and gallery (ArtLabels) always give it.
export function LegendsArt({ kind, motif, palette, height, width = '100%', locked = false, round = RADIUS.lg, animated = false, style, room = false, roomed = false, phase }) {
  const url = artUrl(kind, motif)
  const [html, setHtml] = useState(() => (ready.has(url) ? { url, svg: ready.get(url) } : { url: '', svg: '' }))
  const boxRef = useRef(null)
  const near = useArtInView(boxRef)
  useEffect(() => {
    if (!near) return undefined
    let live = true
    loadArt(url).then((svg) => { if (live) setHtml((h) => (h.url === url && h.svg === svg ? h : { url, svg })) })
    return () => { live = false }
  }, [url, near])
  const always = useArtMotionAlways()
  const still = useArtStill()
  const mode = locked || still || (!always && reducedMotion()) ? false : animated
  const raw = html.url === url ? html.svg : ''
  const figure = kind !== 'areas'
  const [idSuffix] = useState(() => `a${++artSeq}`) // this drawing's own ids (idTemplate)
  // `phase`: only the arena (and the asset view's phase cells) pass it; a still drawing has no animations to drop.
  const livePhase = mode ? phase : undefined
  // Built only while near the screen (an off-screen drawing is not in the page anyway), from the shared motion cache.
  const svg = useMemo(() => {
    if (!near || !raw) return ''
    const out = withIds(motionMarkup(url, raw, mode, livePhase), idSuffix)
    return figure ? freeFigure(out) : out
  }, [near, url, raw, mode, livePhase, figure, idSuffix])
  const shown = near && !!svg // off screen: out of the page (the box keeps its size)
  useEffect(installArtSleep, [])
  // A drawing put in the page while the window sleeps starts paused (its entrance plays on return).
  useEffect(() => { if (asleep && shown && boxRef.current) setArtPlaying(artSvgs(boxRef.current), false) }, [shown, svg])
  const photo = url === PHOTO_FILE && photoSpritesUsable() // the photo ophanim's own light layers (PHOTO LIGHT); never over the painted fallback
  const labels = useContext(ArtLabels)
  const big = (typeof height !== 'number' || height >= LABEL_MIN_PX) && (typeof width !== 'number' || width >= LABEL_MIN_PX)
  const art = (
    <div ref={boxRef} data-lg-art="" style={{
      width: labels && big ? '100%' : width, height, borderRadius: round, flexShrink: 0, ...artVars(palette),
      ...(figure ? { overflow: 'visible', clipPath: `inset(-${BOSS_HEADROOM})` } : { overflow: 'hidden' }),
      background: figure ? 'transparent' : 'var(--lg-sky)', filter: locked ? 'grayscale(1) opacity(.55)' : 'none', ...style,
      ...(photo ? { position: 'relative', isolation: 'isolate' } : {}),
    }}>
      {photo && near && <PhotoLightBack motion={!!mode} />}
      {shown && <div style={{ width: '100%', height: '100%', ...(photo ? { position: 'relative', zIndex: 1 } : {}) }} dangerouslySetInnerHTML={{ __html: svg }} />}
      {photo && shown && <PhotoLightFront motion={!!mode} />}
    </div>
  )
  // A figure keeps its headroom as real space on every side, so what it draws past its frame never runs under its
  // file tag, a caption, a button, a title or the next drawing.
  const size = Math.max(typeof height === 'number' ? height : 0, typeof width === 'number' ? width : 0)
  const pad = figure && size && (room || labels) ? headroomPx(size) : 0
  // `roomed`: the parent already keeps the headroom around a box of exactly this size (boss card, fight arena), so the
  // art stays in that box and the tag sits in the reserved space below it (padding again pushed the boss off center).
  if (labels && big && roomed) {
    return (
      <div style={{ position: 'relative', width, height, flexShrink: 0 }}>
        {art}
        <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: `calc(100% + ${Math.max(0, pad - 18)}px)`, padding: '1px 6px', borderRadius: 4,
          background: 'rgba(0,0,0,.72)', color: '#fff', font: '700 10px/1.4 monospace', textTransform: 'none', letterSpacing: 'normal', whiteSpace: 'nowrap' }}>
          {url.slice(ART_BASE.length + 1)}
        </span>
      </div>
    )
  }
  if (!labels || !big) return pad && !roomed ? <div style={{ padding: pad, flexShrink: 0, lineHeight: 0 }}>{art}</div> : art
  return (
    // A banner never runs past its column (a 620px map banner spilled off the asset view's card on a narrow window);
    // a figure keeps its exact size and headroom.
    <div style={{ width: typeof width === 'number' ? width + pad * 2 : width, ...(figure ? {} : { maxWidth: '100%' }), padding: pad, boxSizing: 'border-box', display: 'grid', gap: 4, justifyItems: 'start', flexShrink: 0 }}>
      {art}
      <span style={{ marginTop: pad, padding: '1px 6px', borderRadius: 4, background: 'rgba(0,0,0,.72)', color: '#fff',
        font: '700 10px/1.4 monospace', textTransform: 'none', letterSpacing: 'normal', whiteSpace: 'nowrap' }}>
        {url.slice(ART_BASE.length + 1)}
      </span>
    </div>
  )
}

// The drawing's sanitized markup ('' until loaded), from the same cache LegendsArt reads (no second fetch or sanitize).
export function useArtMarkup(kind, motif) {
  const url = artUrl(kind, motif)
  const [html, setHtml] = useState({ url: '', svg: '' })
  useEffect(() => {
    let live = true
    loadArt(url).then((svg) => { if (live) setHtml({ url, svg }) })
    return () => { live = false }
  }, [url])
  return html.url === url ? html.svg : ''
}
// A still, standalone copy of a figure for use as a CSS mask (its silhouette): no animations, own ids, and a viewBox
// widened by the figure's headroom so parts drawn past the frame count too (the mask box is inset by the same share).
// Kept per file (the entrance card remounts on every Replay, palette and item change: two parses each time).
const glowCache = new Map()
const GLOW_CACHE_MAX = 8
export function artGlowMask(svg) {
  if (!svg) return ''
  if (glowCache.has(svg)) return glowCache.get(svg)
  const out = buildGlowMask(svg)
  glowCache.set(svg, out)
  if (glowCache.size > GLOW_CACHE_MAX) glowCache.delete(glowCache.keys().next().value)
  return out
}
function buildGlowMask(svg) {
  let out = withIds(withMotion(svg, false), 'glow')
  out = out.replace(/<svg\b([^>]*)>/i, (m, attrs) => {
    let a = attrs.replace(/\s(width|height|preserveAspectRatio)="[^"]*"/g, '')
    a = a.replace(/\sviewBox="\s*([-\d.]+)[\s,]+([-\d.]+)[\s,]+([-\d.]+)[\s,]+([-\d.]+)\s*"/i, (v, x, y, w, h) => {
      const dx = +w * HEADROOM_SHARE, dy = +h * HEADROOM_SHARE
      return ` viewBox="${+x - dx} ${+y - dy} ${+w + 2 * dx} ${+h + 2 * dy}"`
    })
    return `<svg${a} preserveAspectRatio="none">`
  })
  // An image must be XML: re-serialize (namespaces, entities) from the inert HTML parse.
  const el = new DOMParser().parseFromString(out, 'text/html').body.querySelector('svg')
  return el ? new XMLSerializer().serializeToString(el) : ''
}

export const AreaArt = ({ area, height = 120, width = '100%', locked = false, animated = 'idle', style }) => (
  <LegendsArt kind="areas" motif={area?.motif} palette={area?.palette} height={height} width={width} locked={locked} animated={animated} style={style} />
)
export const BossArt = ({ area, size = 64, locked = false, animated = false, style, room = false, roomed = false }) => (
  <LegendsArt kind="bosses" motif={area?.motif} palette={area?.palette} height={size} width={size} round={0} locked={locked} animated={animated} style={style} room={room} roomed={roomed} />
)
