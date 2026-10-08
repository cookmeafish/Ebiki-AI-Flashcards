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
import { POWER_DEFAULTS, LOADOUT_MAX, POWER_WINDOW, SHARPEN_BONUS, FURY_MULT, MOMENTUM_CRIT_MULT, SIPHON_HEARTS, WIND_HEARTS, STEADFAST_HEARTS, SHIELD_HEARTS, BANDAGE_NIGHTS, powersOf, powerVars, procVars, shapeLoadout } from './powers'
import { raidStep, siegeRule, SIEGE_RULE } from './raid'

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

describe("the player's power numbers resolve like the boss numbers", () => {
  const typedQ = { kind: 'typed', prompt: 'p', accepted: ['a'], _cardId: 1 }
  const clean = { verdict: 'clean', mode: 'typed' }
  const opts = { need: 99, lives: 5, dayHp: 99 }
  const withVariant = (layer, fn) => {
    RAID_VARIANTS.__powTest = layer
    try { return fn() } finally { delete RAID_VARIANTS.__powTest }
  }
  it("the defaults are today's constants, on every boss in normal and on an unknown variant", () => {
    expect(POWER_DEFAULTS).toEqual({ loadoutMax: LOADOUT_MAX, window: POWER_WINDOW, sharpen: SHARPEN_BONUS, fury: FURY_MULT,
      momentumCrit: MOMENTUM_CRIT_MULT, siphon: SIPHON_HEARTS, wind: WIND_HEARTS, steadfast: STEADFAST_HEARTS, shield: SHIELD_HEARTS, bandage: BANDAGE_NIGHTS })
    expect(POWER_DEFAULTS).toMatchObject({ loadoutMax: 3, window: 3, sharpen: 2, fury: 2, momentumCrit: 2, siphon: 1, wind: 1, steadfast: 2, shield: 1, bandage: 1 })
    for (const m of RAID_ORDER) {
      expect(raidProfile(m).powers).toEqual(POWER_DEFAULTS)
      expect(raidProfile(m, 'no-such-variant').powers).toEqual(POWER_DEFAULTS)
    }
    expect(powersOf(newFight())).toBe(POWER_DEFAULTS)
    expect(powersOf(newFight(raidProfile('hydra')))).toEqual(POWER_DEFAULTS)
    expect(siegeRule()).toBe(SIEGE_RULE)
    expect(siegeRule(raidProfile('titan').powers)).toBe(SIEGE_RULE)
    expect(powerVars('fury', raidProfile('titan').powers)).toEqual(powerVars('fury'))
  })
  it('a variant layer changes what a power does in the fight and what its text says', () => {
    withVariant({ powers: { window: { add: -1 }, sharpen: { add: 1 }, fury: 3, momentumCrit: { add: 1 }, siphon: 2, steadfast: { add: -2 }, shield: 2, loadoutMax: 2 } }, () => {
      const P = raidProfile('titan', '__powTest').powers
      expect(P).toMatchObject({ window: 2, sharpen: 3, fury: 3, momentumCrit: 3, siphon: 2, steadfast: 0, shield: 2, loadoutMax: 2, wind: 1 })
      const normal = newFight(raidProfile('titan')), tuned = newFight(raidProfile('titan', '__powTest'))
      expect(powersOf(tuned)).toEqual(P)
      // Sharpen and Fury hit by the variant's numbers.
      expect(raidStep(normal, typedQ, clean, { ...opts, sharpen: true }).next.damage).toBe(2 + SHARPEN_BONUS)
      expect(raidStep(tuned, typedQ, clean, { ...opts, sharpen: true }).next.damage).toBe(2 + 3)
      expect(raidStep(normal, typedQ, clean, { ...opts, fury: true }).next.damage).toBe(2 * FURY_MULT)
      expect(raidStep(tuned, typedQ, clean, { ...opts, fury: true }).next.damage).toBe(2 * 3)
      expect(raidStep(tuned, typedQ, clean, { ...opts, fury: true }).boost.fury).toBe(3)
      // Momentum's crit and its refund.
      expect(strike(tuned, CLEAN, { need: 99, lives: 5, momentum: true }).damage).toBe(2 + FIGHT_RULES.damage.crit * 3)
      expect(refundFor({ to: 'clean' }, { boost: { momentum: true } }, rulesOf(tuned), powersOf(tuned)).damage).toBe(2 + 3)
      expect(refundFor({ to: 'clean' }, { boost: { momentum: true } }).damage).toBe(2 + FIGHT_RULES.damage.crit * MOMENTUM_CRIT_MULT)
      // Siphon gives back the variant's hearts; a Shield takes the variant's hearts.
      const hurt = { ...tuned, livesLost: 3 }
      expect(raidStep(hurt, typedQ, clean, { ...opts, siphon: true }).next.livesLost).toBe(1)
      expect(raidStep({ ...normal, livesLost: 3 }, typedQ, clean, { ...opts, siphon: true }).next.livesLost).toBe(3 - SIPHON_HEARTS)
      const atk = { kind: 'typed', prompt: 'p', accepted: ['a'], _cardId: 2, _attack: true }
      const miss = { verdict: 'miss', mode: 'typed' }
      expect(raidStep(tuned, atk, miss, { ...opts, shield: true }).next.livesLost).toBe(0) // the 2-heart attack, both taken
      expect(raidStep(normal, atk, miss, { ...opts, shield: true }).next.livesLost).toBe(FIGHT_RULES.attackLives - 1)
      // The text the screens show follows.
      expect(powerVars('focus', P)).toEqual({ n: 2 })
      expect(powerVars('fury', P)).toEqual({ n: 2, mult: 3 })
      expect(procVars('siphon', P)).toEqual({ n: 2 })
      expect(siegeRule(P)).toContain('last 2 questions')
      expect(siegeRule(P)).toContain('up to 2 to bring')
      expect(shapeLoadout(undefined, 26, P.loadoutMax)).toHaveLength(2)
    })
  })
  it('floors hold: a window lasts one question, Fury never shrinks a hit', () => {
    withVariant({ powers: { window: { add: -9 }, fury: 0, wind: -3 } }, () => {
      expect(raidProfile('chronos', '__powTest').powers).toMatchObject({ window: 1, fury: 1, wind: 0 })
    })
  })
})
