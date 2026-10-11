// THE LABEL FIT (impact/labelFit.js): every word a raid fight writes on the boss box shows whole at every arena size and
// in every language (a fixed 20 px "HEAVY BLOW!" read "EAVY BLOW" on the compact arena, on every boss).
import { describe, it, expect } from 'vitest'
import { labelEm, labelFontSize, labelFontPx, labelMaxWidth, LABEL_ROOM, LABEL_MIN_PX } from './labelFit'
import { MOMENT_LABEL, LABEL_FIT, STAMP_FIT } from '../StrikeFxLayer'
import { POWER_FX, POWER_PROC, CAST_FIT, PROC_FIT } from './PowerFx'
import { powerVars, procVars, WIND_HEARTS } from '../powers'
import { BOSS } from '../BossArena'
import { makeT, I18N_LANGS } from '../../../i18n'

// Real widths (em at the label's own letter spacing) measured in Chromium with the app's display font.
const MEASURED = [
  ['HEAVY BLOW!', 6.65], ['SHARPENED!', 6.2], ['MOMENTUM!', 6.2], ['DOUBLE DAMAGE!', 8.69], ['MOMENTUM CRIT!', 8.63],
  ['¡GOLPE BRUTAL!', 7.9], ['¡SEGUNDO ALIENTO!', 9.85], ['¡CRÍTICO DE IMPULSO!', 10.75], ['¡ESCUDO ALZADO!', 8.8],
  ['クリティカル！', 7.25], ['シールド展開！', 7.3], ['刃、準備完了！', 7.3], ['勢いクリティカル！', 9.31], ['踏みとどまった！', 8.25],
  ['重击！', 3.1], ['护住了！', 4.15], ['稳住了！', 4.19], ['+2 ❤', 2.4],
]

const CJK = /[\u3040-\u30ff\u4e00-\u9fff]/u

// Every label of every locale, with the fit its element uses.
function allLabels() {
  const out = []
  for (const lang of I18N_LANGS) {
    const t = makeT(lang)
    for (const [moment, key] of Object.entries(MOMENT_LABEL)) {
      if (moment === 'ko') out.push({ lang, what: 'stamp', text: t(key), fit: STAMP_FIT })
      else out.push({ lang, what: moment, text: t(key, moment === 'wind' ? { n: WIND_HEARTS } : {}), fit: LABEL_FIT })
    }
    for (const [id, s] of Object.entries(POWER_FX)) out.push({ lang, what: `cast ${id}`, text: t(s.label, powerVars(id)), fit: CAST_FIT })
    for (const [id, s] of Object.entries(POWER_PROC)) out.push({ lang, what: `proc ${id}`, text: t(s.label, procVars(id)), fit: PROC_FIT })
  }
  return out
}
// The width a label's box takes at its fitted size and its animation's settled peak.
// `part`: one word of it (a wrapped line), at the whole label's size.
const widthAt = (l, box, part = l.text) => {
  const px = labelFontPx(l.text, box, l.fit)
  return (px * labelEm(part, l.fit.spacing ?? 0.04) + ((l.fit.pad?.cqw || 0) * box) / 100 + (l.fit.pad?.px || 0)) * (l.fit.peak || 1)
}

describe('label width estimate', () => {
  it('is never narrower than the real text, and not far wider', () => {
    for (const [text, em] of MEASURED) {
      expect(labelEm(text), text).toBeGreaterThanOrEqual(em)
      expect(labelEm(text), text).toBeLessThan(em * 1.3)
    }
  })
  it('counts CJK as wide, joiners and selectors as nothing', () => {
    expect(labelEm('重击')).toBeGreaterThan(labelEm('AB'))
    expect(labelEm('❤️')).toBeCloseTo(labelEm('❤'), 5)
  })
})

