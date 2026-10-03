// Seraph: Verdicts (design v2.1, #6).
import { describe, it, expect } from 'vitest'
import { newFight, strike, DAMAGE } from '../fight'
import { raidStep } from '../raid'
import { simulateRaid, ALL_CLEAN } from './_sim'
import mod, { verdictAt } from './seraph'

const K = mod.K
const o = { ability: mod.id, need: 99, lives: 9 }
const hit = (verdict, mode = 'typed', extra = {}) => ({ verdict, mode, ...extra })

// The averaged 80% run of sim.mjs: misses only, and clean, clean, glancing, clean, miss, at every rotation.
function avg80(id, n) {
  const runs = []
  for (let k = 0; k < 5; k++) for (const pat of [(i) => ((i + k) % 5 === 4 ? 'miss' : 'clean'), (i) => ['clean', 'clean', 'glancing', 'clean', 'miss'][(i + k) % 5]]) {
    runs.push(simulateRaid(id, { n, answer: (q, { normal }) => ({ verdict: normal ? pat(q._cardId - 1000) : 'clean', mode: 'typed' }) }))
  }
  const wins = runs.filter((r) => r.outcome === 'won')
  return { win: wins.length / runs.length, q: wins.reduce((a, r) => a + r.asked, 0) / Math.max(1, wins.length) }
}

describe(`raid ability: seraph (${mod.id})`, () => {
  it('the verdict cycle is wrath, mercy, none, and a phase shifts it by one', () => {
    expect([0, 1, 2, 3].map((a) => verdictAt(a, 3))).toEqual(['wrath', 'mercy', 'none', 'wrath'])
    expect(verdictAt(0, 1)).toBe('mercy')
    expect(verdictAt(0, 2)).toBe('none')
    expect(verdictAt(2, 2)).toBe('mercy')
  })
  it('Wrath: a right answer deals 2 more; a miss is a plain miss', () => {
    // answers 2, phase 1 = wrath
    const at = (answers) => ({ ...newFight(), answers })
    const s = strike(at(2), hit('clean'), o)
    expect(s.damage).toBe(DAMAGE.clean + K.wrath)
    expect(s.last.fx).toBe('wrath')
    expect(strike(at(2), hit('clean', 'choice'), o).damage).toBe(DAMAGE.choice + K.wrath)
    const m = strike(at(2), hit('miss'), o)
    expect(m.livesLost).toBe(1)
    expect(m.damage).toBe(0)
  })
  it('Mercy: a miss costs no heart but still counts and still comes back as an attack; a right answer is Grace +1', () => {
    const s = strike(newFight(), hit('miss'), o) // answers 0, phase 1 = mercy
    expect(s.livesLost).toBe(0)
    expect(s.misses).toBe(1)
    expect(s.last.fx).toBe('mercy')
    const qs = [{ kind: 'typed', prompt: 'p', _cardId: 7 }]
    const r = raidStep(newFight(), qs[0], hit('miss'), { ability: mod.id, need: 30, lives: 3, dayHp: 30, questions: qs, pos: 0 })
    expect(r.next.livesLost).toBe(0)
    expect(r.groups.some((g) => g.insert.some((x) => x._attack))).toBe(true)
    const g = strike(newFight(), hit('clean'), o)
    expect(g.damage).toBe(DAMAGE.clean + K.grace)
    expect(g.last.fx).toBe('grace')
    // Mercy on the last heart still saves it.
    expect(strike({ ...newFight(), livesLost: 2 }, hit('miss'), { ...o, lives: 3 }).livesLost).toBe(2)
  })
  it('None: nothing; attacks and inserted questions carry no verdict', () => {
    const s = strike({ ...newFight(), answers: 1 }, hit('clean'), o) // answers 1, phase 1 = none
    expect(s.damage).toBe(DAMAGE.clean)
    expect(s.last.fx).toBe('')
    const atk = strike(newFight(), hit('miss', 'typed', { attack: true }), o)
    expect(atk.livesLost).toBe(2)
    expect(strike({ ...newFight(), answers: 2 }, hit('clean', 'typed', { attack: true }), o).damage).toBe(DAMAGE.counter)
  })
  it('the tag marks the question with its verdict (none on re-asks), the HUD queues the next three', () => {
    const s = { ...newFight(), ab: mod.init() }
    const q = { kind: 'typed', _cardId: 1 }
    expect(mod.tag({ ...s, answers: 2 }, q, { phase: 1 })).toMatchObject({ key: 'lg_tag_wrath', vars: { n: K.wrath } })
    expect(mod.tag({ ...s, answers: 0 }, q, { phase: 1 })).toMatchObject({ key: 'lg_tag_mercy' })
    expect(mod.tag({ ...s, answers: 1 }, q, { phase: 1 })).toBe(null)
    expect(mod.tag({ ...s, answers: 2 }, { ...q, _attack: true }, { phase: 1 })).toBe(null)
    const [queue] = mod.hud({ ...s, answers: 2 }, { phase: 1 })
    expect(queue.items.map((x) => x.icon)).toEqual(['🔥', '🕊️', '⚖️'])
  })
  it('wins every all-right raid; balance at 80% sits in the design band', () => {
    expect(simulateRaid(mod.id, { n: 15, answer: ALL_CLEAN }).outcome).toBe('won')
    const b15 = avg80(mod.id, 15)
    const b8 = avg80(mod.id, 8)
    if (process.env.BALANCE) process.stdout.write(`seraph n15 ${b15.win * 100}% ${b15.q.toFixed(1)}q · n8 ${b8.win * 100}% ${b8.q.toFixed(1)}q\n`)
    expect(b15.q).toBeGreaterThanOrEqual(9.5)
    expect(b15.q).toBeLessThanOrEqual(15.8)
  })
})

describe('seraph: looks (fx/seraph.jsx) and the arena', () => {
  it('every fx key has an effect, a floater, a juice entry and its own reaction class; the arena draws real states', async () => {
    const { createElement } = await import('react')
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { FX_BY_MOTIF } = await import('../fx')
    const { BossArena } = await import('../BossArena')
    const { mixed } = await import('./_sim')
    const f = FX_BY_MOTIF['seraph']
    for (const k of mod.fxKeys) {
      expect(typeof f.effects[k], k).toBe('function')
      expect(renderToStaticMarkup(createElement('div', null, f.effects[k]())).length, k).toBeGreaterThan(20)
      expect(f.floaters[k], k).toMatch(/^lg_fx_\w+$/)
      expect(f.juice[k], k).toBeTruthy()
      expect(f.css, k).toContain('.lgr-seraph-' + k)
    }
    const t = (k) => k
    for (const answer of [mixed(0.2), mixed(0.5)]) {
      const r = simulateRaid(mod.id, { n: 12, answer, press: 'greedy' })
      for (const e of r.log) {
        const html = renderToStaticMarkup(createElement(BossArena, { t, area: { motif: 'seraph', palette: 'night', title: 'seraph' }, need: r.hp, lives: 3, phases: 3, ability: mod.id, kind: 'raids', state: e.after }))
        expect(html).toContain('lg-boss')
      }
    }
  })
})
