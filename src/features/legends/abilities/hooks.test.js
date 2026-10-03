// The registry's hooks, end to end, with a made-up ability (registered for this file only). Also a worked example
// of every hook for the boss agents: init/onPhase/onStrike/onLifeLoss/afterStrike/actions/act/settle/hud/artState.
import { describe, it, expect } from 'vitest'
import { registerAbilityForTest } from './index'
import { newFight, strike, act, settleFight, fightOutcome, barPhase, abilityState, DAMAGE } from '../fight'
import { raidStep, raidToday, applyRaidAttempt, shapeRaid, newRaidState } from '../raid'
import { MAX_INSERTED } from './_rules'
import { abilityCss } from '../fx'
import { simulateRaid, ALL_CLEAN } from './_sim'

const fake = registerAbilityForTest('zztest', {
  id: 'zzbank', icon: '🧪', K: { raiseEvery: 2, burst: 3 },
  decision: true, // it has buttons (actions): only a decision module may
  fxKeys: ['bank', 'burst', 'ward', 'vent', 'raise'],
  init: (ctx) => ({ bank: 0, startPhase: ctx.phase, phases: [], wards: 1, raiseIn: 2, raised: [] }),
  onPhase(s, phase) { s.ab.phases = [...s.ab.phases, phase] },
  onStrike(s, res, hit, ctx) {
    if (ctx.kind === 'normal' && ctx.right) {
      s.ab.bank += res.dmg + (hit.armed && hit.armed.double ? 2 : 0)
      res.dmg = 0
      res.fx = 'bank'
      res.fxVars = { n: s.ab.bank }
    }
    if (ctx.kind === 'inserted' && ctx.right) { res.dmg += ctx.K.burst; res.fx = 'burst' }
    if (ctx.kind === 'inserted' && !ctx.right) res.lives = 0 // a minion that escapes costs no life
    if (ctx.kind === 'normal') s.ab.raiseIn--
  },
  onLifeLoss(s, res) { if (s.ab.wards > 0) { s.ab.wards--; res.lives--; res.fx = 'ward' } },
  afterStrike(next, { over, normal, q, hit }) {
    if (over || !normal || next.ab.raiseIn > 0 || hit.verdict === 'miss') return null
    // afterStrike only READS next; what it decided goes back through `ab` (merged into fight.ab by raidStep).
    return { insert: [{ key: q._cardId, kind: 'minion' }], at: 1, ab: { raiseIn: 2, raised: [...next.ab.raised, q._cardId] } }
  },
  actions: (s, ctx) => [{ id: 'vent', icon: '🔥', labelKey: 'x_vent', enabled: s.ab.bank > 0 }, { id: 'double', labelKey: 'x_double', toggle: true, enabled: ctx.mode !== 'choice' }],
  act(s, res, action) { if (action.type === 'vent' && s.ab.bank > 0) { res.dmg = s.ab.bank; s.ab.bank = 0; res.fx = 'vent' } },
  settle(s, res) { if (s.ab.bank > 0) { res.dmg = s.ab.bank; s.ab.bank = 0; res.fx = 'burst' } },
  hud: (s) => [{ type: 'gauge', value: s.ab.bank, max: 10, labelKey: 'x_bank' }],
  artState: (s) => ({ 'data-ab-bank': Math.min(3, s.ab.bank) }),
})
const id = fake.id
const clean = { verdict: 'clean', mode: 'typed' }
const miss = { verdict: 'miss', mode: 'typed' }

