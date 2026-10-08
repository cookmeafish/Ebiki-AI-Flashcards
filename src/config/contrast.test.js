import { describe, it, expect } from 'vitest'
import { PALETTE_CSS } from './palette'
import { C, fillFor } from './tokens'
import { paletteVars, contrastPairs, parseColor, contrast, over, AA_TEXT } from './contrast'

const THEMES = { light: ':root', dark: '[data-theme="dark"]' }

describe('palette contrast (WCAG AA)', () => {
  for (const [name, sel] of Object.entries(THEMES)) {
    it(`${name}: every audited text/background pair meets its minimum`, () => {
      const pairs = contrastPairs(paletteVars(PALETTE_CSS, sel))
      expect(pairs.length).toBeGreaterThan(50)
      const failing = pairs.filter((p) => p.ratio < p.min).map((p) => `${p.name}: ${p.ratio.toFixed(2)} < ${p.min}`)
      expect(failing).toEqual([])
    })

    it(`${name}: semantic text on the fixed chip tints in tokens.js stays AA`, () => {
      const v = paletteVars(PALETTE_CSS, sel)
      const surf = parseColor(v.surface)
      for (const [t, tint] of [['success', C.successTint], ['warning', C.warningTint], ['danger', C.dangerTint], ['info', C.infoTint], ['purple', C.purpleTint]]) {
        const r = contrast(parseColor(v[t]), over(parseColor(tint), surf))
        expect(r, `${t} on ${t}Tint`).toBeGreaterThanOrEqual(AA_TEXT)
      }
    })
  }

  it('keeps the brand identity and the light-mode-is-deeper rule', () => {
    const light = paletteVars(PALETTE_CSS, THEMES.light)
    const dark = paletteVars(PALETTE_CSS, THEMES.dark)
    expect(light.brand).toBe('#DF2540')
    expect(light['brand-fill']).toBe('#DF2540')
    const lum = (hex) => { const [r, g, b] = parseColor(hex); return r + g + b }
    for (const t of ['success', 'warning', 'danger', 'purple']) expect(lum(light[t])).toBeLessThan(lum(dark[t]))
  })

  it('fillFor maps text colors to their deep fills and leaves others alone', () => {
    expect(fillFor(C.brand)).toBe(C.brandFill)
    expect(fillFor(C.success)).toBe(C.successFill)
    expect(fillFor(C.teal)).toBe(C.teal)
    expect(fillFor('#123456')).toBe('#123456')
  })
})