describe('every strike, stamp, cast and proc label fits its box', () => {
  const labels = allLabels()
  it('has real text in every locale (no raw keys)', () => {
    for (const l of labels) expect(l.text, `${l.lang} ${l.what}`).not.toMatch(/^lg_/)
  })
  it('stays inside the box and its headroom on the compact and the normal arena, at a readable size', () => {
    const tight = []
    for (const box of [BOSS.arenaCompact, BOSS.arena]) {
      for (const l of labels) {
        const px = labelFontPx(l.text, box, l.fit)
        expect(px, `${l.lang} ${l.what} @${box}`).toBeGreaterThanOrEqual(LABEL_MIN_PX)
        if (px > LABEL_MIN_PX + 0.01) expect(widthAt(l, box), `${l.lang} ${l.what} @${box}`).toBeLessThanOrEqual(box * LABEL_ROOM + 0.5)
        else tight.push(`${l.lang} ${l.what} @${box}`)
      }
    }
    // At the floor (compact arena only) a cast or proc label wraps at its word gaps (CJK anywhere), so every WORD fits;
    // a strike label or the stamp stays on one line, at most 5% wider than the room (outside the clip: never cut).
    const room = BOSS.arenaCompact * LABEL_ROOM
    for (const l of labels) {
      if (labelFontPx(l.text, BOSS.arena, l.fit) <= LABEL_MIN_PX + 0.01) throw new Error(`at the floor on the normal arena: ${l.lang} ${l.what}`)
      const wraps = l.fit === CAST_FIT || l.fit === PROC_FIT
      const parts = wraps ? l.text.split(/\s+/) : [l.text]
      // CJK never breaks inside (keep-all): one line, at most 15% past the room (outside the clip, centered, never cut)
      for (const w of parts) expect(widthAt(l, BOSS.arenaCompact, w), `${l.lang} ${l.what} "${w}"`).toBeLessThanOrEqual(room * (wraps && !CJK.test(w) ? 1 : CJK.test(w) ? 1.15 : 1.05))
    }
    expect(tight.every((x) => x.endsWith(`@${BOSS.arenaCompact}`))).toBe(true)
  })
  it('keeps the English look on the normal arena (the full 20 px strike labels)', () => {
    const t = makeT('en')
    for (const [moment, key] of Object.entries(MOMENT_LABEL)) {
      if (moment === 'ko') continue
      expect(labelFontPx(t(key, { n: WIND_HEARTS }), BOSS.arena, LABEL_FIT), moment).toBe(20)
    }
  })
  it('keeps the stamp at its old 12 px floor unless the box needs less, and at 13cqw on the normal arena', () => {
    const t = makeT('en')
    expect(labelFontPx(t('lg_fxKo'), BOSS.arena, STAMP_FIT)).toBeCloseTo(BOSS.arena * 0.13, 5)
    expect(labelFontPx('OK!', BOSS.arenaCompact, STAMP_FIT)).toBe(12)
  })
})

describe('the CSS', () => {
  it('is a clamp in container units with the floor and the cap', () => {
    expect(labelFontSize('HEAVY BLOW!', LABEL_FIT)).toMatch(/^clamp\(10px, [\d.]+cqw, 20px\)$/)
    expect(labelFontSize('DEFEATED!', STAMP_FIT)).toMatch(/^clamp\(max\(10px, min\(12px, calc\(.+cqw - 6px\) \/ [\d.]+\)\)\), min\(13cqw, calc\(.+\)\), 30px\)$/)
  })
  it('caps only labels that can wrap (a word gap), so an unbreakable one stays centered', () => {
    expect(labelMaxWidth(PROC_FIT, '¡CRÍTICO DE IMPULSO!')).toBe(`${Math.round((140 / 1.12) * 100) / 100}cqw`)
    expect(labelMaxWidth(PROC_FIT, '勢いクリティカル！')).toBeUndefined()
    expect(labelMaxWidth(CAST_FIT, 'STEADFAST!')).toBeUndefined()
  })
  it('resolves to what labelFontPx says', () => {
    // the plain label: K cqw at a box of B px = K * B / 100 px, clamped
    const css = labelFontSize('HEAVY BLOW!', LABEL_FIT)
    const k = Number(/([\d.]+)cqw/.exec(css)[1])
    for (const box of [40, 68, 92, 120, 190]) {
      expect(labelFontPx('HEAVY BLOW!', box, LABEL_FIT)).toBeCloseTo(Math.max(10, Math.min(20, (k * box) / 100)), 1)
    }
  })
})
