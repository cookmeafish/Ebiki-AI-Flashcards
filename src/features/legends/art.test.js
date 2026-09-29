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
      })
    }
  }
  it('names a real file for an unknown motif', () => {
    expect(artUrl('areas', 'volcano')).toBe(artUrl('areas', MOTIFS[0]))
  })
  it('sets the documented palette variables', () => {
    expect(APP_VARS).toEqual(['--lg-sky', '--lg-far', '--lg-near', '--lg-deep', '--lg-accent', '--lg-light'])
  })
})
