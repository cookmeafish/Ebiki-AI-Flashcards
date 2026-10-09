import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { RAID_ORDER } from './raid'
import { RAID_IMPACT, DEFAULT_IMPACT, BODY, MOMENT_KEYS, impactFor, koTiming, KO_MS_MIN, KO_MS_MAX } from './impact/styles'
import { BOSS_GLYPHS, GLYPH_NAMES } from './impact/glyphs'
import { PARTS, PART_NAMES, shiftAnimation, withDelay } from './impact/parts'
import { BODY_KEYFRAMES, BODY_CSS, BODY_OF_MOMENT, bodyAnimation, KO_FRAMES, KO_DOWN, KO_EASE } from './impact/body'
import StrikeFxLayer, { momentParts, KoTag } from './StrikeFxLayer'
import { POWER_FX, PowerFx } from './impact/PowerFx'
import { POWERS } from './powers'
import en from '../../i18n/locales/en'

const BOSS_PART_FILES = import.meta.glob('./impact/bosses/*.parts.jsx', { eager: true })

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

  // THE KNOCKOUT CINEMATIC (the owner: "make every single boss defeated animation very dramatic ... unique per boss",
  // "very creative, dramatic, and unique"): a staged death per boss, its own body move, never a recolored template.
  describe('the knockout cinematic', () => {
    const own = (parts) => parts.map(([p]) => p).filter((p) => !['speedlines', 'flash', 'ring', 'burst', 'dust', 'sparks', 'shards', 'rise', 'drops', 'rays', 'crack', 'splat'].includes(p))
    it('plays for a fixed, bounded time with its climax well before the end (room for the stamp)', () => {
      for (const m of RAID_ORDER) {
        const s = RAID_IMPACT[m]
        expect(s.koMs, m).toBeGreaterThanOrEqual(KO_MS_MIN)
        expect(s.koMs, m).toBeLessThanOrEqual(KO_MS_MAX)
        const k = koTiming(m)
        expect(k.ms, m).toBe(s.koMs)
        expect(k.peak, m).toBe(s.koPeak)
        expect(k.stampMs, `${m}: the stamp needs time to land and settle`).toBeGreaterThanOrEqual(600)
        expect(k.land, m).toBeLessThan(k.ms)
      }
    })
    it('is staged: the killing blow at once, then at least three stages, everything begun by the climax', () => {
      for (const m of RAID_ORDER) {
        const s = RAID_IMPACT[m]
        expect(s.ko.length, `${m}: parts`).toBeGreaterThanOrEqual(6)
        const ats = s.ko.map(([, o = {}]) => o.at || 0)
        expect(new Set(ats).size, `${m}: stages`).toBeGreaterThanOrEqual(4)
        expect(s.ko.slice(0, 2).map(([p]) => p), `${m}: the killing blow`).toEqual(['speedlines', 'flash'])
        for (const at of ats) expect(at, m).toBeLessThanOrEqual(s.koPeak + 200)
        // a shockwave at the climax
        expect(s.ko.some(([p, o = {}]) => p === 'ring' && Math.abs((o.at || 0) - s.koPeak) <= 150), `${m}: a shockwave at the climax`).toBe(true)
      }
    })
    it('tells each boss its own story: a part of its own no other boss dies with, and no two deaths alike', () => {
      const signature = RAID_ORDER.map((m) => own(RAID_IMPACT[m].ko).join(','))
      expect(new Set(signature).size, 'two bosses die with the same story parts').toBe(RAID_ORDER.length)
      for (const m of RAID_ORDER) {
        const mine = new Set(own(RAID_IMPACT[m].ko))
        const others = new Set(RAID_ORDER.filter((x) => x !== m).flatMap((x) => own(RAID_IMPACT[x].ko)))
        expect([...mine].some((p) => !others.has(p)), `${m}: no part of its own`).toBe(true)
      }
    })
    it('everything it plays has finished when the cinematic ends (nothing is cut off, nothing stays over the boss)', () => {
      // The last moment any `animation:` in the text ends (delay + duration x count).
      const latestEnd = (text) => {
        let latest = 0
        for (const [, list] of text.matchAll(/animation:([^;"}]+)/g)) {
          for (const one of list.split(/,(?![^(]*\))/)) {
            const toks = one.trim().split(/\s+(?![^(]*\))/)
            const times = toks.filter((x) => /^[\d.]+m?s$/.test(x)).map((x) => (x.endsWith('ms') ? parseFloat(x) : parseFloat(x) * 1000))
            const count = Number(toks.find((x) => /^\d+$/.test(x)) || 1)
            latest = Math.max(latest, (times[1] || 0) + (times[0] || 0) * count)
          }
        }
        return latest
      }
      for (const m of RAID_ORDER) {
        const html = renderToStaticMarkup(createElement(StrikeFxLayer, { t: (k) => k, moment: 'ko', motif: m, n: 1 }))
        // The <style> block holds EVERY boss's own CSS (impact/bosses/*.parts.jsx): checked per boss below, never
        // against another boss's knockout length.
        const inline = html.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
        expect(latestEnd(inline), `${m}: an effect still plays after the knockout`).toBeLessThanOrEqual(RAID_IMPACT[m].koMs)
      }
      for (const [file, mod] of Object.entries(BOSS_PART_FILES)) {
        const m = file.match(/([^/]+)\.parts\.jsx$/)[1]
        if (!RAID_IMPACT[m]) continue
        expect(latestEnd(mod.css || ''), `${m}: its own CSS still plays after its knockout`).toBeLessThanOrEqual(RAID_IMPACT[m].koMs)
      }
    })
    it('every boss falls its own way (a knockout body move of its own)', () => {
      const names = RAID_ORDER.map((m) => RAID_IMPACT[m].body.ko)
      expect(new Set(names).size).toBe(names.length)
      for (const name of names) expect(KO_FRAMES[name], name).toBeTruthy()
    })
    it('the body move: frozen on the blow, never below a quarter visible, ending on the defeated look inside its frame', () => {
      for (const [name, [pose, rest]] of Object.entries(KO_FRAMES)) {
        const css = BODY_KEYFRAMES.ko[name]
        expect(css, name).toMatch(new RegExp(`3% \\{ transform: ${pose.replace(/[()]/g, '\\$&')};`))
        expect(css, name).toMatch(new RegExp(`12% \\{ transform: ${pose.replace(/[()]/g, '\\$&')};`))
        let last = 0
        for (const [p, , op, f = {}] of rest) {
          expect(p, `${name}: frames in order`).toBeGreaterThan(last)
          last = p
          expect(op, `${name} ${p}%`).toBeGreaterThanOrEqual(0.25)
          expect(f.o ?? 1, `${name} ${p}%`).toBeGreaterThanOrEqual(0.5)
          // never a muddy smear: a little softness at most
          expect(f.bl ?? 0, `${name} ${p}%: blur`).toBeLessThanOrEqual(1.5)
        }
        const [p, tr, op, f] = rest[rest.length - 1]
        expect(p, name).toBe(100)
        expect(op, name).toBeGreaterThanOrEqual(0.5)
        expect(f, `${name} ends on the arena's defeated look`).toBe(KO_DOWN)
        for (const px of [...tr.matchAll(/(-?[\d.]+)px/g)].map((x) => Math.abs(Number(x[1])))) expect(px, `${name}: stays in frame`).toBeLessThanOrEqual(28)
        for (const sc of [...tr.matchAll(/scale\(([\d.]+)(?:,\s*([\d.]+))?\)/g)].flatMap((x) => [x[1], x[2]]).filter(Boolean).map(Number)) {
          expect(sc, name).toBeGreaterThanOrEqual(0.6)
          expect(sc, name).toBeLessThanOrEqual(1.35)
        }
      }
      // every frame names the same filter list, so the frames blend (a different list would jump)
      for (const css of Object.values(BODY_KEYFRAMES.ko)) {
        const lists = [...css.matchAll(/filter: ([^;}]+)/g)].map((x) => x[1].trim().replace(/\([^)]*\)/g, '()'))
        expect(new Set(lists).size).toBe(1)
      }
    })
    it('plays over its whole cinematic, after the layer appears', () => {
      for (const m of RAID_ORDER) {
        const a = bodyAnimation(RAID_IMPACT[m].body, 'ko', RAID_IMPACT[m].koMs, 100)
        expect(a, m).toBe(`lgBodyKO_${RAID_IMPACT[m].body.ko} ${RAID_IMPACT[m].koMs}ms ${KO_EASE} 100ms both`)
      }
    })
    it('a staged part starts later as a whole (its own delays kept) and stays unseen until then', () => {
      expect(shiftAnimation('lgiSpin 620ms cubic-bezier(.3,.9,.4,1) 45ms both', 300)).toBe('lgiSpin 620ms cubic-bezier(.3,.9,.4,1) 345ms both')
      expect(shiftAnimation('lgiRing 560ms ease-out both', 200)).toBe('lgiRing 560ms 200ms ease-out both')
      expect(shiftAnimation('lgiCone 760ms cubic-bezier(.2,.8,.3,1) both, lgiFlicker 760ms steps(1, end) both', 50)).toBe('lgiCone 760ms 50ms cubic-bezier(.2,.8,.3,1) both, lgiFlicker 760ms 50ms steps(1, end) both')
      expect(shiftAnimation('lgkSlosh 900ms ease-in-out 2', 100)).toBe('lgkSlosh 900ms 100ms ease-in-out 2')
      const html = renderToStaticMarkup(createElement(StrikeFxLayer, { t: (k) => k, moment: 'ko', motif: 'chronos', n: 1 }))
      expect(html).toMatch(/lgiGate 1ms linear 150ms both/)
      expect(html).toMatch(/lgkDial 1500ms 150ms/)
      expect(html).toMatch(/data-ko-stamp/)
      const node = withDelay(createElement('div', { style: { animation: 'lgiFade 650ms ease-out both' } }, createElement('i', { style: { animation: 'lgiFade 100ms 20ms both' } })), 500)
      expect(renderToStaticMarkup(node)).toBe('<div style="animation:lgiFade 650ms 500ms ease-out both"><i style="animation:lgiFade 100ms 520ms both"></i></div>')
    })
    it('the calm knockout (effects off) is the defeated tag, still, under the boss', () => {
      const still = renderToStaticMarkup(createElement(KoTag, { t: (k) => k, motif: 'titan' }))
      expect(still).toMatch(/data-ko-tag/)
      expect(still).not.toMatch(/animation:/)
      expect(still).toMatch(/top:calc\(100% - 10px\)/)
      expect(renderToStaticMarkup(createElement(KoTag, { t: (k) => k, motif: 'titan', delay: 2300 }))).toMatch(/lgsKoTag 380ms cubic-bezier\(\.2,\.9,\.3,1\) 2300ms both/)
    })
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
