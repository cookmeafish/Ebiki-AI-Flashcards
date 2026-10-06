import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { RAID_ORDER } from './raid'
import { RAID_IMPACT, DEFAULT_IMPACT, BODY, impactFor } from './impact/styles'
import { BOSS_GLYPHS, GLYPH_NAMES } from './impact/glyphs'
import { PARTS, PART_NAMES } from './impact/parts'
import { BODY_KEYFRAMES, BODY_CSS, bodyAnimation } from './impact/body'
import StrikeFxLayer, { momentParts } from './StrikeFxLayer'
import { POWER_FX, PowerFx } from './impact/PowerFx'
import { POWERS } from './powers'
import en from '../../i18n/locales/en'

const MOMENTS = ['hit', 'crit', 'sharpen', 'hurt', 'hurtBig', 'block', 'shield', 'wind', 'ko']
const sig = (parts) => JSON.stringify(parts.map(([p, o]) => [p, o?.glyph || '', o?.dir || '', !!o?.inward, !!o?.cut, !!o?.collapse]))

describe('raid impact styles', () => {
  it('every raid boss has its own style', () => {
    for (const m of RAID_ORDER) expect(RAID_IMPACT[m], m).toBeTruthy()
    expect(impactFor('nobody')).toBe(DEFAULT_IMPACT)
  })
  it('each boss has its own glyph', () => {
    const glyphs = RAID_ORDER.map((m) => RAID_IMPACT[m].glyph)
    for (const g of glyphs) expect(BOSS_GLYPHS).toContain(g)
    expect(new Set(glyphs).size).toBe(glyphs.length)
  })
  it('no two bosses share a strike or a knockout', () => {
    const strikes = RAID_ORDER.map((m) => sig(RAID_IMPACT[m].strike))
    const kos = RAID_ORDER.map((m) => sig(RAID_IMPACT[m].ko))
    expect(new Set(strikes).size).toBe(strikes.length)
    expect(new Set(kos).size).toBe(kos.length)
  })
  it('only known parts, glyphs, body moves and fixed hex colors', () => {
    for (const [m, s] of [...Object.entries(RAID_IMPACT), ['default', DEFAULT_IMPACT]]) {
      for (const c of [s.color, s.accent]) expect(c, m).toMatch(/^#[0-9a-f]{6}$/i)
      for (const key of ['hit', 'crit', 'strike', 'ko']) {
        expect(s[key].length, `${m}.${key}`).toBeGreaterThan(0)
        for (const [p, o = {}] of s[key]) {
          expect(PART_NAMES, `${m}.${key}`).toContain(p)
          if (o.glyph) expect(GLYPH_NAMES, `${m}.${key}`).toContain(o.glyph)
          if (o.color) expect(o.color, `${m}.${key}`).toMatch(/^#[0-9a-f]{6}$/i)
        }
      }
      for (const mo of ['hit', 'strike', 'ko']) {
        expect(BODY[mo], m).toContain(s.body[mo])
        expect(bodyAnimation(s.body, mo), m).toMatch(/^lgBody/)
      }
    }
  })
  it('every body move has its keyframes', () => {
    for (const mo of ['hit', 'strike', 'ko']) for (const name of BODY[mo]) {
      expect(BODY_KEYFRAMES[mo][name], `${mo}.${name}`).toBeTruthy()
    }
    expect(BODY_CSS).not.toMatch(/undefined/)
  })
  it('every part renders, and every boss renders every moment', () => {
    const ctx = { color: '#ff0000', accent: '#000000', glyph: 'gear', scale: 1, speed: 1 }
    for (const name of PART_NAMES) {
      const out = PARTS[name]({}, ctx)
      expect(renderToStaticMarkup(createElement('div', null, out)), name).not.toMatch(/NaN|undefined/)
    }
    const t = (k) => k
    for (const m of RAID_ORDER) for (const mo of MOMENTS) {
      expect(momentParts(mo, RAID_IMPACT[m]).parts.length, `${m} ${mo}`).toBeGreaterThan(0)
      const html = renderToStaticMarkup(createElement(StrikeFxLayer, { t, moment: mo, motif: m, n: 1 }))
      expect(html, `${m} ${mo}`).not.toMatch(/NaN|undefined/)
    }
  })
  it('a knocked out boss stays visible (at least half opacity) (the result screen keeps it in frame)', () => {
    for (const [name, frames] of Object.entries(BODY_KEYFRAMES.ko)) {
      const end = frames.slice(frames.lastIndexOf('100%'))
      const m = end.match(/opacity:\s*([\d.]+)/)
      if (m) expect(Number(m[1]), name).toBeGreaterThanOrEqual(0.5)
    }
  })
  it('every power used in a raid has its burst, a translated label, and renders', () => {
    for (const id of Object.keys(POWERS).filter((p) => POWERS[p].kind !== 'siege' && p !== 'wind')) {
      expect(POWER_FX[id], id).toBeTruthy()
      expect(en[POWER_FX[id].label], id).toBeTruthy()
      for (const [p] of POWER_FX[id].parts) expect(PART_NAMES, id).toContain(p)
      const html = renderToStaticMarkup(createElement(PowerFx, { t: (k) => k, power: { id, n: 1 } }))
      expect(html, id).not.toMatch(/NaN|undefined/)
    }
  })
})
