// THE TUNING RESOLVER (raidProfiles.js raidProfile) and the engine reading it: every raid number is a variable a
// variant (a nightmare boss...) can change, and the normal numbers stay exactly what they were.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { RAID_PROFILES, RAID_VARIANTS, DEFAULT_PROFILE, raidProfile, raidVariant, applyLayer } from './raidProfiles'
import { FIGHT_RULES, rulesOf, abilityK } from './abilities/_rules'
import { newFight, strike, tuneFight, canAttack, attackGapFor, refundFor } from './fight'
import { RAID_ORDER, RAID_ROSTER, raidBossIndex, bossHp, bossHearts, bossHeal, shapeRaid, regenSiege, applyRaidAttempt, raidToday, testRaidState } from './raid'
import { abilityForMotif } from './abilities'
import { simulateRaid, ALL_CLEAN } from './abilities/_sim'

const CLEAN = { verdict: 'clean', mode: 'typed' }
const MISS = { verdict: 'miss', mode: 'typed' }

describe('raidProfile layers', () => {
  it('normal = the base profile, the default rules and the ability K, unchanged', () => {
    for (const m of RAID_ORDER) {
      const p = raidProfile(m)
      const base = RAID_PROFILES[m]
      expect(p).toMatchObject({ motif: m, variant: 'normal', hp: base.hp, hearts: base.hearts, heal: base.heal })
      expect(p.rules).toEqual(FIGHT_RULES)
      expect(p.k).toEqual(abilityForMotif(m).K)
      expect(p.ability).toBe(abilityForMotif(m).id)
      expect(raidProfile(m, 'normal')).toEqual(p)
    }
    expect(raidProfile('no-such-boss')).toMatchObject(DEFAULT_PROFILE)
  })
  it('an unknown variant reads as normal', () => {
    expect(raidVariant('nope')).toBe('normal')
    expect(raidVariant(undefined)).toBe('normal')
    expect(raidProfile('titan', 'nope')).toEqual(raidProfile('titan'))
  })
  it('the global nightmare variant multiplies, adds and sets', () => {
    const n = raidProfile('titan'), x = raidProfile('titan', 'nightmare')
    const V = RAID_VARIANTS.nightmare
    expect(x.variant).toBe('nightmare')
    expect(x.hp).toBe(Math.round(n.hp * V.hp.mul))
    expect(x.heal).toBe(Math.round(n.heal * V.heal.mul))
    expect(x.hearts).toBe(n.hearts + V.hearts.add)
    expect(x.rules.comboEvery).toBe(V.rules.comboEvery)
    expect(x.rules.damage).toEqual(FIGHT_RULES.damage) // untouched rules keep the defaults
    expect(x.k).toEqual(n.k) // titan has no per-boss nightmare override
  })
  it('a per-boss variant override goes on top of the global one', () => {
    expect(raidProfile('hydra').k.grow).toBe(abilityForMotif('hydra').K.grow)
    expect(raidProfile('hydra', 'nightmare').k.grow).toBe(3)
    expect(raidProfile('hydra', 'nightmare').hp).toBe(Math.round(RAID_PROFILES.hydra.hp * RAID_VARIANTS.nightmare.hp.mul))
  })
  it('applyLayer: set, mul, add, nested; integers stay integers; floors hold', () => {
    const base = { a: 3, b: 0.5, c: { d: 2 } }
    expect(applyLayer(base, { a: { mul: 1.5 }, b: { mul: 1.5 }, c: { d: { add: 1 } } })).toEqual({ a: 5, b: 0.75, c: { d: 3 } })
    expect(applyLayer(base, { a: 9 })).toEqual({ ...base, a: 9 })
    expect(base).toEqual({ a: 3, b: 0.5, c: { d: 2 } }) // pure
    RAID_VARIANTS.__floorTest = { hearts: { add: -99 }, hp: 0 }
    try {
      expect(raidProfile('chronos', '__floorTest')).toMatchObject({ hearts: 1, hp: 1 })
    } finally { delete RAID_VARIANTS.__floorTest }
  })
})

