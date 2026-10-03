// Inferno: Pressure Vent (design v2.1, #8). A decision boss: the Vent button.
import { describe, it, expect } from 'vitest'
import { newFight, strike, act, settleFight, DAMAGE } from '../fight'
import { simulateRaid, ALL_CLEAN } from './_sim'
import mod, { ventDamage } from './inferno'

const K = mod.K
const o = { ability: mod.id, need: 99, lives: 9 }
const hit = (verdict, mode = 'typed', extra = {}) => ({ verdict, mode, ...extra })
const run = (hits, opts = o, s0 = newFight()) => hits.reduce((s, h) => strike(s, h, opts), s0)

function avg80(id, n, press) {
  const runs = []
  for (let k = 0; k < 5; k++) for (const pat of [(i) => ((i + k) % 5 === 4 ? 'miss' : 'clean'), (i) => ['clean', 'clean', 'glancing', 'clean', 'miss'][(i + k) % 5]]) {
    runs.push(simulateRaid(id, { n, press, answer: (q, { normal }) => ({ verdict: normal ? pat(q._cardId - 1000) : 'clean', mode: 'typed' }) }))
  }
  const wins = runs.filter((r) => r.outcome === 'won')
  return { win: wins.length / runs.length, q: wins.reduce((a, r) => a + r.asked, 0) / Math.max(1, wins.length) }
}

describe(`raid ability: inferno (${mod.id})`, () => {
  it('a right answer adds heat, a miss cools it by 2 (never below 0); attacks and re-asks leave it alone', () => {
    expect(run([hit('clean'), hit('clean')]).ab.heat).toBe(2)
    expect(run([hit('clean'), hit('clean')]).last.fx).toBe('heat')
    expect(run([hit('clean'), hit('clean'), hit('clean'), hit('miss')]).ab.heat).toBe(1)
    expect(run([hit('clean'), hit('miss')]).ab.heat).toBe(0)
    expect(run([hit('clean'), hit('miss')]).last.fx).toBe('cool')
    expect(run([hit('miss')]).last.fx).toBe('') // nothing to cool
    expect(run([hit('clean', 'typed', { attack: true }), hit('clean', 'typed', { inserted: 'loop' })]).ab.heat).toBe(0)
  })
  it('the 4th heat erupts by itself for 3 and empties the gauge', () => {
    const s = run([hit('glancing'), hit('glancing'), hit('glancing'), hit('glancing')])
    expect(s.last.fx).toBe('erupt')
    expect(s.ab.heat).toBe(0)
    expect(s.damage).toBe(4 * DAMAGE.glancing + K.erupt)
  })
  it('Vent deals heat minus 1 (from 2 heat), empties the gauge, never costs a life', () => {
    expect([0, 1, 2, 3].map(ventDamage)).toEqual([0, 0, 1, 2])
    let s = run([hit('glancing'), hit('glancing')])
    const before = s.damage
    s = act(s, { type: 'vent' }, o)
    expect(s.damage - before).toBe(1)
    expect(s.ab.heat).toBe(0)
    expect(s.last.fx).toBe('vent')
    expect(s.livesLost).toBe(0)
    const hot = act(run([hit('glancing'), hit('glancing'), hit('glancing')]), { type: 'vent' }, o)
    expect(hot.last.fx).toBe('blast')
    expect(hot.last.damage).toBe(2)
    const cold = run([hit('glancing')])
    expect(act(cold, { type: 'vent' }, o).damage).toBe(cold.damage) // 1 heat: nothing to vent
  })
  it('the button: only on raid questions, enabled from 2 heat, labelled with what it deals', () => {
    const s = run([hit('glancing'), hit('glancing'), hit('glancing')])
    const [b] = mod.actions(s, { q: { _cardId: 1 } })
    expect(b).toMatchObject({ id: 'vent', enabled: true, vars: { n: 2 }, labelKey: 'lg_btn_vent' })
    expect(mod.actions(run([hit('clean')]), { q: { _cardId: 1 } })[0].enabled).toBe(false)
    expect(mod.actions(s, { q: { _cardId: 1, _attack: true } })).toEqual([])
    expect(mod.actions(s, { q: { _cardId: 1, _inserted: 'minion' } })).toEqual([])
  })
  it('settle vents what is left (2+ heat)', () => {
    const s = run([hit('glancing'), hit('glancing'), hit('glancing')])
    const end = settleFight(s, o)
    expect(end.damage - s.damage).toBe(2)
    expect(settleFight(run([hit('glancing')]), o).damage).toBe(DAMAGE.glancing)
  })
  it('never venting, greedy and patient all win every all-right raid; every policy sits in the design band at 80%', () => {
    for (const press of ['never', 'greedy']) expect(simulateRaid(mod.id, { n: 15, answer: ALL_CLEAN, press }).outcome).toBe('won')
    const at3 = (acts, { state }) => ((state.ab && state.ab.heat >= 3) ? ['vent'] : [])
    for (const [label, press] of [['never', 'never'], ['greedy', 'greedy'], ['at 3', at3]]) {
      const b15 = avg80(mod.id, 15, press)
      const b8 = avg80(mod.id, 8, press)
      if (process.env.BALANCE) process.stdout.write(`inferno ${label} n15 ${b15.win * 100}% ${b15.q.toFixed(1)}q · n8 ${b8.win * 100}% ${b8.q.toFixed(1)}q\n`)
      expect(b15.q, label).toBeGreaterThanOrEqual(9.5)
      expect(b15.q, label).toBeLessThanOrEqual(15.8)
    }
  })
})

describe('inferno: looks (fx/inferno.jsx) and the arena', () => {
  it('every fx key has an effect, a floater, a juice entry and its own reaction class; the arena draws real states', async () => {
    const { createElement } = await import('react')
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { FX_BY_MOTIF } = await import('../fx')
    const { BossArena } = await import('../BossArena')
    const { mixed } = await import('./_sim')
    const f = FX_BY_MOTIF['inferno']
    for (const k of mod.fxKeys) {
      expect(typeof f.effects[k], k).toBe('function')
      expect(renderToStaticMarkup(createElement('div', null, f.effects[k]())).length, k).toBeGreaterThan(20)
      expect(f.floaters[k], k).toMatch(/^lg_fx_\w+$/)
      expect(f.juice[k], k).toBeTruthy()
      expect(f.css, k).toContain('.lgr-inferno-' + k)
    }
    const t = (k) => k
    for (const answer of [mixed(0.2), mixed(0.5)]) {
      const r = simulateRaid(mod.id, { n: 12, answer, press: 'greedy' })
      for (const e of r.log) {
        const html = renderToStaticMarkup(createElement(BossArena, { t, area: { motif: 'inferno', palette: 'night', title: 'inferno' }, need: r.hp, lives: 3, phases: 3, ability: mod.id, kind: 'raids', state: e.after }))
        expect(html).toContain('lg-boss')
      }
    }
  })
})
