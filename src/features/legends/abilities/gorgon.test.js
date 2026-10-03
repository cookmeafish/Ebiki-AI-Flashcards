// Gorgon, Mirror Shield (design-v2.md section 17).
import { describe, it, expect } from 'vitest'
import { newFight, strike, DAMAGE } from '../fight'
import { simulateRaid, ALL_CLEAN } from './_sim'
import mod from './gorgon'

const K = mod.K
const hit = (verdict, mode = 'typed', extra = {}) => ({ verdict, mode, ...extra })
const run = (hits, opts = { ability: mod.id }) => hits.reduce((s, h) => strike(s, h, opts), newFight())
const C = hit('clean', 'choice')
const T = hit('glancing') // a right typed answer with no critical in the way

describe(`raid ability: gorgon (${mod.id})`, () => {
  it('every 4th raid question is her gaze: right typed reflects 3', () => {
    const s = run([C, C, C, T])
    expect(s.last.fx).toBe('reflect')
    expect(s.damage).toBe(3 * DAMAGE.choice + DAMAGE.glancing + K.reflect)
    expect(s.ab.charge).toBe(0)
    expect(run([C, C, C]).last.fx).toBe('charge')
  })
  it('a right choice reflects 2', () => {
    expect(run([C, C, C, C]).damage).toBe(4 * DAMAGE.choice + K.half)
  })
  it('a missed gaze is a plain miss and the gaze recharges', () => {
    const s = run([C, C, C, hit('miss')])
    expect(s.last.fx).toBe('stoned')
    expect(s.livesLost).toBe(1)
    expect(s.damage).toBe(3 * DAMAGE.choice)
    expect(s.ab.charge).toBe(0)
    // nothing is taken off the next right answer
    expect(run([C, C, C, hit('miss'), C]).damage).toBe(4 * DAMAGE.choice)
  })
  it('the cadence counts raid questions only (attacks and inserted questions neither charge nor gaze)', () => {
    const s = run([C, hit('clean', 'typed', { attack: true }), hit('miss', 'typed', { attack: true }), hit('clean', 'typed', { inserted: 'minion' })])
    expect(s.ab.charge).toBe(1)
  })
  it('phase 3 gazes every 3rd question', () => {
    expect(run([C, C, C], { ability: mod.id, phase: 3 }).last.fx).toBe('reflect')
  })
  it('the gaze question is tagged and hinted before the answer, typed 3 / choice 2', () => {
    const q = { _cardId: 1 }
    const s = run([C, C, C])
    expect(mod.tag(s, q, { phase: 1 })).toMatchObject({ key: 'lg_tag_mirror' })
    expect(mod.tag(s, { ...q, _attack: true }, { phase: 1 })).toBeNull()
    expect(mod.tag(run([C]), q, { phase: 1 })).toBeNull()
    expect(mod.tag(run([C, C]), q, { phase: 3 })).toBeTruthy()
    expect(mod.hint(s, q, 'typed', { phase: 1 }).vars.n).toBe(K.reflect)
    expect(mod.hint(s, q, 'choice', { phase: 1 }).vars.n).toBe(K.half)
    expect(mod.hud(s, { phase: 1 })[0]).toMatchObject({ n: 3, max: 4, ready: true })
  })
  it('F1: an all-right raid wins', () => {
    for (const n of [5, 8, 15]) expect(simulateRaid(mod.id, { n, answer: ALL_CLEAN }).outcome).toBe('won')
  })
})
