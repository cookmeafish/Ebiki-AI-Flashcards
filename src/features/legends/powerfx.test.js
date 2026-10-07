// RAID POWER ANIMATIONS (impact/PowerFx.jsx): every power has its OWN cast, every held or window power its own armed
// look, every power that acts on an answer its own proc (the owner: "make sure they all have unique animations").
import { describe, it, expect } from 'vitest'
import { POWER_IDS, POWERS } from './powers'
import { POWER_FX, POWER_ARMED, POWER_PROC } from './impact/PowerFx'
import en from '../../i18n/locales/en'

const pairs = (list) => list.flatMap((a, i) => list.slice(i + 1).map((b) => [a, b]))
const HEX = /^#[0-9a-f]{6}$/i

describe('power casts', () => {
  it('every power has a cast with fixed colors and a label in English', () => {
    for (const id of POWER_IDS) {
      const s = POWER_FX[id]
      expect(s, id).toBeTruthy()
      expect(s.color, id).toMatch(HEX)
      expect(s.accent, id).toMatch(HEX)
      expect(en[s.label], s.label).toBeTruthy()
    }
    expect(Object.keys(POWER_FX).sort()).toEqual([...POWER_IDS].sort())
  })
  it('no two casts share a color, a drawing, an icon entrance or a length', () => {
    for (const [a, b] of pairs(POWER_IDS)) {
      const x = POWER_FX[a]
      const y = POWER_FX[b]
      expect(x.color, `${a} vs ${b}`).not.toBe(y.color)
      expect(x.shape, `${a} vs ${b}`).not.toBe(y.shape)
      expect(x.icon, `${a} vs ${b}`).not.toBe(y.icon)
      expect(x.ms, `${a} vs ${b}`).not.toBe(y.ms)
    }
  })
})

describe('armed looks and procs', () => {
  it('every held or window power has its own armed look', () => {
    const held = POWER_IDS.filter((id) => POWERS[id].window || ['shield', 'sharpen', 'ward', 'steadfast'].includes(id))
    for (const id of held) expect(POWER_ARMED[id], id).toBeTruthy()
    const looks = Object.values(POWER_ARMED).map((x) => x.look)
    expect(new Set(looks).size).toBe(looks.length)
    for (const id of POWER_IDS.filter((x) => POWERS[x].window)) expect(POWER_ARMED[id].window, id).toBe(true)
  })
  it('the powers that act on an answer each have their own proc', () => {
    for (const id of ['focus', 'siphon', 'momentum', 'fury', 'ward', 'steadfast']) {
      const p = POWER_PROC[id]
      expect(p, id).toBeTruthy()
      expect(p.color, id).toMatch(HEX)
      expect(en[p.label], p.label).toBeTruthy()
    }
    const ids = Object.keys(POWER_PROC)
    for (const [a, b] of pairs(ids)) {
      expect(POWER_PROC[a].shape, `${a} vs ${b}`).not.toBe(POWER_PROC[b].shape)
      expect(POWER_PROC[a].color, `${a} vs ${b}`).not.toBe(POWER_PROC[b].color)
    }
  })
  it('a proc drawing is never one of the cast drawings', () => {
    const cast = new Set(Object.values(POWER_FX).map((x) => x.shape))
    for (const p of Object.values(POWER_PROC)) expect(cast.has(p.shape), p.shape).toBe(false)
  })
})
