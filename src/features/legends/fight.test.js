// The fight rules: damage, attacks, combos, shields, phases, and that the OUTCOME decides a fight's pass.
import { describe, it, expect } from 'vitest'
import { newFight, strike, fightOutcome, phaseOf, weakTo, effortOf, raidRating, attackSlot, attackGapFor, canAttack, DAMAGE, ATTACK_LIVES, MAX_ATTACKS, COMBO_EVERY, ABILITIES } from './fight'
import { bossOdds } from './BossArena'
import { applyNodeResult, applyLegendaryResult, fightStars, itemTier, areaCodex, earnHelper, spendHelper, helperCount, HELPERS_MAX, logDay, JOURNEY_DAYS, parseAreaDetail, createMap, applyAreaDetail } from './map'

const hit = (verdict, mode = 'typed', extra = {}) => ({ verdict, mode, ...extra })
const run = (hits, opts) => hits.reduce((s, h) => strike(s, h, opts), newFight())

describe('strikes', () => {
  it('pays a clean power strike 2, a glancing one or a safe choice 1, a miss nothing', () => {
    expect(run([hit('clean')]).damage).toBe(DAMAGE.clean)
    expect(run([hit('glancing')]).damage).toBe(1)
    expect(run([hit('clean', 'choice')]).damage).toBe(1)
    const m = run([hit('miss')])
    expect(m.damage).toBe(0)
    expect(m.livesLost).toBe(1)
  })
  it('makes every third clean strike in a row a critical, and anything else breaks the combo', () => {
    const three = run([hit('clean'), hit('clean'), hit('clean')])
    expect(three.damage).toBe(3 * DAMAGE.clean + DAMAGE.crit)
    expect(three.crits).toBe(1)
    expect(COMBO_EVERY).toBe(3)
    const broken = run([hit('clean'), hit('clean'), hit('glancing'), hit('clean')])
    expect(broken.crits).toBe(0)
    const safe = run([hit('clean'), hit('clean'), hit('clean', 'choice'), hit('clean')])
    expect(safe.crits).toBe(0)
  })
  it('adds the weakness bonus to a right answer only', () => {
    expect(run([hit('glancing', 'typed', { weak: true })]).damage).toBe(2)
    expect(run([hit('miss', 'typed', { weak: true })]).damage).toBe(0)
  })
  it('lets an attack counter when blocked and cost two lives when missed', () => {
    const blocked = run([hit('clean', 'typed', { attack: true })])
    expect(blocked.damage).toBe(DAMAGE.counter)
    expect(blocked.blocked).toBe(1)
    expect(blocked.answers).toBe(0) // an attack is not one of the fight's questions
    const missed = run([hit('miss', 'typed', { attack: true })])
    expect(missed.livesLost).toBe(ATTACK_LIVES)
  })
  it('lets a shield absorb one life, once', () => {
    const s = run([hit('miss'), hit('miss')], { shield: true })
    expect(s.livesLost).toBe(1)
    expect(s.shieldUsed).toBe(true)
  })
  it('caps the attacks of one fight', () => {
    let s = newFight()
    for (let i = 0; i < MAX_ATTACKS; i++) s = { ...s, attacks: s.attacks + 1 }
    expect(canAttack(s)).toBe(false)
    expect(attackSlot(4, 20)).toBe(8)
    expect(attackSlot(18, 20)).toBe(20)
  })
})

