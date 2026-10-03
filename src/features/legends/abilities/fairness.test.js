// FAIRNESS, for EVERY registered raid ability (abilities/<motif>.js), through whole simulated raids of 5 to 15 cards
// (_sim.js runs the same steps as RaidRun):
//   F1 an all-right run (clean typed answers) always wins, with the ability's buttons used greedily or never, and so
//      does an all-right run that answers by CHOICES while phase 1 allows them, then typed (choicesThenTyped);
//   F2 an all-wrong run never wins (buttons too), its attacks and inserted re-asks missed as well (HARSH);
//   F3 a right answer never costs a life, and no answer costs more than 2;
//   F4 a boss heal never goes below what this attempt started with, and never crosses a phase line backwards;
//   and choices are never worth less than in a plain fight (a right answer is never thrown away).
// Plus the ATTENTION BUDGET (design v2.1, 1.1): at most DECISION_MAX modules declare `decision: true`, only they have
// buttons and never on a re-ask; a hint is at most HINT_MAX_WORDS English words (hintDiet), a tag chip at most
// TAG_MAX_WORDS (tagDiet); only IDLE_MOTIFS keep a persistent idle reaction; an attempt never gets more than
// MAX_INSERTED ability-inserted questions.
// A known failure is declared IN THE MODULE: `knownUnfair: { <check>: 'TODO(<motif>): why' }` (checks: allRight,
// allWrong, lives, heals, choices, choicesThenTyped, hintDiet, tagDiet) turns that check into it.skip with the reason
// in the title; the boss agent fixes the ability and drops the field. FAIR_ALL=1 npx vitest run src/features/legends/abilities/fairness.test.js runs the
// known cases too.
import { describe, it, expect } from 'vitest'
import { ABILITY_BY_MOTIF } from './index'
import { simulateRaid, ALL_CLEAN, ALL_MISS, ALL_MISS_HARSH, CHOICE_HEAVY, CHOICES_THEN_TYPED, mixed } from './_sim'
import { RAID } from '../raid'
import { abilityState, barPhase } from '../fight'
import { MAX_INSERTED, DECISION_MAX, HINT_MAX_WORDS, TAG_MAX_WORDS, IDLE_MOTIFS } from './_rules'
import en from '../../../i18n/locales/en.js'

const SIZES = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
const POLICIES = ['never', 'greedy']
// Wounded bosses too: a later attempt starts with the day's earlier damage dealt (a third, then most of a phase).
const WOUNDS = [0, 0.34, 0.5]

const plain = (n, answer, dayBefore = 0) => simulateRaid('', { n, answer, dayBefore })

// What the arena shows mid-fight: real simulated states (several patterns and sizes) with the ctx RaidRun hands to
// hint / tag / actions.
const NORMAL_Q = { kind: 'typed', prompt: 'q', _cardId: 1000 }
const ATTACK_Q = { ...NORMAL_Q, _attack: true }
const INSERTED_Q = { ...NORMAL_Q, _inserted: 'minion' }
const LAST_STAND_Q = { ...NORMAL_Q, _inserted: 'lastStand', _lastStand: true }
function visibleStates(a) {
  const out = []
  for (const n of [5, 8, 15]) for (const answer of [ALL_CLEAN, mixed(0.3), mixed(0.5), CHOICE_HEAVY]) {
    const r = simulateRaid(a.id, { n, answer, press: 'greedy' })
    const bar = { total: r.hp, before: 0, phases: RAID.phases }
    for (const e of r.log) {
      const s0 = e.after
      const ctx = { phase: barPhase(bar, s0.damage), need: r.need, lives: r.lives, livesLeft: r.lives - s0.livesLost, damage: s0.damage, bar, dayAb: null, K: a.K || {} }
      out.push({ s: { ...s0, ab: abilityState(s0, a, ctx) }, ctx })
    }
  }
  return out
}
// The English text of a key with its vars ({n} filled), or null while the key is not in en.js yet (the i18n tests
// report missing keys on their own).
const english = (key, vars = {}) => (typeof en[key] === 'string' ? en[key].replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] != null ? String(vars[k]) : m)) : null)
const words = (text) => String(text).split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length

