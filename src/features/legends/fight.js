// FIGHT RULES (pure, tested): damage, attacks, combos, rage phases and the end of a fight. Shared by the Legends
// boss, Legendary runs and raids. The screens (BossArena.jsx, NodeRun.jsx, RaidRun.jsx) only draw what this says.
//
// Health = the right answers a fight needs (bossOdds: PASS of the questions). Every answer is a strike:
//   power strike (typed): a CLEAN answer (the tested thing AND the rest right) deals 2, a GLANCING one (the tested
//   thing right, something else wrong) deals 1 and its slip comes back as an attack; a MISS deals nothing.
//   safe strike (choices): a right answer deals 1.
// A miss costs a life. A missed item comes back later as the boss's ATTACK (telegraphed): answered right it is
// blocked and counters for 1 damage, missed it costs 2 lives. Every third clean strike in a row is a critical (+1),
// and an item the boss is weak to deals +1. A fight ends at 0 health (won) or 0 lives (lost); the outcome decides the
// pass on its own (applyNodeResult), so a win can never read as a fail and a loss never as a pass.

export const DAMAGE = { clean: 2, glancing: 1, choice: 1, weak: 1, crit: 1, counter: 1 }
export const ATTACK_LIVES = 2          // a missed attack
export const MISS_LIVES = 1
export const COMBO_EVERY = 3           // every Nth clean strike in a row is a critical
export const MAX_ATTACKS = 5           // attacks one fight can throw (a missed attack never spawns another)
export const ATTACK_GAP = 3            // an attack comes this many questions after the miss that caused it
export const RAGE_AT = 0.5             // the boss enrages at half health: no more safe strikes
export const WEAK_TO_MAX = 2

export const newFight = () => ({ damage: 0, livesLost: 0, combo: 0, crits: 0, attacks: 0, blocked: 0, answers: 0, clean: 0, glancing: 0, safe: 0, misses: 0, shieldUsed: false, last: null, n: 0,
  chain: 0, triples: 0, bounces: 0, cuts: 0, unredeemed: [], risen: false, judged: 0, judgedRight: 0, smites: 0,
  surge: false, surfaced: 0, kindled: 0, rewound: [], pacts: 0, bolts: 0, reflects: 0, gorged: 0, snaps: 0, lastBreaths: 0,
  rights: 0, stings: 0, perfects: 0, crumbles: 0, crescendos: 0, harvests: 0, slumbers: 0 })

