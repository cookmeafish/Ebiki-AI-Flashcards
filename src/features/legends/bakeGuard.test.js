// The sprite-rig bake keeps live every part of a drawing the page can reach (bakePlan.js PAGE_CLASS / BOUNDARY_CLASS).
// A class inside the art that page code styles or picks out, but that those patterns miss, would be baked into a
// bitmap and the effect on it would silently stop working. This test finds every such class.
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { PAGE_CLASS, BOUNDARY_CLASS } from './bakePlan'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ART = path.resolve(HERE, '../../../public/assets/legends')
const SRC = path.resolve(HERE, '../..')
const walk = (d, ext) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name), ext) : ext.some((x) => e.name.endsWith(x)) ? [path.join(d, e.name)] : []))

describe('bake guard', () => {
  it('keeps live every art class the page code refers to', () => {
    const classes = new Set()
    for (const f of walk(ART, ['.svg'])) {
      for (const m of fs.readFileSync(f, 'utf8').matchAll(/class="([^"]*)"/g)) for (const c of m[1].split(/\s+/)) if (c) classes.add(c)
    }
    const code = walk(SRC, ['.js', '.jsx']).filter((f) => !/\.test\.|[\\/]bake[\\/]|bakePlan\.js$/.test(f)).map((f) => fs.readFileSync(f, 'utf8')).join('\n')
    const missed = []
    for (const c of classes) {
      const esc = c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      if (!new RegExp(`[.'"\`\\s]${esc}(?![\\w-])`).test(code)) continue // the page never names it
      if (!PAGE_CLASS.test(c) && !BOUNDARY_CLASS.test(c)) missed.push(c)
    }
    expect(missed).toEqual([])
  })
  it('keeps live every attribute-selected family ([class*="..."]) the page uses', () => {
    const code = walk(SRC, ['.js', '.jsx']).filter((f) => !/\.test\./.test(f)).map((f) => fs.readFileSync(f, 'utf8')).join('\n')
    const families = [...code.matchAll(/\[class[*^]?=\\?["']((?:lg|lgfa|lgo|lgs|lgr)[\w-]*)/g)].map((m) => m[1])
    expect(families.length).toBeGreaterThan(0)
    // lgr-* reactions sit on the page's own box (outside the SVG): never in the art
    for (const f of families.filter((x) => !x.startsWith('lgr-'))) expect(PAGE_CLASS.test(`${f}x`), f).toBe(true)
  })
})