describe('the engine reads the resolved numbers', () => {
  it('without a tune the defaults apply (a Legends boss)', () => {
    expect(rulesOf(newFight())).toBe(FIGHT_RULES)
    const s = strike(newFight(), CLEAN, { need: 50, lives: 3 })
    expect(s.damage).toBe(FIGHT_RULES.damage.clean)
    expect(newFight(raidProfile('chronos')).tune.rules).toEqual(FIGHT_RULES)
  })
  it('a rules override changes the fight: clean damage, attacks, attack gap, refunds', () => {
    const f = tuneFight(newFight(), { rules: { damage: { clean: 5 }, maxAttacks: 1, attackGap: 7 } })
    expect(strike(f, CLEAN, { need: 50, lives: 3 }).damage).toBe(5)
    expect(strike(f, { verdict: 'clean', mode: 'choice' }, { need: 50, lives: 3 }).damage).toBe(FIGHT_RULES.damage.choice)
    expect(canAttack({ ...f, attacks: 1 })).toBe(false)
    expect(canAttack({ ...newFight(), attacks: 1 })).toBe(true)
    expect(attackGapFor('', f)).toBe(7)
    expect(refundFor({ to: 'clean' }, {}, rulesOf(f)).damage).toBe(5)
  })
  it('a K override changes an ability: hydra grows what the profile says', () => {
    const opts = { ability: 'heads', need: 99, lives: 9 }
    const normal = strike(newFight(raidProfile('hydra')), MISS, opts)
    const night = strike(newFight(raidProfile('hydra', 'nightmare')), MISS, opts)
    const K = abilityForMotif('hydra').K
    expect(normal.ab.heads).toBe(K.base + K.grow)
    expect(night.ab.heads).toBe(K.base + 3)
    expect(night.last.fxVars).toEqual({ n: 3 })
    expect(abilityK(abilityForMotif('hydra'), night)).toMatchObject({ grow: 3 })
    // A K resolved for another ability never leaks into this one.
    expect(abilityK(abilityForMotif('titan'), night)).toEqual(abilityForMotif('titan').K)
  })
  it('the simulator with the normal profile plays exactly like the defaults', () => {
    for (const m of ['hydra', 'chronos', 'void']) {
      const ab = abilityForMotif(m).id
      const a = simulateRaid(ab, { n: 12, answer: ALL_CLEAN })
      const b = simulateRaid(ab, { n: 12, answer: ALL_CLEAN, profile: raidProfile(m) })
      expect(b.state.damage).toBe(a.state.damage)
      expect(b.state.livesLost).toBe(a.state.livesLost)
      expect(b.asked).toBe(a.asked)
    }
  })
})

describe('the siege and its variant', () => {
  const hydra = raidBossIndex('hydra')
  it('boss numbers come from the resolver, by variant', () => {
    expect(bossHp(hydra)).toBe(raidProfile('hydra').hp)
    expect(bossHp(hydra, 'nightmare')).toBe(raidProfile('hydra', 'nightmare').hp)
    expect(bossHearts(hydra, 'nightmare')).toBe(raidProfile('hydra', 'nightmare').hearts)
    expect(bossHeal(hydra, 'nightmare')).toBe(raidProfile('hydra', 'nightmare').heal)
  })
  it('a stored variant survives shaping, heals and rallies by its own numbers; absent = normal', () => {
    const st = testRaidState('hydra', '2026-10-01', 10, 'nightmare')
    expect(st.siege.variant).toBe('nightmare')
    expect(st.siege.hp).toBe(raidProfile('hydra', 'nightmare').hp)
    const shaped = shapeRaid({ ...st, siege: { ...st.siege, damage: 40 } })
    expect(shaped.siege.variant).toBe('nightmare')
    expect(regenSiege(shaped.siege, '2026-10-02').damage).toBe(40 - raidProfile('hydra', 'nightmare').heal)
    const r = applyRaidAttempt(raidToday(shaped, '2026-10-01', 10), '2026-10-01', 10, null, { livesLost: 99 })
    expect(r.rallied).toBe(Math.floor(10 * raidProfile('hydra', 'nightmare').rules.rallyShare))
    expect(r.state.siege.variant).toBe('nightmare')
    expect(shapeRaid(testRaidState('hydra', '2026-10-01', 10)).siege.variant).toBeUndefined()
    expect(RAID_ROSTER[shaped.boss]).toBe('hydra')
  })
})

describe('ability hooks never read the module K directly', () => {
  it('every abilities/<motif>.js reads its tuning through tuned(K, ctx)', () => {
    const dir = path.join(__dirname, 'abilities')
    const files = fs.readdirSync(dir).filter((f) => /^[a-z]+\.js$/.test(f) && f !== 'index.js')
    expect(files.length).toBeGreaterThan(20)
    for (const f of files) {
      const lines = fs.readFileSync(path.join(dir, f), 'utf8').split(/\r?\n/)
      lines.forEach((raw, i) => {
        if (/tuning-ok/.test(raw) || /^\s*const K = /.test(raw)) return
        const code = raw.replace(/\/\/.*$/, '').replace(/'[^']*'|`[^`]*`/g, "''")
        expect(/(^|[^\w.$])K\s*[.[]/.test(code), `${f}:${i + 1}: ${raw.trim()}`).toBe(false)
      })
    }
  })
})