// RAID BOSS ABILITIES (docs/raid-bosses-plan.md). Each changes how the FIGHT plays, never how a question is asked:
// no timers, nothing hidden, a right answer is never marked wrong, and each twist rewards what builds memory.
//   regrowth     (Hydra)   a missed card grows back as a new head sooner (ABILITY.regrowthGap questions later), and
//                          cutting it (answering the returning card right) deals ABILITY.regrowthCut.
//   plating      (Titan)   in phase 1 a right CHOICE bounces off the armor (no damage); typed answers smash through.
//   phylactery   (Lich)    the blow that would end it while a missed card is still unredeemed leaves it at 1 health
//                          instead: it RISES once, and falls only when every missed card is answered right (the
//                          last stand; a miss there costs one life and the card comes back).
//   heads        (Chimera) every ABILITY.tripleEvery-th right answer in a row cuts all three heads: triple damage
//                          (it replaces the critical, never stacks with it).
//   singularity  (Void)    in phase 3 right answers deal double, and a miss costs ABILITY.singularityLives.
//   judgment     (Seraph)  every ABILITY.judgmentEvery answers are weighed together: all right = a smite of
//                          ABILITY.judgmentSmite extra damage on the last of them. Nothing is ever taken away.
//   maelstrom    (Leviathan) after a miss, the next right answer breaks the surface: +ABILITY.maelstromBonus damage.
//   kindling     (Inferno) from the ABILITY.kindlingFrom-th right answer in a row, every right answer burns for
//                          +ABILITY.kindlingBonus (a miss puts the fire out).
//   rewind       (Chronos) the first miss in each phase is rewound: it costs no life (it still counts as a miss).
//   bloodpact    (Vampire) every ABILITY.bloodpactEvery-th right answer in a row wins back one lost life.
//   tempest      (Tempest) every ABILITY.tempestEvery-th answer is a lightning strike: right, it deals
//                          ABILITY.tempestFactor times the damage.
//   reflection   (Kaleido) a glancing typed answer (the tested thing right, a small slip) reflects for full clean
//                          damage (its slip still comes back as an attack).
//   devour       (Glutton) a miss lets it gorge: it heals ABILITY.devourHeal (never below this attempt's start); a
//                          clean typed answer chokes it for +ABILITY.devourChoke.
//   marionette   (Puppeteer) blocking an attack snaps a string for ABILITY.marionetteCounter damage, and a missed
//                          attack costs only ABILITY.marionetteLives life.
//   lastbreath   (Berserker) on your last life every right answer deals ABILITY.lastbreathFactor times the damage.
//   swarm        (Hive Empress) every ABILITY.swarmEvery-th right answer (in a row or not) stings for +ABILITY.swarmSting.
//   petrify      (Gorgon) every ABILITY.petrifyEvery-th clean typed answer shatters stone for +ABILITY.petrifyShatter.
//   crescendo    (Banshee) right answers deal +1 in phase 2 and +2 in phase 3 (phase - 1).
//   harvest      (Reaper) every life already lost makes it careless: right answers deal +1 per lost life, at most
//                          +ABILITY.harvestMax.
//   slumber      (Dreamer) while no life is lost yet, every right answer deals +ABILITY.slumberBonus (don't wake it).
export const ABILITY = { regrowthGap: 2, regrowthCut: 3, tripleEvery: 3, tripleFactor: 3, singularityFactor: 2, singularityLives: 2, judgmentEvery: 5, judgmentSmite: 5,
  maelstromBonus: 3, kindlingFrom: 4, kindlingBonus: 1, bloodpactEvery: 5, tempestEvery: 4, tempestFactor: 2, devourHeal: 1, devourChoke: 1,
  marionetteCounter: 3, marionetteLives: 1, lastbreathFactor: 3, swarmEvery: 5, swarmSting: 3, petrifyEvery: 3, petrifyShatter: 3,
  harvestMax: 2, slumberBonus: 1 }
export const ABILITIES = ['regrowth', 'plating', 'phylactery', 'heads', 'singularity', 'judgment',
  'maelstrom', 'kindling', 'rewind', 'bloodpact', 'tempest', 'reflection', 'devour', 'marionette', 'lastbreath',
  'swarm', 'petrify', 'crescendo', 'harvest', 'slumber']