describe('ability hooks (a made-up ability)', () => {
  it('init gets the phase the fight starts in, and the state lives in fight.ab', () => {
    const bar = { total: 30, before: 15, phases: 3 } // a wounded boss: half its health gone = phase 2
    const s = strike(newFight(), clean, { ability: id, need: 15, lives: 3, bar })
    expect(s.ab.startPhase).toBe(2)
    expect(s.ab.bank).toBe(DAMAGE.clean)
    expect(s.damage).toBe(0)
    expect(s.last.fx).toBe('bank')
    expect(s.last.fxVars).toEqual({ n: DAMAGE.clean })
    expect(abilityState(newFight(), fake).bank).toBe(0)
  })
  it('armed toggles reach onStrike, buttons act without costing lives, settle flushes what is held', () => {
    const o = { ability: id, need: 6, lives: 3 }
    let s = strike(newFight(), { ...clean, armed: { double: true } }, o)
    expect(s.ab.bank).toBe(DAMAGE.clean + 2)
    s = act(s, { type: 'vent' }, o)
    expect(s.damage).toBe(DAMAGE.clean + 2)
    expect(s.livesLost).toBe(0)
    expect(s.last.fx).toBe('vent')
    expect(s.last.action).toBe('vent')
    s = strike(s, clean, o)
    expect(fightOutcome(settleFight(s, o), o)).toBe('won')
    expect(settleFight(newFight(), o)).toEqual(newFight()) // nothing held: unchanged
  })
  it('onPhase fires when the bar crosses a phase line, once per phase', () => {
    const bar = { total: 9, before: 0, phases: 3 }
    const o = { ability: id, need: 9, lives: 3, bar }
    let s = strike(newFight(), clean, o)
    s = act(s, { type: 'vent' }, o) // 2 of 9: still phase 1
    expect(s.ab.phases).toEqual([])
    s = strike(s, clean, o)
    s = act(s, { type: 'vent' }, o) // 4 of 9 dealt: phase 2
    expect(barPhase(bar, s.damage)).toBe(2)
    expect(s.ab.phases).toEqual([2])
    s = strike(s, clean, o)
    expect(s.ab.phases).toEqual([2])
  })
  it('onLifeLoss runs after the Legends shield', () => {
    const o = { ability: id, need: 8, lives: 3 }
    let s = strike(newFight(), miss, { ...o, shield: true })
    expect(s.shieldUsed).toBe(true)
    expect(s.ab.wards).toBe(1) // the shield took it first
    s = strike(s, miss, { ...o, shield: true })
    expect(s.ab.wards).toBe(0)
    expect(s.livesLost).toBe(0)
    expect(s.last.fx).toBe('ward')
    s = strike(s, miss, o)
    expect(s.livesLost).toBe(1)
  })
  it('afterStrike inserts a card as an ability question: typed, marked _inserted, judged as inserted', () => {
    const questions = [{ kind: 'typed', prompt: 'p0', alt: { choices: ['a', 'b'], answerIdx: 0 }, _cardId: 5 }, { kind: 'typed', prompt: 'p1', _cardId: 6 }]
    const ctx = { ability: id, need: 20, lives: 3, dayHp: 20, questions }
    let r = raidStep(newFight(), questions[0], clean, { ...ctx, pos: 0 })
    expect(r.groups).toEqual([])
    r = raidStep(r.next, questions[1], clean, { ...ctx, pos: 1 })
    expect(r.groups).toHaveLength(1)
    const [minion] = r.groups[0].insert
    expect(r.groups[0].at).toBe(2)
    expect(minion._inserted).toBe('minion')
    expect(minion._lastStand).toBeUndefined()
    expect(minion.alt).toBeUndefined()
    expect(r.next.ab.raised).toEqual([6])
    expect(r.next.ab.raiseIn).toBe(2)
    const after = raidStep(r.next, minion, clean, { ...ctx, pos: 2 }).next
    expect(after.last.fx).toBe('burst')
    expect(after.last.inserted).toBe('minion')
    expect(after.answers).toBe(r.next.answers) // an inserted question is not a normal answer
    expect(raidStep(r.next, minion, miss, { ...ctx, pos: 2 }).next.livesLost).toBe(0)
  })
  it('the simulator presses buttons and arms toggles', () => {
    const r = simulateRaid(id, { n: 8, answer: ALL_CLEAN, press: 'greedy' })
    expect(r.outcome).toBe('won')
    expect(r.log.some((e) => e.after.last.fx === 'burst')).toBe(true)
  })
  it('the arena CSS shows fx layers while data-fx plays and state layers for data-ab-* values', () => {
    const css = abilityCss(id, { 'data-ab-bank': 2 })
    expect(css).toContain('.lg-boss[data-fx="vent"] .lg-fx-vent { display: inline !important }')
    expect(css).toContain('.lg-boss[data-fx="vent"] .lg-fxh-vent { display: none !important }')
    expect(css).toContain('.lg-boss[data-ab-bank="2"] .lg-ab-bank-2 { display: inline !important }')
    expect(abilityCss(id, { 'data-ab-x': '"><script>' })).not.toContain('<script>')
  })
  it('dayState is kept with the day wounds and handed back to init as ctx.dayAb; a new day drops it', () => {
    const day = raidToday(newRaidState(), '2026-10-02', 10)
    const { state } = applyRaidAttempt(day, '2026-10-02', 3, { split: [3, 0, 0] })
    expect(shapeRaid(state).day.ab).toEqual({ split: [3, 0, 0] })
    expect(raidToday(state, '2026-10-03', 10).day.ab).toBeUndefined()
    const seen = []
    registerAbilityForTest('zzday', { id: 'zzday', icon: '📅', init: (ctx) => { seen.push(ctx.dayAb); return {} } })
    strike(newFight(), clean, { ability: 'zzday', dayAb: shapeRaid(state).day.ab })
    expect(seen).toEqual([{ split: [3, 0, 0] }])
  })
})

