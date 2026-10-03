// The Tide Hydra's drawing shows EXACTLY the ability's head count, in every phase (the owner: "the boss doesn't
// visibly gain those heads"). Plays strike sequences through fight.js, takes the module's artState, builds the arena's
// real state CSS (abilityCss) and resolves which head groups of raids/hydra.svg that CSS leaves visible.
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { newFight, strike } from '../fight'
import { abilityCss } from '../fx'
import { headCss, HYDRA_MAX_HEADS } from '../fx/hydra'
import mod from './hydra'

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

// Which classes the arena's CSS shows / hides for this state (parsed from the generated rules, not re-implemented).
function stateRules(attrs) {
  const css = abilityCss('heads', attrs)
  const show = new Set()
  const hide = new Set()
  for (const r of css.matchAll(/\.lg-boss\[data-ab-heads="(\d+)"\] \.([\w-]+) \{ display: (inline|none) !important \}/g)) {
    if (String(attrs['data-ab-heads']) !== r[1]) continue
    ;(r[3] === 'inline' ? show : hide).add(r[2])
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
// Heads drawn = the king (never cut) + every visible slot head; stumps = visible seared stumps.
function drawn(heads, phase) {
  const rules = stateRules(mod.artState({ ab: { heads } }))
  const count = (re) => ALL.filter((n) => n.cls.some((c) => re.test(c)) && visible(n, rules, phase)).length
  return { heads: 1 + count(/^lg-hydra-s\d$/), stumps: count(/^lg-hydra-stump\d$/) }
}

const o = { ability: 'heads', need: 400, lives: 50 }
const hit = (verdict) => ({ verdict, mode: 'typed' })

describe('raids/hydra.svg draws the head count', () => {
  it('every phase has one slot group per slot head (s2..s6) and a stump for s2 and s3', () => {
    for (const phase of [1, 2, 3]) {
      for (let k = 2; k <= HYDRA_MAX_HEADS; k++) {
        const slots = ALL.filter((n) => n.cls.includes(`lg-hydra-s${k}`) && n.up.some((u) => phaseShows(u, phase) === true))
        expect(slots.length, `phase ${phase} slot ${k}`).toBe(1)
      }
      for (const k of [2, 3]) expect(ALL.filter((n) => n.cls.includes(`lg-hydra-stump${k}`) && n.up.some((u) => phaseShows(u, phase) === true)).length).toBe(1)
    }
  })
  it('1 to 6 heads: exactly that many heads in every phase, cut base heads as stumps', () => {
    expect(mod.K.max).toBe(HYDRA_MAX_HEADS)
    for (let heads = 1; heads <= HYDRA_MAX_HEADS; heads++) {
      for (const phase of [1, 2, 3]) expect(drawn(heads, phase), `phase ${phase}, ${heads} heads`).toEqual({ heads, stumps: Math.max(0, mod.K.base - heads) })
    }
  })
  it('a played fight: after every strike the drawing shows the module\'s head count', () => {
    const seq = ['clean', 'miss', 'miss', 'clean', 'glancing', 'clean', 'clean', 'clean', 'clean', 'miss', 'clean', 'clean', 'clean']
    let s = newFight()
    const seen = new Set()
    for (const v of seq) {
      s = strike(s, hit(v), o)
      seen.add(s.ab.heads)
      for (const phase of [1, 2, 3]) expect(drawn(s.ab.heads, phase).heads).toBe(s.ab.heads)
    }
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6])
  })
  it('the moments move the real heads: grow sprouts the newest slots, sever drops the one cut', () => {
    const css = headCss()
    expect(css).toContain('.lg-boss[data-fx="grow"][data-ab-heads="5"] .lg-hydra-s4, .lg-boss[data-fx="grow"][data-ab-heads="5"] .lg-hydra-s5')
    expect(css).toMatch(/\.lg-boss\[data-fx="sever"\]\[data-ab-heads="2"\] \.lg-hydra-s3[^{]*\{ display: inline !important;[^}]*animation: lgrHydraLop/)
    expect(css).toContain('.lg-boss[data-fx="sever"][data-ab-heads="1"] .lg-hydra-stump2')
    expect(css).toContain('.lg-boss[data-fx="cauterize"] .lg-hydra-s2')
    expect(css).not.toContain('lg-hydra-s1') // the king is never cut or grown
    expect(abilityCss('heads', { 'data-ab-heads': 4 })).toContain(css)
  })
})