describe('the end of a fight', () => {
  it('always ends in a win when the questions run out with lives left (so a win is never a fail)', () => {
    for (const total of [5, 10, 20]) {
      const odds = bossOdds(total)
      // Every mix of misses the lives allow: the rest answered as the weakest right answer (a safe strike).
      for (let misses = 0; misses <= odds.allowed; misses++) {
        const hits = [...Array(misses).fill(hit('miss')), ...Array(total - misses).fill(hit('clean', 'choice'))]
        const s = run(hits)
        expect(fightOutcome(s, odds)).toBe('won')
      }
    }
  })
  it('ends in a loss at the last life, and the outcome decides the stars', () => {
    const odds = bossOdds(20)
    const s = run(Array(odds.lives).fill(hit('miss')))
    expect(fightOutcome(s, odds)).toBe('lost')
    expect(fightStars(0.95, 'boss', 'lost')).toBe(0)
    expect(fightStars(0.5, 'boss', 'won')).toBe(1)
    expect(fightStars(0.96, 'boss', 'won')).toBe(3)
    expect(fightStars(0.75, 'boss')).toBe(1) // no outcome: the ratio decides (older callers)
  })
  it('enrages a boss at half health and gives a raid boss three phases', () => {
    expect(phaseOf(10, 14)).toBe(1)
    expect(phaseOf(7, 14)).toBe(2)
    expect(phaseOf(20, 21, 3)).toBe(1)
    expect(phaseOf(14, 21, 3)).toBe(2)
    expect(phaseOf(5, 21, 3)).toBe(3)
  })
})

describe('boss results on the map', () => {
  const detail = parseAreaDetail({
    items: [1, 2, 3, 4, 5].map((i) => ({ kind: i === 5 ? 'rule' : 'term', front: `w${i}`, back: `m${i}` })),
    nodes: [{ kind: 'learn', items: [1, 2] }, { kind: 'learn', items: [3] }, { kind: 'rule', items: [4, 5] }],
  }, (s) => s, { areaId: 'a' })
  const base = applyAreaDetail(createMap({ modeId: 1, subject: { name: 'x' }, plan: [{ title: 'A' }, { title: 'B' }] }), createMap({ modeId: 1, subject: { name: 'x' }, plan: [{ title: 'A' }, { title: 'B' }] }).areas[0].id, detail)
  const area = base.areas[0]
  const open = (m) => ({ ...m, areas: m.areas.map((a, i) => (i ? a : { ...a, nodes: a.nodes.map((n) => ({ ...n, status: n.kind === 'boss' ? 'open' : 'done' })) })) })
  const boss = area.nodes.find((n) => n.kind === 'boss')

  it('passes a won fight and fails a lost one whatever the ratio', () => {
    const won = applyNodeResult(open(base), area.id, boss.id, { total: 10, correct: 6, outcome: 'won', items: [] })
    expect(won.passed).toBe(true)
    expect(won.areaDone).toBe(true)
    const lost = applyNodeResult(open(base), area.id, boss.id, { total: 10, correct: 9, outcome: 'lost', items: [] })
    expect(lost.passed).toBe(false)
  })
  it('remembers a lost fight\'s missed items (the nemesis) and forgets them after a win', () => {
    const items = [{ itemId: area.items[0].id, correct: false }, { itemId: area.items[1].id, correct: true }]
    const lost = applyNodeResult(open(base), area.id, boss.id, { total: 5, correct: 1, outcome: 'lost', items })
    expect(lost.map.areas[0].nemesis.itemIds).toEqual([area.items[0].id])
    const again = applyNodeResult(open(lost.map), area.id, boss.id, { total: 5, correct: 5, outcome: 'won', items: [] })
    expect(again.map.areas[0].nemesis).toBeNull()
  })
  it('counts right answers in a fight toward gold', () => {
    const items = [0, 1, 2].map(() => ({ itemId: area.items[0].id, correct: true }))
    const r = applyNodeResult(open(base), area.id, boss.id, { total: 3, correct: 3, outcome: 'won', items })
    const it = r.map.areas[0].items[0]
    expect(it.bossRight).toBe(3)
    expect(itemTier(it)).toBe('gold')
  })
  it('counts a Hard answer in a fight as right but not toward gold', () => {
    const items = [0, 1, 2].map(() => ({ itemId: area.items[0].id, correct: true, grade: 'hard' }))
    const r = applyNodeResult(open(base), area.id, boss.id, { total: 3, correct: 3, outcome: 'won', items })
    const it = r.map.areas[0].items[0]
    expect(it).toMatchObject({ seen: 3, right: 3, bossRight: 0 })
    expect(itemTier(it)).toBe('silver')
    const solid = applyNodeResult(open(base), area.id, boss.id, { total: 3, correct: 3, outcome: 'won', items: items.map((x, i) => ({ ...x, grade: i ? 'hard' : 'good' })) })
    expect(solid.map.areas[0].items[0].bossRight).toBe(1)
    expect(itemTier(solid.map.areas[0].items[0])).toBe('gold')
    const missed = applyNodeResult(open(base), area.id, boss.id, { total: 1, correct: 0, outcome: 'lost', items: [{ itemId: area.items[0].id, correct: false, grade: 'again' }] })
    expect(missed.map.areas[0].items[0]).toMatchObject({ seen: 1, right: 0, bossRight: 0 })
  })
  it('lets a Legendary run count for the codex even when lost', () => {
    const done = { ...base, areas: base.areas.map((a, i) => (i ? a : { ...a, status: 'done' })) }
    const r = applyLegendaryResult(done, area.id, { total: 20, correct: 5, outcome: 'lost', items: [{ itemId: area.items[2].id, correct: true }] })
    expect(r.passed).toBe(false)
    expect(r.map.areas[0].items[2].right).toBe(1)
  })
  it('earns a scroll for a first flawless level and a shield for a flawless Weak spots', () => {
    const lvl = base.areas[0].nodes[0]
    const r = applyNodeResult(base, area.id, lvl.id, { total: 4, correct: 4, items: [] })
    expect(r.flawless).toBe(true)
    expect(r.helper).toBe('scroll')
    expect(r.map.helpers.scroll).toBe(1)
    const again = applyNodeResult(r.map, area.id, lvl.id, { total: 4, correct: 4, items: [] })
    expect(again.helper).toBe('') // only the first flawless run pays
    const weak = base.areas[0].nodes.find((n) => n.kind === 'weak')
    const w = applyNodeResult(open(base), area.id, weak.id, { total: 6, correct: 6, items: [] })
    expect(w.helper).toBe('shield')
  })
})