describe('foundation v2.1: inserts, timing plans, ctx', () => {
  const qs = Array.from({ length: 12 }, (_, i) => ({ kind: 'typed', prompt: `p${i}`, _cardId: 100 + i }))
  const base = { need: 60, lives: 10, dayHp: 60, questions: qs }
  it('a loop: afterStrike with at 2 and attack false puts the card two questions later and cancels the attack (Chronos)', () => {
    registerAbilityForTest('zzloop', { id: 'zzloop', icon: '⏳',
      afterStrike: (next, { q, hit, normal, over }) => (normal && !over && hit.verdict === 'miss' ? { insert: [{ key: q._cardId, kind: 'loop' }], at: 2, attack: false, ab: { loops: 1 } } : null) })
    const r = raidStep(newFight(), qs[3], miss, { ...base, ability: 'zzloop', pos: 3 })
    expect(r.groups).toHaveLength(1) // no attack group
    expect(r.groups[0].at).toBe(5)
    expect(r.groups[0].insert[0]._inserted).toBe('loop')
    expect(r.groups[0].insert[0]._cardId).toBe(103)
    expect(r.next.ab.loops).toBe(1)
    expect(r.next.attacks).toBe(0)
  })
  it(`ability inserts share MAX_INSERTED (${MAX_INSERTED}) per attempt; a plan that no longer fits is dropped whole`, () => {
    const seenRoom = []
    registerAbilityForTest('zzflood', { id: 'zzflood', icon: '🌊', init: () => ({ planned: 0 }),
      afterStrike: (next, { q, normal, over, room }) => { seenRoom.push(room); return normal && !over ? { insert: [{ key: q._cardId, kind: 'minion' }, { key: q._cardId, kind: 'minion' }, { key: q._cardId, kind: 'minion' }], at: 1, attack: false, ab: { planned: next.ab.planned + 1 } } : null } })
    let s = newFight()
    const counts = []
    for (let i = 0; i < 4; i++) {
      const r = raidStep(s, qs[i], miss, { ...base, ability: 'zzflood', pos: i })
      counts.push(r.groups.filter((g) => g.insert[0]._inserted).reduce((n, g) => n + g.insert.length, 0))
      if (i === 2) expect(r.groups.some((g) => g.insert[0]._attack), 'room 0: the plan (and its attack: false) is dropped, the attack comes').toBe(true)
      s = r.next
    }
    expect(counts).toEqual([3, 1, 0, 0])
    expect(seenRoom).toEqual([4, 1, 0, 0])
    expect(s.insertedN).toBe(MAX_INSERTED)
    expect(s.ab.planned).toBe(2) // the dropped plans recorded nothing
  })
  it('onStrike sees ctx.lives, ctx.livesLost and ctx.lastLife (Berserker)', () => {
    const seen = []
    registerAbilityForTest('zzlives', { id: 'zzlives', icon: '🪓', onStrike: (s, res, hit, ctx) => { seen.push([ctx.lives, ctx.livesLost, ctx.lastLife]) } })
    let s = strike(newFight(), miss, { ability: 'zzlives', need: 10, lives: 3 })
    s = strike(s, miss, { ability: 'zzlives', need: 10, lives: 3 })
    strike(s, clean, { ability: 'zzlives', need: 10, lives: 3 })
    expect(seen).toEqual([[3, 0, false], [3, 1, false], [3, 2, true]])
  })
  it('armed toggles reach only a decision module, and never on a re-ask', () => {
    const seen = []
    registerAbilityForTest('zznodec', { id: 'zznodec', icon: '🎲', onStrike: (s, res, hit) => { seen.push(!!hit.armed) } })
    raidStep(newFight(), qs[0], clean, { ...base, ability: 'zznodec', armed: { swing: true } })
    expect(seen).toEqual([false])
    const dec = []
    registerAbilityForTest('zzdec', { id: 'zzdec', icon: '🎲', decision: true, onStrike: (s, res, hit) => { dec.push(!!hit.armed) } })
    raidStep(newFight(), qs[0], clean, { ...base, ability: 'zzdec', armed: { swing: true } })
    raidStep(newFight(), { ...qs[0], _attack: true }, clean, { ...base, ability: 'zzdec', armed: { swing: true } })
    raidStep(newFight(), { ...qs[0], _inserted: 'minion' }, clean, { ...base, ability: 'zzdec', armed: { swing: true } })
    expect(dec).toEqual([true, false, false])
  })
})
