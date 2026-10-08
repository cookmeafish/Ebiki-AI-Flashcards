// FOCUS (a raid power) and the abilities: a glancing answer under Focus "hits like a clean one", so every ability
// mechanic that pays a clean typed answer (Titan's plates, Moonmaw's moons, Cerberus's iron head, the Chimera's lion
// boon) must count it too. Before, the base damage and combo treated it as clean while these modules did not.
import { describe, it, expect } from 'vitest'
import { newFight, strike } from '../fight'
import titan from './titan'
import moonmaw from './moonmaw'
import cerberus from './cerberus'
import chimera from './chimera'

const glance = { verdict: 'glancing', mode: 'typed' }
const run = (ability, hits, extra = {}) => hits.reduce((s, h) => strike(s, h, { ability, need: 500, lives: 9, ...extra }), newFight())

describe('Focus: a focused glancing answer counts as clean for the abilities', () => {
  it('Titan: it cracks a plate (and without Focus it still does not)', () => {
    expect(run('plates', [glance]).ab.plates).toBe(titan.K.plates)
    expect(run('plates', [glance], { focus: true }).ab.plates).toBe(titan.K.plates - 1)
  })
  it('Moonmaw: it charges the moons like a clean answer', () => {
    const n = moonmaw.K.every
    expect(run('moons', Array(n).fill(glance)).ab.cleans).toBe(0)
    const s = run('moons', Array(n).fill(glance), { focus: true })
    expect(s.ab.cleans).toBe(n)
    expect(s.ab.orbit.length).toBe(1)
  })
  it('Cerberus: it chains the Iron head', () => {
    expect(run('shackles', [glance]).ab.iron).toBe(false)
    expect(run('shackles', [glance], { focus: true }).ab.iron).toBe(true)
  })
  it('Chimera: the Lion boon pays it', () => {
    const third = 40
    const dayAb = { hurt: [third, 0, 0] } // the Lion head felled earlier today: its boon is on
    const opts = { need: 120, lives: 9, bar: { total: 120, before: third, phases: 3 }, dayAb }
    const plain = strike(newFight(), glance, { ability: 'threeheads', ...opts })
    const focused = strike(newFight(), glance, { ability: 'threeheads', ...opts, focus: true })
    expect(focused.damage - plain.damage).toBe(1 + chimera.K.lion) // clean (2) vs glancing (1), plus the boon
  })
})
