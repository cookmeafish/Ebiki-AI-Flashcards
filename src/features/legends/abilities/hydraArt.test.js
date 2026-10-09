// The Tide Hydra's drawing shows EXACTLY the ability's heads, in every phase (the owner: "the boss doesn't visibly gain
// those heads"), and every slot cut since the last burn as a stump. Built from the heads out: six fixed neck slots, filled
// in order. Plays strike sequences through fight.js, takes the module's artState, builds the arena's real state CSS
// (abilityCss, fx/hydra.jsx headCss) and resolves which head and stump groups of raids/hydra.svg that CSS leaves visible.
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { newFight, strike } from '../fight'
import { abilityCss } from '../fx'
import { headCss, HYDRA_MAX_HEADS, HYDRA_ROOTS } from '../fx/hydra'
import mod, { topOf } from './hydra'

const SVG = fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../public/assets/legends/raids/hydra.svg'), 'utf8')

// Every element with a class: its classes, inline display:none, and its ancestors (innermost last).
function elements(src) {
  const re = /<!--[\s\S]*?-->|<\/?([a-zA-Z]+)([^>]*?)(\/?)>/g
  const stack = []
  const out = []
  let m
  while ((m = re.exec(src))) {
    if (m[0].startsWith('<!--')) continue
    if (m[0].startsWith('</')) { stack.pop(); continue }
    const node = { cls: ((/\sclass="([^"]*)"/.exec(m[2]) || [])[1] || '').split(/\s+/).filter(Boolean), hidden: /display:none/.test(m[2]), up: stack.slice() }
    if (node.cls.length) out.push(node)
    if (m[3] !== '/') stack.push(node)
  }
  return out
}
const ALL = elements(SVG)

// The static state rules in the arena CSS (no moment, no phase): `.lg-boss[attr="v"]... .cls { display: inline|none !important }`.
function stateRules(attrs) {
  const css = abilityCss('heads', attrs)
  const show = new Set()
  const hide = new Set()
  for (const r of css.matchAll(/([^{}]+)\{ display: (inline|none) !important[^}]*\}/g)) {
    for (const sel of r[1].split(',').map((s) => s.trim())) {
      const m = /^\.lg-boss((?:\[[\w-]+="[^"]*"\])+) \.([\w-]+)$/.exec(sel)
      if (!m) continue
      const conds = [...m[1].matchAll(/\[([\w-]+)="([^"]*)"\]/g)]
      if (conds.some(([, a]) => !/^data-ab-/.test(a))) continue // moments and holds are not the resting picture
      if (!conds.every(([, a, v]) => String(attrs[a]) === v)) continue
      ;(r[2] === 'inline' ? show : hide).add(m[2])
    }
  }
  return { show, hide }
}
// BossArena's phase rules: lg-p1 only in phase 1, lg-p12 hidden in phase 3, lg-p2 from phase 2, lg-p3 in phase 3.
function phaseShows(n, phase) {
  if (n.cls.includes('lg-p1')) return phase === 1
  if (n.cls.includes('lg-p12') && phase === 3) return false
  if (n.cls.includes('lg-p2')) return phase >= 2
  if (n.cls.includes('lg-p3')) return phase === 3
  return null
}
function visible(n, rules, phase) {
  for (const x of [...n.up, n]) {
    const p = phaseShows(x, phase)
    if (p === false) return false
    if (x.cls.some((c) => rules.hide.has(c))) return false
    if (x.hidden && p !== true && !x.cls.some((c) => rules.show.has(c))) return false
  }
  return true
}
// Heads drawn = the King (never cut) + every visible slot head; stumps = the visible stump slots.
function drawn(ab, phase) {
  const rules = stateRules(mod.artState({ ab }))
  const on = (re) => ALL.filter((n) => n.cls.some((c) => re.test(c)) && visible(n, rules, phase)).map((n) => Number(n.cls.find((c) => re.test(c)).match(/\d$/)[0])).sort()
  const king = ALL.filter((n) => n.cls.includes('lg-hydra-king') && visible(n, rules, phase)).length
  return { heads: king + on(/^lg-hydra-s\d$/).length, slots: on(/^lg-hydra-s\d$/), stumps: on(/^lg-hydra-stump\d$/) }
}
// The shoulders on the chest every neck and stump grows out of (lg-hydra-root<k>; 1 = the King's).
function shoulders(ab, phase) {
  const rules = stateRules(mod.artState({ ab }))
  return ALL.filter((n) => n.cls.some((c) => /^lg-hydra-root\d$/.test(c)) && visible(n, rules, phase)).map((n) => Number(n.cls.find((c) => /^lg-hydra-root\d$/.test(c)).slice(-1))).sort()
}
const range = (a, b) => { const out = []; for (let i = a; i <= b; i++) out.push(i); return out }

const o = { ability: 'heads', need: 400, lives: 50 }
const hit = (verdict) => ({ verdict, mode: 'typed' })

describe('raids/hydra.svg draws the heads and the stumps', () => {
  it('every phase has the King, one group per slot head (s2..s6) and one stump per slot', () => {
    for (const phase of [1, 2, 3]) {
      const inPhase = (c) => ALL.filter((n) => n.cls.includes(c) && n.up.some((u) => phaseShows(u, phase) === true) && !n.up.some((u) => phaseShows(u, phase) === false))
      expect(inPhase('lg-hydra-king').length, `phase ${phase} king`).toBe(1)
      expect(inPhase('lg-hydra-coils').length, `phase ${phase} coils`).toBe(1)
      for (let k = 2; k <= HYDRA_MAX_HEADS; k++) {
        expect(inPhase(`lg-hydra-s${k}`).length, `phase ${phase} slot ${k}`).toBe(1)
        expect(inPhase(`lg-hydra-stump${k}`).length, `phase ${phase} stump ${k}`).toBe(1)
        expect(inPhase(`lg-hydra-n${k}`).length, `phase ${phase} neck ${k}`).toBe(1)
        expect(inPhase(`lg-hydra-root${k}`).length, `phase ${phase} shoulder ${k}`).toBe(1)
      }
    }
  })
  it('the same slots in the same fill order in every phase: heads 1..N, stumps N+1..top', () => {
    expect(mod.K.max).toBe(HYDRA_MAX_HEADS)
    for (let top = mod.K.base; top <= HYDRA_MAX_HEADS; top++) {
      for (let heads = 1; heads <= top; heads++) {
        for (const phase of [1, 2, 3]) {
          expect(drawn({ heads, top }, phase), `phase ${phase}, ${heads} heads, top ${top}`).toEqual({ heads, slots: range(2, heads), stumps: range(heads + 1, top) })
          // every head and every stump stands on its own shoulder, and no shoulder stands bare
          expect(shoulders({ heads, top }, phase), `phase ${phase}, ${heads} heads, top ${top}: shoulders`).toEqual(range(1, top))
        }
      }
    }
  })
  it('a state saved before stumps were tracked (no top) draws like before: the base three, stumps for cut base heads', () => {
    for (let heads = 1; heads <= HYDRA_MAX_HEADS; heads++) {
      expect(topOf({ heads })).toBe(Math.max(heads, mod.K.base))
      for (const phase of [1, 2, 3]) {
        expect(drawn({ heads }, phase)).toEqual({ heads, slots: range(2, heads), stumps: range(heads + 1, mod.K.base) })
        expect(shoulders({ heads }, phase)).toEqual(range(1, Math.max(heads, mod.K.base)))
      }
    }
  })
  it('a played fight: after every strike the drawing shows the module\'s heads, and every cut slot as a stump', () => {
    const seq = ['clean', 'miss', 'miss', 'clean', 'glancing', 'clean', 'miss', 'clean', 'clean', 'clean', 'clean', 'clean', 'miss', 'clean', 'clean', 'clean']
    let s = newFight()
    const seen = new Set()
    let maxStumps = 0
    for (const v of seq) {
      s = strike(s, hit(v), o)
      seen.add(s.ab.heads)
      for (const phase of [1, 2, 3]) {
        const d = drawn(s.ab, phase)
        expect(d.heads).toBe(s.ab.heads)
        expect(d.stumps).toEqual(range(s.ab.heads + 1, s.ab.top))
        expect(shoulders(s.ab, phase)).toEqual(range(1, s.ab.top))
        maxStumps = Math.max(maxStumps, d.stumps.length)
      }
    }
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6])
    expect(maxStumps).toBe(5) // six heads cut down to the King: five stumps
  })
  it('stumps beyond the base three: cut from five, the fifth and fourth heads stand as stumps and regrow from them', () => {
    let s = { ...newFight(), ab: { heads: 3, top: 3, burns: 0 } }
    s = strike(s, hit('miss'), o) // 5 heads, top 5
    expect(s.ab).toMatchObject({ heads: 5, top: 5, grew: 2, regrew: 0 })
    s = strike(s, hit('clean'), o)
    s = strike(s, hit('clean'), o) // 3 heads, stumps 4 and 5
    expect(drawn(s.ab, 2).stumps).toEqual([4, 5])
    s = strike(s, hit('miss'), o) // both grow back out of their stumps
    expect(s.ab).toMatchObject({ heads: 5, top: 5, grew: 2, regrew: 2 })
    s = strike(s, hit('miss'), o) // the sixth grows where no head stood
    expect(s.ab).toMatchObject({ heads: 6, top: 6, grew: 1, regrew: 0 })
  })
  it('the burn sears every stump: after Cauterize three heads stand and no stump is left, data-ab-burnt names how many burned', () => {
    let s = { ...newFight(), ab: { heads: 5, top: 5, burns: 0 } }
    for (let i = 0; i < 5; i++) s = strike(s, hit('clean'), o)
    expect(s.last.fx).toBe('cauterize')
    expect(s.ab).toMatchObject({ heads: 3, top: 3, burnt: 5 })
    expect(mod.artState(s)['data-ab-burnt']).toBe(5)
    for (const phase of [1, 2, 3]) expect(drawn(s.ab, phase)).toEqual({ heads: 3, slots: [2, 3], stumps: [] })
  })
  it('the moments move the real heads: grow sprouts the newest slots (out of their stumps), sever drops the one cut', () => {
    const css = headCss()
    expect(css).toContain('.lg-boss[data-fx="grow"][data-ab-heads="5"][data-ab-grew="2"] .lg-hydra-s4, .lg-boss[data-fx="grow"][data-ab-heads="5"][data-ab-grew="2"] .lg-hydra-s5')
    // five to six grows ONE head: only s6 sprouts (s5 was already standing)
    expect(css).toContain('.lg-boss[data-fx="grow"][data-ab-heads="6"][data-ab-grew="1"] .lg-hydra-s6')
    expect(css).not.toContain('.lg-boss[data-fx="grow"][data-ab-heads="6"][data-ab-grew="1"] .lg-hydra-s5')
    // the stump a regrown head comes out of bursts open (only the regrown ones)
    expect(css).toMatch(/\.lg-boss\[data-fx="grow"\]\[data-ab-heads="5"\]\[data-ab-grew="2"\]\[data-ab-regrew="1"\] \.lg-hydra-stump4[^{]*\{ display: inline !important; animation: lgrHydraBurst/)
    expect(css).not.toContain('[data-ab-heads="5"][data-ab-grew="2"][data-ab-regrew="1"] .lg-hydra-stump5')
    expect(css).toMatch(/\.lg-boss\[data-fx="sever"\]\[data-ab-heads="4"\] \.lg-hydra-s5[^{]*\{ display: inline !important;[^}]*animation: lgrHydraLop/)
    expect(css).toMatch(/\.lg-boss\[data-fx="sever"\]\[data-ab-heads="5"\] \.lg-hydra-stump6[^{]*\{ animation: lgrHydraSear/)
    expect(css).toContain('.lg-boss[data-fx="cauterize"] .lg-hydra-s2')
    // the burn shows the stumps it burns: all of 2..burnt (the count is already back at three)
    expect(css).toMatch(/\.lg-boss\[data-fx="cauterize"\]\[data-ab-burnt="6"\] \.lg-hydra-stump6[^{]*\{ display: inline !important; animation: lgrHydraBurn/)
    expect(css).toContain('.lg-boss[data-fx="cauterize"][data-ab-burnt="0"] .lg-hydra-stump3') // an older state: the base three
    expect(css).not.toContain('lg-hydra-s1') // the King is never cut or grown
    // a head grown where no stump stood brings its shoulder up with it; one regrown from a stump keeps the shoulder
    expect(css).toMatch(/\.lg-boss\[data-fx="grow"\]\[data-ab-heads="5"\]\[data-ab-grew="2"\]\[data-ab-regrew="1"\] \.lg-hydra-root5[^{]*\{ animation: lgrHydraSprout/)
    expect(css).not.toContain('[data-ab-heads="5"][data-ab-grew="2"][data-ab-regrew="1"] .lg-hydra-root4')
    // the burn sears the shoulders of the stumps beyond the base three flat with them
    expect(css).toMatch(/\.lg-boss\[data-fx="cauterize"\]\[data-ab-burnt="6"\] \.lg-hydra-root6[^{]*\{ display: inline !important; animation: lgrHydraSink/)
    expect(css).not.toContain('[data-ab-burnt="6"] .lg-hydra-root3')
    expect(abilityCss('heads', { 'data-ab-heads': 4 })).toContain(css)
  })
  it('between the strike and its moment (data-fx-pending) the drawing holds the picture from BEFORE the strike', () => {
    const css = headCss()
    // a grown head stays hidden until it sprouts, the stump it grows from still stands; a cut head stays up (its stump
    // hidden) until it falls
    expect(css).toMatch(/\.lg-boss\[data-fx-pending="grow"\]\[data-ab-heads="5"\]\[data-ab-grew="2"\] \.lg-hydra-s5[^{]*\{ opacity: 0 \}/)
    expect(css).toMatch(/\.lg-boss\[data-fx-pending="grow"\]\[data-ab-heads="5"\]\[data-ab-grew="2"\]\[data-ab-regrew="2"\] \.lg-hydra-stump5[^{]*\{ display: inline !important \}/)
    expect(css).toMatch(/\.lg-boss\[data-fx-pending="sever"\]\[data-ab-heads="2"\] \.lg-hydra-s3[^{]*\{ display: inline !important \}/)
    expect(css).toMatch(/\.lg-boss\[data-fx-pending="sever"\]\[data-ab-heads="2"\] \.lg-hydra-stump3[^{]*\{ display: none !important \}/)
    // a burn: still the lone King on all his stumps
    expect(css).toMatch(/\.lg-boss\[data-fx-pending="cauterize"\]\[data-ab-burnt="5"\] \.lg-hydra-stump5[^{]*\{ display: inline !important \}/)
    expect(css).toMatch(/\.lg-boss\[data-fx-pending="cauterize"\] \.lg-hydra-s2, \.lg-boss\[data-fx-pending="cauterize"\] \.lg-hydra-s3 \{ display: none !important \}/)
    // the hold rules come after the state rules (equal specificity: the later one wins)
    expect(css.indexOf('data-fx-pending="sever"')).toBeGreaterThan(css.indexOf('[data-ab-top="6"] .lg-hydra-stump6'))
  })
  it('heads sprout from their neck roots: each phase\'s pivot is the slot\'s own idle sway pivot in the SVG', () => {
    // the first rotate pivot inside each slot (and King) group of each phase group (the file's lines are its phases)
    const phaseOf = (line) => (/^<g class="lg-p1"/.test(line) ? 1 : /^<g class="lg-p12"><g class="lg-p2"/.test(line) ? 2 : /^<g class="lg-p3"/.test(line) ? 3 : 0)
    let checked = 0
    for (const line of SVG.split(/\r?\n/)) {
      const ph = phaseOf(line)
      if (!ph) continue
      for (const m of line.matchAll(/<g class="lg-hydra-(?:s(\d)[ "]|(king)")/g)) {
        const k = m[2] ? 1 : m[1]
        const rot = line.slice(m.index, m.index + 600).match(/type="rotate" values="[-\d.]+ ([-\d.]+) ([-\d.]+)/)
        expect(rot, `phase ${ph} slot ${k}`).toBeTruthy()
        expect(HYDRA_ROOTS[ph][k], `phase ${ph} slot ${k}`).toEqual([Number(rot[1]), Number(rot[2])])
        checked++
      }
    }
    expect(checked).toBe(18)
    expect(headCss()).toContain(`.lg-boss[data-phase="3"] :is(.lg-hydra-s4, .lg-hydra-stump4) { transform-box: view-box; transform-origin: ${HYDRA_ROOTS[3][4][0]}px ${HYDRA_ROOTS[3][4][1]}px }`)
  })
  it('Grow names the heads that really grew: one at five heads, none (no moment) at six', () => {
    const at = (heads) => ({ ...newFight(), ab: { heads, burns: 0 } })
    const five = strike(at(5), hit('miss'), o)
    expect(five.ab.heads).toBe(6)
    expect(five.last.fx).toBe('grow')
    expect(five.last.fxVars).toEqual({ n: 1 })
    expect(mod.artState(five)['data-ab-grew']).toBe(1)
    const six = strike(at(6), hit('miss'), o)
    expect(six.ab.heads).toBe(6)
    expect(six.last.fx).toBeFalsy()
  })
})
