// THE ABILITY FLOATER FIT (impact/labelFit.js floaterFit, BossArena): every raid boss's floater, in every language, on
// the normal and the compact arena, stays inside the arena card at its highest and over the head where it can (two
// lines at 26 px stood above the card: "-5 Bound!" on Cerberus, "-4 アンコール！" on the Showman, 51 px out).
import { describe, it, expect } from 'vitest'
import { floaterFit, floaterLines, floaterBreaks, floaterEm, FLOATER, FLOATER_POP_CSS } from './labelFit'
import { BOSS } from '../BossArena'
import { headroomPx } from '../art'
import { RAID_ABILITY, RAID_ORDER } from '../raid'
import { abilityById } from '../abilities'
import { floaterKeyFor, fxDemoFor, juiceFor } from '../fx'
import { floaterPxFor } from '../fx/_juice'
import { makeT, I18N_LANGS } from '../../../i18n'

// Every floater the fight can show: "<-damage> <text>" as BossArena builds it, with the fx demo's numbers.
function allFloaters() {
  const out = []
  for (const lang of I18N_LANGS) {
    const t = makeT(lang)
    for (const motif of RAID_ORDER) {
      const ability = RAID_ABILITY[motif]
      for (const fx of abilityById(ability)?.fxKeys || []) {
        const key = floaterKeyFor(ability, fx)
        if (!key) continue
        const demo = fxDemoFor(ability, fx) || {}
        const damage = demo.damage ?? 3
        const text = `${damage ? `-${damage} ` : ''}${t(key, demo.fxVars || {})}`
        out.push({ lang, motif, fx, text, base: floaterPxFor(juiceFor(ability, fx).size, text) })
      }
    }
  }
  return out
}
const reachOf = (text, px, maxW) => {
  const h = floaterLines(text, px, maxW) * FLOATER.line * px
  return Math.max(FLOATER.peak * h + FLOATER.peakRise * px, h + FLOATER.rise * px)
}

describe('ability floaters', () => {
  const floaters = allFloaters()
  it('covers every boss with a floater, in every language, as real text', () => {
    expect(new Set(floaters.map((f) => f.motif)).size).toBeGreaterThanOrEqual(20)
    for (const f of floaters) expect(f.text, `${f.lang} ${f.motif} ${f.fx}`).not.toMatch(/lg_/)
  })
  for (const box of [BOSS.arena, BOSS.arenaCompact]) {
    it(`stay inside the arena card at their highest, at a readable size (${box} px box)`, () => {
      const head = headroomPx(box)
      for (const f of floaters) {
        const { fontSize, maxWidth, bottom } = floaterFit(f.text, box, f.base, head)
        const what = `${f.lang} ${f.motif} ${f.fx} "${f.text}" @${box}`
        expect(fontSize, what).toBeGreaterThanOrEqual(FLOATER.minPx)
        expect(fontSize, what).toBeLessThanOrEqual(f.base)
        expect(bottom, what).toBeGreaterThanOrEqual(0)
        expect(bottom + reachOf(f.text, fontSize, maxWidth), what).toBeLessThanOrEqual(box + head - FLOATER.margin + 0.01)
        // every word fits one line (never broken: keep-all), or at the floor a little wider than the room (measured at the
        // pop's 1.25 peak, so at rest it still fits the box and its headroom): 15%, a long katakana word 25%
        for (const w of floaterBreaks(f.text).split(/[\s\u200b]+/)) expect(floaterEm(w) * fontSize, `${what} "${w}"`).toBeLessThanOrEqual(maxWidth * (fontSize === FLOATER.minPx ? (/[\u3040-\u30ff\u4e00-\u9fff]/u.test(w) ? 1.25 : 1.15) : 1) + 0.01)
      }
    })
  }
  // The owner: effects never cover a boss's face ("Wail!" sat across the Banshee's brows on the compact arena, lowered
  // to 62% of the box before it got smaller). The size gives way first: every floater sits over the head on the normal
  // arena, and on the compact one every floater that fits one line at the floor; only a longer one comes lower.
  it('sit over the head (bottom at 90% of the box) on the normal arena', () => {
    for (const f of floaters) {
      const { bottom } = floaterFit(f.text, BOSS.arena, f.base, headroomPx(BOSS.arena))
      expect(bottom, `${f.lang} ${f.motif} ${f.fx} "${f.text}"`).toBeCloseTo(BOSS.arena * FLOATER.bottom, 1)
    }
  })
  it('get smaller before they come lower on the compact arena', () => {
    const box = BOSS.arenaCompact
    let lowered = 0
    for (const f of floaters) {
      const { fontSize, maxWidth, bottom } = floaterFit(f.text, box, f.base, headroomPx(box))
      const what = `${f.lang} ${f.motif} ${f.fx} "${f.text}"`
      if (bottom >= box * FLOATER.bottom - 0.05) continue
      lowered++
      expect(fontSize, what).toBe(FLOATER.minPx)
      expect(floaterLines(f.text, fontSize, maxWidth), what).toBeGreaterThan(1)
    }
    expect(lowered).toBeLessThan(floaters.length / 5)
  })
  it('Wail! stays over the Banshee head on both arenas', () => {
    for (const box of [BOSS.arena, BOSS.arenaCompact]) {
      expect(floaterFit('Wail!', box, 26, headroomPx(box)).bottom).toBeCloseTo(box * FLOATER.bottom, 1)
    }
  })
  it('the pop rises in em, as the fit assumes', () => {
    expect(FLOATER_POP_CSS).toContain(`translateY(-${FLOATER.peakRise}em) scale(${FLOATER.peak})`)
    const rises = [...FLOATER_POP_CSS.matchAll(/translateY(-?([d.]+)(em|px)?)/g)].map((m) => [Number(m[1]), m[2] || ''])
    for (const [n, unit] of rises) { if (n) expect(unit).toBe('em'); expect(n).toBeLessThanOrEqual(FLOATER.rise + 0.05) }
  })
  it('keep the old look where it fit: a short English floater stays at 90% of the box and its full size', () => {
    expect(floaterFit('-3 Burn!', BOSS.arena, 18, headroomPx(BOSS.arena))).toMatchObject({ fontSize: 18, bottom: BOSS.arena * 0.9 })
  })
  it('counts lines: word gaps wrap, a word never breaks (keep-all)', () => {
    expect(floaterLines('-4 Encore!', 20, 400)).toBe(1)
    expect(floaterLines('-4 Encore!', 20, 70)).toBe(2)
    expect(floaterLines('-4 アンコール！', 12, 76)).toBe(2)
    expect(floaterLines('アンコールアンコール', 20, 100)).toBe(1)
    expect(floaterBreaks('-3 狮头倒下！狮之心')).toBe('-3 狮头倒下！\u200b狮之心')
    expect(floaterBreaks('アンコール！')).toBe('アンコール！')
  })
})
