import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ABILITY_BY_MOTIF, ABILITY_BY_ID } from './abilities'
import { FX_BY_MOTIF } from './fx'
import { ABILITY_FX_KEYS } from './AbilityFx'
import { ABILITIES, newFight } from './fight'
import { BossArena } from './BossArena'
import { simulateRaid, mixed } from './abilities/_sim'
import { RAID_MOTIFS, RAID_ABILITY } from './raid'
import { AbilityHud, BarMarks, trackBumps } from './fx/_Hud'
import { juiceFor } from './fx'
import { JUICE, JUICE_SIZES, JUICE_CSS, juiceOf, floaterPxFor, FLOATER_LONG } from './fx/_juice'
import { registerAbilityForTest } from './abilities'

// Every raid boss has an ability module (abilities/<motif>.js) and an effects file (fx/<motif>.jsx). Every effect a
// module can fire (its fxKeys) has a picture and a floater text; nothing fires an effect it does not list (the asset
// view's replay buttons come from fxKeys).
const dir = path.dirname(fileURLToPath(import.meta.url))
const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8')

describe('raid ability registry and effects', () => {
  it('every raid motif has its own ability module and effects file, with unique ids', () => {
    for (const m of RAID_MOTIFS) {
      expect(ABILITY_BY_MOTIF[m], `abilities/${m}.js`).toBeTruthy()
      expect(FX_BY_MOTIF[m], `fx/${m}.jsx`).toBeTruthy()
      expect(RAID_ABILITY[m]).toBe(ABILITY_BY_MOTIF[m].id)
      expect(ABILITIES).toContain(RAID_ABILITY[m])
    }
    const ids = Object.values(ABILITY_BY_MOTIF).map((a) => a.id)
    expect(new Set(ids).size, 'ability ids must be unique').toBe(ids.length)
    expect(Object.keys(ABILITY_BY_ID).length).toBe(ids.length)
    for (const a of Object.values(ABILITY_BY_MOTIF)) expect(typeof a.icon === 'string' && a.icon.length > 0, `${a.id} icon`).toBe(true)
  })
  it('every effect a module can fire is listed, drawn and has its floater text', () => {
    for (const [m, a] of Object.entries(ABILITY_BY_MOTIF)) {
      const src = read(`abilities/${m}.js`)
      const fired = [...new Set([...src.matchAll(/\bfx = (?:res\.fx \|\| )?'([A-Za-z]+)'/g)].map((x) => x[1]))]
      for (const fx of fired) expect(a.fxKeys, `${m} fires ${fx}`).toContain(fx)
      const fxf = FX_BY_MOTIF[m] || {}
      for (const fx of a.fxKeys || []) {
        expect(typeof fxf.effects?.[fx], `fx/${m}.jsx effects.${fx}`).toBe('function')
        expect(fxf.floaters?.[fx], `fx/${m}.jsx floaters.${fx}`).toMatch(/^lg_fx_\w+$/)
        expect(ABILITY_FX_KEYS).toContain(fx)
      }
    }
  })
  it('every floater and ability text exists in English (fails until stream 3 merges new keys)', async () => {
    const en = (await import('../../i18n/locales/en.js')).default
    for (const [m, a] of Object.entries(ABILITY_BY_MOTIF)) {
      for (const k of [`lg_ability_${a.id}`, `lg_abilityDesc_${a.id}`]) expect(en[k], k).toBeTruthy()
      for (const fx of a.fxKeys || []) { const k = FX_BY_MOTIF[m]?.floaters?.[fx]; expect(en[k], `${m}: ${k}`).toBeTruthy() }
      if (a.sampleHint) { const k = a.sampleHint.key || `lg_hint_${a.id}`; expect(en[k], k).toBeTruthy() }
    }
  })
  it('reaction keyframes are named lgr<Boss><Verb>, unique, and never reuse an entrance name', async () => {
    const { ENTRANCES } = await import('./BossArena')
    const entrance = new Set(Object.values(ENTRANCES).map((e) => e.name))
    const seen = new Map()
    for (const [m, f] of Object.entries(FX_BY_MOTIF)) {
      for (const [, name] of String(f.css || '').matchAll(/@keyframes\s+([\w-]+)/g)) {
        expect(name, `fx/${m}.jsx`).toMatch(/^lgr[A-Z]/)
        expect(entrance.has(name), name).toBe(false)
        expect(seen.has(name), `${name} in ${m} and ${seen.get(name)}`).toBe(false)
        seen.set(name, m)
      }
      // Reaction classes belong to this boss: .lgr-<motif>-<fxKey>.
      for (const [, motif] of String(f.css || '').matchAll(/\.lgr-([a-z]+)-[\w]+/g)) expect(motif, `fx/${m}.jsx`).toBe(m)
    }
  })
  it('the generic HUD draws every item type and the bar marks', () => {
    const t = (k, v) => `${k}${v ? JSON.stringify(v) : ''}`
    const items = [
      { type: 'pips', n: 2, max: 4, icon: '🐍', labelKey: 'x_pips', vars: { n: 2 } },
      { type: 'pips', n: 1, max: 3, tone: 'danger' },
      { type: 'gauge', value: 3, max: 6, labelKey: 'x_gauge', tone: 'warning' },
      { type: 'track', pos: 2, max: 4, icon: '⛵', labelKey: 'x_track' },
      { type: 'board', cells: [1, 0, 1, 0, 2, 0, 1], shape: 'hex7', labelKey: 'x_board' },
      { type: 'queue', items: [{ icon: '☀', labelKey: 'x_now' }, { icon: '⚖' }, { icon: '🕊' }], labelKey: 'x_queue' },
      { type: 'bars', bars: [{ icon: '🦁', value: 2, max: 5, active: true }, { icon: '🐐', value: 5, max: 5 }] },
      { type: 'coins', n: 7, labelKey: 'x_coins' },
      { type: 'chip', icon: '!', key: 'x_chip', tone: 'success' },
      { type: 'unknown' },
    ]
    const html = renderToStaticMarkup(createElement(AbilityHud, { t, items }))
    for (const k of ['x_pips', 'x_gauge', 'x_track', 'x_board', 'x_now', 'x_queue', 'x_coins', 'x_chip']) expect(html).toContain(k)
    expect(renderToStaticMarkup(createElement(AbilityHud, { t, items: [] }))).toBe('')
    const marks = renderToStaticMarkup(createElement('div', null, createElement(BarMarks, { need: 30, marks: [{ type: 'line', at: 10, tone: 'danger' }, { type: 'ghost', at: 20, to: 14 }] })))
    expect(marks).toContain('left:33.33')
  })
  it('AbilityFx.jsx and BossArena no longer hold per-ability tables', () => {
    expect(read('AbilityFx.jsx')).not.toMatch(/const EFFECTS = \{/)
    expect(read('BossArena.jsx')).not.toMatch(/const FX_KEY = \{/)
    expect(read('AssetView.jsx')).not.toMatch(/const ABILITY_FX = \{/)
  })
  it('the arena draws every boss with its ability state (chip, HUD, bar marks, art state) without crashing', () => {
    const t = (k) => k
    // A chip note (" · Risen"): no shipped ability declares one now, so a made-up one shows it on the lich art.
    registerAbilityForTest('zznote', { id: 'zznote', icon: '☠', fxKeys: ['raise'], chipNote: (s) => (s.ab.risen ? 'lg_fx_raiseDead' : null), init: () => ({ risen: true }) })
    const html = renderToStaticMarkup(createElement(BossArena, { t, area: { motif: 'lich', palette: 'night', title: 'x' }, need: 20, lives: 3, phases: 3, ability: 'zznote', kind: 'raids',
      state: { ...newFight(), damage: 5, last: { kind: 'hit', damage: 2, fx: 'raise', n: 1 } } }))
    expect(html).toContain('lg_ability_zznote · lg_fx_raiseDead')
    for (const [m, a] of Object.entries(ABILITY_BY_MOTIF)) {
      // A real mid-fight state for this ability: a simulated raid, stopped part way.
      const r = simulateRaid(a.id, { n: 10, answer: mixed(0.3), press: 'greedy' })
      for (const e of r.log.slice(0, 6)) {
        const st = { ...e.after, damage: e.after.damage }
        expect(() => renderToStaticMarkup(createElement(BossArena, { t, area: { motif: m, palette: 'night', title: m }, need: r.hp, lives: 3, phases: 3, ability: a.id, kind: 'raids', state: st })), m).not.toThrow()
      }
    }
  })
})

describe('floater size', () => {
  it('keeps the size for a short word and steps down for a long line (it wrapped over the boss face)', () => {
    expect(floaterPxFor('big', '-4 Cauterize!')).toBe(JUICE.floaterPx.big)
    expect(floaterPxFor('big', "-3 Lion falls! Lion's Heart")).toBeLessThan(JUICE.floaterPx.big)
    expect(floaterPxFor('big', "-3 Serpent falls! Serpent's Venom")).toBe(Math.round(JUICE.floaterPx.big * FLOATER_LONG.smallest))
    // wide CJK characters count twice
    expect(floaterPxFor('big', '蛇が倒れた！蛇の毒')).toBeLessThan(JUICE.floaterPx.big)
    // never below the minimum, never above the size's own
    for (const size of JUICE_SIZES) {
      expect(floaterPxFor(size, 'x'.repeat(80))).toBeGreaterThanOrEqual(Math.min(JUICE.floaterPx[size], FLOATER_LONG.minPx))
      expect(floaterPxFor(size, 'x')).toBe(JUICE.floaterPx[size])
    }
  })
})

describe('the juice map (fx/<motif>.jsx juice) and the arena that plays it', () => {
  it('every juice entry names one of the module\'s fx keys and stays in range', () => {
    for (const [m, f] of Object.entries(FX_BY_MOTIF)) {
      const a = ABILITY_BY_MOTIF[m]
      for (const [k, j] of Object.entries(f.juice || {})) {
        expect(a?.fxKeys || [], `fx/${m}.jsx juice.${k}`).toContain(k)
        expect(JUICE_SIZES, `fx/${m}.jsx juice.${k}.size`).toContain(j.size)
        if (j.shake != null) expect([0, 1, 2, 3], `${m}.${k}.shake`).toContain(j.shake)
        if (j.flash != null) expect([0, 1, 2], `${m}.${k}.flash`).toContain(j.flash)
        if (j.hitstop != null) expect([0, 1], `${m}.${k}.hitstop`).toContain(j.hitstop)
        if (j.sfx != null) expect(j.sfx, `${m}.${k}.sfx`).toMatch(/^[a-z]+\.[A-Za-z]+$/)
        // A tick is small: no shake, flash or hit-stop.
        if (j.size === 'tick') expect(!!(j.shake || j.flash || j.hitstop), `${m}.${k}: a tick never shakes, flashes or stops`).toBe(false)
      }
    }
  })
  it('a key with no entry plays as before (big, nothing else); sizes set the reaction length', () => {
    expect(juiceOf(undefined)).toEqual({ size: 'big', ms: 1200, shake: 0, flash: 0, hitstop: 0, sfx: '' })
    expect(juiceOf({ size: 'tick' }).ms).toBe(350)
    expect(juiceOf({ size: 'medium', shake: 9, flash: -1, hitstop: 4 })).toEqual({ size: 'medium', ms: 800, shake: 3, flash: 0, hitstop: 1, sfx: '' })
    expect(juiceFor('nope', 'x').size).toBe('big')
    for (const ms of Object.values(JUICE.ms)) expect(ms).toBeLessThanOrEqual(JUICE.maxMs)
    expect(JUICE.flash[2].veil).toBeLessThanOrEqual(0.25) // photosensitivity: the veil never exceeds 25% white
    expect(JUICE.flashGap).toBeGreaterThanOrEqual(500) // at most 2 flashes a second
    expect(JUICE_CSS).toContain('@keyframes lgJuiceShake1')
    expect(JUICE_CSS).toContain('@keyframes lgJuiceShake3')
  })
  it('the HUD: a ready item pulses (a static ring when calm), a changed item bumps', () => {
    const t = (k) => k
    const items = [{ type: 'pips', n: 1, max: 3, ready: true, labelKey: 'x_ready' }, { type: 'gauge', value: 2, max: 4 }]
    const live = renderToStaticMarkup(createElement(AbilityHud, { t, items }))
    expect(live).toContain('data-hud-ready')
    expect(live).toContain('lgHudReady')
    const calm = renderToStaticMarkup(createElement(AbilityHud, { t, items, calm: true }))
    expect(calm).toContain('data-hud-ready')
    expect(calm).not.toContain('lgHudReady 1200ms')
    expect(calm).toMatch(/outline:2px solid/)
    const memo = { prev: {}, count: {} }
    expect(trackBumps(memo, items)).toEqual([0, 0])
    expect(trackBumps(memo, items)).toEqual([0, 0]) // the same values: no bump
    expect(trackBumps(memo, [items[0], { ...items[1], value: 3 }])).toEqual([0, 1])
    expect(trackBumps(memo, [{ ...items[0], n: 2 }, { ...items[1], value: 3 }])).toEqual([1, 1])
  })
  it('a persistent idle reaction is drawn as .lgr-<motif>-idle-<key> on the art; artStyle sits on its own inner box', () => {
    registerAbilityForTest('zzidle', { id: 'zzidle', icon: '💤', idle: (s) => (s.ab.asleep ? 'drift' : ''), init: () => ({ asleep: true }), artStyle: () => ({ transform: 'scale(1.1)' }) })
    const t = (k) => k
    const html = renderToStaticMarkup(createElement(BossArena, { t, area: { motif: 'zzidle', palette: 'night', title: 'x' }, need: 20, lives: 3, phases: 3, ability: 'zzidle', kind: 'raids', state: newFight() }))
    expect(html).toContain('lgr-zzidle-idle-drift')
    expect(html).toMatch(/lgr-zzidle-idle-drift"><div style="transform:scale\(1.1\)"/)
    const focus = renderToStaticMarkup(createElement(BossArena, { t, area: { motif: 'zzidle', palette: 'night', title: 'x' }, need: 20, lives: 3, phases: 3, ability: 'zzidle', kind: 'raids', state: newFight(), focus: true }))
    expect(focus).not.toContain('lgr-zzidle-idle-drift')
  })
})

// THE BOSS ITSELF REACTS to every effect its ability fires (the owner: "make sure that they all have some sort of
// visual effect/animation of the character"). The overlay alone is not enough: each fx key needs a `.lgr-<motif>-<key>`
// rule whose animation exists in the file, lasts long enough to read, ends before the reaction class is taken off (its
// juice size: tick 350, medium 800, big 1200 ms; a longer one snapped back mid-move), and moves the character enough
// to see at arena size. Phase-qualified variants (data-phase) are held to the same bar. A 1 to 2 px nudge over 200 ms
// read as "nothing happens" (2026-10).
const REACTION_MIN = {
  tick: { ms: 250, px: 4, deg: 5, scale: 0.05 },
  medium: { ms: 450, px: 6, deg: 6, scale: 0.08 },
  big: { ms: 450, px: 6, deg: 6, scale: 0.08 },
  turn3d: 15, // a rotateX / rotateY of at least this many degrees (a twirl, a tilt in depth)
}
function keyframesOf(css) {
  const out = {}
  const re = /@keyframes\s+([\w-]+)\s*\{/g
  let m
  while ((m = re.exec(css))) {
    let i = re.lastIndex
    let depth = 1
    while (depth && i < css.length) { if (css[i] === '{') depth++; else if (css[i] === '}') depth--; i++ }
    out[m[1]] = css.slice(re.lastIndex, i - 1)
  }
  return out
}
// How far a keyframe body moves the character: the largest translate (px), 2D rotate/skew (deg), scale change, 3D turn.
function amplitude(body) {
  const num = (s) => Math.abs(Number(s) || 0)
  let px = 0, deg = 0, scale = 0, turn3d = 0
  for (const [, a, b] of body.matchAll(/translate[XY]?\(\s*(-?[\d.]+)px(?:\s*,\s*(-?[\d.]+)px)?/g)) px = Math.max(px, num(a), num(b))
  for (const [, b] of body.matchAll(/translate\(\s*-?[\d.]+(?:%|px)?\s*,\s*(-?[\d.]+)px/g)) px = Math.max(px, num(b))
  for (const [, a] of body.matchAll(/(?:rotate|rotateZ|skew|skewX|skewY)\(\s*(-?[\d.]+)deg/g)) deg = Math.max(deg, num(a))
  for (const [, a] of body.matchAll(/rotate[XY]\(\s*(-?[\d.]+)deg/g)) turn3d = Math.max(turn3d, num(a))
  for (const [, a, b] of body.matchAll(/scale[XY]?\(\s*(-?[\d.]+)(?:\s*,\s*(-?[\d.]+))?/g)) scale = Math.max(scale, Math.abs(Number(a) - 1), b == null ? 0 : Math.abs(Number(b) - 1))
  return { px, deg, scale, turn3d, clip: /clip-path:\s*polygon/.test(body) }
}
const visible = (amp, min) => amp.px >= min.px || amp.deg >= min.deg || amp.scale >= min.scale || amp.turn3d >= REACTION_MIN.turn3d || amp.clip

describe('every raid ability effect moves the boss itself (a body reaction, not only an overlay)', () => {
  for (const [m, a] of Object.entries(ABILITY_BY_MOTIF)) {
    it(`${m}: every fx key has a visible reaction on the character that fits its juice length`, () => {
      const f = FX_BY_MOTIF[m] || {}
      const css = String(f.css || '')
      const frames = keyframesOf(css)
      for (const k of a.fxKeys || []) {
        const life = juiceOf(f.juice?.[k]).ms
        const min = REACTION_MIN[juiceOf(f.juice?.[k]).size]
        const rules = [...css.matchAll(new RegExp(`([^{}]*\.lgr-${m}-${k}(?![\w-])[^{}]*)\{([^}]*)\}`, 'g'))].map((x) => ({ sel: x[1].trim(), body: x[2] }))
        const base = rules.filter((r) => r.sel.split(',').some((s) => s.trim() === `.lgr-${m}-${k}`))
        expect(base.some((r) => /animation(?:-name)?:/.test(r.body)), `fx/${m}.jsx: .lgr-${m}-${k} has no body reaction`).toBe(true)
        // The base duration, then every name and duration a rule for this key sets (phase variants included).
        let baseMs = 0
        for (const r of base) { const d = r.body.match(/animation:\s*[\w-]+\s+(\d+)ms/); if (d) baseMs = Number(d[1]) }
        for (const r of rules) {
          const names = [...r.body.matchAll(/animation(?:-name)?:\s*([\w-]+)/g)].map((x) => x[1])
          const d = r.body.match(/animation:\s*[\w-]+\s+(\d+)ms/) || r.body.match(/animation-duration:\s*(\d+)ms/)
          const ms = d ? Number(d[1]) : baseMs
          if (!names.length && !d) continue
          expect(ms, `fx/${m}.jsx ${r.sel}: too short to read`).toBeGreaterThanOrEqual(min.ms)
          expect(ms, `fx/${m}.jsx ${r.sel}: outlives its ${life} ms class (it snaps back)`).toBeLessThanOrEqual(life)
          for (const name of names) {
            expect(frames[name], `fx/${m}.jsx ${r.sel}: @keyframes ${name} missing`).toBeTruthy()
            const amp = amplitude(frames[name])
            expect(visible(amp, min), `fx/${m}.jsx ${name} (${k}) barely moves the boss: ${JSON.stringify(amp)}`).toBe(true)
          }
        }
      }
    })
  }
})