for (const [motif, a] of Object.entries(ABILITY_BY_MOTIF)) {
  const known = a.knownUnfair || {}
  const check = (name) => (!process.env.FAIR_ALL && known[name] ? it.skip : it)
  describe(`fairness: ${motif} (${a.id})${Object.keys(known).length ? ` · KNOWN: ${Object.values(known).join(' ')}` : ''}`, () => {
    check('allRight')('F1 an all-right run always wins, buttons used or not, also against a wounded boss', () => {
      for (const n of SIZES) for (const press of POLICIES) for (const w of WOUNDS) {
        const hp = simulateRaid('', { n }).hp
        const r = simulateRaid(a.id, { n, answer: ALL_CLEAN, press, dayBefore: Math.floor(hp * w) })
        expect(r.outcome, `n=${n} press=${press} wound=${w}`).toBe('won')
        expect(r.state.livesLost, `n=${n} press=${press}`).toBe(0)
      }
    })
    check('choicesThenTyped')('F1 choices while allowed, then typed, all right: always wins, also against a wounded boss', () => {
      for (const n of SIZES) for (const press of POLICIES) for (const w of WOUNDS) {
        const hp = simulateRaid('', { n }).hp
        const r = simulateRaid(a.id, { n, answer: CHOICES_THEN_TYPED, press, dayBefore: Math.floor(hp * w) })
        expect(r.outcome, `n=${n} press=${press} wound=${w}`).toBe('won')
        expect(r.state.livesLost, `n=${n} press=${press}`).toBe(0)
      }
    })
    check('allWrong')('F2 an all-wrong run never wins, buttons used or not, its attacks and inserted re-asks missed too', () => {
      for (const n of SIZES) for (const press of POLICIES) {
        const r = simulateRaid(a.id, { n, answer: ALL_MISS_HARSH, press })
        expect(r.outcome, `n=${n} press=${press}`).not.toBe('won')
        expect(r.state.damage, `n=${n} press=${press}`).toBeLessThan(r.need)
        // HARSH: every answer in the run, re-asks included, was a miss.
        for (const e of r.log) expect(e.hit.verdict, `n=${n} ${press}: ${e.q._attack ? 'attack' : e.q._inserted || 'question'}`).toBe('miss')
      }
    })
    check('lives')('F3 a right answer never costs a life; no answer costs more than 2', () => {
      for (const n of SIZES) for (const press of POLICIES) for (const share of [0.15, 0.3, 0.5]) {
        const r = simulateRaid(a.id, { n, answer: mixed(share), press })
        for (const e of r.log) {
          const cost = e.after.livesLost - e.before.livesLost
          if (e.hit.verdict !== 'miss') expect(cost, `n=${n} ${press} ${share}: right answer #${e.after.n} cost ${cost}`).toBeLessThanOrEqual(0)
          expect(cost, `n=${n} ${press} ${share}: answer #${e.after.n}`).toBeLessThanOrEqual(2)
        }
      }
    })
    check('heals')('F4 a heal never goes below the attempt start nor back across a phase line', () => {
      for (const n of SIZES) for (const press of POLICIES) for (const share of [0.15, 0.3, 0.5, 0.8]) for (const w of WOUNDS) {
        const hp = simulateRaid('', { n }).hp
        const r = simulateRaid(a.id, { n, answer: mixed(share), press, dayBefore: Math.floor(hp * w) })
        for (const e of r.log) {
          expect(e.after.damage, `n=${n} ${press} ${share} w=${w}`).toBeGreaterThanOrEqual(0)
          expect(e.phaseAfter, `n=${n} ${press} ${share} w=${w}: phase went back`).toBeGreaterThanOrEqual(e.phaseBefore)
        }
      }
    })
    check('choices')('a right CHOICE is never worth less than in a plain fight', () => {
      for (const n of SIZES) {
        const base = plain(n, CHOICE_HEAVY)
        const r = simulateRaid(a.id, { n, answer: CHOICE_HEAVY })
        expect(r.state.damage, `n=${n}`).toBeGreaterThanOrEqual(Math.min(base.state.damage, r.need))
      }
    })
    it('a simulated raid always ends (no endless inserted questions)', () => {
      for (const n of SIZES) for (const share of [0, 0.3, 1]) {
        const r = simulateRaid(a.id, { n, answer: mixed(share), press: 'greedy' })
        expect(r.asked, `n=${n} ${share}`).toBeLessThan(n * 4 + 20)
      }
    })
    it(`an attempt never gets more than MAX_INSERTED (${MAX_INSERTED}) ability-inserted questions`, () => {
      for (const n of SIZES) for (const share of [0, 0.3, 0.5, 1]) for (const answer of [mixed(share), ALL_MISS_HARSH, ALL_CLEAN]) {
        const r = simulateRaid(a.id, { n, answer, press: 'greedy' })
        const ins = r.log.filter((e) => e.q._inserted || e.q._lastStand).length
        expect(ins, `n=${n} ${share}`).toBeLessThanOrEqual(MAX_INSERTED)
        expect(r.state.insertedN || 0).toBeLessThanOrEqual(MAX_INSERTED)
      }
    })
    it('buttons: only a decision module has them, never on an attack or an inserted question', () => {
      if (!a.decision) { expect(a.actions, `${motif} returns actions() without decision: true`).toBeUndefined(); return }
      for (const v of visibleStates(a)) {
        for (const q of [ATTACK_Q, INSERTED_Q, LAST_STAND_Q]) {
          const list = (a.actions(v.s, { ...v.ctx, mode: 'typed', q, armed: {} }) || []).filter(Boolean)
          expect(list, `${motif} shows buttons on ${q._attack ? 'an attack' : 'an inserted question'}`).toEqual([])
        }
      }
    })
    check('hintDiet')(`hint diet: a hint line is at most ${HINT_MAX_WORDS} English words`, () => {
      for (const v of visibleStates(a)) for (const q of [NORMAL_Q, ATTACK_Q, INSERTED_Q]) for (const mode of ['typed', 'choice']) {
        const h = a.hint?.(v.s, q, mode, { ...v.ctx, mode, q })
        if (!h) continue
        const text = english(h.key || `lg_hint_${a.id}`, h.vars)
        if (text != null) expect(words(text), `${motif}: "${text}"`).toBeLessThanOrEqual(HINT_MAX_WORDS)
      }
    })
    check('tagDiet')(`tag chip: at most ${TAG_MAX_WORDS} English words, only on the question it marks`, () => {
      if (!a.tag) return
      for (const v of visibleStates(a)) for (const q of [NORMAL_Q, ATTACK_Q, INSERTED_Q]) {
        const g = a.tag(v.s, q, { ...v.ctx, mode: 'typed', q })
        if (!g) continue
        expect(typeof g.key, `${motif} tag key`).toBe('string')
        const text = english(g.key, g.vars)
        if (text != null) expect(words(text), `${motif}: "${text}"`).toBeLessThanOrEqual(TAG_MAX_WORDS)
      }
    })
  })
}

describe('the attention budget, across all abilities', () => {
  it(`at most ${DECISION_MAX} modules declare decision: true`, () => {
    const list = Object.entries(ABILITY_BY_MOTIF).filter(([, a]) => a.decision).map(([m]) => m)
    expect(list.length, list.join(', ')).toBeLessThanOrEqual(DECISION_MAX)
  })
  it(`only ${IDLE_MOTIFS.join(' and ')} keep a persistent idle reaction`, () => {
    for (const [m, a] of Object.entries(ABILITY_BY_MOTIF)) if (a.idle) expect(IDLE_MOTIFS, `${m} declares idle()`).toContain(m)
  })
})

describe('the simulator', () => {
  it('plays a plain raid like the base rules: all clean wins, all missed loses at the third life', () => {
    expect(simulateRaid('', { n: 10, answer: ALL_CLEAN }).outcome).toBe('won')
    const lost = simulateRaid('', { n: 10, answer: ALL_MISS })
    expect(lost.outcome).toBe('lost')
    expect(lost.state.livesLost).toBeGreaterThanOrEqual(RAID.lives)
  })
})
