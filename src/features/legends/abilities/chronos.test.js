// Chronos: Time Loop (design v2.1, #9).
import { describe, it, expect } from 'vitest'
import { newFight, strike, DAMAGE } from '../fight'
import { raidStep } from '../raid'
import { simulateRaid, ALL_CLEAN, ALL_MISS_HARSH } from './_sim'
import { MAX_INSERTED } from './_rules'
import mod from './chronos'

const K = mod.K
const o = { ability: mod.id, need: 99, lives: 9 }
const hit = (verdict, mode = 'typed', extra = {}) => ({ verdict, mode, key: 1, ...extra })
const run = (hits, opts = o, s0 = newFight()) => hits.reduce((s, h) => strike(s, h, opts), s0)
const qs = Array.from({ length: 10 }, (_, i) => ({ kind: 'typed', prompt: `p${i}`, _cardId: 100 + i }))
const step = (s, q, verdict, pos) => raidStep(s, q, { verdict, mode: 'typed' }, { ability: mod.id, need: 60, lives: 3, dayHp: 60, questions: qs, pos })

function avg80(id, n) {
  const runs = []
  for (let k = 0; k < 5; k++) for (const pat of [(i) => ((i + k) % 5 === 4 ? 'miss' : 'clean'), (i) => ['clean', 'clean', 'glancing', 'clean', 'miss'][(i + k) % 5]]) {
    runs.push(simulateRaid(id, { n, answer: (q, { normal }) => ({ verdict: normal ? pat(q._cardId - 1000) : 'clean', mode: 'typed' }) }))
  }
  const wins = runs.filter((r) => r.outcome === 'won')
  return { win: wins.length / runs.length, q: wins.reduce((a, r) => a + r.asked, 0) / Math.max(1, wins.length) }
}

