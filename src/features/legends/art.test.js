// The Legends art ships with the app (public/assets/legends): every motif the map can pick needs its banner and
// its boss, and a file must stay plain drawing (the app inlines it into the page).
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { MOTIFS } from './map'
import { artUrl, artVars } from './art'

const PUBLIC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../public')
const read = (url) => fs.readFileSync(path.join(PUBLIC, url), 'utf8')
const APP_VARS = Object.keys(artVars('brand'))

describe('Legends art files', () => {
  for (const kind of ['areas', 'bosses']) {
    for (const motif of MOTIFS) {
      it(`${kind}/${motif}.svg exists and is plain drawing`, () => {
        const svg = read(artUrl(kind, motif))
        expect(svg).toMatch(/^<svg[\s\S]*<\/svg>\s*$/)
        expect(svg).toMatch(/viewBox="0 0 \d+ \d+"/)
        expect(svg).not.toMatch(/<(script|foreignObject|image|use|a|style)\b|\son\w+\s*=|url\s*\(|javascript:|href=/i)
        // Every color variable has a fallback, so the file also looks right on its own and outside the app.
        for (const m of svg.matchAll(/var\((--[\w-]+)(,[^)]*)?\)/g)) expect(m[2], `${m[1]} in ${kind}/${motif}`).toBeTruthy()
        // Motion: only what the sanitizer keeps (<animate>/<set> are dropped), each piece tagged entrance or loop,
        // no ids (a file is inlined many times on one page) and no calcMode (dropped too: timing is linear).
        expect(svg).not.toMatch(/<animate[\s>/]|<set\b|\sid=|calcMode/i)
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
  it('names a real file for an unknown motif', () => {
    expect(artUrl('areas', 'atlantis')).toBe(artUrl('areas', MOTIFS[0]))
  })
  it('sets the documented palette variables', () => {
    expect(APP_VARS).toEqual(['--lg-sky', '--lg-far', '--lg-near', '--lg-deep', '--lg-accent', '--lg-light'])
  })
})