describe('codex, helpers, journey', () => {
  it('tiers an item from how it is answered, and it can fade', () => {
    expect(itemTier({})).toBe('new')
    expect(itemTier({ seen: 2, right: 1 })).toBe('bronze')
    expect(itemTier({ seen: 4, right: 3 })).toBe('silver')
    expect(itemTier({ seen: 4, right: 4, bossRight: 1 })).toBe('gold')
    expect(itemTier({ seen: 9, right: 4, bossRight: 1 })).toBe('bronze') // missed a lot since: fades
    expect(areaCodex({ items: [{ seen: 3, right: 3, bossRight: 1 }] }).complete).toBe(true)
  })
  it('holds at most two helpers and spends them one by one', () => {
    let m = { areas: [] }
    for (let i = 0; i < 5; i++) m = earnHelper(m, i % 2 ? 'shield' : 'scroll')
    expect(helperCount(m)).toBe(HELPERS_MAX)
    m = spendHelper(m, 'scroll')
    expect(m.helpers.scroll).toBe(0)
    expect(spendHelper(m, 'scroll')).toBe(m)
  })
  it('logs steps per day and keeps a bounded window', () => {
    let m = { areas: [] }
    m = logDay(logDay(m, '2026-01-01'), '2026-01-01')
    expect(m.days['2026-01-01']).toBe(2)
    for (let i = 0; i < JOURNEY_DAYS + 5; i++) m = logDay(m, `2027-${String(1 + Math.floor(i / 28)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}`)
    expect(Object.keys(m.days).length).toBe(JOURNEY_DAYS)
  })
})