describe(`raid ability: chronos (${mod.id})`, () => {
  it('sand: starts at 1, +1 every 3rd right raid answer and at each phase line, max 3', () => {
    expect(mod.init().sand).toBe(K.start)
    expect(run([hit('clean'), hit('clean')]).ab.sand).toBe(1)
    const s = run([hit('clean'), hit('clean'), hit('clean')])
    expect(s.ab.sand).toBe(2)
    expect(s.last.fx).toBe('grain')
    const bar = { total: 30, before: 0, phases: 3 }
    expect(run([hit('clean')], { ...o, need: 30, bar }, { ...newFight(), damage: 9, phaseSeen: 1 }).ab.sand).toBe(2) // crossed into phase 2
  })
  it('a miss with sand is rewound: no heart, sand -1, no attack, the card loops two questions later', () => {
    const r = step(newFight(), qs[3], 'miss', 3)
    expect(r.next.livesLost).toBe(0)
    expect(r.next.ab.sand).toBe(0)
    expect(r.next.last.fx).toBe('rewind')
    expect(r.groups).toHaveLength(1) // the loop, and no attack
    expect(r.groups[0].at).toBe(3 + K.gap)
    expect(r.groups[0].insert[0]).toMatchObject({ _inserted: 'loop', _cardId: 103 })
    expect(r.groups[0].insert[0].alt).toBeUndefined()
    expect(r.next.ab.loops).toBe(1)
    expect(r.next.ab.loopKey).toBe(null)
    // Without sand: a plain miss (a heart, an attack, no loop).
    const dry = step(r.next, qs[4], 'miss', 4)
    expect(dry.next.livesLost).toBe(1)
    expect(dry.groups).toHaveLength(1)
    expect(dry.groups[0].insert[0]._attack).toBe(true)
  })
  it('a loop answered right is a Paradox (+1); missed it costs one heart and is never looped again', () => {
    const r = step(newFight(), qs[3], 'miss', 3)
    const loop = r.groups[0].insert[0]
    const right = step(r.next, loop, 'clean', 5)
    expect(right.next.damage).toBe(K.paradox)
    expect(right.next.last.fx).toBe('paradox')
    expect(right.next.unredeemed).not.toContain('103')
    const missed = step({ ...r.next, ab: { ...r.next.ab, sand: 3 } }, loop, 'miss', 5)
    expect(missed.next.livesLost).toBe(1)
    expect(missed.groups).toEqual([]) // no loop of a loop, and no attack
  })
  it('a full hourglass overflows into Time Stop: the next right raid answer deals double', () => {
    let s = run(Array(9).fill(hit('clean'))) // sand 1 > 2 > 3 at the 6th, the 9th overflows
    expect(s.ab.sand).toBe(K.max)
    expect(s.ab.stop).toBe(true)
    expect(s.last.fx).toBe('overflow')
    expect(mod.hint(s, { _cardId: 1 })).toMatchObject({ key: 'lg_hint_timeStop' })
    expect(mod.hint(s, { _cardId: 1, _attack: true })).toBe(null)
    const before = s.damage
    s = strike(s, hit('glancing'), o)
    expect(s.damage - before).toBe(2 * DAMAGE.glancing)
    expect(s.last.fx).toBe('timestop')
    expect(s.ab.stop).toBe(false)
  })
  it('loops are capped by K.maxLoops and the shared insert budget; a miss that cannot loop is not rewound', () => {
    const full = strike({ ...newFight(), insertedN: MAX_INSERTED }, hit('miss'), o)
    expect(full.livesLost).toBe(1)
    const capped = strike({ ...newFight(), ab: { ...mod.init(), loops: K.maxLoops } }, hit('miss'), o)
    expect(capped.livesLost).toBe(1)
    for (const n of [5, 10, 15]) {
      const r = simulateRaid(mod.id, { n, answer: (q, { normal }) => ({ verdict: normal ? 'miss' : 'clean', mode: 'typed' }) })
      expect(r.log.filter((e) => e.q._inserted === 'loop').length).toBeLessThanOrEqual(K.maxLoops)
    }
  })
  it('a harsh all-wrong run never wins (loops missed too), and the loop banner marks a loop', () => {
    for (const n of [5, 10, 15]) expect(simulateRaid(mod.id, { n, answer: ALL_MISS_HARSH }).outcome).not.toBe('won')
    expect(mod.banner({}, { _inserted: 'loop' })).toMatchObject({ key: 'lg_hint_timeLoop' })
    expect(mod.banner({}, { _cardId: 1 })).toBe(null)
  })
  it('wins every all-right raid; balance at 80% sits in the design band', () => {
    expect(simulateRaid(mod.id, { n: 15, answer: ALL_CLEAN }).outcome).toBe('won')
    const b15 = avg80(mod.id, 15)
    const b8 = avg80(mod.id, 8)
    if (process.env.BALANCE) process.stdout.write(`chronos n15 ${b15.win * 100}% ${b15.q.toFixed(1)}q · n8 ${b8.win * 100}% ${b8.q.toFixed(1)}q\n`)
    expect(b15.q).toBeGreaterThanOrEqual(9.5)
    expect(b15.q).toBeLessThanOrEqual(15.8)
  })
})

describe('chronos: looks (fx/chronos.jsx) and the arena', () => {
  it('every fx key has an effect, a floater, a juice entry and its own reaction class; the arena draws real states', async () => {
    const { createElement } = await import('react')
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { FX_BY_MOTIF } = await import('../fx')
    const { BossArena } = await import('../BossArena')
    const { mixed } = await import('./_sim')
    const f = FX_BY_MOTIF['chronos']
    for (const k of mod.fxKeys) {
      expect(typeof f.effects[k], k).toBe('function')
      expect(renderToStaticMarkup(createElement('div', null, f.effects[k]())).length, k).toBeGreaterThan(20)
      expect(f.floaters[k], k).toMatch(/^lg_fx_\w+$/)
      expect(f.juice[k], k).toBeTruthy()
      expect(f.css, k).toContain('.lgr-chronos-' + k)
    }
    const t = (k) => k
    for (const answer of [mixed(0.2), mixed(0.5)]) {
      const r = simulateRaid(mod.id, { n: 12, answer, press: 'greedy' })
      for (const e of r.log) {
        const html = renderToStaticMarkup(createElement(BossArena, { t, area: { motif: 'chronos', palette: 'night', title: 'chronos' }, need: r.hp, lives: 3, phases: 3, ability: mod.id, kind: 'raids', state: e.after }))
        expect(html).toContain('lg-boss')
      }
    }
  })
})
