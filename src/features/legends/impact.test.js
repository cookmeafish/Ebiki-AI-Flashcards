import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { RAID_ORDER } from './raid'
import { RAID_IMPACT, DEFAULT_IMPACT, BODY, MOMENT_KEYS, impactFor } from './impact/styles'
import { BOSS_GLYPHS, GLYPH_NAMES } from './impact/glyphs'
import { PARTS, PART_NAMES } from './impact/parts'
import { BODY_KEYFRAMES, BODY_CSS, BODY_OF_MOMENT, bodyAnimation } from './impact/body'
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
      for (const key of MOMENT_KEYS) {
        expect(s[key].length, `${m}.${key}`).toBeGreaterThan(0)
        for (const [p, o = {}] of s[key]) {
          expect(PART_NAMES, `${m}.${key}`).toContain(p)
          if (o.glyph) expect(GLYPH_NAMES, `${m}.${key}`).toContain(o.glyph)
          if (o.color) expect(o.color, `${m}.${key}`).toMatch(/^#[0-9a-f]{6}$/i)
        }
      }
      for (const mo of MOMENT_KEYS) {
        expect(BODY[mo], `${m} body.${mo}`).toContain(s.body[mo])
        expect(bodyAnimation(s.body, mo), m).toMatch(/^lgBody/)
      }
    }
  })
  it('every body move has its keyframes', () => {
    for (const mo of MOMENT_KEYS) for (const name of BODY[mo]) {
      expect(BODY_KEYFRAMES[mo][name], `${mo}.${name}`).toBeTruthy()
    }
    expect(BODY_CSS).not.toMatch(/undefined/)
  })
  // THE OWNER'S RULE: "every impact needs to be different". Within one boss, the nine moments the arena plays never
  // share a part list (names and params) or a body move; across bosses no two play one moment the same way.
  it('within each boss every moment is its own animation (parts and body move)', () => {
    const full = (parts) => JSON.stringify(parts)
    for (const m of RAID_ORDER) {
      const st = RAID_IMPACT[m]
      const parts = MOMENTS.map((mo) => full(momentParts(mo, st).parts))
      expect(new Set(parts).size, `${m}: two moments play the same parts`).toBe(MOMENTS.length)
      const bodies = MOMENTS.map((mo) => bodyAnimation(st.body, mo).split(' ')[0])
      expect(new Set(bodies).size, `${m}: two moments share a body move`).toBe(MOMENTS.length)
      // and no moment is just another moment's parts with one part added or taken away
      const names = MOMENTS.map((mo) => momentParts(mo, st).parts.map(([p]) => p).filter((p) => !['flash', 'vignette', 'parry'].includes(p)))
      for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
        const a = names[i].join(',')
        const b = names[j].join(',')
        expect(a === b, `${m}: ${MOMENTS[i]} and ${MOMENTS[j]} use the same parts`).toBe(false)
      }
    }
  })
  it("a heavy blow is a different move, never the boss's plain strike or its knockout made bigger", () => {
    const SHARED = new Set(['vignette', 'quake', 'crack', 'dust', 'drops', 'rise', 'sparks', 'burst', 'ring', 'shards', 'splat', 'rays'])
    for (const m of RAID_ORDER) {
      const st = RAID_IMPACT[m]
      const own = (parts) => new Set(parts.map(([p]) => p).filter((p) => !SHARED.has(p)))
      const heavy = own(st.heavy)
      for (const p of own(st.strike)) expect(heavy.has(p), `${m}: heavy reuses its strike's ${p}`).toBe(false)
      for (const p of own(st.ko)) expect(heavy.has(p), `${m}: heavy reuses its knockout's ${p}`).toBe(false)
      for (const p of own(st.ko)) expect(own(st.wind).has(p), `${m}: wind reuses its knockout's ${p}`).toBe(false)
    }
  })
  it('across bosses no two play the same moment the same way', () => {
    for (const mo of MOMENTS) {
      const all = RAID_ORDER.map((m) => JSON.stringify([RAID_IMPACT[m].glyph, momentParts(mo, RAID_IMPACT[m]).parts]))
      expect(new Set(all).size, mo).toBe(all.length)
    }
  })
  it('every strike moment maps to a body set', () => {
    for (const mo of MOMENTS) expect(BODY_KEYFRAMES[BODY_OF_MOMENT[mo]], mo).toBeTruthy()
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
    // Every power, Bandage and Second wind included (their own casts: impact/PowerFx.jsx, powerfx.test.js).
    for (const id of Object.keys(POWERS)) {
      expect(POWER_FX[id], id).toBeTruthy()
      expect(en[POWER_FX[id].label], id).toBeTruthy()
      const html = renderToStaticMarkup(createElement(PowerFx, { t: (k) => k, power: { id, n: 1 } }))
      expect(html, id).not.toMatch(/NaN|undefined/)
    }
  })
})