// One answer. hit = { verdict: 'clean'|'glancing'|'miss', mode: 'typed'|'choice', weak?: bool, attack?: bool,
// lastStand?: bool (the Lich's returning cards), key?: the card it asked (for the Lich's unredeemed misses) }.
// `shield`: the learner holds a shield (it absorbs the first life a fight would take, once).
// `ability`: a raid boss's ability (ABILITIES), `phase`: the fight's phase BEFORE this answer, `need`: its health
// (the Lich needs both to rise at the right moment), `lives`: the fight's lives (the Berserker's last breath).
export function strike(state, hit, { shield = false, ability = '', phase = 1, need = Infinity, lives: maxLives = Infinity } = {}) {
  const s = { ...state, n: state.n + 1, unredeemed: [...(state.unredeemed || [])], chain: state.chain || 0 }
  const right = hit.verdict === 'clean' || hit.verdict === 'glancing'
  const key = hit.key == null ? null : String(hit.key)
  let dmg = 0
  let lives = 0
  let crit = false
  let fx = ''
  let heal = 0
  let gorge = 0
  const lastLife = maxLives - (state.livesLost || 0) === 1
  if (hit.lastStand) {
    // The Lich's last stand: a returning missed card. Right redeems it; a miss costs one life (it comes back).
    if (!right) lives = MISS_LIVES
  } else if (hit.attack) {
    // An attack: a block counters, a miss hurts twice. It never builds or breaks a combo.
    if (right) {
      s.blocked++
      if (ability === 'regrowth') { dmg = ABILITY.regrowthCut; s.cuts++; fx = 'cut' } else if (ability === 'marionette') { dmg = ABILITY.marionetteCounter; s.snaps++; fx = 'snap' } else dmg = DAMAGE.counter
    } else lives = ability === 'marionette' ? ABILITY.marionetteLives : ATTACK_LIVES
  } else {
    s.answers++
    if (!right) {
      lives = MISS_LIVES; s.misses++; s.combo = 0; s.chain = 0
    } else if (hit.mode === 'choice') {
      dmg = DAMAGE.choice; s.safe++; s.combo = 0
    } else if (hit.verdict === 'glancing') {
      dmg = DAMAGE.glancing; s.glancing++; s.combo = 0
      if (ability === 'reflection') { dmg = DAMAGE.clean; s.reflects++; fx = 'reflect' }
    } else {
      dmg = DAMAGE.clean; s.clean++; s.combo++
      if (ability !== 'heads' && s.combo % COMBO_EVERY === 0) { dmg += DAMAGE.crit; crit = true; s.crits++ }
    }
    if (right && hit.weak) dmg += DAMAGE.weak
    if (right) {
      s.chain++
      if (ability === 'plating' && phase === 1 && hit.mode === 'choice') { dmg = 0; s.bounces++; fx = 'bounce' }
      if (ability === 'heads' && s.chain % ABILITY.tripleEvery === 0) { dmg *= ABILITY.tripleFactor; s.triples++; fx = 'triple' }
      if (ability === 'kindling' && s.chain >= ABILITY.kindlingFrom) { dmg += ABILITY.kindlingBonus; s.kindled++; fx = 'kindle' }
      if (ability === 'devour' && hit.mode === 'typed' && hit.verdict === 'clean') { dmg += ABILITY.devourChoke; fx = 'choke' }
      if (ability === 'maelstrom' && s.surge) { dmg += ABILITY.maelstromBonus; s.surfaced++; fx = 'surface' }
      if (ability === 'tempest' && s.answers % ABILITY.tempestEvery === 0) { dmg *= ABILITY.tempestFactor; s.bolts++; fx = 'bolt' }
      if (ability === 'bloodpact' && s.chain % ABILITY.bloodpactEvery === 0 && (state.livesLost || 0) > 0) { heal = 1; s.pacts++; fx = 'pact' }
      s.rights = (s.rights || 0) + 1
      if (ability === 'swarm' && s.rights % ABILITY.swarmEvery === 0) { dmg += ABILITY.swarmSting; s.stings++; fx = 'sting' }
      if (ability === 'petrify' && hit.mode === 'typed' && hit.verdict === 'clean') {
        s.perfects = (s.perfects || 0) + 1
        if (s.perfects % ABILITY.petrifyEvery === 0) { dmg += ABILITY.petrifyShatter; s.crumbles++; fx = 'crumble' }
      }
      if (ability === 'crescendo' && phase > 1) { dmg += Math.min(2, phase - 1); s.crescendos++; fx = 'crescendo' }
      if (ability === 'harvest' && (state.livesLost || 0) > 0) { dmg += Math.min(ABILITY.harvestMax, state.livesLost); s.harvests++; fx = 'harvest' }
      if (ability === 'slumber' && !(state.livesLost > 0)) { dmg += ABILITY.slumberBonus; s.slumbers++; fx = 'slumber' }
    }
    if (ability === 'maelstrom') s.surge = !right
    if (ability === 'devour' && !right) { gorge = Math.min(ABILITY.devourHeal, s.damage); if (gorge > 0) { s.gorged++; fx = 'gorge' } }
    if (ability === 'judgment') {
      // The Seraph weighs every ABILITY.judgmentEvery answers (attacks and last stands are not weighed).
      s.judged = (s.judged || 0) + 1
      if (right) s.judgedRight = (s.judgedRight || 0) + 1
      if (s.judged % ABILITY.judgmentEvery === 0) {
        if (s.judgedRight === ABILITY.judgmentEvery) { dmg += ABILITY.judgmentSmite; s.smites = (s.smites || 0) + 1; fx = 'smite' }
        s.judgedRight = 0
      }
    }
  }
  if (ability === 'singularity' && phase >= 3) {
    if (dmg > 0) { dmg *= ABILITY.singularityFactor; fx = fx || 'singularity' }
    if (lives > 0) lives = Math.max(lives, ABILITY.singularityLives)
  }
  if (ability === 'lastbreath' && lastLife && dmg > 0) { dmg *= ABILITY.lastbreathFactor; s.lastBreaths++; fx = 'lastbreath' }
  if (ability === 'rewind' && lives > 0 && !s.rewound.includes(phase)) { lives = 0; s.rewound = [...s.rewound, phase]; fx = 'rewind' }
  // The Lich's misses stay unredeemed until that card is answered right again.
  if (key != null) {
    if (!right && !s.unredeemed.includes(key)) s.unredeemed.push(key)
    if (right && (hit.attack || hit.lastStand) && s.unredeemed.includes(key)) s.unredeemed = s.unredeemed.filter((k) => k !== key)
  }
  if (ability === 'phylactery') {
    if (s.risen) {
      // Risen at 1 health: only redeeming the last missed card ends it.
      dmg = s.unredeemed.length === 0 && right && (hit.attack || hit.lastStand) ? Math.max(1, need - s.damage) : 0
      if (dmg > 0) fx = 'shatter'
    } else if (s.damage + dmg >= need && s.unredeemed.length > 0) {
      dmg = Math.max(0, need - 1 - s.damage)
      s.risen = true
      fx = 'rise'
    }
  }
  let shielded = false
  if (lives > 0 && shield && !s.shieldUsed) { lives--; s.shieldUsed = true; shielded = true }
  s.damage += dmg - gorge
  s.livesLost = Math.max(0, s.livesLost + lives - heal)
  const kind = dmg > 0 ? 'hit' : lives > 0 ? 'miss' : 'block'
  s.last = { kind, damage: dmg, lives, crit, shielded, attack: !!hit.attack, fx, rise: fx === 'rise', n: s.n, healed: heal, gorged: gorge }
  return s
}

