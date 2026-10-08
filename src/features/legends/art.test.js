// The Legends art ships with the app (public/assets/legends): every motif the map can pick needs its banner and
// its boss, and a file must stay plain drawing (the app inlines it into the page).
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { MOTIFS } from './map'
import { RAID_MOTIFS } from './raid'
import { artUrl, artVars, ORIGINAL_PALETTE, REALISTIC_ART, idTemplate, withIds, withPhotoEye, PHOTO_EYE_URL, PHOTO_SPRITES, PHOTO_CELL_URLS, photoCellUrl } from './art'

const PUBLIC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../public')
const read = (url) => fs.readFileSync(path.join(PUBLIC, url), 'utf8')
const APP_VARS = Object.keys(artVars('brand'))
// A drawing is painted in its own colors; a palette reaches only the one part that uses the tint (art.jsx).
const PAINT_VARS = /var\(--lg-(sky|far|near|deep|accent|light)\b/
const TINT_VAR = /var\(--lg-tint(-hi|-lo)?,\s*#[0-9a-fA-F]{3,8}\)/

// Ability face layers (`lg-fx-<key>` / `lg-fxh-<key>`) must sit INSIDE a phase group (lg-p1, lg-p2, lg-p3 or lg-p12):
// the arena's data-phase shows one phase group, so data-phase + data-fx pick the right face (design v2.1, 1.4). Returns
// the classes of every face layer found outside one. Only the layers a file really has are checked.
const PHASE_GROUP = /(^|\s)lg-p(1|2|3|12)(\s|$)/
const FX_LAYER = /(^|\s)lg-fxh?-[\w-]+/
function fxLayersOutsidePhases(svg) {
  const bad = []
  const stack = []
  for (const m of String(svg).matchAll(/<(\/?)([A-Za-z][\w:-]*)\b([^>]*?)(\/?)>/g)) {
    const [, close, , attrs, selfClose] = m
    if (close) { stack.pop(); continue }
    const cls = (/\sclass="([^"]*)"/.exec(attrs) || [])[1] || ''
    const inPhase = PHASE_GROUP.test(cls) || stack.some((c) => PHASE_GROUP.test(c))
    if (FX_LAYER.test(cls) && !inPhase) bad.push(cls)
    if (!selfClose) stack.push(cls)
  }
  return bad
}

describe('Legends art files', () => {
  for (const kind of ['areas', 'bosses']) {
    for (const motif of MOTIFS) {
      it(`${kind}/${motif}.svg exists and is plain drawing`, () => {
        const svg = read(artUrl(kind, motif))
        const real = REALISTIC_ART.includes(`${kind}/${motif}.svg`) // local gradients allowed (checked below)
        expect(svg).toMatch(/^<svg[\s\S]*<\/svg>\s*$/)
        expect(svg).toMatch(/viewBox="0 0 \d+ \d+"/)
        expect(svg).not.toMatch(real ? /<(script|foreignObject|image|use|a|style|filter)\b|\son\w+\s*=|javascript:/i
          : /<(script|foreignObject|image|use|a|style)\b|\son\w+\s*=|url\s*\(|javascript:|href=/i)
        // Every color variable has a fallback, so the file also looks right on its own and outside the app.
        for (const m of svg.matchAll(/var\((--[\w-]+)(,[^)]*)?\)/g)) expect(m[2], `${m[1]} in ${kind}/${motif}`).toBeTruthy()
        // Its own colors, with one part a palette may recolor.
        expect(svg, `${kind}/${motif} repaints with the palette`).not.toMatch(PAINT_VARS)
        expect(svg, `${kind}/${motif} has a part the palette tints`).toMatch(TINT_VAR)
        // Motion: only what the sanitizer keeps (<animate>/<set> are dropped), each piece tagged entrance or loop,
        // no ids (a file is inlined many times on one page) and no calcMode (dropped too: timing is linear).
        expect(svg).not.toMatch(real ? /<animate[\s>/]|<set\b|calcMode/i : /<animate[\s>/]|<set\b|\sid=|calcMode/i)
        const anims = [...svg.matchAll(/<animate(Transform|Motion)\b[^>]*>/g)].map((m) => m[0])
        for (const a of anims) expect(a, `${kind}/${motif}: ${a.slice(0, 80)}`).toMatch(/class="lg-(in|loop)"/)
        // keyTimes must match the values one to one and run 0 to 1, else the browser silently ignores the animation.
        for (const a of anims) {
          const kt = /keyTimes="([^"]*)"/.exec(a)
          if (!kt) continue
          const times = kt[1].split(';').map(Number)
          const values = /values="([^"]*)"/.exec(a)?.[1].split(';') || []
          expect(times.length, `${kind}/${motif}: ${a.slice(0, 80)}`).toBe(values.length)
          expect([times[0], times[times.length - 1]], `${kind}/${motif}: ${kt[0]}`).toEqual([0, 1])
        }
        expect(anims.some((a) => a.includes('lg-loop')), `${kind}/${motif} has idle life`).toBe(true)
        if (kind === 'bosses') expect(anims.some((a) => a.includes('lg-in')), `${kind}/${motif} has an entrance`).toBe(true)
        else expect(anims.some((a) => a.includes('lg-in')), `${kind}/${motif}: banners have no entrance`).toBe(false)
      })
    }
  }
  it('every motif has its own boss entrance', async () => {
    const { ENTRANCES } = await import('./BossArena')
    for (const motif of MOTIFS) expect(ENTRANCES[motif], motif).toBeTruthy()
    expect(new Set(MOTIFS.map((m) => ENTRANCES[m].name)).size).toBe(MOTIFS.length)
  })
  it('the review gallery catalog lists every motif once, in order', async () => {
    const { CATALOG } = await import('../../../dev/legends-gallery/catalog.js')
    expect(CATALOG.map((c) => c.motif)).toEqual(MOTIFS)
    CATALOG.forEach((c, i) => {
      expect(c.n).toBe(i + 1)
      for (const k of ['boss', 'idea', 'entrance', 'lair', 'palette']) expect(c[k], `${c.motif}.${k}`).toBeTruthy()
    })
  })
  for (const motif of RAID_MOTIFS) {
    it(`raids/${motif}.svg keeps its own colors and tints one part`, () => {
      const svg = read(artUrl('raids', motif))
      expect(svg).not.toMatch(PAINT_VARS)
      expect(svg).toMatch(TINT_VAR)
    })
  }
  // The opt-in for a painted 3D look (art.jsx REALISTIC_ART): ids and gradients, but every reference stays inside the
  // file (no external url, no <use>/<image>/<filter>: the sanitizer strips filter primitives, and an empty filter
  // hides what uses it), every var() keeps its fallback and the palette still tints one part.
  for (const file of REALISTIC_ART) {
    it(`${file} references only its own ids`, () => {
      const svg = read(`/assets/legends/${file}`)
      expect(svg).not.toMatch(/<(script|foreignObject|image|use|a|style|filter|fe\w+)\b|xlink:|javascript:|image-set|@import/i)
      const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])
      expect(new Set(ids).size, `${file}: duplicate ids`).toBe(ids.length)
      for (const m of svg.matchAll(/url\s*\(([^)]*)\)/g)) {
        const ref = /^\s*['"]?#([\w-]+)['"]?\s*$/.exec(m[1])
        expect(!!ref && ids.includes(ref[1]), `${file}: ${m[0]}`).toBe(true)
      }
      for (const m of svg.matchAll(/href="([^"]*)"/g)) expect(m[1][0] === '#' && ids.includes(m[1].slice(1)), `${file}: href ${m[1]}`).toBe(true)
      for (const m of svg.matchAll(/var\((--[\w-]+)(,[^)]*)?\)/g)) expect(m[2], `${m[1]} in ${file}`).toBeTruthy()
      expect(svg).not.toMatch(PAINT_VARS)
      expect(svg).toMatch(TINT_VAR)
    })
  }
  it('gives every mounted copy of a file its own ids', () => {
    const t = idTemplate('<svg><linearGradient id="g"></linearGradient><linearGradient id="g2" href="#g"></linearGradient><rect fill="url(#g)" stroke="url(&quot;#g2&quot;)" data-x="g"></rect></svg>')
    expect(withIds(t, 'a1')).toBe('<svg><linearGradient id="g-a1"></linearGradient><linearGradient id="g2-a1" href="#g-a1"></linearGradient><rect fill="url(#g-a1)" stroke="url(&quot;#g2-a1&quot;)" data-x="g"></rect></svg>')
    expect(withIds(t, 'a2')).toContain('fill="url(#g-a2)"')
    // A flat file (no ids) is left exactly as it was.
    expect(idTemplate('<svg><rect fill="#fff"></rect></svg>')).toBe('<svg><rect fill="#fff"></rect></svg>')
  })
  it('puts the photos only into the ophanim, from the app\'s own fixed files', () => {
    const urls = ['eye', 'wings', 'cloud', 'rings', 'light'].map((k) => PHOTO_SPRITES[k].url)
    expect(urls).toEqual(['eye', 'wings', 'cloud', 'rings', 'light'].map((k) => `/assets/legends/raids/ophanim-${k}.webp`))
    expect(Object.keys(PHOTO_SPRITES)).toHaveLength(5)
    expect(PHOTO_EYE_URL).toBe(urls[0])
    for (const u of urls) expect(fs.existsSync(path.join(PUBLIC, u)), u).toBe(true)
    // every cell the drawing uses is its own file (never a nested <svg viewBox> window onto a sheet)
    expect(PHOTO_CELL_URLS).toHaveLength(26)
    for (const u of PHOTO_CELL_URLS) expect(fs.existsSync(path.join(PUBLIC, u)), u).toBe(true)
    const marked = '<svg><g class="lg-photo-ball"></g><g class="lg-photo-iris3"></g><circle class="lg-photo-hide"></circle>' +
      '<g class="lg-photo-hide lg-pwh-3"></g><g class="lg-photo-wing lg-pw-2" transform="scale(2 1)"></g>' +
      '<g class="lg-photo-cloud lg-pc-3" transform="translate(1 2)"></g></svg>'
    const out = withPhotoEye(marked, artUrl('raids', 'ophanim'))
    // eye 2, a wing twice (white for phases 1 and 2, warm for phase 3), the cloud once
    expect(out.match(/<image /g)).toHaveLength(5)
    expect([...out.matchAll(/href="([^"]*)"/g)].map((m) => m[1])).toEqual([photoCellUrl('eye', 0), photoCellUrl('eye', 3), photoCellUrl('wings', 2), photoCellUrl('wings', 6), photoCellUrl('cloud', 3)])
    expect(out).not.toMatch(/<svg x=|viewBox="d/)
    expect(out).toContain('class="lg-photo-hide" style="display:none"')
    expect(out).toContain('class="lg-photo-hide lg-pwh-3" style="display:none"')
    expect(out).toContain('<g class="lg-photo-wing" transform="scale(2 1)"><g class="lg-p12">')
    expect(out).toContain(`<g class="lg-p3" style="display:none"><image href="${photoCellUrl('wings', 6)}" x="0" y="0" width="1" height="1" preserveAspectRatio="none"/>`)
    expect(out).toContain(`<g class="lg-photo-cloud" transform="translate(1 2)"><image href="${photoCellUrl('cloud', 3)}" x="0" y="0" width="1" height="1"`)
    // Any other drawing, even one carrying the same marks, is left exactly as it was.
    expect(withPhotoEye(marked, artUrl('raids', 'seraph'))).toBe(marked)
    // The file itself never holds an image or a URL; it only marks the places.
    const svg = read('/assets/legends/raids/ophanim.svg').replace(/<!--[\s\S]*?-->/g, '')
    expect(svg).not.toMatch(/<image\b|\.webp/)
    for (const c of ['lg-photo-ball', 'lg-photo-ball3', 'lg-photo-iris3']) expect(svg.split(`<g class="${c}"></g>`)).toHaveLength(2)
    // the phase 1/2 iris twice: a still copy for phase 1 and the looking-around one for phase 2
    expect(svg.split('<g class="lg-photo-iris"></g>')).toHaveLength(3)
    expect(svg.match(/<g class="lg-photo-wing lg-pw-[0-3]" transform="[^"]+"><\/g>/g)).toHaveLength(24)
    expect(svg.match(/<g class="lg-photo-cloud lg-pc-[0-3]" transform="[^"]+"><\/g>/g)).toHaveLength(4)
    // eight wheels, each a back half and a front half
    expect(svg.match(/<g class="lg-photo-ring lg-pr-\d" transform="[^"]+"><\/g>/g)).toHaveLength(16)
    // the sky and light are HTML layers in art.jsx now (PHOTO LIGHT): the file only hides its painted backdrop
    expect(svg).not.toContain('lg-photo-light')
    expect(svg.match(/class="lg-photo-hide"/g).length).toBeGreaterThan(60)
    const injected = withPhotoEye(svg, artUrl('raids', 'ophanim'))
    expect(injected).not.toMatch(/<g class="lg-photo-(wing|cloud|ring|light)[^"]*"[^>]*><\/g>/) // every marker filled
    for (const m of injected.matchAll(/<image [^>]*href="([^"]*)"/g)) expect(PHOTO_CELL_URLS).toContain(m[1])
  })
  it('names a real file for an unknown motif', () => {
    expect(artUrl('areas', 'atlantis')).toBe(artUrl('areas', MOTIFS[0]))
  })
  it('sets the documented palette variables', () => {
    expect(APP_VARS).toEqual(['--lg-sky', '--lg-far', '--lg-near', '--lg-deep', '--lg-accent', '--lg-light', '--lg-tint', '--lg-tint-hi', '--lg-tint-lo'])
    // "original" leaves the tint unset: every part shows the color written in its file.
    expect(Object.keys(artVars(ORIGINAL_PALETTE)).filter((k) => k.startsWith('--lg-tint'))).toEqual([])
  })
})

describe('raid ability face layers', () => {
  it('the checker finds a face layer outside a phase group', () => {
    expect(fxLayersOutsidePhases('<svg><g class="lg-p1"><g class="lg-fx-sever"><path/></g></g><g class="lg-p12 x"><path class="lg-fxh-grin"/></g></svg>')).toEqual([])
    expect(fxLayersOutsidePhases('<svg><g class="body"><g class="lg-fx-sever" style="display:none"><path/></g></g></svg>')).toEqual(['lg-fx-sever'])
    expect(fxLayersOutsidePhases('<svg><g class="lg-p2"></g><path class="lg-fxh-eye"/></svg>')).toEqual(['lg-fxh-eye'])
  })
  for (const motif of RAID_MOTIFS) {
    it(`raids/${motif}.svg keeps every lg-fx face layer inside a phase group`, () => {
      expect(fxLayersOutsidePhases(read(artUrl('raids', motif)))).toEqual([])
    })
  }
})

// motionMarkup: one parse per (file, mode, phase); a remount or a second copy reads the cache (Back to Boss families
// used to re-parse every portrait), and a changed file is parsed again.
describe('motionMarkup cache', () => {
  it('parses once per variant and again when the file changes', async () => {
    const { motionMarkup } = await import('./art')
    let parses = 0
    const real = globalThis.DOMParser
    globalThis.DOMParser = class {
      parseFromString(s) { parses++; return { body: { querySelectorAll: () => [], innerHTML: `parsed:${s}` } } }
    }
    try {
      const svg = '<svg><g class="lg-p1"></g><g class="lg-p2"></g></svg>'
      const a = motionMarkup('/x.svg', svg, false)
      expect(motionMarkup('/x.svg', svg, false)).toBe(a)
      expect(parses).toBe(1)
      motionMarkup('/x.svg', svg, 'idle', 1)
      motionMarkup('/x.svg', svg, 'idle', 1)
      motionMarkup('/x.svg', svg, 'idle', 2)
      expect(parses).toBe(3)
      expect(motionMarkup('/x.svg', svg, 'intro')).toBe(svg) // no phase: intro keeps everything, no parse
      expect(parses).toBe(3)
      motionMarkup('/x.svg', svg.replace('<svg>', '<svg id="new">'), false)
      expect(parses).toBe(4)
    } finally { globalThis.DOMParser = real }
  })
})

// Every path's `d` (and animateMotion `path`) in every Legends drawing must parse: the browser skips a malformed one and
// logs "Error: <path> attribute d: Expected number, "MZ"" on every render (cerberus.svg carried three empty "MZ" shadows).
const PATH_ARGS = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 }
const PATH_NUM = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/
function pathDataError(d) {
  const s = String(d ?? '')
  let i = 0
  const skip = () => { while (i < s.length && /[\s,]/.test(s[i])) i++ }
  const ws = () => { while (i < s.length && /\s/.test(s[i])) i++ }
  ws()
  if (i >= s.length) return null
  if (!/[Mm]/.test(s[i])) return `starts with "${s[i]}"`
  while (i < s.length) {
    ws()
    if (i >= s.length) break
    const c = s[i]
    const k = PATH_ARGS[c.toLowerCase()]
    if (k === undefined) return `bad command "${c}" at ${i}`
    i++
    if (k === 0) continue
    let groups = 0
    for (;;) {
      skip()
      if (i >= s.length || /[A-Za-z]/.test(s[i])) break
      for (let a = 0; a < k; a++) {
        if (a) skip()
        if (c.toLowerCase() === 'a' && (a === 3 || a === 4)) {
          if (s[i] !== '0' && s[i] !== '1') return `bad arc flag at ${i}`
          i++
          continue
        }
        const m = PATH_NUM.exec(s.slice(i))
        if (!m) return `expected a number at ${i}: ${JSON.stringify(s.slice(Math.max(0, i - 6), i + 6))}`
        i += m[0].length
      }
      groups++
    }
    if (!groups) return `"${c}" without numbers: ${JSON.stringify(s.slice(Math.max(0, i - 8), i + 6))}`
  }
  return null
}
const svgFiles = (dir) => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? svgFiles(path.join(dir, e.name)) : e.name.endsWith('.svg') ? [path.join(dir, e.name)] : []))

describe('path data', () => {
  it('the checker knows good and bad path data', () => {
    expect(pathDataError('M0 0L10 10Z')).toBe(null)
    expect(pathDataError('M1,2 a5 5 0 011 1 c1-2 .5.5 3 4z M0 0')).toBe(null)
    expect(pathDataError('MZ')).toMatch(/without numbers/)
    expect(pathDataError('M0 0 L5')).toMatch(/number/)
    expect(pathDataError('L0 0')).toMatch(/starts/)
  })
  it('every path in every Legends drawing parses', () => {
    const bad = []
    for (const f of svgFiles(path.join(PUBLIC, 'assets/legends'))) {
      const svg = fs.readFileSync(f, 'utf8')
      for (const m of svg.matchAll(/\s(d|path)="([^"]*)"/g)) {
        const err = pathDataError(m[2])
        if (err) bad.push(`${path.relative(PUBLIC, f)} ${m[1]}: ${err}`)
      }
    }
    expect(bad).toEqual([])
  })
})