describe('area extras and adventure steps', () => {
  it('reads the story, the passport lines, the chest phrase and one adventure step with a goal', () => {
    const d = parseAreaDetail({
      items: [1, 2, 3, 4].map((i) => ({ front: `w${i}`, back: `m${i}` })),
      nodes: [{ kind: 'learn', items: [1, 2] }, { kind: 'learn', items: [3] }, { kind: 'learn', items: [4] },
        { kind: 'adventure', title: 'Train', goal: 'Buy a ticket to Sevilla', items: [1] }, { kind: 'adventure', title: 'Again', goal: 'x' }, { kind: 'adventure', title: 'No goal' }],
      story: ['Line one', 'Line two', 'Line three', 'Line four'], canDo: 'Order food\nAsk the price', bonus: { front: 'Qué onda', back: 'What is up' },
    }, (s) => s, { areaId: 'a' })
    const adv = d.nodes.filter((n) => n.kind === 'adventure')
    expect(adv.length).toBe(1)
    expect(adv[0].goal).toBe('Buy a ticket to Sevilla')
    expect(adv[0].optional).toBe(true)
    expect(d.story.length).toBe(3)
    expect(d.canDo).toEqual(['Order food', 'Ask the price'])
    expect(d.bonus.front).toBe('Qué onda')
  })
})

describe('effort and raid ratings', () => {
  it('scores effort from the kind of answers', () => {
    expect(effortOf({ clean: 10 })).toBe(1.3)
    expect(effortOf({ choice: 10 })).toBe(0.8)
    expect(effortOf({ misses: 10 })).toBe(0.5)
    expect(effortOf({})).toBe(1)
  })
  it('rates a raid card from its first answer by the shared rule (Easy only clean, typed, on a mature card)', () => {
    expect(raidRating(hit('clean')).ease).toBe(3)
    expect(raidRating(hit('clean'), { interval: 20 }).ease).toBe(3)
    expect(raidRating(hit('clean'), { interval: 21 })).toEqual({ ease: 4, rating: 'easy' })
    expect(raidRating(hit('clean', 'choice'), { interval: 400 }).ease).toBe(3) // a choice is never above Good
    expect(raidRating(hit('glancing'), { interval: 400 }).ease).toBe(2)
    expect(raidRating(hit('miss'), { interval: 400 }).ease).toBe(1)
    expect(raidRating(null).ease).toBe(1)
  })
  it('picks rule items first as the boss weakness', () => {
    expect(weakTo({ items: [{ id: 'a', kind: 'term' }, { id: 'b', kind: 'rule' }, { id: 'c', kind: 'term' }] })).toEqual(['b', 'a'])
  })
})

describe('map art comes from the shipped drawings', () => {
  it('gives every planned area its own existing motif, even when the model repeats one or invents one', async () => {
    const { parseMapPlan, MOTIFS } = await import('./map')
    const plan = parseMapPlan({ areas: ['A', 'B', 'C', 'D'].map((t, i) => ({ title: t, motif: i < 3 ? 'forest' : 'spaceship' })) }, (s) => s)
    const motifs = plan.map((a) => a.motif)
    expect(motifs[0]).toBe('forest')
    expect(new Set(motifs).size).toBe(motifs.length)
    for (const m of motifs) expect(MOTIFS).toContain(m)
  })
})

describe('raid boss abilities', () => {
  it('every raid motif has an ability, an entrance of its own, and every ability has its texts', async () => {
    const { RAID_MOTIFS, RAID_ABILITY } = await import('./raid')
    const { ENTRANCES } = await import('./BossArena')
    const { MOTIFS } = await import('./map')
    const en = (await import('../../i18n/locales/en.js')).default
    for (const m of RAID_MOTIFS) {
      expect(ABILITIES).toContain(RAID_ABILITY[m])
      expect(ENTRANCES[m], m).toBeTruthy()
    }
    const names = [...MOTIFS, ...RAID_MOTIFS].map((m) => ENTRANCES[m].name)
    expect(new Set(names).size).toBe(names.length)
    for (const a of ABILITIES) for (const k of [`lg_ability_${a}`, `lg_abilityDesc_${a}`]) expect(en[k], k).toBeTruthy()
  })
})