// 'won' | 'lost' | '' for health `need` and `lives`.
export const fightOutcome = (state, { need, lives }) => (state.damage >= need ? 'won' : state.livesLost >= lives ? 'lost' : '')
export const healthLeft = (state, need) => Math.max(0, need - state.damage)
export const livesLeft = (state, lives) => Math.max(0, lives - state.livesLost)

// Phase of a fight from the health left: a boss has 2 (rage at RAGE_AT), a raid boss 3 (at two thirds, one third).
export function phaseOf(hpLeft, need, phases = 2) {
  if (need <= 0) return 1
  const share = hpLeft / need
  if (phases >= 3) return share <= 1 / 3 ? 3 : share <= 2 / 3 ? 2 : 1
  return share <= RAGE_AT ? 2 : 1
}

// Where an attack goes: `gap` (ATTACK_GAP) questions after `idx` (or the end), never beyond the list.
export const attackSlot = (idx, total, gap = ATTACK_GAP) => Math.min(total, idx + 1 + gap)
// The gap for a raid boss's ability (the Hydra regrows faster).
export const attackGapFor = (ability) => (ability === 'regrowth' ? ABILITY.regrowthGap : ATTACK_GAP)
export const canAttack = (state) => state.attacks < MAX_ATTACKS

// The items a boss is weak to: the area's rule items first (the core of an area), then its first items. Stable.
export function weakTo(area, max = WEAK_TO_MAX) {
  const items = area?.items || []
  const rules = items.filter((it) => it.kind === 'rule')
  const rest = items.filter((it) => it.kind !== 'rule')
  return [...rules, ...rest].slice(0, max).map((it) => it.id)
}

// How much effort the answers show, for XP: clean power strikes most, safe choices least. 0.5 .. 1.3.
export const EFFORT = { clean: 1.3, glancing: 1, typed: 1.1, choice: 0.8, miss: 0, min: 0.5, max: 1.3 }
export function effortOf({ clean = 0, glancing = 0, typed = 0, choice = 0, misses = 0 } = {}) {
  const n = clean + glancing + typed + choice + misses
  if (!n) return 1
  const e = (clean * EFFORT.clean + glancing * EFFORT.glancing + typed * EFFORT.typed + choice * EFFORT.choice) / n
  return Math.round(Math.max(EFFORT.min, Math.min(EFFORT.max, e)) * 100) / 100
}

// A raid card's Anki rating from its FIRST answer: a clean or safe right answer is Good (a choice is recognition,
// never above Good; one question is never Easy), a glancing one Hard, a miss Again.
export const RAID_EASE = { again: 1, hard: 2, good: 3 }
export function raidRating(hit) {
  if (!hit || hit.verdict === 'miss') return { ease: RAID_EASE.again, rating: 'again' }
  if (hit.verdict === 'glancing') return { ease: RAID_EASE.hard, rating: 'hard' }
  return { ease: RAID_EASE.good, rating: 'good' }
}
