// Leviathan: Ride the Current (design v2.1, #7).
import { describe, it, expect } from 'vitest'
import { newFight, strike, DAMAGE } from '../fight'
import { simulateRaid, ALL_CLEAN } from './_sim'
import mod from './leviathan'

const K = mod.K
const o = { ability: mod.id, need: 99, lives: 9 }
const hit = (verdict, mode = 'typed', extra = {}) => ({ verdict, mode, ...extra })
const run = (hits, opts = o, s0 = newFight()) => hits.reduce((s, h) => strike(s, h, opts), s0)

function avg80(id, n) {
  const runs = []
  for (let k = 0; k < 5; k++) for (const pat of [(i) => ((i + k) % 5 === 4 ? 'miss' : 'clean'), (i) => ['clean', 'clean', 'glancing', 'clean', 'miss'][(i + k) % 5]]) {
    runs.push(simulateRaid(id, { n, answer: (q, { normal }) => ({ verdict: normal ? pat(q._cardId - 1000) : 'clean', mode: 'typed' }) }))
  }
  const wins = runs.filter((r) => r.outcome === 'won')
  return { win: wins.length / runs.length, q: wins.reduce((a, r) => a + r.asked, 0) / Math.max(1, wins.length) }
}

describe(`raid ability: leviathan (${mod.id})`, () => {
  it('rows up one per right answer, clamped at the crest; a miss drags it down two, clamped at 0', () => {
    expect(mod.init().current).toBe(K.start)
    let s = run([hit('clean')])
    expect(s.ab.current).toBe(2)
    expect(s.last.fx).toBe('row')
    expect(s.damage).toBe(DAMAGE.clean)
    s = run([hit('clean'), hit('clean'), hit('clean'), hit('clean')])
    expect(s.ab.current).toBe(K.max)
    expect(run([hit('miss')]).ab.current).toBe(0)
    expect(run([hit('clean'), hit('miss')]).ab.current).toBe(0)
    expect(run([hit('clean'), hit('clean'), hit('miss')]).ab.current).toBe(1)
  })
  it('the crest pays +1 on every right answer at 3, only there: reaching it is the crest, staying is a surf', () => {
    const reach = run([hit('glancing'), hit('glancing')])
    expect(reach.last.fx).toBe('crest')
    expect(reach.damage).toBe(2 * DAMAGE.glancing + K.crest)
    const surf = strike(reach, hit('glancing'), o)
    expect(surf.last.fx).toBe('surf')
    expect(surf.damage - reach.damage).toBe(DAMAGE.glancing + K.crest)
    expect(run([hit('glancing')]).damage).toBe(DAMAGE.glancing) // below the crest: no bonus
    const wipe = strike(surf, hit('miss'), o)
    expect(wipe.last.fx).toBe('wipeout')
    expect(wipe.ab.current).toBe(1)
    expect(strike(run([hit('clean')]), hit('miss'), o).last.fx).toBe('pulled')
  })
  it('attacks and inserted questions never move the boat', () => {
    const s = run([hit('clean', 'typed', { attack: true }), hit('miss', 'typed', { attack: true }), hit('clean', 'typed', { inserted: 'loop' })])
    expect(s.ab.current).toBe(K.start)
  })
  it('a phase line leaves the current alone (the crest can be ridden across it)', () => {
    const bar = { total: 9, before: 0, phases: 3 }
    const ob = { ...o, need: 9, bar }
    const s = run([hit('clean'), hit('clean')], ob) // 2 + (2+1 crest) = 5 of 9: phase 2 crossed on the second answer
    expect(s.ab.current).toBe(K.max)
    expect(strike(s, hit('clean'), ob).last.fx).toBe('surf')
  })
  it('wins every all-right raid; balance at 80% sits in the design band', () => {
    expect(simulateRaid(mod.id, { n: 15, answer: ALL_CLEAN }).outcome).toBe('won')
    const b15 = avg80(mod.id, 15)
    const b8 = avg80(mod.id, 8)
    if (process.env.BALANCE) process.stdout.write(`leviathan n15 ${b15.win * 100}% ${b15.q.toFixed(1)}q · n8 ${b8.win * 100}% ${b8.q.toFixed(1)}q\n`)
    expect(b15.q).toBeGreaterThanOrEqual(9.5)
    expect(b15.q).toBeLessThanOrEqual(15.8)
  })
})

describe('leviathan: looks (fx/leviathan.jsx) and the arena', () => {
  it('every fx key has an effect, a floater, a juice entry and its own reaction class; the arena draws real states', async () => {
    const { createElement } = await import('react')
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { FX_BY_MOTIF } = await import('../fx')
    const { BossArena } = await import('../BossArena')
    const { mixed } = await import('./_sim')
    const f = FX_BY_MOTIF['leviathan']
    for (const k of mod.fxKeys) {
      expect(typeof f.effects[k], k).toBe('function')
      expect(renderToStaticMarkup(createElement('div', null, f.effects[k]())).length, k).toBeGreaterThan(20)
      expect(f.floaters[k], k).toMatch(/^lg_fx_\w+$/)
      expect(f.juice[k], k).toBeTruthy()
      expect(f.css, k).toContain('.lgr-leviathan-' + k)
    }
    const t = (k) => k
    for (const answer of [mixed(0.2), mixed(0.5)]) {
      const r = simulateRaid(mod.id, { n: 12, answer, press: 'greedy' })
      for (const e of r.log) {
        const html = renderToStaticMarkup(createElement(BossArena, { t, area: { motif: 'leviathan', palette: 'night', title: 'leviathan' }, need: r.hp, lives: 3, phases: 3, ability: mod.id, kind: 'raids', state: e.after }))
        expect(html).toContain('lg-boss')
      }
    }
  })
})
