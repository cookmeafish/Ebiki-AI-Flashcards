// Vampire: Blood Wards (design v2.1, #10).
import { describe, it, expect } from 'vitest'
import { newFight, strike, DAMAGE } from '../fight'
import { simulateRaid, ALL_CLEAN } from './_sim'
import mod from './vampire'

const K = mod.K
const o = { ability: mod.id, need: 99, lives: 9 }
const hit = (verdict, mode = 'typed', extra = {}) => ({ verdict, mode, ...extra })
const run = (hits, opts = o, s0 = newFight()) => hits.reduce((s, h) => strike(s, h, opts), s0)
const three = [hit('glancing'), hit('glancing'), hit('glancing')]

function avg80(id, n) {
  const runs = []
  for (let k = 0; k < 5; k++) for (const pat of [(i) => ((i + k) % 5 === 4 ? 'miss' : 'clean'), (i) => ['clean', 'clean', 'glancing', 'clean', 'miss'][(i + k) % 5]]) {
    runs.push(simulateRaid(id, { n, answer: (q, { normal }) => ({ verdict: normal ? pat(q._cardId - 1000) : 'clean', mode: 'typed' }) }))
  }
  const wins = runs.filter((r) => r.outcome === 'won')
  return { win: wins.length / runs.length, q: wins.reduce((a, r) => a + r.asked, 0) / Math.max(1, wins.length) }
}

describe(`raid ability: vampire (${mod.id})`, () => {
  it('three right in a row raise a ward (max 2); a miss resets the streak; attacks never count', () => {
    const one = run(three)
    expect(one.ab.wards).toBe(1)
    expect(one.ab.streak).toBe(0)
    expect(one.last.fx).toBe('ward')
    expect(run([hit('glancing')]).last.fx).toBe('drip')
    expect(run([hit('glancing'), hit('glancing'), hit('miss', 'typed', { attack: true })]).ab.streak).toBe(2)
    expect(run([hit('glancing'), hit('glancing'), hit('miss'), hit('glancing')]).ab.wards).toBe(0)
    expect(run([...three, ...three]).ab.wards).toBe(K.max)
  })
  it('with two wards held, three in a row Feast for 3 instead', () => {
    const s = run([...three, ...three])
    const f = run(three, o, s)
    expect(f.last.fx).toBe('feast')
    expect(f.ab.wards).toBe(K.max)
    expect(f.damage - s.damage).toBe(3 * DAMAGE.glancing + K.feast)
  })
  it('a ward takes ONE lost heart and bursts for 2: a miss costs nothing, a missed attack costs 1', () => {
    const s = run(three)
    const m = strike(s, hit('miss'), o)
    expect(m.livesLost).toBe(0)
    expect(m.ab.wards).toBe(0)
    expect(m.damage - s.damage).toBe(K.burst)
    expect(m.last.fx).toBe('burst')
    const a = strike(s, hit('miss', 'typed', { attack: true }), o)
    expect(a.livesLost).toBe(1)
    expect(a.damage - s.damage).toBe(K.burst)
    expect(strike(newFight(), hit('miss'), o).livesLost).toBe(1) // no ward: a plain miss
  })
  it('the HUD: wards, then the streak (ready one short of a ward)', () => {
    const s = run([hit('glancing'), hit('glancing')])
    const [wards, streak] = mod.hud(s, {})
    expect(wards).toMatchObject({ type: 'pips', n: 0, max: K.max })
    expect(streak).toMatchObject({ type: 'pips', n: 2, max: K.streak, ready: true })
  })
  it('wins every all-right raid; balance at 80% sits in the design band', () => {
    expect(simulateRaid(mod.id, { n: 15, answer: ALL_CLEAN }).outcome).toBe('won')
    const b15 = avg80(mod.id, 15)
    const b8 = avg80(mod.id, 8)
    if (process.env.BALANCE) process.stdout.write(`vampire n15 ${b15.win * 100}% ${b15.q.toFixed(1)}q · n8 ${b8.win * 100}% ${b8.q.toFixed(1)}q\n`)
    expect(b15.q).toBeGreaterThanOrEqual(9.5)
    expect(b15.q).toBeLessThanOrEqual(15.8)
  })
})

describe('vampire: looks (fx/vampire.jsx) and the arena', () => {
  it('every fx key has an effect, a floater, a juice entry and its own reaction class; the arena draws real states', async () => {
    const { createElement } = await import('react')
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { FX_BY_MOTIF } = await import('../fx')
    const { BossArena } = await import('../BossArena')
    const { mixed } = await import('./_sim')
    const f = FX_BY_MOTIF['vampire']
    for (const k of mod.fxKeys) {
      expect(typeof f.effects[k], k).toBe('function')
      expect(renderToStaticMarkup(createElement('div', null, f.effects[k]())).length, k).toBeGreaterThan(20)
      expect(f.floaters[k], k).toMatch(/^lg_fx_\w+$/)
      expect(f.juice[k], k).toBeTruthy()
      expect(f.css, k).toContain('.lgr-vampire-' + k)
    }
    const t = (k) => k
    for (const answer of [mixed(0.2), mixed(0.5)]) {
      const r = simulateRaid(mod.id, { n: 12, answer, press: 'greedy' })
      for (const e of r.log) {
        const html = renderToStaticMarkup(createElement(BossArena, { t, area: { motif: 'vampire', palette: 'night', title: 'vampire' }, need: r.hp, lives: 3, phases: 3, ability: mod.id, kind: 'raids', state: e.after }))
        expect(html).toContain('lg-boss')
      }
    }
  })
})
